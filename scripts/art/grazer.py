"""Bison and the woolly rhinoceros: one heavy grazer's rig.

Built like the deer: a hump over the withers, the head carried low. The steppe
bison follows Altamira and Lascaux, where it is painted most: long horns, a
tall hump, the forequarters dark and shaggy, a beard. The American bison is
shorter in the horn and taller in the hump, with a cape of hair to the knees;
the wisent is taller in the leg and less shaggy, horns turned forward.

The woolly rhinoceros is drawn from the carcasses frozen in Siberia and the
Chauvet paintings: a shoulder hump, a long flattened front horn and a short
second one, a long low head, small ears, long hair, and a dark band round the
middle of the body that Chauvet shows on several animals.

Both sweep snow aside with the head to graze (bison do now; the wear on
rhinoceros horns says it did too). A bison lifts its tail before it charges,
and lies down to chew the cud.
"""
import math
from art.fauna_b import shade, walk_foot
from art.fauna_d import _mirror, WALK, GALLOP
from art import rig
from art.rig import Canvas, T, at, disk, tube, rot, add, lerp, smooth, noise, rimmed

GM, HM, WM = 40, 14, 80

ROLES = "o d m l h s k e i j p b".split()


def _c(o, d, m, l, h, s, b, **horn):
    return dict(dict(o=o, d=d, m=m, l=l, h=h, s=s, k="#141009", e="#0b0806", i="#cbbd9f", j="#6d6252", p="#6b3f38", b=b),
                **horn)


KINDS = {
    # Two metres at the shoulder; horns spanning a metre.
    "steppe-bison": dict(s=1.0, leg=1.0, hump=1.0, cape=0.8, beard=1.0, horn="long", rhino=False, skirt=0.3,
                         forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.88, horns=0.7, hump=0.7)},
                         form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "red": _c("#1c0f08", "#5a2e16", "#86461f", "#a8622e", "#c27d42", "#2a160b", "#b88a5c"),
        "brown": _c("#170e08", "#44291a", "#654029", "#84573a", "#a0704c", "#20130b", "#9a7a5a"),
    }, weights={"red": 2, "brown": 3}),
    "american-bison": dict(s=0.92, leg=0.95, hump=1.2, cape=1.2, beard=1.2, horn="short", rhino=False, skirt=0.2,
                           forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.85, horns=0.85, hump=0.7)},
                           form_weights={"bull": 1.0, "cow": 2.2}, coats={
        "brown": _c("#150d07", "#3d2616", "#5c3a22", "#7a5132", "#946645", "#1e120a", "#86684b"),
        "tan": _c("#1d130b", "#5e422a", "#806040", "#9e7c58", "#b8976f", "#2b1c10", "#a58c6c"),
    }, weights={"brown": 6, "tan": 1}),
    "wisent": dict(s=0.95, leg=1.12, hump=0.75, cape=0.5, beard=0.7, horn="forward", rhino=False, skirt=0.0,
                   forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.88, horns=0.8, hump=0.75)},
                   form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "brown": _c("#170e08", "#4a2c18", "#6d4325", "#8c5a35", "#a67248", "#23140b", "#8f7157"),
    }, weights={"brown": 1}),
    # Up to two metres at the shoulder and nearly four long.
    "woolly-rhinoceros": dict(s=1.0, leg=0.8, hump=0.8, cape=0.0, beard=0.0, horn="rhino", rhino=True, skirt=0.9,
                              forms={"rhino": dict(s=1.0, horns=1.0, hump=1.0)},
                              form_weights={"rhino": 1.0}, coats={
        "brown": _c("#150e09", "#3e2c1d", "#5d4430", "#7b5d43", "#957657", "#221810", "#5d4a38"),
        "pale": _c("#211a13", "#5e4c3a", "#846d56", "#a38b71", "#bca58a", "#33281d", "#7d6b58"),
    }, weights={"brown": 3, "pale": 1}),
    # The domestic yak, a metre and a half at the hump. "b" is the white of a
    # piebald; in the black coat it is a shade off the body and does not show.
    "yak": dict(s=0.86, leg=0.85, hump=1.15, cape=0.0, beard=0.0, horn="yak", rhino=False, skirt=0.0, fore=False,
                curtain=2.5, plume=1.0, patches=True, fleck=False, floor=True,
                forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.86, horns=0.75, hump=0.75)},
                form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "black": _c("#0e0a08", "#271e19", "#3a2d25", "#504036", "#66554a", "#140f0c", "#30251f", j="#81786a"),
        "piebald": _c("#0e0a08", "#271e19", "#3a2d25", "#504036", "#66554a", "#140f0c", "#e4ddcd", j="#81786a"),
    }, weights={"black": 3, "piebald": 2}),
    # Low and square, a metre and a quarter at the shoulder, the skirt of
    # guard hair to the hooves; pale saddle and stockings in "b".
    "musk-ox": dict(s=0.74, leg=0.8, hump=1.0, cape=0.0, beard=1.0, horn="musk", rhino=False, skirt=0.0, fore=False,
                    curtain=1.0, len=0.78, bodyr=1.1, carry=(-1.5, 3.0), saddle=True, stockings=2.0, guard=True, fleck=False,
                    floor=True,
                    skull=dict(r=4.4, muzzle=[(3, 3.5)], mr=[4.1, 3.3], nose=(4.6, 5.4), eye=(1.8, 0.2), ear=(-2.5, -1)),
                    forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.88, horns=0.7, hump=0.8)},
                    form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "brown": _c("#0d0907", "#2a1d14", "#3d2a1d", "#543d2b", "#6b523c", "#160e09", "#b49a74", i="#ece2c8", j="#a39478"),
    }, weights={"brown": 1}),
    # A metre and a half at the shoulder; the bull's horn bases meet in a boss.
    "african-buffalo": dict(s=0.88, leg=0.9, hump=0.45, cape=0.0, beard=0.0, horn="buffalo", rhino=False, skirt=0.0,
                            fore=False, fleck=False, ears=True, plume=0.4, floor=True,
                            skull=dict(r=4.6, muzzle=[(3, 2.5), (4.3, 4.6)], mr=[4.4, 3.6, 3.1], nose=(5.4, 5.6),
                                       eye=(2.2, 0.6), ear=(-2.5, -1)),
                            forms={"bull": dict(s=1.0, horns=1.0, hump=1.0), "cow": dict(s=0.9, horns=0.72, hump=0.6)},
                            form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "black": _c("#0b0a0a", "#211e1d", "#33302e", "#4b4643", "#645d58", "#121110", "#3c3734", i="#a39d93", j="#5d5853"),
        "dusky": _c("#100b09", "#2e211b", "#423028", "#594338", "#71584a", "#18110d", "#4d3a30", i="#a39d93", j="#5d5853"),
        "red": _c("#170c08", "#45231a", "#643324", "#834631", "#9c5c42", "#25120c", "#74503c", i="#a39d93", j="#5d5853"),
    }, weights={"black": 5, "dusky": 3, "red": 1}, form_coats={"cow": {"black": 2, "dusky": 3, "red": 1}}),
    # A metre and a quarter at the shoulder, falling to the rump.
    "wildebeest": dict(s=0.78, leg=1.12, hump=0.35, cape=0.0, beard=0.0, horn="gnu", rhino=False, skirt=0.0,
                       fore=False, fleck=False, slope=3.5, stripes=True, mane=True, plume=1.2, tailw=0.3, rock=1.8, girth=0.82,
                       bodyr=0.78, legr=0.7, neckr=0.72, floor=True,
                       skull=dict(r=3.5, muzzle=[(2.6, 4.2), (4.0, 7.6)], mr=[3.2, 2.6, 2.6], nose=(5.4, 8.2),
                                  eye=(1.2, -0.3), ear=(-1.5, -2.5), color="s", front="d", graze=13),
                       forms={"bull": dict(s=1.0, horns=1.35, hump=1.0), "cow": dict(s=0.92, horns=1.1, hump=0.85)},
                       form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "blue": _c("#101215", "#3b4148", "#576068", "#737c85", "#8e979f", "#15171a", "#9b9384", i="#a5a092", j="#6b6760"),
    }, weights={"blue": 1}),
}
SPECIES = list(KINDS)
for _k in KINDS.values():
    for _coat in _k["coats"].values():
        assert len(set(_coat.values())) == len(ROLES), _coat


