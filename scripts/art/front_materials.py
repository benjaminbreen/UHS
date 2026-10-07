"""Materials for front-on buildings: tileable surfaces on fixed pixel modules,
coloured from one value ladder so every material belongs to the same art.

    .venv/bin/python scripts/art/front_materials.py artifacts/front-materials.png

Every ramp has the same eight lightness steps (LADDER, in OKLab L), so brick,
slate and thatch share a value structure. Lights lean warm and shadows lean
violet by the same rule for every hue. Light comes from the upper left.
Painters take world coordinates, so a pattern stays continuous across parts.
"""
from pathlib import Path
import math
import sys

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

# ------------------------------------------------------------------ colour

LADDER = (0.96, 0.87, 0.77, 0.67, 0.57, 0.47, 0.37, 0.27)
WARM_HUE, COOL_HUE = 85.0, 285.0


def _oklab_to_srgb(L, a, b):
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    rgb = (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
           -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
           -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)
    return rgb


def _gamma(v):
    return 12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055


def oklch(L, C, h):
    """sRGB for an OKLCh colour, chroma reduced until it fits the gamut."""
    for _ in range(40):
        r, g, b = _oklab_to_srgb(L, C * math.cos(math.radians(h)), C * math.sin(math.radians(h)))
        if min(r, g, b) >= -0.001 and max(r, g, b) <= 1.001:
            break
        C *= 0.9
    return tuple(max(0, min(255, round(_gamma(max(0, min(1, v))) * 255))) for v in (r, g, b)) + (255,)


def _toward(h, target, amount):
    d = (target - h + 540) % 360 - 180
    return h + max(-amount, min(amount, d))


def ramp(hue, chroma, warm=18, cool=26, lift=0.0):
    """Eight steps, light to dark, on the shared ladder. Chroma peaks in the
    middle; the light end leans warm and the dark end leans violet."""
    out = []
    for i, L in enumerate(LADDER):
        t = (i - 3.5) / 3.5
        h = _toward(hue, WARM_HUE, warm * -t) if t < 0 else _toward(hue, COOL_HUE, cool * t)
        c = chroma * (1 - 0.42 * t * t) * (0.85 if i == 0 else 1)
        out.append(oklch(min(0.985, L + lift), c, h))
    return out


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)


def blob(c, cx, cy, rx, ry, col, seed, edge=None):
    """An organic patch: an ellipse whose rim is broken by noise, never a
    square. `edge` paints the rim on the lower right, as a shallow step."""
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if d <= 1 - 0.35 * h2(x, y, seed):
                c.p(x, y, col)
                if edge and d > 0.55 and (x - cx) + (y - cy) > 0:
                    c.p(x, y, edge)


def h2(x, y, s=0):
    n = (x * 374761393 + y * 668265263 + s * 2246822519) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return ((n ^ (n >> 16)) & 0xFFFF) / 65536


# Material hues and chroma: the only place a material's colour is chosen.
RAMPS = {
    'limestone': ramp(80, 0.048, lift=0.03),
    'sandstone': ramp(70, 0.06),
    'granite': ramp(250, 0.012, warm=10, cool=14),
    'brick': ramp(38, 0.11),
    'brick-dark': ramp(28, 0.09, lift=-0.08),
    'mortar': ramp(80, 0.02),
    'render': ramp(80, 0.048, lift=0.025),
    'whitewash': ramp(95, 0.012, lift=0.03),
    'adobe': ramp(58, 0.07),
    'oak': ramp(52, 0.09, lift=-0.12),
    'pine': ramp(68, 0.08),
    'cedar': ramp(40, 0.07, lift=-0.08),
    'slate': ramp(272, 0.05, warm=8, cool=12, lift=-0.1),
    'zinc': ramp(255, 0.025, warm=6, cool=10, lift=-0.06),
    'terracotta': ramp(42, 0.12),
    'clay-tile': ramp(34, 0.1, lift=-0.04),
    'shingle': ramp(40, 0.13, lift=-0.08),
    'thatch': ramp(80, 0.085),
    'kawara': ramp(262, 0.025, warm=6, cool=10, lift=-0.12),
    'palm': ramp(95, 0.08),
    'plaster-ochre': ramp(75, 0.09),
}


