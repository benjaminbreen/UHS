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
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import ramp  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_eave as ev  # noqa: E402
from art.front_house import bevel  # noqa: E402
from art.front_weather import weather  # noqa: E402
from art.front_kit import outline, consolidate  # noqa: E402

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


# ------------------------------------------------------------------ more looks
#
# khmer       palm-leaf panels in a timber frame on tall posts, attap gable,
#             a porch gable of plain boards over the stair
# thai        ruean thai: teak panel walls, a steep tiled gable whose barge
#             boards end in upturned hooks (ngao), a sunray gable (jua) over
#             the door, a veranda deck (chan)
# vietnamese  Red River delta: on the ground, earth walls, a low heavy
#             rice-straw hip over a front veranda, lattice-topped door leaves
# malay       rumah Melayu: vertical boards, louvred full-height windows, a
#             steep attap gable with a carved gable screen (tebar layar) over
#             the porch, a timber front stair
# filipino    bahay kubo: a small sawali house on bamboo posts, a steep nipa
#             hip, a window shutter propped out on a stick

PALMLEAF = ramp(74, 0.065, lift=-0.02)
CHENGAL = ramp(32, 0.085, lift=-0.2)
EARTHWALL = ramp(62, 0.06, lift=-0.04)
TILE_THAI = ramp(34, 0.1, lift=-0.13)
RICE = ramp(74, 0.06, lift=-0.08)
ev.TONES['tile-thai'] = TILE_THAI
ev.TONES['rice-straw'] = RICE
INSIDE = (46, 34, 42, 255)


