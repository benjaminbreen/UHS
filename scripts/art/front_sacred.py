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

GROUPS = ('christian', 'southasia', 'seasia', 'africa', 'world', 'ancient', 'americas', 'islam')
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


FLAGS = {
    'saffron': ramp(58, 0.16, lift=-0.02),
    'red': ramp(26, 0.15, lift=-0.06),
    'yellow': ramp(88, 0.14, lift=0.02),
}
JAIN = [ramp(26, 0.15, lift=-0.06), ramp(88, 0.14, lift=0.02), ramp(95, 0.012, lift=0.07),
        ramp(150, 0.1, lift=-0.04), ramp(255, 0.1, lift=-0.08)]
FLAG_W, FLAG_H = 18, 13


def flag(c, x, base, h, cloth, info):
    """A flagstaff on a gilt finial. The cloth (a key of FLAGS, or 'jain')
    flies as a four-frame overlay, `flag-<cloth>`."""
    for yy in range(base - h, base):
        c.p(x, yy, WOOD[2]); c.p(x + 1, yy, WOOD[4])
    c.p(x, base - h - 1, GOLD[1]); c.p(x + 1, base - h - 1, GOLD[3]); c.p(x, base - h - 2, GOLD[0])
    info.setdefault('overlays', []).append([f'flag-{cloth}', x + 2, base - h - 1])


def flag_frames():
    """The cloths `flag` names, each in four frames of a wave running out
    from the staff: a tapering pennant, or the Jain flag's five bands. The
    folds are lit where the cloth turns to the sun."""
    out = {}
    for name in [*FLAGS, 'jain']:
        for f in range(4):
            c = C(FLAG_W, FLAG_H)
            for x in range(FLAG_W - 1):
                t = x / (FLAG_W - 2)
                ph = x / 2.8 - f * math.pi / 2
                dy = math.sin(ph) * 2.0 * t
                fold = math.cos(ph) * t
                half = 4.5 if name == 'jain' else 4.6 - 2.6 * t
                for y in range(FLAG_H):
                    d = y + 0.5 - (4.8 + dy)
                    if abs(d) > half:
                        continue
                    if name != 'jain' and abs(d) < (x - FLAG_W + 6) * 0.7:
                        continue
                    r = JAIN[min(4, int((d + half) / (2 * half) * 5))] if name == 'jain' else FLAGS[name]
                    q = 2 if d < 0 else 3
                    if fold > 0.45:
                        q += 1
                    elif fold < -0.45:
                        q -= 1
                    if d > half - 1:
                        q = 4 if name != 'jain' else q + 1
                    elif d < -half + 1:
                        q = max(1, q - 1)
                    c.p(x, y, r[max(0, min(5, q))])
            out[f'animation-flag-{name}-{f}'] = c.im
    return out


def ground_shadow(c, x0, x1, base, depth=4, k=0.3):
    """The building's foot on the ground: a few rows of shade to its right."""
    for yy in range(base, base + depth):
        for xx in range(x0 + 4, x1 + 6):
            q = c.g(xx, yy)
            if q[3]:
                c.p(xx, yy, mix(q, (40, 30, 70, 255), k))


# ------------------------------------------------------------------ precinct parts
# A walled precinct drawn nearly in plan: thick copings framing a court seen
# from above, towers of storeys under overhanging cornices whose tops read as
# decks. Inside the silhouette edges are value steps, never dark lines; the
# dark line round the outside is finish()'s.

def ink(r):
    """The line where one volume meets another: a mid-deep step of its stone."""
    return r[5]


def bevel(c, x, y, w, h, r, q=3):
    """A flat face cut as Stardew cuts it: lit along its top and left, a
    step darker along its bottom and right."""
    c.rect(x, y, w, h, r[q])
    c.rect(x, y, w, 1, r[q - 2]); c.rect(x, y + 1, 1, h - 1, r[q - 1])
    c.rect(x, y + h - 1, w, 1, r[q + 1]); c.rect(x + w - 1, y + 1, 1, h - 1, r[q + 1])


