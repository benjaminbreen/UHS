"""Review sheet for the six material proofs; no runtime or gameplay dependencies."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
from art.props.proofs import PROOFS
ROOT=Path(__file__).resolve().parent.parent

def font(size):
 for path in ['/System/Library/Fonts/Supplemental/Arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf']:
  if Path(path).exists():return ImageFont.truetype(path,size)
 return ImageFont.load_default()

sheet=Image.new('RGB',(1260,1080),'#202a2b');d=ImageDraw.Draw(sheet)
d.text((32,25),'UHS  /  SIX MATERIAL STUDIES',font=font(26),fill='#eddfb8')
d.text((32,65),'Hand-authored pixels  ·  48 × 48 source canvas  ·  6× inspection + 2× scale check',font=font(17),fill='#acb8a9')
names=['Earthen pot','Metal water vessel','Open woven basket','Bound wooden chest','Stone well','Gathered cloth sack']
notes=['Thick rolled lip · fired clay · rounded belly','Brass reflections · turned collar · deep opening','Interlaced strands · curved courses · rolled rim','Overhead front view · parallel straps · recessed hasp','Staggered masonry · capstones · recessed shaft','Collapsed fabric mouth · weighted belly · cinched neck']
for i,(key,draw) in enumerate(PROOFS.items()):
 x=24+(i%3)*412;y=114+(i//3)*470
 d.rounded_rectangle((x,y,x+388,y+446),radius=8,fill='#d8cba4')
 d.text((x+20,y+16),f'0{i+1}  {names[i]}',font=font(21),fill='#343a32')
 sprite=draw(0)
 # Transparent sprite pixels only; shadows are a runtime concern.
 tile=Image.new('RGBA',(48,50))
 tile.alpha_composite(sprite)
 large=tile.resize((288,300),Image.Resampling.NEAREST)
 sheet.paste(large,(x+50,y+52),large)
 d.line((x+20,y+361,x+368,y+361),fill='#b6ab89')
 d.text((x+20,y+378),notes[i].replace(' · ','\n'),font=font(14),fill='#515743',spacing=5)
 small=tile.resize((96,100),Image.Resampling.NEAREST)
 sheet.paste(small,(x+277,y+340),small)
d.text((32,1047),'Review pass 03  /  No baked shadows. Time-of-day cast shadows remain separate in Prop Lab.',font=font(15),fill='#aab6a6')
sheet.save(ROOT/'artifacts/prop-six-proof.png')
print(ROOT/'artifacts/prop-six-proof.png')
