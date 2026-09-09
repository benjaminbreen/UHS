"""Prepare the small game atlas. Stdlib only; source pixels are never sampled as height."""
import json, hashlib, math, sys, urllib.request
from pathlib import Path
sys.setrecursionlimit(100000)
ROOT=Path(__file__).resolve().parent.parent
REV='ca96624a56bd078437bca8184e78163e5039ad19'
NAMES=['ne_10m_land','ne_10m_rivers_lake_centerlines']
EXPECTED={'ne_10m_land': '1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416', 'ne_10m_rivers_lake_centerlines': 'bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a', 'ne_10m_populated_places_simple': 'fd3fa867a320cbd5c5b6bb5bc550afeec2939fb2cef688e508007282a55ac42f'}
# The 10m coastline can put a port on its shore, but at one tolerance worldwide
# it is 4 MB. Within a degree of a gazetteer town coast keeps ~10-tile and
# rivers ~6-tile accuracy; elsewhere both are generalized to ~60 tiles.
FINE=.005; COARSE=.03; CELL=.5; MIN_ISLAND=.03; RIVER_FINE=.003
def fetch(name):
 url=f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/{name}.geojson'
 cache=ROOT/'scripts/source-cache'/f'{name}.geojson'
 cache.parent.mkdir(exist_ok=True,parents=True)
 if not cache.exists():
  with urllib.request.urlopen(url,timeout=120) as r: cache.write_bytes(r.read())
 raw=cache.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=EXPECTED[name]: raise ValueError("Atlas cache differs from pinned source: "+name)
 return url,raw
fine=set()
for f in json.loads(fetch('ne_10m_populated_places_simple')[1])['features']:
 p=f['properties']
 if p['scalerank']>4: continue
 cx,cy=math.floor(p['longitude']/CELL),math.floor(p['latitude']/CELL)
 for dx in (-1,0,1):
  for dy in (-1,0,1): fine.add((cx+dx,cy+dy))
def near_town(p): return (math.floor(p[0]/CELL),math.floor(p[1]/CELL)) in fine
def tolerance(p): return FINE if near_town(p) else COARSE
def river_tolerance(p): return RIVER_FINE if near_town(p) else COARSE
def simplify(points,tolerance=.003):
 """Douglas-Peucker; a callable tolerance is evaluated per point."""
 tol=tolerance if callable(tolerance) else (lambda p:tolerance)
 if len(points)<3:return points
 a,b=points[0],points[-1];dx=b[0]-a[0];dy=b[1]-a[1];den=dx*dx+dy*dy or 1
 best=0;idx=0
 for i,p in enumerate(points[1:-1],1):
  t=max(0,min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den))
  e=tol(p);d=((p[0]-a[0]-t*dx)**2+(p[1]-a[1]-t*dy)**2)/(e*e)
  if d>best:best=d;idx=i
 if best<=1:return [a,b]
 return simplify(points[:idx+1],tolerance)[:-1]+simplify(points[idx:],tolerance)
out={'version':3,'sources':[],'land':[],'rivers':[]}
for name in NAMES:
 url,raw=fetch(name)
 data=json.loads(raw)
 out['sources'].append({'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'license':'Public domain — Natural Earth'})
 for f in data['features']:
  g=f['geometry']; coords=g['coordinates']
  if name.endswith('land'):
   polys=[coords] if g['type']=='Polygon' else coords
   for poly in polys:
    for ring in poly:
     xs=[p[0] for p in ring];ys=[p[1] for p in ring]
     if max(xs)-min(xs)<MIN_ISLAND and max(ys)-min(ys)<MIN_ISLAND and not near_town(ring[0]): continue
     s=[[round(x,4),round(y,4)] for x,y,*_ in simplify(ring,tolerance)]
     if len(s)>=4: out['land'].append(s)
  else:
   lines=[coords] if g['type']=='LineString' else coords
   rank=f['properties'].get('scalerank',10)
   if rank is None or rank>6: continue
   for line in lines:
    out['rivers'].append({'name':f['properties'].get('name_en') or f['properties'].get('name') or 'River','points':[[round(x,4),round(y,4)] for x,y,*_ in simplify(line,river_tolerance)]})
path=ROOT/'src/content/geography/atlas.generated.json'
path.write_text(json.dumps(out,separators=(',',':')))
print(f'{len(out["land"])} land polygons; {len(out["rivers"])} river lines; {path.stat().st_size} bytes')
