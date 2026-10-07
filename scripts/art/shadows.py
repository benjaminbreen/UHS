"""Six prebuilt projections, stable foot contacts, no runtime pixel processing.
This is a 2.5D silhouette approximation: source height maps to authored world height.
Building ground depth keeps a projected house from collapsing to a narrow stripe.
"""
import json, math
from PIL import Image, ImageDraw, ImageFilter
from art.atlas import pack_atlas

BUILDING_CAST_CAP=0.55
# Shadow leans cool, as palette.json's shadow hue does; flat grey reads as a hole.
SHADE=(32,34,84)
CONTACT=(30,28,62)


def base_profile(opaque, bottom, reach):
    """Each column's lowest solid pixel, where it stands within `reach` of the
    ground line: the curve a footing actually meets the ground along."""
    low={}
    for x,y in opaque:
        if y>low.get(x,-1):low[x]=y
    return [(x,y) for x,y in sorted(low.items()) if y>=bottom-reach]


def soften(mask, radius):
    """Round a projected silhouette's corners and give it one dithered rim:
    blurred and cut twice, solid inside the higher cut, checkered between."""
    soft=mask.filter(ImageFilter.GaussianBlur(radius))
    out=Image.new('L',mask.size)
    sp,op=soft.load(),out.load()
    for y in range(mask.size[1]):
        for x in range(mask.size[0]):
            v=sp[x,y]
            if v>=118 or (v>=52 and (x+y)%2==0):op[x,y]=255
    return out

def build_shadows(root, sprites, buildings, output=None, atlas_name='lighting-shadows'):
    phases=json.loads((root/'src/content/graphics/lighting.json').read_text())
    props=['oak','olive','hackberry','acacia','cypress','bush','flowers','flax','rock','rock-1','rock-2','reeds','wheat','basket','amphora','jug','well','fire','hall','sheep0','sheep1','goat0','goat1','chicken0','chicken1','lizard0','lizard1','bed','oven','crate','fence','gate','gate-open','crop-leafy','fountain','statue','stele','market-cross','kiosk','altar-platform','monument-cross','monument-statue','monument-obelisk','monument-fountain','planter','post','lamp-post','lamp-post-lit']
    result={}
    for name,source in sprites.items():
        if not (name.startswith(('human-','house-','study-','prop-broken-','urban-stall-','nature-')) or name in props or (buildings.get(name) or {}).get('frontClassical')):continue
        w,h=source.size
        opaque=[(x,y) for y in range(h) for x in range(w) if source.getpixel((x,y))[3]>200]
        if not opaque:continue
        bottom=max(y for x,y in opaque)
        # The hearth stones cast a shadow; the flame itself is emissive.
        if name=='fire':opaque=[(x,y) for x,y in opaque if y>=bottom-7]
        if 'shadowMinY' in source.info:opaque=[(x,y) for x,y in opaque if y>=source.info['shadowMinY']]
        if not opaque:continue
        top=min(y for x,y in opaque)
        model=buildings.get(name)
        if model and model.get('shadowFrame'):continue
        height=model['shadow']['height'] if model else bottom-top
        ground_depth=min(12,model['footprint'][1]*3) if model else 0
        feet=[x for x,y in opaque if y>=bottom-2]
        left,right=(6,w-8) if model else (min(feet)-1,max(feet)+1)
        for phase in phases:
            vx,vy=phase['cast'];alpha=round(255*phase['opacity'])
            # Low sun is for trees, people and vessels. A house is tall enough
            # that the same angle would lay its shadow across the whole
            # village, and the atlas would carry the cost of every pixel of it.
            if model:
                reach=math.hypot(vx,vy)
                if reach>BUILDING_CAST_CAP:
                    vx,vy=vx/reach*BUILDING_CAST_CAP,vy/reach*BUILDING_CAST_CAP
            points=[]
            # An upright silhouette's width must lie across the cast direction.
            # Keeping it screen-horizontal makes low-angle shadows nearly singular:
            # the canopy collapses onto the trunk and narrow-neck vessels become blobs.
            length=math.hypot(vx,vy)
            # Only upright silhouettes lay their width across the cast. A low,
            # wide object (rock, shrub, log) rotated that way reads as a shadow
            # thrown the other way from every tree beside it.
            upright=(bottom-top)>1.15*max(1,max(feet)-min(feet))
            ux,uy=(1,0) if model or not length or not upright else (vy/length*.75,-vx/length*.75)
            center=(min(feet)+max(feet))/2
            # A building stands on its wall foot, which curves round a drum and
            # runs back along a side wall: height is measured from that, column
            # by column, or a round house casts from a ruled line.
            ground=dict(base_profile(opaque,bottom,14)) if model else {}
            if alpha:
                for x,y in opaque:
                    g=max(y,ground.get(x,bottom))
                    elevation=(g-y)*height/max(1,bottom-top)
                    points.append((round(center+(x-center)*ux+elevation*vx),round(g+(x-center)*uy+elevation*vy)))
            # Include a source-space ground pivot even for empty night projections.
            minx=min([0,left]+[x for x,y in points])-2
            maxx=max([w,right]+[x for x,y in points])+2
            miny=min([bottom-2-ground_depth]+[y-ground_depth for x,y in points])-1
            maxy=max([h,bottom+3]+[y+1 for x,y in points])+1
            size=(maxx-minx+1,maxy-miny+1)
            im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
            if model:
                cast=Image.new('L',size);cd=ImageDraw.Draw(cast)
                for x,y in points:
                    cd.rectangle((x-minx,y-miny-ground_depth,x-minx+1,y-miny+1),fill=255)
                im.paste(SHADE+(alpha,),mask=soften(cast,2.2))
                # The contact follows the wall foot, column by column, so a
                # round house sits in a curve, not on a ruled bar. Never swung
                # with the sun vector.
                foot=Image.new('L',size);fd=ImageDraw.Draw(foot)
                for x,y in base_profile(opaque,bottom,14):
                    fd.line((x-minx,y-miny-1,x-minx,y-miny+1),fill=255)
                contact=Image.new('RGBA',size,CONTACT+(91,))
                im.alpha_composite(Image.composite(contact,Image.new('RGBA',size),soften(foot,1)))
            else:
                for x,y in points:
                    d.rectangle((x-minx,y-miny-ground_depth,x-minx+1,y-miny+1),fill=SHADE+(alpha,))
                # Follow actual root, foot, or vessel-base pixels, not a generic oval.
                for x,y in base_profile(opaque,bottom,3):
                    d.line((x-minx,y-miny,x-minx,y-miny+1),fill=CONTACT+(83,))
            im.info['anchor']=[(model['anchor'][0] if model else w/2)-minx,h-miny]
            result[f"{phase['id']}:{name}"]=im
    atlas=pack_atlas(result,output or root/'public/packs',atlas_name,2048)
    print(f'Built {len(result)} lighting masks; shadow atlas {atlas.size}.')
    return result
