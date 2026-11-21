"""B studies: the same families redrawn on canvases sized to the object.

Built alongside the A art under the study-propb- prefix so the prop lab can
show both. Nothing here replaces a production sprite.
"""
from .wells import low_well, framed_well, pump
from .harvest import sheaf, spade
from .town import town_well, grinder, sickle, axe, pick
from .workshop import chest, bench, park_bench, anvil, loom, painted_chest, workbench
from .household import sack, cooking_pot, stool, bedroll, plastic_bin, plastic_bin_fallen, gourd
from .industrial import dustbin, dustbin_open, dustbin_dented, dustbin_dented_open, kerosene_tin, kerosene_tin_dented, wheelie_bin, wheelie_bin_open, wheelie_bin_fallen, street_bin, municipal_planter, works_fence, steel_drum, wheelbarrow
from . import fallen as _fallen
from .lamps import LAMPS
from .city import city_plane, city_willow, meiji_pole, rickshaw
from .traffic import TRAFFIC
from .stalls import STALLS
from .pitches import PITCHES
from .farm import FARM
from . import farm as _farm, roadside as _roadside, stores as _stores, kerbside as _kerb
from .privy import PRIVY, PRIVY_STATES
from .midden import MIDDEN, household_dented, communal_dented
from .granary import GRANARY
from .asia import ASIA
from .signs import SIGNS
from .signposts import SIGNPOSTS
from .wallsigns import WALLSIGNS
from .settlement_details import DETAILS
from .civic import CIVIC
from .market import MARKET
from .stores import STORES
from .regional import REGIONAL
from .ancient import ANCIENT
from .lifeways import LIFEWAYS
from .yardwork import YARDWORK
from .feasting import FEASTING
from .vessels import (pot, storage_jar, water_jug, amphora, glazed_jar,
                      metal_vessel, pithos, flask, bowl, bucket,
                      open_basket, lidded_basket)
from . import vessels as _jars
from . import carrying as _soft

DRAW_B = {
 **STORES,
 **FEASTING,
 'well': low_well,
 'framed-well': framed_well,
 'pump': pump,
 'sheaf': sheaf,
 'spade': spade,
 'town-well': town_well,
 'grinder': grinder,
 'sickle': sickle,
 'hoe': axe,
 'pick': pick,
 'strapped-chest': chest,
 'bench': bench,
 'park-bench': park_bench,
 'city-plane': city_plane,
 'city-willow': city_willow,
 'meiji-pole': meiji_pole,
 'rickshaw': rickshaw,
 'anvil': anvil,
 'loom': loom,
 'painted-chest': painted_chest,
 'workbench': workbench,
 'bedroll': bedroll,
 'plastic-bin': plastic_bin,
 'gourd': gourd,
 'sack': sack,
 'stool': stool,
 'cooking-pot': cooking_pot,
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
 'water-jar': _jars.water_jar,
 'olla': _jars.olla,
 'onggi': _jars.onggi,
 'egyptian-jar': _jars.egyptian_jar,
 'canaanite-jar': _jars.canaanite_jar,
 'majiayao-jar': _jars.majiayao_jar,
 'trade-jar': _jars.trade_jar,
 'urpu': _jars.urpu,
 'stoneware-crock': _jars.stoneware_crock,
 'waterskin': _soft.waterskin,
 'merchant-bale': _soft.merchant_bale,
 'milk-bag': _soft.milk_bag,
 'taru': _soft.taru,
 'rice-bale': _soft.rice_bale,
 'milk-vessel': _soft.milk_vessel,
 'bark-box': _soft.bark_box,
 'coolamon': _soft.coolamon,
 'grain-hamper': _soft.grain_hamper,
 'andean-sack': _soft.andean_sack,
 'parfleche': _soft.parfleche,
 'pacific-basket': _soft.pacific_basket,
 'woven-grain-bin': _soft.grain_bin,
 'woven-grain-bin-large': _soft.big_grain_bin,
 'grain-hamper-large': _soft.big_grain_hamper,
 'taru-large': _soft.big_taru,
 'andean-sack-large': _soft.big_andean_sack,
 'merchant-bale-large': _soft.big_bale,
 'dustbin': dustbin,
 'kerosene-tin': kerosene_tin,
 'wheelie-bin': wheelie_bin,
 'street-bin': street_bin,
 'municipal-planter': municipal_planter,
 'works-fence': works_fence,
 'steel-drum': steel_drum,
 'wheelbarrow': wheelbarrow,
 **LAMPS,
 **TRAFFIC,
 **STALLS,
 **PITCHES,
 **FARM,
 **PRIVY,
 **MIDDEN,
 **GRANARY,
 **ASIA,
 **SIGNS,
 **SIGNPOSTS,
 **WALLSIGNS,
 **DETAILS,
 **CIVIC,
 **MARKET,
 **REGIONAL,
 **ANCIENT,
 **LIFEWAYS,
 **YARDWORK,
}

from .wayside import WAYSIDE
from .sacred import SACRED
# Later redraws replace the first attempts at the same family.
DRAW_B.update(WAYSIDE)
DRAW_B.update(SACRED)
from .monuments import MONUMENTS
DRAW_B.update(MONUMENTS)
from .street import STREET
DRAW_B.update(STREET)
from .goods import GOODS
DRAW_B.update(GOODS)
from .kerbside import KERBSIDE
DRAW_B.update(KERBSIDE)
from .roadside import ROADSIDE
DRAW_B.update(ROADSIDE)
from .fronts import FRONTS
DRAW_B.update(FRONTS)

