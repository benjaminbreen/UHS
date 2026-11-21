"""Gold-standard procedural horse rig: four distinct breeds/builds (riding, work,
war, race), rich coat palettes, sculpted equine anatomy, and 8-frame gaits
(idle, walk, trot, gallop, rear) in all four cardinal directions.

Scale is calibrated against the 37px adult human sprite (~21.5 px/m):
- Current fauna-c horse (40x35 standing, ~22px withers) reads as a pony (~12hh).
- New horses stand 28-31px at the withers (~15-16.5hh), on a 64x56 canvas
  (6px headroom, 3px footroom matching the game's ground line).
"""
from __future__ import annotations

import math
from pathlib import Path
from PIL import Image, ImageDraw

from art.quality.hue import tint_outline

W, H = 64, 56
GROUND = 52

DIRECTIONS = ("south", "southeast", "east", "northeast", "north", "northwest", "west", "southwest")
STATES = {"horse": {"idle": 8, "graze": 8, "wander": 8, "trot": 8, "flee": 8, "rest": 8, "rear": 8}}
HEADROOM = {"horse": 6}
NATIVE_SIZES = {"horse": (W, H)}
STANDING_SIZES = {"horse": (W, H - HEADROOM["horse"] - 3)}

ROLES = "o s d m l h r p q t v w n k g e y u".split()

# -------------------------------------------------------------------- Palettes
def _coat(
    o, s, d, m, l, h,
    t, v, w,
    n=None,
    r="#a8a296", p="#ded9ce", q="#f7f4ec",
    k="#1e1916", g="#5e564e",
    e="#0f0b09", y="#fff8eb", u="#5c4c45",
    c="#7c4728", x="#4a2815", z="#e2be67",
    mark="blaze_socks",
):
    return dict(
        o=o, s=s, d=d, m=m, l=l, h=h,
        r=r, p=p, q=q,
        t=t, v=v, w=w,
        n=n or d, k=k, g=g,
        e=e, y=y, u=u,
        c=c, x=x, z=z,
        _mark=mark,
    )


COATS = {
    "bay": _coat(
        o="#24130c", s="#472415", d="#6b3820", m="#8f4f2c", l="#b26a3c", h="#cf8c58",
        t="#141114", v="#262229", w="#443e4a",
        n="#251d1a", u="#40332d",
        mark="blaze_socks",
    ),
    "chestnut": _coat(
        o="#2b120b", s="#592516", d="#823b20", m="#ab542c", l="#cc713e", h="#e6965d",
        t="#6e3a1c", v="#9c5c30", w="#c98b55",
        n="#78351c", u="#6b4b3d",
        mark="star_socks",
    ),
    "dapple-grey": _coat(
        o="#26282e", s="#525661", d="#787e8a", m="#9ea4b0", l="#c4cad4", h="#e8ecf2",
        t="#454954", v="#7a808d", w="#b8bec9",
        n="#5c616c", r="#cfd5de", p="#e3e8ef", q="#f7f9fc",
        u="#535761",
        mark="dapple",
    ),
    "black": _coat(
        o="#0d0d12", s="#191a22", d="#272936", m="#383b4c", l="#4f5469", h="#727994",
        t="#101117", v="#1f212b", w="#3b4052",
        n="#171820", u="#292a33",
        mark="star_socks",
    ),
    "palomino": _coat(
        o="#382510", s="#735022", d="#9e7130", m="#c99742", l="#e3b962", h="#f7db8f",
        t="#9e9176", v="#d6ccb4", w="#f7f2e4",
        n="#966a2c", u="#7a624b",
        mark="blaze_socks",
    ),
    "piebald": _coat(
        o="#171416", s="#2a2428", d="#42393e", m="#5e5258", l="#7d6f76", h="#a1939a",
        t="#141216", v="#2b272e", w="#e8e4dc",
        n="#231f22", r="#b8b4ab", p="#e6e2d8", q="#faf8f2",
        u="#4c4347",
        mark="piebald",
    ),
    "steppe-dun": _coat(
        o="#291f13", s="#57432a", d="#7d633e", m="#a68755", l="#c7aa73", h="#e3cb96",
        t="#1a1510", v="#30271e", w="#594a39",
        n="#362b1f", r="#9e8762", p="#c4ab7e", q="#e6d4ad",
        u="#4a3e30",
        mark="dun",
    ),
    "roan": _coat(
        o="#2b1918", s="#593533", d="#805350", m="#a87974", l="#c79d97", h="#e3c2bc",
        t="#291817", v="#472b29", w="#704845",
        n="#452725", r="#946864", p="#c49c96", q="#e8d0cc",
        u="#4a3432",
        mark="dapple",
    ),
}
COATS["grey"] = COATS["dapple-grey"]
COATS["dun"] = COATS["steppe-dun"]

assert len({COATS["bay"][r] for r in ROLES}) == len(ROLES), "bay role colors must be unique"
PALETTES = {"horse": {r: COATS["bay"][r] for r in ROLES}}

# ---------------------------------------------------------------------- Builds
BUILDS = {
    "riding": dict(
        label="Riding Horse",
        sub="Balanced courier & travel mount (~15.2hh)",
        withers=28.5,
        body_len=23.0,
        chest_r=6.4,
        barrel_r=6.2,
        croup_r=6.6,
        neck_len=11.0,
        neck_base=4.0,
        neck_top=2.3,
        neck_arch=1.3,
        head_scale=1.0,
        head_angle=0.88,
        leg_thick=1.65,
        cannon_thick=1.05,
        feather=0,
        mane_style="flowing",
        tail_style="full",
        tack="saddle",
        tack_colors=("#7a4526", "#4a2713", "#d9b55f"),
        stride=1.0,
    ),
    "work": dict(
        label="Workhorse (Draft)",
        sub="Heavy broad chest, feathered fetlocks & draft collar (~16.2hh)",
        withers=30.0,
        body_len=25.0,
        chest_r=7.8,
        barrel_r=7.7,
        croup_r=8.0,
        neck_len=10.0,
        neck_base=5.2,
        neck_top=3.0,
        neck_arch=1.7,
        head_scale=1.08,
        head_angle=0.95,
        leg_thick=2.15,
        cannon_thick=1.45,
        feather=2,
        mane_style="thick",
        tail_style="docked_full",
        tack="collar",
        tack_colors=("#6e3e22", "#3e2110", "#d4ae52"),
        stride=0.86,
    ),
    "war": dict(
        label="War Horse (Destrier)",
        sub="Tall arched neck, steel chanfron & crimson-gold barding (~16.5hh)",
        withers=31.0,
        body_len=24.5,
        chest_r=7.4,
        barrel_r=7.0,
        croup_r=7.5,
        neck_len=12.0,
        neck_base=4.7,
        neck_top=2.6,
        neck_arch=2.7,
        head_scale=1.02,
        head_angle=1.05,  # proud collected vertical head carriage!
        leg_thick=1.9,
        cannon_thick=1.25,
        feather=1,
        mane_style="crested",
        tail_style="flowing",
        tack="barding",
        tack_colors=("#9e2428", "#5c1218", "#ebd07a"),
        stride=1.02,
    ),
    "race": dict(
        label="Race Horse (Courser)",
        sub="Sleek lean barrel, long fine legs & sweeping stride (~15.3hh)",
        withers=29.0,
        body_len=24.0,
        chest_r=5.8,
        barrel_r=5.3,
        croup_r=6.0,
        neck_len=12.2,
        neck_base=3.5,
        neck_top=1.95,
        neck_arch=0.7,
        head_scale=0.92,
        head_angle=0.82,
        leg_thick=1.4,
        cannon_thick=0.9,
        feather=0,
        mane_style="windswept",
        tail_style="streaming",
        tack="bridle",
        tack_colors=("#5c2e1c", "#33170d", "#e0c46c"),
        stride=1.18,
    ),
}


