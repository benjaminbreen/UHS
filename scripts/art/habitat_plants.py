"""Distinct habitat silhouettes authored directly on native pixel grids."""
from PIL import Image, ImageDraw
from art.nature_trees import branch

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
    return {'nature-bamboo-clump':bamboo(),'nature-teak':teak(),'nature-understory-sedge':tuft(True),'nature-understory-dry-bunchgrass':tuft(False)}
