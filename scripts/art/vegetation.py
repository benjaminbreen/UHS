"""Stepped canopy clusters: shared light ramp, species-specific silhouettes."""
from PIL import Image, ImageDraw
import random, math

def palm(name='palm'):
    """Radial fronds over a ringed trunk. Drawn at 1x: no resize, no anti-aliasing."""
    im=Image.new('RGBA',(56,72));d=ImageDraw.Draw(im)
    outline='#153320'
    bark=['#2c2116','#5a412a','#7a5a39','#9c7a4c','#b79a68']
    leaf=['#1d4526','#2a6330','#3d8036','#5ea043','#8cc258']
    fruit=['#8a4d13','#c2820f','#e0a520','#f2c94a']
    cx,cy=28,26
    rng=random.Random(97+sum(map(ord,name)))
    # Trunk: stacked leaf scars, each a bark band closed by a dark seam.
    for i,y in enumerate(range(24,68,4)):
        t=(y-24)/44.0
        half=2+int(t*2.6)
        lean=int(round(math.sin(t*2.1)*1.5))
        x0,x1=cx-half+lean,cx+half+lean
        d.rectangle((x0,y,x1,y+3),fill=bark[1])
        d.rectangle((x0,y,x0+max(0,half-1),y+3),fill=bark[2])
        d.line((x0+1,y+1,x0+1,y+2),fill=bark[3] if i%2 else bark[2])
        d.line((x0,y+3,x1,y+3),fill=bark[0])
        if i%2:d.point((x1-1,y+1),fill=bark[0])
    # Root flare.
    d.polygon([(cx-6,64),(cx+7,64),(cx+9,70),(cx+5,68),(cx+2,70),(cx-2,68),(cx-5,70),(cx-8,70)],fill=bark[1])
    d.line((cx-5,66,cx-7,69),fill=bark[3]);d.line((cx+4,66,cx+6,69),fill=bark[0])

    def frond(ctrl,tip,tone,seed):
        # Quadratic arc from the crown: rises, then falls to the tip. Leaflets are
        # short strokes raked toward the tip, alternating length so the edge serrates.
        r=random.Random(seed)
        steps=26
        pts=[]
        for s in range(steps+1):
            t=s/steps;u=1-t
            pts.append((u*u*cx+2*u*t*ctrl[0]+t*t*tip[0],u*u*cy+2*u*t*ctrl[1]+t*t*tip[1]))
        out=1 if tip[0]>=cx else -1
        for step in range(2,steps):
            x,y=pts[step];px,py=pts[step-1]
            t=step/steps
            dx,dy=x-px,y-py
            n=math.hypot(dx,dy) or 1
            tx,ty=dx/n,dy/n;nx,ny=-ty,tx
            wide=4.4*math.sin(min(1,t*1.25)*math.pi)**0.5
            for side in (-1,1):
                w=wide-(1.7 if step%2 else 0)-(1.0 if r.random()<.3 else 0)
                if w<1:continue
                ex,ey=x+(nx*side+tx*0.75)*w,y+(ny*side+ty*0.75)*w+w*0.25
                lit=tone if side*out<=0 else max(1,tone-1)
                d.line((round(x),round(y),round(ex),round(ey)),fill=leaf[lit])
                d.point((round(ex),round(ey)),fill=leaf[max(0,lit-2)])
        for step in range(steps):
            a,b=pts[step],pts[step+1]
            d.line((round(a[0]),round(a[1]),round(b[0]),round(b[1])),
                   fill=leaf[4] if step<steps*0.6 else leaf[3])

    # ctrl, tip, tone. Upper fronds first; the low side pairs hang over the dates.
    upper=[((28,10),(28,5),4),((23,9),(18,7),4),((33,9),(38,8),3),
           ((19,8),(10,13),3),((37,8),(46,14),3)]
    lower=[((14,13),(4,26),3),((42,13),(52,26),2),((12,19),(7,37),2),((44,19),(49,36),1)]
    for i,(ctrl,tip,tone) in enumerate(upper):frond(ctrl,tip,tone,11+i)
    # Date clusters hang in front of the trunk, behind the drooping outer fronds.
    for bx,by,rows in [(cx-4,31,5),(cx+10,35,4)]:
        for row in range(rows):
            w=rows-abs(row-rows//2)
            for col in range(w):
                x,y=bx-w+col*2+rng.randrange(0,2),by+row*3
                d.rectangle((x,y,x+1,y+1),fill=fruit[1+((col+row)%3)])
        d.line((bx-1,by-3,bx,by),fill=fruit[0])
    for i,(ctrl,tip,tone) in enumerate(lower):frond(ctrl,tip,tone,31+i)

    # One-pixel dark keyline around the finished silhouette.
    alpha=im.getchannel('A');edge=Image.new('RGBA',(56,72));ed=ImageDraw.Draw(edge)
    for y in range(72):
        for x in range(56):
            if alpha.getpixel((x,y)):continue
            if any(0<=x+dx<56 and 0<=y+dy<72 and alpha.getpixel((x+dx,y+dy))>0
                   for dx,dy in [(1,0),(-1,0),(0,1),(0,-1)]):
                ed.point((x,y),fill=outline)
    edge.alpha_composite(im)
    return edge


def broadleaf(name):
    """A full round crown built from lapped leaf clumps, each lit from the
    upper left and dark where it overhangs the one below. Drawn at 1x. The
    crown stays above y=51, where the runtime cuts canopy from trunk."""
    im=Image.new('RGBA',(56,72));d=ImageDraw.Draw(im)
    rng=random.Random(185+sum(map(ord,name)))
    bark=['#2a1e14','#4a3520','#6e4f2c','#94703f']
    d.polygon([(24,40),(32,40),(32,60),(35,65),(40,69),(33,68),(29,66),(25,69),(16,69),(21,65),(24,60)],fill=bark[0])
    d.polygon([(25,40),(31,40),(31,61),(33,66),(28,64),(24,67),(19,68),(23,63),(25,58)],fill=bark[1])
    d.polygon([(25,40),(28,40),(28,60),(25,65),(22,67),(25,60)],fill=bark[2])
    d.line((26,42,26,58),fill=bark[3])
    for y in (47,53,59):d.line((29,y,30,y+2),fill=bark[0])
    d.line((27,46,18,38),fill=bark[1],width=3);d.line((30,45,39,37),fill=bark[0],width=3)
    pal=['#173a26','#23552c','#357434','#4f923d','#72ad48','#9cc95c']
    # Back to front: the last clump to cover a pixel owns it.
    clumps=[(22,10,8,7),(34,11,8,7),(13,18,8,7),(27,17,9,8),(41,18,8,7),
            (8,27,7,7),(20,26,9,8),(34,26,9,8),(47,27,7,7),
            (13,36,9,8),(28,35,10,8),(43,36,9,8),(20,43,9,7),(36,43,9,7)]
    clumps=[(cx+rng.randrange(-1,2),cy+rng.randrange(-1,2),rx,ry) for cx,cy,rx,ry in clumps]
    owner={}
    for n,(cx,cy,rx,ry) in enumerate(clumps):
        for y in range(cy-ry,cy+ry+1):
            for x in range(cx-rx,cx+rx+1):
                nx,ny=(x-cx)/rx,(y-cy)/ry
                # A ragged rim, so the silhouette is leaves and not a ball.
                if nx*nx+ny*ny<=1-.16*((x*7+y*13+n*5)%5==0) and 1<=x<55 and 1<=y<51:
                    owner[(x,y)]=(n,nx,ny)
    level={}
    for (x,y),(n,nx,ny) in owner.items():
        z=math.sqrt(max(0,1-nx*nx-ny*ny))
        # Each clump runs the whole ramp; the crown only leans on it.
        light=-.5*nx-.8*ny+.3*z-.12*(x-28)/28-.15*(y-26)/26
        level[(x,y)]=1 if light<-.22 else 2 if light<.12 else 3 if light<.45 else 4 if light<.78 else 5
    # Leaf dabs, not speckle: a few pixels lighter on the lit side of a
    # clump, darker on its underside.
    for _ in range(420):
        x,y=rng.randrange(2,54),rng.randrange(2,50)
        if (x,y) not in owner:continue
        n,nx,ny=owner[(x,y)]
        step=1 if ny<.1 else -1
        for dx,dy in ((0,0),(1,0),(0,1)) if rng.random()<.6 else ((0,0),(1,0),(2,0),(1,-1)):
            q=(x+dx,y+dy)
            if q in owner and owner[q][0]==n:level[q]=max(1,min(5,level[q]+step))
    for (x,y),(n,nx,ny) in owner.items():
        v=level[(x,y)]
        if any(q not in owner for q in ((x+1,y),(x-1,y),(x,y-1),(x,y+1))):v=0
        else:
            # A clump sinks into shade where the next one laps over it, and
            # the lapping edge catches the light.
            for reach,cap in ((1,1),(2,1),(3,2),(4,2)):
                if owner.get((x,y+reach),(n,))[0]>n:v=min(v,cap);break
            if owner[(x,y-1)][0]<n and nx<.5:v=max(v,4)
        d.point((x,y),fill=pal[v])
    return im


def tree(name):
    if name in ('palm','date-palm'):return palm(name)
    if name in ('oak','hackberry'):return broadleaf(name)
    im=Image.new('RGBA',(56,72));d=ImageDraw.Draw(im)
    # A substantial trunk, roots and bifurcations anchor the canopy.
    d.polygon([(23,38),(31,37),(31,62),(36,67),(29,66),(24,68),(18,68),(22,62)],fill='#3e392a')
    d.polygon([(24,39),(28,39),(27,62),(23,66),(24,57)],fill='#926c3d')
    d.line((24,43,24,61),fill='#ba9454',width=2)
    d.line((25,51,16,39),fill='#785836',width=4);d.line((29,50,38,38),fill='#5c482f',width=3)
    pal=['#17392d','#254e2b','#3e6b2d','#618a32','#8da53c','#bdc65c']
    if name=='olive':pal=['#243b30','#3a5635','#59743c','#7b9148','#9dab57','#c2c57d']
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
