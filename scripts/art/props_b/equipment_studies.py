"""Review-only equipment constructions; native pixels in the house projection.

Called by props_b.review --equipment-abc. A always comes from the shipped atlas.
B refines the existing construction, C explores a different working form.
No atlas or live selection is changed by this module.

Construction references (forms are interpreted, not site facsimiles):
https://pompeiisites.org/wp-content/uploads/A-Guide-to-the-Pompeii-Excavations-2.pdf
https://historicengland.org.uk/images-books/publications/iha-preindustrial-ironworks/heag221-pre-industrial-ironworks/
https://exhibits.museogalileo.it/archimedes/object/ScrewPress.html
"""
import math
from PIL import Image, ImageDraw
from art.front_materials import C, RAMPS, ramp
from art import front_solid as so

STONE = RAMPS['grey-limestone']
CLAY = RAMPS['terracotta']
MUD = RAMPS['adobe']
WOOD = RAMPS['oak']
IRON = RAMPS['lead']
BLACK_IRON = ramp(255,.016,lift=-.24)
DARK = (46, 32, 34, 255)
ASH = [(59, 53, 54, 255), (88, 78, 73, 255), (125, 113, 99, 255), (161, 148, 128, 255)]
WATER = [(35, 61, 66, 255), (49, 85, 88, 255), (71, 113, 113, 255), (115, 155, 145, 255)]

def line(c, pts, col, width=1):
    ImageDraw.Draw(c.im).line(pts, fill=col, width=width)

def poly(c, pts, col):
    ImageDraw.Draw(c.im).polygon(pts, fill=col)

def ellipse(c, rect, col):
    ImageDraw.Draw(c.im).ellipse(rect, fill=col)

def finish(c, anchor):
    """One four-connected exterior pixel, coloured from the adjacent material.
    Never resize a source sprite or expand an outline more than once."""
    src = c.im.copy(); px=src.load()
    edge={}
    for y in range(src.height):
        for x in range(src.width):
            col=px[x,y]
            if not col[3]:continue
            # Hue follows the touched material; contour is one value below shade.
            rim=tuple(round(v*.48) for v in col[:3])+(255,)
            for dx,dy in ((-1,0),(1,0),(0,-1),(0,1)):
                xx,yy=x+dx,y+dy
                if 0<=xx<src.width and 0<=yy<src.height and not px[xx,yy][3]:edge[(xx,yy)]=rim
    for (x,y),col in edge.items():c.p(x,y,col)
    box=c.im.getbbox(); im=c.im.crop(box)
    im.info['anchor']=[anchor[0]-box[0],anchor[1]-box[1]]
    return im

def beam(c,x,y,w,h,r=WOOD):
    """A straight square-on timber with a small horizontal top, no side face."""
    c.rect(x,y,w,h,r[4]);c.rect(x,y,w,1,r[2]);c.rect(x,y+h-1,w,1,r[6])
    c.rect(x,y,1,h,r[3]);c.rect(x+w-1,y,1,h,r[6])
    if w>h:
        for a,b,dy in ((3,11,2),(16,24,3),(31,41,2),(50,59,3),(67,75,2)):
            if a<w-2:line(c,[(x+a,y+min(dy,h-2)),(x+min(b,w-3),y+min(dy,h-2))],r[5])
    else:
        for yy in range(y+5,y+h-3,11):line(c,[(x+2,yy),(x+2,yy+4)],r[5])

