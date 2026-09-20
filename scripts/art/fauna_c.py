"""Fauna C: four-direction horses and rabbits.

Set B draws side views only and mirrors them for west. This set authors north,
east, south and west separately, because a front-on horse is a different
silhouette from a side-on one, not a rotation of it.

Style follows set B -- masses at native size, light from above, one hue-matched
outline round the whole silhouette, no interior outlines, binary alpha, no baked
shadow -- with Stardew-style exaggeration: heads and eyes a little large, legs a
little short, so a 16px rabbit still reads as a rabbit. Size hierarchy is kept
against the 29px standing human: horse and foal are at true scale, rabbits are
lifted off it because a true-scale rabbit is four pixels of body.
"""
import math
from PIL import Image
from art.fauna_b import (
    Canvas as _BCanvas,
    ellipse,
    polygon,
    rect,
    line,
    shift,
    shade,
    flat,
    walk_foot,
    _rgba,
)

# o outline · d shadow · m base · l light · h highlight · b second colour · e eye · a accent
PALETTES = {
    "horse": {"o": "#2f1d14", "d": "#4a2e1f", "m": "#6b452c", "l": "#8d5c38", "h": "#ae7c51", "b": "#ece2d2", "e": "#150e09", "a": "#23202c"},
    "foal": {"o": "#5c3f26", "d": "#836039", "m": "#a8834f", "l": "#c6a375", "h": "#e0c49b", "b": "#f2e9d8", "e": "#241810", "a": "#3b4257"},
    "rabbit": {"o": "#7d5a33", "d": "#a67c48", "m": "#c79d68", "l": "#e0bf92", "h": "#f4ddb6", "b": "#fbf3e2", "e": "#241810", "a": "#d79a97"},
    "rabbit-kit": {"o": "#828b9c", "d": "#aab3c0", "m": "#ced5de", "l": "#e8edf2", "h": "#ffffff", "b": "#bcc4d0", "e": "#262b34", "a": "#d7a5a2"},
}

DIRECTIONS = ("south", "east", "north", "west")
STATES = {
    "horse": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "foal": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "rabbit": dict.fromkeys(["idle", "forage", "wander", "flee", "rest"], 8),
    "rabbit-kit": dict.fromkeys(["idle", "forage", "wander", "flee"], 8),
}
# True scale against the 29px human is ~17px per metre. Horse 2.4m long and
# 1.55m at the withers lands on 40x36; the foal is 60% of it. Rabbits are drawn
# well over scale so they stay legible, matched to set B's 14px sparrow.
# HEADROOM is empty rows added on top for the airborne frames -- a hopping
# rabbit was losing its ear tips off the canvas. Drawing coordinates stay
# measured from the standing pose; finish() shifts the whole sprite down.
# FOOTROOM matches sets A and B, whose renderer reads the ground line as three
# rows up from the bottom of the frame.
HEADROOM = {"horse": 3, "foal": 3, "rabbit": 5, "rabbit-kit": 4}
FOOTROOM = 3
STANDING_SIZES = {
    "horse": (40, 35),
    "foal": (24, 23),
    "rabbit": (16, 16),
    "rabbit-kit": (10, 10),
}
NATIVE_SIZES = {
    k: (w, h + HEADROOM[k] + FOOTROOM) for k, (w, h) in STANDING_SIZES.items()
}


class Canvas(_BCanvas):
    def __init__(self, species):
        self.w, self.h = NATIVE_SIZES[species]
        self.palette = PALETTES[species]
        self.pad = HEADROOM[species]
        self.px = {}

    def finish(self):
        if self.pad:
            self.px = {(x, y + self.pad): role for (x, y), role in self.px.items()}
        return super().finish()


def mirror(im):
    out = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    out.info["anchor"] = im.info.get("anchor")
    return out


def _top_light(px, mask, lo, hi, role="h"):
    for x, y in mask:
        if (x, y - 1) not in mask and lo <= x <= hi:
            px[(x, y)] = role


def _belly(px, mask, lo, hi, role="b"):
    for x, y in mask:
        if (x, y + 1) not in mask and lo <= x <= hi:
            px[(x, y)] = role


