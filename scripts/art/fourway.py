"""Set B animals in four facings: the farmyard, and the wolf and deer.

East is set B's side drawing and west its mirror. South and north are drawn
here, end-on, on the same canvas and palette, so a hen walking at the player
shows her face and comb instead of turning sideways.
"""
import math
from art.fauna_b import (
    Canvas, ellipse, polygon, rect, line, shade, flat,
    PALETTES as B_PALETTES, STATES as B_STATES, NATIVE_SIZES as B_SIZES,
    sheep, goat, pig, chicken, wolf, deer,
)
from art.fauna_d import Stride, _by, _mirror

SPECIES = ("sheep", "goat", "pig", "chicken", "gray-wolf", "red-deer")
DIRECTIONS = ("south", "east", "north", "west")
PALETTES = {s: B_PALETTES[s] for s in SPECIES}
STATES = {s: B_STATES[s] for s in SPECIES}
NATIVE_SIZES = {s: B_SIZES[s] for s in SPECIES}
GROUND = {"sheep": 22, "goat": 22, "pig": 20, "chicken": 16, "gray-wolf": 23, "red-deer": 36}
STANDING_SIZES = {s: (NATIVE_SIZES[s][0], GROUND[s]) for s in SPECIES}
SIDE = {"sheep": sheep, "goat": goat, "pig": pig, "chicken": chicken, "gray-wolf": wolf, "red-deer": deer}


def end_legs(c, s, xs, top, ground, w, keys, role, hoof):
    """Legs seen end-on: a step is the hoof lifting and the leg tucking in."""
    mid = sum(xs) / 2
    for x, key in zip(xs, keys):
        up = round(s.foot(key)[1] * 0.8)
        x0 = round(x + (mid - x) * min(1, up / 3) * 0.25) - w // 2
        foot = ground - up
        px = {(x0 + k, y): role for y in range(top, foot) for k in range(w)}
        if role == "m":
            for y in range(top, foot):
                px[(x0, y)] = "l"
        for k in range(w):
            px[(x0 + k, foot)] = hoof
        c.paint(px)


def _stage(state, frame):
    """How far down the head is: grazing goes to the grass and back."""
    if state in ("graze", "forage"):
        return [0, 1, 2, 2, 2, 2, 1, 0][frame]
    return 0


def sheep_end(state, frame, south):
    c = Canvas("sheep")
    s = Stride(state, frame, walk=(2.0, 2.0, 0.62), run=(3.5, 3.5, 0.45))
    g, cx = GROUND["sheep"], 14
    rest = state == "rest"
    by = 3 if rest else _by(s)
    if not rest:
        end_legs(c, s, (11, 17), 16 + by, g, 2, ("fh", "ff") if south else ("ff", "fh"), "e", "e")
    fleece = ellipse((6, 8 + by, 22, 20 + by))
    for x in (7, 11, 15):
        fleece |= ellipse((x, 6 + by, x + 6, 12 + by))
    px = shade(fleece, 1, 2)
    for x, y in fleece:
        if (x, y - 1) not in fleece:
            px[(x, y)] = "h"
    c.paint(px)
    if not rest:
        end_legs(c, s, (10, 18), 17 + by, g, 2, ("nf", "nh") if south else ("nh", "nf"), "a", "e")
    flick = 1 if s.flick else 0
    if south:
        hy = 8 + by + 3 * _stage(state, frame) + s.nod
        for sgn in (-1, 1):
            c.paint(flat(polygon([(cx + sgn * 3, hy + 2), (cx + sgn * (6 + flick), hy + 1), (cx + sgn * 3, hy + 4)]), "b"))
        face = ellipse((cx - 3, hy, cx + 3, hy + 8))
        hp = shade(face, 1, 1, base="b", light="a", dark="a")
        for x, y in face:
            if y <= hy + 1:
                hp[(x, y)] = "l"
        c.paint(hp)
        for sgn in (-1, 1):
            c.dot(cx + sgn * 2, hy + 3, "a" if s.blink else "e")
        c.dot(cx, hy + 7, "e")
    else:
        if not _stage(state, frame):
            hy = 5 + by
            for sgn in (-1, 1):
                c.paint(flat(polygon([(cx + sgn * 2, hy + 2), (cx + sgn * (6 + flick), hy + 2), (cx + sgn * 2, hy + 4)]), "b"))
            c.paint(flat(ellipse((cx - 3, hy, cx + 3, hy + 4)), "l"))
        wag = 1 if state == "idle" and frame in (2, 4) else 0
        c.paint(flat(rect((cx - 1 + wag, 12 + by, cx + wag, 15 + by)), "d"))
    return c.finish()


