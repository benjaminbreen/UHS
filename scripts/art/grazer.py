"""Bison and the woolly rhinoceros: one heavy grazer's rig.

Built like the deer: a hump over the withers, the head carried low. The steppe
bison follows Altamira and Lascaux, where it is painted most: long horns, a
tall hump, the forequarters dark and shaggy, a beard. The American bison is
shorter in the horn and taller in the hump, with a cape of hair to the knees;
the wisent is taller in the leg and less shaggy, horns turned forward.

The woolly rhinoceros is drawn from the carcasses frozen in Siberia and the
Chauvet paintings: a shoulder hump, a long flattened front horn and a short
second one, a long low head, small ears, long hair, and a dark band round the
middle of the body that Chauvet shows on several animals.

Both sweep snow aside with the head to graze (bison do now; the wear on
rhinoceros horns says it did too). A bison lifts its tail before it charges,
and lies down to chew the cud.
"""
import math
from art.fauna_b import shade, walk_foot
from art.fauna_d import _mirror, WALK, GALLOP
from art import rig
from art.rig import Canvas, T, at, disk, tube, rot, add, lerp, smooth, noise, rimmed

GM, HM, WM = 40, 14, 80

ROLES = "o d m l h s k e i j p b".split()


def _c(o, d, m, l, h, s, b):
    return dict(o=o, d=d, m=m, l=l, h=h, s=s, k="#141009", e="#0b0806", i="#cbbd9f", j="#6d6252", p="#6b3f38", b=b)


KINDS = {
    # Two metres at the shoulder; horns spanning a metre.
    "steppe-bison": dict(s=1.0, leg=1.0, hump=1.0, cape=0.8, beard=1.0, horn="long", rhino=False, skirt=0.3,
                         forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.88, horns=0.7, hump=0.7)},
                         form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "red": _c("#1c0f08", "#5a2e16", "#86461f", "#a8622e", "#c27d42", "#2a160b", "#b88a5c"),
        "brown": _c("#170e08", "#44291a", "#654029", "#84573a", "#a0704c", "#20130b", "#9a7a5a"),
    }, weights={"red": 2, "brown": 3}),
    "american-bison": dict(s=0.92, leg=0.95, hump=1.2, cape=1.2, beard=1.2, horn="short", rhino=False, skirt=0.2,
                           forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.85, horns=0.85, hump=0.7)},
                           form_weights={"bull": 1.0, "cow": 2.2}, coats={
        "brown": _c("#150d07", "#3d2616", "#5c3a22", "#7a5132", "#946645", "#1e120a", "#86684b"),
        "tan": _c("#1d130b", "#5e422a", "#806040", "#9e7c58", "#b8976f", "#2b1c10", "#a58c6c"),
    }, weights={"brown": 6, "tan": 1}),
    "wisent": dict(s=0.95, leg=1.12, hump=0.75, cape=0.5, beard=0.7, horn="forward", rhino=False, skirt=0.0,
                   forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.88, horns=0.8, hump=0.75)},
                   form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "brown": _c("#170e08", "#4a2c18", "#6d4325", "#8c5a35", "#a67248", "#23140b", "#8f7157"),
    }, weights={"brown": 1}),
    # Up to two metres at the shoulder and nearly four long.
    "woolly-rhinoceros": dict(s=1.0, leg=0.8, hump=0.8, cape=0.0, beard=0.0, horn="rhino", rhino=True, skirt=0.9,
                              forms={"rhino": dict(s=1.0, horns=1.0, hump=1.0)},
                              form_weights={"rhino": 1.0}, coats={
        "brown": _c("#150e09", "#3e2c1d", "#5d4430", "#7b5d43", "#957657", "#221810", "#5d4a38"),
        "pale": _c("#211a13", "#5e4c3a", "#846d56", "#a38b71", "#bca58a", "#33281d", "#7d6b58"),
    }, weights={"brown": 3, "pale": 1}),
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
STATES = {sp: {"idle": 16, "graze": 16, "wander": 8, "flee": 8, "chase": 8, "rest": 16} for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}

K = KINDS["steppe-bison"]
F = K["forms"]["bull"]


def fringe(c, mask, lo, hi, length, sway=0.0):
    """Hair hanging from the lower edge of a mask between two columns."""
    bottom = {}
    for x, y in mask:
        bottom[x] = max(bottom.get(x, y), y)
    for x, yb in bottom.items():
        if not lo <= x <= hi:
            continue
        n = round(length * (0.6 + 0.6 * noise(x, 9)))
        for i in range(1, n + 1):
            q = (x + round(sway * i / max(1, n)), yb + i)
            c.px[q] = "s" if i >= n - 1 or (x + i) % 2 else "d"


