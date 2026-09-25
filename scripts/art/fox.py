"""The red fox, built into set C's atlas beside set D.

Set D draws an animal as ellipses on a level rig. A fox bends: it arches into
a mousing leap, dives nose first, curls into a ring to sleep. So the body here
is tubes along a spine that can point any way, and every frame is a keyed
pose -- where the hips, shoulders, head and each paw are -- with the tail and
ears following a beat behind the body. Lower legs are drawn after the outline,
one pixel wide and black, as a fox's stockings are.
"""
import math
from art.fauna_b import Canvas as _BCanvas, line, shade, walk_foot
from art.fauna_d import ik, _coat, _mirror, TROT, GALLOP

# Pre-padding ground row and the empty rows above it for the leap.
GROUND, HEADROOM, WIDTH = 24, 14, 42


def _c(o, d, m, l, h, r, p, q, b, e, a, k, t, u):
    return _coat(o=o, d=d, m=m, l=l, h=h, r=r, p=p, q=q, b=b, e=e, a=a, k=k, t=t, u=u)


# One rig, several foxes. `s` scales the whole animal about its feet; the rest
# are proportions against the red fox: skull, snout, ear length and width,
# brush, and extra girth. r p q are the white of the throat, t the tail tip,
# a the stockings and ear backs, u the inside of the ear.
KINDS = {
    "red-fox": dict(s=1.0, skull=1.0, snout=1.0, ear=1.0, ear_w=1.0, brush=1.0, plump=0.0, face="red", coats={
        "red": _c("#3b1c0d", "#96431a", "#c9651f", "#e48a39", "#f6b263", "#b5a998", "#e4dccd", "#fffaf1", "#6d2e11", "#1a0f08", "#2a1c15", "#120b08", "#f2ebdf", "#7a4a3a"),
        # The pale steppe and desert foxes of Iran, Arabia and Central Asia.
        "pale": _c("#4d3219", "#a8703a", "#d09a58", "#e6b979", "#f5d6a2", "#b8ae9f", "#e8e1d4", "#fffbf3", "#80542b", "#1a0f08", "#3b2a1f", "#1a120c", "#f4eee2", "#8a6450"),
        # A cross fox: the red with a dark saddle and legs, from the north.
        "cross": _c("#241209", "#5a2c14", "#8e4a22", "#b86a33", "#d98f4f", "#8f8375", "#c7bdae", "#ece6da", "#3a1a0b", "#0e0805", "#170f0b", "#0b0706", "#efe8dc", "#5b3a2e"),
        # Silver: black frosted with grey, prized by every fur trade.
        "silver": _c("#0b0b0d", "#1b1b1f", "#2c2c33", "#474851", "#6d6f79", "#5b5b62", "#9a9ba2", "#c9cacf", "#141416", "#05050a", "#101014", "#060607", "#f2f2f0", "#3d3a3e"),
    }, weights={"red": 20, "pale": 3, "cross": 2, "silver": 0.3}),
    # Smaller and rounder against the cold: short ears, short muzzle, thick
    # fur. White in winter and brown above in summer; the "blue" foxes of
    # Iceland and the coasts stay dark all year.
    "arctic-fox": dict(s=0.86, skull=1.1, snout=0.7, ear=0.7, ear_w=1.15, brush=1.2, plump=0.5, face="arctic", coats={
        "white": _c("#66707a", "#bcc5ce", "#e2e7ec", "#f1f4f6", "#ffffff", "#aab2ba", "#d6dde3", "#f7f9fb", "#9aa4ae", "#15171a", "#8c949c", "#2a2c30", "#eaeef2", "#c9b7b4"),
        "summer": _c("#2b2219", "#4d3f31", "#6e5c48", "#8c7862", "#a8957d", "#8f8474", "#c2b6a3", "#e0d6c4", "#3d3127", "#0f0c09", "#3a2f25", "#1a1511", "#5d4d3c", "#9c8378"),
        "blue": _c("#1c1c1f", "#34343a", "#4b4a52", "#63626b", "#7c7b84", "#56555b", "#6e6d74", "#88878e", "#2a2a2e", "#0a0a0c", "#2e2d33", "#111113", "#5a5961", "#7a6b6a"),
    }, weights={"white": 10, "blue": 1}, seasons={"white": {"summer": "summer", "autumn": "summer"}}),
    # The smallest fox: a cat's size with ears as long as its head, pale sand
    # all over, furred soles, a black tip to the tail.
    "fennec": dict(s=0.6, skull=1.35, snout=0.8, ear=2.0, ear_w=1.7, brush=0.85, plump=0.1, face="fennec", coats={
        "sand": _c("#6b4a2a", "#c4935a", "#e2b77f", "#f0cf9e", "#fae6c4", "#c9b9a0", "#efe4d0", "#fffaf0", "#a8763f", "#1a120a", "#c9975c", "#5a3d22", "#2a1d14", "#f2c9b5"),
        "cream": _c("#6e5634", "#cfae7c", "#ead0a4", "#f5e2bf", "#fdf1da", "#cdbfa8", "#f1e8d8", "#fffcf4", "#b58f5b", "#1a120a", "#d4b07c", "#5f4a30", "#30241a", "#f4d2c0"),
    }, weights={"sand": 5, "cream": 2}),
    # Grizzled grey over cinnamon flanks and legs, a black stripe down the top
    # of the tail to a black tip. Shorter in the leg than the red.
    "grey-fox": dict(s=0.92, skull=1.0, snout=0.85, ear=0.95, ear_w=1.0, brush=1.0, plump=0.1, face="red", flank=True, stripe=True, coats={
        "grey": _c("#23211f", "#5d5a57", "#8a8783", "#aba8a3", "#cfccc6", "#b4703a", "#e6dccf", "#faf6ef", "#1f1d1b", "#0d0c0b", "#9b5a2e", "#1c1612", "#141312", "#c07845"),
        "dark": _c("#1a1917", "#45423f", "#686561", "#8a8781", "#aeaaa4", "#9c5e30", "#ddd2c3", "#f5f0e7", "#151412", "#0a0908", "#834a24", "#15100d", "#0e0d0c", "#a8683c"),
    }, weights={"grey": 5, "dark": 1}),
}
SPECIES = list(KINDS)
for _kind in KINDS.values():
    for _coat_roles in _kind["coats"].values():
        assert len(set(_coat_roles.values())) == 14
