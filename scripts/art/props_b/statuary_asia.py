"""Statue figures of South, East and South-East Asia, in statuary.py's parts.

    PYTHONPATH=scripts .venv/bin/python -m art.props_b.statuary_asia   # artifacts/statuary-asia.png
"""
import math

from .statuary import Parts, sculpt, fold, incise, line, head, face


def _at(p, x, y):
    return p.cx + x * p.s, p.by + y * p.s


def plate(c, p, x, y, rx, ry, ramp, k=3, rim=5, hole=0.0):
    """A flat disc or ring seen face on: a halo, a discus, an aureole."""
    cx, cy = _at(p, x, y)
    rx, ry = rx * p.s, ry * p.s
    for yy in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for xx in range(int(cx - rx) - 1, int(cx + rx) + 2):
            u, v = (xx + .5 - cx) / rx, (yy + .5 - cy) / ry
            d = math.sqrt(u * u + v * v)
            if d > 1 or d < hole:
                continue
            edge = d > 1 - 1.6 / max(rx, ry)
            c.px(xx, yy, ramp[(rim if u + v < 0.2 else rim - 2) if edge else k])


def ufold(c, p, x0, x1, y, drop, ramp, k=2):
    """A fold hanging in a U between two points at the same height."""
    s = p.s
    n = max(2, int(abs(x1 - x0) * s))
    pts = []
    for i in range(n + 1):
        t = i / n
        pts.append((p.cx + (x0 + (x1 - x0) * t) * s, p.by + (y + drop * (1 - (2 * t - 1) ** 2)) * s))
    incise(c, pts, ramp, k)


def dot(c, p, x, y, col):
    cx, cy = _at(p, x, y)
    c.px(int(cx), int(cy), col)


def ears(c, p, ramp, x=0, y=-40.4, r=3.9, drop=4.5):
    """The long lobes of a Buddha or a Jina."""
    s = p.s
    for side in (-1, 1):
        ex = int(p.cx + (x + side * (r + 0.4)) * s)
        c.rect(ex, int(p.by + (y - 0.6) * s), ex, int(p.by + (y - 0.6 + drop) * s), ramp[3 if side > 0 else 5])


# ------------------------------------------------------------------ figures

def buddha_standing(c, cx, by, s, ramp):
    """Right hand raised palm out, the robe falling in U folds from both
    shoulders, a plain disc behind the head."""
    p = Parts(cx, by, s)
    plate(c, p, 0, -41, 9.6, 9.6, ramp, 3, 5)
    for x in (-2.6, 2.6):
        p.e(x, -0.9, 2.4, 1.3)
    for x in (-3.4, 3.4):
        p.e(x, -14, 5.6, 10.6)
    p.e(0, -11.5, 7.2, 11)
    p.e(0, -3.4, 7.4, 2.4)
    p.e(0, -27, 6.8, 8.6)
    p.limb(-5.8, -32, -7.6, -22.5, 2.6, 2.2)
    p.e(-7.8, -20.6, 1.9, 1.9)
    p.limb(5.6, -32, 8.2, -26.5, 2.5, 2.1)
    p.limb(8.2, -26.5, 9, -31, 2, 1.8)
    p.e(9.2, -33.6, 2.1, 2.7)
    for x in (-4.8, 4.8):
        p.e(x, -32, 2.7, 2.3)
    head(p)
    p.e(0, -45.6, 2.2, 1.9)
    sculpt(c, p, ramp)
    face(c, p, ramp)
    ears(c, p, ramp)
    ufold(c, p, -3.4, 3.4, -34.6, 2.2, ramp, 2)
    for y, w, d in ((-30, 4.6, 3), (-25, 5.4, 3.4), (-19.5, 5.6, 3.6), (-14, 5.4, 3.6), (-8.5, 5, 3.4)):
        ufold(c, p, -w, w, y, d, ramp, 2)
    fold(c, p, -7, -3.2, 7, -3.2, ramp, 2)
    fold(c, p, 9.2, -34.6, 9.2, -32.6, ramp, 3)
    return p


