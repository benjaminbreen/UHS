"""Statue figures of the Americas, Africa, the Pacific and the steppe. Many
are carved blocks rather than modelled bodies, so Carved adds flat-faced and
drum-shaded blocks to the Parts idiom of statuary.py.

    PYTHONPATH=scripts .venv/bin/python -m art.props_b.statuary_world   # artifacts/statuary-world.png
"""
import math

from .statuary import Parts, sculpt, fold, head


class Carved(Parts):
    """Parts plus blocks filled straight onto the canvas, in the figure's own
    coordinates. y0 is the top (more negative) edge."""

    def __init__(self, c, cx, by, s, ramp):
        super().__init__(cx, by, s)
        self.c, self.ramp, self.high = c, ramp, by

    def X(self, x):
        return round(self.cx + x * self.s)

    def Y(self, y):
        return round(self.by + y * self.s)

    def top(self):
        return min([self.high] + [y - ry for _, y, _, ry in self.list])

    def _span(self, x0, y0, x1, y1):
        X0, Y0 = self.X(x0), self.Y(y0)
        return X0, Y0, max(X0, self.X(x1) - 1), max(Y0, self.Y(y1) - 1)

    def blk(self, x0, y0, x1, y1, k=4, drum=False):
        """Flat block: lit face, light top and left edge, dark right side.
        `drum` shades it across as an upright cylinder instead."""
        c, r = self.c, self.ramp
        X0, Y0, X1, Y1 = self._span(x0, y0, x1, y1)
        self.high = min(self.high, Y0)
        if drum:
            mid, half = (X0 + X1 + 1) / 2, (X1 - X0 + 1) / 2
            for x in range(X0, X1 + 1):
                u = (x + .5 - mid) / half
                lam = -0.5 * u + 0.64 * math.sqrt(max(0, 1 - u * u))
                t = 1 + int(max(0.0, min(0.999, (lam + 0.25) / 1.2)) * 6)
                c.vl(x, Y0, Y1, r[max(1, min(6, t + k - 4))])
            c.hl(X0 + 1, X1 - 1, Y0, r[min(6, k + 2)])
            return
        c.rect(X0, Y0, X1, Y1, r[k])
        c.hl(X0, X1, Y0, r[min(6, k + 2)])
        c.vl(X0, Y0 + 1, Y1, r[min(6, k + 1)])
        w = max(1, round((x1 - x0) * self.s * 0.16))
        c.rect(X1 - w + 1, Y0 + 1, X1, Y1, r[max(0, k - 2)])

    def rect(self, x0, y0, x1, y1, k, free=False):
        """A patch of one tone; only over existing stone unless `free`."""
        X0, Y0, X1, Y1 = self._span(x0, y0, x1, y1)
        for y in range(Y0, Y1 + 1):
            for x in range(X0, X1 + 1):
                if free or self.c.get(x, y)[3]:
                    self.c.px(x, y, self.ramp[k])
        if free:
            self.high = min(self.high, Y0)

    def cut(self, x0, y0, x1, y1, k=1):
        fold(self.c, self, x0, y0, x1, y1, self.ramp, k)

    def eyes(self, x, y, w=1.4, h=1.2, k=0):
        for sx in (-1, 1):
            self.rect(sx * x - w / 2, y - h / 2, sx * x + w / 2, y + h / 2, k)

    def sculpt(self):
        sculpt(self.c, self, self.ramp)


# ------------------------------------------------------------- Mesoamerica

