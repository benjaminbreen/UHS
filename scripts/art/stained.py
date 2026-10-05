"""Glazing for small windows, drawn over the dark of an opening so each
painter keeps its own surround: jewel-coloured stained glass in lead for a
church, or pale quarries of leaded glass for a hall, school or house.
"""

RUBY = ('#4a1018', '#8e1e2c', '#c4404a')
COBALT = ('#101a42', '#203c88', '#4a6cc4')
GOLD = ('#5e4212', '#a8822a', '#e2c264')
GREEN = ('#143420', '#2a6438', '#5a9a5a')
LEAD = (26, 22, 28)
QUARRY = ('#1e2824', '#4c6660', '#7e9c94', '#b4ccc2')


def _rgb(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


def glaze(im, box, glass, kind='stained', seed=0):
    """Glaze the pixels in `box` (x0, y0, x1, y1, inclusive) whose colour is
    one of `glass`, the dark tones the opening was drawn in. Stained glass
    runs in panels between saddle bars, a medallion at the centre, each pane
    lit on its upper left; quarries are diamonds of pale glass in lead."""
    px = im.load()
    x0, y0, x1, y1 = box
    glass = {(_rgb(g) if isinstance(g, str) else tuple(g[:3])) for g in glass}
    w = x1 - x0 + 1
    h = y1 - y0 + 1
    for y in range(max(0, y0), min(im.height, y1 + 1)):
        for x in range(max(0, x0), min(im.width, x1 + 1)):
            if px[x, y][:3] not in glass:
                continue
            u, v = x - x0, y - y0
            if kind == 'stained':
                # A ruby border beaded with gold, a cobalt field, medallions
                # stacked down the light between the iron saddle bars.
                if v < 2:
                    c = _rgb(GOLD[2] if u == w // 2 else GOLD[1])
                elif v % 6 == 5 and v < h - 2:
                    c = LEAD
                elif u == 0 or u == w - 1:
                    c = _rgb(GOLD[1] if v % 3 == 0 else RUBY[1])
                elif abs(u - (w - 1) / 2) <= 0.6 and v % 6 in (2, 3):
                    c = _rgb(GOLD[2] if v % 6 == 2 else RUBY[2])
                elif v % 6 in (2, 3) and w >= 5:
                    c = _rgb(RUBY[1] if (v // 6 + seed) % 2 else GREEN[1])
                else:
                    c = _rgb(COBALT[2] if (v % 6 == 0 and u == 1) else COBALT[1])
            else:
                if (u + v) % 3 == 0 or (u - v) % 3 == 0:
                    c = _rgb(QUARRY[0])
                else:
                    c = _rgb(QUARRY[3] if (u + 2 * v) % 7 == 1 and v < h // 2 else QUARRY[2] if v < h // 3 else QUARRY[1])
            px[x, y] = (*c, 255)
