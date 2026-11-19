"""Container handling equipment. Coordinates are pixels at the game's native camera scale."""
from PIL import Image, ImageDraw, ImageFont
from math import sin,cos,pi

# highlight, roof, rib, wall, shadow
PAINT=[('#ecad80','#cc7652','#bc6245','#994b39','#693e38'),
       ('#abc6c7','#699baa','#578499','#406a80','#344450'),
       ('#c5ce9f','#8eaa88','#729776','#517960','#384e47'),
       ('#fff0cc','#d7d3b9','#bebfa9','#9caa9d','#617375'),
       ('#f6d795','#d4ad65','#bd914d','#9e743e','#68513d')]
INK='#343e45'
def lettering(d,xy,s,col,size=8):
    d.fontmode='1'
    d.text(xy,s,font=ImageFont.load_default(size=size),fill=col,stroke_width=0)
def box(heading,colour):
    im=Image.new('RGBA',(87,65));d=ImageDraw.Draw(im)
    a=heading*pi/4
    def p(u,v,z):
        return round(43+sin(a)*u+cos(a)*v),round(49+.68*(-cos(a)*u+sin(a)*v)-z)
    hi,roof,rib,wall,dark=PAINT[colour]
    def poly(coords,c,edge=None):d.polygon([p(*q) for q in coords],fill=c,outline=edge)
    def line(a,b,c,w=1):d.line([p(*a),p(*b)],fill=c,width=w)
    for side in [-1,1]:
        v=side*12;u=side*28
        if side*sin(a)>.001:
            poly([(-28,v,0),(28,v,0),(28,v,21),(-28,v,21)],wall,dark)
            for x in range(-25,27,4):
                line((x,v,3),(x,v,18),dark);line((x+1,v,3),(x+1,v,18),rib,2)
            line((-27,v,2),(27,v,2),rib);line((-28,v,20),(28,v,20),hi)
            px,py=p(-13,v,15)
            d.rectangle((px-5,py-2,px+4,py+1),fill=roof)
            d.line((px-4,py,px-2,py-1,px,py,px+2,py-1),fill=hi)
            px,py=p(21,v,6);d.rectangle((px-2,py,px+2,py+2),fill='#dbbb7d')
        if -side*cos(a)>.001:
            poly([(u,-12,0),(u,12,0),(u,12,21),(u,-12,21)],rib,dark)
            for y in [-8,-2,2,8]:
                line((u,y,2),(u,y,19),dark,2);line((u,y,4),(u,y,18),'#c5be9f')
                line((u,y-1,7),(u,y+1,7),INK)
    poly([(-28,-12,21),(28,-12,21),(28,12,21),(-28,12,21)],roof,dark)
    for x in range(-24,26,4):
        line((x,-10,21),(x,10,21),rib);line((x+1,-9,21),(x+1,9,21),roof)
    for x in [-27,27]:
        for y in [-11,11]:
            px,py=p(x,y,21);d.rectangle((px-1,py,px+1,py+1),fill=hi);d.point((px,py),fill=dark)
    im.info['anchor']=[43,49];im.info['trim']=True
    return im

