"""Street furniture for the industrial and modern city, to the city kit's
standard and scale: the adult is 37px, a bench seat is knee high at 11px."""
import math

from art.city_kit import (C, outline, sphere, mix, morris_column, market_stall,
                          IRON, GREEN, OAK, LIME, LEAF, BARK, TERRA, RED, GOLD, CREAM, NAVY, PAVE)
from art.oblique_style import drift

CONCRETE = ['#2e2c38', '#4e4b56', '#6f6b72', '#8e8a8c', '#aba6a2', '#c8c2ba']
STEEL = ['#1c2230', '#2e3746', '#4a5566', '#6c7888', '#98a4b0', '#c6ced4']
INKY = (18, 12, 28)
PALE = ['#3a2418', '#5e3c26', '#86583a', '#a8774e', '#c89a68', '#e2bd88']
URN = ['#141a1e', '#1f2a2c', '#2e3d3c', '#445650', '#5f7466', '#8aa08a']
GLOW = ['#d4b060', '#f2dea0', '#fbf0c8']
BLOOMS = [RED, ['#5a2a6a', '#8a3a9a', '#c060c0', '#f0a0e8'], ['#6a4a08', '#c09018', '#f0c838', '#fff080'],
          ['#8a8078', '#c8c0b8', '#f0ece4', '#ffffff']]


def _slats(c, x0, x1, y0, rows, ramp, back=0):
    """A slatted plane seen a little from above: each row one slat or one gap,
    receding up and drifting right."""
    for k in range(rows):
        dx = drift(rows - 1 - k + back, 8)
        col = ramp[4] if k % 2 == 0 else ramp[1]
        c.hl(x0 + dx, x1 + dx, y0 + k, col)
        if k % 2 == 0:
            c.px(x0 + dx, y0 + k, ramp[5])


def bench(v=0):
    """0 timber, 1 Parisian cast iron and green slats, 2 Soviet concrete ends,
    3 modern galvanised steel."""
    W, b = 40, 25
    c = C(W, b + 1)
    seat = b - 11
    slat = [OAK, GREEN, PALE, STEEL][v]
    ends = (4, W - 8)
    # Rear legs first: they sit behind and above the front ones.
    for x in ends:
        if v == 2:
            continue
        leg = OAK if v == 0 else IRON if v == 1 else STEEL
        c.rect(x + 3, seat, x + 3, b - 2, leg[1])
    # Back: three slats standing behind the seat, leaning back a little.
    for i, y in enumerate((b - 23, b - 20, b - 17)):
        dx = 2 + (2 - i) // 2
        c.hl(3 + dx, W - 5 + dx, y, slat[4] if i < 2 else slat[3])
        c.hl(3 + dx, W - 5 + dx, y + 1, slat[2])
        c.px(3 + dx, y, slat[5])
    _slats(c, 2, W - 6, seat - 3, 4, slat)
    c.hl(2, W - 6, seat + 1, slat[3])
    c.hl(2, W - 6, seat + 2, slat[1])
    for x in ends:
        if v == 0:
            c.rect(x, seat + 1, x + 1, b, OAK[3])
            c.vl(x, seat + 1, b, OAK[5])
            c.rect(x + 2, b - 23, x + 3, seat - 3, OAK[2])
            c.hl(x - 1, x + 3, seat - 5, OAK[4])
        elif v == 1:
            # Edge-on end frame: scrolled arm, front leg with a claw foot.
            c.rect(x + 2, b - 24, x + 3, seat - 3, IRON[1])
            c.vl(x + 2, b - 24, seat - 3, IRON[3])
            c.hl(x - 1, x + 3, seat - 6, IRON[2])
            c.px(x - 1, seat - 5, IRON[2])
            c.vl(x, seat - 5, seat, IRON[1])
            c.rect(x, seat + 1, x + 1, b - 1, IRON[1])
            c.vl(x, seat + 1, b - 1, IRON[3])
            c.hl(x - 1, x + 2, b, IRON[1])
            c.px(x + 2, seat + 3, IRON[2])
        elif v == 2:
            # A cast concrete trestle carrying the slats: splayed foot, square arm.
            for y in range(seat - 4, b + 1):
                spread = (y - seat + 4) // 5
                c.hl(x - spread, x + 3 + spread, y, CONCRETE[3])
                c.px(x - spread, y, CONCRETE[5])
                c.px(x + 3 + spread, y, CONCRETE[1])
            c.hl(x, x + 3, seat - 4, CONCRETE[5])
            c.rect(x + 2, b - 24, x + 2, seat - 5, IRON[2])
        else:
            c.rect(x, seat + 1, x + 1, b, STEEL[2])
            c.vl(x, seat + 1, b, STEEL[5])
            c.rect(x + 2, b - 24, x + 3, seat - 3, STEEL[2])
            c.vl(x + 2, b - 24, seat - 3, STEEL[4])
            c.hl(x - 1, x + 4, seat - 6, STEEL[3])
            c.hl(x - 1, x + 4, seat - 5, STEEL[1])
            c.vl(x - 1, seat - 5, seat, STEEL[2])
    return outline(c.im)


