"""Pre-industrial European houses as specs for the front-on painters, one
per frame of the atlas families they will replace.

    .venv/bin/python scripts/art/front_houses.py artifacts/euro-houses-ab.png

The sheet sets each family's current atlas frames beside the new ones at 3x
with the live adult, for review before anything is wired into the game.
"""
from pathlib import Path
import json
import re
import sys
import zlib

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from art.front_eave import EaveHouse  # noqa: E402
from art.front_house import GableHouse  # noqa: E402

# family: [(frame suffix, spec)]. Gabled specs carry form='gable'.
EUROPEAN = {
    'house-cottage-thatch': ('Medieval thatched house', [
        ('medium-0', dict(tone='straw-old', W=128, storeys=['whitewash'], frame=True, roof='thatch', dormers=1, dormer='eyebrow',
                          stacks='one', windows=('timber', 'leaded'), lean_to=True, wear=0.6, seed=1)),
        ('medium-1', dict(tone='reed', W=120, storeys=['rubble'], roof='thatch', hip=True, stacks='center',
                          windows=('timber', 'leaded'), shutters='oak', wear=0.7, seed=2)),
        ('large-0', dict(W=172, storeys=['render'], frame=True, roof='thatch', hip=True, dormers=2,
                         dormer='eyebrow', stacks='ends', windows=('timber', 'leaded'), lean_to=True, wear=0.5, seed=3)),
    ]),
    'house-cottage-timber': ('Medieval timber house', [
        ('medium-0', dict(tone='tile-brown', W=136, storeys=['rubble', 'render'], frame=True, jetty=True, roof='plain',
                          stacks='one', windows=('timber', 'leaded'), wear=0.5, seed=4, sign=('oak', 0))),
        ('medium-1', dict(tone='shingle-silver', W=128, storeys=['render', 'render'], frame=True, jetty=True, roof='shingle',
                          stacks='center', windows=('timber', 'leaded'), wear=0.6, seed=5)),
        ('large-0', dict(tone='tile-orange', W=176, storeys=['rubble', 'render'], frame=True, jetty=True, roof='plain', dormers=2,
                         stacks='ends', windows=('timber', 'leaded'), wear=0.4, seed=6)),
    ]),
    'house-early-brick': ('Early-modern brick house', [
        ('medium-0', dict(tone='tile-orange', W=140, storeys=['brick', 'brick'], roof='plain', dormers=2, stacks='ends',
                          windows=('mullion', 'leaded'), quoins=True, string=True, plinth='ashlar', wear=0.35, seed=7)),
        ('medium-1', dict(tone='pantile-red', W=132, storeys=['flemish', 'flemish'], roof='pantile', stacks='ends',
                          windows=('mullion', 'leaded'), string=True, plinth='ashlar', wear=0.3, seed=8)),
        ('large-0', dict(tone='slate-welsh', W=180, storeys=['flemish', 'flemish', 'flemish'], roof='slate', hip=True, dormers=3,
                         stacks='ends', windows=('stone', 'sash'), quoins=True, string=True, door='panel',
                         plinth='ashlar', wear=0.25, seed=9)),
    ]),
    'house-early-stucco': ('Early-modern rendered house', [
        ('medium-0', dict(tone='slate-blue', W=136, storeys=['render', 'render'], roof='slate', hip=True, stacks='ends',
                          windows=('stone', 'sash'), quoins=True, string=True, door='panel', plinth='ashlar',
                          wear=0.3, seed=10)),
        ('medium-1', dict(tone='tile-orange', W=132, storeys=['ochre', 'ochre'], roof='plain', stacks='one', windows=('stone', 'casement'),
                          shutters='green', door='panel', door_paint='green', plinth='ashlar', wear=0.4, seed=11)),
        ('large-0', dict(W=180, storeys=['render', 'render', 'render'], roof='slate', hip=True, dormers=3,
                         stacks='ends', windows=('stone', 'sash'), quoins=True, string=True, door='panel',
                         plinth='ashlar', wear=0.25, seed=12)),
    ]),
    'house-early-stone': ('Early-modern stone house', [
        ('0', dict(tone='stone-slate', W=140, storeys=['ashlar', 'ashlar'], roof='slate', stacks='ends', dormers=2,
                   windows=('mullion', 'leaded'), string=True, plinth='ashlar', wear=0.45, seed=13)),
    ]),
    'house-early-timber': ('Early-modern timber house', [
        ('0', dict(form='gable', roof='plain', sign=('painted', 3), lean_to=False, W=144, wear=0.4)),
        ('1', dict(form='gable', roof='shingle', sign=None, lantern=None, W=136, lean_to=True, wear=0.6,
                   paint='blue')),
    ]),
    'house-med': ('Mediterranean house', [
        ('0', dict(W=132, storeys=['ochre', 'ochre'], roof='pantile', stacks='one', windows=('stone', 'casement'),
                   shutters='green', plinth=None, wear=0.4, seed=14)),
        ('1', dict(tone='pantile-pale', W=124, storeys=['whitewash', 'whitewash'], roof='pantile', hip=True, stacks='one',
                   windows=('adobe', 'casement'), shutters='blue', plinth=None, wear=0.5, seed=15)),
    ]),
}


