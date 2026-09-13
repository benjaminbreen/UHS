"""Fauna B: outlined, rim-shaded animal sprites with a correct gait.

Masses are drawn at native size, shaded by a light-above rule, then outlined
around the whole silhouette. Legs are hip-knee-foot segments driven by a walk
or gallop cycle, so grounded feet move backward and lifted feet move forward.
"""
import math
from PIL import Image, ImageDraw

# o outline · d shadow · m base · l light · h highlight · b second colour · e eye/nose · a accent
PALETTES = {
    "red-deer": {"o": "#6a3d22", "d": "#8f5732", "m": "#bb7941", "l": "#dc9d5f", "h": "#f1c78c", "b": "#f3e4c0", "e": "#2a1a12", "a": "#55301c"},
    "gray-wolf": {"o": "#3a4147", "d": "#535c61", "m": "#767f83", "l": "#a4aca9", "h": "#d3d6ce", "b": "#e4e5da", "e": "#1c1d1f", "a": "#c9a24d"},
    "sheep": {"o": "#7c6c57", "d": "#b3a98c", "m": "#ded6b9", "l": "#f2ecd5", "h": "#fffcec", "b": "#8a745b", "e": "#2a211a", "a": "#6b5744"},
    "chicken": {"o": "#7a4a22", "d": "#b7732d", "m": "#e2a247", "l": "#f3c975", "h": "#fbe7ad", "b": "#d9402f", "e": "#26190f", "a": "#e9b53a"},
    "rock-dove": {"o": "#3f4b50", "d": "#5b6a6f", "m": "#8b9b9d", "l": "#bbc6c2", "h": "#e8eade", "b": "#6c5687", "e": "#1e2224", "a": "#cf8a6a"},
    "house-sparrow": {"o": "#4d371f", "d": "#6b4a2d", "m": "#a27848", "l": "#cba770", "h": "#f0e2bf", "b": "#3c3025", "e": "#1e1610", "a": "#d9b978"},
}
STATES = {
    "house-sparrow": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "rock-dove": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "chicken": dict.fromkeys(["idle", "forage", "wander", "flee"], 8),
    "sheep": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "red-deer": dict.fromkeys(["idle", "forage", "wander", "flee", "rest"], 8),
    "gray-wolf": dict.fromkeys(["idle", "wander", "stalk", "chase", "rest"], 8),
}
# Sized against the 29px standing human: deer shoulder ~20px, wolf ~13px, sheep ~12px.
NATIVE_SIZES = {
    "house-sparrow": (14, 14),
    "rock-dove": (16, 16),
    "chicken": (18, 20),
    "sheep": (28, 26),
    "red-deer": (40, 40),
    "gray-wolf": (38, 26),
}


# ---------------------------------------------------------------- mask helpers
def _mask_from(draw_fn, w=64, h=64):
    im = Image.new("L", (w, h), 0)
    draw_fn(ImageDraw.Draw(im))
    px = im.load()
    return {(x, y) for y in range(h) for x in range(w) if px[x, y]}


def ellipse(box):
    x0, y0, x1, y1 = box
    return _mask_from(lambda d: d.ellipse((x0, y0, x1, y1), fill=255))


def polygon(points):
    return _mask_from(lambda d: d.polygon([(x, y) for x, y in points], fill=255))


def rect(box):
    x0, y0, x1, y1 = box
    return {(x, y) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}


def line(a, b, width=1):
    """Bresenham line; extra width is added to the right so legs stay crisp."""
    (x0, y0), (x1, y1) = (round(a[0]), round(a[1])), (round(b[0]), round(b[1]))
    out = set()
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    while True:
        for k in range(width):
            out.add((x0 + k, y0))
        if (x0, y0) == (x1, y1):
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    return out


def shift(mask, dx, dy):
    return {(x + dx, y + dy) for x, y in mask}