def bin_(v=0):
    """0 cast-iron basket on a post, 1 Soviet concrete urn, 2 modern steel bin
    with a hood."""
    if v == 0:
        c = C(14, 20)
        b = 19
        c.rect(6, b - 7, 7, b, IRON[1])
        c.vl(6, b - 7, b, IRON[3])
        c.hl(4, 9, b, IRON[1])
        for y in range(b - 18, b - 6):
            t = (y - (b - 18)) / 12
            half = round(6 - t * 2)
            for x in range(7 - half, 7 + half):
                bar = (x - (7 - half)) % 2 == 0
                c.px(x, y, (GREEN[4] if x < 5 else GREEN[3] if x < 9 else GREEN[2]) if bar else GREEN[0])
        c.hl(1, 12, b - 18, GREEN[5])
        c.hl(1, 12, b - 17, GREEN[2])
        c.hl(3, 10, b - 11, GREEN[3])
        c.hl(4, 9, b - 7, GREEN[2])
        return outline(c.im)
    if v == 1:
        c = C(14, 18)
        b = 17
        prof = [2, 3, 3, 4, 4, 4, 3, 3, 2, 2, 1, 1]
        for y in range(b - 15, b + 1):
            t = (y - (b - 15)) / 15
            half = round(6 - 2.5 * math.sin(t * math.pi * 0.9))
            if y > b - 3:
                half = 4
            for x in range(7 - half, 7 + half):
                k = prof[min(11, int((x - (7 - half)) / (2 * half) * 12))]
                c.px(x, y, CONCRETE[k])
        c.ellipse(7, b - 15, 5.5, 1.6, CONCRETE[1])
        c.hl(3, 10, b - 16, CONCRETE[5])
        c.hl(3, 10, b - 3, CONCRETE[2])
        return outline(c.im)
    c = C(14, 22)
    b = 21
    for x in range(1, 13):
        k = 4 if x < 4 else 3 if x < 8 else 2 if x < 11 else 1
        c.vl(x, b - 17, b - 1, STEEL[k])
    for y in range(b - 14, b - 2, 2):
        c.hl(2, 11, y, STEEL[1])
    c.rect(0, b - 20, 13, b - 17, GREEN[3])
    c.hl(0, 13, b - 20, GREEN[5])
    c.rect(4, b - 18, 9, b - 17, IRON[0])
    c.hl(1, 12, b, STEEL[1])
    return outline(c.im)


def bollard(v=0):
    """0 cast-iron cannon bollard, 1 concrete post with a chamfered cap."""
    c = C(10, 15)
    b = 14
    if v == 0:
        prof = [1, 3, 3, 2, 2, 1, 0]
        for y in range(b - 12, b + 1):
            half = 3 if y > b - 3 else 2
            for i, x in enumerate(range(5 - half, 5 + half)):
                c.px(x, y, IRON[prof[min(6, i + (3 - half))]])
        c.rect(2, b - 13, 7, b - 11, IRON[2])
        c.hl(3, 6, b - 14, IRON[3])
        c.px(3, b - 13, '#6a6c88')
        c.hl(1, 8, b - 3, IRON[3])
        return outline(c.im)
    for y in range(b - 11, b + 1):
        for x in range(1, 9):
            c.px(x, y, CONCRETE[5 if x < 3 else 4 if x < 6 else 2])
    c.hl(2, 7, b - 12, CONCRETE[5])
    c.hl(3, 6, b - 13, CONCRETE[4])
    c.hl(1, 8, b - 8, CONCRETE[1])
    c.hl(1, 8, b - 7, '#d8c24a')
    return outline(c.im)