def goat_end(state, frame, south):
    c = Canvas("goat")
    s = Stride(state, frame, walk=(2.2, 2.2, 0.6), run=(3.5, 3.5, 0.45))
    g, cx = GROUND["goat"], 14
    rest = state == "rest"
    by = 4 if rest else _by(s)
    if not rest:
        end_legs(c, s, (11, 17), 14 + by, g, 2, ("fh", "ff") if south else ("ff", "fh"), "d", "b")
    body = ellipse((8, 8 + by, 20, 18 + by))
    c.paint(shade(body, 1, 2))
    if not rest:
        end_legs(c, s, (10, 18), 15 + by, g, 2, ("nf", "nh") if south else ("nh", "nf"), "m", "b")
    flick = 1 if s.flick else 0
    if south:
        stage = _stage(state, frame)
        hy = 4 + by + 4 * stage + s.nod
        chew = 1 if state == "graze" and frame in (3, 5) else 0
        for sgn in (-1, 1):
            c.paint(flat(line((cx + sgn * 2, hy + 1), (cx + sgn * 3, hy - 3), 1) | line((cx + sgn * 3, hy - 3), (cx + sgn * 5, hy - 4), 1), "a"))
            c.paint(flat(polygon([(cx + sgn * 2, hy + 2), (cx + sgn * (6 + flick), hy + 3), (cx + sgn * 2, hy + 4)]), "b"))
        head = ellipse((cx - 3, hy, cx + 3, hy + 5)) | polygon([(cx - 2, hy + 4), (cx + 2, hy + 4), (cx + 1, hy + 8 + chew), (cx - 1, hy + 8 + chew)])
        c.paint(shade(head, 1, 1))
        c.paint(flat(rect((cx - 1, hy + 6, cx + 1, hy + 7 + chew)), "h"))
        if not stage:
            c.paint(flat(rect((cx, hy + 9 + chew, cx, hy + 10 + chew)), "b"))
        for sgn in (-1, 1):
            c.dot(cx + sgn * 2, hy + 2, "d" if s.blink else "e")
    else:
        if not _stage(state, frame):
            hy = 3 + by
            for sgn in (-1, 1):
                c.paint(flat(line((cx + sgn * 2, hy + 1), (cx + sgn * 3, hy - 3), 1) | line((cx + sgn * 3, hy - 3), (cx + sgn * 5, hy - 4), 1), "a"))
                c.paint(flat(polygon([(cx + sgn * 2, hy + 2), (cx + sgn * (6 + flick), hy + 3), (cx + sgn * 2, hy + 4)]), "b"))
            c.paint(shade(ellipse((cx - 3, hy, cx + 3, hy + 5)), 1, 1))
            c.paint(shade(body, 1, 2))
        # the tail cocked up, the way a sheep's never is
        c.paint(flat(line((cx, 10 + by), (cx, 7 + by), 2), "d"))
    return c.finish()


