"""Dated settlements for every square of the travel grid (stdlib only).

Sources, most trusted first: the authored regional files in
scripts/settlements-authored/, Reba, Reitsma and Seto's geocoding of the
Chandler and Modelski city populations, Pleiades, al-Thurayya (al-Muqaddasi's
tenth-century hierarchy), Wikidata settlements with an inception date, and
GeoNames populated places as the twentieth-century floor. Each becomes phases
of [year, rank, year, rank, ...] with rank 0 gone, 1 village, 2 town, 3 city.

Downloads go in scripts/source-cache (see SOURCES for URLs and checksums).
Run: python3 scripts/prepare-settlements.py
"""
import csv
import gzip
import hashlib
import io
import json
import math
import re
import unicodedata
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / 'scripts/source-cache'
AUTHORED = ROOT / 'scripts/settlements-authored'
OUT = ROOT / 'src/content/geography/travel/generated/settlements'
SOURCES = {
    # https://ndownloader.figshare.com/files/5407640 (chandlerV2.csv, CC BY 4.0)
    'chandler.csv': '5b8df64e46988b216988eef18b46ebc2cba57ecc1adc8a5c2e1e6d5b78068031',
    # https://atlantides.org/downloads/pleiades/dumps/pleiades-places-latest.csv.gz (CC BY 3.0)
    'pleiades-places.csv.gz': 'cab66eb6e21909322c34cd24779c391fa5e8480d29881b64bbb189bb952d6fc4',
    # https://raw.githubusercontent.com/althurayya/althurayya.github.io/master/master/places.geojson
    'althurayya-places.geojson': '9ceef49582106441fc63fc230a17045fdb6f5ef778f77d8c63eebbea2e2137d3',
    # QLever Wikidata: human settlements with P625 and P571; query in scripts/wikidata-settlements.rq (CC0)
    'wikidata-settlements.tsv': '2a977484ee370604d648a03495cece71b866758d30ffaf2f26ff16843ec05be1',
}
SQUARE = 384 / 2048
BAND = 32
# Per square, the best places standing at each of these dates, so modern
# suburbs do not crowd out the village that stood there in 1300.
ERAS = (-3000, -1000, 0, 500, 1000, 1300, 1600, 1800, 1900, 2000)
PER_ERA = 2
RANK = {'village': 1, 'town': 2, 'city': 3, None: 0}
# Lower is more trusted when two sources name the same place.
PRIORITY = {'a': 0, 'c': 1, 'p': 2, 't': 3, 'w': 4, 'g': 5}


def tile(lon, lat):
    return (math.floor(round(lon * 2048) / 384), math.floor(round(-lat * 2048) / 384))


def read(name):
    raw = (CACHE / name).read_bytes()
    if hashlib.sha256(raw).hexdigest() != SOURCES[name]:
        raise ValueError(f'Source checksum mismatch: {name}')
    return raw


def key(name):
    s = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\(.*?\)', '', s)
    s = re.sub(r'^(al|el|the|saint|st)[-. ]+', '', s)
    return re.sub(r'[^a-z]', '', s)


def by_population(pop, year):
    # Pre-modern towns were small: 5,000 people made a city before 1500.
    city, town = (5000, 1000) if year < 1500 else (10000, 2000) if year < 1850 else (50000, 5000)
    return 3 if pop >= city else 2 if pop >= town else 1


def rank_at(phases, year):
    rank = 0
    for k in range(0, len(phases), 2):
        if phases[k] > year:
            break
        rank = phases[k + 1]
    return rank


def authored():
    for f in sorted(AUTHORED.glob('*.json')):
        for e in json.loads(f.read_text()):
            try:
                phases = []
                for year, rank in sorted(e['phases'], key=lambda p: int(p[0])):
                    phases += [int(year), RANK[rank]]
                assert phases
                yield e['name'], float(e['lon']), float(e['lat']), phases, 'a'
            except (AssertionError, KeyError, TypeError, ValueError):
                print(f'skipped {f.name}: {e.get("name")}')


def chandler():
    rows = csv.DictReader(io.StringIO(read('chandler.csv').decode('latin-1')))
    for r in rows:
        if not r['Latitude']:
            continue
        phases = []
        for col, v in r.items():
            m = re.match(r'(BC|AD)_(\d+)$', col or '')
            if not m or not (v or "").strip():
                continue
            year = int(m[2]) * (-1 if m[1] == 'BC' else 1)
            rank = by_population(float(v), year)
            if not phases or phases[-1] != rank:
                phases += [year, rank]
        if phases:
            yield r['City'], float(r['Longitude']), float(r['Latitude']), phases, 'c'