# ------------------------------------------------------------------- equines
# Every measurement is in native pixels on that species' own canvas. The horse
# is deliberately stocky -- a short thick neck and a big head on a 40px canvas
# read as a horse where a correctly-proportioned one reads as a deer.
EQUINE = {
    "horse": dict(
        ground=33, barrel=(7, 13, 27, 24), chest=(16, 12, 30, 24),
        hip_h=(11, 22), hip_f=(26, 22), thick=2, hoof="b", sock=True,
        neck_low=((18, 14), (29, 19)), throat=(3, 6), crest=(-2, 1), poll=(30, 4), head=7,
        tail_root=(8, 14), tail_tip=(3, 27), belly=(13, 27), top=(11, 27),
        amp=3.4, lift=3.0, run_amp=6.0, run_lift=5.0, graze_drop=20,
        cx=20, chest_f=(12, 12, 28, 23), leg_f=(16, 23), leg_b=(14, 25),
        elbow=23, neck_f=(17, 7, 23, 14), head_f=(15, 0, 25, 8), muzzle_f=(18, 4, 22, 10),
        ear_f=((15, 0), (23, 0)), eye_f=((17, 4), (23, 4)), tail_n=(19, 14, 19, 26),
    ),
    "foal": dict(
        ground=22, barrel=(4, 6, 15, 13), chest=(10, 5, 17, 13),
        hip_h=(7, 12), hip_f=(16, 12), thick=1, hoof="a", sock=False,
        neck_low=((11, 7), (16, 10)), throat=(2, 4), crest=(-1, 1), poll=(16, 1), head=5,
        tail_root=(5, 7), tail_tip=(4, 15), belly=(8, 15), top=(6, 15),
        amp=2.6, lift=2.6, run_amp=3.4, run_lift=4.0, graze_drop=14,
        cx=12, chest_f=(7, 6, 17, 13), leg_f=(9, 14), leg_b=(8, 15),
        elbow=13, neck_f=(10, 3, 14, 8), head_f=(8, 0, 16, 5), muzzle_f=(10, 2, 14, 6),
        ear_f=((8, 0), (14, 0)), eye_f=((10, 2), (14, 2)), tail_n=(11, 7, 11, 16),
    ),
}


def _leg(c, hip, foot, hind, near, thick=2, lift=0.0, hoof="b", sock=False):
    """Hip-knee-foot leg; front knees flex forward, hocks backward."""
    hx, hy = hip
    fx, fy = foot
    mx, my = (hx + fx) / 2, (hy + fy) / 2
    bend = (0.7 if thick == 1 else 1.4) + lift * 0.5
    kx = mx - bend if hind else mx + bend * 0.6
    seg = line((hx, hy), (kx, my), thick) | line((kx, my), (fx, fy), thick)
    role = "m" if near else "d"
    px = flat(seg, role)
    if near:
        for x, y in seg:
            if (x - 1, y) not in seg:
                px[(x, y)] = "l"
    for k in range(thick):
        px[(round(fx) + k, round(fy))] = hoof
        if sock:
            px[(round(fx) + k, round(fy) - 1)] = "b"
    c.paint(px)


def _equine_neck_head_side(c, species, base, poll, frame, state, chew, by):
    """One quad of neck from the shoulder to the poll, then the skull hung off it.

    Drawing neck and head together keeps them joined when the head drops to
    graze, which is where they came apart when they were placed separately.
    """
    p = EQUINE[species]
    (bx0, by0), (bx1, by1) = base
    px_, py_ = poll
    # Withers, point of the chest, throat, crest: wide at the shoulder and
    # tapering, so the chest runs into the neck instead of curving in under it.
    (tx, ty), (kx, ky) = p["throat"], p["crest"]
    neck = polygon([(bx0, by0 + by), (bx1, by1 + by), (px_ + tx, py_ + ty), (px_ + kx, py_ + ky)])
    npx = shade(neck, 1, 1)
    # Flat where the neck lies over the shoulder, or the two rims draw a seam
    # across the chest.
    npx = {xy: "m" if xy in c.px else role for xy, role in npx.items()}
    c.paint(npx)
    # crest: the mane sits on the upper-forward edge of that quad
    crest = line((bx0 + 1, by0 + by), (px_ + kx, py_ + ky), 2) | line((px_ + kx, py_ + ky - 1), (px_ + 2, py_ + 1), 2)
    c.paint(flat(crest & neck, "a"))
    _equine_head_side(c, species, px_, py_, frame, state, chew)


