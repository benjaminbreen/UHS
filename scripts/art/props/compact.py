"""Small props authored on the world grid, never scaled-down large drawings.

48px frames are transparent storage only. Occupied silhouettes determine size;
all details below are whole world pixels, with no baked ground shadows.
"""
from .proofs import art


def lip(a, x, y, w, h=5):
 a.ell((x,y,x+w,y+h),0)
 a.ell((x+1,y,x+w-1,y+h-1),5)
 a.ell((x+2,y+1,x+w-2,y+h-2),1)
 a.line((x+3,y+1,x+w-3,y+1),0)
 a.line((x+3,y,x+w-3,y),7)
 a.line((x+3,y+h-1,x+w-3,y+h-1),6)


def vessel(v, kind):
 # Width, shoulder, neck and belly are chosen per object, not scaled templates.
 specs={'earthen-pot':(6,33,31,4), 'storage-jar':(10,21,17,6),
        'water-jug':(5,29,22,2), 'amphora':(8,24,16,3),
        'glazed-jar':(9,25,21,5), 'metal-vessel':(6,30,23,3),
        'gourd':(5,31,24,2)}
 r,shoulder,neck,n=specs[kind]
 a=art('brass' if kind=='metal-vessel' else 'clay',v)
 if kind=='glazed-jar':
  a.p=[['#192f30','#274a46','#306055','#3d7c6d','#539787','#77b5a2','#a5d6bd','#d9ecce'],
       ['#202d3b','#304457','#3b5d77','#477f9a','#64a1b3','#8bbec9','#b7d9d7','#e3ece0'],
       ['#34362c','#635d45','#8b8262','#b1a784','#cec39a','#e2d7b1','#f2e9ca','#fff4df']][v%3]
 if kind in ('water-jug','amphora'):
  for sign in ([1] if kind=='water-jug' else [-1,1]):
   x=24+sign*(r-1)
   a.line((x,shoulder+8,x+sign*4,shoulder+5,x+sign*4,shoulder-1,x+sign*2,shoulder-3,x,shoulder-2),0,3)
   a.line((x,shoulder+7,x+sign*3,shoulder+4,x+sign*3,shoulder-1,x+sign,shoulder-2),5)
 a.poly([(24-n,neck+2),(24+n,neck+2),(24+n,shoulder-2),(24+r-1,shoulder+2),(24+r,37),(24+r-2,42),(27,44),(21,44),(24-r+1,41),(24-r,36),(24-r+1,shoulder+2),(24-n,shoulder-2)],0)
 a.poly([(24-n+1,neck+3),(24+n-1,neck+3),(24+n-1,shoulder),(24+r-2,shoulder+3),(24+r-1,37),(24+r-3,41),(26,43),(21,42),(25-r,39),(25-r,34),(24-n+1,shoulder)],2)
 a.poly([(24-n+1,neck+3),(24,neck+3),(24,shoulder),(24+r-3,shoulder+4),(24+r-3,37),(25,42),(21,41),(26-r,38),(26-r,shoulder+3)],4)
 a.line((23-n,shoulder+3,23-n,37),5,2)
 a.line((24-r+2,shoulder+4,24-r+2,shoulder+6),6)
 a.line((21,43,26,43),1)
 if r>=8:
  a.rect((25,34,27,35),5);a.rect((21,39,23,39),5)
 if kind=='gourd':
  a.line((23,25,26,25),1);a.line((27,26,30,27,31,30),6)
 else: lip(a,24-n-1,neck,2*n+2,4 if n<4 else 5)
 if kind=='storage-jar':
  a.ell((19,15,29,19),2);a.ell((20,14,28,17),5)
  a.rect((23,12,26,15),1);a.rect((23,12,25,13),6)
 return a.finish()


def basket(v,lidded=False):
 a=art('fiber',v);y=23 if lidded else 33
 a.poly([(13,y),(35,y),(33,42),(29,44),(19,44),(15,42)],0)
 a.poly([(15,y+2),(33,y+2),(31,42),(19,42),(17,39)],2)
 for row in range(y+5,42,3):
  left=16+(row-y)//12;right=32-(row-y)//12
  a.line((left,row,right,row),4)
  for x in range(left+(row%2)*2,right,5):
   a.line((x,row,x+2,row),6);a.rect((x,row+1,x,row+1),3)
 a.line((17,y+5,19,41),5);a.line((30,y+5,29,41),1)
 lip(a,12,y-2,24,7)
 if lidded:
  a.ell((13,y-1,35,y+4),3);a.ell((15,y-1,33,y+2),5)
  for x in range(17,33,4):a.line((x,y,x+2,y+1),7)
  a.line((21,y-1,21,y-4,23,y-6,26,y-6,28,y-4,28,y-1),0,2)
  a.line((22,y-2,22,y-4,24,y-5,26,y-5,27,y-3),6)
 return a.finish()


