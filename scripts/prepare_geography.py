"""Reproducible small geographic sample: Natural Earth -> WGS84 / UTM 33N.
Only pyproj is needed: clipping a handful of line segments does not need GDAL.
The prepared JSON ships with the app. The original data is public domain.
"""
import json, hashlib, urllib.request
from pathlib import Path
from pyproj import Transformer
ROOT=Path(__file__).resolve().parent.parent
REV='ca96624a56bd078437bca8184e78163e5039ad19'
URL=f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/ne_10m_rivers_lake_centerlines.geojson'
cache=ROOT/'scripts/source-cache/rivers.geojson'
if not cache.exists():
 cache.parent.mkdir(exist_ok=True,parents=True)
 with urllib.request.urlopen(URL,timeout=30) as response: cache.write_bytes(response.read())
raw=cache.read_bytes()
EXPECTED_SHA='bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a'
if hashlib.sha256(raw).hexdigest()!=EXPECTED_SHA: raise ValueError('The cached geography does not match the pinned upstream file.')
data=json.loads(raw)
f=next(f for f in data['features'] if f['properties'].get('name_en')=='Tiber')
project=Transformer.from_crs('EPSG:4326','EPSG:32633',always_xy=True)
# Fixed origin beside one coarse lower-Tiber segment. The 46m eastward offset
# provides a reproducible development scene; neither river width nor town is surveyed.
a=project.transform(12.273204,41.777208);b=project.transform(12.279307,41.761339)
origin=[round((a[0]+b[0])/2+46,3),round((a[1]+b[1])/2,3)]
lines=[]
for line in f['geometry']['coordinates']:
 points=[project.transform(*p) for p in line]
 for a,b in zip(points,points[1:]):
  if max(a[0],b[0])<origin[0]-8000 or min(a[0],b[0])>origin[0]+8000 or max(a[1],b[1])<origin[1]-8000 or min(a[1],b[1])>origin[1]+8000: continue
  lines.append([[round((p[0]-origin[0])/2,3),round((origin[1]-p[1])/2,3)] for p in [a,b]])
out={'id':'lower-tiber','version':1,'projection':'EPSG:32633','origin':origin,'boundsMetres':[-8000,-8000,8000,8000],'metresPerTile':2,'upstream':URL,'sha256':hashlib.sha256(raw).hexdigest(),'license':'Public domain — Natural Earth','sourceScale':'1:10 million cartographic scale; not 10m resolution','limitations':'Coarse modern centerline. Local widths, banks, buildings, roads, vegetation, and ancient channel position are inferred. This is not a historical reconstruction or elevation model.','segments':lines}
(ROOT/'public/packs/tiber-geography.json').write_text(json.dumps(out,indent=2))
print(f'Prepared {len(lines)} projected river segments, EPSG:32633.')

generated=ROOT/'src/content/generated';generated.mkdir(exist_ok=True,parents=True)
(generated/'tiber-geography.json').write_bytes((ROOT/'public/packs/tiber-geography.json').read_bytes())
