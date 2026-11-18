"""Small code-authored resource variants of the shared original plant atlas."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from art.atlas import pack_atlas
from art.habitat_plants import plant_candidate
root=Path(__file__).resolve().parent.parent
atlas=Image.open(root/'public/packs/atlas.png').convert('RGBA')
frames=json.loads((root/'public/packs/atlas.json').read_text())['frames']
def source(name):
 f=frames[name]['frame'];return atlas.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
tree=source('oak');d=ImageDraw.Draw(tree)
for x,y in [(17,20),(32,15),(40,30),(22,36),(13,42),(34,44),(27,26)]:
 d.rectangle((x,y,x+2,y+3),fill='#874537');d.point((x,y),fill='#e5b56b');d.point((x+1,y-1),fill='#465c2c')
bush=plant_candidate('berry',(24,26),True)
picked=plant_candidate('berry',(24,26),True,picked=True)
fruit=Image.new('RGBA',(16,16));d=ImageDraw.Draw(fruit);d.ellipse((4,5,12,13),fill='#a55b3f');d.rectangle((7,3,8,5),fill='#604a31');d.line((5,7,7,6),fill='#edbf73')
berries=Image.new('RGBA',(16,16));d=ImageDraw.Draw(berries)
for x,y in [(5,6),(9,5),(7,10)]:d.ellipse((x,y,x+3,y+3),fill='#985864');d.point((x+1,y),fill='#d38b94')
wood=Image.new('RGBA',(28,20));d=ImageDraw.Draw(wood)
for x,y in [(4,10),(8,14),(12,8)]:
 d.line((x,y,x+11,y-5),fill='#574631',width=3);d.line((x,y-1,x+11,y-6),fill='#b99056',width=1);d.line((x+5,y-3,x+5,y-7),fill='#735639',width=2)
grazing=Image.new('RGBA',(32,20));d=ImageDraw.Draw(grazing)
for x,y in [(5,13),(11,9),(17,16),(24,11),(28,18)]:
 d.line((x,y,x-3,y-5),fill='#466d3c',width=2);d.line((x,y,x+1,y-7),fill='#bac16e',width=1);d.line((x+1,y,x+4,y-4),fill='#6d8c43',width=2)
def patch(kind, count):
 im=Image.new('RGBA',(34,19));d=ImageDraw.Draw(im)
 for i,(x,y) in enumerate([(19,6),(7,10),(25,12),(13,16),(28,7),(3,14)]):
  if i>=count:continue
  if kind=='acorns':
   d.ellipse((x-2,y-2,x+2,y+2),fill='#735036')
   d.line((x-2,y-2,x+1,y-2),fill='#54452d');d.point((x+1,y),fill='#d5a362')
   d.point((x+3,y-2),fill='#a18348')
   continue
  if kind=='roots':
   d.ellipse((x-3,y-1,x+3,y+1),fill='#73583e');d.line((x,y-2,x+2,y-2),fill='#d1a967')
  for dx,dy in [(-4,-3),(0,-6),(4,-3)]:
   tip=(x+dx,y+dy+(i%2))
   d.polygon([(x,y),(x+dx//2-1,y+dy//2),tip,(x+dx//2+1,y+dy//2+1)],fill='#345339')
   d.line((x+dx//2,y+dy//2,*tip),fill='#86aa55' if dx<=0 else '#66904c')
  d.point((x,y-2),fill='#bdc777')
 return im
out=root/'public/ecology';out.mkdir(exist_ok=True)
sprites={'ecology-fruit-tree':tree,'ecology-berry-bush':bush,'ecology-berry-bush-picked':picked,'ecology-fruit-item':fruit,'ecology-berries-item':berries,'ecology-branches':wood,'ecology-grazing':grazing}
for kind in ('greens','roots','acorns'):
 for suffix,count in [('',6),('-thin',2)]:
  sprites[f'ecology-{kind}{suffix}']=patch(kind,count)
pack_atlas(sprites,out,'atlas',module=True)