def sack(v):
 a=art('cloth',v)
 a.poly([(20,24),(28,24),(27,28),(29,32),(33,38),(33,42),(29,44),(18,44),(15,41),(16,36),(20,28)],0)
 a.poly([(21,26),(26,26),(26,30),(30,36),(31,41),(27,43),(19,42),(17,40),(18,35),(21,29)],3)
 a.poly([(21,29),(24,29),(23,34),(26,40),(23,42),(19,41),(18,39)],5)
 a.line((27,30,28,35,30,39,28,42),2)
 a.line((21,30,19,36),6);a.rect((21,38,23,39),6)
 a.poly([(20,26),(18,22),(20,20),(23,21),(26,20),(29,21),(27,26)],1)
 a.line((20,22,21,24,22,22,24,25,26,22,27,22),6)
 a.line((20,27,27,27),2);a.line((21,26,26,26),4)
 return a.finish()


def bucket(v,plastic=False):
 a=art('wood',v)
 if plastic:
  a.p=['#233932','#325947','#41725b','#538c70','#64a186','#87bda0','#b0d9bc','#daf0cf']
 a.poly([(15,29),(33,29),(31,42),(28,44),(20,44),(17,41)],0)
 a.poly([(17,30),(31,30),(29,42),(20,42)],3)
 a.poly([(18,31),(23,32),(23,41),(20,41)],5)
 a.poly([(28,31),(31,30),(29,42),(26,42)],1)
 if not plastic:
  for x in (21,25,28):a.line((x,33,x,40),1)
  for y in (34,40):
   a.line((18,y,30,y),0);a.line((19,y+1,29,y+1),'#7a8983')
 lip(a,14,27,20,7)
 if not plastic:
  a.line((16,29,16,23,20,19,27,19,31,23,31,29),0,2)
  a.line((17,27,17,23,21,20,26,20,30,23,30,27),'#b1b9a3')
  a.line((21,19,26,19),4,2)
 else:a.line((16,32,18,37,23,39,27,38,31,33),0)
 return a.finish()


def grinder(v):
 a=art('stone',v)
 a.ell((10,31,38,44),0);a.ell((11,31,37,42),2)
 a.ell((11,29,37,39),4);a.ell((13,29,35,36),5)
 a.ell((17,31,30,35),3)
 a.poly([(24,27),(29,25),(33,29),(33,34),(30,36),(24,32)],1)
 a.poly([(24,27),(29,26),(32,29),(30,33),(25,31)],6)
 a.line((14,38,14,40),5);a.line((22,40,22,42),3)
 return a.finish()


def lamp(v):
 a=art('clay',v)
 a.ell((17,37,30,44),0);a.ell((18,37,29,42),3)
 lip(a,17,35,13,5)
 a.poly([(27,37),(31,34),(32,37),(29,40)],4)
 a.line((30,35,31,33),0)
 a.poly([(31,33),(30,30),(32,25),(33,29),(34,31),(33,33)],'#e57627')
 a.line((32,28,32,32),'#ffe89a')
 return a.finish()


def modern(v,carton=False):
 a=art('fiber' if carton else 'brass',v)
 a.rect((14,23,33,43),0);a.rect((15,24,32,42),2)
 a.rect((16,25,30,40),4);a.rect((17,25,18,39),6)
 if carton:
  a.poly([(14,24),(18,20),(29,20),(33,24)],0)
  a.poly([(16,23),(19,21),(28,21),(31,23)],6)
  a.line((24,21,24,26),1);a.rect((22,32,26,34),1)
 else:
  a.rect((20,19,28,24),0);a.rect((22,20,26,22),(0,0,0,0))
  a.line((19,28,28,38),5);a.line((28,28,19,38),5)
 return a.finish()

COMPACT={key:(lambda v,key=key:vessel(v,key)) for key in
 ['earthen-pot','storage-jar','water-jug','amphora','glazed-jar','metal-vessel','gourd']}
COMPACT.update({'open-basket':basket,'lidded-basket':lambda v:basket(v,True),
 'sack':sack,'bucket':bucket,'plastic-bin':lambda v:bucket(v,True),
 'grinder':grinder,'oil-lamp':lamp,'metal-tin':modern,'cardboard-box':lambda v:modern(v,True)})
