"""Six deliberately authored material studies at the existing 48px sprite scale.

Opaque integer pixels only. Shape clusters describe volume; no random noise,
resampling, baked cast shadows, or dependence on a culture/era branch.
"""
from .common import Art

RAMPS = {
 'clay': ['#292721','#503126','#70402c','#955335','#b96d3e','#cf8c50','#e6ad69','#f5d291'],
 'brass': ['#242924','#513922','#78502a','#a57532','#c99842','#e6b955','#f6d883','#fff0b6'],
 'fiber': ['#302e23','#53422a','#786038','#a1844b','#c0a363','#d9bf7c','#ead59c','#f7e5b4'],
 'wood': ['#292a25','#4e3425','#775033','#a26a38','#bd8847','#d4a45f','#e7c180','#f5d69b'],
 'stone': ['#252d30','#3c484b','#566569','#718080','#8e9b96','#abb6a6','#c7cebb','#e0dfc8'],
 'cloth': ['#302d26','#514637','#756346','#95805a','#b29a6b','#ceba86','#e5d4a4','#f5e7bf'],
}

def art(material, variant):
 a=Art();a.p=RAMPS[material][:]
 # Discrete material ramps preserve value hierarchy, rather than a global tint.
 if variant and material in ['clay','fiber','wood','cloth','stone','brass']:
  from PIL import ImageColor
  shifts = {
   'clay': [(0,0,0),(-7,7,-6),(5,-14,-10)],
   'fiber': [(0,0,0),(-22,-8,-12),(6,2,0)],
   'wood': [(0,0,0),(-26,-24,-16),(8,13,7)],
   'cloth': [(0,0,0),(5,-26,-24),(-35,-12,1)],
   'stone': [(0,0,0),(19,9,-10),(-8,-5,-1)],
   'brass': [(0,0,0),(-42,-12,17),(2,8,12)],
  }
  if material=='brass' and variant==1:a.p=RAMPS['stone'][:]
  elif material=='brass' and variant==2:a.p=['#302923','#563829','#815038','#ab7147','#ce9059','#e8b274','#f6d49b','#fff0c6']
  else:
   delta=shifts[material][variant%3]
   a.p=[tuple(max(0,min(255,c+delta[i])) for i,c in enumerate(ImageColor.getrgb(hex))) for hex in a.p]
 return a

def pot(v):
 a=art('clay',v)
 a.poly([(12,18),(35,18),(37,23),(40,28),(40,34),(37,40),(32,43),(17,43),(11,40),(8,35),(8,28),(11,22)],0)
 a.poly([(12,22),(34,22),(38,28),(38,35),(35,39),(30,42),(18,41),(12,38),(10,33),(11,27)],2)
 a.poly([(14,23),(31,23),(35,27),(36,34),(33,38),(28,40),(19,40),(14,37),(12,32),(12,27)],3)
 a.poly([(14,24),(30,24),(33,28),(32,34),(28,37),(20,38),(15,35),(13,31)],4)
 a.poly([(14,25),(19,24),(23,25),(20,28),(19,33),(16,34),(14,31)],5)
 a.poly([(13,26),(16,25),(18,26),(16,29),(16,31),(13,30)],6)
 a.rect((14,26,15,28),7)
 a.poly([(34,26),(37,29),(37,35),(34,39),(29,41),(20,41),(21,39),(29,39),(33,36)],2)
 a.line((11,32,12,36,16,39),4);a.line((18,42,30,42),1)
 # Broken firing-color patches follow the belly rather than filling it with dots.
 for box,c in [((23,29,27,30),5),((25,31,28,31),4),((18,35,21,36),5),((29,35,31,36),3),((12,34,13,35),3),((24,38,26,38),5),((32,28,34,29),4)]:a.rect(box,c)
 # Elliptical rolled lip, with a lower interior floor behind the front rim.
 a.ell((10,14,38,25),0);a.ell((11,15,37,24),4)
 a.ell((12,15,36,23),6);a.ell((14,17,34,22),1)
 a.ell((15,18,33,22),0)
 a.line((17,17,30,17),2);a.line((17,23,31,23),6)
 a.line((15,15,31,15),7);a.line((12,18,12,20),5)
 a.line((16,24,31,24),3)
 # Small chips and firing blooms sit inside the shaded form; edge hues vary
 # with the light instead of surrounding the whole object in a black keyline.
 a.line((10,29,10,34,12,37),2);a.line((12,39,17,42),1)
 a.line((14,16,28,16),6);a.rect((31,16,32,16),4)
 a.poly([(21,28),(24,27),(27,28),(26,29),(22,29)],5)
 a.rect((22,27,24,27),6);a.rect((24,30,27,30),4)
 a.poly([(28,33),(31,32),(32,34),(30,36),(28,35)],4)
 a.rect((18,36,19,37),6);a.rect((21,38,23,38),5)
 a.line((30,40,34,38),3);a.rect((34,32,35,33),3)
 a.rect((12,24,14,24),2);a.rect((28,24,31,24),2)
 a.rect((32,20,33,20),2);a.line((13,21,15,22),4)
 return a.finish()