# --------------------------------------------------------------- Pixel helpers
class HorseCanvas:
    def __init__(self, palette: dict[str, str]):
        self.w = W
        self.h = H
        self.pal = palette
        self.px: dict[tuple[int, int], str] = {}

    def set(self, x: int, y: int, role: str):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.px[(x, y)] = role

    def render(self) -> Image.Image:
        out_px = dict(self.px)
        for (x, y) in list(self.px.keys()):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < self.w and 0 <= ny < self.h and (nx, ny) not in self.px:
                    out_px[(nx, ny)] = "o"

        im = Image.new("RGBA", (self.w, self.h), (0, 0, 0, 0))
        pix = im.load()
        for (x, y), role in out_px.items():
            hx = self.pal[role]
            pix[x, y] = (int(hx[1:3], 16), int(hx[3:5], 16), int(hx[5:7], 16), 255)
        return tint_outline(im)


def _disk(cx: float, cy: float, rx: float, ry: float | None = None) -> set[tuple[int, int]]:
    ry = rx if ry is None else ry
    out: set[tuple[int, int]] = set()
    x0, x1 = math.floor(cx - rx - 0.5), math.ceil(cx + rx + 0.5)
    y0, y1 = math.floor(cy - ry - 0.5), math.ceil(cy + ry + 0.5)
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            dx = (x - cx) / max(rx, 0.1)
            dy = (y - cy) / max(ry, 0.1)
            if dx * dx + dy * dy <= 1.04:
                out.add((x, y))
    return out


def _tube(pts: list[tuple[float, float]], radii: list[float]) -> set[tuple[int, int]]:
    out: set[tuple[int, int]] = set()
    for (a, ra), (b, rb) in zip(zip(pts, radii), zip(pts[1:], radii[1:])):
        dist = math.hypot(b[0] - a[0], b[1] - a[1])
        steps = max(2, int(dist * 2.5))
        for i in range(steps + 1):
            u = i / steps
            x = a[0] + (b[0] - a[0]) * u
            y = a[1] + (b[1] - a[1]) * u
            r = ra + (rb - ra) * u
            out |= _disk(x, y, r)
    return out


def _poly(pts: list[tuple[float, float]]) -> set[tuple[int, int]]:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    out: set[tuple[int, int]] = set()
    for y in range(math.floor(min(ys)), math.ceil(max(ys)) + 1):
        for x in range(math.floor(min(xs)), math.ceil(max(xs)) + 1):
            inside = False
            for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
                if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
                    inside = not inside
            if inside:
                out.add((x, y))
    return out


def _shade_3d(mask: set[tuple[int, int]], light_x=0.30, light_y=-0.95) -> dict[tuple[int, int], float]:
    if not mask:
        return {}
    xs = [x for x, _ in mask]
    ys = [y for _, y in mask]
    cx = (min(xs) + max(xs)) * 0.5
    cy = (min(ys) + max(ys)) * 0.5
    rx = max(1.0, (max(xs) - min(xs)) * 0.5)
    ry = max(1.0, (max(ys) - min(ys)) * 0.5)
    out = {}
    for x, y in mask:
        nx = (x - cx) / rx
        ny = (y - cy) / ry
        ndotl = nx * light_x + ny * light_y
        val = 0.52 + 0.48 * ndotl
        if (x, y - 1) not in mask:
            val += 0.14
        elif (x, y + 1) not in mask:
            val -= 0.16
        out[(x, y)] = max(0.0, min(1.0, val))
    return out


def _coat_role(val: float, mark: str, x: int, y: int, cx: float, cy: float, is_far: bool = False) -> str:
    if is_far:
        val -= 0.22

    if mark == "piebald":
        d1 = ((x - (cx + 4)) / 6.0) ** 2 + ((y - (cy - 2)) / 5.0) ** 2
        d2 = ((x - (cx - 7.5)) / 5.4) ** 2 + ((y - (cy + 1)) / 4.2) ** 2
        if d1 < 1.0 or d2 < 0.85:
            return "q" if val > 0.72 else ("p" if val > 0.36 else "r")

    if mark == "dapple":
        gx = ((x - int(cx)) % 5) - 2
        gy = ((y - int(cy)) % 4) - 1.5
        if x < cx + 5 and y > cy - 4 and gx * gx + gy * gy <= 1.65:
            return "q" if val > 0.68 else ("p" if val > 0.35 else "r")

    if mark == "dun":
        if abs(x - (cx + 5)) <= 0.6 and cy - 5 <= y <= cy + 1:
            return "d"

    if val >= 0.83:
        return "h"
    if val >= 0.60:
        return "l"
    if val >= 0.34:
        return "m"
    if val >= 0.16:
        return "d"
    return "s"


