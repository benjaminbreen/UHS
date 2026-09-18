"""Authored ramps against hue-shifted ones, on the art itself.

    python3 -m scripts.art.hue_proof                 # a spread of materials
    python3 -m scripts.art.hue_proof pithos well 18  # families, then degrees

Top row is the ramp as authored, bottom the shift. Value is untouched by
design, so what moves is only the hue at the two ends of each ramp; the figure
under each cell is the audit's hue shift, in degrees between shadow and light.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
import art.props_b.core as core                                  # noqa: E402
from art.props_b import DRAW_B                                   # noqa: E402
from art.quality.metrics import measure                          # noqa: E402

# Wood, stone, ceramic, metal, straw and glaze: if the shift only suits timber
# it will show up on the pot and the anvil here.
DEFAULT = ['pithos', 'cooking-pot', 'water-butt', 'anvil', 'beehive',
           'well', 'strapped-chest', 'loom', 'milk-churn', 'flask']

SCALE, PAD, LABEL = 4, 12, 34


def sheet(keys=None, degrees=None):
    strength = None if degrees is None else degrees / 360
    keys = [k for k in (keys or DEFAULT) if k in DRAW_B]
    both = {}
    for on in (False, True):
        core.set_hue_shift(on, strength)
        both[on] = {k: DRAW_B[k](0) for k in keys}
    core.set_hue_shift(True)
    cw = max(s.width for s in both[False].values()) + 6
    ch = max(s.height for s in both[False].values()) + 4
    out = Image.new('RGBA', (len(keys) * (cw * SCALE + PAD) + PAD,
                             (ch * SCALE + LABEL) * 2 + 34), '#20272a')
    d = ImageDraw.Draw(out)
    d.text((PAD, 10), 'RAMP HUE / top row as authored / bottom row shifted: '
                      'shadows toward blue, lights toward warm / value unchanged',
           fill='#e7d5ad')
    for i, key in enumerate(keys):
        x = PAD + i * (cw * SCALE + PAD)
        for j, on in enumerate((False, True)):
            sprite = both[on][key]
            cell = Image.new('RGBA', (cw, ch), '#d6c8a2')
            cell.alpha_composite(sprite, ((cw - sprite.width) // 2,
                                          ch - sprite.height - 2))
            y = 30 + j * (ch * SCALE + LABEL)
            out.alpha_composite(
                cell.resize((cw * SCALE, ch * SCALE), Image.NEAREST), (x, y))
            m = measure(sprite)
            d.text((x, y + ch * SCALE + 4),
                   key if not j else 'hue shifted', fill='#e7d5ad')
            d.text((x, y + ch * SCALE + 18),
                   f"hue {m.get('hueShift', 0):+.0f}deg  chroma {m['chroma']:.2f}"
                   f"  tones {m['tones']}", fill='#cbd0bb')
    path = ROOT / 'artifacts/ramp-hue.png'
    path.parent.mkdir(exist_ok=True)
    out.save(path)
    return path


if __name__ == '__main__':
    args = sys.argv[1:]
    degrees = float(args.pop()) if args and args[-1].replace('.', '').isdigit() else None
    print(sheet(args or None, degrees))
