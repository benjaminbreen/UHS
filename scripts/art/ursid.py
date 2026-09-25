"""Bears: one plantigrade rig for the cave bear, the short-faced bear, the
brown bear and the polar bear.

Heavy forequarters, flat-footed, the walk a rolling amble with the head swung
low. Every bear stands up on its hind legs now and then to look and smell,
and that is in the idle loop. Foraging, a brown bear rakes and digs for roots
and ground squirrels; a polar bear rears and comes down on its forepaws to
break into a seal's lair under the snow.

The cave bear had a steep domed forehead and, by the isotopes in its bones, a
mostly plant diet. The short-faced bear of the Americas stood far higher on
long legs with a short broad muzzle. The brown bear has the muscle hump over
its shoulders that the others lack; the polar bear a long neck and small head.
"""
import math
from art.fauna_b import shade, walk_foot
from art.fauna_d import _mirror, WALK, GALLOP
from art import rig
from art.rig import Canvas, T, at, disk, tube, rot, add, lerp, smooth, noise, rimmed

GM, HM, WM = 46, 12, 64

ROLES = "o d m l h b k e s p c".split()


def _c(o, d, m, l, h, b, s):
    return dict(o=o, d=d, m=m, l=l, h=h, b=b, k="#120d0a", e="#0a0706", s=s, p="#7a4040", c="#b8ad9c")


