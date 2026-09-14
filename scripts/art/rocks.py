"""Original regional rock forms: irregular silhouettes with a lit top plane,
a shaded side, a crack and a contact shadow, in regional stone colours."""
from PIL import Image, ImageDraw

# contact/outline, side, body, top, highlight
SAND = ['#4a3a26', '#8a6e46', '#b8975f', '#d8bb84', '#f0dcae']
RED = ['#3e1f16', '#7a3a26', '#a85536', '#c97a4b', '#e6a877']
BASALT = ['#1a1b1e', '#36393e', '#54585e', '#767b82', '#a3a7ad']
MOSSY = ['#243328', '#4a5e4b', '#6e8168', '#93a082', '#c3c9a3']
SLAB = ['#2c3236', '#555e63', '#7f8a8f', '#a5b0b3', '#d3dad9']
LICHEN = ['#2e3430', '#5a6358', '#828c7e', '#a9b09a', '#d5d8bb']

# Silhouette, top plane and crack for three authored forms, in a 22x18 box.
FORMS = {
    'rounded': {
        'outline': [(2, 9), (4, 4), (9, 1), (15, 1), (20, 4), (21, 10), (19, 15), (13, 17), (5, 17), (2, 14)],
        'top': [(4, 8), (6, 4), (10, 2), (15, 2), (19, 5), (18, 9), (13, 11), (6, 11)],
        'crack': [(12, 11), (11, 14), (13, 16)],
    },
    'angular': {
        'outline': [(1, 8), (6, 2), (12, 1), (18, 3), (21, 8), (20, 14), (15, 17), (7, 17), (2, 13)],
        'top': [(3, 8), (7, 3), (12, 2), (17, 4), (19, 8), (14, 10), (7, 10)],
        'crack': [(14, 10), (16, 13), (15, 16)],
    },
    'flat': {
        'outline': [(0, 10), (4, 6), (10, 5), (18, 5), (22, 8), (21, 13), (16, 16), (6, 16), (1, 14)],
        'top': [(2, 10), (5, 7), (10, 6), (18, 6), (20, 9), (16, 11), (6, 11)],
        'crack': [(9, 11), (8, 14)],
    },
}


def canvas(w, h):
    im = Image.new('RGBA', (w, h))
    return im, ImageDraw.Draw(im)


def stone(d, ox, oy, form, pal, scale=1.0):
    f = FORMS[form]
    pt = lambda pts: [(ox + round(x * scale), oy + round(y * scale)) for x, y in pts]
    outline = pt(f['outline'])
    d.polygon(outline, fill=pal[0])
    inner = [(x + (1 if x < ox + 11 * scale else -1), y + (1 if y < oy + 9 * scale else -1)) for x, y in outline]
    d.polygon(inner, fill=pal[1])
    # Body: the outline inset from the right and bottom, the lit side kept.
    body = [(x, y) for x, y in inner]
    d.polygon([(x - (1 if x > ox + 11 * scale else 0), y - (1 if y > oy + 9 * scale else 0)) for x, y in body], fill=pal[2])
    d.polygon(pt(f['top']), fill=pal[3])
    top = pt(f['top'])
    d.line(top[1:4], fill=pal[4], width=1)
    d.line(pt(f['crack']), fill=pal[1])
    d.point(pt(f['crack'])[0], fill=pal[0])
    # Contact shadow along the base.
    base = [p for p in outline if p[1] >= oy + 14 * scale]
    if len(base) >= 2:
        d.line([min(base), max(base)], fill=pal[0], width=1)


def sheet(pal, kind, forms):
    out = {}
    layouts = [
        [(1, 6, forms[0], 0.95), (14, 11, forms[1], 0.7)],
        [(5, 4, forms[0], 1.1)],
        [(2, 10, forms[2], 0.7), (11, 5, forms[1], 0.85)],
    ]
    for variant, pieces in enumerate(layouts):
        im, d = canvas(32, 28)
        for ox, oy, form, scale in pieces:
            stone(d, ox, oy, form, pal, scale)
        if kind == 'mossy':
            for x, y in [(8, 10), (13, 8), (19, 13)]:
                d.rectangle((x, y, x + 2, y + 1), fill='#5d8a45'); d.point((x + 1, y), fill='#86ad55')
        if kind == 'lichen':
            for x, y in [(9, 9), (15, 7), (20, 12)]:
                d.point((x, y), fill='#c8b45a'); d.point((x + 1, y + 1), fill='#b09a3f')
        out[f'nature-rock-{kind}-{variant}'] = im
    return out


def rocks():
    return {
        **sheet(SAND, 'dune', ['flat', 'angular', 'flat']),
        **sheet(RED, 'red', ['rounded', 'rounded', 'flat']),
        **sheet(BASALT, 'basalt', ['angular', 'angular', 'rounded']),
        **sheet(MOSSY, 'mossy', ['rounded', 'rounded', 'flat']),
        **sheet(SLAB, 'slab', ['angular', 'flat', 'angular']),
        **sheet(LICHEN, 'lichen', ['rounded', 'angular', 'flat']),
    }
