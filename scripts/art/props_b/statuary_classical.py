"""Statue figures of the Mediterranean, the Near East and Europe, for
statuary.statue(kind, ..., kinds=KINDS)."""
import math

from .statuary import Parts, sculpt, fold, incise, line, head, face


def _block(c, p, x0, y0, x1, y1, ramp):
    """A squared stone in the figure's coordinates: lit top, shaded right."""
    s = p.s
    ax, ay, bx, by = int(p.cx + x0 * s), int(p.by + y0 * s), int(p.cx + x1 * s), int(p.by + y1 * s)
    c.rect(ax, ay, bx, by, ramp[4])
    c.rect(ax, ay, bx, ay + max(1, int(s)), ramp[6])
    c.rect(bx - max(1, int(1.6 * s)), ay, bx, by, ramp[2])
    p.list.append(((ax + bx) / 2, (ay + by) / 2, (bx - ax) / 2, (by - ay) / 2))


def _ring(p, x, y, r, n=10, w=1.0, a0=0, a1=360):
    for i in range(n):
        a = math.radians(a0 + (a1 - a0) * i / n)
        p.e(x + r * math.cos(a), y - r * math.sin(a), w, w)


def _legs(p, spread=2.7, top=-19, r0=2.9, r1=2.2):
    for x in (-spread, spread):
        p.limb(x * 0.85, top, x, -1.5, r0, r1)
        p.e(x + (0.7 if x > 0 else -0.5), -1, 2.8, 1.4)


def _nemes(p, x, y, r):
    """The striped headcloth: a wide wedge from crown to shoulders."""
    p.limb(x - r * 0.75, y - r * 0.5, x - r * 1.55, y + r * 1.75, r * 0.9, r * 0.8)
    p.limb(x + r * 0.75, y - r * 0.5, x + r * 1.55, y + r * 1.75, r * 0.9, r * 0.8)
    p.e(x, y - r * 0.55, r * 1.3, r * 0.95)


def _nemes_cut(c, p, ramp, x, y, r):
    for i in range(4):
        dy = r * (0.2 + i * 0.5)
        fold(c, p, x - r * 2.3, y + dy, x - r * 0.95, y + dy, ramp, 2)
        fold(c, p, x + r * 0.95, y + dy, x + r * 2.3, y + dy, ramp, 2)
    fold(c, p, x - r * 0.9, y - r * 0.62, x + r * 0.9, y - r * 0.62, ramp, 2)


def cuirass(c, cx, by, s, ramp):
    """A Roman emperor in a muscle cuirass, cloak over the left arm, the
    right raised to address the troops."""
    p = Parts(cx, by, s)
    p.e(7.4, -20, 4, 11.5)
    p.e(7.8, -9.5, 3.2, 3)
    _legs(p, 2.8, -15, 2.7, 2)
    for x in (-2.9, 2.9):
        p.limb(x, -7.5, x, -2.5, 2.5, 2.4)
    p.e(0, -16.2, 6.8, 4.4)
    p.e(0, -21.5, 5.4, 3.4)
    p.e(0, -28, 6.3, 6.6)
    p.limb(5.6, -32, 8.2, -25.5, 2.5, 2.1)
    p.limb(8.2, -25.5, 4.6, -22.6, 2, 1.7)
    p.e(5.6, -32.4, 3.9, 3)
    p.limb(-11.6, -45.5, -10, -36.5, 1.6, 2)
    p.limb(-10, -36.5, -5.6, -32.4, 2.1, 2.5)
    p.e(-11.8, -47, 1.8, 2)
    p.e(-4.8, -32.2, 2.8, 2.4)
    head(p)
    sculpt(c, p, ramp)
    face(c, p, ramp)
    fold(c, p, -4.4, -28.6, -0.6, -27.6, ramp, 3)
    fold(c, p, 0.6, -27.6, 4.4, -28.6, ramp, 3)
    fold(c, p, 0, -33, 0, -21, ramp, 3)
    fold(c, p, -5.2, -19.4, 5.2, -19.4, ramp, 1)
    for x in (-4.6, -2.3, 0, 2.3, 4.6):
        fold(c, p, x, -18.4, x, -12.6, ramp, 2)
    fold(c, p, -6, -15.4, 6, -15.4, ramp, 2)
    fold(c, p, 6.4, -31, 8.4, -10, ramp, 2)
    fold(c, p, 9.2, -28, 10, -12, ramp, 2)
    fold(c, p, 2.6, -34.4, 7.6, -30.4, ramp, 2)
    return p