def slab(c,x,by,w,h,d,r=STONE,brick=False):
    fy,ty=so.box(c,x,by,w,h,d,r)
    for yy in range(fy,by):
        row=(yy-fy)//(4 if brick else 6)
        course=4 if brick else 6; block=9 if brick else 14
        for xx in range(x,x+w):
            q=3+(xx>x+w*.66)+(yy>by-3)
            seam=(yy-fy)%course==course-1 or (xx-x+(row%2)*(block//2))%block==0
            c.p(xx,yy,r[min(6,q+1)] if seam else r[q])
    c.rect(x,fy-1,w,1,r[1]);c.rect(x,by-1,w,1,r[6])

def masonry(r,course=5,block=10):
    def texture(x,y,z,q):
        row=math.floor(z/course)
        a=math.atan2(y,x)
        # Equal physical joints round the cylinder, with alternate courses offset.
        u=a*max(8,math.hypot(x,y))+(row%2)*block/2
        seam=z%course<.65 or u%block<.65
        return r[min(6,q+1)] if seam else r[min(6,q)]
    return texture

def arch(c,cx,base,rx,h,r=STONE,glow=False):
    """A recessed front opening: one dark reveal, radial masonry above it."""
    spring=base-h+rx
    for yy in range(base-h-3,base+1):
        for xx in range(cx-rx-3,cx+rx+4):
            dx=xx-cx;dy=yy-spring
            inside=(abs(dx)<=rx and yy>=spring) or (dy<0 and dx*dx+dy*dy<=rx*rx)
            outer=(abs(dx)<=rx+3 and yy>=spring) or (dy<0 and dx*dx+dy*dy<=(rx+3)**2)
            if inside:
                c.p(xx,yy,DARK if xx<cx+rx-1 else r[6])
                if yy>base-3:c.p(xx,yy,(115,55,35,255) if glow else r[6])
            elif outer and yy<base:
                q=3 if dx<0 else 5
                if dy<0:
                    a=math.atan2(dy,dx)
                    if ((a+math.pi)*max(rx,5))%5<.8:q=6
                c.p(xx,yy,r[q])
    if glow:
        for x,y in [(cx-3,base-1),(cx,base-2),(cx+2,base-1)]:
            c.p(x,y,(230,132,58,255));c.p(x,y-1,(171,71,37,255))
    line(c,[(cx-rx-2,base),(cx+rx+2,base)],r[2])

def log(c,a,b):
    line(c,[a,b],WOOD[6],4);line(c,[(a[0],a[1]-1),(b[0],b[1]-1)],WOOD[3],2)
    x,y=a;ellipse(c,(x-2,y-2,x+2,y+2),WOOD[2]);c.p(x,y,WOOD[5])

def hearth(variant='b'):
    c=C(72,64);cx,by=34,48
    ellipse(c,(12,37,56,58),ASH[1]);ellipse(c,(15,39,53,55),ASH[0])
    # Rear stones first; the front kerb is drawn over fuel and fire.
    stones=[(16,43,5),(25,39,5),(37,39,6),(48,43,5),(14,49,5),(53,49,4),(22,54,6),(35,56,6),(47,54,5)]
    def rock(x,y,r):
        so.lathe(c,x,y,[(0,r*.7),(2,r),(4,r*.85),(5,r*.4)],STONE, bias=-.1)
    for x,y,r in stones[:4]:rock(x,y,r)
    log(c,(22,49),(43,42));log(c,(45,50),(26,43))
    # Shape the flame with authored stepped clusters, not a gradient or noise.
    poly(c,[(22,45),(21,40),(24,36),(24,31),(28,35),(29,24),(33,29),(34,34),(39,29),(38,37),(43,34),(45,41),(43,46)],(168,61,32,255))
    poly(c,[(25,44),(24,39),(28,40),(30,31),(33,36),(34,41),(38,34),(38,40),(42,39),(41,45)],(232,133,45,255))
    poly(c,[(29,44),(29,39),(32,41),(34,37),(37,43),(39,44)],(250,207,100,255))
    for x,y,r in stones[4:]:rock(x,y,r)
    if variant=='c':
        # Three-stone cooking hearth: supports actually reach the pot.
        c=C(72,64)
        ellipse(c,(11,42,58,57),ASH[2]);ellipse(c,(17,44,53,54),ASH[0])
        log(c,(9,48),(32,47));log(c,(58,44),(39,48));log(c,(32,59),(34,49))
        for x,y,r in [(34,42,6),(20,51,6),(48,51,6)]:
            so.lathe(c,x,y,[(0,r*.75),(3,r),(8,r*.7),(9,r*.4)],STONE)
        for x in [25,40]:
            poly(c,[(x-3,50),(x-4,44),(x,37),(x+1,43),(x+4,47),(x+2,51)],(211,103,38,255))
            poly(c,[(x-1,49),(x,43),(x+2,48)],(248,193,81,255))
        pot=[(45,37,39,255),(66,48,42,255),(90,62,47,255),(120,82,55,255),(151,110,72,255),(184,146,99,255),(209,181,131,255),(227,208,167,255)][::-1]
        so.lathe(c,34,48,[(10,7),(12,10),(18,12),(24,11),(29,7),(30,7.8)],pot,
                 hollow=(6.1,22),inside=pot)
        # Thick folded clay ear handles, without closing their holes.
        for side in [-1,1]:
            x=34+side*11
            line(c,[(x,24),(x+side*4,23),(x+side*5,27),(x+side*2,30)],pot[5],2)
            c.p(x+side*3,24,pot[2])
        line(c,[(31,13),(30,10),(32,7)],ASH[3]);line(c,[(38,12),(39,9)],ASH[2])
    return finish(c,(34,52))

def oven(variant='b'):
    c=C(86,84);cx,by=41,69
    if variant=='b':
        slab(c,12,by,58,16,28,STONE)
        # Plaster dome rises out of its own elliptical foot on the baking slab.
        so.lathe(c,cx,by-18,[(0,24),(3,25),(9,24),(16,21),(22,17),(27,11),(30,3)],MUD,
                 surface=lambda x,y,z,q:MUD[min(6,q+(z<7 and y<0))])
        arch(c,cx,by-17,10,18,CLAY,True)
        # Soot follows the rising hot stream, not a black polygon pasted on top.
        for dx,dy,length in [(-7,-35,2),(-4,-39,3),(1,-41,2),(5,-38,3)]:
            line(c,[(cx+dx,by+dy),(cx+dx+1,by+dy-length)],MUD[5])
        # Repaired plaster exposes a small run of fired brick near the foot.
        for x,y in [(21,48),(22,52),(59,49)]:
            line(c,[(x,y),(x+4,y)],CLAY[4]);line(c,[(x,y+1),(x+4,y+1)],CLAY[5])
        # The landing projects, with the same horizontal front as the plinth.
        slab(c,25,by-10,32,3,12,STONE)
        c.rect(30,by-17,22,1,(96,65,46,255))
        arch(c,cx,by-2,7,9,STONE)
        line(c,[(20,by-14),(24,by-14)],STONE[2])
    else:
        # A brick barrel-vault bake oven: rectangular working face, a deep crown.
        slab(c,11,by,62,20,27,STONE)
        so.vault(c,cx,by-20,27,25,CLAY,face=RAMPS['roman-brick'],rings=999)
        # Continuous arch courses on the crown, rather than subpixel ray-march
        # rings (which break into a noisy checkerboard on a small vault).
        for depth in [5,12,19]:
            for xx in range(cx-26,cx+27):
                dx=xx+.5-cx; z=math.sqrt(max(0,27*27-dx*dx))
                yy=round(by-20-z-depth*.5)
                q=so.tone((dx/27,0,z/27))
                c.p(xx,yy,CLAY[min(6,q+1)])
        for depth in [8,15,22]:
            for dx in range(-23+(depth//7%2)*3,25,8):
                z=math.sqrt(27*27-dx*dx);yy=round(by-20-z-depth*.5)
                line(c,[(cx+dx,yy),(cx+dx,yy+2)],CLAY[4])
        # Brick joints on the round front face, clipped to that face.
        for yy in range(by-46,by-20):
            dy=by-20-yy
            half=math.sqrt(max(0,27*27-dy*dy))
            for xx in range(round(cx-half+1),round(cx+half)):
                if yy%4==0 or (xx+(yy//4%2)*5)%10==0:c.p(xx,yy,CLAY[5])
        # Short flue at the back of the crown; capped course and dark throat.
        slab(c,53,by-43,12,17,9,RAMPS['roman-brick'],True)
        c.rect(55,by-65,8,2,DARK)
        line(c,[(53,by-66),(64,by-66)],CLAY[2])
        arch(c,cx,by-20,12,19,STONE,True)
        slab(c,23,by-15,36,4,12,STONE)
        arch(c,cx,by-1,10,12,STONE)
        # Two horizontal log ends in the dry lower recess.
        log(c,(35,by-4),(45,by-6));log(c,(38,by-2),(48,by-4))
    return finish(c,(cx,by))

def kiln(variant='b'):
    c=C(86,98);cx,by=41,78
    if variant=='b':
        # A clay updraft kiln: pear-shaped chamber and a distinct stoking tunnel.
        so.lathe(c,cx,by-2,[(0,23),(5,25),(17,24),(29,21),(39,16),(47,10),(50,6)],CLAY,
                 surface=lambda x,y,z,q:CLAY[min(6,q+(28<z<29.3))])
        so.lathe(c,cx,by-2,[(49,6),(54,5.5),(55,6)],RAMPS['brick-dark'],hollow=(3.8,48))
        # Loading hatch above the firebox, a fitted clay plug with a dark seam.
        arch(c,cx,by-25,8,15,CLAY)
        poly(c,[(35,51),(35,44),(38,41),(43,41),(46,44),(46,51)],CLAY[4])
        line(c,[(36,44),(38,42),(42,42)],CLAY[2])
        c.rect(39,46,5,2,CLAY[6]);c.p(39,45,CLAY[2])
        # Thick firebox lintel, glowing deeply inside rather than an exterior flame.
        arch(c,cx,by-2,8,15,RAMPS['brick-dark'],True)
        slab(c,28,by+3,26,3,7,RAMPS['brick-dark'])
        # Sparse drying / firing cracks follow the curved shell.
        for pts in [[(26,43),(27,48),(25,51)],[(56,52),(54,56),(55,60)],[(33,32),(35,35),(34,38)]]:
            line(c,pts,CLAY[5])
    else:
        # Masonry updraft kiln: courses wrap around the chamber instead of a box.
        r=RAMPS['roman-brick']
        so.lathe(c,cx,by-1,[(0,26),(5,27),(34,27),(40,25),(46,21),(51,15),(54,7)],r,
                 surface=masonry(r,4,9))
        so.lathe(c,cx,by-1,[(54,7),(60,6),(61,7)],RAMPS['brick-dark'],hollow=(4.5,54))
        arch(c,cx,by-25,10,20,STONE)
        # Brick closure of the loading door: smaller bricks, recessed as one panel.
        for yy in range(by-42,by-26):
            for xx in range(cx-8,cx+9):
                if c.g(xx,yy)==DARK:
                    row=(yy-(by-42))//4
                    seam=(yy-(by-42))%4==3 or (xx+row%2*4)%8==0
                    c.p(xx,yy,r[6] if seam else r[4 if xx<cx else 5])
        arch(c,cx,by-1,9,16,STONE,True)
        slab(c,25,by+4,32,4,9,STONE)
        # Repairs interrupt, rather than obliterate, the running bond.
        for x,y in [(20,51),(59,41),(62,61)]:
            line(c,[(x,y),(x+3,y)],MUD[3]);c.p(x+1,y+1,MUD[4])
    return finish(c,(cx,by+3))

def bellows(c,x,by,w=22):
    leather=RAMPS['cedar']
    # Wedge bellows on two boards, nose attached to a clay tuyere.
    poly(c,[(x,by-4),(x+3,by-13),(x+w-4,by-11),(x+w,by-4),(x+w-3,by)],leather[5])
    poly(c,[(x+3,by-12),(x+w-5,by-10),(x+w-1,by-5),(x+1,by-5)],leather[3])
    line(c,[(x+1,by-8),(x+w-3,by-6)],leather[6])
    line(c,[(x+1,by-3),(x+w-3,by-1)],WOOD[2],2)
    line(c,[(x+3,by-13),(x+w-5,by-11),(x+w-3,by-9)],WOOD[3],2)
    beam(c,x+7,by-21,3,11)
    line(c,[(x+5,by-21),(x+13,by-21)],WOOD[2],2)
    for xx in range(x+4,x+w-3,4):c.p(xx,by-4,leather[2])

def bloomery(variant='b'):
    c=C(94,96);by=81
    if variant=='b':
        cx=34
        so.lathe(c,cx,by,[(0,17),(5,18),(12,15),(30,11),(46,8),(53,7),(54,8)],MUD,
                 hollow=(5,43),inside=RAMPS['brick-dark'])
        # Clay repairs and heat cracks, following the shaft's taper.
        for pts in [[(25,44),(27,48),(26,51)],[(39,54),(41,59),(40,64)],[(31,33),(32,37)]]:
            line(c,pts,MUD[5])
        arch(c,cx,by-2,6,11,RAMPS['brick-dark'],True)
        # Separate air entry, so the blower is not plugged into the slag door.
        line(c,[(47,by-13),(61,by-11)],CLAY[6],4)
        line(c,[(47,by-14),(61,by-12)],CLAY[3],2)
        bellows(c,61,by-5,22)
        # Slag flows from the front tap; cooled crust has a restrained metallic edge.
        poly(c,[(31,79),(36,78),(39,82),(36,85),(28,85),(23,88),(17,87),(20,84),(28,83)],IRON[6])
        line(c,[(31,81),(35,82),(30,84),(24,84)],(149,76,47,255))
        line(c,[(21,86),(26,85)],IRON[3])
    else:
        cx=37;r=STONE
        # Low drystone-clad shaft furnace. A square throat and stone cap make
        # this recognisably different from the clay, open-topped kiln above.
        slab(c,17,by,40,43,28,r)
        slab(c,20,by-41,34,12,23,r)
        slab(c,17,by-53,40,4,29,r)
        # Recess in the horizontal cap: far lining then the black charge shaft.
        c.rect(26,by-69,22,9,r[5]);c.rect(28,by-67,18,6,DARK)
        line(c,[(26,by-69),(47,by-69)],r[2])
        line(c,[(29,by-62),(45,by-62)],(104,58,43,255))
        arch(c,cx,by-1,9,17,RAMPS['brick-dark'],True)
        # Soot is concentrated around the hot lower working opening.
        line(c,[(27,by-18),(29,by-22),(28,by-25)],r[6])
        line(c,[(49,by-17),(48,by-22)],r[6])
        line(c,[(55,by-13),(65,by-11)],CLAY[5],4)
        line(c,[(55,by-14),(65,by-12)],CLAY[2])
        bellows(c,65,by-5,23)
        poly(c,[(31,80),(39,80),(42,84),(36,87),(23,87),(20,84)],IRON[6])
        line(c,[(27,84),(31,83),(36,84)],IRON[4])
        c.p(37,82,(172,86,48,255))
    return finish(c,(39,by+3))

def lever_press(variant='b'):
    c=C(112,96);by=80
    fiber=RAMPS['thatch']
    if variant=='b':
        # Long lever seen in elevation: no oblique side face, weight at free end.
        slab(c,8,by,21,7,14,STONE)
        beam(c,12,14,7,by-16)
        beam(c,23,14,7,by-16)
        beam(c,10,13,22,6)
        for yy in [26,43,61]:
            c.rect(14,yy,3,3,WOOD[6]);c.p(14,yy,WOOD[2])
            c.rect(25,yy,3,3,WOOD[6]);c.p(25,yy,WOOD[2])
        # Draining bed, raised on its own stone pedestal.
        so.lathe(c,51,by-1,[(0,16),(5,17),(8,22),(11,22)],STONE,hollow=(18,8))
        for z in [13,17,21,25]:
            so.lathe(c,51,by-1,[(z,14),(z+1,16),(z+3,15)],fiber,
                     surface=lambda x,y,z,q:fiber[min(6,q+(math.atan2(y,x)*16/math.tau%1<.15))])
        # Broad pressing follower, in contact with the baskets and lever.
        slab(c,35,by-28,32,4,15,WOOD)
        beam(c,47,39,8,10)
        poly(c,[(18,29),(98,42),(98,48),(18,35)],WOOD[5])
        line(c,[(18,29),(98,42)],WOOD[2]);line(c,[(18,35),(98,48)],WOOD[6])
        line(c,[(38,34),(49,36)],WOOD[4]);line(c,[(69,39),(87,42)],WOOD[4])
        # Pivot pin passes through the fixed timber cheek.
        ellipse(c,(20,30,24,34),WOOD[2]);c.p(22,32,WOOD[6])
        line(c,[(95,47),(95,64)],fiber[6]);line(c,[(97,47),(97,64)],fiber[3])
        slab(c,84,by-1,24,13,15,STONE)
        c.rect(91,by-11,10,4,STONE[6]);line(c,[(93,by-10),(99,by-10)],STONE[3])
        # Drain and a small receiver, inseparable from the press's function.
        line(c,[(71,by-7),(77,by-7),(78,by-4)],STONE[5],3)
        line(c,[(72,by-8),(77,by-8)],STONE[2])
        so.lathe(c,77,by+8,[(0,4),(2,6),(6,6),(8,4),(9,4.8)],CLAY,hollow=(3.3,4))
    else:
        # Twin-post screw press, later regional/period alternative, not a
        # claim that the same screw construction belongs to every olive press.
        slab(c,18,by,69,7,22,STONE)
        for x in [23,75]:
            beam(c,x,15,7,61)
            beam(c,x-4,73,15,5)
            # Cross pins and mortises remain distinct from the wood grain.
            for yy in [25,66]:c.rect(x+2,yy,3,2,WOOD[6]);c.p(x+2,yy,WOOD[2])
        beam(c,17,13,71,10)
        beam(c,27,65,50,5)
        # Screw in the crosshead; diagonal thread crests are one pixel wide.
        beam(c,48,23,9,25)
        for yy in range(25,47,3):
            line(c,[(49,yy+1),(55,yy-1)],WOOD[2]);line(c,[(49,yy+2),(55,yy)],WOOD[6])
        beam(c,43,45,19,4)
        line(c,[(35,39),(69,39)],WOOD[6],3);line(c,[(35,38),(69,38)],WOOD[2])
        c.rect(34,37,3,4,WOOD[4]);c.rect(68,37,3,4,WOOD[4])
        slab(c,29,by-3,47,4,26,STONE)
        # Slatted pressing basket and iron hoops on a separate drain board.
        so.lathe(c,52,by-7,[(4,18),(7,19),(23,18)],WOOD,
                 surface=lambda x,y,z,q:WOOD[min(6,q+(math.atan2(y,x)*22/math.tau%1<.15))])
        for z in [9,19]:
            # Only the visible front arc; a solid disk here would cover the basket.
            for a in range(180,361,3):
                t=math.radians(a)
                x=52+19*math.cos(t); y=by-7-z-9*math.sin(t)
                c.p(x,y,IRON[4]);c.p(x,y+1,IRON[6])
        slab(c,32,by-29,40,4,17,WOOD)
        line(c,[(73,by-8),(82,by-8),(84,by-5)],STONE[5],3)
        so.lathe(c,86,by+6,[(0,4),(2,6),(6,6),(8,4),(9,4.8)],CLAY,hollow=(3.3,4))
    return finish(c,(55,by+2))

def trough(variant='b'):
    c=C(94,65);by=48
    if variant=='b':
        # Two trestle feet, pinned end boards and fitted front planks.
        for x in [16,68]:
            beam(c,x,37,9,14)
            beam(c,x-3,49,15,3)
        poly(c,[(11,20),(17,13),(72,13),(79,20),(79,45),(11,45)],WOOD[4])
        poly(c,[(12,20),(18,14),(71,14),(78,20),(78,30),(12,30)],WOOD[2])
        # Inner basin: back lining is in shade; water sits below the lip.
        poly(c,[(19,18),(70,18),(73,22),(73,28),(17,28),(17,22)],WOOD[6])
        poly(c,[(20,22),(69,22),(73,25),(70,29),(19,29),(16,25)],WATER[1])
        line(c,[(21,24),(37,24)],WATER[3]);line(c,[(49,26),(63,26)],WATER[2])
        for yy in range(30,45):
            q=3 if yy<34 else 4 if yy<40 else 5
            c.rect(11,yy,69,1,WOOD[q])
        for yy in [35,41]:line(c,[(12,yy),(78,yy)],WOOD[6])
        line(c,[(13,31),(77,31)],WOOD[2])
        for a,b,y in [(23,34,33),(45,61,38),(27,38,43),(55,68,33)]:line(c,[(a,y),(b,y)],WOOD[5])
        for x in [11,74]:
            beam(c,x,20,6,27)
            # End board grain, pegs and bottom bevel.
            for yy in [26,39]:
                c.p(x+2,yy,IRON[6]);c.p(x+2,yy-1,IRON[2])
        line(c,[(13,20),(18,14),(71,14),(77,20)],WOOD[1])
        line(c,[(17,29),(73,29)],WOOD[6])
        # Two narrow iron straps lie on the face, not black bands around it.
        for x in [22,65]:
            c.rect(x,30,2,15,IRON[5]);c.p(x,32,IRON[2]);c.p(x,42,IRON[2])
    else:
        r=RAMPS['limestone']
        # A single dressed stone, naturally rounded ends; its cavity is carved
        # into the top, not a flat blue stripe sitting on a stone wall.
        poly(c,[(9,22),(15,17),(75,17),(82,22),(82,38),(76,44),(16,44),(9,38)],r[4])
        poly(c,[(10,23),(15,18),(75,18),(81,23),(81,28),(76,34),(15,34),(10,28)],r[2])
        for yy in range(33,44):
            inset=1 if yy<39 else 3 if yy<42 else 6
            c.rect(9+inset,yy,74-2*inset,1,r[3 if yy<37 else 4 if yy<41 else 5])
        # Rounded rectangle opening has a complete far lip and dark inside wall.
        ImageDraw.Draw(c.im).rounded_rectangle((17,21,74,32),radius=5,fill=r[6])
        ImageDraw.Draw(c.im).rounded_rectangle((19,25,72,32),radius=3,fill=WATER[1])
        line(c,[(23,27),(38,27)],WATER[3]);line(c,[(50,29),(65,29)],WATER[2])
        # Front lip overlaps the sunk water; square-front face stays unsheared.
        line(c,[(15,33),(76,33)],r[1]);line(c,[(17,34),(74,34)],r[4])
        line(c,[(11,24),(15,20),(74,20),(79,24)],r[1])
        # Short chisel runs, a worn corner and an old plugged drain.
        for x,y,l in [(20,37,4),(36,40,5),(62,37,4),(26,42,3),(69,41,2)]:
            line(c,[(x,y),(x+l,y)],r[4]);c.p(x,y-1,r[2])
        c.rect(69,36,4,4,r[5]);line(c,[(70,37),(72,37)],r[3])
        line(c,[(15,43),(19,43)],r[6]);line(c,[(73,43),(77,41)],r[6])
        # Small stone supports, visible clear of the carved body.
        slab(c,17,52,13,5,6,r);slab(c,63,52,13,5,6,r)
    return finish(c,(45,by+3))

def tannur(variant='b'):
    c=C(54,54);cx,by=26,40
    if variant=='b':
        so.lathe(c,cx,by,[(0,7),(3,9),(10,8.5),(17,7),(18,7.5)],MUD,
                 hollow=(4.7,4),inside=RAMPS['brick-dark'])
        arch(c,cx,by-1,2,4,CLAY,True)
        line(c,[(31,27),(32,30),(31,32)],MUD[5])
        line(c,[(20,34),(22,35)],MUD[3])
    else:
        slab(c,10,by,32,12,18,MUD)
        so.lathe(c,cx,by-16,[(0,8),(2,8.5),(3,8)],CLAY,
                 hollow=(5.5,0),inside=RAMPS['brick-dark'])
        arch(c,cx,by-1,3,6,RAMPS['brick-dark'],True)
        line(c,[(14,35),(17,35)],MUD[5])
        line(c,[(37,29),(38,32)],MUD[4])
    return finish(c,(cx,by))


def kettle(c,cx,by,metal=BLACK_IRON):
    # A household kettle: ~28 cm body diameter, ~35 cm including the handle.
    so.lathe(c,cx,by,[(0,1.8),(1,2.8),(2.5,3.2),(4,2.7),(5,1.8)],metal)
    so.lathe(c,cx,by,[(5,2.3),(5.7,1.5),(6,1)],metal)
    c.p(cx,by-6,WOOD[4])
    line(c,[(cx-3,by-3),(cx-3,by-7),(cx-1,by-8),(cx+2,by-8),(cx+3,by-6),(cx+3,by-3)],metal[4])
    line(c,[(cx+3,by-2),(cx+5,by-3),(cx+6,by-5)],metal[4],2)
    c.p(cx+5,by-4,metal[2]);c.p(cx+6,by-5,metal[6])


def stove(variant='b'):
    c=C(58,60);cx,by=28,47
    if variant=='b':
        slab(c,13,by,30,18,12,RAMPS['roman-brick'],True)
        slab(c,12,by-18,32,2,14,BLACK_IRON)
        ellipse(c,(33,by-24,40,by-21),BLACK_IRON[6])
        line(c,[(35,by-23),(38,by-23)],BLACK_IRON[3])
        arch(c,cx,by-2,4,9,RAMPS['brick-dark'],True)
        kettle(c,22,by-23)
        c.rect(37,by-9,1,3,BLACK_IRON[6])
        c.rect(40,by-9,1,3,BLACK_IRON[6])
    else:
        so.lathe(c,cx,by,[(0,4),(2,5.8),(7,6),(9,5.5),(10,6)],MUD,hollow=(3.5,7))
        # Three small clay supports leave ventilation beneath the kettle.
        for x,y in [(cx-4,by-11),(cx+4,by-11),(cx,by-8)]:
            c.p(x,y,CLAY[2]);c.p(x,y+1,CLAY[4])
        arch(c,cx,by-1,2,4,CLAY,True)
        kettle(c,cx,by-11,ramp(78,.09,lift=-.08))
    return finish(c,(cx,by))


def brazier(variant='b'):
    c=C(56,54);cx,by=27,43
    bronze=ramp(70,.075,lift=-.13)
    coal=[(253,217,129,255),(235,157,65,255),(180,77,38,255),(119,48,34,255),(75,37,33,255),(49,32,34,255),(43,32,35,255),(40,31,35,255)]
    if variant=='b':
        for pts in [[(cx,by-12),(cx+1,by-1)],
                    [(cx-5,by-11),(cx-7,by-1),(cx-10,by-1)],
                    [(cx+5,by-11),(cx+7,by-1),(cx+10,by-1)]]:
            line(c,pts,bronze[5],2)
            line(c,[(x-1,y) for x,y in pts],bronze[3])
        so.lathe(c,cx,by,[(8,3),(10,5),(13,7),(15,8),(16,7.8)],bronze,
                 hollow=(6.1,12),fill=(13.5,coal),inside=BLACK_IRON)
        for x,y in [(cx-3,by-15),(cx+2,by-15),(cx,by-13)]:
            if c.g(x,y) in coal:
                c.p(x,y,BLACK_IRON[5]);c.p(x+1,y,coal[2])
        for side in [-1,1]:
            x=cx+side*8
            line(c,[(x,by-14),(x+side*2,by-14),(x+side*2,by-11),(x,by-11)],bronze[5])
    else:
        m=BLACK_IRON
        for x in [19,34]:
            beam(c,x,by-12,2,11,m)
            line(c,[(x-1,by-1),(x+3,by-1)],m[4])
        line(c,[(21,by-5),(34,by-5)],m[5])
        poly(c,[(15,by-14),(18,by-18),(37,by-18),(40,by-14),(38,by-9),(17,by-9)],m[4])
        poly(c,[(17,by-14),(20,by-17),(35,by-17),(38,by-14),(35,by-12),(20,by-12)],m[6])
        for x,y in [(21,by-15),(26,by-14),(31,by-15),(35,by-14)]:
            c.p(x,y,coal[1]);c.p(x+1,y,coal[3])
        for x in range(20,37,4):c.p(x,by-11,m[7])
        line(c,[(17,by-14),(38,by-14)],m[3])
    return finish(c,(cx,by))

def chicken_coop(variant='b'):
    c=C(72,78);cx,by=34,60
    if variant=='b':
        for x in [19,46]:
            beam(c,x,52,3,8)
            line(c,[(x-2,59),(x+5,59)],WOOD[5])
        poly(c,[(17,47),(cx,36),(51,47),(51,55),(17,55)],WOOD[4])
        for yy in range(47,56):
            c.rect(17,yy,35,1,WOOD[4 if yy<49 else 5])
            if yy%4==0:line(c,[(18,yy),(50,yy)],WOOD[6])
        # A pitched roof with two lit planes; no sheared side wall.
        shingle=RAMPS['cedar']
        for side,q in [(-1,2),(1,4)]:
            points=[(cx,31),(cx+side*22,42),(cx+side*22,47),(cx,36)]
            poly(c,points,shingle[q])
            for step in [6,12,18]:
                x=cx+side*step;y=31+step//2
                line(c,[(x,y+1),(x,y+4)],shingle[min(6,q+1)])
            line(c,[(cx,36),(cx+side*22,47)],shingle[6])
            line(c,[(cx,31),(cx+side*22,42)],shingle[1 if side<0 else 3])
        line(c,[(cx,31),(cx,36)],shingle[2])
        # Service hatch and a smaller hen entrance, both in the front wall.
        c.rect(20,47,11,8,WOOD[6]);c.rect(21,48,9,6,WOOD[3])
        line(c,[(25,48),(25,53)],WOOD[5])
        for yy in [49,53]:line(c,[(20,yy),(22,yy)],IRON[4])
        c.p(29,51,IRON[3])
        c.rect(38,48,8,7,DARK);line(c,[(38,48),(45,48)],WOOD[2])
        line(c,[(38,55),(45,55)],WOOD[2])
        # Ramp treads cross the board, rather than masquerading as a ladder.
        poly(c,[(39,56),(45,56),(48,65),(37,65)],WOOD[4])
        for yy in [57,60,63]:line(c,[(39-(yy>60),yy),(45+(yy>59),yy)],WOOD[2])
        line(c,[(37,65),(48,65)],WOOD[6])
    else:
        wicker=RAMPS['pine']
        so.lathe(c,cx,by-3,[(0,11),(3,12),(15,12),(18,11)],wicker,
                 surface=lambda x,y,z,q:wicker[min(6,q+(z%3<.65))])
        straw=RAMPS['thatch']
        so.lathe(c,cx,by-3,[(16,16),(18,17),(25,8),(29,1)],straw,
                 surface=lambda x,y,z,q:straw[min(6,q+(math.atan2(y,x)*15/math.tau%1<.18))])
        # Woven round hen shelter, with a small framed opening below the eaves.
        ImageDraw.Draw(c.im).rounded_rectangle((cx-4,by-7,cx+4,by+1),radius=2,fill=DARK)
        line(c,[(cx-5,by-5),(cx-5,by+1),(cx+5,by+1),(cx+5,by-5)],WOOD[5])
        line(c,[(cx-3,by-7),(cx+3,by-7)],WOOD[2])
        for x in [cx-10,cx+10]:line(c,[(x,by-15),(x,by-1)],wicker[5])
        line(c,[(cx-2,by-30),(cx+2,by-30)],WOOD[4])
    return finish(c,(cx,by))

def stock_pen(variant='b'):
    c=C(86,86);cx,by=40,68
    w=WOOD if variant=='b' else RAMPS['pine']
    # The enclosure is about 2.8 x 1.4 m; post height is about 0.9 m.
    def post(x,y):
        beam(c,x,y-20,3,20,w)
        c.p(x+1,y-21,w[2])
    def panel(x0,x1,y,gate=False):
        if variant=='b':
            for yy in [y-15,y-7]:beam(c,x0,yy,x1-x0,2,w)
            if gate:
                line(c,[(x0+2,y-5),(x1-2,y-15)],w[5],2)
                for x in [x0,x1-2]:beam(c,x,y-16,2,13,w)
        else:
            c.rect(x0,y-17,x1-x0,15,w[4])
            for yy in range(y-16,y-2,3):
                line(c,[(x0,yy),(x1-1,yy)],w[2 if yy%2 else 3])
            for x in range(x0+3,x1,5):
                line(c,[(x,y-17),(x,y-3)],w[5])
                for yy in range(y-15,y-3,6):c.p(x,yy,w[2])
    panel(13,66,by-16)
    for x in [12,38,65]:post(x,by-16)
    for side in [-1,1]:
        a=13 if side<0 else 66;b=7 if side<0 else 72
        if variant=='b':
            for yy in [by-31,by-23]:
                line(c,[(a,yy),(b,yy+16)],w[5],2)
                line(c,[(a-1,yy),(b-1,yy+16)],w[3])
        else:
            poly(c,[(a,by-33),(b,by-17),(b,by-3),(a,by-19)],w[4])
            for yy in range(by-32,by-20,3):line(c,[(a,yy),(b,yy+16)],w[2])
        post(a if side<0 else a-1,by-8)
    panel(8,29,by)
    panel(49,72,by)
    panel(33,46,by,True)
    for x in [6,29,46,71]:post(x,by)
    for y in [by-14,by-6]:
        line(c,[(31,y),(34,y)],IRON[4] if variant=='b' else w[6])
    line(c,[(44,by-12),(48,by-12)],w[2])
    return finish(c,(cx,by))


def workbench(variant='b'):
    c=C(76,64);cx,by=36,49
    if variant=='b':
        for x in [18,50]:beam(c,x,by-17,3,15)
        beam(c,19,by-7,33,3)
        for x in [14,53]:beam(c,x,by-17,4,18)
        beam(c,17,by-5,37,3)
        # A waist-height bench, with a top about 1.9 m long and 0.65 m deep.
        c.rect(11,by-24,48,7,WOOD[3])
        for yy in [by-23,by-20]:line(c,[(12,yy),(57,yy)],WOOD[5])
        for a,b,y in [(15,23,by-22),(34,42,by-21),(46,55,by-19)]:line(c,[(a,y),(b,y)],WOOD[4])
        beam(c,10,by-17,50,4)
        for x in [31,39,47,55]:c.p(x,by-19,WOOD[6])
        # Wooden face vise, screw hub and the two ends of its sliding handle.
        beam(c,17,by-14,9,4)
        line(c,[(21,by-10),(21,by-6)],WOOD[5])
        line(c,[(18,by-8),(24,by-8)],WOOD[3])
        c.p(21,by-11,WOOD[2])
        # One plane on the top; its dark iron and wooden stock are separate.
        beam(c,36,by-23,7,2)
        c.p(40,by-24,BLACK_IRON[3]);c.p(38,by-24,WOOD[5])
        c.p(15,by-16,WOOD[2]);c.p(54,by-16,WOOD[2])
    else:
        w=RAMPS['pine']
        for x in [16,49]:
            beam(c,x,by-8,5,8,w)
            beam(c,x-2,by-1,9,2,w)
        c.rect(10,by-16,48,6,w[3])
        line(c,[(11,by-15),(56,by-15)],w[2])
        line(c,[(11,by-12),(56,by-12)],w[4])
        beam(c,9,by-10,50,4,w)
        # A low planing bench uses wooden stops and wedges rather than a vise.
        beam(c,14,by-16,3,6,WOOD)
        beam(c,22,by-14,26,3,WOOD)
        poly(c,[(49,by-15),(53,by-13),(49,by-10)],WOOD[4])
        beam(c,31,by-17,7,2)
        c.p(35,by-18,BLACK_IRON[3]);c.p(33,by-18,WOOD[5])
    return finish(c,(cx,by))

SECOND_STUDIES = [
    ('tannur','01  Clay tannur','Thick-walled clay tannur','Banked clay oven'),
    ('stove','02  Stove and kettle','Brick cooking stove / iron kettle','Clay stove / brass kettle'),
    ('brazier','03  Standing brazier','Bronze bowl / tripod stand','Vented iron pan / riveted stand'),
    ('chicken_coop','04  Chicken coop','Raised timber henhouse','Woven hen shelter / thatch'),
    ('stock_pen','05  Small stock pen','Post-and-rail pen / braced gate','Wattle hurdles / woven gate'),
    ('workbench','06  Workbench','Joiner\'s bench / wooden vise','Low planing bench / stops'),
]

STUDIES = [
    ('hearth','01  Cooking hearth','Stone-kerbed open hearth','Three-stone cooking hearth'),
    ('oven','02  Domestic oven','Clay dome / stone baking base','Brick-vault bake oven'),
    ('kiln','03  Pottery kiln','Clay updraft kiln','Brick updraft kiln'),
    ('bloomery','04  Bloomery furnace','Clay shaft / wedge bellows','Stone-clad shaft furnace'),
    ('lever_press','05  Press','Weighted timber lever press','Twin-post screw press'),
    ('trough','06  Animal trough','Pegged timber trough','Carved stone trough'),
]

def draw(kind, variant):
    return globals()[kind](variant)


def live_equipment(kind, variant=0, motion=0):
    im=draw(kind,'c' if variant==1 else 'b')
    im.info['own']=True
    im.info['shadowAnchor']=im.info['anchor']
    if kind=='hearth':
        im.info['shadowMinY']=im.info['anchor'][1]-(34 if variant==1 else 14)
    if kind in ('oven','kiln'):
        x,y=map(round,im.info['anchor'])
        y-= (27 if variant==1 else 22) if kind=='oven' else 9
        px=im.load()
        for dx in range(-5,6):
            for dy in (0,-1):
                if px[x+dx,y+dy]==DARK:
                    px[x+dx,y+dy]=[(113,51,35,255),(171,71,37,255),(230,132,58,255)][(dx+motion+dy)%3]
    if motion:
        px=im.load()
        hot={(168,61,32),(232,133,45),(250,207,100),(211,103,38),(248,193,81),(230,132,58),(171,71,37),(235,157,65),(180,77,38),(119,48,34)}
        ramp=[(171,71,37,255),(232,133,45,255),(250,207,100,255)]
        for y in range(im.height):
            for x in range(im.width):
                if px[x,y][:3] in hot:
                    phase=(x//3+y//2+motion)%8
                    px[x,y]=ramp[2 if phase<2 else 1 if phase<6 else 0]
    return im


def second_equipment_sprites():
    sprites={}
    for kind,*_ in SECOND_STUDIES:
        for v,form in enumerate(['b','c']):
            base=f'study-prop-equipment-{kind}-{form}'
            for f in range(4 if kind in ('tannur','stove','brazier') else 1):
                sprites[base+(f'-f{f}' if f else '')]=live_equipment(kind,v,f)
        legacy=kind.replace('_','-')
        for v in range(3):
            for f in range(4 if kind in ('tannur','stove','brazier') else 1):
                frame=f'study-prop{"" if kind in ("tannur","stove","brazier") else "b"}-{legacy}-{v}'+(f'-f{f}' if f else '')
                if kind=='workbench':
                    from .workshop import workbench as plain_bench
                    sprites[frame]=plain_bench(v)
                    sprites[f'study-prop-workbench-{v}']=sprites[frame]
                else:sprites[frame]=live_equipment(kind,0,f)
    return sprites


EQUIPMENT_B = {
    'kiln':lambda v=0,m=0:live_equipment('kiln',v,m),
    'bloomery':lambda v=0,m=0:live_equipment('bloomery',v,m),
    'lever-press':lambda v=0:live_equipment('lever_press',v),
    'trough':lambda v=0:live_equipment('trough',v),
}
EQUIPMENT_FIRES = {
    'hearth':lambda v=0,f=0:live_equipment('hearth',0,f),
    'three-stone-hearth':lambda v=0,f=0:live_equipment('hearth',1,f),
    'oven':lambda v=0,f=0:live_equipment('oven',v,f),
}