def planter(v=0):
    """0 cast-iron urn of bedding plants, 1 Versailles box with a clipped bay,
    2 concrete trough of shrubs."""
    if v == 0:
        c = C(22, 30)
        b = 29
        c.rect(7, b - 3, 14, b, URN[2])
        c.vl(7, b - 3, b, URN[4])
        c.rect(9, b - 8, 12, b - 4, URN[2])
        c.vl(9, b - 8, b - 4, URN[4])
        for y in range(b - 17, b - 8):
            t = (y - (b - 17)) / 8
            half = round(9 - t * t * 5)
            for x in range(11 - half, 11 + half):
                f = (x - (11 - half)) / (2 * half)
                c.px(x, y, URN[4] if f < 0.2 else URN[3] if f < 0.5 else URN[2] if f < 0.8 else URN[1])
        c.hl(1, 20, b - 18, URN[5])
        c.hl(1, 20, b - 17, URN[2])
        for x in range(4, 19, 3):
            c.px(x, b - 14, URN[5])
        sphere(c, 11, b - 20, 8.5, LEAF, lo=1, hi=5, flat=0.45)
        c.hl(1, 20, b - 18, URN[5])
        c.hl(1, 20, b - 17, URN[2])
        for i, (x, y) in enumerate(((5, 22), (8, 25), (12, 26), (15, 23), (17, 20), (10, 21), (6, 19), (14, 19))):
            col = BLOOMS[i % 2]
            c.px(x, b - y, col[2])
            c.px(x + 1, b - y, col[1])
            c.px(x, b - y - 1, col[3])
        return outline(c.im)
    if v == 1:
        c = C(22, 40)
        b = 39
        x0, x1, top = 3, 17, b - 14
        for y in range(top - 2, top + 1):
            dx = drift(top - y, 3)
            c.hl(x0 + dx + 1, x1 + dx, y, '#3a2c20')
        c.rect(x1 + 1, top - 1, x1 + 3, b - 1, GREEN[1])
        c.rect(x0, top, x1, b - 1, GREEN[3])
        for x in (7, 13):
            c.vl(x, top + 2, b - 3, GREEN[2])
            c.vl(x + 1, top + 2, b - 3, GREEN[4])
        c.hl(x0 + 2, x1 - 2, top + 2, GREEN[4])
        c.hl(x0 + 2, x1 - 2, b - 3, GREEN[2])
        for x in (x0, x1):
            c.rect(x, top - 1, x + 1, b, IRON[1])
            c.vl(x, top - 1, b, IRON[3])
            sphere(c, x + 1, top - 2, 1.6, GOLD)
        c.vl(10, top - 9, top - 2, BARK[3])
        c.vl(11, top - 9, top - 2, BARK[1])
        sphere(c, 10.5, top - 15, 8.5, LEAF, lo=1)
        return outline(c.im)
    c = C(44, 22)
    b = 21
    top = b - 10
    for y in range(top - 3, top):
        dx = drift(top - y, 3)
        c.hl(2 + dx, 38 + dx, y, CONCRETE[4])
    c.rect(39, top - 2, 41, b - 1, CONCRETE[2])
    c.rect(1, top, 38, b, CONCRETE[3])
    c.hl(1, 38, top, CONCRETE[5])
    c.vl(1, top, b, CONCRETE[4])
    for x in range(6, 38, 8):
        c.vl(x, top + 2, b - 1, CONCRETE[2])
    for i, cx in enumerate((8, 16, 25, 33)):
        sphere(c, cx, top - 4 - (i % 2), 5 + (i % 2), LEAF[:6], lo=0, hi=5, flat=0.6)
    return outline(c.im)


