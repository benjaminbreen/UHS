"""Bundle named coordinates, with reusable UHS landscape descriptions where matched.
The legacy input is a one-time extraction from benjaminbreen/UHS geography.ts at
302c17dd8b2d7c809c7056ee9f7f8ed973a8dffa. Its coordinates are too coarse to ship,
but they are used to disambiguate a name that names more than one real place:
matching York on population alone moved a medieval English city to Pennsylvania.
Unmatched legacy names are left out rather than assigned misleading coordinates.

Settlement rank comes from the source's own modern prominence, so a place that is
a major centre today is generated as a city. That is a modern cartographic rank
projected onto whatever year is requested, not a claim about the settlement's
size at that date; see WORLDS.md.
"""
import json, re, unicodedata, urllib.request, hashlib, math
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
REV='ca96624a56bd078437bca8184e78163e5039ad19'
def norm(s):
 return re.sub(r'[^a-z0-9]+',' ',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip()
EXPECTED={'ne_10m_populated_places_simple': 'fd3fa867a320cbd5c5b6bb5bc550afeec2939fb2cef688e508007282a55ac42f', 'ne_10m_geography_regions_polys': 'b7b26e50ea917d3696aec87f932def2bf5f890f5770e441d59c162c6f4c92a77'}
def source(name):
 url=f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/{name}.geojson'
 p=ROOT/'scripts/source-cache'/f'{name}.geojson'
 p.parent.mkdir(parents=True,exist_ok=True)
 if not p.exists(): p.write_bytes(urllib.request.urlopen(url,timeout=60).read())
 raw=p.read_bytes()
 if hashlib.sha256(raw).hexdigest()!=EXPECTED[name]: raise ValueError("Place cache differs from pinned source: "+name)
 sources.append({'url':url,'sha256':hashlib.sha256(raw).hexdigest(),'license':'Public domain — Natural Earth'})
 return json.loads(raw)['features']
sources=[]
cities=source('ne_10m_populated_places_simple')
regions=source('ne_10m_geography_regions_polys')
def rank(p):
 """Modern cartographic prominence, the only settlement signal the source has."""
 return 'city' if p['scalerank']<=3 or (p['pop_max'] or 0)>=250000 or p['adm0cap'] else 'village'

# Every candidate for a name is kept, not just the most populous one.
cityPoints={};regionPoints={}
for f in cities:
 p=f['properties'];point=(p['longitude'],p['latitude'],p['pop_max'] or 0,rank(p))
 for k in ['name','nameascii','namealt']:
  if p.get(k):cityPoints.setdefault(norm(p[k]),[]).append(point)
for f in regions:
 p=f['properties'];g=f['geometry'];polys=[g['coordinates']] if g['type']=='Polygon' else g['coordinates']
 ring=max((poly[0] for poly in polys),key=len);xs=[a[0] for a in ring];ys=[a[1] for a in ring]
 point=((min(xs)+max(xs))/2,(min(ys)+max(ys))/2,0,None)
 for k in ['NAME','NAME_EN','NAMEALT']:
  if p.get(k):regionPoints.setdefault(norm(p[k]),[]).append(point)
HINT_KM=400
def apart(a,b):
 dx=(a[0]-b[0])*math.cos(math.radians((a[1]+b[1])/2))
 return math.hypot(dx,a[1]-b[1])*111.32
def locate(names,hint):
 """Most prominent candidate near the legacy record's own coordinate. Beyond
 that radius the hint is too coarse to trust, so prominence decides alone."""
 for table in (cityPoints,regionPoints):
  found=[c for n in names if n in table for c in table[n]]
  if not found:continue
  near=[c for c in found if apart(c,hint)<HINT_KM]
  return max(near or found,key=lambda c:c[2])
 return None
def defaults(lon,lat):
 a=abs(lat);climate='tropical' if a<23 else 'tundra' if a>66 else 'boreal' if a>55 else 'temperate'
 culture='european';architecture='timber'
 if -18<lon<65 and 17<lat<34:climate='arid'
 if -12<lon<40 and 31<lat<44:climate='mediterranean'
 if 70<lon<140 and 8<lat<30:climate='monsoon'
 if 115<lon<145 and -32<lat<-18:climate='arid'
 if lon<-30:
  culture='north-american' if lat>28 else 'south-american' if lat<8 else 'mesoamerican'
  architecture='board' if lat>28 else 'mudbrick'
 elif -20<lon<55 and -36<lat<35:
  culture='sub-saharan-african' if lat<20 else 'mena';architecture='mudbrick'
 elif lon>110 and lat<-10:culture='australian-pacific'
 elif lon>95 and lat<25:culture='southeast-asian'
 elif lon>95:culture='east-asian';architecture='courtyard'
 elif lon>60 and lat<35:culture='south-asian';architecture='courtyard'
 elif lon>45 and lat>35:culture='central-asian'
 elif lon>30 and lat<43:culture='mena';architecture='mudbrick'
 return dict(climate=climate,culture=culture,architecture=architecture,year=1400,water='none',settlement='village',relief=.35)
legacy=json.loads((ROOT/'scripts/data/legacy-areas.json').read_text());result={};matched=0
for p in legacy:
 names=[norm(p['name']),norm(re.sub(r' (Plain|Valley|Highlands|Lowlands|Plateau|Region|Basin)$','',p['name']))]
 point=locate(names,(p['lon'],p['lat']))
 if point and abs(point[1])<=85:
  lon,lat,_,settlement=point
  # The curated record wins where it says anything. Architecture and settlement
  # are the exceptions: every legacy row reads 'timber' and 'village', which is
  # a placeholder rather than a judgement, so the region and the source decide.
  fill=defaults(lon,lat)
  result[norm(p['name'])]={**fill,**p,'architecture':fill['architecture'],'settlement':settlement or 'village','lon':round(lon,4),'lat':round(lat,4)};matched+=1
for f in sorted(cities,key=lambda f:-(f['properties']['pop_max'] or 0)):
 p=f['properties'];name=p['name'];key=norm(name);lon,lat=p['longitude'],p['latitude']
 if p['scalerank']>4 or key in result or abs(lat)>85:continue
 result[key]=dict(id='city-'+key.replace(' ','-'),name=name,aliases=[p['nameascii']] if p.get('nameascii')!=name and p.get('nameascii') else [],lon=round(lon,4),lat=round(lat,4),**{**defaults(lon,lat),'settlement':rank(p)})
# Fix the catalog culture vocabulary centrally; data generation never invents runtime IDs.
alias={'north-american':'other-indigenous-american','south-american':'andean','sub-saharan-african':'west-central-african','mena':'north-african-west-asian','central-asian':'inner-eurasian'}
for p in result.values():p['culture']=alias.get(p['culture'],p['culture'])
(ROOT/'src/content/geography/places.generated.json').write_text(json.dumps(list(result.values()),ensure_ascii=False,separators=(',',':')))
(ROOT/'src/content/geography/places.sources.json').write_text(json.dumps({'sources':sources,'legacyRevision':'302c17dd8b2d7c809c7056ee9f7f8ed973a8dffa','matchedLegacyAreas':matched},indent=2)+'\n')
print(f'{matched} legacy areas matched; {len(result)} total named anchors')
