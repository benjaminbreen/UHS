"""Per-country population history, and which country each atlas place sits in.

Feeds the "realistically random" start: a place is drawn in proportion to the
people alive in its country in the drawn year, instead of every place on the
map being equally likely.

Two deliberate approximations, both visible in the output:

Modern borders are projected onto twelve thousand years. A country polygon here
is a bucket for *where people were*, never a claim that the polity existed. It
is worst where a border cuts one population in half, so the Sahel, Central Asia
and the Andes are the places to distrust.

Population is held at the nearest source slice rather than interpolated. The
series has one value per millennium before 1000 CE, and smoothing between those
anchors would invent precision the source does not have.

Within a country, each place stands for the people nearer to it than to any
other place in that country: its catchment, summed from ISIMIP's 0.5-degree
grid of HYDE 3.3 population. The grid begins in 1850, so earlier years use the
1850 pattern scaled to the country's own total. Urban share by country is
HYDE's, through Our World in Data, and decides whether a start in a city is in
the city or in the countryside around it.
"""
import csv, json, math, hashlib, subprocess, urllib.request
import h5py, numpy as np
from shapely import STRtree, points
from shapely.geometry import shape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/source-cache"
REV = "ca96624a56bd078437bca8184e78163e5039ad19"
COUNTRIES = f"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/ne_10m_admin_0_countries.geojson"
# OWID's long-run series: HYDE 3.3 before 1800, Gapminder and the UN after it.
POPULATION = "https://ourworldindata.org/grapher/population.csv?csvType=full&useColumnShortNames=true"
URBAN = "https://ourworldindata.org/grapher/urbanization-last-500-years.csv?csvType=full&useColumnShortNames=true"
# HYDE 3.3 is only served behind a browser check; ISIMIP republishes its grid.
GRID = "https://files.isimip.org/ISIMIP3a/InputData/socioeconomic/pop/histsoc/population_histsoc_30arcmin_annual_{}.nc"
EXPECTED = {
    "ne_10m_admin_0_countries.geojson": "239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255",
    "owid-population.csv": "31c97de9a52df0792e34c4bb5ee80bf266cfa12bc0587c829715e0829a97a536",
    "owid-urban-share.csv": "85f781e9247ecdc6c20b0ba47f3276325075635f02ac9a1e0b6bb3ee3e7ddebe",
    "population_histsoc_30arcmin_annual_1850_1900.nc": "2a001ca338d9819f4c1f3f6e03ea89fd9645e1b9a12cb5fca90289cd3b354a72",
    "population_histsoc_30arcmin_annual_1901_2021.nc": "1490903f44a51eca79453c9551265c4feaea04e814a7cb0332ac48de9c109435",
}
sources = []

def cached(name, url, license):
    p = CACHE / name
    p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists():
        p.write_bytes(urllib.request.urlopen(url, timeout=300).read())
    raw = p.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED[name]:
        raise ValueError(f"Cached source differs from the pinned copy: {name}")
    sources.append({"url": url, "sha256": digest, "license": license})
    return raw

countries = json.loads(
    cached("ne_10m_admin_0_countries.geojson", COUNTRIES, "Public domain — Natural Earth")
)["features"]
rows = list(
    csv.DictReader(
        cached("owid-population.csv", POPULATION, "CC BY 4.0 — Our World in Data").decode().splitlines()
    )
)

# ---- population series, keyed by ISO 3166-1 alpha-3 -------------------------
series = {}
for r in rows:
    code, value = r["code"], r["population_historical"]
    # Rows without a code are OWID aggregates; World is kept as the denominator.
    if not code or not value:
        continue
    series.setdefault(code, {})[int(r["year"])] = int(value)
world = series.pop("OWID_WRL", None)
if not world:
    raise ValueError("No World row: the source columns have changed")
series = {c: s for c, s in series.items() if len(c) == 3 and not c.startswith("OWID")}

# ---- which country each place sits in ---------------------------------------
def rings(geometry):
    polys = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    return [poly[0] for poly in polys]

def boxed(ring):
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return min(xs), min(ys), max(xs), max(ys)

shapes = []
for f in countries:
    code = f["properties"].get("ADM0_A3") or f["properties"].get("ISO_A3")
    if not code or code not in series:
        continue
    for ring in rings(f["geometry"]):
        shapes.append((code, boxed(ring), ring))

def inside(ring, lon, lat):
    hit = False
    for i in range(len(ring)):
        ax, ay = ring[i - 1]
        bx, by = ring[i]
        if (ay > lat) != (by > lat) and lon < ax + (lat - ay) / (by - ay) * (bx - ax):
            hit = not hit
    return hit

