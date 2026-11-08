"""Churches, temples, mosques and shrines of the faiths the European and
Near Eastern sets left out, front-on.

    .venv/bin/python scripts/art/front_sacred.py artifacts/sacred [group]

Each painter module (front_sacred_<group>.py) exports BUILDERS, kind ->
fn(spec, info) -> Image, and SPECS, recipe -> {scale: [(kind, spec), ...]},
one entry per look. A builder fills `info` with x0, W, base, door_x, door_h
and depth (the plan's depth in px, which sets the footprint's rows).
`game_recipes` turns every entry into the frame `religious-<recipe>-<scale>-<look>`;
the rules in src/content/settlements/religious/ pick the recipe.
"""
from pathlib import Path
import importlib
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import C, RAMPS, ramp, mix  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402
from art.front_style import FIGURE  # noqa: E402

GROUPS = ('christian', 'southasia', 'seasia', 'africa', 'world', 'islam')
VOID = (36, 28, 38, 255)
GOLD = fp.GOLD
WOOD = RAMPS['oak']


def module(group):
    return importlib.import_module(f'art.front_sacred_{group}')


def modules():
    out = []
    for g in GROUPS:
        try:
            out.append(module(g))
        except ModuleNotFoundError as e:
            if e.name != f'art.front_sacred_{g}':
                raise
    return out


# ------------------------------------------------------------------ shared parts

def complete(c, info, x0, W, base, door_x, door_h, depth, **extra):
    """Edges, palette discipline, and what the game needs to stand it."""
    finish(c)
    consolidate(c, rare=5, reach=35)
    if info is not None:
        info.update(x0=x0, W=W, base=base, door_x=door_x, door_h=door_h, depth=depth, **extra)
    return c.im


def arch_door(c, cx, base, w, h, frame, shape='round', wood=None, band=3, leaf=True):
    """A doorway in a raised frame: the arch or lintel lit on its outer edge,
    the reveal in shade, plank leaves (or the dark of an open door)."""
    x0 = cx - w // 2
    test = fp.SHAPES[shape]
    spring = base - h + fp.apex(shape, w)
    ox = x0 - band
    for yy in range(base - h - band, base):
        for xx in range(ox, ox + w + 2 * band):
            if test(xx, yy, ox, spring, w + 2 * band) and not test(xx, yy, x0, spring, w):
                c.p(xx, yy, frame[1] if not test(xx, yy, ox + 1, spring, w + 2 * band - 2) else frame[2])
    wood = wood or WOOD
    for yy in range(base - h, base):
        for xx in range(x0, x0 + w):
            if not test(xx, yy, x0, spring, w):
                continue
            if not leaf:
                c.p(xx, yy, VOID if yy > spring - 2 else mix(VOID, frame[6], 0.4))
                continue
            lx = xx - x0
            q = 3 if lx % 5 else 5
            if lx == w // 2 or lx == w // 2 - 1:
                q = 6
            if yy < spring + 3 or lx < 2:
                q = min(7, q + 2)
            c.p(xx, yy, wood[q])
    for xx in range(x0 + 2, x0 + w - 1, 4):
        c.p(xx, spring + 6, GOLD[3]) if leaf else None
    return spring


