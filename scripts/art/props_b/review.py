"""Contact sheet for the B studies: every prop beside a character, at N times.

    python3 -m scripts.art.props_b.review well trough        # named families
    python3 -m scripts.art.props_b.review                    # all of them

Writes artifacts/prop-b-review.png. Look at this, not at the source, before
calling a prop finished: scale against the figure is most of the judgement.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / 'scripts'))
from art.props_b import DRAW_B, FALLEN, TOPPLING                   # noqa: E402
from art.props_b.fallen import leaning                            # noqa: E402
from art.reference import current_adult                           # noqa: E402

SCALE, PAD = 4, 12


def person():
    return current_adult()


def sheet(keys=None, variants=1, out=None, states=False):
    keys = keys or sorted(DRAW_B)
    figure = person()
    cells = [(k, v, DRAW_B[k](v)) for k in keys for v in range(variants)]
    if states:
        cells = [(k + suffix, v, draw(v)) for k in keys for v in range(variants)
                 for suffix, draw in [('', DRAW_B[k]),
                    *([('-lean', lambda v, k=k: leaning(DRAW_B[k](v), 1))] if k in TOPPLING else []),
                    *([('-fallen', FALLEN[k])] if k in FALLEN else [])]]
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
    else:
        print(sheet([s for s in sys.argv[1:] if s != '--states'] or None, states='--states' in sys.argv))
