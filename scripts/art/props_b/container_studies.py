"""Container review: continuous surfaces for B, authored voxel solids for C."""
import math
import numpy as np
from PIL import Image
from art.voxel import Grid, render, SUN

SECOND_CONTAINER_STUDIES = [
    ('egyptjar','Sealed Egyptian storage jar','Pharaonic Egypt / household and stores','Tapering body, pale slip and substantial mud seal'),
    ('canaanjar','Canaanite transport jar','Bronze Age eastern Mediterranean','Broad shoulders, paired handles and sealed mouth'),
    ('majiayao','Painted Chinese storage jar','Majiayao tradition / late Neolithic','Rounded shoulders, low handles; interpreted painted bands'),
    ('grainhamper','Lidded coiled storage basket','West Africa / regional basketry study','Heavy coiled walls, fitted lid and reinforced foot'),
    ('olla','Central Mexican storage olla','Mesoamerica / household earthenware','Broad mouth, rounded belly and small lifting handles'),
    ('andeansack','Andean woven storage sack','Andes / household and transport','Soft woven body, folded mouth and carrying ties'),
    ('parfleche','Folded rawhide parfleche','Historic Plains / geometric study','Overlapping flaps, fastening cords and painted panels'),
    ('pacificbasket','Plaited leaf carrying basket','Pacific islands / everyday basketry study','Folded corners, broad plaits and integrated handles'),
    ('grainbin','Raised woven grain bin','South / Southeast Asian agricultural settings','Reinforced woven body, timber feet and removable lid'),
    ('stoneware','Lidded stoneware crock','Europe / early modern–industrial study','Thick rolled lip, lifting ears and restrained cobalt bands'),
    ('demijohn','Wicker-protected demijohn','Trade and households / eighteenth–twentieth century','Exposed green glass, fitted wicker jacket and cork'),
    ('kerosenetin','Reused kerosene tin','Worldwide trade / late nineteenth–twentieth century','Folded metal seams, wire handle and worn printed panel'),
]


def historical_containers():
    from .vessels import CONTAINER_STUDIES
    sprites={f'nature-container-{kind}': container_study(kind) for kind,*_ in CONTAINER_STUDIES+SECOND_CONTAINER_STUDIES}
    for im in sprites.values():im.info['shadowAnchor']=im.info['anchor']
    return sprites


