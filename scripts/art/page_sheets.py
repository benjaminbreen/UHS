"""Split the building sheets into 1024px pages for the game.

A sheet decodes whole, and iOS Safari kills the tab past a few hundred MB, so a
town that drew one house from each 4096px sheet held ~240 MB. The full sheets
stay for the art tools; the game loads only the pages its sprites sit on.
Frames are packed in name order so a building's facings and its kit share a page.
A rebuild keeps every unchanged frame where the last one put it and fits new
ones into the gaps, so one new building rewrites one page, not every page after it.
"""
from pathlib import Path
from PIL import Image
import numpy as np
import json, sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts'))
from art.atlas import save_png, write_text  # noqa: E402
PACKS = ROOT / 'public/packs'
SHEETS = ['worksites', 'buildings', 'regional-buildings', 'camp-buildings', 'modern-buildings',
          'street-buildings', 'street-weather', 'civic', 'sacred-buildings', 'precincts', 'worksite-shadows',
          'building-shadows', 'modern-shadows', 'landmark-shadows', 'harbor',
          'faunac', 'faunag', 'faunae', 'faunaw', 'faunax', 'faunam', 'faunaf', 'faunar', 'faunau',
          'conveyances', 'horse-voxel']
PATHS = {
    'faunac': ROOT / 'public/fauna-c/atlas',
    'faunag': ROOT / 'public/fauna-g/atlas',
    'faunae': ROOT / 'public/fauna-e/atlas',
    'faunaw': ROOT / 'public/fauna-w/atlas',
    'faunax': ROOT / 'public/fauna-x/atlas',
    'faunam': ROOT / 'public/fauna-m/atlas',
    'faunaf': ROOT / 'public/fauna-f/atlas',
    'faunar': ROOT / 'public/fauna-r/atlas',
    'faunau': ROOT / 'public/fauna-u/atlas',
    'conveyances': ROOT / 'public/fauna-v/vehicles',
    'horse-voxel': ROOT / 'public/fauna-v/horse',
}
SIZE = 1024


def page_frame(frame, x, y):
    r = frame['frame']
    row = [x, y, r['w'], r['h']]
    if frame.get('pivot') or frame['trimmed']:
        pivot = frame.get('pivot', {})
        row.extend([pivot.get('x'), pivot.get('y')])
    if frame['trimmed']:
        source, crop = frame['sourceSize'], frame['spriteSourceSize']
        row.extend([source['w'], source['h'], crop['x'], crop['y']])
    return row


def write_tones():
    tones = {}
    models = json.loads((ROOT / 'src/content/graphics/models.generated.json').read_text())
    for name in ['worksites', 'regional-buildings', 'camp-buildings', 'modern-buildings', 'street-buildings', 'buildings']:
        with Image.open(PACKS / f'{name}.png') as image:
            sheet = image.convert('RGBA')
        frames = json.loads((PACKS / f'{name}.json').read_text())['frames']
        rects = {}
        for key, frame in frames.items():
            if key not in models: continue
            r = frame['frame']
            rect = (r['x'], r['y'], r['w'], r['h'])
            if rect not in rects:
                x, y, w, h = rect
                colors = {}
                for part, start, end, fallback in [('roof', .08, .4, '#4a5560'), ('wall', .55, .85, '#d8cfb0')]:
                    y0, y1 = int(h * start + .5), int(h * end + .5)
                    pixels = [p for p in sheet.crop((x, y + y0, x + w, y + max(y0 + 1, y1))).getdata() if p[3] >= 200]
                    colors[part] = '#' + ''.join(f'{int(sum(p[c] for p in pixels) / len(pixels) + .5):02x}' for c in range(3)) if pixels else fallback
                rects[rect] = colors
            tones.setdefault(key, rects[rect])
    write_text(ROOT / 'src/render/generated/minimap-tones.json', json.dumps(tones, sort_keys=True, separators=(',', ':')))