def shade(mask, top=1, bottom=1, base="m", light="l", dark="d"):
    """Light from above: top rim light, bottom rim dark, everything else base."""
    out = {}
    for x, y in mask:
        if any((x, y - k) not in mask for k in range(1, top + 1)):
            out[(x, y)] = light
        elif any((x, y + k) not in mask for k in range(1, bottom + 1)):
            out[(x, y)] = dark
        else:
            out[(x, y)] = base
    return out


def flat(mask, role):
    return {p: role for p in mask}


class Canvas:
    """Ordered layers of role pixels; one outline is drawn around the union."""

    def __init__(self, species):
        self.w, self.h = NATIVE_SIZES[species]
        self.palette = PALETTES[species]
        self.px = {}

    def paint(self, pixels):
        self.px.update(pixels)

    def dot(self, x, y, role):
        self.px[(round(x), round(y))] = role

    def finish(self):
        union = set(self.px)
        ring = set()
        for x, y in union:
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if (nx, ny) not in union:
                    ring.add((nx, ny))
        im = Image.new("RGBA", (self.w, self.h))
        px = im.load()
        for x, y in ring:
            if 0 <= x < self.w and 0 <= y < self.h:
                px[x, y] = _rgba(self.palette["o"])
        for (x, y), role in self.px.items():
            if 0 <= x < self.w and 0 <= y < self.h:
                px[x, y] = _rgba(self.palette[role])
        im.info["anchor"] = [self.w // 2, self.h - 3]
        return im


def _rgba(hexstr):
    return tuple(int(hexstr[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


# ---------------------------------------------------------------- gaits
def walk_foot(t, amp=3.0, lift=3.0, stance=0.6):
    """Foot offset (dx, up) for cycle position t. Ground contact moves the foot
    backward; the swing carries it forward while raised."""
    t %= 1.0
    if t < stance:
        return amp * (1 - 2 * t / stance), 0.0
    u = (t - stance) / (1 - stance)
    return -amp + 2 * amp * u, lift * math.sin(math.pi * u)


def leg(canvas, hip, foot, hind, near, thick=2, role=None, lift=0.0, hoof="a"):
    """Hip-knee-foot leg. Front knees flex forward, hocks flex backward."""
    hx, hy = hip
    fx, fy = foot
    mx, my = (hx + fx) / 2, (hy + fy) / 2
    bend = 1.5 + lift * 0.6
    kx = mx - bend if hind else mx + bend * 0.5
    seg = line((hx, hy), (kx, my), thick) | line((kx, my), (fx, fy), thick)
    role = role or ("m" if near else "d")
    pixels = flat(seg, role)
    if near:
        # leading column catches light; the far leg is a flat shadow
        for x, y in seg:
            if (x - 1, y) not in seg:
                pixels[(x, y)] = "l" if role == "m" else role
    for k in range(thick):
        pixels[(round(fx) + k, round(fy))] = hoof
    canvas.paint(pixels)


# ---------------------------------------------------------------- quadrupeds
def deer(state, frame):
    c = Canvas("red-deer")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 36
    if state == "rest":
        return _deer_rest(c, frame)

    bounce = 0
    if running:
        bounce = round(1.6 * max(0.0, math.sin(2 * math.pi * (t + 0.15))))
    elif moving:
        bounce = round(0.6 * math.cos(4 * math.pi * t) + 0.4)
    by = -bounce  # body offset

    hip_h, hip_f = (12, 24 + by), (25, 24 + by)
    if running:
        gait = lambda ph: walk_foot(ph, 5.5, 5.5, 0.4)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    else:
        gait = lambda ph: walk_foot(ph, 3.0, 3.0, 0.62)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = -3 if not near else 0
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx + (1 if hind else 0), ground - up), hind, near, lift=up)

    # far side first
    draw_leg("fh", hip_h, True, False)
    draw_leg("ff", hip_f, False, False)
    # body: chest a little deeper than the rump
    body = ellipse((7, 16 + by, 30, 26 + by)) | ellipse((15, 15 + by, 31, 26 + by))
    body_px = shade(body, top=1, bottom=2)
    for x, y in body:
        if (x, y + 1) not in body and 13 <= x <= 27:
            body_px[(x, y)] = "b"  # pale belly rim
        if (x, y - 1) not in body and 12 <= x <= 26:
            body_px[(x, y)] = "h"
    c.paint(body_px)
    # rump patch + tail
    c.paint(flat(polygon([(7, 18 + by), (9, 17 + by), (9, 23 + by), (7, 22 + by)]), "b"))
    tail_up = state == "idle" and frame in (5, 6)
    tail = polygon([(6, 17 + by), (8, 16 + by), (8, 21 + by), (5, 21 + by)]) if not tail_up else polygon([(6, 16 + by), (8, 15 + by), (9, 19 + by), (6, 19 + by)])
    c.paint(flat(tail, "m"))
    c.paint({(x, y): "b" for x, y in tail if (x, y + 1) not in tail})

    # neck + head
    if state == "forage":
        stage = [0, 1, 2, 2, 2, 2, 1, 0][frame]
        chew = 1 if frame in (3, 5) else 0
    else:
        stage = 0
        chew = 0
    if stage == 0:
        top = (34, 6 + by) if not running else (36, 9 + by)
        neck = polygon([(24, 18 + by), (29, 16 + by), (top[0] + 1, top[1] + 1), (top[0] - 3, top[1])])
        c.paint(shade(neck, top=1, bottom=1))
        _deer_head(c, top[0] - 2, top[1] - 2, "fwd", frame, running, chew)
    elif stage == 1:
        neck = polygon([(24, 18 + by), (29, 16 + by), (36, 20 + by), (33, 23 + by)])
        c.paint(shade(neck, 1, 1))
        _deer_head(c, 32, 19 + by, "low", frame, False, chew)
    else:
        neck = polygon([(24, 18 + by), (29, 16 + by), (35, 26 + by), (31, 28 + by)])
        c.paint(shade(neck, 1, 1))
        _deer_head(c, 31, 25 + by, "down", frame, False, chew)

    # near legs on top
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _deer_head(c, x, y, pose, frame, running, chew=0):
    """Head anchored at (x, y) = back of skull. fwd: alert; low: lowering; down: grazing."""
    if pose == "fwd":
        c.paint(flat(polygon([(x, y + 2), (x - 2, y - 3), (x + 3, y + 1)]), "d"))
        head = ellipse((x, y, x + 7, y + 6)) | polygon([(x + 5, y + 1), (x + 9, y + 3), (x + 9, y + 5), (x + 5, y + 6)])
        c.paint(shade(head, 1, 1))
        c.paint(flat(polygon([(x + 6, y + 3), (x + 9, y + 3), (x + 9, y + 5), (x + 6, y + 6)]), "d"))
        c.dot(x + 9, y + 4, "e")
        c.dot(x + 4, y + 2, "e")
        flick = frame in (3, 4) and not running
        ear = polygon([(x + 2, y + 1), (x + 1 + (2 if flick else 0), y - 4), (x + 5, y)])
        c.paint(flat(ear, "m"))
        c.dot(x + 2 + (1 if flick else 0), y - 2, "b")
        if frame == 6 and not running:
            c.dot(x + 4, y + 2, "d")
    elif pose == "low":
        c.paint(flat(polygon([(x - 2, y + 2), (x - 4, y - 2), (x + 1, y + 1)]), "d"))
        head = ellipse((x, y, x + 6, y + 6)) | polygon([(x + 3, y + 3), (x + 7, y + 7), (x + 6, y + 9), (x + 2, y + 6)])
        c.paint(shade(head, 1, 1))
        c.paint(flat(polygon([(x + 4, y + 5), (x + 7, y + 7), (x + 6, y + 9), (x + 3, y + 7)]), "d"))
        c.dot(x + 7, y + 8, "e")
        c.dot(x + 4, y + 2, "e")
        ear = polygon([(x, y + 1), (x - 2, y - 3), (x + 3, y)])
        c.paint(flat(ear, "m"))
        c.dot(x, y - 1, "b")
    else:
        c.paint(flat(polygon([(x - 3, y + 3), (x - 5, y - 1), (x, y + 1)]), "d"))
        head = ellipse((x, y, x + 6, y + 5)) | polygon([(x + 2, y + 3), (x + 6, y + 8 + chew), (x + 4, y + 10 + chew), (x + 1, y + 5)])
        c.paint(shade(head, 1, 1))
        c.paint(flat(polygon([(x + 3, y + 6), (x + 6, y + 8 + chew), (x + 4, y + 10 + chew), (x + 2, y + 7)]), "d"))
        c.dot(x + 5, y + 9 + chew, "e")
        c.dot(x + 4, y + 2, "e")
        ear = polygon([(x - 1, y + 2), (x - 3, y - 2), (x + 2, y)])
        c.paint(flat(ear, "m"))
        c.dot(x - 1, y, "b")


def _deer_rest(c, frame):
    body = ellipse((6, 24, 31, 34)) | ellipse((14, 23, 32, 34))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body and 12 <= x <= 26:
            px[(x, y)] = "h"
    c.paint(px)
    # foreleg folded forward along the ground, hind hoof tucked at the rear
    fore = rect((24, 33, 34, 35)) | rect((22, 31, 26, 34))
    fp = shade(fore, 1, 1)
    fp[(34, 34)] = fp[(34, 35)] = "a"
    c.paint(fp)
    c.paint(flat(rect((9, 34, 12, 35)), "d"))
    c.paint(flat(polygon([(6, 26), (8, 25), (8, 30), (5, 29)]), "b"))
    dip = [0, 0, 0, 1, 1, 1, 0, 0][frame]
    top = (34, 15 + dip)
    neck = polygon([(23, 26), (29, 24), (top[0] + 1, top[1] + 1), (top[0] - 4, top[1])])
    c.paint(shade(neck, 1, 1))
    _deer_head(c, top[0] - 2, top[1] - 2, "fwd", frame, False)
    return c.finish()


def wolf(state, frame):
    c = Canvas("gray-wolf")
    t = frame / 8
    moving = state in {"wander", "stalk", "chase"}
    running = state == "chase"
    ground = 22
    if state == "rest":
        return _wolf_rest(c, frame)
    low = 2 if state == "stalk" else 0
    bounce = round(1.5 * max(0.0, math.sin(2 * math.pi * (t + 0.15)))) if running else (round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0)
    by = low - bounce
    hip_h, hip_f = (10, 14 + by), (24, 14 + by)
    if running:
        gait = lambda ph: walk_foot(ph, 5.0, 4.5, 0.4)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    elif state == "stalk":
        gait = lambda ph: walk_foot(ph, 2.5, 1.5, 0.7)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}
    else:
        gait = lambda ph: walk_foot(ph, 3.0, 2.5, 0.62)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = 0 if near else -3
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx + (1 if hind else 0), ground - up), hind, near, lift=up, hoof="o")

    draw_leg("fh", hip_h, True, False)
    draw_leg("ff", hip_f, False, False)
    # tail: bushy, low when stalking, streaming when running
    if running:
        tail = polygon([(2, 12 + by), (9, 12 + by), (9, 16 + by), (1, 15 + by)])
    elif state == "stalk":
        tail = polygon([(6, 14 + by), (9, 13 + by), (9, 17 + by), (4, 22 + by), (2, 21 + by)])
    else:
        wag = 1 if state == "idle" and frame in (2, 3, 6, 7) else 0
        tail = polygon([(7, 13 + by), (9, 12 + by), (9, 17 + by), (3 - wag, 20 + by), (1 - wag, 18 + by)])
    c.paint(shade(tail, 1, 1))
    # body: deep chest, tucked belly
    body = ellipse((6, 10 + by, 28, 18 + by)) | ellipse((14, 9 + by, 30, 19 + by))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y + 1) not in body and 14 <= x <= 27:
            px[(x, y)] = "b"
        if (x, y - 1) not in body and 12 <= x <= 25:
            px[(x, y)] = "h"
    c.paint(px)
    # neck + head
    if running:
        hx, hy = 29, 7 + by
        neck = polygon([(23, 11 + by), (29, 10 + by), (hx + 3, hy + 4), (hx - 1, hy + 6)])
    elif state == "stalk":
        hx, hy = 28, 9 + by
        neck = polygon([(23, 11 + by), (29, 10 + by), (hx + 3, hy + 4), (hx - 1, hy + 6)])
    else:
        hx, hy = 27, 4 + by
        neck = polygon([(23, 11 + by), (29, 10 + by), (hx + 4, hy + 5), (hx - 1, hy + 5)])
    c.paint(shade(neck, 1, 1))
    _wolf_head(c, hx, hy, frame, state)
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _wolf_head(c, x, y, frame, state):
    """Small skull, long muzzle, pale cheek and jaw. (x, y) is the back of the skull."""
    c.paint(flat(polygon([(x, y + 2), (x, y - 2), (x + 3, y + 1)]), "d"))  # far ear
    skull = ellipse((x, y, x + 5, y + 5))
    muzzle = polygon([(x + 3, y + 1), (x + 10, y + 3), (x + 10, y + 5), (x + 3, y + 6)])
    head = skull | muzzle
    px = shade(head, 1, 1)
    for hx, hy in head:
        if hy >= y + 4 and hx >= x + 3:
            px[(hx, hy)] = "b"
        elif hy >= y + 3 and hx >= x + 6:
            px[(hx, hy)] = "l"
    c.paint(px)
    c.dot(x + 10, y + 3, "e")
    c.dot(x + 3, y + 2, "a" if not (frame == 6 and state == "idle") else "d")
    flick = state == "idle" and frame in (3, 4)
    ear = polygon([(x + 2, y + 1), (x + 3 + (1 if flick else 0), y - 3), (x + 5, y + 1)])
    c.paint(flat(ear, "m"))
    c.dot(x + 3, y - 1, "d")
    if state == "chase" and frame % 2:
        c.dot(x + 9, y + 6, "b")
        c.dot(x + 9, y + 7, "a")  # tongue
    if state == "stalk":
        c.dot(x + 9, y + 6, "h")  # bared tooth