def goddess(c, cx, by, s, ramp):
    """Athena, a city's Fortune, Britannia: a woman in a long belted dress,
    crested helmet, a spear in one hand and a shield grounded at the other."""
    p = Parts(cx, by, s)
    p.limb(-11, -1, -11, -55, 0.75)
    p.limb(-11, -55, -11, -60, 1.5, 0.5)
    p.e(0, -11, 6.9, 12)
    p.e(0, -2.6, 7.2, 2.8)
    p.e(0, -21, 6.2, 4)
    p.e(0, -28, 6, 7.4)
    p.limb(5.4, -32, 8, -24, 2.3, 1.9)
    p.limb(8, -24, 9, -18, 1.8, 1.5)
    p.e(10, -9.4, 5.4, 9)
    p.e(10, -9.4, 2, 3)
    p.limb(-5.4, -32, -9.4, -28.5, 2.3, 1.9)
    p.limb(-10.8, -34, -9.4, -28.5, 1.6, 1.8)
    for x in (-4.6, 4.6):
        p.e(x, -32, 2.6, 2.3)
    head(p)
    p.e(0, -43, 4.4, 3.2)
    p.limb(4.6, -45.5, 0, -50, 1.4, 2)
    p.limb(0, -50, 0, -45.5, 2, 2.3)
    sculpt(c, p, ramp)
    face(c, p, ramp, hair=False)
    fold(c, p, -3.6, -41.6, 3.6, -41.6, ramp, 2)
    fold(c, p, -5.6, -22, 5.6, -22, ramp, 1)
    fold(c, p, -5.8, -18.4, 5.8, -17.6, ramp, 3)
    for x, k in ((-4.4, 2), (-1.6, 2), (1.4, 2), (4, 2)):
        fold(c, p, x, -17, x * 1.12, -1, ramp, k)
    fold(c, p, -3.6, -33, 0, -26.4, ramp, 2)
    fold(c, p, 3.6, -33, 0, -26.4, ramp, 2)
    return p


def athlete(c, cx, by, s, ramp):
    """A nude Greek athlete in contrapposto: weight on one leg, the other
    trailing, a discus in the lowered hand, a stump at his side."""
    p = Parts(cx, by, s)
    p.limb(-7.8, -1, -7.8, -9, 2.7, 2.3)
    p.limb(2.2, -18, 4.6, -10.4, 3.1, 2.4)
    p.limb(4.6, -10.4, 6.4, -2, 2.3, 1.7)
    p.e(7.2, -1, 2.8, 1.4)
    p.limb(-2.4, -18, -3, -10, 3.3, 2.6)
    p.limb(-3, -10, -2.6, -1.8, 2.5, 1.9)
    p.e(-3, -1, 2.9, 1.4)
    p.e(-0.2, -18.6, 5.9, 3.8)
    p.e(-0.2, -23.6, 4.9, 4.4)
    p.e(0, -29.6, 6.1, 5.4)
    p.limb(5.6, -33, 8.2, -25.4, 2.5, 2.1)
    p.limb(8.2, -25.4, 8.8, -19, 2, 1.7)
    p.e(9.2, -16, 3, 3.4)
    p.limb(-5.6, -32.4, -8.4, -26, 2.5, 2.1)
    p.limb(-8.4, -26, -4.6, -22.4, 2, 1.7)
    p.e(-4.8, -32.2, 2.8, 2.4)
    p.e(4.8, -33, 2.8, 2.4)
    head(p, 0.6, -40.8)
    sculpt(c, p, ramp)
    face(c, p, ramp, 0.6, -40.8)
    fold(c, p, -4.4, -29.2, -0.6, -28.4, ramp, 3)
    fold(c, p, 0.6, -28.6, 4.6, -29.6, ramp, 3)
    fold(c, p, 0, -33.4, -0.2, -20.4, ramp, 3)
    fold(c, p, -4.4, -19.4, -0.2, -15.8, ramp, 2)
    fold(c, p, 4.2, -19.8, -0.2, -15.8, ramp, 2)
    return p


