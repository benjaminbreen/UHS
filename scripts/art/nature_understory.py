"""Native pixel drawings of four habitat-defining understory forms.
Authored silhouettes and leaf placement, opaque palette, no sampled image pixels.
"""
from PIL import Image, ImageDraw
import math

FERN=['#193b32','#2c5940','#467e49','#6da153','#a1c36d']
HEATH=['#303d34','#4e6040','#71804b','#a0a66b']
SAGE=['#3a4941','#5b7063','#819786','#a8b5a0','#c8cbb1']
GINGER=['#173d34','#285d40','#438548','#72a553','#a5c06a']


def fern():
    im=Image.new('RGBA',(48,40));d=ImageDraw.Draw(im)
    # Fronds open from a low central crown. Each is a pinnate leaf, not a grass blade.
    for tip,ctrl,tone in [((8,26),(9,17),2),((41,27),(37,18),1),((6,15),(13,8),3),((42,13),(34,6),2),((15,5),(21,7),3),((30,4),(26,9),3),((23,13),(21,15),2)]:
        pts=[]
        for i in range(13):
            t=i/12;u=1-t
            pts.append((round(u*u*24+2*u*t*ctrl[0]+t*t*tip[0]),round(u*u*35+2*u*t*ctrl[1]+t*t*tip[1])))
        d.line(pts,fill=FERN[0],width=2)
        for i in range(3,12,2):
            x,y=pts[i];a=pts[i-1];b=pts[i+1];dx,dy=b[0]-a[0],b[1]-a[1];n=math.hypot(dx,dy) or 1
            w=5 if i<8 else 3
            for side in [-1,1]:
                ex,ey=round(x-dy/n*w*side-dx/n),round(y+dx/n*w*side-dy/n)
                d.polygon([(x,y+1),(ex,ey),(round((x+ex)/2),round((y+ey)/2)-2),(x,y-1)],fill=FERN[0])
                d.line((x,y,ex,ey-1),fill=FERN[tone],width=2)
                d.point((ex,ey-1),fill=FERN[min(4,tone+1)])
        d.line(pts,fill=FERN[min(4,tone+1)])
    d.line((20,36,27,36),fill=FERN[0])
    # A small curled young frond at the center adds a second life stage.
    d.line([(25,34),(27,24),(29,23),(31,24),(31,26),(29,27),(28,25)],fill=FERN[0],width=2)
    d.line([(26,32),(28,25),(29,24),(30,25)],fill=FERN[3])
    return im


