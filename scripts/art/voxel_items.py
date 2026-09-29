"""Inventory items as voxel models, rendered at any angle.

Shapes are written in icon-pixel units in a 24-unit box (x, y centred, z up
from 0); Model.K voxels to the unit sets the resolution. The light is fixed to
the camera, so an item turns under it in the detail view, and colour comes
from each material's stepped ramp, so the result stays pixel art.

  .venv/bin/python scripts/art/voxel_items.py [out.png] [--old old.json]
  .venv/bin/python scripts/art/voxel_items.py --bake   # public/items for the game
"""
import math
import sys

import numpy as np

sys.path.insert(0, __file__.rsplit('/', 2)[0])
from art.voxel import _occlusion, h3, hexrgb  # noqa: E402

def item_ramp(base, n=10):
    """Shadows sink toward a cool violet and gain saturation; lights lift
    toward a warm tint of the same hue and keep their colour, never cream."""
    import colorsys
    r, g, b = [v / 255 for v in hexrgb(base)]
    h, l, s_ = colorsys.rgb_to_hls(r, g, b)
    out = []
    for i in range(n):
        t = i / (n - 1) * 2 - 1  # -1 deepest, +1 lightest
        if t < 0:
            hh = h + ((((0.72 - h) + 0.5) % 1) - 0.5) * -t * 0.22
            c = colorsys.hls_to_rgb(hh % 1, l * (1 + t * 0.72), min(1, s_ * (1 - t * 0.25)))
        else:
            hh = h + ((((0.11 - h) + 0.5) % 1) - 0.5) * t * 0.12
            c = colorsys.hls_to_rgb(hh % 1, l + (0.86 - l) * t * 0.55, s_ * (1 - t * 0.12))
        out.append('#%02x%02x%02x' % tuple(round(max(0, min(1, v)) * 255) for v in c))
    return out



def render(M, yaw, pitch=28, ppv=1.0, size=24, center=None, index=False):
    """Orthographic, light fixed to the camera so the item turns under it.
    `index` returns material in red and ramp step in green instead of colour,
    for the game to colour with a cloth's own dye; blue carries where on the
    item the pixel is (across in the low four bits, up in the high), so a
    fibre's texture is fixed to the cloth and turns with it."""
    n = M.m.shape[0]; kk = M.K
    a, p = math.radians(yaw), math.radians(pitch)
    d = np.array([-math.sin(a) * math.cos(p), math.cos(a) * math.cos(p), -math.sin(p)])  # toward the item
    u = np.array([math.cos(a), math.sin(a), 0.0])
    v = np.cross(u, d); v /= np.linalg.norm(v)
    L = -d * 0.55 - u * 0.55 + v * 0.65; L /= np.linalg.norm(L)
    c = np.array([n / 2, n / 2, n / 2]) if center is None else np.asarray(center, float)
    ys, xs = np.mgrid[0:size, 0:size]
    su = (xs + .5 - size / 2) / ppv; sv = (size / 2 - ys - .5) / ppv
    o = c + su[..., None] * u + sv[..., None] * v - d * n
    o = o.reshape(-1, 3)
    N = len(o)
    hit = np.full(N, -1); face = np.zeros((N, 3)); depth = np.full(N, 1e9)
    prev = np.floor(o).astype(int)
    act = np.arange(N)
    for t in np.arange(0, 2 * n, 0.2):
        q = o[act] + d * t
        qi = np.floor(q).astype(int)
        inb = np.all((qi >= 0) & (qi < n), 1)
        val = np.zeros(len(act), np.uint8)
        val[inb] = M.m[qi[inb, 0], qi[inb, 1], qi[inb, 2]]
        s = val > 0
        if s.any():
            a_ = act[s]
            hit[a_] = np.ravel_multi_index(qi[s].T, M.m.shape)
            # The axis crossed most recently is the face the ray entered by.
            fr = q[s] - qi[s]
            back = np.where(d > 0, fr, 1 - fr) / np.maximum(np.abs(d), 1e-6)
            for ax in range(3):
                nb = qi[s].copy(); nb[:, ax] -= int(np.sign(d[ax]))
                ok = np.all((nb >= 0) & (nb < n), 1)
                full = np.zeros(len(nb), bool)
                full[ok] = M.m[nb[ok, 0], nb[ok, 1], nb[ok, 2]] > 0
                back[full, ax] = 1e9
            k = np.argmin(back, 1)
            f = np.zeros((s.sum(), 3)); f[np.arange(s.sum()), k] = -np.sign(d[k])
            face[a_] = f; depth[a_] = t
        prev[act] = qi
        act = act[~s]
        if not len(act): break
    if not hasattr(M, 'occ'):
        M.occ = _occlusion(M.m > 0, kk)
        M.grad = np.gradient(_occlusion(M.m > 0, 3 * kk))
    occ = M.occ
    img = np.zeros((N, 4), np.uint8)
    lvl = np.full(N, -1); mat = np.zeros(N, int)
    sel = np.where(hit >= 0)[0]
    xi, yi, zi = np.unravel_index(hit[sel], M.m.shape)
    fn = face[sel]
    # Normals from the blurred solid, so a curve shades as a curve rather
    # than a staircase; the entry face still decides the flat ones.
    gx, gy, gz = M.grad
    sm = -np.stack([gx[xi, yi, zi], gy[xi, yi, zi], gz[xi, yi, zi]], 1)
    sm /= np.maximum(np.linalg.norm(sm, axis=1, keepdims=True), 1e-6)
    nn = sm * 0.85 + fn * 0.15
    nn /= np.maximum(np.linalg.norm(nn, axis=1, keepdims=True), 1e-6)
    lam = np.clip((nn * L).sum(1), 0, None)
    oi = np.clip(np.stack([xi, yi, zi], 1) + fn * 2 * kk, 0, n - 1).astype(int)
    ao = np.clip(1 - (occ[oi[:, 0], oi[:, 1], oi[:, 2]] - 0.25) * 2.0, 0.4, 1)
    m = M.m[xi, yi, zi]
    hv = L - d; hv /= np.linalg.norm(hv)
    spec = np.clip((nn * hv).sum(1), 0, 1) ** 24 * np.array(M.gloss)[m]
    light = 0.30 * ao + 0.62 * lam + spec
    mat[sel] = m
    lvl[sel] = np.clip(np.floor(light * 8 + 0.5), 0, 9)
    dd = depth.reshape(size, size); lv = lvl.reshape(size, size)
    # A near edge over something far behind steps darker, as in voxel.py.
    edge = np.zeros_like(dd, bool)
    edge[:, 1:] |= dd[:, :-1] > dd[:, 1:] + 4
    edge[1:, :] |= dd[:-1, :] > dd[1:, :] + 4
    lv[edge & (lv > 0)] -= 1
    # A lone pixel of one step against its neighbours is noise from the
    # voxel stairs, not form: take the neighbours' step.
    mm0 = mat.reshape(size, size)
    for _ in range(2):
        nb = np.stack([np.roll(lv, sh, (0, 1)) for sh in ((1, 0), (-1, 0), (0, 1), (0, -1))])
        nm = np.stack([np.roll(mm0, sh, (0, 1)) for sh in ((1, 0), (-1, 0), (0, 1), (0, -1))])
        same = (nm == mm0) & (nb >= 0)
        cnt = same.sum(0)
        med = np.where(same, nb, 0).sum(0) / np.maximum(cnt, 1)
        lone = (lv >= 0) & (cnt >= 3) & (np.abs(lv - med) >= 0.75) & np.all(~same | (nb != lv), 0)
        lv = np.where(lone, np.round(med).astype(lv.dtype), lv)
    lvl = lv.reshape(-1)
    glow = np.array(M.glow)[mat] & (lvl >= 0)
    lvl[glow] = np.clip(lvl[glow] + 4, 0, 9)
    if index:
        out = np.zeros((N, 4), np.uint8)
        k = lvl >= 0
        across = np.zeros(N, int); up = np.zeros(N, int)
        across[sel] = (xi + yi) // kk; up[sel] = zi // kk
        out[k, 0], out[k, 1], out[k, 3] = mat[k], lvl[k], 255
        # Only cloth takes a fibre; elsewhere the place would just cost bytes.
        cloth = np.array([b is not None and b == M.dye for b in M.bases])[mat] & k
        out[cloth, 2] = (across[cloth] & 15) | ((up[cloth] & 15) << 4)
        out = out.reshape(size, size, 4)
    for i in np.unique(m):
        k = mat == i
        r = np.array([tuple(int(h[j:j + 2], 16) for j in (1, 3, 5)) for h in M.ramps[i]])
        img[k, :3] = r[lvl[k]]; img[k, 3] = 255
    img = img.reshape(size, size, 4)
    # Outline: the darkest step of the neighbouring material, like the old icons.
    solid = img[..., 3] > 0
    ring = np.zeros_like(solid)
    ring[1:] |= solid[:-1]; ring[:-1] |= solid[1:]; ring[:, 1:] |= solid[:, :-1]; ring[:, :-1] |= solid[:, 1:]
    ring &= ~solid
    # Each outline pixel takes the darkest tone of the material it borders.
    mm = mat.reshape(size, size)
    near = np.zeros_like(mm)
    for sh in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        near = np.maximum(near, np.roll(mm, sh, (0, 1)))
    for i in np.unique(near[ring]):
        if not i: continue
        c = M.ramps[i][0]
        img[ring & (near == i)] = tuple(int(c[j:j + 2], 16) for j in (1, 3, 5)) + (255,)
        if index:
            out[ring & (near == i)] = (i, 0, 0, 255)
    return out if index else img


class Model:
    K = 2

    def __init__(self, view=(20, 28)):
        n = 24 * self.K
        self.m = np.zeros((n, n, n), np.uint8)
        self.ramps, self.gloss, self.glow, self.bases = [None], [0], [False], [None]
        # The cloth colour a game id may replace; see `bake`.
        self.dye = None
        self.view = view
        i = (np.arange(n) + .5) / self.K
        self.X, self.Y, self.Z = np.meshgrid(i - 12, i - 12, i, indexing='ij')

    def mat(self, base, gloss=0, glow=False):
        self.ramps.append(item_ramp(base)); self.gloss.append(gloss); self.glow.append(glow); self.bases.append(base)
        return len(self.ramps) - 1

    def put(self, mask, mat):
        self.m[mask] = mat
        return mask

    def noise(self, cell=1.0, seed=0):
        c = lambda a: np.floor((a + 20) / cell).astype(int)
        return h3(c(self.X), c(self.Y), c(self.Z), seed)

    def ell(self, c, r):
        return ((self.X - c[0]) / r[0]) ** 2 + ((self.Y - c[1]) / r[1]) ** 2 + ((self.Z - c[2]) / r[2]) ** 2 <= 1

    def box(self, x0, x1, y0, y1, z0, z1):
        X, Y, Z = self.X, self.Y, self.Z
        return (X >= x0) & (X < x1) & (Y >= y0) & (Y < y1) & (Z >= z0) & (Z < z1)

    def seg(self, a, b, r0, r1=None):
        """A capsule from a to b, tapering r0 to r1."""
        a, b = np.array(a, float), np.array(b, float)
        ab = b - a
        t = np.clip(((self.X - a[0]) * ab[0] + (self.Y - a[1]) * ab[1] + (self.Z - a[2]) * ab[2]) / (ab @ ab), 0, 1)
        dx, dy, dz = self.X - a[0] - t * ab[0], self.Y - a[1] - t * ab[1], self.Z - a[2] - t * ab[2]
        r = r0 + (r0 if r1 is None else r1 - r0) * t * (r1 is not None)
        return dx * dx + dy * dy + dz * dz <= r * r

    def lathe(self, zs, rs, wall=None, cx=0, cy=0):
        R = np.hypot(self.X - cx, self.Y - cy)
        prof = np.interp(self.Z, zs, rs, left=-1, right=-1)
        solid = R <= prof
        if wall:
            solid &= (R >= prof - wall) | (self.Z < zs[0] + wall)
        return solid

    def panel(self, shape, depth=1.6, puff=1.2):
        """Cloth laid flat facing the viewer: a 2D mask in (X, Z), thicker in
        the middle so it rounds like fabric rather than board."""
        X, Z = self.X, self.Z
        m = shape(X, Z)
        # How far in from the nearest side edge, by scanning the mask in x.
        cur = m[:, 0, :].copy()
        dist = np.zeros(cur.shape)
        for _ in range(3 * self.K):
            dist += cur
            e = cur.copy()
            e[1:] &= cur[:-1]; e[:-1] &= cur[1:]; e[:, 1:] &= cur[:, :-1]; e[:, :-1] &= cur[:, 1:]
            cur = e
        dist /= self.K
        t = depth + np.minimum(dist, 3) / 3 * puff
        return m & (np.abs(self.Y) <= t[:, None, :])