NATIVE_SIZES = {sp: (WIDTH, GROUND + 4 + HEADROOM) for sp in SPECIES}
STANDING_SIZES = {sp: (WIDTH, GROUND + 1) for sp in SPECIES}
STATES = {sp: {"idle": 16, "forage": 16, "wander": 8, "stalk": 8, "chase": 8, "flee": 8, "pounce": 8, "carry": 8, "rest": 16} for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}

# The kind being drawn. Every shape goes through T, which scales the model
# about the middle of the ground line, so one set of poses serves them all.
K = KINDS["red-fox"]
AX = WIDTH // 2


def T(p):
    return AX + (p[0] - AX) * K["s"], GROUND + (p[1] - GROUND) * K["s"]


def at(p):
    x, y = T(p)
    return round(x), round(y)


def seg(a, b):
    return line(T(a), T(b))


class Canvas(_BCanvas):
    def __init__(self):
        self.w, self.h = WIDTH, GROUND + 4 + HEADROOM
        self.palette = next(iter(K["coats"].values()))
        self.px = {}
        self.post = {}

    def finish(self):
        self.px = {(x, y + HEADROOM): r for (x, y), r in self.px.items()}
        im = super().finish()
        px = im.load()
        for (x, y), role in self.post.items():
            y += HEADROOM
            if 0 <= x < self.w and 0 <= y < self.h:
                c = self.palette[role]
                px[x, y] = tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        return im


# ------------------------------------------------------------------ geometry
def disk(cx, cy, r):
    (cx, cy), r = T((cx, cy)), r * K["s"]
    out = set()
    for x in range(math.floor(cx - r), math.ceil(cx + r) + 1):
        for y in range(math.floor(cy - r), math.ceil(cy + r) + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= r * r + 0.15:
                out.add((x, y))
    return out


def tube(pts, radii):
    """Disks swept along a polyline, the radius eased between the points."""
    out = set()
    for (a, ra), (b, rb) in zip(zip(pts, radii), zip(pts[1:], radii[1:])):
        n = max(2, int(math.hypot(b[0] - a[0], b[1] - a[1]) * 3))
        for i in range(n + 1):
            u = i / n
            out |= disk(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, ra + (rb - ra) * u)
    return out


def tri(a, b, c):
    a, b, c = T(a), T(b), T(c)
    xs, ys = [p[0] for p in (a, b, c)], [p[1] for p in (a, b, c)]
    out = set()

    def side(p, q, r):
        return (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1])

    for x in range(math.floor(min(xs)), math.ceil(max(xs)) + 1):
        for y in range(math.floor(min(ys)), math.ceil(max(ys)) + 1):
            d1, d2, d3 = side((x, y), a, b), side((x, y), b, c), side((x, y), c, a)
            if not ((d1 < 0 or d2 < 0 or d3 < 0) and (d1 > 0 or d2 > 0 or d3 > 0)):
                out.add((x, y))
    return out


def rot(v, deg):
    a = math.radians(deg)
    return v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a)


def add(p, v, k=1.0):
    return p[0] + v[0] * k, p[1] + v[1] * k


def lerp(a, b, u):
    if isinstance(a, tuple):
        return tuple(lerp(x, y, u) for x, y in zip(a, b))
    return a + (b - a) * u


def smooth(keys, t):
    """Ease between keyed values; keys are (time 0-1, value), cyclic."""
    keys = sorted(keys)
    for (t0, v0), (t1, v1) in zip(keys, keys[1:] + [(keys[0][0] + 1, keys[0][1])]):
        tt = t if t >= t0 else t + 1
        if t0 <= tt <= t1:
            u = (tt - t0) / (t1 - t0) if t1 > t0 else 0
            return lerp(v0, v1, u * u * (3 - 2 * u))
    return keys[0][1]


# ---------------------------------------------------------------- side view
def pose(**k):
    """Standing, facing east. Every frame starts from this and moves parts."""
    p = dict(hip=(15.0, 13.0), sh=(25.0, 13.0), head=(31.0, 6.5), look=0.0, ears="up", ear_twitch=0,
             tail=[(13.5, 12.2), (10, 14), (6.5, 16.3), (3.5, 18)], tail_r=[1.5, 2.6, 3.0, 1.9],
             feet=dict(fh=(13.0, GROUND), nh=(15.0, GROUND), ff=(24.0, GROUND), nf=(26.0, GROUND)),
             eye="open", mouth=0, arch=0.0, breath=0, loin=2.7, chest=3.3)
    p.update(k)
    p["loin"] += K["plump"]
    p["chest"] += K["plump"]
    p["tail_r"] = [r * K["brush"] for r in p["tail_r"]]
    return p


def body(c, p):
    hip, sh = p["hip"], p["sh"]
    spine = (sh[0] - hip[0], sh[1] - hip[1])
    n = math.hypot(*spine) or 1
    up = (spine[1] / n, -spine[0] / n)  # perpendicular, towards the back
    mid = add(lerp(hip, sh, 0.5), up, p["arch"])
    loin, chest = p["loin"], p["chest"] + p["breath"] * 0.3
    mask = tube([hip, mid, sh], [loin, (loin + chest) / 2 - 0.2, chest])
    hip, sh, sc = T(hip), T(sh), K["s"]
    px = shade(mask, 1, 2)
    for x, y in mask:
        if (x, y - 1) not in mask and ((x, y - 2) not in mask) and lerp(hip, sh, 0.2)[0] <= x <= lerp(hip, sh, 0.85)[0]:
            px[(x, y)] = "h"
    # the pale belly, and the white bib that runs up into the throat
    for x, y in mask:
        dx, dy = x - sh[0], y - sh[1]
        if dx * spine[0] / n + dy * spine[1] / n > 1.2 * sc and dx * up[0] + dy * up[1] < -0.2 * sc:
            px[(x, y)] = "q" if (x + 1, y) not in mask or (x, y + 1) not in mask else "p"
        elif K.get("flank") and (x, y + 2) not in mask and px[(x, y)] in ("m", "d"):
            px[(x, y)] = "r"  # the grey fox's cinnamon underside
    c.paint(px)
    return mask