def flowering_heath():
    im=Image.new('RGBA',(48,40));d=ImageDraw.Draw(im)
    # Uneven branching evergreen sprays, with small pink-purple bell clusters.
    blooms=['#61394e','#97536c','#c67a99','#e9abb9']
    sprays=[(7,22,18,34),(12,14,21,34),(18,18,23,35),(22,7,25,35),(29,12,26,35),(35,16,28,34),(40,24,29,35),(17,25,24,35),(31,23,26,35)]
    for i,(x,y,bx,by) in enumerate(sprays):
        d.line((bx,by,x,y),fill=HEATH[0],width=3)
        d.line((bx,by,x,y),fill=HEATH[1])
        for j in range(3,by-y,3):
            t=j/(by-y);xx=round(x+(bx-x)*t);yy=y+j
            d.line((xx-3,yy-2,xx,yy),fill=HEATH[2 if i%3 else 1],width=2)
            d.line((xx,yy,xx+3,yy-3),fill=HEATH[3 if i%2 else 2])
        for j in range(0,8,3):
            xx=x+(j//3%2)*2-1;yy=y+j
            d.rectangle((xx-1,yy,xx+1,yy+2),fill=blooms[0]);d.line((xx-1,yy,xx+1,yy),fill=blooms[2]);d.point((xx-1,yy),fill=blooms[3]);d.point((xx,yy+1),fill=blooms[1])
    d.line((19,36,30,36),fill=HEATH[0])
    return im


def sagebrush():
    im=Image.new('RGBA',(48,40));d=ImageDraw.Draw(im)
    # Exposed grey-brown stems with small silver lobed leaves, airy at the base.
    stems=[[(23,35),(18,26),(10,19),(6,14)],[(24,35),(24,22),(19,12),(17,7)],[(25,35),(30,23),(34,15),(33,7)],[(26,35),(37,28),(41,19)],[(20,31),(11,29),(6,23)],[(24,30),(25,17),(26,9)]]
    for pts in stems:
        d.line(pts,fill='#46453b',width=3,joint='curve');d.line([(x-1,y) for x,y in pts],fill='#9d9271')
    for i,(x,y) in enumerate([(7,15),(11,19),(15,23),(18,14),(18,9),(23,20),(26,11),(29,22),(33,15),(34,9),(39,21),(37,27),(9,26),(19,29),(29,28)]):
        d.polygon([(x-4,y),(x-4,y-2),(x-2,y-1),(x-2,y-4),(x,y-4),(x+1,y-1),(x+3,y-3),(x+4,y-1),(x+2,y+2),(x,y+3),(x-2,y+1)],fill=SAGE[0])
        d.line((x-3,y-1,x,y+1),fill=SAGE[2],width=2);d.line((x-1,y-3,x,y+1),fill=SAGE[3],width=2);d.line((x+2,y-2,x,y+1),fill=SAGE[2])
        if i%2==0:d.point((x-1,y-3),fill=SAGE[4])
    d.line((21,35,28,35),fill=SAGE[0])
    return im


def tropical_ginger():
    im=Image.new('RGBA',(48,56));d=ImageDraw.Draw(im)
    # Broad lance-shaped leaves alternate along sturdy stems; conspicuous red bracts.
    d.line([(23,51),(23,31),(27,12)],fill=GINGER[0],width=3)
    d.line([(25,50),(32,30),(36,23)],fill=GINGER[1],width=2)
    leaves=[((24,42),(5,27),0),((26,40),(44,26),1),((24,32),(8,13),0),((26,29),(43,14),1),((25,22),(17,6),0),((31,38),(42,35),1),((22,46),(9,39),0)]
    for (bx,by),(tx,ty),side in leaves:
        mx,my=(bx+tx)//2,(by+ty)//2
        dx,dy=tx-bx,ty-by;n=math.hypot(dx,dy);nx,ny=-dy/n*4,dx/n*4
        poly=[(bx,by),(round(mx+nx),round(my+ny)),(tx,ty),(round(mx-nx),round(my-ny))]
        d.polygon(poly,fill=GINGER[0])
        d.polygon([(bx,by-1),(round(mx+nx-1),round(my+ny-1)),(tx,ty)],fill=GINGER[2 if side else 3])
        d.polygon([(bx,by),(tx,ty),(round(mx-nx+1),round(my-ny+1))],fill=GINGER[1 if side else 2])
        d.line((bx,by-1,tx,ty),fill=GINGER[3 if side else 4])
    d.line((22,48,17,29),fill=GINGER[0],width=3)
    # A compact conical inflorescence, layered overlapping bracts rather than dots.
    for x,y,w in [(17,32,4),(16,29,4),(16,26,3),(16,23,2)]:
        d.polygon([(x-w,y),(x-w,y-2),(x,y-4),(x+w,y-2),(x+w,y),(x,y+2)],fill='#663748')
        d.polygon([(x-w+1,y-1),(x,y-3),(x+w-1,y-1),(x,y)],fill='#b95159')
        d.line((x-w+1,y-1,x,y-2),fill='#e48b70')
    d.line((20,52,28,52),fill=GINGER[0])
    return im


def understory():
    return {'nature-understory-woodland-fern':fern(),
            'nature-understory-flowering-heath':flowering_heath(),
            'nature-understory-sagebrush':sagebrush(),
            'nature-understory-tropical-ginger':tropical_ginger()}
