"""Compact, unoutlined animal sprites with fixed foot anchors."""
import math
from PIL import Image, ImageDraw

PALETTES = {
    "house-sparrow": ["#35382e", "#70583c", "#a3804e", "#c7a878", "#ede0b5", "#d3aa54"],
    "rock-dove": ["#343e40", "#657774", "#95aaa3", "#c4d0c2", "#eee9cf", "#bf9369"],
    "chicken": ["#49392c", "#a45c36", "#d8904d", "#edbd74", "#fff0bf", "#c9533c"],
    "sheep": ["#514b3b", "#8f8567", "#bdb394", "#e0d8b8", "#f7edcf", "#ae9064"],
    "red-deer": ["#553e30", "#93613e", "#bf874f", "#dca56b", "#f0d7a3", "#775039"],
    "gray-wolf": ["#37413b", "#626e60", "#8c9982", "#b6bfa1", "#dedfc0", "#caab63"],
}
STATES = {
    "house-sparrow": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "rock-dove": dict.fromkeys(["forage", "perch", "takeoff", "flight", "approach", "landing"], 8),
    "chicken": dict.fromkeys(["idle", "forage", "wander", "flee"], 8),
    "sheep": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "red-deer": dict.fromkeys(["idle", "forage", "wander", "flee", "rest"], 8),
    "gray-wolf": dict.fromkeys(["idle", "wander", "stalk", "chase", "rest"], 8),
}
NATIVE_SIZES = {
    "house-sparrow": (16, 16),
    "rock-dove": (18, 18),
    "chicken": (20, 20),
    "sheep": (32, 32),
    "red-deer": (40, 40),
    "gray-wolf": (40, 32),
}

