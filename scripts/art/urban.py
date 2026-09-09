"""Dimension-driven urban facades. Materials and eligible forms live in content.

One native pixel grid and upper-left light are shared with the original compiler.
The building's ground footprint remains separate from its projected upper floors.
"""
from PIL import Image, ImageDraw
from art.buildings import Building, ROOFS


class UrbanBuilding(Building):
    def __init__(self, recipe, material):
        super().__init__(recipe, material)
        self.top = recipe['roofDepth'] + 10

    def wall(self):
        super().wall()
        d,b,w=self.d,self.bottom,self.w
        dark,shade,base,light,hi=self.p['wall']
        # A few connected plaster losses establish scale without speckling every bay.
        for i in range(max(2,w//35)):
            x=self.rng.randrange(9,w-23);y=self.rng.randrange(self.top+8,b-12)
            d.polygon([(x,y),(x+4,y),(x+4,y+2),(x+8,y+2),(x+8,y+5),(x+2,y+5),(x+2,y+3),(x,y+3)],fill=shade)
            d.line((x+2,y+6,x+7,y+6),fill=light)

    def flat_roof(self):
        d,w,t=self.d,self.w,self.top
        ink,shade,base,hi=self.p['roof']
        d.rectangle((3,8,w-5,t),fill=ink)
        d.rectangle((5,10,w-8,t-3),fill=base)
        d.rectangle((8,13,w-11,t-7),fill=shade)
        d.rectangle((11,17,w-13,t-9),fill=base)
        d.line((4,8,w-6,8),fill=hi,width=2)
        d.line((4,9,4,t-1),fill=hi)
        d.rectangle((5,t-5,w-7,t),fill=shade)
        d.line((5,t-5,w-7,t-5),fill=hi)
        # Recessed earthen roof, worn in broad quiet patches rather than a blank panel.
        d.rectangle((8,14,11,t-8),fill=ink)
        d.rectangle((11,14,w-12,17),fill=shade)
        for _ in range(max(8,w//7)):
            x=self.rng.randrange(14,w-18);y=self.rng.randrange(19,t-10)
            length=self.rng.randrange(2,7)
            d.line((x,y,x+length,y),fill=shade if self.rng.random()<.65 else hi)
            if self.rng.random()<.3:d.line((x+2,y+1,x+length,y+1),fill=shade)

    def openings(self):
        d, b, t = self.d, self.bottom, self.top
        bays, stories = self.r['bays'], self.r['stories']
        wall = self.p['wall']
        # Upper floors use the same bay rhythm at every orientation. Side/rear
        # entrances are authored separately, never by mirroring the light.
        centers = [round(15 + i * (self.w - 36) / max(1, bays - 1)) for i in range(bays)]
        for floor in range(stories):
            base = b - 7 - floor * 31
            if floor:
                d.line((5, base+3, self.front, base+3), fill=wall[1])
                d.line((5, base+2, self.front, base+2), fill=wall[3])
            for x in centers:
                if floor == 0 and abs(x-self.door_x) < 18 and self.facing == 'south':
                    continue
                self.recess(x-4, base-23, 8, 14)
                if (int(x)+floor+self.r['seed']) % 3 == 0:
                    d.rectangle((x-7,base-24,x-6,base-9),fill='#655b3b')
                    d.line((x-7,base-23,x-7,base-11),fill='#998653')
        if self.facing == 'south':
            self.recess(self.door_x-6,b-29,12,28,True)
            d.line((self.door_x-8,b+2,self.door_x+8,b+2),fill=wall[4])

    def tiled_roof(self):
        d,w,t=self.d,self.w,self.top
        pal=ROOFS[self.r['roofMaterial']]
        # Roof depth is explicit: broad houses have substantial roof planes,
        # taller houses gain wall height instead of stretching the same bitmap.
        roof=[(2,t-2),(9,8),(w-13,8),(w-3,t-2)]
        mask=Image.new('L',self.im.size);ImageDraw.Draw(mask).polygon(roof,fill=255)
        layer=Image.new('RGBA',self.im.size);ld=ImageDraw.Draw(layer)
        ld.rectangle((0,0,w,t),fill=pal[0])
        for row,y in enumerate(range(9,t,5)):
            for col,x in enumerate(range(-2,w+4,6)):
                tone=pal[2] if self.rng.random()<.84 else pal[1]
                ld.rectangle((x,y,x+4,y+4),fill=tone)
                # Curved tile highlight, shaded channel, overlapping lower lip.
                ld.line((x+1,y+1,x+2,y+1),fill=pal[4])
                ld.point((x+3,y+2),fill=pal[3])
                ld.line((x,y+2,x,y+3),fill=pal[3])
                ld.line((x+4,y+1,x+4,y+4),fill=pal[1])
                ld.line((x+1,y+4,x+3,y+4),fill=pal[0])
        self.im.paste(layer,(0,0),mask)
        d.line((9,7,w-13,7),fill=pal[0],width=3)
        for x in range(9,w-13,6):
            d.rectangle((x,5,x+4,7),fill=pal[2]);d.line((x+1,5,x+3,5),fill=pal[4])
        d.line((2,t-2,w-3,t-2),fill=pal[0],width=2)
        d.line((4,t-1,w-5,t-1),fill=pal[3])
        d.rectangle((5,t,self.front,t+4),fill=self.p['wall'][0])
        d.line((6,t+5,self.front,t+5),fill=self.p['wall'][1])

    def attachment(self,kind):
        if kind == 'urban-colonnade':
            d,b,w=self.d,self.bottom,self.w
            dark,shade,base,light,hi=self.p['wall']
            d.rectangle((6,b-42,w-10,b-7),fill=dark)
            d.rectangle((5,b-47,w-9,b-41),fill=light)
            d.line((5,b-48,w-9,b-48),fill=hi,width=2)
            for x in range(12,w-17,23):
                d.rectangle((x,b-39,x+6,b-8),fill=shade)
                d.rectangle((x,b-39,x+3,b-8),fill=light)
                d.line((x+1,b-38,x+1,b-9),fill=hi)
                for y in [b-41,b-9]:
                    d.rectangle((x-2,y,x+8,y+2),fill=light)
                    d.line((x-2,y,x+8,y),fill=hi)
            for row in range(3):
                y=b-5+row*3
                d.rectangle((4-row,y,w-7+row,y+2),fill=shade)
                d.line((4-row,y,w-7+row,y),fill=hi)
            return
        if kind != 'urban-shop':
            return super().attachment(kind)
        d,b=self.d,self.bottom
        left,right=9,self.w-15
        colors=[('#ac5237','#eed3a0'),('#456c77','#bbd0bd'),('#9b813e','#ead3a0')][self.r['seed']%3]
        d.rectangle((left,b-33,right,b-5),fill='#34382f')
        for i,x in enumerate(range(left,right,7)):
            d.polygon([(x,b-38),(min(x+6,right),b-38),(min(x+7,right+2),b-23),(x-1,b-23)],fill=colors[i%2])
            d.line((x,b-37,min(x+5,right),b-37),fill='#efdbb3')
            d.line((x-1,b-22,min(x+6,right),b-22),fill='#63543b')
        for x in [left-2,right+2]:
            d.rectangle((x,b-24,x+1,b),fill='#473b28');d.line((x,b-22,x,b-1),fill='#b99559')
        d.rectangle((left,b-8,right,b-3),fill='#513e29')
        d.line((left,b-9,right,b-9),fill='#c29a57')
        for x in range(left+3,right-2,9):
            d.rectangle((x,b-17,x+5,b-10),fill='#805533')
            d.rectangle((x+1,b-18,x+4,b-11),fill='#bf8748')
            d.line((x+1,b-18,x+4,b-18),fill='#e3b674')


def urban_recipes(root, source):
    import json
    kit=json.loads((root/'src/content/graphics/urban.json').read_text())
    out={}
    for base in kit['bases']:
        original=source['buildings'][base]
        for form,shape in {**kit['forms'],**kit['civicForms']}.items():
            if 'bases' in shape and base not in shape['bases']:
                continue
            r={**original,**shape}
            r['wall']=kit.get('wallOverrides',{}).get(base,original['wall'])
            fw,fh=r['footprint']
            r.update(canvas=[fw*16,r['roofDepth']+17+r['stories']*31],
                     entrance=[fw//2,fh],opening='door',height=r['stories']*31+24,
                     attachments=([part for part in original['attachments'] if part == 'timber-frame'] + (['urban-colonnade'] if shape.get('colonnade') else ['urban-shop'] if shape.get('shop') else [])),
                     seed=original['seed']+len(form)*19,
                     label={'row':'Street-front house','shop':'Shop and workshop','wide':'Broad courtyard range','tall':'Tall residential house','hall':'Public hall','colonnade':'Colonnaded civic hall'}[form],
                     description='A procedural urban building: shared street frontage, recessed openings and a rear court. Its form is illustrative, not a surveyed reconstruction.',
                     urban=True)
            out[f'{base}-urban-{form}']=r
    return out


def build_urban_furniture(sprites):
    """Small market counters share the building palette and remain object sprites."""
    for index,(stripe,light) in enumerate([('#9f5338','#ebd3a4'),('#466d78','#c4d7c6')]):
        im=Image.new('RGBA',(48,44));d=ImageDraw.Draw(im)
        d.rectangle((5,26,42,40),fill='#473c2a')
        d.rectangle((7,29,40,38),fill='#916b3e')
        for x in [7,39]:
            d.rectangle((x,14,x+1,42),fill='#473c2a')
            d.line((x,16,x,40),fill='#ba935b')
        for i,x in enumerate(range(4,43,6)):
            d.polygon([(x,8),(x+5,8),(x+7,21),(x-2,21)],fill=stripe if i%2 else light)
            d.line((x,8,x+4,8),fill='#efdbb3')
            d.line((x-2,22,x+6,22),fill='#695337')
        for i,x in enumerate(range(10,38,8)):
            d.rectangle((x,26,x+5,32),fill='#513f2c')
            d.rectangle((x+1,25,x+4,30),fill=['#be8e49','#a75b37','#71813d'][i%3])
            d.point((x+2,25),fill='#e2ba70')
        d.line((5,33,42,33),fill='#d1a362')
        d.line((6,41,42,41),fill=(30,30,25,130))
        sprites[f'urban-stall-{index}']=im


def build_city_walls(sprites):
    """Defensive circuits as tiling wall segments, drawn once per perimeter cell.

    Two materials only, because two is what the content table distinguishes: a
    coursed masonry curtain and a battered earth rampart. Each is 16 wide so it
    tiles along a cell edge, and taller than a cell so it reads as an obstacle
    rather than as ground. Corner turrets and gate jambs close the silhouette;
    the opening itself is a gap in the run, not a sprite.
    """
    from PIL import ImageOps
    for material, ramp, cap in [
        ("masonry", ["#6b6857", "#8e8a74", "#a9a48b", "#c0baa0"], "#4f4d41"),
        ("earth", ["#7d6440", "#9a7d52", "#b39468", "#c9ab7f"], "#5d4a30"),
    ]:
        dark, mid, light, top = ramp
        for kind in ["run", "corner", "jamb"]:
            im = Image.new("RGBA", (16, 32))
            d = ImageDraw.Draw(im)
            d.ellipse((0, 26, 15, 31), fill=(39, 44, 32, 70))
            batter = material == "earth"
            for row in range(8, 30):
                # An earth rampart leans back to its base. The taper is shading,
                # not silhouette: tapering the sprite would open a seam between
                # every pair of segments in the run.
                d.line((0, row, 15, row), fill=mid)
                if batter and row > 10:
                    d.point((0, row), fill=light)
                    d.point((15, row), fill=dark)
            if batter:
                # Weathered gullies down the face, not courses.
                for x, start in [(4, 12), (9, 10), (12, 15)]:
                    d.line((x, start, x, 29), fill=dark)
            else:
                for row in range(11, 30, 5):
                    d.line((0, row, 15, row), fill=dark)
                    for x in range(2 if row % 10 else 7, 16, 10):
                        d.line((x, row, x, min(row + 4, 29)), fill=dark)
            # The crest runs flat across the whole circuit; insetting it here
            # would scallop the top edge once per cell.
            d.line((0, 8, 15, 8), fill=light)
            d.line((0, 9, 15, 9), fill=top)
            if kind == "corner":
                # A turret breaks the run so a right angle does not read as a seam.
                d.rectangle((2, 3, 13, 29), fill=mid)
                d.rectangle((2, 3, 13, 4), fill=light)
                for x in range(2, 14, 4):
                    d.rectangle((x, 0, x + 1, 3), fill=mid)
                d.line((2, 3, 2, 29), fill=light)
                d.line((13, 3, 13, 29), fill=cap)
            elif kind == "jamb":
                d.rectangle((5, 5, 15, 29), fill=mid)
                d.rectangle((5, 5, 15, 6), fill=light)
                d.line((5, 6, 5, 29), fill=cap)
            elif not batter:
                for x in range(1, 15, 5):
                    d.rectangle((x, 5, x + 2, 9), fill=mid)
                    d.line((x, 5, x + 2, 5), fill=light)
            d.line((0, 29, 15, 29), fill=cap)
            sprites[f"wall-{material}-{kind}"] = im
            if kind == "jamb":
                sprites[f"wall-{material}-jamb-left"] = ImageOps.mirror(im)


def build_square_furniture(sprites):
    """Ornaments for a public square, one per thing a square actually held.

    Content decides which of these a place and date gets; the recipes here know
    nothing about culture. All share the kit's stone and timber ramps and the
    upper-left light of every other sprite.
    """
    stone = ["#6f6d5e", "#918e7c", "#b3af99", "#cdc8b0"]
    dark, mid, light, pale = stone

    im = Image.new("RGBA", (32, 32)); d = ImageDraw.Draw(im)
    d.ellipse((2, 22, 29, 30), fill=(39, 44, 32, 70))
    d.ellipse((2, 14, 29, 28), fill=dark)
    d.ellipse((3, 12, 28, 26), fill=mid)
    d.ellipse((5, 14, 26, 24), fill="#3d6f74")
    d.ellipse((7, 15, 24, 22), fill="#57949a")
    for x in range(9, 24, 4):
        d.point((x, 17), fill="#9fd0cf")
    d.rectangle((14, 4, 17, 16), fill=mid)
    d.rectangle((14, 4, 15, 16), fill=light)
    d.ellipse((12, 1, 19, 7), fill=pale)
    d.ellipse((13, 2, 18, 5), fill="#8fc3c6")
    sprites["fountain"] = im

    im = Image.new("RGBA", (16, 24)); d = ImageDraw.Draw(im)
    d.ellipse((2, 19, 13, 23), fill=(39, 44, 32, 70))
    d.rectangle((3, 17, 12, 21), fill=dark)
    d.rectangle((4, 15, 11, 18), fill=mid)
    d.rectangle((5, 14, 10, 16), fill=light)
    # A standing figure, read at this size by its silhouette alone.
    d.rectangle((6, 6, 9, 15), fill=mid)
    d.rectangle((6, 6, 7, 15), fill=light)
    d.ellipse((6, 2, 10, 6), fill=pale)
    d.line((5, 8, 4, 12), fill=mid)
    d.line((10, 8, 11, 11), fill=mid)
    sprites["statue"] = im

    im = Image.new("RGBA", (16, 24)); d = ImageDraw.Draw(im)
    d.ellipse((3, 19, 12, 23), fill=(39, 44, 32, 70))
    d.rectangle((3, 18, 12, 21), fill=dark)
    d.rectangle((5, 3, 10, 19), fill=mid)
    d.rectangle((5, 3, 6, 19), fill=light)
    d.polygon([(5, 3), (7, 1), (8, 1), (10, 3)], fill=pale)
    for y in range(6, 17, 3):
        d.line((7, y, 9, y), fill=dark)
    sprites["stele"] = im

    im = Image.new("RGBA", (16, 24)); d = ImageDraw.Draw(im)
    d.ellipse((2, 19, 13, 23), fill=(39, 44, 32, 70))
    for i, y in enumerate([21, 19, 17]):
        d.rectangle((2 + i, y, 13 - i, y + 1), fill=mid if i % 2 else dark)
        d.line((2 + i, y, 13 - i, y), fill=light)
    d.rectangle((7, 5, 8, 17), fill=mid)
    d.line((7, 5, 7, 17), fill=light)
    d.rectangle((4, 7, 11, 8), fill=mid)
    d.line((4, 7, 11, 7), fill=light)
    sprites["market-cross"] = im

    im = Image.new("RGBA", (32, 32)); d = ImageDraw.Draw(im)
    d.ellipse((3, 24, 28, 31), fill=(39, 44, 32, 70))
    d.rectangle((5, 18, 26, 28), fill="#5b4a33")
    d.rectangle((6, 17, 25, 25), fill="#8a6c45")
    for x in range(8, 25, 5):
        d.rectangle((x, 19, x + 2, 24), fill="#b0894f")
    for x in [6, 25]:
        d.rectangle((x, 10, x + 1, 27), fill="#4b3d2b")
    d.polygon([(2, 12), (15, 5), (29, 12), (29, 14), (2, 14)], fill="#7a3b2c")
    d.polygon([(4, 12), (15, 6), (27, 12)], fill="#a8543a")
    d.line((2, 14, 29, 14), fill="#59291f")
    sprites["kiosk"] = im

    im = Image.new("RGBA", (32, 32)); d = ImageDraw.Draw(im)
    d.ellipse((2, 24, 29, 31), fill=(39, 44, 32, 70))
    for i, y in enumerate([26, 22, 18]):
        lo, hi = 2 + i * 4, 29 - i * 4
        d.rectangle((lo, y, hi, y + 4), fill=mid)
        d.line((lo, y, hi, y), fill=light)
        d.line((lo, y + 4, hi, y + 4), fill=dark)
    d.rectangle((13, 12, 18, 19), fill=dark)
    d.rectangle((13, 12, 18, 13), fill=pale)
    sprites["altar-platform"] = im
