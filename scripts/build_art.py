"""Original, palette-limited pixel recipes. No downloaded pixels are used.
Run with Pillow 10+. Integer coordinates and seeded decoration keep builds repeatable.
Sprites may span cells; collision footprints belong to world data, not opaque pixels.
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json, random, math
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/packs'; OUT.mkdir(exist_ok=True,parents=True)
S={}
P={'ink':'#343c35','grass':'#778b43','grassL':'#8d9b4d','grassD':'#6c813d','sand':'#b9ae77','dirt':'#b9a072','dirtL':'#c5ad7a','water':'#20616d','waterL':'#418c94','stone':'#bab49a','stoneD':'#9a9b86','stoneL':'#cfccb4','roof':'#b55235','roofL':'#dd7948','roofD':'#6d382d','plaster':'#d6c69c','plasterL':'#e6d7ae','plasterD':'#b4a07d','wood':'#816342','woodL':'#b29361','leaf':'#5b7d45','leafL':'#839950','leafD':'#3e633e'}
def new(w,h):
 im=Image.new('RGBA',(w,h)); return im,ImageDraw.Draw(im)
def add(n,im): S[n]=im
for theme,base,hi,lo in [('grass',P['grass'],P['grassL'],P['grassD']),('dry','#a8ad70','#b6b87c','#949b62'),('dirt',P['dirt'],P['dirtL'],'#ab926a'),('sand','#c5b47e','#d1c08a','#b8a976'),('water',P['water'],P['waterL'],'#235965'),('field','#8b7753','#a08b5c','#78694b'),('floor','#b89a6b','#c7ac7c','#a08660')]:
 for v in range(4):
  im,d=new(16,16);d.rectangle((0,0,15,15),fill=base);r=random.Random(v+len(theme)*57)
  for j in range(5 if theme!='water' else (2 if v==0 else 0)):
   x,y=r.randrange(1,14),r.randrange(1,15);d.line((x,y,x+(r.randrange(1,4) if theme=='water' else 1),y),fill=hi if j%2 else lo)
  if theme=='grass':
   for x,y in [(2+v,3),(10,9+v)]: d.point((x,y),fill=lo);d.line((x+1,y-1,x+1,y),fill=hi)
  if theme=='field':
   for y in [3,11]:
    d.line((0,y,15,y),fill=lo);d.line((0,y+1,15,y+1),fill=hi)
    for x in range(2,16,5):
     d.line((x,y+1,x,y-3),fill='#a7a05b');d.line((x-1,y-2,x+1,y-2),fill='#d4b96f')
  add(f'{theme}{v}',im)
# Broken limestone flagstones: quiet broad faces, irregular joints and chipped corners.
for v in range(4):
 im,d=new(16,16);d.rectangle((0,0,15,15),fill='#969582');r=random.Random(381+v)
 for row in range(2):
  y=row*8;offset=[0,4,1,5][(row+v)%4]
  for col in range(-1,3):
   x=col*9+offset;c=['#bab6a0','#b4b09b','#aaa995','#bfb9a2'][r.randrange(4)]
   d.polygon([(x+1,y),(x+7,y),(x+8,y+1),(x+8,y+6),(x+6,y+7),(x+1,y+7),(x,y+5),(x,y+1)],fill=c)
   d.line((x+2,y+1,x+5,y+1),fill='#cbc4ad');d.line((x+2,y+7,x+5,y+7),fill='#a2a08d')
   if r.random()<.5:d.point((x+3,y+4),fill='#aaa995')
 add(f'paving{v}',im)
im,d=new(16,16);d.rectangle((0,0,15,15),fill=P['wood']);
for x in [0,5,10,15]: d.line((x,0,x,15),fill=P['woodL'])
d.line((0,3,15,3),fill='#665640');d.line((0,12,15,12),fill='#665640');add('bridge',im)
for name in ['bush','reeds','rock','flowers','wheat','flax','log','basket','amphora','jug','well','fire','bench','gate','gate-open','fence','ladder','door','door-open','mat','bed','oven','crate','fish','tool','bread','grain','coin','obsidian','wool']:
 w,h=(32,32) if name in ['well','oven'] else (16,24)
 im,d=new(w,h);d.ellipse((2,h-7,w-2,h-2),fill=(39,44,32,65))
 if name in ['amphora','jug']:
  d.ellipse((3,7,13,21),fill='#774d35');d.ellipse((4,6,12,19),fill='#be8650');d.rectangle((6,3,10,9),fill='#c89c60');d.line((6,3,10,3),fill='#695038');d.line((5,10,5,16),fill='#e0b978');
  if name=='amphora':d.arc((1,6,7,14),60,280,fill='#b08150',width=2);d.arc((9,6,15,14),260,120,fill='#b08150',width=2)
 elif name in ['basket','crate']:
  d.rectangle((3,10,13,20),fill='#8b6941');d.rectangle((4,11,12,18),fill='#bb9258')
  for y in [12,15,18]:d.line((3,y,13,y),fill='#7b603d')
  if name=='basket':d.ellipse((3,7,13,12),fill='#c0a271');d.ellipse((5,8,11,10),fill='#665439')
  else:d.line((4,11,12,18),fill='#d0af72',width=2)
 elif name in ['bush','flowers','flax']:
  for x,y in [(5,17),(10,15),(8,11)]:d.ellipse((x-4,y-4,x+4,y+4),fill='#47643c');d.ellipse((x-3,y-4,x+3,y),fill='#879b51')
  if name!='bush':
   for x,y in [(4,13),(9,9),(11,16)]:d.rectangle((x,y,x+1,y+1),fill='#d9bb79' if name=='flowers' else '#8ca6b7')
 elif name in ['reeds','wheat']:
  for x,y in [(3,9),(7,5),(11,8),(14,11)]:d.line((x,21,x,y),fill='#718048');d.line((x,y,x,y+5),fill='#bea361' if name=='wheat' else '#8f7949',width=2)
 elif name=='rock':
  d.polygon([(2,18),(3,12),(7,8),(12,10),(15,17),(11,21),(4,21)],fill='#636d60');d.polygon([(3,16),(4,12),(8,9),(12,11),(10,16)],fill='#a5ab91');d.line((10,16,12,20),fill='#87907d')
 elif name in ['fence','gate','gate-open','ladder']:
  for x in [2,13]:d.rectangle((x,5,x+1,22),fill='#665337');d.line((x,6,x,20),fill='#aa8c59')
  ys=[7,11,15,19] if name=='ladder' else [10,17]
  for y in ys:d.rectangle((3,y,13 if name!='gate-open' else 5,y+1),fill='#ac8e5b')
 elif name in ['door','door-open']:
  d.rectangle((3,4,13,23),fill='#554c3b')
  if name=='door':
   d.rectangle((4,5,12,22),fill='#876a44');d.line((8,6,8,22),fill='#a88a57');d.rectangle((10,14,11,15),fill='#d2b579')
 elif name in ['well','oven']:
  d.ellipse((4,12,28,29),fill='#777766');d.rectangle((4,14,28,23),fill='#a2a087');d.ellipse((4,8,28,21),fill='#d2c7a3');d.ellipse((8,11,24,18),fill='#595e52');d.ellipse((10,13,22,17),fill='#487d7e')
  if name=='oven':d.ellipse((5,4,27,25),fill='#b99b71');d.ellipse((11,15,21,25),fill='#564d3b')
  for x in [7,15,23]:d.line((x,20,x,25),fill='#777968')
 elif name=='fire':
  d.ellipse((1,16,15,23),fill='#777b68');d.ellipse((3,17,13,21),fill='#514d3e');d.polygon([(4,19),(3,15),(7,10),(8,5),(11,12),(12,17),(10,21)],fill='#c57740');d.polygon([(6,19),(7,13),(9,10),(10,18),(8,20)],fill='#ebc565')
 elif name in ['mat','bed','bench','log']:
  d.rectangle((1,12,14,20),fill='#766040');d.rectangle((2,12,13,17),fill='#ae9162')
  if name in ['bed','mat']:d.rectangle((3,12,12,19),fill='#b89469');d.rectangle((3,12,6,18),fill='#d2c397')
 elif name=='tool':
  d.polygon([(3,19),(11,7),(13,3),(14,9),(7,19)],fill='#727e73');d.line((6,15,13,5),fill='#c4c9ab',width=2);d.line((3,21,7,16),fill='#916d46',width=3);d.line((4,15,8,19),fill='#b29a65')
 elif name=='bread':
  d.ellipse((2,10,14,21),fill='#906d40');d.ellipse((2,8,14,19),fill='#c69d5f');d.arc((3,9,13,18),190,290,fill='#e2bd79');
  for x in [5,8,11]:d.line((x,10,x-2,14),fill='#976d3e')
 elif name=='coin':
  d.ellipse((3,10,13,20),fill='#94753d');d.ellipse((3,8,13,18),fill='#d1ae59');d.arc((4,9,12,17),190,320,fill='#efce7d');d.line((8,11,8,15),fill='#947440');d.line((6,13,10,13),fill='#ae8c49')
 elif name=='grain':
  d.polygon([(4,9),(12,9),(14,18),(12,21),(3,21),(2,17)],fill='#a2854d');d.polygon([(5,10),(10,10),(12,18),(5,19)],fill='#c4a569');d.ellipse((4,7,12,11),fill='#dcc281');d.line((5,9,11,9),fill='#856b3e')
 elif name=='fish':
  d.polygon([(2,11),(5,14),(2,18)],fill='#668b84');d.ellipse((5,10,14,18),fill='#83a19a');d.line((7,11,12,11),fill='#bed0b7');d.point((12,13),fill='#334b45');d.line((10,17,8,20),fill='#58796e')
 elif name=='obsidian':
  d.polygon([(2,18),(6,8),(11,5),(13,17),(9,21)],fill='#3e4649');d.polygon([(6,10),(11,6),(8,17),(3,18)],fill='#71817b');d.line((11,7,10,15),fill='#9daa96')
 elif name=='wool':
  for x,y in [(5,14),(10,13),(9,18),(4,18)]:d.ellipse((x-3,y-3,x+3,y+3),fill='#dbd4b2');d.arc((4,12,11,19),30,300,fill='#aaa888')
 add(name,im)
for name in ['sheep','goat','lizard','chicken']:
 for frame in range(2):
  im,d=new(24,20);d.ellipse((3,16,22,19),fill=(29,39,28,60))
  if name=='lizard':
   d.line((4,14,12,11,19,12),fill='#708b48',width=2);d.line((9,12,8,16),fill='#556c3d');d.line((13,12,15,15),fill='#556c3d');d.point((19,11),fill='#343d33')
  elif name=='chicken':
   d.ellipse((7,7,16,14),fill='#ded8b6');d.rectangle((15,5,18,10),fill='#d5cba7');d.point((18,7),fill='#373f35');d.rectangle((15,4,17,5),fill='#ad624a');d.line((10,14,10+frame,17),fill='#a78b52')
  else:
   for x in [6,15]:d.line((x,13,x+frame,17),fill='#6b5e45',width=2)
   d.ellipse((3,5,18,14),fill='#89866c');d.ellipse((3,4,18,12),fill='#d8d1ad' if name=='sheep' else '#bba57a');d.rectangle((16,4,21,10),fill='#615b47');d.line((17,3,18,1),fill='#b9aa7a');d.point((20,5),fill='#ddd8b8')
   if name=='sheep':
    for x,y in [(6,5),(10,4),(14,6),(9,9)]:d.line((x,y,x+2,y),fill='#eeead0')
  add(f'{name}{frame}',im)
# A complete small civic facade, using the same wall/roof colors.
im,d=new(112,88);d.rectangle((5,72,106,83),fill='#9d9d87');d.rectangle((9,70,102,76),fill='#d3c9a5');d.rectangle((14,33,97,70),fill='#b7a783');d.polygon([(5,33),(55,7),(106,33)],fill='#9b674a');d.polygon([(10,31),(55,11),(101,31)],fill='#d3bf92');d.line((11,33,101,33),fill='#e2d2a7',width=3)
for x in [17,37,69,89]:d.rectangle((x,37,x+5,69),fill='#d6c9a6');d.line((x+5,38,x+5,69),fill='#a99978');d.rectangle((x-2,35,x+7,38),fill='#e0d3ae');d.rectangle((x-2,68,x+7,71),fill='#e0d3ae')
d.rectangle((49,45,63,71),fill='#5d5b48');add('hall',im)
# Portraits use the same identities and cloth palette as world sprites, drawn at 56 x 60.
# Stepped silhouettes, a fixed upper-left light, and small reusable facial planes.
for skin_i,(skin,light,shade) in enumerate([('#c49468','#e4b387','#98633f'),('#a77550','#c69a70','#785037'),('#dbb58a','#efcca2','#ad805b')]):
 for cloth_i,cloth in enumerate(['#ded5b4','#9a5c46','#527b7b','#7d8060','#ad8d53','#6b6b86']):
  im,d=new(56,60);d.rectangle((0,0,55,59),fill='#625d52')
  d.polygon([(0,0),(43,0),(24,59),(0,59)],fill='#716957')
  outline='#252524';hair='#302e29';hair_hi='#504a3e'
  d.polygon([(2,59),(2,52),(7,47),(17,43),(20,38),(20,32),(15,28),(15,16),(19,8),(27,4),(37,5),(43,10),(46,17),(44,23),(46,31),(41,37),(35,40),(35,43),(47,48),(53,54),(54,59)],fill=outline)
  d.polygon([(5,59),(5,53),(11,48),(21,44),(31,47),(37,44),(47,49),(51,55),(51,59)],fill=cloth)
  d.polygon([(7,53),(16,48),(19,49),(14,59),(6,59)],fill='#c3b390' if cloth_i==0 else '#ab795b')
  d.polygon([(20,34),(33,34),(34,43),(39,47),(32,52),(24,48),(17,46),(21,41)],fill=shade)
  d.polygon([(22,35),(31,37),(30,43),(35,46),(30,48),(21,43)],fill=skin)
  d.polygon([(19,16),(26,12),(37,13),(42,18),(41,24),(43,28),(41,34),(35,38),(27,38),(22,34),(20,29),(17,27),(17,22),(20,22)],fill=shade)
  d.polygon([(22,17),(28,14),(37,16),(40,19),(39,24),(41,28),(38,32),(31,35),(25,32),(23,27)],fill=skin)
  d.polygon([(23,18),(29,16),(34,17),(31,22),(24,23)],fill=light)
  d.rectangle((18,23,20,27),fill=skin);d.point((19,24),fill=light)
  d.polygon([(16,20),(16,15),(19,9),(25,6),(33,6),(40,9),(43,14),(42,19),(38,17),(37,13),(34,16),(31,13),(28,16),(25,15),(22,19),(22,27),(20,27),(20,19)],fill=hair)
  for x,y in [(19,13),(22,10),(27,8),(31,9),(36,10),(39,13),(24,13),(29,11),(17,17)]:
   d.rectangle((x,y,x+2,y+1),fill=hair_hi);d.point((x,y-1),fill='#645c49')
  d.line((25,22,29,21),fill=hair);d.line((35,21,38,22),fill=hair)
  d.rectangle((27,23,28,24),fill=outline);d.rectangle((36,23,37,24),fill=outline)
  d.line((33,23,32,28),fill=light);d.line((33,29,36,29),fill=shade)
  d.line((29,33,36,33),fill='#694832');d.point((30,32),fill=light)
  if skin_i==0:
   d.polygon([(22,28),(25,32),(29,34),(31,32),(36,32),(39,29),(39,35),(35,39),(28,38),(24,35)],fill=hair)
   d.line((29,33,35,33),fill=shade);d.line((28,36,31,37),fill=hair_hi);d.point((36,35),fill=hair_hi)
  d.polygon([(38,44),(44,46),(39,59),(29,59)],fill='#653e32' if cloth_i==1 else '#776950')
  d.line((39,46,33,58),fill='#c58a65' if cloth_i==1 else '#dfcba1',width=2)
  d.line((13,51,11,58),fill='#8b795c');d.line((22,49,19,57),fill='#8b795c');d.line((47,52,48,59),fill='#503f34')
  add(f'portrait-human-{skin_i}-{cloth_i}',im)
# Stone river retaining walls live on the water side, preserving walkable bank tiles.
for side in ['east','west','north','south']:
 im,d=new(16,16)
 if side in ['east','west']:
  x=10 if side=='east' else 0
  d.rectangle((x,0,x+5,15),fill='#555b51')
  for y in [0,8]:
   d.rectangle((x+1,y,x+5,y+6),fill='#9c9c89');d.line((x+2,y,x+5,y),fill='#d8ceb0');d.line((x+5,y+1,x+5,y+6),fill='#bab5a0')
  d.line((x,0,x,15),fill='#344a46')
 else:
  y=0 if side=='north' else 9
  d.rectangle((0,y,15,y+6),fill='#586359')
  for x in [0,8]:
   d.rectangle((x,y,x+6,y+5),fill='#9d9e8c');d.line((x,y,x+6,y),fill='#e0d5b5');d.line((x,y+5,x+6,y+5),fill='#777b6c')
 add(f'quay-{side}',im)
# A repeatable three-cell stone arch projects over water beneath the walking deck.
im,d=new(48,32)
d.rectangle((0,0,47,25),fill='#757d73')
for row in range(4):
 for col in range(-1,7):
  x=col*9+(row%2)*4;y=row*6
  d.rectangle((x,y,x+7,y+4),fill='#aaa997' if (row+col)%3 else '#bdb69e')
  d.line((x,y,x+6,y),fill='#ccc6ad')
d.ellipse((9,7,39,39),fill=(0,0,0,0));d.rectangle((9,22,39,31),fill=(0,0,0,0))
d.arc((6,5,41,42),180,360,fill='#656e63',width=3)
d.arc((7,5,40,40),185,355,fill='#c1beaa',width=3)
for x,y in [(11,12),(16,8),(22,6),(29,7),(35,10)]:d.line((x,y,x+1,y+3),fill='#818575')
d.rectangle((0,0,47,3),fill='#d5cdb1');d.line((0,4,47,4),fill='#616b60')
add('bridge-arch',im)
from art_world import paint_world
paint_world(S)
from art.buildings import build_buildings
from art.shadows import build_shadows
buildings = build_buildings(ROOT, S)
build_shadows(S, buildings)
shadow_anchors={n:im.info['anchor'] for n,im in S.items() if 'anchor' in im.info}
(OUT/'shadows.json').write_text(json.dumps(shadow_anchors))
# Pack named frames into one texture. A 16px grid is a sampling unit, not an asset-size limit.
atlas=Image.new('RGBA',(1024,2048));frames={};x=y=rowh=0
for name,im in S.items():
 w,h=im.size
 if x+w+2>1024:x=0;y+=rowh+2;rowh=0
 atlas.paste(im,(x,y));frames[name]={'frame':{'x':x,'y':y,'w':w,'h':h},'sourceSize':{'w':w,'h':h},'spriteSourceSize':{'x':0,'y':0,'w':w,'h':h},'rotated':False,'trimmed':False};x+=w+2;rowh=max(rowh,h)
atlas=atlas.crop((0,0,1024,y+rowh+2));atlas.save(OUT/'atlas.png');(OUT/'atlas.json').write_text(json.dumps({'frames':frames,'meta':{'image':'atlas.png','scale':'1','size':{'w':atlas.width,'h':atlas.height}}}))
# Reviewable original-asset proof at exactly 3x nearest-neighbor scaling.
proof=Image.new('RGB',(1120,900),'#202127');d=ImageDraw.Draw(proof)
d.text((30,20),'UHS / ORIGINAL PIXEL LANGUAGE / 16px terrain / multi-cell silhouettes / graphics polish',fill='#d8c9a5')
for n,x,y in [('house-roman-0',20,55),('house-roman-2',285,55),('house-mud-0',565,95),('house-mud-1',820,95),('hall',20,440),('olive',390,490),('cypress',550,490),('hackberry',690,490),('portrait-human-0-1',900,420),('portrait-human-1-4',900,660),('amphora',380,775),('basket',450,775),('sheep0',520,775),('human-0-0-2-0',630,775),('human-1-3-2-0',715,775)]:
 im=S[n].resize((S[n].width*3,S[n].height*3),Image.Resampling.NEAREST);proof.paste(im,(x,y),im);d.text((x,y+im.height+6),{'human-0-0-2-0':'traveler','human-1-3-2-0':'farmer','portrait-human-0-1':'traveler portrait','portrait-human-1-4':'farmer portrait'}.get(n,n),fill='#b9b5aa')
(ROOT/'artifacts').mkdir(exist_ok=True);proof.save(ROOT/'artifacts/art-proof.png')
print(f'Built {len(S)} original frames; atlas {atlas.size}.')
names=[n for n,im in S.items() if im.size==(16,16) and not n.startswith(('edge-','bank-','ripple-','quay-','shadow-'))]
tiles=Image.new('RGBA',(16*len(names),16))
for i,n in enumerate(names):tiles.paste(S[n],(16*i,0))
tiles.save(OUT/'terrain.png');(OUT/'terrain.json').write_text(json.dumps({n:i for i,n in enumerate(names)}))

# Vite imports source manifests; Phaser fetches public copies. Both are generated here.
generated=ROOT/'src/render/generated';generated.mkdir(exist_ok=True,parents=True)
for name in ['atlas.json','terrain.json','shadows.json']:(generated/name).write_bytes((OUT/name).read_bytes())
