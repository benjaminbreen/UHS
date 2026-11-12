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
    "goat": {"o": "#3d3226", "d": "#6a5640", "m": "#8f7757", "l": "#b39c75", "h": "#d8c8a4", "b": "#2f2820", "e": "#17120c", "a": "#e6ddc4"},
    "pig": {"o": "#6b4038", "d": "#9a6259", "m": "#c08d81", "l": "#d8aa9d", "h": "#efcdc0", "b": "#7d4a41", "e": "#291613", "a": "#5a3630"},
    "chicken": {"o": "#7a4a22", "d": "#b7732d", "m": "#e2a247", "l": "#f3c975", "h": "#fbe7ad", "b": "#d9402f", "e": "#26190f", "a": "#e9b53a"},
    "rock-dove": {"o": "#3f4b50", "d": "#5b6a6f", "m": "#8b9b9d", "l": "#bbc6c2", "h": "#e8eade", "b": "#6c5687", "e": "#1e2224", "a": "#cf8a6a"},
    # Glossy black with a blue-violet sheen; the eye catches the light.
    "crow": {"o": "#0b0c10", "d": "#15171d", "m": "#23262f", "l": "#343a48", "h": "#56607a", "b": "#6e6a70", "e": "#c9ced8", "a": "#1c1c20"},
    # Desert locust in its swarming phase: yellow body, clear brown-veined wings.
    "locust": {"o": "#3f3014", "d": "#7a6224", "m": "#c4a236", "l": "#e6dca6", "h": "#f4efcf", "b": "#8a6a2a", "e": "#2a1a08", "a": "#6a4c1c"},
    "house-sparrow": {"o": "#4d371f", "d": "#6b4a2d", "m": "#a27848", "l": "#cba770", "h": "#f0e2bf", "b": "#3c3025", "e": "#1e1610", "a": "#d9b978"},
    # A bull aurochs is near-black with a pale muzzle ring, a pale line down
    # the spine and pale horns tipped in black.
    "aurochs": {"o": "#1b1410", "d": "#2f231a", "m": "#4a3525", "l": "#6b4c33", "h": "#8f6a48", "b": "#c8b189", "e": "#0d0806", "a": "#e6dcc0"},
    "wild-boar": {"o": "#1f1813", "d": "#372d24", "m": "#54463a", "l": "#766351", "h": "#9c8874", "b": "#2a231c", "e": "#0f0b08", "a": "#e8e2d0"},
    "llama": {"o": "#5c4630", "d": "#8a6d4d", "m": "#b08f68", "l": "#d0b186", "h": "#eddcc0", "b": "#6b5138", "e": "#1d1510", "a": "#f4ecd9"},
    "turkey": {"o": "#2b231d", "d": "#453931", "m": "#665547", "l": "#8d7761", "h": "#b9a184", "b": "#b8453a", "e": "#120e0a", "a": "#d9b25c"},
    # Breeding birds carry a buff wash on crown and back; legs are drawn
    # after the outline, in k, so they stay one pixel thin.
    "cattle-egret": {"o": "#7b8074", "d": "#c3c8bc", "m": "#e6e9df", "l": "#f6f7f0", "h": "#ffffff", "b": "#e0ae62", "e": "#1d1d18", "a": "#e8b534", "k": "#6e6636"},
    "guinea-pig": {"o": "#3f2c1e", "d": "#6f4d31", "m": "#9a6c46", "l": "#c09163", "h": "#e6c294", "b": "#f2e9d6", "e": "#150f0a", "a": "#d9a273"},
    # Waterfowl: b bill · a feet · n head · c breast · s wing patch.
    # The farmyard duck is white, as the kept ducks of China and Europe often were.
    "duck": {"o": "#8a806c", "d": "#cdc6b2", "m": "#ebe6d6", "l": "#f7f4ea", "h": "#ffffff", "b": "#e59a34", "e": "#1d1a16", "a": "#e88a2c", "n": "#ebe6d6", "c": "#ebe6d6", "s": "#cdc6b2"},
    # A mallard drake: bottle-green head, white collar, chestnut breast, blue speculum.
    "mallard": {"o": "#2b2922", "d": "#6f6556", "m": "#9c9282", "l": "#c2b9a8", "h": "#e4ddcf", "b": "#d6c046", "e": "#121110", "a": "#e0902f", "n": "#2f6a45", "c": "#74402a", "s": "#4058a8"},
    # Greylag, the goose of Egypt and Europe: brown-grey, pale under the tail, orange bill.
    "goose": {"o": "#4a4238", "d": "#7c7262", "m": "#a39886", "l": "#c8bead", "h": "#e6dfd2", "b": "#e9954f", "e": "#1a1712", "a": "#e59a6b", "n": "#8d8270", "c": "#f0ebe0", "s": "#7c7262"},
    # Herons: k legs · b crest and neck stripe · a bill.
    "grey-heron": {"o": "#3c4248", "d": "#7f878c", "m": "#a8afb2", "l": "#cdd2d2", "h": "#eff1ec", "b": "#24282e", "e": "#1b1b19", "a": "#d4a83c", "k": "#6c6343"},
    "great-blue-heron": {"o": "#2d3746", "d": "#56677b", "m": "#7d8fa3", "l": "#a6b4c3", "h": "#e8e9e4", "b": "#1c2230", "e": "#1a1a18", "a": "#cf9f3d", "k": "#5c5844"},
}
STATES = {
    "house-sparrow": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "crow": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "locust": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "rock-dove": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "chicken": dict.fromkeys(["idle", "forage", "wander", "flee"], 8),
    "sheep": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "goat": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "pig": dict.fromkeys(["idle", "forage", "wander", "flee", "rest"], 8),
    "red-deer": dict.fromkeys(["idle", "forage", "wander", "flee", "rest"], 8),
    "gray-wolf": dict.fromkeys(["idle", "wander", "stalk", "chase", "rest", "dig"], 8),
    "aurochs": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "wild-boar": dict.fromkeys(["idle", "forage", "wander", "flee", "rest"], 8),
    "llama": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "turkey": dict.fromkeys(["idle", "forage", "wander", "flee"], 8),
    "guinea-pig": dict.fromkeys(["idle", "forage", "wander", "flee", "rest"], 8),
    "cattle-egret": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "duck": dict.fromkeys(["idle", "forage", "wander", "flee", "swim", "dabble"], 8),
    "mallard": dict.fromkeys(["idle", "forage", "wander", "flee", "swim", "dabble"], 8),
    "goose": dict.fromkeys(["idle", "forage", "wander", "flee", "swim", "dabble"], 8),
    "grey-heron": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "great-blue-heron": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
}
# Sized against the 29px standing human: deer shoulder ~20px, wolf ~13px, sheep ~12px.
NATIVE_SIZES = {
    "house-sparrow": (14, 14),
    "crow": (18, 18),
    "locust": (12, 10),
    "rock-dove": (16, 16),
    "chicken": (18, 20),
    "sheep": (28, 26),
    "goat": (28, 26),
    "pig": (30, 24),
    "red-deer": (40, 40),
    "gray-wolf": (38, 26),
    # The aurochs stands a head over the man who hunted it: shoulder ~24px.
    "aurochs": (48, 44),
    "wild-boar": (36, 28),
    "llama": (32, 38),
    "turkey": (26, 26),
    "guinea-pig": (18, 14),
    # Half a man's height standing; the width is for the wingspan.
    "cattle-egret": (30, 26),
    # A duck is a little lower and longer than a hen; a goose stands to a
    # man's hip; a heron stands two-thirds of a man tall, with room for wings.
    "duck": (20, 16),
    "mallard": (20, 16),
    "goose": (26, 24),
    "grey-heron": (38, 36),
    "great-blue-heron": (38, 36),
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


def over(canvas, pixels):
    """A neck laid on a shoulder is flat where they overlap, or the two rims
    draw a seam across the chest."""
    return {xy: "m" if xy in canvas.px else role for xy, role in pixels.items()}


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
        pad = getattr(self, "pad", 0)
        if pad:
            ring = {(x, y + pad) for x, y in ring}
            self.px = {(x, y + pad): r for (x, y), r in self.px.items()}
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
# The deer being drawn. The defaults are the red deer hind of set B; set C
# draws the stags and the other deer by changing it (see fourway.DEER_KINDS).
# antler: a key of ANTLERS. tail: short, flag, long or None. rump: patch,
# big or None. neck: a role to darken the neck to. band: white chin and
# muzzle ring. spots: white rows down the flank and a dark line on the back.
DEER = dict(palette=None, pad=0, antler=None, tail="short", rump="patch", neck=None, band=False, spots=False)

# Antlers in pixels from the pedicle, for a 40px deer: (beam, tines). Side
# view: x forward, y up negative. Front view: x outward from the head.
ANTLERS = {
    "elaphus": dict(side=([(0, 0), (-1, -4), (-2, -8), (-2, -11), (-1, -13)],
                          [((0, -1), (3, -2)), ((-1, -4), (2, -5)), ((-2, -8), (1, -9)), ((-1, -13), (1, -15)), ((-2, -11), (-4, -14))]),
                    front=([(0, 0), (2, -4), (4, -8), (5, -11), (4, -13)],
                           [((1, -2), (3, -1)), ((4, -8), (6, -9)), ((4, -13), (3, -15)), ((4, -13), (6, -15))])),
    "wapiti": dict(side=([(0, 0), (-2, -4), (-4, -8), (-6, -12), (-7, -15), (-6, -17)],
                         [((0, -1), (3, -2)), ((-1, -3), (2, -5)), ((-4, -8), (-1, -11)), ((-6, -12), (-3, -14)), ((-7, -15), (-5, -17))]),
                   front=([(0, 0), (3, -4), (5, -9), (6, -13), (6, -17)],
                          [((1, -2), (3, 0)), ((5, -9), (7, -10)), ((6, -13), (8, -14)), ((6, -17), (5, -19))])),
    "virginianus": dict(side=([(0, 0), (-2, -2), (-2, -5), (0, -6), (3, -6)],
                              [((-2, -4), (-2, -8)), ((0, -6), (0, -9)), ((2, -6), (2, -8))]),
                        front=([(0, 0), (3, -2), (5, -4), (4, -6), (2, -7)],
                               [((3, -2), (3, -5)), ((5, -4), (6, -7))])),
    "axis": dict(side=([(0, 0), (-1, -4), (-2, -8), (-1, -11)],
                       [((0, -1), (3, -3)), ((-2, -9), (-4, -12))]),
                 front=([(0, 0), (1, -4), (2, -8), (2, -11)],
                        [((2, -9), (4, -11)), ((0, -1), (2, 0))])),
    "roe": dict(side=([(0, 0), (0, -3), (-1, -6)], [((0, -3), (2, -4)), ((-1, -5), (-2, -7))]),
                front=([(0, 0), (1, -3), (1, -6)], [((1, -3), (2, -4))])),
}


def _deer_canvas():
    c = Canvas("red-deer")
    c.palette = DEER["palette"] or c.palette
    c.pad = DEER["pad"]
    c.h += c.pad
    return c


def antlers(c, x, y, tilt=0.0, view="side", far=False):
    """The antler at pedicle (x, y), the head tipped `tilt` degrees nose-down.
    The far one of a pair is the darker."""
    if not DEER["antler"]:
        return
    beam, tines = ANTLERS[DEER["antler"]][view]
    a = math.radians(tilt)

    def P(v):
        vx, vy = v
        if view == "front" and far:
            vx = -vx
        return x + vx * math.cos(a) - vy * math.sin(a), y + vx * math.sin(a) + vy * math.cos(a)

    m = set()
    for p, q in zip(beam, beam[1:]):
        m |= line(P(p), P(q))
    # Side on, the far antler is only its beam and the top tine, or the two
    # pairs read as a ladder.
    for p, q in (tines[-1:] if view == "side" and far else tines):
        m |= line(P(p), P(q))
    if view == "side" and far:
        c.paint(flat(m, "k"))
    else:
        c.paint({(px, py): "k" if (px + 1, py) in m and (px, py - 1) not in m else "c" for px, py in m})


def deer(state, frame):
    c = _deer_canvas()
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
    body = ellipse((7, 16 + by, 20, 25 + by)) | ellipse((11, 16 + by, 28, 25 + by)) | ellipse((19, 15 + by, 31, 26 + by))
    body_px = shade(body, top=1, bottom=2)
    for x, y in body:
        if (x, y - 1) not in body and 22 <= x <= 28:
            body_px[(x, y)] = "h"  # withers
    _spots(body_px, body, by)
    c.paint(body_px)
    _rump_tail(c, by, running or (state == "idle" and frame in (5, 6)), running)

    # neck + head
    if state == "forage":
        stage = [0, 1, 2, 2, 2, 2, 1, 0][frame]
        chew = 1 if frame in (3, 5) else 0
    else:
        stage = 0
        chew = 0
    if stage == 0:
        nod = 1 if moving and not running and frame % 4 in (1, 2) else 0
        # A deer's neck is short and its head small. Carried any higher or
        # further out it reads as a llama, and the muzzle leaves the canvas.
        top = (31 + nod, 10 + by + nod) if not running else (32, 12 + by)
        neck = polygon([(23, 15 + by), (31, 22 + by), (top[0] + 2, top[1] + 4), (top[0] - 2, top[1])])
        _neck(c, neck)
        _deer_head(c, top[0] - 2, top[1] - 2, "fwd", frame, running, chew)
    elif stage == 1:
        neck = polygon([(24, 16 + by), (30, 21 + by), (34, 21 + by), (32, 24 + by)])
        _neck(c, neck)
        _deer_head(c, 31, 19 + by, "low", frame, False, chew)
    else:
        neck = polygon([(24, 16 + by), (30, 21 + by), (34, 26 + by), (31, 28 + by)])
        _neck(c, neck)
        _deer_head(c, 30, 25 + by, "down", frame, False, chew)

    # near legs on top
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _spots(px, body, by):
    """The chital's white spots, in staggered rows, and its dark back line."""
    if not DEER["spots"]:
        return
    for x, y in body:
        if (x, y - 1) not in body and 10 <= x <= 27:
            px[(x, y)] = "s"
        row = y - by
        if row in (18, 20, 22) and 10 <= x <= 27 and (x + row // 2) % 3 == 0 and (x, y + 2) in body:
            px[(x, y)] = "w"


def _rump_tail(c, by, up, running):
    """The rump patch and the tail over it. A running deer flags: the tail
    goes up and shows its white."""
    if DEER["rump"] == "patch":
        c.paint(flat(polygon([(7, 18 + by), (9, 17 + by), (9, 23 + by), (7, 22 + by)]), "b"))
    elif DEER["rump"] == "big":
        c.paint(flat(polygon([(6, 17 + by), (10, 16 + by), (10, 24 + by), (6, 23 + by)]), "w"))
    kind = DEER["tail"]
    if kind == "short":
        tail = polygon([(6, 17 + by), (8, 16 + by), (8, 21 + by), (5, 21 + by)]) if not up else polygon([(6, 16 + by), (8, 15 + by), (9, 19 + by), (6, 19 + by)])
        c.paint(flat(tail, "b" if running else "m"))
        c.paint({(x, y): "b" for x, y in tail if (x, y + 1) not in tail})
    elif kind == "flag":
        if up:  # the white flag, fanned
            c.paint(flat(polygon([(7, 17 + by), (9, 15 + by), (6, 9 + by), (3, 11 + by)]), "w"))
            c.paint(flat(line((7, 16 + by), (5, 11 + by)), "m"))
        else:
            tail = polygon([(6, 17 + by), (8, 16 + by), (8, 24 + by), (5, 24 + by)])
            c.paint(flat(tail, "m"))
            c.paint({(x, y): "w" for x, y in tail if (x - 1, y) not in tail})
    elif kind == "long":
        tail = polygon([(6, 17 + by), (8, 16 + by), (7, 25 + by), (5, 24 + by)]) if not up else polygon([(6, 16 + by), (8, 15 + by), (4, 11 + by), (3, 13 + by)])
        c.paint(flat(tail, "s"))
        c.paint({(x, y): "w" for x, y in tail if (x - 1, y) not in tail})


def _neck(c, neck):
    px = shade(neck, top=1, bottom=1)
    if DEER["neck"]:
        px = {xy: "d" if r == "l" else DEER["neck"] for xy, r in px.items()}
    c.paint(over(c, px) if not DEER["neck"] else px)


def _deer_head(c, x, y, pose, frame, running, chew=0):
    """Head anchored at (x, y) = back of skull. fwd: alert; low: lowering; down: grazing."""
    tilt, ped = {"fwd": (0, (x + 2, y)), "low": (40, (x + 1, y + 1)), "down": (55, (x + 1, y + 1))}[pose]
    antlers(c, ped[0] + 3, ped[1], tilt, far=True)
    _deer_face(c, x, y, pose, frame, running, chew)
    antlers(c, *ped, tilt)


def _deer_face(c, x, y, pose, frame, running, chew=0):
    if pose == "fwd":
        c.paint(flat(polygon([(x, y + 2), (x - 2, y - 3), (x + 3, y + 1)]), "d"))
        head = ellipse((x, y, x + 5, y + 5)) | polygon([(x + 4, y + 1), (x + 8, y + 3), (x + 8, y + 4), (x + 4, y + 5)])
        c.paint(shade(head, 1, 1))
        c.paint(flat(polygon([(x + 6, y + 3), (x + 8, y + 3), (x + 8, y + 4), (x + 6, y + 5)]), "d"))
        c.dot(x + 8, y + 3, "e")
        c.dot(x + 3, y + 2, "e")
        if DEER["band"]:
            c.dot(x + 6, y + 5, "w")
            c.dot(x + 7, y + 5, "w")
            c.dot(x + 5, y + 3, "w")
        flick = frame in (3, 4) and not running
        ear = polygon([(x + 2, y + 1), (x + 1 + (2 if flick else 0), y - 4), (x + 5, y)])
        c.paint(flat(ear, "m"))
        c.dot(x + 2 + (1 if flick else 0), y - 2, "b")
        if frame == 6 and not running:
            c.dot(x + 3, y + 2, "d")
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
    _spots(px, body, 6)
    c.paint(px)
    # foreleg folded forward along the ground, hind hoof tucked at the rear
    fore = rect((24, 33, 34, 35)) | rect((22, 31, 26, 34))
    fp = shade(fore, 1, 1)
    fp[(34, 34)] = fp[(34, 35)] = "a"
    c.paint(fp)
    c.paint(flat(rect((9, 34, 12, 35)), "d"))
    if DEER["rump"]:
        c.paint(flat(polygon([(6, 26), (8, 25), (8, 30), (5, 29)]), "b" if DEER["rump"] == "patch" else "w"))
    dip = [0, 0, 0, 1, 1, 1, 0, 0][frame]
    top = (32, 18 + dip)
    neck = polygon([(24, 25), (30, 28), (top[0] + 2, top[1] + 3), (top[0] - 2, top[1])])
    _neck(c, neck)
    _deer_head(c, top[0] - 2, top[1] - 2, "fwd", frame, False)
    return c.finish()


EARTH = ("#5e4630", "#86683f", "#a4865a")


def throw_earth(im, origin, frame, away=-1, top=0, hole=None):
    """Clods flung out behind a digging animal, each on its own arc, so the
    spray never stops while the paws go; and the loose earth at the hole.
    Fixed colours: no coat recolours the ground. `top` shifts the image
    rows, for a padded canvas."""
    px = im.load()

    def put(X, Y, c):
        Y += top
        if 0 <= X < im.width and 0 <= Y < im.height and (c != EARTH[0] or not px[X, Y][3]):
            px[X, Y] = tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)

    if hole:
        hx, hy = hole
        for dx, dy in ((-2, 0), (-1, 0), (0, 0), (1, 0), (2, 0), (-1, -1), (0, -1), (1, -1), (-3, 0), (3, 0)):
            put(hx + dx, hy + dy, EARTH[0] if dy == 0 else EARTH[1])
    ox, oy = origin
    for k in range(6):
        u = ((frame + k * 1.35) % 8) / 8
        x = ox + away * (1 + u * 12)
        y = oy - 4 * 9 * u * (1 - u) + u * 3
        big = k < 2 and u < 0.6
        for dx in range(2 if big else 1):
            for dy in range(2 if big else 1):
                put(round(x) + dx * away, round(y) - dy, EARTH[1 + (k + frame) % 2] if dy == 0 else EARTH[2])
    return im


# Forepaws raking in turn: the near one reaches and drags back, the far one
# half a beat behind. Offsets from the shoulder, in pixels.
RAKE = [(5, 0), (3, -1), (0, 0), (1, -2), (5, 0), (3, -1), (0, 0), (1, -2)]


def _wolf_dig(c, frame):
    """Rump up, chest down, head in the hole; the tail going; earth flying."""
    ground = 22
    hip, sh = (10, 12), (25, 15)
    for near in (False, True):
        ox = 0 if near else -3
        if not near:
            leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + 1, ground), True, False, hoof="o")
            fx, fy = RAKE[(frame + 2) % 8]
            leg(c, (sh[0] + ox, sh[1]), (sh[0] + ox + fx, ground + fy), False, False, lift=-fy, hoof="o")
    wag = [0, 1, 2, 1, 0, 1, 2, 1][frame]
    tail = polygon([(7, 11), (9, 10), (10, 13), (4 - wag, 6), (2 - wag, 8)])
    c.paint(shade(tail, 1, 1))
    body = ellipse((5, 8, 25, 16)) | ellipse((15, 11, 30, 20))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body and 8 <= x <= 22:
            px[(x, y)] = "h"
    c.paint(px)
    hx, hy = 26, 14 + [0, 1, 1, 0, 0, 1, 1, 0][frame]
    c.paint(shade(polygon([(22, 12), (28, 14), (hx + 3, hy + 5), (hx - 1, hy + 5)]), 1, 1))
    _wolf_head(c, hx, hy, frame, "dig")
    leg(c, hip, (hip[0] + 1, ground), True, True, hoof="o")
    fx, fy = RAKE[frame]
    leg(c, sh, (sh[0] + fx, ground + fy), False, True, lift=-fy, hoof="o")
    return throw_earth(c.finish(), (7, ground - 1), frame, hole=(33, ground))


