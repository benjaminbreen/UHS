"""Native pixel drawings with articulated, pose-specific animation."""
import math
from PIL import Image, ImageDraw, ImageFilter

TAU = math.tau
PALETTES = {
    "sheep": ["#393b31", "#686551", "#96917a", "#b9b59a", "#d4ceb2", "#eee5c9", "#fff1d4", "#756148", "#ab8b60"],
    "red-deer": ["#352e29", "#594033", "#7d5139", "#a36c43", "#bc8757", "#d4a473", "#e4c79b", "#eee0ba", "#383932"],
    "gray-wolf": ["#303632", "#49514a", "#657065", "#848c79", "#a4aa94", "#c4c6ad", "#dddac1", "#e0b85f", "#474039"],
    "chicken": ["#3e302a", "#603d2e", "#895035", "#b16b40", "#d49657", "#e9bd7c", "#f1d9a2", "#933b32", "#c55b40", "#be904c"],
    "house-sparrow": ["#34352e", "#534433", "#786044", "#a18155", "#bda278", "#dbca9f", "#eee2bf", "#45483b", "#b39556"],
    "rock-dove": ["#303b3e", "#4b5859", "#687878", "#899995", "#b0bab0", "#d3d7c6", "#e7e7d5", "#607665", "#a98c83"],
}
STATES = {
    "house-sparrow": {"forage": 8, "perch": 8, "takeoff": 8, "flight": 8, "approach": 8, "landing": 8},
    "rock-dove": {"forage": 8, "perch": 8, "takeoff": 8, "flight": 8, "approach": 8, "landing": 8},
    "chicken": {"idle": 8, "forage": 8, "wander": 8, "flee": 8},
    "sheep": {"idle": 8, "graze": 8, "wander": 8, "flee": 8, "rest": 8},
    "red-deer": {"idle": 8, "forage": 8, "wander": 8, "flee": 8, "rest": 8},
    "gray-wolf": {"idle": 8, "wander": 8, "stalk": 8, "chase": 8, "rest": 8},
}


