"""Ground the player has worked: a spade furrow and scythed stubble. Both lie
flat, so neither casts a shadow."""
import random
from PIL import Image, ImageDraw
from art.shrubs import ramp
from art.fungi import _log

SOIL = ['#3a2a1c', '#4d3823', '#61472c', '#775a39', '#8d6e47']
STRAW = ['#4a4a2b', '#6d6b36', '#8e8a48', '#b0a862', '#cbc086']


def flat(w, h):
    im = Image.new('RGBA', (w, h))
    im.info['shadowMinY'] = 99
    return im, ImageDraw.Draw(im)


def furrow():
    im, d = flat(18, 12)
    # Tilled ground lies flat in the grass: a ragged patch of clods with three
    # shallow grooves. A rim or a straight edge would read as a crate.
    rows = [(5, 12), (3, 14), (2, 15), (2, 14), (3, 15), (4, 13), (5, 12)]
    for i, (x0, x1) in enumerate(rows):
        y = 2 + i
        d.line((x0, y, x1, y), fill=SOIL[2])
        if i % 2:
            d.point((x0 - 1, y), fill=SOIL[1])
            d.point((x1 + 1, y), fill=SOIL[1])
    for i, (x0, x1) in enumerate(rows):
        y = 2 + i
        if i in (1, 4):
            d.line((x0 + 1, y, x1 - 1, y), fill=SOIL[0])
        if i in (2, 5):
            for x in range(x0 + 1, x1, 2):
                d.point((x, y), fill=SOIL[3])
    for x, y in [(6, 4), (11, 6), (8, 8), (13, 5), (5, 7), (10, 3)]:
        d.point((x, y), fill=SOIL[4])
    return im


def stubble():
    im, d = flat(16, 8)
    d.line((2, 6, 13, 6), fill=STRAW[0])
    for i, x in enumerate(range(3, 14, 2)):
        top = 3 if i % 2 else 4
        d.line((x, 6, x, top), fill=STRAW[1])
        d.point((x, top), fill=STRAW[3 if i % 2 else 2])
    d.point((5, 5), fill=STRAW[4])
    d.point((11, 4), fill=STRAW[4])
    return im


STONE = ['#33383c', '#4c545a', '#697179', '#8a9199', '#adb3ba']
CUT = ['#2d3a25', '#41552f', '#5c7740', '#86a057', '#c9c98c']
DRY = ['#3b3526', '#5a5136', '#7d7049', '#a1935f', '#cfc393']


def logs():
    """What a felled tree leaves: two bucked lengths with the ends showing."""
    im = Image.new('RGBA', (30, 20))
    rng = random.Random('logs')
    bark = ramp('#7a5a3c')
    _log(im, bark, 7, 22, 8, 3.5, rng)
    _log(im, bark, 3, 24, 14, 4, rng)
    return im


def cut_stems(dry=False):
    """A shrub taken off at the ankle: short stems with pale cut faces."""
    pal = DRY if dry else CUT
    im, d = flat(20, 11)
    d.line((3, 8, 16, 8), fill=pal[0])
    for i, x in enumerate(range(4, 16, 2)):
        top = 8 - (2 + (i % 3))
        d.line((x, 8, x + (1 if i % 2 else -1), top), fill=pal[1 + i % 2])
        d.point((x + (1 if i % 2 else -1), top), fill=pal[3])
    for x, y in ((6, 9), (12, 9), (9, 7)):
        d.point((x, y), fill=pal[2])
    return im


def rubble():
    """A broken boulder: shards and grit where the rock stood."""
    im, d = flat(20, 12)
    for x0, y0, w, h in ((4, 6, 5, 3), (10, 5, 4, 3), (7, 8, 6, 2), (13, 8, 3, 2)):
        d.rectangle((x0, y0, x0 + w, y0 + h), fill=STONE[1])
        d.line((x0, y0, x0 + w, y0), fill=STONE[3])
        d.line((x0, y0 + h, x0 + w, y0 + h), fill=STONE[0])
        d.point((x0 + 1, y0 + 1), fill=STONE[4])
    for x, y in [(3, 9), (17, 7), (6, 4), (15, 4), (9, 10), (12, 3)]:
        d.point((x, y), fill=STONE[2])
    for x, y in [(2, 8), (18, 9), (5, 3), (16, 10)]:
        d.point((x, y), fill=STONE[1])
    return im