# --------------------------------------------------------------- Gait kinematics
def _gait_pose(state: str, frame: int, build: dict) -> dict:
    t = (frame % 8) / 8.0
    a = t * math.tau
    st = build["stride"]

    if state == "idle":
        breath = math.sin(a) * 0.4
        return dict(
            bob=breath * 0.45,
            pitch=0.0,
            head_dx=math.sin(a) * 0.35,
            head_dy=math.sin(a) * 0.5,
            head_rot=math.sin(a) * 0.03,
            ear_flick=1 if frame in (3, 4) else 0,
            blink=frame == 6,
            tail_swish=math.sin(a) * 2.4,
            tail_lift=0.0,
            mane_wave=math.sin(a) * 0.4,
            # (dx, lift, fold) - fold controls knee/hock bend!
            legs=dict(
                LF=(0.4, 0.0, 0.0),
                RF=(-0.8, 0.0, 0.0),
                LH=(-0.4, 0.0, 0.0),
                RH=(1.0, 0.0, 0.0),
            ),
        )

    if state == "graze":
        # f0-1 smooth head-dip (also used on mount/pat!), f2-5 chewing at grass, f6-7 lift
        drops = [0.22, 0.56, 0.96, 1.0, 0.94, 1.0, 0.62, 0.25]
        chew = [0.0, 0.0, 0.6, -0.5, 0.5, -0.6, 0.0, 0.0]
        f = frame % 8
        drop = drops[f]
        return dict(
            bob=drop * 1.2,
            pitch=drop * 0.05,
            head_dx=drop * 4.2 + chew[f] * 0.4,
            head_dy=drop * 22.5 + chew[f],
            head_rot=drop * 0.42 + chew[f] * 0.06,
            ear_flick=1 if f in (3, 4) else 0,
            blink=f == 5,
            tail_swish=math.sin(a) * 2.8,
            tail_lift=0.4,
            mane_wave=drop * 0.8,
            rest=False,
            legs=dict(
                LF=(2.0 * drop + 0.3, 0.0, 0.0),
                RF=(-1.8 * drop - 0.4, 0.0, 0.0),
                LH=(-0.4, 0.0, 0.0),
                RH=(0.8, 0.0, 0.0),
            ),
        )

    if state == "rest":
        breath = math.sin(a) * 0.45
        return dict(
            bob=breath * 0.4,
            pitch=0.0,
            head_dx=-1.2 + math.sin(a) * 0.4,
            head_dy=2.2 + math.sin(a) * 0.7,
            head_rot=0.14 + math.sin(a) * 0.04,
            ear_flick=1 if frame in (2, 3) else 0,
            blink=frame in (5, 6),
            tail_swish=math.sin(a) * 1.2,
            tail_lift=-0.5,
            mane_wave=0.2,
            rest=True,
            legs=dict(
                LF=(0.0, 0.0, 0.0),
                RF=(0.0, 0.0, 0.0),
                LH=(0.0, 0.0, 0.0),
                RH=(0.0, 0.0, 0.0),
            ),
        )

    if state in ("walk", "wander"):
        def _step(phase: float):
            p = (t + phase) % 1.0
            if p < 0.36:
                u = p / 0.36
                dx = (-4.0 + 8.0 * u) * st
                lift = math.sin(u * math.pi) * 3.0
                fold = math.sin(u * math.pi) * 0.75
            else:
                u = (p - 0.36) / 0.64
                dx = (4.0 - 8.0 * u) * st
                lift = 0.0
                fold = 0.0
            return dx, lift, fold

        return dict(
            bob=-abs(math.sin(a * 2)) * 0.7,
            pitch=math.sin(a * 2) * 0.02,
            head_dx=math.cos(a * 2) * 0.85,
            head_dy=math.sin(a * 2) * 0.7,
            head_rot=math.sin(a * 2) * 0.04,
            ear_flick=0,
            blink=False,
            tail_swish=math.sin(a) * 2.5,
            tail_lift=1.0,
            mane_wave=math.sin(a * 2) * 0.8,
            legs=dict(
                LH=_step(0.00),
                LF=_step(0.25),
                RH=_step(0.50),
                RF=_step(0.75),
            ),
        )

    if state == "trot":
        def _trot(phase: float):
            p = (t + phase) % 1.0
            if p < 0.46:
                u = p / 0.46
                dx = (-5.6 + 11.2 * u) * st
                lift = math.sin(u * math.pi) * 4.8
                fold = math.sin(u * math.pi) * 1.0
            else:
                u = (p - 0.46) / 0.54
                dx = (5.6 - 11.2 * u) * st
                lift = 0.0
                fold = 0.0
            return dx, lift, fold

        susp = abs(math.sin(a * 2))
        return dict(
            bob=-susp * 1.8,
            pitch=math.sin(a * 2) * 0.035,
            head_dx=0.8 + math.cos(a * 2) * 0.6,
            head_dy=-0.5 - susp * 0.5,
            head_rot=-0.04,
            ear_flick=0,
            blink=False,
            tail_swish=math.sin(a * 2) * 1.5,
            tail_lift=3.0,
            mane_wave=math.sin(a * 2) * 1.4,
            legs=dict(
                LF=_trot(0.0),
                RH=_trot(0.0),
                RF=_trot(0.5),
                LH=_trot(0.5),
            ),
        )

    if state in ("gallop", "flee"):
        # Hand-tuned 8-frame rotary gallop keyframes (dx, lift, fold)
        # f0-1: gathered collection | f2-3: hind drive & fore reach
        # f4-5: airborne full extension | f6-7: forehand strike & roll-over
        k_lh = [(-2.5, 1.5, 0.3), (3.5, 3.8, 0.7), (5.5, 0.5, 0.2), (-2.0, 0.0, 0.0),
                (-8.5, 3.5, 0.2), (-9.8, 5.2, 0.1), (-7.0, 4.2, 0.3), (-4.0, 2.5, 0.4)]
        k_rh = [(1.5, 2.8, 0.6), (5.2, 1.2, 0.3), (1.0, 0.0, 0.0), (-6.0, 2.2, 0.1),
                (-9.5, 4.8, 0.1), (-8.2, 4.6, 0.2), (-5.2, 3.4, 0.4), (-1.5, 2.0, 0.5)]
        k_lf = [(-5.8, 4.2, 1.0), (-2.5, 6.2, 1.2), (3.8, 6.5, 0.9), (9.0, 4.8, 0.3),
                (9.8, 3.5, 0.1), (6.5, 0.6, 0.0), (0.0, 0.0, 0.0), (-5.2, 2.4, 0.6)]
        k_rf = [(-4.0, 5.4, 1.1), (1.5, 6.6, 1.0), (7.2, 5.4, 0.4), (9.6, 3.8, 0.1),
                (7.8, 1.2, 0.0), (1.5, 0.0, 0.0), (-4.5, 1.8, 0.5), (-6.2, 3.8, 0.9)]
        f = frame % 8
        sc = lambda tup: (tup[0] * st, tup[1], tup[2])
        bobs = [-1.4, -2.0, -3.2, -4.0, -4.4, -3.0, -1.2, -1.0]
        pitches = [0.06, -0.02, -0.10, -0.08, -0.02, 0.05, 0.09, 0.08]
        return dict(
            bob=bobs[f],
            pitch=pitches[f],
            head_dx=3.0 + math.cos(a) * 1.4,
            head_dy=1.2 + math.sin(a) * 1.0,
            head_rot=-0.22 + math.sin(a) * 0.06,  # extended neck & nose forward!
            ear_flick=0,
            blink=False,
            tail_swish=math.sin(a) * 1.4,
            tail_lift=6.5,
            mane_wave=2.8 + math.sin(a * 2) * 1.3,
            legs=dict(LH=sc(k_lh[f]), RH=sc(k_rh[f]), LF=sc(k_lf[f]), RF=sc(k_rf[f])),
        )

    # Rear (8f)
    rise = math.sin(t * math.pi) ** 1.15
    paw = math.sin(a * 2) * 2.2 * rise
    return dict(
        bob=-rise * 4.4,
        pitch=-rise * 0.44,
        head_dx=-rise * 2.4,
        head_dy=-rise * 2.0,
        head_rot=rise * 0.18,
        ear_flick=1 if rise > 0.5 else 0,
        blink=False,
        tail_swish=math.sin(a) * 2.0,
        tail_lift=rise * 2.5,
        mane_wave=rise * 2.4,
        legs=dict(
            LH=(-1.4 * rise, 0.0, 0.25 * rise),
            RH=(1.6 * rise, 0.0, 0.25 * rise),
            LF=(4.2 * rise + paw, 11.2 * rise + max(0.0, paw), 1.25 * rise),
            RF=(1.6 * rise - paw, 9.2 * rise + max(0.0, -paw), 1.15 * rise),
        ),
    )


# --------------------------------------------------------------- Side renderer
def _draw_leg_side(
    c: HorseCanvas,
    hip: tuple[float, float],
    foot: tuple[float, float],
    fold: float,
    hind: bool,
    near: bool,
    build: dict,
    white_sock: bool,
):
    """Natural equine leg: straight vertical front column when standing (folding
    forward at the knee as `fold` increases); hind leg with authentic subtle
    gaskin-to-hock angle and vertical lower cannon."""
    hx, hy = hip
    fx, fy = foot
    if hind:
        # Hock sits slightly behind the hip-foot line; stronger fold pulls it up-back
        hock_x = hx * 0.42 + fx * 0.58 - (1.8 + fold * 2.2)
        hock_y = hy * 0.52 + fy * 0.48 - fold * 1.6
        joint = (hock_x, hock_y)
    else:
        # Front knee is straight when standing (fold=0), bends forward when lifted!
        knee_x = hx * 0.48 + fx * 0.52 + (0.2 + fold * 3.4)
        knee_y = hy * 0.50 + fy * 0.50 - fold * 1.8
        joint = (knee_x, knee_y)

    # Fetlock sits just above the hoof, slightly behind the toe
    fetlock = (fx - (0.9 if hind else 0.7), fy - 2.3)

    t_up = build["leg_thick"]
    t_can = build["cannon_thick"]

    # Muscular upper forearm / gaskin tapering cleanly into joint
    upper = _tube([hip, joint], [t_up * 1.35, t_up * 0.85])
    lower = _tube([joint, fetlock], [t_can * 1.05, t_can * 0.90])
    pastern = _tube([fetlock, (fx, fy - 0.5)], [t_can * 0.88, t_can * 0.85])

    for x, y in upper:
        if near:
            role = "l" if (x - 1, y) not in upper else "m"
            if (x + 1, y) not in upper and not hind:
                role = "d"
        else:
            role = "d" if (x - 1, y) not in upper else "s"
        c.set(x, y, role)

    for x, y in lower | pastern:
        if white_sock and y >= fetlock[1] - 3.0:
            role = "q" if near and (x - 1, y) not in (lower | pastern) else ("p" if near else "r")
        else:
            if near:
                role = "m" if (x - 1, y) not in (lower | pastern) and y < fetlock[1] - 2 else "n"
            else:
                role = "s"
        c.set(x, y, role)

    # Feathered fetlocks on draft & war horses
    if build["feather"] > 0:
        f_sz = build["feather"]
        f_mask = _poly([
            (fetlock[0] - 0.4, fetlock[1] - 1.6),
            (fetlock[0] + 0.8, fetlock[1] - 0.6),
            (fx + 0.5, fy + 0.2),
            (fx - 1.9 - f_sz * 0.7, fy + 0.2),
            (fetlock[0] - 1.6 - f_sz * 0.6, fetlock[1] + 0.3),
        ])
        for x, y in f_mask:
            if white_sock or build["feather"] >= 2:
                c.set(x, y, "q" if near and y < fy - 0.5 else ("p" if near else "r"))
            else:
                c.set(x, y, "v" if near else "t")

    # Crisp wedged hoof
    hoof = _poly([
        (fx - 1.1, fy - 1.2),
        (fx + 1.1, fy - 0.8),
        (fx + 1.6, fy + 0.4),
        (fx - 1.1, fy + 0.4),
    ])
    for x, y in hoof:
        c.set(x, y, "g" if near and y < fy and x >= fx else "k")


