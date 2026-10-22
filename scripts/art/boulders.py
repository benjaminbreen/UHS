"""Large rollable boulders: one stone per sprite, in the regional stone
colours the loose rocks already use. Bigger than a tile, so they read as
something you lean on rather than something you step over."""
import math
from PIL import Image, ImageDraw
from art.rocks import SAND, RED, BASALT, MOSSY, SLAB, LICHEN, rock_candidate

KINDS = {
    'dune': SAND,
    'red': RED,
    'basalt': BASALT,
    'mossy': MOSSY,
    'slab': SLAB,
    'lichen': LICHEN,
}
# Radial profiles in twelfths of a turn, starting east and going clockwise.
# Rounded rolls, blocky has corners, split has a bite out of one shoulder.
PROFILES = {
    'rounded': [1.0, .97, .93, .99, .96, .93, .98, 1.0, .96, .93, .97, 1.0],
    'blocky': [1.0, .80, .95, 1.0, .79, .93, 1.0, .82, .96, .99, .81, .94],
    # Heavier on one shoulder and cut away on the other: a stone that has come
    # off a face, rather than one worn round by a river.
    'wedge': [1.0, .99, .90, .82, .78, .82, .92, 1.0, 1.0, .97, .96, .99],
}
# Which profile each kind's three variants use, and how big each one is.
FORMS = {
    'dune': [('rounded', 14), ('wedge', 12), ('rounded', 10)],
    'red': [('blocky', 14), ('rounded', 12), ('wedge', 10)],
    'basalt': [('blocky', 14), ('wedge', 12), ('blocky', 10)],
    'mossy': [('rounded', 14), ('rounded', 12), ('wedge', 10)],
    'slab': [('wedge', 14), ('blocky', 13), ('blocky', 10)],
    'lichen': [('rounded', 13), ('wedge', 12), ('rounded', 10)],
}


def _rgb(c):
    return (int(c[1:3], 16), int(c[3:5], 16), int(c[5:7], 16))


def hull(cx, cy, r, profile, squash=.70):
    """The silhouette, as a closed polygon of integer pixels."""
    points = []
    for i, k in enumerate(profile):
        a = i / len(profile) * math.tau
        points.append((cx + math.cos(a) * r * k,
                       cy + math.sin(a) * r * k * squash))
    # Resample the twelve corners into a smooth rim: straight chords between
    # them read as a cut gem rather than a stone.
    smooth = []
    n = len(points)
    for i in range(n):
        for t in (0, .34, .67):
            p, q = points[i], points[(i + 1) % n]
            prev, nxt = points[i - 1], points[(i + 2) % n]
            # Catmull-Rom through the four neighbours.
            smooth.append(tuple(
                round(.5 * ((2 * p[d]) + (-prev[d] + q[d]) * t +
                            (2 * prev[d] - 5 * p[d] + 4 * q[d] - nxt[d]) * t * t +
                            (-prev[d] + 3 * p[d] - 3 * q[d] + nxt[d]) * t ** 3))
                for d in (0, 1)))
    return smooth


def shrink(poly, cx, cy, by):
    return [(round(x + (cx - x) * by), round(y + (cy - y) * by)) for x, y in poly]


