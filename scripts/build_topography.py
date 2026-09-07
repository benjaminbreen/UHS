"""Build only the stage-one terrain atlas; existing playable atlases are untouched."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from art.topography import paint_topography, PALETTE, RISE
from art.atlas import pack_atlas
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/topography'
OUT.mkdir(parents=True,exist_ok=True)
style={'rise':RISE,'palette':PALETTE}
(ROOT/'src/render/generated/topography-style.json').write_text(json.dumps(style))
sprites=paint_topography()
pack_atlas(sprites,OUT,'atlas')
sheet=Image.new('RGB',(960,740),'#202522');d=ImageDraw.Draw(sheet)
d.text((24,18),'UHS / TOPOGRAPHY STUDY / 16px source tiles at 4x',fill='#ede0b1')
rows=[('GROUND / DEEP / SHALLOW', [f'{m}-0' for m in ['damp','grass','dry','soil','gravel','water','shallow']]),
      ('CHANNEL CONNECTIONS', [f'channel-{m}' for m in [1,2,4,8,3,6,9,12]]),
      ('RIVER BANKS', [f'bank-{m}-0' for m in [1,2,4,8,3,9,16,128]]),
      ('SLOPES / DEPTH TRANSITIONS', ['ramp-n','ramp-e','ramp-s','ramp-w','blend-shallow-1','blend-shallow-3']),
      ('SOFT MARGINS', ['blend-damp-1','blend-damp-3','blend-damp-16','blend-grass-8','blend-dry-4','blend-soil-2','blend-gravel-9'])]
for row,(label,names) in enumerate(rows):
    y=60+row*125;d.text((24,y),label,fill='#ede0b1')
    for i,name in enumerate(names):
        tile=Image.new('RGBA',(16,32),'#839644');tile.alpha_composite(sprites[name])
        sheet.paste(tile.resize((48,96),Image.Resampling.NEAREST),(24+i*112,y+20))
for i,c in enumerate(PALETTE):d.rectangle((24+i*37,700,55+i*37,723),fill=c)
(ROOT/'artifacts').mkdir(exist_ok=True)
sheet.save(ROOT/'artifacts/topography-tiles.png')
print(f'{len(sprites)} frames; {len(PALETTE)} terrain colors')
