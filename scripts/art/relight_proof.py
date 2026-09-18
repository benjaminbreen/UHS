"""Before and after for the shared building light, on a handful of buildings.

    python3 -m scripts.art.relight_proof            # the default ten
    python3 -m scripts.art.relight_proof house-roman-0 modern-office-0

Renders each building twice, unlit and lit, and writes a two-row grid per
pair so the pass can be judged on the art rather than on the metric.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
import art.buildings as B                                        # noqa: E402
from art.quality.metrics import measure                          # noqa: E402

# A spread across the families that measure flat, not ten of one kind: if the
# rule only suits a tiled pitched roof it will show up on the flat ones here.
# Pitched, tiled roofs across the materials the roof palette covers. Only the
# base compiler carries the course-lit roof so far; the four subclasses that
# override render() are still on the coin toss.
# Flat roofs and big plain walls: house-mud is the flat-roof compiler, the
# others carry the largest uninterrupted wall faces in the set.
DEFAULT = ['house-mud-0', 'house-mud-2', 'house-roman-0',
           'house-roman-0-urban-wide', 'house-thatch']

SCALE, PAD, LABEL = 2, 14, 30


def render(keys):
    """Both passes, from the real compiler, so this is the art that would ship.

    The four subclasses call course_tone directly rather than behind the flag,
    so the unlit pass puts the old coin toss back in its place instead: that is
    the only way to see a before for a roof the base class does not draw.
    """
    import random as _random
    import art.roof_light as rl
    lit_tone = rl.course_tone
    seed = _random.Random(7)

    def coin_toss(pal, row, rows, col=0, lit=3, dark=0):
        return pal[2] if seed.random() < 0.8 else pal[1]

    out = {}
    for lit in (False, True):
        B.RELIGHT = lit
        rl.course_tone = lit_tone if lit else coin_toss
        for module in ('religious', 'period', 'urban'):
            __import__(f'art.{module}')
            sys.modules[f'art.{module}'].course_tone = rl.course_tone
        sprites = {}
        B.build_buildings(ROOT, sprites)
        out[lit] = {k: sprites[k] for k in keys if k in sprites}
    rl.course_tone = lit_tone
    for module in ('religious', 'period', 'urban'):
        sys.modules[f'art.{module}'].course_tone = lit_tone
    B.RELIGHT = True
    missing = [k for k in keys if k not in out[False]]
    if missing:
        print(f'not built: {missing}')
    return out


def grid(keys=None, name='relight'):
    keys = [k for k in (keys or DEFAULT)]
    both = render(keys)
    keys = [k for k in keys if k in both[False]]
    cw = max(both[False][k].width for k in keys) + 8
    ch = max(both[False][k].height for k in keys) + 6
    columns = 5
    rows = -(-len(keys) // columns)
    sheet = Image.new('RGBA',
                      (columns * (cw * SCALE + PAD) + PAD,
                       rows * ((ch * SCALE + LABEL) * 2 + PAD) + PAD + 24),
                      '#20272a')
    d = ImageDraw.Draw(sheet)
    d.text((PAD, 8), 'BUILDING LIGHT / top row unlit / bottom row lit / '
                     f'{SCALE}x nearest neighbour', fill='#e7d5ad')
    for i, key in enumerate(keys):
        col, row = i % columns, i // columns
        x = PAD + col * (cw * SCALE + PAD)
        y = 24 + PAD + row * ((ch * SCALE + LABEL) * 2)
        for j, lit in enumerate((False, True)):
            sprite = both[lit][key]
            cell = Image.new('RGBA', (cw, ch), '#8a9a5b')
            cell.alpha_composite(sprite, ((cw - sprite.width) // 2,
                                          ch - sprite.height - 2))
            cy = y + j * (ch * SCALE + LABEL)
            sheet.alpha_composite(
                cell.resize((cw * SCALE, ch * SCALE), Image.NEAREST), (x, cy))
            box = sprite.getbbox()
            roof = sprite.crop((box[0], box[1], box[2],
                                box[1] + max(6, (box[3] - box[1]) // 3)))
            m, r = measure(sprite), measure(roof)
            d.text((x, cy + ch * SCALE + 4),
                   f"{'lit  ' if lit else 'unlit'} roof gradY {r['gradY']:+.2f} "
                   f"tones {m['tones']}",
                   fill='#cbd0bb' if lit else '#8d9690')
        d.text((x, y - 10), key[:38], fill='#e7d5ad')
    path = ROOT / f'artifacts/{name}.png'
    path.parent.mkdir(exist_ok=True)
    sheet.save(path)
    return path, both


if __name__ == '__main__':
    path, _ = grid(sys.argv[1:] or None)
    print(path)
