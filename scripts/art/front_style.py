"""The numbers every front-on painter shares. Change them here, nowhere else.

A front-on building shows its facade square on, with no side wall. Depth
comes from what projects: sills, balconies, hoods, cornices and awnings show
their top faces, because the camera looks down a little, and each throws a
shadow on the wall below. The roof shows enough of itself to read as a
volume, never so much that a street of them hides the street behind.

Scale is set by the live adult, 37px tall: a door is taller than a person and
a window about two thirds of one.
"""

FIGURE = 37
# A single street door and the arched carriage door of an apartment house.
DOOR = (22, 44)
CARRIAGE = (24, 50)
# Bay pitch of an urban facade, and the least margin at each party wall.
BAY, MARGIN = 30, 10
# Storey heights: a shop floor, the first (best) floor, and the rest.
GROUND, NOBLE, UPPER = 60, 54, 50
CORNICE, MANSARD, ROOF_TOP = 12, 44, 30
# Space above the roof for stacks and pots.
HEADROOM = 34
# How far projecting parts show their top faces, in px.
SLAB, SILL, CORNICE_TOP = 7, 2, 4
# Light comes from the upper left; outlines are tinted from what they touch.
OUTLINE_K = 0.42