def dims(sp):
    s = KINDS[sp]["s"]
    return round(WM * s), round(GM * s), round(HM * s)


NATIVE_SIZES = {sp: (dims(sp)[0], dims(sp)[1] + 4 + dims(sp)[2]) for sp in SPECIES}
STANDING_SIZES = {sp: (dims(sp)[0], dims(sp)[1] + 1) for sp in SPECIES}
STATES = {sp: {"idle": 16, "graze": 16, "wander": 8, "flee": 8, "chase": 8, "rest": 16} for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}

K = KINDS["steppe-bison"]
F = K["forms"]["bull"]


def fringe(c, mask, lo, hi, length, sway=0.0):
    """Hair hanging from the lower edge of a mask between two columns."""
    bottom = {}
    for x, y in mask:
        bottom[x] = max(bottom.get(x, y), y)
    for x, yb in bottom.items():
        if not lo <= x <= hi:
            continue
        n = round(length * (0.6 + 0.6 * noise(x, 9)))
        for i in range(1, n + 1):
            q = (x + round(sway * i / max(1, n)), yb + i)
            c.px[q] = "s" if i >= n - 1 or (x + i) % 2 else "d"


# ---------------------------------------------------------------- side view
def hang(c, mask, lo, hi, end, sway=0.0):
    """A curtain of hair from the lower edge of a mask down to row `end`,
    ragged at the hem; white where the body above it is."""
    bottom = {}
    for x, y in mask:
        bottom[x] = max(bottom.get(x, y), y)
    lo, hi = round(lo), round(hi)
    for x in range(lo, hi + 1):
        if x not in bottom:
            continue
        yb = bottom[x]
        taper = max(0, 3 - (x - lo)) * 1.5 + max(0, 2 - (hi - x))
        lock, mid = divmod(x, 3)
        n = round(end - yb - taper - (0, 2, 1, 0, 1, 2, 0)[lock % 7] - (mid != 1))
        pale = c.px.get((x, yb)) == "b"
        for i in range(1, n + 1):
            q = (x + round(sway * i / max(1, n)), yb + i)
            if pale:
                c.px[q] = "b" if i < n else "d"
            else:
                c.px[q] = "s" if i == n else "m" if mid == 1 and 1 <= i < n - 2 else "d"


def piebald(c, p):
    """The white of a piebald yak: a splash over the belly and hind leg, and
    one on the shoulder; the skirt below them grows white too."""
    hip, sh = p["hip"], p["sh"]
    for u, dy, r in ((0.25, 7.0, 6.0), (0.95, 6.5, 4.0)):
        cx_, cy_ = T(add(lerp(hip, sh, u), (0, dy)))
        r *= rig.S["s"]
        for (x, y), role in c.px.items():
            if role in "dmlhs" and (x - cx_) ** 2 + (y - cy_) ** 2 * 1.3 <= r * r:
                c.px[(x, y)] = "b"


def finish(c):
    if K.get("floor"):
        # A muzzle put down to the grass or a chin on the ground stops at the
        # ground, so the outline never reaches the bottom of the canvas.
        g = rig.S["G"] + 1
        c.px = {(x, y): r for (x, y), r in c.px.items() if y <= g}
    return c.finish()


