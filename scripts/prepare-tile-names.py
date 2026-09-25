"""Name every square of the travel grid for what lies in it (stdlib only).

The grid is fixed: a map is the 384-tile atlas square of tile:i,j, and a
tile is 1/2048 of a degree, so a square is 0.1875 degrees. Each square takes
the most specific physical feature in it: a river's mouth or confluence, a
lake shore, a peak, a range, a bay, a stream. Natural Earth supplies the large
features and the river geometry; GeoNames supplies the small ones. Towns are
named at runtime from the dated catalog, so no populated place, country or
province is ever read here.

Run: python3 scripts/prepare-tile-names.py
"""
import hashlib
import heapq
import io
import json
import math
import re
import zipfile
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'scripts/source-cache'
OUT = ROOT / 'src/content/geography/travel/generated'
REV = 'ca96624a56bd078437bca8184e78163e5039ad19'
NE = {
    'ne_10m_rivers_lake_centerlines': 'bb854a900ecbd3b408df46d5e16e3e0f974ba55993f9d8b5c26e855273c0905a',
    'ne_10m_rivers_europe': '90712202ac46985812e90840df9acd5101599a9c649868d5bc55ee96c2fedd4c',
    'ne_10m_rivers_north_america': 'dcd2348655a5f3d0ea7be35024073ab24f09115d2e4efb77e7bc0a33567db682',
    'ne_10m_lakes': '2d036f53dedec578001c5c30c2959ee7d4eebc1306900fa4367c49929ec8f2d9',
    'ne_10m_lakes_europe': 'b4dd9e7a5edd0d07b54768b5404d1ebe77f80b9d579c85fff65f90cf50369769',
    'ne_10m_lakes_north_america': '76f49d4b698f3529e690136a989713bcd3c028ade150346f4b358de9815cfc43',
    'ne_10m_geography_regions_elevation_points': 'f98a16867867146ec4146d6d4b18c823eeedb2825947de666116cf9a4e3f43cb',
}
GEONAMES = CACHE / 'allCountries.zip'
SQUARE = 384 / 2048
KEEP = 5  # candidates kept per square


def tile(lon, lat):
    # As the game computes it: round to atlas tiles, then floor to squares.
    return (math.floor(round(lon * 2048) / 384), math.floor(round(-lat * 2048) / 384))


def centre(t):
    return ((t[0] + 0.5) * SQUARE, -(t[1] + 0.5) * SQUARE)


def load(name):
    raw = (CACHE / f'{name}.geojson').read_bytes()
    if hashlib.sha256(raw).hexdigest() != NE[name]:
        raise ValueError(f'Source checksum mismatch: {name}')
    return json.loads(raw)['features']


def lines_of(geometry):
    if geometry['type'] == 'LineString':
        return [geometry['coordinates']]
    return geometry['coordinates']


def rings_of(geometry):
    if geometry['type'] == 'Polygon':
        return [geometry['coordinates']]
    return geometry['coordinates']


def in_ring(ring, x, y):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


class Polygons:
    """Point-in-polygon with a one-degree bucket index."""

    def __init__(self, polygons):
        self.polygons = polygons  # (rings, bounds, payload)
        self.buckets = defaultdict(list)
        for k, (_, b, _) in enumerate(polygons):
            for gx in range(math.floor(b[0]), math.floor(b[2]) + 1):
                for gy in range(math.floor(b[1]), math.floor(b[3]) + 1):
                    self.buckets[(gx, gy)].append(k)

    def at(self, x, y):
        for k in self.buckets.get((math.floor(x), math.floor(y)), ()):
            rings, b, payload = self.polygons[k]
            if b[0] <= x <= b[2] and b[1] <= y <= b[3] and in_ring(rings[0], x, y) \
                    and not any(in_ring(h, x, y) for h in rings[1:]):
                return payload
        return None


def bounds(ring):
    xs, ys = [p[0] for p in ring], [p[1] for p in ring]
    return (min(xs), min(ys), max(xs), max(ys))


# The game's own coastline, so a mouth is where the player will see the sea.
atlas = json.loads((ROOT / 'src/content/geography/atlas.generated.json').read_text())
land = Polygons([([ring], bounds(ring), True) for ring in atlas['land']])


def near_sea(x, y, r=0.08):
    return any(not land.at(x + dx * r, y + dy * r)
               for dx, dy in [(0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)])