def metal(v):
 a=art('brass',v)
 a.poly([(19,13),(28,13),(28,21),(32,25),(36,29),(37,34),(34,39),(29,42),(18,42),(12,39),(10,35),(11,30),(16,25),(19,21)],0)
 a.poly([(20,15),(26,15),(26,22),(31,27),(34,30),(35,34),(32,38),(28,40),(18,40),(13,37),(12,33),(14,29),(19,24)],2)
 a.poly([(21,15),(25,15),(24,23),(27,28),(28,35),(26,39),(19,39),(15,36),(14,32),(17,28),(21,22)],4)
 a.poly([(20,23),(22,24),(20,29),(19,35),(16,35),(15,32),(17,28)],6)
 a.line((20,25,18,29,17,32),7,2)
 a.poly([(24,15),(26,15),(25,22),(29,28),(30,34),(28,38),(26,38),(27,31),(24,25)],3)
 a.poly([(30,27),(33,30),(34,34),(31,37),(29,38),(31,34)],1)
 a.line((13,34,16,36,29,36,33,34),5)
 a.line((16,35,26,35),7);a.line((19,37,27,37),2)
 a.line((17,40,28,40),5);a.line((20,41,27,41),1)
 # Turned collar uses the same ellipse axis as the body below it.
 a.ell((14,10,33,18),0);a.ell((15,11,32,17),4)
 a.ell((16,11,31,16),6);a.ell((18,12,29,15),0)
 a.line((19,12,27,12),2);a.line((19,16,28,16),7)
 a.line((18,11,28,11),7);a.line((15,13,16,15),5)
 a.line((21,19,21,22),6);a.line((27,18,27,22),1)
 # Narrow reflected bands and interrupted hammer marks keep metal distinct
 # from clay while preserving its smooth bright/dark transitions.
 a.rect((22,28,23,30),5);a.rect((20,32,21,33),6)
 a.rect((26,29,27,31),4);a.line((30,30,31,32),3)
 a.line((12,32,12,35,15,38),3);a.line((18,39,25,39),6)
 a.rect((15,36,16,36),7);a.line((28,39,31,38),3)
 a.rect((23,19,23,21),5);a.rect((16,13,16,14),7)
 a.rect((29,15,30,15),3);a.line((18,17,26,17),2)
 a.rect((24,34,26,34),5);a.rect((29,33,29,34),4)
 return a.finish()

