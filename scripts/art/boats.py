"""Boat hulls baked at eight headings into depth-layered pixel sprites: clinker,
Japanese plank skiff, reed bundle, dugout, bark canoe, skin boat and log raft."""
from pathlib import Path
import json
import math
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
from art.front_materials import RAMPS, C, ramp
from art.front_solid import tone
from art.front_kit import consolidate
from art.front_review import sheet

W, H, BASE, SCALE = 176, 136, 78, 1.3
FACINGS = {f: (90-f*45) % 360 for f in range(8)}


SEATS = {'papyrus':8.1, 'raft':4.5, 'bark':1, 'hide':1}
NEW_FORMS = ('dugout','bark','hide','raft')
OUTLINE = {'papyrus':'thatch','wasen':'oak','dugout':'oak','bark':'bark','hide':'hide','raft':'oak'}


def seat_screen(heading,form='clinker'):
    return [0, round(-SEATS.get(form,2)*SCALE,2), 0]


FINISHES = {
    'clinker': [('Oak', {}), ('Tar-darkened', {'oak':ramp(48,.035,lift=-.26),'cedar':ramp(48,.045,lift=-.2)}),
                ('Weathered', {'oak':ramp(65,.035,lift=-.12),'cedar':ramp(60,.04,lift=-.08)})],
    'wasen': [('Warm timber', {}), ('Pale timber', {'oak':RAMPS['pine'],'cedar':RAMPS['pine']}),
              ('Weathered timber', {'oak':ramp(67,.025,lift=-.1),'cedar':ramp(65,.035,lift=-.04)})],
    'papyrus': [('Olive-gold reeds', {'thatch':ramp(94,.07,lift=-.04)}),
                ('Sun-dried reeds', {'thatch':ramp(78,.08,lift=-.02)}),
                ('Weathered and rebound', {'thatch':ramp(80,.035,lift=-.08)})],
    'dugout': [('Dark hardwood', {}), ('Fresh-hewn', {'oak':ramp(62,.08,lift=-.02)}),
               ('Weathered', {'oak':ramp(60,.03,lift=-.1)})],
    'bark': [('Birch bark', {'bark':ramp(85,.028,lift=.05)}), ('Spruce bark', {'bark':ramp(45,.06,lift=-.1)}),
             ('Elm bark', {'bark':ramp(60,.05,lift=-.03)})],
    'hide': [('Oiled hide', {'hide':ramp(70,.07,lift=.02)}), ('Dark hide', {'hide':ramp(52,.07,lift=-.1)}),
             ('Pale hide', {'hide':ramp(82,.04,lift=.06)})],
    'raft': [('Logs', {}), ('Light wood', {'oak':ramp(75,.06,lift=.04)}),
             ('Weathered', {'oak':ramp(60,.03,lift=-.1)})],
}



def wasen_ne_master(palette, depth):
    im=Image.new('RGBA',(W,H))
    d=ImageDraw.Draw(im)
    oak,wood=palette['oak'],palette['cedar']
    def poly(points,col):d.polygon(points,fill=col)
    def line(points,col,width=1):d.line(points,fill=col,width=width)

    far=[(32,82),(47,72),(61,64),(76,57),(91,50),(105,43),(118,36),(129,31)]
    near=[(55,94),(72,88),(88,80),(102,72),(114,63),(123,53),(128,43),(130,32)]
    bottom=[(131,42),(129,53),(123,66),(113,78),(100,89),(85,99),(68,108),(53,113),(32,99)]
    poly(far+[(131,30),(132,34)]+bottom,oak[6])
    poly([(33,83),(55,94)]+near[1:]+[(130,44),(126,57),(119,69),(108,81),
         (94,92),(78,102),(62,110),(53,111),(33,98)],oak[3])
    poly([(54,106),(70,102),(86,94),(101,84),(114,73),(124,59),(129,47),
         (126,60),(118,74),(105,87),(90,98),(72,108),(54,112)],oak[5])
    poly([(54,102),(71,97),(88,88),(103,78),(115,67),(125,53),(122,63),
         (113,76),(98,88),(82,99),(66,107),(54,110)],oak[4])
    poly(far+[(128,39),(120,50),(109,61),(95,72),(79,83),(63,94),(54,99),(35,87)],oak[5])
    poly([(39,84),(53,76),(67,69),(82,62),(97,55),(110,48),(121,40),(127,36),
         (124,48),(115,61),(102,73),(87,84),(71,94),(55,102)],wood[3])
    poly([(39,84),(53,76),(68,69),(83,62),(98,55),(112,47),(124,38),
         (118,49),(106,59),(91,69),(76,79),(59,90),(47,96)],oak[4])
    poly([(40,84),(54,77),(70,70),(86,63),(102,55),(116,46),(124,38),
         (114,49),(100,58),(85,67),(69,76),(53,86),(43,91)],wood[4])
    for points in [((47,89),(67,78),(88,66),(109,53)),((53,96),(72,85),(91,73),(111,58)),
                   ((67,96),(84,85),(101,73),(116,58))]:line(points,oak[4])
    line([(61,87),(68,83),(73,81)],wood[2])
    line([(87,76),(94,72),(100,67)],wood[2])
    poly([(45,87),(61,94),(68,89),(52,81)],oak[6])
    poly([(82,65),(99,72),(106,65),(88,60)],oak[6])
    poly([(45,83),(48,82),(65,89),(62,93),(46,87)],wood[4])
    poly([(45,82),(49,80),(65,87),(62,90)],wood[2])
    line([(47,81),(62,87)],wood[1])
    poly([(84,62),(88,60),(105,66),(102,70),(85,66)],wood[4])
    poly([(84,61),(88,59),(105,65),(102,68)],wood[2])
    line([(87,60),(102,65)],wood[1])
    # Broad inner lips carry the structure; seams stay subordinate.
    poly([(53,95),(70,89),(86,81),(100,73),(112,64),(121,54),(126,43),(129,33),
         (126,44),(119,54),(110,63),(98,72),(84,80),(68,88),(53,92)],oak[5])
    poly([(55,94),(72,88),(88,80),(102,72),(114,63),(123,53),(128,43),(130,32),
         (129,44),(125,55),(116,66),(104,75),(90,84),(73,92),(56,98)],wood[3])
    line([(57,94),(72,89),(87,82),(102,74),(113,65),(122,55)],wood[2])
    line([(118,60),(125,49),(128,39)],wood[2])
    line([(57,98),(73,93),(90,85),(104,76),(116,67)],oak[4])
    line(far,oak[6],3)
    line([(33,82),(48,72),(62,65),(77,58),(92,51),(106,44),(119,37),(129,32)],wood[3],2)
    line([(37,80),(48,73),(61,66)],wood[2])
    line([(80,57),(94,50),(106,44)],wood[2])
    poly([(128,32),(130,31),(130,38),(128,43),(127,42)],wood[2])
    line([(59,102),(72,98),(86,91)],oak[4])
    line([(96,85),(107,77),(115,69)],oak[4])
    line([(73,103),(81,99)],wood[3])
    poly([(32,84),(54,95),(54,111),(33,98)],oak[4])
    poly([(32,83),(35,82),(57,93),(54,97)],wood[3])
    line([(34,83),(52,92)],wood[2])
    line([(34,91),(39,94)],oak[5])
    line([(44,97),(50,100)],oak[5])
    # The stowed scull has a readable blade, shaft and dark underside.
    line([(29,104),(60,87),(76,81)],oak[5],3)
    line([(29,102),(60,85),(76,79)],wood[3],2)
    line([(41,96),(60,85),(74,80)],wood[2])
    poly([(23,104),(25,100),(36,95),(39,97),(36,101),(27,106)],oak[5])
    poly([(24,102),(26,100),(35,96),(37,97),(34,100),(26,104)],wood[3])
    line([(27,101),(34,98)],wood[2])
    solid=np.isfinite(depth)
    ys,xs=np.where(solid)
    result=depth.copy()
    for y,x in zip(*np.where(np.array(im)[:,:,3]>0)):
        if not solid[y,x]:
            nearest=np.argmin((xs-x)**2+(ys-y)**2)
            result[y,x]=depth[ys[nearest],xs[nearest]]
    return im,result