def wolf(state, frame):
    c = Canvas("gray-wolf")
    if state == "dig":
        return _wolf_dig(c, frame)
    t = frame / 8
    moving = state in {"wander", "stalk", "chase"}
    running = state == "chase"
    ground = 23
    if state == "rest":
        return _wolf_rest(c, frame)
    warn = state == "warn"
    low = 2 if state == "stalk" or warn else 0
    bounce = round(1.5 * max(0.0, math.sin(2 * math.pi * (t + 0.15)))) if running else (round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0)
    by = low - bounce
    hip_h, hip_f = (10, 12 + by), (24, 12 + by)
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
        tail = polygon([(2, 9 + by), (9, 9 + by), (9, 13 + by), (1, 12 + by)])
    elif state == "stalk":
        tail = polygon([(6, 11 + by), (9, 10 + by), (9, 14 + by), (4, 20 + by), (2, 19 + by)])
    elif warn:  # stiff and up, the tip quivering
        q = frame % 2
        tail = polygon([(7, 10 + by), (9, 9 + by), (9, 13 + by), (2, 6 + by - q), (1, 4 + by - q), (3, 3 + by - q)])
    else:
        wag = 1 if state == "idle" and frame in (2, 3, 6, 7) else 0
        tail = polygon([(7, 10 + by), (9, 9 + by), (9, 14 + by), (3 - wag, 18 + by), (1 - wag, 16 + by)])
    c.paint(shade(tail, 1, 1))
    # body: deep chest, tucked belly
    body = ellipse((6, 7 + by, 22, 15 + by)) | ellipse((15, 7 + by, 30, 17 + by)) | ellipse((20, 6 + by, 29, 12 + by))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) in body and (x, y - 2) not in body and 9 <= x <= 22:
            px[(x, y)] = "d"  # saddle
        if x >= 25 and y >= 11 + by and (x, y + 1) not in body | {(x, y + 2)}:
            px[(x, y)] = "b"
        elif x >= 26 and y >= 12 + by:
            px[(x, y)] = "b"  # pale chest
    c.paint(px)
    # neck + head
    if running:
        hx, hy = 28, 5 + by
        neck = polygon([(22, 8 + by), (29, 8 + by), (hx + 3, hy + 4), (hx - 1, hy + 6)])
    elif state == "stalk" or warn:
        hx, hy = 28 + (1 if warn and frame in (3, 4) else 0), 8 + by + (1 if warn else 0)
        neck = polygon([(22, 8 + by), (29, 9 + by), (hx + 3, hy + 4), (hx - 1, hy + 6)])
    else:
        hx, hy = 27, 2 + by
        neck = polygon([(22, 8 + by), (29, 8 + by), (hx + 4, hy + 5), (hx - 1, hy + 5)])
    c.paint(shade(neck, 1, 1))
    if warn:  # hackles up from the neck to the middle of the back
        for x in range(14, 27):
            c.dot(x, 5 + by - (x % 2) - (1 if frame in (2, 3, 4, 5) and x % 2 else 0), "d")
            c.dot(x, 6 + by, "d")
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
    if state == "warn":  # ears pinned back
        ear = polygon([(x + 1, y + 2), (x - 2, y), (x + 4, y + 1)])
    c.paint(flat(ear, "m"))
    c.dot(x + 3, y - 1, "d")
    if state == "chase" and frame % 2:
        c.dot(x + 9, y + 6, "b")
        c.dot(x + 9, y + 7, "a")  # tongue
    if state == "stalk":
        c.dot(x + 9, y + 6, "h")  # bared tooth
    if state == "warn":  # lips back off the teeth, the jaw dropped
        for k in range(4, 10):
            c.dot(x + k, y + 6, "o" if k < 8 else "h")
            c.dot(x + k, y + 7, "d")
        c.dot(x + 9, y + 5, "h")
        c.dot(x + 6, y + 5, "h")


