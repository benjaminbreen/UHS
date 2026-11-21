"""Front-on civic and vernacular halls replacing legacy HallBuilding (halls.py).

Four distinct world architectural families, each with three genuinely different
regional looks (silhouette, roof geometry, materials, and hand-drawn pixel-art
details) in Stardew 3/4 floating-above projection, plus live smoke & flame
animation hooks:

  HammamHall      — 0: Ottoman/Levantine ablaq & lead domes
                    1: Mamluk/Maghrebi merlons, geometric zellij & limestone domes
                    2: Anatolian/Central Asian brick pishtaq & brick domes
  SweatLodgeHall  — 0: Plains/Woodlands stitched-hide & bent-willow dome + firepit
                    1: Mesoamerican talud-tablero temazcal + roof vault + side firebox
                    2: Living-turf earth sweat house + notched-log cedar tunnel
  CarvedGableHall — 0: Maori wharenui (flax thatch, red-ochre maihi, tekoteko, tukutuku)
                    1: Melanesian Sepik haus tambaran (soaring saddle gable, spirit mural, stilts)
                    2: Pacific Northwest cedar plankhouse (shingles, Formline carved portal)
  OpenShelterHall — 0: Sahelian toguna (ultra-thick layered millet-thatch slab, carved posts)
                    1: Desert ramada brush arbour (forked posts, viga poles, feathery brush roof)
                    2: Polynesian fale fono (oval-hipped pandanus roof, stone paepae, rolled pola)
"""
import math
from art import front_materials as fm
from art.front_materials import C, RAMPS, ramp, mix, h2
from art.front_kit import outline, consolidate
from art.front_parts import GOLD, OAK, DARK, rounded, finial, cast_down
from art import front_solid as so
from art.front_solid import dome
from art.front_eave import TONES
from art.front_huts import _paint_thatch_span


def _glass_lights(c, cx, cy, R):
    """Delicate 2px sunlit glass cone rooflights (filgozu) arranged in a clean
    geometric ring on a hammam dome — matching front_persian.hammam."""
    glass_hi = (226, 240, 236, 255)
    glass_sh = ramp(180, 0.05, lift=-0.10)[3]
    for a in range(0, 360, 60 if R >= 16 else 90):
        gx = cx + round(math.cos(math.radians(a)) * R * 0.45)
        gy = cy - round(R * 0.54) + round(math.sin(math.radians(a)) * R * 0.20)
        c.p(gx, gy, glass_hi)
        c.p(gx, gy + 1, glass_sh)


def _arabesque_band(c, x0, y0, w, h, turq, cobalt, ivory, gold, frame):
    """Full-height flowing Islamic geometric wave-and-star tile frieze (fills the
    entire panel cleanly with interlocking turquoise/ivory/gold geometry)."""
    c.rect(x0, y0, w, h, cobalt[4])
    c.rect(x0, y0, w, 1, frame[0]); c.rect(x0, y0 + h - 1, w, 1, frame[4])
    c.rect(x0, y0, 1, h, frame[1]); c.rect(x0 + w - 1, y0, 1, h, frame[4])
    # Inner turquoise border framing the cobalt field.
    c.rect(x0 + 1, y0 + 1, w - 2, 1, turq[1]); c.rect(x0 + 1, y0 + h - 2, w - 2, 1, turq[3])
    # Flowing sinusoidal arabesque wave + repeating 6px star medallions filling every row!
    for xx in range(x0 + 2, x0 + w - 2):
        wy = y0 + h // 2 + round(math.sin((xx - x0) * 0.52) * max(1, (h - 6) // 2))
        c.p(xx, wy, ivory[0])
        if wy + 1 < y0 + h - 2:
            c.p(xx, wy + 1, turq[1])
        if wy - 1 > y0 + 1:
            c.p(xx, wy - 1, turq[2])
    # Diamond-star knots at every wave crest & trough.
    for sx in range(x0 + 5, x0 + w - 4, 6):
        sy = y0 + h // 2
        c.p(sx, sy, gold[0])
        if sy - 2 > y0 + 1:
            c.p(sx, sy - 2, turq[0])
        if sy + 2 < y0 + h - 2:
            c.p(sx, sy + 2, turq[0])


def _louver_window(c, cx, y0, w, h, trim_r, wood_r):
    """Louvered bathhouse window with stone sill & cast shadow (front_persian style)."""
    x0 = cx - w // 2
    c.rect(x0 - 1, y0 - 1, w + 2, h + 2, trim_r[4])
    c.rect(x0 - 1, y0 - 1, w + 2, 1, trim_r[1])
    c.rect(x0, y0, w, h, wood_r[5])
    for yy in range(y0 + 1, y0 + h - 1, 2):
        c.rect(x0 + 1, yy, w - 2, 1, wood_r[2])
    c.rect(x0 - 2, y0 + h + 1, w + 4, 2, trim_r[1])
    cast_down(c, x0 - 1, x0 + w + 1, y0 + h + 3, 3, 0.30)


