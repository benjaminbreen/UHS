"""Second review set: ten everyday props, drawn at 48px with no ground shadows.

Shared material ramps and mouth construction; individual silhouettes and surface
clusters. Camera faces fronts squarely, with top surfaces visible from above.
"""
from .proofs import art, well


def mouth(a,box):
 x,y,r,b=box
 a.ell(box,0);a.ell((x+1,y+1,r-1,b-1),4)
 a.ell((x+2,y+1,r-2,b-2),6)
 a.ell((x+4,y+3,r-4,b-2),1)
 a.ell((x+5,y+4,r-5,b-2),0)
 a.line((x+5,y+1,r-5,y+1),7)
 a.line((x+5,b-1,r-5,b-1),5)


def jar(v,glazed=False):
 a=art('clay',v)
 if glazed:
  a.p=[['#182c30','#244448','#32605c','#3c7c70','#529686','#78b3a0','#a6d4be','#d3ebce'],
       ['#202c3b','#304457','#3b5d77','#477f9a','#64a1b3','#8bbec9','#b7d9d7','#e3ece0'],
       ['#34362c','#635d45','#8b8262','#b1a784','#cec39a','#e2d7b1','#f2e9ca','#fff4df']][v%3]
 a.poly([(18,13),(29,13),(31,17),(35,20),(38,27),(38,35),(35,41),(30,44),(18,44),(12,40),(9,34),(10,26),(13,19),(17,16)],0)
 a.poly([(18,15),(28,15),(30,19),(34,22),(36,28),(36,35),(33,40),(28,42),(18,42),(13,38),(11,33),(12,26),(15,20)],2)
 a.poly([(18,17),(27,17),(31,22),(33,28),(32,36),(28,41),(20,42),(15,38),(12,32),(14,25)],3)
 a.poly([(18,20),(23,19),(28,21),(30,27),(29,34),(25,38),(19,37),(15,33),(14,27)],4)
 a.poly([(16,22),(20,20),(22,21),(19,26),(18,32),(16,34),(14,30)],5)
 a.poly([(14,25),(16,23),(18,24),(17,27),(15,28),(14,27)],6)
 a.line((12,29,12,34,15,38),3)
 a.poly([(33,23),(36,29),(35,36),(32,40),(27,42),(22,42),(27,39),(31,35)],1)
 a.line((18,43,28,43),1)
 if glazed:
  a.line((13,24,33,24),2);a.line((14,25,32,25),5)
  a.rect((15,27,17,30),6);a.rect((15,27,16,28),7)
  a.line((18,33,18,36,21,38),5);a.line((22,41,28,41),4)
  mouth(a,(15,10,32,18))
 else:
  for box,c in [((23,26,25,27),5),((19,35,21,36),5),((29,31,31,32),3),((16,30,17,31),4),((25,39,27,39),3),((30,23,32,24),4)]:a.rect(box,c)
  # Ceramic lid seated in a shaded neck; an off-center highlight on its knob.
  a.ell((14,11,33,20),0);a.ell((15,11,32,18),3)
  a.ell((17,10,30,16),5);a.line((19,11,27,11),6)
  a.line((18,18,29,18),1);a.line((18,16,29,16),4)
  a.ell((20,7,28,12),0);a.ell((21,7,27,10),4)
  a.line((22,7,25,7),7);a.rect((22,8,23,9),6)
 return a.finish()