def _draw_side(build: dict, pal: dict, state: str, frame: int, quarter: str = "side") -> Image.Image:
    c = HorseCanvas(pal)
    pose = _gait_pose(state, frame, build)
    mark = pal["_mark"]

    resting = bool(pose.get("rest"))
    se = quarter == "se"
    ne = quarter == "ne"
    cx = 31.0 if se else (30.0 if ne else 30.5)
    withers_y = (GROUND - build["barrel_r"] * 1.35 - 5.2 if resting else GROUND - build["withers"]) + pose["bob"]
    half_len = build["body_len"] * (0.39 if (se or ne) else 0.5)
    pitch = pose["pitch"] + (0.06 if se else (-0.06 if ne else 0.0))

    def _rot_body(dx: float, dy: float) -> tuple[float, float]:
        ca, sa = math.cos(pitch), math.sin(pitch)
        return cx + dx * ca - dy * sa, withers_y + 5.2 + dx * sa + dy * ca

    p_croup = _rot_body(-half_len + 2.2, -0.6 + (-2.2 if se else (1.8 if ne else 0.0)))
    p_mid = _rot_body(-0.5, 0.9)
    p_chest = _rot_body(half_len - 2.0, 0.3 + (1.6 if se else (-2.0 if ne else 0.0)))
    p_withers = _rot_body(half_len - 4.8, -3.4 + (0.6 if se else (-1.8 if ne else 0.0)))

    hip_h_far = _rot_body(-half_len + (2.0 if se else (4.2 if ne else 3.4)), 3.6 + (-2.0 if se else (0.8 if ne else 0.0)))
    hip_h_near = _rot_body(-half_len + (1.4 if se else (1.0 if ne else 1.8)), 4.0 + (-1.2 if se else (1.8 if ne else 0.0)))
    hip_f_far = _rot_body(half_len + (0.8 if se else (-0.4 if ne else -1.4)), 4.0 + (0.6 if se else (-2.2 if ne else 0.0)))
    hip_f_near = _rot_body(half_len - (2.4 if se else (2.6 if ne else 3.0)), 4.4 + (1.6 if se else (-1.4 if ne else 0.0)))

    g_hind = GROUND - (2.2 if se else (-0.4 if ne else 0.0))
    g_front = GROUND + (0.4 if se else (-2.2 if ne else 0.0))

    def _foot(hip, key, ground_y):
        dx, lift, fold = pose["legs"][key]
        dx_s = dx * (0.82 if (se or ne) else 1.0)
        return (hip[0] + dx_s, min(GROUND, ground_y - lift)), fold

    f_rh, fl_rh = _foot(hip_h_far, "RH", g_hind - (0.8 if se else 0.0))
    f_rf, fl_rf = _foot(hip_f_far, "RF", g_front - (0.8 if ne else 0.0))
    f_lh, fl_lh = _foot(hip_h_near, "LH", g_hind)
    f_lf, fl_lf = _foot(hip_f_near, "LF", g_front)

    has_socks = mark in ("blaze_socks", "star_socks", "piebald")

    # 1. Far legs (hidden under barrel when resting)
    if not resting:
        _draw_leg_side(c, hip_h_far, f_rh, fl_rh, hind=True, near=False, build=build, white_sock=has_socks)
        _draw_leg_side(c, hip_f_far, f_rf, fl_rf, hind=False, near=False, build=build, white_sock=False)

    # 2. Long graceful flowing tail (drawn behind torso for east/se, over croup for ne)
    tail_root = _rot_body(-half_len - (1.0 if ne else 1.5), -1.8 + (-2.0 if se else (1.6 if ne else 0.0)))
    tl = pose["tail_lift"]
    sw = pose["tail_swish"]
    tail_len = 17.0 if build["tail_style"] != "docked_full" else 13.0
    t_pts = [
        tail_root,
        (tail_root[0] - (1.8 if ne else 2.6) - tl * 0.55, tail_root[1] + 2.2 - tl * 0.35),
        (tail_root[0] - (3.0 if ne else 4.6) - tl * 1.15 + sw * 0.4, tail_root[1] + tail_len * 0.55 - tl * 0.65),
        (tail_root[0] - (2.2 if ne else 3.2) - tl * 1.75 + sw, tail_root[1] + tail_len - tl * 0.90),
    ]
    t_rad = [1.5, 2.4, 2.2, 0.9] if build["tail_style"] != "streaming" else [1.3, 2.0, 1.9, 0.7]
    tail_mask = _tube(t_pts, t_rad)
    t_lit = _shade_3d(tail_mask)

    def _paint_tail():
        for (x, y), val in t_lit.items():
            strand = ((x + y) % 3 == 0)
            c.set(x, y, "w" if val > 0.70 and strand else ("v" if val > 0.34 else "t"))

    if not ne:
        _paint_tail()

    # 3. Torso: sculpted croup, deep ribcage, saddle hollow, smooth chest
    croup_s = 0.92 if se else (1.06 if ne else 1.0)
    chest_s = 1.08 if se else (0.92 if ne else 1.0)
    croup_m = _disk(p_croup[0], p_croup[1], build["croup_r"] * croup_s, build["croup_r"] * 0.88 * croup_s)
    barrel_m = _disk(p_mid[0], p_mid[1], half_len * 0.80, build["barrel_r"] * 0.86)
    chest_m = _disk(p_chest[0], p_chest[1], build["chest_r"] * 0.92 * chest_s, build["chest_r"] * 0.92 * chest_s)
    withers_m = _disk(p_withers[0], p_withers[1] + 1.4, 3.8, 3.0)
    torso = croup_m | barrel_m | chest_m | withers_m

    # Graceful U-shaped saddle dip between withers & croup + athletic flank tuck
    dip_pt = _rot_body(-1.2, -build["barrel_r"] * 0.95 - 0.8)
    torso -= _disk(dip_pt[0], dip_pt[1], 3.8, 1.6)
    if build["barrel_r"] <= 7.2:
        flank_pt = _rot_body(-4.2, build["barrel_r"] * 0.82 + 1.4)
        torso -= _disk(flank_pt[0], flank_pt[1], 3.8, 2.0)

    t_shade = _shade_3d(torso, 0.25, -0.96)
    for (x, y), val in t_shade.items():
        dx_sh = abs((x - (p_chest[0] - 3.4)) + (y - p_chest[1]) * 0.35)
        if dx_sh < 0.75 and p_chest[1] - 2 < y < p_chest[1] + 4:
            val -= 0.14
        dx_ha = abs((x - (p_croup[0] + 3.2)) - (y - p_croup[1]) * 0.28)
        if dx_ha < 0.75 and p_croup[1] - 1 < y < p_croup[1] + 5:
            val -= 0.13
        c.set(x, y, _coat_role(val, mark, x, y, cx, withers_y + 5.2))

    # 4. Arched neck & noble equine head
    neck_len = build["neck_len"]
    n_base = (p_withers[0] + 2.4, p_withers[1] + 2.5)
    poll_x = p_chest[0] + neck_len * 0.62 + pose["head_dx"]
    poll_y = p_withers[1] - neck_len * 0.74 + pose["head_dy"] - build["neck_arch"] * 0.45
    n_mid = (
        (n_base[0] + poll_x) * 0.5 - build["neck_arch"] * 0.65,
        (n_base[1] + poll_y) * 0.5 - build["neck_arch"] * 0.60,
    )
    neck_mask = _tube(
        [(p_chest[0] + 0.8, p_chest[1] - 0.2), n_base, n_mid, (poll_x, poll_y + 1.4)],
        [build["neck_base"] * 1.05, build["neck_base"], (build["neck_base"] + build["neck_top"]) * 0.52, build["neck_top"]],
    )
    n_shade = _shade_3d(neck_mask, 0.38, -0.92)
    for (x, y), val in n_shade.items():
        if (x, y) in torso and val < 0.55:
            val = max(val, 0.44)
        c.set(x, y, _coat_role(val, mark, x, y, cx, withers_y + 5.2))

    # Mane along neck crest
    mw = pose["mane_wave"]
    mane_pts = [
        (p_withers[0] - 0.6, p_withers[1] - 0.3),
        (n_mid[0] - build["neck_top"] * 0.95 - mw * 0.35, n_mid[1] - 0.7),
        (poll_x - 1.6 - mw * 0.25, poll_y + 0.5),
    ]
    mane_w = 2.0 if build["mane_style"] == "thick" else (1.5 if build["mane_style"] == "flowing" else 1.3)
    mane_mask = _tube(mane_pts, [mane_w * 1.05, mane_w, mane_w * 0.75])
    if build["mane_style"] in ("flowing", "windswept", "thick"):
        mane_mask |= _tube(
            [(n_mid[0] - 1.4, n_mid[1]), (n_mid[0] - 3.6 - mw * 0.6, n_mid[1] + 2.4)],
            [1.3, 0.7],
        )
    m_shade = _shade_3d(mane_mask)
    for (x, y), val in m_shade.items():
        c.set(x, y, "w" if val > 0.75 else ("v" if val > 0.38 else "t"))

    # Noble angled equine head (~50-60 deg downward!)
    hs = build["head_scale"]
    h_ang = build["head_angle"] + pose["head_rot"] + (0.18 if se else (-0.12 if ne else 0.0))
    hx_dir, hy_dir = math.cos(h_ang) * (0.82 if se else (0.78 if ne else 1.0)), math.sin(h_ang)
    jx_dir, jy_dir = -hy_dir, hx_dir  # toward jowl/cheek

    jowl = (poll_x + hx_dir * 2.4 + jx_dir * 1.8 * hs, poll_y + hy_dir * 2.4 + jy_dir * 1.8 * hs)
    bridge = (poll_x + hx_dir * 5.8 * hs, poll_y + hy_dir * 5.8 * hs)
    muzzle = (poll_x + hx_dir * 9.0 * hs, poll_y + hy_dir * 9.0 * hs)

    head_mask = (
        _disk(poll_x + hx_dir * 1.2, poll_y + hy_dir * 1.2 + 0.8, 2.5 * hs, 2.4 * hs)
        | _disk(jowl[0], jowl[1], 2.4 * hs, 2.2 * hs)
        | _tube([(poll_x + hx_dir * 1.4, poll_y + hy_dir * 1.4 + 0.6), bridge, muzzle], [2.4 * hs, 1.7 * hs, 1.55 * hs])
    )
    h_shade = _shade_3d(head_mask, 0.45, -0.89)
    for (x, y), val in h_shade.items():
        if math.hypot(x - muzzle[0], y - muzzle[1]) < 1.8 * hs:
            c.set(x, y, "u" if val > 0.42 else "k")
        else:
            c.set(x, y, _coat_role(val, "solid", x, y, cx, withers_y))

    # Blaze / star
    if mark in ("blaze_socks", "piebald"):
        for k in range(2, 8):
            bx = round(poll_x + hx_dir * k * hs + 0.6)
            by = round(poll_y + hy_dir * k * hs - 0.3)
            if (bx, by) in head_mask:
                c.set(bx, by, "q")
    elif mark == "star_socks":
        sx = round(poll_x + hx_dir * 2.5 * hs + 0.5)
        sy = round(poll_y + hy_dir * 2.5 * hs - 0.2)
        c.set(sx, sy, "q")

    # Nostril & eye with 1px catchlight
    c.set(round(muzzle[0] + hx_dir * 0.3 + 0.4), round(muzzle[1] + hy_dir * 0.2 - 0.3), "e")
    ex = round(poll_x + hx_dir * 3.1 * hs + jx_dir * 0.2)
    ey = round(poll_y + hy_dir * 3.1 * hs + jy_dir * 0.2 + 0.2)
    if pose["blink"]:
        c.set(ex, ey, "d")
    else:
        c.set(ex, ey, "e")
        c.set(ex, ey - 1, "y")

    # Alert pointed ears
    fl = pose["ear_flick"]
    far_ear = _poly([(poll_x - 1.3, poll_y + 0.8), (poll_x - 0.5, poll_y - 3.3), (poll_x + 0.7, poll_y + 0.5)])
    for x, y in far_ear:
        c.set(x, y, "n" if y < poll_y - 1.5 else "d")
    near_ear = _poly([(poll_x - 0.2, poll_y + 1.0), (poll_x + 0.9 + fl, poll_y - 3.7), (poll_x + 2.0, poll_y + 0.8)])
    for x, y in near_ear:
        c.set(x, y, "n" if y < poll_y - 2.0 else ("l" if x > poll_x + 0.5 else "m"))
    c.set(round(poll_x + 1.4), round(poll_y + 0.6), "v")
    c.set(round(poll_x + 2.0), round(poll_y + 1.2), "t")

    # 5. Breed-specific tack / barding / collar
    tack = build["tack"]
    if tack == "barding":
        cap_back = _poly([
            (p_croup[0] - build["croup_r"] * 0.9, p_croup[1] - 3.0),
            (p_mid[0] + 2.0, p_mid[1] - 3.8),
            (p_mid[0] + 1.5, p_mid[1] + 5.6),
            (p_croup[0] - build["croup_r"] * 0.95, p_croup[1] + 6.0),
        ]) & (torso | _disk(p_croup[0], p_croup[1] + 3.0, build["croup_r"] * 1.02, 5.2))
        cap_front = _poly([
            (p_chest[0] - 2.4, p_chest[1] - 4.0),
            (p_chest[0] + build["chest_r"] * 0.95, p_chest[1] - 2.4),
            (p_chest[0] + build["chest_r"] * 1.0, p_chest[1] + 5.8),
            (p_chest[0] - 3.0, p_chest[1] + 5.5),
        ])
        for msk in (cap_back, cap_front):
            sh = _shade_3d(msk)
            for (x, y), val in sh.items():
                c.set(x, y, "z" if (x, y + 1) not in msk else ("c" if val > 0.38 else "x"))
        sad = _poly([
            (p_mid[0] - 4.5, p_withers[1] - 0.8),
            (p_mid[0] - 3.0, p_withers[1] + 1.6),
            (p_mid[0] + 3.0, p_withers[1] + 1.4),
            (p_mid[0] + 4.2, p_withers[1] - 0.5),
            (p_mid[0] + 3.5, p_withers[1] + 4.2),
            (p_mid[0] - 3.8, p_withers[1] + 4.2),
        ])
        for x, y in sad:
            c.set(x, y, "z" if y <= p_withers[1] + 0.4 else ("c" if x > p_mid[0] - 1 else "x"))
        for k in range(1, 7):
            cx_f = round(poll_x + hx_dir * k * hs + 0.6)
            cy_f = round(poll_y + hy_dir * k * hs - 0.2)
            c.set(cx_f, cy_f, "q")
            c.set(cx_f, cy_f + 1, "r")
    elif tack == "collar":
        col = _tube(
            [(p_withers[0] + 2.0, p_withers[1]), (p_chest[0] + 3.2, p_chest[1] + 2.8)],
            [2.0, 2.2],
        )
        for x, y in col:
            c.set(x, y, "z" if (x - 1, y) not in col and y < p_chest[1] else ("c" if (x - 1, y) not in col else "x"))
    elif tack == "saddle":
        sad = _poly([
            (p_mid[0] - 3.6, p_withers[1] + 1.0),
            (p_mid[0] + 3.0, p_withers[1] + 0.9),
            (p_mid[0] + 2.4, p_withers[1] + 4.8),
            (p_mid[0] - 3.2, p_withers[1] + 4.6),
        ])
        for x, y in sad:
            c.set(x, y, "c" if y < p_withers[1] + 3.2 else "x")
        c.set(round(p_mid[0] + 0.5), round(p_withers[1] + 6.2), "z")
    elif tack == "bridle":
        for k in range(2, 9):
            bx = round(poll_x + hx_dir * k * hs - 0.5)
            by = round(poll_y + hy_dir * k * hs + 0.9)
            if (bx, by) in head_mask:
                c.set(bx, by, "x")
        c.set(round(muzzle[0] - 0.4), round(muzzle[1] + 0.5), "z")

    # 6. Near legs (or neatly folded legs tucked under when resting!)
    if resting:
        # Folded front knee + cannon tucked under chest
        fk = _tube([(hip_f_near[0], hip_f_near[1]), (hip_f_near[0] + 4.8, GROUND - 1.2), (hip_f_near[0] - 1.5, GROUND - 0.5)], [build["leg_thick"], build["cannon_thick"] * 1.1, build["cannon_thick"]])
        for x, y in fk:
            c.set(x, y, "l" if (x, y - 1) not in fk else ("m" if y < GROUND - 2 else "n"))
        # Folded hind thigh + hock tucked beside flank
        hk = _tube([(hip_h_near[0], hip_h_near[1]), (hip_h_near[0] - 2.4, GROUND - 1.4), (hip_h_near[0] + 4.2, GROUND - 0.6)], [build["leg_thick"] * 1.15, build["cannon_thick"] * 1.1, build["cannon_thick"]])
        for x, y in hk:
            c.set(x, y, "l" if (x, y - 1) not in hk else ("m" if y < GROUND - 2 else "n"))
    else:
        _draw_leg_side(c, hip_h_near, f_lh, fl_lh, hind=True, near=True, build=build, white_sock=has_socks)
        _draw_leg_side(c, hip_f_near, f_lf, fl_lf, hind=False, near=True, build=build, white_sock=has_socks)

    if ne:
        _paint_tail()

    return c.render()