def worked_ground():
    return {
        **reviewed_containers(),
        'nature-furrow': furrow(),
        'nature-stubble': stubble(),
        'nature-logs': logs(),
        'nature-cut-stems': cut_stems(),
        'nature-cut-thorns': cut_stems(dry=True),
        'nature-rubble': rubble(),
        'nature-crate-b':scenery_candidate('crate',(32,36)),
        'nature-crate-c':scenery_candidate('crate',(32,36),True),
    }


def reviewed_containers():
    well=['#30383f','#515b62','#7d8587','#a7aaa3','#d1ceba']
    wicker=['#453625','#715637','#a17d48','#c7a367','#e5c58a']
    result={}
    for form,palettes in [
        ('well',[well,['#44382e','#71604b','#a08a69','#c5b28c','#e7d5ac'],['#252e35','#3d4a53','#61717b','#88979d','#b9c1ba']]),
        ('open-basket',[wicker,['#4b3d2e','#7b654b','#aa9168','#ccb48a','#ead4a8'],['#3c3029','#624a36','#8a6443','#b18b5c','#d5b37b']])]:
        original=well if form=='well' else wicker
        for variant,palette in enumerate(palettes):
            im=prop_kit_candidate(form)
            pixels=im.load();mapping=dict(zip(original,palette))
            colors={tuple(int(a[i:i+2],16) for i in (1,3,5)):tuple(int(b[i:i+2],16) for i in (1,3,5)) for a,b in mapping.items()}
            for y in range(im.height):
                for x in range(im.width):
                    p=pixels[x,y]
                    if p[3] and p[:3] in colors:pixels[x,y]=colors[p[:3]]+(255,)
            im=im.crop((0,0,im.width,im.getbbox()[3]))
            im.info['anchor']=[im.width/2,im.height]
            name='well' if form=='well' else 'basket'
            result[f'nature-prop-{name}-b-{variant}']=im
    return result


