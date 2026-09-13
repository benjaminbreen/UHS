"""Original native-pixel fauna studies. No runtime scaling or baked shadows."""
from PIL import Image, ImageDraw


def canvas(w, h):
    im = Image.new("RGBA", (w, h))
    im.info["anchor"] = [w // 2, h - 2]
    return im, ImageDraw.Draw(im)


def bird(species, state, frame):
    flying = state in {"takeoff", "flight", "approach", "landing"}
    w, h = (30, 22) if flying else (22, 20)
    im, d = canvas(w, h)
    if species == "house-sparrow":
        dark, body, light, mark, beak = "#3d392f", "#826a49", "#b7a378", "#5c4b37", "#d2ad61"
    else:
        dark, body, light, mark, beak = "#343b3e", "#777b78", "#aeb0a5", "#536c68", "#b89a63"
    if flying:
        cy = 12 + (1 if state == "landing" and frame == 2 else 0)
        flap = [-5, -2, 1, -2][frame % 4]
        d.polygon([(14, cy), (8, cy - 2), (3, cy + flap), (8, cy + 3)], fill=dark)
        d.polygon([(13, cy), (20, cy - 2), (27, cy + flap), (20, cy + 3)], fill=dark)
        d.polygon([(11, cy), (6, cy + flap + 1), (10, cy + 4), (14, cy + 2)], fill=body)
        d.polygon([(16, cy), (24, cy + flap + 1), (19, cy + 4), (14, cy + 2)], fill=body)
        d.rectangle((11, cy - 1, 18, cy + 3), fill=light)
        d.rectangle((17, cy - 2, 20, cy + 1), fill=body)
        d.point((19, cy - 2), fill=dark)
        d.point((21, cy - 1), fill=beak)
        d.polygon([(11, cy + 2), (6, cy + 5), (12, cy + 4)], fill=mark)
    else:
        low = state == "forage" and frame % 2
        d.ellipse((5, 8 + low, 16, 15 + low), fill=dark)
        d.ellipse((6, 7 + low, 16, 14 + low), fill=body)
        d.polygon([(6, 9 + low), (2, 12 + low), (7, 13 + low)], fill=mark)
        d.ellipse((14, 5 + low * 2, 19, 10 + low * 2), fill=body)
        d.rectangle((15, 7 + low * 2, 18, 10 + low * 2), fill=light)
        d.point((18, 6 + low * 2), fill=dark)
        d.point((20, 8 + low * 2), fill=beak)
        d.line((9, 15 + low, 9, 17), fill=dark)
        d.line((14, 15 + low, 14 + frame % 2, 17), fill=dark)
        d.line((8, 17, 6, 17), fill=dark)
        d.line((14, 17, 16, 17), fill=dark)
    return im


def chicken(state, frame):
    im, d = canvas(30, 25)
    moving = state in {"wander", "flee"}
    low = state == "forage" and frame % 2
    lift = 1 if moving and frame % 2 else 0
    dark, brown, warm, cream, red, gold = "#3d332a", "#8c4d31", "#bd7146", "#ead9aa", "#a84235", "#d5a552"
    d.polygon([(6, 12 + lift), (2, 8 + lift), (4, 15 + lift)], fill=dark)
    d.polygon([(7, 10 + lift), (3, 7 + lift), (5, 15 + lift)], fill=brown)
    d.ellipse((6, 8 + lift, 20, 18 + lift), fill=dark)
    d.ellipse((7, 7 + lift, 20, 16 + lift), fill=warm)
    d.polygon([(9, 9 + lift), (15, 8 + lift), (17, 14 + lift), (10, 15 + lift)], fill=brown)
    d.ellipse((18, 4 + low + lift, 24, 11 + low + lift), fill=cream)
    d.point((22, 6 + low + lift), fill=dark)
    d.polygon([(24, 7 + low + lift), (27, 8 + low + lift), (24, 9 + low + lift)], fill=gold)
    d.rectangle((19, 2 + low + lift, 21, 4 + low + lift), fill=red)
    d.rectangle((22, 3 + low + lift, 23, 5 + low + lift), fill=red)
    legs = (frame % 4) if moving else frame % 2
    d.line((11, 17 + lift, 10 + (legs == 1), 21), fill=gold)
    d.line((17, 17 + lift, 18 - (legs == 3), 21), fill=gold)
    d.line((8 + (legs == 1), 21, 12 + (legs == 1), 21), fill=gold)
    d.line((16 - (legs == 3), 21, 20 - (legs == 3), 21), fill=gold)
    return im


def sheep(state, frame):
    im, d = canvas(38, 28)
    low = state == "graze" and frame % 2
    stride = frame % 4 if state in {"wander", "flee"} else 0
    dark, wool, light, face, hoof = "#4b4437", "#c8c2a4", "#e4dfc5", "#6f624d", "#332f2a"
    d.ellipse((5, 7, 26, 20), fill=dark)
    for box in [(5, 5, 14, 14), (11, 4, 21, 14), (18, 6, 28, 16), (8, 11, 19, 20)]:
        d.ellipse(box, fill=wool)
    for x, y in [(9, 7), (15, 6), (21, 9), (13, 14), (20, 14)]:
        d.line((x, y, x + 3, y), fill=light)
    neck_y = 8 + low * 4
    d.polygon([(25, 8), (31, neck_y), (33, neck_y + 7), (26, 16)], fill=face)
    d.polygon([(29, neck_y), (34, neck_y - 2), (32, neck_y + 3)], fill=dark)
    d.point((32, neck_y + 2), fill=light)
    legs = [(10, -1 if stride == 1 else 0), (22, 1 if stride == 3 else 0)]
    for x, step in legs:
        d.line((x, 19, x + step, 24), fill=dark, width=2)
        d.line((x + step - 1, 24, x + step + 2, 24), fill=hoof)
    return im


def deer(state, frame):
    im, d = canvas(42, 30)
    low = state == "forage" and frame % 2
    stride = frame % 4 if state in {"wander", "flee"} else 0
    dark, coat, light, nose, antler = "#44362b", "#9a6442", "#c59870", "#2d2925", "#806447"
    d.ellipse((6, 9, 27, 19), fill=dark)
    d.polygon([(7, 8), (25, 7), (29, 15), (22, 18), (8, 17)], fill=coat)
    d.polygon([(7, 9), (2, 6), (6, 13)], fill=light)
    head_y = 10 + low * 5
    d.polygon([(25, 10), (29, head_y), (35, head_y + 1), (36, head_y + 6), (30, head_y + 7)], fill=coat)
    d.polygon([(30, head_y), (29, head_y - 4), (32, head_y - 1)], fill=dark)
    d.polygon([(34, head_y), (37, head_y - 3), (36, head_y + 1)], fill=dark)
    d.point((34, head_y + 2), fill=nose)
    d.point((36, head_y + 5), fill=nose)
    d.line((31, head_y - 2, 29, head_y - 7), fill=antler)
    d.line((29, head_y - 6, 26, head_y - 8), fill=antler)
    d.line((29, head_y - 5, 32, head_y - 8), fill=antler)
    for x, phase in [(11, stride in {1, 2}), (23, stride in {0, 3})]:
        step = 2 if phase else -1
        d.line((x, 18, x + step, 26), fill=dark, width=2)
        d.line((x + step, 26, x + step + 2, 26), fill=nose)
    return im


def wolf(state, frame):
    im, d = canvas(42, 27)
    stride = frame % 4 if state in {"wander", "stalk", "chase"} else 0
    low = state == "stalk" and 2 or 0
    dark, coat, light, nose = "#303639", "#626a68", "#9ca19a", "#242729"
    d.polygon([(8, 11 + low), (2, 7 + low), (5, 16 + low), (12, 18 + low)], fill=dark)
    d.polygon([(7, 9 + low), (27, 8 + low), (31, 15 + low), (22, 19 + low), (8, 17 + low)], fill=coat)
    d.polygon([(11, 10 + low), (23, 10 + low), (18, 15 + low)], fill=light)
    d.polygon([(26, 9 + low), (31, 5 + low), (38, 9 + low), (35, 15 + low), (29, 15 + low)], fill=coat)
    d.polygon([(30, 6 + low), (30, 2 + low), (34, 6 + low)], fill=dark)
    d.polygon([(34, 6 + low), (37, 3 + low), (37, 8 + low)], fill=dark)
    d.point((35, 8 + low), fill=light)
    d.rectangle((37, 10 + low, 39, 12 + low), fill=nose)
    for x, phase in [(12, stride in {0, 1}), (27, stride in {2, 3})]:
        step = 2 if phase else -1
        d.line((x, 17 + low, x + step, 24), fill=dark, width=2)
        d.line((x + step, 24, x + step + 3, 24), fill=nose)
    return im


def fauna():
    result = {}
    states = {
        "house-sparrow": {"forage": 2, "perch": 2, "takeoff": 3, "flight": 4, "approach": 2, "landing": 3},
        "rock-dove": {"forage": 2, "perch": 2, "takeoff": 3, "flight": 4, "approach": 2, "landing": 3},
        "chicken": {"idle": 2, "forage": 2, "wander": 4, "flee": 4},
        "sheep": {"idle": 2, "graze": 2, "wander": 4, "flee": 4, "rest": 2},
        "red-deer": {"idle": 2, "forage": 2, "wander": 4, "flee": 4, "rest": 2},
        "gray-wolf": {"idle": 2, "wander": 4, "stalk": 4, "chase": 4, "rest": 2},
    }
    for species, animations in states.items():
        for state, count in animations.items():
            for frame in range(count):
                if species in {"house-sparrow", "rock-dove"}:
                    im = bird(species, state, frame)
                elif species == "chicken":
                    im = chicken(state, frame)
                elif species == "sheep":
                    im = sheep(state, frame)
                elif species == "red-deer":
                    im = deer(state, frame)
                else:
                    im = wolf(state, frame)
                result[f"fauna-{species}-{state}-{frame}"] = im
    return result
