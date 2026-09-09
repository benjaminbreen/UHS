"""Individually composed tropical broadleaf ages. Drawn on native grids, never scaled."""
from PIL import Image, ImageDraw
import math
from art.nature_trees import crown, branch, BARK, TROPICAL

def draw(size, trunk, limbs, crowns, roots):
    im=Image.new('RGBA',size);d=ImageDraw.Draw(im)
    d.polygon(roots,fill=BARK[0])
    branch(d,trunk,max(3,size[0]//12))
    for pts,w in limbs:branch(d,pts,w)
    bx,by=trunk[0]
    d.line([(bx-2,by-10),(bx-5,by-3),(bx-10,by+1)],fill=BARK[4],width=2)
    d.line([(bx+2,by-9),(bx+6,by-2),(bx+12,by+1)],fill=BARK[2],width=2)
    for i,(cx,cy,rx,ry) in enumerate(crowns):
        layer=Image.new('RGBA',size)
        crown(layer,cx,cy,rx,ry,TROPICAL,710+i*17+size[0])
        # Large foliage masses need rounded shoulders instead of enlarged block corners.
        # This trims the authored native pixels; it never resizes the drawing.
        for y in range(max(0,cy-ry-1),min(size[1],cy+ry+3)):
            for x in range(max(0,cx-rx-1),min(size[0],cx+rx+2)):
                nx,ny=(x-cx)/rx,(y-cy)/ry
                boundary=1+.035*math.sin((y+i*5)*1.3)
                if nx*nx+ny*ny>boundary:layer.putpixel((x,y),(0,0,0,0))
        alpha=layer.getchannel('A')
        for y in range(max(1,cy-ry),min(size[1]-1,cy+ry+2)):
            for x in range(max(1,cx-rx),min(size[0]-1,cx+rx+1)):
                if alpha.getpixel((x,y)) and any(not alpha.getpixel((x+dx,y+dy)) for dx,dy in [(0,1),(0,-1),(-1,0),(1,0)]):layer.putpixel((x,y),tuple(bytes.fromhex(TROPICAL[0][1:]))+(255,))
        im.alpha_composite(layer)
    d=ImageDraw.Draw(im)
    for cx,cy,rx,ry in crowns:
        for dx,dy in [(-rx//3,-ry//3),(rx//4,1)]:
            x,y=cx+dx,cy+dy
            d.polygon([(x-4,y),(x-1,y-2),(x+3,y-1),(x+4,y),(x,y+2)],fill=TROPICAL[3])
            d.line((x-2,y-1,x+1,y-1),fill=TROPICAL[4])
    return im

def broadleaf_ages():
    return {
      'nature-broadleaf-sapling':draw((48,64),[(24,58),(23,43),(26,26)],
        [([(24,45),(16,34)],2), ([(24,39),(34,30)],2)],
        [(16,30,10,8),(33,25,9,8),(25,16,11,9)],
        [(21,53),(26,53),(29,60),(24,58),(19,60)]),
      'nature-broadleaf-young':draw((72,96),[(35,89),(34,67),(38,46),(34,28)],
        [([(35,67),(22,50),(15,38)],3), ([(37,54),(52,43)],3)],
        [(18,43,13,10),(51,38,15,11),(29,29,16,12),(44,22,15,11),(34,46,17,11)],
        [(31,79),(40,79),(45,92),(35,88),(27,92)]),
      'nature-broadleaf-mature':draw((112,144),[(54,135),(58,112),(53,91),(60,65),(53,43)],
        [([(55,99),(36,79),(22,60)],7), ([(57,93),(79,73),(90,51)],6), ([(57,75),(40,52)],5)],
        [(24,67,19,15),(85,62,21,17),(38,43,24,17),(72,34,24,18),(57,23,19,13),(58,63,27,19),(36,80,21,12),(79,80,21,14)],
        [(48,112),(62,112),(65,129),(76,139),(62,135),(55,141),(49,134),(34,140),(44,127)]),
      'nature-broadleaf-giant':draw((144,192),[(72,181),(67,151),(73,119),(63,95),(73,63)],
        [([(72,131),(46,103),(28,76)],9), ([(70,119),(101,96),(120,63)],8), ([(65,98),(41,71),(35,49)],6), ([(71,84),(92,54)],6)],
        [(25,81,20,18),(114,74,23,18),(42,54,27,21),(94,42,28,20),(65,29,26,18),(65,69,29,23),(31,102,24,16),(105,103,27,19),(73,103,28,18)],
        [(63,149),(78,149),(81,171),(98,186),(79,179),(73,188),(62,180),(42,187),(57,168)]),
    }