def victory(c, cx, by, s, ramp):
    """Nike on her column: wings spread, a wreath held up, the dress blown
    back against the legs."""
    p = Parts(cx, by, s)
    for f in (-1, 1):
        for x0, y0, x1, y1, r in ((15.4, -47, 14.6, -33, 2.1), (12.4, -45, 12.4, -27, 2.5),
                                  (9.2, -41, 9.8, -22, 2.7), (6, -35, 7, -18, 2.7)):
            p.limb(x0 * f, y0, x1 * f, y1, r, 1.4)
        p.limb(17 * f, -51, 9.6 * f, -43.6, 1.9, 3.3)
        p.limb(9.6 * f, -43.6, 4 * f, -31, 3.3, 3.7)
    p.e(4.6, -6, 6.6, 5)
    p.e(0, -11, 6, 12)
    p.e(1, -2.4, 7.4, 2.6)
    p.e(0, -27.4, 5.6, 8)
    p.limb(-5.2, -32, -8, -25, 2.2, 1.8)
    p.limb(-8, -25, -10.6, -20, 1.7, 1.4)
    _ring(p, 6.6, -54, 3.6, 12, 1.05)
    p.limb(6.8, -49.6, 7.8, -40, 1.5, 1.9)
    p.limb(7.8, -40, 5.2, -32.4, 1.9, 2.3)
    for x in (-4.4, 4.4):
        p.e(x, -32, 2.5, 2.2)
    head(p)
    sculpt(c, p, ramp)
    face(c, p, ramp)
    for f in (-1, 1):
        fold(c, p, 5 * f, -30, 10 * f, -42, ramp, 3)
        fold(c, p, 10 * f, -42, 16 * f, -48.6, ramp, 3)
    fold(c, p, -5.4, -21, 5.4, -20, ramp, 2)
    for x0, x1 in ((-3.6, -2), (-0.6, 3), (2.4, 7.4), (4.6, 10)):
        fold(c, p, x0, -18, x1, -1.6, ramp, 2)
    fold(c, p, -3, -33, 2, -22, ramp, 2)
    return p


def saint(c, cx, by, s, ramp):
    """A bishop in cope and mitre, crozier in one hand, the other raised in
    blessing."""
    p = Parts(cx, by, s)
    p.limb(-10.6, -1, -10.6, -48, 0.75)
    _ring(p, -8.4, -48.4, 2.3, 8, 0.9, 180, -80)
    p.e(0, -12, 8.4, 13)
    p.e(0, -2.6, 8.8, 2.8)
    p.e(0, -27, 7.2, 8.6)
    p.e(0, -15, 5, 13)
    p.limb(-5.8, -32, -9, -26, 2.5, 2.1)
    p.limb(-9, -26, -10.4, -29.6, 2, 1.7)
    p.limb(5.8, -32, 8.6, -27, 2.5, 2.1)
    p.limb(8, -34.6, 8.6, -27, 1.5, 1.9)
    for x in (-5, 5):
        p.e(x, -32, 2.8, 2.4)
    head(p)
    p.limb(0, -51, 0, -44, 0.8, 3.8)
    sculpt(c, p, ramp)
    face(c, p, ramp, hair=False)
    fold(c, p, -3.4, -43.4, 3.4, -43.4, ramp, 2)
    fold(c, p, 0, -44, 0, -50, ramp, 3)
    fold(c, p, -3.4, -33.6, -4.8, -1, ramp, 1)
    fold(c, p, 3.4, -33.6, 4.8, -1, ramp, 1)
    fold(c, p, -1.6, -33, -1.6, -3, ramp, 4)
    fold(c, p, 1.6, -33, 1.6, -3, ramp, 4)
    fold(c, p, -6.6, -20, -7.4, -2, ramp, 2)
    fold(c, p, 6.6, -20, 7.4, -2, ramp, 2)
    return p