def back():
    """How far forward the hindquarters sit on a short-bodied animal."""
    return 20 * (1 - K.get("len", 1.0))


def pose(**k):
    lg = K["leg"]
    top = GM - 35 * lg
    rh = K["rhino"]
    bk = back()
    p = dict(hip=(24.0 + bk, top + 15 + K.get("slope", 0.0)), sh=(44.0, top + 13),
             head=((58.0, top + 22) if rh else (56.0, top + 19)), look=0.0,
             feet=dict(fh=(22.0 + bk, GM), nh=(25.0 + bk, GM), ff=(43.0, GM), nf=(46.0, GM)),
             tail=0.0, ear=0, eye="open", mouth=0, chew=0, breath=0, down=False, sway=0.0)
    if "carry" in K:
        p["head"] = add(p["head"], K["carry"])
    p.update(k)
    return p


def body(c, p):
    hip, sh = p["hip"], p["sh"]
    b = p["breath"] * 0.3
    rh = K["rhino"]
    br = K.get("bodyr", 1.0)
    mask = tube([add(hip, (-2.5, 0.5)), hip, lerp(hip, sh, 0.5), sh], [6.2 * br + b, 7.0 * br + b, 8.0 * br + b, 8.6 * br + b])
    hump = K["hump"] * F["hump"]
    if hump:
        mask |= disk(sh[0] - 2, sh[1] - 6 * hump, 6.0 * min(1.2, hump + 0.2) * br)
    px = shade(mask, 1, 2)
    hipx, shx = T(hip)[0], T(sh)[0]
    fore, fleck = K.get("fore", True), K.get("fleck", True)
    sc = rig.S["s"]
    for x, y in mask:
        if fore and not rh and x > lerp(hipx, shx, 0.45) and px[(x, y)] in "mlh":
            px[(x, y)] = "d" if px[(x, y)] == "m" else "m"  # the dark forequarters
        if rh and abs(x - lerp(hipx, shx, 0.5)) < 2.2 * rig.S["s"] and px[(x, y)] in "ml":
            px[(x, y)] = "s"  # Chauvet's dark band round the middle
        if fleck and noise(x * 5 + y, 2) > 0.88 and px[(x, y)] in "ml":
            px[(x, y)] = "h" if px[(x, y)] == "l" else "l"
    if K.get("stripes"):
        # The wildebeest's brindling: a few dark bars down the forequarters, leaning back.
        for x, y in mask:
            u = x - shx + 1 + (y - T(sh)[1]) * 0.25
            if -12 * sc < u < 2 and round(u) % 4 == 0 and px[(x, y)] in "mlh":
                px[(x, y)] = "d"
    if K.get("saddle"):
        topy = {}
        for x, y in mask:
            topy[x] = min(topy.get(x, y), y)
        for x, y in mask:
            if lerp(hipx, shx, -0.15) < x < lerp(hipx, shx, 0.5) and y - topy[x] <= 3 * sc:
                px[(x, y)] = "b"
    c.paint(px)
    if K["cape"]:
        fringe(c, mask, lerp(hipx, shx, 0.55), shx + 4 * rig.S["s"], 3 * K["cape"] * rig.S["s"], p["sway"])
    if K["skirt"]:
        fringe(c, mask, hipx - 2, shx + 4, 5 * K["skirt"] * rig.S["s"], p["sway"])
    return mask


def head(c, p):
    hx, hy = p["head"]
    look = p["look"]
    sh = p["sh"]
    hs = F["s"] ** 0.2
    fwd = rot((1, 0), look)
    down = rot((0, 1), look)
    rh = K["rhino"]
    sk = K.get("skull")
    if K.get("floor"):
        nf, nd = sk["nose"] if sk else (4.5, 4.8)
        hy -= max(0.0, add(add((hx, hy), fwd, nf), down, nd)[1] - (GM - 0.5))
    nr = K.get("neckr", 1.0)
    neck = tube([add(sh, (2, -3)), lerp(add(sh, (2, -3)), (hx, hy), 0.5), (hx, hy)], [7.5 * nr, 6.0 * nr, 4.5 * nr])
    c.paint({xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in shade(neck, 1, 1).items()})
    if K.get("mane"):
        n0 = add(sh, (2, -3))
        crest = [add(lerp(n0, (hx, hy), u), (0, -r * nr + 0.6)) for u, r in ((0.15, 7.2), (0.5, 6.0), (0.85, 4.8))]
        m = tube(crest, [1.0, 1.0, 0.8])
        for x, y in list(m):
            if (x + y) % 2 and (x, y - 1) not in m:
                m.add((x, y - 1))
        c.paint({xy: "s" for xy in m})
        chin, chest = add(add((hx, hy), fwd, 1.0), down, 3.5), add(sh, (6, 5))
        for i in range(9):
            bx, by = at(lerp(chin, chest, i / 8))
            for j in range(1 + (i % 3 != 1) + (i > 2)):
                c.px[(bx, by + j)] = "s"
    if rh:
        skull = tube([add((hx, hy), fwd, -3), (hx, hy), add(add((hx, hy), fwd, 5), down, 1.5)], [4.2, 3.8, 2.9])
    elif sk:
        skull = disk(hx, hy, sk["r"]) | tube([(hx, hy)] + [add(add((hx, hy), fwd, f), down, d) for f, d in sk["muzzle"]],
                                            sk["mr"])
    else:
        skull = disk(hx, hy, 4.6) | tube([(hx, hy), add(add((hx, hy), fwd, 3), down, 3)], [4.0, 3.0])
    if K.get("ears"):
        # A buffalo's ears hang below the horns, fringed with hair.
        ear = add((hx, hy), rot((-3.0, 1.5), look))
        em = tube([ear, add(ear, rot((-2.4, 3.2), look))], [1.2, 1.6])
        c.paint({xy: "s" if (xy[0], xy[1] + 1) not in em else "d" for xy in em})
    hp = shade(skull, 1, 1)
    if not rh:
        for xy, r in list(hp.items()):
            if r in "ml":
                hp[xy] = sk.get("color", "d") if sk else "d"
    c.paint(hp)
    if rh:
        nose = add(add((hx, hy), fwd, 7.2), down, 2.0)
    else:
        nf, nd = sk["nose"] if sk else (4.5, 4.8)
        nose = add(add((hx, hy), fwd, nf), down, nd)
    if K.get("saddle"):
        c.px[at(add(nose, fwd, -1))] = "b"  # the pale muzzle
    if K.get("patches"):
        for i in range(4):
            c.px[at(add(add((hx, hy), fwd, 0.5 + i * 1.1), down, -2.5 + i * 1.6))] = "b"  # the blaze
    c.px[at(nose)] = "k"
    if p["mouth"]:
        c.px[at(add(nose, down, 1))] = "p"
    if p["chew"]:
        c.px[at(add(nose, fwd, -1.5))] = "s"
    if K["beard"]:
        bx, by = at(add(add((hx, hy), fwd, 1.5), down, 4))
        for dx in range(-2, 2):
            for i in range(round(3 * K["beard"] * rig.S["s"]) + (dx % 2)):
                c.px[(bx + dx, by + i)] = "s"
    ef, ed = sk["eye"] if sk else (1.5 if not rh else 1.0, 0.5)
    ex, ey = at(add(add((hx, hy), fwd, ef), down, -ed if not sk else ed))
    c.px[(ex, ey)] = "e" if p["eye"] == "open" else "d"
    if not K.get("ears"):
        ear = at(add((hx, hy), rot(sk["ear"] if sk else (-3 if rh else -2.5, -3.5 if rh else -1), look)))
        for dy in range(2 + p["ear"]):
            c.px[(ear[0] - (p["ear"] if dy else 0), ear[1] - dy)] = "m" if rh else "d"
    horns(c, p, hx, hy, fwd, down)