def head(c, p, body_mask):
    """(head) is the centre of the skull; look turns the nose down (+) or up."""
    hx, hy = p["head"]
    fwd = rot((1, 0), p["look"])
    sh = p["sh"]
    # neck: lighter throat, and the top of it continuous with the back
    neck = tube([add(sh, (0.5, -0.8)), lerp(sh, (hx, hy), 0.5), (hx, hy)], [2.8, 2.2, 2.0 * K["skull"]])
    npx = shade(neck, 1, 1)
    px_h = T((hx, hy))
    for x, y in neck:
        v = (x - px_h[0], y - px_h[1])
        if (x, y + 1) not in neck and v[0] * fwd[1] - v[1] * fwd[0] < -0.6:  # the white throat
            npx[(x, y)] = "q"
    c.paint({xy: "m" if xy in body_mask and r in "dlh" else r for xy, r in npx.items()})
    sk, sn = K["skull"], K["snout"] * K["skull"]
    skull = disk(hx, hy, 2.2 * sk)
    nose = add((hx, hy), fwd, 1.2 * sk + 3.8 * sn)
    muzzle = tube([add((hx, hy), fwd, 1.2 * sk), add(add((hx, hy), fwd, 1.2 * sk + 2.0 * sn), rot((0, 1), p["look"]), 0.3), nose], [1.8 * sk, 1.2 * sk, 0.5])
    far_ear, near_ear = ears(p, hx, hy, fwd)
    c.paint({xy: "a" for xy in far_ear})
    hmask = skull | muzzle
    hp = shade(hmask, 1, 1)
    down = rot((0, 1), p["look"])
    sc = K["s"] * sk
    for x, y in hmask:
        v = (x - px_h[0], y - px_h[1])
        along, across = v[0] * fwd[0] + v[1] * fwd[1], v[0] * down[0] + v[1] * down[1]
        # white lips and cheek below the line from eye to nose
        if across > (0.6 - along * 0.05) * sc and along > -0.5 * sc:
            hp[(x, y)] = "q" if across > 1.2 * sc else "p"
    c.paint(hp)
    # the back of a fox's ear is black from the tip down; orange at the root
    base_y = max(y for _, y in near_ear)
    c.paint({(x, y): "a" if y < base_y - 1 else "d" for x, y in near_ear})
    c.px[at(nose)] = "k"
    global MOUTH
    MOUTH = at(add(add(nose, fwd, -1.6 * sn), down, 1.2 * sk))
    if p["mouth"]:
        m = add((hx, hy), fwd, 1.2 * sk + 2.3 * sn)
        c.px[at(add(m, down, 1.3 * sk))] = "o"
    ex, ey = at(add(add((hx, hy), fwd, 1.2 * sk), down, -0.6 * sk))
    if p["eye"] == "open":
        c.px[(ex, ey)] = "e"
        # the dark tear line from the eye towards the muzzle
        t = add((ex, ey), add(fwd, down), 0.8)
        if c.px.get((round(t[0]), round(t[1]))) in ("m", "l", "d"):
            c.px[(round(t[0]), round(t[1]))] = "b"
    else:
        c.px[(ex, ey)] = "d"
        c.px[(ex - 1, ey)] = "d"


def ears(p, hx, hy, fwd):
    """Tall and pointed. Up, pricked forward at a sound, or flat back."""
    tilt = {"up": -8, "forward": 12, "back": -55, "flat": -75}[p["ears"]] + p["look"]
    out = []
    for base, lean in (((-1.6, -1.0), -10), ((0.4, -1.6), 4)):
        b = add((hx, hy), rot((base[0] * K["skull"], base[1] * K["skull"]), p["look"]))
        axis = rot((0, -1), tilt + lean + (p["ear_twitch"] * 14 if lean > 0 else 0))
        length = ((4.6 if lean > 0 else 3.8) if p["ears"] in ("up", "forward") else 3.4) * K["ear"]
        apex = add(b, axis, length)
        side = rot(axis, 90)
        w = K["ear_w"]
        out.append(tri(add(b, side, -1.2 * w), add(b, side, 1.3 * w), apex))
    return out


def tail(c, p):
    pts, radii = p["tail"], p["tail_r"]
    mask = tube(pts, radii)
    px = shade(mask, 1, 2, base="m", light="l", dark="d")
    # the tip: everything past the last joint's midpoint
    tipc = T(lerp(pts[-2], pts[-1], 0.35))
    end = T(pts[-1])
    reach = math.hypot(end[0] - tipc[0], end[1] - tipc[1]) + radii[-1] * K["s"]
    for x, y in mask:
        if math.hypot(x - end[0], y - end[1]) <= reach * 0.75:
            px[(x, y)] = "t"
        elif K.get("stripe") and (x, y - 1) not in mask:
            px[(x, y)] = "b"  # the black mane down the top of a grey fox's tail
        elif (x, y - 1) in mask and (x, y + 1) not in mask and not K.get("stripe"):
            px[(x, y)] = "b"
    c.paint(px)