def cloth_bits(M, shape, dye, trim=None, pattern=None):
    M.dye = dye
    body = M.mat(dye)
    s = M.put(M.panel(shape), body)
    if pattern == 'stripes':
        M.put(s & (np.floor(M.Z) % 4 == 0), M.mat(item_ramp(dye)[3]))
    if pattern == 'checks':
        M.put(s & ((np.floor(M.Z / 2) + np.floor((M.X + 20) / 2)) % 2 == 0), M.mat(item_ramp(dye)[3]))
    return s, body, (M.mat(trim) if trim else None)

# ---- clothes ---------------------------------------------------------------

def tunic(dye='#a83b34', trim='#d3bb45', pattern=None, long=False):
    M = Model()
    hem = 0.5 if long else 2
    def shape(X, Z):
        torso = (np.abs(X) <= 5 + np.clip(9 - Z, 0, 9) * 0.22) & (Z >= hem) & (Z <= 19)
        sleeve = (np.abs(X) <= 10.5) & (Z >= 14) & (Z <= 19) & (Z - 14 >= (np.abs(X) - 6) * 0.4)
        return (torso | sleeve) & ~((np.abs(X) <= 2.2) & (Z >= 17.6))
    s, body, tr = cloth_bits(M, shape, dye, trim, pattern)
    M.put(s & (M.Z < hem + 1.5), tr)
    M.put(s & (np.abs(M.X) > 9.6), tr)
    M.put(s & (np.abs(M.X) < 3.2) & (M.Z > 16.8) & (M.Y < 0), tr)
    return M

def shirt(dye='#efe9d8'):
    M = tunic(dye, '#c9bda2')
    M.put(M.box(-0.5, 0.5, -4, -1, 6, 17) & (M.m > 0), M.mat('#c9bda2'))
    for z in (8, 11, 14):
        M.put(M.ell((0, -2.2, z), (0.7, 0.7, 0.7)), M.mat('#6b5334'))
    return M

def robe(dye='#4a6c8c', trim='#d9a53a'):
    M = Model()
    def shape(X, Z):
        torso = (np.abs(X) <= 4.5 + np.clip(12 - Z, 0, 12) * 0.28) & (Z >= 0.3) & (Z <= 20)
        sleeve = (np.abs(X) <= 11) & (Z >= 11 + np.clip(np.abs(X) - 5, 0, 9) * -0.3) & (Z <= 20) & (Z - 11 >= (np.abs(X) - 7) * 0.9)
        return (torso | sleeve) & ~((np.abs(X) <= 1.5) & (Z >= 16) & (Z - 16 >= np.abs(X) * -2.5))
    s, body, tr = cloth_bits(M, shape, dye, trim)
    M.put(s & (M.Z < 1.6), tr)
    M.put(s & (np.abs(M.Z - 10) < 1), M.mat('#a83b34'))
    M.put(s & (np.abs(M.X) < 1.6 - (M.Z - 16) * 0.3) & (M.Z > 12) & (M.Y < 0) & ~(np.abs(M.X) < 1.2 - (M.Z - 16) * 0.3), tr)
    return M

def dress(dye='#2f6e6a', trim='#efe9d8'):
    M = Model()
    def shape(X, Z):
        body = (np.abs(X) <= np.where(Z > 12, 4, 4 + (12 - Z) * 0.5)) & (Z >= 0.5) & (Z <= 19)
        strap = (np.abs(np.abs(X) - 3) < 1) & (Z >= 18) & (Z <= 21)
        return body | strap
    s, body, tr = cloth_bits(M, shape, dye, trim)
    M.put(s & (np.abs(M.Z - 12) < 0.8), tr)
    M.put(s & (M.Z < 1.8), tr)
    M.put(s & (M.Z < 11) & (np.floor((M.X + 20) * 0.75 + M.Z * 0.0) % 3 == 0) & (M.Y < -1), M.mat(item_ramp(dye)[3]))
    return M

def skirt(dye='#b89343', trim='#6b4a2c'):
    M = Model()
    s, body, tr = cloth_bits(M, lambda X, Z: (np.abs(X) <= 4.5 + (17 - Z) * 0.35) & (Z >= 2) & (Z <= 17), dye, trim, 'stripes')
    M.put(s & (M.Z > 15.5), tr)
    return M

def trousers(dye='#4a6c8c'):
    M = Model()
    leg = lambda X, Z, sx: np.abs(X - sx * (2.5 + (18 - Z) * 0.06)) <= 2.6
    s, body, tr = cloth_bits(M, lambda X, Z: (((leg(X, Z, -1) | leg(X, Z, 1)) & (Z >= 1) & (Z <= 18)) | ((np.abs(X) <= 5.1) & (Z >= 12) & (Z <= 19.5))), dye, '#6b4a2c')
    M.put(s & (M.Z > 18.3), tr)
    M.put(s & (M.Z < 2.2), M.mat(item_ramp(dye)[3]))
    return M

def cloak(dye='#3a3733', lining='#a83b34'):
    M = Model()
    s, body, tr = cloth_bits(M, lambda X, Z: (np.abs(X) <= 4 + (21 - Z) * 0.33) & (Z >= 1) & (Z <= 21), dye, lining)
    M.put(s & (np.abs(M.X) > 3.5 + (21 - M.Z) * 0.33) & (M.Z < 12), tr)
    for i in range(-3, 4):
        M.put(s & (np.abs(M.X - i * 2.2 * (21 - M.Z) / 20) < 0.35) & (M.Z < 17) & (M.Y < -1), M.mat(item_ramp(dye)[2]))
    M.put(M.ell((0, -2.4, 19.5), (1.5, 1, 1.5)), M.mat('#d9b35a', 0.8))
    return M

def poncho(dye='#a83b34'):
    M = Model()
    s, body, tr = cloth_bits(M, lambda X, Z: (np.abs(X) / 11 + np.abs(Z - 11) / 9 <= 1) & ~((np.abs(X) < 1.8) & (np.abs(Z - 18) < 1.2)), dye, '#efe9d8')
    M.put(s & ((np.abs(M.Z - 11 - np.abs(M.X) * 0.0) % 5) < 1), tr)
    M.put(s & ((np.abs(M.Z - 11) % 5 > 2) & (np.abs(M.Z - 11) % 5 < 3)), M.mat('#2a2a3a'))
    for x in np.arange(-6, 7, 1.5):
        M.put(M.seg((x, 0, 2.5 + abs(x) * 0.82), (x, 0, 0.5 + abs(x) * 0.82), 0.4), M.mat('#efe9d8'))
    return M

def loincloth(dye='#ded0b0'):
    M = Model()
    s, body, tr = cloth_bits(M, lambda X, Z: ((np.abs(X) <= 3.6 - (14 - Z) * 0.05) & (Z >= 3) & (Z <= 15)), dye, '#6b4a2c')
    M.put(M.seg((-8, -1, 15.5), (8, -1, 15.5), 0.9) | M.seg((-8, -1, 15.5), (-9, -1.5, 12), 0.6) | M.seg((8, -1, 15.5), (9, -1.5, 12), 0.6), tr)
    M.put(s & (M.Z < 4.5), M.mat(item_ramp(dye)[3]))
    return M

def sarong(dye='#d9a53a', stripe='#a83b34'):
    M = Model()
    s, body, tr = cloth_bits(M, lambda X, Z: (np.abs(X) <= 7) & (Z >= 1.5) & (Z <= 19), dye, stripe, 'checks')
    M.put(s & (M.Z > 17.5), tr)
    M.put(M.ell((-3, -2, 17), (2, 1.6, 1.6)) | M.seg((-3, -2, 17), (-4.5, -2.5, 11), 0.9), tr)
    return M

# ---- headwear --------------------------------------------------------------

def hat_conical(straw='#d3bb45'):
    M = Model((20, 30))
    R = np.hypot(M.X, M.Y)
    s = M.put((R <= 11) & (M.Z <= 14 - R + 2) & (M.Z >= 14 - R), M.mat(straw))
    M.put(s & (np.floor(R / 1.5) % 3 == 0), M.mat(item_ramp(straw)[3]))
    M.put(s & (np.abs(R - 6) < 0.6), M.mat('#a83b34'))
    return M

def cap(dye='#4a6c8c'):
    M = Model((20, 24))
    M.dye = dye
    M.put(M.lathe([4, 5, 9, 12, 14], [7.5, 7.6, 7.2, 5.5, 2.5]), M.mat(dye))
    M.put(M.lathe([4, 6.5], [7.9, 7.9]), M.mat('#d9a53a'))
    M.put(M.lathe([4, 6.5], [7.9, 7.9]) & (np.cos(np.arctan2(M.Y, M.X) * 10) > 0.6), M.mat('#a83b34'))
    return M

def brimmed(felt='#59483d'):
    M = Model((20, 30))
    R = np.hypot(M.X, M.Y)
    M.put(M.lathe([4, 5, 12, 14], [7.5, 6.5, 5.8, 5.2]), M.mat(felt))
    M.put((R <= 11.5) & (M.Z >= 4) & (M.Z < 5.4 + (R > 9) * (R - 9) * 0.4), M.mat(felt))
    M.put(M.lathe([5.4, 7.2], [6.6, 6.4]) & (R > 5.9), M.mat('#a83b34'))
    return M

def turban(dye='#efe9d8'):
    M = Model((20, 24))
    M.dye = dye
    b = M.mat(dye); d = M.mat(item_ramp(dye)[3])
    for i, z in enumerate((6, 8.5, 11, 13.2)):
        R = np.hypot(M.X, M.Y)
        r = 7.5 - i * 0.9
        tor = (R - r) ** 2 + (M.Z - z - np.sin(np.arctan2(M.Y, M.X) + i) * 0.8) ** 2 <= 2.1 ** 2
        M.put(tor, b if i % 2 == 0 else d)
    M.put(M.ell((0, 0, 11), (6, 6, 4.5)), b)
    M.put(M.ell((0, -6.5, 10), (1.6, 1.2, 2)), M.mat('#a83b34', 0.8))
    return M

def hood(dye='#6b5334'):
    M = Model((25, 20))
    M.dye = dye
    s = M.put((M.ell((0, 1, 11), (7.5, 8, 10)) & ~M.ell((0, -2.5, 10), (5, 7, 7.5))) & (M.Z > 3), M.mat(dye))
    M.put(M.lathe([0.5, 6], [11, 6]) & ~(M.Y < -5) | (M.lathe([0.5, 6], [11, 6]) & (M.Z < 3)), M.mat(dye))
    M.put(s & M.ell((0, -2.5, 10), (5.9, 7.5, 8.2)), M.mat(item_ramp(dye)[2]))
    return M

def helmet(metal='#9aa3a8'):
    M = Model((20, 20))
    m = M.mat(metal, 0.9)
    M.put(M.ell((0, 0, 6), (7.5, 7.5, 11)) & (M.Z >= 6), m)
    M.put(M.lathe([5, 7], [8, 8]), M.mat('#b87333', 0.7))
    M.put(M.box(-0.8, 0.8, -8.5, -6, 1, 7), m)
    M.put(M.seg((0, -7.3, 16), (0, 0, 17.8), 0.9), M.mat('#b87333', 0.7))
    return M

# ---- feet, belts, jewellery ------------------------------------------------

def _pair(M, one):
    for sx in (-4.2, 4.2):
        one(sx)