# ------------------------------------------------------------------ canvas

class C:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.im = Image.new('RGBA', (w, h))
        self.px = self.im.load()

    def p(self, x, y, c):
        x, y = int(x), int(y)
        if 0 <= x < self.w and 0 <= y < self.h and c:
            self.px[x, y] = c

    def g(self, x, y):
        return self.px[x, y] if 0 <= x < self.w and 0 <= y < self.h else (0, 0, 0, 0)

    def rect(self, x, y, w, h, c):
        for yy in range(max(0, y), min(self.h, y + h)):
            for xx in range(max(0, x), min(self.w, x + w)):
                self.px[xx, yy] = c


def fill(c, x0, y0, w, h, fn):
    """Paint a region from fn(x, y) in world coordinates."""
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            col = fn(x, y)
            if col:
                c.p(x, y, col)


# ------------------------------------------------------------------ walls

def ashlar(c, x0, y0, w, h, r=None, course=7, block=18):
    """Dressed stone: a lit top arris on each block, joints recessed, the odd
    block cut from a warmer or cooler bed. Quiet: two tones carry the face."""
    r = r or RAMPS['limestone']
    warm, cool = mix(r[1], r[2], 0.45), mix(r[1], r[0], 0.5)

    def f(x, y):
        row, ly = y // course, y % course
        off = (row % 2) * (block // 2)
        bx, lx = (x + off) // block, (x + off) % block
        if ly == course - 1:
            return r[3]
        if lx == 0:
            return r[3]
        if ly == 0:
            return r[0]
        k = h2(bx, row, 5)
        face = warm if k < 0.16 else cool if k < 0.26 else r[1]
        if lx == block - 1 or ly == course - 2:
            return mix(face, r[2], 0.6)
        return face
    fill(c, x0, y0, w, h, f)

def rustication(c, x0, y0, w, h, r=None, course=8, block=24):
    """Deep V-jointed courses: each block's top catches light, the chamfer
    under it falls into shadow."""
    r = r or RAMPS['limestone']

    def f(x, y):
        row, ly = y // course, y % course
        lx = (x + (row % 2) * (block // 2)) % block
        prof = [r[0], r[1], r[1], r[2], r[2], r[3], r[4], r[5]][ly]
        if 0 < ly < course - 2 and lx == 0:
            return r[4]
        if 0 < ly < course - 2 and lx == 1:
            return r[1]
        return prof
    fill(c, x0, y0, w, h, f)


def brick(c, x0, y0, w, h, r=None, bond='stretcher', mortar=None):
    """Bricks 8x4 with mortar between, a lit top edge and a shaded lower right;
    tones vary brick by brick, never pixel by pixel. Flemish bond lays dark
    burnt headers between stretchers."""
    r = r or RAMPS['brick']
    m = mortar or RAMPS['mortar']
    dark = RAMPS['brick-dark']

    def f(x, y):
        row, ly = y // 4, y % 4
        if bond == 'flemish':
            unit = 12
            u = (x + (row % 2) * 6) % unit
            header = u >= 8
            lx, bw = (u - 8, 4) if header else (u, 8)
            idx = ((x + (row % 2) * 6) // unit) * 2 + header
        else:
            lx, bw, header = (x + (row % 2) * 4) % 8, 8, False
            idx = (x + (row % 2) * 4) // 8
        if ly == 3:
            return m[3] if lx != bw - 1 else m[4]
        if lx == bw - 1:
            return m[4] if ly else m[3]
        rr = dark if header else r
        k = h2(idx, row, 11)
        base = 4 if k < 0.62 else 3 if k < 0.86 else 5
        if ly == 0:
            return rr[base - 1]
        if ly == 2 and lx >= bw - 3:
            return rr[base + 1]
        return rr[base]
    fill(c, x0, y0, w, h, f)

def rubble(c, x0, y0, w, h, r=None, m=None):
    """Random stone in a lime bed: each stone a rounded cell, lit on its upper
    left, shadowed lower right, the mortar between pale and recessed."""
    r = r or RAMPS['granite']
    m = m or RAMPS['mortar']
    cw, ch = 9, 6

    def seed(i, j):
        return (i * cw + 1 + h2(i, j, 21) * (cw - 3), j * ch + 1 + h2(i, j, 22) * (ch - 2))

    def f(x, y):
        i, j = x // cw, y // ch
        best = []
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                sx, sy = seed(i + di, j + dj)
                d = ((x - sx) / 1.25) ** 2 + (y - sy) ** 2
                best.append((d, sx, sy, i + di, j + dj))
        best.sort()
        d0, sx, sy, si, sj = best[0]
        edge = math.sqrt(best[1][0]) - math.sqrt(d0)
        if edge < 0.9:
            return m[3] if (x + y) % 3 else m[4]
        rel = (x - sx) + (y - sy) * 1.3
        tone = h2(si, sj, 23)
        base = 2 if tone < 0.3 else 3 if tone < 0.8 else 4
        if edge < 1.9:
            return r[base + 1] if rel > 0 else r[base - 1]
        return r[base]
    fill(c, x0, y0, w, h, f)


def render(c, x0, y0, w, h, r=None, ground=None):
    """Lime render: one flat face, a few worn patches with soft edges, a
    hairline crack, damp rising unevenly from the foot."""
    r = r or RAMPS['render']
    ground = y0 + h if ground is None else ground

    def f(x, y):
        rise = 4 + 0.8 * math.sin(x * 0.19) + 0.6 * math.sin(x * 0.05 + 1)
        if ground - y < rise:
            return mix(r[1], r[2], 0.55) if ground - y > 1.5 else r[2]
        return r[1]
    fill(c, x0, y0, w, h, f)
    for k in range(max(1, w * h // 1400)):
        cx = x0 + 6 + h2(k, w, 33) * (w - 12)
        cy = y0 + 5 + h2(k, h, 34) * (h - 16)
        blob(c, cx, cy, 3 + h2(k, 1, 35) * 4, 2 + h2(k, 2, 35) * 2,
             mix(r[1], r[2], 0.55), 36 + k, mix(r[2], r[3], 0.4))
    cx, cy = x0 + int(h2(9, w, 37) * (w - 14)) + 6, y0 + 4
    for i in range(9):
        c.p(cx + (i // 3) + (1 if i % 4 == 3 else 0), cy + i, r[3])

def whitewash(c, x0, y0, w, h, r=None, under=None):
    """Lime wash over stone: bright and flat, a few flakes where the stone
    shows, each flake's upper rim a lit edge of the wash."""
    r = r or RAMPS['whitewash']
    under = under or RAMPS['granite']
    render(c, x0, y0, w, h, r)
    for k in range(max(1, w * h // 1300)):
        cx = x0 + 8 + h2(k, 1, 41) * (w - 16)
        cy = y0 + 6 + h2(k, 2, 41) * (h - 16)
        rx, ry = 3 + h2(k, 3, 41) * 3, 2 + h2(k, 4, 41) * 1.5
        blob(c, cx, cy, rx + 1, ry + 1, r[0], 42 + k)
        blob(c, cx, cy + 0.6, rx, ry, under[3], 43 + k, under[4])

def adobe(c, x0, y0, w, h, r=None):
    """Mud plaster over mud brick: soft and warm, courses ghosting through,
    a patch fallen away to show the bricks with a lit broken rim."""
    r = r or RAMPS['adobe']

    def f(x, y):
        if y % 9 == 8 and h2(x // 7, y, 51) < 0.4:
            return mix(r[2], r[3], 0.5)
        return r[2]
    fill(c, x0, y0, w, h, f)
    for k in range(max(1, w * h // 1500)):
        cx = x0 + 12 + h2(k, 3, 53) * (w - 24)
        cy = y0 + 8 + h2(k, 4, 53) * (h - 18)
        blob(c, cx, cy - 0.8, 8, 4.6, r[1], 54 + k)
        for y in range(int(cy) - 4, int(cy) + 5):
            for x in range(int(cx) - 8, int(cx) + 9):
                if ((x - cx) / 7.2) ** 2 + ((y - cy) / 3.9) ** 2 > 1 - 0.3 * h2(x, y, 55 + k):
                    continue
                row, ly = (y - y0) // 4, (y - y0) % 4
                lx = (x - x0 + (row % 2) * 4) % 8
                col = r[4] if ly == 3 or lx == 7 else r[3] if ly == 0 else mix(r[3], r[4], 0.35)
                c.p(x, y, col)

def clapboard(c, x0, y0, w, h, r=None, board=5):
    """Lapped weatherboard: each board's lower edge throws a dark line on the
    one below; grain runs along it; nails at the studs."""
    r = r or RAMPS['pine']

    def f(x, y):
        ly = y % board
        row = y // board
        if ly == board - 1:
            return r[5]
        if ly == 0:
            return r[2]
        col = r[3]
        if ly == 1:
            col = r[2]
        g = h2(x // 9 + row * 7, row, 61)
        if ly == 2 and (x + row * 5) % 13 < 4 and g < 0.6:
            col = r[4]
        if x % 24 == 0 and ly == 2:
            col = r[5]
        return col
    fill(c, x0, y0, w, h, f)


def boards(c, x0, y0, w, h, r=None, board=7):
    """Board and batten: wide vertical boards, a raised batten over each
    joint, lit on its left, shading the board to its right."""
    r = r or RAMPS['oak']

    def f(x, y):
        lx = x % board
        if lx == 0:
            return r[2]
        if lx == 1:
            return r[3]
        if lx == 2:
            return r[5]
        col = r[4] if lx > 3 else mix(r[4], r[5], 0.5)
        if lx == 4 and h2(x, y // 9, 71) < 0.3:
            col = mix(r[4], r[5], 0.5)
        return col
    fill(c, x0, y0, w, h, f)


def logs(c, x0, y0, w, h, r=None, d=6):
    """Round logs stacked: a cylinder shade on each, chinking dark between."""
    r = r or RAMPS['pine']
    prof = [r[6], r[3], r[2], r[2], r[3], r[4]]

    def f(x, y):
        ly = y % d
        col = prof[ly]
        if ly in (2, 3) and h2(x // 11, y // d, 81) < 0.3 and x % 11 < 5:
            col = r[3]
        return col
    fill(c, x0, y0, w, h, f)


def half_timber(c, x0, y0, w, h, oak=None, infill=None):
    """Oak frame proud of a lime infill: posts, rails and a brace in each
    lower panel, the infill shaded where the timber stands over it."""
    oak = oak or RAMPS['oak']
    inf = infill or RAMPS['render']
    render(c, x0, y0, w, h, inf)
    solid = set()

    def put(x, y, col):
        if x0 <= x < x0 + w and y0 <= y < y0 + h:
            c.p(x, y, col)
            solid.add((x, y))

    def member(x, y, ww, hh):
        for yy in range(y, y + hh):
            for xx in range(x, x + ww):
                a, b = xx - x, yy - y
                col = oak[3]
                if 0 < a < ww - 1 and 0 < b < hh - 1 and h2(xx // 1, yy // 5, 91) < 0.1:
                    col = oak[4]
                if a == 0 or b == 0:
                    col = oak[2]
                if a == ww - 1 or b == hh - 1:
                    col = oak[5]
                put(xx, yy, col)

    pitch, t = 24, 5
    mid = y0 + h // 2 - 2
    for k, px in enumerate(range(x0, x0 + w, pitch)):
        lo, hi = px + t, min(px + pitch, x0 + w)
        if hi - lo > 6:
            for i in range(hi - lo):
                f = i / max(1, hi - lo - 1)
                yy = round(y0 + h - 4 - f * (y0 + h - 4 - mid - 4)) if k % 2 == 0 else round(mid + 4 + f * (y0 + h - 4 - mid - 4))
                for j in range(t - 1):
                    put(lo + i, yy - j, oak[2] if j == t - 2 else oak[5] if j == 0 else oak[3])
    for px in range(x0, x0 + w, pitch):
        member(px, y0, t, h)
    member(x0, y0, w, t)
    member(x0, mid, w, t)
    member(x0, y0 + h - t, w, t)
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            if (x, y) in solid:
                continue
            if (x, y - 1) in solid or (x - 1, y) in solid:
                c.p(x, y, inf[3])
            elif (x, y - 2) in solid:
                c.p(x, y, inf[2])

def slate(c, x0, y0, w, h, r=None):
    r = r or RAMPS['slate']

    def f(x, y):
        row, ly = y // 5, y % 5
        lx = (x + (row % 2) * 4) % 8
        tone = h2((x + (row % 2) * 4) // 8, row, 101)
        base = 3 if tone < 0.7 else 4 if tone < 0.92 else 2
        if ly == 4:
            return r[6]
        if lx == 7:
            return r[base + 1]
        if ly == 0 or lx == 0:
            return r[base - 1]
        return r[base]
    fill(c, x0, y0, w, h, f)


def zinc(c, x0, y0, w, h, r=None, pitch=9):
    """Standing-seam zinc: a raised seam lit on its left, each pan catching
    the sky toward the top, a faint cross welt every few feet."""
    r = r or RAMPS['zinc']

    def f(x, y):
        lx = x % pitch
        if lx == 0:
            return r[1]
        if lx == 1:
            return r[5]
        if (y - y0) % 24 == 23:
            return r[4]
        t = ((y - y0) % 24) / 24
        if lx == 2:
            return r[4]
        return r[2] if t < 0.25 and lx < 5 else r[3]
    fill(c, x0, y0, w, h, f)

def shingles(c, x0, y0, w, h, r=None, tw=12, th=8, mix_=True):
    """Capsule shingles with rounded butts and a lit rim; the course above
    shades each shingle's top. Most share one ramp, a few weather apart."""
    base = r or RAMPS['shingle']
    alt = [RAMPS['terracotta'], RAMPS['clay-tile'], ramp(22, 0.1, lift=-0.04), ramp(62, 0.1)]

    def f(x, y):
        row = y // th
        off = (row % 2) * (tw // 2)
        idx = (x + off) // tw
        lx, ly = (x + off) % tw, y % th
        k = h2(idx, row, 111)
        rr = base if not mix_ or k < 0.74 else alt[int((k - 0.74) / 0.066) % 4]
        cx = (tw - 1) / 2
        cut = (0, 0, 0, 0, 0, 1, 2, 4)[ly] if th == 8 else max(0, ly - (th - 4))
        if abs(lx - cx) > cx - cut:
            return rr[6]
        if abs(lx - cx) > cx - cut - 1.1 or ly == th - 1:
            return rr[5]
        if ly == 0:
            return rr[5]
        if ly == 1:
            return rr[4]
        if ly >= th - 3 and lx < cx:
            return rr[1] if ly == th - 2 else rr[2]
        if lx <= 2:
            return rr[2]
        return rr[3] if lx < tw - 3 else rr[4]
    fill(c, x0, y0, w, h, f)

def pantiles(c, x0, y0, w, h, r=None, col=8, course=10):
    """Mediterranean barrel tiles: convex caps over shadowed channels; each
    course ends in a rounded lip lit along its top, its shadow two rows deep."""
    r = r or RAMPS['terracotta']
    cap = (5, 3, 2, 1, 1, 2, 4)
    lip = (4, 2, 1, 0, 0, 1, 3)

    def f(x, y):
        lx = x % col
        row, ly = y // course, y % course
        sh = 1 if h2(x // col, row, 121) > 0.75 else 0
        if lx < 7:
            if ly >= course - 2:
                return r[7] if ly == course - 1 else r[6]
            if ly == course - 3:
                return r[min(7, lip[lx] + sh)]
            if ly == course - 4:
                return r[min(7, cap[lx] + 1 + sh)]
            return r[min(7, cap[lx] + sh)]
        return r[7] if ly >= course - 2 else r[5]
    fill(c, x0, y0, w, h, f)

def plain_tiles(c, x0, y0, w, h, r=None):
    """Small flat clay tiles, mottled, the lower edge of each course dark."""
    r = r or RAMPS['clay-tile']

    def f(x, y):
        row, ly = y // 4, y % 4
        lx = (x + (row % 2) * 3) % 6
        tone = h2((x + (row % 2) * 3) // 6, row, 131)
        base = 3 if tone < 0.55 else 4 if tone < 0.85 else 2
        if ly == 3:
            return r[6]
        if lx == 5:
            return r[base + 1]
        if ly == 0:
            return r[base - 1]
        return r[base]
    fill(c, x0, y0, w, h, f)


def thatch(c, x0, y0, w, h, r=None, course=10):
    """Straw laid in courses: clumps of strands run down the slope, each
    course's butt-ends combed to a lit, ragged edge with a shadow under it."""
    r = r or RAMPS['thatch']

    def f(x, y):
        row, ly = y // course, y % course
        clump = (x + row * 3) // 3
        rag = int(h2(clump, row, 141) * 2.5)
        end = course - 3 + rag
        if ly > end:
            return r[6] if ly == course - 1 else r[5]
        if ly == end:
            return r[1]
        if ly == end - 1:
            return r[2]
        k = h2(clump, row, 142)
        col = r[3] if k < 0.55 else r[4] if k < 0.85 else r[2]
        if (x + row * 3) % 3 == 2:
            col = r[min(7, r.index(col) + 1)]
        if ly <= 1:
            col = r[5]
        return col
    fill(c, x0, y0, w, h, f)

def kawara(c, x0, y0, w, h, r=None, col=8, course=10):
    """East Asian round tiles: tubular caps over pan channels, each cap
    segment's lower end lapped over the next with a crisp shadow line."""
    r = r or RAMPS['kawara']
    cap = (6, 4, 2, 1, 1, 2, 4)

    def f(x, y):
        lx, ly = x % col, y % course
        if lx < 7:
            if ly == course - 1:
                return r[6]
            if ly == course - 2:
                return r[max(0, cap[lx] - 1)]
            return r[cap[lx]]
        return r[5] if ly < course - 1 else r[7]
    fill(c, x0, y0, w, h, f)

def palm(c, x0, y0, w, h, r=None, course=12):
    """Palm-leaf thatch: long leaflets hang down the slope in courses, their
    tips a sawtooth fringe, lit on the left of each tooth."""
    r = r or RAMPS['palm']

    def f(x, y):
        row, ly = y // course, y % course
        xx = x + row * 2
        tooth = xx % 4
        tip = course - 4 + (0, 1, 2, 1)[tooth] + int(h2(xx // 4, row, 161) * 1.5)
        if ly > tip:
            return r[6] if ly >= course - 1 else r[5]
        if ly == tip:
            return r[2] if tooth < 2 else r[4]
        k = h2(xx // 2, row, 162)
        col = r[3] if k < 0.6 else r[4] if k < 0.85 else r[2]
        if xx % 2 == 1:
            col = r[min(7, r.index(col) + 1)]
        if ly <= 1:
            col = r[5]
        return col
    fill(c, x0, y0, w, h, f)


# ------------------------------------------------------------------ catalogue

WALLS = [
    ('ashlar', lambda c, x, y, w, h: ashlar(c, x, y, w, h)),
    ('rustication', lambda c, x, y, w, h: rustication(c, x, y, w, h)),
    ('brick, stretcher', lambda c, x, y, w, h: brick(c, x, y, w, h)),
    ('brick, Flemish', lambda c, x, y, w, h: brick(c, x, y, w, h, bond='flemish')),
    ('rubble', lambda c, x, y, w, h: rubble(c, x, y, w, h)),
    ('lime render', lambda c, x, y, w, h: render(c, x, y, w, h)),
    ('ochre render', lambda c, x, y, w, h: render(c, x, y, w, h, RAMPS['plaster-ochre'])),
    ('whitewash', lambda c, x, y, w, h: whitewash(c, x, y, w, h)),
    ('adobe', lambda c, x, y, w, h: adobe(c, x, y, w, h)),
    ('half-timber', lambda c, x, y, w, h: half_timber(c, x, y, w, h)),
    ('weatherboard', lambda c, x, y, w, h: clapboard(c, x, y, w, h)),
    ('board & batten', lambda c, x, y, w, h: boards(c, x, y, w, h)),
    ('logs', lambda c, x, y, w, h: logs(c, x, y, w, h)),
    ('sandstone', lambda c, x, y, w, h: ashlar(c, x, y, w, h, RAMPS['sandstone'], 8, 16)),
]
ROOFS = [
    ('slate', slate), ('zinc', zinc), ('shingles', shingles),
    ('pantiles', pantiles), ('plain tiles', plain_tiles), ('thatch', thatch),
    ('kawara', kawara), ('palm thatch', palm),
]


def make(out, zoom=3):
    from art.reference import current_adult
    adult = current_adult()
    sw, shh, gap, lab = 76, 52, 10, 12
    cols = 6
    items = [(n, f) for n, f in WALLS] + [(n, f) for n, f in ROOFS]
    rows = (len(items) + cols - 1) // cols
    W = cols * (sw + gap) + gap + adult.width + gap
    Hh = 18 + rows * (shh + lab + gap) + gap
    c = C(W, Hh)
    c.rect(0, 0, W, Hh, (28, 24, 34, 255))
    labels = []
    for k, (name, fn) in enumerate(items):
        x = gap + (k % cols) * (sw + gap)
        y = 18 + (k // cols) * (shh + lab + gap)
        fn(c, x, y, sw, shh)
        labels.append((x, y + shh + 2, name))
    im = c.im
    im.alpha_composite(adult, (W - adult.width - gap, 18 + shh - adult.height))
    im = im.resize((im.width * zoom, im.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(im)
    font = ImageFont.load_default(size=11 * zoom // 2 + 4)
    d.text((gap * zoom, 4 * zoom), 'FRONT MATERIALS  ·  one value ladder, light upper left  ·  adult for scale',
           font=font, fill=(240, 220, 170))
    for x, y, name in labels:
        d.text((x * zoom, y * zoom), name, font=font, fill=(205, 196, 220))
    # the ramps themselves, so the shared ladder is visible
    strip_y = im.height
    names = list(RAMPS)
    strip = Image.new('RGBA', (im.width, (len(names) // 4 + 1) * 22 * zoom // 2 + 20), (28, 24, 34, 255))
    sd = ImageDraw.Draw(strip)
    for i, n in enumerate(names):
        x = (i % 4) * (im.width // 4) + 20
        y = (i // 4) * 11 * zoom + 10
        sd.text((x, y), n, font=font, fill=(205, 196, 220))
        for j, col in enumerate(RAMPS[n]):
            sd.rectangle((x + 130 + j * 22, y, x + 150 + j * 22, y + 18), fill=col[:3])
    sheet = Image.new('RGBA', (im.width, strip_y + strip.height), (28, 24, 34, 255))
    sheet.alpha_composite(im, (0, 0))
    sheet.alpha_composite(strip, (0, strip_y))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    sheet.convert('RGB').save(out)
    print(f'wrote {out}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/front-materials.png')