candidates = defaultdict(list)  # square -> heap of (score, name, base, kind)


def upright(name):
    # GeoNames files some names inverted: "Discovery, Lake".
    m = re.match(r'^([^,]+), ([^,]+)$', name.strip())
    return f'{m.group(2)} {m.group(1)}' if m and len(m.group(2).split()) <= 2 else name.strip()


def offer(t, score, name, base, kind):
    name = name.strip()
    if not name or len(name) > 40 or re.search(r'\d', name):
        return
    heap = candidates[t]
    item = (score, name, base, kind)
    if len(heap) < KEEP:
        heapq.heappush(heap, item)
    elif item > heap[0]:
        heapq.heapreplace(heap, item)


def along(points, step=0.05):
    """Squares a polyline passes through."""
    seen = set()
    for a, b in zip(points, points[1:]):
        n = max(1, int(math.hypot(b[0] - a[0], b[1] - a[1]) / step))
        for s in range(n + 1):
            seen.add(tile(a[0] + (b[0] - a[0]) * s / n, a[1] + (b[1] - a[1]) * s / n))
    return seen


# --- Lakes (reservoirs are modern and left out) -----------------------------
lake_polygons = []
for source in ['ne_10m_lakes', 'ne_10m_lakes_europe', 'ne_10m_lakes_north_america']:
    for f in load(source):
        p = f['properties']
        name = p.get('name_en') or p.get('name')
        if not name or p.get('featurecla') == 'Reservoir':
            continue
        if not re.search(r'\b(lake|lac|lago|laguna|loch|lough|sea|nuur|nor|köl|kul|ozero)\b', name, re.I):
            name = 'Lake ' + name
        rank = p.get('scalerank') or 10
        for rings in rings_of(f['geometry']):
            lake_polygons.append((rings, bounds(rings[0]), (name, rank)))
lakes = Polygons(lake_polygons)
for rings, b, (name, rank) in lake_polygons:
    t0, t1 = tile(b[0], b[3]), tile(b[2], b[1])
    for i in range(t0[0], t1[0] + 1):
        for j in range(t0[1], t1[1] + 1):
            cx, cy = centre((i, j))
            inside = sum(
                bool(lakes.at(cx + u * SQUARE / 2, cy + v * SQUARE / 2) == (name, rank))
                for u in (-0.8, 0, 0.8) for v in (-0.8, 0, 0.8))
            if inside == 9:
                offer((i, j), 72 - rank, name, name, 'lake')
            elif inside:
                offer((i, j), 80 - rank, f'Shores of {name}', name, 'lake')


# --- Rivers: valleys, and the named points along them -----------------------
pieces = defaultdict(list)  # name -> list of point lists
for source in ['ne_10m_rivers_lake_centerlines', 'ne_10m_rivers_europe', 'ne_10m_rivers_north_america']:
    for f in load(source):
        p = f['properties']
        name = p.get('name_en') or p.get('name')
        if not name or p.get('featurecla') == 'Lake Centerline':
            continue
        name = re.sub(r'\s+', ' ', name).strip()
        rank = p.get('scalerank') or 10
        for line in lines_of(f['geometry']):
            pieces[name].append((line, rank))
            for t in along(line):
                offer(t, 60 - rank, f'{name} valley', name, 'river')

# A river's true ends are the piece ends no other piece of it continues from.
river_index = defaultdict(list)  # 0.1-degree cell -> (name, a, b)
for name, lines in pieces.items():
    for line, _ in lines:
        for a, b in zip(line, line[1:]):
            river_index[(math.floor(a[0] * 10), math.floor(a[1] * 10))].append((name, a, b))


def segment_distance(x, y, a, b):
    dx, dy = b[0] - a[0], b[1] - a[1]
    t = max(0, min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy or 1)))
    return math.hypot(x - a[0] - t * dx, y - a[1] - t * dy)


def meets(x, y, own, reach=0.04):
    best = None
    for gx in range(math.floor(x * 10) - 1, math.floor(x * 10) + 2):
        for gy in range(math.floor(y * 10) - 1, math.floor(y * 10) + 2):
            for name, a, b in river_index.get((gx, gy), ()):
                if name != own and segment_distance(x, y, a, b) < reach:
                    best = name
    return best


