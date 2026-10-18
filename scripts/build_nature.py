"""Build the reviewed nature additions separately from legacy world assets."""
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw
from art.nature_trees import trees
from art.nature_understory import understory
from art.voxel_trees import voxel_trees
from art.small_shrubs import small_shrubs
from art.shrubs import shrubs
from art.habitat_plants import habitat_plants
from art.regional_trees import regional_trees
from art.succulents import succulent_shrubs, succulent_trees
from art.fungi import fungi
from art.dung import dung
from art.remains import remains
from art.worked_ground import worked_ground
from art.rocks import rocks
from art.boulders import boulders
from art.props_b.wells import historical_wells
from art.props_b.container_studies import historical_containers
from art.atlas import pack_atlas
from art.shadows import build_shadows
from art.stamp import write_stamp
root=Path(__file__).resolve().parent.parent
if '--container-history-sheet' in sys.argv:
    from PIL import ImageFont
    from art.props_b.vessels import CONTAINER_STUDIES
    from art.props_b.container_studies import container_study
    from art.reference import current_adult_d
    review=root/'artifacts/scenery-review';review.mkdir(parents=True,exist_ok=True)
    font='/System/Library/Fonts/Supplemental/Arial.ttf'
    title=ImageFont.truetype(font,30);label=ImageFont.truetype(font,22)
    small=ImageFont.truetype(font,16);tiny=ImageFont.truetype(font,14)
    adult,_=current_adult_d()
    for style in ['b','c']:
        sheet=Image.new('RGB',(1440,1650),'#202839');d=ImageDraw.Draw(sheet)
        name='B / rebuilt pixel-art surfaces' if style=='b' else 'C / voxel-built objects'
        d.text((24,18),f'Storage & carrying traditions — {name}',font=title,fill='#f4e8ca')
        d.text((24,60),'Same twelve objects / shared 4x scale / native-size insets / square-on projection / one-pixel contours',font=small,fill='#cbd2c6')
        d.text((24,86),'Review only. Figures show the current adult; regional traditions need narrower date and locality profiles before placement.',font=small,fill='#cbd2c6')
        for i,(kind,name,context,detail) in enumerate(CONTAINER_STUDIES):
            im=container_study(kind,voxel=style=='c')
            assert set(im.getchannel('A').getdata()) <= {0,255}
            assert im.getbbox()[0]>0 and im.getbbox()[1]>0
            im.save(review/f'container-{style}-v2-{i+1:02d}-{kind}.png')
            x=12+i%3*476;y=124+i//3*375
            d.rounded_rectangle((x,y,x+463,y+362),radius=6,fill='#333d46')
            d.text((x+14,y+12),f'{i+1:02d}  {name}',font=label,fill='#f4e8ca')
            d.text((x+14,y+43),context,font=small,fill='#cbd2c6')
            d.rectangle((x+10,y+73,x+453,y+323),fill='#859074')
            base=y+280
            enlarged=im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST)
            ax,ay=im.info['anchor']
            sprite_x=x+156-round(ax*4);sprite_y=base-round(ay*4)
            assert sprite_y>=y+73 and sprite_y+enlarged.height<=y+323,(kind,im.size,im.info)
            sheet.paste(enlarged,(sprite_x,sprite_y),enlarged)
            person=adult.resize((adult.width*4,adult.height*4),Image.Resampling.NEAREST)
            sheet.paste(person,(x+290,base-person.height),person)
            sheet.paste(im,(x+416-round(ax),base-round(ay)),im)
            d.text((x+399,y+80),'1x',font=tiny,fill='#edf0d8')
            d.text((x+14,y+337),detail,font=tiny,fill='#dce0cc')
            print(f'{style.upper()} {i+1:02d} {kind}: {im.width}x{im.height}',flush=True)
        d.text((24,1629),'One native pixel is four display pixels on both sheets. The models share dimensions, depth projection and upper-left lighting.',font=tiny,fill='#cbd2c6')
        out=review/f'historical-containers-{style}-v2.png';sheet.save(out)
        print(f'Wrote {out}',flush=True)
    raise SystemExit(0)
