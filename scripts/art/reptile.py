"""Snakes and crocodilians, and the small 3D ball renderer they share with the
hippo.

A low animal seen from the game's high oblique camera is mostly its back, so
these are modelled in animal space (f forward, u to its right, z up) as
chains of balls and projected per facing, rather than drawn as a side view
and a front view. Parts are painted far to near, each shaded as a whole, and
a part laid over another it does not grow from gets a dark contour where it
crosses it: that is what keeps a coiled snake's loops apart.

The snakes share one rig: a turtle walks the spine back from the head, so a
slither is a heading wave travelling down a body of fixed length. A cobra
spreads its hood and sways, a rattlesnake coils with its head drawn back and
the rattle a blur, a mamba rears with its black mouth open, and the vipers
and the adder throw an S and hiss.

The crocodilians bask with the jaws open to shed heat, walk high off the
belly, lie in the water with only the eyes and nostrils above it, and come
out of it in one lunge. The Nile crocodile and the saltwater have the long
tapering snout, the mugger and the alligator the broad one.
"""
import functools
import math
from art import rig
from art.rig import Canvas, disk, smooth, lerp
from art.fauna_b import shade
from art.fauna_d import _mirror

KD = 0.5
DIRECTIONS = ("south", "east", "north", "west")


# --------------------------------------------------------------- renderer
def proj(p, facing, cx, gy):
    f, u, z = p
    if facing == "east":
        return cx + f, gy + u * KD - z, u
    if facing == "south":
        return cx - u, gy + f * KD - z, f
    return cx + u, gy - f * KD - z, -f


def part(balls, roles=None, joined=(), bias=0.0, top=1, bottom=1, name=None):
    """balls: (point, radius, s), s any parameter the role function reads."""
    return dict(balls=balls, roles=roles, joined=set(joined), bias=bias, top=top, bottom=bottom, name=name)


def render(c, parts, facing, cx, gy, water=None):
    """Paint parts far to near. Under `water` (a height) nothing is drawn;
    the rows where a part meets it come back for the ripple."""
    owner, shore = {}, {}
    names = {P["name"]: i for i, P in enumerate(parts) if P["name"]}
    for P in parts:
        P["joined"] = {names.get(j, j) for j in P["joined"]}
        P["scr"] = [proj(p, facing, cx, gy) for p, r, s in P["balls"]]
    depth = lambda i: sum(d for _, _, d in parts[i]["scr"]) / max(1, len(parts[i]["scr"])) + parts[i]["bias"]
    for i in sorted(range(len(parts)), key=depth):
        P = parts[i]
        best = {}
        for k, ((X, Y, _), (p, r, s)) in enumerate(zip(P["scr"], P["balls"])):
            lim = None
            if water is not None:
                lim = rig.at(proj((p[0], p[1], water), facing, cx, gy)[:2])[1]
            sx, sy = rig.T((X, Y))
            for q in disk(X, Y, r):
                if lim is not None and q[1] > lim:
                    shore[q[0]] = max(shore.get(q[0], -99), lim)
                    continue
                dd = (q[0] - sx) ** 2 + (q[1] - sy) ** 2
                if q not in best or dd < best[q][0]:
                    best[q] = (dd, k)
        if not best:
            continue
        mask = set(best)
        px = shade(mask, P["top"], P["bottom"])
        if P["roles"]:
            for q, (_, k) in best.items():
                px[q] = P["roles"](px[q], k, q, P) or px[q]
        for q in mask:
            j = owner.get(q)
            if j is not None and j != i and j not in P["joined"] and i not in parts[j]["joined"] and any(
                    n not in mask for n in ((q[0] + 1, q[1]), (q[0] - 1, q[1]), (q[0], q[1] + 1), (q[0], q[1] - 1))):
                px[q] = "o"
        c.paint(px)
        for q in mask:
            owner[q] = i
    return shore


def lateral(P, k, q):
    """Signed offset of pixel q across the chain at ball k, in ball radii."""
    scr = P["scr"]
    a, b = scr[max(0, k - 1)], scr[min(len(scr) - 1, k + 1)]
    tx, ty = b[0] - a[0], b[1] - a[1]
    n = math.hypot(tx, ty) or 1
    sx, sy = rig.T(scr[k][:2])
    r = P["balls"][k][1] * rig.S["s"]
    return ((q[0] - sx) * ty - (q[1] - sy) * tx) / n / max(r, 0.6)


def chain(pts, radii, s0=0.0, s1=1.0, step=0.5):
    """Resample a 3D polyline with radii into balls about `step` apart."""
    out = []
    seg = list(zip(zip(pts, radii), zip(pts[1:], radii[1:])))
    total = sum(math.dist(a, b) for (a, _), (b, _) in seg) or 1
    run = 0.0
    for (a, ra), (b, rb) in seg:
        d = math.dist(a, b)
        n = max(1, int(d / step))
        for i in range(n):
            u = i / n
            out.append((tuple(lerp(a[j], b[j], u) for j in range(3)), lerp(ra, rb, u), lerp(s0, s1, (run + d * u) / total)))
        run += d
    out.append((tuple(pts[-1]), radii[-1], s1))
    return out


def ripple(c, shore, frame, n, spread=0, gaps=3):
    """Light rings where the body meets the water, widening with the frame."""
    if not shore:
        return
    xs = sorted(shore)
    x0, x1 = xs[0], xs[-1]
    y = max(shore.values())
    for x in range(x0 - 1, x1 + 2):
        if (x + frame) % gaps:
            c.post[(x, shore.get(x, y) + 1)] = "x"
    if spread:
        w = (frame % n) / n * spread
        for x in range(round(x0 - 2 - w), round(x1 + 3 + w)):
            if (x * 7 + frame) % 4 == 0:
                c.post[(x, round(y + 2 + w * 0.3))] = "x"


