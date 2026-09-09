"""Build the reviewed nature additions separately from legacy world assets."""
from pathlib import Path
from PIL import Image, ImageDraw
from art.nature_trees import trees
from art.nature_understory import understory
from art.broadleaf_ages import broadleaf_ages
from art.small_shrubs import small_shrubs
from art.habitat_plants import habitat_plants
from art.atlas import pack_atlas
from art.shadows import build_shadows
root=Path(__file__).resolve().parent.parent
out=root/'public/nature';out.mkdir(exist_ok=True)
sprites={**trees(), **understory(), **broadleaf_ages(), **small_shrubs(), **habitat_plants()}
for name,im in sprites.items():
    assert set(im.getchannel('A').getdata()) <= {0,255},name
    assert len(im.getcolors(im.width*im.height)) <= 24,name
    bbox=im.getbbox()
    assert bbox and bbox[0]>0 and bbox[1]>0 and bbox[2]<im.width and bbox[3]<im.height,name
    im.save(out/f'{name}.png')
pack_atlas(sprites,out,'atlas',512)
build_shadows(root,sprites,{},out,'shadows')
review_sprites={**trees(), **understory()}
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

ages=Image.new('RGB',(1280,450),'#829456')
for i,(name,im) in enumerate(broadleaf_ages().items()):
    scaled=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
    ages.paste(scaled,(i*320+(320-scaled.width)//2,400-scaled.height),scaled)
    ImageDraw.Draw(ages).text((i*320+90,422),name.removeprefix('nature-broadleaf-'),fill='#172a2e')
ages.save(root/'artifacts/nature-lab/broadleaf-ages.png')

small=Image.new('RGB',(640,180),'#829456')
for i,(name,im) in enumerate(small_shrubs().items()):
    preview=im.resize((im.width*4,im.height*4),Image.Resampling.NEAREST)
    small.paste(preview,(i*160+(160-preview.width)//2,135-preview.height),preview)
    ImageDraw.Draw(small).text((i*160+8,155),name.replace('nature-understory-','').replace('nature-',''),fill='#172a2e')
small.save(root/'artifacts/nature-lab/small-shrubs.png')

habitats=Image.new('RGB',(960,430),'#829456')
for i,(name,im) in enumerate(habitat_plants().items()):
    preview=im.resize((im.width*2,im.height*2),Image.Resampling.NEAREST)
    habitats.paste(preview,(i*240+(240-preview.width)//2,350-preview.height),preview)
    ImageDraw.Draw(habitats).text((i*240+15,380),name.replace('nature-understory-','').replace('nature-',''),fill='#172a2e')
habitats.save(root/'artifacts/nature-lab/habitat-plants.png')
