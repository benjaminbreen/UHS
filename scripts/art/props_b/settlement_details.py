"""Small, dated street details. Clear silhouettes before surface ornament."""
from .core import Canvas, RAMPS


def slab(c, x0, y0, x1, y1, stone):
    c.rect(x0, y0, x1, y1, stone[4])
    c.hline(x0, x1, y0, stone[6]); c.vline(x0, y0 + 1, y1 - 1, stone[5])
    c.hline(x0, x1, y1, stone[1]); c.vline(x1, y0 + 1, y1, stone[2])


def grave_stone(v=0):
    """A raised kerb over the grave, a tall stone at the head and a short one
    at the foot. v//2: pointed, rounded, Ottoman turban; v%2: axis."""
    c = Canvas(27, 30)
    stone = RAMPS['sandstone'] if v // 2 == 1 else RAMPS['limestone']
    earth, grass = RAMPS['walnut7'], RAMPS['greenglaze7']
    if v % 2:
        x0, y0, x1, y1 = 2, 21, 24, 28
        head, foot = (4, 23), (22, 23)
    else:
        x0, y0, x1, y1 = 8, 16, 18, 28
        head, foot = (13, 18), (13, 26)
    # Kerb: a lit top rim, a darker front face, earth and a little grass inside.
    c.rect(x0, y0, x1, y1, stone[3])
    c.hline(x0, x1, y0, stone[5]); c.vline(x0, y0, y1 - 1, stone[5])
    c.hline(x0, x1, y1, stone[1]); c.hline(x0, x1, y1 - 1, stone[2]); c.vline(x1, y0 + 1, y1, stone[2])
    c.rect(x0 + 2, y0 + 2, x1 - 2, y1 - 3, earth[2])
    c.hline(x0 + 2, x1 - 2, y0 + 2, earth[1])
    for i, (x, y) in enumerate([(x0 + 3, y1 - 4), (x1 - 3, y0 + 3), ((x0 + x1) // 2, (y0 + y1) // 2)]):
        c.set(x, y, grass[3 + i % 2])

    def stele(cx, base, h, w=2):
        c.rect(cx - w, base - h, cx + w, base, stone[4])
        c.vline(cx - w, base - h, base, stone[6]); c.vline(cx + w, base - h + 1, base, stone[2])
        c.hline(cx - w, cx + w, base, stone[1])
        return base - h

    fx, fy = foot
    top = stele(fx, fy, 5, 1)
    c.hline(fx - 1, fx + 1, top - 1, stone[5])
    hx, hy = head
    top = stele(hx, hy, 11)
    kind = v // 2
    if kind == 0:
        c.hline(hx - 1, hx + 1, top - 1, stone[5]); c.set(hx, top - 2, stone[6])
    elif kind == 1:
        c.hline(hx - 1, hx + 1, top - 1, stone[5])
    else:
        # A carved turban on a short neck.
        c.hline(hx - 1, hx + 1, top - 1, stone[3])
        for dy, half in [(-2, 3), (-3, 3), (-4, 3), (-5, 2), (-6, 1)]:
            c.hline(hx - half, hx + half, top + dy, stone[5])
            c.set(hx + half, top + dy, stone[3])
        c.line((hx - 3, top - 3), (hx + 2, top - 5), stone[3])
        c.set(hx, top - 7, stone[6])
    # Two incised lines stand for an inscription without inventing one.
    for y in (top + 3, top + 5):
        c.hline(hx - 1, hx + 1, y, stone[3])
    return c.image()


def jizo(v=0):
    from math import sqrt
    from .core import soft_outline
    from .solid import lathe
    c = Canvas(26, 34)
    stone = RAMPS['granite'] if v % 3 != 1 else RAMPS['limestone']
    red = ['#5a1812', '#8e241a', '#c43626', '#e8523c', '#ff7a5c']
    oak = RAMPS['oak7']
    walnut = RAMPS['walnut7']
    moss = ['#2a421c', '#42662c', '#628e42']
    cx = 12.5

    if v % 3 == 2:
        for lx in (4, 20):
            for y in range(11, 30):
                c.set(lx, y, walnut[4]); c.set(lx + 1, y, walnut[1])
        for lx in (3, 21):
            for y in range(10, 32):
                c.set(lx, y, oak[5]); c.set(lx + 1, y, oak[2])
        for dy in range(8):
            y = 3 + dy
            hw = 2 + int(dy * 1.4)
            for x in range(int(cx - hw), int(cx + hw) + 1):
                u = (x - cx) / max(1, hw)
                tone = 6 if dy == 0 else (5 if u < -0.15 else (4 if u < 0.35 else 2))
                if dy % 2 == 1 and dy < 7:
                    tone = max(1, tone - 1)
                c.set(x, y, walnut[tone])
        c.hline(2, 23, 10, walnut[1])

    for x in range(6, 20):
        u = (x - cx) / 6.8
        drop = round(1.8 * sqrt(max(0.0, 1.0 - min(1.0, u * u))))
        for y in range(27, 30 + drop):
            tone = 6 if (y == 27 and u < 0.3) else (5 if u < -0.3 else (4 if u < 0.35 else 2))
            if (x - 6) % 3 == 0 and y == 28:
                tone = max(2, tone - 1)
            c.set(x, y, stone[tone])

    lathe(c, cx, 27, [(0, 4.8), (4, 4.4), (9, 3.2)], stone, flat=False)

    for y in range(11, 18):
        for x in range(9, 17):
            u = (x - cx) / 3.6
            v_el = (y - 14.0) / 3.4
            if u * u + v_el * v_el <= 1.0:
                lit = -u * 0.65 - v_el * 0.65
                tone = 6 if lit > 0.35 else (5 if lit > -0.1 else (4 if lit > -0.45 else 3))
                c.set(x, y, stone[tone])
    c.set(11, 14, stone[2]); c.set(14, 14, stone[2])
    c.set(12, 15, stone[3]); c.set(13, 15, stone[3])

    if v % 3 != 0:
        for dy in range(5):
            y = 18 + dy
            hw = 4 - dy // 2
            for x in range(int(cx - hw), int(cx + hw) + 1):
                u = (x - cx) / max(1, hw)
                c.set(x, y, red[4] if dy == 0 else (red[3] if u < 0.25 else red[2]))
        if v % 3 == 1:
            for x in range(10, 16):
                c.set(x, 11, red[3] if x < 14 else red[2])
                c.set(x, 10, red[4] if x < 14 else red[3])
            c.set(12, 9, red[4]); c.set(13, 9, red[3])

    c.rect(12, 21, 13, 22, stone[5])
    for y in range(16, 27):
        c.set(16, y, RAMPS['brass7'][5 if y < 20 else 3])
    c.set(15, 16, RAMPS['brass7'][6]); c.set(17, 16, RAMPS['brass7'][4])

    c.set(7, 29, '#fcfaf2'); c.set(8, 29, '#c8d8e4')
    c.set(17, 29, '#ff9e22'); c.set(18, 29, moss[2])
    soft_outline(c, stone[0], stone[3])
    return c.image()


DETAILS = {'burial-stone': grave_stone, 'jizo': jizo}
