"""Composite dumped settlements from the real sprites: a look at layout, not
at terrain. Ground is flat colour; fences and beds are schematic; buildings,
props and trees are the game's own frames, depth-sorted as the game sorts.

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
GROUND = {'grass': '#5f8f3e', 'dirt': '#a58a5c', 'paving': '#8f8e84', 'kerb': '#b0aa98', 'field': '#6b5236',
          'water': '#2f6f8f', 'sand': '#c9b77e', 'bridge': '#7a5c38', 'floor': '#b89a6b'}
BOUNDARY = {'wall': '#8d8a7c', 'stones': '#8d8a7c', 'hedge': '#355f2a', 'wire': '#6d6d6d'}


def atlases():
    out = []
    for path in ('packs/buildings', 'packs/regional-buildings', 'packs/camp-buildings', 'packs/civic', 'packs/precincts', 'packs/atlas', 'props/atlas', 'props/vehicles', 'nature/atlas'):
        out.append((Image.open(ROOT / f'public/{path}.png').convert('RGBA'),
                    json.loads((ROOT / f'public/{path}.json').read_text())['frames']))
    return out


def compose(name, sheets, models, crop=None):
    t = json.loads((OUT / f'{name}.json').read_text())
    R, cx, cy = t['R'], t['cx'], t['cy']
    W = (2 * R + 1) * 16
    im = Image.new('RGBA', (W, W), GROUND['grass']); d = ImageDraw.Draw(im)
    px = lambda x, y: ((x - cx + R) * 16, (y - cy + R) * 16)

    def frame(n):
        for sheet, frames in sheets:
            if n in frames:
                f = frames[n]['frame']
                return sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])), frames[n].get('pivot')
        return None, None

    for k, s in t['surface'].items():
        x, y = map(int, k.split(',')); a, b = px(x, y)
        d.rectangle((a, b, a + 15, b + 15), fill=GROUND.get(s, '#ff00ff'))
        if s == 'paving':
            d.line((a, b + 15, a + 15, b + 15), fill='#7d7c73'); d.line((a + 7, b, a + 7, b + 15), fill='#85847a')
    for k, f in t['fields'].items():
        x, y = map(int, k.split(',')); a, b = px(x, y)
        if f['crop'] not in ('pasture', 'fallow'):
            tone = {'vegetables': '#4f8a35', 'orchard': '#3f7a33', 'vine': '#5a7f3a'}.get(f['crop'], '#b89a4a')
            for yy in range(3, 16, 5):
                for xx in range(2, 16, 4): d.rectangle((a + xx, b + yy - 2, a + xx + 1, b + yy), fill=tone)
        ink = BOUNDARY.get(f.get('boundary'), '#5a3d22')
        for bit, line in ((1, (a, b - 4, a + 15, b - 4)), (2, (a + 19, b, a + 19, b + 15)),
                          (4, (a, b + 19, a + 15, b + 19)), (8, (a - 4, b, a - 4, b + 15))):
            if f['fence'] & bit:
                d.line(line, fill=ink, width=2)
                d.rectangle((line[0] - 1, line[1] - 3, line[0] + 1, line[1] + 1), fill='#7a5630')
    draw = []
    for p in t['places']:
        m = models.get(p['sprite'])
        if not m: continue
        x, y = px(p['x'], p['y'])
        draw.append(((p['y'] + p['h']) * 16 - 2 + p['x'] * .001, p['sprite'],
                     round(x + p['w'] * 8 - m['anchor'][0]), round(y + p['h'] * 16 - m['anchor'][1])))
    for o in t['objects']:
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