class Drawing:
    def __init__(self, species, size):
        self.im = Image.new("RGBA", size)
        self.d = ImageDraw.Draw(self.im)
        self.p = PALETTES[species]

    def poly(self, points, color):
        self.d.polygon([(round(x), round(y)) for x, y in points], fill=self.p[color])

    def line(self, points, color, width=1):
        self.d.line([(round(x), round(y)) for x, y in points], fill=self.p[color], width=width)

    def oval(self, box, color):
        self.d.ellipse(tuple(round(v) for v in box), fill=self.p[color])

    def finish(self):
        # A one-pixel interrupted-looking dark edge keeps fur readable on grass.
        alpha = self.im.getchannel("A")
        edge = alpha.filter(ImageFilter.MaxFilter(3))
        out = Image.new("RGBA", self.im.size, self.p[0])
        out.putalpha(edge)
        out.alpha_composite(self.im)
        out.info["anchor"] = [self.im.width // 2, self.im.height - 3]
        return out


def quadruped(species, state, frame):
    s = Drawing(species, (64, 56))
    deer, wolf = species == "red-deer", species == "gray-wolf"
    resting = state == "rest"
    running = state in {"flee", "chase"}
    moving = state in {"wander", "flee", "chase", "stalk"}
    phase = frame / 8 * TAU
    bob = round(math.cos(phase * 2) * (1.5 if running else .5)) if moving else (frame in (3, 4))
    back = (23 if deer else 29 if wolf else 26) + bob
    if resting:
        back = 36 + (frame in (3, 4))
    if state == "stalk":
        back += 3
    hip, shoulder = 19, 40
    foot = 51
    belly = back + (10 if deer or wolf else 14)
    # Far legs precede the torso; the near pair is drawn over it.
    def leg(x, hind, far):
        if resting:
            s.poly([(x-3, 43), (x+5, 48), (x+9, 49), (x-4, 49)], 2 if far else 3)
            s.line([(x, 48), (x+8, 49)], 1)
            return
        p = phase + (math.pi if far else 0) + (0 if hind else math.pi)
        if running:
            p = phase + (0.6 if far else 0) + (2.3 if hind else 0)
        swing = math.cos(p) * (7 if running else 3.5) if moving else 0
        lift = max(0, math.sin(p)) * (6 if running else 3) if moving else 0
        root = (x, belly-3)
        knee = (x + (3 if hind else -1) + swing*.35, (belly+foot)/2-1)
        ankle = (x+swing, foot-lift-(2 if far else 0))
        c = 1 if far else 2
        s.line([root, knee], c, 4 if wolf or not deer else 3)
        s.line([knee, ankle], c, 2)
        if not far:
            s.line([(root[0]-1, root[1]), (knee[0]-1, knee[1]), (ankle[0]-1, ankle[1]-1)], 4 if deer else 3)
        s.line([(ankle[0]-1, ankle[1]), (ankle[0]+2, ankle[1])], 0, 2)
    leg(hip+3, True, True)
    leg(shoulder-3, False, True)
    tail_wave = math.sin(phase) * (2 if moving else 1)
    if wolf:
        s.poly([(15,back+5),(10,back+7),(7,back+12+tail_wave),(3,back+13+tail_wave),(6,back+17+tail_wave),(12,back+14),(18,back+9)],2)
        s.line([(13,back+7),(8,back+13+tail_wave),(5,back+14+tail_wave)],4,2)
    elif deer:
        s.poly([(14,back+3),(10,back+1),(11,back+7),(16,back+9)],6)
        s.line([(12,back+3),(13,back+6)],7)
    else:
        s.poly([(13,back+7),(9,back+8),(10,back+12),(14,back+11)],3)
    s.poly([(12,back+5),(15,back+1),(23,back-1),(34,back),(41,back+2),(46,back+8),(42,belly),(32,belly+1),(20,belly),(13,belly-4)],2)
    s.poly([(14,back+4),(20,back),(31,back),(40,back+2),(42,back+6),(35,back+9),(22,back+8),(15,back+10)],4 if not wolf else 3)
    s.poly([(18,back+1),(29,back),(37,back+2),(34,back+4),(21,back+4),(15,back+6)],5 if not wolf else 4)
    s.poly([(21,belly-3),(32,belly-2),(40,belly-6),(39,belly),(30,belly+1),(21,belly)],6 if deer else 3)
    if wolf:
        s.poly([(18,back+2),(26,back),(36,back+2),(39,back+5),(31,back+6),(28,back+4),(23,back+5),(20,back+4)],1)
        s.line([(20,back+2),(25,back+1),(28,back+2)],2)
        for x,y in [(16,7),(21,8),(26,9),(34,7),(38,6)]:
            s.line([(x,back+y),(x+2,back+y-1)],4)
    elif deer:
        s.line([(18,back+3),(26,back+2),(32,back+3)],6)
        s.line([(17,back+8),(18,back+12),(21,back+14)],3)
        s.line([(35,back+6),(34,back+10),(37,back+12)],3)
    else:
        # Irregular wool locks follow the shoulder and belly volume.
        for x,y,r in [(15,4,3),(21,2,4),(28,2,4),(35,3,4),(40,6,3),(15,9,3),(22,8,4),(29,8,4),(36,10,4),(20,13,3),(28,13,3)]:
            s.oval((x-r,back+y-r,x+r,back+y+r),4 if y<9 else 3)
            s.line([(x-r+1,back+y),(x-r+2,back+y-2),(x+1,back+y-2)],6 if y<7 else 5)
            s.line([(x+1,back+y+r-1),(x+3,back+y+r-2)],2)
    leg(hip-1, True, False)
    leg(shoulder, False, False)

    eating = state in {"graze", "forage"}
    dip = [0,1,4,7,9,9,5,1][frame] if eating else 0
    if resting:
        hx,hy = (43,40) if wolf else (46,33)
    elif deer:
        hx,hy = 47, 18 + bob + dip * 2
    elif wolf:
        hx,hy = 48, back+1 + (3 if state=="stalk" else 0)
    else:
        hx,hy = 48, back+1 + dip
    if deer and not eating:
        s.poly([(38,back+6),(40,20+bob),(44,13+bob),(49,15+bob),(47,24+bob),(44,back+9)],3)
        s.line([(42,back+2),(44,20+bob),(46,17+bob)],5,2)
        s.line([(47,20+bob),(45,26+bob)],6,2)
    else:
        s.poly([(38,back+3),(43,hy-2),(49,hy+2),(49,hy+9),(43,belly-1),(40,back+10)],3 if not wolf else 4)
        if wolf:
            s.poly([(41,back+2),(46,hy),(48,hy+6),(44,hy+11),(40,back+10),(43,back+9)],5)
    s.poly([(hx-4,hy-3),(hx+1,hy-4),(hx+4,hy-1),(hx+4,hy+3),(hx+9,hy+4),(hx+9,hy+7),(hx+4,hy+9),(hx-2,hy+7),(hx-5,hy+2)],3 if not wolf else 3)
    s.poly([(hx-3,hy-2),(hx+1,hy-3),(hx+3,hy),(hx,hy+3),(hx-3,hy+2)],5 if deer else 4)
    s.poly([(hx+1,hy+4),(hx+8,hy+5),(hx+7,hy+7),(hx+2,hy+7)],6 if deer or wolf else 7)
    s.line([(hx+8,hy+4),(hx+9,hy+5),(hx+8,hy+6)],0,2)
    s.line([(hx+3,hy+8),(hx+7,hy+8)],1)
    ear = 1 if frame in (5,6) and not moving else 0
    s.poly([(hx-3,hy-1),(hx-8,hy-4-ear),(hx-6,hy-7-ear),(hx-1,hy-3)],2)
    s.line([(hx-6,hy-5-ear),(hx-3,hy-3)],5)
    s.poly([(hx+1,hy-3),(hx+2,hy-8+ear),(hx+5,hy-6+ear),(hx+4,hy-1)],2)
    s.line([(hx+3,hy-6+ear),(hx+3,hy-3)],5)
    s.line([(hx+1,hy+1),(hx+3,hy+1)],0)
    if frame != 6 or moving:
        s.line([(hx+2,hy),(hx+2,hy)],7 if wolf else 6)
    if deer:
        # Antlers rotate with the head; they never vanish during locomotion.
        for dx in [-3,2]:
            s.line([(hx+dx,hy-5),(hx+dx-2,hy-10),(hx+dx-5,hy-13)],2)
            s.line([(hx+dx-2,hy-9),(hx+dx+1,hy-13)],5)
            s.line([(hx+dx-4,hy-12),(hx+dx-7,hy-12)],5)
    if species == "sheep":
        s.oval((hx-5,hy-5,hx+1,hy-1),4)
        s.line([(hx-4,hy-3),(hx-2,hy-4),(hx,hy-3)],6)
    return s.finish()


def bird(species,state,frame):
    s = Drawing(species,(48,48))
    dove = species == "rock-dove"
    flight = state in {"takeoff","flight","approach","landing"}
    phase = frame / 8 * TAU
    peck = [0,0,2,5,7,7,3,0][frame] if state=="forage" else 0
    if flight:
        opening = [0,.2,.45,.8,1,1,1,1][frame] if state=="takeoff" else [1,1,1,.8,.6,.3,.1,0][frame] if state=="landing" else 1
        if opening < .2:
            return bird(species,"perch",frame)
        cy=23
        flap = math.cos(phase) * (9 if state!="approach" else 5)
        for far in [True,False]:
            sign = -1 if far else 1
            root=(25,cy)
            elbow=(19,cy+sign*(7+flap*.3)*opening)
            tip=(8,cy+sign*(9+flap)*opening)
            s.poly([root,elbow,tip,(6,tip[1]+sign*3),(14,cy+sign*5),(24,cy+sign*3)],2 if far else 3)
            s.poly([root,(19,elbow[1]),(10,tip[1]),(15,cy+sign*5),(24,cy+sign*2)],4 if dove else 4)
            for k in range(5):
                x=7+k*2
                y=tip[1]*(1-k/7)+(cy+sign*5)*(k/7)
                s.line([(x,y),(x+4,y-sign*3)],1)
                s.line([(x+1,y),(x+4,y-sign*2)],5)
            if dove:
                s.line([(16,elbow[1]),(21,cy+sign*3)],1,2)
                s.line([(12,tip[1]),(18,cy+sign*4)],2,2)
        s.poly([(23,26),(13,30),(8,32),(9,35),(19,32),(27,28)],2)
        s.line([(12,32),(20,29)],5)
        s.oval((21,21,35,29),3)
        s.line([(25,22),(31,22),(34,24)],5,2)
        s.oval((32,19,39,25),3)
        s.line([(34,24),(37,25)],5)
        s.line([(39,22),(42,23)],8)
        s.line([(37,21),(37,21)],0)
        if state in {"landing","approach"}:
            s.line([(30,29),(33,33),(37,33)],8)
            s.line([(27,29),(29,33),(32,33)],8)
    else:
        cy=31+(frame in (3,4))
        s.line([(23,37),(22,41),(26,41)],8)
        s.line([(29,37),(30,41),(33,41)],8)
        s.poly([(18,30),(8,34),(5,38),(16,36),(23,33)],2)
        s.line([(8,36),(16,33)],4)
        s.oval((16,26,33,38),3)
        s.poly([(23,32),(30,32),(33,34),(30,38),(24,37)],5)
        s.poly([(17,29),(23,26),(29,28),(28,32),(22,35),(17,34)],2)
        for x,y in [(18,29),(22,29),(25,30),(19,32),(23,32)]:
            s.line([(x,y),(x+2,y-1)],4)
            s.line([(x,y+1),(x+2,y)],1)
        hx,hy = 32, 23+peck
        s.poly([(27,29),(28,hy+1),(34,hy),(37,hy+5),(32,34)],3)
        s.oval((hx-4,hy-3,hx+5,hy+5),3)
        s.poly([(hx-3,hy+1),(hx+1,hy),(hx+4,hy+2),(hx+1,hy+5),(hx-3,hy+4)],5)
        if dove:
            s.line([(29,27+peck//2),(30,29+peck//2),(33,29+peck//2)],7,2)
            s.line([(21,29),(26,31)],1,2)
            s.line([(20,32),(24,34)],1,2)
        else:
            s.line([(hx-3,hy-2),(hx+2,hy-2)],2,2)
            s.line([(hx-2,hy+1),(hx,hy+3)],1)
            s.line([(hx+1,hy+4),(hx+2,hy+6)],0,2)
        s.line([(hx+3,hy),(hx+3,hy)],0 if frame!=6 else 2)
        s.line([(hx+5,hy+2),(hx+8,hy+3)],8)
    return s.finish()


def chicken(state,frame):
    s=Drawing("chicken",(48,48))
    moving=state in {"wander","flee"}
    phase=frame/8*TAU
    bob=round(math.cos(phase*2)) if moving else (frame in (3,4))
    y=25+bob
    for x,offset in [(23,math.pi),(30,0)]:
        swing=math.cos(phase+offset)*3 if moving else 0
        lift=max(0,math.sin(phase+offset))*3 if moving else 0
        s.line([(x,35),(x+swing,40-lift),(x+swing+3,41-lift)],9)
        s.line([(x+swing,40-lift),(x+swing-2,41-lift)],9)
    for k in range(4):
        s.poly([(19,y+6),(8-k,y-1-k*2),(6+k,y-5-k),(13+k,y-3),(23,y+2)],1+k%3)
        s.line([(9+k,y-4),(18,y+3)],4)
    s.oval((15,y-4,35,y+11),2)
    s.oval((17,y-5,34,y+7),3)
    s.poly([(17,y),(24,y-2),(30,y+1),(28,y+7),(22,y+9),(18,y+5)],2)
    for x,dy in [(19,1),(23,0),(26,2),(20,4),(24,4),(22,7)]:
        s.line([(x,y+dy),(x+2,y+dy-1)],4)
        s.line([(x,y+dy+1),(x+2,y+dy)],1)
    dip=[0,0,3,7,9,9,4,0][frame] if state=="forage" else 0
    hx,hy=35,18+bob+dip
    s.poly([(28,y+2),(29,hy),(34,hy-1),(38,hy+4),(33,y+5)],4)
    s.line([(30,hy+2),(31,y+2)],5,2)
    s.oval((hx-4,hy-3,hx+3,hy+5),5)
    s.line([(hx-2,hy+1),(hx,hy+3)],6,2)
    s.poly([(hx-3,hy-3),(hx-4,hy-6),(hx-2,hy-7),(hx,hy-5),(hx+1,hy-7),(hx+2,hy-4)],7)
    s.line([(hx-3,hy-5),(hx-2,hy-6),(hx,hy-4)],8)
    s.oval((hx+1,hy+4,hx+3,hy+7),7)
    s.line([(hx+2,hy),(hx+2,hy)],0)
    s.poly([(hx+3,hy+1),(hx+7,hy+3),(hx+3,hy+3)],9)
    if state=="flee":
        spread=round(max(0,math.sin(phase))*6)
        s.poly([(23,y),(18,y+5),(19,y+10+spread),(26,y+7),(29,y+3)],2)
        for k in range(3):
            s.line([(20+k*2,y+4),(20+k*2,y+9+spread-k)],5)
    return s.finish()


def fauna():
    result={}
    for species,states in STATES.items():
        for state,count in states.items():
            for frame in range(count):
                im = bird(species,state,frame) if species in {"house-sparrow","rock-dove"} else chicken(state,frame) if species=="chicken" else quadruped(species,state,frame)
                result[f"fauna-{species}-{state}-{frame}"]=im
    return result
