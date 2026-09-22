"""The numbers every oblique painter shares. Change them here, nowhere else.

A building shows its front square on, its right-hand wall as a shallow strip
sheared up at 45 degrees, and a roof that leans back over both. The strip is
a nod to depth, not a measured projection: a house three tiles deep shows
twelve pixels of side wall. scripts/art/oblique_audit.py checks painters
against this file; OBLIQUE_ART.md explains the choices.
"""

# Screen px of depth per world px, used for offsets such as a set-back nave.
K = 0.5
# One storey of wall. A ground floor is STOREY + 10 for the plinth and eave.
STOREY = 28
# Eave overhang in front, verge overhang at the gable end.
OVER, VERGE = 4, 3
# The side wall is the wall ramp one step darker: the sun is upper left.
SUN = (-0.58, -0.55, 0.60)


def side_depth(footprint_depth, deep=False):
    """Ordinary houses keep the settled 12px return at every footprint.

    Deep landmarks may use 14/16px so a nave or hall does not collapse into a
    strip, but a large house gains real plan depth without changing projection.
    """
    if not deep:
        return 12
    return 12 if footprint_depth <= 5 else 14 if footprint_depth <= 8 else 16


# Ridge height above the eave, by roofing. Independent of the side depth, so a
# shallow building still carries a full roof. Low for Mediterranean pantile.
RISE = {'thatch': 22, 'pantile': 13}
DEFAULT_RISE = 24


def roof_rise(material):
    return RISE.get(material, DEFAULT_RISE)


def prop_side(width):
    """Right-hand face for a boxy prop, in px. Nothing under 12px wide gets
    one: a two-pixel face cannot be drawn, only smudged."""
    return 0 if width < 12 else 2 if width < 20 else 3 if width < 34 else 4