def knight(c, cx, by, s, ramp):
    """Roland in the market place: armour, a mantle, the town's sword held
    upright and its shield on his arm."""
    p = Parts(cx, by, s)
    _legs(p, 2.9, -15, 3, 2.5)
    for x in (-2.9, 2.9):
        p.e(x, -9.4, 3, 2)
    p.e(0, -15.6, 6.4, 4.4)
    p.e(0, -21.4, 5.2, 3.4)
    p.e(0, -28, 6.2, 6.4)
    p.limb(-9, -58, -9, -31, 0.8, 1.15)
    p.limb(-12.4, -33.4, -5.6, -33.4, 0.95)
    p.limb(-5.8, -32, -9, -26.6, 2.6, 2.2)
    p.limb(-9, -31.4, -9, -26.6, 2, 2.2)
    p.limb(5.8, -32, 8.6, -27, 2.6, 2.2)
    p.e(8.6, -25.6, 5.2, 5.2)
    p.limb(8.6, -24, 8.6, -12.6, 5, 1)
    for x in (-5, 5):
        p.e(x, -32.2, 3.3, 2.8)
    head(p)
    sculpt(c, p, ramp)
    face(c, p, ramp)
    fold(c, p, 8.6, -30, 8.6, -14, ramp, 2)
    fold(c, p, 4.4, -24.6, 12.8, -24.6, ramp, 2)
    fold(c, p, -4.8, -19.6, 3.6, -19.6, ramp, 1)
    fold(c, p, -5.6, -13.4, 4, -13.4, ramp, 2)
    for x in (-3.6, -1.2, 1.2):
        fold(c, p, x, -18.4, x * 1.15, -12.4, ramp, 2)
    fold(c, p, -4.2, -29, 2.6, -29, ramp, 3)
    fold(c, p, 0, -33, 0, -21, ramp, 3)
    return p


def king(c, cx, by, s, ramp):
    """A crowned king in a mantle to the ground, sceptre and orb."""
    p = Parts(cx, by, s)
    p.limb(-10.4, -17, -11.6, -45, 0.8)
    p.e(-11.7, -46.4, 1.6, 1.9)
    p.e(0, -12, 10.4, 13)
    p.e(0, -2.6, 11.4, 2.8)
    p.e(0, -12, 5.8, 12.6)
    p.e(0, -2.4, 6, 2.4)
    p.e(0, -26.6, 6.4, 8)
    p.limb(-6, -31, -9.4, -25.6, 2.6, 2.2)
    p.limb(-9.4, -25.6, -10.6, -29, 2, 1.8)
    p.limb(6, -31, 8.6, -25.6, 2.6, 2.2)
    p.limb(8.6, -25.6, 6.4, -23.4, 2, 1.8)
    p.e(6.2, -25.4, 2.5, 2.5)
    p.limb(6.2, -28, 6.2, -30, 0.8)
    p.e(0, -32, 8, 3.6)
    head(p)
    p.limb(-3.2, -44.2, 3.2, -44.2, 1.6)
    for x, y in ((-3.6, -46.6), (0, -47.4), (3.6, -46.6)):
        p.e(x, y, 1.1, 1.8)
    sculpt(c, p, ramp)
    face(c, p, ramp, hair=False)
    fold(c, p, -3.6, -43, 3.6, -43, ramp, 2)
    fold(c, p, -7, -30.4, 7, -30.4, ramp, 3)
    for x in (-5, -2, 1, 4):
        fold(c, p, x, -33, x, -32, ramp, 1)
    fold(c, p, -5.4, -28, -6.4, -1, ramp, 1)
    fold(c, p, 5.4, -28, 6.4, -1, ramp, 1)
    fold(c, p, -8.4, -18, -9.6, -2, ramp, 2)
    fold(c, p, 8.4, -18, 9.6, -2, ramp, 2)
    fold(c, p, -4.6, -21, 4.6, -21, ramp, 2)
    fold(c, p, 0, -20, 0, -2, ramp, 2)
    return p


