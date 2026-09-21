"""Give a ramp somewhere to go besides darker.

A quarter of the props and a fifth of the buildings shift less than six degrees
of hue between their shadows and their lights: the ramp is a brightness slider,
one colour at several values, which is the flat, plasticky look.

The fix is not one shared palette. Every ramp keeps its own hue and chroma --
that is what makes a desert sandstone and a northern slate read as different
places -- and only gains structure inside itself: shadows lean toward blue and
hold their colour, lights lean toward warm and give a little up. Value is left
exactly alone, so contrast, banding and the audit's value metrics do not move.
"""
import colorsys

import json
from pathlib import Path

# One law for the painters and the ground raster (src/render/palette.ts).
LAW = json.loads((Path(__file__).resolve().parents[3]
                  / 'src/content/graphics/palette.json').read_text())
SHADOW_HUE = LAW['shadow']['hsvHue'] / 360   # the direction a shadow leans
LIGHT_HUE = LAW['light']['hsvHue'] / 360     # and the direction sunlight leans
# Degrees of rotation at a ramp's extremes -- a fixed angle, NOT a fraction of
# the distance to the target. Rotating a share of that distance moves the
# materials that least need it the most: straw sits 175 degrees from the shadow
# target, so a fifth of the way is a 35 degree swing that lands its shadow in
# red, while a blue glaze already near the target barely moves at all.
STRENGTH = 10.0 / 360
SHADOW_CHROMA = 0.12     # shadows hold their colour
LIGHT_CHROMA = -0.08     # lights wash out a little


def _toward(hue, target, degrees):
    """Rotate by a fixed angle, the short way, so red does not detour via green."""
    delta = (target - hue + 0.5) % 1.0 - 0.5
    if delta == 0:
        return hue
    step = min(abs(delta), degrees) * (1 if delta > 0 else -1)
    return (hue + step) % 1.0


def shift_colour(colour, t, strength=STRENGTH):
    """`t` is the step's place in its ramp, 0 darkest to 1 lightest."""
    v = colour.lstrip('#')
    rgb = [int(v[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    h, s, val = colorsys.rgb_to_hsv(*rgb)
    # Strongest at the two ends and nothing in the middle: the midtones are the
    # material's actual colour and should stay where they are.
    if t < 0.5:
        pull, target, chroma = 1 - 2 * t, SHADOW_HUE, SHADOW_CHROMA
    else:
        pull, target, chroma = 2 * t - 1, LIGHT_HUE, LIGHT_CHROMA
    if s > 0.05:
        h = _toward(h, target, pull * strength)
    s = max(0.0, min(1.0, s * (1 + chroma * pull)))
    out = colorsys.hsv_to_rgb(h, s, val)
    return '#%02x%02x%02x' % tuple(int(round(c * 255)) for c in out)


def shift_ramp(ramp, strength=STRENGTH):
    span = max(len(ramp) - 1, 1)
    return [shift_colour(c, i / span, strength) for i, c in enumerate(ramp)]
