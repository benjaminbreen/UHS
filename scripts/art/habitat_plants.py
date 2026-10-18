"""Distinct habitat silhouettes authored directly on native pixel grids."""
from PIL import Image, ImageDraw
from art.nature_trees import branch
from art import canopy
from art.shrubs import shrub_candidate

def bamboo():
    im=Image.new('RGBA',(64,96));d=ImageDraw.Draw(im)
    for x,top,lean in [(23,22,-5),(31,8,1),(38,16,5),(44,34,8)]:
        end=x+lean
        d.line((x,90,end,top),fill='#263c32',width=4)
        d.line((x-1,88,end-1,top+1),fill='#829652',width=2)
        for y in range(top+8,86,11):
            xx=round(x+lean*(90-y)/(90-top));d.line((xx-2,y,xx+1,y),fill='#b3b77b');d.point((xx+1,y+1),fill='#3c5940')
    for bx,by,tx,ty in [(30,20,13,12),(32,28,51,19),(25,36,7,28),(37,43,57,35),(26,52,9,43),(39,61,54,54),(31,19,43,12)]:
        d.line((bx,by,tx,ty),fill='#36553b')
        for j in range(1,5):
            t=j/5;x=round(bx+(tx-bx)*t);y=round(by+(ty-by)*t)
            for side in [-1,1]:
                ex=x+(4 if tx>bx else -4);ey=y+side*7
                d.polygon([(x,y),(ex-2,ey+2),(ex,ey),(ex+1,ey+3)],fill='#254c38')
                d.line((x,y,ex,ey+1),fill='#779b51' if side<0 else '#527d43')
                d.point((ex,ey+1),fill='#a1b46b')
    return im

def teak():
    im=Image.new('RGBA',(88,128));d=ImageDraw.Draw(im)
    branch(d,[(42,122),(44,96),(42,69),(47,36)],8)
    for pts in [[(44,96),(27,72),(18,51)],[(42,77),(64,59),(69,35)],[(43,65),(28,46),(29,23)],[(45,46),(53,27),(48,14)]]:branch(d,pts,4)
    # Large pointed leaf plates form an irregular vertical crown with open gaps.
    clusters=[(45,17),(28,27),(56,29),(19,45),(37,40),(68,41),(52,49),(26,57),(42,62),(65,62),(31,76),(52,75)]
    for i,(x,y) in enumerate(clusters):
        for dx,dy in [(-5,0),(4,2),(0,-5),(0,5)]:
            xx,yy=x+dx+(i%3-1),y+dy
            if (i+dx)%4 == 0: yy+=2
            d.polygon([(xx-7,yy),(xx-5,yy-5),(xx+2,yy-7),(xx+7,yy-2),(xx+5,yy+4),(xx-2,yy+6)],fill='#415f3b')
            d.polygon([(xx-5,yy-1),(xx-3,yy-4),(xx+2,yy-5),(xx+5,yy-2),(xx+2,yy+2),(xx-2,yy+3)],fill='#638548' if i%3 else '#77914d')
            d.line((xx-3,yy-3,xx+1,yy-4),fill='#a1ad66')
            d.line((xx-2,yy+2,xx+2,yy-2),fill='#718d4d')
    return im

