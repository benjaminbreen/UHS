"""The Nahua sacred precinct front-on: temple pyramids and the ball court.

    .venv/bin/python scripts/art/front_meso_precinct.py artifacts/meso/precinct.png

The pyramid rises in talud tiers, a painted band at the head of each, a
stair between alfardas that end in dados, serpent heads at its foot. On
the summit: a thatched shrine (small), a shrine under a tall painted roof
or the round temple of Ehecatl-Quetzalcoatl (medium), or the twin shrines
of the Templo Mayor, Tlaloc's banded blue and white and Huitzilopochtli's
red (large). The ball court comes in pieces laid round a sanded alley: the
north range shows its sloping bench and sheer wall with the stone ring,
the south range its low outer wall and the bench sloping away from us,
the four wing walls close the ends of the I. Lowland courts are plastered
red. Looks change bands, rings and what stands on the ranges.
"""
from pathlib import Path
import functools
import math
import sys

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

import numpy as np  # noqa: E402

from art.front_materials import C, h2  # noqa: E402
from art.front_kit import finish, consolidate  # noqa: E402
from art import front_solid as so  # noqa: E402
from art import front_stepped as st  # noqa: E402
from art.front_meso_civic import (LIME, TEZ, RED, OCHRE, TURQ, STRAW, BASALT, VOID, ramp8, brazier, banner,  # noqa: E402
                                  glow, conch, stepped, eye_band)

TLALOC = ramp8('#dcf0f6', '#aad8ea', '#76b8d6', '#5294bc', '#3d729c', '#2e547a', '#223b58', '#18283c')
MAYA = ramp8('#f8cdb1', '#eaa98b', '#d5876c', '#b96855', '#974e44', '#733938', '#50292f', '#351c22')
BODY, BAND, STAIR, ALF, WALL, ROOF, RING, PLINTH, THATCH, DRUM, HOUSE = range(1, 12)


def night(c, info):
    from art.front_sinitic import night_image
    lit = info.pop('lit', None)
    if lit:
        info['night'] = night_image(c.im, lit)


# ------------------------------------------------------------------ pyramid

def serpent(c, x, by, flip=False):
    """A serpent head at the foot of an alfarda, jaws open, tongue out."""
    st.glyph(c, x, by - 7, ('..aabb..',
                            '.abbbbbc',
                            'abVbbbbc',
                            'abbbbbcc',
                            'aWbWbWcc',
                            '.dddbcc.',
                            '..RR....'),
             {'a': LIME[0], 'b': LIME[2], 'c': LIME[4], 'd': LIME[5], 'V': VOID, 'W': LIME[0], 'R': RED[2]}, flip)


