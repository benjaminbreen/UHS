"""Prepare a coarse naming fallback; does not modify game ecology or climate."""
import hashlib
import json
import re
import urllib.request
import zipfile
from pathlib import Path
import numpy as np
import shapefile
from shapely.geometry import shape
from shapely import contains_xy

ROOT = Path(__file__).resolve().parent.parent
URL = 'https://storage.googleapis.com/teow2016/Ecoregions2017.zip'
SHA = 'be36d6209e443038d02e309f0447c6e7f2a62f5fe60c605ffe90d064952f2a60'
cache = ROOT/'scripts/source-cache/Ecoregions2017.zip'
if not cache.exists():
    cache.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(URL, cache)
if hashlib.sha256(cache.read_bytes()).hexdigest() != SHA:
    raise ValueError('Ecoregion source checksum mismatch')
folder = cache.parent/'ecoregions2017'
if not (folder/'Ecoregions2017.shp').exists():
    with zipfile.ZipFile(cache) as archive:
        archive.extractall(folder)
width, height = 1440, 720
raster = np.zeros((height, width), dtype=np.uint16)
regions = []
reader = shapefile.Reader(str(folder/'Ecoregions2017.shp'), encoding='latin1')
for record in reader.iterShapeRecords():
    p = record.record.as_dict()
    identity = int(p['ECO_ID'])
    full = p['ECO_NAME']
    name = full.replace('tropical and subtropical ', '').replace('temperate broadleaf and mixed ', '').replace('tropical moist ', '').replace('subtropical moist ', '').replace('broadleaf ', '').replace('coniferous ', '').replace('temperate ', '')
    if len(name) > 34:
        for suffix in [' rain forests', ' mixed forests', ' evergreen forests', ' dry forests', ' moist forests', ' savanna and grasslands', ' grasslands, savannas, and shrublands', ' forests', ' woodlands', ' savanna', ' grasslands', ' shrublands', ' tundra']:
            if name.endswith(suffix) and len(name) > 34:
                name = name[:-len(suffix)]
    if len(name) > 34:
        name = re.split(r'\b(?:sclerophyllous|semi-deciduous|semi-evergreen|moist|dry|deciduous|conifer|hardwood|forests?|woodlands?|savanna|grasslands?|shrublands?|bushlands?|thickets?|xeric|taiga|tundra|mallee|subalpine)\b', name, maxsplit=1, flags=re.I)[0].rstrip(' ,-/')
    if not name or len(name) > 34 or name.lower() in ['rock and ice', 'lake', 'lakes']:
        name = None
    regions.append({'id':identity, 'name':name, 'sourceName':full, 'realm':p['REALM'], 'biome':int(p['BIOME_NUM'])})
    geometry = shape(record.shape.__geo_interface__)
    w,s,e,n = geometry.bounds
    x0, x1 = max(0, int((w+180)*4)), min(width, int((e+180)*4)+1)
    y0, y1 = max(0, int((90-n)*4)), min(height, int((90-s)*4)+1)
    x,y = np.meshgrid(-180+(np.arange(x0,x1)+.5)/4, 90-(np.arange(y0,y1)+.5)/4)
    selected = contains_xy(geometry,x,y)
    raster[y0:y1,x0:x1][selected] = identity
flat = raster.ravel()
starts = np.r_[0, np.flatnonzero(flat[1:] != flat[:-1])+1]
ends = np.r_[starts[1:], flat.size]
runs = [[int(a),int(b),int(flat[a])] for a,b in zip(starts,ends) if flat[a]]
out = ROOT/'src/content/geography/travel/generated/ecoregions.json'
out.write_text(json.dumps({'width':width, 'height':height, 'regions':sorted(regions,key=lambda r:r['id']), 'runs':runs, 'source':{'url':URL,'sha256':SHA,'license':'CC BY 4.0','attribution':'RESOLVE Ecoregions 2017 — Dinerstein et al. (2017), doi:10.1093/biosci/bix014','modifications':'Rasterized to quarter-degree cell centers; shortened display names; biome number kept. Used as geographic naming fallback and as the broad biome map for generated ecology, not historical vegetation.'}},separators=(',',':'),ensure_ascii=False)+'\n')
print(f'{len(regions)} ecoregions, {len(runs)} runs, {out.stat().st_size:,} bytes; {sum(r["name"] is None for r in regions)} labels need shorter refinements')