def container_model(kind):
    # Keep material highlights coloured, as on the pinned timber-and-tile house.
    tuned = [
        ['#35282d','#55352e','#754b34','#96623e','#b47e50','#cca16b','#dfbd87','#eddaa8'],
        ['#3e373b','#61584e','#847966','#a6997e','#c0b398','#d5c9ac','#e4d9bf','#f1e8d1'],
        ['#3c2b2b','#57422f','#765535','#957341','#af8a52','#c4a46b','#d7bb86','#e8d2a3'],
        ['#352b30','#58402f','#7d5637','#a27647','#bd955f','#d3b07a','#e3c894','#f0dfb4'],
        ['#482d32','#704033','#93533a','#b57348','#ce915d','#dfab77','#edc592','#f5dfb5'],
        ['#29252c','#3e2c2b','#593a2d','#784a2f','#96663e','#b08656','#c5a775','#dcc79a'],
        ['#2e2c2c','#474332','#635b38','#827847','#9b9257','#b6ab6d','#ccc18a','#ded5a8'],
        ['#40383a','#665c50','#91816b','#b5a58a','#d0c2a6','#e2d6ba','#ede3cd','#f4eedb'],
        ['#39262e','#5e3030','#813d32','#a64f35','#c46c45','#d69262','#e3b385','#f1d3a4'],
        ['#473239','#73513e','#9f7650','#bd9666','#d3b281','#e4cb9d','#efdfbb','#f6edda'],
        ['#1d302e','#294737','#386543','#548954','#78a165','#a3bc88','#c8d6b0','#e7e9ce'],
        ['#2c303d','#454953','#626970','#838b8b','#a6afaa','#c4ccc1','#dce0d0','#edf0df'],
        ['#262f42','#344559','#4b6474','#66848d','#8aa4a8','#b3c4be','#d1dcd0','#e8ecdc'],
        ['#38313e','#57505c','#7b737b','#9b9597','#b9b5b1','#d0cdc3','#e3dfd1','#f0eadb'],
    ]
    palettes=[None]+[[tuple(int(c[i:i+2],16) for i in (1,3,5)) for c in row] for row in tuned]
    hide,cloth,rope,wood,clay,glaze,olive,bark,paint = range(1,10)
    buff,glass,steel,blue,stoneware=range(10,15)
    parts=[]
    def add(field,mat,texture=None): parts.append((field,mat,texture))
    def lathe(prof,mat,sy=1,cx=0,cy=0,texture=None,hollow=None,smooth=False):
        zz,rr=np.array(prof).T
        delta=np.diff(rr)/np.diff(zz)
        slopes=np.r_[delta[0],np.zeros(len(zz)-2),delta[-1]]
        for i in range(1,len(zz)-1):
            if delta[i-1]*delta[i]>0:
                slopes[i]=2*delta[i-1]*delta[i]/(delta[i-1]+delta[i])
        def f(x,y,z):
            r=np.interp(z,zz,rr)
            if smooth:
                i=np.clip(np.searchsorted(zz,z)-1,0,len(zz)-2)
                dz=zz[i+1]-zz[i];t=np.clip((z-zz[i])/dz,0,1)
                r=(2*t**3-3*t**2+1)*rr[i]+(t**3-2*t**2+t)*dz*slopes[i]+(-2*t**3+3*t**2)*rr[i+1]+(t**3-t**2)*dz*slopes[i+1]
            q=np.maximum(np.hypot(x-cx,(y-cy)/sy)-r,np.maximum(zz[0]-z,z-zz[-1]))
            if hollow:
                inner,floor=hollow
                q=np.maximum(q,np.minimum(inner-np.hypot(x-cx,(y-cy)/sy),z-floor))
            return q
        add(f,mat,texture)
    def ball(center,radii,mat,texture=None):
        a,b,c=center;rx,ry,rz=radii
        add(lambda x,y,z:(np.sqrt(((x-a)/rx)**2+((y-b)/ry)**2+((z-c)/rz)**2)-1)*min(radii),mat,texture)
    def box(center,half,rounded,mat,texture=None):
        a,b,c=center;rx,ry,rz=half
        def f(x,y,z):
            qx=np.abs(x-a)-rx+rounded;qy=np.abs(y-b)-ry+rounded;qz=np.abs(z-c)-rz+rounded
            return np.sqrt(np.maximum(qx,0)**2+np.maximum(qy,0)**2+np.maximum(qz,0)**2)+np.minimum(np.maximum(np.maximum(qx,qy),qz),0)-rounded
        add(f,mat,texture)
    def tube(points,r,mat):
        pts=np.array(points,float)
        def f(x,y,z):
            q=np.full(np.broadcast(x,y,z).shape,100.)
            for a,b in zip(pts,pts[1:]):
                v=b-a;t=np.clip(((x-a[0])*v[0]+(y-a[1])*v[1]+(z-a[2])*v[2])/(v@v),0,1)
                q=np.minimum(q,np.sqrt((x-a[0]-t*v[0])**2+(y-a[1]-t*v[1])**2+(z-a[2]-t*v[2])**2)-r)
            return q
        add(f,mat)
    def ring(z,rx,ry,r,mat,cx=0,cy=0):
        add(lambda x,y,zz:np.hypot((np.hypot((x-cx)/rx,(y-cy)/ry)-1)*min(rx,ry),zz-z)-r,mat)
    def weave(x,y,z):
        a=np.arctan2(y,x)
        course=z/2.3;stake=(a+math.pi)*9/math.pi
        return np.where((course%1)<.24,-.7,np.where(((stake+(np.floor(course)%2)*.5)%1)<.22,.35,0))
    def woodgrain(x,y,z):
        return np.where((x+np.sin(z*.25)*.24)%4.1<.3,-.6,0)
    def ceramic(x,y,z):
        # A few broad firing variations, rather than a noisy surface filter.
        return np.where((x>4)&(z<10),-.28,np.where((x<0)&(z>13)&(z<17),.12,0))
    if kind=='waterskin':
        lathe([(2,3),(3,6),(6,9),(13,10),(20,8),(25,5),(29,2.5)],hide,sy=.46,
              texture=lambda x,y,z:np.where(np.sin(z*.45+x*.35)>.84,-.4,0),smooth=True)
        lathe([(28,2.1),(32,2),(33,2.5)],hide,sy=.8)
        lathe([(32,1.4),(35,1.6)],wood,sy=.85)
        tube([(-7,-3,19),(-12,-1,25),(-12,0,33),(-8,1,39),(1,1,40),(9,0,35),(11,-1,28),(7,-3,21)],.7,hide)
        tube([(-6,-3.8,6),(-8,-4.6,10),(-8,-4.8,16),(-6,-4.4,21),(-3,-3,26)],.45,rope)
        for z,x in [(7,-6),(10,-8),(13,-8),(16,-8),(19,-7),(22,-5)]:
            tube([(x-.7,-4.8,z),(x+.7,-4.9,z+.4)],.38,cloth)
        ring(29,2.8,2.2,.65,rope)
        tube([(1,-2.2,29),(4,-3,27),(3,-3.5,25)],.5,rope)
    elif kind=='bale':
        box((0,0,12),(19,10,11),3.4,cloth,
            lambda x,y,z:np.where((np.abs(x)>14)&(z<7),-.6,np.where((z>17)&(np.abs(y)<5),.25,0)))
        # Folded triangles are cut into the cloth, not drawn over a flat box.
        for side in [-1,1]:
            tube([(side*16,-9.4,4),(side*11,-10.4,10),(side*15,-10,16)],.45,hide)
            tube([(side*17,-8.5,18),(side*12,-10.2,16),(side*8,-10.3,15)],.4,rope)
        for x in [-10,10]:
            tube([(x,-8,1.5),(x,-10.7,5),(x,-10.7,19),(x,-7,23.6),(x,7,23.6),(x,10.7,19),(x,10.7,5),(x,7,1.5),(x,-8,1.5)],.85,rope)
        tube([(-19,0,11),(-18,-10.7,11),(18,-10.7,11),(19,0,11),(18,10.7,11),(-18,10.7,11),(-19,0,11)],.8,rope)
        ball((-10,-11,11),(1.3,1,1.2),rope)
        tube([(-10,-11,11),(-6,-11,8),(-4,-10.8,9),(-6,-10.6,11)],.5,rope)
    elif kind=='matka':
        ring(2,7.8,7.8,1.3,rope)
        lathe([(3,5),(5,8),(9,11),(14,12.6),(19,12),(23,9),(26,5),(28,4.5)],clay,texture=ceramic,smooth=True)
        lathe([(27.5,4.5),(28.5,5.4),(29.5,5)],clay)
        ball((0,0,29.5),(5.6,5.6,1.5),cloth,
             lambda x,y,z:np.where(np.sin(np.arctan2(y,x)*5)>.6,-.55,0))
        tube([(3,-3,29),(4,-4,26),(3,-5,24)],.9,cloth)
        ring(28.4,5,5,.4,rope)
    elif kind=='milkbag':
        box((0,0,13),(12,5.5,12),3.8,hide,
            lambda x,y,z:np.where((np.abs(x)>8)&(z<18),-.45,np.where((np.abs(x)<6)&(z>5)&(z<10),.18,0)))
        lathe([(21,6),(25,3),(30,2.3)],hide,sy=.75)
        lathe([(29,2.4),(32,2.2),(33,3)],wood)
        for x in [-1,1]:
            tube([(x*9,0,23),(x*13,0,28),(x*15,0,26),(x*13,0,22)],.9,hide)
        tube([(-9,-4.8,20),(-10,-5.4,15),(-10,-5.2,5),(-7,-5,2),(7,-5,2),(10,-5.3,5),(10,-5.3,18)],.4,rope)
        for x in [-9,9]:
            for z in [5,8,11,14,17]:tube([(x-.8,-5.6,z),(x+.8,-5.7,z+.4)],.35,cloth)
        ring(27,3,2.4,.6,rope)
    elif kind=='onggi':
        lathe([(1,7),(2,9),(7,12),(15,14.2),(22,13.7),(28,11),(30,8.8)],glaze,
              texture=lambda x,y,z:np.where((z%8<.45)&(z>5),-.35,0),smooth=True)
        lathe([(29,9),(31,10),(32,9.6)],glaze)
        lathe([(32,13),(33,13.5),(35,11),(36,8),(36.7,3)],glaze)
        lathe([(36,2.4),(38,2.2),(39,1)],glaze)
        # Slightly raised turning ridges remain elliptical all the way around.
        ring(10,13.1,13.1,.28,glaze);ring(22,13.5,13.5,.28,glaze)
    elif kind=='taru':
        lathe([(1,12),(3,13),(24,13),(25,12.6)],wood,
              texture=lambda x,y,z:np.where(((np.arctan2(y,x)+math.pi)*16/math.tau)%1<.14,-1.5,woodgrain(x,y,z)*.5))
        for z in [3,6,21,24]:ring(z,13.2,13.2,.65,rope)
        lathe([(25.2,12),(26.2,12)],wood,
              texture=lambda x,y,z:np.where((y+1)%4<.7,-1.3,0))
        for y in [-7,-3,1,5,9]:
            half=math.sqrt(12**2-y**2)-.8
            tube([(-half,y,26.5),(half,y,26.5)],.36,hide)
        box((0,0,26),(9,1,1),.5,wood)
        tube([(-8,-10,23),(-9,-12,27),(-6,-13,28),(-5,-12,24)],.7,rope)
    elif kind=='ricebale':
        def rice(x,y,z):
            r=np.hypot(x,(z-11)*1.05)
            return np.maximum(r-10.5,np.abs(y)-12)
        add(rice,rope,lambda x,y,z:np.where(y<-11.4,np.where(np.hypot(x,(z-11)*1.05)%2.6<.65,-1.15,.1),np.where((np.arctan2(z-11,x)*13/math.pi)%1<.23,-.7,0)))
        for y in [-8,8]:
            a=np.linspace(0,math.tau,45)
            tube([(11*math.cos(t),y,11+10.5*math.sin(t)) for t in a],.75,cloth)
        for angle in [0,math.pi/2,math.pi,math.pi*1.5]:
            x=10.7*math.cos(angle);z=11+10.2*math.sin(angle)
            tube([(x,-12.5,z),(x,12.5,z)],.6,rope)
        tube([(-10.6,-12.7,11),(0,-13.1,11),(10.6,-12.7,11)],.7,cloth)
        tube([(0,-12.7,.8),(0,-13.1,11),(0,-12.7,21.2)],.7,cloth)
        ball((0,-13.4,11),(1,1,1),rope)
    elif kind=='tradejar':
        lathe([(1,6),(3,8),(10,12),(20,14),(29,12),(35,7),(38,4.5),(40,5)],olive,texture=ceramic,smooth=True)
        ring(39.5,5.2,5.2,.6,olive)
        lathe([(39.5,3.9),(42,3.6)],wood,
              texture=lambda x,y,z:np.where(x%3<.5,-.8,0))
        for a in [math.pi/4,math.pi*.75,math.pi*1.25,math.pi*1.75]:
            pts=[(r*math.cos(a),r*math.sin(a),z) for r,z in [(10.8,31),(13.3,32),(14,29),(12.5,27)]]
            tube(pts,1.1,olive)
        ring(28.5,12.6,12.6,.3,olive)
    elif kind=='milkcontainer':
        lathe([(1,3),(3,5.5),(9,7.4),(19,7.2),(26,5.4),(30,4)],rope,sy=.85,texture=weave,smooth=True)
        lathe([(28,4.5),(29,6),(33,5.7),(36,3.7),(37,2.5)],hide,sy=.85)
        lathe([(36,2),(39,1.8)],hide,sy=.8)
        ring(29,5.8,5,.55,hide)
        tube([(4,0,34),(9,0,32),(11,-1,23),(11,-2,9),(6,-2,3)],.8,hide)
        tube([(-3,-4.5,27),(-5,-5.6,20),(-5,-5.6,9),(-3,-4.7,4)],.55,hide)
    elif kind=='urpu':
        def deco(x,y,z):
            a=np.arctan2(y,x)
            panel=(y<0)&(np.abs(x)<6.5)&(z>9)&(z<28)
            bands=(np.abs(z-12)<.6)|(np.abs(z-25)<.6)
            zig=(np.abs((z-16)-np.abs((x+5)%5-2.5))<.55)&(z<20)
            bars=(np.abs(x)<.7)&(z>20)
            return np.where(panel & (bands|zig|bars),-2,np.where(panel,.6,0))
        lathe([(1,.6),(5,4),(11,8),(18,11),(24,10),(28,7),(32,3),(40,2.5),(43,5.8)],clay,texture=deco,smooth=True)
        ring(42.7,5.8,5.8,.5,clay)
        lathe([(41.8,3.7),(43.3,3.7)],paint,hollow=(3.3,40))
        for sign in [-1,1]:
            tube([(sign*9,0,23),(sign*13,0,22),(sign*13,0,17),(sign*9,0,15)],.9,clay)
        ball((0,-5.5,30),(1.4,1.4,1.5),clay)
        ring(3,4.3,4.3,.9,rope)
    elif kind=='barkbox':
        lathe([(1,12),(3,14),(17,15)],bark,sy=.65,
              texture=lambda x,y,z:np.where(((z+np.floor(x/4)*3)%7<.8)&(np.sin(x*.6)>.1),-1.5,0))
        ring(16,15.2,10,1,wood)
        lathe([(17,16.2),(18,16.5),(19,15)],bark,sy=.65,
              texture=lambda x,y,z:np.where((y+np.floor(x/5))%9<.4,-.7,0))
        ring(18,16.2,10.6,.55,wood)
        tube([(-3,0,19),(-3,0,22),(0,0,23),(3,0,22),(3,0,19)],.7,wood)
        for z in range(4,16,3):tube([(-11,-6.3,z),(-9.8,-7.2,z+1)],.45,wood)
        for a in np.linspace(math.pi,math.tau,12):
            tube([(16.3*math.cos(a),10.8*math.sin(a),18.6),(16.3*math.cos(a),10.8*math.sin(a),17)],.4,rope)
    elif kind=='coolamon':
        def bowl(x,y,z):
            outer=(np.sqrt((x/21)**2+(y/12)**2+((z-5.5)/5)**2)-1)*5
            inner=(np.sqrt((x/19.2)**2+(y/10.2)**2+((z-7)/4.5)**2)-1)*4.5
            return np.maximum(np.maximum(outer,-inner),z-5.5)
        add(bowl,wood,lambda x,y,z:np.where(z<4.5,-1.4,0)+np.where(((x+y*.35)%5<.55)&(z<4),-.8,0))
        ring(5.5,20.6,11.8,.65,wood)
    elif kind=='egyptjar':
        ring(1.5,3.6,3.6,1.2,rope)
        lathe([(1,1.5),(5,4),(12,7),(23,8.8),(30,7.3),(34,4),(37,3.2)],buff,smooth=True,texture=ceramic)
        lathe([(36,3.5),(38,4),(39,3.5)],clay)
        lathe([(38,4.3),(41,4.7),(43,3.8),(44,2.8)],hide,sy=.9,smooth=True)
        tube([(-2,-3.7,42),(-1,-4,40),(1,-4,39)],.35,buff)
    elif kind=='canaanjar':
        ring(1.5,3.8,3.8,1.2,rope)
        lathe([(1,1.8),(5,4.5),(14,8),(24,11.5),(28,12),(32,8.5),(34,4),(37,3.8)],buff,smooth=True,texture=ceramic)
        for s in [-1,1]:
            tube([(s*8.5,0,31),(s*13,0,32),(s*14,0,28),(s*12,0,24)],1.1,buff)
        lathe([(36,4),(38,4.5),(39,4.2)],clay)
        lathe([(38,3.4),(40,3.5),(41,2.5)],hide,smooth=True)
    elif kind=='majiayao':
        lathe([(1,5),(3,7.5),(10,12),(18,14.3),(25,12.7),(29,8),(31,5),(34,4.5)],buff,
              hollow=(3.3,27),smooth=True)
        ring(33.7,4.7,4.7,.7,clay)
        for s in [-1,1]:
            tube([(s*10,0,9),(s*14,0,10),(s*14.5,0,13),(s*12.5,0,15)],1,buff)
    elif kind=='grainhamper':
        prof=[(2,8),(4,11),(12,13),(23,14),(29,13.5)]
        lathe(prof,rope,smooth=True,texture=weave)
        for z in range(5,29,3):
            r=np.interp(z,*np.array(prof).T)
            ring(z,r,r,.35,rope)
        ring(3,10,10,.9,wood);ring(29,14,14,.8,rope)
        lathe([(29.5,14.5),(30.5,15),(32,13),(35,8),(36,3)],rope,
              texture=lambda x,y,z:np.where(np.hypot(x,y)%2.3<.5,-.8,0))
        tube([(-2,0,35.5),(-2,0,38),(2,0,38),(2,0,35.5)],.65,rope)
    elif kind=='olla':
        lathe([(1,5),(3,8),(9,12),(17,13.6),(23,11.5),(26,8.2),(29,8.5)],clay,
              hollow=(7,20),texture=ceramic,smooth=True)
        ring(28.5,8.7,8.7,.9,clay)
        for s in [-1,1]:
            tube([(s*10,0,23),(s*13.5,0,26),(s*15,0,23),(s*12.5,0,20)],.9,clay)
    elif kind=='andeansack':
        def sack(x,y,z):
            rx=np.interp(z,[1,4,12,18,25],[6,12,15,14.5,12])
            ry=np.interp(z,[1,5,14,25],[3,6,7,5.5])
            xx=x+.55*np.sin(z*.18)
            yy=y+.35*np.sin(x*.65+z*.22)
            q=(((np.abs(xx)/rx)**4+(np.abs(yy)/ry)**4)**.25-1)*ry
            return np.maximum(q,np.maximum(1-z,z-26))
        add(sack,cloth,lambda x,y,z:np.where((x+z*.2)%4.7<.5,-.35,0))
        box((0,-.5,26),(12,5.4,1.5),1.3,cloth)
        tube([(-12,-5,25),(-8,-6.5,23),(0,-7,22),(8,-6.5,23),(12,-5,25)],.5,rope)
        for s in [-1,1]:
            tube([(s*11,1,24),(s*14,1,29),(s*10,1,31),(s*7,0,26)],.8,rope)
            tube([(s*12,-4.7,5),(s*13.7,-5.8,13),(s*12,-5,22)],.4,hide)
        tube([(0,-6,26),(3,-7,24),(2,-7.5,21)],.7,rope)
    elif kind=='parfleche':
        box((0,0,13),(18,5,11),1.7,buff)
        for s in [-1,1]:
            box((s*9,-5.1,13),(8.6,.65,9.8),.6,buff)
        for z in [8,19]:
            tube([(-2,-6.1,z),(0,-6.6,z+1),(2,-6.1,z)],.55,hide)
        tube([(0,-6.4,18),(0,-6.5,9)],.5,rope)
        tube([(-6,0,24),(-6,0,27),(5,0,27),(5,0,24)],.7,hide)
    elif kind=='pacificbasket':
        def shell(x,y,z):
            rx=12+z*.21;ry=6.8+z*.07
            outer=(((np.abs(x)/rx)**4+(np.abs(y)/ry)**4)**.25-1)*ry
            inner=(((np.abs(x)/(rx-1.4))**4+(np.abs(y)/(ry-1.4))**4)**.25-1)*(ry-1.4)
            return np.maximum(np.maximum(outer,np.maximum(2-z,z-24)),np.minimum(-inner,z-5))
        add(shell,rope,lambda x,y,z:np.where((x+z*1.2)%5<1,-.9,np.where((x-z*1.2)%5<1,.3,0)))
        a=np.linspace(0,math.tau,49)
        tube([(17.2*np.sign(math.cos(t))*abs(math.cos(t))**.5,
               8.5*np.sign(math.sin(t))*abs(math.sin(t))**.5,24) for t in a],.75,rope)
        for y in [-7.5,7.5]:
            tube([(-10,y,24),(-9,y,31),(-5,y,35),(5,y,35),(9,y,31),(10,y,24)],.9,rope)
    elif kind=='grainbin':
        for x in [-9,9]:
            for y in [-7,7]:box((x,y,4),(1.1,1.1,4),.35,wood)
        box((0,0,5.5),(12,9,1),.5,wood)
        prof=[(6,11.5),(9,13),(25,14),(32,14.5)]
        lathe(prof,rope,texture=weave)
        for z in [8,18,29,32]:ring(z,np.interp(z,*np.array(prof).T)+.3,np.interp(z,*np.array(prof).T)+.3,.65,wood)
        for a in np.linspace(0,math.tau,13)[:-1]:
            tube([(r*math.cos(a),r*math.sin(a),z) for z,r in prof],.55,wood)
        lathe([(32,15),(33,16),(36,13),(41,5),(42.5,1)],rope,
              texture=lambda x,y,z:np.where((np.arctan2(y,x)*18/math.pi)%1<.2,-.8,0))
        ring(33,16,16,.7,rope)
    elif kind=='stoneware':
        lathe([(1,7),(3,9),(16,10.5),(22,9),(23,9.5)],stoneware,smooth=True)
        ring(23,10,10,.9,stoneware)
        lathe([(24,10.3),(25,11),(27,8),(28,3)],stoneware)
        lathe([(27.5,2),(30,2),(31,1)],stoneware)
        for s in [-1,1]:
            tube([(s*9.5,0,19),(s*13,0,20),(s*13,0,17),(s*10,0,16)],.9,stoneware)
    elif kind=='demijohn':
        lathe([(1,5),(3,9),(10,12),(17,11),(22,7),(26,2.5),(32,2)],glass,smooth=True)
        lathe([(1,6),(4,10),(10,12.6),(16,12),(19,10)],rope,smooth=True,texture=weave)
        ring(19,10.2,10.2,.65,rope)
        for s in [-1,1]:
            tube([(s*10,0,9),(s*15,0,12),(s*15,0,18),(s*10,0,19)],.9,rope)
        ring(31.5,2.1,2.1,.55,glass)
        lathe([(32,1.5),(34,1.7),(35,1.3)],wood)
    elif kind=='kerosenetin':
        box((0,0,14),(14,7.5,13),.8,steel)
        for x in [-13.5,13.5]:
            for y in [-7.1,7.1]:tube([(x,y,2),(x,y,26)],.4,steel)
        for z in [1.5,26.5]:
            tube([(-13,-7.4,z),(13,-7.4,z),(14,-6,z),(14,6,z),(13,7.4,z),(-13,7.4,z),(-14,6,z),(-14,-6,z),(-13,-7.4,z)],.5,steel)
        lathe([(26.5,2.2),(29,2.2),(30,2.8)],steel,cx=7,cy=0)
        tube([(-8,0,27),(-8,0,31),(-5,0,33),(2,0,33),(4,0,31),(4,0,27)],.65,steel)
    else:
        raise ValueError(kind)
    return parts,palettes


