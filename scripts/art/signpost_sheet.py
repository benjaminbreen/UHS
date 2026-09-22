"""Native and enlarged signs, beside the current actor and the old board."""
from pathlib import Path
from PIL import Image, ImageDraw
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from art.props_b.signposts import signpost, NAMES
from art.props_b.signs import hanging_sign
from art.reference import current_adult

ROOT = Path(__file__).resolve().parents[2]

def main():
    rows = [('oak', [3, 1, 4, 2]), ('painted', [0, 7, 8, 10]),
            ('iron', [4, 8, 9, 11]), ('lacquer', [9, 0, 12, 5]),
            ('split', [0, 12, 9, 13]), ('pennant', [12, 10, 3, 7]),
            ('bazaar', [0, 1, 5, 11])]
    out = Image.new('RGB', (1000, 1120), '#20272a'); d = ImageDraw.Draw(out)
    d.text((24, 18), 'UHS / FREESTANDING SIGNS / ACTUAL GAME SPRITES', fill='#e7d5ad')
    d.text((24, 38), '21 x 37 px silhouette | 13-15 px panels | native pixels and 3x inspection', fill='#b6bfae')
    person = current_adult()
    for row, (style, variants) in enumerate(rows):
        y = 68 + row * 130
        d.text((20, y + 8), style.upper(), fill='#d6c8a2')
        for col, variant in enumerate(variants):
            x = 130 + col * 212
            scene = Image.new('RGBA', (66, 39), '#667249')
            sprite = signpost(style, variant)
            scene.alpha_composite(sprite, (2, -1))
            scene.alpha_composite(person, (39, 39 - person.height))
            out.paste(scene.resize((198, 117), Image.Resampling.NEAREST).convert('RGB'), (x, y))
            d.text((x + 90, y + 98), NAMES[variant], fill='#f0e4c7')
            out.paste(sprite, (x + 164, y + 3), sprite)
    d.text((24, 1002), 'BEFORE / AFTER', fill='#e7d5ad')
    for x, im in [(180, hanging_sign(1)), (290, signpost('oak', 1))]:
        large = im.resize((im.width * 2, im.height * 2), Image.Resampling.NEAREST)
        out.paste(large, (x, 1110 - large.height), large)
    d.text((400, 1040), 'A single glyph replaces the crowded shears / thread / cloth composition.', fill='#d6c8a2')
    d.text((400, 1060), 'Thin supports, quiet fields, no baked ground shadow or runtime scaling.', fill='#d6c8a2')
    dest = ROOT / 'artifacts/signage-concepts/implemented-signposts.png'
    out.save(dest); print(dest)

if __name__ == '__main__': main()