def _wolf_rest(c, frame):
    body = ellipse((5, 13, 28, 21)) | ellipse((13, 12, 30, 21))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body and 10 <= x <= 24:
            px[(x, y)] = "h"
    c.paint(px)
    tail = polygon([(4, 16), (9, 15), (9, 20), (2, 22), (1, 20)])
    c.paint(shade(tail, 1, 1))
    # forelegs stretched forward on the ground
    fore = rect((24, 19, 34, 21)) | rect((22, 17, 26, 20))
    fp = shade(fore, 1, 1)
    fp[(34, 20)] = fp[(34, 21)] = "o"
    c.paint(fp)
    dip = [0, 0, 1, 1, 1, 1, 0, 0][frame]
    hx, hy = 27, 9 + dip
    neck = polygon([(22, 14), (28, 13), (hx + 4, hy + 5), (hx - 1, hy + 5)])
    c.paint(shade(neck, 1, 1))
    _wolf_head(c, hx, hy, frame, "rest")
    return c.finish()


def sheep(state, frame):
    c = Canvas("sheep")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 22
    if state == "rest":
        return _sheep_rest(c, frame)
    bounce = round(1.5 * max(0.0, math.sin(2 * math.pi * (t + 0.15)))) if running else (round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0)
    by = -bounce
    hip_h, hip_f = (8, 16 + by), (18, 16 + by)
    if running:
        gait = lambda ph: walk_foot(ph, 3.5, 3.5, 0.45)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    else:
        gait = lambda ph: walk_foot(ph, 2.0, 2.0, 0.62)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = 0 if near else -3
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx, ground - up), hind, near, role="b" if near else "a", lift=up, hoof="o")

    draw_leg("fh", hip_h, True, False)
    draw_leg("ff", hip_f, False, False)
    # fleece: lumpy top edge from overlapping circles
    fleece = ellipse((4, 8 + by, 23, 19 + by))
    for cx in (6, 10, 14, 18):
        fleece |= ellipse((cx, 6 + by, cx + 6, 12 + by))
    fleece |= ellipse((3, 11 + by, 8, 17 + by))
    px = shade(fleece, 1, 2)
    for x, y in fleece:
        if (x, y - 1) not in fleece:
            px[(x, y)] = "h"
    c.paint(px)
    # tail nub
    c.paint(flat(rect((3, 13 + by, 4, 15 + by)), "d"))
    # head: dark face, pale fleece cap
    if state == "graze":
        stage = [0, 1, 2, 2, 2, 2, 1, 0][frame]
    else:
        stage = 0
    hx, hy = [(21, 8 + by), (22, 12 + by), (22, 15 + by)][stage]
    chew = 1 if state == "graze" and frame in (3, 5) else 0
    head = ellipse((hx, hy, hx + 5, hy + 6)) | polygon([(hx + 3, hy + 2), (hx + 6, hy + 4 + stage), (hx + 6, hy + 6 + stage + chew), (hx + 2, hy + 7)])
    hp = shade(head, 1, 1, base="b", light="a", dark="a")
    for x, y in head:
        if y <= hy + 1:
            hp[(x, y)] = "l"
    c.paint(hp)
    c.dot(hx + 4, hy + 3, "e")
    c.dot(hx + 6, hy + 5 + stage, "e")
    flick = state == "idle" and frame in (3, 4)
    c.paint(flat(polygon([(hx - 1, hy + 2), (hx - 3 - (1 if flick else 0), hy + 1), (hx, hy + 4)]), "b"))
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _sheep_rest(c, frame):
    c.paint(flat(rect((7, 19, 10, 21)), "a"))
    c.paint(flat(rect((15, 19, 21, 21)), "a"))
    fleece = ellipse((3, 11, 23, 22))
    for cx in (5, 9, 13, 17):
        fleece |= ellipse((cx, 9, cx + 6, 15))
    px = shade(fleece, 1, 2)
    for x, y in fleece:
        if (x, y - 1) not in fleece:
            px[(x, y)] = "h"
    c.paint(px)
    dip = [0, 0, 1, 1, 1, 1, 0, 0][frame]
    hx, hy = 21, 12 + dip
    head = ellipse((hx, hy, hx + 5, hy + 6)) | polygon([(hx + 3, hy + 2), (hx + 6, hy + 4), (hx + 6, hy + 6), (hx + 2, hy + 7)])
    hp = shade(head, 1, 1, base="b", light="a", dark="a")
    for x, y in head:
        if y <= hy + 1:
            hp[(x, y)] = "l"
    c.paint(hp)
    c.dot(hx + 4, hy + 3, "e" if frame not in (3, 4) else "a")
    c.dot(hx + 6, hy + 5, "e")
    c.paint(flat(polygon([(hx - 1, hy + 2), (hx - 3, hy + 1), (hx, hy + 4)]), "b"))
    return c.finish()