for name, lines in pieces.items():
    ends = defaultdict(int)
    for line, _ in lines:
        for p in (line[0], line[-1]):
            ends[(round(p[0], 2), round(p[1], 2))] += 1
    rank = min(r for _, r in lines)
    free = [p for p, n in ends.items() if n == 1]
    kinds = []
    for x, y in free:
        if lakes.at(x, y):
            kinds.append((x, y, 'lake', None))
        elif near_sea(x, y):
            kinds.append((x, y, 'mouth', None))
        else:
            other = meets(x, y, name)
            kinds.append((x, y, 'confluence' if other else 'inland', other))
    # Only a river whose lower end is known can say which end is its source.
    known = any(k in ('mouth', 'confluence') for _, _, k, _ in kinds)
    for x, y, kind, other in kinds:
        t = tile(x, y)
        if kind == 'mouth':
            offer(t, 90 - rank, f'Mouth of the {name}', name, 'river-point')
        elif kind == 'confluence':
            offer(t, 88 - rank, f'Confluence of the {name} and {other}', name, 'river-point')
        elif kind == 'inland' and known:
            offer(t, 84 - rank, f'Headwaters of the {name}', name, 'river-point')


# --- Peaks and named heights -------------------------------------------------
for f in load('ne_10m_geography_regions_elevation_points'):
    p = f['properties']
    name = p.get('name_en') or p.get('name')
    if not name:
        continue
    x, y = f['geometry']['coordinates'][:2]
    kind = p.get('featurecla')
    elevation = p.get('elevation') or 0
    if kind == 'mountain':
        offer(tile(x, y), 78 + min(10, elevation / 800), f'Slopes of {name}', name, 'peak')
    elif kind in ('plateau', 'depression', 'pass', 'cape'):
        offer(tile(x, y), 70, name, name, kind)


# --- GeoNames physical features -----------------------------------------------
# Feature code -> (score, template). {n} is the feature's own name.
CODES = {
    # Relief
    'MTS': (64, '{n}'), 'HLLS': (58, '{n}'), 'RDGE': (55, '{n}'), 'PLAT': (60, '{n}'),
    'PLN': (60, '{n}'), 'PLNX': (54, '{n}'), 'UPLD': (55, '{n}'), 'VAL': (60, '{n}'),
    'VALS': (56, '{n}'), 'DSRT': (60, '{n}'), 'ERG': (56, '{n}'), 'HMDA': (52, '{n}'),
    'DPR': (50, '{n}'), 'BSND': (50, '{n}'), 'GRGE': (52, '{n}'), 'CNYN': (54, '{n}'),
    'PASS': (46, '{n}'), 'MESA': (46, '{n}'), 'SAND': (44, '{n}'), 'KRST': (50, '{n}'),
    'MT': (50, 'Slopes of {n}'), 'PK': (48, 'Slopes of {n}'), 'VLC': (58, 'Slopes of {n}'),
    'HLL': (40, '{n}'),
    # Coasts and islands
    'PEN': (58, '{n}'), 'CAPE': (50, '{n}'), 'ISL': (56, '{n}'), 'ISLS': (58, '{n}'),
    'ATOL': (58, '{n}'), 'SPIT': (42, '{n}'), 'DLTA': (60, '{n}'),
    # Water
    'LK': (52, 'Shores of {n}'), 'LKS': (52, 'Shores of {n}'), 'LGN': (50, '{n}'),
    'LKN': (44, '{n}'), 'BAY': (56, '{n}'), 'GULF': (60, '{n}'), 'STRT': (58, '{n}'),
    'SD': (55, '{n}'), 'CHN': (44, '{n}'), 'INLT': (44, '{n}'), 'ESTY': (52, '{n}'),
    'FJD': (54, '{n}'), 'MRSH': (48, '{n}'), 'SWMP': (48, '{n}'), 'BOG': (40, '{n}'),
    'STM': (42, '{n} valley'), 'WAD': (46, '{n}'), 'FLLS': (40, '{n}'),
    # Cover
    'FRST': (48, '{n}'), 'GRSLD': (44, '{n}'), 'TUND': (40, '{n}'), 'MOOR': (44, '{n}'),
    'HTH': (40, '{n}'), 'SCRB': (38, '{n}'),
    # A region known by its land or people, e.g. the Karoo or the Sahel.
    'RGN': (52, '{n}'),
}
LATIN = re.compile(r"^[\s\w'’.,()\-–À-ɏḀ-ỿ]+$")
kept = 0
geonames_date = None
if GEONAMES.exists():
    with zipfile.ZipFile(GEONAMES) as z:
        info = z.getinfo('allCountries.txt')
        geonames_date = '%04d-%02d-%02d' % info.date_time[:3]
        with z.open(info) as raw:
            for row in io.TextIOWrapper(raw, encoding='utf-8'):
                cols = row.split('\t')
                code = cols[7]
                if code not in CODES or cols[6] not in 'THVL':
                    continue
                name = upright(cols[1] if LATIN.match(cols[1]) else cols[2])
                if not name or name.lower().startswith('unnamed'):
                    continue
                score, template = CODES[code]
                if code in ('MT', 'PK', 'VLC') and cols[15]:
                    score += min(12, int(cols[15]) / 400)
                x, y = float(cols[5]), float(cols[4])
                offer(tile(x, y), score, template.format(n=name), name, code)
                kept += 1
