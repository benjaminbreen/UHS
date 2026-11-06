"""The big running birds: one ratite rig for the ostrich, the emu and the rhea.

The ostrich is the tallest bird alive, near two and a half metres to the
crown: a long bare neck, a small flat head with big lashed eyes, thick bare
thighs and two toes, the big one clawed. The cock is black with white wing
plumes and tail, the neck and shins flushing pink-red when he breeds; the hen
is grey-brown. The emu stands a head lower, its loose double-shafted feathers
hanging off it like a mop, the neck shorter, dark-feathered, with blue skin
showing at the throat, three toes. The greater rhea is smaller and greyer, with
a dark crown and nape and a black band at the foot of the neck, and wings big
enough to show: it holds one out like a rudder when it jinks.

They walk with a nod, peck with the neck swung to the ground, run with long
strides and wings held a little out, and sit down on their folded legs. An
ostrich cock or an emu at bay comes at you neck out, the cock with his wings
spread, and kicks.
"""
import math
from art.fauna_b import shade, line
from art.fauna_d import _mirror
from art import rig
from art.rig import Canvas, T, at, disk, tube, rot, add, lerp, smooth

ROLES = "o d m l h b w x u n j g f a c e k".split()


def _c(o, d, m, l, h, b, w, x, u, n, j, g, f, a, c, e, k):
    return dict(o=o, d=d, m=m, l=l, h=h, b=b, w=w, x=x, u=u, n=n, j=j, g=g, f=f, a=a, c=c, e=e, k=k)


# d m l h body plumage, b underparts, w x wing plumes, u n j bare skin or neck,
# g f the scaly shank and toes, a the bill, c crown and nape, e eye, k claws.
# Sizes are in pixels at a 29-pixel person: crown height `hh`, the body centre
# `bh` above the ground, the shank from knee to heel `l1` and heel to foot `l2`.
KINDS = {
    "ostrich": dict(gm=49, hm=4, wm=66, hh=45, bh=22, rx=11.0, ry=6.6, tilt=6, neck=(1.7, 1.0), head=(2.0, 1.5),
                    bill=3.2, l1=8.8, l2=10.4, thigh=(2.7, 1.0), tars=2, toes=2, shag=0, wing="plume", tail=1.0,
                    lash=True, thighs="skin", coats={
        # the red-necked cock of North Africa and the Sahel, flushed for breeding
        "cock": _c("#140e0e", "#1d1918", "#2c2625", "#463e3c", "#625855", "#3a3332", "#f4f0e8", "#c7c0b4",
                   "#f2b4a6", "#d98679", "#a8574e", "#e8907e", "#b0544a", "#e2b28e", "#7d6560", "#1a0f0c", "#33241f"),
        "hen": _c("#1f1712", "#4d4034", "#695849", "#85725f", "#9e8a74", "#b3a28c", "#c9bca7", "#988873",
                  "#dcc6b4", "#bba08d", "#8b7262", "#c9ab98", "#8e7466", "#ccab8c", "#8b7a6a", "#1d130e", "#3a2c24"),
    }, weights={"cock": 1, "hen": 2}),
    "emu": dict(gm=36, hm=3, wm=50, hh=32, bh=18.0, rx=9.4, ry=6.8, tilt=5, neck=(2.2, 1.3), head=(1.7, 1.4),
                bill=2.2, l1=8.2, l2=8.0, thigh=(2.0, 0.9), tars=2, toes=3, shag=3.2, wing=None, tail=0.0,
                lash=False, thighs="leg", coats={
        "brown": _c("#17120e", "#3b3129", "#5b4d40", "#7a6955", "#958168", "#6b5b4b", "#a28e74", "#2d251e",
                    "#a9bfd2", "#7a94ab", "#566c82", "#8a8278", "#5c554e", "#45403b", "#2e2926", "#8a5426", "#221d19"),
        "dark": _c("#110d0a", "#2b241e", "#43392f", "#5c4f41", "#736352", "#51463b", "#857360", "#201a15",
                   "#a4b8cc", "#748ea6", "#52677c", "#7e776d", "#524c45", "#3c3833", "#24201d", "#80501f", "#1c1814"),
    }, weights={"brown": 3, "dark": 1}),
    "rhea": dict(gm=31, hm=3, wm=46, hh=27, bh=14.0, rx=7.8, ry=4.6, tilt=4, neck=(1.4, 0.95), head=(1.6, 1.3),
                 bill=2.3, l1=6.4, l2=7.6, thigh=(2.0, 0.8), tars=1, toes=3, shag=0, wing="cloak", tail=0.0,
                 lash=False, thighs="plume", coats={
        "grey": _c("#16130f", "#4c463f", "#6b645a", "#8a8276", "#a39b8e", "#d9d3c6", "#928a7e", "#5e574e",
                   "#bab3a7", "#958e83", "#6b655c", "#a69c8b", "#6d665a", "#bfae92", "#25211d", "#1c1612", "#2e2822"),
        "brown": _c("#19140f", "#544638", "#776553", "#95826c", "#ad9a82", "#ddd2c0", "#9c8a72", "#66574a",
                    "#c2b5a3", "#9d8f7c", "#736655", "#ad9d86", "#73675a", "#c4ae8c", "#2b241e", "#1f1813", "#30281f"),
    }, weights={"grey": 3, "brown": 1}),
}
SPECIES = list(KINDS)
for _k in KINDS.values():
    for _coat in _k["coats"].values():
        assert len(set(_coat.values())) == len(ROLES), _coat


def dims(sp):
    k = KINDS[sp]
    return k["wm"], k["gm"], k["hm"]


NATIVE_SIZES = {sp: (dims(sp)[0], dims(sp)[1] + 4 + dims(sp)[2]) for sp in SPECIES}
STANDING_SIZES = {sp: (dims(sp)[0], dims(sp)[1] + 1) for sp in SPECIES}
_CHASE = {"ostrich", "emu"}
STATES = {sp: {"idle": 16, "graze": 16, "wander": 8, "flee": 8, **({"chase": 8} if sp in _CHASE else {}), "rest": 16}
          for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}

