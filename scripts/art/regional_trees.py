"""Original regional growth forms for the biome colourways. Integer pixels, no
imported image pixels. Same crown/branch vocabulary as nature_trees."""
from PIL import Image, ImageDraw
from art import canopy
import math
import random
from art.nature_trees import canvas, branch, crown, BARK

EUCALYPT = ['#20302a', '#3a5140', '#5f7a55', '#87a06e', '#adbf8b', '#d3dcae']
BAOBAB = ['#2a3a2c', '#3f5a3a', '#5f7f47', '#83a054', '#a9bb66', '#cfd28a']
SAGUARO = ['#14312a', '#1f4d3a', '#2f6d48', '#4a8a54', '#6fa562', '#a3c67e']
LARCH = ['#233a26', '#3a5b2f', '#5f8a3a', '#86ad45', '#b2cb5e', '#dbe38c']
JUNIPER = ['#172a25', '#25443a', '#37604b', '#4f7d5a', '#729a6b', '#a4bd8d']
MAPLE = ['#25352a', '#3e5c34', '#5f8a3b', '#82ad44', '#a9c85a', '#d0dd82']
MANGROVE = ['#14302b', '#1f4a3c', '#2f6a4a', '#468a55', '#6ca866', '#9fc487']
PALE_BARK = ['#3a3a34', '#7c7568', '#a8a08e', '#cbc2ad', '#e2dac6', '#f1ebd9']