def soldier(c, cx, by, s, ramp):
    """The infantryman of a war memorial: greatcoat, steel helmet, head a
    little bowed, rifle grounded at his side."""
    p = Parts(cx, by, s)
    for x in (-2.8, 2.8):
        p.limb(x, -8, x, -1.6, 2.7, 2.5)
        p.e(x + (0.8 if x > 0 else -0.6), -1, 3, 1.5)
    p.e(0, -14, 6.8, 8.6)
    p.e(0, -7.6, 7, 2.4)
    p.e(0, -27.4, 6.2, 8)
    p.limb(-5.8, -32, -7.6, -24, 2.6, 2.2)
    p.limb(-7.6, -24, -7, -18, 2.1, 1.9)
    p.limb(10, -1, 10, -8, 1.7, 1.1)
    p.limb(10, -8, 10, -33, 1, 0.8)
    p.limb(10, -33, 10, -39, 0.6, 0.4)
    p.limb(5.8, -32, 8.6, -26.4, 2.6, 2.2)
    p.limb(8.6, -26.4, 10, -23.6, 2, 1.8)
    for x in (-5, 5):
        p.e(x, -32.2, 3, 2.5)
    head(p, 0, -39.8)
    p.e(0, -43.2, 4.4, 2.9)
    p.e(0, -42, 6, 1.5)
    sculpt(c, p, ramp)
    face(c, p, ramp, 0, -39.8, hair=False)
    fold(c, p, -5, -40.8, 5, -40.8, ramp, 1)
    fold(c, p, -5.8, -21.4, 5.8, -21.4, ramp, 1)
    fold(c, p, 0.6, -33, 0.6, -6, ramp, 2)
    fold(c, p, -3.2, -34, 0.4, -28.6, ramp, 2)
    fold(c, p, 3.6, -34, 0.6, -28.6, ramp, 2)
    for y in (-27, -24):
        c.px(int(cx + 2.4 * s), int(by + y * s), ramp[6])
    for x in (-2.8, 2.8):
        fold(c, p, x - 2, -4.6, x + 2, -4.6, ramp, 2)
    return p


def worker(c, cx, by, s, ramp):
    """The heroic worker of a socialist square: a long stride, apron, the
    hammer swung up over his head."""
    p = Parts(cx, by, s)
    p.limb(2, -19, 5.6, -11, 3.2, 2.6)
    p.limb(5.6, -11, 9.6, -2.4, 2.5, 2)
    p.e(10.6, -1, 3, 1.5)
    p.limb(-2, -19, -5.4, -10.6, 3.3, 2.7)
    p.limb(-5.4, -10.6, -6, -1.8, 2.6, 2.2)
    p.e(-7, -1, 3.2, 1.5)
    p.e(-0.4, -17.6, 6, 5.6)
    p.e(-0.8, -27.6, 6.4, 8)
    p.limb(5.2, -32, 9.4, -26.4, 2.7, 2.3)
    p.limb(9.4, -26.4, 12, -21, 2.2, 2)
    p.limb(-9, -47, -6, -57, 0.9)
    p.limb(-9.6, -57.6, -2.6, -56, 2.1)
    p.limb(-9, -47, -10.4, -39, 2, 2.3)
    p.limb(-10.4, -39, -6.2, -32.6, 2.4, 2.8)
    for x in (-5.6, 4.2):
        p.e(x, -32.4, 3.1, 2.6)
    head(p, -0.6, -40.6)
    sculpt(c, p, ramp)
    face(c, p, ramp, -0.6, -40.6)
    fold(c, p, -4.4, -30, -3.8, -13, ramp, 2)
    fold(c, p, 3, -30, 3.6, -13, ramp, 2)
    fold(c, p, -4, -30, 3, -30, ramp, 2)
    fold(c, p, -5.6, -21.4, 4.8, -21.4, ramp, 1)
    fold(c, p, -4.4, -12.6, 4.2, -12.6, ramp, 1)
    return p