def frame_canvas():
    return Canvas()


def finish(c):
    return c.finish()


# --------------------------------------------------------------------- snakes
def _snake(o, d, m, l, b, p, q, k="#0b0908", n="#c97a7a", r="#b59a6a"):
    return dict(o=o, d=d, m=m, l=l, b=b, p=p, q=q, e="#0a0807", k=k, n=n, t="#c8323a", w="#f2ecdc", r=r)


SNAKES = {
    # Spectacled cobra: a ringed spectacle on the back of the hood, the
    # throat pale with two dark spots.
    "indian-cobra": dict(L=30, R=1.5, hw=1.7, hl=3.6, pattern="faint", hood=5.6, warn="hood", mouth="n",
                         coats={"brown": _snake("#120c06", "#4d3417", "#7d5a2b", "#a07a40", "#dcc790", "#2d1e0e", "#e8d7a2")}),
    "egyptian-cobra": dict(L=32, R=1.55, hw=1.7, hl=3.6, pattern="plain", hood=4.4, warn="hood", mouth="n", band=True,
                           coats={"olive": _snake("#100c08", "#3d3122", "#655339", "#86714f", "#c9b88f", "#1c150d", "#a89470")}),
    # Thick, with three rows of dark-ringed spots like a chain.
    "russells-viper": dict(L=26, R=2.0, hw=2.4, hl=4.0, pattern="chain", hood=0, warn="coil", mouth="n",
                           coats={"tan": _snake("#140d06", "#5a4022", "#9a7442", "#bb9560", "#e1cfa2", "#3a230f", "#efe1bc")}),
    # Small and sandy; it rubs its coils to rasp a warning.
    "saw-scaled-viper": dict(L=17, R=1.35, hw=1.8, hl=3.0, pattern="saddle", hood=0, warn="coil", mouth="n",
                             coats={"sand": _snake("#18110a", "#6a5235", "#a3875e", "#c4a97e", "#e6d8b5", "#4b3520", "#efe4c6")}),
    # Grey, long and slender; the black is inside the mouth.
    "black-mamba": dict(L=38, R=1.25, hw=1.45, hl=4.0, pattern="plain", hood=1.6, warn="rear", mouth="k",
                        coats={"grey": _snake("#0d0d0b", "#3c3d35", "#62645a", "#828577", "#b9b9a2", "#2a2b25", "#9fa190")}),
    "western-diamondback": dict(L=30, R=1.75, hw=2.2, hl=3.8, pattern="diamond", hood=0, warn="rattle", mouth="n", tail="coon",
                                coats={"grey": _snake("#120e0a", "#5a4b3a", "#8f7c63", "#ad9a7e", "#ddd2b6", "#3d2e22", "#e4dccb")}),
    "timber-rattlesnake": dict(L=28, R=1.7, hw=2.1, hl=3.7, pattern="chevron", hood=0, warn="rattle", mouth="n", tail="black",
                               coats={"yellow": _snake("#130e06", "#6b5524", "#a88a43", "#c6a85e", "#e4d49c", "#2a1e10", "#e9dcae"),
                                      "dark": _snake("#0e0b08", "#3b3226", "#5f5240", "#7a6b55", "#b4a68a", "#1c1610", "#a69780")}),
    # Grey males, brown females, both with the zigzag.
    "european-adder": dict(L=17, R=1.4, hw=1.75, hl=3.0, pattern="zigzag", hood=0, warn="coil", mouth="n",
                           coats={"grey": _snake("#100e0c", "#5b5650", "#918b80", "#b3ada0", "#d9d3c2", "#1d1916", "#cfc8b8"),
                                  "brown": _snake("#120b06", "#5d3a1e", "#8e6236", "#ae7f4d", "#d6b585", "#2a170b", "#c9a072")},
                           weights={"grey": 1, "brown": 1}),
}
SNAKE_STATES = {"idle": 16, "wander": 8, "flee": 8, "chase": 8, "pounce": 8, "rest": 16, "warn": 16}


def snake_dims(sp):
    L = SNAKES[sp]["L"]
    return round(0.9 * L + 12), max(round(0.41 * L) + 4, round(0.21 * L) + 18)


def turtle(L, theta, zf=lambda a: 0.0, head=(0.0, 0.0), step=0.5):
    """Walk back from the head: theta(a) the heading at arclength a."""
    f, u = head
    pts = []
    a = 0.0
    z = zf(0.0)
    while a <= L:
        pts.append((f, u, z))
        nz = zf(a + step)
        h = math.sqrt(max(0.0, step * step - (nz - z) ** 2))
        t = theta(a)
        f -= math.cos(t) * h
        u -= math.sin(t) * h
        z = nz
        a += step
    return pts


def wound(neck, L, R, rho=None, step=0.5):
    """Carry a neck on into a flat spiral of touching loops, inside out, until
    the body is L long."""
    run = sum(math.dist(a, b) for a, b in zip(neck, neck[1:]))
    (f1, u1, _), (f0, u0, _) = neck[-2], neck[-1]
    d = math.hypot(f0 - f1, u0 - u1) or 1
    tf, tu = (f0 - f1) / d, (u0 - u1) / d
    gap = 2 * R + 0.5
    rho = rho or gap * 0.9
    out = list(neck)
    for sign in (1, -1):
        cf, cu = f0 - tu * sign * rho, u0 + tf * sign * rho
        phi = math.atan2(u0 - cu, f0 - cf)
        nf, nu = cf + rho * math.cos(phi + 0.05), cu + rho * math.sin(phi + 0.05)
        if (nf - f0) * tf + (nu - u0) * tu > 0:
            break
    a, dphi = run, 0.0
    while a < L:
        r = rho + gap * dphi / (2 * math.pi)
        dphi += step / r
        r = rho + gap * dphi / (2 * math.pi)
        out.append((cf + r * math.cos(phi + dphi), cu + r * math.sin(phi + dphi), 0.0))
        a += step
    return out