def horns(c, p, hx, hy, fwd, down):
    k = F["horns"]
    shape = K["horn"]
    if shape == "rhino":
        base = add(add((hx, hy), fwd, 5.8), down, -0.5)
        front = [base, add(base, rot((2.5, -4), p["look"]), k), add(base, rot((4.5, -9), p["look"]), k),
                 add(base, rot((5.5, -14), p["look"]), k)]
        m = tube(front, [2.0, 1.6, 1.0, 0.5])
        second = add(add((hx, hy), fwd, 2.2), down, -2.8)
        m |= tube([second, add(second, rot((1, -3.5), p["look"]), k)], [1.3, 0.5])
        c.paint({(x, y): "j" if (x - 1, y) not in m else "i" for x, y in m})
        return
    top = add((hx, hy), rot((-0.5, -3.8), p["look"]))
    path = {"long": [(0, 0), (2, -1), (4.5, -3), (5.5, -6), (4.5, -8.5)],
            "short": [(0, 0), (1.5, -0.5), (2.5, -2), (2.5, -3.5)],
            "forward": [(0, 0), (2, -1), (4, -2.5), (5.5, -3.5)],
            "yak": [(0, 0), (2.0, -1.2), (3.6, -4.0), (3.4, -7.5), (1.8, -10)],
            "musk": [(0, 0), (-0.8, 2.2), (-0.3, 4.8), (1.4, 6.4), (3.2, 5.6)],
            "buffalo": [(0.5, 0), (-1.5, 0.6), (-3.2, 2.6), (-4.8, 4.0), (-6.4, 3.2), (-7.0, 0.8), (-6.4, -1.4)],
            "gnu": [(0, 0), (0.2, 1.0), (1.6, 1.0), (2.4, -1.2), (1.8, -3.0)]}[shape]
    pts = [add(top, rot((x * k, y * k), p["look"])) for x, y in path]
    radii = {"musk": [2.0, 1.7, 1.4, 1.0, 0.5], "buffalo": [2.3, 2.1, 1.9, 1.6, 1.3, 0.9, 0.5]}.get(shape, [1.3, 1.2, 1.0, 0.8, 0.5])
    m = tube(pts, radii[: len(pts)])
    if shape in ("musk", "buffalo"):
        # The boss: the two horn bases grown together across the brow.
        m |= disk(*add(top, rot((0.6, 0.4), p["look"])), 2.6 * k ** 0.5, 0.75)
        c.paint({(x, y): "k" if (x, y) == at(pts[-1]) else "i" if (x, y - 1) not in m else "j" for x, y in m})
        return
    c.paint({(x, y): "k" if (x, y) == at(pts[-1]) else "j" for x, y in m})