def centroid(ring):
    xs = [p[0] for p in ring]
    ys = [p[1] for p in ring]
    return (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2

def locate(lon, lat):
    """Containing country, else the nearest one: a small island can fall outside
    every polygon at this generalisation, and an unassigned place would silently
    drop out of the weighted draw."""
    for code, (w, s, e, n), ring in shapes:
        if w <= lon <= e and s <= lat <= n and inside(ring, lon, lat):
            return code, True
    best = None
    for code, _, ring in shapes:
        cx, cy = centroid(ring)
        dx = (cx - lon) * math.cos(math.radians(lat))
        d = math.hypot(dx, cy - lat)
        if best is None or d < best[0]:
            best = (d, code)
    return best[1], False

# The curated anchors live in places.ts, so read the merged list the game uses.
places = json.loads(
    subprocess.run(
        ["npx", "tsx", "-e", 'import { places } from "./src/content/geography/places"; '
         "console.log(JSON.stringify(places.map(({ id, lon, lat }) => ({ id, lon, lat }))))"],
        cwd=ROOT, capture_output=True, text=True, check=True,
    ).stdout
)
placeCountry = {}
nearest = 0
for p in places:
    code, contained = locate(p["lon"], p["lat"])
    placeCountry[p["id"]] = code
    nearest += not contained

# Only countries that actually hold a place can be drawn, so the rest are
# dropped and the world total is rebuilt from what is left. Antarctica and
# uninhabited dependencies fall out here.
used = sorted(set(placeCountry.values()))
years = sorted(world)

def at(table, year):
    """Value at the nearest source slice, not interpolated.

    Most countries are covered from 10,000 BCE, but some — Ireland from 1950,
    French Polynesia from 1700 — only begin once a census does. Reading the
    nearest slice alone would stamp a country's modern population across all of
    prehistory, which put twentieth-century Ireland at a tenth of the world in
    5000 BCE. Before its series starts a country is instead held at its first
    known share of the world, which is a guess, but a guess that keeps the place
    inhabited and in proportion."""
    first = min(table)
    if year >= first:
        return table[min(table, key=lambda y: abs(y - year))]
    return round(table[first] * world[year] / world[first])

totals = {}
for y in years:
    totals[y] = sum(at(series[c], y) for c in used)

# ---- each place's catchment within its country ------------------------------
GRID_YEARS = [1850, 1900, 1950, 1975, 2000, 2021]
grids = []
for span in ["1850_1900", "1901_2021"]:
    name = f"population_histsoc_30arcmin_annual_{span}.nc"
    cached(name, GRID.format(span), "CC BY 4.0 — ISIMIP3a, from HYDE 3.3")
    with h5py.File(CACHE / name) as f:
        first = 1850 if span.startswith("1850") else 1901
        lat, lon = f["lat"][:], f["lon"][:]
        for y in GRID_YEARS:
            if first <= y <= int(span[-4:]):
                grid = f["total-population"][y - first]
                grids.append(np.where(grid < 1e19, grid, 0))
glon, glat = np.meshgrid(lon, lat)
peopled = np.any(np.stack(grids) > 0, axis=0)
cellLon, cellLat = glon[peopled], glat[peopled]
cellPop = np.stack([g[peopled] for g in grids])

geoms, geomCode = [], []
for f in countries:
    code = f["properties"].get("ADM0_A3") or f["properties"].get("ISO_A3")
    if code in used:
        geoms.append(shape(f["geometry"]))
        geomCode.append(code)
cellCode = np.full(len(cellLon), "", dtype=object)
hits = STRtree(geoms).query(points(cellLon, cellLat), predicate="within")
cellCode[hits[0]] = np.array(geomCode, dtype=object)[hits[1]]

ids = [p["id"] for p in places]
pLon = np.array([p["lon"] for p in places])
pLat = np.array([p["lat"] for p in places])
pCode = np.array([placeCountry[i] for i in ids], dtype=object)

def closest(lons, lats, among):
    dx = (pLon[among][None, :] - lons[:, None]) * np.cos(np.radians(lats))[:, None]
    dy = pLat[among][None, :] - lats[:, None]
    return among[np.argmin(dx * dx + dy * dy, axis=1)]

owner = np.empty(len(cellLon), dtype=int)
# A coastal cell whose centre falls in the sea goes to the nearest place anywhere.
loose = cellCode == ""
owner[loose] = closest(cellLon[loose], cellLat[loose], np.arange(len(ids)))
for code in set(cellCode[~loose]):
    cells = cellCode == code
    among = np.flatnonzero(pCode == code)
    if len(among) == 0:
        among = np.arange(len(ids))
    owner[cells] = closest(cellLon[cells], cellLat[cells], among)
catchment = np.zeros((len(ids), len(GRID_YEARS)))
for k in range(len(GRID_YEARS)):
    np.add.at(catchment[:, k], owner, cellPop[k])

# ---- urban share, percent of each country's people ----------------------------
urbanRows = list(csv.DictReader(
    cached("owid-urban-share.csv", URBAN, "CC BY 4.0 — Our World in Data, from HYDE 3.3").decode().splitlines()
))
urbanTable = {}
for r in urbanRows:
    if r["code"] in used and r["urbc_c_share"]:
        urbanTable.setdefault(r["code"], {})[int(r["year"])] = float(r["urbc_c_share"])
urbanYears = sorted({y for t in urbanTable.values() for y in t})

out = {
    "_comment": __doc__.strip(),
    "years": years,
    "countries": {c: [at(series[c], y) for y in years] for c in used},
    "totals": [totals[y] for y in years],
    "places": placeCountry,
    "catchmentYears": GRID_YEARS,
    "catchments": {i: [int(round(v)) for v in row] for i, row in zip(ids, catchment)},
    "urbanYears": urbanYears,
    "urban": {
        c: [round(t[min(t, key=lambda y: abs(y - u))], 1) for u in urbanYears]
        for c, t in sorted(urbanTable.items())
    },
}
(ROOT / "src/content/geography/population.generated.json").write_text(
    json.dumps(out, ensure_ascii=False, separators=(",", ":"))
)
(ROOT / "src/content/geography/population.sources.json").write_text(
    json.dumps({"sources": sources, "placesByNearestCountry": nearest}, indent=2) + "\n"
)
print(
    f"{len(used)} countries, {len(years)} slices, {len(placeCountry)} places "
    f"({nearest} assigned to the nearest country rather than a containing one)"
)
