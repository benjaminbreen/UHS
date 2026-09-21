"""Build the seven-family oblique gold-master contact sheet.

Each row shows the retained small source, two medium variants, one large
variant, and the current live-game adult. Output is nearest-neighbour pixels.
"""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.reference import current_adult  # noqa: E402
from art.review_sheet import recipes  # noqa: E402

FAMILIES = [
    ('Medieval thatch', 'house-cottage-thatch-0', 'house-cottage-thatch'),
    ('Medieval timber', 'house-cottage-timber-0', 'house-cottage-timber'),
    ('Early-modern brick', 'house-early-brick-0', 'house-early-brick'),
    ('Early-modern render', 'house-early-stucco-0', 'house-early-stucco'),
    ('Prehistoric round', 'house-round-0', 'house-round'),
    ('Prehistoric mudbrick', 'house-mudbrick-ob-0', 'house-mudbrick-ob'),
    ('Neolithic longhouse', 'house-longhouse-0', 'house-longhouse'),
]


def make(out, zoom=3):
    all_r, painter, source = recipes()
    person = current_adult()
    rows = []
    for title, small, family in FAMILIES:
        names = [small, f'{family}-gold-medium-0',
                 f'{family}-gold-medium-1', f'{family}-gold-large-0']
        cells = []
        for name in names:
            r = all_r[name]
            cells.append((name, painter(r)(r, source['materials'][r['wall']]).render()))
        rows.append((title, cells))

    label_h, title_w, gap = 13, 118, 8
    col_w = [max(row[1][i][1].width for row in rows) + person.width + 10 for i in range(4)]
    row_h = [max(im.height for _, im in cells) + label_h + 8 for _, cells in rows]
    w = title_w + sum(col_w) + gap * 5
    h = 28 + sum(row_h) + gap * (len(rows) + 1)
    sheet = Image.new('RGBA', (w, h), '#182038')
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 7)
        small_font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 6)
    except OSError:
        font = small_font = ImageFont.load_default()
    d.text((8, 7), 'OBLIQUE HOUSE GOLD MASTERS · live renderer-B adult: 15×37 px',
           font=font, fill='#f0d795')
    headings = ['retained small', 'medium · seed A', 'medium · seed B', 'large']
    x = title_w + gap * 2
    for i, heading in enumerate(headings):
        d.text((x + col_w[i] // 2, 18), heading, font=small_font,
               fill='#aebbd0', anchor='ma')
        x += col_w[i] + gap
    y = 28 + gap
    for row_index, (title, cells) in enumerate(rows):
        rh = row_h[row_index]
        d.text((8, y + rh // 2 - 4), title, font=font, fill='#f0d795')
        x = title_w + gap * 2
        for i, (name, sprite) in enumerate(cells):
            cw = col_w[i]
            ground = y + rh - label_h - 5
            d.rectangle((x, y, x + cw - 1, ground + 3), fill='#638e43')
            d.rectangle((x, ground - 3, x + cw - 1, ground + 3), fill='#9e865e')
            sx = x + max(3, (cw - person.width - 7 - sprite.width) // 2)
            sheet.alpha_composite(sprite, (sx, ground - sprite.height))
            sheet.alpha_composite(person, (sx + sprite.width + 6, ground - person.height))
            fp = all_r[name]['footprint']
            d.text((x + cw // 2, ground + 6),
                   f'{fp[0]}×{fp[1]} tiles · {sprite.width}×{sprite.height}px',
                   font=small_font, fill='#cbd4df', anchor='ma')
            x += cw + gap
        y += rh + gap
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.resize((w * zoom, h * zoom), Image.NEAREST).convert('RGB').save(out)
    print('wrote', out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'artifacts/gold-masters.png')

