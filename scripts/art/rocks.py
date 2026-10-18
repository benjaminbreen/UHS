"""Original regional rock forms: irregular silhouettes with a lit top plane,
a shaded side, a crack and a contact shadow, in regional stone colours."""
from PIL import Image, ImageDraw

# contact/outline, side, body, top, highlight
SAND = ['#4a3a26', '#8a6e46', '#b8975f', '#d8bb84', '#f0dcae']
RED = ['#3e1f16', '#7a3a26', '#a85536', '#c97a4b', '#e6a877']
BASALT = ['#1a1b1e', '#36393e', '#54585e', '#767b82', '#a3a7ad']
MOSSY = ['#243328', '#4a5e4b', '#6e8168', '#93a082', '#c3c9a3']
SLAB = ['#2c3236', '#555e63', '#7f8a8f', '#a5b0b3', '#d3dad9']
LICHEN = ['#2e3430', '#5a6358', '#828c7e', '#a9b09a', '#d5d8bb']

# Silhouette, top plane and crack for three authored forms, in a 22x18 box.
FORMS = {
    'rounded': {
        'outline': [(2, 9), (4, 4), (9, 1), (15, 1), (20, 4), (21, 10), (19, 15), (13, 17), (5, 17), (2, 14)],
        'top': [(4, 8), (6, 4), (10, 2), (15, 2), (19, 5), (18, 9), (13, 11), (6, 11)],
        'crack': [(12, 11), (11, 14), (13, 16)],
    },
    'angular': {
        'outline': [(1, 8), (6, 2), (12, 1), (18, 3), (21, 8), (20, 14), (15, 17), (7, 17), (2, 13)],
        'top': [(3, 8), (7, 3), (12, 2), (17, 4), (19, 8), (14, 10), (7, 10)],
        'crack': [(14, 10), (16, 13), (15, 16)],
    },
    'flat': {
        'outline': [(0, 10), (4, 6), (10, 5), (18, 5), (22, 8), (21, 13), (16, 16), (6, 16), (1, 14)],
        'top': [(2, 10), (5, 7), (10, 6), (18, 6), (20, 9), (16, 11), (6, 11)],
        'crack': [(9, 11), (8, 14)],
    },
}


def canvas(w, h):
    im = Image.new('RGBA', (w, h))
    return im, ImageDraw.Draw(im)


def stone(d, ox, oy, form, pal, scale=1.0):
    f = FORMS[form]
    pt = lambda pts: [(ox + round(x * scale), oy + round(y * scale)) for x, y in pts]
    outline = pt(f['outline'])
    d.polygon(outline, fill=pal[0])
    inner = [(x + (1 if x < ox + 11 * scale else -1), y + (1 if y < oy + 9 * scale else -1)) for x, y in outline]
    d.polygon(inner, fill=pal[1])
    # Body: the outline inset from the right and bottom, the lit side kept.
    body = [(x, y) for x, y in inner]
    d.polygon([(x - (1 if x > ox + 11 * scale else 0), y - (1 if y > oy + 9 * scale else 0)) for x, y in body], fill=pal[2])
    d.polygon(pt(f['top']), fill=pal[3])
    top = pt(f['top'])
    d.line(top[1:4], fill=pal[4], width=1)
    d.line(pt(f['crack']), fill=pal[1])
    d.point(pt(f['crack'])[0], fill=pal[0])
    # Contact shadow along the base.
    base = [p for p in outline if p[1] >= oy + 14 * scale]
    if len(base) >= 2:
        d.line([min(base), max(base)], fill=pal[0], width=1)


def sheet(pal, kind, forms):
    out = {}
    layouts = [
        [(1, 6, forms[0], 0.95), (14, 11, forms[1], 0.7)],
        [(5, 4, forms[0], 1.1)],
        [(2, 10, forms[2], 0.7), (11, 5, forms[1], 0.85)],
    ]
    for variant, pieces in enumerate(layouts):
        im, d = canvas(32, 28)
        for ox, oy, form, scale in pieces:
            stone(d, ox, oy, form, pal, scale)
        if kind == 'mossy':
            for x, y in [(8, 10), (13, 8), (19, 13)]:
                d.rectangle((x, y, x + 2, y + 1), fill='#5d8a45'); d.point((x + 1, y), fill='#86ad55')
        if kind == 'lichen':
            for x, y in [(9, 9), (15, 7), (20, 12)]:
                d.point((x, y), fill='#c8b45a'); d.point((x + 1, y + 1), fill='#b09a3f')
        out[f'nature-rock-{kind}-{variant}'] = im
    return out


