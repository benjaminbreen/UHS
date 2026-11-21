"""Handcrafted pixel-art coastal fishing worksite equipment with rich procedural
variations: woven reed fish-drying mats, slatted trays, sorting tables, seine
nets on pegs, net rails, and tall mending frames.

Run standalone to inspect all 24 variants at 3x:
    .venv/bin/python scripts/art/front_fishing.py artifacts/coast-review/wave-c2/fishing-sheet.png
"""
from pathlib import Path
import math
import random
import sys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from art.front_materials import C, RAMPS, ramp, h2
from art.front_kit import consolidate

OAK = RAMPS['oak']
PINE = RAMPS['pine']
CEDAR = RAMPS['cedar']
STONE = RAMPS['granite']
IRON = ramp(270, .025, lift=-.12)

REED_GOLD = ramp(82, .068, lift=-.04)
REED_TOAST = ramp(64, .066, lift=-.08)
REED_BLEACH = ramp(86, .042, lift=.02)
REED_DARK = ramp(54, .052, lift=-.15)

MACKEREL = ramp(224, .058, lift=-.03)
SNAPPER = ramp(26, .095, lift=-.02)
MULLET = ramp(74, .056, lift=-.06)
CURED = ramp(44, .092, lift=-.03)
SMOKED = ramp(54, .086, lift=-.08)

CLAY_POT = ramp(40, .084, lift=-.08)
CLAY_DARK = ramp(34, .055, lift=-.16)
GOURD = ramp(72, .084, lift=-.02)
BASKET = ramp(62, .070, lift=-.06)

HEMP = ramp(78, .048, lift=-.07)
HEMP_PALE = ramp(84, .036, lift=.01)
NET_OLIVE = ramp(104, .042, lift=-.10)
NET_TAR = ramp(52, .040, lift=-.19)
CORK = ramp(64, .072, lift=.00)
FLOAT_RED = ramp(24, .112, lift=-.04)
SALT = ramp(92, .012, lift=.06)

FISHING_BASES = (
    'fish-mat',
    'fish-trays',
    'fish-table',
    'seine-pegs',
    'net-rail',
    'net-frame',
)
VARIANTS = 4


def parse_fishing_style(style):
    """Return (base_style, variant_index) for fishing worksite styles, else None."""
    if style in FISHING_BASES:
        return style, 0
    for base in FISHING_BASES:
        if style.startswith(base + '-'):
            tail = style[len(base) + 1:]
            if tail.isdigit():
                return base, int(tail)
    return None


def _blend(c, x, y, rgba):
    if x < 0 or y < 0 or x >= c.w or y >= c.h:
        return
    sr, sg, sb, sa = rgba
    if sa <= 0:
        return
    dr, dg, db, da = c.px[x, y]
    if sa >= 255 or da == 0:
        c.px[x, y] = (sr, sg, sb, sa)
        return
    a = sa / 255.0
    inv = 1.0 - a
    oa = sa + round(da * inv)
    if oa <= 0:
        return
    r = round((sr * a + dr * (da / 255.0) * inv) / (oa / 255.0))
    g = round((sg * a + dg * (da / 255.0) * inv) / (oa / 255.0))
    b = round((sb * a + db * (da / 255.0) * inv) / (oa / 255.0))
    c.px[x, y] = (max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), min(255, oa))


def _darken(c, x, y, factor):
    if x < 0 or y < 0 or x >= c.w or y >= c.h:
        return
    r, g, b, a = c.px[x, y]
    if a == 0:
        return
    c.px[x, y] = (
        max(0, round(r * factor)),
        max(0, round(g * factor)),
        max(0, round(b * factor)),
        a,
    )


def _ground_shadow_ellipse(c, cx, cy, rx, ry, alpha=82):
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            d = ((x - cx) / max(1.0, rx)) ** 2 + ((y - cy) / max(1.0, ry)) ** 2
            if d <= 1.0:
                a = round(alpha * (1.0 if d < 0.62 else 0.5))
                _blend(c, x, y, (28, 24, 20, a))


def _ground_shadow_rect(c, x0, y0, w, h, alpha=78):
    for y in range(y0, y0 + h):
        for x in range(x0, x0 + w):
            edge = (x == x0 or x == x0 + w - 1 or y == y0 + h - 1)
            _blend(c, x, y, (28, 24, 20, round(alpha * (0.48 if edge else 1.0))))