def bodhisattva(c, cx, by, s, ramp):
    """Crowned and jewelled, hips swung to one side, a lotus bud raised in one
    hand and a flask hanging from the other, scarves falling from the arms."""
    p = Parts(cx, by, s)
    p.limb(-8.2, -22, -9, -12, 1.5, 1.3)
    p.limb(-9, -12, -6.4, -5, 1.3, 1)
    p.limb(8.8, -25, 7, -14, 1.5, 1.3)
    p.limb(7, -14, 5, -6, 1.3, 1)
    for x in (-3.6, 1.6):
        p.e(x, -0.9, 2.3, 1.3)
    p.e(-1.2, -11, 6, 10.6)
    p.e(-1, -4, 6.4, 2.4)
    p.e(-1.4, -18.5, 6.6, 5)
    p.e(0.4, -27.4, 5.4, 7.4)
    p.limb(-4.6, -32, -7.8, -25, 2.3, 1.9)
    p.limb(-7.8, -25, -8, -18.5, 1.8, 1.6)
    p.e(-8.2, -14.2, 2, 2.6)
    p.e(-8.2, -17.2, 0.9, 1.2)
    p.limb(6, -32, 9.4, -26.5, 2.3, 1.9)
    p.limb(9.4, -26.5, 9.4, -31.5, 1.8, 1.6)
    p.e(9.6, -33.4, 1.8, 1.8)
    p.e(8.4, -36.4, 1.7, 2)
    p.e(11, -36.4, 1.7, 2)
    p.e(9.7, -37.4, 1.6, 2.6)
    for x in (-4.2, 5.4):
        p.e(x, -32.2, 2.5, 2.2)
    head(p, 0.8, -40.2, 3.8)
    for x in (-2.6, 4.2):
        p.e(x, -44.2, 1.7, 2.2)
    p.limb(0.8, -44.4, 0.8, -49.6, 2.8, 1.3)
    sculpt(c, p, ramp)
    face(c, p, ramp, 0.8, -40.2, 3.8, hair=False)
    fold(c, p, -2.6, -43, 4.2, -43, ramp, 2)
    ufold(c, p, -2.8, 4, -34.6, 3, ramp, 1)
    dot(c, p, 0.6, -31, ramp[6])
    fold(c, p, 4.6, -33, -4, -22.6, ramp, 2)
    fold(c, p, -7.6, -21.6, 5, -21.6, ramp, 1)
    ufold(c, p, -7, 4.6, -17.4, 4, ramp, 2)
    ufold(c, p, -6.4, 4, -13.4, 3, ramp, 2)
    fold(c, p, -1.4, -12, -1.2, -2.6, ramp, 2)
    fold(c, p, -6.4, -4.4, 4.4, -4.4, ramp, 2)
    return p


def guardian(c, cx, by, s, ramp):
    """A temple gate's strongman: legs braced wide, chest bare, a vajra club
    swung up in one fist, the other clenched at the hip, hair in a topknot."""
    p = Parts(cx, by, s)
    p.limb(-6, -19, -12.5, -12, 2.4, 1.1)
    p.limb(5, -52, 14.6, -41.4, 1.3, 1.3)
    p.e(4.6, -52.4, 2.1, 2.1)
    p.e(15, -41, 2.1, 2.1)
    for side in (-1, 1):
        p.limb(3 * side, -17, 7.4 * side, -9.5, 3.9, 3.2)
        p.limb(7.4 * side, -9.5, 7.8 * side, -2, 3, 2.5)
        p.e(8.8 * side, -1, 3.2, 1.5)
    p.e(0, -17.4, 8, 5.6)
    p.e(0, -11.6, 4, 3.4)
    p.e(0, -26.6, 7.4, 7.6)
    for x in (-3.3, 3.3):
        p.e(x, -30.4, 3.9, 3.3)
    p.limb(-7.2, -33, -11.6, -27, 3.4, 2.9)
    p.limb(-11.6, -27, -9.4, -21, 2.7, 2.5)
    p.e(-9, -19.4, 2.5, 2.4)
    p.limb(7.2, -33.4, 11.8, -38.6, 3.4, 2.8)
    p.limb(11.8, -38.6, 10, -45, 2.7, 2.4)
    p.e(9.8, -46.8, 2.6, 2.5)
    for x in (-6.4, 6.4):
        p.e(x, -33, 3.4, 3)
    head(p, 0, -40.6, 4.2)
    p.e(0, -46.6, 2.3, 2.4)
    sculpt(c, p, ramp)
    face(c, p, ramp, 0, -40.6, 4.2)
    fold(c, p, -2.4, -41.4, -0.8, -40.8, ramp, 1)
    fold(c, p, 2.4, -41.4, 0.8, -40.8, ramp, 1)
    fold(c, p, -1.6, -37.6, 1.6, -37.6, ramp, 0)
    fold(c, p, 0, -33, 0, -22, ramp, 2)
    ufold(c, p, -6, -0.4, -29.6, 2.4, ramp, 2)
    ufold(c, p, 0.4, 6, -29.6, 2.4, ramp, 2)
    fold(c, p, -3.6, -25, 3.6, -25, ramp, 3)
    fold(c, p, -7.4, -21, 7.4, -21, ramp, 1)
    fold(c, p, -4, -20, -6.4, -13.4, ramp, 2)
    fold(c, p, 0, -20, 0, -9, ramp, 2)
    fold(c, p, 4, -20, 6.4, -13.4, ramp, 2)
    return p


