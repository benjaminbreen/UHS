"""Weathering for front-on buildings: a pass over a finished painter's
regions, so age and neglect are one dial (`wear`, 0 to 1) rather than
something each painter fakes.

The painter reports where things are: roof pixels (and which slope is in
shade), wall pixels, stone pixels near the ground, sills and chimney tops.
Everything is seeded, so a building weathers the same way every bake.
"""
import math

from art.front_materials import ramp, mix, h2

MOSS = ramp(118, 0.11, lift=-0.1)
LICHEN = [ramp(95, 0.12)[2], ramp(60, 0.13)[3], ramp(110, 0.07)[3]]
SOOT = (38, 30, 40, 255)


def weather(c, regions, wear=0.5, seed=0):
    if wear <= 0:
        return
    roof = regions.get('roof', set())
    shade = regions.get('roof_shade', set())
    if roof:
        moss(c, roof, shade, regions.get('eave_y'), wear, seed)
    for x, y, w in regions.get('sills', []):
        streaks(c, x, y, w, regions.get('walls', set()), wear, seed)
    for x, y, w in regions.get('chimneys', []):
        soot(c, x, y, w, roof, wear)
    stone = regions.get('stone', set())
    if stone:
        lichen(c, stone, wear, seed)


def moss(c, roof, shade, eave_y, wear, seed):
    """Cushions of moss on the roof: more on the shaded slope and low down,
    where the roof stays wet longest. Each cushion is lit on its top."""
    pts = sorted(roof)
    n = int(len(pts) / 110 * wear * wear)
    for k in range(n):
        x, y = pts[int(h2(k, seed, 401) * len(pts))]
        low = 1.0 if eave_y is None else max(0.2, min(1.0, 1 - (eave_y(x) - y) / 80))
        keep = (0.75 if (x, y) in shade else 0.4) * low
        if h2(k, seed, 402) > keep:
            continue
        size = 2 + int(h2(k, seed, 403) * 4 * (0.4 + wear))
        for i in range(size):
            for j in range(2):
                p = (x + i - size // 2, y + j)
                if p in roof and h2(p[0], p[1], 404) < 0.85:
                    c.p(*p, MOSS[3] if j else MOSS[2])
        for i in range(1, size - 1):
            p = (x + i - size // 2, y - 1)
            if p in roof:
                c.p(*p, MOSS[1])


def streaks(c, x, y, w, walls, wear, seed):
    """Grime running down from the ends of a sill: rain washes dirt off the
    stone and drags it down the wall below."""
    for sx in (x + 1, x + w - 2):
        length = int(4 + 9 * wear * (0.6 + 0.4 * h2(sx, y, 411)))
        for k in range(length):
            p = (sx, y + k)
            if p in walls:
                q = c.g(*p)
                c.p(*p, mix(q, (60, 48, 56, 255), 0.3 * wear * (1 - k / length)))


def soot(c, x, y, w, roof, wear):
    """Smoke blackens the top of a stack and the roof just beside it."""
    for yy in range(y - 2, y + 4):
        for xx in range(x - 1, x + w + 1):
            q = c.g(xx, yy)
            if q[3]:
                c.p(xx, yy, mix(q, SOOT, 0.35 * wear * (1 - (yy - y + 2) / 7)))


def lichen(c, stone, wear, seed):
    """Lichen on stone near the ground: small yellow-green and rust specks
    in clusters, never a wash."""
    pts = sorted(stone)
    n = int(len(pts) / 70 * wear)
    for k in range(n):
        x, y = pts[int(h2(k, seed, 421) * len(pts))]
        col = LICHEN[int(h2(k, seed, 422) * 3)]
        for dx, dy in ((0, 0), (1, 0), (0, 1))[: 1 + int(h2(k, seed, 423) * 3)]:
            if (x + dx, y + dy) in stone:
                c.p(x + dx, y + dy, col)
