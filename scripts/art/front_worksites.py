"""Working buildings, sharing the front-on kit's materials and adult scale."""
from pathlib import Path
import json
import math
import sys
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from art.front_materials import C, RAMPS, ramp
from art.front_eave import EaveHouse
from art.front_civic import CivicHall
from art.front_kit import consolidate
from art.front_house import bevel
from art import front_persian as persia
from art import front_sinitic as sino
from art.front_review import sheet

OAK, STONE = RAMPS['oak'], RAMPS['granite']
IRON = ramp(270, .025, lift=-.12)


def wheel(im, cx, cy, radius=28):
    d = ImageDraw.Draw(im)
    for rr, col in ((radius + 2, OAK[6]), (radius, OAK[2]), (radius - 4, OAK[5])):
        d.ellipse((cx-rr, cy-rr, cx+rr, cy+rr), outline=col, width=2)
    for k in range(12):
        a = k * math.tau / 12
        x, y = round(cx + math.cos(a)*radius), round(cy + math.sin(a)*radius)
        ix, iy = round(cx + math.cos(a)*6), round(cy + math.sin(a)*6)
        d.line((ix, iy, x, y), fill=OAK[5], width=4)
        d.line((ix-1, iy-1, x-1, y-1), fill=OAK[2], width=1)
        dx, dy = round(-math.sin(a)*5), round(math.cos(a)*5)
        d.line((x-dx, y-dy, x+dx, y+dy), fill=OAK[1 if k>6 else 3], width=6)
        d.line((x-dx+2, y-dy+2, x+dx+2, y+dy+2), fill=OAK[6], width=2)
    d.rectangle((cx+5,cy-3,cx+14,cy+3),fill=IRON[4])
    d.ellipse((cx-5,cy-5,cx+5,cy+5), fill=IRON[4], outline=IRON[1], width=2)


def millstones(c, cx, base):
    d = ImageDraw.Draw(c.im)
    r = RAMPS['granite']
    d.ellipse((cx-16,base-9,cx+16,base+1), fill=r[5], outline=r[3])
    d.polygon([(cx-12,base-10),(cx-8,base-27),(cx-11,base-44),(cx+11,base-44),
               (cx+8,base-27),(cx+12,base-10)], fill=r[3])
    d.ellipse((cx-11,base-48,cx+11,base-40), fill=r[1], outline=r[4], width=2)
    d.ellipse((cx-6,base-46,cx+6,base-42), fill=r[6])
    c.rect(cx-22, base-31, 44, 4, OAK[4])
    c.rect(cx-22, base-31, 44, 1, OAK[1])


def adit(style, info):
    W, base = 176, 148
    c = C(W+28, base+5)
    earth = ramp(62 if style == 'andean-adit' else 85, .045, lift=-.1)
    ImageDraw.Draw(c.im).polygon([(8,base),(8,74),(28,52),(47,48),(65,36),(90,40),(113,31),(142,44),(188,76),(188,base)], earth[4])
    ImageDraw.Draw(c.im).polygon([(8,74),(28,52),(47,48),(65,36),(90,40),(113,31),(142,44),(188,76),(165,70),(132,54),(99,56),(60,53),(28,67)], earth[2])
    texture = C(W+28,base+5)
    from art.front_materials import rubble
    rubble(texture,0,25,W+28,base-25,earth)
    for y in range(32,base):
        for x in range(W+28):
            if c.g(x,y)[3]:
                q = texture.g(x,y)
                c.p(x,y,q if y>62 else earth[2 if y<46 else 3])
    wall = RAMPS['plaster-ochre'] if style == 'andean-adit' else STONE
    from art.front_materials import rubble, kahgel
    if style == 'andean-adit': kahgel(c, 42, 76, 112, 72, wall)
    else: rubble(c, 42, 76, 112, 72, wall)
    d = ImageDraw.Draw(c.im)
    d.rounded_rectangle((67,83,128,base), radius=25, fill=wall[1])
    d.rectangle((67,110,128,base), fill=wall[1])
    d.rounded_rectangle((75,92,120,base+2), radius=20, fill=IRON[7])
    d.rectangle((75,113,120,base+2), fill=IRON[7])
    for x in (75,114): bevel(c,x,109,6,39,OAK,4)
    bevel(c,73,105,49,7,OAK,4)
    c.rect(82,base-4,30,2,IRON[3])
    c.rect(86,122,3,22,IRON[4]); c.rect(107,122,3,22,IRON[4])
    for y in (130,137,144): c.rect(83,y,31,2,OAK[4])
    for x,y,w in ((23,135,16),(146,138,20),(157,124,13)):
        ImageDraw.Draw(c.im).polygon([(x,y),(x+4,y-6),(x+w-4,y-8),(x+w,y)], STONE[3])
        ImageDraw.Draw(c.im).line((x+4,y-6,x+w-4,y-8),fill=STONE[1])
    for x,y,w in ((18,127,15),(153,107,19),(29,117,13)):
        bevel(c,x,y,w,8,STONE,4)
    info.update(x0=14,W=W,base=base,door_x=98,door_h=50,door_width=44)
    consolidate(c, rare=6)
    return c.im