def official(c, cx, by, s, ramp):
    """A civil official of a tomb's spirit way: robe to the ground, hands
    joined in wide sleeves holding his tablet, a cap with two long wings."""
    p = Parts(cx, by, s)
    p.limb(-3, -44, -11, -44, 0.9, 0.9)
    p.limb(3, -44, 11, -44, 0.9, 0.9)
    p.e(0, -11.5, 7.4, 11.4)
    p.e(0, -2.8, 8.4, 2.8)
    p.e(0, -20, 7.2, 7)
    p.e(0, -28, 7.2, 7.6)
    for side in (-1, 1):
        p.e(5 * side, -32.2, 3.2, 2.5)
        p.limb(6.6 * side, -31, 7.4 * side, -24, 2.8, 3.2)
    p.e(0, -21, 8.4, 4.6)
    p.e(0, -16.6, 5.4, 4.4)
    p.e(0, -25.4, 3, 2)
    p.e(0, -34.4, 3.6, 2.6)
    p.e(0, -38.8, 4, 4.4)
    p.e(0, -42.8, 4.3, 2.4)
    p.e(0, -45.4, 3.1, 2.7)
    sculpt(c, p, ramp)
    fold(c, p, -3.8, -41.6, 3.8, -41.6, ramp, 1)
    x0, y0 = _at(p, -1, -34)
    x1, y1 = _at(p, 0.6, -26)
    xr = max(int(x0) + 1, int(x1))
    c.rect(int(x0) - 1, int(y0), xr + 1, int(y1), ramp[1])
    c.rect(int(x0), int(y0), xr, int(y1), ramp[6])
    fold(c, p, 0, -24, 0, -13, ramp, 1)
    ufold(c, p, -7.4, -0.6, -21, 3.4, ramp, 2)
    ufold(c, p, 0.6, 7.4, -21, 3.4, ramp, 2)
    ufold(c, p, -5, 5, -15.4, 3, ramp, 1)
    fold(c, p, 0, -11.6, 0, -1.4, ramp, 2)
    fold(c, p, -3.6, -11, -4.6, -1.6, ramp, 2)
    fold(c, p, 3.6, -11, 4.6, -1.6, ramp, 2)
    return p


def foo_lion(c, cx, by, s, ramp, facing=-1):
    """A Chinese guardian lion: a mane of tight curls, jaws open, a collar
    with its bell, one forepaw on a ball."""
    p = Parts(cx, by, s)
    f = facing
    p.e(-12 * f, -13, 2.8, 4.4)
    p.e(-11.4 * f, -17.6, 2.2, 2.6)
    p.e(-5 * f, -7.4, 8.4, 7.4)
    p.e(-7.4 * f, -1.7, 4.8, 1.9)
    p.e(2.6 * f, -12.6, 6.6, 8.6)
    p.limb(0.4 * f, -10, 0.6 * f, -1.6, 2.6, 2.2)
    p.e(1.4 * f, -1.2, 3, 1.4)
    p.e(9.2 * f, -3.6, 3.7, 3.7)
    p.limb(4.6 * f, -12, 8.6 * f, -8.4, 2.7, 2.3)
    p.e(9.2 * f, -7.6, 2.8, 1.7)
    for a in range(-150, 100, 31):
        r = math.radians(a)
        p.e((1.6 - 7.4 * math.cos(r) * 0.9) * f + 0, -21.4 + 7 * math.sin(r) * -1, 2.5, 2.5)
    p.e(2.4 * f, -21, 7, 6.6)
    p.e(4.6 * f, -23.4, 5.4, 4.6)
    p.e(8.6 * f, -22.4, 3.3, 2.6)
    p.e(8 * f, -17.6, 2.7, 1.5)
    for a in (-0.4, 2.4, 5.2):
        p.e(a * f, -27.4, 1.9, 1.9)
    sculpt(c, p, ramp)
    x0, y0 = _at(p, 6.2 * f, -20)
    x1, y1 = _at(p, 10.4 * f, -19)
    c.rect(int(min(x0, x1)), int(y0), int(max(x0, x1)), max(int(y0), int(y1)), ramp[0])
    dot(c, p, 5.6 * f, -24, ramp[0])
    dot(c, p, 10 * f, -23.4, ramp[1])
    ufold(c, p, -1.4 * f, 6.6 * f, -15.4, 2, ramp, 1)
    dot(c, p, 3 * f, -12.4, ramp[6])
    dot(c, p, 3 * f, -11.6, ramp[6])
    for a in range(4):
        ufold(c, p, (-6 + a * 2.4) * f, (-4 + a * 2.4) * f, -25 + abs(a - 1.5) * 1.2, 1.2, ramp, 2)
    fold(c, p, 7.6 * f, -5.6, 10.8 * f, -2.4, ramp, 3)
    fold(c, p, -9 * f, -8, -6 * f, -2.6, ramp, 2)
    return p


