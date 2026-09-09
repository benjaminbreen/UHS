"""Downscale splash banners to a coarse pixel grid and a small palette.

Usage: python3 scripts/art/pixelize_banners.py [--width 560] [--colors 72] scripts/art/banner-sources/banner*.png
Writes to public/banners/<name>.png; the classical banner is left as is.
"""
import argparse
from pathlib import Path
from PIL import Image

def pixelize(im, width, colors):
    im = im.convert("RGBA")
    alpha = im.split()[3]
    h = round(im.height * width / im.width)
    small = im.convert("RGB").resize((width, h), Image.BOX)
    q = small.quantize(colors=colors, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).convert("RGB")
    q.putalpha(alpha.resize((width, h), Image.BOX).point(lambda v: 255 if v > 128 else 0))
    # Trim the transparent sky so the banner anchors to the frame bottom.
    return q.crop(q.getbbox())

ap = argparse.ArgumentParser()
ap.add_argument("files", nargs="+")
ap.add_argument("--width", type=int, default=560)
ap.add_argument("--colors", type=int, default=72)
args = ap.parse_args()
out = Path("public/banners")
for f in args.files:
    src = Path(f)
    if src.stem == "bannerclassical":
        continue
    im = pixelize(Image.open(src), args.width, args.colors)
    im.save(out / src.name)
    print(src.name, im.size)
