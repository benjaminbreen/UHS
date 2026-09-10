"""Contact sheet of every crop and farm-prop frame at 3x, with anchor marks."""
from pathlib import Path
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from art.fields import build_fields

ROOT = Path(__file__).resolve().parents[2]
frames = build_fields()
names = sorted(frames, key=lambda n: (n.startswith('farm-'), n.split('-')[1] if n.startswith('crop-') else n, n))

columns, scale = 12, 3
cell_w, cell_h = 120, 180
rows = (len(names) + columns - 1) // columns
sheet = Image.new('RGBA', (columns * cell_w, rows * cell_h + 40), '#5b6e3c')
d = ImageDraw.Draw(sheet)
d.text((12, 12), f'FIELDS · {len(names)} FRAMES · ×{scale} · green bar = anchor row, tick = anchor x', fill='#f2e8c8')

for i, name in enumerate(names):
    im = frames[name]
    big = im.resize((im.width * scale, im.height * scale), Image.Resampling.NEAREST)
    x = (i % columns) * cell_w
    y = (i // columns) * cell_h + 40
    ax, ay = im.info['anchor']
    ox = x + (cell_w - big.width) // 2
    oy = y + cell_h - 34 - big.height
    d.rectangle((ox - 1, oy - 1, ox + big.width, oy + big.height), outline='#4a5a30')
    sheet.alpha_composite(big, (ox, oy))
    ly = oy + round(ay * scale)
    d.line((x + 4, ly, x + cell_w - 4, ly), fill='#9be05a')
    lx = ox + round(ax * scale)
    d.line((lx, ly - 3, lx, ly + 3), fill='#ffffff')
    label = name.replace('crop-', '').replace('farm-', 'farm ')
    d.text((x + 6, y + cell_h - 28), label, fill='#f2e8c8')
    d.text((x + 6, y + cell_h - 16), f'{im.width}×{im.height}', fill='#c9d3a0')

out = ROOT / 'artifacts/fields/crops.png'
out.parent.mkdir(parents=True, exist_ok=True)
sheet.save(out)
print(f'Wrote {out} ({len(names)} frames).')
