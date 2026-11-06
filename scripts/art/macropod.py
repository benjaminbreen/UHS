"""The great kangaroos: one macropod rig, two animals, bucks and does.

The red kangaroo is the biggest: a buck sitting up on his tail stands nearly
as tall as a man and, reared to box, taller. Bucks are red-brown and does
mostly blue-grey (the drovers' "blue fliers"); both have a pale underside and
a black-and-white bar on the side of the muzzle. The grey kangaroos (the
eastern and the western, which this rig draws alike) are woollier, grey- or
chocolate-brown, with dark paws, feet and tail tip, and no muzzle bar.

A kangaroo cannot walk. Slow, it moves "pentapedally": forepaws and tail take
the weight while both hind feet swing forward together, then the paws reach
on. Fast, it bounds: both feet push at once, the body rides level, the tail
swings against the legs to balance them. Resting it sits up on its tail, or
lies on its side propped on an elbow. Bucks spar standing on their toes and
tail, pawing at each other's heads, and rock back on the tail to kick.
"""
import math
from art.fauna_b import shade, walk_foot
from art.fauna_d import _mirror
from art import rig
from art.rig import Canvas, T, at, disk, tube, rot, add, lerp, smooth, rimmed

GM, HM, WM = 34, 10, 50

ROLES = "o d m l h b w k e t p".split()


def _c(o, d, m, l, h, b, w, t, p):
    return dict(o=o, d=d, m=m, l=l, h=h, b=b, w=w, k="#140d0b", e="#0a0706", t=t, p=p)


RED = _c("#24140d", "#7a3a22", "#a65532", "#c47447", "#d9976a", "#eadfcb", "#f8f4ec", "#4e2a1a", "#c48f86")
BLUE = _c("#1c1d22", "#545b67", "#7d8593", "#9da4b0", "#bcc2ca", "#e6e4de", "#f9f8f4", "#3b404a", "#b9959a")
GREY = _c("#201b17", "#5b5047", "#847769", "#a09384", "#bbb0a2", "#dcd4c7", "#eee9e0", "#2e2621", "#b08e86")
BROWN = _c("#1d1510", "#4c3628", "#6d5241", "#8a6d58", "#a68a73", "#cbb6a0", "#e2d6c6", "#251a13", "#a07b70")

KINDS = {
    # A buck 1.5-1.8 m sitting up, 85 kg; a doe a third smaller and a third
    # the weight. Open plains and mulga of the arid interior.
    "red-kangaroo": dict(s=1.0, bar=True, wool=False, dark=False,
                         forms={"buck": dict(s=1.0, joey=False), "doe": dict(s=0.78, joey=True)},
                         form_weights={"buck": 1.0, "doe": 2.0},
                         form_coats={"buck": {"red": 1}, "doe": {"blue": 3, "red": 1}},
                         coats={"red": RED, "blue": BLUE}),
    # Nearly as big as the red in the buck, but heavier in the shoulder and
    # thick-furred; woodland and grassy forest edge in the east and south.
    "grey-kangaroo": dict(s=0.95, bar=False, wool=True, dark=True,
                          forms={"buck": dict(s=1.0, joey=False), "doe": dict(s=0.8, joey=True)},
                          form_weights={"buck": 1.0, "doe": 2.0},
                          form_coats={"buck": {"grey": 3, "brown": 1}, "doe": {"grey": 3, "brown": 1}},
                          coats={"grey": GREY, "brown": BROWN}),
}
SPECIES = list(KINDS)
for _k in KINDS.values():
    for _coat in _k["coats"].values():
        assert len(set(_coat.values())) == len(ROLES), _coat


def dims(sp):
    s = KINDS[sp]["s"]
    return round(WM * s), round(GM * s), round(HM * s)


NATIVE_SIZES = {sp: (dims(sp)[0], dims(sp)[1] + 4 + dims(sp)[2]) for sp in SPECIES}
STANDING_SIZES = {sp: (dims(sp)[0], dims(sp)[1] + 1) for sp in SPECIES}
# chase is the bucks' boxing: reared on the tail, pawing and kicking.
STATES = {sp: {"idle": 16, "graze": 16, "wander": 8, "flee": 8, "chase": 8, "rest": 16} for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}

K = KINDS["red-kangaroo"]
F = K["forms"]["buck"]


def ik(a, c, l1, l2, sign):
    """The middle joint of a two-bone limb from a to c; sign picks the side it
    bends to (screen y is down, so -1 puts a knee forward of a leg facing east)."""
    dx, dy = c[0] - a[0], c[1] - a[1]
    d = math.hypot(dx, dy) or 1e-6
    if d >= l1 + l2:
        return lerp(a, c, l1 / (l1 + l2))
    d = max(d, abs(l1 - l2) + 1e-3)
    ang = math.atan2(dy, dx) + sign * math.acos(max(-1.0, min(1.0, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))))
    return a[0] + l1 * math.cos(ang), a[1] + l1 * math.sin(ang)


def flat_on(c, pixels):
    """A part laid over the body loses its top light where they overlap, or
    its rim draws a seam across the fur."""
    return {xy: "m" if xy in c.px and r in "lh" else r for xy, r in pixels.items()}


def laid(c, mask, pixels, rim="d"):
    """A limb laid over the body: painted, then a dark line where it crosses
    fur already drawn, so a thin arm still reads against the chest."""
    edge = set()
    for x, y in mask:
        for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if q not in mask and q in c.px:
                edge.add(q)
    c.paint(pixels)
    for q in edge:
        c.px[q] = rim


# ---------------------------------------------------------------- side view
def pose(**k):
    p = dict(hip=(19.0, GM - 6.5), chest=(23.0, GM - 15.5), head=(25.0, GM - 20.5), look=14.0, hr=5.8,
             feet=dict(n=((18.5, GM - 0.9), (26.5, GM - 0.8)), f=((20.0, GM - 1.2), (28.0, GM - 1.1))),
             paws=dict(n=(26.0, GM - 10.0), f=(26.8, GM - 10.8)),
             tail=[(14.5, GM - 2.8), (9.5, GM - 1.3), (3.5, GM - 1.0)],
             ears="up", eye="open", mouth=0, breath=0, joey=False, down=False)
    p.update(k)
    return p


