"""Houses of mainland and island Southeast Asia, raised on posts.

    .venv/bin/python scripts/art/front_seasia.py artifacts/front-seasia.png

The floor stands on posts above floods, damp and animals, a ladder up to the
door, as the Borobudur reliefs show for ninth-century Java and as the house
was built from Burma to the islands for a thousand years after. Javanese:
walls of woven bamboo (sawali) in a bamboo frame, a palm-thatch roof whose
ridge rises to its ends. Burmese: teak planks under a straight hipped thatch.
Windows are unglazed, closed by a lattice or a board.
"""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import ramp  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_eave as ev  # noqa: E402
from art.front_house import bevel  # noqa: E402

BAMBOO = ramp(82, 0.075, lift=0.03)
TEAK = ramp(40, 0.08, lift=-0.14)


def sawali(c, x0, y0, w, h):
    """Split bamboo woven in a herringbone twill, framed by whole culms: the
    strips run in chevrons, each lit along its upper edge."""
    for yy in range(y0, y0 + h):
        for xx in range(x0, x0 + w):
            lx, ly = xx - x0, yy - y0
            band = (lx // 8) % 2
            k = (ly + (lx % 8 if band else 7 - lx % 8)) % 6
            c.p(xx, yy, BAMBOO[1] if k == 0 else BAMBOO[2] if k < 3 else BAMBOO[3] if k < 5 else BAMBOO[4])
    n = max(2, round(w / 30))
    for k in range(n + 1):
        px = round(x0 + k * (w - 4) / n)
        bevel(c, px, y0, 4, h, BAMBOO, 2)
        for yy in range(y0 + 9, y0 + h, 12):
            c.rect(px, yy, 4, 1, BAMBOO[5])
    bevel(c, x0, y0 + h // 2 - 2, w, 4, BAMBOO, 2)


def teak(c, x0, y0, w, h):
    fm.boards(c, x0, y0, w, h, TEAK)
    for px in (x0, x0 + w - 5):
        bevel(c, px, y0, 5, h, TEAK, 3)


ev.WALL['sawali'] = sawali
ev.WALL['teak'] = teak


def stilt_openings(h):
    """A plank door at the ladder's head, an unglazed window either side
    behind a lattice."""
    c, x0, W = h.c, h.x0, h.W
    cx = x0 + W // 2
    h.door_x, h.door_h = cx, 40
    op.door_plank(c, cx - 10, h.base - 40, 20, 40)
    if W < 110:
        return
    for wx in (x0 + W // 5, x0 + W - W // 5):
        top = h.base - 34
        op.frame_asian(c, wx - 9, top, 18, 14, None)
        op.lattice(c, wx - 9, top, 18, 14)
        op.reveal(c, wx - 9, top, 18, 14, 2)


ev.OPENINGS['stilt'] = stilt_openings


def stilt(spec=None, info=None):
    s = dict(W=132, storeys=['sawali'], heights=[46], roof='palm', tone='attap', hip=False, saddle=7, stilts=28,
             openings='stilt', seed=0, wear=0.3)
    s.update(spec or {})
    h = ev.VernacularHouse(s)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


BUILDERS = {'stilt': stilt}
STUDIES = [
    ('java', 'stilt', {}),
    ('java-small', 'stilt', dict(W=96, saddle=5, seed=2)),
    ('burma', 'stilt', dict(W=150, storeys=['teak'], hip=True, saddle=0, tone='palm', seed=3)),
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
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-seasia.png'
    bg.resize((W * 2, H * 2), Image.NEAREST).convert('RGB').save(out)
    print(f'wrote {out}')
