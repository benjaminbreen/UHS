"""Hard keyline against a tinted rim, on the families that still use one.

    python3 -m scripts.art.rim_proof              # the families that changed
    python3 -m scripts.art.rim_proof well anvil

Top row as it ships, bottom row with core.SOFT_RIM on, and the keyline and rim
figures from the audit underneath each so the picture and the metric agree.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
import art.props_b.core as core                                  # noqa: E402
from art.props_b import DRAW_B                                   # noqa: E402
from art.quality.metrics import measure                          # noqa: E402

# The four files that still ringed a silhouette in its darkest tone.
DEFAULT = ['well', 'town-well', 'framed-well', 'anvil', 'trough', 'workbench',
           'loom', 'sheaf', 'strapped-chest', 'grinder']

SCALE, PAD, LABEL = 4, 12, 34


def sheet(keys=None, variants=1):
    keys = [k for k in (keys or DEFAULT) if k in DRAW_B]
    both = {}
    for soft in (False, True):
        core.SOFT_RIM = soft
        both[soft] = {k: DRAW_B[k](v) for k in keys for v in range(variants)}
    core.SOFT_RIM = False
    cw = max(s.width for s in both[False].values()) + 6
    ch = max(s.height for s in both[False].values()) + 4
    out = Image.new('RGBA', (len(keys) * (cw * SCALE + PAD) + PAD,
                             (ch * SCALE + LABEL) * 2 + 34), '#20272a')
    d = ImageDraw.Draw(out)
    d.text((PAD, 10), 'PROP RIMS / top row as shipped, a hard keyline / '
                      'bottom row the material\'s own dark step / 4x',
           fill='#e7d5ad')
    for i, key in enumerate(keys):
        x = PAD + i * (cw * SCALE + PAD)
        for j, soft in enumerate((False, True)):
            sprite = both[soft][key]
            cell = Image.new('RGBA', (cw, ch), '#d6c8a2')
            cell.alpha_composite(sprite, ((cw - sprite.width) // 2,
                                          ch - sprite.height - 2))
            y = 30 + j * (ch * SCALE + LABEL)
            out.alpha_composite(cell.resize((cw * SCALE, ch * SCALE),
                                            Image.NEAREST), (x, y))
            m = measure(sprite)
            d.text((x, y + ch * SCALE + 4),
                   f"{key if not j else 'tinted rim'}", fill='#e7d5ad')
            d.text((x, y + ch * SCALE + 18),
                   f"keyline {m['ringDark']:.0%}  harsh {m['rimGap']:.2f}  "
                   f"tones {m['tones']}", fill='#cbd0bb')
    path = ROOT / 'artifacts/prop-rims.png'
    path.parent.mkdir(exist_ok=True)
    out.save(path)
    return path


if __name__ == '__main__':
    print(sheet(sys.argv[1:] or None))