def scenery_candidate(form,size,voxel=False):
    import math
    import numpy as np
    from art.voxel import Grid,render
    from art.rocks import stone_volume
    W,H=size;im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
    bark=['#302820','#514032','#775238','#a4784a','#c49a62']
    cut=['#56432d','#997749','#c49c62','#e0c18b']
    stone=['#293b3a','#4b605c','#7a8980','#abb4a1','#d6d7bb']
    g=Grid(0,W,-8,24,H+6)
    mats=[g.mat(bark,gain=.95),g.mat(cut,gain=.95),g.mat(stone,gain=.95)]
    furrow=g.mat(bark,gain=.7)
    ring=g.mat(cut,gain=.65)
    normal_ids={}
    def normal(n):
        n=np.array(n,float);n/=np.linalg.norm(n)+1e-6;key=tuple(np.round(n*2).astype(int))
        if key not in normal_ids:normal_ids[key]=g.normal(key) if any(key) else 0
        return normal_ids[key]
    base=H-(4 if form=='rubble' else 3)
    def screen(p):return (round(p[0]),round(base-p[2]-.5*p[1]))
    def cylinder(a,b,r,grain=False):
        a,b=np.array(a,float),np.array(b,float);v=b-a;length=np.linalg.norm(v);axis=v/length
        lo=np.maximum(np.floor(np.minimum(a,b)-r-1).astype(int),[0,-8,0])
        hi=np.minimum(np.ceil(np.maximum(a,b)+r+1).astype(int),[W-1,23,H+5])
        for x in range(lo[0],hi[0]+1):
            for y in range(lo[1],hi[1]+1):
                for z in range(lo[2],hi[2]+1):
                    q=np.array([x,y,z]);t=(q-a)@axis
                    if t<0 or t>length:continue
                    radial=q-a-axis*t;distance=np.linalg.norm(radial)
                    if distance>r+.1:continue
                    end=t<.65 or t>length-.65
                    material=mats[1] if grain and end else mats[0]
                    if grain and end and (1.6<distance<2.8 or 4<distance<5):material=ring
                    if grain and not end and math.cos(math.atan2(radial[2],radial[1])*5+int(t/7)*.3)>.83:material=furrow
                    n=axis*(-1 if t<.65 else 1) if end else radial
                    g.box(x,x+1,y,y+1,z,z+1,material,normal(n))
    if form=='branches':
        paths=[[(4,0,2),(13,1,6),(22,0,3),(35,1,2)],
               [(13,1,6),(12,2,9),(17,3,13)],[(22,0,3),(27,2,8),(35,2,10)],
               [(6,-2,2),(17,-1,2),(29,-1,1)],[(27,2,8),(26,3,12)],
               [(12,2,9),(7,3,12)]]
        for i,path in enumerate(paths):
            if voxel:
                for j,(a,b) in enumerate(zip(path,path[1:])):cylinder(a,b,1.5 if i==0 else .95,True)
            else:
                pts=[screen(p) for p in path]
                d.line(pts,fill=bark[0],width=5 if i==0 else 3,joint='curve')
                d.line(pts,fill=bark[2],width=3 if i==0 else 1,joint='curve')
                d.line([(x,y-1) for x,y in pts],fill=bark[3],width=1)
                x,y=pts[-1];d.point((x,y),fill=cut[2])
        if not voxel:
            for x,y in [(13,21),(22,22),(29,21)]:d.line((x,y,x+1,y+1),fill=bark[0])
    elif form=='logs':
        logs=[((17,12,16),(17,0,16),5.5),((30,12,16),(30,0,16),5.5),
              ((10,12,6),(10,-1,6),6),((23,12,6),(23,0,6),6),((36,11,6),(36,0,6),5.5)]
        for a,b,r in logs:
            if voxel:cylinder(a,b,r,True)
            else:
                ax,ay=screen(a);bx,by=screen(b)
                d.ellipse((ax-r,ay-r,ax+r,ay+r),fill=bark[0])
                d.ellipse((ax-r+1,ay-r+1,ax+r-1,ay+r-1),fill=bark[2])
                d.arc((ax-r+1,ay-r+1,ax+r-1,ay+r-1),180,280,fill=bark[3])
                d.rectangle((bx-r,ay,bx+r,by),fill=bark[1])
                for offset,tone in [(-r+1,2),(-r+3,3),(r-2,0)]:d.line((bx+offset,ay,bx+offset,by),fill=bark[tone])
                d.ellipse((bx-r,by-r,bx+r,by+r),fill=bark[0])
                d.ellipse((bx-r+1,by-r+1,bx+r-1,by+r-1),fill=cut[2])
                d.arc((bx-r+2,by-r+2,bx+r-2,by+r-2),15,330,fill=cut[1])
                d.arc((bx-2,by-2,bx+2,by+2),70,350,fill=cut[0])
                d.line((bx-1,by-1,bx+1,by),fill=cut[1])
                d.arc((bx-r+1,by-r+1,bx+r-1,by+r-1),185,285,fill=cut[3])
                d.line((bx+2,by+3,bx+3,by+5),fill=bark[0])
    elif form=='rubble':
        pieces=[(8,3,5,3,5),(19,6,6,3,7),(28,2,4,2,4),(16,-2,4,2,3),(6,10,2,2,2),(29,8,2,2,3),(25,-2,3,2,2)]
        for i,(x,y,r,depth,height) in enumerate(pieces):
            if voxel:
                pts=[(x-r,y-depth,0),(x+r,y-depth,0),(x+r,y+depth,0),(x-r,y+depth,0),
                     (x-r*.5,y-depth*.4,height*.7),(x+r*.5,y-depth*.4,height),
                     (x+r*.5,y+depth*.5,height*.6),(x-r*.6,y+depth*.5,height*.8)]
                stone_volume(g,pts,mats[2])
            else:
                xx,yy=screen((x,y,0));rr=round(r)
                poly=[(xx-rr,yy),(xx-rr+1,yy-round(height)),(xx+1,yy-round(height)-1),(xx+rr,yy-1),(xx+rr-1,yy+1)]
                d.polygon(poly,fill=stone[0])
                d.polygon([poly[1],poly[2],(xx+rr-1,yy-2),(xx,yy-1)],fill=stone[3])
                d.line((xx,yy,xx+rr-1,yy-1),fill=stone[1])
        if not voxel:
            for x,y in [(3,18),(32,16),(11,8),(29,9)]:d.line((x,y,x+1,y),fill=stone[2])
    elif form=='crate':
        if voxel:
            g.box(4,28,0,12,1,21,furrow)
            for y in range(0,12,3):g.box(4,28,y,y+2,21,22,mats[1])
            for z in [3,9,15]:g.box(7,25,-1,0,z,z+5,mats[0])
            for x in [4,25]:g.box(x,x+3,-2,0,1,22,mats[1])
            for z in [1,20]:g.box(4,28,-2,0,z,z+2,mats[1])
            for t in range(16):g.box(8+t,10+t,-2,-1,round(4+t*.8),round(6+t*.8),mats[1])
            for x,z in [(5,3),(26,3),(5,20),(26,20)]:g.box(x,x+1,-3,-2,z,z+1,furrow)
        else:
            d.rectangle((4,8,27,32),fill=bark[0])
            d.rectangle((5,9,26,13),fill=cut[2])
            for y in [10,12]:d.line((5,y,26,y),fill=cut[1]);d.line((6,y-1,25,y-1),fill=cut[3])
            d.rectangle((5,14,26,31),fill=bark[2])
            for y in [18,24,30]:d.line((6,y,25,y),fill=bark[0]);d.line((7,y-1,24,y-1),fill=bark[3])
            for x in [5,25]:
                d.rectangle((x,13,x+1,31),fill=cut[1]);d.line((x,14,x,30),fill=cut[2])
            for y in [14,30]:d.rectangle((5,y,26,y+1),fill=cut[1]);d.line((5,y,26,y),fill=cut[2])
            d.line((8,28,23,17),fill=bark[0],width=4)
            d.line((8,27,23,16),fill=cut[1],width=3)
            d.line((8,26,23,15),fill=cut[2])
            for x,y in [(6,15),(25,15),(6,30),(25,30),(9,26),(22,17)]:d.point((x,y),fill=bark[0])
            d.line((10,21,13,21),fill=bark[1]);d.point((12,20),fill=bark[0])
    if voxel:
        rgba,buf=render(g,W,H,0,base,1000000,ambient=.43,sun=.65)
        im=Image.fromarray(rgba,'RGBA')
        if form in ('logs','crate'):
            alpha=rgba[:,:,3]>0
            for y in range(1,H-1):
                for x in range(1,W-1):
                    if not alpha[y,x] and (alpha[y-1,x] or alpha[y,x-1]):im.putpixel((x,y),tuple(int(bark[0][i:i+2],16) for i in (1,3,5))+(255,))
    return im


