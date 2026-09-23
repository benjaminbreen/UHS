"""Chinese and Korean timber-frame houses, halls and courtyard compounds in
the oblique view.

The world is the one oblique_meso paints: X right, Y up, Z back, projected
x + Z*zx, ground - Y - Z*zy, each face rasterised once with the world point
under every pixel handed to its shader. A house uses zx = zy = 1 and the
settled 12px return. A compound shears its whole plot depth into the same
12px sideways and a shallow rise, so the court, the wings and the hall at the
back share one projection instead of each inventing its own.

Structure comes from the plan (hut, house, hall, compound, terrace hall);
everything cultural (wall fabric, post lacquer, lattice, tile, roof form and
curve, ridge ends, beam paint, extras) comes from the profile's `sino` block
in regional-houses.json, picked by seed and restrained by wealth tier.
Illustrative reconstructions, not surveyed plans.
"""
import random
from PIL import Image, ImageDraw
from art.buildings import DOOR_W, DOOR_H
from art.oblique_meso import INTERIOR, _rgb, dither, h2
from art.oblique_style import OVER, VERGE, roof_rise, side_depth

# Six-pixel lattice tiles, X = muntin. Paper shows through the rest.
LATTICE = {
    'bars': ["X.X.X.", "X.X.X.", "X.X.X.", "X.X.X.", "X.X.X.", "X.X.X."],
    'grid': ["XXXXXX", "X..X..", "X..X..", "XXXXXX", "X..X..", "X..X.."],
    'lozenge': ["..X...", ".X.X..", "X...X.", ".X.X..", "..X...", "......"],
    'fret': ["XXXX.X", "...X.X", "XX.X.X", "X..X..", "X.XXXX", "X....."],
    'ice': ["X...X.", ".X.X..", "..X..X", ".X.X..", "X...X.", "..X..."],
}
# Owl-tail ridge end, facing right; mirrored for the left end.
CHIWEN = ["..XX..",
          ".XXX..",
          "XX.XX.",
          "X..XX.",
          "...XXX",
          "..XXXX",
          "XXXXXX"]
SCROLL = ["..XXX",
          ".X..X",
          ".X...",
          "XX...",
          "XXXXX"]


def ramp_at(r, i):
    return r[max(0, min(len(r) - 1, int(i)))]