def layers(facing, form='clinker', finish=0):
    W,H,BASE,SCALE = 176,136,78,1.3
    c = C(W, H)
    depth = np.full((H, W), np.inf)
    palette = {**RAMPS, 'rope':ramp(67,.06,lift=-.2), **FINISHES[form][finish][1]}
    th = math.radians(FACINGS[facing])
    co, si = math.cos(th), math.sin(th)

    def world(p):
        x, y, z = p
        return np.array([(x*co-y*si)*SCALE, (x*si+y*co)*SCALE, z*SCALE])

    def tri(points, material='oak', bias=0, ink=None):
        a, b, d = [world(p) for p in points]
        n = np.cross(b-a, d-a)
        norm = np.linalg.norm(n)
        if norm < 1e-8: return
        col = palette[material][ink if ink is not None else max(2, min(6, tone(n/norm)+bias))]
        ps = [(W/2+p[0], BASE-p[2]-.5*p[1], p[1], p[2]) for p in (a,b,d)]
        (ax,ay,az,ah),(bx,by,bz,bh),(dx,dy,dz,dh) = ps
        den = (by-dy)*(ax-dx)+(dx-bx)*(ay-dy)
        if abs(den) < 1e-8: return
        for sy in range(max(0,math.floor(min(p[1] for p in ps))), min(H,math.ceil(max(p[1] for p in ps))+1)):
            for sx in range(max(0,math.floor(min(p[0] for p in ps))), min(W,math.ceil(max(p[0] for p in ps))+1)):
                aa = ((by-dy)*(sx+.5-dx)+(dx-bx)*(sy+.5-dy))/den
                bb = ((dy-ay)*(sx+.5-dx)+(ax-dx)*(sy+.5-dy))/den
                cc = 1-aa-bb
                if min(aa,bb,cc) < -1e-6 or (form!='wasen' and aa*ah+bb*bh+cc*dh < 0): continue
                z = aa*az+bb*bz+cc*dz
                if z <= depth[sy,sx]+.001:
                    c.p(sx,sy,col)
                    depth[sy,sx] = z

    def quad(a,b,d,e,material='oak',bias=0,ink=None):
        tri((a,b,d),material,bias,ink); tri((a,d,e),material,bias,ink)

    def box(x,y,z,w,d,h,material='oak'):
        quad((x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h),material)
        quad((x,y,z),(x+w,y,z),(x+w,y,z+h),(x,y,z+h),material)
        quad((x+w,y+d,z),(x,y+d,z),(x,y+d,z+h),(x+w,y+d,z+h),material)
        quad((x,y+d,z),(x,y,z),(x,y,z+h),(x,y+d,z+h),material)
        quad((x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h),material)

    def stroke(points,material,ink,width=1):
        ps=[world(p) for p in points]
        for a,b in zip(ps,ps[1:]):
            ax,ay=W/2+a[0],BASE-a[2]-.5*a[1]
            bx,by=W/2+b[0],BASE-b[2]-.5*b[1]
            steps=max(1,math.ceil(max(abs(ax-bx),abs(ay-by))))
            for i in range(steps+1):
                t=i/steps;x=round(ax+(bx-ax)*t);y=round(ay+(by-ay)*t)
                z=a[1]+(b[1]-a[1])*t
                for dy in range(width):
                    if 0<=x<W and 0<=y+dy<H and z<=depth[y+dy,x]+1.2 and np.isfinite(depth[y+dy,x]):
                        c.p(x,y+dy,palette[material][ink])

    def section(t,a,inside=False):
        b = max(0,math.sin(math.pi*t))**.7*15.5
        rocker = 11*abs(2*t-1)**4
        return ((t-.5)*94, max(0,b-(1.3 if inside else 0))*math.sin(a),
                -5+rocker+20*(1-math.cos(a))+(1.6*math.cos(a) if inside else 0))

    if form=='wasen':
        def section(t,k,side=1,inside=False):
            b=max(0,17*math.sin(math.pi*(.22+.78*t))**.65-(1.6 if inside else 0))
            return ((t-.5)*91-3*(1-t)**6,side*b*(k/.55*.7 if k<.55 else .7+.3*(k-.55)/.45),
                    -5+10*t**5+15*max(0,(k-.55)/.45)+(2 if inside else 0))


        def beam(x,y,z,w,d,h):
            quad((x,y,z+h),(x+w,y,z+h),(x+w,y+d,z+h),(x,y+d,z+h),'cedar',ink=2)
            quad((x,y,z),(x+w,y,z),(x+w,y,z+h),(x,y,z+h),'cedar',ink=4)
            quad((x+w,y+d,z),(x,y+d,z),(x,y+d,z+h),(x+w,y+d,z+h),'cedar',ink=4)
            quad((x,y+d,z),(x,y,z),(x,y,z+h),(x,y+d,z+h),ink=5)
            quad((x+w,y,z),(x+w,y+d,z),(x+w,y+d,z+h),(x+w,y,z+h),ink=5)

        for side in (-1,1):
            lit=-side*si<-.15
            for k in range(32):
                t0=k/32;t1=(k+1)/32
                for k0,k1,ink in ((.55,.73,5),(.73,.84,4),(.84,1,3 if lit else 4)):
                    quad(section(t0,k0,side),section(t1,k0,side),section(t1,k1,side),section(t0,k1,side),ink=ink)
                for k0,k1,ink in ((.55,.78,4),(.78,.92,4),(.92,1,5)):
                    quad(section(t0,k0,side,True),section(t0,k1,side,True),section(t1,k1,side,True),section(t1,k0,side,True),ink=ink)
                outer0=section(t0,1,side);outer1=section(t1,1,side)
                inner0=section(t0,1,side,True);inner1=section(t1,1,side,True)
                quad(outer0,outer1,inner1,inner0,'cedar',ink=3)
                quad(outer0,outer1,(outer1[0],outer1[1],outer1[2]-1.5),(outer0[0],outer0[1],outer0[2]-1.5),ink=4)
                quad(inner1,inner0,(inner0[0],inner0[1],inner0[2]-2),(inner1[0],inner1[1],inner1[2]-2),ink=5)
        for k in range(32):
            t0=k/32;t1=(k+1)/32
            for j in range(4):
                y0=-.55+j*1.1/4;y1=y0+1.1/4
                def floor(t,v):return section(t,abs(v),-1 if v<0 else 1,True)
                quad(floor(t0,y0),floor(t1,y0),floor(t1,y1),floor(t0,y1),'cedar',ink=3 if j==2 else 4)
        for x in (-23,19):
            t=x/91+.5
            for j in range(8):
                y0=-.55+j*1.1/8;y1=y0+1.1/8
                quad(floor(t-.015,y0),floor(t+.08,y0),floor(t+.08,y1),floor(t-.015,y1),ink=6)
            b=section(t,1,inside=True)[1]
            beam(x,-b,7,4,b*2,2.5)
        b=section(0,1)[1]
        quad((-48.5,-b*.7,-5),(-48.5,b*.7,-5),(-48.5,b,10),(-48.5,-b,10),ink=4)
        quad((-47,-b,10),(-47,b,10),(-47,b*.7,-3),(-47,-b*.7,-3),ink=5)
        quad((-48.5,-b,10),(-48.5,b,10),(-47,b,10),(-47,-b,10),'cedar',ink=3)
        # One stowed stern scull, with a broad blade and a darker lower edge.
        quad((-62,-11,10),(-9,-3,9),(-9,-1.7,9),(-62,-9.7,10),'cedar',ink=3)
        quad((-62,-11,8.5),(-9,-3,7.5),(-9,-3,9),(-62,-11,10),ink=5)
        quad((-66,-12.8,10),(-56,-11.5,10),(-54,-9.3,10),(-65,-8.5,10),'cedar',ink=3)
        quad((-66,-12.8,8.5),(-65,-8.5,8.5),(-65,-8.5,10),(-66,-12.8,10),ink=5)
        beam(-48,6,10,2,2,2)
        for side in (-1,1):
            pts=[section(k/48,1,side,True) for k in range(49)]
            stroke(pts,'oak',5)
            for t0,t1 in ((.09,.37),(.58,.86)):
                stroke([section(t0+(t1-t0)*k/20,1,side) for k in range(21)],'cedar',2)
            stroke([section(.22+k*.5/24,.82,side) for k in range(25)],'oak',4)
            stroke([section(.2+k*.17/12,.76,side,True) for k in range(13)],'cedar',3)
        for v in (-.275,.275):
            stroke([floor(.1+k*.77/32,v) for k in range(33)],'oak',4)
        for x in (-23,19):
            b=section(x/91+.5,1,inside=True)[1]
            stroke([(x,-b,9.5),(x,b*.4,9.5)],'cedar',1)
        stroke([(-61,-10.5,10.3),(-31,-6,9.7)],'cedar',2)
    elif form=='papyrus':
        def bundle(t,a,j,extra=0):
            taper=max(0,math.sin(math.pi*t))**.55
            radius=3.5*taper+extra
            rise=(26 if t>.5 else 18)*abs(2*t-1)**4
            return ((t-.5)*94,j*5.5*taper+radius*math.cos(a),
                    4.5+rise+(radius)*math.sin(a))

        for j in range(-2,3):
            for k in range(40):
                for m in range(8):
                    a=m*math.tau/8;b=(m+1)*math.tau/8
                    ink=2 if m in (1,2) else 3 if m in (0,3) else 4 if m in (4,7) else 5
                    quad(bundle(k/40,a,j),bundle((k+1)/40,a,j),
                         bundle((k+1)/40,b,j),bundle(k/40,b,j),'thatch',ink=ink)

        def wrap(t,a,extra=.3):
            taper=max(0,math.sin(math.pi*t))**.55
            rise=(26 if t>.5 else 18)*abs(2*t-1)**4
            ca,sa=math.cos(a),math.sin(a)
            return ((t-.5)*94,math.copysign(abs(ca)**.45,ca)*(14.5*taper+extra),
                    4.5+rise+math.copysign(abs(sa)**1.7,sa)*(3.7*taper+extra))

        for n,t in enumerate((.1,.25,.48,.73,.9)):
            for offset in (-.009,.009):
                for m in range(20):
                    a=m*math.tau/20;b=(m+1)*math.tau/20
                    quad(wrap(t+offset-.005,a),wrap(t+offset+.005,a),
                         wrap(t+offset+.005,b),wrap(t+offset-.005,b),'rope',ink=3 if m<10 else 5)
            taper=math.sin(math.pi*t)**.55
            rise=(26 if t>.5 else 18)*abs(2*t-1)**4
            box((t-.5)*94-1,-11*taper,8.4+rise,2.5,2,1.1,'rope')
            if finish==2 and n==1:
                for m in range(20):
                    a=m*math.tau/20;b=(m+1)*math.tau/20
                    quad(wrap(t-.026,a,.6),wrap(t-.017,a,.6),wrap(t-.017,b,.6),wrap(t-.026,b,.6),'rope',ink=2)
        for t in (.035,.965,.982):
            for m in range(20):
                a=m*math.tau/20;b=(m+1)*math.tau/20
                quad(wrap(t-.004,a,.4),wrap(t+.004,a,.4),wrap(t+.004,b,.4),wrap(t-.004,b,.4),'rope',ink=4)
        # The working mat follows the low deck; there are no wooden thwarts or rowlocks.
        quad((-12,-6.5,8.1),(12,-6.5,8.1),(12,6.5,8.1),(-12,6.5,8.1),'thatch',ink=3)
        for x in range(-11,13,4):
            quad((x,-6,8.3),(x+1,-6,8.3),(x+1,6,8.3),(x,6,8.3),'thatch',ink=4)
        box(-12,-6.5,8.3,24,.7,.5,'rope');box(-12,6,8.3,24,.7,.5,'rope')
        for j in range(-2,3):
            for a in (.7,1.9):
                for t0,t1 in ((.13,.21),(.29,.42),(.54,.67),(.78,.85)):
                    stroke([bundle(t0+(t1-t0)*k/12,a,j,.12) for k in range(13)],'thatch',3 if a<1 else 1)
        for t in (.1,.25,.48,.73,.9):
            for offset in (-.009,.009):
                stroke([wrap(t+offset,k*math.pi/24,.6) for k in range(25)],'rope',4)
        # Two plain paddles stowed along the bundles, with broad leaf-shaped blades.
        for side in (-1,1):
            y=side*8
            quad((-31,y-.6,9.2),(20,y-.6,9.2),(20,y+.6,9.2),(-31,y+.6,9.2),'oak',ink=3)
            quad((19,y-.5,9.3),(24,y-2.4,9.3),(33,y-1.5,9.3),(35,y,9.3),'oak',ink=2)
            quad((19,y+.5,9.3),(24,y+2.4,9.3),(33,y+1.5,9.3),(35,y,9.3),'oak',ink=3)
            stroke([(-30,y,9.5),(17,y,9.5)],'oak',2)
    elif form in ('dugout','bark','hide'):
        # Dugout: one log, thick walls, a flat cut rim, blunt ends. Bark canoe:
        # long and narrow with high recurved ends. Skin boat: a flat floor and
        # flared straight sides over a frame. All sit with their floor above
        # the waterline so the inside reads as a floor, not as water.
        skin = 'oak' if form=='dugout' else form
        length, beam, rim = {'dugout':(86,10.5,8.5),'bark':(100,12,10),'hide':(92,15,10)}[form]
        wall = {'dugout':2.2,'bark':.9,'hide':1}[form]

        def section(t,a,side=1,inside=False):
            s_ = max(0,math.sin(math.pi*t))
            rise = (5*abs(2*t-1)**6 if form=='dugout' else 22*abs(2*t-1)**5 if form=='bark' else 6*abs(2*t-1)**4)
            b = max(0, (s_**.3 if form=='dugout' else s_**.7 if form=='bark' else s_**.45)*beam-(wall if inside else 0))
            floor = 1.5 if form=='dugout' else .6
            low = floor if inside else -2.5
            u = a/(math.pi/2)
            if form=='hide':
                y, z = b*(.6+.4*u), low+(rim-low)*u
            else:
                y, z = b*math.sin(a), low+(rim-low)*(1-math.cos(a))
            return ((t-.5)*length, side*y, z+rise)

        for side in (-1,1):
            for j in range(6):
                a0=j*math.pi/12; a1=(j+1)*math.pi/12
                for k in range(36):
                    t0=k/36; t1=(k+1)/36
                    outer=[section(t0,a0,side),section(t1,a0,side),section(t1,a1,side),section(t0,a1,side)]
                    inner=[section(t0,a0,side,True),section(t0,a1,side,True),section(t1,a1,side,True),section(t1,a0,side,True)]
                    if side>0: outer.reverse(); inner.reverse()
                    quad(*outer,skin)
                    quad(*inner,skin,bias=1 if form!='dugout' else 2)
            for k in range(36):
                t0=k/36; t1=(k+1)/36
                top=[section(t0,math.pi/2,side),section(t1,math.pi/2,side),section(t1,math.pi/2,side,True),section(t0,math.pi/2,side,True)]
                if side>0: top.reverse()
                quad(*top,'cedar' if form!='dugout' else 'oak',ink=2)
        for k in range(36):
            t0=k/36; t1=(k+1)/36
            quad(section(t0,0,-1,True),section(t1,0,-1,True),section(t1,0,1,True),section(t0,0,1,True),
                 'cedar' if form=='hide' else skin,ink=4 if form!='dugout' else 5)
        if form=='dugout':
            # Adze marks along the hollow, and two paddles laid inside.
            for side in (-1,1):
                for t0,t1 in ((.18,.4),(.55,.8)):
                    stroke([section(t0+(t1-t0)*k/12,.9,side,True) for k in range(13)],'oak',6)
            for y in (-3,3):
                quad((-30,y-.5,2.2),(14,y-.5,2.2),(14,y+.5,2.2),(-30,y+.5,2.2),'cedar',ink=3)
                quad((14,y-.5,2.3),(19,y-2,2.3),(27,y-1.2,2.3),(29,y,2.3),'cedar',ink=2)
                quad((14,y+.5,2.3),(19,y+2,2.3),(27,y+1.2,2.3),(29,y,2.3),'cedar',ink=3)
        if form=='bark':
            # Gum-sealed seams cross the bark; three thwarts hold the gunwales apart.
            for side in (-1,1):
                for t in (.1,.22,.36,.5,.64,.78,.9):
                    stroke([section(t,m*math.pi/24,side) for m in range(13)],'oak',6)
                stroke([section(.03+k*.94/40,math.pi/2*.93,side) for k in range(41)],'cedar',3)
            for t in (.3,.5,.7):
                b=section(t,math.pi/2,1,True)[1]; z=section(t,math.pi/2)[2]
                box((t-.5)*length-1,-b,z-1.6,2,b*2,1,'cedar')
            for t in (.12,.88):
                for m in range(10):
                    ps=[section(t+d,m*math.pi/20,1) for d in (-.01,.01)]
                    stroke([(x,0,z) for x,y,z in ps],'oak',5)
        if form=='hide':
            # The frame shows through the oiled skin as darker ribs, lashed at the gunwale.
            for side in (-1,1):
                for t in [.08+i*.84/9 for i in range(10)]:
                    stroke([section(t,m*math.pi/24,side) for m in range(13)],'hide',5)
                    stroke([section(t,m*math.pi/24,side,True) for m in range(13)],'cedar',4)
            for t in (.3,.52,.74):
                b=section(t,math.pi/2,1,True)[1]; z=section(t,math.pi/2)[2]
                box((t-.5)*length-1.2,-b,z-1.8,2.4,b*2,1.2,'cedar')
            for y in (-5,5):
                quad((-26,y-.5,1.4),(16,y-.5,1.4),(16,y+.5,1.4),(-26,y+.5,1.4),'cedar',ink=3)
                quad((16,y-.5,1.5),(20,y-2,1.5),(28,y-1.5,1.5),(30,y,1.5),'cedar',ink=2)
                quad((16,y+.5,1.5),(20,y+2,1.5),(28,y+1.5,1.5),(30,y,1.5),'cedar',ink=3)
    elif form=='raft':
        # Seven logs lashed side by side under two cross poles; the ends are left as they fell.
        def log(t,a,y,length,r=2.2):
            return ((t-.5)*length, y+r*math.cos(a), 1.2+r*math.sin(a))
        lengths=(76,84,88,90,87,82,74)
        for n,y in enumerate(range(-12,13,4)):
            L=lengths[n]
            for k in range(24):
                for m in range(8):
                    a=m*math.tau/8; b=(m+1)*math.tau/8
                    ink=2 if m in (1,2) else 3 if m in (0,3) else 4 if m in (4,7) else 5
                    quad(log(k/24,a,y,L),log((k+1)/24,a,y,L),log((k+1)/24,b,y,L),log(k/24,b,y,L),'oak',ink=ink)
            for end in (0,1):
                for m in range(8):
                    a=m*math.tau/8; b=(m+1)*math.tau/8
                    tri((log(end,0,y,L,0),log(end,a,y,L),log(end,b,y,L)),'cedar',ink=2 if end else 3)
            stroke([log(.15+k*.7/20,1.2,y,L,2.3) for k in range(21)],'oak',5)
        for x in (-26,24):
            box(x-1.5,-15,3.4,3,30,1.8,'cedar')
            for y in range(-12,13,4):
                box(x-2,y-.6,3,4,1.2,2.6,'rope')
        quad((-6,-7,3.6),(8,-7,3.6),(8,7,3.6),(-6,7,3.6),'thatch',ink=3)
        quad((-30,9,5.4),(18,9,5.4),(18,10,5.4),(-30,10,5.4),'cedar',ink=3)
        quad((18,8.5,5.5),(23,7,5.5),(31,8,5.5),(33,9.5,5.5),'cedar',ink=2)
    else:
        for side in (-1,1):
            for plank in range(6):
                a0=side*plank*math.pi/12; a1=side*(plank+1)*math.pi/12
                for k in range(32):
                    t0=k/32; t1=(k+1)/32
                    outer=[section(t0,a0),section(t1,a0),section(t1,a1),section(t0,a1)]
                    inner=[section(t0,a0,True),section(t0,a1,True),section(t1,a1,True),section(t1,a0,True)]
                    if side>0: outer.reverse(); inner.reverse()
                    quad(*outer,bias=0)
                    quad(*inner,bias=1)
                    # The lap is a continuous narrow shadow, not a textured surface.
                    edge=[section(t0,a1-side*.025),section(t1,a1-side*.025),section(t1,a1),section(t0,a1)]
                    edge=[(x,y+side*.3*math.sin(abs(a1)),z-.3*math.cos(a1)) for x,y,z in edge]
                    if side>0: edge.reverse()
                    quad(*edge,bias=1)
                    if plank==5:
                        quad(section(t0,a1),section(t1,a1),section(t1,a1,True),section(t0,a1,True),'cedar',-1)
                        rail=[section(t0,a1),section(t1,a1),section(t1,a1-side*.06),section(t0,a1-side*.06)]
                        rail=[(x,y+side*.35,z+.15) for x,y,z in rail]
                        if side>0: rail.reverse()
                        quad(*rail,'cedar',-1)
            for t in (.17,.31,.46,.61,.77):
                for j in range(12):
                    a0=side*j*math.pi/24; a1=side*(j+1)*math.pi/24
                    ps=[section(t-.007,a0,True),section(t+.007,a0,True),section(t+.007,a1,True),section(t-.007,a1,True)]
                    ps=[(x,y,z+.6) for x,y,z in ps]
                    if side<0: ps.reverse()
                    quad(*ps,'cedar',0)
        for y in (-4.5,-1.5,1.5,4.5):
            box(-31,y-1.3,0,62,2.6,.8)
        for x in (-23,0,23):
            b=15.5*math.sin(math.pi*(x/94+.5))**.7-1.7
            box(x-2,-b,9,4,b*2,1.5,'cedar')
        for side in (-1,1):
            for x0,x1,z0,z1 in ((39,43,16,21),(43,47,21,29 if side>0 else 26)):
                quad((side*x0,-.8,z0),(side*x1,-.8,z1),(side*x1,.8,z1),(side*x0,.8,z0),'cedar',-1)
                quad((side*x0,-.8,z0-2),(side*x1,-.8,z1-2),(side*x1,-.8,z1),(side*x0,-.8,z0),'oak')
            for x in (3,6): box(x,side*15-.5,15,1,1,3)
        # Stowed oars lie below the gunwale; the same geometry turns with the boat.
        for y in (-7,7):
            box(-31,y-.4,11,55,.8,.8)
            box(24,y-1.4,11,10,2.8,.7,'cedar')
    if form=='papyrus' and facing==1:
        d=ImageDraw.Draw(c.im)
        for x,y in ((59,77),(75,81),(96,73),(117,60),(128,39)):
            d.line([(x-1,y-1),(x+1,y),(x,y+2),(x-2,y+1),(x-1,y-1)],fill=palette['rope'][4])
            d.point((x-1,y),fill=palette['rope'][2])
            d.line([(x,y+1),(x+2,y+3)],fill=palette['rope'][4])
        if finish==2:
            d.line([(72,79),(74,81),(73,83),(71,82)],fill=palette['rope'][3])
        # Keep the hand-placed cord ends on the same crew layer as their knots.
        solid=np.isfinite(depth);ys,xs=np.where(solid)
        for y,x in zip(*np.where(np.array(c.im)[:,:,3]>0)):
            if not solid[y,x]:
                j=np.argmin((xs-x)**2+(ys-y)**2);depth[y,x]=depth[ys[j],xs[j]]
    if form=='wasen' and facing==1:
        c.im,depth=wasen_ne_master(palette,depth);c.px=c.im.load()
    if (form=='wasen' and facing!=1) or form=='papyrus' or form in NEW_FORMS:
        # Outline pixels inherit the depth of the solid edge they extend.
        alpha=np.array(c.im)[:,:,3]>0
        for y in range(1,H-1):
            for x in range(1,W-1):
                if alpha[y,x]:continue
                for dx,dy in ((0,1),(1,0),(-1,0),(0,-1)):
                    if alpha[y+dy,x+dx]:
                        c.p(x,y,palette[OUTLINE[form]][6]);depth[y,x]=depth[y+dy,x+dx]
                        break
    consolidate(c,rare=5)
    a=np.array(c.im)
    near=depth<0
    back,front=a.copy(),a.copy()
    back[near]=0; front[~near]=0
    return c.im,Image.fromarray(back),Image.fromarray(front)


