"""Contact sheet for the enlarged prehistoric house families."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.reference import current_adult  # noqa: E402
from art.review_sheet import recipes  # noqa: E402

FAMILIES = [
    ('Bark / mat dome', 'house-dome-0', 'house-dome'),
    ('Hide pole lodge', 'house-tent-0', 'house-tent'),
    ('Pit house', 'house-pit-0', 'house-pit'),
    ('Stone round house', 'house-round-stone-0', 'house-round-stone'),
    ('Painted round house', 'house-rondavel-0', 'house-rondavel'),
    ('Aegean stone house', 'house-aegean-0', 'house-aegean'),
]


def make(out, zoom=3):
    all_r, painter, source = recipes()
    person = current_adult()
    rows = []
    for title, small, family in FAMILIES:
        names = [small, f'{family}-expanded-medium-0',
                 f'{family}-expanded-medium-1', f'{family}-expanded-large-0']
        cells = []
        for name in names:
            r = all_r[name]
            cells.append((name, r, painter(r)(r, source['materials'][r['wall']]).render()))
        rows.append((title, cells))

    label_h, title_w, gap = 15, 126, 8
    col_w = [max(row[1][i][2].width for row in rows) + person.width + 10 for i in range(4)]
    row_h = [max(im.height for _, _, im in cells) + label_h + 8 for _, cells in rows]
    width = title_w + sum(col_w) + gap * 5
    height = 30 + sum(row_h) + gap * (len(rows) + 1)
    sheet = Image.new('RGBA', (width, height), '#182038')
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 7)
        small_font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 6)
    except OSError:
        font = small_font = ImageFont.load_default()
    draw.text((8, 7), 'PREHISTORIC HOUSE EXPANSION · live adult · native pixels',
              font=font, fill='#f0d795')
    headings = ['retained small', 'medium · seed A', 'medium · seed B', 'large / communal']
    x = title_w + gap * 2
    for index, heading in enumerate(headings):
        draw.text((x + col_w[index] // 2, 20), heading, font=small_font,
                  fill='#aebbd0', anchor='ma')
        x += col_w[index] + gap
    y = 30 + gap
    for row_index, (title, cells) in enumerate(rows):
        row_height = row_h[row_index]
        draw.text((8, y + row_height // 2 - 4), title, font=font, fill='#f0d795')
        x = title_w + gap * 2
        for index, (name, recipe, sprite) in enumerate(cells):
            cell_width = col_w[index]
            ground = y + row_height - label_h - 5
            draw.rectangle((x, y, x + cell_width - 1, ground + 3), fill='#638e43')
            draw.rectangle((x, ground - 3, x + cell_width - 1, ground + 3), fill='#9e865e')
            sx = x + max(3, (cell_width - person.width - 7 - sprite.width) // 2)
            sheet.alpha_composite(sprite, (sx, ground - sprite.height))
            sheet.alpha_composite(person, (sx + sprite.width + 6, ground - person.height))
            fp = recipe['footprint']
            treatment = recipe.get('surfaceTreatments', ['source'])
            draw.text((x + cell_width // 2, ground + 6),
                      f'{fp[0]}x{fp[1]} · {"/".join(treatment)}',
                      font=small_font, fill='#cbd4df', anchor='ma')
            x += cell_width + gap
        y += row_height + gap
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.resize((width * zoom, height * zoom), Image.NEAREST).convert('RGB').save(out)
    print('wrote', out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'artifacts/prehistoric-expansion.png')