# ---------------------------------------------------------------- chicken
def chicken(state, frame):
    c = Canvas("chicken")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 16
    bob = round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0
    by = -bob
    lean = 1 if running else 0
    # legs: two, alternating; thin accent colour with a splayed foot
    for key, ph, near in (("far", 0.5, False), ("near", 0.0, True)):
        if moving:
            dx, up = walk_foot(t + ph, 2.5 if running else 1.5, 3 if running else 2, 0.5 if running else 0.6)
        else:
            dx, up = 0.0, 0.0
        hx = 8 + (1 if near else -1)
        foot = (hx + dx, ground - up)
        knee = ((hx + foot[0]) / 2 + 0.5, (11 + by + foot[1]) / 2)
        pixels = flat(line((hx, 11 + by), knee) | line(knee, foot), "a" if near else "d")
        fx, fy = round(foot[0]), round(foot[1])
        for k in (-1, 0, 1, 2):
            pixels[(fx + k, fy)] = "a" if near else "d"
        c.paint(pixels)
    # tail: fan of dark feathers up and back
    tail = polygon([(6, 8 + by), (1, 3 + by), (0, 6 + by), (3, 10 + by), (6, 12 + by)])
    tp = shade(tail, 1, 1, base="d", light="m", dark="o")
    c.paint(tp)
    # body
    body = ellipse((3, 8 + by, 14, 16 + by))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body and 5 <= x <= 11:
            px[(x, y)] = "h"
    c.paint(px)
    # wing
    wing_up = running and frame % 2 == 0
    wing = polygon([(6, 10 + by), (11, 10 + by), (12, 12 + by), (9, 14 + by), (6, 13 + by)]) if not wing_up else polygon([(6, 9 + by), (12, 5 + by), (13, 7 + by), (10, 11 + by), (6, 12 + by)])
    c.paint(shade(wing, 1, 1, base="m", light="l", dark="d"))
    # neck + head; forage dips the head to the ground
    if state == "forage":
        dip = [0, 0, 2, 5, 7, 7, 3, 0][frame]
    else:
        dip = 0
    thrust = (1 if moving and frame % 4 < 2 else 0)
    hx, hy = 12 + thrust + lean, 5 + by + dip
    neck = polygon([(11, 10 + by), (13, 9 + by), (hx + 3, hy + 3), (hx + 1, hy + 4)])
    c.paint(shade(neck, 1, 1))
    head = ellipse((hx, hy, hx + 4, hy + 4))
    c.paint(shade(head, 1, 1))
    # comb, beak, wattle, eye
    for k, h in ((1, 1), (2, 2), (3, 1)):
        c.dot(hx + k, hy - h, "b")
    c.dot(hx + 5, hy + 2, "a")
    c.dot(hx + 6, hy + 2, "a")
    c.dot(hx + 4, hy + 4, "b")
    blink = state == "idle" and frame == 6
    c.dot(hx + 3, hy + 1, "d" if blink else "e")
    return c.finish()


