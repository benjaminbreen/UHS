"""A building across the day, for reviewing the four-corner tint.

The tint itself ships in src/render/corner-tint.ts; this mirrors its maths so
the effect can be looked at as a picture. The two are kept honest by the
warmth figures printed underneath, which are compared against the same
measurement taken off the live canvas in the building lab.

    python3 -m scripts.art.lighting_proof period-georgian-townhouse
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]

WARM = (1.07, 1.00, 0.90)
COOL = (0.90, 0.96, 1.10)
SKY, GROUND = 1.03, 0.96


def corners(cast, tint, amount):
    base = [(tint >> 16) & 255, (tint >> 8) & 255, tint & 255]
    lean = max(-1.0, min(1.0, -cast[0] / 2.3)) * amount

    def side(sign):
        t = lean * sign
        mix = WARM if t > 0 else COOL
        s = abs(t)
        return [c * (1 + (m - 1) * s) for c, m in zip(base, mix)]

    left, right = side(-1), side(1)
    lift = lambda c, k: [v * k for v in c]
    return (lift(left, SKY), lift(right, SKY),
            lift(left, GROUND), lift(right, GROUND))


def paint(image, cast, tint, amount):
    tl, tr, bl, br = corners(cast, tint, amount)
    out = image.copy()
    px = out.load()
    w, h = out.size
    for y in range(h):
        v = y / (h - 1) if h > 1 else 0
        for x in range(w):
            p = px[x, y]
            if not p[3]:
                continue
            u = x / (w - 1) if w > 1 else 0
            rgb = []
            for k in range(3):
                top = tl[k] * (1 - u) + tr[k] * u
                bot = bl[k] * (1 - u) + br[k] * u
                rgb.append(min(255, max(0, round(p[k] * (top * (1 - v) + bot * v) / 255))))
            px[x, y] = (*rgb, p[3])
    return out


def warmth(image):
    """Red minus blue, left half against right. The number the lab reports."""
    px = image.load()
    w, h = image.size
    sides = [[0, 0, 0], [0, 0, 0]]
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if not p[3]:
                continue
            s = sides[0 if x < w / 2 else 1]
            s[0] += p[0]; s[1] += p[2]; s[2] += 1
    out = [(s[0] - s[1]) / s[2] if s[2] else 0 for s in sides]
    return out[0], out[1]


def strip(key, amount=2.0, scale=3):
    frames = json.loads((ROOT / 'public/packs/buildings.json').read_text())['frames']
    sheet = Image.open(ROOT / 'public/packs/buildings.png').convert('RGBA')
    phases = json.loads((ROOT / 'src/content/graphics/lighting.json').read_text())
    if key not in frames:
        hits = [k for k in frames if key in k][:5]
        raise SystemExit(f'no frame {key}; did you mean {hits}')
    f = frames[key]['frame']
    art = sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))

    cells = [('flat (shipped)', art)]
    cells += [(p['label'], paint(art, p['cast'], int(p['tint'], 16), amount))
              for p in phases]
    cw, ch = art.width + 10, art.height + 6
    out = Image.new('RGBA', (len(cells) * (cw * scale + 8) + 8,
                             ch * scale + 76), '#20272a')
    d = ImageDraw.Draw(out)
    d.text((10, 8), f'{key} / four-corner tint from lighting.json / '
                    f'swing {amount:g}x / {scale}x', fill='#e7d5ad')
    for i, (label, image) in enumerate(cells):
        x = 8 + i * (cw * scale + 8)
        cell = Image.new('RGBA', (cw, ch), '#8a9a5b')
        cell.alpha_composite(image, (5, 3))
        out.alpha_composite(cell.resize((cw * scale, ch * scale), Image.NEAREST),
                            (x, 28))
        left, right = warmth(image)
        d.text((x, 28 + ch * scale + 6), label, fill='#e7d5ad')
        d.text((x, 28 + ch * scale + 20),
               f'warm L{left:5.1f} R{right:5.1f}  R-L {right - left:+5.1f}',
               fill='#cbd0bb')
    path = ROOT / 'artifacts/lighting-phases.png'
    path.parent.mkdir(exist_ok=True)
    out.save(path)
    return path


if __name__ == '__main__':
    print(strip(sys.argv[1] if len(sys.argv) > 1 else 'period-georgian-townhouse',
                float(sys.argv[2]) if len(sys.argv) > 2 else 2.0))
