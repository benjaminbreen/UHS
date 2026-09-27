from pathlib import Path
import math
import json
import sys

from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from art.oblique_style import STOREY, side_depth
from art.reference import current_adult

OUT = Path(__file__).resolve().parent
STONE = ['#655b50', '#8a7e6b', '#afa18a', '#c9bca3', '#e1d5b9', '#f1e6ce']
GREEN = ['#1c3435', '#2e4c4b', '#446766', '#678886', '#93b0a5', '#c0d0b9']
BRONZE = ['#38352c', '#635b3b', '#938051', '#bfa16b', '#dbc48c']
GLASS = ['#20363e', '#34545e', '#50747d', '#78979a', '#adbfbb']
CREAM = ['#6d7167', '#909285', '#b4b6a4', '#d1d1bd', '#e9e5cc']
BRICK = ['#4f3b32', '#725141', '#966b50', '#b18563', '#c99e77']
ROOF = ['#313b40', '#485359', '#657076', '#869093']
IRON = ['#24383b', '#41575a', '#718480', '#a9b9ac']
WARM = ['#916b3e', '#d8b879', '#f5ddb0']
COOL = ['#728c8b', '#bbd0c2', '#e8eed5']


def roll(x, y, seed=0):
    n = (x * 374761393 + y * 668265263 + seed * 2246822519) & 0xffffffff
    n = ((n ^ (n >> 13)) * 1274126177) & 0xffffffff
    return ((n ^ (n >> 16)) & 0xffff) / 65536


