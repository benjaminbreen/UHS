"""One projection policy with explicit building heights and separate contact shadows."""
import math
from PIL import Image, ImageDraw

def build_shadows(sprites, buildings):
    names=[n for n in sprites if n.startswith(('human-','house-','study-')) or n in ['oak','olive','hackberry','acacia','cypress','bush','flowers','flax','rock','rock-1','rock-2','reeds','wheat','basket','amphora','jug','well','fire','hall','sheep0','sheep1','goat0','goat1','chicken0','chicken1','lizard0','lizard1','bed','oven','crate','fence','gate','gate-open','crop-leafy']]
    for name in names:
        source=sprites[name];w,h=source.size
        opaque=[(x,y) for y in range(h) for x in range(w) if source.getpixel((x,y))[3]>200]
        if not opaque:continue
        bottom=max(y for x,y in opaque);gap=h-bottom
        model=buildings.get(name)
        height=model['shadow']['height'] if model else bottom-min(y for x,y in opaque)
        ratio=height/max(1,bottom-min(y for x,y in opaque))
        im=Image.new('RGBA',(w+math.ceil(height*.32)+4,math.ceil(height*.19)+8+gap));d=ImageDraw.Draw(im)
        for x,y in opaque:
            yy=(bottom-y)*ratio
            xx=x+math.floor(yy*.32);sy=2+math.floor(yy*.19)
            d.rectangle((xx,sy,xx+1,sy+1),fill=(31,40,32,65))
        # Contact remains compact and darker than the projected silhouette.
        if model:
            contact=model['shadow']['contactWidth']
            d.rectangle(((w-contact)//2,1,(w+contact)//2,4),fill=(37,31,24,105))
        else:
            foot=[x for x,y in opaque if y>=bottom-2]
            d.ellipse((min(foot)-1,1,max(foot)+2,5),fill=(29,35,28,95))
        im.info['anchor']=[w/2,2+gap]
        sprites[f'shadow-{name}']=im