def haechi(c, cx, by, s, ramp, facing=-1):
    """A haechi or komainu: thick-set, bolt upright on both forelegs, one
    horn, a scaled hide and a flame of a tail."""
    p = Parts(cx, by, s)
    f = facing
    p.e(-11 * f, -10, 2.6, 3.6)
    p.e(-11.8 * f, -15, 2, 2.8)
    p.e(-11 * f, -19, 1.4, 2)
    p.e(-4 * f, -8, 8.6, 8)
    p.e(-6.4 * f, -1.8, 5, 2)
    p.e(3 * f, -13, 7.4, 9)
    p.limb(0.4 * f, -11, 0.4 * f, -1.8, 3, 2.7)
    p.e(1.2 * f, -1.3, 3.3, 1.5)
    p.limb(6 * f, -11, 6.2 * f, -1.8, 3.1, 2.8)
    p.e(7 * f, -1.3, 3.4, 1.5)
    p.e(-2.6 * f, -24.6, 2.2, 2.6)
    p.e(2.6 * f, -22.4, 8.4, 7.2)
    p.e(4.6 * f, -25.8, 5.6, 3.6)
    p.e(7.6 * f, -21.4, 4.2, 3.8)
    p.limb(3 * f, -29, 2 * f, -33.4, 2, 0.9)
    sculpt(c, p, ramp)
    dot(c, p, 6 * f, -25, ramp[0])
    fold(c, p, 4.6 * f, -26.6, 7.6 * f, -26, ramp, 2)
    fold(c, p, 5 * f, -20, 11 * f, -20, ramp, 0)
    for i in (6.6, 8.6, 10.2):
        dot(c, p, i * f, -19.2, ramp[6])
    dot(c, p, 10.6 * f, -23, ramp[1])
    ufold(c, p, -2.4 * f, 8 * f, -17.2, 1.6, ramp, 1)
    for row, y in enumerate((-13, -10, -7, -4)):
        for i in range(5):
            x = -9.5 + i * 2.6 + (row % 2) * 1.3
            ufold(c, p, x * f, (x + 1.6) * f, y, 0.9, ramp, 2)
    fold(c, p, 3.2 * f, -14, 3.2 * f, -2.6, ramp, 2)
    return p


def nandi(c, cx, by, s, ramp, facing=-1):
    """Shiva's bull lying with his legs folded under him, hump high, head
    lifted, a garland of bells round the neck and a cloth over the back."""
    p = Parts(cx, by, s)
    f = facing
    p.limb(-17.4 * f, -11, -18.6 * f, -3.6, 1.2, 1.5)
    p.e(-11 * f, -8.6, 7, 7.4)
    p.e(-1 * f, -8.4, 13.4, 7.4)
    p.e(3.6 * f, -15.6, 5.6, 4.6)
    p.limb(8 * f, -10.5, 12.6 * f, -17, 5.6, 4.2)
    p.e(-9.4 * f, -4, 6.4, 3.8)
    p.limb(-7 * f, -1.7, -1 * f, -1.7, 1.9, 1.6)
    p.limb(6 * f, -3.6, 12.6 * f, -2.4, 2.6, 2.2)
    p.limb(12.6 * f, -2.4, 8 * f, -1.5, 1.8, 1.5)
    p.limb(12.4 * f, -22, 11 * f, -26, 1.3, 0.8)
    p.e(10.4 * f, -19.6, 2.4, 1.3)
    p.e(14.6 * f, -19, 4.4, 3.8)
    p.e(17.6 * f, -16.2, 3, 2.6)
    sculpt(c, p, ramp)
    dot(c, p, 15.4 * f, -20, ramp[0])
    dot(c, p, 19 * f, -16, ramp[1])
    fold(c, p, 16 * f, -14.6, 19.4 * f, -14.6, ramp, 1)
    fold(c, p, 14 * f, -22.4, 17 * f, -21.4, ramp, 5)
    for x0, y0, x1, y1 in ((9, -20.4, 7, -8), (12, -15.4, 10.4, -7.4)):
        fold(c, p, x0 * f, y0, x1 * f, y1, ramp, 1)
    for x, y in ((8.4, -13.6), (7.6, -9.6), (11.2, -11), (10.6, -7.6)):
        dot(c, p, (x + 0.9) * f, y, ramp[6])
    fold(c, p, -6 * f, -15.6, -8 * f, -6.6, ramp, 1)
    fold(c, p, 1 * f, -16, 0.4 * f, -6.6, ramp, 1)
    fold(c, p, -8 * f, -6.6, 0.4 * f, -6.6, ramp, 1)
    fold(c, p, -7 * f, -8.2, -0.4 * f, -8.2, ramp, 6)
    fold(c, p, -14 * f, -5.6, -5 * f, -2.4, ramp, 2)
    return p