def pharaoh(c, cx, by, s, ramp):
    """A seated colossus: the king square on his block throne, hands flat on
    his knees, in the striped headcloth."""
    p = Parts(cx, by, s)
    _block(c, p, -10.6, -19, 10.6, 0, ramp)
    _block(c, p, -8, -3, 8, 0, ramp)
    sculpt(c, Parts(cx, by, s), ramp)
    q = Parts(cx, by, s)
    q.e(0, -27, 7.4, 8.6)
    q.e(0, -21, 6.2, 4)
    for x in (-5, 5):
        q.e(x, -32.4, 3.6, 3)
    _nemes(q, 0, -41.4, 4)
    q.e(0, -18, 7.8, 3)
    for x in (-4.1, 4.1):
        q.limb(x, -15.4, x, -3.4, 3.2, 2.7)
        q.e(x, -2.6, 3, 1.6)
        q.e(x, -16.6, 3.7, 3.4)
    for f in (-1, 1):
        q.limb(7.2 * f, -31.6, 8 * f, -24, 2.6, 2.3)
        q.limb(8 * f, -24, 5.4 * f, -19.6, 2.2, 1.9)
        q.e(4.6 * f, -19.4, 2.4, 1.5)
    q.e(0, -37, 2.6, 2.6)
    q.e(0, -41.4, 3.7, 4.2)
    q.limb(0, -37.6, 0, -34.4, 1.2, 0.9)
    sculpt(c, q, ramp)
    _nemes_cut(c, q, ramp, 0, -41.4, 4)
    fold(c, q, -4.6, -28.6, 4.6, -28.6, ramp, 3)
    fold(c, q, 0, -15, 0, -3, ramp, 1)
    fold(c, q, -2, -36.6, 2, -36.6, ramp, 1)
    p.list += q.list
    return p


def striding(c, cx, by, s, ramp):
    """An Egyptian standing figure: left foot forward, fists at the sides,
    kilt and headcloth, everything square to the front."""
    p = Parts(cx, by, s)
    p.limb(-2.8, -16, -3, -3, 3, 2.4)
    p.e(-3.2, -2.4, 2.8, 1.4)
    p.limb(2.8, -16, 3.2, -1.6, 3.1, 2.5)
    p.e(3.4, -1, 3.1, 1.6)
    p.e(0, -21.4, 5.2, 4)
    p.e(0, -28.6, 7, 6.4)
    for f in (-1, 1):
        p.e(5.4 * f, -32.4, 3.4, 2.8)
        p.limb(7.2 * f, -31.6, 7.8 * f, -17, 2.5, 2.1)
        p.e(7.8 * f, -15.4, 2.2, 2.3)
    p.limb(-5.4, -19.4, -6.6, -10.6, 2, 1.4)
    p.limb(5.4, -19.4, 6.6, -10.6, 2, 1.4)
    p.e(0, -15, 6.4, 5.4)
    _nemes(p, 0, -41.4, 3.9)
    p.e(0, -37, 2.6, 2.6)
    p.e(0, -41.4, 3.6, 4.1)
    sculpt(c, p, ramp)
    _nemes_cut(c, p, ramp, 0, -41.4, 3.9)
    fold(c, p, -4.6, -29.6, 4.6, -29.6, ramp, 3)
    fold(c, p, -5.4, -19.6, 5.4, -19.6, ramp, 1)
    fold(c, p, -5, -18.4, 1, -10.4, ramp, 2)
    fold(c, p, 5, -18.4, 1, -10.4, ramp, 2)
    fold(c, p, -2, -36.6, 2, -36.6, ramp, 1)
    return p


def sphinx(c, cx, by, s, ramp):
    """A lion lying with its paws out and a king's head in the headcloth."""
    p = Parts(cx, by, s)
    f = -1
    p.limb(-17 * f, -3, -21 * f, -9, 1.5, 1.2)
    p.limb(-21 * f, -9, -17 * f, -13.4, 1.2, 1.4)
    p.e(-3 * f, -7.6, 13.6, 6.2)
    p.e(-12 * f, -8.6, 7, 7.6)
    p.limb(-14 * f, -2.4, -5 * f, -2, 2.4, 2.2)
    p.e(7.6 * f, -11.6, 6.4, 8.4)
    p.limb(7 * f, -4, 20 * f, -2.4, 3, 2.3)
    p.e(20.6 * f, -2.2, 2.6, 2)
    p.limb(8 * f, -25, 3 * f, -13, 5, 4.4)
    p.e(8.6 * f, -25.6, 5.4, 4.4)
    p.e(10.6 * f, -17.4, 2.6, 3.6)
    p.e(10.8 * f, -21.6, 3.8, 4.4)
    p.limb(12.6 * f, -17.4, 12.8 * f, -14.6, 1.1, 0.9)
    sculpt(c, p, ramp)
    for i in range(5):
        fold(c, p, (4.4 - i * 0.4) * f, -26 + i * 2.6, (0.4 - i * 0.6) * f, -24 + i * 2.6, ramp, 2)
    fold(c, p, 7.4 * f, -24.6, 13.6 * f, -24.6, ramp, 2)
    c.px(int(cx + 12.4 * f * s), int(by - 22 * s), ramp[1])
    fold(c, p, 12 * f, -19, 14 * f, -19, ramp, 2)
    fold(c, p, -9 * f, -13, -7 * f, -4, ramp, 3)
    fold(c, p, 8 * f, -4.6, 19 * f, -3.6, ramp, 2)
    return p


