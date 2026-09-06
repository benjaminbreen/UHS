"""Terrain, vegetation, props and actor source recipes. Integer pixels, explicit ramps, one light direction.
This module paints source assets; no reference-image pixels enter the atlas.
"""
from PIL import Image, ImageDraw
import random, math


def paint_world(S):
    def canvas(w,h):
        im=Image.new('RGBA',(w,h));return im,ImageDraw.Draw(im)
    def shade(hexcolor, factor):
        return tuple(round(int(hexcolor[i:i+2],16)*factor) for i in (1,3,5))+(255,)
    # Broad color clusters, followed by a few grass blades. Variation is at both
    # the tile and pixel-cluster scale, never a uniform sprinkling of single dots.
    for material,palette in {
        'grass':['#829745','#879b48','#8d9f4c','#93a351','#7d9242'],
        'dry':['#889a49','#8d9f4c','#93a350','#99a755','#839547'],
        'dirt':['#c6a263','#cfad6e','#d9b779','#dfbf81','#b99558'],
        'sand':['#d6b071','#dfba7e','#e8c88d','#f0d398','#bd965d'],
        'water':['#13759b','#167a9e','#197da1','#1c80a2','#117198'],
        'field':['#765737','#80603d','#896743','#927149','#674b32'],
    }.items():
        for v in range(8):
            im,d=canvas(16,16);r=random.Random(416+v*53+sum(map(ord,material)))
            d.rectangle((0,0,15,15),fill=palette[0])
            for j in range((2 if v<6 else 7) if material in ('grass','dry') else 2 if material=='water' else 5):
                x,y=r.randrange(-2,16),r.randrange(-2,16);ww,hh=r.randrange(2,5),r.randrange(1,4)
                color=palette[r.randrange(1,5)]
                d.rectangle((x,y,x+ww,y+hh),fill=color)
                d.line((x-1,y+1,x+ww+1,y+1),fill=color)
            if material in ('grass','dry'):
                for j in range(1 if v<6 else 3):
                    x,y=r.randrange(1,15),r.randrange(1,15)
                    d.line((x,y,x-1,y-1),fill=palette[4]);d.line((x+1,y,x+1,y-2),fill=palette[2])
            elif material in ('sand','dirt'):
                for j in range(4):
                    x,y=r.randrange(1,15),r.randrange(1,15);d.line((x,y,x+1,y),fill=palette[3])
            S[f'{material}{v}']=im
    for v in range(8):
        source=S[f'water{v}'];im=source.copy()
        for y in range(16):
            for x in range(16):
                r,g,b,a=source.getpixel((x,y));im.putpixel((x,y),(r+8,g-7,b-30,a))
        S[f'water-teal{v}']=im
    # Ground-edge masks include diagonals for isolated convex corners.
    # Every tile uses matching edge end points, so chunk seams cannot change them.
    for material in ['grass','dry','sand']:
        pal={'grass':['#819947','#9aae58','#6b873e'],'dry':['#92a64f','#adbb69','#7c9445'],'sand':['#dfb97b','#edce96','#be985f']}[material]
        for mask in range(1,256):
            im,d=canvas(16,16)
            for y in range(16):
                for x in range(16):
                    candidates=[]
                    if mask&1:candidates.append(y)
                    if mask&2:candidates.append(15-x)
                    if mask&4:candidates.append(15-y)
                    if mask&8:candidates.append(x)
                    for bit,cx,cy in [(16,15,0),(32,15,15),(64,0,15),(128,0,0)]:
                        if mask&bit:candidates.append(math.hypot(x-cx,y-cy)+1)
                    dist=min(candidates,default=99)
                    jitter=[0,1,2,1,0,0,1,0][(x+y)%8]
                    if dist<2+jitter:
                        color=pal[0] if (x+y*3)%5 else pal[1]
                        d.point((x,y),fill=color)
            S[f'edge-{material}-{mask}']=im
    # Raised natural banks: lit lip, exposed soil, foot shadow, then shallow water.
    # Source tiles remain walkable only on the existing land side of the contour.
    for mask in range(1,256):
        im,d=canvas(16,16)
        for y in range(16):
            for x in range(16):
                candidates=[]
                if mask&1:candidates.append((y,'north',x))
                if mask&2:candidates.append((15-x,'east',y))
                if mask&4:candidates.append((15-y,'south',x))
                if mask&8:candidates.append((x,'west',y))
                for bit,cx,cy,adjacent in [(16,15,0,3),(32,15,15,6),(64,0,15,12),(128,0,0,9)]:
                    if mask&bit and not mask&adjacent:candidates.append(((abs(x-cx)+abs(y-cy))*.70,'north',x+y))
                dist,side,u=min(candidates,default=(99,'north',0))
                variation=[0,0,0,0,0,1,1,0][u%8]
                depth=dist-variation
                face=9 if side=='north' else 3 if side=='south' else 7
                if depth<1:color='#f0cd8d'
                elif depth<2:color='#d9b174'
                elif depth<face:
                    ramp=['#9d7748','#b28a51','#c19a5f'] if side=='east' else ['#76563b','#936b40','#a57c48']
                    color=ramp[(u//3+int(depth)//2)%3]
                elif depth<face+2:color='#254e55'
                elif depth<face+4:color='#267e94'
                else:continue
                d.point((x,y),fill=color)
        S[f'bank-{mask}']=im
    for phase in range(4):
        im,d=canvas(16,16)
        for x,y,w in [(2,4,5),(9,11,3)]:
            xx=x+(phase//2);yy=y+(phase%2)
            d.line((xx,yy,xx+w,yy),fill=(100,191,210,160 if phase%3 else 210))
            d.line((xx+1,yy+1,xx+w-1,yy+1),fill=(71,157,183,110))
        S[f'ripple-{phase}']=im
    # Foliage masses are shaped explicitly, then lit with a small quantized ramp.
    # Cluster noise moves whole pairs of pixels, keeping highlights deliberate.
    def crown(im,cx,cy,rx,ry,pal,seed):
        d=ImageDraw.Draw(im);r=random.Random(seed)
        jitter={(x,y):r.uniform(-.10,.10) for x in range(-20,21) for y in range(-20,21)}
        for y in range(int(cy-ry)-1,int(cy+ry)+2):
            for x in range(int(cx-rx)-1,int(cx+rx)+2):
                nx,ny=(x-cx)/rx,(y-cy)/ry;rr=nx*nx+ny*ny
                if rr>1+jitter.get((x//2,y//2),0):continue
                z=math.sqrt(max(0,1-rr));light=-.46*nx-.6*ny+.58*z+jitter.get((x//2,y//2),0)
                level=0 if rr>.92 else 1 if light<.08 else 2 if light<.38 else 3 if light<.63 else 4 if light<.82 else 5
                d.point((x,y),fill=pal[level])
    from art.vegetation import tree
    for name in ['oak','olive','hackberry','acacia','cypress']:S[name]=tree(name)
    for name in ['bush','flowers','flax']:
        im,d=canvas(24,26)
        pal=['#294e32','#365f35','#507d37','#73973f','#94b64c','#b7c964']
        for i,(cx,cy,rx,ry) in enumerate([(9,15,7,7),(15,13,6,8),(18,18,5,5)]):crown(im,cx,cy,rx,ry,pal,55+i)
        if name!='bush':
            for x,y in [(5,10),(13,5),(19,12)]:
                d.line((x,y+2,x,y+7),fill='#536e36');d.rectangle((x-1,y,x+1,y+2),fill='#f2deaa' if name=='flowers' else '#a2c7ce');d.point((x+1,y),fill='#fff0c8')
        S[name]=im
    # Masonry rocks and useful objects have distinct lit top and dark side planes.
    for variant in range(3):
        im,d=canvas(32,28)
        for ox,oy,size in ([(2,8,16),(16,13,12)] if variant!=1 else [(6,5,21)]):
            d.polygon([(ox,oy+5),(ox+4,oy),(ox+size-3,oy+1),(ox+size,oy+6),(ox+size-1,oy+14),(ox+5,oy+16),(ox,oy+12)],fill='#4d5a4c')
            d.polygon([(ox+1,oy+5),(ox+5,oy+1),(ox+size-4,oy+2),(ox+size-1,oy+6),(ox+size-5,oy+10),(ox+5,oy+9)],fill='#a5ad91')
            d.line((ox+5,oy+1,ox+size-4,oy+2),fill='#d2cfad',width=2)
            d.polygon([(ox+5,oy+10),(ox+size-5,oy+10),(ox+size-2,oy+7),(ox+size-3,oy+14),(ox+6,oy+15)],fill='#77826e')
            d.line((ox+6,oy+11,ox+6,oy+14),fill='#596450')
        S['rock' if variant==0 else f'rock-{variant}']=im
    im,d=canvas(24,36)
    for x,y in [(3,14),(7,9),(12,5),(17,11),(21,16)]:
        d.line((x,32,x,y),fill='#315d39',width=2);d.line((x-1,30,x-2,y+8),fill='#6e913f');d.line((x+1,31,x+3,y+7),fill='#466f37')
        d.rectangle((x,y,x+2,y+7),fill='#98632c');d.line((x,y,x,y+5),fill='#d4a24e')
    S['reeds']=im
    im,d=canvas(24,28)
    for x,y in [(4,11),(10,6),(17,10),(21,15)]:
        d.line((x,25,x,y),fill='#916a30');d.line((x+1,24,x+1,y+2),fill='#d1a449')
        for yy in range(y,y+10,3):d.line((x,yy+2,x-2,yy),fill='#d7af4d',width=2);d.line((x+1,yy+2,x+3,yy),fill='#f0cc68')
    S['wheat']=im
    for name in ['basket','amphora','jug']:
        im,d=canvas(24,30)
        d.polygon([(7,8),(16,8),(20,14),(20,24),(16,28),(7,27),(3,23),(3,14)],fill='#4a3728')
        d.ellipse((4,8,19,26),fill='#956638');d.ellipse((5,8,16,25),fill='#c18b45');d.line((6,13,6,22),fill='#e5b366',width=2)
        if name=='basket':
            for y in [14,18,22]:d.line((5,y,18,y),fill='#765132');d.line((6,y+1,17,y+1),fill='#b27d43')
            d.ellipse((4,6,19,14),fill='#d5a864');d.ellipse((7,8,17,12),fill='#493c29')
        else:
            d.rectangle((8,4,15,12),fill='#a27038');d.ellipse((7,3,16,8),fill='#deac65');d.ellipse((9,4,14,6),fill='#4c3928')
            if name=='amphora':d.arc((1,9,9,19),70,280,fill='#b78040',width=2);d.arc((14,9,22,19),260,100,fill='#8d5e31',width=2)
        S[name]=im
    im,d=canvas(40,36)
    d.ellipse((3,14,36,33),fill='#4c5750');d.rectangle((3,15,36,25),fill='#777f70')
    d.ellipse((3,8,36,26),fill='#a4aa94');d.ellipse((6,8,33,21),fill='#d0cbb0');d.ellipse((11,11,29,20),fill='#394c4c');d.ellipse((13,14,28,19),fill='#397a8d')
    for x,y in [(5,17),(12,24),(23,23),(31,17)]:d.line((x,y,x,y+6),fill='#505e55');d.line((x+1,y,x+5,y),fill='#bdbea3')
    S['well']=im
    im,d=canvas(32,36)
    for x,y in [(6,25),(11,29),(20,29),(26,24),(23,19),(8,18)]:
        d.ellipse((x-4,y-3,x+4,y+3),fill='#4c584f');d.polygon([(x-3,y-1),(x-1,y-3),(x+3,y-2),(x+2,y+1)],fill='#a2a48b')
    d.line((9,27,22,21),fill='#55412b',width=3);d.line((10,22,22,28),fill='#674b2c',width=3)
    d.polygon([(11,26),(8,20),(12,13),(13,7),(17,14),(20,3),(22,16),(25,21),(20,28)],fill='#b34e23')
    d.polygon([(12,24),(13,16),(15,19),(19,9),(20,20),(23,23),(18,27)],fill='#ee8e2d')
    d.polygon([(15,24),(16,18),(18,21),(19,17),(21,24),(18,26)],fill='#ffdc65');S['fire']=im
    # World people have a 20x32 canvas; the foot anchor and simulation cell are unchanged.
    for si,(skin,light,shadecolor) in enumerate([('#c18a54','#e7b278','#8d5b36'),('#a97143','#d09961','#774a2f'),('#d3a16a','#efc08a','#a37447')]):
        for ci,cloth in enumerate(['#e4d6af','#ab5a36','#38798b','#738245','#b89343','#75628b']):
            for direction in range(4):
                for frame in range(2):
                    im,d=canvas(20,32);ink='#272a25';hair='#292823'
                    # Separate feet and tunic, with a single dark silhouette.
                    d.rectangle((5,22,8,29-frame),fill=ink);d.rectangle((12,22,15,28+frame),fill=ink)
                    d.rectangle((6,24,8,27-frame),fill=shadecolor);d.rectangle((12,24,14,26+frame),fill=shadecolor)
                    d.rectangle((5,28-frame,9,30-frame),fill='#3d3527');d.rectangle((11,27+frame,15,29+frame),fill='#3d3527')
                    d.polygon([(5,12),(14,12),(17,15),(17,23),(14,25),(5,25),(2,22),(2,15)],fill=ink)
                    d.rectangle((5,13,14,23),fill=shade(cloth,.7));d.rectangle((5,13,12,22),fill=cloth);d.line((6,14,6,20),fill=shade(cloth,1.16))
                    d.rectangle((3,15,4,21),fill=shadecolor);d.rectangle((3,15,3,19),fill=skin);d.rectangle((15,15,16,21),fill=skin)
                    d.rectangle((5,22,14,23),fill='#73522e');d.point((11,22),fill='#c3a366')
                    d.polygon([(6,3),(14,3),(16,5),(16,10),(14,14),(7,14),(4,11),(4,6)],fill=ink)
                    d.rectangle((6,5,14,11),fill=skin);d.rectangle((7,10,13,13),fill=skin);d.line((7,6,11,6),fill=light)
                    d.polygon([(4,9),(4,4),(6,2),(13,2),(16,5),(15,8),(13,6),(11,5),(10,7),(7,6),(6,10)],fill=hair)
                    d.line((7,3,12,3),fill='#484031')
                    if direction==0:d.rectangle((6,6,14,11),fill=hair);d.rectangle((7,11,13,12),fill=shadecolor)
                    elif direction==1:d.point((14,8),fill=ink);d.rectangle((15,9,16,10),fill=light);d.rectangle((6,6,8,11),fill=hair)
                    elif direction==3:d.point((6,8),fill=ink);d.rectangle((4,9,5,10),fill=light);d.rectangle((13,6,14,11),fill=hair)
                    else:d.point((8,8),fill=ink);d.point((13,8),fill=ink);d.point((11,10),fill=light);d.line((9,12,11,12),fill=shadecolor)
                    S[f'human-{si}-{ci}-{direction}-{frame}']=im
    # Distinct leafy crops grow in the same field/harvest locations.
    im,d=canvas(20,24)
    d.line((10,21,10,8),fill='#4d682f',width=2)
    for x,y,side in [(9,17,-1),(10,12,1),(9,10,-1),(11,18,1)]:
        d.polygon([(x,y),(x+side*5,y-2),(x+side*6,y-6),(x+side*2,y-5)],fill='#507c31')
        d.line((x,y-1,x+side*4,y-4),fill='#9bbb4d',width=2)
    d.rectangle((9,4,11,8),fill='#b3c868');S['crop-leafy']=im
