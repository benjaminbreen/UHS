"""Small original pixel drawing vocabulary; every coordinate is a source pixel."""
from PIL import Image, ImageDraw

PALETTES = {
 'clay': ['#49382e','#805039','#b7794c','#d69f67','#efd09a'],
 'ochre': ['#453b29','#7e663a','#b08c4c','#d3b774','#efe0a7'],
 'redclay': ['#4c302b','#813d30','#b65b40','#d78459','#ecb781'],
 'glaze': ['#223c3c','#345c54','#518675','#81b399','#bfd4b1'],
 'blueglaze': ['#253746','#385c76','#578da5','#93bdc2','#dae0c8'],
 'creamglaze': ['#464135','#80765c','#b4aa87','#dbd0a9','#f3e7c9'],
 'wood': ['#3c3029','#694b32','#987045','#bd945d','#e0bd83'],
 'darkwood': ['#2e2b28','#4c3b30','#70523b','#98734f','#c19e71'],
 'paleWood': ['#423b2d','#786548','#aa8e61','#ceb582','#ecdaa6'],
 'fiber': ['#4b3c2b','#81704a','#b49c65','#d1be89','#ede0b2'],
 'reed': ['#343c2b','#5b6740','#8d9859','#b4bc78','#d6d49a'],
 'cloth': ['#423c32','#776b52','#ac9a73','#d0bd91','#e9ddba'],
 'rustcloth': ['#4a302d','#7b4540','#a96a54','#cb9470','#e1bb91'],
 'bluecloth': ['#29383c','#405d63','#62868c','#96b3ae','#c7d6c3'],
 'stone': ['#343c39','#616c60','#919b85','#b7bea2','#d7d9bb'],
 'sandstone': ['#454038','#7c735d','#a79b7a','#c9bc94','#e8dcb8'],
 'iron': ['#272e32','#424c50','#6a7778','#97a4a0','#c5d0bd'],
 'copper': ['#48332b','#79513a','#b07b49','#d8aa6c','#f1d6a1'],
 'plastic': ['#343d39','#536551','#7b9572','#abc293','#d4dfb7'],
}

def palette(material, variant=0):
 groups={'clay':['clay','ochre','redclay'],'wood':['wood','darkwood','paleWood'],
 'fiber':['fiber','reed','cloth'],'cloth':['cloth','rustcloth','bluecloth'],
 'stone':['stone','sandstone','stone'],'glaze':['glaze','blueglaze','creamglaze'],
 'metal':['copper','iron','creamglaze'],'plastic':['plastic','bluecloth','rustcloth']}
 return PALETTES[groups.get(material,[material])[variant % len(groups.get(material,[material]))]]

class Art:
 def __init__(self, material='wood', variant=0):
  self.im=Image.new('RGBA',(48,48)); self.d=ImageDraw.Draw(self.im); self.p=palette(material,variant)
 def rect(self,box,c): self.d.rectangle(box,fill=self.p[c] if isinstance(c,int) else c)
 def ell(self,box,c): self.d.ellipse(box,fill=self.p[c] if isinstance(c,int) else c)
 def poly(self,points,c): self.d.polygon(points,fill=self.p[c] if isinstance(c,int) else c)
 def line(self,points,c,width=1): self.d.line(points,fill=self.p[c] if isinstance(c,int) else c,width=width)
 def specks(self, points, c=3):
  for x,y in points:self.rect((x,y,x+1,y),c)
 def rim(self,box,inside=True):
  x,y,r,b=box;self.ell(box,0);self.ell((x+1,y,r-1,b-1),3)
  if inside:self.ell((x+3,y+2,r-3,b-2),0);self.line((x+4,y+3,r-4,y+3),1)
  self.line((x+3,b-1,r-3,b-1),4)
 def planks(self,box,vertical=False):
  x,y,r,b=box;self.rect(box,0);self.rect((x+1,y+1,r-1,b-1),2)
  if vertical:
   for xx in range(x+5,r,5):self.line((xx,y+1,xx,b-1),1);self.line((xx+1,y+2,xx+1,b-2),3)
  else:
   for yy in range(y+5,b,5):self.line((x+1,yy,r-1,yy),1);self.line((x+2,yy+1,r-2,yy+1),3)
 def finish(self): self.im.info['anchor']=[24,44];return self.im