def legs(c, p, near):
    hip, sh = p["hip"], p["sh"]
    lg = K["leg"]
    rh = K["rhino"]
    lr = K.get("legr", 1.0)
    for key in (("nh", "nf") if near else ("fh", "ff")):
        hind = key.endswith("h")
        fx, fy = p["feet"][key]
        up = max(0.0, GM - fy)
        if hind:
            root = add(hip, (0.5, 3))
            stifle = add(root, (2 + up * 0.3, 7 * lg - K.get("slope", 0.0)))
            hock = (fx - 1.8 - up * 0.3, fy - 8 * lg + up * 0.3)
            m = tube([root, stifle, hock, (fx, fy - 1)], [5.0 * lr, 3.2 * lr, 1.9 * lr if not rh else 2.8, 1.8 * lr if not rh else 2.8])
        else:
            root = add(sh, (0.5, 4))
            elbow = add(root, (0.5, 7 * lg))
            knee = (fx + up * 0.5, fy - 7 * lg + up * 0.4)
            m = tube([root, elbow, knee, (fx - up * 0.4, fy - 1)], [5.0 * lr, 3.2 * lr, 2.0 * lr if not rh else 3.0, 1.8 * lr if not rh else 3.0])
        if near:
            tp = shade(m, 1, 1)
            tp = {xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in tp.items()}
        else:
            tp = {xy: "d" for xy in m}
        if K.get("stockings"):
            low = T((0, fy - K["stockings"]))[1]
            tp = {(x, y): "b" if y >= low else r for (x, y), r in tp.items()}
        c.paint(tp)
        if K["cape"] > 1 and not hind:  # the chaps on a bison's forelegs
            kx, ky = at(knee)
            for dx in (-1, 0, 1):
                for i in range(2):
                    c.px[(kx + dx, ky - 2 + i)] = "s"
        hoof = at((fx - (up * 0.4 if not hind else 0), fy))
        for dx in range(-1, 2 if rh else 1):
            c.px[(hoof[0] + dx, hoof[1])] = "k"


def tail(c, p):
    base = add(p["hip"], (-8.5, -3.5))
    up = p["tail"]  # 0 hanging, 1 raised in alarm, 2 straight up to charge
    plume = K.get("plume", 0)
    if plume:
        # Long hair from the root, like a horse's: a yak's sweeps the hocks.
        swing = 60 * up if up else 6 * p["sway"]
        mid = add(base, rot((-0.8, 4), swing))
        tip = add(base, rot((-0.5, 4 + 9 * plume * (1 - 0.35 * min(up, 1))), swing))
        w = K.get("tailw", plume)
        m = tube([base, mid, tip], [1.0, 1.0 + w, 0.8 + 0.6 * w])
        tp = {(x, y): "d" if (x, y - 1) not in m or (x + y) % 5 == 0 else "s" for x, y in m}
        if K.get("patches"):
            low = T(lerp(base, tip, 0.55))[1]
            tp = {(x, y): "b" if y > low else r for (x, y), r in tp.items()}
        c.paint(tp)
        return
    tip = add(base, rot((0, 7), 70 * up if up else 5 * p["sway"]))
    m = tube([base, tip], [1.0, 0.7])
    c.paint({xy: "d" for xy in m})
    e = at(tip)
    for dx, dy in ((0, 0), (0, 1), (-1, 1), (1, 0)):
        c.px[(e[0] + dx, e[1] + dy)] = "s"


