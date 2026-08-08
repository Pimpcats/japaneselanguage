#!/usr/bin/env python3
"""Trim empty margins from cut-out story art.

The scene engine sizes an object by setting the height of its box and letting
`object-fit: contain` place the picture inside. That only works when the
picture fills its canvas: art with 200px of empty space above and below draws
at half the size the engine asked for, floating off the ground line with a gap.
Several sheets came through the cutter untrimmed (house.png used 30% of its
canvas height; tv.png kept a faint chroma-key halo out to the edges).

This crops each file to its visible drawing plus a small pad, ignoring the
low-alpha halo that the green-screen key leaves behind.

    python3 tools/trim_art.py --check assets/story/*.png
    python3 tools/trim_art.py assets/story/*.png
"""
import argparse
import sys

import numpy as np
from PIL import Image

SOLID = 100        # alpha above this is real drawing, not key halo
WASTE = 0.88       # only trim when the drawing fills less than this
PAD = 0.03         # breathing room kept around the drawing


def trim(path, check_only=False):
    im = Image.open(path).convert("RGBA")
    a = np.asarray(im)
    h, w = a.shape[:2]
    solid = a[:, :, 3] > SOLID
    if not solid.any():
        return None
    ys, xs = np.nonzero(solid)
    top, bottom, left, right = ys.min(), ys.max(), xs.min(), xs.max()
    fh = (bottom - top + 1) / h
    fw = (right - left + 1) / w
    if fh > WASTE and fw > WASTE:
        return None
    pad = int(round(max(bottom - top, right - left) * PAD))
    top = max(0, top - pad); left = max(0, left - pad)
    bottom = min(h - 1, bottom + pad); right = min(w - 1, right + pad)
    out_size = (right - left + 1, bottom - top + 1)
    if check_only:
        return {"path": path, "was": (w, h), "now": out_size,
                "fill": (round(fw * 100), round(fh * 100))}
    cropped = im.crop((left, top, right + 1, bottom + 1))
    cropped.quantize(colors=256, method=Image.FASTOCTREE).save(path, optimize=True)
    return {"path": path, "was": (w, h), "now": out_size,
            "fill": (round(fw * 100), round(fh * 100))}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--check", action="store_true", help="report without editing")
    args = ap.parse_args()
    n = 0
    for path in args.files:
        try:
            r = trim(path, args.check)
        except Exception as e:                        # noqa: BLE001
            print("ERR ", path, e)
            continue
        if r:
            n += 1
            print(("would trim " if args.check else "trimmed "), r["path"],
                  f'{r["was"][0]}x{r["was"][1]} → {r["now"][0]}x{r["now"][1]}',
                  f'(drawing filled {r["fill"][0]}%w {r["fill"][1]}%h)')
    print(f"{n} file(s) trimmed out of {len(args.files)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
