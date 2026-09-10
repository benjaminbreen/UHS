"""Make a review sheet for the period (18th-19th century) facades, grouped."""
from pathlib import Path
import json

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[2]
models = json.loads((ROOT / "public/packs/buildings.json").read_text())
atlas_data = json.loads((ROOT / "public/packs/atlas.json").read_text())
atlas = Image.open(ROOT / "public/packs/atlas.png").convert("RGBA")
ids = [
    name for name, model in models.items()
    if model.get("period") and not name.endswith(("-north", "-east", "-west"))
]
groups = {}
for name in ids:
    groups.setdefault(models[name]["periodGroup"], []).append(name)

columns, cell_w, cell_h, scale = 6, 250, 470, 2
rows = sum((len(g) + columns - 1) // columns for g in groups.values())
sheet = Image.new("RGBA", (columns * cell_w, rows * cell_h + 40 * (len(groups) + 1)), "#18201f")
d = ImageDraw.Draw(sheet)
d.text((20, 14), "PERIOD FACADES · 18TH AND 19TH CENTURY · NATIVE PIXEL ART ×2", fill="#e0b44c")
y0 = 40
for group, names in groups.items():
    d.text((20, y0 + 10), group.upper(), fill="#e0b44c")
    y0 += 34
    for index, name in enumerate(names):
        model = models[name]
        frame = atlas_data["frames"][name]["frame"]
        sprite = atlas.crop((frame["x"], frame["y"], frame["x"] + frame["w"], frame["y"] + frame["h"]))
        sprite = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST)
        x = (index % columns) * cell_w
        y = y0 + (index // columns) * cell_h
        sheet.alpha_composite(sprite, (x + (cell_w - sprite.width) // 2, y + cell_h - 40 - sprite.height))
        d.text((x + 8, y + cell_h - 34), model["label"], fill="#e5dfce")
        d.text((x + 8, y + cell_h - 18), f'{model["footprint"][0]}×{model["footprint"][1]} · {name.replace("period-", "")}', fill="#a8a293")
    y0 += ((len(names) + columns - 1) // columns) * cell_h + 6

out = ROOT / "artifacts/buildings/period-facades.png"
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out)
print(f"Wrote {out} ({len(ids)} facades).")