K = KINDS["ostrich"]
G = 49  # the ground row of the animal being drawn


# ---------------------------------------------------------------- helpers
def ell(c, rx, ry, ang=0.0):
    """A filled ellipse in model units, its long axis turned by ang degrees."""
    cx, cy = T(c)
    a = math.radians(ang)
    ca, sa = math.cos(a), math.sin(a)
    r = max(rx, ry) + 1
    out = set()
    for x in range(math.floor(cx - r), math.ceil(cx + r) + 1):
        for y in range(math.floor(cy - r), math.ceil(cy + r) + 1):
            dx, dy = x - cx, y - cy
            u, v = dx * ca + dy * sa, -dx * sa + dy * ca
            if (u / rx) ** 2 + (v / ry) ** 2 <= 1.08:
                out.add((x, y))
    return out


def lit(mask, light, mid, dark, lead=1):
    """Light on the top and the leading edge, shade under and behind; a strand
    one pixel thick is the mid tone."""
    out = {}
    for x, y in mask:
        lt = (x + lead, y) not in mask or (x, y - 1) not in mask
        dk = (x - lead, y) not in mask or (x, y + 1) not in mask
        out[(x, y)] = light if lt and not dk else dark if dk and not lt else mid
    return out


def bez(a, b, c, d, n=10):
    pts = []
    for i in range(n + 1):
        t = i / n
        s = 1 - t
        pts.append(tuple(s ** 3 * a[j] + 3 * s * s * t * b[j] + 3 * s * t * t * c[j] + t ** 3 * d[j] for j in (0, 1)))
    return pts


def unit(v):
    n = math.hypot(*v) or 1
    return v[0] / n, v[1] / n


def ik(knee, foot, l1, l2):
    """The heel of a bird's leg, which bends backward."""
    dx, dy = foot[0] - knee[0], foot[1] - knee[1]
    d = math.hypot(dx, dy) or 1
    dd = min(max(d, abs(l1 - l2) + 0.1), l1 + l2 - 0.05)
    a = (l1 * l1 - l2 * l2 + dd * dd) / (2 * dd)
    h = math.sqrt(max(0.0, l1 * l1 - a * a))
    ux, uy = dx / d, dy / d
    return knee[0] + ux * a - uy * h, knee[1] + uy * a + ux * h


def axes(p):
    a = -p["tilt"]
    return rot((1, 0), a), rot((0, 1), a), a


def on_body(p, u, v):
    fwd, down, _ = axes(p)
    return add(add(p["body"], fwd, u * K["rx"]), down, v * K["ry"])


# ---------------------------------------------------------------- side view
def pose(**k):
    cx = K["wm"] / 2 - 2
    p = dict(body=(cx, G - K["bh"]), tilt=K["tilt"], head=(cx + K["rx"] * 0.95, G - K["hh"] + K["head"][1]), look=0.0,
             bend=1.0, feet=dict(f=(cx - 0.5, G), n=(cx + 1.5, G)), wing=0.0, far_wing=False, tail=0.0, eye="open",
             mouth=0, down=False, fluff=0.0, sway=0.0, bolus=None, laid=0.0)
    p.update(k)
    return p


def mop(role, rel, dy, bottom, top1, top2):
    """The emu's coat: a sheen along the back where the feathers part, loose
    strands falling down the flanks to dark ragged tips."""
    if bottom:
        return "x" if rel % 3 == 0 else "d"
    if top1:
        return "h" if rel % 4 in (1, 2) else "l"
    if top2:
        return "l" if rel % 4 != 3 else role
    if rel % 3 == 0 and dy > -1.5 + (rel * 7) % 5 * 0.7 and role == "m":
        return "d"
    return role


def body(c, p):
    fwd, down, ang = axes(p)
    fl = p["fluff"]
    rx, ry = K["rx"] + fl * 0.6, K["ry"] + fl
    m = ell(p["body"], rx, ry, ang)
    # the breast fuller and higher than the rump
    m |= ell(on_body(p, 0.42, -0.12), rx * 0.55, ry * 0.92, ang)
    hem = set()
    if K["shag"]:
        # the emu's loose feathers fall from the back like a mop, a ragged
        # fringe of hanging strands; the hem lags the stride a little
        bx, by = T(p["body"])
        cols = {}
        for x, y in m:
            cols[x] = max(cols.get(x, y), y)
        for x, bottom in cols.items():
            rel = x - round(bx)
            reach = (x - bx) / rx
            if abs(reach) > 0.96:
                continue
            length = K["shag"] + fl * 0.8 + (1.2 if rel % 3 == 0 else 0.4 if rel % 3 == 1 else 0) - max(0.0, reach) * 2.2
            length += round(p["sway"] * (1 if rel % 2 else 0.5))
            for i in range(1, max(0, round(length)) + 1):
                hem.add((x, bottom + i))
        m |= hem
    px = shade(m, 1, 1)
    bx, by = T(p["body"])
    for x, y in m:
        if K["shag"]:
            px[(x, y)] = mop(px[(x, y)], x - round(bx), y - by, (x, y + 1) not in m, (x, y - 1) not in m, (x, y - 2) not in m)
        elif K["wing"] == "cloak" and (x, y + 1) not in m and px[(x, y)] in "dm":
            px[(x, y)] = "b"
    c.paint(px)
    # the rump plumes
    if K["tail"]:
        root = on_body(p, -0.92, -0.35)
        lift = p["tail"]
        for i, (dx, dy, r) in enumerate(((-1.5, -0.5 - lift, 2.2), (-3.0, 1.0 - lift * 0.6, 2.0), (-2.0, 2.6, 1.7))):
            lobe = disk(root[0] + dx, root[1] + dy, r)
            c.paint({xy: "x" if (xy[0], xy[1] + 1) not in lobe else "w" for xy in lobe})
    return m