def pig_end(state, frame, south):
    c = Canvas("pig")
    s = Stride(state, frame, walk=(1.6, 1.6, 0.62), run=(2.6, 2.6, 0.45))
    g, cx = GROUND["pig"], 15
    rest = state == "rest"
    by = 3 if rest else _by(s)
    if not rest:
        end_legs(c, s, (11, 19), 14 + by, g, 3, ("fh", "ff") if south else ("ff", "fh"), "d", "a")
    body = ellipse((6, 5 + by, 24, 17 + by))
    c.paint(shade(body, 1, 2))
    if not rest:
        end_legs(c, s, (10, 20), 15 + by, g, 3, ("nf", "nh") if south else ("nh", "nf"), "m", "a")
    flop = 1 if s.flick or (s.moving and s.frame % 4 in (1, 2)) else 0
    if south:
        stage = _stage(state, frame)
        root = 1 if state == "forage" and frame in (3, 5) else 0
        hy = 6 + by + 2 * stage + s.nod
        face = ellipse((cx - 5, hy, cx + 5, hy + 9))
        c.paint(shade(face, 1, 1))
        for sgn in (-1, 1):
            # ears flop forward over the eyes
            c.paint(flat(polygon([(cx + sgn * 2, hy), (cx + sgn * 6, hy - 1), (cx + sgn * 5, hy + 4 + flop)]), "d"))
            c.dot(cx + sgn * 2, hy + 4, "d" if s.blink else "e")
        snout = ellipse((cx - 2, hy + 5 + root, cx + 2, hy + 9 + root))
        c.paint(flat(snout, "b"))
        c.dot(cx - 1, hy + 7 + root, "e")
        c.dot(cx + 1, hy + 7 + root, "e")
    else:
        if not _stage(state, frame):
            for sgn in (-1, 1):
                c.paint(flat(polygon([(cx + sgn * 3, 5 + by), (cx + sgn * 7, 3 + by), (cx + sgn * 6, 7 + by)]), "d"))
            c.paint(shade(body, 1, 2))
        wag = 1 if (s.moving and frame % 2) or (state == "idle" and frame in (2, 4)) else 0
        for dx, dy in ((0, 9), (1, 8), (wag, 7), (-1 + wag, 6)):
            c.dot(cx + dx, dy + by, "d")
    return c.finish()


def chicken_end(state, frame, south):
    c = Canvas("chicken")
    s = Stride(state, frame, walk=(1.5, 2.0, 0.6), run=(2.5, 3.0, 0.5))
    g, cx = GROUND["chicken"], 9
    bob = round(0.5 * math.cos(4 * math.pi * s.t) + 0.5) if s.moving else 0
    by = -bob
    for x, key in ((cx - 2, "nh"), (cx + 2, "nf")):
        up = round(s.foot(key)[1]) if s.moving else 0
        if state == "forage" and frame == (0 if x < cx else 1):
            up = 1
        foot = g - up
        px = flat(line((x, 12 + by), (x, foot)), "a")
        for k in (-1, 0, 1):
            px[(x + k, foot)] = "a"
        c.paint(px)
    flap = s.running and frame % 2 == 0
    dip = [0, 0, 5, 9, 7, 9, 4, 0][frame] if state == "forage" else 0
    cock = 1 if state == "idle" and frame in (3, 4) else 0
    hy = 2 + by + (dip if south else 0)
    if not south and not dip:
        c.paint(shade(ellipse((cx - 2 + cock, hy, cx + 2 + cock, hy + 4)), 1, 1))
        for k, h in ((-1, 1), (0, 2), (1, 1)):
            c.dot(cx + k + cock, hy - h, "b")
    body = ellipse((cx - 5, 5 + by, cx + 5, 13 + by))
    px = shade(body, 1, 2)
    if south:
        for x, y in body:
            if abs(x - cx) <= 2 and 8 + by <= y <= 11 + by:
                px[(x, y)] = "l"
    c.paint(px)
    for sgn in (-1, 1):
        wing = polygon([(cx + sgn * 4, 7 + by), (cx + sgn * (9 if flap else 6), (4 if flap else 9) + by), (cx + sgn * 5, 12 + by)])
        c.paint(shade(wing, 1, 1, base="d", light="m", dark="o"))
    if not south:
        # seen from behind, the tail fan is what she is
        tail = polygon([(cx - 4, 10 + by), (cx - 3, 3 + by + bob), (cx, 2 + by + bob), (cx + 3, 3 + by + bob), (cx + 4, 10 + by)])
        c.paint(shade(tail, 1, 1, base="d", light="m", dark="o"))
    if south:
        head = ellipse((cx - 2 + cock, hy, cx + 2 + cock, hy + 4))
        c.paint(shade(head, 1, 1))
        for k, h in ((-1, 1), (0, 2), (1, 1)):
            c.dot(cx + k + cock, hy - h, "b")
        if south:
            c.dot(cx + cock, hy + 2, "a")
            c.dot(cx + cock, hy + 3, "a")
            c.dot(cx + cock, hy + 4, "b")
            blink = state == "idle" and frame == 6
            for sgn in (-1, 1):
                c.dot(cx + sgn * 2 + cock, hy + 1, "d" if blink else "e")
    return c.finish()