def _wood_post(c, x, y, w, h, wood, seed=0, lean=0.0):
    """Hand-hewn vertical timber post with bark/grain, lit left edge, shaded right, cut top."""
    for dy in range(h):
        ox = round(lean * (1.0 - dy / max(1, h - 1)))
        yy = y + dy
        for dx in range(w):
            xx = x + dx + ox
            g = h2(xx + seed, yy // 3 + seed, 19)
            if dx == 0:
                col = wood[2 if g > 0.25 else 3]
            elif dx == w - 1:
                col = wood[6 if g > 0.2 else 5]
            elif dx == w - 2 and w >= 4:
                col = wood[5 if g > 0.35 else 4]
            else:
                col = wood[3 if g > 0.4 else 4]
            if dy == 0:
                col = wood[1 if dx < w - 1 else 3]
            elif dy == h - 1:
                col = wood[6]
            c.p(xx, yy, col)


def _wood_plank(c, x, y, w, h, wood, seed=0, rim_top=True, rim_bot=True):
    """Horizontal board with lengthwise wood grain, upper-left highlight, shaded underside."""
    for dy in range(h):
        yy = y + dy
        for dx in range(w):
            xx = x + dx
            g = h2((xx + seed) // 4, yy + seed, 23)
            if rim_top and dy == 0:
                col = wood[1 if g > 0.2 else 2]
            elif rim_bot and dy == h - 1:
                col = wood[6 if g > 0.2 else 5]
            elif dx == 0:
                col = wood[2]
            elif dx == w - 1:
                col = wood[5]
            else:
                col = wood[2 if g > 0.72 else 4 if g < 0.24 else 3]
            c.p(xx, yy, col)


def _pebble(c, cx, cy, rx, ry, r=STONE):
    _ground_shadow_ellipse(c, cx + 1, cy + ry, rx + 0.6, max(1.0, ry * 0.7), 62)
    for dy in range(-ry - 1, ry + 2):
        for dx in range(-rx - 1, rx + 2):
            d = (dx / max(1.0, rx)) ** 2 + (dy / max(1.0, ry)) ** 2
            if d > 1.0:
                continue
            if d > 0.62:
                col = r[5 if dy >= 0 or dx > 0 else 4]
            elif dx <= 0 and dy < 0:
                col = r[1]
            elif dy > 0:
                col = r[4]
            else:
                col = r[2]
            c.p(cx + dx, cy + dy, col)


def draw_fish(c, cx, cy, length=16, angle_deg=0.0, flip=1, species=MACKEREL, split=False, shadow_on_mat=True):
    """Sculpted pixel-art fish with normal-shaded body, bright wet dorsal glint,
    gill arc, eye specular, forked tail, and 1px contact shadow beneath."""
    rad = math.radians(angle_deg)
    ca, sa = math.cos(rad), math.sin(rad)
    half_l = length * 0.5
    max_r = (length * 0.30) if split else (length * 0.21)
    pad = int(half_l + 5)

    # First pass: collect body pixels in local coords so we can shade & cast shadow cleanly.
    local = {}
    for ly in range(-int(max_r) - 4, int(max_r) + 5):
        for lx in range(-int(half_l) - 4, int(half_l) + 5):
            # Flip so head is at -u (left when flip=1) and tail at +u (right when flip=1).
            u = (lx * flip) / max(1.0, half_l)  # -1 = nose, +1 = tail tip
            if u < -1.02 or u > 1.12:
                continue
            if split:
                # Butterflied sun-drying fish: wide splayed oval body + flared tail fin.
                if u <= 0.68:
                    t = (u + 0.98) / 1.66
                    if t < 0 or t > 1:
                        continue
                    w = max_r * math.sin(t * math.pi) ** 0.72 * (1.08 - 0.22 * t)
                    if abs(ly) <= w:
                        local[(lx, ly)] = ('split_body', u, ly / max(0.6, w))
                elif u <= 1.08:
                    ft = (u - 0.68) / 0.40
                    tw = max(0.7, max_r * (0.28 + 0.52 * ft))
                    notch = ft > 0.45 and abs(ly) < (ft - 0.4) * max_r * 0.55
                    if abs(ly) <= tw and not notch:
                        local[(lx, ly)] = ('tail', u, ly / max(0.6, tw))
            else:
                if u <= 0.64:
                    t = (u + 0.98) / 1.62
                    if t < 0 or t > 1:
                        continue
                    w = max_r * math.sin(t * math.pi) ** 0.68 * (1.12 - 0.34 * t)
                    if abs(ly) <= w:
                        local[(lx, ly)] = ('body', u, ly / max(0.6, w))
                    # Dorsal fin on upper back.
                    elif -0.35 <= u <= 0.22 and -w - 1.5 <= ly < -w + 0.1:
                        local[(lx, ly)] = ('fin', u, -1.0)
                elif u <= 1.08:
                    ft = (u - 0.64) / 0.44
                    tw = max(0.7, max_r * (0.24 + 0.72 * ft))
                    notch = ft > 0.48 and abs(ly) < (ft - 0.44) * max_r * 0.78
                    if abs(ly) <= tw and not notch:
                        local[(lx, ly)] = ('tail', u, ly / max(0.6, tw))

    # Project local pixels to canvas space.
    placed = {}
    for (lx, ly), info in local.items():
        wx = round(cx + lx * ca - ly * sa)
        wy = round(cy + lx * sa + ly * ca)
        placed[(wx, wy)] = info

    # Contact shadow 1px below & right on the surface underneath.
    if shadow_on_mat:
        for (wx, wy) in placed:
            if (wx, wy + 1) not in placed:
                _darken(c, wx, wy + 1, 0.70)
            if (wx + 1, wy + 1) not in placed:
                _darken(c, wx + 1, wy + 1, 0.82)

    # Shade each pixel with colored edge & crisp anatomical accents.
    for (wx, wy), (part, u, v) in placed.items():
        edge_bot = (wx, wy + 1) not in placed or (wx + 1, wy) not in placed
        edge_top = (wx, wy - 1) not in placed or (wx - 1, wy) not in placed
        if part == 'split_body':
            if edge_bot:
                col = MACKEREL[6]
            elif edge_top:
                col = MACKEREL[5]
            elif abs(v) < 0.14 and -0.72 < u < 0.56:
                # Pale central backbone ridge.
                col = SALT[1 if (wx + wy) % 2 == 0 else 2]
            elif abs(v) < 0.48 and -0.55 < u < 0.45 and (wx % 3 == 0):
                # Subtle rib-line highlight in cured amber-rose flesh.
                col = CURED[1]
            else:
                col = CURED[2 if v < 0 else 3 if v < 0.55 else 4]
        elif part == 'body':
            if edge_bot:
                col = species[6]
            elif edge_top:
                col = species[5 if v < 0 else 6]
            elif -0.68 <= u <= -0.56 and -0.25 <= v <= 0.15:
                # Tiny dark eye.
                col = species[7]
            elif -0.36 <= u <= -0.24 and -0.45 <= v <= 0.55:
                # Curved gill slit.
                col = species[6]
            elif v < -0.35:
                col = species[4 if v < -0.65 else 3]
            elif -0.35 <= v <= 0.08:
                # Bright glistening upper-flank specular band.
                col = species[0 if (-0.4 < u < 0.35 and (wx + wy) % 3 != 0) else 1]
            elif v <= 0.52:
                col = species[2]
            else:
                # Pale pearl belly.
                col = species[1 if u < 0.25 else 3]
        elif part == 'fin':
            col = species[5]
        else:  # tail
            col = species[5 if (edge_bot or v > 0.2) else 4 if v < -0.2 else 3]
        c.p(wx, wy, col)


def draw_clay_pot(c, cx, by, r_body=10, height=15, clay=CLAY_POT, fill_kind='brine'):
    """Surface-normal shaded wide-bellied clay jar with curved foot, rim glint, and contents."""
    _ground_shadow_ellipse(c, cx + 1, by + 1, r_body * 0.92, 3.6, 86)
    profile = []
    for k in range(height + 1):
        t = k / max(1, height)  # 0=bottom, 1=rim
        if t < 0.22:
            w = r_body * (0.64 + (t / 0.22) * 0.32)
        elif t < 0.68:
            w = r_body * (0.96 + 0.08 * math.sin((t - 0.22) / 0.46 * math.pi))
        elif t < 0.88:
            w = r_body * (0.96 - (t - 0.68) / 0.20 * 0.16)
        else:
            w = r_body * (0.80 + (t - 0.88) / 0.12 * 0.12)
        profile.append(w)

    # Revolved body with curved foot drop (standing on ground, not flat sticker).
    for k in range(height + 1):
        w = profile[k]
        if w < 1:
            continue
        iw = int(round(w))
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            if abs(u) > 1.0:
                continue
            curve = round(math.sqrt(max(0.0, 1.0 - u * u)) * 2.6)
            yy = by - k + curve - 2
            xx = cx + dx
            # Surface normal shading: light from upper-left (-0.55, -0.5).
            nx = u
            nz = math.sqrt(max(0.0, 1.0 - u * u))
            light = -nx * 0.55 + nz * 0.65 + (k / max(1, height)) * 0.22
            if abs(u) > 0.86 or k == 0:
                idx = 6 if (u > 0 or k == 0) else 5
            elif light > 0.68:
                idx = 1
            elif light > 0.48:
                idx = 2
            elif light > 0.28:
                idx = 3
            elif light > 0.10:
                idx = 4
            else:
                idx = 5
            # Tiny rim reflection on shaded right flank.
            if 0.62 < u < 0.82 and 3 < k < height - 2:
                idx = max(3, idx - 1)
            # Subtle thrown wheel-rings.
            if k in (height - 4, height - 8) and abs(u) < 0.78:
                idx = min(6, idx + 1)
            c.p(xx, yy, clay[idx])

    # Elliptical mouth opening & contents.
    rw = max(3, int(round(profile[-1])) - 1)
    rh = max(2, round(rw * 0.38))
    ry = by - height - 1
    for dy in range(-rh - 1, rh + 2):
        for dx in range(-rw - 1, rw + 2):
            d = (dx / max(1.0, rw)) ** 2 + (dy / max(1.0, rh)) ** 2
            if d > 1.18:
                continue
            xx, yy = cx + dx, ry + dy
            if d > 0.78:
                # Thick rounded lip catching light on the near-left rim.
                c.p(xx, yy, clay[1 if (dy > 0 and dx < 2) or (dy <= 0 and dx < -2) else 3 if dy <= 0 else 4])
            else:
                if fill_kind == 'salt':
                    c.p(xx, yy, SALT[0 if (dy <= 0 and dx < 1) else 1 if dy <= 0 else 2])
                elif fill_kind == 'brine':
                    glint = dy == 0 and -2 <= dx <= 1
                    c.p(xx, yy, MACKEREL[1] if glint else clay[7 if dy < 0 else 6])
                else:
                    c.p(xx, yy, clay[7 if dy < 0 else 6])


def draw_catch_basket(c, cx, by, rx=10, height=11, basket=BASKET, with_fish=True):
    """Coiled woven reed catch basket with staggered coil ribs and protruding fish tails."""
    _ground_shadow_ellipse(c, cx + 1, by + 1, rx * 0.95, 3.4, 82)
    for k in range(height + 1):
        t = k / max(1, height)
        w = rx * (0.72 + 0.30 * math.sin(t * math.pi * 0.65))
        iw = int(round(w))
        coil_groove = (k % 3 == 0)
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            if abs(u) > 1.0:
                continue
            curve = round(math.sqrt(max(0.0, 1.0 - u * u)) * 2.4)
            yy = by - k + curve - 2
            xx = cx + dx
            stitch = ((dx + (k // 3) * 2) % 3 == 0)
            if abs(u) > 0.87 or k == 0:
                idx = 6 if (u > 0 or k == 0) else 5
            elif coil_groove:
                idx = 5 if u > 0 else 4
            else:
                base_idx = 2 if u < -0.2 else 3 if u < 0.35 else 4
                idx = min(5, base_idx + (1 if stitch else 0))
            c.p(xx, yy, basket[idx])

    # Oval rim & interior.
    rw = max(4, int(round(rx * 0.96)))
    rh = max(2, round(rw * 0.38))
    ry = by - height - 1
    for dy in range(-rh - 1, rh + 2):
        for dx in range(-rw - 1, rw + 2):
            d = (dx / max(1.0, rw)) ** 2 + (dy / max(1.0, rh)) ** 2
            if d > 1.15:
                continue
            if d > 0.72:
                c.p(cx + dx, ry + dy, basket[1 if dx < 1 else 4])
            else:
                c.p(cx + dx, ry + dy, basket[6 if dy < 0 else 5])

    if with_fish:
        # Three gleaming fish nestled & poking out over the basket rim.
        draw_fish(c, cx - 2, ry - 1, length=12, angle_deg=-24, flip=1, species=MACKEREL, shadow_on_mat=False)
        draw_fish(c, cx + 3, ry, length=11, angle_deg=18, flip=-1, species=SNAPPER, shadow_on_mat=False)
        draw_fish(c, cx, ry + 1, length=11, angle_deg=-6, flip=1, species=MACKEREL, shadow_on_mat=False)
        # Re-paint front rim lip so fish sit INSIDE the basket.
        for dx in range(-rw, rw + 1):
            u = dx / max(1.0, rw)
            dy = round(math.sqrt(max(0.0, 1.0 - u * u)) * rh)
            c.p(cx + dx, ry + dy, basket[2 if dx < 1 else 4])
            c.p(cx + dx, ry + dy + 1, basket[5])


def draw_gourd(c, cx, by):
    """Tapered warm-amber calabash bottle gourd with twine collar and cork stopper."""
    _ground_shadow_ellipse(c, cx + 1, by + 1, 6.8, 2.6, 78)
    for k in range(16):
        t = k / 15.0
        if t < 0.56:
            w = 6.6 * math.sin((t / 0.56) * math.pi * 0.84 + 0.26)
        elif t < 0.80:
            w = 2.6 + 0.9 * (1.0 - (t - 0.56) / 0.24)
        else:
            w = 2.2
        iw = int(round(w))
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            curve = round(math.sqrt(max(0.0, 1.0 - u * u)) * 1.6)
            yy = by - k + curve - 1
            if abs(u) > 0.86 or k == 0:
                idx = 6 if (u > 0 or k == 0) else 5
            elif u < -0.22 and 3 <= k <= 9:
                idx = 1
            elif u < 0.22:
                idx = 2
            elif u < 0.58:
                idx = 3
            else:
                idx = 4
            c.p(cx + dx, yy, GOURD[idx])
    # Twine tie round the narrow neck + dark wooden stopper on top.
    for dx in range(-3, 4):
        c.p(cx + dx, by - 10, HEMP[2 if dx < 0 else 5])
    for dx in (-1, 0, 1):
        c.p(cx + dx, by - 15, OAK[3 if dx <= 0 else 5])
        c.p(cx + dx, by - 16, OAK[2 if dx <= 0 else 4])


def draw_knife(c, x, y, flip=1):
    """Small wooden-handled gutting knife resting diagonally on a mat or table."""
    pts = [
        (0, 0, OAK[5]), (1, 0, OAK[3]), (2, 0, OAK[2]), (3, 1, OAK[4]),
        (4, 1, IRON[4]), (5, 1, IRON[1]), (6, 1, IRON[2]), (7, 2, IRON[1]), (8, 2, IRON[3]),
        (5, 2, IRON[5]), (6, 2, IRON[4]), (7, 3, IRON[5]),
    ]
    for dx, dy, col in pts:
        xx = x + dx * flip
        yy = y + dy
        _darken(c, xx, yy + 1, 0.76)
        c.p(xx, yy, col)


def draw_salt_pile(c, cx, cy, rx=5, ry=3):
    """Small mound of coarse white sea-salt crystals on a clay shard or wood board."""
    for dy in range(-ry, ry + 1):
        for dx in range(-rx - 1, rx + 2):
            if (dx / (rx + 1)) ** 2 + (dy / (ry + 0.5)) ** 2 <= 1.0:
                c.p(cx + dx, cy + dy + 1, CLAY_POT[5 if dy > 0 else 4])
    for dy in range(-ry, 2):
        span = round(rx * (1.0 - abs(dy + 0.6) / (ry + 1.5)))
        for dx in range(-span, span + 1):
            g = h2(cx + dx, cy + dy, 91)
            c.p(cx + dx, cy + dy, SALT[0 if (dy < 0 and dx <= 0) or g > 0.72 else 1 if dy <= 0 else 2])


def draw_crab_bowl(c, cx, by):
    """Shallow wooden bowl holding two tiny bright orange shore crabs."""
    _ground_shadow_ellipse(c, cx + 1, by + 1, 7.5, 2.8, 72)
    for dy in range(5):
        w = round(7.5 - dy * 0.6)
        for dx in range(-w, w + 1):
            idx = 5 if abs(dx) >= w - 1 or dy == 4 else 3 if dx < 1 else 4
            c.p(cx + dx, by - 4 + dy, OAK[idx])
    for dx in range(-7, 8):
        c.p(cx + dx, by - 5, OAK[2 if dx < 2 else 4])
        if abs(dx) < 6:
            c.p(cx + dx, by - 4, OAK[6])
    for ox, oy in ((-2, -5), (2, -4)):
        for dx in (-2, -1, 0, 1, 2):
            c.p(cx + ox + dx, by + oy, SNAPPER[1 if dx <= 0 else 3])
        c.p(cx + ox - 1, by + oy - 1, SNAPPER[2])
        c.p(cx + ox + 1, by + oy - 1, SNAPPER[4])


def draw_rope_coil(c, cx, cy, rings=3, rope=HEMP):
    """Layered 3D coil of hemp line resting on the ground with shadow & lit upper ridge."""
    _ground_shadow_ellipse(c, cx + 1, cy + 2, rings * 3 + 2, rings * 1.5 + 1.5, 72)
    for r in range(rings * 3, 1, -3):
        ry = max(2, round(r * 0.48))
        for deg in range(0, 360, 6):
            a = math.radians(deg)
            px = round(cx + math.cos(a) * r)
            py = round(cy + math.sin(a) * ry)
            lit_top = math.sin(a) < 0.15 and math.cos(a) < 0.45
            twist = (deg // 18) % 2 == 0
            c.p(px, py + 1, rope[6])
            c.p(px, py, rope[1 if (lit_top and twist) else 2 if lit_top else 4 if twist else 5])


def draw_bucket(c, cx, by, r_top=6, h=10, wood=OAK):
    """Staved wooden fish/brine bucket with iron hoops and soft shadow."""
    _ground_shadow_ellipse(c, cx + 1, by + 1, r_top * 0.9, 2.8, 78)
    for k in range(h + 1):
        w = r_top * (0.78 + 0.22 * (k / max(1, h)))
        iw = int(round(w))
        hoop = k in (2, h - 2)
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            curve = round(math.sqrt(max(0.0, 1.0 - u * u)) * 1.8)
            yy = by - k + curve - 1
            if hoop:
                c.p(cx + dx, yy, IRON[3 if u < 0 else 6])
            else:
                seam = (dx + iw) % 3 == 0
                idx = 6 if abs(u) > 0.85 or k == 0 else 5 if seam else 2 if u < -0.2 else 3 if u < 0.35 else 4
                c.p(cx + dx, yy, wood[idx])
    for dx in range(-r_top + 1, r_top):
        c.p(cx + dx, by - h - 1, wood[1 if dx < 1 else 4])
        if abs(dx) < r_top - 1:
            c.p(cx + dx, by - h, MACKEREL[4 if dx < 0 else 6])


def draw_woven_mat(c, x0, y0, w, h, reed, stripe_reed, seed=0, tilt=0.0):
    """Organic twill-woven reed drying mat with frayed side strands, rolled front lip,
    woven border stripes, damp wear patches, and soft ground contact shadow."""
    rng = random.Random(seed)
    # Soft 2px ground contact shadow beneath the bottom & right edge.
    for x in range(x0, x0 + w + 2):
        wave_b = round(math.sin((x - x0) * 0.14 + seed) * 0.6 + tilt * (x - x0))
        _blend(c, x, y0 + h + wave_b, (28, 24, 18, 86))
        if x > x0:
            _blend(c, x, y0 + h + 1 + wave_b, (30, 26, 20, 42))
    for y in range(y0 + 1, y0 + h + 1):
        _blend(c, x0 + w, y + round(tilt * w), (28, 24, 18, 64))

    for x in range(x0, x0 + w):
        u = (x - x0) / max(1, w - 1)
        # Subtle organic edge undulation so the mat never reads as a ruled rectangle.
        wt = round(math.sin(u * math.tau * 1.5 + seed) * 0.65 + tilt * (x - x0))
        wb = round(math.sin(u * math.tau * 1.3 + seed + 1.4) * 0.65 + tilt * (x - x0))
        top = y0 + wt
        bot = y0 + h - 1 + wb
        in_stripe = (4 <= (x - x0) <= 6) or (w - 7 <= (x - x0) <= w - 5)
        for y in range(top, bot + 1):
            # Tapered corners by 1px for natural flexible cloth/reed silhouette.
            if (x == x0 or x == x0 + w - 1) and (y == top or y == bot):
                continue
            r = stripe_reed if in_stripe else reed
            if y == top:
                col = r[1 if (x % 3 != 0) else 2]
            elif y == bot:
                col = r[6 if (x % 2 == 0) else 5]
            elif y == bot - 1:
                # Rolled front braided hem.
                col = r[4 if (x % 3 != 0) else 5]
            elif x == x0:
                col = r[4]
            elif x == x0 + w - 1:
                col = r[5]
            else:
                # Diagonal herringbone / twill reed weave, calm enough that fish pop cleanly.
                phase = ((x // 2) + y) % 4
                wear = h2(x // 6, y // 4, seed + 17)
                if phase == 0:
                    idx = 1 if wear > 0.32 else 2
                elif phase == 1:
                    idx = 2
                elif phase == 2:
                    idx = 3
                else:
                    idx = 3 if wear > 0.48 else 4
                if wear > 0.78 and not in_stripe:
                    idx = max(1, idx - 1)
                col = r[idx]
            c.p(x, y, col)

    # Frayed stray reed strands poking irregularly from left & right ends.
    for side, sx in ((-1, x0 - 1), (1, x0 + w)):
        for y in range(y0 + 1, y0 + h - 1):
            if rng.random() < 0.58:
                flen = 1 + (1 if rng.random() < 0.45 else 0) + (1 if rng.random() < 0.15 else 0)
                yy = y + round(tilt * (0 if side < 0 else w))
                for k in range(flen):
                    xx = sx + side * k
                    col = reed[2 if (side < 0 and k == 0) else 4 if k == 0 else 5]
                    c.p(xx, yy, col)


def _draw_fish_mat(c, variant, cx, by):
    if variant == 0:
        # Sun-warmed golden reed mat, wide terracotta brine pot, varied silver/coral/split catch, knife & pebbles.
        draw_woven_mat(c, 22, by - 18, 86, 17, REED_GOLD, REED_DARK, seed=11)
        _pebble(c, 103, by - 15, 2, 1)
        _pebble(c, 102, by - 4, 2, 1)
        draw_fish(c, 42, by - 13, length=18, angle_deg=-9, flip=1, species=MACKEREL)
        draw_fish(c, 58, by - 9, length=16, angle_deg=11, flip=-1, species=SNAPPER)
        draw_fish(c, 74, by - 13, length=15, angle_deg=-4, flip=1, species=MACKEREL, split=True)
        draw_fish(c, 91, by - 10, length=17, angle_deg=8, flip=1, species=MACKEREL)
        draw_fish(c, 44, by - 6, length=14, angle_deg=4, flip=-1, species=MULLET)
        draw_knife(c, 74, by - 6, flip=1)
        draw_clay_pot(c, 18, by, r_body=9, height=14, clay=CLAY_POT, fill_kind='brine')
    elif variant == 1:
        # Bleached reed mat with split curing fish rows, sea-salt mound, and brimming catch basket on right.
        draw_woven_mat(c, 18, by - 18, 84, 17, REED_BLEACH, REED_TOAST, seed=23)
        _pebble(c, 22, by - 15, 2, 1)
        draw_fish(c, 34, by - 13, length=15, angle_deg=-3, flip=1, species=MACKEREL, split=True)
        draw_fish(c, 52, by - 13, length=15, angle_deg=5, flip=-1, species=MACKEREL, split=True)
        draw_fish(c, 70, by - 12, length=15, angle_deg=-6, flip=1, species=MACKEREL, split=True)
        draw_fish(c, 42, by - 6, length=16, angle_deg=7, flip=1, species=MACKEREL)
        draw_fish(c, 64, by - 6, length=17, angle_deg=-8, flip=-1, species=SNAPPER)
        draw_salt_pile(c, 84, by - 8, rx=4, ry=2)
        draw_catch_basket(c, 106, by, rx=10, height=11, basket=BASKET, with_fish=True)
    elif variant == 2:
        # Honey-toasted cane mat heaped with morning haul + calabash gourd & crab bowl on left.
        draw_woven_mat(c, 26, by - 18, 82, 17, REED_TOAST, REED_DARK, seed=37, tilt=0.015)
        _pebble(c, 103, by - 14, 2, 1)
        # Generous overlapping fresh catch heap.
        draw_fish(c, 45, by - 12, length=18, angle_deg=-14, flip=1, species=MACKEREL)
        draw_fish(c, 55, by - 9, length=17, angle_deg=10, flip=-1, species=MULLET)
        draw_fish(c, 64, by - 13, length=19, angle_deg=-6, flip=1, species=MACKEREL)
        draw_fish(c, 78, by - 11, length=16, angle_deg=14, flip=1, species=SNAPPER)
        draw_fish(c, 89, by - 7, length=16, angle_deg=-11, flip=-1, species=MACKEREL)
        draw_fish(c, 70, by - 6, length=15, angle_deg=3, flip=1, species=MULLET)
        draw_gourd(c, 15, by)
        draw_crab_bowl(c, 27, by + 1)
    else:
        # Rich banded reed mat with smoked golden & fresh catch, salt trough, twine coil & shells.
        draw_woven_mat(c, 20, by - 18, 86, 17, REED_GOLD, REED_TOAST, seed=53, tilt=-0.012)
        draw_fish(c, 37, by - 12, length=16, angle_deg=-5, flip=1, species=SMOKED)
        draw_fish(c, 53, by - 11, length=16, angle_deg=4, flip=1, species=SMOKED)
        draw_fish(c, 70, by - 13, length=15, angle_deg=-8, flip=-1, species=MACKEREL, split=True)
        draw_fish(c, 88, by - 11, length=17, angle_deg=9, flip=-1, species=MACKEREL)
        draw_fish(c, 58, by - 6, length=14, angle_deg=-4, flip=1, species=SNAPPER)
        # Shallow wooden salt box on the mat's right foot.
        _wood_plank(c, 77, by - 7, 16, 5, OAK, seed=5)
        for dx in range(2, 14):
            c.p(77 + dx, by - 6, SALT[0 if dx < 8 else 1])
        # Tiny pale shells on the corner.
        for sx, sy in ((26, by - 5), (30, by - 4)):
            c.p(sx, sy, SALT[0]); c.p(sx + 1, sy, SALT[2]); c.p(sx, sy + 1, SALT[3])
        draw_clay_pot(c, 15, by, r_body=8, height=13, clay=CLAY_DARK, fill_kind='salt')
        draw_rope_coil(c, 108, by - 2, rings=2, rope=HEMP)


def _draw_fish_trays(c, variant, cx, by):
    wood_frame = OAK if variant in (0, 2) else CEDAR if variant == 1 else PINE
    wood_slat = PINE if variant != 3 else REED_TOAST
    # Ground shadow beneath trestle legs & tray overhang.
    _ground_shadow_ellipse(c, cx, by + 1, 44, 5.0, 68)
    # Braced timber trestle legs.
    for lx in (28, 94):
        _wood_post(c, lx, by - 15, 5, 16, wood_frame, seed=lx + variant)
        _ground_shadow_ellipse(c, lx + 2, by + 1, 5, 2.2, 82)
    # Cross stretcher rail.
    _wood_plank(c, 31, by - 6, 65, 3, wood_frame, seed=11 + variant)

    # Under-trestle companion prop varies per variant.
    if variant == 0:
        draw_bucket(c, 42, by + 1, r_top=6, h=10, wood=OAK)
    elif variant == 1:
        draw_catch_basket(c, 84, by + 1, rx=9, height=10, basket=BASKET, with_fish=True)
    elif variant == 2:
        draw_bucket(c, 64, by + 1, r_top=6, h=9, wood=CEDAR)
        draw_rope_coil(c, 46, by, rings=2, rope=HEMP)
    else:
        draw_clay_pot(c, 40, by + 1, r_body=7, height=12, clay=CLAY_POT, fill_kind='brine')

    # Main tray apron & recessed slatted drying beds.
    ty = by - 29
    _wood_plank(c, 22, ty + 14, 84, 4, wood_frame, seed=3 + variant)
    # Outer tray frame top & side walls.
    _wood_plank(c, 22, ty, 84, 2, wood_frame, seed=7 + variant)
    for sx in (22, 103):
        _wood_post(c, sx, ty, 3, 16, wood_frame, seed=sx)
    # Tray wells (2 compartments, or 3 on variant 2).
    dividers = [63] if variant != 2 else [50, 77]
    spans = []
    left = 25
    for dv in dividers + [103]:
        spans.append((left, dv))
        left = dv + 3
    for dv in dividers:
        _wood_post(c, dv, ty + 1, 3, 14, wood_frame, seed=dv + variant)

    for si, (x0, x1) in enumerate(spans):
        w = x1 - x0
        for y in range(ty + 2, ty + 14):
            slat_gap = (y - ty) % 3 == 0
            for x in range(x0, x1):
                g = h2(x // 4, y, variant * 13 + si)
                if y == ty + 2 or x == x0:
                    col = wood_slat[6]
                elif slat_gap:
                    col = wood_slat[5 if g > 0.3 else 6]
                else:
                    col = wood_slat[2 if g > 0.65 else 3 if g > 0.25 else 4]
                c.p(x, y, col)

    # Populated fish & tools per variant.
    if variant == 0:
        draw_fish(c, 37, ty + 7, length=17, angle_deg=-8, flip=1, species=MACKEREL)
        draw_fish(c, 49, ty + 10, length=16, angle_deg=6, flip=-1, species=SNAPPER)
        draw_fish(c, 77, ty + 7, length=16, angle_deg=-5, flip=1, species=MACKEREL)
        draw_fish(c, 91, ty + 10, length=17, angle_deg=9, flip=-1, species=MULLET)
        draw_knife(c, 81, ty + 11, flip=-1)
    elif variant == 1:
        for fx in (35, 51, 75, 91):
            draw_fish(c, fx, ty + 8, length=15, angle_deg=(-4 if fx % 2 else 5), flip=1, species=MACKEREL, split=True)
        draw_salt_pile(c, 56, ty + 11, rx=3, ry=2)
    elif variant == 2:
        draw_fish(c, 36, ty + 7, length=15, angle_deg=-10, flip=1, species=MACKEREL)
        draw_fish(c, 39, ty + 10, length=14, angle_deg=8, flip=-1, species=MACKEREL)
        draw_fish(c, 63, ty + 8, length=15, angle_deg=-4, flip=1, species=SNAPPER)
        draw_fish(c, 89, ty + 7, length=15, angle_deg=7, flip=-1, species=MULLET)
        draw_knife(c, 86, ty + 11, flip=1)
    else:
        draw_fish(c, 39, ty + 8, length=17, angle_deg=-7, flip=1, species=SMOKED)
        draw_fish(c, 53, ty + 10, length=15, angle_deg=6, flip=1, species=SMOKED)
        draw_fish(c, 78, ty + 7, length=16, angle_deg=-5, flip=-1, species=MACKEREL, split=True)
        draw_fish(c, 92, ty + 10, length=16, angle_deg=11, flip=1, species=MACKEREL)


def _draw_fish_table(c, variant, cx, by):
    wood_leg = OAK if variant != 2 else CEDAR
    wood_top = PINE if variant in (0, 1) else OAK
    _ground_shadow_ellipse(c, cx, by + 1, 42, 5.2, 72)
    # Sturdy legs + stretcher.
    for lx in (30, 92):
        _wood_post(c, lx, by - 19, 6, 20, wood_leg, seed=lx + variant)
        _ground_shadow_ellipse(c, lx + 3, by + 1, 5.5, 2.4, 84)
    _wood_plank(c, 34, by - 8, 60, 3, wood_leg, seed=19 + variant)

    if variant == 0:
        draw_bucket(c, 62, by + 1, r_top=7, h=11, wood=OAK)
    elif variant == 1:
        draw_catch_basket(c, 46, by + 1, rx=9, height=10, basket=BASKET, with_fish=True)
    elif variant == 2:
        draw_bucket(c, 82, by + 1, r_top=7, h=11, wood=CEDAR)
    else:
        draw_clay_pot(c, 52, by + 1, r_body=8, height=12, clay=CLAY_POT, fill_kind='salt')

    # Thick plank tabletop with plank seams & damp brine rings.
    ty = by - 32
    _wood_plank(c, 25, ty + 12, 78, 4, wood_leg, seed=variant + 2)
    for py in range(ty, ty + 12):
        seam = py in (ty + 4, ty + 8)
        for px in range(25, 103):
            g = h2(px // 5, py, variant * 17 + 3)
            if py == ty:
                col = wood_top[1 if g > 0.25 else 2]
            elif seam:
                col = wood_top[5]
            elif px in (25, 102):
                col = wood_top[5 if px == 102 else 2]
            else:
                # Subtle wet fish-brine darkening in the working middle.
                wet = abs(px - 60) < 22 and abs(py - (ty + 6)) < 4 and g < 0.55
                col = wood_top[4 if wet else 2 if g > 0.68 else 3]
            c.p(px, py, col)
    # Side lip cleats.
    for sx in (26, 99):
        _wood_post(c, sx, ty - 1, 3, 14, wood_leg, seed=sx + variant)

    if variant == 0:
        # Chopping block + cleaver + fresh mackerel/snapper.
        _wood_plank(c, 33, ty + 2, 16, 8, OAK, seed=9)
        draw_knife(c, 36, ty + 4, flip=1)
        draw_fish(c, 62, ty + 5, length=18, angle_deg=-8, flip=1, species=MACKEREL)
        draw_fish(c, 77, ty + 8, length=17, angle_deg=7, flip=-1, species=SNAPPER)
        draw_fish(c, 90, ty + 4, length=16, angle_deg=-5, flip=1, species=MACKEREL)
    elif variant == 1:
        # Hanging linen rag draped over front edge + sorted catch.
        for ry in range(ty + 11, ty + 20):
            for rx in range(32, 41):
                if ry == ty + 19 and (rx % 2 == 0):
                    continue
                c.p(rx, ry, SALT[1 if rx < 36 else 2 if ry < ty + 17 else 3])
        draw_fish(c, 45, ty + 6, length=17, angle_deg=-6, flip=1, species=MACKEREL)
        draw_fish(c, 63, ty + 8, length=16, angle_deg=9, flip=-1, species=MULLET)
        draw_fish(c, 81, ty + 5, length=18, angle_deg=-4, flip=1, species=SNAPPER)
        draw_salt_pile(c, 93, ty + 8, rx=4, ry=2)
    elif variant == 2:
        # Platter with red crabs + neat market row of silver fish.
        draw_crab_bowl(c, 38, ty + 9)
        draw_fish(c, 58, ty + 5, length=17, angle_deg=-4, flip=1, species=MACKEREL)
        draw_fish(c, 74, ty + 6, length=17, angle_deg=-3, flip=1, species=MACKEREL)
        draw_fish(c, 90, ty + 7, length=16, angle_deg=-5, flip=1, species=SNAPPER)
        draw_knife(c, 57, ty + 9, flip=1)
    else:
        # Split drying fish + salt crock + smoked fish.
        draw_fish(c, 42, ty + 6, length=15, angle_deg=-4, flip=1, species=MACKEREL, split=True)
        draw_fish(c, 61, ty + 6, length=15, angle_deg=5, flip=-1, species=MACKEREL, split=True)
        draw_fish(c, 81, ty + 6, length=17, angle_deg=-7, flip=1, species=SMOKED)
        draw_knife(c, 87, ty + 9, flip=-1)


def _draw_net_mesh(c, x0, x1, y_top_fn, drop_fn, net_ramp, float_ramp, sinker_ramp, seed=0, gather_right=False):
    """Organic draped diamond-mesh fishing net with fold shading, carved floats,
    stone/lead sinkers, and soft ground shadow underneath."""
    d = ImageDraw.Draw(c.im)
    span = x1 - x0
    # Soft shadow cast on ground below the draped net.
    _ground_shadow_ellipse(c, (x0 + x1) * 0.5, y_top_fn(0.5) + drop_fn(0.5) + 8, span * 0.48, 3.6, 56)

    def pt(u, v):
        # Optional gathering squeezes horizontal mesh slightly toward right end.
        uu = u if not gather_right else (u ** 0.85)
        x = x0 + uu * span
        top = y_top_fn(u)
        drop = drop_fn(u)
        # Subtle wave fold in the middle of the drape.
        fold = math.sin(u * math.tau * 2.0 + seed) * 1.4 * v
        return (x, top + v * drop + fold)

    # Draw subtle translucent dark fold backing in deepest hollows so net has volume.
    for i in range(0, int(span), 2):
        u = i / max(1, span)
        x, yt = pt(u, 0.0)
        _, yb = pt(u, 1.0)
        hollow = math.sin(u * math.pi)
        if hollow > 0.35:
            for y in range(round(yt) + 2, round(yb) - 1, 2):
                if h2(round(x), y, seed + 41) < 0.45:
                    _blend(c, round(x), y, (*net_ramp[6][:3], 72))

    # Crisp diamond mesh lines in 2 directional shades (lit & shaded strands).
    steps = 16 if span > 80 else 12
    for sign in (-1, 1):
        for k in range(-steps, steps * 2):
            pts = []
            for i in range(65):
                u = i / 64.0
                v = k / 7.5 + sign * u * 2.2
                if 0.0 <= v <= 1.0:
                    pts.append(tuple(round(q) for q in pt(u, v)))
            if len(pts) > 1:
                col = net_ramp[3 if sign == 1 else 5]
                for a, b in zip(pts, pts[1:]):
                    d.line((a, b), fill=col, width=1)

    # Thick braided headrope (lit top + shaded underside) and footrope.
    head = [tuple(round(q) for q in pt(i / 24.0, 0.0)) for i in range(25)]
    foot = [tuple(round(q) for q in pt(i / 24.0, 1.0)) for i in range(25)]
    for a, b in zip(head, head[1:]):
        d.line(((a[0], a[1] + 1), (b[0], b[1] + 1)), fill=net_ramp[6], width=1)
        d.line((a, b), fill=net_ramp[1], width=1)
    for a, b in zip(foot, foot[1:]):
        d.line((a, b), fill=net_ramp[5], width=1)

    # Carved cork / wood / painted floats strung along the headrope.
    n_floats = 6 if span > 75 else 5
    for i in range(n_floats):
        u = 0.08 + (i / max(1, n_floats - 1)) * 0.84
        fx, fy = pt(u, 0.0)
        fx, fy = round(fx), round(fy)
        for dy in (-1, 0, 1):
            for dx in (-2, -1, 0, 1, 2):
                if abs(dx) == 2 and abs(dy) == 1:
                    continue
                idx = 1 if (dy == -1 and dx <= 0) else 2 if dy <= 0 else 4 if dx <= 0 else 5
                c.p(fx + dx, fy + dy, float_ramp[idx])

    # Small stone / lead sinkers dangling along the footrope.
    for i in range(n_floats - 1):
        u = 0.14 + (i / max(1, n_floats - 2)) * 0.72
        sx, sy = pt(u, 1.0)
        sx, sy = round(sx), round(sy)
        c.p(sx, sy + 1, sinker_ramp[3])
        c.p(sx + 1, sy + 1, sinker_ramp[5])
        c.p(sx, sy + 2, sinker_ramp[6])


def _draw_seine_pegs(c, variant, cx, by):
    wood = OAK if variant in (0, 2) else CEDAR if variant == 1 else PINE
    net_r = (HEMP, NET_OLIVE, NET_TAR, HEMP_PALE)[variant]
    float_r = (CORK, FLOAT_RED, GOURD, CORK)[variant]
    pegs = (
        [(16, 29, -1.0), (48, 26, 0.5), (80, 27, -0.5), (108, 30, 1.0)],
        [(18, 32, -1.2), (62, 28, 0.4), (105, 31, 1.4)],
        [(15, 28, -0.8), (47, 27, 0.2), (79, 26, -0.3), (110, 29, 0.9)],
        [(18, 25, -0.5), (50, 24, 0.3), (82, 25, -0.2), (108, 26, 0.6)],
    )[variant]

    # Ground shadows under stakes.
    for px, ph, lean in pegs:
        _ground_shadow_ellipse(c, px + 2, by + 1, 5.5, 2.2, 86)
        _wood_post(c, px, by - ph, 4, ph + 1, wood, seed=px + variant, lean=lean)
        # Rope lashing near top of stake.
        top_x = px + round(lean)
        for dx in range(-1, 5):
            c.p(top_x + dx, by - ph + 4, HEMP[2 if dx < 2 else 5])

    x0 = pegs[0][0] + 2
    x1 = pegs[-1][0] + 1
    top_base = by - pegs[0][1] + 5

    if variant == 2:
        # Two deep catenary swags between outer and middle stakes.
        def y_top(u):
            return top_base + 5.5 * abs(math.sin(u * math.tau))
        def drop(u):
            return 15 + 3 * math.sin(u * math.pi)
    elif variant == 1:
        def y_top(u):
            return top_base + 7.0 * math.sin(u * math.pi) - u * 2.5
        def drop(u):
            return 17 - 4 * u
    else:
        def y_top(u):
            return top_base + 6.0 * math.sin(u * math.pi)
        def drop(u):
            return 16 + 2.5 * math.sin(u * math.pi)

    _draw_net_mesh(c, x0, x1, y_top, drop, net_r, float_r, STONE, seed=variant * 19 + 5, gather_right=(variant == 1))

    # Ground-level companion details per variant.
    if variant == 0:
        draw_rope_coil(c, 36, by - 2, rings=3, rope=HEMP)
        draw_rope_coil(c, 88, by - 1, rings=2, rope=HEMP)
    elif variant == 1:
        draw_catch_basket(c, 32, by + 1, rx=9, height=10, basket=BASKET, with_fish=False)
        draw_rope_coil(c, 92, by - 1, rings=2, rope=NET_OLIVE)
    elif variant == 2:
        draw_bucket(c, 94, by + 1, r_top=6, h=9, wood=OAK)
        draw_rope_coil(c, 34, by - 1, rings=3, rope=NET_TAR)
    else:
        draw_rope_coil(c, 62, by - 1, rings=3, rope=HEMP_PALE)
        _pebble(c, 32, by, 3, 2)
        _pebble(c, 96, by, 3, 2)


def _draw_net_rail(c, variant, cx, by):
    wood = OAK if variant in (0, 1) else PINE if variant == 2 else CEDAR
    net_r = (HEMP, NET_TAR, HEMP_PALE, NET_OLIVE)[variant]
    float_r = (CORK, FLOAT_RED, CORK, GOURD)[variant]
    height = 48 if variant != 3 else 44
    for px in (16, 108):
        _ground_shadow_ellipse(c, px + 2, by + 1, 6, 2.5, 86)
        _wood_post(c, px, by - height, 5, height + 1, wood, seed=px + variant)
    # Horizontal top rail (with slight weathered end overhang).
    _wood_plank(c, 13, by - height + 2, 103, 4, wood, seed=31 + variant)

    def y_top(u):
        return by - height + 6 + (4.5 if variant != 1 else 7.0) * math.sin(u * math.pi)
    def drop(u):
        return (28 if variant != 1 else 25 - 6 * u) + 3 * math.sin(u * math.pi)

    _draw_net_mesh(c, 20, 107, y_top, drop, net_r, float_r, STONE, seed=variant * 29 + 7, gather_right=(variant == 1))

    if variant == 0:
        draw_rope_coil(c, 38, by - 1, rings=3, rope=HEMP)
        draw_rope_coil(c, 84, by - 1, rings=2, rope=HEMP)
    elif variant == 1:
        draw_bucket(c, 36, by + 1, r_top=7, h=11, wood=OAK)
        draw_rope_coil(c, 88, by - 1, rings=2, rope=NET_TAR)
    elif variant == 2:
        draw_catch_basket(c, 88, by + 1, rx=9, height=10, basket=BASKET, with_fish=True)
        draw_rope_coil(c, 38, by - 1, rings=2, rope=HEMP_PALE)
    else:
        draw_clay_pot(c, 34, by + 1, r_body=7, height=12, clay=CLAY_POT, fill_kind='brine')
        draw_rope_coil(c, 86, by - 1, rings=3, rope=NET_OLIVE)


def _draw_net_frame(c, variant, cx, by):
    from art.front_house import brace
    wood = OAK if variant in (0, 1) else PINE if variant == 2 else CEDAR
    net_r = (HEMP, NET_TAR, HEMP_PALE, NET_OLIVE)[variant]
    float_r = (CORK, FLOAT_RED, CORK, GOURD)[variant]
    for px in (14, 108):
        _ground_shadow_ellipse(c, px + 3, by + 1, 6.5, 2.6, 86)
        _wood_post(c, px, by - 55, 5, 56, wood, seed=px + variant)
    _wood_plank(c, 10, by - 58, 108, 5, wood, seed=41 + variant)
    brace(c, 19, by - 35, 34, by - 53, wood, 3)
    brace(c, 92, by - 53, 108, by - 35, wood, 3)

    def y_top(u):
        return by - 52 + 5.0 * math.sin(u * math.pi)
    def drop(u):
        return 30 + (3.0 * math.sin(u * math.pi) if variant != 1 else -7.0 * u)

    _draw_net_mesh(c, 22, 104, y_top, drop, net_r, float_r, IRON, seed=variant * 37 + 11, gather_right=(variant == 1))
    # Hemp lashing loops suspending the headrope from the upper timber beam.
    for u in (0.04, 0.28, 0.50, 0.72, 0.96):
        lx = round(22 + u * 82)
        ly = round(y_top(u))
        for yy in range(by - 57, ly + 1):
            c.p(lx, yy, HEMP[2 if yy < by - 54 else 4])
            c.p(lx + 1, yy, HEMP[5])

    if variant == 0:
        draw_rope_coil(c, 42, by - 1, rings=3, rope=HEMP)
        draw_catch_basket(c, 86, by + 1, rx=9, height=10, basket=BASKET, with_fish=False)
    elif variant == 1:
        draw_bucket(c, 36, by + 1, r_top=7, h=11, wood=OAK)
        draw_rope_coil(c, 86, by - 1, rings=3, rope=NET_TAR)
    elif variant == 2:
        draw_rope_coil(c, 38, by - 1, rings=2, rope=HEMP_PALE)
        draw_rope_coil(c, 88, by - 1, rings=2, rope=HEMP_PALE)
    else:
        draw_bucket(c, 88, by + 1, r_top=7, h=11, wood=CEDAR)
        draw_catch_basket(c, 38, by + 1, rx=9, height=10, basket=BASKET, with_fish=True)


def draw_fishing_worksite(style, info):
    parsed = parse_fishing_style(style)
    if not parsed:
        return None
    base, variant = parsed
    c = C(128, 92)
    cx, by = 64, 80
    if base == 'fish-mat':
        _draw_fish_mat(c, variant, cx, by)
    elif base == 'fish-trays':
        _draw_fish_trays(c, variant, cx, by)
    elif base == 'fish-table':
        _draw_fish_table(c, variant, cx, by)
    elif base == 'seine-pegs':
        _draw_seine_pegs(c, variant, cx, by)
    elif base == 'net-rail':
        _draw_net_rail(c, variant, cx, by)
    elif base == 'net-frame':
        _draw_net_frame(c, variant, cx, by)
    consolidate(c, rare=4)
    c.im.info['anchor'] = [cx, by]
    info.update(x0=0, W=128, base=by, door_x=cx, door_h=44, doorless=True)
    return c.im


if __name__ == '__main__':
    from art.front_review import sheet
    out = Path(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/coast-review/wave-c2/fishing-sheet.png')
    out.parent.mkdir(parents=True, exist_ok=True)
    items = []
    for base in FISHING_BASES:
        for v in range(VARIANTS):
            st = base if v == 0 else f'{base}-{v}'
            info = {}
            im = draw_fishing_worksite(st, info)
            # Crop tightly around the rendered prop + padding for clean 3x inspection.
            bbox = im.getbbox()
            if bbox:
                x0, y0, x1, y1 = bbox
                im = im.crop((max(0, x0 - 4), max(0, y0 - 4), min(im.width, x1 + 4), min(im.height, y1 + 4)))
            im = im.resize((im.width * 2, im.height * 2), Image.Resampling.NEAREST)
            items.append((st, im))
    sheet(items, str(out), columns=4)
    print(f'Wrote {len(items)} fishing worksite variants to {out}')