class Drawing:
    def __init__(self, species, size):
        native = NATIVE_SIZES[species]
        self.sx, self.sy = (native[0]-3) / (size[0]-3), (native[1]-3) / (size[1]-3)
        self.im = Image.new("RGBA", native)
        self.d = ImageDraw.Draw(self.im)
        self.p = PALETTES[species]

    def poly(self, points, color):
        self.d.polygon([(round(1+(x-1)*self.sx), round(1+(y-1)*self.sy)) for x, y in points], fill=self.p[color])

    def line(self, points, color, width=1):
        self.d.line([(round(1+(x-1)*self.sx), round(1+(y-1)*self.sy)) for x, y in points], fill=self.p[color], width=width)

    def oval(self, box, color):
        self.d.ellipse(tuple(round(1+(v-1)*(self.sx if i%2 == 0 else self.sy)) for i,v in enumerate(box)), fill=self.p[color])

    def finish(self):
        self.im.info["anchor"] = [self.im.width // 2, self.im.height - 3]
        return self.im

def bird(species, state, frame):
    s = Drawing(species, (24, 24))
    dove = species == "rock-dove"
    flying = state in {"takeoff", "flight", "approach", "landing"}
    opening = [0, .25, .6, 1, 1, 1, 1, 1][frame] if state == "takeoff" else [1, 1, 1, .8, .5, .3, 0, 0][frame] if state == "landing" else 1
    if flying and opening:
        wing = [-8, -6, -2, 4, 7, 4, -1, -6][frame] * opening
        if state == "approach":
            wing *= .6
        s.poly([(11,13), (8,11+wing*.5), (6,11+wing), (9,12+wing), (14,14)], 1)
        s.poly([(10,14), (4,16), (3,18), (9,17), (13,15)], 1)
        s.oval((9,12,18,16), 2)
        s.line([(12,16), (16,16)], 4)
        s.oval((16,10,20,14), 3 if dove else 2)
        s.line([(20,12), (22,13)], 5)
        s.line([(19,11), (19,11)], 0)
        s.poly([(12,14), (9,12+wing*.5), (7,12+wing), (11,13+wing), (15,14)], 3)
        s.line([(8,12+wing), (10,13+wing)], 4)
        if state in {"approach", "landing"}:
            s.line([(15,17), (17,19), (19,19)], 5)
    else:
        dip = [0,0,1,3,4,4,2,0][frame] if state == "forage" else 0
        s.line([(11,19), (11,21), (13,21)], 5)
        s.line([(15,19), (16,21), (18,21)], 5)
        s.poly([(10,15), (4,16), (3,19), (9,18)], 1)
        s.oval((8,13,17,19), 2)
        s.line([(12,19), (16,18)], 4)
        s.poly([(9,14), (13,13), (14,16), (10,17), (8,17)], 1)
        s.line([(10,14), (12,14)], 3)
        s.oval((14,10+dip,19,15+dip), 2)
        s.line([(16,14+dip), (18,14+dip)], 4)
        if not dove:
            s.line([(15,10+dip), (17,10+dip)], 1)
        s.line([(18,12+dip), (18,12+dip)], 0 if frame != 6 else 1)
        s.line([(20,13+dip), (21,14+dip)], 5)
    return s.finish()

def chicken(state, frame):
    s = Drawing("chicken", (24,24))
    moving = state in {"wander", "flee"}
    phase = frame / 8 * math.tau
    bob = round(math.cos(phase*2)) if moving else 0
    for x, offset in [(10,0), (15,math.pi)]:
        step = round(math.cos(phase+offset)*2) if moving else 0
        lift = round(max(0,math.sin(phase+offset))*2) if moving else 0
        s.line([(x,18), (x+step,21-lift), (x+step+2,21-lift)], 2)
    s.poly([(9,14+bob), (4,10+bob), (3,7+bob), (6,8+bob), (8,11+bob), (10,10+bob)], 1)
    s.oval((6,11+bob,18,19+bob), 2)
    s.oval((7,10+bob,16,16+bob), 3)
    s.poly([(8,13+bob), (12,12+bob), (14,14+bob), (12,17+bob), (8,16+bob)], 2)
    s.line([(9,13+bob), (11,13+bob)], 3)
    dip = [0,0,1,3,5,5,2,0][frame] if state == "forage" else 0
    y = 8+bob+dip
    s.poly([(14,14+bob), (15,y+1), (18,y+1), (19,y+5), (16,16+bob)], 3)
    s.oval((15,y,20,y+5), 4)
    s.line([(16,y), (16,y-2), (18,y-1), (19,y-2)], 5)
    s.line([(19,y+5), (19,y+6)], 5)
    s.line([(19,y+2), (19,y+2)], 2 if frame == 6 and not moving else 0)
    s.line([(21,y+3), (22,y+3)], 2)
    if state == "flee":
        drop = round(max(0,math.sin(phase))*4)
        s.poly([(11,13+bob), (8,14+bob), (8,17+bob+drop), (13,16+bob)], 3)
    return s.finish()

def quadruped(species, state, frame):
    s = Drawing(species, (32,32))
    deer, wolf = species == "red-deer", species == "gray-wolf"
    moving = state in {"wander", "flee", "chase", "stalk"}
    running = state in {"flee", "chase"}
    resting = state == "rest"
    phase = frame / 8 * math.tau
    bob = round(math.cos(phase*2)) if moving else 0
    top = (14 if deer else 17 if wolf else 16)+bob
    if resting:
        top = 21
    if state == "stalk":
        top += 2
    bottom = top+(6 if deer or wolf else 8)
    def leg(x, hind, far):
        if resting:
            s.line([(x,27), (x+3,28)], 1 if far else 2, 2)
            return
        p = phase+(math.pi if far else 0)+(0 if hind else math.pi)
        if running:
            p = phase+(.7 if far else 0)+(2.3 if hind else 0)
        swing = math.cos(p)*(4 if running else 2) if moving else 0
        lift = max(0,math.sin(p))*(4 if running else 2) if moving else 0
        s.line([(x,bottom-1), (x+swing*.5+(1 if hind else 0),25), (x+swing,28-lift)], 1 if far else 2, 1 if deer else 2)
        s.line([(x+swing,28-lift), (x+swing+1,28-lift)], 0)
    leg(11,True,True)
    leg(20,False,True)
    if wolf:
        s.poly([(9,top+2), (5,top+4), (2,min(27,top+8)), (5,min(28,top+9)), (10,top+5)], 2)
    elif deer:
        s.line([(7,top+2), (5,top), (6,top+4)], 4)
    else:
        s.oval((4,top+4,8,top+7), 3)
    s.oval((6,top,23,bottom), 2)
    s.oval((7,top,22,bottom-2), 3 if not wolf else 2)
    if wolf:
        s.poly([(9,top), (16,top), (21,top+2), (17,top+3), (10,top+2)], 1)
    elif deer:
        s.line([(9,top+1), (16,top+1)], 3)
        s.line([(12,bottom), (18,bottom)], 4)
    else:
        s.poly([(7,top+2), (9,top), (13,top), (14,top+1), (18,top), (21,top+2), (19,top+4), (10,top+4)], 4)
        s.line([(9,bottom-2), (12,bottom-1)], 3)
    leg(9,True,False)
    leg(21,False,False)
    dip = [0,0,2,5,7,7,3,0][frame] if state in {"graze", "forage"} else 0
    hy = (10 if deer else top-1)+dip
    if resting:
        hy = 22 if wolf else 18
    s.poly([(19,top+3), (21,hy), (25,hy+1), (25,hy+5), (22,bottom-1)], 2 if deer else 3)
    s.oval((21,hy-1,27,hy+5), 2 if deer else 3)
    s.poly([(25,hy+2), (29,hy+3), (29,hy+5), (24,hy+5)], 3 if deer else 4 if wolf else 1)
    s.line([(29,hy+3), (29,hy+3)], 0)
    s.line([(22,hy), (20,hy-2), (22,hy-2)], 2)
    ear = 1 if frame in (4,5) and not moving else 0
    s.poly([(25,hy), (25+ear,hy-4+ear), (27,hy-2), (27,hy)], 2)
    s.line([(26,hy+1), (26,hy+1)], 2 if frame == 6 and not moving else 0)
    if wolf:
        s.poly([(21,hy+2), (23,hy+4), (22,hy+7), (20,hy+5)], 4)
    elif not deer:
        s.line([(22,hy-1), (24,hy-2), (25,hy-1)], 4, 2)
    return s.finish()

def fauna():
    result = {}
    for species, states in STATES.items():
        for state, count in states.items():
            for frame in range(count):
                im = bird(species,state,frame) if species in {"house-sparrow", "rock-dove"} else chicken(state,frame) if species == "chicken" else quadruped(species,state,frame)
                result[f"fauna-{species}-{state}-{frame}"] = im
    return result