# ---------------------------------------------------------------- birds (hand pixels)
# Letters map to palette roles; '.' is clear. Grids are authored facing east with
# the feet on row h-4. Wings are separate grids placed at absolute positions.
SPARROW = {
    "stand": [
        "..............",
        "..............",
        "........lll...",
        ".......lhlle..",
        ".......dlllaa.",
        "..dd..mmdmm...",
        ".ddmmmmdddll..",
        "..dmmmmmddlh..",
        "...ddmmmmll...",
        ".....a..a.....",
        "....aa..aa....",
        "..............",
        "..............",
        "..............",
    ],
    "peck": [
        "..............",
        "..............",
        "..............",
        "..............",
        "..dd..........",
        ".ddmmmmd......",
        "..dmmmmdddl...",
        "...ddmmmddllll",
        ".....mmm.dllle",
        ".....a..a.lmaa",
        "....aa..aa..a.",
        "..............",
        "..............",
        "..............",
    ],
    "fly": [
        "..............",
        "..............",
        "..............",
        "..............",
        ".........lle..",
        "..ddmmmmmdlaa.",
        ".ddmmmmmmlll..",
        "...ddmmmll....",
        "..............",
        "..............",
        "..............",
        "..............",
        "..............",
        "..............",
    ],
    "wings": {
        "up": (["...d", "..dl", ".dl.", "dl.."], 4, 1),
        "mid": (["dddl"], 4, 6),
        "down": (["d...", "dl..", ".dl.", "..dl"], 4, 6),
    },
    "legs": (5, 8),
}
DOVE = {
    "stand": [
        "................",
        "................",
        "................",
        "..........lll...",
        ".........lhlle..",
        ".........bmmmaa.",
        "...dd..mmbmm....",
        "..ddmmmmmdddll..",
        ".ddmmmmmmdddlll.",
        "..ddmmmmmmmlll..",
        "...dddmmmmml....",
        "......a...a.....",
        ".....aa...aa....",
        "................",
        "................",
        "................",
    ],
    "peck": [
        "................",
        "................",
        "................",
        "................",
        "................",
        "....dd..........",
        "...ddmmmm.......",
        "..ddmmmmmddl....",
        "..ddmmmmmdddll..",
        "...ddmmmmmmllll.",
        "....dddmmm.bmmme",
        "......a...almaa.",
        ".....aa...aa..a.",
        "................",
        "................",
        "................",
    ],
    "fly": [
        "................",
        "................",
        "................",
        "................",
        "................",
        "..........lle...",
        "..ddmmmmbmmmlaa.",
        ".ddmmmmmmmlll...",
        "...dddmmmmll....",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
        "................",
    ],
    "wings": {
        "up": (["....d", "...dl", "..dl.", ".dl..", "dl..."], 5, 1),
        "mid": (["ddddl"], 5, 7),
        "down": (["d....", "dl...", ".dl..", "..dl.", "...dl"], 5, 7),
    },
    "legs": (6, 9),
}


