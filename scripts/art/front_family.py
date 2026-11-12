"""House families drawn front-on from specs: one registry that gives a
regional module its bake hook, its street forms, a walkable door where the
door is drawn, lamplight, review sheets and the audit.

    .venv/bin/python scripts/art/front_family.py                       # list families and looks
    .venv/bin/python scripts/art/front_family.py casa out.png          # A/B and street sheets, every look
    .venv/bin/python scripts/art/front_family.py casa out.png bahay goa

A module registers a prefix, its looks and one builder:

    front_family.register('casa', {'oaxaca': dict(label=, about=, wall=, roof=, variants=3)}, house)

`house(look, variant, form, cells, seed)` returns an unpainted object whose
geometry is already settled (x0, W, base, floors, door_x, door_size), with
`build()` returning the sprite and leaving `night` (a lamplit frame or None).
The game then has frames `<prefix>-<look>-<variant>` and
`<prefix>-<look>-<variant>-urban-<form>` for every form in urban.json, each
with its entrance in the cell the door is drawn in. Which looks a settlement
gets is chosen in TypeScript (src/content/graphics/); add the module's name
to MODULES here and nothing else in the build changes.
"""
from pathlib import Path
import importlib
import json
import re
import sys
import zlib

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

MODULES = ('art.front_iberia',)
# Front-on houses are drawn at the adult's scale, so old footprints widen.
SCALE = 1.45
FAMILIES = {}
NAME = re.compile(r'^([a-z]+)-([a-z-]+)-(\d+)(?:-urban-([a-z]+))?(?:-(?:north|east|west))?$')


def register(prefix, looks, build):
    FAMILIES[prefix] = dict(looks=looks, build=build)


def load():
    for m in MODULES:
        importlib.import_module(m)
    return FAMILIES


def parse(name):
    """(prefix, look, variant, form) for one of our frames, else None."""
    m = NAME.match(name)
    if not m or m.group(1) not in FAMILIES or m.group(2) not in FAMILIES[m.group(1)]['looks']:
        return None
    return m.group(1), m.group(2), int(m.group(3)), m.group(4)


def cells_for(footprint_w):
    return max(4, round(footprint_w * SCALE))


