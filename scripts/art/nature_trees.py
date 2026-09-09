"""Original native-resolution tree and shrub drawings. Integer pixels, opaque palette,
no resampling, no imported image pixels. Sunlight comes from the upper left.
Contours/branch placement are authored; seeded leaf plates only vary interiors.
"""
from PIL import Image, ImageDraw
import math
import random

BARK = ['#302d2a', '#574033', '#805339', '#a67343', '#c79a59', '#e3be77']
PINE = ['#182f30', '#254439', '#356045', '#4e7b47', '#76974e', '#a5b862']
THORN = ['#293c30', '#3a5134', '#566b37', '#7c8940', '#a4a04f', '#cdc175']
SPRUCE = ['#172e32', '#24453f', '#31604e', '#487d60', '#6c9a70', '#a5be89']
PALM = ['#19342d', '#29513a', '#3d7541', '#609846', '#94b64e', '#c4cf70']


def canvas(size):
    im = Image.new('RGBA', size)
    return im, ImageDraw.Draw(im)


def branch(d, pts, width=5):
    d.line(pts, fill=BARK[0], width=width+2, joint='curve')
    d.line(pts, fill=BARK[2], width=width, joint='curve')
    d.line([(x-1,y-1) for x,y in pts], fill=BARK[4], width=max(1,width//3), joint='curve')


def crown(im, cx, cy, rx, ry, pal, seed):
    """An individually placed ragged bough, with leaf plates following its volume."""
    rng=random.Random(seed)
    mask=Image.new('1', im.size); md=ImageDraw.Draw(mask)
    pts=[(-rx,0),(-rx+2,-2),(-rx+2,-ry+3),(-rx+5,-ry+3),(-rx+6,-ry+1),(-3,-ry+1),(-2,-ry),(2,-ry),(4,-ry+2),(rx-4,-ry+2),(rx-3,-ry+4),(rx-1,-ry+4),(rx,-1),(rx-2,1),(rx-2,ry-1),(rx-6,ry-1),(rx-7,ry+1),(2,ry),(0,ry+2),(-4,ry+1),(-5,ry-1),(-rx+3,ry-1),(-rx+3,2),(-rx,2)]
    md.polygon([(cx+x,cy+y) for x,y in pts],fill=1)
    layer=Image.new('RGBA',im.size); ld=ImageDraw.Draw(layer)
    for y in range(max(0,cy-ry),min(im.height,cy+ry+3)):
        for x in range(max(0,cx-rx),min(im.width,cx+rx+1)):
            if not mask.getpixel((x,y)):continue
            edge=any(not (0<=x+dx<im.width and 0<=y+dy<im.height) or not mask.getpixel((x+dx,y+dy)) for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])
            level=0 if edge else 1 if y>cy+ry*.45 else 2 if x>cx+rx*.4 or y>cy else 3
            ld.point((x,y),fill=pal[level])
    # Broad interlocking plates; each has a short lit rim and an underside.
    for y in range(cy-ry+2,cy+ry,3):
        for x in range(cx-rx+2,cx+rx-1,4):
            x+=rng.randrange(-1,2); yy=y+rng.randrange(-1,2)
            bright=4 if yy<cy-1 and x<cx+rx*.4 else 3 if yy<cy+ry*.65 and x<cx+rx*.7 else 2
            if rng.random()<.18:bright=max(1,bright-1)
            for dx,dy in [(0,0),(1,0),(2,0),(-1,1),(0,1),(1,1),(2,1),(0,2)]:
                px,py=x+dx,yy+dy
                if 1<=px<im.width-1 and 1<=py<im.height-1 and all(mask.getpixel((px+a,py+b)) for a,b in [(0,0),(1,0),(-1,0),(0,1),(0,-1)]):
                    ld.point((px,py),fill=pal[bright if dy<2 else max(1,bright-1)])
            if bright==4 and rng.random()<.55:
                for dx in [0,1]:
                    if 0<=x+dx<im.width and 0<=yy<im.height and mask.getpixel((x+dx,yy)):ld.point((x+dx,yy),fill=pal[5])
    im.alpha_composite(layer)


def spreading_pine():
    im,d=canvas((80,88))
    # The asymmetric crown is carried by bent, visible red-barked limbs.
    branch(d,[(39,82),(42,70),(39,59),(42,47),(37,34),(41,22)],7)
    branch(d,[(41,64),(28,53),(17,45)],4)
    branch(d,[(42,54),(54,46),(65,38)],4)
    branch(d,[(39,44),(27,34),(19,29)],3)
    branch(d,[(39,36),(52,29),(56,21)],3)
    d.polygon([(35,77),(44,76),(48,84),(42,82),(39,85),(36,82),(30,84)],fill=BARK[0])
    d.line([(39,76),(37,81),(34,82)],fill=BARK[4],width=2)
    d.line([(43,76),(44,81),(46,82)],fill=BARK[2],width=2)
    for x,y in [(40,70),(39,64),(41,55),(40,45),(38,37)]:
        d.line((x-2,y,x+2,y-1),fill=BARK[1]);d.point((x-2,y-2),fill=BARK[5])
    # Rear, low boughs, then the sunlit high crown. Unequal widths avoid symmetry.
    for args in [(62,41,13,6,12),(18,46,14,7,24),(29,49,12,6,25),(54,35,16,7,35),(20,29,15,7,41),(34,31,13,8,51),(56,22,12,7,61),(41,17,15,9,71)]:
        cx,cy,rx,ry,seed=args;crown(im,cx,cy,rx,ry,PINE,seed)
    # Small solitary needles extend silhouettes without a noisy halo.
    d=ImageDraw.Draw(im)
    for x,y in [(7,43),(65,32),(13,24),(42,7),(53,15)]:
        d.line((x,y+2,x-1,y),fill=PINE[3]);d.point((x+1,y+1),fill=PINE[4])
    return im


def sahel_thorn():
    im,d=canvas((88,80))
    branch(d,[(46,73),(44,61),(44,52),(37,44),(29,37),(19,32)],6)
    branch(d,[(44,56),(53,45),(65,38),(72,30)],4)
    branch(d,[(39,48),(38,35),(43,25)],4)
    branch(d,[(52,45),(52,33),(59,24)],3)
    branch(d,[(30,39),(23,39),(13,34)],2)
    branch(d,[(63,39),(77,38),(79,33)],2)
    d.polygon([(41,66),(48,66),(49,72),(54,76),(47,74),(44,76),(40,74),(36,75),(41,71)],fill=BARK[0])
    d.line([(43,65),(44,71),(41,74)],fill=BARK[4],width=2)
    d.line([(46,64),(46,71),(49,73)],fill=BARK[2],width=2)
    for args in [(12,29,9,5,3),(26,25,15,7,6),(72,28,11,6,9),(58,24,13,6,12),(43,19,15,7,15),(35,30,9,5,18),(63,33,11,5,21)]:
        cx,cy,rx,ry,seed=args;crown(im,cx,cy,rx,ry,THORN,seed)
    d=ImageDraw.Draw(im)
    # A few hanging pods and leaf twigs, kept separate from the foliage silhouette.
    for x,y in [(17,35),(29,34),(58,38),(74,35)]:
        d.line([(x,y),(x,y+3),(x+1,y+4)],fill=BARK[1]);d.point((x,y+1),fill=BARK[3])
    return im


def boreal_spruce():
    im,d=canvas((64,96))
    branch(d,[(32,88),(31,68),(32,43),(31,12)],5)
    d.polygon([(28,84),(35,84),(37,91),(32,89),(27,91),(29,87)],fill=BARK[0])
    d.line((30,82,30,88),fill=BARK[4],width=2)
    # Authored irregular tiers, narrowing upward. Each bough has pointed fingers.
    for cx,cy,rx,ry,seed in [(31,75,25,8,11),(33,66,22,9,21),(29,56,20,10,31),(32,46,17,10,41),(30,36,13,10,51),(31,26,10,10,61),(31,16,6,9,71)]:
        crown(im,cx,cy,rx,ry,SPRUCE,seed)
        d=ImageDraw.Draw(im)
        for j in range(-2,3):
            x=cx+j*max(2,rx//3);y=cy+ry-1-abs(j)
            d.line([(x-2,y-3),(x,y+2),(x+2,y)],fill=SPRUCE[0],width=2)
            d.line([(x-2,y-4),(x,y),(x+1,y-1)],fill=SPRUCE[2],width=1)
        # One continuous sloped light band on a few upper branch faces.
        d.line([(cx-rx+4,cy-1),(cx-rx+8,cy-4),(cx-4,cy-5)],fill=SPRUCE[4])
    d=ImageDraw.Draw(im)
    d.line([(31,13),(31,4)],fill=SPRUCE[0],width=2)
    d.line([(30,10),(31,6)],fill=SPRUCE[4])
    d.line([(28,13),(31,9),(34,15)],fill=SPRUCE[2])
    return im


def feather_palm():
    im,d=canvas((80,96))
    # Trunk rings follow an S bend instead of a straight uniform column.
    for y in range(35,90):
        t=(y-35)/55;cx=round(39+5*math.sin(t*2.9));w=3 if y<65 else 4
        d.line((cx-w,y,cx+w,y),fill=BARK[0])
        d.line((cx-w+1,y,cx+w-1,y),fill=BARK[2])
        d.line((cx-w+1,y,cx-1,y),fill=BARK[3])
        if y%5 in [1,2]:d.line((cx-w+1,y,cx,y),fill=BARK[4])
        if y%5==4:d.line((cx-w+1,y,cx+w-1,y-1),fill=BARK[1])
        if y%5==0:d.point((cx-w+1,y),fill=BARK[5])
    d.polygon([(38,86),(46,86),(49,92),(44,90),(41,92),(38,90),(35,92)],fill=BARK[1])
    d.line((40,87,39,90),fill=BARK[4],width=2)
    def frond(control,tip,tone):
        pts=[]
        for step in range(21):
            t=step/20;u=1-t
            pts.append((round(u*u*39+2*u*t*control[0]+t*t*tip[0]),round(u*u*29+2*u*t*control[1]+t*t*tip[1])))
        # Solid tapered blades connect the leaflets into substantial fronds.
        left=[];right=[]
        for i,(x,y) in enumerate(pts):
            a=pts[max(0,i-1)];b=pts[min(20,i+1)]
            dx,dy=b[0]-a[0],b[1]-a[1];n=math.hypot(dx,dy) or 1
            w=3.5*math.sin(math.pi*i/20)**.8
            left.append((round(x-dy/n*w),round(y+dx/n*w)))
            right.append((round(x+dy/n*w),round(y-dx/n*w)))
        d.polygon(left+right[::-1],fill=PALM[0])
        d.polygon(pts+right[::-1],fill=PALM[tone])
        d.polygon(pts+left[::-1],fill=PALM[max(1,tone-1)])
        # Tapered leaflets are individually placed polygons around the curved rib.
        for i in range(4,19,3):
            x,y=pts[i];px,py=pts[i-1];dx,dy=x-px,y-py;n=math.hypot(dx,dy) or 1
            tx,ty=dx/n,dy/n;nx,ny=-ty,tx
            length=(5 if i<13 else 3)
            for side in [-1,1]:
                ex,ey=round(x+nx*length*side+tx*3),round(y+ny*length*side+ty*3+2)
                d.polygon([(x-1,y),(x+1,y),(ex,ey),(round((x+ex)/2)-1,round((y+ey)/2)+1)],fill=PALM[0])
                d.line((x,y,ex,ey-1),fill=PALM[max(1,tone-(side==1))],width=2)
                d.line((x,y-1,ex,ey-2),fill=PALM[min(5,tone+1)])
        d.line(pts,fill=PALM[1],width=2)
        d.line([(x,y-1) for x,y in pts],fill=PALM[min(5,tone+1)])
    # Distant fronds, then the crown heart, then the two cascading foreground fans.
    for ctrl,tip,tone in [((16,17),(7,36),2),((65,18),(74,37),2),((20,3),(13,15),4),((61,3),(69,17),3),((30,1),(29,7),4),((47,1),(52,8),4)]:frond(ctrl,tip,tone)
    d.ellipse((33,25,45,37),fill=PALM[0]);d.ellipse((34,24,42,32),fill=PALM[3])
    for x,y in [(35,35),(40,37),(44,34)]:
        d.ellipse((x-3,y-1,x+2,y+5),fill='#573a2b');d.ellipse((x-2,y,x+1,y+3),fill='#99603a');d.point((x-1,y),fill='#d19852')
    for ctrl,tip,tone in [((15,18),(15,49),3),((62,18),(63,50),2),((29,20),(29,48),3),((49,20),(51,46),2)]:frond(ctrl,tip,tone)
    return im


BIRCH = ['#283d36', '#405b39', '#617e40', '#87a34d', '#b3bf67', '#d5d88c']
TROPICAL = ['#163b35', '#245548', '#37754e', '#559550', '#80b45c', '#b4cc77']
WILLOW = ['#253c36', '#3c5a43', '#597e4c', '#7e9c59', '#a4b773', '#cbd391']
SCRUB = ['#3a4235', '#535d3d', '#737d4b', '#96a06a', '#bbc08b', '#dad3a0']


def silver_birch():
    im,d=canvas((64,88))
    # Pale bark, tapering limbs, and broken charcoal scars distinguish the trunk.
    def limb(pts,w):
        d.line(pts,fill='#333d38',width=w+2,joint='curve')
        d.line(pts,fill='#b8b8a0',width=w,joint='curve')
        d.line([(x-1,y) for x,y in pts],fill='#e0dcc0',width=max(1,w//2))
    limb([(31,82),(32,66),(30,49),(33,30),(31,14)],4)
    limb([(31,59),(21,45),(17,29)],2)
    limb([(32,50),(43,38),(47,23)],2)
    limb([(32,37),(24,29),(22,18)],2)
    d.polygon([(28,79),(34,79),(37,84),(32,82),(27,85),(28,82)],fill='#333d38')
    for x,y in [(32,76),(30,68),(32,60),(30,52),(32,44),(33,34)]:
        d.line((x-1,y,x+1,y),fill='#465046');d.point((x+1,y-1),fill='#687364')
    for cx,cy,rx,ry,seed in [(18,39,9,8,111),(43,38,10,8,112),(23,28,10,8,113),(47,23,9,8,114),(31,16,11,9,115),(29,43,8,7,116)]:
        crown(im,cx,cy,rx,ry,BIRCH,seed)
    d=ImageDraw.Draw(im)
    # Detached paired leaves on delicate hanging twigs.
    for x,y in [(12,46),(45,47),(22,50),(51,31)]:
        d.line((x,y-2,x+1,y+4),fill=BIRCH[1]);d.rectangle((x-1,y,x,y+1),fill=BIRCH[3]);d.line((x+1,y+3,x+2,y+2),fill=BIRCH[4])
    return im


def tropical_broadleaf():
    im,d=canvas((96,96))
    # Broad buttress roots and massive exposed limbs support an irregular canopy.
    d.polygon([(42,44),(54,44),(53,69),(58,80),(68,90),(56,87),(50,80),(50,91),(44,86),(34,91),(40,79),(42,65)],fill=BARK[0])
    d.polygon([(44,48),(49,48),(48,72),(44,84),(37,88),(43,77)],fill=BARK[3])
    d.polygon([(50,49),(53,49),(51,70),(56,82),(62,87),(55,84),(48,74)],fill=BARK[2])
    d.line([(45,57),(45,73),(41,83)],fill=BARK[4],width=2)
    d.line([(49,78),(49,87)],fill=BARK[3],width=2)
    branch(d,[(46,64),(32,48),(22,36)],6)
    branch(d,[(51,61),(66,48),(76,35)],5)
    branch(d,[(47,51),(49,28)],6)
    for cx,cy,rx,ry,seed in [(20,42,15,11,211),(75,42,15,12,212),(29,28,18,13,213),(63,24,19,12,214),(47,16,19,11,215),(45,37,22,14,216),(24,51,13,9,217),(65,51,15,9,218)]:
        crown(im,cx,cy,rx,ry,TROPICAL,seed)
    d=ImageDraw.Draw(im)
    # Large, directional leaf fans distinguish it from small-leaved temperate crowns.
    for x,y in [(25,25),(41,18),(62,20),(49,36),(19,43),(69,44),(36,42)]:
        d.polygon([(x-5,y),(x-1,y-3),(x+4,y-2),(x+6,y),(x+1,y+3),(x-3,y+2)],fill=TROPICAL[3])
        d.line((x-3,y,x+3,y-1),fill=TROPICAL[5]);d.line((x,y,x+1,y+2),fill=TROPICAL[2])
    return im


def riverside_willow():
    im,d=canvas((88,88))
    branch(d,[(43,81),(45,69),(40,55),(43,40),(39,24)],6)
    branch(d,[(42,56),(27,40),(17,30)],4)
    branch(d,[(43,50),(61,36),(68,28)],4)
    d.polygon([(39,77),(47,77),(52,84),(44,82),(38,85),(34,83)],fill=BARK[0])
    d.line([(42,74),(42,80),(38,82)],fill=BARK[3],width=2)
    # Rear hanging foliage has a darker palette than the sunlit front curtains.
    def curtain(x,y,length,seed,tone):
        rng=random.Random(seed)
        for offset in [-3,0,3]:
            end=length+rng.randrange(-3,4)
            for t in range(end):
                xx=x+offset+round(math.sin(t/9+seed)*1.2)
                d.point((xx,y+t),fill=WILLOW[1])
                if t%3!=2:
                    d.line((xx-1,y+t,xx+1,y+t+1),fill=WILLOW[tone if offset<2 else max(1,tone-1)])
                if t%6==0:d.point((xx-1,y+t),fill=WILLOW[min(5,tone+1)])
    for x,y,n,seed in [(13,30,30,1),(72,29,29,2),(56,31,30,3),(26,31,34,4)]:curtain(x,y,n,seed,2)
    for cx,cy,rx,ry,seed in [(18,29,12,9,311),(69,27,12,9,312),(30,19,15,10,313),(55,17,17,10,314),(43,28,20,11,315)]:
        crown(im,cx,cy,rx,ry,WILLOW,seed)
    d=ImageDraw.Draw(im)
    for x,y,n,seed in [(17,33,28,11),(29,27,32,12),(42,34,22,13),(57,27,36,14),(69,32,29,15)]:curtain(x,y,n,seed,3 if x<45 else 2)
    return im


def dry_thorn_scrub():
    im,d=canvas((56,40))
    # Low, open, multi-stemmed woody scrub; no spherical berry-bush canopy.
    for pts in [[(27,35),(23,26),(13,18),(8,10)],[(28,35),(31,23),(30,10)],[(29,34),(38,27),(45,15)],[(25,32),(13,28),(6,22)],[(28,31),(22,18),(20,8)],[(32,31),(44,29),(50,23)]]:
        branch(d,pts,1)
    for cx,cy,rx,ry,seed in [(10,16,6,4,411),(20,12,7,5,412),(31,12,6,5,413),(42,20,7,5,414),(15,25,6,4,415),(29,23,7,5,416),(43,29,7,3,417)]:
        crown(im,cx,cy,rx,ry,SCRUB,seed)
    d=ImageDraw.Draw(im)
    for x,y,dx in [(8,12,-3),(19,9,-2),(30,9,2),(46,17,3),(8,25,-3),(37,25,3)]:
        d.line((x,y,x+dx,y-3),fill=BARK[1]);d.point((x+dx,y-3),fill=BARK[4])
    d.line((24,35,31,35),fill=BARK[0]);d.point((25,34),fill=BARK[3])
    return im


def trees():
    return {
        'nature-feather-palm':feather_palm(),
        'nature-spreading-pine':spreading_pine(),
        'nature-boreal-spruce':boreal_spruce(),
        'nature-sahel-thorn':sahel_thorn(),
        'nature-silver-birch':silver_birch(),
        'nature-tropical-broadleaf':tropical_broadleaf(),
        'nature-riverside-willow':riverside_willow(),
        'nature-dry-thorn-scrub':dry_thorn_scrub(),
    }
