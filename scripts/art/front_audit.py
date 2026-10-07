"""Audit of the front-on art: the rules a picture can be checked against.

    python3 scripts/art/front_audit.py        # exit 1 on a fault

What it checks, and why each rule exists, is in
.claude/skills/building-art/SKILL.md. It cannot judge beauty; it catches the
drift that crept in every time a session forgot the rules: black outlines,
dithered gradients, chimneys clipping the roof line, doors smaller than the
people who use them, ramps that stop shifting hue.
"""
from pathlib import Path
import colorsys
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_style import FIGURE  # noqa: E402
from art.front_materials import RAMPS, COOL_HUE  # noqa: E402

MAX_COLOURS = 360
# Colours used by one or two pixels: noise a hand-made palette would not have.
MAX_STRAY = 0.08
DITHER_SHARE = 0.0005


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def hue(c):
    h, l, s = colorsys.rgb_to_hls(*(v / 255 for v in c[:3]))
    return h * 360, s


def ramp_faults():
    out = []
    for name, r in RAMPS.items():
        ls = [lum(c) for c in r]
        if any(b >= a for a, b in zip(ls, ls[1:])):
            out.append(f'ramp {name}: lightness does not fall step by step')
        h0, s0 = hue(r[2])
        h1, s1 = hue(r[6])
        if s0 > 0.18 and s1 > 0.08:
            d0 = abs((h0 - COOL_HUE + 180) % 360 - 180)
            d1 = abs((h1 - COOL_HUE + 180) % 360 - 180)
            if d1 > d0 + 2:
                out.append(f'ramp {name}: its shadows drift away from violet')
    return out


def image_faults(name, im):
    out = []
    px = im.load()
    w, h = im.size
    opaque, colours, black, dither = 0, set(), 0, 0
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] < 200:
                continue
            opaque += 1
            colours.add(p[:3])
            if max(p[:3]) < 14:
                black += 1
    for y in range(h - 3):
        for x in range(w - 3):
            a, b = px[x, y], px[x + 1, y]
            if a[3] < 200 or b[3] < 200 or a == b:
                continue
            if all(px[x + i, y + j] == (a if (i + j) % 2 == 0 else b) for i in range(4) for j in range(4)):
                dither += 1
    if black:
        out.append(f'{name}: {black} pure black pixels (outlines are tinted)')
    if dither > max(20, opaque * DITHER_SHARE):
        out.append(f'{name}: checkerboard dithering in {dither} places (use stepped bands)')
    from collections import Counter
    use = Counter(px[x, y][:3] for y in range(h) for x in range(w) if px[x, y][3] >= 200)
    stray = sum(1 for v in use.values() if v <= 2)
    if stray > len(use) * MAX_STRAY:
        out.append(f'{name}: {stray} of {len(use)} colours are strays of one or two pixels')
    # A great church carries more materials than a cottage; the cap grows a
    # little with the sprite.
    cap = MAX_COLOURS + max(0, opaque - 40000) // 500
    if len(colours) > cap:
        out.append(f'{name}: {len(colours)} colours (cap {cap}); a material has gone noisy')
    return out


def geometry_faults(name, b, door_h, windows):
    out = []
    if door_h is not None and door_h < FIGURE:
        out.append(f'{name}: door {door_h}px is shorter than the {FIGURE}px adult')
    lo, hi = b.roof_span
    for x, w in b.stacks:
        if x < lo or x + w > hi:
            out.append(f'{name}: a chimney stands outside the roof outline ({x}..{x + w} vs {lo}..{hi})')
    for x, y, ww, hh, _ in windows:
        if hh < FIGURE * 0.3:
            out.append(f'{name}: a window {hh}px tall reads as a slit next to the adult')
    return out


def subjects():
    """Every front-on building the code can make, by its catalogue."""
    from art.front_kit import Front, IMMEUBLES, spec
    from art.front_house import GableHouse, ROOFS
    for n in IMMEUBLES:
        f = Front(spec(n))
        im, _ = f.build()
        yield n, im, f, f.door[2] if f.door else None, f.windows
    from art.front_houses import EUROPEAN
    from art.front_eave import EaveHouse
    for fam, (_, specs) in EUROPEAN.items():
        for suffix, sp in specs:
            if sp.get('form') == 'gable':
                continue
            e = EaveHouse(sp)
            im = e.build()
            yield f'{fam}-{suffix}', im, e, e.door_h, []
    from art.front_civic import CivicHall, HALL_STYLES
    from art.front_church import Church, STYLES as CHURCH_STYLES
    for fam, variants in HALL_STYLES.items():
        for label, sp in variants:
            h = CivicHall(dict(sp))
            im = h.build()
            yield f'hall-{fam}-{label}', im, h, h.door_h, []
    for style in CHURCH_STYLES:
        for size in ('small', 'medium', 'large'):
            ch = Church(style, size)
            im = ch.build()
            ch.roof_span, ch.stacks = (0, ch.c.w), []
            yield f'church-{style}-{size}', im, ch, 40, []
    for roof in ROOFS:
        for W in (120, 152):
            g = GableHouse(roof=roof, W=W, lean_to=W > 140)
            im = g.build()
            yield f'gable-{roof}-{W}', im, g, g.door_h, []
    from types import SimpleNamespace
    from art.front_classical import BUILDERS, studies, regional_studies
    for name, _, kind, spec in (*studies(), *regional_studies()):
        info = {}
        im = BUILDERS[kind](spec, info)
        b = SimpleNamespace(roof_span=(0, im.width), stacks=[])
        yield f'classical-{name}', im, b, info['door_h'], []


def audit():
    faults = ramp_faults()
    n = 0
    for name, im, b, door_h, windows in subjects():
        faults += image_faults(name, im)
        faults += geometry_faults(name, b, door_h, windows)
        n += 1
    for f in faults:
        print(f)
    print(f'front audit: {"clean" if not faults else f"{len(faults)} faults"} ({n} buildings, {len(RAMPS)} ramps)')
    return not faults


if __name__ == '__main__':
    sys.exit(0 if audit() else 1)
