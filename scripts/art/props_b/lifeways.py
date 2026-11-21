"""The stake weir that turned fish into a trap at the tide or the river's
edge. The shell midden is drawn with the other middens in `midden.py`."""
from math import cos, pi, sin, sqrt
from PIL import Image
from .core import Canvas, RAMPS, jitter, soft_outline


def fish_weir(v=0):
    """A V-wing wattle fence and circular brushwood pound driven into the
    shallows, seen in 3/4 overhead view with water ripples at the stakes."""
    w, h = (40 if v % 3 == 2 else 48), 24
    c = Canvas(w, h)
    stake = RAMPS['walnut7']
    wattle = RAMPS['oak7']
    water = ['#2a5c84', '#4688b2', '#7cc2e0', '#d8f4fc']

    cx, cy, rx, ry = w - 12.0, 12.5, 8.5, 4.5
    # 1. Back half of the circular brushwood pound (top arc of ellipse)
    for x in range(int(cx - rx), int(cx + rx) + 1):
        u = (x + 0.5 - cx) / rx
        if abs(u) > 1.0:
            continue
        yb = round(cy - ry * sqrt(max(0.0, 1.0 - u * u)))
        if x < int(cx - 2):
            continue
        for dy in range(5):
            course = (dy + x // 2) % 2
            c.set(x, yb + dy, wattle[4 if course == 0 else 2])
        if (x - int(cx)) % 3 == 0:
            for sy in range(yb - 2, yb + 5):
                c.set(x, sy, stake[5] if sy == yb - 2 else stake[3])
                c.set(x + 1, sy, stake[1])

    # 2. Lead-in wattle leader fence sweeping from left bank into the trap throat
    x_end = int(cx - 2)
    for x in range(3, x_end + 1):
        t = (x - 3) / max(1, x_end - 3)
        y_base = round(14 + 3.0 * sin(t * pi * 0.85))
        for dy in range(5):
            course = (dy + (x // 3)) % 2
            tone = 5 if (dy == 0 and course == 0) else (4 if course == 0 else (3 if dy < 4 else 1))
            c.set(x, y_base - 4 + dy, wattle[tone])
        if (x - 3) % 4 == 0:
            sh = 7 + (jitter(x, v) % 2)
            for sy in range(y_base - sh + 1, y_base + 2):
                c.set(x, sy, stake[5] if sy > y_base - sh + 1 else stake[6])
                c.set(x + 1, sy, stake[2])
            c.set(x - 1, y_base + 1, water[2]); c.set(x, y_base + 2, water[3]); c.set(x + 2, y_base + 1, water[1])

    # 3. Front half of the circular brushwood pound (curved bottom arc of ellipse)
    for x in range(int(cx - rx), int(cx + rx) + 1):
        u = (x + 0.5 - cx) / rx
        if abs(u) > 1.0:
            continue
        yf = round(cy + ry * sqrt(max(0.0, 1.0 - u * u)))
        for dy in range(6):
            course = (dy + (x // 2)) % 2
            tone = 5 if (dy == 0 and u < 0.25) else (4 if course == 0 and u < 0.4 else (3 if dy < 5 else 1))
            c.set(x, yf - 4 + dy, wattle[tone])
        if (x - int(cx)) % 3 == 0:
            for sy in range(yf - 6, yf + 2):
                c.set(x, sy, stake[5] if u < 0.3 else stake[4])
                c.set(x + 1, sy, stake[2])
            c.set(x - 1, yf + 2, water[2]); c.set(x, yf + 2, water[3]); c.set(x + 1, yf + 2, water[1])

    # A couple of silver fish glinting inside the trap pool
    c.set(int(cx), int(cy) + 1, '#eef8fc'); c.set(int(cx) + 1, int(cy) + 1, '#8ab4cc')
    c.set(int(cx) - 3, int(cy) + 2, '#eef8fc'); c.set(int(cx) - 2, int(cy) + 2, '#8ab4cc')

    soft_outline(c, stake[0], wattle[2])
    im = c.image()
    return im.transpose(Image.FLIP_LEFT_RIGHT) if v % 3 == 1 else im


LIFEWAYS = {
    'fish-weir': fish_weir,
}
