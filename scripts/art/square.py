"""Square furniture: monuments, fountains, planters, posts.

One palette, dark outlines, light from the upper left, a cast ground shadow.
Focus pieces are the centrepiece scale; the smaller ones stand at corners.
"""
from PIL import Image, ImageDraw

S = dict(ol="#4a453a", deep="#6f6a58", dark="#8c8672", mid="#aaa58d",
         light="#c9c4a9", pale="#e3dec6", white="#f3efdc")
W = dict(deep="#2f6a78", mid="#4a97a5", light="#7fc4cc", foam="#d6f1f2")
T = dict(dark="#6e3a24", mid="#a5583a", light="#c97a52", hi="#e5a077")
L = dict(dark="#2f5a33", mid="#4d8642", light="#7fb257", hi="#b3d47a")
F = dict(red="#c8384e", pink="#e98aa0", yellow="#f1c454", white="#f7f3e6")
SHADOW = (39, 44, 32, 70)


def new(w, h):
    im = Image.new("RGBA", (w, h))
    return im, ImageDraw.Draw(im)


def block(d, x0, y0, x1, y1, face=S["mid"], top=2):
    """An outlined stone block: lit top band and left edge, shaded right edge."""
    d.rectangle((x0, y0, x1, y1), fill=face, outline=S["ol"])
    d.rectangle((x0 + 1, y0 + 1, x1 - 1, y0 + top), fill=S["pale"])
    d.line((x0 + 1, y0 + top + 1, x0 + 1, y1 - 1), fill=S["light"])
    d.line((x1 - 1, y0 + top + 1, x1 - 1, y1 - 1), fill=S["deep"])
    d.line((x0 + 2, y1 - 1, x1 - 2, y1 - 1), fill=S["dark"])


def plinth(d, cx, base, courses):
    """Stacked courses, widest at the bottom. courses: [(half_width, height)]."""
    y = base
    for hw, h in courses:
        block(d, cx - hw, y - h, cx + hw - 1, y)
        y -= h