else:
    print('GeoNames dump missing; building from Natural Earth alone.')


# --- Choose, keeping neighbours apart ----------------------------------------
COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
chosen = {}
for t in sorted(candidates, key=lambda t: (t[1], t[0])):
    options = sorted(candidates[t], reverse=True)
    taken = {chosen.get((t[0] + di, t[1] + dj)) for di, dj in [(-1, 0), (-1, -1), (0, -1), (1, -1)]}
    pick = next((o for o in options if o[1] not in taken), options[0])
    chosen[t] = pick[1]

# A square with nothing of its own is named from a strong feature beside it:
# "{land} south of Lake Taal", where the game supplies the kind of land.
NEAR_KINDS = {'lake', 'peak', 'MTS', 'HLLS', 'PLAT', 'MT', 'PK', 'VLC', 'LK', 'BAY', 'GULF', 'PEN', 'DLTA', 'RDGE'}
near = {}
for t, heap in candidates.items():
    best = max(heap)
    if best[3] not in NEAR_KINDS or best[0] < 50:
        continue
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            other = (t[0] + di, t[1] + dj)
            if (di or dj) and other not in chosen:
                # Bearing from the feature to the square: east is +i, south is +j.
                angle = math.degrees(math.atan2(di, -dj)) % 360
                phrase = f'~{COMPASS[round(angle / 45) % 8]}|{best[2]}'
                if other not in near or best[0] > near[other][0]:
                    near[other] = (best[0], phrase)
for t, (_, phrase) in near.items():
    chosen[t] = phrase

# --- Write: one file per band of rows, loaded only near the traveller --------
BAND = 32
bands = defaultdict(lambda: defaultdict(list))
for (i, j), name in sorted(chosen.items(), key=lambda kv: (kv[0][1], kv[0][0])):
    row = bands[j // BAND][j]
    if row and row[-1][0] + len(row[-1]) - 1 == i:
        row[-1].append(name)
    else:
        row.append([i, name])
folder = OUT / 'tile-names'
folder.mkdir(exist_ok=True)
for old in folder.glob('*.json'):
    old.unlink()
size = 0
for band, rows in bands.items():
    path = folder / f'{band}.json'
    path.write_text(json.dumps({str(j): r for j, r in sorted(rows.items())}, ensure_ascii=False, separators=(',', ':')))
    size += path.stat().st_size
sources = [{'url': f'https://github.com/nvkelso/natural-earth-vector/blob/{REV}/geojson/{n}.geojson',
            'sha256': s, 'license': 'Public domain — Natural Earth'} for n, s in NE.items()]
if geonames_date:
    sources.append({'url': 'https://download.geonames.org/export/dump/allCountries.zip',
                    'date': geonames_date, 'sha256': hashlib.sha256(GEONAMES.read_bytes()).hexdigest(),
                    'license': 'CC BY 4.0 — GeoNames',
                    'note': 'Physical feature classes only; populated places and administrative divisions are never read.'})
(OUT / 'tile-names-sources.json').write_text(json.dumps({'built': str(date.today()), 'band': BAND, 'sources': sources}, indent=1))
print(f'{len(chosen)} squares named ({len(near)} from a neighbour), {len(set(chosen.values()))} distinct names, '
      f'{kept} GeoNames features, {len(bands)} bands, {size} bytes')
