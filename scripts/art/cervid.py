"""The giant deer and the reindeer: one deer rig, stags and hinds.

Megaloceros is drawn from the cave paintings that show it alive (Cougnac,
Chauvet, Pech Merle) as much as from its skeleton: a hump over the withers
to carry the antlers, a dark stripe falling from it behind the shoulder and a
dark collar at the throat, and antlers spreading in two palms edged with tines,
up to three and a half metres across. Only stags carry them, and outside the
rut stags and hinds keep apart, so a herd is one or the other.

Reindeer are the one deer in which both sexes grow antlers: long beams swept
back and then forward, with a flat brow tine, the "shovel", held down over the
face. A white mane under the neck, broad hooves, a coat pale in winter and dark
in summer.

Both walk in lateral sequence and gallop; grazing, they lift the head every
few mouthfuls to look round; lying up, they chew the cud.

The moose (Eurasian elk) is the tallest deer: legs to the brisket, a hump over
the withers falling to low hips, a short neck, a long overhung nose and a bell
of skin under the throat. Dark brown-black with grey stockings; bulls carry
broad palms spreading sideways. It trots away rather than gallops.

Gazelles and springbok are bovids, not deer, but stand on the same frame: horns
not antlers, kept for life, ringed and lyre-shaped, in both sexes. A fawn back,
a dark band along the flank, a white belly and rump. A frightened gazelle
stots, bouncing on four stiff legs; a springbok pronks, arching its back and
opening the white fan of hair along it.
"""
import math
from art.fauna_b import shade, walk_foot
from art.fauna_d import _mirror, WALK, GALLOP, TROT
from art import rig
from art.rig import Canvas, T, at, disk, tube, poly, rot, add, lerp, smooth, noise, rimmed

GM, HM, WM = 50, 28, 88

ROLES = "o d m l h b q s k e a c p".split()


def _c(o, d, m, l, h, b, q, s, k, e, a, c, p):
    return dict(o=o, d=d, m=m, l=l, h=h, b=b, q=q, s=s, k=k, e=e, a=a, c=c, p=p)


# a c are the antler and its shade, the same in every coat.
ANTLER = ("#d9c7a0", "#9c8663")

KINDS = {
    # Two metres at the shoulder, a tall rangy deer of open parkland.
    "irish-elk": dict(s=1.0, leg=1.0, girth=1.18, hump=1.0, stripe=True, mane=False, antler="palm", tail=2.5, muzzle=1.0,
                      forms={"stag": dict(antlers=1.0, s=1.0), "hind": dict(antlers=0.0, s=0.88)},
                      form_weights={"stag": 1.0, "hind": 1.4}, coats={
        "fawn": _c("#20150c", "#6b4a2a", "#9a7042", "#bd9259", "#d6ae74", "#e2cda4", "#f1e6cf", "#3b2615", "#140e09", "#0c0806", *ANTLER, "#7a4a44"),
        "grey": _c("#1d1813", "#5b4c3b", "#85725a", "#a69176", "#c0ab8e", "#d9ccb3", "#eee7d8", "#33291f", "#140e09", "#0c0806", *ANTLER, "#7a4a44"),
    }, weights={"fawn": 3, "grey": 1}),
    # A metre and a bit at the shoulder; the deer of the whole northern ice
    # edge, and of the Magdalenian and Ahrensburgian hunters.
    "reindeer": dict(s=0.6, leg=0.78, girth=1.4, hump=0.0, stripe=False, mane=True, antler="rangifer", tail=2.0, muzzle=1.3,
                     forms={"bull": dict(antlers=1.0, s=1.0), "cow": dict(antlers=0.6, s=0.88)},
                     form_weights={"bull": 1.0, "cow": 2.0}, coats={
        "winter": _c("#1c1813", "#5e5244", "#8a7c69", "#ada08b", "#c9bea9", "#e6ded0", "#f7f3ea", "#3a3128", "#120f0c", "#0a0806", *ANTLER, "#7a4a44"),
        "summer": _c("#170f09", "#3f2c1c", "#5f452d", "#7d5f40", "#997a56", "#c7b597", "#ece2cf", "#2a1d12", "#120f0c", "#0a0806", *ANTLER, "#7a4a44"),
        "pale": _c("#2a2520", "#8a8174", "#b3aa9b", "#cdc5b7", "#e0dacd", "#efebe3", "#fbf9f4", "#5e564b", "#1a1511", "#0a0806", *ANTLER, "#7a4a44"),
    }, weights={"winter": 6, "pale": 1}, seasons={"winter": {"summer": "summer"}}),
    # 1.9 m at the shoulder. b q h are the grey stockings, not belly and rump.
    "moose": dict(s=0.7, leg=1.15, girth=1.12, hump=1.3, stripe=False, mane=False, antler="alces", tail=1.2, muzzle=1.35,
                  slope=3.0, carry=(4.0, 3.5), tilt=28, snout=10.0, bell=True, socks=True, belly=False, rump=False,
                  hooves=2, crop=24, gait="trot", chest=1.2,
                  forms={"bull": dict(antlers=1.0, s=1.0), "cow": dict(antlers=0.0, s=0.9)},
                  form_weights={"bull": 1.0, "cow": 1.6}, coats={
        "dark": _c("#140d08", "#2e2016", "#45311f", "#5e4430", "#d8d3c8", "#a59e92", "#77716a", "#241810", "#0c0806", "#070504", "#cbb48a", "#8e7652", "#6a4038"),
        "brown": _c("#170f09", "#3b2a1c", "#5a412b", "#79593c", "#dad4c6", "#aaa192", "#7b7469", "#2c1e13", "#0c0806", "#070504", "#cbb48a", "#8e7652", "#6a4038"),
    }, weights={"dark": 3, "brown": 1}),
    # 0.6 m at the shoulder, drawn a little over. h is the white face line.
    "gazelle": dict(s=0.34, leg=1.06, girth=0.85, hump=0.0, stripe=False, mane=False, antler="lyre", tail=2.5, muzzle=1.1,
                    carry=(-1.0, -5.0), snout=7.5, fine=True, hooves=0, skull=3.4, earlean=-40, cannon=0.6, band=True, ear=1.35, throat="b", limb=0.85, hm=40, gait="stot",
                    forms={"buck": dict(antlers=1.0, s=1.0), "doe": dict(antlers=0.65, s=0.92)},
                    form_weights={"buck": 1.0, "doe": 2.0}, coats={
        "dorcas": _c("#24170c", "#8a6238", "#c0935b", "#d7ad74", "#fbf7ee", "#f2ebdf", "#e6ddcd", "#4f2e15", "#1a120b", "#0b0806", "#8a7862", "#3a2e22", "#8a5a4a"),
        "chinkara": _c("#22140b", "#7d4f2c", "#ad7546", "#c78f5c", "#fbf7ee", "#f2ebdf", "#e6ddcd", "#4e2f19", "#1a120b", "#0b0806", "#8a7862", "#3a2e22", "#8a5a4a"),
        "goitered": _c("#241a10", "#8a6a45", "#b99a6c", "#d0b384", "#fbf7ee", "#f2ebdf", "#e6ddcd", "#6e5232", "#1a120b", "#0b0806", "#8a7862", "#3a2e22", "#8a5a4a"),
    }, weights={"dorcas": 3, "chinkara": 2, "goitered": 2}),
    # 0.8 m at the shoulder. h is the white face, s the chocolate band.
    "springbok": dict(s=0.4, leg=1.0, girth=0.95, hump=0.0, stripe=False, mane=False, antler="lyre", tail=2.2, muzzle=1.1,
                      carry=(-1.0, -4.0), snout=7.5, fine=True, hooves=0, skull=3.4, earlean=-40, cannon=0.6, band=True, ear=1.2, throat="b", limb=0.9, hm=40, gait="pronk",
                      whiteface=True,
                      forms={"ram": dict(antlers=0.8, s=1.0), "ewe": dict(antlers=0.55, s=0.92)},
                      form_weights={"ram": 1.0, "ewe": 1.6}, coats={
        "cinnamon": _c("#22120a", "#83461f", "#b46b38", "#cf8a50", "#fbf8f2", "#f3eee5", "#e8e1d4", "#3a1d0e", "#160d07", "#090605", "#806c56", "#33271c", "#8a5a4a"),
    }, weights={"cinnamon": 1}),
}
SPECIES = list(KINDS)
for _k in KINDS.values():
    for _coat in _k["coats"].values():
        assert len(set(_coat.values())) == len(ROLES), _coat