def lamassu(c, cx, by, s, ramp):
    """The winged bull of an Assyrian gate, in profile: a bearded head in a
    tall horned cap, wings laid back over the flank."""
    p = Parts(cx, by, s)
    f = -1
    p.limb(-15 * f, -22, -17.6 * f, -8, 1.5, 1.2)
    p.e(-17.6 * f, -6, 1.8, 2.6)
    for x in (-13.4, -8.4, 5, 9.6):
        p.limb(x * f, -15, (x + 0.4) * f, -3, 2.9, 2.2)
        p.e((x + 0.8) * f, -1.4, 2.6, 1.5)
    p.e(-2 * f, -19, 14, 7.4)
    p.e(-11 * f, -19.6, 6, 7.6)
    p.e(8.4 * f, -21.4, 6.4, 9.4)
    p.limb(-16 * f, -36, 2 * f, -25, 2.4, 5)
    p.limb(-17.6 * f, -31.4, 2 * f, -24, 2.4, 4.6)
    p.limb(-16.6 * f, -27, 2 * f, -22.6, 2.2, 4)
    p.limb(9 * f, -29, 10 * f, -33, 4.6, 4)
    p.e(6.6 * f, -33.6, 4.4, 5)
    p.limb(12.8 * f, -33, 13.2 * f, -25, 3, 2.6)
    p.e(10.6 * f, -48.4, 3.6, 1.5)
    p.limb(10.6 * f, -47.6, 10.6 * f, -43.6, 3.6, 3.9)
    p.e(11.4 * f, -37.6, 4.5, 4.7)
    p.e(10.6 * f, -50.4, 1.4, 1.5)
    sculpt(c, p, ramp)
    for i in range(5):
        fold(c, p, (-2 - i * 3) * f, -30.4 - i * 1.3, (-3.4 - i * 3) * f, -20.6 - i * 0.9, ramp, 2)
    fold(c, p, 1 * f, -26.6, -15 * f, -33.6, ramp, 3)
    fold(c, p, 0, -23.6, -15 * f, -28.6, ramp, 3)
    for i in range(4):
        fold(c, p, 10 * f, -31 + i * 1.8, 16 * f, -31 + i * 1.8, ramp, 2)
    fold(c, p, 7 * f, -42, 14.6 * f, -42, ramp, 1)
    fold(c, p, 7 * f, -45.4, 14.4 * f, -45.4, ramp, 3)
    c.px(int(cx + 13.4 * f * s), int(by - 38.6 * s), ramp[1])
    for i in range(3):
        fold(c, p, (3.4 + i * 0.4) * f, -36 + i * 2.2, (7 + i * 0.3) * f, -36 + i * 2.2, ramp, 2)
    return p


KINDS = {
    'cuirass': (cuirass, 15, 50, 'classical'),
    'goddess': (goddess, 17, 61, 'classical'),
    'athlete': (athlete, 13, 46, 'classical'),
    'victory': (victory, 20, 59, 'column'),
    'saint': (saint, 13, 53, 'pillar'),
    'knight': (knight, 14, 58, 'classical'),
    'king': (king, 14, 50, 'classical'),
    'soldier': (soldier, 13, 47, 'classical'),
    'worker': (worker, 15, 60, 'classical'),
    'pharaoh': (pharaoh, 12, 47, 'stepped'),
    'striding': (striding, 11, 47, 'classical'),
    'sphinx': (sphinx, 24, 32, 'stepped'),
    'lamassu': (lamassu, 22, 54, 'stepped'),
}
