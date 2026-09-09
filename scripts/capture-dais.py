"""Composite square sprites from the atlas onto the raster harness image.
Usage: python3 scripts/capture-dais.py <raw> <out.png>"""
import json, sys
from PIL import Image
raw, out = sys.argv[1], sys.argv[2]
W, H = 21 * 16, 19 * 16
im = Image.frombytes("RGB", (W, H), open(raw, "rb").read()).convert("RGBA")
atlas = Image.open("public/packs/atlas.png"); frames = json.load(open("public/packs/atlas.json"))["frames"]
def paste(name, cx, cy):
    f = frames[name]["frame"]; sp = atlas.crop((f["x"], f["y"], f["x"] + f["w"], f["y"] + f["h"]))
    im.alpha_composite(sp, (cx * 16 + 8 - f["w"] // 2, cy * 16 + 16 - f["h"]))
# dais spans cells 7..13 x 6..12; centre (10,9)
paste("monument-cross", 10, 9)
for name, cx, cy in [("planter", 7, 6), ("planter", 13, 6), ("post", 7, 12), ("post", 13, 12), ("fountain", 4, 3), ("statue", 16, 3), ("bench", 4, 15), ("stele", 16, 15)]:
    paste(name, cx, cy)
paste("monument-fountain", 5, 9); paste("monument-statue", 16, 9); paste("monument-obelisk", 16, 12)
im.crop((32, 16, 320, 288)).resize((288 * 3, 272 * 3), Image.NEAREST).save(out)
