"""Contact sheet for the B studies: every prop beside a character, at N times.

    python3 -m scripts.art.props_b.review well trough        # named families
    python3 -m scripts.art.props_b.review                    # all of them
    python3 -m scripts.art.props_b.review dustbin --states   # shipped, drawn, every state
    python3 -m scripts.art.props_b.review --ab waymark quern # shipped (A) vs live DRAW_B (B) on meadow/earth stage
    python3 -m scripts.art.props_b.review --grid dustbin 0   # the shipped sprite as a grid

Writes artifacts/prop-b-review.png. Look at this, not at the source, before
calling a prop finished: scale against the figure is most of the judgement.
"""
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from art.props_b import ANIMATED, DRAW_B, STATES, TOPPLING         # noqa: E402
from art.props_b.fallen import leaning                            # noqa: E402
from art.prop_audit import audit as audit_sprite                  # noqa: E402
from art.reference import current_adult                           # noqa: E402

SCALE, PAD = 4, 12


def person():
    return current_adult()


def atlas():
    import json
    frames = json.loads((ROOT / 'public/props/atlas.json').read_text())['frames']
    return frames, Image.open(ROOT / 'public/props/atlas.png').convert('RGBA')


def shipped(key, _cache=[]):
    """The sprite as the game draws it now, pivot included: the before."""
    if not _cache: _cache.append(atlas())
    frames, im = _cache[0]
    if key not in frames: return None
    f = frames[key]; r = f['frame']
    out = im.crop((r['x'], r['y'], r['x'] + r['w'], r['y'] + r['h']))
    p = f.get('pivot', {'x': .5, 'y': 1})
    out.info['anchor'] = [round(p['x'] * out.width), round(p['y'] * out.height)]
    return out


def grid(im, ramps):
    """A sprite as rows for `draw_grid`: digits for the first ramp, a-g and
    A-G for the next two, '?' for anything in none. Start a hand redraw here,
    not from a blank canvas, and keep the perspective it already has."""
    from art.props_b.core import RAMPS
    lut = {}
    for ramp, letters in zip(ramps, ('0123456', 'abcdefg', 'ABCDEFG')):
        for ch, h in zip(letters, RAMPS[ramp]):
            lut.setdefault(tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)), ch)
    px = im.load()
    return [''.join('.' if not px[x, y][3] else lut.get(px[x, y][:3], '?')
                    for x in range(im.width)) for y in range(im.height)]