# ------------------------------------------------------------ South & North
def _draw_front_or_back(build: dict, pal: dict, state: str, frame: int, front: bool) -> Image.Image:
    c = HorseCanvas(pal)
    pose = _gait_pose(state, frame, build)
    mark = pal["_mark"]
    resting = bool(pose.get("rest"))
    cx = 32.0
    withers_y = (GROUND - build["barrel_r"] * 1.35 - 4.8 if resting else GROUND - build["withers"]) + pose["bob"]
    chest_w = build["chest_r"] * (1.22 if resting else 1.12)
    chest_h = build["chest_r"] * (0.95 if resting else 1.02)
    has_socks = mark in ("blaze_socks", "star_socks", "piebald")

    l_lift = pose["legs"]["LF" if front else "LH"][1] * 0.85
    r_lift = pose["legs"]["RF" if front else "RH"][1] * 0.85
    back_l_lift = pose["legs"]["LH" if front else "LF"][1] * 0.65
    back_r_lift = pose["legs"]["RH" if front else "RF"][1] * 0.65

    def _vleg(lx: float, top_y: float, bot_y: float, thick: float, near: bool, sock: bool):
        mid_y = (top_y + bot_y) * 0.52
        leg = _tube([(lx, top_y), (lx, mid_y), (lx, bot_y - 1.4)], [thick * 1.25, thick * 0.88, thick * 0.78])
        for x, y in leg:
            if sock and y >= bot_y - 5.2:
                c.set(x, y, "p" if near else "r")
            elif y >= bot_y - 6.0:
                c.set(x, y, "n" if near else "s")
            else:
                c.set(x, y, ("l" if x < lx else "m") if near else "d")
        if build["feather"] > 0 and near:
            for x, y in _disk(lx, bot_y - 2.0, thick * 1.15, 1.8):
                c.set(x, y, "q" if y < bot_y - 2 else "p")
        for x, y in _disk(lx, bot_y - 0.5, thick * 0.95, 1.1):
            c.set(x, y, "g" if near and x < lx else "k")

    hip_y = withers_y + chest_h * 0.88
    spread = chest_w * 0.54
    if not resting:
        _vleg(cx - spread * 0.78, hip_y, GROUND - back_l_lift, build["cannon_thick"] * 1.0, False, False)
        _vleg(cx + spread * 0.78, hip_y, GROUND - back_r_lift, build["cannon_thick"] * 1.0, False, False)

    body = _disk(cx, withers_y + 4.8, chest_w, chest_h)
    b_sh = _shade_3d(body, 0.28, -0.95)
    for (x, y), val in b_sh.items():
        if front and abs(x - cx) < 0.8 and y > withers_y + 5.5:
            val -= 0.16
        if not front and abs(x - cx) < 0.8 and y < withers_y + 3.0:
            val -= 0.14
        c.set(x, y, _coat_role(val, mark, x, y, cx, withers_y + 4.8))

    if resting:
        for sgn in (-1, 1):
            tuck = _disk(cx + sgn * spread * 1.05, GROUND - 1.5, build["leg_thick"] * 1.25, 1.8)
            for x, y in tuck:
                c.set(x, y, "m" if y < GROUND - 1.2 else "n")
    else:
        _vleg(cx - spread, hip_y + 0.6, GROUND - l_lift, build["leg_thick"] * 0.92, True, has_socks)
        _vleg(cx + spread, hip_y + 0.6, GROUND - r_lift, build["leg_thick"] * 0.92, True, has_socks)

    if build["tack"] == "barding":
        drape = _poly([
            (cx - chest_w * 0.95, withers_y + 1.5),
            (cx + chest_w * 0.95, withers_y + 1.5),
            (cx + chest_w * 0.9, withers_y + chest_h * 1.5),
            (cx, withers_y + chest_h * 1.8),
            (cx - chest_w * 0.9, withers_y + chest_h * 1.5),
        ])
        for x, y in drape:
            c.set(x, y, "z" if (x, y + 1) not in drape else ("c" if x < cx + 2 else "x"))
    elif build["tack"] == "collar" and front:
        ring = _disk(cx, withers_y + 2.5, chest_w * 0.72, chest_h * 0.65) - _disk(cx, withers_y + 2.2, chest_w * 0.42, chest_h * 0.38)
        for x, y in ring:
            c.set(x, y, "z" if y < withers_y - 1 else ("c" if x < cx else "x"))

    neck_h = build["neck_len"] * 0.80
    poll_y = withers_y - neck_h + pose["head_dy"] * 0.6
    neck = _tube([(cx, withers_y + 1.2), (cx, poll_y + 2.0)], [build["neck_base"] * 0.92, build["neck_top"] * 0.95])
    n_sh = _shade_3d(neck)
    for (x, y), val in n_sh.items():
        c.set(x, y, _coat_role(val, "solid", x, y, cx, withers_y))

    if front:
        mane = _tube([(cx - build["neck_top"] * 0.8, poll_y + 1.5), (cx - build["neck_base"] * 0.95, withers_y + 1.5)], [1.5, 1.9])
        for x, y in mane:
            c.set(x, y, "v" if y < withers_y - 2 else "t")

        hs = build["head_scale"]
        head = (
            _disk(cx, poll_y + 2.4, 3.2 * hs, 2.9 * hs)
            | _tube([(cx, poll_y + 3.0), (cx, poll_y + 8.6 * hs)], [2.6 * hs, 1.8 * hs])
        )
        h_sh = _shade_3d(head)
        for (x, y), val in h_sh.items():
            if y > poll_y + 7.0 * hs:
                c.set(x, y, "u" if val > 0.4 else "k")
            else:
                c.set(x, y, _coat_role(val, "solid", x, y, cx, poll_y + 3))
        if build["tack"] == "barding":
            for dy in range(1, 7):
                c.set(round(cx), round(poll_y + dy), "q")
                c.set(round(cx) - 1, round(poll_y + dy), "r")
        elif mark in ("blaze_socks", "piebald"):
            for dy in range(2, 8):
                c.set(round(cx), round(poll_y + dy), "q")
        elif mark == "star_socks":
            c.set(round(cx), round(poll_y + 2.5), "q")
        for sgn in (-1, 1):
            ex = round(cx + sgn * 2.3 * hs)
            ey = round(poll_y + 3.0)
            c.set(ex, ey, "d" if pose["blink"] else "e")
            if not pose["blink"]:
                c.set(ex, ey - 1, "y")
            c.set(round(cx + sgn * 1.0), round(poll_y + 8.0 * hs), "e")
            ear = _poly([(cx + sgn * 1.3, poll_y + 0.6), (cx + sgn * 3.0, poll_y - 3.2), (cx + sgn * 3.4, poll_y + 0.9)])
            for x, y in ear:
                c.set(x, y, "n" if y < poll_y - 1.5 else "m")
    else:
        for sgn in (-1, 1):
            ear = _poly([(cx + sgn * 1.3, poll_y + 0.8), (cx + sgn * 2.9, poll_y - 3.0), (cx + sgn * 3.2, poll_y + 1.0)])
            for x, y in ear:
                c.set(x, y, "n" if y < poll_y - 1.4 else "d")
        mane = _tube([(cx, poll_y + 0.6), (cx, withers_y + 1.2)], [1.6, 2.0])
        for x, y in mane:
            c.set(x, y, "v" if x < cx else "t")
        sw = pose["tail_swish"] * 0.7
        t_pts = [
            (cx, withers_y + 3.2),
            (cx + sw * 0.4, withers_y + 9.5),
            (cx + sw, withers_y + 18.0),
        ]
        tail_m = _tube(t_pts, [1.8, 2.6, 1.3])
        t_sh = _shade_3d(tail_m)
        for (x, y), val in t_sh.items():
            c.set(x, y, "w" if val > 0.72 and (x + y) % 2 == 0 else ("v" if val > 0.38 else "t"))

    return c.render()