def build(spec):
    if spec.get('form') == 'gable':
        s = {k: v for k, v in spec.items() if k != 'form'}
        return GableHouse(**s).build()
    return EaveHouse(spec).build()


def current(family):
    """The family's current atlas frames: up to three base frames."""
    out = []
    for page in ('buildings',):
        fr = json.loads((ROOT / f'src/render/generated/{page}.json').read_text())['frames']
        atlas = Image.open(ROOT / f'public/packs/{page}.png').convert('RGBA')
        names = [k for k in fr if k.startswith(family + '-') and k.count('-') <= family.count('-') + 2
                 and not k.endswith(('north', 'east', 'west')) and 'urban' not in k][:3]
        for n in names:
            f = fr[n]['frame']
            out.append(atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])))
    return out


def make(out, zoom=3):
    from art.reference import current_adult
    adult = current_adult()
    pad, top = 10, 22
    rows = []
    for fam, (label, specs) in EUROPEAN.items():
        old = current(fam)
        new = [build(s) for _, s in specs]
        cells = [('now', im) for im in old] + [('new', im) for im in new]
        W = sum(im.width for _, im in cells) + pad * (len(cells) + 3) + adult.width * 2
        H = max(im.height for _, im in cells) + top
        r = Image.new('RGBA', (W, H), (28, 24, 34, 255))
        x = pad
        marks = []
        for i, (tag, im) in enumerate(cells):
            if tag == 'new' and (i == 0 or cells[i - 1][0] == 'now'):
                r.alpha_composite(adult, (x, H - adult.height - 4))
                x += adult.width + pad * 2
                marks.append((x, 'NEW'))
            r.alpha_composite(im, (x, H - im.height))
            x += im.width + pad
        r.alpha_composite(adult, (x, H - adult.height - 4))
        rows.append((r, label, marks))
    W = max(r.width for r, _, _ in rows)
    H = sum(r.height for r, _, _ in rows)
    s = Image.new('RGBA', (W, H), (28, 24, 34, 255))
    y = 0
    labels = []
    for r, label, marks in rows:
        s.alpha_composite(r, (0, y))
        labels.append((pad, y + 3, label + '   ·   now (atlas), then new (front-on)'))
        y += r.height
    s = s.resize((W * zoom, H * zoom), Image.NEAREST)
    d = ImageDraw.Draw(s)
    f = ImageFont.load_default(size=22)
    for x, yy, t in labels:
        d.text((x * zoom, yy * zoom), t, font=f, fill=(240, 220, 170))
    Path(out).parent.mkdir(parents=True, exist_ok=True)
    s.convert('RGB').save(out)
    print(f'wrote {out} {s.size}')


if __name__ == '__main__':
    make(sys.argv[1] if len(sys.argv) > 1 else 'artifacts/euro-houses-ab.png')