def sandals(leather='#8a5a34'):
    M = Model((25, 42))
    sole, strap = M.mat('#6b4a2c'), M.mat(leather)
    def one(sx):
        e = ((M.X - sx) / 3) ** 2 + (M.Y / 8) ** 2 <= 1
        M.put(e & (M.Z >= 1) & (M.Z < 2.4), sole)
        for y in (-4, 1.5):
            M.put((np.abs(M.Y - y) < 0.8) & (np.hypot(M.X - sx, M.Z - 2.4) - 2.8 < 0.7) & (np.hypot(M.X - sx, M.Z - 2.4) > 2.4) & (M.Z > 2), strap)
    _pair(M, one)
    return M

def shoes(leather='#6b3f24'):
    M = Model((25, 38))
    lt, sole = M.mat(leather, 0.4), M.mat('#3a2a24')
    def one(sx):
        body = M.ell((sx, 0, 1), (3.2, 8, 5)) & (M.Z >= 1)
        M.put(body & ~M.ell((sx, 3.8, 5.6), (2, 3.2, 2.4)), lt)
        M.put(M.ell((sx, 0, 1), (3.4, 8.2, 1.5)) & (M.Z >= 0.5) & (M.Z < 1.8), sole)
    _pair(M, one)
    return M

def boots(leather='#4a382a'):
    M = Model((25, 28))
    lt, sole = M.mat(leather, 0.4), M.mat('#2a2020')
    def one(sx):
        M.put(M.ell((sx, -2, 1), (3, 6.5, 4.5)) & (M.Z >= 1), lt)
        M.put(M.seg((sx, 1.5, 3), (sx, 1.5, 15), 3) & ~M.seg((sx, 1.5, 12), (sx, 1.5, 17), 2.2), lt)
        M.put(M.lathe([13.5, 15], [3.3, 3.3], cx=sx, cy=1.5) & ~M.seg((sx, 1.5, 12), (sx, 1.5, 17), 2.2), M.mat(item_ramp(leather)[7]))
        M.put(M.ell((sx, -2, 1), (3.2, 6.8, 1.4)) & (M.Z >= 0.5) & (M.Z < 1.8), sole)
    _pair(M, one)
    return M

def belt(leather='#6b4a2c'):
    M = Model((20, 45))
    R = np.hypot(M.X, M.Y * 1.3)
    M.put((np.abs(R - 8.5) < 1.2) & (M.Z >= 4) & (M.Z < 7), M.mat(leather, 0.3))
    M.put(M.box(-2, 2, -7.5, -5.5, 3.5, 7.5) & ~M.box(-1, 1, -8, -5, 4.5, 6.5), M.mat('#d9b35a', 0.9))
    return M

def necklace(bead='#2f8a7a'):
    M = Model((20, 55))
    a, b = M.mat(bead, 0.8), M.mat('#d9b35a', 0.9)
    for i in range(22):
        t = i / 22 * 2 * math.pi
        M.put(M.ell((8 * math.cos(t), 7 * math.sin(t), 5), (1.2, 1.2, 1.2)), a if i % 3 else b)
    M.put(M.ell((0, -8.5, 4.5), (2, 1.2, 2.8)), b)
    return M

# ---- food ------------------------------------------------------------------

def water_jar(glaze='#b86a3c', band='#3a2a24'):
    M = Model((20, 26))
    clay = M.mat(glaze, 0.4)
    s = M.put(M.lathe([1, 3, 8, 13, 16, 17, 19, 20], [4, 6.5, 8, 7, 4, 3, 3.8, 3.8], wall=1.6), clay)
    M.put(s & (np.abs(M.Z - 11) < 0.9), M.mat(band))
    M.put(s & (np.abs(M.Z - 8.5) < 0.5), M.mat(band))
    M.put(M.lathe([17.5, 18.5], [2.3, 2.3]), M.mat('#3f7fb0', 0.8))
    M.put((np.abs(np.hypot(M.X - 7.2, M.Z - 13.5) - 2.6) < 0.8) & (np.abs(M.Y) < 1) & (M.X > 6.5), clay)
    return M

def bread(crust='#b8733a'):
    M = Model((20, 30))
    s = M.put(M.ell((0, 0, 3), (9, 6, 6)) & (M.Z >= 2), M.mat(crust, 0.2))
    for x in (-4, 0, 4):
        M.put(s & (np.abs(M.X - x - (M.Y * 0.4)) < 0.7) & (M.Z > 6.2), M.mat('#e8c98a'))
    M.put(s & (M.Z < 3), M.mat(item_ramp(crust)[3]))
    return M

def apple(skin='#c0392b'):
    M = Model()
    r = np.sqrt(M.X ** 2 + M.Y ** 2 + ((M.Z - 10) * 1.1) ** 2)
    s = M.put(r <= 8 - 1.2 * np.exp(-(M.X ** 2 + M.Y ** 2) / 6) * (M.Z > 10), M.mat(skin, 0.6))
    M.put(s & (M.noise(1, 3) < 0.025), M.mat('#d9a53a'))
    M.put(M.seg((0, 0, 15), (0.6, 0, 19.5), 0.6), M.mat('#5a3d26'))
    M.put((np.hypot(M.X - 3, M.Z - 18.5) < 2.2) & (np.abs(M.Y) < 0.6) & (M.X > 0.6), M.mat('#4f8a3a'))
    return M

def fish(scale='#8fa3a8'):
    M = Model((20, 24))
    body = M.ell((1, 0, 8), (9, 2.4, 4.2))
    s = M.put(body, M.mat(scale, 0.8))
    M.put(s & (M.Z > 8.8), M.mat('#4a6c7a', 0.6))
    M.put((np.abs(M.Y) < 0.7) & (M.X < -7) & (M.X > -12) & (np.abs(M.Z - 8) < (-7 - M.X) * 0.9), M.mat('#6a8088'))
    M.put((np.abs(M.Y) < 0.5) & (np.abs(M.X - 1) < 3.5) & (M.Z > 11) & (M.Z < 13.5 - np.abs(M.X - 1) * 0.5), M.mat('#6a8088'))
    M.put(M.ell((7, -2.1, 9), (0.8, 0.5, 0.8)), M.mat('#1a1a22'))
    M.put(s & (np.abs(M.X - 5) < 0.4) & (M.Y < 0), M.mat('#5a6a70'))
    return M

def meat(flesh='#b0403a'):
    M = Model((20, 34))
    s = M.put(M.ell((0, 0, 3), (8.5, 6, 2.6)) & (M.Z >= 2), M.mat(flesh, 0.3))
    M.put(s & (M.ell((0, 0, 3), (8.5, 6, 2.6)) & ~M.ell((-0.8, 0.3, 3), (7.3, 5, 3))), M.mat('#efe0c8'))
    M.put(s & (M.noise(1.5, 5) < 0.12) & (M.Z > 4), M.mat('#e8a8a0'))
    return M

def cooked_meat(meat='#8a4a28'):
    M = Model((20, 26))
    M.put(M.seg((-2, 0, 7), (4, 0, 11), 4.6, 3), M.mat(meat, 0.5))
    M.put(M.seg((4, 0, 11), (9, 0, 14), 1.1), M.mat('#efe6d0'))
    M.put(M.ell((9.5, 0.6, 14.2), (1.2, 1.2, 1.2)) | M.ell((9.2, -0.8, 14.8), (1.2, 1.2, 1.2)), M.mat('#efe6d0'))
    return M

def grain(stalk='#d3bb45'):
    M = Model()
    st, hd, tie = M.mat(stalk), M.mat('#c99a3a'), M.mat('#6b4a2c')
    for i in range(9):
        a = (i - 4) * 0.12
        x = math.sin(a) * 16
        M.put(M.seg((i * 0.4 - 1.6, (i % 3 - 1) * 1.2, 1), (x, (i % 3 - 1) * 1.6, 17), 0.5), st)
        M.put(M.seg((x, (i % 3 - 1) * 1.6, 16), (x * 1.12, (i % 3 - 1) * 1.8, 22), 1.1, 0.5), hd)
    M.put(M.lathe([7, 8.8], [2.7, 2.7]), tie)
    return M

def cabbage(leaf='#6f9a45'):
    M = Model((20, 26))
    for i, (r, z) in enumerate(((8, 8), (7, 9.5), (5.5, 10.5))):
        s = M.put(M.ell((0, 0, z), (r, r, r * 0.95)) & (M.Z > 1), M.mat(item_ramp(leaf)[5 - i]))
        M.put(s & (np.abs(np.arctan2(M.Y, M.X) * 3 % 2 - 1) < 0.08), M.mat('#b8d08a'))
    return M

def onions(skin='#b0703a'):
    M = Model((20, 24))
    for cx, cy in ((-4, 1), (4, 2), (0, -3)):
        s = M.put(M.ell((cx, cy, 6), (4.6, 4.6, 4.8)) | M.seg((cx, cy, 9), (cx, cy, 13), 1.6, 0.4), M.mat(skin, 0.5))
        M.put(s & (np.abs(np.arctan2(M.Y - cy, M.X - cx) * 4 % 2 - 1) < 0.1), M.mat(item_ramp(skin)[3]))
    return M

def potatoes(skin='#b08a5a'):
    M = Model((20, 30))
    for cx, cy, r in ((-4, 1, 1.0), (4, 2, 0.9), (0, -3, 0.8)):
        s = M.put(M.ell((cx, cy, 4), (4.8 * r, 3.6 * r, 3.2 * r)), M.mat(skin))
        M.put(s & (M.noise(1.5, int(cx) + 9) < 0.06), M.mat(item_ramp(skin)[2]))
    return M

def carrots(root='#e07a2c'):
    M = Model((20, 24))
    for i, (x, y) in enumerate(((-3, 0), (0, -1.5), (3, 0.5))):
        s = M.put(M.seg((x, y, 15), (x * 0.3 + 1, y, 1), 2.3, 0.3), M.mat(root))
        M.put(s & (np.floor(M.Z * 1.3) % 4 == 0), M.mat(item_ramp(root)[3]))
        for k in (-1, 0, 1):
            M.put(M.seg((x, y, 15), (x + k * 2, y, 22), 0.7), M.mat('#4f8a3a'))
    return M

def mushroom(cap='#a8583a'):
    M = Model((20, 22))
    M.put(M.seg((0, 0, 1), (0, 0, 10), 2.4, 2), M.mat('#e8dcc4'))
    s = M.put(M.ell((0, 0, 10), (8, 8, 6)) & (M.Z >= 10), M.mat(cap, 0.4))
    M.put(s & (M.noise(2, 4) < 0.1) & (M.Z > 12), M.mat('#efe6d0'))
    M.put(M.lathe([9.5, 10.5], [7.7, 7.7]) & ~M.lathe([9.4, 10.6], [2.6, 2.6]), M.mat('#c9b89a'))
    return M

def pumpkin(skin='#d9782c'):
    M = Model((20, 24))
    a = np.arctan2(M.Y, M.X)
    r = np.hypot(M.X, M.Y) / (9 - 0.9 * np.abs(np.cos(a * 4)))
    s = M.put(r ** 2 + ((M.Z - 7.5) / 6.5) ** 2 <= 1, M.mat(skin, 0.3))
    M.put(s & (np.abs(np.cos(a * 4)) > 0.96), M.mat(item_ramp(skin)[3]))
    M.put(M.seg((0, 0, 13), (1.5, 0, 17), 1, 0.7), M.mat('#5a6a2a'))
    return M

def seeds(sack='#c9bda2'):
    M = Model((20, 24))
    M.put(M.ell((0, 0, 7), (7.5, 7.5, 7)) & (M.Z > 1) & (M.Z < 12), M.mat(sack))
    M.put(M.seg((0, 0, 11), (0, 0, 14), 3.2, 2), M.mat(sack))
    M.put(M.lathe([11.8, 13], [3, 3]), M.mat('#a83b34'))
    M.put(M.lathe([13.5, 14.5], [3.8, 3.8]) & (M.noise(1, 2) < 0.7), M.mat('#b8903a'))
    return M

def herbs(leaf='#5a8a3a'):
    M = Model()
    for i in range(7):
        a = (i - 3) * 0.22
        tip = (math.sin(a) * 12, (i % 2 - 0.5) * 2, 3 + math.cos(a) * 18)
        M.put(M.seg((0, 0, 2), tip, 0.4), M.mat('#6a7a3a'))
        for t in (0.55, 0.75, 0.95):
            p = (tip[0] * t, tip[1] * t, 2 + (tip[2] - 2) * t)
            M.put(M.ell(p, (1.6, 1.6, 1.0)), M.mat(item_ramp(leaf)[4 + (i % 2)]))
    M.put(M.lathe([4, 6], [1.6, 1.6]), M.mat('#a83b34'))
    return M