def wing(c, p, far=False):
    if not K["wing"]:
        return
    fwd, down, ang = axes(p)
    pivot = on_body(p, 0.5, -0.55)
    lift = p["wing"]
    turn = ang + lift * 32
    spread = 1 + lift * 0.25

    def P(u, v):
        return add(pivot, rot((u * spread, v), turn))

    if K["wing"] == "plume":
        cov = ell(P(-6.0, 1.6), 7.2 * spread, 3.4, turn)
        lobes = [(-2.0, 4.4, 2.0), (-5.4, 5.1, 2.3), (-9.0, 4.9, 2.4), (-12.4, 3.8, 2.2), (-15.0, 1.9, 1.8)]
    else:  # the rhea's: a broad cloak of loose plumes over the flank
        cov = ell(P(-5.2, 1.6), 7.4 * spread, 3.8, turn)
        lobes = [(-1.5, 4.6, 1.6), (-4.4, 5.2, 1.9), (-7.4, 5.3, 2.0), (-10.4, 4.6, 1.9), (-12.6, 3.0, 1.6)]
    plume = set()
    for u, v, r in lobes:
        q = P(u * (1 + lift * 0.1), v)
        plume |= disk(q[0], q[1], r)
    plume -= cov
    if far:
        c.paint({xy: "x" for xy in plume})
        c.paint({xy: "d" for xy in cov})
        return
    pp = {xy: ("x" if (xy[0], xy[1] + 1) not in plume else "w") for xy in plume}
    c.paint(pp)
    if K["wing"] == "plume":
        cp = shade(cov, 1, 1)
    else:
        cp = shade(cov, 1, 1, base="w", light="h", dark="x")
    for x, y in cov:  # a dark seam where the wing overlies the body
        if (x, y - 1) not in cov and (x, y - 1) in c.px and c.px[(x, y - 1)] not in "wx":
            cp[(x, y)] = "d"
    c.paint(cp)


def knee(p, key):
    k = on_body(p, -0.05, 0.62)
    return add(k, (-0.6, -0.4)) if key == "f" else k


def leg(c, p, key, near):
    kn = knee(p, key)
    foot = p["feet"][key]
    up = G - foot[1]
    heel = ik(kn, (foot[0], foot[1] - 0.6), K["l1"], K["l2"])
    t0, t1 = K["thigh"]
    drum = tube([kn, lerp(kn, heel, 0.5), heel], [t0, (t0 + t1) / 2 * 1.05, t1])
    if K["thighs"] == "skin":
        roles = ("u", "n", "j")
    elif K["thighs"] == "plume":
        roles = ("l", "m", "d")
    else:
        roles = ("g", "f", "f")
    if near:
        dp = lit(drum, *roles)
    else:
        dp = {xy: roles[2] for xy in drum}
    c.paint(dp)
    hx, hy = at(heel)
    fx, fy = at(foot)
    w = K["tars"]
    tars = line((hx, hy), (fx, fy - 1), 1)
    if w > 1:
        tars |= line((hx + 1, hy), (fx + 1, fy - 1), 1) if up < 1 else line((hx, hy + 1), (fx, fy), 1)
    c.paint({xy: ("g" if near and (xy[0] + 1, xy[1]) not in tars else "f") for xy in tars})
    if near and w > 1:
        c.px[(hx, hy)] = "j" if K["thighs"] == "skin" else "f"
    # the toes, flat forward on the ground, curled under once lifted
    n = 3
    if up < 0.8:
        toes = [(fx + i, fy) for i in range(0, n + (1 if w > 1 else 0))]
        tip = toes[-1]
    else:
        dvec = unit((foot[0] - heel[0], foot[1] - heel[1]))
        curl = unit((dvec[0] * 0.4 + 0.6, dvec[1] * 0.4 + 0.6 * 0.6))
        toes = [at(add(foot, curl, i)) for i in range(0, n)]
        tip = toes[-1]
    c.paint({xy: ("g" if near else "f") for xy in toes})
    if K["toes"] == 3 and up < 0.8:
        c.px[(fx - 1, fy)] = "g" if near else "f"  # the inner toe splayed back
    c.px[(tip[0] + (1 if up < 0.8 else 0), tip[1])] = "k"


