"""Stepped canopy clusters: shared light ramp, species-specific silhouettes."""
from PIL import Image, ImageDraw
import random, math

def tree(name):
    im=Image.new('RGBA',(56,72));d=ImageDraw.Draw(im)
    # A substantial trunk, roots and bifurcations anchor the canopy.
    d.polygon([(23,38),(31,37),(31,62),(36,67),(29,66),(24,68),(18,68),(22,62)],fill='#3e392a')
    d.polygon([(24,39),(28,39),(27,62),(23,66),(24,57)],fill='#926c3d')
    d.line((24,43,24,61),fill='#ba9454',width=2)
    d.line((25,51,16,39),fill='#785836',width=4);d.line((29,50,38,38),fill='#5c482f',width=3)
    pal=['#1d3c2c','#2c512d','#426a30','#608337','#829a40','#a5b452']
    if name=='olive':pal=['#293e2e','#405936','#5c753d','#7a8e49','#96a559','#b4bb76']
    if name=='cypress':
        masses=[(27,10,4,8),(25,20,7,10),(28,29,8,11),(25,39,9,12),(29,47,8,10)]
    elif name=='acacia':masses=[(14,27,11,9),(27,19,12,10),(40,29,12,10),(22,35,13,11),(34,38,11,10)]
    else:masses=[(25,14,10,11),(15,24,11,11),(36,24,12,13),(13,37,10,12),(27,35,15,14),(40,38,11,12),(25,47,12,9)]
    rng=random.Random(185+sum(map(ord,name)))
    # Low-resolution polygons enforce purposeful 2px stairs, not anti-aliased round lobes.
    canopy=Image.new('RGBA',(28,36));cd=ImageDraw.Draw(canopy)
    for cx,cy,rx,ry in masses:
        cx//=2;cy//=2;rx=max(2,rx//2);ry=max(2,ry//2)
        poly=[(cx-rx,cy-1),(cx-rx+1,cy-ry+2),(cx-2,cy-ry),(cx+1,cy-ry),(cx+rx-1,cy-2),(cx+rx,cy+1),(cx+rx-2,cy+ry),(cx,cy+ry+1),(cx-rx+1,cy+ry-1)]
        cd.polygon(poly,fill=pal[0]);cd.polygon([(x,y-1) for x,y in poly[1:-1]]+[(cx-rx+1,cy+2)],fill=pal[1])
        cd.polygon([(cx-rx+1,cy-1),(cx-2,cy-ry+1),(cx+1,cy-ry+1),(cx+rx-2,cy-1),(cx+rx-3,cy+3),(cx-2,cy+ry-1),(cx-rx+1,cy+2)],fill=pal[2])
        # Smaller overlapping leaf plates replace shiny uniform highlights.
        for ox,oy,size in [(-2,-3,3),(-4,0,2),(0,0,3),(-1,3,2),(2,-2,2)]:
            x,y=cx+ox,cy+oy
            if 0<=x<28 and 0<=y<36 and canopy.getpixel((x,y))[3]:
                level=3 if ox+oy>0 else 4
                cd.polygon([(x-size,y),(x-1,y-2),(x+size-1,y-1),(x+size,y+1),(x,y+2),(x-size,y+1)],fill=pal[level])
                if rng.random()<.6:cd.line((x-1,y-1,x+1,y-1),fill=pal[min(5,level+1)])
    canopy=canopy.resize((56,72),Image.Resampling.NEAREST)
    mask=canopy.getchannel('A')
    cd=ImageDraw.Draw(canopy)
    clusters={(x,y):rng.choice([-.12,-.06,0,.06,.12]) for x in range(20) for y in range(24)}
    for y in range(72):
        for x in range(56):
            if not mask.getpixel((x,y)):continue
            edge=any(not(0<=x+dx<56 and 0<=y+dy<72) or not mask.getpixel((x+dx,y+dy)) for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)])
            nx,ny=(x-27)/25,(y-28)/27
            z=math.sqrt(max(0,1-min(.99,nx*nx+ny*ny)))
            light=-.5*nx-.50*ny+.45*z+clusters.get((x//3,y//3),0)
            level=0 if edge else 1 if light<.03 else 2 if light<.26 else 3 if light<.50 else 4 if light<.72 else 5
            cd.point((x,y),fill=pal[level])
    ramp=[tuple(bytes.fromhex(c[1:]))+(255,) for c in pal]
    for _ in range(160):
        x,y=rng.randrange(3,52),rng.randrange(5,55)
        color=canopy.getpixel((x,y))
        if color not in ramp[1:5]:continue
        level=ramp.index(color)
        for dx,dy in [(0,0),(1,0),(2,0),(0,1)]:
            if canopy.getpixel((x+dx,y+dy)) in ramp[1:]:
                cd.point((x+dx,y+dy),fill=pal[min(5,level+1)] if y<34 else pal[max(1,level-1)])
    im.alpha_composite(canopy)
    return im