def draw_horse(build_id: str, coat_id: str, direction: str, state: str, frame: int) -> Image.Image:
    build = BUILDS[build_id]
    base_pal = dict(COATS[coat_id])
    tc = build["tack_colors"]
    base_pal["c"], base_pal["x"], base_pal["z"] = tc
    if direction == "east":
        return _draw_side(build, base_pal, state, frame, "side")
    if direction == "west":
        return _draw_side(build, base_pal, state, frame, "side").transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if direction == "southeast":
        return _draw_side(build, base_pal, state, frame, "se")
    if direction == "southwest":
        return _draw_side(build, base_pal, state, frame, "se").transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if direction == "northeast":
        return _draw_side(build, base_pal, state, frame, "ne")
    if direction == "northwest":
        return _draw_side(build, base_pal, state, frame, "ne").transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if direction == "south":
        return _draw_front_or_back(build, base_pal, state, frame, front=True)
    return _draw_front_or_back(build, base_pal, state, frame, front=False)


def fauna_horse() -> dict[str, Image.Image]:
    """Emit all four horse builds (riding as default 'horse', plus 'horse.work',
    'horse.war', 'horse.race') in all 7 states and 4 cardinal directions."""
    frames: dict[str, Image.Image] = {}
    form_ids = [("riding", "horse"), ("work", "horse.work"), ("war", "horse.war"), ("race", "horse.race")]
    for build_id, art_id in form_ids:
        for state, count in STATES["horse"].items():
            for d in DIRECTIONS:
                for f in range(count):
                    im = draw_horse(build_id, "bay", d, state, f)
                    frames[f"faunac-{art_id}-{state}-{d}-{f}"] = im
    return frames