def lying(c, p, frame):
    g = GM
    hip, sh = p["hip"], p["sh"]
    breath = p["breath"]
    mask = tube([add(hip, (-2.5, 0)), hip, lerp(hip, sh, 0.5), sh], [6.0, 6.8 + breath * 0.3, 7.6, 8.2])
    hump = K["hump"] * F["hump"]
    if hump:
        mask |= disk(sh[0] - 2, sh[1] - 6 * hump, 6.0 * min(1.2, hump + 0.2))
    gp = T((0, g))[1]
    mask = {(x, y) for x, y in mask if y <= gp}
    px = shade(mask, 1, 1)
    hipx, shx = T(hip)[0], T(sh)[0]
    for x, y in mask:
        if not K["rhino"] and x > lerp(hipx, shx, 0.45) and px[(x, y)] in "ml":
            px[(x, y)] = "d"
        if (x, y + 1) not in mask:
            px[(x, y)] = "s"
    c.paint(px)
    if K.get("curtain"):
        # Lying down, the skirt spreads on the ground round the body.
        xs = [x for x, _ in mask]
        lo, hi = min(xs), max(xs)
        for x in range(lo - 2, hi + 3):
            edge = min(x - lo + 2, hi + 2 - x)
            n = min(edge, 2 + (x // 3) % 2)
            for i in range(n):
                c.px[(x, gp - i)] = "s" if i == 0 else "m" if x % 3 == 1 else "d"
    c.paint({xy: "d" for xy in tube([add(sh, (3, 6)), (sh[0] + 7, g - 1)], [2.0, 1.6])})
    c.px[at((sh[0] + 8, g - 0.5))] = "k"


def side(p, frame=0):
    c = Canvas()
    if p["down"]:
        lying(c, p, frame)
        head(c, p)
        return finish(c)
    legs(c, p, False)
    tail(c, p)
    mask = body(c, p)
    legs(c, p, True)
    if K.get("patches"):
        piebald(c, p)
    if K.get("curtain"):
        hipx, shx = T(p["hip"])[0], T(p["sh"])[0]
        s = rig.S["s"]
        hang(c, mask, hipx - 6 * s, shx + 7 * s, T((0, GM - K["curtain"]))[1], p["sway"])
    head(c, p)
    return finish(c)


# ------------------------------------------------------------------ gaits
def walk(frame):
    t = frame / 8
    feet = {}
    for key, x in dict(fh=22.0 + back(), nh=25.0 + back(), ff=43.0, nf=46.0).items():
        dx, up = walk_foot(t + WALK[key], 3.0, 2.6, 0.62)
        feet[key] = (x + dx, GM - up)
    bob = 0.5 * math.sin(4 * math.pi * t)
    sw = math.sin(2 * math.pi * t)
    p = pose(feet=feet, look=4 * math.sin(4 * math.pi * t), sway=-sw, tail=0)
    p["hip"], p["sh"] = add(p["hip"], (0, bob)), add(p["sh"], (0, -bob))
    p["head"] = add(p["head"], (0, -bob))
    return p


def gallop(frame, charge=False):
    """Bison run with the head low and the tail up; charging, the head goes
    lower still, horns first."""
    t = frame / 8
    stretch = math.cos(2 * math.pi * (t - 0.1))
    rock = math.sin(2 * math.pi * (t + 0.1)) * K.get("rock", 1.0)
    base = pose()
    hip = add(base["hip"], (-stretch * 1.8, -rock * 1.0 - 1.0 * max(0.0, stretch)))
    sh = add(base["sh"], (stretch * 1.6, rock * 1.0 - 1.0 * max(0.0, stretch)))
    feet = {}
    for key in ("fh", "nh", "ff", "nf"):
        dx, up = walk_foot(t + GALLOP[key], 5.5, 5.0, 0.35)
        hind = key.endswith("h")
        feet[key] = ((hip[0] - 2 if hind else sh[0] + 0) + dx + (1.5 if key[0] == "n" else 0), GM - up)
    head = add(sh, (12, 7 if charge else 4)) if not K["rhino"] else add(sh, (14, 8 if charge else 6))
    return pose(hip=hip, sh=sh, head=head, look=25 if charge else 5, feet=feet, tail=2 if charge else 1,
                sway=-2, mouth=0 if charge else 1)


def idle(frame):
    """Standing, chewing; the tail swishing at flies, an ear turning. Once
    the head comes up to test the wind."""
    t = frame / 16
    lift = smooth([(0, 0.0), (0.3, 0.0), (0.4, 1.0), (0.6, 1.0), (0.7, 0.0)], t)
    if K.get("guard"):
        lift = -lift  # a musk ox faces trouble with the head down, the horns out
    p = pose(look=-12 * lift, tail=0, sway=[0, 1, 2, 1, 0, -1, -2, -1][frame % 8] * 0.8, ear=1 if frame in (5, 6) else 0,
             chew=frame % 2 if lift < 0.1 else 0, eye="closed" if frame == 13 else "open",
             breath=1 if frame % 8 in (2, 3, 4) else 0)
    p["head"] = add(p["head"], (0.5 * lift, -3 * lift))
    return p


def graze(frame):
    """Head down to the ground, cropping, stepping on; in the snow it sweeps
    the head side to side to clear the grass, which reads from the side as the
    muzzle pushing forward and back along the ground."""
    feet = dict(fh=(22.0 + back(), GM), nh=(25.0 + back(), GM), ff=(43.0, GM), nf=(46.0, GM))
    if 8 <= frame <= 10:
        u = (frame - 7) / 3
        feet["nf"] = (46.0 + u * 2.5, GM - math.sin(math.pi * u) * 2)
    if frame > 10:
        feet["nf"] = (48.5, GM)
    sweep = math.sin(2 * math.pi * frame / 8) * 1.5
    base = pose()
    lg = K["leg"]
    hx = base["head"][0] + 1.5 + sweep
    hy = GM - (8 if K["rhino"] else K.get("skull", {}).get("graze", 10)) * lg
    return pose(feet=feet, head=(hx, hy), look=30 if not K["rhino"] else 20, chew=frame % 2,
                sway=[0, 0, 0, 0, 1, 2, 1, 0][frame % 8] * 0.6)


def rest(frame):
    breath = 1 if frame % 8 in (2, 3, 4, 5) else 0
    base = pose()
    drop = 12 * K["leg"]
    head_up = frame < 11
    rh = K["rhino"]
    p = pose(hip=add(base["hip"], (0, drop)), sh=add(base["sh"], (0, drop)), down=True, breath=breath,
             chew=(frame % 4 in (1, 2)) and head_up and not rh, eye="open" if head_up and not rh else "closed",
             ear=1 if frame in (4, 5) else 0)
    p["head"] = add(base["head"], (0, drop - (2 if head_up else -3) - (5 if rh else 0)))
    p["look"] = 0 if head_up else (10 if rh else 25)
    return p


# ------------------------------------------------------------ front and back
def face(state, frame, south):
    c = Canvas()
    cx = WM / 2
    g = GM
    lg = K["leg"]
    rh = K["rhino"]
    top = g - 35 * lg
    n = 8 if state in ("wander", "flee", "chase") else 16
    t = frame / n
    lifts, y0, headdrop, sweep, tail_up, down = {}, 0.0, 0.0, 0.0, 0, False
    eye = True
    if state in ("wander", "flee", "chase"):
        fast = state != "wander"
        phases, amp, lift, stance = (GALLOP, 5.5, 5.0, 0.35) if fast else (WALK, 3.0, 2.6, 0.62)
        for key in ("fh", "nh", "ff", "nf"):
            lifts[key] = walk_foot(t + phases[key], amp, lift, stance)[1]
        y0 = -abs(math.sin(2 * math.pi * t)) * (2 if fast else 0.5)
        headdrop = 3 if state == "chase" else 0
        tail_up = 2 if state == "chase" else 1 if fast else 0
    elif state == "graze":
        headdrop = 9
        sweep = math.sin(2 * math.pi * frame / 8) * 2.5
        if 8 <= frame <= 10:
            lifts["nf"] = math.sin(math.pi * (frame - 7) / 3) * 2
    elif state == "idle":
        headdrop = -2 * smooth([(0, 0.0), (0.3, 0.0), (0.4, 1.0), (0.6, 1.0), (0.7, 0.0)], t)
        eye = frame != 13
    elif state == "rest":
        down = True
        eye = frame < 11 and not rh
        headdrop = 12 * lg + (0 if frame < 11 else 3)
        y0 = 12 * lg

    def leg(x, key, ytop, dark, w):
        up = lifts.get(key, 0)
        if "girth" in K:
            x = cx + (x - cx) * K["girth"]
        bottom = g - up
        if down:
            return
        if "legr" in K:
            w *= K["legr"] ** 0.5
        m = tube([(x, ytop), (x, bottom - 1)], [w, w * 0.75])
        lp = {xy: "d" for xy in m} if dark else shade(m, 1, 1)
        if K.get("stockings"):
            low = T((0, bottom - K["stockings"]))[1]
            lp = {(x_, y_): "b" if y_ >= low else r for (x_, y_), r in lp.items()}
        c.paint(lp)
        fx, fy = at((x, bottom))
        c.px[(fx, fy)] = "k"
        c.px[(fx + 1, fy)] = "k"

    def mass(cy, rx, ry, dark_front):
        if "girth" in K:
            rx *= K["girth"]
        if "bodyr" in K:
            ry *= K["bodyr"]
        m = disk(cx, cy, rx, ry / rx)
        hump = K["hump"] * F["hump"]
        if hump:
            m |= disk(cx, cy - ry + 1, 5.5 * hump)
        if down:
            gp = T((0, g))[1]
            m = {(x, y) for x, y in m if y <= gp}
        bp = shade(m, 1, 2)
        if dark_front and not rh and K.get("fore", True):
            bp = {xy: ("d" if r in "ml" else r) for xy, r in bp.items()}
        if K.get("saddle") and not dark_front:
            top_ = min(y for _, y in m)
            bp.update({(x, y): "b" for x, y in m if y - top_ <= 3 * rig.S["s"] + (x % 3 == 0)})
        if K.get("patches"):
            pc = T((cx - 2, cy + 3))
            bp.update({(x, y): "b" for x, y in m if (x - pc[0]) ** 2 + (y - pc[1]) ** 2 <= (3.6 * rig.S["s"]) ** 2})
        if K.get("stripes") and dark_front:
            bp.update({(x, y): "d" for x, y in m if bp[(x, y)] in "ml" and x % 4 == 0})
        if rh:
            for x, y in m:
                if abs(y - T((0, cy))[1]) <= 1 and bp[(x, y)] in "ml":
                    bp[(x, y)] = "s"
        c.paint(bp)
        return m

    def horns_front(hx, hy):
        k = F["horns"]
        if rh:
            m = tube([(hx, hy + 2), (hx, hy - 3 * k), (hx + 0.5, hy - 8 * k)], [1.8, 1.3, 0.5])
            c.paint({(x, y): "j" if (x - 1, y) not in m else "i" for x, y in m})
            return
        shape = K["horn"]
        for sgn in (-1, 1):
            if shape in FRONT_HORNS:
                path, radii = FRONT_HORNS[shape]
                pts = [(hx + sgn * x * k, hy + y * k) for x, y in path]
                m = tube(pts, radii)
                if shape in ("musk", "buffalo"):
                    m |= disk(hx + sgn * 1.5 * k, hy - 3.6, 2.4 * k ** 0.5, 0.8)
                c.paint({(x, y): "k" if (x, y) == at(pts[-1]) else "i" if (x, y - 1) not in m else "j" for x, y in m})
                continue
            if shape == "long":
                path = [(3, -3), (7, -4), (9.5, -7), (8.5, -10)]
            elif shape == "short":
                path = [(3, -3), (5, -3.5), (6, -5.5)]
            else:
                path = [(3, -3), (6, -4), (7.5, -6), (7, -7.5)]
            pts = [(hx + sgn * x * k, hy + y * k) for x, y in path]
            m = tube(pts, [1.3, 1.1, 0.8, 0.5][: len(pts)])
            c.paint({xy: "j" for xy in m})

    def head_front(hx, hy):
        if rh:
            m = tube([(hx, hy - 3), (hx, hy + 5)], [3.4, 2.6])
            c.paint(shade(m, 1, 1))
            for sgn in (-1, 1):
                e = disk(hx + sgn * 3, hy - 4.5, 1.1, 1.6)
                rimmed(c, e, lambda x, y: "m")
            c.px[at((hx - 2, hy - 1))] = "e" if eye else "d"
            c.px[at((hx + 2, hy - 1))] = "e" if eye else "d"
            horns_front(hx, hy + 1)
            return
        sk = K.get("skull")
        if K.get("floor"):
            hy = min(hy, g - 1.5 - (sk["nose"][1] if sk else 5) - 3 * K["beard"])
        if K.get("mane"):
            c.paint({xy: "s" for xy in tube([(hx, hy - 3), (hx, hy - 7)], [1.4, 1.0])})
        if K.get("ears"):
            for sgn in (-1, 1):
                em = tube([(hx + sgn * 4, hy + 1), (hx + sgn * 7, hy + 3)], [1.3, 1.6])
                c.paint({xy: "s" if (xy[0], xy[1] + 1) not in em else "d" for xy in em})
        elif sk:
            for sgn in (-1, 1):
                c.paint({xy: "d" for xy in tube([(hx + sgn * 3, hy - 2.5), (hx + sgn * 5, hy - 3)], [0.9, 0.9])})
        horns_front(hx, hy)
        if sk:
            ln = sk["nose"][1]
            m = disk(hx, hy, sk["r"] - 0.3) | tube([(hx, hy), (hx, hy + ln - 1)], [sk["mr"][1], sk["mr"][-1] - 0.3])
        else:
            ln = 5
            m = disk(hx, hy, 4.4) | tube([(hx, hy), (hx, hy + 4.5)], [3.6, 2.8])
        fc = sk.get("front", sk.get("color", "d")) if sk else "d"
        c.paint({xy: (fc if r in "ml" else r) for xy, r in shade(m, 1, 1).items()})
        if K.get("patches"):
            c.paint({xy: "b" for xy in tube([(hx, hy - 3), (hx, hy + 3.5)], [1.2, 0.9])})
        if K.get("saddle"):
            c.px[at((hx, hy + ln - 1))] = "b"
        if K.get("horn") in ("musk", "buffalo"):
            horns_front(hx, hy)  # the boss comes down over the brow
        ey = sk["eye"][1] - 0.5 if sk else -0.5
        for sgn in (-1, 1):
            c.px[at((hx + sgn * (2.7 if not sk else sk["r"] - 1.2), hy + ey))] = "e" if eye else "d"
        if K["beard"]:
            bx, by = at((hx, hy + 6))
            for dx in (-1, 0, 1):
                for i in range(round(3 * K["beard"] * rig.S["s"])):
                    c.px[(bx + dx, by + i)] = "s"
        if K.get("mane"):
            bx, by = at((hx, hy + ln + 1))
            for dx in (-1, 0, 1):
                for i in range(4 - abs(dx) + (dx == 1)):
                    c.px[(bx + dx, by + i)] = "s"
        c.px[at((hx, hy + ln))] = "k"

    if south:
        for x, key in ((cx - 4, "fh"), (cx + 4, "nh")):
            leg(x, key, top + 20 + y0, True, 2.2)
        bm = mass(top + 16 + y0, 9, 11, True)
        if K["skirt"] or K["cape"]:
            fringe(c, bm, 0, 999, 3 * (K["skirt"] + K["cape"]) * rig.S["s"])
        for x, key in ((cx - 4.5, "ff"), (cx + 4.5, "nf")):
            leg(x, key, top + 22 + y0, False, 2.5 if not rh else 3)
        if K.get("curtain") and not down:
            hang(c, bm, 0, 999, T((0, g - K["curtain"]))[1], math.sin(2 * math.pi * t) * (1.5 if n == 8 else 0))
        head_front(cx + sweep, top + 17 + y0 + headdrop - (1 if rh else 0))
        return finish(c)

    # north: horns and the top of the head beyond, the rump nearest
    hy = top + 12 + y0 + headdrop * 0.6
    if K.get("mane"):
        hy += 2  # the long head hangs lower behind the high withers
    horns_front(cx + sweep * 0.5, hy) if not rh else None
    c.paint(shade(disk(cx + sweep * 0.5, hy, 3.5), 1, 1))
    for x, key in ((cx - 4.5, "ff"), (cx + 4.5, "nf")):
        leg(x, key, top + 18 + y0, True, 2.2)
    bm = mass(top + 18 + y0, 8.5, 10, False)
    if K["skirt"]:
        fringe(c, bm, 0, 999, 4 * K["skirt"] * rig.S["s"])
    for x, key in ((cx - 4, "fh"), (cx + 4, "nh")):
        leg(x, key, top + 24 + y0, False, 2.3 if not rh else 3)
    if K.get("curtain") and not down:
        hang(c, bm, 0, 999, T((0, g - K["curtain"]))[1], math.sin(2 * math.pi * t) * (1.5 if n == 8 else 0))
    ty = top + 16 + y0
    if K.get("plume"):
        pl = K["plume"]
        tip = (cx, ty + (3 + 9 * pl if tail_up == 0 else -3 if tail_up == 2 else 4))
        w = K.get("tailw", pl)
        m = tube([(cx, ty), lerp((cx, ty), tip, 0.4), tip], [1.0, 1.0 + w * 0.8, 0.8 + w * 0.5])
        c.paint({(x, y): "d" if (x, y - 1) not in m or (x + y) % 5 == 0 else "s" for x, y in m})
        return finish(c)
    tip = (cx, ty + (6 if tail_up == 0 else -2 if tail_up == 2 else 2))
    c.paint({xy: "d" for xy in tube([(cx, ty), tip], [1.0, 0.7])})
    e = at(tip)
    c.px[e] = "s"
    c.px[(e[0], e[1] + 1)] = "s"
    return finish(c)


FRONT_HORNS = {
    "yak": ([(3, -2.5), (6.5, -3.5), (8.5, -6), (8.5, -9), (7, -10.5)], [1.3, 1.2, 1.0, 0.8, 0.5]),
    "musk": ([(1.5, -3.6), (4.5, -2.8), (5.4, 0), (5.4, 2.6), (6.6, 3.6), (7.6, 2.4)], [1.6, 1.6, 1.4, 1.1, 0.8, 0.5]),
    "buffalo": ([(1.5, -3.6), (5.5, -3.2), (7.8, -1.2), (9.2, -0.6), (10.2, -2.6), (9.6, -5)],
                [1.8, 1.8, 1.5, 1.2, 0.9, 0.5]),
    "gnu": ([(2.5, -3), (5, -2.6), (6.6, -3.6), (6.8, -5.6), (5.8, -6.8)], [1.2, 1.1, 0.9, 0.7, 0.5]),
}


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "graze": graze, "wander": walk, "flee": gallop, "chase": lambda f: gallop(f, True),
        "rest": rest}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, form, state, facing, frame):
    global K, F
    K = KINDS[species]
    F = K["forms"][form]
    rig.use(K["s"] * F["s"], GM, WM, HM, PALETTES[species])
    rig.S.update(W=dims(species)[0], G=dims(species)[1], HR=dims(species)[2])
    if facing in ("east", "west"):
        im = side(SIDE[state](frame), frame)
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_grazer():
    out = {}
    for sp in SPECIES:
        forms = list(KINDS[sp]["forms"])
        for form in forms:
            art = sp if form == forms[0] else f"{sp}.{form}"
            for state, count in STATES[sp].items():
                for facing in DIRECTIONS:
                    for frame in range(count):
                        out[f"faunag-{art}-{state}-{facing}-{frame}"] = draw(sp, form, state, facing, frame)
    return out


def looks():
    return {sp: {
        "roles": PALETTES[sp],
        "forms": [{"id": f, "weight": w, "where": None, "coats": k.get("form_coats", {}).get(f, k["weights"])}
                  for f, w in k["form_weights"].items()],
        "coats": k["coats"],
        "coatFrom": {},
    } for sp, k in KINDS.items()}
