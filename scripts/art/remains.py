"""What a kill leaves: feathers in a loose ring, a tuft of fur, a carcass that
the crows pick down to bone and the weather bleaches, and a mouse laid out on
a step. Drawn at world size and kept quiet: sign to be read, not gore. Light
from the upper left."""
import math
from art.shrubs import ramp
from art.succulents import _new, _put, _blob, _rng

HIDE = ramp('#7a5a3c')
MEAT = ramp('#7e3b2e')
BONE = ramp('#d8cfb8')
OLD_BONE = ramp('#e6e2d4')
FUR = ramp('#8a7c68')
MOUSE = ramp('#6e6253')


def _feather(im, pal, x, y, angle, length):
    """A contour feather: a pale shaft down a vane that is lit on one side."""
    dx, dy = math.cos(angle), math.sin(angle) * 0.6
    for i in range(length):
        px, py = x + dx * i, y + dy * i
        _put(im, px, py, pal[4] if i < length - 1 else pal[2])
        _put(im, px - dy, py + dx * 0.5, pal[2] if i % 2 else pal[3])
    _put(im, x, y, pal[6])


def _feathers(colour, seed):
    rng = _rng(seed)
    pal = ramp(colour)
    im = _new(20, 12)
    # A ring where it happened, thicker on the side it was dragged from.
    for k in range(9):
        a = k / 9 * math.tau + rng.uniform(-0.3, 0.3)
        r = rng.uniform(3.2, 6.8)
        _feather(im, pal, 10 + math.cos(a) * r, 6 + math.sin(a) * r * 0.55,
                 rng.uniform(0, math.tau), rng.choice((2, 3, 3, 4)))
    # down: single pale pixels drifted off downwind
    for _ in range(4):
        _put(im, rng.uniform(12, 18), rng.uniform(2, 10), pal[6])
    return im


def _fur(seed):
    rng = _rng(seed)
    im = _new(12, 8)
    _blob(im, FUR, 6, 4.4, 2.6, 1.4, lit=0.3)
    for _ in range(9):
        a = rng.uniform(0, math.tau)
        r = rng.uniform(2.5, 4.4)
        _put(im, 6 + math.cos(a) * r, 4.4 + math.sin(a) * r * 0.6, FUR[rng.choice((4, 5, 6))])
    return im


def _ribs(im, pal, x0, y0, n, gap=2, h=3):
    """A spine, and the ribs off it leaning back and curling under."""
    for x in range(x0 - 1, x0 + n * gap + 1):
        _put(im, x, y0 - 1, pal[2])
    bow = [0, -0.9, -1.2, -1.0, -0.4]
    for i in range(n):
        x = x0 + i * gap
        for k in range(h):
            _put(im, x + bow[min(k, 4)] + k * 0.35, y0 + k, pal[5 if k < 2 else 3])


def _skull(im, pal):
    """Long in the face, an eye socket, the jaw fallen a little away."""
    _blob(im, pal, 20.5, 6.6, 2.8, 1.3, lit=0.6)
    _put(im, 19.6, 6.2, pal[0])
    for x in range(18, 23):
        _put(im, x, 8.6, pal[3])


def _carcass(stage):
    """0 fresh, 1 picked over, 2 bone, 3 old bone. A deer-sized animal lying
    on its side, head to the right."""
    im = _new(26, 13)
    if stage == 0:
        _blob(im, HIDE, 11, 7, 7.5, 3.4, lit=0.45)
        _blob(im, MEAT, 10, 8.4, 2.6, 1.1, lit=0.2)          # opened at the belly
        _blob(im, HIDE, 20.5, 6.3, 2.6, 1.8, lit=0.5)        # head
        _put(im, 22.5, 6, HIDE[1]); _put(im, 21, 5.5, '#1a1410')
        for x0, x1 in ((6, 3), (9, 7), (15, 18), (13, 16)):  # legs out stiff
            for i in range(4):
                _put(im, x0 + (x1 - x0) * i / 3, 10 + i * 0.5, HIDE[2])
    elif stage == 1:
        _blob(im, HIDE, 8, 8, 3.2, 1.8, lit=0.35)             # a flap of hide left
        _ribs(im, BONE, 9, 5, 4, 3, 5)
        _blob(im, MEAT, 13, 9.4, 3.4, 0.9, lit=0.2)
        _skull(im, BONE)
        for i in range(5):
            _put(im, 4 + i, 10.5, HIDE[2])
    else:
        pal = BONE if stage == 2 else OLD_BONE
        _ribs(im, pal, 8, 5 if stage == 2 else 6, 4 if stage == 2 else 2, 3, 5 if stage == 2 else 3)
        _skull(im, pal)
        # the long bones, scattered by whatever came after
        bones = ((3, 10, 7, 11), (15, 11, 18, 9)) if stage == 2 else ((4, 10, 7, 10),)
        for x0, y0, x1, y1 in bones:
            for i in range(5):
                _put(im, x0 + (x1 - x0) * i / 4, y0 + (y1 - y0) * i / 4, pal[4])
        if stage == 3:  # grass through it
            for x in (10, 13, 16):
                _put(im, x, 8, '#6f8a45'); _put(im, x, 7, '#86a257')
    return im


def _mouse():
    im = _new(11, 6)
    _blob(im, MOUSE, 4.5, 3.4, 2.4, 1.2, lit=0.5)
    _put(im, 6.6, 3, MOUSE[4]); _put(im, 7, 3.4, '#d9a49c')    # snout
    _put(im, 5.4, 2.4, MOUSE[6])                                 # ear
    _put(im, 2.4, 4.2, '#d9a49c'); _put(im, 5, 4.4, '#d9a49c')  # feet, curled up
    for i, y in enumerate((3.6, 3.8, 4.2, 4.4)):
        _put(im, 1.6 - i * 0.5 + 0.5, y, '#b58c86')             # tail
    return im


def remains():
    return {
        'nature-remains-feathers-white': _feathers('#e8e6de', 'white'),
        'nature-remains-feathers-grey': _feathers('#9aa4a6', 'grey'),
        'nature-remains-feathers-brown': _feathers('#a0703c', 'brown'),
        'nature-remains-feathers-dark': _feathers('#4a3c30', 'dark'),
        'nature-remains-fur': _fur('fur'),
        'nature-remains-carcass': _carcass(0),
        'nature-remains-carcass-picked': _carcass(1),
        'nature-remains-bones': _carcass(2),
        'nature-remains-bones-old': _carcass(3),
        'nature-remains-mouse': _mouse(),
    }