def street(out, zoom=3):
    """The same families as a village street, now and new: how a place
    feels matters more than any one house."""
    from art.reference import current_adult
    from art.front_materials import ramp, h2
    adult = current_adult()
    grass = ramp(128, 0.1, lift=-0.06)
    dirt = ramp(62, 0.06)
    picks = [('house-cottage-thatch', 0), ('house-cottage-timber', 0), ('house-early-timber', 0),
             ('house-early-brick', 0), ('house-early-stucco', 1), ('house-cottage-thatch', 1)]
    old = [current(f)[min(k, len(current(f)) - 1)] for f, k in picks]
    new = [build(EUROPEAN[f][1][k][1]) for f, k in picks]

    def row(ims, gap):
        W = sum(i.width for i in ims) + gap * (len(ims) + 1)
        H = max(i.height for i in ims) + 70
        r = Image.new('RGBA', (W, H))
        px = r.load()
        for y in range(H):
            for x in range(W):
                band = H - 52 <= y < H - 30
                col = dirt[3] if band else grass[3]
                if band and h2(x // 3, y // 2, 601) < 0.12:
                    col = dirt[4]
                elif not band and h2(x, y, 602) < 0.06:
                    col = grass[2] if h2(x, y, 603) < 0.6 else grass[4]
                px[x, y] = col
        x = gap
        for im in ims:
            r.alpha_composite(im, (x, H - 56 - im.height))
            x += im.width + gap
        for fx in (W // 3, 2 * W // 3):
            r.alpha_composite(adult, (fx, H - 32 - adult.height))
        return r

    a, b = row(old, 6), row(new, 8)
    W = max(a.width, b.width)
    s = Image.new('RGBA', (W, a.height + b.height + 30), (28, 24, 34, 255))
    s.alpha_composite(a, (0, 14))
    s.alpha_composite(b, (0, a.height + 30))
    s = s.resize((s.width * zoom, s.height * zoom), Image.NEAREST)
    d = ImageDraw.Draw(s)
    f = ImageFont.load_default(size=24)
    d.text((10, 6), 'NOW  ·  current atlas houses', font=f, fill=(240, 220, 170))
    d.text((10, (a.height + 18) * zoom), 'NEW  ·  front-on, character scale', font=f, fill=(240, 220, 170))
    s.convert('RGB').save(out)
    print(f'wrote {out} {s.size}')


# ------------------------------------------------------------------ the game hook
# Every frame of these families, urban forms included, is drawn from a spec.
# Front-on houses are drawn at the adult's scale, so footprints widen.
SCALE = 1.45
FORMS = {
    'row': dict(storeys=2, dormers=1, lean_to=False),
    'shop': dict(storeys=1, shop=True, lean_to=False, dormers=0, sign=('oak', 3)),
    'wide': dict(storeys=2, dormers=2, lean_to=False),
    'tall': dict(storeys=3, dormers=0, lean_to=False),
    'cottage': dict(storeys=1, dormers=0, stacks='one', lean_to=False),
    'hut': dict(storeys=1, dormers=0, stacks=None, lean_to=False, plinth=None),
    'stall': dict(storeys=1, shop=True, dormers=0, stacks=None, lean_to=False, plinth=None, heights=[40],
                  sign=('oak', 3)),
    'inn': dict(storeys=2, dormers=2, lean_to=False, sign=('painted', 0), lantern='iron'),
    'hall': dict(storeys=2, dormers=3, lean_to=False, string=True, stacks='ends'),
}


def family_of(name):
    for fam in EUROPEAN:
        if name.startswith(fam + '-'):
            return fam, name[len(fam) + 1:]
    return None, None


def spec_for(name, r):
    """The spec that draws atlas frame `name`, or None if it is not ours."""
    fam, rest = family_of(name)
    if not fam:
        return None
    rest = re.sub(r'-(north|east|west)$', '', rest)
    specs = [sp for _, sp in EUROPEAN[fam][1]]
    keyed = {k: sp for k, sp in EUROPEAN[fam][1]}
    form = None
    if '-urban-' in rest:
        idx, form = rest.split('-urban-')
        base = specs[min(int(idx), len(specs) - 1)] if idx.isdigit() else specs[0]
    elif rest.startswith('gold-'):
        _, size, v = rest.split('-')[:3]
        base = keyed.get(f'{size}-{v}') or (specs[-1] if size == 'large' else specs[0])
    else:
        base = specs[min(int(rest), len(specs) - 1)] if rest.isdigit() else specs[0]
    fw, fh = r['footprint']
    nw = max(4, round(fw * SCALE))
    spec = dict(base, W=nw * 16, seed=zlib.crc32(name.encode()) % 997)
    if form:
        f = dict(FORMS.get(form, {}))
        n = f.pop('storeys', 2)
        if spec.get('form') == 'gable':
            if n <= 2 and form in ('row', 'shop', 'cottage', 'hut', 'stall'):
                spec.update(lean_to=False, sign=f.get('sign', spec.get('sign')), lantern=None)
                return spec, (nw, fh)
            spec = dict(W=nw * 16, storeys=['rubble'] + ['render'] * (n - 1), frame=True, jetty=True,
                        roof='plain', tone='tile-brown', windows=('timber', 'leaded'), seed=spec['seed'])
        else:
            walls = list(spec['storeys'])
            spec['storeys'] = (walls + [walls[-1]] * n)[:n]
            spec.pop('heights', None)
        spec['sign'], spec['lantern'] = None, None
        spec.update(f)
        if form in ('hut', 'stall'):
            spec['windows'] = ('timber', 'leaded')
    return spec, (nw, fh)


def adopt(recipes):
    """Point every frame of these families at the front-on painters, with the
    footprint the new sprite stands on."""
    n = 0
    for name, r in recipes.items():
        got = spec_for(name, r)
        if not got:
            continue
        spec, (fw, fh) = got
        r['frontHouse'] = spec
        r['front'] = True
        r['footprint'] = [fw, fh]
        r['entrance'] = [fw // 2, fh]
        n += 1
    return n


_PAINTED = {}


class FrontHousePainter:
    """What scripts/art/buildings.py needs from a painter. A frame's turned
    copies share its spec, so each spec is painted once."""

    def __init__(self, r, material=None):
        key = json.dumps(r['frontHouse'], sort_keys=True, default=str)
        if key in _PAINTED:
            self.__dict__.update(_PAINTED[key])
            return
        self._paint(r)
        _PAINTED[key] = dict(self.__dict__)

    def _paint(self, r):
        spec = r['frontHouse']
        if spec.get('form') == 'gable':
            b = GableHouse(**{k: v for k, v in spec.items() if k != 'form'})
            im = b.build()
            self.anchor_x = b.x0 + b.W // 2
            self.door_x = b.x0 + b.W // 2
            base = b.base
            self.door_size = (24, 46)
        else:
            b = EaveHouse(spec)
            im = b.build()
            self.anchor_x = b.x0 + b.W // 2
            self.door_x = b.door_x
            base = b.base
            self.door_size = (22, b.door_h)
        self.image = im
        self.w, self.h = im.size
        self.door_ground = base + 1
        self.bottom = base + 1

    def render(self):
        return self.image
