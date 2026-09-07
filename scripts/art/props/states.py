"""Runtime-only stick and broken remains, with no baked ground shadows."""
from .proofs import art

def runtime_sprites():
 a=art('wood',0)
 a.line((20,43,27,29),0,3);a.line((20,42,27,29),3,2);a.line((20,41,26,30),5)
 a.line((24,35,27,34),0,2);a.line((24,34,26,34),4)
 result={'study-prop-stick-0':a.finish()}
 for kind,material in [('clay','clay'),('wood','wood'),('fiber','fiber')]:
  a=art(material,0)
  for points in [[(10,40),(15,34),(19,40),(16,43)],[(21,42),(24,35),(30,39),(27,44)],[(31,42),(36,36),(39,42)]]:
   a.poly(points,1);a.line(tuple(sum(([x,y] for x,y in points[:2]),[])),5)
   a.line((points[0][0]+1,points[0][1],points[1][0],points[1][1]+1),3)
  result[f'prop-broken-{kind}']=a.finish()
 for im in result.values():im.info['anchor']=[24,48]
 return result