def pleiades():
    rows = csv.DictReader(io.StringIO(gzip.decompress(read('pleiades-places.csv.gz')).decode()))
    for r in rows:
        types = r['featureTypes']
        if not r['reprLat'] or not re.search(r'\b(settlement|urban|village|town)\b', types):
            continue
        if not r['minDate'] or not r['maxDate']:
            continue
        start, end = int(float(r['minDate'])), int(float(r['maxDate']))
        phases = [start, 2 if 'urban' in types or 'town' in types else 1]
        if end < 1900:
            phases += [end, 0]
        yield r['title'], float(r['reprLong']), float(r['reprLat']), phases, 'p'


def thurayya():
    kinds = {'metropoles': 3, 'capitals': 3, 'towns': 2, 'villages': 1}
    for f in json.loads(read('althurayya-places.geojson'))['features']:
        d = f['properties']['cornuData']
        rank = kinds.get(d['top_type_hom'])
        if rank:
            lon, lat = f['geometry']['coordinates']
            # Al-Muqaddasi wrote c. 985; the window before it is inferred.
            yield d['toponym_search'].split(',')[0], lon, lat, [900, rank], 't'


JUNK = re.compile(r'street|house|building|\bfarm\b|estate|housing|district|quarter|\bward\b|block|square|tenement|villa\b|\d'
                  r'|priory|abbey|preceptory|minster|monastery|convent|nunnery|friary|cathedral|church|chapel|castle|palace', re.I)


def wikidata():
    lines = read('wikidata-settlements.tsv').decode().splitlines()[1:]
    for line in lines:
        _, label, coord, inception, dissolved, pop = (line.split('\t') + [''] * 6)[:6]
        name = re.sub(r'^"|"@en$', '', label)
        m = re.match(r'POINT\(([-\d.]+) ([-\d.]+)\)', coord)
        y = re.match(r'"?(-?\d+)-', inception)
        if not m or not y or JUNK.search(name):
            continue
        start = int(y[1])
        people = float(re.match(r'"?([\d.]+)', pop)[1]) if re.match(r'"?[\d.]', pop) else 0
        phases = [start, 2 if start < 1000 and people >= 50000 else 1]
        rank = by_population(people, 2000) if people else 1
        # Growth to today's size is spread over the industrial century.
        for year, step in ((max(start + 20, 1850), 2), (max(start + 50, 1900), 3)):
            if rank >= step > phases[-1]:
                phases += [year, step]
        e = re.match(r'"?(-?\d+)-', dissolved)
        if e and int(e[1]) > start:
            phases += [int(e[1]), 0]
        yield name, float(m[1]), float(m[2]), phases, 'w'


def geonames():
    # The floor for the modern map: towns of 5,000 today, standing from 1900.
    with zipfile.ZipFile(CACHE / 'allCountries.zip') as z, z.open('allCountries.txt') as f:
        for raw in io.TextIOWrapper(f, encoding='utf-8'):
            r = raw.split('\t')
            if r[6] != 'P' or r[7] in ('PPLX', 'PPLH', 'PPLQ', 'PPLW') or int(r[14] or 0) < 5000:
                continue
            yield r[1], float(r[5]), float(r[4]), [1900, by_population(int(r[14]), 2000)], 'g'


def main():
    squares = defaultdict(dict)
    counts = defaultdict(int)
    for source in (authored, chandler, pleiades, thurayya, wikidata, geonames):
        for name, lon, lat, phases, src in source():
            if not -180 <= lon <= 180 or not -85 <= lat <= 85 or not name.strip():
                continue
            t, k = tile(lon, lat), key(name)
            here = squares[t]
            known = here.get(k)
            if known:
                # A later source only extends the record back in time.
                if phases[0] < known[3][0] and known[4] != 'a':
                    known[3] = [phases[0], min(phases[1], known[3][1])] + known[3]
                continue
            here[k] = [round(lon, 3), round(lat, 3), name.strip(), phases, src]
            counts[src] += 1
    # The same place geocoded either side of a square's edge.
    for (i, j), places in list(squares.items()):
        for k, p in list(places.items()):
            for di in (-1, 0, 1):
                for dj in (-1, 0, 1):
                    q = squares.get((i + di, j + dj), {}).get(k) if di or dj else None
                    if q and (PRIORITY[q[4]], id(q)) < (PRIORITY[p[4]], id(p)):
                        places.pop(k, None)
    bands = defaultdict(list)
    for (i, j), places in squares.items():
        kept = {}
        for year in ERAS:
            standing = [p for p in places.values() if rank_at(p[3], year)]
            standing.sort(key=lambda p: (-rank_at(p[3], year), PRIORITY[p[4]], p[3][0]))
            for p in standing[:PER_ERA]:
                kept[id(p)] = p
        bands[math.floor(j / BAND)] += kept.values()
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob('*.json'):
        f.unlink()
    for b, rows in bands.items():
        rows.sort(key=lambda p: (p[1], p[0]))
        (OUT / f'{b}.json').write_text(json.dumps(rows, ensure_ascii=False, separators=(',', ':')))
    print(dict(counts), sum(len(v) for v in bands.values()), 'kept')


main()