def looks() -> dict:
    """Forms and runtime-swappable coats for 'horse'."""
    coat_map = {
        name: {r: pal[r] for r in ROLES}
        for name, pal in COATS.items()
    }
    return {
        "horse": {
            "roles": {r: COATS["bay"][r] for r in ROLES},
            "forms": [
                {
                    "id": "horse",
                    "weight": 4.0,
                    "where": None,
                    "coats": {"bay": 5, "chestnut": 3, "black": 2, "dapple-grey": 1.6, "palomino": 1.2, "piebald": 0.9, "roan": 0.9, "steppe-dun": 0.8},
                },
                {
                    "id": "work",
                    "weight": 2.2,
                    "where": None,
                    "coats": {"bay": 4, "chestnut": 4, "dapple-grey": 2.5, "black": 2, "roan": 1.5, "piebald": 1.2},
                },
                {
                    "id": "war",
                    "weight": 1.2,
                    "where": None,
                    "coats": {"black": 4, "dapple-grey": 3, "bay": 3, "chestnut": 2, "steppe-dun": 1.0},
                },
                {
                    "id": "race",
                    "weight": 1.6,
                    "where": None,
                    "coats": {"bay": 4, "chestnut": 3.5, "palomino": 2.2, "black": 2, "dapple-grey": 2, "roan": 1.2},
                },
            ],
            "coats": coat_map,
            "coatFrom": {
                "chestnut": -3000,
                "grey": -500,
                "dapple-grey": -500,
                "palomino": -200,
                "piebald": -1000,
            },
        }
    }