@functools.cache
def snake_spine(sp, state, frame, view="east"):
    """Spine points head first, the head's heading (radians in the ground
    plane), pitch (degrees, up positive) and gape (0 shut, 1 wide)."""
    K = SNAKES[sp]
    L, R = K["L"], K["R"]
    n = SNAKE_STATES[state]
    t = frame / n
    S = dict(pitch=0.0, gape=0.0, tongue=False, hood=0.0, rattle=None, heading=None)
    if state in ("wander", "flee", "chase"):
        lam = L * (0.42 if state == "wander" else 0.5)
        B = {"wander": 1.1, "flee": 1.25, "chase": 1.0}[state]
        env = lambda a: min(1.0, 0.2 + a / (0.3 * L)) * (1 - 0.3 * max(0.0, a / L - 0.8) / 0.2)
        theta = lambda a: B * env(a) * math.sin(2 * math.pi * (a / lam - t))
        zf = (lambda a: max(0.0, 2.4 - a * 0.4)) if state == "chase" else (lambda a: 0.0)
        pts = turtle(L, theta, zf, (0.42 * L, 0))
        mu = sum(p[1] for p in pts) / len(pts)
        S["pts"] = [(f, u - mu, z) for f, u, z in pts]
        S["tongue"] = state == "chase" and frame % 4 < 2 or state == "wander" and frame in (2, 3)
        S["pitch"] = 6 if state == "chase" else 0
        return S
    if state in ("idle", "rest"):
        look = 0.0
        lift = 0.8
        if state == "idle":
            look = smooth([(0, 0.0), (0.3, 0.0), (0.4, 0.6), (0.62, 0.6), (0.72, -0.4), (0.9, -0.4)], t)
            lift = smooth([(0, 2.6), (0.35, 3.4), (0.7, 2.6), (0.9, 2.3)], t)
        neck_len = 0.2 * L
        neck = turtle(neck_len, lambda a: look + 0.7 * math.sin(a / neck_len * math.pi),
                      lambda a: max(0.0, lift * (1 - a / (neck_len * 0.8))), (0, 0))
        S["pts"] = wound(neck, L, R)
        S["heading"] = look
        S["tongue"] = state == "idle" and frame in (3, 4, 10, 11) or state == "rest" and frame in (6, 7)
    elif state == "warn":
        S.update(warn_spine(sp, frame, t, view))
    elif state == "pounce":
        u = {0: 0.0, 1: 0.0, 2: 0.6, 3: 1.0, 4: 1.0, 5: 0.6, 6: 0.25, 7: 0.0}[frame]
        S["pts"] = s_coil(K, reach=u, rise=3.4 * (1 - u) + 1.0)
        S["gape"] = {2: 0.6, 3: 1.0, 4: 0.8, 5: 0.3}.get(frame, 0.0)
        S["pitch"] = 12 * (1 - u)
        S["heading"] = 0.0
    # Centre the drawing on the coil.
    pts = S["pts"]
    fs = [p[0] for p in pts]
    us = [p[1] for p in pts]
    mf, mu = (max(fs) + min(fs)) / 2, (max(us) + min(us)) / 2
    S["pts"] = [(f - mf, u - mu, z) for f, u, z in pts]
    return S


def s_coil(K, reach=0.0, rise=3.0, back=0.0):
    """The striking coil: the fore third in an S raised off the ground, the
    rest wound under it; reach 1 throws the S out straight."""
    L = K["L"]
    fore = 0.34 * L
    amp = 1.5 * (1 - reach)
    neck = turtle(fore, lambda a: amp * math.sin(a / fore * 2 * math.pi + back),
                  lambda a: max(0.0, rise * (1 - a / fore)), (0, 0))
    return wound(neck, L, K["R"], rho=K["R"] * 2.2)


def warn_spine(sp, frame, t, view):
    K = SNAKES[sp]
    L, R = K["L"], K["R"]
    style = K["warn"]
    tongue = frame % 8 in (2, 3)
    if style in ("hood", "rear"):
        # A third of the body stood up out of the coil, swaying slowly.
        H = 0.36 * L
        sway = 1.8 * math.sin(2 * math.pi * t)
        lean = 0.8 * math.sin(2 * math.pi * t + 1.3)
        col = []
        n = int(H / 0.5)
        for i in range(n + 1):
            v = 1 - i / n
            col.append((lean * v ** 1.5 + 1.2 * (1 - v) * v * 2, sway * v ** 1.5, H * v))
        # The coil is laid toward the camera, where it does not hide the hood.
        df, du = {"south": (1, 0), "north": (-1, 0)}.get(view, (0, 1))
        col += [(col[-1][0] + df * 0.6 * k, col[-1][1] + du * 0.6 * k, 0.0) for k in (1, 2, 3)]
        pts = wound(col, L, R, rho=R * 2.4)
        if style == "rear":
            return dict(pts=pts, pitch=-14, gape=smooth([(0, 0.8), (0.4, 1.0), (0.6, 0.7), (0.85, 1.0)], t),
                        tongue=False, hood=0.5, heading=0.25 * math.sin(2 * math.pi * t))
        return dict(pts=pts, pitch=22, tongue=tongue, heading=0.2 * math.sin(2 * math.pi * t),
                    hood=smooth([(0, 0.85), (0.25, 1.0), (0.6, 0.95), (0.8, 1.0)], t))
    if style == "rattle":
        back = 0.5 * math.sin(2 * math.pi * t)
        pts = s_coil(K, reach=0, rise=4.6 + 0.6 * math.sin(4 * math.pi * t), back=back)
        # the tail end stood up out of the coil, shivering
        tail = int(len(pts) * 0.9)
        f, u, z = pts[tail]
        pts = pts[:tail] + [(f, u, z + i * 0.5) for i in range(1, 10)]
        return dict(pts=pts, pitch=8, tongue=tongue, rattle=frame % 2, heading=0.0)
    # vipers and the adder: an S thrown back, the body blown up, hissing
    back = 0.5 * smooth([(0, 0.0), (0.5, 1.0)], t)
    pts = s_coil(K, reach=0, rise=2.8 + 0.5 * math.sin(2 * math.pi * t), back=back)
    return dict(pts=pts, pitch=6, gape=0.35 if frame % 8 in (5, 6) else 0.0, tongue=tongue, heading=0.0)