def vishnu(c, cx, by, s, ramp):
    """Four arms and a tall crown, standing dead straight: discus and conch
    held up at the shoulders, one lower hand on a mace, the other open."""
    p = Parts(cx, by, s)
    p.limb(-5.4, -32.6, -10.4, -34, 2, 1.7)
    p.limb(-10.4, -34, -11, -40, 1.7, 1.5)
    p.limb(5.4, -32.6, 10.4, -34, 2, 1.7)
    p.limb(10.4, -34, 11, -40, 1.7, 1.5)
    p.e(-11.2, -44, 2.2, 3)
    p.e(-11.2, -47.4, 1, 1.4)
    p.limb(10.6, -18, 10.6, -1.6, 1.1, 1.3)
    p.e(10.6, -3.4, 2.5, 3)
    for x in (-2.8, 2.8):
        p.limb(x, -19, x, -2.4, 3.1, 2.5)
        p.e(x, -0.9, 2.5, 1.3)
    p.e(0, -18.4, 6.4, 4.8)
    p.e(0, -27.6, 5.8, 7.6)
    p.limb(-5.4, -31.6, -8.4, -24.6, 2.3, 1.9)
    p.limb(-8.4, -24.6, -9, -18.6, 1.8, 1.6)
    p.e(-9.2, -16.6, 1.8, 2.2)
    p.limb(5.4, -31.6, 8.4, -24.6, 2.3, 1.9)
    p.limb(8.4, -24.6, 10.2, -19.4, 1.8, 1.6)
    for x in (-4.6, 4.6):
        p.e(x, -32.2, 2.6, 2.3)
    head(p, 0, -40.2, 3.8)
    p.e(0, -43.8, 4.2, 1.7)
    p.limb(0, -45, 0, -51, 3.4, 2.4)
    p.e(0, -53.6, 1.3, 1.5)
    sculpt(c, p, ramp)
    plate(c, p, 11.2, -44.2, 3.4, 3.4, ramp, 3, 6)
    dot(c, p, 11.2, -44.2, ramp[1])
    face(c, p, ramp, 0, -40.2, 3.8, hair=False)
    ears(c, p, ramp, 0, -40.2, 3.8, 3.6)
    fold(c, p, -3.6, -44.4, 3.6, -44.4, ramp, 2)
    fold(c, p, -2.6, -48, 2.6, -48, ramp, 2)
    ufold(c, p, -3.4, 3.4, -34.4, 2.6, ramp, 1)
    ufold(c, p, -4.4, 4.4, -33.4, 6.4, ramp, 2)
    fold(c, p, 3.6, -33, -3.6, -22.4, ramp, 2)
    fold(c, p, -6, -21.4, 6, -21.4, ramp, 1)
    dot(c, p, 0, -21.4, ramp[6])
    ufold(c, p, -5.6, 5.6, -19, 4.6, ramp, 2)
    ufold(c, p, -5, 5, -15, 4, ramp, 2)
    fold(c, p, 0, -19.6, 0, -2, ramp, 1)
    fold(c, p, -5, -6, 5, -6, ramp, 2)
    return p