def hind(c, p, near):
    """Thigh inside the haunch, the knee forward, the long shin back to the
    heel, and the foot, longer than the shin, to the great middle toe."""
    heel, toe = p["feet"]["n" if near else "f"]
    hip = p["hip"] if near else add(p["hip"], (1.0, -0.6))
    knee = ik(hip, heel, 4.6, 7.0, -1)
    shin = tube([knee, lerp(knee, heel, 0.5), heel], [2.4, 1.6, 1.2])
    foot = tube([heel, lerp(heel, toe, 0.55), toe], [1.3, 1.2, 0.9])
    m = shin | foot
    if near:
        px = shade(m, 1, 1)
        for xy in foot - shin:
            if px[xy] == "m" and K["dark"]:
                px[xy] = "t"
        laid(c, m, flat_on(c, px))
    else:
        c.paint({xy: "t" if K["dark"] and xy in foot - shin else "d" for xy in m})
    c.px[at(add(toe, (0.7, 0.3)))] = "k"


def arm(c, p, near):
    paw = p["paws"]["n" if near else "f"]
    ch = p["chest"]
    sh = add(ch, (0.8, 0.6)) if near else add(ch, (1.6, 0.0))
    elbow = ik(sh, paw, 3.0, 3.4, 1)
    m = tube([sh, elbow, paw], [1.2, 0.95, 0.8])
    if near:
        px = shade(m, 1, 1)
        px[at(paw)] = "t"
        laid(c, m, flat_on(c, px))
    else:
        c.paint({xy: "d" for xy in m})
        c.px[at(paw)] = "t" if K["dark"] else "d"


def tail(c, p):
    pts = p["tail"]
    w = 1.12 if K["wool"] else 1.0
    radii = [2.5 * w, 1.7 * w, 1.1, 0.7, 0.6][: len(pts)]
    m = tube(pts, radii)
    px = shade(m, 1, 1)
    end = T(pts[-1])
    for x, y in m:
        if K["dark"] and math.hypot(x - end[0], y - end[1]) < 3.0 * rig.S["s"]:
            px[(x, y)] = "t"
    c.paint(px)


def torso(c, p):
    """A pear: the great haunch low and behind, tapering to a narrow chest.
    Pale down the front, the near thigh laid over it as a drumstick."""
    hip, ch = p["hip"], p["chest"]
    b = p["breath"] * 0.3
    hr = p["hr"] * (1.06 if K["wool"] else 1)
    sp = (ch[0] - hip[0], ch[1] - hip[1])
    n = math.hypot(*sp) or 1
    u = (sp[0] / n, sp[1] / n)
    front = rot(u, 90) if rot(u, 90)[0] >= rot(u, -90)[0] else rot(u, -90)
    mask = disk(*hip, hr + b) | tube([hip, lerp(hip, ch, 0.45), ch], [hr * 0.9 + b, hr * 0.66 + b, 2.9 * (1.1 if K["wool"] else 1)])
    if F["joey"]:
        mask |= disk(*add(lerp(hip, ch, 0.3), front, hr * 0.62), 2.7)
    px = shade(mask, 1, 1)
    s = rig.S["s"]
    hx, hy = T(add(hip, (0.4, 0.3)))
    hm = disk(hip[0] + 0.4, hip[1] + 0.3, hr * 0.84)
    thigh = disk(hip[0] + 0.1, hip[1] + 0.5, hr * 0.7)
    st = [(round(front[0] * k), round(front[1] * k)) for k in (1, 2, 3, 3.6)]
    for x, y in mask:
        if (x, y) in thigh:
            continue
        if any((x + dx, y + dy) not in mask for dx, dy in st) and px[(x, y)] != "l":
            px[(x, y)] = "b"
    rr = hr * 0.84 * s
    for x, y in hm:
        d = math.hypot(x - hx, y - hy) / rr
        ang = math.atan2(y - hy, x - hx)
        outside = [q for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if q not in hm]
        if outside and any(q in mask for q in outside) and -0.6 < ang < 2.3:
            px[(x, y)] = "d"  # the crease where the thigh meets the belly
        elif 0.55 < d < 0.85 and -2.5 < ang < -1.0:
            px[(x, y)] = "h"
    c.paint(px)
    return front


def joey(c, p, front):
    """A head and two ears out of the pouch, looking the way she looks."""
    hip, ch = p["hip"], p["chest"]
    # lighter than her and standing proud of her belly line, or it is lost
    a = add(add(lerp(hip, ch, 0.32), front, p["hr"] * 0.62 + 2.0), (0, -1.4))
    m = disk(a[0], a[1], 1.4) | tube([a, add(a, (1.9, 0.5))], [1.2, 0.8])
    for dx in (-1.0, 0.0):
        c.paint({xy: "l" for xy in tube([(a[0] + dx, a[1] - 1.0), (a[0] + dx - 0.7, a[1] - 3.0)], [0.6, 0.4])})
    laid(c, m, {xy: "h" if r == "l" else "l" for xy, r in shade(m, 1, 0).items()})
    c.px[at((a[0] + 0.5, a[1] - 0.4))] = "e"