def dims(sp):
    s = KINDS[sp]["s"]
    return round(WM * s), round(GM * s), round(KINDS[sp].get("hm", HM) * s)


NATIVE_SIZES = {sp: (dims(sp)[0], dims(sp)[1] + 4 + dims(sp)[2]) for sp in SPECIES}
STANDING_SIZES = {sp: (dims(sp)[0], dims(sp)[1] + 1) for sp in SPECIES}
STATES = {sp: {"idle": 16, "graze": 16, "wander": 8, "flee": 8, "rest": 16} for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}

K = KINDS["irish-elk"]
F = K["forms"]["stag"]


# ------------------------------------------------------------------ antlers
def palm_side(far):
    """The giant deer's antler seen from the side, from the pedicle: a brow
    tine forward, the beam out and back, a broad palm with tines on its rim.
    Returns (tubes, polygon, tines) in head-local units, x forward, y down."""
    beam = [(0, 0), (-4, -3), (-9, -5)]
    palm = [(-7, -4), (-15, -5), (-25, -8), (-30, -14), (-25, -18), (-14, -16), (-6, -9)]
    tines = [((-30, -14), (-34, -16)), ((-28, -17), (-31, -21)), ((-24, -18), (-25, -23)), ((-19, -17.5), (-18, -22)),
             ((-14, -16), (-12, -20)), ((-8, -11), (-5, -15))]
    brow = [((-1, -1), (4, -4)), ((4, -4), (7, -3))]
    return beam, palm, tines + brow


def rangifer_side(far):
    """Beam swept back, up and forward in a C; the shovel held down over the
    face; a few points at the crown."""
    beam = [(0, 0), (-4, -3), (-8, -9), (-9, -17), (-6, -23), (-2, -26)]
    shovel = [(1, -1), (5, -2), (8, 0), (7, 3), (3, 1)]
    tines = [((-8, -9), (-4, -11)), ((-9, -17), (-13, -20)), ((-6, -23), (-9, -28)), ((-2, -26), (0, -30)),
             ((-2, -26), (2, -27))]
    return beam, shovel, tines


def alces_side(far):
    """The moose's palm seen edge-on to the side: a short beam, then a dished
    plate rising behind the ears with points along its upper rim."""
    beam = [(0, 0), (-1.5, -2.5), (-3, -4)]
    palm = [(-2, -3), (1, -6), (0, -9), (-5, -11), (-11, -11), (-15, -8), (-14, -5), (-8, -4)]
    tines = [((1, -6), (4, -8)), ((0, -9), (1.5, -12.5)), ((-3.5, -10.5), (-3.5, -14.5)), ((-7.5, -11), (-8, -15)),
             ((-11, -10.5), (-13, -14)), ((-14.5, -7.5), (-17.5, -9))]
    return beam, palm, tines


def lyre_side(far):
    """A horn up from the poll, back, and the tip hooked up and forward."""
    return [(0, 0), (-2, -4), (-5, -8), (-7.5, -12), (-8, -16), (-6.5, -19), (-4, -20.5)], [], []


def antler_side(c, p, near):
    amt = F["antlers"]
    if not amt:
        return
    hx, hy = p["head"]
    look = p["look"]
    ped = add((hx, hy), rot((-1.5, -2.5), look + K.get("tilt", 0)))
    k = amt
    beam, plate, tines = dict(palm=palm_side, rangifer=rangifer_side, alces=alces_side, lyre=lyre_side)[K["antler"]](not near)
    shift = (0, 0) if near else (2.5, -1.5)
    if K["antler"] == "lyre":
        shift = (0, 0) if near else (-2.0, 0.5)

    def P(v):
        return add(add(ped, shift), rot((v[0] * k, v[1] * k), (look - 35) * (0.8 if K["antler"] == "alces" else 0.45)))

    if K["antler"] == "lyre":
        # ringed: a pale ridge every other row up the lower two thirds
        m = tube([P(v) for v in beam], [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4])
        ring_top = T(P(beam[3]))[1]
        c.paint({(x, y): "c" if not near or y % 2 == 0 or y <= ring_top else "a" for x, y in m})
        return
    m = tube([P(v) for v in beam], [1.3, 1.1, 1.0, 0.9, 0.8, 0.7][: len(beam)])
    m |= poly([P(v) for v in plate])
    for a, b in tines:
        m |= tube([P(a), P(b)], [0.8, 0.45])
    if near:
        c.paint({(x, y): "c" if (x, y + 1) not in m or (x - 1, y) not in m else "a" for x, y in m})
    else:
        c.paint({xy: "c" for xy in m})


