"""Broadleaf ages, leafed and bare. Each is grown on its native grid, never scaled."""
from art.canopy import tree

# size, seed, fork levels, trunk width, leaf-mass radius. Seeds chosen by eye.
AGES = {
    'sapling': ((48, 64), 5, 2, 4.5, 5.5),
    'young': ((72, 96), 11, 3, 8, 7),
    'mature': ((112, 144), 5, 4, 14, 9.5),
    'giant': ((144, 192), 5, 5, 19, 11),
}


def broadleaf_ages():
    out = {}
    for age, (size, seed, levels, trunk, r) in AGES.items():
        out[f'nature-broadleaf-{age}'] = tree(size, seed, levels, trunk, r)
    for age, (size, seed, levels, trunk, r) in AGES.items():
        out[f'nature-broadleaf-{age}-bare'] = tree(size, seed, levels, trunk, r, bare=True)
    return out
