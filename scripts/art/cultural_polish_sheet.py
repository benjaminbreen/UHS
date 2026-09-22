"""Small culture-kit buildings and inhabited-detail review sheet."""
from pathlib import Path
import sys
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.reference import current_adult  # noqa: E402
from art.review_sheet import recipes  # noqa: E402

ROWS = [
    ('European service kit', [f'europe-service-gold-small-{i}' for i in range(4)]),
    ('Neolithic service kit', [f'neolithic-service-gold-small-{i}' for i in range(3)]),
    ('North Chinese service kit', [f'eastasian-service-north-chinese-small-{i}' for i in range(4)]),
    ('Japanese service kit', [f'eastasian-service-japanese-small-{i}' for i in range(4)]),
    ('North Indian service kit', [f'southasian-service-north-indian-small-{i}' for i in range(4)]),
    ('Bengali service kit', [f'southasian-service-bengali-small-{i}' for i in range(4)]),
]


def make(out, zoom=3):
    all_r, painter, source = recipes()
    person = current_adult()
    rows = []
    for title, names in ROWS:
        cells = []
        for name in names:
            recipe = all_r[name]
            sprite = painter(recipe)(recipe, source['materials'][recipe['wall']]).render()
            cells.append((recipe, sprite))
        rows.append((title, cells))
    label_h, title_w, gap = 22, 132, 8
    col_w = [max((cells[i][1].width if i < len(cells) else 0) for _, cells in rows) + person.width + 12 for i in range(4)]
    row_h = [max(sprite.height for _, sprite in cells) + label_h + 8 for _, cells in rows]
    width = title_w + sum(col_w) + gap * 5
    height = 30 + sum(row_h) + gap * (len(rows) + 1)
    sheet = Image.new('RGBA', (width, height), '#182038')
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 7)
        small = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 6)
    except OSError:
        font = small = ImageFont.load_default()
    draw.text((8, 7), 'CULTURAL SETTLEMENT KITS · native pixels · 12px oblique return',
              font=font, fill='#f0d795')
    for i, heading in enumerate(('storage', 'work', 'market / gate', 'local hall')):
        x = title_w + gap * 2 + sum(col_w[:i]) + gap * i
        draw.text((x + col_w[i] // 2, 20), heading, font=small, fill='#aebbd0', anchor='ma')
    y = 30 + gap
    for index, (title, cells) in enumerate(rows):
        rh = row_h[index]
        draw.text((8, y + rh // 2 - 4), title, font=font, fill='#f0d795')
        x = title_w + gap * 2
        for col in range(4):
            cw = col_w[col]
            ground = y + rh - label_h - 5
            draw.rectangle((x, y, x + cw - 1, ground + 3), fill='#78885d')
            draw.rectangle((x, ground - 3, x + cw - 1, ground + 3), fill='#a38a61')
            if col < len(cells):
                recipe, sprite = cells[col]
                sx = x + max(3, (cw - person.width - 8 - sprite.width) // 2)
                sheet.alpha_composite(sprite, (sx, ground - sprite.height))
                sheet.alpha_composite(person, (sx + sprite.width + 7, ground - person.height))
                draw.text((x + cw // 2, ground + 6),
                          recipe.get('buildingFunction', '').replace('-', ' '),
                          font=small, fill='#d1d7df', anchor='ma')
                draw.text((x + cw // 2, ground + 14),
                          f'wealth {recipe.get("wealthTier", 1)} · {recipe["footprint"][0]}x{recipe["footprint"][1]}',
                          font=small, fill='#aebbd0', anchor='ma')
            x += cw + gap
        y += rh + gap
    out = Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.resize((width * zoom, height * zoom), Image.NEAREST).convert('RGB').save(out)
    print('wrote', out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else ROOT / 'artifacts/cultural-settlement-kits.png')