def wolf_end(state, frame, south):
    c = Canvas("gray-wolf")
    run = state == "chase"
    s = Stride("flee" if run else "wander" if state == "stalk" else state, frame, walk=(3.0, 2.5, 0.62), run=(5.0, 4.5, 0.4))
    g, cx = GROUND["gray-wolf"], 19
    rest = state == "rest"
    low = 2 if state == "stalk" else 0
    by = 9 if rest else _by(s) + low
    if not rest:
        end_legs(c, s, (16, 22), 12 + by, g, 2, ("fh", "ff") if south else ("ff", "fh"), "d", "o")
    body = ellipse((13, 6 + by, 25, 16 + by))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) in body and (x, y - 2) not in body:
            px[(x, y)] = "d"  # saddle
        if south and abs(x - cx) <= 2 and y >= 10 + by:
            px[(x, y)] = "b"
    c.paint(px)
    if not rest:
        end_legs(c, s, (15, 23), 13 + by, g, 2, ("nf", "nh") if south else ("nh", "nf"), "m", "o")
    else:  # forepaws out in front
        for x in (14, 21):
            c.paint(shade(rect((x, g - 2, x + 3, g - 1)), 1, 1))
    flick = 1 if state == "idle" and frame in (3, 4) else 0
    down = 6 if state == "dig" else 0
    if south:
        hy = (2 if not low else 5) + by + down + (1 if s.nod else 0)
        for sgn in (-1, 1):
            c.paint(flat(polygon([(cx + sgn * 1, hy + 1), (cx + sgn * (4 + flick), hy - 4), (cx + sgn * 5, hy + 2)]), "m"))
            c.dot(cx + sgn * 4, hy - 1, "d")
        head = ellipse((cx - 4, hy, cx + 4, hy + 6))
        hp = shade(head, 1, 1)
        for x, y in head:
            if y >= hy + 4:
                hp[(x, y)] = "b"  # pale cheeks and jaw
        c.paint(hp)
        c.paint(shade(ellipse((cx - 2, hy + 3, cx + 2, hy + 8)), 1, 1, base="l", light="h", dark="m"))
        c.dot(cx, hy + 5, "e")
        if run and frame % 2:
            c.dot(cx, hy + 8, "a")  # tongue
        for sgn in (-1, 1):
            c.dot(cx + sgn * 2, hy + 2, "d" if state == "idle" and frame == 6 else "a")
    else:
        if not down:
            hy = (1 if not low else 4) + by
            for sgn in (-1, 1):
                c.paint(flat(polygon([(cx + sgn * 1, hy + 2), (cx + sgn * (4 + flick), hy - 3), (cx + sgn * 5, hy + 3)]), "m"))
            c.paint(shade(ellipse((cx - 4, hy, cx + 4, hy + 6)), 1, 1))
            c.paint(px)
        if run:
            sway, length = round(2 * math.sin(2 * math.pi * s.t)), 4
        elif state == "dig":
            sway, length = [0, 1, 2, 1, 0, -1, -2, -1][frame], 7
        else:
            sway, length = (s.sway(1) if s.moving else 0), (9 if not low else 10)
        tip = (cx + sway, 9 + by + length)
        tail = line((cx, 9 + by), tip, 3) | ellipse((tip[0] - 2, tip[1] - 3, tip[0] + 2, tip[1] + 1))
        tp = shade(tail, 1, 1)
        tp[(tip[0], tip[1] + 1)] = "e"
        c.paint(tp)
    return c.finish()