class Paint:
    def __init__(self, w, h):
        self.im = Image.new('RGBA', (w, h))
        self.em = Image.new('RGBA', (w, h))
        self.d = ImageDraw.Draw(self.im)
        self.e = ImageDraw.Draw(self.em)

    def rect(self, box, colour):
        x0, y0, x1, y1 = box
        if x1 >= x0 and y1 >= y0:
            self.d.rectangle(box, fill=colour)

    def line(self, points, colour, width=1):
        self.d.line(points, fill=colour, width=width)

    def px(self, x, y, colour):
        self.d.point((x, y), fill=colour)

    def poly(self, points, colour):
        self.d.polygon(points, fill=colour)

    def glow(self, box, ramp=WARM):
        x0, y0, x1, y1 = box
        self.e.rectangle(box, fill=ramp[1])
        self.e.rectangle((x0, y0, x1, min(y1, y0 + (y1 - y0) // 3)), fill=ramp[2])
        self.e.line((x0, y1, x1, y1), fill=ramp[0])

    def erase_glow(self, box):
        self.e.rectangle(box, fill=(0, 0, 0, 0))


def masonry(p, box, pal, seed=0, course=4, stretch=10):
    x0, y0, x1, y1 = box
    p.rect(box, pal[2])
    for y in range(y0, y1 + 1):
        row = y // course
        if y % course == course - 1:
            p.line((x0, y, x1, y), pal[1])
        else:
            for x in range(x0, x1 + 1):
                brick = (x + (row % 2) * (stretch // 2)) // stretch
                v = roll(brick, row, seed)
                if (x + (row % 2) * (stretch // 2)) % stretch == 0:
                    p.px(x, y, pal[1])
                elif v < .12:
                    p.px(x, y, pal[3])
                elif v > .93:
                    p.px(x, y, pal[1])


def glass(p, x, y, w, h, seed, lit=False, frame=IRON, curtains=False):
    p.rect((x - 1, y - 1, x + w, y + h), frame[0])
    p.rect((x, y, x + w - 1, y + h - 1), GLASS[1])
    p.rect((x, y, x + w - 1, y + h // 3), GLASS[2])
    p.line((x, y, x + w - 1, y), GLASS[3])
    # Reflections form one shape within the pane rather than isolated glints.
    if roll(x, y, seed) < .5:
        for k in range(min(h - 2, 7)):
            xx = x + 1 + k // 2
            if xx < x + w - 1:
                p.px(xx, y + 1 + k, GLASS[3])
    if lit:
        p.glow((x, y, x + w - 1, y + h - 1), COOL if seed % 4 == 0 else WARM)
    if curtains:
        for edge in (x, x + w - 3):
            p.rect((edge, y + 1, edge + 2, y + h - 2), CREAM[2])
            p.line((edge + 1, y + 1, edge + 1, y + h - 2), CREAM[3])
            if lit:
                p.e.rectangle((edge, y + 1, edge + 2, y + h - 2), fill='#c5b996')
    p.line((x + w // 2, y, x + w // 2, y + h - 1), frame[2])
    p.erase_glow((x + w // 2, y, x + w // 2, y + h - 1))
    p.line((x - 2, y + h + 1, x + w + 1, y + h + 1), frame[2])


def side(p, x, y, width, height, palette, windows=None):
    f = Paint(width, height)
    f.rect((0, 0, width - 1, height - 1), palette[1])
    f.line((0, 0, 0, height - 1), palette[0])
    f.line((width - 1, 0, width - 1, height - 1), palette[0])
    if windows:
        windows(f)
    for col in range(width):
        p.im.alpha_composite(f.im.crop((col, 0, col + 1, height)), (x + col, y - col - 1))
        p.em.alpha_composite(f.em.crop((col, 0, col + 1, height)), (x + col, y - col - 1))


def flat_roof(p, x, y, w, depth, palette=STONE, fill='#7a8076'):
    p.poly([(x, y), (x + w - 1, y), (x + w + depth - 1, y - depth), (x + depth, y - depth)], palette[3])
    p.poly([(x + 3, y - 2), (x + w - 3, y - 2), (x + w + depth - 4, y - depth + 3),
            (x + depth + 3, y - depth + 3)], fill)
    p.line((x, y, x + w - 1, y), palette[4])
    p.line((x + depth, y - depth, x + w + depth - 1, y - depth), palette[2])
    p.line((x + depth + 3, y - depth + 4, x + w + depth - 4, y - depth + 4), palette[0])
    p.line((x, y, x + depth, y - depth), palette[4])
    p.line((x + w - 1, y, x + w + depth - 1, y - depth), palette[1])


def box3(p, x, y, w, h, depth, pal):
    p.rect((x, y, x + w - 1, y + h - 1), pal[2])
    p.line((x, y, x, y + h - 1), pal[3])
    side(p, x + w, y, depth, h, pal)
    p.poly([(x, y - 1), (x + w - 1, y - 1), (x + w + depth - 1, y - depth - 1),
            (x + depth, y - depth - 1)], pal[3])


def deco(seed=0, large=False):
    W = 160 if large else 128
    D = side_depth(8)
    shaft_floors = 7 if large else 5
    H = 66 + shaft_floors * STOREY + 2 * STOREY + 28
    baseline = H + 34
    p = Paint(W + D + 2, baseline + 2)
    # Each tier has a real roof terrace and a separate shaded return.
    tiers = [(0, W, baseline - 66, 66, 2),
             (16, W - 32, baseline - 66 - shaft_floors * STOREY, shaft_floors * STOREY, shaft_floors),
             (32, W - 64, 62, 2 * STOREY, 2),
             (40, W - 80, 34, 28, 1)]
    for tier, (x, w, y, h, floors) in enumerate(tiers):
        p.rect((x, y, x + w - 1, y + h - 1), STONE[3])
        p.rect((x + 1, y + 1, x + w - 2, y + h - 3), STONE[3])
        def return_windows(f, tier=tier, floors=floors, h=h):
            for floor in range(floors):
                yy = 8 + floor * (STOREY if tier else 28)
                if yy + 16 >= h:
                    continue
                glass(f, 3, yy, 5, 15, seed + floor + tier, roll(tier, floor, seed) < .35)
                f.line((0, yy + 19, D - 1, yy + 19), STONE[1])
        side(p, x + w, y, D, h, STONE, return_windows)
        flat_roof(p, x, y - 1, w, D)
        p.rect((x, y + h - 4, x + w - 1, y + h - 3), STONE[2])
        p.line((x, y + h - 2, x + w - 1, y + h - 2), STONE[1])
        if tier == 0:
            # A tall lobby and the first office floor form the street podium.
            for bx in range(7, W - 9, 19):
                glass(p, bx, y + 7, 10, 16, seed + bx, roll(bx, 0, seed) < .4, frame=BRONZE)
                p.rect((bx - 2, y + 26, bx + 12, y + 30), GREEN[2])
                p.line((bx, y + 27, bx + 10, y + 27), GREEN[3])
            p.rect((0, y + 33, W - 1, y + 36), STONE[2])
            p.line((0, y + 33, W - 1, y + 33), STONE[5])
            middle = W // 2
            for bx in range(5, W - 17, 22):
                if abs(bx + 8 - middle) < 20:
                    continue
                glass(p, bx, y + 42, 16, 20, seed + bx, True, frame=BRONZE)
                p.rect((bx + 1, y + 61, bx + 15, y + 63), GREEN[1])
                p.erase_glow((bx + 1, y + 61, bx + 15, y + 63))
            entrance = middle - 9
            p.rect((entrance - 8, y + 39, entrance + 25, baseline - 1), GREEN[0])
            p.rect((entrance - 6, y + 39, entrance - 3, baseline - 1), STONE[4])
            p.rect((entrance + 21, y + 39, entrance + 24, baseline - 1), STONE[2])
            p.rect((entrance - 4, y + 39, entrance + 22, y + 43), BRONZE[2])
            p.line((entrance - 4, y + 39, entrance + 22, y + 39), BRONZE[4])
            glass(p, entrance + 2, baseline - 23, 14, 20, seed, True, frame=BRONZE)
            for dx in (7, 10):
                p.line((entrance + dx, baseline - 12, entrance + dx, baseline - 7), BRONZE[4])
                p.erase_glow((entrance + dx, baseline - 12, entrance + dx, baseline - 7))
            # A sunburst panel is confined to the entry, not every window bay.
            for dx, dy in [(-8, 0), (-5, -3), (0, -5), (5, -3), (8, 0)]:
                p.line((middle, y + 43, middle + dx, y + 40 + dy), BRONZE[3])
        else:
            bays = max(2, (w - 8) // 16)
            pitch = (w - 8) // bays
            for bay in range(bays):
                bx = x + 5 + bay * pitch
                for floor in range(floors):
                    yy = y + 6 + floor * STOREY
                    glass(p, bx, yy, pitch - 7, 16, seed + bay + floor,
                          roll(bay + tier * 8, floor, seed + 2) < .42, frame=BRONZE)
                    if floor < floors - 1:
                        p.rect((bx - 1, yy + 19, bx + pitch - 7, yy + 23), GREEN[2])
                        p.line((bx, yy + 19, bx + pitch - 8, yy + 19), GREEN[3])
                        ornament = bx + (pitch - 8) // 2
                        p.line((ornament - 2, yy + 20, ornament, yy + 22, ornament + 2, yy + 20), BRONZE[2])
                        p.px(ornament, yy + 20, GREEN[4])
                pier = bx - 4
                p.line((pier, y + 2, pier, y + h - 4), STONE[5])
                p.line((pier + 1, y + 2, pier + 1, y + h - 4), STONE[4])
                p.line((pier + 3, y + 2, pier + 3, y + h - 4), STONE[2])
            for xx in (x + 1, x + w - 4):
                p.rect((xx, y + 2, xx + 2, y + h - 4), STONE[4])
    # The small stepped crown is legible even with all texture removed.
    cx = W // 2
    for off, yy in [(12, 20), (8, 15), (4, 10)]:
        p.rect((cx - off, yy, cx + off, 33), STONE[4])
        p.line((cx - off, yy, cx + off, yy), STONE[5])
        p.line((cx + off, yy + 1, cx + off, 33), STONE[1])
    p.line((cx - 2, 10, cx - 2, 31), GREEN[2])
    p.line((cx + 2, 10, cx + 2, 31), GREEN[2])
    p.rect((0, baseline - 2, W - 1, baseline), GREEN[1])
    p.line((0, baseline - 2, W - 1, baseline - 2), GREEN[3])
    return p, [W // 16, 7], '10 storeys' if not large else '12 storeys'


def planter(p, x, y, seed):
    p.rect((x - 2, y, x + 2, y + 3), '#8b5d43')
    p.line((x - 2, y, x + 2, y), '#c19370')
    p.rect((x - 1, y - 3, x + 1, y - 1), '#49684c')
    p.px(x - 2, y - 2, '#66865a')
    p.px(x + 2, y - 3, '#819769')
    if seed % 3 == 0:
        p.px(x, y - 4, '#c28c76')


def apartment(seed=0, large=False):
    W = 192 if large else 160
    D = side_depth(7)
    floors = 6 if large else 5
    H = 38 + (floors - 1) * STOREY
    y0, foot = 30, H + 30
    p = Paint(W + D + 2, foot + 2)
    wall = CREAM if seed % 2 == 0 else ['#6e706b', '#96958a', '#bbb4a2', '#d6cbb5', '#eee1c7']
    p.rect((0, y0, W - 1, foot - 1), wall[3])
    mid = W // 2
    stair_w = 18
    sx = mid - stair_w // 2
    bays = 3
    left_w = sx - 6
    bw = (left_w - 6) // bays
    def returns(f):
        for n in range(floors):
            yy = 7 + n * STOREY
            glass(f, 3, yy, 5, 14, n + seed, roll(n, 9, seed) < .4)
            f.line((0, yy + 18, D - 1, yy + 18), wall[0])
    side(p, W, y0, D, H, wall, returns)
    # Brick end panels and a glazed circulation core divide the long slab.
    for x0 in (0, W - 5):
        masonry(p, (x0, y0 + 5, x0 + 4, foot - 2), BRICK, seed)
    p.rect((sx - 2, y0 + 4, sx + stair_w + 1, foot - 3), wall[1])
    p.rect((sx, y0 + 6, sx + stair_w - 1, foot - 28), GLASS[1])
    for n in range(floors):
        yy = y0 + 7 + n * STOREY
        p.rect((sx + 2, yy, sx + stair_w - 3, yy + 18), GLASS[2])
        p.line((sx + 2, yy, sx + stair_w - 3, yy), GLASS[3])
        p.glow((sx + 2, yy, sx + stair_w - 3, yy + 18), COOL)
        for i in range(6):
            p.line((sx + 3 + i, yy + 12 + i, sx + 8 + i, yy + 12 + i), IRON[1])
            p.erase_glow((sx + 3 + i, yy + 12 + i, sx + 8 + i, yy + 12 + i))
        p.line((sx + 7, yy, sx + 7, yy + 18), IRON[2])
        p.erase_glow((sx + 7, yy, sx + 7, yy + 18))
        p.rect((sx, yy + 20, sx + stair_w - 1, yy + 23), wall[2])
        p.erase_glow((sx, yy + 20, sx + stair_w - 1, yy + 23))
    for n in range(floors):
        yy = y0 + 7 + n * STOREY
        for half in range(2):
            for b in range(bays):
                x = 7 + b * bw if half == 0 else sx + stair_w + 6 + b * bw
                width = bw - 4
                lit = roll(b + half * 3, n, seed + 8) < .55
                # Deep balcony recess: shadow behind the room, pale projecting slab.
                p.rect((x - 1, yy - 1, x + width, yy + 19), wall[0])
                glass(p, x + 2, yy + 1, width - 5, 15, seed + b + n, lit, curtains=True)
                p.rect((x + 1, yy + 17, x + width - 1, yy + 20), '#5c645a')
                p.erase_glow((x + 1, yy + 17, x + width - 1, yy + 20))
                p.poly([(x - 2, yy + 20), (x + width + 1, yy + 20),
                        (x + width + 4, yy + 17), (x + 1, yy + 17)], wall[3])
                p.line((x - 2, yy + 21, x + width + 1, yy + 21), wall[1])
                p.line((x - 2, yy + 20, x + width + 1, yy + 20), wall[4])
                # Opaque lower balcony panels keep the rail from becoming a cage.
                p.rect((x - 1, yy + 13, x + width, yy + 18), GREEN[2])
                p.rect((x + 1, yy + 14, x + width - 2, yy + 17), GREEN[3] if (b + n) % 4 else '#8d927c')
                p.line((x - 1, yy + 12, x + width, yy + 12), IRON[2])
                p.line((x - 1, yy + 12, x - 1, yy + 19), IRON[1])
                p.line((x + width, yy + 12, x + width, yy + 19), IRON[0])
                p.erase_glow((x - 1, yy + 12, x + width, yy + 20))
                p.rect((x - 3, yy - 1, x - 2, yy + 20), wall[4])
                if roll(b + half * 3, n, seed + 11) < .22:
                    planter(p, x + width - 5, yy + 12, b + seed)
                if seed % 2 and n == 2 and b == 1 and half == 0:
                    p.rect((x + 4, yy + 11, x + 9, yy + 19), '#c3a997')
                    p.line((x + 5, yy + 11, x + 5, yy + 19), '#e0cabb')
    # The circulation core terminates at a lit entrance and a thin cantilever.
    p.rect((sx - 2, foot - 28, sx + stair_w + 1, foot - 1), wall[1])
    glass(p, sx + 3, foot - 23, 10, 21, seed, True, frame=IRON)
    p.px(sx + 10, foot - 10, '#ddd3a7')
    p.poly([(sx - 6, foot - 25), (sx + stair_w + 5, foot - 25),
            (sx + stair_w + 8, foot - 28), (sx - 3, foot - 28)], wall[4])
    p.e.polygon([(sx - 6, foot - 25), (sx + stair_w + 5, foot - 25),
                 (sx + stair_w + 8, foot - 28), (sx - 3, foot - 28)], fill=(0, 0, 0, 0))
    p.line((sx - 6, foot - 24, sx + stair_w + 5, foot - 24), wall[0])
    p.erase_glow((sx - 6, foot - 24, sx + stair_w + 5, foot - 24))
    p.rect((sx - 3, foot - 2, sx + stair_w + 2, foot), wall[2])
    p.rect((0, foot - 2, sx - 4, foot), wall[1])
    p.rect((sx + stair_w + 3, foot - 2, W - 1, foot), wall[1])
    flat_roof(p, 0, y0 - 1, W, D, wall, '#999e8e')
    # Raised lift overrun, exhausts and an access hatch occupy the perimeter.
    box3(p, sx - 4, 13, 24, 12, 5, wall)
    p.line((sx - 2, 17, sx + 18, 17), wall[1])
    for x in (18, W - 28):
        box3(p, x, 19, 5, 7, 3, IRON)
    p.line((8, y0 + 2, W - 8, y0 + 2), wall[2])
    return p, [W // 16, 7], f'{floors} storeys'


def shingle_plane(p, polygon, palette, seed, origin=0):
    mask = Image.new('1', p.im.size)
    ImageDraw.Draw(mask).polygon(polygon, fill=1)
    x0, y0, x1, y1 = mask.getbbox()
    for y in range(y0, y1):
        row = (y - origin) // 3
        for x in range(x0, x1):
            if not mask.getpixel((x, y)):
                continue
            block = (x + (row % 2) * 4) // 8
            c = palette[2]
            if (y - origin) % 3 == 2:
                c = palette[1]
            elif roll(block, row, seed) < .14:
                c = palette[3]
            p.px(x, y, c)


def split_level(seed=0, large=False):
    W = 176 if large else 160
    D = side_depth(6)
    home = W - 64
    foot, eave = 116, 48
    p = Paint(W + D + 3, foot + 3)
    siding = ['#454f49', '#68786a', '#8c9b85', '#afbaa0', '#cfdbc0'] if seed % 2 == 0 else \
             ['#645347', '#8c7560', '#b3977a', '#d1b596', '#ebd0b0']
    # The lower level is half exposed; the living floor sits above its brick sill.
    masonry(p, (0, 79, home - 1, foot - 2), BRICK, seed, course=4, stretch=10)
    p.rect((0, eave, home - 1, 78), siding[3])
    for y in range(eave + 4, 77, 4):
        p.line((0, y, home - 1, y), siding[2])
        p.line((0, y + 1, home - 1, y + 1), siding[4])
    p.rect((0, 77, home - 1, 79), CREAM[2])
    p.line((0, 77, home - 1, 77), CREAM[4])
    p.rect((0, 49, 2, 78), CREAM[3])
    # A broad picture window with small opening lights at either end.
    glass(p, 10, 55, 37, 17, seed, True, frame=CREAM, curtains=True)
    p.line((17, 55, 17, 71), CREAM[2])
    p.line((39, 55, 39, 71), CREAM[2])
    p.erase_glow((17, 55, 17, 71))
    p.erase_glow((39, 55, 39, 71))
    glass(p, 59, 55, 23, 17, seed + 1, roll(4, 1, seed) < .7, frame=CREAM, curtains=True)
    for x in (8, 37):
        glass(p, x, 89, 19, 10, seed + x, roll(x, 5, seed) < .5, frame=CREAM)
        p.line((x - 2, 100, x + 20, 100), BRICK[3])
    # Entry at the split landing, sheltered by a small timber canopy.
    dx = home - 24
    p.rect((dx - 3, 85, dx + 14, 110), BRICK[0])
    p.rect((dx, 87, dx + 9, 109), '#654c3d')
    p.rect((dx + 2, 89, dx + 7, 97), GLASS[1])
    p.glow((dx + 2, 89, dx + 7, 97))
    p.rect((dx + 2, 100, dx + 7, 107), '#533d32')
    p.px(dx + 8, 100, '#d3b675')
    p.rect((dx - 5, 110, dx + 15, 111), CREAM[2])
    p.rect((dx - 7, 112, dx + 17, 113), CREAM[1])
    p.line((dx - 7, 112, dx + 17, 112), CREAM[3])
    p.rect((dx - 9, 114, dx + 19, foot), CREAM[1])
    p.line((dx - 9, 114, dx + 19, 114), CREAM[3])
    p.poly([(dx - 6, 84), (dx + 18, 84), (dx + 21, 80), (dx - 3, 80)], ROOF[2])
    p.line((dx - 6, 85, dx + 18, 85), siding[0])
    # Porch lamp and a numbered mailbox, each subordinate to the doorway.
    p.rect((dx - 7, 91, dx - 4, 96), IRON[0])
    p.rect((dx - 6, 92, dx - 5, 94), '#d6c394')
    p.glow((dx - 6, 92, dx - 5, 94))
    p.rect((dx + 14, 94, dx + 18, 98), IRON[1])
    p.line((dx + 14, 94, dx + 18, 94), IRON[2])
    # Garage is lower and set back; its roof meets the main house at a valley.
    def home_return(f):
        for y in range(4, 30, 4):
            f.line((0, y, D - 1, y), siding[0])
            f.line((0, y + 1, D - 1, y + 1), siding[2])
        masonry(f, (0, 31, D - 1, f.im.height - 1), BRICK[:3] + [BRICK[2], BRICK[3]], seed)
        glass(f, 3, 8, 5, 12, seed, False, frame=CREAM)
    side(p, home, eave, D, foot - eave + 1, siding, home_return)
    gy = 76
    p.rect((home, gy, W - 1, foot), siding[2])
    for y in range(gy + 4, foot - 1, 4):
        p.line((home, y, W - 1, y), siding[1])
        p.line((home, y + 1, W - 1, y + 1), siding[3])
    def garage_return(f):
        for y in range(4, f.im.height - 1, 4):
            f.line((0, y, D - 1, y), siding[0])
            f.line((0, y + 1, D - 1, y + 1), siding[2])
        glass(f, 3, 9, 5, 10, seed, False)
    side(p, W, gy, D, foot - gy + 1, siding, garage_return)
    doorx = home + 7
    p.rect((doorx - 2, gy + 5, W - 5, foot - 1), siding[0])
    p.rect((doorx, gy + 7, W - 7, foot - 2), CREAM[2])
    for y in range(gy + 9, foot - 2, 6):
        p.line((doorx, y, W - 7, y), CREAM[1])
        p.line((doorx + 1, y + 1, W - 8, y + 1), CREAM[3])
    for x in range(doorx + 2, W - 12, 11):
        p.rect((x, gy + 10, x + 7, gy + 14), GLASS[1])
        p.line((x, gy + 10, x + 7, gy + 10), GLASS[3])
    p.line((doorx + 23, foot - 9, doorx + 28, foot - 9), IRON[1])
    # Main hip roof: a broad quiet near slope and a darker right return.
    ridge_y = 24
    near = [(0, eave - 1), (home - 1, eave - 1), (home - 19, ridge_y), (20, ridge_y)]
    shingle_plane(p, near, ROOF, seed, origin=ridge_y)
    p.poly([(home - 1, eave - 1), (home + D - 1, eave - D - 1),
            (home - 7, ridge_y - D), (home - 19, ridge_y)], ROOF[1])
    p.poly([(20, ridge_y), (home - 19, ridge_y), (home - 7, ridge_y - D), (32, ridge_y - D)], ROOF[3])
    p.line((20, ridge_y, home - 19, ridge_y), ROOF[3])
    p.line((0, eave - 1, home - 1, eave - 1), ROOF[3])
    p.rect((0, eave, home - 1, eave + 2), CREAM[3])
    p.line((0, eave + 3, home - 1, eave + 3), siding[0])
    p.poly([(home, eave), (home + D - 1, eave - D + 1),
            (home + D - 1, eave - D + 3), (home, eave + 2)], CREAM[1])
    p.line((home, eave + 3, home + D - 1, eave - D + 4), siding[0])
    # A chimney pierces the rear roof plane and shares the same brick ramp.
    cx = 25 if seed % 2 == 0 else home - 32
    box3(p, cx, 7, 10, 24, 4, BRICK)
    for y in range(10, 30, 4):
        p.line((cx + 1, y, cx + 8, y), BRICK[1])
    p.rect((cx - 1, 6, cx + 10, 8), CREAM[3])
    p.rect((cx + 2, 5, cx + 4, 6), IRON[0])
    p.rect((cx + 7, 5, cx + 8, 6), IRON[0])
    garage_roof = [(home, gy - 1), (W - 1, gy - 1), (W - 16, gy - 19), (home + 15, gy - 19)]
    shingle_plane(p, garage_roof, ROOF, seed + 3, origin=gy - 19)
    p.poly([(W - 1, gy - 1), (W + D - 1, gy - D - 1),
            (W - 4, gy - 19 - D), (W - 16, gy - 19)], ROOF[1])
    p.poly([(home + 15, gy - 19), (W - 16, gy - 19), (W - 4, gy - 19 - D),
            (home + 27, gy - 19 - D)], ROOF[3])
    p.line((home, gy - 1, W - 1, gy - 1), ROOF[3])
    p.rect((home, gy, W - 1, gy + 2), CREAM[3])
    p.line((home, gy + 3, W - 1, gy + 3), siding[0])
    # Downpipe and flashing tie the two volumes together.
    p.line((home + 1, gy + 3, home + 1, foot - 2), IRON[1])
    p.line((home + 2, gy + 3, home + 2, foot - 2), IRON[2])
    p.line((home, gy - 1, home + 15, gy - 19), ROOF[0])
    p.line((0, foot - 1, dx - 10, foot - 1), BRICK[0])
    return p, [W // 16, 6], 'split level + garage'


def station(seed=0, large=False, frame=0):
    W, D = (256 if large else 224), side_depth(8)
    foot, wall_y = 166, 86
    p = Paint(W + D + 3, foot + 5)
    stone = STONE if seed % 2 == 0 else ['#5c6660', '#879187', '#afb6a6', '#cbd2bf', '#e4e8cf', '#f1f0dc']
    copper = ['#243f3c', '#3b5f55', '#568172', '#80a393']
    p.rect((0, wall_y, W - 1, foot), stone[3])
    p.rect((0, foot - 5, W - 1, foot), stone[1])
    def returns(f):
        for y in range(5, 73, 7):
            f.line((0, y, D - 1, y), stone[0])
        glass(f, 3, 13, 5, 24, seed, True, frame=BRONZE)
        glass(f, 3, 49, 5, 21, seed, True, frame=BRONZE)
    side(p, W, wall_y, D, foot - wall_y, stone, returns)
    flat_roof(p, 0, wall_y - 1, W, D, stone, '#8b9280')
    vx, vw = 48, W - 104
    spring, rise = 93, 49
    # The vault's sky plane is shaded by its curved cross-section.
    curve = []
    for x in range(vx, vx + vw):
        t = (x - vx - vw / 2) / (vw / 2)
        top = spring - round(rise * math.sqrt(max(0, 1 - t * t)))
        curve.append((x, top))
    roof_mask = Image.new('1', p.im.size)
    ImageDraw.Draw(roof_mask).polygon(curve + [(x + D, y - D) for x, y in reversed(curve)], fill=1)
    for y in range(30, spring + 1):
        for x in range(vx, vx + vw + D):
            if not roof_mask.getpixel((x, y)):
                continue
            t = max(-1, min(1, (x - vx - vw / 2 - D / 2) / (vw / 2)))
            normal = -.55 * t + .6 * math.sqrt(max(0, 1 - t * t))
            tone = max(0, min(3, int((normal + .25) * 3.6)))
            p.px(x, y, copper[tone])
    for x, top in curve:
        p.line((x, top, x, spring), stone[2])
        p.px(x, top, copper[3])
        p.px(x, top + 1, copper[0])
    for x in range(vx + 7, vx + vw - 6, 14):
        t = (x - vx - vw / 2) / (vw / 2)
        top = spring - round(rise * math.sqrt(max(0, 1 - t * t)))
        p.line((x, top - 1, x + D, top - D - 1), copper[1])
        p.line((x + 1, top - 1, x + D + 1, top - D - 1), copper[3])
    gx, gw = vx + 6, vw - 12
    centre, radius = gx + gw / 2, gw / 2
    arch = Image.new('1', p.im.size)
    ad = ImageDraw.Draw(arch)
    for x in range(gx, gx + gw):
        t = (x - centre) / radius
        top = spring - round(39 * math.sqrt(max(0, 1 - t * t)))
        ad.line((x, top, x, foot - 30), fill=1)
        p.line((x, top, x, foot - 30), GLASS[1])
        for y in range(top, foot - 29):
            patch = .5 + .5 * math.sin((x - gx) / 31 + y / 39)
            c = GLASS[2] if y < 101 else GLASS[1]
            if y < 90 and patch > .83:
                c = GLASS[3]
            p.px(x, y, c)
            p.e.point((x, y), fill='#688b87' if y < 95 else '#8fa997')
        p.px(x, top - 1, BRONZE[2])
        p.px(x, top - 2, stone[4])
    for x in range(gx + 9, gx + gw, 13):
        for y in range(40, foot - 29):
            if arch.getpixel((x, y)):
                p.px(x, y, BRONZE[1])
                p.e.point((x, y), fill=(0, 0, 0, 0))
    for y in (79, 101, 121, foot - 31):
        for x in range(gx, gx + gw):
            if arch.getpixel((x, y)):
                p.px(x, y, BRONZE[1])
                p.e.point((x, y), fill=(0, 0, 0, 0))
    # Triangulated ties give the glass an engineered structure at native size.
    for x in range(gx + 9, gx + gw - 10, 26):
        for i in range(14):
            yy = 119 - i
            for xx in (x + i, x + 26 - i):
                if arch.getpixel((xx, yy)):
                    p.px(xx, yy, IRON[2])
                    p.e.point((xx, yy), fill=(0, 0, 0, 0))
    for x in range(round(centre) - 26, round(centre) + 27, 26):
        p.line((x, 81, x, 94), BRONZE[0])
        p.poly([(x - 3, 94), (x + 3, 94), (x + 2, 96), (x - 2, 96)], BRONZE[2])
        p.rect((x - 1, 97, x + 1, 99), '#d4c09a')
        p.e.line((x, 81, x, 94), fill=(0, 0, 0, 0))
        p.e.polygon([(x - 3, 94), (x + 3, 94), (x + 2, 96), (x - 2, 96)], fill=(0, 0, 0, 0))
        p.glow((x - 1, 97, x + 1, 99))
    for start, end in [(3, vx - 1), (vx + vw + 2, W - 3)]:
        for y in range(wall_y + 6, foot - 6, 7):
            p.line((start, y, end, y), stone[2])
        for x in range(start + 5, end - 10, 20):
            glass(p, x, wall_y + 12, 12, 24, seed + x, True, frame=BRONZE)
            p.rect((x - 2, wall_y + 8, x + 14, wall_y + 10), stone[4])
    # The concourse is visibly recessed behind a projecting entrance canopy.
    entry = round(centre) - 31
    p.rect((entry - 5, foot - 36, entry + 66, foot - 4), '#243735')
    for x in (entry, entry + 21, entry + 42):
        glass(p, x, foot - 29, 17, 23, seed + x, True, frame=BRONZE)
    p.poly([(entry - 10, foot - 33), (entry + 71, foot - 33),
            (entry + 77, foot - 39), (entry - 4, foot - 39)], copper[2])
    p.line((entry - 10, foot - 32, entry + 71, foot - 32), copper[0])
    p.erase_glow((entry - 10, foot - 39, entry + 77, foot - 32))
    for x in (entry - 7, entry + 67):
        p.rect((x, foot - 32, x + 2, foot - 4), BRONZE[1])
        p.line((x, foot - 32, x, foot - 4), BRONZE[3])
    p.rect((entry - 10, foot - 4, entry + 72, foot - 2), stone[2])
    p.line((entry - 10, foot - 4, entry + 72, foot - 4), stone[4])
    # Departure board changes only its small split-flap cells.
    board_x, board_y = round(centre) - 27, foot - 50
    p.rect((board_x - 2, board_y - 2, board_x + 55, board_y + 8), BRONZE[0])
    p.erase_glow((board_x - 2, board_y - 2, board_x + 55, board_y + 8))
    for line in range(2):
        for column in range(13):
            xx, yy = board_x + column * 4, board_y + line * 4
            if (column + line + frame // 3) % 5:
                p.line((xx, yy, xx + 2, yy), '#d8c99c')
                p.px(xx + (frame + column) % 3, yy + 1, '#acbcaf')
    tower_x, tower_y, tower_w = W - 41, 26, 36
    box3(p, tower_x, tower_y, tower_w, foot - tower_y, D, stone)
    for y in range(tower_y + 6, foot - 4, 7):
        p.line((tower_x + 2, y, tower_x + tower_w - 3, y), stone[2])
    for x in (tower_x + 3, tower_x + tower_w - 5):
        p.rect((x, tower_y + 3, x + 2, foot - 4), stone[4])
    clock_x, clock_y = tower_x + tower_w // 2, 68
    p.d.ellipse((clock_x - 12, clock_y - 12, clock_x + 12, clock_y + 12), fill=BRONZE[1])
    p.d.ellipse((clock_x - 10, clock_y - 10, clock_x + 10, clock_y + 10), fill=stone[5])
    p.e.ellipse((clock_x - 10, clock_y - 10, clock_x + 10, clock_y + 10), fill='#d0c8a2')
    for hour in range(12):
        angle = hour * math.pi / 6
        p.px(clock_x + round(math.sin(angle) * 8), clock_y - round(math.cos(angle) * 8), BRONZE[0])
        p.e.point((clock_x + round(math.sin(angle) * 8), clock_y - round(math.cos(angle) * 8)), fill=(0, 0, 0, 0))
    p.line((clock_x, clock_y, clock_x + 4, clock_y - 2), BRONZE[0])
    p.e.line((clock_x, clock_y, clock_x + 4, clock_y - 2), fill=(0, 0, 0, 0))
    angle = -math.pi / 3
    p.line((clock_x, clock_y, clock_x + round(math.sin(angle) * 7), clock_y - round(math.cos(angle) * 7)), BRONZE[0])
    p.e.line((clock_x, clock_y, clock_x + round(math.sin(angle) * 7), clock_y - round(math.cos(angle) * 7)), fill=(0, 0, 0, 0))
    angle = frame * math.pi / 8
    p.line((clock_x, clock_y, clock_x + round(math.sin(angle) * 8), clock_y - round(math.cos(angle) * 8)), '#9b684c')
    p.e.line((clock_x, clock_y, clock_x + round(math.sin(angle) * 8), clock_y - round(math.cos(angle) * 8)), fill='#855d45')
    p.px(clock_x, clock_y, BRONZE[3])
    for x in (tower_x + 7, tower_x + 22):
        p.rect((x, 35, x + 7, 49), copper[0])
        for y in range(37, 49, 3):
            p.line((x + 1, y, x + 6, y), copper[2])
    glass(p, tower_x + 11, 108, 13, 29, seed, True, frame=BRONZE)
    flat_roof(p, tower_x - 2, tower_y - 1, tower_w + 4, D, stone, copper[1])
    p.poly([(tower_x + 4, 19), (tower_x + 32, 19), (tower_x + 25, 7), (tower_x + 11, 7)], copper[2])
    p.line((tower_x + 11, 7, tower_x + 25, 7), copper[3])
    p.line((tower_x + 18, 7, tower_x + 18, 1), BRONZE[2])
    p.rect((tower_x - 2, 24, tower_x + tower_w + 1, 27), stone[4])
    # Poster frames and wall lights sit in their own masonry bays.
    for x, colour in [(8, '#9c634d'), (29, '#607a75')]:
        p.rect((x, foot - 35, x + 12, foot - 13), BRONZE[1])
        p.rect((x + 1, foot - 34, x + 11, foot - 14), '#d4c2a0')
        p.rect((x + 2, foot - 32, x + 10, foot - 22), colour)
        for y in (foot - 19, foot - 17):
            p.line((x + 3, y, x + 9, y), BRONZE[1])
    for x in (vx - 3, vx + vw + 3):
        p.rect((x - 1, 105, x + 2, 112), BRONZE[0])
        p.rect((x, 106, x + 1, 110), WARM[2])
        p.glow((x, 106, x + 1, 110))
    return p, [W // 16, 8], 'vaulted concourse / clock tower'


def market(seed=0, large=False, frame=0):
    W, D = (256 if large else 224), side_depth(8)
    foot, eave = 164, 89
    p = Paint(W + D + 3, foot + 5)
    tile = ['#4f3d36', '#85533d', '#ac714b', '#ce9769'] if seed % 2 == 0 else \
           ['#283e3b', '#405a50', '#64836a', '#93aa84']
    timber = ['#2b3932', '#455848', '#63765b', '#93a080', '#c6cab0']
    p.rect((0, eave, W - 1, foot), '#35423a')
    p.rect((3, eave + 4, W - 4, foot - 5), '#29362f')
    p.rect((0, foot - 5, W - 1, foot), STONE[1])
    p.line((0, foot - 5, W - 1, foot - 5), STONE[3])
    def returned(f):
        f.rect((0, 0, D - 1, 74), timber[0])
        for y in (5, 30, 55):
            glass(f, 2, y, D - 4, 18, seed, True, frame=timber)
        f.rect((0, 69, D - 1, 74), STONE[0])
    side(p, W, eave, D, foot - eave, timber, returned)
    # The roof mass is separate from the open, shaded trading floor.
    pitched_range(p, 0, eave - 8, W, D, seed, rise=37, pal=tile)
    if seed % 2 == 0:
        for x in range(8, W - 4, 6):
            p.line((x, eave - 10, x + 7, eave - 43), tile[1])
    else:
        for x in range(8, W - 4, 5):
            p.line((x, eave - 10, x + 7, eave - 43), tile[3])
    monitor_x, monitor_w = 26, W - 52
    box3(p, monitor_x, 37, monitor_w, 23, D, timber)
    for x in range(monitor_x + 5, monitor_x + monitor_w - 8, 13):
        glass(p, x, 42, 8, 13, seed + x, x % 3 == 0, frame=timber)
        p.line((x, 49, x + 7, 49), timber[1])
        p.erase_glow((x, 49, x + 7, 49))
    pitched_range(p, monitor_x - 4, 35, monitor_w + 8, D, seed + 1, rise=14, pal=tile)
    p.rect((0, eave - 7, W - 1, eave + 3), timber[1])
    p.line((0, eave - 7, W - 1, eave - 7), timber[3])
    p.line((0, eave + 4, W - 1, eave + 4), timber[0])
    p.rect((W // 2 - 28, eave - 6, W // 2 + 28, eave + 2), '#354238')
    letters(p, 'MARKET', W // 2 - 12, eave - 4, '#ded1a0')
    door_left, door_right = W // 2 - 19, W // 2 + 19
    p.rect((door_left, eave + 8, door_right, foot - 5), '#243129')
    p.poly([(door_left, foot - 6), (door_right, foot - 6), (door_right - 8, foot - 25),
            (door_left + 8, foot - 25)], '#707569')
    p.line((door_left + 5, foot - 12, door_right - 5, foot - 12), '#858a78')
    pitch = (W - 48) // 4
    starts = [7, 7 + pitch, door_right + 5, door_right + 5 + pitch]
    for stall, x in enumerate(starts):
        w = pitch - 8
        colour = ['#846554', '#547c73', '#a09264', '#806679'][stall]
        p.rect((x, eave + 10, x + w, foot - 6), '#3f4c3e')
        p.rect((x + 2, eave + 14, x + w - 2, foot - 30), '#26392e')
        p.glow((x + 3, eave + 17, x + w - 3, foot - 30), WARM)
        for xx in range(x + 3, x + w - 2, 5):
            p.line((xx, eave + 18, xx, foot - 33), '#6d7860')
            p.erase_glow((xx, eave + 18, xx, foot - 33))
        p.poly([(x - 1, foot - 32), (x + w + 1, foot - 32),
                (x + w + 5, foot - 37), (x + 3, foot - 37)], '#a1926e')
        p.rect((x, foot - 31, x + w, foot - 6), '#745a40')
        p.line((x, foot - 31, x + w, foot - 31), '#c2a476')
        p.erase_glow((x - 1, foot - 37, x + w + 5, foot - 6))
        for xx in range(x + 2, x + w, 7):
            p.line((xx, foot - 29, xx, foot - 8), '#5b4532')
            p.line((xx + 1, foot - 29, xx + 1, foot - 8), '#997552')
        for yy in (foot - 25, foot - 13):
            p.line((x + 1, yy, x + w - 1, yy), '#a2815b')
        # Produce is grouped into bins, with a different silhouette at every stall.
        for bin_n in range(3):
            bx = x + 3 + bin_n * max(8, (w - 5) // 3)
            p.poly([(bx, foot - 35), (bx + 7, foot - 35), (bx + 9, foot - 39),
                    (bx + 2, foot - 39)], '#4c4531')
            if stall == 0:
                for i in range(5):
                    xx, yy = bx + 2 + i % 3 * 2, foot - 38 - i // 3 * 2
                    p.rect((xx, yy, xx + 1, yy + 1), ['#bc884b', '#d9aa62', '#9c6a3a'][i % 3])
                    p.px(xx, yy, '#e1b86d')
            elif stall == 1:
                for i in range(4):
                    xx = bx + 2 + i * 2
                    p.line((xx, foot - 36, xx + 1, foot - 41), '#789361')
                    p.px(xx + 1, foot - 41, '#a0b57c')
            elif stall == 2:
                p.d.ellipse((bx + 1, foot - 40, bx + 7, foot - 36), fill='#b0beb1')
                p.line((bx + 2, foot - 38, bx + 7, foot - 38), '#d6d7be')
                p.poly([(bx + 7, foot - 38), (bx + 9, foot - 40), (bx + 9, foot - 36)], '#829c91')
                p.px(bx + 2, foot - 39, '#30473e')
            else:
                p.d.ellipse((bx + 1, foot - 41, bx + 7, foot - 35), fill='#b8945c')
                p.line((bx + 2, foot - 39, bx + 6, foot - 39), '#e0bd80')
                p.line((bx + 3, foot - 37, bx + 5, foot - 37), '#e0bd80')
        for yy in range(foot - 42, foot - 7):
            for xx in range(x, x + w + 1):
                r, g, b, a = p.im.getpixel((xx, yy))
                p.e.point((xx, yy), fill=(round(r * .64 + 12), round(g * .55 + 9), round(b * .40 + 3), a))
        awning_y = eave + 10
        for yy in range(awning_y, awning_y + 8):
            for xx in range(x - 1, x + w + 2):
                p.px(xx, yy, '#d0c4a0' if ((xx - x) // 5) % 2 else colour)
        p.line((x - 1, awning_y + 8, x + w + 1, awning_y + 8), timber[0])
        p.erase_glow((x - 1, awning_y, x + w + 1, awning_y + 8))
        p.line((x + 2, awning_y + 9, x + 2, foot - 4), timber[1])
        p.line((x + w - 2, awning_y + 9, x + w - 2, foot - 4), timber[1])
        shift = [-1, 0, 1, 0][(frame // 2 + stall) % 4]
        p.rect((x + w - 10 + shift, awning_y + 9, x + w - 5 + shift, awning_y + 21), colour)
        p.line((x + w - 9 + shift, awning_y + 10, x + w - 9 + shift, awning_y + 19), '#d8cbaa')
        p.erase_glow((x + w - 11, awning_y + 9, x + w - 3, awning_y + 22))
        # Hanging lamps remain below their structural beam.
        p.line((x + w // 2, eave + 4, x + w // 2, eave + 12), IRON[0])
        p.rect((x + w // 2 - 2, eave + 12, x + w // 2 + 2, eave + 14), IRON[1])
        p.rect((x + w // 2 - 1, eave + 15, x + w // 2 + 1, eave + 18), WARM[1])
        p.glow((x + w // 2 - 1, eave + 15, x + w // 2 + 1, eave + 18))
    for x in (0, door_left - 4, door_right + 2, W - 4):
        p.rect((x, eave + 4, x + 3, foot - 5), timber[1])
        p.line((x, eave + 4, x, foot - 5), timber[3])
        p.rect((x - 1, foot - 9, x + 4, foot - 4), STONE[2])
        p.erase_glow((x - 1, eave + 4, x + 4, foot - 4))
        p.line((x + 3, eave + 6, x + 11, eave + 16), timber[2])
    # A small roof extractor supplies the animation without moving the whole roof.
    fan_x, fan_y = W // 2, 49
    p.d.ellipse((fan_x - 6, fan_y - 6, fan_x + 6, fan_y + 6), fill=timber[0])
    for blade in range(4):
        angle = (frame + blade * 4) * math.pi / 8
        p.line((fan_x, fan_y, fan_x + round(math.cos(angle) * 4), fan_y + round(math.sin(angle) * 4)), timber[3], 2)
    p.px(fan_x, fan_y, timber[4])
    p.erase_glow((fan_x - 7, fan_y - 7, fan_x + 7, fan_y + 7))
    return p, [W // 16, 8], 'covered market / four trading bays'


def hospital(seed=0, large=False, frame=0):
    W, D = (256 if large else 224), side_depth(8)
    floors = 6 if large else 5
    main_w = W - 64
    wall_y = 54
    H = 40 + (floors - 1) * STOREY
    foot = wall_y + H
    p = Paint(W + D + 3, foot + 5)
    concrete = ['#546563', '#7b8e86', '#a8b8aa', '#ced7c4', '#eef0db']
    blue = ['#203b44', '#365f69', '#558591', '#86afb4', '#c1d4cb']
    p.rect((0, wall_y, main_w - 1, foot), concrete[3])
    def returned(f):
        for n in range(floors - 1):
            yy = 6 + n * STOREY
            glass(f, 3, yy, 5, 15, seed + n, n % 2 == 0, frame=concrete)
            f.rect((0, yy + 18, D - 1, yy + 20), concrete[0])
        f.rect((0, H - 5, D - 1, H), concrete[0])
    side(p, main_w, wall_y, D, H, concrete, returned)
    flat_roof(p, 0, wall_y - 1, main_w, D, concrete, '#909c8a')
    # Rooms are grouped behind a deep continuous sunshade, not individually boxed.
    bays = main_w // 32
    for floor in range(floors - 1):
        yy = wall_y + floor * STOREY
        p.rect((5, yy + 5, main_w - 6, yy + 21), blue[0])
        for bay in range(bays):
            x = bay * 32 + 7
            lit = roll(bay, floor, seed + 14) < .55
            if bay == 1 and floor == 1:
                lit = frame >= 8
            glass(p, x, yy + 7, 23, 14, seed + floor + bay, lit, frame=concrete)
            if (floor + bay + seed) % 4 == 0:
                p.rect((x + 2, yy + 9, x + 7, yy + 19), '#afbbaa')
                p.line((x + 3, yy + 9, x + 3, yy + 19), '#d4d8bf')
                if lit:
                    p.e.rectangle((x + 2, yy + 9, x + 7, yy + 19), fill='#c1c6a3')
            p.line((x + 16, yy + 7, x + 16, yy + 20), concrete[1])
            p.erase_glow((x + 16, yy + 7, x + 16, yy + 20))
        p.rect((0, yy + 23, main_w - 1, yy + 26), concrete[2])
        p.line((0, yy + 23, main_w - 1, yy + 23), concrete[4])
        p.line((0, yy + 27, main_w - 1, yy + 27), concrete[0])
        p.poly([(0, yy + 3), (main_w - 1, yy + 3), (main_w + 3, yy - 1), (4, yy - 1)], concrete[4])
        p.line((0, yy + 4, main_w - 1, yy + 4), concrete[1])
    # Roof service plant is set back to leave a usable terrace.
    box3(p, 24, 33, 50, 15, 6, concrete)
    for y in range(36, 47, 3):
        p.line((27, y, 70, y), concrete[1])
    for x in (90, main_w - 22):
        box3(p, x, 42, 13, 8, 4, IRON)
        for xx in range(x + 2, x + 12, 3):
            p.line((xx, 44, xx, 47), IRON[0])
    # A stair and lift tower is higher than the ward wing, with its own return.
    tx, tw, ty = main_w + 8, 56, 26
    box3(p, tx, ty, tw, foot - ty, D, concrete)
    p.rect((tx + 8, 57, tx + tw - 9, foot - 14), blue[0])
    for y in range(59, foot - 14):
        p.line((tx + 10, y, tx + tw - 11, y), blue[2] if y % STOREY < 11 else blue[1])
    for n in range(floors):
        yy = 62 + n * STOREY
        if yy + 18 >= foot - 13:
            break
        p.glow((tx + 10, yy, tx + tw - 11, yy + 19), COOL)
        for step in range(12):
            x = tx + 12 + step
            sy = yy + 7 + step // 2
            p.line((x, sy, x + 8, sy), '#678d87')
            p.erase_glow((x, sy, x + 8, sy))
        p.rect((tx + 8, yy + 22, tx + tw - 9, yy + 24), concrete[1])
        p.erase_glow((tx + 8, yy + 22, tx + tw - 9, yy + 24))
    for x in (tx + 9, tx + 29, tx + tw - 10):
        p.line((x, 58, x, foot - 14), concrete[1])
        p.erase_glow((x, 58, x, foot - 14))
    # The lift car is a tiny contained light travelling behind the core glazing.
    lift_y = 69 + round((1 - math.cos(frame * math.pi / 8)) * .5 * (foot - 104))
    p.rect((tx + 33, lift_y, tx + 41, lift_y + 9), '#c4cab1')
    p.rect((tx + 35, lift_y + 2, tx + 39, lift_y + 6), blue[0])
    p.erase_glow((tx + 33, lift_y, tx + 41, lift_y + 9))
    p.glow((tx + 35, lift_y + 2, tx + 39, lift_y + 6), WARM)
    # Medical wayfinding uses one modest illuminated symbol rather than a logo.
    cx, cy = tx + tw // 2, 43
    p.rect((cx - 9, cy - 9, cx + 9, cy + 9), blue[0])
    for box in ((cx - 2, cy - 6, cx + 2, cy + 6), (cx - 6, cy - 2, cx + 6, cy + 2)):
        p.rect(box, '#a5c5a2')
        p.e.rectangle(box, fill='#c3dfb0')
    flat_roof(p, tx - 1, ty - 1, tw + 2, D, concrete, '#919c8b')
    # A cylindrical header tank is shaded from its surface normal.
    tank_x, tank_y = tx + 18, 5
    for x in range(tank_x, tank_x + 20):
        normal = (x - tank_x - 9.5) / 10
        light = -.6 * normal + .35 * math.sqrt(max(0, 1 - normal * normal))
        tone = max(0, min(4, round((light + .5) * 3)))
        p.line((x, tank_y + 4, x, tank_y + 15), concrete[tone])
    p.d.ellipse((tank_x, tank_y, tank_x + 19, tank_y + 7), fill=concrete[3])
    p.line((tank_x + 2, tank_y + 2, tank_x + 17, tank_y + 2), concrete[4])
    p.line((tank_x + 2, tank_y + 15, tank_x + 17, tank_y + 15), concrete[0])
    p.line((tank_x + 4, tank_y + 16, tank_x + 4, ty - 2), IRON[1])
    p.line((tank_x + 16, tank_y + 16, tank_x + 16, ty - 2), IRON[1])
    p.line((tank_x + 19, tank_y + 5, tank_x + 22, tank_y + 5, tank_x + 22, ty + 5), IRON[1])
    # The ground floor connects both wings behind a wide porte-cochere.
    gy = foot - 40
    p.rect((0, gy, main_w + 5, foot), concrete[2])
    for x in (8, 38, main_w - 32):
        glass(p, x, gy + 9, 23, 23, seed + x, True, frame=blue)
    dx = 76
    p.rect((dx - 3, foot - 28, dx + 31, foot - 3), blue[0])
    p.glow((dx, foot - 26, dx + 28, foot - 4), COOL)
    opening = round((1 - math.cos(frame * math.pi / 8)) * 5)
    for x in (dx - opening, dx + 15 + opening):
        p.rect((x, foot - 26, x + 13, foot - 4), blue[2])
        p.line((x, foot - 26, x, foot - 4), concrete[4])
        p.line((x + 12, foot - 26, x + 12, foot - 4), concrete[1])
        p.erase_glow((x, foot - 26, x + 13, foot - 4))
        p.glow((x + 1, foot - 25, x + 11, foot - 5), COOL)
        p.line((x + 1, foot - 18, x + 11, foot - 18), '#a5bdb5')
        p.erase_glow((x + 1, foot - 18, x + 11, foot - 18))
    p.rect((53, gy + 2, 127, gy + 8), blue[1])
    letters(p, 'HOSPITAL', 75, gy + 3, '#e0e3c4')
    canopy_x, canopy_w, canopy_y = 48, 91, foot - 29
    p.poly([(canopy_x, canopy_y), (canopy_x + canopy_w, canopy_y),
            (canopy_x + canopy_w + 8, canopy_y - 8), (canopy_x + 8, canopy_y - 8)], concrete[4])
    p.rect((canopy_x, canopy_y + 1, canopy_x + canopy_w, canopy_y + 3), concrete[2])
    p.line((canopy_x, canopy_y + 4, canopy_x + canopy_w, canopy_y + 4), concrete[0])
    p.erase_glow((canopy_x, canopy_y - 8, canopy_x + canopy_w + 8, canopy_y + 4))
    p.rect((75, canopy_y, 106, canopy_y + 6), blue[1])
    letters(p, 'HOSPITAL', 75, canopy_y + 1, '#e0e3c4')
    for x in (canopy_x + 3, canopy_x + canopy_w - 6):
        p.rect((x, canopy_y + 4, x + 4, foot - 3), concrete[2])
        p.line((x, canopy_y + 4, x, foot - 3), concrete[4])
        p.line((x + 4, canopy_y + 4, x + 4, foot - 3), concrete[0])
        p.erase_glow((x, canopy_y + 4, x + 4, foot - 3))
    for x in (4, main_w - 22):
        p.rect((x, foot - 8, x + 15, foot - 1), concrete[1])
        p.line((x, foot - 8, x + 15, foot - 8), concrete[3])
        p.erase_glow((x, foot - 8, x + 15, foot - 1))
        for xx in (x + 3, x + 7, x + 12):
            p.line((xx, foot - 9, xx + 1, foot - 15), '#568568')
            p.px(xx + 1, foot - 16, '#91af82')
    p.rect((48, foot - 3, 140, foot), concrete[1])
    p.line((48, foot - 3, 140, foot - 3), concrete[4])
    # The exhaust fan's frame is fixed; only its blades rotate.
    fx, fy = 103, 43
    p.d.ellipse((fx - 5, fy - 3, fx + 5, fy + 3), fill=IRON[0])
    for blade in range(3):
        angle = frame * math.pi / 8 + blade * math.pi * 2 / 3
        p.line((fx, fy, fx + round(math.cos(angle) * 4), fy + round(math.sin(angle) * 2)), IRON[3])
    p.px(fx, fy, IRON[2])
    p.erase_glow((fx - 6, fy - 4, fx + 6, fy + 4))
    return p, [W // 16, 8], f'{floors} storeys / ward and circulation wings'


FIRED = ['#593d34', '#805546', '#9e6953', '#b78062', '#c99573']
COMMON = ['#44352f', '#60483a', '#745341', '#896851', '#a27b5e']
SLATE = ['#253339', '#3c4c53', '#56676d', '#75858a']
PAINTED = ['#293d36', '#405d4d', '#5f7c62', '#87a07a', '#c1cfab']


def letters(p, word, x, y, colour, pitch=4):
    glyphs = {
        'A': ['010', '101', '111', '101', '101'],
        'C': ['011', '100', '100', '100', '011'],
        'E': ['111', '100', '110', '100', '111'],
        'G': ['011', '100', '101', '101', '011'],
        'H': ['101', '101', '111', '101', '101'],
        'I': ['111', '010', '010', '010', '111'],
        'K': ['101', '110', '100', '110', '101'],
        'L': ['100', '100', '100', '100', '111'],
        'M': ['101', '111', '111', '101', '101'],
        'N': ['101', '111', '111', '111', '101'],
        'O': ['010', '101', '101', '101', '010'],
        'P': ['110', '101', '110', '100', '100'],
        'R': ['110', '101', '110', '101', '101'],
        'S': ['011', '100', '010', '001', '110'],
        'T': ['111', '010', '010', '010', '010'],
        'W': ['101', '101', '111', '111', '101'],
    }
    for index, char in enumerate(word):
        for yy, row in enumerate(glyphs.get(char, [])):
            for xx, bit in enumerate(row):
                if bit == '1':
                    p.px(x + index * pitch + xx, y + yy, colour)


def period_sash(p, x, y, w, h, seed, lit=False, pal=CREAM, curtains=False):
    glass(p, x, y, w, h, seed, lit, frame=pal, curtains=curtains)
    cross = y + h // 2
    p.line((x, cross, x + w - 1, cross), pal[3])
    p.erase_glow((x, cross, x + w - 1, cross))
    p.line((x, cross + 1, x + w - 1, cross + 1), pal[0])
    p.erase_glow((x, cross + 1, x + w - 1, cross + 1))
    p.line((x - 2, y - 3, x + w + 1, y - 3), STONE[3])
    p.line((x - 2, y - 2, x + w + 1, y - 2), STONE[1])


def pitched_range(p, x, y, w, depth, seed, rise=24, pal=SLATE):
    ridge = y - rise
    plane = [(x, y), (x + w - 1, y), (x + w + 6, ridge), (x + 7, ridge)]
    shingle_plane(p, plane, pal, seed, origin=ridge)
    p.poly([(x + 7, ridge), (x + w + 6, ridge), (x + w + depth - 1, y - depth),
            (x + depth, y - depth)], pal[1])
    p.poly([(x + w - 1, y), (x + w + 6, ridge), (x + w + depth - 1, y - depth)], COMMON[1])
    p.line((x + 7, ridge, x + w + 6, ridge), pal[3])
    p.line((x, y, x + w - 1, y), pal[3])
    p.line((x + w - 1, y, x + w + depth - 1, y - depth), pal[2])


def chimney(p, x, y, height, seed):
    box3(p, x, y, 7, height, 3, FIRED)
    for yy in range(y + 3, y + height - 1, 3):
        p.line((x, yy, x + 6, yy), FIRED[1])
    p.rect((x - 1, y - 1, x + 8, y + 1), STONE[2])
    for xx in (x, x + 4):
        p.rect((xx, y - 6, xx + 2, y - 2), FIRED[2])
        p.line((xx, y - 6, xx + 2, y - 6), FIRED[4])
        p.px(xx + 1, y - 6, COMMON[0])


def panel_door(p, x, foot, seed, pal=PAINTED):
    y = foot - 23
    p.rect((x - 2, y - 6, x + 11, foot), STONE[1])
    p.rect((x - 1, y - 5, x + 10, foot), pal[0])
    p.rect((x, y - 4, x + 9, y - 1), GLASS[2])
    p.glow((x, y - 4, x + 9, y - 1))
    p.rect((x, y, x + 9, foot - 1), pal[2])
    p.line((x, y, x, foot - 1), pal[3])
    for py in (y + 3, y + 12):
        for px in (x + 2, x + 6):
            p.rect((px, py, px + 1, py + 6), pal[1])
            p.line((px, py, px + 1, py), pal[3])
    p.px(x + 8, y + 11, BRONZE[4])
    p.rect((x - 3, foot, x + 12, foot + 1), STONE[3])
    p.line((x - 3, foot + 2, x + 12, foot + 2), STONE[1])


def terrace(seed=0, large=False):
    houses, bay = (4 if large else 3), 48
    floors = 3 if large else 2
    W, D = houses * bay, side_depth(5)
    y0 = 47
    H = 38 + (floors - 1) * STOREY
    foot = y0 + H
    p = Paint(W + D + 3, foot + 5)
    masonry(p, (0, y0, W - 1, foot), FIRED, seed, course=3, stretch=8)
    def end_wall(f):
        masonry(f, (0, 0, D - 1, H), COMMON, seed + 9, course=3, stretch=7)
        for n in range(floors):
            period_sash(f, 3, 8 + n * STOREY, 5, 14, seed + n, n == 1, pal=STONE)
    side(p, W, y0, D, H, COMMON, end_wall)
    pitched_range(p, 0, y0 - 2, W, D, seed)
    # The cornice is continuous, while thresholds and party piers remain individual.
    p.rect((0, y0 - 1, W - 1, y0 + 2), STONE[2])
    p.line((0, y0 - 1, W - 1, y0 - 1), STONE[4])
    p.line((0, y0 + 3, W - 1, y0 + 3), FIRED[0])
    for home in range(houses):
        x = home * bay
        colour = PAINTED if (home + seed) % 3 else ['#352f30', '#53454c', '#77575e', '#a47b79', '#ceb7a0']
        for floor in range(floors - 1):
            yy = y0 + 9 + floor * STOREY
            for wx in (x + 7, x + 28):
                period_sash(p, wx, yy, 11, 17, seed + home,
                            roll(home, floor, seed + (wx - x)) < .5, curtains=True)
        upper_foot = y0 + (floors - 1) * STOREY
        p.line((x + 1, upper_foot + 1, x + bay - 2, upper_foot + 1), STONE[2])
        period_sash(p, x + 6, foot - 28, 14, 20, seed + home + 1,
                    roll(home, 7, seed) < .55, curtains=True)
        dx = x + 31
        panel_door(p, dx, foot, seed + home, colour)
        p.line((x + 2, y0 + 4, x + 2, foot - 3), FIRED[3])
        p.line((x + bay - 2, y0 + 4, x + bay - 2, foot - 3), COMMON[1])
        # Rainwater pipes follow the party walls, clear of doors and glazing.
        p.line((x + bay - 1, y0 + 2, x + bay - 1, foot - 2), IRON[0])
        p.line((x + bay - 2, y0 + 5, x + bay - 2, foot - 2), IRON[1])
        p.rect((x, foot - 3, dx - 4, foot), COMMON[0])
        p.line((x, foot - 3, dx - 4, foot - 3), FIRED[2])
        p.rect((dx + 13, foot - 3, x + bay - 1, foot), COMMON[0])
        p.rect((dx + 11, foot - 20, dx + 14, foot - 16), BRONZE[1])
        p.px(dx + 12, foot - 19, BRONZE[4])
        # A low sill box is part of the building, not a baked patch of garden.
        if (home + seed) % 3 == 0:
            p.rect((x + 7, foot - 6, x + 18, foot - 4), PAINTED[1])
            p.line((x + 7, foot - 7, x + 18, foot - 7), PAINTED[3])
            for xx in (x + 9, x + 15):
                p.px(xx, foot - 8, '#c69586')
        chimney(p, x + 27, 11, 20, seed + home)
    return p, [W // 16, 5], f'{houses} houses / {floors} storeys'


def shopfront(p, x, y, w, h, seed, shop=PAINTED):
    foot = y + h
    p.rect((x, y, x + w - 1, foot), shop[2])
    p.rect((x + 2, y + 2, x + w - 3, y + 8), shop[0])
    p.line((x + 2, y + 2, x + w - 3, y + 2), shop[3])
    word = 'GROCER' if seed % 2 == 0 else 'CHEMIST'
    letters(p, word, x + max(3, (w - len(word) * 4) // 2), y + 3, '#ddc591')
    glass_y = y + 13
    dw = 10
    dx = x + w - dw - 5
    glass(p, x + 4, glass_y, w - dw - 13, h - 20, seed, True, frame=shop)
    glass(p, dx, foot - 23, dw, 18, seed + 1, True, frame=shop)
    p.rect((dx - 1, foot - 4, dx + dw, foot), shop[1])
    p.erase_glow((dx - 1, foot - 4, dx + dw, foot))
    p.px(dx + dw - 2, foot - 11, BRONZE[4])
    # Bottles and tins remain dark silhouettes against the night display.
    for index, xx in enumerate(range(x + 6, dx - 5, 5)):
        hh = 3 + index % 3
        c = ['#a99760', '#69846a', '#b38161', '#c2b298'][index % 4]
        p.rect((xx, foot - 8 - hh, xx + 2, foot - 7), c)
        p.rect((xx + 1, foot - 10 - hh, xx + 1, foot - 9 - hh), c)
        p.erase_glow((xx, foot - 10 - hh, xx + 2, foot - 7))
    p.rect((x + 2, foot - 5, dx - 3, foot), shop[1])
    p.line((x + 2, foot - 5, dx - 3, foot - 5), shop[3])
    p.erase_glow((x + 2, foot - 5, dx - 3, foot))
    for xx in (x, x + w - 3):
        p.rect((xx, y, xx + 2, foot), shop[1])
        p.line((xx, y, xx, foot), shop[3])
    # A shallow rolled canvas canopy, restrained enough to leave the sign visible.
    for yy in range(y + 9, y + 13):
        for xx in range(x + 1, x + w - 1):
            colour = '#cdc7a6' if ((xx - x) // 4) % 2 else shop[2]
            p.px(xx, yy, colour)
    p.line((x + 1, y + 13, x + w - 2, y + 13), shop[0])
    p.erase_glow((x + 1, y + 9, x + w - 2, y + 13))


def corner_shop(seed=0, large=False):
    W, D = (160 if large else 128), side_depth(6)
    floors = 4 if large else 3
    y0, shop_h = 57, 41
    H = shop_h + (floors - 1) * STOREY
    foot = y0 + H
    p = Paint(W + D + 3, foot + 4)
    brick = FIRED if seed % 2 == 0 else ['#4d3935', '#755049', '#95665b', '#af8171', '#c59a85']
    shop = PAINTED if seed % 2 == 0 else ['#322b32', '#51404b', '#705661', '#987783', '#c9afb4']
    masonry(p, (0, y0, W - 1, foot), brick, seed, course=3, stretch=8)
    def returned(f):
        masonry(f, (0, 0, D - 1, H), COMMON, seed + 3, course=3, stretch=7)
        for n in range(floors - 1):
            period_sash(f, 3, 9 + n * STOREY, 5, 15, seed + n, n % 2 == 0, pal=STONE)
        gy = H - shop_h
        f.rect((0, gy, D - 1, H), shop[1])
        glass(f, 2, gy + 14, D - 4, shop_h - 21, seed, True, frame=shop)
        f.rect((0, gy + 2, D - 1, gy + 8), shop[0])
        f.line((0, gy + 2, D - 1, gy + 2), shop[2])
    side(p, W, y0, D, H, COMMON, returned)
    # A mansard roof gives the commercial corner an attic rather than another box.
    ridge_y = 23
    plane = [(0, y0 - 5), (W - 1, y0 - 5), (W + 7, ridge_y), (8, ridge_y)]
    shingle_plane(p, plane, SLATE, seed, origin=ridge_y)
    p.poly([(W - 1, y0 - 5), (W + D - 1, y0 - D - 5),
            (W + 7, ridge_y), (W - 1, ridge_y)], SLATE[1])
    flat_roof(p, 8, ridge_y - 1, W, 4, STONE, '#727970')
    bays = W // 32
    for bay in range(bays):
        x = 6 + bay * 32
        for floor in range(floors - 1):
            yy = y0 + 9 + floor * STOREY
            period_sash(p, x + 2, yy, 12, 17, seed + bay + floor,
                        roll(bay, floor, seed + 7) < .5, pal=STONE, curtains=True)
            period_sash(p, x + 19, yy, 7, 17, seed + bay + floor + 1,
                        roll(bay, floor, seed + 8) < .4, pal=STONE)
        dormer_x = x + 7
        p.rect((dormer_x - 2, 34, dormer_x + 12, 49), STONE[2])
        p.poly([(dormer_x - 4, 34), (dormer_x + 5, 27), (dormer_x + 14, 34)], STONE[3])
        p.line((dormer_x - 4, 34, dormer_x + 5, 27, dormer_x + 14, 34), STONE[4])
        period_sash(p, dormer_x + 1, 36, 8, 11, seed + bay,
                    roll(bay, 4, seed) < .3, pal=STONE)
        p.line((x - 3, y0 + 5, x - 3, foot - shop_h), brick[3])
    p.rect((0, y0 - 4, W - 1, y0 + 2), PAINTED[1])
    p.line((0, y0 - 4, W - 1, y0 - 4), STONE[4])
    p.line((0, y0 - 2, W - 1, y0 - 2), PAINTED[3])
    for x in range(4, W - 3, 8):
        p.rect((x, y0 - 1, x + 2, y0 + 2), PAINTED[2])
        p.px(x, y0 - 1, PAINTED[4])
    gy = foot - shop_h
    p.rect((0, gy - 3, W - 1, gy - 1), STONE[2])
    p.line((0, gy - 3, W - 1, gy - 3), STONE[4])
    # One broad shop and a separate stair door preserve mixed commercial use.
    entrance = W - 19
    shopfront(p, 3, gy, W - 27, shop_h - 1, seed, shop)
    panel_door(p, entrance, foot - 1, seed, shop)
    p.rect((W - 5, gy, W - 1, foot), shop[1])
    p.line((W - 5, gy, W - 5, foot), shop[3])
    p.rect((0, foot, W - 1, foot + 1), STONE[1])
    p.line((0, foot, W - 1, foot), STONE[3])
    chimney(p, 17, 11, 19, seed)
    chimney(p, W - 23, 13, 19, seed + 1)
    return p, [W // 16, 6], f'{floors} storeys + attic'


def mill_window(p, x, y, w, h, seed, lit=True):
    p.rect((x - 1, y - 1, x + w, y + h), FIRED[0])
    p.rect((x, y, x + w - 1, y + h - 1), GLASS[1])
    p.rect((x, y, x + w - 1, y + h // 3), GLASS[2])
    if lit:
        p.glow((x, y, x + w - 1, y + h - 1), WARM)
    for yy in range(y + 3, y + h, 4):
        p.line((x, yy, x + w - 1, yy), IRON[1])
        p.erase_glow((x, yy, x + w - 1, yy))
    for xx in range(x + 3, x + w, 4):
        p.line((xx, y, xx, y + h - 1), IRON[1])
        p.erase_glow((xx, y, xx, y + h - 1))
    # Segmental heads: a shallow arch of rubbed brick with a stone keystone.
    for i in range(-2, w + 2):
        rise = 2 if w // 4 < i < 3 * w // 4 else 1 if 0 < i < w - 1 else 0
        p.px(x + i, y - 2 - rise, FIRED[3])
        p.px(x + i, y - 3 - rise, FIRED[1])
    p.rect((x + w // 2 - 1, y - 5, x + w // 2 + 1, y - 3), STONE[2])
    p.line((x - 2, y + h + 1, x + w + 1, y + h + 1), STONE[3])
    p.line((x - 2, y + h + 2, x + w + 1, y + h + 2), STONE[1])
    if seed % 5 == 0:
        p.rect((x + 1, y + h - 6, x + 2, y + h - 4), '#9bada0')
        p.erase_glow((x + 1, y + h - 6, x + 2, y + h - 4))


def mill_stack(p, x, bottom, top, seed):
    height = bottom - top
    for y in range(top, bottom + 1):
        width = 5 + (y - top) * 4 // height
        for dx in range(-width, width + 1):
            c = FIRED[3] if dx < -width // 2 else FIRED[2] if dx < width // 2 else FIRED[1]
            if y % 3 == 2:
                c = FIRED[2] if dx < -width // 2 else FIRED[1] if dx < width // 2 else COMMON[1]
            p.px(x + dx, y, c)
        if y in (top + height // 3, top + 2 * height // 3):
            p.line((x - width, y, x + width, y), IRON[1])
    for y, width, colour in [(top - 4, 7, FIRED[3]), (top - 3, 7, STONE[2]),
                              (top - 2, 6, FIRED[1]), (top - 1, 5, FIRED[3])]:
        p.line((x - width, y, x + width, y), colour)
    p.line((x - 4, top - 4, x + 4, top - 4), COMMON[0])


def factory(seed=0, large=False):
    W, D = (192 if large else 160), side_depth(8)
    floors = 4 if large else 3
    y0 = 111
    H = 40 + (floors - 1) * STOREY
    foot = y0 + H
    p = Paint(W + D + 3, foot + 5)
    stack_x = W - 25 if seed % 2 == 0 else 28
    mill_stack(p, stack_x, foot - D, 15, seed)
    masonry(p, (0, y0, W - 1, foot), FIRED, seed, course=3, stretch=8)
    def return_wall(f):
        masonry(f, (0, 0, D - 1, H), COMMON, seed + 8, course=3, stretch=7)
        for floor in range(floors):
            yy = 10 + floor * STOREY
            mill_window(f, 3, yy, 6, 17, seed + floor, floor % 2 == 0)
        f.line((0, H - 4, D - 1, H - 4), STONE[1])
    side(p, W, y0, D, H, COMMON, return_wall)
    pitched_range(p, 0, y0 - 5, W, D, seed, rise=21)
    # A short clerestory lights the central working floor.
    monitor_x = W // 2 - 23
    box3(p, monitor_x, y0 - 31, 46, 12, 5, IRON)
    for index, x in enumerate(range(monitor_x + 3, monitor_x + 42, 6)):
        p.rect((x, y0 - 28, x + 3, y0 - 22), GLASS[2])
        p.line((x, y0 - 28, x + 3, y0 - 28), GLASS[3])
        if roll(index, 3, seed) < .55:
            p.glow((x, y0 - 28, x + 3, y0 - 22), WARM)
    p.line((monitor_x - 2, y0 - 32, monitor_x + 46, y0 - 32), STONE[3])
    # Corbelled eaves, brick pilasters and floor ties carry the industrial rhythm.
    p.rect((0, y0 - 4, W - 1, y0 + 3), FIRED[2])
    p.line((0, y0 - 4, W - 1, y0 - 4), STONE[3])
    for x in range(3, W - 2, 4):
        p.rect((x, y0, x + 1, y0 + 3), FIRED[3])
        p.px(x + 2, y0 + 3, FIRED[0])
    bays = W // 32
    for bay in range(bays):
        x = bay * 32
        for floor in range(floors - 1):
            yy = y0 + 12 + floor * STOREY
            mill_window(p, x + 8, yy, 18, 17, seed + floor + bay,
                        roll(bay, floor, seed + 6) < .8)
            p.line((x + 4, yy + 23, x + 29, yy + 23), COMMON[1])
            p.line((x + 4, yy + 22, x + 29, yy + 22), FIRED[3])
        for px in (x + 1, x + 3):
            p.line((px, y0 + 4, px, foot - 4), FIRED[3] if px == x + 1 else FIRED[1])
        p.rect((x, y0 + 5, x + 4, y0 + 6), STONE[2])
        p.rect((x, foot - 5, x + 4, foot), STONE[1])
        # Cross-shaped iron tie plates are placed on floor lines, not scattered.
        for n in range(floors - 1):
            yy = y0 + 7 + n * STOREY
            p.line((x + 4, yy - 1, x + 7, yy + 2), IRON[0])
            p.line((x + 7, yy - 1, x + 4, yy + 2), IRON[0])
    ground_y = foot - 40
    for bay in range(bays):
        if bay in (bays // 2, bays - 1):
            continue
        mill_window(p, bay * 32 + 8, ground_y + 11, 18, 22, seed + bay,
                    roll(bay, 9, seed) < .75)
    dock_x = bays // 2 * 32 + 4
    p.rect((dock_x - 1, foot - 30, dock_x + 25, foot), COMMON[0])
    p.rect((dock_x, foot - 28, dock_x + 24, foot - 2), '#74543e')
    for x in range(dock_x + 2, dock_x + 24, 3):
        p.line((x, foot - 28, x, foot - 2), '#9a7753')
    p.line((dock_x + 12, foot - 28, dock_x + 12, foot - 2), COMMON[0])
    for y in (foot - 23, foot - 7):
        p.line((dock_x + 1, y, dock_x + 10, y), IRON[0])
        p.line((dock_x + 14, y, dock_x + 23, y), IRON[0])
    p.line((dock_x + 1, foot - 25, dock_x + 10, foot - 7), '#b39064')
    p.line((dock_x + 14, foot - 7, dock_x + 23, foot - 25), '#b39064')
    p.rect((dock_x - 3, foot - 31, dock_x + 27, foot - 30), IRON[1])
    p.line((dock_x - 3, foot - 31, dock_x + 27, foot - 31), IRON[3])
    p.rect((dock_x - 2, foot - 1, dock_x + 26, foot + 2), STONE[2])
    p.line((dock_x - 2, foot - 1, dock_x + 26, foot - 1), STONE[4])
    # Hoist beam and hanging hook stay clear of both working door leaves.
    beam_y = ground_y - 1
    p.rect((dock_x + 10, beam_y - 2, dock_x + 14, beam_y + 1), '#78583f')
    p.line((dock_x + 14, beam_y + 1, dock_x + 21, beam_y - 5), IRON[1])
    p.line((dock_x + 12, beam_y + 2, dock_x + 12, foot - 33), IRON[1])
    p.line((dock_x + 12, foot - 33, dock_x + 14, foot - 32, dock_x + 15, foot - 34), IRON[2])
    # A small workers' door occupies the last bay and retains the shared leaf size.
    dx = W - 20
    p.rect((dx - 3, foot - 33, dx + 12, foot - 29), FIRED[1])
    for xx in range(dx - 2, dx + 12, 3):
        p.line((xx, foot - 32, xx, foot - 30), COMMON[0])
    p.rect((dx - 2, foot - 25, dx + 11, foot), FIRED[0])
    p.rect((dx, foot - 23, dx + 9, foot - 1), PAINTED[1])
    glass(p, dx + 2, foot - 21, 5, 6, seed, True, frame=PAINTED)
    p.px(dx + 8, foot - 11, BRONZE[3])
    p.rect((dx - 2, foot, dx + 11, foot + 1), STONE[2])
    # A painted name tablet is one composed mark rather than random lettering.
    plaque_y = y0 + 5
    p.rect((W // 2 - 30, plaque_y, W // 2 + 30, plaque_y + 7), '#403b32')
    p.line((W // 2 - 30, plaque_y, W // 2 + 30, plaque_y), STONE[2])
    word = 'COTTON MILL' if seed % 2 == 0 else 'IRON WORKS'
    letters(p, word, W // 2 - len(word) * 2, plaque_y + 2, '#d3c6a1')
    p.rect((0, foot - 2, dock_x - 4, foot), STONE[1])
    p.rect((dock_x + 28, foot - 2, W - 1, foot), STONE[1])
    return p, [W // 16, 8], f'{floors} storeys / steam mill'


def night(im, em):
    out = im.copy()
    pixels = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = pixels[x, y]
            if a:
                pixels[x, y] = (int(r * .30 + 8), int(g * .34 + 10), int(b * .50 + 22), a)
    out.alpha_composite(em)
    return out


def font(size):
    try:
        return ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', size)
    except OSError:
        return ImageFont.load_default()


def make_sheet(records, title='CODEX / MODERN OBLIQUE STUDIES', save=True):
    pad = 14
    figure = current_adult()
    column = max(p.im.width for _, variants in records for p, _, _ in variants) + figure.width + 3 * pad
    width = column * 3 + pad * 4
    row_heights = [max(p.im.height for p, _, _ in variants) + 60 for _, variants in records]
    height = 48 + sum(row_heights) + 76
    sheet = Image.new('RGBA', (width, height), '#182038')
    d = ImageDraw.Draw(sheet)
    d.text((pad, 12), title, fill='#efdab0', font=font(11))
    d.text((pad, 29), 'Native sprites - live adult for scale - 12px returns - upper-left light', fill='#acb6c2', font=font(7))
    y = 48
    for (title, variants), row_h in zip(records, row_heights):
        d.text((pad, y + 3), title, fill='#efdab0', font=font(9))
        y0 = y + 20
        for col in range(3):
            p, footprint, label = variants[min(col, 1)] if col < 2 else variants[0]
            im = p.im if col < 2 else night(p.im, p.em)
            x = pad + col * (column + pad)
            panel_h = row_h - 42
            d.rectangle((x, y0, x + column - 1, y0 + panel_h - 1), fill='#68864e' if col < 2 else '#202e29')
            ground = y0 + panel_h - 8
            d.rectangle((x, ground, x + column - 1, y0 + panel_h - 1), fill='#919187' if col < 2 else '#343941')
            sx = x + (column - im.width - figure.width - pad) // 2
            sheet.alpha_composite(im, (sx, ground - im.height + 1))
            person = figure if col < 2 else night(figure, Image.new('RGBA', figure.size))
            sheet.alpha_composite(person, (sx + im.width + 10, ground - person.height + 1))
            caption = f'{footprint[0]}x{footprint[1]} tiles / {label}' if col < 2 else 'After dark / same sprite'
            d.text((x + 3, y0 + panel_h + 3), caption, fill='#aebbd0', font=font(7))
        y += row_h
    d.text((pad, y + 2), 'GROUND-FLOOR DETAILS / SOURCE PIXELS PRESERVED', fill='#efdab0', font=font(8))
    x = pad
    for _, variants in records:
        p = variants[0][0]
        thumb = p.im
        # A native-resolution detail strip keeps the tall tower's doorway visible.
        detail = thumb.crop((0, max(0, thumb.height - 48), thumb.width, thumb.height))
        sheet.alpha_composite(detail, (x, y + 18))
        sheet.alpha_composite(figure, (x + detail.width + 7, y + 18 + detail.height - figure.height))
        x += column + pad
    if save:
        sheet.save(OUT / 'contact-sheet-native.png')
        sheet.resize((width * 3, height * 3), Image.Resampling.NEAREST).save(OUT / 'contact-sheet.png')
    return sheet


def main():
    global OUT
    records = []
    metadata = {}
    nineteenth = len(sys.argv) > 1 and sys.argv[1] == '19th-century'
    landmarks = len(sys.argv) > 1 and sys.argv[1] == 'landmarks'
    families = [
        ('station', '01 / Railway station / vaulted concourse + clock tower', station),
        ('market', '02 / Covered market / clerestory + four trading bays', market),
        ('hospital', '03 / General hospital / shaded wards + glazed circulation core', hospital),
    ] if landmarks else [
        ('terrace', '01 / Victorian workers\' terrace / c.1870-1890', terrace),
        ('corner-shop', '02 / Corner shop and flats / c.1880-1900', corner_shop),
        ('factory', '03 / Brick steam mill / c.1860-1890', factory),
    ] if nineteenth else [
        ('art-deco', '01 / Art Deco commercial tower / c.1930', deco),
        ('apartment', '02 / Postwar apartment slab / c.1965-1980', apartment),
        ('split-level', '03 / North American split-level house / c.1970-1980', split_level),
    ]
    if nineteenth or landmarks:
        OUT = OUT / ('landmarks' if landmarks else '19th-century')
        OUT.mkdir(exist_ok=True)
    for slug, title, painter in families:
        variants = []
        for index, (seed, large) in enumerate([(2, False), (5, True)]):
            p, footprint, label = painter(seed, large)
            stem = f'{slug}-{index + 1}'
            p.im.save(OUT / f'{stem}.png')
            p.em.save(OUT / f'{stem}-emissive.png')
            night(p.im, p.em).save(OUT / f'{stem}-night.png')
            # Magnified transparent sprite for individual visual inspection.
            p.im.resize((p.im.width * 4, p.im.height * 4), Image.Resampling.NEAREST).save(OUT / f'{stem}-4x.png')
            variants.append((p, footprint, label))
            metadata[stem] = {'footprint': footprint, 'sourceSize': list(p.im.size),
                              'sideDepth': side_depth(footprint[1]), 'seed': seed,
                              'integrated': False, 'description': label}
            if slug == 'factory':
                metadata[stem]['smoke'] = [[footprint[0] * 16 - 25 if seed % 2 == 0 else 28, 10, 'chimney']]
        records.append((title, variants))
    title = 'CODEX / MODERN CIVIC LANDMARKS' if landmarks else 'CODEX / NINETEENTH-CENTURY STUDIES' if nineteenth else 'CODEX / MODERN OBLIQUE STUDIES'
    sheet = make_sheet(records, title)
    if landmarks:
        animation_frames = []
        for frame in range(16):
            animated = [(name, [painter(2, False, frame), records[n][1][1]])
                        for n, (_, name, painter) in enumerate(families)]
            animation_frames.append(make_sheet(animated, title, save=False).convert('RGB'))
        palette = sheet.convert('RGB').quantize(colors=128)
        gifs = [im.quantize(palette=palette, dither=Image.Dither.NONE).resize(
            (im.width * 2, im.height * 2), Image.Resampling.NEAREST) for im in animation_frames]
        gifs[0].save(OUT / 'contact-sheet-animated.gif', save_all=True,
                     append_images=gifs[1:], duration=180, loop=0, disposal=1, optimize=False)
        for slug, _, painter in families:
            frames = [painter(2, False, frame)[0] for frame in range(16)]
            base = frames[0]
            if slug == 'station':
                regions = {'clock': (189, 56, 214, 81),
                           'departure-board': (81, 114, 139, 125)}
            elif slug == 'market':
                regions = {'extractor': (105, 42, 120, 57)}
                for n, x in enumerate((7, 51, 136, 180)):
                    regions[f'banner-{n + 1}'] = (x + 25, 108, x + 35, 122)
            else:
                foot = base.im.height - 5
                regions = {'roof-fan': (97, 39, 109, 47), 'lift': (201, 69, 211, foot - 24),
                           'sliding-doors': (65, foot - 26, 115, foot - 3),
                           'ward-light': (39, 89, 63, 104)}
            for name, box in regions.items():
                atlas = Image.new('RGBA', ((box[2] - box[0]) * 16, box[3] - box[1]))
                emissions = Image.new('RGBA', atlas.size)
                for frame, p in enumerate(frames):
                    atlas.alpha_composite(p.im.crop(box), (frame * (box[2] - box[0]), 0))
                    emissions.alpha_composite(p.em.crop(box), (frame * (box[2] - box[0]), 0))
                atlas.save(OUT / f'{slug}-{name}-animation.png')
                emissions.save(OUT / f'{slug}-{name}-animation-emissive.png')
            metadata[f'{slug}-1']['animation'] = {'frames': 16, 'previewFrameMs': 180,
                                                  'patchRegions': regions, 'integrated': False}
    ImageOps.grayscale(sheet).save(OUT / 'contact-sheet-grayscale.png')
    (OUT / 'studies.json').write_text(json.dumps(metadata, indent=2) + '\n')
    print(OUT / 'contact-sheet.png')
    print(f'Native contact sheet: {sheet.width}x{sheet.height}; display: 3x nearest-neighbour')


if __name__ == '__main__':
    main()