def head(c, p):
    hx, hy = p["head"]
    look = p["look"]
    fwd = rot((1, 0), look)
    down = rot((0, 1), look)
    ch = p["chest"]
    neck = tube([add(ch, (0.3, -1.0)), lerp(ch, (hx, hy), 0.6), (hx, hy)], [2.5, 1.9, 1.8])
    c.paint(flat_on(c, shade(neck, 1, 1)))
    if p.get("front_neck", True):
        for xy in neck:
            if any((xy[0] + k, xy[1]) not in neck and (xy[0] + k, xy[1]) not in c.px for k in (1, 2)) and c.px.get(xy) == "m":
                c.px[xy] = "b"
    skull = disk(hx, hy, 2.2)
    muzzle = tube([add((hx, hy), fwd, 1.0), add(add((hx, hy), fwd, 4.6), down, 0.7)], [1.9, 1.1])
    hm = skull | muzzle
    hp = shade(hm, 1, 1)
    hxp, hyp = T((hx, hy))
    s = rig.S["s"]
    for x, y in hm:
        v = (x - hxp, y - hyp)
        if v[0] * down[0] + v[1] * down[1] > 1.0 * s and v[0] * fwd[0] + v[1] * fwd[1] > 0.8 * s:
            hp[(x, y)] = "b"
    c.paint(hp)
    if K["bar"]:  # a white bar from the mouth corner back under the eye
        c.px[at(add(add((hx, hy), fwd, 1.6), down, 0.7))] = "w"
        c.px[at(add(add((hx, hy), fwd, 2.6), down, 0.8))] = "w"
    c.px[at(add(add((hx, hy), fwd, 5.0), down, 0.5))] = "k"
    if p["mouth"]:
        c.px[at(add(add((hx, hy), fwd, 3.8), down, 1.5))] = "p"
    ex, ey = at(add(add((hx, hy), fwd, 0.9), down, -0.5))
    c.px[(ex, ey)] = "e" if p["eye"] == "open" else "d"
    ears(c, p, (hx, hy), look)


EAR_TILT = {"up": (-6, 6), "back": (-40, -30), "flat": (-70, -62), "swivel": (-6, -38), "fwd": (14, 24), "droop": (-55, -45)}


def ears(c, p, hd, look):
    """Long narrow ears from the back of the crown; each turns on its own."""
    tilts = EAR_TILT[p["ears"]]
    for i, (off, tilt) in enumerate(zip(((-0.4, -1.8), (-1.1, -1.5)), tilts)):
        b = add(hd, rot(off, look * 0.6))
        tip = add(b, rot((0, -1), tilt + look * 0.3), 4.6)
        e = tube([b, lerp(b, tip, 0.45), tip], [0.95, 1.1, 0.4])
        if i == 0:
            inner = at(lerp(b, tip, 0.55))
            rimmed(c, e, lambda x, y: "p" if (x, y) == inner and tilt > -30 else "m" if (x, y - 1) in e else "l")
        else:
            c.paint({xy: "d" for xy in e if xy not in c.px})


def side(p, frame=0):
    c = Canvas()
    if p["down"]:
        return lying(c, p, frame)
    hind(c, p, False)
    arm(c, p, False)
    tail(c, p)
    front = torso(c, p)
    hind(c, p, True)
    if p["joey"]:
        joey(c, p, front)
        if p["paws"]["n"][1] > p["chest"][1] + 3:  # her paws rest on the pouch rim, not over the joey
            p["paws"] = {k: add(v, (-0.8, -2.5)) for k, v in p["paws"].items()}
    head(c, p)
    arm(c, p, True)
    return c.finish()


def lying(c, p, frame):
    """On its side with the hind legs stretched out forward, the chest up on
    an elbow, the head up: a man lounging on a riverbank."""
    g = GM
    b = p["breath"]
    lift = p.get("lift", 0)
    w = 1.12 if K["wool"] else 1.0
    tl = tube([(15, g - 2.4), (9, g - 1.2), (3, g - 0.9)], [2.3 * w, 1.5 * w, 0.8])
    tp = shade(tl, 1, 1)
    if K["dark"]:
        tp.update({xy: "t" for xy in tl if xy[0] < T((6, 0))[0]})
    c.paint(tp)
    c.paint({xy: "t" if K["dark"] else "d" for xy in tube([(29, g - 2.6), (37, g - 2.4)], [1.1, 0.8])})
    hip, ch = (20.0, g - 4.8), (29.0, g - 7.5 - lift * 0.4)
    m = disk(*hip, 4.8 * w + b * 0.3) | tube([hip, lerp(hip, ch, 0.5), ch], [4.5 * w + b * 0.3, 3.6 + b * 0.3, 2.8])
    m = {xy for xy in m if xy[1] <= T((0, g))[1]}
    px = shade(m, 1, 1)
    for x, y in m:
        if ((x, y + 1) not in m or (x, y + 2) not in m) and (x, y - 2) in m and x > T(hip)[0]:
            px[(x, y)] = "b"
    hx, hy = T(hip)
    rr = 4.2 * rig.S["s"]
    hm = disk(hip[0] + 0.4, hip[1] - 0.2, 4.2)
    for x, y in hm:
        d = math.hypot(x - hx, y - hy) / rr
        ang = math.atan2(y - hy, x - hx)
        outside = [q for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)) if q not in hm]
        if outside and any(q in m for q in outside) and -0.6 < ang < 2.0:
            px[(x, y)] = "d"
        elif 0.5 < d < 0.85 and -2.5 < ang < -1.0:
            px[(x, y)] = "h"
    c.paint(px)
    if F["joey"] and p["joey"]:
        jm = disk(27.0, g - 4.6, 1.2) | tube([(27.0, g - 4.6), (28.4, g - 4.2)], [1.0, 0.7])
        laid(c, jm, flat_on(c, shade(jm, 1, 0)))
        c.px[at((27.6, g - 5.0))] = "e"
        c.paint({xy: "m" for xy in tube([(26.6, g - 5.6), (26.0, g - 7.4)], [0.6, 0.4])})
    knee = (24.5, g - 3.4)
    shin = tube([knee, (29.5, g - 1.5)], [2.0, 1.3])
    foot = tube([(29.5, g - 1.4), (38.0, g - 1.1)], [1.25, 0.85])
    lp = flat_on(c, shade(shin | foot, 1, 1))
    if K["dark"]:
        lp.update({xy: "t" for xy in foot - shin if lp[xy] == "m"})
    laid(c, shin | foot, lp)
    c.px[at((38.6, g - 0.9))] = "k"
    ah = tube([(30.0, g - 6.5), (31.0, g - 1.6), (34.0, g - 1.0)], [1.2, 1.0, 0.8])
    ap = flat_on(c, shade(ah, 1, 1))
    ap[at((34.3, g - 1.0))] = "t"
    hp = pose(chest=ch, head=(32.5, g - 12.5 + lift), look=12 + lift * 8, ears=p["ears"], eye=p["eye"], mouth=p["mouth"])
    head(c, hp)
    laid(c, ah, ap)
    return c.finish()