def build_square(sprites):
    # --- cross on a three-course plinth (focus)
    im, d = new(32, 48)
    d.ellipse((2, 41, 30, 47), fill=SHADOW)
    plinth(d, 16, 45, [(14, 5), (11, 6), (7, 6)])
    # Inscription panel on the middle course.
    d.rectangle((10, 35, 21, 38), fill=S["dark"]); d.line((11, 36, 20, 36), fill=S["deep"])
    # Shaft and arms with a bevel: light left, dark right, outline all round.
    d.rectangle((13, 5, 18, 28), fill=S["mid"], outline=S["ol"])
    d.rectangle((9, 11, 22, 15), fill=S["mid"], outline=S["ol"])
    d.rectangle((14, 6, 15, 27), fill=S["light"]); d.line((17, 12, 17, 27), fill=S["deep"])
    d.line((10, 12, 21, 12), fill=S["light"]); d.line((10, 14, 21, 14), fill=S["deep"])
    d.rectangle((14, 12, 17, 14), fill=S["mid"])
    d.rectangle((14, 6, 17, 7), fill=S["pale"])
    sprites["monument-cross"] = im

    # --- statue on a moulded pedestal (focus)
    im, d = new(32, 48)
    d.ellipse((2, 41, 30, 47), fill=SHADOW)
    plinth(d, 16, 45, [(13, 4), (10, 11), (12, 3)])
    d.rectangle((9, 36, 22, 40), fill=S["dark"]); d.line((10, 37, 21, 37), fill=S["deep"])
    # Robed figure: body, folds, raised arm, head with a laurel line.
    d.polygon([(12, 27), (13, 14), (18, 14), (20, 27)], fill=S["mid"], outline=S["ol"])
    d.line((14, 16, 14, 26), fill=S["light"]); d.line((17, 18, 18, 26), fill=S["deep"])
    d.line((16, 20, 16, 26), fill=S["dark"])
    d.rectangle((12, 8, 18, 14), fill=S["mid"], outline=S["ol"])
    d.rectangle((13, 9, 15, 12), fill=S["light"]); d.point((15, 8), fill=S["pale"])
    d.line((19, 16, 23, 9), fill=S["ol"], width=3); d.line((19, 15, 22, 10), fill=S["mid"])
    d.line((12, 17, 9, 23), fill=S["ol"], width=3); d.line((12, 17, 10, 22), fill=S["light"])
    d.ellipse((22, 6, 25, 9), fill=S["mid"], outline=S["ol"])
    sprites["monument-statue"] = im

    # --- obelisk (focus)
    im, d = new(32, 48)
    d.ellipse((2, 41, 30, 47), fill=SHADOW)
    plinth(d, 16, 45, [(12, 4), (8, 5)])
    d.polygon([(11, 36), (13, 5), (18, 5), (20, 36)], fill=S["mid"], outline=S["ol"])
    d.polygon([(12, 35), (14, 6), (15, 6), (14, 35)], fill=S["light"])
    d.polygon([(17, 6), (18, 6), (19, 35), (18, 35)], fill=S["deep"])
    d.polygon([(13, 5), (15, 1), (16, 1), (18, 5)], fill=S["pale"], outline=S["ol"])
    for y in range(11, 32, 4):
        d.line((15, y, 16, y), fill=S["dark"])
    sprites["monument-obelisk"] = im

    # --- two-tier fountain (focus, 48x48)
    im, d = new(48, 48)
    d.ellipse((2, 36, 46, 47), fill=SHADOW)
    # Lower basin: outlined ellipse, rim, water, front wall with courses.
    d.ellipse((1, 26, 46, 46), fill=S["mid"], outline=S["ol"])
    d.ellipse((1, 22, 46, 42), fill=S["light"], outline=S["ol"])
    d.arc((1, 22, 46, 42), 190, 350, fill=S["pale"], width=2)
    for x in range(6, 42, 8):
        d.line((x, 38, x, 44), fill=S["dark"])
    d.line((3, 41, 44, 41), fill=S["dark"])
    d.ellipse((5, 25, 42, 39), fill=W["mid"], outline=W["deep"])
    d.ellipse((8, 26, 39, 33), fill=W["light"])
    for x, y in [(11, 29), (19, 27), (28, 27), (35, 30), (15, 33), (30, 34)]:
        d.line((x, y, x + 2, y), fill=W["foam"])
    # Column and upper bowl.
    d.rectangle((21, 11, 26, 27), fill=S["mid"], outline=S["ol"])
    d.line((22, 12, 22, 26), fill=S["light"]); d.line((25, 12, 25, 26), fill=S["deep"])
    d.ellipse((12, 11, 35, 20), fill=S["mid"], outline=S["ol"])
    d.ellipse((12, 8, 35, 16), fill=S["light"], outline=S["ol"])
    d.ellipse((15, 9, 32, 14), fill=W["mid"]); d.ellipse((17, 10, 30, 12), fill=W["light"])
    d.rectangle((22, 1, 25, 8), fill=S["mid"], outline=S["ol"]); d.line((23, 2, 23, 7), fill=S["light"])
    d.ellipse((21, 0, 26, 3), fill=S["pale"], outline=S["ol"])
    # Jets and overflow drips.
    for x, y in [(19, 2), (28, 2)]:
        d.line((x, y, x, y + 3), fill=W["foam"]); d.point((x, y + 4), fill=W["light"])
    for x, y in [(14, 16), (33, 16), (18, 18), (29, 18)]:
        d.line((x, y, x, y + 6), fill=W["light"]); d.point((x, y + 7), fill=W["foam"])
    sprites["monument-fountain"] = im

    # --- corner pieces ---------------------------------------------------
    # Small basin fountain (32x32), same language as the focus one.
    im, d = new(32, 32)
    d.ellipse((2, 24, 30, 31), fill=SHADOW)
    d.ellipse((1, 16, 30, 30), fill=S["mid"], outline=S["ol"])
    d.ellipse((1, 13, 30, 27), fill=S["light"], outline=S["ol"])
    d.arc((1, 13, 30, 27), 190, 350, fill=S["pale"], width=2)
    d.line((3, 26, 28, 26), fill=S["dark"])
    d.ellipse((4, 15, 27, 25), fill=W["mid"], outline=W["deep"])
    d.ellipse((7, 16, 24, 21), fill=W["light"])
    for x, y in [(10, 18), (18, 17), (22, 20)]:
        d.line((x, y, x + 1, y), fill=W["foam"])
    d.rectangle((14, 3, 17, 17), fill=S["mid"], outline=S["ol"]); d.line((15, 4, 15, 16), fill=S["light"])
    d.ellipse((12, 1, 19, 6), fill=S["pale"], outline=S["ol"])
    for x in (11, 20):
        d.line((x, 6, x, 11), fill=W["light"]); d.point((x, 12), fill=W["foam"])
    sprites["fountain"] = im

    # Statue at market scale.
    im, d = new(16, 24)
    d.ellipse((2, 19, 13, 23), fill=SHADOW)
    block(d, 3, 16, 12, 21); block(d, 5, 13, 10, 16, top=1)
    d.polygon([(6, 12), (6, 5), (9, 5), (10, 12)], fill=S["mid"], outline=S["ol"])
    d.line((7, 6, 7, 11), fill=S["light"])
    d.rectangle((6, 1, 9, 4), fill=S["mid"], outline=S["ol"]); d.point((7, 2), fill=S["light"])
    d.line((10, 7, 12, 4), fill=S["ol"], width=2); d.point((11, 5), fill=S["mid"])
    sprites["statue"] = im

    # Market cross.
    im, d = new(16, 24)
    d.ellipse((2, 19, 13, 23), fill=SHADOW)
    plinth(d, 8, 21, [(6, 3), (4, 3)])
    d.rectangle((6, 3, 9, 15), fill=S["mid"], outline=S["ol"]); d.line((7, 4, 7, 14), fill=S["light"])
    d.rectangle((3, 6, 12, 8), fill=S["mid"], outline=S["ol"]); d.line((4, 6, 11, 6), fill=S["pale"])
    d.rectangle((7, 6, 8, 8), fill=S["mid"])
    sprites["market-cross"] = im

    # Inscribed stele.
    im, d = new(16, 24)
    d.ellipse((2, 19, 13, 23), fill=SHADOW)
    block(d, 3, 18, 12, 21, top=1)
    d.rectangle((5, 3, 10, 18), fill=S["mid"], outline=S["ol"])
    d.line((6, 4, 6, 17), fill=S["light"]); d.line((9, 5, 9, 17), fill=S["deep"])
    d.polygon([(5, 3), (7, 0), (8, 0), (10, 3)], fill=S["pale"], outline=S["ol"])
    for y in range(6, 16, 3):
        d.line((7, y, 8, y), fill=S["dark"])
    sprites["stele"] = im

    # Terracotta planter in flower.
    im, d = new(16, 24)
    d.ellipse((2, 19, 13, 23), fill=SHADOW)
    d.polygon([(3, 12), (12, 12), (11, 21), (4, 21)], fill=T["mid"], outline=T["dark"])
    d.polygon([(5, 13), (7, 13), (6, 20), (5, 20)], fill=T["light"])
    d.line((10, 13, 10, 20), fill=T["dark"])
    d.rectangle((2, 9, 13, 12), fill=T["light"], outline=T["dark"])
    d.line((3, 10, 12, 10), fill=T["hi"])
    for x, y in [(4, 7), (10, 5), (12, 8), (7, 8), (6, 4)]:
        d.ellipse((x - 3, y - 2, x + 2, y + 3), fill=L["dark"])
    for x, y in [(4, 6), (10, 4), (12, 7), (7, 7), (6, 3)]:
        d.ellipse((x - 2, y - 2, x + 1, y + 1), fill=L["mid"])
        d.point((x - 1, y - 1), fill=L["light"])
    for x, y, c in [(3, 4, F["red"]), (8, 2, F["pink"]), (12, 5, F["red"]), (6, 6, F["yellow"]), (11, 9, F["pink"])]:
        d.rectangle((x, y, x + 1, y + 1), fill=c); d.point((x, y), fill=F["white"])
    sprites["planter"] = im

    # Chain post: a bollard with an iron ring and a hanging chain loop.
    im, d = new(16, 24)
    d.ellipse((4, 20, 12, 23), fill=SHADOW)
    block(d, 4, 18, 11, 21, top=1)
    d.rectangle((6, 8, 9, 18), fill=S["mid"], outline=S["ol"])
    d.line((7, 9, 7, 17), fill=S["light"])
    d.rectangle((5, 6, 10, 8), fill=S["light"], outline=S["ol"])
    d.ellipse((6, 3, 9, 6), fill=S["pale"], outline=S["ol"])
    d.ellipse((5, 11, 10, 15), outline="#2f2e2b"); d.point((7, 11), fill="#77746c")
    for x, y in [(3, 13), (2, 15), (12, 13), (13, 15)]:
        d.point((x, y), fill="#3a3936")
    sprites["post"] = im

    # Lamp post: iron shaft on a stone base, lantern with a warm pane.
    I = dict(ol="#1f1e1c", dark="#33322f", mid="#4a4845", light="#6b6862")
    G = dict(pane="#e9c45a", hot="#fff2b0", lit="#fff7d0", glow=(255, 220, 120, 60))
    for name, lit in (("lamp-post", False), ("lamp-post-lit", True)):
        im, d = new(16, 24)
        d.ellipse((4, 20, 12, 23), fill=SHADOW)
        block(d, 5, 19, 10, 21, top=1)
        d.rectangle((6, 16, 9, 19), fill=I["mid"], outline=I["ol"]); d.point((7, 17), fill=I["light"])
        d.rectangle((7, 7, 8, 16), fill=I["mid"], outline=I["ol"])
        d.line((7, 8, 7, 15), fill=I["light"])
        if lit:
            d.ellipse((3, 0, 12, 9), fill=G["glow"])
        d.line((6, 7, 9, 7), fill=I["ol"])
        d.rectangle((5, 2, 10, 6), fill=G["lit"] if lit else G["pane"], outline=I["ol"])
        d.point((6, 3), fill=G["hot"]); d.point((7, 3), fill=G["hot"] if lit else G["pane"])
        d.line((7, 4, 8, 5), fill=G["hot"] if lit else G["pane"])
        d.polygon([(4, 2), (7, 0), (8, 0), (11, 2)], fill=I["dark"], outline=I["ol"])
        d.point((7, 1), fill=I["light"])
        sprites[name] = im

    # Bench with a back.
    im, d = new(16, 24)
    d.ellipse((1, 19, 14, 23), fill=SHADOW)
    d.rectangle((1, 13, 14, 15), fill="#8a6a44", outline="#4d3a24")
    d.line((2, 14, 13, 14), fill="#b58d5c")
    for x in (2, 13):
        d.rectangle((x, 15, x, 20), fill="#4d3a24")
    d.rectangle((1, 8, 14, 10), fill="#8a6a44", outline="#4d3a24"); d.line((2, 9, 13, 9), fill="#b58d5c")
    for x in (3, 12):
        d.line((x, 10, x, 13), fill="#4d3a24")
    sprites["bench"] = im


def build_altar(sprites):
    """Stepped platform for precinct squares, three outlined courses."""
    im, d = new(32, 32)
    d.ellipse((2, 24, 30, 31), fill=SHADOW)
    plinth(d, 16, 29, [(14, 5), (11, 5), (8, 5)])
    d.rectangle((13, 9, 18, 14), fill=S["dark"], outline=S["ol"])
    d.rectangle((14, 10, 15, 11), fill=S["pale"])
    sprites["altar-platform"] = im