def _equine_head_side(c, species, x, y, frame, state, chew):
    """Horse head anchored at (x, y) = the poll. Cheek above, nose down-forward."""
    p = EQUINE[species]
    n = p["head"]
    cheek = ellipse((x - 2, y, x + 4, y + 6))
    muzzle = polygon([(x + 2, y + 2), (x + n + 1, y + n - 1), (x + n - 1, y + n + 2), (x, y + 6)])
    head = cheek | muzzle
    px = shade(head, 1, 1)
    # blaze: one pale line down the front of the face, and a soft nose
    for k in range(2, n + 1):
        px[(x + k, y + k - 1 + chew)] = "b"
    for hx, hy in muzzle:
        if hy >= y + n + 1 and hx >= x + n - 1:
            px[(hx, hy)] = "b"
    c.paint(px)
    c.dot(x + n, y + n + chew, "e")  # nostril
    blink = state in {"idle", "rest"} and frame == 6
    c.dot(x + 2, y + 2, "l")
    c.dot(x + 3, y + 3, "d" if blink else "e")
    c.paint(flat(polygon([(x - 2, y + 1), (x - 2, y - 1), (x, y + 1)]), "d"))  # far ear
    flick = state in {"idle", "rest", "graze"} and frame in (3, 4)
    ear = polygon([(x, y + 1), (x + (1 if flick else 0), y - 2), (x + 2, y + 1)])
    c.paint(flat(ear, "m"))


def _equine_side(species, state, frame):
    p = EQUINE[species]
    c = Canvas(species)
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = p["ground"]

    if running:
        bounce = round(1.8 * max(0.0, math.sin(2 * math.pi * (t + 0.15))))
    elif moving:
        bounce = round(0.6 * math.cos(4 * math.pi * t) + 0.4)
    else:
        bounce = 0
    by = -bounce
    # A gallop rocks: the forehand rises as the forelegs reach, the quarters as
    # the hind legs gather. A walk nods the head down onto each landing forefoot.
    rock = round(math.sin(2 * math.pi * (t + 0.1))) if running else 0
    by_f, by_h = by - rock, by + rock
    nod = 1 if moving and not running and math.cos(4 * math.pi * (t - 0.25)) > 0.3 else 0
    breath = 1 if state in {"idle", "graze"} and frame in (2, 3, 4) else 0

    if running:
        gait = lambda ph: walk_foot(ph, p["run_amp"], p["run_lift"], 0.4)
        phases = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}
    else:
        gait = lambda ph: walk_foot(ph, p["amp"], p["lift"], 0.62)
        phases = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}

    def draw_leg(key, hip, hind, near):
        dx, up = gait(t + phases[key]) if moving else (0.0, 0.0)
        ox = 0 if near else -3
        _leg(c, (hip[0] + ox, hip[1] + (by_h if hind else by_f)), (hip[0] + ox + dx + (1 if hind else 0), ground - up),
             hind, near, p["thick"], up, p["hoof"], p["sock"] and near)

    draw_leg("fh", p["hip_h"], True, False)
    draw_leg("ff", p["hip_f"], False, False)

    # tail: hung off the dock behind the barrel, swinging with the gait
    swing = round(1.5 * math.sin(2 * math.pi * t)) if moving else ([0, 0, 1, 2, 2, 1, 0, 0][frame] if state == "idle" else 0)
    tx, ty = p["tail_root"]
    ex, ey = p["tail_tip"]
    by = by_h
    if running:
        # streaming out behind, with a wave running down it
        span = ey - ty
        ex, ey = tx - round(span * 0.6), ty + round(span * 0.45) + round(1.5 * math.sin(2 * math.pi * t + 1))
        swing = 0
    tail = line((tx, ty + by), (ex - swing, ey + by), 3) | line((tx - 1, ty + 1 + by), (ex - swing + 1, ey - 4 + by), 2)
    c.paint(flat(tail, "a"))
    c.paint({(x, y): "d" for x, y in tail if (x + 1, y) not in tail})
    c.paint({(x, y): "d" for x, y in tail if (x - 1, y) not in tail})

    body = ellipse((p["barrel"][0], p["barrel"][1] + by_h, p["barrel"][2], p["barrel"][3] + by_h + breath))
    body |= ellipse((p["chest"][0], p["chest"][1] + by_f, p["chest"][2], p["chest"][3] + by_f))
    by = by_f
    px = shade(body, top=1, bottom=2)
    _belly(px, body, p["belly"][0], p["belly"][1], "d")
    _top_light(px, body, p["top"][0], p["top"][1])
    c.paint(px)

    # grazing drops the poll along an arc towards the grass
    if state == "graze":
        stage = [0, 1, 2, 2, 2, 2, 1, 0][frame]
        chew = 1 if frame in (3, 5) else 0
    else:
        stage, chew = 0, 0
    px_, py_ = p["poll"]
    drop = p["graze_drop"] * stage / 2
    poll = (round(px_ - drop * 0.05), round(py_ + drop) + by)
    if running:
        # the neck pumps: out and down as the forelegs land, back as they fold
        pump = math.sin(2 * math.pi * (t + 0.35))
        poll = (poll[0] + round(1.4 * pump), poll[1] + 2 + round(1.2 * pump))
    elif moving:
        poll = (poll[0] + nod, poll[1] + nod)
    elif state == "idle":
        poll = (poll[0], poll[1] + [0, 0, 1, 1, 1, 1, 0, 0][frame])
    base = ((p["neck_low"][0][0], p["neck_low"][0][1]), (p["neck_low"][1][0], p["neck_low"][1][1]))
    _equine_neck_head_side(c, species, base, poll, frame, state, chew, by)

    draw_leg("nh", p["hip_h"], True, True)
    draw_leg("nf", p["hip_f"], False, True)
    return c.finish()