def tree_grate(v=0):
    """A cast-iron tree grate on the ground, rings of slots round the trunk."""
    c = C(30, 11)
    c.rect(0, 0, 29, 10, IRON[1])
    c.hl(0, 29, 0, IRON[3])
    c.vl(0, 0, 10, IRON[2])
    for k, (rx, ry) in enumerate(((13, 4.4), (10, 3.4), (7, 2.4))):
        c.ellipse(15, 5.5, rx, ry, IRON[0] if k % 2 == 0 else IRON[2])
        c.ellipse(15, 5.5, rx - 1.5, ry - 0.8, IRON[1] if k % 2 == 0 else IRON[0])
    for x in range(3, 28, 3):
        c.vl(x, 1, 9, IRON[1])
    c.ellipse(15, 5.5, 4.5, 1.8, '#3a2c22')
    c.hl(12, 18, 4, '#5a4432')
    return c.im


def gully(v=0):
    """A kerbside gully grate: iron bars in a granite surround."""
    c = C(18, 7)
    c.rect(0, 0, 17, 6, PAVE[4])
    c.hl(0, 17, 0, PAVE[5])
    c.rect(2, 1, 15, 5, IRON[0])
    for x in range(3, 15, 2):
        c.vl(x, 1, 5, IRON[2])
    c.hl(2, 15, 1, IRON[3])
    return c.im


def news_kiosk(v=0):
    """A Parisian newspaper kiosk: three faces of a hexagon in green iron,
    a scalloped dome with a finial, the day's papers pinned round the hatch."""
    W = 32
    c = C(W, 52)
    b = 51
    faces = [(1, 6, GREEN[4]), (7, 24, GREEN[3]), (25, 30, GREEN[1])]
    for x0, x1, col in faces:
        c.rect(x0, b - 30, x1, b - 1, col)
    c.hl(0, 31, b, IRON[1])
    for x0, x1, col in faces:
        c.rect(x0, b - 4, x1, b - 1, mix(col, IRON[0], 0.35))
    for x in (6, 24):
        c.vl(x, b - 34, b, IRON[1])
    c.rect(9, b - 24, 22, b - 11, '#2a2230')
    c.rect(9, b - 11, 22, b - 9, GREEN[5])
    for i, x in enumerate(range(9, 22, 4)):
        c.rect(x, b - 23, x + 2, b - 17, CREAM[2] if i % 2 else '#e8e4d8')
        c.hl(x, x + 2, b - 21, '#7a7478')
        c.hl(x, x + 1, b - 19, '#9a9498')
        c.rect(x + 1, b - 16, x + 3, b - 12, [RED[2], NAVY[3], GOLD[2], '#d0703a'][i])
    for x0, x1, col, poster in ((1, 6, GREEN[4], RED[2]), (25, 30, GREEN[1], NAVY[3])):
        c.rect(x0 + 1, b - 25, x1 - 1, b - 8, mix(poster, INKY, 0.3 if x0 > 20 else 0))
        c.hl(x0 + 1, x1 - 1, b - 22, mix(CREAM[2], INKY, 0.35 if x0 > 20 else 0.05))
    c.rect(0, b - 34, 31, b - 30, GREEN[2])
    c.hl(0, 31, b - 34, GREEN[5])
    c.hl(8, 23, b - 32, GOLD[2])
    for x in range(0, 32):
        if x % 3 == 1:
            c.px(x, b - 29, GREEN[2])
    for i in range(12):
        half = round(16 * math.cos(i / 12 * math.pi / 2)) - (0 if i < 3 else 0)
        for x in range(16 - half, 16 + half):
            f = (x - (16 - half)) / max(1, 2 * half)
            c.px(x, b - 35 - i, GREEN[5] if f < 0.2 else GREEN[4] if f < 0.5 else GREEN[3] if f < 0.8 else GREEN[2])
    for x in range(1, 31, 4):
        c.px(x, b - 35, GREEN[1])
    c.vl(16, b - 50, b - 46, IRON[2])
    sphere(c, 16, b - 50, 1.6, GOLD)
    return outline(c.im)