def olmec_head(c, cx, by, s, ramp):
    """A colossal basalt head sitting on the ground in its helmet."""
    p = Carved(c, cx, by, s, ramp)
    for x in (-12.4, 12.4):
        p.limb(x, -19, x, -6, 2.8, 2.4)
    p.e(0, -5, 12, 5)
    p.e(0, -12.5, 13, 11.5)
    p.e(0, -21, 13.6, 7.6)
    p.e(-6, -8, 4.6, 4.2)
    p.e(6, -8, 4.6, 4.2)
    p.e(0, -10.4, 3.8, 2.8)
    p.e(0, -4.6, 5.6, 2.3)
    p.sculpt()
    p.blk(-10.5, -29.2, 10.5, -26.4, 5)
    p.rect(-12.6, -17.4, 12.6, -15.8, 2)
    p.cut(-12, -15.6, 12, -15.6, 5)
    p.cut(0, -26, 0, -18, 3)
    p.cut(-6, -26, -6, -18, 3)
    p.cut(6, -26, 6, -18, 3)
    p.eyes(5.6, -13.2, 3.6, 1.4, 1)
    p.cut(-6.6, -14.4, -3.6, -14.4, 6)
    p.cut(3.6, -14.4, 6.6, -14.4, 6)
    p.cut(-5, -4.6, 5, -4.6, 1)
    p.cut(-3, -8.2, 3, -8.2, 2)
    return p


def chacmool(c, cx, by, s, ramp):
    """Reclining on his back, propped on his elbows, knees up, head turned
    out to the viewer, an offering bowl on his stomach."""
    p = Carved(c, cx, by, s, ramp)
    p.blk(-21, -3.4, 21, 0, 4)
    g = -3
    p.limb(8, g - 12, 13, g - 2.4, 2.8, 2.4)
    p.limb(-1, g - 4, 8, g - 12, 3.4, 2.8)
    p.e(15.5, g - 1.6, 3.4, 1.7)
    p.e(-3, g - 4, 6, 4)
    p.limb(-12, g - 11.5, -3, g - 5.4, 5, 4.4)
    p.limb(10.5, g - 12.5, 16, g - 2.6, 3, 2.5)
    p.limb(1, g - 4.2, 10.5, g - 12.5, 3.6, 3)
    p.e(18.4, g - 1.6, 3.4, 1.7)
    p.limb(-12.5, g - 13, -10, g - 2.4, 2.6, 2.2)
    p.limb(-10, g - 2.4, -3, g - 8, 2.2, 1.9)
    p.e(-16, g - 13.5, 2.6, 2.4)
    p.e(-14, g - 18.4, 5.2, 5.4)
    p.sculpt()
    p.blk(-18.6, g - 24.4, -9.4, g - 21.8, 5)
    p.rect(-19.6, g - 20.4, -18, g - 15, 3)
    p.rect(-10, g - 20.4, -8.6, g - 15, 2)
    for x in (-16, -12):
        p.rect(x - .8, g - 19.4, x + .8, g - 18.2, 0)
    p.cut(-15.4, g - 15.4, -12.6, g - 15.4, 1)
    p.rect(-4.4, g - 12.4, 3.4, g - 11.2, 6, free=True)
    p.rect(-3.6, g - 11.2, 2.6, g - 8.6, 4, free=True)
    p.rect(-3.4, g - 12.4, 2.4, g - 11.6, 1)
    p.cut(-10, g - 9.4, -5, g - 6, 2)
    p.cut(12.6, g - 4, 19, g - 4, 2)
    return p