def nataraja(c, cx, by, s, ramp):
    """Shiva dancing in a ring of flames: the standing leg bent on the dwarf,
    the other lifted across the body, drum and fire in the upper hands, the
    hair flying out level on both sides."""
    p = Parts(cx, by, s)
    for i in range(22):
        a = math.radians(-70 + i * 320 / 21 - 90)
        x, y = 21.4 * math.cos(a), -24.4 + 22 * math.sin(a)
        p.limb(x * 0.97, -24.4 + (y + 24.4) * 0.97, x * 1.09, -24.4 + (y + 24.4) * 1.09, 1.5, 0.8)
    plate(c, p, 0, -24.4, 21.4, 22, ramp, 3, 5, hole=0.86)
    sculpt(c, p, ramp)
    p = Parts(cx, by, s)
    for side in (-1, 1):
        for dy in (-1.6, 0.6, 2.8):
            p.limb(3.4 * side, -39.4, 12.6 * side, -39.6 + dy * 1.5, 0.9, 0.8)
    p.e(-0.6, -2, 8.4, 2.3)
    p.e(-8.6, -2.6, 2.3, 2.1)
    p.limb(3.6, -19, 9.6, -16.6, 1.3, 0.9)
    p.limb(9.6, -16.6, 13.4, -19, 1, 0.8)
    p.limb(-5, -32.6, -10.6, -35, 2, 1.7)
    p.limb(-10.6, -35, -13.6, -40.4, 1.7, 1.5)
    p.limb(5, -32.6, 10.6, -35, 2, 1.7)
    p.limb(10.6, -35, 13.6, -40.4, 1.7, 1.5)
    p.e(-14.2, -43, 1.5, 1.5)
    p.e(-14.2, -45.4, 1.5, 1.5)
    p.e(14.2, -42.6, 1.6, 1.6)
    p.limb(14.2, -43.6, 14.6, -47.6, 1.5, 0.8)
    p.limb(1.2, -18.6, 3.4, -11, 2.8, 2.4)
    p.limb(3.4, -11, 0.6, -4, 2.3, 1.9)
    p.e(-0.6, -3.6, 2.6, 1.3)
    p.e(0.6, -19, 5.6, 4.2)
    p.e(0.6, -27.6, 5.2, 7.2)
    p.limb(-1, -18.6, -8.4, -15.4, 2.8, 2.4)
    p.limb(-8.4, -15.4, -11.6, -9.6, 2.2, 1.8)
    p.e(-13, -8.6, 2.4, 1.3)
    p.limb(-4.6, -31.6, -7.6, -27, 2.2, 1.9)
    p.limb(-7.6, -27, -7.2, -31, 1.8, 1.6)
    p.e(-7.2, -33, 1.8, 2.2)
    p.limb(5, -31.6, 0, -27, 2.2, 1.9)
    p.limb(0, -27, -6, -22.4, 1.8, 1.5)
    p.e(-7, -21.2, 1.6, 1.9)
    for x in (-4, 5):
        p.e(x, -32.2, 2.5, 2.2)
    head(p, 0.6, -40, 3.7)
    p.limb(0.6, -43.6, 0.6, -47.6, 2.6, 1.6)
    sculpt(c, p, ramp)
    face(c, p, ramp, 0.6, -40, 3.7, hair=False)
    fold(c, p, -2.6, -42.6, 3.8, -42.6, ramp, 2)
    ufold(c, p, -2.6, 3.6, -34.4, 2.4, ramp, 1)
    fold(c, p, -4.6, -21.6, 5.6, -21.6, ramp, 1)
    fold(c, p, -3, -3, 3, -1.6, ramp, 2)
    return p


def tirthankara(c, cx, by, s, ramp):
    """A Jina standing in kayotsarga: nude, feet together, arms hanging clear
    of the body to the knees, a creeper climbing the legs and arms."""
    p = Parts(cx, by, s)
    for x in (-2.9, 2.9):
        p.limb(x, -19, x, -2.4, 3.2, 2.5)
        p.e(x * 1.1, -0.9, 2.7, 1.3)
    p.e(0, -19, 6, 4.6)
    p.e(0, -24, 4.8, 4)
    p.e(0, -29.4, 6, 5.6)
    for side in (-1, 1):
        p.limb(7.8 * side, -32, 8.2 * side, -22, 2.3, 1.9)
        p.limb(8.2 * side, -22, 8 * side, -14, 1.9, 1.7)
        p.e(7.9 * side, -12.4, 1.8, 2.4)
        p.e(5.6 * side, -32.4, 2.8, 2.4)
    head(p, 0, -40.4, 4)
    sculpt(c, p, ramp)
    face(c, p, ramp, 0, -40.4, 4)
    ears(c, p, ramp, 0, -40.4, 4, 5)
    dot(c, p, 0, -23.4, ramp[1])
    fold(c, p, -3.6, -18.6, 0, -15.6, ramp, 2)
    fold(c, p, 3.6, -18.6, 0, -15.6, ramp, 2)
    fold(c, p, 0, -15.6, 0, -1.6, ramp, 1)
    for side in (-1, 1):
        for y in (-12, -6):
            fold(c, p, 1.2 * side, y, 5.4 * side, y + 2.6, ramp, 2)
        fold(c, p, 6.4 * side, -23, 10 * side, -20.6, ramp, 2)
    return p


