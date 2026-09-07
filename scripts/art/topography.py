"""Code-authored terrain: 16px tops, 14px rise, 24 shared colors.
Connected bank and cliff silhouettes are rasterized by terrain-contours.ts.
"""
from PIL import Image, ImageDraw
import random
PALETTE=['#365b40','#47724b','#5b8046','#718b40','#839644','#8f9e4b',
 '#a4ae59','#bdc575','#9b9e53','#b0aa64','#c3b678','#4b9faa',
 '#3693a7','#79b9c4','#624735','#90633f','#b38b53','#d0ab6b',
 '#e6c384','#ebd8a5','#146c8c','#207e9e','#409bb6','#858875']
P=PALETTE
RAMPS={'grass':[4,5,6,3],'damp':[1,2,3,0],'dry':[8,9,10,5],
 'soil':[16,17,18,15],'gravel':[17,10,18,23],'water':[20,21,22,21],
 'shallow':[12,11,13,11]}
RISE=14

def canonical_mask(mask):
    for bit,adj in [(16,3),(32,6),(64,12),(128,9)]:
        if mask&adj:mask&=~bit
    return mask

def distances(mask,x,y):
    ds=[]
    for bit,dist in [(1,y),(2,15-x),(4,15-y),(8,x)]:
        if mask&bit:ds.append(dist)
    for bit,cx,cy in [(16,15,0),(32,15,15),(64,0,15),(128,0,0)]:
        if mask&bit:ds.append(abs(x-cx)+abs(y-cy))
    return ds