def atlantean(c, cx, by, s, ramp):
    """A warrior column of Tula: four drums, rigid, arms at the sides."""
    p = Carved(c, cx, by, s, ramp)
    p.blk(-5.6, -15, 5.6, 0, 4, drum=True)
    p.blk(-8.2, -34, 8.2, -15, 4, drum=True)
    p.blk(-6.2, -43, 6.2, -34, 4, drum=True)
    p.blk(-7.2, -46, 7.2, -43, 5, drum=True)
    p.blk(-6.6, -52, 6.6, -46, 4, drum=True)
    for x in (-4.4, -2.2, 0, 2.2, 4.4):
        p.cut(x, -51, x, -46.4, 2)
    p.rect(-6.4, -44.6, 6.4, -44, 2)
    p.rect(-8.6, -41.4, -6.2, -37, 5, free=True)
    p.rect(6.2, -41.4, 8.6, -37, 2, free=True)
    p.eyes(2.6, -39.6, 1.8, 1.3, 0)
    p.rect(-.8, -39.4, .8, -37, 6)
    p.rect(-2.2, -36.2, 2.2, -35.4, 1)
    p.cut(-8, -34, 8, -34, 1)
    # butterfly pectoral
    for grow, k in ((1, 1), (0, None)):
        for dx in range(0, 6):
            h = 0.9 + dx * 0.6 + grow
            for sx in (-1, 1):
                p.rect(sx * (dx + .5) - .6 - grow / 2, -27.6 - h, sx * (dx + .5) + .6 + grow / 2, -27.6 + h,
                       k or (6 if sx < 0 else 5))
    p.rect(-.7, -30, .7, -25.2, 1)
    # arms
    for sx in (-1, 1):
        p.cut(sx * 6.2, -32, sx * 6.2, -17, 1)
    p.rect(-8.2, -18.4, -6.4, -16.4, 6)
    p.rect(6.4, -18.4, 8.2, -16.4, 3)
    p.rect(-8.2, -15.6, 8.2, -14.4, 1)
    p.rect(-5.6, -14.4, 5.6, -12.6, 6)
    for dy in range(0, 5):
        p.rect(-3 + dy * .6, -12.6 + dy, 3 - dy * .6, -11.4 + dy, 5)
    p.cut(0, -7, 0, -1, 1)
    p.rect(-5.6, -3.6, 5.6, -2.8, 2)
    return p


def serpent_head(c, cx, by, s, ramp):
    """A feathered serpent's head thrust out of a wall block, jaws open."""
    p = Carved(c, cx, by, s, ramp)
    p.blk(9, -25, 20, 0, 3)
    for a in (-78, -50, -22, 6, 34, 62, 90, 116):
        r = math.radians(a)
        p.limb(4 + 4 * math.cos(r), -13 - 4 * math.sin(r), 4 + 12.6 * math.cos(r), -13 - 12.6 * math.sin(r), 2.5, 1.7)
    p.limb(2, -6.4, -13, -3, 4, 2.4)
    p.e(1, -13, 9.4, 9)
    p.limb(-2, -16, -16, -13.4, 5.4, 3.6)
    p.e(-18.4, -15.6, 2.6, 2.6)
    p.e(-4, -20, 4.4, 3)
    p.sculpt()
    p.rect(-5.4, -19.4, -2.8, -17.4, 0)
    p.rect(-5.4, -19.4, -4.4, -18.6, 6)
    p.rect(-17, -10.2, -2, -8.8, 0)
    for x in (-15.4, -11.4, -7.4):
        p.rect(x, -10.2, x + 1.4, -7, 6, free=True)
    for x in (-12, -8):
        p.rect(x, -6.6, x + 1.2, -5, 6, free=True)
    for a in (-78, -50, -22, 6, 34, 62, 90, 116):
        r = math.radians(a)
        p.cut(4 + 7 * math.cos(r), -13 - 7 * math.sin(r), 4 + 12 * math.cos(r), -13 - 12 * math.sin(r), 3)
    p.cut(-12, -17.4, -6, -18.6, 6)
    return p


# ------------------------------------------------------------------ Andes