def basket(v):
 a=art('fiber',v)
 # Curved body, narrower at the foot. The side courses wrap downwards at
 # the center, following the same ellipse as the mouth rather than a grid.
 a.poly([(6,23),(41,23),(40,30),(37,38),(32,42),(17,42),(11,38),(8,31)],0)
 a.poly([(8,24),(39,24),(38,31),(35,37),(30,40),(18,40),(13,36),(10,30)],2)
 a.poly([(10,26),(33,26),(34,34),(29,40),(18,40),(13,36)],3)
 courses=[(27,9,39),(31,10,38),(35,12,36),(39,16,32)]
 for row,(y,l,r) in enumerate(courses):
  a.line((l,y-1,l+4,y+1,r-4,y+1,r,y-1),1)
  for j,x in enumerate(range(l+1,r-2,4)):
   yy=y+(1 if l+4<x<r-4 else 0)
   shade=5 if x<25 else 4 if x<32 else 3
   a.line((x,yy,x+2,yy),shade)
   a.line((x,yy+1,x+2,yy+1),shade-1)
   if (j+row)%2==0:a.rect((x+2,yy+1,x+2,yy+2),2)
 for x,y in [(13,29),(21,30),(29,30),(35,29),(16,34),(24,34),(32,34),(20,38),(28,38)]:
  a.line((x,y,x,y+2),5 if x<26 else 3)
  a.rect((x+1,y+1,x+1,y+2),2)
 a.line((17,41,31,41),2)
 # Concentric integer ellipses; an inner back wall gives the opening depth.
 a.ell((5,15,42,30),0);a.ell((6,16,41,29),4)
 a.ell((8,17,39,27),6);a.ell((10,19,37,26),1)
 a.ell((11,20,36,26),0)
 a.line((15,20,32,20),2);a.line((13,21,34,21),2)
 a.line((17,22,31,22),1);a.line((17,25,31,25),2)
 # The lip is brightest at its near upper edge, dark beneath its overhang.
 a.line((14,28,33,28),5);a.line((15,27,32,27),7)
 a.line((7,21,7,24,10,26),5);a.line((11,18,15,17,30,17),7)
 a.line((34,18,38,20),5);a.line((38,24,35,26),3)
 for pts in [(15,16,15,18),(24,16,24,18),(33,17,32,19),(39,21,37,22),(35,26,35,28),(25,27,25,29),(15,26,15,28),(8,23,10,24)]:a.line(pts,2)
 for pts in [(16,16,16,18),(25,16,25,18),(16,27,16,28),(26,27,26,28)]:a.line(pts,5)
 return a.finish()

def chest(v):
 a=art('wood',v)
 # Camera faces the front squarely: horizontal front edge, visible top,
 # parallel bands, and no exposed lateral face or isometric skew.
 a.rect((7,21,40,41),0);a.rect((8,22,39,40),2)
 a.rect((9,25,38,38),3)
 for y in [27,32,37]:
  a.line((9,y,38,y),1);a.line((10,y+1,37,y+1),4)
 a.line((9,39,38,39),4)
 a.poly([(7,22),(7,17),(9,13),(12,11),(35,11),(38,13),(40,17),(40,23)],0)
 a.poly([(8,21),(8,17),(10,14),(13,12),(34,12),(37,14),(39,17),(39,21)],3)
 a.rect((10,16,37,20),4);a.rect((13,13,34,15),5)
 a.line((13,12,34,12),6);a.line((10,15,37,15),3)
 a.line((9,18,38,18),5);a.line((8,22,39,22),1)
 a.line((9,21,38,21),5);a.line((9,24,38,24),4)
 for pts,c in [((18,14,22,14),6),((25,17,29,17),3),((17,20,21,20),4),((18,26,22,26),4),((26,30,31,30),2),((17,35,20,35,22,36),2),((26,39,30,39),5)]:a.line(pts,c)
 for x in [11,32]:
  a.poly([(x,14),(x+2,11),(x+4,12),(x+3,17),(x+3,40),(x,40)],'#253238')
  a.line((x+1,15,x+2,12),'#b4c0ad')
  a.line((x+1,17,x+1,39),'#869793');a.line((x+2,17,x+2,39),'#4e646a')
  a.rect((x,22,x+3,23),'#233039')
  for y in [19,27,36]:a.rect((x+1,y,x+1,y),'#d4d5b7');a.rect((x+2,y+1,x+2,y+1),'#293a40')
 a.rect((21,22,26,32),0);a.rect((21,22,25,30),'#b2b39a')
 a.line((21,22,25,22),'#ebe0b2');a.rect((22,24,24,29),'#61716b')
 a.rect((23,25,23,28),'#242e2e');a.rect((22,25,24,26),'#242e2e')
 a.rect((9,41,13,42),0);a.rect((34,41,38,42),0)
 return a.finish()

