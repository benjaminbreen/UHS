"""Modern-era facades: flat parapet roofs, glazed ground floors, painted walls.

Split from `urban.py` because a concrete block wants none of what a Roman
insula wants. The premodern painter gives every building a deep grey roof
slab, plaster losses and a plank door; on a 20th-century street that reads as
one grey lid repeated to the horizon.

The drawing vocabulary lives in module functions rather than on the class, so
`InfillBuilding` and any later modern painter can borrow a window or a
storefront without inheriting a mid-rise silhouette.

Rules from BUILDING_ART.md that this file leans on:
  - a flat roof faces the sky, so it is lighter than the wall and evenly lit;
  - the one dark line that seats a roof is where the parapet turns onto it;
  - detail is subtraction. One rhythm of windows, one band of glazing.
"""
from art.urban import UrbanBuilding

# One cool glass ramp for every modern window, whatever the wall is painted.
GLASS = ['#22333a', '#33505a', '#52798a', '#8fb6bc']
# Painted fascia boards. The ink the word is drawn in is chosen at runtime to
# suit whichever of these the building got.
SIGN_INKS = ['#7d3a30', '#2f4a63', '#5b5a32', '#63402f', '#2f5750', '#6a3350']
# Every flat roof is the same poured concrete, whatever the walls are painted.
# Taking it from the material instead gave the glass tower a navy roof and the
# street stopped reading as one town.
CONCRETE = ['#3f453f', '#6b7268', '#9ba190', '#c4c7b2']
LIT = '#d7b168'
CURTAIN = '#d8d3c0'


