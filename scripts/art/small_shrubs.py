"""Small native-grid shrub silhouettes; no resampling of larger assets."""
from PIL import Image, ImageDraw


def twig_scrub(medium=False):
    im = Image.new('RGBA', (32, 24) if medium else (24, 20))
    d = ImageDraw.Draw(im)
    bx, by = (16, 21) if medium else (12, 17)
    tips = [(5, 10), (9, 5), (15, 7), (20, 11)] if not medium else [(5, 12), (9, 7), (15, 4), (23, 8), (27, 15)]
    for i, (x, y) in enumerate(tips):
        mx, my = (bx+x)//2, y+5
        d.line([(bx,by),(mx,my),(x,y)], fill='#414334', width=2)
        d.line([(bx,by-1),(mx,my),(x,y)], fill='#8c8051')
        d.line((mx,my,mx+(-3 if i%2 else 3),my-3), fill='#414334')
        # Small alternate leaf pairs leave most of each branch exposed.
        for xx, yy in [(x,y+1),(mx,my-1)]:
            d.line((xx-2,yy,xx+2,yy-1), fill='#384b32', width=2)
            d.line((xx-2,yy-1,xx,yy-2), fill='#81935a')
            d.point((xx+1,yy-1), fill='#a5ac6b')
    d.line((bx-3,by,bx+3,by), fill='#414334')
    return im


def leafy_shrub():
    im=Image.new('RGBA',(24,20));d=ImageDraw.Draw(im)
    d.line([(10,17),(11,12),(8,7)],fill='#524b35',width=2)
    d.line([(11,16),(15,10),(18,8)],fill='#524b35',width=2)
    for i,(x,y) in enumerate([(6,11),(8,7),(12,8),(17,9),(15,13),(9,14)]):
        d.polygon([(x-3,y),(x-2,y-2),(x+1,y-3),(x+3,y-1),(x+2,y+2),(x-1,y+2)],fill='#294632')
        d.polygon([(x-2,y-1),(x,y-2),(x+2,y-1),(x+1,y+1),(x-1,y+1)],fill='#557d43' if i%2 else '#668c4b')
        d.line((x-1,y-1,x,y-2),fill='#97ac63')
    return im


def low_heath():
    im=Image.new('RGBA',(28,22));d=ImageDraw.Draw(im)
    for i,(x,y) in enumerate([(5,12),(10,7),(15,9),(21,11)]):
        d.line((13,19,x,y),fill='#394632',width=2)
        for j in range(3):
            xx=round(x+(13-x)*j/4);yy=y+j*2
            d.line((xx-2,yy-1,xx+2,yy),fill='#70814d')
            d.point((xx-2,yy-1),fill='#a1aa70')
        if i in (1,3):
            d.rectangle((x-1,y-1,x+1,y+1),fill='#855567')
            d.line((x-1,y-1,x,y-1),fill='#cd92a4')
    return im


def small_shrubs():
    return {
        'nature-dry-scrub-small': twig_scrub(),
        'nature-dry-scrub-medium': twig_scrub(True),
        'nature-understory-low-leafy-shrub': leafy_shrub(),
        'nature-understory-low-heath': low_heath(),
    }