def well(v):
 a=art('stone',v)
 # Coaxial elliptical rims on a vertical cylinder. Upper and lower courses
 # share the same curved face; joints are staggered, not diagonal wedges.
 a.ell((4,23,43,44),0);a.rect((4,25,43,33),0)
 a.ell((5,23,42,43),2);a.rect((5,25,42,33),2)
 a.ell((6,24,39,42),3);a.rect((6,26,39,32),3)
 a.poly([(8,27),(34,27),(34,36),(30,41),(17,41),(9,37)],4)
 a.poly([(36,27),(42,27),(42,35),(38,40),(33,42),(35,37)],2)
 # Course mortar follows the front half of an ellipse.
 a.line((5,32,8,35,15,38,32,38,39,35,42,32),1)
 a.line((7,33,10,35,16,37,31,37,38,35),5)
 for pts in [(11,29,11,35),(23,30,23,37),(35,29,35,36),(17,39,17,42),(30,39,30,42)]:
  a.line(pts,1)
 for pts in [(12,30,12,34),(24,31,24,36),(18,39,18,41),(31,39,31,41)]:a.line(pts,5)
 a.line((11,39,16,41,28,42),3)
 # The opening is lower inside the rim: its rear face is visible above a
 # dark floor, while the front capstones overlap it.
 a.ell((3,17,44,33),0);a.ell((4,18,43,32),4)
 a.ell((6,19,41,31),5);a.ell((10,21,37,30),0)
 a.ell((11,22,36,30),1);a.rect((14,23,33,25),2)
 a.line((16,22,31,22),3);a.line((12,24,15,23),3)
 a.ell((12,25,35,30),0);a.line((17,27,30,27),1)
 a.line((18,24,18,25),1);a.line((29,23,29,25),1)
 # Radial capstone joints are confined to the annulus.
 for pts in [(13,18,15,21),(23,18,23,21),(34,19,32,22),(41,22,37,24),(40,28,36,27),(33,31,31,29),(23,32,23,30),(13,31,16,29),(6,27,10,26),(7,21,11,23)]:a.line(pts,2)
 for pts in [(15,18,21,18),(25,18,31,18),(8,21,11,20),(5,24,6,26),(9,29,12,30),(16,31,21,31),(25,31,30,31),(35,29,38,28)]:a.line(pts,7 if pts[0]<26 else 6)
 a.line((14,32,33,32),3)
 for box,c in [((8,30,9,31),5),((15,33,17,33),5),((27,34,28,35),3),((20,40,22,40),5),((33,38,34,39),3),((9,36,10,37),2),((37,31,38,32),3)]:a.rect(box,c)
 return a.finish()

def sack(v):
 a=art('cloth',v)
 # A broad, weighted sack; the shoulders flare into the belly gradually.
 a.poly([(19,21),(28,21),(30,25),(34,29),(36,34),(37,39),(35,42),(29,44),(17,44),(11,42),(10,39),(11,34),(14,28),(17,25)],0)
 a.poly([(19,23),(27,23),(29,27),(33,31),(35,37),(34,40),(29,42),(17,42),(12,40),(12,36),(15,30)],2)
 a.poly([(20,24),(26,24),(28,29),(31,33),(32,39),(28,42),(18,41),(13,39),(14,34),(17,29)],4)
 a.poly([(19,25),(21,24),(20,29),(17,33),(16,37),(14,37),(16,31)],5)
 a.poly([(23,25),(25,26),(26,32),(28,35),(27,39),(24,38),(24,33)],5)
 a.poly([(27,25),(29,28),(30,33),(32,37),(31,40),(29,40),(28,34)],3)
 a.line((21,24,20,27,19,30),2);a.line((25,24,26,28,26,31),2)
 a.line((17,28,16,31),3);a.line((28,28,29,32),1)
 a.line((13,38,15,41,20,42,28,42,33,40),3)
 a.line((17,43,29,43),1)
 # Collapsed fabric at the mouth, with overlapping folds. No circular hole.
 a.poly([(18,12),(22,11),(27,12),(30,15),(29,18),(26,22),(20,22),(16,18),(15,15)],0)
 a.poly([(18,13),(22,12),(27,13),(28,15),(26,18),(23,20),(18,18),(16,15)],4)
 a.poly([(19,13),(22,13),(21,16),(23,19),(20,18),(18,16)],6)
 a.poly([(24,13),(27,14),(26,17),(23,20),(22,18),(24,16)],2)
 a.line((17,14,18,16,20,17),7);a.line((24,13,26,14),6)
 a.line((21,13,22,15,21,17),3)
 # Warm cord is separate from the fabric and cinches the narrow neck.
 a.rect((19,21,27,23),'#4f3524');a.line((19,21,26,21),'#ba8347')
 a.line((20,22,26,22),'#d0a05f');a.line((27,22,29,24,29,27),'#61452b')
 for box,c in [((18,34,19,35),5),((20,38,22,38),5),((15,38,16,39),3),((28,37,29,38),4),((22,30,23,31),4),((31,35,32,36),2)]:a.rect(box,c)
 return a.finish()

PROOFS={'earthen-pot':pot,'metal-vessel':metal,'open-basket':basket,'bound-chest':chest,'well':well,'sack':sack}