def _equine_face(species, state, frame, facing):
    """South is head-on, north is the rump with the ears just clearing it."""
    p = EQUINE[species]
    c = Canvas(species)
    t = frame / 8
    moving = state in {"wander", "flee"}
    running = state == "flee"
    ground = p["ground"]
    south = facing == "south"

    if running:
        bounce = round(1.8 * max(0.0, math.sin(2 * math.pi * (t + 0.15))))
    elif moving:
        bounce = round(0.6 * math.cos(4 * math.pi * t) + 0.4)
    else:
        bounce = 0
    by = -bounce
    # head-on, a walking leg reads as lift plus a little sideways swing
    amp = 1.2 if not running else 2.0
    lift = p["lift"] * (0.8 if not running else 1.1)
    phases = (0.0, 0.5) if not running else (0.0, 0.12)

    def pair(xs, near, ph_a, ph_b):
        for i, lx in enumerate(xs):
            ph = ph_a if i == 0 else ph_b
            dx, up = walk_foot(t + ph, amp, lift, 0.6) if moving else (0.0, 0.0)
            _leg(c, (lx, p["elbow"] + by), (lx + dx * 0.5, ground - up),
                 not south, near, p["thick"], up, p["hoof"], p["sock"] and near)

    pair(p["leg_b"], False, phases[1], phases[0])

    x0, y0, x1, y1 = p["chest_f"]
    body = ellipse((x0, y0 + by, x1, y1 + by))
    px = shade(body, 1, 2)
    _belly(px, body, x0 + 2, x1 - 2, "d")
    _top_light(px, body, x0 + 2, x1 - 2)
    # the barrel is round, so the centre column keeps the light
    for x, y in body:
        if abs(x - p["cx"]) <= 1 and y0 + 2 + by <= y <= y1 - 3 + by:
            px[(x, y)] = "l"
    c.paint(px)

    if south:
        _equine_head_front(c, species, state, frame, by, running)
    else:
        tx0, ty0, tx1, ty1 = p["tail_n"]
        sway = round(1.4 * math.sin(2 * math.pi * t)) if moving else (1 if state == "idle" and frame in (3, 4) else 0)
        tail = line((tx0, ty0 + by), (tx1 + sway, ty1 + by), 3) | line((tx0, ty0 + by), (tx1 + sway, ty1 - 4 + by), 2)
        c.paint(flat(tail, "a"))
        c.paint({(x, y): "d" for x, y in tail if (x - 1, y) not in tail})
        c.paint({(x, y): "l" for x, y in tail if (x + 1, y) not in tail and y < ty1 - 5 + by})
        crown = y0 - 1 + by
        for cx in (p["cx"] - 3, p["cx"] + 2):
            c.paint(flat(polygon([(cx - 1, crown), (cx, crown - 3), (cx + 1, crown)]), "d"))
    pair(p["leg_f"], True, phases[0], phases[1])
    return c.finish()


