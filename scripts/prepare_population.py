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
"""
import csv, json, math, hashlib, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "scripts/source-cache"
REV = "ca96624a56bd078437bca8184e78163e5039ad19"
COUNTRIES = f"https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REV}/geojson/ne_10m_admin_0_countries.geojson"
# OWID's long-run series: HYDE 3.3 before 1800, Gapminder and the UN after it.
POPULATION = "https://ourworldindata.org/grapher/population.csv?csvType=full&useColumnShortNames=true"
EXPECTED = {
    "ne_10m_admin_0_countries.geojson": "239eec57ac17f100a11e2536cffc56752c318b50ae765b0918ff7aab4ce8f255",
    "owid-population.csv": "31c97de9a52df0792e34c4bb5ee80bf266cfa12bc0587c829715e0829a97a536",
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

places = json.loads((ROOT / "src/content/geography/places.generated.json").read_text())
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

out = {
    "_comment": __doc__.strip(),
    "years": years,
    "countries": {c: [at(series[c], y) for y in years] for c in used},
    "totals": [totals[y] for y in years],
    "places": placeCountry,
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