def masonry(r, bw=14, bh=7, q=2, joint=0.7):
    """Dressed blocks in running bond, each bevelled: the wall face of a
    precinct, the paving of a court. `joint` sets how dark the joints are."""
    def paint(c, x, y, w, h):
        c.rect(x, y, w, h, mix(r[q], r[q + 1], joint))
        for row in range(0, h, bh):
            off = (row // bh % 2) * (bw // 2)
            for bx in range(x - off, x + w, bw):
                x0, x1 = max(x, bx), min(x + w, bx + bw - 1)
                if x1 - x0 < 2:
                    continue
                hh = min(bh - 1, h - row)
                c.rect(x0, y + row, x1 - x0, hh, r[q])
                c.rect(x0, y + row, x1 - x0 - 1, 1, mix(r[q], r[q - 1], 0.6 * joint / 0.7))
                c.rect(x1 - 1, y + row + 1, 1, hh - 1, mix(r[q], r[q + 1], 0.5 * joint / 0.7))
    return paint


def cornice(c, x, foot, w, dh, r, top=None, lip=3):
    """A projecting cornice or coping: its lip square on, lit along the top
    and shadowed beneath, its deck from above behind it with a line of shade
    at the back. Returns the deck's top row."""
    top = top or r
    ty = foot - lip - dh
    if dh:
        c.rect(x, ty, w, dh, top[1])
        c.rect(x, ty, w, 1, top[2])
        c.rect(x + w - 1, ty, 1, dh, top[2])
    c.rect(x, foot - lip, w, lip, r[2])
    c.rect(x, foot - lip, w, 1, top[0])
    c.rect(x, foot - 1, w, 1, r[4])
    c.rect(x + w - 1, foot - lip, 1, lip, r[3])
    e = ink(r)
    c.rect(x - 1, ty, 1, foot - ty, e); c.rect(x + w, ty, 1, foot - ty, e)
    c.rect(x, ty - 1, w, 1, e); c.rect(x, foot, w, 1, e)
    return ty


def ledge(c, x, y, w, dh, r, top, lip=4):
    """A tier's ledge: its deck seen from above, dh deep, its ends rounded,
    lit at the left; in front the lip, lit along its top, shadowed beneath.
    `y` is the row under the lip. Returns the deck's back row."""
    ty = y - lip - dh
    c.rect(x + 1, ty, w - 2, dh, top[1])
    c.rect(x, ty + 1, w, dh - 1, top[1])
    c.rect(x + 1, ty, w - 2, 1, top[2])
    c.rect(x, ty + 1, 1, dh - 1, top[0])
    c.rect(x + w - 1, ty + 1, 1, dh - 1, top[2])
    c.rect(x, y - lip, w, lip, r[2])
    c.rect(x, y - lip, w, 1, top[0])
    c.rect(x, y - 1, w, 1, r[4])
    c.rect(x + w - 1, y - lip, 1, lip, r[3])
    e = ink(r)
    c.rect(x + 1, ty - 1, w - 2, 1, e); c.rect(x, y, w, 1, e)
    c.rect(x - 1, ty + 1, 1, y - ty - 1, e); c.rect(x + w, ty + 1, 1, y - ty - 1, e)
    c.p(x, ty, e); c.p(x + w - 1, ty, e)
    return ty


def post(c, x, foot, h, col):
    """A little standing figure or pillar on a deck: its top seen from above,
    lit on the left, shaded on the right, its shadow on the deck."""
    for k in range(3):
        for yy in range(foot - 4 + k, foot):
            fp.shade(c, x + 4 + k, yy, 0.3)
    c.rect(x, foot - h, 4, 2, col[1]); c.rect(x + 1, foot - h, 2, 1, col[0])
    c.rect(x, foot - h + 2, 4, h - 2, col[2])
    c.rect(x, foot - h + 2, 1, h - 2, col[1]); c.rect(x + 3, foot - h + 2, 1, h - 2, col[4])
    c.rect(x, foot - 1, 4, 1, col[4])
    c.rect(x - 1, foot - h + 1, 1, h - 1, col[5]); c.rect(x + 4, foot - h + 1, 1, h - 1, col[5])
    c.rect(x, foot - h - 1, 4, 1, col[5])

def storey_block(c, x, foot, w, fh, face, r, top=None, dh=8, ov=3):
    """A storey: its face (a ramp, bevelled, or a painter) under a cornice
    that overhangs it by `ov` and throws a band of shade down the face.
    Returns (face top row under the cornice, deck top row)."""
    fy = foot - fh
    if callable(face):
        face(c, x, fy, w, fh)
    else:
        bevel(c, x, fy, w, fh, face)
    e = ink(r)
    c.rect(x - 1, fy, 1, fh, e); c.rect(x + w, fy, 1, fh, e); c.rect(x, foot, w, 1, e)
    ty = cornice(c, x - ov, fy + 3, w + 2 * ov, dh, r, top)
    fp.cast_down(c, x, x + w, fy + 4, 2, 0.3)
    return fy + 4, ty


def block(c, x, foot, w, fh, dh, face, top=None, edge=None):
    """A plain block, square on with its top from above. Returns
    (face_top_row, deck_top_row)."""
    r = edge or (face if not callable(face) else top)
    return storey_block(c, x, foot, w, fh, face, r, top, dh=dh, ov=0)


def enclosure(c, L, R, base, wall_h, court, back_h, stone, top, floor, inner=None, cope=9):
    """The back and sides of a walled precinct: the back wall's inner face,
    copings round three sides from above with square piers at the corners,
    the court floor between them in the walls' shade. The front wall comes
    later, over whatever stands in the court. Returns the rows: court front
    (fc), court back (back), the back wall's foot (bf) and the top."""
    fc = base - wall_h - cope
    back = fc - court
    bf = back - back_h
    if inner:
        inner(c, L + cope, bf, R - L - 2 * cope, back_h)
    else:
        bevel(c, L + cope, bf, R - L - 2 * cope, back_h, stone)
    floor(c, L + cope, back, R - L - 2 * cope, court + 1)
    fp.cast_down(c, L + cope, R - cope, back, 4, 0.3)
    fp.cast_right(c, L + cope, back - back_h, fc + 1, 4, 0.28)
    e = ink(stone)
    for x in (L, R - cope):
        c.rect(x, bf - cope, cope, fc - bf + cope, top[1])
        c.rect(x, bf - cope, 1, fc - bf + cope, top[0])
        c.rect(x + cope - 2, bf - cope, 2, fc - bf + cope, top[2])
        c.rect(x - 1, bf - cope, 1, fc - bf + cope, e)
        c.rect(x + cope, bf - cope, 1, fc - bf + cope, e)
    cornice(c, L, bf, R - L, cope - 3, stone, top)
    for x in (L - 2, R - cope - 2):
        pier(c, x, bf + 1, cope + 4, stone, top)
    return dict(fc=fc, back=back, bf=bf, top=bf - cope - 4)


def pier(c, x, foot, w, stone, top):
    """A square pier cap where copings meet, a step proud of them."""
    cornice(c, x, foot, w, w - 5, stone, top, lip=4)
    c.rect(x + 2, foot - w + 1, w - 4, 1, top[0])


def front_wall(c, L, R, base, wall_h, face, stone, top, cope=9, gap=None):
    """The precinct's front wall to the street under its coping, a square
    pier at each end. `gap` = (x0, x1) leaves the gateway."""
    spans = [(L, R)] if not gap else [(L, gap[0]), (gap[1], R)]
    for x0, x1 in spans:
        if x1 - x0 > 2:
            storey_block(c, x0, base, x1 - x0, wall_h, face, stone, top, dh=cope - 3, ov=0)
    for x in (L - 2, R - cope - 2):
        fy = base - wall_h - 2
        bevel(c, x, fy, cope + 4, wall_h + 2, stone, 3)
        c.rect(x - 1, fy, 1, wall_h + 2, ink(stone)); c.rect(x + cope + 4, fy, 1, wall_h + 2, ink(stone))
        pier(c, x, fy + 1, cope + 4, stone, top)


def framed_door(c, cx, base, w, h, stone, sill=True):
    """A doorway in a stone frame: jambs lit on their faces with a reveal of
    shade inside, a lintel block projecting over them, the dark of the door
    with a little light on its floor, a threshold step before it."""
    jw = 5
    x0 = cx - w // 2 - jw
    e = ink(stone)
    for jx in (x0, cx + w // 2):
        bevel(c, jx, base - h, jw, h, stone, 2)
        c.rect(jx - 1, base - h, 1, h, e); c.rect(jx + jw, base - h, 1, h, e)
    c.rect(cx - w // 2, base - h, w, h, VOID)
    c.rect(cx - w // 2, base - h, 2, h, mix(VOID, stone[6], 0.35))
    c.rect(cx - w // 2, base - h, w, 2, mix(VOID, stone[6], 0.35))
    c.rect(cx - w // 2 + 2, base - 2, w - 2, 2, mix(VOID, stone[5], 0.3))
    cornice(c, x0 - 3, base - h + 1, w + 2 * jw + 6, 3, stone, lip=6)
    fp.cast_down(c, x0, x0 + w + 2 * jw, base - h + 2, 2, 0.3)
    if sill:
        cornice(c, x0 - 4, base + 2, w + 2 * jw + 8, 2, stone, lip=3)


def flagstaff(c, x, foot, h, stone, metal=GOLD):
    """A temple flagstaff on a stepped base: the treads from above, the gilt
    pole lit on its left and banded, its capital, its shadow on the court."""
    cornice(c, x - 10, foot, 21, 7, stone, lip=4)
    cornice(c, x - 6, foot - 8, 13, 5, stone, lip=4)
    py = foot - 15
    for k in range(6):
        for xx in range(x + 7, x + 13):
            fp.shade(c, xx - k, foot - 2 - k, 0.25)
    for yy in range(py - h, py):
        c.p(x - 1, yy, metal[1]); c.p(x, yy, metal[2]); c.p(x + 1, yy, metal[3]); c.p(x + 2, yy, metal[5])
    for yy in range(py - h + 10, py - 4, 13):
        c.rect(x - 2, yy, 6, 1, metal[0]); c.rect(x - 2, yy + 1, 6, 1, metal[3]); c.rect(x + 3, yy, 1, 2, metal[5])
    so.lathe(c, x + 0.5, py - h + 1, [(0, 2), (2, 4), (4, 4), (5, 2)], metal)
    c.rect(x - 1, py - h - 7, 4, 3, metal[2]); c.p(x - 1, py - h - 7, metal[0])


def pot_row(c, cx, y, w, n, s=1.0):
    """The row of gilt pots (kalasha) along a ridge, the middle one largest
    and crowned with a second."""
    for j in range(n):
        x = round(cx - w / 2 + (j + 0.5) * w / n)
        if j == n // 2:
            so.lathe(c, x, y, [(0, 3 * s), (4 * s, 5.5 * s), (8 * s, 4.5 * s), (10 * s, 2.2), (11 * s, 2.2)], GOLD)
            so.lathe(c, x, y - round(11 * s), [(0, 2.5 * s), (3 * s, 3.5 * s), (6 * s, 2.5 * s), (8 * s, 1)], GOLD)
        else:
            so.lathe(c, x, y, [(0, 2.5 * s), (3 * s, 4 * s), (6 * s, 3.2 * s), (8 * s, 1.5), (10 * s, 0.8)], GOLD)


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
    from art.buildings import remember
    template = recipes['religious-mesopotamian-temple-small-0']
    for name, recipe, scale, look, kind, spec, builders in entries():
        group = group_of(builders)

        def measure():
            im, info = paint(kind, spec, builders)
            return footprint(info), info['door_x'] - info['x0'], im.height
        (fw, fh), door_x, height = remember(['sacred', kind, spec, group], module(group).__name__, measure)
        door = min(fw - 1, max(0, door_x // 16))
        recipes[name] = {
            **{k: v for k, v in template.items() if k not in ('shadowFrame', 'sacredVoxel', 'style', 'roofVoid')},
            'label': spec.get('label', recipe.replace('-', ' ').capitalize()),
            'description': spec.get('description', ''),
            'family': recipe, 'recipe': recipe, 'religious': True, 'front': True,
            'frontAncient': ('sacred', dict(kind=kind, spec=spec, group=group)),
            'footprint': [fw, fh], 'entrance': [door, fh], 'height': height,
            'roof': spec.get('roof', 'gable')}
    for m in modules():
        for name, (kind, spec) in getattr(m, 'HALLS', {}).items():
            if name in recipes:
                recipes[name] = {**recipes[name], 'front': True,
                                 'frontAncient': ('sacred', dict(kind=kind, spec=spec, group=m.__name__.split('_')[-1]))}


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
        if not info.get('doorless') and not info.get('summit_door') and info['door_h'] < FIGURE:
            out.append(f'{name}: door {info["door_h"]}px is shorter than the {FIGURE}px adult')
    return out


def studies():
    """For front_audit: every frame with its door height."""
    from types import SimpleNamespace
    for name, recipe, scale, look, kind, spec, builders in entries():
        im, info = paint(kind, spec, builders)
        # A shrine's door on a pyramid's summit is drawn to the shrine, not the street.
        yield (name, im, SimpleNamespace(roof_span=(0, im.width), stacks=[]),
               None if info.get('doorless') or info.get('summit_door') else info['door_h'], [])
    for m in modules():
        for name, (kind, spec) in getattr(m, 'HALLS', {}).items():
            info = {}
            im = m.BUILDERS[kind](dict(spec), info)
            yield name, im, SimpleNamespace(roof_span=(0, im.width), stacks=[]), None, []


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
