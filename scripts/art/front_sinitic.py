"""Chinese and Korean houses, halls and compounds, and Japanese town houses,
drawn front-on: walls square on, roofs from above at moderate depth.

    .venv/bin/python scripts/art/front_sinitic.py artifacts/front-sinitic/sheet.png

One hall builder covers every eave-front building: a stone terrace, a front
either of timber bays (posts, beam, lattice over a brick sill, doors) or of a
masonry wall (lime-washed, grey brick or rammed earth) with a framed door,
and a roof of round tiles in columns down the slope with their end caps and
drip tiles along the eave. What makes a region is the spec, from STYLES:

  south-chinese  lime-washed walls, black tile, horse-head end walls stepped
                 above the roof, a stone door frame under a little tiled hood
  north-chinese  grey brick, red posts, grey tile, plain gables, painted beams
  early-chinese  rammed earth in its courses, black lacquer, a straight hipped
                 roof of big tiles with round cloud-pattern end caps
  korean         white panels in a timber grid on a high stone base, the eaves
                 sweeping up at the corners, a hip-and-gable roof; rice straw
                 for the poor
  japanese       the machiya: koshi lattice, a pent roof over the street, low
                 upper floor of plaster and slatted mushiko windows
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, mix, h2  # noqa: E402
from art import front_openings as op  # noqa: E402
from art import front_parts as fp  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_props as pr  # noqa: E402
from art.front_fixtures import fixture  # noqa: E402
from art.front_weather import weather  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402

# ------------------------------------------------------------------ materials

TILE = ramp(254, 0.013, warm=6, cool=4, lift=-0.12)        # grey qingwa, the north
TILE_DARK = ramp(262, 0.012, warm=6, cool=4, lift=-0.165)   # the south's near-black tile
TILE_HAN = ramp(70, 0.018, warm=6, cool=10, lift=-0.12)     # Han grey, a warmer clay
WHITE = ramp(95, 0.011, lift=0.08)                          # lime wash
GREY_BRICK = ramp(248, 0.012, warm=8, cool=4, lift=-0.06)  # qingzhuan, blue-grey brick
MORTAR = ramp(85, 0.012, lift=0.02)
EARTH = ramp(66, 0.06, lift=-0.02)                          # rammed loess
STONE = ramp(236, 0.013, warm=8, cool=10, lift=-0.04)       # granite steps and plinths
DARK_STONE = ramp(240, 0.01, cool=4, lift=-0.16)                    # the south's door frames
TIMBER = ramp(50, 0.07, lift=-0.08)                         # bare pine, Korea and the poor
DARK_TIMBER = ramp(38, 0.05, lift=-0.19)                    # oiled and smoked
RED = ramp(27, 0.15, lift=-0.13)                            # cinnabar lacquer
BLACK = ramp(285, 0.02, lift=-0.23)                         # black lacquer
GREEN = ramp(168, 0.08, lift=-0.12)                         # caihua green
BLUE = ramp(242, 0.09, lift=-0.12)                          # caihua blue
GOLD = ramp(82, 0.13, lift=0.02)
PAPER = ramp(88, 0.022, lift=0.04)
STRAW = ramp(78, 0.075, lift=-0.04)
RICE_STRAW = ramp(70, 0.065, lift=-0.08)
VOID = (40, 30, 40, 255)
CLOTH = {'indigo': ramp(258, 0.07, lift=-0.18), 'red': ramp(26, 0.14, lift=-0.1)}



def _floor(r):
    """Shadows lean violet and never reach black: the deepest steps of the
    darker materials are pulled toward a deep violet."""
    return [q if max(q[:3]) >= 26 else mix(q, (42, 32, 50, 255), 0.7) for q in r]


(TILE, TILE_DARK, TILE_HAN, GREY_BRICK, STONE, DARK_STONE, TIMBER, DARK_TIMBER, RED, BLACK, GREEN, BLUE,
 STRAW, RICE_STRAW) = map(_floor, (TILE, TILE_DARK, TILE_HAN, GREY_BRICK, STONE, DARK_STONE, TIMBER, DARK_TIMBER,
                                   RED, BLACK, GREEN, BLUE, STRAW, RICE_STRAW))

POSTS = {'red': RED, 'black': BLACK, 'timber': TIMBER, 'dark': DARK_TIMBER}
TILES = {'tile': TILE, 'dark': TILE_DARK, 'han': TILE_HAN}

# ------------------------------------------------------------------ tiles

# A cover tile is four pixels across (its lit crown, body, shade), the pan
# channel between covers two. Courses lap every eight rows, quietly: the ribs
# carry the roof, not a grid.
COVER = (3, 2, 2, 4)
PAN = (5, 5)
PITCH = len(COVER) + len(PAN)
COURSE = 8


def tile(x, y, r, shift=0, big=False):
    """One pixel of a roof of round tiles whose columns run down the slope
    toward us. Tones vary tile by tile, never pixel by pixel."""
    pitch, course = (PITCH + 2, COURSE + 2) if big else (PITCH, COURSE)
    cover = (2, 1, 1, 2, 3, 4) if big else COVER
    lx, ly = x % pitch, y % course
    col, row = x // pitch, y // course
    if lx < len(cover):
        q = cover[lx] + shift
        if ly == course - 1:
            q += 1
        if h2(col, row, 611) < 0.07:
            q += 1
    else:
        q = PAN[lx - len(cover)] + max(0, shift)
    return r[max(0, min(7, q))]


def side_tile(x, y, r, shift=0, left=True):
    """A hip's tiles run sideways: courses as stripes down the screen."""
    ly = y % 5
    q = (3, 2, 2, 3, 5)[ly] + (0 if left else 2) + shift
    if (x + y // 5) % 9 == 0:
        q += 1
    return r[max(0, min(7, q))]


def thatch_px(x, y, r, top, rice=False):
    """Straw over a rounded roof, the courses combed down the slope; rice
    straw is bound under a net of rope."""
    course = 7
    row, ly = (y - top) // course, (y - top) % course
    clump = (x + row * 2) // 3
    rag = int(h2(clump, row, 621) * 2)
    q = 3 if h2(clump, row, 622) < 0.6 else 4
    if ly >= course - 2 + rag - 1:
        q = 5 if ly == course - 1 else 4
    elif ly <= 1:
        q = 2
    if rice and ((x - y) % 9 == 0 or (x + y) % 9 == 0):
        q = 6 if ly % 2 else 5
    return r[max(0, min(7, q))]


# ------------------------------------------------------------------ small sprites

WADANG = ('.bb.', 'bacb', 'bccd', '.dd.')
WADANG_BIG = ('.bbb.', 'bacbb', 'bcdcd', 'bbccd', '.ddd.')
CHIWEN = ('....aa',
          '...abb',
          '.aabbc',
          'abbbcc',
          'bbdbcc',
          'bbbccd',
          '.bccdd',
          '..ccdd')
SCROLL = ('.aab', 'abbc', 'bcbc', 'bccd', '.ccd')
ONI_BIG = ('.aabbbc.', 'abbbbbcc', 'abbddbcc', 'abdbbdcd', 'abbbbbcd', 'abbccbcd', '.bccccd.')
ONI = ('aabbb.', 'abccbb', 'bcbbcb', 'bbccbd', 'bbbbdd', '.dddd.')
DOUGONG = ('aabbbaa', '.bcccb.', '..bcb..')


def glyph(c, x, y, rows, pal, flip=False):
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x + (len(row) - 1 - i if flip else i), y + j, pal[ch])


def shade(c, x, y, k):
    fp.shade(c, x, y, k)


# ------------------------------------------------------------------ the hall


