"""Check benchmark frames against the colour law's value envelope.

    python3 scripts/palette-audit.py <label> [label ...]

Reads src/content/graphics/palette.json. For each frame: OKLab lightness
percentiles, 95th-percentile chroma, and ground spread (p90-p10 lightness over
the most common hue band, which is the ground). A flat fill scores near zero.
Water-heavy frames are skipped for spread. Numbers, then a mark where a frame
leaves the envelope.
"""
import glob, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
LAW = json.loads((ROOT / 'src/content/graphics/palette.json').read_text())['frame']


def oklab(rgb):
    c = rgb / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    l = np.cbrt(0.4122214708 * c[:, 0] + 0.5363325363 * c[:, 1] + 0.0514459929 * c[:, 2])
    m = np.cbrt(0.2119034982 * c[:, 0] + 0.6806995451 * c[:, 1] + 0.1073969566 * c[:, 2])
    s = np.cbrt(0.0883024619 * c[:, 0] + 0.2817188376 * c[:, 1] + 0.6299787005 * c[:, 2])
    return np.stack([0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
                     1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
                     0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s], -1)


def audit(path):
    lab = oklab(np.array(Image.open(path).convert('RGB')).reshape(-1, 3).astype(float))
    L, C = lab[:, 0], np.hypot(lab[:, 1], lab[:, 2])
    H = np.degrees(np.arctan2(lab[:, 2], lab[:, 1])) % 360
    land = ~((H > 190) & (H < 280) & (C > 0.05))          # not water
    p10, p50, p90 = np.percentile(L[land], [10, 50, 90])
    # Ground: the busiest 20-degree hue band among coloured land pixels.
    tinted = land & (C > 0.03)
    hist, edges = np.histogram(H[tinted], bins=18, range=(0, 360))
    k = hist.argmax()
    ground = tinted & (H >= edges[k]) & (H < edges[k + 1])
    spread = np.subtract(*np.percentile(L[ground], [90, 10]))
    marks = []
    for name, v in (('p10', p10), ('p50', p50), ('p90', p90)):
        lo, hi = LAW['L'][name]
        if not lo <= v <= hi:
            marks.append(f'{name} {"low" if v < lo else "high"}')
    if spread < LAW['groundSpread']:
        marks.append('ground flat')
    c95 = np.percentile(C[land], 95)
    if c95 > LAW['chromaP95']:
        marks.append('chroma high')
    print(f'{Path(path).stem:24s} L {p10:.2f}/{p50:.2f}/{p90:.2f}  C95 {c95:.3f}  '
          f'ground spread {spread:.3f}  {"; ".join(marks) or "ok"}')


for label in sys.argv[1:] or ['current']:
    print(f'== {label}')
    for f in sorted(glob.glob(str(ROOT / f'artifacts/benchmark/{label}/*.png'))):
        if not Path(f).name.startswith('_'):
            audit(f)
