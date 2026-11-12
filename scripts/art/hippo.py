"""The hippopotamus, on the ball renderer the reptiles use.

A barrel on four short pillars with a box of a head. It grazes at night with
the lips cropping the turf, lies in the water with only the eyes, ears and
nostrils above it and the ears flicking, and warns with the yawn: the jaws
thrown open nearly upright to show the tusks. On land it runs far faster
than anything that shape should.
"""
import math
from art import rig
from art.rig import Canvas, smooth, lerp
from art.reptile import proj, part, render, chain, ripple, DIRECTIONS
from art.fauna_d import _mirror
from art import reptile

GM, W, HM = 34, 74, 18
ROLES = "o d m l h b n w e k s x".split()
COATS = {"grey": dict(o="#120d0e", d="#4a3d40", m="#6e5c5c", l="#8d7a76", h="#a8948c", b="#c08a7e", n="#d98c8f",
                      w="#efe6cf", e="#100b0b", k="#2a1e20", s="#3a3033", x="#c3d3c4")}
PALETTES = {"hippopotamus": COATS["grey"]}
STATES = {"hippopotamus": {"idle": 16, "graze": 16, "wander": 8, "flee": 8, "chase": 8, "pounce": 8, "rest": 16,
                           "warn": 16, "swim": 8, "lurk": 16}}
NATIVE_SIZES = {"hippopotamus": (W, GM + 4 + HM)}
STANDING_SIZES = {"hippopotamus": (W, 30)}


def pose(state, frame):
    n = STATES["hippopotamus"][state]
    t = frame / n
    p = dict(lift=4.0, gape=0.0, look=0.0, ear=0, phase=None, stride=0.0, water=None, down=False, bob=0.0,
             surge=0.0, tail=0, shut=False, head_only=False, run=False)
    if state == "idle":
        p.update(ear=frame % 8 == 5, tail=frame % 4 < 2, shut=frame in (9, 10),
                 look=smooth([(0, 0.0), (0.4, 0.0), (0.5, 0.25), (0.75, 0.25), (0.85, 0.0)], t))
    elif state == "graze":
        p.update(look=-1.0, gape=0.15 if frame % 4 in (1, 2) else 0.0, ear=frame == 11)
    elif state in ("wander", "flee", "chase"):
        fast = state != "wander"
        p.update(phase=t, stride=2.4 if not fast else 4.0, run=fast, bob=abs(math.sin(2 * math.pi * t)) * (1.6 if fast else 0.4),
                 gape=0.12 if state == "chase" else 0.0, ear=fast)
    elif state == "pounce":
        u = {0: 0.0, 1: 0.4, 2: 1.0, 3: 1.0, 4: 0.6, 5: 0.2, 6: 0.0, 7: 0.0}[frame]
        p.update(surge=u * 4, gape={1: 0.6, 2: 0.9, 3: 0.2, 4: 0.0}.get(frame, 0.0), look=0.3 * u - 0.3 * (frame == 3), ear=True)
    elif state == "rest":
        p.update(down=True, lift=0.0, shut=not (6 <= frame <= 8), bob=0.3 if frame % 8 in (2, 3, 4) else 0.0, ear=frame == 7)
    elif state == "warn":
        # The yawn: up and open, held, a toss of the head, shut and again.
        p.update(gape=smooth([(0, 0.0), (0.12, 1.0), (0.45, 1.0), (0.55, 0.7), (0.62, 1.0), (0.85, 1.0), (0.95, 0.0)], t),
                 look=0.5, ear=frame % 4 == 1)
    elif state == "swim":
        p.update(water=13.0, phase=t, stride=2.0, ear=frame % 4 == 2, bob=0.4 * math.sin(2 * math.pi * t))
    elif state == "lurk":
        p.update(water=13.6, head_only=True, ear=frame in (3, 4, 11), bob=0.3 * math.sin(2 * math.pi * t), shut=frame == 8)
    return p