def _equine_head_front(c, species, state, frame, by, running):
    p = EQUINE[species]
    hx0, hy0, hx1, hy1 = p["head_f"]
    nx0, ny0, nx1, ny1 = p["neck_f"]
    drop = 0
    if state == "graze":
        drop = [0, 2, 4, 5, 5, 4, 2, 0][frame]
    elif running:
        drop = -1
    elif state == "wander":
        drop = [0, 1, 1, 0, 0, 1, 1, 0][frame]
    dy = by + drop

    # Flares into the shoulders; a straight column sat on the chest like a post.
    flare = max(1, (nx1 - nx0) // 2)
    neck = polygon([(nx0, ny0 + dy), (nx1, ny0 + dy), (nx1 + flare, ny1 + 2 + by), (nx0 - flare, ny1 + 2 + by)])
    npx = shade(neck, 1, 0)
    for x, y in neck:
        if (x - 1, y) not in neck or (x + 1, y) not in neck:
            npx[(x, y)] = "d"
    c.paint(npx)
    c.paint(flat(rect((p["cx"] - 1, ny0 + dy, p["cx"], ny0 + dy + 3)), "a"))

    head = ellipse((hx0 + 1, hy0 + dy, hx1 - 1, hy1 + dy))
    mx0, my0, mx1, my1 = p["muzzle_f"]
    muzzle = ellipse((mx0, my0 + dy, mx1, my1 + dy))
    px = shade(head | muzzle, 1, 1)
    for x, y in muzzle:
        px[(x, y)] = "d" if y >= my1 - 1 + dy else "m"
    c.paint(px)
    cx = p["cx"]
    for y in range(hy0 + 1 + dy, my1 + dy):
        c.dot(cx - 1, y, "b")
    c.dot(mx0 + 1, my1 - 1 + dy, "e")
    c.dot(mx1 - 1, my1 - 1 + dy, "e")

    blink = state in {"idle", "rest"} and frame == 6
    for ex, ey in p["eye_f"]:
        c.dot(ex, ey + dy - 1, "l")
        c.dot(ex, ey + dy, "d" if blink else "e")
    flick = state in {"idle", "rest"} and frame in (3, 4)
    for i, (ex, ey) in enumerate(p["ear_f"]):
        tilt = (-1 if i == 0 else 1) if flick else 0
        c.paint(flat(polygon([(ex, ey + 4 + dy), (ex + 1 + tilt, ey + dy), (ex + 2, ey + 4 + dy)]), "m"))
        c.dot(ex + 1, ey + 2 + dy, "a")
        c.dot(ex + 1, ey + 3 + dy, "d")


def _equine_rest(species, facing, frame):
    """Lying folded, legs tucked. Only the head moves."""
    p = EQUINE[species]
    c = Canvas(species)
    ground = p["ground"]
    dip = [0, 0, 0, 1, 1, 1, 0, 0][frame]
    if facing in {"east", "west"}:
        x0, y0, x1, y1 = p["barrel"]
        drop = ground - y1 - 2
        body = ellipse((x0, y0 + drop, x1, y1 + drop)) | ellipse((p["chest"][0], p["chest"][1] + drop, p["chest"][2], ground - 1))
        px = shade(body, 1, 2)
        _top_light(px, body, p["top"][0], p["top"][1])
        c.paint(px)
        knee = p["hip_f"][0]
        c.paint(shade(rect((knee - 2, ground - 2, knee + 5, ground)), 1, 1))
        c.paint(flat(rect((knee + 4, ground - 1, knee + 5, ground)), p["hoof"]))
        c.paint(flat(rect((p["hip_h"][0] - 2, ground - 1, p["hip_h"][0] + 2, ground)), "d"))
        tx, ty = p["tail_root"]
        c.paint(flat(line((tx, ty + drop), (tx - 3, ty + drop + 5), 2), "a"))
        px_, py_ = p["poll"]
        base = p["neck_low"]
        base = ((base[0][0], base[0][1] + drop), (base[1][0], base[1][1] + drop))
        _equine_neck_head_side(c, species, base, (px_ - 2, py_ + drop // 2 + dip), frame, "rest", 0, 0)
        return c.finish()

    south = facing == "south"
    x0, y0, x1, y1 = p["chest_f"]
    drop = ground - y1 - 1
    body = ellipse((x0 - 1, y0 + drop + 2, x1 + 1, ground))
    px = shade(body, 1, 2)
    _top_light(px, body, x0 + 2, x1 - 2)
    c.paint(px)
    if south:
        _equine_head_front(c, species, "rest", frame, drop + 2 + dip, False)
    else:
        tx0, ty0, tx1, ty1 = p["tail_n"]
        c.paint(flat(line((tx0, ty0 + drop), (tx1, min(ty1 + drop, ground)), 3), "a"))
        crown = y0 + drop + dip + 1
        for cx in (p["cx"] - 3, p["cx"] + 2):
            c.paint(flat(polygon([(cx - 1, crown), (cx, crown - 3), (cx + 1, crown)]), "d"))
    return c.finish()


def equine(species, state, facing, frame):
    if state == "rest":
        return _equine_rest(species, facing, frame)
    if facing == "east":
        return _equine_side(species, state, frame)
    if facing == "west":
        return mirror(_equine_side(species, state, frame))
    return _equine_face(species, state, frame, facing)


# ------------------------------------------------------------------- rabbits
LEPORID = {
    "rabbit": dict(
        ground=14, haunch=(1, 5, 9, 13), chest=(6, 8, 12, 13), head=(8, 4, 13, 9),
        ear_x=(8, 11), ear_w=2, ear_h=5, eye=(11, 6), nose=(13, 8), tail=(1, 7), tail_r=2,
        fore_x=10, hind_x=2, foot_w=3,
        f_body=(3, 7, 12, 14), f_head=(5, 2, 10, 8), f_ear=(5, 9), f_ear_h=3,
        f_eye=((6, 5), (9, 5)), f_nose=(7, 7), f_paw=(5, 10), n_rump=(3, 6, 12, 14), n_tail=(7, 7),
        hop=4, arch=3,
    ),
    "rabbit-kit": dict(
        ground=8, haunch=(1, 3, 5, 8), chest=(3, 4, 7, 8), head=(4, 2, 7, 6),
        ear_x=(4, 6), ear_w=1, ear_h=3, eye=(6, 4), nose=(7, 5), tail=(1, 5), tail_r=1,
        fore_x=5, hind_x=2, foot_w=2,
        f_body=(2, 4, 7, 8), f_head=(2, 1, 7, 5), f_ear=(3, 6), f_ear_h=2,
        f_eye=((3, 3), (6, 3)), f_nose=(4, 4), f_paw=(3, 6), n_rump=(1, 3, 8, 8), n_tail=(4, 4),
        hop=2, arch=2,
    ),
}


def _hop(state, frame, p):
    """Crouch, launch, stretch, land. Returns (body lift, stretch, ear lay-back)."""
    if state not in {"wander", "flee"}:
        return 0, 0, 0
    fast = state == "flee"
    h = p["hop"] + (1 if fast else 0)
    curve = [0, 0, 1, 2, 2, 1, 0, 0] if not fast else [0, 1, 2, 3, 3, 2, 1, 0]
    crouch = [1, 0, 0, 0, 0, 0, 0, 1]
    lift = round(h * curve[frame] / 3) - crouch[frame]
    stretch = [0, 1, 1, 1, 1, 1, 0, 0][frame] if fast else [0, 0, 1, 1, 1, 0, 0, 0][frame]
    lay = 1 if fast and 1 <= frame <= 5 else 0
    return lift, stretch, lay


def _ears_side(c, p, x_off, y_off, lay, flick):
    """Two upright ears; lay flattens them along the back when running."""
    for i, ex in enumerate(p["ear_x"]):
        h = p["ear_h"]
        tilt = (1 if i else -1) * flick
        if lay:
            tip = (ex - h + 1, y_off + 1)
        else:
            tip = (ex + tilt, y_off - h + 1)
        stalk = line((ex + x_off, y_off + 1), (tip[0] + x_off, tip[1]), p["ear_w"])
        c.paint(flat(stalk, "m" if i else "d"))
        if i and not lay:
            c.paint(flat({(tip[0] + x_off, tip[1] + 1)}, "a"))


def _leporid_side(species, state, frame):
    p = LEPORID[species]
    c = Canvas(species)
    ground = p["ground"]
    lift, stretch, lay = _hop(state, frame, p)
    moving = state in {"wander", "flee"}
    if state == "forage":
        nibble = [0, 1, 1, 0, 1, 1, 0, 0][frame]
        head_dy = min(2 + nibble, ground - p["head"][3] - 1)
    elif state == "rest":
        head_dy = 1
    else:
        head_dy = 0
        nibble = 0
    by = -lift

    hx0, hy0, hx1, hy1 = p["haunch"]
    cx0, cy0, cx1, cy1 = p["chest"]
    if state == "rest":
        by = 1  # a loaf: the body settles and the legs vanish under it
    haunch = ellipse((hx0, hy0 + by, hx1, min(hy1 + by, ground - 1)))
    chest = ellipse((cx0 + stretch, cy0 + by + (1 if state == "rest" else 0), cx1 + stretch, min(cy1 + by, ground - 1)))
    body = haunch | chest

    # feet: tucked when airborne, planted otherwise
    if state != "rest":
        airborne = lift > 0
        fw = p["foot_w"]
        hind = rect((p["hind_x"], ground - 1 + (0 if not airborne else -2), p["hind_x"] + fw, ground - (0 if not airborne else 2)))
        fore = rect((p["fore_x"] + stretch, ground - 1 + (0 if not airborne else -3), p["fore_x"] + stretch + 1, ground - (0 if not airborne else 3)))
        if moving and airborne:
            hind = shift(hind, -1, 0)
            fore = shift(fore, 1, 0)
        c.paint(flat(hind, "l"))
        c.paint(flat(fore, "d"))

    px = shade(body, 1, 2)
    _top_light(px, body, hx0 + 2, cx1 - 1)
    _belly(px, body, hx0 + 2, cx1 + stretch - 1, "l")
    # haunch ring: the big thigh muscle reads as one lighter arc
    for x, y in haunch:
        if (x - 1, y) not in haunch and y > hy0 + 1 + by:
            px[(x, y)] = "l"
    c.paint(px)
    r = p["tail_r"]
    c.paint(flat(rect((p["tail"][0], p["tail"][1] + by, p["tail"][0] + r - 1, p["tail"][1] + r + by)), "b"))

    ex0, ey0, ex1, ey1 = p["head"]
    head = ellipse((ex0 + stretch, ey0 + by + head_dy, ex1 + stretch, ey1 + by + head_dy))
    hpx = shade(head, 1, 1)
    c.paint(hpx)
    _ears_side(c, p, stretch, ey0 + by + head_dy, lay,
               1 if state == "idle" and frame in (3, 4) else 0)
    eyx, eyy = p["eye"]
    blink = state in {"idle", "rest"} and frame == 6
    c.dot(eyx + stretch, eyy + by + head_dy, "d" if blink else "e")
    nx, ny = p["nose"]
    twitch = 1 if state in {"idle", "forage"} and frame in (2, 5) else 0
    c.dot(nx + stretch, ny + by + head_dy - twitch, "a")
    return c.finish()


def _leporid_face(species, state, frame, facing):
    p = LEPORID[species]
    c = Canvas(species)
    ground = p["ground"]
    lift, _, lay = _hop(state, frame, p)
    by = -(lift // 2)
    south = facing == "south"
    if state == "rest":
        by = 1
    if state == "forage":
        by += [0, 1, 2, 2, 1, 2, 1, 0][frame]

    x0, y0, x1, y1 = p["f_body"] if south else p["n_rump"]
    body = ellipse((x0, y0 + by, x1, min(y1 + by, ground)))
    px = shade(body, 1, 2)
    _top_light(px, body, x0 + 1, x1 - 1)
    cx = (x0 + x1) // 2
    for x, y in body:
        if abs(x - cx) <= 0 and y > y0 + 2 + by:
            px[(x, y)] = "l"
    c.paint(px)

    if not south:
        tx, ty = p["n_tail"]
        r = p["tail_r"]
        c.paint(flat(rect((tx, ty + by, tx + r, ty + r - 1 + by)), "b"))
        # hind feet splay either side of the tail
        if state != "rest" and lift == 0:
            for fx in (x0 + 1, x1 - p["foot_w"]):
                c.paint(flat(rect((fx, ground - 1, fx + p["foot_w"] - 1, ground)), "d"))
        _ears_face(c, p, by, lay, state, frame, back=True)
        return c.finish()

    hx0, hy0, hx1, hy1 = p["f_head"]
    head = ellipse((hx0, hy0 + by, hx1, hy1 + by))
    hpx = shade(head, 1, 1)
    hcx = (hx0 + hx1) // 2
    for x, y in head:
        if abs(x - hcx) <= 1 and y >= hy1 - 2 + by:
            hpx[(x, y)] = "l"  # pale muzzle
    c.paint(hpx)
    _ears_face(c, p, by, lay, state, frame, back=False)
    blink = state in {"idle", "rest"} and frame == 6
    for ex, ey in p["f_eye"]:
        c.dot(ex, ey + by, "d" if blink else "e")
    nx, ny = p["f_nose"]
    twitch = 1 if state in {"idle", "forage"} and frame in (2, 5) else 0
    c.dot(nx, ny + by - twitch, "a")
    if state != "rest" and lift == 0:
        fx, fy = p["f_paw"]
        c.paint(flat(rect((fx, ground - 1, fx + 1, ground)), "l"))
        c.paint(flat(rect((x1 - (fx - x0) - 1, ground - 1, x1 - (fx - x0), ground)), "l"))
    return c.finish()


def _ears_face(c, p, by, lay, state, frame, back):
    lx, rx = p["f_ear"], p["f_ear"] if isinstance(p["f_ear"], int) else None
    a, b = p["f_ear"]
    h = p["f_ear_h"] + (2 if not back else 1)
    top = (p["f_head"][1] if not back else p["n_rump"][1]) + by
    flick = 1 if state == "idle" and frame in (3, 4) else 0
    for i, ex in enumerate((a, b)):
        tilt = (-1 if i == 0 else 1) * flick
        tip_y = top + 1 if lay else top - h
        stalk = rect((ex + tilt, tip_y, ex + tilt + 1, top + 1))
        c.paint(flat(stalk, "m" if not back else "d"))
        if not back and not lay:
            c.dot(ex + tilt, tip_y + 1, "a")


def leporid(species, state, facing, frame):
    if facing == "east":
        return _leporid_side(species, state, frame)
    if facing == "west":
        return mirror(_leporid_side(species, state, frame))
    return _leporid_face(species, state, frame, facing)


def fauna_c():
    result = {}
    for species, states in STATES.items():
        draw = equine if species in EQUINE else leporid
        for state, count in states.items():
            for facing in DIRECTIONS:
                for frame in range(count):
                    result[f"faunac-{species}-{state}-{facing}-{frame}"] = draw(species, state, facing, frame)
    return result
