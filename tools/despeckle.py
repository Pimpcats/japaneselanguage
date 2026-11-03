#!/usr/bin/env python3
"""Remove sheet-cut leftovers from cut-out art.

The story art is generated as green-screen SHEETS and cut into single objects
with tools/cut_sheet.py. When a neighbouring cell's ink pokes into a cell (a
stray fist, a bit of smoke, half a speech tail), it survives the cut and shows
up floating in the scene — the learner sees a disembodied blob.

This finds the connected islands of ink in a cut-out and keeps only the ones
that belong to the subject: the largest island, plus anything close enough to
it to be part of the same drawing (a dotted line, an eyebrow, a shoe outline
that the linework left detached). Everything else is erased to the background.

    python3 tools/despeckle.py --check assets/story/people/*.png   # report only
    python3 tools/despeckle.py assets/story/people/kai-adult-walk.png

Defaults are deliberately conservative: an island is only dropped when it is
both small (<4% of the subject's area) and clearly detached (>2% of the image
away from the subject's silhouette).
"""
import argparse
import sys
from collections import deque

import numpy as np
from PIL import Image

INK_MAX = 242          # a pixel is "ink" when any channel is darker than this
SMALL_FRAC = 0.04      # islands smaller than this share of the subject may go
GAP_FRAC = 0.02        # ...if they sit further than this (of the diagonal) away


def islands(mask):
    """Label 8-connected islands. Returns (labels, sizes) with 0 = background."""
    h, w = mask.shape
    labels = np.zeros((h, w), np.int32)
    sizes = [0]
    nxt = 1
    for y0 in range(h):
        row = mask[y0]
        for x0 in range(w):
            if not row[x0] or labels[y0, x0]:
                continue
            q = deque([(y0, x0)])
            labels[y0, x0] = nxt
            n = 0
            while q:
                y, x = q.popleft()
                n += 1
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not labels[ny, nx]:
                            labels[ny, nx] = nxt
                            q.append((ny, nx))
            sizes.append(n)
            nxt += 1
    return labels, sizes


def ink_mask(im):
    """True where the drawing is, for both transparent and white-backed art."""
    a = np.asarray(im.convert("RGBA"))
    alpha = a[:, :, 3]
    dark = a[:, :, :3].min(axis=2) < INK_MAX
    return (alpha > 24) & dark if (alpha < 250).any() else dark


def grow(mask, k):
    """Binary dilation by k steps (8-connected) — pure numpy, no scipy."""
    out = mask
    for _ in range(k):
        g = out
        g = g | np.roll(g, 1, 0) | np.roll(g, -1, 0)
        g = g | np.roll(g, 1, 1) | np.roll(g, -1, 1)
        out = g
    return out


def clean(path, check_only=False, small=SMALL_FRAC, gap=GAP_FRAC):
    im = Image.open(path)
    mask = ink_mask(im)
    if not mask.any():
        return None
    # Work at reduced size: islands are found on a downscale (fast, and it also
    # bridges 1px linework gaps), then mapped back to full resolution.
    h, w = mask.shape
    step = max(1, int(max(h, w) / 320))
    small_mask = mask[::step, ::step]
    labels, sizes = islands(small_mask)
    if len(sizes) <= 2:
        return None                     # one island: nothing detached
    main = int(np.argmax(sizes))
    diag = (small_mask.shape[0] ** 2 + small_mask.shape[1] ** 2) ** 0.5
    # "part of the drawing" = within gap of the subject's INK (not its bounding
    # box — a stray in the corner sits inside the box of a full-height figure).
    near = grow(labels == main, max(1, int(diag * gap)))
    # ...and "inside the drawing" = within the subject's silhouette, measured
    # row by row. This is what keeps a detached wrinkle line on a leg while
    # still dropping a fist floating above the head: the fist's rows hold no
    # subject ink at all. (Bounding boxes can't tell those two apart.)
    rows = np.nonzero(labels == main)
    span_l = np.full(small_mask.shape[0], np.inf)
    span_r = np.full(small_mask.shape[0], -np.inf)
    for y, x in zip(*rows):
        if x < span_l[y]:
            span_l[y] = x
        if x > span_r[y]:
            span_r[y] = x
    pad = max(2, int(diag * 0.01))
    drop = []
    for lab in range(1, len(sizes)):
        if lab == main:
            continue
        if sizes[lab] > sizes[main] * small:
            continue                    # big enough to be a real second subject
        if (near & (labels == lab)).any():
            continue                    # touching the subject's ink — part of it
        iy, ix = np.nonzero(labels == lab)
        inside = (ix >= span_l[iy] - pad) & (ix <= span_r[iy] + pad)
        if inside.mean() < 0.5:         # mostly out in the margin → cut leftover
            drop.append((lab, sizes[lab]))
    if not drop:
        return None
    if check_only:
        return {"path": path, "islands": len(sizes) - 1, "dropped": len(drop),
                "px": sum(d[1] for d in drop) * step * step}
    # erase the strays at full resolution
    keep_small = np.isin(labels, [d[0] for d in drop])
    kill = np.zeros_like(mask)
    for y, x in zip(*np.nonzero(keep_small)):
        kill[y * step:(y + 1) * step, x * step:(x + 1) * step] = True
    kill &= mask
    rgba = np.asarray(im.convert("RGBA")).copy()
    transparent = (rgba[:, :, 3] < 250).any()
    rgba[kill] = [255, 255, 255, 0] if transparent else [255, 255, 255, 255]
    out = Image.fromarray(rgba, "RGBA")
    # keep the same shape as the cutter's output: 256-colour PNG (these ship in
    # the service-worker precache, so bytes matter)
    out.quantize(colors=256, method=Image.FASTOCTREE).save(path, optimize=True)
    return {"path": path, "islands": len(sizes) - 1, "dropped": len(drop),
            "px": int(kill.sum())}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--check", action="store_true", help="report without editing")
    args = ap.parse_args()
    hits = 0
    for path in args.files:
        try:
            r = clean(path, args.check)
        except Exception as e:                        # noqa: BLE001 — report and move on
            print("ERR ", path, e)
            continue
        if r:
            hits += 1
            print(("would clean " if args.check else "cleaned "), r["path"],
                  "— dropped", r["dropped"], "stray island(s),", r["px"], "px")
    print(f"{hits} file(s) with strays out of {len(args.files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