def door_cell(h, cells):
    """The footprint cell a house's drawn door stands in."""
    return max(0, min(cells - 1, (h.door_x - h.x0) // 16))


# ------------------------------------------------------------------ the bake

def recipes(root, source):
    """Base and street-form recipes for every look of every family."""
    from art.urban import urban_recipes
    load()
    base = {}
    for prefix, fam in FAMILIES.items():
        for look, L in fam['looks'].items():
            for v in range(L['variants']):
                base[f'{prefix}-{look}-{v}'] = dict(
                    canvas=[96, 96], height=55, roof='gable', opening='door', attachments=[], label=L['label'],
                    footprint=[4, 3], entrance=[2, 3], wall=L['wall'], roofMaterial=L['roof'],
                    description=L['about'], windowStyle='shutter', chimneys=0, stories=1,
                    seed=zlib.crc32(f'{prefix}-{look}-{v}'.encode()) % 9973)
    halls = {n for n in base if n.endswith('-0')}
    return {**base, **urban_recipes(root, {**source, 'buildings': base}, bases=list(base), halls=halls)}


def adopt(recipes):
    """Point every frame of the registered families at its builder, with the
    footprint the sprite stands on and the entrance under its door."""
    load()
    n = 0
    for name, r in recipes.items():
        got = parse(name)
        if not got:
            continue
        prefix, look, variant, form = got
        fw, fh = r['footprint']
        cells = cells_for(fw)
        seed = zlib.crc32(re.sub(r'-(north|east|west)$', '', name).encode()) % 997
        h = FAMILIES[prefix]['build'](look, variant, form, cells, seed)
        r.update(frontFamily=[prefix, look, variant, form, cells, seed], front=True, footprint=[cells, fh],
                 entrance=[door_cell(h, cells), fh], stories=h.floors, height=h.floors * 31 + 24)
        n += 1
    return n


_PAINTED = {}


class FrontFamilyPainter:
    """What scripts/art/buildings.py needs from a painter. A frame's turned
    copies share its spec, so each is painted once."""

    def __init__(self, r, material=None):
        key = json.dumps(r['frontFamily'])
        if key not in _PAINTED:
            prefix, look, variant, form, cells, seed = r['frontFamily']
            h = load()[prefix]['build'](look, variant, form, cells, seed)
            im = h.build()
            _PAINTED[key] = dict(image=im, night=h.night, w=im.width, h=im.height, anchor_x=h.x0 + h.W // 2,
                                 door_x=h.door_x, door_size=h.door_size, door_ground=h.base + 1, bottom=h.base + 1)
        self.__dict__.update(_PAINTED[key])

    def render(self):
        return self.image


# ------------------------------------------------------------------ review
# The forms a sheet shows for each look, as (form, cells): the widths the
# game bakes them at.
FORMS = (('row', 12), ('tall', 10), ('shop', 7), ('cottage', 6), ('hut', 4), ('stall', 4))


def subjects(prefixes=None):
    """Every look at every form, for the audit: (name, image, house)."""
    for prefix, fam in load().items():
        if prefixes and prefix not in prefixes:
            continue
        for look, L in fam['looks'].items():
            for v in range(L['variants']):
                for form, cells in FORMS if v == 0 else FORMS[:1]:
                    h = fam['build'](look, v, form, cells, v * 7 + cells)
                    yield f'{prefix}-{look}-{v}-{form}', h.build(), h


def _label(d, xy, text, size, zoom):
    from PIL import ImageFont
    d.text((xy[0] * zoom, xy[1] * zoom), text, font=ImageFont.load_default(size=size), fill=(240, 220, 170))


def ab(out, bands, now=None, zoom=3, masters=True):
    """A contact sheet: the gold masters, what the game draws now, then
    bands of (title, [(label, image)]), each with the live adult."""
    from PIL import Image, ImageDraw
    from art import front_review as fr
    from art.reference import current_adult
    adult = current_adult()
    bands = ([('GOLD MASTERS', list(fr.gold().items()))] if masters else []) + \
            ([('NOW', now)] if now else []) + [('NEW  ' + t, ims) for t, ims in bands]
    pad, cap = 12, 12
    W = max(sum(im.width + pad for _, im in ims) for _, ims in bands) + adult.width + 2 * pad
    hs = [max(im.height for _, im in ims) + 18 + cap for _, ims in bands]
    s = Image.new('RGBA', (W, sum(hs)), (28, 24, 34, 255))
    marks, y = [], 0
    for (title, ims), h in zip(bands, hs):
        marks.append(((pad, y + 3), title, 22))
        x = pad
        for label, im in ims:
            s.alpha_composite(im, (x, y + h - cap - im.height))
            marks.append(((x + 2, y + h - cap + 2), label, 15))
            x += im.width + pad
        s.alpha_composite(adult, (x, y + h - cap - adult.height - 5))
        y += h
    s = s.resize((s.width * zoom, s.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(s)
    for xy, t, size in marks:
        _label(d, xy, t, size, zoom)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    s.convert('RGB').save(out)
    print(f'wrote {out}')


def street(out, rows, zoom=3, night=False):
    """Streets of (title, [house or image]): how a place feels matters more
    than any one sprite. `night` lays each house's lamplight over a dark
    grade, as the game does after dusk."""
    from PIL import Image, ImageDraw, ImageEnhance
    from art.front_materials import ramp, h2
    from art.reference import current_adult
    adult = current_adult()
    dirt = ramp(70, 0.07, lift=0.02)
    rows = [(t, [(h.build(), h.night) if hasattr(h, 'build') else (h, None) for h in hs]) for t, hs in rows]
    W = max(sum(im.width - 26 for im, _ in ims) for _, ims in rows) + 44
    strips = []
    for label, ims in rows:
        H = max(im.height for im, _ in ims) + 62
        r = Image.new('RGBA', (W, H), dirt[2])
        px = r.load()
        for y in range(H):
            for x in range(W):
                if h2(x // 3, y // 2, 601) < 0.07:
                    px[x, y] = dirt[3] if h2(x, y, 602) < 0.7 else dirt[1]
        glow = Image.new('RGBA', (W, H))
        x = 6
        for im, lamp in ims:
            r.alpha_composite(im, (x, H - 46 - im.height))
            if lamp is not None:
                glow.alpha_composite(lamp, (x, H - 46 - im.height))
            x += im.width - 26
        for fx in (W // 4, W // 2 + 30, 3 * W // 4 + 20):
            r.alpha_composite(adult, (fx, H - 14 - adult.height))
        if night:
            dark = ImageEnhance.Brightness(r.convert('RGB')).enhance(0.36).convert('RGBA')
            tint = Image.new('RGBA', (W, H), (40, 52, 110, 255))
            r = Image.blend(dark, tint, 0.28)
            r.alpha_composite(glow)
        strips.append((label, r))
    s = Image.new('RGBA', (W, sum(r.height + 10 for _, r in strips)), (28, 24, 34, 255))
    y, marks = 0, []
    for label, r in strips:
        s.alpha_composite(r, (0, y + 10))
        marks.append(((3, y), label))
        y += r.height + 10
    s = s.resize((s.width * zoom, s.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(s)
    for xy, t in marks:
        _label(d, xy, t, 22, zoom)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    s.convert('RGB').save(out)
    print(f'wrote {out}')


def sheets(prefix, out, sets=None, only=None):
    """The standard review of a family: `out` (every look at every form, with
    its colours), `-street` (a street of each look) and `-night` (the same
    streets lamplit). `sets` groups looks under titles; `only` names looks."""
    fam = load()[prefix]
    b = fam['build']
    looks = [k for k in fam['looks'] if not only or k in only]
    title = {k: t for t, ks in (sets or []) for k in ks}
    bands, rows = [], []
    for k in looks:
        L = fam['looks'][k]
        cells = [(f'{form} · {n * 16}px', b(k, 0, form, n, 3).build()) for form, n in FORMS]
        cells += [(f'colour {v}', b(k, v, 'row', 12, 5 + v).build()) for v in range(1, L['variants'])]
        bands.append((f'{title.get(k, prefix)} · {k} · {L["label"]}', cells))
        rows.append((f'{k} · {L["label"]}', [b(k, 0, 'cottage', 6, 1), b(k, 0, 'row', 12, 2),
                                             b(k, 1 % L['variants'], 'shop', 7, 3), b(k, 0, 'tall', 10, 4),
                                             b(k, 2 % L['variants'], 'row', 12, 5), b(k, 1 % L['variants'], 'hut', 4, 6),
                                             b(k, 0, 'hall', 17, 7)]))
    ab(out, bands)
    street(out.replace('.png', '-street.png'), rows)
    street(out.replace('.png', '-night.png'), rows, night=True)


def main(args):
    if len(args) < 2:
        for prefix, fam in load().items():
            print(prefix + ':', ', '.join(f'{k} ({L["variants"]})' for k, L in fam['looks'].items()))
    else:
        sheets(args[0], args[1], only=args[2:] or None)


if __name__ == '__main__':
    # Run as the module the families register with, not a second copy named __main__.
    from art import front_family
    front_family.main(sys.argv[1:])