def sheet(keys=None, variants=1, out=None, states=False):
    keys = keys or sorted(DRAW_B)
    figure = person()
    cells = [(k, v, DRAW_B[k](v)) for k in keys for v in range(variants)]
    if states:
        cells = [(k + suffix, v, draw(v)) for k in keys for v in range(variants)
                 for suffix, draw in [('-shipped', lambda v, k=k: shipped(f'study-propb-{k}-{v}')),
                    ('', DRAW_B[k]),
                    *([('-lean', lambda v, k=k: leaning(DRAW_B[k](v), 1))] if k in TOPPLING else []),
                    *[('-' + state, d) for state, d in STATES.get(k, {}).items()]]]
        cells = [c for c in cells if c[2]]
    cropped = []
    for k, v, sprite in cells:
        box = sprite.getbbox()
        cut = sprite.crop(box)
        ax, ay = sprite.info.get('anchor', [sprite.width // 2, sprite.height])
        cut.info['anchor'] = [ax - box[0], ay - box[1]]
        cropped.append((k, v, cut))
    cells = cropped
    cw = max(s.width for _, _, s in cells) + figure.width + 10
    floor = max(max(s.info['anchor'][1] for _, _, s in cells), figure.height) + 2
    ch = floor + max(0, max(s.height - s.info['anchor'][1] for _, _, s in cells)) + 4
    columns = min(3 if states else 6, len(cells))
    rows = -(-len(cells) // columns)
    sheet = Image.new('RGBA', (columns * (cw * SCALE + PAD) + PAD,
                               rows * (ch * SCALE + 26) + PAD), '#20272a')
    draw = ImageDraw.Draw(sheet)
    for i, (key, variant, sprite) in enumerate(cells):
        x = PAD + (i % columns) * (cw * SCALE + PAD)
        y = PAD + (i // columns) * (ch * SCALE + 26)
        cell = Image.new('RGBA', (cw, ch), '#d6c8a2')
        cell.alpha_composite(figure, (cw - figure.width - 2, floor - figure.height))
        cell.alpha_composite(sprite, (2, floor - sprite.info['anchor'][1]))
        sheet.alpha_composite(cell.resize((cw * SCALE, ch * SCALE), Image.NEAREST), (x, y))
        draw.text((x, y + ch * SCALE + 6),
                  f'{key}-{variant}  {sprite.width}x{sprite.height}', fill='#cbd0bb')
    out = out or ROOT / 'artifacts/prop-b-review.png'
    out.parent.mkdir(exist_ok=True)
    sheet.save(out)
    return out


def _trim_anchor(im):
    box = im.getbbox()
    if not box:
        return im
    cut = im.crop(box)
    ax, ay = im.info.get('anchor', [im.width // 2, im.height])
    cut.info['anchor'] = [ax - box[0], ay - box[1]]
    return cut


def ab_sheet(keys, out=None):
    """Side-by-side shipped (A) vs live DRAW_B (B) contact sheet on a meadow/earth
    stage beside the 40px adult, plus 3x animation strips and prop_audit checks."""
    spec = {f['id']: f for f in json.loads((ROOT / 'src/content/graphics/props.json').read_text())['families']}
    fig = _trim_anchor(person())
    rows_data = []
    anim_strips = []
    faults = []

    for k in keys:
        if k not in DRAW_B:
            continue
        fam = spec.get(k, {'id': k, 'name': k, 'variants': ['v0']})
        n_vars = len(fam.get('variants', ['v0']))
        a_items = []
        b_items = []
        for v in range(n_vars):
            sh = shipped(f'study-propb-{k}-{v}') or shipped(f'study-prop-{k}-{v}')
            if sh:
                a_items.append((f'A: v{v}', _trim_anchor(sh)))
            drawn_raw = DRAW_B[k](v)
            errs = audit_sprite(f'{k}-{v}', drawn_raw, fam.get('size', [drawn_raw.width, drawn_raw.height]))
            if errs:
                faults.append(f'{k}-{v}: {", ".join(errs)}')
            drawn = _trim_anchor(drawn_raw)
            b_items.append((f'B: v{v}', drawn))
        rows_data.append((f'{k} ({fam.get("name", k)})', a_items, b_items))
        if k in ANIMATED:
            n_f = ANIMATED[k]
            frames = []
            for f_idx in range(n_f):
                try:
                    im_f = DRAW_B[k](0, f_idx)
                except TypeError:
                    im_f = DRAW_B[k](0)
                frames.append((f'f{f_idx}', _trim_anchor(im_f)))
            anim_strips.append((f'{k} ({n_f}f)', frames))

    W = 1480
    ROW_H = 260
    ANIM_H = 210 if anim_strips else 0
    H = 60 + len(rows_data) * ROW_H + ANIM_H + 16
    im = Image.new('RGBA', (W, H), '#181c22')
    d = ImageDraw.Draw(im)
    d.text((20, 18), 'PROP A/B REVIEW SHEET — Shipped Atlas (A) vs Live DRAW_B (B) | 4x scale beside 40px adult', fill='#f2e8cf')

    def paste_stage(stage, sp, cx_p, ground_y):
        ax, ay = sp.info.get('anchor', [sp.width // 2, sp.height])
        stage.alpha_composite(sp, (round(cx_p - ax), round(ground_y - ay)))

    y_cur = 54
    for title, a_list, b_list in rows_data:
        d.rectangle([16, y_cur, W - 16, y_cur + ROW_H - 12], fill='#212730', outline='#36404e')
        d.text((28, y_cur + 8), title, fill='#e8c878')
        sw, sh = (W - 56) // SCALE, 44
        ground_y = 35
        stage = Image.new('RGBA', (sw, sh), '#4f783b')
        sd = ImageDraw.Draw(stage)
        sd.rectangle([0, ground_y - 3, sw, sh], fill='#8b6e4b')
        sd.line([(0, ground_y - 3), (sw, ground_y - 3)], fill='#658e49')
        paste_stage(stage, fig, 22, ground_y)
        split_x = 128
        sd.line([(split_x, 2), (split_x, sh - 2)], fill='#d6cfb8')

        if a_list:
            step_a = (split_x - 42) / max(1, len(a_list))
            for i, (_, sp) in enumerate(a_list):
                paste_stage(stage, sp, round(44 + step_a * (i + 0.5)), ground_y)
        if b_list:
            step_b = (sw - split_x - 16) / max(1, len(b_list))
            for i, (_, sp) in enumerate(b_list):
                paste_stage(stage, sp, round(split_x + 12 + step_b * (i + 0.5)), ground_y)

        sx0, sy0 = 28, y_cur + 32
        im.alpha_composite(stage.resize((sw * SCALE, sh * SCALE), Image.NEAREST), (sx0, sy0))
        ly = sy0 + sh * SCALE + 6
        d.text((sx0 + 10 * SCALE, ly), f'adult ({fig.width}x{fig.height})', fill='#a8b4c4')
        if a_list:
            step_a = (split_x - 42) / max(1, len(a_list))
            for i, (lbl, sp) in enumerate(a_list):
                cx_p = round(44 + step_a * (i + 0.5))
                d.text((sx0 + cx_p * SCALE - 28, ly), f'{lbl} ({sp.width}x{sp.height})', fill='#d48a7a')
        if b_list:
            step_b = (sw - split_x - 16) / max(1, len(b_list))
            for i, (lbl, sp) in enumerate(b_list):
                cx_p = round(split_x + 12 + step_b * (i + 0.5))
                d.text((sx0 + cx_p * SCALE - 28, ly), f'{lbl} ({sp.width}x{sp.height})', fill='#8fe0a4')
        y_cur += ROW_H

    if anim_strips:
        d.rectangle([16, y_cur, W - 16, y_cur + ANIM_H - 12], fill='#212730', outline='#36404e')
        d.text((28, y_cur + 8), 'ANIMATION FRAMES (3x)', fill='#e8c878')
        ascale = 3
        sw = (W - 56) // ascale
        sh = 42
        ground_y = 34
        stage = Image.new('RGBA', (sw, sh), '#4f783b')
        sd = ImageDraw.Draw(stage)
        sd.rectangle([0, ground_y - 3, sw, sh], fill='#8b6e4b')
        sd.line([(0, ground_y - 3), (sw, ground_y - 3)], fill='#658e49')
        total_f = sum(len(fs) for _, fs in anim_strips)
        step_f = (sw - 20) / max(1, total_f)
        sx0, sy0 = 28, y_cur + 32
        ly = sy0 + sh * ascale + 6
        idx_f = 0
        for s_lbl, frames in anim_strips:
            for f_lbl, sp in frames:
                cx_p = round(12 + step_f * (idx_f + 0.5))
                paste_stage(stage, sp, cx_p, ground_y)
                idx_f += 1
        im.alpha_composite(stage.resize((sw * ascale, sh * ascale), Image.NEAREST), (sx0, sy0))
        idx_f = 0
        for s_lbl, frames in anim_strips:
            for f_lbl, _ in frames:
                cx_p = round(12 + step_f * (idx_f + 0.5))
                d.text((sx0 + cx_p * ascale - 14, ly), f'{s_lbl.split()[0]}:{f_lbl}', fill='#c8d8b0')
                idx_f += 1

    out = Path(out) if out else ROOT / 'artifacts/prop-ab-review.png'
    out.parent.mkdir(parents=True, exist_ok=True)
    im.save(out)
    if faults:
        print('AUDIT WARNINGS:\n  ' + '\n  '.join(faults))
    else:
        print('AUDIT: 0 warnings across all inspected families.')
    return out


if __name__ == '__main__':
    if '--equipment-abc' in sys.argv:
        import json
        from PIL import ImageFont
        from .equipment_studies import STUDIES, SECOND_STUDIES, draw as equipment
        batch=2 if '--batch2' in sys.argv else 1
        prefix='equipment-batch2-proportion-v2' if batch==2 else 'equipment-batch1'
        font_path='/System/Library/Fonts/Supplemental/Arial.ttf'
        font=ImageFont.truetype(font_path,17)
        title=ImageFont.truetype(font_path,24)
        atlas=Image.open(ROOT/'public/props/atlas.png').convert('RGBA')
        frames=json.loads((ROOT/'public/props/atlas.json').read_text())['frames']
        dest=ROOT/'artifacts/scenery-review';dest.mkdir(parents=True,exist_ok=True)
        only=[s for s in sys.argv[1:] if not s.startswith('--')]
        rows=[s for s in (SECOND_STUDIES if batch==2 else STUDIES) if not only or s[0] in only]
        for start in range(0,len(rows),3):
            group=rows[start:start+3]; cw,ch=462,384
            out=Image.new('RGB',(cw*3+32,ch*len(group)+104),'#1d272b')
            d=ImageDraw.Draw(out)
            d.text((18,13),f'WORK & COOKING EQUIPMENT  /  BATCH {batch}',font=title,fill='#eee3c5')
            d.text((18,48),'A  shipped     B  refined     C  alternate    |    4x display / same 38px adult (~1.7m)' if batch==2 else 'A  shipped     B  refined construction     C  alternate construction',font=font,fill='#c5c7b0')
            for row,(key,name,bname,cname) in enumerate(group):
                # The source atlas, including its shipped pivot, is the only A.
                frame='study-propb-'+key.replace('_','-')+'-0'
                if frame not in frames:frame='study-prop-'+key+'-0'
                f=frames[frame]; r=f['frame']
                a=atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
                a.info['anchor']=[a.width*f.get('pivot',{}).get('x',.5),a.height*f.get('pivot',{}).get('y',1)]
                sprites=[a,equipment(key,'b'),equipment(key,'c')]
                for col,(im,label) in enumerate(zip(sprites,['Shipped sprite',bname,cname])):
                    x=16+col*cw;y=89+row*ch
                    d.text((x+4,y),name if col==0 else 'BC'[col-1]+'  '+label,font=font,fill='#efdfbc')
                    native=Image.new('RGBA',(112,78) if batch==2 else (150,104),'#7d8969')
                    ax,ay=im.info['anchor'];floor=62 if batch==2 else 86
                    native.alpha_composite(im,(round((36 if batch==2 else 54)-ax),round(floor-ay)))
                    if batch==2:
                        from art.reference import current_adult_d
                        fig=current_adult_d()[0]
                    else:fig=person()
                    native.alpha_composite(fig,((96 if batch==2 else 134)-fig.width//2,floor-fig.height))
                    tile=native.resize((448 if batch==2 else 450,312),Image.Resampling.NEAREST)
                    out.paste(tile.convert('RGB'),(x,y+30))
                    d.text((x+5,y+349),f'{"ABC"[col]}  {im.width} x {im.height} native px',font=font,fill='#bfc8bb')
                    if col:
                        im.save(dest/f'{prefix}-{key}-{"bc"[col-1]}.png')
            path=dest/f'{prefix}-abc-{start//3+1}.png';out.save(path);print(path)
    elif sys.argv[1:2] == ['--grid']:
        key, v = sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 0
        ramps = sys.argv[4:] or ['galvanised7']
        print('\n'.join(f' "{row}",' for row in grid(shipped(f'study-propb-{key}-{v}') or DRAW_B[key](v), ramps)))
    elif '--ab' in sys.argv:
        args = [s for s in sys.argv[1:] if s != '--ab' and not s.startswith('--out=')]
        out_arg = next((s.split('=', 1)[1] for s in sys.argv[1:] if s.startswith('--out=')), None)
        print(ab_sheet(args or sorted(DRAW_B)[:6], out=out_arg))
    else:
        print(sheet([s for s in sys.argv[1:] if s != '--states'] or None, states='--states' in sys.argv))
