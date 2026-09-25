"""Dung on the ground: a cattle pat as it dries, a horse's pile, a scatter of
sheep or goat pellets, and the white-capped droppings of fowl. Drawn at
world size, a few pixels across. Light from the upper left."""
from PIL import Image
from art.shrubs import ramp
from art.succulents import _new, _put, _blob, _rng

FRESH = ramp('#4e3a22')
CRUST = ramp('#6a5434')
DRY = ramp('#9a8a6a')
PILE = ramp('#6a5a2e')
PELLET = ramp('#3a2e20')


def _pat(pal, rings, seed, flat=False):
    rng = _rng(seed)
    im = _new(18, 10)
    # Concentric rings, each a little higher than the last: the coil it fell in.
    for i, (rx, ry) in enumerate(rings):
        _blob(im, pal, 9, 6 - i * 0.9, rx, ry * (0.6 if flat else 1), lit=0.4)
    if pal is DRY:
        for _ in range(4):
            _put(im, rng.uniform(4, 14), rng.uniform(4, 7), pal[1])
    if pal is FRESH and not flat:
        _put(im, 7, 3, pal[6])
    return im


def _pile():
    im = _new(13, 9)
    for cx, cy, r in ((4, 6, 2.2), (8, 6, 2.2), (6, 4.4, 2)):
        _blob(im, PILE, cx, cy, r, r * 0.8)
    return im


def _pile_dry():
    im = _pile()
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if a:
                px[x, y] = (min(255, r + 40), min(255, g + 36), min(255, b + 28), a)
    return im


def _pellets(seed):
    rng = _rng(seed)
    im = _new(13, 8)
    for x, y in ((3, 3), (6, 2), (9, 3), (4, 5), (7, 5), (10, 5), (5, 4), (8, 4)):
        x, y = x + rng.choice((-0.4, 0, 0.4)), y + rng.choice((0, 0.4))
        _put(im, x, y, PELLET[4])
        _put(im, x + 1, y, PELLET[1])
    return im


def _droppings(seed):
    rng = _rng(seed)
    im = _new(10, 7)
    for x, y in ((2, 3), (5, 2), (7, 4), (4, 5)):
        x, y = x + rng.choice((0, 1)), y + rng.choice((0, 0.6))
        _put(im, x, y, '#5a5a3a')
        _put(im, x, y - 1, '#e8e6da')
    return im


def dung():
    rings = [(6.4, 3.2), (4.4, 2.4), (2.4, 1.6)]
    return {
        'nature-dung-pat': _pat(FRESH, rings, 'pat'),
        'nature-dung-pat-crusted': _pat(CRUST, rings, 'crusted'),
        'nature-dung-pat-dry': _pat(DRY, rings[:2], 'dry', flat=True),
        'nature-dung-pat-trodden': _pat(FRESH, [(7.5, 2.4), (5, 1.6)], 'trodden', flat=True),
        'nature-dung-pile': _pile(),
        'nature-dung-pile-dry': _pile_dry(),
        'nature-dung-pellets': _pellets('pellets'),
        'nature-dung-droppings': _droppings('droppings'),
        'nature-dung-droppings-2': _droppings('droppings-2'),
    }