# ------------------------------------------------------------------ gaits
def idle(frame):
    """Up on the tail, looking about; an ear turns, a blink, and once a
    forearm licked and the chest scratched."""
    t = frame / 16
    look = smooth([(0, 14.0), (0.25, 14.0), (0.32, 2.0), (0.45, 2.0), (0.5, 14.0)], t)
    groom = 8 <= frame <= 13
    ears = "swivel" if frame in (3, 4, 5) else "fwd" if frame == 6 else "up"
    p = pose(look=look, ears=ears, eye="closed" if frame in (2, 15) or groom else "open",
             breath=1 if frame % 8 in (2, 3, 4) else 0, joey=F["joey"] and 4 <= frame <= 12)
    if groom:
        if frame <= 10:  # a forearm up to the mouth, licked
            lick = frame % 2
            p["head"] = (24.5, GM - 19.5)
            p["look"] = 60 + lick * 8
            p["paws"] = dict(n=(27.5, GM - 16.5 - lick * 0.6), f=(28.0, GM - 15.5))
            p["ears"] = "back"
        else:  # a forepaw scratching at the chest
            sc = frame % 2
            p["look"] = 40
            p["paws"] = dict(n=(25.5, GM - 13.5 + sc * 1.5), f=(26.8, GM - 10.8))
    return p


def pentapedal(t, low=0.0):
    """Paws and tail take the weight; both hind feet swing forward together,
    then the paws reach on. Returns a pose for cycle position t."""
    hdx, hup = walk_foot(t + 0.55, 3.2, 3.0, 0.55)
    pdx, pup = walk_foot(t + 0.05, 2.4, 1.6, 0.65)
    ph = (t + 0.55) % 1
    swing = 0.0 if ph < 0.55 else math.sin(math.pi * (ph - 0.55) / 0.45)
    hip = (20.0 + hdx * 0.45, GM - 7.5 - swing * 1.6)
    ch = (27.5 + pdx * 0.3 + hdx * 0.15, GM - 10.0 + low)
    heel = (17.5 + hdx, GM - 0.9 - hup * 0.6)
    toe = (25.0 + hdx, GM - 0.8 - hup)
    paw = (31.5 + pdx, GM - 0.6 - pup)
    base = add(hip, (-4.4, 2.6))
    touch = (10.0 - hdx * 0.35, GM - 1.0 - swing * 0.5)
    return dict(hip=hip, chest=ch, hr=5.6,
                feet=dict(n=(heel, toe), f=(add(heel, (1.6, -0.3)), add(toe, (1.6, -0.3)))),
                paws=dict(n=paw, f=add(paw, (1.6, -0.4))),
                tail=[base, lerp(base, touch, 0.55), touch, add(touch, (-6.0, 0.1))])


def wander(frame):
    q = pentapedal(frame / 8, 0.5)
    return pose(**q, head=add(q["chest"], (4.5, -4.0)), look=22, ears="up")


def graze(frame):
    """Head down cropping on paws and tail, a shuffle forward, then up on
    the haunches to chew and look round."""
    if frame >= 12:
        p = pose(look=12, ears="swivel" if frame in (13, 14) else "up", joey=F["joey"])
        p["mouth"] = frame % 2
        return p
    t = (frame - 5) / 6 if 5 <= frame <= 10 else 0.0
    q = pentapedal(t, 1.0)
    tug = frame % 2
    q["paws"] = dict(n=add(q["paws"]["n"], (-1.5, 0)), f=add(q["paws"]["f"], (-1.5, 0)))
    return pose(**q, head=add(q["chest"], (6.0, 4.6 - tug * 0.6)), look=58 - tug * 6,
                ears="up" if frame % 4 else "swivel")


# The bound, frame by frame: body lift; hind heel and toe as offsets from the
# hip; the tail's pitch. The tail rises as the legs swing forward and drops as
# they drive back, so the body rides level.
BOUND = [
    # lift, heel,          toe,           tail, pitch
    (0.0, (2.5, 7.4), (8.5, 9.0), 8, 4),
    (-1.0, (-1.0, 7.0), (5.0, 8.6), 2, 6),
    (0.8, (-4.0, 6.6), (1.0, 10.0), -6, 3),
    (3.0, (-6.5, 5.6), (-9.5, 10.5), -12, -2),
    (5.0, (-8.0, 4.0), (-14.5, 6.5), -10, -4),
    (5.8, (-5.0, 4.4), (0.5, 6.8), 0, -2),
    (4.4, (0.5, 5.4), (6.5, 7.8), 10, 0),
    (2.0, (3.0, 6.4), (9.0, 8.6), 12, 2),
]


