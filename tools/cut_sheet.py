#!/usr/bin/env python3
"""Cut a green-screen art sheet from ChatGPT into keyed transparent sprites.

Usage:
  python3 tools/cut_sheet.py <sheet.webp> <cols>x<rows> <name1,name2,...> <outdir>

Names map row-major; '-' skips a cell. A name like "clockface@row3" is not
supported — for spanning cells, crop manually and call key_green directly.
Output: trimmed, padded, max-512px, 256-color PNGs named <name>.png.
"""
import sys
from PIL import Image

PAD = 14

def key_green(cell):
    """Chroma-key a green background to alpha, with edge feather + de-spill."""
    cell = cell.convert("RGB")
    w, h = cell.size
    px = cell.load()
    out = Image.new("RGBA", (w, h))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            greenness = g - max(r, b)
            if greenness >= 90:
                op[x, y] = (0, 0, 0, 0)
            else:
                a = 255 if greenness <= 25 else round(255 * (90 - greenness) / 65)
                op[x, y] = (r, min(g, max(r, b) + 10), b, a)
    return out

def finish(keyed, out_path):
    """Trim, pad, cap at 512px, quantize, save."""
    bbox = keyed.getbbox()
    if not bbox:
        print("EMPTY:", out_path)
        return
    keyed = keyed.crop(bbox)
    w, h = keyed.size
    s = min(1.0, 512 / max(w, h))
    if s < 1.0:
        keyed = keyed.resize((round(w * s), round(h * s)), Image.LANCZOS)
    padded = Image.new("RGBA", (keyed.width + 2 * PAD, keyed.height + 2 * PAD), (0, 0, 0, 0))
    padded.paste(keyed, (PAD, PAD))
    padded.quantize(colors=256, method=Image.FASTOCTREE).save(out_path, optimize=True)
    print(out_path, padded.size)

def cut(sheet, grid, names, outdir):
    cols, rows = (int(v) for v in grid.split("x"))
    im = Image.open(sheet)
    cw, ch = im.width // cols, im.height // rows
    for i, name in enumerate(names.split(",")):
        if name == "-":
            continue
        c, r = i % cols, i // cols
        finish(key_green(im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))),
               f"{outdir}/{name}.png")

if __name__ == "__main__":
    cut(*sys.argv[1:5])