def legs(c, p, near):
    """A hind leg is a thigh down to a hock set behind the paw, then a black
    shank; a foreleg is straight and black from the elbow, and a lifted paw
    folds back at the wrist. The black is drawn after the outline, so it
    stays one pixel wide, and never over the body."""
    hip, sh = p["hip"], p["sh"]
    for key in (("nh", "nf") if near else ("fh", "ff")):
        hind = key.endswith("h")
        fx, fy = p["feet"][key]
        rest_y = p.get("ground", GROUND)
        up = max(0.0, rest_y - fy) if fy > rest_y - 6 else 3.0
        if hind:
            root = add(hip, (0.5 if near else -0.5, 0.8))
            joint = (fx - 1.4 - up * 0.3, fy - 4.2 + up * 0.35)
            upper = tube([root, lerp(root, joint, 0.55), joint], [1.9, 1.3, 0.8])
            lower = seg(joint, (fx, fy))
        else:
            root = add(sh, (0.6 if near else -0.6, 1.8))
            wrist = (fx - min(up, 2.5) * 0.5, fy - 2.2 + min(up, 2.5) * 0.3)
            elbow = (lerp(root[0], fx, 0.3) - 0.4, root[1] + 2.2)
            upper = tube([root, elbow], [1.3, 0.8])
            lower = seg(elbow, wrist) | seg(wrist, (fx + (0.6 if up > 1 else 0), fy))
        role = "m" if near else "b"
        tp = {xy: role for xy in upper}
        if near:
            for x, y in upper:
                if (x - 1, y) not in upper:
                    tp[(x, y)] = "l"
        c.paint(tp)
        ink = "a" if near else "k"
        for xy in lower:
            if xy not in c.px:
                c.post[xy] = ink
        foot = at((fx, fy))
        if foot not in c.px:
            c.post[foot] = "k"
            c.post[(foot[0] + 1, foot[1])] = "k"


def side(p):
    c = Canvas()
    legs(c, p, False)
    tail(c, p)
    b = body(c, p)
    head(c, p, b)
    legs(c, p, True)
    return c.finish()


# ------------------------------------------------------------------ gaits
def trot(frame):
    """Diagonal pairs, a moment of float between them, the back dead level and
    the brush carried straight out behind: a fox trots as if on a wire."""
    t = frame / 8
    feet = {}
    for key, (x, ph) in dict(fh=(13, TROT["fh"]), nh=(15, TROT["nh"]), ff=(24, TROT["ff"]), nf=(26, TROT["nf"])).items():
        dx, up = walk_foot(t + ph, 2.6, 2.2, 0.5)
        feet[key] = (x + dx, GROUND - up)
    lift = -round(0.6 * max(0, math.cos(4 * math.pi * t)))
    wave = math.sin(2 * math.pi * (t - 0.15))
    return pose(hip=(15, 13 + lift), sh=(25, 13 + lift), head=(31.5, 7.5 + lift), look=6, feet=feet,
                tail=[(13, 12.5 + lift), (9, 13 + lift), (5, 13.5 + lift + wave * 0.6), (1.5, 14 + lift + wave * 1.2)])


def gallop(frame, fleeing):
    """A rotary gallop: the back bunches as the hind feet reach under and
    stretches flat in the float. Fleeing, the ears go back and the brush low;
    chasing, the head is pushed out and the ears stay on the quarry."""
    t = frame / 8
    stretch = math.cos(2 * math.pi * (t - 0.1))  # +1 stretched, -1 bunched
    hipx = 15 - stretch * 1.4
    shx = 25 + stretch * 1.2
    rock = math.sin(2 * math.pi * (t + 0.1))
    base = 13.5
    hip = (hipx, base - rock * 0.9)
    sh = (shx, base + rock * 0.9 - 0.5)
    rise = -1.5 * max(0.0, stretch)
    hip, sh = (hip[0], hip[1] + rise), (sh[0], sh[1] + rise)
    feet = {}
    for key, x in dict(fh=13, nh=15, ff=25, nf=27).items():
        dx, up = walk_foot(t + GALLOP[key], 4.6, 3.6, 0.34)
        hind = key.endswith("h")
        feet[key] = ((hip[0] - 2 if hind else sh[0] + 1) + (x - (13 if hind else 25)) * 0.5 + dx, GROUND - up)
    hy = sh[1] - 4.5
    wave = math.sin(2 * math.pi * (t - 0.25))
    ty = 1.0 if fleeing else -0.5
    return pose(hip=hip, sh=sh, head=(sh[0] + 5.5, hy + (1 if fleeing else 1.5)), look=14 if not fleeing else 4,
                ears="back" if fleeing else "forward", feet=feet, arch=-stretch * 0.8 + 0.3, mouth=1 if fleeing else 0,
                tail=[add(hip, (-2, -0.5)), add(hip, (-5.5, ty)), add(hip, (-9.5, ty + 0.5 + wave * 0.5)), add(hip, (-13, ty + 1 + wave))],
                tail_r=[1.2, 2.2, 2.3, 1.2])


def stalk(frame):
    """Belly to the grass, shoulders up, head level and still. One foot at a
    time, and at 4 and 5 a forefoot held up in the air, waiting."""
    seq = [("nh", 0.0), ("nh", 1.0), ("fh", 0.0), ("ff", 1.0), ("nf", 0.4), ("nf", 1.0), ("nf", 1.6), ("fh", 1.0)]
    base = dict(fh=(12.5, GROUND), nh=(14.5, GROUND), ff=(24.5, GROUND), nf=(26.5, GROUND))
    feet = dict(base)
    key, u = seq[frame]
    if u < 2:
        lift = math.sin(math.pi * min(u, 1)) * (3.0 if key == "nf" else 1.5)
        if key == "nf" and 0.3 < u < 1.7:
            lift = 3.0
        feet[key] = (base[key][0] + (u - 1) * 0.6 + (1.0 if key == "nf" and u > 1 else 0), GROUND - lift)
    creep = [0, 0.3, 0.5, 0.7, 0.8, 0.8, 0.8, 1.0][frame] * 0.5
    twitch = [0, 0, 0, 1, 0, 0, -1, 0][frame]
    return pose(hip=(15 + creep, 17.5), sh=(25 + creep, 16.8), head=(30.5 + creep, 14.2), look=4, ears="forward",
                feet=feet, loin=2.4, chest=3.0, arch=-0.3,
                tail=[(13, 17.3), (9.5, 18.5), (6, 19.3), (2.5, 19.7 - twitch)], tail_r=[1.2, 2.2, 2.4, 1.3])