def gantry(auto,front):
    im=Image.new('RGBA',(258,352));d=ImageDraw.Draw(im)
    # The origin is on the quay rail. The front sill stands 70 pixels inland.
    ox,oy=69,224
    pale,light,body,shade,dark=PAINT[1 if auto else 4]
    def line(points,c,w=1):d.line([(ox+x,oy+y) for x,y in points],fill=c,width=w)
    def poly(points,c,edge=INK):d.polygon([(ox+x,oy+y) for x,y in points],fill=c,outline=edge)
    def rect(x,y,u,v,c,edge=None):d.rectangle((ox+x,oy+y,ox+u,oy+v),fill=c,outline=edge)
    def beam(points,w=5):
        line(points,dark,w+2);line(points,body,w);line([(x-1,y-1) for x,y in points],light,2)
    def rail(x1,x2,y):
        for x in range(x1,x2,7):line([(x,y),(x,y-5)],shade)
        line([(x1,y-6),(x2,y-6)],pale);line([(x1,y-3),(x2,y-3)],shade)
    def truck(x,y):
        rect(x-9,y-6,x+8,y-1,shade,INK)
        for k in [-6,0,6]:
            d.ellipse((ox+x+k-2,oy+y-3,ox+x+k+2,oy+y+1),fill=INK)
            d.point((ox+x+k,oy+y-1),fill=light)
        rect(x-10,y-8,x+9,y-5,body,dark)
    # The landside legs are farther east along the quay. The outreach and its
    # shadow therefore have a visible diagonal even in the straight-on camera.
    if not front:
        for x in [54,124]:
            truck(x,0)
            beam([(x,-8),(x-6,-127)],9)
            poly([(x-7,-124),(x-2,-124),(x+2,-17),(x,-12)],light,dark)
        beam([(54,-9),(118,-106)],4);beam([(123,-12),(50,-107)],4)
        beam([(50,-106),(125,-106)],7)
        for offset in [-24,24]:
            # Open web jib with twin chords, nine gusseted panels and a tip sheave.
            start=(-20+offset,-184);end=(123+offset,-61)
            for k in range(9):
                x0=round(start[0]+143*k/9);y0=round(start[1]+123*k/9)
                x1=round(start[0]+143*(k+1)/9);y1=round(start[1]+123*(k+1)/9)
                beam([(x0,y0),(x1,y1-10)],2)
                line([(x0,y0-10),(x0,y0)],shade,2)
            if auto:
                poly([(start[0],start[1]-12),(end[0],end[1]-12),end,start],body)
                line([(start[0],start[1]-13),(end[0],end[1]-13)],pale,2)
                for k in range(1,8):
                    u=start[0]+round(143*k/8);v=start[1]+round(123*k/8)
                    line([(u,v-11),(u,v-2)],shade)
                    line([(u+1,v-11),(u+1,v-3)],light)
            beam([start,end],5);beam([(start[0],start[1]-11),(end[0],end[1]-11)],3)
            poly([(start[0]-2,start[1]-11),(start[0]+5,start[1]-7),(start[0]+1,start[1]+1)],light)
            for ex,ey in [(-18,-184),(17,-154),(128,-57)]:
                line([(68+offset,-202),(ex+offset,ey-9)],dark,2)
                line([(68+offset+2,-202),(ex+offset+2,ey-9)],pale)
            beam([(53+offset,-117),(68+offset,-200),(84+offset,-106)],5)
        beam([(42,-202),(94,-202)],7)
        for x in [44,89]:rect(x,-208,x+2,-205,'#de8060')
        beam([(-45,-188),(5,-188)],5)
        # Rope drum house and the open grated service walk.
        poly([(41,-127),(47,-134),(110,-134),(120,-129),(114,-124)],light)
        rect(41,-126,114,-110,body,dark)
        poly([(114,-126),(120,-130),(120,-115),(114,-110)],shade)
        for x in range(46,76,4):rect(x,-122,x+1,-114,shade)
        rect(89,-124,106,-116,'#354f60',dark);rect(90,-123,99,-121,'#a1c0b8')
        rail(36,121,-106)
    else:
        for x in [76,146]:
            truck(x,70)
            beam([(x,63),(x-13,-51)],8)
            line([(x-2,60),(x-14,-48)],light,2)
            for y in (53,58):line([(x-4,y),(x+2,y-3)],INK,2)
        beam([(72,37),(128,-33)],4);beam([(142,36),(70,-33)],4)
        beam([(59,-47),(142,-47)],8);rail(55,146,-53)
        for k in range(16):
            y=-31+5*k;x=137+round(k*.48)
            line([(x,y),(x+5,y)],pale)
        line([(136,-33),(144,49)],shade,2);line([(143,-33),(151,49)],dark,2)
        if auto:
            poly([(64,-139),(72,-149),(102,-149),(109,-141),(106,-128),(65,-128)],light)
            rect(67,-138,103,-132,'#293f50');rect(69,-137,86,-135,'#a5c4be')
            line([(78,-148),(78,-159)],shade,2);rect(75,-161,82,-159,pale,dark)
        poly([(121,-67),(126,-71),(144,-71),(148,-67),(147,-48),(121,-48)],light)
        rect(124,-65,143,-55,'#344e5b',dark);rect(125,-64,133,-60,'#a6c0b5')
        line([(137,-65),(137,-55)],body,2)
        rect(75,-48,105,-37,shade,dark)
        lettering(d,(ox+80,oy-49),'Q 12' if auto else 'Q 04',pale,9)
    im.info['anchor']=[ox,oy];im.info['trim']=True
    return im

