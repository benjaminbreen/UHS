"""Forty original prop families, separate from the game's production atlas."""
from .proofs import PROOFS
from .daily import DAILY
from .containers import vessel, gourd, basket, sack, box, barrel, bucket, modern
from .utilities import trough, well, pump, grinder, mortar, tool, woodpile, sheaf, rack, scarecrow, fire, oven, lamp, lantern, furniture, bedroll

def draw_prop(key,variant):
 if key in DAILY:return DAILY[key](variant)
 if key in PROOFS:return PROOFS[key](variant)
 if key in ['earthen-pot','storage-jar','water-jug','amphora','glazed-jar','metal-vessel']:return vessel(key,variant)
 if key in ['open-basket','lidded-basket']:return basket(key,variant)
 if key in ['plain-box','bound-chest','painted-chest','crate']:return box(key,variant)
 if key in ['metal-tin','plastic-bin','cardboard-box']:return modern(key,variant)
 if key in ['hoe','sickle','spade']:return tool(key,variant)
 if key in ['stool','bench','workbench']:return furniture(key,variant)
 if key in ['well','framed-well']:return well(variant,key=='framed-well')
 return {'gourd':gourd,'sack':sack,'barrel':barrel,'bucket':bucket,'trough':trough,'pump':pump,'grinder':grinder,'mortar':mortar,'woodpile':woodpile,'sheaf':sheaf,'drying-rack':rack,'scarecrow':scarecrow,'hearth':fire,'oven':oven,'oil-lamp':lamp,'lantern':lantern,'bedroll':bedroll}[key](variant)