class HammamHall:
    """Ottoman/Levantine, Mamluk/Maghrebi, and Anatolian brick bathhouses built
    to the front_persian.hammam craft bar: sunlit terraced roof with parapet
    shadows, 3D lathe furnace chimney seated on the roof deck with live smoke,
    delicate 2px sunlit glass dome oculi, and real coursed-masonry Islamic portals."""

    def __init__(self, W=176, size='medium', look=0, seed=0):
        self.W, self.size, self.look, self.seed = W, size, look % 3, seed
        self.x0 = 16
        self.door_x = self.x0 + W // 2
        self.door_size = (22, 42)
        self.base = 0
        self.smoke = []
        self.overlays = []
        self.c = None

    def build(self):
        W, x0, lk = self.W, self.x0, self.look
        small = self.size == 'small'
        large = self.size == 'large'
        wall_h = 52 if small else (62 if large else 56)
        deck_h = 38 if small else (58 if large else 48)
        dome_extra = 28 if small else (42 if large else 34)
        H = wall_h + deck_h + dome_extra + 14
        c = C(W + x0 * 2, H)
        self.c = c
        base = H - 6
        self.base = base
        L, R = x0, x0 + W
        cx = L + W // 2
        eave = base - wall_h
        d_top = eave - deck_h

        white = RAMPS['whitewash']
        sand = RAMPS['sandstone']
        lime = RAMPS['limestone']
        brick = RAMPS['brick']
        lead = RAMPS['lead']
        turq = ramp(186, 0.13, lift=-0.05)
        cobalt = ramp(240, 0.13, lift=-0.16)
        ablaq = ramp(26, 0.11, lift=-0.06) if (self.seed % 2 == 1) else ramp(56, 0.10, lift=-0.04)
        amber = ramp(50, 0.13, lift=0.04)

        if lk == 0:
            wall_r, trim_r, deck_r, dome_r = white, lime, lime, lead
        elif lk == 1:
            wall_r, trim_r, deck_r, dome_r = sand, lime, sand, lime
        else:
            wall_r, trim_r, deck_r, dome_r = brick, sand, sand, ramp(36, 0.085, lift=-0.05)

        # 1. SUNLIT TERRACED ROOF DECK WITH PARAPET INTERIOR SHADOWS (front_persian style)
        c.rect(L, d_top, W, deck_h + 2, deck_r[1])
        # Subtle plaster terrace weathering + back/left parapet shadows giving true depth!
        for yy in range(d_top + 10, eave - 4, 12):
            c.rect(L + 8, yy, W - 16, 1, mix(deck_r[1], deck_r[2], 0.5))
        c.rect(L + 3, d_top + 3, W - 6, 6, deck_r[3])  # back parapet shadow
        c.rect(L + 3, d_top + 3, 6, deck_h - 3, deck_r[3])  # left parapet shadow
        # Raised parapet coping around all 3 visible edges.
        c.rect(L - 1, d_top - 2, W + 2, 4, trim_r[1]); c.rect(L - 1, d_top - 2, W + 2, 1, trim_r[0])
        c.rect(L - 1, d_top, 4, deck_h + 2, trim_r[0]); c.rect(L + 3, d_top + 2, 1, deck_h, trim_r[4])
        c.rect(R - 3, d_top, 4, deck_h + 2, trim_r[3]); c.rect(R, d_top, 1, deck_h + 2, trim_r[5])

        # 2. CLUSTER OF SAUCER DOMES SEATED ON THE ROOF DECK WITH CAST SHADOWS
        def seat_dome(dx, dy, rad, drum_h=0, big=False):
            ry = round(rad * 0.35)
            for yy in range(dy - ry, dy + ry + 5):
                for xx in range(dx - rad - 1, dx + rad + 7):
                    u = (xx - (dx + 4)) / (rad + 3)
                    v = (yy - (dy + 2)) / (ry + 2)
                    if u * u + v * v <= 1 and d_top + 2 <= yy <= eave:
                        c.p(xx, yy, mix(c.g(xx, yy), DARK, 0.30))
            if drum_h:
                dt = dy - drum_h
                for yy in range(dt, dy + ry + 1):
                    for xx in range(dx - rad, dx + rad + 1):
                        nx = (xx - dx) / max(1, rad)
                        if abs(nx) > 1:
                            continue
                        eb = dy + round(ry * math.sqrt(max(0.0, 1 - nx * nx)))
                        if yy > eb:
                            continue
                        q = 1 if nx < -0.4 else (2 if nx < 0.15 else (3 if nx < 0.55 else 4))
                        if yy >= eb - 1:
                            q = 5
                        c.p(xx, yy, trim_r[q])
                d_y = dt + 2
            else:
                d_y = dy + 1
            dome(c, dx, d_y, rad - 1, dome_r, kind='hemi', courses=4 if lk == 2 else 0,
                 ribs=10 if lk == 1 else (8 if big else 6), lantern=None)
            _glass_lights(c, dx, d_y, rad - 1)
            apex = d_y - round((rad - 1) * 0.92)
            finial(c, dx, apex, GOLD)

        # 3D cylindrical furnace chimney seated squarely ON the rear-right roof terrace!
        ch_cx = R - (16 if small else 22)
        ch_by = d_top + (12 if small else 14)
        ch_h = 24 if small else 30
        for sy in range(0, 9):
            for xx in range(ch_cx + 3, ch_cx + 11 - sy // 2):
                if d_top + 2 <= ch_by - sy <= eave:
                    c.p(xx, ch_by - sy, mix(c.g(xx, ch_by - sy), DARK, 0.30))
        so.lathe(c, ch_cx, ch_by, [(0, 5.5), (3, 4.5), (ch_h - 3, 4.0), (ch_h, 5.0)],
                 brick if lk == 2 else trim_r)
        c.rect(ch_cx - 2, ch_by - ch_h - 1, 5, 1, DARK)
        self.smoke.append([ch_cx, ch_by - ch_h - 2, 'chimney'])

        if small:
            seat_dome(cx - 10, d_top + deck_h // 2 + 5, 19, drum_h=4, big=True)
            seat_dome(cx + 16, d_top + deck_h // 2 + 7, 12)
        elif large:
            seat_dome(L + 42, d_top + 17, 16)
            seat_dome(R - 48, d_top + 17, 16)
            seat_dome(L + 36, eave - 14, 17)
            seat_dome(R - 38, eave - 14, 17)
            seat_dome(cx, d_top + deck_h // 2 + 5, 31, drum_h=9, big=True)
        elif lk == 1:
            seat_dome(L + 28, d_top + 14, 11)
            seat_dome(L + 34, eave - 13, 16)
            seat_dome(R - 34, eave - 13, 16)
            seat_dome(cx, d_top + deck_h // 2 + 5, 24, drum_h=7, big=True)
        else:
            seat_dome(L + 32, d_top + deck_h // 2 + 6, 17)
            seat_dome(R - 36, d_top + deck_h // 2 + 6, 17)
            seat_dome(cx, d_top + deck_h // 2 + 7, 25, drum_h=7, big=True)

        # 3. FRONT FACADE WALL (distinct masonry & crown per look)
        if lk == 0:
            fm.whitewash(c, L, eave, W, wall_h, white, lime)
        elif lk == 1:
            fm.ashlar(c, L, eave, W, wall_h, sand, 7, 16)
        else:
            fm.brick(c, L, eave, W, wall_h, brick, self.seed)
        # Dressed-stone plinth band at the foot.
        fm.ashlar(c, L, base - 10, W, 10, trim_r, 5, 12)
        c.rect(L - 2, base - 4, W + 4, 4, trim_r[4]); c.rect(L - 2, base - 4, W + 4, 1, trim_r[1])

        if lk == 0:
            c.rect(L - 3, eave - 3, W + 6, 4, lime[1]); c.rect(L - 3, eave + 1, W + 6, 2, lime[5])
        elif lk == 1:
            c.rect(L - 2, eave - 2, W + 4, 3, lime[1]); c.rect(L - 2, eave + 1, W + 4, 2, sand[5])
            for mx in range(L + 2, R - 6, 12):
                c.rect(mx, eave - 6, 8, 4, lime[2]); c.rect(mx, eave - 6, 8, 1, lime[0])
                c.rect(mx + 2, eave - 9, 4, 3, lime[1]); c.rect(mx + 2, eave - 9, 4, 1, lime[0])
        else:
            c.rect(L - 2, eave - 2, W + 4, 3, sand[1]); c.rect(L - 2, eave + 1, W + 4, 2, brick[6])

        # 4. COURSED-MASONRY ISLAMIC ENTRANCE PORTAL (ZERO flat brown rectangles!)
        # Seeded slight asymmetry on Ottoman street fronts (centered on Mamluk/Anatolian).
        pcx = cx if (small or lk != 0 or self.seed % 3 != 2) else (L + W // 3 + 12)
        self.door_x = pcx
        pw = 38 if small else 52
        p_rise = (14 if not small else 9) if lk == 2 else (6 if lk == 1 else 2)
        ptop = eave - p_rise
        ph = base - ptop

        if lk == 0:
            # Ottoman ablaq (alternating white & ochre/rose coursed dressed stone) portal!
            fm.ashlar(c, pcx - pw // 2, ptop, pw, ph - 2, white, 5, 12)
            for yy in range(ptop + 4, base - 4, 8):
                c.rect(pcx - pw // 2 + 1, yy, pw - 2, 3, ablaq[2])
                c.rect(pcx - pw // 2 + 1, yy, pw - 2, 1, ablaq[1])
            c.rect(pcx - pw // 2 - 2, ptop - 2, pw + 4, 3, lime[0])
            c.rect(pcx - pw // 2 - 1, ptop + 1, pw + 2, 1, lime[5])
        elif lk == 1:
            # Mamluk dressed-limestone pishtaq framing a flowing turquoise/cobalt arabesque frieze!
            fm.ashlar(c, pcx - pw // 2, ptop, pw, ph - 2, lime, 6, 12)
            c.rect(pcx - pw // 2 - 2, ptop - 3, pw + 4, 3, lime[0])
            _arabesque_band(c, pcx - pw // 2 + 3, ptop + 3, pw - 6, 12, turq, cobalt, white, GOLD, lime)
        else:
            # Anatolian coursed-brick pishtaq with flowing turquoise arabesque band & tile arch!
            fm.brick(c, pcx - pw // 2, ptop, pw, ph - 2, brick, self.seed + 5)
            c.rect(pcx - pw // 2 - 2, ptop - 3, pw + 4, 3, sand[0])
            c.rect(pcx - pw // 2 - 2, ptop, pw + 4, 1, brick[6])
            _arabesque_band(c, pcx - pw // 2 + 3, ptop + 4, pw - 6, 11, turq, cobalt, white, GOLD, sand)

        # Deeply recessed shaded iwan alcove + pointed turquoise/ablaq arch frame + studded doors!
        dw = 24 if not small else 20
        dh = 38 if not small else 33
        spring = base - dh + dw // 2
        # Pointed turquoise tile / ablaq arch border framing the recessed alcove.
        for yy in range(base - dh - 3, base - 2):
            for xx in range(pcx - dw // 2 - 3, pcx + dw // 2 + 3):
                outer = yy >= spring or rounded(xx, yy, pcx - dw // 2 - 3, spring + 1, dw + 6)
                inner = yy >= spring and abs(xx - pcx) < dw // 2 or (yy < spring and rounded(xx, yy, pcx - dw // 2, spring, dw))
                if outer and not inner:
                    if lk == 0:
                        if yy < spring:
                            ang = math.atan2(spring - yy, xx - pcx)
                            c.p(xx, yy, ablaq[2] if int((ang / math.pi) * 7) % 2 else white[0])
                        else:
                            c.p(xx, yy, lime[1 if xx < pcx else 4])
                    else:
                        c.p(xx, yy, turq[1 if xx < pcx else 3])
        # Recessed iwan alcove (deep cool shadow + carved stone lintel above the door).
        for yy in range(base - dh, base - 2):
            for xx in range(pcx - dw // 2, pcx + dw // 2):
                if yy >= spring or rounded(xx, yy, pcx - dw // 2, spring, dw):
                    c.p(xx, yy, DARK if yy < spring + 5 else mix(trim_r[5], DARK, 0.55))
        # Carved limestone lintel + double studded cedar doors with iron ring-knockers!
        c.rect(pcx - dw // 2 + 1, spring + 2, dw - 2, 3, trim_r[1])
        c.rect(pcx - 9, spring + 5, 18, base - spring - 7, OAK[4])
        c.rect(pcx - 8, spring + 6, 16, base - spring - 9, OAK[3])
        c.rect(pcx, spring + 5, 1, base - spring - 7, OAK[6])
        for sy in (spring + 10, base - 9):
            for sx in (pcx - 6, pcx - 3, pcx + 3, pcx + 6):
                c.p(sx, sy, GOLD[1])
        # Iron ring knockers.
        c.rect(pcx - 4, spring + 15, 2, 2, trim_r[0]); c.rect(pcx + 3, spring + 15, 2, 2, trim_r[0])
        # Hanging brass lantern glowing in the archway crown.
        c.rect(pcx, base - dh + 2, 1, 4, GOLD[2])
        c.rect(pcx - 2, base - dh + 6, 5, 5, GOLD[1])
        c.rect(pcx - 1, base - dh + 7, 3, 3, amber[0])

        # 5. FLANKING WINDOWS & STREET DETAILS (louvered shutters / mashrabiya / cesme fountain)
        if not small:
            if pcx != cx:
                # Asymmetric Ottoman street front: paired louvered windows on the wider right side!
                side_xs = (R - 54, R - 26)
            else:
                side_xs = (L + 24, R - 24) if not large else (L + 24, L + 54, R - 54, R - 24)
            for idx, sx in enumerate(side_xs):
                wy = eave + 16
                if lk == 1 and idx in (0, len(side_xs) - 1):
                    # Carved cedar mashrabiya bay window with diamond lattice & cast shadow!
                    c.rect(sx - 8, wy - 1, 16, 20, OAK[5])
                    c.rect(sx - 7, wy, 14, 18, OAK[3])
                    for gy in range(wy + 1, wy + 17):
                        for gx in range(sx - 6, sx + 6):
                            if (gx + gy) % 4 == 0 or (gx - gy) % 4 == 0:
                                c.p(gx, gy, OAK[6])
                    c.rect(sx - 9, wy - 3, 18, 2, OAK[1])
                    c.rect(sx - 9, wy + 19, 18, 2, OAK[4])
                    cast_down(c, sx - 8, sx + 8, wy + 21, 3, 0.30)
                else:
                    _louver_window(c, sx, wy, 14, 13, trim_r, OAK)
            if lk == 0 and pcx == cx:
                # Carved Ottoman marble street fountain (cesme) beside the portal.
                side = 1 if (self.seed % 2 == 0) else -1
                fx = pcx + side * (pw // 2 + 12)
                c.rect(fx - 6, base - 18, 12, 14, lime[2]); c.rect(fx - 6, base - 18, 12, 2, lime[0])
                c.rect(fx - 4, base - 15, 8, 6, turq[3]); c.p(fx, base - 11, GOLD[0])
                c.rect(fx - 7, base - 8, 14, 4, lime[1]); c.rect(fx - 5, base - 7, 10, 2, turq[1])

        c.rect(pcx - 18, base - 2, 36, 3, trim_r[1]); c.rect(pcx - 20, base + 1, 40, 2, trim_r[3])
        outline(c, deep=True)
        consolidate(c)
        return c.im


class SweatLodgeHall:
    """Three completely distinct sweat-bath traditions built to the front_huts.shell
    & front_persian craft bar, with live fire & smoke animations:
      0 — Plains/Woodlands 3D-curved bent-willow & layered hide dome + grounded stone firepit
      1 — Mesoamerican coursed-stone talud-tablero temazcal + roof vault + side firebox
      2 — Living-turf earth sweat house + pitched cedar-plank porch + summit smoke hole"""

    def __init__(self, W=96, size='medium', look=0, seed=0):
        self.W, self.size, self.look, self.seed = W, size, look % 3, seed
        self.x0 = 16
        self.door_x = self.x0 + W // 2
        self.door_size = (16, 22)
        self.base = 0
        self.smoke = []
        self.overlays = []
        self.c = None

    def build(self):
        W, x0, lk = self.W, self.x0, self.look
        small = self.size == 'small'
        large = self.size == 'large'
        H = (90 if small else (118 if large else 104))
        c = C(W + x0 * 2, H)
        self.c = c
        base = H - 8
        self.base = base
        L, R = x0, x0 + W
        cx = L + W // 2

        hide = ramp(54, 0.085, lift=-0.02)
        white = RAMPS['whitewash']
        stone = RAMPS['limestone']
        travertine = RAMPS['sandstone']
        terracotta = ramp(18, 0.155, lift=-0.10)
        jade = ramp(164, 0.125, lift=-0.08)
        turf = ramp(122, 0.115, lift=-0.11)
        earth = ramp(40, 0.078, lift=-0.18)
        cedar = ramp(34, 0.09, lift=-0.15)
        ember = ramp(30, 0.18, lift=0.05)
        glow = ramp(52, 0.16, lift=0.14)
        red = ramp(16, 0.15, lift=-0.08)
        blue = ramp(230, 0.13, lift=-0.08)

        if lk == 0:
            # --- 0. PLAINS / WOODLANDS 3D-CURVED BENT-WILLOW & HIDE SWEAT LODGE ---
            # True 3D hemisphere coordinate mapping (u, z) matching front_huts.shell!
            dcx = cx - (9 if not small else 6)
            R0 = min(W // 2 - 4, 44 if large else (36 if not small else 26))
            dom_h = round(R0 * 0.96)
            ry_bot = round(R0 * 0.24)
            foot_y = base - ry_bot - 1
            self.door_x = dcx

            for z in range(0, dom_h + 1):
                t = z / max(1, dom_h)
                rad = R0 * math.sqrt(max(0.0, 1.0 - t * t))
                if rad < 1.2:
                    continue
                row = int(t * 4.2)
                lap = (t * 4.2) % 1.0
                for dx in range(-int(rad) - 1, int(rad) + 2):
                    u = dx / max(1.0, rad)
                    if abs(u) > 1.0:
                        continue
                    # Curve horizontal hide courses downward in front for true 3D top-down projection!
                    yy = foot_y - z + round(ry_bot * (1.0 - t * 0.85) * math.sqrt(max(0.0, 1.0 - u * u)))
                    xx = dcx + dx
                    if yy > base:
                        continue
                    # Smooth directional lighting from upper left (normal on sphere).
                    ny = math.sqrt(max(0.0, 1.0 - u * u))
                    lum = -0.55 * u + 0.55 * t + 0.35 * ny
                    q = max(0, min(5, int((1.0 - lum) * 3.8 + 1.2)))
                    # Overlapping hide course lip + 3D-curved meridian willow-sapling ribs!
                    if lap > 0.86:
                        q = min(6, q + 2)
                    elif lap < 0.12:
                        q = max(0, q - 1)
                    if abs(((u + 1.0) * 3.0 + row * 0.12) % 1.0) < 0.065 and t < 0.90:
                        q = min(6, q + 1)
                    # Subtle woven rawhide lashing belt around the waist.
                    if abs(t - 0.34) < 0.032:
                        q = 5 if (dx % 3 == 0) else 1
                    c.p(xx, yy, hide[q])

            # Soft recessed crown vent with crossed willow tips + live vent steam!
            sy = foot_y - dom_h
            c.rect(dcx - 3, sy, 6, 2, DARK)
            c.p(dcx - 4, sy - 1, OAK[3]); c.p(dcx + 3, sy - 1, OAK[4])
            self.smoke.append([dcx, sy - 2, 'vent'])

            # Curved hide entrance flap rolled back to reveal glowing red-hot stones inside!
            dw, dh = (15 if small else 19), (17 if small else 21)
            for yy in range(base - dh, base - 1):
                for xx in range(dcx - dw // 2, dcx + dw // 2):
                    if yy >= base - dh + dw // 2 or rounded(xx, yy, dcx - dw // 2, base - dh + dw // 2, dw):
                        c.p(xx, yy, DARK)
            c.rect(dcx - 5, base - 5, 10, 3, ember[2])
            c.rect(dcx - 3, base - 6, 6, 2, glow[0])
            # Organic draped hide flap framing the arch.
            for yy in range(base - dh + 2, base - 2):
                c.rect(dcx - dw // 2 - 2, yy, 2, 1, hide[1])
                c.rect(dcx + dw // 2, yy, 2, 1, hide[4])

            # Grounded stone-ringed outdoor firepit with crossed logs & live animated flame/smoke!
            fx = dcx + R0 + 7
            if fx + 10 < W + x0:
                # Ring of river stones sitting firmly on the ground.
                for dx, dy in ((-7, 0), (-4, 2), (0, 3), (4, 2), (7, 0), (-5, -2), (5, -2), (0, -3)):
                    c.rect(fx + dx - 1, base - 4 + dy, 3, 2, stone[3 if dx < 0 else 5])
                # Crossed split logs resting inside the stone ring + glowing ember bed.
                c.rect(fx - 5, base - 4, 10, 3, ember[3])
                c.rect(fx - 4, base - 5, 8, 2, OAK[4])
                c.rect(fx - 3, base - 6, 6, 3, ember[1])
                c.rect(fx - 1, base - 7, 3, 2, glow[0])
                self.overlays.append(['flame-small', fx - 3, base - 14])
                self.smoke.append([fx, base - 10, 'fire'])
                # Grounded neat firewood stack resting on the ground behind-right of the lodge!
                wx = dcx - R0 - 6
                if wx >= 4:
                    c.rect(wx - 4, base - 5, 9, 4, OAK[4])
                    c.rect(wx - 3, base - 7, 7, 3, OAK[3])
                    c.rect(wx - 2, base - 8, 5, 2, OAK[2])
                    for lx in (wx - 3, wx, wx + 3):
                        c.p(lx, base - 3, OAK[1]); c.p(lx, base - 6, OAK[1])

        elif lk == 1:
            # --- 1. MESOAMERICAN COURSED-STONE TALUD-TABLERO TEMAZCAL + ROOF VAULT ---
            bw = min(W - 14, 86 if large else (70 if not small else 52))
            bl, br = cx - bw // 2 - 4, cx + bw // 2 - 4
            self.door_x = (bl + br) // 2
            mcx = self.door_x
            wall_h = 28 if small else (36 if large else 32)
            deck_h = 20 if small else (28 if large else 24)
            eave = base - wall_h
            d_top = eave - deck_h

            # 1. Sunlit plastered roof terrace with back & left parapet shadows!
            c.rect(bl + 2, d_top, bw - 4, deck_h + 2, travertine[1])
            c.rect(bl + 4, d_top + 2, bw - 8, 5, travertine[3])
            c.rect(bl + 4, d_top + 2, 5, deck_h - 2, travertine[3])
            c.rect(bl + 1, d_top - 2, bw - 2, 3, white[0])
            c.rect(bl + 1, d_top, 3, deck_h + 2, white[1])
            c.rect(br - 4, d_top, 3, deck_h + 2, travertine[4])

            # 2. Ribbed whitewashed masonry steam-vault seated ON the roof terrace with shadow!
            vr = min(bw // 2 - 8, 26 if large else (21 if not small else 15))
            v_by = d_top + deck_h // 2 + 5
            v_ry = round(vr * 0.35)
            for yy in range(v_by - v_ry, v_by + v_ry + 4):
                for xx in range(mcx - vr - 1, mcx + vr + 6):
                    u = (xx - (mcx + 3)) / (vr + 2)
                    v = (yy - (v_by + 2)) / (v_ry + 2)
                    if u * u + v * v <= 1 and d_top + 2 <= yy <= eave:
                        c.p(xx, yy, mix(c.g(xx, yy), DARK, 0.32))
            dome(c, mcx, v_by, vr, white, kind='hemi', courses=3, ribs=8, lantern=None)
            v_top = v_by - round(vr * 0.92)
            c.rect(mcx - 4, v_top - 1, 8, 3, terracotta[2])
            c.rect(mcx - 2, v_top, 4, 1, DARK)
            self.smoke.append([mcx, v_top - 2, 'vent'])

            # 3. Coursed travertine/stone talud base + recessed tablero frieze in terracotta & jade!
            tal_h = wall_h // 2
            tab_y = eave
            fm.ashlar(c, bl - 1, tab_y, bw + 2, tal_h, white, 5, 10)
            c.rect(bl - 2, tab_y - 1, bw + 4, 2, white[0])
            c.rect(bl + 2, tab_y + 3, bw - 4, tal_h - 5, terracotta[3])
            c.rect(bl + 2, tab_y + 3, bw - 4, 1, terracotta[5])  # recessed tablero top shadow
            for fx in range(bl + 5, br - 7, 8):
                c.rect(fx, tab_y + 5, 5, 2, white[0])
                c.rect(fx + 2, tab_y + 7, 3, 2, jade[2])
                c.p(fx + 3, tab_y + 7, jade[0])
            # Coursed battered stone talud widening toward the ground.
            fm.ashlar(c, bl - 2, tab_y + tal_h, bw + 4, base - (tab_y + tal_h), travertine, 5, 11)
            c.rect(bl - 4, base - 3, bw + 8, 3, stone[3]); c.rect(bl - 4, base - 3, bw + 8, 1, stone[1])

            # 4. Battered stone crawl-in doorway + carved lintel + rolled petate reed mat!
            dw, dh = (12 if small else 14), (15 if small else 18)
            c.rect(mcx - dw // 2 - 4, base - dh - 4, dw + 8, 4, stone[1])
            c.rect(mcx - dw // 2 - 4, base - dh - 4, dw + 8, 1, stone[0])
            c.rect(mcx - dw // 2 - 2, base - dh, dw + 4, dh - 1, stone[3])
            c.rect(mcx - dw // 2, base - dh, dw, dh - 1, DARK)
            c.rect(mcx - dw // 2 - 1, base - dh - 2, dw + 2, 3, hide[1])
            c.rect(mcx - dw // 2, base - dh - 1, dw, 1, hide[4])
            c.rect(mcx - 3, base - 4, 6, 2, ember[2])

            # 5. Coursed-stone vaulted firebox (tlecuil) on the right + 3D lathe stone chimney!
            fbx = br + 1
            fbw, fbh = 16, 21
            fm.ashlar(c, fbx, base - fbh, fbw, fbh - 1, travertine, 5, 8)
            c.rect(fbx - 1, base - fbh - 1, fbw + 2, 3, white[0])
            c.rect(fbx + 3, base - 10, 8, 8, DARK)
            c.rect(fbx + 4, base - 5, 6, 3, ember[1]); c.rect(fbx + 5, base - 5, 4, 2, glow[0])
            self.overlays.append(['flame-small', fbx + 4, base - 12])
            so.lathe(c, fbx + fbw // 2, base - fbh + 1, [(0, 4.5), (14, 3.5), (16, 4.2)], stone)
            c.rect(fbx + fbw // 2 - 2, base - fbh - 16, 4, 1, DARK)
            self.smoke.append([fbx + fbw // 2, base - fbh - 17, 'chimney'])

        else:
            # --- 2. LIVING-TURF EARTH SWEAT HOUSE (3D CURVED SOD + PITCHED CEDAR PORCH) ---
            R0 = min(W // 2, 50 if large else (42 if not small else 30))
            dom_h = round(R0 * 0.78)
            ry_bot = round(R0 * 0.22)
            foot_y = base - ry_bot - 1

            for z in range(0, dom_h + 1):
                t = z / max(1, dom_h)
                rad = R0 * math.sqrt(max(0.0, 1.0 - t * t))
                if rad < 1.5:
                    continue
                for dx in range(-int(rad) - 1, int(rad) + 2):
                    u = dx / max(1.0, rad)
                    if abs(u) > 1.0:
                        continue
                    yy = foot_y - z + round(ry_bot * (1.0 - t * 0.85) * math.sqrt(max(0.0, 1.0 - u * u)))
                    xx = cx + dx
                    if yy > base:
                        continue
                    ny = math.sqrt(max(0.0, 1.0 - u * u))
                    lum = -0.52 * u + 0.55 * t + 0.35 * ny
                    q = max(0, min(5, int((1.0 - lum) * 3.8 + 1.2)))
                    if t < 0.22:
                        # Layered earthen sod base courses!
                        if (t * 14) % 1.0 < 0.18:
                            q = min(6, q + 2)
                        c.p(xx, yy, earth[q])
                    else:
                        if h2(xx // 2, yy // 2, 17 + self.seed) < 0.22:
                            q = max(0, q - 1)
                        elif h2(xx // 3, yy // 3, 29 + self.seed) < 0.16:
                            q = min(6, q + 1)
                        c.p(xx, yy, turf[q])
            # Hand-drawn grass tufts & tiny meadow wildflowers on the sunlit slope.
            for gx in range(cx - R0 + 8, cx + R0 - 7, 7):
                nx = (gx - cx) / max(1, R0)
                gy = foot_y - round(dom_h * math.sqrt(max(0.0, 1.0 - nx * nx)))
                c.p(gx, gy - 1, turf[1]); c.p(gx + 1, gy - 2, turf[0])
                if (gx + self.seed) % 5 == 0:
                    c.p(gx + 1, gy + 5, GOLD[0] if (gx % 2 == 0) else white[0])

            # Recessed timber-cribbed summit smoke-hole + live vent smoke!
            sy = foot_y - dom_h
            c.rect(cx - 7, sy - 1, 14, 5, cedar[3]); c.rect(cx - 7, sy - 1, 14, 1, cedar[1])
            c.rect(cx - 4, sy, 8, 3, DARK)
            self.smoke.append([cx, sy - 2, 'vent'])

            # Pitched gable split-cedar entrance porch (front_huts.turf style)!
            tw = 26 if small else 32
            th = 22 if small else 25
            gh = 10
            c.rect(cx - tw // 2, base - th, tw, th - 1, cedar[4])
            for px in range(cx - tw // 2 + 2, cx + tw // 2 - 1, 4):
                c.rect(px, base - th, 1, th - 1, cedar[6])
                c.rect(px + 1, base - th, 1, th - 1, cedar[3])
            # Turf-and-bark pitched gable roof over the porch!
            for dy in range(gh + 1):
                hw = round((gh - dy) * (tw / 2 + 3) / gh)
                c.rect(cx - hw, base - th - dy, hw * 2, 1, cedar[2] if dy < 3 else turf[2])
                c.rect(cx - hw, base - th - dy, 3, 1, turf[1])
                c.rect(cx + hw - 3, base - th - dy, 3, 1, turf[4])
            c.rect(cx - 8, base - 17, 16, 16, DARK)
            c.rect(cx - 5, base - 4, 10, 2, ember[2])
            # Grounded stone-ringed side hearth with live animated flame!
            hx = cx + tw // 2 + 8
            if hx + 5 < W + x0:
                c.rect(hx - 4, base - 4, 8, 3, stone[4])
                c.rect(hx - 2, base - 5, 4, 2, ember[1])
                self.overlays.append(['flame-small', hx - 3, base - 13])

        outline(c, deep=True)
        consolidate(c)
        return c.im


class CarvedGableHall:
    """Three iconic carved-gable civic meeting houses:
      0 — Maori wharenui (flax thatch, carved red-ochre maihi, tekoteko, tukutuku porch)
      1 — Melanesian Sepik haus tambaran (soaring saddle gable, spirit mural, stilt platform)
      2 — Pacific Northwest cedar plankhouse (shingle roof, Formline carved totem portal)"""

    def __init__(self, W=144, size='medium', look=0, seed=0):
        self.W, self.size, self.look, self.seed = W, size, look % 3, seed
        self.x0 = 16
        self.door_x = self.x0 + W // 2
        self.door_size = (20, 36)
        self.base = 0
        self.smoke = []
        self.overlays = []
        self.c = None

    def build(self):
        from art import front_europe as eu
        W, x0, lk = self.W, self.x0, self.look
        small = self.size == 'small'
        large = self.size == 'large'
        wall_h = 44 if small else (54 if large else 48)
        if lk == 1:
            stilt_h = 16 if small else 20
            gable_h = 56 if small else (78 if large else 68)
            deck_d = 24 if small else 32
            H = stilt_h + wall_h + gable_h + deck_d + 16
        elif lk == 0:
            stilt_h = 0
            gable_h = 42 if small else (58 if large else 50)
            deck_d = 28 if small else (40 if large else 34)
            H = wall_h + gable_h + deck_d + 22
        else:
            stilt_h = 0
            gable_h = 26 if small else (36 if large else 30)
            deck_d = 32 if small else (46 if large else 38)
            H = wall_h + gable_h + deck_d + 16

        c = C(W + x0 * 2, H)
        self.c = c
        base = H - 6
        self.base = base
        L, R = x0, x0 + W
        cx = L + W // 2
        eave = base - stilt_h - wall_h

        ochre_red = ramp(16, 0.145, lift=-0.12)
        cedar = ramp(32, 0.095, lift=-0.16)
        silver_cedar = ramp(56, 0.032, lift=-0.12)
        thatch = ramp(66, 0.085, lift=-0.04)
        palm = ramp(72, 0.075, lift=-0.08)
        cream = RAMPS['whitewash']
        turq = ramp(186, 0.13, lift=-0.04)
        vermilion = ramp(18, 0.165, lift=-0.08)
        sago = ramp(64, 0.065, lift=-0.02)

        if lk == 0:
            # --- 0. MAORI WHARENUI (MEETING HOUSE) ---
            ov = 8
            def verge(xx):
                return eave - gable_h + round(abs(xx - cx) * gable_h / (W / 2 + ov))
            for back in range(deck_d, 0, -1):
                for xx in range(L - ov, R + ov + 1):
                    vy = verge(xx) - back
                    left_side = xx < cx
                    wave = round(1.5 * math.sin(xx * 0.25 + (back // 5) * 1.4))
                    row = (back + wave) // 5
                    ry = (back + wave) % 5
                    q = (4 if ry == 4 else (1 if left_side else 3)) + (1 if h2(xx // 2, row, 11 + self.seed) < 0.28 else 0)
                    if back == deck_d or xx in (L - ov, R + ov):
                        q = 5
                    c.p(xx, vy, thatch[min(6, q)])
            c.rect(cx - 2, verge(cx) - deck_d, 4, deck_d + 2, ochre_red[2])
            c.rect(cx - 1, verge(cx) - deck_d, 1, deck_d + 2, ochre_red[0])

            c.rect(L + 2, eave, W - 4, wall_h, DARK)
            c.rect(L + 8, eave + 6, W - 16, wall_h - 6, cedar[5])
            for px0, pw_p in ((L + 12, cx - L - 26), (cx + 14, R - cx - 26)):
                if pw_p < 8:
                    continue
                c.rect(px0, eave + 14, pw_p, wall_h - 18, cream[2])
                for yy in range(eave + 15, base - 5):
                    for xx in range(px0 + 1, px0 + pw_p - 1):
                        d = (abs((xx - px0) % 8 - 4) + abs((yy - eave) % 8 - 4))
                        if d == 2:
                            c.p(xx, yy, ochre_red[2])
                        elif d == 4:
                            c.p(xx, yy, DARK)
            dw, dh = 18, 28
            c.rect(cx - dw // 2, base - dh, dw, dh - 1, DARK)
            c.rect(cx - dw // 2 + 2, base - dh + 2, dw - 4, dh - 3, cedar[4])
            c.rect(cx - dw // 2 - 2, base - dh - 5, dw + 4, 5, ochre_red[2])
            c.rect(cx - dw // 2, base - dh - 4, dw, 2, ochre_red[0])
            c.p(cx - 3, base - dh - 3, turq[0]); c.p(cx + 3, base - dh - 3, turq[0])

            for px in (L + 2, L + 10, R - 16, R - 8):
                c.rect(px, eave + 2, 6, wall_h - 2, ochre_red[2])
                c.rect(px, eave + 2, 2, wall_h - 2, ochre_red[0])
                c.rect(px + 5, eave + 2, 1, wall_h - 2, ochre_red[5])
                c.p(px + 2, eave + 14, turq[0]); c.p(px + 4, eave + 14, turq[0])
                c.p(px + 2, eave + 28, turq[0]); c.p(px + 4, eave + 28, turq[0])

            for dy in range(gable_h):
                hw = max(1, round((gable_h - dy) * (W / 2) / gable_h))
                y = eave - dy
                c.rect(cx - hw, y, hw * 2, 1, cedar[4] if dy % 4 else cedar[5])
                if dy % 7 == 3 and hw > 8:
                    for xx in range(cx - hw + 5, cx + hw - 5, 6):
                        c.rect(xx, y, 3, 2, cream[1]); c.p(xx + 1, y, ochre_red[2])
            for xx in range(L - ov, R + ov + 1):
                vy = verge(xx)
                for thick in range(6):
                    col = ochre_red[0] if thick == 0 else (ochre_red[2] if thick < 4 else ochre_red[5])
                    if thick == 2 and (xx % 4 == 0):
                        col = cream[1]
                    c.p(xx, vy + thick, col)
            for ex in (L - ov - 2, R + ov - 2):
                for fi in range(3):
                    c.rect(ex + fi * 2, eave + 2 + fi, 1, 5, ochre_red[1])
            ay = eave - gable_h
            c.rect(cx - 4, ay - 12, 8, 13, ochre_red[2])
            c.rect(cx - 3, ay - 13, 6, 4, ochre_red[0])
            c.p(cx - 2, ay - 10, turq[0]); c.p(cx + 1, ay - 10, turq[0])
            c.rect(cx - 2, ay - 7, 4, 2, cream[0])
            c.rect(cx - 5, ay - 5, 10, 3, ochre_red[1])

        elif lk == 1:
            # --- 1. MELANESIAN / SEPIK HAUS TAMBARAN (SOARING SADDLE GABLE ON STILTS) ---
            plat_y = base - stilt_h
            ov = 6
            def saddle_y(xx):
                t = abs(xx - cx) / max(1, W / 2 + ov)
                return eave - round(gable_h * ((1 - t) ** 1.45))
            for back in range(deck_d, 0, -1):
                for xx in range(L - ov, R + ov + 1):
                    vy = saddle_y(xx) - back
                    sag = round(math.sin(back / max(1, deck_d) * math.pi) * 6)
                    left_side = xx < cx
                    row = (back + (xx // 4)) // 4
                    q = (4 if back % 4 == 3 else (2 if left_side else 4)) + (1 if h2(xx // 2, row, 23 + self.seed) < 0.25 else 0)
                    c.p(xx, vy + sag, palm[min(6, q)])

            for sx in range(L + 8, R - 6, max(16, (W - 16) // 5)):
                c.rect(sx, plat_y, 5, stilt_h, OAK[4])
                c.rect(sx, plat_y, 2, stilt_h, OAK[2])
                c.rect(sx + 4, plat_y, 1, stilt_h, OAK[6])
            c.rect(L + 2, plat_y - 3, W - 4, 4, OAK[2]); c.rect(L + 2, plat_y + 1, W - 4, 2, OAK[5])

            c.rect(L + 6, eave, W - 12, wall_h - 3, DARK)
            for sx0, sw_s in ((L + 8, (W - 44) // 2), (cx + 14, (W - 44) // 2)):
                if sw_s > 6:
                    c.rect(sx0, eave + 4, sw_s, wall_h - 8, sago[3])
                    for yy in range(eave + 5, plat_y - 4, 3):
                        c.rect(sx0 + 1, yy, sw_s - 2, 1, sago[4 if (yy % 6 == 0) else 2])
            c.rect(cx - 5, plat_y - 6, 10, stilt_h + 6, OAK[3])
            c.rect(cx - 5, plat_y - 6, 2, stilt_h + 6, OAK[1])
            for ly in range(plat_y - 2, base - 2, 4):
                c.rect(cx - 3, ly, 6, 2, OAK[6])

            for xx in range(L - ov + 4, R + ov - 3):
                vy = saddle_y(xx)
                for yy in range(vy + 4, eave + 2):
                    band = (eave - yy) // 10
                    if band == 0:
                        col = ochre_red[2] if ((xx // 4 + yy // 3) % 2) else cream[1]
                    elif band == 1:
                        col = GOLD[2] if (xx % 6 < 3) else DARK
                    else:
                        col = sago[2] if (yy % 4) else sago[3]
                    c.p(xx, yy, col)
            fy = eave - gable_h // 2 + 4
            fr = min(14, W // 7)
            for yy in range(fy - fr, fy + fr + 1):
                for xx in range(cx - fr, cx + fr + 1):
                    d = math.hypot((xx - cx) * 1.15, (yy - fy) * 0.85)
                    if d <= fr:
                        c.p(xx, yy, cream[1] if d > fr - 2 else (ochre_red[2] if d > fr - 5 else GOLD[1]))
            for ex in (cx - fr // 2 + 1, cx + fr // 2 - 1):
                c.rect(ex - 2, fy - 3, 5, 4, DARK)
                c.rect(ex - 1, fy - 2, 3, 2, cream[0])
                c.p(ex, fy - 1, ochre_red[2])
            c.rect(cx - 1, fy - 2, 2, 7, DARK)
            c.rect(cx - 4, fy + 6, 8, 2, DARK)
            for xx in range(L - ov, R + ov + 1):
                vy = saddle_y(xx)
                for thick in range(5):
                    c.p(xx, vy + thick, palm[1 if thick < 2 else (3 if thick < 4 else 5)])
            c.rect(cx - 2, saddle_y(cx) - 10, 4, 12, ochre_red[2])
            c.rect(cx - 1, saddle_y(cx) - 12, 2, 4, cream[0])

        else:
            # --- 2. PACIFIC NORTHWEST CEDAR PLANKHOUSE (CARVED POTLATCH HALL) ---
            ov = 7
            def verge(xx):
                return eave - gable_h + round(abs(xx - cx) * gable_h / (W / 2 + ov))
            eu.tiles_back(c, L - ov, R + ov + 1, verge, deck_d, silver_cedar, cx, 'slate')
            # Raised wooden smoke-vent louver sitting squarely on the ridge + live hearth smoke!
            sv_w, sv_h = 22 if small else 30, 8
            sv_y = verge(cx) - deck_d // 2 - 4
            c.rect(cx - sv_w // 2, sv_y, sv_w, sv_h, cedar[4])
            c.rect(cx - sv_w // 2 - 2, sv_y - 2, sv_w + 4, 3, silver_cedar[2])
            c.rect(cx - sv_w // 2 - 2, sv_y - 2, sv_w + 4, 1, silver_cedar[0])
            c.rect(cx - sv_w // 2 + 3, sv_y + 3, sv_w - 6, 3, DARK)
            self.smoke.append([cx, sv_y - 3, 'vent'])

            c.rect(L, eave, W, wall_h, cedar[3])
            for px in range(L, R, 6):
                c.rect(px, eave, 1, wall_h, cedar[5])
                c.rect(px + 1, eave, 1, wall_h, cedar[2])
                if h2(px, 3, 7 + self.seed) < 0.35:
                    c.rect(px + 2, eave + 4, 3, wall_h - 8, cedar[4])
            c.rect(L - 4, eave - 3, W + 8, 5, cedar[2]); c.rect(L - 4, eave - 3, W + 8, 1, cedar[0])
            c.rect(L - 4, eave + 2, W + 8, 2, cedar[6])
            for xx in (L - 3, L + W // 4, R - W // 4, R + 1):
                py = verge(xx) + 4
                c.rect(xx - 2, py, 5, 5, cedar[1]); c.rect(xx - 1, py + 1, 3, 3, cedar[4])

            for dy in range(gable_h):
                hw = max(1, round((gable_h - dy) * (W / 2) / gable_h))
                c.rect(cx - hw, eave - dy, hw * 2, 1, cedar[2] if dy > 2 else cedar[4])
            my = eave - gable_h // 2 + 2
            for side in (-1, 1):
                ox = cx + side * (16 if small else 24)
                c.rect(ox - 7, my - 4, 14, 8, DARK)
                c.rect(ox - 5, my - 3, 10, 6, vermilion[2])
                c.rect(ox - 3, my - 2, 6, 4, turq[2])
                c.rect(ox - 1, my - 1, 2, 2, DARK)
            for xx in range(L - ov, R + ov + 1):
                vy = verge(xx)
                c.rect(xx, vy, 1, 4, cedar[1 if xx < cx else 4])

            pw = 28 if small else 34
            c.rect(cx - pw // 2, eave - 8, pw, wall_h + 7, cedar[2])
            c.rect(cx - pw // 2, eave - 8, 2, wall_h + 7, cedar[0])
            c.rect(cx + pw // 2 - 2, eave - 8, 2, wall_h + 7, cedar[5])
            fy = eave + 4
            c.rect(cx - 11, fy - 4, 22, 12, DARK)
            c.rect(cx - 9, fy - 3, 18, 10, turq[2])
            for ex in (cx - 5, cx + 5):
                c.rect(ex - 3, fy - 2, 6, 5, DARK)
                c.rect(ex - 2, fy - 1, 4, 3, cream[0])
                c.rect(ex - 1, fy, 2, 2, vermilion[2])
            c.rect(cx - 3, fy + 4, 6, 4, vermilion[2])
            dw, dh = 16, 26
            spring = base - dh + dw // 2
            for yy in range(base - dh, base - 1):
                for xx in range(cx - dw // 2, cx + dw // 2):
                    if yy >= spring or rounded(xx, yy, cx - dw // 2, spring, dw):
                        c.p(xx, yy, DARK)
            c.rect(cx - 12, base - 2, 24, 3, cedar[1])

        outline(c, deep=True)
        consolidate(c)
        return c.im


class OpenShelterHall:
    """Three open-sided shade & council pavilions showing deep interior shade
    and seating inside:
      0 — Sahelian toguna (ultra-thick layered millet-thatch slab, carved pillars)
      1 — Desert ramada brush arbour (forked posts, viga poles, feathery brush roof)
      2 — Polynesian fale fono (oval-hipped pandanus roof, stone paepae, rolled pola)"""

    def __init__(self, W=112, size='medium', look=0, seed=0):
        self.W, self.size, self.look, self.seed = W, size, look % 3, seed
        self.x0 = 14
        self.door_x = self.x0 + W // 2
        self.door_size = (24, 34)
        self.base = 0
        self.smoke = []
        self.overlays = []
        self.c = None

    def build(self):
        W, x0, lk = self.W, self.x0, self.look
        small = self.size == 'small'
        large = self.size == 'large'
        post_h = 30 if small else (38 if large else 34)
        if lk == 0:
            slab_h = 18 if small else 22
            top_d = 24 if small else (36 if large else 30)
            H = post_h + slab_h + top_d + 16
        elif lk == 1:
            slab_h = 9
            top_d = 26 if small else (38 if large else 32)
            H = post_h + slab_h + top_d + 16
        else:
            paepae_h = 10 if small else 14
            roof_h = 34 if small else (46 if large else 40)
            H = paepae_h + post_h + roof_h + 16

        c = C(W + x0 * 2, H)
        self.c = c
        base = H - 6
        self.base = base
        L, R = x0, x0 + W
        cx = L + W // 2

        millet = ramp(64, 0.105, lift=-0.02)
        brush = ramp(72, 0.065, lift=-0.12)
        pandanus = ramp(60, 0.095, lift=-0.04)
        teak = ramp(32, 0.095, lift=-0.16)
        mud = ramp(48, 0.085, lift=-0.08)
        basalt = ramp(225, 0.022, lift=-0.22)
        mat = ramp(68, 0.08, lift=0.06)
        clay = ramp(24, 0.13, lift=-0.10)

        if lk == 0:
            eave = base - post_h
            c.rect(L + 4, eave, W - 8, post_h - 1, DARK)
            c.rect(L + 4, base - 9, W - 8, 8, mud[5])
            c.rect(L + 6, base - 6, W - 12, 4, mud[4])
            for bx0, bw_b in ((L + 12, W // 3 - 8), (R - W // 3 - 4, W // 3 - 8)):
                c.rect(bx0, base - 13, bw_b, 4, OAK[3]); c.rect(bx0, base - 13, bw_b, 1, OAK[1])
                c.rect(bx0 + 2, base - 9, 2, 5, OAK[5]); c.rect(bx0 + bw_b - 4, base - 9, 2, 5, OAK[5])
            n_posts = 3 if small else (5 if large else 4)
            for i in range(n_posts):
                px = round(L + 10 + i * (W - 20) / max(1, n_posts - 1))
                c.rect(px - 2, eave, 5, post_h - 6, OAK[6])

            for i in range(n_posts):
                px = round(L + 8 + i * (W - 16) / max(1, n_posts - 1))
                c.rect(px - 3, eave - 1, 7, post_h, mud[3])
                c.rect(px - 3, eave - 1, 2, post_h, mud[1])
                c.rect(px + 3, eave - 1, 1, post_h, mud[5])
                c.rect(px - 5, eave - 3, 11, 3, OAK[3]); c.rect(px - 5, eave - 3, 11, 1, OAK[1])
                for ny in (eave + 8, eave + 15, eave + 22):
                    c.rect(px - 1, ny, 3, 2, mud[5])

            slab_top = eave - slab_h
            deck_top = slab_top - top_d
            _paint_thatch_span(c, deck_top, slab_top + 2, lambda yy, t: (L - 5, R + 5), millet, seed=self.seed + 11)
            for yy in range(slab_top, eave + 1):
                layer = (yy - slab_top) // 4
                ly = (yy - slab_top) % 4
                for xx in range(L - 6, R + 7):
                    wobble = round(math.sin(xx * 0.22 + layer * 1.7))
                    q = (5 if ly == 3 else (2 if yy < slab_top + slab_h // 2 else 3))
                    if h2(xx // 2, layer, 41 + self.seed) < 0.35:
                        q = min(6, q + 1)
                    if yy == eave and (xx + wobble) % 3 == 0:
                        q = 6
                    c.p(xx, yy, millet[min(6, q)])
            for xx in range(L - 5, R + 6, 3):
                if h2(xx, 9, 13 + self.seed) < 0.7:
                    c.p(xx, eave + 1, millet[4]); c.p(xx, eave + 2, millet[5])

        elif lk == 1:
            eave = base - post_h
            c.rect(L + 6, eave + 2, W - 12, post_h - 3, mix(DARK, mud[5], 0.28))
            c.rect(L + 6, base - 8, W - 12, 7, mud[3])
            for sx in range(L + 14, R - 14, 14):
                c.rect(sx, base - 6, 6, 3, mud[1])
            c.rect(L + 14, base - 12, W // 3, 4, OAK[2]); c.rect(L + 14, base - 12, W // 3, 1, OAK[0])
            c.rect(L + 16, base - 8, 3, 5, OAK[5]); c.rect(L + 14 + W // 3 - 5, base - 8, 3, 5, OAK[5])
            ox = R - 24
            c.rect(ox, eave + 2, 1, 7, mat[2])
            c.rect(ox - 3, eave + 9, 7, 7, clay[2]); c.rect(ox - 2, eave + 8, 5, 1, clay[0])
            c.rect(ox - 2, eave + 10, 2, 3, clay[0]); c.rect(ox + 2, eave + 10, 2, 5, clay[4])

            n_posts = 2 if small else (4 if large else 3)
            for i in range(n_posts):
                px = round(L + 8 + i * (W - 16) / max(1, n_posts - 1))
                c.rect(px - 2, eave + 2, 5, post_h - 2, OAK[4])
                c.rect(px - 2, eave + 2, 2, post_h - 2, OAK[2])
                c.rect(px - 4, eave - 2, 3, 4, OAK[3]); c.rect(px + 2, eave - 2, 3, 4, OAK[4])
            c.rect(L - 4, eave - 3, W + 8, 4, OAK[3]); c.rect(L - 4, eave - 3, W + 8, 1, OAK[1])
            for vx in range(L + 4, R - 2, 10):
                c.rect(vx - 1, eave - 1, 3, 3, OAK[1]); c.p(vx, eave, OAK[5])

            r_top = eave - slab_h - top_d
            for yy in range(r_top, eave - 2):
                for xx in range(L - 5, R + 6):
                    if (xx < L - 2 or xx > R + 2) and h2(xx, yy, 5 + self.seed) < 0.45:
                        continue
                    if yy < r_top + 3 and h2(xx, yy, 9 + self.seed) < 0.45:
                        continue
                    row = (yy - r_top) // 4
                    q = 2 if (yy < r_top + top_d * 0.6) else 3
                    if h2(xx // 2, yy // 2, 33 + self.seed) < 0.25:
                        q = max(0, q - 1)
                    elif h2(xx, row, 19 + self.seed) < 0.3:
                        q = min(6, q + 2)
                    c.p(xx, yy, brush[q])
            for py in range(r_top + 6, eave - 5, 9):
                c.rect(L - 2, py, W + 4, 2, OAK[3]); c.rect(L - 2, py, W + 4, 1, OAK[1])

        else:
            plat_y = base - paepae_h
            eave = plat_y - post_h
            for tier, (ins, th_t) in enumerate(((0, paepae_h // 2 + 1), (4, paepae_h // 2))):
                ty = base - (th_t if tier == 0 else paepae_h)
                c.rect(L - 2 + ins, ty, W + 4 - ins * 2, th_t, basalt[3])
                c.rect(L - 2 + ins, ty, W + 4 - ins * 2, 2, basalt[1])
                for sx in range(L + ins + 4, R - ins - 4, 10):
                    c.rect(sx, ty + 2, 1, th_t - 2, basalt[5])
            c.rect(cx - 16, base - 4, 32, 4, basalt[2]); c.rect(cx - 16, base - 4, 32, 1, basalt[0])
            c.rect(cx - 19, base - 1, 38, 3, basalt[3]); c.rect(cx - 19, base - 1, 38, 1, basalt[1])

            c.rect(L + 8, eave, W - 16, post_h, mix(DARK, teak[6], 0.35))
            c.rect(L + 10, plat_y - 6, W - 20, 6, mat[2])
            for mx in range(L + 14, R - 14, 10):
                c.rect(mx, plat_y - 5, 8, 4, mat[1]); c.rect(mx, plat_y - 3, 8, 1, mat[3])

            n_posts = 4 if small else (6 if large else 5)
            for i in range(n_posts):
                px = round(L + 10 + i * (W - 20) / max(1, n_posts - 1))
                c.rect(px - 2, eave, 5, post_h, teak[3])
                c.rect(px - 2, eave, 2, post_h, teak[1])
                c.rect(px + 2, eave, 1, post_h, teak[5])
                c.rect(px - 2, eave + 1, 5, 3, DARK)
                c.p(px - 1, eave + 2, GOLD[1]); c.p(px + 1, eave + 2, GOLD[1])
            for i in range(n_posts - 1):
                p1 = round(L + 10 + i * (W - 20) / max(1, n_posts - 1)) + 3
                p2 = round(L + 10 + (i + 1) * (W - 20) / max(1, n_posts - 1)) - 3
                if p2 > p1 + 4:
                    c.rect(p1, eave + 2, p2 - p1, 4, mat[2])
                    c.rect(p1, eave + 2, p2 - p1, 1, mat[0])
                    c.rect(p1, eave + 5, p2 - p1, 1, mat[4])

            rx = W // 2 + 8
            ry = roof_h
            for yy in range(eave - ry, eave + 3):
                t = (yy - (eave - ry)) / max(1, ry)
                flat_half = max(6, round(rx * 0.42))
                curve_half = rx - flat_half
                hw = flat_half + round(curve_half * math.sin(min(1.0, t) * math.pi / 2) ** 0.72)
                wave = round(1.3 * math.sin(yy * 0.35))
                row = (yy - (eave - ry)) // 5
                ry_m = (yy - (eave - ry)) % 5
                for xx in range(cx - hw, cx + hw + 1):
                    nx = (xx - cx) / max(1, hw)
                    q = (5 if ry_m == 4 else (1 if nx < -0.25 else (2 if nx < 0.35 else 4)))
                    if h2(xx // 2, row, 53 + self.seed) < 0.25:
                        q = min(6, q + 1)
                    if yy >= eave:
                        q = 5 if ((xx + wave) % 2 == 0) else 6
                    c.p(xx, yy, pandanus[min(6, q)])
            flat_half = max(6, round(rx * 0.42))
            c.rect(cx - flat_half, eave - ry - 1, flat_half * 2, 4, pandanus[1])
            for rx_i in range(cx - flat_half + 2, cx + flat_half - 2, 5):
                c.rect(rx_i, eave - ry - 1, 2, 4, teak[4])

        outline(c, deep=True)
        consolidate(c)
        return c.im