# ---------------------------------------------------------------- side view
def pose(**k):
    lg = K["leg"]
    top = GM - 35 * lg
    rh = K["rhino"]
    p = dict(hip=(24.0, top + 15), sh=(44.0, top + 13), head=((58.0, top + 22) if rh else (56.0, top + 19)), look=0.0,
             feet=dict(fh=(22.0, GM), nh=(25.0, GM), ff=(43.0, GM), nf=(46.0, GM)),
             tail=0.0, ear=0, eye="open", mouth=0, chew=0, breath=0, down=False, sway=0.0)
    p.update(k)
    return p


def body(c, p):
    hip, sh = p["hip"], p["sh"]
    b = p["breath"] * 0.3
    rh = K["rhino"]
    mask = tube([add(hip, (-2.5, 0.5)), hip, lerp(hip, sh, 0.5), sh], [6.2 + b, 7.0 + b, 8.0 + b, 8.6 + b])
    hump = K["hump"] * F["hump"]
    if hump:
        mask |= disk(sh[0] - 2, sh[1] - 6 * hump, 6.0 * min(1.2, hump + 0.2))
    px = shade(mask, 1, 2)
    hipx, shx = T(hip)[0], T(sh)[0]
    for x, y in mask:
        if not rh and x > lerp(hipx, shx, 0.45) and px[(x, y)] in "mlh":
            px[(x, y)] = "d" if px[(x, y)] == "m" else "m"  # the dark forequarters
        if rh and abs(x - lerp(hipx, shx, 0.5)) < 2.2 * rig.S["s"] and px[(x, y)] in "ml":
            px[(x, y)] = "s"  # Chauvet's dark band round the middle
        if noise(x * 5 + y, 2) > 0.88 and px[(x, y)] in "ml":
            px[(x, y)] = "h" if px[(x, y)] == "l" else "l"
    c.paint(px)
    if K["cape"]:
        fringe(c, mask, lerp(hipx, shx, 0.55), shx + 4 * rig.S["s"], 3 * K["cape"] * rig.S["s"], p["sway"])
    if K["skirt"]:
        fringe(c, mask, hipx - 2, shx + 4, 5 * K["skirt"] * rig.S["s"], p["sway"])
    return mask


def head(c, p):
    hx, hy = p["head"]
    look = p["look"]
    sh = p["sh"]
    hs = F["s"] ** 0.2
    fwd = rot((1, 0), look)
    down = rot((0, 1), look)
    rh = K["rhino"]
    neck = tube([add(sh, (2, -3)), lerp(add(sh, (2, -3)), (hx, hy), 0.5), (hx, hy)], [7.5, 6.0, 4.5])
    c.paint({xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in shade(neck, 1, 1).items()})
    if rh:
        skull = tube([add((hx, hy), fwd, -3), (hx, hy), add(add((hx, hy), fwd, 5), down, 1.5)], [4.2, 3.8, 2.9])
    else:
        skull = disk(hx, hy, 4.6) | tube([(hx, hy), add(add((hx, hy), fwd, 3), down, 3)], [4.0, 3.0])
    hp = shade(skull, 1, 1)
    if not rh:
        for xy, r in list(hp.items()):
            if r in "ml":
                hp[xy] = "d"
    c.paint(hp)
    if rh:
        nose = add(add((hx, hy), fwd, 7.2), down, 2.0)
    else:
        nose = add(add((hx, hy), fwd, 4.5), down, 4.8)
    c.px[at(nose)] = "k"
    if p["mouth"]:
        c.px[at(add(nose, down, 1))] = "p"
    if p["chew"]:
        c.px[at(add(nose, fwd, -1.5))] = "s"
    if K["beard"]:
        bx, by = at(add(add((hx, hy), fwd, 1.5), down, 4))
        for dx in range(-2, 2):
            for i in range(round(3 * K["beard"] * rig.S["s"]) + (dx % 2)):
                c.px[(bx + dx, by + i)] = "s"
    ex, ey = at(add(add((hx, hy), fwd, 1.5 if not rh else 1.0), down, -0.5))
    c.px[(ex, ey)] = "e" if p["eye"] == "open" else "d"
    ear = at(add((hx, hy), rot((-3 if rh else -2.5, -3.5 if rh else -1), look)))
    for dy in range(2 + p["ear"]):
        c.px[(ear[0] - (p["ear"] if dy else 0), ear[1] - dy)] = "m" if rh else "d"
    horns(c, p, hx, hy, fwd, down)