def idle(frame):
    """Standing: looks about, lifts its nose to the wind, an ear swivels on
    its own, a blink, the tip of the brush moving."""
    head = smooth([(0, (31.0, 6.5)), (0.2, (31.0, 6.5)), (0.3, (31.5, 5.3)), (0.5, (31.5, 5.3)), (0.6, (31.0, 6.7)), (0.85, (30.6, 7.1))], frame / 16)
    look = smooth([(0, 0.0), (0.2, 0.0), (0.3, -18.0), (0.5, -14.0), (0.6, 4.0), (0.85, 10.0)], frame / 16)
    twitch = 1 if frame in (2, 3, 11) else 0
    swish = [0, 0, 0, 0.5, 1, 1.5, 1, 0.5, 0, 0, 0, 0, -0.5, 0, 0, 0][frame]
    sniff = frame in (5, 7)
    return pose(head=(head[0] + (0.4 if sniff else 0), head[1]), look=look, ear_twitch=twitch, eye="closed" if frame == 9 else "open",
                breath=1 if frame % 8 in (2, 3, 4) else 0,
                tail=[(13.5, 12.2), (10, 14), (6.5, 16.3), (3.5 + swish * 0.3, 18 - swish)])


# The mousing leap. A fox hears a vole under the grass, rises almost straight
# up and comes down nose first on it with the forepaws. (hip, shoulder,
# head, look, ears, feet, tail) for each of the sixteen frames.
def forage(frame):
    g = GROUND
    if frame <= 3:  # quartering the grass, nose down
        dx, lift = [(0, 0), (0.6, 1.2), (1.1, 0), (1.5, 1.2)][frame]
        feet = dict(fh=(13, g), nh=(15 + dx, g - (lift if frame % 2 else 0)), ff=(24 + dx, g - (lift if not frame % 2 else 0)), nf=(26 + dx, g))
        return pose(hip=(15 + dx * 0.5, 13), sh=(25 + dx * 0.5, 14), head=(30 + dx * 0.5, 14.5 + (frame % 2) * 0.5), look=48, feet=feet,
                    tail=[(13, 12.5), (9.5, 13.8), (6, 15.2), (2.8, 16.8 - frame % 2 * 0.4)])
    if frame <= 6:  # frozen, head cocked, ears on the sound
        cock = [0, -10, 8][frame - 4]
        return pose(hip=(15.5, 13), sh=(25.5, 13.2), head=(31, 8.5), look=26 + cock, ears="forward",
                    ear_twitch=1 if frame == 5 else 0, feet=dict(fh=(13, g), nh=(15.5, g), ff=(24.5, g), nf=(27, g)),
                    tail=[(13.5, 12.5), (10, 14), (6.5, 16), (3.5, 17.5)])
    keys = {
        # anticipation: down on the hocks, weight back
        7: dict(hip=(14.5, 15.5), sh=(24, 14.5), head=(29, 10.5), look=20, ears="forward", arch=0.3,
                feet=dict(fh=(14, g), nh=(16, g), ff=(24.5, g), nf=(26.5, g)),
                tail=[(12.5, 15), (9, 16.5), (5.5, 18), (2.5, 19)]),
        # launch: the hind legs throw it up and forward
        8: dict(hip=(16, 9), sh=(24, 3), head=(28, -2), look=-10, ears="forward", arch=0.5,
                feet=dict(fh=(12, g), nh=(13.5, g - 1), ff=(25, 8), nf=(26.5, 7)),
                tail=[(14.5, 9.5), (11.5, 12), (8, 14.5), (4.5, 16.5)]),
        # climbing, forepaws folded to the chest
        9: dict(hip=(17, 1), sh=(25, -3), head=(29.5, -7), look=5, ears="forward", arch=1.2,
                feet=dict(fh=(12, 5), nh=(13.5, 6), ff=(26, 1.5), nf=(27.5, 1)),
                tail=[(15.5, 1.5), (12, 3.5), (8.5, 6.5), (5, 9.5)]),
        # the top of the arc: the back bowed, the brush straight up behind
        10: dict(hip=(18, -5), sh=(26, -5.5), head=(31, -8), look=35, ears="forward", arch=2.2,
                 feet=dict(fh=(14, 0), nh=(15.5, 0.5), ff=(28.5, -1), nf=(30, -1.5)),
                 tail=[(16.5, -5), (13.5, -6), (10.5, -8.5), (8.5, -12)]),
        # turning over: nose and forepaws coming down together
        11: dict(hip=(20, -6), sh=(27.5, -1), head=(31.5, 3), look=70, ears="forward", arch=1.5,
                 feet=dict(fh=(17.5, -3), nh=(19, -2.5), ff=(31, 6), nf=(32.5, 6.5)),
                 tail=[(18.5, -6.5), (16, -9), (14.5, -12.5), (14, -15.5)]),
        # strike: forepaws pin it, nose follows into the grass
        12: dict(hip=(23, 6), sh=(29, 13), head=(32.5, 18.5), look=78, ears="forward", arch=0.6,
                 feet=dict(fh=(21, 11), nh=(22.5, 11.5), ff=(31.5, g), nf=(33, g)),
                 tail=[(21.5, 5), (19, 2), (18, -1.5), (18.5, -5)]),
        # head down in it, rump high, the brush waving for balance
        13: dict(hip=(22, 10), sh=(29.5, 15), head=(33, 20), look=82, ears="forward", arch=0.2,
                 feet=dict(fh=(20.5, g), nh=(22.5, g), ff=(31.5, g), nf=(33, g)),
                 tail=[(20.5, 9), (18, 6.5), (16.5, 3.5), (17.5, 0.5)]),
        14: dict(hip=(21.5, 10.5), sh=(29, 15), head=(32.5, 19.5), look=80, ears="forward", arch=0.2, mouth=1,
                 feet=dict(fh=(20, g), nh=(22, g), ff=(31.5, g), nf=(33, g)),
                 tail=[(20, 9.5), (17, 8), (14.5, 6), (13, 3)]),
        # backing out of the grass to where it began
        15: dict(hip=(17.5, 13), sh=(27, 13.5), head=(31.5, 12), look=30, ears="up", mouth=1,
                 feet=dict(fh=(15, g), nh=(17.5, g - 1), ff=(26, g), nf=(29, g)),
                 tail=[(15.5, 12.5), (12, 13.5), (8.5, 15), (5.5, 16.5)]),
    }
    return pose(**keys[frame])