def deer_end(state, frame, south):
    c = Canvas("red-deer")
    s = Stride(state, frame, walk=(3.0, 3.0, 0.62), run=(5.5, 5.5, 0.4), bounce=1.6)
    g, cx = GROUND["red-deer"], 20
    rest = state == "rest"
    by = 10 if rest else _by(s)
    if not rest:
        end_legs(c, s, (17, 23), 22 + by, g, 2, ("fh", "ff") if south else ("ff", "fh"), "d", "a")
    body = ellipse((13, 14 + by, 27, 27 + by))
    px = shade(body, 1, 2)
    for x, y in body:
        if (x, y - 1) not in body and abs(x - cx) <= 3:
            px[(x, y)] = "h"
    c.paint(px)
    if not rest:
        end_legs(c, s, (16, 24), 23 + by, g, 2, ("nf", "nh") if south else ("nh", "nf"), "m", "a")
    else:
        for x in (14, 22):
            c.paint(shade(rect((x, g - 3, x + 4, g - 1)), 1, 1))
    flick = 1 if frame in (3, 4) and not s.running else 0
    stage = _stage(state, frame)
    if south:
        hy = 6 + by + 6 * stage + s.nod
        neck = rect((cx - 2, hy + 6, cx + 2, 18 + by))
        c.paint(shade(neck, 0, 0))
        for sgn in (-1, 1):
            ear = polygon([(cx + sgn * 2, hy + 2), (cx + sgn * (7 + flick), hy - 1), (cx + sgn * 6, hy + 3)])
            c.paint(flat(ear, "m"))
            c.dot(cx + sgn * 5, hy + 1, "b")
        head = ellipse((cx - 3, hy, cx + 3, hy + 6)) | polygon([(cx - 2, hy + 5), (cx + 2, hy + 5), (cx + 1, hy + 10), (cx - 1, hy + 10)])
        c.paint(shade(head, 1, 1))
        c.paint(flat(rect((cx - 1, hy + 9, cx + 1, hy + 10)), "a"))
        for sgn in (-1, 1):
            c.dot(cx + sgn * 2, hy + 3, "d" if frame == 6 and state == "idle" else "e")
    else:
        if not stage:
            hy = 5 + by
            c.paint(shade(rect((cx - 2, hy + 5, cx + 2, 16 + by)), 1, 0))
            for sgn in (-1, 1):
                c.paint(flat(polygon([(cx + sgn * 2, hy + 3), (cx + sgn * (7 + flick), hy), (cx + sgn * 6, hy + 4)]), "d"))
            c.paint(shade(ellipse((cx - 3, hy, cx + 3, hy + 6)), 1, 1))
            c.paint(px)
        # the pale rump patch, and the tail that flags it when she runs
        c.paint(flat(ellipse((cx - 4, 15 + by, cx + 4, 23 + by)), "b"))
        up = s.running or (state == "idle" and frame in (5, 6))
        c.paint(flat(rect((cx - 1, (14 if up else 16) + by, cx + 1, (17 if up else 20) + by)), "b" if up else "m"))
    return c.finish()


END = {"sheep": sheep_end, "goat": goat_end, "pig": pig_end, "chicken": chicken_end, "gray-wolf": wolf_end, "red-deer": deer_end}


def draw(species, state, facing, frame):
    if facing == "east":
        return SIDE[species](state, frame)
    if facing == "west":
        return _mirror(SIDE[species](state, frame))
    return END[species](state, frame, facing == "south")


def fauna_fourway():
    return {
        f"faunac-{species}-{state}-{facing}-{frame}": draw(species, state, facing, frame)
        for species in SPECIES
        for state, count in STATES[species].items()
        for facing in DIRECTIONS
        for frame in range(count)
    }