def rocks():
    return {
        **sheet(SAND, 'dune', ['flat', 'angular', 'flat']),
        **sheet(RED, 'red', ['rounded', 'rounded', 'flat']),
        **sheet(BASALT, 'basalt', ['angular', 'angular', 'rounded']),
        **sheet(MOSSY, 'mossy', ['rounded', 'rounded', 'flat']),
        **sheet(SLAB, 'slab', ['angular', 'flat', 'angular']),
        **sheet(LICHEN, 'lichen', ['rounded', 'angular', 'flat']),
        **rock_additions(),
    }


def rock_additions():
    return {f'nature-rock-{kind}-b':rock_candidate(form,(32,28))
            for kind,form in [('grey','grey'),('dune','sand'),('red','red'),('basalt','basalt'),('slab','slab'),('mossy','moss'),('lichen','lichen')]}


def stone_volume(grid, vertices, material):
    import itertools
    import numpy as np
    vertices=np.array(vertices,float)
    planes={}
    for a,b,c in itertools.combinations(vertices,3):
        n=np.cross(b-a,c-a);length=np.linalg.norm(n)
        if length<1e-5:continue
        n/=length;distance=vertices@n-a@n
        if max(distance)>1e-4 and min(distance)<-1e-4:continue
        if max(distance)>1e-4:n=-n
        planes[tuple(np.round(np.r_[n,a@n],4))]=(n,a@n)
    normals=np.array([p[0] for p in planes.values()]);offsets=np.array([p[1] for p in planes.values()])
    lo=np.maximum(np.floor(vertices.min(0)).astype(int),[grid.x0,grid.y0,0])
    hi=np.minimum(np.ceil(vertices.max(0)).astype(int),np.array(grid.m.shape)+[grid.x0,grid.y0,0]-1)
    coords=np.stack(np.meshgrid(*(np.arange(lo[i],hi[i]+1) for i in range(3)),indexing='ij'),-1)
    distances=coords@normals.T-offsets
    inside=(distances<=.25).all(-1)
    near=np.argmax(distances,axis=-1)
    if not hasattr(grid,'stone_normals'):grid.stone_normals={}
    ids=[]
    for n in normals:
        key=tuple(np.round(n*2).astype(int))
        if key not in grid.stone_normals:grid.stone_normals[key]=grid.normal(key)
        ids.append(grid.stone_normals[key])
    for q,n in zip(coords[inside],np.array(ids)[near[inside]]):
        x,y,z=q-[grid.x0,grid.y0,0]
        grid.m[x,y,z]=material;grid.n[x,y,z]=n


