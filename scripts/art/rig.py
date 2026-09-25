"""Geometry shared by the four-direction rigs drawn as tubes along a keyed
spine (proboscidean, cervid). Model units are pixels at scale 1 with the
ground on row GM; `use` sets the scale and canvas of the animal being drawn."""
import math
from art.fauna_b import Canvas as _BCanvas

S = dict(s=1.0, G=64, GM=64, HR=0, W=64, palette={})


def use(s, gm, w, hm, palette):
    S.update(s=s, GM=gm, G=round(gm * s), W=round(w * s), HR=round(hm * s), palette=palette)


def T(p):
    return p[0] * S["s"], S["G"] + (p[1] - S["GM"]) * S["s"]


def at(p):
    x, y = T(p)
    return round(x), round(y)


class Canvas(_BCanvas):
    def __init__(self):
        self.w, self.h = S["W"], S["G"] + 4 + S["HR"]
        self.palette = S["palette"]
        self.px = {}
        self.post = {}

    def finish(self):
        hr = S["HR"]
        self.px = {(x, y + hr): r for (x, y), r in self.px.items()}
        im = super().finish()
        px = im.load()
        for (x, y), role in self.post.items():
            y += hr
            if 0 <= x < self.w and 0 <= y < self.h:
                c = self.palette[role]
                px[x, y] = tuple(int(c[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        return im


def disk(cx, cy, r, sy=1.0):
    (cx, cy), r = T((cx, cy)), r * S["s"]
    out = set()
    for x in range(math.floor(cx - r), math.ceil(cx + r) + 1):
        for y in range(math.floor(cy - r * sy), math.ceil(cy + r * sy) + 1):
            if (x - cx) ** 2 + ((y - cy) / sy) ** 2 <= r * r + 0.15:
                out.add((x, y))
    return out


def tube(pts, radii):
    out = set()
    for (a, ra), (b, rb) in zip(zip(pts, radii), zip(pts[1:], radii[1:])):
        n = max(2, int(math.hypot(b[0] - a[0], b[1] - a[1]) * 2))
        for i in range(n + 1):
            u = i / n
            out |= disk(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, ra + (rb - ra) * u)
    return out


def poly(pts):
    """A filled polygon in model units."""
    pts = [T(p) for p in pts]
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    out = set()
    for y in range(math.floor(min(ys)), math.ceil(max(ys)) + 1):
        for x in range(math.floor(min(xs)), math.ceil(max(xs)) + 1):
            inside = False
            for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
                if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
                    inside = not inside
            if inside:
                out.add((x, y))
    return out


def rot(v, deg):
    a = math.radians(deg)
    return v[0] * math.cos(a) - v[1] * math.sin(a), v[0] * math.sin(a) + v[1] * math.cos(a)


def add(p, v, k=1.0):
    return p[0] + v[0] * k, p[1] + v[1] * k


def lerp(a, b, u):
    if isinstance(a, (tuple, list)):
        return tuple(lerp(x, y, u) for x, y in zip(a, b))
    return a + (b - a) * u


def smooth(keys, t):
    """Ease between keyed values; keys are (time 0-1, value), cyclic."""
    keys = sorted(keys, key=lambda k: k[0])
    for (t0, v0), (t1, v1) in zip(keys, keys[1:] + [(keys[0][0] + 1, keys[0][1])]):
        tt = t if t >= t0 else t + 1
        if t0 <= tt <= t1:
            u = (tt - t0) / (t1 - t0) if t1 > t0 else 0
            return lerp(v0, v1, u * u * (3 - 2 * u))
    return keys[0][1]


def noise(x, salt=0):
    return ((x * 73856093) ^ (salt * 19349663 + 83492791)) % 997 / 997


def rimmed(c, mask, roles):
    """Paint a part inside the silhouette with its own dark rim."""
    for x, y in mask:
        c.px[(x, y)] = roles(x, y)
    for x, y in mask:
        for q in ((x + 1, y), (x - 1, y), (x, y - 1), (x, y + 1)):
            if q not in mask and q in c.px:
                c.px[q] = "o"