# ---------------------------------------------------------------- side view
def pose(**k):
    lg = K["leg"]
    base = GM - 37 * lg
    p = dict(hip=(30.0, base + 10 + K.get("slope", 0)), sh=(48.0, base + 8), head=add((60.0, base - 4), K.get("carry", (0, 0))),
             look=35.0, neck=1.0, feet=dict(fh=(28.0, GM), nh=(31.0, GM), ff=(47.0, GM), nf=(50.0, GM)),
             ears="up", eye="open", mouth=0, chew=0, tail=0.0, breath=0, down=False, air=0.0, arch=0.0)
    p.update(k)
    return p


def _flank(px, mask, hip, sh, white=0.55):
    """Fawn above, a dark band along the flank, white below."""
    cols = {}
    for x, y in mask:
        cols.setdefault(x, []).append(y)
    hx_, sx_ = T(hip)[0], T(sh)[0]
    for x, ys in cols.items():
        top, bot = min(ys), max(ys)
        line = top + round((bot - top + 1) * white)
        for y in ys:
            if y > line:
                px[(x, y)] = "b"
            elif y == line and hx_ - 1 <= x <= sx_ + 1:
                px[(x, y)] = "s"
            elif y == line - 1 and K.get("whiteface") and hx_ <= x <= sx_:
                px[(x, y)] = "s"
    return cols


def body(c, p):
    hip, sh = p["hip"], p["sh"]
    b = p["breath"] * 0.3
    gi = K["girth"]
    hu = K["hump"]
    mid = lerp(hip, sh, 0.5)
    if p["arch"]:
        mid = add(mid, (0, -p["arch"]))
    mask = tube([add(hip, (-2, 0.5)), hip, mid, sh], [5.5 * gi + b, 6.5 * gi + b, 7.3 * gi + b, 7.8 * gi + b])
    if hu:
        mask |= disk(sh[0] - 1, sh[1] - 4.5 * hu, 4.8 * hu)
    px = shade(mask, 1, 1)
    xs = [x for x, _ in mask]
    left, right = min(xs), max(xs)
    shx = T(sh)[0]
    for x, y in mask:
        below = (x, y + 1) not in mask or (x, y + 2) not in mask
        if below and (x, y - 3) in mask and K.get("belly", True):
            px[(x, y)] = "b"  # the pale belly
        if K["stripe"] and abs(x - (shx - 3 * rig.S["s"] - (y - T(sh)[1]) * 0.35)) < 1.3 * rig.S["s"] and not below:
            px[(x, y)] = "s"  # the dark stripe falling behind the shoulder
    if K.get("band"):
        cols = _flank(px, mask, hip, sh)
        if p["arch"]:  # the springbok's fan, opened along the spine
            for x, ys in cols.items():
                if T(hip)[0] - 1 <= x <= shx - 1:
                    px[(x, min(ys))] = "h"
                    px[(x, min(ys) + 1)] = "h"
    if hu and not K.get("bell"):
        for x, y in disk(sh[0] - 1, sh[1] - 4.5 * hu, 4.8 * hu):
            if (x, y - 1) not in mask:
                px[(x, y)] = "d"
            elif px.get((x, y)) in ("m", "l", "h"):
                px[(x, y)] = "s" if K["stripe"] else "d"
    # the rump patch
    if K.get("rump", True):
        for x, y in mask:
            if x <= left + 2 and px[(x, y)] in "mlhs":
                px[(x, y)] = "q"
    c.paint(px)
    return mask


