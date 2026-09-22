"""Contact sheet for Roman and North African/West Asian regional houses."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.reference import current_adult  # noqa: E402
from art.review_sheet import recipes  # noqa: E402

ROWS = [
    ('Roman domus · Italy', 'house-roman-ob-0', 'roman-domus', 'roman-italian'),
    ('Roman domus · N. Africa', 'house-roman-ob-0', 'roman-domus', 'roman-north-african'),
    ('Roman domus · East', 'house-roman-ob-0', 'roman-domus', 'roman-eastern'),
    ('Roman insula · Italy', 'house-roman-ob-1', 'roman-insula', 'roman-italian'),
    ('Roman insula · N. Africa', 'house-roman-ob-1', 'roman-insula', 'roman-north-african'),
    ('Roman insula · East', 'house-roman-ob-1', 'roman-insula', 'roman-eastern'),
    ('Maghrebi court house', None, 'westasian-courtyard', 'maghrebi'),
    ('Nile court house', None, 'westasian-courtyard', 'nile'),
    ('Levantine court house', None, 'westasian-courtyard', 'levantine'),
    ('Iranian court house', None, 'westasian-courtyard', 'iranian'),
    ('Arabian court house', None, 'westasian-courtyard', 'arabian'),
]


def row_names(source, family, profile):
    if source:
        return [source, f'{family}-{profile}-medium-0',
                f'{family}-{profile}-medium-1', f'{family}-{profile}-large-0']
    return [f'{family}-{profile}-small-0', f'{family}-{profile}-medium-0',
            f'{family}-{profile}-medium-1', f'{family}-{profile}-large-0']


def make(out, zoom=2):
    all_r, painter, source = recipes()
    person = current_adult()
    rows = []
    for title, retained, family, profile in ROWS:
        cells = []
        for name in row_names(retained, family, profile):
            recipe = all_r[name]
            sprite = painter(recipe)(recipe, source['materials'][recipe['wall']]).render()
            cells.append((name, recipe, sprite))
        rows.append((title, cells))
    title_w, label_h, gap = 145, 25, 8
    col_w = [max(row[1][i][2].width for row in rows) + person.width + 12 for i in range(4)]
    row_h = [max(cell[2].height for cell in cells) + label_h + 8 for _, cells in rows]
    width = title_w + sum(col_w) + gap * 5
    height = 32 + sum(row_h) + gap * (len(rows) + 1)
    sheet = Image.new('RGBA', (width, height), '#182038')
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 7)
        small = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 6)
    except OSError:
        font = small = ImageFont.load_default()
    draw.text((8, 7), 'ROMAN + NORTH AFRICAN / WEST ASIAN HOUSES · 12px oblique return',
              font=font, fill='#f0d795')
    for i, heading in enumerate(('small / retained', 'medium A', 'medium B', 'large')):
        x = title_w + gap * 2 + sum(col_w[:i]) + gap * i
        draw.text((x + col_w[i] // 2, 21), heading, font=small,
                  fill='#aebbd0', anchor='ma')
    y = 32 + gap
    for index, (title, cells) in enumerate(rows):
        rh = row_h[index]
        draw.text((8, y + rh // 2 - 4), title, font=font, fill='#f0d795')
        x = title_w + gap * 2
        for col, (_, recipe, sprite) in enumerate(cells):
            cw = col_w[col]
            ground = y + rh - label_h - 5
            draw.rectangle((x, y, x + cw - 1, ground + 3), fill='#8b8b63')
            draw.rectangle((x, ground - 3, x + cw - 1, ground + 3), fill='#a38a61')
            sx = x + max(3, (cw - person.width - 8 - sprite.width) // 2)
            sheet.alpha_composite(sprite, (sx, ground - sprite.height))
            sheet.alpha_composite(person, (sx + sprite.width + 7, ground - person.height))
            fp = recipe['footprint']
            treatment = recipe.get('surfaceTreatments', ['retained'])
            draw.text((x + cw // 2, ground + 6),
                      f'{fp[0]}x{fp[1]} · {recipe.get("stories", 1)} storey · {"/".join(treatment)}',
                      font=small, fill='#d1d7df', anchor='ma')
            draw.text((x + cw // 2, ground + 14),
                      recipe.get('buildingFunction', '').replace('-', ' '),
                      font=small, fill='#aebbd0', anchor='ma')
            x += cw + gap
        y += rh + gap
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.resize((width * zoom, height * zoom), Image.NEAREST).convert('RGB').save(out)
    print('wrote', out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'artifacts/roman-west-asian-houses.png')
