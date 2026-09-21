"""Compile the independent review library. Does not touch the playable atlas."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, re, textwrap
from art.atlas import pack_atlas
from art.shadows import build_shadows
from art.props import draw_prop
from art.props_b import DRAW_B, LAYERED, FALLEN, ANIMATED
from art.prop_audit import audit

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/props'; OUT.mkdir(parents=True,exist_ok=True)
catalog=json.loads((ROOT/'src/content/graphics/props.json').read_text())
SHADOW_FROM={'oil-lamp':35,'hearth':30,'three-stone-hearth':36,'long-fire':32,'tannur':22,'brazier':25,'stove':16,'fire-basket':23,'oil-drum':16}
def trim(image):
    """Pack the real silhouette, not the canvas it was drawn on.

    A fixed 48x48 box for every family is what let a sickle end up as wide as a
    well; the pivot moves with the crop so nothing shifts on the ground."""
    box=image.getbbox()
    cut=image.crop(box)
    ax,ay=image.info.get('anchor',[image.width//2,image.height])
    cut.info['anchor']=[ax-box[0],ay-box[1]]
    if 'shadowMinY' in image.info:cut.info['shadowMinY']=image.info['shadowMinY']-box[1]
    return cut

sprites={};over=[]
# A redrawn family has no A study built: the B set is what the world, the
# carried props and the lab all draw, so packing the old one wastes atlas room
# and puts superseded art in front of anyone reviewing.
B_ONLY=set(DRAW_B)
for family in catalog['families']:
    # A family drawn only in the B set has no A study to build.
    for variant in ([] if family['id'] in B_ONLY else range(len(family['variants']))):
        key=f"study-prop-{family['id']}-{variant}"
        for frame in range(family.get('frames',1)):
            image=draw_prop(family['id'],variant,frame)
            image.info['anchor']=[24,48]
            image=trim(image)
            # A flame casts no shadow: only the stones, body or legs under it.
            if family['id'] in SHADOW_FROM:image.info['shadowMinY']=SHADOW_FROM[family['id']]
            assert image.getbbox(), f'Empty sprite: {key}'
            # Shadows come from the real silhouette, not ellipses painted into art.
            assert all(alpha in (0,255) for alpha in image.getchannel('A').getdata())
            sprites[key if frame==0 else f'{key}-f{frame}']=image
            budget=family.get('size')
            if budget and (image.width>budget[0] or image.height>budget[1]):
                over.append(f"{family['id']}-{variant}: {image.width}x{image.height} over {budget[0]}x{budget[1]}")
    if family['id'] in DRAW_B:
        for variant in range(len(family['variants'])):
            drawn=DRAW_B[family['id']](variant)
            # Audited before trimming: afterwards every sprite touches its own
            # edges by definition and the clipping check means nothing.
            over+=audit(f"{family['id']}-{variant} (B)",drawn,family.get('size'))
            sprites[f"study-propb-{family['id']}-{variant}"]=trim(drawn)
            for layer in LAYERED.get(family['id'],()):
                sprites[f"study-propb-{family['id']}-{variant}-{layer}"]=trim(
                    DRAW_B[family['id']](variant,layer))
            for motion in range(1,ANIMATED.get(family['id'],1)):
                sprites[f"study-propb-{family['id']}-{variant}-m{motion}"]=trim(
                    DRAW_B[family['id']](variant,motion))
            if family['id'] in FALLEN:
                sprites[f"study-propb-{family['id']}-{variant}-fallen"]=trim(
                    FALLEN[family['id']](variant))
from art.props.states import runtime_sprites
sprites.update({k:trim(v) for k,v in runtime_sprites().items() if 'broken' not in k})
from art.props_b.remains import REMAINS
for material,draw in REMAINS.items():
    for variant in range(3):
        im=draw(variant);im.info['anchor']=[im.width//2,im.height]
        sprites[f'prop-broken-{material}-{variant}']=trim(im)
    # Saves from before thevariants name these three without a suffix.
    if material in ('clay','wood','fiber'):
        im=draw(0);im.info['anchor']=[im.width//2,im.height]
        sprites[f'prop-broken-{material}']=trim(im)
pack_atlas(sprites,OUT,'atlas',512)
# Animation frames share the base frame's shadow.
# The hangings cast no shadow of their own; the frame is a state the renderer
# draws on its own, so it keeps a mask.
shadows=build_shadows(ROOT,{k:v for k,v in sprites.items() if not re.search(r'-f\d$|-hang$',k)},{},output=OUT,atlas_name='shadows')
generated=ROOT/'src/render/generated'
# The families the game should draw from the B set, for src/content/props.
(ROOT/'src/render/generated/props-b.json').write_text(json.dumps(sorted(DRAW_B)))
for source,target in [('atlas','props'),('shadows','prop-shadows')]:
    (generated/f'{target}.json').write_bytes((OUT/f'{source}.json').read_bytes())

rows=-(-len(catalog['families'])//8)
proof=Image.new('RGB',(1280,52+rows*194+12),'#20272a');d=ImageDraw.Draw(proof)
d.text((24,17),f'UHS / {len(catalog["families"])} SHARED PROP FAMILIES / SHARED WORLD GRID / EVERY SPRITE AT 3x / NO CAST SHADOWS',fill='#e7d5ad')
for index,family in enumerate(catalog['families']):
    x=16+(index%8)*158;y=52+(index//8)*194
    d.rounded_rectangle((x,y,x+148,y+184),radius=5,fill='#d6c8a2')
    key=f"study-prop-{family['id']}-0"
    if key not in sprites:key=f"study-propb-{family['id']}-0"
    sprite=sprites[key].resize((144,144),Image.Resampling.NEAREST)
    proof.paste(sprite,(x+2,y),sprite)
    lines=textwrap.wrap(f'{index+1}. {family["name"]}',23)
    for line_index,line in enumerate(lines):d.text((x+8,y+151+line_index*12),line,fill='#3a3c33')
(ROOT/'artifacts').mkdir(exist_ok=True)
proof.save(ROOT/'artifacts/prop-review-sheet.png')
if over:
    print(f'{len(over)} audit notes:')
    for line in over:print(f'  {line}')
from art.stamp import write_stamp
print(f'Art stamp {write_stamp(ROOT)}')
print(f'Built {len(catalog["families"])} prop families / {len(sprites)} study frames.')
