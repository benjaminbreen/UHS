"""A shared clinker hull baked at eight headings into depth-layered pixel sprites."""
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


def seat_screen(heading):
    return [0, -2*SCALE, 0]


FINISHES = {
    'clinker': [('Oak', {}), ('Tar-darkened', {'oak':ramp(48,.035,lift=-.26),'cedar':ramp(48,.045,lift=-.2)}),
                ('Weathered', {'oak':ramp(65,.035,lift=-.12),'cedar':ramp(60,.04,lift=-.08)})],
    'wasen': [('Warm timber', {}), ('Pale timber', {'oak':RAMPS['pine'],'cedar':RAMPS['pine']}),
              ('Weathered timber', {'oak':ramp(67,.025,lift=-.1),'cedar':ramp(65,.035,lift=-.04)})],
    'papyrus': [('Olive-gold reeds', {'thatch':ramp(94,.065,lift=-.02)}),
                ('Dry straw reeds', {}), ('Weathered reeds', {'thatch':ramp(78,.035,lift=-.04)})],
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
    c = C(W, H)
    depth = np.full((H, W), np.inf)
    palette = {**RAMPS, **FINISHES[form][finish][1]}
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
            taper=max(0,math.sin(math.pi*t))**.6
            width=3.1*taper+extra
            return ((t-.5)*92,j*5.4*taper+width*math.cos(a),
                    5+21*abs(2*t-1)**4+(3.1*taper+extra)*math.sin(a))
        for j in range(-2,3):
            for k in range(32):
                for m in range(8):
                    a=m*math.tau/8;b=(m+1)*math.tau/8
                    quad(bundle(k/32,a,j),bundle((k+1)/32,a,j),
                         bundle((k+1)/32,b,j),bundle(k/32,b,j),'thatch')
            for t in (.12,.29,.49,.7,.87):
                for m in range(12):
                    a=m*math.tau/12;b=(m+1)*math.tau/12
                    quad(bundle(t-.006,a,j,.35),bundle(t+.006,a,j,.35),
                         bundle(t+.006,b,j,.35),bundle(t-.006,b,j,.35),'cedar')
        # A paddle and a shallow-water pole, rather than rowlocks and benches.
        box(-30,6,9,62,.8,.8)
        quad((25,4.5,10),(35,3.5,10),(35,8,10),(25,7,10),'cedar')
        box(-34,-8,9,66,.7,.7)
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
    if form=='wasen' and facing==1:
        c.im,depth=wasen_ne_master(palette,depth);c.px=c.im.load()
    if form=='wasen' and facing!=1:
        # Outline pixels inherit the depth of the solid edge they extend.
        alpha=np.array(c.im)[:,:,3]>0
        for y in range(1,H-1):
            for x in range(1,W-1):
                if alpha[y,x]:continue
                for dx,dy in ((0,1),(1,0),(-1,0),(0,-1)):
                    if alpha[y+dy,x+dx]:
                        c.p(x,y,palette['oak'][6]);depth[y,x]=depth[y+dy,x+dx]
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
    sprites={}
    catalog={}
    for form,finishes,moorings in [
        ('clinker',[''],{'worksite-fishing-boat':4,'worksite-fishing-boat-north':0,
                         'worksite-fishing-boat-east':2,'worksite-fishing-boat-west':6}),
        ('wasen',['','-pale','-weathered'],{'worksite-plank-skiff':4,'worksite-plank-skiff-north':0,
                                         'worksite-plank-skiff-east':2,'worksite-plank-skiff-west':6})]:
        for finish,name in enumerate(finishes):
            for f in range(8):
                for suffix,im in zip(('', '-back','-front'),layers(f,form,finish)):
                    im.info['anchor']=[W//2,BASE]
                    im.info['trim']=True
                    sprites[f'boat-{form}{name}-{f}{suffix}']=im
        catalog[form]={'size':[W,H],'anchor':[W//2,BASE],
            'seat':{str(f):seat_screen(h) for f,h in FACINGS.items()},'length':6,'beam':2,
            'finishes':finishes,'moorings':moorings}
    pack_atlas(sprites,ROOT/'public/packs','boats',1024)
    (ROOT/'src/content/graphics/boats.generated.json').write_text(json.dumps(catalog,indent=2)+'\n')
    write_stamp(ROOT)


def painted_review(out):
    items=[]
    for f in range(8):
        im,_,_=layers(f,'wasen')
        items.append((f'{("N","NE","E","SE","S","SW","W","NW")[f]} / Japanese fishing boat',im))
    for finish,(label,_) in enumerate(FINISHES['wasen']):
        im,_,_=layers(1,'wasen',finish)
        items.append((label,im))
    sheet(items,out,columns=4)


def proposals(out):
    items=[]
    for form,title in [('wasen','Edo Japan · c.1800'),('papyrus','Nile · c.2000 BCE')]:
        for f in (2,1):
            for finish,(label,_) in enumerate(FINISHES[form]):
                full,_,_=layers(f,form,finish)
                items.append((f'{title} / {label} / {("NE" if f==1 else "E")}',full))
    sheet(items,out,columns=3)


def review(out):
    items=[]
    for f in range(8):
        full,back,front=layers(f)
        items.append((f'{("N","NE","E","SE","S","SW","W","NW")[f]} · clinker boat',full))
    sheet(items,out,columns=4)


if __name__=='__main__':
    if sys.argv[1:2]==['build']:build()
    elif sys.argv[1:2]==['painted']:painted_review(sys.argv[2] if len(sys.argv)>2 else 'artifacts/boats/wasen-painted.png')
    elif sys.argv[1:2]==['proposals']:proposals(sys.argv[2] if len(sys.argv)>2 else 'artifacts/boats/next-two.png')
    else:review(sys.argv[1] if len(sys.argv)>1 else 'artifacts/boats/clinker.png')