def neck_head(c, p):
    hx, hy = p["head"]
    look = p["look"] + K.get("tilt", 0)
    sh = p["sh"]
    nr = 3.6 * p["neck"] + (1.0 if K["mane"] else 0)
    root = add(sh, (1.5, -2.5))
    mid = lerp(root, (hx, hy), 0.5)
    neck = tube([root, mid, (hx, hy)], [nr + 1.2, nr, 2.6])
    npx = shade(neck, 1, 1)
    for xy, r in list(npx.items()):
        if xy in c.px and r in "lh":
            npx[xy] = "m"
    # the dark collar of the giant deer, or the reindeer's white mane below
    hxp, hyp = T((hx, hy))
    for x, y in neck:
        if (x, y + 1) not in neck and (x, y + 1) not in c.px:
            npx[(x, y)] = K.get("throat") or ("s" if K["stripe"] else "q" if K["mane"] else "d")
    if K.get("bell"):  # a darker neck and mane, so the paler head stands off it
        npx = {xy: {"m": "d", "d": "s"}.get(r, r) for xy, r in npx.items()}
    c.paint(npx)
    fwd = rot((1, 0), look)
    down = rot((0, 1), look)
    if K.get("bell"):  # the moose's bell, a flap of skin under the throat
        bt = add(add((hx, hy), fwd, 1.5), down, 2.0)
        bell = tube([bt, add(bt, (-0.5, 3.5)), add(bt, (-1.2, 7.0))], [1.4, 1.1, 0.9])
        c.paint({xy: "s" for xy in bell})
    if K["mane"]:
        rx, ry = T(root)
        for x, y in list(neck):
            if (x, y + 1) not in neck and x > rx - 1 and x < hxp - 1:
                for i in range(1, 3 + round(noise(x, 3) * 2)):
                    if (x, y + i) not in c.px:
                        c.px[(x, y + i)] = "q"
    skull = disk(hx, hy, K.get("skull", 2.7))
    mz = K["muzzle"]
    sn = K.get("snout", 7.5)
    nose = add((hx, hy), fwd, sn)
    muzzle = tube([add((hx, hy), fwd, 1), add((hx, hy), fwd, 4.5 * sn / 7.5), nose], [2.4, 1.9 * mz, 1.5 * mz])
    if K.get("bell"):  # the overhanging, drooping nose
        nose = add(nose, down, 0.8)
        muzzle |= disk(*add(nose, fwd, -0.3), 1.9 * mz)
    hm = skull | muzzle
    hp = shade(hm, 1, 1)
    for x, y in hm:
        v = (x - hxp, y - hyp)
        if v[0] * down[0] + v[1] * down[1] > 1.2 * rig.S["s"] and v[0] * fwd[0] + v[1] * fwd[1] > 1.5:
            hp[(x, y)] = "d" if K.get("bell") else "b"
    if K.get("bell"):  # the long grey-brown nose
        for x, y in muzzle - skull:
            v = (x - hxp, y - hyp)
            if hp[(x, y)] == "m" and v[0] * fwd[0] + v[1] * fwd[1] > 2.5 * rig.S["s"]:
                hp[(x, y)] = "l"
    ex, ey = at(add(add((hx, hy), fwd, 1.2), down, -0.8))
    if K["antler"] == "lyre":
        # a white line from the eye to the nose with a dark one under it, or
        # the springbok's white face crossed by a dark line through the eye
        for x, y in hm:
            v = (x - hxp, y - hyp)
            f, d = v[0] * fwd[0] + v[1] * fwd[1], v[0] * down[0] + v[1] * down[1]
            if K.get("whiteface"):
                if f > -0.5 * rig.S["s"] and (x, y) != (ex, ey):
                    hp[(x, y)] = "h"
                if f > 0 and abs(d - 0.9) < 0.6 and (x, y) != at(nose):
                    hp[(x, y)] = "s"
            elif f > 0.5:
                if abs(d + 0.6) < 0.55:
                    hp[(x, y)] = "h"
                elif abs(d - 0.5) < 0.55:
                    hp[(x, y)] = "s"
    c.paint(hp)
    c.px[at(nose)] = "k"
    c.px[(ex, ey)] = "e" if p["eye"] == "open" else "d"
    if p["mouth"]:
        c.px[at(add(nose, down, 1.2))] = "p"
    if p["chew"]:
        c.px[at(add(add((hx, hy), fwd, 4), down, 1.8))] = "d"
    # the ears: a leaf each side of the poll
    tilt = {"up": -35, "back": -80, "side": 10}[p["ears"]] + K.get("earlean", 0)
    for off, lean in (((-1.5, -1.8), 0), ((-0.5, -2.3), 12)):
        b = add((hx, hy), rot(off, look))
        axis = rot((0, -1), tilt + lean + p["look"] * 0.5)
        tip = add(b, axis, 4.2 * K.get("ear", 1))
        e = tube([b, lerp(b, tip, 0.5), tip], [1.1, 1.2 * K.get("ear", 1), 0.4])
        if K.get("fine"):  # too small for a rim: the far ear dark, the near one light
            c.paint({xy: "d" if lean == 0 else "l" for xy in e})
        else:
            rimmed(c, e, lambda x, y: "d" if lean == 0 else "l")


def legs(c, p, near):
    """Hind: thigh to a stifle forward, then back to a high hock, a thin
    cannon to the hoof. Fore: straight from elbow to hoof, the knee folding
    the foot back as it lifts."""
    hip, sh = p["hip"], p["sh"]
    lg = K["leg"]
    th = K.get("limb", 1)
    for key in (("nh", "nf") if near else ("fh", "ff")):
        hind = key.endswith("h")
        fx, fy = p["feet"][key]
        up = max(0.0, GM - p["air"] - fy)
        if hind:
            root = add(hip, (0.5, 2))
            stifle = add(root, (2.5 + up * 0.3, 7 * lg))
            hock = (fx - 2.2 - up * 0.4, fy - 11 * lg + up * 0.3)
            upper = tube([root, stifle, hock], [4.2 * th, 2.6 * th, 1.3 * th])
            lower = [hock, (fx, fy - 1)]
        else:
            root = add(sh, (0.5, 3))
            elbow = add(root, (0.5, 7 * lg))
            knee = (fx + up * 0.5, fy - 10 * lg + up * 0.4)
            upper = tube([root, elbow, knee], [3.8 * th, 2.2 * th, 1.3 * th])
            lower = [knee, (fx - up * 0.4, fy - 1)]
        m = upper | tube(lower, [1.0 * K.get("cannon", 1), 0.9 * K.get("cannon", 1)])
        sock = T(lower[0])[1] - 1.5 * rig.S["s"]
        if near:
            tp = shade(m, 1, 1)
            tp = {xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in tp.items()}
            for x, y in m:
                if (x - 1, y) not in m and tp[(x, y)] == "m":
                    tp[(x, y)] = "l"
            if K.get("socks"):  # grey below the knee and hock
                tp.update({(x, y): "h" if (x - 1, y) not in m else "b" for x, y in m if y >= sock})
        else:
            tp = {xy: "q" if K.get("socks") and xy[1] >= sock else "d" for xy in m}
        c.paint(tp)
        hoof = at((fx - (up * 0.4 if not hind else 0), fy))
        w = K.get("hooves", 2 if K["muzzle"] > 1.1 else 1)  # the reindeer's broad hooves
        for dx in range(-1 if w else 0, max(w, 1)):
            c.px[(hoof[0] + dx, hoof[1])] = "k"
        if not K.get("fine"):
            c.px[(hoof[0], hoof[1] - 1)] = "k"


def tail(c, p):
    hip = p["hip"]
    base = add(hip, (-7, -2))
    m = tube([base, add(base, (-1 - p["tail"] * 0.3, K["tail"] + p["tail"] * 0.2))], [1.2, 0.9])
    c.paint({xy: "q" if xy[1] > T(base)[1] + 1 else "d" for xy in m})