def chassis(auto):
    im=Image.new('RGBA',(109,53));d=ImageDraw.Draw(im)
    tyre='#323e47'
    d.ellipse((7,34,104,47),fill=(25,38,47,70))
    for x in [18,34,78,89]:
        d.ellipse((x-5,31,x+5,42),fill=tyre,outline='#253239')
        d.ellipse((x-2,34,x+2,38),fill='#88928e',outline='#525e5f')
    d.polygon([(6,25),(12,17),(94,17),(101,23),(101,32),(94,35),(6,35)],fill='#52696b',outline=tyre)
    d.polygon([(6,25),(12,17),(94,17),(101,23),(94,26)],fill='#94a8a0',outline=tyre)
    for x in range(18,91,9):d.line((x,19,x-4,24),fill='#49595c',width=2)
    d.rectangle((9,27,96,30),fill='#899592')
    if auto:
        d.rectangle((9,27,95,32),fill='#dfb951',outline='#856b40')
        for x in range(13,94,10):d.line((x,31,x+4,28),fill='#524d44',width=2)
        for x in [12,90]:
            d.rectangle((x,22,x+5,26),fill='#e7cc69',outline='#665a44')
        d.rectangle((42,32,60,36),fill='#486c71');d.line((44,33,54,33),fill='#6eaab0')
        d.rectangle((5,27,9,30),fill='#a54736');d.rectangle((95,25,101,27),fill='#e6edbf')
    else:
        d.polygon([(74,20),(77,8),(83,5),(96,5),(101,11),(101,27),(96,32),(74,31)],fill='#4d806c',outline=tyre)
        d.polygon([(77,9),(82,3),(97,3),(102,8),(97,10)],fill='#b5c5a3',outline='#52635d')
        d.rectangle((79,11,96,19),fill='#354953');d.rectangle((81,12,87,16),fill='#92b1af')
        d.line((90,11,90,18),fill='#8d9f90')
        d.rectangle((77,23,88,25),fill='#779a7e');d.rectangle((96,22,100,24),fill='#f4d99d')
        d.rectangle((68,9,70,24),fill='#586669');d.point((68,9),fill='#bfbe9f')
    im.info['anchor']=[49,34];return im