KINDS = {
    "brown-bear": dict(s=1.0, leg=1.0, hump=1.0, dome=0.0, snout=1.0, neck=0.0, coats={
        "brown": _c("#170e08", "#3b2414", "#5a3820", "#76502f", "#916741", "#9b7a58", "#2a190d"),
        "dark": _c("#0f0a07", "#26190f", "#3a2718", "#4f3822", "#654b31", "#755b43", "#1a110a"),
        # the silver-tipped grizzly of the American west
        "grizzled": _c("#1a120b", "#4a3522", "#6e553a", "#9a825f", "#c2ad8a", "#a8916f", "#33241a"),
        # the pale Syrian bear of the Near East
        "pale": _c("#2a1d10", "#7a5a36", "#a17c50", "#c09a6a", "#d8b688", "#ccb08a", "#5a3f24"),
    }, weights={"brown": 6, "dark": 3, "grizzled": 2, "pale": 1}),
    "cave-bear": dict(s=1.12, leg=0.95, hump=0.3, dome=1.0, snout=0.9, neck=0.0, coats={
        "brown": _c("#140c07", "#352014", "#50331f", "#6a482d", "#835f3e", "#8a6c4f", "#24160c"),
        "dark": _c("#0e0906", "#22160d", "#332217", "#463121", "#5a412d", "#6a543f", "#170f09"),
    }, weights={"brown": 3, "dark": 2}),
    "short-faced-bear": dict(s=1.3, leg=1.35, hump=0.4, dome=0.3, snout=0.6, neck=0.2, coats={
        "tawny": _c("#1d130a", "#5c3f22", "#835d35", "#a47a4a", "#bf9562", "#b69a74", "#3d2a16"),
    }, weights={"tawny": 1}),
    "polar-bear": dict(s=1.1, leg=1.0, hump=0.0, dome=0.0, snout=1.15, neck=1.0, coats={
        "white": _c("#5d5a55", "#b7b2a6", "#d6d1c4", "#ebe7dc", "#faf8f2", "#e8e2d2", "#a8a294"),
        # stained yellow by summer's seal oil
        "summer": _c("#5e5645", "#b3a888", "#d1c6a4", "#e5dcbe", "#f3ecd4", "#e4d8b8", "#a2977a"),
    }, weights={"white": 1}, seasons={"white": {"summer": "summer"}}),
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
STATES = {sp: {"idle": 16, "forage": 16, "wander": 8, "flee": 8, "chase": 8, "rest": 16} for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}

K = KINDS["brown-bear"]


# ---------------------------------------------------------------- side view
def pose(**k):
    lg = K["leg"]
    top = GM - 20 * lg
    nk = K["neck"]
    p = dict(hip=(21.0, top + 6), sh=(37.0, top + 6), head=(46.0 + nk * 3, top + 8 - nk * 1.5), look=15.0,
             feet=dict(fh=(19.0, GM), nh=(22.0, GM), ff=(36.0, GM), nf=(39.0, GM)),
             ears="up", eye="open", mouth=0, breath=0, down=False, fore=None)
    p.update(k)
    return p


def body(c, p):
    hip, sh = p["hip"], p["sh"]
    b = p["breath"] * 0.3
    mask = tube([add(hip, (-2, 0)), hip, lerp(hip, sh, 0.5), sh], [6.0 + b, 7.0 + b, 7.5 + b, 7.5 + b])
    spine = (sh[0] - hip[0], sh[1] - hip[1])
    n = math.hypot(*spine) or 1
    up = (spine[1] / n, -spine[0] / n)
    if K["hump"]:
        mask |= disk(*add(sh, up, 4.5 * K["hump"]), 4.5 * K["hump"] + 0.5)
    px = shade(mask, 1, 2)
    for x, y in mask:
        if (x, y + 1) not in mask and (x, y - 3) in mask:
            px[(x, y)] = "d"
        if px[(x, y)] in "ml" and noise(x * 3 + y, 4) > 0.86:
            px[(x, y)] = "h" if px[(x, y)] == "l" else "l"
    c.paint(px)
    return mask


def head(c, p):
    hx, hy = p["head"]
    look = p["look"]
    sh = p["sh"]
    fwd = rot((1, 0), look)
    down = rot((0, 1), look)
    sn = K["snout"]
    root = add(sh, (2, -1))
    neck = tube([root, lerp(root, (hx, hy), 0.5), (hx, hy)], [5.5, 4.5 + K["neck"] * -0.8, 3.8])
    c.paint({xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in shade(neck, 1, 1).items()})
    skull = disk(hx, hy, 4.2)
    if K["dome"]:
        skull |= disk(*add((hx, hy), rot((1.2, -1.8), look)), 3.6 * K["dome"])
    snout = tube([add((hx, hy), fwd, 2.5), add(add((hx, hy), fwd, 2.5 + 4.5 * sn), down, 0.8)], [2.8, 2.0])
    hm = skull | snout
    hp = shade(hm, 1, 1)
    hxp, hyp = T((hx, hy))
    for x, y in snout:
        v = (x - hxp, y - hyp)
        if v[0] * fwd[0] + v[1] * fwd[1] > 3.2 * rig.S["s"]:
            hp[(x, y)] = "b"
    c.paint(hp)
    nose = at(add(add((hx, hy), fwd, 2.5 + 4.8 * sn), down, 0.6))
    c.px[nose] = "k"
    if p["mouth"]:
        c.px[at(add(add((hx, hy), fwd, 2.5 + 3.8 * sn), down, 2.2))] = "p"
        c.px[at(add(add((hx, hy), fwd, 2.5 + 3.0 * sn), down, 2.4))] = "p"
    ex, ey = at(add(add((hx, hy), fwd, 1.8), down, -1.0))
    c.px[(ex, ey)] = "e" if p["eye"] == "open" else "d"
    lay = {"up": 0, "back": 1}[p["ears"]]
    for off in ((-2.2, -3.2), (-0.8, -3.8)):
        b = add((hx, hy), rot(off, look))
        e = disk(b[0] - lay, b[1] + lay * 0.6, 1.4)
        rimmed(c, e, lambda x, y: "d" if (x, y - 1) not in e else "m")


def legs(c, p, near):
    """Flat-footed: the whole sole goes down, the heel on the hind foot too.
    A swinging forefoot hangs from the wrist with the claws showing."""
    hip, sh = p["hip"], p["sh"]
    lg = K["leg"]
    for key in (("nh", "nf") if near else ("fh", "ff")):
        hind = key.endswith("h")
        fx, fy = p["feet"][key]
        up = max(0.0, GM - fy)
        if hind:
            root = add(hip, (0.5, 2))
            knee = add(root, (2 + up * 0.3, 7 * lg))
            ankle = (fx - 1.5, fy - 2.2)
            m = tube([root, knee, ankle], [5.0, 3.6, 2.8])
            sole = tube([(fx - 2.2, fy - 1.2), (fx + 1.8, fy - 1.2)], [1.4, 1.4])
        else:
            if p["fore"]:
                root = add(sh, (1, 2))
                pts = [root, add(root, p["fore"][0]), add(root, p["fore"][1])]
                m = tube(pts, [4.2, 3.2, 2.6])
                sole = set()
                tip = at(pts[-1])
                for dx in (0, 1):
                    c.post[(tip[0] + dx, tip[1] + 2)] = "c"
            else:
                root = add(sh, (0.5, 3))
                elbow = add(root, (0.3, 7 * lg))
                wrist = (fx + up * 0.6, fy - 2.5 + up * 0.3)
                m = tube([root, elbow, wrist], [5.2, 3.8, 3.0])
                sole = tube([(wrist[0] - 1 + up * 0.5, wrist[1] + 1.3), (wrist[0] + 2.5, wrist[1] + 1.3 + up * 0.4)], [1.5, 1.4])
        m |= sole
        if near:
            tp = shade(m, 1, 1)
            tp = {xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in tp.items()}
        else:
            tp = {xy: "s" for xy in m}
        c.paint(tp)
        if sole and near:
            front = max(x for x, y in sole)
            by = max(y for x, y in sole)
            c.post[(front + 1, by)] = "c"


def tail(c, p):
    t = at(add(p["hip"], (-7.5, -1.5)))
    c.px[t] = "d"
    c.px[(t[0] - 1, t[1] + 1)] = "d"


def lying(c, p, frame):
    """Flat on the belly with the head on the forepaws, as bears sleep out
    of the den; now and then the head comes up."""
    g = GM
    br = p["breath"]
    m = tube([(14, g - 5), (24, g - 6.5 - br * 0.4), (34, g - 6)], [5.0, 6.2 + br * 0.3, 5.8])
    if K["hump"]:
        m |= disk(32, g - 10, 3.5 * K["hump"] + 0.5)
    px = shade(m, 1, 1)
    for x, y in m:
        if (x, y + 1) not in m:
            px[(x, y)] = "d"
    c.paint(px)
    c.paint({xy: "s" for xy in tube([(36, g - 2), (44, g - 1.2)], [2.0, 1.6])})
    c.post[at((45, g - 1))] = "c"
    lift = 9 <= frame <= 11
    head(c, pose(head=(44.0 + K["neck"] * 2, g - (6 if lift else 3.5)), sh=(35.0, g - 6.0), look=0 if lift else 10,
                 eye="open" if lift else "closed"))


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
    """The amble: a rolling pace, both feet of a side nearly together, the
    head low and swinging."""
    t = frame / 8
    feet = {}
    for key, x in dict(fh=19.0, nh=22.0, ff=36.0, nf=39.0).items():
        dx, up = walk_foot(t + WALK[key], 3.2, 2.5, 0.6)
        feet[key] = (x + dx, GM - up)
    roll = math.sin(4 * math.pi * t) * 0.6
    p = pose(feet=feet, look=22 + 4 * math.sin(2 * math.pi * t))
    p["hip"], p["sh"] = add(p["hip"], (0, roll)), add(p["sh"], (0, -roll))
    p["head"] = add(p["head"], (0, 2 - roll))
    return p


def gallop(frame, charge=False):
    t = frame / 8
    stretch = math.cos(2 * math.pi * (t - 0.1))
    base = pose()
    hip = add(base["hip"], (-stretch * 2, -1.2 * max(0.0, stretch)))
    sh = add(base["sh"], (stretch * 1.8, -1.2 * max(0.0, stretch)))
    feet = {}
    for key in ("fh", "nh", "ff", "nf"):
        dx, up = walk_foot(t + GALLOP[key], 5.5, 4.5, 0.35)
        hind = key.endswith("h")
        feet[key] = ((hip[0] - 1 if hind else sh[0] + 1) + dx + (1.5 if key[0] == "n" else 0), GM - up)
    return pose(hip=hip, sh=sh, head=add(sh, (9 + K["neck"] * 3, 2 if charge else 0)), look=10 if charge else 0,
                feet=feet, ears="back", mouth=1 if charge else 0)


def standing(u, look=-10, mouth=0, paws=None):
    """Up on the hind legs, u from 0 (on all fours) to 1 (upright)."""
    base = pose()
    lg = K["leg"]
    hip = lerp(base["hip"], (27.0, GM - 12 * lg), u)
    sh = lerp(base["sh"], (30.0, GM - 29 * lg), u)
    head = lerp(base["head"], (33.0 + K["neck"] * 2, GM - 36 * lg - K["neck"] * 3), u)
    fore = None
    if u > 0.3:
        fore = paws or ((3, 5), (4.5, 9))
    feet = dict(base["feet"])
    feet["fh"], feet["nh"] = lerp(feet["fh"], (25.0, GM), u), lerp(feet["nh"], (28.0, GM), u)
    if u > 0.3:
        feet["ff"], feet["nf"] = (99, 0), (99, 0)
    return pose(hip=hip, sh=sh, head=head, look=lerp(15, look, u), feet=feet, fore=fore, mouth=mouth)


def standing_side(p):
    """Drawn in the upright order: the body over the hind legs, forelegs
    hanging in front of the chest."""
    c = Canvas()
    legs_upright(c, p, False)
    body(c, p)
    legs_upright(c, p, True)
    head(c, p)
    return c.finish()


def legs_upright(c, p, near):
    hip, sh = p["hip"], p["sh"]
    key = "nh" if near else "fh"
    fx, fy = p["feet"][key]
    root = add(hip, (0.5 if near else -0.5, 2))
    knee = lerp(root, (fx, fy), 0.5)
    knee = (knee[0] + 2, knee[1])
    m = tube([root, knee, (fx - 1, fy - 2)], [5.0, 3.6, 2.8]) | tube([(fx - 2.5, fy - 1.2), (fx + 1.5, fy - 1.2)], [1.4, 1.4])
    c.paint(shade(m, 1, 1) if near else {xy: "s" for xy in m})
    if p["fore"]:
        root = add(sh, (1.5 if near else 0.5, 2 if near else 1))
        a, b = p["fore"]
        pts = [root, add(root, a), add(root, b)]
        fm = tube(pts, [4.0, 3.0, 2.4])
        c.paint(shade(fm, 1, 1) if near else {xy: "s" for xy in fm})
        tip = at(pts[-1])
        c.post[(tip[0] + 1, tip[1] + 2)] = "c"


def idle(frame):
    """On all fours looking about; then up on the hind legs, nose working the
    air, and down again."""
    t = frame / 16
    u = smooth([(0, 0.0), (0.35, 0.0), (0.45, 1.0), (0.7, 1.0), (0.8, 0.0)], t)
    if u > 0.3:
        return standing(u, look=-15 + (frame % 2) * 5)
    return pose(look=15 + [0, 0, -8, -8, 0, 0, 0][frame % 7], ears="back" if frame == 3 else "up",
                eye="closed" if frame == 14 else "open", breath=1 if frame % 8 in (2, 3, 4) else 0)


def forage(frame):
    """A brown or cave bear rakes and digs, head down in it; a polar bear
    rears and brings both forepaws down through the snow."""
    if K["neck"] >= 1:
        u = {6: 0.5, 7: 1.0, 8: 1.0, 9: 0.6}.get(frame, 0)
        if u > 0.3:
            return standing(u * 0.85, look=10 if frame >= 9 else -5, paws=((5, 2), (8, 3)))
        low = frame >= 10
        return pose(head=add(pose()["head"], (1, 7 if low else 4)), look=55 if low else 35)
    base = pose()
    rake = frame % 4
    f = dict(base["feet"])
    f["nf"] = (40.0 + [0, 2.5, 1.5, 0][rake], GM - [0, 3, 1.5, 0][rake])
    return pose(head=add(base["head"], (0.5, 8)), look=60 + (rake % 2) * 8, feet=f, mouth=1 if frame in (7, 15) else 0)


def rest(frame):
    return pose(down=True, breath=1 if frame % 8 in (2, 3, 4, 5) else 0)


# ------------------------------------------------------------ front and back
def face(state, frame, south):
    c = Canvas()
    cx = WM / 2
    g = GM
    lg = K["leg"]
    top = g - 20 * lg
    n = 8 if state in ("wander", "flee", "chase") else 16
    t = frame / n
    lifts, y0, rear, headdrop, mouth, eye, ears = {}, 0.0, 0.0, 0.0, 0, True, "up"
    if state in ("wander", "flee", "chase"):
        fast = state != "wander"
        phases, amp, lift, stance = (GALLOP, 5.5, 4.5, 0.35) if fast else (WALK, 3.2, 2.5, 0.6)
        for key in ("fh", "nh", "ff", "nf"):
            lifts[key] = walk_foot(t + phases[key], amp, lift, stance)[1]
        y0 = -abs(math.sin(2 * math.pi * t)) * (2 if fast else 0.6)
        ears = "back" if fast else "up"
        mouth = 1 if state == "chase" else 0
        headdrop = 1.5
    elif state == "idle":
        rear = smooth([(0, 0.0), (0.35, 0.0), (0.45, 1.0), (0.7, 1.0), (0.8, 0.0)], t)
        eye = frame != 14
    elif state == "forage":
        if K["neck"] >= 1:
            rear = {6: 0.5, 7: 0.85, 8: 0.85, 9: 0.5}.get(frame, 0)
            headdrop = 0 if rear else 6
        else:
            headdrop = 7
            lifts["nf"] = [0, 3, 1.5, 0][frame % 4]
    elif state == "rest":
        return face_rest(c, frame, south)
    rise = rear * 16 * lg

    def leg(x, key, ytop, dark, w):
        up = lifts.get(key, 0)
        bottom = g - up
        m = tube([(x, ytop), (x, bottom - 1)], [w, w * 0.85])
        c.paint({xy: "s" for xy in m} if dark else shade(m, 1, 1))
        fx, fy = at((x, bottom))
        if not dark:
            c.post[(fx - 1, fy)] = "c"
            c.post[(fx + 1, fy)] = "c"

    def bear_head(hx, hy):
        for sgn in (-1, 1):
            e = disk(hx + sgn * 3.4, hy - 3.2, 1.5)
            rimmed(c, e, lambda x, y: "d" if (x, y - 1) not in e else "m")
        m = disk(hx, hy, 4.4) | tube([(hx, hy + 1), (hx, hy + 3.5 * K["snout"])], [2.6, 2.1])
        if K["dome"]:
            m |= disk(hx, hy - 2.5, 3.6 * K["dome"])
        hp = shade(m, 1, 1)
        for x, y in m:
            if y >= T((0, hy + 1.8))[1] and abs(x - T((hx, 0))[0]) <= 2 * rig.S["s"]:
                hp[(x, y)] = "b"
        c.paint(hp)
        for sgn in (-1, 1):
            c.px[at((hx + sgn * 2.1, hy - 0.8))] = "e" if eye else "d"
        nose = at((hx, hy + 3.5 * K["snout"]))
        c.px[nose] = "k"
        if mouth:
            c.px[(nose[0], nose[1] + 2)] = "p"

    if south:
        if rear > 0.3:  # upright, facing: hind legs, belly, forepaws hanging, head high
            for x, key in ((cx - 4, "fh"), (cx + 4, "nh")):
                leg(x, key, g - 12 * lg, False, 3.0)
            bm = disk(cx, g - 12 * lg - rise * 0.6, 7.5, 1.5)
            c.paint(shade(bm, 1, 2))
            for sgn in (-1, 1):
                fm = tube([(cx + sgn * 5, g - 22 * lg), (cx + sgn * 5.5, g - 16 * lg)], [2.6, 2.2])
                c.paint(shade(fm, 1, 1))
                c.post[at((cx + sgn * 5.5, g - 14.5 * lg))] = "c"
            bear_head(cx, g - 28 * lg - K["neck"] * 3)
            return c.finish()
        for x, key in ((cx - 4.5, "fh"), (cx + 4.5, "nh")):
            leg(x, key, top + 8 + y0, True, 2.8)
        bm = disk(cx, top + 5 + y0, 8.0, 1.25)
        if K["hump"]:
            bm |= disk(cx, top - 1 + y0, 4.5 * K["hump"] + 0.5)
        c.paint(shade(bm, 1, 2))
        for x, key in ((cx - 4.5, "ff"), (cx + 4.5, "nf")):
            leg(x, key, top + 10 + y0, False, 3.2)
        bear_head(cx, top + 7 + y0 + headdrop - K["neck"] * 1.5)
        return c.finish()

    # north
    if rear > 0.3:
        bear_head(cx, g - 28 * lg - K["neck"] * 3)
        for x, key in ((cx - 4, "fh"), (cx + 4, "nh")):
            leg(x, key, g - 12 * lg, False, 3.0)
        c.paint(shade(disk(cx, g - 14 * lg, 7.5, 1.5), 1, 2))
        return c.finish()
    bear_head(cx, top + 1 + y0 + headdrop * 0.5 - K["neck"] * 2)
    for x, key in ((cx - 4.5, "ff"), (cx + 4.5, "nf")):
        leg(x, key, top + 8 + y0, True, 2.8)
    bm = disk(cx, top + 7 + y0, 8.0, 1.2)
    c.paint(shade(bm, 1, 2))
    for x, key in ((cx - 4.5, "fh"), (cx + 4.5, "nh")):
        leg(x, key, top + 11 + y0, False, 3.2)
    tl = at((cx, top + 5 + y0))
    c.px[tl] = "d"
    return c.finish()


def face_rest(c, frame, south):
    g, cx = GM, WM / 2
    br = 0.4 if frame % 8 in (2, 3, 4, 5) else 0
    c.paint(shade(disk(cx, g - 5 - br, 9.0, 0.6), 1, 1))
    if south:
        lift = 1.5 if 9 <= frame <= 11 else 0
        hy = g - 5 - lift
        for sgn in (-1, 1):
            e = disk(cx + sgn * 3.4, hy - 3.2, 1.5)
            rimmed(c, e, lambda x, y: "d")
        c.paint(shade(disk(cx, hy, 4.2), 1, 1))
        for sgn in (-1, 1):
            c.px[at((cx + sgn * 2.1, hy - 0.8))] = "e" if lift else "d"
        c.px[at((cx, hy + 2.5))] = "k"
        for sgn in (-1, 1):
            c.post[at((cx + sgn * 4, g - 1))] = "c"
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "forage": forage, "wander": walk, "flee": gallop, "chase": lambda f: gallop(f, True),
        "rest": rest}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, state, facing, frame):
    global K
    K = KINDS[species]
    rig.use(K["s"], GM, WM, HM, PALETTES[species])
    if facing in ("east", "west"):
        p = SIDE[state](frame)
        im = standing_side(p) if p["fore"] else side(p, frame)
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_ursid():
    return {
        f"faunau-{sp}-{state}-{facing}-{frame}": draw(sp, state, facing, frame)
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
        **({"seasons": k["seasons"]} if "seasons" in k else {}),
    } for sp, k in KINDS.items()}
