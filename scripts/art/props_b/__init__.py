"""B studies: the same families redrawn on canvases sized to the object.

Built alongside the A art under the study-propb- prefix so the prop lab can
show both. Nothing here replaces a production sprite.
"""
from .wells import low_well, framed_well, trough, pump
from .harvest import sheaf, spade
from .town import town_well, grinder, sickle, axe, pick, drying_rack
from .workshop import chest, bench, anvil, loom
from .household import sack, cooking_pot, stool, catch
from .industrial import dustbin, steel_drum, wheelbarrow, washing_line
from . import fallen as _fallen
from .lamps import LAMPS
from .stalls import STALLS
from .farm import FARM
from .privy import PRIVY
from .granary import GRANARY
from .asia import ASIA
from .signs import SIGNS
from .civic import CIVIC
from .market import MARKET
from .stores import STORES
from .regional import REGIONAL
from .vessels import (pot, storage_jar, water_jug, amphora, glazed_jar,
                      metal_vessel, pithos, flask, bowl, bucket,
                      open_basket, lidded_basket)

DRAW_B = {
 **STORES,
 'well': low_well,
 'framed-well': framed_well,
 'trough': trough,
 'pump': pump,
 'sheaf': sheaf,
 'spade': spade,
 'town-well': town_well,
 'grinder': grinder,
 'sickle': sickle,
 'hoe': axe,
 'pick': pick,
 'drying-rack': drying_rack,
 'strapped-chest': chest,
 'bench': bench,
 'anvil': anvil,
 'loom': loom,
 'sack': sack,
 'stool': stool,
 'cooking-pot': cooking_pot,
 'catch': catch,
 'earthen-pot': pot,
 'storage-jar': storage_jar,
 'water-jug': water_jug,
 'amphora': amphora,
 'glazed-jar': glazed_jar,
 'metal-vessel': metal_vessel,
 'bucket': bucket,
 'open-basket': open_basket,
 'lidded-basket': lidded_basket,
 'pithos': pithos,
 'flask': flask,
 'bowl': bowl,
 'dustbin': dustbin,
 'steel-drum': steel_drum,
 'wheelbarrow': wheelbarrow,
 'washing-line': washing_line,
 **LAMPS,
 **STALLS,
 **FARM,
 **PRIVY,
 **GRANARY,
 **ASIA,
 **SIGNS,
 **CIVIC,
 **MARKET,
 **REGIONAL,
}

from .wayside import WAYSIDE
# Later redraws replace the first attempts at the same family.
DRAW_B.update(WAYSIDE)

# Boxy families that stand beside buildings take the buildings' oblique view.
# Round ones are left alone: a barrel looks the same from every side.
OBLIQUE = ['crate', 'crate-stack', 'woodpile', 'trough', 'strapped-chest', 'bench',
           'stall-trestle', 'stall-awning', 'stall-booth', 'stall-cart', 'stall-modern',
           'farm-cart', 'privy-shed', 'privy-stone', 'privy-outhouse', 'granary-staddle', 'granary-stilt']


def _oblique(fn):
 from .core import extrude
 from art.oblique_style import prop_side
 def draw(*args):
  im = fn(*args)
  return extrude(im, prop_side(im.width))
 return draw


for _key in OBLIQUE:
 DRAW_B[_key] = _oblique(DRAW_B[_key])

# Families drawn in separable layers. The renderer places the frame and sways
# the hangings against it; the unsuffixed sprite stays whole for the lab, the
# UI and the shadow mask.
LAYERED = {
 'drying-rack': ('frame', 'hang'),
 'washing-line': ('frame', 'hang'),
 'door-lantern': ('frame', 'hang'),
}

# Props that move on their own: the base sprite plus `-m1..` motion frames.
ANIMATED = {
 'beehive': 4,
 'beam-scale': 8,
 'privy-shed': 4,
 'privy-screen': 4,
 'privy-bench': 4,
 'privy-stone': 4,
 'privy-nightsoil': 4,
 'privy-midden': 4,
 'privy-dung': 4,
}

# Knocked-over states, drawn as their own sprite rather than a rotation.
FALLEN = {
 'dustbin': _fallen.dustbin,
 'steel-drum': _fallen.steel_drum,
 'bucket': _fallen.bucket,
 'cooking-pot': _fallen.cooking_pot,
 'stool': _fallen.stool,
 'open-basket': _fallen.open_basket,
 'lidded-basket': _fallen.lidded_basket,
}


def draw_prop_b(key, variant, layer=None):
 if layer:
  return DRAW_B[key](variant, layer)
 return DRAW_B[key](variant)


def _unused(key, variant):
 return DRAW_B[key](variant)
