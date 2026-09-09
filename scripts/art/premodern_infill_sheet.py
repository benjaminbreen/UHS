"""Make a review sheet for the pre-modern infill forms (cottage, hut, stall)."""
from pathlib import Path
import json

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
models = json.loads((ROOT / "public/packs/buildings.json").read_text())
atlas_data = json.loads((ROOT / "public/packs/atlas.json").read_text())
atlas = Image.open(ROOT / "public/packs/atlas.png").convert("RGBA")
kit = json.loads((ROOT / "src/content/graphics/urban.json").read_text())
forms = [f for f, shape in kit["forms"].items() if shape.get("infill")]
facings = ["", "-north", "-east", "-west"]
ids = [
    f"{base}-urban-{form}{facing}"
    for base in kit["bases"]
    for form in forms
    for facing in facings
    if f"{base}-urban-{form}{facing}" in models
]

columns, cell_w, cell_h, scale = len(forms) * len(facings), 150, 190, 2
rows = (len(ids) + columns - 1) // columns
sheet = Image.new("RGBA", (columns * cell_w, rows * cell_h + 34), "#18201f")
d = ImageDraw.Draw(sheet)
d.text((20, 14), "PRE-MODERN INFILL FORMS · ALL BASES · NATIVE PIXEL ART ×2", fill="#e0b44c")

for index, name in enumerate(ids):
    model = models[name]
    assert model.get("infill"), name
    frame = atlas_data["frames"][name]["frame"]
    sprite = atlas.crop((frame["x"], frame["y"], frame["x"] + frame["w"], frame["y"] + frame["h"]))
    sprite = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST)
    x = (index % columns) * cell_w
    y = (index // columns) * cell_h + 34
    sheet.alpha_composite(sprite, (x + (cell_w - sprite.width) // 2, y))
    d.text((x + 4, y + cell_h - 16), name.replace("-urban", ""), fill="#e5dfce")

out = ROOT / "artifacts/buildings/premodern-infill.png"
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out)
print(f"Wrote {out} ({len(ids)} frames).")