def horns(c, p, hx, hy, fwd, down):
    k = F["horns"]
    shape = K["horn"]
    if shape == "rhino":
        base = add(add((hx, hy), fwd, 5.8), down, -0.5)
        front = [base, add(base, rot((2.5, -4), p["look"]), k), add(base, rot((4.5, -9), p["look"]), k),
                 add(base, rot((5.5, -14), p["look"]), k)]
        m = tube(front, [2.0, 1.6, 1.0, 0.5])
        second = add(add((hx, hy), fwd, 2.2), down, -2.8)
        m |= tube([second, add(second, rot((1, -3.5), p["look"]), k)], [1.3, 0.5])
        c.paint({(x, y): "j" if (x - 1, y) not in m else "i" for x, y in m})
        return
    top = add((hx, hy), rot((-0.5, -3.8), p["look"]))
    path = {"long": [(0, 0), (2, -1), (4.5, -3), (5.5, -6), (4.5, -8.5)],
            "short": [(0, 0), (1.5, -0.5), (2.5, -2), (2.5, -3.5)],
            "forward": [(0, 0), (2, -1), (4, -2.5), (5.5, -3.5)]}[shape]
    pts = [add(top, rot((x * k, y * k), p["look"])) for x, y in path]
    m = tube(pts, [1.3, 1.2, 1.0, 0.8, 0.5][: len(pts)])
    c.paint({(x, y): "k" if (x, y) == at(pts[-1]) else "j" for x, y in m})


def legs(c, p, near):
    hip, sh = p["hip"], p["sh"]
    lg = K["leg"]
    rh = K["rhino"]
    for key in (("nh", "nf") if near else ("fh", "ff")):
        hind = key.endswith("h")
        fx, fy = p["feet"][key]
        up = max(0.0, GM - fy)
        if hind:
            root = add(hip, (0.5, 3))
            stifle = add(root, (2 + up * 0.3, 7 * lg))
            hock = (fx - 1.8 - up * 0.3, fy - 8 * lg + up * 0.3)
            m = tube([root, stifle, hock, (fx, fy - 1)], [5.0, 3.2, 1.9 if not rh else 2.8, 1.8 if not rh else 2.8])
        else:
            root = add(sh, (0.5, 4))
            elbow = add(root, (0.5, 7 * lg))
            knee = (fx + up * 0.5, fy - 7 * lg + up * 0.4)
            m = tube([root, elbow, knee, (fx - up * 0.4, fy - 1)], [5.0, 3.2, 2.0 if not rh else 3.0, 1.8 if not rh else 3.0])
        if near:
            tp = shade(m, 1, 1)
            tp = {xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in tp.items()}
        else:
            tp = {xy: "d" for xy in m}
        c.paint(tp)
        if K["cape"] > 1 and not hind:  # the chaps on a bison's forelegs
            kx, ky = at(knee)
            for dx in (-1, 0, 1):
                for i in range(2):
                    c.px[(kx + dx, ky - 2 + i)] = "s"
        hoof = at((fx - (up * 0.4 if not hind else 0), fy))
        for dx in range(-1, 2 if rh else 1):
            c.px[(hoof[0] + dx, hoof[1])] = "k"


def tail(c, p):
    base = add(p["hip"], (-8.5, -3.5))
    up = p["tail"]  # 0 hanging, 1 raised in alarm, 2 straight up to charge
    tip = add(base, rot((0, 7), 70 * up if up else 5 * p["sway"]))
    m = tube([base, tip], [1.0, 0.7])
    c.paint({xy: "d" for xy in m})
    e = at(tip)
    for dx, dy in ((0, 0), (0, 1), (-1, 1), (1, 0)):
        c.px[(e[0] + dx, e[1] + dy)] = "s"