def bound(frame):
    lift, heel, toe, tl, pitch = BOUND[frame]
    hip = (23.5, GM - 9.5 - lift)
    ch = add(hip, rot((9.5, 0), -24 + pitch))
    hd = add(ch, rot((4.0, -4.0), pitch))
    base = add(hip, (-4.6, -0.2))
    tail_ = [base] + [add(base, rot((-v, 0), -tl * (0.5 + v / 20))) for v in (4.5, 9.5, 14.0)]
    heel_, toe_ = add(hip, heel), add(hip, toe)
    if toe_[1] > GM - 0.8:
        toe_ = (toe_[0], GM - 0.8)
    if heel_[1] > GM - 1.2:
        heel_ = (heel_[0], GM - 1.2)
    return pose(hip=hip, chest=ch, head=hd, look=6 + pitch, hr=5.5, ears="back", front_neck=False,
                feet=dict(n=(heel_, toe_), f=(add(heel_, (1.5, -0.6)), add(toe_, (1.5, -0.6)))),
                paws=dict(n=add(ch, (2.2, 3.4)), f=add(ch, (3.0, 2.8))), tail=tail_)


JAB = [(0, 0), (4, 0), (1, 0), (0, 4), (2, 2), (2, 2), (0, 2), (0, 0)]
RISE = [0.0, 1.0, 1.0, 1.0, 2.5, 2.5, 1.0, 0.0]


def box(frame):
    """Reared tall on toes and tail, head back out of reach, pawing at the
    other's face; then back on the tail and both feet kick."""
    kick = frame in (4, 5)
    rise = RISE[frame]
    hip = (19.0 - (1.5 if kick else 0), GM - 10.0 - rise)
    ch = (20.5 - (2.0 if kick else 0), GM - 20.5 - rise * 0.6)
    hd = add(ch, (1.2, -5.2))
    jab = JAB[frame]
    paws = dict(n=add(ch, (3.5 + jab[0], -1.0 - jab[0] * 0.5)), f=add(ch, (4.0 + jab[1], -0.2 - jab[1] * 0.5)))
    if kick:
        k = 1.0 if frame == 4 else 1.35
        heel, toe = add(hip, (4.5 * k, 5.5)), add(hip, (11.0 * k, 4.5 - k))
        tail_ = [add(hip, (-3.2, 3.0)), (11.0, GM - 1.0), (6.5, GM - 0.8), (3.5, GM - 0.8)]
    else:
        heel, toe = (19.0 + rise, GM - 2.2 - rise), (25.5, GM - 0.8)
        tail_ = [add(hip, (-3.2, 3.0)), (11.0, GM - 1.0), (4.0, GM - 0.8)]
    feet = dict(n=(heel, toe), f=(add(heel, (1.4, -0.5)), add(toe, (1.4, -0.5))))
    return pose(hip=hip, chest=ch, head=hd, look=-4 if not kick else 8, hr=5.6, ears="back",
                mouth=1 if jab != (0, 0) else 0, feet=feet, paws=paws, tail=tail_)


def rest(frame):
    return pose(down=True, breath=1 if frame % 8 in (2, 3, 4, 5) else 0,
                lift=-2.0 if 10 <= frame <= 13 else 0.0,
                eye="closed" if 10 <= frame <= 13 else "open",
                ears="swivel" if frame in (4, 5) else "droop" if 10 <= frame <= 13 else "up",
                joey=4 <= frame <= 9)


# ------------------------------------------------------------ front and back
FEAR = {"up": (6, 6), "swivel": (6, 34), "fwd": (2, 2), "back": (30, 30), "droop": (50, 50), "flat": (60, 60)}


