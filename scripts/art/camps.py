"""Portable shelters: stitched hides, ridge canvas, expedition domes and felt."""
from PIL import Image, ImageDraw
from art.oblique_style import side_depth

STYLES = {
    'leather': ('Leather ridge tent', ['#49372b', '#765038', '#a47549', '#ca9b65']),
    'canvas': ('Canvas ridge tent', ['#43483f', '#797f6a', '#b7b79a', '#d8d2ae']),
    'dome': ('Expedition dome tent', ['#553d31', '#925633', '#d18c39', '#ebbd5c']),
    'felt': ('Felt round tent', ['#4b4b40', '#898979', '#bfbba3', '#ded6b8']),
    'brush': ('Branch and mat shelter', ['#394631', '#647046', '#939b63', '#bec18a']),
}

def camp_recipes():
    return {f'camp-{style}-{v}': {
        'label': label, 'campStyle': style, 'seed': v, 'canvas': [92, 84],
        'footprint': [4 + v, 3], 'entrance': [2, 3], 'height': 48,
        'oblique': True, 'roof': 'gable', 'roofMaterial': 'thatch',
        'wall': 'mud-plaster', 'opening': 'door', 'attachments': [],
        'description': f'{label}. Illustrative portable construction; its layout and supplies follow the camp setting.'
    } for style, (label, _) in STYLES.items() for v in range(2)}

class CampBuilding:
    def __init__(self, recipe, material):
        self.r = recipe
        self.sw = side_depth(recipe['footprint'][1])
        self.w = 7 + recipe['footprint'][0] * 16 + self.sw + 4
        self.h = 82
        self.bottom = self.h - 6
        self.anchor_x = 7 + recipe['footprint'][0] * 8
        self.door_x = 7 + recipe['entrance'][0] * 16 + 8
        self.im = Image.new('RGBA', (self.w, self.h))
        self.d = ImageDraw.Draw(self.im)

    def render(self):
        d, r = self.d, self.r
        dark, shade, base, light = STYLES[r['campStyle']][1]
        l, b, right = 7, self.bottom, self.w - self.sw - 4
        peak = (l + right) // 2
        top = 26
        d.line((l - 3,b + 2,right + self.sw,b + 2), fill=dark)
        if r['campStyle'] in ('felt', 'dome'):
            shoulder = top + 17
            d.polygon([(l,b),(l,shoulder),(l+12,top+5),(peak,top),(right-9,top+7),(right,shoulder),(right,b)], fill=base)
            d.polygon([(right,shoulder),(right-9,top+7),(right-9+self.sw,top+7-self.sw),(right+self.sw,shoulder-self.sw),(right+self.sw,b-self.sw),(right,b)], fill=shade)
            d.line((l,shoulder,peak,top,right-9,top+7), fill=light, width=2)
            if r['campStyle'] == 'felt':
                for y in [shoulder+8,b-8]: d.line((l,y,right,y,right+self.sw,y-self.sw),fill=shade,width=2)
                for x in range(l+6,right,9): d.line((x,shoulder+3,x,b-2),fill=light)
                d.rectangle((peak-4,top-2,peak+5,top+2),fill=dark)
            else:
                for x in [l+10,right-10]: d.line((x,b,peak,top),fill=light)
                d.line((l,shoulder,right,shoulder),fill=shade)
        else:
            d.polygon([(l,b),(peak,top),(right,b)], fill=base)
            d.polygon([(peak,top),(peak+self.sw,top-self.sw),(right+self.sw,b-self.sw),(right,b)], fill=shade)
            d.line((l,b,peak,top,peak+self.sw,top-self.sw),fill=light,width=2)
            for t in [.3,.6,.8]:
                x = round(l+(peak-l)*t)
                y = round(b+(top-b)*t)
                d.line((x,y,round(right-(right-peak)*t),y),fill=shade)
            if r['campStyle'] == 'brush':
                for x in range(l+4,right,5):
                    y = round(top+(b-top)*abs(x-peak)/(peak-l))
                    d.line((x,y+2,x,b-2),fill=light)
            for x, tip in [(l,l-5),(right,right+self.sw+2)]:
                d.line((x,b-20,tip,b+1),fill='#b8ac82')
                d.line((tip,b-1,tip,b+3),fill=dark)
        x = self.door_x
        d.polygon([(x-8,b),(x-6,b-25),(x+5,b-25),(x+8,b)], fill=dark)
        d.rectangle((x-5,b-24,x+5,b-1),fill='#302f28')
        d.line((x-7,b,x-5,b-24),fill=light)
        d.polygon([(x+6,b-24),(x+14,b-2),(x+6,b)],fill=shade)
        d.line((x-5,b,x+6,b),fill=light)
        return self.im