def lying(c, p, frame):
    g = GM
    hip, sh = p["hip"], p["sh"]
    breath = p["breath"]
    mask = tube([add(hip, (-2.5, 0)), hip, lerp(hip, sh, 0.5), sh], [6.0, 6.8 + breath * 0.3, 7.6, 8.2])
    hump = K["hump"] * F["hump"]
    if hump:
        mask |= disk(sh[0] - 2, sh[1] - 6 * hump, 6.0 * min(1.2, hump + 0.2))
    gp = T((0, g))[1]
    mask = {(x, y) for x, y in mask if y <= gp}
    px = shade(mask, 1, 1)
    hipx, shx = T(hip)[0], T(sh)[0]
    for x, y in mask:
        if not K["rhino"] and x > lerp(hipx, shx, 0.45) and px[(x, y)] in "ml":
            px[(x, y)] = "d"
        if (x, y + 1) not in mask:
            px[(x, y)] = "s"
    c.paint(px)
    c.paint({xy: "d" for xy in tube([add(sh, (3, 6)), (sh[0] + 7, g - 1)], [2.0, 1.6])})
    c.px[at((sh[0] + 8, g - 0.5))] = "k"


def side(p, frame=0):
    c = Canvas()
    if p["down"]:
        lying(c, p, frame)
        head(c, p)
        return c.finish()
    legs(c, p, False)
    tail(c, p)
    body(c, p)
    legs(c, p, True)
    head(c, p)
    return c.finish()


# ------------------------------------------------------------------ gaits
def walk(frame):
    t = frame / 8
    feet = {}
    for key, x in dict(fh=22.0, nh=25.0, ff=43.0, nf=46.0).items():
        dx, up = walk_foot(t + WALK[key], 3.0, 2.6, 0.62)
        feet[key] = (x + dx, GM - up)
    bob = 0.5 * math.sin(4 * math.pi * t)
    sw = math.sin(2 * math.pi * t)
    p = pose(feet=feet, look=4 * math.sin(4 * math.pi * t), sway=-sw, tail=0)
    p["hip"], p["sh"] = add(p["hip"], (0, bob)), add(p["sh"], (0, -bob))
    p["head"] = add(p["head"], (0, -bob))
    return p


def gallop(frame, charge=False):
    """Bison run with the head low and the tail up; charging, the head goes
    lower still, horns first."""
    t = frame / 8
    stretch = math.cos(2 * math.pi * (t - 0.1))
    rock = math.sin(2 * math.pi * (t + 0.1))
    base = pose()
    hip = add(base["hip"], (-stretch * 1.8, -rock * 1.0 - 1.0 * max(0.0, stretch)))
    sh = add(base["sh"], (stretch * 1.6, rock * 1.0 - 1.0 * max(0.0, stretch)))
    feet = {}
    for key in ("fh", "nh", "ff", "nf"):
        dx, up = walk_foot(t + GALLOP[key], 5.5, 5.0, 0.35)
        hind = key.endswith("h")
        feet[key] = ((hip[0] - 2 if hind else sh[0] + 0) + dx + (1.5 if key[0] == "n" else 0), GM - up)
    head = add(sh, (12, 7 if charge else 4)) if not K["rhino"] else add(sh, (14, 8 if charge else 6))
    return pose(hip=hip, sh=sh, head=head, look=25 if charge else 5, feet=feet, tail=2 if charge else 1,
                sway=-2, mouth=0 if charge else 1)


def idle(frame):
    """Standing, chewing; the tail swishing at flies, an ear turning. Once
    the head comes up to test the wind."""
    t = frame / 16
    lift = smooth([(0, 0.0), (0.3, 0.0), (0.4, 1.0), (0.6, 1.0), (0.7, 0.0)], t)
    p = pose(look=-12 * lift, tail=0, sway=[0, 1, 2, 1, 0, -1, -2, -1][frame % 8] * 0.8, ear=1 if frame in (5, 6) else 0,
             chew=frame % 2 if lift < 0.1 else 0, eye="closed" if frame == 13 else "open",
             breath=1 if frame % 8 in (2, 3, 4) else 0)
    p["head"] = add(p["head"], (0.5 * lift, -3 * lift))
    return p


def graze(frame):
    """Head down to the ground, cropping, stepping on; in the snow it sweeps
    the head side to side to clear the grass, which reads from the side as the
    muzzle pushing forward and back along the ground."""
    feet = dict(fh=(22.0, GM), nh=(25.0, GM), ff=(43.0, GM), nf=(46.0, GM))
    if 8 <= frame <= 10:
        u = (frame - 7) / 3
        feet["nf"] = (46.0 + u * 2.5, GM - math.sin(math.pi * u) * 2)
    if frame > 10:
        feet["nf"] = (48.5, GM)
    sweep = math.sin(2 * math.pi * frame / 8) * 1.5
    base = pose()
    lg = K["leg"]
    hx = base["head"][0] + 1.5 + sweep
    hy = GM - (8 if K["rhino"] else 10) * lg
    return pose(feet=feet, head=(hx, hy), look=30 if not K["rhino"] else 20, chew=frame % 2,
                sway=[0, 0, 0, 0, 1, 2, 1, 0][frame % 8] * 0.6)