def snake_pattern(K, L):
    style = K["pattern"]
    R = K["R"]

    def roles(base, k, q, P):
        p, r, s = P["balls"][k]
        if base == "d":
            return None
        a = s * L
        lat = lateral(P, k, q)
        tail = K.get("tail")
        if s > 0.9 and tail == "coon":
            return "k" if int(a / 1.3) % 2 else "w"
        if s > 0.86 and tail == "black":
            return "k" if base != "l" else "d"
        v = (a / 4.2) % 1 - 0.5
        if style == "diamond":
            e = abs(v) * 2 + abs(lat) * 0.75
            return "p" if e < 0.55 else "q" if e < 0.85 else None
        if style == "chevron":
            v = (a / 3.6 + abs(lat) * 0.25) % 1 - 0.5
            return "p" if abs(v) < 0.17 else None
        if style == "zigzag":
            v = (a / 3.0) % 1
            tgt = (abs(v - 0.5) * 4 - 1) * 0.6
            return "p" if abs(lat - tgt) < 0.55 else None
        if style == "chain":
            v = (a / 4.4) % 1 - 0.5
            w = (a / 4.4 + 0.5) % 1 - 0.5
            if abs(lat) < 0.55:
                return "p" if abs(v) < 0.2 else "q" if abs(v) < 0.3 else None
            return "p" if abs(w) < 0.18 else None
        if style == "saddle":
            v = (a / 2.8) % 1 - 0.5
            return "q" if abs(v) < 0.14 and abs(lat) < 0.6 else "p" if abs(lat) > 0.75 and abs(v) > 0.3 else None
        if style == "faint":
            v = (a / 6.0) % 1 - 0.5
            return "d" if abs(v) < 0.08 and base == "m" else None
        return None
    return roles


def snake_head(parts, K, H, back_dir, pitch, gape, hood_open, style):
    """Jaws at head point H, pointing opposite to the spine's first step."""
    fx, fu = -back_dir[0], -back_dir[1]
    n = math.hypot(fx, fu) or 1
    fx, fu = fx / n, fu / n
    cp, sp_ = math.cos(math.radians(pitch)), math.sin(math.radians(pitch))
    fwd = (fx * cp, fu * cp, sp_)
    lat = (-fu, fx, 0.0)
    up = (-fx * sp_, -fu * sp_, cp)
    hl, hw = K["hl"], K["hw"]
    viper = K["warn"] in ("coil", "rattle")

    def P(x, y, z):
        return tuple(H[i] + fwd[i] * x + lat[i] * y + up[i] * z for i in range(3))

    def width(x):
        v = x / hl
        return hw * (1 - 0.55 * v * v) if viper else hw * (0.85 + 0.15 * math.sin(math.pi * min(1, v * 1.4))) * (1 - 0.35 * v * v)

    g = gape * 55
    upper, lower, inside = [], [], []
    rr = 0.85
    x = -0.4
    while x <= hl:
        w = width(x)
        for y in (-(w - rr), 0.0, w - rr):
            upper.append((P(x, y, 0.35), rr, x / hl))
        x += 0.45
    if gape > 0:
        ca, sa = math.cos(math.radians(g)), math.sin(math.radians(g))
        x = 0.0
        while x <= hl * 0.95:
            w = width(x) * 0.8
            for y in (-(w - rr), 0.0, w - rr):
                lower.append((P(x * ca, y, -x * sa - 0.3), rr * 0.9, x / hl))
            mid = math.radians(g / 2)
            if x < hl * 0.85:
                inside.append((P(x * math.cos(mid) * 0.95, 0, -x * math.sin(mid) * 0.95), max(0.6, w * 0.7), x / hl))
            x += 0.45
        mouth = K["mouth"]
        parts.append(part(inside, roles=lambda b, k, q, P: mouth, bias=0.01, name="mouth"))
        parts.append(part(lower, joined=("neck",), bias=0.015, name="jaw"))
    parts.append(part(upper, joined=("neck", "jaw"), bias=0.03, name="head"))
    eyes = [P(hl * 0.42, s * (width(hl * 0.42) - 0.35), 0.75) for s in (-1, 1)]
    tip = P(hl + 0.2, 0, 0.1)
    return dict(eyes=eyes, tip=tip, fwd=fwd, lat=lat, P=P, gape=g)


