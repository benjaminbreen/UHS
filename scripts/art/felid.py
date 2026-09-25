"""The great cats of the Ice Age: one cat rig, three animals.

The cave lion is drawn from the Chauvet and Lascaux lions and the frozen cubs
from Yakutia: bigger than a lion of today, pale and thick-coated, and the
males with no mane. The American lion is longer in the leg and tawny.
Smilodon is shorter and far heavier in the forequarters, with a bobbed tail
and sabres that show with the mouth shut; its spotting is a guess.

Every cat walks with its head low and creeps up belly to the grass. A lion
runs its quarry down in a short bounding gallop; Smilodon was built to
ambush, grapple with the forelegs and bite, so its pounce ends clinging.
"""
import math
from art.fauna_b import shade, walk_foot
from art.fauna_d import _mirror, WALK, GALLOP
from art import rig
from art.rig import Canvas, T, at, disk, tube, rot, add, lerp, smooth, noise, rimmed

GM, HM, WM = 32, 18, 68

ROLES = "o d m l h b k e s i p t".split()


def _c(o, d, m, l, h, b, s, t):
    return dict(o=o, d=d, m=m, l=l, h=h, b=b, k="#17120e", e="#c8963a", s=s, i="#efe6d0", p="#8a4a45", t=t)


KINDS = {
    # 1.2 m at the shoulder, a tenth bigger than a lion now.
    "cave-lion": dict(s=1.0, leg=1.0, fore=1.0, tail=1.0, sabre=False, spots=False, head=1.0, coats={
        "pale": _c("#2a2118", "#7a6a55", "#a8977c", "#c4b59b", "#dbcfb8", "#ebe4d6", "#8f8069", "#3a3026"),
        "grey": _c("#24211c", "#6c655b", "#948c80", "#b3aca0", "#cdc7bc", "#e6e2da", "#7d766b", "#34302a"),
    }, weights={"pale": 3, "grey": 1}),
    "american-lion": dict(s=1.08, leg=1.1, fore=1.0, tail=1.0, sabre=False, spots=False, head=1.0, coats={
        "tawny": _c("#2b1d10", "#8a6436", "#b58a52", "#cea56d", "#e2c28b", "#efe2c8", "#9a7040", "#3a2616"),
    }, weights={"tawny": 1}),
    # About a metre at the shoulder but as heavy as a big lion.
    "smilodon": dict(s=0.92, leg=0.85, fore=1.35, tail=0.3, sabre=True, spots=True, head=1.1, coats={
        "tawny": _c("#28190d", "#7d5a33", "#a9804c", "#c49c67", "#dab785", "#ecdcc0", "#6e4c28", "#3a2616"),
        "dark": _c("#1f150c", "#634628", "#86633b", "#a47d51", "#bd9a6d", "#ddcbab", "#533920", "#2c1d10"),
    }, weights={"tawny": 3, "dark": 1}),
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
STATES = {sp: {"idle": 16, "wander": 8, "stalk": 8, "chase": 8, "flee": 8, "pounce": 8, "rest": 16} for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}

K = KINDS["cave-lion"]


# ---------------------------------------------------------------- side view
def pose(**k):
    lg = K["leg"]
    top = GM - 21 * lg
    p = dict(hip=(24.0, top + 4), sh=(42.0, top + 3), head=(50.0, top + 1), look=10.0,
             feet=dict(fh=(22.0, GM), nh=(25.0, GM), ff=(41.0, GM), nf=(44.0, GM)),
             tail=[(0, 0), (-5, 3), (-9, 8), (-11, 13)], ears="up", eye="open", mouth=0, breath=0,
             arch=0.0, down=False, reach=None)
    p.update(k)
    return p


def body(c, p):
    hip, sh = p["hip"], p["sh"]
    spine = (sh[0] - hip[0], sh[1] - hip[1])
    n = math.hypot(*spine) or 1
    up = (spine[1] / n, -spine[0] / n)
    mid = add(lerp(hip, sh, 0.5), up, p["arch"])
    b = p["breath"] * 0.3
    fr = K["fore"]
    mask = tube([add(hip, (-1.5, 0)), hip, mid, sh], [4.6, 5.3 + b, 5.6 + b, 6.0 * fr + b])
    px = shade(mask, 1, 1)
    for x, y in mask:
        if (x, y + 1) not in mask or (x, y + 2) not in mask:
            if (x, y - 3) in mask:
                px[(x, y)] = "b"
        if K["spots"] and px[(x, y)] in "ml" and (x + 2 * y) % 5 == 0 and noise(x, y) > 0.55:
            px[(x, y)] = "s"
    c.paint(px)
    return mask


def head(c, p):
    hx, hy = p["head"]
    look = p["look"]
    sh = p["sh"]
    hs = K["head"]
    fwd = rot((1, 0), look)
    down = rot((0, 1), look)
    neck = tube([add(sh, (1, -1)), (hx, hy)], [4.2 * K["fore"], 3.0 * hs])
    c.paint({xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in shade(neck, 1, 1).items()})
    skull = disk(hx, hy, 3.7 * hs)
    muzzle = tube([add((hx, hy), fwd, 2 * hs), add(add((hx, hy), fwd, 5.2 * hs), down, 0.8)], [2.9 * hs, 2.3 * hs])
    jaw = tube([add(add((hx, hy), fwd, 0.5), down, 2.3), add(add((hx, hy), fwd, 4.2 * hs), down, 2.4 + p["mouth"] * 2.2)],
               [2.0 * hs, 1.4 * hs])
    hm = skull | muzzle | jaw
    hp = shade(hm, 1, 1)
    hxp, hyp = T((hx, hy))
    for x, y in hm:
        v = (x - hxp, y - hyp)
        if v[0] * down[0] + v[1] * down[1] > 1.3 * rig.S["s"] and v[0] * fwd[0] + v[1] * fwd[1] > 0.5:
            hp[(x, y)] = "b"
    c.paint(hp)
    nose = at(add(add((hx, hy), fwd, 6.0 * hs), down, 0.1))
    c.px[nose] = "k"
    if p["mouth"]:
        c.px[at(add(add((hx, hy), fwd, 3.2 * hs), down, 2.3))] = "p"
        c.px[at(add(add((hx, hy), fwd, 2.6 * hs), down, 2.3))] = "p"
    if K["sabre"]:  # hanging below the chin even with the mouth shut
        root = add(add((hx, hy), fwd, 4.3 * hs), down, 2.2)
        for i in range(4 + 2 * p["mouth"]):
            q = at(add(root, rot((-0.25, 1), look), i * 0.9))
            c.px[q] = "i"
    ex, ey = at(add(add((hx, hy), fwd, 2.4 * hs), down, -0.8))
    c.px[(ex, ey)] = "e" if p["eye"] == "open" else "d"
    c.px[(ex + 1, ey)] = "k" if p["eye"] == "open" else "d"
    # small round ears, flattened in the charge
    lay = {"up": 0, "back": 1, "flat": 2}[p["ears"]]
    for off in ((-1.6, -2.4), (-0.4, -2.9)):
        b = add((hx, hy), rot((off[0] * hs, off[1] * hs), look))
        e = disk(b[0] - lay * 0.8, b[1] - 0.8 + lay * 0.9, 1.3 * hs, 1.0 - lay * 0.25)
        rimmed(c, e, lambda x, y: "d" if (x, y - 1) not in e else "m")


def legs(c, p, near):
    """Hind: thigh, knee forward, hock back, the long foot to the paw. Fore:
    straight from the elbow, the paw folding back as it lifts; reaching out
    in the spring."""
    hip, sh = p["hip"], p["sh"]
    lg, fr = K["leg"], K["fore"]
    for key in (("nh", "nf") if near else ("fh", "ff")):
        hind = key.endswith("h")
        fx, fy = p["feet"][key]
        up = max(0.0, GM - fy)
        if hind:
            root = add(hip, (0.5, 1.5))
            knee = add(root, (3 + up * 0.2, 6 * lg))
            hock = (fx - 3 - up * 0.3, fy - 6 * lg + up * 0.2)
            m = tube([root, knee, hock, (fx, fy - 0.8)], [4.0, 2.4, 1.5, 1.4])
        else:
            root = add(sh, (0.5, 2))
            elbow = add(root, (-0.5 + (p["reach"] or 0) * 0.3, 7 * lg))
            wrist = (fx + (up * 0.4 if not p["reach"] else 0), fy - 2.5)
            m = tube([root, elbow, wrist, (fx + 0.5, fy - 0.8)], [3.8 * fr, 2.6 * fr, 1.9 * fr, 1.7 * fr])
        if near:
            tp = shade(m, 1, 1)
            tp = {xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in tp.items()}
        else:
            tp = {xy: "d" for xy in m}
        c.paint(tp)
        paw = at((fx + (0.5 if not hind else 0), fy))
        c.px[paw] = "k" if near else "d"


def tail(c, p):
    base = add(p["hip"], (-4.5, -1.5))
    k = K["tail"]
    pts = [add(base, (v[0] * k, v[1] * max(k, 0.5))) for v in p["tail"]]
    if k < 0.5:
        pts = pts[:2]
    m = tube(pts, [1.3, 1.1, 0.9, 0.8][: len(pts)])
    c.paint({xy: "m" for xy in m})
    end = at(pts[-1])
    c.px[end] = "t"
    if k >= 0.5:
        c.px[(end[0], end[1] + 1)] = "t"


def lying(c, p, frame):
    """Flat on its side after a meal, as lions lie: legs out, the belly
    rising, the tail tip twitching."""
    g = GM
    breath = p["breath"]
    m = tube([(18, g - 3.5), (28, g - 4.5 - breath * 0.4), (38, g - 4.2)], [3.6, 4.4 + breath * 0.3, 4.0])
    px = shade(m, 1, 1)
    for x, y in m:
        if (x, y + 1) not in m:
            px[(x, y)] = "b"
        if K["spots"] and px[(x, y)] in "ml" and noise(x * 7 + y, 3) > 0.83:
            px[(x, y)] = "s"
    c.paint(px)
    for a, b in (((36, g - 2), (44, g - 1)), ((34, g - 2), (41, g - 0.5)), ((20, g - 2), (13, g - 0.5))):
        c.paint({xy: "d" for xy in tube([a, b], [1.5 * K["fore"], 1.2])})
    k = K["tail"]
    tw = 1 if frame in (5, 6, 12) else 0
    tp = [(16, g - 3), (12, g - 2), (8 * k + 8 * (1 - k), g - 1.5 - tw)]
    c.paint({xy: "m" for xy in tube(tp[: 2 if k < 0.5 else 3], [1.2, 1.0, 0.8])})
    hx, hy = 43.0, g - 5.0
    lift = 1.5 if 9 <= frame <= 11 else 0
    hp = pose(head=(hx, hy - lift), look=15 if not lift else -5, eye="open" if lift else "closed",
              ears="up", sh=(39.0, g - 5.0), mouth=1 if frame == 10 else 0)
    head(c, hp)


def side(p, frame=0):
    c = Canvas()
    if p["down"]:
        lying(c, p, frame)
        return c.finish()
    legs(c, p, False)
    tail(c, p)
    body(c, p)
    legs(c, p, True)
    head(c, p)
    return c.finish()


# ------------------------------------------------------------------ gaits
def walk(frame):
    """Head low and swinging, shoulder blades rolling over the back."""
    t = frame / 8
    feet = {}
    for key, x in dict(fh=22.0, nh=25.0, ff=41.0, nf=44.0).items():
        dx, up = walk_foot(t + WALK[key], 3.0, 2.6, 0.6)
        feet[key] = (x + dx, GM - up)
    lg = K["leg"]
    top = GM - 21 * lg
    roll = math.sin(4 * math.pi * t) * 0.5
    sw = math.sin(2 * math.pi * t)
    return pose(feet=feet, sh=(42.0, top + 3 - roll), hip=(24.0, top + 4 + roll), head=(50.0, top + 3.5), look=18,
                tail=[(0, 0), (-5, 3), (-9, 7 + sw), (-11, 11 + sw * 1.5)])


def stalk(frame):
    """Belly to the grass, shoulders up, head level and dead still, one paw
    set down at a time; the tail tip alone moves."""
    seq = [("nh", 0.0), ("nh", 1.0), ("fh", 0.0), ("ff", 1.0), ("nf", 0.4), ("nf", 1.0), ("nf", 1.6), ("fh", 1.0)]
    base = dict(fh=(21.0, GM), nh=(24.0, GM), ff=(42.0, GM), nf=(45.0, GM))
    feet = dict(base)
    key, u = seq[frame]
    if u < 2:
        lift = math.sin(math.pi * min(u, 1)) * (2.4 if key == "nf" else 1.2)
        if key == "nf" and 0.3 < u < 1.7:
            lift = 2.4
        feet[key] = (base[key][0] + (u - 1) * 0.6, GM - lift)
    lg = K["leg"]
    top = GM - 21 * lg
    creep = [0, 0.3, 0.5, 0.7, 0.8, 0.8, 0.8, 1.0][frame] * 0.6
    twitch = [0, 0, 1, 0, 0, -1, 0, 0][frame]
    return pose(feet=feet, hip=(24 + creep, top + 9), sh=(42 + creep, top + 7), head=(50 + creep, top + 7), look=0,
                ears="up", tail=[(0, 0), (-5, 2), (-10, 3), (-13, 2 - twitch)])


def gallop(frame, ears="back"):
    """Bunch and stretch: a cat's spine does half the running."""
    t = frame / 8
    stretch = math.cos(2 * math.pi * (t - 0.1))
    lg = K["leg"]
    top = GM - 21 * lg
    hip = (24 - stretch * 2.5, top + 5 - 1.5 * max(0.0, stretch))
    sh = (42 + stretch * 2.2, top + 4 - 1.5 * max(0.0, stretch))
    feet = {}
    for key in ("fh", "nh", "ff", "nf"):
        dx, up = walk_foot(t + GALLOP[key], 6.5, 5.5, 0.3)
        hind = key.endswith("h")
        feet[key] = ((hip[0] - 1 if hind else sh[0] + 1) + dx + (1.5 if key[0] == "n" else 0), GM - up)
    return pose(hip=hip, sh=sh, head=add(sh, (8, -1)), look=5, feet=feet, ears=ears, arch=-stretch * 1.2 + 0.4,
                tail=[(0, 0), (-5, -1), (-10, 0), (-14, 2)])


def pounce(frame):
    """Down on the haunches, the spring, forelegs reaching, and down on it.
    The lion lands and bites; Smilodon lands clinging, forelegs round it."""
    lg = K["leg"]
    top = GM - 21 * lg
    g = GM
    keys = [
        dict(hip=(23, top + 9), sh=(41, top + 7), head=(49, top + 7), look=0, ears="up"),
        dict(hip=(22, top + 11), sh=(40, top + 8), head=(48, top + 8), look=5, ears="up",
             feet=dict(fh=(23, g), nh=(26, g), ff=(41, g), nf=(44, g))),
        dict(hip=(25, top + 3), sh=(43, top - 2), head=(51, top - 4), look=-15, ears="back", mouth=1, reach=3,
             feet=dict(fh=(18, g), nh=(20, g - 1), ff=(50, top + 8), nf=(52, top + 7))),
        dict(hip=(30, top - 1), sh=(48, top - 3), head=(56, top - 3), look=0, ears="back", mouth=1, reach=5,
             feet=dict(fh=(22, top + 12), nh=(24, top + 11), ff=(57, top + 6), nf=(59, top + 5))),
        dict(hip=(34, top + 1), sh=(51, top + 3), head=(58, top + 5), look=25, ears="back", mouth=1, reach=5,
             feet=dict(fh=(28, top + 14), nh=(30, top + 13), ff=(58, g - 3), nf=(60, g - 4))),
    ]
    clinging = K["sabre"]
    land = dict(hip=(34, top + 4), sh=(50, top + 6), head=(57, top + 7 + (2 if clinging else 0)), look=40 if clinging else 30,
                ears="flat", mouth=1, reach=4 if clinging else 2,
                feet=dict(fh=(31, g), nh=(34, g), ff=(56, g - (3 if clinging else 0)), nf=(58, g - (4 if clinging else 0))))
    k = keys[frame] if frame < len(keys) else land
    return pose(tail=[(0, 0), (-5, -1), (-9, -2), (-13, -1)], **k)


def idle(frame):
    """Standing, looking out over the grass; an ear, the tail, and once a
    long yawn that shows the teeth."""
    t = frame / 16
    look = smooth([(0, 10.0), (0.3, 10.0), (0.4, 0.0), (0.55, 0.0), (0.65, 10.0)], t)
    yawn = 8 <= frame <= 11
    sw = [0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, -1, -2, -1, 0, 0][frame]
    p = pose(look=-20 if yawn else look, mouth=1 if yawn else 0, eye="closed" if yawn or frame == 14 else "open",
             ears="back" if frame in (3, 4) else "up", breath=1 if frame % 8 in (2, 3, 4) else 0,
             tail=[(0, 0), (-5, 3), (-9, 8), (-11 + sw * 0.4, 13 - abs(sw) * 0.5)])
    if yawn:
        p["head"] = add(p["head"], (0.5, -1))
    return p


def rest(frame):
    return pose(down=True, breath=1 if frame % 8 in (2, 3, 4, 5) else 0)


# ------------------------------------------------------------ front and back
def face(state, frame, south):
    c = Canvas()
    cx = WM / 2
    g = GM
    lg, fr, hs = K["leg"], K["fore"], K["head"]
    top = g - 21 * lg
    n = 16 if state in ("idle", "rest") else 8
    t = frame / n
    lifts, y0, low, mouth, ears, eye, leap = {}, 0.0, 0.0, 0, "up", True, 0.0
    if state in ("wander", "chase", "flee"):
        fast = state != "wander"
        phases, amp, lift, stance = (GALLOP, 6.5, 5.5, 0.3) if fast else (WALK, 3.0, 2.6, 0.6)
        for key in ("fh", "nh", "ff", "nf"):
            lifts[key] = walk_foot(t + phases[key], amp, lift, stance)[1]
        y0 = -abs(math.sin(2 * math.pi * t)) * (2.5 if fast else 0.5)
        ears = "back" if fast else "up"
        low = 0 if fast else 1.5
    elif state == "stalk":
        low = 6
        lifts = {"nf": 2.2 if frame in (4, 5, 6) else 0}
    elif state == "pounce":
        low = [6, 8, 0, 0, 0, 3, 3, 3][frame]
        leap = [0, 0, -5, -8, -3, 0, 0, 0][frame]
        mouth = 1 if frame >= 2 else 0
        ears = "back" if frame >= 2 else "up"
        if 2 <= frame <= 4:
            lifts = dict(ff=6, nf=6, fh=2, nh=2)
    elif state == "idle":
        mouth = 1 if 8 <= frame <= 11 else 0
        eye = not (8 <= frame <= 11 or frame == 14)
    elif state == "rest":
        return face_rest(c, frame, south)
    y0 += leap

    def leg(x, key, ytop, dark, w):
        up = lifts.get(key, 0)
        bottom = g - up + (leap if leap < 0 else 0)
        m = tube([(x, ytop), (x, bottom - 1)], [w, w * 0.8])
        c.paint({xy: "d" for xy in m} if dark else shade(m, 1, 1))
        px, py = at((x, bottom))
        c.px[(px, py)] = "k"

    def ears_at(hx, hy):
        lay = {"up": 0, "back": 1, "flat": 2}[ears]
        for sgn in (-1, 1):
            e = disk(hx + sgn * (2.6 + lay * 0.6) * hs, hy - 2.6 * hs + lay * 0.8, 1.3 * hs, 1 - lay * 0.25)
            rimmed(c, e, lambda x, y: "d" if (x, y - 1) not in e else "m")

    if south:
        for x, key in ((cx - 3.5, "fh"), (cx + 3.5, "nh")):
            leg(x, key, top + 6 + y0 + low, True, 1.6)
        bm = disk(cx, top + 4 + y0 + low, 5.5 * fr, 1.3)
        bp = shade(bm, 1, 1)
        for x, y in bm:
            if K["spots"] and bp[(x, y)] in "ml" and noise(x * 7 + y, 3) > 0.83:
                bp[(x, y)] = "s"
        c.paint(bp)
        for x, key in ((cx - 3, "ff"), (cx + 3, "nf")):
            leg(x, key, top + 8 + y0 + low, False, 1.9 * fr)
        hy = top + 4 + y0 + low * 1.1
        ears_at(cx, hy)
        hm = disk(cx, hy, 3.3 * hs) | disk(cx, hy + 2.2 * hs, 2.4 * hs)
        hp = shade(hm, 1, 1)
        for x, y in hm:
            if y >= T((0, hy + 2.2 * hs))[1]:
                hp[(x, y)] = "b"
        c.paint(hp)
        for sgn in (-1, 1):
            c.px[at((cx + sgn * 1.6 * hs, hy - 0.2))] = "e" if eye else "d"
        nose = at((cx, hy + 1.8 * hs))
        c.px[nose] = "k"
        if mouth:
            c.px[(nose[0], nose[1] + 2)] = "p"
        if K["sabre"]:
            for sgn in (-1, 1):
                for i in range(2 + mouth):
                    c.px[(nose[0] + sgn, nose[1] + 2 + i)] = "i"
        return c.finish()

    # north: the head beyond, the back, the rump and tail nearest
    hy = top + 1 + y0 + low
    ears_at(cx, hy)
    c.paint(shade(disk(cx, hy, 3.1 * hs), 1, 1))
    for x, key in ((cx - 3, "ff"), (cx + 3, "nf")):
        leg(x, key, top + 6 + y0 + low, True, 1.7 * fr)
    bm = disk(cx, top + 6 + y0 + low, 5.2, 1.3)
    bp = shade(bm, 1, 1)
    for x, y in bm:
        if K["spots"] and bp[(x, y)] in "ml" and noise(x * 7 + y, 3) > 0.83:
            bp[(x, y)] = "s"
    c.paint(bp)
    for x, key in ((cx - 3.5, "fh"), (cx + 3.5, "nh")):
        leg(x, key, top + 9 + y0 + low, False, 1.8)
    tl = K["tail"]
    sw = math.sin(2 * math.pi * t) * (1.5 if state != "stalk" else 0.3)
    tp = [(cx, top + 8 + y0 + low), (cx + sw * 0.5, top + 8 + 6 * tl + y0 + low), (cx + sw, top + 8 + 12 * tl + y0 + low)]
    tm = tube(tp if tl >= 0.5 else tp[:2], [1.2, 1.0, 0.8])
    c.paint({xy: "m" for xy in tm})
    c.px[at(tp[-1] if tl >= 0.5 else tp[1])] = "t"
    return c.finish()


def face_rest(c, frame, south):
    g, cx = GM, WM / 2
    breath = 0.4 if frame % 8 in (2, 3, 4, 5) else 0
    m = disk(cx, g - 4 - breath, 7.5, 0.6)
    bp = shade(m, 1, 1)
    c.paint(bp)
    hs = K["head"]
    lift = 1.5 if 9 <= frame <= 11 else 0
    if south:
        hy = g - 6 - lift
        for sgn in (-1, 1):
            e = disk(cx + 3 + sgn * 2.6 * hs, hy - 2.6 * hs, 1.3 * hs)
            rimmed(c, e, lambda x, y: "d")
        c.paint(shade(disk(cx + 3, hy, 3.2 * hs), 1, 1))
        for sgn in (-1, 1):
            c.px[at((cx + 3 + sgn * 1.6 * hs, hy))] = "e" if lift else "d"
        c.px[at((cx + 3, hy + 1.8 * hs))] = "k"
    else:
        c.paint({xy: "m" for xy in tube([(cx - 6, g - 3), (cx - 9, g - 1.5)], [1.2, 0.9])})
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "wander": walk, "stalk": stalk, "chase": lambda f: gallop(f, "flat"),
        "flee": gallop, "pounce": pounce, "rest": rest}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, state, facing, frame):
    global K
    K = KINDS[species]
    rig.use(K["s"], GM, WM, HM, PALETTES[species])
    if facing in ("east", "west"):
        im = side(SIDE[state](frame), frame)
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_felid():
    return {
        f"faunaf-{sp}-{state}-{facing}-{frame}": draw(sp, state, facing, frame)
        for sp in SPECIES
        for state, count in STATES[sp].items()
        for facing in DIRECTIONS
        for frame in range(count)
    }


def looks():
    return {sp: {
        "roles": PALETTES[sp],
        "forms": [{"id": sp, "weight": 1.0, "where": None, "coats": k["weights"]}],
        "coats": k["coats"],
        "coatFrom": {},
    } for sp, k in KINDS.items()}
