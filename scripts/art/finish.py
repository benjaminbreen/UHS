"""The hand over the voxel cast: each surface repainted as the oblique
painters draw it, with the voxels deciding only where a pixel is and which
plane it lies on.

A painter maps its materials to a finish -- ('tiles', ramp), ('ashlar',
ramp) and so on -- and `finish_image` repaints those pixels in place. Tone
is per plane, not per pixel: the lit front, the shaded side and a cast
shadow each take one step, and the pattern supplies the rest, so broad
faces stay quiet and texture sits in clusters (BUILDING_ART.md).
"""
import numpy as np

FRONT, SIDE, TOP = 1, 2, 0


def _rgb(ramp):
    return np.array([[int(c[i:i + 2], 16) for i in (1, 3, 5)] for c in ramp], np.uint8)


def _hash(a, b, seed=0):
    h = (a * 374761393 + b * 668265263 + seed * 2246822519) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    return h ^ (h >> 16)


def _plane_offset(level, face, mask):
    """0 on a face's lit plane, -1 in its shade, -2 deep in a cast shadow."""
    off = np.zeros(level.shape, int)
    for f in (TOP, FRONT, SIDE):
        k = mask & (face == f)
        if not k.any():
            continue
        lit = np.percentile(level[k], 85)
        off[k] = np.clip(level[k] - lit, -2, 0)
    return off


def _five(ramp, step):
    """A step on a five-step scale, on a ramp of any length."""
    n = len(ramp)
    return ramp[np.clip(np.round(np.clip(step, 0, 4) / 4 * (n - 1)).astype(int), 0, n - 1)]