def jug(v,amphora=False):
 a=art('clay',v)
 # Handles are behind the vessel. Transparent openings survive shadow masks.
 for x in ([8,30] if amphora else [29]):
  a.ell((x,17,x+10,31),0);a.ell((x+1,18,x+9,29),3)
  a.ell((x+2,20,x+8,28),(0,0,0,0))
  a.line((x+2,20,x+4,18,x+6,18),6);a.line((x+8,21,x+8,26),2)
 if amphora:
  outline=[(19,12),(28,12),(28,21),(32,25),(34,30),(32,36),(28,41),(27,44),(20,44),(19,41),(15,36),(13,30),(15,25),(19,21)]
 else:
  outline=[(19,12),(27,12),(27,22),(30,26),(33,29),(34,35),(31,41),(26,44),(18,43),(13,39),(12,33),(14,28),(18,23)]
 a.poly(outline,0)
 a.poly([(20,14),(26,14),(26,23),(30,28),(32,32),(30,38),(26,42),(20,41),(16,37),(14,32),(16,28),(20,23)],2)
 a.poly([(21,15),(24,15),(24,24),(28,29),(29,34),(26,39),(21,40),(17,36),(16,32),(18,27),(21,23)],4)
 a.poly([(20,24),(22,24),(20,29),(19,33),(20,37),(18,36),(16,32),(18,28)],5)
 a.line((19,28,18,31,18,33),6);a.line((21,16,21,21),5)
 a.poly([(28,27),(31,31),(31,35),(28,39),(25,41),(23,41),(27,36),(28,32)],1)
 a.line((16,36,18,39,21,41),3)
 for box,c in [((23,31,25,32),5),((24,36,26,37),3),((20,38,21,38),5),((27,28,28,29),3)]:a.rect(box,c)
 mouth(a,(16,8,31,16))
 if amphora:
  a.ell((18,41,29,45),0);a.ell((19,41,28,43),4);a.line((21,41,26,41),6)
 return a.finish()


def lidded_basket(v):
 a=art('fiber',v)
 a.poly([(9,19),(38,19),(37,36),(34,41),(29,44),(18,44),(12,40),(10,34)],0)
 a.poly([(11,21),(36,21),(35,35),(32,40),(28,42),(18,42),(14,38),(12,32)],2)
 for y in [25,29,33,37,41]:
  l=12+(y-25)//8;r=35-(y-25)//8
  a.line((l,y-1,l+4,y+1,r-4,y+1,r,y-1),1)
  for x in range(l+1,r-1,4):
   yy=y+(1 if 16<x<30 else 0)
   a.line((x,yy,x+2,yy),6 if x<24 else 4)
   a.line((x,yy+1,x+2,yy+1),4 if x<24 else 3)
 for x in [15,22,29,34]:
  for y in [27,31,35,39]:
   a.line((x,y,x,y+1),5 if x<25 else 3)
 # Concentric woven lid, with irregular but coherent spiral courses.
 a.ell((7,13,40,25),0);a.ell((8,13,39,23),4)
 a.ell((10,14,37,21),6);a.ell((13,15,34,20),3)
 a.ell((15,15,32,19),5);a.line((17,16,30,16),7)
 a.line((14,22,32,22),6);a.line((15,24,31,24),2)
 for pts in [(14,14,15,16),(23,13,23,15),(33,15,32,17),(36,19,38,20),(28,21,28,23),(18,21,18,23),(10,18,12,19)]:a.line(pts,2)
 a.ell((20,8,28,16),0);a.ell((21,9,27,14),5)
 a.ell((23,10,25,12),(0,0,0,0));a.line((22,9,25,9),7)
 return a.finish()