def rest(frame):
    """Curled nose to tail in a ring, the brush wrapped over the face. It
    breathes; once it opens an eye, and once an ear turns to a sound."""
    c = Canvas()
    g = GROUND
    breath = 1 if frame % 8 in (2, 3, 4, 5) else 0
    ring = tube([(11, g - 3.5), (15, g - 5.5 - breath * 0.5), (21, g - 6 - breath), (27, g - 5 - breath * 0.5), (29.5, g - 3)],
                [3.0, 4.0, 4.4, 4.0, 3.0])
    rp = shade(ring, 1, 2)
    for x, y in ring:
        if (x, y - 1) not in ring and T((14, 0))[0] <= x <= T((25, 0))[0]:
            rp[(x, y)] = "h"
        if (x, y + 1) not in ring:
            rp[(x, y)] = "b"
    c.paint(rp)
    # the head laid on the flank at the front, ears still up
    hx, hy = 26.5, g - 6.0 - breath * 0.5
    lift = 1 if 9 <= frame <= 11 else 0
    hy -= lift
    sk, el, ew = K["skull"], K["ear"], K["ear_w"]
    skull = disk(hx, hy, 2.4 * sk)
    phy = T((hx, hy))[1]
    rimmed(c, skull, lambda x, y: "h" if (x, y - 1) not in skull else "l" if y < phy else "m")
    twitch = 1 if frame in (5, 12) else 0
    top = hy - 1.5 * sk
    ear = [tri((hx - 2.2 * ew, top + 0.5), (hx - 0.2, top), (hx - 2.5 * ew - twitch, top - 4 * el)),
           tri((hx - 0.2, top), (hx + 2 * ew, top + 0.3), (hx + 1.2 * ew, top - 4.3 * el))]
    tip_y = T((0, top - 1.8 * el))[1]
    for e in ear:
        rimmed(c, e - skull, lambda x, y: "a" if y < tip_y else "d")
    ex, ey = at((hx + 1 * sk, hy + 0.5 * sk))
    if frame in (10, 11):
        c.px[(ex, ey)] = "e"
    else:
        c.px[(ex, ey)] = "o"
        c.px[(ex + 1, ey)] = "o"
    # the brush round the front, over the nose, tip white
    sway = [0, 0, 0, 0, 0, 0, 0.5, 1, 1, 0.5, 0, 0, 0, 0, 0, 0][frame]
    brush = [(10, g - 2.5), (15, g - 1.5), (21, g - 1.2), (26, g - 1.5 - sway * 0.5), (30.5 + sway * 0.4, g - 3.2)]
    t = tube(brush, [r * K["brush"] for r in (2.2, 2.6, 2.7, 2.5, 1.8)])
    tp = shade(t, 1, 1)
    for x, y in t:
        if x >= T((28 + sway * 0.4, 0))[0]:
            tp[(x, y)] = "t"
    c.paint(tp)
    return c.finish()


