"""Check every oblique building against scripts/art/oblique_style.py.

    python3 scripts/art/oblique_audit.py                 # audit, exit 1 on a fault
    python3 scripts/art/oblique_audit.py --sheet out.png house-med-   # contact sheet

The audit is about regularity, not taste: one side depth, one roof rise per
material, a door the leaf overlay fits, an anchor under the front wall, no
stray translucent pixels. Look at the sheet for everything else.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from PIL import Image, ImageDraw, ImageFont  # noqa: E402
from art.buildings import DOOR_W, DOOR_H, door_rect  # noqa: E402
from art.oblique_style import side_depth, roof_rise  # noqa: E402
from art.review_sheet import recipes  # noqa: E402
from art.reference import current_adult  # noqa: E402

OWN_NUMBERS = re.compile(r'^(K|STOREY|OVER|VERGE)\s*=', re.M)


def oblique(all_r):
    return {n: r for n, r in all_r.items()
            if (r.get('oblique') or r.get('family') == 'parish') and not re.search(r'-(north|east|west)$', n)}


def audit():
    all_r, painter, source = recipes()
    faults = []
    for path in (ROOT / 'scripts/art').glob('oblique*.py'):
        if path.name not in ('oblique_style.py', 'oblique_audit.py') and OWN_NUMBERS.search(path.read_text()):
            faults.append(f'{path.name}: defines its own projection numbers; import them from oblique_style')
    for name, r in oblique(all_r).items():
        a = painter(r)(r, source['materials'][r['wall']])
        im = a.render()
        w, h = im.size
        say = lambda m: faults.append(f'{name}: {m}')
        fh = r['footprint'][1]
        expected_side = side_depth(fh, deep=r.get('family') == 'parish' or r.get('deep', False))
        if not getattr(a, 'no_side', False) and getattr(a, 'sw', None) != expected_side:
            say(f'side wall {getattr(a, "sw", None)}px, style says {expected_side}')
        if hasattr(a, 'roof') and hasattr(a, 'flat') and not a.flat and a.rise != roof_rise(a.roof):
            say(f'roof rise {a.rise}px for {a.roof}, style says {roof_rise(a.roof)}')
        if not 0 <= a.anchor_x <= w:
            say('anchor outside the sprite')
        x, y, dw, dh = door_rect(a)
        if (dw, dh) != (DOOR_W, DOOR_H) or x < 0 or y < 0 or x + dw > w or y + dh > h:
            say('door rect does not fit the shared leaf')
        elif im.getpixel((x + dw // 2, y + dh // 2))[3] < 255:
            say('door rect is not on the building')
        soft = sum(1 for p in im.getdata() if 0 < p[3] < 255)
        if soft > w:
            say(f'{soft} translucent pixels; only the ground line may be soft')
        right = -(-(w - a.anchor_x - r['footprint'][0] * 8) // 16)
        if right > 2:
            say(f'overhangs {right} tiles to the right; towns leave 1-2 clear')
    gold = {}
    for name, r in oblique(all_r).items():
        if r.get('goldMaster'):
            gold.setdefault(r['goldMaster'], {}).setdefault(r['goldScale'], []).append((name, r))
    for family, scales in gold.items():
        if len(scales.get('medium', [])) != 2 or len(scales.get('large', [])) != 1:
            faults.append(f'{family}: gold family needs two medium variants and one large')
            continue
        medium = scales['medium'][0][1]['footprint']
        large = scales['large'][0][1]['footprint']
        if large[0] <= medium[0] or large[1] <= medium[1]:
            faults.append(f'{family}: large footprint must exceed medium in both axes')
        images = []
        for name, r in scales['medium']:
            images.append(painter(r)(r, source['materials'][r['wall']]).render().tobytes())
        if images[0] == images[1]:
            faults.append(f'{family}: medium seeds render identically')
    return faults


def sheet(out, prefixes, zoom=2):
    all_r, painter, source = recipes()
    names = [n for n in oblique(all_r) if not prefixes or any(n.startswith(p) for p in prefixes)]
    figure = current_adult()
    drawn = [(n, painter(all_r[n])(all_r[n], source['materials'][all_r[n]['wall']]).render()) for n in names]
    rows, row, width = [], [], 0
    for n, im in drawn:
        if width + im.width > 900 and row:
            rows.append(row); row, width = [], 0
        row.append((n, im)); width += im.width + 26
    rows.append(row)
    H = sum(max(i.height for _, i in r) + 22 for r in rows) + 8
    W = max(sum(i.width + 26 for _, i in r) for r in rows) + 8
    im = Image.new('RGBA', (W, H), '#5f8f3e'); d = ImageDraw.Draw(im)
    y = 4
    for r in rows:
        rh = max(i.height for _, i in r); x = 6
        for n, sprite in r:
            im.alpha_composite(sprite, (x, y + rh - sprite.height))
            im.alpha_composite(figure, (x + sprite.width + 2, y + rh - figure.height - 3))
            d.text((x, y + rh + 2), n.replace('house-', '').replace('-urban', ''), fill='#10210c')
            x += sprite.width + 26
        y += rh + 22
    im.resize((W * zoom, H * zoom), Image.NEAREST).convert('RGB').save(out)
    print('wrote', out, len(drawn), 'buildings')


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--sheet':
        sheet(args[1], args[2:])
    else:
        found = audit()
        print('\n'.join(found) if found else 'oblique audit: clean')
        sys.exit(1 if found else 0)
