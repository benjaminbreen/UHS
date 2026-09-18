"""Large rollable boulders: one stone per sprite, in the regional stone
colours the loose rocks already use. Bigger than a tile, so they read as
something you lean on rather than something you step over."""
import math
from PIL import Image, ImageDraw
from art.rocks import SAND, RED, BASALT, MOSSY, SLAB, LICHEN

KINDS = {
    'dune': SAND,
    'red': RED,
    'basalt': BASALT,
    'mossy': MOSSY,
    'slab': SLAB,
    'lichen': LICHEN,
}
# Radial profiles in twelfths of a turn, starting east and going clockwise.
# Rounded rolls, blocky has corners, split has a bite out of one shoulder.
PROFILES = {
    'rounded': [1.0, .97, .93, .99, .96, .93, .98, 1.0, .96, .93, .97, 1.0],
    'blocky': [1.0, .80, .95, 1.0, .79, .93, 1.0, .82, .96, .99, .81, .94],
    # Heavier on one shoulder and cut away on the other: a stone that has come
    # off a face, rather than one worn round by a river.
    'wedge': [1.0, .99, .90, .82, .78, .82, .92, 1.0, 1.0, .97, .96, .99],
}
# Which profile each kind's three variants use, and how big each one is.
FORMS = {
    'dune': [('rounded', 14), ('wedge', 12), ('rounded', 10)],
    'red': [('blocky', 14), ('rounded', 12), ('wedge', 10)],
    'basalt': [('blocky', 14), ('wedge', 12), ('blocky', 10)],
    'mossy': [('rounded', 14), ('rounded', 12), ('wedge', 10)],
    'slab': [('wedge', 14), ('blocky', 13), ('blocky', 10)],
    'lichen': [('rounded', 13), ('wedge', 12), ('rounded', 10)],
}


def _rgb(c):
    return (int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16))


def hull(cx, cy, r, profile, squash=.70):
    """The silhouette, as a closed polygon of integer pixels."""
    points = []
    for i, k in enumerate(profile):
        a = i / len(profile) * math.tau
        points.append((cx + math.cos(a) * r * k,
                       cy + math.sin(a) * r * k * squash))
    # Resample the twelve corners into a smooth rim: straight chords between
    # them read as a cut gem rather than a stone.
    smooth = []
    n = len(points)
    for i in range(n):
        for t in (0, .34, .67):
            p, q = points[i], points[(i + 1) % n]
            prev, nxt = points[i - 1], points[(i + 2) % n]
            # Catmull-Rom through the four neighbours.
            smooth.append(tuple(
                round(.5 * ((2 * p[d]) + (-prev[d] + q[d]) * t +
                            (2 * prev[d] - 5 * p[d] + 4 * q[d] - nxt[d]) * t * t +
                            (-prev[d] + 3 * p[d] - 3 * q[d] + nxt[d]) * t ** 3))
                for d in (0, 1)))
    return smooth


def shrink(poly, cx, cy, by):
    return [(round(x + (cx - x) * by), round(y + (cy - y) * by)) for x, y in poly]


def boulder(kind, variant):
    profile_name, r = FORMS[kind][variant]
    outline, side, body, top, light = KINDS[kind]
    profile = PROFILES[profile_name]
    w, h = r * 2 + 8, round(r * 2 * .70) + 9
    im = Image.new('RGBA', (w, h))
    d = ImageDraw.Draw(im)
    cx, cy = w / 2, h / 2 - 1
    shape = hull(cx, cy, r, profile)
    d.polygon(shape, fill=outline)
    # Everything inside starts in shade; the light is added as facets on top,
    # so the break between plane and side is one hard pixel, not a gradient.
    d.polygon(shrink(shape, cx, cy, .11), fill=side)
    lift = lambda by, dx, dy: [
        (round(x - r * dx), round(y - r * dy))
        for x, y in shrink(shape, cx, cy, by)]
    plane = lift(.30, .07, .17)
    d.polygon(plane, fill=body)
    crown = lift(.58, .10, .25)
    d.polygon(crown, fill=top)
    # One lit edge along the north-west rim of the crown, not a rim all round.
    rim = [p for p in crown if p[1] <= min(q[1] for q in crown) + max(1, r // 4)]
    if len(rim) >= 2:
        d.line(sorted(rim), fill=light, width=1)
    # One crack, off the plane's rim and down the shaded side. Two read as
    # damage; one reads as stone.
    x0, y0 = cx + r * .30, cy - r * .10
    d.line([(round(x0), round(y0)),
            (round(x0 + r * .20), round(y0 + r * .30)),
            (round(x0 + r * .12), round(y0 + r * .52))], fill=outline)
    # Grain, only where the stone is already in shade, so the lit planes stay
    # clean. Fixed by position: the same stone is the same stone every time.
    for i in range(5):
        a = (i * 2.39 + variant * .7) % math.tau
        rad = r * (.42 + .06 * (i % 3))
        px, py = round(cx + math.cos(a) * rad), round(cy + math.sin(a) * rad * .70)
        if 0 <= px < w and 0 <= py < h and im.getpixel((px, py))[:3] == _rgb(side):
            d.point((px, py), fill=outline if i % 2 else body)
    if kind == 'mossy':
        for a in (2.4, 3.6, 4.7):
            px, py = round(cx + math.cos(a) * r * .5), round(cy + math.sin(a) * r * .5 * .70)
            if im.getpixel((px, py))[3]:
                d.rectangle((px, py, px + 1, py), fill='#5d8a45')
                d.point((px, py - 1), fill='#86ad55')
    if kind == 'lichen':
        for a in (1.2, 2.9, 4.9):
            px, py = round(cx + math.cos(a) * r * .55), round(cy + math.sin(a) * r * .55 * .70)
            if im.getpixel((px, py))[3]:
                d.point((px, py), fill='#c8b45a')
                d.point((px + 1, py + 1), fill='#b09a3f')
    return im


def boulders():
    return {
        f'nature-boulder-{kind}-{variant}': boulder(kind, variant)
        for kind in KINDS
        for variant in range(3)
    }