def rest(frame):
    breath = 1 if frame % 8 in (2, 3, 4, 5) else 0
    base = pose()
    drop = 12 * K["leg"]
    head_up = frame < 11
    rh = K["rhino"]
    p = pose(hip=add(base["hip"], (0, drop)), sh=add(base["sh"], (0, drop)), down=True, breath=breath,
             chew=(frame % 4 in (1, 2)) and head_up and not rh, eye="open" if head_up and not rh else "closed",
             ear=1 if frame in (4, 5) else 0)
    p["head"] = add(base["head"], (0, drop - (2 if head_up else -3) - (5 if rh else 0)))
    p["look"] = 0 if head_up else (10 if rh else 25)
    return p


# ------------------------------------------------------------ front and back
def face(state, frame, south):
    c = Canvas()
    cx = WM / 2
    g = GM
    lg = K["leg"]
    rh = K["rhino"]
    top = g - 35 * lg
    n = 8 if state in ("wander", "flee", "chase") else 16
    t = frame / n
    lifts, y0, headdrop, sweep, tail_up, down = {}, 0.0, 0.0, 0.0, 0, False
    eye = True
    if state in ("wander", "flee", "chase"):
        fast = state != "wander"
        phases, amp, lift, stance = (GALLOP, 5.5, 5.0, 0.35) if fast else (WALK, 3.0, 2.6, 0.62)
        for key in ("fh", "nh", "ff", "nf"):
            lifts[key] = walk_foot(t + phases[key], amp, lift, stance)[1]
        y0 = -abs(math.sin(2 * math.pi * t)) * (2 if fast else 0.5)
        headdrop = 3 if state == "chase" else 0
        tail_up = 2 if state == "chase" else 1 if fast else 0
    elif state == "graze":
        headdrop = 9
        sweep = math.sin(2 * math.pi * frame / 8) * 2.5
        if 8 <= frame <= 10:
            lifts["nf"] = math.sin(math.pi * (frame - 7) / 3) * 2
    elif state == "idle":
        headdrop = -2 * smooth([(0, 0.0), (0.3, 0.0), (0.4, 1.0), (0.6, 1.0), (0.7, 0.0)], t)
        eye = frame != 13
    elif state == "rest":
        down = True
        eye = frame < 11 and not rh
        headdrop = 12 * lg + (0 if frame < 11 else 3)
        y0 = 12 * lg

    def leg(x, key, ytop, dark, w):
        up = lifts.get(key, 0)
        bottom = g - up
        if down:
            return
        m = tube([(x, ytop), (x, bottom - 1)], [w, w * 0.75])
        c.paint({xy: "d" for xy in m} if dark else shade(m, 1, 1))
        fx, fy = at((x, bottom))
        c.px[(fx, fy)] = "k"
        c.px[(fx + 1, fy)] = "k"

    def mass(cy, rx, ry, dark_front):
        m = disk(cx, cy, rx, ry / rx)
        hump = K["hump"] * F["hump"]
        if hump:
            m |= disk(cx, cy - ry + 1, 5.5 * hump)
        if down:
            gp = T((0, g))[1]
            m = {(x, y) for x, y in m if y <= gp}
        bp = shade(m, 1, 2)
        if dark_front and not rh:
            bp = {xy: ("d" if r in "ml" else r) for xy, r in bp.items()}
        if rh:
            for x, y in m:
                if abs(y - T((0, cy))[1]) <= 1 and bp[(x, y)] in "ml":
                    bp[(x, y)] = "s"
        c.paint(bp)
        return m

    def horns_front(hx, hy):
        k = F["horns"]
        if rh:
            m = tube([(hx, hy + 2), (hx, hy - 3 * k), (hx + 0.5, hy - 8 * k)], [1.8, 1.3, 0.5])
            c.paint({(x, y): "j" if (x - 1, y) not in m else "i" for x, y in m})
            return
        shape = K["horn"]
        for sgn in (-1, 1):
            if shape == "long":
                path = [(3, -3), (7, -4), (9.5, -7), (8.5, -10)]
            elif shape == "short":
                path = [(3, -3), (5, -3.5), (6, -5.5)]
            else:
                path = [(3, -3), (6, -4), (7.5, -6), (7, -7.5)]
            pts = [(hx + sgn * x * k, hy + y * k) for x, y in path]
            m = tube(pts, [1.3, 1.1, 0.8, 0.5][: len(pts)])
            c.paint({xy: "j" for xy in m})

    def head_front(hx, hy):
        if rh:
            m = tube([(hx, hy - 3), (hx, hy + 5)], [3.4, 2.6])
            c.paint(shade(m, 1, 1))
            for sgn in (-1, 1):
                e = disk(hx + sgn * 3, hy - 4.5, 1.1, 1.6)
                rimmed(c, e, lambda x, y: "m")
            c.px[at((hx - 2, hy - 1))] = "e" if eye else "d"
            c.px[at((hx + 2, hy - 1))] = "e" if eye else "d"
            horns_front(hx, hy + 1)
            return
        horns_front(hx, hy)
        m = disk(hx, hy, 4.4) | tube([(hx, hy), (hx, hy + 4.5)], [3.6, 2.8])
        c.paint({xy: ("d" if r in "ml" else r) for xy, r in shade(m, 1, 1).items()})
        for sgn in (-1, 1):
            c.px[at((hx + sgn * 2.7, hy - 0.5))] = "e" if eye else "d"
        if K["beard"]:
            bx, by = at((hx, hy + 6))
            for dx in (-1, 0, 1):
                for i in range(round(3 * K["beard"] * rig.S["s"])):
                    c.px[(bx + dx, by + i)] = "s"
        c.px[at((hx, hy + 5))] = "k"

    if south:
        for x, key in ((cx - 4, "fh"), (cx + 4, "nh")):
            leg(x, key, top + 20 + y0, True, 2.2)
        bm = mass(top + 16 + y0, 9, 11, True)
        if K["skirt"] or K["cape"]:
            fringe(c, bm, 0, 999, 3 * (K["skirt"] + K["cape"]) * rig.S["s"])
        for x, key in ((cx - 4.5, "ff"), (cx + 4.5, "nf")):
            leg(x, key, top + 22 + y0, False, 2.5 if not rh else 3)
        head_front(cx + sweep, top + 17 + y0 + headdrop - (1 if rh else 0))
        return c.finish()

    # north: horns and the top of the head beyond, the rump nearest
    hy = top + 12 + y0 + headdrop * 0.6
    horns_front(cx + sweep * 0.5, hy) if not rh else None
    c.paint(shade(disk(cx + sweep * 0.5, hy, 3.5), 1, 1))
    for x, key in ((cx - 4.5, "ff"), (cx + 4.5, "nf")):
        leg(x, key, top + 18 + y0, True, 2.2)
    bm = mass(top + 18 + y0, 8.5, 10, False)
    if K["skirt"]:
        fringe(c, bm, 0, 999, 4 * K["skirt"] * rig.S["s"])
    for x, key in ((cx - 4, "fh"), (cx + 4, "nh")):
        leg(x, key, top + 24 + y0, False, 2.3 if not rh else 3)
    ty = top + 16 + y0
    tip = (cx, ty + (6 if tail_up == 0 else -2 if tail_up == 2 else 2))
    c.paint({xy: "d" for xy in tube([(cx, ty), tip], [1.0, 0.7])})
    e = at(tip)
    c.px[e] = "s"
    c.px[(e[0], e[1] + 1)] = "s"
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "graze": graze, "wander": walk, "flee": gallop, "chase": lambda f: gallop(f, True),
        "rest": rest}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, form, state, facing, frame):
    global K, F
    K = KINDS[species]
    F = K["forms"][form]
    rig.use(K["s"] * F["s"], GM, WM, HM, PALETTES[species])
    rig.S.update(W=dims(species)[0], G=dims(species)[1], HR=dims(species)[2])
    if facing in ("east", "west"):
        im = side(SIDE[state](frame), frame)
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_grazer():
    out = {}
    for sp in SPECIES:
        forms = list(KINDS[sp]["forms"])
        for form in forms:
            art = sp if form == forms[0] else f"{sp}.{form}"
            for state, count in STATES[sp].items():
                for facing in DIRECTIONS:
                    for frame in range(count):
                        out[f"faunag-{art}-{state}-{facing}-{frame}"] = draw(sp, form, state, facing, frame)
    return out


def looks():
    return {sp: {
        "roles": PALETTES[sp],
        "forms": [{"id": f, "weight": w, "where": None, "coats": k["weights"]} for f, w in k["form_weights"].items()],
        "coats": k["coats"],
        "coatFrom": {},
    } for sp, k in KINDS.items()}
