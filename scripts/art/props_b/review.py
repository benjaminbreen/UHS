"""Contact sheet for the B studies: every prop beside a character, at N times.

    python3 -m scripts.art.props_b.review well trough        # named families
    python3 -m scripts.art.props_b.review                    # all of them

Writes artifacts/prop-b-review.png. Look at this, not at the source, before
calling a prop finished: scale against the figure is most of the judgement.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from art.props_b import DRAW_B, FALLEN, TOPPLING                   # noqa: E402
from art.props_b.fallen import leaning                            # noqa: E402
from art.reference import current_adult                           # noqa: E402

SCALE, PAD = 4, 12


def person():
    return current_adult()


def sheet(keys=None, variants=1, out=None, states=False):
    keys = keys or sorted(DRAW_B)
    figure = person()
    cells = [(k, v, DRAW_B[k](v)) for k in keys for v in range(variants)]
    if states:
        cells = [(k + suffix, v, draw(v)) for k in keys for v in range(variants)
                 for suffix, draw in [('', DRAW_B[k]),
                    *([('-lean', lambda v, k=k: leaning(DRAW_B[k](v), 1))] if k in TOPPLING else []),
                    *([('-fallen', FALLEN[k])] if k in FALLEN else [])]]
    cropped = []
    for k, v, sprite in cells:
        box = sprite.getbbox()
        cut = sprite.crop(box)
        ax, ay = sprite.info.get('anchor', [sprite.width // 2, sprite.height])
        cut.info['anchor'] = [ax - box[0], ay - box[1]]
        cropped.append((k, v, cut))
    cells = cropped
    cw = max(s.width for _, _, s in cells) + figure.width + 10
    floor = max(max(s.info['anchor'][1] for _, _, s in cells), figure.height) + 2
    ch = floor + max(0, max(s.height - s.info['anchor'][1] for _, _, s in cells)) + 4
    columns = min(3 if states else 6, len(cells))
    rows = -(-len(cells) // columns)
    sheet = Image.new('RGBA', (columns * (cw * SCALE + PAD) + PAD,
                               rows * (ch * SCALE + 26) + PAD), '#20272a')
    draw = ImageDraw.Draw(sheet)
    for i, (key, variant, sprite) in enumerate(cells):
        x = PAD + (i % columns) * (cw * SCALE + PAD)
        y = PAD + (i // columns) * (ch * SCALE + 26)
        cell = Image.new('RGBA', (cw, ch), '#d6c8a2')
        cell.alpha_composite(figure, (cw - figure.width - 2, floor - figure.height))
        cell.alpha_composite(sprite, (2, floor - sprite.info['anchor'][1]))
        sheet.alpha_composite(cell.resize((cw * SCALE, ch * SCALE), Image.NEAREST), (x, y))
        draw.text((x, y + ch * SCALE + 6),
                  f'{key}-{variant}  {sprite.width}x{sprite.height}', fill='#cbd0bb')
    out = out or ROOT / 'artifacts/prop-b-review.png'
    out.parent.mkdir(exist_ok=True)
    sheet.save(out)
    return out


if __name__ == '__main__':
    print(sheet([s for s in sys.argv[1:] if s != '--states'] or None, states='--states' in sys.argv))
