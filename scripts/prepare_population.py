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
other place in that country: its catchment, summed from HYDE 3.3's population
grid at the nearest of twelve dates. Before 1850 that is HYDE's own 5-minute
grid; from 1850 it is ISIMIP's half-degree copy. Either way the catchments only
split the country's total. Urban share by country is HYDE's, through Our World
in Data, and decides whether a start in a city is in the city or in the
countryside around it.
"""
import csv, json, math, hashlib, subprocess, urllib.request, zipfile
import h5py, numpy as np
from shapely import STRtree, points, simplify
from shapely.geometry import Point, shape
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
geoms, geomCode = [], []
for f in countries:
    code = f["properties"].get("ADM0_A3") or f["properties"].get("ISO_A3")
    if code and code in series:
        geoms.append(shape(f["geometry"]))
        geomCode.append(code)
tree = STRtree(geoms)

def locate(lon, lat):
    """Containing country, else the nearest one: a small island can fall outside
    every polygon at this generalisation, and an unassigned place would silently
    drop out of the weighted draw."""
    hit = tree.query(Point(lon, lat), predicate="within")
    if len(hit):
        return geomCode[hit[0]], True
    return geomCode[tree.nearest(Point(lon, lat))], False

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
HYDE_YEARS = [-5000, -1000, 0, 500, 1000, 1500]
GRID_YEARS = HYDE_YEARS + [1850, 1900, 1950, 1975, 2000, 2021]
HYDE = "https://geo.public.data.uu.nl/vault-hyde/HYDE%203.3%5B1701183392%5D/original/hyde33_c7_base_mrt2023/zip/{}_pop.zip"
HYDE_SHA = {
    "0AD": "2b3e97bf64ab93f2de47fe219ece25289f1ff4fbeff8609349e5502e09194fbc",
    "1000AD": "1e066b3018ee9c7aea956c3743b2b14f7d8bb6ef98c4feb3e906821d6df0eec8",
    "1000BC": "93a5fce6f5d2a1fab01b6cac821d967ddff92b598a42b67bc7520ffb185d61aa",
    "1500AD": "83d9ccba8cba2de08baa155f459c920a8b9c7a0f2ce05bcd9346a163382964d1",
    "5000BC": "14d20c52f8560018a28c62779b7a054d6dab7be5fffe0e982e9c6947c0165806",
    "500AD": "2cb46cd02d01466e0a559fdc6c01fd160e97d806525494fdeb2e1bccb9483889",
}

def hyde(year):
    """HYDE's 5-minute population count, summed to ISIMIP's half-degree cells.
    The vault sits behind a browser check, so these are fetched by hand."""
    stem = f"{abs(year)}{'BC' if year < 0 else 'AD'}"
    path = CACHE / "hyde" / f"{stem}_pop.zip"
    if not path.exists():
        raise FileNotFoundError(f"Download {HYDE.format(stem)} into {path.parent} in a browser")
    raw = path.read_bytes()
    if hashlib.sha256(raw).hexdigest() != HYDE_SHA[stem]:
        raise ValueError(f"Cached source differs from the pinned copy: {path.name}")
    sources.append({"url": HYDE.format(stem), "sha256": hashlib.sha256(raw).hexdigest(), "license": "CC BY 4.0 — HYDE 3.3, Klein Goldewijk et al."})
    with zipfile.ZipFile(path) as z:
        text = z.read(f"popc_{stem}.asc").decode()
    header, body = text.split("\n", 6)[:6], text.split("\n", 6)[6]
    nodata = float(header[5].split()[1])
    grid = np.array(body.split(), dtype=np.float32).reshape(2160, 4320)
    grid[grid == nodata] = 0
    return grid.reshape(360, 6, 720, 6).sum(axis=(1, 3))

grids = [hyde(y) for y in HYDE_YEARS]
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

cellCode = np.full(len(cellLon), "", dtype=object)
# Borders simplified well below the half-degree cell: the full 10m outlines
# took minutes for no change in which country a cell centre falls in.
hits = STRtree(simplify(geoms, 0.02)).query(points(cellLon, cellLat), predicate="within")
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
# Places closer than half a cell, such as Delhi and New Delhi, split what the
# nearer one took instead of one of them standing for nobody.
for code in set(pCode):
    among = np.flatnonzero(pCode == code)
    for i in among:
        twins = among[np.hypot(pLon[among] - pLon[i], pLat[among] - pLat[i]) < 0.25]
        catchment[twins] = catchment[twins].mean(axis=0)
# An island too small for the grid still had people on it.
catchment = np.maximum(catchment, 1000)

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