def courtyard(style, info):
    if style == 'japanese-infirmary':
        house = dict(tone='tile',posts='dark',wall='white',lattice='grid',curve=0,ridge='oni',
                     bays=5,door_h=44)
        return sino.courtyard(dict(W=256,wing=42,court=62,floor='gravel',trees=0,vats=0,
                                   front=house,main={**house,'bays':7}), info)
    if style == 'bimaristan':
        spec = dict(W=256,wing=42,street=62,front=20,court=76,far=28,face=44,portal=.5)
        def roof(c,g):
            for x in (g['L']+9,g['R']-31):
                c.rect(x,g['B']-6,22,5,persia.WALL[1])
        def door(c,cx,base,g):
            persia.portal(c,cx,base,84,w=60,rw=38)
            persia.op.door_studded(c,cx-11,base-44,22,44,wood=persia.WOOD,studs=STONE)
        def face(c,L,R,top,h):
            persia.wall(c,L,top,R-L,h)
            for cx in (L+24,(L+R)//2,R-24):
                persia.vault(c,cx,top+h-20,28,top+h)
                persia.tile_frame(c,cx,top+h-20,28,top+h)
            persia.so.box(c,L,top+h+4,R-L,3,8,persia.TOP)
        im = persia.compound(spec,info,roof=roof,door=door,face=face,trees=False)
        info['door_h'] = 44
        return im
    # A patio is made of roofed ranges, not a solid roof painted with a hole.
    back = CivicHall(dict(W=256,storeys=['rubble' if style=='sri-lankan-infirmary' else 'ochre'],heights=[60],roof='pantile',arcade=True,
                          stacks=False,seed=61,wear=.3))
    bim = back.build()
    front = EaveHouse(dict(W=256,storeys=['rubble' if style=='sri-lankan-infirmary' else 'whitewash'],heights=[56],roof='pantile',
                           stacks=False,door='arched',seed=64,wear=.25))
    fim = front.build()
    offset = 95
    c = C(max(bim.width,fim.width),fim.height+offset)
    c.im.alpha_composite(bim,(0,0)); c.px=c.im.load()
    from art.front_materials import ashlar
    ashlar(c,front.x0,back.base,256,offset, RAMPS['sandstone'],8,16)
    for x in (front.x0,front.x0+218):
        c.rect(x,back.base-22,38,offset+24,RAMPS['plaster-ochre'][2])
        c.rect(x,back.base-24,38,4,RAMPS['terracotta'][3])
    c.im.alpha_composite(fim,(0,offset)); c.px=c.im.load()
    info.update(x0=front.x0,W=256,base=front.base+offset,door_x=front.door_x,door_h=front.door_h)
    consolidate(c,rare=6)
    return c.im


class ModernWard(EaveHouse):
    def roof(self):
        c, x, y, W = self.c, self.x0-5, self.eave, self.W+10
        r = RAMPS['limestone']
        self.top = y-34
        for k in range(4): c.rect(x, y-34+k*7, W, 7, r[1+k//2])
        c.rect(x,y-7,W,7,r[4]); c.rect(x,y-8,W,2,r[0])
        c.rect(x+2,y-33,W-4,3,r[0]); c.rect(x+3,y-30,W-6,2,r[3])
        bevel(c,x+W-46,y-39,24,9,r,3)
        for xx in range(x+W-42,x+W-24,4): c.rect(xx,y-37,2,4,IRON[4])
        self.roof_px = {(xx,yy) for yy in range(y-34,y) for xx in range(x,x+W)}
        self.over = 5


def windmill(info):
    b = EaveHouse(dict(W=88,storeys=['boards'],heights=[62],roof='shingle',
                       stacks=False,windows=('timber','leaded'),seed=21,wear=.35))
    im = b.build()
    c = C(im.width+100,im.height+110)
    c.im.alpha_composite(im,(50,46)); c.px=c.im.load()
    post = b.x0+94
    ground = b.base+110
    bevel(c,post-8,b.base+43,16,67,OAK,4)
    d = ImageDraw.Draw(c.im)
    for side in (-1,1):
        d.line((post,ground-50,post+side*45,ground-4),fill=OAK[5],width=8)
        d.line((post-1,ground-50,post+side*45-1,ground-5),fill=OAK[2],width=2)
    bevel(c,post-49,ground-6,98,6,OAK,4)
    dx = b.door_x+50
    d.line((dx-10,b.base+47,dx+35,ground),fill=OAK[4],width=4)
    d.line((dx+10,b.base+47,dx+55,ground),fill=OAK[4],width=4)
    for k in range(9):
        y = b.base+50+k*7; x = dx-8+k*5
        d.line((x,y,x+18,y),fill=OAK[1],width=3)
    cx,cy = post,b.base+7
    d = ImageDraw.Draw(c.im)
    for k in range(4):
        a = math.pi/4+k*math.pi/2
        ux,uy = math.cos(a),math.sin(a)
        nx,ny = -uy,ux
        pts = [(round(cx+ux*t+nx*n),round(cy+uy*t+ny*n)) for t,n in ((18,-5),(96,-5),(96,10),(18,10))]
        d.polygon(pts,fill=RAMPS['limestone'][1])
        d.line((cx,cy,round(cx+ux*100),round(cy+uy*100)),fill=OAK[4],width=4)
        for t in range(22,98,9):
            d.line((round(cx+ux*t-nx*5),round(cy+uy*t-ny*5),round(cx+ux*t+nx*10),round(cy+uy*t+ny*10)),fill=OAK[3],width=1)
    d.ellipse((cx-7,cy-7,cx+7,cy+7),fill=OAK[4],outline=OAK[1],width=2)
    info.update(x0=b.x0+50,W=b.W,base=ground,door_x=dx+45,door_h=b.door_h,doorless=True)
    consolidate(c,rare=6)
    return c.im


def curved_masonry(r, radius, course=8, block=16):
    from art.front_materials import h2
    mortar = RAMPS['mortar']
    def surface(x, y, z, q):
        u = math.atan2(x, -y)*radius
        row = math.floor(z/course)
        col = math.floor((u+(row%2)*block/2)/block)
        edge = (u+(row%2)*block/2)%block
        dz = z%course
        if dz < .65 or edge < .7: return mortar[min(6,q)]
        variation = -1 if h2(col,row,72)<.18 else 1 if h2(col,row,72)>.84 else 0
        bevel = -1 if dz>course-1.4 else 1 if dz<1.5 or edge>block-1.2 else 0
        return r[max(1,min(7,q+variation+bevel))]
    return surface


def earthen_surface(r):
    from art.front_materials import h2
    def surface(x,y,z,q):
        patch=h2(math.floor(x/7),math.floor(z/6),47)
        q=max(1,min(7,q+(1 if patch<.13 else -1 if patch>.92 else 0)))
        if z>68:q=min(7,q+1)
        return r[q]
    return surface


def kiln(c, cx, by, kind='lime'):
    from art import front_solid as so
    from art.front_materials import h2
    lime = kind == 'lime'
    r = RAMPS['limestone'] if lime else RAMPS['kahgel'] if kind=='earthen' else RAMPS['roman-brick']
    R, H = (48,84) if lime else (47,83)
    profile = [(0,R+2),(5,R+2),(9,R),(H-8,R-3),(H,R-5)] if lime else [
        (0,R),(8,R),(36,R),(50,R-3),(65,R-11),(78,R-25),(83,13)]
    so.lathe(c,cx,by,profile,r,hollow=(30,H-28) if lime else (8,H-16),
             surface=earthen_surface(r) if kind=='earthen' else curved_masonry(r,R,8,17),inside=IRON)
    if lime:
        so.lathe(c,cx,by,[(H-5,44),(H-2,48),(H+2,48),(H+3,43)],RAMPS['sandstone'],hollow=(30,H-22),inside=IRON)
    else:
        so.lathe(c,cx,by,[(H-2,14),(H+10,14),(H+11,15)],r,hollow=(8,H-12),inside=IRON,
                 surface=curved_masonry(r,14,5,10))
    # A radial arch lives on the front of the cylinder; its foot follows the curved wall.
    d = ImageDraw.Draw(c.im)
    spring, Rmouth = by-7, 15 if lime else 13
    for yy in range(by-43,by+21):
        for xx in range(cx-24,cx+25):
            dx=xx-cx
            edge_y=by+round(.5*math.sqrt(max(0,R*R-dx*dx)))
            dy=yy-spring
            outer=abs(dx)<=Rmouth+7 and yy<=edge_y and (dy>=0 or dx*dx+dy*dy<=(Rmouth+7)**2)
            inner=abs(dx)<Rmouth and yy<=edge_y-2 and (dy>=0 or dx*dx+dy*dy<Rmouth**2)
            if outer:
                if inner:
                    q=5 if xx<cx-Rmouth+4 else 6 if yy<spring-Rmouth+5 else 7
                    c.p(xx,yy,IRON[q])
                else:
                    angle=math.atan2(spring-yy,dx)
                    joint=dy<0 and abs((angle/math.pi*9)%1)<.12
                    c.p(xx,yy,r[5 if joint else 1 if dx<0 else 3])
    # Soot stays on the firemouth, with clean mortar and coping elsewhere.
    for yy in range(spring-20,spring+4):
        span=4+round((yy-(spring-20))*.6)
        for xx in range(cx-span,cx+span):
            q=c.g(xx,yy)
            if q[3] and q not in IRON and h2(xx//3,yy//3,31)<.55:
                c.p(xx,yy,r[5 if xx<cx else 6])
    so.box(c,cx-18,by+24,36,2,8,RAMPS['sandstone'])


def fulling_court(c,L,R,top,bottom):
    from art import front_solid as so, front_props as props
    from art.front_materials import h2
    from art.front_roman import SIGNINUM, shade_rect
    r=RAMPS['travertine']
    water=ramp(195,.035,lift=-.14)
    for yy in range(top,bottom):
        for xx in range(L,R):
            joint=yy%9==0 and (xx-L)%21<9
            c.p(xx,yy,SIGNINUM[4 if joint else 3])
    # Three communicating rinse tanks at the rear, with a working aisle in front.
    tank=(R-L-20)//3
    for i in range(3):
        x=L+5+i*(tank+4)
        so.box(c,x,top+37,tank,10,48,r)
        so.recess(c,x+5,top+24,tank-10,31,7,r,r,water)
        bevel(c,x,top+25,tank,4,r,3)
        c.rect(x+2,top+25,tank-4,1,r[1])
        for px in (x,x+tank-5): bevel(c,px,top+4,5,23,r,3)
        c.rect(x+tank-7,top+12,4,3,r[5])
    # Treading stalls are individual recesses, not drawers stacked on a facade.
    for i in range(3):
        y=top+54+i*17
        so.box(c,L+5,y,31,5,28,r)
        so.recess(c,L+9,y-5,23,18,4,r,SIGNINUM,water)
    # Screwless wedge press: two uprights, framed top, cloth pack on the bed.
    x=R-53; y=bottom-8
    so.box(c,x,y,45,9,28,OAK)
    for px in (x,x+38):
        bevel(c,px,y-51,7,51,OAK,4)
        c.rect(px+1,y-15,5,3,IRON[4])
    bevel(c,x-3,y-56,51,8,OAK,4)
    so.box(c,x+9,y-12,27,10,22,RAMPS['linen'] if 'linen' in RAMPS else r)
    bevel(c,x+7,y-30,31,8,OAK,4)
    for i in range(3):
        c.rect(x+9+i*6,y-38+i*2,6,10-i*2,OAK[2+i])
    # Narrow drain cut in the waterproof floor; no ornamental household pool.
    for yy in range(top+37,bottom-3):
        c.rect(L+43,yy,3,1,SIGNINUM[6])
        c.p(L+46,yy,SIGNINUM[2])
    shade_rect(c,L,top,R-L,4,.28)


class ProductionShed(EaveHouse):
    def openings(self):
        from art import front_openings as op, front_goods as goods
        from art.front_house import brace
        c,x,b = self.c,self.x0,self.base
        self.door_x=x+30;self.door_h=44;self.sills=[]
        bevel(c,x+12,b-50,36,6,OAK,4)
        op.door_plank(c,x+19,b-44,22,44)
        op.cast(c,x+17,b-44,28,2,.5)
        bx=x+67;bw=self.W-80
        op.shopfront_open(c,bx,b-49,bw,45)
        stock={'lime':'sacks','cloth':None,'leather':None,'brick':None}.get(self.s.get('production'),'pots:jug')
        goods.bay(c,bx,b-49,bw,45,dict(back='shelves',shelf=stock))
        if self.s.get('production')=='brick':
            from art import front_solid as so
            for yy in (b-16,b-31):
                for xx in range(bx+5,bx+bw-10,14):
                    so.box(c,xx,yy,11,5,7,ramp(65,.055,lift=-.12))
        if self.s.get('production') in ('cloth','leather'):
            from art import front_solid as so
            leather=self.s['production']=='leather'
            r=ramp(55,.065,lift=-.12) if leather else RAMPS['limestone']
            for row,yy in enumerate((b-16,b-31)):
                for k in range(3):
                    xx=bx+5+k*24
                    so.box(c,xx,yy,19-k%2,6,10,r)
                    c.rect(xx+2,yy-3,15,1,r[4])
                    if leather:c.rect(xx+15,yy-2,5,3,r[3])
        bevel(c,bx-4,b-53,bw+8,6,OAK,4)
        for px in (bx-4,bx+bw): bevel(c,px,b-49,4,49,OAK,4)
        brace(c,bx,b-34,bx+12,b-47,OAK,4)
        brace(c,bx+bw-12,b-47,bx+bw,b-34,OAK,4)


from art.front_roman import DomusFront, AtriumRange
class FulleryFront(DomusFront):
    def openings(self):
        from art import front_openings as op, front_goods as goods
        from art import front_solid as so
        c,x,b,W=self.c,self.x0,self.base,self.W
        cx=x+W//2;self.door_x=cx;self.door_h=48;self.sills=[]
        bevel(c,cx-19,b-54,38,7,OAK,4)
        op.door_plank(c,cx-12,b-48,24,48)
        for px in (cx-18,cx+14): bevel(c,px,b-48,4,48,OAK,4)
        cloth=RAMPS['limestone']
        for bx in (x+16,x+W-104):
            op.shopfront_open(c,bx,b-52,88,47)
            for yy in (b-20,b-38):
                goods.shelf(c,bx+4,b-3,80,b-3-yy,r=OAK,d=10)
                for i in range(6):
                    so.lathe(c,bx+11+i*12,yy,[(0,4),(8,4),(9,3)],cloth,z0=0)
            bevel(c,bx-3,b-57,94,6,OAK,4)
            for px in (bx-3,bx+88): bevel(c,px,b-51,4,51,OAK,4)


class FulleryRange(AtriumRange):
    def openings(self):
        from art import front_openings as op
        from art import front_solid as so
        c,x,b,W=self.c,self.x0,self.base,self.W
        self.door_x=x+W//2;self.door_h=44;self.sills=[]
        for cx in (x+24,x+W//2,x+W-24):
            op.shopfront_open(c,cx-15,b-44,30,42)
            bevel(c,cx-19,b-48,38,5,OAK,4)
            for px in (cx-19,cx+15): bevel(c,px,b-43,4,43,OAK,4)
            so.box(c,cx-17,b+2,34,3,7,RAMPS['travertine'])
        c.rect(x,b+4,W,2,RAMPS['travertine'][5])


def roman_fullery(info):
    from art.front_roman import domus
    return domus(dict(W=304,wing=48,floor=100,back=24,matte=True,shops=('cloth','cloth','cloth','cloth'),
                      notice=(),court_fn=fulling_court),info,front=FulleryFront,rear=FulleryRange)


def kiln_workshop(style,info):
    from art.front_materials import ashlar
    from art import front_solid as so, front_props as props
    b = ProductionShed(dict(W=166,storeys=['rubble'],heights=[66],roof='slate',rise=42,tone='stone-slate',
                       windows=('timber','casement'),door='plank',stacks=False,wear=.5,seed=109,lean_to=False,production='lime' if style=='lime-kiln' else 'pottery'))
    im=b.build()
    c=C(342,im.height+40)
    c.im.alpha_composite(im,(0,6));c.px=c.im.load()
    base=b.base+6
    # A covered work bay, braced to the masonry wall, links the shed to the kiln.
    from art.front_house import brace
    for x in (187,225): bevel(c,x,base-50,5,50,OAK,4)
    bevel(c,181,base-54,54,6,OAK,4)
    brace(c,191,base-33,208,base-50,OAK,4)
    brace(c,211,base-50,226,base-33,OAK,4)
    from art.front_materials import shingles
    shingles(c,180,base-75,57,22,RAMPS['shingle'],tw=8,th=6)
    bevel(c,179,base-55,59,4,OAK,4)
    c.rect(180,base-76,57,2,RAMPS['shingle'][1])
    kiln(c,277,base-12,'lime' if style=='lime-kiln' else 'pottery')
    so.box(c,186,base-1,40,15,15,OAK)
    if style=='pottery-kiln':
        for x in (192,204,216): props.pot(c,x,base-21,'jug',scale=.7)
    else:
        for x in (194,209):
            so.lathe(c,x,base-18,[(0,5),(3,7),(7,4)],RAMPS['limestone'])
    info.update(x0=b.x0,W=312,base=base,door_x=b.door_x,door_h=b.door_h)
    consolidate(c,rare=6)
    return c.im


def vat(c,cx,by,R=18,kind='dye'):
    from art import front_solid as so
    r=RAMPS['oak']
    water=ramp(245,.065,lift=-.18) if kind=='dye' else ramp(175,.025,lift=-.17)
    def staves(x,y,z,q):
        return (IRON if 4<=z<6 or 19<=z<21 else r)[q]
    so.lathe(c,cx,by,[(0,R-3),(3,R-1),(21,R),(24,R+1),(26,R+1)],r,
             hollow=(R-3,5),fill=(15,water),inside=IRON,ribs=14,surface=staves)


def cloth_rack(c,x,by,w=86,kind='cloth'):
    from art.front_house import brace
    for px in (x,x+w-5): bevel(c,px,by-55,5,55,OAK,4)
    bevel(c,x-3,by-57,w+6,5,OAK,4)
    brace(c,x+4,by-36,x+19,by-53,OAK,3)
    brace(c,x+w-22,by-53,x+w-7,by-36,OAK,3)
    r=RAMPS['limestone'] if kind=='cloth' else RAMPS['thatch']
    d=ImageDraw.Draw(c.im)
    for k in range(2):
        xx=x+17+k*32
        if kind=='cloth':
            for i in range(25):
                col=r[1 if i%10<3 else 4 if i%10>7 else 2]
                c.rect(xx+i,by-53,1,32+(i//8)%2,col)
            c.rect(xx,by-54,25,2,r[0])
            c.rect(xx,by-22,25,2,r[4])
        else:
            pts=[(xx+3,by-53),(xx+12,by-51),(xx+22,by-54),(xx+23,by-45),
                 (xx+29,by-40),(xx+25,by-34),(xx+21,by-35),(xx+23,by-20),
                 (xx+17,by-16),(xx+12,by-21),(xx+5,by-17),(xx+3,by-30),
                 (xx-3,by-33),(xx-4,by-40),(xx+2,by-44)]
            d.polygon(pts,fill=r[3],outline=r[5])
            d.line([(xx+7,by-48),(xx+6,by-27),(xx+11,by-24)],fill=r[1],width=2)
            for px,py in pts[::3]: c.rect(px,py-3,1,4,OAK[4])


class BoatShed(EaveHouse):
    def openings(self):
        from art import front_openings as op, front_solid as so
        from art.front_house import brace
        c,x,b=self.c,self.x0,self.base
        self.door_x=x+29;self.door_h=44;self.sills=[]
        op.door_plank(c,x+18,b-44,22,44)
        bevel(c,x+12,b-50,34,6,OAK,4)
        bx=x+61;bw=self.W-73
        op.shopfront_open(c,bx,b-52,bw,50)
        c.rect(bx+2,b-49,bw-4,46,OAK[6])
        for yy in (b-38,b-26):
            bevel(c,bx+5,yy,bw-10,3,OAK,4)
            for k in range(3):
                bevel(c,bx+8,yy-7+k*2,bw-17-k*7,2,RAMPS['pine'],3)
        for xx in (bx+9,bx+bw-16):bevel(c,xx,b-20,4,20,OAK,4)
        so.box(c,bx+5,b-19,bw-10,5,13,RAMPS['pine'])
        bevel(c,bx-4,b-57,bw+8,6,OAK,4)
        for xx in (bx-4,bx+bw):bevel(c,xx,b-51,4,51,OAK,4)
        brace(c,bx,b-33,bx+14,b-49,OAK,3)
        brace(c,bx+bw-14,b-49,bx+bw,b-33,OAK,3)


def boatyard(info):
    from art import front_solid as so
    from art.front_house import brace
    b=BoatShed(dict(W=172,storeys=['boards'],heights=[66],roof='shingle',rise=39,
                   tone='shingle-silver',stacks=False,wear=.45,seed=163))
    im=b.build();c=C(264,im.height+9)
    c.im.alpha_composite(im);c.px=c.im.load()
    x=b.x0+184;by=b.base
    for px in (x,x+50):bevel(c,px,by-49,5,49,OAK,4)
    bevel(c,x-4,by-52,63,5,OAK,4)
    brace(c,x+5,by-30,x+20,by-48,OAK,3)
    brace(c,x+35,by-48,x+50,by-30,OAK,3)
    for yy in (by-31,by-13):
        bevel(c,x-4,yy,63,4,OAK,4)
        for k in range(3):so.box(c,x-2+k*3,yy-2-k*3,53-k*3,3,7,RAMPS['pine'])
    from art.front_materials import shingles
    from art.front_eave import TONES
    shingles(c,x-5,by-71,65,20,TONES['shingle-silver'],tw=8,th=6)
    bevel(c,x-6,by-52,67,4,OAK,4)
    info.update(x0=b.x0,W=244,base=b.base,door_x=b.door_x,door_h=b.door_h)
    consolidate(c,rare=6)
    return c.im


def clinker_hull(direction,info,fishing=False,form="clinker"):
    from art import front_solid as so
    along_y=direction in ('north','south')
    c=C((104 if along_y else 176) if fishing else (112 if along_y else 216),
        (160 if along_y else 88) if fishing else (180 if along_y else 100))
    cx,by=c.w//2,c.h-(48 if fishing else 50) if along_y else c.h-23
    # All hull faces, internal frames and stocks share one depth buffer.
    depth={}
    water_clip=False
    def world(p):
        x,y,z=p
        if fishing:x,y,z=x*.72,y*.72,(z-6)*.72
        return (y,x,z) if direction=='north' else (-y,-x,z) if direction=='south' else (-x,-y,z) if direction=='west' else (x,y,z)
    def tri(points,r,bias=0):
        a,b,d=[world(p) for p in points]
        u=[b[i]-a[i] for i in range(3)];v=[d[i]-a[i] for i in range(3)]
        n=(u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0])
        norm=math.sqrt(sum(q*q for q in n))
        if not norm:return
        q=max(0,min(7,so.tone(tuple(v/norm for v in n))+bias))
        col=r[q]
        ps=[(cx+p[0],by-p[2]-so.K*p[1],p[1]) for p in (a,b,d)]
        (ax,ay,az),(bx,byy,bz),(dx,dy,dz)=ps
        den=(byy-dy)*(ax-dx)+(dx-bx)*(ay-dy)
        if abs(den)<1e-6:return
        for sy in range(max(0,math.floor(min(p[1] for p in ps))),min(c.h,math.ceil(max(p[1] for p in ps))+1)):
            for sx in range(max(0,math.floor(min(p[0] for p in ps))),min(c.w,math.ceil(max(p[0] for p in ps))+1)):
                aa=((byy-dy)*(sx+.5-dx)+(dx-bx)*(sy+.5-dy))/den
                bb=((dy-ay)*(sx+.5-dx)+(ax-dx)*(sy+.5-dy))/den
                cc=1-aa-bb
                if min(aa,bb,cc)<-1e-6:continue
                if fishing and water_clip and aa*a[2]+bb*b[2]+cc*d[2]<0:continue
                z=aa*az+bb*bz+cc*dz
                if z<=depth.get((sx,sy),math.inf)+.001:
                    c.p(sx,sy,col);depth[sx,sy]=z
    def quad(a,b,d,e,r,bias=0):
        tri((a,b,d),r,bias);tri((a,d,e),r,bias)
    def box(x,y,z,w,d,h,r):
        quad((x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h),r)
        quad((x,y,z),(x+w,y,z),(x+w,y,z+h),(x,y,z+h),r)
        quad((x+w,y+d,z),(x,y+d,z),(x,y+d,z+h),(x+w,y+d,z+h),r)
        quad((x,y+d,z),(x,y,z),(x,y,z+h),(x,y+d,z+h),r)
        quad((x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h),r)
    if form=='reed':
        reed=RAMPS['thatch'] if 'thatch' in RAMPS else RAMPS['pine']
        rope=RAMPS['cedar']
        def bundle(t,a,j):
            taper=math.sin(math.pi*t)**.55
            return ((t-.5)*174, j*8*taper+4.5*taper*math.cos(a),
                    14+29*abs(2*t-1)**3+6*taper*math.sin(a))
        for j in range(-2,3):
            for k in range(40):
                for m in range(12):
                    a=m*math.tau/12;b=(m+1)*math.tau/12
                    quad(bundle(k/40,a,j),bundle((k+1)/40,a,j),
                         bundle((k+1)/40,b,j),bundle(k/40,b,j),reed, j%2)
        for t in (.12,.29,.5,.71,.88):
            for j in range(-2,3):
                for m in range(12):
                    a=m*math.tau/12;b=(m+1)*math.tau/12
                    quad(bundle(t-.009,a,j),bundle(t+.009,a,j),
                         bundle(t+.009,b,j),bundle(t-.009,b,j),rope)
        for x in range(-33,34,5):box(x,-12,21,4,24,1.5,reed)
        box(-52,-14,25,103,2,2,OAK)
        box(-65,-16,25,16,6,1.5,RAMPS['pine'])
        consolidate(c,rare=6)
        c.im.info['anchor']=[cx,by]
        info.update(x0=0,W=c.w,base=by,door_x=cx,door_h=44,doorless=True)
        return c.im
    def section(t,angle,inside=False):
        if form=='plank':
            taper=math.sin(math.pi*(.09+.91*t))**.65
            breadth=27*taper-(2 if inside else 0)
            k=abs(angle)/(math.pi/2)
            y=breadth*(1.3*k if k<.5 else .65+.7*(k-.5))
            return ((t-.5)*174,math.copysign(y,angle),
                    7*abs(2*t-1)**3+23*max(0,2*k-1)+(2 if inside else 0))
        s=math.sin(math.pi*t)
        breadth=27*s**.65
        rocker=(0 if fishing else 8)+12*abs(2*t-1)**3
        rise=24+8*abs(2*t-1)**2
        return ((t-.5)*174,(breadth-(2 if inside else 0))*math.sin(angle),
                rocker+rise*(1-math.cos(angle))+(2*math.cos(angle) if inside else 0))
    for x in (() if fishing else (-53,0,53)):
        box(x-4,-35,0,8,70,5,OAK)
        box(x-6,-4,5,12,8,4,OAK)
        for y in (-21,16):box(x-3,y,5,6,5,10,OAK)
        for side in (-1,1):
            box(x-14,side*33-4,0,28,8,3,OAK)
            for sign in (-1,1):
                quad((x+sign*13,side*33,3),(x+sign*10,side*33,3),
                     (x,side*23,14),(x+sign*3,side*23,14),OAK)
    for side in (-1,1):
        strakes=3 if form=='plank' else 6
        for plank in range(strakes):
            a0=side*plank*math.pi/(2*strakes);a1=side*(plank+1)*math.pi/(2*strakes)
            for k in range(36):
                t0=k/36;t1=(k+1)/36
                outer=[section(t0,a0),section(t1,a0),section(t1,a1),section(t0,a1)]
                inner=[section(t0,a0,True),section(t0,a1,True),section(t1,a1,True),section(t1,a0,True)]
                if side>0:outer.reverse();inner.reverse()
                water_clip=True
                quad(*outer,RAMPS["cedar"] if form=="plank" else OAK,plank%2)
                water_clip=False
                quad(*inner,OAK if form=='plank' else RAMPS['cedar'],1 if plank==0 else 0)
                # A narrow raised lap follows the curve of each overlapping strake.
                edge=[section(t0,a1-side*.055),section(t1,a1-side*.055),section(t1,a1),section(t0,a1)]
                if side>0:edge.reverse()
                water_clip=True
                if form=="clinker":quad(*edge,OAK)
                else:quad(*edge,OAK,2)
                water_clip=False
                if plank==strakes-1:
                    quad(section(t0,a1),section(t1,a1),section(t1,a1,True),section(t0,a1,True),RAMPS['pine'])
    if form=='plank':
        water_clip=True
        for side in (-1,1):
            for strake in range(3):
                a=side*(strake+.5)*math.pi/6
                for t0,t1 in ((.15,.29),(.4,.56),(.68,.8)):
                    quad(section(t0,a),section(t1,a),section(t1,a+.018),section(t0,a+.018),OAK,1)
        water_clip=False
        pts=[section(0,-math.pi/2),section(0,0),section(0,math.pi/2)]
        quad(pts[0],pts[1],pts[2],(pts[2][0],pts[2][1],24),OAK)
        quad(pts[0],pts[2],(pts[2][0],pts[2][1],24),(pts[0][0],pts[0][1],24),OAK)
        for x in range(-62,62,8):box(x,-12,9,7,24,2,OAK)
    for t in (.14,.26,.38,.5,.62,.74,.86):
        for k in range(24):
            a0=-1.44+k*2.88/24;a1=a0+2.88/24
            pts=[]
            for dt,a in ((-.014,a0),(-.014,a1),(.014,a1),(.014,a0)):
                x,y,z=section(t+dt,a,True)
                pts.append((x,y-math.sin(a)*1.5,z+1.5))
            quad(*pts,RAMPS['pine'])
            quad(pts[3],pts[2],(pts[2][0],pts[2][1],pts[2][2]-2),
                 (pts[3][0],pts[3][1],pts[3][2]-2),OAK)
    for k in range(32):
        t0=.04+k*.92/32;t1=.04+(k+1)*.92/32
        x0,_,z0=section(t0,0,True);x1,_,z1=section(t1,0,True)
        quad((x0,-3,z0+2),(x1,-3,z1+2),(x1,3,z1+2),(x0,3,z0+2),OAK)
    for t in (.008,.992):
        x,_,z=section(t,math.pi/2)
        box(x-2,-2,z-4,4,4,9,OAK)
    if fishing:
        for t in (.24,.5,.76):
            x,_,z=section(t,0)
            b=27*math.sin(math.pi*t)**.65-3
            box(x-3,-b,21,6,b*2,3,RAMPS['pine'])
        if form=='plank':
            box(-111,-17,26,115,2.5,2,OAK)
            box(-124,-20,26,16,8,2,RAMPS['pine'])
            box(-77,-20,24,4,7,7,OAK)
        else:
            box(-47,-13,25,92,2.5,2,OAK)
            box(-58,-15,25,14,6,1.5,RAMPS['pine'])
        a=world((-84,0,34));b=world((-118,0,9))
        d=ImageDraw.Draw(c.im)
        d.line((round(cx+a[0]),round(by-a[2]-so.K*a[1]),round(cx+b[0]),round(by-b[2]-so.K*b[1])),fill=OAK[3],width=1)
    consolidate(c,rare=6)
    c.im.info['anchor']=[cx,by]
    info.update(x0=0,W=c.w,base=by,door_x=cx,door_h=44,doorless=True)
    return c.im


def fishing_building(style,info):
    home=style=='fishing-cottage'
    b=EaveHouse(dict(W=120 if home else 86,storeys=['boards'],heights=[62 if home else 55],
        roof='shingle',rise=37 if home else 31,tone='shingle-silver',stacks='one' if home else False,
        windows=('timber','leaded' if home else 'open'),door='plank',wear=.5,seed=173 if home else 179))
    im=b.build()
    if not home:
        d=ImageDraw.Draw(im);wx=b.cols[-1];wy=b.base-18
        for rr in (7,4):d.ellipse((wx-rr,wy-rr,wx+rr,wy+rr//2),outline=OAK[3],width=2)
        bevel(b.c,wx-14,b.base-12,28,4,OAK,4)
    info.update(x0=b.x0,W=b.W,base=b.base,door_x=b.door_x,door_h=b.door_h)
    return im


def fishing_equipment(style,info):
    from art import front_solid as so
    from art.front_house import brace
    c=C(128,92);by=80;cx=64
    if style=='net-frame':
        for x in (14,108):bevel(c,x,by-55,5,55,OAK,4)
        bevel(c,10,by-58,108,5,OAK,4)
        brace(c,19,by-35,34,by-53,OAK,3)
        brace(c,92,by-53,108,by-35,OAK,3)
        d=ImageDraw.Draw(c.im);rope=ramp(80,.035,lift=-.22)
        def net(u,v):return (24+u*78,by-52+5*math.sin(u*math.pi)+v*30)
        for slope in (-1,1):
            for k in range(-4,15):
                points=[]
                for i in range(101):
                    u=i/100;v=(k/10+slope*u)*2
                    if 0<=v<=1:points.append(tuple(round(q) for q in net(u,v)))
                if len(points)>1:d.line(points,fill=rope[3 if slope==1 else 4],width=1)
        d.line([tuple(round(q) for q in net(i/20,0)) for i in range(21)],fill=OAK[2],width=2)
        d.line([tuple(round(q) for q in net(i/20,1)) for i in range(21)],fill=rope[4],width=2)
        for u in (.05,.25,.45,.65,.85):
            x,y=net(u,0);so.lathe(c,round(x),round(y)+3,[(0,2),(3,3),(5,2)],RAMPS['pine'])
    else:
        for x in (32,88):so.box(c,x,by,5,17,10,OAK)
        so.box(c,27,by-17,72,3,22,RAMPS['pine'])
        for x in (28,96):so.box(c,x,by-19,3,2,22,OAK)
        d=ImageDraw.Draw(c.im);fish=RAMPS['zinc']
        for x,y in ((39,by-26),(55,by-23),(70,by-27),(79,by-23)):
            d.polygon([(x,y),(x+5,y-2),(x+12,y),(x+15,y-2),(x+14,y+3),(x+11,y+1),(x+4,y+2)],fill=fish[3],outline=fish[5])
            d.line((x+3,y-1,x+10,y),fill=fish[1],width=1)
    consolidate(c,rare=6)
    c.im.info['anchor']=[cx,by]
    info.update(x0=0,W=128,base=by,door_x=cx,door_h=44,doorless=True)
    return c.im


def shore_building(style,info):
    if style.startswith('plank-fishing-'):
        home=style.endswith('house')
        return sino.hall(dict(W=144 if home else 100,bays=3,wall_h=58 if home else 52,
            roof='thatch',tone='dark',form='hip' if home else 'gable',front='timber',
            posts='timber',wall='earth',sill='wood',lattice='bars',door='plain',
            ridge='plain',curve=0,plinth=5,rise=42 if home else 34,pent=False,seed=219,wear=.5),info)
    from art.front_materials import kahgel
    from art import front_solid as so
    home=style=='earth-fishing-house'
    W=136 if home else 100;L=14;B=117 if home else 105
    c=C(W+28,B+6);d=ImageDraw.Draw(c.im)
    earth=RAMPS['plaster-ochre'];reed=RAMPS['thatch'] if 'thatch' in RAMPS else RAMPS['pine']
    if home:
        kahgel(c,L,B-65,W,65,earth)
        c.rect(L,B-64,3,63,earth[1]);c.rect(L+W-4,B-62,4,62,earth[4])
        so.box(c,L-2,B-65,W+4,5,30,earth)
        c.rect(L+5,B-83,W-10,15,earth[3])
        c.rect(L+7,B-81,W-14,4,earth[2])
        c.rect(L+8,B-77,W-16,8,earth[3])
        c.rect(L+4,B-85,W-8,4,earth[1])
        so.box(c,L-3,B-65,W+6,8,5,earth)
        for x in (L+20,L+W-29):
            c.rect(x,B-51,13,10,earth[5]);c.rect(x+2,B-49,9,6,OAK[6])
            c.rect(x-1,B-41,15,2,earth[1])
        dx=L+W//2
        c.rect(dx-15,B-48,30,48,earth[5])
        for x in range(dx-11,dx+11,4):
            c.rect(x,B-44,4,44,OAK[4]);c.rect(x,B-44,1,43,OAK[2])
        for y in (B-35,B-10):bevel(c,dx-11,y,22,3,OAK,3)
        bevel(c,dx-15,B-48,30,4,OAK,3)
        for x in (dx-15,dx+12):bevel(c,x,B-44,3,44,OAK,4)
        c.rect(dx+4,B-22,5,2,OAK[1]);c.rect(dx+7,B-24,2,6,OAK[5])
        so.box(c,dx-17,B+1,34,2,6,earth)
    else:
        for x in range(L+2,L+W-1,4):
            c.rect(x,B-49,3,49,reed[3 if x%8 else 4])
            c.rect(x,B-49,1,48,reed[1])
        for y in (B-43,B-22,B-5):bevel(c,L,y,W,3,OAK,4)
        for x in (L,L+W-5):bevel(c,x,B-56,5,56,OAK,4)
        so.box(c,L-5,B-54,W+10,4,30,reed)
        for x in range(L-3,L+W+3,4):
            c.rect(x,B-82,1,26,reed[2]);c.rect(x+1,B-80,1,24,reed[4])
        for y in (B-79,B-67,B-56):c.rect(L-4,y,W+8,2,OAK[4])
        dx=L+W//2
        c.rect(dx-15,B-46,30,46,OAK[6])
        for x in (dx-18,dx+15):bevel(c,x,B-49,3,49,OAK,4)
        bevel(c,dx-18,B-49,36,4,OAK,3)
        # Rolled mat over an open working entrance.
        for y,q in enumerate((3,1,2,3,4,5)):
            c.rect(dx-17,B-48+y,34,1,reed[q])
        d.ellipse((dx-20,B-48,dx-14,B-43),fill=reed[3],outline=reed[5])
    info.update(x0=L,W=W,base=B,door_x=dx,door_h=44)
    consolidate(c,rare=6)
    return c.im


def shore_equipment(style,info):
    from art import front_solid as so
    c=C(128,92);cx=64;by=80;d=ImageDraw.Draw(c.im)
    reed=RAMPS['thatch'] if 'thatch' in RAMPS else RAMPS['pine']
    cord=RAMPS['cedar'];fish=RAMPS['zinc']
    if style in ('net-rail','seine-pegs'):
        low=style=='seine-pegs';height=28 if low else 48
        for x in (16,108):bevel(c,x,by-height,4,height,OAK,4)
        d.line((18,by-height+3,65,by-height+9,110,by-height+3),fill=cord[3],width=2)
        def net(u,v):return (20+u*87,by-height+4+6*math.sin(u*math.pi)+v*(18 if low else 27))
        for sign in (-1,1):
            for k in range(-14,28):
                points=[]
                for i in range(91):
                    u=i/90;v=k/9+sign*u*2
                    if 0<=v<=1:points.append(tuple(round(a) for a in net(u,v)))
                if len(points)>1:d.line(points,fill=cord[3 if sign==1 else 4],width=1)
        for u in (.02,.22,.42,.62,.82,.98):
            x,y=net(u,0);so.lathe(c,round(x),round(y)+3,[(0,2),(3,3),(5,2)],reed if low else RAMPS['pine'])
        for x in (35,83):
            for r in (10,7,4):d.ellipse((x-r,by-5-r//2,x+r,by-5+r//2),outline=cord[3],width=1)
    else:
        mat=style=='fish-mat'
        if mat:
            so.box(c,20,by-1,88,2,35,reed)
            for x in range(22,106,4):d.line((x,by-17,x,by-3),fill=reed[4],width=1)
            for y in range(by-17,by-2,4):d.line((22,y,106,y),fill=reed[1],width=1)
        else:
            for x in (29,93):so.box(c,x,by,4,14,8,OAK)
            so.box(c,23,by-14,82,3,26,OAK)
            for x in (25,65):
                so.recess(c,x,by-16,36,19,3,OAK,RAMPS['pine'])
        fy=by-11 if mat else by-24
        for x,y in ((31,fy),(49,fy+3),(69,fy-1),(87,fy+3)):
            d.polygon([(x,y),(x+5,y-3),(x+13,y),(x+16,y-2),(x+16,y+3),(x+12,y+1),(x+4,y+2)],fill=fish[3],outline=fish[5])
            d.line((x+4,y-2,x+10,y-1),fill=fish[1])
        if mat:
            so.lathe(c,17,by,[(0,7),(8,10),(12,10),(13,8)],reed)
            d.ellipse((8,by-15,26,by-9),fill=cord[5],outline=reed[2])
    consolidate(c,rare=6)
    c.im.info['anchor']=[cx,by]
    info.update(x0=0,W=128,base=by,door_x=cx,door_h=44,doorless=True)
    return c.im


def launching_way(direction,info):
    from art import front_solid as so
    c=C(64,48);r=ramp(65,.045,lift=-.13)
    if direction=='north':
        so.box(c,7,25,50,3,7,r)
        for x in (10,50):so.box(c,x,40,4,3,64,r)
    else:
        so.box(c,28,40,5,3,64,r)
        for y in (12,36):so.box(c,16,y,32,3,6,r)
    consolidate(c,rare=6)
    c.im.info['anchor']=[32,22]
    info.update(x0=0,W=64,base=22,door_x=32,door_h=44,doorless=True)
    return c.im


def working_yard(style,info):
    from art import front_solid as so
    from art.front_materials import brick,h2
    japanese=style=='japanese-dyehouse'
    tanning=style=='tannery'
    dye=style in ('dyehouse','japanese-dyehouse')
    if japanese:
        im=sino.hall(dict(W=174,bays=3,tone='tile',posts='dark',wall='white',lattice='bars',curve=0,ridge='plain'),info)
        x0,base,dx,dh=info['x0'],info['base'],info['door_x'],info['door_h']
    else:
        b=ProductionShed(dict(W=174,storeys=['whitewash' if dye else 'ochre'],heights=[70],frame=True,
             roof='plain' if dye else 'shingle',rise=42,tone='tile-brown' if dye else 'shingle-silver',
             stacks='ends' if dye else False,production='leather' if tanning else 'cloth',wear=.5,seed=124))
        im=b.build();x0,base,dx,dh=b.x0,b.base,b.door_x,b.door_h
    c=C(352,im.height+91)
    yard_x=x0+183; bottom=base+61
    ground=ramp(80,.025,lift=-.13)
    left=yard_x-5; top=base-27
    c.rect(left,top,139,90,ground[3])
    yy=top; row=0
    while yy<bottom+2:
        depth=3+int(h2(row,37)*3)
        xx=left-18*(row%2); col=0
        while xx<left+139:
            width=28+int(h2(row,col)*19)
            x=max(left,xx); end=min(left+139,xx+width-1)
            c.rect(x,yy,max(0,end-x),min(depth-1,bottom+2-yy),ground[2+int(h2(col,row)*2)])
            xx+=width; col+=1
        yy+=depth; row+=1
    # Draw the recessed channel before anything standing on the paving.
    c.rect(yard_x+64,base+7,7,bottom-base-5,ground[3])
    c.rect(yard_x+65,base+7,4,bottom-base-5,ground[5])
    c.rect(yard_x+69,base+7,1,bottom-base-5,ground[1])
    for yy in range(base+11,bottom,11):
        c.rect(yard_x+64,yy,1,2,ground[4])
        c.rect(yard_x+69,yy,2,1,ground[4])
    c.im.alpha_composite(im,(0,0));c.px=c.im.load()
    cloth_rack(c,yard_x+20,base+3,104,'hide' if tanning else 'cloth')
    if tanning:
        liquid=ramp(70,.035,lift=-.22)
        for row in range(2):
            for col in range(2):
                x=yard_x+4+col*60; by=base+29+row*30
                so.box(c,x,by,54,3,49,STONE)
                so.recess(c,x+5,by-5,44,35,7,STONE,STONE,liquid)
                c.rect(x,by-2,54,2,STONE[2])
        so.box(c,yard_x-40,base+43,32,17,17,OAK)
        # The fleshing beam leans toward the worker; its pale working face is rounded.
        d=ImageDraw.Draw(c.im)
        d.polygon([(yard_x-37,base+36),(yard_x-26,base+11),(yard_x-17,base+13),(yard_x-27,base+38)],fill=OAK[2],outline=OAK[5])
        d.line((yard_x-34,base+34,yard_x-25,base+14),fill=OAK[1],width=2)
    elif dye:
        vat(c,yard_x+38,base+30,22,'dye')
        vat(c,yard_x+99,base+54,23,'dye')
        # A heatable copper kettle has a low brick hearth, separate from the rinse vats.
        so.box(c,yard_x-36,base+48,42,20,30,lambda c,x,y,w,h:brick(c,x,y,w,h))
        copper=ramp(48,.085,lift=-.08)
        so.lathe(c,yard_x-15,base+23,[(0,14),(5,18),(14,19),(17,20)],copper,
                 hollow=(16,3),fill=(9,ramp(245,.065,lift=-.18)),inside=copper)
        c.rect(yard_x-24,base+38,17,10,IRON[7])
    else:
        vat(c,yard_x+36,base+29,23,'rinse')
        vat(c,yard_x+99,base+52,23,'rinse')
        r=RAMPS['limestone']
        so.box(c,yard_x-44,base+53,43,10,51,r)
        so.recess(c,yard_x-39,base+40,33,32,6,r,r,ramp(175,.025,lift=-.17))
        bevel(c,yard_x-44,base+42,43,3,r,3)
    info.update(x0=x0,W=322,base=base,door_x=dx,door_h=dh)
    consolidate(c,rare=6)
    return c.im


def brickyard(info):
    from art.front_materials import brick, h2
    from art import front_solid as so
    from art.front_house import brace
    b=ProductionShed(dict(W=172,storeys=['boards'],heights=[68],roof='shingle',rise=40,
          tone='shingle-silver',stacks=False,wear=.5,seed=141,production='brick'))
    im=b.build();c=C(354,im.height+51)
    c.im.alpha_composite(im,(0,0));c.px=c.im.load()
    clay=RAMPS['roman-brick'];x=b.x0+186;by=b.base+20
    # A clamp is a mass of stacked green bricks with fuel channels, not a chimney.
    for k in range(6):
        so.box(c,x+k*4,by-k*10,128-k*8,11,70-k*6,
               lambda c,x,y,w,h:brick(c,x,y,w,h,clay),lambda c,x,y,w,h:brick(c,x,y,w,h,clay))
    for xx in (x+13,x+48,x+83):
        c.rect(xx,by-16,13,16,IRON[7]);bevel(c,xx-2,by-19,17,3,clay,4)
    # Moulded bricks dry in rows on the open ground below the firing clamp.
    green=ramp(65,.055,lift=-.12)
    for row in range(3):
        for col in range(7):
            so.box(c,x+5+col*17,by+10+row*7,13,3,7,green)
    info.update(x0=b.x0,W=326,base=b.base,door_x=b.door_x,door_h=b.door_h)
    consolidate(c,rare=6)
    return c.im


def regional_pottery(style,info):
    from art import front_solid as so
    from art.front_props import pot
    if style=='japanese-pottery':
        im=sino.hall(dict(W=174,bays=3,tone='tile',posts='timber',wall='white',lattice='bars',curve=0,ridge='plain'),info)
        x0,base,dx,dh=info['x0'],info['base'],info['door_x'],info['door_h']
    else:
        b=ProductionShed(dict(W=174,storeys=['ochre'],heights=[68],roof='pantile',rise=38,tone='pantile-pale',
                            stacks=False,wear=.45,seed=164))
        im=b.build();x0,base,dx,dh=b.x0,b.base,b.door_x,b.door_h
    c=C(354,im.height+35);c.im.alpha_composite(im,(0,0));c.px=c.im.load()
    kiln(c,280,base-10,'earthen' if style=='japanese-pottery' else 'pottery')
    for yy in (base-32,base-13):
        so.box(c,x0+181,yy,35,3,14,OAK)
        for xx in (x0+187,x0+200,x0+211):pot(c,xx,yy-4,'jug',scale=.65)
    for xx in (x0+181,x0+212):bevel(c,xx,base-49,4,49,OAK,4)
    info.update(x0=x0,W=326,base=base,door_x=dx,door_h=dh)
    consolidate(c,rare=6)
    return c.im


def processing(style, info):
    if style=='roman-fullery': return roman_fullery(info)
    if style in ('lime-kiln','pottery-kiln'): return kiln_workshop(style,info)
    if style=='brick-clamp': return brickyard(info)
    if style in ('japanese-pottery','colonial-pottery'): return regional_pottery(style,info)
    return working_yard(style,info)


def draw(style, info):
    if style in ('plank-fishing-house','plank-fishing-store','earth-fishing-house','reed-gear-shelter'):return shore_building(style,info)
    if style in ('net-rail','seine-pegs','fish-trays','fish-mat'):return shore_equipment(style,info)
    if style.startswith(('plank-skiff-','reed-skiff-')):return clinker_hull(style.rsplit('-',1)[1],info,True,'plank' if style.startswith('plank-') else 'reed')
    if style in ('fishing-cottage','fishing-gear'):return fishing_building(style,info)
    if style in ('net-frame','fish-table'):return fishing_equipment(style,info)
    if style.startswith('fishing-boat-'):return clinker_hull(style.rsplit('-',1)[1],info,True)
    if style.startswith('launching-way-'):return launching_way(style.rsplit('-',1)[1],info)
    if style=='clinker-boatyard':return boatyard(info)
    if style.startswith('clinker-hull-'):return clinker_hull(style.rsplit('-',1)[1],info)
    if style in ('pottery-kiln','brick-clamp','lime-kiln','dyehouse','japanese-dyehouse','roman-fullery','fullery','tannery','japanese-pottery','colonial-pottery'): return processing(style,info)
    if style == 'windmill': return windmill(info)
    if style in ('stone-adit','andean-adit'): return adit(style,info)
    if style in ('bimaristan','colonial-hospital','japanese-infirmary','sri-lankan-infirmary'): return courtyard(style,info)
    if style in ('east-asian-mill','east-asian-store'):
        im = sino.hall(dict(W=160 if style.endswith('mill') else 128,bays=5 if style.endswith('mill') else 3,
                            tone='tile',posts='timber',wall='white',lattice='bars',curve=1,ridge='plain'),info)
        if style.endswith('mill'):
            expanded = Image.new('RGBA',(im.width+52,im.height))
            expanded.alpha_composite(im,(0,0)); im = expanded
            wheel(im,info['x0']+info['W']+22,info['base']-27,26)
            info['W'] += 64
        return im
    specs = {
        'modern-ward': dict(W=288,storeys=['whitewash'],heights=[72],roof='slate',windows=('timber','casement'),stacks=False,wear=.15),
        'european-mill': dict(W=160,storeys=['rubble','render'],heights=[58,46],roof='shingle',frame=True,stacks=False,dormers=1,door='plank'),
        'west-asian-mill': dict(W=160,storeys=['sandstone'],heights=[62],roof='pantile',tone='pantile-pale',stacks=False),
        'roman-mill': dict(W=192,storeys=['stucco-ochre'],heights=[64],roof='imbrex',stacks=False,arcade=True),
        'roman-store': dict(W=128,storeys=['stucco'],heights=[56],roof='imbrex',stacks=False),
        'timber-store': dict(W=112,storeys=['boards'],heights=[52],roof='shingle',stacks=False),
        'masonry-store': dict(W=128,storeys=['sandstone'],heights=[54],roof='pantile',stacks=False),
        'adobe-store': dict(W=128,storeys=['ochre'],heights=[54],roof='pantile',stacks=False),
        'brick-store': dict(W=144,storeys=['brick'],heights=[56],roof='slate',stacks='ends'),
        'boiler-house': dict(W=144,storeys=['rubble'],heights=[54],roof='slate',stacks=False),
        'engine-mine': dict(W=112,storeys=['rubble','rubble','rubble'],heights=[58,46,44],roof='slate',stacks=False,quoins=True),
        'infirmary': dict(W=256,storeys=['sandstone'],heights=[66],roof='plain',windows=('timber','leaded'),stacks='ends',door='arched',dormers=2),
        'pavilion-hospital': dict(W=288,storeys=['brick'],heights=[70],roof='slate',windows=('timber','sash'),stacks='ends',door='panel',string=True,quoins=True,dormers=3),
    }
    s = dict(seed=81,wear=.3)
    s.update(specs[style])
    b = (ModernWard if style=='modern-ward' else CivicHall if s.get('arcade') else EaveHouse)(s)
    im = b.build()
    wheel_width = 0
    if style in ('european-mill','west-asian-mill'):
        expanded = C(b.c.w+52,b.c.h)
        expanded.im.alpha_composite(im,(0,0)); expanded.px=expanded.im.load()
        b.c = expanded; im = expanded.im
        wheel(im,b.x0+b.W+23,b.base-29,28)
        wheel_width = 64
    if style == 'roman-mill':
        millstones(b.c,b.x0+42,b.base-1); millstones(b.c,b.x0+148,b.base-1)
    if style in ('engine-mine','boiler-house'):
        from art.front_materials import brick
        x = b.x0+b.W+9
        brick(b.c,x,b.base-137,15,137)
        b.c.rect(x-2,b.base-139,19,4,RAMPS['clay-tile'][2])
        b.c.rect(x+3,b.base-141,10,2,IRON[6])
    if style == 'engine-mine':
        bevel(b.c,b.x0+38,b.base-139,36,18,OAK,5)
        b.c.rect(b.x0+44,b.base-137,24,13,IRON[6])
        b.c.rect(b.x0+31,b.base-146,73,6,IRON[4])
        b.c.rect(b.x0+46,b.base-136,24,32,IRON[6])
        bevel(b.c,b.x0+42,b.base-138,5,36,RAMPS['limestone'],3)
        bevel(b.c,b.x0+70,b.base-138,5,36,RAMPS['limestone'],3)
    consolidate(b.c,rare=6)
    info.update(x0=b.x0,W=b.W+wheel_width,base=b.base,door_x=b.door_x,door_h=b.door_h)
    return im


def worksite_recipes(root, source):
    specs = json.loads((root/'src/content/graphics/worksites.json').read_text())
    return {name:dict(label=s['label'],footprint=s['footprint'],entrance=[s['footprint'][0]//2,s['footprint'][1]],
                     height=s.get('height',110),wall=s.get('wall','lime-plaster'),roof=s.get('roof','gable'),roofMaterial=s.get('roofMaterial','tile'),attachments=[],
                     opening='door',description=s['description'],frontWorksite=s['style']) for name,s in specs.items()}


_PAINTED = {}
class FrontWorksitePainter:
    def __init__(self,r,material=None):
        style = r['frontWorksite']
        if style in _PAINTED:
            self.__dict__.update(_PAINTED[style]); return
        info = {}
        self.image = draw(style,info)
        self.w,self.h = self.image.size
        self.anchor_x = info['x0']+info['W']//2
        self.door_x = info['door_x']
        self.door_size = (info.get('door_width',22),info['door_h'])
        self.no_door = info.get('doorless',False)
        self.door_ground = info['base']+1
        self.bottom = self.door_ground
        _PAINTED[style] = dict(self.__dict__)
    def render(self): return self.image


if __name__ == '__main__':
    recipes = worksite_recipes(ROOT,{})
    sheet([(r['label'],FrontWorksitePainter(r).render()) for r in recipes.values()],
          sys.argv[1] if len(sys.argv)>1 else 'artifacts/worksites-art.png',columns=3)
