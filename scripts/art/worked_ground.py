"""Ground the player has worked: a spade furrow and scythed stubble. Both lie
flat, so neither casts a shadow."""
import random
from PIL import Image, ImageDraw
from art.shrubs import ramp
from art.fungi import _log

SOIL = ['#3a2a1c', '#4d3823', '#61472c', '#775a39', '#8d6e47']
STRAW = ['#4a4a2b', '#6d6b36', '#8e8a48', '#b0a862', '#cbc086']


def flat(w, h):
    im = Image.new('RGBA', (w, h))
    im.info['shadowMinY'] = 99
    return im, ImageDraw.Draw(im)


def furrow():
    im, d = flat(18, 12)
    # Tilled ground lies flat in the grass: a ragged patch of clods with three
    # shallow grooves. A rim or a straight edge would read as a crate.
    rows = [(5, 12), (3, 14), (2, 15), (2, 14), (3, 15), (4, 13), (5, 12)]
    for i, (x0, x1) in enumerate(rows):
        y = 2 + i
        d.line((x0, y, x1, y), fill=SOIL[2])
        if i % 2:
            d.point((x0 - 1, y), fill=SOIL[1])
            d.point((x1 + 1, y), fill=SOIL[1])
    for i, (x0, x1) in enumerate(rows):
        y = 2 + i
        if i in (1, 4):
            d.line((x0 + 1, y, x1 - 1, y), fill=SOIL[0])
        if i in (2, 5):
            for x in range(x0 + 1, x1, 2):
                d.point((x, y), fill=SOIL[3])
    for x, y in [(6, 4), (11, 6), (8, 8), (13, 5), (5, 7), (10, 3)]:
        d.point((x, y), fill=SOIL[4])
    return im


def stubble():
    im, d = flat(16, 8)
    d.line((2, 6, 13, 6), fill=STRAW[0])
    for i, x in enumerate(range(3, 14, 2)):
        top = 3 if i % 2 else 4
        d.line((x, 6, x, top), fill=STRAW[1])
        d.point((x, top), fill=STRAW[3 if i % 2 else 2])
    d.point((5, 5), fill=STRAW[4])
    d.point((11, 4), fill=STRAW[4])
    return im


STONE = ['#33383c', '#4c545a', '#697179', '#8a9199', '#adb3ba']
CUT = ['#2d3a25', '#41552f', '#5c7740', '#86a057', '#c9c98c']
DRY = ['#3b3526', '#5a5136', '#7d7049', '#a1935f', '#cfc393']


def logs():
    """What a felled tree leaves: two bucked lengths with the ends showing."""
    im = Image.new('RGBA', (30, 20))
    rng = random.Random('logs')
    bark = ramp('#7a5a3c')
    _log(im, bark, 7, 22, 8, 3.5, rng)
    _log(im, bark, 3, 24, 14, 4, rng)
    return im


def cut_stems(dry=False):
    """A shrub taken off at the ankle: short stems with pale cut faces."""
    pal = DRY if dry else CUT
    im, d = flat(20, 11)
    d.line((3, 8, 16, 8), fill=pal[0])
    for i, x in enumerate(range(4, 16, 2)):
        top = 8 - (2 + (i % 3))
        d.line((x, 8, x + (1 if i % 2 else -1), top), fill=pal[1 + i % 2])
        d.point((x + (1 if i % 2 else -1), top), fill=pal[3])
    for x, y in ((6, 9), (12, 9), (9, 7)):
        d.point((x, y), fill=pal[2])
    return im


def rubble():
    """A broken boulder: shards and grit where the rock stood."""
    im, d = flat(20, 12)
    for x0, y0, w, h in ((4, 6, 5, 3), (10, 5, 4, 3), (7, 8, 6, 2), (13, 8, 3, 2)):
        d.rectangle((x0, y0, x0 + w, y0 + h), fill=STONE[1])
        d.line((x0, y0, x0 + w, y0), fill=STONE[3])
        d.line((x0, y0 + h, x0 + w, y0 + h), fill=STONE[0])
        d.point((x0 + 1, y0 + 1), fill=STONE[4])
    for x, y in [(3, 9), (17, 7), (6, 4), (15, 4), (9, 10), (12, 3)]:
        d.point((x, y), fill=STONE[2])
    for x, y in [(2, 8), (18, 9), (5, 3), (16, 10)]:
        d.point((x, y), fill=STONE[1])
    return im


def worked_ground():
    return {
        'nature-furrow': furrow(),
        'nature-stubble': stubble(),
        'nature-logs': logs(),
        'nature-cut-stems': cut_stems(),
        'nature-cut-thorns': cut_stems(dry=True),
        'nature-rubble': rubble(),
    }
