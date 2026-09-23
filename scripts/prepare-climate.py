"""Prepare a compact current-climate grid from Beck et al.'s 1991–2020 map."""
import hashlib
import json
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
URL = "https://data.naturalcapitalalliance.stanford.edu/download/global/koppen_geiger_climatezones/koppen_geiger_climatezones_1991_2020_1km.tif"
SHA256 = "3b5a7ddda98e501d7045a7dc35951d22b486630aee4ac015dde04e0d1216a9d0"
SOURCE = ROOT / "scripts/source-cache/koppen_geiger_1991_2020_1km.tif"
OUT = ROOT / "src/content/geography/climate.generated.json"
WIDTH, HEIGHT = 4320, 2160

# Beck et al.'s legend codes Af..EF. These intentionally collapse to the
# game's broad climate vocabulary while retaining monsoon and Mediterranean.
# Continental climates split on summer warmth: Dfa/Dfb and their s and w
# kin are deciduous-forest country (Chicago, Kyiv, Seoul) and read as
# temperate; only Dfc/Dfd and kin are taiga. Cold steppe (BSk) is dry
# grassland, not desert, so it is temperate with the dry moisture tier;
# the game's "arid" means desert.
KOPPEN_TO_CLIMATE = [
    0,  # no data / water
    3, 4, 3, 5, 5, 5, 1,
    2, 2, 2, 1, 1, 1, 1, 1, 1,
    1, 1, 6, 6, 1, 1, 6, 6, 1, 1, 6, 6, 7, 7,
]
KOPPEN_TO_MOISTURE = [
    0,  # no data / water
    7, 6, 5, 1, 1, 2, 2,
    3, 3, 3, 4, 4, 4, 5, 5, 5,
    5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 3, 3,
]

Image.MAX_IMAGE_PIXELS = None
if not SOURCE.exists():
    SOURCE.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(URL, SOURCE)
if hashlib.sha256(SOURCE.read_bytes()).hexdigest() != SHA256:
    raise ValueError("Köppen–Geiger source checksum mismatch")

with Image.open(SOURCE) as image:
    if image.size != (43200, 21600):
        raise ValueError(f"Unexpected climate raster dimensions: {image.size}")
    sampled = image.resize((WIDTH, HEIGHT), Image.Resampling.NEAREST).tobytes()

climates = bytes(
    (KOPPEN_TO_CLIMATE[code] << 3) | KOPPEN_TO_MOISTURE[code]
    for code in sampled
)
runs = []
start = 0
value = climates[0]
for index, next_value in enumerate(climates[1:], 1):
    if next_value != value:
        runs.extend((index - start, value))
        start, value = index, next_value
runs.extend((len(climates) - start, value))

OUT.write_text(
    json.dumps(
        {
            "width": WIDTH,
            "height": HEIGHT,
            "cellsPerDegree": 12,
            "runs": runs,
            "source": {
                "url": URL,
                "sha256": SHA256,
                "license": "CC BY 4.0",
                "attribution": "Beck et al. (2023), High-resolution (1 km) Köppen-Geiger maps for 1901–2099 based on constrained CMIP6 projections, Scientific Data 10, 724, doi:10.1038/s41597-023-02549-6",
                "period": "1991–2020",
                "modifications": "Nearest-neighbour resampled to 1/12 degree; Köppen–Geiger classes mapped to UHS climate labels: Af/Aw tropical, Am monsoon, BW and BSh arid, BSk temperate (dry), Cs Mediterranean, other C temperate, warm-summer D temperate, cold-summer D boreal, E tundra. A coarse moisture tier is retained for visual ecology blending.",
            },
        },
        separators=(",", ":"),
        ensure_ascii=False,
    )
    + "\n",
)
print(f"Wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size:,} bytes)")