def hood_part(K, pts, hood, heading):
    """The hood: ribs spread either side of the neck, flat in the plane
    across the body."""
    if not hood:
        return None
    L = K["L"]
    balls = []
    a0, a1 = 1.2, 0.22 * L
    i0, i1 = int(a0 / 0.5), min(len(pts) - 2, int(a1 / 0.5))
    for i in range(i0, i1):
        f, u, z = pts[i]
        f2, u2, _ = pts[i + 1]
        dx, du = f - f2, u - u2
        n = math.hypot(dx, du) or 1
        lat = (-du / n, dx / n) if heading is None else (-math.sin(heading), math.cos(heading))
        v = (i - i0) / max(1, i1 - i0)
        w = K["hood"] * hood * (lerp(0.55, 1.0, v / 0.35) if v < 0.35 else lerp(1.0, 0.4, (v - 0.35) / 0.65))
        y = -w
        while y <= w:
            balls.append(((f + lat[0] * y - abs(y) * 0.4, u + lat[1] * y, z), 0.9, (v, y / max(w, 0.1))))
            y += 0.6
    return balls


def draw_snake(sp, state, facing, frame):
    global KD
    KD = 0.75
    K = SNAKES[sp]
    W, GM = snake_dims(sp)
    rig.use(1.0, GM, W, 0, PALETTES[sp])
    view = "east" if facing in ("east", "west") else facing
    S = snake_spine(sp, state, frame, view)
    pts = S["pts"]
    L = K["L"]
    radius = lambda a: K["R"] * (0.78 if a < 0.12 else min(1.0, 0.78 + (a - 0.12) * 1.6)) * (1 - 0.6 * max(0.0, a - 0.65) / 0.35) + (0.25 if state == "warn" and K["warn"] == "coil" else 0)
    balls = [(p, max(0.6, radius(i / (len(pts) - 1))), i / (len(pts) - 1)) for i, p in enumerate(pts)]
    parts = []
    seg = 8
    roles = snake_pattern(K, L)
    names = [f"b{j}" for j in range(0, len(balls), seg)]
    for j in range(0, len(balls), seg):
        nm = f"b{j}"
        parts.append(part(balls[max(0, j - 1):j + seg + 1], roles=roles,
                          joined={f"b{j + k * seg}" for k in (-2, -1, 1, 2)} | ({"neck", "head", "hood", "jaw", "rattle"} if j <= 2 * seg else {"rattle"}),
                          name=nm))
    parts[0]["name"] = "neck"
    for P in parts[1:2]:
        P["joined"].add("neck")
    if S["rattle"] is not None:
        f, u, z = pts[-1]
        jig = (0.6 if S["rattle"] else -0.6)
        rb = [((f + jig * (i / 3), u, z + 0.5 + i * 0.9), 0.95 - i * 0.08, 0) for i in range(4)]
        parts.append(part(rb, roles=lambda b, k, q, P: "r" if b != "d" else "d", joined={names[-1]}, name="rattle"))
    elif K["warn"] == "rattle":
        f, u, z = pts[-1]
        d = (pts[-1][0] - pts[-2][0], pts[-1][1] - pts[-2][1])
        n = math.hypot(*d) or 1
        rb = [((f + d[0] / n * i * 0.8, u + d[1] / n * i * 0.8, z + 0.3), 0.85, 0) for i in range(1, 4)]
        parts.append(part(rb, roles=lambda b, k, q, P: "r" if b != "d" else "d", joined={names[-1]}, name="rattle"))
    hb = hood_part(K, pts, S["hood"], S["heading"])
    if hb:
        band = K.get("band")

        def hood_roles(base, k, q, P):
            v, y = P["balls"][k][2]
            if base == "d":
                return None
            if view == "south":
                if band and 0.5 < v < 0.68:
                    return "p"
                if sp == "indian-cobra" and 0.25 < v < 0.45 and 0.35 < abs(y) < 0.75:
                    return "p"
                return "b" if abs(y) < 0.75 else None
            if view == "north" and sp == "indian-cobra":
                e = math.hypot((v - 0.35) * 2.4, abs(y) - 0.48)
                return "p" if e < 0.17 else "q" if e < 0.33 else None
            return None
        parts.append(part(hb, roles=hood_roles, joined={"neck", "head", "b8", "b16"}, bias=0.02, name="hood"))
    h = S["heading"]
    d0 = (pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) if h is None else (-math.cos(h), -math.sin(h))
    hd = snake_head(parts, K, pts[0], d0, S["pitch"], S["gape"], S["hood"], K["warn"])
    cx = W / 2
    lo = max(proj(p, view, 0, 0)[1] for i in range(SNAKE_STATES[state]) for p in snake_spine(sp, state, i, view)["pts"])
    gy = GM - 1 - max(0.0, lo)
    c = Canvas()
    render(c, parts, view, cx, gy)
    head_d = proj(pts[0], view, cx, gy)[2]
    for e in hd["eyes"]:
        X, Y, dpt = proj(e, view, cx, gy)
        if view != "north" and (view == "south" or dpt >= head_d - 0.05):
            c.px[rig.at((X, Y))] = "e"
    if S["tongue"]:
        tip = hd["tip"]
        fw, la = hd["fwd"], hd["lat"]
        for x, y in ((0.9, 0), (1.8, 0), (2.6, 0.6), (2.6, -0.6)):
            p3 = tuple(tip[i] + fw[i] * x + la[i] * y for i in range(3))
            X, Y, _ = proj(p3, view, cx, gy)
            c.post[rig.at((X, Y))] = "t"
    if S["gape"] > 0.5 and K["mouth"] != "k":
        P3 = hd["P"]
        X, Y, _ = proj(P3(K["hl"] * 0.8, 0, -0.6), view, cx, gy)
        c.px[rig.at((X, Y))] = "w"
    if S["rattle"] is not None and S["rattle"] == 1:
        # the blur: two light ticks either side of the shaking rattle
        f, u, z = pts[-1]
        for dx in (-1.6, 1.6):
            X, Y, _ = proj((f + dx, u, z + 2.2), view, cx, gy)
            c.post[rig.at((X, Y))] = "w"
            c.post[rig.at((X, Y - 1.2))] = "w"
    im = c.finish()
    return _mirror(im) if facing == "west" else im


