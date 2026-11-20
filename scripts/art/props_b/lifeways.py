"""The stake weir that turned fish into a trap at the tide or the river's
edge. The shell midden is drawn with the other middens in `midden.py`."""
from PIL import Image
from .core import Canvas, jitter, soft_outline

STAKE = ['#241a12', '#3e2c1e', '#5a412c', '#76583c', '#94724e']
WATTLE = ['#3a3020', '#5c4c32', '#827048', '#a69262']


def fish_weir(v=0):
    """A line of sharpened stakes driven into the shallows with wattle woven
    between, turned in at one end into a pen the fish cannot find their way
    out of; drawn from the bank looking out over it."""
    w, h = (36 if v == 2 else 46), 20
    c = Canvas(w, h)
    # The wattle run, sagging and patched, then the pen hooked round.
    run = [(x, 12 + int(2 * (x / w) ** 2)) for x in range(2, w - 12)]
    hook = [(w - 12 + i, 14 - i // 2) for i in range(8)] + [(w - 5, 10 - i) for i in range(4)]
    for k, (x, y) in enumerate(run + hook):
        n = jitter(x, v)
        c.set(x, y, WATTLE[2 + (n % 2)])
        c.set(x, y + 1, WATTLE[1])
        if n % 4 == 0: c.set(x, y - 1, WATTLE[3])
    for k, (x, y) in enumerate(run[::4] + hook[::3]):
        tall = 7 + jitter(x, k, v) % 4
        for j in range(tall):
            c.set(x, y - j + 3, STAKE[3 if j > tall - 3 else 2])
            c.set(x + 1, y - j + 3, STAKE[1])
        c.set(x, y - tall + 3, STAKE[4])
    # Water stands round the stakes: a pale line at the waterline on each.
    for x, y in run[::4] + hook[::3]:
        c.set(x - 1, y + 3, '#9cc4cc'); c.set(x + 2, y + 3, '#6e9aa6')
    im = c.image()
    # The trap end turned the other way, for a current from the right.
    return im.transpose(Image.FLIP_LEFT_RIGHT) if v == 1 else im


LIFEWAYS = {
    'fish-weir': fish_weir,
}