def _wolf_rest(c, frame):
    body = ellipse((5, 13, 28, 21)) | ellipse((13, 12, 30, 21))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) in body and (x, y - 2) not in body and 8 <= x <= 22:
            px[(x, y)] = "d"  # saddle
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
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx, ground - up), hind, near, role="a" if near else "e", lift=up, hoof="e")

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
    wag = 1 if state == "idle" and frame in (2, 4) else 0
    c.paint(flat(rect((3 - wag, 13 + by, 4 - wag, 15 + by)), "d"))
    # head: dark face, pale fleece cap
    if state == "graze":
        stage = [0, 1, 2, 2, 2, 2, 1, 0][frame]
    else:
        stage = 0
    hx, hy = [(21, 8 + by), (22, 12 + by), (22, 15 + by)][stage]
    if moving and not running and frame % 4 in (1, 2):
        hy += 1  # nods into each step
    # cud when standing, grass when grazing
    chew = 1 if (state == "graze" and frame in (3, 5)) or (state == "idle" and frame in (1, 3, 5)) else 0
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


# ---------------------------------------------------------------- goat
def goat(state, frame):
    """Leggier and flatter-backed than the sheep, with swept horns and a beard.
    No fleece, so the barrel is plain rim shading."""
    c = Canvas("goat")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 22
    if state == "rest":
        return _goat_rest(c, frame)
    bounce = round(1.5 * max(0.0, math.sin(2 * math.pi * (t + 0.15)))) if running else (round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0)
    by = -bounce
    hip_h, hip_f = (8, 14 + by), (18, 14 + by)
    if running:
        gait = lambda ph: walk_foot(ph, 3.5, 3.5, 0.45)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    else:
        gait = lambda ph: walk_foot(ph, 2.2, 2.2, 0.6)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = 0 if near else -3
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx, ground - up), hind, near, role="m" if near else "d", lift=up, hoof="b")

    draw_leg("fh", hip_h, True, False)
    draw_leg("ff", hip_f, False, False)
    body = ellipse((5, 8 + by, 20, 17 + by)) | rect((8, 8 + by, 18, 11 + by))
    c.paint(shade(body, 1, 2))
    # tail cocked up, the way a sheep's never is
    c.paint(flat(line((6, 9 + by), (4, 6 + by), 2), "d"))
    stage = [0, 1, 2, 2, 2, 2, 1, 0][frame] if state == "graze" else 0
    chew = 1 if state == "graze" and frame in (3, 5) else 0
    hx, hy = [(19, 5 + by), (20, 9 + by), (20, 12 + by)][stage]
    neck = polygon([(16, 9 + by), (19, 9 + by), (hx + 4, hy + 3), (hx, hy + 5)])
    c.paint(shade(neck, 1, 1))
    _goat_head(c, hx, hy, chew, state == "idle" and frame in (3, 4))
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _goat_rest(c, frame):
    c.paint(flat(rect((7, 19, 11, 21)), "b"))
    c.paint(flat(rect((15, 19, 20, 21)), "b"))
    body = ellipse((5, 10, 21, 19)) | rect((8, 10, 18, 13))
    c.paint(shade(body, 1, 2))
    c.paint(flat(line((6, 11), (4, 8), 2), "d"))
    dip = [0, 0, 1, 1, 1, 1, 0, 0][frame]
    hx, hy = 19, 8 + dip
    c.paint(shade(polygon([(16, 12), (19, 12), (hx + 4, hy + 3), (hx, hy + 5)]), 1, 1))
    _goat_head(c, hx, hy, 0, False, blink=frame in (3, 4))
    return c.finish()