# ---- tools and weapons -----------------------------------------------------

def knife(metal='#9aa3a8', wood='#7a5230'):
    M = Model()
    t = (M.X + M.Z - 12) / 1.414; s = (M.Z - M.X - 12) / 1.414
    M.put((t > -1) & (t < 13) & (s > -1.2) & (s < 1.6 - np.clip(t - 9, 0, 9) * 0.6) & (np.abs(M.Y) < 0.6), M.mat(metal, 0.9))
    hd = M.put((t > -9) & (t <= -1) & (np.abs(s) < 1.3) & (np.abs(M.Y) < 1.3), M.mat(wood))
    M.put(hd & ((np.abs(t + 3) < .6) | (np.abs(t + 7) < .6)) & (np.abs(s) < .6), M.mat('#d9b35a', 0.9))
    return M

def axe(metal='#8c8a80', wood='#8a6038'):
    M = Model()
    M.put(M.seg((-7, 0, 1), (5, 0, 21), 1), M.mat(wood))
    head = (np.abs(M.Y) < 1) & (((M.X - 4) ** 2) / 36 + ((M.Z - 18) ** 2) / 20 <= 1) & (M.X > 3.5 - (M.Z - 18) * 0.6)
    M.put(head, M.mat(metal, 0.9))
    M.put(head & (M.X - (M.Z - 18) * 0.6 > 8), M.mat('#dfe4e6', 0.9))
    return M

def bow(wood='#8a5a34'):
    M = Model((20, 20))
    w = M.mat(wood, 0.3)
    for i in range(24):
        a0, a1 = -1.1 + i * 2.2 / 24, -1.1 + (i + 1) * 2.2 / 24
        r0 = 1.4 - abs(a0) * 0.6
        M.put(M.seg((-4 + 12 * math.cos(a0) - 12, 0, 12 + 11 * math.sin(a0)), (-4 + 12 * math.cos(a1) - 12, 0, 12 + 11 * math.sin(a1)), r0), w)
    M.put(M.seg((-4 + 12 * math.cos(1.1) - 12 + 0.1, 0, 12 - 11 * math.sin(1.1)), (-4 + 12 * math.cos(1.1) - 12 + 0.1, 0, 12 + 11 * math.sin(1.1)), 0.35), M.mat('#e8dcc4'))
    M.put(M.seg((-4, 0, 10.5), (-4, 0, 13.5), 1.6), M.mat('#6b3f24'))
    return M

def arrow(shaft='#b89a6a'):
    M = Model()
    M.put(M.seg((-9, 0, 3), (8, 0, 20), 0.55), M.mat(shaft))
    t = (M.X + M.Z - 28) / 1.414; s = (M.Z - M.X - 12) / 1.414
    M.put((t > -2) & (t < 1.5) & (np.abs(s) < (1.5 - t) * 0.7) & (np.abs(M.Y) < 0.5), M.mat('#4a4a52', 0.9))
    t2 = (M.X + M.Z + 6) / 1.414
    M.put((t2 > -1.5) & (t2 < 3) & (np.abs(s) < 1.8) & (np.abs(s) > 0.4) & (np.abs(M.Y) < 0.4), M.mat('#a83b34'))
    return M

def torch(wood='#6b4a2c'):
    M = Model((20, 20))
    M.put(M.seg((0, 0, 0.5), (0, 0, 14), 1.1, 1.6), M.mat(wood))
    M.put(M.lathe([11, 14.5], [2.2, 2.2]), M.mat('#3a2a24'))
    M.put(M.ell((0, 0, 17), (3.2, 3.2, 4.2)) | M.seg((0, 0, 17), (0.6, 0, 22.5), 1.8, 0.3), M.mat('#e8782c', glow=True))
    M.put(M.ell((0, -0.5, 16.6), (1.8, 2.4, 2.6)), M.mat('#f8d25a', glow=True))
    return M

def cane(wood='#7a5230'):
    M = Model()
    w = M.mat(wood, 0.3)
    M.put(M.seg((-3, 0, 0.5), (1, 0, 18), 0.9), w)
    R = np.hypot(M.X - 3.5, M.Z - 18)
    M.put((np.abs(R - 2.5) < 0.9) & (np.abs(M.Y) < 0.9) & (M.Z > 17.2), w)
    M.put(M.lathe([0.5, 1.6], [1.1, 1.1], cx=-3), M.mat('#6a6a70', 0.8))
    return M

def stick(wood='#7a5a3a'):
    M = Model()
    w = M.mat(wood)
    M.put(M.seg((-9, 0, 3), (9, 0, 19), 1.1, 0.8) | M.seg((1, 0, 12), (5, -1, 20), 0.6, 0.4), w)
    M.put(M.seg((-9, 0, 3), (9, 0, 19), 1.2, 0.9) & (M.noise(1, 7) < 0.15), M.mat(item_ramp(wood)[3]))
    return M

def coin(metal='#d9b35a'):
    M = Model((20, 62))
    R = np.hypot(M.X, M.Y)
    c = M.mat(metal, 0.9); d = M.mat(item_ramp(metal)[3])
    M.put((R <= 8) & (M.Z >= 4) & (M.Z < 5), c)
    M.put((R <= 8) & (R > 7) & (M.Z >= 5.5) & (M.Z < 6), c)
    M.put((np.hypot(M.X, M.Y + 0.5) < 3.4) & (np.hypot(M.X, M.Y + 0.5) > 2.2) & (M.Z >= 5.5) & (M.Z < 6), d)
    M.put(M.box(-0.6, 0.6, -5, 4, 5.5, 6), d)
    return M

# ---- materials -------------------------------------------------------------

def stone(rock='#8a8578'):
    M = Model((20, 26))
    s = M.put(M.ell((0, 0, 6), (8.5, 7, 6)) & (M.noise(3, 1) * 1.5 + M.ell((0, 0, 6), (7, 6, 5)) > 0.9) & (M.Z > 1), M.mat(rock))
    M.put(s & (M.noise(1, 2) < 0.08), M.mat(item_ramp(rock)[7]))
    return M

def flint(rock='#4a4a58'):
    M = Model((25, 26))
    X, Y, Z = M.X, M.Y, M.Z
    s = (np.abs(X) / 8 + np.abs(Y) / 5 + np.abs(Z - 7) / 6 <= 1) & (X * 0.3 + Z * 0.5 - Y * 0.2 < 9)
    M.put(s, M.mat(rock, 0.8))
    M.put(s & (X + Z * 0.2 > 5.5), M.mat('#c9bda2'))
    return M

def wood(bark='#6b5334'):
    M = Model((30, 24))
    for (cy, z) in ((-2.5, 3), (2.5, 3), (0, 7.3)):
        log = M.seg((-8, cy, z), (8, cy, z), 2.8)
        s = M.put(log, M.mat(bark))
        M.put(s & (M.noise(1, 3) < 0.15), M.mat(item_ramp(bark)[2]))
        end = s & (M.X < -7.2)
        M.put(end, M.mat('#d9b37a'))
        M.put(end & (np.abs(np.hypot(M.Y - cy, M.Z - z) % 1.2 - 0.6) < 0.2), M.mat('#b8905a'))
    return M

def clay(body='#a86a4a'):
    M = Model((20, 30))
    s = M.put(M.ell((0, 0, 3), (8, 7, 6)) & (M.Z > 1.5) & ~M.ell((2, -3, 9), (2.2, 2, 1.6)), M.mat(body, 0.2))
    M.put(s & (M.noise(2, 5) < 0.06), M.mat(item_ramp(body)[3]))
    return M

def hide(fur='#8a6a4a'):
    M = Model((20, 50))
    a = np.arctan2(M.Y, M.X)
    r = np.hypot(M.X, M.Y) / (8.5 + 1.8 * np.cos(a * 5) + np.cos(a * 3) * 0.8)
    s = M.put((r <= 1) & (M.Z >= 4) & (M.Z < 5.5 + np.sin(M.X * 0.5) * 0.6), M.mat(fur))
    M.put(s & (M.noise(1, 9) < 0.2), M.mat(item_ramp(fur)[6]))
    return M

def wool(fleece='#e8dcc4'):
    M = Model((20, 26))
    w = M.mat(fleece)
    rng = np.random.default_rng(4)
    for _ in range(16):
        c = rng.uniform((-6, -5, 3), (6, 5, 11))
        M.put(M.ell(c, (3.4, 3.4, 3.2)) & (M.Z > 1), w)
    return M

def shell(nacre='#e8c8b0'):
    M = Model((20, 40))
    a = np.arctan2(M.X, -M.Y + 6)
    r = np.hypot(M.X, M.Y - 6)
    s = M.put((r <= 11) & (np.abs(a) < 0.9) & (M.Z >= 3) & (M.Z < 3 + (11 - r) * 0.35 + 1.2), M.mat(nacre, 0.5))
    M.put(s & (np.abs(np.cos(a * 11)) > 0.85), M.mat(item_ramp(nacre)[3]))
    return M

def feathers(vane='#e8e0d0'):
    M = Model()
    for i, (dx, col) in enumerate(((-3, vane), (0, '#4a4a52'), (3, '#a83b34'))):
        M.put(M.seg((-7 + dx, 0, 2), (6 + dx, 0, 21), 0.4), M.mat('#efe6d0'))
        t = (M.X - dx + 7) * 0.57 + (M.Z - 2) * 0.82
        s = (M.X - dx + 7) * 0.82 - (M.Z - 2) * 0.57
        M.put((t > 7) & (t < 23) & (np.abs(s) < 2.8 * np.sin(np.clip((t - 7) / 16, 0, 1) * math.pi) + 0.2) & (np.abs(M.Y - i * 0.9) < 0.5), M.mat(col))
    return M

# ---- families, coloured from the drawn icons' pair in item-art.ts ----------

def _colors():
    import re
    src = open(__file__.rsplit('/', 3)[0] + '/src/render/item-art.ts').read()
    return {k: (a, b) for k, a, b in re.findall(r'^  "([a-z-]+)": \["(#[0-9a-f]{6})", "(#[0-9a-f]{6})"\]', src, re.M)}


COLORS = _colors()


def _rng(key):
    return np.random.default_rng(sum(ord(c) * (i + 1) for i, c in enumerate(key)))


def leaf_head(c1, c2, key):
    M = Model((20, 26))
    for i, (r, z) in enumerate(((8, 8), (6.8, 9.5), (5.2, 10.6))):
        s = M.put(M.ell((0, 0, z), (r, r, r * 0.95)) & (M.Z > 1), M.mat(item_ramp(c1)[6 - i]))
        M.put(s & (np.abs(np.arctan2(M.Y, M.X) * 3 % 2 - 1) < 0.08), M.mat(c2))
    return M


def leaf_bunch(c1, c2, key, flowers=False):
    M = Model()
    rng = _rng(key)
    stem, tie = M.mat(item_ramp(c1)[3]), M.mat('#a83b34')
    for i in range(7):
        a = (i - 3) * 0.2 + rng.uniform(-0.05, 0.05)
        tip = (math.sin(a) * 11, rng.uniform(-1.5, 1.5), 4 + math.cos(a) * 17)
        M.put(M.seg((0, 0, 2), tip, 0.45), stem)
        leaf = M.mat(item_ramp(c1)[4 + i % 2])
        for t in (0.5, 0.72, 0.94):
            p = (tip[0] * t, tip[1] * t, 2 + (tip[2] - 2) * t)
            M.put(M.ell(p, (2.0, 1.2, 1.2) if not flowers else (1.3, 1.3, 1.0)), leaf)
        if flowers:
            M.put(M.ell(tip, (1.7, 1.7, 1.4)), M.mat(c2, 0.2))
    M.put(M.lathe([4, 6], [1.7, 1.7]), tie)
    return M


