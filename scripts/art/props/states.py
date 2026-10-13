"""Runtime-only stick and broken remains, with no baked ground shadows."""
from .proofs import art

def runtime_sprites():
 from PIL import Image
 im=Image.new('RGBA',(48,48));bark=['#3b2a1c','#5c4129','#7d5b39','#9c784c','#bd9a68']
 # A forked branch lying on the ground, lit along its upper edge.
 for (x0,y0),(x1,y1),w in [((14,42),(33,33),2),((26,37),(31,30),1),((33,33),(36,33),1)]:
  n=max(abs(x1-x0),abs(y1-y0))
  for i in range(n+1):
   x=round(x0+(x1-x0)*i/n);y=round(y0+(y1-y0)*i/n)
   im.putpixel((x,y-1),Image.new('RGBA',(1,1),bark[4]).getpixel((0,0)))
   for k in range(w):im.putpixel((x,y+k),Image.new('RGBA',(1,1),bark[2]).getpixel((0,0)))
   im.putpixel((x,y+w),Image.new('RGBA',(1,1),bark[0]).getpixel((0,0)))
 for x,y in ((20,39),(27,35)):im.putpixel((x,y),Image.new('RGBA',(1,1),bark[1]).getpixel((0,0)))
 im.putpixel((13,42),Image.new('RGBA',(1,1),'#d8bf8c').getpixel((0,0)))
 result={'study-prop-stick-0':im}
 for kind,material in [('clay','clay'),('wood','wood'),('fiber','fiber')]:
  a=art(material,0)
  for points in [[(10,40),(15,34),(19,40),(16,43)],[(21,42),(24,35),(30,39),(27,44)],[(31,42),(36,36),(39,42)]]:
   a.poly(points,1);a.line(tuple(sum(([x,y] for x,y in points[:2]),[])),5)
   a.line((points[0][0]+1,points[0][1],points[1][0],points[1][1]+1),3)
  result[f'prop-broken-{kind}']=a.finish()
 for im in result.values():im.info['anchor']=[24,48]
 return result