class Front:
    """Parts for a kangaroo seen end-on, centred on cx with the ground at g."""

    def __init__(self, c, cx, g, south):
        self.c, self.cx, self.g, self.south = c, cx, g, south
        self.s = rig.S["s"]
        self.w = 1.08 if K["wool"] else 1.0

    def shaded(self, m, top=1, bottom=1, over=True, rim=None):
        px = shade(m, top, bottom)
        px = flat_on(self.c, px) if over else px
        if rim:
            laid(self.c, m, px, rim)
        else:
            self.c.paint(px)

    def ears(self, hx, hy, mode):
        for sgn, tl in zip((-1, 1), FEAR[mode]):
            b = (hx + sgn * 1.3, hy - 1.5)
            tip = add(b, rot((0, -4.6 if tl < 25 else -3.0), sgn * (tl * 0.5 + 14)))
            e = tube([b, lerp(b, tip, 0.45), tip], [0.95, 1.1, 0.4])
            inner = {at(lerp(b, tip, 0.5)), at(lerp(b, tip, 0.68))}
            rimmed(self.c, e, lambda x, y: "p" if self.south and (x, y) in inner and tl < 30 else "m" if (x, y - 1) in e else "l")

    def face(self, hx, hy, eye=True, mouth=False, down=0.0, ring=False):
        c = self.c
        if not self.south:
            self.shaded(disk(hx, hy, 2.2))
            return
        ml = 2.4 + down
        m = disk(hx, hy, 2.2) | tube([(hx, hy), (hx, hy + ml)], [1.9, 1.3])
        hp = shade(m, 1, 1)
        for x, y in m:
            if y >= T((0, hy + 1.4 + down))[1]:
                hp[(x, y)] = "b"
        if ring:  # a head held low against its own body: lit, and edged softly
            laid(c, m, {xy: {"m": "l", "l": "h"}.get(r, r) for xy, r in hp.items()})
        else:
            c.paint(hp)
        X, Y = T((hx, hy - 0.4))
        for sgn in (-1, 1):  # in pixels, not model units, so a doe's eyes do not run together
            c.px[(round(X - 0.5 + sgn * 1.4), round(Y))] = "e" if eye else "d"
        nose = at((hx, hy + ml + 0.6))
        c.px[nose] = "k"
        c.px[(nose[0] - 1, nose[1])] = "k"
        if mouth:
            c.px[(nose[0], nose[1] + 1)] = "p"

    def foot(self, x, top, bot, sole=False):
        """A hind foot pointing at the camera: the toe nearest, lowest."""
        m = tube([(x, top), (x, bot)], [1.25, 1.45])
        if K["dark"]:
            px = {xy: "t" for xy in m}
        else:
            px = shade(m, 1, 1)
        self.c.paint(px)
        self.c.px[at((x, bot + 0.8))] = "k" if self.south and not sole else ("t" if K["dark"] else "d")

    def upright(self, y0=0.0, head=0.0, ears="up", eye=True, mouth=False, arms=None, joey=False, kick=0.0, look=0.0,
                tall=1.0, reach=None):
        """Sitting up or reared: a pear, haunches wide at the foot and the
        chest narrow. A bound toward the camera is the same figure
        foreshortened (tall), the feet under it when swung forward (reach 1)
        and tucked when back."""
        c, cx, g, w, s = self.c, self.cx, self.g, self.w, self.s
        hy, cy = g - 5.5 + y0, g - 6.0 - 9.0 * tall + y0
        hdy = cy - 4.5 + head
        arms = arms or [(-0.8, 3.2), (0.8, 3.2)]
        X = T((cx, 0))[0] - 0.5
        body = disk(cx, hy, 5.4 * w, 0.9) | tube([(cx, hy), (cx, cy)], [4.7 * w, 2.6 * w]) | disk(cx, cy, 2.6 * w)
        if self.south:
            for sgn in (-1, 1):
                if kick:
                    self.foot(cx + sgn * 2.4, g - 6 + y0, g - 3.5 + y0 + kick * 1.4)
                elif reach is not None:
                    self.foot(cx + sgn * 2.6, g - 3.5 + y0, g - 2.8 + y0 + reach * 3.0)
                else:
                    self.foot(cx + sgn * 2.9, g - 1.8 + y0 * 0.3, g + 0.3 + y0 * 0.3)
            belly = disk(cx, hy - 0.5, 2.9 * w, 1.1) | tube([(cx, hy - 0.5), (cx, cy + 1.2)], [2.9 * w, 1.3])
            bp = shade(body, 1, 1)
            for x, y in body:
                if (x, y) in belly and bp[(x, y)] != "l":
                    bp[(x, y)] = "b"
                elif bp[(x, y)] == "m" and abs(x - X) > 3.2 * s and y < T((0, hy))[1] and (x + (1 if x > X else -1), y - 1) not in body:
                    bp[(x, y)] = "h"  # the crown of each thigh
            for x, y in body:
                if bp[(x, y)] == "m" and any(q in belly for q in ((x + 1, y), (x - 1, y))) and y > T((0, hy - 2))[1]:
                    bp[(x, y)] = "d"  # thigh against belly
            c.paint(bp)
            if joey:
                self.joey(cx, hy + 0.2)
            for sgn, (ax, ay) in zip((-1, 1), arms):
                sh = (cx + sgn * 2.0, cy + 0.4)
                paw = (cx + ax, cy + ay)
                m = tube([sh, lerp(sh, paw, 0.5), paw], [1.1, 0.9, 0.75])
                px = shade(m, 1, 1)
                px[at(paw)] = "t"
                laid(c, m, flat_on(c, px))
            nk = tube([(cx, cy - 0.5), (cx, hdy + 1)], [2.0 * w, 1.7])
            np_ = flat_on(c, shade(nk, 1, 1))
            c.paint({xy: "b" if r == "m" and abs(xy[0] - X) < 1.1 * s else r for xy, r in np_.items()})
            self.ears(cx, hdy, ears)
            self.face(cx, hdy + look, eye, mouth)
            return
        # north: the head beyond, the back, the two haunches, the tail on the ground toward us
        self.ears(cx, hdy, ears)
        self.face(cx, hdy)
        for sgn, (ax, ay) in zip((-1, 1), arms):
            if abs(ax) > 2.4:  # elbows out past the body when sparring
                sh = (cx + sgn * 2.0, cy + 0.6)
                c.paint({xy: "d" for xy in tube([sh, (cx + ax, cy + ay)], [1.0, 0.8])})
        self.shaded(tube([(cx, hdy + 1), (cx, cy)], [1.7, 2.1 * w]))
        for sgn in (-1, 1):
            if kick:
                self.foot(cx + sgn * 2.6, g - 7 + y0, g - 5 + y0 + kick, sole=True)
            else:
                self.foot(cx + sgn * 3.6, g - 2.2 + y0 * 0.3, g - 0.6 + y0 * 0.3, sole=True)
        bp = shade(body, 1, 1)
        for x, y in body:
            if abs(x - X) < 0.6 and bp[(x, y)] == "m" and y < T((0, hy - 3))[1]:
                bp[(x, y)] = "d"
        c.paint(bp)
        for sgn in (-1, 1):
            hm = disk(cx + sgn * 2.6, hy + 0.4, 3.3 * w)
            c.paint({xy: "h" for xy, r in shade(hm, 1, 0).items() if r == "l"})
        self.tail_toward(cx, hy + 2.0, g + 2.2 + y0 * 0.2)

    def tail_toward(self, x, top, tip, sway=0.0):
        m = tube([(x, top), (x + sway * 0.5, lerp(top, tip, 0.5)), (x + sway, tip)], [2.2 * self.w, 1.7, 1.0])
        px = shade(m, 1, 1)
        if K["dark"]:
            for xy in m:
                if xy[1] >= T((0, tip - 2))[1]:
                    px[xy] = "t"
        laid(self.c, m, px)

    def joey(self, x, y):
        lip = tube([(x - 2.2, y + 1.2), (x, y + 1.8), (x + 2.2, y + 1.2)], [0.5, 0.6, 0.5])
        self.c.paint({xy: "d" for xy in lip})
        m = disk(x, y, 1.5) - lip
        for sgn in (-1, 1):
            self.c.paint({xy: "l" for xy in tube([(x + sgn * 0.8, y - 1.0), (x + sgn * 1.6, y - 3.0)], [0.6, 0.4])})
        laid(self.c, m, {xy: "h" if r == "l" else "l" for xy, r in shade(m, 1, 0).items()})
        X, Y = T((x, y - 0.2))
        for sgn in (-1, 1):
            self.c.px[(round(X - 0.5 + sgn * 1.0), round(Y))] = "e"

    def hunched(self, y0=0.0, head=0.0, hup=0.0, pup=(0.0, 0.0), ears="up", mouth=False, eye=True, tail_lift=0.0):
        """On paws and tail: from the front the head low before the shoulders
        and the rump rising behind; from behind, the rump and tail nearest."""
        c, cx, g, w = self.c, self.cx, self.g, self.w
        if self.south:
            ry = g - 9.0 + y0 - hup * 0.6
            for sgn in (-1, 1):
                self.foot(cx + sgn * 4.4, g - 2.2 - hup, g - 0.2 - hup)
            rump = disk(cx, ry, 5.9 * w, 0.85)
            rp = shade(rump, 1, 1)
            for x, y in rump:
                if rp[(x, y)] == "m" and (x, y - 2) not in rump:
                    rp[(x, y)] = "h"
            c.paint(rp)
            sh = disk(cx, g - 6.0 + y0 * 0.5, 3.4 * w, 0.9)
            self.shaded(sh, 1, 1, over=False)
            for sgn, up in zip((-1, 1), pup):
                paw = (cx + sgn * 2.4, g - 0.4 - up)
                m = tube([(cx + sgn * 2.2, g - 5.5), paw], [1.1, 0.8])
                px = shade(m, 1, 1)
                px[at(paw)] = "t"
                laid(c, m, flat_on(c, px))
            hy = g - 5.5 + head
            self.face(cx, hy, eye, mouth, down=0.6 if head > 2 else 0.0, ring=True)
            for sgn, tl in zip((-1, 1), FEAR[ears]):  # short ears, cocked toward us over the crown
                b = (cx + sgn * 1.4, hy - 1.4)
                e = tube([b, add(b, rot((0, -3.2), sgn * (tl * 0.5 + 18)))], [0.9, 0.45])
                laid(c, e, {xy: "h" if (xy[0], xy[1] - 1) not in e else "l" for xy in e})
            return
        hy = g - 9.0 + head * 0.3
        self.ears(cx, hy, ears)
        self.shaded(disk(cx, hy, 2.0))
        for sgn, up in zip((-1, 1), pup):
            c.paint({xy: "d" for xy in tube([(cx + sgn * 2.2, g - 6.0), (cx + sgn * 2.4, g - 1.5 - up)], [1.0, 0.8])})
        for sgn in (-1, 1):
            self.foot(cx + sgn * 4.2, g - 3.0 - hup, g - 1.2 - hup, sole=True)
        back = disk(cx, g - 7.0 + y0, 4.0 * w, 0.9) | disk(cx, g - 5.0 + y0 - hup * 0.5, 5.6 * w, 0.85)
        bp = shade(back, 1, 1)
        for x, y in back:
            if abs(x - T((cx, 0))[0] + 0.5) < 0.6 and bp[(x, y)] == "m" and y < T((0, g - 6.5))[1]:
                bp[(x, y)] = "d"
        c.paint(bp)
        for sgn in (-1, 1):
            c.paint({xy: "h" for xy, r in shade(disk(cx + sgn * 2.6, g - 4.6 + y0 - hup * 0.5, 3.2 * w), 1, 0).items() if r == "l"})
        self.tail_toward(cx, g - 3.0 + y0, g + 2.2 - tail_lift)

    def bounding(self, lift, reach, tl, ears="back"):
        """Level and toward the camera, or away from it. reach is 0 with the
        feet driven back and 1 swung forward; tl the tail's pitch."""
        c, cx, g, w = self.c, self.cx, self.g, self.w
        y0 = -lift
        if self.south:
            self.upright(y0=y0 - 1.5, tall=0.7, ears=ears, mouth=True, reach=reach,
                         arms=[(-1.2, 2.6), (1.2, 2.6)])
            return
        hy = g - 13.5 + y0
        self.ears(cx, hy, ears)
        self.shaded(disk(cx, hy, 2.0))
        self.shaded(tube([(cx, hy + 1), (cx, g - 10 + y0)], [1.8, 2.6]))
        back = disk(cx, g - 9.0 + y0, 4.2 * w, 0.9) | disk(cx, g - 6.5 + y0, 5.4 * w, 0.85)
        bp = shade(back, 1, 1)
        for x, y in back:
            if abs(x - T((cx, 0))[0] + 0.5) < 0.6 and bp[(x, y)] == "m" and y < T((0, g - 8 + y0))[1]:
                bp[(x, y)] = "d"
        c.paint(bp)
        for sgn in (-1, 1):
            c.paint({xy: "h" for xy, r in shade(disk(cx + sgn * 2.6, g - 6.0 + y0, 3.2 * w), 1, 0).items() if r == "l"})
        if reach < 0.5:  # driven back: the long feet stream out toward us, soles up
            for sgn in (-1, 1):
                self.foot(cx + sgn * 3.0, g - 4.5 + y0, g - 2.0 + y0 + (0.5 - reach) * 4, sole=True)
        tip = g - 1.0 + y0 * 0.5 - max(0.0, tl) * 0.35 + max(0.0, -tl) * 0.15
        self.tail_toward(cx, g - 5.0 + y0, max(tip, g - 6.5 + y0), sway=0.0)

    def lying(self, frame):
        """Lounging on one side, head up on the elbow at one end."""
        c, cx, g, w = self.c, self.cx, self.g, self.w
        b = 0.4 if frame % 8 in (2, 3, 4, 5) else 0
        doze = 10 <= frame <= 13
        ears = "swivel" if frame in (4, 5) else "droop" if doze else "up"
        if self.south:
            hm = disk(cx - 2.5, g - 5.0 - b, 5.2 * w, 0.75)
            c.paint(shade(hm, 1, 1))
            self.shaded(disk(cx - 2.5, g - 5.8 - b, 3.0 * w), 1, 0, over=False, rim="d")
            for dx, dy in ((-4.5, -0.5), (-1.5, 0.0)):
                self.foot(cx + dx, g - 3.0 + dy, g - 0.2 + dy)
            ch = disk(cx + 2.5, g - 4.5, 3.0 * w, 0.95)
            cp = shade(ch, 1, 1)
            c.paint(flat_on(c, cp))
            paw = (cx + 4.0, g - 0.6)
            m = tube([(cx + 3.5, g - 4.0), paw], [1.1, 0.8])
            px = shade(m, 1, 1)
            px[at(paw)] = "t"
            laid(c, m, flat_on(c, px))
            hy = g - 9.5 + (2 if doze else 0)
            self.shaded(tube([(cx + 2.5, g - 6), (cx + 2.5, hy)], [2.2, 1.8]))
            self.ears(cx + 2.5, hy, ears)
            self.face(cx + 2.5, hy, eye=not doze)
            return
        hy = g - 10.5 + (2 if doze else 0)
        self.ears(cx + 2.5, hy, ears)
        self.shaded(disk(cx + 2.5, hy, 2.1))
        self.shaded(tube([(cx + 2.5, hy + 1), (cx + 2.5, g - 6)], [1.8, 2.4]))
        ch = disk(cx + 2.5, g - 6.0, 3.0 * w, 0.95)
        c.paint(flat_on(c, shade(ch, 1, 1)))
        hm = disk(cx - 1.5, g - 4.5 - b, 5.4 * w, 0.75)
        c.paint(flat_on(c, shade(hm, 1, 1)))
        self.shaded(disk(cx - 1.5, g - 4.8 - b, 3.0 * w), 1, 0, over=False, rim="d")
        self.tail_toward(cx - 3.0, g - 3.0, g + 2.2, sway=-3.0)