def elephant(c, cx, by, s, ramp, facing=-1):
    """A standing elephant in profile, trunk curled under, a fringed cloth
    over the back and a cushion on top of it."""
    p = Parts(cx, by, s)
    f = facing
    p.limb(-15.6 * f, -19, -17 * f, -8, 1.1, 0.9)
    p.limb(7.6 * f, -13, 8.2 * f, -2, 3, 2.8)
    p.limb(-6.6 * f, -13, -6 * f, -2, 3, 2.8)
    p.e(0, -27.6, 6, 2.6)
    p.e(-8.6 * f, -17, 7.4, 9.4)
    p.e(1 * f, -18, 12.6, 9.4)
    p.limb(11.6 * f, -12, 12 * f, -2, 3.5, 3.2)
    p.e(12.4 * f, -1.2, 3.6, 1.5)
    p.limb(-11 * f, -12, -11 * f, -2, 3.6, 3.2)
    p.e(-10.6 * f, -1.2, 3.7, 1.5)
    p.e(14 * f, -21.4, 6.4, 7.6)
    p.e(15 * f, -26, 4.6, 4)
    p.limb(18.4 * f, -19, 20.4 * f, -10, 2.9, 2.1)
    p.limb(20.4 * f, -10, 18.4 * f, -6.4, 2, 1.6)
    p.limb(18.4 * f, -6.4, 16.6 * f, -8.6, 1.5, 1.3)
    p.limb(15.6 * f, -15.6, 20 * f, -13.6, 1.1, 0.8)
    p.e(9.4 * f, -19.6, 4.2, 6)
    sculpt(c, p, ramp)
    dot(c, p, 16.6 * f, -22.4, ramp[0])
    for a in range(-80, 120, 20):
        r = math.radians(a)
        dot(c, p, (9.4 - 4 * math.cos(r)) * f, -19.6 + 5.6 * math.sin(r), ramp[2])
    x0, y0 = _at(p, -7 * f, -26)
    x1, y1 = _at(p, 5 * f, -13)
    xa, xb = int(min(x0, x1)), int(max(x0, x1))
    for yy in range(int(y0), int(y1) + 1):
        for xx in range(xa, xb + 1):
            if not c.get(xx, yy)[3]:
                continue
            edge = xx in (xa, xb) or yy >= int(y1) - 1
            c.px(xx, yy, ramp[5 if edge else 2] if yy < int(y1) else ramp[1 if (xx - xa) % 2 else 5])
    xm, ym = _at(p, -1 * f, -19.6)
    for d in range(-2, 3):
        c.px(int(xm) + d, int(ym) - (2 - abs(d)), ramp[6])
        c.px(int(xm) + d, int(ym) + (2 - abs(d)), ramp[6])
    fold(c, p, 13 * f, -28.6, 18.6 * f, -24, ramp, 5)
    for y in (-15, -12, -9):
        fold(c, p, 18.4 * f, y, 21.6 * f, y + 0.6, ramp, 2)
    for x in (12 * f, -11 * f):
        fold(c, p, x - 2, -1.2, x + 2, -1.2, ramp, 5)
    return p


def naga_buddha(c, cx, by, s, ramp):
    """A Buddha in meditation on the coils of the naga king, the seven heads
    of its hood spread behind him."""
    p = Parts(cx, by, s)
    for i in range(7):
        a = math.radians(-66 + i * 22)
        r = 2.7 if i == 3 else 2.3
        p.e(13.6 * math.sin(a), -37.6 - 13.4 * math.cos(a), r, r * 1.25)
    p.e(0, -36, 13.4, 13.6)
    p.e(0, -22, 9, 8)
    for i, (y, w) in enumerate(((-2.6, 14), (-6.8, 12.8), (-11, 11.6))):
        p.e(0, y, w, 2.9)
    lift = -12.4
    p.e(0, lift - 4.2, 12.4, 4.4)
    p.e(-7.6, lift - 5.2, 5.2, 3.8)
    p.e(7.6, lift - 5.2, 5.2, 3.8)
    p.e(0, lift - 15, 6.8, 9)
    p.limb(-6, lift - 20.4, -7.6, lift - 11.6, 2.4, 2.1)
    p.limb(6, lift - 20.4, 7.6, lift - 11.6, 2.4, 2.1)
    p.limb(-7.6, lift - 11.6, -1.8, lift - 7.2, 2.1, 1.8)
    p.limb(7.6, lift - 11.6, 1.8, lift - 7.2, 2.1, 1.8)
    for x in (-5, 5):
        p.e(x, lift - 20.8, 2.5, 2.2)
    head(p, 0, lift - 27.6, 3.9)
    p.limb(0, lift - 31.6, 0, lift - 35, 2, 0.9)
    sculpt(c, p, ramp)
    for i in range(7):
        a = math.radians(-66 + i * 22)
        hx, hy = 13.6 * math.sin(a), -37.6 - 13.4 * math.cos(a)
        dot(c, p, hx, hy - 0.4, ramp[0])
        fold(c, p, hx * 0.84, -37.6 + (hy + 37.6) * 0.84, hx * 0.42, -37.6 + (hy + 37.6) * 0.42, ramp, 3)
    for i in range(6):
        a = math.radians(-55 + i * 22)
        fold(c, p, 12.6 * math.sin(a), -37.6 - 12.4 * math.cos(a), 10 * math.sin(a), -37.6 - 9.8 * math.cos(a), ramp, 1)
    face(c, p, ramp, 0, lift - 27.6, 3.9)
    ears(c, p, ramp, 0, lift - 27.6, 3.9, 4)
    fold(c, p, 4.6, lift - 22, -4.6, lift - 11, ramp, 2)
    fold(c, p, -10.6, lift - 2.6, 10.6, lift - 2.6, ramp, 2)
    for y in (-4.8, -9):
        fold(c, p, -12, y, 12, y, ramp, 1)
    for row, y in enumerate((-2.4, -6.6, -10.8)):
        for x in range(-10 + row, 11, 4):
            dot(c, p, x, y, ramp[2])
    return p