def barrel(v):
 a=art('wood',v)
 a.poly([(15,12),(32,12),(36,16),(39,25),(39,33),(36,40),(31,44),(16,44),(11,40),(8,33),(8,25),(11,16)],0)
 a.poly([(15,14),(31,14),(34,18),(37,25),(37,33),(34,39),(30,42),(17,42),(13,38),(10,32),(10,26),(13,18)],2)
 # Staves bend with the barrel's bulge; each has its own grain line.
 for pts,c in [([(15,16),(19,17),(18,40),(15,39),(12,31)],4), ([(20,16),(24,16),(24,42),(19,41)],5), ([(25,16),(29,16),(31,39),(26,42)],3), ([(30,16),(33,19),(36,29),(33,38),(32,38)],2)]:a.poly(pts,c)
 for pts in [(18,18,16,29,17,39),(24,18,24,40),(29,18,31,29,29,40)]:a.line(pts,1)
 a.line((13,23,12,29,13,34),5);a.line((20,21,20,28,21,34),6)
 a.line((27,24,28,28,27,34),4)
 # Hoops shade around the curvature, with a single light top edge.
 for y in [21,35]:
  a.line((10,y,16,y+2,31,y+2,37,y), '#222e32',3)
  a.line((11,y-1,17,y+1,30,y+1,36,y-1),'#85928c')
  a.line((16,y+3,31,y+3),'#33454c')
  for x in [14,32]:a.rect((x,y+1,x,y+1),'#bac0a4')
 a.ell((12,10,35,19),0);a.ell((13,11,34,18),4)
 a.ell((15,12,32,16),5);a.line((17,12,29,12),7)
 a.line((17,14,30,14),3);a.line((22,12,21,16),2)
 a.line((16,17,30,17),2);a.line((17,42,29,42),3)
 return a.finish()


def crate(v):
 a=art('wood',v)
 a.rect((6,19,41,42),0);a.rect((8,21,39,40),1)
 for y in [22,28,34]:
  a.rect((9,y,38,y+3),3);a.line((10,y,37,y),5)
  a.line((13,y+2,20,y+2),2);a.line((27,y+1,34,y+1),4)
 # Top plane aligned with the camera, slats foreshortened, no side face.
 a.poly([(6,19),(11,12),(36,12),(41,19)],0)
 a.poly([(9,18),(13,13),(34,13),(38,18)],4)
 for y in [15,18]:a.line((11,y,36,y),2);a.line((13,y-1,34,y-1),6)
 for x in [7,36]:
  a.rect((x,19,x+4,41),2);a.line((x,20,x,39),6);a.line((x+1,20,x+1,39),4)
 a.rect((7,19,40,22),3);a.line((8,19,39,19),6)
 a.rect((7,38,40,41),3);a.line((8,38,39,38),5)
 # Diagonal reinforcing board belongs to the front, not perspective skew.
 a.line((12,37,35,24),1,5);a.line((12,36,35,23),4,3);a.line((12,35,35,22),6)
 for x,y in [(9,21),(38,21),(9,40),(38,40),(14,35),(33,24)]:
  a.rect((x,y,x,y),0);a.rect((x,y-1,x,y-1),5)
 return a.finish()


def bucket(v):
 a=art('wood',v)
 # Keep all three studies wooden, with differing wood ramps; iron fittings
 # retain their own material rather than being recolored with the body.
 a.d.arc((10,8,37,33),180,360,fill='#26343a',width=3)
 a.d.arc((11,9,36,31),185,355,fill='#a0aea3',width=1)
 a.rect((19,7,28,10),0);a.rect((20,7,27,9),4);a.line((21,7,26,7),6)
 a.poly([(10,24),(37,24),(35,37),(31,43),(17,43),(12,37)],0)
 a.poly([(12,25),(35,25),(33,37),(29,41),(18,41),(14,36)],2)
 for pts,c in [([(15,26),(19,26),(20,41),(17,40)],4), ([(20,26),(25,26),(25,42),(21,42)],5), ([(26,26),(30,25),(30,40),(26,42)],3)]:a.poly(pts,c)
 for pts in [(19,27,20,40),(25,27,25,41),(31,27,30,39)]:a.line(pts,1)
 a.line((15,30,16,36),6);a.line((23,29,23,36),4)
 for y in [29,38]:
  a.line((13,y,18,y+2,30,y+2,34,y),'#26363c',2)
  a.line((14,y,19,y+1,29,y+1,33,y),'#84938b')
 mouth(a,(9,19,38,29))
 a.rect((10,24,11,27),'#26363c');a.rect((36,24,37,27),'#26363c')
 a.rect((10,24,10,24),'#d0caa8');a.rect((36,24,36,24),'#a4aea1')
 return a.finish()


