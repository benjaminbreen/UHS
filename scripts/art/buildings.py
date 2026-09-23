"""Composable building compiler. All dimensions are source pixels, never screen pixels.
Recipes own materials/forms; neither this compiler nor the runtime knows an era.
"""
import json
import random
from PIL import Image, ImageDraw
from art.roof_light import course_tone

# Tone by position rather than by coin toss, so a roof carries the light.
# Off only for the before/after in scripts/art/relight_proof.py.
RELIGHT = True

ROOFS = {
    'thatch': ['#50452b', '#7c6737', '#aa8b47', '#c7ac62', '#e0c888'],
    'terracotta': ['#52332d', '#8d3d2c', '#b44e31', '#ce6940', '#e78a51'],
    'slate': ['#29383e', '#40505c', '#566e79', '#76888d', '#98a5a1'],
    'grey-tile': ['#2d3939', '#444f4a', '#606f61', '#85927c', '#a9b299'],
    'shingle': ['#3b322d', '#635040', '#896b4e', '#ad8b63', '#c6a57b'],
    # Sun-bleached Mediterranean cover tiles, laid in ridges down a low slope.
    'pantile': ['#5a3224', '#96492f', '#c2653d', '#dd8a58', '#f0b184'],
    'kawara': ['#20262a', '#353e44', '#4e5a61', '#6b7880', '#8d9aa2'],
    'giwa': ['#2a2e30', '#474d50', '#646b6d', '#848b8b', '#a4aaa6'],
    'bengal-tile': ['#4c2e26', '#7f4835', '#aa6849', '#cb8a61', '#e3ad7d'],
}