def monolith(c, cx, by, s, ramp):
    """A Tiwanaku pillar-figure: squared, a cup in one hand and a sceptre in
    the other held flat against the chest."""
    p = Carved(c, cx, by, s, ramp)
    p.blk(-6.4, -15, 6.4, 0, 4)
    p.blk(-7.6, -33, 7.6, -15, 4)
    p.blk(-6.8, -44.6, 6.8, -33, 4)
    p.blk(-7.4, -49, 7.4, -44.6, 5)
    for x in (-5, -2.5, 0, 2.5, 5):
        p.cut(x, -48, x, -45.4, 2)
    p.cut(-7, -44.6, 6, -44.6, 1)
    # T of brow and nose, square eyes with tear bands
    p.rect(-5, -42.6, 5, -41.6, 6)
    p.rect(-1, -42.6, 1, -37.4, 6)
    for sx in (-1, 1):
        p.rect(sx * 3.2 - 1.4, -41.2, sx * 3.2 + 1.4, -39, 1)
        p.rect(sx * 3.2 - .6, -39, sx * 3.2 + .6, -36.4, 2)
    p.rect(-2.4, -35.8, 2.4, -34.8, 1)
    p.cut(-7, -33, 6, -33, 1)
    # arms bent across the chest
    for sx in (-1, 1):
        p.rect(sx * 6.6 - .9, -31, sx * 6.6 + .9, -22, 5 if sx < 0 else 3)
        p.rect(min(sx * 6.4, sx * 2), -23.6, max(sx * 6.4, sx * 2), -21.6, 5 if sx < 0 else 3)
    p.rect(-4.4, -29.6, -1.4, -24, 6)
    p.rect(-3.8, -29.6, -2, -28.8, 1)
    p.rect(-4, -24, -1.8, -23.2, 2)
    p.rect(1.8, -31.4, 3.4, -20, 6)
    p.rect(1, -32.4, 4.2, -30.6, 6)
    p.rect(3.4, -30.4, 4, -20, 1)
    p.rect(-7.6, -17.4, 7.6, -15, 2)
    for x in (-6, -3.6, -1.2, 1.2, 3.6):
        p.rect(x, -16.8, x + 1.2, -15.8, 5)
    p.cut(0, -14, 0, -1, 1)
    p.rect(-6.4, -2.6, 6.4, -1.8, 2)
    return p


# ---------------------------------------------------------------- Pacific

def moai(c, cx, by, s, ramp, topknot=False):
    """An Easter Island moai, head and torso to the waist."""
    p = Carved(c, cx, by, s, ramp)
    for x in (-8.4, 8.4):
        p.limb(x, -14, x * 0.92, -3, 2.4, 2.2)
    p.e(0, -8.6, 8.8, 9.2)
    p.e(0, -2.4, 8.4, 2.6)
    p.e(0, -18.4, 5.4, 3.4)
    for x in (-6.6, 6.6):
        p.limb(x, -37, x, -26, 1.5, 1.3)
    p.e(0, -30, 6.4, 11.4)
    p.e(0, -23.4, 5.6, 4)
    p.limb(-5.4, -36.4, 5.4, -36.4, 2.1, 2.1)
    p.limb(0, -35.4, 0, -28.6, 1.7, 2.5)
    p.e(0, -25, 3.4, 1.5)
    p.sculpt()
    p.blk(-6.6, -42.4, 6.6, -39.8, 5)
    p.rect(-5.6, -35, -1.6, -33, 1)
    p.rect(1.6, -35, 5.6, -33, 0)
    p.cut(-3, -24.8, 3, -24.8, 1)
    p.cut(-2.6, -27.6, 2.6, -27.6, 2)
    p.cut(-4, -9, -1, -6, 2)
    p.cut(4, -9, 1, -6, 2)
    p.cut(-5, -15, 5, -15, 3)
    if topknot:
        p.blk(-6.4, -49.4, 6.4, -42.4, 3, drum=True)
        p.blk(-3, -51.6, 3, -49.4, 3, drum=True)
    return p


