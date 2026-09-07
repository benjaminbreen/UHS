"""Contact sheet for the next ten props. Transparent source pixels, no shadows."""
from pathlib import Path
from art.props import draw_prop
from PIL import Image,ImageDraw,ImageFont
from art.props.daily import DAILY
ROOT=Path(__file__).resolve().parent.parent

def font(size):
 for f in ['/System/Library/Fonts/Supplemental/Arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
  if Path(f).exists():return ImageFont.truetype(f,size)
 return ImageFont.load_default()

sheet=Image.new('RGB',(1560,1000),'#202a2b');d=ImageDraw.Draw(sheet)
d.text((30,25),'UHS / TEN EVERYDAY PROP STUDIES',font=font(28),fill='#eddfb8')
d.text((30,66),'48 × 48 source pixels  ·  5× inspection + 2× scale check  ·  No baked ground shadows',font=font(17),fill='#aab7a6')
names=['Storage jar','Water jug','Amphora','Glazed jar','Lidded basket','Barrel','Crate','Wooden pail','Trough','Roofed well']
notes=['Seated lid / fired clay','Open handle / rolled lip','Paired handles / foot','Glaze reflection / dark mouth','Woven lid / loop handle','Curved staves / iron hoops','Front bracing / top slats','Wood staves / metal handle','Recessed water / raised rim','Masonry / windlass / roof']
for i,(key,draw) in enumerate(DAILY.items()):
 x=20+(i%5)*308;y=112+(i//5)*418
 d.rounded_rectangle((x,y,x+288,y+397),radius=7,fill='#d8cba4')
 d.text((x+16,y+16),f'{i+1:02}  {names[i]}',font=font(21),fill='#343a32')
 im=draw_prop(key,0);large=im.resize((240,240),Image.Resampling.NEAREST)
 sheet.paste(large,(x+24,y+54),large)
 d.line((x+16,y+306,x+272,y+306),fill='#b5a986')
 d.text((x+16,y+330),notes[i].replace(' / ','\n'),font=font(14),fill='#4d5444',spacing=7)
 small=im.resize((96,96),Image.Resampling.NEAREST)
 sheet.paste(small,(x+178,y+294),small)
d.text((30,964),'Review only / Available in Command+2 Prop Lab with independent time-of-day shadows and material variants.',font=font(16),fill='#aab7a6')
sheet.save(ROOT/'artifacts/prop-next-ten.png')
print(ROOT/'artifacts/prop-next-ten.png')
