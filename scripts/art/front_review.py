"""The review sheet for front-on art: new work stands beside the gold masters
and the live adult, at 3x, every time.

    python3 scripts/art/front_review.py out.png                 # gold masters as the code draws them now
    python3 scripts/art/front_review.py out.png a.png b.png     # new sprites beside them

The pinned gold masters live in scripts/art/reference/front/. The top row
shows each one as pinned, and beside it as the code draws it today if the
two have drifted apart.
When new work beats a gold master, re-pin it by name: --pin <name>. A bare
--pin lists the masters and how far each has drifted.
"""
from pathlib import Path
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

REF = ROOT / 'scripts/art/reference/front'
BG = (28, 24, 34, 255)


def gold():
    """The gold masters as the code draws them now: name -> image."""
    from art.front_kit import Front, spec
    from art.front_house import GableHouse
    im, _ = Front(spec('modern-immeuble-0')).build()
    out = {'immeuble-0': im, 'gable-shingle': GableHouse().build()}
    # Regional masters: the house a new family in that part of the world is held to.
    from art.front_family import load
    casa = load()['casa']['build']
    out.update({'casa-caribe': casa('caribe', 0, 'row', 12, 2).build(), 'casa-bahay': casa('bahay', 0, 'row', 12, 2).build(),
                'casa-oaxaca': casa('oaxaca', 0, 'row', 12, 2).build()})
    return out


def drift(a, b):
    """Share of pixels that differ. Compared in RGB: Pillow's bounding box
    of an RGBA difference looks only at alpha and misses colour changes."""
    if a.size != b.size:
        return 1.0
    pa, pb = a.convert('RGBA').getdata(), b.convert('RGBA').getdata()
    return sum(1 for p, q in zip(pa, pb) if p != q) / (a.width * a.height)


def sheet(items, out, zoom=3, masters=True, columns=None):
    """items: (label, image) pairs, laid out after the gold masters."""
    from art.reference import current_adult
    adult = current_adult()
    now = gold() if masters else {}
    cells = []
    for name, im in now.items():
        pinned = REF / f'{name}.png'
        if pinned.exists():
            p = Image.open(pinned).convert('RGBA')
            cells.append((f'{name} (pinned)', p))
            # Shown only when the code no longer draws what was pinned.
            if drift(p, im) > 0.005:
                cells.append((f'{name} now · {drift(p, im) * 100:.1f}% changed', im))
        else:
            cells.append((f'{name} (not pinned)', im))
    cells += list(items)
    pad, top = 10, 16
    rows, row, w = [], [], 0
    for label, im in cells:
        if row and ((columns and len(row) == columns) or (not columns and w + im.width + pad > 760)):
            rows.append(row)
            row, w = [], 0
        row.append((label, im))
        w += im.width + pad
    rows.append(row)
    W = max(sum(im.width + pad for _, im in r) for r in rows) + adult.width + 2 * pad
    hs = [max(im.height for _, im in r) + top for r in rows]
    s = Image.new('RGBA', (W, sum(hs) + pad), BG)
    labels, y = [], pad
    for r, h in zip(rows, hs):
        x = pad
        for label, im in r:
            s.alpha_composite(im, (x, y + h - im.height))
            labels.append((x, y, label))
            x += im.width + pad
        s.alpha_composite(adult, (x, y + h - adult.height - 4))
        y += h
    s = s.resize((s.width * zoom, s.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(s)
    font = ImageFont.load_default(size=18)
    for x, y, label in labels:
        d.text((x * zoom, y * zoom), label, font=font, fill=(240, 220, 170))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    s.convert('RGB').save(out)
    print(f'wrote {out}')


def pin(names):
    """Pin the named masters as the code draws them now. Naming them is the
    point: a bare --pin once re-pinned a master nobody meant to touch."""
    REF.mkdir(parents=True, exist_ok=True)
    now = gold()
    if not names:
        for name, im in now.items():
            p = REF / f'{name}.png'
            state = 'not pinned' if not p.exists() else f'{drift(Image.open(p).convert("RGBA"), im) * 100:.1f}% changed'
            print(f'{name}: {state}')
        print('name the masters to pin: front_review.py --pin <name> ...')
        return
    for name in names:
        now[name].save(REF / f'{name}.png')
        print(f'pinned {name}')


if __name__ == '__main__':
    args = sys.argv[1:]
    if args and args[0] == '--pin':
        pin(args[1:])
    else:
        out = args[0] if args else 'artifacts/front-review.png'
        sheet([(Path(p).stem, Image.open(p).convert('RGBA')) for p in args[1:]], out)