def _goat_head(c, hx, hy, chew, flick, blink=False):
    """Wedge head with a pale muzzle, one swept horn over the neck and the far
    horn a shade behind it, plus the beard that tells it from a sheep."""
    # far horn first so the near one reads on top
    c.paint(flat(line((hx + 3, hy - 1), (hx + 1, hy - 3), 1) | line((hx + 1, hy - 3), (hx - 2, hy - 3), 1), "d"))
    head = ellipse((hx, hy, hx + 4, hy + 5)) | polygon([(hx + 3, hy + 1), (hx + 7, hy + 3), (hx + 7, hy + 5 + chew), (hx + 2, hy + 6)])
    c.paint(shade(head, 1, 1, base="m", light="l", dark="d"))
    # muzzle pale, the way a goat's is, so the face is not one flat mass
    c.paint(flat(polygon([(hx + 5, hy + 2), (hx + 7, hy + 3), (hx + 7, hy + 5 + chew), (hx + 5, hy + 5 + chew)]), "h"))
    c.paint(flat(rect((hx + 2, hy + 6 + chew, hx + 3, hy + 8 + chew)), "b"))
    c.paint(flat(line((hx + 2, hy), (hx, hy - 4), 1) | line((hx, hy - 4), (hx - 4, hy - 3), 1), "a"))
    c.dot(hx + 3, hy + 2, "d" if blink else "e")
    c.dot(hx + 7, hy + 4 + chew, "e")
    c.paint(flat(polygon([(hx + 1, hy + 2), (hx - 3, hy + 3 + (1 if flick else 0)), (hx, hy + 5)]), "b"))


# ---------------------------------------------------------------- pig
def pig(state, frame):
    """Long and low: the back line runs straight from snout to rump, the legs
    are short, and the head is carried below the shoulder when rooting."""
    c = Canvas("pig")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 20
    if state == "rest":
        return _pig_rest(c, frame)
    bounce = round(1.0 * max(0.0, math.sin(2 * math.pi * (t + 0.15)))) if running else (round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0)
    by = -bounce
    hip_h, hip_f = (7, 13 + by), (18, 13 + by)
    if running:
        gait = lambda ph: walk_foot(ph, 2.6, 2.6, 0.45)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    else:
        gait = lambda ph: walk_foot(ph, 1.6, 1.6, 0.62)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = 0 if near else -2
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx, ground - up), hind, near, role="m" if near else "d", lift=up, hoof="a")

    draw_leg("fh", hip_h, True, False)
    draw_leg("ff", hip_f, False, False)
    # Round ham behind, a belly that sags a little between the legs.
    body = ellipse((2, 5 + by, 14, 16 + by)) | ellipse((6, 6 + by, 21, 16 + by)) | rect((6, 6 + by, 19, 11 + by))
    c.paint(shade(body, 1, 2))
    # curly tail, drawn clear of the rump so the outline reads it
    wag = 1 if (moving and frame % 2) or (state == "idle" and frame in (2, 4)) else 0
    for dx, dy in ((1, 8), (0, 7), (0 + wag, 6), (1 + wag, 5)):
        c.dot(dx, dy + by, "d")
    stage = [0, 1, 2, 2, 2, 2, 1, 0][frame] if state == "forage" else 0
    root = 1 if state == "forage" and frame in (3, 5) else 0
    hx, hy = [(19, 6 + by), (20, 9 + by), (21, 12 + by)][stage]
    trot = moving and frame % 4 in (1, 2)
    if trot and not running:
        hy += 1
    head = polygon([(hx - 3, hy - 1), (hx + 4, hy + 1), (hx + 5, hy + 6), (hx - 3, hy + 7)])
    c.paint(shade(head, 1, 1))
    # snout disc on the end of the wedge
    snout = ellipse((hx + 4, hy + 2 + root, hx + 7, hy + 5 + root))
    c.paint(flat(snout, "b"))
    c.dot(hx + 6, hy + 3 + root, "e")
    c.dot(hx + 6, hy + 4 + root, "e")
    c.dot(hx + 2, hy + 2, "e")
    # ear flops forward over the eye
    # the ear flops with the trot
    flick = (state == "idle" and frame in (3, 4)) or trot
    c.paint(flat(polygon([(hx - 1, hy), (hx + 2, hy - 1), (hx + 3, hy + 3 + (1 if flick else 0))]), "d"))
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _pig_rest(c, frame):
    c.paint(flat(rect((6, 18, 11, 20)), "a"))
    c.paint(flat(rect((15, 18, 20, 20)), "a"))
    body = ellipse((3, 9, 21, 18)) | rect((6, 9, 19, 14))
    c.paint(shade(body, 1, 2))
    for dx, dy in ((2, 11), (1, 10), (1, 9), (2, 8)):
        c.dot(dx, dy, "d")
    dip = [0, 0, 1, 1, 1, 1, 0, 0][frame]
    hx, hy = 19, 11 + dip
    head = polygon([(hx - 3, hy - 1), (hx + 4, hy + 1), (hx + 5, hy + 6), (hx - 3, hy + 7)])
    c.paint(shade(head, 1, 1))
    c.paint(flat(ellipse((hx + 4, hy + 2, hx + 7, hy + 5)), "b"))
    c.dot(hx + 6, hy + 3, "e")
    c.dot(hx + 6, hy + 4, "e")
    c.dot(hx + 2, hy + 2, "e" if frame not in (3, 4) else "d")
    c.paint(flat(polygon([(hx - 1, hy), (hx + 2, hy - 1), (hx + 3, hy + 3)]), "d"))
    return c.finish()


# ---------------------------------------------------------------- chicken
def chicken(state, frame):
    c = Canvas("chicken")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 16
    bob = round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0
    # The body rides three rows clear of the ground, or it sits on its feet.
    by = -bob - 3
    lean = 1 if running else 0
    # legs: two, alternating; thin accent colour with a splayed foot
    for key, ph, near in (("far", 0.5, False), ("near", 0.0, True)):
        if moving:
            dx, up = walk_foot(t + ph, 2.5 if running else 1.5, 3 if running else 2, 0.5 if running else 0.6)
        elif state == "forage" and frame == (0 if near else 1):
            # a scratch at the dirt with each foot before the head goes down
            dx, up = -2.0, 1.0
        else:
            dx, up = 0.0, 0.0
        hx = 8 + (1 if near else -1)
        foot = (hx + dx, ground - up)
        knee = ((hx + foot[0]) / 2 + 0.5, (15 + by + foot[1]) / 2)
        pixels = flat(line((hx, 15 + by), knee) | line(knee, foot), "a" if near else "d")
        fx, fy = round(foot[0]), round(foot[1])
        for k in (-1, 0, 1, 2):
            pixels[(fx + k, fy)] = "a" if near else "d"
        c.paint(pixels)
    # tail: fan of dark feathers up and back
    # the tip lags the body's bob
    tail = polygon([(6, 8 + by), (1, 4 + by + bob), (0, 6 + by + bob), (3, 10 + by), (6, 12 + by)])
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
        dip = [0, 0, 5, 10, 8, 10, 4, 0][frame]  # two pecks
    else:
        dip = 0
    # A walking hen holds her head still in the air while the body catches up,
    # then snaps it forward: against the body that is a slide back and a jump.
    thrust = [2, 1, 0, -1][frame % 4] if moving and not running else (2 if running else 0)
    cock = 1 if state == "idle" and frame in (3, 4) else 0
    hx, hy = 12 + thrust + lean + cock, 5 + by + dip - cock + (bob if moving and not running else 0)
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


# ---------------------------------------------------------------- aurochs
def aurochs(state, frame):
    """Long in the back and long in the leg, standing a good deal taller than
    the cattle that came out of it. The ridge over the shoulder and the horns
    swept forward into a lyre are what tell it from anything else here."""
    c = Canvas("aurochs")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 40
    if state == "rest":
        return _aurochs_rest(c, frame)
    bounce = round(1.4 * max(0.0, math.sin(2 * math.pi * (t + 0.15)))) if running else (round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0)
    by = -bounce
    hip_h, hip_f = (13, 25 + by), (29, 23 + by)
    if running:
        gait = lambda ph: walk_foot(ph, 5.0, 5.0, 0.42)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    else:
        gait = lambda ph: walk_foot(ph, 3.0, 2.8, 0.64)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = 0 if near else -4
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx, ground - up), hind, near,
            thick=3, role="m" if near else "d", lift=up, hoof="o")

    draw_leg("fh", hip_h, True, False)
    draw_leg("ff", hip_f, False, False)
    body = ellipse((7, 16 + by, 34, 29 + by)) | rect((12, 16 + by, 30, 24 + by))
    body |= ellipse((20, 12 + by, 32, 22 + by))
    c.paint(shade(body, 1, 2))
    _aurochs_spine(c, body, by)
    # tail hangs to the hock, tuft at the end
    c.paint(flat(line((8, 18 + by), (5, 30 + by), 1), "d"))
    c.paint(flat(ellipse((4, 30 + by, 6, 33 + by)), "o"))
    stage = [0, 1, 2, 2, 2, 2, 1, 0][frame] if state == "graze" else 0
    chew = 1 if state == "graze" and frame in (3, 5) else 0
    hx, hy = [(35, 16 + by), (36, 23 + by), (37, 28 + by)][stage]
    neck = polygon([(27, 14 + by), (32, 13 + by), (hx + 4, hy + 2), (hx - 1, hy + 9)])
    c.paint(shade(neck, 1, 2))
    _aurochs_head(c, hx, hy, chew, state == "idle" and frame in (3, 4))
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _aurochs_spine(c, body, by):
    """The pale line down the back. Only over the barrel and the ridge: it
    stops at the withers rather than running on down the neck."""
    for x in range(12, 31):
        column = [y for bx, y in body if bx == x]
        if column:
            c.dot(x, min(column), "b")


