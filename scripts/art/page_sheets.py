"""Split the building sheets into 1024px pages for the game.

A sheet decodes whole, and iOS Safari kills the tab past a few hundred MB, so a
town that drew one house from each 4096px sheet held ~240 MB. The full sheets
stay for the art tools; the game loads only the pages its sprites sit on.
Frames are packed in name order so a building's facings and its kit share a page.
"""
from pathlib import Path
from PIL import Image
import json, sys

ROOT = Path(__file__).resolve().parents[2]
PACKS = ROOT / 'public/packs'
SHEETS = ['buildings', 'regional-buildings', 'camp-buildings', 'modern-buildings',
          'street-buildings', 'street-weather', 'civic', 'sacred-buildings', 'precincts']
SIZE = 1024


def page(name):
    sheet = Image.open(PACKS / f'{name}.png')
    frames = json.loads((PACKS / f'{name}.json').read_text())['frames']
    rects = {}
    for key in sorted(frames):
        r = frames[key]['frame']
        rects.setdefault((r['x'], r['y'], r['w'], r['h']), []).append(key)
    pages, placed = [], {}
    x = y = rowh = 0
    for rect, keys in sorted(rects.items(), key=lambda kv: kv[1][0]):
        w, h = rect[2], rect[3]
        if x + w + 2 > SIZE: x = 0; y += rowh + 2; rowh = 0
        if not pages or y + h + 2 > SIZE:
            pages.append([]); x = y = rowh = 0
        pages[-1].append((rect, x, y)); placed[rect] = (len(pages) - 1, x, y)
        x += w + 2; rowh = max(rowh, h)
    out = PACKS / 'pages'; out.mkdir(exist_ok=True)
    for old in out.glob(f'{name}-*.png'): old.unlink()
    index = []
    for i, items in enumerate(pages):
        im = Image.new('RGBA', (SIZE, max(y + r[3] for r, _, y in items) + 2))
        for (sx, sy, w, h), x, y in items: im.paste(sheet.crop((sx, sy, sx + w, sy + h)), (x, y))
        im.save(out / f'{name}-{i}.png', optimize=True)
        index.append({})
    for rect, keys in rects.items():
        i, x, y = placed[rect]
        for key in keys:
            index[i][key] = {**frames[key], 'frame': {'x': x, 'y': y, 'w': rect[2], 'h': rect[3]}}
    (out / f'{name}.json').write_text(json.dumps(index))
    return len(pages)


if __name__ == '__main__':
    for name in sys.argv[1:] or SHEETS: print(name, page(name), 'pages')