def trough(v):
 a=art('wood' if v==0 else 'stone',v)
 a.poly([(5,28),(42,28),(41,39),(37,42),(10,42),(6,39)],0)
 a.rect((7,29,40,39),2);a.rect((10,30,36,40),3)
 a.line((8,34,39,34),1);a.line((10,35,37,35),4)
 a.rect((9,41,13,44),0);a.rect((34,41,38,44),0)
 a.line((10,41,10,43),3);a.line((35,41,35,43),3)
 # The far rim is higher on screen; the basin visibly recedes behind front.
 a.poly([(4,27),(9,20),(38,20),(43,27),(42,31),(5,31)],0)
 a.poly([(6,27),(10,21),(37,21),(41,27),(40,29),(7,29)],4)
 a.poly([(10,25),(13,23),(34,23),(37,25),(36,27),(11,27)],0)
 a.poly([(12,25),(15,24),(32,24),(35,26),(13,27)],'#244d59')
 a.line((15,25,30,25),'#398aa2');a.line((17,25,22,25),'#83c0c2')
 a.line((8,28,39,28),6);a.line((11,21,36,21),6)
 if v==0:
  for x in [8,37]:a.rect((x,29,x+2,40),2);a.line((x,29,x,39),5)
  a.line((16,31,24,31),4);a.line((24,37,32,37),1)
  a.line((15,39,21,39),4)
 else:
  for x in [16,29]:a.line((x,30,x,33),1)
  a.line((23,35,23,40),1);a.rect((12,32,14,32),5)
 return a.finish()


def roofed_well(v):
 a=art('wood',v)
 # Existing masonry form anchors this construction at exactly the same scale.
 # Draw supports behind masonry, then composite the shaft, crank and roof.
 for x in [8,36]:
  a.rect((x,10,x+3,37),0);a.rect((x+1,11,x+2,36),3)
  a.line((x+1,12,x+1,34),5)
 # Reuse the masonry palette and courses in a shorter wellhead. The roofed
 # construction has a lower curb so the supports and winding gear stay legible.
 from PIL import Image
 base=well(v);base=base.crop(base.getbbox()).resize((36,20),Image.Resampling.NEAREST)
 a.im.alpha_composite(base,(6,25))
 a.rect((10,20,37,23),0);a.rect((11,20,36,22),3)
 a.line((12,20,34,20),5)
 a.rect((20,18,27,24),1)
 for x in [21,23,25]:a.line((x,19,x,23),5);a.rect((x,19,x,19),7)
 a.line((24,24,24,31),'#d6ba7c');a.line((25,24,25,31),'#675035')
 a.line((35,22,39,22,39,26),0,3);a.line((35,21,39,21,39,25),4)
 # A front-facing pitched roof: horizontal ridge/eave, equal slopes at sides.
 a.poly([(3,15),(10,5),(37,5),(44,15),(44,18),(3,18)],0)
 a.poly([(5,15),(11,6),(36,6),(42,15)],3)
 a.line((11,6,36,6),6)
 for x in [12,19,26,33,40]:
  a.line((x-4,14,x-1,7),1);a.line((x-3,14,x,7),5)
 a.line((5,15,42,15),5);a.rect((4,16,43,17),2)
 a.line((14,10,17,10),4);a.line((27,12,30,12),4)
 return a.finish()

DAILY = {
 'storage-jar':lambda v:jar(v),
 'water-jug':lambda v:jug(v),
 'amphora':lambda v:jug(v,True),
 'glazed-jar':lambda v:jar(v,True),
 'lidded-basket':lidded_basket,
 'barrel':barrel,
 'crate':crate,
 'bucket':bucket,
 'trough':trough,
 'framed-well':roofed_well,
}