def stalks(c1, c2, key, n=11, heads=False):
    M = Model()
    rng = _rng(key)
    st = [M.mat(item_ramp(c1)[k]) for k in (4, 5, 6)]
    for i in range(n):
        a = (i - n / 2) * 0.05 + rng.uniform(-0.03, 0.03)
        y = rng.uniform(-1.6, 1.6)
        top = (math.sin(a) * 30, y, 22)
        M.put(M.seg((i * 0.35 - n * 0.17, y, 0.5), top, 0.55), st[i % 3])
        if heads:
            M.put(M.seg(top, (top[0] * 1.08, y, 24), 1.0, 0.4), M.mat(c2))
    M.put(M.lathe([8, 10], [2.8, 2.8]), M.mat(c2 if not heads else '#6b4a2c'))
    return M


def taproot(c1, c2, key, fat=1.0, n=3):
    M = Model((20, 24))
    for i in range(n):
        x = (i - (n - 1) / 2) * 3.6
        s = M.put(M.seg((x, (i % 2) * 1.5, 14), (x * 0.3 + 1, 0, 1), 2.4 * fat, 0.4), M.mat(c1, 0.2))
        M.put(s & (np.floor(M.Z * 1.2) % 4 == 0), M.mat(item_ramp(c1)[3]))
        for k in (-1, 0, 1):
            M.put(M.seg((x, 0, 14), (x + k * 2, 0, 21), 0.7), M.mat(c2))
    return M


def round_root(c1, c2, key):
    M = Model((20, 24))
    for cx, cy in ((-4, 1), (4, 2), (0, -3)):
        M.put(M.ell((cx, cy, 5.5), (4.2, 4.2, 4.4)), M.mat(c1, 0.5))
        M.put(M.seg((cx, cy, 1.5), (cx, cy, 0.3), 0.5), M.mat(item_ramp(c1)[7]))
        for k in (-1, 1):
            M.put(M.seg((cx, cy, 9), (cx + k * 1.5, cy, 14), 0.6), M.mat(c2))
    return M


def tubers(c1, c2, key):
    M = Model((20, 30))
    rng = _rng(key)
    for j in range(4):
        cx, cy = rng.uniform(-5, 5), rng.uniform(-4, 4)
        r = rng.uniform(0.7, 1.0)
        s = M.put(M.ell((cx, cy, 3.5), (4.5 * r, 2.8 * r, 2.8 * r)), M.mat(c1, 0.2))
        M.put(s & (M.noise(1.5, j + 3) < 0.07), M.mat(c2))
    return M


def bulbs(c1, c2, key):
    M = Model((20, 24))
    for cx, cy in ((-4, 1), (4, 2), (0, -3)):
        s = M.put(M.ell((cx, cy, 6), (4.4, 4.4, 4.6)) | M.seg((cx, cy, 9), (cx, cy, 13), 1.4, 0.4), M.mat(c1, 0.5))
        M.put(s & (np.abs(np.arctan2(M.Y - cy, M.X - cx) * 4 % 2 - 1) < 0.1), M.mat(c2))
        M.put(M.seg((cx, cy, 1.8), (cx, cy, 0.5), 1.2), M.mat('#c9b89a'))
    return M


def long_fruit(c1, c2, key, n=2, length=8, girth=2.8, curve=0.0):
    M = Model((20, 30))
    for i in range(n):
        y = (i - (n - 1) / 2) * 5
        a, b = (-length, y, 3.5), (length, y + curve, 3.5 + curve)
        M.put(M.seg(a, b, girth, girth * 0.8), M.mat(c1, 0.6))
        M.put(M.seg(b, (b[0] + 2.5, b[1], b[2] + 1), 1.2, 0.6), M.mat(c2))
    return M


def round_fruit(c1, c2, key, n=3, r=4.2, stripes=False, husk=False):
    M = Model((20, 28))
    rng = _rng(key)
    spots = [(0, 0)] if n == 1 else [(-4, 1), (4, 1.5), (0, -3.5)][:n]
    for cx, cy in spots:
        rr = r * (1.8 if n == 1 else 1) * rng.uniform(0.9, 1.05)
        s = M.put(M.ell((cx, cy, rr * 0.95 + 0.5), (rr, rr, rr * 0.92)), M.mat(c1, 0.6))
        if stripes:
            M.put(s & (np.abs(np.cos(np.arctan2(M.Y - cy, M.X - cx) * 6)) > 0.8), M.mat(item_ramp(c1)[3]))
        if husk:
            M.put(s & (M.Z > rr * 1.1), M.mat(c2))
        else:
            M.put(M.seg((cx, cy, rr * 1.85), (cx + 0.6, cy, rr * 1.85 + 2), 0.6), M.mat(c2))
    return M


def cluster(c1, c2, key, n=14, r=1.8):
    M = Model((20, 26))
    rng = _rng(key)
    stem = M.mat(c2)
    M.put(M.seg((0, 0, 16), (0, 0, 20), 0.5), stem)
    for _ in range(n):
        p = (rng.uniform(-5, 5), rng.uniform(-3, 3), rng.uniform(4, 14))
        M.put(M.ell(p, (r, r, r)), M.mat(item_ramp(c1)[rng.integers(4, 7)], 0.7))
        M.put(M.seg(p, (0, 0, 16), 0.25), stem)
    return M


def pods(c1, c2, key, n=3, length=9, girth=1.4):
    M = Model((20, 30))
    for i in range(n):
        y = (i - (n - 1) / 2) * 3.2
        a, b = (-length, y, 2 + i * 0.4), (length, y + 1, 2.5 + i * 0.4)
        s = M.put(M.seg(a, b, girth), M.mat(c1, 0.3))
        for t in np.linspace(0.15, 0.85, 5):
            p = np.array(a) + (np.array(b) - np.array(a)) * t
            M.put(M.ell(p + (0, -0.4, 0.3), (1.2, girth, girth + 0.2)), M.mat(item_ramp(c1)[6]))
        M.put(M.seg(b, (b[0] + 2, b[1], b[2] + 1.5), 0.5), M.mat(c2))
    return M


def heap(c1, c2, key, grain=1.0, bowl=True):
    """Small things in a shallow wooden bowl: beans, pulses, seeds."""
    M = Model((20, 34))
    rng = _rng(key)
    if bowl:
        M.put(M.lathe([0.5, 2, 5], [5.5, 8, 9.5], wall=1.2), M.mat('#8a6038', 0.2))
    for _ in range(int(90 / grain)):
        ang, rad = rng.uniform(0, 2 * math.pi), math.sqrt(rng.uniform(0, 1)) * 8
        z = 4.5 + (1 - rad / 8) * 3.5
        M.put(M.ell((rad * math.cos(ang), rad * math.sin(ang), z), (1.2 * grain, 0.9 * grain, 0.8 * grain)),
              M.mat(c1 if rng.uniform() > 0.2 else c2, 0.4))
    return M


def rock(c1, c2, key, flecks=0.0, gloss=0.0, smooth=False):
    M = Model((20, 26))
    rng = _rng(key)
    cell = 99 if smooth else 3
    s = M.put(M.ell((0, 0, 6), (8.5, 7, 6)) & ((M.noise(cell, int(rng.integers(9))) * 1.4 + M.ell((0, 0, 6), (7, 6, 5))) > 0.9) & (M.Z > 1), M.mat(c1, gloss))
    if flecks:
        M.put(s & (M.noise(1, 5) < flecks), M.mat(c2, 0.9))
    else:
        M.put(s & (M.noise(1, 2) < 0.06), M.mat(c2))
    return M


def mound(c1, c2, key, flat=1.0):
    M = Model((20, 30))
    s = M.put(M.ell((0, 0, 1), (9, 8, 6 * flat)) & (M.Z > 1) & (M.noise(1.5, 3) * 0.4 + M.ell((0, 0, 1), (8.5, 7.5, 5.6 * flat)) > 0.3), M.mat(c1))
    M.put(s & (M.noise(1, 8) < 0.12), M.mat(c2))
    return M


def dung(c1, c2, key, kind='pat'):
    M = Model((20, 32))
    rng = _rng(key)
    if kind == 'pat':
        for i in range(3):
            M.put(M.ell((0, 0, 2 + i * 1.6), (8 - i * 2.2, 7 - i * 2, 1.6)), M.mat(item_ramp(c1)[5 - i]))
    elif kind == 'cake':
        s = M.put(M.lathe([1, 3.5], [8, 8]), M.mat(c1))
        M.put(s & (M.noise(1, 4) < 0.15), M.mat(c2))
        M.put(M.ell((1, -2, 3.5), (3.5, 2, 0.6)), M.mat(item_ramp(c1)[3]))
    else:
        for _ in range(9 if kind == 'pellets' else 5):
            r = 1.6 if kind == 'pellets' else 2.8
            M.put(M.ell((rng.uniform(-6, 6), rng.uniform(-5, 5), r + 1), (r, r * 0.9, r * 0.85)), M.mat(c1 if rng.uniform() > 0.3 else c2))
    return M


def bark(c1, c2, key):
    M = Model((20, 30))
    R = np.hypot(M.Y, M.Z - 7)
    s = M.put((np.abs(R - 6) < 1) & (M.Z > 3.5) & (np.abs(M.X) < 9) & (M.Y < 4), M.mat(c1))
    M.put(s & (R > 6.2) & (np.floor(M.X * 0.8 + M.noise(2, 2) * 2) % 3 == 0), M.mat(c2))
    return M


def resin(c1, c2, key):
    M = Model((20, 24))
    for cx, cy, r in ((-3, 0, 4.5), (3.5, 2, 3.2), (1, -3.5, 2.5)):
        M.put(M.ell((cx, cy, r * 0.9), (r, r, r * 0.95)) | M.seg((cx, cy, r), (cx + 0.5, cy, r * 1.9), r * 0.5, 0.2), M.mat(c1, 1.0))
    return M


def cotton(c1, c2, key):
    M = Model((20, 24))
    for cx, cy in ((-4, 1), (4, 2), (0, -3)):
        for k in range(4):
            a = k * math.pi / 2 + 0.4
            M.put(M.ell((cx + math.cos(a) * 1.8, cy + math.sin(a) * 1.8, 7), (2.4, 2.4, 2.4)), M.mat(c1))
        M.put(M.lathe([2.5, 5], [2.5, 3.2], cx=cx, cy=cy), M.mat(c2))
    return M


def fan(c1, c2, key):
    M = Model((20, 20))
    a = np.arctan2(M.Z - 2, M.X)
    R = np.hypot(M.X, M.Z - 2)
    s = M.put((R < 11) & (R > 3) & (np.abs(a - math.pi / 2) < 1.0) & (np.abs(M.Y + np.cos(a * 16) * 0.6) < 0.5), M.mat(c1))
    M.put(s & (R > 9.5), M.mat(c2))
    M.put(M.seg((0, 0, 0.5), (0, 0, 4), 0.9), M.mat('#6b4a2c'))
    return M


def lizard(c1, c2, key):
    M = Model((20, 45))
    pts = [(-11, 2), (-7, 0), (-3, -0.5), (1, 0), (5, 0.8), (8, 1.2)]
    for (x0, y0), (x1, y1), r0, r1 in zip(pts, pts[1:], (0.4, 0.9, 1.9, 2.2, 1.6), (0.9, 1.9, 2.2, 1.6, 1.3)):
        M.put(M.seg((x0, y0 * 3, 3), (x1, y1 * 3, 3), r0, r1), M.mat(c1, 0.4))
    for x, s_ in ((-2, 1), (-2, -1), (3.5, 1), (3.5, -1)):
        M.put(M.seg((x, 0, 2.5), (x + 1.5, s_ * 4.5, 1.2), 0.6), M.mat(c1))
    M.put(M.ell((-1, 0, 4.4), (4, 1.2, 0.6)) & (M.noise(1, 3) < 0.4), M.mat(c2))
    M.put(M.ell((9, 4, 3.8), (0.5, 0.5, 0.5)) | M.ell((9, 2.6, 3.8), (0.5, 0.5, 0.5)), M.mat('#1a1a22'))
    return M


