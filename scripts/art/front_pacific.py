"""The Polynesian fare.

    .venv/bin/python scripts/art/front_pacific.py artifacts/front-pacific.png

Society Islands and their neighbours before contact: a house of posts and a
great hipped roof of pandanus or coconut thatch, its ends rounded, its walls
of upright reeds or bamboo set apart so the air moves through, an opening
for a door. The roof is most of the house.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_materials import ramp  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_eave as ev  # noqa: E402
from art.front_house import bevel  # noqa: E402

REED = ramp(76, 0.07, lift=0.0)
PANDANUS = ramp(60, 0.06, lift=-0.04)
INSIDE = (46, 34, 42, 255)


def reeds(c, x0, y0, w, h):
    """Upright reeds a finger apart, the dark of the house between them,
    lashed to a rail at mid height."""
    for yy in range(y0, y0 + h):
        for xx in range(x0, x0 + w):
            a = (xx - x0) % 4
            c.p(xx, yy, INSIDE if a == 3 else REED[1] if a == 0 else REED[2] if a == 1 else REED[4])
    for ly in (y0 + 6, y0 + h - 12):
        bevel(c, x0, ly, w, 3, REED, 3)


ev.WALL['reeds'] = reeds
ev.TONES['pandanus'] = PANDANUS


def fare_openings(h):
    """An open doorway: the reeds left out, the house dark inside."""
    c, cx = h.c, h.x0 + h.W // 2
    h.door_x, h.door_h = cx, 40
    c.rect(cx - 11, h.base - 40, 22, 40, INSIDE)
    c.rect(cx - 11, h.base - 3, 22, 3, (70, 54, 56, 255))
    for px in (cx - 15, cx + 11):
        bevel(c, px, h.base - 44, 4, 44, ramp(42, 0.07, lift=-0.2), 2)
    op.cast(c, cx - 11, h.base - 40, 22, 6, 0.6)


ev.OPENINGS['fare'] = fare_openings


def fare(spec=None, info=None):
    s = dict(W=144, storeys=['reeds'], heights=[42], roof='palm', tone='pandanus', hip=True, openings='fare',
             seed=0, wear=0.3)
    s.update(spec or {})
    h = ev.VernacularHouse(s)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


BUILDERS = {'fare': fare}
STUDIES = [
    ('fare', 'fare', {}),
    ('fare-small', 'fare', dict(W=100, seed=2)),
]


if __name__ == '__main__':
    from PIL import Image
    from art.reference import current_adult
    ims = [BUILDERS[kind](spec) for _, kind, spec in STUDIES]
    a = current_adult()
    W = sum(i.width + 8 for i in ims) + a.width + 10
    H = max(i.height for i in ims) + 8
    bg = Image.new('RGBA', (W, H), (214, 206, 186, 255))
    x = 4
    for im in ims:
        bg.alpha_composite(im, (x, H - 4 - im.height)); x += im.width + 8
    bg.alpha_composite(a, (x, H - 8 - a.height))
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-pacific.png'
    bg.resize((W * 2, H * 2), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