def tiki(c, cx, by, s, ramp):
    """A Polynesian carved figure: a head as big as the body, knees bent,
    hands on the belly."""
    p = Carved(c, cx, by, s, ramp)
    for sx in (-1, 1):
        p.e(sx * 4.6, -1.3, 3.4, 1.5)
        p.limb(sx * 5.8, -5.6, sx * 4.4, -2, 2.8, 2.5)
        p.limb(sx * 3.4, -8, sx * 5.8, -5.6, 3.4, 3)
    p.e(0, -12, 7, 5.6)
    for sx in (-1, 1):
        p.limb(sx * 7, -15.6, sx * 8, -10.6, 2.3, 2)
        p.limb(sx * 8, -10.6, sx * 2.6, -9.6, 2, 1.8)
    p.e(0, -23.4, 9.4, 8)
    p.e(0, -30.6, 5, 2.4)
    p.limb(-6.4, -26.6, 6.4, -26.6, 1.9, 1.9)
    p.e(0, -22.4, 2.4, 2.2)
    p.sculpt()
    for sx in (-1, 1):
        p.rect(sx * 4.8 - 2.6, -25.4, sx * 4.8 + 2.6, -22.6, 1)
        p.rect(sx * 4.8 - 1.2, -24.6, sx * 4.8 + 1.2, -23.4, 5)
    p.rect(-5.6, -19.6, 5.6, -17.4, 0)
    p.rect(-4.4, -19, 4.4, -18.2, 6)
    p.rect(-1.2, -18.2, 1.2, -16.6, 5)
    p.cut(-6, -16, 6, -16, 1)
    p.rect(-.6, -11.6, .6, -10.6, 1)
    p.cut(0, -6, 0, -3, 1)
    return p


# ------------------------------------------------------- Northwest Coast

def _crest(p, y, mouth):
    """One crest face on the pole, 14 tall, its chin at y."""
    for sx in (-1, 1):
        p.e(sx * 3.6, y - 10.4, 3.2, 1.9)
        p.e(sx * 4.6, y - 13.6, 1.9, 1.7)
    if mouth == 'beak':
        p.limb(0, y - 9, 0, y - 3.6, 2.6, 1.6)
    else:
        p.e(0, y - 6.4, 2.8, 1.8)


def _crest_cuts(p, y, mouth):
    for sx in (-1, 1):
        p.rect(sx * 3.4 - 1.6, y - 9.2, sx * 3.4 + 1.6, y - 7.2, 0)
        p.rect(sx * 3.4 - .6, y - 8.8, sx * 3.4 + .6, y - 7.8, 6)
    if mouth == 'teeth':
        p.rect(-4.6, y - 4.4, 4.6, y - 1.8, 0)
        for x in (-3.8, -1.6, .6, 2.8):
            p.rect(x, y - 4, x + 1.2, y - 2.4, 6)
    elif mouth == 'wide':
        p.rect(-5, y - 4, 5, y - 2.8, 0)
        p.rect(-5.4, y - 5, -4.4, y - 3.6, 0)
        p.rect(4.4, y - 5, 5.4, y - 3.6, 0)
    p.cut(-6, y - .4, 6, y - .4, 1)


def totem(c, cx, by, s, ramp):
    """A cedar pole: three crests and a thunderbird with its wings out."""
    p = Carved(c, cx, by, s, ramp)
    p.blk(-6, -58, 6, 0, 4, drum=True)
    # wings behind the bird
    for sx in (-1, 1):
        for i, x in enumerate((7.4, 9.8, 12.2, 14.4)):
            p.rect(sx * x - 1.1, -53, sx * x + 1.1, -46.6 + i * 1.3, 3 + i % 2, free=True)
        p.limb(sx * 5, -55, sx * 15.4, -53.4, 2.7, 2.1)
    crests = ((0, 'teeth'), (-15, 'beak'), (-30, 'wide'))
    for y, m in crests:
        _crest(p, y, m)
    p.e(0, -52, 5, 5)
    p.e(0, -61.6, 4.8, 4.4)
    p.e(0, -65.4, 2.6, 1.8)
    p.limb(0, -61.4, 0, -55.4, 2.5, 1.3)
    p.sculpt()
    for y, m in crests:
        _crest_cuts(p, y, m)
    for sx in (-1, 1):
        p.rect(sx * 3 - .8, -63.2, sx * 3 + .8, -62, 0)
        p.cut(sx * 2.6, -60.4, sx * 1.6, -56, 1)
    p.cut(-3, -50, 0, -47.6, 2)
    p.cut(3, -50, 0, -47.6, 2)
    p.cut(-5.6, -45, 5.6, -45, 1)
    return p


