"""Six prebuilt projections, stable foot contacts, no runtime pixel processing.
This is a 2.5D silhouette approximation: source height maps to authored world height.
Building ground depth keeps a projected house from collapsing to a narrow stripe.
"""
import json, math
from PIL import Image, ImageDraw
from art.atlas import pack_atlas

def build_shadows(root, sprites, buildings, output=None, atlas_name='lighting-shadows'):
    phases=json.loads((root/'src/content/graphics/lighting.json').read_text())
    props=['oak','olive','hackberry','acacia','cypress','bush','flowers','flax','rock','rock-1','rock-2','reeds','wheat','basket','amphora','jug','well','fire','hall','sheep0','sheep1','goat0','goat1','chicken0','chicken1','lizard0','lizard1','bed','oven','crate','fence','gate','gate-open','crop-leafy','fountain','statue','stele','market-cross','kiosk','altar-platform','monument-cross','monument-statue','monument-obelisk','monument-fountain','planter']
    result={}
    for name,source in sprites.items():
        if not (name.startswith(('human-','house-','study-','prop-broken-','urban-stall-','nature-')) or name in props):continue
        w,h=source.size
        opaque=[(x,y) for y in range(h) for x in range(w) if source.getpixel((x,y))[3]>200]
        if not opaque:continue
        bottom=max(y for x,y in opaque)
        # The hearth stones cast a shadow; the flame itself is emissive.
        if name=='fire':opaque=[(x,y) for x,y in opaque if y>=bottom-7]
        if 'shadowMinY' in source.info:opaque=[(x,y) for x,y in opaque if y>=source.info['shadowMinY']]
        top=min(y for x,y in opaque)
        model=buildings.get(name)
        height=model['shadow']['height'] if model else bottom-top
        ground_depth=min(12,model['footprint'][1]*3) if model else 0
        feet=[x for x,y in opaque if y>=bottom-2]
        left,right=(6,w-8) if model else (min(feet)-1,max(feet)+1)
        for phase in phases:
            vx,vy=phase['cast'];alpha=round(255*phase['opacity'])
            points=[]
            # An upright silhouette's width must lie across the cast direction.
            # Keeping it screen-horizontal makes low-angle shadows nearly singular:
            # the canopy collapses onto the trunk and narrow-neck vessels become blobs.
            length=math.hypot(vx,vy)
            ux,uy=(1,0) if model or not length else (vy/length*.75,-vx/length*.75)
            center=(min(feet)+max(feet))/2
            if alpha:
                for x,y in opaque:
                    elevation=(bottom-y)*height/max(1,bottom-top)
                    points.append((round(center+(x-center)*ux+elevation*vx),round(bottom+(x-center)*uy+elevation*vy)))
            # Include a source-space ground pivot even for empty night projections.
            minx=min([0,left]+[x for x,y in points])-2
            maxx=max([w,right]+[x for x,y in points])+2
            miny=min([bottom-2-ground_depth]+[y-ground_depth for x,y in points])-1
            maxy=max([h,bottom+3]+[y+1 for x,y in points])+1
            im=Image.new('RGBA',(maxx-minx+1,maxy-miny+1));d=ImageDraw.Draw(im)
            for x,y in points:
                d.rectangle((x-minx,y-miny-ground_depth,x-minx+1,y-miny+1),fill=(28,35,42,alpha))
            # Never stretch or swing the contact area with the sun vector.
            if model:
                d.rectangle((left-minx,bottom-miny-2,right-minx,bottom-miny+1),fill=(31,30,26,91))
            else:
                # Follow actual root, foot, or vessel-base pixels, not a generic oval.
                for x,y in opaque:
                    if y>=bottom-1:
                        d.line((x-minx,bottom-miny,x-minx,bottom-miny+1),fill=(29,33,31,83))
            im.info['anchor']=[w/2-minx,h-miny]
            result[f"{phase['id']}:{name}"]=im
    atlas=pack_atlas(result,output or root/'public/packs',atlas_name,2048)
    print(f'Built {len(result)} lighting masks; shadow atlas {atlas.size}.')
    return result