def jizo(c, cx, by, s, ramp):
    """A wayside Jizo: a small monk, shaven head, a plain robe, a ringed
    staff in one hand and a jewel in the other."""
    p = Parts(cx, by, s)
    p.limb(7, -1, 7, -29, 0.6, 0.6)
    p.e(7, -30.6, 1.9, 2.1)
    p.e(0, -8.6, 5.6, 8.6)
    p.e(0, -2.4, 6.2, 2.4)
    p.e(0, -16.4, 6, 5)
    p.limb(-4.6, -18, -4.4, -13.6, 2.2, 2)
    p.limb(-4.4, -13.6, -1.4, -13, 1.9, 1.6)
    p.e(-0.6, -14, 1.7, 1.6)
    p.limb(4.6, -18, 6.4, -14, 2.2, 1.9)
    p.e(6.6, -13.6, 1.8, 1.7)
    p.e(0, -20.4, 3.2, 2)
    p.e(0, -25.4, 4.7, 4.8)
    sculpt(c, p, ramp)
    xr, yr = _at(p, 7, -30.6)
    c.px(int(xr), int(yr), ramp[1])
    fold(c, p, -2.4, -20.6, 2.6, -20.6, ramp, 1)
    fold(c, p, -2.2, -25.2, -1, -25.2, ramp, 2)
    fold(c, p, 1, -25.2, 2.2, -25.2, ramp, 2)
    ufold(c, p, -3.6, 3.6, -20, 3.4, ramp, 2)
    fold(c, p, -1.6, -11, -2.4, -1.4, ramp, 2)
    fold(c, p, 2, -11, 2.6, -1.4, ramp, 2)
    fold(c, p, -5, -2.6, 5, -2.6, ramp, 3)
    return p


# kind: (draw, half width at scale 1, height at scale 1, default pedestal)
KINDS = {
    'buddha-standing': (buddha_standing, 12, 52, 'lotus'),
    'bodhisattva': (bodhisattva, 13, 52, 'lotus'),
    'guardian': (guardian, 18, 56, 'stepped'),
    'official': (official, 13, 49, 'stepped'),
    'foo-lion': (foo_lion, 16, 31, 'stepped'),
    'haechi': (haechi, 15, 36, 'stepped'),
    'nandi': (nandi, 22, 28, 'stepped'),
    'vishnu': (vishnu, 16, 56, 'lotus'),
    'nataraja': (nataraja, 25, 50, 'lotus'),
    'tirthankara': (tirthankara, 12, 46, 'stepped'),
    'elephant': (elephant, 24, 32, 'stepped'),
    'naga-buddha': (naga_buddha, 17, 54, 'stepped'),
    'jizo': (jizo, 10, 33, 'none'),
}


if __name__ == '__main__':
    from pathlib import Path
    from .statuary import statue
    from .plaza_families import sheet
    rows = []
    for kind in KINDS:
        cells = [(f'{kind} {m} {size}', (lambda v, k=kind, m=m, z=size: statue(k, m, z, kinds=KINDS)), 0)
                 for size, m in ((0, 'sandstone'), (1, 'bronze'), (2, 'granite'), (1, 'gilt'), (2, 'redstone'))]
        rows.append((kind.upper(), cells))
    print(sheet(Path(__file__).resolve().parents[3] / 'artifacts/statuary-asia.png', rows))