def steps(c, cx, base, w, n, r, rise=3, tread=4):
    """A flight of n steps up to a door at row `base - n*rise`, widest at the
    foot; each tread lit on top, its riser in the stone's middle tone."""
    for k in range(n):
        sw = w - k * 4
        y = base - k * rise
        c.rect(cx - sw // 2, y - rise, sw, rise, r[3])
        c.rect(cx - sw // 2, y - rise, sw, 1, r[1])
        c.rect(cx + sw // 2 - 1, y - rise, 1, rise, r[5])
    return base - n * rise


def cone(c, cx, by, R, H, r, courses=0, z0=0, bias=0.0, ribs=0):
    """A cone on an elliptical foot: a thatched roof, a stone drum cap, a
    tented spire."""
    so.lathe(c, cx, by, [(0, R), (H, 0.6)], r, courses=courses, z0=z0, bias=bias, ribs=ribs)


def drum(c, cx, by, R, H, r, z0=0, windows=0, win_h=10, courses=0):
    """A cylinder (a dome's drum, a round wall) with arched slits round its
    front half."""
    so.lathe(c, cx, by, [(0, R), (H, R)], r, z0=z0, courses=courses)
    for k in range(windows):
        a = math.pi * (0.18 + 0.64 * (k + 0.5) / windows)
        wx = cx - round(R * math.cos(a))
        top = by - z0 - H + 4
        wh = min(win_h, H - 7)
        for yy in range(top, top + wh):
            for xx in range(wx - 1, wx + 1):
                c.p(xx, yy, VOID if yy > top else r[6])
        c.p(wx - 2, top + wh, r[1]); c.p(wx + 1, top + wh, r[1])


def flag(c, x, base, h, cloth, w=14, fh=9, finial=None):
    """A flagstaff with its cloth flying right: a temple pennant, the Nishan
    Sahib, a church banner."""
    for yy in range(base - h, base):
        c.p(x, yy, WOOD[2]); c.p(x + 1, yy, WOOD[4])
    top = base - h + 2
    for k in range(w):
        dip = round(1.5 * math.sin(k / w * math.pi * 1.5))
        hh = max(2, fh - k * fh // (w + 4))
        for j in range(hh):
            q = 2 if j < hh // 2 else 3
            if k > w * 0.6:
                q += 1
            c.p(x + 2 + k, top + j + dip, cloth[q])
    if finial:
        c.rect(x - 1, base - h - 3, 4, 3, GOLD[1]); c.p(x, base - h - 4, GOLD[0])


def ground_shadow(c, x0, x1, base, depth=4, k=0.3):
    """The building's foot on the ground: a few rows of shade to its right."""
    for yy in range(base, base + depth):
        for xx in range(x0 + 4, x1 + 6):
            q = c.g(xx, yy)
            if q[3]:
                c.p(xx, yy, mix(q, (40, 30, 70, 255), k))


# ------------------------------------------------------------------ catalogue

def entries(groups=None):
    """(name, recipe, scale, look, kind, spec, builders) for every frame."""
    for m in modules():
        if groups and m.__name__.split('_')[-1] not in groups:
            continue
        for recipe, scales in m.SPECS.items():
            for scale, looks in scales.items():
                for look, (kind, spec) in enumerate(looks):
                    yield f'religious-{recipe}-{scale}-{look}', recipe, scale, look, kind, spec, m.BUILDERS


def group_of(builders):
    for m in modules():
        if m.BUILDERS is builders:
            return m.__name__.split('_')[-1]


def paint(kind, spec, builders):
    info = {}
    im = builders[kind](dict(spec), info)
    return im, info


def footprint(info):
    return math.ceil(info['W'] / 16), max(4, math.ceil(info['depth'] / 16))


def game_recipes(recipes):
    template = recipes['religious-mesopotamian-temple-small-0']
    for name, recipe, scale, look, kind, spec, builders in entries():
        im, info = paint(kind, spec, builders)
        fw, fh = footprint(info)
        door = min(fw - 1, max(0, (info['door_x'] - info['x0']) // 16))
        recipes[name] = {
            **{k: v for k, v in template.items() if k not in ('shadowFrame', 'sacredVoxel', 'style', 'roofVoid')},
            'label': spec.get('label', recipe.replace('-', ' ').capitalize()),
            'description': spec.get('description', ''),
            'family': recipe, 'recipe': recipe, 'religious': True, 'front': True,
            'frontAncient': ('sacred', dict(kind=kind, spec=spec, group=group_of(builders))),
            'footprint': [fw, fh], 'entrance': [door, fh], 'height': im.height,
            'roof': spec.get('roof', 'gable')}


def builder(spec, info):
    """The FrontAncientPainter hook: kind and spec, drawn by their module."""
    m = module(spec['group'])
    return m.BUILDERS[spec['kind']](dict(spec['spec']), info)


# ------------------------------------------------------------------ checks and sheets

def faults(groups=None):
    from art.front_audit import image_faults
    out = []
    for name, recipe, scale, look, kind, spec, builders in entries(groups):
        im, info = paint(kind, spec, builders)
        out += image_faults(name, im)
        if not info.get('doorless') and info['door_h'] < FIGURE:
            out.append(f'{name}: door {info["door_h"]}px is shorter than the {FIGURE}px adult')
    return out


def studies():
    """For front_audit: every frame with its door height."""
    from types import SimpleNamespace
    for name, recipe, scale, look, kind, spec, builders in entries():
        im, info = paint(kind, spec, builders)
        yield (name, im, SimpleNamespace(roof_span=(0, im.width), stacks=[]),
               None if info.get('doorless') else info['door_h'], [])


def sheet(out, groups=None, zoom=2):
    from PIL import Image, ImageDraw
    from art.reference import current_adult
    adult = current_adult()
    tiles = []
    for name, recipe, scale, look, kind, spec, builders in entries(groups):
        im, info = paint(kind, spec, builders)
        fw, fh = footprint(info)
        tiles.append((f'{recipe} {scale} {look}  {fw}x{fh}', im, info))
    pad, cols = 14, 4
    rows = [tiles[i:i + cols] for i in range(0, len(tiles), cols)]
    widths = [sum(t[1].width + adult.width + pad * 2 for t in r) for r in rows]
    heights = [max(t[1].height for t in r) + 22 for r in rows]
    W, H = max(widths) + pad, sum(heights) + pad
    bg = Image.new('RGBA', (W, H), (122, 128, 104, 255))
    d = ImageDraw.Draw(bg)
    y = pad
    for r, h in zip(rows, heights):
        x = pad
        for label, im, info in r:
            base = y + h - 16
            top = base - info['base']
            bg.alpha_composite(im, (x, top))
            bg.alpha_composite(adult, (x + im.width + 2, base - adult.height))
            d.text((x, y), label, fill=(20, 20, 24))
            x += im.width + adult.width + pad * 2
        y += h
    bg = bg.resize((W * zoom, H * zoom), Image.NEAREST)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    bg.convert('RGB').save(out)
    return out


if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/sacred'
    groups = sys.argv[2:] or None
    print('wrote', sheet(out if out.endswith('.png') else out + '.png', groups))
    for f in faults(groups):
        print(f)
