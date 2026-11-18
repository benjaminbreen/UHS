"""Pixel-painted harbour vessels. Hull stations and deck fittings share a waterline pivot."""
import math
from PIL import Image, ImageDraw

INK='#343b40'
STEEL=('#9fa6a0','#707f80','#4d6065','#36474e')
GREEN=('#adbc9e','#638674','#365e50','#253f3c')
CREAM=('#fff0ca','#ead3a2','#d2b68b','#9d8369')
WOOD=('#e4be83','#c69c67','#a97e50','#79583e')
RED=('#e4a474','#b86e4e','#8c4d3b','#5c3935')
SLATE=('#a8b2a6','#829693','#657b7c','#485e65')


def steamship(heading,form):
    ferry=form=='harbor-ferry'
    im=Image.new('RGBA',(370,336))
    d=ImageDraw.Draw(im)
    a=math.pi*heading/4
    fx,fy=math.sin(a),-math.cos(a)
    rx,ry=math.cos(a),math.sin(a)
    def pt(x,y,z):
        if ferry:x*=1.24
        return round(185+fx*x+rx*y),round(205+(fy*x+ry*y)*.68-z)
    def poly(pts,col,edge=None):d.polygon([pt(*p) for p in pts],fill=col,outline=edge)
    def line(pts,col,w=1):d.line([pt(*p) for p in pts],fill=col,width=w)
    def lid(shape,z,col,edge=None):poly([(x,y,z) for x,y in shape],col,edge)
    def plank(x1,y1,x2,y2,z,c):lid([(x1,y1),(x2,y1),(x2,y2),(x1,y2)],z,c)
    def chamfer(x,y,l,b,k):
        return [(x-l+k,y-b),(x+l-k,y-b),(x+l,y-b+k),(x+l,y+b-k),
                (x+l-k,y+b),(x-l+k,y+b),(x-l,y+b-k),(x-l,y-b+k)]
    def shape_walls(shape,z,top,colors,mark=None):
        for u,v in zip(shape,shape[1:]+shape[:1]):
            dx,dy=v[0]-u[0],v[1]-u[1]
            n=math.hypot(dx,dy)
            nx,ny=(dy*fx-dx*rx)/n,(dy*fy-dx*ry)/n
            if ny<-.01:continue
            poly([(*u,z),(*v,z),(*v,top),(*u,top)],colors[1 if nx<-.35 else 3 if nx>.55 else 2])
            if mark:mark(u,v,nx)
    def cub(x,y,z,l,b,h,palette,top=None):
        sh=chamfer(x,y,l,b,min(2,l*.25,b*.25));shape_walls(sh,z,z+h,palette)
        lid(sh,z+h,top or palette[1],palette[2])
        return sh
    def ellipse(p,wx,wy,col,edge=None):
        x,y=pt(*p);d.ellipse((x-wx,y-wy,x+wx,y+wy),fill=col,outline=edge)
    def drum(x,y,z,r,h,palette,opening=False):
        bx,by=pt(x,y,z);xx,yy=pt(x,y,z+h);v=max(1,round(r*.56))
        d.ellipse((bx-r,by-v,bx+r,by+v),fill=palette[3])
        d.rectangle((xx-r,yy,xx+r,by),fill=palette[2])
        for u,c in [(-r+1,palette[1]),(-r+2,palette[0]),(r-2,palette[3])]:
            d.line((xx+u,yy+1,xx+u,by-1),fill=c,width=max(1,r//4))
        d.ellipse((xx-r,yy-v,xx+r,yy+v),fill=palette[0],outline=palette[3])
        if opening and r>2:d.ellipse((xx-r+2,yy-v+1,xx+r-2,yy+v-1),fill=INK)
    def buoy(p,r=4):
        x,y=pt(*p);d.ellipse((x-r,y-r,x+r,y+r),fill='#b8523f',outline='#683f33')
        d.ellipse((x-r+2,y-r+2,x+r-2,y+r-2),fill='#605749')
        for dx,dy in ((-1,-r+1),(r-1,-1),(0,r-1),(-r+1,0)):
            d.line((x+dx,y+dy,x+dx+1,y+dy+1),fill='#f6deb0',width=2)
    def rail(u,v,z,metal=CREAM,h=7):
        dx,dy=v[0]-u[0],v[1]-u[1];steps=max(1,round(math.hypot(dx,dy)/9))
        for i in range(steps+1):
            x=u[0]+dx*i/steps;y=u[1]+dy*i/steps
            line([(x,y,z),(x,y,z+h)],metal[2])
        line([(*u,z+3),(*v,z+3)],metal[2])
        line([(*u,z+h),(*v,z+h)],metal[0])
    def skylight(x,y,z,l,b):
        cub(x,y,z,l,b,2,WOOD)
        for side in (-1,1):
            poly([(x-l,y,z+6),(x+l,y,z+6),(x+l,y+b*side,z+2),(x-l,y+b*side,z+2)],SLATE[1 if side<0 else 2],WOOD[3])
            for k in range(-l+3,l,5):line([(x+k,y,z+6),(x+k,y+b*side,z+2)],CREAM[2])
    def gig(x,y,z,scale=1):
        boat=[(x+u*scale,y+v*scale) for u,v in [(-17,0),(-12,-4),(1,-5),(13,-3),(17,0),(10,4),(-5,5),(-14,3)]]
        shape_walls(boat,z,z+3,CREAM);lid(boat,z+3,WOOD[3],CREAM[0])
        for k in (-9,-2,5,11):line([(x+k*scale,y-2,z+4),(x+k*scale,y+3,z+4)],WOOD[0],2)
        for k in (-12,12):line([(x+k,y+4,z-3),(x+k,y+6,z+6),(x+k,y+3,z+8)],STEEL[1],2)
        if scale==1 and x<0:
            sh=[(x+u,y+v) for u,v in [(-15,0),(-10,-3),(4,-4),(9,-2),(8,3),(-8,3)]]
            lid(sh,z+5,'#afbfac','#798e87')
            line([(x-8,y-3,z+5),(x-7,y+3,z+5)],'#dfcc9e')
    def flag(x,y,z):
        u,v=pt(x,y,z)
        d.line((u,v+18,u,v-1),fill='#785b45');d.point((u,v-2),fill='#f2cb82')
        d.polygon([(u+1,v),(u+7,v+1),(u+13,v-1),(u+12,v+4),(u+6,v+6),(u+1,v+4)],fill='#a95541')
        d.line((u+2,v+2,u+6,v+3,u+11,v+1),fill='#e1c49d')
        d.rectangle((u+1,v,u+4,v+2),fill='#4b6979')
    def cabin(x,y,z,l,b,h,count,trim):
        sh=chamfer(x,y,l,b,min(b*.46,8))
        def panel(u,v,nx):
            ax,ay=u;bx,by=v;dx,dy=bx-ax,by-ay
            length=math.hypot(dx,dy)
            def w(t,k):return(ax+dx*t,ay+dy*t,z+k)
            def band(lo,hi,col):poly([w(0,lo),w(1,lo),w(1,hi),w(0,hi)],col)
            band(0,3,trim[2]);band(h-3,h,CREAM[3])
            n=count if length>2*l*.65 else max(1,round(length/9))
            for i in range(n):
                t=(i+.13)/n;e=(i+.85)/n
                if n>=9 and i in (2,n-3):
                    poly([w(t,2),w(e,2),w(e,h-4),w(t,h-4)],WOOD[3])
                    poly([w(t+.012,7),w(e-.015,7),w(e-.015,h-5),w(t+.012,h-5)],'#6e9b9c')
                    line([w(e,3),w(e,h-3)],WOOD[0]);continue
                poly([w(t,5),w(e,5),w(e,h-4),w(t,h-4)],'#364d58')
                poly([w(t+.006,7),w(e-.009,7),w(e-.009,h-6),w(t+.006,h-6)],('#658b91','#739a9d','#88a8a2','#64848a')[i%4])
                if i%3!=1:poly([w(t, h-6),w((t+e)/2,h-6),w(t,h-10)],'#c3d2b9')
                if ferry and n>=9:
                    line([w(t,h-5),w(t+(e-t)*.19,h-3),w(e-(e-t)*.19,h-3),w(e,h-5)],'#b49b75')
                    line([w(t,h//2),w(e,h//2)],'#81958b')
                if n>=9 and i in (1,6,9):
                    poly([w(t,h-4),w(e,h-4),w(e,h-9),w(t,h-8)],'#bd955f')
                    line([w(t,h-9),w(e,h-10)],'#e2c48b')
                if n>=9 and i in (4,7):
                    head=pt(*w((t+e)/2,9))
                    d.ellipse((head[0]-2,head[1]-2,head[0]+1,head[1]+1),fill='#967c66')
                    d.line((head[0]-2,head[1]-2,head[0]+1,head[1]-2),fill='#4a4e50')
                    d.line((head[0]-2,head[1]+2,head[0]+2,head[1]+2),fill='#4a6267',width=2)
                line([w(t,5),w(e,5)],CREAM[0])
                if n<5:line([w((t+e)/2,5),w((t+e)/2,h-4)],CREAM[1])
            line([w(0,h-1),w(1,h-1)],CREAM[0])
        shape_walls(sh,z,z+h,CREAM,panel)
        cap=chamfer(x,y,l+2,b+2,min(b*.5,9))
        shape_walls(cap,z+h,z+h+3,trim);lid(cap,z+h+3,trim[1],trim[3])
        inner=chamfer(x,y,l-1,b-1,min(b*.5,8))
        lid(inner,z+h+3,trim[1],trim[0])
        for off in range(-int(l)+13,int(l)-5,18):
            line([(x+off,y-b+3,z+h+3),(x+off,y+b-3,z+h+3)],trim[2])
        return z+h+3

    L,B,H=(125,34,17) if ferry else (151,31,22)
    stations=([(-1,0),(-.96,.53),(-.87,.84),(-.69,.98),(-.42,1),(.42,1),(.69,.98),(.87,.84),(.96,.53),(1,0)]
              if ferry else [(-1,.09),(-.99,.54),(-.91,.83),(-.72,.99),(-.42,1),(.36,1),(.66,.91),(.84,.66),(.94,.32),(1,0)])
    half=[(L*u,B*v) for u,v in stations]
    hull=half+[(x,-y) for x,y in reversed(half) if y]
    # Screen-space sorting keeps the far rail behind the deck at all eight headings.
    def hullpt(p,t,scale):
        x,y=p;return (x*(.97+.03*t),y*scale,(H+(3 if ferry else 10)*(abs(x/L)**3))*t)
    faces=sorted(zip(hull,hull[1:]+hull[:1]),key=lambda pair:sum(x*fy+y*ry for x,y in pair))
    paint=GREEN if ferry else STEEL
    for u,v in faces:
        light=((u[0]+v[0])*fx/(2*L)+(u[1]+v[1])*rx/(2*B))
        k=1 if light<-.55 else 2 if light<.66 else 3
        for low,high,sc0,sc1,col in [(0,.13,.84,.93,RED[3]),(.13,.25,.93,.97,RED[1 if k==1 else 2]),(.25,.63,.97,1,paint[k]),(.63,.80,1,1,paint[max(1,k-1)]),(.8,.88,1,1.02,WOOD[3]),(.88,1,1.02,1,paint[k])]:
            poly([hullpt(u,low,sc0),hullpt(v,low,sc0),hullpt(v,high,sc1),hullpt(u,high,sc1)],col)
        line([hullpt(u,.82,1.01),hullpt(v,.82,1.01)],WOOD[1])
    top=[hullpt(p,1,1) for p in hull]
    poly(top,WOOD[1],WOOD[3])
    # Deck boards disappear behind the deckhouses and under the hatch covers.
    for y in range(-int(B)+3,int(B),5):
        width=next((abs(x) for x,b in reversed(half) if b>=abs(y)),L*.5)
        line([(-width*.95,y,H+2),(width*.95,y,H+2)],WOOD[2])
    line(top+[top[0]],CREAM[1],2)
    def depth(x,y):return x*fy+y*ry
    def tackle(x,y):
        drum(x,y,H+3,4,5,STEEL);line([(x-4,y,H+9),(x+4,y,H+9)],CREAM[2],2)
    def shadow(x,y,z,l,b):
        # An attached shadow falls across the same deck for every heading.
        du=4*fx+4*fy;dv=4*rx+4*ry
        lid(chamfer(x+du,y+dv,l,b,min(b/2,5)),z,'#51695f' if ferry else '#8b7053')
    def coils(x,y,z):
        for r in (5,3,1):
            chain=[(x+math.cos(a*.4)*r,y+math.sin(a*.4)*r*.66,z) for a in range(17)]
            line(chain,'#765b40',2);line(chain[:9],'#e0bb7e')
    if ferry:
        shadow(1,0,H+2,95,26)
        coils(-110,1,H+3);coils(104,6,H+3)
        for sign in (-1,1):
            for yy in (-14,14):tackle(sign*105,yy)
            for yy in (-1,1):rail((sign*91,yy*27),(sign*108,yy*19),H+2)
        roof=cabin(0,0,H+1,94,26,19,14,GREEN)
        for yy in sorted((-29,29),key=lambda y:depth(0,y)):
            if depth(0,yy)>0:
                for x in (-69,66):buoy((x,yy,H+10))
        shadow(0,0,roof,79,22)
        roof=cabin(0,0,roof,77,22,18,11,GREEN)
        shadow(0,0,roof,11,8)
        for x in (-43,43):
            for y in (-14,14):shadow(x,y,roof,15,4)
        fittings=[]
        for sign in (-1,1):
            x=sign*85
            def pilot(x=x):
                cabin(x,0,roof-2,14,15,15,3,CREAM)
                cap=[(x+u,v) for u,v in [( -16,-6),(-12,-14),(8,-15),(16,-9),(16,7),(10,14),(-10,14),(-16,7)]]
                lid(cap,roof+17,SLATE[2],CREAM[1])
                for k in (-7,0,7):
                    line([(x-10,k,roof+17),(x+9,k,roof+17)],SLATE[1])
                ellipse((x,1,roof+18),3,2,SLATE[0],SLATE[2])
                line([(x-8,-9,roof+18),(x+8,-9,roof+18)],SLATE[0])
            fittings.append((depth(x,0),pilot))
            for yy in (-14,14):
                fittings.append((depth(sign*43,yy),lambda x=sign*43,y=yy:gig(x,y,roof+2)))
        def chimney():
            cub(0,0,roof,13,11,3,STEEL);drum(0,0,roof+3,10,23,('#ffdb91','#e9b661','#be843a','#85522d'))
            drum(0,0,roof+26,10,7,STEEL,True)
            for x in (-19,18):
                drum(x,3,roof,3,6,CREAM);ellipse((x,3,roof+7),4,3,'#d8b987','#8b7150')
        fittings.append((0,chimney))
        for _,paint_obj in sorted(fittings,key=lambda v:v[0]):paint_obj()
        near=-1 if ry<0 else 1
        if abs(ry)>.4:
            # Brass running lights, the red port lamp and the dark rubbing strake.
            for x in (-85,85):
                ellipse((x,near*15,roof+9),2,2,'#984e42' if near<0 else '#587562',CREAM[1])
            for x in (-54,48):buoy((x,near*25,H+11),4)
        for x in (-108,108):
            for y in (-8,8):
                cub(x,y,H+3,5,2,3,WOOD)
        if heading in (2,6):
            # Gilt lettering fits between the two lower rubbing strakes.
            from PIL import ImageFont
            mask=Image.new('1',(50,9));ImageDraw.Draw(mask).text((0,-2),'FERRY No. 2',font=ImageFont.load_default(size=8),fill=1)
            px,py=pt(0,near*33,H*.55)
            im.paste('#d9cba1',(px-23,py-3,px+27,py+6),mask)
        flag(108,0,H+44)
    else:
        for x,l,b in [(-104,25,18),(-33,34,22),(34,22,18),(95,26,18)]:shadow(x,0,H+2,l,b)
        coils(126,5,H+6);coils(-124,-4,H+4)
        fittings=[]
        def hold(x,l,covered):
            cub(x,0,H+2,l,18,5,WOOD,'#423c39')
            if covered:
                sh=chamfer(x,0,l-1,17,3);lid(sh,H+8,'#738789','#455d61')
                poly([(x-l+3,-14,H+8),(x+l-2,-14,H+8),(x+l-6,1,H+10),(x-l+2,0,H+10)],'#8e9d95')
                for u in (-l+8,l-9):
                    line([(x+u+4,-13,H+9),(x+u,-6,H+9),(x+u-1,0,H+10)],'#a8aca0')
                    line([(x+u,2,H+8),(x+u+3,12,H+7)],'#637879')
                for u in (-l+4,0,l-4):line([(x+u,-17,H+6),(x+u,0,H+11),(x+u,17,H+6)],'#c4b389',2)
            else:
                plank(x-l+2,-15,x+1,15,H+8,WOOD[1])
                for u in range(-l+4,0,4):line([(x+u,-14,H+8),(x+u,14,H+8)],WOOD[2])
                for u,v in [(5,-4),(14,1),(5,6)]:cub(x+u,v,H+6,4,4,4,WOOD)
        for x,l,covered in [(-105,24,True),(34,21,False),(95,25,True)]:
            fittings.append((depth(x,0),lambda x=x,l=l,c=covered:hold(x,l,c)))
        def bridge():
            roof=cabin(-33,0,H+1,33,22,20,7,WOOD)
            cub(-34,0,roof,34,24,2,CREAM)
            top=cabin(-26,0,roof+2,18,18,13,5,SLATE)
            skylight(-32,0,top+1,7,4)
            drum(-52,-3,roof+1,7,21,RED);drum(-52,-3,roof+22,7,6,STEEL,True)
            px,py=pt(-52,-3,roof+15)
            d.line((px-4,py+1,px-1,py-2,px+2,py+1,px+4,py-1),fill='#e7cc96',width=2)
            for y in (-20,20):
                if depth(0,y)>0:buoy((-23,y,roof+5))
                gig(-58,y,roof+2,.55)
        fittings.append((depth(-33,0),bridge))
        def derrick(x,height):
            z=H+2
            cub(x,0,z,7,6,5,STEEL)
            cub(x+7,3,z,4,3,5,WOOD);drum(x+7,3,z+5,3,2,STEEL)
            drum(x,0,z+4,3,height-4,WOOD)
            for sg,dh in [(-1,41),(1,50)]:
                u=x+sg*26
                line([(x,0,z+height),(u,0,z+dh),(u,0,z+dh-15)],STEEL[3])
                line([(x,0,z+7),(u,0,z+dh)],WOOD[3],4)
                line([(x,0,z+8),(u,0,z+dh+1)],WOOD[0],2)
                ellipse((u,0,z+dh),2,2,WOOD[1],WOOD[3])
            for side in (-1,1):
                line([(x+side*14,side*18,z),(x,0,z+height-4)],'#7f7364')
            drum(x,0,z+height-3,3,2,STEEL)
        for x,ht in [(67,69),(-84,56)]:fittings.append((depth(x,0),lambda x=x,h=ht:derrick(x,h)))
        for x in (-133,132):fittings.append((depth(x,0),lambda x=x:tackle(x,0)))
        for _,paint_obj in sorted(fittings,key=lambda v:v[0]):paint_obj()
        flag(-123,0,H+30)
    hull_mask=Image.new("1",im.size);hd=ImageDraw.Draw(hull_mask)
    for u,v in faces:
        hd.polygon([pt(*p) for p in [hullpt(u,0,.84),hullpt(v,0,.84),hullpt(v,1,1),hullpt(u,1,1)]],fill=1)
    before_wear=im.copy()
    def beam(u):
        for (a,b),(e,f) in zip(stations,stations[1:]):
            if a<=u<=e:return B*(b+(f-b)*(u-a)/(e-a))
        return 0
    for sign in (-1,1):
        if depth(0,sign)<.1:continue
        for x in (-L*.72,-L*.39,L*.43,L*.72):
            y=sign*beam(x/L)
            px,py=pt(x,y,H*.58)
            d.line((px-2,py-9,px,py-1),fill=WOOD[2]);d.ellipse((px-4,py-3,px+3,py+4),fill=INK,outline='#4e524b')
            d.arc((px-3,py-2,px+2,py+3),155,300,fill='#87918a');d.point((px,py),fill=paint[2])
    # Rust runs from the hawse and water glances off a handful of raised plates.
    for sign in (-1,1):
        if depth(0,sign)<.25:continue
        for u,w in ((-.82,7),(-.55,10),(-.22,15),(.21,8),(.59,13),(.83,5)):
            y=sign*beam(u)
            line([(u*L,y,H*.37), (u*L+w,y,H*.37)],paint[1])
        if not ferry:
            x,y=pt(L*.89,beam(.89)*sign,H*.8)
            d.ellipse((x-4,y-2,x+2,y+1),fill=INK)
            d.line((x-1,y+1,x-2,y+6),fill='#aa7453',width=2)
            for u in (-.63,-.48,-.35):
                px,py=pt(L*u,sign*B,H*.64);d.ellipse((px-2,py-2,px+1,py+1),fill=INK,outline='#889391')
    before_wear.paste(im,(0,0),hull_mask);im=before_wear
    im.info['anchor']=[185,205];im.info['trim']=True
    return im


def trading_dhow(heading, tender=False, furled=False, finish=0, rig=False):
    """Paint curved strakes, sheer and sails on the final pixel grid."""
    im=Image.new('RGBA',(266,252))
    d=ImageDraw.Draw(im)
    theta=heading*math.pi/4
    fx,fy=math.sin(theta),-math.cos(theta)
    scale=.55 if tender else 1.
    def p(x,y,z):
        return (round(133+scale*(fx*x-fy*y)),round(170+scale*(.68*(fy*x+fx*y)-z)))
    def edge(points,ink,w=1):d.line(points,fill=ink,width=w)
    def fill(points,ink):d.polygon(points,fill=ink)
    def mix(a,b,t):
        return tuple(round(u+(v-u)*t) for u,v in zip(a,b))
    def trim():
        b=im.getbbox()
        out=im.crop(b)
        out.info['anchor']=[133-b[0],170-b[1]]
        return out
    dark,shadow,plank,honey,rim,stripe=[
        ('#342b30','#633b33','#975d3c','#bf804b','#f1bb76','#a45838'),
        ('#252c32','#44383a','#73513e','#ab7950','#dfb581','#49706b'),
        ('#392b2b','#704034','#a9673c','#cb8f4f','#f1ca88','#983f30'),
    ][finish]
    # Each station describes a sheer line, a beam and an inset at the waterline.
    stations=[(-94,3,34),(-88,13,29),(-75,20,25),(-52,24,21),(-26,25,19),
              (4,25,18),(33,22,20),(58,16,23),(77,9,29),(91,2,38),(95,0,43)]
    if tender:
        stations=[(-89,5,31),(-81,16,26),(-62,23,21),(-37,26,18),
                  (0,27,17),(38,24,18),(63,17,22),(82,8,28),(90,0,33)]
    if finish:
        stations=[(x*(1.045 if finish==1 else .96),b*(.91 if finish==1 else 1.04),
            z+(max(0,-x-55)*(.14 if finish==1 else -.10))) for x,b,z in stations]
    def rail(s,side,h):
        x,b,z=s
        belly=(1-min(1,abs(x)/99)**3)
        return p(x*(.83+.17*h),b*side*(.62+.38*h),h*z-(1-h)*(15 if tender else 10)*belly)
    sides=[(s,-1) for s in stations]+[(s,1) for s in reversed(stations)]
    def ring(h):return [rail(s,side,h) for s,side in sides]
    if not rig:
        fill(ring(0),dark)
        for lo,hi,col in [(0,.18,dark),(.18,.40,shadow),(.40,.61,plank),(.61,.80,honey),(.80,.93,plank),(.93,1,rim)]:
            lower,upper=ring(lo),ring(hi)
            edges=sorted(range(len(sides)),key=lambda i:upper[i][1]+upper[(i+1)%len(upper)][1])
            for i in edges:
                j=(i+1)%len(upper)
                fill([lower[i],lower[j],upper[j],upper[i]],col)
                edge([lower[i],lower[j]],shadow if lo>.2 else dark)
        deck=ring(1);fill(deck,shadow)
        inner=[p(x*.975,b*.90*side,z-3.3) for (x,b,z),side in sides]
        fill(inner,'#94663f')
        def breadth(u):
            for (x,b,z),(k,w,h) in zip(stations,stations[1:]):
                if x<=u<=k:
                    t=(u-x)/(k-x)
                    return b+(w-b)*t,z+(h-z)*t
            return 0,32
        for v in range(-20,22,5):
            pts=[p(u,v,breadth(u)[1]-3) for u in range(-84,87,3) if abs(v)<breadth(u)[0]*.84]
            if len(pts)>1:edge(pts,'#b88a58' if v%2 else '#74503c')
        # Ribs, thwarts, and an open hatch leave the middle free for the actual load.
        for u in ((-56,23,58) if tender else (-68,50)):
            b,z=breadth(u); quad=[p(u+i,b*j*.87,z-1) for i,j in [(-3,-1),(3,-1),(3,1),(-3,1)]]
            fill([(x+1,y+2) for x,y in quad],'#604736')
            fill(quad,'#b6804e');edge([quad[0],quad[3]],'#dba872')
            edge([quad[1],quad[2]],'#835938')
            edge([mix(quad[0],quad[3],.13),mix(quad[0],quad[3],.46)],rim)
        if not tender:
            quad=[p(i,j,17) for i,j in [(-28,-12),(-5,-12),(-5,12),(-28,12)]]
            fill(quad,'#493d35');edge(quad+[quad[0]],'#cf9b63',2)
            for u in range(-26,-5,4):edge([p(u,-10,17),p(u,10,17)],'#926e4a')
            for v in (-6,0,6):edge([p(-27,v,17),p(-6,v,17)],'#a88253')
        # Short highlights and interrupted seams follow each board's taper.
        for side in (-1,1):
            top=[rail(s,side,1) for s in stations]
            edge(top,dark,3);edge([(x,y-1) for x,y in top],rim)
            for i,(a,b) in enumerate(zip(stations,stations[1:])):
                if side*fx < -.12: continue
                for k in range(3):
                    h=.25+k*.212
                    u,v=rail(a,side,h),rail(b,side,h)
                    if v[1] < mix(top[i],top[i+1],.55)[1]-1: continue
                    edge([mix(u,v,.10+(i%3)*.06),mix(u,v,.69+(k%2)*.14)],('#76483a','#ad754f','#d29b68')[k])
                    if not tender:
                        x,y=mix(u,v,((i+k)%3+1)/4)
                        d.point((x,y),fill=dark)
                        if k==2:d.point((x+1,y-1),fill='#ecc08a')
                    if (i+k)%3==0:
                        x,y=mix(u,v,.49);edge([(x-2,y-1),(x+1,y-1),(x+3,y)],shadow)
                    if (k+i)%4==1:
                        x,y=mix(u,v,.23);d.rectangle((x,y,x+2,y+1),fill=honey)
                if finish and i not in (0,len(stations)-2):
                    edge([rail(a,side,.84),rail(b,side,.84)],stripe,2)
        for u,side,h in [(-91,-1,32),(-91,1,32),(91,0,40)]:
            if tender and u>90:continue
            a=p(u,side*4,h-6);b=p(u+(3 if u>0 else -2),side*4,h+4)
            edge([a,b],dark,3 if tender else 4);edge([a,b],honey,1 if tender else 2)
            edge([(b[0]-1,b[1]),(b[0]+1,b[1])],rim)
        if not tender:
            # Turned rail at the stern and two low lashing posts at the shrouds.
            for u,b,z in [(-84,-10,27),(-84,10,27),(-68,16,23)]:
                end=p(u,b,z+7);edge([p(u,b,z-2),end],dark,3)
                edge([p(u,b,z+1),end],honey);d.point((end[0]-1,end[1]),fill=rim)
            edge([p(-86,-10,33),p(-86,10,33)],'#996a47',2)
            for v in (-18,18):
                edge([p(4,v*.86,17),p(9,v,19)],'#70523f',3)
                edge([p(4,v*.86,18),p(9,v,20)],'#d8a16a')
        # Rope coil and tiller stay with the hull even when it is unoccupied.
        x,y=p(-51,9,22)
        for r in (5,3):
            d.ellipse((x-r,y-r//2,x+r,y+r//2),outline='#664932')
            d.arc((x-r,y-r//2-1,x+r,y+r//2-1),145,345,fill='#dfb779')
        edge([p(-88,1,29),p(-62,7,30)],dark,3);edge([p(-88,1,30),p(-62,7,31)],honey)
        return trim()

    foot=p(10,0,18);head=p(4,0,112)
    tack=p(70,-17,44);peak=p(-79,28,132)
    def rope(a,b,sag=2,ink='#856950'):
        c=mix(a,b,.55);edge([a,(c[0],c[1]+sag),b],ink)
    for a in [p(90,0,39),p(-63,-19,25),p(-63,19,25)]:
        rope(head,a,2,'#775e49')
    edge([foot,head],dark,5);edge([foot,head],'#a46c40',3)
    edge([(foot[0]-1,foot[1]),(head[0]-1,head[1])],'#e4ad69')
    def yard(t):
        x,y=mix(tack,peak,t)
        return x,y+round(2*math.sin(t*math.pi))
    if furled:
        # Each gasket pinches the gathered canvas. The folds hang catenary-fashion between ties.
        knots=[(.02,.15,.31,.50,.67,.84,.98),(.02,.20,.39,.58,.77,.98),(.02,.16,.36,.52,.73,.86,.98)][finish]
        for i,(a,b) in enumerate(zip(knots,knots[1:])):
            pts=[yard(a+(b-a)*k/12) for k in range(13)]
            sag=(8,11,14,12,10,7)[i]
            bottom=[(x,y+3+round(sag*math.sin(k*math.pi/12)**.8)) for k,(x,y) in enumerate(pts)]
            fill(pts+bottom[::-1],'#ab8562')
            for fraction,col in ((.79,'#d7b68d'),(.56,'#e8cfa4'),(.31,'#f7e3b9')):
                hem=[mix(q,w,fraction) for q,w in zip(pts,bottom)]
                fill(pts+hem[::-1],col)
            edge(bottom,'#89694f')
            for k in (3,9):
                fold=[mix(pts[k],bottom[k],.25),mix(pts[k-1],bottom[k-1],.75),bottom[k-2]]
                fill(fold,'#b9906b');edge(fold[:2],'#e1c59d')
            edge([mix(pts[k],bottom[k],.20) for k in range(3,10)],'#fff0c9')
            x,y=pts[0];edge([(x,y-1),(x+1,y+5)],'#815937',2)
    else:
        def cloth(t,h):
            q=yard(t);clew=p(-65,17,32)
            # The lower edge curves up under tension and the cloth fills to leeward.
            bottom=mix(tack,clew,t)
            a=mix(q,bottom,h)
            belly=math.sin(t*math.pi*.92)*math.sin(h*math.pi*.79)
            pleat=math.sin(3*t*math.pi+.6*h)*math.sin(t*math.pi)*h
            return (a[0]+round((fx*6-fy*18)*belly),a[1]+round((11+fx*6)*belly+2.8*pleat-11*t*(1-t)*h))
        for i in range(16):
            a,b=i/16,(i+1)/16
            for lo,hi,c in [(0,.17,'#f5dfac'),(.17,.59,'#edd3a3'),(.59,.82,'#e3c497'),(.82,1,'#d2ae83')]:
                fill([cloth(a,lo),cloth(b,lo),cloth(b,hi),cloth(a,hi)],c)
            if i%2==0 and i:
                edge([cloth(a,h) for h in (.03,.2,.55,.8,1)],'#c8a782')
        # Creases fan out from the tack and the sheet. Use broken, tapered clusters.
        for t,h,length in ((.24,.15,.17),(.42,.08,.22),(.62,.09,.21),(.79,.11,.17),(.92,.12,.11)):
            fill([cloth(t,h),cloth(t+.022,h+.05),cloth(t+.012,h+length)],'#f8e4bb')
        for t,h in ((.36,.68),(.59,.72),(.81,.76)):
            fill([cloth(t-.018,h+.16),cloth(t+.018,h),cloth(t+.008,h+.16)],'#d3b28a')
        for t in (.29,.45,.62,.79,.94):
            x,y=cloth(t,.57)
            edge([(x-1,y),(x,y+1),(x,y+3),(x+1,y+4)],'#b59777')
            d.point((x-1,y-1),fill='#f5e1b9')
        edge([cloth(i/16,1) for i in range(17)],'#a57e5e')
        edge([cloth(1,h) for h in (0,.3,.6,1)],'#9c765c')
        fill([cloth(t,h) for t,h in [(.70,.73),(.78,.73),(.78,.82),(.70,.82)]],'#d9b78f')
        rope(cloth(1,1),p(-87,12,28))
    rope(head,yard(.54),1,'#5f4d3e')
    edge([yard(i/16) for i in range(17)],'#634333',3)
    edge([(x,y-1) for x,y in [yard(i/16) for i in range(17)]],'#cf985a')
    for t in (.16,.32,.50,.68,.85):
        x,y=yard(t);edge([(x-1,y-2),(x+1,y+2)],'#74573e')
    x,y=head
    fill([(x,y+2),(x+6,y+1),(x+12,y+4),(x+7,y+4),(x+4,y+3),(x,y+5)],'#a45137')
    edge([(x+1,y+2),(x+5,y+2),(x+7,y+3)],'#d18755')
    d.rectangle((x-2,y-2,x+1,y+1),fill='#795138');d.point((x-1,y-2),fill='#e7b46d')
    if finish:
        from PIL import ImageColor
        shades=['#f5dfac','#edd3a3','#e3c497','#d2ae83','#f7e3b9','#e8cfa4','#d7b68d','#ab8562','#a45137','#d18755']
        colors=(['#ede8ca','#dddcc0','#cbcdb2','#b2b7a0','#faf2d9','#e7e4c7','#d2cfb5','#a6a18b','#315c65','#76a0a0']
                if finish==1 else ['#eec991','#e0b57f','#cfa173','#bb895f','#f6d8a5','#e7c18d','#d1a375','#a57b59','#7f4543','#c57f6c'])
        replace={ImageColor.getrgb(a)+(255,): ImageColor.getrgb(b)+(255,) for a,b in zip(shades,colors)}
        im.putdata([replace.get(pixel,pixel) for pixel in im.getdata()])
    return trim()


def cloth_bale():
    im=Image.new('RGBA',(23,18));d=ImageDraw.Draw(im)
    d.polygon([(1,6),(5,2),(16,1),(21,4),(22,13),(18,16),(4,17),(1,14)],fill='#674836')
    d.polygon([(2,6),(6,3),(16,2),(20,4),(17,7),(5,9)],fill='#ecc48a')
    d.polygon([(2,7),(6,9),(17,7),(17,14),(5,16),(2,13)],fill='#c4935b')
    d.polygon([(17,7),(21,5),(21,12),(18,15)],fill='#a6724b')
    for x in (7,14):
        d.line((x+3,2,x-1,6,x,15),fill='#805c40',width=2)
        d.line((x+3,2,x,6,x+1,14),fill='#edcd92')
    d.line((3,8,5,10,3,12),fill='#e2af71')
    d.line((18,8,20,7),fill='#e0af78')
    im.info['anchor']=[11,15]
    return im