def tiles(img, k, buf, ramp, seed, style='flat'):
    """Roof tiles in courses parallel to the eave, lit at the ridge and
    darkening down to the eave, each tile lit on its top edge and shaded on
    its right, the eave closed by a dark line. 'barrel' runs channels of
    round tiles down the slope instead, as East Asian roofs are laid."""
    H, W = k.shape
    ys, xs = np.nonzero(k)
    if not len(xs):
        return
    top = np.full(W, H)
    bot = np.full(W, -1)
    np.minimum.at(top, xs, ys)
    np.maximum.at(bot, xs, ys)
    span = np.maximum(bot[xs] - top[xs], 1)
    down = ys - top[xs]
    level = buf['level'][ys, xs]
    # A plane in shade sits one step down; the voxel light says which.
    lit = np.percentile(level, 80)
    off = np.clip(level - lit, -1, 0)
    if style == 'barrel':
        k4 = (xs + seed) % 4
        step = np.choose(k4, [2, 0, 3, 2]) - (down > span * 0.6) - ((down % 5) == 4)
    else:
        row = down // 4
        rows = np.maximum(span // 4, 1)
        col = (xs + (row % 2) * 2 + seed) // 5
        step = 4 - np.round(row / rows * 2).astype(int) - (((col + row) % 3) == 0)
        within_y = down % 4
        within_x = (xs + (row % 2) * 2 + seed) % 5
        step = np.where(within_y == 0, step + 1, step)
        step = np.where(within_x == 4, step - 1, step)
        step = np.where((within_x == 4) & (within_y == 3), 0, step)
        # A replaced tile here and there: one quiet cluster, not noise.
        patch = (_hash(col // 3, row // 2, seed) % 23) == 0
        step = np.where(patch, step - 1, step)
    step = step + off
    step = np.where(down == 0, 4 + off, step)
    step = np.where(bot[xs] - ys == 0, 0, np.where(bot[xs] - ys == 1, 1, step))
    img[ys, xs, :3] = _five(_rgb(ramp), step)


def lead(img, k, buf, ramp, seed):
    """Lead sheet: three flat tones by the light, sheet seams down the slope,
    one bright cluster where the sun lands."""
    ys, xs = np.nonzero(k)
    if not len(xs):
        return
    level = buf['level'][ys, xs].astype(float)
    lo, hi = np.percentile(level, 10), np.percentile(level, 97)
    t = (level - lo) / max(1e-6, hi - lo)
    step = np.where(t > 0.82, 4, np.where(t > 0.5, 3, np.where(t > 0.22, 2, 1)))
    wx = buf['coords'][ys, xs, 0]
    seam = (wx % 6) == 0
    step = np.where(seam & (step > 1), step - 1, step)
    img[ys, xs, :3] = _five(_rgb(ramp), step)


def masonry(img, k, buf, ramp, seed, bond='clean', second=None):
    """Walls by the voxel's own coordinates, so courses run true round
    corners. Bonds, cleanest first: 'clean' dressed stone, broad blocks and
    faint joints; 'rendered' plaster, value bands only; 'coursed' stone, every
    joint and a few chips; 'brick'; 'cloisonne', stone blocks framed in brick
    courses (`second` is the brick ramp); 'flags' for paving. A lighter band
    under the cornice and a cooler one at the foot replace a gradient."""
    ys, xs = np.nonzero(k)
    if not len(xs):
        return
    face = buf['face'][ys, xs]
    wx, wy, wz = (buf['coords'][ys, xs, i] for i in range(3))
    off = _plane_offset(buf['level'], buf['face'], k)[ys, xs]
    u = np.where(face == SIDE, wy, wx)
    v = wz
    top = wz.max()
    base = np.where(face == TOP, 3.0, np.where(face == FRONT, 3.0, 2.0))
    band = np.where(v >= top - 4, 0.5, np.where(v < 4, -0.5, 0.0))
    alt = None
    if bond == 'flags':
        a, b = wx // 9, (wy + (wx // 9) % 2 * 4) // 7
        joint = (wx % 9 == 0) | ((wy + (wx // 9) % 2 * 4) % 7 == 0)
        step = np.where(joint, base - 1, base + (_hash(a, b, seed) % 5 == 0) * 0.5)
        band = 0
    elif bond == 'rendered':
        step = base + np.where((face == FRONT) & (_hash(u // 3, v // 2, seed) % 97 == 0), -0.5, 0)
    elif bond == 'brick':
        course = v // 3
        joint = (v % 3 == 0) | ((u + (course % 2) * 3) % 6 == 0)
        step = np.where(joint, base - 1, np.where(_hash(u // 6, course, seed) % 17 == 0, base - 1, base))
    elif bond == 'ablaq':
        # Courses of pale and dark stone in turn, the dark from `second`.
        step = np.where(v % 4 == 0, base - 0.5, base)
        alt = ((v // 4) % 2 == 1) & (face != TOP)
    elif bond == 'cloisonne':
        # Each stone framed by a course of brick and a brick on end between.
        brick = (v % 7 == 0) | ((u + (v // 7) * 5) % 10 == 0)
        step = np.where(brick, base - 0.5, base)
        alt = brick & (face != TOP)
    elif bond == 'coursed':
        course = v // 5
        joint = (v % 5 == 0) | (((u + course * 4) % 11 == 0) & (face != TOP))
        step = np.where(joint, base - 1, base)
        step = np.where((face == FRONT) & (_hash(u // 2, v, seed) % 41 == 0), step + 1, step)
    else:
        course = v // 7
        joint = ((v % 7 == 0) | (((u + course * 7) % 14 == 0) & (face == FRONT))) & (face != TOP)
        step = np.where(joint, base - 0.5, base)
    step = step + band
    # The side is a sliver: one shaded tone with its courses running back,
    # damp at the foot and a dark far edge, as the oblique painters keep it.
    side = face == SIDE
    if bond != 'flags' and side.any():
        right = np.full(k.shape[1], -1)
        np.maximum.at(right, ys[side], xs[side])
        far = side & (xs == right[ys])
        step = np.where(side, np.where((v % 7 == 0) & (bond != 'rendered'), 1.0, 1.5) - (v < 4) * 0.5 - far, step)
    colours = _five(_rgb(ramp), step + off)
    if alt is not None and second is not None:
        colours = np.where(alt[:, None], _five(_rgb(second), step + off), colours)
    img[ys, xs, :3] = colours


def light(img, buf):
    """The sun's own colour: cast shadow cooled toward the sky, sunlit tops
    warmed, a lit rim on the edges that face the sun."""
    solid = img[..., 3] > 0
    if 'lit' not in buf:
        return
    rgb = img[..., :3].astype(float)
    face = buf['face']
    lit = buf['lit']
    shade = solid & ~lit & (face != SIDE)
    rgb[shade] = rgb[shade] * 0.86 + np.array([42, 58, 96]) * 0.14
    warm = solid & lit & (face == TOP)
    rgb[warm] = rgb[warm] * 0.94 + np.array([255, 236, 200]) * 0.06
    edge = np.zeros_like(solid)
    edge[:, 1:] |= solid[:, 1:] & ~solid[:, :-1]
    edge[1:, :] |= solid[1:, :] & ~solid[:-1, :]
    rim = edge & lit
    rgb[rim] = rgb[rim] * 0.8 + 255 * 0.2
    img[..., :3] = np.clip(rgb, 0, 255).astype(np.uint8)


PAINTERS = {'tiles': tiles, 'lead': lead, 'masonry': masonry}


def finish_image(img, buf, finishes, seed=0):
    """Repaint each material that has a finish. `finishes` maps a material id
    to (painter, ramp, options)."""
    solid = img[..., 3] > 0
    glass = buf.get('glass')
    for mid, (painter, ramp, opts) in finishes.items():
        k = solid & (buf['mat'] == mid)
        if glass is not None:
            k &= ~glass
        if k.any():
            PAINTERS[painter](img, k, buf, ramp, seed, **opts)
    light(img, buf)
    return img