# ------------------------------------------------------------- crocodilians
def _croc(o, d, m, l, b, p, s, y="#c9a23a"):
    return dict(o=o, d=d, m=m, l=l, b=b, p=p, s=s, e="#0b0a07", y=y, n="#e2cf8e", w="#f4f0e0", x="#c3d3c4")


CROCS = {
    "nile-crocodile": dict(s=1.0, snout=1.55, sl=12.5, coats={
        "olive": _croc("#0e0d07", "#3a3a20", "#5e5d33", "#7f7c49", "#cbbf86", "#2a2914", "#33321b")}),
    "saltwater-crocodile": dict(s=1.12, snout=1.9, sl=12.0, coats={
        "grey": _croc("#0d0c09", "#3a3527", "#605840", "#827959", "#d2c79a", "#27231a", "#2f2b20")}),
    "mugger-crocodile": dict(s=0.86, snout=2.6, sl=10.0, coats={
        "grey": _croc("#0c0c0a", "#3d3d34", "#62624f", "#83836a", "#c7c09a", "#2a2a22", "#33332a")}),
    "american-alligator": dict(s=0.92, snout=2.9, sl=10.5, coats={
        "black": _croc("#080807", "#22231e", "#373831", "#4c4e44", "#c9c4a8", "#151612", "#1b1c18", y="#b8b25a")}),
}
CROC_STATES = {"idle": 16, "rest": 16, "wander": 8, "flee": 8, "chase": 8, "pounce": 8, "warn": 16, "lurk": 16, "swim": 8}
CGM, CW, CHM = 30, 76, 14


def croc_pose(state, frame):
    n = CROC_STATES[state]
    t = frame / n
    p = dict(lift=2.6, gape=0.0, tail=0.0, phase=None, stride=0, water=None, head_z=0.0, puff=0.0, splash=0,
             eyes=1.0, head_f=0.0, tail_up=0.0, sprawl=1.0, surge=0.0, eye_shut=False)
    if state == "idle":
        # Basking: the jaws come slowly open and stay open a long while.
        p.update(lift=2.4, gape=smooth([(0, 0.0), (0.15, 0.0), (0.35, 0.75), (0.8, 0.75), (0.92, 0.0)], t),
                 tail=0.25 * math.sin(2 * math.pi * t), eye_shut=frame in (6, 7))
    elif state == "rest":
        p.update(lift=2.1, gape=smooth([(0, 0.0), (0.4, 0.0), (0.5, 0.45), (0.85, 0.45), (0.95, 0.0)], t),
                 eye_shut=not (0.5 <= t < 0.6))
    elif state in ("wander", "flee", "chase"):
        # The high walk: belly clear of the ground, legs under the body.
        fast = state != "wander"
        p.update(lift=6.0 if state == "wander" else 5.0 if state == "chase" else 3.6, phase=t, stride=3.2 if not fast else 4.6,
                 tail=(0.6 if fast else 0.4) * math.sin(2 * math.pi * t), sprawl=0.45 if state == "wander" else 0.7,
                 gape=0.25 if state == "chase" else 0.0)
    elif state == "warn":
        # The hiss: high on the legs, body blown up, jaws wide.
        p.update(lift=4.5 + 0.5 * math.sin(2 * math.pi * t), puff=1.2 + 0.4 * math.sin(2 * math.pi * t),
                 gape=smooth([(0, 0.85), (0.3, 1.0), (0.6, 0.9), (0.85, 1.0)], t), head_z=2.0, sprawl=0.6,
                 tail=0.8 * math.sin(2 * math.pi * t), tail_up=1.0)
    elif state == "lurk":
        p.update(water=4.4, lift=0.0, tail=0.1 * math.sin(2 * math.pi * t), eyes=1.0,
                 head_z=-0.15 * math.sin(2 * math.pi * t), eye_shut=frame in (11,), sprawl=1.4)
    elif state == "swim":
        p.update(water=3.6, lift=0.0, tail=1.4 * math.sin(2 * math.pi * t), sprawl=1.6)
    elif state == "pounce":
        # Out of the water in one burst, jaws wide, then they slam shut.
        u = {0: 0.0, 1: 0.3, 2: 0.8, 3: 1.0, 4: 1.0, 5: 0.7, 6: 0.35, 7: 0.1}[frame]
        p.update(water=lerp(3.8, 0.5, u), lift=lerp(0.0, 3.0, u), head_z=lerp(0.0, 6.0, u), surge=u * 6,
                 gape={0: 0.2, 1: 0.7, 2: 1.0, 3: 1.0, 4: 0.3, 5: 0.0, 6: 0.0, 7: 0.0}[frame],
                 tail=0.9 * math.sin(frame), splash=frame if frame < 6 else 0, sprawl=1.2)
    return p