def lying(c, p):
    """Down on the chest, legs folded under, head up, chewing."""
    hip, sh = p["hip"], p["sh"]
    gi = 1 if K["girth"] > 1 else K["girth"]
    mask = tube([add(hip, (-2, 0.5)), hip, lerp(hip, sh, 0.5), sh], [(6 + p["breath"] * 0.3) * gi, 7 * gi, 7.5 * gi, 7.8 * gi])
    hu = K["hump"]
    if hu:
        mask |= disk(sh[0] - 1, sh[1] - 4.5 * hu, 4.8 * hu)
    for x, y in list(mask):
        if y > T((0, GM))[1]:
            mask.discard((x, y))
    px = shade(mask, 1, 1)
    for x, y in mask:
        if (x, y + 1) not in mask:
            px[(x, y)] = "d"
    if K.get("band"):
        _flank(px, mask, hip, sh, 0.7)
        left = min(x for x, _ in mask)
        px.update({(x, y): "q" for x, y in mask if x <= left + 1 and px[(x, y)] in "mlhs"})
    c.paint(px)
    # the folded forelegs tucked in front, a hind hoof showing behind
    ff = tube([add(sh, (3, 5)), (sh[0] + 6, GM - 1)], [1.5, 1.2])
    c.paint({xy: "d" for xy in ff})
    c.px[at((sh[0] + 7, GM - 0.5))] = "k"
    c.px[at((hip[0] - 5, GM - 0.5))] = "k"
    return mask


def side(p):
    c = Canvas()
    antler_side(c, p, False)
    if p["down"]:
        lying(c, p)
    else:
        legs(c, p, False)
        tail(c, p)
        body(c, p)
        legs(c, p, True)
    neck_head(c, p)
    antler_side(c, p, True)
    return c.finish()


# ------------------------------------------------------------------ gaits
def walk(frame):
    t = frame / 8
    feet = {}
    for key, x in dict(fh=28.0, nh=31.0, ff=47.0, nf=50.0).items():
        dx, up = walk_foot(t + WALK[key], 3.2, 3.2, 0.6)
        feet[key] = (x + dx, GM - up)
    bob = 0.5 * math.sin(4 * math.pi * t)
    p = pose(feet=feet, look=30 + 4 * math.sin(4 * math.pi * t), tail=math.sin(2 * math.pi * t))
    p["hip"], p["sh"] = add(p["hip"], (0, bob)), add(p["sh"], (0, -bob))
    p["head"] = add(p["head"], (0.5 * math.sin(4 * math.pi * t), -bob))
    return p


def gallop(frame):
    """Bunch and stretch. A stag carries the head high and back so the
    antlers ride over the shoulders; reindeer run with the head out."""
    t = frame / 8
    stretch = math.cos(2 * math.pi * (t - 0.1))
    rock = math.sin(2 * math.pi * (t + 0.1))
    lg = K["leg"]
    base = GM - 37 * lg
    hip = (30 - stretch * 1.6, base + 10 - rock * 1.0 - 1.2 * max(0.0, stretch))
    sh = (48 + stretch * 1.4, base + 8 + rock * 1.0 - 1.2 * max(0.0, stretch))
    feet = {}
    for key in ("fh", "nh", "ff", "nf"):
        dx, up = walk_foot(t + GALLOP[key], 6.5, 6.0, 0.32)
        hind = key.endswith("h")
        feet[key] = ((hip[0] - 1 if hind else sh[0] + 1) + dx + (1.5 if key[0] == "n" else 0), GM - up)
    heavy = F["antlers"] and K["antler"] == "palm"
    head = add(sh, (9, -13 if heavy else -9))
    return pose(hip=hip, sh=sh, head=head, look=12 if heavy else 30, feet=feet, ears="back", tail=-2, mouth=1)


def trot(frame):
    """The moose's flight: a long, level trot in diagonal pairs, the head out."""
    t = frame / 8
    feet = {}
    for key, x in dict(fh=28.0, nh=31.0, ff=47.0, nf=50.0).items():
        dx, up = walk_foot(t + TROT[key], 5.0, 5.0, 0.45)
        feet[key] = (x + dx, GM - up)
    bob = 0.7 * abs(math.sin(2 * math.pi * t))
    p = pose(feet=feet, look=22.0, ears="back", tail=1, mouth=0)
    p["hip"], p["sh"] = add(p["hip"], (0, -bob)), add(p["sh"], (0, -bob))
    p["head"] = add(p["head"], (2.5, -bob - 1.0))
    return p


def stot(frame):
    """Up off all four feet at once with the legs held stiff and straight. A
    springbok arches its back, drops its head and opens the fan along its
    spine; a gazelle keeps its head up, and every other leap is a bound."""
    t = frame / 8
    pronk = K.get("gait") == "pronk"
    bound = not pronk and frame >= 4
    u = (t * 2) % 1 if not pronk else t
    air = 12.0 * max(0.0, math.sin(math.pi * (u - 0.15) / 0.75)) if 0.15 <= u <= 0.9 else 0.0
    crouch = 1.2 if u < 0.15 or u > 0.9 else 0.0
    if bound:
        reach = math.sin(math.pi * (u - 0.15) / 0.75) if 0.15 <= u <= 0.9 else -0.4
        feet = dict(fh=(25.0 - 2 * reach, GM - air), nh=(27.0 - 2 * reach, GM - air),
                    ff=(51.0 + 2 * reach, GM - air), nf=(53.0 + 2 * reach, GM - air))
        p = pose(feet=feet, look=25.0, ears="back", tail=-2, air=air)
    else:
        feet = dict(fh=(29.0, GM - air), nh=(31.0, GM - air), ff=(46.0, GM - air), nf=(48.0, GM - air))
        p = pose(feet=feet, look=60.0 if pronk else 30.0, ears="back" if pronk else "up", tail=-2, air=air,
                 arch=4.0 * min(1.0, air / 6) if pronk else 0.0)
    for k in ("hip", "sh", "head"):
        p[k] = add(p[k], (0, crouch - air))
    if pronk:
        p["head"] = add(p["head"], (-1.0, 2.0 + 3.0 * min(1.0, air / 6)))
    if bound:
        p["hip"], p["sh"] = add(p["hip"], (-1.0, 0)), add(p["sh"], (1.0, 0))
        p["head"] = add(p["head"], (2.0, 1.5))
    return p


def idle(frame):
    """Head up and still, ears turning; a flick of the tail, a blink. A stag
    lifts his head and roars, as a red deer stag does in the rut."""
    t = frame / 16
    roar = F["antlers"] and K["antler"] == "palm" and 9 <= frame <= 12
    look = smooth([(0, 35.0), (0.2, 35.0), (0.3, 20.0), (0.5, 22.0), (0.6, 35.0)], t)
    p = pose(look=-5 if roar else look, mouth=1 if roar else 0, ears="side" if 4 <= frame <= 6 else "back" if roar else "up",
             eye="closed" if frame == 14 else "open", tail=[0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0][frame],
             breath=1 if frame % 8 in (2, 3, 4) else 0)
    if roar:
        p["head"] = add(p["head"], (1.5, -2))
    return p