# --------------------------------------------------------- A/B Contact Sheets
def _draw_human_scale_ref() -> Image.Image:
    im = Image.new("RGBA", (24, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rectangle((8, 49, 10, 52), fill=(58, 42, 34, 255))
    d.rectangle((13, 49, 15, 52), fill=(58, 42, 34, 255))
    d.rectangle((8, 39, 10, 48), fill=(86, 76, 68, 255))
    d.rectangle((13, 39, 15, 48), fill=(86, 76, 68, 255))
    d.rectangle((7, 27, 16, 39), fill=(116, 138, 122, 255))
    d.rectangle((5, 28, 6, 37), fill=(96, 118, 104, 255))
    d.rectangle((17, 28, 18, 37), fill=(96, 118, 104, 255))
    d.ellipse((7, 16, 16, 26), fill=(214, 174, 142, 255))
    d.rectangle((7, 16, 16, 19), fill=(68, 48, 36, 255))
    d.point((10, 22), fill=(30, 22, 18, 255))
    d.point((14, 22), fill=(30, 22, 18, 255))
    return tint_outline(im)


def _pad_pony_to_horse_canvas(im: Image.Image) -> Image.Image:
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ox = (W - im.width) // 2
    oy = GROUND - (im.height - 4)
    out.paste(im, (ox, oy), im)
    return out


def _paste_zoom(sheet: Image.Image, sprite: Image.Image, x: int, y: int, zoom: int):
    z = sprite.resize((sprite.width * zoom, sprite.height * zoom), Image.Resampling.NEAREST)
    sheet.paste(z, (x, y), z)


def build_ab_sheets(out_dir: Path):
    from art.fauna_c import fauna_c

    out_dir.mkdir(parents=True, exist_ok=True)
    fc = fauna_c()
    human = _draw_human_scale_ref()
    bg = (34, 38, 44, 255)
    card = (46, 52, 60, 255)
    ground_col = (74, 88, 66, 255)
    txt = (242, 238, 226, 255)
    sub_txt = (176, 184, 196, 255)
    accent = (238, 196, 98, 255)

    # SHEET 1: Scale, Silhouette & 4-Direction Turnaround A/B
    zoom = 3
    cw, ch = W * zoom, H * zoom
    pad = 16
    label_w = 260
    cols = 5
    rows_spec = [
        ("A: Current Sprite -> Recast as PONY", "40x35 standing (~22px withers, ~12hh)", None, "bay"),
        ("B1: Riding Horse", BUILDS["riding"]["sub"], "riding", "bay"),
        ("B2: Workhorse (Draft)", BUILDS["work"]["sub"], "work", "chestnut"),
        ("B3: War Horse (Destrier)", BUILDS["war"]["sub"], "war", "black"),
        ("B4: Race Horse (Courser)", BUILDS["race"]["sub"], "race", "palomino"),
    ]
    sh_w = label_w + cols * (cw + pad) + pad
    sh_h = 74 + len(rows_spec) * (ch + pad) + 120
    s1 = Image.new("RGBA", (sh_w, sh_h), bg)
    d1 = ImageDraw.Draw(s1)
    d1.text((20, 16), "A/B COMPARISON 1: SCALE vs 37px ADULT HUMAN & 4-DIRECTION TURNAROUND (3x zoom)", fill=accent)
    col_titles = ["Scale vs 37px Human", "East (Side)", "South (Front)", "North (Rear)", "West (Side)"]
    for ci, ct in enumerate(col_titles):
        d1.text((label_w + ci * (cw + pad) + 8, 48), ct, fill=sub_txt)

    for ri, (title, sub, bid, coat) in enumerate(rows_spec):
        ry = 72 + ri * (ch + pad)
        d1.rounded_rectangle((12, ry, sh_w - 12, ry + ch), radius=8, fill=card)
        d1.text((22, ry + 18), title, fill=accent if bid else txt)
        d1.text((22, ry + 40), sub, fill=sub_txt)

        for ci in range(cols):
            cx_cell = label_w + ci * (cw + pad)
            gy = ry + GROUND * zoom
            d1.line((cx_cell + 6, gy + 2, cx_cell + cw - 6, gy + 2), fill=ground_col, width=2)
            if ci == 0:
                _paste_zoom(s1, human, cx_cell + 6, ry, zoom)
                sp = _pad_pony_to_horse_canvas(tint_outline(fc["faunac-pony-idle-east-0"])) if bid is None else draw_horse(bid, coat, "east", "idle", 0)
                _paste_zoom(s1, sp, cx_cell + 36, ry, zoom)
            else:
                dir_name = ("east", "south", "north", "west")[ci - 1]
                sp = _pad_pony_to_horse_canvas(tint_outline(fc[f"faunac-pony-idle-{dir_name}-0"])) if bid is None else draw_horse(bid, coat, dir_name, "idle", 0)
                _paste_zoom(s1, sp, cx_cell, ry, zoom)

    strip_y = 72 + len(rows_spec) * (ch + pad) + 12
    d1.rounded_rectangle((12, strip_y, sh_w - 12, strip_y + 92), radius=8, fill=(58, 72, 52, 255))
    d1.text((22, strip_y + 10), "1x NATIVE PLAY SCALE LINEUP (left to right: 37px Human, Current Pony, Riding, Work, War, Race)", fill=accent)
    lx = 36
    s1.paste(human, (lx, strip_y + 28), human)
    lx += 48
    for bid, coat in [(None, "bay"), ("riding", "bay"), ("work", "chestnut"), ("war", "black"), ("race", "palomino")]:
        sp = _pad_pony_to_horse_canvas(tint_outline(fc["faunac-pony-idle-east-0"])) if bid is None else draw_horse(bid, coat, "east", "idle", 0)
        s1.paste(sp, (lx, strip_y + 28), sp)
        lx += 78
    s1.save(out_dir / "horse-ab-turnaround.png")

    # SHEET 2: Coat Varieties + 4x Close-Up A vs B
    z2 = 3
    cw2, ch2 = W * z2, H * z2
    coat_list = [k for k in COATS if k not in ("grey", "dun")]
    s2_w = 4 * (cw2 + pad) + pad + 24
    s2_h = 74 + 2 * (ch2 + 36) + 310
    s2 = Image.new("RGBA", (s2_w, s2_h), bg)
    d2 = ImageDraw.Draw(s2)
    d2.text((20, 16), "A/B COMPARISON 2: COAT VARIETIES (ROLE-SWAPPABLE PALETTES) & 4x PIXEL-CRAFT DETAIL", fill=accent)

    for idx, coat_id in enumerate(coat_list):
        col = idx % 4
        row = idx // 4
        x0 = 20 + col * (cw2 + pad)
        y0 = 60 + row * (ch2 + 36)
        d2.rounded_rectangle((x0, y0, x0 + cw2, y0 + ch2 + 24), radius=8, fill=card)
        d2.line((x0 + 8, y0 + GROUND * z2 + 2, x0 + cw2 - 8, y0 + GROUND * z2 + 2), fill=ground_col, width=2)
        bid = ("riding", "work", "war", "race")[col]
        sp = draw_horse(bid, coat_id, "east", "trot", 2)
        _paste_zoom(s2, sp, x0, y0, z2)
        d2.text((x0 + 10, y0 + ch2 + 4), f"{coat_id} ({bid})", fill=txt)

    cy_bot = 60 + 2 * (ch2 + 36) + 12
    d2.rounded_rectangle((20, cy_bot, s2_w - 20, cy_bot + 285), radius=8, fill=card)
    d2.text((34, cy_bot + 12), "4x ANATOMY & SHADING CLOSE-UP: A (Current Pony) vs B (New Riding & War Horse)", fill=accent)
    pony4 = _pad_pony_to_horse_canvas(tint_outline(fc["faunac-pony-idle-east-0"]))
    ride4 = draw_horse("riding", "bay", "east", "idle", 0)
    war4 = draw_horse("war", "dapple-grey", "east", "idle", 0)
    for i, (lbl, sp) in enumerate([("A: Current Pony", pony4), ("B: New Riding (Bay)", ride4), ("B: New War (Dapple Grey)", war4)]):
        bx = 34 + i * 265
        _paste_zoom(s2, sp, bx, cy_bot + 28, 4)
        d2.text((bx + 20, cy_bot + 258), lbl, fill=txt)
    s2.save(out_dir / "horse-ab-coats.png")

    # SHEET 3: 8-Frame Animation Filmstrips A/B
    z3 = 2
    cw3, ch3 = W * z3, H * z3
    anim_rows = [
        ("A: Current Pony - Walk (8f)", None, "bay", "wander"),
        ("B: Riding Horse - 4-Beat Walk (8f)", "riding", "bay", "wander"),
        ("B: Workhorse - Heavy Trot (8f)", "work", "chestnut", "trot"),
        ("B: Race Horse - Full Suspension Gallop (8f)", "race", "palomino", "flee"),
        ("B: Riding Horse - Graze & Head-Dip (8f)", "riding", "bay", "graze"),
        ("B: Workhorse - Resting / Lying Down (8f)", "work", "dapple-grey", "rest"),
        ("B: War Horse - Dramatic Rear (8f)", "war", "black", "rear"),
    ]
    s3_w = 24 + 8 * (cw3 + 6) + 16
    s3_h = 64 + len(anim_rows) * (ch3 + 30) + 16
    s3 = Image.new("RGBA", (s3_w, s3_h), bg)
    d3 = ImageDraw.Draw(s3)
    d3.text((20, 16), "A/B COMPARISON 3: 8-FRAME ANIMATION FILMSTRIPS (2x zoom)", fill=accent)

    for ri, (label, bid, coat, st) in enumerate(anim_rows):
        ry = 54 + ri * (ch3 + 30)
        d3.rounded_rectangle((12, ry, s3_w - 12, ry + ch3 + 22), radius=6, fill=card)
        d3.text((22, ry + 4), label, fill=accent if bid else txt)
        for f in range(8):
            fx = 20 + f * (cw3 + 6)
            gy = ry + 20 + GROUND * z3
            d3.line((fx + 4, gy + 1, fx + cw3 - 4, gy + 1), fill=ground_col, width=1)
            if bid is None:
                sp = _pad_pony_to_horse_canvas(tint_outline(fc[f"faunac-pony-{st}-east-{f}"]))
            else:
                sp = draw_horse(bid, coat, "east", st, f)
            _paste_zoom(s3, sp, fx, ry + 20, z3)
    s3.save(out_dir / "horse-ab-animation.png")


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[2]
    build_ab_sheets(root / "artifacts")
    print("Wrote A/B horse contact sheets to artifacts/")