def pale_limb(d, pts, w):
    d.line(pts, fill=PALE_BARK[0], width=w + 2, joint='curve')
    d.line(pts, fill=PALE_BARK[2], width=w, joint='curve')
    d.line([(x - 1, y) for x, y in pts], fill=PALE_BARK[4], width=max(1, w // 2))


def eucalyptus():
    im, d = canvas((80, 104))
    # Smooth pale trunk, few low limbs, open drooping crown high on the stem.
    pale_limb(d, [(41, 98), (40, 80), (42, 60), (39, 40), (42, 24)], 6)
    pale_limb(d, [(41, 64), (26, 48), (18, 34)], 3)
    pale_limb(d, [(41, 56), (57, 42), (66, 28)], 3)
    pale_limb(d, [(40, 44), (30, 30), (28, 18)], 2)
    d.polygon([(37, 93), (46, 93), (50, 100), (44, 98), (41, 101), (37, 98), (32, 100)], fill=PALE_BARK[0])
    for x, y in [(40, 88), (42, 76), (40, 66), (41, 50)]:
        d.line((x - 2, y, x + 2, y + 1), fill=PALE_BARK[1])
        d.point((x + 2, y - 1), fill=PALE_BARK[5])
    for cx, cy, rx, ry, seed in [(18, 32, 11, 7, 511), (65, 27, 12, 7, 512), (30, 18, 12, 7, 513), (55, 14, 13, 7, 514), (42, 26, 13, 8, 515), (26, 40, 9, 5, 516), (58, 38, 9, 5, 517)]:
        crown(im, cx, cy, rx, ry, EUCALYPT, seed)
    d = ImageDraw.Draw(im)
    # Hanging sickle leaves under each bough.
    rng = random.Random(7)
    for cx, cy in [(18, 40), (65, 34), (30, 26), (55, 22), (42, 35), (26, 46), (58, 44)]:
        for k in range(4):
            x = cx - 6 + k * 4 + rng.randrange(-1, 2)
            d.line((x, cy, x + 1, cy + 4 + rng.randrange(0, 3)), fill=EUCALYPT[1])
            d.point((x + 1, cy + 2), fill=EUCALYPT[3])
    return im


def baobab():
    im, d = canvas((96, 96))
    # Massive bottle trunk, stubby root-like branches, thin flat crown.
    d.polygon([(34, 90), (62, 90), (60, 62), (56, 46), (40, 46), (36, 62)], fill=BARK[0])
    d.polygon([(38, 88), (58, 88), (56, 62), (53, 48), (43, 48), (40, 62)], fill=BARK[2])
    d.polygon([(40, 86), (47, 86), (46, 62), (44, 50), (43, 62)], fill=BARK[3])
    d.line([(44, 56), (44, 84)], fill=BARK[4], width=2)
    for y in range(52, 88, 6):
        d.line((40, y, 55, y + 1), fill=BARK[1])
    for pts in [[(42, 50), (28, 40), (14, 34)], [(54, 49), (70, 38), (84, 32)], [(48, 48), (46, 30), (40, 18)], [(50, 48), (60, 30), (66, 18)], [(45, 49), (34, 28), (30, 20)]]:
        branch(d, pts, 4)
        for x, y in pts[1:]:
            branch(d, [(x, y), (x - 5, y - 6)], 2)
            branch(d, [(x, y), (x + 6, y - 5)], 2)
    for cx, cy, rx, ry, seed in [(14, 30, 9, 4, 521), (84, 29, 9, 4, 522), (40, 14, 9, 4, 523), (66, 14, 9, 4, 524), (30, 17, 8, 4, 525), (55, 24, 8, 4, 526), (26, 34, 7, 3, 527), (72, 33, 7, 3, 528)]:
        crown(im, cx, cy, rx, ry, BAOBAB, seed)
    return im


def saguaro():
    im, d = canvas((40, 88))
    # A ribbed column with two raised arms; spines as single light pixels.
    def column(x0, y0, x1, y1, w):
        d.rounded_rectangle((x0 - w, y0, x1 + w, y1), radius=w, fill=SAGUARO[0])
        d.rounded_rectangle((x0 - w + 1, y0 + 1, x1 + w - 1, y1 - 1), radius=w - 1, fill=SAGUARO[2])
        for x in range(x0 - w + 2, x1 + w - 1, 3):
            d.line((x, y0 + 2, x, y1 - 2), fill=SAGUARO[1])
            d.line((x + 1, y0 + 2, x + 1, y1 - 2), fill=SAGUARO[3])
        d.line((x0 - w + 2, y0 + 2, x0 - w + 2, y1 - 2), fill=SAGUARO[4])
    column(20, 14, 20, 82, 5)
    column(8, 30, 8, 52, 3)
    d.rounded_rectangle((5, 46, 17, 56), radius=3, fill=SAGUARO[0])
    d.rounded_rectangle((6, 47, 16, 55), radius=3, fill=SAGUARO[2])
    column(31, 22, 31, 48, 3)
    d.rounded_rectangle((23, 42, 34, 52), radius=3, fill=SAGUARO[0])
    d.rounded_rectangle((24, 43, 33, 51), radius=3, fill=SAGUARO[2])
    d.ellipse((13, 11, 27, 19), fill=SAGUARO[0]); d.ellipse((14, 12, 26, 18), fill=SAGUARO[3])
    d.ellipse((5, 27, 11, 33), fill=SAGUARO[0]); d.ellipse((6, 28, 10, 32), fill=SAGUARO[3])
    d.ellipse((28, 19, 34, 25), fill=SAGUARO[0]); d.ellipse((29, 20, 33, 24), fill=SAGUARO[3])
    rng = random.Random(3)
    for y in range(16, 82, 5):
        for x in (16, 19, 22, 25):
            if rng.random() < 0.6:
                d.point((x + rng.randrange(0, 2), y + rng.randrange(0, 3)), fill=SAGUARO[5])
    d.polygon([(14, 81), (26, 81), (29, 85), (22, 84), (18, 86), (13, 84)], fill=SAGUARO[0])
    return im


def larch():
    im, d = canvas((56, 96))
    branch(d, [(28, 90), (27, 70), (28, 44), (27, 10)], 4)
    d.polygon([(24, 86), (31, 86), (33, 92), (28, 90), (23, 92)], fill=BARK[0])
    # Open whorled tiers with feathery light needles; more air than a spruce.
    for cx, cy, rx, ry, seed in [(27, 78, 22, 6, 611), (29, 68, 19, 6, 612), (26, 58, 17, 6, 613), (28, 48, 14, 6, 614), (27, 38, 12, 6, 615), (28, 28, 9, 6, 616), (27, 18, 6, 6, 617)]:
        for j in range(-2, 3):
            x = cx + j * max(2, rx // 2)
            branch(d, [(cx, cy - 2), (x, cy + ry - 2 - abs(j))], 1)
        crown(im, cx, cy, rx, ry, LARCH, seed)
        d = ImageDraw.Draw(im)
        for j in range(-3, 4):
            x = cx + j * max(2, rx // 3)
            d.line((x, cy + ry - 2, x + 1, cy + ry + 2), fill=LARCH[1])
            d.point((x, cy + ry - 1), fill=LARCH[4])
    d.line([(27, 12), (27, 3)], fill=LARCH[1], width=2)
    d.point((28, 5), fill=LARCH[4])
    return im


def juniper():
    im, d = canvas((48, 56))
    # Dense low rounded crown on a short twisted stem.
    branch(d, [(24, 52), (22, 44), (25, 36)], 4)
    branch(d, [(23, 44), (14, 36), (10, 30)], 2)
    branch(d, [(24, 42), (34, 34), (38, 28)], 2)
    for cx, cy, rx, ry, seed in [(12, 30, 10, 8, 711), (36, 28, 10, 8, 712), (24, 20, 12, 9, 713), (24, 32, 12, 8, 714), (16, 18, 8, 6, 715), (33, 17, 8, 6, 716)]:
        crown(im, cx, cy, rx, ry, JUNIPER, seed)
    d = ImageDraw.Draw(im)
    for x, y in [(10, 26), (20, 14), (30, 12), (39, 24), (25, 36)]:
        d.line((x, y, x + 2, y - 2), fill=JUNIPER[5])
    return im


def maple():
    im, d = canvas((72, 88))
    branch(d, [(36, 82), (35, 66), (37, 52), (35, 40)], 6)
    branch(d, [(36, 60), (22, 46), (14, 36)], 4)
    branch(d, [(36, 56), (50, 44), (58, 34)], 4)
    branch(d, [(36, 48), (28, 32), (26, 22)], 3)
    branch(d, [(37, 46), (46, 30), (48, 20)], 3)
    d.polygon([(32, 78), (41, 78), (45, 85), (38, 83), (35, 86), (31, 84), (27, 85)], fill=BARK[0])
    d.line([(35, 76), (34, 81), (30, 83)], fill=BARK[4], width=2)
    # Broad rounded crown built from big overlapping lobes.
    for cx, cy, rx, ry, seed in [(15, 36, 12, 9, 811), (58, 33, 12, 9, 812), (26, 22, 14, 10, 813), (48, 20, 14, 10, 814), (36, 34, 17, 11, 815), (36, 12, 12, 8, 816)]:
        crown(im, cx, cy, rx, ry, MAPLE, seed)
    d = ImageDraw.Draw(im)
    # Five-lobed leaf marks on the sunlit face.
    for x, y in [(30, 18), (44, 16), (36, 30), (20, 32), (52, 30), (34, 10)]:
        d.polygon([(x, y - 3), (x + 2, y - 1), (x + 3, y + 1), (x, y + 2), (x - 3, y + 1), (x - 2, y - 1)], fill=MAPLE[4])
        d.point((x, y - 2), fill=MAPLE[5]); d.point((x - 1, y + 1), fill=MAPLE[2])
    return im


def mangrove():
    im, d = canvas((72, 72))
    # Arched stilt roots carry the trunk above the mud; a low glossy crown.
    for pts in [[(36, 44), (24, 54), (14, 66)], [(37, 44), (48, 54), (60, 66)], [(35, 46), (30, 58), (26, 68)], [(38, 46), (44, 58), (50, 68)], [(36, 48), (36, 60), (38, 68)]]:
        branch(d, pts, 2)
    branch(d, [(36, 50), (36, 36), (35, 24)], 5)
    branch(d, [(36, 40), (22, 30), (16, 22)], 3)
    branch(d, [(36, 38), (52, 28), (58, 20)], 3)
    for cx, cy, rx, ry, seed in [(16, 22, 11, 7, 911), (57, 20, 11, 7, 912), (28, 12, 12, 7, 913), (48, 11, 12, 7, 914), (36, 22, 14, 8, 915)]:
        crown(im, cx, cy, rx, ry, MANGROVE, seed)
    d = ImageDraw.Draw(im)
    for x, y in [(20, 20), (52, 18), (30, 10), (44, 10), (36, 20), (26, 26), (48, 26)]:
        d.line((x - 2, y, x + 2, y), fill=MANGROVE[5])
        d.line((x - 1, y + 1, x + 1, y + 1), fill=MANGROVE[3])
    return im


WATER = ['#2f6f8a', '#4f9cb8', '#8fd0e6', '#d6f2fb', '#ffffff']


def waterfall():
    im, d = canvas((18, 30))
    # A short drop: dark lip, streaked fall, foam at the foot.
    d.rectangle((2, 3, 15, 6), fill=WATER[0])
    d.rectangle((3, 3, 14, 4), fill=WATER[1])
    for x in range(3, 15):
        tone = WATER[2] if x % 3 else WATER[1]
        d.line((x, 6, x, 22), fill=tone)
        if x % 4 == 1:
            d.line((x, 8 + (x % 3) * 3, x, 12 + (x % 3) * 3), fill=WATER[3])
    d.line((3, 6, 3, 22), fill=WATER[0]); d.line((14, 6, 14, 22), fill=WATER[0])
    for x, y in [(2, 24), (5, 25), (8, 24), (11, 25), (14, 24), (4, 27), (9, 27), (13, 27)]:
        d.ellipse((x - 1, y - 1, x + 2, y + 1), fill=WATER[3])
        d.point((x, y - 1), fill=WATER[4])
    im.info['shadowMinY'] = 99
    return im


def stump():
    im, d = canvas((20, 18))
    d.ellipse((2, 9, 17, 16), fill=BARK[0])
    d.rectangle((4, 5, 15, 12), fill=BARK[2])
    d.line((4, 5, 4, 12), fill=BARK[1]); d.line((15, 5, 15, 12), fill=BARK[1])
    d.ellipse((3, 2, 16, 8), fill=BARK[0])
    d.ellipse((4, 3, 15, 7), fill=BARK[4])
    d.ellipse((7, 4, 12, 6), fill=BARK[3])
    d.point((9, 5), fill=BARK[2])
    d.line((5, 12, 8, 15), fill=BARK[1]); d.line((12, 12, 15, 15), fill=BARK[1])
    return im


def regional_trees():
    return {
        'nature-waterfall': waterfall(),
        'nature-stump': stump(),
        'nature-eucalyptus': eucalyptus(),
        'nature-baobab': baobab(),
        'nature-saguaro': saguaro(),
        'nature-larch': larch(),
        'nature-juniper': juniper(),
        'nature-maple': canopy.maple(1),
        'nature-maple-2': canopy.maple(2),
        'nature-maple-3': canopy.maple(3),
        'nature-maple-autumn': canopy.maple(1, autumn=0),
        'nature-maple-2-autumn': canopy.maple(2, autumn=1),
        'nature-maple-3-autumn': canopy.maple(3, autumn=2),
        'nature-maple-bare': canopy.maple(1, bare=True),
        'nature-maple-2-bare': canopy.maple(2, bare=True),
        'nature-maple-3-bare': canopy.maple(3, bare=True),
        'nature-mangrove': mangrove(),
    }
