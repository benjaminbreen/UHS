"""Every ramp the project has declared, in one place.

Off-palette is measured against this, so a colour typed straight into a draw
call shows up as off-palette even when it looks fine on its own. The registry
is gathered, not authored: nothing here is a new decision about colour.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

HEX = re.compile(r'#[0-9a-fA-F]{6}')


def _rgb(value):
    v = value.lstrip('#')
    return (int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16))


def registry():
    """{ramp name: [rgb, ...]} across props, buildings and content materials."""
    ramps = {}

    from art.props_b.core import RAMPS
    for name, ramp in RAMPS.items():
        ramps[f'prop/{name}'] = [_rgb(c) for c in ramp]

    from art.buildings import ROOFS
    for name, ramp in ROOFS.items():
        ramps[f'roof/{name}'] = [_rgb(c) for c in ramp]

    from art.theatres import TIMBER, CLOTH, NEON
    for name, ramp in [('timber', TIMBER), ('cloth', CLOTH), ('neon', NEON)]:
        ramps[f'theatre/{name}'] = [_rgb(c) for c in ramp]

    for source in ('buildings', 'urban', 'religious', 'theatres', 'period'):
        path = ROOT / f'src/content/graphics/{source}.json'
        if not path.exists():
            continue
        materials = json.loads(path.read_text()).get('materials', {})
        for material, parts in materials.items():
            if not isinstance(parts, dict):
                continue
            for part, ramp in parts.items():
                if isinstance(ramp, list) and ramp and isinstance(ramp[0], str):
                    ramps[f'{source}/{material}/{part}'] = [
                        _rgb(c) for c in ramp if HEX.fullmatch(c)]

    from art.fauna import PALETTES as FAUNA_A
    from art.fauna_b import PALETTES as FAUNA_B
    from art.fauna_c import PALETTES as FAUNA_C
    for label, table in (('faunaA', FAUNA_A), ('faunaB', FAUNA_B),
                         ('faunaC', FAUNA_C)):
        for species, keys in table.items():
            values = keys.values() if isinstance(keys, dict) else keys
            ramps[f'{label}/{species}'] = [
                _rgb(c) for c in values if isinstance(c, str) and HEX.fullmatch(c)]

    from art.topography import PALETTE as TOPO
    ramps['topography/ground'] = [_rgb(c) for c in TOPO]

    # The terrain tiles are drawn from one dict of named colours in build_art.
    source = (ROOT / 'scripts/build_art.py').read_text()
    block = re.search(r"^P=\{(.+?)\}$", source, re.M)
    if block:
        ramps['terrain/base'] = [_rgb(c) for c in HEX.findall(block.group(1))]

    # Trees and grass carry their palettes in content, as indexed art.
    for path in sorted((ROOT / 'src/content/graphics').glob('*.json')) + \
            sorted((ROOT / 'src/content').rglob('trees*.json')):
        try:
            data = json.loads(path.read_text())
        except Exception:
            continue
        _harvest(ramps, f'content/{path.stem}', data)

    return {k: v for k, v in ramps.items() if v}


def _harvest(ramps, prefix, node, depth=0):
    """Any 'palette' list of hexes anywhere in a content file counts."""
    if depth > 6:
        return
    if isinstance(node, dict):
        for key, value in node.items():
            if key == 'palette' and isinstance(value, list) and value \
               and all(isinstance(c, str) and HEX.fullmatch(c) for c in value):
                ramps[f'{prefix}/{len(ramps)}'] = [_rgb(c) for c in value]
            else:
                _harvest(ramps, prefix, value, depth + 1)
    elif isinstance(node, list):
        for value in node:
            _harvest(ramps, prefix, value, depth + 1)


def lookup(ramps):
    """{rgb: ramp name} for exact membership, and the flat list for distance."""
    by_colour = {}
    for name, ramp in ramps.items():
        for step, colour in enumerate(ramp):
            by_colour.setdefault(colour, f'{name}:{step}')
    return by_colour, list(by_colour)
