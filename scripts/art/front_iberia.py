"""Houses of colonial Iberian America, 1550 to 1820, drawn front-on.

    .venv/bin/python scripts/art/front_iberia.py artifacts/iberia-ab.png

New Spain: one storey round a patio under a flat brick-tiled azotea that sheds
through clay canales; lime wash in ochre or almagre over a painted dado;
windows to the floor behind projecting rejas on a stone repison, shuttered and
unglazed; a zaguan door of studded cedar in a cantera frame. Oaxaca cuts that
frame in green cantera; Mexico City faces walls in dark red tezontle with grey
chiluca, a parapet that swells over the door and a saint in a niche; Puebla
sets brick with talavera tiles under white argamasa.
The Andes and the Caribbean roof in barrel tile on wide eaves over rafter
tails, with a timber corredor on the upper floor; Cusco stands on Inca
masonry; Lima, where it never rains, has flat mud roofs and closed box
balconies of cedar lattice. Brazil's sobrado is whitewash with joinery in one
strong colour, sash lights, stone cunhais and a flared tile eave.

The same parts draw the houses these grew from and the ones they became
overseas. MEDITERRANEO: Andalusia, Castile, a Portuguese tile front, Tuscany,
the Aegean. ASIA: the Philippine bahay na bato, a timber upper floor of
sliding capiz-shell windows jettied over stone, under tile or nipa; and Goa's
house with its balcao porch and oyster-shell panes.
"""
from pathlib import Path
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art import front_materials as fm  # noqa: E402
from art.front_materials import C, RAMPS, ramp, h2, blob  # noqa: E402
from art import front_openings as op  # noqa: E402
from art.front_kit import outline, consolidate  # noqa: E402
from art.front_weather import weather  # noqa: E402

OCHRE = ramp(76, 0.105)
YELLOW = ramp(86, 0.12, lift=0.02)
ALMAGRE = ramp(30, 0.125, lift=-0.06)
ROSE = ramp(22, 0.07, lift=0.02)
ANIL = ramp(246, 0.07, lift=0.01)
CAL = ramp(92, 0.014, lift=0.04)
ADOBE = ramp(60, 0.065, lift=-0.02)
VERDE = ramp(140, 0.04, lift=-0.03)        # cantera verde, Oaxaca
CHILUCA = ramp(86, 0.018, lift=-0.01)      # grey trim stone, Mexico City
TEZONTLE = ramp(16, 0.085, lift=-0.17)     # dark red volcanic facing
CORAL = ramp(84, 0.04, lift=0.03)          # coral limestone, Cartagena
CANTARIA = ramp(250, 0.012, lift=-0.02)    # Brazilian granite and soapstone
LADRILLO = ramp(38, 0.105, lift=-0.03)
DECK = ramp(50, 0.05, lift=0.04)           # brick tiles under lime, sun-bleached
TORTA = ramp(66, 0.045, lift=0.0)          # Lima's mud roof
CEDRO = ramp(40, 0.08, lift=-0.15)
PINE = ramp(62, 0.075, lift=-0.04)
P_GREEN = ramp(152, 0.085, lift=-0.14)
P_BLUE = ramp(244, 0.08, lift=-0.11)
P_RED = ramp(24, 0.11, lift=-0.16)
BRONZE = ramp(78, 0.09, lift=-0.1)
IRON = op.IRON
CLAYS = [ramp(42, 0.12), ramp(50, 0.125, lift=0.02), ramp(30, 0.11, lift=-0.07), ramp(40, 0.075, lift=0.04)]
ALBERO = ramp(72, 0.115, lift=-0.02)      # Seville's yellow earth
ARENISCA = ramp(72, 0.075, lift=0.01)      # golden sandstone, Salamanca and Extremadura
SIENA = ramp(64, 0.095, lift=-0.01)
SERENA = ramp(250, 0.014, lift=-0.05)      # pietra serena
EGEO = ramp(246, 0.09, lift=-0.07)
TUFF = ramp(78, 0.03, lift=-0.05)          # Manila's adobe stone, a grey volcanic tuff
MOLAVE = ramp(46, 0.07, lift=-0.1)
LATERITE = ramp(24, 0.1, lift=-0.11)
CAPIZ = ramp(92, 0.024, lift=0.05)
NIPA = ramp(64, 0.055, lift=-0.06)
ROOM, ROOM2 = (40, 29, 38, 255), (58, 43, 48, 255)


def lum(q):
    return 0.2126 * q[0] + 0.7152 * q[1] + 0.0722 * q[2]


def glow(lit, x, y, w, h, level):
    """Mark a region as lamplit after dark. 1: panes that glow where they are
    pale. 2: an open room that glows where it is dark."""
    if lit is not None:
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                lit[(xx, yy)] = level


def darker(c, x, y, ramps, d=1):
    """Step a pixel along its own ramp: how a stain or a soft shadow darkens."""
    q = c.g(x, y)
    for r in ramps:
        if q in r:
            c.p(x, y, r[max(0, min(7, r.index(q) + d))])
            return


# ------------------------------------------------------------------ walls

def encalado(c, x, y, w, h, r, q=2, seed=0, wear=0.5):
    """Coloured lime wash: one flat face, flaked to the mud brick low down
    where damp lifts it, each flake's upper rim the lit edge of the wash."""
    c.rect(x, y, w, h, r[q])
    for k in range(int(w * h / 3600 * wear * 2)):
        fx = x + 8 + int(h2(k, seed, 15) * (w - 24))
        fy = y + h - 22 - int(h2(k, seed, 16) * h * 0.3)
        n = 5 + int(h2(k, seed, 17) * 5)
        rows = ((1, n - 3), (0, n), (0, n - 1), (2, n - 4))
        for j, (off, ln) in enumerate(rows):
            off += int(h2(k, j, seed + 18) * 2)
            for i in range(max(1, ln)):
                c.p(fx + off + i, fy + j, ADOBE[4] if j == 0 or i == 0 else ADOBE[3])
            if j == 0:
                for i in range(max(1, ln)):
                    c.p(fx + off + i, fy - 1, r[max(0, q - 1)])


def tezontle(c, x, y, w, h, seed=0):
    """Tezontle facing: small blocks of dark red lava, no two quite alike,
    their joints barely darker than the stone."""
    r = TEZONTLE
    rows, at = [], 0
    while at < h:
        ch = 5 + int(h2(len(rows), 2, seed) * 3)
        rows.append((at, ch))
        at += ch
    for j, (r0, ch) in enumerate(rows):
        bx = -int(h2(j, 1, seed) * 10)
        b = 0
        while bx < w:
            bw = 9 + int(h2(b, j, seed + 2) * 8)
            k = h2(b, j, seed + 3)
            q = 2 if k < 0.14 else 4 if k > 0.78 else 3
            for yy in range(r0, min(h, r0 + ch)):
                for xx in range(max(0, bx), min(w, bx + bw)):
                    if yy == r0 + ch - 1 or xx == bx + bw - 1:
                        col = r[5]
                    elif yy == r0 and k < 0.5:
                        col = r[q - 1]
                    elif h2(xx, yy, seed + 5) < 0.015:
                        col = r[q + 2]
                    else:
                        col = r[q]
                    c.p(x + xx, y + yy, col)
            bx += bw
            b += 1