class Hall:
    """An eave-front building of one or two storeys. See the module notes."""

    def __init__(self, spec):
        s = dict(W=128, storeys=1, wall_h=56, upper_h=40, front='timber', wall='white', plinth=8,
                 roof='tile', tone='tile', form='gable', ridge='upturn', curve=1, posts='red',
                 beam='bare', lattice='grid', sill='brick', door='leaves', hood=False, bays=None,
                 couplets=False, lanterns=False, brackets=False, steps=True, rise=None, horse=2,
                 wear=0.4, seed=0, frieze=False, gallery=False, shop=False, edge=True, upper=None, udatsu=False,
                 pent=True)
        s.update(spec)
        self.s = s
        self.r = TILES.get(s['tone'], TILE)
        W = s['W']
        self.W = W
        self.horse = s['form'] == 'horse'
        self.wt = 14 if self.horse else 0
        self.over = 0 if self.horse else (9 if s['roof'] == 'tile' else 7)
        full = 46 if s['roof'] == 'tile' else 52
        self.rise = s['rise'] or max(22, min(full, round(full * (0.45 + 0.55 * min(1.0, W / 150)))))
        walls = s['wall_h'] + (s['upper_h'] if s['storeys'] > 1 else 0)
        head = 26 + (22 if self.horse else 0) + (8 if s['ridge'] in ('swallow', 'chiwen') else 0)
        self.x0 = 16
        self.base = head + self.rise + 8 + walls + s['plinth']
        self.c = C(self.x0 + W + 16, self.base + 6)
        self.roof_px = set()
        self.walls_px = set()
        self.sills = []

    # -------------------------------------------------------- geometry

    def lift(self, x):
        """The eave's curve: how far it rises toward each corner."""
        k = self.s['curve']
        if not k:
            return 0
        L, R = self.x0 - self.over, self.x0 + self.W + self.over
        e = min(x - L, R - 1 - x)
        span = 14 + 4 * k
        return round(k * 1.6 * max(0.0, 1 - e / span) ** 2)

    # -------------------------------------------------------- terrace and walls

    def terrace(self):
        """The stone platform the frame stands on, its top face seen from
        above, and steps up to the door."""
        c, s = self.c, self.s
        p = s['plinth']
        if not p:
            return
        x0, x1 = self.x0 - 3, self.x0 + self.W + 3
        b = self.base
        stone = STONE
        for y in range(b - p, b):
            for x in range(x0, x1):
                k = y - (b - p)
                if k < 3:
                    q = 1 if k == 0 else 2
                else:
                    blk = (x - x0 + ((y - b) // 5 % 2) * 7) // 14
                    q = 3 if (x - x0 + ((y - b) // 5 % 2) * 7) % 14 else 4
                    if (b - y) % 5 == 0:
                        q = 4
                    if h2(blk, (b - y) // 5, 631) < 0.2 and q == 3:
                        q = 2
                c.p(x, y, stone[q])
        for y in range(b - p, b):
            c.p(x0, y, stone[1]); c.p(x1 - 1, y, stone[5])

    def wall_face(self, x, y, w, h, kind):
        c = self.c
        if kind == 'white':
            fm.render(c, x, y, w, h, WHITE)
        elif kind == 'brick':
            fm.brick(c, x, y, w, h, GREY_BRICK, mortar=MORTAR)
        elif kind == 'earth':
            for yy in range(y, y + h):
                lay = (yy - y) // 7
                for xx in range(x, x + w):
                    q = 2 if (yy - y) % 7 else 3
                    if (yy - y) % 7 == 1:
                        q = 1
                    if h2(xx // 9, lay, 641) < 0.18 and (yy - y) % 7 not in (0, 1):
                        q = 3
                    c.p(xx, yy, EARTH[q])
        elif kind == 'plaster-grey':
            fm.render(c, x, y, w, h, ramp(90, 0.016, lift=-0.02))
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.walls_px.add((xx, yy))

    # -------------------------------------------------------- fronts

    def bay_cols(self):
        s = self.s
        x0, W = self.x0 + self.wt, self.W - 2 * self.wt
        n = s['bays'] or max(1, min(7, round(W / 30)))
        if n % 2 == 0:
            n += 1 if W / (n + 1) >= 22 else -1
        n = max(1, n)
        edges = [x0 + round(W * k / n) for k in range(n + 1)]
        return n, edges

    def timber_front(self, top, h, storey=0):
        """Posts on drum stones, a beam under the eave, and in each bay either
        lattice over a brick sill or the doors; the middle bay is the door."""
        c, s = self.c, self.s
        post = POSTS[s['posts']]
        n, edges = self.bay_cols()
        mid = n // 2
        foot = top + h
        self.wall_face(edges[0], top, edges[-1] - edges[0], h, 'white' if s['wall'] == 'white' else s['wall'])
        for k in range(n):
            a, b = edges[k] + 3, edges[k + 1] - 3
            bw = b - a
            if storey == 0 and k == mid and s['door']:
                self.door_bay(a, b, top, foot)
                continue
            if storey == 0 and s['shop'] and k == mid + 1:
                self.shop_bay(a, b, top, foot)
                continue
            sill_h = 0 if storey else max(12, h // 3)
            wy = top + 9
            wh = foot - sill_h - wy - 3
            if sill_h:
                if s['sill'] == 'brick':
                    fm.brick(c, a, foot - sill_h, bw, sill_h, GREY_BRICK, mortar=MORTAR)
                elif s['sill'] == 'board':
                    # lacquer is for posts; the boards between are plain wood
                    wood = TIMBER if s['posts'] in ('red', 'black') else post
                    for yy in range(foot - sill_h, foot):
                        for xx in range(a, b):
                            c.p(xx, yy, wood[3] if (xx - a) % 6 else wood[4])
                else:
                    self.wall_face(a, foot - sill_h, bw, sill_h, 'white')
                for xx in range(a, b):
                    c.p(xx, foot - sill_h - 1, STONE[1]); c.p(xx, foot - sill_h, STONE[3])
            lw = bw - 6
            self.lattice(a + 3, wy, lw, wh, s['lattice'], post)
            self.sills.append((a, foot - sill_h, bw))
        # the beam across the post heads, and the post that carry it
        bh = 6
        for x in range(edges[0] - 2, edges[-1] + 2):
            for k in range(bh):
                c.p(x, top + k, post[(2, 1, 2, 3, 4, 5)[k]])
        if s['beam'] in ('red', 'caihua') and storey == 0:
            self.painted_beam(edges[0], edges[-1], top)
        for e in edges:
            self.post(e, top, foot, post)
        if s['brackets'] and storey == 0:
            for k in range(n):
                cx = (edges[k] + edges[k + 1]) // 2
                glyph(c, cx - 3, top - 3, DOUGONG, {'a': post[1], 'b': post[3], 'c': GREEN[2] if s['beam'] == 'caihua' else post[5]})

    def post(self, x, top, foot, r):
        c = self.c
        for y in range(top, foot):
            for i, q in enumerate((2, 1, 2, 3, 5)):
                c.p(x - 2 + i, y, r[q])
        # drum stone at the foot, its top lit
        for k, (w, q) in enumerate(((9, 1), (9, 2), (9, 3), (7, 4))):
            c.rect(x - w // 2, foot - 4 + k, w, 1, STONE[q])

    def painted_beam(self, x0, x1, top):
        """Caihua: the beam painted in blue and green bands with gold edging
        and a white-lined medallion in each bay; plain red for the lesser."""
        c, s = self.c, self.s
        if s['beam'] == 'red':
            for x in range(x0, x1):
                c.p(x, top + 2, RED[2]); c.p(x, top + 3, RED[3]); c.p(x, top + 4, RED[4])
            return
        for x in range(x0, x1):
            seg = (x - x0) // 10
            r = BLUE if seg % 2 else GREEN
            for k, q in ((1, 0), (2, 1), (3, 2), (4, 2)):
                c.p(x, top + k, r[q])
            if (x - x0) % 10 == 0:
                for k in range(1, 5):
                    c.p(x, top + k, GOLD[2])
            if (x - x0) % 10 == 5:
                c.p(x, top + 2, WHITE[0]); c.p(x, top + 3, GOLD[1])
        for x in range(x0, x1):
            c.p(x, top, GOLD[3]); c.p(x, top + 5, GOLD[4])

    def lattice(self, x, y, w, h, kind, r):
        """Paper behind wooden lattice. Grid, fret (a running meander), ice
        (cracked ice), lozenge, or bars; the frame round it lit top left."""
        c = self.c
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                a, b = xx - x, yy - y
                paper = PAPER[1] if b > 1 else PAPER[3]
                slat = False
                if kind == 'grid':
                    slat = a % 5 == 0 or b % 6 == 0
                elif kind == 'bars':
                    slat = a % 3 == 0
                elif kind == 'lozenge':
                    slat = (a + b) % 6 == 0 or (a - b) % 6 == 0
                elif kind == 'fret':
                    cx, cy = a % 8, b % 8
                    slat = cx == 0 or cy == 0 or (cx == 4 and cy < 5) or (cy == 4 and 1 < cx < 5)
                elif kind == 'ice':
                    i, j = a // 7, b // 7
                    u, v = a % 7, b % 7
                    tilt = int(h2(i, j, 651) * 5)
                    slat = u == 0 or v == 0 or (u == (v + tilt) % 7 and h2(i, j, 652) < 0.6)
                c.p(xx, yy, r[4] if slat else paper)
        # the frame
        for xx in range(x - 2, x + w + 2):
            c.p(xx, y - 2, r[1]); c.p(xx, y - 1, r[3])
            c.p(xx, y + h, r[2]); c.p(xx, y + h + 1, r[4])
        for yy in range(y - 2, y + h + 2):
            c.p(x - 2, yy, r[1]); c.p(x - 1, yy, r[3])
            c.p(x + w, yy, r[3]); c.p(x + w + 1, yy, r[5])
        op.cast(c, x, y, w, 2, 0.75)

    def door_bay(self, a, b, top, foot):
        """Doors in the middle bay: lattice leaves for a hall, a pair of plank
        leaves with iron rings for a house, a stone-framed door in a wall."""
        c, s = self.c, self.s
        post = POSTS[s['posts']]
        bw = b - a
        dh = min(foot - top - 8, 52)
        dy = foot - dh
        if s['door'] == 'leaves':
            n = 4 if bw >= 30 else 2
            lw = bw // n
            for k in range(n):
                x = a + k * lw
                ww = lw if k < n - 1 else b - x
                self.lattice(x + 2, dy + 2, ww - 4, dh * 3 // 5 - 4, s['lattice'], post)
                py = dy + dh * 3 // 5 + 1
                for yy in range(py, foot):
                    for xx in range(x + 2, x + ww - 2):
                        q = 2 if yy == py else 4 if yy == foot - 1 or xx == x + ww - 3 else 3
                        c.p(xx, yy, post[q])
                for yy in range(dy, foot):
                    c.p(x, yy, post[2]); c.p(x + 1, yy, post[4])
            self.door_h = dh
        else:
            self.plank_doors(a + (bw - min(bw, 28)) // 2, min(bw, 28), dh, foot, post)
        if top < dy - 2:
            self.lattice(a + 3, top + 9, bw - 6, max(4, dy - top - 13), s['lattice'], post)

    def plank_doors(self, x, w, h, foot, r, frame=None):
        """A pair of plank leaves, each with an iron ring, the meeting stile
        dark, a raised threshold."""
        c = self.c
        y = foot - h
        for yy in range(y, foot):
            for xx in range(x, x + w):
                a = xx - x
                q = 3 if a % 5 else 4
                if a in (w // 2 - 1, w // 2):
                    q = 6 if a == w // 2 - 1 else 2
                if yy - y in (6, h - 9):
                    q = 2
                c.p(xx, yy, r[q])
        for cx in (x + w // 2 - 4, x + w // 2 + 3):
            for dx, dy in ((0, 0), (-1, 1), (1, 1), (0, 2)):
                c.p(cx + dx, y + h // 2 + dy, GOLD[3])
            c.p(cx, y + h // 2 + 1, GOLD[1])
        op.reveal(c, x, y, w, h, 2)
        c.rect(x - 2, foot - 3, w + 4, 3, STONE[2])
        c.rect(x - 2, foot - 3, w + 4, 1, STONE[1])
        self.door_h = h

    def shop_bay(self, a, b, top, foot):
        """A shop bay with its shutter boards half taken down: the counter and
        the dark shop behind, the boards that are left standing in a row."""
        c, s = self.c, self.s
        post = POSTS[s['posts']]
        y = top + 8
        for yy in range(y, foot - 14):
            for xx in range(a, b):
                c.p(xx, yy, VOID if yy > y + 2 else (30, 22, 32, 255))
        shelves = [ramp(65, 0.12)[2], ramp(40, 0.12)[3], ramp(150, 0.08)[3], RED[2], GOLD[2]]
        for k, sy in enumerate(range(y + 8, foot - 18, 9)):
            c.rect(a + 2, sy, b - a - 4, 1, post[3])
            for xx in range(a + 3, b - 4, 4):
                col = shelves[int(h2(xx, sy, 661) * len(shelves))]
                c.rect(xx, sy - 3, 3, 3, col)
                c.p(xx, sy - 3, mix(col, (255, 248, 230, 255), 0.35))
        # boards still up on the right
        nb = max(2, (b - a) // 7)
        for k in range(nb):
            x = b - (k + 1) * 6
            if x < a + (b - a) // 2:
                break
            for yy in range(y, foot - 14):
                for xx in range(x, x + 6):
                    c.p(xx, yy, post[2] if xx == x else post[4] if xx == x + 5 else post[3])
        op.cast(c, a, y, b - a, 3, 0.7)
        # counter
        cy = foot - 14
        c.rect(a - 2, cy, b - a + 4, 2, post[1])
        for yy in range(cy + 2, foot):
            for xx in range(a - 2, b + 2):
                c.p(xx, yy, post[3] if (xx - a) % 7 else post[5])

    def wall_front(self, top, h):
        """A masonry front: the wall across, a framed door, a few small
        windows set high, a brick base."""
        c, s = self.c, self.s
        x0, x1 = self.x0 + self.wt, self.x0 + self.W - self.wt
        foot = top + h
        self.wall_face(x0, top, x1 - x0, h, s['wall'])
        if s['wall'] == 'white':
            fm.brick(c, x0, foot - 10, x1 - x0, 10, GREY_BRICK, mortar=MORTAR)
            for xx in range(x0, x1):
                c.p(xx, foot - 11, STONE[2])
        cx = self.x0 + self.W // 2 + (0 if s['seed'] % 3 else (-1) ** s['seed'] * self.W // 6)
        cx = max(x0 + 26, min(x1 - 26, cx))
        self.door_x = cx
        dw, dh = 24, 46
        post = POSTS[s['posts']]
        if s['door'] == 'stone':
            # a dark stone frame, its lintel standing proud
            fx = cx - dw // 2 - 5
            for yy in range(foot - dh - 6, foot):
                for xx in range(fx, fx + dw + 10):
                    inner = cx - dw // 2 <= xx < cx + dw // 2 and yy >= foot - dh
                    if not inner:
                        q = 2 if xx in (fx, ) or yy == foot - dh - 6 else 4 if xx == fx + dw + 9 else 3
                        c.p(xx, yy, DARK_STONE[q])
            self.plank_doors(cx - dw // 2, dw, dh, foot, post)
        elif s['door'] == 'leaves':
            self.plank_doors(cx - dw // 2, dw, dh, foot, post)
            for yy in range(foot - dh - 4, foot):
                c.p(cx - dw // 2 - 3, yy, post[1]); c.p(cx - dw // 2 - 2, yy, post[3])
                c.p(cx + dw // 2 + 1, yy, post[3]); c.p(cx + dw // 2 + 2, yy, post[5])
            c.rect(cx - dw // 2 - 4, foot - dh - 5, dw + 8, 2, post[2])
        else:
            self.plank_doors(cx - dw // 2, dw, dh, foot, post)
        self.door_h = dh
        if s['hood']:
            self.door_hood(cx, foot - dh - (8 if s['door'] == 'stone' else 6), dw + 22)
        # windows: small and high, framed in stone
        ww, wh = 16, 16
        spots = [x0 + 18, x1 - 18 - ww]
        if x1 - x0 > 150:
            spots += [x0 + (cx - x0) // 2 - ww // 2, cx + (x1 - cx) // 2 - ww // 2]
        for wx in spots:
            if abs(wx + ww // 2 - cx) < dw // 2 + 18:
                continue
            wy = top + 12
            self.lattice(wx, wy, ww, wh, s['lattice'], DARK_TIMBER)
            for xx in range(wx - 3, wx + ww + 3):
                c.p(xx, wy + wh + 2, STONE[1]); c.p(xx, wy + wh + 3, STONE[3])
            self.sills.append((wx - 3, wy + wh + 3, ww + 6))

    def door_hood(self, cx, y, w):
        """Mentou: a little roof over the door on brick corbels, its tiles in
        columns, a ridge with turned-up ends, a painted panel under it."""
        c = self.c
        r = self.r
        x0, x1 = cx - w // 2, cx + w // 2
        for yy in range(y - 2, y + 4):
            for xx in range(x0 + 3, x1 - 3):
                c.p(xx, yy, GREY_BRICK[2] if yy - y in (-2, 1) else GREY_BRICK[3] if yy - y in (-1, 2) else GREY_BRICK[4])
        rise = 9
        for yy in range(y - rise, y - 2):
            for xx in range(x0, x1):
                c.p(xx, yy, tile(xx, yy, r))
        for xx in range(x0, x1, PITCH):
            glyph(c, xx, y - 3, ('.ab.', 'bbcd'), {'a': r[0], 'b': r[2], 'c': r[3], 'd': r[5]})
        for xx in range(x0 - 1, x1 + 1):
            e = min(xx - x0 + 1, x1 - xx)
            up = 2 if e < 2 else 1 if e < 4 else 0
            for k, q in enumerate((1, 2, 4)):
                c.p(xx, y - rise - 3 + k - up, r[q])
        op.cast(c, x0 + 2, y + 4, w - 4, 4, 0.62)

    def couplets(self, cx, foot, dh, dw):
        """Spring couplets: red paper strips either side of the door and one
        across its head, written in black."""
        c = self.c
        for x in (cx - dw // 2 - 9, cx + dw // 2 + 4):
            for yy in range(foot - dh + 2, foot - 8):
                for xx in range(x, x + 5):
                    q = 2 if xx == x else 4 if xx == x + 4 else 3
                    c.p(xx, yy, RED[q])
            for yy in range(foot - dh + 5, foot - 10, 5):
                c.p(x + 2, yy, BLACK[2]); c.p(x + 1, yy + 1, BLACK[2]); c.p(x + 3, yy + 1, BLACK[3])
        y = foot - dh - 9
        if y > 0:
            for yy in range(y, y + 5):
                for xx in range(cx - 10, cx + 10):
                    c.p(xx, yy, RED[2 if yy == y else 3])
            for xx in range(cx - 7, cx + 8, 4):
                c.p(xx, y + 2, BLACK[2]); c.p(xx + 1, y + 2, BLACK[3])

    # -------------------------------------------------------- roof

    def roof(self, eave):
        """The front slope as a band from the eave up to the ridge."""
        c, s = self.c, self.s
        r = self.r
        L, R = self.x0 - self.over + (self.wt - 2 if self.horse else 0), self.x0 + self.W + self.over - (self.wt - 2 if self.horse else 0)
        rise = self.rise
        top = eave - rise
        self.top = top
        form = s['form']
        hip = form in ('hip', 'xieshan')
        k_hip = 0.6
        mid = top + round(rise * 0.42) if form == 'xieshan' else top
        thatch = s['roof'] in ('thatch', 'rice')
        for x in range(L - 2, R + 2):
            yb = eave - self.lift(x)
            for y in range(top - 2, yb + 1):
                inset = 0
                if hip:
                    yy = max(y, mid)
                    inset = round((yb - yy) * k_hip) if yy < yb else 0
                    inset = min(inset, round((yb - mid) * k_hip))
                    if form == 'hip':
                        inset = round((yb - y) * k_hip)
                l, rr = L + inset, R - inset
                if not (l <= x < rr):
                    continue
                if y < top:
                    continue
                t = (y - top) / max(1, yb - top)
                if thatch:
                    col = thatch_px(x, y, RICE_STRAW if s['roof'] == 'rice' else STRAW, top, s['roof'] == 'rice')
                    if hip and x < l + (inset // 2 + 1):
                        col = mix(col, (255, 244, 220, 255), 0.0)
                elif hip and inset and x < l + max(2, inset // 2 + 1) and y > mid:
                    col = side_tile(x, y, r, 0, True)
                elif hip and inset and x >= rr - max(2, inset // 2 + 1) and y > mid:
                    col = side_tile(x, y, r, 1, False)
                else:
                    col = tile(x - L, y, r, shift=2 if t < 0.18 else 1 if t < 0.45 else 0 if t < 0.8 else -1, big=s['tone'] == 'han')
                c.p(x, y, col)
                self.roof_px.add((x, y))
        if thatch:
            self.thatch_edge(L, R, eave, s['roof'] == 'rice')
        else:
            self.eave_edge(L, R, eave)
            if hip:
                self.hips(L, R, top, mid, eave, k_hip, form)
            elif not self.horse:
                self.verges(L, R, top, eave)
        self.ridge(L, R, top, form, k_hip, mid, eave)

    def thatch_edge(self, L, R, eave, rice):
        c = self.c
        r = RICE_STRAW if rice else STRAW
        for x in range(L, R):
            yb = eave - self.lift(x)
            rag = int(h2(x // 2, 0, 671) * 2)
            for k, q in enumerate((2, 3, 4, 5, 6)):
                c.p(x, yb + k + rag - 1, r[q])
                self.roof_px.add((x, yb + k + rag - 1))
        op.cast(c, L + 6, eave + 5, R - L - 12, 6, 0.6)

    def eave_edge(self, L, R, eave):
        """Round end caps at the foot of every column of covers, a drip tile
        under every channel, the rafter ends in shadow beneath."""
        c, s = self.c, self.s
        r = self.r
        big = s['tone'] == 'han'
        pitch = PITCH + 2 if big else PITCH
        cap = WADANG_BIG if big else WADANG
        for x in range(L, R):
            yb = eave - self.lift(x)
            lx = (x - L) % pitch
            if lx == 0:
                pal = {'a': r[1], 'b': r[4], 'c': r[3], 'd': r[6]}
                glyph(c, x, yb - 1, cap, pal)
        # the eave's thickness: a lit edge of tile, the dark soffit, the
        # rafter ends in it, then the shadow it throws on the wall
        post = POSTS[s['posts']]
        for x in range(L + 1, R - 1):
            yb = eave - self.lift(x)
            c.p(x, yb + 3, r[2])
            for k, q in enumerate((6, 7, 6, 7)):
                c.p(x, yb + 4 + k, post[q] if s['brackets'] or s['curve'] >= 2 else r[q])
            if (x - L) % 6 == 2:
                c.p(x, yb + 5, (post if s['brackets'] or s['curve'] >= 2 else r)[3])
                c.p(x + 1, yb + 5, (post if s['brackets'] or s['curve'] >= 2 else r)[4])
        op.cast(c, L + 4, eave + 8, R - L - 8, 7, 0.58)

    def verges(self, L, R, top, eave):
        """A plain gable's ends: the tiles turned down over the verge, a
        lit line on the left and a dark one on the right."""
        c = self.c
        r = self.r
        for y in range(top, eave + 1):
            for x, left in ((L, True), (R - 1, False)):
                if y > eave - self.lift(x):
                    continue
                for k, q in enumerate((3, 1, 2, 4) if left else (4, 5, 6, 7)):
                    c.p(x + (k if left else -k), y, r[q])

    def hips(self, L, R, top, mid, eave, k_hip, form):
        """Ridge tiles running down each hip to the upturned eave corner."""
        c = self.c
        r = self.r
        start = top if form == 'hip' else mid
        for y in range(start, eave + 1):
            d = round((eave - y) * k_hip)
            for xx, cols in ((L + d, (r[1], r[2], r[4])), (R - d - 3, (r[3], r[4], r[6]))):
                for i, q in enumerate(cols):
                    c.p(xx + i, y - self.lift(xx), q)
        if form == 'xieshan':
            # the gable above the hips, its tiles turned down like a verge
            d = round((eave - mid) * k_hip)
            for y in range(top, mid + 1):
                for x, left in ((L + d, True), (R - d - 1, False)):
                    for k, q in enumerate((2, 1, 3) if left else (5, 4, 6)):
                        c.p(x + (k if left else -k), y, r[q])

    def ridge(self, L, R, top, form, k_hip, mid, eave):
        """The ridge built up of tiles laid on edge, a cap along its top, and
        its ends: swept up like swallows' tails in the south, a dragon-fish
        on a great hall, a curled scroll, or a plain lift."""
        c, s = self.c, self.s
        thatch = s['roof'] in ('thatch', 'rice')
        r = RICE_STRAW if s['roof'] == 'rice' else STRAW if thatch else self.r
        if form == 'hip':
            d = round((eave - top) * k_hip)
            L, R = L + d, R - d
        elif form == 'xieshan':
            d = round((eave - mid) * k_hip)
            L, R = L + d, R - d
        if thatch:
            for x in range(L - 1, R + 1):
                for k, q in enumerate((2, 1, 2, 3, 4, 5)):
                    c.p(x, top - 3 + k, r[q])
                if (x - L) % 8 == 0:
                    for k in range(5):
                        c.p(x, top - 3 + k, r[6])
            op.cast(c, L, top + 3, R - L, 2, 0.75)
            return
        end = s['ridge']
        sweep = 16 if end == 'swallow' else 0
        hgt = 8 if self.W >= 110 else 6
        # cap, its lit edge, then tiles stood on edge, then the bedding
        rows = (1, 2, 3, None, None, None, 5, 6) if hgt == 8 else (1, 2, None, None, 5, 6)
        for x in range(L - 1, R + 1):
            e = min(x - L + 1, R - x)
            up = round(((sweep - e) / sweep) ** 2 * 9) if sweep and e < sweep else (2 if e < 3 else 1 if e < 6 else 0) if end == 'upturn' else 0
            for k, q in enumerate(rows):
                if q is None:
                    q = 3 if (x - L) % 3 == 0 else 4
                c.p(x, top - hgt + 2 + k - up, r[q])
        if end == 'swallow':
            # the tails: two pixels thick, tapering, out and up past the ridge
            tail = ((0, 0, 3), (1, -1, 3), (2, -2, 3), (3, -4, 2), (4, -6, 2), (5, -8, 2), (5, -10, 1), (6, -11, 1))
            for side in (-1, 1):
                x = L - 1 if side < 0 else R
                y0 = top - hgt + 2 - 9
                for dx, dy, th in tail:
                    for k in range(th):
                        c.p(x + side * dx, y0 + dy + k, r[(1, 3, 5)[min(k, 2)] if side < 0 else (2, 4, 6)[min(k, 2)]])
        elif end == 'chiwen':
            pal = {'a': self.r[1], 'b': self.r[3], 'c': self.r[4], 'd': self.r[6]}
            glyph(c, L - 4, top - hgt - 6, CHIWEN, pal)
            glyph(c, R - 2, top - hgt - 6, CHIWEN, pal, flip=True)
        elif end == 'oni':
            pal = {'a': self.r[1], 'b': self.r[2], 'c': self.r[4], 'd': self.r[6]}
            glyph(c, L - 3, top - hgt - 3, ONI, pal)
            glyph(c, R - 4, top - hgt - 3, ONI, pal, flip=True)
        elif end == 'scroll':
            pal = {'a': self.r[1], 'b': self.r[3], 'c': self.r[4], 'd': self.r[6]}
            glyph(c, L - 3, top - hgt - 2, SCROLL, pal)
            glyph(c, R - 1, top - hgt - 2, SCROLL, pal, flip=True)
        op.cast(c, L, top + 2, R - L, 2, 0.72)

    def horse_walls(self, eave):
        """Horse-head walls: the gable walls carried up above the roof in
        steps, each step capped in tiles that turn up at their ends. Seen from
        above, each higher step stands further back, so the steps climb the
        screen: a white riser, then the coping's top, then the next riser."""
        c, s = self.c, self.s
        r = self.r
        n = s['horse']
        wt = self.wt
        top = self.top - 20
        bottom = eave + 2
        step = (bottom - top) / n
        cop = 6
        # the horse's head: the coping's end lifted in a curl, each side
        head = ('..ab', '.abc', 'abc.', 'bc..')
        for side in (0, 1):
            x0 = self.x0 if side == 0 else self.x0 + self.W - wt
            for k in range(n):
                y1 = round(bottom - k * step)
                y0 = round(bottom - (k + 1) * step)
                for y in range(y0 + cop, y1):
                    for x in range(x0, x0 + wt):
                        q = 3 if y == y0 + cop else 2 if y == y0 + cop + 1 else 1
                        if x == x0:
                            q -= 1
                        elif x >= x0 + wt - 2:
                            q += 1
                        c.p(x, y, WHITE[max(0, min(7, q))])
                        self.walls_px.add((x, y))
                for y in range(y0, y0 + cop):
                    j = y - y0
                    for x in range(x0 - 2, x0 + wt + 2):
                        q = (1, 2, 3, 3, 5, 6)[j]
                        if j in (2, 3) and (x - x0) % 3 == 1:
                            q = 5
                        c.p(x, y, r[q])
                pal = {'a': r[1], 'b': r[2], 'c': r[4]}
                glyph(c, x0 - 6, y0 - 2, head, pal)
                glyph(c, x0 + wt + 2, y0 - 2, head, {'a': r[2], 'b': r[3], 'c': r[5]}, flip=True)
            if side == 0:
                fp.cast_right(c, x0 + wt + 2, top + 6, eave, 3, 0.3)

    # -------------------------------------------------------- build

    def build(self, info=None):
        s, c = self.s, self.c
        self.terrace()
        foot = self.base - s['plinth']
        h0 = s['wall_h']
        top0 = foot - h0
        self.door_h = 44
        self.door_x = self.x0 + self.W // 2
        {'timber': self.timber_front, 'koshi': self.koshi_front, 'kura': self.kura_front,
         'gate': self.gate_front, 'open': self.open_front}.get(s['front'], self.wall_front)(top0, h0)
        eave = top0
        if s['storeys'] > 1:
            uh = s['upper_h']
            if s['gallery']:
                self.gallery(top0, uh)
            elif s['upper'] == 'mushiko':
                self.mushiko(top0 - uh, uh)
            elif s['upper'] == 'kura':
                self.kura_upper(top0 - uh, uh)
            else:
                self.upper_wall(top0 - uh, uh)
            if s['pent']:
                self.pent(top0)
            if s['udatsu']:
                self.udatsu(top0 - uh, top0)
            eave = top0 - uh
        self.roof(eave)
        if self.horse:
            self.horse_walls(eave)
        if s['couplets'] and s['door']:
            self.couplets(self.door_x, foot, self.door_h, 24)
        if s['lanterns']:
            for x in (self.door_x - 22, self.door_x + 16):
                fixture(c, x, top0 + 4, 1, 'lantern', 'red')
        weather(c, dict(roof=self.roof_px, roof_shade=set(), eave_y=lambda x: eave, walls=self.walls_px,
                        stone=set(), sills=self.sills, chimneys=[]), s['wear'], s['seed'])
        if info is not None:
            info.update(x0=self.x0, W=self.W, base=self.base - 1, door_x=self.door_x, door_h=self.door_h)
        self.roof_span = (self.x0 - self.over, self.x0 + self.W + self.over)
        self.stacks = []
        finish(c)
        consolidate(c, rare=4)
        return c.im

    def koshi_front(self, top, h):
        """A machiya's ground floor: koshi lattice across the bays, oxblood
        bengara on the slats, a sliding door half open on the dark doma."""
        c, s = self.c, self.s
        post = POSTS[s['posts']]
        n, edges = self.bay_cols()
        foot = top + h
        self.wall_face(edges[0], top, edges[-1] - edges[0], h, 'white')
        mid = n // 2 if n > 1 else 0
        for k in range(n):
            a, b = edges[k] + 3, edges[k + 1] - 3
            if k == mid:
                op.door_sliding(c, a + 2, foot - 46, b - a - 4, 46)
                self.door_x, self.door_h = (a + b) // 2, 46
                continue
            if s['shop'] and k == mid + 1:
                self.shop_bay(a, b, top, foot)
                continue
            y = top + 8
            for yy in range(y, foot - 4):
                for xx in range(a, b):
                    j = (xx - a) % 3
                    col = post[2] if j == 0 else post[4] if j == 1 else VOID
                    if (yy - y) in (0, (foot - 4 - y) // 2):
                        col = post[2]
                    c.p(xx, yy, col)
            for xx in range(a - 1, b + 1):
                c.p(xx, foot - 4, STONE[2]); c.p(xx, foot - 3, STONE[3])
            op.cast(c, a, y, b - a, 2, 0.7)
        for x in range(edges[0] - 2, edges[-1] + 2):
            for k in range(5):
                c.p(x, top + k, post[(2, 1, 3, 4, 5)[k]])
        for e in edges:
            self.post(e, top, foot, post)

    def mushiko(self, top, h):
        """The low upper floor of a machiya, plastered, lit through mushiko:
        slots of thick plaster bars, rounded at their ends."""
        c, s = self.c, self.s
        x0, x1 = self.x0 + self.wt, self.x0 + self.W - self.wt
        self.wall_face(x0, top, x1 - x0, h, 'white' if s['wall'] != 'earth' else 'earth')
        n, edges = self.bay_cols()
        for k in range(n):
            a, b = edges[k] + 6, edges[k + 1] - 6
            if b - a < 10:
                continue
            y0, y1 = top + 7, top + h - 7
            for yy in range(y0, y1):
                for xx in range(a, b):
                    j = (xx - a) % 4
                    round_ = (yy in (y0, y1 - 1)) and j in (0, 3)
                    if round_:
                        continue
                    c.p(xx, yy, VOID if j in (2, 3) else WHITE[1] if j == 0 else WHITE[3])
            for xx in range(a - 1, b + 1):
                c.p(xx, y1, WHITE[4]); c.p(xx, y0 - 1, WHITE[0])
            self.sills.append((a, y1, b - a))

    def udatsu(self, top, foot):
        """Udatsu: the party wall carried out and up at each end of the upper
        floor, plastered, capped by its own small tiled roof."""
        c = self.c
        r = self.r
        for x0 in (self.x0 + self.wt - 4, self.x0 + self.W - self.wt - 6):
            for yy in range(top - 6, foot):
                for xx in range(x0, x0 + 10):
                    c.p(xx, yy, WHITE[1 if xx < x0 + 7 else 3])
            for yy in range(top - 12, top - 5):
                for xx in range(x0 - 2, x0 + 12):
                    c.p(xx, yy, tile(xx, yy, r) if yy > top - 11 else r[2])
            for xx in range(x0 - 2, x0 + 12):
                c.p(xx, top - 5, r[5])
            op.cast(c, x0, top - 4, 10, 2, 0.7)

    def kura_front(self, top, h):
        """A kura storehouse: thick white plaster over a namako dado, black
        tiles set diagonally with raised white joints, a heavy door."""
        c, s = self.c, self.s
        x0, x1 = self.x0 + self.wt, self.x0 + self.W - self.wt
        foot = top + h
        self.wall_face(x0, top, x1 - x0, h, 'white')
        dado = h * 2 // 5
        self.namako(x0, foot - dado, x1 - x0, dado)
        cx = self.x0 + self.W // 2
        dw, dh = 24, 44
        for yy in range(foot - dh - 6, foot):
            for xx in range(cx - dw // 2 - 6, cx + dw // 2 + 6):
                c.p(xx, yy, WHITE[2] if xx < cx else WHITE[3])
        for yy in range(foot - dh, foot):
            for xx in range(cx - dw // 2, cx + dw // 2):
                q = 2 if (xx - cx + dw // 2) % 6 == 0 else 3
                c.p(xx, yy, BLACK[q] if yy > foot - dh + 3 else BLACK[1])
        op.reveal(c, cx - dw // 2, foot - dh, dw, dh, 3)
        self.door_x, self.door_h = cx, dh
        for wx in (x0 + 14, x1 - 30):
            wy = top + 10
            for yy in range(wy, wy + 14):
                for xx in range(wx, wx + 16):
                    c.p(xx, yy, VOID if (xx - wx) % 4 else ramp(250, 0.02, lift=-0.3)[2])
            op.raised(c, wx - 3, wy - 3, 22, 3, WHITE, 1)
            op.cast(c, wx, wy, 16, 2, 0.7)
            self.sills.append((wx - 2, wy + 14, 20))

    def namako(self, x, y, w, h):
        c = self.c
        tile_r = ramp(255, 0.02, lift=-0.28)
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                u, v = (xx - x + yy - y) % 10, (xx - x - (yy - y)) % 10
                if u in (0, 1) or v in (0, 1):
                    q = WHITE[0] if u == 0 or v == 0 else WHITE[2]
                else:
                    q = tile_r[2 if (u + v) % 7 < 2 else 3]
                c.p(xx, yy, q)
        for xx in range(x, x + w):
            c.p(xx, y - 1, WHITE[3])

    def kura_upper(self, top, h):
        c = self.c
        x0, x1 = self.x0 + self.wt, self.x0 + self.W - self.wt
        self.wall_face(x0, top, x1 - x0, h, 'white')
        cx = self.x0 + self.W // 2
        for yy in range(top + 8, top + h - 6):
            for xx in range(cx - 8, cx + 8):
                c.p(xx, yy, VOID if (xx - cx) % 4 else ramp(250, 0.02, lift=-0.3)[2])
        op.raised(c, cx - 11, top + 5, 22, 3, WHITE, 1)

    def gate_front(self, top, h):
        """A gatehouse: a deep passage under the roof, its leaves standing
        open on the court beyond, walls either side and a step up."""
        c, s = self.c, self.s
        post = POSTS[s['posts']]
        x0, x1 = self.x0 + self.wt, self.x0 + self.W - self.wt
        foot = top + h
        self.wall_face(x0, top, x1 - x0, h, s['wall'] if s['wall'] != 'timber' else 'brick')
        cx = self.x0 + self.W // 2
        gw = min(40, (x1 - x0) // 2)
        gh = min(h - 4, 52)
        for yy in range(foot - gh, foot):
            for xx in range(cx - gw // 2, cx + gw // 2):
                depth = (yy - (foot - gh)) / gh
                q = VOID if depth < 0.75 else mix(VOID, STONE[4], (depth - 0.75) * 2)
                c.p(xx, yy, q)
        # the leaves folded back against the reveals
        for side in (-1, 1):
            lx = cx - gw // 2 if side < 0 else cx + gw // 2 - 5
            for yy in range(foot - gh, foot):
                for xx in range(lx, lx + 5):
                    c.p(xx, yy, post[2] if xx == lx else post[4] if xx == lx + 4 else post[3])
            for dy in (gh // 3, 2 * gh // 3):
                c.p(lx + 2, foot - gh + dy, GOLD[2])
        for e in (cx - gw // 2 - 3, cx + gw // 2 + 2):
            self.post(e, top, foot, post)
        for x in range(cx - gw // 2 - 6, cx + gw // 2 + 6):
            for k in range(5):
                c.p(x, top + k, post[(2, 1, 3, 4, 5)[k]])
        # a name board over the gate
        bw = 22
        for yy in range(top + 8, top + 16):
            for xx in range(cx - bw // 2, cx + bw // 2):
                c.p(xx, yy, BLACK[2] if yy in (top + 8, top + 15) or xx in (cx - bw // 2, cx + bw // 2 - 1) else BLACK[3])
        for xx in range(cx - 7, cx + 8, 5):
            c.p(xx, top + 11, GOLD[1]); c.p(xx + 1, top + 12, GOLD[2])
        op.cast(c, cx - gw // 2, foot - gh, gw, 3, 0.7)
        self.door_x, self.door_h = cx, gh

    def open_front(self, top, h):
        """A workshop open to the street between its posts: the bench, the
        tools on the back wall, the dark of the shop."""
        c, s = self.c, self.s
        post = POSTS[s['posts']]
        n, edges = self.bay_cols()
        foot = top + h
        for yy in range(top, foot):
            for xx in range(edges[0], edges[-1]):
                c.p(xx, yy, VOID if yy > top + 3 else (30, 22, 32, 255))
        wood = TIMBER
        for k in range(n):
            a, b = edges[k] + 4, edges[k + 1] - 4
            # tools hung on the back wall
            for i, xx in enumerate(range(a + 2, b - 2, 6)):
                ln = 8 + int(h2(xx, k, 681) * 6)
                for yy in range(top + 10, top + 10 + ln):
                    c.p(xx, yy, wood[3])
                c.rect(xx - 1, top + 10 + ln, 3, 2, ramp(250, 0.02, lift=-0.1)[2])
            # the bench and what is on it
            by = foot - 16
            c.rect(a, by, b - a, 2, wood[1])
            c.rect(a, by + 2, b - a, 1, wood[4])
            for xx in (a + 1, b - 3):
                c.rect(xx, by + 3, 2, 13, wood[4])
            for xx in range(a + 3, b - 6, 7):
                c.rect(xx, by - 3, 4, 3, [wood[2], STONE[2], ramp(30, 0.1, lift=-0.1)[3]][int(h2(xx, by, 682) * 3)])
        self.door_x = (edges[n // 2] + edges[n // 2 + 1]) // 2
        self.door_h = h
        for x in range(edges[0] - 2, edges[-1] + 2):
            for k in range(5):
                c.p(x, top + k, post[(2, 1, 3, 4, 5)[k]])
        for e in edges:
            self.post(e, top, foot, post)
        op.cast(c, edges[0], top + 5, edges[-1] - edges[0], 4, 0.6)

    def upper_wall(self, top, h):
        c, s = self.c, self.s
        x0, x1 = self.x0 + self.wt, self.x0 + self.W - self.wt
        self.wall_face(x0, top, x1 - x0, h, s['wall'] if s['wall'] != 'brick' else 'white')
        n, edges = self.bay_cols()
        post = POSTS[s['posts']]
        for k in range(n):
            a, b = edges[k], edges[k + 1]
            w = min(b - a - 12, 22)
            x = (a + b) // 2 - w // 2
            self.lattice(x, top + 10, w, h - 20, s['lattice'], post)
            self.sills.append((x - 2, top + h - 8, w + 4))

    def gallery(self, top, h):
        """An upper floor that steps out over the street as a gallery: lattice
        panels behind a railing, the floor's edge lit, a shadow under it."""
        c, s = self.c, self.s
        post = POSTS[s['posts']]
        x0, x1 = self.x0 + self.wt, self.x0 + self.W - self.wt
        y = top - h
        self.wall_face(x0, y, x1 - x0, h, 'white')
        n, edges = self.bay_cols()
        for k in range(n):
            a, b = edges[k] + 3, edges[k + 1] - 3
            self.lattice(a + 2, y + 8, b - a - 4, h - 22, s['lattice'], post)
        # railing
        ry = top - 14
        for x in range(x0 - 2, x1 + 2):
            c.p(x, ry, post[1]); c.p(x, ry + 1, post[3])
            c.p(x, top - 3, post[2]); c.p(x, top - 2, post[4])
            if (x - x0) % 4 == 0:
                for yy in range(ry + 2, top - 3):
                    c.p(x, yy, post[3]); c.p(x + 1, yy, post[5])
        for e in edges:
            for yy in range(y, top):
                for i, q in enumerate((2, 1, 3, 5)):
                    c.p(e - 2 + i, yy, post[q])
        op.cast(c, x0, top, x1 - x0, 4, 0.62)

    def pent(self, y):
        """The hisashi: a narrow tiled roof along the front between the
        floors, its ends hipped back, the front plane in tile columns, the
        hip ends lit and shaded, a thick edge of end caps over its shadow."""
        c = self.c
        r = self.r
        x0, x1 = self.x0 + self.wt - 6, self.x0 + self.W - self.wt + 6
        rise = 12
        for yy in range(y - rise, y + 1):
            inset = round((yy - (y - rise)) * 0) + round((y - yy) * 0.7)
            for x in range(x0 + inset, x1 - inset):
                hip = min(x - x0 - inset, x1 - inset - 1 - x)
                if hip < 3 + (y - yy) // 3 and x < (x0 + x1) // 2:
                    col = side_tile(x, yy, r, -1, True)
                elif hip < 3 + (y - yy) // 3:
                    col = side_tile(x, yy, r, 1, False)
                else:
                    col = tile(x, yy, r, shift=1 if yy < y - rise + 3 else 0)
                c.p(x, yy, col)
                self.roof_px.add((x, yy))
        for x in range(x0, x1, PITCH):
            glyph(c, x, y - 1, WADANG, {'a': r[1], 'b': r[4], 'c': r[3], 'd': r[6]})
        for x in range(x0 + 1, x1 - 1):
            c.p(x, y + 3, r[6]); c.p(x, y + 4, r[7])
        op.cast(c, x0 + 2, y + 5, x1 - x0 - 4, 5, 0.6)

# ------------------------------------------------------------------ gable fronts

def kawara_rake(b, a, r, shade):
    """A pixel of a slope whose tile columns run parallel to the rake: `b`
    across the column (0 at its lower edge), `a` along it. Each cover tile a
    barrel lit along its crown, the pan between in shadow, a lap where one
    tile overlaps the next."""
    b, a = b % 8, a % 9
    q = (5, 4, 3, 2, 2, 3, 4, 5)[b]
    if a == 8 and b < 6:
        q += 1
    elif a == 0 and 1 < b < 6:
        q -= 1
    return r[max(0, min(7, q + shade))]


class GableFront(Hall):
    """A building whose gable faces the street: the gable's triangle over the
    front, the two slopes running back up the screen from the rake, the left
    one in the light and the right in shade, tiles laid down each slope,
    the verge turned down along the rake, the ridge running back from the
    apex with its end tile standing over the gable."""

    def __init__(self, spec):
        s = dict(gable='plaster', depth=None, slope=0.78)
        s.update(spec)
        super().__init__(s)
        s = self.s
        W = self.W
        self.over = 10
        self.half = W / 2 + self.over
        self.rise = round(self.half * s['slope'])
        self.depth = s['depth'] or max(40, min(76, round(W * 0.48)))
        walls = s['wall_h'] + (s['upper_h'] if s['storeys'] > 1 else 0)
        self.x0 = 16 + self.over
        self.base = 30 + self.depth + self.rise + 8 + walls + s['plinth']
        self.c = C(self.x0 + W + self.over + 16, self.base + 6)
        self.horse = False
        self.wt = 0

    def roof(self, eave):
        c, s = self.c, self.s
        r = self.r
        W = self.W
        x0, x1 = self.x0, self.x0 + W
        apx = x0 + W // 2
        slope = self.rise / self.half
        depth = self.depth
        L, R = x0 - self.over, x1 + self.over

        def rake(x):
            return round(eave + 4 - (self.half - abs(x + 0.5 - apx)) * slope)
        self.rake = rake
        self.top = rake(apx)
        # the gable's face
        self.gable_face(x0, x1, apx, rake, eave)
        # the two slopes
        for x in range(L, R):
            left = x < apx
            yr = rake(x)
            u = abs(x + 0.5 - apx)
            for y in range(yr - depth, yr + 1):
                w = yr - y
                t = w / depth
                band = 1 if t > 0.78 else 0
                if s['roof'] in ('thatch', 'rice'):
                    col = thatch_px(x, y, RICE_STRAW if s['roof'] == 'rice' else STRAW, yr - depth)
                    col = col if left else STRAW[min(7, STRAW.index(col) + 1)] if col in STRAW else col
                else:
                    col = kawara_rake(w, round(u * 1.2), r, (-1 if left else 2) + band)
                c.p(x, y, col)
                self.roof_px.add((x, y))
        # the side eaves running back: tile ends seen along them, a dark soffit
        for x, out in ((L, -1), (R - 1, 1)):
            yr = rake(x)
            for y in range(yr - depth, yr + 1):
                for k, q in enumerate((5, 6) if out < 0 else (6, 7)):
                    c.p(x + out * k, y, r[q])
                if (yr - y) % 8 == 4:
                    # the round end of each column of covers, seen along the eave
                    for dy, row in enumerate(('.b.', 'bac', 'bcd', '.d.')):
                        for dx, ch in enumerate(row):
                            if ch != '.':
                                c.p(x + out * (dx - 1) + out, y + dy - 2,
                                    {'a': r[1], 'b': r[3], 'c': r[4], 'd': r[6]}[ch] if out < 0 else
                                    {'a': r[3], 'b': r[4], 'c': r[5], 'd': r[7]}[ch])
        self.verge(L, R, apx, rake)
        self.ridge_run(apx, rake(apx) - depth, rake(apx))
        if s['gable'] == 'horse':
            self.stepped_gable(x0, x1, apx, rake, eave)
        self.roof_span = (L, R)

    def gable_face(self, x0, x1, apx, rake, eave):
        """The gable under the rake: lime plaster held in black timber for a
        machiya, grey brick in China, earth for the poor."""
        c, s = self.c, self.s
        top = rake(apx)
        kind = s['gable']
        post = POSTS[s['posts']]
        for y in range(top, eave):
            for x in range(x0, x1):
                if y < rake(x) + 4:
                    continue
                if kind == 'brick':
                    col = fm_brick_px(x, y)
                elif kind == 'earth':
                    col = EARTH[2 if (y - top) % 7 else 3]
                else:
                    col = WHITE[1] if y > top + 6 else WHITE[2]
                c.p(x, y, col)
                self.walls_px.add((x, y))
        if kind == 'plaster':
            # tie beam, king post, struts: the frame showing through the plaster
            by = eave - 7
            for x in range(x0, x1):
                for k, q in enumerate((2, 1, 3, 4, 5)):
                    c.p(x, by + k, post[q])
            for y in range(top + 8, by):
                for i, q in enumerate((2, 1, 3, 5)):
                    c.p(apx - 2 + i, y, post[q])
            for side in (-1, 1):
                for t in range(0, 24):
                    xx = apx + side * (6 + t)
                    yy = by - 2 - round(t * 0.55)
                    if yy > rake(xx) + 5:
                        c.p(xx, yy, post[2]); c.p(xx, yy + 1, post[4])
        op.cast(c, x0, top + 4, x1 - x0, 0, 0.7)

    def verge(self, L, R, apx, rake):
        """The tiles turned down over the gable along the rake: a thick lit
        edge on the left slope, a dark one on the right, shadow beneath."""
        c = self.c
        r = self.r
        for x in range(L - 1, R + 1):
            y = rake(x)
            left = x < apx
            for k, q in enumerate((1, 2, 3, 5) if left else (3, 4, 5, 6)):
                c.p(x, y + 1 + k, r[q])
            if (x - L) % 7 == 0:
                c.p(x, y + 3, r[5 if left else 6])
            for k in range(4):
                p = c.g(x, y + 5 + k)
                if p[3] and (x, y + 5 + k) in self.walls_px:
                    c.p(x, y + 5 + k, mix(p, (40, 30, 60, 255), 0.42 * (1 - k / 4)))
        if self.s['ridge'] == 'oni' or self.s['gable'] == 'plaster':
            # gegyo: the carved board hung under the apex
            post = POSTS[self.s['posts']]
            y = rake(apx) + 5
            for k in range(7):
                for i in range(-3 + k // 2, 4 - k // 2):
                    c.p(apx + i, y + k, post[2 if i < 0 else 4])

    def ridge_run(self, x, y0, y1):
        """The ridge running back from the apex: its cap lit on the left,
        stacked tiles in courses, an end tile standing up at each end."""
        c, s = self.c, self.s
        r = self.r
        cols = (5, 3, 2, 1, 2, 3, 4, 6)
        for y in range(y0, y1 + 1):
            seg = (y - y0) % 6
            for k, q in enumerate(cols):
                qq = q + (1 if seg == 5 else 0)
                c.p(x - 4 + k, y, r[min(7, qq)])
        for yy in (y0, y1):
            if s['ridge'] == 'oni':
                glyph(c, x - 5, yy - 9, ONI_BIG, {'a': r[1], 'b': r[2], 'c': r[4], 'd': r[6]})
            elif s['ridge'] == 'swallow':
                for side in (-1, 1):
                    for dx, dy, th in ((1, 0, 3), (2, -2, 3), (3, -4, 2), (4, -6, 2), (4, -8, 2), (5, -9, 1)):
                        for k in range(th):
                            c.p(x + side * dx, yy - 3 + dy + k, r[(1, 3, 5)[min(k, 2)]] if side < 0 else r[(2, 4, 6)[min(k, 2)]])
            else:
                for k, q in enumerate((1, 2, 3, 4, 5)):
                    c.p(x - 3, yy - 4 + k, r[q]); c.p(x + 3, yy - 4 + k, r[q + 1])
                    c.rect(x - 2, yy - 4 + k, 5, 1, r[q])
        op.cast(c, x + 4, y0, 0, 0)

    def stepped_gable(self, x0, x1, apx, rake, eave):
        """The south's street-facing gable: the end wall carried up past the
        rake in steps, each capped with tiles whose ends turn up like a
        horse's head. It hides the front of the roof; the slopes show behind."""
        c = self.c
        r = self.r
        n = self.s['horse'] + 1
        W = x1 - x0
        top = rake(apx) - 10
        cop = 6
        head = ('..ab', '.abc', 'abc.', 'bc..')
        steps = []
        for k in range(n):
            hw = round(W / 2 * (k + 1) / n) + 2
            y = top + round(k * (eave - 12 - top) / n)
            steps.append((hw, y))
        # one white face, its outline stepping down from the top
        for k, (hw, y) in enumerate(steps):
            for yy in range(y + cop, eave):
                for xx in range(apx - hw, apx + hw):
                    if k and abs(xx + 0.5 - apx) < steps[k - 1][0] and yy >= steps[k - 1][1]:
                        continue
                    q = 1 if yy > y + cop + 1 else 3
                    if xx >= apx + hw - 2:
                        q += 1
                    c.p(xx, yy, WHITE[q])
                    self.walls_px.add((xx, yy))
                    self.roof_px.discard((xx, yy))
        # each step's coping caps only its own shoulder
        for k, (hw, y) in enumerate(steps):
            inner = steps[k - 1][0] - 1 if k else -1
            for yy in range(y, y + cop):
                j = yy - y
                for xx in range(apx - hw - 2, apx + hw + 2):
                    if abs(xx + 0.5 - apx) < inner:
                        continue
                    q = (1, 2, 3, 3, 5, 6)[j] + (1 if xx > apx else 0)
                    if j in (2, 3) and (xx - apx) % 3 == 1:
                        q = 5
                    c.p(xx, yy, r[min(7, q)])
            glyph(c, apx - hw - 6, y - 2, head, {'a': r[1], 'b': r[2], 'c': r[4]})
            glyph(c, apx + hw + 2, y - 2, head, {'a': r[2], 'b': r[3], 'c': r[5]}, flip=True)
            if k:
                op.cast(c, apx - inner, y + cop, 2 * inner, 0, 0.7)

def fm_brick_px(x, y):
    row, ly = y // 4, y % 4
    lx = (x + (row % 2) * 4) % 8
    if ly == 3 or lx == 7:
        return MORTAR[3]
    return GREY_BRICK[2 if h2((x + (row % 2) * 4) // 8, row, 701) < 0.7 else 3] if ly else GREY_BRICK[1]


def gable_front(spec=None, info=None):
    return GableFront(spec or {}).build(info)


def side_range(c, Lo, Li, ys, ye, r, outer_left=None):
    """A side range seen from its near gable end: the same two slopes as a
    gable front, the left one lit and the right in shade, tiles laid down each,
    the ridge running up the screen, the verge along the rake at the near end
    just showing over the front range."""
    L, R = min(Lo, Li), max(Lo, Li)
    apx = (L + R) / 2
    half = (R - L) / 2
    slope = 0.5

    def rake(x):
        return round(ye - (half - abs(x + 0.5 - apx)) * slope)
    for x in range(L, R):
        left = x < apx
        yr = rake(x)
        u = abs(x + 0.5 - apx)
        for y in range(ys, yr + 1):
            w = yr - y
            c.p(x, y, kawara_rake(w, round(u * 1.2), r, -1 if left else 2))
    for x in range(L - 1, R + 1):
        y = rake(x)
        left = x < apx
        for k, q in enumerate((1, 2, 3, 5) if left else (3, 4, 5, 6)):
            c.p(x, y + 1 + k, r[q])
    for x, out in ((L, -1), (R - 1, 1)):
        for y in range(ys, rake(x) + 1):
            for k, q in enumerate((5, 6) if out < 0 else (6, 7)):
                c.p(x + out * k, y, r[q])
    xr = round(apx)
    for y in range(ys - 2, rake(xr) + 1):
        for k, q in enumerate((5, 3, 2, 1, 2, 3, 4, 6)):
            c.p(xr - 4 + k, y, r[min(7, q + (1 if (y - ys) % 6 == 5 else 0))])
    for k, q in enumerate((1, 2, 3, 4, 5)):
        c.rect(xr - 3, rake(xr) - 3 + k, 7, 1, r[q])


def court_floor(c, L, R, y0, y1, kind, path=True):
    """A court from above: square bricks laid in a grid, or granite slabs in
    the south; a raised stone walk from the gate to the hall steps."""
    stone = STONE
    brick = GREY_BRICK
    cx = (L + R) // 2
    for y in range(y0, y1):
        for x in range(L, R):
            lx, ly = x - L, y - y0
            if kind == 'stone':
                j = (lx + ((ly // 9) % 2) * 11) % 22
                q = stone[3] if j == 0 or ly % 9 == 8 else stone[2]
                if h2((lx + ((ly // 9) % 2) * 11) // 22, ly // 9, 691) < 0.25 and q == stone[2]:
                    q = stone[1]
            else:
                q = brick[4] if lx % 8 == 7 or ly % 6 == 5 else brick[2] if lx % 8 == 0 or ly % 6 == 0 else brick[3]
            if path and abs(x - cx) < 9:
                j = ly % 7
                q = stone[1] if j == 0 else stone[3] if j == 6 or abs(x - cx) == 8 else stone[2]
            c.p(x, y, q)


def vat(c, cx, by, R=9):
    """A glazed fish vat full of water, lotus leaves on it."""
    glaze = ramp(40, 0.06, lift=-0.18)
    water = ramp(222, 0.06, lift=-0.14)
    so.lathe(c, cx, by, [(0, R * 0.7), (R * 0.9, R), (R * 1.3, R * 0.95)], glaze,
             hollow=(R * 0.95 - 1.2, R * 0.3), fill=(R * 1.25, water))
    for dx, dy in ((-3, 0), (2, -1)):
        x, y = cx + dx, by - round(R * 1.25) + dy
        for i in range(-1, 2):
            c.p(x + i, y, pr.LEAF[2]); c.p(x + i, y + 1, pr.LEAF[3])


def courtyard(spec=None, info=None):
    """A house round a court, the siheyuan and its southern and Korean kin:
    the main hall across the back, side ranges whose roofs run up the screen,
    the court between with its walk, vat and trees, and the street range in
    front with the gate. Each range is a Hall; the court is drawn here."""
    s = dict(W=240, wing=None, court=56, floor='brick', trees=2, vats=1, front={}, main={}, side_tone=None)
    s.update(spec or {})
    W = s['W']
    wing = s['wing'] or max(34, round(W * 0.2))
    F = Hall({**s['front'], 'W': W})
    fim = F.build()
    B = Hall({**s['main'], 'W': W - 2 * max(0, wing - 26)})
    bim = B.build()
    bx = (F.x0 - B.x0) + max(0, wing - 26)
    yB = B.base
    court_d = s['court']
    ftop = F.top - 12
    oy = yB + court_d - ftop
    H = oy + fim.height
    c = C(max(fim.width, bim.width + bx), H)
    c.im.alpha_composite(bim, (bx, 0))
    c.px = c.im.load()
    L, R = F.x0 + wing, F.x0 + W - wing
    court_floor(c, L, R, yB - 2, oy + F.top + 2, s['floor'])
    # the main hall's terrace and the shade the side ranges throw
    r = TILES.get(s['side_tone'] or s['main'].get('tone', 'tile'), TILE)
    ys, ye = yB - 22, oy + F.top
    side_range(c, F.x0 - 6, L, ys, ye, r, True)
    side_range(c, F.x0 + W + 6, R, ys, ye, r, False)
    for k in range(7):
        for y in range(ys, ye):
            fp.shade(c, L + k, y, 0.36 * (1 - k / 7))
    for k in range(4):
        for x in range(L, R):
            fp.shade(c, x, yB - 2 + k, 0.2 * (1 - k / 4))
    # vats and trees, set symmetrically either side of the walk
    cx = (L + R) // 2
    gap = (R - L) // 4
    yt = yB + court_d // 2 + 8
    if s['trees']:
        for side in ((-1, 1) if s['trees'] > 1 else (-1,)):
            x = cx + side * gap
            so.lathe(c, x, yt + 4, [(0, 7), (5, 7)], STONE, rim=True)
            pr.tree(c, x, yt, s.get('tree', 'pomegranate'), size=0.8)
    if s['vats']:
        vat(c, cx + (gap if s['trees'] < 2 else 0) + (0 if s['trees'] < 2 else 0) - (0), yt + 14 if s['trees'] > 1 else yt + 6, 8)
    c.im.alpha_composite(fim, (0, oy))
    c.px = c.im.load()
    if info is not None:
        info.update(x0=F.x0, W=W, base=F.base - 1 + oy, door_x=F.door_x, door_h=F.door_h)
    finish(c)
    consolidate(c, rare=6)
    return c.im


def hall(spec=None, info=None):
    return Hall(spec or {}).build(info)


def row(spec=None, info=None):
    """A street range of gable-front houses wall to wall, each with its own
    gable and slopes, the later house's eave lapping its neighbour's."""
    s = dict(W=192, units=2, unit={})
    s.update(spec or {})
    n = s['units']
    widths = [s['W'] // n + (1 if k < s['W'] % n else 0) for k in range(n)]
    built = []
    for k, w in enumerate(widths):
        u = {**s['unit'], **s.get('each', [{}] * n)[k], 'W': w, 'seed': s.get('seed', 0) + k}
        g = GableFront(u)
        im = g.build()
        built.append((g, im))
    g0 = built[0][0]
    tall = max(g.base for g, _ in built)
    W = s['W']
    c = C(g0.x0 + W + g0.over + 16, tall + 6)
    x = 0
    doors = []
    for k, (g, im) in enumerate(built):
        c.im.alpha_composite(im, (x, tall - g.base))
        doors.append((x + g.door_x, g.door_h))
        x += widths[k]
    c.px = c.im.load()
    if info is not None:
        dx, dh = doors[len(doors) // 2]
        info.update(x0=g0.x0, W=W, base=tall - 1, door_x=dx, door_h=dh)
    consolidate(c, rare=6)
    return c.im


BUILD = {'courtyard': lambda s, i=None: courtyard(s, i), 'gable': lambda s, i=None: gable_front(s, i),
         'hall': lambda s, i=None: hall(s, i), 'row': lambda s, i=None: row(s, i)}

# ------------------------------------------------------------------ the game's frames

STYLES = {
    'south-chinese': dict(tone='dark', posts='dark', lattices=('ice', 'fret', 'grid'), curve=2, ridge='upturn',
                          hall_ridge='swallow', wall='white', gable='horse', floor='stone', tree=None),
    'north-chinese': dict(tone='tile', posts='red', lattices=('lozenge', 'fret', 'grid'), curve=1, ridge='upturn',
                          hall_ridge='chiwen', wall='brick', gable='brick', floor='brick', tree='pomegranate'),
    'early-chinese': dict(tone='han', posts='black', lattices=('bars', 'bars', 'lozenge'), curve=0, ridge='plain',
                          hall_ridge='plain', wall='earth', gable='earth', floor='brick', tree='pomegranate'),
    'korean': dict(tone='tile', posts='timber', lattices=('grid', 'bars', 'grid'), curve=3, ridge='upturn',
                   hall_ridge='upturn', wall='white', gable='plaster', floor='stone', tree='pomegranate'),
    'japanese': dict(tone='tile', posts='dark', lattices=('grid', 'grid', 'bars'), curve=0, ridge='oni',
                     hall_ridge='oni', wall='white', gable='plaster', floor='stone', tree=None),
}


def house_spec(p, size, v, w, W, fn):
    """A household's own house, by region, size and means."""
    st = STYLES[p]
    lat = st['lattices'][v % 3]
    base = dict(W=W, tone=st['tone'], posts=st['posts'], lattice=lat, curve=st['curve'], ridge=st['ridge'],
                seed=v * 7 + W, wear=0.55 - 0.15 * w)
    poor = w == 0
    if p == 'korean':
        if poor or size == 'tiny':
            return dict(base, form='gable', front='wall', wall='earth', roof='rice', ridge='plain', curve=0,
                        door='plain', plinth=8)
        return dict(base, form='xieshan', front='timber', sill='white', door='leaves', plinth=12,
                    wall_h=54, beam='caihua' if size == 'grand' else 'bare', brackets=size == 'grand')
    if p == 'early-chinese':
        thatch = poor or size == 'tiny'
        if size in ('tiny', 'small'):
            return dict(base, form='hip', front='wall', wall='earth', roof='thatch' if thatch else 'tile',
                        ridge='plain', door='leaves', plinth=4)
        return dict(base, form='hip', front='timber', sill='brick', door='leaves', plinth=8 if size == 'medium' else 14,
                    beam='red' if w > 1 else 'bare', wall='earth', lanterns=False)
    north = p == 'north-chinese'
    if size == 'tiny' or (size == 'small' and poor):
        return dict(base, form='gable', front='wall', wall=st['wall'], roof='thatch' if poor and v % 2 == 0 else 'tile',
                    door='plain' if poor else 'leaves', couplets=not poor, plinth=4, ridge='plain' if poor else st['ridge'],
                    curve=0 if poor else st['curve'])
    if size == 'small':
        if north:
            return dict(base, form='gable', front='timber', sill='brick', door='leaves', couplets=True, plinth=6)
        return dict(base, form='horse', front='wall', wall='white', door='stone', hood=True, couplets=True,
                    plinth=4, horse=2)
    if size == 'medium':
        hall_ = fn == 'ancestral-hall'
        if not north and not hall_ and v % 3 == 0:
            return dict(base, form='horse', front='wall', wall='white', door='stone', hood=True, couplets=True,
                        plinth=4, horse=2, frieze=True)
        return dict(base, form='gable', front='timber', sill='brick', door='leaves', couplets=True,
                    plinth=10 if hall_ else 8, lanterns=hall_, beam='red' if hall_ else 'bare',
                    ridge=st['hall_ridge'] if hall_ else st['ridge'], posts='red' if hall_ and north else st['posts'])
    # grand: an elite or official hall on a high terrace
    return dict(base, form='xieshan', front='timber', sill='brick', door='leaves', plinth=16, lanterns=True,
                beam='caihua', brackets=True, ridge=st['hall_ridge'], lattice='fret', wall_h=60,
                posts='red' if north else st['posts'])


def courtyard_spec(p, size, v, w, W):
    st = STYLES[p]
    lat = st['lattices'][v % 3]
    common = dict(tone=st['tone'], posts=st['posts'], lattice=lat, curve=st['curve'], seed=v * 11 + W)
    if p == 'south-chinese':
        front = dict(common, form='horse', front='wall', wall='white', door='stone', hood=True, ridge='upturn',
                     plinth=4, horse=2)
    elif p == 'korean':
        front = dict(common, form='xieshan', front='wall', wall='white', door='leaves', hood=False, ridge='upturn',
                     plinth=8)
    elif p == 'early-chinese':
        front = dict(common, form='hip', front='wall', wall='earth', door='leaves', ridge='plain', plinth=4)
    else:
        front = dict(common, form='gable', front='wall', wall='brick', door='leaves', hood=True, ridge='upturn',
                     plinth=4)
    rich = w >= 2
    main = dict(common, form='xieshan' if rich and p != 'early-chinese' else 'hip' if p == 'early-chinese' else 'gable',
                front='timber', sill='brick' if p != 'korean' else 'white', door='leaves', plinth=12 if rich else 8,
                lanterns=rich, couplets=True, beam='caihua' if rich else 'red' if w else 'bare', brackets=rich,
                ridge=st['hall_ridge'] if rich else st['ridge'], posts='red' if p == 'north-chinese' else st['posts'])
    return dict(W=W, court=64 if size == 'large' else 48, floor=st['floor'], trees=0 if st['tree'] is None else 2,
                tree=st['tree'] or 'pomegranate', vats=1, side_tone=st['tone'], front=front, main=main)


def row_spec(p, size, v, w, W):
    st = STYLES[p]
    lat = st['lattices'][v % 3]
    n = 3 if size == 'large' else 2
    common = dict(tone=st['tone'], posts=st['posts'], lattice=lat, curve=0, plinth=3)
    if p == 'japanese':
        unit = dict(common, front='koshi', storeys=2, upper='mushiko', upper_h=30, wall_h=54, ridge='oni',
                    gable='plaster')
        each = [dict(shop=k % 2 == 0) for k in range(n)]
        if size == 'large':
            each[-1] = dict(front='kura', upper='kura', pent=False, upper_h=34, wall_h=56)
        return 'row', dict(W=W, units=n, unit=unit, each=each)
    if p == 'south-chinese':
        unit = dict(common, front='timber', storeys=2, gallery=True, wall_h=58, ridge='upturn', gable='horse', horse=2,
                    pent=False, door='leaves', lattice=lat)
        return 'row', dict(W=W, units=n, unit=unit, each=[dict(shop=k % 2 == 0) for k in range(n)])
    # the north builds its shops eave-front, a gallery over the counters
    return 'hall', dict(common, W=W, form='gable', front='timber', storeys=2, gallery=w > 0, upper_h=40, wall_h=58,
                        shop=True, door='leaves', ridge=st['ridge'], curve=st['curve'], lanterns=w > 1,
                        couplets=True, sill='board', plinth=4)


def service_spec(p, style, v, w, W):
    st = STYLES[p]
    lat = st['lattices'][v % 3]
    common = dict(W=W, tone=st['tone'], posts=st['posts'], lattice=lat, curve=st['curve'], ridge=st['ridge'],
                  seed=v * 13 + W)
    if p == 'japanese':
        if style == 'storehouse':
            return 'gable', dict(common, front='kura', storeys=2, upper='kura', upper_h=30, wall_h=56, pent=False,
                                 gable='plaster', plinth=6)
        if style == 'workshop':
            return 'gable', dict(common, front='open', gable='plaster', plinth=3, wall_h=54)
        if style == 'gatehouse':
            return 'hall', dict(common, front='gate', wall='white', form='gable', plinth=6)
        return 'hall', dict(common, front='timber', form='xieshan', sill='board', door='leaves', plinth=10,
                            lanterns=True, wall_h=56)
    if style == 'storehouse':
        return 'hall', dict(common, front='wall', wall='earth' if p == 'korean' else st['wall'], door='plain',
                            form='gable', plinth=6, ridge='plain')
    if style == 'workshop':
        return 'hall', dict(common, front='open', form='gable', plinth=3)
    if style == 'gatehouse':
        return 'hall', dict(common, front='gate', wall='white' if p in ('south-chinese', 'korean') else 'brick',
                            form='horse' if p == 'south-chinese' else 'gable', plinth=6, horse=2)
    return 'hall', dict(common, front='timber', form='xieshan' if p != 'south-chinese' else 'gable',
                        sill='brick', door='leaves', plinth=10, lanterns=True, beam='red', couplets=True,
                        ridge=st['hall_ridge'], posts='red' if p == 'north-chinese' else st['posts'])


def period_spec(base, W):
    """The town frames: shophouses, the gate range, machiya and hanok."""
    b = base.removeprefix('period-')
    north, south, jp, ko = STYLES['north-chinese'], STYLES['south-chinese'], STYLES['japanese'], STYLES['korean']
    if b in ('chinese-shophouse', 'chinese-shophouse-b'):
        alt = b.endswith('-b')
        return 'sino-hall', dict(W=W, form='gable', front='timber', storeys=2, gallery=not alt, upper_h=40, wall_h=58,
                                 shop=True, door='leaves', tone=north['tone'], posts='dark',
                                 lattice='grid' if alt else 'lozenge', ridge='upturn', curve=1, lanterns=not alt,
                                 couplets=True, sill='board', plinth=4, seed=W + alt)
    if b in ('chinese-shophouse-south', 'chinese-shophouse-south-b'):
        alt = b.endswith('-b')
        return 'sino-gable', dict(W=W, front='timber', storeys=2, gallery=not alt, upper='lattice', wall_h=58,
                                  upper_h=40, tone=south['tone'], posts='dark', lattice='grid' if alt else 'ice',
                                  shop=True, door='leaves', ridge='upturn', curve=0, plinth=4, gable='horse',
                                  horse=1 if alt else 2, pent=False, seed=W + alt)
    if b == 'chinese-courtyard-gate':
        return 'sino-hall', dict(W=W, front='gate', wall='brick', form='gable', tone=north['tone'], posts='red',
                                 ridge='upturn', curve=1, plinth=6, lanterns=True)
    if b == 'chinese-courtyard-gate-south':
        return 'sino-hall', dict(W=W, front='wall', wall='white', form='horse', tone=south['tone'], posts='dark',
                                 door='stone', hood=True, couplets=True, ridge='upturn', curve=1, plinth=4, horse=2,
                                 lattice='ice')
    if b in ('machiya', 'machiya-b'):
        alt = b.endswith('-b')
        return 'sino-gable', dict(W=W, front='koshi', storeys=2, upper='mushiko', upper_h=30, wall_h=54,
                                  tone=jp['tone'], posts='dark', ridge='oni', curve=0, plinth=3, gable='plaster',
                                  udatsu=alt, shop=alt, seed=W + alt)
    if b == 'machiya-shop':
        unit = dict(front='koshi', storeys=2, upper='mushiko', upper_h=30, wall_h=54, tone=jp['tone'], posts='dark',
                    ridge='oni', curve=0, plinth=3, gable='plaster')
        return 'sino-row', dict(W=W, units=2, unit=unit, each=[dict(shop=True), dict(shop=False, udatsu=True)])
    if b in ('hanok', 'hanok-b'):
        alt = b.endswith('-b')
        return 'sino-hall', dict(W=W, form='xieshan', front='timber', sill='white', door='leaves', plinth=12,
                                 tone=ko['tone'], posts='timber', lattice='bars' if alt else 'grid', curve=3,
                                 ridge='upturn', wall_h=54, seed=W + alt)
    return None


def spec_for(base, r, nw, fh):
    """The builder and spec for one of the game's East Asian frames."""
    import re
    if base.startswith('period-'):
        return period_spec(base, nw * 16)
    m = re.match(r'eastasian-(house|courtyard|row|service)-([a-z-]+?)-(tiny|small|medium|large|grand)-(\d+)$', base)
    if not m:
        return None
    fam, p, size, v = m.group(1), m.group(2), m.group(3), int(m.group(4))
    if p not in STYLES:
        return None
    W = nw * 16
    w = r.get('wealthTier', 1)
    if fam == 'house':
        return 'sino-hall', house_spec(p, size, v, w, W, r.get('buildingFunction'))
    if fam == 'courtyard':
        return 'sino-court', courtyard_spec(p, size, v, w, W)
    if fam == 'row':
        kind, spec = row_spec(p, size, v, w, W)
        return f'sino-{kind}', spec
    kind, spec = service_spec(p, r.get('serviceStyle', 'storehouse'), v, w, W)
    return f'sino-{kind}', spec


BUILDERS = {'sino-hall': lambda s, i: hall(dict(s), i), 'sino-gable': lambda s, i: gable_front(dict(s), i),
            'sino-court': lambda s, i: courtyard(dict(s), i), 'sino-row': lambda s, i: row(dict(s), i)}


# ------------------------------------------------------------------ the sheet

SHEET = [
    ('machiya (gable)', ('gable', dict(W=124, front='koshi', storeys=2, upper='mushiko', upper_h=30, wall_h=54, tone='tile',
                                       posts='dark', ridge='oni', curve=0, plinth=3, gable='plaster', shop=False))),
    ('machiya shop (gable)', ('gable', dict(W=124, front='koshi', storeys=2, upper='mushiko', upper_h=30, wall_h=54, tone='tile',
                                            posts='dark', ridge='oni', curve=0, plinth=3, gable='plaster', shop=True))),
    ('kura (gable)', ('gable', dict(W=96, front='kura', storeys=2, upper='kura', upper_h=30, wall_h=56, tone='tile',
                                    posts='dark', ridge='oni', curve=0, plinth=6, pent=False, gable='plaster'))),
    ('south shop (stepped gable)', ('gable', dict(W=120, front='timber', storeys=2, gallery=True, tone='dark', posts='dark',
                                                  lattice='grid', shop=True, door='leaves', ridge='upturn', curve=0, plinth=4,
                                                  wall_h=58, gable='horse', horse=2, pent=False))),
    ('north house (gable)', ('gable', dict(W=110, front='wall', wall='brick', gable='brick', tone='tile', posts='red',
                                           lattice='lozenge', door='leaves', couplets=True, ridge='upturn', curve=0, plinth=6))),

    ('south house', dict(W=130, form='horse', front='wall', wall='white', tone='dark', door='stone', hood=True,
                         ridge='upturn', curve=1, lattice='ice', posts='dark', couplets=True, plinth=4)),
    ('south hall', dict(W=176, form='gable', front='timber', tone='dark', ridge='swallow', curve=2, posts='dark',
                        lattice='ice', beam='bare', door='leaves', lanterns=True, plinth=10)),
    ('north house', dict(W=130, form='gable', front='timber', tone='tile', ridge='upturn', curve=1, posts='red',
                         lattice='lozenge', sill='brick', door='leaves', couplets=True, plinth=8)),
    ('north hall', dict(W=200, form='xieshan', front='timber', tone='tile', ridge='chiwen', curve=1, posts='red',
                        lattice='fret', beam='caihua', brackets=True, door='leaves', plinth=14, lanterns=True)),
    ('early house', dict(W=120, form='hip', front='wall', wall='earth', tone='han', ridge='plain', curve=0,
                         posts='black', lattice='bars', door='leaves', plinth=6)),
    ('korean house', dict(W=140, form='xieshan', front='timber', tone='tile', ridge='upturn', curve=3,
                          posts='timber', lattice='grid', sill='white', door='leaves', plinth=12)),
    ('korean choga', dict(W=110, form='gable', front='wall', wall='earth', roof='rice', posts='timber',
                          lattice='grid', door='plain', plinth=8, ridge='plain', curve=0)),
    ('north courtyard', ('courtyard', dict(W=240, floor='brick', trees=2, front=dict(front='wall', wall='brick', tone='tile', door='leaves', hood=True, ridge='upturn', curve=1, posts='red', lattice='lozenge', plinth=4, seed=1),
                                       main=dict(front='timber', tone='tile', ridge='upturn', curve=1, posts='red', lattice='fret', beam='red', door='leaves', plinth=10, couplets=True)))),
    ('south tianjing', ('courtyard', dict(W=200, floor='stone', trees=0, court=40, side_tone='dark', front=dict(form='horse', front='wall', wall='white', tone='dark', door='stone', hood=True, ridge='upturn', curve=1, posts='dark', lattice='ice', plinth=4),
                                         main=dict(front='timber', tone='dark', ridge='swallow', curve=2, posts='dark', lattice='ice', door='leaves', plinth=8, lanterns=True)))),
    ('machiya', dict(W=150, form='gable', front='koshi', storeys=2, upper='mushiko', upper_h=30, wall_h=54, tone='tile', posts='dark', ridge='oni', curve=0, plinth=3, udatsu=True)),
    ('kura', dict(W=110, form='gable', front='kura', storeys=2, upper='kura', upper_h=34, wall_h=56, tone='tile', posts='dark', ridge='oni', curve=0, plinth=6, pent=False)),
    ('gatehouse', dict(W=110, form='gable', front='gate', wall='brick', tone='tile', posts='red', ridge='upturn', curve=1, plinth=6)),
    ('workshop', dict(W=120, form='gable', front='open', tone='tile', posts='timber', ridge='plain', curve=0, plinth=3)),
    ('south shop', dict(W=150, form='horse', front='timber', storeys=2, gallery=True, tone='dark', posts='dark',
                        lattice='grid', shop=True, door='leaves', ridge='upturn', curve=1, plinth=4, wall_h=58)),
]


def make(out, zoom=3):
    from PIL import Image, ImageDraw
    ims = [(name, BUILD[spec[0]](dict(spec[1])) if isinstance(spec, tuple) else hall(dict(spec))) for name, spec in SHEET]
    pad = 14
    W = sum(im.width for _, im in ims) + pad * (len(ims) + 1) + 30
    H = max(im.height for _, im in ims) + 30
    sheet = Image.new('RGBA', (W, H), (110, 128, 84, 255))
    x = pad
    d = ImageDraw.Draw(sheet)
    for name, im in ims:
        sheet.alpha_composite(im, (x, H - im.height - 4))
        d.text((x, 4), name, fill=(20, 24, 20, 255))
        x += im.width + pad
    fig = Image.open(ROOT / 'scripts/art/reference/current-adult.png').convert('RGBA')
    sheet.alpha_composite(fig, (W - fig.width - 6, H - fig.height - 4))
    sheet = sheet.resize((W * zoom, H * zoom), Image.Resampling.NEAREST)
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print('wrote', out)


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-sinitic/sheet.png', int(sys.argv[2]) if len(sys.argv) > 2 else 2)