def build(p):
    lift = p["lift"] - p["bob"] * 0.5
    bz = lift + 8.5 + p["bob"]
    sf = p["surge"]
    parts = []
    body = []
    for i in range(22):
        v = i / 21
        f = 12 - v * 26 + sf
        r = 8.0 * math.sin(math.pi * lerp(0.12, 0.9, v)) ** 0.45
        for y in (-3.2, 0.0, 3.2):
            body.append(((f, y, bz - (0.4 if y else 0)), r * 0.85, v))

    def sheen(base, k, q, P):
        if base == "l" and (q[0] // 3) % 3 == 0:
            return "h"
        if base == "d" and P["balls"][k][2] < 0.6:
            return "b" if q[1] % 2 else None
        return None
    parts.append(part(body, roles=sheen, name="body", joined=("head", "jaw", "fl", "fr", "hl", "hr", "neck")))
    if p["down"]:
        for key, f0, side in (("fl", 9.0, 1), ("hl", -10.0, 1)):
            parts.append(part(chain([(f0 + 2, side * 5, 1.5), (f0 + 5, side * 6, 1.0)], [2.6, 2.2]), joined=("body",), name=key))
    else:
        for key, f0, side in (("fl", 8.5, -1), ("fr", 8.5, 1), ("hl", -9.5, -1), ("hr", -9.5, 1)):
            dx, up = 0.0, 0.0
            if p["phase"] is not None:
                off = ({"fl": 0.55, "fr": 0.67, "hl": 0.0, "hr": 0.12} if p["run"] else {"fl": 0.0, "hr": 0.0, "fr": 0.5, "hl": 0.5})[key] \
                    if p["run"] else {"fl": 0.25, "fr": 0.75, "hl": 0.0, "hr": 0.5}[key]
                tt = (p["phase"] + off) % 1
                st = 0.4 if p["run"] else 0.6
                if tt < st:
                    dx = p["stride"] * (1 - 2 * tt / st)
                else:
                    uu = (tt - st) / (1 - st)
                    dx, up = -p["stride"] + 2 * p["stride"] * uu, (2.6 if p["run"] else 1.8) * math.sin(math.pi * uu)
            root = (f0 + sf, side * 4.2, bz - 3)
            foot = (f0 + sf + dx, side * 4.6, up + 1.2)
            parts.append(part(chain([root, foot], [3.0, 2.5]), joined=("body",), name=key,
                              roles=lambda b, k, q, P: "k" if P["balls"][k][2] > 0.92 and b == "d" else None))
    # head: a deep box, the muzzle broad; look lowers (-) or raises (+) it
    look = p["look"]
    hz = bz + 1.5 + look * 3 + (-5 if p["down"] else 0)
    hinge = (14.5 + sf, 0.0, hz)
    pitch = math.radians(look * 25)
    g = math.radians(p["gape"] * 95)

    def at(x, y, z, ang):
        return (hinge[0] + x * math.cos(ang) - z * math.sin(ang), y, hinge[2] + x * math.sin(ang) + z * math.cos(ang))

    upper, lower, mouth = [], [], []
    up_ang = pitch + g * 0.75
    dn_ang = pitch - g * 0.25
    x = -1.0
    while x <= 9.5:
        w = 4.4 if x < 3 else lerp(3.9, 5.0, (x - 3) / 6.5)
        for y in [i * 1.2 - (w - 1.6) for i in range(int(2 * (w - 1.6) / 1.2) + 1)]:
            upper.append((at(x, y, 1.6 if x < 3 else 1.0, up_ang), 2.2 if x < 3 else 1.9, (x / 9.5, y / w)))
            lower.append((at(x * 0.95, y * 0.95, -1.9, dn_ang), 1.9, (x / 9.5, y / w)))
        if g > 0.1 and x > 0:
            mouth.append((at(x * 0.9, 0, 0, (up_ang + dn_ang) / 2), max(1.5, w * 0.8), x / 9.5))
        x += 0.8
    if mouth:
        parts.append(part(mouth, roles=lambda b, k, q, P: "n", bias=0.01, name="mouth", joined=("body",)))
    parts.append(part(lower, joined=("body", "head"), bias=0.02, name="jaw",
                      roles=lambda b, k, q, P: "b" if b == "d" and P["balls"][k][2][0] > 0.5 else None))
    parts.append(part(upper, joined=("body", "jaw"), bias=0.03, name="head",
                      roles=lambda b, k, q, P: "b" if b == "d" and P["balls"][k][2][0] > 0.6 else None))
    feat = dict(
        eyes=[at(1.6, s * 2.8, 3.6, up_ang) for s in (-1, 1)],
        ears=[at(-0.6 - (0.6 if p["ear"] else 0), s * 2.9, 4.4 + (0 if p["ear"] else 0.6), up_ang) for s in (-1, 1)],
        nostrils=[at(8.8, s * 2.2, 2.6, up_ang) for s in (-1, 1)],
        tusks=[(at(7.8, s * 3.6, -2.6, dn_ang), at(8.3, s * 3.6, -0.6, dn_ang)) for s in (-1, 1)] if g > 0.6 else [],
        teeth=[at(9.0, s * 1.2, 0.8, up_ang) for s in (-1, 1)] if g > 0.6 else [],
        tail=(-14.0 + sf, 0.0, bz + 1),
    )
    return parts, feat


def draw(species, state, facing, frame):
    rig.use(1.0, GM, W, HM, PALETTES[species])
    view = "east" if facing in ("east", "west") else facing
    reptile.KD = 0.5 if view == "east" else 0.6
    p = pose(state, frame)
    parts, ft = build(p)
    if p["head_only"]:
        parts = [P for P in parts if P["name"] in ("head",)]
    c = Canvas()
    cx = W / 2 - 1
    gy = GM - 1 if view == "east" else GM - 1 - reptile.KD * (24 if view == "south" else 16)
    shore = render(c, parts, view, cx, gy, water=p["water"])
    P = lambda pt: rig.at(proj(pt, view, cx, gy)[:2])
    hd = proj((ft["eyes"][0][0], 0, 0), view, cx, gy)[2]
    for e in ft["ears"]:
        if view == "east" and proj(e, view, cx, gy)[2] < 0 and not p["ear"]:
            continue
        x, y = P(e)
        for q in ((x, y), (x, y - 1)):
            c.px[q] = "m"
        c.px[(x, y - 2)] = "o" if p["ear"] else "d"
    for e in ft["eyes"]:
        if view == "north" or view == "east" and proj(e, view, cx, gy)[2] < 0:
            continue
        x, y = P(e)
        c.px[(x, y - 1)] = "l"
        c.px[(x, y)] = "o" if p["shut"] else "e"
    for nn in ft["nostrils"]:
        if view != "north":
            c.px[P(nn)] = "k"
    for a, b in ft["tusks"]:
        for q in {P(lerp(a, b, u / 3)) for u in range(4)}:
            c.px[q] = "w"
    for tt in ft["teeth"]:
        c.px[P(tt)] = "w"
    if view != "south" and p["water"] is None and not p["down"]:
        x, y = P(ft["tail"])
        wag = 1 if p["tail"] else 0
        for i in range(3):
            c.px[(x - (i if view == "east" else wag * i), y + i + (0 if view == "east" else -2))] = "d"
    if p["water"] is not None:
        if not shore:
            for e in ft["eyes"] + ft["nostrils"]:
                x, y = P(e)
                shore[x] = y + 1
        ripple(c, shore, frame, STATES[species][state], spread=5 if state == "lurk" else 3, gaps=3)
    im = c.finish()
    return _mirror(im) if facing == "west" else im


def fauna_hippo():
    return {
        f"faunah-hippopotamus-{state}-{facing}-{frame}": draw("hippopotamus", state, facing, frame)
        for state, count in STATES["hippopotamus"].items()
        for facing in DIRECTIONS
        for frame in range(count)
    }


def looks():
    return {"hippopotamus": {"roles": PALETTES["hippopotamus"],
                             "forms": [{"id": "hippopotamus", "weight": 1.0, "where": None, "coats": {"grey": 1}}],
                             "coats": COATS, "coatFrom": {}}}