def sling(c1, c2, key):
    M = Model((20, 30))
    M.put(M.ell((0, 0, 3), (3.5, 2.6, 1.2)), M.mat(c2))
    for sx in (-1, 1):
        for i in range(8):
            t0, t1 = i / 8, (i + 1) / 8
            f = lambda t: (sx * (3 + t * 8), math.sin(t * 5) * 2.5, 3 - t * 1.5)
            M.put(M.seg(f(t0), f(t1), 0.45), M.mat(c1))
    return M


def pinecone(c1, c2, key):
    M = Model((20, 20))
    a = np.arctan2(M.Y, M.X)
    s = M.put(M.ell((0, 0, 10), (5, 5, 9)) & (M.Z > 1.5), M.mat(c1))
    M.put(s & (np.cos(a * 5 + M.Z * 1.6) > 0.5), M.mat(c2))
    return M


def acorn(c1, c2, key):
    M = Model((20, 24))
    for cx, cy in ((-3.5, 0), (3.5, 1.5)):
        M.put(M.ell((cx, cy, 6), (3.6, 3.6, 5.2)) & (M.Z < 8), M.mat(c1, 0.6))
        s = M.put(M.ell((cx, cy, 8), (4.1, 4.1, 2.8)) & (M.Z >= 7.6), M.mat(c2))
        M.put(s & (M.noise(1, 2) < 0.3), M.mat(item_ramp(c2)[3]))
        M.put(M.seg((cx, cy, 10.5), (cx + 0.6, cy, 12.5), 0.5), M.mat(c2))
    return M


def pepper(c1, c2, key):
    M = Model((20, 28))
    for i, y in enumerate((-3, 0, 3)):
        M.put(M.seg((-6 + i, y, 3), (6 + i * 0.5, y, 4.5 + i * 0.8), 1.8, 0.4), M.mat(c1, 0.8))
        M.put(M.seg((-6 + i, y, 3), (-8.5 + i, y, 4.5), 0.6), M.mat(c2))
    return M


def okra(c1, c2, key):
    M = pods(c1, c2, key, n=3, length=6, girth=1.8)
    return M


def sunflower(c1, c2, key):
    M = Model((25, 20))
    M.put(M.seg((0, 1, 0.5), (0, 1, 12), 0.8), M.mat('#5a7a2a'))
    a = np.arctan2(M.Z - 14, M.X)
    R = np.hypot(M.X, M.Z - 14)
    M.put((R < 8.5) & (np.abs(M.Y) < 0.7) & ((R < 4.5) | (np.cos(a * 14) > -0.2)), M.mat(c1, 0.3))
    M.put((R < 4.5) & (M.Y < 0.2) & (M.Y > -1.4), M.mat(c2))
    return M


def gourd(c1, c2, key):
    M = Model((20, 24))
    M.put(M.ell((0, 0, 6), (6, 6, 5.5)) | M.ell((0, 0, 13.5), (3.6, 3.6, 3.8)) | M.seg((0, 0, 9), (0, 0, 12), 3), M.mat(c1, 0.5))
    M.put(M.seg((0, 0, 17), (1, 0, 19.5), 0.6), M.mat(c2))
    return M


def warty(c1, c2, key):
    M = long_fruit(c1, c2, key, n=2, length=7, girth=2.6)
    X, Y, Z = M.X, M.Y, M.Z
    M.put((M.m > 0) & (M.noise(1, 7) < 0.25), M.mat(item_ramp(c1)[7]))
    return M


def poppy(c1, c2, key):
    M = Model((20, 24))
    for i, x in enumerate((-4, 0, 4)):
        M.put(M.seg((x * 0.3, 0, 0.5), (x, 0, 12), 0.5), M.mat(c2))
        M.put(M.ell((x, 0, 14.5), (2.8, 2.8, 3)), M.mat(c1, 0.4))
        M.put(M.lathe([17, 18], [2.2, 2.2], cx=x) & (np.cos(np.arctan2(M.Y, M.X - x) * 8) > 0), M.mat(item_ramp(c1)[3]))
    return M


def roots_knobs(c1, c2, key):
    """Rhizomes and dye roots: knobbly lengths with fibrous ends."""
    M = Model((20, 30))
    rng = _rng(key)
    for j in range(3):
        y = (j - 1) * 3.5
        pts = [(-8 + k * 4, y + rng.uniform(-1, 1), 3 + rng.uniform(-0.5, 0.5)) for k in range(5)]
        for a, b in zip(pts, pts[1:]):
            M.put(M.seg(a, b, rng.uniform(1.5, 2.2)), M.mat(c1, 0.2))
        M.put(M.ell(pts[-1], (1.2, 1.2, 1.2)) & (M.noise(1, j) < 1), M.mat(c2))
    return M


def leeks(c1, c2, key):
    M = Model()
    for i, y in enumerate((-2.5, 0, 2.5)):
        x = (i - 1) * 3
        M.put(M.seg((x, y, 1), (x + 1, y, 12), 1.8), M.mat('#e8e0c8', 0.3))
        M.put(M.seg((x + 1, y, 12), (x + 3, y, 22), 1.6, 0.6), M.mat(c1))
        M.put(M.seg((x, y, 1), (x, y, 0), 1.2), M.mat(c2))
    return M


def frond(c1, c2, key):
    M = Model()
    M.put(M.seg((-8, 0, 1), (8, 0, 22), 0.5), M.mat(c2))
    for t in np.linspace(0.1, 0.95, 12):
        p = np.array([-8, 0, 1]) + np.array([16, 0, 21]) * t
        w = 6 * math.sin(t * math.pi)
        for sgn in (-1, 1):
            M.put(M.seg(p, p + (sgn * w * 0.8 + 1, 0, -sgn * w * 0.6 + 1), 0.6), M.mat(item_ramp(c1)[4 + (sgn > 0)]))
    return M

# ---- more clothes --------------------------------------------------------

def coat(dye='#59483d', trim='#3a2a24', open_=False, long=True):
    M = Model()
    hem = 0.5 if long else 5
    def shape(X, Z):
        body = (np.abs(X) <= 5.2 + np.clip(12 - Z, 0, 12) * 0.2) & (Z >= hem) & (Z <= 19.5)
        sleeve = (np.abs(X) <= 10.5) & (Z >= 11) & (Z <= 19.5) & (Z - 11 >= (np.abs(X) - 5) * 1.0)
        cut = (np.abs(X) < 0.9 + (19.5 - Z) * 0.08) & (Z > (13 if not open_ else hem))
        return (body | sleeve) & ~(cut & (not open_)) & ~((np.abs(X) <= 1.8) & (Z >= 18))
    s, body, tr = cloth_bits(M, shape, dye, trim)
    M.put(s & (np.abs(M.X) < 1.8 + (19.5 - M.Z) * 0.2) & (M.Z > 13) & (M.Y < 0) & (np.abs(M.X) > 0.9), tr)
    if open_:
        M.put(s & (np.abs(M.X) < 1.6) & (M.Y < 0), M.mat(item_ramp(dye)[2]))
    else:
        for z in (6, 9, 12):
            M.put(M.ell((0, -2.3, z), (0.8, 0.7, 0.8)), M.mat('#d9b35a', 0.9))
    M.put(s & (np.abs(M.X) > 9.4), tr)
    return M


def gown(dye='#6a2a4a', trim='#d9b35a'):
    M = Model()
    def shape(X, Z):
        body = (np.abs(X) <= np.where(Z > 12, 3.8, 3.8 + (12 - Z) * 0.62)) & (Z >= 0.3) & (Z <= 19.5)
        sleeve = (np.abs(X) <= 8) & (Z >= 15.5) & (Z <= 19.5) & (Z - 15.5 >= (np.abs(X) - 4) * 0.7)
        return (body | sleeve) & ~((np.abs(X) <= 2) & (Z >= 18.5))
    s, body, tr = cloth_bits(M, shape, dye, trim)
    M.put(s & (np.abs(M.Z - 12) < 0.7), tr)
    M.put(s & (M.Z < 1.5), tr)
    for i in range(-3, 4):
        M.put(s & (M.Z < 11) & (np.abs(M.X - i * (12 - M.Z) * 0.18) < 0.3) & (M.Y < -1), M.mat(item_ramp(dye)[2]))
    return M


def mantle(dye='#4a6c8c', trim='#d3bb45', short=False):
    M = Model()
    bottom = 9 if short else 3
    s, body, tr = cloth_bits(M, lambda X, Z: (np.abs(X) <= 3.5 + (20 - Z) * 0.6) & (np.abs(X) <= 10.5) & (Z >= bottom) & (Z <= 20) & ~((np.abs(X) < 2) & (Z > 18.5)), dye, trim)
    M.put(s & (M.Z < bottom + 1.2), tr)
    M.put(M.ell((0, -2.3, 18), (1.2, 0.8, 1.2)), M.mat('#d9b35a', 0.9))
    return M


def veil(dye='#efe9d8', trim='#d9a53a'):
    M = Model((20, 20))
    s = M.put((M.ell((0, 1, 10), (6.5, 7, 9)) & (M.Z > 10)) | (M.box(-6.5, 6.5, -0.5, 7, 1, 10.5) & ~M.box(-5.5, 5.5, -1, 6, 1, 10.5) & (np.abs(M.X) > 5.5)) | (M.box(-6.5, 6.5, 6, 7.5, 1, 10.5)), M.mat(dye))
    M.dye = dye
    M.put(s & (M.Z < 2.2), M.mat(trim))
    return M


def band(dye='#a83b34', metal=None, thin=False):
    M = Model((20, 40))
    R = np.hypot(M.X, M.Y)
    s = M.put((np.abs(R - 7) < (0.5 if thin else 0.9)) & (M.Z >= 4) & (M.Z < (5.2 if thin else 7)), M.mat(metal or dye, 0.9 if metal else 0))
    if not metal:
        M.dye = dye
        M.put(s & (np.cos(np.arctan2(M.Y, M.X) * 12) > 0.7), M.mat('#efe9d8'))
    else:
        M.put(M.ell((0, -7.2, 5.5), (1.4, 0.8, 1.6)), M.mat('#2f8a7a', 0.9))
    return M


def headscarf(dye='#a83b34'):
    M = hood(dye)
    M.put((M.m > 0) & (M.noise(2, 5) < 0.1), M.mat('#efe9d8'))
    return M


def wrap_head(dye='#d9a53a'):
    M = Model((20, 24))
    M.dye = dye
    for i, z in enumerate((5.5, 7.5, 9.3)):
        R = np.hypot(M.X, M.Y)
        M.put((R - (7.2 - i)) ** 2 + (M.Z - z) ** 2 <= 1.8 ** 2, M.mat(dye) if i % 2 == 0 else M.mat(item_ramp(dye)[3]))
    M.put(M.ell((0, 0, 8), (6, 6, 3.5)), M.mat(dye))
    M.put(M.ell((3, -6, 8.5), (2, 1.5, 2)), M.mat(item_ramp(dye)[3]))
    return M


def hat_shape(dye, crown, brim, band_=None, kind='hat', view=(20, 26)):
    """Crown profile (zs, rs) over a brim of radius `brim`."""
    M = Model(view)
    M.dye = dye
    R = np.hypot(M.X, M.Y)
    M.put(M.lathe(*crown), M.mat(dye, 0.3))
    if brim:
        M.put((R <= brim) & (M.Z >= 3) & (M.Z < 4.2 + np.clip(R - brim + 2, 0, 2) * 0.5), M.mat(dye, 0.3))
    if band_:
        M.put(M.lathe([crown[0][0] + 0.5, crown[0][0] + 2.2], [crown[1][0] + 0.3] * 2) & (R > crown[1][0] - 0.8), M.mat(band_))
    return M


def ball_cap(dye='#a83b34'):
    M = hat_shape(dye, ([4, 7, 10, 11.5], [6.5, 6.5, 5, 2]), None)
    M.put(M.ell((0, -7, 4.2), (5.5, 5, 0.8)) & (M.Y < -4), M.mat(dye, 0.3))
    M.put(M.ell((0, 0, 11.6), (1, 1, 0.8)), M.mat(item_ramp(dye)[3]))
    return M


def flat_cap(dye='#59483d'):
    M = Model((20, 26))
    M.dye = dye
    s = M.put(M.ell((0, 1, 4), (7.5, 8.5, 4.5)) & (M.Z >= 4), M.mat(dye))
    M.put(M.ell((0, -6.5, 4.2), (5.5, 3.5, 0.9)) & (M.Y < -5), M.mat(dye))
    M.put(s & (M.noise(1, 2) < 0.12), M.mat(item_ramp(dye)[3]))
    return M