def _blit(c, grid, ox=0, oy=0):
    pixels = {}
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            if ch != ".":
                pixels[(x + ox, y + oy)] = ch
    c.paint(pixels)


def bird(species, state, frame):
    c = Canvas(species)
    art = DOVE if species == "rock-dove" else SPARROW
    flying = state in {"takeoff", "flight", "approach", "landing"}
    if state == "flight":
        pose = ["up", "up", "mid", "down", "down", "down", "mid", "up"][frame]
    elif state == "approach":
        pose = ["mid", "mid", "mid", "down", "mid", "mid", "mid", "up"][frame]
    elif state == "takeoff":
        pose = [None, "up", "down", "up", "down", "up", "mid", "down"][frame]
    elif state == "landing":
        pose = ["up", "down", "up", "up", "mid", "mid", None, None][frame]
    else:
        pose = None
    if flying:
        stage = frame / 7
        # takeoff: legs fold while the body rises; landing: legs drop and the body settles
        if state == "takeoff":
            lift = -round(4 * stage)
            legs = 0 < frame < 3
        elif state == "landing":
            lift = -round(3 * (1 - stage))
            legs = 3 <= frame < 6
        else:
            lift = -3
            legs = False
        if pose is None:
            _blit(c, art["stand"])
        else:
            _blit(c, art["fly"], 0, lift)
            if legs:
                lx, ly = art["legs"]
                for k in (0, 2):
                    c.dot(lx + k, ly + lift, "a")
                    c.dot(lx + k, ly + lift + 1, "a")
            grid, wx, wy = art["wings"][pose]
            _blit(c, grid, wx, wy + lift)
    elif state == "forage":
        stage = [0, 1, 1, 0, 0, 1, 0, 0][frame]
        hop = 1 if frame in (3, 6) else 0
        _blit(c, art["peck"] if stage else art["stand"], 0, -hop)
    else:  # perch: look about, blink
        turn = 1 if frame in (2, 3) else 0
        _blit(c, art["stand"], -turn, 0)
        if frame == 5:
            for y, row in enumerate(art["stand"]):
                for x, ch in enumerate(row):
                    if ch == "e":
                        c.dot(x - turn, y, "d")
    return c.finish()


def fauna_b():
    result = {}
    for species, states in STATES.items():
        for state, count in states.items():
            for frame in range(count):
                if species in {"house-sparrow", "rock-dove"}:
                    im = bird(species, state, frame)
                elif species == "chicken":
                    im = chicken(state, frame)
                elif species == "sheep":
                    im = sheep(state, frame)
                elif species == "red-deer":
                    im = deer(state, frame)
                else:
                    im = wolf(state, frame)
                result[f"faunab-{species}-{state}-{frame}"] = im
    return result