def window(d, pal, x, y, w, h, *, lit=False, curtain=False):
    """A framed opening with a sill. The sky sits in the upper half of the
    glass; the lower half is the dark of the room behind it."""
    dark, shade, base, light, hi = pal['wall']
    d.rectangle((x - 1, y - 1, x + w, y + h), fill=dark)
    d.rectangle((x, y, x + w - 1, y + h - 1), fill=GLASS[1])
    d.rectangle((x, y, x + w - 1, y + h // 2 - 1), fill=GLASS[2])
    d.line((x, y, x + w - 2, y), fill=GLASS[3])
    if lit:
        d.rectangle((x + 1, y + 1, x + w - 2, y + h - 2), fill=LIT)
        d.rectangle((x + 1, y + 1, x + w - 2, y + 2), fill=GLASS[0])
    elif curtain:
        d.rectangle((x + 1, y + 1, x + w // 2 - 1, y + h - 2), fill=CURTAIN)
    d.line((x + w // 2, y, x + w // 2, y + h - 1), fill=GLASS[0])
    d.line((x - 2, y + h, x + w + 1, y + h), fill=hi)          # sill
    d.line((x - 2, y + h + 1, x + w + 1, y + h + 1), fill=shade)  # its shadow
    d.line((x - 1, y - 2, x + w, y - 2), fill=shade)           # lintel


def fascia(d, pal, left, right, y, ink):
    """The painted board over a shopfront. The word goes on at runtime, so this
    is the board and its shadow and nothing else."""
    dark, shade, base, light, hi = pal['wall']
    d.rectangle((left - 1, y - 1, right + 1, y + 9), fill=dark)
    d.rectangle((left, y, right, y + 8), fill=ink)
    d.line((left, y, right, y), fill=light)
    d.line((left - 1, y + 10, right + 1, y + 10), fill=shade)
    return [left, y, right - left + 1, 9]


def storefront(d, pal, left, right, y, bottom):
    """A continuous glazed band: the thing a shop has instead of windows."""
    dark, shade, base, light, hi = pal['wall']
    d.rectangle((left, y - 3, right, bottom), fill=dark)
    d.rectangle((left + 1, y - 2, right - 1, bottom - 2), fill=GLASS[1])
    d.rectangle((left + 1, y - 2, right - 1, y + (bottom - y) // 3), fill=GLASS[2])
    for x in range(left + 6, right - 3, 11):
        d.rectangle((x, y - 2, x + 1, bottom - 2), fill=dark)
    d.line((left + 1, y - 2, right - 1, y - 2), fill=GLASS[3])
    d.line((left, bottom - 1, right, bottom - 1), fill=hi)
    d.line((left, y - 4, right, y - 4), fill=shade)


def glazed_door(d, pal, x, bottom, height=26, width=11):
    dark, shade, base, light, hi = pal['wall']
    left = x - width // 2
    d.rectangle((left - 2, bottom - height - 2, left + width + 1, bottom), fill=shade)
    d.rectangle((left, bottom - height, left + width - 1, bottom), fill=dark)
    d.rectangle((left + 1, bottom - height + 2, left + width - 2, bottom - 1), fill=GLASS[1])
    d.rectangle((left + 1, bottom - height + 2, left + width - 2, bottom - height + 7), fill=GLASS[2])
    d.line((left + width // 2, bottom - height + 2, left + width // 2, bottom - 1), fill=dark)
    d.point((left + width // 2 - 2, bottom - height // 2), fill=hi)
    d.line((left - 2, bottom - height - 3, left + width + 1, bottom - height - 3), fill=hi)


def parapet_roof(d, w, top, rng, *, coping=5):
    """A flat roof read as a lit top plane behind a low parapet wall.

    The plane is near enough evenly lit, so it is one tone with a darker far
    rim; all the modelling is in the coping and the dark line where it turns.
    """
    ink, shade, base, hi = CONCRETE
    plane_top, plane_bottom = 8, top - coping
    d.rectangle((4, plane_top, w - 8, top), fill=base)
    d.rectangle((5, plane_top, w - 9, plane_top + 3), fill=shade)       # far rim
    for _ in range(max(2, w // 40)):                                    # quiet patching
        x = rng.randrange(10, max(12, w - 22))
        y = rng.randrange(plane_top + 5, max(plane_top + 6, plane_bottom - 2))
        d.rectangle((x, y, x + rng.randrange(4, 10), y + 1), fill=shade)
    d.rectangle((3, plane_bottom, w - 7, top), fill=shade)              # parapet, edge on
    d.line((3, plane_bottom, w - 7, plane_bottom), fill=hi)             # its lit coping
    d.line((3, plane_bottom + 1, w - 7, plane_bottom + 1), fill=base)
    d.line((3, top, w - 7, top), fill=ink)                              # the turn
    d.line((3, plane_bottom, 3, top), fill=ink)
    d.line((w - 7, plane_bottom, w - 7, top), fill=ink)


def roof_plant(d, w, top):
    """One stair bulkhead. At this size a water tank on legs read as a chair."""
    ink, shade, base, hi = CONCRETE
    x = w - 24 if w > 70 else w - 18
    d.rectangle((x, 10, x + 13, top - 6), fill=ink)
    d.rectangle((x + 1, 11, x + 12, top - 7), fill=base)
    d.rectangle((x + 1, 11, x + 12, 13), fill=shade)
    d.line((x, 10, x + 13, 10), fill=hi)


def shutters(d, pal, x, y, w, h):
    """A louvred window with its leaves folded back against the wall.

    The louvres are one direction of faint grooves, not a ladder: at this size
    a line every other row turns the whole upper floor into corduroy.
    """
    dark, shade, base, light, hi = pal['wall']
    d.rectangle((x - 1, y - 1, x + w, y + h), fill=dark)
    d.rectangle((x, y, x + w - 1, y + h - 1), fill=GLASS[0])
    d.rectangle((x, y, x + w - 1, y + h // 3), fill=GLASS[1])
    for leaf, sign in ((x - 4, 1), (x + w, -1)):
        d.rectangle((leaf, y, leaf + 3, y + h - 1), fill=shade)
        d.rectangle((leaf + (0 if sign > 0 else 1), y + 1, leaf + 2, y + h - 2), fill=base)
        for yy in range(y + 2, y + h - 2, 3):
            d.line((leaf + 1, yy, leaf + 2, yy), fill=shade)
    d.line((x - 5, y + h, x + w + 4, y + h), fill=hi)
    d.line((x - 5, y + h + 1, x + w + 4, y + h + 1), fill=shade)
    d.line((x - 5, y - 2, x + w + 4, y - 2), fill=shade)


def balcony(d, pal, left, right, y):
    """A shallow slab and a rail. Its underside is the dark line that makes it
    project instead of being painted on."""
    dark, shade, base, light, hi = pal['wall']
    d.rectangle((left, y, right, y + 1), fill=hi)
    d.line((left, y + 2, right, y + 2), fill=dark)
    d.rectangle((left + 1, y - 6, right - 1, y - 1), fill=GLASS[0])
    for x in range(left + 2, right - 1, 4):
        d.line((x, y - 6, x, y - 1), fill=light)
    d.line((left + 1, y - 6, right - 1, y - 6), fill=light)


def arcade(d, pal, left, right, y, bottom, *, piers=4):
    """A five-foot way: the pavement runs through the ground floor, so what
    faces the street is shade with piers in front of it, not a wall."""
    dark, shade, base, light, hi = pal['wall']
    d.rectangle((left, y, right, bottom), fill='#1d211f')
    d.rectangle((left + 1, y + 2, right - 1, y + 5), fill=dark)
    step = max(12, (right - left) // max(1, piers))
    for i in range(piers + 1):
        x = min(right - 5, left + i * step)
        d.rectangle((x, y, x + 5, bottom), fill=shade)
        d.rectangle((x + 1, y + 1, x + 4, bottom - 1), fill=base)
        d.line((x + 1, y + 1, x + 1, bottom - 1), fill=light)
    d.line((left, y - 1, right, y - 1), fill=hi)          # lit beam over the way
    d.line((left, y, right, y), fill=dark)
    d.line((left, bottom, right, bottom), fill=light)     # the pavement itself


def veranda(d, pal, left, right, y, bottom, door_x, *, posts=3):
    """Timber posts carrying the roof overhang, the house wall in shade behind
    them, and the door it shades — a veranda with nothing under it is a hole."""
    dark, shade, base, light, hi = pal['wall']
    d.rectangle((left, y, right, bottom), fill=dark)
    d.rectangle((left + 1, y + 3, right - 1, bottom - 1), fill=shade)
    # The room behind: a door on the entrance axis, one shuttered window beside.
    d.rectangle((door_x - 5, bottom - 21, door_x + 4, bottom - 1), fill='#33291f')
    d.rectangle((door_x - 4, bottom - 20, door_x + 3, bottom - 2), fill='#5b4630')
    d.line((door_x - 4, bottom - 20, door_x - 4, bottom - 2), fill='#8a6b46')
    d.point((door_x + 2, bottom - 11), fill=hi)
    wx = left + 6 if door_x > (left + right) // 2 else right - 16
    d.rectangle((wx, bottom - 18, wx + 9, bottom - 8), fill='#33291f')
    d.rectangle((wx + 1, bottom - 17, wx + 8, bottom - 9), fill=GLASS[0])
    d.line((wx + 1, bottom - 17, wx + 8, bottom - 17), fill=GLASS[1])
    span = (right - left) // max(1, posts - 1)
    for i in range(posts):
        x = min(right - 4, left + i * span)
        d.rectangle((x, y, x + 3, bottom), fill='#3b2f22')
        d.line((x + 1, y + 1, x + 1, bottom - 1), fill='#9a7c52')
        d.line((x + 2, y + 1, x + 2, bottom - 1), fill='#6b543a')
    d.rectangle((left, bottom, right, bottom + 2), fill=light)
    d.line((left, bottom + 3, right, bottom + 3), fill=dark)


def corrugated_roof(d, w, top, rng):
    """Sheet metal on a shallow pitch, ribbed down the fall line and
    overhanging the wall it shades."""
    ink, shade, base, hi = ['#3a4340', '#5e6b64', '#8b968b', '#b9c1b1']
    ridge, eave = 7, top - 3
    d.polygon([(1, eave), (10, ridge), (w - 12, ridge), (w - 4, eave)], fill=base)
    d.polygon([(1, eave), (10, ridge), (10, ridge + 3), (1, eave + 3)], fill=shade)
    d.line((10, ridge, w - 12, ridge), fill=hi, width=2)
    # Ribs run down the fall line, clipped to the sheet: one drawn past its
    # edge reads as a wire hanging off the house.
    for x in range(14, w - 14, 6):
        d.line((x + 3, ridge + 2, x, eave - 1), fill=shade)
    if rng.random() < 0.7:                       # a rust patch or two, broad
        x = rng.randrange(14, max(16, w - 26))
        d.rectangle((x, ridge + 4, x + 9, ridge + 8), fill='#7c6a4c')
    d.rectangle((1, eave, w - 4, eave + 2), fill=ink)     # eave, seen edge on
    d.line((1, eave, w - 4, eave), fill=hi)


class ModernBuilding(UrbanBuilding):
    """Urban forms whose base recipe is modern. Shares the grid and the sun
    with every other painter; owns its roof, its wall and its openings."""

    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.style = recipe.get('modernStyle', 'block')
        self.shop = recipe.get('modernRole') == 'shop'
        self.shuttered = self.style in ('arcade', 'veranda')
        # Published in the model; the renderer draws the word into it.
        self.sign_band = None
        self.sign_paint = SIGN_INKS[recipe['seed'] % len(SIGN_INKS)]

    # --- wall ------------------------------------------------------------
    def wall(self):
        d, w, b, t = self.d, self.w, self.bottom, self.top
        dark, shade, base, light, hi = self.p['wall']
        d.rectangle((4, t, w - 7, b), fill=dark)
        d.rectangle((5, t, self.front, b - 2), fill=base)
        d.rectangle((self.front + 1, t, w - 8, b - 2), fill=shade)
        d.line((5, t + 2, 5, b - 3), fill=light)
        # Painted render weathers from the ground up, in one band, not in
        # speckle: a hundred stray pixels per building is what makes a street
        # of them read as dirt.
        d.rectangle((6, b - 7, self.front, b - 3), fill=shade)
        d.line((6, b - 8, self.front, b - 8), fill=shade)

    def foundation(self):
        d, b = self.d, self.bottom
        ink, shade, light = self.p['foundation']
        d.rectangle((4, b - 3, self.w - 8, b), fill=ink)
        d.line((5, b - 3, self.w - 9, b - 3), fill=light)
        d.line((5, b + 1, self.w - 8, b + 1), fill=(30, 34, 26, 155))

    # --- roof ------------------------------------------------------------
    def flat_roof(self):
        if self.style == 'veranda':
            corrugated_roof(self.d, self.w, self.top, self.rng)
            return
        parapet_roof(self.d, self.w, self.top, self.rng)
        roof_plant(self.d, self.w, self.top)

    def eave_shadow(self):
        """Two clean rows, not the premodern dither.

        A parapet is a hard edge a few inches proud of the wall, so it throws a
        short sharp shadow. The inherited dithered fade was drawn for a deep
        tiled eave and on a flat modern wall it reads as a zip.
        """
        d, t = self.d, self.top
        dark, shade, base, light, hi = self.p['wall']
        d.rectangle((5, t + 1, self.front, t + 2), fill=dark)
        d.line((5, t + 3, self.front, t + 3), fill=shade)

    # --- openings --------------------------------------------------------
    def bay_centers(self):
        bays = self.r['bays']
        if self.facing != 'south':
            return [self.w // 3, 2 * self.w // 3]
        return [round(15 + i * (self.w - 36) / max(1, bays - 1)) for i in range(bays)]

    def openings(self):
        d, b = self.d, self.bottom
        stories = self.r['stories']
        centers = self.bay_centers()
        ground_glazed = (self.shop and self.facing == 'south') or self.style in ('arcade', 'veranda')
        for floor in range(stories):
            if floor == 0 and ground_glazed:
                continue
            line = b - 7 - floor * 31
            if floor:
                d.line((5, line + 3, self.front, line + 3), fill=self.p['wall'][1])
                d.line((5, line + 2, self.front, line + 2), fill=self.p['wall'][3])
            if floor and self.r.get('balconies') and self.facing == 'south':
                balcony(d, self.p, 8, self.front - 2, line - 6)
            for x in centers:
                if floor == 0 and self.facing == 'south' and abs(x - self.door_x) < 18:
                    continue
                seed = (int(x) + floor * 7 + self.r['seed']) % 11
                if self.shuttered:
                    shutters(d, self.p, x - 3, line - 22, 7, 13)
                else:
                    window(d, self.p, x - 4, line - 23, 9, 14,
                           lit=seed == 0, curtain=seed in (3, 6))
        if self.facing != 'south':
            return
        if self.style == 'arcade':
            arcade(d, self.p, 5, self.front, b - 27, b - 4)
            self.sign_band = fascia(d, self.p, 6, self.front - 1, b - 40, self.sign_paint)
            return
        if self.style == 'veranda':
            veranda(d, self.p, 5, self.front, b - 26, b - 5, self.door_x)
            return
        if ground_glazed:
            storefront(d, self.p, 6, self.front, b - 26, b - 6)
            # A single-storey shop has no wall between its window and its
            # parapet, so the board goes on the parapet, which is where a
            # one-storey shop puts it anyway.
            y = b - 39 if b - 39 > self.top + 4 else self.top - 2
            self.sign_band = fascia(d, self.p, 6, self.front - 1, y, self.sign_paint)
        glazed_door(d, self.p, self.door_x, b - 2)

    def render(self):
        self.wall()
        self.foundation()
        self.openings()
        self.flat_roof()
        self.eave_shadow()
        return self.im


def modernise(r, kit, base, form):
    """Turn an urban form on a modern base into a modern recipe.

    Recipe policy lives here rather than in `urban.py` so the premodern
    compiler stays ignorant of eras, which is the rule the whole art pipeline
    is built on.
    """
    cfg = kit.get('modern', {})
    style = cfg.get('styles', {}).get(base) or r.get('modernStyle', 'block')
    walls = cfg.get('walls', [])
    # The rotation is by base and form, not random, so a building keeps its
    # colour across builds and a street gets all six.
    if walls and base != 'modern-office':
        r['wall'] = walls[(len(base) + len(form) * 3) % len(walls)]
    r['roofDepth'] = cfg.get('verandaRoofDepth', 30) if style == 'veranda' else cfg.get('roofDepth', 18)
    # Its storefront is drawn by the painter, not hung on as a market awning.
    r['attachments'] = [a for a in r.get('attachments', []) if a != 'urban-shop']
    return {'modern': True, 'modernStyle': style,
            'modernRole': 'shop' if form in cfg.get('shopForms', []) else r.get('modernRole', 'home')}


def modern_form_allowed(kit, base, form, original):
    cfg = kit.get('modern', {})
    style = cfg.get('styles', {}).get(base) or original.get('modernStyle', 'block')
    allowed = cfg.get('formsByStyle', {}).get(style)
    if allowed is not None and form not in allowed:
        return False
    if form in ('midrise', 'office'):
        return base in cfg.get('tallBases', [])
    infill_bases = cfg.get('infillBases')
    if infill_bases is not None and form in ('cottage', 'hut', 'stall'):
        return base in infill_bases
    return True


# What a form is called when it is drawn in a modern style. The kit's own form
# labels describe a premodern street ("Street-front house"), and the label is
# what the player reads when they look at the building.
STYLE_LABELS = {
    'arcade': {'shop': 'Shophouse', 'row': 'Shophouse row', 'tall': 'Shophouse row',
               'wide': 'Shophouse range', 'cottage': 'Shophouse', 'hut': 'Lock-up shop',
               'stall': 'Shop stall'},
    'veranda': {'shop': 'Tin-roofed shop', 'row': 'Tin-roofed house',
                'cottage': 'Tin-roofed house', 'hut': 'Tin-roofed hut',
                'stall': 'Roadside stall'},
}


def modern_label(style, form, default):
    return STYLE_LABELS.get(style, {}).get(form, default)