def neck_head(c, p, bm):
    fwd, down, ang = axes(p)
    base = on_body(p, 0.78, -0.45)
    hx, hy = p["head"]
    look = p["look"]
    hf = rot((1, 0), look)
    hd = rot((0, 1), look)
    hr = K["head"]
    # the neck meets the skull from behind and below
    top = add(add((hx, hy), hf, -hr[0] * 0.55), hd, hr[1] * 0.4)
    nv = unit((top[0] - base[0], top[1] - base[1]))
    side = (-nv[1], nv[0])
    L = math.hypot(top[0] - base[0], top[1] - base[1])
    b = p["bend"]
    pts = bez(base, add(add(base, nv, L * 0.33), side, b * L * 0.12), add(add(top, nv, -L * 0.33), side, -b * L * 0.1), top, 12)
    r0, r1 = K["neck"]
    rr = [r0 + (r1 - r0) * min(1, i / 8) ** 0.8 for i in range(len(pts))]
    neck = tube(pts, rr)
    clip = tube(pts[:5], rr[:5]) & bm
    neck -= clip
    sp = species_of()
    if sp == "ostrich":
        np_ = lit(neck, "u", "n", "j")
    elif sp == "emu":
        # dark feathers down the back of the neck, the blue throat in front
        np_ = {}
        for x, y in neck:
            front = (x + 1, y) not in neck and (x + 2, y) not in neck
            np_[(x, y)] = "n" if front and y > T(top)[1] + 1 else "c" if (x, y - 1) not in neck else "d" if (x - 1, y) not in neck else "c"
        for x, y in neck:
            if np_[(x, y)] == "n" and (x - 1, y) in neck and np_.get((x - 1, y)) not in "n":
                np_[(x - 1, y)] = "j"
    else:
        np_ = lit(neck, "u", "n", "n")
        for i, q in enumerate(pts):
            if i >= 6:  # the dark nape
                np_[at(add(q, side, -rr[i] * 0.8))] = "c"
        # the black band where the neck meets the body
        band = tube(pts[1:3], rr[1:3]) & neck
        for xy in band:
            np_[xy] = "c"
    if p["bolus"] is not None:
        q = pts[round(p["bolus"] * (len(pts) - 1))]
        bq = at(add(q, side, rr[0] * 0.9))
        if bq not in neck:
            np_[bq] = "j"
    c.paint(np_)
    # the head: a small flat skull and a broad bill
    skull = ell((hx, hy), hr[0], hr[1], look)
    bill_root = add((hx, hy), hf, hr[0] * 0.6)
    tip = add(add(bill_root, hf, K["bill"]), hd, 0.3)
    bill = tube([bill_root, tip], [hr[1] * 0.75, 0.6])
    if p["mouth"]:
        bill |= tube([add(bill_root, hd, 0.9), add(tip, hd, 1.4)], [0.6, 0.5])
    hm = skull | bill
    skin = ("c", "c", "d") if sp == "emu" else ("u", "n", "j")
    hp = {}
    for xy in hm:
        if xy in bill and xy not in skull:
            hp[xy] = "a"
        else:
            hp[xy] = skin[0] if (xy[0], xy[1] - 1) not in hm else skin[2] if (xy[0], xy[1] + 1) not in hm else skin[1]
    if sp != "ostrich":
        for x, y in skull:
            if (x, y - 1) not in skull or (x, y - 2) not in skull:
                hp[(x, y)] = "c"
    if p["mouth"]:
        hp[at(add(add(bill_root, hf, 1.2), hd, 0.8))] = "d"
    c.paint(hp)
    ex, ey = at(add(add((hx, hy), hf, 0.15), hd, -0.25))
    c.px[(ex, ey)] = "e" if p["eye"] == "open" else skin[2]
    if K["lash"] and p["eye"] == "open":
        c.px[(ex, ey - 1)] = "c"


def species_of():
    return next(sp for sp, k in KINDS.items() if k is K)


def sitting(c, p, frame):
    """Down on the folded legs, the shanks flat under the breast and the toes
    just showing; the neck up, or laid along the ground to hide."""
    fwd, down, ang = axes(p)
    leg_tip = on_body(p, 0.55, 0.9)
    fx, fy = at((leg_tip[0], G))
    c.paint({(fx + i, fy): "f" for i in range(-3, 2)})
    c.paint({(fx + 2, fy): "g", (fx + 3, fy): "g"})
    c.px[(fx + 4, fy)] = "k"
    bm = body(c, p)
    for xy in list(bm):
        if xy[1] > T((0, G))[1]:
            c.px.pop(xy, None)
    return bm


def side(p, frame=0):
    c = Canvas()
    if p["far_wing"]:
        wing(c, dict(p, body=add(p["body"], (1.5, -1.5))), far=True)
    if p["down"]:
        bm = sitting(c, p, frame)
    else:
        leg(c, p, "f", False)
        if K["shag"]:
            leg(c, p, "n", True)
            bm = body(c, p)
        else:
            bm = body(c, p)
            leg(c, p, "n", True)
    wing(c, p)
    neck_head(c, p, bm)
    return c.finish()


# ------------------------------------------------------------------ gaits
def stride(t, amp, lift, stance):
    """A bird's foot: back along the ground, then snatched up high behind and
    swung forward low to reach."""
    t %= 1.0
    if t < stance:
        return amp * (1 - 2 * t / stance), 0.0
    u = (t - stance) / (1 - stance)
    e = u * u * (3 - 2 * u)
    return -amp + 2 * amp * e, lift * math.sin(math.pi * u ** 0.75)


def walk(frame):
    """Nodding: the head held still while the body catches up, then put
    forward with each step."""
    t = frame / 8
    p = pose()
    bx = p["body"][0]
    feet = {}
    for key, phase in (("f", 0.0), ("n", 0.5)):
        dx, up = stride(t + phase, K["l2"] * 0.45, K["l2"] * 0.32, 0.58)
        feet[key] = (bx + 0.8 + dx, G - up)
    step = (frame % 4) / 4
    nod = [1.2, 0.5, -0.2, -0.6][frame % 4]
    bob = -0.6 * math.sin(math.pi * step)
    sway = [0, 1, 0, -1][frame % 4] * 0.5
    hx, hy = p["head"]
    return pose(feet=feet, body=(bx, p["body"][1] + bob), head=(hx + nod, hy + bob * 0.5 + (0.6 if frame % 4 == 3 else 0)),
                tilt=K["tilt"] + sway, sway=1 if frame % 4 in (1, 2) else 0, look=4 if frame % 4 == 0 else 0)


def run(frame, chase=False):
    """Long reaching strides with a bound between them, the body level, the
    neck thrown forward, the wings held a little out to steer."""
    t = frame / 8
    p = pose()
    bx, by = p["body"]
    feet = {}
    amp = K["l2"] * (0.75 if not chase else 0.65) * (1.15 if K["shag"] else 1)
    for key, phase in (("f", 0.0), ("n", 0.5)):
        dx, up = stride(t + phase, amp, K["l2"] * 0.75, 0.38)
        feet[key] = (bx + 1.5 + dx, G - up)
    air = abs(math.sin(2 * math.pi * (t + 0.15)))
    body = (bx + 1, by - 0.8 - air * 1.3)
    tilt = 0 if not chase else -6
    nl = K["hh"] - K["bh"]
    if chase:
        head = (body[0] + K["rx"] + nl * 0.58, body[1] - nl * 0.2)
        look, bend = 12, -0.6
    else:
        head = (body[0] + K["rx"] * 0.9 + nl * 0.45, body[1] - nl * 0.75 + air * 0.6)
        look, bend = 4, 0.6
    flap = 0.5 + 0.15 * math.sin(2 * math.pi * t * 2)
    if K["wing"] == "cloak":
        flap += 0.3
    if chase and K["wing"]:
        flap = 0.5 + 0.12 * math.sin(2 * math.pi * t * 2)
    return pose(feet=feet, body=body, tilt=tilt, head=head, look=look, bend=bend, wing=flap if K["wing"] else 0,
                far_wing=chase and bool(K["wing"]), tail=1.5 if chase else 0.6, mouth=1 if chase else 0,
                fluff=1.0 if chase and K["shag"] else 0.0, sway=round(math.sin(2 * math.pi * t)))