def prop_kit_candidate(form, voxel=False):
    import math
    import numpy as np
    from art.voxel import Grid, render
    size={'crate':(34,32),'open-basket':(30,28),'water-jug':(24,32),'well':(54,44)}[form]
    W,H=size
    wood=['#382b25','#695039','#977045','#c39a63','#e3c38a']
    wicker=['#453625','#715637','#a17d48','#c7a367','#e5c58a']
    clay=['#492b29','#7a4030','#ad6040','#cf8b59','#e6b780']
    stone=['#30383f','#515b62','#7d8587','#a7aaa3','#d1ceba']
    palette={'crate':wood,'open-basket':wicker,'water-jug':clay,'well':stone}[form]
    im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
    if not voxel:
        if form=='crate':
            d.rectangle((4,6,29,28),fill=wood[2],outline=wood[0])
            d.rectangle((5,7,28,11),fill=wood[3])
            for y in [8,10]:d.line((5,y,28,y),fill=wood[2]);d.line((6,y-1,27,y-1),fill=wood[4])
            d.rectangle((5,12,28,27),fill=wood[2])
            d.rectangle((23,13,28,27),fill=wood[1])
            for x in [10,16,22]:d.line((x,13,x,26),fill=wood[1]);d.line((x+1,14,x+1,25),fill=wood[3])
            for x in [5,27]:
                d.rectangle((x,12,x+1,27),fill=wood[3]);d.line((x,13,x,26),fill=wood[4])
            for y in [12,26]:
                d.rectangle((5,y,28,y+1),fill=wood[3]);d.line((6,y,27,y),fill=wood[4])
            d.polygon([(7,24),(9,26),(26,16),(24,14)],fill=wood[3],outline=wood[1])
            d.line((8,24,24,15),fill=wood[4])
            for x,y in [(6,13),(27,13),(6,26),(27,26),(10,24),(24,16)]:d.point((x,y),fill=wood[0])
            d.line((13,16,14,18),fill=wood[1]);d.line((19,21,20,23),fill=wood[1])
            d.line((8,17,8,20),fill=wood[3])
        elif form=='open-basket':
            outline=[(4,10),(25,10),(24,18),(22,24),(18,26),(10,26),(6,23)]
            d.polygon(outline,fill=wicker[2],outline=wicker[0])
            d.polygon([(21,12),(25,11),(24,18),(21,24),(18,25),(19,18)],fill=wicker[1])
            d.polygon([(6,13),(10,14),(11,24),(8,23)],fill=wicker[3])
            for y,left,right in [(15,6,23),(18,7,23),(21,7,22),(24,10,20)]:
                d.line((left,y,right,y),fill=wicker[1])
                for x in range(left+1,right-1,4):d.line((x,y-1,x+2,y-1),fill=wicker[3 if x<18 else 2])
            for x in [9,14,19]:d.line((x,14,x+1,24),fill=wicker[2 if x==19 else 3])
            d.ellipse((3,5,26,14),fill=wicker[3],outline=wicker[0])
            d.ellipse((5,7,24,12),fill=wicker[0])
            d.arc((5,7,24,15),180,355,fill=wicker[1])
            d.arc((4,6,25,13),185,300,fill=wicker[4])
            d.arc((4,7,25,13),5,170,fill=wicker[2])
            for x in [7,12,17,22]:d.line((x,12,x+1,13),fill=wicker[1])
            d.arc((1,10,7,17),70,290,fill=wicker[0]);d.arc((2,11,7,16),90,270,fill=wicker[3])
            d.arc((23,10,28,17),270,90,fill=wicker[0]);d.arc((23,11,27,16),270,85,fill=wicker[2])
        elif form=='water-jug':
            d.ellipse((13,11,22,24),fill=clay[2],outline=clay[0])
            d.ellipse((16,14,19,21),fill=(0,0,0,0))
            d.arc((14,12,21,23),270,60,fill=clay[3])
            shape=[(8,9),(14,9),(14,12),(18,16),(19,22),(17,27),(14,29),(8,29),(5,26),(4,22),(5,17),(8,13)]
            d.polygon(shape,fill=clay[2],outline=clay[0])
            d.polygon([(14,12),(18,17),(18,22),(16,27),(13,28),(13,23),(14,19)],fill=clay[1])
            d.polygon([(8,14),(10,13),(11,17),(9,20),(9,26),(7,26),(6,22),(7,17)],fill=clay[3])
            d.line((7,19,7,23),fill=clay[4]);d.point((8,17),fill=clay[4])
            d.rectangle((8,7,14,12),fill=clay[2]);d.line((8,8,8,12),fill=clay[0]);d.line((14,8,14,12),fill=clay[0])
            d.line((9,8,9,11),fill=clay[3])
            d.ellipse((7,5,15,9),fill=clay[3],outline=clay[0]);d.line((9,7,13,7),fill=clay[0])
            d.line((9,6,12,6),fill=clay[4]);d.line((8,28,14,28),fill=clay[1])
            d.line((9,25,12,25),fill=clay[2])
        else:
            outer=[(4,16),(49,16),(49,29),(46,34),(40,38),(29,40),(18,39),(9,35),(4,29)]
            d.polygon(outer,fill=stone[2],outline=stone[0])
            d.polygon([(4,17),(10,20),(12,35),(8,32),(5,28)],fill=stone[3])
            d.polygon([(38,20),(49,16),(49,29),(45,34),(39,37)],fill=stone[1])
            for pts in [[(5,24),(11,28),(22,31),(34,31),(44,28),(48,25)],
                        [(7,31),(15,35),(27,37),(39,35),(46,31)]]:
                d.line(pts,fill=stone[1])
            for x,y,h in [(10,21,6),(20,25,5),(32,25,5),(43,23,5),(15,30,5),(28,32,5),(39,29,6),(21,36,3)]:
                d.line((x,y,x,y+h),fill=stone[1]);d.line((x+1,y+1,x+1,y+h-1),fill=stone[3 if x<30 else 2])
            d.ellipse((4,6,49,25),fill=stone[3],outline=stone[0])
            d.ellipse((10,10,43,20),fill='#1c292d')
            d.arc((11,10,42,25),185,355,fill=stone[1],width=2)
            d.arc((12,11,41,24),190,340,fill=stone[2])
            d.arc((5,7,48,24),185,285,fill=stone[4])
            d.arc((6,8,47,24),15,165,fill=stone[2])
            for pts in [[(9,9),(13,12)],[(20,7),(21,10)],[(34,7),(32,10)],[(46,11),(42,13)],[(48,17),(43,17)],[(39,23),(37,20)],[(25,24),(25,21)],[(11,22),(15,19)],[(5,16),(10,16)]]:
                d.line(pts,fill=stone[1])
            d.line((15,24,21,25),fill=stone[4]);d.line((7,29,9,30),fill=stone[4])
        return im

    g=Grid(0,W,-12,32,H+8)
    body=g.mat(palette,gain=.98,bias=0)
    dark=g.mat(palette,gain=.65,bias=-.3)
    light=g.mat(palette,gain=1.1,bias=.25)
    x,y,z=np.meshgrid(np.arange(W),np.arange(-12,32),np.arange(H+8),indexing='ij')
    normals={}
    def put(mask,material,n=None):
        g.m[mask]=material
        if n is not None:
            key=tuple(round(float(a),2) for a in n)
            if key not in normals:normals[key]=g.normal(key)
            g.n[mask]=normals[key]
    def lathe(cx,cy,profile,material,inner=None,texture=None,sy=1):
        radius=np.interp(z,[p[0] for p in profile],[p[1] for p in profile])
        R=np.hypot(x-cx,(y-cy)/sy)
        mask=(z>=profile[0][0])&(z<=profile[-1][0])&(R<=radius)
        if inner is not None:mask &= R>=(inner(radius) if callable(inner) else inner)
        put(mask,material)
        angle=np.arctan2((y-cy)/sy,x-cx)
        slope=np.gradient(np.interp(np.arange(H+8),[p[0] for p in profile],[p[1] for p in profile]))
        for a in range(16):
            theta=-math.pi+(a+.5)*math.tau/16
            for sign in [-1,0,1]:
                normal=[math.cos(theta),math.sin(theta),-sign*.6]
                which=mask&(angle>=-math.pi+a*math.tau/16)&(angle< -math.pi+(a+1)*math.tau/16)&(np.sign(slope[z])==sign)
                put(which,material,normal)
        if texture: texture(mask,angle)
    def tube(points,r,material):
        for a,b in zip(points,points[1:]):
            a,b=np.array(a,float),np.array(b,float);v=b-a
            t=np.clip(((x-a[0])*v[0]+(y-a[1])*v[1]+(z-a[2])*v[2])/(v@v),0,1)
            mask=(x-a[0]-t*v[0])**2+(y-a[1]-t*v[1])**2+(z-a[2]-t*v[2])**2<=r*r
            put(mask,material)
    if form=='crate':
        g.box(4,30,0,10,1,19,dark)
        for xx in range(5,29,5):g.box(xx,xx+4,-1,0,2,18,body)
        for yy in range(0,10,3):g.box(4,30,yy,yy+2,19,20,light)
        for yy in [3,6,9]:g.box(5,29,yy,yy+1,19,20,dark)
        for xx in [4,27]:g.box(xx,xx+3,-2,0,1,20,light)
        for zz in [1,17]:g.box(4,30,-2,0,zz,zz+3,light)
        for xx in range(8,27):
            zz=4+(xx-8)*.67
            g.box(xx,xx+1,-3,-2,round(zz),round(zz)+3,light)
        for xx,zz in [(5,2),(28,2),(5,18),(28,18),(10,6),(24,16)]:g.box(xx,xx+1,-4,-3,zz,zz+1,dark)
    elif form=='open-basket':
        def weave(mask,a):
            stake=(a+math.pi)*14/math.tau
            put(mask&(z%3==0),dark)
            put(mask&(z%3!=0)&((stake%1)<.18),light)
        lathe(14,7,[(1,6),(3,8),(7,9),(12,10)],body,inner=lambda r: r-1.5,texture=weave)
        inside=g.mat(wicker[:2],gain=.6)
        radius=np.interp(z,[1,3,7,12],[6,8,9,10]);R=np.hypot(x-14,y-7)
        put((g.m>0)&(z>=3)&(z<=12)&(R<radius-.6),inside)
        lathe(14,7,[(1,6),(2,7)],inside)
        lathe(14,7,[(12,10),(13,10.5)],body,inner=8.5)
        for xx in [4,24]:tube([(xx,6,7),(xx-1 if xx==4 else xx+1,6,10),(xx,6,13)],1,body)
    elif form=='water-jug':
        tube([(15,5,18),(19,5,18),(21,5,15),(21,5,11),(18,5,8),(15,5,9)],1.3,body)
        lathe(10,6,[(1,3),(2,5),(5,7),(10,7.5),(14,6),(17,3),(19,2.5),(20,3)],body)
        lathe(10,6,[(20,3),(21,3)],light,inner=1.5)
        g.box(9,12,5,8,20,21,dark)
    else:
        def masonry(mask,a):
            sector=np.floor((a+math.pi)*12/math.tau+((z//5)%2)*.5)
            joint=((a+math.pi)*12/math.tau+((z//5)%2)*.5)%1<.075
            put(mask&((z%5==0)|joint),dark)
            put(mask&(sector.astype(int)%4==1)&(z%5>0)&~joint,light)
        lathe(26,12,[(1,20),(3,22),(17,22)],body,inner=16,texture=masonry,sy=.6)
        lathe(26,12,[(17,23),(19,23),(20,22)],light,inner=16,texture=masonry,sy=.6)
        well_dark=g.mat(['#283437','#303e40','#39474a'],gain=.7)
        lathe(26,12,[(0,16),(1,16)],well_dark,sy=.6)
    rgba,_=render(g,W,H,0,H-3,1000000,ambient=.46,sun=.63)
    alpha=rgba[:,:,3]>0
    interior=alpha.copy()
    interior[1:] &= alpha[:-1];interior[:-1] &= alpha[1:]
    interior[:,1:] &= alpha[:,:-1];interior[:,:-1] &= alpha[:,1:]
    rgba[alpha&~interior,:3]=tuple(int(palette[0][i:i+2],16) for i in (1,3,5))
    return Image.fromarray(rgba,'RGBA')
