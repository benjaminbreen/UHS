"""Composite dumped settlements from the game's own ground raster and sprites,
laid flat (no terrain height) and depth-sorted as the game sorts.

    npm run town:sheet                      # dump and compose the whole panel
    npm run town:sheet -- london-1308       # one setting
    python3 scripts/town-sheet/compose.py --crop 300,250,1500,1250 london-1308

Writes artifacts/towns/<name>.png and artifacts/towns/panel.png.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / 'artifacts/towns'

def atlases():
    out = []
    for path in ('packs/worksites', 'packs/buildings', 'packs/regional-buildings', 'packs/camp-buildings', 'packs/modern-buildings', 'packs/street-buildings', 'packs/civic', 'packs/sacred-buildings', 'packs/precincts', 'packs/atlas', 'props/atlas', 'props/vehicles', 'nature/atlas'):
        out.append((Image.open(ROOT / f'public/{path}.png').convert('RGBA'),
                    json.loads((ROOT / f'public/{path}.json').read_text())['frames']))
    return out


def compose(name, sheets, models, crop=None):
    t = json.loads((OUT / f'{name}.json').read_text())
    R, cx, cy = t['R'], t['cx'], t['cy']
    W = (2 * R + 1) * 16
    im = Image.frombytes('RGBA', (W, W), (OUT / f'{name}.ground').read_bytes()); im.putalpha(255)
    d = ImageDraw.Draw(im)
    px = lambda x, y: ((x - cx + R) * 16, (y - cy + R) * 16)

    def frame(n):
        for sheet, frames in sheets:
            if n in frames:
                f = frames[n]['frame']
                return sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])), frames[n].get('pivot')
        return None, None

    draw = []
    for p in t['places']:
        m = models.get(p['sprite'])
        if not m: continue
        x, y = px(p['x'], p['y'])
        draw.append(((p['y'] + p['h']) * 16 - 2 + p['x'] * .001, p['sprite'],
                     round(x + p['w'] * 8 - m['anchor'][0]), round(y + p['h'] * 16 - m['anchor'][1])))
    for o in t['objects']:
        # An open door is drawn over its building in game; here it would be a loose slab.
        if o.get('sprite') == 'door-open': continue
        spr, piv = frame(o['sprite']) if o.get('sprite') else (None, None)
        if not spr: continue
        x, y = px(o['x'], o['y'])
        ax = piv['x'] * spr.width if piv else spr.width / 2
        draw.append((o['y'] * 16 + 10, o['sprite'], round(x + 8 - ax), y + 16 - spr.height))
    for _, n, x, y in sorted(draw, key=lambda v: v[0]):
        spr, _ = frame(n)
        if not spr: continue
        # Clip rather than skip: a stand or a tower can rise past the crop.
        a, b = max(0, -x), max(0, -y)
        c, e = min(spr.width, W - x), min(spr.height, W - y)
        if c > a and e > b:
            im.alpha_composite(spr.crop((a, b, c, e)), (x + a, y + b))
    for a in t.get('actors', []):
        x, y = px(a['x'], a['y'])
        if 0 <= x < W and 0 <= y < W:
            d.rectangle((x + 5, y + 2, x + 10, y + 14), fill='#2b2b4a' if a['kind'] == 'human' else '#e9e4d2')
    d.text((6, 4), t['label'], fill='#10210c')
    if crop: im = im.crop(crop)
    im.convert('RGB').save(OUT / f'{name}.png')
    return im


def main(argv):
    crop = None
    if '--crop' in argv:
        i = argv.index('--crop'); crop = tuple(int(v) for v in argv[i + 1].split(',')); argv = argv[:i] + argv[i + 2:]
    dump = '--dump' in argv
    argv = [v for v in argv if v != '--dump']
    if dump:
        import subprocess
        subprocess.run(['npx', 'tsx', 'scripts/town-sheet/dump.ts', *argv], cwd=ROOT, check=True)
    names = argv or [p['name'] for p in json.loads((Path(__file__).parent / 'panel.json').read_text())]
    sheets = atlases()
    models = json.loads((ROOT / 'public/packs/models.json').read_text())
    done = [(n, compose(n, sheets, models, crop)) for n in names if (OUT / f'{n}.json').exists()]
    if len(done) > 1:
        side = 480; cols = 4; rows = -(-len(done) // cols)
        panel = Image.new('RGB', (cols * side, rows * side), '#20272a')
        for i, (n, im) in enumerate(done):
            w = im.width; c = im.crop((w // 2 - side, w // 2 - side, w // 2 + side, w // 2 + side)).resize((side, side), Image.LANCZOS)
            panel.paste(c.convert('RGB'), ((i % cols) * side, (i // cols) * side))
        panel.save(OUT / 'panel.png')
    print('wrote', ', '.join(n for n, _ in done))


if __name__ == '__main__':
    main(sys.argv[1:])