def croc_parts(sp, p):
    K = CROCS[sp]
    sn, sl = K["snout"], K["sl"]
    lift = p["lift"]
    bz = lift + 2.6 + p["puff"] * 0.5
    sf = p["surge"]
    tail_w = p["tail"]
    parts = []
    # body: neck, torso and tail as one, flat across
    spine = []
    for i in range(40):
        f = 16 - i * 1.25
        v = i / 39
        r = 3.6 + 0.7 * math.sin(math.pi * min(1, v * 2.2)) + p["puff"] * (1 - v) * 0.6
        if v > 0.42:
            r = lerp(3.8, 0.9, (v - 0.42) / 0.58)
        u = tail_w * 6 * max(0.0, v - 0.4) ** 1.6 * math.sin(v * 5 - 0.5) if v > 0.4 else 0.0
        z = bz if v < 0.42 else lerp(bz, 1.3 + p["tail_up"] * 3 * math.sin(math.pi * (v - 0.42) / 0.58), (v - 0.42) / 0.58)
        z = max(z, r * 0.65 if p["water"] is None else z)
        spine.append(((f + sf, u, z), r, v))
    wide = []
    for (f, u, z), r, v in spine:
        spread = r * 0.55 if v < 0.55 else r * 0.25
        for y in (-spread, 0.0, spread):
            wide.append(((f, u + y, z - (0.3 if y else 0)), r * 0.72, (v, y / max(spread, 0.1))))

    def scutes(base, k, q, P):
        v, y = P["balls"][k][2]
        if base == "d":
            return "b" if v < 0.45 and q[1] % 2 == 0 and P.get("side") else None
        if v > 0.45:
            band = (v * 15) % 1 < 0.28
            if band:
                return "p"
            if abs(y) > 0.5 and (q[0] + q[1]) % 2 == 0 and base == "l":
                return "d"
        elif (q[0] // 2 + q[1]) % 2 == 0 and abs(y) < 0.6 and base == "m":
            return "p" if (q[0] + 2 * q[1]) % 5 == 0 else None
        return None
    parts.append(part(wide, roles=scutes, name="body", joined=("head", "jaw")))
    # legs: shoulders at f=11, hips at f=-1
    for key, f0, side in (("fl", 10.0, -1), ("fr", 10.0, 1), ("hl", -1.5, -1), ("hr", -1.5, 1)):
        hind = key[0] == "h"
        ph = 0.0
        dx, up = 0.0, 0.0
        if p["phase"] is not None:
            off = {"fl": 0.0, "hr": 0.0, "fr": 0.5, "hl": 0.5}[key]
            tt = (p["phase"] + off) % 1
            if tt < 0.6:
                dx = p["stride"] * (1 - 2 * tt / 0.6)
            else:
                uu = (tt - 0.6) / 0.4
                dx, up = -p["stride"] + 2 * p["stride"] * uu, 2.0 * math.sin(math.pi * uu)
        out = 3.0 + 4.5 * p["sprawl"]
        root = (f0 + sf, side * 3.2, bz - 0.5)
        foot = (f0 + sf + dx + (1.5 if hind else 1.0), side * out, max(0.0, up) if p["water"] is None else bz - 3.5)
        if p["water"] is not None and p["phase"] is None:
            foot = (f0 + sf + (-4 if hind else -2.5), side * (out + 1), bz - 2.5)
        knee = ((root[0] + foot[0]) / 2 + (-1.2 if hind else 1.0), side * (3.0 + out) / 2 + side * 1.2, max(root[2], foot[2]) * 0.55 + 1.6)
        rr = 1.9 if hind else 1.6
        lb = chain([root, knee, foot], [rr, rr * 0.8, rr * 0.7])
        lb.append(((foot[0] + 1.0, foot[1], foot[2]), 1.0, 1))
        parts.append(part(lb, joined=("body",), name=key))
    # head
    hz = bz + p["head_z"] + 0.4
    hinge = (16.5 + sf, 0.0, hz)
    g = p["gape"] * 48
    up = math.radians(g * 0.38)
    dn = math.radians(g * 0.62)

    def width(x):
        v = x / sl
        return lerp(4.2, sn, min(1.0, v * 1.25)) + (0.5 if v > 0.88 else 0)

    upper, lower, inside = [], [], []
    x = -1.5
    while x <= sl:
        w = width(max(0, x))
        th = 1.7 if x < 3 else 1.2
        zz = (0.9 if x < 3.5 else 0.35)
        for y in [i * 0.9 - (w - 1.0) for i in range(int(2 * (w - 1.0) / 0.9) + 1)] or [0.0]:
            upper.append(((hinge[0] + x * math.cos(up), y, hinge[2] + zz + x * math.sin(up)), th * 0.75, (x / sl, y / w)))
        if g > 0 or x > -0.5:
            w2 = w * 0.92
            for y in [i * 0.9 - (w2 - 1.0) for i in range(int(2 * (w2 - 1.0) / 0.9) + 1)] or [0.0]:
                lower.append(((hinge[0] + x * math.cos(dn), y, hinge[2] - 0.7 - x * math.sin(dn)), 0.95, (x / sl, y / w2)))
            if g > 4 and x > 0:
                mid = (up - dn) / 2
                inside.append(((hinge[0] + x * 0.97 * math.cos(mid), 0.0, hinge[2] + x * math.sin(mid) * 0.97), max(0.8, w * 0.75), x / sl))
        x += 0.6
    if inside:
        parts.append(part(inside, roles=lambda b, k, q, P: "n", bias=0.01, name="mouth", joined=("body",)))

    def jaw_roles(base, k, q, P):
        xv, y = P["balls"][k][2]
        if base == "d" and g > 4:
            return "w" if (q[0] + q[1]) % 2 == 0 and 0.08 < xv < 0.95 else "b"
        return None
    parts.append(part(lower, roles=jaw_roles, joined=("body",), bias=0.02, name="jaw"))

    def head_roles(base, k, q, P):
        xv, y = P["balls"][k][2]
        if base == "d" and g > 4:
            return "w" if (q[0] + q[1]) % 2 == 0 and 0.1 < xv < 0.95 else None
        if base == "m" and xv < 0.25 and abs(y) < 0.5 and (q[0] + q[1]) % 3 == 0:
            return "p"
        return None
    parts.append(part(upper, roles=head_roles, joined=("body", "jaw"), bias=0.03, name="head"))
    eye_x = 1.0
    eyes = [(hinge[0] + eye_x * math.cos(up), s * 2.3, hinge[2] + 2.0 + eye_x * math.sin(up)) for s in (-1, 1)]
    nostril = (hinge[0] + (sl - 0.3) * math.cos(up), 0.0, hinge[2] + 1.0 + (sl - 0.3) * math.sin(up))
    return parts, eyes, nostril, bz


def draw_croc(sp, state, facing, frame):
    global KD
    K = CROCS[sp]
    rig.use(K["s"], CGM, CW, CHM, PALETTES[sp])
    view = "east" if facing in ("east", "west") else facing
    p = croc_pose(state, frame)
    c = Canvas()
    cx = CW / 2 - 2
    KD = 0.5 if view == "east" else 0.65
    gy = CGM - 1 if view == "east" else CGM - 1 - KD * (29 if view == "south" else 34)
    if state == "lurk":
        # Only the eyes, the nostrils and the hump of the head show.
        parts, eyes, nostril, bz = croc_parts(sp, p)
        keep = [P for P in parts if P["name"] in ("head",)]
        shore = render(c, keep, view, cx, gy, water=p["water"])
        for e in eyes + [nostril]:
            X, Y, d = proj(e, view, cx, gy)
            m = disk(X, Y - 0.4, 0.9)
            for q in m:
                c.px[q] = "m"
            c.px[rig.at((X, Y - 0.6))] = "l"
        for e in eyes:
            X, Y, d = proj(e, view, cx, gy)
            if view != "north":
                c.px[rig.at((X, Y))] = "d" if p["eye_shut"] else "y"
                if not p["eye_shut"]:
                    c.px[rig.at((X + (0.6 if view == "east" else 0), Y))] = "e"
        X, Y, _ = proj(nostril, view, cx, gy)
        c.px[rig.at((X, Y))] = "e"
        if not shore:
            for e in eyes + [nostril]:
                X, Y, _ = proj(e, view, cx, gy)
                shore[rig.at((X, Y))[0]] = rig.at((X, Y))[1]
        ripple(c, shore, frame, 16, spread=5, gaps=4)
        im = c.finish()
        return _mirror(im) if facing == "west" else im
    parts, eyes, nostril, bz = croc_parts(sp, p)
    shore = render(c, parts, view, cx, gy, water=p["water"])
    for e in eyes:
        X, Y, d = proj(e, view, cx, gy)
        if view == "north":
            continue
        if view == "east" and d < 0:
            continue
        q = rig.at((X, Y))
        c.px[q] = "d" if p["eye_shut"] else "y"
        if not p["eye_shut"]:
            c.px[(q[0] + (1 if view == "east" else 0), q[1])] = "e"
    X, Y, _ = proj(nostril, view, cx, gy)
    c.px[rig.at((X, Y))] = "e"
    if p["water"] is not None:
        ripple(c, shore, frame, CROC_STATES[state], spread=4 if state == "swim" else 0, gaps=3)
    if p["splash"]:
        for i in range(10):
            a = i * 0.63 + p["splash"]
            rr = 4 + p["splash"] * 1.4 + (i % 3)
            X, Y, _ = proj((16 + p["surge"] + math.cos(a) * rr * 0.5, math.sin(a) * rr, 2.0 + abs(math.sin(a * 1.7)) * p["splash"] * 0.9), view, cx, gy)
            c.post[rig.at((X, Y))] = "x"
    im = c.finish()
    return _mirror(im) if facing == "west" else im


# ------------------------------------------------------------------- build
SPECIES = list(SNAKES) + list(CROCS)
STATES = {**{sp: dict(SNAKE_STATES) for sp in SNAKES}, **{sp: dict(CROC_STATES) for sp in CROCS}}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in {**SNAKES, **CROCS}.items()}
NATIVE_SIZES = {**{sp: (snake_dims(sp)[0], snake_dims(sp)[1] + 4) for sp in SNAKES},
                **{sp: (round(CW * k["s"]), round(CGM * k["s"]) + 4 + round(CHM * k["s"])) for sp, k in CROCS.items()}}
STANDING_SIZES = {**{sp: (snake_dims(sp)[0], 10) for sp in SNAKES},
                  **{sp: (round(CW * k["s"]), round(16 * k["s"])) for sp, k in CROCS.items()}}


def draw(species, state, facing, frame):
    return (draw_snake if species in SNAKES else draw_croc)(species, state, facing, frame)


def fauna_reptile():
    return {
        f"faunax-{sp}-{state}-{facing}-{frame}": draw(sp, state, facing, frame)
        for sp in SPECIES
        for state, count in STATES[sp].items()
        for facing in DIRECTIONS
        for frame in range(count)
    }


def looks():
    return {sp: {
        "roles": PALETTES[sp],
        "forms": [{"id": sp, "weight": 1.0, "where": None, "coats": k.get("weights", {next(iter(k["coats"])): 1})}],
        "coats": k["coats"],
        "coatFrom": {},
    } for sp, k in {**SNAKES, **CROCS}.items()}
