"""Compile the independent review library. Does not touch the playable atlas."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, textwrap
from art.atlas import pack_atlas
from art.shadows import build_shadows
from art.props import draw_prop

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/props'; OUT.mkdir(parents=True,exist_ok=True)
catalog=json.loads((ROOT/'src/content/graphics/props.json').read_text())
sprites={}
for family in catalog['families']:
    for variant in range(len(family['variants'])):
        key=f"study-prop-{family['id']}-{variant}"
        image=draw_prop(family['id'],variant)
        image.info['anchor']=[24,48]
        if family['id'] in ['hearth','oil-lamp']:image.info['shadowMinY']=35 if family['id']=='oil-lamp' else 30
        assert image.getbbox(), f'Empty sprite: {key}'
        # Shadows come from the real silhouette, not ellipses painted into art.
        assert all(alpha in (0,255) for alpha in image.getchannel('A').getdata())
        sprites[key]=image
from art.props.states import runtime_sprites
sprites.update(runtime_sprites())
pack_atlas(sprites,OUT,'atlas',512)
shadows=build_shadows(ROOT,sprites,{},output=OUT,atlas_name='shadows')
generated=ROOT/'src/render/generated'
for source,target in [('atlas','props'),('shadows','prop-shadows')]:
    (generated/f'{target}.json').write_bytes((OUT/f'{source}.json').read_bytes())

proof=Image.new('RGB',(1280,1034),'#20272a');d=ImageDraw.Draw(proof)
d.text((24,17),'UHS / 40 SHARED PROP FAMILIES / SHARED WORLD GRID / EVERY SPRITE AT 3x / NO CAST SHADOWS',fill='#e7d5ad')
for index,family in enumerate(catalog['families']):
    x=16+(index%8)*158;y=52+(index//8)*194
    d.rounded_rectangle((x,y,x+148,y+184),radius=5,fill='#d6c8a2')
    key=f"study-prop-{family['id']}-0"
    sprite=sprites[key].resize((144,144),Image.Resampling.NEAREST)
    proof.paste(sprite,(x+2,y),sprite)
    lines=textwrap.wrap(f'{index+1}. {family["name"]}',23)
    for line_index,line in enumerate(lines):d.text((x+8,y+151+line_index*12),line,fill='#3a3c33')
(ROOT/'artifacts').mkdir(exist_ok=True)
proof.save(ROOT/'artifacts/prop-review-sheet.png')
print(f'Built {len(catalog["families"])} prop families / {len(sprites)} study frames.')
