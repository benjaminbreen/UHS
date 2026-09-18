"""Playhouses, composed from parts the way the religious buildings are: one
recipe yields several sizes, looks and facings. Source pixels throughout;
light from the upper left. Recipes live in src/content/graphics/theatres.json.

Four forms cover the range the game needs. A colonnade front is a European
opera house or a civic theatre; a ring is the timber playhouse; an open stage
is a noh or a temple stage, roofed and unwalled; a front house is the flat
street frontage of a kabuki theatre or a picture palace, told apart by whether
it carries banners or a marquee.
"""
import math
import random
from PIL import Image, ImageDraw
from art.buildings import ROOFS, DOOR_W, corner_door

OUTLINE = '#2f2a22'
TIMBER = ['#3a2c1d', '#5e4529', '#8a6538', '#b38a4f', '#d6b174']
CLOTH = ['#8d2f2c', '#b4453a', '#3d5a7a', '#5b7da2', '#9a7a2c', '#c6a442']
NEON = ['#f2d16b', '#f6e4a4', '#d97d4a', '#e8a86a']


def _hex(c):
    c = c.lstrip('#')
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def _mix(a, b, t):
    return tuple(round(x + (y - x) * t) for x, y in zip(a, b))


def deepen(ramp, warm=0.02, cool=0.045):
    """Five authored tones become nine. The shadow end cools a little and the
    lit end warms a little; overdoing either turns cool stone to sepia, which
    is what made the first pass read as one material throughout."""
    stops = [_hex(c) for c in ramp]
    out = []
    for i in range(9):
        t = i / 8 * (len(stops) - 1)
        lo = min(int(t), len(stops) - 2)
        tone = _mix(stops[lo], stops[lo + 1], t - lo)
        if i < 4:
            tone = _mix(tone, (44, 56, 82), (4 - i) * cool)
        elif i > 5:
            tone = _mix(tone, (255, 238, 208), (i - 5) * warm)
        out.append('#%02x%02x%02x' % tone)
    return out


def trim_from(ramp):
    """Dressed stone for the columns, entablature, surrounds and sculpture:
    the same hue as the wall, lifted and desaturated. A portico reads because
    the trim is pale against a darker field, not because of its outline."""
    out = []
    for i, c in enumerate(deepen(ramp)):
        rgb = _hex(c)
        grey = sum(rgb) / 3
        lifted = _mix(rgb, (grey, grey, grey), 0.45)
        out.append('#%02x%02x%02x' % _mix(lifted, (255, 250, 238), 0.34 + i * 0.03))
    return out