if '--well-history' in sys.argv:
    import textwrap
    from PIL import ImageFont
    from art.props_b.wells import historical_well,HISTORICAL_WELLS
    from art.worked_ground import prop_kit_candidate
    review=root/'artifacts/scenery-review';review.mkdir(parents=True,exist_ok=True)
    font='/System/Library/Fonts/Supplemental/Arial.ttf'
    title=ImageFont.truetype(font,27);label=ImageFont.truetype(font,21)
    small=ImageFont.truetype(font,17);tiny=ImageFont.truetype(font,14)
    for batch in range(2):
        sheet=Image.new('RGB',(1380,1030),'#202839');d=ImageDraw.Draw(sheet)
        d.text((22,18),f'Historical well coverage / {batch+1} of 2',font=title,fill='#f4e8ca')
        d.text((22,59),'New native pixel art / square-on / one-pixel contours / review only',font=small,fill='#cbd2c6')
        d.text((22,91),'Main views 3x; insets 1x. All ticks represent the same 37px adult at 3x.',font=small,fill='#cbd2c6')
        d.text((22,125),'Date ranges are proposed uses; reconstruction notes distinguish interpretation from surviving evidence.',font=tiny,fill='#cbd2c6')
        d.rectangle((1110,42,1368,183),fill='#71805e')
        d.text((1117,18),'24B / same 3x scale',font=small,fill='#f4e8ca')
        ref=prop_kit_candidate('well');ref=ref.resize((ref.width*3,ref.height*3),Image.Resampling.NEAREST)
        sheet.paste(ref,(1156,178-ref.height),ref)
        for i,(kind,name,period,detail,source) in enumerate(HISTORICAL_WELLS[batch*6:batch*6+6]):
            im=historical_well(kind)
            assert set(im.getchannel('A').getdata()) <= {0,255}
            assert len(im.getcolors(im.width*im.height)) <= 24,(kind,len(im.getcolors(im.width*im.height)))
            bb=im.getbbox();assert bb and bb[0]>0 and bb[1]>0 and bb[2]<im.width and bb[3]<im.height,(kind,bb)
            assert im.width<=81 and im.height<=66
            im.save(review/f'well-history-{kind}.png')
            x=i%3*460+10;y=190+i//3*390
            d.rectangle((x,y,x+438,y+377),fill='#71805e')
            d.text((x+12,y+11),name,font=label,fill='#fff0cf')
            d.text((x+12,y+41),period,font=small,fill='#f3ebcd')
            for j,line in enumerate(textwrap.wrap(detail,53)):
                d.text((x+12,y+68+j*18),line,font=tiny,fill='#e4e7d6')
            enlarged=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
            sheet.paste(enlarged,(x+185-enlarged.width//2,y+332-enlarged.height),enlarged)
            sheet.paste(im,(x+370-im.width//2,y+332-im.height),im)
            d.line((x+420,y+332,x+420,y+221),fill='#e4dec4')
            for yy in [y+221,y+332]:d.line((x+416,yy,x+424,yy),fill='#e4dec4')
            d.text((x+173,y+337),'3x',font=tiny,fill='#e4e7d6');d.text((x+361,y+337),'1x',font=tiny,fill='#e4e7d6')
            d.text((x+12,y+358),source,font=tiny,fill='#e4e7d6')
        d.text((22,987),'Shared materials and mechanisms can cross cultural boundaries; these are starting profiles, not exclusive cultural signatures.',font=tiny,fill='#cbd2c6')
        sheet.save(review/f'historical-wells-{batch+1}-v2.png')
        print(f'Wrote {review}/historical-wells-{batch+1}-v2.png')
    raise SystemExit(0)
if '--rock-size-sheet' in sys.argv:
    from PIL import ImageFont
    from art.boulders import size_candidate
    from art.rocks import rock_candidate
    review=root/'artifacts/scenery-review'
    review.mkdir(exist_ok=True,parents=True)
    font='/System/Library/Fonts/Supplemental/Arial.ttf'
    title=ImageFont.truetype(font,26)
    label=ImageFont.truetype(font,20)
    small=ImageFont.truetype(font,15)
    rows=[('grey','Grey stone','Broad weathered faces; chipped foot'),
          ('dune','Sandstone','Uneven beds; eroded ledges and seams'),
          ('red','Red stone','Iron-red faces; deep split and broken shoulder'),
          ('basalt','Basalt','Dense angular mass; intersecting fractures'),
          ('slab','Slab stone','Inclined cleavage; broad plates and broken toe'),
          ('mossy','Mossy stone','Weathered rock; moss follows sheltered ledges'),
          ('lichen','Lichen stone','Pale weathered faces; scattered crusts')]
    sheet=Image.new('RGB',(1200,2130),'#202a39');d=ImageDraw.Draw(sheet)
    d.text((22,16),'Rock sizes / B native pixel art',font=title,fill='#f4e8ca')
    d.text((22,53),'New medium + large drawings. Small shown for scale. All sprites at 3x; vertical ticks = 37 px adult.',font=small,fill='#c8d0ca')
    for x,text in [(22,'SMALL / installed B'),(423,'MEDIUM / 54 x 44 px'),(823,'LARGE / 84 x 68 px')]:
        d.text((x,87),text,font=label,fill='#f4e8ca')
    for i,(kind,name,note) in enumerate(rows):
        y=125+i*260
        for col in range(3):
            x=col*400
            d.rectangle((x+10,y,x+390,y+248),fill='#71805e')
            if col==0:
                d.text((x+21,y+10),f'{i+1}. {name}',font=label,fill='#fff0cf')
                d.text((x+21,y+38),note,font=small,fill='#e1e3cc')
            form={'dune':'sand','mossy':'moss'}.get(kind,kind)
            im=rock_candidate(form,(32,28)) if col==0 else size_candidate(kind,col==2)
            if col:
                assert set(im.getchannel('A').getdata()) <= {0,255}
                assert len(im.getcolors(100000)) <= 24
                assert im.getbbox()[0]>0 and im.getbbox()[1]>0 and im.getbbox()[2]<im.width and im.getbbox()[3]<im.height
                im.save(review/f'{kind}-{"medium" if col==1 else "large"}-b.png')
            preview=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
            sheet.paste(preview,(x+190-preview.width//2,y+230-preview.height),preview)
            d.line((x+360,y+230-111,x+360,y+230),fill='#d5d2ac')
            d.line((x+356,y+230-111,x+364,y+230-111),fill='#d5d2ac')
            d.line((x+356,y+230,x+364,y+230),fill='#d5d2ac')
    d.text((22,1960),'Native size / medium + large / 1 image pixel = 1 game pixel',font=label,fill='#f4e8ca')
    for i,(kind,name,_) in enumerate(rows):
        x=10+i*170
        d.rectangle((x,1995,x+165,2115),fill='#71805e')
        d.text((x+6,2000),name,font=small,fill='#fff0cf')
        for large,dx in [(False,8),(True,72)]:
            im=size_candidate(kind,large)
            sheet.paste(im,(x+dx,2105-im.height),im)
    sheet.save(review/'rocks-b-uniform-pixels-v3.png')
    print(f'Wrote {review}/rocks-b-uniform-pixels-v3.png (14 new native sprites).')
    raise SystemExit(0)
if any(arg in sys.argv for arg in ['--shrub-abc','--plant-abc','--plant-survey','--succulent-abc','--scenery-survey','--scenery-abc','--objects-front-abc','--prop-kit-abc']):
    import json
    from PIL import ImageFont
    from art.shrubs import shrub_candidate
    from art.habitat_plants import plant_candidate
    from art.succulents import succulent_candidate
    from art.rocks import rock_candidate
    from art.worked_ground import scenery_candidate
    review=root/('artifacts/scenery-review' if any(a in sys.argv for a in ['--scenery-abc','--objects-front-abc','--prop-kit-abc']) else 'artifacts/shrub-review')
    review.mkdir(exist_ok=True,parents=True)
    font='/System/Library/Fonts/Supplemental/Arial.ttf'
    title=ImageFont.truetype(font,25)
    label=ImageFont.truetype(font,19)
    small=ImageFont.truetype(font,15)
    banks=[]
    for bank in ['nature','packs','ecology','props']:
        path=root/'public'/bank
        banks.append((Image.open(path/'atlas.png').convert('RGBA'),json.loads((path/'atlas.json').read_text())['frames']))
    def shipped(asset):
        for atlas,frames in banks:
            if asset in frames:
                r=frames[asset]['frame']
                return atlas.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
        raise KeyError(asset)
    if '--prop-kit-abc' in sys.argv:
        from art.worked_ground import prop_kit_candidate
        rows=[('crate','21. Prop-kit crate','Square front; fitted frame and brace'),
              ('open-basket','22. Storage basket','Open mouth; tapered woven body'),
              ('water-jug','23. Water jug','Narrow neck; one clear loop handle'),
              ('well','24. Stone well','Deep shaft; staggered masonry and coping')]
        sheet=Image.new('RGB',(1260,1160),'#202839');d=ImageDraw.Draw(sheet)
        d.text((22,16),'Batch 2 / prop-kit objects / A-B-C',font=title,fill='#f4e8ca')
        d.text((22,52),'Main sprites 3x; native-size inset 1x. Ticks = 37px adult at 3x. Review only.',font=small,fill='#bdc6c3')
        for col,heading in enumerate(['A  Shipped prop kit','B  Native pixel art','C  Voxel geometry']):
            d.text((col*420+22,91),heading,font=label,fill='#f4e8ca')
        for row,(form,name,description) in enumerate(rows):
            variants=[shipped(f'study-propb-{form}-0'),prop_kit_candidate(form),prop_kit_candidate(form,True)]
            for col,im in enumerate(variants):
                if col:
                    assert set(im.getchannel('A').getdata()) <= {0,255}
                    assert len(im.getcolors(im.width*im.height)) <= 24,(form,col,len(im.getcolors(im.width*im.height)))
                    bb=im.getbbox();assert bb and bb[0]>0 and bb[1]>0 and bb[2]<im.width and bb[3]<im.height,(form,col,bb)
                im.save(review/f'batch2-{form}-{chr(97+col)}.png')
                x,y=col*420+12,128+row*252
                d.rectangle((x,y,x+395,y+240),fill='#71805e')
                d.text((x+12,y+9),name,font=label,fill='#f8eed4')
                d.text((x+12,y+36),description if col else f'Actual shipped pixels / {im.width} x {im.height} px',font=small,fill='#e4e7d6')
                enlarged=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
                sheet.paste(enlarged,(x+135-enlarged.width//2,y+212-enlarged.height),enlarged)
                sheet.paste(im,(x+300-im.width//2,y+212-im.height),im)
                d.text((x+125,y+220),'3x',font=small,fill='#e4e7d6')
                d.text((x+290,y+220),'1x',font=small,fill='#e4e7d6')
                d.line((x+366,y+212,x+366,y+101),fill='#e8dfbb')
                for yy in [y+101,y+212]:d.line((x+362,yy,x+370,yy),fill='#e8dfbb')
        sheet.save(review/'batch2-prop-kit-abc-v3.png')
        print(f'Wrote {review}/batch2-prop-kit-abc-v3.png')
        raise SystemExit(0)
    if '--scenery-survey' in sys.argv:
        rows=[('Loose grey rocks','rock'),('Sandstone rocks','nature-rock-dune-0'),('Red rocks','nature-rock-red-0'),
              ('Basalt rocks','nature-rock-basalt-0'),('Slab rocks','nature-rock-slab-0'),('Mossy rocks','nature-rock-mossy-0'),
              ('Basalt boulder','nature-boulder-basalt-0'),('Slab boulder','nature-boulder-slab-0'),
              ('Fallen branches','ecology-branches'),('Cut logs','nature-logs'),('Rubble','nature-rubble'),
              ('Crate / old small sprite','crate'),('Basket / old small sprite','basket'),
              ('Amphora / old small sprite','amphora'),('Jug / old small sprite','jug'),
              ('Well / old small sprite','well'),('Fire / old small sprite','fire'),('Log / old small sprite','log'),
              ('Hand tool','tool'),('Animal bones','nature-remains-bones'),
              ('Crate / prop kit','study-propb-crate-0'),('Basket / prop kit','study-propb-open-basket-0'),
              ('Water jug / prop kit','study-propb-water-jug-0'),('Well / prop kit','study-propb-well-0')]
        sheet=Image.new('RGB',(1440,1540),'#71805e');d=ImageDraw.Draw(sheet)
        d.text((20,12),'Shipped rocks and objects / actual atlas pixels at 3x',font=title,fill='#f4e8ca')
        for i,(name,asset) in enumerate(rows):
            im=shipped(asset);im=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
            x=i%4*360;y=i//4*245+65
            d.text((x+12,y+8),f'{i+1}. {name}',font=label,fill='#f4e8ca')
            sheet.paste(im,(x+180-im.width//2,y+225-im.height),im)
        sheet.save(review/'rocks-objects-shipped.png')
        print(f'wrote {review}/rocks-objects-shipped.png')
        raise SystemExit(0)
    if '--plant-survey' in sys.argv:
        names=['henna','tree-cotton','karonda','goji','sugarbush','annatto','wattle','bush-clover','kerria','salal',
               'azalea','bell-heather','caper','ephedra','yucca','maguey','aloe-vera','pigface','prickly-pear','ocotillo']
        sheet=Image.new('RGB',(1500,980),'#71805e');d=ImageDraw.Draw(sheet)
        d.text((20,12),'More shipped plants / 21–40 / actual atlas pixels at 3x',font=title,fill='#f4e8ca')
        for i,name in enumerate(names):
            im=shipped(f'nature-shrub-{name}');im=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
            x=i%5*300;y=i//5*230+60
            d.text((x+10,y+10),f'{21+i}. {name.replace("-"," ").title()}',font=label,fill='#f4e8ca')
            sheet.paste(im,(x+150-im.width//2,y+210-im.height),im)
        sheet.save(review/'more-shipped-21-40.png')
        print(f'wrote {review}/more-shipped-21-40.png')
        raise SystemExit(0)
    groups={
        'leafy': [('leafy','Fallback leafy bush','nature-understory-low-leafy-shrub','Irregular connected foliage; visible stems'),
                  ('tea','Tea','nature-shrub-tea','Broad evergreen crown; small pale flowers'),
                  ('hazel','Hazel','nature-shrub-hazel','Tall multi-stem habit; larger leaf masses')],
        'woody': [('scrub','Fallback woody scrub','nature-dry-scrub-medium','Uneven forks; open crown; sparse foliage'),
                  ('sagebrush','Sagebrush','nature-shrub-sagebrush','Grey foliage; exposed woody framework'),
                  ('creosote','Creosote','nature-shrub-creosote','Long sparse branches; small terminal leaves')],
        'low': [('heath','Fallback low heath','nature-understory-low-heath','Low irregular mat; several rooting points'),
                ('heather','Heather','nature-shrub-heather','Upright flowering sprays above a woody base'),
                ('crowberry','Crowberry','nature-shrub-crowberry','Dark prostrate mat; scattered black fruit'),
                ('bunchgrass','Dry bunchgrass','nature-understory-dry-bunchgrass','Dense basal crown; curved blades; seed heads')],
    }
    if '--plant-abc' in sys.argv:
        groups={
            'flowers-berries-broom': [('flowers','1. Flowers','flowers','Loose stems and open cream flowers'),
                                     ('berry','2. Resource berry bush','ecology-berry-bush','Tangled branches; leaves and sheltered fruit'),
                                     ('broom','11. Broom','nature-shrub-broom','Long green shoots; flowers along the stems')],
            'sedge-reeds': [('sedge','4. Sedge','nature-understory-sedge','Curved ribbon leaves; dense basal crown'),
                           ('reeds','5. Reeds','reeds','Unequal stalks; bent leaves; textured heads')],
        }
    if '--succulent-abc' in sys.argv:
        groups={'ephedra-yucca': [('ephedra','34. Ephedra','nature-shrub-ephedra','Jointed shoots; several uneven rooting stems'),
                                 ('yucca','35. Yucca','nature-shrub-yucca','Stiff pointed blades; raised cream flowers')],
                'maguey-aloe': [('maguey','36. Maguey','nature-shrub-maguey','Broad folded leaves; curling outer blades'),
                                ('aloe-vera','37. Aloe vera','nature-shrub-aloe-vera','Fleshy leaves beneath a golden flower stalk')]}
    candidate=succulent_candidate if '--succulent-abc' in sys.argv else plant_candidate if '--plant-abc' in sys.argv else shrub_candidate
    if '--scenery-abc' in sys.argv or '--objects-front-abc' in sys.argv:
        groups={
            'batch1-rocks-1-4': [('grey','1. Loose grey rocks','rock','Broken faces; dominant stone and smaller chips'),
                                 ('sand','2. Sandstone','nature-rock-dune-0','Weathered layers; offset ledges and seams'),
                                 ('red','3. Red rocks','nature-rock-red-0','Split angular stone; warm exposed fractures'),
                                 ('basalt','4. Basalt rocks','nature-rock-basalt-0','Dark mass; sharp broken shoulders')],
            'batch1-rocks-5-8': [('slab','5. Slab rocks','nature-rock-slab-0','Thin overlapping plates; irregular broken edges'),
                                 ('moss','6. Mossy rocks','nature-rock-mossy-0','Moss follows the stone; bare rock remains visible'),
                                 ('boulder-basalt','7. Basalt boulder','nature-boulder-basalt-0','Uneven shoulders; heavy fractured side planes'),
                                 ('boulder-slab','8. Slab boulder','nature-boulder-slab-0','Leaning stone; broad face and broken foot')],
            'batch1-objects-9-12': [('branches','9. Fallen branches','ecology-branches','Crooked forks; tapering twigs and exposed ends'),
                                    ('logs','10. Cut logs','nature-logs','Rounded timber; cut grain and rough bark'),
                                    ('rubble','11. Rubble','nature-rubble','Angular shards; several sizes and resting angles'),
                                    ('crate','12. Small crate','crate','Plank edges; corner joints; timber brace')],
        }
        rock_forms={'grey','sand','red','basalt','slab','moss','boulder-basalt','boulder-slab'}
        def candidate(form,size,voxel=False):
            return (rock_candidate if form in rock_forms else scenery_candidate)(form,size,voxel)
        if '--objects-front-abc' in sys.argv:
            groups={'batch1-objects-9-12-front':groups['batch1-objects-9-12']}
    for group,rows in groups.items():
        sheet=Image.new('RGB',(1260,136+len(rows)*252),'#202839')
        d=ImageDraw.Draw(sheet)
        heading={'flowers-berries-broom':'Flowers, berry bush and broom','sedge-reeds':'Sedge and reeds',
                 'ephedra-yucca':'Ephedra and yucca','maguey-aloe':'Maguey and aloe vera',
                 'batch1-rocks-1-4':'Batch 1 / rocks 1–4','batch1-rocks-5-8':'Batch 1 / rocks 5–8',
                 'batch1-objects-9-12':'Batch 1 / objects 9–12',
                 'batch1-objects-9-12-front':'Batch 1 / objects 9–12 / square-on revision'}.get(group,f'{group.title()} shrubs')
        d.text((22,16),f'{heading} / A-B-C',font=title,fill='#f4e8ca')
        note='A at original size. B/C newly drawn on larger native canvases; square fronts, visible tops.' if '--objects-front-abc' in sys.argv else 'Real native-resolution assets. Same canvas per row. Review only; live sprites unchanged.'
        d.text((22,52),note,font=small,fill='#bdc6c3')
        for col,heading in enumerate(['A  Current','B  Native pixel art','C  Voxel geometry']):
            d.text((col*420+22,91),heading,font=label,fill='#f4e8ca')
        for row,(form,name,asset,description) in enumerate(rows):
            a=shipped(asset)
            size={'branches':(40,28),'logs':(48,34),'rubble':(36,22),'crate':(32,36)}[form] if '--objects-front-abc' in sys.argv else a.size
            variants=[a,candidate(form,size),candidate(form,size,True)]
            for col,im in enumerate(variants):
                assert im.size==(size if col else a.size)
                if col:
                    assert set(im.getchannel('A').getdata()) <= {0,255}
                    assert len(im.getcolors(im.width*im.height)) <= 24
                bb=im.getbbox()
                if col:assert bb and bb[0]>0 and bb[1]>0 and bb[2]<im.width and bb[3]<im.height,(form,col,bb)
                im.save(review/f'{form}-{chr(97+col)}.png')
                x,y=col*420+12,128+row*252
                d.rectangle((x,y,x+395,y+240),fill='#71805e')
                d.text((x+12,y+9),name,font=label,fill='#f8eed4')
                d.text((x+12,y+36),description,font=small,fill='#e4e7d6')
                for scale,cx,base in [(4,x+132,y+207),(2,x+305,y+207)]:
                    enlarged=im.resize((im.width*scale,im.height*scale),Image.Resampling.NEAREST)
                    sheet.paste(enlarged,(cx-enlarged.width//2,base-enlarged.height),enlarged)
                    d.text((cx-14,y+218),f'{scale}x',font=small,fill='#e4e7d6')
                d.line((x+366,y+207,x+366,y+207-74),fill='#e8dfbb',width=2)
                d.line((x+362,y+133,x+370,y+133),fill='#e8dfbb')
                d.line((x+362,y+207,x+370,y+207),fill='#e8dfbb')
        sheet.save(review/f'{group}-abc-revised.png')
        print(f'wrote {review/group}-abc-revised.png',flush=True)
    raise SystemExit(0)
if any(arg in sys.argv for arg in ['--deciduous','--shrubs','--small-plants','--rocks-crates','--rock-sizes','--containers','--historical-wells','--historical-containers']):
    import json
    from tempfile import TemporaryDirectory
    from art.voxel_trees import deciduous_tree
    out=root/'public/nature'

    def unpack(name,folder=out):
        sheet=Image.open(folder/f'{name}.png').convert('RGBA')
        frames=json.loads((folder/f'{name}.json').read_text())['frames']
        result={}
        for key,frame in frames.items():
            r=frame['frame']
            im=sheet.crop((r['x'],r['y'],r['x']+r['w'],r['y']+r['h']))
            if 'pivot' in frame:
                im.info['anchor']=[frame['pivot']['x']*im.width,frame['pivot']['y']*im.height]
            result[key]=im
        return result

    sprites,shadows=unpack('atlas'),unpack('shadows')
    changed={}
    if '--historical-containers' in sys.argv:
        changed.update(historical_containers())
        for name,im in changed.items():im.save(out/f'{name}.png')
    if '--historical-wells' in sys.argv:
        changed.update(historical_wells())
        for name,im in changed.items():
            assert set(im.getchannel('A').getdata()) <= {0,255}
            assert len(im.getcolors(im.width*im.height)) <= 24
            im.save(out/f'{name}.png')
    if '--containers' in sys.argv:
        from art.worked_ground import reviewed_containers
        changed.update(reviewed_containers())
        for name,im in changed.items():im.save(out/f'{name}.png')
    if '--rock-sizes' in sys.argv:
        from art.boulders import sized_rocks
        changed.update(sized_rocks())
        for name,im in changed.items():
            assert set(im.getchannel('A').getdata()) <= {0,255}
            assert len(im.getcolors(im.width*im.height)) <= 24
            im.save(out/f'{name}.png')
    for species in (['oak','maple'] if '--deciduous' in sys.argv else []):
        for variant in range(1,4):
            name=f'nature-{species}'+(f'-{variant}' if variant>1 else '')
            for suffix in ['', '-autumn', '-bare']:
                im=deciduous_tree(species,variant,
                    autumn=(True if species=='oak' else variant-1) if suffix=='-autumn' else None,
                    bare=suffix=='-bare')
                assert im.size==sprites[name+suffix].size
                assert set(im.getchannel('A').getdata()) <= {0,255}
                assert len(im.getcolors(im.width*im.height)) <= 24
                changed[name+suffix]=im
                im.save(out/f'{name+suffix}.png')
    if '--shrubs' in sys.argv:
        from art.shrubs import shrub_candidate, shrub
        changed.update({k:im for k,im in small_shrubs().items() if k.endswith('-b') or k=='nature-understory-low-leafy-shrub'})
        changed['nature-dry-thorn-scrub-b']=shrub_candidate('scrub',(56,40))
        changed['nature-understory-dry-bunchgrass']=shrub_candidate('bunchgrass',(28,24),True)
        changed['nature-understory-sagebrush']=shrub_candidate('sagebrush',(48,40))
        changed.update({f'nature-shrub-{species}':shrub(species) for species in ['tea','hazel','sagebrush','creosote']})
        for name,im in changed.items():
            if name in sprites:assert im.size==sprites[name].size
            assert set(im.getchannel('A').getdata()) <= {0,255}
            assert len(im.getcolors(im.width*im.height)) <= 24
            im.save(out/f'{name}.png')
    if '--small-plants' in sys.argv:
        from art.habitat_plants import plant_candidate
        changed.update({'nature-understory-sedge':plant_candidate('sedge',(28,24)),
                        'nature-shrub-broom':plant_candidate('broom',(36,30)),
                        'nature-shrub-broom-2':plant_candidate('broom',(36,30),True)})
        for name,im in changed.items():im.save(out/f'{name}.png')
        legacy=root/'public/packs'
        sheet=Image.open(legacy/'atlas.png').convert('RGBA')
        frames=json.loads((legacy/'atlas.json').read_text())['frames']
        plants={'flowers':plant_candidate('flowers',(24,26),True),'reeds':plant_candidate('reeds',(24,36))}
        for name,im in plants.items():
            r=frames[name]['frame'];assert im.size==(r['w'],r['h'])
            sheet.paste(im,(r['x'],r['y']))
        sheet.save(legacy/'atlas.png')
        masks=unpack('lighting-shadows',legacy)
        with TemporaryDirectory() as temp:masks.update(build_shadows(root,plants,{},Path(temp)))
        pack_atlas(masks,legacy,'lighting-shadows',2048,module=True)
        ecology=root/'public/ecology'
        resources=unpack('atlas',ecology)
        resources['ecology-berry-bush']=plant_candidate('berry',(24,26),True)
        resources['ecology-berry-bush-picked']=plant_candidate('berry',(24,26),True,picked=True)
        pack_atlas(resources,ecology,'atlas',module=True)
    if '--rocks-crates' in sys.argv:
        from art.rocks import rock_additions,rock_candidate
        from art.worked_ground import scenery_candidate
        changed.update(rock_additions())
        changed.update({f'nature-boulder-{kind}-b':rock_candidate(f'boulder-{kind}',(36,29)) for kind in ['basalt','slab']})
        changed.update({'nature-crate-b':scenery_candidate('crate',(32,36)),
                        'nature-crate-c':scenery_candidate('crate',(32,36),True)})
        for name,im in changed.items():
            assert set(im.getchannel('A').getdata()) <= {0,255}
            assert len(im.getcolors(im.width*im.height)) <= 24
            im.save(out/f'{name}.png')
    sprites.update(changed)
    pack_atlas(sprites,out,'atlas',512,module=True)
    with TemporaryDirectory() as temp:
        shadows.update(build_shadows(root,changed,{},Path(temp)))
    pack_atlas(shadows,out,'shadows',2048)
    print(f'Updated {len(changed)} nature frames. Art stamp {write_stamp(root)}')
    raise SystemExit(0)
if '--tree-abc' in sys.argv:
    from PIL import ImageFont
    from art.canopy import pixel_candidate
    from art.voxel_trees import bake, oak_model, maple_model
    review = root/'artifacts/tree-review'
    review.mkdir(exist_ok=True, parents=True)
    font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
    title_font = ImageFont.truetype(font_path, 27)
    label_font = ImageFont.truetype(font_path, 20)
    small_font = ImageFont.truetype(font_path, 16)
    for species, grow in [('oak',oak_model), ('maple',maple_model)]:
        a = Image.open(root/f'public/nature/nature-{species}.png').convert('RGBA')
        b = pixel_candidate(species)
        c = bake(grow, 31, (a.width,a.height-(16 if species == 'maple' else 0)))
        if c.size != a.size:
            padded = Image.new('RGBA', a.size)
            padded.paste(c, (0,a.height-c.height), c)
            c = padded
        variants = [('A', 'Current', a), ('B', 'Native pixel art', b), ('C', 'Voxel geometry', c)]
        sheet = Image.new('RGB', (1200,810), '#202839')
        d = ImageDraw.Draw(sheet)
        d.text((24,18), f'{species.title()} / A-B-C', font=title_font, fill='#f4e8ca')
        d.text((24,56), 'Same source canvas, palette and scale. Proposals only; live assets unchanged.', font=small_font, fill='#bdc6c3')
        for col, (letter,label,im) in enumerate(variants):
            assert im.size == a.size
            assert set(im.getchannel('A').getdata()) <= {0,255}
            assert len(im.getcolors(im.width*im.height)) <= 24
            bb = im.getbbox()
            assert bb and bb[0]>0 and bb[1]>0 and bb[2]<im.width and bb[3]<im.height
            im.save(review/f'{species}-{letter.lower()}.png')
            x=col*400
            d.rounded_rectangle((x+12,94,x+388,792),radius=8,fill='#71805e')
            d.text((x+28,110),f'{letter}  {label}',font=label_font,fill='#f9f1dc')
            large=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
            sheet.paste(large,(x+200-large.width//2,465-large.height),large)
            d.text((x+28,482),'3x native pixels',font=small_font,fill='#e4e7d6')
            d.line((x+28,522,x+372,522),fill='#9da888')
            small=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
            sheet.paste(small,(x+200-small.width//2,766-small.height),small)
            d.line((x+40,766,x+40,766-37*2),fill='#e8dfbb',width=2)
            d.line((x+35,766,x+45,766),fill='#e8dfbb',width=2)
            d.line((x+35,766-74,x+45,766-74),fill='#e8dfbb',width=2)
            d.text((x+28,535),'2x / 37px adult-height marker',font=small_font,fill='#e4e7d6')
        sheet.save(review/f'{species}-abc.png')
        print(f'wrote {review/species}-abc.png', flush=True)
    raise SystemExit(0)
out=root/'public/nature';out.mkdir(exist_ok=True)
sprites={**trees(), **understory(), **voxel_trees(), **small_shrubs(), **shrubs(), **habitat_plants(), **regional_trees(), **succulent_trees(), **succulent_shrubs(), **fungi(), **dung(), **remains(), **worked_ground(), **rocks(), **boulders(), **historical_wells(), **historical_containers()}
for name,im in sprites.items():
    assert set(im.getchannel('A').getdata()) <= {0,255},name
    assert len(im.getcolors(im.width*im.height)) <= 24,name
    bbox=im.getbbox()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<im.width and bbox[3]<im.height,name
    im.save(out/f'{name}.png')
pack_atlas(sprites,out,'atlas',512, module=True)
build_shadows(root,sprites,{},out,'shadows')
review_sprites={**trees(), **understory(), **regional_trees(), **succulent_trees(), **rocks(), **boulders()}
review=Image.new('RGB',(4*320,((len(review_sprites)+3)//4)*400),'#829456')
for i,(name,im) in enumerate(review_sprites.items()):
    enlarged=im.resize((im.width*3,im.height*3),Image.Resampling.NEAREST)
    review.paste(enlarged,((i%4)*320+(320-enlarged.width)//2,(i//4)*400+300-enlarged.height),enlarged)
    ImageDraw.Draw(review).text(((i%4)*320+30,(i//4)*400+330),name.removeprefix('nature-'),fill='#172a2e')
(root/'artifacts/nature-lab').mkdir(exist_ok=True,parents=True)
review.save(root/'artifacts/nature-lab/new-trees.png')

review.crop((0,400,1280,800)).save(root/'artifacts/nature-lab/second-plants.png')

understory_review=Image.new('RGB',(800,280),'#829456')
for i,(name,im) in enumerate(understory().items()):
    enlarged=im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST)
    understory_review.paste(enlarged,(i*200+(200-enlarged.width)//2,230-enlarged.height),enlarged)
    ImageDraw.Draw(understory_review).text((i*200+25,250),name.removeprefix('nature-understory-'),fill='#172a2e')
understory_review.save(root/'artifacts/nature-lab/understory.png')

ages=Image.new('RGB',(1280,900),'#5f9e3e')
ages_sprites={n:im for n,im in sprites.items() if n.startswith('nature-broadleaf-') and not re.search(r'-[23](-|$)',n)}
for i,(name,im) in enumerate(ages_sprites.items()):
    scaled=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
    col,row=i%4,i//4
    ages.paste(scaled,(col*320+(320-scaled.width)//2,row*450+400-scaled.height),scaled)
    ImageDraw.Draw(ages).text((col*320+90,row*450+422),name.removeprefix('nature-broadleaf-'),fill='#172a2e')
ages.save(root/'artifacts/nature-lab/broadleaf-ages.png')

small=Image.new('RGB',(640,180),'#829456')
for i,(name,im) in enumerate(small_shrubs().items()):
    preview=im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST)
    small.paste(preview,(i*160+(160-preview.width)//2,135-preview.height),preview)
    ImageDraw.Draw(small).text((i*160+8,155),name.replace('nature-understory-','').replace('nature-',''),fill='#172a2e')
small.save(root/'artifacts/nature-lab/small-shrubs.png')

named=shrubs()
sheet=Image.new('RGB',(10*184,((len(named)+9)//10)*200),'#5f9e3e')
for i,(name,im) in enumerate(named.items()):
    preview=im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST)
    sheet.paste(preview,((i%10)*184+(184-preview.width)//2,(i//10)*200+170-preview.height),preview)
    ImageDraw.Draw(sheet).text(((i%10)*184+6,(i//10)*200+180),name.removeprefix('nature-shrub-'),fill='#10240f')
sheet.save(root/'artifacts/nature-lab/named-shrubs.png')

habitats=Image.new('RGB',(960,430),'#829456')
for i,(name,im) in enumerate(habitat_plants().items()):
    preview=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
    habitats.paste(preview,(i*240+(240-preview.width)//2,350-preview.height),preview)
    ImageDraw.Draw(habitats).text((i*240+15,380),name.replace('nature-understory-','').replace('nature-',''),fill='#172a2e')
habitats.save(root/'artifacts/nature-lab/habitat-plants.png')
print(f'Art stamp {write_stamp(root)}')