def pyramid(spec, info):
    """The temple pyramid as a solid: talud tiers with a painted band, the
    stair standing proud between alfardas that end in dados, the shrines on
    the summit."""
    from art.front_sacred import complete, ground_shadow
    look = spec.get('look', 0) % 3
    fw, fh = spec['footprint']
    W, D = fw * 16, fh * 16
    n, th = spec['tiers'], spec['tier_h']
    summit = spec['summit']
    if summit == 'shrine' and look == 2:
        summit = 'ehecatl'
    twin = summit == 'twin'
    small = summit == 'thatch-shrine'
    body = TEZ if look == 1 else LIME
    band = (RED, LIME, TLALOC)[look]
    alf_r = RED if look != 2 else TLALOC
    H = n * th
    sx = (W * (0.17 if twin else 0.2 if small else 0.22)) / n
    sy = min(14, (D * 0.5) / n)
    tal = 0.5
    pl = 4
    ytop = n * sy
    yfront = -(10 if small else 16 if twin else 14)
    rise = 3
    run = (ytop - yfront) / (H / rise)
    aw = 4 if small else 5
    if twin:
        sw = round(W * 0.14); gap = aw * 2 + 2
        stairs = [(-gap / 2 - sw, -gap / 2), (gap / 2, gap / 2 + sw)]
    else:
        sw = round(W * (0.22 if small else 0.18))
        stairs = [(-sw / 2, sw / 2)]
    dado = 0 if small else 10
    z0 = pl + H
    ys = ytop + (6 if small else 10)
    sd = min(D - ys - 2, 18 if small else 14 if not summit == 'ehecatl' else 26)
    wh, rh = (16, 0) if small else (20, 24)
    if twin:
        shw = round(W * 0.26)
        shrines = [(-W * 0.15, shw, 'tlaloc'), (W * 0.15, shw, 'huitz')]
    elif small:
        shrines = [(0, round(W * 0.34), 'thatch')]
    else:
        shrines = [(0, round(W * 0.36), 'ehecatl' if summit == 'ehecatl' else 'plain')]
    R_e = min(sd / 2 + 2, 17)

    def stair_surface(Z):
        return yfront + (ytop - yfront) * np.clip(Z - pl, 0, None) / H

    def solid(X, Y, Z):
        m = np.zeros(X.shape, int)
        k = np.clip(np.floor((Z - pl) / th), 0, n - 1)
        f = np.clip((Z - pl - k * th) / th, 0, 1)
        e = k + np.where(f < 0.8, tal * f / 0.8, tal)
        bi = (Z >= pl) & (Z < z0) & (np.abs(X) <= W / 2 - 3 - e * sx) & (Y >= e * sy) & (Y <= D)
        m[bi & (f >= 0.8)] = BAND
        m[bi & (f < 0.8)] = BODY
        m[(Z >= 0) & (Z < pl) & (np.abs(X) <= W / 2) & (Y >= yfront - 3) & (Y <= D)] = PLINTH
        for a, b in stairs:
            steps = yfront + run * np.ceil(np.clip(Z - pl, 0, None) / rise)
            m[(X >= a) & (X <= b) & (Z >= pl) & (Z < z0) & (Y >= steps) & (Y <= ytop + 1)] = STAIR
            for ax in (a - aw, b):
                top_d = z0 - dado
                ramp_ok = (Z < top_d) & (Y >= stair_surface(Z - 3))
                ydado = stair_surface(top_d - 3) - 1
                dado_ok = (Z >= top_d) & (Z < z0 + 3) & (Y >= ydado) if dado else np.zeros(X.shape, bool)
                wx = np.where(Z >= top_d, 1, 0) if dado else 0
                m[(X >= ax - wx) & (X <= ax + aw + wx) & (Z >= pl) & (ramp_ok | dado_ok) & (Y <= ytop + 2)] = ALF
        for scx, w, god in shrines:
            if god == 'ehecatl':
                r2 = (X - scx) ** 2 + (Y - ys - R_e) ** 2
                m[(r2 <= R_e ** 2) & (Z >= z0) & (Z < z0 + 20)] = DRUM
                cone = z0 + 18 + 30 * (1 - np.sqrt(r2) / (R_e + 5))
                m[(r2 <= (R_e + 5) ** 2) & (Z >= z0 + 18) & (Z < cone)] = THATCH
                continue
            inb = (np.abs(X - scx) <= w / 2) & (Y >= ys) & (Y <= ys + sd)
            m[inb & (Z >= z0) & (Z < z0 + wh)] = WALL
            if god == 'thatch':
                hw, hd = w / 2 + 4, sd / 2 + 4
                yc = ys + sd / 2
                dist = np.minimum(hw - np.abs(X - scx), hd - np.abs(Y - yc))
                m[(dist >= 0) & (Z >= z0 + wh - 2) & (Z < z0 + wh - 2 + np.minimum(dist * 1.6, 30))] = THATCH
            else:
                rb = (np.abs(X - scx) <= w / 2 + 2) & (Y >= ys - 2) & (Y <= ys + sd + 1)
                m[rb & (Z >= z0 + wh) & (Z < z0 + wh + rh)] = ROOF
        return m

    hgt = z0 + 70 + round((D - yfront) * so.K)
    c = C(W + 24, hgt + 12)
    base = c.h - 8
    cx = (W + 24) // 2
    # ramp slots: 1 body, 2 band, 3 lime, 4 alfarda, 5 basalt, 6 straw, 7 tlaloc, 8 red
    ramps = [None, body, band, LIME, alf_r, BASALT, STRAW, TLALOC, RED]

    def god_at(x):
        return min(shrines, key=lambda s: abs(s[0] - x))

    def paint(mm, face, x, y, z):
        if mm in (BODY, BAND):
            f = ((z - pl) % th) / th
            if face == 0:
                k = min(n - 1, int((z - pl) // th))
                e = k + (tal * f / 0.8 if f < 0.8 else tal)
                r = 3 if look != 1 else 1
                if f < 0.06 or f > 0.97 or z >= z0 - 0.5:
                    return r, 1
                if abs(x) >= W / 2 - 3 - e * sx - 1.2:
                    return r, 1 if x < 0 else 4
                return r, 2
            if mm == BAND:
                return 2, 3
            q = 3
            if look == 1:
                cz = int(z - pl) // 4
                if int(z - pl) % 4 == 0 or h2(int((x + cz * 6) // 10), cz, 3) > 0.93:
                    q = 4
            elif int(z - pl) % 5 == 0 and h2(int(x) // 12, int(z - pl) // 5, 5) > 0.55:
                q = 4
            return 1, q
        if mm == PLINTH:
            return 5 if look == 1 else 3, 1 if face == 0 else 3
        if mm == STAIR:
            return 3, 1 if face == 0 else 3
        if mm == ALF:
            return 4, 1 if face == 0 else 2
        if mm == WALL:
            return 3, 1 if face == 0 else 2
        if mm == DRUM:
            if face == 0:
                return 3, 1
            nx = (x - god_at(x)[0]) / R_e
            q = 1 if nx < -0.45 else 2 if nx < 0.2 else 3 if nx < 0.7 else 4
            return (8 if 8 < z - z0 < 12 else 3), q
        if mm == THATCH:
            q = 2
            scx, w, god = god_at(x)
            if god == 'ehecatl':
                nx = (x - scx) / (R_e + 5)
                q = 1 if nx < -0.4 else 2 if nx < 0.25 else 3
            else:
                hw, hd = w / 2 + 4, sd / 2 + 4
                dx, dy = hw - abs(x - scx), hd - abs(y - ys - sd / 2)
                q = (1 if x < scx else 3) if dx < dy else 2 if y < ys + sd / 2 else 3
            if int(z) % 3 == 0:
                q += 1
            if h2(int(x) // 2, int(z) // 3, 7) > 0.85:
                q += 1
            return 6, min(6, q)
        if mm == ROOF:
            if face == 0:
                return 3, 2
            scx, w, god = god_at(x)
            if god == 'tlaloc':
                return (7, 2) if int(x - scx + w) // 4 % 2 else (3, 1)
            return 8, 3
        return 3, 2

    proj = so.carve(c, cx, base, -W / 2 - 1, W / 2 + 1, yfront - 4, D + 1, hgt, solid, paint, ramps)
    overlays, smoke = [], []
    info.update(overlays=overlays, smoke=smoke)
    door_by = None
    for scx, w, god in shrines:
        if god == 'ehecatl':
            dw, dh = 10, 15
        else:
            dw, dh = (8, 12) if god == 'thatch' else (10, 16)
        fx, fy = proj(scx, ys, z0)
        fx, fy = round(fx), round(fy)
        frame = {'tlaloc': TLALOC, 'huitz': RED, 'ehecatl': RED}.get(god, RED)
        c.rect(fx - dw // 2 - 2, fy - dh - 2, dw + 4, dh + 2, frame[3])
        c.rect(fx - dw // 2 - 2, fy - dh - 2, dw + 4, 1, frame[1])
        c.rect(fx + dw // 2 + 1, fy - dh - 1, 1, dh + 1, frame[5])
        c.rect(fx - dw // 2, fy - dh, dw, dh, VOID)
        if god == 'ehecatl':
            for tx in range(fx - dw // 2, fx + dw // 2, 3):
                c.p(tx, fy - dh, LIME[0]); c.p(tx + 1, fy - dh, LIME[0]); c.p(tx, fy - dh + 1, LIME[1])
        glow(info, fx - dw // 2, fy - dh + 2, dw, dh - 2, 2)
        smoke.append([fx, fy - dh - 2, 'vent'])
        door_by = fy
        if god in ('tlaloc', 'huitz', 'plain'):
            rx0, ry = proj(scx - w / 2 - 2, ys - 2, z0 + wh + rh)
            rx0, ry = round(rx0), round(ry)
            rw = w + 5
            if god == 'huitz':
                for j, yy in enumerate(range(ry + 4, ry + rh - 4, 6)):
                    for xx in range(rx0 + 3 + (j % 2) * 4, rx0 + rw - 5, 8):
                        st.glyph(c, xx, yy, ('.aa.', 'abba', 'dbbd', '.b.b'), {'a': LIME[0], 'b': LIME[1], 'd': RED[6]})
            elif god == 'tlaloc':
                for xx in range(rx0 + 3, rx0 + rw - 4, 8):
                    yy = ry + rh // 2 - 2
                    c.rect(xx, yy, 4, 4, LIME[0]); c.p(xx + 1, yy + 1, TLALOC[6]); c.p(xx + 2, yy + 2, TLALOC[6])
            else:
                eye_band(c, rx0, ry + 6, rw, 7)
            ty = round(proj(0, ys - 2, z0 + wh + rh)[1])
            for mx in range(rx0, rx0 + rw - 7, 9):
                (conch if god != 'huitz' else stepped)(c, mx + (1 if god != 'huitz' else 0),
                                                       ty - (12 if god != 'huitz' else 2), LIME)
    for a, b in stairs:
        for ax, flip in ((a - aw, False), (b, True)):
            px, py = proj(ax + aw / 2, yfront - 3, 0)
            if not small:
                serpent(c, round(px) - 4, round(py) + 1, flip)
    lx, ly = proj(-W / 2 + n * sx + 4, ytop + 2, z0)
    rxx, _ = proj(W / 2 - n * sx - 10, ytop + 2, z0)
    for bx in (lx, rxx):
        brazier(c, round(bx), round(ly), overlays)
    if not small:
        for bx in (round(lx) - 4, round(rxx) + 12):
            banner(c, bx, round(ly) - 1, overlays, h=22)
    if twin:
        for bx in (-W / 2 + 8, W / 2 - 14):
            px, py = proj(bx, yfront - 2, pl)
            brazier(c, round(px), round(py), overlays)
    ground_shadow(c, cx - W // 2, cx + W // 2, base)
    finish(c)
    consolidate(c, rare=3)
    out = complete(c, info, cx - W // 2, W, base + 1, cx + (round(shrines[0][0]) if twin else 0), 22, fh * 16, leaf=False,
                   door_base=door_by, door_width=10, summit_door=True, overlays=overlays, roof='flat')
    night(c, info)
    return out


# ------------------------------------------------------------------ ball court

def court_look(profile, look):
    """Body, band and the paint on the court wall. Lowland courts are white
    with a red wall, all red, or white with a blue wall."""
    if profile == 'maya':
        return ((LIME, MAYA, MAYA), (MAYA, LIME, MAYA), (LIME, TURQ, TURQ))[look % 3]
    return ((LIME, RED, RED), (LIME, TURQ, LIME), (LIME, OCHRE, OCHRE))[look % 3]


def court(spec, info):
    """One piece of the court as a solid. The north range shows its lit
    bench, painted wall and stone ring; the south range its outer wall and
    stair; the wing walls close the ends of the I."""
    from art.front_sacred import ground_shadow
    profile, scale, key, look = spec['profile'], spec['scale'], spec['key'], spec.get('look', 0) % 3
    maya = profile == 'maya'
    fw, fh = spec['footprint']
    W, D = fw * 16, fh * 16
    small = scale == 'small'
    body, band, paint_r = court_look(profile, look)
    carved = look != 1
    overlays, smoke = [], []
    info.update(overlays=overlays, smoke=smoke)
    side = key.split('-')[0]
    stairs, house, ring_at = [], None, None
    if side == 'north':
        wall_h = 28 if small else 34
        bench_y, bench_h = 14, 11
        stairs = [(-W / 2 + 6, -W / 2 + 18), (W / 2 - 18, W / 2 - 6)]
        ring_at = (0, wall_h - 11)
        if scale == 'large':
            house = (round(W * (0.3 if maya else 0.16)), 22, 26)
    elif side == 'south':
        wall_h = 16 if small else 20
        stairs = [(-8, 8)]
    else:
        wall_h = 12 if small else 14
    rise = 3

    def solid(X, Y, Z):
        m = np.zeros(X.shape, int)
        inx = np.abs(X) <= W / 2
        if side == 'north':
            bench = np.clip(2 + (bench_h - 2) * Y / bench_y, 0, bench_h)
            m[inx & (Y >= 0) & (Y < bench_y) & (Z >= 0) & (Z < bench)] = BODY
            m[inx & (Y >= bench_y) & (Y <= D) & (Z >= 0) & (Z < wall_h)] = BODY
            m[inx & (Y >= bench_y) & (Y <= D) & (Z >= wall_h - 4) & (Z < wall_h)] = BAND
            m[inx & (Y >= 0) & (Y < 2) & (Z >= 0) & (Z < 2.5)] = BAND
            rx, rz = ring_at
            px = np.mod(X - 15, 30)
            mid = X - px + 15
            keep = (np.abs(mid - rx) > 20) & (mid - 15 > stairs[0][1] + 4) & (mid + 15 < stairs[1][0] - 4)
            panel = keep & (px >= 3) & (px < 27) & (Z >= bench_h + 4) & (Z < wall_h - 7) & (Y >= bench_y) & (Y < bench_y + 2)
            m[panel & inx] = 0
            r = np.hypot(X - rx, Z - rz)
            m[(r <= 8) & (r >= 3) & (Y >= bench_y - 4) & (Y < bench_y)] = RING
        elif side == 'south':
            dz = np.where(Y < 18, wall_h, np.clip(wall_h - 8 - (Y - 18) * 0.6, 2, None))
            m[inx & (Y >= 0) & (Y <= D) & (Z >= 0) & (Z < dz)] = BODY
            m[inx & (Y >= 0) & (Y < 18) & (Z >= wall_h - 4) & (Z < wall_h)] = BAND
        else:
            m[inx & (Y >= 0) & (Y <= D - 4) & (Z >= 0) & (Z < wall_h)] = BODY
            m[inx & (Y >= 0) & (Y <= D - 4) & (Z >= wall_h - 3) & (Z < wall_h)] = BAND
        for a, b in stairs:
            y0 = -12 if side == 'south' else -2
            y1 = 0 if side == 'south' else bench_y + 8
            run = (y1 - y0) / (wall_h / rise)
            steps = y0 + run * np.ceil(Z / rise)
            sx = (X >= a) & (X <= b)
            cut = sx & (Z < wall_h) & (Y < y1)
            m[cut] = 0
            m[sx & (Z < wall_h) & (Y >= steps) & (Y <= y1)] = STAIR
            if side == 'south':
                for ax in (a - 4, b):
                    surf = y0 + (y1 - y0) * np.clip(Z - 3, 0, None) / wall_h
                    m[(X >= ax) & (X <= ax + 4) & (Z < wall_h + 2) & (Y >= surf) & (Y <= y1)] = ALF
        if house:
            hw, hh, hy = house
            hb = (np.abs(X) <= hw) & (Y >= hy) & (Y <= hy + 14)
            m[hb & (Z >= wall_h) & (Z < wall_h + hh)] = HOUSE
            m[(np.abs(X) <= hw + 2) & (Y >= hy - 2) & (Y <= hy + 16) & (Z >= wall_h + hh) & (Z < wall_h + hh + 4)] = ROOF
            if maya:
                comb = (np.abs(X) <= hw * 0.6) & (Y >= hy + 6) & (Y <= hy + 8) & (Z >= wall_h + hh + 4) & (Z < wall_h + hh + 20)
                slot = ((np.floor(X + 100) % 9) >= 3) & ((np.floor(X + 100) % 9) < 6) & ((np.floor(Z) % 8) >= 3)
                m[comb & ~slot] = ROOF
        return m

    top_extra = 50 if house else 22
    c = C(W + 24, wall_h + round((D + 14) * so.K) + top_extra + 10)
    base = c.h - 4
    cx = (W + 24) // 2
    ramps = [None, body, band, LIME if not maya else body, band, BASALT, body, body, [body[0], body[0]] + list(body[:6]),
             paint_r, MAYA]

    def paint(mm, face, x, y, z):
        if mm == BODY:
            if face == 0:
                if side == 'north' and y < bench_y:
                    return 8, 1
                if side == 'north' and bench_h + 2 < z < wall_h - 5 and y < bench_y + 3:
                    return 9, 2
                if side == 'south' and y > 18:
                    return 1, 3
                return 1, 1
            q = 3 if side == 'north' and y >= bench_y + 1 else 2
            if side == 'north' and z >= bench_h - 1:
                return 9, 4 if y >= bench_y + 1.5 else 2
            if h2(int(x) // 7, int(z) // 4, 11 + look) > 0.985:
                q += 1
            return 1, q
        if mm == BAND:
            return (1, 1) if face == 0 else (2, 3)
        if mm == STAIR:
            return 3, 1 if face == 0 else 3
        if mm == ALF:
            return 4, 1 if face == 0 else 2
        if mm == RING:
            a = math.atan2(z - ring_at[1], x - ring_at[0])
            q = 1 if (x - ring_at[0]) + (z - ring_at[1]) * -1 < -2 else 3 if (x - ring_at[0]) - (z - ring_at[1]) > 2 else 2
            if carved and int((a + math.pi) / (math.pi / 6)) % 2 and 5 < math.hypot(x - ring_at[0], z - ring_at[1]) < 7:
                q += 1
            return 5, q
        if mm == HOUSE:
            if face == 0:
                return 3, 1
            if maya:
                if z >= wall_h + house[1] - 6:
                    return (3, 1) if (int(x) // 3 + int(z) // 3) % 2 else (10, 3)
                return 10, 3
            return 6, 2
        if mm == ROOF:
            return 7, 1 if face == 0 else 3
        return 1, 2

    proj = so.carve(c, cx, base, -W / 2 - 1, W / 2 + 1, -14, D + 1, c.h, solid, paint, ramps)
    x0 = cx - W // 2
    door_x, door_base, door_h = cx, base, 10
    if side == 'north':
        bx, by = proj(ring_at[0], bench_y - 4, ring_at[1])
        overlays.append(['ball', round(bx) - 2, base - 9])
        dx, dy = proj((stairs[0][0] + stairs[0][1]) / 2, 0, 0)
        door_x, door_base, door_h = round(dx), base, 14
        ty = round(proj(0, bench_y, wall_h)[1])
        if not maya and not small:
            for mx in range(x0 + 24, x0 + W - 30, 16):
                if not any(abs(mx + 4 - (cx + (a + b) / 2)) < 10 for a, b in stairs):
                    (conch if look == 0 else stepped)(c, mx, ty - (11 if look == 0 else 0), LIME)
        if not small:
            dy = round(proj(0, D - 6, wall_h)[1])
            for bxx in (x0 + 24, x0 + W - 28):
                brazier(c, bxx, dy, overlays)
            for bxx in (x0 + 4, x0 + W - 6):
                banner(c, bxx, round(proj(0, D - 2, wall_h)[1]), overlays, h=20)
        if house:
            hw, hh, hy = house
            fx, fy = proj(0, hy, wall_h)
            fx, fy = round(fx), round(fy)
            for ddx in ([round(2 * hw * (k - 2) / 5) for k in range(5)] if maya else (0,)):
                c.rect(fx + ddx - 4, fy - 13, 9, 13, VOID)
                glow(info, fx + ddx - 4, fy - 13, 9, 13, 2)
            if not maya:
                ty = round(proj(0, hy - 2, wall_h + hh + 4)[1])
                for mx in range(fx - hw - 2, fx + hw - 6, 9):
                    conch(c, mx, ty - 10, LIME)
            smoke.append([fx, fy - 15, 'vent'])
    elif side == 'south':
        if not small:
            ty = round(proj(0, 14, wall_h)[1])
            for bxx in (x0 + 10, x0 + W - 12):
                brazier(c, bxx, ty, overlays)
    ground_shadow(c, x0, x0 + W, base)
    finish(c)
    consolidate(c, rare=3)
    info.update(x0=x0, W=W, base=base, door_x=door_x, door_h=door_h, door_base=door_base, door_width=12,
                leaf=False, doorless=side not in ('north', 'south'))
    night(c, info)
    return c.im


BUILDERS = {'meso-court': court}


@functools.cache
def _pack(name):
    import json
    return json.loads((ROOT / f'public/packs/{name}.json').read_text())


def baked(name):
    """A frame as the game has it now, with its anchor, for the A column."""
    from PIL import Image
    model = _pack('models').get(name)
    for pack in ('sacred-buildings', 'precincts'):
        frames = _pack(pack)['frames']
        if name in frames:
            f = frames[name]['frame']
            im = Image.open(ROOT / f'public/packs/{pack}.png').crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
            return im, model['anchor']
    return None, None


def assemble(shape, piece):
    """The court laid out as the game lays it: each piece anchored under the
    middle of its front edge, the alley sanded, the shrine left out."""
    from PIL import Image
    w, h = shape['size']
    pad = 90
    im = Image.new('RGBA', (w * 16 + 24, h * 16 + pad), (0, 0, 0, 0))
    for x in range(w * 16):
        for y in range(h * 16):
            im.putpixel((x + 12, y + pad), (214, 196, 150, 255) if (x // 16 + y // 16) % 2 else (210, 192, 146, 255))
    for p in sorted((p for p in shape['pieces'] if p['key'] != 'shrine'), key=lambda p: p['at'][1] + p['footprint'][1]):
        sp, (ax, ay) = piece(p)
        if sp is None:
            continue
        x = 12 + (p['at'][0] + p['footprint'][0] / 2) * 16 - ax
        y = pad + (p['at'][1] + p['footprint'][1]) * 16 - ay
        im.alpha_composite(sp, (max(0, round(x)), max(0, round(y))))
    return im


def sheet(out, zoom=2):
    """A/B/C: what the game draws now, then the three new looks."""
    from PIL import Image, ImageDraw
    from art.reference import current_adult
    import json
    adult = current_adult()
    temples = json.loads((ROOT / 'src/content/graphics/meso-landmarks.json').read_text())['temples']['nahua']['scales']
    rows = []
    for scale, shape in temples.items():
        rows.append([baked(f'religious-meso-temple-nahua-{scale}-0')[0]] +
                    [pyramid(dict(look=look, footprint=shape['footprint'], tiers=shape['tiers'],
                                  tier_h=shape['tierHeight'] + 3, summit=shape['summit']), {}) for look in range(3)])
    courts = json.loads((ROOT / 'src/content/graphics/precincts.json').read_text())['ballcourt']['scales']

    def new(profile, scale, look):
        def piece(p):
            info = {}
            im = court(dict(profile=profile, scale=scale, key=p['key'], look=look, footprint=p['footprint']), info)
            return im, (info['x0'] + info['W'] / 2, info['base'] + 1)
        return piece
    for profile in ('nahua', 'maya'):
        for scale in ('small', 'medium', 'large'):
            rows.append([assemble(courts[scale], lambda p: baked(f'precinct-ballcourt-{profile}-{scale}-{p["key"]}'))])
            rows.append([assemble(courts[scale], new(profile, scale, look)) for look in range(3)])
    W = max(sum(i.width + adult.width + 8 for i in r) for r in rows) + 8
    H = sum(max(i.height for i in r) + 18 for r in rows) + 8
    bg = Image.new('RGBA', (W, H), (176, 180, 160, 255))
    d = ImageDraw.Draw(bg)
    y = 8
    for r in rows:
        h = max(i.height for i in r)
        x = 8
        for n, im in enumerate(r):
            label = 'A  now' if (len(r) == 4 and n == 0) or len(r) == 1 else f'look {n - (len(r) == 4)}'
            d.text((x, y), label, fill=(40, 40, 40, 255))
            bg.alpha_composite(im, (x, y + 10 + h - im.height))
            bg.alpha_composite(adult, (x + im.width, y + 10 + h - adult.height - 2))
            x += im.width + adult.width + 8
        y += h + 18
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    bg.resize((W * zoom, H * zoom), Image.NEAREST).convert('RGB').save(out)
    print('wrote', out)

if __name__ == '__main__':
    sheet(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/meso/precinct.png')
