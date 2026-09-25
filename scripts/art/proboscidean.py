"""Mammoths and mastodons: one elephant rig, several animals.

Built the way the fox is: tubes along a keyed spine, every frame a pose. What
is particular to elephants is in the gaits. They only walk, in lateral
sequence (hind then fore on one side, then the other); fast, they amble with
the forelegs running and the hind still walking, and never leave the ground.
A foreleg folds back at the wrist as it swings, a hind leg bends forward at a
true knee. They doze on their feet with the trunk laid over a tusk and one
hind foot tipped up, and they charge with the trunk tucked in.

The woolly mammoth follows the frozen carcasses (Yuka, Lyuba) and the
Palaeolithic drawings that agree with them: a high domed skull, a dip at the
nape, a fat hump over the shoulders, a back falling steeply to low hips, small
furred ears, a short tail, hair hanging in a skirt to the knees, and a trunk
tip with one long finger above and a broad flap below.
"""
import math
from art.fauna_b import shade, walk_foot
from art import rig
from art.rig import Canvas, T, at, disk, tube, rot, add, lerp, smooth, noise, rimmed
from art.fauna_d import _mirror, WALK

GM, HM, WM = 64, 14, 112  # model ground row, headroom above it, width

ROLES = "o d m l h s k i j g n p".split()


def _c(o, d, m, l, h, s, k, i, j, g, n, p):
    return dict(o=o, d=d, m=m, l=l, h=h, s=s, k=k, i=i, j=j, g=g, n=n, p=p)


# g n are the grass or twig held in the trunk and p the mouth; they and the
# ivory are the same in every coat, so a swap never turns the grass brown.
GRASS = ("#56622c", "#8f9a48")
IVORY = ("#eadfc4", "#b9a57f")
MOUTH = "#6b3f38"

