"""Shared shelf packer for source art and lighting masks. Native Phaser pivots."""
from PIL import Image
from pathlib import Path
from contextlib import contextmanager
import hashlib, io, json, os, time

ROOT=Path(__file__).resolve().parents[2]

TIMES={}

@contextmanager
def timed(label):
    t=time.perf_counter()
    try:yield
    finally:TIMES[label]=TIMES.get(label,0)+time.perf_counter()-t

def report_times():
    print('Bake stages: '+', '.join(f'{k} {v:.1f}s' for k,v in TIMES.items()),flush=True)

def write_text(path, text):
    """Leave a file alone, mtime and all, when it already says this."""
    if not path.exists() or path.read_text()!=text:path.write_text(text)

# Pixel and file digests of every PNG written, so an unchanged sheet is
# neither encoded nor rewritten.
BOOK=ROOT/'.cache/bake/png.json'
_BOOK=None

def save_png(im, path, **options):
    global _BOOK
    if _BOOK is None:_BOOK=json.loads(BOOK.read_text()) if BOOK.exists() else {}
    path=Path(path).resolve()
    pixels=hashlib.md5(f'{im.mode}{im.size}'.encode()+im.tobytes()).hexdigest()
    if path.exists():
        on_disk=hashlib.md5(path.read_bytes()).hexdigest()
        known=_BOOK.get(str(path))
        if known and known[1]==on_disk:same=known[0]==pixels
        else:
            with Image.open(path) as old:
                same=old.mode==im.mode and old.size==im.size and old.tobytes()==im.tobytes()
        if same:
            if known!=[pixels,on_disk]:_BOOK[str(path)]=[pixels,on_disk];_keep()
            return
    with timed('png'):im.save(path,**options)
    _BOOK[str(path)]=[pixels,hashlib.md5(path.read_bytes()).hexdigest()]
    _keep()

def _keep():
    BOOK.parent.mkdir(parents=True,exist_ok=True)
    tmp=BOOK.with_suffix(f'.{os.getpid()}.tmp');tmp.write_text(json.dumps(_BOOK));os.replace(tmp,BOOK)

def freeze(im):
    """An image and its info as bytes for the bake caches."""
    buf=io.BytesIO();im.save(buf,'PNG',compress_level=1)
    return buf.getvalue(),dict(im.info)

def thaw(data):
    png,info=data
    im=Image.open(io.BytesIO(png));im.load();im.info=info
    return im

def write_metadata(path, text):
    write_text(path,text)
    # Imported metadata lives under src; public keeps the runtime asset copy.
    generated=Path(__file__).resolve().parents[2]/'src/render/generated'
    write_text(generated/f'{path.parent.name}-{path.name}',text)

def pack_atlas(sprites, output, name, width=1024, *, module=False, paged=False):
    frames={};placements=[];x=y=rowh=0
    # Tallest first: shelves stay full instead of leaving air under short sprites.
    seen={}
    for key,im in sorted(sprites.items(),key=lambda kv:(-kv[1].size[1],-kv[1].size[0],kv[0])):
        # A frame that is mostly air (a lit-window layer) may ask to be packed
        # trimmed; Phaser places it by spriteSourceSize within the full size.
        trim=im.getbbox() if im.info.get('trim') else None
        anchor=im.info.get('anchor')
        full=im.size
        if trim:
            im=im.crop(trim)
        w,h=im.size
        if w+2>width:raise ValueError(f'{key} exceeds atlas width')
        # A building drawn the same whichever way its lot faces is packed once;
        # every name points at the one rect.
        mark=(im.size,tuple(anchor or ()),trim,im.tobytes())
        if mark in seen:
            frames[key]=seen[mark];continue
        if x+w+2>width:x=0;y+=rowh+2;rowh=0
        frame={'frame':{'x':x,'y':y,'w':w,'h':h},'sourceSize':{'w':w,'h':h},'spriteSourceSize':{'x':0,'y':0,'w':w,'h':h},'rotated':False,'trimmed':False}
        if trim:
            frame['sourceSize']={'w':full[0],'h':full[1]}
            frame['spriteSourceSize']={'x':trim[0],'y':trim[1],'w':w,'h':h};frame['trimmed']=True
        if anchor:
            ax,ay=anchor;frame['pivot']={'x':ax/full[0],'y':ay/full[1]}
        frames[key]=frame;seen[mark]=frame;placements.append((im,x,y));x+=w+2;rowh=max(rowh,h)
    # Keep each texture within a conservative GPU limit as modular kits grow.
    # Repack wider before allocating; never silently emit an unusable tall atlas.
    # A sheet the game loads only as 1024px pages may run taller.
    if y+rowh+2>(32768 if paged and width>=4096 else 4096):
        if width<4096:return pack_atlas(sprites,output,name,width*2,module=module,paged=paged)
        raise ValueError(f'{name} needs multiple pages: exceeds 4096 pixels')
    atlas=Image.new('RGBA',(width,y+rowh+2))
    for im,x,y in placements:atlas.paste(im,(x,y))
    save_png(atlas,output/f'{name}.png')
    metadata=json.dumps({'frames':frames,'meta':{'image':f'{name}.png','scale':'1','size':{'w':atlas.width,'h':atlas.height}}})
    path=output/f'{name}.json'
    if module:write_metadata(path,metadata)
    else:write_text(path,metadata)
    return atlas
