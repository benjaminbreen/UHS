"""Make a compact review sheet for the modern infill candidate sprites."""
from pathlib import Path
import json

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
models = json.loads((ROOT / "public/packs/buildings.json").read_text())
atlas_data = json.loads((ROOT / "public/packs/atlas.json").read_text())
atlas = Image.open(ROOT / "public/packs/atlas.png").convert("RGBA")
ids = [
    name
    for name, model in models.items()
    if model.get("candidate") and not name.endswith(("-north", "-east", "-west"))
]

columns, cell_w, cell_h, scale = 6, 220, 244, 2
rows = (len(ids) + columns - 1) // columns
sheet = Image.new("RGBA", (columns * cell_w, rows * cell_h), "#18201f")
d = ImageDraw.Draw(sheet)
d.text((20, 14), "MODERN INFILL CANDIDATES · REVIEW SET · NATIVE PIXEL ART ×2", fill="#e0b44c")

for index, name in enumerate(ids):
    model = models[name]
    frame = atlas_data["frames"][name]["frame"]
    sprite = atlas.crop((frame["x"], frame["y"], frame["x"] + frame["w"], frame["y"] + frame["h"]))
    sprite = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST)
    x = (index % columns) * cell_w
    y = (index // columns) * cell_h + 34
    sheet.alpha_composite(sprite, (x + (cell_w - sprite.width) // 2, y))
    label = model["label"].replace("Candidate · ", "")
    detail = f'{model["footprint"][0]}×{model["footprint"][1]} · {model.get("sign") or "HOME"}'
    label_y = y + max(sprite.height + 6, 190)
    d.text((x + 8, label_y), label, fill="#e5dfce")
    d.text((x + 8, label_y + 17), detail, fill="#a8a293")

out = ROOT / "artifacts/buildings/modern-infill-candidates-sheet.png"
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out)
print(f"Wrote {out} ({len(ids)} candidates).")