def idle(frame):
    """Head up and looking round, a blink, the neck stretched to see further;
    then a preen, the bill run through the wing plumes."""
    p = pose()
    hx, hy = p["head"]
    bx, by = p["body"]
    if 8 <= frame <= 12:
        u = [0.6, 1.0, 1.0, 1.0, 0.5][frame - 8]
        tug = 0.6 if frame in (9, 11) else 0
        target = on_body(p, -0.15 + tug * 0.2, -0.75)
        head = lerp((hx, hy), add(target, (0, -2.2)), u)
        return pose(head=head, look=lerp(0, 125, u), bend=lerp(1.0, -2.6, u), eye="closed" if frame == 10 else "open",
                    wing=0.25 if frame in (9, 10, 11) else 0)
    look = [0, 0, -8, -8, 0, 6, 6, 0, 0, 0, 0, 0, 0, 0, -4, 0][frame]
    stretch = [0, 0, 0, 1, 1.5, 1.5, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0][frame]
    turn = -1.8 if frame in (5, 6) else 0
    return pose(head=(hx + turn, hy - stretch), look=look, eye="closed" if frame in (1, 15) else "open",
                tail=[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0.5, 0][frame],
                body=(bx, by - stretch * 0.3))


def graze(frame):
    """The neck swung down to the ground, four pecks, up to swallow with the
    lump going down the neck, a step and a look."""
    p = pose()
    hx, hy = p["head"]
    bx, by = p["body"]
    feet = dict(p["feet"])
    ground = (bx + K["rx"] * 0.85 + (K["hh"] - K["bh"]) * 0.22, G - K["head"][1] - 2.2)
    if frame <= 1 or frame >= 14:
        u = [0.0, 0.35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.3][frame]
    elif frame <= 9:
        u = 1.0
    else:
        u = [0.6, 0.15, 0.0, 0.0][frame - 10]
    peck = 1.0 if frame in (3, 5, 7, 9) else 0.0
    head = lerp((hx, hy), add(ground, (0.3 * peck, -1.2 + peck * 1.2)), u)
    tilt = K["tilt"] - u * 10
    if frame in (12, 13):
        feet["n"] = (feet["n"][0] + 1.5 * (frame - 11), G - (1.6 if frame == 12 else 0))
    if frame >= 14:
        feet["n"] = (feet["n"][0] + 3, G)
    look = lerp(0, 65, u) - peck * 10
    bolus = {11: 0.75, 12: 0.45, 13: 0.15}.get(frame)
    return pose(head=head, look=look, bend=lerp(1.0, -1.8, u), tilt=tilt, feet=feet, bolus=bolus,
                body=(bx - u * 0.8, by + u * 0.6), eye="closed" if frame == 12 else "open")


def rest(frame):
    """Sitting; now and then the neck goes down flat along the ground."""
    p = pose()
    bx = p["body"][0]
    body = (bx - 1, G - K["ry"] + 0.8)
    breath = 0.3 if frame % 8 in (2, 3, 4) else 0
    laid = smooth([(0, 0.0), (0.5, 0.0), (0.6, 1.0), (0.85, 1.0), (0.95, 0.0)], frame / 16)
    nl = K["hh"] - K["bh"]
    up_head = (body[0] + K["rx"] * 0.9, body[1] - nl + 1 - breath)
    flat_head = (body[0] + K["rx"] + nl * 0.5, G - K["head"][1] - 0.3)
    head = lerp(up_head, flat_head, laid)
    look = [0, 0, 0, -6, -6, 0, 0, 0][frame % 8] * (1 - laid) + laid * 6
    return pose(down=True, body=body, tilt=0, head=head, look=look, bend=lerp(0.8, -0.8, laid),
                eye="closed" if frame in (6, 7) or laid > 0.9 else "open")