# These reviewed fronts already contain their top depth; do not extrude them.
from .equipment_studies import EQUIPMENT_B
DRAW_B.update(EQUIPMENT_B)
from .lots import LOTS
DRAW_B.update(LOTS)
from .plaza_families import PLAZA, PLAZA_ANIMATED
DRAW_B.update(PLAZA)
from .statuary import STATUARY
DRAW_B.update(STATUARY)
from .yard import YARD
DRAW_B.update(YARD)

# Families drawn in separable layers. The renderer places the frame and sways
# the hangings against it; the unsuffixed sprite stays whole for the lab, the
# UI and the shadow mask.
LAYERED = {
 'drying-rack': ('frame', 'hang'),
 'door-lantern': ('frame', 'hang'),
}

# Props that move on their own: the base sprite plus `-m1..` motion frames.
ANIMATED = {
 'pump': 6,
 'well': 4,
 'dovecote': 4,
 'chicken-coop': 4,
 'washing-line': 6,
 'pole-sign': 4,
 'censer': 4,
 'beehive': 4,
 'beam-scale': 8,
 'privy-shed': 4,
 'privy-screen': 4,
 'privy-bench': 4,
 'privy-stone': 4,
 'privy-nightsoil': 4,
 'privy-midden': 4,
 'midden': 4,
 'privy-dung': 4,
 'travois': 4,
 'wash-tub': 4,
 'backstrap-loom': 4,
 'dye-vats': 4,
 'bloomery': 4,
 'kiln': 4,
 'traffic-signal': 16,
 # Cloth stirs on a covered pitch.
 **{key: 4 for key in PITCHES},
 **PLAZA_ANIMATED,
}

# A prop's states, each drawn rather than derived: `fallen` when knocked over,
# `open` with the lid off, `dented` once struck, joined (`dented-open`) where
# both show. The renderer uses the most specific one drawn.
STATES = {
 'standing-stone': {'fallen': _fallen.marker},
 'roman-milestone': {'fallen': _fallen.milestone},
 'rune-marker': {'fallen': _fallen.rune_marker},
 'stone-lantern': {'fallen': _fallen.stone_lantern},
 'dustbin': {'fallen': _fallen.dustbin, 'open': dustbin_open, 'dented': dustbin_dented,
             'dented-open': dustbin_dented_open},
 'steel-drum': {'fallen': _fallen.steel_drum},
 'kerosene-tin': {'dented': kerosene_tin_dented},
 'wheelie-bin': {'open': wheelie_bin_open, 'fallen': wheelie_bin_fallen},
 'plastic-bin': {'fallen': plastic_bin_fallen},
 'bucket': {'fallen': _fallen.bucket},
 'cooking-pot': {'fallen': _fallen.cooking_pot},
 'stool': {'fallen': _fallen.stool},
 'open-basket': {'fallen': _fallen.open_basket},
 'lidded-basket': {'fallen': _fallen.lidded_basket},
 'water-jar': {'open': _jars.water_jar_open, 'fallen': _jars.water_jar_fallen},
 'onggi': {'open': _jars.onggi_open},
 'stoneware-crock': {'open': _jars.stoneware_crock_open},
 'olla': {'fallen': _jars.olla_fallen},
 'egyptian-jar': {'fallen': _jars.egyptian_jar_fallen},
 'canaanite-jar': {'fallen': _jars.canaanite_jar_fallen},
 'majiayao-jar': {'fallen': _jars.majiayao_jar_fallen},
 'urpu': {'fallen': _jars.urpu_fallen},
 'merchant-bale': {'open': _soft.merchant_bale_open},
 'taru': {'open': _soft.taru_open},
 'milk-vessel': {'open': _soft.milk_vessel_open, 'fallen': _soft.milk_vessel_fallen},
 'bark-box': {'open': _soft.bark_box_open},
 'grain-hamper': {'open': _soft.grain_hamper_open},
 'woven-grain-bin': {'open': _soft.grain_bin_open},
 'woven-grain-bin-large': {'open': _soft.big_grain_bin_open},
 'privy-midden': {'dented': household_dented},
 'midden': {'dented': communal_dented},
 'grain-hamper-large': {'open': _soft.big_grain_hamper_open},
 'taru-large': {'open': _soft.big_taru_open},
 'milk-churn': {'open': _farm.milk_churn_open, 'fallen': _farm.milk_churn_fallen},
 'ice-chest': {'open': _roadside.ice_chest_open},
 'plain-box': {'open': _stores.plain_box_open},
 'cardboard-box': {'open': _stores.cardboard_box_open, 'dented': _stores.cardboard_box_dented},
 'utility-cabinet': {'open': _kerb.utility_cabinet_open},
 'pavement-board': {'fallen': _kerb.pavement_board_fallen},
 **PRIVY_STATES,
}

TOPPLING = {'standing-stone', 'roman-milestone', 'rune-marker', 'stone-lantern', 'stool', 'dustbin', 'steel-drum', 'wheelie-bin', 'pavement-board'}


def draw_prop_b(key, variant, layer=None):
 if layer:
  return DRAW_B[key](variant, layer)
 return DRAW_B[key](variant)


def _unused(key, variant):
 return DRAW_B[key](variant)