def talavera(c, x, y, w, h):
    """Puebla's facing: brick tiles laid on the diagonal, a glazed blue and
    white tile set at every other crossing."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a, b = xx + yy, xx - yy
            u, v, lx, ly = a // 8, b // 8, a % 8, b % 8
            tile = u % 2 == 0 and v % 2 == 0
            if lx == 0 or ly == 0:
                col = LADRILLO[5]
            elif tile:
                col = P_BLUE[3] if lx in (3, 4, 5) and ly in (3, 4, 5) else CAL[1]
            else:
                col = LADRILLO[2] if lx == 1 or ly == 7 else LADRILLO[4] if h2(u, v, 9) > 0.8 else LADRILLO[3]
            c.p(xx, yy, col)


def inca(c, x, y, w, h):
    from art.front_andes import inca as fitted
    fitted(c, x, y, w, h)


def adobe_wall(c, x, y, w, h, seed=0):
    """Mud plaster over adobe, the bricks showing where it has fallen."""
    fm.adobe(c, x, y, w, h, ADOBE)


def dado(c, x, y, w, h, r, seed=0, wear=0.5):
    """The painted guardapolvo along the foot of the wall, scuffed and
    splashed darker where the street meets it."""
    c.rect(x, y, w, h, r[3])
    c.rect(x, y, w, 1, r[4])
    for xx in range(x, x + w):
        rise = 2 + round(1.4 * math.sin(xx * 0.21 + seed) + 1.1 * math.sin(xx * 0.057))
        for k in range(max(1, rise)):
            c.p(xx, y + h - 1 - k, r[4])
    for k in range(int(w / 26 * wear)):
        cx = x + 6 + h2(k, seed, 21) * (w - 12)
        blob(c, cx, y + 4 + h2(k, seed, 22) * (h - 8), 2 + h2(k, seed, 23) * 2.5, 1.5, CAL[3], seed + k)


def cornisa(c, x, y, w, r):
    """A moulded cornice, its top face seen: rows y to y+6."""
    c.rect(x, y, w, 1, r[0])
    c.rect(x, y + 1, w, 2, r[1])
    c.rect(x, y + 3, w, 2, r[2])
    c.rect(x + 1, y + 5, w - 2, 1, r[3])
    c.rect(x + 2, y + 6, w - 4, 1, r[5])


# ------------------------------------------------------------------ joinery and iron

def leaf(c, x, y, w, h, p, panels=None):
    """One shutter or door leaf: stiles round sunk panels."""
    c.rect(x, y, w, h, p[3])
    c.rect(x, y, 1, h, p[2])
    c.rect(x + w - 1, y, 1, h, p[5])
    n = panels or (2 if h < 30 else 3)
    ph = (h - 2 - (n - 1) * 2) // n
    if w < 6:
        return
    for i in range(n):
        py = y + 1 + i * (ph + 2)
        c.rect(x + 2, py, w - 4, ph, p[4])
        c.rect(x + 2, py, w - 4, 1, p[6])
        c.rect(x + 2, py, 1, ph, p[5])
        c.rect(x + 2, py + ph - 1, w - 4, 1, p[2])


def hueco(c, x, y, w, h, p, ajar=True, lit=None):
    """An unglazed opening: one shutter leaf shut, the other swung into the
    dark room, a little daylight on the floor inside."""
    c.rect(x, y, w, h, ROOM)
    m = x + w // 2
    leaf(c, x, y, m - x, h, p)
    if ajar:
        c.rect(x + w - 2, y, 2, h, p[5])
        c.rect(x + w - 2, y, 1, h, p[4])
        c.rect(m + 1, y + h - 4, w - (m - x) - 3, 4, ROOM2)
        if h2(x, y, 7) < 0.7:
            glow(lit, m, y + 2, x + w - 2 - m, h - 2, 2)
    else:
        leaf(c, m, y, x + w - m, h, p)
    op.reveal(c, x, y, w, h, 2)


def bars(c, L, R, y0, y1, pitch=3):
    for xx in range(L, R, pitch):
        for yy in range(y0, y1):
            c.p(xx, yy, IRON[1] if lum(c.g(xx, yy)) < 95 else IRON[3])


def reja(c, x, y, w, h, kind='iron'):
    """The cage that stands off a window: iron bars with spear heads, or the
    turned wooden balusters the first two centuries used."""
    L, R = x - 2, x + w + 2
    if kind == 'iron':
        bars(c, L, R + 1, y - 1, y + h)
        for by in (y + 3, y + h // 2, y + h - 4):
            c.rect(L, by, R - L + 1, 1, IRON[2])
            c.rect(L, by + 1, R - L + 1, 1, IRON[4])
        for xx in range(L, R + 1, 3):
            c.p(xx, y - 2, IRON[3])
            if (xx - L) % 6 == 0:
                c.p(xx, y - 3, IRON[2])
    else:
        w_ = PINE
        for xx in range(L + 1, R - 1, 4):
            for yy in range(y, y + h):
                ring = (yy - y) % 9 in (3, 4)
                c.p(xx, yy, w_[1] if ring else w_[2])
                c.p(xx + 1, yy, w_[3] if ring else w_[5])
        for by in (y - 1, y + h - 3):
            c.rect(L, by, R - L + 1, 1, w_[1])
            c.rect(L, by + 1, R - L + 1, 1, w_[2])
            c.rect(L, by + 2, R - L + 1, 1, w_[5])
    op.cast_right(c, R + 1, y, h, 2)


def guardapolvo(c, x, y, w, r):
    """A little cornice over an opening; y is the row it sits on."""
    X, W = x - 6, w + 12
    c.rect(X, y - 5, W, 1, r[0])
    c.rect(X, y - 4, W, 1, r[1])
    c.rect(X, y - 3, W, 2, r[2])
    c.rect(X + 1, y - 1, W - 2, 1, r[4])
    op.cast(c, X + 2, y, W - 2, 2, 0.72)


def repison(c, x, y, w, r):
    """The projecting sill a reja stands on, carried on a moulded corbel."""
    X, W = x - 7, w + 14
    op.cast(c, X + 3, y + 6, W - 2, 5, 0.66)
    c.rect(X, y, W, 1, r[0])
    c.rect(X, y + 1, W, 2, r[1])
    c.rect(X, y + 3, W, 2, r[2])
    c.rect(X, y + 5, W, 1, r[4])
    c.rect(X + 3, y + 6, W - 6, 2, r[3])
    c.rect(X + 3, y + 6, 1, 2, r[2])
    c.rect(X + 7, y + 8, W - 14, 2, r[4])


def ventana(c, cx, sill, w, h, trim, paint, kind, flat=False, seed=0, hood=True, lit=None):
    """A ground-floor window to the street: frame, shutters, hood, sill, cage."""
    x, y = cx - w // 2, sill - h
    if flat:
        c.rect(x - 3, y - 3, w + 6, h + 3, trim[1])
        c.rect(x - 3, y - 3, w + 6, 1, trim[0])
        c.rect(x + w + 2, y - 2, 1, h + 2, trim[2])
    else:
        op.raised(c, x - 3, y - 3, w + 6, h + 3, trim, 2)
        op.cast_right(c, x + w + 3, y - 2, h + 1, 1)
    hueco(c, x, y, w, h, paint, seed % 3 != 0, lit)
    if hood and not flat:
        guardapolvo(c, x, y - 3, w, trim)
    repison(c, x, sill, w, trim)
    if kind in ('reja-iron', 'reja-wood'):
        reja(c, x, y, w, h, kind[5:])


def glazed(c, x, y, w, h, paint, arch=True):
    """Brazilian sash in a painted frame under a shallow arched head."""
    p = paint
    op.raised(c, x - 2, y - 2, w + 4, h + 4, p, 3)
    if arch:
        for i in range(w + 4):
            lift = round(2.4 * math.sin(math.pi * i / (w + 3)))
            for k in range(1, lift + 1):
                c.p(x - 2 + i, y - 2 - k, p[2] if k == lift else p[3])
    op.sash(c, x, y, w, h, 'white')
    op.reveal(c, x, y, w, h, 1)
    c.rect(x - 4, y + h + 2, w + 8, 1, p[2])
    c.rect(x - 4, y + h + 3, w + 8, 1, p[5])
    op.cast(c, x - 3, y + h + 4, w + 6, 2, 0.76)


# ------------------------------------------------------------------ doors

def porton(c, x, y, w, h, wood, inside=None, postigo=True):
    """The zaguan door: two leaves of cedar boards under three battens set
    with bronze chapetones, a knocker on each, a wicket cut in one."""
    lay = C(c.w, c.h)
    m = x + w // 2
    lay.rect(x, y, w, h, wood[3])
    for xx in range(x + 3, x + w, 5):
        lay.rect(xx, y, 1, h, wood[4])
    for xx in range(x, x + w):
        for yy in range(y, y + h):
            if h2(xx, yy // 6, 71) < 0.05 and lay.g(xx, yy) == wood[3]:
                lay.p(xx, yy, wood[2])
    lay.rect(m - 1, y, 1, h, wood[5])
    lay.rect(m, y, 1, h, wood[2])
    for fy in (y + 6, y + h // 2 - 1, y + h - 9):
        lay.rect(x, fy, w, 3, wood[2])
        lay.rect(x, fy, w, 1, wood[1])
        lay.rect(x, fy + 3, w, 1, wood[5])
        for xx in range(x + 2, x + w - 2, 4):
            if abs(xx - m) > 1:
                lay.p(xx, fy + 1, BRONZE[0])
                lay.p(xx + 1, fy + 1, BRONZE[3])
                lay.p(xx + 1, fy + 2, BRONZE[5])
    for kx in (m - 6, m + 3):
        ky = y + h // 2 + 6
        for dx, dy, q in ((0, 0, 1), (1, 0, 1), (2, 0, 2), (0, 1, 2), (2, 1, 4), (0, 2, 3), (1, 2, 4), (2, 2, 5)):
            lay.p(kx + dx, ky + dy, BRONZE[q])
    if postigo and w >= 24:
        px0, pw, ph = m + 2, w // 2 - 4, 26
        lay.rect(px0, y + h - ph, 1, ph, wood[6])
        lay.rect(px0, y + h - ph, pw, 1, wood[6])
        lay.rect(px0 + pw - 1, y + h - ph, 1, ph, wood[2])
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if inside is None or inside(xx, yy):
                c.p(xx, yy, lay.g(xx, yy))


def step_stone(c, x, base, w, r):
    c.rect(x, base, w, 1, r[0])
    c.rect(x, base + 1, w, 2, r[1])
    c.rect(x, base + 3, w, 2, r[3])
    c.rect(x, base + 5, w, 1, r[5])


def portada(c, cx, base, r, kind='cantera', dw=28, dh=50, wood=CEDRO):
    """The street doorway. cantera: pilasters and an entablature of cut
    stone. arco: a round arch of voussoirs under a cornice. liso: a plain
    band of paint with a wooden lintel. Returns its top row."""
    x, y = cx - dw // 2, base - dh
    if kind == 'liso':
        c.rect(x - 4, y - 4, dw + 8, dh + 4, r[1])
        c.rect(x - 4, y - 4, dw + 8, 1, r[0])
        c.rect(x + dw + 3, y - 3, 1, dh + 3, r[2])
        porton(c, x, y, dw, dh, wood, postigo=False)
        op.reveal(c, x, y, dw, dh, 3)
        for k, q in enumerate((1, 2, 3, 5)):
            c.rect(x - 7, y - 8 + k, dw + 14, 1, PINE[q])
        op.cast(c, x - 5, y - 4, dw + 10, 2, 0.72)
        return y - 8
    pw, ent = 6, 11
    L, R = x - pw, x + dw + pw
    ey = y - ent
    op.cast_right(c, R + 1, ey + 2, dh + ent - 2, 3)
    c.rect(L, ey, R - L, dh + ent, r[2])
    inside = None
    if kind == 'arco':
        rad = dw / 2
        spring = y + 6 + rad

        def inside(xx, yy):
            return yy >= spring or math.hypot(xx + 0.5 - cx, yy + 0.5 - spring) <= rad
        for yy in range(y, int(spring) + 1):
            for xx in range(L, R):
                d = math.hypot(xx + 0.5 - cx, yy + 0.5 - spring)
                if rad < d <= rad + 5:
                    t = math.atan2(spring - yy - 0.5, xx + 0.5 - cx) / math.pi * 9
                    joint = abs(t - round(t)) < 0.06 and 0 < round(t) < 9
                    c.p(xx, yy, r[3] if joint else r[0] if d > rad + 4 else r[2] if d < rad + 1 else r[1])
                elif rad + 5 < d <= rad + 6:
                    c.p(xx, yy, r[3])
        for k in range(-2, 2):
            for j in range(7):
                c.p(cx + k, y - 1 + j, r[0] if k < 1 else r[3])
    for px0 in (L, x + dw):
        c.rect(px0, y - 2, pw, dh + 2, r[2])
        c.rect(px0, y - 2, 1, dh + 2, r[1])
        c.rect(px0 + pw - 1, y - 2, 1, dh + 2, r[4])
        c.rect(px0 + 2, y + 5, 1, dh - 14, r[4])
        c.rect(px0 + 3, y + 5, 1, dh - 14, r[1])
        c.rect(px0 - 1, base - 7, pw + 2, 7, r[2])
        c.rect(px0 - 1, base - 7, pw + 2, 1, r[0])
        c.rect(px0 - 1, base - 6, pw + 2, 1, r[1])
        c.rect(px0 + pw, base - 5, 1, 5, r[4])
        c.rect(px0 - 1, y - 3, pw + 2, 3, r[1])
        c.rect(px0 - 1, y - 3, pw + 2, 1, r[0])
        c.rect(px0 - 1, y - 1, pw + 2, 1, r[4])
    c.rect(L - 1, ey + 4, R - L + 2, ent - 7, r[2])
    for xx in range(L + 3, R - 3, 7):
        c.rect(xx, ey + 5, 2, 2, r[1])
        c.p(xx + 1, ey + 6, r[4])
        c.p(xx + 2, ey + 6, r[4])
    c.rect(L - 4, ey - 1, R - L + 8, 1, r[0])
    c.rect(L - 4, ey, R - L + 8, 2, r[1])
    c.rect(L - 3, ey + 2, R - L + 6, 1, r[2])
    c.rect(L - 2, ey + 3, R - L + 4, 1, r[4])
    c.rect(L - 1, ey + 4, R - L + 2, 1, r[3])
    porton(c, x, y, dw, dh, wood, inside)
    for yy in range(y, y + dh):
        for xx in range(x, x + dw):
            if inside and not inside(xx, yy):
                continue
            top = yy - y < 3 if not inside else not inside(xx, yy - 3)
            if top or xx - x < 3:
                darker(c, xx, yy, [wood, BRONZE], 2 if top and xx - x < 3 else 1)
    return ey - 1


NICHO = ("...lllll...", "..lsssssS..", ".lsdddddsS.", ".lsdhhhdsS.", ".lsdhfhdsS.", ".lsdbfbdsS.", ".lsbbBbbsS.",
         ".lsbBBbbsS.", ".lsbBbbbsS.", ".lsbBbbbsS.", ".lsdbbbdsS.", "llLLLLLLLSS", ".SSSSSSSSS.")


def nicho(c, x, y, r):
    """A saint in a niche over the door: blue mantle, gold halo."""
    pal = {'s': r[1], 'S': r[4], 'd': (52, 38, 58, 255), 'h': BRONZE[0], 'f': ramp(55, 0.07)[2],
           'b': P_BLUE[3], 'B': P_BLUE[1], 'l': r[0], 'L': r[2]}
    for j, row in enumerate(NICHO):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x + i, y + j, pal[ch])


def remate(c, x, y, r):
    """A stone finial on a parapet pier; y is the row it stands on."""
    rows = ("..lmd..", ".lmmmd.", ".lmmmd.", "..lmd..", "...m...", "..lmd..", ".lmmmd.", "lmmmmmd", ".lmmmd.",
            ".lmmmd.", "lllmmdd")
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x + i, y - len(rows) + j, {'l': r[0], 'm': r[2], 'd': r[4]}[ch])


def cenefa(c, x, y, w, r):
    """A painted border under the cornice: two lines and a run of dots."""
    c.rect(x, y, w, 1, r[3])
    for xx in range(x + 2, x + w - 2, 4):
        c.rect(xx, y + 2, 2, 1, r[3])
    c.rect(x, y + 4, w, 1, r[3])


def canal(c, x, y, wall, below, seed=0, wear=0.5):
    """A clay spout through the foot of the parapet, hanging out over the
    cornice, and what years of rain have left on the wall under it. y is
    the row it leaves the parapet; `below` the first wall row under the
    cornice."""
    r = CLAYS[0]
    for k in range(int(8 + 20 * wear * (0.5 + h2(x, seed, 31)))):
        yy = below + 6 + k
        if h2(x, yy, seed + 32) < 0.85 - k * 0.02:
            darker(c, x + 1 + (1 if h2(x, yy // 5, seed + 33) < 0.4 else 0), yy, wall)
        if k < 7 and h2(x, yy, seed + 34) < 0.7:
            darker(c, x + 2, yy, wall)
    n = below - y + 1
    for k in range(2, n + 2):
        q = c.g(x + 4, y + k)
        c.p(x + 4, y + k, (int(q[0] * 0.74), int(q[1] * 0.72), int(q[2] * 0.8), 255))
    c.rect(x, y, 4, 2, ROOM)
    for k in range(1, n):
        for i, q in enumerate((2, 6, 5, 3)):
            c.p(x + i, y + k, r[q])
    for i, q in enumerate((0, 1, 2, 4)):
        c.p(x + i, y + n, r[q])


# ------------------------------------------------------------------ balconies

def slab(c, X, fy, W, r, corbels=True):
    """A balcony floor on corbels: top face rows fy-3..fy-1, edge below."""
    op.cast(c, X + 3, fy + 3, W - 1, 5, 0.7)
    if corbels:
        for bx in (X + 2, X + W - 6):
            c.rect(bx, fy + 3, 4, 3, r[3])
            c.rect(bx, fy + 3, 1, 3, r[2])
            c.rect(bx + 1, fy + 6, 3, 2, r[4])
            c.rect(bx + 2, fy + 8, 2, 1, r[5])
    c.rect(X, fy - 3, W, 1, r[0])
    c.rect(X, fy - 2, W, 2, r[1])
    c.rect(X, fy, W, 2, r[2])
    c.rect(X, fy + 2, W, 1, r[4])


def iron_rail(c, X, fy, W, hgt=14):
    top = fy - 1 - hgt
    bars(c, X + 1, X + W - 1, top + 1, fy - 1)
    c.rect(X, top, W, 1, IRON[2])
    c.rect(X, top + 1, W, 1, IRON[4])
    c.rect(X, fy - 4, W, 1, IRON[3])
    for px0 in (X, X + W - 2):
        c.rect(px0, top - 1, 2, hgt + 1, IRON[3])
        c.rect(px0, top - 1, 1, hgt + 1, IRON[2])
        c.p(px0, top - 2, IRON[1])
        c.p(px0 + 1, top - 2, IRON[3])


def wood_rail(c, X, fy, W, w_, hgt=15):
    """Turned balusters under a handrail."""
    top = fy - 1 - hgt
    for xx in range(X + 2, X + W - 2, 4):
        for yy in range(top + 2, fy - 2):
            k = yy - top
            fat = k in (5, 6, 7, 10, 11)
            c.p(xx, yy, w_[1] if fat else w_[2])
            c.p(xx + 1, yy, w_[3] if fat else w_[5])
    c.rect(X, top, W, 1, w_[0])
    c.rect(X, top + 1, W, 1, w_[2])
    c.rect(X, top + 2, W, 1, w_[5])
    c.rect(X, fy - 3, W, 1, w_[2])
    c.rect(X, fy - 2, W, 1, w_[4])


def balcon(c, cx, fy, w, h, trim, paint, rail='iron', flat=False, seed=0, wood=CEDRO, lit=None):
    """An upper door-window opening on its own balcony."""
    x, y = cx - w // 2, fy - h
    if flat:
        c.rect(x - 3, y - 3, w + 6, h + 3, trim[1])
        c.rect(x - 3, y - 3, w + 6, 1, trim[0])
        c.rect(x + w + 2, y - 2, 1, h + 2, trim[2])
    else:
        op.raised(c, x - 3, y - 3, w + 6, h + 3, trim, 2)
        op.cast_right(c, x + w + 3, y - 2, h + 1, 1)
    hueco(c, x, y, w, h, paint, seed % 2 == 0, lit)
    if rail is None:
        return
    guardapolvo(c, x, y - 3, w, trim)
    X, W = x - 8, w + 16
    if rail == 'iron':
        slab(c, X, fy, W, trim)
        iron_rail(c, X, fy, W)
    else:
        slab(c, X, fy, W, wood, corbels=False)
        for bx in range(X + 2, X + W - 3, 7):
            c.rect(bx, fy + 3, 3, 3, wood[4])
            c.rect(bx, fy + 3, 3, 1, wood[3])
        wood_rail(c, X, fy, W, wood)


def corredor(c, x0, x1, fy, eave, w_, rail=None, post=38):
    """A timber gallery along the upper floor under the roof's own eave:
    joist ends, a boarded floor, turned balusters, posts on carved zapatas."""
    rail = rail or w_
    op.cast(c, x0 + 3, fy + 3, x1 - x0 - 1, 7, 0.6)
    for bx in range(x0 + 2, x1 - 4, 9):
        c.rect(bx, fy + 3, 4, 4, w_[4])
        c.rect(bx, fy + 3, 4, 1, w_[3])
        c.rect(bx + 3, fy + 4, 1, 3, w_[6])
    c.rect(x0, fy - 3, x1 - x0, 1, w_[0])
    c.rect(x0, fy - 2, x1 - x0, 2, w_[1])
    for xx in range(x0 + 5, x1, 6):
        c.rect(xx, fy - 2, 1, 2, w_[3])
    c.rect(x0, fy, x1 - x0, 2, w_[3])
    c.rect(x0, fy + 2, x1 - x0, 1, w_[6])
    wood_rail(c, x0, fy, x1 - x0, rail)
    n = max(2, round((x1 - x0) / post))
    for k in range(n + 1):
        px0 = round(x0 + (x1 - x0 - 3) * k / n)
        c.rect(px0, eave + 3, 3, fy - eave - 4, w_[3])
        c.rect(px0, eave + 3, 1, fy - eave - 4, w_[1])
        c.rect(px0 + 2, eave + 3, 1, fy - eave - 4, w_[5])
        for j, half in enumerate((5, 4, 2)):
            c.rect(px0 + 1 - half, eave + 3 + j * 2, 2 * half + 1, 2, w_[3])
            c.rect(px0 + 1 - half, eave + 3 + j * 2, 2 * half + 1, 1, w_[2])
            c.p(px0 + 1 + half, eave + 4 + j * 2, w_[5])


def cajon(c, cx, fy, w_, w=42, h=40, lit=None):
    """Lima's box balcony: a closed cedar cabinet hung on the wall, panelled
    below, latticed above so those inside see out unseen, its own flat lid."""
    x, top = cx - w // 2, fy + 2 - h
    op.cast(c, x + 4, fy + 2, w - 1, 7, 0.6)
    op.cast_right(c, x + w, top + 2, h, 3)
    for bx in range(x + 3, x + w - 5, 9):
        c.rect(bx, fy + 2, 4, 5, w_[4])
        c.rect(bx, fy + 2, 4, 1, w_[3])
        c.rect(bx + 1, fy + 5, 3, 2, w_[5])
    c.rect(x, top, w, h, w_[3])
    c.rect(x - 2, top - 4, w + 4, 1, w_[0])
    c.rect(x - 2, top - 3, w + 4, 3, w_[1])
    c.rect(x - 2, top, w + 4, 2, w_[2])
    c.rect(x - 1, top + 2, w + 2, 1, w_[5])
    c.rect(x, top + 3, 1, h - 3, w_[2])
    c.rect(x + w - 1, top + 3, 1, h - 3, w_[5])
    ly, lh = top + 6, 15
    n = max(2, w // 12)
    pw = (w - 4) / n
    for k in range(n):
        px0 = round(x + 2 + k * pw) + 1
        px1 = round(x + 2 + (k + 1) * pw) - 1
        for yy in range(ly, ly + lh):
            for xx in range(px0, px1):
                on = (xx + yy) % 4 == 0 or (xx - yy) % 4 == 0
                c.p(xx, yy, w_[2] if on else ROOM)
        c.rect(px0, ly, px1 - px0, 1, w_[5])
        glow(lit, px0, ly + 1, px1 - px0, lh - 1, 2)
        py = ly + lh + 3
        ph = fy - 1 - py
        c.rect(px0, py, px1 - px0, ph, w_[4])
        c.rect(px0, py, px1 - px0, 1, w_[6])
        c.rect(px0, py, 1, ph, w_[5])
        c.rect(px0, py + ph - 1, px1 - px0, 1, w_[2])
        c.rect(px0 + 2, py + 2, px1 - px0 - 4, ph - 4, w_[3])
        c.rect(px0 + 2, py + 2, px1 - px0 - 4, 1, w_[2])
    c.rect(x, ly + lh, w, 1, w_[1])
    c.rect(x, ly + lh + 1, w, 1, w_[5])
    c.rect(x, fy, w, 2, w_[2])
    c.rect(x, fy + 1, w, 1, w_[5])


# ------------------------------------------------------------------ roofs

def clay(ci, row, seed):
    k = h2(ci, row, seed + 401)
    return CLAYS[0] if k < 0.5 else CLAYS[1] if k < 0.72 else CLAYS[2] if k < 0.9 else CLAYS[3]


def tejado(c, L, R, top, eave, seed=0, hip=0.0):
    """Barrel tile seen from above: lit caps over shadowed channels in
    columns down the slope, every cap its own clay, each ending in a bright
    lip that shades the tile below; duller toward the ridge."""
    px = set()
    rise = eave - top
    cap, chan = (3, 1, 2, 3, 4), (6, 5)
    for y in range(top, eave):
        band = 1 if (y - top) / rise < 0.3 else 0
        inset = round((eave - y) * hip)
        for x in range(L + inset, R - inset):
            ci, lx = (x - L) // 7, (x - L) % 7
            d = eave - 1 - y + (1 if h2(ci, 0, seed + 400) < 0.3 else 0)
            row, ly = d // 10, d % 10
            if lx < 5:
                rr = clay(ci, row, seed)
                q = cap[lx] + band
                if ly == 0:
                    q -= 2 if 0 < lx < 4 else 1
                elif ly == 9:
                    q += 3
                elif ly == 8:
                    q += 1
            else:
                rr = CLAYS[2]
                q = chan[lx - 5] + band + (1 if ly == 9 else -1 if ly == 0 else 0)
            c.p(x, y, rr[max(0, min(7, q))])
            px.add((x, y))
    return px


def caballete(c, L, R, y, r=None):
    """Ridge tiles laid end to end and bedded in lime."""
    r = r or CLAYS[0]
    for x in range(L, R):
        seg = (x - L) % 11
        for k, q in enumerate((3, 1, 1, 2, 3, 5)):
            col = r[q]
            if seg == 0:
                col = CAL[1] if 0 < k < 4 else CAL[3]
            elif seg == 10:
                col = r[min(7, q + 1)]
            c.p(x, y - 3 + k, col)
    op.cast(c, L, y + 3, R - L, 2, 0.74)


def verges(c, L, R, top, eave, hip=0.0):
    """A line of cap tiles down each gable end, bedded in lime, or down each
    hip where the roof turns."""
    r = CLAYS[0]
    for y in range(top, eave):
        inset = round((eave - y) * hip)
        joint = (y - top) % 11 == 10
        for x0, qs, lime in ((L + inset, (2, 1, 2, 4), 4), (R - inset - 4, (3, 2, 3, 5), -1)):
            for k, q in enumerate(qs):
                c.p(x0 + k, y, CAL[2] if joint and k in (1, 2) else r[q])
            if not hip and h2(x0, y // 4, 77) < 0.35:
                c.p(x0 + lime, y, CAL[2])


def alero(c, L, R, eave, x0, x1, kind, wood=CEDRO, seed=0):
    """The eave: tile ends over the wall, and what carries them. canes:
    rafter tails. beira: Brazil's two corbelled rows of tile. tejaroz: brick
    on edge. All throw their shadow down the wall."""
    depth = {'canes': 8, 'beira': 6, 'tejaroz': 5, 'plain': 4}[kind]
    op.cast(c, x0, eave + 2, x1 - x0, depth + 4, 0.56)
    if kind == 'canes':
        for xx in range(L + 3, R - 4, 8):
            c.rect(xx, eave + 2, 4, 5, wood[5])
            c.rect(xx, eave + 2, 1, 5, wood[4])
            c.rect(xx, eave + 6, 4, 1, wood[6])
    elif kind == 'beira':
        c.rect(x0, eave + 6, x1 - x0, 1, CAL[0])
        c.rect(x0, eave + 7, x1 - x0, 2, CAL[2])
        c.rect(x0, eave + 9, x1 - x0, 1, CAL[4])
        for j in range(2):
            for xx in range(L + 2 + j * 3, R - 2 - j * 3):
                lx = (xx - L + j * 3) % 7
                c.p(xx, eave + 2 + j * 2, CLAYS[0][3 if lx < 5 else 6])
                c.p(xx, eave + 3 + j * 2, CLAYS[0][5 if lx in (1, 2, 3) else 7])
    elif kind == 'tejaroz':
        for j in range(2):
            for xx in range(L + 2 + j * 2, R - 2 - j * 2):
                lx = (xx - L + j * 2) % 4
                c.p(xx, eave + 2 + j * 2, LADRILLO[2 if lx < 3 else 6])
                c.p(xx, eave + 3 + j * 2, LADRILLO[4 if lx < 3 else 6])
    for x in range(L, R):
        ci, lx = (x - L) // 7, (x - L) % 7
        rr = clay(ci, 0, seed)
        if lx < 5:
            c.p(x, eave, rr[0 if 0 < lx < 4 else 2])
            if 0 < lx < 4:
                c.p(x, eave + 1, rr[7] if lx == 2 else rr[5])
        else:
            c.p(x, eave, CLAYS[2][6])
            c.p(x, eave + 1, CLAYS[2][4])


def azotea(c, x0, x1, yp, wall, q, top, deck=DECK, dd=16, ph=9, seed=0, wall_fn=None):
    """A flat roof behind its parapet, from above: the lit parapet top all
    round, the far parapet's inner face in shade, the brick-tiled deck sunk
    between and shadowed along its far and left sides. yp is the parapet
    face's bottom row + 1. Returns the top row."""
    fy = yp - ph
    if wall_fn:
        wall_fn(c, x0, fy, x1 - x0, ph)
    else:
        c.rect(x0, fy, x1 - x0, ph, wall[q])
    dy = fy - 3 - dd
    for yy in range(dy, fy - 3):
        for xx in range(x0 + 3, x1 - 3):
            lx, ly = (xx - x0 + ((yy - dy) // 4 % 2) * 4) % 8, (yy - dy) % 4
            k = 1 if yy - dy > dd * 0.55 else 2
            if yy - dy < 3 or xx - x0 - 3 < 3 - (yy - dy) // 6:
                k += 1
            col = deck[k + 1] if (ly == 3 or lx == 7) and h2(xx // 3, yy // 2, seed + 9) < 0.2 else deck[k]
            c.p(xx, yy, col)
    c.rect(x0, fy - 3, x1 - x0, 1, top[0])
    c.rect(x0, fy - 2, x1 - x0, 2, top[1])
    far = dy - 5
    c.rect(x0 + 3, far, x1 - x0 - 6, 5, wall[min(7, q + 2)])
    c.rect(x0 + 3, far + 4, x1 - x0 - 6, 1, wall[min(7, q + 3)])
    c.rect(x0, far - 2, x1 - x0, 1, top[0])
    c.rect(x0, far - 1, x1 - x0, 1, top[1])
    for yy in range(far, fy - 3):
        for k, qq in enumerate((0, 1, 1)):
            c.p(x0 + k, yy, top[qq])
            c.p(x1 - 1 - k, yy, top[(1, 1, 2)[k]])
    return far - 2


def chimenea(c, x, by, wall, q, top):
    """A squat kitchen flue on the roof, capped with two tiles."""
    op.cast_right(c, x + 10, by - 9, 9, 3)
    c.rect(x, by - 12, 10, 12, wall[q])
    c.rect(x, by - 12, 1, 12, wall[q - 1])
    c.rect(x + 9, by - 12, 1, 12, wall[q + 2])
    c.rect(x + 2, by - 8, 6, 3, ROOM)
    c.rect(x - 1, by - 15, 12, 1, top[0])
    c.rect(x - 1, by - 14, 12, 2, CLAYS[0][2])
    c.rect(x - 1, by - 12, 12, 1, CLAYS[0][5])


def teatina(c, x, by, wall, q, top):
    """Lima's roof scoop: a hooded skylight turned to the sea breeze."""
    op.cast_right(c, x + 18, by - 8, 8, 3)
    c.rect(x, by - 10, 18, 10, wall[q])
    c.rect(x, by - 10, 1, 10, wall[q - 1])
    c.rect(x + 17, by - 10, 1, 10, wall[q + 2])
    c.rect(x + 3, by - 7, 12, 5, ROOM)
    c.rect(x + 3, by - 7, 12, 1, (30, 22, 30, 255))
    for xx in (x + 6, x + 11):
        c.rect(xx, by - 7, 1, 5, PINE[3])
    for k in range(6):
        c.rect(x - 1 + k // 3, by - 16 + k, 20 - 2 * (k // 3), 1, top[0] if k == 0 else top[1] if k < 4 else top[2])
    c.rect(x - 1, by - 10, 20, 1, top[4])


def azulejo(c, x, y, w, h):
    """A Portuguese tile front: white tiles, a blue ring on each and a dot
    where four meet."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            lx, ly = xx % 8, yy % 8
            d = abs(lx - 4) + abs(ly - 4)
            if d == 2:
                col = EGEO[2]
            elif lx < 1 and ly < 1:
                col = EGEO[1]
            elif lx == 0 or ly == 0:
                col = CAL[1]
            else:
                col = CAL[0]
            c.p(xx, yy, col)


def persiana(c, cx, sill, w, h, trim, paint):
    """A glazed casement in a stone frame, louvred shutters folded back."""
    x, y = cx - w // 2, sill - h
    op.frame_stone(c, x, y, w, h, None, trim)
    op.casement(c, x, y, w, h, 'white')
    op.reveal(c, x, y, w, h, 2)
    op.open_shutters(c, x - 3, y - 4, w + 6, h + 8, paint, 6)


def shell(c, x, y, w, h, wood, seed=0):
    """Window-pane oyster shell in a wooden lattice: flat squares of pearl,
    no two the same white."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            lx, ly = (xx - x) % 4, (yy - y) % 4
            if lx == 3 or ly == 3:
                col = wood[3]
            else:
                k = h2((xx - x) // 4 + seed, (yy - y) // 4, 91)
                col = CAPIZ[0] if k < 0.3 else CAPIZ[2] if k > 0.82 else CAPIZ[1]
            c.p(xx, yy, col)
    c.rect(x, y, w, 1, wood[5])
    c.rect(x, y, 1, h, wood[2])
    c.rect(x + w - 1, y, 1, h, wood[5])


def capiz(c, cols, pitch, fy, wood, seed=0, lit=None):
    """The upper floor of a bahay na bato: sliding capiz panels the width of
    each bay on a broad sill, one slid aside, and under the sill the
    ventanillas, low vents behind balusters."""
    top, h = fy - 47, 27
    sill = top + h
    for k, cx in enumerate(cols):
        w = pitch - 12
        x, half = cx - w // 2, (pitch - 12) // 2
        c.rect(x - 2, top - 2, w + 4, h + 2, wood[4])
        c.rect(x - 2, top - 2, w + 4, 1, wood[2])
        c.rect(x, top, w, h, ROOM)
        shell(c, x, top, half, h, wood, k)
        glow(lit, x, top + 2, half, h - 2, 1)
        if (seed + k) % 3:
            shell(c, x + half, top, w - half, h, wood, k + 5)
            glow(lit, x + half, top + 2, w - half, h - 2, 1)
        else:
            glow(lit, x + half, top + 2, w - half - 3, h - 2, 2)
            c.rect(x + half, top + h - 5, w - half, 5, ROOM2)
            c.rect(x + w - 3, top, 3, h, wood[5])
        op.reveal(c, x, top, w, h, 2)
        c.rect(x - 4, sill, w + 8, 1, wood[0])
        c.rect(x - 4, sill + 1, w + 8, 2, wood[1])
        c.rect(x - 4, sill + 3, w + 8, 1, wood[5])
        op.cast(c, x - 3, sill + 4, w + 6, 2, 0.74)
        vy, vh = sill + 7, fy - 5 - (sill + 7)
        c.rect(x - 1, vy - 1, w + 2, vh + 2, wood[4])
        c.rect(x, vy, w, vh, ROOM)
        for xx in range(x + 1, x + w - 1, 3):
            c.rect(xx, vy, 1, vh, wood[1])
            c.p(xx, vy + vh // 2, wood[0])
        c.rect(x, vy, w // 3, vh, wood[3])
        c.rect(x, vy, w // 3, 1, wood[2])
        c.rect(x + w // 3 - 1, vy, 1, vh, wood[5])


def concha(c, x, y, w, h, paint, seed=0, lit=None):
    """A Goan window: nacre panes in a painted frame under a round head."""
    op.raised(c, x - 2, y - 2, w + 4, h + 4, paint, 1)
    for i in range(w + 4):
        lift = round(3 * math.sin(math.pi * i / (w + 3)))
        for k in range(1, lift + 1):
            c.p(x - 2 + i, y - 2 - k, paint[0] if k == lift else paint[1])
    shell(c, x, y, w, h, MOLAVE, seed)
    glow(lit, x + 1, y + 1, w - 1, h - 1, 1)
    op.reveal(c, x, y, w, h, 1)
    c.rect(x - 4, y + h + 2, w + 8, 1, paint[0])
    c.rect(x - 4, y + h + 3, w + 8, 1, paint[3])
    op.cast(c, x - 3, y + h + 4, w + 6, 2, 0.76)


def nipa(c, L, R, top, eave, hip=0.55):
    """Nipa palm thatch on a steep hipped roof, a bound ridge along its top."""
    px = set()
    for y in range(top, eave + 2):
        inset = round(max(0, eave - y) * hip)
        if R - L - 2 * inset < 4:
            continue
        fm.palm(c, L + inset, y, R - L - 2 * inset, 1, NIPA)
        for x in range(L + inset, R - inset):
            px.add((x, y))
            if R - inset - x < inset * 0.5:
                darker(c, x, y, [NIPA])
            elif x - L - inset < inset * 0.4:
                darker(c, x, y, [NIPA], -1)
    for x in range(L, R):
        for k, q in enumerate((4, 5, 6)):
            c.p(x, eave + 2 + k + int(h2(x // 2, 0, 93) * 2), NIPA[q])
    ins = round((eave - top) * hip)
    for x in range(L + ins - 3, R - ins + 3):
        for k, q in enumerate((2, 1, 2, 3, 5)):
            c.p(x, top - 3 + k, MOLAVE[4] if (x - L) % 9 == 0 and k < 4 else NIPA[q])
    return px


ESCUDO = ("..lllll..", ".lmmdmmd.", ".lmmdmmd.", ".lddddmd.", ".lmmdmmd.", ".lmmdmmd.", "..lmdmd..", "...lmd...",
          "....d....")


def escudo(c, x, y, r):
    """A family's arms cut in stone over the door."""
    for j, row in enumerate(ESCUDO):
        for i, ch in enumerate(row):
            if ch != '.':
                c.p(x + i, y + j, {'l': r[0], 'm': r[1], 'd': r[4]}[ch])
    op.cast(c, x + 2, y + len(ESCUDO), 6, 1, 0.76)


def balcao(c, cx, base, trim, seed=0):
    """Goa's balcao: a tiled porch on two columns at the head of the steps,
    a masonry seat either side of the door."""
    w, top = 58, base - 45
    x = cx - w // 2
    alero(c, x - 4, x + w + 4, top, x, x + w, 'plain', seed=seed)
    tejado(c, x - 4, x + w + 4, top - 17, top, seed)
    verges(c, x - 4, x + w + 4, top - 17, top)
    caballete(c, x - 4, x + w + 4, top - 17)
    for px0 in (x + 1, x + w - 6):
        c.rect(px0, top + 2, 5, base - top - 2, trim[1])
        c.rect(px0, top + 2, 1, base - top - 2, trim[0])
        c.rect(px0 + 4, top + 2, 1, base - top - 2, trim[3])
        c.rect(px0 - 1, top + 2, 7, 3, trim[1])
        c.rect(px0 - 1, top + 4, 7, 1, trim[3])
    for sx in (x - 8, x + w - 5):
        c.rect(sx, base - 14, 13, 1, trim[0])
        c.rect(sx, base - 13, 13, 3, trim[1])
        c.rect(sx, base - 10, 13, 10, trim[2])
        c.rect(sx + 12, base - 10, 1, 10, trim[4])
    step_stone(c, x + 6, base + 2, w - 12, trim)


def ventanuco(c, cx, sill, trim, paint, lit=None):
    """The one small shuttered light of a narrow front."""
    x, y, w, h = cx - 5, sill - 20, 10, 20
    c.rect(x - 2, y - 2, w + 4, h + 3, trim[1])
    c.rect(x - 2, y - 2, w + 4, 1, trim[0])
    c.rect(x + w + 1, y - 1, 1, h + 2, trim[3])
    hueco(c, x, y, w, h, paint, True, lit)
    c.rect(x - 3, y + h, w + 6, 1, trim[0])
    c.rect(x - 3, y + h + 1, w + 6, 2, trim[2])
    op.cast(c, x - 2, y + h + 3, w + 4, 2, 0.74)


GOODS = [CLAYS[0], YELLOW, P_GREEN, CAL, ALMAGRE]


def tienda(c, cx, base, w, wood, stone, seed=0, lit=None):
    """A shop bay open to the street: its boards folded back against one
    jamb, a counter across the opening with the day's goods on it."""
    x, h = cx - w // 2, 38
    y = base - h
    op.shopfront_open(c, x, y, w, h, wood, stone)
    cw, cy = w - 17, base - 13
    glow(lit, x, y + 4, cw, h - 18, 2)
    for gx in range(x + 2, x + cw - 4, 6):
        g = GOODS[int(h2(gx, seed, 5) * len(GOODS))]
        hh = 3 + int(h2(gx, seed, 6) * 3)
        c.rect(gx, cy - hh, 4, hh, g[3])
        c.rect(gx, cy - hh, 4, 1, g[1])
        c.rect(gx + 3, cy - hh + 1, 1, hh - 1, g[5])
    c.rect(x, cy, cw, 1, wood[0])
    c.rect(x, cy + 1, cw, 2, wood[1])
    c.rect(x, cy + 3, cw, 10, wood[3])
    for xx in range(x + 3, x + cw, 5):
        c.rect(xx, cy + 4, 1, 9, wood[5])
    c.rect(x, cy + 3, cw, 1, wood[5])


# ------------------------------------------------------------------ the house

class Casa:
    """One house from a spec. Its geometry is settled in __init__, so a
    caller can ask where the door stands without painting anything."""

    DEFAULTS = dict(W=160, floors=1, h0=None, h1=54, wall=OCHRE, q=2, ground=None, gq=None, stone=None, dado=ALMAGRE,
                    dado_h=13, trim=VERDE, flat=False, wood=CEDRO, paint=P_GREEN, shutter='green', rail=None,
                    roof='azotea', eave='plain', hip=0.0, rise=None, deck=DECK, bays=None, door=None,
                    portal='cantera', dw=28, dh=50, win='reja-iron', up='balcon-iron', cajones=None, shop=False,
                    niche=False, remates=False, crest=False, escudo=False, cenefa=None, cunhais=False, string=True,
                    canales=True, teatina=False, volada=False, balcao=False, foot=None, wear=0.5, seed=0)

    def __init__(self, spec):
        s = self.s = {**self.DEFAULTS, **spec}
        W = self.W = s['W']
        n = self.floors = s['floors']
        self.heights = [s['h0'] or 66] + [s['h1']] * (n - 1)
        self.rise = s['rise'] or (58 if s['roof'] == 'nipa' else min(44, round(44 * (0.5 + 0.5 * min(1.0, W / 140)))))
        self.jet = 3 if s['volada'] and n > 1 else 0
        self.x0 = 16 + (4 if self.jet else 0)
        self.base = 14 + (51 if s['roof'] == 'azotea' else self.rise + 6) + sum(self.heights)
        self.eave = self.base - sum(self.heights)
        self.c = C(W + 2 * self.x0, self.base + 8 + (4 if s['balcao'] else 0))
        self.lit, self.sills, self.roof_px = {}, [], set()
        # bays: a narrow front is a door and one small light, or all shop
        if W < 80:
            at, d = ([0.5], 0) if s['shop'] else ([0.34, 0.78], 0)
        else:
            k = s['bays'] or max(2, int((W + 10) / 46))
            at = [(i + 0.5) / k for i in range(k)]
            d = s['door'] if s['door'] is not None else (1 if s['seed'] % 2 or k < 4 else k - 2) if k > 2 else 0
            d = max(0, min(k - 1, d))
        self.cols = [self.x0 + round(W * f) for f in at]
        self.d = d
        self.pitch = W / len(at) if W >= 80 else 30
        self.compact = self.pitch < 40
        portal, dw, dh = s['portal'], s['dw'], s['dh']
        if self.pitch < 46 and portal in ('cantera', 'arco'):
            portal, dw, dh = 'liso', 22, 42
        if portal == 'porta':
            dw, dh = (20, 44) if self.compact else (24, 48)
        self.portal, self.door_x, self.door_size = portal, self.cols[d], (dw, dh)
        self.all_shop = s['shop'] and len(at) == 1
        if self.all_shop:
            self.door_size = (min(W - 22, 40), 38)
        self.door_h = self.door_size[1]
        self.roof_span, self.stacks = (0, self.c.w), []

    # ---------------------------------------------------------------- walls

    def wall(self, x, y, w, h, kind, q, seed):
        c, s = self.c, self.s
        if kind == 'tezontle':
            tezontle(c, x, y, w, h, seed)
        elif kind == 'talavera':
            talavera(c, x, y, w, h)
        elif kind == 'inca':
            inca(c, x, y, w, h)
        elif kind == 'adobe':
            adobe_wall(c, x, y, w, h, seed)
        elif kind == 'sillar':
            fm.ashlar(c, x, y, w, h, s['stone'], 8, 18)
        elif kind == 'tabla':
            fm.boards(c, x, y, w, h, MOLAVE)
        elif kind == 'azulejo':
            azulejo(c, x, y, w, h)
        else:
            encalado(c, x, y, w, h, kind, q, seed, s['wear'])

    def wall_ramp(self):
        """The ramp and step a parapet or a stain takes from the wall."""
        s = self.s
        if isinstance(s['wall'], list):
            return s['wall'], s['q']
        return {'tezontle': TEZONTLE, 'talavera': LADRILLO, 'adobe': ADOBE, 'azulejo': CAL, 'tabla': MOLAVE,
                'inca': CHILUCA}.get(s['wall'], s['stone']), 3

    def walls(self):
        c, s = self.c, self.s
        x0, W, base, jet = self.x0, self.W, self.base, self.jet
        trim, wood, seed = s['trim'], s['wood'], s['seed']
        f1 = base - self.heights[0]
        ground = s['ground'] if self.floors > 1 else None
        if self.floors > 1:
            self.wall(x0 - jet, self.eave, W + 2 * jet, f1 - self.eave, s['wall'], s['q'], seed)
        self.wall(x0, f1, W, base - f1, s['wall'] if ground is None else ground,
                  s['q'] if ground is None or s['gq'] is None else s['gq'], seed + 1)
        if jet:
            op.cast(c, x0, f1 + 5, W, 5, 0.66)
            for bx in range(x0 - jet + 2, x0 + W + jet - 4, 8):
                c.rect(bx, f1 + 2, 4, 3, wood[4])
                c.rect(bx, f1 + 2, 4, 1, wood[3])
            c.rect(x0 - jet, f1 - 2, W + 2 * jet, 1, wood[1])
            c.rect(x0 - jet, f1 - 1, W + 2 * jet, 2, wood[2])
            c.rect(x0 - jet, f1 + 1, W + 2 * jet, 1, wood[5])
        if s['dado'] is not None:
            dado(c, x0, base - s['dado_h'], W, s['dado_h'], s['dado'], seed, s['wear'])
        if s['cunhais'] and not self.compact:
            for px0 in (x0, x0 + W - 7):
                op.raised(c, px0, self.eave, 7, base - self.eave, trim, 2)
                c.rect(px0, base - 8, 7, 1, trim[1])
                c.rect(px0, self.eave + 4, 7, 1, trim[4])
        if s['string'] and not jet:
            for fy in self.floor_lines():
                if not (fy == self.floor_lines()[-1] and s['up'] == 'corredor'):
                    c.rect(x0, fy - 1, W, 1, trim[0])
                    c.rect(x0, fy, W, 2, trim[2])
                    op.cast(c, x0, fy + 2, W, 2, 0.74)
        if s['cenefa'] and not self.compact:
            cenefa(c, x0, self.eave + 4, W, s['cenefa'])

    def floor_lines(self):
        """The floor line of each upper storey, lowest first."""
        out, y = [], self.base
        for h in self.heights[:-1]:
            y -= h
            out.append(y)
        return out

    # ---------------------------------------------------------------- openings

    def upper(self, fy, top):
        """One upper storey standing on floor line fy."""
        c, s = self.c, self.s
        trim, paint, wood, flat, seed, lit = s['trim'], s['paint'], s['wood'], s['flat'], s['seed'] + fy, self.lit
        up = s['up']
        if s['wall'] == 'tabla':
            trim, flat = wood, False
        if not top and up in ('corredor', 'capiz', 'cajon'):
            up = 'balcon-wood'
        if self.compact and up not in ('capiz', 'guilhotina', 'persiana', 'concha'):
            up = 'hueco'
        n = len(self.cols)
        if up == 'corredor':
            for k, cx in enumerate(self.cols):
                balcon(c, cx, fy, 16, 36, trim, paint, None, flat, seed + k, wood, lit)
            op.cast(c, self.x0, self.eave + 2, self.W, 5, 0.74)
            corredor(c, self.x0 + 2, self.x0 + self.W - 2, fy, self.eave, wood, s['rail'])
        elif up == 'cajon':
            boxes = s['cajones'] or ((0, n - 1) if n > 2 else (n - 1,))
            for k, cx in enumerate(self.cols):
                if k in boxes:
                    cajon(c, cx, fy, wood, lit=lit)
                else:
                    balcon(c, cx, fy, 16, 36, trim, paint, 'wood', flat, seed + k, wood, lit)
        elif up == 'capiz':
            capiz(c, self.cols, round(self.pitch), fy, wood, seed, lit)
        elif up == 'persiana':
            for cx in self.cols:
                persiana(c, cx, fy - 12, 18, 30, trim, s['shutter'])
                self.sills.append((cx - 15, fy - 6, 30))
        elif up == 'concha':
            for k, cx in enumerate(self.cols):
                concha(c, cx - 9, fy - 44, 18, 30, trim, k, lit)
        elif up == 'guilhotina':
            for cx in self.cols:
                glazed(c, cx - 9, fy - 44, 18, 30, paint)
                self.sills.append((cx - 13, fy - 9, 26))
        elif up == 'sacada':
            for cx in self.cols:
                glazed(c, cx - 9, fy - 46, 18, 43, paint)
                c.rect(cx - 9, fy - 14, 18, 11, paint[3])
                c.rect(cx - 9, fy - 14, 18, 1, paint[5])
                c.rect(cx, fy - 13, 1, 10, paint[5])
                slab(c, cx - 15, fy, 30, trim)
                iron_rail(c, cx - 15, fy, 30, 13)
        elif up == 'hueco':
            for k, cx in enumerate(self.cols):
                if self.compact:
                    ventanuco(c, cx, fy - 16, trim, paint, lit)
                else:
                    ventana(c, cx, fy - 13, 16, 28, trim, paint, 'hueco', flat, seed + k, lit=lit)
                    self.sills.append((cx - 15, fy - 3, 30))
        else:
            for k, cx in enumerate(self.cols):
                wide = k == self.d and top
                balcon(c, cx, fy, 18 if wide else 16, 38 if wide else 36, trim, paint, up[7:], flat, seed + k, wood,
                       lit)

    def ground(self):
        c, s = self.c, self.s
        base, trim, paint, wood, flat, seed, lit = self.base, s['trim'], s['paint'], s['wood'], s['flat'], s['seed'], self.lit
        sill = base - s['dado_h'] - 4
        win = s['win']
        for k, cx in enumerate(self.cols):
            if k == self.d:
                continue
            if s['shop'] and not self.compact:
                tienda(c, cx, base, min(round(self.pitch) - 12, 38), wood, trim, seed + k, lit)
            elif self.compact and win not in ('porta', 'guilhotina', 'concha'):
                ventanuco(c, cx, sill, trim, paint, lit)
            elif win == 'porta':
                glazed_door(c, cx, base, paint)
            elif win == 'persiana':
                persiana(c, cx, sill, 18, 28, trim, s['shutter'])
                self.sills.append((cx - 15, sill + 6, 30))
            elif win == 'concha':
                concha(c, cx - 9, sill - 30, 18, 30, trim, k, lit)
            elif win == 'guilhotina':
                glazed(c, cx - 9, sill - 30, 18, 28, paint)
                self.sills.append((cx - 13, sill + 3, 26))
            else:
                h = 26 if win == 'postigo' else 30 if self.floors > 1 else 32
                ventana(c, cx, sill, 16, h, trim, paint, win, flat, seed + k, hood=self.floors == 1, lit=lit)
                self.sills.append((cx - 15, sill + 10, 30))
        dw, dh = self.door_size
        if self.all_shop:
            tienda(c, self.door_x, base, dw, wood, trim, seed, lit)
        elif self.portal == 'porta':
            glazed_door(c, self.door_x, base, paint, dw, dh)
        else:
            portada(c, self.door_x, base, trim, self.portal, dw, dh, wood)
        if s['escudo'] and self.d + 1 < len(self.cols) and self.floors > 1 and not self.compact:
            escudo(c, (self.cols[self.d] + self.cols[self.d + 1]) // 2 - 4, base - self.heights[0] - 40, trim)
        if s['balcao'] and self.pitch >= 46:
            balcao(c, self.door_x, base, trim, seed)

    # ---------------------------------------------------------------- roof

    def roof(self):
        c, s = self.c, self.s
        x0, x1, W, yw, jet = self.x0, self.x0 + self.W, self.W, self.eave, self.jet
        trim, wood, seed, cols, d = s['trim'], s['wood'], s['seed'], self.cols, self.d
        if s['roof'] == 'nipa':
            op.cast(c, x0 - jet, yw + 2, W + 2 * jet, 9, 0.56)
            nipa(c, x0 - jet - 9, x1 + jet + 9, yw - self.rise, yw)
            return
        if s['roof'] == 'teja':
            over = 6 if s['eave'] == 'canes' else 4
            L, R = x0 - over - jet, x1 + over + jet
            alero(c, L, R, yw, x0 - jet, x1 + jet, s['eave'], wood, seed)
            self.roof_px = tejado(c, L, R, yw - self.rise, yw, seed, s['hip'])
            verges(c, L, R, yw - self.rise, yw, s['hip'])
            ins = round(self.rise * s['hip'])
            caballete(c, L + ins, R - ins, yw - self.rise)
            return
        cornisa(c, x0 - 2, yw - 7, W + 4, trim)
        op.cast(c, x0, yw, W, 4, 0.66)
        wr, q = self.wall_ramp()
        fn = None if isinstance(s['wall'], list) else (lambda c_, x, y, w, h: self.wall(x, y, w, h, s['wall'], 3, seed + 2))
        azotea(c, x0, x1, yw - 7, wr, q, trim, s['deck'], seed=seed, wall_fn=fn)
        pf = yw - 16
        grand = W >= 150 and not self.compact
        crest = s['crest'] and grand
        if crest:
            cx = cols[d]
            for i in range(-34, 35):
                lift = round(12 * math.cos(i / 34 * math.pi / 2) ** 0.55) + (6 if abs(i) < 11 else 0)
                for k in range(lift):
                    yy = pf - 3 - k
                    c.p(cx + i, yy, wr[q] if not fn else wr[3] if h2(cx + i, yy, 5) > 0.1 else wr[5])
                for k, t in enumerate((0, 1, 2)):
                    c.p(cx + i, pf - 3 - lift + k, trim[t])
            if s['niche']:
                nicho(c, cx - 5, pf - 17, trim)
        if s['remates'] and grand:
            for rx in [x0 - 1, x1 - 6] + ([cols[d] - 40, cols[d] + 34] if crest else [cols[d] - 3]):
                remate(c, rx, pf - 3, trim)
        if W >= 96:
            chimenea(c, x1 - 30 if d < len(cols) / 2 else x0 + 18, pf - 12, wr, q, trim)
        if s['teatina'] and grand:
            teatina(c, x0 + 30, pf - 8, wr, q, trim)
        if s['canales'] and not self.compact:
            ramps = [r for r in (s['wall'], s['ground'], s['dado']) if isinstance(r, list)]
            ramps += [TEZONTLE, LADRILLO, ADOBE, CAL, CHILUCA, ARENISCA, TUFF]
            for k in range(len(cols) - 1):
                if (k + seed) % 2 == 0 or len(cols) <= 3:
                    canal(c, (cols[k] + cols[k + 1]) // 2 - 2, yw - 9, ramps, yw - 3, seed + k, s['wear'])

    # ---------------------------------------------------------------- build

    def build(self):
        c, s = self.c, self.s
        self.walls()
        lines = self.floor_lines()
        for i, fy in enumerate(lines):
            self.upper(fy, i == len(lines) - 1)
        self.ground()
        self.roof()
        foot = s['foot'] or s['trim']
        c.rect(self.x0 - 1, self.base, self.W + 2, 1, foot[2])
        c.rect(self.x0 - 1, self.base + 1, self.W + 2, 2, foot[4])
        if not self.all_shop:
            step_stone(c, self.door_x - self.door_size[0] // 2 - 9, self.base, self.door_size[0] + 18, foot)
        walls = {(x, y) for y in range(self.eave, self.base - s['dado_h']) for x in range(self.x0, self.x0 + self.W)}
        weather(c, dict(roof=self.roof_px, roof_shade=set(), eave_y=lambda x: self.eave, walls=walls, stone=set(),
                        sills=self.sills, chimneys=[]), s['wear'] * (0.8 if s['roof'] == 'teja' else 1), s['seed'])
        outline(c)
        consolidate(c)
        for y in range(c.h):
            for x in range(c.w):
                q = c.px[x, y]
                # Shadow on shadow can reach black; outlines and shade are tinted.
                if q[3] and max(q[:3]) < 14:
                    c.px[x, y] = (22, 15, 24, 255)
        self.im = c.im
        self.night = lamplight(c.im, self.lit)
        return c.im


def lamplight(im, lit):
    """The house after dark, as a frame of its own: glass the library marked,
    and the rooms, shells and lattices this module did."""
    from PIL import Image
    from art.front_sinitic import night_image
    glass, rooms = fm.lit(im), night_image(im, lit) if lit else None
    if rooms is None or not rooms.getbbox():
        return glass
    if glass is not None:
        rooms.alpha_composite(glass)
    rooms.info['trim'] = True
    return rooms


def glazed_door(c, cx, base, paint, w=18, h=44):
    """A Brazilian street door: two painted leaves under a glazed bandeira."""
    x, y = cx - w // 2, base - h
    p = paint
    op.raised(c, x - 3, y - 3, w + 6, h + 3, p, 2)
    for i in range(w + 6):
        lift = round(2.4 * math.sin(math.pi * i / (w + 5)))
        for k in range(1, lift + 1):
            c.p(x - 3 + i, y - 3 - k, p[1] if k == lift else p[2])
    op.glass(c, x, y, w, 9)
    for k in (1, 2):
        c.rect(x + round(w * k / 3), y, 1, 9, p[2])
    leaf(c, x, y + 10, w // 2, h - 10, p)
    leaf(c, x + w // 2, y + 10, w - w // 2, h - 10, p)
    c.rect(x, y + 9, w, 1, p[5])
    op.reveal(c, x, y, w, h, 2)


# ------------------------------------------------------------------ looks
# A look is one place's house: a base spec, colour variants (the game's
# numbered frames), what a poor or narrow house of it drops (`humble`), how
# many storeys its street houses have and how many its tallest. Dates and
# regions are chosen in src/content/graphics/iberian-houses.ts.

HUMBLE = dict(portal='liso', dw=22, dh=42, h0=60, remates=False, crest=False, niche=False, cenefa=None, escudo=False,
              cunhais=False, teatina=False)

LOOKS = {
    'oaxaca': dict(
        label='Azotea house', wall='ochre-plaster', roof='flat', floors=1, tall=2,
        about='A house of New Spain: one storey round a patio under a flat brick-tiled roof, lime-washed in ochre or '
              'red, its windows barred and shuttered, its street door studded cedar in a frame of cut stone.',
        base=dict(wall=OCHRE, dado=ALMAGRE, trim=VERDE, h0=72, cenefa=ALMAGRE, remates=True),
        colours=[dict(), dict(wall=ALMAGRE, q=3, dado=None, cenefa=None, paint=P_BLUE),
                 dict(wall=ANIL, dado=CAL, cenefa=None, trim=CHILUCA, paint=CEDRO)],
        humble=dict(HUMBLE, trim=CAL, flat=True, win='reja-wood', wood=PINE)),
    'mexico': dict(
        label='Tezontle house', wall='field-stone', roof='flat', floors=2, tall=3,
        about='A Mexico City house faced in dark red tezontle with grey chiluca stone at its doors, windows and '
              'corners, iron balconies above, and a parapet that rises over the door around a saint in a niche.',
        base=dict(wall='tezontle', dado=None, trim=CHILUCA, cunhais=True, crest=True, niche=True, remates=True),
        colours=[dict(), dict(paint=P_BLUE), dict(wall=ALMAGRE, q=3, crest=False, niche=False)],
        humble=dict(HUMBLE, wall=ALMAGRE, q=3, trim=CAL, flat=True, win='reja-wood', wood=PINE)),
    'puebla': dict(
        label='Talavera house', wall='ochre-plaster', roof='flat', floors=2, tall=3,
        about='A Puebla house fronted in brick laid on the diagonal and set with blue and white talavera tiles, its '
              'frames and cornices in white stucco.',
        base=dict(wall='talavera', dado=None, trim=CAL, cunhais=True, remates=True, paint=P_BLUE, wear=0.3),
        colours=[dict(), dict(paint=P_GREEN), dict(wall=OCHRE, dado=ALMAGRE, cunhais=False)],
        humble=dict(HUMBLE, wall=OCHRE, dado=ALMAGRE, flat=True, win='reja-wood', wood=PINE)),
    'lima': dict(
        label='Box-balcony house', wall='rose-plaster', roof='flat', floors=2, tall=2,
        about='A Lima house: adobe below and light cane and plaster above against earthquakes, a flat mud roof '
              'because it never rains, and closed cedar balconies whose lattices let those inside see out unseen.',
        base=dict(wall=ROSE, dado=OCHRE, trim=CAL, flat=True, up='cajon', win='reja-wood', deck=TORTA, canales=False,
                  teatina=True, paint=CEDRO, wear=0.4),
        colours=[dict(), dict(wall=OCHRE, dado=ALMAGRE), dict(wall=ANIL, dado=CAL)],
        humble=dict(HUMBLE)),
    'caribe': dict(
        label='Gallery house', wall='ochre-plaster', roof='pantile', floors=2, tall=3,
        about='A house of the Spanish Caribbean: thick walls washed in strong colour, a timber gallery on posts '
              'along the upper floor under the eave, turned wooden bars at the windows, a tiled roof for the rains.',
        base=dict(wall=YELLOW, dado=None, trim=CORAL, roof='teja', eave='canes', up='corredor', portal='arco',
                  win='reja-wood', paint=P_GREEN),
        colours=[dict(), dict(wall=CAL, q=1, paint=P_BLUE, rail=P_BLUE), dict(wall=ROSE, paint=CEDRO)],
        humble=dict(HUMBLE, flat=True, trim=CAL)),
    'andes': dict(
        label='Highland house', wall='white-plaster', roof='pantile', floors=2, tall=2,
        about='An Andean town house: whitewashed adobe above a ground floor of fitted stone, a painted timber '
              'gallery, a tiled roof on wide eaves.',
        base=dict(wall=CAL, q=1, ground='inca', dado=None, trim=CHILUCA, roof='teja', eave='canes', up='corredor',
                  rail=P_BLUE, portal='arco', win='postigo', paint=P_BLUE),
        colours=[dict(), dict(rail=P_GREEN, paint=P_GREEN), dict(rail=None, paint=CEDRO, ground=None, dado=OCHRE)],
        humble=dict(HUMBLE, wall='adobe', trim=CAL, flat=True, win='reja-wood', paint=PINE, wood=PINE, wear=0.8)),
    'brasil': dict(
        label='Sobrado', wall='white-plaster', roof='pantile', floors=2, tall=3,
        about='A Brazilian sobrado: whitewash with doors and frames in one strong colour, sash lights, stone '
              'pilasters at the corners, a tile roof on a flared eave.',
        base=dict(wall=CAL, q=1, dado=None, trim=CANTARIA, cunhais=True, roof='teja', eave='beira', up='sacada',
                  win='porta', portal='porta', paint=P_BLUE, string=False, h0=60, wear=0.4),
        colours=[dict(), dict(paint=P_RED), dict(paint=P_GREEN)],
        humble=dict(HUMBLE, cunhais=True, win='guilhotina', h0=58)),
    'lusa': dict(
        label='Whitewashed house', wall='white-plaster', roof='pantile', floors=2, tall=3,
        about='A Portuguese house of the first colonial centuries, at home or overseas: whitewash, stone frames, '
              'board shutters and no glass, a wooden balcony, a tile roof on a flared eave.',
        base=dict(wall=CAL, q=1, dado=None, trim=CORAL, roof='teja', eave='beira', up='balcon-wood', win='postigo',
                  portal='liso', dw=24, dh=46, paint=P_GREEN, wear=0.5),
        colours=[dict(), dict(paint=P_RED), dict(paint=P_BLUE, dado=ALBERO, dado_h=9)],
        humble=dict(HUMBLE)),
    'andalucia': dict(
        label='Andalusian house', wall='white-plaster', roof='pantile', floors=2, tall=3,
        about='An Andalusian house: lime wash, a dado and frames in yellow earth, iron cages at the windows and '
              'iron balconies above, a patio behind the street door.',
        base=dict(wall=CAL, q=1, dado=ALBERO, dado_h=11, trim=ALBERO, flat=True, roof='teja', eave='tejaroz',
                  paint=P_GREEN, wear=0.3),
        colours=[dict(), dict(dado=ALMAGRE, trim=ALMAGRE, paint=CEDRO), dict(dado=ANIL, trim=CAL, paint=P_BLUE)],
        humble=dict(HUMBLE, win='reja-wood')),
    'castilla': dict(
        label='Stone house', wall='field-stone', roof='pantile', floors=2, tall=3,
        about='A Castilian house of golden stone: a round arch of long voussoirs, the family arms cut beside it, '
              'iron balconies, a tile roof on rafter tails.',
        base=dict(wall='sillar', stone=ARENISCA, dado=None, trim=ramp(74, 0.06, lift=0.04), roof='teja', eave='canes',
                  portal='arco', escudo=True, paint=CEDRO, string=False),
        colours=[dict(), dict(stone=ramp(250, 0.014, lift=0.0), trim=ramp(250, 0.012, lift=0.05)),
                 dict(wall=CAL, q=1, dado=ARENISCA, escudo=False)],
        humble=dict(HUMBLE, wall='adobe', trim=CAL, flat=True, win='reja-wood', paint=PINE, wood=PINE)),
    'portugal': dict(
        label='Tiled house', wall='white-plaster', roof='pantile', floors=2, tall=3,
        about='A Portuguese town house of the nineteenth century, its whole front in blue and white tile between '
              'stone frames, sash lights and iron balconies.',
        base=dict(wall='azulejo', dado=None, trim=CORAL, cunhais=True, roof='teja', eave='beira', up='sacada',
                  win='porta', portal='porta', paint=P_GREEN, string=False, h0=60, wear=0.3),
        colours=[dict(), dict(wall=ROSE, paint=P_RED), dict(wall=YELLOW, paint=P_GREEN)],
        humble=dict(HUMBLE, wall=CAL, q=1, cunhais=True, win='guilhotina', h0=58)),
    'toscana': dict(
        label='Stuccoed house', wall='ochre-plaster', roof='pantile', floors=2, tall=3,
        about='An Italian town house: sienna stucco, frames of grey pietra serena, louvred shutters folded back, a '
              'deep eave on rafters.',
        base=dict(wall=SIENA, dado=None, trim=SERENA, roof='teja', eave='canes', up='persiana', win='persiana',
                  portal='arco', paint=CEDRO),
        colours=[dict(), dict(wall=OCHRE, shutter='grey'), dict(wall=ROSE)],
        humble=dict(HUMBLE)),
    'toscana-early': dict(
        label='Stone-framed house', wall='ochre-plaster', roof='pantile', floors=2, tall=3,
        about='An Italian town house before glass was common: stucco or rough stone, iron grates on the ground '
              'floor, shuttered lights above, a round-arched door, a deep eave.',
        base=dict(wall=SIENA, dado=None, trim=SERENA, roof='teja', eave='canes', up='hueco', win='reja-iron',
                  portal='arco', paint=CEDRO),
        colours=[dict(), dict(wall='sillar', stone=ramp(70, 0.05, lift=-0.04), string=False), dict(wall=OCHRE)],
        humble=dict(HUMBLE, win='reja-wood')),
    'egeo': dict(
        label='Island house', wall='white-plaster', roof='flat', floors=1, tall=2,
        about='An Aegean island house: a limed cube with a flat roof for catching rain, its door and shutters '
              'painted blue.',
        base=dict(wall=CAL, q=1, dado=None, trim=CAL, flat=True, portal='liso', dw=20, dh=42, h0=58, win='postigo',
                  up='hueco', deck=ramp(92, 0.012, lift=0.03), canales=False, paint=EGEO, wood=EGEO, wear=0.2),
        colours=[dict(), dict(paint=P_GREEN, wood=P_GREEN), dict(paint=CEDRO, wood=CEDRO, dado=EGEO, dado_h=8)],
        humble=dict(HUMBLE)),
    'bahay': dict(
        label='Bahay na bato', wall='field-stone', roof='pantile', floors=2, tall=2,
        about='A Philippine bahay na bato: a stone ground floor for stores and carriages, and over it a timber '
              'upper floor that overhangs the street, walled in sliding panels of capiz shell with vents below.',
        base=dict(h1=58, wall='tabla', ground='sillar', stone=TUFF, dado=None, trim=TUFF, roof='teja', hip=0.5,
                  eave='canes', up='capiz', volada=True, portal='arco', wood=MOLAVE, paint=MOLAVE),
        colours=[dict(), dict(ground=CAL, gq=1, trim=CAL, flat=True, win='reja-wood', wear=0.7), dict(roof='nipa')],
        humble=dict(HUMBLE, roof='nipa', win='reja-wood')),
    'bahay-early': dict(
        label='Stone-and-timber house', wall='field-stone', roof='thatch', floors=2, tall=2,
        about='An early Spanish Philippine house: stone below after the fires, light timber above after the '
              'earthquakes, board shutters, and palm thatch or tile over it.',
        base=dict(h1=54, wall='tabla', ground='sillar', stone=TUFF, dado=None, trim=TUFF, roof='nipa', up='hueco',
                  volada=True, portal='liso', dw=24, dh=44, win='reja-wood', wood=MOLAVE, paint=MOLAVE),
        colours=[dict(), dict(roof='teja', hip=0.5, eave='canes'), dict(ground=CAL, gq=1, trim=CAL, flat=True)],
        humble=dict(HUMBLE)),
    'goa': dict(
        label='Goan house', wall='ochre-plaster', roof='pantile', floors=1, tall=2,
        about='A Goan house: laterite walls washed in colour above a red plinth, panes of oyster shell under round '
              'heads, and a tiled porch with seats where the household sits out in the evening.',
        base=dict(h0=64, wall=ANIL, dado=LATERITE, dado_h=10, trim=CAL, flat=True, cunhais=True, roof='teja',
                  eave='plain', rise=48, win='concha', up='concha', portal='liso', dw=22, dh=42, balcao=True,
                  wood=MOLAVE, paint=MOLAVE, wear=0.4),
        colours=[dict(), dict(wall=YELLOW), dict(wall=ALMAGRE, q=3)],
        humble=dict(HUMBLE, balcao=False)),
}


def house(look, variant=0, form='row', cells=12, seed=0):
    """The house the game asks for: a look, one of its colours, a street
    form and a frontage in 16px cells."""
    L = LOOKS[look]
    s = {**L['base'], **L['colours'][variant % len(L['colours'])]}
    small = form in (None, 'cottage', 'hut', 'stall')
    if small:
        s.update(L['humble'])
    floors = 1 if small or form == 'shop' else L['tall'] if form == 'tall' else max(2, L['floors']) if form == 'hall' \
        else L['floors']
    s.update(W=cells * 16, floors=floors, seed=seed, shop=form in ('shop', 'stall'))
    if form == 'hall':
        s.update(door=max(2, int((cells * 16 + 10) / 46)) // 2, escudo=True)
    return Casa(s)


def build(look, variant=0, form='row', cells=12, seed=0):
    return house(look, variant, form, cells, seed).build()


from art import front_family  # noqa: E402

front_family.register('casa', {k: dict(label=L['label'], about=L['about'], wall=L['wall'], roof=L['roof'],
                                       variants=len(L['colours'])) for k, L in LOOKS.items()}, house)

SETS = [('New Spain', ['oaxaca', 'mexico', 'puebla']), ('Lima, the Caribbean, the Andes', ['lima', 'caribe', 'andes']),
        ('The Portuguese world', ['lusa', 'brasil', 'portugal']), ('Spain', ['andalucia', 'castilla']),
        ('Italy and the Aegean', ['toscana-early', 'toscana', 'egeo']),
        ('The Philippines and Goa', ['bahay-early', 'bahay', 'goa'])]

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else 'artifacts/iberia-ab.png'
    front_family.sheets('casa', out, SETS)