# ------------------------------------------------------------------ steppe

def balbal(c, cx, by, s, ramp):
    """A Turkic stone man: a slab with a face, a cup held to the chest and
    the other hand on his sword belt."""
    p = Carved(c, cx, by, s, ramp)
    p.blk(-7, -12, 7, 0, 4, drum=True)
    p.e(0, -16, 7.6, 13)
    p.e(0, -25.4, 7.8, 4)
    p.e(0, -32.4, 5.4, 6)
    p.limb(-7, -24, -6.6, -17, 1.9, 1.7)
    p.limb(-6.6, -17, -1.4, -19.6, 1.7, 1.5)
    p.limb(7, -24, 6.6, -15, 1.9, 1.7)
    p.limb(6.6, -15, 3, -12.4, 1.7, 1.5)
    p.limb(0, -34, 0, -31, 1, 1.4)
    p.sculpt()
    p.cut(-3.4, -34.8, 3.4, -34.8, 2)
    p.eyes(2.2, -33.6, 1.4, 1.1, 0)
    p.rect(-3.4, -30.2, 3.4, -29.2, 1)
    p.rect(-4.2, -29.6, -3, -28.2, 1)
    p.rect(3, -29.6, 4.2, -28.2, 1)
    p.cut(-4, -26.6, 4, -26.6, 2)
    p.rect(-1.6, -23, 1.6, -22, 6, free=True)
    p.rect(-1.2, -22, 1.2, -19.6, 6)
    p.rect(-.5, -19.6, .5, -18.4, 5)
    p.rect(-7.6, -12.4, 7.6, -10.8, 1)
    p.rect(-1, -12.6, 1, -10.6, 5)
    for i in range(9):
        p.rect(2.4 - i * .7, -10.6 + i, 3.8 - i * .7, -9.4 + i, 2)
    return p


# ------------------------------------------------------------------ Africa

def benin_head(c, cx, by, s, ramp):
    """A Benin commemorative head: beaded collar to the lips, beaded cap, a
    carved tusk standing in the crown."""
    p = Carved(c, cx, by, s, ramp)
    p.limb(.4, -22, 1, -32, 2.3, 1.9)
    p.limb(1, -32, 3.6, -41, 1.9, .9)
    p.e(0, -1.8, 9, 2.2)
    p.blk(-6.4, -11.4, 6.4, -2, 4, drum=True)
    for sx in (-1, 1):
        p.limb(sx * 6.8, -19, sx * 7.2, -10, 1.4, 1.2)
    p.e(0, -14.4, 6, 6.2)
    p.e(0, -19.6, 6.4, 3.6)
    p.e(0, -13.4, 1.7, 1.6)
    p.sculpt()
    p.blk(-6.4, -11.4, 6.4, -2, 4, drum=True)
    for y in (-10, -8, -6, -4):
        p.cut(-6.4, y, 6, y, 2)
    p.cut(-6.4, -11.6, 6, -11.6, 1)
    p.rect(-6, -18.4, 6, -17.4, 2)
    for x in (-4.6, -2.2, .2, 2.6):
        p.rect(x, -21.4, x + 1, -20.4, 6)
        p.rect(x + 1.2, -19.8, x + 2.2, -18.8, 3)
    p.eyes(2.8, -15.4, 2, 1.3, 0)
    p.rect(-2, -12.2, 2, -11.4, 1)
    for y in (-28, -33, -37):
        p.cut(-1.6, y, 3.4, y - 1, 3)
    return p


