"""A content stamp for the packed atlases.

The renderer loads /packs/atlas.png and friends by plain path, so a browser
holds the old texture after a rebuild and the art looks unchanged. The stamp
is a hash of the packed bytes: it moves when the art moves and not otherwise,
so a rebuild busts the cache and an unchanged rebuild does not.
"""
import hashlib
import json
from pathlib import Path

ATLASES = ['public/packs/atlas.png', 'public/packs/buildings.png',
           'public/packs/terrain.png', 'public/packs/lighting-shadows.png',
           'public/props/atlas.png', 'public/props/shadows.png']


def write_stamp(root):
    digest = hashlib.md5()
    for name in ATLASES:
        path = root / name
        if path.exists():
            digest.update(path.read_bytes())
    out = root / 'src/render/generated/art-version.json'
    out.write_text(json.dumps({'stamp': digest.hexdigest()[:10]}))
    return digest.hexdigest()[:10]