def _gap(occupied, w, h):
    """Topmost, then leftmost, free w x h box in a page's occupancy grid."""
    if (~occupied).sum() < w * h: return None
    sat = np.zeros((SIZE + 1, SIZE + 1), np.int32)
    sat[1:, 1:] = occupied.cumsum(0).cumsum(1)
    free = (sat[h:, w:] - sat[:-h, w:] - sat[h:, :-w] + sat[:-h, :-w]) == 0
    ys, xs = np.nonzero(free)
    return (int(xs[0]), int(ys[0])) if len(ys) else None


def _shelves(order):
    placed, pages = {}, 0
    x = y = rowh = 0
    for rect, keys in order:
        w, h = rect[2], rect[3]
        if x + w + 2 > SIZE: x = 0; y += rowh + 2; rowh = 0
        if not pages or y + h + 2 > SIZE:
            pages += 1; x = y = rowh = 0
        placed[rect] = (pages - 1, x, y)
        x += w + 2; rowh = max(rowh, h)
    return placed, pages


def _sticky(order, last):
    """Keep each frame on the page and spot it had; new frames go first to
    the page of the frame before them in name order."""
    placed, grids = {}, []
    def take(rect, i, x, y):
        while len(grids) <= i: grids.append(np.zeros((SIZE, SIZE), bool))
        grids[i][y:y + rect[3] + 2, x:x + rect[2] + 2] = True
        placed[rect] = (i, x, y)
    claimed = set()
    for rect, keys in order:
        slot = last.get(keys[0])
        if slot and slot[3:] == rect[2:] and slot not in claimed:
            claimed.add(slot); take(rect, *slot[:3])
    near = 0
    for rect, keys in order:
        if rect in placed:
            near = placed[rect][0]; continue
        for i in [near, *range(len(grids))]:
            if i < len(grids) and (spot := _gap(grids[i], rect[2] + 2, rect[3] + 2)):
                take(rect, i, *spot); break
        else:
            take(rect, len(grids), 0, 0)
        near = placed[rect][0]
    used = sorted({i for i, _, _ in placed.values()})
    renumber = {i: n for n, i in enumerate(used)}
    return {rect: (renumber[i], x, y) for rect, (i, x, y) in placed.items()}, len(used)


def page(name):
    base = PATHS.get(name, PACKS / name)
    sheet = Image.open(f'{base}.png')
    frames = json.loads(Path(f'{base}.json').read_text())['frames']
    rects = {}
    for key in sorted(frames):
        r = frames[key]['frame']
        rects.setdefault((r['x'], r['y'], r['w'], r['h']), []).append(key)
    order = sorted(rects.items(), key=lambda kv: kv[1][0].split(':', 1)[-1])
    placed, count = _shelves(order)
    out = PACKS / 'pages'; out.mkdir(exist_ok=True)
    last = {}
    if (out / f'{name}.json').exists():
        for i, frames_on in enumerate(json.loads((out / f'{name}.json').read_text())):
            for key, row in frames_on.items():
                last[key] = (i, *row[:4])
    if last:
        kept, kept_count = _sticky(order, last)
        # Gaps left by removed frames are refilled; past one spare page, start over.
        if kept_count <= count + 1: placed, count = kept, kept_count
    pages = [[] for _ in range(count)]
    for rect, (i, x, y) in placed.items(): pages[i].append((rect, x, y))
    for old in out.glob(f'{name}-*.png'):
        n = old.stem[len(name) + 1:]
        if n.isdigit() and int(n) >= count: old.unlink()
    index = []
    for i, items in enumerate(pages):
        im = Image.new('RGBA', (SIZE, max(y + r[3] for r, _, y in items) + 2))
        for (sx, sy, w, h), x, y in items: im.paste(sheet.crop((sx, sy, sx + w, sy + h)), (x, y))
        save_png(im, out / f'{name}-{i}.png', optimize=True)
        index.append({})
    for rect, keys in rects.items():
        i, x, y = placed[rect]
        for key in keys:
            index[i][key] = page_frame(frames[key], x, y)
    write_text(out / f'{name}.json', json.dumps(index, separators=(',', ':')))
    return len(pages)


if __name__ == '__main__':
    if sys.argv[1:] != ['--tones']:
        for name in sys.argv[1:] or SHEETS: print(name, page(name), 'pages')
    if not sys.argv[1:] or sys.argv[1:] == ['--tones']:
        write_tones()
