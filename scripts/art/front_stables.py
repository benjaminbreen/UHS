"""Procedural horse stable archetypes (front-elevation Stardew / Haunted Chocolatier
house style) — five foundational culture/era bases with dynamic animatable doors
(closed, half-open, wide-open) and zero static animal heads.

Bases:
1. timber-barn  : Northern Europe / Colonial timber-framed barn stable (gabled hayloft + Dutch doors)
2. masonry-mews : Roman mansio / European coaching inn / brick & stone livery stable (keystoned arch)
3. arcade-khan  : Mediterranean / Islamic caravanserai / Spanish posada shaded arcade stable
4. east-yizhan  : East Asian post-station (yizhan / umayado) tiled stable with sliding stall doors
5. open-shed    : Steppe / rural / frontier heavy-post lean-to stable with hinged paddock gate
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

from art.front_materials import C, RAMPS, ramp
from art.front_kit import finish, consolidate, cast
from art.front_house import bevel
from art.front_openings import reveal, raised
from art import front_materials as m
from art.front_worksites import (
    OAK, IRON, DOOR_GREEN, WOOD_WARM, SHINGLE_RICH, THATCH_WARM, CLAY_RICH,
    _outbuilding_roof,
)

DOOR_STATES = ("closed", "half", "open")

# Warm-cool deep interior tones (never pure black!)
INT_DEEP = (26, 20, 22, 255)
INT_MID = (38, 30, 28, 255)
INT_POST = (54, 42, 36, 255)
INT_POST_HI = (72, 56, 44, 255)
STRAW_DARK = (118, 94, 54, 255)
STRAW_MID = (156, 128, 72, 255)
STRAW_LIT = (192, 162, 96, 255)


def _vplanks(c: C, x: int, y: int, w: int, h: int, r, plank_w: int = 4):
    """Vertical tongue-and-groove door planks: lit left bevel, warm midtone body,
    crisp dark groove seam, and subtle vertical grain."""
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            a = (xx - x) % plank_w
            if a == 0:
                col = r[2]
            elif a == plank_w - 1:
                col = r[5]
            else:
                # Subtle organic wood-grain variation without noisy speckle
                col = r[3] if ((xx * 7 + yy * 3) % 19) else r[4]
            c.p(xx, yy, col)


def _interior_bay(c: C, x: int, y: int, w: int, h: int, floor_straw=True):
    """Deep shadowed stable interior with ceiling joist shadow, distant timber
    stall partition, and sunlit straw catching the inner threshold."""
    c.rect(x, y, w, h, INT_MID)
    # Deep top shadow under lintel / ceiling joists
    c.rect(x, y, w, min(6, h // 3), INT_DEEP)
    c.rect(x, y, 2, h, INT_DEEP)
    # Distant interior stall post & cross-rail in warm shadow
    if w >= 16 and h >= 20:
        px = x + (w * 5) // 8
        c.rect(px, y + 4, 3, h - 7, INT_POST)
        c.rect(px, y + 4, 1, h - 7, INT_POST_HI)
        c.rect(x + 2, y + h // 2, px - x - 2, 2, INT_POST)
    if floor_straw and h >= 10:
        # Sunlit straw spilling 3px inside the doorway threshold
        c.rect(x + 1, y + h - 4, w - 2, 4, STRAW_DARK)
        c.rect(x + 2, y + h - 3, w - 4, 2, STRAW_MID)
        for sx in range(x + 3, x + w - 4, 5):
            c.rect(sx, y + h - 2, 3, 1, STRAW_LIT)


def _hinge(c: C, x: int, y: int, length: int, right_to_left: bool = False):
    """Wrought-iron strap hinge with bright top edge, dark underside, and bolt head."""
    if right_to_left:
        c.rect(x - length + 1, y, length, 2, IRON[5])
        c.rect(x - length + 2, y, length - 2, 1, IRON[2])
        c.p(x - length + 1, y, IRON[4])
        c.p(x - 1, y, IRON[1])
    else:
        c.rect(x, y, length, 2, IRON[5])
        c.rect(x + 1, y, length - 2, 1, IRON[2])
        c.p(x + length - 1, y, IRON[4])
        c.p(x + 1, y, IRON[1])


def _dutch_leaf(c: C, x: int, y: int, w: int, h: int, r, brace: bool = True, hinge_left: bool = True):
    """One framed vertical-plank Dutch door leaf with top/bottom rails, optional
    diagonal Z-brace (with highlight + shadow), and wrought-iron strap hinges."""
    _vplanks(c, x, y, w, h, r, plank_w=4)
    # Recessed border shadow inside stiles/rails
    if w >= 6 and h >= 8:
        # Top & bottom horizontal rails
        c.rect(x, y, w, 2, r[2])
        c.rect(x, y + 2, w, 1, r[5])
        c.rect(x, y + h - 3, w, 2, r[4])
        c.rect(x, y + h - 1, w, 1, r[6])
        # Left & right vertical stiles
        c.rect(x, y, 2, h, r[2])
        c.rect(x + 2, y + 2, 1, h - 4, r[5])
        c.rect(x + w - 2, y, 2, h, r[5])
        c.rect(x + w - 1, y, 1, h, r[6])
        # Diagonal Z-brace across lower leaf (crisp 2px band with lit top + dark bottom)
        if brace and w >= 12 and h >= 12:
            steps = min(w - 6, h - 6)
            for k in range(steps):
                bx = x + 3 + int(k * (w - 7) / max(1, steps - 1))
                by = y + 3 + int(k * (h - 7) / max(1, steps - 1))
                c.p(bx, by - 1, r[1])
                c.p(bx, by, r[3])
                c.p(bx, by + 1, r[6])
    # Wrought-iron strap hinges
    hlen = min(6, max(3, w - 3))
    _hinge(c, x if hinge_left else x + w - 1, y + 3, hlen, right_to_left=not hinge_left)
    if h >= 14:
        _hinge(c, x if hinge_left else x + w - 1, y + h - 5, hlen, right_to_left=not hinge_left)


def _dutch_door(c: C, x: int, y: int, w: int, h: int, frame_r, leaf_r, state: str, swing_right: bool = False):
    """Horse-scale Dutch half-door with proud frame, thick masonry/timber reveal,
    worn stone threshold, and clean closed / half-open / wide-open states."""
    # Heavy projecting lintel & jambs
    raised(c, x - 3, y - 3, w + 6, 4, frame_r, body=3)
    cast(c, x - 3, y + 1, w + 6, 2, k0=0.58)
    raised(c, x - 3, y, 3, h, frame_r, body=3)
    raised(c, x + w, y, 3, h, frame_r, body=4)
    # Worn limestone threshold step
    stone = RAMPS["limestone"]
    c.rect(x - 3, y + h, w + 6, 2, stone[4])
    c.rect(x - 2, y + h, w + 4, 1, stone[1])

    _interior_bay(c, x, y + 1, w, h - 1)
    mid = y + (h * 48) // 100
    top_h = mid - (y + 1)
    bot_h = (y + h) - (mid + 1)

    if state == "closed":
        _dutch_leaf(c, x, y + 1, w, top_h, leaf_r, brace=False, hinge_left=not swing_right)
        _dutch_leaf(c, x, mid + 1, w, bot_h, leaf_r, brace=True, hinge_left=not swing_right)
        # Clean horizontal Dutch split shadow & iron slide-bolt
        c.rect(x, mid, w, 1, IRON[7])
        bx = x + (3 if swing_right else w - 6)
        c.rect(bx, mid - 1, 4, 2, IRON[4])
        c.rect(bx, mid - 1, 3, 1, IRON[1])
        reveal(c, x, y + 1, w, h - 1, depth=2)
    elif state == "half":
        # Lower leaf latched, catching bright sunlight along its top ledge!
        _dutch_leaf(c, x, mid + 1, w, bot_h, leaf_r, brace=True, hinge_left=not swing_right)
        c.rect(x, mid, w, 1, leaf_r[1])
        c.rect(x, mid + 1, w, 1, leaf_r[2])
        # Upper leaf folded neatly inward/outward (5px foreshortened panel with cast shadow!)
        if swing_right:
            ox = x + w + 3
            cast(c, ox + 1, y + 2, 6, top_h, k0=0.65)
            _dutch_leaf(c, ox, y + 1, 5, top_h, leaf_r, brace=False, hinge_left=True)
        else:
            ox = x - 8
            cast(c, ox + 1, y + 2, 6, top_h, k0=0.65)
            _dutch_leaf(c, ox, y + 1, 5, top_h, leaf_r, brace=False, hinge_left=False)
        reveal(c, x, y + 1, w, h - 1, depth=2)
    else:  # wide-open: both leaves swung cleanly back into the shadowed jamb reveal!
        # Drawing open leaves foreshortened inside the doorway edge gives huge 3D depth
        # AND never overlaps neighboring windows or columns!
        if swing_right:
            _dutch_leaf(c, x + w - 4, y + 1, 4, top_h, leaf_r, brace=False, hinge_left=False)
            _dutch_leaf(c, x + w - 4, mid + 1, 4, bot_h, leaf_r, brace=False, hinge_left=False)
            c.rect(x + w - 5, y + 1, 1, h - 1, INT_DEEP)
        else:
            _dutch_leaf(c, x, y + 1, 4, top_h, leaf_r, brace=False, hinge_left=True)
            _dutch_leaf(c, x, mid + 1, 4, bot_h, leaf_r, brace=False, hinge_left=True)
            c.rect(x + 4, y + 1, 1, h - 1, INT_DEEP)
        reveal(c, x, y + 1, w, h - 1, depth=2)


def _arched_portal(c: C, x: int, y: int, w: int, h: int, stone_r, door_r, state: str, keystone: bool = True):
    """Segmental-arched double carriage/horse portal with dressed limestone
    voussoirs, proud keystone, recessed vertical-plank doors, and iron strapwork."""
    cx = x + w // 2
    rx = w / 2.0
    arch_h = 8

    def _in_arch(xx: int, yy: int, r_pad: float = 0.0) -> bool:
        if yy >= y + arch_h:
            return x - r_pad <= xx < x + w + r_pad
        dx = (xx - cx + 0.5) / max(1.0, rx + r_pad)
        dy = (yy - (y + arch_h)) / max(1.0, arch_h + r_pad)
        return dx * dx + dy * dy <= 1.0

    # Deep shadowed arched interior
    _interior_bay(c, x, y + 1, w, h - 1)
    # Clip upper corners back out (will be covered by voussoirs)
    hw = w // 2

    if state == "closed":
        _vplanks(c, x, y, w, h, door_r, plank_w=4)
        # Horizontal ledges across double doors
        for ly in (y + arch_h + 3, y + h - 8):
            c.rect(x, ly, w, 2, door_r[4])
            c.rect(x, ly, w, 1, door_r[2])
            c.rect(x, ly + 2, w, 1, door_r[6])
        # Meeting astragal & double iron ring pulls
        c.rect(cx - 1, y, 2, h, door_r[6])
        c.rect(cx - 1, y, 1, h, door_r[4])
        for rx_p in (cx - 4, cx + 2):
            c.rect(rx_p, y + h // 2 + 2, 3, 3, IRON[4])
            c.p(rx_p + 1, y + h // 2 + 3, door_r[5])
            c.p(rx_p, y + h // 2 + 2, IRON[1])
        # Iron strap hinges on both sides
        for hy in (y + arch_h + 4, y + h - 7):
            _hinge(c, x + 1, hy, 8, right_to_left=False)
            _hinge(c, x + w - 2, hy, 8, right_to_left=True)
    elif state == "half":
        # Left leaf closed, right leaf swung inward into the deep arch!
        _vplanks(c, x, y, hw, h, door_r, plank_w=4)
        for ly in (y + arch_h + 3, y + h - 8):
            c.rect(x, ly, hw, 2, door_r[4])
            c.rect(x, ly, hw, 1, door_r[2])
            _hinge(c, x + 1, ly + 1, 7, right_to_left=False)
        c.rect(cx - 1, y, 1, h, door_r[6])
        # Foreshortened right leaf open inside the right jamb
        _vplanks(c, x + w - 5, y + arch_h, 5, h - arch_h, door_r, plank_w=3)
        c.rect(x + w - 6, y + arch_h, 1, h - arch_h, INT_DEEP)
    else:  # wide-open: both leaves swung cleanly inward along the jambs!
        _vplanks(c, x, y + arch_h, 4, h - arch_h, door_r, plank_w=3)
        c.rect(x + 4, y + arch_h, 1, h - arch_h, INT_DEEP)
        _vplanks(c, x + w - 4, y + arch_h, 4, h - arch_h, door_r, plank_w=3)
        c.rect(x + w - 5, y + arch_h, 1, h - arch_h, INT_DEEP)

    # Dark inner arch soffit reveal (2px shadow curve inside the opening)
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            if _in_arch(xx, yy, 0.0) and not _in_arch(xx, yy - 2, -1.5):
                q = c.g(xx, yy)
                if q[3]:
                    c.p(xx, yy, (int(q[0] * 0.58), int(q[1] * 0.56), int(min(255, q[2] * 0.65)), 255))

    # Dressed limestone arch voussoirs + jamb piers
    for yy in range(y - 4, y + arch_h + 1):
        for xx in range(x - 4, x + w + 4):
            if not _in_arch(xx, yy, 0.0) and _in_arch(xx, yy, 3.6) and yy <= y + arch_h:
                band = (abs(xx - cx) // 5) % 2
                outer = not _in_arch(xx, yy, 2.4)
                col = stone_r[1] if (outer and yy < y + 2) else (stone_r[2] if band == 0 else stone_r[3])
                if not _in_arch(xx, yy + 1, 0.0) and _in_arch(xx, yy + 1, 1.0):
                    col = stone_r[5]  # underside rim of arch
                c.p(xx, yy, col)
    # Proud keystone at crown of arch
    if keystone:
        raised(c, cx - 3, y - 5, 6, 6, stone_r, body=1)
        cast(c, cx - 3, y + 1, 6, 2, k0=0.55)
    # Side jamb blocks
    raised(c, x - 3, y + arch_h, 3, h - arch_h, stone_r, body=2)
    raised(c, x + w, y + arch_h, 3, h - arch_h, stone_r, body=3)
    # Worn stone sill
    c.rect(x - 3, y + h, w + 6, 2, stone_r[4])
    c.rect(x - 2, y + h, w + 4, 1, stone_r[1])


def _sliding_door(c: C, x: int, y: int, w: int, h: int, frame_r, leaf_r, state: str):
    """East Asian rail-hung sliding stall door: overhead track beam with iron
    rollers, open upper wooden grille over dark interior, beveled cedar lower
    panel, gliding cleanly onto its own wall pocket."""
    # Overhead track beam (runs across doorway + right pocket)
    raised(c, x - 2, y - 4, w + 16, 4, frame_r, body=3)
    cast(c, x - 2, y, w + 16, 2, k0=0.55)
    raised(c, x - 2, y, 2, h, frame_r, body=3)
    raised(c, x + w, y, 2, h, frame_r, body=4)
    c.rect(x - 2, y + h, w + 4, 2, RAMPS["granite"][4])
    c.rect(x - 2, y + h, w + 4, 1, RAMPS["granite"][2])

    _interior_bay(c, x, y + 1, w, h - 1)
    reveal(c, x, y + 1, w, h - 1, depth=2)

    slide = 0 if state == "closed" else (w // 2 if state == "half" else w - 4)
    dx = x + slide
    # Cast shadow of sliding door onto doorway / wall pocket
    cast(c, dx + 1, y + 1, w, h - 1, k0=0.72)
    split = y + (h * 45) // 100

    # Iron roller hangers on overhead rail
    for rx in (dx + 3, dx + w - 5):
        c.rect(rx, y - 3, 2, 4, IRON[4])
        c.p(rx, y - 3, IRON[1])

    # Door outer timber frame
    raised(c, dx, y, w, 2, leaf_r, body=3)
    raised(c, dx, split, w, 2, leaf_r, body=3)
    raised(c, dx, y, 2, h, leaf_r, body=3)
    raised(c, dx + w - 2, y, 2, h, leaf_r, body=4)
    # Upper slatted timber grille (dark interior shows cleanly between bars!)
    c.rect(dx + 2, y + 2, w - 4, split - y - 2, INT_DEEP)
    for bx in range(dx + 4, dx + w - 3, 3):
        c.rect(bx, y + 2, 1, split - y - 2, leaf_r[2])
        c.rect(bx + 1, y + 2, 1, split - y - 2, leaf_r[5])
    # Lower vertical-plank cedar panel with recessed bevel
    _vplanks(c, dx + 2, split + 2, w - 4, y + h - split - 4, leaf_r, plank_w=4)
    c.rect(dx + 2, y + h - 2, w - 4, 2, leaf_r[5])
    # Iron recessed pull handle
    c.rect(dx + 3, split + 4, 2, 4, IRON[4])
    c.p(dx + 3, split + 4, IRON[1])


# ------------------------------------------------------------ 5 Archetypes
def draw_timber_barn(state: str = "closed") -> Image.Image:
    """Archetype 1: Timber-framed barn stable with gabled hayloft hood,
    diagonal oak braces, and twin horse-scale Dutch half-door stalls."""
    W, L, B, H = 118, 12, 120, 56
    c = C(W + 24, B + 8)
    wall = RAMPS["render"]
    wood = WOOD_WARM
    roof = SHINGLE_RICH
    cx = L + W // 2

    # Stone plinth + horizontal lower wainscot + warm plaster upper wall
    m.rubble(c, L, B - 7, W, 7, RAMPS["granite"])
    m.boards(c, L, B - 28, W, 21, wood, board=5)
    m.render(c, L, B - H, W, H - 28, wall)

    # Heavy oak framing: posts, mid-rail, top plate, diagonal corner braces
    for px in (L, L + 38, L + 76, L + W - 4):
        raised(c, px, B - H, 4, H - 6, OAK, body=4)
    raised(c, L, B - 30, W, 3, OAK, body=4)
    raised(c, L, B - H, W, 3, OAK, body=4)
    # Diagonal oak knee braces in upper center bay
    for k in range(7):
        c.rect(L + 42 + k, B - H + 9 - k, 2, 2, OAK[4])
        c.rect(L + 74 - k, B - H + 9 - k, 2, 2, OAK[4])
    cast(c, L, B - 2, W, 2, k0=0.28)

    # Shingle pitched roof (38px rise) + proper gabled hayloft dormer & hoist!
    roof_y = B - H
    _outbuilding_roof(c, L - 5, roof_y - 38, W + 10, 38, 'timber', roof)
    cast(c, L, roof_y, W, 5, k0=0.45)

    lw, lh = 28, 22
    lx0, ly0 = cx - lw // 2, roof_y - lh + 2
    m.boards(c, lx0, ly0, lw, lh, wood, board=4)
    raised(c, lx0, ly0, 2, lh, OAK, body=4)
    raised(c, lx0 + lw - 2, ly0, 2, lh, OAK, body=5)
    # Gabled shingle roof over the hayloft hood + lit verge
    for dy in range(12):
        sp = max(2, round((dy + 2) * (lw // 2 + 4) / 12))
        c.rect(cx - sp, ly0 - 11 + dy, sp * 2, 1, roof[2 if dy < 5 else 3])
        c.p(cx - sp, ly0 - 11 + dy, roof[1])
        c.p(cx + sp - 1, ly0 - 11 + dy, roof[6])
    # Hayloft shuttered hatch (closed / open showing golden hay!)
    hx, hy, hw, hh = cx - 8, ly0 + 5, 16, 15
    if state == "closed":
        _dutch_leaf(c, hx, hy, hw, hh, OAK, brace=False, hinge_left=True)
        c.rect(cx, hy, 1, hh, IRON[7])
    else:
        c.rect(hx, hy, hw, hh, INT_DEEP)
        c.rect(hx + 2, hy + hh - 5, hw - 4, 4, STRAW_MID)
        c.rect(hx + 3, hy + hh - 5, hw - 6, 1, STRAW_LIT)
        _vplanks(c, hx - 5, hy, 5, hh, OAK, plank_w=3)
        _vplanks(c, hx + hw, hy, 5, hh, OAK, plank_w=3)
    # Projecting oak hoist beam + iron pulley wheel
    raised(c, cx - 2, ly0 - 4, 4, 7, OAK, body=3)
    c.rect(cx - 1, ly0 + 3, 2, 3, IRON[3])
    c.p(cx, ly0 + 4, IRON[1])

    # Two horse-scale Dutch half-door stalls (left swings left, right swings right!)
    _dutch_door(c, L + 10, B - 44, 22, 42, OAK, DOOR_GREEN, state, swing_right=False)
    _dutch_door(c, L + 86, B - 44, 22, 42, OAK, DOOR_GREEN, state, swing_right=True)

    # Center barred stable vent window + wrought-iron tie ring
    wx, wy = cx - 9, B - 46
    raised(c, wx - 2, wy - 2, 22, 16, OAK, body=3)
    c.rect(wx, wy, 18, 12, INT_DEEP)
    for bx in range(wx + 3, wx + 17, 4):
        c.rect(bx, wy, 1, 12, IRON[4])
        c.p(bx, wy + 1, IRON[2])
    c.rect(cx - 2, B - 21, 4, 4, IRON[4])
    c.rect(cx - 1, B - 20, 2, 2, wood[4])
    c.p(cx - 2, B - 21, IRON[1])

    finish(c)
    consolidate(c, rare=4)
    return c.im


def draw_masonry_mews(state: str = "closed") -> Image.Image:
    """Archetype 2: Brick & limestone coaching/livery stable with keystoned
    segmental-arched double portal and flanking Dutch stall doors."""
    W, L, B, H = 124, 12, 120, 58
    c = C(W + 24, B + 8)
    brick_r = RAMPS["brick"]
    stone = RAMPS["limestone"]
    roof = RAMPS["slate"]
    cx = L + W // 2

    m.brick(c, L, B - H, W, H, brick_r)
    m.rubble(c, L, B - 7, W, 7, RAMPS["granite"])
    for i, yy in enumerate(range(B - H + 3, B - 8, 8)):
        qw = 7 if i % 2 == 0 else 4
        raised(c, L, yy, qw, 7, stone, body=2)
        raised(c, L + W - qw, yy, qw, 7, stone, body=3)
    raised(c, L - 1, B - H, W + 2, 4, stone, body=2)
    cast(c, L, B - 2, W, 2, k0=0.28)

    roof_y = B - H
    _outbuilding_roof(c, L - 4, roof_y - 36, W + 8, 36, 'stone', roof)
    cast(c, L, roof_y + 4, W, 4, k0=0.38)

    # Central keystoned arched double carriage/horse portal
    _arched_portal(c, cx - 17, B - 46, 34, 46, stone, OAK, state, keystone=True)

    # Flanking Dutch stall doors (outer swing, zero overlap with central arch!)
    _dutch_door(c, L + 12, B - 40, 20, 38, stone, DOOR_GREEN, state, swing_right=False)
    _dutch_door(c, L + W - 32, B - 40, 20, 38, stone, DOOR_GREEN, state, swing_right=True)

    # Arched clerestory ventilation fanlights above flanking stalls
    for vx in (L + 15, L + W - 29):
        raised(c, vx - 1, B - 53, 16, 8, stone, body=2)
        c.rect(vx, B - 52, 14, 6, INT_DEEP)
        for bx in (vx + 3, vx + 7, vx + 11):
            c.rect(bx, B - 52, 1, 6, IRON[3])

    finish(c)
    consolidate(c, rare=4)
    return c.im


def draw_arcade_khan(state: str = "closed") -> Image.Image:
    """Archetype 3: Warm plaster/adobe courtyard arcade stable (Mediterranean /
    Caravanserai / Ottoman Han / Spanish Posada) with three deep arched bays."""
    W, L, B, H = 124, 12, 120, 56
    c = C(W + 24, B + 8)
    wall = RAMPS["plaster-ochre"]
    trim = RAMPS["limestone"]
    wood = RAMPS["cedar"]
    roof = RAMPS["terracotta"]

    m.render(c, L, B - H, W, H, wall)
    m.rubble(c, L, B - 6, W, 6, trim)
    # Projecting cedar vigas under the terracotta eave
    for vx in range(L + 8, L + W - 6, 13):
        raised(c, vx, B - H + 3, 4, 4, wood, body=4)
        cast(c, vx, B - H + 7, 4, 2, k0=0.32)

    roof_y = B - H
    _outbuilding_roof(c, L - 4, roof_y - 34, W + 8, 34, 'med', roof)
    cast(c, L, roof_y, W, 4, k0=0.38)

    # Three deep keystoned arcade bays with recessed double stall doors
    for bx in (L + 10, L + 48, L + 86):
        _arched_portal(c, bx, B - 42, 28, 42, trim, wood, state, keystone=False)

    finish(c)
    consolidate(c, rare=4)
    return c.im


def draw_east_yizhan(state: str = "closed") -> Image.Image:
    """Archetype 4: East Asian post-station stable (Chinese yizhan / Japanese
    umayado) with dark kawara roof, eave brackets, and rail-hung sliding doors."""
    W, L, B, H = 126, 12, 120, 56
    c = C(W + 24, B + 8)
    cedar = RAMPS["cedar"]
    white = RAMPS["whitewash"]
    roof = RAMPS["kawara"]
    pillar = RAMPS["brick"]

    m.rubble(c, L, B - 6, W, 6, RAMPS["granite"])
    m.boards(c, L, B - H + 15, W, H - 21, cedar, board=5)
    m.whitewash(c, L, B - H, W, 15, white)
    raised(c, L, B - H + 14, W, 3, OAK, body=4)

    # Structural crimson-brown columns framing 3 distinct bays (left stall, center stall, right pocket/feed)
    for px in (L, L + 44, L + 88, L + W - 4):
        raised(c, px, B - H, 4, H - 5, pillar, body=4)

    roof_y = B - H
    _outbuilding_roof(c, L - 6, roof_y - 38, W + 12, 38, 'east', roof)
    cast(c, L, roof_y, W, 5, k0=0.45)
    # Eave bracket blocks under deep shadow
    for bx in (L + 1, L + 45, L + 89, L + W - 3):
        c.rect(bx - 1, roof_y, 5, 3, OAK[3])
        c.rect(bx, roof_y + 3, 3, 2, OAK[5])
    # Turned ridge end caps
    raised(c, L - 3, roof_y - 38, 6, 6, roof, body=2)
    raised(c, L + W - 3, roof_y - 38, 6, 6, roof, body=3)

    # Two wide rail-hung sliding stall doors, each with clean right-side wall pocket!
    _sliding_door(c, L + 7, B - 40, 22, 38, OAK, cedar, state)
    _sliding_door(c, L + 51, B - 40, 22, 38, OAK, cedar, state)

    # Right bay: slatted feed-room window
    wx, wy = L + 96, B - 36
    raised(c, wx - 2, wy - 2, 22, 16, OAK, body=3)
    c.rect(wx, wy, 18, 12, INT_DEEP)
    for sx in range(wx + 3, wx + 17, 3):
        c.rect(sx, wy, 1, 12, cedar[2])
        c.rect(sx + 1, wy, 1, 12, cedar[5])

    finish(c)
    consolidate(c, rare=4)
    return c.im


def draw_open_shed(state: str = "closed") -> Image.Image:
    """Archetype 5: Open-front timber & thatch horse shelter (Steppe yam /
    ancient & rural paddock shed) with heavy posts, knee braces & paddock gate."""
    W, L, B, H = 114, 12, 120, 50
    c = C(W + 24, B + 8)
    wood = WOOD_WARM
    roof = THATCH_WARM

    # Deep shaded open interior + back plank wall + twin golden hayracks
    _interior_bay(c, L + 3, B - H + 4, W - 6, H - 4, floor_straw=True)
    m.boards(c, L + 5, B - H + 6, W - 10, H - 14, OAK, board=6)
    cast(c, L + 4, B - H + 4, W - 8, H - 10, k0=0.52)
    # Recessed twin hayracks on back wall
    for rx0 in (L + 14, L + 72):
        c.rect(rx0, B - 30, 28, 8, STRAW_DARK)
        c.rect(rx0 + 2, B - 29, 24, 5, STRAW_MID)
        c.rect(rx0 + 4, B - 29, 20, 2, STRAW_LIT)
        c.rect(rx0 - 1, B - 22, 30, 2, OAK[4])
        for rx in range(rx0 + 1, rx0 + 28, 4):
            c.rect(rx, B - 31, 1, 10, OAK[5])

    # Four heavy structural posts + top plate + diagonal knee braces
    posts = (L, L + 37, L + 74, L + W - 4)
    for px in posts:
        raised(c, px, B - H, 4, H, OAK, body=4)
    raised(c, L - 1, B - H, W + 2, 4, OAK, body=3)
    for px in (L + 4, L + 41, L + 78):
        for k in range(6):
            c.rect(px + k, B - H + 9 - k, 2, 2, OAK[4])
            c.rect(px + 31 - k, B - H + 9 - k, 2, 2, OAK[4])

    roof_y = B - H
    _outbuilding_roof(c, L - 6, roof_y - 36, W + 12, 36, 'wattle', roof)
    cast(c, L, roof_y + 4, W, 5, k0=0.45)

    # Left & right half-height vertical-plank stall kick-walls with sunlit cap rail
    for sx in (L + 4, L + 78):
        _vplanks(c, sx, B - 20, 33, 18, wood, plank_w=5)
        raised(c, sx, B - 22, 33, 3, OAK, body=2)
        cast(c, sx, B - 19, 33, 2, k0=0.65)

    # Center mortised 3-rail paddock gate with diagonal brace & iron latch
    gx, gy, gw, gh = L + 41, B - 23, 33, 21
    if state == "closed":
        for ry in (gy + 2, gy + 9, gy + 16):
            raised(c, gx, ry, gw, 3, wood, body=2)
        # Diagonal brace across rails
        for k in range(16):
            bx = gx + 3 + int(k * (gw - 8) / 15)
            by = gy + 3 + k
            c.p(bx, by, wood[1]); c.p(bx + 1, by, wood[4])
        raised(c, gx, gy, 3, gh, wood, body=3)
        raised(c, gx + gw - 3, gy, 3, gh, wood, body=4)
        _hinge(c, gx, gy + 3, 5)
        _hinge(c, gx, gy + gh - 5, 5)
        c.rect(gx + gw - 4, gy + 8, 4, 2, IRON[4])
        c.p(gx + gw - 3, gy + 8, IRON[1])
    elif state == "half":
        # Swung ajar inward (foreshortened 15px with cast shadow)
        cast(c, gx + 1, gy + 1, 16, gh, k0=0.7)
        for ry in (gy + 2, gy + 9, gy + 16):
            raised(c, gx, ry, 15, 3, wood, body=2)
        raised(c, gx, gy, 3, gh, wood, body=3)
        raised(c, gx + 13, gy + 1, 3, gh - 1, wood, body=4)
        _hinge(c, gx, gy + 3, 4)
    else:  # wide-open: folded back cleanly inside the left post
        raised(c, gx, gy, 4, gh, wood, body=4)
        c.rect(gx + 4, gy, 1, gh, INT_DEEP)

    finish(c)
    consolidate(c, rare=4)
    return c.im


# High-tier accents: brass/gold trim, copper patina, glazed cobalt/turquoise tile
GOLD_R = ramp(50, 0.14, lift=0.04)
COPPER_R = ramp(164, 0.08, lift=-0.04)
TILE_BLUE = ramp(212, 0.14, lift=-0.06)
TILE_TURQ = ramp(184, 0.13, lift=-0.02)
CRIMSON_R = ramp(12, 0.14, lift=-0.10)


def _lantern(c: C, x: int, y: int):
    """Wall-mounted brass carriage lantern with warm glass glow."""
    c.rect(x - 1, y, 5, 1, IRON[3])
    c.rect(x, y + 1, 3, 5, GOLD_R[2])
    c.rect(x + 1, y + 2, 1, 3, (250, 232, 168, 255))
    c.rect(x, y + 6, 3, 1, IRON[4])


def _mounting_block(c: C, x: int, y: int, stone_r):
    """Carved two-step stone mounting block (shangmashi / manor mounting step)."""
    raised(c, x, y - 5, 6, 5, stone_r, body=2)
    raised(c, x + 5, y - 9, 6, 9, stone_r, body=2)
    cast(c, x, y, 11, 2, k0=0.45)


def _cupola(c: C, cx: int, base_y: int, w: int, h: int, stone_r, dome_r, clock: bool = True):
    """Roof lantern/clock cupola with spire and wrought-iron weathervane."""
    # Pedestal & louvered/clock drum
    raised(c, cx - w // 2 - 2, base_y - 4, w + 4, 4, stone_r, body=2)
    raised(c, cx - w // 2, base_y - h, w, h - 4, stone_r, body=1)
    if clock and w >= 12:
        # Crisp clockface dial
        cr = 4
        cy = base_y - h // 2 - 2
        for yy in range(cy - cr, cy + cr + 1):
            for xx in range(cx - cr, cx + cr + 1):
                if (xx - cx) ** 2 + (yy - cy) ** 2 <= cr * cr:
                    c.p(xx, yy, (246, 240, 224, 255))
                elif (xx - cx) ** 2 + (yy - cy) ** 2 <= (cr + 1) ** 2:
                    c.p(xx, yy, GOLD_R[4])
        c.rect(cx, cy - 3, 1, 4, IRON[7])
        c.rect(cx, cy, 3, 1, IRON[7])
    else:
        for lx in range(cx - w // 2 + 2, cx + w // 2 - 2, 3):
            c.rect(lx, base_y - h + 3, 2, h - 9, INT_DEEP)
    # Domed copper/slate cap + gilded finial & weathervane
    dome_h = max(7, w // 2)
    for dy in range(dome_h):
        u = dy / max(1, dome_h - 1)
        hw = max(1, round((w // 2 + 2) * (1.0 - (1.0 - u) ** 2) ** 0.5))
        col = dome_r[1 if dy < dome_h // 3 else (2 if dy < (dome_h * 2) // 3 else 4)]
        c.rect(cx - hw, base_y - h - dome_h + dy, hw * 2, 1, col)
        c.p(cx - hw, base_y - h - dome_h + dy, dome_r[0])
        c.p(cx + hw - 1, base_y - h - dome_h + dy, dome_r[6])
    # Spire & weathervane arrow
    sy = base_y - h - dome_h
    c.rect(cx, sy - 7, 1, 7, GOLD_R[2])
    c.rect(cx - 1, sy - 2, 3, 2, GOLD_R[1])
    c.rect(cx - 5, sy - 5, 11, 1, IRON[4])
    c.p(cx + 5, sy - 6, IRON[2])
    c.p(cx + 5, sy - 4, IRON[4])


def draw_gentry_mews(state: str = "closed") -> Image.Image:
    """Tier A1: Upper-class / gentry coach-house & stable — dressed limestone &
    brick pilasters, slate roof with copper clock cupola, central arched coach
    portal, flanking Dutch stalls, brass lanterns & stone mounting block."""
    W, L, B, H = 132, 12, 144, 62
    c = C(W + 24, B + 8)
    brick_r = RAMPS["brick"]
    stone = RAMPS["limestone"]
    roof = RAMPS["slate"]
    cx = L + W // 2

    m.brick(c, L, B - H, W, H, brick_r)
    m.rubble(c, L, B - 8, W, 8, RAMPS["granite"])
    # Dressed limestone corner pilasters & horizontal belt course
    for px in (L, L + 38, L + W - 44, L + W - 6):
        raised(c, px, B - H + 4, 6, H - 12, stone, body=2)
    raised(c, L - 2, B - H, W + 4, 5, stone, body=1)
    raised(c, L, B - 47, W, 3, stone, body=2)
    cast(c, L, B - 2, W, 2, k0=0.28)

    roof_y = B - H
    _outbuilding_roof(c, L - 5, roof_y - 38, W + 10, 38, 'stone', roof)
    cast(c, L, roof_y + 5, W, 4, k0=0.40)
    _cupola(c, cx, roof_y - 34, 14, 16, stone, COPPER_R, clock=True)

    # Central keystoned carriage archway (for coach + pair)
    _arched_portal(c, cx - 19, B - 46, 38, 46, stone, OAK, state, keystone=True)
    # Flanking brass carriage lanterns
    _lantern(c, cx - 26, B - 38)
    _lantern(c, cx + 24, B - 38)

    # Flanking Dutch horse-stall doors
    _dutch_door(c, L + 11, B - 41, 20, 39, stone, DOOR_GREEN, state, swing_right=False)
    _dutch_door(c, L + W - 31, B - 41, 20, 39, stone, DOOR_GREEN, state, swing_right=True)

    # Upper arched clerestory fanlights above stalls
    for vx in (L + 14, L + W - 28):
        raised(c, vx - 1, B - 57, 16, 8, stone, body=2)
        c.rect(vx, B - 56, 14, 6, INT_DEEP)
        for bx in (vx + 3, vx + 7, vx + 11):
            c.rect(bx, B - 56, 1, 6, GOLD_R[3])

    # Carved limestone mounting block beside the left carriage pier
    _mounting_block(c, L + 34, B, stone)

    finish(c)
    consolidate(c, rare=4)
    return c.im


def draw_gentry_east(state: str = "closed") -> Image.Image:
    """Tier A2: East Asian mansion / fu courtyard stable — ornate dark kawara
    roof with chiwen ridge terminals, painted dougong brackets, crimson lacquered
    columns, sliding lattice stall doors, and carved shangmashi mounting stone."""
    W, L, B, H = 134, 12, 144, 60
    c = C(W + 24, B + 8)
    cedar = RAMPS["cedar"]
    white = RAMPS["whitewash"]
    roof = RAMPS["kawara"]
    stone = RAMPS["limestone"]

    m.rubble(c, L, B - 8, W, 8, RAMPS["granite"])
    m.boards(c, L, B - H + 18, W, H - 26, cedar, board=5)
    m.whitewash(c, L, B - H, W, 18, white)
    # Lacquered crimson fascia beam + gold trim line
    raised(c, L, B - H + 16, W, 4, CRIMSON_R, body=3)
    c.rect(L + 2, B - H + 17, W - 4, 1, GOLD_R[2])

    # Four lacquered crimson structural columns
    cols = (L, L + 44, L + 88, L + W - 5)
    for px in cols:
        raised(c, px, B - H, 5, H - 7, CRIMSON_R, body=3)
        raised(c, px - 1, B - 9, 7, 3, stone, body=2)  # carved stone column plinths!

    roof_y = B - H
    _outbuilding_roof(c, L - 7, roof_y - 42, W + 14, 42, 'east', roof)
    cast(c, L, roof_y, W, 6, k0=0.46)
    # Ornate painted dougong bracket clusters under the deep eave
    for bx in cols:
        c.rect(bx - 2, roof_y, 9, 3, CRIMSON_R[2])
        c.rect(bx - 1, roof_y + 3, 7, 2, GOLD_R[3])
        c.rect(bx, roof_y + 5, 5, 2, OAK[5])
    # Sculpted ridge finials (chiwen) & central ridge ornament
    raised(c, L - 4, roof_y - 46, 7, 9, roof, body=1)
    raised(c, L + W - 3, roof_y - 46, 7, 9, roof, body=2)
    raised(c, L + W // 2 - 4, roof_y - 45, 8, 5, GOLD_R, body=2)

    # Three carved upper lattice clerestory transoms in the white frieze
    for tx in (L + 10, L + 54, L + 98):
        raised(c, tx - 1, B - H + 4, 28, 9, CRIMSON_R, body=4)
        c.rect(tx, B - H + 5, 26, 7, INT_DEEP)
        for sx in range(tx + 3, tx + 25, 4):
            c.rect(sx, B - H + 5, 1, 7, GOLD_R[3])

    # Two wide lacquered sliding horse-stall doors + right carriage/tack bay
    _sliding_door(c, L + 8, B - 40, 22, 38, CRIMSON_R, cedar, state)
    _sliding_door(c, L + 52, B - 40, 22, 38, CRIMSON_R, cedar, state)
    _sliding_door(c, L + 95, B - 40, 20, 38, CRIMSON_R, cedar, state)

    # Carved stone mounting block (shangmashi) by the left column
    _mounting_block(c, L + 34, B, stone)

    finish(c)
    consolidate(c, rare=4)
    return c.im


def draw_palace_mews(state: str = "closed") -> Image.Image:
    """Tier B1: Royal / Imperial Palace Mews (Grande Ecurie / Royal Mews) —
    cut limestone ashlar, central pedimented triumphal carriage arch, gilded
    clock cupola, flanking arched stall portals, balustrade & brass lanterns."""
    W, L, B, H = 160, 12, 152, 66
    c = C(W + 24, B + 8)
    stone = RAMPS["limestone"]
    granite = RAMPS["granite"]
    roof = RAMPS["slate"]
    cx = L + W // 2

    # Cut limestone ashlar facade + rusticated granite base plinth
    m.render(c, L, B - H, W, H, stone)
    for yy in range(B - H + 8, B - 8, 8):
        c.rect(L + 2, yy, W - 4, 1, stone[4])
    m.rubble(c, L, B - 9, W, 9, granite)
    # Classical cornice + balustraded parapet
    raised(c, L - 3, B - H, W + 6, 5, stone, body=1)
    for bx in range(L + 4, L + W - 4, 6):
        c.rect(bx, B - H - 6, 3, 6, stone[2])
        c.p(bx, B - H - 6, stone[0])
    raised(c, L - 2, B - H - 8, W + 4, 3, stone, body=1)

    roof_y = B - H - 8
    _outbuilding_roof(c, L - 4, roof_y - 34, W + 8, 34, 'stone', roof)
    cast(c, L, B - H + 5, W, 4, k0=0.38)
    _cupola(c, cx, roof_y - 30, 16, 18, stone, COPPER_R, clock=True)

    # Central classical pedimented pavilion framing the grand carriage arch
    pw = 54
    raised(c, cx - pw // 2, B - H + 4, 5, H - 12, stone, body=1)
    raised(c, cx + pw // 2 - 5, B - H + 4, 5, H - 12, stone, body=2)
    # Triangular classical pediment over central bay + gilded royal crest medallion
    for dy in range(13):
        sp = max(3, round((dy + 2) * (pw // 2 + 4) / 13))
        c.rect(cx - sp, B - H - 10 + dy, sp * 2, 1, stone[2 if dy > 2 else 1])
        c.p(cx - sp, B - H - 10 + dy, stone[0])
        c.p(cx + sp - 1, B - H - 10 + dy, stone[5])
    # Royal golden crest medallion in pediment tympanum
    c.rect(cx - 4, B - H - 3, 8, 5, GOLD_R[2])
    c.rect(cx - 3, B - H - 2, 6, 3, CRIMSON_R[2])
    c.rect(cx - 1, B - H - 2, 2, 3, GOLD_R[1])

    # Grand central triumphal carriage arch + flanking royal horse-stall arches!
    _arched_portal(c, cx - 19, B - 50, 38, 50, stone, OAK, state, keystone=True)
    _arched_portal(c, L + 12, B - 44, 28, 44, stone, DOOR_GREEN, state, keystone=True)
    _arched_portal(c, L + W - 40, B - 44, 28, 44, stone, DOOR_GREEN, state, keystone=True)

    # Brass palace carriage lanterns flanking the central triumphal arch
    _lantern(c, cx - 25, B - 40)
    _lantern(c, cx + 23, B - 40)
    _mounting_block(c, L + 45, B, stone)

    finish(c)
    consolidate(c, rare=4)
    return c.im


def draw_palace_arcade(state: str = "closed") -> Image.Image:
    """Tier B2: Imperial Islamic / Silk Road Palace Stables (Ottoman Has Ahir /
    Mughal Astabal) — warm cut sandstone, glazed turquoise-and-cobalt tile
    spandrels, crenellated parapet, central ribbed dome, and triple arched bays."""
    W, L, B, H = 160, 12, 152, 64
    c = C(W + 24, B + 8)
    sand = RAMPS["plaster-ochre"]
    stone = RAMPS["limestone"]
    cedar = RAMPS["cedar"]
    cx = L + W // 2

    m.render(c, L, B - H, W, H, sand)
    m.rubble(c, L, B - 8, W, 8, stone)
    # Glazed cobalt & turquoise frieze band below the parapet!
    c.rect(L + 2, B - H + 5, W - 4, 8, TILE_BLUE[3])
    c.rect(L + 2, B - H + 5, W - 4, 1, GOLD_R[2])
    c.rect(L + 2, B - H + 12, W - 4, 1, GOLD_R[2])
    for tx in range(L + 6, L + W - 6, 8):
        c.rect(tx, B - H + 7, 4, 4, TILE_TURQ[2])
        c.p(tx + 1, B - H + 8, GOLD_R[1])

    # Crenellated stepped parapet along the roofline
    raised(c, L - 2, B - H, W + 4, 4, stone, body=1)
    for mx in range(L, L + W - 4, 10):
        raised(c, mx, B - H - 6, 6, 6, stone, body=2)
    # Central ribbed turquoise palace dome rising above the pishtaq portal!
    dome_y = B - H - 6
    raised(c, cx - 28, dome_y - 8, 56, 12, stone, body=1)
    c.rect(cx - 24, dome_y - 5, 48, 6, TILE_BLUE[2])
    for tx in range(cx - 20, cx + 20, 8):
        c.rect(tx, dome_y - 4, 4, 4, TILE_TURQ[1])
    for dy in range(22):
        u = dy / 21.0
        hw = max(2, round(21 * (1.0 - (1.0 - u) ** 2.2) ** 0.5))
        col = TILE_TURQ[1 if dy < 7 else (2 if dy < 15 else 4)]
        c.rect(cx - hw, dome_y - 30 + dy, hw * 2, 1, col)
        c.p(cx - hw, dome_y - 30 + dy, TILE_TURQ[0])
        c.p(cx + hw - 1, dome_y - 30 + dy, TILE_BLUE[5])
        if dy > 4 and hw > 6:
            c.p(cx - hw // 2, dome_y - 30 + dy, TILE_TURQ[0])
            c.p(cx + hw // 2, dome_y - 30 + dy, TILE_BLUE[4])
    # Golden crescent finial atop dome
    c.rect(cx, dome_y - 37, 1, 7, GOLD_R[1])
    c.rect(cx - 2, dome_y - 35, 5, 2, GOLD_R[2])

    # Three monumental arched royal stable portals with turquoise spandrel tiles
    for bx, bw, bh in ((L + 12, 32, 44), (cx - 20, 40, 48), (L + W - 44, 32, 44)):
        # Glazed tile spandrel corners
        c.rect(bx - 2, B - bh - 3, bw + 4, 10, TILE_BLUE[3])
        c.rect(bx, B - bh - 1, 4, 4, TILE_TURQ[1])
        c.rect(bx + bw - 4, B - bh - 1, 4, 4, TILE_TURQ[1])
        _arched_portal(c, bx, B - bh, bw, bh, stone, cedar, state, keystone=True)

    _lantern(c, cx - 25, B - 38)
    _lantern(c, cx + 23, B - 38)

    finish(c)
    consolidate(c, rare=4)
    return c.im


ARCHETYPES = [
    ("1. Timber Barn Stable", "N. Europe / Colonial (Dutch half-doors + hayloft)", draw_timber_barn),
    ("2. Masonry Mews / Mansio", "Roman / Coaching Inn / Brick Livery (keystoned arch)", draw_masonry_mews),
    ("3. Courtyard Arcade Stable", "Med / Caravanserai / Han / Posada (deep arches)", draw_arcade_khan),
    ("4. East Asian Post Stable", "Chinese Yizhan / Japanese Umayado (sliding doors)", draw_east_yizhan),
    ("5. Open-Front Paddock Shed", "Steppe Yam / Rural / Frontier (mortised gate)", draw_open_shed),
]

GRAND_ARCHETYPES = [
    ("A1. Gentry Coach-House & Mews", "European / Colonial manor (cupola, lanterns, mounting block)", draw_gentry_mews),
    ("A2. East Asian Mansion Stable", "Noble fu courtyard (dougong brackets, sliding stalls, shangmashi)", draw_gentry_east),
    ("B1. Royal Palace Mews", "Grande Ecurie / Royal Mews (pediment, clock cupola, triple arch)", draw_palace_mews),
    ("B2. Imperial Palace Stables", "Ottoman Has Ahir / Mughal Astabal (ribbed dome, tile spandrels)", draw_palace_arcade),
]

_DISPATCH = {
    "timber": (draw_timber_barn, dict(x0=12, W=118, base=120, door_x=33, door_h=42, door_width=22)),
    "masonry": (draw_masonry_mews, dict(x0=12, W=124, base=120, door_x=74, door_h=46, door_width=34)),
    "arcade": (draw_arcade_khan, dict(x0=12, W=124, base=120, door_x=74, door_h=42, door_width=28)),
    "east": (draw_east_yizhan, dict(x0=12, W=126, base=120, door_x=74, door_h=38, door_width=22)),
    "shed": (draw_open_shed, dict(x0=12, W=114, base=120, door_x=69, door_h=44, door_width=33)),
    "gentry-mews": (draw_gentry_mews, dict(x0=12, W=132, base=144, door_x=78, door_h=46, door_width=38)),
    "gentry-east": (draw_gentry_east, dict(x0=12, W=134, base=144, door_x=79, door_h=38, door_width=22)),
    "palace-mews": (draw_palace_mews, dict(x0=12, W=160, base=152, door_x=92, door_h=50, door_width=38)),
    "palace-arcade": (draw_palace_arcade, dict(x0=12, W=160, base=152, door_x=92, door_h=48, door_width=40)),
}


def draw_stable(style: str, info: dict) -> Image.Image:
    """Entry point for front_worksites.py: style is 'stable-<kind>' (half-open
    default), 'stable-<kind>-closed', or 'stable-<kind>-open'."""
    rest = style[len("stable-"):]
    if rest.endswith("-closed"):
        kind, state = rest[:-7], "closed"
    elif rest.endswith("-open"):
        kind, state = rest[:-5], "open"
    else:
        kind, state = rest, "half"
    fn, meta = _DISPATCH[kind]
    im = fn(state)
    info.update(meta)
    return im


def build_contact_sheet(out_path: Path):
    from art.horse import draw_horse, _draw_human_scale_ref

    human = _draw_human_scale_ref()
    bay_horse = draw_horse("riding", "bay", "east", "idle", 0)

    z = 2
    cw, ch = 152 * z, 132 * z
    pad = 16
    label_w = 148
    sh_w = label_w + len(ARCHETYPES) * (cw + pad) + pad
    sh_h = 84 + len(DOOR_STATES) * (ch + pad) + 215 + 155

    bg = (30, 34, 40, 255)
    card = (44, 50, 58, 255)
    ground = (84, 96, 72, 255)
    accent = (240, 198, 102, 255)
    sub = (176, 184, 196, 255)

    sheet = Image.new("RGBA", (sh_w, sh_h), bg)
    d = ImageDraw.Draw(sheet)
    d.text((20, 14), "STABLE ARCHETYPE PROTOTYPES v2 (Improved Doors: Vertical Planks, Deep Reveals, Keystones & Inward Swing)", fill=accent)

    for ci, (title, subtitle, _) in enumerate(ARCHETYPES):
        cx = label_w + ci * (cw + pad)
        d.text((cx + 4, 42), title, fill=accent)
        d.text((cx + 4, 58), subtitle, fill=sub)

    row_labels = [
        ("CLOSED", "Latched / shut for night"),
        ("HALF-OPEN", "Dutch top / sliding / ajar"),
        ("WIDE-OPEN", "Full dynamic entry & exit"),
    ]
    for ri, state in enumerate(DOOR_STATES):
        ry = 82 + ri * (ch + pad)
        d.rounded_rectangle((12, ry, sh_w - 12, ry + ch), radius=8, fill=card)
        d.text((22, ry + 24), row_labels[ri][0], fill=accent)
        d.text((22, ry + 44), row_labels[ri][1], fill=sub)

        for ci, (_, _, fn) in enumerate(ARCHETYPES):
            cx = label_w + ci * (cw + pad)
            im = fn(state)
            imz = im.resize((im.width * z, im.height * z), Image.Resampling.NEAREST)
            gy = ry + ch - 14
            d.line((cx + 4, gy, cx + cw - 4, gy), fill=ground, width=2)
            ox = cx + (cw - imz.width) // 2
            oy = gy - imz.height + 6 * z
            sheet.paste(imz, (ox, oy), imz)
            if ri == 0 and ci == 0:
                hz = human.resize((human.width * z, human.height * z), Image.Resampling.NEAREST)
                bhz = bay_horse.resize((bay_horse.width * z, bay_horse.height * z), Image.Resampling.NEAREST)
                sheet.paste(hz, (cx + 6, gy - 52 * z), hz)
                sheet.paste(bhz, (cx + cw - bhz.width - 2, gy - 52 * z), bhz)

    # 3x zoomed DOOR CRAFT CLOSE-UP row so every hinge, plank, reveal & keystone is crystal clear!
    dy0 = 82 + len(DOOR_STATES) * (ch + pad) + 10
    d.rounded_rectangle((12, dy0, sh_w - 12, dy0 + 200), radius=8, fill=card)
    d.text((22, dy0 + 10), "3x DOOR CRAFT CLOSE-UPS (Left to right: Dutch Closed/Half, Keystoned Arch Closed/Half, Arcade Arch, East Sliding Half, Paddock Gate)", fill=accent)
    closeups = [
        (draw_timber_barn("closed"), (16, 68, 52, 124)),
        (draw_timber_barn("half"), (12, 68, 52, 124)),
        (draw_masonry_mews("closed"), (50, 64, 98, 124)),
        (draw_masonry_mews("half"), (50, 64, 98, 124)),
        (draw_arcade_khan("half"), (52, 68, 96, 124)),
        (draw_east_yizhan("half"), (12, 68, 62, 124)),
        (draw_open_shed("closed"), (44, 72, 92, 124)),
    ]
    ux = 26
    for im, box in closeups:
        cr = im.crop(box)
        crz = cr.resize((cr.width * 3, cr.height * 3), Image.Resampling.NEAREST)
        sheet.paste(crz, (ux, dy0 + 28), crz)
        ux += crz.width + 26

    # Bottom 1x native play-scale strip!
    sy = dy0 + 212
    d.rounded_rectangle((12, sy, sh_w - 12, sy + 144), radius=8, fill=(64, 78, 56, 255))
    d.text((22, sy + 10), "1x NATIVE PLAY SCALE LINEUP (37px Human + 64x56 Bay Horse + all 5 Stables in half-open state)", fill=accent)
    gy1 = sy + 132
    lx = 32
    sheet.paste(human, (lx, gy1 - 52), human)
    lx += 34
    sheet.paste(bay_horse, (lx, gy1 - 52), bay_horse)
    lx += 82
    for _, _, fn in ARCHETYPES:
        im = fn("half")
        sheet.paste(im, (lx, gy1 - im.height + 6), im)
        lx += im.width + 26

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    print(f"Saved {out_path}")


def build_grand_contact_sheet(out_path: Path):
    from art.horse import draw_horse, _draw_human_scale_ref

    human = _draw_human_scale_ref()
    war_horse = draw_horse("war", "dapple-grey", "east", "idle", 0)

    z = 2
    cw, ch = 192 * z, 166 * z
    pad = 16
    label_w = 148
    sh_w = label_w + len(GRAND_ARCHETYPES) * (cw + pad) + pad
    sh_h = 84 + len(DOOR_STATES) * (ch + pad) + 178

    bg = (30, 34, 40, 255)
    card = (44, 50, 58, 255)
    ground = (84, 96, 72, 255)
    accent = (240, 198, 102, 255)
    sub = (176, 184, 196, 255)

    sheet = Image.new("RGBA", (sh_w, sh_h), bg)
    d = ImageDraw.Draw(sheet)
    d.text((20, 14), "UPPER-CLASS GENTRY & ROYAL PALACE STABLES (Tier A & Tier B x 3 Dynamic Door States, 2x zoom + 1x play-scale strip)", fill=accent)

    for ci, (title, subtitle, _) in enumerate(GRAND_ARCHETYPES):
        cx = label_w + ci * (cw + pad)
        d.text((cx + 4, 42), title, fill=accent)
        d.text((cx + 4, 58), subtitle, fill=sub)

    row_labels = [
        ("CLOSED", "Shut / night"),
        ("HALF-OPEN", "Daytime / active"),
        ("WIDE-OPEN", "Carriage & horse entry"),
    ]
    for ri, state in enumerate(DOOR_STATES):
        ry = 82 + ri * (ch + pad)
        d.rounded_rectangle((12, ry, sh_w - 12, ry + ch), radius=8, fill=card)
        d.text((22, ry + 24), row_labels[ri][0], fill=accent)
        d.text((22, ry + 44), row_labels[ri][1], fill=sub)

        for ci, (_, _, fn) in enumerate(GRAND_ARCHETYPES):
            cx = label_w + ci * (cw + pad)
            im = fn(state)
            imz = im.resize((im.width * z, im.height * z), Image.Resampling.NEAREST)
            gy = ry + ch - 14
            d.line((cx + 4, gy, cx + cw - 4, gy), fill=ground, width=2)
            ox = cx + (cw - imz.width) // 2
            oy = gy - imz.height + 6 * z
            sheet.paste(imz, (ox, oy), imz)
            if ri == 0 and ci == 0:
                hz = human.resize((human.width * z, human.height * z), Image.Resampling.NEAREST)
                whz = war_horse.resize((war_horse.width * z, war_horse.height * z), Image.Resampling.NEAREST)
                sheet.paste(hz, (cx + 8, gy - 52 * z), hz)
                sheet.paste(whz, (cx + cw - whz.width - 4, gy - 52 * z), whz)

    sy = 82 + len(DOOR_STATES) * (ch + pad) + 10
    d.rounded_rectangle((12, sy, sh_w - 12, sy + 162), radius=8, fill=(64, 78, 56, 255))
    d.text((22, sy + 10), "1x NATIVE PLAY SCALE LINEUP (37px Human + Dapple Grey War Horse + Gentry & Royal Palace Stables)", fill=accent)
    gy1 = sy + 150
    lx = 32
    sheet.paste(human, (lx, gy1 - 52), human)
    lx += 34
    sheet.paste(war_horse, (lx, gy1 - 52), war_horse)
    lx += 82
    for _, _, fn in GRAND_ARCHETYPES:
        im = fn("half")
        sheet.paste(im, (lx, gy1 - im.height + 6), im)
        lx += im.width + 26

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    print(f"Saved {out_path}")


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    build_contact_sheet(root / "artifacts/stable-archetypes-sheet.png")
    build_grand_contact_sheet(root / "artifacts/grand-stables-sheet.png")