def cafe(v=0):
    """A bistro table and two cane chairs at true height, 1 with a parasol."""
    c = C(36, 52)
    b = 51
    for cx in (6, 29):
        for y in range(b - 18, b - 9):
            for x in range(cx - 3, cx + 4):
                if abs(x - cx) == 3 or (y + x) % 2 == 0:
                    c.px(x, y, '#c9a868' if (x + y) % 2 else '#9a7a44')
        c.hl(cx - 3, cx + 3, b - 18, '#6a4a28')
        c.rect(cx - 4, b - 9, cx + 4, b - 8, '#b89458')
        c.hl(cx - 4, cx + 4, b - 9, '#e0c080')
        c.vl(cx - 3, b - 7, b, '#6a4a28')
        c.vl(cx + 3, b - 7, b, '#6a4a28')
        c.hl(cx - 3, cx + 3, b - 3, '#8a6a38')
    c.vl(17, b - 13, b - 1, IRON[1])
    c.vl(18, b - 13, b - 1, IRON[2])
    c.hl(14, 21, b, IRON[1])
    c.ellipse(17.5, b - 15, 7.5, 2.2, '#e9e5de')
    c.hl(11, 24, b - 14, '#a6a1a8')
    c.hl(12, 22, b - 16, '#fbf8f0')
    c.rect(13, b - 18, 14, b - 16, '#f4f4ff')
    c.px(20, b - 17, '#c8a060')
    c.px(21, b - 17, '#8a5a28')
    if v:
        c.vl(17, b - 46, b - 16, OAK[2])
        for i in range(9):
            y = b - 47 + i
            for x in range(17 - 2 - i * 2, 17 + 3 + i * 2):
                col = ['#efe6d0', '#b8323a'][((x - 17) // 3) % 2]
                if i > 6:
                    col = mix(col, INKY, 0.25)
                c.px(x, y, col)
        for x in range(0, 36, 3):
            c.px(x, b - 38, '#8e2430')
    return outline(c.im)


def barrow(v=0):
    """0 a flower seller's barrow of buckets, 1 a costermonger's fruit
    barrow, 2 a striped-awning stall."""
    if v == 2:
        return market_stall()
    c = C(42, 30)
    b = 29
    c.rect(4, b - 14, 33, b - 8, OAK[3])
    c.hl(4, 33, b - 14, OAK[5])
    c.vl(4, b - 14, b - 8, OAK[4])
    for x in range(9, 33, 6):
        c.vl(x, b - 13, b - 8, OAK[2])
    c.hl(4, 33, b - 8, OAK[1])
    c.rect(34, b - 13, 36, b - 9, OAK[1])
    for i in range(6):
        c.px(35 + i, b - 12 - i // 2, OAK[2])
        c.px(35 + i, b - 11 - i // 2, OAK[1])
    c.vl(6, b - 8, b, OAK[2])
    if v == 0:
        for k, cx in enumerate((8, 14, 20, 26, 31)):
            for x in range(cx - 2, cx + 3):
                c.vl(x, b - 18, b - 15, STEEL[4 if x < cx else 2])
            c.hl(cx - 2, cx + 2, b - 18, STEEL[5])
            sphere(c, cx, b - 21, 3.2, LEAF[:6], lo=1, hi=5, flat=0.6)
            ramp = BLOOMS[k % 4]
            for dx, dy in ((-2, 22), (0, 24), (2, 21), (1, 23), (-1, 20)):
                c.px(cx + dx, b - dy, ramp[2])
                c.px(cx + dx, b - dy - 1, ramp[3])
    else:
        fruit = [RED, ['#2a4a18', '#4a7a22', '#7ab038', '#a8d060'], ['#6a3208', '#b8601a', '#e89030', '#f8c060'],
                 GOLD]
        for k, ramp in enumerate(fruit):
            x0 = 5 + k * 7
            for j in range(3):
                sphere(c, x0 + 1.5 + j * 2, b - 15 - (j % 2), 1.8, ramp, lo=0, hi=3)
            for j in range(2):
                sphere(c, x0 + 2.5 + j * 2, b - 17, 1.8, ramp, lo=0, hi=3)
    for a in range(0, 360, 6):
        r = math.radians(a)
        c.px(round(20 + math.cos(r) * 6.5), round(b - 6 + math.sin(r) * 6.5), IRON[1])
        c.px(round(20 + math.cos(r) * 5.5), round(b - 6 + math.sin(r) * 5.5), OAK[3])
    for a in range(0, 180, 30):
        r = math.radians(a)
        for t in range(-5, 6):
            c.px(round(20 + math.cos(r) * t), round(b - 6 + math.sin(r) * t), OAK[2])
    c.px(20, b - 6, IRON[2])
    return outline(c.im)


def column(v=0):
    return morris_column()


def city_lamp(v=0):
    """0 a single cast-iron candelabra, 1 a twin-lantern square candelabra,
    2 a slim LED column."""
    if v == 2:
        c = C(22, 62)
        b = 61
        for y in range(b - 52, b + 1):
            half = 1 if y < b - 20 else 2
            c.hl(8 - half, 8 + half, y, STEEL[2])
            c.px(8 - half, y, STEEL[4])
        c.rect(5, b - 3, 11, b, STEEL[1])
        c.hl(5, 11, b - 3, STEEL[4])
        for i in range(10):
            c.px(8 + i, b - 52 - i // 3, STEEL[3])
            c.px(8 + i, b - 51 - i // 3, STEEL[1])
        c.rect(13, b - 57, 21, b - 55, STEEL[2])
        c.hl(13, 21, b - 57, STEEL[4])
        c.hl(14, 20, b - 54, '#e8f4ff')
        return outline(c.im)
    W = 13 if v == 0 else 31
    cx = W // 2
    c = C(W, 60)
    b = 59
    c.rect(cx - 4, b - 6, cx + 4, b, IRON[1])
    c.rect(cx - 3, b - 11, cx + 3, b - 6, IRON[1])
    c.vl(cx - 3, b - 11, b, IRON[3])
    c.vl(cx - 2, b - 11, b, IRON[2])
    c.hl(cx - 5, cx + 5, b, IRON[0])
    c.hl(cx - 4, cx + 4, b - 6, IRON[2])
    c.rect(cx - 1, b - 42, cx + 1, b - 11, IRON[1])
    c.vl(cx - 1, b - 42, b - 11, IRON[3])
    for y in (b - 20, b - 31):
        c.hl(cx - 2, cx + 2, y, IRON[2])
    heads = [cx] if v == 0 else [5, W - 6]
    if v == 1:
        for i in range(cx - 5):
            y = b - 40 - round(3 * math.sin(i / (cx - 5) * math.pi))
            for x in (cx - 1 - i, cx + 1 + i):
                c.px(x, y, IRON[2])
                c.px(x, y + 1, IRON[1])
        c.vl(cx, b - 48, b - 42, IRON[2])
        sphere(c, cx, b - 49, 1.6, IRON)
    for hx in heads:
        top = b - 55 if v == 0 else b - 53
        c.rect(hx - 5, top + 11, hx + 5, top + 13, IRON[1])
        c.hl(hx - 5, hx + 5, top + 11, IRON[3])
        c.rect(hx - 4, top + 1, hx + 4, top + 10, IRON[1])
        c.rect(hx - 3, top + 2, hx + 3, top + 9, GLOW[1])
        c.rect(hx - 3, top + 2, hx - 1, top + 9, GLOW[2])
        c.vl(hx, top + 2, top + 9, IRON[2])
        c.hl(hx - 3, hx + 3, top + 9, GLOW[0])
        for i in range(4):
            c.hl(hx - 5 + i, hx + 5 - i, top - i, IRON[2] if i % 2 else IRON[1])
        c.px(hx, top - 4, IRON[3])
    return outline(c.im)


STREET = {
    'street-bench': bench,
    'street-bin': bin_,
    'street-bollard': bollard,
    'street-planter': planter,
    'tree-grate': tree_grate,
    'gully-grate': gully,
    'news-kiosk': news_kiosk,
    'morris-column': column,
    'cafe-terrace': cafe,
    'street-barrow': barrow,
    'city-lamp': city_lamp,
}