# ------------------------------------------------------------ front and back
def face(state, frame, south):
    c = Canvas()
    cx = K["wm"] / 2
    n = STATES[species_of()][state]
    t = frame / n
    rx, ry = K["ry"] * 1.02, K["ry"]
    if K["shag"]:
        rx = K["ry"] * 1.1
    lifts = {"f": 0.0, "n": 0.0}
    y0, sway, wing_out, head_drop, mouth, eye, turn, fluff, graze_, peck = 0.0, 0.0, 0.0, 0.0, 0, True, 0, 0.0, 0.0, 0.0
    if state in ("wander", "flee", "chase"):
        fast = state != "wander"
        for key, ph in (("f", 0.0), ("n", 0.5)):
            lifts[key] = stride(t + ph, 1, K["l2"] * (0.75 if fast else 0.32), 0.38 if fast else 0.58)[1]
        y0 = -abs(math.sin(2 * math.pi * (t + 0.15))) * 1.3 if fast else -0.6 * abs(math.sin(2 * math.pi * t))
        sway = math.sin(2 * math.pi * t) * (0.4 if fast else 0.7)
        nl = K["hh"] - K["bh"]
        head_drop = nl * (0.45 if state == "flee" else 0.7) if fast else 0
        wing_out = (1.6 if (state == "chase" and K["wing"]) else 0.5 if K["wing"] and fast else 0)
        mouth = state == "chase"
        fluff = 1.0 if state == "chase" and K["shag"] else 0
    elif state == "idle":
        eye = frame not in (1, 15)
        turn = -1 if frame in (2, 3) else 1 if frame in (5, 6) else 0
        head_drop = -1.5 if frame in (4, 5) else 0
        if 8 <= frame <= 12:
            return face_preen(c, frame, south)
    elif state == "graze":
        if frame <= 1 or frame >= 14:
            graze_ = [0.0, 0.35, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.7, 0.3][frame]
        elif frame <= 9:
            graze_ = 1.0
        else:
            graze_ = [0.6, 0.15, 0.0, 0.0][frame - 10]
        peck = 1.0 if frame in (3, 5, 7, 9) else 0.0
        if frame == 12:
            lifts["n"] = 1.5
    elif state == "rest":
        return face_rest(c, frame, south)
    cy = G - K["bh"] + y0
    bxc = cx + sway

    def leg_front(x, key):
        up = lifts[key]
        kn = (x, cy + ry * 0.55)
        foot = (x - sway * 0.5, G - up)
        heel = (x, G - up - K["l2"] * (1 - up / (K["l2"] * 1.2)) + up * 0.2)
        drum = tube([kn, heel], [K["thigh"][0] * 0.85, K["thigh"][1]])
        roles = {"skin": ("u", "n", "j"), "plume": ("l", "m", "d"), "leg": ("g", "f", "f")}[K["thighs"]]
        c.paint(lit(drum, roles[0], roles[1], roles[2], lead=-1))
        hx_, hy_ = at(heel)
        fx, fy = at(foot)
        tars = line((hx_, hy_), (fx, fy), 1)
        if K["tars"] > 1:
            tars |= line((hx_ + 1, hy_), (fx + 1, fy), 1)
        c.paint({xy: ("g" if (xy[0] - 1, xy[1]) not in tars else "f") for xy in tars})
        if up < 0.8:
            if K["toes"] == 2:  # the great toe and the little outer one
                c.paint({(fx, fy): "g", (fx + 1, fy): "g", (fx + (2 if x > cx else -1), fy): "f"})
                c.px[(fx, fy + 1)] = "k"
            else:  # three toes splayed
                c.paint({(fx - 1, fy): "g", (fx, fy): "g", (fx + 1, fy): "g", (fx + 2 * (K["tars"] > 1), fy): "g"})
                c.px[(fx - 1, fy + 1)] = "k"
                c.px[(fx + 1 + (K["tars"] > 1), fy + 1)] = "k"

    def body_front(back):
        m = ell((bxc, cy), rx + fluff * 0.6, ry + fluff * 0.7)
        if K["shag"]:
            bx_, by_ = T((bxc, cy))
            cols = {}
            for x, y in m:
                cols[x] = max(cols.get(x, y), y)
            for x, bottom in cols.items():
                rel = x - round(bx_)
                if abs(rel) > rx - 1:
                    continue
                for i in range(1, round(K["shag"] + fluff * 0.8 + (1.2 if rel % 3 == 0 else 0.4 if rel % 3 == 1 else 0)) + 1):
                    m.add((x, bottom + i))
        px = shade(m, 1, 1)
        bx_, by_ = T((bxc, cy))
        for x, y in m:
            rel = x - round(bx_)
            if K["shag"]:
                px[(x, y)] = mop(px[(x, y)], rel, y - by_, (x, y + 1) not in m, (x, y - 1) not in m, (x, y - 2) not in m)
            elif K["wing"] == "cloak" and not back and y > by_ + 1 and abs(rel) < rx - 2 and px[(x, y)] in "md":
                px[(x, y)] = "b"
        c.paint(px)
        return m

    def wings_front(back):
        if not K["wing"]:
            return
        for sgn in (-1, 1):
            if wing_out > 1:  # spread wide and fanned, the plumes hanging
                sh = (bxc + sgn * rx * 0.6, cy - ry * 0.35)
                tip = (bxc + sgn * (rx + 9.5), cy - ry * 0.9)
                arm = tube([sh, lerp(sh, tip, 0.5), tip], [2.4, 2.2, 1.6])
                c.paint(shade(arm, 1, 1) if K["wing"] == "plume" else shade(arm, 1, 1, base="w", light="h", dark="x"))
                lobes = set()
                for i in range(5):
                    q = lerp(sh, tip, 0.15 + i * 0.22)
                    lobes |= disk(q[0] + sgn * 0.6, q[1] + 2.8 + (1 - abs(i - 2) / 2) * 0.6, 2.0 - abs(i - 2) * 0.1)
                lobes -= arm
                c.paint({xy: "x" if (xy[0], xy[1] + 1) not in lobes else "w" for xy in lobes})
                continue
            out = wing_out
            if K["wing"] == "plume":
                cov = ell((bxc + sgn * (rx - 1.2 + out * 1.6), cy + 0.5 - out), 2.4, ry * 0.75, sgn * (15 + out * 25))
                lob = set()
                for dy, r in ((ry * 0.55, 2.1), (ry * 0.95, 1.8)):
                    lob |= disk(bxc + sgn * (rx - 1.8 + out * 2.0), cy + dy - out * 1.5, r)
                if back:
                    lob |= disk(bxc + sgn * (rx - 3.5), cy - ry * 0.2, 1.8)
                c.paint(shade(cov, 1, 1))
                lob -= cov
                c.paint({xy: "x" if (xy[0], xy[1] + 1) not in lob else "w" for xy in lob})
            else:
                cov = ell((bxc + sgn * (rx - 1.5 + out * 2.2), cy + 0.6 - out), 2.6 + out * 0.4, ry * 0.85, sgn * (10 + out * 30))
                c.paint(shade(cov, 1, 1, base="w", light="h", dark="x"))
                for x, y in cov:
                    if (x - sgn, y) in c.px and (x - sgn, y) not in cov and c.px[(x - sgn, y)] not in "wx":
                        c.px[(x, y)] = "x"

    def head_front(hx, hy, beyond):
        hr = K["head"]
        sp = species_of()
        skin = ("c", "c", "d") if sp == "emu" else ("u", "n", "j")
        if beyond:
            m = ell((hx, hy), hr[0] * 0.85, hr[1] * 1.05)
            hp = {xy: skin[0] if (xy[0], xy[1] - 1) not in m else skin[1] for xy in m}
            if sp != "ostrich":
                for x, y in m:
                    hp[(x, y)] = "c"
            c.paint(hp)
            return
        m = ell((hx + turn * 0.5, hy), hr[0] * 0.95, hr[1] * 1.05)
        hp = {xy: skin[0] if (xy[0], xy[1] - 1) not in m else skin[2] if (xy[0], xy[1] + 1) not in m else skin[1] for xy in m}
        if sp != "ostrich":
            hcx = T((hx + turn * 0.5, 0))[0]
            for x, y in m:
                if (x, y - 1) not in m or (x, y - 2) not in m:
                    hp[(x, y)] = "c"
                elif sp == "emu" and abs(x - hcx) >= 1:
                    hp[(x, y)] = "n"  # the blue bare face
        c.paint(hp)
        if turn:  # the bill in profile, the head turned
            bill = tube([(hx + turn * 1.5, hy + 0.4), (hx + turn * (1.5 + K["bill"]), hy + 0.6)], [hr[1] * 0.7, 0.55])
        else:  # the broad flat bill end-on
            bill = ell((hx, hy + hr[1] * 0.7 + (0.5 if mouth else 0)), hr[0] * 0.8, 0.9)
        c.paint({xy: "a" for xy in bill - (m if turn else set())})
        if mouth and not turn:
            c.px[at((hx, hy + hr[1] * 0.7 + 0.6))] = "d"
        for sgn in (-1, 1):
            if turn and sgn == -turn:
                continue
            ex, ey = at((hx + turn * 0.5 + sgn * (hr[0] * 0.75), hy - 0.3))
            c.px[(ex, ey)] = "e" if eye else skin[2]

    def neck_front(base, top, behind=False):
        r0, r1 = K["neck"]
        m = tube([base, lerp(base, top, 0.5), top], [r0 * 0.9, (r0 + r1) / 2 * 0.95, r1])
        sp = species_of()
        if sp == "emu":
            px = {}
            ty = T(top)[1]
            for x, y in m:
                edge = (x - 1, y) not in m or (x + 1, y) not in m
                px[(x, y)] = ("c" if behind or y < ty + 2 else "d" if edge else "n")
            for x, y in m:
                if px[(x, y)] == "n" and ((x - 1, y) not in m or (x + 1, y) not in m):
                    px[(x, y)] = "j"
        else:
            px = lit(m, "u", "n", "j", lead=-1)
            if sp == "rhea":
                for x, y in m:
                    if behind:
                        px[(x, y)] = "c"
                by = T(base)[1]
                for x, y in m:
                    if by - 3.5 <= y and not behind:
                        px[(x, y)] = "c"
        c.paint(px)

    nl = K["hh"] - K["bh"]
    hy = G - K["hh"] + K["head"][1] + y0 + head_drop
    if south:
        if graze_:
            ground_y = G - 0.5
            hgy = lerp(hy, ground_y - peck * 0.0 - (1 - peck) * 0.8, graze_)
        for x, key in ((cx - 2.6, "f"), (cx + 2.6, "n")):
            leg_front(x, key)
        bm = body_front(False)
        wings_front(False)
        if graze_:
            base = (bxc, cy - ry * 0.2 * (1 - graze_))
            neck_front(base, (bxc, hgy - K["head"][1] * 0.3))
            head_front(bxc, hgy, False)
        else:
            if state == "chase" or head_drop > nl * 0.5:
                base = (bxc, cy - ry * 0.3)
            else:
                base = (bxc, cy - ry * 0.45)
            neck_front(base, (bxc, hy + K["head"][1] * 0.5))
            head_front(bxc, hy, False)
        return c.finish()
    # north: the head beyond, the body, the tail nearest
    if graze_:
        hgy = lerp(hy, G - 2.5, graze_)
        if graze_ > 0.7:
            head_front(bxc, hgy, True)
        else:
            neck_front((bxc, cy - ry * 0.5), (bxc, hgy), True)
            head_front(bxc, hgy, True)
    else:
        hy = min(hy, cy - ry - K["head"][1] - 1.5)  # seen over the back
        neck_front((bxc, cy - ry * 0.5), (bxc, hy + K["head"][1] * 0.5), True)
        head_front(bxc, hy, True)
    for x, key in ((cx - 2.6, "f"), (cx + 2.6, "n")):
        leg_front(x, key)
    body_front(True)
    wings_front(True)
    if K["tail"]:
        ty = cy - ry * 0.25 - graze_ * 1.5 - (1.0 if state in ("flee", "chase") else 0)
        tuft = ell((bxc, ty + 0.5), 3.4, 2.4)
        c.paint(shade(tuft, 1, 1, base="w", light="w", dark="x"))
    return c.finish()