def build():
    from art.atlas import pack_atlas
    from art.stamp import write_stamp
    harbor_art()
    sprites={}
    catalog={}
    for form,finishes,moorings in [
        ('clinker',[''],{'worksite-fishing-boat':4,'worksite-fishing-boat-north':0,
                         'worksite-fishing-boat-east':2,'worksite-fishing-boat-west':6}),
        ('wasen',['','-pale','-weathered'],{'worksite-plank-skiff':4,'worksite-plank-skiff-north':0,
                                         'worksite-plank-skiff-east':2,'worksite-plank-skiff-west':6}),
        ('papyrus',['','-dry','-rebound'],{'worksite-reed-skiff':4,'worksite-reed-skiff-north':0,
                                        'worksite-reed-skiff-east':2,'worksite-reed-skiff-west':6}),
        # Moored on the plank skiff's footprint, under names of their own.
        *[(form,['','-b','-c'],{f'boat-moored-{form}-{d}':f for d,f in (('north',0),('east',2),('south',4),('west',6))})
          for form in NEW_FORMS]]:
        for finish,name in enumerate(finishes):
            for f in range(8):
                for suffix,im in zip(('', '-back','-front'),layers(f,form,finish)):
                    im.info['anchor']=[W//2,BASE]
                    im.info['trim']=True
                    sprites[f'boat-{form}{name}-{f}{suffix}']=im
        catalog[form]={'size':[W,H],'anchor':[W//2,BASE],
            'seat':{str(f):seat_screen(h,form) for f,h in FACINGS.items()},'length':6,'beam':2,
            'posture':'kneel' if form in ('papyrus','bark') else 'sit',
            'finishes':finishes,'moorings':moorings}
    pack_atlas(sprites,ROOT/'public/packs','boats',1024)
    (ROOT/'src/content/graphics/boats.generated.json').write_text(json.dumps(catalog,indent=2)+'\n')
    write_stamp(ROOT)


def painted_review(out,form='wasen'):
    title='Nile reed skiff' if form=='papyrus' else 'Japanese fishing boat'
    items=[]
    for f in range(8):
        im,_,_=layers(f,form)
        items.append((f'{("N","NE","E","SE","S","SW","W","NW")[f]} / {title}',im))
    for finish,(label,_) in enumerate(FINISHES[form]):
        im,_,_=layers(1,form,finish)
        items.append((label,im))
    if form=='papyrus':items.append(('Approved Japanese NE',layers(1,'wasen')[0]))
    sheet(items,out,columns=4,masters=form!='papyrus')


def proposals(out):
    items=[]
    for form,title in [('wasen','Edo Japan · c.1800'),('papyrus','Nile · c.2000 BCE')]:
        for f in (2,1):
            for finish,(label,_) in enumerate(FINISHES[form]):
                full,_,_=layers(f,form,finish)
                items.append((f'{title} / {label} / {("NE" if f==1 else "E")}',full))
    sheet(items,out,columns=3)


def hulls(out):
    items=[]
    for form,title in (('dugout','Dugout'),('bark','Bark canoe'),('hide','Skin boat'),('raft','Log raft')):
        for f in (1,2,4):
            items.append((f'{title} / {("N","NE","E","SE","S","SW","W","NW")[f]}',layers(f,form)[0]))
        items.append((f'{title} / {FINISHES[form][1][0]}',layers(1,form,1)[0]))
    sheet(items,out,columns=4,masters=False)


def review(out):
    items=[]
    for f in range(8):
        full,back,front=layers(f)
        items.append((f'{("N","NE","E","SE","S","SW","W","NW")[f]} · clinker boat',full))
    sheet(items,out,columns=4)


def harbor_art(review_path=None, review_dhow=False):
    from art.atlas import pack_atlas
    from art.front_worksites import harbor_crane
    from art.steamships import steamship, trading_dhow, cloth_bale
    items={}
    for form in ('harbor-ferry','coastal-freighter'):
        for heading in range(8):items[f'{form}-{heading}']=steamship(heading,form)
    items['harbor-cloth-bale']=cloth_bale()
    mat=Image.new('RGBA',(49,32))
    weave=ImageDraw.Draw(mat)
    weave.polygon([(2,19),(32,16),(47,24),(16,29),(2,23)],fill='#816447',outline='#624d3c')
    for x in range(5,33,4):
        weave.line((x,20-(x-5)//9,x+12,27-(x-5)//9),fill='#c79e69')
    for n in range(4):
        stack=mat.copy()
        for x,y in [(20,6),(7,11),(10,0)][:n]:stack.alpha_composite(items['harbor-cloth-bale'],(x,y))
        stack.info['anchor']=[24,25]
        items[f'harbor-bale-mat-{n}']=stack
    for heading in range(8):
        for finish in range(3):
            for form in ('dhow','lighter'):
                items[f'harbor-{form}-{finish}-{heading}']=trading_dhow(heading,form=='lighter',finish=finish)
        for furled in (False,True):
            form='rig-furled' if furled else 'rig'
            for canvas in range(3):
                items[f'harbor-{form}-{canvas}-{heading}']=trading_dhow(heading,furled=furled,finish=canvas,rig=True)
    if review_path:
        labels=('N','NE','E','SE','S','SW','W','NW')
        views=[]
        if review_dhow:
            for label,form,finish,rig in [('Dhow','dhow',0,'rig'),('Furled','dhow',1,'rig-furled'),('Lighter','lighter',2,None)]:
                for heading,bearing in enumerate(labels):
                    canvas=Image.new('RGBA',(266,252))
                    frames=[items[f'harbor-{form}-{finish}-{heading}']]
                    if rig:frames.append(items[f'harbor-{rig}-{finish}-{heading}'])
                    for frame in frames:
                        x,y=frame.info['anchor']
                        canvas.alpha_composite(frame,(133-x,170-y))
                    views.append((f'{label} · {bearing}',canvas.crop(canvas.getbbox())))
        else:
            for form in ('harbor-ferry','coastal-freighter'):
                for heading,bearing in enumerate(labels):
                    im=items[f'{form}-{heading}']
                    views.append((f'{form} · {bearing}',im.crop(im.getbbox())))
        sheet(views,review_path,zoom=2,columns=4,masters=False)
    for facing in (-1,1):
        for pose in range(25):items[f'wharf-crane-{facing}-{pose}']=harbor_crane(facing,pose)
    for name in ('pile','cleat','case','bollard'):
        im=Image.new('RGBA',(31,35));d=ImageDraw.Draw(im)
        if name=='pile':
            d.polygon([(8,7),(21,7),(21,29),(18,33),(9,32)],fill='#6c4835',outline='#433d37')
            d.rectangle((10,8,13,29),fill='#ab794d');d.line((15,10,14,19,15,26),fill='#82543b')
            d.rectangle((9,27,20,30),fill='#52463b')
            for y in (13,22):
                d.arc((7,y-3,22,y+3),0,180,fill='#323d3e',width=3)
                d.arc((7,y-4,22,y+2),35,160,fill='#a39879')
            d.ellipse((7,3,22,10),fill='#dfb97c',outline='#634b37');d.arc((10,4,19,8),135,460,fill='#ae8558')
        elif name=='bollard':
            d.ellipse((4,24,29,31),fill=(45,40,42,100))
            d.polygon([(3,23),(7,20),(20,20),(24,24),(21,28),(4,28)],fill='#585757',outline='#3e4344')
            for x in (6,19):d.point((x,24),fill='#ccc3a7')
            d.ellipse((8,20,19,25),fill='#32393b')
            d.rectangle((9,13,18,22),fill='#4d5353')
            d.line((10,14,10,21),fill='#919386',width=2)
            d.ellipse((6,10,21,17),fill='#333c40')
            d.ellipse((6,8,21,14),fill='#717a72',outline='#444b49')
            d.arc((7,9,20,13),160,300,fill='#cdc3a1')
        elif name=='cleat':
            d.ellipse((5,23,24,29),fill='#544f43');d.rectangle((11,17,18,26),fill='#595950',outline='#3e403d')
            d.rounded_rectangle((5,15,24,19),2,fill='#878779',outline='#404441');d.line((7,16,21,16),fill='#beb798')
        else:
            d.rectangle((4,14,23,30),fill='#a9703e',outline='#634332')
            d.polygon([(4,14),(9,10),(27,10),(23,14)],fill='#e7bd81',outline='#976a46')
            d.polygon([(23,14),(27,10),(27,26),(23,30)],fill='#855735',outline='#604534')
            for y in (18,23,28):d.line((5,y,22,y),fill='#8b5e3b')
            for x in (6,20):d.rectangle((x,15,x+1,28),fill='#e4b676')
            d.line((7,27,20,15),fill='#724b32',width=3);d.line((8,27,21,15),fill='#d9aa6e',width=2)
            d.rectangle((13,20,17,23),fill='#e1cca0');d.line((14,22,16,22),fill='#886d4c')
        im.info['anchor']=[15,30 if name in ('case','pile') else 26];items['harbor-'+name]=im
    im=Image.new('RGBA',(39,45));d=ImageDraw.Draw(im)
    d.ellipse((2,34,36,42),fill=(35,51,54,95))
    for x,y,lean in ((8,9,-3),(24,8,3),(16,4,0)):
        d.polygon([(x-4,y),(x+4,y),(x+lean+4,39),(x+lean-4,39)],fill='#825936',outline='#423e33')
        d.line((x-2,y+2,x+lean-2,35),fill='#c49662',width=2)
        d.polygon([(x+lean-4,32),(x+lean+4,31),(x+lean+4,39),(x+lean-4,39)],fill='#555342')
        d.ellipse((x-5,y-2,x+5,y+3),fill='#d9b078',outline='#70543a')
    for y in (16,19,23):
        d.line((4,y,13,y+2,22,y+2,30,y-1),fill='#4e4539',width=3)
        d.line((4,y-1,14,y+1,22,y+1,29,y-2),fill='#c5a57b')
    for xx,yy,length in ((1,39,5),(11,41,4),(24,39,7),(30,37,3)):
        d.line((xx,yy,xx+length,yy),fill=(172,204,191,195))
    im.info['anchor']=[17,38];items['harbor-dolphin']=im
    im=Image.new('RGBA',(27,24));d=ImageDraw.Draw(im)
    for y in (8,19):
        d.polygon([(3,y),(10,y-9),(16,y-9),(23,y),(19,y),(13,y-6),(9,y)],fill='#7c6251',outline='#423c39')
        d.line((4,y-1,11,y-8),fill='#bd9771',width=2)
    d.rectangle((10,2,16,15),fill='#875d43',outline='#503f38')
    d.line((10,2,10,14),fill='#dfb087',width=2)
    for y in (5,12):d.point((14,y),fill='#d2c1a4')
    im.info['anchor']=[13,15];items['harbor-buffer']=im
    truck=Image.new('RGBA',(66,43));d=ImageDraw.Draw(truck)
    d.ellipse((5,28,65,40),fill=(43,40,45,72))
    for x in (16,48):
        d.rectangle((x-3,24,x+3,32),fill='#424346')
        d.ellipse((x-5,27,x+5,37),fill='#393d40',outline='#49403b')
        d.ellipse((x-3,29,x+3,35),fill='#81756a')
        d.ellipse((x-1,30,x+1,33),fill='#c6aa83')
    d.polygon([(5,22),(13,14),(61,14),(55,23)],fill='#bf9466',outline='#6b5647')
    for x in range(14,56,7):d.line((x,22,x+6,15),fill='#987551')
    d.polygon([(5,22),(55,22),(55,28),(5,28)],fill='#854d37',outline='#544239')
    d.polygon([(55,22),(61,15),(61,21),(55,28)],fill='#634a3d')
    d.line((6,23,53,23),fill='#d29a65')
    for x in (9,25,41,52):d.point((x,26),fill='#c7ab81')
    for x,y in ((11,14),(5,22)):
        d.line((x,y,x-2,y-13),fill='#3a4544',width=2)
        d.line((x+1,y-1,x-1,y-12),fill='#99856b')
    d.line((3,9,9,2),fill='#584636',width=3)
    d.line((3,8,9,1),fill='#ba936c')
    truck.info['anchor']=[32,33];items['harbor-freight-truck']=truck
    laden=truck.copy()
    for x,y in ((14,20),(36,19)):
        laden.alpha_composite(items['harbor-case'],(x-4,y-29))
    laden.info['anchor']=[32,33];items['harbor-freight-truck-laden']=laden
    from art.props_b.vehicles import delivery_headings
    for era,paints in [('bonnet',('green','maroon','navy','olive')),('cabover',('teal','red','sky','orange'))]:
        for length in range(2):
            for v,paint in enumerate(paints):
                for heading,frame in enumerate(delivery_headings(era=='cabover',length,paint)):
                    items[f'harbor-lorry-{era}-{length}-{v}-{heading}']=frame
    im=Image.new('RGBA',(46,62));d=ImageDraw.Draw(im)
    oak,trim,light,green='#694634','#b69059','#e0c290','#334e42'
    d.ellipse((4,52,45,61),fill=(46,38,43,85))
    d.rectangle((6,19,36,56),fill=oak,outline='#3d3832')
    d.polygon([(36,20),(42,15),(42,51),(36,57)],fill='#4e3d32',outline='#3c3832')
    d.polygon([(38,26),(40,24),(40,37),(38,39)],fill='#657975')
    d.rectangle((10,22,32,39),fill='#333b38',outline=trim)
    d.polygon([(11,23),(18,23),(12,30),(11,30)],fill='#85958a')
    d.rectangle((21,23,31,38),fill='#45463c')
    d.polygon([(22,37),(23,34),(26,33),(29,34),(31,37)],fill='#697369')
    d.rectangle((24,27,28,33),fill='#c49c71')
    d.line((25,29,25,31),fill='#e9bd82');d.point((28,30),fill='#705336')
    d.polygon([(23,27),(24,24),(28,24),(30,27)],fill='#656b5d');d.line((23,27,30,27),fill='#3e4139')
    d.line((24,34,26,36,27,34),fill='#e0cba6')
    d.line((29,37,31,37),fill='#d9b284')
    for x in (11,13):d.line((x,32,x,37),fill='#908365')
    d.rectangle((12,35,16,37),fill='#b79765');d.line((12,35,15,35),fill='#e6ce9d')
    d.line((19,22,19,38),fill=trim,width=2)
    d.rectangle((6,39,36,42),fill='#684d35');d.line((5,39,37,39),fill=light,width=2)
    d.rectangle((12,44,30,52),fill=green,outline=trim)
    # A ticket and its perforated stub, legible below the window at native size.
    d.rectangle((16,46,26,50),fill='#e3c184');d.line((23,46,23,50),fill='#9b7755')
    for y in (47,49):d.point((16,y),fill=green)
    for x in (7,33):
        d.rectangle((x,20,x+2,55),fill=trim);d.line((x,21,x,54),fill='#cda873')
    d.rectangle((5,55,36,57),fill='#453d32');d.line((6,55,35,55),fill=trim)
    d.polygon([(1,22),(5,15),(22,3),(27,3),(44,16),(45,20),(36,23)],fill='#a39c80',outline='#524e44')
    d.polygon([(22,4),(7,20),(1,21),(5,16)],fill='#cbbd99')
    d.polygon([(25,4),(36,21),(44,19),(42,16)],fill='#777e70')
    for foot in (9,16,26,35):d.line((24,5,foot,20),fill='#706e5d');d.line((24,5,foot+1,19),fill='#c7bb96')
    d.line((2,21,35,22,44,19),fill='#e0cca3');d.line((2,23,35,24,44,21),fill='#514c3d',width=2)
    d.ellipse((21,1,26,5),fill='#857457',outline='#535145');d.point((23,2),fill=light)
    im.info['anchor']=[22,56];items['harbor-ticket-office']=im

    iron,edge,glint='#313c3b','#53605a','#a29d83'
    for form in ('panel','post','gate','gate-open'):
        gate=form.startswith('gate')
        im=Image.new('RGBA',(22 if gate else 16,32));d=ImageDraw.Draw(im)
        if not gate:
            d.rectangle((0,25,15,29),fill='#776e60')
            d.rectangle((0,25,15,26),fill='#b0a48a')
            for x in (1,5,9,13):
                d.line((x,9,x,24),fill=iron)
                d.line((x,11,x,15),fill=edge)
                d.polygon([(x,6),(x-1,10),(x+1,10)],fill=iron)
                d.point((x,7),fill=glint)
            for y in (12,21):
                d.line((0,y,15,y),fill=edge);d.line((0,y+1,15,y+1),fill=iron)
            if form=='post':
                d.rectangle((1,6,5,27),fill=iron)
                d.line((2,7,2,25),fill='#808776')
                for y in (5,23,26):d.rectangle((0,y,6,y+1),fill=edge)
                d.ellipse((0,1,6,7),fill=iron);d.line((2,2,4,2),fill=glint)
        else:
            for flip in (False,True):
                def xy(x,y):return (21-x if flip else x,y)
                end,dy=(4,-8) if form.endswith('open') else (10,0)
                for i in range(4):
                    t=i/3; x=round(2+(end-2)*t); y=round(dy*t)
                    d.line((xy(x,9+y-int(3*t)),xy(x,26+y)),fill=iron)
                for y in (12,23,26):
                    d.line((xy(2,y),xy(end,y+dy)),fill=edge if y==12 else iron)
                d.line((xy(2,10),xy(end,5+dy)),fill=iron,width=2)
                post=18 if flip else 0
                d.rectangle((post,5,post+3,28),fill=iron)
                d.line((post+1,5,post+1,25),fill='#818778')
                d.ellipse((post,2,post+3,6),fill=edge);d.point((post+1,3),fill=glint)
            if form=='gate':d.line((9,16,12,16),fill=trim)
        im.info['anchor']=[im.width//2,28];items['harbor-'+(form if gate else 'fence-'+form)]=im
    # Enamel departures clock above the chalkboard. A separate foot holds the board off the wet deck.
    im=Image.new('RGBA',(35,56));d=ImageDraw.Draw(im)
    for x in (7,24):
        d.polygon([(x,24),(x+3,24),(x+4,52),(x,54)],fill='#394c46',outline='#36413d')
        d.line((x+1,27,x+1,51),fill='#859383')
    d.rectangle((4,20,29,46),fill='#506c62',outline='#343f3d')
    d.rectangle((7,23,26,42),fill='#374441',outline='#ab956c')
    d.line((9,27,23,27),fill='#d8ccab')
    for x,y,length in ((10,31,6),(19,31,4),(10,34,5),(19,34,3),(10,38,7),(20,38,3)):
        d.line((x,y,x+length,y),fill='#a9afa0')
    d.polygon([(2,23),(5,19),(28,19),(32,23)],fill='#a9956d',outline='#4f584e')
    d.ellipse((8,3,25,20),fill='#666c56',outline='#36433e')
    d.ellipse((10,5,23,18),fill='#dfd1a7',outline='#9e976f')
    for x,y in ((16,6),(22,11),(16,17),(11,11)):d.point((x,y),fill='#696453')
    d.line((16,7,16,11,20,12),fill='#544e45')
    d.line((9,46,28,46),fill='#ada48a')
    im.info['anchor']=[17,53];items['harbor-departures']=im
    # Platform scale: cast base, timber load deck and tall enamel dial with a red needle.
    im=Image.new('RGBA',(63,58));d=ImageDraw.Draw(im)
    d.polygon([(3,43),(16,34),(54,34),(60,44),(49,53),(3,51)],fill='#525751',outline='#484a45')
    d.polygon([(4,42),(17,35),(55,35),(48,46),(4,46)],fill='#ad9068',outline='#776b56')
    for xx in range(12,46,7):d.line((xx,44,xx+10,37),fill='#806c51')
    d.line((5,47,47,47,56,38),fill='#c0ac87',width=2)
    d.polygon([(47,37),(48,14),(52,14),(54,36)],fill='#617064',outline='#3d4f47')
    d.line((49,16,49,35),fill='#a5a48a')
    d.ellipse((42,3,58,19),fill='#596758',outline='#3c4b42')
    d.ellipse((44,5,56,17),fill='#ddcda6',outline='#97977f')
    d.line((46,9,47,10),fill='#6d7265');d.line((54,8,53,9),fill='#6d7265')
    d.line((50,12,47,7),fill='#a0523f');d.point((50,12),fill='#654e42')
    for x,y in ((10,34),(25,39)):
        d.polygon([(x,y+5),(x+1,y-3),(x+5,y-8),(x+4,y-11),(x+9,y-10),(x+8,y-7),(x+14,y-3),(x+15,y+3),(x+12,y+6),(x+2,y+6)],fill='#b08e5f',outline='#6b5841')
        d.line((x+4,y+2,x+4,y-1,x+7,y-5),fill='#d7b881',width=2)
        d.line((x+6,y-8,x+10,y-8),fill='#635543');d.line((x+10,y+4,x+13,y+2),fill='#826b4f')
    im.info['anchor']=[30,50];items['harbor-platform-scale']=im
    from art.shadows import sprite_cast
    from art.stamp import write_stamp
    phases=json.loads((ROOT/'src/content/graphics/lighting.json').read_text())
    for key,im in list(items.items()):
        if key.startswith(('harbor-lorry','harbor-ticket-office','harbor-fence','harbor-gate')):
            im.info['shadowAnchor']=im.info['anchor']
            im.info['upright']=False
            items.update(sprite_cast(key,im,None,phases))
    pack_atlas(items,ROOT/'public/packs','harbor',2048)
    write_stamp(ROOT)

if __name__=='__main__':
    if sys.argv[1:2]==['build']:build()
    elif sys.argv[1:2]==['harbor']:harbor_art(sys.argv[2] if len(sys.argv)>2 else None,sys.argv[3:4]==['dhow'])
    elif sys.argv[1:2]==['nile']:painted_review(sys.argv[2] if len(sys.argv)>2 else 'artifacts/boats/nile-eight-directions.png','papyrus')
    elif sys.argv[1:2]==['painted']:painted_review(sys.argv[2] if len(sys.argv)>2 else 'artifacts/boats/wasen-painted.png')
    elif sys.argv[1:2]==['hulls']:hulls(sys.argv[2] if len(sys.argv)>2 else 'artifacts/boats/hulls.png')
    elif sys.argv[1:2]==['proposals']:proposals(sys.argv[2] if len(sys.argv)>2 else 'artifacts/boats/next-two.png')
    else:review(sys.argv[1] if len(sys.argv)>1 else 'artifacts/boats/clinker.png')