def fez(dye='#a83b34'):
    M = hat_shape(dye, ([4, 12], [5.8, 4.6]), None)
    M.put(M.seg((0, 0, 12), (4.5, -2, 9), 0.35) | M.ell((4.6, -2, 8.3), (0.9, 0.9, 1.3)), M.mat('#1a1a22'))
    return M


def plume(dye='#efe9d8'):
    M = feathers()
    return M


def wig(dye='#efe9d8'):
    M = Model((20, 20))
    M.dye = dye
    rng = np.random.default_rng(3)
    for _ in range(26):
        a, z = rng.uniform(0, 2 * math.pi), rng.uniform(4, 15)
        r = 7 - max(0, z - 11) * 0.9
        if abs(math.sin(a) + 1) < 0.25 and z < 12:
            continue
        M.put(M.ell((r * math.cos(a), r * math.sin(a), z), (2.3, 2.3, 2.3)), M.mat(dye))
    M.put(M.seg((0, 5, 6), (0, 6, 1), 1.2), M.mat('#1a1a22'))
    return M


def visor_helm(shell='#e8e4dc'):
    M = Model((25, 18))
    M.put(M.ell((0, 0, 11), (8.5, 8.5, 9)) & (M.Z > 3), M.mat(shell, 0.5))
    M.put(M.ell((0, 0, 11), (8.9, 8.9, 9.4)) & (M.Y < -3) & (M.Z > 7) & (M.Z < 16) & (np.abs(M.X) < 6.5), M.mat('#2a3a5a', 1.0))
    M.put(M.lathe([2, 4], [7.5, 7.5]), M.mat('#9aa3a8', 0.9))
    return M


def wide_trousers(dye='#b89343'):
    M = Model()
    leg = lambda X, Z, sx: np.abs(X - sx * 3.6) <= 3.8 + (18 - Z) * 0.05
    s, body, tr = cloth_bits(M, lambda X, Z: (((leg(X, Z, -1) | leg(X, Z, 1)) & (Z >= 1) & (Z <= 18)) | ((np.abs(X) <= 6.2) & (Z >= 11) & (Z <= 19.5))), dye, '#6b4a2c')
    M.put(s & (M.Z > 18.3), tr)
    for x in (-5, -2.5, 2.5, 5):
        M.put(s & (np.abs(M.X - x) < 0.3) & (M.Z < 15) & (M.Y < -1), M.mat(item_ramp(dye)[2]))
    return M


def hose(dye='#4a6c8c'):
    M = Model()
    leg = lambda X, Z, sx: np.abs(X - sx * (2.1 + (18 - Z) * 0.02)) <= 1.8
    s, body, tr = cloth_bits(M, lambda X, Z: ((leg(X, Z, -1) | leg(X, Z, 1)) & (Z >= 1) & (Z <= 19)), dye, '#3a2a24')
    M.put(s & (M.Z < 2.2), tr)
    return M


def leg_wraps(dye='#c9bda2'):
    M = Model((20, 20))
    M.dye = dye
    for sx in (-4, 4):
        s = M.put(M.seg((sx, 0, 1), (sx, 0, 17), 2.4, 2.0), M.mat(dye))
        M.put(s & (np.abs((M.Z + (M.X - sx) * 0.6) % 2.2 - 1.1) < 0.28), M.mat(item_ramp(dye)[3]))
    return M


def sneakers(dye='#efe9d8'):
    M = shoes(dye)
    M.put((M.m > 0) & (M.Z < 2.4), M.mat('#efe9d8'))
    M.put((M.m > 0) & (np.abs(M.Y + 1) < 0.8) & (M.Z > 2.4), M.mat('#4a6c8c'))
    return M


def cord(color='#c9a86a'):
    M = Model((20, 45))
    R = np.hypot(M.X, M.Y * 1.3)
    M.put((np.abs(R - 8.5) < 0.6) & (M.Z >= 4) & (M.Z < 5.2), M.mat(color))
    for x in (-1, 1):
        M.put(M.seg((x, -6.8, 4.5), (x * 2.5, -9, 1.5), 0.55) | M.ell((x * 2.6, -9.3, 1.2), (0.9, 0.9, 1.2)), M.mat(color))
    return M


def sash(dye='#a83b34'):
    M = Model((20, 40))
    M.dye = dye
    R = np.hypot(M.X, M.Y * 1.3)
    s = M.put((np.abs(R - 8.3) < 1.1) & (M.Z >= 3.5) & (M.Z < 8), M.mat(dye))
    M.put(M.seg((2, -6.5, 6), (4, -9, 1), 1.4, 1.8) & (np.abs(M.Y + 7.5) < 1.2), M.mat(dye))
    M.put(s & (np.abs(M.Z - 5.8) < 0.4), M.mat('#d9b35a'))
    return M


def belt_wide(leather='#4a382a'):
    M = belt(leather)
    R = np.hypot(M.X, M.Y * 1.3)
    M.put((np.abs(R - 8.5) < 1.2) & (M.Z >= 3) & (M.Z < 8.5) & ~M.box(-2.2, 2.2, -9, -5, 3, 9), M.mat(leather, 0.3))
    return M


def earrings(metal='#d9b35a'):
    M = Model((15, 20))
    for sx in (-4, 4):
        R = np.hypot(M.X - sx, M.Z - 10)
        M.put((np.abs(R - 3) < 0.6) & (np.abs(M.Y) < 0.6), M.mat(metal, 0.9))
        M.put(M.ell((sx, 0, 6.5), (1.2, 1.2, 1.5)), M.mat('#a83b34', 0.9))
    return M


def chain(metal='#d9b35a'):
    M = Model((20, 55))
    for i in range(30):
        t = i / 30 * 2 * math.pi
        c = (8 * math.cos(t), 7 * math.sin(t), 5)
        M.put(M.ell(c, (1.0, 1.0, 0.7)) & ~M.ell(c, (0.5, 0.5, 1)), M.mat(metal, 0.9))
    M.put(M.lathe([3.5, 5], [2, 2], cy=-8.5) & (M.Y < -7), M.mat(metal, 0.9))
    return M


def glasses(lens='#9fc6d6', frame='#3a2a24', dark=False):
    M = Model((15, 15))
    fr = M.mat(frame, 0.5)
    for sx in (-4.2, 4.2):
        R = np.hypot(M.X - sx, M.Z - 10)
        M.put((np.abs(R - 3) < 0.55) & (np.abs(M.Y) < 0.5), fr)
        M.put((R < 2.6) & (np.abs(M.Y) < 0.2), M.mat('#1e2430' if dark else lens, 0.9))
        M.put(M.seg((sx * 1.7, 0, 10.5), (sx * 1.7, 9, 10), 0.4), fr)
    M.put(M.seg((-1.4, 0, 11), (1.4, 0, 11), 0.45), fr)
    return M


def shoulder_cloth(dye='#d9a53a'):
    M = Model()
    s, body, tr = cloth_bits(M, lambda X, Z: (np.abs(X) <= 9) & (Z >= 8) & (Z <= 16 - np.abs(X) * 0.3), dye, '#a83b34', 'stripes')
    for x in np.arange(-8, 9, 1.4):
        M.put(M.seg((x, 0, 8.3), (x, 0, 6), 0.35), M.mat(dye))
    return M


def suit(dye='#e8e4dc'):
    """A pressure suit: one puffed piece, a collar ring for the helmet, a chest
    pack, metal cuffs and boots."""
    M = Model()
    M.dye = dye
    body = M.mat(dye, 0.3); metal = M.mat('#9aa3a8', 0.9)
    for sx in (-1, 1):
        M.put(M.seg((sx * 2.6, 0, 2), (sx * 2.8, 0, 10), 2.4), body)
        M.put(M.seg((sx * 5.5, 0, 17), (sx * 9.5, 0, 10), 2.0), body)
        M.put(M.ell((sx * 9.8, 0, 9.3), (1.9, 1.9, 1.2)), metal)
        M.put(M.ell((sx * 2.7, -0.5, 1.5), (2.6, 3.2, 1.8)), metal)
    M.put(M.ell((0, 0, 13), (6, 3.6, 7)), body)
    M.put(M.lathe([19, 20.5], [3.6, 3.6]) & ~M.lathe([19, 20.5], [2.4, 2.4]), metal)
    M.put(M.box(-3, 3, -4.5, -2, 11, 16), M.mat('#6a7078', 0.6))
    M.put(M.box(-2.2, -0.8, -4.8, -4, 14, 15), M.mat('#c0392b', 0.8))
    M.put(M.box(0.6, 2.2, -4.8, -4, 14, 15), M.mat('#3f7fb0', 0.8))
    M.put((M.m == body) & (np.abs(M.Z - 10) < 0.5), M.mat('#c9bda2'))
    return M


def fam(shape, **kw):
    def make(key):
        c1, c2 = COLORS.get(key, ('#8a8578', '#5a5448'))
        return lambda: shape(c1, c2, key, **kw)
    return make


_F = {
    'head': fam(leaf_head), 'bunch': fam(leaf_bunch), 'flower': fam(leaf_bunch, flowers=True),
    'stalks': fam(stalks), 'eared': fam(stalks, heads=True), 'taproot': fam(taproot),
    'fatroot': fam(taproot, fat=1.5, n=2), 'round-root': fam(round_root), 'tubers': fam(tubers),
    'bulbs': fam(bulbs), 'long': fam(long_fruit), 'cucumber': fam(long_fruit, n=2, length=7, girth=2.2),
    'yardlong': fam(pods, n=4, length=10, girth=0.8), 'round': fam(round_fruit), 'big': fam(round_fruit, n=1, stripes=True),
    'husked': fam(round_fruit, husk=True), 'cluster': fam(cluster), 'small-cluster': fam(cluster, n=20, r=1.2),
    'pods': fam(pods), 'heap': fam(heap), 'fine-heap': fam(heap, grain=0.6), 'rock': fam(rock),
    'river': fam(rock, smooth=True), 'glassy': fam(rock, gloss=1.0), 'ore': fam(rock, flecks=0.08),
    'ore-poor': fam(rock, flecks=0.03), 'ore-rich': fam(rock, flecks=0.18), 'mound': fam(mound),
    'flat-mound': fam(mound, flat=0.55), 'pat': fam(dung, kind='pat'), 'cake': fam(dung, kind='cake'),
    'pellets': fam(dung, kind='pellets'), 'lumps': fam(dung, kind='lumps'), 'bark': fam(bark),
    'resin': fam(resin), 'cotton': fam(cotton), 'fan': fam(fan), 'lizard': fam(lizard), 'sling': fam(sling),
    'pinecone': fam(pinecone), 'acorn': fam(acorn), 'pepper': fam(pepper), 'okra': fam(okra),
    'sunflower': fam(sunflower), 'gourd': fam(gourd), 'warty': fam(warty), 'poppy': fam(poppy),
    'knobs': fam(roots_knobs), 'leeks': fam(leeks), 'frond': fam(frond),
}
ASSIGN = {
    'head': 'chinese-cabbage colewort red-cabbage slippery-cabbage lettuce veg-head pak-choi',
    'bunch': 'african-nightshade amaranth-greens coriander dill epazote greens jute-mallow kale mallow mustard-greens spinach spider-plant taro-leaves water-spinach goosefoot coca khat tea tobacco pituri cannabis woad indigo weld fodder henna',
    'flower': 'chamomile goldenrod safflower saffron roselle',
    'stalks': 'bast cane ephedra flax grass-fibre hemp lemongrass papyrus reeds rushes straw garlic-chives scallions',
    'eared': 'amaranth',
    'taproot': 'veg-root parsnips', 'fatroot': 'daikon', 'round-root': 'turnips radishes',
    'tubers': 'kumara oca ulluco mashua sunchokes', 'bulbs': 'bulbs garlic veg-bulb wild-onions',
    'long': 'aubergines eggplants brinjal', 'cucumber': 'cucumbers', 'yardlong': 'yardlong-beans',
    'round': 'tomatoes garden-eggs veg-fruit chayote', 'big': 'squash egusi-melons', 'husked': 'tomatillos',
    'cluster': 'berries', 'small-cluster': 'capers annatto', 'pods': 'broad-beans cowpeas peas veg-pod',
    'heap': 'chickpeas common-beans kidney-beans tarwi coffee', 'fine-heap': 'lentils',
    'rock': 'granite limestone', 'river': 'river-rock pebble', 'glassy': 'obsidian',
    'ore': 'ore copper-ore gold-ore iron-ore silver-ore tin-ore',
    'ore-poor': 'ore-poor copper-ore-poor gold-ore-poor iron-ore-poor silver-ore-poor tin-ore-poor',
    'ore-rich': 'ore-rich copper-ore-rich gold-ore-rich iron-ore-rich silver-ore-rich tin-ore-rich',
    'mound': 'dirt sand', 'flat-mound': 'mud', 'pat': 'cow-dung', 'cake': 'dung-cake', 'pellets': 'dung-pellets',
    'lumps': 'horse-dung dry-horse-dung', 'bark': 'bark', 'resin': 'resin', 'cotton': 'cotton', 'fan': 'fan',
    'lizard': 'lizard', 'sling': 'sling', 'pinecone': 'pinecone', 'acorn': 'acorn',
    'pepper': 'aji chilies chilli-peppers chillies', 'okra': 'okra', 'sunflower': 'sunflowers',
    'gourd': 'bottle-gourds', 'warty': 'bitter-gourds', 'poppy': 'poppy-pods',
    'knobs': 'galangal turmeric madder gromwell roots', 'leeks': 'leeks', 'frond': 'frond',
}