def _aurochs_head(c, x, y, chew, flick):
    """Head at (x, y) = top of the poll. A bovine carries it low and level, so
    the muzzle sits well below the line of the back."""
    # far horn first: pale, or it is lost against a near-black head
    c.paint(flat(line((x + 1, y + 2), (x + 5, y), 1) | line((x + 5, y), (x + 6, y - 3), 1), "b"))
    skull = ellipse((x, y, x + 6, y + 8))
    muzzle = polygon([(x + 4, y + 4), (x + 10, y + 6), (x + 10, y + 9 + chew), (x + 4, y + 10)])
    c.paint(shade(skull | muzzle, 1, 1))
    # pale ring round the muzzle, the way every wild ox is marked
    c.paint(flat(polygon([(x + 8, y + 6), (x + 10, y + 6), (x + 10, y + 9 + chew), (x + 8, y + 9 + chew)]), "b"))
    c.dot(x + 10, y + 7, "e")
    c.dot(x + 4, y + 3, "e")
    # near horn: out and forward off the poll, then the tip turns up and in
    c.paint(flat(line((x + 2, y + 1), (x + 8, y - 1), 2) | line((x + 8, y - 1), (x + 9, y - 5), 1), "a"))
    c.dot(x + 9, y - 5, "o")
    ear = polygon([(x, y + 4), (x - 4, y + 2 + (1 if flick else 0)), (x + 1, y + 7)])
    c.paint(flat(ear, "o"))
    c.dot(x - 1, y + 4, "d")


def _aurochs_rest(c, frame):
    body = ellipse((7, 24, 34, 37)) | rect((12, 24, 30, 32))
    body |= ellipse((20, 20, 32, 30))
    c.paint(shade(body, 1, 2))
    _aurochs_spine(c, body, 0)
    # folded forelegs along the ground
    fore = rect((28, 36, 37, 38)) | rect((26, 32, 31, 37))
    fp = shade(fore, 1, 1)
    fp[(37, 37)] = fp[(37, 38)] = "o"
    c.paint(fp)
    c.paint(flat(rect((11, 37, 16, 38)), "d"))
    dip = [0, 0, 1, 1, 1, 1, 0, 0][frame]
    hx, hy = 35, 22 + dip
    c.paint(shade(polygon([(27, 22), (32, 21), (hx + 4, hy + 2), (hx - 1, hy + 9)]), 1, 2))
    _aurochs_head(c, hx, hy, 0, frame in (3, 4))
    return c.finish()


# ---------------------------------------------------------------- wild boar
def wild_boar(state, frame):
    """High in the shoulder and low at the rump, the opposite rake to the farm
    pig, with a bristle crest along the spine and one tusk showing."""
    c = Canvas("wild-boar")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 24
    if state == "rest":
        return _boar_rest(c, frame)
    bounce = round(1.2 * max(0.0, math.sin(2 * math.pi * (t + 0.15)))) if running else (round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0)
    by = -bounce
    hip_h, hip_f = (8, 17 + by), (21, 15 + by)
    if running:
        gait = lambda ph: walk_foot(ph, 3.0, 3.0, 0.44)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    else:
        gait = lambda ph: walk_foot(ph, 1.8, 1.8, 0.62)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = 0 if near else -2
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx, ground - up), hind, near,
            role="m" if near else "d", lift=up, hoof="o")

    draw_leg("fh", hip_h, True, False)
    draw_leg("ff", hip_f, False, False)
    body = ellipse((4, 11 + by, 24, 21 + by)) | ellipse((12, 8 + by, 26, 20 + by))
    c.paint(shade(body, 1, 2))
    # crest: bristles standing along the spine, raised when it runs
    up = 1 if running else 0
    for bx in range(9, 24, 2):
        top = min(y for x, y in body if x == bx) if any(x == bx for x, y in body) else 10 + by
        c.paint(flat(line((bx, top), (bx - 1, top - 2 - up), 1), "o"))
    c.paint(flat(line((5, 13 + by), (2, 16 + by), 1), "o"))
    stage = [0, 1, 2, 2, 2, 2, 1, 0][frame] if state == "forage" else 0
    root = 1 if state == "forage" and frame in (3, 5) else 0
    hx, hy = [(24, 9 + by), (25, 12 + by), (26, 15 + by)][stage]
    head = polygon([(hx - 4, hy - 1), (hx + 3, hy + 2), (hx + 4, hy + 8), (hx - 4, hy + 9)])
    c.paint(shade(head, 1, 1, base="b", light="d", dark="o"))
    snout = ellipse((hx + 3, hy + 4 + root, hx + 7, hy + 8 + root))
    c.paint(flat(snout, "d"))
    c.dot(hx + 6, hy + 5 + root, "e")
    c.dot(hx + 6, hy + 6 + root, "e")
    c.dot(hx + 1, hy + 3, "e")
    # tusk curling up out of the lower jaw
    c.paint(flat(line((hx + 4, hy + 8 + root), (hx + 6, hy + 5 + root), 1), "a"))
    flick = state == "idle" and frame in (3, 4)
    c.paint(flat(polygon([(hx - 3, hy), (hx, hy - 3 - (1 if flick else 0)), (hx + 1, hy + 2)]), "o"))
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _boar_rest(c, frame):
    c.paint(flat(rect((7, 22, 12, 24)), "o"))
    c.paint(flat(rect((17, 22, 22, 24)), "o"))
    body = ellipse((4, 13 + 0, 24, 23)) | ellipse((12, 10, 26, 22))
    c.paint(shade(body, 1, 2))
    for bx in range(9, 24, 2):
        top = min(y for x, y in body if x == bx)
        c.paint(flat(line((bx, top), (bx - 1, top - 2), 1), "o"))
    dip = [0, 0, 1, 1, 1, 1, 0, 0][frame]
    hx, hy = 24, 12 + dip
    head = polygon([(hx - 4, hy - 1), (hx + 3, hy + 2), (hx + 4, hy + 8), (hx - 4, hy + 9)])
    c.paint(shade(head, 1, 1, base="b", light="d", dark="o"))
    c.paint(flat(ellipse((hx + 3, hy + 4, hx + 7, hy + 8)), "d"))
    c.dot(hx + 6, hy + 5, "e")
    c.dot(hx + 1, hy + 3, "e" if frame not in (3, 4) else "d")
    c.paint(flat(line((hx + 4, hy + 8), (hx + 6, hy + 5), 1), "a"))
    c.paint(flat(polygon([(hx - 3, hy), (hx, hy - 3), (hx + 1, hy + 2)]), "o"))
    return c.finish()


# ---------------------------------------------------------------- llama
def llama(state, frame):
    """All neck and leg. The barrel is small and woolly, the neck stands
    straight up out of the shoulder, and the ears curve in over the skull."""
    c = Canvas("llama")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 34
    if state == "rest":
        return _llama_rest(c, frame)
    bounce = round(1.4 * max(0.0, math.sin(2 * math.pi * (t + 0.15)))) if running else (round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0)
    by = -bounce
    hip_h, hip_f = (8, 22 + by), (20, 22 + by)
    if running:
        gait = lambda ph: walk_foot(ph, 4.0, 4.0, 0.44)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    else:
        gait = lambda ph: walk_foot(ph, 2.4, 2.4, 0.62)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = 0 if near else -3
        leg(c, (hip[0] + ox, hip[1]), (hip[0] + ox + dx, ground - up), hind, near,
            role="m" if near else "d", lift=up, hoof="b")

    draw_leg("fh", hip_h, True, False)
    draw_leg("ff", hip_f, False, False)
    # woolly barrel: a flank shape with a lumpy underline
    body = ellipse((5, 15 + by, 24, 25 + by))
    for cx in (7, 12, 17):
        body |= ellipse((cx, 16 + by, cx + 6, 24 + by))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body:
            px[(x, y)] = "h"
    c.paint(px)
    # short tail held up and away
    c.paint(flat(line((5, 17 + by), (3, 13 + by), 2), "d"))
    stage = [0, 1, 2, 2, 2, 2, 1, 0][frame] if state == "graze" else 0
    chew = 1 if state == "graze" and frame in (3, 5) else 0
    if stage == 0:
        neck = polygon([(16, 17 + by), (24, 21 + by), (27, 7 + by), (22, 5 + by)])
        c.paint(over(c, shade(neck, 1, 1)))
        _llama_head(c, 22, 2 + by, "up", chew, state == "idle" and frame in (3, 4))
    elif stage == 1:
        neck = polygon([(16, 17 + by), (24, 21 + by), (29, 14 + by), (27, 10 + by)])
        c.paint(over(c, shade(neck, 1, 1)))
        _llama_head(c, 25, 10 + by, "out", chew, False)
    else:
        neck = polygon([(16, 17 + by), (24, 21 + by), (28, 28 + by), (24, 29 + by)])
        c.paint(over(c, shade(neck, 1, 1)))
        _llama_head(c, 24, 26 + by, "down", chew, False)
    draw_leg("nh", hip_h, True, True)
    draw_leg("nf", hip_f, False, True)
    return c.finish()