def palm_panels(c, x0, y0, w, h):
    """Sleuk panels: leaf strips folded over laths in overlapping rows, each
    row lit along its fold, set in a timber frame."""
    for yy in range(y0, y0 + h):
        for xx in range(x0, x0 + w):
            ly = (yy - y0) % 5
            k = 2 if ly == 0 else 3 if ly < 3 else 4 if ly < 4 else 5
            if (xx - x0 + 3 * ((yy - y0) // 5)) % 7 == 0 and ly:
                k += 1
            c.p(xx, yy, PALMLEAF[k])
    n = max(2, round(w / 26))
    for k in range(n + 1):
        bevel(c, round(x0 + k * (w - 4) / n), y0, 4, h, TEAK, 3)
    for ly in (y0, y0 + h // 2 - 1):
        bevel(c, x0, ly, w, 3, TEAK, 3)


def teak_panels(c, x0, y0, w, h):
    """Fa pakon: raised teak panels in a frame of stiles and rails, each panel
    lit along its top and left, shaded on its bottom and right."""
    c.rect(x0, y0, w, h, TEAK[4])
    n = max(2, round(w / 22))
    rails = (y0, y0 + h // 3, y0 + h - 4)
    for k in range(n):
        px0 = round(x0 + k * w / n) + 3
        px1 = round(x0 + (k + 1) * w / n) - 1
        for a, b in zip(rails, rails[1:]):
            raised(c, px0, a + 4, px1 - px0, b - a - 4, TEAK, 3)
    for k in range(n + 1):
        bevel(c, min(x0 + w - 3, round(x0 + k * w / n)), y0, 3, h, TEAK, 2)
    for ry in rails:
        bevel(c, x0, ry, w, 4, TEAK, 2)


def malay_boards(c, x0, y0, w, h):
    """Upright tongued boards in chengal, a lit edge on each, a skirting
    rail along the floor and a rail at sill height."""
    fm.boards(c, x0, y0, w, h, CHENGAL, board=6)
    for ly in (y0 + h - 6, y0 + h // 2):
        bevel(c, x0, ly, w, 4, CHENGAL, 2)
    for px in (x0, x0 + w - 4):
        bevel(c, px, y0, 4, h, CHENGAL, 2)


def earth_wall(c, x0, y0, w, h):
    fm.render(c, x0, y0, w, h, EARTHWALL)


def raised(c, x, y, w, h, r, body=3):
    if w < 3 or h < 3:
        return
    c.rect(x, y, w, h, r[body])
    c.rect(x, y, w, 1, r[body - 1]); c.rect(x, y, 1, h, r[body - 1])
    c.rect(x, y + h - 1, w, 1, r[body + 2]); c.rect(x + w - 1, y, 1, h, r[body + 2])


ev.WALL['palm-panels'] = palm_panels
ev.WALL['teak-panels'] = teak_panels
ev.WALL['malay-boards'] = malay_boards
ev.WALL['earth'] = earth_wall


def plank_door(h, w=20, dh=40, r=TEAK):
    c, cx = h.c, h.x0 + h.W // 2
    h.door_x, h.door_h = cx, dh
    x, y = cx - w // 2, h.base - dh
    bevel(c, x - 3, y - 3, w + 6, dh + 3, r, 2)
    fm.boards(c, x, y, w, dh, r, board=5)
    c.rect(x, y, 1, dh, r[6])
    op.cast(c, x, y, w, 3, 0.6)
    return x, y


def latticed(c, x, y, w, h, r):
    """An unglazed window behind upright bars, the room dark between them."""
    c.rect(x, y, w, h, INSIDE)
    for xx in range(x + 1, x + w - 1, 3):
        c.rect(xx, y, 1, h, r[3]); c.rect(xx + 1, y, 1, h, r[5])
    op.reveal(c, x, y, w, h, 2)


def khmer_openings(h):
    c, x0, W = h.c, h.x0, h.W
    plank_door(h)
    for wx in (x0 + W // 5, x0 + W - W // 5):
        top = h.base - 32
        bevel(c, wx - 11, top - 3, 22, 18, TEAK, 2)
        latticed(c, wx - 8, top, 16, 12, TEAK)


def thai_openings(h):
    c, x0, W = h.c, h.x0, h.W
    plank_door(h, 20, 40)
    for wx in (x0 + W // 5, x0 + W - W // 5):
        top = h.base - 34
        bevel(c, wx - 11, top - 3, 22, 22, TEAK, 2)
        c.rect(wx - 8, top, 16, 16, INSIDE)
        for lx in (wx - 8 - 7, wx + 8):  # leaves folded back against the wall
            raised(c, lx, top, 7, 16, TEAK, 3)
        op.reveal(c, wx - 8, top, 16, 16, 2)


def viet_openings(h):
    """The front of the main room: a row of wooden leaves between the
    columns, open lattice above, solid boards below; the middle bay opens."""
    c, x0, W, base = h.c, h.x0, h.W, h.base
    top = h.eave + 16
    n = 3 if W < 150 else 5
    bw = (W - 8) / n
    h.door_x, h.door_h = x0 + W // 2, 42
    for k in range(n):
        bx0 = round(x0 + 4 + k * bw) + 2
        bx1 = round(x0 + 4 + (k + 1) * bw) - 2
        mid = k == n // 2
        bevel(c, bx0 - 2, top - 3, bx1 - bx0 + 4, base - top + 3, TEAK, 2)
        if mid:
            c.rect(bx0, base - 42, bx1 - bx0, 42, INSIDE)
            for lx, sgn in ((bx0, 1), (bx1 - 5, -1)):
                raised(c, lx, base - 42, 5, 42, TEAK, 3)
            op.cast(c, bx0, base - 42, bx1 - bx0, 4, 0.6)
            ly = top
            lh = base - 42 - top - 2
        else:
            ly, lh = top, (base - top) // 2
            fm.boards(c, bx0, ly + lh, bx1 - bx0, base - ly - lh, TEAK, board=5)
            c.rect(bx0, ly + lh, bx1 - bx0, 2, TEAK[2])
        if lh > 4:
            c.rect(bx0, ly, bx1 - bx0, lh, INSIDE)
            for xx in range(bx0, bx1):
                for yy in range(ly, ly + lh):
                    if (xx - bx0) % 4 == 0 or (yy - ly) % 4 == 0:
                        c.p(xx, yy, TEAK[3] if (xx - bx0) % 4 == 0 else TEAK[2])
            op.reveal(c, bx0, ly, bx1 - bx0, lh, 2)


def malay_openings(h):
    """A full-height window either side of the door, its two leaves louvred,
    a pierced kerawang panel over each opening for the air."""
    c, x0, W = h.c, h.x0, h.W
    x, y = plank_door(h, 20, 42, CHENGAL)
    kerawang(c, x - 1, y - 9, 22, 6)
    for wx in (x0 + W // 5, x0 + W - W // 5):
        if abs(wx - h.door_x) < 30:
            continue
        top = h.base - 38
        bevel(c, wx - 12, top - 3, 24, 37, CHENGAL, 2)
        for lx in (wx - 9, wx):
            c.rect(lx, top, 9, 32, CHENGAL[5])
            for yy in range(top + 1, top + 31, 3):
                c.rect(lx + 1, yy, 7, 1, CHENGAL[2]); c.rect(lx + 1, yy + 1, 7, 1, CHENGAL[4])
            c.rect(lx, top, 1, 32, CHENGAL[6])
        c.rect(wx, top, 1, 32, CHENGAL[6])
        kerawang(c, wx - 11, top - 10, 22, 6)


def kerawang(c, x, y, w, hh):
    """A pierced board: a row of small carved openings in a lit frame."""
    raised(c, x, y, w, hh, CHENGAL, 3)
    for xx in range(x + 2, x + w - 3, 4):
        c.rect(xx, y + 2, 2, hh - 4, INSIDE); c.p(xx + 1, y + 2, CHENGAL[5])


def kubo_openings(h):
    """A doorway at the ladder's head; beside it a window whose sawali
    shutter is propped out on a stick, its shadow on the opening."""
    c, x0, W = h.c, h.x0, h.W
    cx = x0 + W // 2 - (W // 8 if h.s['seed'] % 2 else -W // 8)
    h.door_x, h.door_h = cx, 38
    x, y = cx - 9, h.base - 38
    bevel(c, x - 3, y - 3, 24, 41, BAMBOO, 2)
    c.rect(x, y, 18, 38, INSIDE)
    for yy in range(y, y + 38):
        for xx in range(x + 9, x + 18):
            c.p(xx, yy, BAMBOO[(2, 3, 3, 4)[(xx + yy // 3) % 4]])
    c.rect(x + 9, y, 1, 38, BAMBOO[6])
    op.cast(c, x, y, 18, 3, 0.6)
    wx = x0 + W - 30 if cx < x0 + W // 2 else x0 + 12
    top = h.base - 32
    bevel(c, wx - 2, top - 2, 22, 18, BAMBOO, 2)
    c.rect(wx, top, 18, 14, INSIDE)
    # the shutter, hinged at the head, seen from above as it leans out
    sawali(c, wx - 3, top - 8, 24, 6)
    c.rect(wx - 3, top - 2, 24, 1, BAMBOO[6])
    op.cast(c, wx, top, 18, 5, 0.5)
    for k in range(12):
        c.p(wx + 16 - k // 3, top + 14 - k, BAMBOO[3])


for _k, _f in (('khmer', khmer_openings), ('thai', thai_openings), ('viet', viet_openings),
               ('malay', malay_openings), ('kubo', kubo_openings)):
    ev.OPENINGS[_k] = _f


def sunburst(c, x0, x1, y_top, y_base, r, cx):
    """Boards radiating from the foot of the gable, alternately lit."""
    half = (x1 - x0) / 2
    for yy in range(y_top, y_base):
        hw = round(half * (yy - y_top) / (y_base - y_top))
        for xx in range(cx - hw, cx + hw):
            a = math.atan2(y_base - yy, xx - cx + 0.5)
            c.p(xx, yy, r[3] if int(a / 0.2) % 2 else r[5])


class SeasiaHouse(ev.VernacularHouse):
    """The stilt house with a look's own extras: a porch gable over the door,
    hooked barge boards, a deck beside the floor, a stair or a ladder."""

    def gable(self):
        s, c = self.s, self.c
        cx = self.door_x
        gw = min(72, max(46, self.W // 3)) // 2 * 2
        r = self.tone
        apex = self.top + 6
        foot = self.eave + 6
        half = gw // 2
        # the face, under the two rakes
        for yy in range(apex, foot):
            t = (yy - apex) / (foot - apex)
            hw = round(half * t)
            for xx in range(cx - hw, cx + hw):
                if s['gable'] == 'sunburst':
                    c.p(xx, yy, TEAK[5])
                elif s['gable'] == 'boards':
                    c.p(xx, yy, TEAK[(3, 4, 4, 5, 6)[(xx - cx) % 5]])
                else:
                    c.p(xx, yy, CHENGAL[(4, 4, 5, 3)[(xx - cx) % 4]])
        if s['gable'] == 'sunburst':
            sunburst(c, cx - half, cx + half, apex, foot, TEAK, cx)
        elif s['gable'] == 'tebar':
            for yy in range(apex + 8, foot - 2, 7):
                t = (yy - apex) / (foot - apex)
                hw = round(half * t) - 3
                for xx in range(cx - hw, cx + hw, 4):
                    c.rect(xx, yy, 2, 3, INSIDE); c.p(xx + 2, yy, CHENGAL[2])
            c.rect(cx - half + 4, foot - 3, gw - 8, 2, CHENGAL[2])
        op.cast(c, cx - half, apex + 2, gw, 4, 0.6)
        # the rakes: thatch rolled over the barge boards, lit on the left
        for yy in range(apex - 3, foot + 3):
            t = (yy - apex) / (foot - apex)
            hw = round(half * t)
            for k in range(7):
                for side in (-1, 1):
                    xx = cx + side * (hw + k - 3)
                    c.p(xx, yy, r[(2 + k // 2) if side < 0 else (4 + k // 3)])
        for xx in range(cx - 3, cx + 4):
            c.p(xx, apex - 4, r[2]); c.p(xx, apex - 3, r[3])
        if s['gable'] in ('tebar', 'sunburst'):
            # tips turned up at the rake's foot and a finial at the apex: the
            # Malay sulur bayung, the Thai ngao and chofa
            wood = CHENGAL if s['gable'] == 'tebar' else TEAK
            big = s['gable'] == 'sunburst'
            hook = ((0, 0), (1, -1), (2, -2), (2, -3), (2, -4), (1, -5)) if big else ((0, 0), (1, -1), (2, -2), (2, -3))
            for side in (-1, 1):
                bx = cx + side * (half + 4)
                for k, (dx, dy) in enumerate(hook):
                    c.p(bx + side * dx, foot + 3 + dy, wood[2 if k else 3])
                    c.p(bx + side * dx, foot + 4 + dy, wood[5])
            for k in range(8 if big else 5):
                c.p(cx, apex - 5 - k, wood[2 if k % 2 else 3])
                if big and k > 4:
                    c.p(cx + 1, apex - 5 - k, wood[5])

    def hooks(self):
        """Thai barge boards: a hooked ngao at each eave corner, a horn at
        each end of the ridge."""
        c = self.c
        L, R = self.x0 - self.over, self.x0 + self.W + self.over - 1
        e, t = self.eave, self.top
        for x, sg in ((L, -1), (R, 1)):
            for y in range(t - 1, e + 4):
                c.p(x, y, TEAK[3 if sg < 0 else 5]); c.p(x - sg, y, TEAK[2 if sg < 0 else 4])
            for k, (dx, dy) in enumerate(((1, 3), (2, 3), (3, 2), (4, 1), (4, 0), (4, -1), (3, -2))):
                c.p(x + sg * dx, e + dy, TEAK[2 if dy < 1 else 4])
                c.p(x + sg * dx, e + dy + 1, TEAK[6])
            for k, (dx, dy) in enumerate(((0, -2), (1, -3), (1, -4), (2, -5), (3, -6), (4, -6))):
                c.p(x + sg * dx, t + dy, TEAK[2]); c.p(x + sg * dx, t + dy + 1, TEAK[5])

    def raise_on_stilts(self):
        s, c, x0, W, top, g = self.s, self.c, self.x0, self.W, self.base, self.ground
        p = self.post
        for yy in range(top, top + 8):
            for xx in range(x0 + 2, x0 + W - 2):
                c.p(xx, yy, (52, 40, 50, 255))
        n = max(2, round(W / 34))
        pw = 5 if s['post'] == 'bamboo' else 6
        for k in range(n + 1):
            px = round(x0 + k * (W - pw) / n)
            bevel(c, px, top, pw, g - top, p, 3)
            if s['post'] == 'bamboo':
                for yy in range(top + 9, g, 11):
                    c.rect(px, yy, pw, 1, p[1])
        bevel(c, x0 - 3, top - 1, W + 6, 6, p, 2)
        for xx in range(x0, x0 + W - 3, 9):
            c.rect(xx, top + 1, 3, 3, p[4]); c.p(xx, top + 1, p[1])
        op.cast(c, x0, top + 5, W, 3, 0.6)
        if s['deck']:
            self.chan(top, g)
        if s['access'] == 'stair':
            self.stair(top, g)
        else:
            lx = self.door_x - 8
            for yy in range(top - 2, g):
                c.p(lx, yy, p[2]); c.p(lx + 1, yy, p[4])
                c.p(lx + 14, yy, p[2]); c.p(lx + 15, yy, p[4])
            for yy in range(top + 4, g - 1, 6):
                c.rect(lx + 2, yy, 12, 1, p[1]); c.rect(lx + 2, yy + 1, 12, 1, p[4])
        self.base = g

    def chan(self, top, g):
        """The open deck beside the house at floor height, on its own
        posts, a low rail round it, its boards seen from above."""
        c, p = self.c, self.post
        x0 = self.x0 + self.W + 3
        w = min(30, c.w - x0 - 2)
        for yy in range(top - 14, top):
            for xx in range(x0, x0 + w):
                c.p(xx, yy, TEAK[(3, 3, 4, 4, 5)[(yy - top) % 5]])
        bevel(c, x0, top - 1, w, 5, TEAK, 2)
        for px in (x0 + 2, x0 + w - 6):
            bevel(c, px, top + 4, 5, g - top - 4, p, 3)
        bevel(c, x0 + w - 3, top - 22, 3, 22, TEAK, 2)
        bevel(c, x0, top - 22, w, 3, TEAK, 2)
        for xx in range(x0 + 4, x0 + w - 3, 5):
            c.rect(xx, top - 19, 2, 17, TEAK[3]); c.p(xx + 1, top - 19, TEAK[5])

    def stair(self, top, g):
        """A timber stair up to the door, its treads lit, a rail each side."""
        c, p = self.c, self.post
        cx = self.door_x
        w = 22
        n = max(3, (g - top) // 6)
        for i in range(n):
            y = top + 2 + round(i * (g - top - 2) / n)
            hh = round((g - top - 2) / n)
            c.rect(cx - w // 2, y, w, hh, CHENGAL[5])
            c.rect(cx - w // 2, y, w, 2, CHENGAL[2])
            c.rect(cx - w // 2, y + 2, w, 1, CHENGAL[3])
        for sx in (cx - w // 2 - 3, cx + w // 2):
            bevel(c, sx, top - 10, 3, g - top + 10, CHENGAL, 2)
            c.rect(sx - 1, top - 12, 5, 3, CHENGAL[2])

    def build(self):
        s = self.s
        self.post = BAMBOO if s['post'] == 'bamboo' else ramp(42, 0.07, lift=-0.2)
        self.walls()
        self.openings()
        if s['gallery']:
            self.gallery()
        self.roof()
        if s['gable']:
            self.gable()
        if s['hooks']:
            self.hooks()
        x0, x1 = self.x0, self.x0 + self.W
        walls = {(x, y) for y in range(self.eave, self.base) for x in range(x0, x1)}
        weather(self.c, dict(roof=self.roof_px, roof_shade=set(), eave_y=lambda x: self.eave, walls=walls,
                             stone=set(), sills=self.sills, chimneys=[]), s['wear'], s['seed'])
        if s['stilts']:
            self.raise_on_stilts()
        self.roof_span = (x0 - self.over, x1 + self.over)
        self.stacks, self.stack_boxes = [], []
        outline(self.c)
        consolidate(self.c)
        return self.c.im


LOOKS = {
    'khmer': dict(W=136, storeys=['palm-panels'], heights=[44], roof='palm', tone='attap', hip=False, saddle=0,
                  stilts=40, openings='khmer', gable='boards', access='stair', wear=0.35),
    'thai': dict(W=128, storeys=['teak-panels'], heights=[48], roof='plain', tone='tile-thai', hip=False, saddle=0,
                 rise=70, stilts=34, openings='thai', hooks=True, deck=True, gable='sunburst', wear=0.25),
    'vietnamese': dict(W=150, storeys=['earth'], heights=[50], roof='thatch', tone='rice-straw', hip=True, rise=46,
                       stilts=0, openings='viet', gallery=True, wear=0.5),
    'malay': dict(W=140, storeys=['malay-boards'], heights=[50], roof='palm', tone='attap', hip=False, saddle=0,
                  rise=72, stilts=30, openings='malay', gable='tebar', access='stair', wear=0.3),
    'filipino': dict(W=96, storeys=['sawali'], heights=[42], roof='palm', tone='attap', hip=True, saddle=0, rise=58,
                     stilts=30, openings='kubo', post='bamboo', wear=0.4),
}


def seasia(spec=None, info=None):
    spec = dict(spec or {})
    look = spec.pop('look')
    s = dict(roof='palm', seed=0, gable=None, hooks=False, deck=False, access='ladder', post='timber')
    s.update(LOOKS[look])
    s.update(spec)
    h = SeasiaHouse(s)
    im = h.build()
    if info is not None:
        info.update(x0=h.x0, W=h.W, base=h.base, door_x=h.door_x, door_h=h.door_h)
    return im


BUILDERS = {'stilt': stilt, 'seasia': seasia}
STUDIES = [
    ('java', 'stilt', {}),
    ('java-small', 'stilt', dict(W=96, saddle=5, seed=2)),
    ('burma', 'stilt', dict(W=150, storeys=['teak'], hip=True, saddle=0, tone='palm', seed=3)),
    ('khmer', 'seasia', dict(look='khmer')),
    ('thai', 'seasia', dict(look='thai', seed=1)),
    ('vietnamese', 'seasia', dict(look='vietnamese', seed=2)),
    ('vietnamese-small', 'seasia', dict(look='vietnamese', W=100, seed=5)),
    ('malay', 'seasia', dict(look='malay', seed=3)),
    ('filipino', 'seasia', dict(look='filipino', seed=4)),
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