def graze(frame):
    """Head down cropping, a step forward, then the head comes up to look
    round while it chews."""
    feet = dict(fh=(28.0, GM), nh=(31.0, GM), ff=(47.0, GM), nf=(50.0, GM))
    lg = K["leg"]
    base = GM - 37 * lg
    if 6 <= frame <= 8:
        u = (frame - 5) / 3
        feet["nf"] = (50.0 + u * 2.5, GM - math.sin(math.pi * u) * 2.5)
    step = 1.0 if frame > 8 else 0.0
    feet["nf"] = feet["nf"] if frame <= 8 else (52.5, GM)
    if frame >= 11:  # up to look round, chewing
        u = smooth([(0, 0.0), (0.2, 1.0), (0.8, 1.0)], (frame - 11) / 5)
        return pose(feet=feet, head=add((60 + step, base - 4 + (1 - u) * 20), K.get("carry", (0, 0)), u),
                    look=35 + (1 - u) * (55 - K.get("tilt", 0)), chew=frame % 2,
                    ears="side" if frame == 13 else "up")
    tug = frame % 2
    return pose(feet=feet, head=(58.5 + step * 0.5, GM - K.get("crop", 12) - tug * 0.7), look=95 - tug * 5 - K.get("tilt", 0), ears="up",
                tail=[0, 0, 0, 0, 1, 2, 1, 0, 0, 0, 0][frame])


def rest(frame):
    breath = 1 if frame % 8 in (2, 3, 4, 5) else 0
    base = GM - 17
    chew = frame % 4 in (1, 2)
    head_up = frame < 11
    p = pose(hip=(28.0, base + 9), sh=(46.0, base + 7), down=True, breath=breath, chew=chew and head_up,
             eye="closed" if not head_up else "open", ears="side" if frame in (4, 5) else "up")
    if head_up:
        p["head"], p["look"] = add((57.0, base - 5), K.get("carry", (0, 0)), 0.5), 30
    else:  # the head laid back along the flank
        p["head"], p["look"], p["neck"] = (40.0, base - 1), 170, 0.9
    return p


# ------------------------------------------------------------ front and back
def palm_front(c, cx, hy, far_side_dark=False):
    amt = F["antlers"]
    if not amt:
        return
    k = amt
    for sgn in (-1, 1):
        if K["antler"] == "palm":
            beam = [(cx + sgn * 1.5, hy - 2.5), (cx + sgn * 6 * k, hy - 5 * k), (cx + sgn * 11 * k, hy - 8 * k)]
            palm = [(cx + sgn * 9 * k, hy - 7 * k), (cx + sgn * 20 * k, hy - 8 * k), (cx + sgn * 32 * k, hy - 14 * k),
                    (cx + sgn * 33 * k, hy - 22 * k), (cx + sgn * 24 * k, hy - 24 * k), (cx + sgn * 13 * k, hy - 17 * k)]
            tips = [(33, -22, 36, -25), (29, -23.5, 31, -29), (24, -24, 24, -30), (19, -21, 17, -27), (14, -18, 11, -23),
                    (32, -14, 37, -14)]
            m = tube(beam, [1.4, 1.2, 1.0]) | poly(palm)
            for a, b, x2, y2 in tips:
                m |= tube([(cx + sgn * a * k, hy + b * k), (cx + sgn * x2 * k, hy + y2 * k)], [0.8, 0.45])
            m |= tube([(cx + sgn * 2.5, hy - 3), (cx + sgn * 5, hy + 1)], [0.8, 0.45])  # brow tine
        elif K["antler"] == "alces":
            # palms spread sideways like open hands, points along the rim
            beam = [(cx + sgn * 1.5, hy - 2.5), (cx + sgn * 4 * k, hy - 3.5 * k), (cx + sgn * 7 * k, hy - 4 * k)]
            palm = [(cx + sgn * 6 * k, hy - 2.5 * k), (cx + sgn * 13 * k, hy - 2.5 * k), (cx + sgn * 19 * k, hy - 6 * k),
                    (cx + sgn * 20 * k, hy - 11 * k), (cx + sgn * 14 * k, hy - 12 * k), (cx + sgn * 8 * k, hy - 8 * k)]
            tips = [(8, -8, 7, -13), (11, -10.5, 11, -15), (14, -12, 15, -16.5), (17, -11.5, 19.5, -15.5),
                    (19.5, -9, 23, -11), (19.5, -6, 23, -5.5)]
            m = tube(beam, [1.4, 1.2, 1.0]) | poly(palm)
            for a, b, x2, y2 in tips:
                m |= tube([(cx + sgn * a * k, hy + b * k), (cx + sgn * x2 * k, hy + y2 * k)], [0.8, 0.45])
        elif K["antler"] == "lyre":
            # out from the poll, bowed apart, the tips turned in and up
            tip = 3.5 if K.get("whiteface") else 7.5
            beam = [(cx + sgn * 1.8, hy - 2.5), (cx + sgn * 5.0 * k, hy - 7 * k), (cx + sgn * 6.5 * k, hy - 11 * k),
                    (cx + sgn * 6.0 * k, hy - 15 * k), (cx + sgn * tip * k, hy - 19 * k)]
            m = tube(beam, [0.8, 0.7, 0.6, 0.5, 0.4])
            ring_top = T((0, hy - 13 * k))[1]
            c.paint({(x, y): "c" if y % 2 == 0 or y <= ring_top else "a" for x, y in m})
            continue
        else:
            beam = [(cx + sgn * 1.5, hy - 2.5), (cx + sgn * 6 * k, hy - 7 * k), (cx + sgn * 9 * k, hy - 15 * k),
                    (cx + sgn * 8 * k, hy - 22 * k), (cx + sgn * 5 * k, hy - 27 * k)]
            m = tube(beam, [1.2, 1.1, 1.0, 0.9, 0.7])
            for a, b, x2, y2 in ((9, -15, 13, -18), (8, -22, 12, -26), (5, -27, 3, -31)):
                m |= tube([(cx + sgn * a * k, hy + b * k), (cx + sgn * x2 * k, hy + y2 * k)], [0.7, 0.4])
        c.paint({(x, y): "c" if (x, y + 1) not in m else "a" for x, y in m})
    if K["antler"] == "rangifer":  # the shovel, flat over the face
        sh = poly([(cx - 1.2, hy - 2), (cx + 1.5, hy - 2), (cx + 1.8, hy + 3 * k), (cx - 1.5, hy + 3 * k)])
        c.paint({xy: "a" for xy in sh})