def steel_coil():
    im=Image.new('RGBA',(50,36));d=ImageDraw.Draw(im)
    d.polygon([(4,26),(25,18),(47,23),(47,27),(24,34),(4,30)],fill='#79583d',outline='#493f39')
    for x in (8,32):
        d.polygon([(x,29),(x+4,22),(x+10,24),(x+9,30)],fill='#c99a63',outline='#735a43')
    d.ellipse((20,2,43,25),fill='#737f83',outline=INK)
    d.polygon([(13,6),(28,2),(35,3),(40,8),(43,16),(39,23),(24,29),(17,25)],fill='#65757b')
    d.polygon([(13,7),(27,2),(34,3),(37,5),(21,10)],fill='#b1b9b1')
    d.polygon([(22,23),(42,16),(40,22),(24,28)],fill='#4a585f')
    for dx in (3,12):
        d.line([(12+dx,6-dx//4),(19+dx,7-dx//4),(23+dx,12-dx//4),(25+dx,20-dx//4),(23+dx,26-dx//4)],fill='#404e56',width=2)
        d.line([(13+dx,6-dx//4),(19+dx,8-dx//4),(22+dx,11-dx//4)],fill='#d1c6ab')
    d.ellipse((4,6,27,30),fill='#879598',outline=INK)
    for k,c in [(2,'#bac2b6'),(4,'#5d6e74'),(6,'#adb4aa')]:
        d.arc((4+k,6+k,27-k,30-k),105,346,fill=c)
    d.ellipse((11,13,20,23),fill='#38464f',outline='#c3bb9f')
    d.arc((12,14,20,22),275,80,fill='#657980')
    im.info['anchor']=[24,29];im.info['trim']=True
    return im

def terminal_art(items):
    coil=steel_coil()
    items['harbor-steel-coil']=coil
    yard=Image.new('RGBA',(83,58))
    for at in [(12,0),(39,8),(0,20)]:yard.alpha_composite(coil,at)
    yard.info['anchor']=[38,49];yard.info['trim']=True
    items['harbor-coil-yard']=yard
    for c in range(5):
        unit=box(2,c)
        items['harbor-box-'+str(c)]=unit
        for n in range(1,5):
            im=Image.new('RGBA',(93,158))
            d=ImageDraw.Draw(im)
            d.polygon([(15,146),(20,141),(76,142),(80,147),(74,152),(17,152)],fill=(33,43,48,80))
            for k in range(n):im.alpha_composite(box(2,(c+k*2)%5),(2,92-21*k))
            im.info['anchor']=[45,141];im.info['trim']=True
            items[f'harbor-stack-{c}-{n}']=im
    for auto in [False,True]:
        tag='auto' if auto else 'manual'
        items['harbor-chassis-'+tag]=chassis(auto)
        im=Image.new('RGBA',(95,144));d=ImageDraw.Draw(im)
        light,roof,rib,wall,dark=PAINT[1 if auto else 4]
        for x in [5,79]:
            d.rectangle((x,32,x+7,116),fill=wall,outline=INK);d.line((x+1,34,x+1,115),fill=light,width=2)
            d.rectangle((x-3,114,x+11,120),fill=dark,outline=INK)
            d.line((x+2,32,x+9,19),fill=rib,width=4)
        d.polygon([(2,31),(10,18),(87,18),(91,29),(85,37),(2,37)],fill=wall,outline=INK)
        d.polygon([(2,30),(10,18),(87,18),(81,30)],fill=roof,outline=dark)
        for x in range(10,75,9):d.line((x,28,x+5,20),fill=rib)
        d.rectangle((30,23,54,31),fill=dark,outline=INK);d.line((30,22,55,22),fill=light)
        for x in [24,65]:d.line((x,35,x,62),fill=INK)
        d.rectangle((18,60,71,64),fill='#d8ac5d',outline=INK)
        lettering(d,(10,28),'B',light,8)
        im.info['anchor']=[46,120];items['harbor-exchange-'+tag]=im
        for front in (False,True):items['harbor-gantry-'+tag+('-near' if front else '-far')]=gantry(auto,front)
        im=Image.new('RGBA',(57,108));d=ImageDraw.Draw(im)
        d.ellipse((12,99,49,106),fill=(39,48,53,64))
        d.polygon([(18,96),(22,91),(34,91),(37,97),(35,101),(18,101)],fill='#858d84',outline=INK)
        d.polygon([(24,96),(26,22),(29,22),(31,96)],fill='#85928c',outline=INK)
        d.line((26,93,27,24),fill='#c8c7b0')
        d.line((9,23,46,23),fill=INK,width=3)
        for x in [6,23,40]:
            d.polygon([(x,16),(x+3,12),(x+12,12),(x+13,19),(x+11,23),(x+1,22)],fill='#607475',outline=INK)
            d.rectangle((x+2,17,x+10,20),fill='#d7e5ce' if auto else '#edc785')
            for u in [x+4,x+8]:d.line((u,17,u,20),fill='#9ba99b' if auto else '#c69c66')
        im.info['anchor']=[28,100];items['harbor-flood-'+tag]=im
    im=Image.new('RGBA',(43,41));d=ImageDraw.Draw(im)
    d.polygon([(5,34),(10,30),(35,30),(39,34),(36,37),(5,37)],fill='#89908b',outline=INK)
    d.rectangle((9,12,30,33),fill='#688c90',outline=INK)
    d.polygon([(9,12),(13,8),(33,8),(30,12)],fill='#c0c9b8',outline=INK)
    d.polygon([(30,12),(33,8),(33,28),(30,33)],fill='#597378',outline=INK)
    for x in [13,23]:
        d.ellipse((x,16,x+4,21),fill='#d0ac60',outline=INK)
        d.line((x+2,20,x+4,29,x+7,32,x+9,31,x+11,23),fill=INK,width=2)
        d.point((x,14),fill='#c5db9e')
    im.info['anchor']=[20,35];items['harbor-reefer-pedestal']=im
    for desk in [False,True]:
        im=Image.new('RGBA',(42,44));d=ImageDraw.Draw(im)
        d.ellipse((5,34,40,39),fill=(40,47,50,75))
        for x in [7,30]:d.rectangle((x,20,x+2,35),fill='#4a5556')
        if desk:
            d.rectangle((5,16,34,30),fill='#527773',outline=INK);d.rectangle((8,23,22,28),fill='#3a5559')
            d.polygon([(3,15),(9,9),(36,9),(37,15)],fill='#b39a6e',outline=INK)
            d.polygon([(13,14),(17,10),(26,10),(23,14)],fill='#f4deae')
            d.line((19,12,23,12),fill='#858575');d.rectangle((27,6,32,12),fill='#425660');d.point((30,8),fill='#a6cebd')
        else:
            d.rectangle((3,6,36,21),fill='#e5c363',outline=INK);d.rectangle((5,8,34,19),outline='#9d7c49')
            lettering(d,(9,7),'B  02',INK)
        im.info['anchor']=[19,35];items['harbor-yard-'+('desk' if desk else 'sign')]=im
