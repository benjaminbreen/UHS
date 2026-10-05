"""Buildings built as voxels and rendered into the oblique view.

A painter fills a grid one world pixel to a voxel, then `render` casts a ray
per sprite pixel along the game's projection (a pixel of wall per voxel, half
a pixel of roof per voxel of depth, DRIFT px of lean over the whole depth).
Light, cast shadow and occlusion come from the geometry, so a cornice shades
the wall under it and a railing throws its bars; colour comes from each
material's hand-made ramp, never from blending, so the result stays pixel art.

Glass does not stop a ray: what is just behind it shows through (goods,
curtains), a room further back reads as dark glass, and a diagonal sheen is
laid over both.
"""
import colorsys
import numpy as np

from art.oblique_style import DRIFT

K = 0.5
# Upper left and in front, as every oblique painter's SUN.
SUN = np.array([-0.5, -0.5, 0.8]) / np.linalg.norm([-0.5, -0.5, 0.8])
FACES = np.array([[0, 0, 1], [0, -1, 0], [1, 0, 0]], float)


def hexrgb(c):
    return tuple(int(c[i:i + 2], 16) for i in (1, 3, 5))


def ramp_from(base, n=8, shade='#2a2046', light='#fff1cf'):
    """A hue-shifted ramp through `base`: shadows cool toward violet and
    gain saturation, lights warm toward cream and lose it."""
    r, g, b = [v / 255 for v in hexrgb(base)]
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    sh, sl, ss = colorsys.rgb_to_hls(*[v / 255 for v in hexrgb(shade)])
    lh, ll, ls = colorsys.rgb_to_hls(*[v / 255 for v in hexrgb(light)])
    mid = n // 2
    out = []
    for i in range(n):
        if i < mid:
            t = (mid - i) / mid
            hh = h + (((sh - h + 0.5) % 1) - 0.5) * t * 0.35
            c = colorsys.hls_to_rgb(hh % 1, l + (sl - l) * t * 0.92, min(1, s + (ss - s) * t * 0.4 + 0.06 * t))
        else:
            t = (i - mid) / max(1, n - 1 - mid)
            hh = h + (((lh - h + 0.5) % 1) - 0.5) * t * 0.25
            c = colorsys.hls_to_rgb(hh % 1, l + (ll - l) * t * 0.8, s * (1 - 0.35 * t))
        out.append('#%02x%02x%02x' % tuple(round(max(0, min(1, v)) * 255) for v in c))
    return out


def h3(x, y, z, seed=0):
    """A stable hash in [0, 1) over integer arrays."""
    v = (np.asarray(x, np.int64) * 73856093) ^ (np.asarray(y, np.int64) * 19349663) \
        ^ (np.asarray(z, np.int64) * 83492791) ^ (seed * 2654435761)
    v = (v ^ (v >> 13)) * 1274126177
    return ((v ^ (v >> 16)) & 0xFFFF) / 65536.0


class Mat:
    def __init__(self, ramp, glass=False, see=False, tex=None, gain=1.0, bias=0.0, lamp=False, depth=5,
                 paint=False):
        self.ramp = [hexrgb(c) if isinstance(c, str) else c for c in ramp]
        self.glass, self.see, self.tex = glass, see, tex
        # Coloured voxel by voxel from Grid.paint, stepped by light: a decal
        # such as a figure at a window, not a surface of the building.
        self.paint = paint
        # How far behind a pane things still show through it.
        self.depth = depth
        self.gain, self.bias, self.lamp = gain, bias, lamp