def zimbabwe_bird(c, cx, by, s, ramp):
    """A soapstone bird on the top of its tall post."""
    p = Carved(c, cx, by, s, ramp)
    p.blk(-3, -37, 3, 0, 4, drum=True)
    p.blk(-4, -39.4, 4, -37, 5, drum=True)
    for y in (-33, -31):
        p.cut(-3, y, 0, y - 1.6, 2)
        p.cut(0, y - 1.6, 2.6, y, 2)
    p.e(1.4, -42, 3.4, 2.8)
    p.limb(1, -43, -.6, -50, 4, 3)
    p.e(-1.4, -53.6, 2.8, 2.6)
    p.limb(-2.4, -53.4, -5.4, -52.4, 1.6, 1)
    p.limb(3.2, -48, 4.4, -40.4, 1.8, 1.2)
    p.sculpt()
    p.rect(-2.2, -54.6, -1, -53.6, 0)
    p.cut(1.6, -49, 3, -42, 2)
    p.rect(-2.4, -40.4, -1.2, -39.4, 6)
    p.rect(.4, -40.4, 1.6, -39.4, 6)
    return p


def ancestor(c, cx, by, s, ramp):
    """A carved ancestor: long trunk, short bent legs, arms close in, a big
    head under a crest."""
    p = Carved(c, cx, by, s, ramp)
    for sx in (-1, 1):
        p.e(sx * 4.2, -1.3, 3.2, 1.5)
        p.limb(sx * 5, -7.4, sx * 3.8, -2, 2.6, 2.3)
        p.limb(sx * 3, -12, sx * 5, -7.4, 3, 2.7)
    p.limb(0, -29, 0, -13, 4.4, 4.2)
    p.e(0, -30.4, 6.6, 2.6)
    for sx in (-1, 1):
        p.limb(sx * 6.4, -29.6, sx * 6.8, -20.6, 1.9, 1.7)
        p.limb(sx * 6.8, -20.6, sx * 3.6, -15.4, 1.7, 1.5)
    p.e(0, -16.4, 1.6, 1.6)
    p.limb(0, -34, 0, -31, 2.4, 2.4)
    p.e(0, -39, 5.6, 6.2)
    p.limb(0, -47.4, 0, -43, 1.6, 2.2)
    p.limb(0, -40, 0, -36.4, 1, 1.5)
    p.sculpt()
    p.cut(-4, -40.6, -1, -40.6, 1)
    p.cut(1, -40.6, 4, -40.6, 1)
    p.eyes(2.6, -39.2, 2, 1, 0)
    p.rect(-1.6, -35, 1.6, -34.2, 1)
    for y in (-26, -23.6):
        p.cut(-3, y, 3, y, 3)
    p.cut(-4, -12.6, 4, -12.6, 2)
    return p


def terracotta_seated(c, cx, by, s, ramp):
    """Sitting on the ground with one knee drawn up, arms folded over it and
    the chin resting there, hung with beads."""
    p = Carved(c, cx, by, s, ramp)
    p.limb(7, -3, -3, -2.2, 2.8, 2.4)
    p.e(5, -5, 6.4, 4.8)
    p.limb(6, -8, 3.4, -18.4, 4.4, 3.8)
    p.limb(4, -6, -5, -14.4, 3.4, 3)
    p.limb(-5, -14.4, -6.4, -2.6, 2.9, 2.4)
    p.e(-8, -1.4, 3.2, 1.5)
    p.limb(6.6, -19.4, 2, -13.6, 2.3, 2)
    p.limb(2, -13.6, -6.4, -16, 2.1, 1.8)
    p.limb(3, -20, 0, -22, 2.4, 2.4)
    p.e(-2.4, -23, 5.2, 5.4)
    p.e(-.4, -28.6, 2.8, 2.2)
    p.e(3.4, -25.6, 1.6, 2.2)
    p.sculpt()
    p.rect(-5.6, -24.4, -4, -23.2, 0)
    p.rect(-2, -24.4, -.4, -23.2, 0)
    p.cut(-5.6, -25.6, -.4, -25.6, 2)
    p.cut(-4.4, -20.4, -1.6, -20.4, 1)
    p.cut(-1.4, -27, 2.4, -27, 2)
    for i, k in enumerate((6, 2, 6)):
        p.cut(1.4 + i, -18.6 + i * .2, 6.4 + i * .6, -16 - i * 1.4, k)
    for y in (-10.4, -9):
        p.cut(-7.6, y, -3.4, y - .6, 6 if y < -10 else 2)
    p.cut(-7.4, -4.4, -4.6, -4.4, 6)
    return p


