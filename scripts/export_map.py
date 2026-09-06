"""Export four generated chunks at native pixel scale; no hand-placed mock data."""
from PIL import Image
from pathlib import Path
import subprocess,json,sys
root=Path(__file__).resolve().parent.parent
pack=sys.argv[1] if len(sys.argv)>1 else 'roman'
scene=json.loads(subprocess.check_output(['node','--import','tsx','scripts/dump-map.ts',pack],cwd=root))
atlas=Image.open(root/'public/packs/atlas.png');frames=json.loads((root/'public/packs/atlas.json').read_text())['frames']
def sprite(name):
 f=frames[name]['frame'];return atlas.crop((f['x'],f['y'],f['x']+f['w'],f['y']+f['h']))
im=Image.new('RGBA',(scene['width']*16,scene['height']*16))
for y,row in enumerate(scene['tiles']):
 for x,t in enumerate(row):im.paste(sprite(t if t=='bridge' else t+'0'),(x*16,y*16))
for s in scene['sprites']:
 pic=sprite(s['name']);x=round(s['x']-scene['startX']*16-pic.width/2);y=round(s['y']-scene['startY']*16-pic.height);im.alpha_composite(pic,(x,y))
path=root/f'artifacts/{pack}-stitched.png';im.save(path);print(path)
