"""Shared shelf packer for source art and lighting masks. Native Phaser pivots."""
from PIL import Image
import json

def pack_atlas(sprites, output, name, width=1024):
    frames={};placements=[];x=y=rowh=0
    for key,im in sprites.items():
        w,h=im.size
        if w+2>width:raise ValueError(f'{key} exceeds atlas width')
        if x+w+2>width:x=0;y+=rowh+2;rowh=0
        frame={'frame':{'x':x,'y':y,'w':w,'h':h},'sourceSize':{'w':w,'h':h},'spriteSourceSize':{'x':0,'y':0,'w':w,'h':h},'rotated':False,'trimmed':False}
        if 'anchor' in im.info:
            ax,ay=im.info['anchor'];frame['pivot']={'x':ax/w,'y':ay/h}
        frames[key]=frame;placements.append((im,x,y));x+=w+2;rowh=max(rowh,h)
    # Keep each texture within a conservative GPU limit as modular kits grow.
    # Repack wider before allocating; never silently emit an unusable tall atlas.
    if y+rowh+2>4096:
        if width<4096:return pack_atlas(sprites,output,name,width*2)
        raise ValueError(f'{name} needs multiple pages: exceeds 4096 pixels')
    atlas=Image.new('RGBA',(width,y+rowh+2))
    for im,x,y in placements:atlas.paste(im,(x,y))
    atlas.save(output/f'{name}.png')
    (output/f'{name}.json').write_text(json.dumps({'frames':frames,'meta':{'image':f'{name}.png','scale':'1','size':{'w':atlas.width,'h':atlas.height}}}))
    return atlas