# s scales the whole animal about its feet. dome is the peak of the skull,
# hump the fat over the shoulders, skirt the hanging hair, long the extra
# length of back, drop how much lower the hips and head sit.
KINDS = {
    # Three metres at the shoulder, like an African elephant; the females less.
    # Ancient DNA shows the pale hair variant (Römpler et al. 2006) was carried
    # but rare. Coats are brown to near black, with a gingery guard hair.
    "woolly-mammoth": dict(s=1.0, dome=1.0, hump=1.0, skirt=1.0, long=0, drop=0.0, head_drop=0.0,
                           ear=0.55, tusk="spiral", tusk_s=1.0, tail=0.8, coats={
        "brown": _c("#150d08", "#3a2414", "#5a3820", "#7a5030", "#9a6a42", "#26170c", "#120c09", *IVORY, *GRASS, MOUTH),
        "dark": _c("#0e0a07", "#241810", "#382619", "#4f3624", "#684a32", "#18100a", "#0c0907", *IVORY, *GRASS, MOUTH),
        "russet": _c("#1a0e07", "#4a2511", "#743a19", "#9a5426", "#bb7038", "#301709", "#120c09", *IVORY, *GRASS, MOUTH),
        "pale": _c("#2a1e14", "#6e5238", "#94724f", "#b59267", "#cfae82", "#523b27", "#1a130e", *IVORY, *GRASS, MOUTH),
    }, weights={"brown": 10, "dark": 5, "russet": 3, "pale": 0.5}),
    # The largest mammoth of the Americas, four metres at the shoulder, south
    # of the ice into Mexico. Warm-country hair was probably sparse; the grey
    # skin shows. Its tusks crossed in front, the longest of any mammoth.
    "columbian-mammoth": dict(s=1.3, dome=0.7, hump=0.45, skirt=0.25, long=0, drop=0.0, head_drop=1.0,
                              ear=0.9, tusk="spiral", tusk_s=1.2, tail=1.0, coats={
        "grey": _c("#16130f", "#3e3830", "#5c544a", "#7a7266", "#978f82", "#2c261f", "#110f0c", *IVORY, *GRASS, MOUTH),
        "brown": _c("#17110c", "#44342a", "#64503f", "#836b56", "#a0876e", "#2f231a", "#110f0c", *IVORY, *GRASS, MOUTH),
    }, weights={"grey": 3, "brown": 2}),
    # Not a mammoth: an older line of browsers, lower and longer, the skull
    # flat, the tusks nearly straight and curving up. Spruce and swamp forest,
    # where it pulled twigs and cones down with its trunk. Hair recovered
    # with the Pleistocene carcasses is reddish brown and shaggy.
    "american-mastodon": dict(s=0.9, dome=0.0, hump=0.0, skirt=0.55, long=6, drop=-2.0, head_drop=7.0,
                              ear=0.8, tusk="straight", tusk_s=1.0, tail=1.0, coats={
        "brown": _c("#170d07", "#40220f", "#633719", "#844d26", "#a36736", "#2b170a", "#120c09", *IVORY, *GRASS, MOUTH),
        "dark": _c("#100a06", "#2a1a0e", "#422a18", "#5b3b24", "#744e31", "#1c1109", "#0c0907", *IVORY, *GRASS, MOUTH),
    }, weights={"brown": 3, "dark": 1}),
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

K = KINDS["woolly-mammoth"]


# Trunk shapes, from the base down, facing east, before the head's pitch. All
# pass through the same number of points so any two can be blended.
TRUNK = {
    "hang": [(0, 0), (0.8, 8), (0.6, 16), (0, 24), (1.2, 30), (2.6, 32)],
    "swing": [(0, 0), (1.5, 8), (2.5, 16), (3, 24), (4.5, 29), (6, 31)],
    "ground": [(0, 0), (1, 9), (2, 18), (3, 27), (5, 34), (8, 36)],
    "wrap": [(0, 0), (1, 9), (1.5, 18), (1.5, 27), (-0.5, 33), (-2.5, 33)],
    "lift": [(0, 0), (3, 7), (5, 13), (4, 18), (0, 18), (-2, 13)],
    "mouth": [(0, 0), (3.5, 5), (4.5, 10), (2, 13), (-1.5, 11), (-3, 7)],
    "sniff": [(0, 0), (4, -3), (6, -10), (5, -17), (7, -22), (10, -23)],
    "tuck": [(0, 0), (2, 5), (2.5, 10), (0.5, 13), (-2, 12), (-3, 9)],
    "drape": [(0, 0), (2, 6), (5, 10), (9, 11.5), (11, 14), (11, 20)],
}
TRUNK_R = [4.2, 3.6, 3.0, 2.5, 2.0, 1.6]
# The tusk from its socket, facing east. A mammoth's grows down and out, then
# forward and up, and curls back in; a mastodon's is nearly straight.
TUSK = {
    "spiral": [(0, 0), (2.5, 5), (8, 9.5), (14, 9), (17.5, 4), (16, -2)],
    "straight": [(0, 0), (4, 4), (10, 6.5), (16, 6.5), (21, 5), (24, 3)],
}
TUSK_R = [1.9, 1.8, 1.6, 1.3, 1.0, 0.6]


# ---------------------------------------------------------------- side view
def pose(**k):
    """Standing, facing east. Every frame starts from this and moves parts."""
    lg, dr, hd = K["long"], K["drop"], K["head_drop"]
    p = dict(hip=(38.0, 32.0 - dr), sh=(62.0 + lg, 27.0), head=(76.0 + lg, 19.0 + hd), look=0.0,
             trunk="hang", trunk2=None, mix=0.0, tail=0.0, ear=0.0, eye="open", mouth=0, breath=0,
             held=None, feet=dict(fh=(35.0, GM), nh=(38.0, GM), ff=(60.0 + lg, GM), nf=(63.0 + lg, GM)),
             sway=0.0, cock=False)
    p.update(k)
    return p


def trunk_pts(p, base, fwd_deg):
    a = TRUNK[p["trunk"]]
    if p["trunk2"]:
        a = [lerp(u, v, p["mix"]) for u, v in zip(a, TRUNK[p["trunk2"]])]
    return [add(base, rot(v, fwd_deg)) for v in a]


def body(c, p):
    hip, sh = p["hip"], p["sh"]
    mid = lerp(hip, sh, 0.5)
    b = p["breath"] * 0.3
    mask = tube([add(hip, (-2, 1)), hip, (mid[0], mid[1] - 0.5), sh], [9.5 + b, 10 + b, 11.5 + b, 12.5 + b])
    if K["hump"]:
        mask |= disk(sh[0] - 1, sh[1] - 9 * K["hump"], 7 * K["hump"])
        mask |= disk(lerp(hip, sh, 0.72)[0], lerp(hip, sh, 0.72)[1] - 5 * K["hump"], 8)
    px = shade(mask, 1, 2)
    top = {}
    for x, y in mask:
        top[x] = min(top.get(x, y), y)
    for x, y in mask:
        if y - top[x] in (1, 2) and noise(x, y) > 0.35:
            px[(x, y)] = "h"
        elif y - top[x] > 2 and noise(x * 3 + y, 7) > 0.86:
            px[(x, y)] = "l"  # the lie of the coat
    c.paint(px)
    return mask


def skirt(c, mask, p):
    """Guard hair hanging from flank and belly in a ragged fringe, longest
    under the chest, swinging behind the movement. It is part of the outline,
    as it is in the cave drawings."""
    if not K["skirt"]:
        return
    fringe(c, mask, lambda u, x: 3 + 6 * math.sin(math.pi * min(1.0, u * 1.15)) + 3 * noise(x, 3), p["sway"])


def fringe(c, mask, length, sway, lo=0.06, hi=0.97):
    bottom = {}
    for x, y in mask:
        bottom[x] = max(bottom.get(x, y), y)
    xs = sorted(bottom)
    span = (xs[-1] - xs[0]) or 1
    for x in xs:
        u = (x - xs[0]) / span
        if not lo <= u <= hi:
            continue
        n = round(K["skirt"] * K["s"] * length(u, x))
        for i in range(1, n + 1):
            xx = x + round(sway * i / max(1, n) * 0.5)
            role = "s" if i >= n - 1 or noise(x, 17) > 0.7 else "d" if (x + i // 3) % 2 else "m"
            c.px[(xx, bottom[x] + i)] = role


def legs(c, p, near):
    """Pillars. A foreleg swings from the shoulder with the foot folded back at
    the wrist; a hind leg bends forward at the knee."""
    hip, sh = p["hip"], p["sh"]
    for key in (("nh", "nf") if near else ("fh", "ff")):
        hind = key.endswith("h")
        fx, fy = p["feet"][key]
        up = max(0.0, GM - fy)
        if hind:
            root = add(hip, (0.5 if near else -1, 5))
            knee = (lerp(root[0], fx, 0.55) + 1.2 + up * 0.7, lerp(root[1], fy, 0.55))
            pts = [root, knee, (fx, fy - 3.5)]
            radii = [6.5, 4.6, 4.2]
            if p["cock"] and key == "nh":  # resting on the tip of the toe
                pts[-1] = (fx + 1, fy - 3.8)
        else:
            root = add(sh, (0.5 if near else -1, 7))
            wrist = (fx + up * 0.6, fy - 6 - up * 0.3)
            elbow = (lerp(root[0], wrist[0], 0.5) - 0.8, lerp(root[1], wrist[1], 0.5))
            pts = [root, elbow, wrist, (fx - up * 0.5, fy - 3.3)]
            radii = [7, 5.0, 4.4, 4.4]
        m = tube(pts, radii)
        if near:
            tp = shade(m, 1, 1)
            for x, y in m:
                if (x - 1, y) not in m and tp[(x, y)] == "m":
                    tp[(x, y)] = "l"
            tp = {xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in tp.items()}
        else:
            tp = {xy: "d" for xy in m}
        c.paint(tp)
        foot = at((fx - (up * 0.5 if not hind else 0), fy))
        # the sole and, on the near side, pale nails at the front
        for x, y in m:
            if y >= foot[1] - 1 and (x, y + 1) not in m:
                c.px[(x, y)] = "k" if near else "s"
        if near and up < 0.5:
            fr = max(x for x, y in m if y == foot[1] - 1) if any(y == foot[1] - 1 for _, y in m) else None
            if fr is not None:
                c.px[(fr - 1, foot[1] - 1)] = "j"
                c.px[(fr - 3, foot[1] - 1)] = "j"


def tail(c, p):
    hip = p["hip"]
    base = add(hip, (-10, -3))
    swing = p["tail"]
    pts = [base, add(base, (-2 - swing, 5)), add(base, (-2.5 - swing * 2, 11 * K["tail"]))]
    m = tube(pts, [1.6, 1.1, 0.8])
    c.paint({xy: "d" for xy in m})
    end = at(pts[-1])
    for i in range(3):  # the tuft
        c.post[(end[0] - 1 + i, end[1] + 1)] = "s"
        c.post[(end[0] + (i - 1) // 2, end[1] + 2)] = "s"


def tusk(c, p, near, sock, deg):
    s = K["tusk_s"]
    pts = [add(sock, rot((x * s, y * s), deg)) for x, y in TUSK[K["tusk"]]]
    if not near:
        pts = [add(q, (-1.5, -1.2)) for q in pts]
    m = tube(pts, TUSK_R)
    if near:
        tp = {}
        for x, y in m:
            tp[(x, y)] = "j" if (x, y + 1) not in m else "i"
    else:
        tp = {xy: "j" for xy in m}
    c.paint(tp)


def head(c, p, near_tusk=True):
    hx, hy = p["head"]
    look = p["look"]
    sh = p["sh"]
    neck = tube([add(sh, (2, -3)), lerp(sh, (hx, hy), 0.55), (hx, hy)], [11, 10, 8.5])
    c.paint({xy: ("m" if xy in c.px else r) for xy, r in shade(neck, 1, 2).items()})
    m = disk(hx, hy, 8.5)
    dome = disk(hx - 1.5, hy - 6.5 * K["dome"] - 1, 6.0) if K["dome"] else set()
    brow = disk(hx + 3.5, hy + 1, 6.5)
    jaw = disk(hx + 1.5, hy + 7, 5.5)
    hm = m | dome | brow | jaw
    hp = shade(hm, 1, 1)
    top = {}
    for x, y in hm:
        top[x] = min(top.get(x, y), y)
    for x, y in hm:
        if y - top[x] in (1, 2) and noise(x, y) > 0.4:
            hp[(x, y)] = "h"
    c.paint(hp)
    # the ear: a small furred flap behind the eye, lifted forward when alarmed
    er = (2.6 + p["ear"] * 1.8) * K["ear"] * 1.5
    ear = disk(hx - 4.5 - p["ear"] * 1.5, hy + 3, er, 1.25)
    rimmed(c, ear, lambda x, y: "l" if (x - 1, y) not in ear else "m" if (x + 1, y) in ear else "d")
    base = add((hx, hy), rot((7, 8), look))
    sock = add((hx, hy), rot((6.5, 10), look))
    if not near_tusk:
        return base, sock
    ex, ey = at(add((hx, hy), rot((3.5, 0.5), look)))
    c.px[(ex, ey - 1)] = "h"
    c.px[(ex, ey)] = "k" if p["eye"] == "open" else "d"
    return base, sock


def trunk(c, p, base):
    look = p["look"]
    pts = trunk_pts(p, base, look * 0.5)
    m = tube(pts, [r * (0.95 if i else 1) for i, r in enumerate(TRUNK_R)])
    tp = shade(m, 1, 1)
    # the rings of a trunk: dark creases across it
    for x, y in m:
        if tp[(x, y)] == "m" and (x + y) % 3 == 0 and noise(x, y) > 0.55:
            tp[(x, y)] = "d"
    c.paint(tp)
    tip = at(pts[-1])
    prev = at(pts[-2])
    c.px[tip] = "k"
    # the two fingers: a long one above, a broad flap below
    dx, dy = tip[0] - prev[0], tip[1] - prev[1]
    n = math.hypot(dx, dy) or 1
    fx, fy = round(tip[0] + dx / n * 1.4), round(tip[1] + dy / n * 1.4)
    c.px[(fx, fy)] = "k"
    if p["mouth"]:
        mx, my = at(add(p["head"], rot((6, 11), look)))
        c.px[(mx, my)] = "p"
        c.px[(mx - 1, my)] = "p"
    if p["held"]:
        held(c, tip, p["held"])
    return pts


def held(c, tip, kind):
    x, y = tip
    if kind == "grass":
        blades = [(-2, -3), (-1, -4), (0, -4), (1, -3), (2, -2), (-2, 1), (0, 1), (2, 1), (-1, 2), (1, 2)]
    else:  # a spruce twig
        blades = [(-3, -2), (-2, -2), (-1, -2), (0, -2), (1, -1), (-3, -3), (-1, -3), (-2, -1), (0, -1)]
    for i, (dx, dy) in enumerate(blades):
        c.post[(x + dx, y + dy)] = "n" if i % 3 == 0 else "g"


def side(p):
    c = Canvas()
    legs(c, p, False)
    hx, hy = p["head"]
    far_sock = add((hx, hy), rot((6.5, 10), p["look"]))
    tusk(c, p, False, far_sock, p["look"] * 0.6)
    tail(c, p)
    b = body(c, p)
    legs(c, p, True)
    skirt(c, b, p)
    base, sock = head(c, p)
    # asleep, the trunk lies over the tusk, not behind it
    if p["trunk"] == "drape":
        tusk(c, p, True, sock, p["look"] * 0.6)
    trunk(c, p, base)
    if p["trunk"] != "drape":
        tusk(c, p, True, sock, p["look"] * 0.6)
    return c.finish()


# ------------------------------------------------------------------ gaits
def walk(frame, fast=False):
    """Lateral sequence, a foot always down. At the amble the forelegs reach
    and the body rocks; the head nods with each forefoot."""
    t = frame / 8
    amp, lift, stance = (6.5, 5.5, 0.48) if fast else (4.5, 3.5, 0.62)
    lg = K["long"]
    feet = {}
    for key, x in dict(fh=35.0, nh=38.0, ff=60.0 + lg, nf=63.0 + lg).items():
        dx, up = walk_foot(t + WALK[key], amp, lift, stance)
        feet[key] = (x + dx, GM - up)
    bob = 0.7 * math.sin(4 * math.pi * t) * (1.6 if fast else 1)
    nod = 3 * math.sin(4 * math.pi * (t - 0.1)) * (1.5 if fast else 1)
    swing = math.sin(2 * math.pi * t)
    p = pose(feet=feet, sway=-swing * (2 if fast else 1))
    p["hip"] = add(p["hip"], (0, bob))
    p["sh"] = add(p["sh"], (0, -bob))
    p["head"] = add(p["head"], (0, -bob + nod * 0.2))
    p["look"] = nod
    p["tail"] = swing * 1.5
    if fast:  # alarmed: ears out, trunk up, tail up
        p.update(trunk="sniff", trunk2="swing", mix=0.25 + 0.2 * swing, ear=1.0, look=-10 + nod, tail=-3)
        p["head"] = add(p["head"], (1, -2))
    else:
        p.update(trunk="hang", trunk2="swing", mix=0.5 + 0.5 * swing)
    return p


def charge(frame):
    """Head up, ears spread wide, trunk rolled in against the chest out of
    harm, tusks leading."""
    p = walk(frame, True)
    p.update(trunk="tuck", trunk2=None, ear=1.4, look=-16, tail=-4, mouth=0)
    p["head"] = add(p["head"], (2, -3))
    return p


def idle(frame):
    """Weight shifting, the tail flicking; the trunk goes up and tests the
    wind, then comes down and swings."""
    t = frame / 16
    mix = smooth([(0, 0.0), (0.2, 0.0), (0.35, 1.0), (0.55, 1.0), (0.7, 0.0)], t)
    trunk2 = "sniff" if 0.1 < t < 0.8 else "swing"
    mix = mix if trunk2 == "sniff" else 0.5 + 0.5 * math.sin(2 * math.pi * t * 2)
    shift = math.sin(2 * math.pi * t) * 0.6
    p = pose(trunk="hang", trunk2=trunk2, mix=mix, look=-6 * mix if trunk2 == "sniff" else 0,
             tail=[0, 0, 1, 2, 1, 0, 0, 0, 0, 0, -1, -2, -1, 0, 0, 0][frame], ear=0.4 if 5 <= frame <= 8 else 0,
             eye="closed" if frame == 12 else "open", breath=1 if frame % 8 in (2, 3, 4) else 0)
    p["hip"] = add(p["hip"], (shift, 0))
    p["sh"] = add(p["sh"], (shift, 0))
    p["head"] = add(p["head"], (shift, 0))
    return p


def forage(frame):
    """A mammoth scuffs the turf loose with a forefoot, wraps a tuft in the
    trunk, tugs it free and lifts it to the mouth, then chews. A mastodon
    browses: it reaches up and pulls a twig down instead."""
    if K["tusk"] == "straight":
        return browse(frame)
    lg = K["long"]
    feet = dict(fh=(35.0, GM), nh=(38.0, GM), ff=(60.0 + lg, GM), nf=(63.0 + lg, GM))
    kick = {0: (1.5, 2.5), 1: (3.5, 1.5), 2: (0.5, 0)}.get(frame)
    if kick:
        feet["nf"] = (63.0 + lg + kick[0], GM - kick[1])
    keys = [(0, ("ground", None, 0.0, 12)), (3, ("ground", "wrap", 1.0, 14)), (5, ("wrap", "lift", 0.6, 8)),
            (7, ("lift", "mouth", 0.7, 2)), (9, ("mouth", None, 0.0, 0)), (13, ("mouth", "hang", 0.6, 3)),
            (15, ("hang", "ground", 0.6, 8))]
    k = max(i for i, _ in enumerate(keys) if keys[i][0] <= frame)
    tr, tr2, mix, look = keys[k][1]
    held_ = "grass" if 4 <= frame <= 10 else None
    chew = frame >= 9 and frame % 2 == 0
    p = pose(feet=feet, trunk=tr, trunk2=tr2, mix=mix, look=look, held=held_, mouth=1 if chew else 0,
             tail=[0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, -1, -1, 0, 0][frame])
    p["head"] = add(p["head"], (0.5, look * 0.12))
    return p


def browse(frame):
    t = frame / 16
    reach = smooth([(0, 0.0), (0.15, 0.0), (0.35, 1.0), (0.5, 1.0), (0.65, 0.0)], t)
    lg = K["long"]
    p = pose(trunk="sniff" if reach > 0.05 else "hang", trunk2="hang", mix=1 - reach, look=-18 * reach,
             held="twig" if 0.4 < t < 0.95 else None, mouth=1 if t > 0.7 and frame % 2 == 0 else 0)
    if t > 0.6:
        p.update(trunk="mouth", trunk2="hang", mix=max(0.0, (t - 0.8) * 4))
    p["head"] = add(p["head"], (1 * reach, -5 * reach))
    p["sh"] = add(p["sh"], (0, -1.5 * reach))
    p["feet"]["nf"] = (63.0 + lg + reach, GM)
    return p


def rest(frame):
    """Asleep on its feet: head low, eyes shut, the trunk hung over a tusk,
    a hind foot tipped up, the breath going in and out."""
    breath = 1 if frame % 8 in (2, 3, 4, 5) else 0
    p = pose(trunk="drape", look=10, eye="closed" if frame not in (9, 10) else "open", breath=breath,
             ear=0.2 if frame in (6, 7) else 0.0, tail=([0] * 12 + [1, 2, 1, 0])[frame], cock=True)
    p["head"] = add(p["head"], (0, 2.5))
    p["sh"] = add(p["sh"], (0, 0.5))
    p["feet"]["nh"] = (39.5, GM - 1.5)
    return p


# ------------------------------------------------------------ front and back
def face(state, frame, south):
    """End-on, seen from above: facing south the head is nearest and low, the
    hump and back rise behind it; facing north the rump and tail are nearest,
    and the dome of the skull and the tusk tips show beyond."""
    c = Canvas()
    cx = WM / 2
    g = GM
    n = 16 if state in ("idle", "forage", "rest") else 8
    t = frame / n
    lifts, y0, sway, trunk_mode, mix, ear, look = {}, 0.0, 0.0, "hang", 0.0, 0.0, 0.0
    held_, mouth, eye = None, False, True
    if state in ("wander", "flee", "chase"):
        fast = state != "wander"
        amp, lift, stance = (6.5, 5.5, 0.48) if fast else (4.5, 3.5, 0.62)
        for key in ("fh", "nh", "ff", "nf"):
            lifts[key] = walk_foot(t + WALK[key], amp, lift, stance)[1]
        y0 = -0.7 * abs(math.sin(4 * math.pi * t)) * (1.6 if fast else 1)
        sway = math.sin(2 * math.pi * t) * (1.2 if fast else 0.7)
        if state == "flee":
            trunk_mode, mix, ear = "up", 0.5 + 0.3 * math.sin(2 * math.pi * t), 1.0
        elif state == "chase":
            trunk_mode, ear, look = "tuck", 1.4, -2
    elif state == "idle":
        mix = smooth([(0, 0.0), (0.2, 0.0), (0.35, 1.0), (0.55, 1.0), (0.7, 0.0)], t)
        trunk_mode = "up" if mix > 0.05 else "hang"
        sway = math.sin(2 * math.pi * t) * 0.6
        eye = frame != 12
        ear = 0.4 if 5 <= frame <= 8 else 0
    elif state == "forage":
        if K["tusk"] == "straight":
            mix = smooth([(0, 0.0), (0.15, 0.0), (0.35, 1.0), (0.5, 1.0), (0.65, 0.0)], t)
            trunk_mode = "up" if mix > 0.05 else "hang"
            held_ = "twig" if 0.4 < t < 0.95 else None
            look = -mix * 2
        else:
            trunk_mode = "ground" if frame < 4 else "curl" if frame < 13 else "hang"
            held_ = "grass" if 4 <= frame <= 10 else None
            look = 2 if frame < 4 else 0
            if frame < 3:
                lifts["nf"] = [2.5, 1.5, 0][frame]
        mouth = frame >= 9 and frame % 2 == 0
    elif state == "rest":
        trunk_mode, look = "drape", 2
        eye = frame in (9, 10)
        y0 = 0.4 if frame % 8 in (2, 3, 4, 5) else 0
        lifts["nh"] = 1.2
    hump = K["hump"]

    def pillar(x, key, top, dark):
        up = lifts.get(key, 0)
        bottom = g - up
        m = tube([(x, top), (x, bottom - 3.3)], [3.9, 3.6])
        tp = {xy: "d" for xy in m} if dark else shade(m, 1, 1)
        if not dark:
            for X, Y in m:
                if (X - 1, Y) not in m:
                    tp[(X, Y)] = "l"
        c.paint(tp)
        fy = at((x, bottom))[1]
        for X, Y in m:
            if (X, Y + 1) not in m:
                c.px[(X, Y)] = "s" if dark else "k"
        if not dark and not up:
            fx = at((x, 0))[0]
            c.px[(fx - 1, fy - 1)] = "j"
            c.px[(fx + 1, fy - 1)] = "j"

    def trunk_front(top):
        s = sway * 0.8
        if trunk_mode == "hang":
            pts = [(cx, top), (cx + s * 0.3, top + 8), (cx + s * 0.7, top + 16), (cx + s, top + 22), (cx + s + 1, top + 24)]
        elif trunk_mode == "ground":
            pts = [(cx, top), (cx, top + 9), (cx + 0.5, top + 18), (cx + 1, g - 4), (cx + 2, g - 1.5)]
        elif trunk_mode == "curl":
            pts = [(cx, top), (cx + 1, top + 5), (cx + 1.5, top + 8), (cx + 0.5, top + 9), (cx - 0.5, top + 7)]
        elif trunk_mode == "tuck":
            pts = [(cx, top), (cx, top + 4), (cx, top + 7), (cx + 0.5, top + 8), (cx, top + 7)]
        elif trunk_mode == "drape":
            pts = [(cx, top), (cx + 2, top + 5), (cx + 5, top + 8), (cx + 7.5, top + 10), (cx + 8, top + 15)]
        else:  # up: raised, the tip turned forward to test the air
            h = 10 + 8 * mix
            pts = [(cx, top), (cx + 1, top - 3), (cx + 1.5 + s, top - h * 0.6), (cx + 1 + s, top - h), (cx + s, top - h - 1.5)]
        m = tube(pts, [3.8, 3.2, 2.6, 2.0, 1.6])
        tp = shade(m, 1, 1)
        for x, y in m:
            if tp[(x, y)] == "m" and y % 3 == 0 and noise(x, y) > 0.5:
                tp[(x, y)] = "d"
        return m, tp, at(pts[-1])

    def tusks_front(sy, near):
        s = K["tusk_s"]
        straight = K["tusk"] == "straight"
        for sgn in (-1, 1):
            base = (cx + sgn * 3, sy)
            if straight:
                path = [(0, 0), (1.5, 4), (2.5, 8), (3, 11), (3, 13)]
            else:
                path = [(0, 0), (3, 5), (8, 8), (12.5, 5), (13, -1), (10, -5)]
            pts = [(base[0] + sgn * x * s, base[1] + y * s) for x, y in path]
            m = tube(pts, TUSK_R[: len(pts)])
            if near:
                c.paint({(x, y): "j" if (x, y + 1) not in m else "i" for x, y in m})
            else:
                c.paint({xy: "j" for xy in m})

    def body_mass(cy, ry, top_bias):
        m = disk(cx + sway * 0.3, cy, 14.5, ry / 14.5)
        if hump:
            m |= disk(cx + sway * 0.3, cy - ry + top_bias, 8 * hump)
        bp = shade(m, 1, 2)
        topy = {}
        for x, y in m:
            topy[x] = min(topy.get(x, y), y)
        for x, y in m:
            if y - topy[x] in (1, 2) and noise(x, y) > 0.35:
                bp[(x, y)] = "h"
        c.paint(bp)
        return m

    def hang(m, strength):
        if K["skirt"]:
            fringe(c, m, lambda u, x: strength * (3 + 5 * math.sin(math.pi * u) + 3 * noise(x, 11)), sway, 0.02, 0.98)

    if south:
        # beyond: the hind legs, then the body rising behind the head
        for x, key in ((cx - 7, "fh"), (cx + 7, "nh")):
            pillar(x, key, 30 + y0, True)
        bm = body_mass(24 + y0, 14, 5)
        hang(bm, 1.0)
        for x, key in ((cx - 6.5, "ff"), (cx + 6.5, "nf")):
            pillar(x, key, 38 + y0, False)
        hy = 30 + y0 + look + K["head_drop"] * 0.4
        # ears at the sides of the head, out when alarmed
        for sgn in (-1, 1):
            er = (3.3 + ear * 1.8) * K["ear"] * 1.6
            e = disk(cx + sgn * (8 + ear * 2), hy + 1, er, 1.3)
            rimmed(c, e, lambda x, y: "d" if y % 2 else "s")
        hm = disk(cx, hy, 8.5) | disk(cx, hy + 5, 6.5)
        if K["dome"]:
            hm |= disk(cx, hy - 6 * K["dome"], 6)
        hp = shade(hm, 1, 1)
        for x, y in hm:
            if (x, y - 1) not in hm and (x, y - 2) in hm:
                hp[(x, y)] = "h"
        c.paint(hp)
        for sgn in (-1, 1):
            c.px[at((cx + sgn * 4.5, hy + 1))] = "k" if eye else "d"
        tm, tp, tip = trunk_front(hy + 6)
        tusks_front(hy + 7, True)
        c.paint(tp)
        c.px[tip] = "k"
        if mouth:
            c.px[at((cx - 1, hy + 9))] = "p"
            c.px[at((cx + 1, hy + 9))] = "p"
        if held_:
            held(c, (tip[0], tip[1]), held_)
        # hair on the forelegs
        return c.finish()

    # north: the dome of the head and the tusk tips beyond, then the back,
    # the rump nearest with the tail hanging over the hind legs
    hy = 16 + y0 + K["head_drop"] * 0.6 + look
    if K["tusk"] == "spiral":
        for sgn in (-1, 1):
            tip = [(cx + sgn * 11, hy + 7), (cx + sgn * 13, hy + 3), (cx + sgn * 12, hy - 1)]
            c.paint({xy: "j" for xy in tube(tip, [1.4, 1.1, 0.7])})
    else:
        for sgn in (-1, 1):
            c.paint({xy: "j" for xy in tube([(cx + sgn * 4, hy + 6), (cx + sgn * 5, hy + 10)], [1.3, 0.9])})
    for sgn in (-1, 1):
        er = (3.3 + ear * 1.8) * K["ear"] * 1.6
        e = disk(cx + sgn * (7 + ear * 2), hy + 2, er, 1.3)
        rimmed(c, e, lambda x, y: "d" if y % 2 else "s")
    hm = disk(cx, hy, 7.5)
    if K["dome"]:
        hm |= disk(cx, hy - 5 * K["dome"], 5.5)
    c.paint(shade(hm, 1, 1))
    for x, key in ((cx - 6.5, "ff"), (cx + 6.5, "nf")):
        pillar(x, key, 34 + y0, True)
    bm = body_mass(28 + y0, 12, 4)
    for x, key in ((cx - 6, "fh"), (cx + 6, "nh")):
        pillar(x, key, 38 + y0, False)
    hang(bm, 1.2)
    # the tail down the middle of the rump, swinging
    tsw = sway * 1.5 + (-2 if state in ("flee", "chase") else 0)
    tpts = [(cx, 30 + y0), (cx + tsw * 0.5, 36 + y0), (cx + tsw, 41 + y0 + (-4 if state in ("flee", "chase") else 0))]
    c.paint({xy: "d" for xy in tube(tpts, [1.5, 1.1, 0.8])})
    end = at(tpts[-1])
    for dx in (-1, 0, 1):
        c.post[(end[0] + dx, end[1] + 1)] = "s"
    c.post[(end[0], end[1] + 2)] = "s"
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "forage": forage, "wander": walk, "flee": lambda f: walk(f, True),
        "chase": charge, "rest": rest}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, state, facing, frame):
    global K
    K = KINDS[species]
    rig.use(K["s"], GM, WM, HM, PALETTES[species])
    if facing in ("east", "west"):
        im = side(SIDE[state](frame))
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_megafauna():
    return {
        f"faunam-{sp}-{state}-{facing}-{frame}": draw(sp, state, facing, frame)
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
