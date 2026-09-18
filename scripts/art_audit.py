"""Measure every sprite the game ships, into one report the art lab reads.

Runs over the packed atlases rather than the build scripts, so props,
buildings, characters and terrain are all measured the same way and nothing
has to be rewired to be covered. No thresholds here: the report is numbers,
and the lab decides what counts as a problem.

    python3 scripts/art_audit.py            # -> public/art-audit.json
"""
import json
import re
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from art.quality.metrics import measure                          # noqa: E402
from art.quality.palette import registry, lookup                 # noqa: E402

# Buildings pack to their own page: they are the largest sprites in the game
# and sharing one put the main atlas against its 4096px ceiling.
ATLASES = [
    ('packs', 'public/packs/atlas.png', 'public/packs/atlas.json'),
    ('buildings', 'public/packs/buildings.png', 'public/packs/buildings.json'),
    ('props', 'public/props/atlas.png', 'public/props/atlas.json'),
]

# The audit is for the art a person sees on the map: props and buildings. The
# atlases also carry terrain blend tiles, the deprecated character sheets and
# the superseded portraits, and measuring those buries the handful of sprites
# that are actually worth redrawing.
SKIP = re.compile(
    r'^(edge|bank|water\d|water-teal|wall|quay|animation)-?'
    r'|^(human|portrait)-'
    r'|^study-prop-'          # the superseded A studies; the B set is what ships
)

KINDS = [
    ('prop', re.compile(r'^study-propb-(.+?)-\d+(?:-\w+)?$')),
    ('prop', re.compile(r'^prop-(?:broken-)?(.+?)(?:-\d+)?$')),
    # Building keys carry facings and forms after the variant, so anchoring on a
    # trailing number puts half of them in "other" and skews every median.
    ('building', re.compile(
        r'^(house|modern|period|candidate|religious|theatre|monument)-([a-z]+)')),
    ('flora', re.compile(r'^(crop|farm)-')),
]

# Trees and shrubs are drawn by the vegetation scripts under bare names.
FLORA = {'oak', 'olive', 'hackberry', 'palm', 'pine', 'birch', 'cypress',
         'willow', 'poplar', 'fig', 'cedar', 'acacia', 'baobab', 'juniper',
         'date', 'citrus', 'mulberry', 'plane', 'spruce', 'larch'}


def classify(key):
    if SKIP.match(key):
        return None, None
    for kind, pattern in KINDS:
        m = pattern.match(key)
        if m:
            if kind == 'building' and len(m.groups()) > 1:
                return kind, f'{m.group(1)}-{m.group(2)}'
            return kind, (m.group(1) if m.groups() else key.split('-')[0])
    head = key.split('-')[0]
    if head in FLORA:
        return 'flora', head
    # Everything left in these atlases is a hand-drawn prop under a bare name.
    return 'prop', head


def run(limit=None):
    ramps = registry()
    by_colour, flat = lookup(ramps)
    sprites = []
    for source, png, meta in ATLASES:
        sheet = Image.open(ROOT / png).convert('RGBA')
        frames = json.loads((ROOT / meta).read_text())['frames']
        keys = sorted(frames)[:limit]
        for i, key in enumerate(keys):
            # Classified before measuring: the terrain tiles alone are a
            # thousand sprites we would measure only to throw away.
            kind, family = classify(key)
            if kind is None:
                continue
            f = frames[key]['frame']
            image = sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
            m = measure(image, by_colour, flat)
            if m.get('empty'):
                continue
            m.update(key=key, kind=kind, family=family, source=source,
                     atlas=[f['x'], f['y'], f['w'], f['h']])
            sprites.append(m)
            if i % 250 == 0:
                print(f'  {source} {i}/{len(keys)}', flush=True)
    report = {
        'generated': __import__('datetime').datetime.now().isoformat(timespec='seconds'),
        'ramps': {n: ['#%02x%02x%02x' % c for c in r] for n, r in ramps.items()},
        'sprites': sprites,
    }
    out = ROOT / 'public/art-audit.json'
    out.write_text(json.dumps(report, separators=(',', ':')))
    print(f'{len(sprites)} sprites / {len(ramps)} ramps -> {out.relative_to(ROOT)} '
          f'({out.stat().st_size // 1024} KB)')
    return report


if __name__ == '__main__':
    run(int(sys.argv[1]) if len(sys.argv) > 1 else None)
