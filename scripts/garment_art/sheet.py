"""Contact sheet of the art as it ships: reads garment-art.ts and repeats the
palette and fibre-texture rules from garment-icons.ts."""
import re, sys
from PIL import Image, ImageDraw
TS = open(__file__.rsplit('/scripts/', 1)[0] + '/src/render/garment-art.ts').read()
ART = {k.strip('"'): re.findall(r'"([^"]*)"', v)
       for k, v in re.findall(r'\n  ("?[\w-]+"?): \[\n((?:    "[^"]*",\n)+)  \]', TS)}
N = 24
def rgbf(h): n = int(h[1:], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
def shift(h, f): return [c + (255-c)*(f-1) if f >= 1 else c*f for c in rgbf(h)]
def mute(c, a):
    g = sum(c)/3; return tuple(int(x + (g-x)*a) for x in c)
def pal(hex, q=0):
    worn = 0.45 if q < 0 else 0
    t = lambda f: mute(shift(hex, f), worn)
    return {'o': t(0.9 if worn else 1.0), 'O': t(1.25), 'x': t(0.78),
            '#': t(0.56), ':': t(0.62), '.': t(0.34),
            't': (200, 162, 74) if q >= 2 else t(0.62),
            'T': (224, 192, 120) if q >= 2 else t(0.75),
            'k': (107, 74, 46), 'K': (138, 100, 64),
            'm': (141, 148, 156), 'M': (204, 210, 216)}
def tex(mat, c, r):
    if mat in ('wool', 'felt'): return 'x' if (c*7 + r*5) % 7 == 0 else None
    if mat in ('linen', 'hemp', 'jute', 'ramie'): return 'x' if r % 4 == 0 else None
    if mat == 'silk': return 'O' if c in (9, 10) else ('x' if c == 15 else None)
    if mat == 'synthetic': return 'O' if r < 8 and (c+r) % 7 == 0 else None
    if mat in ('hide', 'fur'):
        return 'x' if (c*3 + r*r) % 7 == 0 else ('O' if (c + r*3) % 11 == 0 else None)
    if mat == 'barkcloth': return 'x' if c % 4 == 0 else None
    return None
CASES = [("#33507e", "wool", 0), ("#efe9d8", "synthetic", 0),
         ("#a83b34", "silk", 2), ("#59483d", "hide", -1)]
names = sys.argv[2:] or sorted(ART)
S = int(sys.argv[1]) if len(sys.argv) > 1 else 5
cols = 4
rows = (len(names) + cols - 1)//cols
cell = (N*S + 10)*len(CASES) + 24
img = Image.new('RGB', (cell*cols + 10, (N*S + 26)*rows + 10), (26, 30, 38))
d = ImageDraw.Draw(img)
for i, name in enumerate(names):
    gx, gy = (i % cols)*cell + 10, (i//cols)*(N*S + 26) + 8
    d.text((gx, gy), name, fill=(190, 196, 206))
    for j, (hex, mat, q) in enumerate(CASES):
        p = pal(hex, q); x0 = gx + j*(N*S + 10); y0 = gy + 14
        for r, row in enumerate(ART[name]):
            for c, ch in enumerate(row):
                if ch == ' ': continue
                col = p.get(ch, p['o'])
                if ch == 'o':
                    t = tex(mat, c, r)
                    if t: col = p[t]
                d.rectangle([x0+c*S, y0+r*S, x0+c*S+S-1, y0+r*S+S-1], fill=col)
img.save(__file__.rsplit('/', 1)[0] + '/sheet.png')
print(len(names), 'icons')