def _llama_head(c, x, y, pose, chew, flick):
    """Small wedge head at (x, y) = back of the skull, with the two long ears
    that are the whole silhouette from any distance."""
    if pose == "up":
        skull = ellipse((x, y + 2, x + 5, y + 7))
        muzzle = polygon([(x + 3, y + 3), (x + 8, y + 4), (x + 8, y + 6 + chew), (x + 3, y + 7)])
        c.paint(shade(skull | muzzle, 1, 1, base="b", light="m", dark="o"))
        c.paint(flat(polygon([(x + 6, y + 4), (x + 8, y + 4), (x + 8, y + 6 + chew), (x + 6, y + 6 + chew)]), "a"))
        c.dot(x + 4, y + 4, "e")
        for ex, lean in ((x + 1, -1), (x + 4, 1)):
            c.paint(flat(line((ex, y + 2), (ex + lean, y - 2 - (1 if flick else 0)), 1), "b"))
    elif pose == "out":
        skull = ellipse((x, y, x + 5, y + 5))
        muzzle = polygon([(x + 3, y + 2), (x + 8, y + 4), (x + 8, y + 6 + chew), (x + 3, y + 5)])
        c.paint(shade(skull | muzzle, 1, 1, base="b", light="m", dark="o"))
        c.dot(x + 4, y + 2, "e")
        for ex, lean in ((x + 1, -1), (x + 4, 1)):
            c.paint(flat(line((ex, y), (ex + lean, y - 4), 1), "b"))
    else:
        skull = ellipse((x, y, x + 5, y + 5))
        muzzle = polygon([(x + 2, y + 3), (x + 6, y + 6), (x + 4, y + 8 + chew), (x + 1, y + 5)])
        c.paint(shade(skull | muzzle, 1, 1, base="b", light="m", dark="o"))
        c.dot(x + 4, y + 2, "e")
        for ex, lean in ((x, -1), (x + 3, 1)):
            c.paint(flat(line((ex, y), (ex + lean, y - 4), 1), "b"))


def _llama_rest(c, frame):
    # Sitting with the legs folded under, the way a llama always rests.
    body = ellipse((5, 22, 25, 33))
    for cx in (7, 12, 17):
        body |= ellipse((cx, 23, cx + 6, 32))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body:
            px[(x, y)] = "h"
    c.paint(px)
    c.paint(flat(line((5, 24), (3, 20), 2), "d"))
    dip = [0, 0, 1, 1, 1, 1, 0, 0][frame]
    neck = polygon([(16, 24), (24, 27), (27, 14 + dip), (22, 12 + dip)])
    c.paint(over(c, shade(neck, 1, 1)))
    _llama_head(c, 22, 9 + dip, "up", 0, frame in (3, 4))
    return c.finish()


# ---------------------------------------------------------------- turkey
def turkey(state, frame):
    """Heavier and taller than the hen, carried on a deeper breast, with the
    tail standing in a fan and a bare red head."""
    c = Canvas("turkey")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 22
    bob = round(0.5 * math.cos(4 * math.pi * t) + 0.5) if moving else 0
    # Three rows of leg under the breast, as for the hen.
    by = -bob - 3
    for key, ph, near in (("far", 0.5, False), ("near", 0.0, True)):
        dx, up = walk_foot(t + ph, 3.0 if running else 1.8, 3 if running else 2, 0.5 if running else 0.6) if moving else (0.0, 0.0)
        hx = 12 + (1 if near else -1)
        foot = (hx + dx, ground - up)
        knee = ((hx + foot[0]) / 2 + 0.5, (20 + by + foot[1]) / 2)
        pixels = flat(line((hx, 20 + by), knee, 2) | line(knee, foot, 2), "a" if near else "d")
        fx, fy = round(foot[0]), round(foot[1])
        for k in (-1, 0, 1, 2, 3):
            pixels[(fx + k, fy)] = "a" if near else "d"
        c.paint(pixels)
    # tail fan, standing when the bird is settled and trailing when it runs
    if running:
        tail = polygon([(8, 10 + by), (0, 12 + by), (0, 16 + by), (8, 16 + by)])
    else:
        tail = polygon([(8, 12 + by), (2, 4 + by), (0, 8 + by), (1, 15 + by), (8, 17 + by)])
    tp = shade(tail, 1, 1, base="d", light="m", dark="o")
    for x, y in tail:
        if (x, y - 1) not in tail:
            tp[(x, y)] = "h"
    c.paint(tp)
    body = ellipse((5, 10 + by, 19, 21 + by))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body and 8 <= x <= 16:
            px[(x, y)] = "h"
    c.paint(px)
    wing_up = running and frame % 2 == 0
    wing = polygon([(8, 13 + by), (16, 13 + by), (17, 16 + by), (12, 19 + by), (8, 18 + by)]) if not wing_up else polygon([(8, 12 + by), (17, 7 + by), (18, 10 + by), (13, 15 + by), (8, 16 + by)])
    c.paint(shade(wing, 1, 1, base="m", light="l", dark="d"))
    # beard: the tuft of bristle on the breast
    c.paint(flat(rect((17, 17 + by, 18, 20 + by)), "o"))
    dip = [0, 0, 3, 8, 12, 12, 5, 0][frame] if state == "forage" else 0
    thrust = [2, 1, 0, -1][frame % 4] if moving and not running else (2 if running else 0)
    hx, hy = 16 + thrust, 4 + by + dip + (bob if moving and not running else 0)
    neck = polygon([(15, 13 + by), (18, 12 + by), (hx + 4, hy + 4), (hx + 1, hy + 5)])
    c.paint(shade(neck, 1, 1, base="b", light="b", dark="o"))
    head = ellipse((hx, hy, hx + 4, hy + 4))
    c.paint(shade(head, 1, 1, base="b", light="b", dark="o"))
    # snood over the beak, wattle under the chin
    c.dot(hx + 4, hy, "b")
    c.dot(hx + 5, hy + 1, "b")
    c.dot(hx + 5, hy + 2, "a")
    c.dot(hx + 6, hy + 2, "a")
    # the wattle swings a beat behind the head
    c.dot(hx + 3 - (1 if moving and frame % 4 == 0 else 0), hy + 5, "b")
    blink = state == "idle" and frame == 6
    c.dot(hx + 3, hy + 1, "o" if blink else "e")
    return c.finish()