def rock_candidate(form,size,voxel=False):
    import math
    import numpy as np
    from art.voxel import Grid,render,h3
    if form=='lichen':
        im=rock_candidate('grey',size,voxel)
        grey=['#293c39','#465b55','#74867a','#a6b19b','#d2d3b4']
        colors={tuple(int(c[i:i+2],16) for i in (1,3,5)):LICHEN[j] for j,c in enumerate(grey)}
        for y in range(im.height):
            for x in range(im.width):
                c=im.getpixel((x,y))
                if c[3] and c[:3] in colors:ImageDraw.Draw(im).point((x,y),fill=colors[c[:3]])
        d=ImageDraw.Draw(im)
        for x,y in [(8,12),(13,9),(16,16),(24,21)]:
            d.line((x,y,x+2,y),fill='#ae9c53');d.point((x,y-1),fill='#d0c27b')
        return im
    palette={'grey':['#293c39','#465b55','#74867a','#a6b19b','#d2d3b4'],
             'sand':SAND,'red':RED,'basalt':BASALT,'slab':SLAB,'moss':MOSSY,
             'boulder-basalt':BASALT,'boulder-slab':SLAB}[form]
    im,d=canvas(*size)
    designs={
        'grey': [([(4,20),(5,12),(11,7),(18,8),(22,15),(19,23),(10,25)],1),
                 ([(5,12),(11,7),(18,8),(16,14),(10,17),(5,16)],3),
                 ([(10,17),(16,14),(21,15),(18,22),(11,24)],2),
                 ([(21,22),(23,18),(27,19),(29,24),(24,25)],2),
                 ([(23,19),(27,19),(28,21),(24,22)],3)],
        'sand': [([(3,21),(4,16),(12,13),(24,14),(28,18),(26,24),(8,25)],1),
                 ([(4,16),(12,13),(24,14),(27,17),(19,19),(6,20)],3),
                 ([(7,15),(8,10),(16,7),(24,10),(23,15),(16,17)],2),
                 ([(8,10),(16,7),(24,10),(19,12),(12,13)],3)],
        'red': [([(4,23),(3,15),(8,7),(18,9),(22,18),(17,25)],1),
                ([(4,15),(8,7),(14,10),(11,17),(6,20)],3),
                ([(14,10),(18,9),(21,17),(16,21),(11,17)],2),
                ([(22,21),(24,15),(28,18),(29,24),(25,25)],1),
                ([(24,16),(28,18),(26,21),(23,22)],3)],
        'basalt': [([(4,22),(5,13),(10,6),(19,8),(22,15),(20,24),(10,25)],1),
                   ([(5,13),(10,6),(19,8),(15,12),(8,17)],3),
                   ([(8,17),(15,12),(20,14),(19,22),(12,24)],2),
                   ([(22,20),(26,16),(29,20),(28,25),(22,25)],1),
                   ([(23,20),(26,16),(28,20),(25,22)],3)],
        'slab': [([(3,24),(3,21),(13,17),(27,18),(29,22),(23,25),(9,26)],1),
                 ([(3,21),(13,17),(27,18),(23,21),(10,23)],3),
                 ([(6,18),(6,15),(17,10),(27,12),(26,17),(16,20)],1),
                 ([(6,15),(17,10),(27,12),(18,15),(10,18)],3),
                 ([(9,12),(11,8),(20,6),(25,9),(20,12),(13,14)],2),
                 ([(11,8),(20,6),(25,9),(18,10)],4)],
        'moss': [([(3,20),(4,13),(9,8),(17,8),(22,14),(21,22),(14,25),(6,24)],1),
                 ([(4,13),(9,8),(17,8),(20,13),(14,17),(6,18)],3),
                 ([(6,18),(14,17),(20,13),(20,21),(14,24),(6,23)],2),
                 ([(23,23),(24,18),(28,18),(30,23),(27,25)],2),
                 ([(24,18),(28,18),(29,21),(25,22)],3)],
        'boulder-basalt': [([(4,22),(3,15),(8,7),(17,3),(26,7),(31,13),(31,23),(24,26),(12,26)],1),
                           ([(4,15),(8,7),(17,3),(25,7),(22,13),(13,15)],3),
                           ([(4,16),(13,15),(18,23),(12,25),(5,21)],2),
                           ([(13,15),(22,13),(30,14),(24,20),(18,23)],2),
                           ([(24,20),(30,14),(30,23),(24,25),(18,23)],1)],
        'boulder-slab': [([(4,24),(7,16),(12,6),(24,3),(30,9),(31,18),(27,25),(17,26)],1),
                         ([(8,17),(12,6),(24,3),(29,9),(24,17),(15,20),(7,23)],3),
                         ([(15,20),(24,17),(29,9),(30,18),(26,24),(17,25)],2),
                         ([(4,24),(8,18),(15,20),(17,25),(11,26)],2)]}
    if not voxel:
        for points,tone in designs[form]:
            d.polygon(points,fill=palette[tone]);d.line(points+[points[0]],fill=palette[0])
        if form=='sand':
            for pts in [[(5,19),(12,18),(19,18)],[(8,22),(15,21),(24,21)],[(10,14),(16,13),(22,12)]]:d.line(pts,fill=palette[1])
        cracks={'grey':[(15,9),(14,13),(17,16),(16,19)],'red':[(14,10),(12,15),(14,20)],
                'basalt':[(15,12),(14,18),(16,23)],'slab':[(19,11),(17,13),(17,16)],
                'moss':[(16,12),(15,17),(17,20)],'boulder-basalt':[(17,4),(15,10),(17,14),(16,19)],
                'boulder-slab':[(22,6),(19,11),(20,14),(17,20)]}
        if form in cracks:d.line(cracks[form],fill=palette[0])
        for pts,tone in designs[form][1:]:
            if tone>=3:d.line(pts[:2],fill=palette[4])
        if form=='moss':
            for pts in [[(5,14),(7,11),(11,10),(13,12),(10,13),(10,16),(7,17)],[(15,9),(17,9),(19,12),(17,15),(15,14)],[(24,19),(27,19),(28,21),(25,21)]]:
                d.polygon(pts,fill='#446345');d.line(pts[:3],fill='#8caa58')
        return im
    W,H=size;g=Grid(0,W,-9,15,H+6)
    def strata(s):return np.where((s['z']%3==0)&(s['n'][:,2]<.8),-.8,0)
    mat=g.mat(palette,gain=.95,bias=-.1,tex=strata if form=='sand' else None)
    moss=g.mat(['#203a2a','#355c32','#517b3d','#7b9e4c','#a9ba68'],gain=.85)
    profiles={
        'grey':[(12,3,8,5,10,0,2),(25,0,4,3,4,0,7)],
        'sand':[(15,3,12,5,3,0,3),(12,4,9,4,3,3,8),(14,5,6,3,3,6,5)],
        'red':[(11,3,8,5,12,0,11),(25,0,4,3,7,0,12)],
        'basalt':[(12,3,8,5,13,0,21),(24,0,5,3,6,0,24)],
        'slab':[(15,2,12,5,2,0,31),(14,4,10,4,2,3,34),(16,5,8,3,2,6,37)],
        'moss':[(12,3,9,6,11,0,41),(26,1,4,3,4,0,43)],
        'boulder-basalt':[(17,4,13,6,18,0,51)],
        'boulder-slab':[(18,4,12,6,18,0,62),(10,0,5,3,5,0,65)]}
    for cx,cy,rx,ry,height,z0,seed in profiles[form]:
        rng=np.random.default_rng(seed);angles=np.arange(7)*math.tau/7
        footprint=[(cx+math.cos(a)*rx*rng.uniform(.85,1),cy+math.sin(a)*ry*rng.uniform(.8,1)) for a in angles]
        vertices=[(x,y,z0) for x,y in footprint]
        heights={'grey':[.4,.62,.8,1,.7,.6,.3],'red':[.3,.55,.9,1,.75,.4,.15],
                 'moss':[.35,.6,.85,1,.8,.5,.35],
                 'boulder-basalt':[.6,.7,.9,1,.8,.75,.5],
                 'boulder-slab':[.45,.6,.95,1,.65,.4,.25]}.get(form,[.8,.9,.95,1,.85,.8,.75])
        for i,(x,y) in enumerate(footprint):
            inset=rng.uniform(.8,.96) if form in ('sand','slab') else rng.uniform(.65,.9)
            vertices.append((cx+(x-cx)*inset+rng.uniform(-1,1),cy+(y-cy)*inset,z0+height*heights[i]))
        stone_volume(g,vertices,mat)
    if form=='moss':
        X,Y,Z=np.meshgrid(np.arange(W),np.arange(-9,15),np.arange(H+6),indexing='ij')
        patch=(h3(X//3,Y//3,Z//2,82)>.59)&(Z>4)&(g.m>0)
        g.m[patch]=moss
    rgba,buf=render(g,W,H,0,H-3,1000000,ambient=.48,sun=.62)
    im=Image.fromarray(rgba,'RGBA');alpha=rgba[:,:,3]>0
    for y in range(1,H-1):
        for x in range(1,W-1):
            if not alpha[y,x] and (alpha[y-1,x] or alpha[y,x-1]):im.putpixel((x,y),tuple(int(palette[0][i:i+2],16) for i in (1,3,5))+(255,))
    return im