def face_preen(c, frame, south):
    """Facing or tailing the viewer, the bill buried in a wing."""
    cx = K["wm"] / 2
    cy = G - K["bh"]
    ry = K["ry"]
    rx = ry * (1.1 if K["shag"] else 1.02)
    sgn = 1 if frame < 11 else -1
    for x in (cx - 2.6, cx + 2.6):
        drum = tube([(x, cy + ry * 0.55), (x, G - K["l2"])], [K["thigh"][0] * 0.85, K["thigh"][1]])
        roles = {"skin": ("u", "n", "j"), "plume": ("l", "m", "d"), "leg": ("g", "f", "f")}[K["thighs"]]
        c.paint(lit(drum, *roles, lead=-1))
        hx, hy = at((x, G - K["l2"]))
        fx, fy = at((x, G))
        c.paint({xy: "g" for xy in line((hx, hy), (fx, fy), 1)})
        c.paint({(fx + 1, fy): "g", (fx, fy + 1): "k"})
    m = ell((cx, cy), rx, ry)
    if K["shag"]:
        for x in range(round(cx - rx + 1), round(cx + rx)):
            col = [y for (xx, y) in m if xx == x]
            if col:
                for i in range(1, round(K["shag"] + (1.2 if x % 3 == 0 else 0.4)) + 1):
                    m.add((x, max(col) + i))
    c.paint(shade(m, 1, 1))
    nb = (cx, cy - ry * 0.4)
    head = (cx + sgn * rx * 0.55, cy - ry * 0.6)
    neck = tube(bez(nb, (cx, nb[1] - 6), (head[0], head[1] - 6), head, 8), [K["neck"][0] * 0.8] + [K["neck"][1]] * 8)
    c.paint(lit(neck, "u", "n", "j", lead=-1) if species_of() != "emu" else {xy: "c" for xy in neck})
    hm = ell(head, K["head"][0] * 0.9, K["head"][1])
    skin = "c" if species_of() == "emu" else "n"
    c.paint({xy: skin for xy in hm})
    if south:
        c.px[at((head[0] - sgn * 0.8, head[1] - 0.4))] = "e" if frame != 10 else skin
    c.px[at((head[0] + sgn * 1.4, head[1] + 1))] = "a"
    return c.finish()