def face(state, frame, south):
    c = Canvas()
    cx = WM / 2
    g = GM if south else GM - 2.5
    fr = Front(c, cx, g, south)
    if state == "idle":
        p = idle(frame)
        arms = None
        look = 0.0
        if 8 <= frame <= 10:
            arms = [(-0.6, -2.0 - frame % 2 * 0.5), (1.8, 4.2)]
            look = 0.8
        elif 11 <= frame <= 13:
            arms = [(-1.0, 1.5 + frame % 2 * 1.2), (1.8, 4.2)]
        fr.upright(ears=p["ears"], eye=p["eye"] == "open", joey=p["joey"], arms=arms, look=look,
                   head=0.6 if 8 <= frame <= 10 else 0.0)
    elif state == "graze" and frame >= 12:
        fr.upright(ears="swivel" if frame in (13, 14) else "up", mouth=frame % 2, joey=F["joey"])
    elif state in ("graze", "wander"):
        t = frame / 8 if state == "wander" else ((frame - 5) / 6 if 5 <= frame <= 10 else 0.0)
        hup = walk_foot(t + 0.55, 3.2, 3.0, 0.55)[1]
        pup = walk_foot(t + 0.05, 2.4, 1.6, 0.65)[1]
        if state == "wander":
            fr.hunched(head=-2.5, hup=hup * 0.5, pup=(pup, pup), tail_lift=hup * 0.3)
        else:
            fr.hunched(head=2.5 + (frame % 2) * 0.4, hup=hup * 0.5, pup=(pup, pup), eye=False,
                       ears="up" if frame % 4 else "swivel")
    elif state == "flee":
        lift, heel, toe, tl, pitch = BOUND[frame]
        fr.bounding(lift, max(0.0, min(1.0, (toe[0] + 14.5) / 23.5)), tl)
    elif state == "chase":
        kick = frame in (4, 5)
        jab = JAB[frame]
        fr.upright(y0=-RISE[frame] - 1.5, ears="back", mouth=jab != (0, 0), head=-0.5,
                   arms=[(-3.4 - jab[0] * 0.3, -1.5 - jab[0] * 0.8), (3.4 + jab[1] * 0.3, -1.5 - jab[1] * 0.8)],
                   kick=(1.0 if frame == 4 else 1.8) if kick else 0.0)
    elif state == "rest":
        fr.lying(frame)
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "graze": graze, "wander": wander, "flee": bound, "chase": box, "rest": rest}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, form, state, facing, frame):
    global K, F
    K = KINDS[species]
    F = K["forms"][form]
    rig.use(K["s"] * F["s"], GM, WM, HM, PALETTES[species])
    # a smaller form keeps the species' canvas and stands in its middle
    rig.S.update(W=dims(species)[0], G=dims(species)[1], HR=dims(species)[2])
    if facing in ("east", "west"):
        im = side(SIDE[state](frame), frame)
    else:
        im = face(state, frame, facing == "south")
    if F["s"] != 1.0:
        im = _recentre(im, dims(species)[0])
    return _mirror(im) if facing == "west" else im


def _recentre(im, w):
    """Model x is drawn from the canvas's left edge, so a scaled-down form
    drifts left; slide it back under the anchor."""
    from PIL import Image
    shift = round((w - w * F["s"]) / 2)
    out = Image.new("RGBA", im.size)
    out.paste(im, (shift, 0))
    out.info["anchor"] = im.info.get("anchor")
    return out


def fauna_macropod():
    out = {}
    for sp in SPECIES:
        forms = list(KINDS[sp]["forms"])
        for form in forms:
            art = sp if form == forms[0] else f"{sp}.{form}"
            for state, count in STATES[sp].items():
                for facing in DIRECTIONS:
                    for frame in range(count):
                        out[f"faunak-{art}-{state}-{facing}-{frame}"] = draw(sp, form, state, facing, frame)
    return out


def looks():
    return {sp: {
        "roles": PALETTES[sp],
        "forms": [{"id": f, "weight": w, "where": None, "coats": k["form_coats"][f]} for f, w in k["form_weights"].items()],
        "coats": k["coats"],
        "coatFrom": {},
    } for sp, k in KINDS.items()}
