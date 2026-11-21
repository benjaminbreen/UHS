"""Handcrafted pixel-art outdoor craft-yard equipment with 4 procedural variants
across 8 non-fishing historical craft families (32 sprites total):

  - dye-racks        (dyehouses, fulleries, indigo & chintz yards)
  - pottery-rack     (potteries, dragon kilns, open-firing yards)
  - tanner-rack      (tanneries & hide-curing yards)
  - loom-frame       (weaving sheds, strip looms, warp walks)
  - smith-bench      (smithies, bloomeries, metalworking yards)
  - carpenter-bench  (carpentry, wheelwright, cooperage, boatwright yards)
  - mason-bench      (stonemason, limeworks, brick & quarrying yards)
  - press-yard       (oil presses, brewhouses, bakehouses, sugar works)

Run standalone to inspect all 32 variants:
    .venv/bin/python scripts/art/front_crafts.py artifacts/coast-review/wave-c2-crafts/crafts-sheet.png
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
from art.front_fishing import (
    OAK, PINE, CEDAR, STONE, IRON, SALT, HEMP, HEMP_PALE, BASKET, CLAY_POT, CLAY_DARK,
    _blend, _darken, _ground_shadow_ellipse, _wood_post, _wood_plank, _pebble,
    draw_clay_pot, draw_bucket, draw_rope_coil,
)

# Natural historical dye, metal, clay, stone, and hide ramps on the shared OKLCh ladder.
INDIGO = ramp(252, .085, lift=-.16)
WOAD = ramp(232, .072, lift=-.08)
MADDER = ramp(24, .112, lift=-.07)
COCHINEAL = ramp(8, .118, lift=-.09)
SAFFRON = ramp(78, .115, lift=.00)
WELD = ramp(94, .092, lift=-.04)
TEAL_DYE = ramp(188, .082, lift=-.10)
LINEN = ramp(86, .024, lift=.03)

CLAY_RAW = ramp(52, .042, lift=-.10)
CLAY_RED = ramp(36, .090, lift=-.08)
CELADON = ramp(155, .048, lift=.00)
COBALT = ramp(248, .095, lift=-.12)
EMBER = ramp(48, .155, lift=.02)
COAL = ramp(260, .018, lift=-.24)
COPPER = ramp(44, .096, lift=-.06)
HIDE_RAW = ramp(72, .052, lift=.00)
HIDE_TAN = ramp(54, .078, lift=-.07)
HIDE_RED = ramp(26, .098, lift=-.10)
LIMESTONE = RAMPS['limestone']
SANDSTONE = RAMPS['sandstone']
MARBLE = RAMPS['marble']
SHAVING = ramp(78, .062, lift=.04)
WATER_DARK = ramp(210, .050, lift=-.18)
OIL_GOLD = ramp(82, .095, lift=-.10)

# Material ramps for papermaking, ropewalks, bronze foundries, soapworks, sericulture & charcoal/sawpits.
PAPER = ramp(84, .022, lift=.08)
BRONZE = ramp(68, .092, lift=-.09)
BRASS = ramp(82, .112, lift=-.02)
VERDIGRIS = ramp(172, .068, lift=-.05)
SOAP_IVORY = ramp(92, .028, lift=.05)
SOAP_OLIVE = ramp(112, .052, lift=.00)
SILK_WHITE = ramp(90, .012, lift=.10)
SILK_GOLD = ramp(84, .118, lift=.02)
MULBERRY = ramp(134, .095, lift=-.08)
BAMBOO = ramp(98, .072, lift=-.02)
TAR = ramp(48, .018, lift=-.24)
TURF = ramp(116, .048, lift=-.16)
SMOKE_COL = ramp(230, .015, lift=.06)

CRAFT_BASES = (
    'dye-racks',
    'pottery-rack',
    'tanner-rack',
    'loom-frame',
    'smith-bench',
    'carpenter-bench',
    'mason-bench',
    'press-yard',
    'paper-yard',
    'ropewalk',
    'foundry-yard',
    'soap-yard',
    'silk-yard',
    'charcoal-yard',
)
CRAFT_VARIANTS = 4


def parse_craft_style(style):
    if style in CRAFT_BASES:
        return style, 0
    for base in CRAFT_BASES:
        if style.startswith(base + '-'):
            tail = style[len(base) + 1:]
            if tail.isdigit():
                return base, int(tail)
    return None


def _draped_cloth(c, x0, y_top, w, h, cloth_r, border_r=None, seed=0, sway=0.0):
    """Hanging folded bolt of cloth with vertical pleat shading, wind sway, and patterned hem."""
    for y in range(y_top, y_top + h):
        v = (y - y_top) / max(1, h - 1)
        ox = round(sway * (v ** 1.4))
        for dx in range(w):
            u = dx / max(1, w - 1)
            # Bottom hem undulates gently with the folds.
            hem_wave = round(math.sin(u * math.tau * 1.5 + seed) * 1.2)
            if y > y_top + h - 2 + hem_wave:
                continue
            pleat = math.sin(u * math.tau * 2.2 + seed)
            xx = x0 + dx + ox
            is_border = border_r is not None and (h - 5 <= (y - y_top) <= h - 3)
            r = border_r if is_border else cloth_r
            if y == y_top:
                col = r[1 if pleat >= -0.2 else 3]
            elif dx == 0:
                col = r[2 if pleat > 0 else 4]
            elif dx == w - 1 or y >= y_top + h - 2 + hem_wave:
                col = r[6 if dx == w - 1 else 5]
            elif pleat > 0.42:
                col = r[1]
            elif pleat > -0.15:
                col = r[2 if v < 0.72 else 3]
            elif pleat > -0.62:
                col = r[4]
            else:
                col = r[5]
            c.p(xx, y, col)
    # Damp dye-drip dark stain on the ground directly beneath the hem.
    _ground_shadow_ellipse(c, x0 + w * 0.5 + sway, y_top + h + 7, w * 0.46, 2.4, 54)


def _dye_vat_small(c, cx, by, r_top=8, h=11, liquid=INDIGO, wood=OAK):
    """Staved wooden dye tub with iron hoops, bright dye surface, and leaning stirring pole."""
    _ground_shadow_ellipse(c, cx + 1, by + 1, r_top * 0.95, 3.0, 82)
    for k in range(h + 1):
        w = r_top * (0.82 + 0.18 * (k / max(1, h)))
        iw = int(round(w))
        hoop = k in (2, h - 2)
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            curve = round(math.sqrt(max(0.0, 1.0 - u * u)) * 2.0)
            yy = by - k + curve - 1
            if hoop:
                c.p(cx + dx, yy, IRON[3 if u < 0 else 6])
            else:
                seam = (dx + iw) % 3 == 0
                idx = 6 if abs(u) > 0.86 or k == 0 else 5 if seam else 2 if u < -0.2 else 3 if u < 0.35 else 4
                c.p(cx + dx, yy, wood[idx])
    rw = r_top - 1
    rh = max(2, round(rw * 0.38))
    ry = by - h - 1
    for dy in range(-rh - 1, rh + 2):
        for dx in range(-rw - 1, rw + 2):
            d = (dx / max(1.0, rw)) ** 2 + (dy / max(1.0, rh)) ** 2
            if d > 1.18:
                continue
            if d > 0.74:
                c.p(cx + dx, ry + dy, wood[1 if dx < 1 else 4])
            else:
                glint = dy == 0 and -2 <= dx <= 1
                c.p(cx + dx, ry + dy, liquid[1 if glint else 3 if dy < 0 else 4])
    # Leaning wooden stirring stick stained at the dipped end.
    for i in range(11):
        c.p(cx + 2 + i // 2, ry - i, wood[2 if i > 3 else 5] if i > 2 else liquid[2])
        c.p(cx + 3 + i // 2, ry - i, wood[5] if i > 2 else liquid[4])


def _yarn_basket(c, cx, by, yarn_r=MADDER, yarn_r2=SAFFRON):
    """Coiled basket overflowing with skeins of brightly dyed yarn."""
    _ground_shadow_ellipse(c, cx + 1, by + 1, 9.0, 3.0, 80)
    for k in range(10):
        w = 8.5 * (0.76 + 0.24 * math.sin((k / 9.0) * math.pi * 0.7))
        iw = int(round(w))
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            curve = round(math.sqrt(max(0.0, 1.0 - u * u)) * 2.0)
            yy = by - k + curve - 1
            idx = 6 if abs(u) > 0.85 or k == 0 else 4 if k % 3 == 0 else 2 if u < -0.15 else 3 if u < 0.4 else 4
            c.p(cx + dx, yy, BASKET[idx])
    # Rounded skeins of yarn heaped above the basket lip.
    for ox, oy, rx, ry, r in ((-3, -10, 4, 3, yarn_r), (3, -10, 4, 3, yarn_r2), (0, -12, 4, 2, yarn_r)):
        for dy in range(-ry, ry + 1):
            for dx in range(-rx, rx + 1):
                if (dx / rx) ** 2 + (dy / ry) ** 2 <= 1.0:
                    c.p(cx + ox + dx, by + oy + dy, r[1 if dy < 0 and dx <= 0 else 2 if dy <= 0 else 4])
    for dx in range(-8, 9):
        c.p(cx + dx, by - 9, BASKET[1 if dx < 2 else 4])
        c.p(cx + dx, by - 8, BASKET[5])


def _small_pot(c, cx, by, r_body=5, h=8, clay=CLAY_POT, glaze=None, painted=False):
    """Small shelf or drying-board pot with normal shading and optional cobalt/terracotta band."""
    for k in range(h + 1):
        t = k / max(1, h)
        w = r_body * (0.65 + 0.35 * math.sin(t * math.pi * 0.85 + 0.2))
        if t > 0.82:
            w = r_body * (0.68 + (t - 0.82) * 0.9)
        iw = max(1, int(round(w)))
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            r = glaze if (glaze and k > 2) else clay
            if abs(u) > 0.85 or k == 0:
                idx = 6 if (u > 0 or k == 0) else 5
            elif painted and k in (h // 2, h // 2 + 1) and (dx % 2 == 0):
                c.p(cx + dx, by - k, COBALT[3 if u < 0.2 else 5])
                continue
            elif u < -0.25:
                idx = 1
            elif u < 0.22:
                idx = 2
            elif u < 0.58:
                idx = 3
            else:
                idx = 4
            c.p(cx + dx, by - k, r[idx])
    # Tiny dark mouth slit on top.
    for dx in range(-max(1, r_body // 2), max(1, r_body // 2) + 1):
        c.p(cx + dx, by - h, clay[6])


def _draw_dye_racks(c, variant, cx, by):
    wood = OAK if variant in (0, 2) else CEDAR if variant == 1 else PINE
    h = 46 if variant != 3 else 42
    for px in (16, 108):
        _ground_shadow_ellipse(c, px + 2, by + 1, 6, 2.4, 86)
        _wood_post(c, px, by - h, 5, h + 1, wood, seed=px + variant)
    _wood_plank(c, 12, by - h + 2, 104, 4, wood, seed=17 + variant)
    # Crossbar lower rail on variants 1 and 3.
    if variant in (1, 3):
        _wood_plank(c, 20, by - 14, 88, 3, wood, seed=29 + variant)

    palettes = [
        [(INDIGO, LINEN, 22, 30, 1.5), (MADDER, SAFFRON, 20, 28, 2.0), (WOAD, None, 21, 31, 1.0)],
        [(SAFFRON, MADDER, 21, 29, -1.5), (TEAL_DYE, LINEN, 22, 27, -1.0), (COCHINEAL, SAFFRON, 20, 30, -2.0)],
        [(INDIGO, None, 24, 32, 2.2), (INDIGO, WOAD, 23, 30, 1.8), (LINEN, INDIGO, 20, 28, 1.2)],
        [(MADDER, LINEN, 22, 26, -1.2), (WELD, None, 21, 28, -1.8), (LINEN, MADDER, 21, 25, -1.0)],
    ][variant]

    x_cursor = 24
    for i, (r_main, r_bord, w, ch, sway) in enumerate(palettes):
        _draped_cloth(c, x_cursor, by - h + 4, w, ch, r_main, r_bord, seed=variant * 13 + i * 7, sway=sway)
        x_cursor += w + 5

    # Ground-level dye vats & pigment baskets.
    if variant == 0:
        _dye_vat_small(c, 32, by + 1, r_top=8, h=11, liquid=INDIGO, wood=OAK)
        _yarn_basket(c, 92, by + 1, yarn_r=MADDER, yarn_r2=SAFFRON)
    elif variant == 1:
        _dye_vat_small(c, 92, by + 1, r_top=8, h=11, liquid=COCHINEAL, wood=CEDAR)
        _yarn_basket(c, 34, by + 1, yarn_r=SAFFRON, yarn_r2=TEAL_DYE)
    elif variant == 2:
        _dye_vat_small(c, 34, by + 1, r_top=9, h=12, liquid=INDIGO, wood=OAK)
        _dye_vat_small(c, 88, by + 1, r_top=7, h=10, liquid=WOAD, wood=OAK)
    else:
        _dye_vat_small(c, 64, by + 1, r_top=8, h=11, liquid=MADDER, wood=PINE)
        draw_clay_pot(c, 34, by + 1, r_body=7, height=11, clay=CLAY_POT, fill_kind='brine')


def _draw_pottery_rack(c, variant, cx, by):
    wood = OAK if variant in (0, 2) else CEDAR if variant == 1 else PINE
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 74)
    # Two-tier drying shelf rack on left + clay worktable / wheel on right (flipped on variant 1).
    left_shelf = variant != 1
    sx = 18 if left_shelf else 56
    wx = 82 if left_shelf else 20

    # Drying shelf uprights & two planks loaded with greenware / glazed pots.
    for px in (sx, sx + 52):
        _wood_post(c, px, by - 36, 4, 37, wood, seed=px + variant)
        _ground_shadow_ellipse(c, px + 2, by + 1, 4.5, 2.0, 82)
    for sy in (by - 28, by - 14):
        _wood_plank(c, sx - 2, sy, 60, 3, wood, seed=sy + variant)

    # Populated ceramic wares per regional/craft variant.
    if variant == 0:
        # Terracotta & raw greenware amphorae & bowls.
        for dx, rb, ph, cl in ((8, 5, 9, CLAY_POT), (20, 4, 7, CLAY_RAW), (32, 6, 10, CLAY_POT), (45, 5, 8, CLAY_RAW)):
            _small_pot(c, sx + dx, by - 29, rb, ph, cl)
        for dx, rb, ph, cl in ((10, 6, 9, CLAY_RAW), (24, 5, 8, CLAY_POT), (38, 5, 9, CLAY_RAW), (49, 4, 6, CLAY_POT)):
            _small_pot(c, sx + dx, by - 15, rb, ph, cl)
    elif variant == 1:
        # Glazed celadon & blue-and-white stoneware vessels.
        for dx, rb, ph, gl, pt in ((8, 5, 9, CELADON, False), (21, 5, 10, SALT, True), (35, 6, 9, CELADON, False), (48, 4, 8, SALT, True)):
            _small_pot(c, sx + dx, by - 29, rb, ph, CLAY_RAW, glaze=gl, painted=pt)
        for dx, rb, ph, gl, pt in ((10, 5, 8, SALT, True), (24, 6, 9, CELADON, False), (39, 5, 8, SALT, True)):
            _small_pot(c, sx + dx, by - 15, rb, ph, CLAY_RAW, glaze=gl, painted=pt)
    elif variant == 2:
        # Red-slip & painted Mesoamerican / Mediterranean wares.
        for dx, rb, ph, cl, pt in ((9, 6, 8, CLAY_RED, False), (23, 5, 9, CLAY_POT, True), (36, 5, 8, CLAY_RED, False), (48, 4, 7, CLAY_DARK, False)):
            _small_pot(c, sx + dx, by - 29, rb, ph, cl, painted=pt)
        for dx, rb, ph, cl in ((11, 5, 8, CLAY_DARK), (25, 6, 9, CLAY_RED), (41, 5, 8, CLAY_POT)):
            _small_pot(c, sx + dx, by - 15, rb, ph, cl)
    else:
        # Low-fired dark & ochre household jars + kiln faggot wood bundle below.
        for dx, rb, ph, cl in ((8, 5, 9, CLAY_DARK), (21, 6, 9, CLAY_POT), (35, 5, 8, CLAY_RAW), (47, 5, 9, CLAY_DARK)):
            _small_pot(c, sx + dx, by - 29, rb, ph, cl)
        for dx, rb, ph, cl in ((12, 5, 8, CLAY_RAW), (27, 5, 8, CLAY_RAW), (42, 6, 9, CLAY_POT)):
            _small_pot(c, sx + dx, by - 15, rb, ph, cl)

    # Companion wedging bench / potter's wheel / large amphora beside the rack.
    if variant in (0, 1):
        # Potter's kick-wheel: vertical spindle, lower heavy wooden flywheel, upper wheelhead with fresh clay pot.
        _ground_shadow_ellipse(c, wx + 13, by + 1, 13, 3.8, 82)
        for lx in (wx + 2, wx + 22):
            _wood_post(c, lx, by - 17, 4, 18, wood, seed=lx)
        # Heavy flywheel disc near bottom.
        for dy in range(-2, 3):
            for dx in range(-10, 11):
                if (dx / 10.0) ** 2 + (dy / 2.6) ** 2 <= 1.0:
                    c.p(wx + 13 + dx, by - 5 + dy, OAK[2 if dy < 0 else 4 if dy == 0 else 5])
        _wood_post(c, wx + 12, by - 20, 3, 18, OAK, seed=7)
        # Upper wheelhead + fresh thrown pot & slip bowl.
        for dy in range(-2, 3):
            for dx in range(-8, 9):
                if (dx / 8.0) ** 2 + (dy / 2.4) ** 2 <= 1.0:
                    c.p(wx + 13 + dx, by - 19 + dy, PINE[1 if dy < 0 else 3 if dy == 0 else 5])
        _small_pot(c, wx + 13, by - 20, 5, 10, CLAY_RAW)
        draw_bucket(c, wx + 28 if left_shelf else wx - 4, by + 1, r_top=5, h=8, wood=OAK)
    else:
        # Clay wedging bench with lump of wet raw clay + tall fired storage jar.
        for lx in (wx + 2, wx + 24):
            _wood_post(c, lx, by - 15, 4, 16, wood, seed=lx)
        _wood_plank(c, wx, by - 16, 30, 4, PINE, seed=variant + 9)
        # Wet raw clay mound on bench.
        for dy in range(-5, 1):
            w = round(7 * math.sqrt(max(0.0, 1.0 - ((dy + 0.5) / 5.5) ** 2)))
            for dx in range(-w, w + 1):
                c.p(wx + 11 + dx, by - 17 + dy, CLAY_RAW[1 if (dx < 0 and dy < -2) else 2 if dy < -1 else 4])
        draw_clay_pot(c, wx + 25 if left_shelf else wx + 28, by + 1, r_body=8, height=14, clay=CLAY_RED if variant == 2 else CLAY_POT, fill_kind='empty')


def _draw_tanner_rack(c, variant, cx, by):
    wood = OAK if variant in (0, 2) else CEDAR if variant == 1 else PINE
    hide_r = (HIDE_RAW, HIDE_TAN, HIDE_RED, HIDE_RAW)[variant]
    hide_r2 = (HIDE_TAN, HIDE_RAW, SAFFRON, HIDE_TAN)[variant]
    _ground_shadow_ellipse(c, cx, by + 1, 48, 4.8, 74)

    # Timber stretching frame with two bays (or single wide frame + leaning fleshing beam).
    for px in (16, 66):
        _wood_post(c, px, by - 44, 5, 45, wood, seed=px + variant)
        _ground_shadow_ellipse(c, px + 2, by + 1, 5.5, 2.2, 86)
    _wood_plank(c, 14, by - 43, 59, 4, wood, seed=3 + variant)
    _wood_plank(c, 16, by - 9, 55, 3, wood, seed=8 + variant)

    # Organic stretched hide laced taut inside the frame with corner hemp cords.
    hx, hy = 43, by - 26
    d = ImageDraw.Draw(c.im)
    pts = [
        (hx - 15, hy - 11), (hx - 4, hy - 13), (hx + 6, hy - 12), (hx + 16, hy - 10),
        (hx + 14, hy - 2), (hx + 18, hy + 5), (hx + 14, hy + 11), (hx + 4, hy + 9),
        (hx - 5, hy + 11), (hx - 15, hy + 9), (hx - 18, hy + 3), (hx - 14, hy - 3),
    ]
    # Taut radial lacing thongs from hide corners to wooden frame.
    anchors = [
        ((hx - 15, hy - 11), (20, by - 40)), ((hx + 16, hy - 10), (66, by - 40)),
        ((hx + 14, hy + 11), (66, by - 9)), ((hx - 15, hy + 9), (20, by - 9)),
        ((hx - 18, hy + 3), (20, by - 23)), ((hx + 18, hy + 5), (66, by - 21)),
        ((hx - 4, hy - 13), (38, by - 40)), ((hx + 6, hy - 12), (50, by - 40)),
    ]
    for a, b in anchors:
        d.line((a, b), fill=HEMP[3], width=1)
    d.polygon(pts, fill=hide_r[3], outline=hide_r[6])
    # Sculpted interior tension highlights & warm center shading.
    for yy in range(hy - 12, hy + 12):
        for xx in range(hx - 18, hx + 19):
            if c.g(xx, yy) == hide_r[3]:
                dist = math.hypot((xx - hx) / 16.0, (yy - hy) / 11.0)
                g = h2(xx // 3, yy // 3, variant * 11 + 5)
                if dist < 0.48 and xx <= hx + 4 and yy <= hy + 2:
                    c.p(xx, yy, hide_r[1 if g > 0.45 else 2])
                elif xx > hx + 5 or yy > hy + 4:
                    c.p(xx, yy, hide_r[4 if g > 0.3 else 5])
                else:
                    c.p(xx, yy, hide_r[2 if g > 0.55 else 3])

    # Right side: leaning fleshing beam + soaking tub OR folded stack of cured leather hides.
    if variant in (0, 2):
        # Leaning fleshing beam on two front legs + bark soaking tub.
        _wood_post(c, 84, by - 16, 4, 17, wood, seed=19)
        for i in range(24):
            bx = round(84 + i * 0.65)
            byy = round(by - 22 + i * 0.92)
            for dx in range(6):
                c.p(bx + dx, byy, PINE[1 if dx < 2 else 2 if dx < 4 else 4 if dx == 4 else 5])
        # Draped hide folded across the beam.
        _draped_cloth(c, 87, by - 18, 12, 11, hide_r2, None, seed=variant + 3, sway=0.5)
        _dye_vat_small(c, 108, by + 1, r_top=8, h=11, liquid=HIDE_TAN if variant == 0 else HIDE_RED, wood=OAK)
    else:
        # Bark soaking vat + wooden trestle draped with folded tanned hides.
        _dye_vat_small(c, 84, by + 1, r_top=8, h=11, liquid=HIDE_TAN, wood=wood)
        for lx in (98, 114):
            _wood_post(c, lx, by - 18, 4, 19, wood, seed=lx)
        _wood_plank(c, 96, by - 18, 22, 3, wood, seed=5)
        _draped_cloth(c, 99, by - 17, 16, 15, hide_r2, None, seed=variant * 7, sway=0.8)


def _draw_loom_frame(c, variant, cx, by):
    wood = OAK if variant in (0, 3) else CEDAR if variant == 1 else PINE
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 74)

    # Variants 0 & 2: outdoor horizontal warping/weaving frame with bright patterned cloth in progress.
    # Variants 1 & 3: upright/strip-loom frame with hanging weighted warp + yarn baskets.
    if variant in (0, 2):
        # Sturdy horizontal loom / warping frame seen obliquely with taut warp & bright woven cloth.
        for lx in (20, 98):
            _wood_post(c, lx, by - 28, 5, 29, wood, seed=lx + variant)
            _ground_shadow_ellipse(c, lx + 2, by + 1, 5.5, 2.2, 86)
        _wood_plank(c, 18, by - 29, 88, 4, wood, seed=11 + variant)
        _wood_plank(c, 18, by - 10, 88, 4, wood, seed=15 + variant)
        # Heddle bar in the middle.
        _wood_plank(c, 22, by - 20, 80, 2, PINE, seed=21)
        # Stretched warp threads on upper half + patterned woven cloth on lower half!
        stripe_set = (
            [COCHINEAL, SAFFRON, INDIGO, LINEN] if variant == 0 else [INDIGO, LINEN, MADDER, LINEN]
        )
        for xx in range(26, 98):
            r_col = stripe_set[((xx - 26) // 4) % len(stripe_set)]
            # Upper warp threads (every 2nd px so background shows cleanly through).
            if xx % 2 == 0:
                for yy in range(by - 25, by - 20):
                    c.p(xx, yy, LINEN[1 if yy % 2 == 0 else 3])
            # Woven patterned cloth from heddle bar down to cloth beam.
            for yy in range(by - 18, by - 10):
                weft = (yy % 2 == 0)
                c.p(xx, yy, r_col[1 if (weft and (xx % 4 < 2)) else 2 if weft else 4])
        # Wooden boat shuttle resting on the lower beam.
        for dx in range(-5, 6):
            c.p(60 + dx, by - 12, OAK[2 if abs(dx) < 3 else 5])
        _yarn_basket(c, 34, by + 1, yarn_r=stripe_set[0], yarn_r2=stripe_set[1])
        _yarn_basket(c, 86, by + 1, yarn_r=stripe_set[2], yarn_r2=stripe_set[3])
    else:
        # Upright tall weaving loom / West African strip-loom frame with weighted warp & vibrant kente/plaid bands.
        for lx in (24, 78):
            _wood_post(c, lx, by - 48, 5, 49, wood, seed=lx + variant)
            _ground_shadow_ellipse(c, lx + 2, by + 1, 5.5, 2.2, 86)
        _wood_plank(c, 20, by - 49, 66, 4, wood, seed=3 + variant)
        _wood_plank(c, 24, by - 17, 58, 3, wood, seed=7 + variant)
        _wood_plank(c, 26, by - 34, 54, 2, PINE, seed=13)
        band_set = [SAFFRON, MADDER, WELD, INDIGO] if variant == 1 else [MADDER, LINEN, WOAD, LINEN]
        # Vertical warp & richly patterned woven cloth hanging down.
        for xx in range(31, 76):
            if xx % 2 == 0:
                for yy in range(by - 45, by - 34):
                    c.p(xx, yy, LINEN[2 if yy % 2 == 0 else 3])
            for yy in range(by - 32, by - 17):
                bi = ((yy - (by - 32)) // 3 + ((xx - 31) // 6)) % len(band_set)
                r = band_set[bi]
                c.p(xx, yy, r[1 if (xx % 3 == 0) else 2 if (yy % 2 == 0) else 4])
        # Hanging stone loom weights below the cloth beam.
        for wx in range(34, 74, 7):
            c.p(wx, by - 14, HEMP[3])
            c.p(wx, by - 13, STONE[2]); c.p(wx + 1, by - 13, STONE[4])
            c.p(wx, by - 12, STONE[5]); c.p(wx + 1, by - 12, STONE[6])
        # Yarn baskets + wooden bench on right.
        _yarn_basket(c, 98, by + 1, yarn_r=band_set[0], yarn_r2=band_set[1])
        draw_clay_pot(c, 14, by + 1, r_body=6, height=10, clay=CLAY_POT, fill_kind='empty')


def _draw_smith_bench(c, variant, cx, by):
    wood = OAK if variant != 2 else CEDAR
    _ground_shadow_ellipse(c, cx, by + 1, 46, 5.2, 80)

    # Center-left: massive iron-banded oak anvil block + horned iron anvil!
    ax = 44 if variant != 1 else 78
    _ground_shadow_ellipse(c, ax + 1, by + 1, 12, 3.6, 88)
    for k in range(13):
        w = 9.0 - (k / 13.0) * 1.0
        iw = int(round(w))
        hoop = k in (3, 10)
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            curve = round(math.sqrt(max(0.0, 1.0 - u * u)) * 2.0)
            yy = by - k + curve - 1
            if hoop:
                c.p(ax + dx, yy, IRON[2 if u < 0 else 5])
            else:
                seam = (dx + iw) % 3 == 0
                idx = 6 if abs(u) > 0.85 or k == 0 else 5 if seam else 2 if u < -0.2 else 3 if u < 0.35 else 4
                c.p(ax + dx, yy, OAK[idx])
    # Sculpted horned iron anvil seated on the block.
    ay = by - 15
    for dy in range(5):
        for dx in range(-6, 8):
            c.p(ax + dx, ay - dy, IRON[1 if (dy == 4 and dx < 4) else 2 if dy >= 3 else 4 if dx < 4 else 6])
    # Tapered bick/horn pointing left (or right on variant 1).
    hdir = -1 if variant != 1 else 1
    for i in range(1, 8):
        thick = max(1, 4 - i // 2)
        for dy in range(thick):
            c.p(ax + (6 if hdir > 0 else -6) + hdir * i, ay - 4 + dy, IRON[1 if dy == 0 else 3 if dy == 1 else 5])
    # Glowing hot iron bar resting across the anvil face on variants 0 and 2!
    if variant in (0, 2):
        for dx in range(-4, 6):
            c.p(ax + dx, ay - 5, EMBER[0 if abs(dx) < 2 else 2 if abs(dx) < 4 else 4])
            if abs(dx) < 3:
                c.p(ax + dx, ay - 6, EMBER[0 if dx == 0 else 1])

    # Quench trough with dark gleaming water & iron tongs!
    qx = 76 if variant != 1 else 26
    _ground_shadow_ellipse(c, qx + 14, by + 1, 16, 3.6, 82)
    _wood_plank(c, qx, by - 11, 28, 11, OAK, seed=variant + 5)
    for dx in range(2, 26):
        c.p(qx + dx, by - 10, WATER_DARK[1 if (8 <= dx <= 16) else 3])
        c.p(qx + dx, by - 9, WATER_DARK[2 if (10 <= dx <= 15) else 4])
    # Iron hoops on quench trough.
    for yy in (by - 8, by - 3):
        for dx in range(0, 28):
            c.p(qx + dx, yy, IRON[3 if dx < 12 else 6])
    # Long iron smithing tongs leaning out of the quench trough.
    for i in range(11):
        c.p(qx + 18 + i // 2, by - 10 - i, IRON[2 if i > 3 else 4])
        c.p(qx + 19 + i // 2, by - 10 - i, IRON[5])

    # Companion coal heap / tool rack / glowing brazier per variant.
    if variant in (0, 3):
        # Black charcoal heap + glowing ember brazier on left.
        bx = 22
        _ground_shadow_ellipse(c, bx, by + 1, 10, 3.2, 84)
        for dy in range(-8, 2):
            span = round(9 * math.sqrt(max(0.0, 1.0 - ((dy + 1) / 9.5) ** 2)))
            for dx in range(-span, span + 1):
                g = h2(bx + dx, by + dy, variant * 13 + 7)
                c.p(bx + dx, by + dy, COAL[2 if (dx < 0 and g > 0.65) else 4 if g > 0.35 else 6])
        if variant == 3:
            # Red-hot embers in a low iron coal-basket.
            for dx in range(-4, 5):
                c.p(bx + dx, by - 7, EMBER[0 if abs(dx) < 2 else 2 if abs(dx) < 4 else 4])
        else:
            c.p(bx - 1, by - 5, EMBER[2]); c.p(bx, by - 5, EMBER[1]); c.p(bx + 2, by - 4, EMBER[3])
    if variant in (1, 2):
        # Timber tool rack with hanging hammers, tongs & horseshoes.
        rx = 18 if variant == 2 else 94
        for px in (rx, rx + 20):
            _wood_post(c, px, by - 26, 3, 27, wood, seed=px)
        _wood_plank(c, rx - 1, by - 25, 24, 3, wood, seed=11)
        for tx in (rx + 5, rx + 11, rx + 16):
            for yy in range(by - 22, by - 11):
                c.p(tx, yy, OAK[3] if yy > by - 17 else IRON[2])
            c.p(tx - 1, by - 21, IRON[2]); c.p(tx + 1, by - 21, IRON[5])


def _draw_carpenter_bench(c, variant, cx, by):
    wood = OAK if variant in (0, 1) else CEDAR if variant == 2 else PINE
    board = PINE if variant != 3 else OAK
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 74)

    # Scattered pale curly wood shavings on the ground around the bench!
    rng = random.Random(variant * 101 + 17)
    for _ in range(18):
        sx = rng.randint(18, 108)
        sy = rng.randint(by - 3, by + 3)
        c.p(sx, sy, SHAVING[1 if rng.random() < 0.6 else 2])
        if rng.random() < 0.6:
            c.p(sx + 1, sy, SHAVING[3])

    # Heavy mortised carpenter's workbench / sawhorses with stacked planks.
    bx0 = 18 if variant != 1 else 44
    for lx in (bx0 + 4, bx0 + 54):
        _wood_post(c, lx, by - 20, 5, 21, wood, seed=lx + variant)
        _ground_shadow_ellipse(c, lx + 2, by + 1, 5.5, 2.2, 84)
    _wood_plank(c, bx0 + 7, by - 8, 49, 3, wood, seed=5 + variant)
    # Thick timber benchtop with vise & planed board on top.
    _wood_plank(c, bx0, by - 24, 64, 6, board, seed=13 + variant)
    # Timber beam being hewn/planed across the bench.
    _wood_plank(c, bx0 + 6, by - 27, 50, 4, PINE if variant != 0 else CEDAR, seed=29 + variant)
    # Wooden mallet & iron hand-saw resting on the bench!
    c.p(bx0 + 14, by - 29, OAK[2]); c.p(bx0 + 15, by - 29, OAK[1]); c.p(bx0 + 16, by - 29, OAK[4])
    c.p(bx0 + 14, by - 28, OAK[4]); c.p(bx0 + 15, by - 28, OAK[3]); c.p(bx0 + 16, by - 28, OAK[5])
    for i in range(4):
        c.p(bx0 + 17 + i, by - 28 + i // 2, PINE[2])
    # Handsaw blade glinting on the right end of bench.
    for i in range(10):
        c.p(bx0 + 36 + i, by - 28, IRON[1 if i % 2 == 0 else 2])
        c.p(bx0 + 36 + i, by - 27, IRON[4])
    c.p(bx0 + 46, by - 29, OAK[2]); c.p(bx0 + 47, by - 29, OAK[4]); c.p(bx0 + 47, by - 28, OAK[5])

    # Signature craft centerpiece beside the bench per variant!
    if variant in (0, 2):
        # Half-built spoked wooden wagon wheel leaning against a timber trestle!
        wx, wy = 98, by - 13
        _ground_shadow_ellipse(c, wx, by + 1, 13, 3.4, 82)
        d = ImageDraw.Draw(c.im)
        for rr, col in ((13, OAK[6]), (12, OAK[3]), (11, OAK[2]), (9, OAK[5])):
            d.ellipse((wx - rr, wy - rr, wx + rr, wy + rr), outline=col, width=1)
        for k in range(8):
            a = k * math.tau / 8.0 + variant * 0.2
            d.line((wx, wy, round(wx + math.cos(a) * 10), round(wy + math.sin(a) * 10)), fill=PINE[3 if k < 4 else 5], width=1)
        d.ellipse((wx - 3, wy - 3, wx + 3, wy + 3), fill=OAK[4], outline=IRON[2])
    elif variant == 1:
        # Cooper's oak barrel in iron truss hoops being assembled on the left!
        draw_bucket(c, 26, by + 1, r_top=9, h=17, wood=OAK)
        # Spare curved barrel staves leaning beside it.
        for sx in (13, 16):
            _wood_post(c, sx, by - 15, 2, 16, PINE, seed=sx, lean=-1.5)
    else:
        # Seasoned timber board stack on wooden stickers.
        sx = 88
        _ground_shadow_ellipse(c, sx + 12, by + 1, 14, 3.2, 78)
        for row in range(4):
            _wood_plank(c, sx, by - 4 - row * 4, 24, 3, PINE if row % 2 == 0 else OAK, seed=row * 7)


def _draw_mason_bench(c, variant, cx, by):
    stone = (LIMESTONE, SANDSTONE, STONE, MARBLE)[variant]
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 78)
    # Pale stone dust & carved chips scattered around the banker.
    rng = random.Random(variant * 89 + 31)
    for _ in range(22):
        sx = rng.randint(18, 108)
        sy = rng.randint(by - 3, by + 3)
        c.p(sx, sy, stone[1 if rng.random() < 0.55 else 2])
        if rng.random() < 0.45:
            c.p(sx + 1, sy, stone[3])

    # Dressed ashlar block being carved on heavy timber rollers/banker!
    bx = 22 if variant != 1 else 54
    for rx in (bx + 4, bx + 34):
        _wood_post(c, rx, by - 10, 6, 11, OAK, seed=rx + variant)
        _ground_shadow_ellipse(c, rx + 3, by + 1, 5.5, 2.2, 86)
    _wood_plank(c, bx, by - 12, 46, 3, OAK, seed=variant + 3)
    # Carved stone block seated on the banker.
    bw, bh = 38, 16
    for dy in range(bh):
        yy = by - 12 - bh + dy
        for dx in range(bw):
            xx = bx + 4 + dx
            g = h2(xx // 3, yy // 3, variant * 19 + 3)
            if dy < 3:
                col = stone[0 if g > 0.4 else 1]
            elif dy == bh - 1 or dx == bw - 1:
                col = stone[5]
            elif dx == 0:
                col = stone[1]
            elif variant == 3 and 5 <= dy <= 11 and (dx % 6 in (2, 3)):
                # Fluted marble relief / column fluting!
                col = stone[4 if dx % 6 == 3 else 1]
            else:
                col = stone[2 if g > 0.55 else 3 if g > 0.2 else 4]
            c.p(xx, yy, col)
    # Wooden mason's L-square & iron chisels resting atop the block!
    for dx in range(9):
        c.p(bx + 10 + dx, by - 12 - bh - 1, OAK[2])
    for dy in range(5):
        c.p(bx + 10, by - 12 - bh - 1 + dy, OAK[3])
    for cx0 in (bx + 26, bx + 31):
        for i in range(5):
            c.p(cx0 + i, by - 12 - bh - 1 + i // 3, IRON[1 if i < 2 else 4])

    # Companion dressed blocks / carved column drum / brick & mortar stack!
    ox = 78 if variant != 1 else 20
    if variant in (0, 3):
        # Fluted carved column drum standing upright beside the banker.
        _ground_shadow_ellipse(c, ox + 10, by + 1, 11, 3.4, 84)
        for k in range(16):
            for dx in range(-9, 10):
                u = dx / 9.0
                curve = round(math.sqrt(max(0.0, 1.0 - u * u)) * 2.0)
                flute = (dx + 9) % 3 == 0
                idx = 5 if abs(u) > 0.85 or k == 0 else 4 if flute and u > 0 else 1 if u < -0.2 else 2 if u < 0.35 else 4
                c.p(ox + 10 + dx, by - k + curve - 1, stone[idx])
        for dy in range(-2, 3):
            for dx in range(-8, 9):
                if (dx / 8.0) ** 2 + (dy / 2.4) ** 2 <= 1.0:
                    c.p(ox + 10 + dx, by - 16 + dy, stone[0 if dy <= 0 else 2])
    else:
        # Stacked dressed ashlar blocks + iron crowbar leaning against them.
        _ground_shadow_ellipse(c, ox + 14, by + 1, 15, 3.6, 82)
        for row, (sx0, sw) in enumerate(((ox, 28), (ox + 4, 22))):
            sy0 = by - 9 - row * 8
            for dy in range(8):
                for dx in range(sw):
                    col = stone[1 if dy == 0 else 5 if (dy == 7 or dx == sw - 1) else 2 if dx < sw // 2 else 3]
                    c.p(sx0 + dx, sy0 + dy, col)
        for i in range(16):
            c.p(ox + 26 + i // 4, by - i, IRON[2 if i % 2 == 0 else 5])


def _draw_press_yard(c, variant, cx, by):
    wood = OAK if variant in (0, 2) else CEDAR if variant == 1 else PINE
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 76)

    if variant in (0, 1):
        # Stacked woven olive/fruit pressing mats (frails) + glistening oil jars & wooden press screw!
        px = 42 if variant == 0 else 82
        _ground_shadow_ellipse(c, px, by + 1, 15, 4.2, 86)
        # Low stone catch-basin beneath the stacked frails.
        for dy in range(5):
            for dx in range(-14, 15):
                c.p(px + dx, by - 4 + dy, STONE[2 if dy == 0 else 4 if dx > 6 or dy == 4 else 3])
        # Stack of 5 woven pressing mats oozing golden oil!
        for k in range(5):
            my = by - 6 - k * 4
            for dy in range(4):
                for dx in range(-11, 12):
                    weave = ((dx // 2) + k) % 2 == 0
                    col = BASKET[1 if (dy == 0 and weave) else 2 if dy == 0 else 4 if weave else 5]
                    c.p(px + dx, my - dy, col)
            # Golden oil glistening down the side.
            if k < 4:
                c.p(px - 6 + k * 3, my, OIL_GOLD[1]); c.p(px - 6 + k * 3, my + 1, OIL_GOLD[3])
        # Timber press cap & central wooden screw above.
        _wood_plank(c, px - 12, by - 27, 24, 3, OAK, seed=variant + 4)
        _wood_post(c, px - 2, by - 36, 4, 10, OAK, seed=9)
        # Companion amphorae / oil jars & wicker harvest basket.
        jx = 76 if variant == 0 else 28
        draw_clay_pot(c, jx, by + 1, r_body=8, height=15, clay=CLAY_POT, fill_kind='brine')
        draw_clay_pot(c, jx + 17, by + 1, r_body=7, height=13, clay=CLAY_RED, fill_kind='brine')
        draw_bucket(c, 20 if variant == 0 else 104, by + 1, r_top=6, h=10, wood=wood)
    else:
        # Brewhouse / bakehouse yard: staved mash tun / kneading trough + bulging grain sacks + wooden casks!
        _ground_shadow_ellipse(c, 42, by + 1, 16, 4.0, 82)
        for lx in (28, 52):
            _wood_post(c, lx, by - 15, 4, 16, wood, seed=lx)
        _wood_plank(c, 24, by - 23, 36, 10, wood, seed=variant + 7)
        for dx in range(2, 34):
            c.p(24 + dx, by - 22, (OIL_GOLD if variant == 2 else SALT)[1 if dx < 18 else 2])
            c.p(24 + dx, by - 21, (OIL_GOLD if variant == 2 else SALT)[2 if dx < 18 else 3])
        # Wooden mash paddle leaning out of the trough.
        for i in range(13):
            c.p(48 + i // 3, by - 22 - i, PINE[1 if i > 4 else 3])
            c.p(49 + i // 3, by - 22 - i, PINE[4])
        # Bulging tied burlap grain/flour sacks with ruffled tie-ears on the right!
        for sx, sh in ((74, 14), (89, 13)):
            _ground_shadow_ellipse(c, sx, by + 1, 8, 2.8, 80)
            for k in range(sh):
                if k == sh - 3:
                    w = 3.2
                elif k >= sh - 2:
                    w = 4.5 + (k - (sh - 2)) * 0.8
                else:
                    w = 7.0 * math.sin((k / max(1, sh - 3)) * math.pi * 0.82 + 0.22)
                iw = int(round(w))
                for dx in range(-iw, iw + 1):
                    u = dx / max(1.0, w)
                    col = HEMP[5 if abs(u) > 0.82 or k == 0 else 1 if u < -0.2 else 2 if u < 0.35 else 4]
                    if k >= sh - 2 and abs(dx) <= 1:
                        col = HEMP[5]
                    c.p(sx + dx, by - k, col)
            for dx in range(-3, 4):
                c.p(sx + dx, by - sh + 3, OAK[4 if dx > 0 else 2])
        draw_bucket(c, 104, by + 1, r_top=7, h=12, wood=OAK)


def _smoke_wisp(c, x0, y0, h, seed=0):
    for i in range(h):
        sway = round(math.sin(i * 0.42 + seed) * (1.2 + i * 0.08))
        alpha = max(24, min(145, round(130 * (1.0 - i / max(1, h)) * (0.65 + 0.35 * math.sin(i * 0.8 + seed)))))
        col = SMOKE_COL[0 if i > h * 0.5 else 2]
        rgba = (col[0], col[1], col[2], alpha)
        _blend(c, x0 + sway, y0 - i, rgba)
        if i % 2 == 0:
            _blend(c, x0 + sway + 1, y0 - i, (col[0], col[1], col[2], alpha // 2))


def _paper_board(c, x, y, w, h, wood, sheets=2, seed=0):
    """Slanted wooden paper-drying board with bright brushed paper sheets adhered to its face."""
    _ground_shadow_ellipse(c, x + w // 2, y + h + 1, w // 2 + 3, 2.8, 76)
    # Braced timber legs behind board.
    _wood_post(c, x + 3, y + 6, 3, h - 5, wood, seed=seed + 1)
    _wood_post(c, x + w - 6, y + 6, 3, h - 5, wood, seed=seed + 2)
    # Board face (slight perspective slant: top shifted 2px right).
    for dy in range(h - 4):
        shift = round((1.0 - dy / max(1, h - 4)) * 2.0)
        yy = y + dy
        for dx in range(w):
            xx = x + dx + shift
            seam = (dy == 0 or dy == h - 5 or dx == 0 or dx == w - 1 or dy % 8 == 0)
            col = wood[5 if seam else 2 if dy < 5 else 3 if dx < w // 2 else 4]
            c.p(xx, yy, col)
    # Overlapping damp cream rag/mulberry sheets plastered onto the board (2 full rows!).
    sw = max(10, (w - 6) // sheets - 2)
    sh = max(9, (h - 11) // 2)
    for k in range(sheets):
        sx0 = x + 4 + k * (sw + 3)
        for row in range(2):
            sy0 = y + 3 + row * (sh + 2)
            if sy0 + sh > y + h - 4:
                continue
            shift = round((1.0 - (sy0 - y) / max(1, h - 4)) * 2.0)
            for dy in range(sh):
                for dx in range(sw):
                    edge = (dx == 0 or dy == 0)
                    shad = (dx == sw - 1 or dy == sh - 1)
                    curl = (dx >= sw - 2 and dy >= sh - 2 and (k + row) % 2 == 0)
                    col = PAPER[5 if curl else 3 if shad else 0 if edge else 1 if (dx + dy) < (sw + sh) * 0.6 else 2]
                    c.p(sx0 + shift + dx, sy0 + dy, col)
    # Tiny pale deckle-trim scraps on the ground below the board.
    for dx in (6, 15, w - 9):
        c.p(x + dx, y + h, PAPER[1]); c.p(x + dx + 1, y + h, PAPER[3])


def _draw_paper_yard(c, variant, cx, by):
    wood = PINE if variant in (0, 3) else OAK if variant == 1 else CEDAR
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 74)

    if variant == 0:
        # East Asian washi yard: slanted drying boards plastered with mulberry sheets + dipping vat with bamboo mould!
        _paper_board(c, 16, by - 36, 40, 36, PINE, sheets=2, seed=3)
        # Rectangular wooden dipping vat filled with milky paper-pulp slurry + bamboo screen deckle!
        vx = 64
        _ground_shadow_ellipse(c, vx + 16, by + 1, 18, 3.8, 82)
        for lx in (vx + 2, vx + 26):
            _wood_post(c, lx, by - 14, 4, 15, OAK, seed=lx)
        _wood_plank(c, vx, by - 22, 32, 11, OAK, seed=11)
        for dy in range(2):
            for dx in range(2, 30):
                c.p(vx + dx, by - 21 + dy, PAPER[0 if (dy == 0 and dx < 18) else 2 if dy == 0 else 3])
        # Bamboo screen mould (sugeta) resting across the vat rim!
        for dx in range(4, 24):
            c.p(vx + dx, by - 23, BAMBOO[1 if dx % 2 == 0 else 3])
            c.p(vx + dx, by - 22, BAMBOO[4])
        # Stack of freshly couched cream paper sheets on a low stool on right!
        sx = 100
        _wood_plank(c, sx - 2, by - 5, 16, 4, OAK, seed=17)
        for k in range(8):
            for dx in range(12):
                c.p(sx + dx, by - 6 - k, PAPER[0 if k == 7 else 1 if k % 2 == 0 else 3])
    elif variant == 1:
        # Islamic / Samarkand papermaking yard: stone pulp-beating trough + overhead paper drying lines!
        for px in (54, 108):
            _wood_post(c, px, by - 42, 4, 43, wood, seed=px)
            _ground_shadow_ellipse(c, px + 2, by + 1, 4.5, 2.0, 82)
        _wood_plank(c, 52, by - 41, 60, 3, wood, seed=9)
        for k in range(3):
            xx = 60 + k * 15
            for dy in range(21):
                sway = round(math.sin(dy * 0.25 + k) * 0.8)
                for dx in range(12):
                    col = PAPER[0 if dy < 3 else 4 if (dy == 20 or dx == 11) else 1 if dx < 6 else 2]
                    c.p(xx + dx + sway, by - 38 + dy, col)
        # Heavy carved stone pulp-beating trough + wooden stamper pestle on left!
        tx = 18
        _ground_shadow_ellipse(c, tx + 15, by + 1, 17, 3.8, 84)
        for dy in range(12):
            for dx in range(30):
                col = LIMESTONE[1 if dy < 2 else 5 if (dy == 11 or dx == 29) else 2 if dx < 12 else 4]
                c.p(tx + dx, by - 11 + dy, col)
        for dx in range(3, 27):
            c.p(tx + dx, by - 10, PAPER[1 if dx < 15 else 3])
        # Angled heavy wooden pulp-beating pestle leaning in the trough.
        for i in range(18):
            c.p(tx + 12 + i // 3, by - 10 - i, OAK[1 if i > 8 else 3])
            c.p(tx + 13 + i // 3, by - 10 - i, OAK[5])
        draw_clay_pot(c, 74, by + 1, r_body=6, height=11, clay=CLAY_POT, fill_kind='brine')
    elif variant == 2:
        # European Fabriano/Holland screw press squeezing wet paper post + twin drying rails!
        px = 34
        _ground_shadow_ellipse(c, px, by + 1, 16, 4.0, 86)
        for lx in (px - 12, px + 9):
            _wood_post(c, lx, by - 40, 4, 41, OAK, seed=lx)
        _wood_plank(c, px - 14, by - 41, 29, 5, OAK, seed=5)
        _wood_plank(c, px - 12, by - 7, 25, 4, OAK, seed=7)
        # Interleaved paper post & woolen felts compressed in the press!
        for k in range(12):
            col_r = PAPER if k % 2 == 0 else HEMP
            for dx in range(-9, 10):
                c.p(px + dx, by - 8 - k, col_r[1 if dx < 0 else 3 if dx < 7 else 5])
        _wood_plank(c, px - 10, by - 22, 21, 3, OAK, seed=13)
        _wood_post(c, px - 2, by - 37, 4, 15, OAK, seed=19)
        # Long iron/oak press lever bar projecting horizontally.
        _wood_plank(c, px - 16, by - 28, 32, 3, PINE, seed=23)
        # Draped sheets on drying frame on right.
        for rx in (64, 108):
            _wood_post(c, rx, by - 36, 4, 37, wood, seed=rx)
        _wood_plank(c, 62, by - 35, 50, 3, wood, seed=17)
        _wood_plank(c, 64, by - 19, 46, 3, wood, seed=19)
        for ry in (by - 33, by - 17):
            for k in range(3):
                xx = 69 + k * 12
                for dy in range(11):
                    for dx in range(10):
                        c.p(xx + dx, ry + dy, PAPER[0 if dy < 2 else 3 if (dy == 10 or dx == 9) else 1 if dx < 5 else 2])
    else:
        # Bark-boiling cauldron + bleached bast fiber bundles + drying board!
        bx = 30
        _ground_shadow_ellipse(c, bx, by + 1, 13, 3.8, 86)
        # Low stone firebox + steaming iron/copper cauldron.
        for dy in range(6):
            for dx in range(-11, 12):
                c.p(bx + dx, by - 5 + dy, STONE[2 if dy == 0 else 5 if dx > 5 else 3])
        for dx in range(-4, 5):
            c.p(bx + dx, by - 2, EMBER[0 if abs(dx) < 2 else 2])
        for k in range(11):
            w = 10.5 - (k / 11.0) * 1.2
            iw = int(round(w))
            for dx in range(-iw, iw + 1):
                u = dx / max(1.0, w)
                c.p(bx + dx, by - 6 - k, IRON[1 if u < -0.35 else 3 if u < 0.25 else 5 if u < 0.7 else 6])
        for dx in range(-8, 9):
            c.p(bx + dx, by - 16, PAPER[0 if abs(dx) < 5 else 2])
        _smoke_wisp(c, bx - 2, by - 18, 14, seed=4)
        _smoke_wisp(c, bx + 4, by - 18, 12, seed=9)
        _paper_board(c, 64, by - 35, 42, 35, PINE, sheets=2, seed=11)


def _draw_rope_coil_big(c, cx, by, r_out=11, h=6, ramp_r=HEMP):
    _ground_shadow_ellipse(c, cx, by + 1, r_out + 2, 3.6, 82)
    for k in range(h):
        for dy in range(-3, 4):
            for dx in range(-r_out, r_out + 1):
                d = math.hypot(dx / float(r_out), dy / 3.4)
                if 0.36 <= d <= 1.0:
                    twist = ((dx + k * 2) // 2) % 2 == 0
                    idx = 1 if (dy < 0 and twist) else 2 if dy <= 0 else 4 if twist else 5
                    c.p(cx + dx, by - k + dy - 1, ramp_r[idx])


def _draw_ropewalk(c, variant, cx, by):
    wood = OAK if variant in (0, 1) else CEDAR if variant == 2 else PINE
    rope_r = TAR if variant == 1 else HEMP
    _ground_shadow_ellipse(c, cx, by + 1, 50, 5.0, 72)

    if variant in (0, 3):
        # Iconic spoked rope-maker's twisting wheel + long stake-posts + taut stretched golden hemp lines!
        flip = (variant == 3)
        wx = 26 if not flip else 100
        wy = by - 23
        _wood_post(c, wx - 2, by - 25, 5, 26, wood, seed=wx)
        _ground_shadow_ellipse(c, wx, by + 1, 9, 3.0, 84)
        _wood_plank(c, wx - 8, by - 4, 17, 4, wood, seed=3)
        d = ImageDraw.Draw(c.im)
        for rr, col in ((12, OAK[6]), (11, OAK[2]), (10, PINE[1]), (8, OAK[5])):
            d.ellipse((wx - rr, wy - rr, wx + rr, wy + rr), outline=col, width=1)
        for k in range(6):
            a = k * math.tau / 6.0 + variant * 0.3
            d.line((wx, wy, round(wx + math.cos(a) * 9), round(wy + math.sin(a) * 9)), fill=PINE[2 if k < 3 else 4], width=1)
        d.ellipse((wx - 2, wy - 2, wx + 2, wy + 2), fill=IRON[2], outline=IRON[5])

        # Notched stake-posts (top-posts) supporting 3 parallel taut twisting strands!
        post_xs = (58, 92) if not flip else (70, 36)
        for px in post_xs:
            _wood_post(c, px, by - 27, 4, 28, wood, seed=px)
            _ground_shadow_ellipse(c, px + 2, by + 1, 4.5, 2.0, 82)
            _wood_plank(c, px - 4, by - 26, 12, 3, wood, seed=px + 5)
        x_start = wx + 8 if not flip else 24
        x_end = 108 if not flip else wx - 8
        for sy_off, rr in ((-25, HEMP), (-22, HEMP_PALE), (-19, HEMP)):
            for xx in range(x_start, x_end):
                sag = round(math.sin((xx - x_start) / max(1, x_end - x_start) * math.pi) * 1.4)
                twist = ((xx // 2) + sy_off) % 2 == 0
                c.p(xx, by + sy_off + sag, rr[1 if twist else 3])
                if sy_off == -22:
                    c.p(xx, by + sy_off + sag + 1, rr[5])
        # Heavy coiled hawser at the far end!
        _draw_rope_coil_big(c, 102 if not flip else 24, by + 1, r_out=11, h=7, ramp_r=HEMP)
    elif variant == 1:
        # Naval tarred rigging yard: smoking pitch kettle + horizontal winding reel + glossy tarred coils!
        kx = 28
        _ground_shadow_ellipse(c, kx, by + 1, 12, 3.6, 86)
        for dy in range(5):
            for dx in range(-10, 11):
                c.p(kx + dx, by - 4 + dy, STONE[2 if dy == 0 else 5 if dx > 4 else 3])
        for dx in range(-3, 4):
            c.p(kx + dx, by - 2, EMBER[0 if abs(dx) < 2 else 2])
        for k in range(10):
            w = 9.5 - (k / 10.0) * 1.0
            iw = int(round(w))
            for dx in range(-iw, iw + 1):
                u = dx / max(1.0, w)
                c.p(kx + dx, by - 5 - k, IRON[2 if u < -0.3 else 4 if u < 0.3 else 6])
        for dx in range(-7, 8):
            c.p(kx + dx, by - 14, TAR[1 if abs(dx) < 3 else 4])
        _smoke_wisp(c, kx, by - 16, 13, seed=7)
        # Horizontal rope-winding reel wound with dark tarred cable + iron crank handle!
        rx = 56
        for lx in (rx, rx + 30):
            _wood_post(c, lx, by - 24, 4, 25, OAK, seed=lx)
            _ground_shadow_ellipse(c, lx + 2, by + 1, 4.5, 2.0, 82)
        for dy in range(-5, 6):
            for dx in range(4, 30):
                twist = ((dx + dy) // 2) % 2 == 0
                c.p(rx + dx, by - 16 + dy, TAR[0 if (dy < -2 and twist) else 2 if dy < 1 else 4 if twist else 6])
        # Crank handle on right end of reel.
        for dx in range(34, 38):
            c.p(rx + dx, by - 16, IRON[2])
        for dy in range(5):
            c.p(rx + 37, by - 16 - dy, IRON[3 if dy < 3 else 1])
        c.p(rx + 38, by - 20, OAK[2]); c.p(rx + 39, by - 20, OAK[4])
        # Coiled tarred & natural hemp hawsers!
        _draw_rope_coil_big(c, 102, by + 1, r_out=11, h=7, ramp_r=TAR)
        for dx in range(-7, 4):
            c.p(102 + dx, by - 8, STONE[2 if abs(dx + 2) < 3 else 4])
        _draw_rope_coil_big(c, 72, by + 1, r_out=9, h=5, ramp_r=HEMP)
    else:
        # Twin A-frame cordage reels + combed hemp fiber sheaves + coils on skids!
        for rx, rr in ((24, HEMP), (62, TAR)):
            for lx in (rx, rx + 24):
                _wood_post(c, lx, by - 28, 4, 29, wood, seed=lx)
                _ground_shadow_ellipse(c, lx + 2, by + 1, 4.5, 2.0, 82)
            _wood_plank(c, rx - 2, by - 29, 32, 3, wood, seed=rx)
            for dy in range(-6, 7):
                for dx in range(4, 24):
                    col = rr[1 if (dy < -2 and dx % 2 == 0) else 2 if dy < 1 else 4 if dx % 2 == 0 else 5]
                    c.p(rx + dx, by - 18 + dy, col)
            for dx in range(28, 32):
                c.p(rx + dx, by - 18, IRON[2])
            for dy in range(4):
                c.p(rx + 31, by - 18 - dy, IRON[3])
        # Sheaf of pale combed hemp fibers with flared golden ends & waist tie!
        for k in range(21):
            w = 3.2 if 8 <= k <= 10 else (5.8 - abs(k - 10) * 0.14)
            iw = max(2, int(round(w)))
            for dx in range(-iw, iw + 1):
                c.p(104 + dx, by - k, HEMP_PALE[0 if (dx < -1 and k % 2 == 0) else 1 if dx < 0 else 3 if dx < iw else 5])
        for dx in range(-4, 5):
            c.p(104 + dx, by - 9, OAK[4 if dx > 0 else 2])
            c.p(104 + dx, by - 10, OAK[5])
        _draw_rope_coil_big(c, 48, by + 1, r_out=9, h=5, ramp_r=HEMP)


def _draw_bronze_bell(c, cx, by, h=24, w_bot=13, ramp_r=BRONZE, patina=True):
    _ground_shadow_ellipse(c, cx, by + 1, w_bot + 2, 4.0, 88)
    for k in range(h):
        t = k / max(1.0, h - 1)
        # Classic flared bell profile: wide mouth at bottom, tapered waist, rounded crown.
        if t < 0.22:
            w = w_bot * (1.0 - t * 1.1)
        elif t < 0.78:
            w = w_bot * (0.76 - (t - 0.22) * 0.36)
        else:
            u2 = (t - 0.78) / 0.22
            w = w_bot * 0.56 * math.sqrt(max(0.0, 1.0 - u2 * u2))
        iw = max(1, int(round(w)))
        band = (k in (4, 5, 16))
        for dx in range(-iw, iw + 1):
            u = dx / max(1.0, w)
            if band:
                col = ramp_r[0 if u < -0.1 else 2 if u < 0.45 else 5]
            elif patina and t > 0.58 and u > 0.15 and ((dx + k) % 3 != 0):
                col = VERDIGRIS[2 if u < 0.55 else 4]
            else:
                # Crisp metallic specular ridge slightly left of center!
                idx = 0 if -0.45 <= u <= -0.18 else 1 if u < 0.05 else 3 if u < 0.45 else 5 if u < 0.82 else 6
                col = ramp_r[idx]
            c.p(cx + dx, by - k, col)
    # Cast suspension canon / crown loop on top.
    for dx in (-2, -1, 0, 1, 2):
        c.p(cx + dx, by - h, ramp_r[2 if dx < 0 else 4])
        c.p(cx + dx, by - h - 1, ramp_r[1 if abs(dx) < 2 else 5])
    c.p(cx, by - h, ramp_r[6])


def _draw_foundry_yard(c, variant, cx, by):
    wood = OAK if variant != 2 else CEDAR
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 80)

    if variant == 0:
        # Iconic bronze bell foundry: finished cast bronze bell on oak skids + clay loam mould + glowing crucible!
        _wood_plank(c, 22, by - 3, 34, 4, OAK, seed=5)
        _draw_bronze_bell(c, 39, by - 3, h=25, w_bot=13, ramp_r=BRONZE, patina=True)
        # Clay-jacketed casting mould with iron binding hoops on right.
        mx = 76
        _ground_shadow_ellipse(c, mx, by + 1, 13, 3.8, 84)
        for k in range(21):
            w = 11.5 - (k / 21.0) * 3.5
            iw = int(round(w))
            hoop = k in (4, 12, 18)
            for dx in range(-iw, iw + 1):
                u = dx / max(1.0, w)
                col = IRON[2 if u < 0 else 5] if hoop else CLAY_RAW[1 if u < -0.25 else 3 if u < 0.35 else 5]
                c.p(mx + dx, by - k, col)
        # Glowing molten bronze sprue cup on top of mould!
        for dx in range(-3, 4):
            c.p(mx + dx, by - 21, EMBER[0 if abs(dx) < 2 else 2])
        _smoke_wisp(c, mx, by - 23, 12, seed=3)
        # Glowing earthen crucible & long iron pouring tongs on far right.
        draw_clay_pot(c, 102, by + 1, r_body=6, height=11, clay=CLAY_DARK, fill_kind='empty')
        for dx in range(-3, 4):
            c.p(102 + dx, by - 10, EMBER[0 if abs(dx) < 2 else 2])
        for i in range(15):
            c.p(94 + i // 3, by - 9 - i, IRON[2 if i > 5 else 4])
    elif variant == 1:
        # West African (Ife/Benin) / Islamic lost-wax brass foundry: glowing clay furnace + cast brass vessels + copper ingots!
        # Sculpted coiled-clay lost-wax furnace with soot lip, blazing tuyere & bamboo air-bellows pipe!
        fx = 32
        _ground_shadow_ellipse(c, fx, by + 1, 15, 4.2, 86)
        for k in range(24):
            w = 13.0 * math.sin((k / 24.0) * 1.45 + 0.55)
            iw = max(3, int(round(w)))
            coil = (k % 5 == 0)
            for dx in range(-iw, iw + 1):
                u = dx / max(1.0, w)
                soot = (k >= 19 or (k < 10 and abs(dx) <= 6))
                if soot and (k >= 21 or (k in (8, 9) and abs(dx) <= 4)):
                    col = CLAY_DARK[3 if u < 0 else 5]
                else:
                    idx = 5 if coil and u > 0 else 4 if coil else 1 if u < -0.3 else 3 if u < 0.35 else 5
                    col = CLAY_RED[idx]
                c.p(fx + dx, by - k, col)
        # Bamboo/clay tuyere pipe entering lower-left side of furnace.
        for i in range(9):
            c.p(fx - 12 - i, by - 5 - i // 3, BAMBOO[2 if i % 2 == 0 else 4])
            c.p(fx - 12 - i, by - 4 - i // 3, BAMBOO[5])
        # Blazing orange tuyere/mouth & glowing sparks at crown!
        for dy in range(5):
            for dx in range(-4, 5):
                c.p(fx + dx, by - 3 - dy, EMBER[0 if (abs(dx) < 2 and dy < 3) else 2 if abs(dx) < 4 else 4])
        for dx in range(-4, 5):
            c.p(fx + dx, by - 24, EMBER[0 if abs(dx) < 2 else 2 if abs(dx) < 4 else 4])
        c.p(fx - 2, by - 27, EMBER[0]); c.p(fx + 3, by - 29, EMBER[1])
        _smoke_wisp(c, fx, by - 26, 14, seed=11)
        # Gleaming cast brass vessels & ceremonial bowls cooling on sand bed!
        for vx, vr, vh in ((66, 8, 12), (83, 6, 14)):
            _ground_shadow_ellipse(c, vx, by + 1, vr + 1, 2.8, 82)
            for k in range(vh):
                t = k / max(1.0, vh - 1)
                w = vr * (0.65 + 0.35 * math.sin(t * math.pi))
                if t > 0.78:
                    w = vr * 0.55
                iw = max(2, int(round(w)))
                for dx in range(-iw, iw + 1):
                    u = dx / max(1.0, w)
                    idx = 0 if -0.45 <= u <= -0.15 else 1 if u < 0.1 else 3 if u < 0.5 else 5
                    c.p(vx + dx, by - k, BRASS[idx])
        # Stacked gleaming bronze/copper ingots on right!
        for row in range(3):
            for k in range(3 - row):
                ix = 95 + k * 7 + row * 3
                iy = by - 2 - row * 4
                for dy in range(3):
                    for dx in range(6):
                        c.p(ix + dx, iy - dy, BRONZE[1 if dy == 2 else 3 if dx < 4 else 5])
    elif variant == 2:
        # East / South Asian bronze foundry: cast temple ding cauldron + hanging temple bell frame + sand bed!
        # Timber frame suspending a gleaming bronze temple bell!
        for lx in (20, 56):
            _wood_post(c, lx, by - 40, 4, 41, CEDAR, seed=lx)
            _ground_shadow_ellipse(c, lx + 2, by + 1, 4.5, 2.0, 82)
        _wood_plank(c, 16, by - 41, 48, 4, CEDAR, seed=7)
        _draw_bronze_bell(c, 39, by - 10, h=24, w_bot=11, ramp_r=BRONZE, patina=True)
        # Three-legged bronze tripod cauldron (ding) cooling on a sand casting bed!
        tx = 82
        _ground_shadow_ellipse(c, tx, by + 1, 16, 4.2, 82)
        # Three cast bronze legs + round belly + upturned ear handles.
        for lx in (tx - 7, tx, tx + 7):
            for dy in range(7):
                c.p(lx, by - dy, BRONZE[2 if lx <= tx else 5])
                c.p(lx + 1, by - dy, BRONZE[5])
        for k in range(11):
            w = 10.5 * math.sin((k / 11.0) * math.pi * 0.8 + 0.25)
            iw = int(round(w))
            for dx in range(-iw, iw + 1):
                u = dx / max(1.0, w)
                col = VERDIGRIS[2] if (k in (4, 5) and (dx % 3 == 0)) else BRONZE[0 if -0.4 <= u <= -0.15 else 2 if u < 0.25 else 4 if u < 0.7 else 6]
                c.p(tx + dx, by - 6 - k, col)
        for side in (-1, 1):
            for dy in range(5):
                c.p(tx + side * 10, by - 16 - dy, BRONZE[1 if side < 0 else 4])
                c.p(tx + side * 8, by - 16 - dy, BRONZE[3])
            c.p(tx + side * 9, by - 20, BRONZE[0 if side < 0 else 3])
        # Glowing charcoal basket beside it.
        draw_clay_pot(c, 106, by + 1, r_body=6, height=9, clay=CLAY_DARK, fill_kind='empty')
        for dx in range(-3, 4):
            c.p(106 + dx, by - 8, EMBER[0 if abs(dx) < 2 else 2])
    else:
        # Heavy bronze barrel / cannon & ingot foundry yard!
        _wood_plank(c, 18, by - 4, 48, 5, OAK, seed=11)
        _ground_shadow_ellipse(c, 42, by + 1, 26, 4.0, 86)
        # Tapered cast bronze cannon barrel with muzzle swell, dark bore & cascabel knob on skids!
        for dx in range(44):
            t = dx / 43.0
            rad = round(5.8 - t * 1.9 + (1.2 if dx >= 40 else 0.0))
            ring = dx in (3, 15, 28, 41)
            for dy in range(-rad, rad + 1):
                u = dy / max(1.0, rad)
                idx = 0 if -0.55 <= u <= -0.2 else 1 if u < 0.05 else 3 if u < 0.5 else 5
                if ring:
                    idx = max(0, idx - 1)
                c.p(20 + dx, by - 10 + dy, BRONZE[idx])
        # Cascabel knob at breech (left) & dark cast bore mouth at muzzle (right).
        for dy in (-2, -1, 0, 1, 2):
            for dx in (-4, -3, -2, -1):
                if abs(dy) + abs(dx + 2) <= 3:
                    c.p(20 + dx, by - 10 + dy, BRONZE[1 if dy < 0 else 4])
        for dy in (-2, -1, 0, 1, 2):
            c.p(64, by - 10 + dy, IRON[6 if abs(dy) <= 1 else 4])
        # Vertical clay mould + glowing ladle on right + stacked ingots!
        mx = 86
        _ground_shadow_ellipse(c, mx, by + 1, 10, 3.2, 84)
        for k in range(20):
            for dx in range(-7, 8):
                hoop = k in (4, 11, 17)
                c.p(mx + dx, by - k, IRON[2 if dx < 0 else 5] if hoop else CLAY_RAW[1 if dx < -2 else 3 if dx < 3 else 5])
        for dx in range(-3, 4):
            c.p(mx + dx, by - 20, EMBER[0 if abs(dx) < 2 else 2])
        _smoke_wisp(c, mx, by - 22, 11, seed=13)
        for row in range(3):
            for k in range(3 - row):
                ix = 100 + k * 6 + row * 3
                iy = by - 2 - row * 4
                for dy in range(3):
                    for dx in range(5):
                        c.p(ix + dx, iy - dy, BRASS[1 if dy == 2 else 3 if dx < 3 else 5])


def _soap_tower(c, cx, by, rows=9, w_base=14, ramp_r=SOAP_IVORY):
    """Iconic Nablus / Aleppo hollow lattice soap-curing tower with crisp ventilation gaps."""
    _ground_shadow_ellipse(c, cx, by + 1, w_base + 3, 4.0, 84)
    for row in range(rows):
        t = row / max(1.0, rows - 1)
        span = max(7, round(w_base * (1.0 - t * 0.28)))
        ry = by - row * 4
        # Alternating cross-stacked bars with dark interior air gaps between bricks!
        bricks = 4 if row % 2 == 0 else 3
        bw = max(4, (span * 2 - (bricks - 1) * 2) // bricks)
        start = cx - (bricks * bw + (bricks - 1) * 2) // 2
        # Dark interior shadow showing through air slots.
        for dx in range(-span + 2, span - 1):
            c.p(cx + dx, ry - 1, ramp_r[6])
            c.p(cx + dx, ry - 2, ramp_r[6])
        for b in range(bricks):
            bx0 = start + b * (bw + 2)
            for dy in range(3):
                for dx in range(bw):
                    col = ramp_r[0 if dy == 2 else 4 if (dx == bw - 1 or dy == 0) else 1 if (b == 0 or dx < bw // 2) else 2]
                    c.p(bx0 + dx, ry - dy, col)


def _draw_soap_yard(c, variant, cx, by):
    wood = OAK if variant in (0, 2) else CEDAR if variant == 1 else PINE
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 76)

    if variant == 0:
        # Iconic Nablus/Aleppo curing tower + soap-cutting bench + olive oil amphora!
        _soap_tower(c, 38, by, rows=10, w_base=15, ramp_r=SOAP_IVORY)
        # Low soap-cutting table with fresh green olive soap slab & wire cutter.
        tx = 66
        for lx in (tx + 2, tx + 28):
            _wood_post(c, lx, by - 14, 4, 15, wood, seed=lx)
        _wood_plank(c, tx, by - 16, 34, 4, wood, seed=9)
        for dy in range(5):
            for dx in range(4, 30):
                cut = (dx % 6 == 0)
                col = SOAP_OLIVE[5 if cut else 0 if dy == 4 else 1 if dx < 16 else 3]
                c.p(tx + dx, by - 17 - dy, col)
        # Arched brass wire soap-cutter resting over the scored slab.
        for dx in range(-4, 5):
            arch = round(math.sqrt(max(0.0, 16.0 - dx * dx)) * 0.7)
            c.p(tx + 18 + dx, by - 22 - arch, BRASS[1 if dx <= 0 else 4])
        draw_clay_pot(c, 108, by + 1, r_body=7, height=14, clay=CLAY_POT, fill_kind='brine')
    elif variant == 1:
        # Scored soap pouring floor (geometric grid of olive soap) + wooden stamper rake + cured soap crate!
        px0 = 18
        _ground_shadow_ellipse(c, px0 + 30, by + 1, 32, 4.5, 80)
        # Low stone curbing rim around the pouring bed.
        for dy in range(14):
            for dx in range(60):
                rim = (dy < 2 or dy >= 12 or dx < 3 or dx >= 57)
                if rim:
                    c.p(px0 + dx, by - 13 + dy, LIMESTONE[1 if dy < 2 else 5 if dy >= 12 else 3])
                else:
                    gx = (dx - 3) % 7 == 0
                    gy = (dy - 2) % 4 == 0
                    col = SOAP_OLIVE[5 if (gx or gy) else 0 if ((dx - 3) % 7 == 1) else 1 if dx < 32 else 2]
                    c.p(px0 + dx, by - 13 + dy, col)
        # Long-handled wooden grid-scorer leaning at right end.
        for i in range(18):
            c.p(px0 + 50 + i // 4, by - 10 - i, OAK[2 if i > 6 else 4])
        # Wooden crate brimming with ivory soap bars on right!
        cx0 = 86
        _wood_plank(c, cx0, by - 12, 24, 12, PINE, seed=13)
        for k in range(3):
            for dy in range(4):
                for dx in range(6):
                    c.p(cx0 + 2 + k * 7 + dx, by - 13 - dy, SOAP_IVORY[0 if dy == 3 else 2 if dx < 4 else 4])
    elif variant == 2:
        # Soap-boiling cauldron over stone hearth + lye-ash barrel + curing slats!
        bx = 34
        _ground_shadow_ellipse(c, bx, by + 1, 14, 4.0, 86)
        for dy in range(6):
            for dx in range(-12, 13):
                c.p(bx + dx, by - 5 + dy, STONE[2 if dy == 0 else 5 if dx > 5 else 3])
        for dx in range(-4, 5):
            c.p(bx + dx, by - 2, EMBER[0 if abs(dx) < 2 else 2])
        for k in range(12):
            w = 11.0 - (k / 12.0) * 1.0
            iw = int(round(w))
            for dx in range(-iw, iw + 1):
                u = dx / max(1.0, w)
                c.p(bx + dx, by - 6 - k, BRONZE[1 if u < -0.3 else 3 if u < 0.3 else 5])
        for dx in range(-9, 10):
            c.p(bx + dx, by - 17, SOAP_IVORY[0 if abs(dx) < 5 else 2])
        for i in range(14):
            c.p(bx + 4 + i // 3, by - 17 - i, PINE[1 if i > 5 else 3])
        _smoke_wisp(c, bx - 3, by - 19, 13, seed=5)
        # Oak lye-leaching barrel + short olive soap curing stack.
        draw_bucket(c, 66, by + 1, r_top=8, h=14, wood=OAK)
        _soap_tower(c, 96, by, rows=6, w_base=11, ramp_r=SOAP_OLIVE)
    else:
        # Twin staggered Aleppo & Castile curing towers + olive oil jar!
        _soap_tower(c, 34, by, rows=9, w_base=13, ramp_r=SOAP_OLIVE)
        _soap_tower(c, 72, by, rows=7, w_base=12, ramp_r=SOAP_IVORY)
        draw_clay_pot(c, 102, by + 1, r_body=7, height=14, clay=CLAY_POT, fill_kind='brine')


def _cocoon_tray(c, cx, cy, rx=14, ry=4, cocoons=True):
    for dy in range(-ry, ry + 1):
        for dx in range(-rx, rx + 1):
            d = (dx / float(rx)) ** 2 + (dy / float(ry)) ** 2
            if d <= 1.0:
                rim = d > 0.72
                if rim:
                    col = BAMBOO[2 if dy <= 0 else 5]
                elif cocoons:
                    g = h2(cx + dx, cy + dy, 31)
                    col = SILK_WHITE[0 if (dy < 0 and g > 0.4) else 1 if g > 0.3 else 3]
                else:
                    g = h2(cx + dx, cy + dy, 17)
                    col = MULBERRY[1 if (dy < 0 and g > 0.45) else 2 if g > 0.3 else 4]
                c.p(cx + dx, cy + dy, col)
    # Tiny oval cocoon bumps heaped on top!
    if cocoons:
        for bx in range(-rx + 4, rx - 3, 4):
            c.p(cx + bx, cy - 2, SILK_WHITE[0]); c.p(cx + bx + 1, cy - 2, SILK_WHITE[1])
            c.p(cx + bx, cy - 1, SILK_WHITE[2])


def _draw_silk_yard(c, variant, cx, by):
    wood = BAMBOO if variant in (0, 2) else CEDAR if variant == 1 else OAK
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 74)

    if variant == 0:
        # Tiered golden bamboo silkworm rearing frame loaded with circular cocoon & mulberry-leaf trays!
        for px in (22, 74):
            _wood_post(c, px, by - 42, 4, 43, BAMBOO, seed=px)
            _ground_shadow_ellipse(c, px + 2, by + 1, 4.5, 2.0, 82)
        for ty, coc in ((by - 34, True), (by - 21, True), (by - 9, False)):
            _wood_plank(c, 20, ty + 2, 58, 2, BAMBOO, seed=ty)
            _cocoon_tray(c, 38, ty, rx=13, ry=4, cocoons=coc)
            _cocoon_tray(c, 60, ty, rx=12, ry=4, cocoons=True)
        # Wide floor basket brimming with vivid green mulberry leaves on right!
        _ground_shadow_ellipse(c, 98, by + 1, 13, 3.6, 80)
        for k in range(8):
            w = 11.0 - (k / 8.0) * 1.2
            iw = int(round(w))
            for dx in range(-iw, iw + 1):
                weave = ((dx // 2) + k) % 2 == 0
                c.p(98 + dx, by - k, BASKET[1 if (dx < 0 and weave) else 3 if weave else 5])
        _cocoon_tray(c, 98, by - 8, rx=11, ry=4, cocoons=False)
    elif variant in (1, 3):
        # Steaming cocoon-boiling clay basin feeding shimmering silk filaments onto a spoked reeling swift!
        flip = (variant == 3)
        kx = 34 if not flip else 94
        rx = 80 if not flip else 44
        # Clay charcoal stove + wide basin filled with bobbing snowy-white cocoons.
        _ground_shadow_ellipse(c, kx, by + 1, 14, 4.0, 84)
        for k in range(13):
            w = 12.0 - (k / 13.0) * 0.8
            iw = int(round(w))
            for dx in range(-iw, iw + 1):
                u = dx / max(1.0, w)
                c.p(kx + dx, by - k, CLAY_POT[1 if u < -0.25 else 3 if u < 0.3 else 5])
        for dx in range(-3, 4):
            c.p(kx + dx, by - 3, EMBER[0 if abs(dx) < 2 else 2])
        for dx in range(-10, 11):
            c.p(kx + dx, by - 13, WATER_DARK[1 if abs(dx) < 6 else 3])
            if dx % 3 == 0:
                c.p(kx + dx, by - 14, SILK_WHITE[0]); c.p(kx + dx + 1, by - 14, SILK_WHITE[1])
        _smoke_wisp(c, kx - 2, by - 16, 11, seed=variant + 2)
        # Wooden silk-reeling swift (tall frame + spoked hexagonal reel wound with lustrous silk!).
        for lx in (rx - 14, rx + 12):
            _wood_post(c, lx, by - 38, 4, 39, wood, seed=lx)
            _ground_shadow_ellipse(c, lx + 2, by + 1, 4.5, 2.0, 82)
        _wood_plank(c, rx - 16, by - 10, 34, 3, wood, seed=9)
        # Reeling drum with wooden cross-spokes, axle, crank & luminous cream/gold silk skeins!
        d = ImageDraw.Draw(c.im)
        for k in range(6):
            a = k * math.tau / 6.0 + 0.25
            d.line((rx, by - 26, round(rx + math.cos(a) * 9), round(by - 26 + math.sin(a) * 9)), fill=OAK[2 if k < 3 else 4], width=1)
        d.ellipse((rx - 2, by - 28, rx + 2, by - 24), fill=OAK[3], outline=OAK[6])
        d.ellipse((rx - 11, by - 37, rx + 11, by - 15), outline=SILK_WHITE[0], width=2)
        for dy in range(-8, 9):
            span = round(math.sqrt(max(0.0, 81.0 - dy * dy)))
            for dx in range(-span, span + 1):
                if abs(dx) > span - 3 or abs(dy) > 5:
                    col = (SILK_GOLD if variant == 1 else SILK_WHITE)[0 if dy < -2 else 1 if dy < 3 else 3]
                    c.p(rx + dx, by - 26 + dy, col)
        # Wooden hand-crank on outer frame post.
        crx = rx + 16 if not flip else rx - 18
        for dx in range(3):
            c.p(crx + dx, by - 26, OAK[2])
        for dy in range(5):
            c.p(crx + (2 if not flip else 0), by - 26 - dy, PINE[2])
        # Luminous silk filament rising diagonally from boiling cocoons onto the reeling swift!
        d.line((kx, by - 15, rx, by - 33), fill=SILK_WHITE[0], width=1)
        d.line((kx + (4 if not flip else -4), by - 15, rx, by - 28), fill=SILK_GOLD[1], width=1)
        # Extra wicker basket of mulberry leaves or cocoons on the outer flank.
        bx = 108 if not flip else 18
        _cocoon_tray(c, bx, by - 4, rx=9, ry=3, cocoons=(variant == 1))
    else:
        # Sun-drying frame hung with lustrous twisted skeins of raw silk (ivory, imperial gold, crimson, celadon)!
        for px in (18, 108):
            _wood_post(c, px, by - 44, 4, 45, BAMBOO, seed=px)
            _ground_shadow_ellipse(c, px + 2, by + 1, 4.5, 2.0, 82)
        _wood_plank(c, 15, by - 43, 98, 3, BAMBOO, seed=11)
        skeins = [SILK_WHITE, SILK_GOLD, COCHINEAL, CELADON, SILK_WHITE, SILK_GOLD]
        for i, sr in enumerate(skeins):
            sx = 26 + i * 13
            for dy in range(25):
                # Twisted figure-8 skein waist!
                w = round(2.5 + 1.4 * abs(math.cos(dy * 0.22 + i * 0.4)))
                for dx in range(-w, w + 1):
                    c.p(sx + dx, by - 40 + dy, sr[0 if (dx < 0 and dy % 4 < 2) else 1 if dx <= 0 else 3 if dx < w else 4])
        _cocoon_tray(c, 42, by - 2, rx=13, ry=4, cocoons=True)
        _cocoon_tray(c, 84, by - 2, rx=13, ry=4, cocoons=False)


def _draw_charcoal_yard(c, variant, cx, by):
    wood = OAK if variant in (0, 1) else CEDAR if variant == 2 else PINE
    _ground_shadow_ellipse(c, cx, by + 1, 48, 5.2, 78)

    if variant in (0, 2):
        # Iconic turf-covered smoking charcoal clamp (meiler) + glowing vents + coal rake + filled charcoal sacks!
        mx = 46 if variant == 0 else 80
        _ground_shadow_ellipse(c, mx, by + 1, 26, 5.0, 88)
        for dy in range(-28, 2):
            t = (dy + 28) / 29.0
            span = round(24.0 * math.sqrt(max(0.0, 1.0 - ((dy + 1) / 29.5) ** 2)))
            for dx in range(-span, span + 1):
                u = dx / max(1.0, span)
                g = h2((mx + dx) // 2, (by + dy) // 2, variant * 17 + 5)
                if variant == 2 and dx < -4 and dy > -14:
                    # Half-opened side revealing dark stacked charred billets inside!
                    col = COAL[1 if (dx % 3 == 0) else 3 if g > 0.4 else 6]
                elif dy < -14 and g > 0.35:
                    col = TURF[1 if u < -0.2 else 2 if u < 0.3 else 4]
                else:
                    col = COAL[2 if (u < -0.35 and g > 0.5) else 4 if g > 0.35 else 5 if u < 0.4 else 6]
                c.p(mx + dx, by + dy, col)
        # Tiny glowing orange draft vents near the base of the meiler!
        for vx in (mx - 12, mx + 2, mx + 13):
            c.p(vx, by - 5, EMBER[0]); c.p(vx + 1, by - 5, EMBER[2]); c.p(vx, by - 4, EMBER[3])
        # Curling blue-grey charcoal smoke rising cleanly from the crown!
        _smoke_wisp(c, mx - 2, by - 29, 20, seed=variant + 3)
        _smoke_wisp(c, mx + 4, by - 28, 16, seed=variant + 11)
        # Bulging dark-dusted charcoal sacks + long wooden rake (variant 0) or stacked split cordwood (variant 2)!
        if variant == 0:
            for sx, sh in ((86, 13), (100, 12)):
                _ground_shadow_ellipse(c, sx, by + 1, 8, 2.8, 84)
                for k in range(sh):
                    w = 3.2 if k == sh - 3 else (4.4 if k >= sh - 2 else 6.8 * math.sin((k / max(1, sh - 3)) * math.pi * 0.8 + 0.24))
                    iw = int(round(w))
                    for dx in range(-iw, iw + 1):
                        u = dx / max(1.0, w)
                        c.p(sx + dx, by - k, COAL[2 if u < -0.2 else 4 if u < 0.4 else 6])
                for dx in range(-3, 4):
                    c.p(sx + dx, by - sh + 3, HEMP[3])
            # Long coal-burner's rake leaning against the mound.
            for i in range(20):
                c.p(72 + i // 3, by - i, PINE[2 if i > 8 else 4])
        else:
            # Stacked cordwood billets waiting to build the next kiln!
            for row in range(4):
                for k in range(5):
                    bx0 = 20 + k * 6 + (row % 2) * 2
                    by0 = by - 3 - row * 4
                    for dy in range(3):
                        for dx in range(5):
                            col = OAK[5 if (dx == 0 or dy == 0) else 2 if (dx < 3 and dy == 2) else 3]
                            c.p(bx0 + dx, by0 - dy, col)
    else:
        # Forest sawpit / raised timber log on X-brace trestles + glistening 2-man pit saw + golden sawdust cone!
        flip = (variant == 3)
        # Bright golden sawdust cone piled directly under the saw kerf!
        sx = 56 if not flip else 68
        _ground_shadow_ellipse(c, sx, by + 2, 16, 4.0, 74)
        for dy in range(-10, 2):
            span = round(14 * (1.0 - (dy + 10) / 13.0))
            span = max(1, round(15 * math.sqrt(max(0.0, 1.0 - ((dy + 1) / 11.0) ** 2))))
            for dx in range(-span, span + 1):
                g = h2(sx + dx, by + dy, variant * 13 + 7)
                c.p(sx + dx, by + dy, SHAVING[0 if (dx < 0 and g > 0.45) else 1 if g > 0.35 else 3])
        # Tall timber saw-trestles holding a massive bark-edged oak log!
        for lx in (28, 80):
            _wood_post(c, lx, by - 26, 4, 27, OAK, seed=lx)
            _wood_post(c, lx + 7, by - 24, 4, 25, OAK, seed=lx + 3, lean=2.0)
            _ground_shadow_ellipse(c, lx + 4, by + 1, 7, 2.4, 84)
        # Huge timber log resting atop the trestles with pale sawn end-grain!
        for dy in range(11):
            for dx in range(72):
                xx = 22 + dx
                yy = by - 33 + dy
                if dx < 5:
                    col = PINE[0 if dy < 4 else 2 if dy < 8 else 4]
                elif dy == 0 or dy == 10:
                    col = OAK[6]
                else:
                    bark = ((dx + dy * 3) % 5 == 0)
                    col = OAK[2 if (dy < 3 and not bark) else 3 if dy < 6 else 5 if bark else 4]
                c.p(xx, yy, col)
        # Dark vertical saw kerf cut into the log + glistening serrated two-man pit saw!
        for dy in range(-33, -23):
            c.p(sx - 1, by + dy, OAK[6])
        for dy in range(-42, -6):
            c.p(sx, by + dy, IRON[0 if dy % 3 == 0 else 2])
            c.p(sx + 1, by + dy, IRON[4 if dy % 2 == 0 else 5])
            if dy % 3 == 0 and -39 <= dy <= -10:
                c.p(sx + 2, by + dy, IRON[1])
        # Top & bottom wooden cross-handles of the pit saw.
        _wood_plank(c, sx - 5, by - 43, 12, 3, PINE, seed=5)
        _wood_plank(c, sx - 5, by - 7, 12, 3, PINE, seed=9)
        # Stacked freshly sawn pale planks or chopping block with embedded axe on right!
        if variant == 1:
            for row in range(4):
                _wood_plank(c, 92, by - 3 - row * 4, 22, 3, PINE if row % 2 == 0 else OAK, seed=row * 5)
        else:
            # Chopping stump with gleaming iron axe sunk into its top!
            ax = 104
            for k in range(11):
                for dx in range(-6, 7):
                    c.p(ax + dx, by - k, OAK[2 if dx < -1 else 4 if dx < 4 else 6])
            for dx in range(-5, 6):
                c.p(ax + dx, by - 11, PINE[1 if dx < 2 else 3])
            for i in range(12):
                c.p(ax + 1 + i // 2, by - 12 - i, PINE[1 if i > 4 else 3])
            for dy in range(4):
                for dx in range(4):
                    c.p(ax - 2 + dx, by - 12 - dy, IRON[1 if dy == 3 else 4])


def draw_craft_worksite(style, info):
    parsed = parse_craft_style(style)
    if not parsed:
        return None
    base, variant = parsed
    c = C(128, 92)
    cx, by = 64, 80
    if base == 'dye-racks':
        _draw_dye_racks(c, variant, cx, by)
    elif base == 'pottery-rack':
        _draw_pottery_rack(c, variant, cx, by)
    elif base == 'tanner-rack':
        _draw_tanner_rack(c, variant, cx, by)
    elif base == 'loom-frame':
        _draw_loom_frame(c, variant, cx, by)
    elif base == 'smith-bench':
        _draw_smith_bench(c, variant, cx, by)
    elif base == 'carpenter-bench':
        _draw_carpenter_bench(c, variant, cx, by)
    elif base == 'mason-bench':
        _draw_mason_bench(c, variant, cx, by)
    elif base == 'press-yard':
        _draw_press_yard(c, variant, cx, by)
    elif base == 'paper-yard':
        _draw_paper_yard(c, variant, cx, by)
    elif base == 'ropewalk':
        _draw_ropewalk(c, variant, cx, by)
    elif base == 'foundry-yard':
        _draw_foundry_yard(c, variant, cx, by)
    elif base == 'soap-yard':
        _draw_soap_yard(c, variant, cx, by)
    elif base == 'silk-yard':
        _draw_silk_yard(c, variant, cx, by)
    elif base == 'charcoal-yard':
        _draw_charcoal_yard(c, variant, cx, by)
    consolidate(c, rare=4)
    c.im.info['anchor'] = [cx, by]
    info.update(x0=0, W=128, base=by, door_x=cx, door_h=44, doorless=True)
    return c.im


if __name__ == '__main__':
    from art.front_review import sheet
    out = Path(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/coast-review/wave-c2-crafts/crafts-sheet.png')
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    out.parent.mkdir(parents=True, exist_ok=True)
    items = []
    for base in (only or CRAFT_BASES):
        for v in range(CRAFT_VARIANTS):
            st = base if v == 0 else f'{base}-{v}'
            info = {}
            im = draw_craft_worksite(st, info)
            bbox = im.getbbox()
            if bbox:
                x0, y0, x1, y1 = bbox
                im = im.crop((max(0, x0 - 4), max(0, y0 - 4), min(im.width, x1 + 4), min(im.height, y1 + 4)))
            im = im.resize((im.width * 2, im.height * 2), Image.Resampling.NEAREST)
            items.append((st, im))
    sheet(items, str(out), columns=4)
    print(f'Wrote {len(items)} craft worksite variants to {out}')