ITEMS = {
    # id: (label, model) — ids follow the game's where the game has one.
    'tunic': ('Tunic', tunic),
    'long-tunic': ('Long tunic', lambda: tunic('#ded0b0', '#4a6c8c', long=True)),
    'shirt': ('Shirt', shirt),
    'robe': ('Robe', robe),
    'dress': ('Dress', dress),
    'skirt': ('Skirt', skirt),
    'trousers': ('Trousers', trousers),
    'cloak': ('Cloak', cloak),
    'poncho': ('Poncho', poncho),
    'loincloth': ('Loincloth', loincloth),
    'sarong': ('Sarong', sarong),
    'conical': ('Straw hat', hat_conical),
    'cap': ('Cap', cap),
    'brimmed': ('Brimmed hat', brimmed),
    'turban': ('Turban', turban),
    'hood': ('Hood', hood),
    'helmet': ('Helmet', helmet),
    'sandals': ('Sandals', sandals),
    'shoes': ('Shoes', shoes),
    'boots': ('Boots', boots),
    'leather': ('Belt', belt),
    'necklace': ('Necklace', necklace),
    'water': ('Water jar', water_jar),
    'bread': ('Bread', bread),
    'fruit': ('Apple', apple),
    'fish': ('Fish', fish),
    'meat': ('Meat', meat),
    'cooked-meat': ('Cooked meat', cooked_meat),
    'grain': ('Grain', grain),
    'cabbage': ('Cabbage', cabbage),
    'onions': ('Onions', onions),
    'potatoes': ('Potatoes', potatoes),
    'carrots': ('Carrots', carrots),
    'mushroom': ('Mushroom', mushroom),
    'pumpkins': ('Pumpkin', pumpkin),
    'seeds': ('Seed bag', seeds),
    'herbs': ('Herbs', herbs),
    'tool': ('Knife', knife),
    'axe': ('Axe', axe),
    'bow': ('Bow', bow),
    'arrow': ('Arrow', arrow),
    'torch': ('Torch', torch),
    'walking-cane': ('Walking cane', cane),
    'stick': ('Stick', stick),
    'coin': ('Coin', coin),
    'stone': ('Stone', stone),
    'flint': ('Flint', flint),
    'wood': ('Wood', wood),
    'clay': ('Clay', clay),
    'hide': ('Hide', hide),
    'wool': ('Wool', wool),
    'shell': ('Shell', shell),
    'feathers': ('Feathers', feathers),
}
ITEMS.update({
    'coat': ('Coat', coat),
    'open-robe': ('Open robe', lambda: coat('#6a8a3a', '#d9b35a', open_=True)),
    'gown': ('Gown', gown),
    'wrap': ('Wrap', lambda: sarong('#4a6c8c', '#efe9d8')),
    'suit': ('Pressure suit', suit),
    'mantle': ('Mantle', mantle),
    'shoulder-cloth': ('Shoulder cloth', shoulder_cloth),
    'band': ('Headband', band),
    'wrap_head': ('Head wrap', wrap_head),
    'headscarf': ('Headscarf', headscarf),
    'veil': ('Veil', veil),
    'bowler': ('Bowler', lambda: hat_shape('#2a2a30', ([4, 7, 10, 11.5], [6, 6.2, 5.5, 2.5]), 8, '#59483d')),
    'top-hat': ('Top hat', lambda: hat_shape('#2a2a30', ([4, 15, 16], [5.5, 6, 6]), 8.5, '#6a2a2a')),
    'flat-cap': ('Flat cap', flat_cap),
    'ball-cap': ('Ball cap', ball_cap),
    'fez': ('Fez', fez),
    'fillet': ('Fillet', lambda: band(metal='#d9b35a', thin=True)),
    'plume': ('Plume', plume),
    'wig': ('Wig', wig),
    'visor': ('Helmet visor', visor_helm),
    'wide': ('Wide trousers', wide_trousers),
    'hose': ('Hose', hose),
    'wrapped': ('Leg wraps', leg_wraps),
    'sneakers': ('Sneakers', sneakers),
    'cord': ('Cord belt', cord),
    'sash': ('Sash', sash),
    'belt-wide': ('Wide belt', belt_wide),
    'earrings': ('Earrings', earrings),
    'chain': ('Chain', chain),
    'glasses': ('Glasses', glasses),
    'sunglasses': ('Sunglasses', lambda: glasses(dark=True, frame='#1a1a22')),
})
for _kind, _keys in ASSIGN.items():
    for _k in _keys.split():
        ITEMS.setdefault(_k, (_k.replace('-', ' ').capitalize(), _F[_kind](_k)))


def icon(M, size=48, fill=0.9, yaw=None, pitch=None, index=False):
    """The model rendered and fitted to the icon, centred on what is drawn."""
    yaw = M.view[0] if yaw is None else yaw
    pitch = M.view[1] if pitch is None else pitch
    big = 96
    probe = render(M, yaw, pitch, ppv=big / M.m.shape[0], size=big)
    ys, xs = np.nonzero(probe[..., 3])
    if not len(xs):
        return np.zeros((size, size, 4), np.uint8)
    k = big / M.m.shape[0]
    a, p = math.radians(yaw), math.radians(pitch)
    d = np.array([-math.sin(a) * math.cos(p), math.cos(a) * math.cos(p), -math.sin(p)])
    u = np.array([math.cos(a), math.sin(a), 0.0])
    v = np.cross(u, d); v /= np.linalg.norm(v)
    cu = ((xs.min() + xs.max() + 1) / 2 - big / 2) / k
    cv = (big / 2 - (ys.min() + ys.max() + 1) / 2) / k
    n = M.m.shape[0]
    c = np.array([n / 2] * 3) + cu * u + cv * v
    extent = max(xs.max() - xs.min() + 1, ys.max() - ys.min() + 1) / k
    return render(M, yaw, pitch, ppv=(size - 2) * fill / extent, size=size, center=c, index=index)


def sheet(out, old=None, cols=16):
    from PIL import Image, ImageDraw, ImageFont
    font = lambda s: ImageFont.truetype('/System/Library/Fonts/Supplemental/Georgia.ttf', s)
    BG, CELL, INK, DIM = (13, 20, 38), (22, 32, 56), (230, 220, 196), (140, 146, 170)
    cw, chh = 170, 168
    rows = -(-len(ITEMS) // cols)
    im = Image.new('RGB', (cols * cw + 40, rows * chh + 90), BG)
    dr = ImageDraw.Draw(im)
    dr.text((20, 18), f'Voxel item icons — {len(ITEMS)} items', font=font(24), fill=INK)
    dr.text((20, 52), 'Each: 48px voxel icon at 2x; the current icon, where one exists, small at top left.', font=font(14), fill=DIM)
    for i, (key, (label, make)) in enumerate(ITEMS.items()):
        x, y = 20 + (i % cols) * cw, 84 + (i // cols) * chh
        dr.rounded_rectangle([x, y, x + cw - 12, y + chh - 14], 6, fill=CELL)
        a = Image.fromarray(icon(make())).resize((96, 96), Image.NEAREST)
        im.paste(a, (x + (cw - 12 - 96) // 2, y + 18), a)
        if old and key in old:
            o = Image.new('RGBA', (24, 24))
            for px, py, c in old[key]:
                rgb = tuple(int(c[j:j + 2], 16) for j in (1, 3, 5)) if c[0] == '#' else tuple(int(float(t)) for t in c[4:-1].split(','))
                o.putpixel((px, py), rgb + (255,))
            o = o.resize((48, 48), Image.NEAREST)
            im.paste(o, (x + 4, y + 4), o)
        w = dr.textlength(label, font=font(14))
        dr.text((x + (cw - 12 - w) / 2, y + 126), label, font=font(14), fill=INK)
    im.save(out)


YAWS, PITCHES, TURN = 24, (8, 28, 52), 128


def _turn(key):
    M = ITEMS[key][1]()
    xs, ys, zs = np.nonzero(M.m)
    lo, hi = np.array([xs.min(), ys.min(), zs.min()]), np.array([xs.max(), ys.max(), zs.max()]) + 1
    # One centre and scale for every angle, so the item turns in place.
    c, diag = (lo + hi) / 2, np.linalg.norm(hi - lo)
    ppv = TURN * 0.94 / diag
    frames = np.zeros((TURN * len(PITCHES), TURN * YAWS, 4), np.uint8)
    for r, p in enumerate(PITCHES):
        for j in range(YAWS):
            frames[r * TURN:(r + 1) * TURN, j * TURN:(j + 1) * TURN] = render(
                M, M.view[0] + j * 360 / YAWS, p, ppv=ppv, size=TURN, center=c, index=True)
    return key, icon(M, index=True), frames, M.dye, M.bases, M.ramps


def bake(out):
    """Index sprites for the game: public/items/icons.png (48px), one
    turntable per item under turn/, and items.json with each material's ramp,
    or which ramp a cloth's dye replaces."""
    import json, os
    from multiprocessing import Pool
    from PIL import Image
    os.makedirs(f'{out}/turn', exist_ok=True)
    keys = list(ITEMS)
    per = 12
    sheet = np.zeros((48 * -(-len(keys) // per), 48 * per, 4), np.uint8)
    manifest = {'icon': 48, 'perRow': per, 'turn': {'size': TURN, 'yaws': YAWS, 'pitches': list(PITCHES)}, 'items': {}}
    with Pool() as pool:
        for i, (key, ic, frames, dye, bases, ramps) in enumerate(pool.imap(_turn, keys)):
            sheet[(i // per) * 48:(i // per + 1) * 48, (i % per) * 48:(i % per + 1) * 48] = ic
            Image.fromarray(frames).save(f'{out}/turn/{key}.png', optimize=True)
            dark = item_ramp(dye)[3] if dye else None
            mats = [None] + [('dye' if dye and b == dye else 'dye-dark' if dye and b == dark else r)
                             for b, r in zip(bases[1:], ramps[1:])]
            manifest['items'][key] = {'i': i, 'label': ITEMS[key][0], 'mats': mats, **({'dye': dye} if dye else {})}
            print(key, flush=True)
    Image.fromarray(sheet).save(f'{out}/icons.png', optimize=True)
    json.dump(manifest, open(f'{out}/items.json', 'w'), separators=(',', ':'))


if __name__ == '__main__':
    import json
    args = sys.argv[1:]
    old = None
    if '--bake' in args:
        bake('public/items'); sys.exit()
    if '--old' in args:
        i = args.index('--old'); old = json.load(open(args[i + 1]))['out']; del args[i:i + 2]
    sheet(args[0] if args else 'artifacts/voxel-items.png', old)