class Grid:
    """World voxels. x runs along the front, y back from the front wall's
    face, z up from the ground. Ranges are half-open."""

    def __init__(self, x0, x1, y0, y1, z1):
        self.x0, self.y0 = x0, y0
        self.m = np.zeros((x1 - x0, y1 - y0, z1), np.uint8)
        self.n = np.zeros_like(self.m)
        self.mats = [None]
        self.normals = [np.zeros(3)]
        self.paint = None

    def decal(self, x0, y, z0, rgba, m, only_empty=True):
        """Stand an RGBA image upright at depth y, its bottom-left voxel at
        (x0, z0), as voxels of the painted material `m`; only into empty
        space unless told otherwise, so a wall or a sill stays in front."""
        if self.paint is None:
            self.paint = np.zeros(self.m.shape + (3,), np.uint8)
        h, w = rgba.shape[:2]
        X, Y, Z = self.m.shape
        yi = y - self.y0
        for r in range(h):
            z = z0 + (h - 1 - r)
            for c in range(w):
                if rgba[r, c, 3] < 128:
                    continue
                xi = x0 + c - self.x0
                if not (0 <= xi < X and 0 <= yi < Y and 0 <= z < Z):
                    continue
                if only_empty and self.m[xi, yi, z] and not self.mats[self.m[xi, yi, z]].glass \
                        and not self.mats[self.m[xi, yi, z]].see:
                    continue
                self.m[xi, yi, z] = m
                self.n[xi, yi, z] = 0
                self.paint[xi, yi, z] = rgba[r, c, :3]

    def mat(self, *a, **k):
        self.mats.append(Mat(*a, **k))
        return len(self.mats) - 1

    def normal(self, v):
        v = np.array(v, float)
        self.normals.append(v / np.linalg.norm(v))
        return len(self.normals) - 1

    def _sl(self, x0, x1, y0, y1, z0, z1):
        X, Y, Z = self.m.shape
        a, b = max(0, x0 - self.x0), min(X, x1 - self.x0)
        c, d = max(0, y0 - self.y0), min(Y, y1 - self.y0)
        e, f = max(0, z0), min(Z, z1)
        return (slice(a, b), slice(c, d), slice(e, f)), (a + self.x0, c + self.y0, e)

    def box(self, x0, x1, y0, y1, z0, z1, m, normal=0):
        s, _ = self._sl(x0, x1, y0, y1, z0, z1)
        self.m[s] = m
        self.n[s] = normal

    def fill(self, x0, x1, y0, y1, z0, z1, pred, m, normal=0):
        """Set the voxels in the box whose centre-free integer coords satisfy
        `pred(X, Y, Z)`."""
        s, (ax, ay, az) = self._sl(x0, x1, y0, y1, z0, z1)
        shp = self.m[s].shape
        if 0 in shp:
            return
        X, Y, Z = np.meshgrid(np.arange(shp[0]) + ax, np.arange(shp[1]) + ay, np.arange(shp[2]) + az,
                              indexing='ij')
        k = pred(X, Y, Z)
        self.m[s][k] = m
        self.n[s][k] = normal

    def paint(self, x0, x1, y0, y1, z0, z1, m, where=None):
        """Recolour solid voxels only, as a decal on what is already built."""
        s, _ = self._sl(x0, x1, y0, y1, z0, z1)
        v = self.m[s]
        k = v > 0 if where is None else np.isin(v, where)
        v[k] = m


def _occlusion(solid, r=2):
    """Fraction of solid voxels in the (2r+1)^3 box around each voxel."""
    s = np.pad(solid.astype(np.int32), ((r + 1, r), (r + 1, r), (r + 1, r)))
    c = s.cumsum(0).cumsum(1).cumsum(2)
    k = 2 * r + 1
    X, Y, Z = solid.shape
    a = lambda i, j, l: c[i:i + X, j:j + Y, l:l + Z]
    t = (a(k, k, k) - a(0, k, k) - a(k, 0, k) - a(k, k, 0)
         + a(0, 0, k) + a(0, k, 0) + a(k, 0, 0) - a(0, 0, 0))
    return t / k ** 3


def render(g, width, height, sx0, base, depth, ambient=0.52, sun=0.62, region=None, k=K):
    """Cast the grid into a `width` x `height` RGBA image.

    World (x, y, z) lands at screen (sx0 + x + y*DRIFT/depth, base - z - k*y);
    `k` below K compresses depth as the oblique house style does.
    Returns the image and per-pixel buffers the painter may use: material,
    voxel coords, the ray distance to the hit, and glass-ness. `region`
    (x0, y0, x1, y1) casts only the rays in that rect; the rest stay empty."""
    M = g.m
    X, Y, Z = M.shape
    r = DRIFT / depth
    glassy = np.array([bool(m and m.glass) for m in g.mats] + [False] * (256 - len(g.mats)))
    seethru = np.array([bool(m and m.see) for m in g.mats] + [False] * (256 - len(g.mats)))
    N = width * height
    px = np.tile(np.arange(width), height)
    py = np.repeat(np.arange(height), width)
    cx = px + 0.5 - sx0
    cz = base - (py + 0.5)
    hit = np.full(N, -1, np.int64)
    face = np.zeros(N, np.int8)
    dist = np.full(N, 1e9)
    ghit = np.full(N, -1, np.int64)
    gdist = np.full(N, 1e9)
    act = np.arange(N)
    if region:
        rx0, ry0, rx1, ry1 = region
        act = act[(px >= rx0) & (px < rx1) & (py >= ry0) & (py < ry1)]
    step = 0.25
    ys = np.arange(g.y0, g.y0 + Y, step)
    prev = None
    Mf = M.reshape(-1)
    for yt in ys:
        x = cx[act] - r * yt
        z = cz[act] - k * yt
        xi = np.floor(x).astype(np.int64) - g.x0
        yi = int(np.floor(yt)) - g.y0
        zi = np.floor(z).astype(np.int64)
        below = zi < 0
        inb = (xi >= 0) & (xi < X) & (zi >= 0) & (zi < Z)
        idx = np.where(inb, (xi * Y + yi) * Z + zi, 0)
        m = np.where(inb, Mf[idx], 0)
        if prev is None:
            prev = (xi, zi, np.full(len(act), yi - 1))
        pxi, pzi, pyi = prev
        g_new = glassy[m] & (ghit[act] < 0)
        if g_new.any():
            ghit[act[g_new]] = idx[g_new]
            gdist[act[g_new]] = yt
        stop = (m > 0) & ~glassy[m] & ~seethru[m]
        if stop.any():
            a = act[stop]
            hit[a] = idx[stop]
            dist[a] = yt
            f = np.where(zi[stop] != pzi[stop], 0, np.where(yi != pyi[stop], 1, 2))
            face[a] = f
        keep = ~stop & ~below
        act = act[keep]
        prev = (xi[keep], zi[keep], np.full(keep.sum(), yi))
        if not len(act):
            break
    return _shade(g, hit, face, dist, ghit, gdist, width, height, ambient, sun)