# ------------------------------------------------------------ front and back
def face(state, frame, south):
    """End-on, seen from above as the game sees everything: facing south the
    head is in front and low, the back runs up the screen behind it and the
    brush lies beyond; facing north the rump is nearest, the brush hangs over
    the hocks and the head is at the far end, black ear backs up."""
    c = Canvas()
    g, cx = GROUND, WIDTH // 2
    if state == "rest":
        return face_rest(c, frame, south)
    t = frame / (16 if state in ("idle", "forage") else 8)
    up, bob, low, head_dy, ears_mode = 0.0, 0, 0.0, 0.0, "up"
    lifts, running = {}, state in ("chase", "flee")
    if state in ("wander", "chase", "flee"):
        amp, lift, stance = (2.6, 2.2, 0.5) if state == "wander" else (4.6, 3.6, 0.34)
        phases = TROT if state == "wander" else GALLOP
        for key in ("fh", "nh", "ff", "nf"):
            lifts[key] = walk_foot(t + phases[key], amp, lift, stance)[1]
        bob = -round(0.6 * max(0, math.cos(4 * math.pi * t))) if state == "wander" else -round(1.2 * max(0, math.sin(2 * math.pi * t)))
        ears_mode = "back" if state == "flee" else "forward" if state == "chase" else "up"
    elif state == "stalk":
        low, ears_mode = 2.5, "forward"
        lifts = {"nf": 2.5 if frame in (4, 5, 6) else 0}
    elif state == "idle":
        head_dy = -1 if 5 <= frame <= 7 else 0
    elif state == "forage":
        up = {7: 1.5, 8: -6, 9: -12, 10: -14, 11: -9}.get(frame, 0)
        head_dy = {0: 2, 1: 2, 2: 2.5, 3: 2, 7: 1, 12: 4, 13: 5, 14: 5}.get(frame, 0)
        ears_mode = "forward" if frame >= 4 else "up"
        if 8 <= frame <= 11:
            lifts = dict(fh=3, nh=3, ff=4, nf=4)
    y0 = bob + up + low
    dive = state == "forage" and 12 <= frame <= 14
    tuck = state == "forage" and 8 <= frame <= 11
    sway = math.sin(2 * math.pi * t) if state != "idle" else [0, 0, 0, .3, .6, .8, .6, .3, 0, 0, 0, 0, -.3, 0, 0, 0][frame]

    def leg(x, key, top, ink):
        px_x, px_top = at((x, top))
        foot = at((x, g - lifts.get(key, 0) + (up if up < 0 else 0)))[1]
        for y in range(px_top, foot + 1):
            if (px_x, y) not in c.px:
                c.post[(px_x, y)] = ink
        if (px_x, foot) not in c.px:
            c.post[(px_x, foot)] = "k"

    def brush(pts):
        m = tube(pts, [r * K["brush"] for r in (1.5, 2.5, 2.7, 1.6)][: len(pts)])
        tp = shade(m, 1, 1)
        end = T(pts[-1])
        for x, y in m:
            if math.hypot(x - end[0], y - end[1]) < 2.3 * K["s"] * K["brush"]:
                tp[(x, y)] = "t"
        c.paint(tp)

    def back(top, bottom, hips_far):
        r0, r1 = (3.4, 2.9) if hips_far else (2.9, 3.5)
        m = tube([(cx, top), (cx, (top + bottom) / 2), (cx, bottom)], [r0, (r0 + r1) / 2, r1])
        bp = shade(m, 1, 2)
        top, bottom = T((0, top))[1], T((0, bottom))[1]
        for x, y in m:
            if x == cx and top + 1 <= y <= bottom - 1:
                bp[(x, y)] = "h"
            elif abs(x - cx) == 1 and top + 1 <= y <= bottom - 2:
                bp[(x, y)] = "l"
        c.paint(bp)
        return m

    if south:
        # beyond the body: the brush, then the back running away up the screen
        if running or tuck:
            brush([(cx, 9 + y0), (cx + sway * 0.5, 5 + y0), (cx + sway, 1.5 + y0)])
        elif dive:
            brush([(cx, 12 + y0), (cx + 1, 7 + y0), (cx + 2, 3 + y0)])
        else:
            brush([(cx + 1, 10 + y0), (cx + 4, 8.5 + y0), (cx + 7 + sway, 9 + y0), (cx + 9 + sway, 11 + y0)])
        for x, key in ((cx - 3, "fh"), (cx + 3, "nh")):
            if not tuck:
                leg(x, key, 16 + y0, "k")
        back((13 if dive else 11) + y0, 17 + y0, True)
        chest = disk(cx, 17.5 + y0, 2.8)
        cp = shade(chest, 1, 1)
        for x, y in chest:
            if abs(x - cx) <= 1:
                cp[(x, y)] = "q"
        c.paint(cp)
        for x, key in ((cx - 2, "ff"), (cx + 2, "nf")):
            if not tuck:
                leg(x, key, 19 + y0, "a")
        if tuck:
            c.paint({at((x, 20 + y0)): "a" for x in (cx - 2, cx - 1, cx + 1, cx + 2)})
        hy = 13 + y0 + head_dy
        if dive:  # the top of the head and the ears, nose in the grass
            hy = g - 3
            c.paint({xy: "a" for xy in ears_face(cx, hy, "forward")})
            c.paint(shade(disk(cx, hy, 2.8), 1, 1))
            return c.finish()
        grid, back_grid, (gx, gy) = FACES[K["face"]]
        if ears_mode == "back":
            grid = back_grid
        if state == "idle" and frame == 9:
            grid = [r.replace("e", "d") for r in grid]
        hx_p, hy_p = at((cx, hy))
        paint_grid(c, grid, hx_p - gx, hy_p - gy)
        global MOUTH
        MOUTH = (hx_p, hy_p - gy + len(grid) - 1)
        if state == "flee":
            c.px[(hx_p, hy_p + 3)] = "o"
        return c.finish()

    # north: the head is at the far end, up the screen
    hy = 6.5 + y0 + head_dy * 0.5
    if dive:
        hy = 12 + y0
    if not dive:
        c.paint({xy: "a" for xy in ears_face(cx, hy, ears_mode)})
        c.paint(shade(disk(cx, hy, 2.8), 1, 1))
    for x, key in ((cx - 2, "ff"), (cx + 2, "nf")):
        if not tuck:
            leg(x, key, 14 + y0, "k")
    rump = 18 + y0 if not dive else 13 + y0
    back(8 + y0 if not dive else 12 + y0, rump, False)
    for x, key in ((cx - 3, "fh"), (cx + 3, "nh")):
        if not tuck:
            leg(x, key, rump + 1, "a")
    if running:
        brush([(cx, rump - 1), (cx + sway * 0.5, rump + 1.5), (cx + sway, rump + 3.5)])
    elif dive or tuck:
        brush([(cx, rump - 1), (cx, rump - 5), (cx + 1, rump - 9)])
    elif state == "stalk":
        brush([(cx, rump), (cx, rump + 2.5), (cx + 1, rump + 4.5)])
    else:
        brush([(cx, rump - 0.5), (cx + sway * 0.3, rump + 2.5), (cx + sway * 0.8, rump + 5), (cx + sway, g - 1)])
    return c.finish()


# The face from the front, hand placed: at this size a mask drawn from disks
# loses the eyes. Ears up and ears flat back.
FACE = [
    "a.......a",
    "aa.....aa",
    "dpao.oapd",
    "dpmmmmmpd",
    "omlmmmlmo",
    ".memmmem.",
    ".qqmmmqq.",
    "..qqpqq..",
    "...qkq...",
]
FACE_BACK = [
    ".........",
    ".........",
    "aa.....aa",
    "odammmado",
    "omlmmmlmo",
    ".memmmem.",
    ".qqmmmqq.",
    "..qqpqq..",
    "...qkq...",
]
# Round and short-eared, the face furred out wide.
ARCTIC_FACE = [
    ".aa...aa.",
    "oapmmmpao",
    "omlmmmlmo",
    "mmemmmemm",
    ".qqmmmqq.",
    "..qqpqq..",
    "...qkq...",
]
ARCTIC_BACK = [
    "aa.....aa",
    "oammmmmao",
    "omlmmmlmo",
    "mmemmmemm",
    ".qqmmmqq.",
    "..qqpqq..",
    "...qkq...",
]
# All ears: each as tall as the head and wider than it, pink inside.
FENNEC_FACE = [
    "a...........a",
    "aa.........aa",
    "dua.......aud",
    "duua.....auud",
    ".duuammmauud.",
    "..dupmmmpud..",
    "....mlmlm....",
    "....emmme....",
    "....qqmqq....",
    ".....qkq.....",
]
FENNEC_BACK = [
    ".............",
    ".............",
    ".............",
    "aa.........aa",
    "duua.....auud",
    ".dduammmaudd.",
    "....mlmlm....",
    "....emmme....",
    "....qqmqq....",
    ".....qkq.....",
]
# name: (ears up, ears back, (column, row) of the grid that sits on the skull centre)
FACES = {
    "red": (FACE, FACE_BACK, (4, 6)),
    "arctic": (ARCTIC_FACE, ARCTIC_BACK, (4, 4)),
    "fennec": (FENNEC_FACE, FENNEC_BACK, (6, 7)),
}