class TheatreBuilding:
    def __init__(self, recipe, material):
        self.r = recipe
        self.p = dict(material)
        self.rng = random.Random(recipe['seed'])
        self.w, self.h = recipe['canvas']
        self.im = Image.new('RGBA', (self.w, self.h))
        self.d = ImageDraw.Draw(self.im)
        self.facing = recipe.get('facing', 'south')
        self.ground = self.h - 6
        self.roof = ROOFS[recipe['roofMaterial']]
        # Two ramps: the field the building is built of, and the dressed
        # stone everything standing proud of it is cut from.
        self.W = deepen(material['wall'])
        self.M = (deepen(material['trim']) if material.get('trim')
                  else trim_from(material['wall']))
        self.p['wall'] = [self.W[0], self.W[2], self.W[4], self.W[6], self.W[8]]
        self.p['trim'] = [self.M[0], self.M[2], self.M[4], self.M[6], self.M[8]]

    # --- light ------------------------------------------------------------
    def shade(self, boxes, tint=(14, 18, 34)):
        """Darken what is already painted. Cast shadows have to composite over
        the wall rather than be drawn into it, or every joint and course under
        them disappears."""
        overlay = Image.new('RGBA', self.im.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        for x0, y0, x1, y1, alpha in boxes:
            if x1 < x0 or y1 < y0:
                continue
            od.rectangle((x0, y0, x1, y1), fill=(*tint, alpha))
        self.im.alpha_composite(overlay)
        self.d = ImageDraw.Draw(self.im)

    def cast(self, x0, y0, x1, y1, strength=96, feather=True):
        """A shadow thrown down and to the right, softening at its far edge."""
        if not feather:
            self.shade([(x0, y0, x1, y1, strength)])
            return
        span = max(1, x1 - x0)
        self.shade(
            [(x0, y0, x1 - span // 3, y1, strength),
             (x1 - span // 3 + 1, y0, x1, y1, strength * 5 // 9)]
        )

    def occlude(self, x0, y0, x1, y1, strength=84):
        """One line of contact shadow where two parts meet. It is what makes a
        column stand in a podium rather than sit on top of a picture of one."""
        self.shade([(x0, y0, x1, y1, strength)])

    # --- surfaces ----------------------------------------------------------
    def ashlar(self, x0, y0, x1, y1, shade=False, ramp=None, course=5):
        """Dressed stone at building scale: five-pixel courses of eight-pixel
        blocks, each with a lit top arris, a shaded foot and a little wear, so
        a wall carries texture rather than reading as a flat panel."""
        d = self.d
        T = ramp or self.W
        if x1 <= x0 or y1 <= y0:
            return
        d.rectangle((x0, y0, x1, y1), fill=T[1])
        tones = ([T[3], T[4], T[4], T[5], T[6]] if not shade
                 else [T[1], T[2], T[2], T[3], T[3]])
        light, dark = (T[7], T[1]) if not shade else (T[4], T[0])
        row = 0
        for y in range(y0, y1, course):
            off = (row % 2) * 4
            for x in range(x0 - off, x1, 8):
                bx0, bx1 = max(x0, x + 1), min(x1, x + 7)
                by1 = min(y1, y + course - 2)
                if bx1 <= bx0:
                    continue
                tone = self.rng.choice(tones)
                d.rectangle((bx0, y, bx1, by1), fill=tone)
                d.line((bx0, y, bx1, y), fill=light)
                d.line((bx0, by1, bx1, by1), fill=dark)
                # A weathered block here and there, and a chipped corner.
                if self.rng.random() < 0.12:
                    wx = self.rng.randint(bx0, max(bx0, bx1 - 1))
                    d.point((wx, y + 1), fill=T[2] if not shade else T[0])
                if self.rng.random() < 0.07:
                    d.point((bx1, y), fill=dark)
            row += 1

    def boards(self, x0, y0, x1, y1, shade=False):
        """Vertical timber boarding with a lit edge on every third board."""
        d = self.d
        dark, sh, base, light, hi = TIMBER
        if x1 <= x0 or y1 <= y0:
            return
        d.rectangle((x0, y0, x1, y1), fill=sh if shade else base)
        for i, x in enumerate(range(x0, x1, 4)):
            d.line((x, y0, x, y1), fill=dark)
            if i % 3 == 0 and not shade:
                d.line((x + 1, y0, x + 1, y1), fill=light)

    # --- classical parts --------------------------------------------------
    def capital(self, x, y, width, order):
        """Doric is an abacus over a flaring echinus; Ionic adds volutes;
        Corinthian two ranks of acanthus. Cut from the trim ramp, so the
        capital tells against the wall behind it."""
        d = self.d
        M = self.M
        if order == 'doric':
            # Echinus flaring out of the neck, then the square abacus.
            for i, ey in enumerate(range(y + 3, y + 8)):
                flare = i - 1
                d.line((x - flare, ey, x + width + flare, ey),
                       fill=M[6] if i < 2 else M[5])
                d.point((x - flare, ey), fill=M[8])
                d.point((x + width + flare, ey), fill=M[3])
            d.rectangle((x - 4, y, x + width + 4, y + 3), fill=M[7])
            d.line((x - 4, y, x + width + 4, y), fill=M[8])
            d.line((x - 4, y + 3, x + width + 4, y + 3), fill=M[3])
            d.line((x - 4, y, x - 4, y + 3), fill=M[8])
            d.line((x + width + 4, y, x + width + 4, y + 3), fill=M[2])
            return
        if order == 'ionic':
            d.rectangle((x - 1, y + 5, x + width + 1, y + 9), fill=M[5])
            d.line((x - 1, y + 5, x + width + 1, y + 5), fill=M[7])
            # A volute each side: an outer turn lit, an inner eye dark.
            for side, vx in ((-1, x - 5), (1, x + width - 1)):
                d.ellipse((vx, y + 1, vx + 6, y + 7), fill=M[7], outline=M[2])
                d.ellipse((vx + 2, y + 3, vx + 4, y + 5), fill=M[3])
                d.point((vx + 1, y + 2), fill=M[8])
            d.rectangle((x - 5, y, x + width + 5, y + 2), fill=M[7])
            d.line((x - 5, y, x + width + 5, y), fill=M[8])
            d.line((x - 5, y + 2, x + width + 5, y + 2), fill=M[3])
            return
        # Corinthian.
        for rank, (top_y, drop) in enumerate(((y + 4, 5), (y + 8, 4))):
            for i, lx in enumerate(range(x - 2 + rank, x + width + 2, 3)):
                leaf = M[6] if (i + rank) % 2 else M[4]
                d.line((lx, top_y, lx, top_y + drop), fill=leaf)
                d.point((lx + 1, top_y + drop), fill=M[2])
                d.point((lx, top_y), fill=M[8])
        d.rectangle((x - 5, y, x + width + 5, y + 3), fill=M[7])
        d.line((x - 5, y, x + width + 5, y), fill=M[8])
        d.line((x - 5, y + 3, x + width + 5, y + 3), fill=M[3])

    def column(self, x, top, foot, width=10, order='doric', banded=False):
        """A fluted shaft with entasis, in dressed stone. The lighting runs
        across the drum — bright on the left quarter, mid across the face,
        dark on the right — rather than only edging it."""
        d = self.d
        M = self.M
        cap_h = 8 if order == 'doric' else 11
        shaft_top = top + cap_h
        run = max(1, foot - shaft_top)
        for y in range(shaft_top, foot):
            t = (y - shaft_top) / run
            swell = 1 if 0.22 < t < 0.82 else 0
            taper = 1 if t < 0.1 else 0
            xa = x - swell + taper
            xb = x + width + swell - taper
            span = max(1, xb - xa)
            for px in range(xa, xb + 1):
                across = (px - xa) / span
                tone = (M[8] if across < 0.14 else M[7] if across < 0.34
                        else M[6] if across < 0.62 else M[4] if across < 0.84
                        else M[3])
                d.point((px, y), fill=tone)
        if banded:
            for by in range(shaft_top + 8, foot - 6, 14):
                d.rectangle((x - 3, by, x + width + 3, by + 5), fill=M[6])
                d.line((x - 3, by, x + width + 3, by), fill=M[8])
                d.line((x - 3, by + 5, x + width + 3, by + 5), fill=M[2])
        else:
            # Flutes: a dark groove with a lit arris on its left.
            for i, fx in enumerate(range(x + 2, x + width - 1, 3)):
                d.line((fx, shaft_top + 3, fx, foot - 3), fill=M[3])
                d.line((fx + 1, shaft_top + 3, fx + 1, foot - 3), fill=M[7])
        self.capital(x, top, width, order)
        # Base: torus over plinth, both wider than the shaft.
        d.rectangle((x - 3, foot - 6, x + width + 3, foot - 3), fill=M[6])
        d.line((x - 3, foot - 6, x + width + 3, foot - 6), fill=M[8])
        d.line((x - 3, foot - 3, x + width + 3, foot - 3), fill=M[2])
        d.rectangle((x - 4, foot - 3, x + width + 4, foot), fill=M[5])
        d.line((x - 4, foot - 3, x + width + 4, foot - 3), fill=M[7])

    def swag(self, x0, x1, y):
        """A carved garland slung between two points: baroque and rococo eat
        these, and they are the cheapest ornament that reads at this size."""
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        mid = (x0 + x1) // 2
        d.arc((x0, y - 4, x1, y + 8), 0, 180, fill=sh)
        d.arc((x0, y - 5, x1, y + 7), 0, 180, fill=light)
        for rx in (x0, x1):
            d.line((rx, y - 2, rx, y + 5), fill=base)
            d.point((rx, y + 6), fill=hi)
        d.point((mid, y + 6), fill=hi)

    def figure(self, cx, foot, height=13, pose=0, plinth=True):
        """A standing sculpture in dressed stone: plinth, drapery that widens
        to the feet, shoulders, a raised arm. Shaded across the body rather
        than only edged, so it reads as carved and not as a paper cut-out."""
        d = self.d
        M = self.M
        if plinth:
            d.rectangle((cx - 5, foot - 3, cx + 5, foot), fill=M[5])
            d.line((cx - 5, foot - 3, cx + 5, foot - 3), fill=M[7])
            d.line((cx + 5, foot - 3, cx + 5, foot), fill=M[2])
            foot -= 3
        head = foot - height
        waist = head + max(6, height // 2)
        # Torso: lit left, mid centre, dark right.
        for y in range(head + 5, waist):
            d.point((cx - 2, y), fill=M[8])
            d.point((cx - 1, y), fill=M[7])
            d.point((cx, y), fill=M[6])
            d.point((cx + 1, y), fill=M[4])
            d.point((cx + 2, y), fill=M[3])
        # Drapery widening to the feet, with folds.
        for i, y in enumerate(range(waist, foot)):
            spread = 2 + i * 3 // max(1, foot - waist)
            for px in range(cx - spread, cx + spread + 1):
                across = (px - (cx - spread)) / max(1, 2 * spread)
                d.point((px, y), fill=(M[8] if across < 0.18 else M[6]
                                       if across < 0.55 else M[4]
                                       if across < 0.82 else M[3]))
            if i % 3 == 1:
                d.point((cx - 1, y), fill=M[4])
                d.point((cx + 1, y), fill=M[7])
        # Shoulders and head.
        d.line((cx - 3, head + 5, cx + 3, head + 5), fill=M[7])
        d.point((cx - 3, head + 5), fill=M[8])
        d.rectangle((cx - 2, head + 1, cx + 1, head + 4), fill=M[6])
        d.point((cx - 2, head + 1), fill=M[8])
        d.point((cx - 2, head + 2), fill=M[7])
        d.point((cx + 1, head + 3), fill=M[3])
        if pose == 0:
            d.line((cx - 3, head + 6, cx - 5, head + 1), fill=M[7])
            d.point((cx - 5, head), fill=M[8])
            d.line((cx + 3, head + 6, cx + 5, head + 10), fill=M[4])
        elif pose == 1:
            d.line((cx - 3, head + 6, cx - 6, head + 9), fill=M[5])
            d.line((cx + 3, head + 6, cx + 6, head + 3), fill=M[7])
            d.point((cx + 6, head + 2), fill=M[8])
        else:
            d.line((cx - 3, head + 5, cx - 4, head), fill=M[7])
            d.line((cx + 3, head + 5, cx + 4, head), fill=M[5])
            d.line((cx - 4, head, cx + 4, head), fill=M[6])
        # Contact shadow at the feet.
        self.occlude(cx - 4, foot - 1, cx + 5, foot, 70)

    def urn(self, cx, foot):
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        d.rectangle((cx - 3, foot - 2, cx + 3, foot), fill=sh, outline=dark)
        d.ellipse((cx - 3, foot - 9, cx + 3, foot - 2), fill=light, outline=dark)
        d.line((cx - 2, foot - 8, cx - 2, foot - 4), fill=hi)
        d.rectangle((cx - 2, foot - 12, cx + 2, foot - 9), fill=base, outline=dark)

    def quadriga(self, cx, foot):
        """Four horses abreast and a car behind them, on a plinth: the one
        roof ornament everybody recognises on an opera house."""
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        # Plinth first, so the group has something to stand on.
        d.rectangle((cx - 36, foot - 5, cx + 30, foot), fill=base, outline=dark)
        d.line((cx - 36, foot - 5, cx + 30, foot - 5), fill=hi)
        top = foot - 5
        for i, hx in enumerate(range(cx - 12, cx + 20, 9)):
            body = light if i % 2 else base
            d.rectangle((hx, top - 13, hx + 8, top - 6), fill=body)
            d.line((hx, top - 13, hx + 8, top - 13), fill=hi)
            d.line((hx, top - 6, hx + 8, top - 6), fill=dark)
            # Neck and head, thrown forward.
            d.polygon([(hx + 8, top - 13), (hx + 13, top - 19), (hx + 15, top - 16),
                       (hx + 10, top - 8)], fill=body, outline=dark)
            d.point((hx + 13, top - 17), fill=dark)
            for lx in (hx + 1, hx + 6):
                d.line((lx, top - 6, lx, top), fill=sh)
        # The car and its driver behind the team.
        d.rectangle((cx - 33, top - 15, cx - 15, top - 2), fill=sh, outline=dark)
        d.line((cx - 33, top - 15, cx - 15, top - 15), fill=light)
        d.ellipse((cx - 31, top - 8, cx - 23, top), fill=base, outline=dark)
        self.figure(cx - 25, top - 15, 15, 2)

    def cartouche(self, cx, cy, w=16, h=11):
        """A shield with scrolled edges: the rococo answer to a blank field."""
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        d.ellipse((cx - w // 2, cy - h // 2, cx + w // 2, cy + h // 2), fill=light, outline=dark)
        d.ellipse((cx - w // 2 + 2, cy - h // 2 + 2, cx + w // 2 - 2, cy + h // 2 - 2),
                  fill=base, outline=sh)
        for sx in (cx - w // 2 - 1, cx + w // 2 + 1):
            d.point((sx, cy - 2), fill=light)
            d.point((sx, cy + 2), fill=sh)
        d.line((cx - 3, cy, cx + 3, cy), fill=hi)

    def relief(self, x0, x1, y0, y1):
        """Figures in low relief filling a pediment field: few and large, each
        as tall as the slope above it leaves room for, so the group reads as a
        composition rather than as a railing."""
        span = x1 - x0
        n = max(3, min(5, span // 38))
        mid = (x0 + x1) / 2
        for i in range(n):
            fx = int(x0 + span * (i + 0.5) / n)
            # The slope overhead, less a little clearance.
            head = y1 - (y1 - y0) * (1 - abs(fx - mid) / (span / 2)) + 2
            room = int(y1 - head)
            if room < 9:
                continue
            self.figure(fx, y1 - 1, min(room, y1 - y0 - 3), i % 3)

    def window(self, x0, y0, x1, y1, head, small=False):
        """A dressed surround, a pedimented head, glazing in cool blue with a
        highlight down the left light, and a sill that throws a shadow. The
        mockup's windows read because the surround is pale and the glass is
        blue; a dark hole in a dark wall reads as nothing."""
        d = self.d
        M, W = self.M, self.W
        # Architrave: a moulded band round the opening.
        d.rectangle((x0 - 3, y0 - 2, x1 + 3, y1 + 1), fill=M[6])
        d.line((x0 - 3, y0 - 2, x1 + 3, y0 - 2), fill=M[8])
        d.line((x0 - 3, y0 - 2, x0 - 3, y1 + 1), fill=M[7])
        d.line((x1 + 3, y0 - 2, x1 + 3, y1 + 1), fill=M[2])
        d.line((x0 - 3, y1 + 1, x1 + 3, y1 + 1), fill=M[3])
        # Glazing: cool blue, lighter at the head.
        d.rectangle((x0, y0, x1, y1), fill='#20293a')
        for i, gy in enumerate(range(y0, y1, 3)):
            t = i / max(1, (y1 - y0) // 3)
            tone = '#%02x%02x%02x' % _mix((74, 96, 130), (30, 40, 58), t)
            d.rectangle((x0, gy, x1, min(y1, gy + 1)), fill=tone)
        # Glazing bars: one mullion, transoms every four.
        mid = (x0 + x1) // 2
        d.line((mid, y0, mid, y1), fill=M[5])
        for gy in range(y0 + 4, y1, 4):
            d.line((x0, gy, x1, gy), fill=M[4])
        # A reflection in the upper left light, and the head in shadow.
        d.line((x0 + 2, y0 + 2, x0 + 2, y0 + min(10, (y1 - y0) // 2)), fill='#9fb4cf')
        d.point((x0 + 3, y0 + 2), fill='#cfdcec')
        self.shade([(x0, y0, x1, y0 + 3, 70), (x1 - 2, y0, x1, y1, 48)])
        if not small:
            self.window_head(x0 - 3, x1 + 3, y0 - 2, head)
        # Sill: a projecting band, then its shadow on the wall.
        d.rectangle((x0 - 5, y1 + 1, x1 + 5, y1 + 4), fill=M[6])
        d.line((x0 - 5, y1 + 1, x1 + 5, y1 + 1), fill=M[8])
        d.line((x0 - 5, y1 + 4, x1 + 5, y1 + 4), fill=M[2])
        self.cast(x0 - 4, y1 + 5, x1 + 7, y1 + 8, 74)

    def window_head(self, x0, x1, y, kind):
        """What sits over an opening. A triangular head is a small pediment on
        two consoles, which is the part the mockup has and this did not."""
        d = self.d
        M = self.M
        if kind == 'none':
            return
        cx = (x0 + x1) // 2
        if kind in ('triangular', 'segmental'):
            # Consoles either side, then the cornice they carry. Kept tight to
            # the opening: a wide overhang leaves a zigzag of bare wall either
            # side of each apex, which is louder than the pediment itself.
            for bx in (x0, x1 - 2):
                d.rectangle((bx, y - 4, bx + 2, y), fill=M[5])
                d.line((bx, y - 4, bx + 2, y - 4), fill=M[7])
            d.rectangle((x0 - 1, y - 7, x1 + 1, y - 4), fill=M[6])
            d.line((x0 - 1, y - 7, x1 + 1, y - 7), fill=M[8])
            d.line((x0 - 1, y - 4, x1 + 1, y - 4), fill=M[2])
            rise = (x1 - x0) // 3
            if kind == 'triangular':
                d.polygon([(x0 - 1, y - 7), (cx, y - 7 - rise), (x1 + 1, y - 7)],
                          fill=M[5], outline=M[3])
                d.line((x0 - 1, y - 7, cx, y - 7 - rise), fill=M[8])
                d.line((cx, y - 7 - rise, x1 + 1, y - 7), fill=M[4])
            else:
                d.pieslice((x0 - 1, y - 7 - rise, x1 + 1, y - 7 + rise), 180, 360,
                           fill=M[5], outline=M[3])
                d.arc((x0 - 1, y - 8 - rise, x1 + 1, y - 6 + rise), 180, 360, fill=M[8])
            return
        if kind == 'broken':
            d.polygon([(x0 - 3, y), (cx - 3, y - 8), (cx - 2, y), (x0 - 3, y)],
                      fill=M[5], outline=M[2])
            d.polygon([(x1 + 3, y), (cx + 3, y - 8), (cx + 2, y), (x1 + 3, y)],
                      fill=M[5], outline=M[2])
            d.ellipse((cx - 3, y - 9, cx + 3, y - 3), fill=M[7], outline=M[2])
            return
        # Flat: a cornice on two consoles.
        d.rectangle((x0 - 3, y - 5, x1 + 3, y - 1), fill=M[6])
        d.line((x0 - 3, y - 5, x1 + 3, y - 5), fill=M[8])
        d.line((x0 - 3, y - 1, x1 + 3, y - 1), fill=M[2])

    def rusticate(self, x0, y0, x1, y1):
        """Deep horizontal joints on the lower storey: the base a baroque or
        beaux-arts front stands on."""
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        for y in range(y0, y1, 8):
            d.line((x0, y, x1, y), fill=dark)
            d.line((x0, y + 1, x1, y + 1), fill=light)

    def quoins(self, x0, x1, y0, y1):
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        for i, y in enumerate(range(y0, y1, 9)):
            w = 10 if i % 2 else 6
            d.rectangle((x0, y, x0 + w, y + 7), fill=light, outline=dark)
            d.rectangle((x1 - w, y, x1, y + 7), fill=base, outline=dark)

    def gable(self, x0, x1, base_y, rise, pal=None):
        pal = pal or self.roof
        cx = (x0 + x1) // 2
        self.d.polygon([(x0, base_y), (cx, base_y - rise), (x1, base_y)],
                       fill=pal[2], outline=pal[0])
        for i, y in enumerate(range(base_y - rise + 2, base_y, 3)):
            run = (y - (base_y - rise)) * (x1 - x0) // (2 * max(1, rise))
            self.d.line((cx - run, y, cx + run, y), fill=pal[3] if i % 2 else pal[1])

    def hipped(self, x0, x1, base_y, rise, overhang=6):
        """A deep hipped roof: the noh and temple-stage silhouette."""
        pal = self.roof
        d = self.d
        x0, x1 = x0 - overhang, x1 + overhang
        top0, top1 = x0 + (x1 - x0) // 4, x1 - (x1 - x0) // 4
        d.polygon([(x0, base_y), (top0, base_y - rise), (top1, base_y - rise),
                   (x1, base_y)], fill=pal[2], outline=pal[0])
        for i, y in enumerate(range(base_y - rise + 3, base_y, 4)):
            t = (y - (base_y - rise)) / max(1, rise)
            lx = int(top0 - (top0 - x0) * t)
            rx = int(top1 + (x1 - top1) * t)
            d.line((lx, y, rx, y), fill=pal[3] if i % 2 else pal[1])
        d.line((x0, base_y, x1, base_y), fill=pal[0])
        d.line((top0, base_y - rise, top1, base_y - rise), fill=pal[4] if len(pal) > 4 else pal[3])

    def doorway(self, cx, foot, width=9, height=20, arched=False):
        """Timber leaves under a fanlight, in a dressed surround. Brown against
        pale stone is the strongest note on the front, and it is what tells a
        viewer where the way in is."""
        d = self.d
        M = self.M
        x0, x1 = cx - width // 2, cx + width // 2
        arch_r = width // 2 + 2
        head = foot - height
        # Surround.
        d.rectangle((x0 - 4, head - 3, x1 + 4, foot), fill=M[6])
        d.line((x0 - 4, head - 3, x1 + 4, head - 3), fill=M[8])
        d.line((x0 - 4, head - 3, x0 - 4, foot), fill=M[7])
        d.line((x1 + 4, head - 3, x1 + 4, foot), fill=M[2])
        if arched:
            d.pieslice((x0 - 4, head - 3 - arch_r, x1 + 4, head - 3 + arch_r),
                       180, 360, fill=M[6])
            d.arc((x0 - 4, head - 3 - arch_r, x1 + 4, head - 3 + arch_r),
                  180, 360, fill=M[8])
        # Opening.
        d.rectangle((x0, head, x1, foot), fill='#1c1814')
        if arched:
            d.pieslice((x0, head - arch_r, x1, head + arch_r), 180, 360,
                       fill='#2b3547')
            # Fanlight bars radiating from the springing.
            for i in range(5):
                a = 3.14159 * (0.14 + i * 0.18)
                d.line((cx, head, int(cx - arch_r * 0.95 * math.cos(a)),
                        int(head - arch_r * 0.95 * math.sin(a))),
                       fill=M[5])
            d.arc((x0, head - arch_r, x1, head + arch_r), 180, 360, fill=M[3])
        else:
            d.rectangle((x0 + 1, head + 1, x1 - 1, head + 5), fill='#2b3547')
            d.line((cx, head + 1, cx, head + 5), fill=M[5])
        # Two timber leaves, panelled, lit on the left.
        leaf_top = head + (2 if arched else 7)
        for px in range(x0 + 1, x1):
            across = (px - x0) / max(1, width)
            tone = ('#7d5a3a' if across < 0.12 else '#6b4a2e' if across < 0.46
                    else '#5c3f27' if across < 0.54 else '#573a23'
                    if across < 0.88 else '#452d1b')
            d.line((px, leaf_top, px, foot - 1), fill=tone)
        d.line((cx, leaf_top, cx, foot - 1), fill='#33210f')
        for py in range(leaf_top + 4, foot - 3, 7):
            d.line((x0 + 2, py, cx - 2, py), fill='#3f2a18')
            d.line((x0 + 2, py + 1, cx - 2, py + 1), fill='#8a6542')
            d.line((cx + 2, py, x1 - 2, py), fill='#37240f')
            d.line((cx + 2, py + 1, x1 - 2, py + 1), fill='#6d4c2c')
        # Threshold and the shadow the reveal throws.
        d.rectangle((x0 - 5, foot, x1 + 5, foot + 2), fill=M[5])
        d.line((x0 - 5, foot, x1 + 5, foot), fill=M[7])
        self.shade([(x0, leaf_top, x0 + 2, foot - 1, 60),
                    (x1 - 2, leaf_top, x1, foot - 1, 80)])

    def colonnade(self):
        """A columned front. `style` sets the wall treatment and the window
        heads, `order` the columns, and the two motif fields what is carved on
        the pediment and stood along the roofline. Between them a Palladian
        theatre and a Beaux-Arts opera house come out of one painter."""
        r = self.r
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        style = r['style']
        w = self.w
        # Side pavilions take their width off the portico rather than hanging
        # off the canvas edge, which is what made them read as slivers.
        margin = 8 + (r['wings'] and w // 7 or 0)
        x0, x1 = margin, w - margin
        podium = r['podiumHeight']
        foot = self.ground - podium
        wall_top = foot - r['wallHeight']
        # The block behind the portico, then the shadowed bay between columns.
        self.ashlar(x0 + 6, wall_top, x1 - 6, foot)
        if style in ('baroque', 'beaux-arts'):
            self.rusticate(x0 + 6, foot - 26, x1 - 6, foot)
        if style == 'beaux-arts':
            self.quoins(x0 + 6, x1 - 6, wall_top, foot - 26)
        bay0, bay1 = x0 + 10, x1 - 10
        self.ashlar(bay0, wall_top + 6, bay1, foot - 2, shade=True)
        # Under the portico roof the light falls off upward: darkest at the
        # soffit, opening out toward the floor.
        depth = max(1, (foot - 2) - (wall_top + 6))
        self.shade([
            (bay0, wall_top + 6 + i, bay1, wall_top + 6 + i,
             int(96 - 70 * (i / depth)))
            for i in range(depth)
        ])
        d.line((bay0, wall_top + 6, bay1, wall_top + 6), fill=self.W[1])
        # Openings in the shadowed bay, with the head the style asks for.
        heads = {'palladian': 'triangular', 'baroque': 'segmental',
                 'rococo': 'broken', 'beaux-arts': 'flat'}
        for ax in range(x0 + 16, x1 - 22, 22):
            self.window(ax, wall_top + 26, ax + 12, foot - 16, heads[style])
        # Upper storey, set back.
        if r['storeys'] > 1:
            self.ashlar(x0 + 12, wall_top - 28, x1 - 12, wall_top, shade=True)
            for bx in range(x0 + 18, x1 - 20, 18):
                self.window(bx, wall_top - 24, bx + 9, wall_top - 6, 'none', small=True)
        self.doorway((x0 + x1) // 2, foot, 15, 30, arched=r['arched'])
        # Columns, paired where the style pairs them.
        span = (x1 - x0 - 10) / max(1, r['columns'] - 1)
        banded = style == 'baroque' and r['bandedShafts']
        places = []
        for i in range(r['columns']):
            cx = int(x0 + 5 + i * span) - 3
            if r['paired'] and i % 2:
                cx -= 4
            places.append(cx)
        # The entablature overhangs, so the head of the wall is in shadow.
        self.cast(x0 + 10, wall_top + 6, x1 - 10, wall_top + 13, 104, feather=False)
        # Each column throws a shadow down and to the right across the bay.
        # Clamped to the recessed bay: past its edge there is no wall to fall
        # on, and the shadow would hang in the air beside the building.
        for cx in places:
            self.cast(cx + 11, wall_top + 8, min(x1 - 11, cx + 19), foot - 2, 92)
        for cx in places:
            self.column(cx, wall_top - 8, foot, order=r['order'], banded=banded)
        # Contact at the foot of every shaft, and along the podium head.
        for cx in places:
            self.occlude(max(x0 - 4, cx - 4), foot - 1, min(x1 + 4, cx + 14),
                         foot + 1, 96)
        places_for_frieze = places
        # Entablature in three bands: architrave over the capitals, frieze,
        # then a cornice on dentils. One band was what made it read as noise.
        M = self.M
        arch_b = wall_top - 8
        arch_t = arch_b - 5
        frieze_b = arch_t
        frieze_t = frieze_b - 9
        ent_top = frieze_t - 7
        # Architrave: two fasciae, the upper standing proud.
        d.rectangle((x0 - 2, arch_t, x1 + 2, arch_b), fill=M[6])
        d.line((x0 - 2, arch_t, x1 + 2, arch_t), fill=M[8])
        d.line((x0 - 2, arch_t + 2, x1 + 2, arch_t + 2), fill=M[3])
        d.line((x0 - 2, arch_t + 3, x1 + 2, arch_t + 3), fill=M[7])
        d.line((x0 - 2, arch_b, x1 + 2, arch_b), fill=M[2])
        # Frieze.
        d.rectangle((x0 - 2, frieze_t, x1 + 2, frieze_b), fill=M[5])
        d.line((x0 - 2, frieze_t, x1 + 2, frieze_t), fill=M[7])
        if style == 'palladian' and r['order'] == 'doric':
            # Triglyphs over the columns, metopes between them.
            for gx in places_for_frieze:
                d.rectangle((gx + 2, frieze_t + 1, gx + 7, frieze_b - 1), fill=M[6])
                for vx in (gx + 3, gx + 5):
                    d.line((vx, frieze_t + 2, vx, frieze_b - 2), fill=M[2])
                    d.line((vx + 1, frieze_t + 2, vx + 1, frieze_b - 2), fill=M[8])
        elif style == 'rococo':
            for sx in range(x0 + 6, x1 - 16, 24):
                self.swag(sx, sx + 18, frieze_t + 2)
        elif style == 'beaux-arts':
            for gx in range(x0 + 6, x1 - 6, 9):
                d.rectangle((gx, frieze_t + 3, gx + 4, frieze_b - 3), fill=M[6])
                d.line((gx, frieze_t + 3, gx + 4, frieze_t + 3), fill=M[8])
        else:
            self.shade([(x0 - 2, frieze_t + 1, x1 + 2, frieze_b - 1, 34)])
        # Cornice: a row of dentils under a projecting corona.
        for gx in range(x0, x1, 7):
            d.rectangle((gx, frieze_t - 5, gx + 3, frieze_t - 1), fill=M[6])
            d.line((gx, frieze_t - 5, gx + 3, frieze_t - 5), fill=M[8])
            d.line((gx + 3, frieze_t - 5, gx + 3, frieze_t - 1), fill=M[2])
        d.rectangle((x0 - 5, ent_top, x1 + 5, frieze_t - 5), fill=M[7])
        d.line((x0 - 5, ent_top, x1 + 5, ent_top), fill=M[8])
        d.line((x0 - 5, frieze_t - 5, x1 + 5, frieze_t - 5), fill=M[3])
        # The corona throws its own shadow onto the dentils and the frieze.
        self.cast(x0 - 2, frieze_t - 4, x1 + 2, frieze_t - 2, 64, feather=False)
        # Pediment and whatever is carved in it.
        motif = r['pedimentMotif']
        if r['pediment']:
            rise = (x1 - x0) // 4
            apex = ent_top - rise
            if motif == 'broken':
                # Two swept scrolls climbing to a gap, with the cartouche set
                # in it. Drawn as a band following the rake rather than as a
                # solid field, or it reads as a flat parapet.
                cx = (x0 + x1) // 2
                for side in (-1, 1):
                    edge = x0 - 4 if side < 0 else x1 + 4
                    inner = cx - 11 * side * -1
                    inner = cx - 11 if side < 0 else cx + 11
                    d.polygon([(edge, ent_top), (inner, apex + 8),
                               (inner, apex + 15), (edge, ent_top + 7)],
                              fill=base, outline=dark)
                    d.line((edge, ent_top, inner, apex + 8), fill=hi)
                    # The scroll that finishes each sweep at the gap.
                    d.ellipse((inner - 4, apex + 6, inner + 4, apex + 14),
                              fill=light, outline=dark)
                    d.point((inner, apex + 10), fill=dark)
                self.cartouche(cx, apex + 9, 20, 16)
            else:
                d.polygon([(x0 - 4, ent_top), ((x0 + x1) // 2, apex),
                           (x1 + 4, ent_top)], fill=base, outline=dark)
                # Coursed stone inside the triangle, clipped to the rake a
                # row at a time: a flat field is the one thing that still
                # read as a painted shape rather than as masonry.
                cx_t = (x0 + x1) // 2
                for ty in range(apex + 3, ent_top - 1, 5):
                    t = (ty - apex) / max(1, ent_top - apex)
                    half = int((x1 + 4 - cx_t) * t) - 2
                    if half > 5:
                        self.ashlar(cx_t - half, ty, cx_t + half,
                                    min(ent_top - 1, ty + 4))
                d.polygon([(x0 - 4, ent_top), ((x0 + x1) // 2, apex),
                           (x1 + 4, ent_top)], outline=dark)
                d.line((x0 - 4, ent_top, x1 + 4, ent_top), fill=hi)
                d.line((x0 - 4, ent_top, (x0 + x1) // 2, apex), fill=light)
                d.line((x1 + 4, ent_top, (x0 + x1) // 2, apex), fill=sh)
                # Clipped to the rake: a bounding box here paints the sky.
                mid_t = (x0 + x1) // 2
                self.shade([
                    (mid_t - int((x1 + 4 - mid_t) * (yy - apex) / max(1, ent_top - apex)) + 2,
                     yy,
                     mid_t + int((x1 + 4 - mid_t) * (yy - apex) / max(1, ent_top - apex)) - 2,
                     yy, 30)
                    for yy in range(apex + 2, ent_top - 1)
                ])
                self.cast(x0, ent_top - 7, x1, ent_top - 1, 62, feather=False)
                if motif == 'relief':
                    self.relief(x0 + 8, x1 - 8, apex + 3, ent_top - 2)
                elif motif == 'cartouche':
                    self.cartouche((x0 + x1) // 2, ent_top - rise // 2, 18, 13)
                elif motif == 'clock':
                    cy = ent_top - rise // 2
                    d.ellipse((x0 + (x1 - x0) // 2 - 8, cy - 8,
                               x0 + (x1 - x0) // 2 + 8, cy + 8), fill=light, outline=dark)
                    d.ellipse((x0 + (x1 - x0) // 2 - 6, cy - 6,
                               x0 + (x1 - x0) // 2 + 6, cy + 6), fill='#2a2620')
                    cx = x0 + (x1 - x0) // 2
                    d.line((cx, cy, cx, cy - 4), fill=hi)
                    d.line((cx, cy, cx + 3, cy + 1), fill=light)
                elif motif == 'sculpture-group':
                    self.relief(x0 + 14, x1 - 14, apex + 2, ent_top - 2)
                    self.figure((x0 + x1) // 2, ent_top - 2, rise - 4, 2)
            if r['acroterion'] and motif != 'broken':
                self.urn((x0 + x1) // 2, apex + 1)
            roof_line = apex
        else:
            self.gable(x0 - 4, x1 + 4, ent_top, (x1 - x0) // 7)
            roof_line = ent_top - (x1 - x0) // 7
        # Roofline: what stands along the top, above everything else.
        line = r['roofline']
        if line == 'balustrade':
            top = ent_top + 2 if r['pediment'] else roof_line
            for bx in (x0 - 2, x1 - 8):
                d.rectangle((bx, top - 12, bx + 10, top), fill=base, outline=dark)
                for py in range(top - 10, top - 1, 4):
                    d.line((bx + 1, py, bx + 9, py), fill=light)
        elif line == 'urns':
            for ux in (x0 + 2, x1 - 2):
                self.urn(ux, ent_top + 2)
            if not r['pediment']:
                self.urn((x0 + x1) // 2, roof_line + 2)
        elif line == 'statues':
            top = ent_top + 1
            for i, fx in enumerate(range(x0 + 4, x1 - 2, (x1 - x0 - 6) // 3 or 1)):
                self.figure(fx, top, 14, i % 3)
        elif line == 'quadriga':
            self.quadriga((x0 + x1) // 2, roof_line - 1)
        elif line == 'dome':
            cx = (x0 + x1) // 2
            dr = (x1 - x0) // 5
            d.rectangle((cx - dr, roof_line - 8, cx + dr, roof_line), fill=base, outline=dark)
            d.pieslice((cx - dr, roof_line - 8 - dr, cx + dr, roof_line - 8 + dr),
                       180, 360, fill=self.roof[2], outline=self.roof[0])
            for i, ry in enumerate(range(roof_line - 8 - dr + 3, roof_line - 8, 3)):
                t = (ry - (roof_line - 8 - dr)) / max(1, dr)
                run = int(dr * (t ** 0.5))
                d.line((cx - run, ry, cx + run, ry), fill=self.roof[3] if i % 2 else self.roof[1])
            d.line((cx, roof_line - 10 - dr, cx, roof_line - 16 - dr), fill=light)
            d.ellipse((cx - 2, roof_line - 20 - dr, cx + 2, roof_line - 16 - dr),
                      fill=light, outline=dark)
        # Side pavilions: a wider front without a wider footprint.
        if r['wings']:
            wing_h = r['wallHeight'] * 2 // 3
            for wx0, wx1 in ((2, x0 + 4), (x1 - 4, w - 3)):
                self.ashlar(wx0, foot - wing_h, wx1, foot, shade=wx0 > 2)
                d.rectangle((wx0 - 2, foot - wing_h - 7, wx1 + 2, foot - wing_h),
                            fill=base, outline=dark)
                d.line((wx0 - 2, foot - wing_h - 7, wx1 + 2, foot - wing_h - 7), fill=hi)
                for wy in (foot - wing_h + 12, foot - 32):
                    for wcx in range(wx0 + 6, wx1 - 8, 16):
                        self.window(wcx, wy, wcx + 9, wy + 16, heads[style])
                if line in ('urns', 'statues'):
                    self.urn((wx0 + wx1) // 2, foot - wing_h - 7)
        # Where the building meets its podium.
        self.occlude(x0 - 4, foot, x1 + 4, foot + 2, 92)
        # Podium steps.
        for i in range(podium // 3):
            y = self.ground - i * 3
            d.rectangle((x0 - 4 - i * 2, y - 3, x1 + 4 + i * 2, y), fill=base, outline=dark)
            d.line((x0 - 4 - i * 2, y - 3, x1 + 4 + i * 2, y - 3), fill=light)

    def ring(self):
        """A timber drum: gallery openings in tiers, a ring of thatch, a flag."""
        r = self.r
        d = self.d
        w = self.w
        x0, x1 = 6, w - 6
        foot = self.ground
        tiers = r['tiers']
        tier_h = r['tierHeight']
        top = foot - tiers * tier_h
        self.boards(x0, top, x1, foot)
        self.boards(x1 - 10, top, x1, foot, shade=True)
        # Gallery openings, inset a little further on each rising tier.
        for t in range(tiers):
            y1 = foot - t * tier_h - 4
            y0 = y1 - tier_h + 10
            inset = 8 + t * 3
            for bx in range(x0 + inset, x1 - inset, 13):
                d.rectangle((bx, y0, bx + 8, y1), fill='#241d15')
                d.line((bx, y0, bx + 8, y0), fill=TIMBER[3])
                if t == 0:
                    continue
                d.line((bx, y1, bx + 8, y1), fill=TIMBER[1])
            if t:
                d.line((x0 + inset - 2, y1 + 2, x1 - inset + 2, y1 + 2), fill=TIMBER[3])
                d.line((x0 + inset - 2, y1 + 4, x1 - inset + 2, y1 + 4), fill=TIMBER[0])
        # The ring of thatch: pitched inward round an open yard, so the middle
        # is a hole rather than a ridge.
        pal = ROOFS['thatch']
        rise = 22
        cover = r['roofCover']
        inner0, inner1 = x0 + 22, x1 - 22
        if cover == 'none':
            # Unroofed: a plain rail round the top of the drum.
            d.rectangle((x0 - 3, top - 5, x1 + 3, top), fill=TIMBER[1], outline=OUTLINE)
            d.line((x0 - 3, top - 5, x1 + 3, top - 5), fill=TIMBER[3])
            self.doorway((x0 + x1) // 2, foot, 12, 22)
            if r['flag']:
                fx = x1 - 14
                d.line((fx, top - 5, fx, top - 33), fill=TIMBER[1])
                d.polygon([(fx + 1, top - 33), (fx + 16, top - 28), (fx + 1, top - 23)],
                          fill=CLOTH[self.rng.randrange(0, len(CLOTH), 2)], outline=OUTLINE)
            return
        if cover == 'half':
            inner0, inner1 = x0 + 10, (x0 + x1) // 2 + 4
        d.polygon([(x0 - 6, top), (inner0, top - rise), (inner1, top - rise),
                   (x1 + 6, top)], fill=pal[1], outline=pal[0])
        for i, y in enumerate(range(top - rise + 2, top, 3)):
            t = (y - (top - rise)) / rise
            lx = int(inner0 - (inner0 - x0 + 6) * t)
            rx = int(inner1 + (x1 + 6 - inner1) * t)
            d.line((lx, y, rx, y), fill=pal[2] if i % 2 else pal[1])
        # The open yard: the far gallery seen across the hole in the middle.
        d.polygon([(inner0, top - rise), (inner0 + 8, top - rise - 14),
                   (inner1 - 8, top - rise - 14), (inner1, top - rise)],
                  fill='#241f18', outline=pal[0])
        d.rectangle((inner0 + 10, top - rise - 12, inner1 - 10, top - rise - 5),
                    fill=TIMBER[1], outline=OUTLINE)
        d.line((inner0, top - rise, inner1, top - rise), fill=pal[3])
        # Painted cloths hung from the middle gallery on a playing day.
        if r['hangings'] != 'none':
            hy = foot - tiers * tier_h + tier_h // 2
            for i, hx in enumerate(range(x0 + 14, x1 - 20, 22)):
                colour = CLOTH[(i * 2) % len(CLOTH)]
                d.rectangle((hx, hy, hx + 14, hy + 18), fill=colour, outline=OUTLINE)
                d.line((hx, hy, hx + 14, hy), fill=TIMBER[3])
                if r['hangings'] == 'heraldic':
                    d.polygon([(hx + 3, hy + 4), (hx + 11, hy + 4), (hx + 7, hy + 14)],
                              fill=TIMBER[4], outline=OUTLINE)
                else:
                    for gy in range(hy + 5, hy + 17, 4):
                        d.line((hx + 2, gy, hx + 12, gy), fill=OUTLINE)
        self.doorway((x0 + x1) // 2, foot, 12, 22)
        if r['stairTurret']:
            # The outside stair by which the galleries were reached.
            tx = x0 - 2
            d.rectangle((tx - 10, foot - tiers * tier_h + 4, tx + 2, foot),
                        fill=TIMBER[1], outline=OUTLINE)
            for sy in range(foot - 6, foot - tiers * tier_h + 6, -7):
                d.line((tx - 9, sy, tx + 1, sy), fill=TIMBER[3])
            d.polygon([(tx - 13, foot - tiers * tier_h + 4), (tx - 4, foot - tiers * tier_h - 9),
                       (tx + 5, foot - tiers * tier_h + 4)],
                      fill=ROOFS['thatch'][2], outline=ROOFS['thatch'][0])
        if r['flag']:
            fx = x1 - 14
            d.line((fx, top - 12, fx, top - 40), fill=TIMBER[1])
            colour = CLOTH[self.rng.randrange(0, len(CLOTH), 2)]
            d.polygon([(fx + 1, top - 40), (fx + 16, top - 35), (fx + 1, top - 30)],
                      fill=colour, outline=OUTLINE)

    def open_stage(self):
        """A roofed platform on pillars, open on three sides."""
        r = self.r
        d = self.d
        dark, sh, base, light, hi = TIMBER
        w = self.w
        x0, x1 = 10, w - 10
        floor = self.ground - r['plinth']
        # Plinth.
        d.rectangle((x0, floor, x1, self.ground), fill=sh, outline=dark)
        d.line((x0, floor, x1, floor), fill=light)
        eave = floor - r['pillarHeight']
        # Back panel, then the pillars in front of it.
        self.boards(x0 + 14, eave + 6, x1 - 14, floor - 2, shade=True)
        if r['painting']:
            px0, px1 = x0 + 20, x1 - 20
            d.rectangle((px0, eave + 12, px1, floor - 8), fill='#6d6a4a', outline=dark)
            trunk = (px0 + px1) // 2
            d.line((trunk, floor - 8, trunk, eave + 22), fill='#4a3a26')
            for br in range(3):
                d.line((trunk, eave + 24 + br * 6, trunk + 10 - br * 3, eave + 18 + br * 6),
                       fill='#4a3a26')
                d.line((trunk, eave + 24 + br * 6, trunk - 10 + br * 3, eave + 18 + br * 6),
                       fill='#4a3a26')
            for _ in range(22):
                gx = self.rng.randint(px0 + 4, px1 - 4)
                gy = self.rng.randint(eave + 14, floor - 14)
                d.point((gx, gy), fill='#3f5f38')
        for px in (x0 + 4, x0 + 16, x1 - 20, x1 - 8):
            d.rectangle((px, eave, px + 5, floor), fill=base, outline=dark)
            d.line((px, eave, px, floor), fill=light)
        if r['roofForm'] == 'gabled':
            self.gable(x0 - r['overhang'], x1 + r['overhang'], eave, r['roofRise'])
        elif r['roofForm'] == 'hip-and-gable':
            # Irimoya: a hipped skirt with a small gable set on the ridge.
            self.hipped(x0, x1, eave, r['roofRise'] - 10, overhang=r['overhang'])
            cx = (x0 + x1) // 2
            self.gable(cx - 18, cx + 18, eave - r['roofRise'] + 10, 14)
        else:
            self.hipped(x0, x1, eave, r['roofRise'], overhang=r['overhang'])
        if r['finial'] != 'none':
            cx = (x0 + x1) // 2
            fy = eave - r['roofRise'] - 1
            if r['finial'] == 'onigawara':
                # A ridge-end tile with a face on it.
                d.rectangle((cx - 6, fy - 8, cx + 6, fy), fill=self.roof[1], outline=OUTLINE)
                d.point((cx - 3, fy - 5), fill=OUTLINE)
                d.point((cx + 3, fy - 5), fill=OUTLINE)
                d.line((cx - 3, fy - 2, cx + 3, fy - 2), fill=OUTLINE)
                d.polygon([(cx - 6, fy - 8), (cx, fy - 13), (cx + 6, fy - 8)],
                          fill=self.roof[2], outline=OUTLINE)
            else:
                d.rectangle((cx - 2, fy - 12, cx + 2, fy), fill='#c9a martial'[:7], outline=OUTLINE)
                d.ellipse((cx - 5, fy - 19, cx + 5, fy - 9), fill='#d1ac58', outline=OUTLINE)
                d.line((cx - 3, fy - 16, cx - 1, fy - 14), fill='#f0dca0')
        if r['railing']:
            # The low rail round three sides of the platform.
            d.line((x0, floor - 8, x1, floor - 8), fill=TIMBER[3])
            d.line((x0, floor - 5, x1, floor - 5), fill=TIMBER[1])
            for rx in range(x0 + 4, x1, 9):
                d.line((rx, floor - 8, rx, floor - 1), fill=TIMBER[2])
        for i in range(r['lanterns']):
            lx = x0 + 12 + i * ((x1 - x0 - 24) // max(1, r['lanterns'] - 1) if r['lanterns'] > 1 else 0)
            d.line((lx, eave + 2, lx, eave + 7), fill=OUTLINE)
            d.ellipse((lx - 4, eave + 7, lx + 4, eave + 17), fill='#e4c886', outline=OUTLINE)
            d.line((lx - 3, eave + 10, lx - 3, eave + 14), fill='#f6e6b4')
        if r['bridge']:
            # The walkway on the left, by which performers come on.
            d.rectangle((0, floor + 2, x0, floor + 6), fill=sh, outline=dark)
            d.line((0, floor + 2, x0, floor + 2), fill=light)

    def front_house(self):
        """A flat street frontage: doors, then banners or a lit marquee."""
        r = self.r
        d = self.d
        dark, sh, base, light, hi = self.p['wall']
        w = self.w
        x0, x1 = 6, w - 6
        foot = self.ground
        top = foot - r['wallHeight']
        if r['wallFinish'] == 'boards':
            self.boards(x0, top, x1, foot)
            self.boards(x1 - 12, top, x1, foot, shade=True)
        else:
            self.ashlar(x0, top, x1, foot)
            self.ashlar(x1 - 12, top, x1, foot, shade=True)
        # Doors along the front.
        span = (x1 - x0) / (r['doors'] + 1)
        for i in range(r['doors']):
            self.doorway(int(x0 + span * (i + 1)), foot, 11, 24, arched=r['arched'])
        if r['marquee']:
            my = top + 14
            style = r['marqueeStyle']
            depth = 12 if style != 'box' else 20
            x_out = 4 if style != 'blade' else 9
            d.rectangle((x0 - x_out, my, x1 + x_out, my + depth), fill=sh, outline=dark)
            d.line((x0 - x_out, my, x1 + x_out, my), fill=light)
            if style == 'blade':
                # A canopy that steps forward, with a lit underside.
                d.rectangle((x0 - x_out + 3, my + depth, x1 + x_out - 3, my + depth + 4),
                            fill=dark, outline=OUTLINE)
                for ux in range(x0 - 2, x1 + 2, 5):
                    d.point((ux, my + depth + 2), fill=NEON[1])
            for bx in range(x0 - x_out + 2, x1 + x_out - 1, 6):
                d.point((bx, my + 3), fill=NEON[0])
                d.point((bx + 1, my + 3), fill=NEON[1])
            d.rectangle((x0 + 6, my + 6, x1 - 6, my + depth - 3), fill='#1d1a16')
            for lx in range(x0 + 10, x1 - 10, 5):
                d.line((lx, my + 8, lx, my + depth - 5), fill=NEON[1])
        # The motif band sits under the marquee where there is one, and is
        # painted after it so the canopy does not cover it.
        motif_y = top + (36 if r['marquee'] else 14)
        if r['facadeMotif'] == 'chevrons':
            for cx0 in range(x0 + 4, x1 - 12, 14):
                d.polygon([(cx0, motif_y + 10), (cx0 + 7, motif_y), (cx0 + 14, motif_y + 10),
                           (cx0 + 10, motif_y + 10), (cx0 + 7, motif_y + 5),
                           (cx0 + 4, motif_y + 10)], fill=light, outline=dark)
                d.line((cx0, motif_y + 10, cx0 + 7, motif_y), fill=hi)
        elif r['facadeMotif'] == 'streamline':
            for by in range(motif_y, motif_y + 12, 4):
                d.line((x0 + 4, by, x1 - 4, by), fill=light)
                d.line((x0 + 4, by + 1, x1 - 4, by + 1), fill=dark)
                d.line((x0 + 4, by + 2, x1 - 4, by + 2), fill=sh)
        elif r['facadeMotif'] == 'lattice':
            for lx in range(x0 + 4, x1 - 4, 5):
                d.line((lx, top + 10, lx, foot - 26), fill=TIMBER[1])
            for ly in range(top + 10, foot - 26, 6):
                d.line((x0 + 4, ly, x1 - 4, ly), fill=TIMBER[0])
        if r['banners']:
            kind = r['bannerStyle']
            for i in range(r['banners']):
                bx = int(x0 + 10 + i * (x1 - x0 - 20) / max(1, r['banners'] - 1))
                colour = CLOTH[(i * 2) % len(CLOTH)]
                if kind == 'nobori':
                    # A standing pole with the cloth laced up one side.
                    py = foot - 4
                    d.line((bx, py, bx, top + 4), fill=TIMBER[1])
                    d.rectangle((bx + 1, top + 6, bx + 9, top + 6 + r['bannerDrop']),
                                fill=colour, outline=OUTLINE)
                    for gy in range(top + 11, top + 6 + r['bannerDrop'], 7):
                        d.line((bx + 2, gy, bx + 8, gy), fill=OUTLINE)
                    d.point((bx, top + 3), fill=TIMBER[4])
                elif kind == 'pennant':
                    d.polygon([(bx, top + 8), (bx + 9, top + 8),
                               (bx + 4, top + 8 + r['bannerDrop'])],
                              fill=colour, outline=OUTLINE)
                    d.line((bx, top + 8, bx + 9, top + 8), fill=TIMBER[3])
                else:
                    d.rectangle((bx, top + 8, bx + 7, top + 8 + r['bannerDrop']),
                                fill=colour, outline=OUTLINE)
                    d.line((bx, top + 8, bx + 7, top + 8), fill=TIMBER[3])
                    for gy in range(top + 14, top + 8 + r['bannerDrop'], 6):
                        d.line((bx + 1, gy, bx + 6, gy), fill=OUTLINE)
        if r['sign']:
            sx = x0 + 4
            d.rectangle((sx, top - r['signHeight'], sx + 10, top + 6),
                        fill='#241f1a', outline=dark)
            for sy in range(top - r['signHeight'] + 4, top, 7):
                d.rectangle((sx + 3, sy, sx + 7, sy + 4), fill=NEON[0])
        # Parapet or a low gable, so the roofline is not a bare edge.
        if r['parapet']:
            d.rectangle((x0 - 3, top - 8, x1 + 3, top), fill=base, outline=dark)
            d.line((x0 - 3, top - 8, x1 + 3, top - 8), fill=light)
        else:
            self.gable(x0 - 3, x1 + 3, top, (x1 - x0) // 6)
        if r['tower']:
            # The drum tower over the door that licensed a playhouse. Painted
            # after the roof, because it stands above the roofline.
            tx = (x0 + x1) // 2
            ty = top - ((x1 - x0) // 6 if not r['parapet'] else 8) - 4
            d.rectangle((tx - 10, ty - 24, tx + 10, ty), fill=TIMBER[2], outline=OUTLINE)
            d.line((tx - 10, ty - 24, tx + 10, ty - 24), fill=TIMBER[3])
            for sy in range(ty - 20, ty - 4, 5):
                d.line((tx - 9, sy, tx + 9, sy), fill=TIMBER[1])
            d.polygon([(tx - 13, ty - 24), (tx, ty - 34), (tx + 13, ty - 24)],
                      fill=self.roof[2], outline=self.roof[0])

    def render(self):
        form = self.r['form']
        if form == 'ring':
            self.ring()
        elif form == 'open-stage':
            self.open_stage()
        elif form == 'front-house':
            self.front_house()
        else:
            self.colonnade()
        # Side and back faces get a plainer treatment, as the churches do.
        if self.facing in ('east', 'west'):
            self.door_x = corner_door(self, self.ground) + DOOR_W // 2
        elif self.facing == 'north':
            self.d.rectangle((self.w // 2 - 7, 4, self.w // 2 + 7, 7), fill=self.p['foundation'][1])
        self.d.line((5, self.ground + 1, self.w - 8, self.ground + 1), fill=(30, 34, 26, 155))
        return self.im


def expand(name, base):
    """One recipe becomes size x look variants, as the religious recipes do."""
    scales = base.get('scales') or {'medium': {}}
    looks = base.get('looks') or [{}]
    out = {}
    for scale, sv in scales.items():
        for i, look in enumerate(looks):
            # Every size for the first look; the rest are style variants and
            # only need the middle size. The atlas is one page and these are
            # the largest sprites in it.
            if i and scale != 'medium':
                continue
            r = {k: v for k, v in base.items() if k not in ('scales', 'looks')}
            r.update(look)
            r.update(sv)
            # A look that names itself keeps its name: the scale supplies the
            # size, the look supplies the style, and the style is what a
            # reader is choosing between.
            if look.get('label'):
                r['label'] = look['label'] if scale == 'medium' else \
                    f"{look['label']} ({scale})"
            out[f'{name}-{scale}-{i}'] = r
    return out


def theatre_recipes(root, source):
    import json
    kit = json.loads((root / 'src/content/graphics/theatres.json').read_text())
    source['materials'].update(kit.get('materials', {}))
    out = {}
    for base_name, base in kit['buildings'].items():
        for name, r in expand(base_name, base).items():
            fw, fh = (max(3, min(16, int(v))) for v in r['footprint'])
            r = {**r, 'footprint': [fw, fh]}
            form = r['form']
            if form == 'ring':
                height = r['tiers'] * r['tierHeight'] + 54
            elif form == 'open-stage':
                height = r['plinth'] + r['pillarHeight'] + r['roofRise'] + 20
            elif form == 'front-house':
                height = r['wallHeight'] + (34 if r['tower'] else 0) + \
                    max(r['signHeight'], 20)
            else:
                height = r['podiumHeight'] + r['wallHeight'] + 26 + \
                    (fw * 16) // 5 + (26 if r['storeys'] > 1 else 0)
            out[f'theatre-{name}'] = {
                **r, 'canvas': [fw * 16 + 24, height + 44], 'height': height,
                'roof': 'gable', 'opening': 'door', 'attachments': [],
                'theatre': True, 'recipe': base_name,
            }
    return out