def _unravel(g, idx):
    X, Y, Z = g.m.shape
    xi, rem = np.divmod(idx, Y * Z)
    yi, zi = np.divmod(rem, Z)
    return xi, yi, zi


def _light(g, idx, fnorm, ambient, sun, occ):
    """Direct sun with cast shadow, plus ambient scaled by occlusion."""
    M = g.m
    X, Y, Z = M.shape
    xi, yi, zi = _unravel(g, idx)
    nid = g.n.reshape(-1)[idx]
    table = np.array(g.normals)
    n = np.where(nid[:, None] > 0, table[nid], fnorm)
    lam = np.clip(n @ SUN, 0, None)
    # Leave from the face the ray saw, one voxel's worth, so a surface does
    # not shadow itself; whole-voxel starts keep shadow edges pixel-clean.
    start = np.stack([xi, yi, zi], 1) + 0.5 + fnorm * 0.55
    lit = lam > 0
    see = np.array([bool(m and (m.glass or m.see)) for m in g.mats] + [False] * (256 - len(g.mats)))
    alive = np.where(lit)[0]
    pos = start[alive].copy()
    for _ in range(140):
        pos += SUN * 0.5
        q = np.floor(pos).astype(np.int64)
        inb = (q[:, 0] >= 0) & (q[:, 0] < X) & (q[:, 1] >= 0) & (q[:, 1] < Y) & (q[:, 2] >= 0) & (q[:, 2] < Z)
        v = np.zeros(len(q), np.uint8)
        v[inb] = M[q[inb, 0], q[inb, 1], q[inb, 2]]
        blocked = (v > 0) & ~see[v]
        lit[alive[blocked]] = False
        out = ~inb & (q[:, 2] >= Z)
        keep = ~blocked & ~out
        alive, pos = alive[keep], pos[keep]
        if not len(alive):
            break
    o = np.clip(np.round(np.stack([xi, yi, zi], 1) + 0.5 + n * 2.0).astype(np.int64), 0, np.array([X - 1, Y - 1, Z - 1]))
    ao = occ[o[:, 0], o[:, 1], o[:, 2]]
    ao = np.clip(1 - (ao - 0.3) * 2.2, 0.35, 1.0)
    return ambient * ao + sun * lam * lit, lit, n, ao


