"""Name the backbone maps that share a name, from GeoNames physical features.

Step two of `npm run prepare:backbone-names`; run the anchor dump first.

Administrative class A and populated-place class P are never read, so no
country, province or city name can reach the output. Only maps that currently
share a name are touched; a map with a distinctive name keeps it.
"""
import collections
import hashlib
import io
import json
import math
import re
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
URL = 'https://download.geonames.org/export/dump/allCountries.zip'
CACHE = ROOT / 'scripts/source-cache/allCountries.zip'
ANCHORS = ROOT / 'scripts/source-cache/backbone-anchors.json'
OUT = ROOT / 'src/content/geography/travel/generated'

# A feature may name a map only if it is the size of a region. Capes, passes
# and single peaks are landmarks inside a map, never a name for the map.
RADIUS = {
    **{c: 130 for c in ['DSRT', 'ERG', 'REG', 'HMDA', 'PLAT', 'UPLD', 'MTS']},
    'PEN': 50,
    **{c: 90 for c in ['RDGE', 'PLN', 'BSND', 'KRST', 'BDLD', 'SAND']},
    **{c: 60 for c in ['GRSLD', 'TUND', 'FRST', 'PLATX', 'PLNX']},
}
# Source codes are unreliable at the small end: cays and keys are filed as
# peninsulas. A cay cannot stand in for an inland map.
TOO_SMALL = re.compile(r'\b(cay|cayo|key|islet|islote|rock)s?\b', re.I)
# Nothing named lies within reach in the polar interiors, so allow a longer
# reach there before giving up and composing a name.
POLAR_RADIUS = 200

anchors = [a for a in json.loads(ANCHORS.read_text()) if a['shared']]

CACHE.parent.mkdir(parents=True, exist_ok=True)
if not CACHE.exists():
    with urllib.request.urlopen(URL, timeout=3000) as r, CACHE.open('wb') as f:
        while chunk := r.read(1 << 20):
            f.write(chunk)
digest = hashlib.sha256()
with CACHE.open('rb') as f:
    while chunk := f.read(1 << 20):
        digest.update(chunk)

buckets = collections.defaultdict(list)
for i, a in enumerate(anchors):
    reach = 2 if abs(a['lat']) <= 66 else 3
    for dy in range(-reach, reach + 1):
        for dx in range(-reach, reach + 1):
            buckets[(round(a['lon']) + dx, round(a['lat']) + dy)].append(i)

candidates = [[] for _ in anchors]
with zipfile.ZipFile(CACHE) as z, z.open('allCountries.txt') as raw:
    for line in io.TextIOWrapper(raw, encoding='utf-8'):
        parts = line.split('\t')
        if len(parts) < 9 or parts[6] not in ('T', 'V', 'L'):
            continue
        radius = RADIUS.get(parts[7])
        if radius is None:
            continue
        name = parts[1].strip()
        if not name or len(name) > 34 or name.isdigit() or TOO_SMALL.search(name):
            continue
        try:
            lat, lon = float(parts[4]), float(parts[5])
        except ValueError:
            continue
        for i in buckets.get((round(lon), round(lat)), ()):
            a = anchors[i]
            reach = radius if abs(a['lat']) <= 66 else max(radius, POLAR_RADIUS)
            km = math.hypot((lat - a['lat']) * 111,
                            (lon - a['lon']) * 111 * math.cos(math.radians(a['lat'])))
            if km <= reach:
                # A well-known range carries alternate names; an anonymous rise
                # carries none. Prominence first, then how central the map sits.
                alternates = len([x for x in parts[3].split(',') if x])
                candidates[i].append(
                    (-min(alternates, 6), round(km / reach, 3), km, name, parts[7]))

taken = {r['name'] for r in json.loads(ANCHORS.read_text()) if not r['shared']}
chosen = {}
for _, _, _, i, c in sorted(
        (c[0], c[1], c[3], i, c) for i, cs in enumerate(candidates) for c in cs):
    if i in chosen or c[3] in taken:
        continue
    taken.add(c[3])
    chosen[i] = c

COMPASS = {(0, 0): 'Southwestern', (0, 1): 'Southern', (0, 2): 'Southeastern',
           (1, 0): 'Western', (1, 1): '', (1, 2): 'Eastern',
           (2, 0): 'Northwestern', (2, 1): 'Northern', (2, 2): 'Northeastern'}

# Whatever GeoNames cannot reach keeps its real regional name, distinguished by
# where it sits within that region. Duplicates are left alone: two maps in a
# featureless interior genuinely are the same place.
remaining = collections.defaultdict(list)
for i, a in enumerate(anchors):
    if i not in chosen:
        remaining[a['name']].append(i)
for name, group in remaining.items():
    if len(group) == 1:
        chosen[group[0]] = (0, 0, 0.0, name, 'composed')
        continue
    lons = [anchors[i]['lon'] for i in group]
    lats = [anchors[i]['lat'] for i in group]
    west, east, south, north = min(lons), max(lons), min(lats), max(lats)
    for size in (3, 4, 5, 6):
        labels = {}
        for i in group:
            a = anchors[i]
            col = 0 if east == west else min(size - 1, int((a['lon'] - west) / ((east - west) / size + 1e-9)))
            row = 0 if north == south else min(size - 1, int((a['lat'] - south) / ((north - south) / size + 1e-9)))
            key = (min(2, row * 3 // size), min(2, col * 3 // size))
            labels[i] = f'{COMPASS[key]} {name}'.strip()
        if len(set(labels.values())) == len(group):
            break
    for i in group:
        chosen[i] = (0, 0, 0.0, labels[i], 'composed')

names = {anchors[i]['id']: chosen[i][3] for i in range(len(anchors))}
detail = [{'id': anchors[i]['id'], 'was': anchors[i]['name'],
           'name': chosen[i][3], 'code': chosen[i][4],
           'km': round(chosen[i][2], 1) or None}
          for i in range(len(anchors))]

OUT.mkdir(parents=True, exist_ok=True)
(OUT / 'backbone-names.json').write_text(
    json.dumps(names, ensure_ascii=False, indent=0, sort_keys=True))
(OUT / 'backbone-names-sources.json').write_text(json.dumps({
    'sources': [{'url': URL, 'sha256': digest.hexdigest(),
                 'license': 'CC BY 4.0 — GeoNames',
                 'attribution': 'https://www.geonames.org/'}],
    'readClasses': ['T (landform)', 'V (vegetation)', 'L (physical areas)'],
    'excludedClasses': ['A (administrative)', 'P (populated places)',
                        'H', 'R', 'S', 'U'],
    'featureCodes': sorted(RADIUS),
    'maps': len(names),
    'fromSource': sum(1 for d in detail if d['code'] != 'composed'),
    'composed': sum(1 for d in detail if d['code'] == 'composed'),
    'note': 'Modern physical toponyms. Not historical, political or linguistic '
            'claims. Only maps that shared a name were renamed.',
}, indent=2))
(ROOT / 'scripts/source-cache/backbone-names-detail.json').write_text(
    json.dumps(detail, ensure_ascii=False, indent=1))
print(f"named {len(names)} maps: "
      f"{sum(1 for d in detail if d['code'] != 'composed')} from source, "
      f"{sum(1 for d in detail if d['code'] == 'composed')} composed")
duplicates = {k: v for k, v in collections.Counter(names.values()).items() if v > 1}
print('shared names remaining:', duplicates or 'none')