def recess(d,p,x,y,width,height,door=False,niche=False):
    dark,shade,base,light,hi=p['wall']
    d.rectangle((x-2,y-2,x+width+2,y+height+2),fill=light)
    d.rectangle((x-1,y-1,x+width+1,y+height),fill=shade)
    d.rectangle((x,y,x+width,y+height),fill='#283536' if not door and not niche else '#312d27')
    d.rectangle((x+2,y+2,x+width,y+height),fill='#30454b' if not door and not niche else '#453b2d')
    d.line((x-2,y-2,x+width+2,y-2),fill=hi)
    d.line((x+width+2,y-1,x+width+2,y+height),fill=dark)
    if door:
        for xx in range(x+3,x+width,3):d.line((xx,y+4,xx,y+height),fill='#685237')
        d.point((x+width-2,y+height//2+2),fill='#c4a26c')
    elif not niche:d.line((x+2,y+3,x+2,y+height-2),fill='#46606a')
    d.rectangle((x-2,y+height+1,x+width+2,y+height+2),fill=hi)
    d.line((x-1,y+height+3,x+width+2,y+height+3),fill=shade)


DOOR_W, DOOR_H = 10, 23


def build_doors(sprites):
    """One leaf for every door in the game.

    The shut door stays baked into each building; these frames only ever cover
    that rect while it is open, so a new building needs no door art of its own.
    Frame 0 is shut and is never drawn — the runtime hides the overlay instead.
    """
    for phase, leaf in enumerate([DOOR_W - 2, 7, 4, 2]):
        im = Image.new('RGBA', (DOOR_W + 1, DOOR_H + 1))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, DOOR_W, DOOR_H), fill='#1d1e19')
        # A little floor inside, so an open door is a room and not a hole.
        d.rectangle((0, DOOR_H - 4, DOOR_W, DOOR_H), fill='#2b271f')
        d.line((0, DOOR_H - 4, DOOR_W, DOOR_H - 4), fill='#3a3428')
        d.rectangle((0, 0, leaf, DOOR_H), fill='#453b2d')
        d.rectangle((0, 0, leaf, 1), fill='#312d27')
        for x in range(2, leaf, 3):
            d.line((x, 2, x, DOOR_H - 1), fill='#685237')
        # The swinging edge is the one edge of a door that catches the sky.
        d.line((leaf, 1, leaf, DOOR_H), fill='#8a6f49')
        if leaf > 4:
            d.point((leaf - 2, DOOR_H // 2 + 2), fill='#c4a26c')
        sprites[f'door-leaf-{phase}'] = im


def corner_door(artist, ground, x=None):
    """A door for a building the world has placed side-on or back-on.

    The sprite only ever has a front, so the door goes on it, near the corner
    the walk arrives at. Drawing it as a slab on the sprite edge read as a
    black rectangle stuck to the silhouette.
    """
    f = artist.facing
    if f not in ('east', 'west'): return
    if x is None:
        x = artist.w - 18 - DOOR_W if f == 'east' else 8
    recess(artist.d, artist.p, x, ground - DOOR_H - 1, DOOR_W, DOOR_H, door=True)
    return x


class Building:
    def __init__(self, recipe, material):
        self.r = recipe
        self.w, self.h = recipe['canvas']
        self.im = Image.new('RGBA', (self.w, self.h))
        self.d = ImageDraw.Draw(self.im)
        self.p = material
        self.rng = random.Random(recipe['seed'])
        self.top = 27 if recipe['roof'] == 'flat' else 42
        self.bottom = self.h - 6
        self.front = self.w - 12
        # This opening axis is also the walkable entrance in the world contract.
        self.facing = recipe.get('facing', 'south')
        # Its own stream, so nudging the door does not reshuffle the wall wear.
        jitter = random.Random(recipe['seed'] + 977).randrange(-5, 6)
        self.door_x = min(self.front - 9, max(11, recipe['entrance'][0] * 16 + 8 + jitter))

    def wall(self):
        d, w, b, t = self.d, self.w, self.bottom, self.top
        dark, shade, base, light, hi = self.p['wall']
        d.rectangle((4,t,w-7,b), fill=dark)
        d.rectangle((5,t,self.front,b-2), fill=base)
        # No lateral gradient here on purpose. A front wall seen square on is
        # a plane facing the viewer, so the light across it barely falls off;
        # banding it reads as a wall painted in two colours, and any seam soft
        # enough to hide is too weak to see. What a wall wants is what it has:
        # a lit near edge, the return face in shade, and the eaves' own shadow.
        d.rectangle((self.front+1,t,w-8,b-2), fill=shade)
        d.line((5,t+2,5,b-3), fill=light)
        # Broad wear at the base and a few chipped plaster islands, not noise.
        d.rectangle((6,b-9,self.front,b-2),fill=shade)
        for x in range(7,self.front-5,11):
            y=b-self.rng.randrange(7,13)
            d.polygon([(x,b-6),(x,y),(x+3,y-1),(x+7,y+2),(x+6,b-6)],fill=base)
        for _ in range(16):
            x=self.rng.randrange(8,self.front-6);y=self.rng.randrange(t+7,b-13)
            d.rectangle((x,y,x+self.rng.randrange(2,5),y+1),fill=self.rng.choice([shade,light]))
            if self.rng.random()<.35:d.line((x,y-1,x+2,y-1),fill=light)
        d.rectangle((5,t,self.front,t+4),fill=shade)
        d.line((5,t,self.front,t),fill=dark)
        if self.r['wall']=='weatherboard':
            for y in range(t+7,b-9,5):
                d.line((6,y,self.front,y),fill=shade);d.line((6,y+1,self.front,y+1),fill=light)

    def eave_shadow(self):
        """The line of shade an overhang throws down the wall below it.

        Drawn after the roof, because the roof's own bottom courses paint over
        the top of the wall. This is the one thing that seats a roof on a
        building instead of leaving it balanced on top: deepest just under the
        eaves, a step out below that, then a dithered edge, because a cast
        shadow has a soft bottom.
        """
        d,t,w=self.d,self.top,self.w
        wall=self.p['wall']
        dark,shade,base,light,hi=wall
        # Only wall goes into shadow. A window, a beam or a sign in these rows
        # is its own thing and keeps its drawing; darkening everything in a
        # band is what cut the tops off the upper windows.
        skin={tuple(int(c.lstrip('#')[i:i+2],16) for i in (0,2,4)) for c in wall}
        px=self.im.load()
        def step(x,y,tone):
            if 0<=x<self.w and 0<=y<self.h and px[x,y][:3] in skin:
                d.point((x,y),fill=tone)
        top=t+3 if self.r['roof']!='flat' else t+1
        for y in range(top,top+3):
            for x in range(5,self.front+1): step(x,y,dark)
        for y in range(top+3,top+6):
            for x in range(5,self.front+1): step(x,y,shade)
        for i,y in enumerate((top+6,top+7)):
            for x in range(5,self.front+1):
                if (x+y+i)%2: step(x,y,shade)

    def foundation(self):
        d,b=self.d,self.bottom
        ink,shade,light=self.p['foundation']
        d.rectangle((4,b-5,self.w-8,b),fill=ink)
        for x in range(5,self.front-3,8):
            d.rectangle((x,b-5,min(x+6,self.front),b-2),fill=shade)
            d.line((x+1,b-5,min(x+5,self.front),b-5),fill=light)
        d.line((5,b+1,self.w-8,b+1),fill=(30,34,26,155))

    def recess(self,x,y,width,height,door=False,niche=False):
        recess(self.d,self.p,x,y,width,height,door,niche)

    def openings(self):
        if self.facing != 'south':
            for x in [12,self.w-28]: self.recess(x,self.top+10,7,10)
            return
        if self.r['opening']=='roof-hatch':
            # Small sealed facade niche; roof entry is drawn after the roof.
            self.recess(12,self.top+12,6,7,niche=True)
        else:
            for x in [12,self.w-28]:self.recess(x,self.top+10,7,10)
            if self.r.get('stories',1)>1:
                self.d.line((6,self.bottom-37,self.front,self.bottom-37),fill=self.p['wall'][1])
                self.d.line((6,self.bottom-38,self.front,self.bottom-38),fill=self.p['wall'][3])
                for x in [12,self.w-28]:self.recess(x,self.bottom-23,7,10)

    def flat_roof(self):
        d,w=self.d,self.w;ink,shade,base,hi=self.p['roof']
        d.rectangle((3,7,w-7,27),fill=ink)
        d.rectangle((4,8,w-9,25),fill=shade)
        d.rectangle((6,10,w-11,23),fill=base)
        if RELIGHT:
            # The deck is a surface seen from above, so it runs from the lit
            # far edge down into the parapet's own shadow at the near one.
            for i,tone in enumerate((hi,base,shade)):
                y0=10+round(13*i/3); y1=10+round(13*(i+1)/3)
                d.rectangle((6,y0,w-11,y1),fill=tone)
                if i:
                    for x in range(6,w-10):
                        if (x+y0)%2: d.point((x,y0),fill=(hi,base,shade)[i-1])
        # Parapet thickness, inner shadow, and a broken light edge.
        d.line((4,7,w-9,7),fill=hi);d.line((3,8,3,25),fill=hi)
        d.line((6,10,w-12,10),fill=shade)
        d.rectangle((4,24,w-8,27),fill=shade)
        d.line((4,24,w-9,24),fill=hi);d.line((5,26,w-10,26),fill=base)
        for _ in range(18):
            x=self.rng.randrange(8,w-15);y=self.rng.randrange(13,22)
            d.line((x,y,x+self.rng.randrange(1,4),y),fill=self.rng.choice([shade,hi]))
        for x in [14,w-25]:
            d.point((x,24),fill=shade);d.line((x+1,31,x+3,25),fill=ink)
        x=self.door_x-6
        d.rectangle((x-2,15,x+12,28),fill=hi)
        d.rectangle((x,16,x+11,29),fill=shade)
        d.rectangle((x+2,18,x+10,28),fill='#302d28')
        d.line((x+2,18,x+10,18),fill='#594331')

    def tiled_roof(self):
        d,w=self.d,self.w;pal=ROOFS[self.r['roofMaterial']]
        mask=Image.new('L',self.im.size);md=ImageDraw.Draw(mask)
        outline=[(3,39),(10,8),(w-16,8),(w-4,39)]
        if self.r['roof']=='hip':outline=[(1,39),(17,10),(w-23,10),(w-2,39),(w-9,42),(7,42)]
        md.polygon(outline,fill=255)
        layer=Image.new('RGBA',self.im.size);ld=ImageDraw.Draw(layer)
        ld.rectangle((0,0,w,self.h),fill=pal[0])
        for row in range(7):
            y=9+row*4
            for col,x in enumerate(range(-3,w+3,5)):
                tone=(course_tone(pal,row,7,col) if RELIGHT
                      else (pal[2] if self.rng.random()<.7 else pal[1]))
                ld.rectangle((x,y,x+3,y+3),fill=tone)
                ld.line((x,y,x+2,y),fill=pal[3])
                ld.line((x,y+1,x,y+2),fill=pal[4] if (col+row)%4==0 else pal[3])
                ld.line((x+3,y+1,x+3,y+3),fill=pal[1])
                ld.point((x+2,y+3),fill=pal[0])
        self.im.paste(layer,(0,0),mask)
        d.line((10,7,w-16,7),fill=pal[0],width=3)
        for x in range(10,w-16,5):
            d.line((x,6,x+3,6),fill=pal[4]);d.line((x,7,x+3,7),fill=pal[3])
        d.line((3,40,w-4,40),fill=pal[0],width=2)
        d.line((4,39,w-5,39),fill=pal[3])
        d.rectangle((6,42,w-10,44),fill=self.p['wall'][0])
        if self.r['roof']=='hip':
            for x,y in [(17,10),(w-23,10)]:
                end=2 if x<self.w/2 else w-3
                d.line((x,y,end,38),fill=pal[3],width=2)

    def attachment(self,kind):
        d,b,w=self.d,self.bottom,self.w;dark,shade,base,light,hi=self.p['wall']
        if kind=='ladder':
            x=self.door_x-5
            # Recess shadow behind rails, smaller contact at foot.
            d.rectangle((x+2,34,x+13,b+1),fill='#765633')
            for xx in [x,x+10]:
                d.rectangle((xx-1,26,xx+2,b+2),fill='#3e3026')
                d.line((xx,26,xx,b),fill='#b38b51');d.line((xx+1,27,xx+1,b),fill='#785130')
            for y in range(32,b,6):
                d.rectangle((x+2,y,x+9,y+2),fill='#423124')
                d.line((x+2,y,x+9,y),fill='#c19b60');d.line((x+3,y+1,x+9,y+1),fill='#8c643a')
        elif kind=='side-wall':
            d.rectangle((0,b-15,9,b),fill=dark);d.rectangle((1,b-16,7,b-3),fill=base)
            d.line((0,b-17,9,b-17),fill=hi,width=2);d.line((1,b-15,7,b-15),fill=light)
            d.rectangle((2,b-6,4,b-4),fill=shade)
        elif kind in ('awning','veranda','porch'):
            left,right=8,w-14;top=b-29;edge=b-17
            d.rectangle((left,top+2,right,edge+3),fill=shade)
            for j,x in enumerate(range(left,right,7)):
                a='#e7d3a6' if j%2 else '#c5ae84'
                d.polygon([(x,top),(min(x+6,right),top),(min(x+8,right+2),edge),(x-2,edge)],fill=a)
                d.line((x-2,edge,x+4,edge),fill='#978065')
                d.line((x,top,x-2,edge-1),fill='#f2e1b9')
            for x in [left-2,right+1]:
                d.line((x,edge,x,b+1),fill='#493c2c',width=2);d.line((x,edge+1,x,b),fill='#a48653')
        elif kind=='portico':
            d.rectangle((7,46,w-11,50),fill=hi);d.line((7,51,w-11,51),fill=shade)
            for x in [11,w-20]:
                d.rectangle((x,53,x+5,b-4),fill=shade);d.rectangle((x,53,x+2,b-4),fill=hi)
                d.line((x+3,54,x+3,b-5),fill=light)
                for y in [51,b-4]:d.rectangle((x-2,y,x+7,y+2),fill=light);d.line((x-2,y,x+7,y),fill=hi)
            d.rectangle((7,b,w-11,b+2),fill=shade);d.line((7,b,w-11,b),fill=hi)
        elif kind=='timber-frame':
            for x in [6,w//2,w-15]:
                d.rectangle((x,self.top+3,x+3,b-6),fill='#453d30');d.line((x,self.top+4,x,b-7),fill='#8d7350')
            d.line((6,65,w-15,65),fill='#514431',width=3)
            for x in [8,w-34]:d.line((x,45,x+15,63),fill='#544633',width=3)
        elif kind=='wares':
            for x in [13,w-28]:
                d.rectangle((x,b-12,x+10,b),fill='#4b3e2e');d.rectangle((x+1,b-11,x+9,b-2),fill='#9b7540')
                for j in range(3):d.rectangle((x+j*3+1,b-13,x+j*3+2,b-10),fill=['#688a3a','#be8a36','#9f4730'][j])
        else:raise ValueError('Unknown attachment: '+kind)

    def render(self):
        if self.r['roof']=='shelter':
            d=self.d
            colors=['#544333','#82674b','#ac8960','#d1b387'] if self.r['roofMaterial']=='hide' else ['#484b2b','#6b713e','#9a9c52','#c2bd75']
            d.ellipse((4,45,60,62),fill='#443e31')
            d.polygon([(5,54),(17,28),(32,8),(48,25),(60,55),(48,59),(19,59)],fill=colors[1],outline=colors[0])
            d.polygon([(7,52),(19,28),(32,10),(30,48),(23,57)],fill=colors[2])
            d.polygon([(32,10),(48,27),(58,53),(43,56)],fill=colors[1])
            for a,b in [((32,7),(8,55)),((32,7),(28,58)),((32,7),(57,56))]: d.line((a,b),fill=colors[0],width=2)
            d.line((32,5,32,10),fill='#b59a66',width=2)
            door=self.door_x
            d.polygon([(door,35),(door-6,58),(door+6,58)],fill='#292c25')
            d.line((door,35,door+7,57),fill=colors[3])
            d.line((13,43,23,31),fill=colors[3])
            return self.im
        self.wall();self.foundation()
        if 'timber-frame' in self.r['attachments']:self.attachment('timber-frame')
        self.openings()
        if self.r['roof']=='flat':self.flat_roof()
        else:self.tiled_roof()
        if RELIGHT:self.eave_shadow()
        for part in self.r['attachments']:
            if part!='timber-frame' and not (part=='ladder' and self.facing!='south'):self.attachment(part)
        # The door goes on last: an awning or porch is in front of the wall,
        # but never in front of the opening.
        if self.facing in ('east','west'):
            self.door_x=corner_door(self,self.bottom)+DOOR_W//2
        elif self.facing in ('south','north') and self.r['opening']!='roof-hatch':
            recess(self.d,self.p,self.door_x-DOOR_W//2,self.bottom-DOOR_H-1,
                   DOOR_W,DOOR_H,door=True)
        return self.im


def door_rect(artist):
    """Where the leaf overlay goes, in sprite pixels.

    Every facing has one: the world moves the walkable doorway to the wall the
    art drew it on, rather than leaving a building with a blank front.
    """
    ground = getattr(artist, 'bottom', None)
    if ground is None: ground = artist.ground
    x = getattr(artist, 'door_x', artist.w // 2)
    return [x - DOOR_W // 2, ground - DOOR_H - 1, DOOR_W, DOOR_H]


def build_buildings(root, sprites):
    source=json.loads((root/'src/content/graphics/buildings.json').read_text())
    source['materials'].update(json.loads((root/'src/content/graphics/urban.json').read_text()).get('materials',{}))
    models={}
    from art.urban import (InfillBuilding, UrbanBuilding, urban_recipes,
                           build_animated_details, build_urban_furniture,
                           build_city_walls, build_square_furniture)
    build_animated_details(sprites)
    build_doors(sprites)
    build_urban_furniture(sprites)
    build_city_walls(sprites)
    build_square_furniture(sprites)
    from art.religious import ReligiousBuilding, religious_recipes
    from art.theatres import TheatreBuilding, theatre_recipes
    from art.halls import HallBuilding, hall_recipes
    from art.period import PeriodBuilding, period_recipes
    from art.modern import ModernBuilding
    from art.oblique import ObliqueBuilding, ObliquePlayhouse
    from art.oblique_church import ObliqueChurch, build_banner
    from art.oblique_round import ObliqueRound
    from art.oblique_mud import ObliqueMudbrick
    from art.oblique_meso import ObliqueMeso
    from art.oblique_sinitic import ObliqueSinitic
    from art.oblique_steppe import ObliqueSteppe
    from art.oblique_forager import ObliqueForager
    from art.oblique_lodge import ObliqueLodge
    from art.oblique_meso_landmarks import ObliqueMesoLandmark, build_meso_animations, meso_landmark_recipes
    build_meso_animations(sprites)
    from art.precincts import PrecinctPiece, build_precinct_sprites, precinct_recipes
    build_precinct_sprites(sprites)
    from art.gold_masters import gold_master_recipes, prehistoric_expansion_recipes, service_kit_recipes
    from art.regional_houses import regional_house_recipes
    from art.camps import CampBuilding, camp_recipes
    build_banner(sprites)
    recipes={**camp_recipes(), **source['buildings'], **gold_master_recipes(source), **service_kit_recipes(source),
             **prehistoric_expansion_recipes(source), **regional_house_recipes(root, source),
             **meso_landmark_recipes(root, source), **precinct_recipes(root, source),
             **urban_recipes(root, source),
             **religious_recipes(root, source), **theatre_recipes(root, source),
             **hall_recipes(root, source), **period_recipes(root, source)}
    for name,r in list(recipes.items()):
        # Tents and shelters draw their door on the front whatever the facing,
        # and camps pitch them all opening south, so turned copies would lie.
        if r['roof']=='shelter' or r.get('precinctPiece') or r.get('forager') or r.get('steppe'): continue
        fw,fh=r['footprint']
        for facing,entrance in [('north',[fw//2,-1]),('east',[fw,fh//2]),('west',[-1,fh//2])]:
            recipes[name+'-'+facing]={**r,'facing':facing,'entrance':entrance,'label':r['label']+' · '+facing,
                                      # Same silhouette whichever way it faces, so one set of cast masks.
                                      **({'shadowFrame':name} if r.get('oblique') else {})}
    for name,r in recipes.items():
        painter=(CampBuilding if r.get('campStyle') else
                 PrecinctPiece if r.get('precinctPiece') else
                 ObliqueMesoLandmark if r.get('mesoLandmark') else
                 ObliqueMeso if r.get('mesoamerican') else
                 ObliqueSinitic if r.get('sinitic') else
                 ObliqueSteppe if r.get('steppe') else
                 ObliqueForager if r.get('forager') else
                 ObliqueLodge if r.get('lodge') else
                 ObliqueMudbrick if r.get('mud') else
                 ObliqueRound if r.get('round') else
                 ObliquePlayhouse if r.get('form')=='oblique-ring' else
                 ObliqueBuilding if r.get('oblique') else
                 ObliqueChurch if r.get('family')=='parish' else
                 InfillBuilding if r.get('candidate') else
                 ModernBuilding if r.get('modern') else
                 PeriodBuilding if r.get('period') else
                 ReligiousBuilding if r.get('religious') else
                 TheatreBuilding if r.get('theatre') else
                 HallBuilding if r.get('hall') else
                 UrbanBuilding if r.get('urban') else Building)
        artist=painter(r,source['materials'][r['wall']])
        im=artist.render()
        sprites[name]=im
        w,h=im.size
        models[name]={
            **({'campStyle':r['campStyle']} if r.get('campStyle') else {}),
            'frame':name,'label':r['label'],'footprint':r['footprint'],'entrance':r['entrance'],
            'anchor':[getattr(artist,'anchor_x',w/2),h-3],'bounds':[0,0,w,h],'height':r['height'],
            **({'door':door_rect(artist)} if door_rect(artist) else {}),
            'occlusion':getattr(artist,'occlusion',[4,7,w-7,h-7]),'shadow':{'kind':'building','height':r['height'],'contactWidth':w-12},
            'wall':r['wall'],'roof':r['roof'],'roofMaterial':r['roofMaterial'],'attachments':r['attachments'],
            'opening':r['opening'],'description':r['description'],
            **({'religious':True,'family':r['family'],'recipe':r['recipe']} if r.get('religious') else {}),
            **({'theatre':True,'family':r['family'],'form':r['form'],'recipe':r['recipe']} if r.get('theatre') else {}),
            **({'hall':True,'family':r['family'],'form':r['form'],'recipe':r['recipe']} if r.get('hall') else {}),
            **({'candidate':True,'candidateType':r['candidateType'],
                'candidateGroup':r['candidateGroup'],'variant':r['variant'],
                'business':r.get('business',''),'sign':r.get('sign',''),
                'from':r.get('from',0)}
               if r.get('candidate') else {}),
            **({'infill':True} if r.get('infill') else {}),
            **({'signBand':artist.sign_band,
                'signPaint':artist.sign_paint} if getattr(artist,'sign_band',None) else {}),
            **({'modern':True,'modernStyle':r.get('modernStyle','block'),
                'modernRole':r.get('modernRole','home')} if r.get('modern') else {}),
            **({'period':True,'periodGroup':r['group'],'style':r['style'],'variant':r.get('variant',0),
                'sign':r.get('sign',''),'role':r.get('role','house'),'stories':r['stories']} if r.get('period') else {}),
            **({'shadowFrame':r['shadowFrame']} if r.get('shadowFrame') else {}),
            **({'banner':artist.banner} if getattr(artist,'banner',None) else {}),
            **({'courtyardLight':artist.court_light} if getattr(artist,'court_light',None) else {}),
            **({'smoke':artist.smoke} if getattr(artist,'smoke',None) else {}),
            **({'overlays':artist.overlays} if getattr(artist,'overlays',None) else {}),
            **({'goldMaster':r['goldMaster'],'goldScale':r['goldScale'],
                'goldVariant':r['goldVariant'],'wealthTier':r.get('wealthTier',1),
                'detailSet':r.get('detailSet','plain')} if r.get('goldMaster') else {}),
            **({'prehistoricExpansion':r['prehistoricExpansion'],
                'goldScale':r['goldScale'],'goldVariant':r['goldVariant'],
                'wealthTier':r.get('wealthTier',1),'detailSet':r.get('detailSet','plain')}
               if r.get('prehistoricExpansion') else {}),
            **({'serviceKit':r['serviceKit'],'goldScale':r['goldScale'],
                'goldVariant':r['goldVariant'],'buildingFunction':r['buildingFunction'],
                'serviceStyle':r.get('serviceStyle'),'wealthTier':r.get('wealthTier',1),
                'detailSet':r.get('detailSet','plain')}
               if r.get('serviceKit') else {}),
            **({'regionalHouse':r['regionalHouse'],'regionalProfile':r['regionalProfile'],
                'buildingFunction':r['buildingFunction'],'goldScale':r['goldScale'],
                'goldVariant':r['goldVariant'],'stories':r['stories'],
                'wealthTier':r.get('wealthTier',1),'detailSet':r.get('detailSet','plain'),
                **({'serviceStyle':r['serviceStyle']} if r.get('serviceStyle') else {}),
                'sideDepth':r['sideDepth'],'roofPlan':r['roofPlan'],
                'roofSurfaces':r['roofSurfaces'],'roofAccess':r['roofAccess'],
                **({'roofVoid':r['roofVoid']} if r.get('roofVoid') else {})}
               if r.get('regionalHouse') else {}),
            # Cells the sprite overhangs its footprint to the right and behind,
            # so a planner can leave them clear.
            **({'oblique':True,'margins':[int(-(-(w-artist.anchor_x-r['footprint'][0]*8)//16)),
                                          max(0,int(-(-(h-3-r['footprint'][1]*16)//16)))]} if r.get('oblique') else {}),
            **({'animation':r['animation']} if r.get('animation') else {})}
    # Not buildings.json: that name belongs to the packed atlas, which is
    # written later in the build and would silently clobber this.
    (root/'public/packs/models.json').write_text(json.dumps(models))
    (root/'src/content/graphics/models.generated.json').write_text(json.dumps(models))
    return models