def face_rest(c, frame, south):
    cx = K["wm"] / 2
    ry = K["ry"]
    rx = ry * 1.25
    cy = G - ry + 0.8
    laid = smooth([(0, 0.0), (0.5, 0.0), (0.6, 1.0), (0.85, 1.0), (0.95, 0.0)], frame / 16)
    breath = 0.3 if frame % 8 in (2, 3, 4) else 0
    nl = K["hh"] - K["bh"]
    hy_up = cy - nl - 1 - breath
    eye = not (frame in (6, 7) or laid > 0.9)
    hr = K["head"]
    sp = species_of()
    skin = ("c", "c", "d") if sp == "emu" else ("u", "n", "j")
    if not south:
        hy = lerp(hy_up, G - 3, laid)
        if laid < 0.7:
            nm = tube([(cx, cy - ry * 0.4), (cx, hy)], [K["neck"][0] * 0.9, K["neck"][1]])
            c.paint({xy: ("c" if sp != "ostrich" else "n") for xy in nm})
            c.paint({xy: skin[1] if sp == "ostrich" else "c" for xy in ell((cx, hy), hr[0] * 0.85, hr[1])})
    m = ell((cx, cy), rx, ry + 0.3 + breath)
    m = {xy for xy in m if xy[1] <= T((0, G))[1]}
    px = shade(m, 1, 1)
    if K["shag"]:
        bx_ = round(T((cx, 0))[0])
        for x, y in m:
            if y > T((0, cy))[1] and (x - bx_) % 3 == 0 and px[(x, y)] == "m":
                px[(x, y)] = "d"
    c.paint(px)
    if K["wing"]:
        for sgn in (-1, 1):
            lob = disk(cx + sgn * (rx - 1.5), cy + 0.5, 2.0) | disk(cx + sgn * (rx - 3.2), cy + 2.2, 1.8)
            lob = {xy for xy in lob if xy[1] <= T((0, G))[1]}
            c.paint({xy: "x" if (xy[0], xy[1] + 1) not in lob else "w" for xy in lob})
    if K["tail"] and not south:
        lobes = disk(cx, cy - ry * 0.3, 2.2) | disk(cx - 1.6, cy - ry * 0.1, 1.8) | disk(cx + 1.6, cy - ry * 0.1, 1.8)
        c.paint({xy: "x" if (xy[0], xy[1] + 1) not in lobes else "w" for xy in lobes})
    if not south:
        return c.finish()
    # toes poking out under the breast
    for sgn in (-1, 1):
        fx, fy = at((cx + sgn * 2.4, G))
        c.px[(fx, fy)] = "g"
        c.px[(fx, fy + 1)] = "k"
    hy = lerp(hy_up, G - 0.6, laid)
    base = (cx, cy - ry * 0.4)
    top = (cx, hy + hr[1] * 0.5)
    nm = tube([base, lerp(base, top, 0.5), top], [K["neck"][0] * 0.9, (K["neck"][0] + K["neck"][1]) / 2, K["neck"][1]])
    if sp == "emu":
        np_ = {xy: "n" if xy[1] > T(top)[1] + 2 and abs(xy[0] - T((cx, 0))[0]) < 1 else "c" for xy in nm}
    else:
        np_ = lit(nm, "u", "n", "j", lead=-1)
        if sp == "rhea":
            for x, y in nm:
                if y >= T(base)[1] - 3.5:
                    np_[(x, y)] = "c"
    if laid < 0.5:
        c.paint(np_)
    m = ell((cx, hy), hr[0] * 0.95, hr[1] * 1.05)
    hp = {xy: skin[0] if (xy[0], xy[1] - 1) not in m else skin[2] if (xy[0], xy[1] + 1) not in m else skin[1] for xy in m}
    if sp != "ostrich":
        for x, y in m:
            if (x, y - 1) not in m or (x, y - 2) not in m:
                hp[(x, y)] = "c"
    c.paint(hp)
    c.paint({xy: "a" for xy in ell((cx, hy + hr[1] * 0.7), hr[0] * 0.8, 0.9)})
    for sgn in (-1, 1):
        ex, ey = at((cx + sgn * hr[0] * 0.75, hy - 0.3))
        c.px[(ex, ey)] = "e" if eye else skin[2]
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "graze": graze, "wander": walk, "flee": run, "chase": lambda f: run(f, True), "rest": rest}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, state, facing, frame):
    global K, G
    K = KINDS[species]
    G = K["gm"]
    rig.use(1.0, G, K["wm"], K["hm"], PALETTES[species])
    if facing in ("east", "west"):
        im = side(SIDE[state](frame), frame)
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_ratite():
    return {
        f"faunao-{sp}-{state}-{facing}-{frame}": draw(sp, state, facing, frame)
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