def tuft(wet):
    im=Image.new('RGBA',(28,24));d=ImageDraw.Draw(im)
    dark,mid,light=('#304b38','#648454','#a6b57a') if wet else ('#635b3e','#a39760','#d1bd7e')
    for i,(x,y) in enumerate([(3,14),(7,8),(10,4),(15,7),(19,5),(24,11),(22,17),(6,18)]):
        d.line([(14,21),((14+x)//2,min(20,y+5)),(x,y)],fill=dark,width=2)
        d.line([(14,20),((14+x)//2,min(19,y+4)),(x,y)],fill=mid)
        d.point((x,y),fill=light)
        if not wet and i in (1,4):d.line((x-1,y,x+1,y-2),fill=light,width=2)
    return im

def habitat_plants():
    return {'nature-bamboo-clump':bamboo(),'nature-teak':canopy.teak(),'nature-understory-sedge':plant_candidate('sedge',(28,24)),'nature-understory-dry-bunchgrass':shrub_candidate('bunchgrass',(28,24),True)}


def plant_candidate(form, size, voxel=False, *, picked=False):
    import math
    import numpy as np
    from art.voxel import Grid, render
    W,H=size
    im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
    green=['#1c352d','#315a37','#4d7d41','#789f50','#a9bd73']
    wood=['#342b26','#61412f','#8e6642','#be9661']
    bloom=['#827d54','#bcb98b','#e5dfb4','#fff0d2']
    fruit=['#3b263a','#6d3549','#a25261','#d58b86']
    if form=='broom':
        bloom=['#9b6e24','#c59b2d','#e6c44d','#f7df81']
    if form=='reeds':bloom=['#55402d','#8b643a','#b38e52','#d9bc7b']
    g=Grid(0,W,-7,8,H+5)
    normals={}
    palettes=[green,wood,bloom,fruit]
    materials=[g.mat(p) for p in palettes]
    def pos(x,y,depth):return np.array([x,depth,H-3-y-depth*.5])
    def sphere(x,y,rx,ry,depth=0,mat=0):
        if not voxel:
            pal=palettes[mat]
            d.ellipse((round(x-rx),round(y-ry),round(x+rx),round(y+ry)),fill=pal[0])
            d.ellipse((round(x-rx+1),round(y-ry+1),round(x+rx-1),round(y+ry-1)),fill=pal[2])
            d.line((round(x-rx+1),round(y-ry+1),round(x),round(y-ry+1)),fill=pal[-1])
            return
        c=pos(x,y,depth);rz=max(.7,ry);rd=max(.8,rx*.6)
        for xx in range(max(1,math.floor(x-rx)),min(W-1,math.ceil(x+rx)+1)):
            for yy in range(max(-6,math.floor(depth-rd)),min(7,math.ceil(depth+rd)+1)):
                for zz in range(max(0,math.floor(c[2]-rz)),min(H+4,math.ceil(c[2]+rz)+1)):
                    v=(np.array([xx,yy,zz])-c)/np.array([max(.7,rx),rd,rz])
                    if v@v<=1.2:
                        n=v/np.array([max(.7,rx),rd,rz]);n/=np.linalg.norm(n)+1e-6
                        key=tuple(np.round(n*2).astype(int))
                        if key not in normals:normals[key]=g.normal(key) if any(key) else 0
                        normal=normals[key]
                        g.box(xx,xx+1,yy,yy+1,zz,zz+1,materials[mat],normal)
    def stroke(points,mat=0,depth=0,width=1):
        pal=palettes[mat]
        if not voxel:
            d.line(points,fill=pal[0],width=width+1,joint='curve')
            d.line([(x,y-1) for x,y in points],fill=pal[2],width=width)
        else:
            for a,b in zip(points,points[1:]):
                a,b=pos(*a,depth),pos(*b,depth)
                for t in np.linspace(0,1,max(3,round(np.linalg.norm(b-a)*3))):
                    q=a*(1-t)+b*t
                    x,y,z=np.round(q).astype(int)
                    if 1<=x<W-1 and -6<=y<7 and 0<=z<H+4:
                        g.box(x,x+width,y,y+1,z,z+2,materials[mat])
    def leaf(a,b,width=2,depth=0):
        ax,ay=a;bx,by=b;dx,dy=bx-ax,by-ay;length=math.hypot(dx,dy) or 1
        nx,ny=-dy/length*width,dx/length*width
        mx,my=ax+dx*.48,ay+dy*.48
        if not voxel:
            d.polygon([(ax,ay),(mx+nx,my+ny),(bx,by),(mx-nx,my-ny)],fill=green[0])
            d.polygon([(ax,ay),(mx+nx*.7,my+ny*.7),(bx,by),(mx,my)],fill=green[3])
            d.polygon([(ax,ay),(mx,my),(bx,by),(mx-nx*.6,my-ny*.6)],fill=green[2])
            d.line((ax,ay,bx,by),fill=green[1])
        else:
            for t in np.linspace(.1,.9,max(3,round(length))):
                sphere(ax+dx*t,ay+dy*t,max(.85,width*math.sin(t*math.pi)),1.15,depth+t*.7)
    def flower(x,y,depth=0):
        if form=='broom':
            sphere(x,y,1,1,depth,2)
            sphere(x+1,y+1,.8,.6,depth-.6,2)
        else:
            for dx,dy in [(-1,0),(0,-1),(1,0),(0,1)]:sphere(x+dx,y+dy,1.05 if voxel else .8,1.05 if voxel else .8,depth,2)
    if form=='flowers':
        for x,y,bx,by in [(5,12,9,22),(12,5,12,23),(19,10,14,23),(17,18,13,23)]:
            stroke([(bx,by),((bx+x)//2,y+4),(x,y+1)],depth=(x%3-1)*2)
            flower(x,y,(x%3-1)*2)
        for a,b,w in [((10,23),(4,18),2),((12,22),(8,14),1.5),((13,24),(19,21),2),((14,21),(19,15),1.5)]:leaf(a,b,w,-2)
    elif form=='sedge':
        for i,path in enumerate([[(12,21),(10,13),(6,6),(3,5)],[(13,21),(13,11),(14,3)],[(15,21),(18,12),(22,8),(24,9)],[(14,21),(19,17),(25,16)],[(11,21),(7,18),(3,17)],[(14,21),(10,12),(10,4)],[(15,21),(18,10),(19,4)]]):
            stroke(path,depth=i%4-2)
            for a,b in zip(path,path[1:]):leaf(a,b,1.1,i%4-2)
        for a,b in [((12,21),(8,17)),((13,22),(17,16)),((15,21),(21,20))]:leaf(a,b,1.8,-3)
    elif form=='reeds':
        for i,(x,y,lean) in enumerate([(5,12,-1),(10,7,1),(15,9,2),(19,17,1)]):
            stroke([(x-lean,32),(x,20),(x+lean,y)],depth=i-2)
            stroke([(x+lean,y+2),(x+lean,y-3)],2,i-2)
            for j in range(4):sphere(x+lean+(-.7 if j%2 else .7),y-j,1,.6,i-2,2)
        for a,b,w,depth in [((7,30),(2,20),1.3,-2),((9,28),(4,16),1.4,1),((12,31),(18,19),1.5,-2),((16,30),(22,24),1.4,-3),((15,25),(20,12),1.2,2)]:leaf(a,b,w,depth)
    elif form=='broom':
        paths=[[(16,26),(11,18),(5,13),(3,9)],[(16,26),(13,15),(12,7),(9,4)],[(18,26),(18,14),(20,5),(23,3)],[(18,26),(23,19),(28,11),(30,8)],[(17,26),(24,22),(30,20),(31,16)],[(16,25),(10,22),(5,19)],[(17,25),(16,17),(15,11)],[(19,25),(24,15),(25,8)]]
        for i,path in enumerate(paths):
            depth=i%5-2;stroke(path,depth=depth)
            for j,(x,y) in enumerate(path[1:]):
                flower(x+(1 if i%2 else -1),y+1,depth)
                if j<2:leaf((x,y+2),(x+(-3 if i%2 else 3),y),.7,depth)
    if voxel and form!='berry':
        im=Image.fromarray(render(g,W,H,0,H-3,1000000,ambient=.42,sun=.6)[0],'RGBA')
        if form not in ('sedge','broom'):
            alpha=im.getchannel('A');copy=im.copy();pixels=copy.load()
            for y in range(1,H-1):
                for x in range(1,W-1):
                    if alpha.getpixel((x,y)) and not alpha.getpixel((x,y+1)):
                        r,gc,b,a=pixels[x,y]
                        if gc>r*1.1:im.putpixel((x,y),(*canopy.rgb(green[0])[:3],255))
    if form=='flowers':
        d=ImageDraw.Draw(im)
        for x,y in [(5,12),(12,5),(19,10),(17,18)]:d.point((x,y),fill='#d0ad47')
    if form=='berry':
        from art.shrubs import ramp
        from art.voxel_trees import _voxelize, _render
        import random
        pal=ramp('#4d7d41');rng=random.Random(110)
        foliage=[(7,12,4),(13,9,4.5),(17,13,3.5),(13,17,4.5),(7,18,3.5)]
        if voxel:
            caps=[((0,0,0),(-4,1,13),1,.4),((0,0,0),(2,3,17),1,.5),((0,0,0),(6,-1,12),1,.4)]
            clumps=[]
            for i,(x,y,r) in enumerate(foliage):
                depth=(i%3-1)*2
                clumps.append(((x-W/2,depth,H-4-y-depth*.5),r,.75))
                clumps.append(((x-W/2+1,depth-1,H-3-y-depth*.5),r*.65,.8))
            look=dict(leaf=pal,bark=wood,ragged=.65)
            vg,cn=_voxelize(caps,clumps,look,0,110,W,20,H)
            im=_render(vg,cn,look,W,H,H-3)
        else:
            im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
            for pts in [[(10,23),(8,16),(4,12)],[(12,24),(13,14),(11,7)],[(13,23),(18,17),(20,12)]]:
                d.line(pts,fill=wood[0],width=2);d.line([(x-1,y) for x,y in pts],fill=wood[2])
            masses=[(x,y,r,i%3,(i*1.3,i*2.1,.16,.12)) for i,(x,y,r) in enumerate(foliage)]
            for (x,y),tone in canopy.paint_leaves(size,masses,rng,4,tuft=.3,gaps=.15).items():im.putpixel((x,y),canopy.rgb(pal[tone]))
        d=ImageDraw.Draw(im)
        for x,y in ([] if picked else [(5,14),(12,10),(17,16),(10,20),(20,14)]):
            d.rectangle((x,y,x+1,y+1),fill=fruit[0]);d.point((x,y),fill=fruit[2]);d.point((x+1,y),fill=fruit[3])
    return im