def _shade(g, hit, face, dist, ghit, gdist, width, height, ambient, sun):
    N = width * height
    solid = (g.m > 0) & ~np.isin(g.m, [i for i, m in enumerate(g.mats) if m and (m.glass or m.see)])
    occ = _occlusion(solid)
    rgb = np.zeros((N, 4), np.uint8)
    level = np.full(N, -1, np.int16)
    matbuf = np.zeros(N, np.uint8)
    coords = np.full((N, 3), -1, np.int64)
    nz = np.zeros(N)
    sel = np.where(hit >= 0)[0]
    fn = FACES[face[sel]]
    light, lit, nrm, ao = _light(g, hit[sel], fn, ambient, sun, occ)
    nz[sel] = nrm[:, 2]
    m = g.m.reshape(-1)[hit[sel]]
    xi, yi, zi = _unravel(g, hit[sel])
    wx, wy = xi + g.x0, yi + g.y0
    info = {'x': wx, 'y': wy, 'z': zi, 'face': face[sel], 'lit': lit, 'light': light, 'ao': ao, 'n': nrm}
    idx = np.zeros(len(sel), np.int16)
    for mid in np.unique(m):
        mat = g.mats[mid]
        k = m == mid
        n = len(mat.ramp)
        v = light[k] * mat.gain * (n - 1) + mat.bias
        if mat.tex:
            v = v + mat.tex({a: (b[k] if hasattr(b, '__len__') else b) for a, b in info.items()})
        v = np.clip(np.floor(v + 0.5), 0, n - 1).astype(np.int16)
        idx[k] = v
    # A near edge over something far behind darkens on its shadow side.
    level[sel] = idx
    matbuf[sel] = m
    coords[sel] = np.stack([wx, wy, zi], 1)
    d2 = dist.reshape(height, width)
    lv = level.reshape(height, width)
    far_r = np.zeros_like(d2, bool)
    far_b = np.zeros_like(d2, bool)
    far_r[:, :-1] = d2[:, 1:] > d2[:, :-1] + 6
    far_b[:-1, :] = d2[1:, :] > d2[:-1, :] + 6
    edge = (far_r | far_b).reshape(-1) & (level >= 0)
    level[edge] = np.maximum(0, level[edge] - 1)
    lightbuf = np.zeros(N)
    lightbuf[sel] = light
    litbuf = np.zeros(N, bool)
    litbuf[sel] = lit
    for mid in np.unique(matbuf[level >= 0]):
        mat = g.mats[mid]
        k = (matbuf == mid) & (level >= 0)
        if mat.paint:
            c = coords[k]
            pc = g.paint[c[:, 0] - g.x0, c[:, 1] - g.y0, c[:, 2]].astype(float)
            L = lightbuf[k]
            f = np.where(L > 0.8, 1.0, np.where(L > 0.6, 0.8, 0.62))
            rgb[k, :3] = np.clip(pc * f[:, None], 0, 255).astype(np.uint8)
            rgb[k, 3] = 255
            continue
        ramp = np.array(mat.ramp, np.uint8)
        rgb[k, :3] = ramp[np.clip(level[k], 0, len(ramp) - 1)]
        rgb[k, 3] = 255
    # Glass over what is behind it.
    gsel = np.where(ghit >= 0)[0]
    glass_px = np.zeros(N, bool)
    gmat = np.zeros(N, np.uint8)
    if len(gsel):
        gmat[gsel] = g.m.reshape(-1)[ghit[gsel]]
        gm = g.m.reshape(-1)[ghit[gsel]]
        gx, gy, gz = _unravel(g, ghit[gsel])
        gfn = FACES[np.ones(len(gsel), np.int8)]
        glight, glit, _, gao = _light(g, ghit[gsel], gfn, ambient, sun, occ)
        behind = dist[gsel] - gdist[gsel]
        for mid in np.unique(gm):
            mat = g.mats[mid]
            k = gm == mid
            a = gsel[k]
            ramp = np.array(mat.ramp, np.uint8)
            n = len(ramp)
            wx, wz = gx[k] + g.x0, gz[k]
            sheen = (((wx + wz) % 19 < 2) | ((wx + wz) % 19 == 4)) & glit[k]
            v = glight[k] * (n - 1) * 0.55 + mat.bias
            v = np.where(sheen, v + 2.5, v)
            v = np.clip(np.floor(v + 0.5), 0, n - 1).astype(int)
            close = (behind[k] <= mat.depth) & (level[a] >= 0)
            # What is close behind the pane shows a step dimmer, on its own
            # ramp, and the sheen crosses it.
            dim = rgb[a, :3].copy()
            for bm in np.unique(matbuf[a]):
                if not bm:
                    continue
                q = matbuf[a] == bm
                br = np.array(g.mats[bm].ramp, np.uint8)
                dim[q] = br[np.clip(level[a][q] - 1 - (behind[k][q] > 8), 0, len(br) - 1)]
            out = np.where((close & ~sheen)[:, None], dim, ramp[v])
            rgb[a, :3] = out
            rgb[a, 3] = 255
            glass_px[a] = ~close
    img = rgb.reshape(height, width, 4)
    buf = {'mat': matbuf.reshape(height, width), 'coords': coords.reshape(height, width, 3),
           'dist': d2, 'glass': glass_px.reshape(height, width), 'level': level.reshape(height, width),
           'gmat': gmat.reshape(height, width), 'nz': nz.reshape(height, width), 'face': face.reshape(height, width),
           'light': lightbuf.reshape(height, width), 'lit': litbuf.reshape(height, width)}
    return img, buf
