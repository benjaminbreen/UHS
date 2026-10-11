"""Trade signs hung off the wall, for the game: the fixtures of front_fixtures
drawn on their own. The object stands on the cell right of a door; its
anchor is that cell's foot, and the sign hangs on the wall above it."""
from art.front_materials import C
from art.front_fixtures import fixture, EMBLEMS

W, H = 72, 92
# How far above the cell's foot the bracket meets the wall: just over the
# door head, which clears the 37px adult.
HIGH = 52
# Styles that carry a trade mark take one variant per emblem.
MARKED = ('oak', 'painted', 'cutout', 'fascia', 'pennant', 'bazaar')
PLAIN = ('bush', 'barber', 'lacquer', 'split', 'noren', 'sugidama', 'wineflag')


def wallsign(style, variant=0):
    c = C(W, H)
    y = H - HIGH
    if style == 'fascia':
        # Flat over the door, which is the cell to the left: centred on it.
        ax, x = 43, 4
        # Lettering is the game's to set, in the street's language.
        fixture(c, x, y + 4, 1, 'sign', style, variant, word='')
    elif style == 'noren':
        # As wide as the door it hangs in, so a corner door keeps it on the wall.
        ax, x = 31, 4
        fixture(c, x + 2, H - 46, 1, 'sign', style, 0, w=18)
    else:
        ax, x = 12, 4
        hy = {'wineflag': y + 14, 'barber': y + 14, 'bush': y + 2}.get(style, y)
        fixture(c, x, hy, 1, 'sign', style, variant if style in MARKED else (17 if style == 'barber' else 0))
    im = c.im
    im.info['anchor'] = [ax, H]
    # On the wall, not on the ground: no shadow on the street under it.
    im.info['shadowMinY'] = H + 10
    return im


WALLSIGNS = {f'wallsign-{s}': (lambda v=0, s=s: wallsign(s, v)) for s in MARKED + PLAIN}