def container_study(kind,voxel=False):
    parts,palettes=container_model(kind)
    def field(x,y,z,materials=False):
        shape=np.broadcast(x,y,z).shape
        best=np.full(shape,1e5);ids=np.zeros(shape,np.uint8)
        for i,(f,_,_) in enumerate(parts):
            v=f(x,y,z);sel=v<best
            best=np.minimum(best,v);ids=np.where(sel,i,ids)
        return (best,ids) if materials else best
    def painted_material(x,y,z,mat):
        if kind=='urpu':
            panel=(mat==5)&(y<-2)&(np.abs(x)<5.8)&(z>10)&(z<27)
            border=(np.abs(z-12)<.6)|(np.abs(z-25)<.6)
            triangles=(np.abs(z-17-np.abs((x+5)%5-2.5))<.7)
            bars=(np.abs(np.abs(x)-1.7)<.5)&(z>20)
            mat=np.where(panel,2,mat)
            mat=np.where(panel&(border|triangles|bars),9,mat)
        elif kind=='majiayao':
            band=(mat==10)&(z>17)&(z<29)
            u=(np.arctan2(y,x)+math.pi)*4/math.pi
            wave=np.abs(z-(23+2.4*np.sin(u*math.pi)))<.85
            rims=(np.abs(z-18.5)<.6)|(np.abs(z-28)<.6)
            mat=np.where(band&(wave|rims),6,mat)
        elif kind=='grainhamper':
            mat=np.where((mat==3)&(((z>23)&(z<24))|((z>26)&(z<27))),1,mat)
        elif kind=='andeansack':
            woven=(mat==2)&(z>4)&(z<24)
            bands=(np.abs(x)<.8)|(np.abs(np.abs(x)-7)<.9)|((z>7)&(z<9))
            mat=np.where(woven&bands,9,mat)
        elif kind=='parfleche':
            panel=(mat==10)&(y<-5.5)&(np.abs(x)>3)&(np.abs(x)<16.5)&(z>4)&(z<22)
            edge=(np.abs(z-5)<.6)|(np.abs(z-21)<.6)|(np.abs(np.abs(x)-15.5)<.6)
            triangle=(np.abs(z-13)<(np.abs(x)-4)*.65)
            mat=np.where(panel&triangle,np.where(z>13,13,9),mat)
            mat=np.where(panel&edge,6,mat)
        elif kind=='stoneware':
            mat=np.where((mat==14)&(((z>7)&(z<8.2))|((z>20)&(z<21))),13,mat)
        elif kind=='kerosenetin':
            front=(mat==12)&(y<-7)&(np.abs(x)<10)&(z>7)&(z<22)
            mat=np.where(front,2,mat)
            ink=front&(np.abs(x)<8)&(z>9)&(z<20)
            mat=np.where(ink,13,mat)
            mat=np.where(ink&((np.abs(z-17)<.6)|((z>11)&(z<13)&(np.abs(x)<5))),2,mat)
            rust=(y<-6.5)&(((z<4)&(x>5))|((x<-12)&(z>17)&(z<22)))
            mat=np.where(rust,9,mat)
        return mat
    W,H,cx,base=72,72,36,58
    if voxel:
        g=Grid(-28,29,-25,26,52)
        for colors in palettes[1:]: g.mat(colors,gain=.88,bias=-.15)
        g.mats[6].bias=-.7
        x,y,z=np.meshgrid(np.arange(-28,29)+.5,np.arange(-25,26)+.5,np.arange(52)+.5,indexing='ij')
        dist,ids=field(x,y,z,True)
        solid=dist<=0
        for i,(_,mat,tex) in enumerate(parts):g.m[solid&(ids==i)]=mat
        g.m[solid]=painted_material(x[solid],y[solid],z[solid],g.m[solid])
        # Quantised curved normals retain voxel construction without cube-face striping.
        e=.65
        normals=np.stack([field(x+e,y,z)-field(x-e,y,z),field(x,y+e,z)-field(x,y-e,z),field(x,y,z+e)-field(x,y,z-e)],-1)
        normals/=np.maximum(np.linalg.norm(normals,axis=-1,keepdims=True),.001)
        q=np.rint(normals*2).astype(np.int8)
        for n in np.unique(q[solid],axis=0):
            if not np.any(n):continue
            sel=solid & np.all(q==n,axis=-1)
            g.n[sel]=g.normal(n)
        # Construction textures use the same world coordinates as the B study.
        for mat in range(1,len(palettes)):
            texparts=[(i,t) for i,(_,m,t) in enumerate(parts) if m==mat and t]
            if texparts:
                def texture(info,texparts=texparts):
                    xx,yy,zz=info['x']+.5,info['y']+.5,info['z']+.5
                    _,ii=field(xx,yy,zz,True);v=np.zeros_like(xx,float)
                    for i,t in texparts:v=np.where(ii==i,t(xx,yy,zz),v)
                    return v
                g.mats[mat].tex=texture
        rgba,buffers=render(g,W,H,cx,base,10000000,ambient=.43,sun=.65)
        im=Image.fromarray(rgba,'RGBA')
    else:
        xx,ss=np.meshgrid(np.arange(W)+.5-cx,base-(np.arange(H)+.5))
        hit=np.zeros((H,W),bool);yyhit=np.zeros((H,W));zzhit=np.zeros((H,W));phit=np.zeros((H,W),np.uint8)
        for yy in np.arange(-25,26,.24):
            zz=ss-.5*yy
            dist,ids=field(xx,yy,zz,True)
            sel=(dist<=0)&~hit
            yyhit[sel]=yy;zzhit[sel]=zz[sel];phit[sel]=ids[sel];hit|=sel
        x=xx[hit];y=yyhit[hit];z=zzhit[hit];ii=phit[hit]
        e=.12
        n=np.stack([field(x+e,y,z)-field(x-e,y,z),field(x,y+e,z)-field(x,y-e,z),field(x,y,z+e)-field(x,y,z-e)],-1)
        n/=np.maximum(np.linalg.norm(n,axis=-1,keepdims=True),.001)
        light=np.maximum(np.sum(n*SUN,axis=1),0)
        shadow=np.zeros(len(x),bool)
        for t in [1.2,2,3,4.5,6,9,13]:
            shadow|=field(x+n[:,0]*.55+SUN[0]*t,y+n[:,1]*.55+SUN[1]*t,z+n[:,2]*.55+SUN[2]*t)<-.1
        v=(.39+.59*light*~shadow)*7
        rgb=np.zeros((H,W,4),np.uint8);colors=np.zeros((len(x),4),np.uint8)
        for i,(_,mat,tex) in enumerate(parts):
            sel=ii==i;value=v[sel].copy()
            if tex:value+=tex(x[sel],y[sel],z[sel])
            if mat==6:value-=.65
            if kind in ['onggi','tradejar'] and mat in [6,7]:
                sheen=(n[sel,0]<-.3)&(n[sel,0]>-.6)&(n[sel,2]>.0)&~shadow[sel]
                value+=sheen*.6
            if kind=='demijohn' and mat==11:
                value-=1.5
                value+=((n[sel,0]<-.25)&(n[sel,0]>-.7)&~shadow[sel])*.9
            if kind=='olla' and mat==5:
                value-=((np.hypot(x[sel],y[sel])<7.4)&(z[sel]>19.5))*2.5
            if kind=='majiayao' and mat==10:
                value-=((np.hypot(x[sel],y[sel])<3.6)&(z[sel]>26.5))*2.5
            if kind=='pacificbasket' and mat==3:
                value-=((y[sel]>0)&(z[sel]<24))*1.8
            painted=painted_material(x[sel],y[sel],z[sel],np.full(sel.sum(),mat))
            for chosen in np.unique(painted):
                sub=painted==chosen
                level=value.copy()
                if kind=='majiayao' and chosen==6:level-=2
                if kind=='parfleche' and chosen in [6,9,13]:level-=1.2
                if kind=='kerosenetin' and chosen==13:level-=1.5
                pixels=np.array(palettes[chosen])[np.clip(np.rint(level),1,7).astype(int)]
                target=np.flatnonzero(sel)[sub]
                colors[target,:3]=pixels[sub]
            colors[sel,3]=255
        rgb[hit]=colors;im=Image.fromarray(rgb,'RGBA')
        from PIL import ImageDraw
        d=ImageDraw.Draw(im)
        def project(p):
            x,y,z=p
            return round(cx+x-.5),round(base-z-.5*y-.5)
        def stroke(points,mat,level):
            d.line([project(p) for p in points],fill=tuple(palettes[mat][level])+(255,),width=1)
        if kind=='taru':
            for y in [-7,-3,1,5,9]:
                half=math.sqrt(11.3**2-y*y)
                stroke([(-half,y,26.4),(half,y,26.4)],4,2)
            for x in [-10,-6,-1,4,9]:
                y=-math.sqrt(13**2-x*x)-.2
                stroke([(x,y,7.7),(x,y,19)],4,2 if x>5 else 3)
                stroke([(x+.8,y,8),(x+.8,y,18.7)],4,5 if x<3 else 4)
            for z in [3,6,21,24]:
                stroke([(13.5*math.cos(t),13.5*math.sin(t),z) for t in np.linspace(math.pi,math.tau,30)],3,3)
                stroke([(13.5*math.cos(t),13.5*math.sin(t),z+.6) for t in np.linspace(math.pi,math.pi*1.65,20)],3,6)
            stroke([(-8,-.5,27.1),(8,-.5,27.1)],4,6)
        elif kind=='bale':
            for s in [-1,1]:
                stroke([(s*16,-9.5,5),(s*12,-10.2,9),(s*16,-9.8,16)],2,2)
                stroke([(s*15,-9.5,5),(s*11,-10.3,9),(s*15,-9.8,16)],2,5)
                stroke([(s*14,-10.2,18),(s*9,-10.2,15),(s*6,-10.2,15)],2,3)
            for x in [-10,10]:
                stroke([(x,-10.8,3),(x,-10.8,20),(x,-7,23.8),(x,7,23.8)],3,3)
                stroke([(x+.8,-10.8,4),(x+.8,-10.8,20),(x+.8,-7,23.8),(x+.8,7,23.8)],3,5)
            stroke([(-17,-10.8,11),(17,-10.8,11)],3,3)
            stroke([(-17,-10.8,11.8),(17,-10.8,11.8)],3,5)
        elif kind=='barkbox':
            for x,z,length in [(-8,5,3),(-4,10,2),(2,7,4),(8,12,2),(-10,13,2),(5,4,2)]:
                y=-.65*math.sqrt(14**2-x*x)-.3
                stroke([(x,y,z),(x+length,y,z)],8,2)
                stroke([(x,y,z+.7),(x+length-1,y,z+.7)],8,5)
        elif kind=='onggi':
            stroke([(-6,-10.4,26),(-7,-11,24),(-7,-11.4,22)],6,6)
            stroke([(-8,-11.2,19),(-8,-11.2,17)],6,5)
        elif kind=='urpu':
            for z in [12,24]:
                rad=np.interp(z,[11,18,24],[8,11,10])
                stroke([(x,-math.sqrt(rad*rad-x*x)-.3,z) for x in np.linspace(-5,5,12)],9,2)
            for x in [-2,2]:
                stroke([(x,-math.sqrt(10*10-x*x)-.3,z) for z in [21,22,23]],9,2)
        elif kind=='egyptjar':
            stroke([(-2,-3.8,42),(-1,-4,40),(1,-4,39)],1,2)
            stroke([(-4,-6,29),(-5,-6.5,27)],10,6)
        elif kind=='andeansack':
            for s in [-1,1]:
                for z in [6,10,14,18,22]:
                    stroke([(s*12,-5.7,z),(s*13,-5.8,z+.5)],3,3)
            stroke([(-10,-5.5,26),(0,-6,25),(10,-5.5,26)],2,6)
        elif kind=='parfleche':
            stroke([(0,-6.7,8),(0,-6.7,19)],1,2)
            for z in [8,19]:
                stroke([(-2,-6.5,z),(0,-6.8,z+1),(2,-6.5,z)],3,6)
        elif kind=='stoneware':
            stroke([(-6,-8,20),(-7,-8.3,17),(-7,-8.3,15)],14,6)
            stroke([(-7,-8,12),(-7,-8,10)],14,5)
        elif kind=='demijohn':
            stroke([(-1,-2.1,31),(-1,-2.2,27),(-3,-4,24),(-5,-5.5,23)],11,7)
            stroke([(-7,-7,21),(-8,-7,20)],11,6)
        elif kind=='kerosenetin':
            stroke([(-13,-7.5,3),(-13,-7.5,25)],12,5)
            stroke([(12,-7.5,3),(12,-7.5,25)],12,2)
            stroke([(-12,-7.5,25),(12,-7.5,25)],12,6)
            stroke([(-8,-7.6,17),(-6,-7.6,16)],2,5)
            stroke([(5,-7.6,9),(7,-7.6,11)],12,4)
    # A single outside pixel contour; its colour follows the adjacent material.
    a=np.array(im);solid=a[:,:,3]>0;out=a.copy()
    for dy,dx in [(1,0),(0,1),(0,-1),(-1,0)]:
        neighbor=np.roll(solid,(dy,dx),(0,1));edge=neighbor&~solid&(out[:,:,3]==0)
        sample=np.roll(a,(dy,dx),(0,1))
        out[edge,:3]=(sample[edge,:3]*.25+np.array([45,29,49])*.5).astype(np.uint8)
        out[edge,3]=255
    im=Image.fromarray(out,'RGBA');bb=im.getbbox()
    assert bb[0]>0 and bb[1]>0 and bb[2]<W and bb[3]<H,(kind,bb)
    im=im.crop((bb[0]-2,bb[1]-2,bb[2]+2,bb[3]+2))
    im.info['anchor']=[cx-bb[0]+2,base-bb[1]+2]
    return im
