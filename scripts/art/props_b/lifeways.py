"""What people who did not farm left on the ground: the shell midden by a
coastal camp, and the stake weir that turned fish into a trap at the tide
or the river's edge."""
from PIL import Image
from .core import Canvas, jitter, soft_outline

SHELL = ['#5a5248', '#7e756a', '#a49a8c', '#c6bcac', '#e0d8ca', '#f4efe4']
EARTH = ['#2e2418', '#4a3a28', '#6a553a', '#8a7250']
ASH = ['#3a3834', '#5a5650', '#7e7a72']
STAKE = ['#241a12', '#3e2c1e', '#5a412c', '#76583c', '#94724e']
WATTLE = ['#3a3020', '#5c4c32', '#827048', '#a69262']


def shell_midden(v=0):
    """A low mound of shell, oyster and mussel and cockle, dark with the ash
    and earth of the fires it was cooked on, fresh white on top."""
    w, h = [(38, 14), (44, 16), (32, 12)][v]
    c = Canvas(w, h)
    cx, top = w / 2, 2
    for y in range(top, h):
        for x in range(w):
            u = (x + .5 - cx) / (w / 2 - 1)
            t = (y + .5 - top) / (h - top)
            if u * u > t * (2 - t) * 1.05: continue
            n = jitter(x, y, v)
            # The mound is lit from the upper left; ash lenses show on the
            # shaded side where it has slumped.
            lit = 4 - (u > .2) - (t > .6) + (u < -.3 and t < .5)
            if t > .45 and n % 5 == 0: c.set(x, y, ASH[n % 3]); continue
            if n % 7 == 0: c.set(x, y, EARTH[1 + (n % 3)]); continue
            c.set(x, y, SHELL[max(0, min(5, lit + (n % 3 == 0) - (n % 4 == 0)))])
    # Single shells kicked loose round the foot.
    for i in range(8):
        n = jitter(i, v, 3)
        x = 2 + n % (w - 4)
        c.set(x, h - 1 - (n % 2), SHELL[4 if n % 2 else 3])
    soft_outline(c, EARTH[1], SHELL[2])
    return c.image()


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
    'shell-midden': shell_midden,
    'fish-weir': fish_weir,
}