class ObliqueSinitic:
    def __init__(self, recipe, material):
        r = self.r = recipe
        rng = self.rng = random.Random(recipe['seed'] + 733)
        s = self.sino = recipe['sino']
        self.pal = {k: [_rgb(c) for c in v] for k, v in s['palette'].items()}
        self.plan = recipe['sinoPlan']
        self.tier = recipe.get('wealthTier', 1)
        pick = lambda key, default=None: rng.choice(s.get(key) or [default])
        tiered = lambda key: s[key][min(self.tier, len(s[key]) - 1)]

        self.roofmat = rng.choice(tiered('roofByTier'))
        self.form = rng.choice(s['roofForms'][self.plan])
        if self.roofmat == 'thatch' and self.form in ('xieshan', 'double'): self.form = 'hip'
        self.curve = s.get('curve', 0) if self.roofmat == 'tile' else 0
        self.wallkind = rng.choice(tiered('walls'))
        self.posts = self.pal[rng.choice(tiered('posts'))]
        self.lattice = pick('lattice', 'grid')
        self.ridge_end = tiered('ridgeEnds')
        self.beam = tiered('beamPaint')
        self.tile = self.pal[pick('tiles', 'tile')]
        self.wash = self.pal[pick('washes', 'plaster')]
        self.thatch = self.pal['thatch-old' if self.tier == 0 and rng.random() < .5 else 'thatch']
        self.brackets = self.tier >= 2 and self.plan in ('hall', 'terrace-hall', 'compound')
        self.stepped = ('stepped-gable' in s.get('extras', []) and self.tier >= 1
                        and self.plan in ('house', 'hall') and self.roofmat == 'tile')
        if self.stepped: self.form = 'gable'
        extras = s.get('extras', [])
        self.extras = {e for e in extras if rng.random() < .5 + .2 * self.tier}
        self.weathered = self.tier == 0 and rng.random() < .7

        fw, fh = recipe['footprint']
        self.W = fw * 16
        self.sw = side_depth(fh)
        facing = recipe.get('facing', 'south')
        slot = {'east': fw - 1, 'west': 0}.get(facing, recipe['entrance'][0])
        self.slot = max(0, min(fw - 1, slot))
        if self.plan == 'compound':
            self.D = fh * 16
            self.zx, self.zy = self.sw / self.D, .42
        else:
            self.D = self.sw
            self.zx = self.zy = 1
        self.ox = 10
        self.w = self.ox + self.W + self.sw + 14
        self.h = 230
        self.G = self.h - 6
        self.im = Image.new('RGBA', (self.w, self.h))
        self.px = self.im.load()
        self.d = ImageDraw.Draw(self.im)
        self.smoke, self.overlays = [], []
        self.roof_top = self.G - 40

    # -- projection -------------------------------------------------------

    def P(self, X, Y, Z):
        return (round(self.ox + X + Z * self.zx), round(self.G - Y - Z * self.zy))

    def face(self, pts, shader):
        scr = [self.P(*p) for p in pts]
        mask = Image.new('1', (self.w, self.h))
        ImageDraw.Draw(mask).polygon(scr, fill=1)
        box = mask.getbbox()
        if not box: return
        m = mask.load()
        O = pts[0]
        a = [pts[1][i] - O[i] for i in range(3)]
        b = [pts[-1][i] - O[i] for i in range(3)]
        ax, ay = a[0] + a[2] * self.zx, -(a[1] + a[2] * self.zy)
        bx, by = b[0] + b[2] * self.zx, -(b[1] + b[2] * self.zy)
        det = ax * by - bx * ay
        if abs(det) < 1e-6: return
        sx, sy = self.ox + O[0] + O[2] * self.zx, self.G - O[1] - O[2] * self.zy
        for y in range(box[1], box[3]):
            for x in range(box[0], box[2]):
                if not m[x, y]: continue
                dx, dy = x + .5 - sx, y + .5 - sy
                u = (dx * by - bx * dy) / det
                v = (ax * dy - dx * ay) / det
                c = shader(O[0] + u * a[0] + v * b[0], O[1] + u * a[1] + v * b[1],
                           O[2] + u * a[2] + v * b[2], x, y)
                if c: self.px[x, y] = c

    def front(self, x0, x1, y0, y1, z, sh):
        self.face([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], sh)

    def side(self, x, y0, y1, z0, z1, sh):
        self.face([(x, y0, z0), (x, y0, z1), (x, y1, z1), (x, y1, z0)], sh)

    def top(self, x0, x1, y, z0, z1, sh):
        self.face([(x0, y, z0), (x1, y, z0), (x1, y, z1), (x0, y, z1)], sh)

    def solid(self, c):
        return lambda *_: c

    def put(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h: self.px[x, y] = c

    # -- materials --------------------------------------------------------

    def fabric(self, kind, lit, top_y=None, base_y=0):
        """Wall infill. lit: 4 on a front, 3 on a return."""
        pal = self.pal

        def sh(X, Y, Z, x, y):
            if kind == 'rammed-earth':
                ramp = pal['earth']
                k = Y - base_y
                layer = int(k // 5)
                c = lit - (1 if k % 5 < 1 else 0)
                if k % 5 < 1 and (int(X + Z) + layer * 3) % 9 == 0: return ramp[1]
                if h2(int(X + Z) // 3, layer, 5) % 7 == 0: c -= 1
            elif kind == 'brick':
                ramp = pal['brick']
                row = int((Y - base_y) // 3)
                u = int(X + Z * 2) + (3 if row % 2 else 0)
                c = lit
                if (Y - base_y) % 3 < 1: c = lit - 2
                elif u % 7 == 0: c = lit - 2
                elif h2(u // 7, row) % 6 == 0: c = lit - 1
            else:
                ramp = pal['earth'] if kind == 'daub' else self.wash
                c = lit
                if kind == 'daub' and h2(x // 2, y // 3, 9) % 11 == 0: c -= 1
            if Y - base_y < 3 and dither(x, y + 1, (3 - (Y - base_y)) / 5): c -= 1
            if self.weathered and h2(x, y, 3) % 23 == 0: c -= 1
            return ramp_at(ramp, c)
        return sh

    def stone(self, lit):
        ramp = self.pal['stone']

        def sh(X, Y, Z, x, y):
            row = int(Y // 3)
            u = int(X + Z) + (4 if row % 2 else 0)
            if Y % 3 < 1 or u % 9 == 0: return ramp[lit - 2]
            return ramp[lit - (1 if h2(u // 9, row) % 5 == 0 else 0)]
        return sh

    def tile_shader(self, across, rows_from, lit, curve_dark=0):
        """Pan and cover tile running downslope. `across` maps a world point to
        a coordinate that steps one screen pixel per roll column."""
        ramp = self.tile
        period = 5 if self.sino.get('bigTiles') else 4

        def sh(X, Y, Z, x, y):
            col = across(X, Y, Z)
            k = int(col) % period
            t = Y - rows_from
            lap = int(t) % 4 == 0
            if k == 0: c = lit + 1
            elif k == 1: c = lit
            elif k == period - 1: c = lit - 2
            else: c = lit - 1
            if lap: c -= 1 if k >= 2 else 0
            if lap and k == 0: c += 1
            if t < 2: c -= 1
            n = h2(int(col) // period, int(t) // 4, 17)
            if n % 37 == 0 and k < period - 1: c += 1
            if self.weathered and t < 7 and n % 5 == 0 and dither(x, y, .5):
                return ramp_at(self.pal['moss'], 2 + (k == 0))
            return ramp_at(ramp, c - curve_dark)
        return sh

    def thatch_shader(self, across, rows_from, lit):
        ramp = self.thatch

        def sh(X, Y, Z, x, y):
            col = int(across(X, Y, Z))
            k = (Y - rows_from) / 4.6
            course = int(k)
            n = h2(col, course)
            f = k - course + (0, 0, 1, 2)[n % 4] / 4.6
            if f >= 1: f -= 1; n = h2(col, course + 1)
            c = lit - 2 if f < .12 else lit + 1 if f < .3 else lit if f < .7 else lit - 1
            if .3 <= f and n % 8 == 0: c -= 1
            if self.weathered and h2(x, y, 7) % 19 == 0: c -= 1
            return ramp_at(ramp, c)
        return sh

    def roof_shader(self, across, rows_from, lit):
        if self.roofmat == 'thatch': return self.thatch_shader(across, rows_from, lit)
        return self.tile_shader(across, rows_from, lit)

    # -- walls, bays and openings -----------------------------------------

    def bay_lines(self, x0, x1, n):
        """Column centres: the middle bay a little wider, as the hall's axis is."""
        if n == 1: return [x0, x1]
        w = [1.0] * n
        w[n // 2] = 1.3
        tot = sum(w)
        xs, acc = [x0], x0
        for k in w:
            acc += (x1 - x0) * k / tot
            xs.append(round(acc))
        xs[-1] = x1
        return xs

    def post(self, X, y0, y1, z, wide=3):
        p = self.posts
        self.front(X - wide / 2, X + wide / 2, y0, y1, z,
                   lambda X_, Y, Z, x, y: p[4] if X_ - (X - wide / 2) < 1 else p[2] if X_ > X + wide / 2 - 1 else p[3])
        base = self.pal['stone']
        self.front(X - wide / 2 - 1, X + wide / 2 + 1, y0, y0 + 2, z - .5,
                   lambda X_, Y, Z, x, y: base[5] if Y > y0 + 1 else base[3])

    def lattice_window(self, x0, x1, y0, y1, z):
        pat = LATTICE[self.lattice]
        tim, paper = self.posts, self.pal['paper']
        blind = 'blind' in self.extras

        def sh(X, Y, Z, x, y):
            i, j = int(X - x0), int(y1 - Y)
            if i < 1 or j < 1 or X > x1 - 1 or Y < y0 + 1:
                return tim[1] if i < 1 or j < 1 else tim[3]
            if blind and j < (y1 - y0) * .55:
                return self.pal['bamboo'][3 if j % 2 else 2]
            if pat[j % 6][i % 6] == 'X': return tim[2]
            return paper[3] if j > 2 else paper[2]
        self.front(x0, x1, y0, y1, z, sh)

    def opening(self, cx, gy_world, z, game):
        """A doorway in the wall at z; game=True is the world's door."""
        gx, gy = self.P(cx, gy_world, z)
        x, top = gx - DOOR_W // 2, gy - DOOR_H - 1
        d = self.d
        p = self.posts
        red = self.pal['lacquer-red']
        d.rectangle((x - 3, top - 4, x + DOOR_W + 2, gy), fill=p[2])
        d.line((x - 3, top - 4, x - 3, gy), fill=p[4])
        d.line((x - 3, top - 4, x + DOOR_W + 2, top - 4), fill=p[4])
        d.rectangle((x, top, x + DOOR_W, gy), fill=INTERIOR[0])
        for yy in range(top, gy + 1):
            for xx in range(x + 1, x + 4):
                if dither(xx, yy, .55 - (xx - x) * .16): d.point((xx, yy), fill=INTERIOR[2])
        d.line((x, top, x + DOOR_W, top), fill=INTERIOR[1])
        if not game:
            leaf = red if self.tier else self.pal['timber']
            d.rectangle((x, top, x + DOOR_W, gy - 1), fill=leaf[2])
            d.line((x + DOOR_W // 2, top, x + DOOR_W // 2, gy - 1), fill=leaf[0])
            d.line((x, top, x, gy - 1), fill=leaf[3])
        if self.tier >= 1:
            # The two door-pins (menzan) that hold the leaves' pivot beam.
            for px_ in (x + 2, x + DOOR_W - 3):
                d.rectangle((px_, top - 3, px_ + 1, top - 2), fill=p[5])
                d.point((px_ + 1, top - 2), fill=p[3])
        if 'couplets' in self.extras and self.tier >= 1:
            for px_ in (x - 6, x + DOOR_W + 4):
                d.rectangle((px_, top + 1, px_ + 1, top + 16), fill=red[4])
                d.line((px_ + 1, top + 1, px_ + 1, top + 16), fill=red[3])
                for yy in range(top + 3, top + 16, 3): d.point((px_, yy), fill=red[2])
        # Raised threshold.
        d.line((x - 1, gy, x + DOOR_W + 1, gy), fill=p[3])
        d.line((x - 1, gy + 1, x + DOOR_W + 1, gy + 1), fill=self.pal['stone'][5])
        if game:
            self.door_x, self.bottom = gx, gy

    def beam_band(self, x0, x1, y0, z, hgt=4):
        """The lintel under the eave: bare, red, or painted in blue-green caihua."""
        tim, red = self.posts, self.pal['lacquer-red']
        green, blue, gold = self.pal['green'], self.pal['blue'], self.pal['gold']
        style = self.beam
        bays = self.bays

        def sh(X, Y, Z, x, y):
            j = y0 + hgt - Y
            if j < 1: return tim[5] if style == 'bare' else tim[4]
            if j >= hgt - 1: return tim[1]
            if style == 'red': return red[3] if X > x0 + 1 else red[2]
            if style == 'caihua':
                for a, b in zip(bays, bays[1:]):
                    if a <= X < b:
                        u, mid = X - a, (b - a) / 2
                        if abs(u - mid) + abs(j - hgt / 2) * 1.5 < 3.2: return gold[4] if abs(u - mid) < 1 else gold[2]
                        if u < 3 or b - X < 3: return green[3]
                        return blue[3] if (int(X) // 2 + j) % 5 else blue[4]
                return blue[3]
            return tim[3]
        self.front(x0, x1, y0, y0 + hgt, z, sh)

    def bracket_zone(self, x0, x1, y0, z, cols, hgt=6):
        """Dougong: stepped timber brackets on each column head, in the dark
        gap between the lintel and the eave."""
        self.front(x0, x1, y0, y0 + hgt, z, self.solid(INTERIOR[1]))
        tim = self.pal['green'] if self.beam == 'caihua' else self.posts
        between = [(a + b) / 2 for a, b in zip(cols, cols[1:]) if b - a > 18]
        for X in list(cols) + between:
            sx, sy = self.P(X, y0, z)
            rows = [(1, 1), (1, 1), (3, 3), (1, 1), (5, 5)][:hgt - 1]
            for k, (l, rr) in enumerate(rows):
                yy = sy - 1 - k
                for xx in range(sx - l, sx + rr + 1):
                    c = tim[4] if xx == sx - l else tim[2] if xx == sx + rr else tim[3]
                    self.put(xx, yy, c)
            self.put(sx - 5, sy - hgt, tim[5]); self.put(sx + 5, sy - hgt, tim[2])

    def eave_shadow(self, x0, x1, y_under, z, ramp):
        for X in range(int(x0), int(x1)):
            for k in range(1, 5):
                sx, sy = self.P(X, y_under - k, z)
                if not (0 <= sx < self.w and 0 <= sy < self.h) or not self.px[sx, sy][3]: continue
                if self.px[sx, sy][:3] in [c[:3] for c in INTERIOR]: continue
                if k < 3 or dither(sx, sy, .55 - (k - 3) * .3):
                    cur = self.px[sx, sy]
                    self.px[sx, sy] = tuple(max(0, int(v * (.62 if k < 2 else .75))) for v in cur[:3]) + (255,)

    # -- a building -------------------------------------------------------

    def building(self, x0, x1, z0, z1, y0, wh, bays, door=None, veranda=0,
                 form=None, rise=None, windows=True, side_wall=True):
        """One timber-frame range with its roof. `door` is 'game', 'closed' or
        None; returns the eave height so a caller can hang things off it."""
        form = form or self.form
        fz = z0 + veranda
        top = y0 + wh
        zone = 6 if self.brackets else 0
        self.bays = cols = self.bay_lines(x0, x1, bays)
        framed = self.wallkind != 'rammed-earth'
        dado = 9 if self.wallkind in ('plaster', 'brick-dado') else 0
        infill = 'plaster' if self.wallkind == 'brick-dado' else self.wallkind
        # Return wall first; the front's corner post overlaps it.
        if side_wall:
            gable_kind = 'brick' if self.wallkind == 'brick-dado' and form == 'gable' else infill
            self.side(x1, y0, top + zone, fz, z1, self.fabric(gable_kind, 3, top, y0))
            if dado and gable_kind != 'brick':
                self.side(x1, y0, y0 + dado, fz, z1, self.fabric('brick', 3, None, y0))
        self.front(x0, x1, y0, top + zone, fz, self.fabric(infill, 4, top, y0))
        if dado:
            self.front(x0, x1, y0, y0 + dado, fz, self.fabric('brick', 4, None, y0))
            self.front(x0, x1, y0 + dado, y0 + dado + 1, fz, self.solid(self.pal['brick'][5]))
        door_bay = None
        if door:
            door_bay = (len(cols) - 2) // 2
            if self.slot is not None:
                dcx = self.slot * 16 + 8
                door_bay = next(i for i, b in enumerate(cols[1:]) if dcx < b or i == len(cols) - 2)
        if windows:
            for i, (a, b) in enumerate(zip(cols, cols[1:])):
                if i == door_bay or b - a < 9: continue
                lo = y0 + (dado + 2 if dado else 9)
                self.lattice_window(a + 3, b - 2, lo, min(top - 5, lo + 13), fz)
        if framed or veranda:
            for X in cols:
                self.post(X if X < x1 else X - 1, y0, top, fz if not veranda else z0,
                          wide=3 if self.plan != 'hut' else 2)
        self.beam_band(x0, x1, top - 4, fz)
        if veranda:
            self.top(x0, x1, y0, z0, fz, lambda X, Y, Z, x, y: self.pal['stone'][4] if int(X + Z) % 7 else self.pal['stone'][3])
            self.beam_band(x0, x1, top - 4, z0)
        if zone: self.bracket_zone(x0, x1, top, z0, cols)
        if door_bay is not None:
            a, b = cols[door_bay], cols[door_bay + 1]
            cx = (a + b) / 2 if bays > 1 else max(x0 + 9, min(x1 - 9, self.slot * 16 + 8))
            self.opening(cx, y0, fz, door == 'game')
        # Corner: the front's last column turns into the return.
        c = self.P(x1, y0, fz)
        self.d.line((c, self.P(x1, top + zone, fz)), fill=self.posts[1] if framed else self.pal['earth'][2])
        eave = top + zone + 1
        rise = rise if rise is not None else roof_rise('thatch' if self.roofmat == 'thatch' else 'tile')
        if form == 'double':
            eave = self.skirt(x0, x1, z0, z1, eave, cols)
            x0, x1, z0, z1 = x0 + 4, x1 - 4, z0 + 3, z1 - 2
            form = 'xieshan' if 'xieshan' in self.sino['roofForms']['terrace-hall'] else 'hip'
        self.roof(x0, x1, z0, z1, eave, rise, form)
        self.eave_shadow(x0, x1, eave - 3, fz, None)
        return eave

    # -- roofs ------------------------------------------------------------

    def heights(self):
        p = 1 + .5 * self.curve
        us = [0, .3, .6, .82, 1] if self.curve else [0, 1]
        return us, (lambda u: u ** p if self.curve else u)

    def roof(self, x0, x1, z0, z1, eave, rise, form, hem=True):
        o = OVER + (1 if self.plan in ('hall', 'terrace-hall') else 0)
        v = VERGE
        zE, zB, zc = z0 - o, z1 + o, (z0 + z1) / 2
        ridge = eave + rise
        us, hf = self.heights()
        hipped = form in ('hip', 'xieshan')
        a = zc - zE
        L, R = (x0 - o, x1 + o) if hipped else (x0 - v, x1 + v)
        a = min(a, (R - L) / 2 - 5)
        ug = {'hip': 1, 'xieshan': .45}.get(form, 0)
        xl = lambda u: L + a * min(u, ug)
        xr = lambda u: R - a * min(u, ug)
        zf = lambda u: zE + (zc - zE) * u
        zb = lambda u: zB - (zB - zc) * u
        yy = lambda u: eave + rise * hf(u)
        front_sh = self.roof_shader(lambda X, Y, Z: X, eave, 3)
        side_sh = self.roof_shader(lambda X, Y, Z: Z * max(self.zx, self.zy), eave, 2)
        stepped = self.stepped and form == 'gable'
        if stepped:
            self.fire_wall(x0 - 1, z0, z1, eave, ridge, left=True)
        # Right side first: the front slope's end overlaps it.
        if hipped:
            for u0, u1 in zip(us, us[1:]):
                if u0 >= ug: break
                u1 = min(u1, ug)
                self.face([(xr(u0), yy(u0), zf(u0)), (xr(u0), yy(u0), zb(u0)),
                           (xr(u1), yy(u1), zb(u1)), (xr(u1), yy(u1), zf(u1))], side_sh)
            if form == 'xieshan':
                self.gable_panel(xr(ug), yy(ug), zf(ug), zb(ug), ridge, zc)
        elif not stepped:
            self.side(x1, eave - 1, eave, z0, z1, self.solid(self.posts[1]))
            self.face([(x1, eave - 1, zE), (x1, eave - 1, zB), (x1, ridge - 1, zc)],
                      self.fabric('brick' if self.wallkind == 'brick-dado' else self.wallkind, 3, None, eave))
        for u0, u1 in zip(us, us[1:]):
            self.face([(xl(u0), yy(u0), zf(u0)), (xr(u0), yy(u0), zf(u0)),
                       (xr(u1), yy(u1), zf(u1)), (xl(u1), yy(u1), zf(u1))], front_sh)
        if not hipped and not stepped:
            self.verge(R, us, yy, zf, zb, zc)
        if hem: self.hem(L, R, eave, zE, zB if hipped else None, a if hipped else 0)
        self.ridge(xl(1), xr(1), ridge, zc)
        if hipped: self.hips(xl, xr, yy, zf, ug, us)
        if stepped:
            self.fire_wall(x1, z0, z1, eave, ridge, left=False)
        rx, ry = self.P((x0 + x1) / 2, ridge, zc)
        self.roof_top = min(self.roof_top, ry - 9)
        return ridge

    def skirt(self, x0, x1, z0, z1, eave, cols):
        """The lower of a double eave: a pent roof round the hall, then a
        short clerestory of brackets carrying the upper roof. Returns the
        upper eave."""
        o = OVER + 1
        up = 7
        zE, zB = z0 - o, z1 + o
        ix0, ix1, iz0, iz1 = x0 + 4, x1 - 4, z0 + 3, z1 - 2
        yt = eave + up
        self.face([(x1 + o, eave, zE), (x1 + o, eave, zB), (ix1, yt, iz1), (ix1, yt, iz0)],
                  self.tile_shader(lambda X, Y, Z: Z, eave, 2))
        self.face([(x0 - o, eave, zE), (x1 + o, eave, zE), (ix1, yt, iz0), (ix0, yt, iz0)],
                  self.tile_shader(lambda X, Y, Z: X, eave, 3))
        self.hem(x0 - o, x1 + o, eave, zE, zB, 0)
        tile = self.tile
        for a, b in (((x0 - o, eave, zE), (ix0, yt, iz0)), ((x1 + o, eave, zE), (ix1, yt, iz0))):
            self.d.line((self.P(*a), self.P(*b)), fill=tile[4])
        hgt = 9
        self.side(ix1, yt - 1, yt + hgt, iz0, iz1, self.solid(self.posts[2]))
        inner = self.bay_lines(ix0, ix1, len(cols) - 1)
        self.bays = inner
        self.beam_band(ix0, ix1, yt - 1, iz0, 3)
        self.bracket_zone(ix0, ix1, yt + 2, iz0, inner, hgt - 3)
        self.eave_shadow(x0, x1, eave - 3, z0, None)
        return yt + hgt + 1

    def hem(self, L, R, eave, zE, zB, a):
        """Eave edge: a dark lip, round end tiles on the rolls, a drip under
        each pan; the corner flicks up where the profile curves."""
        tile, th = self.tile, self.thatch
        if self.roofmat == 'thatch':
            self.front(L, R, eave - 3, eave, zE,
                       lambda X, Y, Z, x, y: th[4] if Y > eave - 1 and x % 3 else th[2] if Y > eave - 2 else th[0] if h2(x) % 3 else th[1])
            for X in range(int(L), int(R)):
                if h2(X, 91) % 3 == 0:
                    sx, sy = self.P(X, eave - 3, zE)
                    self.put(sx, sy + 1, th[1])
            if zB is not None:
                self.side(R, eave - 3, eave, zE, zB, lambda X, Y, Z, x, y: th[1] if h2(int(Z)) % 3 else th[0])
            return
        period = 5 if self.sino.get('bigTiles') else 4

        def sh(X, Y, Z, x, y):
            k = int(X) % period
            j = eave - Y
            if k in (0, 1) and j < 2.2: return tile[5] if k == 0 and j < 1 else tile[3]
            if j < 1: return tile[2]
            return tile[0] if j > 2 else tile[1]
        self.front(L, R, eave - 3, eave, zE, sh)
        for X in range(int(L) + 2, int(R) - 1, period):
            sx, sy = self.P(X + 2.5, eave - 3, zE)
            self.put(sx, sy + 1, tile[1])
        if zB is not None:
            self.side(R, eave - 3, eave, zE, zB,
                      lambda X, Y, Z, x, y: tile[4] if eave - Y < 1 and int(Z * 2) % 3 == 0 else tile[1] if eave - Y < 2 else tile[0])
        if self.curve:
            lift = 1 + self.curve
            for X0, sgn in ((L, -1), (R, 1)):
                sx, sy = self.P(X0, eave, zE)
                for k in range(lift + 1):
                    self.put(sx + sgn * (k // 2), sy - k, tile[4] if k == lift else tile[2])
                    self.put(sx + sgn * (k // 2), sy - k + 1, tile[1])

    def verge(self, R, us, yy, zf, zb, zc):
        tile = self.tile
        pts = [self.P(R, yy(u), zf(u)) for u in us] + [self.P(R, yy(u), zb(u)) for u in reversed(us)]
        board = self.posts if self.tier else self.pal['timber']
        for (ax, ay), (bx, by) in zip(pts, pts[1:]):
            self.d.line((ax, ay + 1, bx, by + 1), fill=board[1])
            self.d.line((ax, ay, bx, by), fill=tile[4])
            self.d.line((ax, ay - 1, bx, by - 1), fill=tile[2])

    def gable_panel(self, X, yg, z0, z1, ridge, zc):
        """The small vertical gable of a hip-and-gable roof: boards, the barge
        boards along its rake, a hanging fish at the apex."""
        tim = self.pal['timber'] if self.beam == 'bare' else self.posts
        self.face([(X, yg, z0), (X, yg, z1), (X, ridge, zc)],
                  lambda X_, Y, Z, x, y: tim[2] if int(Z * self.zx * 2) % 3 else tim[1])
        self.side(X, yg - 2, yg, z0, z1, self.tile_shader(lambda X_, Y, Z: Z * 2, yg - 2, 2))
        for (a, b) in (((X, yg, z0), (X, ridge, zc)), ((X, ridge, zc), (X, yg, z1))):
            self.d.line((self.P(*a), self.P(*b)), fill=tim[4])
        ax, ay = self.P(X, ridge, zc)
        for k in range(2, 5): self.put(ax, ay + k, self.pal['gold'][3] if k < 4 else tim[1])

    def ridge(self, xa, xb, ridge, zc):
        tile = self.tile if self.roofmat == 'tile' else self.thatch
        hgt = 3 if self.plan in ('hut', 'house') else 4
        if self.roofmat == 'thatch':
            p0, p1 = self.P(xa - 1, ridge, zc), self.P(xb, ridge, zc)
            for k, c in ((-2, tile[4]), (-1, tile[3]), (0, tile[2]), (1, tile[0])):
                self.d.line((p0[0], p0[1] + k, p1[0], p1[1] + k), fill=c)
            tim = self.pal['timber']
            for x in range(p0[0] + 3, p1[0] - 1, 6):
                self.put(x - 1, p0[1] - 3, tim[4]); self.put(x + 1, p0[1] - 3, tim[2]); self.put(x, p0[1] - 2, tim[3])
            self.smoke.append([p0[0] + (p1[0] - p0[0]) // 2 + 3, p0[1] - 3, 'vent'])
            return
        openwork = self.tier >= 1 and self.plan not in ('hut',)
        self.front(xa - 1, xb + 1, ridge - 1, ridge + hgt - 1, zc,
                   lambda X, Y, Z, x, y: tile[4] if Y > ridge + hgt - 2 else
                   (tile[1] if openwork and Y > ridge and int(X) % 4 == 1 and Y < ridge + hgt - 2 else tile[2]))
        p0, p1 = self.P(xa - 1, ridge + hgt - 1, zc), self.P(xb + 1, ridge + hgt - 1, zc)
        self.d.line((p0[0], p0[1] - 1, p1[0], p1[1] - 1), fill=tile[5])
        self.ridge_ends(p0, p1, hgt)

    def ridge_ends(self, p0, p1, hgt):
        tile = self.tile
        style = self.ridge_end
        for (x, y), sgn in ((p0, -1), (p1, 1)):
            if style == 'upturn':
                for k in range(4):
                    self.put(x + sgn * (k // 2), y - k, tile[4] if k == 3 else tile[2])
                    self.put(x + sgn * (k // 2) - sgn, y - k, tile[3])
            elif style in ('chiwen', 'scroll'):
                art = CHIWEN if style == 'chiwen' else SCROLL
                col = self.pal['gold'] if style == 'chiwen' and self.sino.get('glazedChiwen') else tile
                hh, ww = len(art), len(art[0])
                for j, row in enumerate(art):
                    for i, ch in enumerate(row):
                        if ch != 'X': continue
                        xx = x + (i - ww + 2 if sgn > 0 else -i + ww - 2)
                        yy = y - hh + j + 1
                        self.put(xx, yy, col[4] if j < 2 or (i == 0) else col[2] if j == hh - 1 else col[3])
            else:
                self.put(x, y - 1, tile[4]); self.put(x, y, tile[2])

    def hips(self, xl, xr, yy, zf, ug, us):
        tile = self.tile if self.roofmat == 'tile' else self.thatch
        pts_r = [self.P(xr(u), yy(u), zf(u)) for u in us if u <= ug] + [self.P(xr(ug), yy(ug), zf(ug))]
        pts_l = [self.P(xl(u), yy(u), zf(u)) for u in us if u <= ug] + [self.P(xl(ug), yy(ug), zf(ug))]
        for pts in (pts_l, pts_r):
            for (ax, ay), (bx, by) in zip(pts, pts[1:]):
                self.d.line((ax, ay, bx, by), fill=tile[1])
                self.d.line((ax, ay - 1, bx, by - 1), fill=tile[4])
        if self.plan == 'terrace-hall' and self.roofmat == 'tile' and self.tier >= 2:
            for pts in (pts_l, pts_r):
                (ax, ay) = pts[0]
                sgn = 1 if pts is pts_l else -1
                for k in range(3):
                    self.put(ax + sgn * (2 + 2 * k), ay - 3 - 2 * k, tile[4])
                    self.put(ax + sgn * (2 + 2 * k), ay - 2 - 2 * k, tile[1])

    def fire_wall(self, X, z0, z1, eave, ridge, left):
        """Stepped gable walls (matouqiang) standing proud of the roof, each
        step capped with a little tiled roof that flicks up at the front."""
        D = z1 - z0
        steps = [(z0 - 2, z0 + D * .3, eave + 7), (z0 + D * .3, z0 + D * .7, ridge + 4), (z0 + D * .7, z1 + 1, eave + 7)]
        wash, tile = self.wash, self.tile
        for za, zb_, ht in steps:
            self.face([(X, eave - 2, za), (X, eave - 2, zb_), (X, ht, zb_), (X, ht, za)],
                      lambda X_, Y, Z, x, y: wash[3 if left else 3] if Y < ht - 2 else tile[1])
            self.front(X - 1, X + 2, eave - 2, ht, za, lambda X_, Y, Z, x, y: wash[5] if Y < ht - 2 else tile[3])
            cx, cy = self.P(X, ht, za)
            self.put(cx - 1, cy - 1, tile[4]); self.put(cx - 2, cy - 2, tile[4]); self.put(cx + 2, cy - 1, tile[2])
            a, b = self.P(X, ht, za), self.P(X, ht, zb_)
            self.d.line((a[0], a[1] - 1, b[0], b[1] - 1), fill=tile[4])

    # -- plans ------------------------------------------------------------

    def plinth(self, x0, x1, z0, z1, ph):
        st = self.pal['stone'] if self.tier or self.sino.get('stonePlinth') else self.pal['earth']
        self.side(x1, 0, ph, z0, z1, lambda X, Y, Z, x, y: st[2] if Y > ph - 1 else st[1])
        self.front(x0, x1, 0, ph, z0, lambda X, Y, Z, x, y: st[5] if Y > ph - 1 else st[3] if int(X) % 11 else st[2])
        self.top(x0, x1, ph, z0, z1, lambda X, Y, Z, x, y: st[4] if Z > z0 + 1 else st[5])

    def steps(self, cx, ph, z0, n=None):
        st = self.pal['stone']
        n = n or max(1, ph // 2)
        for i in range(n):
            y0 = ph * i / n
            z = z0 - (n - i) * 2 + 2
            self.front(cx - 9 + i, cx + 9 - i, y0, y0 + ph / n, z, self.solid(st[3]))
            self.top(cx - 9 + i, cx + 9 - i, y0 + ph / n, z, z + 2, self.solid(st[5]))
            self.side(cx + 9 - i, y0, y0 + ph / n, z, z + 2, self.solid(st[2]))

    def balustrade(self, x0, x1, y, z, gap):
        st = self.pal['stone']
        for X in range(int(x0), int(x1)):
            if gap[0] - 1 < X < gap[1] + 1: continue
            sx, sy = self.P(X, y, z)
            post = (X - int(x0)) % 7 == 0
            for k in range(1, 6 if post else 5):
                c = st[5] if k in (4, 5) else st[3] if k == 1 else (st[4] if post else None)
                if c: self.put(sx, sy - k, c)
            if not post and (X % 7) in (3,): self.put(sx, sy - 2, st[4])

    def extras_front(self, x0, x1, y0, z, eave):
        pal = self.pal
        if 'lanterns' in self.extras and hasattr(self, 'door_x'):
            red, gold = pal['lacquer-red'], pal['gold']
            for dx in (-10, 10):
                sx, sy = self.door_x + dx, self.P(0, eave - 3, z)[1]
                self.d.line((sx, sy, sx, sy + 2), fill=pal['timber'][1])
                self.d.rectangle((sx - 1, sy + 3, sx + 1, sy + 7), fill=red[3])
                self.put(sx - 1, sy + 4, red[5]); self.put(sx + 1, sy + 6, red[1])
                self.put(sx, sy + 3, gold[3]); self.put(sx, sy + 8, gold[2])
        if 'vat' in self.extras and self.tier >= 1 and hasattr(self, 'door_x'):
            self.vat(x0 + 5 if self.door_x - self.P(x0, 0, z)[0] > 18 else x1 - 12, y0, z - 3)
        if 'jar' in self.extras:
            self.vat(x1 - 8, y0, z - 2, small=True)
        if 'drying' in self.extras and self.tier == 0:
            sx, sy = self.P(x0 + 4, eave - 4, z)
            for k in range(4):
                self.put(sx + k % 2, sy + k, pal['gold'][3 + (k % 2)])
            self.put(sx, sy + 4, pal['gold'][2])

    def vat(self, X, Y, Z, small=False):
        ramp = self.pal['earth' if small else 'glaze']
        sx, sy = self.P(X, Y, Z)
        rx, hh = (3, 6) if small else (4, 7)
        for j in range(hh):
            w = rx - (1 if j in (0, hh - 1) else 0)
            for i in range(-w, w + 1):
                c = ramp[4] if i < -w + 2 else ramp[1] if i > w - 2 else ramp[3]
                self.put(sx + i, sy - j, c)
        self.d.line((sx - rx, sy - hh, sx + rx, sy - hh), fill=ramp[5])
        if not small: self.d.line((sx - rx + 1, sy - hh + 1, sx + rx - 1, sy - hh + 1), fill=self.pal['water'][2])

    def woodpile(self, X, Z0, Z1):
        tim = self.pal['timber']
        for Z in range(int(Z0), int(Z1)):
            for Y in range(0, 9):
                sx, sy = self.P(X + 1, Y, Z)
                n = h2(Z, Y // 2, 5)
                c = tim[4] if (Y + Z) % 3 == 0 else tim[2] if n % 3 else tim[1]
                self.put(sx, sy, c)

    def chimney(self, X, Z, top):
        br = self.pal['brick']
        self.side(X + 4, top - 12, top, Z, Z + 3, self.solid(br[2]))
        self.front(X, X + 4, top - 12, top, Z, lambda X_, Y, Z_, x, y: br[4] if int(Y) % 3 else br[2])
        self.top(X, X + 4, top, Z, Z + 3, self.solid(br[1]))
        sx, sy = self.P(X + 2, top, Z + 1)
        self.smoke.append([sx, sy - 1, 'chimney'])

    def render_house(self):
        plan = self.plan
        W, D = self.W, self.D
        ph = {'hut': 1, 'house': 2, 'hall': 3, 'terrace-hall': 12}[plan]
        big = plan == 'terrace-hall'
        inset = 8 if big else 0
        bays = {'hut': 1, 'house': 3, 'hall': 5, 'terrace-hall': 5}[plan]
        wh = {'hut': 29, 'house': 31, 'hall': 32, 'terrace-hall': 34}[plan]
        veranda = 4 if plan == 'hall' or (big and self.tier >= 2) else 0
        x0, x1 = inset, W - inset
        if plan == 'hut' and self.tier == 0:
            self.wallkind = 'daub' if self.wallkind == 'plaster' else self.wallkind
        if big:
            self.terrace(0, W, 0, D, ph)
            y0, z0, z1 = ph, 2, D
        else:
            if ph: self.plinth(x0 - 1, x1 + 1, -2, D, ph)
            y0, z0, z1 = ph, 0, D
        if 'chimney' in self.extras and not big and self.form == 'gable' and not self.stepped:
            self.chimney(x1 - 6, z1 - 4, y0 + wh + 20)
        if 'woodpile' in self.extras and self.tier == 0 and not big:
            self.woodpile(x1, z0 + 2, z1 - 1)
        rise = roof_rise('thatch' if self.roofmat == 'thatch' else 'tile') + (4 if plan == 'hall' else 8 if big else 0)
        eave = self.building(x0, x1, z0, z1, y0, wh, bays, door='game', veranda=veranda, rise=rise)
        self.extras_front(x0, x1, y0, z0 + veranda, eave)
        if ph and not big:
            self.steps(self.door_x - self.ox - z0 - veranda, ph, -2, n=1)

    def terrace(self, x0, x1, z0, z1, ph):
        """A rammed-earth or dressed-stone tai under a great hall, reached by a
        central stair, railed in stone where the profile has it."""
        earth = self.sino.get('terrace', 'stone') == 'earth'
        body = self.fabric('rammed-earth', 4, None, 0) if earth else self.stone(4)
        self.side(x1, 0, ph, z0, z1, self.fabric('rammed-earth', 3, None, 0) if earth else self.stone(3))
        self.front(x0, x1, 0, ph, z0, body)
        st = self.pal['stone']
        self.top(x0, x1, ph, z0, z1, lambda X, Y, Z, x, y: st[5] if Z < z0 + 1 else st[4] if (int(X) // 6 + int(Z) // 3) % 2 else st[3])
        cx = self.slot * 16 + 8
        n = ph // 2
        for i in range(n):
            y0 = i * 2
            z = z0 - (n - i) * 1.2
            self.front(cx - 10, cx + 10, y0, y0 + 2, z, lambda X, Y, Z, x, y: st[3] if Y - int(Y) < .5 else st[4])
            self.top(cx - 10, cx + 10, y0 + 2, z, z + 1.2, self.solid(st[5]))
        for e in (cx - 12, cx + 10):
            self.face([(e, 0, z0 - n * 1.2), (e + 2, 0, z0 - n * 1.2), (e + 2, ph + 1, z0), (e, ph + 1, z0)],
                      lambda X, Y, Z, x, y: st[5] if X < cx else st[3])
        if not earth:
            self.balustrade(x0 + 1, x1 - 1, ph, z0 + .5, (cx - 12, cx + 12))

    def render_compound(self):
        """A walled court seen over its front wall: gatehouse in front, wings
        either side, the main hall across the back."""
        W, D = self.W, self.D
        zy = self.zy
        wall_h = 17
        wing_w = 30 if W >= 200 else 26
        hall_d = 30
        zm = D - hall_d
        za, zb = 10, zm - 6
        pal = self.pal
        # Court floor.
        brick = pal['stone']
        self.top(0, W, 0, 0, D, lambda X, Y, Z, x, y: brick[3] if (int(X) // 5 + int(Z * zy) // 2) % 2 else brick[4])
        mid = W / 2
        self.top(mid - 5, mid + 5, .2, za, zm, lambda X, Y, Z, x, y: brick[5] if int(Z * zy) % 2 else brick[4])
        # Main hall at the back, a step up.
        self.plinth(wing_w - 6, W - wing_w + 6, zm - 3, D, 2)
        keep = self.slot
        self.slot = None
        saved_form = self.form
        self.form = 'gable' if self.form not in ('xieshan', 'hip') else self.form
        bays = 5 if W >= 200 else 3
        self.building(wing_w - 4, W - wing_w + 4, zm, D - 4, 2, 31, bays, door='closed',
                      veranda=4 * (self.tier >= 1), rise=roof_rise('tile') + 4)
        self.form = saved_form
        # Wings: gable ends toward us, ridges running back.
        self.wing(W - wing_w, W, za, zb, outer=True)
        self.wing(0, wing_w, za, zb, outer=False)
        if 'tree' in self.extras or self.tier >= 1:
            self.court_tree(mid + (18 if self.rng.random() < .5 else -18), (za + zm) / 2 + 6)
        if 'vat' in self.extras:
            self.vat(mid - 14, 0, zm - 8)
        # Front: the street wall and its gatehouse.
        self.slot = keep
        self.street_wall(0, W, wall_h)

    def wing(self, x0, x1, z0, z1, outer):
        top = 27
        pal = self.pal
        xc = (x0 + x1) / 2
        o = OVER
        rise = 16
        ridge = top + rise
        infill = 'plaster' if self.wallkind == 'brick-dado' else self.wallkind
        if outer:
            self.side(x1, 0, top, z0, z1, self.fabric('brick' if self.wallkind == 'brick-dado' else infill, 3, top, 0))
        else:
            # The court face of the west wing: posts and lattice doors.
            p = self.posts

            def court(X, Y, Z, x, y):
                u = (Z - z0) * self.zy
                if int(u) % 7 == 0: return p[3]
                if Y > top - 4: return p[2]
                if 4 < Y < top - 6: return pal['paper'][2] if int(Y) % 3 else p[2]
                return self.wash[3]
            self.side(x1, 0, top, z0, z1, court)
        gable = 'brick' if self.wallkind == 'brick-dado' else infill
        self.front(x0, x1, 0, top, z0, self.fabric(gable, 4, top, 0))
        self.face([(x0, top, z0), (x1, top, z0), (xc, ridge - 1, z0)], self.fabric(gable, 4, None, top))
        self.lattice_window(xc - 5, xc + 5, 10, 21, z0)
        tile_sh = lambda lit: self.roof_shader(lambda X, Y, Z: Z * self.zy * 1.3, top, lit)
        self.face([(x0 - o, top, z0 - 2), (xc, ridge, z0 - 2), (xc, ridge, z1 + 2), (x0 - o, top, z1 + 2)], tile_sh(2))
        self.face([(xc, ridge, z0 - 2), (x1 + o, top, z0 - 2), (x1 + o, top, z1 + 2), (xc, ridge, z1 + 2)], tile_sh(3))
        tile = self.tile
        a, b, c = self.P(x0 - o, top, z0 - 2), self.P(xc, ridge, z0 - 2), self.P(x1 + o, top, z0 - 2)
        for (p0, p1) in ((a, b), (b, c)):
            self.d.line((p0[0], p0[1] + 1, p1[0], p1[1] + 1), fill=self.posts[1])
            self.d.line((p0, p1), fill=tile[4])
        r0, r1 = self.P(xc, ridge, z0 - 2), self.P(xc, ridge, z1 + 2)
        self.d.line((r0[0], r0[1] - 1, r1[0], r1[1] - 1), fill=tile[5])
        self.d.line((r0, r1), fill=tile[2])
        self.put(r0[0], r0[1] - 2, tile[4])

    def court_tree(self, X, Z):
        leaf = self.pal['leaf']
        tim = self.pal['timber']
        sx, sy = self.P(X, 0, Z)
        self.d.line((sx, sy, sx, sy - 12), fill=tim[1])
        self.d.line((sx + 1, sy, sx + 1, sy - 10), fill=tim[3])
        for k in range(70):
            n = h2(k, int(X), 3)
            dx, dy = n % 17 - 8, (n >> 5) % 11 - 5
            if dx * dx / 64 + dy * dy / 30 > 1: continue
            c = leaf[4] if dx + dy < -4 else leaf[1] if dx + dy > 5 else leaf[3] if n % 3 else leaf[2]
            self.put(sx + dx, sy - 18 + dy, c)
            self.put(sx + dx + 1, sy - 18 + dy, c)
        self.roof_top = min(self.roof_top, sy - 26)

    def street_wall(self, x0, x1, hgt):
        cx = self.slot * 16 + 8
        cx = max(x0 + 16, min(x1 - 16, cx))
        gw = 12
        wall = 'rammed-earth' if self.wallkind == 'rammed-earth' else 'brick' if self.wallkind == 'brick-dado' else 'plaster'
        self.side(x1, 0, hgt, 0, 4, self.fabric(wall, 3, hgt, 0))
        for a, b in ((x0, cx - gw), (cx + gw, x1)):
            self.front(a, b, 0, hgt, 0, self.fabric(wall, 4, hgt, 0))
            self.coping(a, b, hgt, 0, 4)
        self.eave_shadow(x0, x1, hgt - 1, 0, None)
        # Gatehouse: its own little range and roof, taller than the wall.
        gh = 29
        saved = (self.plan, self.brackets)
        self.plan = 'house'
        self.brackets = False
        self.front(cx - gw, cx + gw, 0, gh, 0, self.fabric('plaster' if wall == 'rammed-earth' and self.tier else wall, 4, gh, 0))
        self.side(cx + gw, 0, gh, 0, 6, self.fabric(wall, 3, gh, 0))
        self.bays = [cx - gw, cx + gw]
        for X in (cx - gw + 1.5, cx + gw - 1.5): self.post(X, 0, gh, -.2)
        self.beam_band(cx - gw, cx + gw, gh - 4, 0)
        self.opening(cx, 0, 0, True)
        if self.tier >= 2 and 'drum-stones' in self.sino.get('extras', []):
            st = self.pal['stone']
            for dx in (-DOOR_W // 2 - 5, DOOR_W // 2 + 3):
                sx, sy = self.P(cx, 0, -1)
                for j in range(7):
                    for i in range(3):
                        rr = abs(j - 3)
                        if i > 2 - rr // 2 and j not in (0, 6): continue
                        self.put(sx + dx + i, sy - j, st[5] if i == 0 else st[3] if j else st[2])
        self.roof(cx - gw, cx + gw, 0, 6, gh + 1, 13, 'gable')
        self.plan, self.brackets = saved
        self.extras_front(cx - gw, cx + gw, 0, 0, gh + 1)

    def coping(self, a, b, hgt, z0, z1):
        """A wall top: tiles on a later or richer wall, a thatch cap on an
        earth one."""
        tile = self.tile if self.roofmat == 'tile' or self.wallkind != 'rammed-earth' else self.thatch
        self.top(a - 1, b + 1, hgt + 1, z0 - 1, z1, lambda X, Y, Z, x, y: tile[3] if int(X) % 4 else tile[4])
        self.front(a - 1, b + 1, hgt, hgt + 2, z0 - 1, lambda X, Y, Z, x, y: tile[1] if Y < hgt + 1 else tile[4] if int(X) % 4 < 2 else tile[2])

    # -- whole ------------------------------------------------------------

    def render(self):
        if self.plan == 'compound':
            self.render_compound()
        else:
            self.render_house()
        gy = self.G
        self.d.line((self.ox, gy + 1, self.ox + self.W + self.sw // 2, gy + 1), fill=(30, 34, 26, 150))
        return self.finish()

    def finish(self):
        box = self.im.getbbox()
        cut = max(0, box[1] - 2)
        right = min(self.w, box[2] + 1)
        self.im = self.im.crop((0, cut, right, self.h))
        self.w, self.h = self.im.size
        self.G -= cut
        self.bottom -= cut
        self.smoke = [[x, y - cut, k] for x, y, k in self.smoke]
        self.overlays = [[k, x, y - cut] for k, x, y in self.overlays]
        self.anchor_x = self.ox + self.W / 2
        self.occlusion = [self.ox, max(0, self.roof_top - cut), self.ox + self.W + self.sw // 2, self.G - 1]
        return self.im