# ---------------------------------------------------------------- cattle egret
def egret(state, frame):
    """Hunched white heron with a thick jowled neck and a yellow dagger bill.
    It walks as it feeds, head pumping, and stabs at what the herd kicks up."""
    c = Canvas("cattle-egret")
    ground = 23
    flying = state in {"flight", "approach"} or (state == "takeoff" and frame >= 2) or (state == "landing" and frame < 5)
    legs = []
    if flying:
        lift = {"takeoff": -(frame - 1), "landing": -(5 - frame)}.get(state, -4)
        by = 16 + max(lift, -4)
        beat = {"flight": [0, 0, 1, 2, 3, 3, 2, 1], "approach": [2, 2, 2, 1, 2, 2, 2, 3],
                "takeoff": [0, 0, 0, 3, 0, 3, 1, 3], "landing": [0, 3, 0, 3, 1, 2, 2, 2]}[state][frame]
        wings = [
            [(11, by - 2), (18, by - 2), (16, by - 9), (12, by - 14), (8, by - 10)],
            [(11, by - 2), (18, by - 2), (14, by - 7), (5, by - 8)],
            [(11, by - 2), (18, by - 1), (12, by + 1), (3, by - 1)],
            [(11, by - 1), (17, by - 1), (14, by + 4), (9, by + 8), (8, by + 3)],
        ]
        # far wing a shadow behind, then the body, then the near wing over it
        c.paint(flat(shift(polygon(wings[beat]), -2, -1), "d"))
        body = ellipse((9, by - 3, 20, by + 2))
        c.paint(shade(body, 1, 1))
        # neck folded back into the shoulders, head forward of the chest
        head = ellipse((18, by - 5, 22, by - 1))
        c.paint(shade(head, 1, 1))
        c.dot(19, by - 5, "b")
        c.dot(20, by - 5, "b")
        c.paint(flat(line((23, by - 3), (25, by - 2)) | {(23, by - 2)}, "a"))
        c.dot(21, by - 4, "e")
        c.paint(shade(polygon(wings[beat]), 1, 1, base="l", light="h", dark="m"))
        # legs trail past the tail
        foot = 2 if state in {"flight", "approach"} else 0
        legs = [((9, by + 1), (4 + foot, by + 2 - foot // 2)), ((9, by), (4 + foot, by + 1 - foot // 2))]
        if state == "landing" and frame >= 3 or state == "takeoff" and frame < 4:
            legs = [((12, by + 2), (11, by + 7)), ((14, by + 2), (15, by + 7))]
    else:
        walking = state == "forage"
        # forage: a slow walk with the head pumping, and one stab at 4-5
        t = frame / 8
        stab = walking and frame in (4, 5)
        by = 15
        for ph in (0.0, 0.5):
            dx, up = walk_foot(t + ph, 2.0, 2.0, 0.6) if walking and not stab else (0.0, 0.0)
            hip = (13 + (1 if ph else 0), by + 1)
            foot = (13 + (1 if ph else 0) + dx, ground - up)
            knee = ((hip[0] + foot[0]) / 2 - 1, (hip[1] + foot[1]) / 2)
            legs.append((hip, knee))
            legs.append((knee, foot))
        hunch = state == "perch" and frame in (6, 7)
        body = ellipse((7, by - 6 + hunch, 18, by + 1))
        c.paint(shade(body, 1, 2))
        # tail tips down behind
        c.paint(flat(polygon([(8, by - 3), (4, by + 1), (7, by + 1)]), "d"))
        wing = polygon([(8, by - 4), (16, by - 5), (15, by - 1), (9, by)])
        c.paint(shade(wing, 1, 1, base="m", light="l", dark="d"))
        for x in (10, 11, 12):
            c.dot(x, by - 5 + hunch, "b")
        pump = [0, 1, 2, 1, 0, 0, 1, 2][frame] if walking else 0
        if stab:
            hx, hy = 19, by - 1 + (frame - 4) * 2
        elif hunch:
            hx, hy = 16, by - 9
        else:
            hx, hy = 16 + pump, by - 10 + (1 if pump == 2 else 0)
            if state == "perch" and frame in (2, 3):
                hx -= 1
        neck = polygon([(14, by - 4), (17, by - 4), (hx + 3, hy + 3), (hx + 1, hy + 4)])
        c.paint(over(c, shade(neck, 1, 1)))
        head = ellipse((hx, hy, hx + 4, hy + 4))
        c.paint(shade(head, 1, 1))
        c.dot(hx + 1, hy, "b")
        c.dot(hx + 2, hy, "b")
        # the jowl: feathers bunched under the chin
        c.dot(hx + 1, hy + 4, "l")
        down = 1 if stab else 0
        c.paint(flat(line((hx + 5, hy + 2), (hx + 7, hy + 2 + 2 * down)) | {(hx + 5, hy + 3)}, "a"))
        blink = state == "perch" and frame == 5
        c.dot(hx + 3, hy + 1, "o" if blink else "e")
    im = c.finish()
    px = im.load()
    ink = _rgba(c.palette["k"])
    for a, b in legs:
        for x, y in line(a, b):
            if 0 <= x < c.w and 0 <= y < c.h and (x, y) not in c.px:
                px[x, y] = ink
    return im


# ---------------------------------------------------------------- guinea pig
def guinea_pig(state, frame):
    """No neck, no tail, no daylight under it. One loaf with a nose on the
    front and a patch of white, which is all it is at this size."""
    c = Canvas("guinea-pig")
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = 10
    scuttle = 0 if state == "rest" else (round(math.cos(6 * math.pi * t)) if moving else 0)
    by = -max(0, scuttle) if running else 0
    low = 1 if state == "rest" else 0
    body = ellipse((2, 3 + by + low, 14, 9 + by + low)) | ellipse((8, 2 + by + low, 16, 9 + by + low))
    px = shade(body, 1, 1)
    # a white saddle over the shoulder, the marking every kept one has
    for x, y in body:
        if 5 <= x <= 9 and y <= 6 + by + low:
            px[(x, y)] = "b" if (x, y - 1) not in body else "h"
    c.paint(px)
    if state != "rest":
        # feet flicker rather than stride: nothing is visible below the body
        for fx in (4, 12):
            step = 1 if moving and (frame + fx) % 4 < 2 else 0
            c.paint(flat(rect((fx + step, ground + by - 1, fx + step + 1, ground + by)), "a"))
    dip = 2 if state == "forage" and frame in (2, 3, 4, 5) else 0
    hx, hy = 13, 3 + by + low + dip
    head = ellipse((hx, hy, hx + 4, hy + 5))
    c.paint(shade(head, 1, 1))
    c.dot(hx + 4, hy + 2 + dip // 2, "e")
    c.dot(hx + 3, hy + 1, "e" if not (state == "idle" and frame == 6) else "d")
    # ear: a small petal laid back over the skull
    c.paint(flat(polygon([(hx, hy), (hx + 2, hy - 1), (hx + 2, hy + 2)]), "a"))
    return c.finish()


# ---------------------------------------------------------------- waterfowl
FOWL = {
    # canvas ground row, body box, head size, neck rise, leg length
    "duck": dict(g=13, body=(3, 5, 15, 11), head=4, rise=6, legs=2, tail=3),
    "mallard": dict(g=13, body=(3, 5, 15, 11), head=4, rise=6, legs=2, tail=3),
    "goose": dict(g=21, body=(3, 9, 20, 18), head=5, rise=11, legs=3, tail=3),
}


def waterfowl(species, state, frame):
    """A boat-shaped body, a head on a neck and a flat bill. Ashore it
    waddles; afloat the legs go and the hull sits on the waterline, and now
    and then the head goes under."""
    c = Canvas(species)
    P = FOWL[species]
    g = P["g"]
    t = frame / 8
    swim = state in {"swim", "dabble"}
    moving = state in {"wander", "flee"}
    running = state == "flee"
    x0, y0, x1, y1 = P["body"]
    # Afloat the hull sinks to the waterline, two rows above the canvas ground.
    sink = (g - 1) - y1 if swim else 0
    bob = (1 if frame in (2, 3, 6, 7) else 0) if moving else 0
    by = sink - bob
    rock = (1 if frame % 4 < 2 else -1) if moving else 0
    if not swim:
        for k, (lx, ph) in enumerate(((x0 + (x1 - x0) // 2 - 1, 0.5), (x0 + (x1 - x0) // 2 + 1, 0.0))):
            near = k == 1
            if moving:
                dx, up = walk_foot(t + ph, 1.5 if not running else 2.5, 1.5, 0.55)
            else:
                dx, up = 0.0, 0.0
            top = y1 + by
            foot = (lx + dx, g - up)
            pixels = flat(line((lx, top), (round(foot[0]), round(foot[1]))), "a" if near else "d")
            # webbed foot: a flat paddle forward
            for k2 in (0, 1, 2):
                pixels[(round(foot[0]) + k2 - 1, round(foot[1]))] = "a" if near else "d"
            c.paint(pixels)
    # tail: a short upturned point behind
    tail = polygon([(x0 + 2, y0 + 1 + by), (x0 - 2, y0 - 1 + by - (1 if moving and rock > 0 else 0)), (x0 - 2, y0 + 2 + by), (x0 + 1, y0 + P["tail"] + 3 + by)])
    dabble = state == "dabble" and frame in (3, 4, 5, 6)
    if dabble:
        # Upended: tail to the sky, head under.
        tail = polygon([(x0 + 3, y0 + 2 + by), (x0, y0 - 4 + by), (x0 + 2, y0 - 4 + by), (x0 + 5, y0 + 1 + by)])
    c.paint(shade(tail, 1, 1))
    body = ellipse((x0, y0 + by, x1, y1 + by))
    if swim:
        body = {(x, y) for x, y in body if y <= g - 1}
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body and x0 + 2 <= x <= x1 - 3:
            px[(x, y)] = "h"
        if x >= x1 - 3 and y <= y0 + by + (y1 - y0) // 2 + 1:
            px[(x, y)] = "c"
        if species == "goose" and x <= x0 + 3 and y >= y0 + by + (y1 - y0) // 2:
            px[(x, y)] = "c"
    c.paint(px)
    flap = running and frame % 2 == 0
    wx = x0 + 3
    if flap:
        wing = polygon([(wx, y0 + 2 + by), (wx + 6, y0 - 4 + by), (wx + 8, y0 - 2 + by), (wx + 7, y0 + 3 + by)])
    else:
        wing = polygon([(wx, y0 + 2 + by), (x1 - 3, y0 + 2 + by), (x1 - 2, y0 + 4 + by), (wx + 4, y1 - 2 + by), (wx - 1, y0 + 4 + by)])
    c.paint(shade(wing, 1, 1, base="m", light="l", dark="d"))
    if not flap:
        for k in (0, 1):
            c.dot(wx + 3 + k, y1 - 3 + by, "s")
    hs = P["head"]
    # Head carriage: up, or down to the grass, or under the water.
    if state == "forage":
        dip = [0, 2, 5, 6, 6, 5, 2, 0][frame] * P["rise"] // 6
    elif state == "swim" and frame in (2, 3):
        dip = P["rise"] // 2
    else:
        dip = 0
    stretch = 2 if running else (1 if moving and frame % 4 < 2 else 0)
    hx = x1 - 2 + stretch
    hy = y0 - P["rise"] + 2 + by + dip
    if dabble:
        hy = g + 4  # under
    else:
        # A goose's neck is long and slender; a duck's is short and thick.
        nb = 2 if species == "goose" else 4
        neck = polygon([(x1 - nb, y0 + 2 + by), (x1, y0 + 1 + by), (hx + hs - 2, hy + hs - 1), (hx + 1, hy + hs - 1)])
        nk = shade(neck, 1, 1)
        if species != "goose":
            nk = {xy: ("n" if role == "m" else role) for xy, role in nk.items()} if species == "mallard" else nk
        c.paint(over(c, nk))
        if species == "mallard":
            # white collar at the base of the green
            for x in range(x1 - 3, x1 + 1):
                if (x, y0 + by) in c.px:
                    c.dot(x, y0 + by, "h")
        head = ellipse((hx, hy, hx + hs, hy + hs))
        hp = shade(head, 1, 1)
        if species != "duck":
            hp = {xy: ("n" if role in ("m", "l") else role) for xy, role in hp.items()}
        c.paint(hp)
        bl = 3 if hs == 4 else 4
        bill = rect((hx + hs + 1, hy + hs // 2, hx + hs + bl, hy + hs // 2 + 1))
        c.paint(flat(bill, "b"))
        blink = state == "idle" and frame == 6
        c.dot(hx + hs - 1, hy + 1, "d" if blink else "e")
    im = c.finish()
    if swim:
        # Nothing shows under the waterline, not even the outline.
        pix = im.load()
        for y in range(g, im.height):
            for x in range(im.width):
                pix[x, y] = (0, 0, 0, 0)
        # A ripple ring where the hull meets the water.
        ring = _rgba(c.palette["l"])
        lo = max(x for x, y in c.px if y == g - 1) if any(y == g - 1 for x, y in c.px) else x1
        for x in (x0 - 2, lo + 2):
            if 0 <= x < im.width:
                pix[x, g - 1] = ring
    return im


# ---------------------------------------------------------------- herons
def heron(species, state, frame):
    """Long legs, a long dagger bill and a neck that folds into an S. It stalks
    the shallows head forward and stabs; at rest it hunches, head on the
    shoulders; in the air it flies slow with the neck drawn back and the legs
    trailing."""
    c = Canvas(species)
    ground = 33
    flying = state in {"flight", "approach"} or (state == "takeoff" and frame >= 2) or (state == "landing" and frame < 5)
    legs = []
    if flying:
        lift = {"takeoff": -(frame - 1) * 2, "landing": -(5 - frame) * 2}.get(state, -8)
        by = 24 + max(lift, -8)
        beat = {"flight": [0, 0, 1, 1, 2, 3, 3, 1], "approach": [2, 2, 2, 1, 2, 2, 2, 3],
                "takeoff": [0, 3, 0, 3, 1, 3, 1, 2], "landing": [0, 3, 0, 3, 1, 2, 2, 2]}[state][frame]
        wings = [
            [(14, by - 2), (24, by - 2), (22, by - 11), (16, by - 17), (10, by - 12)],
            [(14, by - 2), (24, by - 2), (19, by - 9), (6, by - 10)],
            [(14, by - 2), (24, by - 1), (16, by + 2), (4, by)],
            [(14, by - 1), (23, by - 1), (19, by + 6), (12, by + 11), (10, by + 4)],
        ]
        c.paint(flat(shift(polygon(wings[beat]), -2, -1), "d"))
        body = ellipse((12, by - 4, 26, by + 2))
        c.paint(shade(body, 1, 1))
        # neck drawn back in an S: the head sits on the chest
        head = ellipse((24, by - 5, 28, by - 1))
        c.paint(shade(head, 1, 1))
        c.paint(flat(line((25, by - 5), (21, by - 6)), "b"))
        c.paint(flat(line((29, by - 3), (33, by - 2)) | {(29, by - 2)}, "a"))
        c.dot(27, by - 4, "e")
        c.paint(shade(polygon(wings[beat]), 1, 1, base="m", light="l", dark="d"))
        for x in range(4, 9):
            if any((x, y) in c.px for y in range(by - 20, by + 14)):
                pass
        # dark primaries at the wingtip
        for x, y in polygon(wings[beat]):
            if x <= min(px for px, _ in wings[beat]) + 3:
                c.dot(x, y, "b")
        foot = 2 if state in {"flight", "approach"} else 0
        legs = [((12, by + 1), (4 + foot, by + 2)), ((12, by), (4 + foot, by + 1))]
        if state == "landing" and frame >= 3 or state == "takeoff" and frame < 4:
            legs = [((17, by + 2), (15, by + 10)), ((19, by + 2), (20, by + 10))]
    else:
        walking = state == "forage"
        t = frame / 8
        stab = walking and frame in (5, 6)
        by = 20
        for ph in (0.0, 0.5):
            dx, up = walk_foot(t + ph, 2.5, 2.5, 0.65) if walking and not stab else (0.0, 0.0)
            hip = (17 + (1 if ph else 0), by)
            foot = (17 + (1 if ph else 0) + dx, ground - up)
            knee = ((hip[0] + foot[0]) / 2 - 1, (hip[1] + foot[1]) / 2)
            legs.append((hip, knee))
            legs.append((knee, foot))
        hunch = state == "perch"
        body = ellipse((9, by - 9, 23, by + 1)) | polygon([(10, by - 6), (6, by + 3), (10, by + 2)])
        c.paint(shade(body, 1, 2))
        wing = polygon([(10, by - 7), (21, by - 8), (20, by - 2), (11, by + 1)])
        c.paint(shade(wing, 1, 1, base="m", light="l", dark="d"))
        for x in range(10, 14):
            c.dot(x, by - 1, "b")
        if hunch:
            # head drawn down on the shoulders, bill out level
            hx, hy = 20, by - 13 + (1 if frame in (5, 6) else 0)
            neck = polygon([(19, by - 8), (23, by - 8), (hx + 4, hy + 4), (hx, hy + 3)])
        else:
            reach = [0, 1, 2, 2, 2, 3, 3, 1][frame] if walking else 0
            if stab:
                hx, hy = 27, by - 4 + (frame - 5) * 4
            else:
                hx, hy = 23 + reach, by - 17 + reach
            neck = polygon([(19, by - 8), (22, by - 9), (hx + 3, hy + 3), (hx + 1, hy + 4)])
        np = shade(neck, 1, 1, base="l", light="h", dark="m")
        c.paint(over(c, np))
        # the black stripe down the front of the neck
        for x, y in neck:
            if (x + 1, y) not in neck and y % 2 == 0:
                c.dot(x, y, "b")
        head = ellipse((hx, hy, hx + 4, hy + 4))
        c.paint(shade(head, 1, 1, base="l", light="h", dark="m"))
        # crest: the black stripe over the eye and a plume trailing behind
        c.paint(flat(line((hx + 1, hy + 1), (hx - 3, hy + 2)), "b"))
        down = 2 if stab else 0
        c.paint(flat(line((hx + 5, hy + 2), (hx + 10, hy + 2 + down)) | line((hx + 5, hy + 3), (hx + 8, hy + 3 + down)), "a"))
        blink = state == "perch" and frame == 4
        c.dot(hx + 3, hy + 1, "o" if blink else "e")
    im = c.finish()
    px = im.load()
    ink = _rgba(c.palette["k"])
    for a, b in legs:
        for x, y in line(a, b):
            if 0 <= x < c.w and 0 <= y < c.h and (x, y) not in c.px:
                px[x, y] = ink
    return im


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

CROW = {
    "stand": [
        "..................",
        "..................",
        "..................",
        "..................",
        "...........llll...",
        "..........lmmmea..",
        "..........mmmmaaa.",
        "..........mmmm....",
        "...dd...mmmmmd....",
        "..ddmmmmmmmdlll...",
        ".dddmmmmmmddlhl...",
        "dddmmmmmmmmmlll...",
        "..ddmmmmmmmmll....",
        "....dddmmmmml.....",
        ".......a...a......",
        "......aa...aa.....",
        "..................",
        "..................",
    ],
    "peck": [
        "..................",
        "..................",
        "..................",
        "..................",
        "..................",
        "..................",
        "....dd............",
        "...ddmmmm.........",
        "..dddmmmmmmdl.....",
        ".dddmmmmmmmddll...",
        "dddmmmmmmmmmmlhl..",
        "...ddmmmmmmmmlllm.",
        ".....dddmmmm.lmmea",
        ".......a...a..maaa",
        "......aa...aa...a.",
        "..................",
        "..................",
        "..................",
    ],
    "fly": [
        "..................",
        "..................",
        "..................",
        "..................",
        "..................",
        "..................",
        "............llll..",
        "...ddmmmmmmmmmmea.",
        "ddddmmmmmmmmlllmaa",
        "..dddmmmmmmllll...",
        "....ddddmmmll.....",
        "..................",
        "..................",
        "..................",
        "..................",
        "..................",
        "..................",
        "..................",
    ],
    "wings": {
        "up": (["......d", ".....dl", "....dll", "...dll.", "..dll..", ".dll...", "dll...."], 4, 1),
        "mid": (["dddddddl", ".dddddl."], 4, 8),
        "down": (["d.......", "dl......", ".dll....", "..dll...", "...dll..", "....dl.."], 5, 9),
    },
    "legs": (7, 11),
}
LOCUST = {
    "stand": [
        "............",
        "............",
        "............",
        ".....aa.....",
        "...lllla..a.",
        "..lhllllla..",
        ".dmmmmmmmmme",
        "..dmmmmmmmm.",
        "...a.a..a.a.",
        "..a..a...a..",
    ],
    "peck": [
        "............",
        "............",
        "............",
        "............",
        "......aa....",
        "...lllllla..",
        "..dmmmmmmmm.",
        "...dmmmmmmme",
        "...a.a..a.aa",
        "..a..a...a..",
    ],
    "fly": [
        "............",
        "............",
        "............",
        "............",
        "............",
        "..........a.",
        ".dmmmmmmmmme",
        "..dmmmmmmmm.",
        "....a..a....",
        "............",
    ],
    "wings": {
        "up": (["...hl", "..hll", ".hll.", "hll.."], 3, 2),
        "mid": (["hhllllll"], 2, 5),
        "down": ([".hll.", "..hll", "...hl"], 3, 7),
    },
    "legs": (4, 8),
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
    art = {"rock-dove": DOVE, "crow": CROW, "locust": LOCUST}.get(species, SPARROW)
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
                if species in {"house-sparrow", "rock-dove", "crow", "locust"}:
                    im = bird(species, state, frame)
                elif species == "chicken":
                    im = chicken(state, frame)
                elif species == "sheep":
                    im = sheep(state, frame)
                elif species == "goat":
                    im = goat(state, frame)
                elif species == "pig":
                    im = pig(state, frame)
                elif species == "red-deer":
                    im = deer(state, frame)
                elif species == "aurochs":
                    im = aurochs(state, frame)
                elif species == "wild-boar":
                    im = wild_boar(state, frame)
                elif species == "llama":
                    im = llama(state, frame)
                elif species == "turkey":
                    im = turkey(state, frame)
                elif species == "cattle-egret":
                    im = egret(state, frame)
                elif species == "guinea-pig":
                    im = guinea_pig(state, frame)
                elif species in FOWL:
                    im = waterfowl(species, state, frame)
                elif species in {"grey-heron", "great-blue-heron"}:
                    im = heron(species, state, frame)
                else:
                    im = wolf(state, frame)
                result[f"faunab-{species}-{state}-{frame}"] = im
    return result