def paint_grid(c, grid, x0, y0):
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch != ".":
                c.px[(x0 + x, y0 + y)] = ch


def rimmed(c, mask, roles):
    """Paint a part that sits inside the silhouette with its own dark rim, so
    it reads against the body behind it."""
    for x, y in mask:
        c.px[(x, y)] = roles(x, y)
    for x, y in mask:
        for n in ((x + 1, y), (x - 1, y), (x, y - 1)):
            if n not in mask and n in c.px:
                c.px[n] = "o"


def ears_face(cx, hy, mode):
    """A wide V, the ears set at the corners of the skull."""
    spread = {"up": 0, "forward": -0.8, "back": 3, "flat": 4}[mode]
    h = (5.0 if mode in ("up", "forward") else 3.5) * K["ear"]
    w = K["ear_w"]
    out = set()
    for sgn in (-1, 1):
        base_in, base_out = (cx + sgn * 0.8, hy - 2.2), (cx + sgn * 3.4 * w, hy - 0.4)
        apex = (cx + sgn * (4.3 * w + spread), hy - 1.2 - h + abs(spread) * 0.6)
        out |= tri(base_in, base_out, apex)
    return out


def face_rest(c, frame, south):
    g, cx = GROUND, WIDTH // 2
    breath = 1 if frame % 8 in (2, 3, 4, 5) else 0
    ball = disk(cx, g - 4.5 - breath * 0.5, 5.4) | disk(cx - 2, g - 3.5, 4.5) | disk(cx + 2, g - 3.5, 4.5)
    bp = shade(ball, 1, 2)
    for x, y in ball:
        if (x, y + 1) not in ball:
            bp[(x, y)] = "b"
    c.paint(bp)
    if south:
        lift = 1 if 9 <= frame <= 11 else 0
        hy = g - 6 - lift
        c.paint({xy: "a" for xy in ears_face(cx - 1, hy, "up")})
        c.paint(shade(disk(cx - 1, hy, 2.6), 1, 1))
        for sgn in (-1, 1):
            c.px[at((cx - 1 + sgn * 2, hy))] = "e" if frame in (10, 11) else "d"
        brush = tube([(cx - 6, g - 1.5), (cx - 1, g - 2), (cx + 4, g - 2.5)], [r * K["brush"] for r in (2.0, 2.4, 2.0)])
    else:
        c.paint({xy: "a" for xy in ears_face(cx + 1, g - 8, "up")})
        brush = tube([(cx + 6, g - 2), (cx + 1, g - 1.5), (cx - 4, g - 2)], [r * K["brush"] for r in (2.0, 2.4, 2.0)])
    tp = shade(brush, 1, 1)
    edge = 3 * K["s"]
    for x, y in brush:
        if (south and x >= cx + edge) or (not south and x <= cx - edge):
            tp[(x, y)] = "t"
    c.paint(tp)
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "forage": forage, "wander": trot, "stalk": stalk,
        "chase": lambda f: gallop(f, False), "flee": lambda f: gallop(f, True)}
DIRECTIONS = ("south", "east", "north", "west")


# What a fox carries home, limp in the jaws: drawn after everything in fixed
# colours, so no coat swap turns the rabbit red. (0, 0) is the mouth.
CARRIED_SIDE = ["dm..", "mld.", ".mld", ".mmd", "..dm", "..wd"]
CARRIED_SMALL = ["dm.", "mld", ".dm", "..w"]
CARRIED_FRONT = [".dmmd.", "dmllmd", ".d..d."]
PREY = {"d": "#4a3f33", "m": "#7a6a58", "l": "#a8977f", "w": "#e8e0d0"}
MOUTH = (0, 0)


def carried(im, grid, ox=0):
    px = im.load()
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            X, Y = MOUTH[0] + x + ox, MOUTH[1] + y + HEADROOM
            if ch != "." and 0 <= X < im.width and 0 <= Y < im.height:
                c = PREY[ch]
                px[X, Y] = tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def draw(species, state, facing, frame):
    global K
    K = KINDS[species]
    if state == "carry":  # home at a trot, head up to keep it off the ground
        small = K["s"] < 0.8
        if facing in ("east", "west"):
            p = trot(frame)
            p["head"] = (p["head"][0], p["head"][1] - 1)
            p["look"] = -4
            im = side(p)
            carried(im, CARRIED_SMALL if small else CARRIED_SIDE, -1)
            return _mirror(im) if facing == "west" else im
        im = face("wander", frame, facing == "south")
        if facing == "south":
            carried(im, CARRIED_SMALL if small else CARRIED_FRONT, -2 if small else -3)
        return im
    if state == "pounce":  # at something real: the leap out of the mousing loop, crouch to nose-down
        state, frame = "forage", frame + 7
    if facing in ("east", "west"):
        im = rest(frame) if state == "rest" else side(SIDE[state](frame))
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_fox():
    return {
        f"faunac-{sp}-{state}-{facing}-{frame}": draw(sp, state, facing, frame)
        for sp in SPECIES
        for state, count in STATES[sp].items()
        for facing in DIRECTIONS
        for frame in range(count)
    }


def looks():
    return {sp: {
        "roles": PALETTES[sp],
        "forms": [{"id": "fox", "weight": 1.0, "where": None, "coats": k["weights"]}],
        "coats": k["coats"],
        "coatFrom": {},
        **({"seasons": k["seasons"]} if "seasons" in k else {}),
    } for sp, k in KINDS.items()}