def _band(bp, bm):
    """Seen end on, the flank band shows down each side above a white belly."""
    rows = {}
    for x, y in bm:
        rows.setdefault(y, []).append(x)
    top, bot = min(rows), max(rows)
    line = top + round((bot - top + 1) * 0.55)
    for y, xs in rows.items():
        for x in xs:
            if y > line:
                bp[(x, y)] = "b"
            elif y >= line - 1 and x in (min(xs), max(xs)):
                bp[(x, y)] = "s"


def face(state, frame, south):
    c = Canvas()
    cx = WM / 2
    g = GM
    lg = K["leg"]
    n = 8 if state in ("wander", "flee") else 16
    t = frame / n
    lifts, y0, look, ears, eye, chew, mouth, down, graze_ = {}, 0.0, 0.0, "up", True, False, False, False, False
    if state in ("wander", "flee"):
        fast = state == "flee"
        gait = K.get("gait") if fast else None
        phases, amp, lift, stance = (GALLOP, 6.5, 6.0, 0.32) if fast else (WALK, 3.2, 3.2, 0.6)
        if gait == "trot":
            phases, amp, lift, stance = TROT, 5.0, 5.0, 0.45
        for key in ("fh", "nh", "ff", "nf"):
            lifts[key] = walk_foot(t + phases[key], amp, lift, stance)[1]
        y0 = -abs(math.sin(2 * math.pi * t)) * (2.5 if fast else 0.6)
        if gait in ("stot", "pronk"):  # all four feet leave the ground together
            sp = stot(frame)
            lifts = {}
            y0 = sp["sh"][1] - pose()["sh"][1]
        elif gait == "trot":
            y0 = -abs(math.sin(2 * math.pi * t)) * 0.7
        ears = "back" if fast else "up"
        mouth = fast and not gait
    elif state == "idle":
        look = -1.5 if 9 <= frame <= 12 and F["antlers"] and K["antler"] == "palm" else 0
        mouth = look < 0
        ears = "side" if 4 <= frame <= 6 else "up"
        eye = frame != 14
    elif state == "graze":
        graze_ = frame < 11
        chew = frame >= 11 and frame % 2
        if 6 <= frame <= 8:
            lifts["nf"] = math.sin(math.pi * (frame - 5) / 3) * 2.5
    elif state == "rest":
        down = True
        eye = frame < 11
        chew = frame < 11 and frame % 4 in (1, 2)
    top = g - 37 * lg
    hu = K["hump"]
    gi = K["girth"]

    def leg(x, key, ytop, dark):
        up = lifts.get(key, 0)
        bottom = g - up + (min(0.0, y0) if K.get("gait") in ("stot", "pronk") and state == "flee" else 0)
        m = tube([(x, ytop), (x, ytop + 5), (x, bottom - 1)], [2.6 * K.get("limb", 1), 1.4 * K.get("cannon", 1), 1.0 * K.get("cannon", 1)])
        tp = {xy: "d" for xy in m} if dark else shade(m, 1, 1)
        if K.get("socks"):
            sock = T((0, bottom - 11 * lg))[1]
            tp.update({(x_, y_): ("q" if dark else "b") for x_, y_ in m if y_ >= sock})
        c.paint(tp)
        fx, fy = at((x, bottom))
        c.px[(fx, fy)] = "k"
        if K.get("hooves", 2 if K["muzzle"] > 1.1 else 1) == 2:
            c.px[(fx + 1, fy)] = "k"

    def ears_at(hx, hy, mode):
        spread = {"up": 0, "side": 2.5, "back": 4}[mode] * (0.4 if K.get("fine") else 1)
        for sgn in (-1, 1):
            b = (hx + sgn * 2.2, hy - 1.8)
            er = K.get("ear", 1)
            tip = (hx + sgn * (5.5 * er + spread), hy - 5 * er + spread * 0.9)
            em = tube([b, lerp(b, tip, 0.5), tip], [1.1, 1.3 * er, 0.4])
            if K.get("fine"):
                c.paint({xy: "d" for xy in em})
            else:
                rimmed(c, em, lambda x, y: "d")

    def head_front(hx, hy, low=False):
        ln = K.get("snout", 7.5) / 7.5 * (0.6 if low else 1)
        m = disk(hx, hy, 3.2) | tube([(hx, hy), (hx, hy + 4.5 * ln)], [2.6, 1.8 * K["muzzle"]])
        if K.get("bell"):
            m |= disk(hx, hy + 4.8 * ln, 2.0 * K["muzzle"], 0.8)
        hp = shade(m, 1, 1)
        for x, y in m:
            if y >= T((0, hy + 2.5))[1]:
                hp[(x, y)] = "d" if K.get("bell") else "b"
        if K["antler"] == "lyre":
            for x, y in m:
                dx = abs(x + 0.5 - T((hx, hy))[0])
                if K.get("whiteface"):
                    hp[(x, y)] = "s" if abs(dx - 1.6 * rig.S["s"]) < 0.6 and y > T((0, hy))[1] else "h"
                elif y > T((0, hy - 0.5))[1] and abs(dx - 1.6 * rig.S["s"]) < 0.6:
                    hp[(x, y)] = "h"
        c.paint(hp)
        for sgn in (-1, 1):
            c.px[at((hx + sgn * 2.3, hy - 0.3))] = "e" if eye else "d"
        nose = at((hx, hy + 4.8 * ln))
        c.px[nose] = "k"
        c.px[(nose[0] - 1, nose[1])] = "k"
        if mouth:
            c.px[(nose[0], nose[1] + 1)] = "p"
        if chew:
            c.px[(nose[0] + 1, nose[1] + 1)] = "d"

    if down:
        ymid = g - 8
        bm = disk(cx, ymid, 8.5 * min(1, gi) * K.get("chest", 1), 0.75)
        if hu:
            bm |= disk(cx, ymid - 5 * hu, 4.5 * hu)
        bp = shade(bm, 1, 1)
        c.paint(bp)
        hy = ymid - 8 if frame < 11 else ymid - 2
        if south:
            if frame < 11:
                palm_front(c, cx, hy)
                ears_at(cx, hy, "side" if frame in (4, 5) else "up")
                nk = tube([(cx, ymid - 2), (cx, hy)], [3.8 + (1 if K["mane"] else 0), 3.0])
                c.paint({xy: ("q" if K["mane"] and xy[1] > T((0, ymid - 3))[1] else r) for xy, r in shade(nk, 1, 1).items()})
                head_front(cx, hy)
            else:  # head turned back onto the flank
                palm_front(c, cx + 4, ymid - 3)
                m = disk(cx + 4, ymid - 3, 3)
                c.paint(shade(m, 1, 1))
        else:
            palm_front(c, cx, hy - 3)
            if K.get("rump", True):
                c.paint({xy: "q" for xy in disk(cx, ymid + 2, 2.5)})
        return c.finish()

    if south:
        # beyond: hind legs, the back rising behind, then forelegs and the head
        for x, key in ((cx - 3.5, "fh"), (cx + 3.5, "nh")):
            leg(x, key, top + 10 + y0, True)
        bm = disk(cx, top + 5 + y0, 7.2 * K["girth"] * K.get("chest", 1), 1.3 / K.get("chest", 1))
        if hu:
            bm |= disk(cx, top - 1 - 1.5 * (hu - 1) + y0, 4.8 * hu)
        bp = shade(bm, 1, 1)
        for x, y in bm:
            if ((x, y + 1) not in bm or (x, y + 2) not in bm) and K.get("belly", True):
                bp[(x, y)] = "b"
        if K.get("band"):
            _band(bp, bm)
        c.paint(bp)
        for x, key in ((cx - 3, "ff"), (cx + 3, "nf")):
            leg(x, key, top + 12 + y0, False)
        if graze_:
            hy = g - 6 - (K.get("crop", 12) - 12)
            nk = tube([(cx, top + 8), (cx, hy - 2)], [3.2, 2.4])
            c.paint(shade(nk, 1, 1))
            palm_front(c, cx, hy - 1)
            ears_at(cx, hy, "up")
            head_front(cx, hy, True)
            return c.finish()
        hy = top - 4 + y0 + look + K.get("carry", (0, 0))[1] * 0.8
        nk = tube([(cx, top + 6 + y0), (cx, hy + 1)], [3.8 + (1.2 if K["mane"] else 0), 3.0])
        np_ = shade(nk, 1, 1)
        for x, y in nk:
            if K["mane"] and y > T((0, hy + 5))[1]:
                np_[(x, y)] = "q"
            elif K["stripe"] and y > T((0, hy + 5))[1]:
                np_[(x, y)] = "s"
            elif K.get("throat") and y > T((0, hy + 3))[1]:
                np_[(x, y)] = K["throat"]
        c.paint(np_)
        if K.get("bell"):
            c.paint({xy: "s" for xy in tube([(cx, hy + 5), (cx, hy + 10.5)], [1.4, 0.9])})
        palm_front(c, cx, hy)
        ears_at(cx, hy, ears)
        head_front(cx, hy)
        return c.finish()

    # north: the head and antlers beyond, then the back, the rump nearest
    hy = top - 4 + y0 + (10 if graze_ else 0) + K.get("carry", (0, 0))[1] * 0.8
    palm_front(c, cx, hy)
    ears_at(cx, hy, ears)
    c.paint(shade(disk(cx, hy, 3.0), 1, 1))
    nk = tube([(cx, hy + 2), (cx, top + 5 + y0)], [2.8, 3.6])
    c.paint(shade(nk, 1, 1))
    for x, key in ((cx - 3, "ff"), (cx + 3, "nf")):
        leg(x, key, top + 12 + y0, True)
    bm = disk(cx, top + 8 + y0, 7.2 * K["girth"] * K.get("chest", 1), 1.2 / K.get("chest", 1))
    if hu > 1:
        bm |= disk(cx, top + 2 - 1.5 * (hu - 1) + y0, 4.8 * hu)
    bp = shade(bm, 1, 1)
    if K.get("band"):
        _band(bp, bm)
    c.paint(bp)
    for x, key in ((cx - 3.5, "fh"), (cx + 3.5, "nh")):
        leg(x, key, top + 13 + y0, False)
    rump = disk(cx, top + 11 + y0, 3.4 * (1.3 if K.get("band") else 1), 1.2)
    if K.get("rump", True):
        c.paint({xy: "q" for xy in rump})
    tl = tube([(cx, top + 9 + y0), (cx, top + 9 + K["tail"] + y0 - (2 if state == "flee" else 0))], [1.1, 0.8])
    c.paint({xy: "d" for xy in tl})
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "graze": graze, "wander": walk, "flee": gallop, "rest": rest}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, form, state, facing, frame):
    global K, F
    K = KINDS[species]
    F = K["forms"][form]
    s = K["s"] * F["s"]
    rig.use(s, GM, WM, HM, PALETTES[species])
    # a smaller form keeps the species' canvas, so its frames pack alike
    rig.S.update(W=dims(species)[0], G=dims(species)[1], HR=dims(species)[2])
    if facing in ("east", "west"):
        fn = {"trot": trot, "stot": stot, "pronk": stot}[K["gait"]] if state == "flee" and "gait" in K else SIDE[state]
        im = side(fn(frame))
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_cervid():
    out = {}
    for sp in SPECIES:
        forms = list(KINDS[sp]["forms"])
        for form in forms:
            art = sp if form == forms[0] else f"{sp}.{form}"
            for state, count in STATES[sp].items():
                for facing in DIRECTIONS:
                    for frame in range(count):
                        out[f"faunar-{art}-{state}-{facing}-{frame}"] = draw(sp, form, state, facing, frame)
    return out


def looks():
    return {sp: {
        "roles": PALETTES[sp],
        "forms": [{"id": f, "weight": w, "where": None, "coats": k["weights"]} for f, w in k["form_weights"].items()],
        "coats": k["coats"],
        "coatFrom": {},
        **({"seasons": k["seasons"]} if "seasons" in k else {}),
    } for sp, k in KINDS.items()}