# ------------------------------------------------------------------ eagle

def eagle(c, cx, by, s, ramp):
    """An eagle with its wings half open, head turned, for a column's top."""
    p = Carved(c, cx, by, s, ramp)
    p.e(0, -2.6, 3.6, 2.6)
    for sx in (-1, 1):
        p.limb(sx * 12, -19, sx * 17.4, -9.4, 3, 1.9)
        p.limb(sx * 10, -18, sx * 13.6, -6.6, 3, 2)
        p.limb(sx * 7.4, -16.4, sx * 9.6, -5.6, 3, 2.1)
        p.limb(sx * 5, -15, sx * 6, -6.4, 2.8, 2.2)
        p.limb(sx * 3.6, -15, sx * 12.4, -20, 3.3, 2.9)
    p.e(0, -10.4, 5.4, 8)
    for sx in (-1, 1):
        p.limb(sx * 2.4, -4, sx * 2.8, -1.4, 1.8, 1.6)
        p.e(sx * 3, -1, 2.4, 1.2)
    p.limb(0, -18, -.4, -21, 2.6, 2.6)
    p.e(-.6, -23, 3.3, 3.1)
    p.limb(-3, -23, -5.8, -21.6, 1.7, 1)
    p.sculpt()
    p.rect(-2.2, -24.2, -1, -23.2, 0)
    p.cut(-5.8, -21, -5.8, -20, 2)
    for sx in (-1, 1):
        p.cut(sx * 5, -13.6, sx * 12.6, -17.4, 2)
        for x0, x1 in ((6.4, 7.8), (8.8, 11.6), (11.4, 15.4)):
            p.cut(sx * x0, -14.6, sx * x1, -7.4, 2)
    for y in (-13, -10, -7):
        p.cut(-2.4, y, 0, y + 1.4, 3)
        p.cut(0, y + 1.4, 2.4, y, 3)
    return p


# kind: (draw, half width at scale 1, height at scale 1, default pedestal)
KINDS = {
    'olmec-head': (olmec_head, 16, 30, 'none'),
    'chacmool': (chacmool, 22, 29, 'stepped'),
    'atlantean': (atlantean, 10, 53, 'none'),
    'serpent-head': (serpent_head, 22, 27, 'none'),
    'monolith': (monolith, 9, 50, 'none'),
    'moai': (moai, 12, 43, 'stepped'),
    'moai-topknot': (lambda c, cx, by, s, r: moai(c, cx, by, s, r, True), 12, 52, 'stepped'),
    'tiki': (tiki, 11, 34, 'none'),
    'totem': (totem, 16, 69, 'none'),
    'balbal': (balbal, 9, 39, 'none'),
    'benin-head': (benin_head, 10, 43, 'classical'),
    'zimbabwe-bird': (zimbabwe_bird, 7, 57, 'none'),
    'ancestor': (ancestor, 9, 49, 'none'),
    'terracotta-seated': (terracotta_seated, 12, 32, 'stepped'),
    'eagle': (eagle, 20, 27, 'column'),
}


if __name__ == '__main__':
    from pathlib import Path
    from .statuary import statue
    from .plaza_families import sheet
    rows = [(k.upper(), [(f'{k} {m} {z}', (lambda v, k=k, m=m, z=z: statue(k, m, z, kinds=KINDS)), 0)
                         for z, m in ((0, 'sandstone'), (1, 'basalt'), (2, 'granite'), (1, 'bronze'), (2, 'wood'))])
            for k in KINDS]
    print(sheet(Path(__file__).resolve().parents[3] / 'artifacts/statuary-world.png', rows))
