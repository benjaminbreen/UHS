"""Prepare the small game atlas. Stdlib only; source pixels are never sampled as height."""
import json, hashlib, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
REV='ca96624a56bd078437bca8184e78163e5039ad19'
NAMES=['ne_110m_land','ne_10m_rivers_lake_centerlines']
EXPECTED={'ne_110m_land': '9e0729ee253ca7d7a5c4ae9395fb1902264c5377c52e224d13dd85010e2835d9', 'ne_10m_rivers_lake_centerlines': 'bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a'}
def simplify(points,tolerance=.003):
 if len(points)<3:return points
 a,b=points[0],points[-1];dx=b[0]-a[0];dy=b[1]-a[1];den=dx*dx+dy*dy or 1
 best=0;idx=0
 for i,p in enumerate(points[1:-1],1):
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den))
  d=(p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2
  if d>best:best=d;idx=i
 if best<=tolerance*tolerance:return [a,b]
 return simplify(points[:idx+1],tolerance)[:-1]+simplify(points[idx:],tolerance)
out={'version':2,'sources':[],'land':[],'rivers':[]}
for name in NAMES:
 url=f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/{name}.geojson'
 cache=ROOT/'scripts/source-cache'/f'{name}.geojson'
 cache.parent.mkdir(exist_ok=True,parents=True)
 if not cache.exists():
  with urllib.request.urlopen(url,timeout=60) as r: cache.write_bytes(r.read())
 raw=cache.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=EXPECTED[name]: raise ValueError("Atlas cache differs from pinned source: "+name)
 data=json.loads(raw)
 out['sources'].append({'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'license':'Public domain — Natural Earth'})
 for f in data['features']:
  g=f['geometry']; coords=g['coordinates']
  if name.endswith('land'):
   polys=[coords] if g['type']=='Polygon' else coords
   out['land'] += [[[round(x,4),round(y,4)] for x,y,*_ in ring] for poly in polys for ring in poly[:1]]
  else:
   lines=[coords] if g['type']=='LineString' else coords
   rank=f['properties'].get('scalerank',10)
   if rank is None or rank>6: continue
   for line in lines:
    out['rivers'].append({'name':f['properties'].get('name_en') or f['properties'].get('name') or 'River','points':[[round(x,4),round(y,4)] for x,y,*_ in simplify(line)]})
path=ROOT/'src/content/geography/atlas.generated.json'
path.write_text(json.dumps(out,separators=(',',':')))
print(f'{len(out["land"])} land polygons; {len(out["rivers"])} river lines; {path.stat().st_size} bytes')
