"""Baths and civic halls. The masonry, columns, windows, doors and sculpture
are the theatre painter's; only the forms are new, so a hammam and an opera
house are cut from the same stone by the same hand.

Bath forms: a domed block for a hammam or a thermae, a vaulted hall with a
clerestory, a timber bath-house with a chimney. Civic forms: an arcaded hall
with an optional belfry, a portal front for a madrasa or a lodge, and a plain
long hall for a union hall or an age-set house.

Recipes live in src/content/graphics/halls.json.
"""
import math
import random
from PIL import Image, ImageDraw
from art.buildings import ROOFS, DOOR_W, corner_door
from art.theatres import TheatreBuilding, expand

OUTLINE = '#2f2a22'
TIMBER = ['#3a2c1d', '#5e4529', '#8a6538', '#b38a4f', '#d6b174']
CLOTH = ['#8d2f2c', '#b4453a', '#3d5a7a', '#5b7da2', '#9a7a2c', '#c6a442']


# The world is drawn three-quarter from above, as the houses are: a roof is a
# plane receding upward, and anything round has an elliptical plan rather than
# a straight base. FORESHORTEN is how much of a circle's diameter its depth
# reads as on screen.
FORESHORTEN = 0.46


class HallBuilding(TheatreBuilding):
    # --- projection -------------------------------------------------------
    def plan_half(self, dx, rx):
        """Half-depth of an elliptical plan at a given distance from centre."""
        t = 1 - (dx / rx) ** 2
        return int(rx * FORESHORTEN * math.sqrt(max(0.0, t)))

    # --- light -------------------------------------------------------------
    # One sun for every hall in this file, high and over the left shoulder.
    SUN = (-0.58, -0.55, 0.60)

    def lambert(self, nx, ny, steps, ambient=0.24):
        """Ramp index for a unit surface normal. Curved surfaces get their
        tone from this rather than from a diagonal wipe across the sprite,
        which is what made the domes read as flat discs."""
        nz2 = 1.0 - nx * nx - ny * ny
        if nz2 < 0:
            # Past the limb: the surface has turned away from the viewer, so
            # flatten the normal into the picture plane rather than give up.
            k = math.hypot(nx, ny)
            nx, ny, nz2 = nx / k, ny / k, 0.0
        lx, ly, lz = self.SUN
        lit = nx * lx + ny * ly + math.sqrt(nz2) * lz
        # Map the whole -1..1 range onto the ramp rather than clamping the
        # dark half to zero: a shell needs a shadow side, not just a duller
        # version of the lit one.
        # Stretch the useful part of the cosine across the whole ramp. A
        # straight 0..1 map spends most of its steps on the lit half and the
        # shell comes out one flat mid-tone.
        v = (lit - 0.10) / 0.90 + (ambient - 0.24) * 0.5
        return max(0, min(steps - 1, int(max(0.0, v) * steps)))

    def glow(self, cx, cy, radius, tint=(255, 150, 60)):
        """Warm light spilling from a fire onto whatever stands beside it."""
        overlay = Image.new('RGBA', self.im.size, (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        for i in range(4, 0, -1):
            r = radius * i // 4
            od.ellipse((cx - r, cy - r * 3 // 4, cx + r, cy + r * 3 // 4),
                       fill=(*tint, 12))
        # Only light what is there: composited raw it would haze the empty
        # corners of the sprite and show as a box in the atlas.
        from PIL import ImageChops
        overlay.putalpha(ImageChops.multiply(overlay.getchannel('A'),
                                             self.im.getchannel('A')))
        self.im.alpha_composite(overlay)
        self.d = ImageDraw.Draw(self.im)

    def plan_disc(self, cx, cy, rx, tones, rim=None, speckle=0):
        """A flat circular surface seen from above: the roof of a drum, the
        floor of a pit. It faces the sky, so it is near enough evenly lit —
        only the far rim falls off, where the ground beyond bounces nothing
        back into it."""
        d = self.d
        ry = rx * FORESHORTEN
        top = len(tones) - 1
        for y in range(int(cy - ry), int(cy + ry) + 1):
            dy = (y - cy) / ry
            half = int(rx * math.sqrt(max(0.0, 1 - dy * dy)))
            for x in range(cx - half, cx + half + 1):
                edge = max(abs(dy), abs(x - cx) / rx)
                tone = tones[top - 1]
                if edge > 0.93:
                    tone = tones[max(0, top - 3)]
                elif edge > 0.8:
                    tone = tones[max(0, top - 2)]
                elif dy < -0.3 and x < cx:
                    tone = tones[top]
                d.point((x, y), fill=tone)
        if speckle:
            rng = random.Random(speckle)
            for _ in range(int(rx * 1.6)):
                a = rng.random() * 2 * math.pi
                q = math.sqrt(rng.random()) * 0.88
                d.point((int(cx + rx * q * math.cos(a)),
                         int(cy + ry * q * math.sin(a))),
                        fill=tones[max(0, top - 2 - rng.randrange(2))])
        if rim:
            d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), outline=rim)

    def drum(self, cx, base_y, rx, height, tones, courses=0):
        """A cylinder: the near half of its wall, bounded above and below by
        the ellipse of its plan, so it reads as round rather than as a box."""
        d = self.d
        steps = len(tones)
        for x in range(cx - rx, cx + rx + 1):
            half = self.plan_half(x - cx, rx)
            nx = (x - cx) / rx
            tone = tones[self.lambert(nx, 0.0, steps)]
            d.line((x, base_y - height - half, x, base_y + half), fill=tone)
            # The foot of a wall never gets the sky: a band of bounce shadow
            # is what plants the drum in the ground.
            d.line((x, base_y + half - 4, x, base_y + half),
                   fill=tones[max(0, self.lambert(nx, 0.0, steps) - 2)])
        if courses:
            for cy in range(base_y - height + courses, base_y, courses):
                for x in range(cx - rx + 1, cx + rx):
                    half = self.plan_half(x - cx, rx)
                    lit = self.lambert((x - cx) / rx, 0.0, steps)
                    d.point((x, cy + half), fill=tones[max(0, lit - 2)])
                    d.point((x, cy + half + 1), fill=tones[min(steps - 1, lit + 1)])
        # The near rim, a touch darker so the cylinder closes.
        for x in range(cx - rx, cx + rx + 1):
            half = self.plan_half(x - cx, rx)
            d.point((x, base_y + half), fill=tones[0])

    def roof_plane(self, x0, x1, ridge_y, eave_y, pal, ridge_inset=None,
                   hip=True):
        """A roof seen from above and in front: the ridge short and high at the
        back, the eaves wide and low at the front, courses foreshortening
        between them. This is the projection the houses use."""
        d = self.d
        inset = ridge_inset if ridge_inset is not None else (x1 - x0) // 5
        depth = max(1, eave_y - ridge_y)
        rows = max(1, depth // 4)
        for i in range(rows):
            y = ridge_y + i * 4
            t = i / max(1, rows - 1)
            lx = int(x0 + inset * (1 - t)) if hip else x0
            rx = int(x1 - inset * (1 - t)) if hip else x1
            for cx0 in range(lx, rx, 5):
                tone = pal[3] if self.rng.random() < 0.28 else pal[2]
                d.rectangle((cx0, y, min(rx, cx0 + 3), y + 3), fill=tone)
                d.line((cx0, y, min(rx, cx0 + 2), y), fill=pal[4] if len(pal) > 4 else pal[3])
                d.point((cx0, y + 3), fill=pal[0])
            d.line((lx, y, lx, y + 3), fill=pal[1])
            d.line((rx, y, rx, y + 3), fill=pal[0])
        d.line((x0 + inset, ridge_y - 1, x1 - inset, ridge_y - 1),
               fill=pal[4] if len(pal) > 4 else pal[3])
        d.line((x0, eave_y, x1, eave_y), fill=pal[0])

    # --- parts -----------------------------------------------------------
    def dome(self, cx, spring, radius, lights=0, ribbed=False):
        """A hemisphere on a drum: lit from the upper left, with a band of
        shadow round the lower right and, where asked, the star-shaped
        rooflights a bath dome is pierced with."""
        d = self.d
        M, T = self.M, self.W
        # Drum under the dome.
        d.rectangle((cx - radius, spring, cx + radius, spring + 5), fill=T[4])
        d.line((cx - radius, spring, cx + radius, spring), fill=T[6])
        d.line((cx - radius, spring + 5, cx + radius, spring + 5), fill=T[1])
        # Shell, shaded across rather than only at the edge.
        for y in range(spring - radius, spring):
            dy = spring - y
            half = int(math.sqrt(max(0, radius * radius - dy * dy)))
            for px in range(cx - half, cx + half + 1):
                across = (px - (cx - half)) / max(1, 2 * half)
                lift = 1 - dy / radius
                tone = (M[8] if across < 0.16 and lift < 0.7 else
                        M[7] if across < 0.34 else
                        M[6] if across < 0.6 else
                        M[4] if across < 0.82 else M[3])
                d.point((px, y), fill=tone)
        if ribbed:
            for a in (0.25, 0.5, 0.75):
                for y in range(spring - radius, spring):
                    dy = spring - y
                    half = int(math.sqrt(max(0, radius * radius - dy * dy)))
                    px = int(cx - half + 2 * half * a)
                    d.point((px, y), fill=M[2])
        for i in range(lights):
            a = math.pi * (0.28 + i * 0.44 / max(1, lights - 1)) if lights > 1 else math.pi / 2
            lx = int(cx - radius * 0.55 * math.cos(a))
            ly = int(spring - radius * 0.55 * math.sin(a))
            d.point((lx, ly), fill='#f2e2a8')
            d.point((lx - 1, ly), fill='#c9b druk'[:7] if False else '#c9b478')
            d.point((lx + 1, ly), fill='#8a7a4c')
            d.point((lx, ly - 1), fill='#c9b478')
        # Finial.
        d.line((cx, spring - radius - 4, cx, spring - radius), fill=M[6])
        d.ellipse((cx - 2, spring - radius - 7, cx + 2, spring - radius - 3),
                  fill=M[7], outline=M[2])

    def chimney(self, x, foot, height, width=7, smoke=False):
        d = self.d
        M = self.M
        d.rectangle((x, foot - height, x + width, foot), fill=M[4])
        d.line((x, foot - height, x, foot), fill=M[7])
        d.line((x + width, foot - height, x + width, foot), fill=M[2])
        for by in range(foot - height + 4, foot, 9):
            d.line((x, by, x + width, by), fill=M[2])
            d.line((x, by + 1, x + width, by + 1), fill=M[6])
        d.rectangle((x - 2, foot - height - 4, x + width + 2, foot - height),
                    fill=M[6], outline=M[2])
        d.line((x - 2, foot - height - 4, x + width + 2, foot - height - 4), fill=M[8])
        d.rectangle((x + 1, foot - height - 2, x + width - 1, foot - height),
                    fill='#241f18')

    def arch(self, x0, x1, spring, foot, recess='#232a36', keystone=True,
             max_rise=None):
        """An arched opening with voussoirs and a keystone: the unit both the
        arcade and the portal are built out of."""
        d = self.d
        M = self.M
        cx = (x0 + x1) // 2
        r = (x1 - x0) // 2
        if max_rise:
            r = min(r, max_rise)
        d.rectangle((x0, spring, x1, foot), fill=recess)
        d.pieslice((cx - r, spring - r, cx + r, spring + r), 180, 360, fill=recess)
        # Where the head is flatter than a semicircle, the spandrels are wall.
        if r < (x1 - x0) // 2:
            d.rectangle((x0, spring - 1, cx - r, spring + 1), fill=recess)
            d.rectangle((cx + r, spring - 1, x1, spring + 1), fill=recess)
        # Voussoirs round the head.
        for i in range(13):
            a = math.pi * i / 12
            vx = cx - (r + 2) * math.cos(a)
            vy = spring - (r + 2) * math.sin(a)
            tone = M[8] if a < 1.1 else M[6] if a < 2.1 else M[4]
            d.ellipse((vx - 1.5, vy - 1.5, vx + 1.5, vy + 1.5), fill=tone)
        if keystone:
            d.rectangle((cx - 2, spring - r - 4, cx + 2, spring - r + 2),
                        fill=M[7], outline=M[2])
            d.line((cx - 2, spring - r - 4, cx + 2, spring - r - 4), fill=M[8])
        # Jambs.
        d.line((x0 - 1, spring, x0 - 1, foot), fill=M[7])
        d.line((x1 + 1, spring, x1 + 1, foot), fill=M[2])
        # Shadow inside the head.
        self.shade([(x0, spring - r, x1, spring - r // 2, 60)])

    def tiles(self, x0, x1, ridge, eave, pal=None):
        """A tiled slope with per-tile variation and a lit ridge."""
        d = self.d
        pal = pal or self.roof
        rows = max(1, (eave - ridge) // 4)
        for i in range(rows):
            y = ridge + i * 4
            t = i / max(1, rows - 1)
            run = int((x1 - x0) / 2 * (0.55 + 0.45 * t))
            cx = (x0 + x1) // 2
            for tx in range(cx - run, cx + run, 7):
                tone = pal[3] if self.rng.random() < 0.3 else pal[2]
                d.rectangle((tx, y, min(cx + run, tx + 5), y + 2), fill=tone)
                d.line((tx, y, min(cx + run, tx + 5), y), fill=pal[3])
            d.line((cx - run, y + 3, cx + run, y + 3), fill=pal[0])
        d.line((x0 + (x1 - x0) // 4, ridge, x1 - (x1 - x0) // 4, ridge), fill=pal[3])

    # --- bath forms -------------------------------------------------------
    def domed(self):
        r = self.r
        d = self.d
        M, T = self.M, self.W
        w = self.w
        x0, x1 = 8, w - 8
        foot = self.ground
        top = foot - r['wallHeight']
        self.ashlar(x0, top, x1, foot)
        self.ashlar(x1 - 14, top, x1, foot, shade=True)
        # A run of domes over the hot rooms.
        n = r['domes']
        radius = min((x1 - x0) // (2 * n) - 2, r['domeRadius'])
        for i in range(n):
            cx = int(x0 + (x1 - x0) * (i + 0.5) / n)
            self.dome(cx, top, radius if i == n // 2 else radius * 3 // 4,
                      lights=r['domeLights'], ribbed=r['ribbed'])
        # Parapet across the front, hiding the springing.
        d.rectangle((x0 - 3, top - 4, x1 + 3, top + 2), fill=M[6])
        d.line((x0 - 3, top - 4, x1 + 3, top - 4), fill=M[8])
        d.line((x0 - 3, top + 2, x1 + 3, top + 2), fill=M[2])
        self.cast(x0, top + 3, x1, top + 7, 72, feather=False)
        if r['arcade']:
            span = (x1 - x0 - 16) // 3
            for i in range(3):
                mid = x0 + 8 + i * span + span // 2
                self.arch(mid - 11, mid + 11, foot - 18, foot - 3, max_rise=11)
            # Sill band under the arcade, so it reads as an opening in a wall.
            d.rectangle((x0 - 2, foot - 2, x1 + 2, foot + 1), fill=M[6])
            d.line((x0 - 2, foot - 2, x1 + 2, foot - 2), fill=M[8])
        else:
            for wx in range(x0 + 12, x1 - 18, 22):
                self.window(wx, foot - 32, wx + 11, foot - 12, 'segmental')
        self.doorway((x0 + x1) // 2, foot, 15, 28, arched=True)
        if r['chimneyHeight']:
            self.chimney(x1 - 18, top + 4, r['chimneyHeight'])
        self.occlude(x0 - 2, foot, x1 + 2, foot + 2, 92)

    def vaulted(self):
        """A barrel-vaulted hall: a tall arched centre with a clerestory and
        lower wings, which is what a Roman bath front looks like."""
        r = self.r
        d = self.d
        M = self.M
        w = self.w
        x0, x1 = 6, w - 6
        foot = self.ground
        top = foot - r['wallHeight']
        wing_h = r['wallHeight'] * 3 // 5
        cx = (x0 + x1) // 2
        half = (x1 - x0) // 4
        # Wings first, then the centre block over them.
        for wx0, wx1 in ((x0, cx - half), (cx + half, x1)):
            self.ashlar(wx0, foot - wing_h, wx1, foot, shade=wx0 > cx)
            d.rectangle((wx0 - 2, foot - wing_h - 5, wx1 + 2, foot - wing_h),
                        fill=M[6])
            d.line((wx0 - 2, foot - wing_h - 5, wx1 + 2, foot - wing_h - 5), fill=M[8])
            for wx in range(wx0 + 6, wx1 - 10, 18):
                self.window(wx, foot - wing_h + 12, wx + 9, foot - 16, 'flat')
        self.ashlar(cx - half, top, cx + half, foot)
        # The clerestory: one wide window high in the block, drawn with the
        # same part as every other window so its glazing reads as glass.
        self.window(cx - half + 12, top + 12, cx + half - 12, top + 42,
                    'segmental')
        # Vault head: a shallow lead roof, not a hemisphere.
        rise = half // 2 + 4
        for i, ry in enumerate(range(top - rise, top + 2)):
            t = (ry - (top - rise)) / max(1, rise)
            run = int((half + 3) * math.sqrt(max(0.0, 1 - (1 - t) ** 2)))
            for px in range(cx - run, cx + run + 1):
                across = (px - (cx - run)) / max(1, 2 * run)
                d.point((px, ry), fill=(self.roof[3] if across < 0.3
                                        else self.roof[2] if across < 0.7
                                        else self.roof[1]))
        d.line((cx - 6, top - rise, cx + 6, top - rise), fill=self.roof[3])
        d.rectangle((cx - half - 4, top, cx + half + 4, top + 5), fill=M[6])
        d.line((cx - half - 4, top, cx + half + 4, top), fill=M[8])
        self.doorway(cx, foot, 17, 32, arched=True)
        if r['chimneyHeight']:
            self.chimney(x0 + 6, foot - wing_h, r['chimneyHeight'])
        self.occlude(x0 - 2, foot, x1 + 2, foot + 2, 92)

    def bath_shed(self):
        """A timber bath house: boarded walls, a deep tiled roof, a curtain
        over the door and the boiler chimney behind."""
        r = self.r
        d = self.d
        M = self.M
        w = self.w
        x0, x1 = 8, w - 8
        foot = self.ground
        top = foot - r['wallHeight']
        self.boards(x0, top, x1, foot)
        self.boards(x1 - 12, top, x1, foot, shade=True)
        if r['chimneyHeight']:
            self.chimney(x1 - 20, top + 6, r['chimneyHeight'])
        # Roof: a deep hip with a lifted ridge vent.
        self.hipped(x0, x1, top, r['roofRise'], overhang=r['overhang'])
        if r['ridgeVent']:
            cx = (x0 + x1) // 2
            d.rectangle((cx - 12, top - r['roofRise'] - 8, cx + 12,
                         top - r['roofRise']), fill=TIMBER[1], outline=OUTLINE)
            d.line((cx - 12, top - r['roofRise'] - 8, cx + 12,
                    top - r['roofRise'] - 8), fill=TIMBER[3])
            d.polygon([(cx - 16, top - r['roofRise'] - 8), (cx, top - r['roofRise'] - 16),
                       (cx + 16, top - r['roofRise'] - 8)],
                      fill=self.roof[2], outline=self.roof[0])
        cx = (x0 + x1) // 2
        for wx in (x0 + 10, x1 - 22):
            d.rectangle((wx, foot - 34, wx + 12, foot - 16), fill='#2b3547')
            for gx in range(wx + 2, wx + 12, 3):
                d.line((gx, foot - 34, gx, foot - 16), fill=TIMBER[1])
            d.rectangle((wx - 1, foot - 35, wx + 13, foot - 34), fill=TIMBER[3])
        self.doorway(cx, foot, 15, 26)
        if r['curtain']:
            # A split curtain hung over the door, the house's own mark.
            for i, bx in enumerate(range(cx - 14, cx + 13, 9)):
                colour = CLOTH[2] if i % 2 else CLOTH[3]
                d.rectangle((bx, foot - 30, bx + 8, foot - 16), fill=colour,
                            outline=OUTLINE)
                d.line((bx, foot - 30, bx + 8, foot - 30), fill=TIMBER[4])
            d.rectangle((cx - 16, foot - 32, cx + 16, foot - 30), fill=TIMBER[1])
        self.occlude(x0 - 2, foot, x1 + 2, foot + 2, 92)

    # --- civic forms ------------------------------------------------------
    def arcaded(self):
        """A hall over an open arcade, with a belfry where the recipe asks:
        the market hall and the town hall of half of Europe."""
        r = self.r
        d = self.d
        M = self.M
        w = self.w
        x0, x1 = 6, w - 6
        foot = self.ground
        top = foot - r['wallHeight']
        arcade_h = r['arcadeHeight']
        self.ashlar(x0, top, x1, foot)
        self.ashlar(x1 - 12, top, x1, foot, shade=True)
        # The arcade at ground level.
        bays = r['bays']
        span = (x1 - x0 - 8) // bays
        for i in range(bays):
            mid = x0 + 4 + i * span + span // 2
            reach = min(span // 2 - 3, arcade_h // 2 - 2)
            self.arch(mid - reach, mid + reach, foot - arcade_h + reach,
                      foot - 3, max_rise=reach)
        # A string course over the arcade, then the hall's windows.
        d.rectangle((x0 - 2, foot - arcade_h - 8, x1 + 2, foot - arcade_h - 4),
                    fill=M[6])
        d.line((x0 - 2, foot - arcade_h - 8, x1 + 2, foot - arcade_h - 8), fill=M[8])
        d.line((x0 - 2, foot - arcade_h - 4, x1 + 2, foot - arcade_h - 4), fill=M[2])
        self.cast(x0, foot - arcade_h - 3, x1, foot - arcade_h, 66, feather=False)
        for i in range(bays):
            wx = x0 + 4 + i * span + span // 2 - 6
            self.window(wx, top + 14, wx + 12, foot - arcade_h - 14,
                        r['windowHead'])
        # Parapet or a tiled roof.
        if r['parapet']:
            d.rectangle((x0 - 3, top - 7, x1 + 3, top), fill=M[6])
            d.line((x0 - 3, top - 7, x1 + 3, top - 7), fill=M[8])
            for cx0 in range(x0, x1 - 4, 10):
                d.rectangle((cx0, top - 12, cx0 + 5, top - 7), fill=M[5])
                d.line((cx0, top - 12, cx0 + 5, top - 12), fill=M[7])
        else:
            self.tiles(x0 - 4, x1 + 4, top - r['roofRise'], top)
            d.rectangle((x0 - 4, top - 2, x1 + 4, top + 2), fill=M[6])
            d.line((x0 - 4, top - 2, x1 + 4, top - 2), fill=M[8])
        if r['belfry'] != 'none':
            cx = (x0 + x1) // 2
            bh = r['belfryHeight']
            base = top - (0 if r['parapet'] else r['roofRise'])
            self.ashlar(cx - 12, base - bh, cx + 12, base + 6)
            self.ashlar(cx + 4, base - bh, cx + 12, base + 6, shade=True)
            self.arch(cx - 7, cx + 7, base - bh + 22, base - bh + 30,
                      recess='#1d2330', keystone=False)
            if r['clock']:
                cy = base - bh + 12
                d.ellipse((cx - 8, cy - 8, cx + 8, cy + 8), fill=M[7], outline=M[2])
                d.ellipse((cx - 6, cy - 6, cx + 6, cy + 6), fill='#2a2620')
                d.line((cx, cy, cx, cy - 4), fill=M[8])
                d.line((cx, cy, cx + 3, cy + 1), fill=M[6])
            d.rectangle((cx - 15, base - bh - 5, cx + 15, base - bh), fill=M[6])
            d.line((cx - 15, base - bh - 5, cx + 15, base - bh - 5), fill=M[8])
            if r['belfry'] == 'lantern':
                d.rectangle((cx - 8, base - bh - 16, cx + 8, base - bh - 5),
                            fill=M[5], outline=M[2])
                for lx in range(cx - 6, cx + 7, 5):
                    d.line((lx, base - bh - 14, lx, base - bh - 7), fill=M[2])
                d.polygon([(cx - 11, base - bh - 16), (cx, base - bh - 30),
                           (cx + 11, base - bh - 16)],
                          fill=self.roof[2], outline=self.roof[0])
            else:
                d.polygon([(cx - 16, base - bh - 5), (cx, base - bh - 30),
                           (cx + 16, base - bh - 5)],
                          fill=self.roof[2], outline=self.roof[0])
                for i, ry in enumerate(range(base - bh - 27, base - bh - 6, 4)):
                    t = (ry - (base - bh - 30)) / 25
                    run = int(16 * t)
                    d.line((cx - run, ry, cx + run, ry),
                           fill=self.roof[3] if i % 2 else self.roof[1])
        self.occlude(x0 - 2, foot, x1 + 2, foot + 2, 92)

    def portal(self):
        """A great arched recess between two lower bays: the front of a
        madrasa, a caravanserai or a lodge."""
        r = self.r
        d = self.d
        M = self.M
        w = self.w
        x0, x1 = 6, w - 6
        foot = self.ground
        top = foot - r['wallHeight']
        cx = (x0 + x1) // 2
        half = r['portalWidth'] // 2
        wing_h = r['wallHeight'] * 5 // 8
        for wx0, wx1 in ((x0, cx - half - 2), (cx + half + 2, x1)):
            self.ashlar(wx0, foot - wing_h, wx1, foot, shade=wx0 > cx)
            d.rectangle((wx0 - 2, foot - wing_h - 5, wx1 + 2, foot - wing_h), fill=M[6])
            d.line((wx0 - 2, foot - wing_h - 5, wx1 + 2, foot - wing_h - 5), fill=M[8])
            for wx in range(wx0 + 6, wx1 - 10, 16):
                self.arch(wx, wx + 10, foot - wing_h + 24, foot - 10,
                          recess='#232a36', keystone=False)
        # The portal block.
        self.ashlar(cx - half - 2, top, cx + half + 2, foot)
        self.shade([(cx + half - 6, top, cx + half + 2, foot, 44)])
        # Recess: a pointed head where the recipe asks, otherwise round.
        rec_top = top + 14
        if r['pointed']:
            d.polygon([(cx - half + 4, foot - 2), (cx - half + 4, rec_top + 26),
                       (cx, rec_top), (cx + half - 4, rec_top + 26),
                       (cx + half - 4, foot - 2)], fill='#1e2632')
            d.line((cx - half + 4, rec_top + 26, cx, rec_top), fill=M[7])
            d.line((cx, rec_top, cx + half - 4, rec_top + 26), fill=M[3])
        else:
            self.arch(cx - half + 4, cx + half - 4, rec_top + 22, foot - 2,
                      recess='#1e2632')
        self.shade([(cx - half + 4, rec_top, cx + half - 4, rec_top + 30, 70)])
        # A band of tilework or inscription round the portal.
        if r['band']:
            for by, tone in ((top + 4, M[6]), (top + 10, M[5])):
                d.rectangle((cx - half - 2, by, cx + half + 2, by + 4), fill=tone)
                for gx in range(cx - half, cx + half, 6):
                    d.rectangle((gx, by + 1, gx + 3, by + 3), fill=M[2] if tone is M[6] else M[7])
        d.rectangle((cx - half - 5, top - 6, cx + half + 5, top), fill=M[6])
        d.line((cx - half - 5, top - 6, cx + half + 5, top - 6), fill=M[8])
        self.doorway(cx, foot, 15, 26, arched=not r['pointed'])
        for i in range(r['minarets']):
            mx = cx - half - 6 if i == 0 else cx + half + 6
            mh = r['minaretHeight']
            d.rectangle((mx - 4, top - mh, mx + 4, top), fill=M[5])
            d.line((mx - 4, top - mh, mx - 4, top), fill=M[7])
            d.line((mx + 4, top - mh, mx + 4, top), fill=M[2])
            d.rectangle((mx - 6, top - mh - 4, mx + 6, top - mh), fill=M[6], outline=M[2])
            d.polygon([(mx - 6, top - mh - 4), (mx, top - mh - 16), (mx + 6, top - mh - 4)],
                      fill=self.roof[2], outline=self.roof[0])
        self.occlude(x0 - 2, foot, x1 + 2, foot + 2, 92)

    def long_hall(self):
        """A plain hall with big doors: a union hall, an age-set house, a
        parish room. Its dignity is in the roof and the doors, not in order."""
        r = self.r
        d = self.d
        M = self.M
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
        for wx in range(x0 + 10, x1 - 16, 20):
            self.window(wx, top + 14, wx + 10, foot - 22, r['windowHead'])
        self.doorway((x0 + x1) // 2, foot, 19, 30, arched=r['arched'])
        if r['porch']:
            cx = (x0 + x1) // 2
            d.rectangle((cx - 18, foot - 38, cx + 18, foot - 32), fill=M[6])
            d.line((cx - 18, foot - 38, cx + 18, foot - 38), fill=M[8])
            d.line((cx - 18, foot - 32, cx + 18, foot - 32), fill=M[2])
            for px in (cx - 17, cx + 13):
                self.column(px, foot - 34, foot - 2, width=5, order='doric')
            self.cast(cx - 16, foot - 31, cx + 16, foot - 27, 70, feather=False)
        if r['gableFront']:
            self.gable(x0 - 4, x1 + 4, top, r['roofRise'])
            d.rectangle((x0 - 4, top - 2, x1 + 4, top + 3), fill=M[6])
            d.line((x0 - 4, top - 2, x1 + 4, top - 2), fill=M[8])
            if r['oculus']:
                cx = (x0 + x1) // 2
                cy = top - r['roofRise'] // 2
                d.ellipse((cx - 7, cy - 7, cx + 7, cy + 7), fill=M[6], outline=M[2])
                d.ellipse((cx - 5, cy - 5, cx + 5, cy + 5), fill='#243043')
                d.line((cx - 5, cy, cx + 5, cy), fill=M[5])
                d.line((cx, cy - 5, cx, cy + 5), fill=M[5])
        else:
            self.tiles(x0 - 4, x1 + 4, top - r['roofRise'], top)
            d.rectangle((x0 - 4, top - 2, x1 + 4, top + 2), fill=M[6])
            d.line((x0 - 4, top - 2, x1 + 4, top - 2), fill=M[8])
        if r['flagpole']:
            fx = x0 + 10
            d.line((fx, top - r['roofRise'] - 2, fx, top - r['roofRise'] - 26), fill=M[4])
            d.polygon([(fx + 1, top - r['roofRise'] - 26), (fx + 15, top - r['roofRise'] - 21),
                       (fx + 1, top - r['roofRise'] - 16)], fill=CLOTH[0], outline=OUTLINE)
        self.occlude(x0 - 2, foot, x1 + 2, foot + 2, 92)


    # --- forms outside the masonry tradition ------------------------------
    def sweat_lodge(self):
        """A low dome on a bent frame, seen three-quarter from above. The
        shell is lit as a sphere, not wiped across, and the poles it is built
        on show at the crown where the cover stops. The fire that heats the
        stones is outside the door, because that is what the lodge is for."""
        r = self.r
        d = self.d
        M = self.M
        w = self.w
        cx = w // 2
        rx = r['domeRadius']
        foot = self.ground - int(rx * FORESHORTEN)
        rise = int(rx * 0.72)
        skin = r['skin']
        ramps = {
            'hide': ['#1d150d', '#2c2015', '#3d2d1e', '#513c28', '#6b5135',
                     '#876746', '#a3835c', '#bb9d74'],
            'earth': ['#1b140c', '#2a2013', '#3a2d1b', '#4d3c25', '#645030',
                      '#7d653f', '#967c52', '#ad9468'],
            'masonry': [M[0], M[1], M[2], M[3], M[5], M[6], M[7], M[8]],
        }
        T = ramps[skin]
        steps = len(T)
        # Cast shadow on the ground, thrown down and to the right.
        # The shell. Screen position maps straight onto a sphere normal, so
        # the terminator curves round the dome instead of running diagonally.
        for x in range(cx - rx, cx + rx + 1):
            nx = (x - cx) / rx
            top = foot - int(rise * math.sqrt(max(0.0, 1 - nx * nx)))
            half = self.plan_half(x - cx, rx)
            for y in range(top - half, foot + half + 1):
                ny = (y - foot) / rise
                i = self.lambert(nx, min(ny, 0.98), steps, ambient=0.2)
                if y > foot:
                    i = max(0, i - 2)
                d.point((x, y), fill=T[i])
        # Rim light along the top of the lit side: one pixel, and the dome
        # separates from whatever is behind it.
        for x in range(cx - rx + 2, cx + 4):
            nx = (x - cx) / rx
            top = foot - int(rise * math.sqrt(max(0.0, 1 - nx * nx)))
            top -= self.plan_half(x - cx, rx)
            d.point((x, top), fill=T[steps - 1])
        if skin == 'hide':
            # Bent saplings under the cover: a shadowed groove with a lit
            # ridge beside it, so the frame bulges rather than being striped.
            for a in (-0.72, -0.4, 0.4, 0.72):
                px = int(cx + rx * a)
                nx = (px - cx) / rx
                top = foot - int(rise * math.sqrt(max(0.0, 1 - nx * nx)))
                half = self.plan_half(px - cx, rx)
                for y in range(top - half, foot + half - 2):
                    ny = (y - foot) / rise
                    i = self.lambert(nx, min(ny, 0.98), steps, ambient=0.2)
                    d.point((px, y), fill=T[max(0, i - 1)])
        elif skin == 'masonry':
            for band in (0.3, 0.52, 0.72, 0.9):
                for x in range(cx - rx + 1, cx + rx):
                    nx = (x - cx) / rx
                    top = foot - int(rise * math.sqrt(max(0.0, 1 - nx * nx)))
                    half = self.plan_half(x - cx, rx)
                    y = int(top - half + (foot + half - (top - half)) * band)
                    ny = (y - foot) / rise
                    i = self.lambert(nx, min(ny, 0.98), steps, ambient=0.2)
                    d.point((x, y), fill=T[max(0, i - 2)])
                    d.point((x, y + 1), fill=T[min(steps - 1, i + 1)])
        crown = foot - rise
        # Smoke hole, and the pole ends crossing above it.
        d.ellipse((cx - 4, crown - 2, cx + 4, crown + 2), fill='#191309')
        d.arc((cx - 4, crown - 3, cx + 4, crown + 1), 180, 360, fill=T[steps - 2])
        if skin == 'hide':
            for dx_, dy_ in ((-5, -8), (0, -10), (5, -7)):
                d.line((cx + dx_ // 3, crown, cx + dx_, crown + dy_), fill=T[2])
                d.line((cx + dx_ // 3 + 1, crown, cx + dx_ + 1, crown + dy_),
                       fill=T[steps - 2])
        if r['smoke']:
            for i, sy in enumerate(range(crown - 16, crown - 36, -5)):
                d.point((cx + (i % 2) * 3 - 1, sy), fill='#5f5d56')
                d.point((cx + (i % 2) * 3, sy - 2), fill='#7d7a71')
        # Doorway: a low arched mouth on the near face, sunk into the shell
        # with a lit lintel over it. It is the one hard black in the sprite,
        # so it wants a clean silhouette.
        dw = max(5, r['doorWidth'] - 2)
        door_y = foot + self.plan_half(0, rx) - 2
        head = door_y - int(dw * 1.0)
        d.rectangle((cx - dw, head, cx + dw, door_y), fill='#100c07')
        d.pieslice((cx - dw, head - dw, cx + dw, head + dw), 180, 360,
                   fill='#100c07')
        # The inside of a hide lodge is not a void: the far wall catches a
        # little light coming in past the door.
        d.chord((cx - dw + 3, door_y - 9, cx + dw - 3, door_y + 1), 180, 360,
                fill='#241a11')
        for side in (-1, 1):
            px = cx + side * dw
            d.line((px, head, px, door_y), fill=T[1])
            d.line((px - side, head, px - side, door_y),
                   fill=T[4] if side < 0 else T[2])
        d.arc((cx - dw, head - dw, cx + dw, head + dw), 185, 355, fill=T[2])
        d.arc((cx - dw - 1, head - dw - 1, cx + dw + 1, head + dw - 1),
              195, 300, fill=T[steps - 2])
        if r['flap']:
            # The hide rolled up over the lintel, the way a door stands open.
            d.rectangle((cx - dw + 2, head - dw - 4, cx + dw - 2, head - dw + 1),
                        fill=T[4])
            d.line((cx - dw + 2, head - dw - 4, cx + dw - 2, head - dw - 4),
                   fill=T[steps - 2])
            d.line((cx - dw + 2, head - dw + 1, cx + dw - 2, head - dw + 1),
                   fill=T[1])
        # A slab threshold, trodden flat.
        d.ellipse((cx - dw - 3, door_y - 1, cx + dw + 3, door_y + 4),
                  fill='#7d7669', outline='#4c463c')
        d.arc((cx - dw - 3, door_y - 2, cx + dw + 3, door_y + 3), 180, 360,
              fill='#99917f')
        # The fire pit and its ring of stones, on the ground beside the door.
        px0 = cx + rx + 12
        py0 = foot + 4
        self.plan_disc(px0, py0, 8, ['#140f0a', '#201a13', '#2e2720', '#3d352b',
                                     '#4c4338'])
        for i in range(9):
            a = 2 * math.pi * i / 9
            sx = int(px0 + 9 * math.cos(a))
            sy = int(py0 + 9 * FORESHORTEN * math.sin(a))
            d.ellipse((sx - 2, sy - 2, sx + 2, sy + 1),
                      fill='#8d8378' if i % 2 else '#6f6659', outline='#453f37')
            d.arc((sx - 2, sy - 3, sx + 2, sy), 180, 360, fill='#a79d90')
        if r['fire']:
            for lx in (px0 - 5, px0 + 4):
                d.line((lx, py0 - 1, lx + (1 if lx < px0 else -1), py0 - 9),
                       fill='#6b4a2e')
            d.polygon([(px0 - 4, py0 - 1), (px0 - 1, py0 - 17), (px0 + 4, py0 - 1)],
                      fill='#c1521f')
            d.polygon([(px0 - 2, py0 - 1), (px0, py0 - 13), (px0 + 3, py0 - 1)],
                      fill='#e8913a')
            d.polygon([(px0 - 1, py0 - 1), (px0 + 1, py0 - 8), (px0 + 2, py0 - 1)],
                      fill='#f7dc8b')
            self.glow(px0, py0 - 6, 22)
        self.occlude(cx - rx, foot + self.plan_half(0, rx) - 1,
                     cx + rx, foot + self.plan_half(0, rx) + 1, 88)

    def kiva(self):
        """A round chamber sunk into the ground. Three-quarter from above the
        earth roof is a disc, the masonry drum stands a little proud of it,
        and the ladder comes up out of the hatch."""
        r = self.r
        d = self.d
        M = self.M
        w = self.w
        cx = w // 2
        rx = r['drumRadius']
        foot = self.ground - int(rx * FORESHORTEN)
        rise = r['drumRise']
        # Sandstone rubble, not the dressed trim ramp: a kiva is field stone
        # and the pale trim read as whitewash.
        stone = ['#3b3832', '#4d4941', '#615c52', '#767065', '#8c8577',
                 '#a29a8b', '#b8afa0', '#cdc4b4']
        earth = ['#33281a', '#443624', '#56452d', '#685437', '#7a6342',
                 '#8c734d', '#9d8259']
        self.drum(cx, foot, rx, rise, stone, courses=5)
        # Boulders set into the face of the drum, as a dry wall is built.
        rng = random.Random(r['seed'] + 4)
        for _ in range(rx // 5):
            bx = cx + rng.randrange(-rx + 4, rx - 4)
            half = self.plan_half(bx - cx, rx)
            by = rng.randrange(foot - rise - half + 4, foot + half - 5)
            lit = self.lambert((bx - cx) / rx, 0.0, len(stone))
            d.ellipse((bx - 3, by - 2, bx + 3, by + 2),
                      fill=stone[max(0, lit - 1)])
            d.arc((bx - 3, by - 3, bx + 3, by + 1), 200, 340,
                  fill=stone[min(len(stone) - 1, lit + 1)])
        # The roof: packed earth on beams, a disc set on top of the drum.
        self.plan_disc(cx, foot - rise, rx - 2, earth, rim=stone[1],
                       speckle=r['seed'] + 9)
        # Beam ends poking out under the roof lip on the near side: the
        # roof is carried on timber, and this is the only place it shows.
        for i in range(7):
            a = math.pi * (0.1 + i * 0.13)
            bx = int(cx + (rx - 1) * math.cos(a))
            by = int(foot - rise + (rx - 1) * FORESHORTEN * math.sin(a)) + 1
            d.rectangle((bx - 1, by, bx + 1, by + 2), fill='#4a351f')
            d.point((bx, by), fill='#8a6538')
        # Hatch and ladder, at the near side of the roof disc.
        hy = foot - rise + int(rx * FORESHORTEN * 0.3)
        d.ellipse((cx - 10, hy - 5, cx + 10, hy + 5), fill='#120e09')
        d.arc((cx - 10, hy - 6, cx + 10, hy + 4), 180, 360, fill=earth[1])
        d.arc((cx - 10, hy - 4, cx + 10, hy + 6), 0, 180, fill=earth[6])
        # A timber curb round the hatch: the roof is a floor people walk on.
        for ox in (-11, 10):
            d.rectangle((cx + ox - 1, hy - 4, cx + ox + 1, hy + 3), fill='#6b4a2e')
            d.line((cx + ox - 1, hy - 4, cx + ox + 1, hy - 4), fill='#a9814a')
        rail = 34
        for lx in (cx - 5, cx + 4):
            d.line((lx, hy + 1, lx + 4, hy - rail), fill='#5e4529')
            d.line((lx + 1, hy + 1, lx + 5, hy - rail), fill='#8a6538')
            d.line((lx + 2, hy + 1, lx + 6, hy - rail), fill='#b38a4f')
            d.point((lx + 5, hy - rail - 1), fill='#d6b174')
        for i, ry in enumerate(range(hy - 4, hy - rail, -6)):
            off = int((hy - ry) * 4 / rail)
            d.rectangle((cx - 5 + off, ry - 1, cx + 6 + off, ry), fill='#8a6538')
            d.line((cx - 5 + off, ry - 1, cx + 6 + off, ry - 1), fill='#c19a5e')
            d.line((cx - 5 + off, ry + 1, cx + 6 + off, ry + 1), fill='#3f2f1c')
        if r['smoke']:
            for i, sy in enumerate(range(hy - 10, hy - 34, -6)):
                d.point((cx - 12 + (i % 2) * 3, sy), fill='#5f5d56')
                d.point((cx - 13 + (i % 2) * 3, sy - 2), fill='#7d7a71')
        if r['ventShaft']:
            vx = cx + rx - 4
            vh = rise + 6
            self.drum(vx, foot + 3, 6, vh, stone[:6])
            self.plan_disc(vx, foot + 3 - vh, 6, stone[:6], rim=stone[0])
            self.shade([(vx - 7, foot + 3 - vh, vx - 4, foot + 6, 60)])
        self.occlude(cx - rx, foot + self.plan_half(0, rx) - 2,
                     cx + rx, foot + self.plan_half(0, rx) + 1, 88)

    def open_shelter(self):
        """Posts and a thick roof, no walls. What has to read at a glance is
        the shade under it, so the posts are few and heavy and everything
        between them is in shadow."""
        r = self.r
        d = self.d
        w = self.w
        x0, x1 = 10, w - 10
        foot = self.ground
        eave = foot - r['postHeight']
        depth = r['thatchDepth']
        ridge = eave - depth
        back = int(r['postHeight'] * 0.42)
        POST = ['#33251500'.replace('00',''), '#48331d', '#5d4325', '#74552f',
                '#8d6a3c', '#a5814c', '#bd9a60']
        pw = 9

        def post(px, top, bottom, dim=0):
            for ox in range(pw):
                i = self.lambert((ox - (pw - 1) / 2) / (pw / 2 + 0.5), 0.0,
                                 len(POST))
                d.line((px + ox, top, px + ox, bottom),
                       fill=POST[max(0, i - dim)])
            d.line((px, bottom - 2, px + pw - 1, bottom - 2), fill=POST[1])

        # Back rank first, so the front posts overlap it.
        n_back = max(1, r['posts'] // 2 - 1)
        span_b = (x1 - x0 - 40) // max(1, n_back)
        for i in range(n_back):
            post(x0 + 26 + i * span_b, eave + 4, foot - back, dim=2)
        # The shade the roof throws over the ground and the back posts.
        self.shade([(x0 + 4, eave + 2, x1 - 4, foot, 62)])
        n_front = max(2, min(4, r['posts'] - 2))
        span_f = (x1 - x0 - pw - 12) // (n_front - 1)
        front_x = [x0 + 6 + i * span_f for i in range(n_front)]
        # A bench between the front posts, before them, so they stand in front.
        if r['bench']:
            by = foot - back // 2
            for a, b in zip(front_x, front_x[1:]):
                bx0, bx1 = a + pw + 2, b - 2
                if bx1 - bx0 < 10:
                    continue
                d.rectangle((bx0, by - 10, bx1, by - 5), fill='#6b4a2e')
                d.line((bx0, by - 10, bx1, by - 10), fill='#a9814a')
                d.line((bx0, by - 5, bx1, by - 5), fill='#3f2f1c')
                for lx in (bx0 + 3, bx1 - 6):
                    d.rectangle((lx, by - 5, lx + 3, by + 2), fill='#54401f')
                    d.line((lx, by - 5, lx, by + 2), fill='#7a5830')
                self.shade([(bx0 + 2, by + 1, bx1 + 4, by + 3, 70)])
        for px in front_x:
            post(px, eave + 2, foot)
            d.ellipse((px - 2, foot - 3, px + pw + 1, foot + 2), fill='#33261a')
            if r['carved']:
                for cy in range(eave + 14, foot - 12, 11):
                    d.line((px + 1, cy, px + pw - 2, cy), fill='#2c2013')
                    d.line((px + 1, cy + 1, px + pw - 2, cy + 1), fill='#c09a5c')
                    d.point((px + pw // 2, cy + 5), fill='#2c2013')
        # The roof last: it sits over the heads of the posts, and the eave
        # line is the strongest edge in the sprite.
        if r['roofStuff'] == 'stalk':
            rows = max(1, depth // 3)
            for i in range(rows):
                y = ridge + i * 3
                t = i / max(1, rows - 1)
                inset = int((x1 - x0) / 14 * (1 - t))
                band = ('#d9c07c', '#c4aa68', '#ab9155', '#8f7745')[min(3, int(t * 3.4))]
                d.rectangle((x0 - 4 + inset, y, x1 + 4 - inset, y + 2), fill=band)
                for sx in range(x0 - 4 + inset, x1 + 4 - inset, 5):
                    d.point((sx, y), fill='#e8d79b')
                    d.point((sx + 2, y + 2), fill='#74603a')
            d.line((x0 - 4 + (x1 - x0) // 14, ridge - 1,
                    x1 + 4 - (x1 - x0) // 14, ridge - 1), fill='#dcc689')
        else:
            pal = ROOFS['thatch'] if r['roofMaterial'] == 'thatch' else self.roof
            self.roof_plane(x0 - 4, x1 + 4, ridge, eave, pal,
                            ridge_inset=(x1 - x0) // 14)
        # The cut ends of the thatch, and the dark line where the eave turns
        # under. Without that line the roof has no thickness.
        for ex in range(x0 - 4, x1 + 5):
            jag = 2 + (ex // 4 + ex // 7) % 2
            d.line((ex, eave, ex, eave + jag), fill='#6d5a32' if ex % 2 else '#7f6b3b')
        d.line((x0 - 4, eave + 3, x1 + 4, eave + 3), fill='#3e3319')
        self.occlude(x0 + 4, foot - 1, x1 - 4, foot + 1, 80)

    def round_house(self):
        """A round meeting house: a low timber drum painted round its face,
        under a conical thatch that is most of the building. Drawn ring by
        ring from the ground up, so each course of thatch overlaps the one
        behind it the way a real roof is laid."""
        r = self.r
        d = self.d
        w = self.w
        cx = w // 2
        rx = (w - 22) // 2
        foot = self.ground - int(rx * FORESHORTEN)
        wall_h = r['wallHeight']
        cone = int(rx * 0.62) + r['roofRise'] // 4
        TIM = ['#2a1f13', '#3b2b19', '#4f3a22', '#63492c', '#7a5b38',
               '#916e45', '#a78256', '#bb976a']
        THATCH = ['#3b3119', '#4d4022', '#61512c', '#766338', '#8c7644',
                  '#a38b52', '#b9a165', '#cdb77c']
        # The wall: a timber drum, with the posts it is built of showing.
        self.drum(cx, foot, rx, wall_h, TIM)
        for i in range(-9, 10):
            a = i / 10
            px = int(cx + rx * a)
            half = self.plan_half(px - cx, rx)
            lit = self.lambert(a, 0.0, len(TIM))
            d.line((px, foot - wall_h - half, px, foot + half),
                   fill=TIM[max(0, lit - 2)])
            d.line((px + 1, foot - wall_h - half, px + 1, foot + half),
                   fill=TIM[min(len(TIM) - 1, lit + 1)])
        if r['painted']:
            # One tidy band of painted work round the wall, in earth colours:
            # the triangles are what says whose house this is.
            paint = ['#9a3b2c', '#c9a44e', '#25313f']
            n = max(8, rx // 6)
            for i in range(-n, n + 1):
                a = i / (n + 0.5)
                px = int(cx + rx * a * 0.97)
                half = self.plan_half(px - cx, rx)
                if abs(px - cx) < r['doorWidth'] + 8:
                    continue
                top = foot + half - wall_h + 8
                up = i % 2 == 0
                col = paint[(i // 2) % 3]
                tri = ([(px - 4, top + 10), (px, top), (px + 4, top + 10)] if up
                       else [(px - 4, top), (px + 4, top), (px, top + 10)])
                d.polygon(tri, fill=col, outline='#1e1810')
                dim = 6 - self.lambert(a, 0.0, len(TIM))
                if dim > 0:
                    self.shade([(px - 4, top, px + 4, top + 10, 26 * dim)])
        self.doorway(cx, foot + self.plan_half(0, rx) - 1, r['doorWidth'] + 4, 24)
        # The roof: rings from the eave up, each a course of thatch.
        eave = foot - wall_h
        rings = max(8, cone // 3)
        for k in range(rings):
            t = k / rings
            rr = rx + 5 - int((rx + 5) * t)
            cy = eave - int(cone * t) + 2
            if rr < 2:
                break
            for x in range(cx - rr, cx + rr + 1):
                nx = (x - cx) / rr
                half = self.plan_half(x - cx, rr)
                i = self.lambert(nx, -0.42, len(THATCH))
                lip = max(0, i - 2) if k % 3 == 0 else i
                d.line((x, cy - half, x, cy + half), fill=THATCH[i])
                d.point((x, cy + half), fill=THATCH[lip])
            # Every third course gets its shadow line, so the cone is laid
            # thatch and not a smooth funnel.
            if k % 3 == 0:
                for x in range(cx - rr, cx + rr + 1):
                    half = self.plan_half(x - cx, rr)
                    nx = (x - cx) / rr
                    i = self.lambert(nx, -0.42, len(THATCH))
                    d.point((x, cy + half + 1), fill=THATCH[max(0, i - 3)])
        apex = eave - cone
        d.line((cx - 3, eave - cone + 4, cx + 3, eave - cone + 4),
               fill=THATCH[2])
        if r['finialFigure']:
            self.figure(cx, apex + 2, 14, 2, plinth=False)
        else:
            d.polygon([(cx - 4, apex + 5), (cx, apex - 6), (cx + 4, apex + 5)],
                      fill=THATCH[6], outline=THATCH[1])
        self.occlude(cx - rx, foot + self.plan_half(0, rx) - 2,
                     cx + rx, foot + self.plan_half(0, rx) + 1, 88)

    def carved_gable(self):
        """A steep gable on posts with a carved barge and a porch: the meeting
        house, the men's house, the ancestor house. What it says is said on
        the front, so the front is where the work goes."""
        r = self.r
        d = self.d
        M = self.M
        w = self.w
        x0, x1 = 10, w - 10
        foot = self.ground
        cx = (x0 + x1) // 2
        stilt = r['stiltHeight']
        floor = foot - stilt
        top = floor - r['wallHeight']
        rise = r['roofRise']
        if stilt:
            for px in range(x0 + 4, x1 - 2, (x1 - x0 - 6) // 3 or 1):
                d.rectangle((px, floor, px + 4, foot), fill='#6b4a2e')
                d.line((px, floor, px, foot), fill='#8a6538')
                d.line((px + 4, floor, px + 4, foot), fill='#43331d')
            self.shade([(x0, floor, x1, foot, 46)])
            d.rectangle((x0 - 2, floor - 3, x1 + 2, floor), fill='#7a5830')
            d.line((x0 - 2, floor - 3, x1 + 2, floor - 3), fill='#a9814a')
        self.boards(x0, top, x1, floor)
        self.boards(x1 - 10, top, x1, floor, shade=True)
        if r['painted']:
            # A painted field across the front, in earth colours.
            for i, by in enumerate(range(top + 6, floor - 8, 11)):
                for bx in range(x0 + 5, x1 - 8, 15):
                    colour = ('#9a3b2c', '#c9a44e', '#25313f')[(i + bx) % 3]
                    d.polygon([(bx, by + 8), (bx + 6, by), (bx + 12, by + 8)],
                              fill=colour, outline='#241d15')
                    d.point((bx + 6, by + 4), fill='#e6dcc4')
        # The roof: a plane receding to a short ridge at the back, with the
        # carved barge running down the near hips. A front-facing triangle
        # would read as a wall, not as a roof seen from above.
        pal = ROOFS['thatch'] if r['roofStuff'] == 'thatch' else self.roof
        self.roof_plane(x0 - 8, x1 + 8, top - rise, top, pal,
                        ridge_inset=(x1 - x0) // 3)
        inset = (x1 - x0) // 3
        for side in (-1, 1):
            x_eave = x0 - 8 if side < 0 else x1 + 8
            x_ridge = x0 - 8 + inset if side < 0 else x1 + 8 - inset
            steps = max(1, rise // 4)
            for i in range(steps):
                t = i / steps
                bx = int(x_ridge + (x_eave - x_ridge) * t)
                by = int(top - rise + rise * t)
                d.line((bx, by, bx + side * 3, by + 2), fill='#8a6538')
                d.point((bx + side, by + 1), fill='#d6b174')
        if r['finialFigure']:
            self.figure(cx, top - rise + 3, 13, 2, plinth=False)
        if r['porch']:
            d.rectangle((x0 + 6, floor - 26, x1 - 6, floor - 22), fill='#7a5830')
            d.line((x0 + 6, floor - 26, x1 - 6, floor - 26), fill='#a9814a')
            for px in (x0 + 8, x1 - 14):
                d.rectangle((px, floor - 24, px + 5, floor - 2), fill='#6b4a2e')
                d.line((px, floor - 24, px, floor - 2), fill='#8a6538')
            self.cast(x0 + 8, floor - 21, x1 - 6, floor - 17, 68, feather=False)
        self.doorway(cx, floor, 13, 22)
        self.occlude(x0 - 2, foot, x1 + 2, foot + 2, 88)

    def render(self):
        form = self.r['form']
        {'domed': self.domed, 'vaulted': self.vaulted, 'bath-shed': self.bath_shed,
         'arcaded': self.arcaded, 'portal': self.portal,
         'long-hall': self.long_hall, 'sweat-lodge': self.sweat_lodge,
         'kiva': self.kiva, 'open-shelter': self.open_shelter,
         'round-house': self.round_house,
         'carved-gable': self.carved_gable}[form]()
        if self.facing in ('east', 'west'):
            self.door_x = corner_door(self, self.ground) + DOOR_W // 2
        elif self.facing == 'north':
            self.d.rectangle((self.w // 2 - 7, 4, self.w // 2 + 7, 7),
                             fill=self.p['foundation'][1])
        self.d.line((5, self.ground + 1, self.w - 8, self.ground + 1), fill=(30, 34, 26, 155))
        return self.im


def hall_recipes(root, source):
    import json
    kit = json.loads((root / 'src/content/graphics/halls.json').read_text())
    source['materials'].update(kit.get('materials', {}))
    out = {}
    for base_name, base in kit['buildings'].items():
        for name, r in expand(base_name, base).items():
            fw, fh = (max(3, min(16, int(v))) for v in r['footprint'])
            r = {**r, 'footprint': [fw, fh]}
            form = r['form']
            if form == 'domed':
                height = r['wallHeight'] + r['domeRadius'] + 14 + r['chimneyHeight']
            elif form == 'vaulted':
                height = r['wallHeight'] + (fw * 16) // 4 + 16
            elif form == 'bath-shed':
                height = r['wallHeight'] + r['roofRise'] + 24 + r['chimneyHeight'] // 2
            elif form == 'arcaded':
                height = (r['wallHeight'] + (0 if r['parapet'] else r['roofRise'])
                          + (r['belfryHeight'] + 34 if r['belfry'] != 'none' else 14))
            elif form == 'sweat-lodge':
                height = r['domeRadius'] + 30
            elif form == 'kiva':
                height = r['drumRise'] + 44
            elif form == 'open-shelter':
                height = r['postHeight'] + r['thatchDepth'] + 16
            elif form == 'round-house':
                height = (fw * 16 + 2) // 2 + r['wallHeight'] + r['roofRise'] // 4 + 20
            elif form == 'carved-gable':
                height = (r['stiltHeight'] + r['wallHeight'] + r['roofRise'] + 24)
            elif form == 'portal':
                height = r['wallHeight'] + (r['minaretHeight'] + 22 if r['minarets'] else 12)
            else:
                height = r['wallHeight'] + r['roofRise'] + 30
            out[f'hall-{name}'] = {
                **r, 'canvas': [fw * 16 + 24, height + 44], 'height': height,
                'roof': 'gable', 'opening': 'door', 'attachments': [],
                'hall': True, 'recipe': base_name,
            }
    return out