def boulder(kind, variant):
    profile_name, r = FORMS[kind][variant]
    outline, side, body, top, light = KINDS[kind]
    profile = PROFILES[profile_name]
    w, h = r * 2 + 8, round(r * 2 * .70) + 9
    im = Image.new('RGBA', (w, h))
    d = ImageDraw.Draw(im)
    cx, cy = w / 2, h / 2 - 1
    shape = hull(cx, cy, r, profile)
    d.polygon(shape, fill=outline)
    # Everything inside starts in shade; the light is added as facets on top,
    # so the break between plane and side is one hard pixel, not a gradient.
    d.polygon(shrink(shape, cx, cy, .11), fill=side)
    lift = lambda by, dx, dy: [
        (round(x - r * dx), round(y - r * dy))
        for x, y in shrink(shape, cx, cy, by)]
    plane = lift(.30, .07, .17)
    d.polygon(plane, fill=body)
    crown = lift(.58, .10, .25)
    d.polygon(crown, fill=top)
    # One lit edge along the north-west rim of the crown, not a rim all round.
    rim = [p for p in crown if p[1] <= min(q[1] for q in crown) + max(1, r // 4)]
    if len(rim) >= 2:
        d.line(sorted(rim), fill=light, width=1)
    # One crack, off the plane's rim and down the shaded side. Two read as
    # damage; one reads as stone.
    x0, y0 = cx + r * .30, cy - r * .10
    d.line([(round(x0), round(y0)),
            (round(x0 + r * .20), round(y0 + r * .30)),
            (round(x0 + r * .12), round(y0 + r * .52))], fill=outline)
    # Grain, only where the stone is already in shade, so the lit planes stay
    # clean. Fixed by position: the same stone is the same stone every time.
    for i in range(5):
        a = (i * 2.39 + variant * .7) % math.tau
        rad = r * (.42 + .06 * (i % 3))
        px, py = round(cx + math.cos(a) * rad), round(cy + math.sin(a) * rad * .70)
        if 0 <= px < w and 0 <= py < h and im.getpixel((px, py))[:3] == _rgb(side):
            d.point((px, py), fill=outline if i % 2 else body)
    if kind == 'mossy':
        for a in (2.4, 3.6, 4.7):
            px, py = round(cx + math.cos(a) * r * .5), round(cy + math.sin(a) * r * .5 * .70)
            if im.getpixel((px, py))[3]:
                d.rectangle((px, py, px + 1, py), fill='#5d8a45')
                d.point((px, py - 1), fill='#86ad55')
    if kind == 'lichen':
        for a in (1.2, 2.9, 4.9):
            px, py = round(cx + math.cos(a) * r * .55), round(cy + math.sin(a) * r * .55 * .70)
            if im.getpixel((px, py))[3]:
                d.point((px, py), fill='#c8b45a')
                d.point((px + 1, py + 1), fill='#b09a3f')
    return im


def boulders():
    return {
        **{f'nature-boulder-{kind}-{variant}': boulder(kind, variant)
        for kind in KINDS
        for variant in range(3)},
        **{f'nature-boulder-{kind}-b':rock_candidate(f'boulder-{kind}',(36,29)) for kind in ['basalt','slab']},
        **sized_rocks(),
    }


def sized_rocks():
    result={}
    for kind in ['grey',*KINDS]:
        for size in ['medium','large']:
            im=size_candidate(kind,size=='large')
            result[f'nature-rock-{kind}-{size}']=im.crop((0,0,im.width,im.getbbox()[3]+1))
    return result


def size_candidate(kind, large=False):
    """Medium and large stones, drawn on separate native canvases."""
    palette = {'grey': ['#293c39','#465b55','#74867a','#a6b19b','#d2d3b4'], **KINDS}[kind]
    im = Image.new('RGBA', (84, 68) if large else (54, 44))
    silhouette=Image.new('L',im.size)
    contours=[]
    d = ImageDraw.Draw(im)
    def face(points, tone, rim=False):
        if not silhouette.getbbox() or tone==0:
            ImageDraw.Draw(silhouette).polygon(points,fill=255)
            contours.append(points)
        d.polygon(points, fill=palette[max(1,tone)])
        if rim: d.line(points[:3], fill=palette[4])
    def crack(points, light=False):
        d.line(points, fill=palette[3] if light else palette[0])
    form = kind
    if form == 'mossy':
        if large:
            face([(5,48),(8,34),(13,28),(12,23),(23,15),(41,12),(58,17),(68,28),(72,44),(77,51),(71,58),(56,62),(25,63),(10,57)],1)
            face([(8,38),(15,29),(15,24),(24,17),(41,14),(56,18),(62,27),(48,32),(28,36),(17,35)],3,True)
            face([(8,39),(18,37),(29,38),(33,48),(25,57),(12,55),(7,47)],2)
            face([(31,38),(47,34),(62,29),(68,35),(64,46),(50,52),(34,49)],2)
            face([(29,58),(36,50),(50,54),(64,48),(72,49),(71,55),(56,60)],1)
            face([(58,19),(66,29),(65,33),(55,29),(48,32)],2)
            crack([(40,15),(37,22),(39,27),(36,33),(40,39)])
            crack([(19,38),(22,43),(20,48)])
            crack([(57,40),(54,44),(57,49)])
            crack([(25,19),(31,17),(37,17)],True)
            crack([(37,47),(42,46),(46,47)],True)
        else:
            face([(4,31),(6,23),(11,20),(11,15),(21,11),(32,11),(42,18),(45,28),(49,32),(44,38),(31,40),(15,39),(6,36)],1)
            face([(6,25),(13,21),(13,16),(22,13),(31,13),(39,18),(34,24),(23,27),(13,26)],3,True)
            face([(6,27),(13,28),(23,29),(26,35),(16,37),(8,34)],2)
            face([(25,28),(34,26),(41,21),(44,28),(39,33),(29,35)],2)
            crack([(29,14),(27,19),(29,22),(27,26),(29,30)])
            crack([(14,29),(15,32),(13,34)])
    elif form == 'lichen':
        if large:
            face([(5,48),(10,30),(23,13),(36,7),(54,9),(62,20),(68,21),(76,39),(73,55),(61,61),(34,63),(15,58)],1)
            face([(11,30),(24,15),(36,9),(53,11),(58,20),(48,29),(32,33),(15,40),(7,46)],3,True)
            face([(8,48),(16,42),(32,35),(37,47),(31,57),(17,55)],2)
            face([(35,34),(49,31),(60,22),(66,24),(72,37),(59,43),(46,51),(39,46)],2)
            face([(49,52),(61,45),(73,40),(71,53),(60,58),(35,61),(34,57)],1)
            face([(33,17),(39,12),(47,13),(44,19),(36,22)],4)
            crack([(48,13),(46,20),(49,24),(46,30),(49,35)])
            crack([(24,36),(24,43),(27,47),(25,53)])
            crack([(60,29),(62,34),(59,40)])
            crack([(39,48),(43,46),(49,45)],True)
        else:
            face([(4,32),(8,20),(16,10),(25,6),(37,9),(40,16),(44,18),(49,29),(46,37),(35,40),(17,39),(7,36)],1)
            face([(9,20),(17,12),(26,8),(35,10),(37,16),(29,23),(18,25),(6,31)],3,True)
            face([(6,33),(18,27),(23,32),(21,37),(10,35)],2)
            face([(21,26),(30,25),(39,18),(43,20),(46,28),(37,32),(27,35)],2)
            face([(22,15),(27,10),(32,11),(29,16),(24,18)],4)
            crack([(33,12),(31,17),(33,20),(30,25)])
            crack([(18,28),(17,31),(19,34)])
    elif form == 'grey':
        if large:
            face([(5,46),(7,29),(15,15),(30,7),(48,6),(64,15),(72,28),(78,43),(76,56),(62,62),(24,63),(10,57)],0)
            face([(7,45),(9,29),(17,16),(30,9),(47,8),(60,16),(57,29),(38,35),(20,34)],3,True)
            face([(7,46),(20,35),(38,36),(39,52),(26,59),(12,55)],2)
            face([(39,36),(57,30),(68,30),(62,48),(47,56),(39,51)],2)
            face([(60,17),(70,29),(68,36),(58,29)],2)
            face([(69,32),(76,44),(74,55),(61,60),(48,59),(62,49)],1)
            face([(14,56),(26,60),(47,57),(60,61),(29,61)],1)
            crack([(47,9),(45,17),(48,21),(45,28),(49,32),(47,41)])
            crack([(21,35),(24,41),(23,48)])
            crack([(61,49),(57,46),(57,41)])
            crack([(17,17),(29,10),(40,10)],True)
            crack([(12,31),(17,28),(22,28)],True)
            face([(64,59),(70,54),(77,55),(80,60),(76,64),(66,64)],0)
            face([(66,59),(70,56),(76,57),(78,60),(71,61)],3)
        else:
            face([(4,29),(6,18),(16,9),(28,6),(39,11),(45,22),(49,30),(45,38),(32,40),(14,39),(6,35)],0)
            face([(6,27),(8,18),(17,10),(28,8),(37,12),(34,22),(23,25),(14,23)],3,True)
            face([(6,29),(14,25),(23,27),(26,34),(18,37),(8,34)],2)
            face([(24,26),(34,23),(43,23),(38,33),(28,37)],2)
            face([(38,13),(43,22),(36,22)],2)
            face([(43,25),(47,30),(44,36),(33,38),(39,33)],1)
            crack([(29,9),(27,15),(29,18),(27,23),(29,27)])
            crack([(14,25),(15,30),(13,32)])
            crack([(35,33),(33,30)])
    elif form == 'dune':
        if large:
            face([(5,48),(8,37),(14,25),(27,13),(45,10),(61,15),(68,26),(67,34),(74,39),(78,50),(72,58),(54,62),(22,61),(9,56)],1)
            face([(9,37),(16,26),(28,15),(45,12),(60,17),(64,24),(54,31),(34,34),(16,40)],3,True)
            face([(29,19),(39,15),(49,15),(56,18),(47,22),(36,23),(25,27)],4)
            face([(9,40),(17,42),(34,36),(54,33),(65,27),(65,34),(54,40),(34,43),(20,48),(7,47)],2)
            face([(8,49),(21,50),(35,46),(55,43),(67,37),(71,40),(75,48),(59,52),(35,54),(19,56),(10,54)],3)
            face([(35,56),(59,54),(74,50),(70,56),(53,60),(22,59)],1)
            crack([(15,36),(25,33),(33,32)])
            crack([(36,29),(45,27),(56,27)])
            crack([(17,46),(25,44),(33,42),(44,42)])
            crack([(40,50),(50,49),(60,47),(65,44)])
            crack([(52,34),(49,38),(51,42)])
            crack([(23,54),(30,53)],True)
        else:
            face([(4,30),(8,21),(17,12),(29,9),(38,12),(42,19),(41,23),(47,28),(49,33),(43,38),(30,40),(12,38),(5,35)],1)
            face([(8,22),(18,14),(29,11),(37,14),(39,19),(30,24),(17,27),(6,29)],3,True)
            face([(18,17),(27,13),(33,14),(30,18),(23,20),(15,22)],4)
            face([(6,31),(17,29),(31,26),(40,21),(40,25),(29,30),(16,32),(5,33)],2)
            face([(7,34),(18,34),(31,31),(42,26),(46,30),(42,34),(29,36),(14,36)],3)
            crack([(13,25),(20,23),(25,23)])
            crack([(25,34),(32,32),(39,31)])
            crack([(32,25),(30,28),(32,30)])
    elif form == 'red':
        if large:
            face([(5,46),(8,26),(20,10),(35,5),(49,12),(57,27),(66,30),(77,44),(75,57),(60,62),(27,63),(10,57)],0)
            face([(8,43),(10,27),(21,12),(35,7),(46,13),(40,25),(25,34),(16,44)],3,True)
            face([(9,46),(17,45),(27,36),(39,31),(40,46),(32,57),(15,56)],2)
            face([(43,27),(48,15),(55,28),(60,39),(51,48),(42,44)],1)
            face([(43,47),(61,33),(67,34),(75,45),(61,49),(54,58),(38,58)],3)
            face([(62,51),(74,47),(73,56),(61,60),(54,59)],1)
            crack([(35,9),(32,17),(34,22),(29,30),(31,35)])
            crack([(48,32),(46,37),(48,41)])
            crack([(18,48),(23,46),(28,46)],True)
            crack([(62,38),(66,41),(71,42)],True)
        else:
            face([(4,31),(6,18),(15,7),(27,5),(37,14),(39,24),(48,29),(46,37),(33,40),(13,39),(5,35)],0)
            face([(6,29),(8,18),(16,9),(26,7),(33,13),(26,22),(17,27)],3,True)
            face([(6,31),(17,29),(26,24),(26,33),(20,37),(9,35)],2)
            face([(29,23),(35,15),(37,25),(32,33),(28,31)],1)
            face([(29,34),(39,26),(43,28),(46,31),(39,34),(34,38),(24,37)],3)
            face([(40,35),(46,33),(44,36),(35,39)],1)
            crack([(25,9),(22,14),(24,17),(20,22)])
            crack([(12,32),(17,31)],True)
    elif form == 'basalt':
        if large:
            face([(5,48),(8,25),(20,8),(39,5),(54,13),(63,12),(74,29),(78,48),(72,59),(51,64),(22,62),(9,56)],0)
            face([(9,25),(21,10),(38,7),(51,14),(44,25),(29,32),(12,34)],3,True)
            face([(10,36),(28,34),(32,48),(26,59),(12,54),(7,47)],2)
            face([(31,33),(45,27),(54,30),(52,47),(42,58),(34,48)],2)
            face([(54,16),(62,14),(71,29),(58,35),(47,25)],2)
            face([(58,38),(72,31),(76,47),(69,56),(56,60),(45,59),(54,47)],1)
            crack([(39,8),(37,16),(40,21),(37,27)])
            crack([(29,35),(25,41),(27,49),(25,55)])
            crack([(56,31),(59,41),(56,47)])
            crack([(35,48),(41,46),(48,48)])
            crack([(61,18),(66,25)],True)
            face([(67,58),(72,54),(77,56),(80,61),(75,64),(68,63)],0)
            face([(69,58),(72,56),(76,58),(73,60)],3)
        else:
            face([(5,30),(7,18),(17,7),(29,5),(38,13),(43,12),(48,25),(47,34),(37,40),(18,39),(7,35)],0)
            face([(8,18),(18,9),(28,7),(36,13),(27,22),(14,25),(6,28)],3,True)
            face([(7,30),(15,27),(25,25),(27,34),(20,37),(9,34)],2)
            face([(28,23),(37,15),(42,14),(46,25),(38,30),(32,29)],2)
            face([(33,31),(45,27),(45,33),(36,38),(27,37)],1)
            crack([(28,9),(27,15),(29,18),(26,23),(28,31)])
            crack([(38,20),(37,26),(40,32)])
            crack([(16,28),(18,33),(16,35)])
    elif form == 'slab':
        if large:
            face([(4,50),(10,38),(21,28),(34,19),(56,14),(69,20),(72,30),(69,40),(77,46),(78,55),(65,61),(35,63),(12,59),(5,55)],1)
            face([(7,49),(12,39),(23,29),(35,21),(56,16),(67,21),(59,31),(39,36),(24,44)],3,True)
            face([(8,51),(25,46),(41,39),(60,34),(69,25),(70,30),(65,41),(44,47),(25,55),(12,56)],2)
            face([(19,57),(36,52),(47,48),(68,43),(74,47),(64,53),(42,58),(30,60)],3)
            face([(44,59),(65,55),(76,50),(76,54),(64,59),(35,61)],1)
            face([(39,23),(51,19),(57,19),(49,23),(34,28),(22,37)],4)
            crack([(52,19),(47,25),(49,29),(43,34),(44,38)])
            crack([(23,42),(30,38),(38,35)],True)
            crack([(38,51),(45,48),(53,47)],True)
            crack([(60,37),(58,40),(61,44)])
            crack([(15,51),(20,49),(24,49)])
        else:
            face([(4,33),(9,25),(17,18),(27,13),(39,11),(46,17),(45,25),(42,28),(49,32),(47,37),(33,40),(13,39),(5,37)],1)
            face([(6,32),(11,25),(18,19),(28,15),(38,13),(43,17),(35,24),(22,28)],3,True)
            face([(7,34),(23,30),(36,26),(44,20),(43,25),(37,30),(23,35),(10,36)],2)
            face([(16,37),(26,34),(39,31),(44,29),(47,32),(37,36),(25,38)],3)
            crack([(33,15),(29,20),(31,23),(27,27)])
            crack([(18,28),(23,25),(27,24)],True)
            crack([(36,29),(35,32),(38,34)])
    if large:
        details = {
            'grey': [([(18,19),(24,15),(29,15)],4), ([(10,40),(14,38),(18,38)],3),
                     ([(31,43),(34,44),(34,46)],1), ([(50,37),(53,35),(57,35)],3),
                     ([(60,54),(65,52)],2), ([(29,57),(33,55)],3)],
            'dune': [([(21,30),(31,31),(38,30)],1), ([(42,17),(50,16),(54,17)],3),
                     ([(15,53),(21,54)],2), ([(34,38),(41,38)],3),
                     ([(56,48),(63,47),(68,47)],1), ([(37,58),(45,58)],2)],
            'red': [([(16,28),(20,24),(25,22)],4), ([(22,37),(26,35)],3),
                    ([(32,47),(34,43),(34,41)],1), ([(58,43),(62,42)],4),
                    ([(17,52),(22,53),(25,52)],1), ([(65,56),(70,54)],2)],
            'basalt': [([(16,22),(21,18),(26,17)],4), ([(15,42),(18,43),(18,45)],1),
                       ([(37,35),(40,32),(43,32)],3), ([(62,45),(65,42)],2),
                       ([(41,53),(43,51)],3), ([(56,23),(58,25)],1)],
            'slab': [([(30,31),(34,29),(38,28)],4), ([(57,24),(61,22)],2),
                     ([(26,47),(33,44)],3), ([(47,41),(53,39)],3),
                     ([(63,52),(66,51)],2), ([(14,55),(18,54)],1)],
        }
        for points,tone in details.get(form,[]):d.line(points,fill=palette[tone])
    if kind in ['mossy','lichen']:
        patches = ([[(12,27),(17,20),(24,18),(29,20),(28,24),(24,25),(24,30),(18,32),(12,31)],
                    [(32,12),(40,10),(47,12),(50,17),(45,20),(39,20),(37,17),(32,18)],
                    [(13,49),(19,47),(22,50),(21,55),(16,55)],
                    [(60,23),(65,25),(68,31),(65,34),(61,31)]] if large else
                   [[(8,20),(13,15),(19,15),(21,18),(18,21),(18,24),(13,25),(8,24)],
                    [(26,10),(30,10),(34,13),(33,16),(28,17),(27,14)],
                    [(8,31),(11,30),(14,32),(13,35),(10,35)]])
        if kind == 'lichen':
            patches = ([[(18,23),(20,20),(24,20),(26,22),(25,25),(22,26),(19,25)],
                        [(36,13),(39,12),(42,14),(41,17),(38,18),(36,16)],
                        [(49,21),(53,20),(56,23),(54,25),(50,24)],
                        [(29,34),(33,33),(35,35),(33,38),(30,37)],
                        [(62,40),(65,38),(68,39),(69,43),(66,44),(63,43)],
                        [(16,49),(19,48),(21,50),(20,53),(17,52)]] if large else
                       [[(13,19),(15,17),(18,17),(19,19),(17,21),(14,21)],
                        [(28,11),(31,12),(31,14),(29,15),(27,13)],
                        [(25,29),(28,28),(30,30),(29,32),(26,32)],
                        [(38,28),(40,27),(42,29),(40,31),(38,30)]])
        colors = ['#3c553b','#66804b','#91a15d'] if kind == 'mossy' else ['#827943','#b2a052','#d6c279']
        for points in patches:
            d.polygon(points, fill=colors[0])
            d.line(points[:3], fill=colors[2])
            x,y=points[2];d.rectangle((x-2,y+1,x,y+2),fill=colors[1])
        if kind == 'lichen':
            for x,y in ([(30,25),(51,33),(32,45),(57,53),(21,16)] if large else [(23,22),(36,29),(21,35)]):
                d.line([(x,y),(x+2,y),(x+2,y+1)],fill=colors[1])
                d.point((x,y-1),fill=colors[2])
    im.putalpha(silhouette)
    for points in contours:
        d.line(points+[points[0]],fill=palette[0],width=1)
    return im