def paint_topography():
    sprites={};masks=[m for m in range(1,256) if canonical_mask(m)==m]
    for material,colors in RAMPS.items():
        for v in range(4):
            im=Image.new('RGBA',(16,16),P[colors[0]]);d=ImageDraw.Draw(im)
            r=random.Random(f'terrain-revision2:{material}:{v}')
            wet=material in ('water','shallow')
            count=4 if wet else 9 if material=='gravel' else 5 if material=='soil' else 7
            for j in range(count):
                x,y=r.randrange(16),r.randrange(16)
                w,h=(r.randrange(2,5),r.choice([1,1,2])) if wet else (r.randrange(2,5),r.randrange(1,3))
                color=P[colors[1] if j%4 else colors[2]]
                for dx in range(w):
                    for dy in range(h):
                        if dx in (0,w-1) and dy==0 and h>1:continue
                        d.point(((x+dx)%16,(y+dy)%16),fill=color)
                if wet and j%3==0:d.line((x,y+1,min(15,x+2),y+1),fill=P[colors[3]])
            # Sparse blades; most tiles remain quiet enough for actors and relief.
            if material in ('grass','damp','dry') and v==3:
                d.line((9,12,8,10),fill=P[colors[3]]);d.line((10,12,11,9),fill=P[colors[1]])
            if material=='gravel':
                for sx,sy in ([(3+v,4)] if v%2 else [(11,10-v),(5,13)]):
                    d.rectangle((sx-1,sy,sx+2,sy+2),fill=P[14])
                    d.polygon([(sx-1,sy),(sx,sy-2),(sx+2,sy-1),(sx+3,sy+1),(sx+1,sy+2)],fill=P[23])
                    d.line((sx,sy-1,sx+1,sy-1),fill=P[19])
            sprites[f'{material}-{v}']=im
    for material in ('grass','damp','dry','soil','gravel','shallow'):
        for mask in masks:
            im=Image.new('RGBA',(16,16));d=ImageDraw.Draw(im)
            for y in range(16):
                for x in range(16):
                    dist=min(distances(mask,x,y),default=99)
                    width=([3,4,4,3,3,5,4,3] if material=='shallow' else [1,2,3,2,2,1,2,1])[(x+y)//2%8]
                    if dist<width:
                        color=RAMPS[material][0 if dist<width-1 else 1]
                        d.point((x,y),fill=P[color])
            sprites[f'blend-{material}-{mask}']=im
    for mask in masks:
        for phase in range(4):
            im=Image.new('RGBA',(16,16));d=ImageDraw.Draw(im)
            for x,y,dist,u in edge_pixels(mask,phase):
                shift=[3,3,4,5,6,6,5,4,3,3,2,3,4,4,3,3][u//2%16]
                if dist<shift:
                    color=23 if (x*7+y*11)%23<2 else 17 if (x+y)%4 else 16
                elif dist==shift:color=13
                elif dist==shift+1:color=11
                else:continue
                d.point((x,y),fill=P[color])
            sprites[f'bank-{mask}-{phase}']=im
    for mask in range(16):
        im=Image.new('RGBA',(16,16));d=ImageDraw.Draw(im)
        for y in range(16):
            for x in range(16):
                ds=[((x-8)**2+(y-8)**2)**.5]
                if mask&1 and y<=8:ds.append(abs(x-8))
                if mask&2 and x>=8:ds.append(abs(y-8))
                if mask&4 and y>=8:ds.append(abs(x-8))
                if mask&8 and x<=8:ds.append(abs(y-8))
                dist=min(ds)
                width=5+([0,1,1,0,0,1,0,0][(x+y)%8])
                if dist<width:
                    color=8 if dist>=width-1 else 9
                    if dist<4 and (x*11+y*17)%37 in (0,1,2,9,10):color=23 if (x+y)%3 else 17
                    d.point((x,y),fill=P[color])
        sprites[f'channel-{mask}']=im
    for direction in ('n','e','s','w'):
        source=sprites['soil-1'].copy();d=ImageDraw.Draw(source)
        # Feathered grassy shoulders, with no ladder-like transverse bars.
        for y in range(16):
            for x in range(16):
                cross=x if direction in ('n','s') else y
                if cross<2 or cross>13:d.point((x,y),fill=P[5 if (x+y)%3 else 4])
        im=Image.new('RGBA',(16,16+RISE))
        for y in range(16):
            for x in range(16):
                f={'n':1-y/16,'s':y/16,'e':x/16,'w':1-x/16}[direction]
                yy=y+RISE-round(f*RISE)
                im.putpixel((x,yy),source.getpixel((x,y)))
                if direction=='n' and yy+1<im.height:im.putpixel((x,yy+1),source.getpixel((x,y)))
        sprites[f'ramp-{direction}']=im
    im=Image.new('RGBA',(16,16));d=ImageDraw.Draw(im)
    for x,y in [(3,12),(6,10),(10,12),(12,14)]:
        d.line((x,15,x-1,y),fill=P[2]);d.line((x+1,15,x+2,y-2),fill=P[3]);d.point((x+2,y-2),fill=P[7])
    sprites['tuft']=im
    # One elongated submerged bar, with scattered stones at its shallow margin.
    im=Image.new('RGBA',(28,44));d=ImageDraw.Draw(im);r=random.Random('shoal')
    d.polygon([(10,1),(17,3),(21,11),(25,23),(23,35),(17,42),(9,39),(4,26),(5,12)],fill=P[11])
    for _ in range(64):
        x,y=r.randrange(5,24),r.randrange(4,40)
        if abs(x-14)<8-abs(y-22)*.14:d.rectangle((x,y,x+1,y+1),fill=P[r.choice([10,17,18,23])])
    sprites['gravel-bar']=im
    return sprites


def edge_pixels(mask,phase):
    for y in range(16):
        for x in range(16):
            gx=x+16*(phase%2);gy=y+16*(phase//2)
            ds=[]
            for bit,dist,u in [(1,y,gx),(2,15-x,gy),(4,15-y,gx),(8,x,gy)]:
                if mask&bit:ds.append((dist,u))
            for bit,cx,cy in [(16,15,0),(32,15,15),(64,0,15),(128,0,0)]:
                if mask&bit:ds.append((abs(x-cx)+abs(y-cy),gx+gy))
            if ds:
                dist,u=min(ds)
                yield x,y,dist,u
