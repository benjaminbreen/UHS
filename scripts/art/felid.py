"""The great cats: one cat rig for the Ice Age lions and Smilodon and for the
four living big cats.

The cave lion is drawn from the Chauvet and Lascaux lions and the frozen cubs
from Yakutia: bigger than a lion of today, pale and thick-coated, and the
males with no mane. The American lion is longer in the leg and tawny.
Smilodon is shorter and far heavier in the forequarters, with a bobbed tail
and sabres that show with the mouth shut; its spotting is a guess.

Every cat walks with its head low and creeps up belly to the grass. A lion
runs its quarry down in a short bounding gallop; Smilodon was built to
ambush, grapple with the forelegs and bite, so its pounce ends clinging.

Of the living cats the tiger is the biggest, long and heavy-shouldered, with
a white ruff and narrow paired stripes; the lion is as tall, and the male's
mane is dark at its edge (the Asiatic male's is thin, with a fold of skin
along the belly). The jaguar is short-legged and big-headed, its rosettes
large with a spot inside; the leopard is the smallest and lowest, with small
broken rosettes and a long tail it carries curled up at the white tip.
"""
import math
from art.fauna_b import shade, walk_foot
from art.fauna_d import _mirror, WALK, GALLOP
from art import rig
from art.rig import Canvas, T, at, disk, tube, rot, add, lerp, smooth, noise, rimmed

GM, HM, WM = 32, 18, 68

ROLES = "o d m l h b k e s i p t".split()


def _c(o, d, m, l, h, b, s, t):
    return dict(o=o, d=d, m=m, l=l, h=h, b=b, k="#17120e", e="#c8963a", s=s, i="#efe6d0", p="#8a4a45", t=t)


KINDS = {
    # 1.2 m at the shoulder, a tenth bigger than a lion now.
    "cave-lion": dict(s=1.0, leg=1.0, fore=1.0, tail=1.0, sabre=False, spots=False, head=1.0, coats={
        "pale": _c("#2a2118", "#7a6a55", "#a8977c", "#c4b59b", "#dbcfb8", "#ebe4d6", "#8f8069", "#3a3026"),
        "grey": _c("#24211c", "#6c655b", "#948c80", "#b3aca0", "#cdc7bc", "#e6e2da", "#7d766b", "#34302a"),
    }, weights={"pale": 3, "grey": 1}),
    "american-lion": dict(s=1.08, leg=1.1, fore=1.0, tail=1.0, sabre=False, spots=False, head=1.0, coats={
        "tawny": _c("#2b1d10", "#8a6436", "#b58a52", "#cea56d", "#e2c28b", "#efe2c8", "#9a7040", "#3a2616"),
    }, weights={"tawny": 1}),
    # About a metre at the shoulder but as heavy as a big lion.
    "smilodon": dict(s=0.92, leg=0.85, fore=1.35, tail=0.3, sabre=True, spots=True, head=1.1, coats={
        "tawny": _c("#28190d", "#7d5a33", "#a9804c", "#c49c67", "#dab785", "#ecdcc0", "#6e4c28", "#3a2616"),
        "dark": _c("#1f150c", "#634628", "#86633b", "#a47d51", "#bd9a6d", "#ddcbab", "#533920", "#2c1d10"),
    }, weights={"tawny": 3, "dark": 1}),
    # s is the mane and t its dark edge and the tail tuft.
    "lion": dict(ground_tail=True, s=0.92, leg=1.0, fore=1.0, tail=1.0, sabre=False, spots=False, head=1.0, tuft=True,
                 forms={"male": dict(mane="full"), "asiatic": dict(mane="sparse", fold=True, s=0.97),
                        "lioness": dict(s=0.88, head=0.9)},
                 form_weights={"male": 1.0, "asiatic": 1.0, "lioness": 2.5},
                 # West, south, east, north. Barbary and Cape lions wore the
                 # big dark manes; the lions of Asia and Greece the thin ones.
                 where={"male": [dict(years=[-10000, 10000], bounds=[-20, -36, 34, 38]),
                                 dict(years=[-10000, 10000], bounds=[34, -12, 52, 12])],
                        "asiatic": [dict(years=[-10000, 10000], bounds=[19, 34, 30, 46]),
                                    dict(years=[-10000, 10000], bounds=[34, 8, 92, 46])]},
                 coats={
        "tawny": _c("#2b1c0f", "#8f6534", "#bb8b4c", "#d3a865", "#e8cd96", "#f0dfbd", "#a3622b", "#4a2914"),
        "sandy": _c("#2d2214", "#9a7848", "#c6a26a", "#dcbe88", "#ecd9b0", "#f4e8cf", "#b07c42", "#5a3a1e"),
        "dark-maned": _c("#2a1b0e", "#8a6032", "#b8874a", "#d0a462", "#d9b47c", "#efdcb8", "#5c3518", "#24150b"),
    }, weights={"tawny": 4, "sandy": 1, "dark-maned": 1}),
    # s is the stripe; b the white of the ruff, the belly and the eye spots.
    "tiger": dict(ground_tail=True, s=0.94, leg=0.94, fore=1.12, tail=1.0, sabre=False, spots=False, head=1.06, girth=1.06,
                  marks="stripes", ruff=True, rings=(0.5, 0.68, 0.84), coats={
        "orange": _c("#2a1508", "#a24d16", "#d97a2b", "#ec9a47", "#f6c68c", "#f4ece0", "#1f130b", "#26170c"),
        "amur": _c("#2b1a0d", "#a5602d", "#d9904f", "#e9ad70", "#f3d0a6", "#f8f3ea", "#2a1b11", "#302012"),
    }, weights={"orange": 4, "amur": 1}),
    "leopard": dict(ground_tail=True, s=0.72, leg=0.9, fore=0.94, tail=0.95, sabre=False, spots=False, head=0.86, girth=0.9,
                    marks="rosettes", hook=True, coats={
        "golden": _c("#2a1c0e", "#9a6c31", "#cc9b52", "#e0b874", "#eed6a6", "#f3ead6", "#2b1b0e", "#34210f"),
        "pale": _c("#2b2216", "#9c8257", "#c8ad7c", "#dcc69a", "#ebdcbc", "#f5efe2", "#30251a", "#3a2c1d"),
        "black": _c("#0e0b0a", "#241e1b", "#352d29", "#4a403a", "#5e534b", "#3f3631", "#181312", "#1c1614"),
    }, weights={"golden": 12, "pale": 2, "black": 1}),
    "jaguar": dict(ground_tail=True, s=0.8, leg=0.9, fore=1.12, tail=0.62, sabre=False, spots=False, head=1.15, lunge=2.5, girth=1.04,
                   marks="jaguar", rings=(0.6, 0.8), coats={
        "golden": _c("#2b1a0b", "#a2682a", "#d49c4d", "#e5b66d", "#f0d29e", "#f4eadb", "#25160a", "#2f1c0d"),
        "black": _c("#0e0b09", "#251e1a", "#372d27", "#4c4038", "#60534a", "#41362f", "#191311", "#1d1613"),
    }, weights={"golden": 9, "black": 1}),
    # Plain tawny or grey, small-headed, long in the hind leg, and a long heavy
    # tail with a dark tip; white muzzle and a black mark either side of it.
    "cougar": dict(ground_tail=True, s=0.76, leg=0.98, fore=0.92, tail=1.2, sabre=False, spots=False, head=0.78, girth=0.86, coats={
        "tawny": _c("#2a1b0e", "#8f6a42", "#b98f60", "#cfa87a", "#e3c69c", "#f1e6d4", "#3a2a1c", "#2c1d12"),
        "grey": _c("#25211c", "#7a6f62", "#a39888", "#bcb2a2", "#d4ccbe", "#efebe4", "#35302a", "#28241f"),
        "red": _c("#2a170b", "#8a522c", "#b87444", "#cf9160", "#e4b48a", "#f2e4d4", "#3a2416", "#2c1a0e"),
    }, weights={"tawny": 5, "grey": 2, "red": 2}),
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
STATES = {sp: {"idle": 16, "wander": 8, "stalk": 8, "chase": 8, "flee": 8, "pounce": 8, "rest": 16, "warn": 8} for sp in SPECIES}
PALETTES = {sp: next(iter(k["coats"].values())) for sp, k in KINDS.items()}
FORMS = {sp: list(k.get("forms", {sp: {}})) for sp, k in KINDS.items()}

K = KINDS["cave-lion"]

# Rosettes as pixel stamps: s the ring, d the darker ground inside it. The
# leopard's is a small broken ring; the jaguar's is bigger, with a spot.
ROSETTE = [{(-1, 0): "s", (0, -1): "s", (1, 0): "s", (0, 1): "d"},
           {(-1, 0): "s", (0, 1): "s", (1, 0): "s", (0, -1): "d"},
           {(0, -1): "s", (1, 0): "s", (0, 1): "s", (-1, 0): "d"},
           {(-1, -1): "s", (1, -1): "s", (0, 1): "s", (0, 0): "d"}]
JAGUAR = {(0, -1): "s", (1, -1): "s", (-1, 0): "s", (2, 0): "s", (-1, 1): "s", (2, 1): "s", (1, 2): "s",
          (0, 0): "d", (1, 0): "d", (0, 1): "d", (1, 1): "s"}
# Tiger stripes on the flank: where along the back from hip (0) to shoulder
# (1), how far down in model units, and the lean; close pairs are the doubles.
STRIPES = [(-0.2, 5, 0.5), (-0.02, 8, 0.35), (0.04, 4, 0.35), (0.26, 8, 0.15), (0.48, 7, 0.0), (0.54, 4, 0.0),
           (0.72, 6, -0.15), (0.92, 4, -0.3)]
# Rosette sites as (along the back, height above the spine in units of the
# body's radius).
SITES = {"rosettes": [(-0.12, 0.25), (0.14, 0.6), (0.2, -0.3), (0.42, 0.2), (0.66, 0.6), (0.68, -0.3), (0.92, 0.2)],
         "jaguar": [(-0.08, 0.2), (0.22, 0.45), (0.28, -0.35), (0.52, 0.1), (0.78, 0.45), (0.8, -0.35)]}


# ---------------------------------------------------------------- side view
def pose(**k):
    lg = K["leg"]
    top = GM - 21 * lg
    p = dict(hip=(24.0, top + 4), sh=(42.0, top + 3), head=(50.0, top + 1), look=10.0,
             feet=dict(fh=(22.0, GM), nh=(25.0, GM), ff=(41.0, GM), nf=(44.0, GM)),
             tail=[(0, 0), (-5, 3), (-9, 8), (-11, 13)], ears="up", eye="open", mouth=0, breath=0,
             arch=0.0, down=False, reach=None)
    p.update(k)
    return p


def body(c, p):
    hip, sh = p["hip"], p["sh"]
    spine = (sh[0] - hip[0], sh[1] - hip[1])
    n = math.hypot(*spine) or 1
    up = (spine[1] / n, -spine[0] / n)
    mid = add(lerp(hip, sh, 0.5), up, p["arch"])
    b = p["breath"] * 0.3
    fr = K["fore"]
    gi = K.get("girth", 1.0)
    mask = tube([add(hip, (-1.5, 0)), hip, mid, sh], [4.6 * gi, (5.3 + b) * gi, (5.6 + b) * gi, (6.0 * fr + b) * gi])
    if K.get("fold"):  # the loose skin along an Asiatic lion's belly
        mask |= tube([add(lerp(hip, sh, 0.15), up, -4.6), add(lerp(hip, sh, 0.6), up, -5.0)], [1.2, 1.5])
    px = shade(mask, 1, 1)
    for x, y in mask:
        if (x, y + 1) not in mask or (x, y + 2) not in mask:
            if (x, y - 3) in mask:
                px[(x, y)] = "b"
        if K["spots"] and px[(x, y)] in "ml" and (x + 2 * y) % 5 == 0 and noise(x, y) > 0.55:
            px[(x, y)] = "s"
    marks(px, hip, sh, up, 5.6 * gi)
    c.paint(px)
    return mask


def marks(px, hip, sh, up, r):
    """Stripes or rosettes laid on a side-view trunk along its spine, so they
    ride with the body through a stride instead of swimming over it."""
    kind = K.get("marks")
    if not kind:
        return
    spine = (sh[0] - hip[0], sh[1] - hip[1])
    n = math.hypot(*spine) or 1
    if kind == "stripes":
        for u, length, lean in STRIPES:
            top = add(lerp(hip, sh, u), up, r + 1)
            way = add((-up[0], -up[1]), (spine[0] / n, spine[1] / n), lean)
            m = math.hypot(*way)
            run = []
            for i in range(int((r + 1 + length) * 4)):
                q = at(add(top, way, i * 0.25 / m))
                if q in px and q not in run:
                    run.append(q)
            run = run[:max(1, round(length * rig.S["s"]))]
            for j, q in enumerate(run):
                if px[q] in "mld":
                    px[q] = "s"
                    # bold at the back, a single pixel as it tapers down the flank
                    if j < len(run) * 0.4 and px.get((q[0] - 1, q[1])) in ("m", "l", "d"):
                        px[(q[0] - 1, q[1])] = "s"
        return
    stamps = ROSETTE if kind == "rosettes" else [JAGUAR]
    for i, (u, v) in enumerate(SITES[kind]):
        cx, cy = at(add(lerp(hip, sh, u), up, v * r))
        for (dx, dy), role in stamps[i % len(stamps)].items():
            q = (cx + dx, cy + dy)
            if px.get(q) in ("m", "l", "d"):
                px[q] = role


def mane(c, p, hx, hy, fwd, down):
    """The male's mane in side view: round the head and down over the neck
    and chest, pale at the face, dark along its back and lower edge."""
    hs, sh = K["head"], p["sh"]
    full = K["mane"] == "full"
    mc = add(add((hx, hy), fwd, -(2.0 if full else 1.6) * hs), down, -0.6 if full else 0.2)
    m = (disk(*mc, (6.0 if full else 4.4) * hs)
         | tube([mc, add(sh, (2.5, 5.5 if full else 4.0))], [(5.0 if full else 3.4) * hs, 4.0 if full else 2.6])
         | tube([mc, add(sh, (-3.0, -1.0))], [(5.0 if full else 3.4) * hs, 3.6 if full else 2.4]))
    mane_px(c, m, at(mc)[0], full, True)


def mane_px(c, m, cxp, full, side):
    """Pale where the mane meets the sky, dark along its back and lower edge
    and wherever it lies over the body, the full mane's hem in tufts."""
    ground = at((0, GM))[1]
    m = {(x, y) for x, y in m if y <= ground}
    out = {}
    for x, y in m:
        if (x, y - 1) not in m:
            out[(x, y)] = "t" if (x, y - 1) in c.px else "h"
        elif (x - 1, y) not in m or (x + 1, y) not in m and not side or (x, y + 1) not in m \
                or full and (x - 2, y) not in m:
            out[(x, y)] = "t"
        else:
            out[(x, y)] = "s"
        if full and (x, y + 1) not in m and (x - cxp) % 3 == 0 and y < ground:
            out[(x, y + 1)] = "t"
    c.paint(out)


def head(c, p):
    hx, hy = p["head"]
    look = p["look"]
    sh = p["sh"]
    hs = K["head"]
    fwd = rot((1, 0), look)
    down = rot((0, 1), look)
    neck = tube([add(sh, (1, -1)), (hx, hy)], [4.2 * K["fore"], 3.0 * hs])
    c.paint({xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in shade(neck, 1, 1).items()})
    if K.get("mane"):
        mane(c, p, hx, hy, fwd, down)
    skull = disk(hx, hy, 3.7 * hs)
    muzzle = tube([add((hx, hy), fwd, 2 * hs), add(add((hx, hy), fwd, 5.2 * hs), down, 0.8)], [2.9 * hs, 2.3 * hs])
    jaw = tube([add(add((hx, hy), fwd, 0.5), down, 2.3), add(add((hx, hy), fwd, 4.2 * hs), down, 2.4 + p["mouth"] * 2.2)],
               [2.0 * hs, 1.4 * hs])
    hm = skull | muzzle | jaw
    ruff = disk(*add(add((hx, hy), fwd, -1.6 * hs), down, 1.6 * hs), 2.3 * hs) if K.get("ruff") else set()
    hm |= ruff
    hp = shade(hm, 1, 1)
    hxp, hyp = T((hx, hy))
    for x, y in hm:
        v = (x - hxp, y - hyp)
        if v[0] * down[0] + v[1] * down[1] > 1.3 * rig.S["s"] and v[0] * fwd[0] + v[1] * fwd[1] > 0.5:
            hp[(x, y)] = "b"
        elif (x, y) in ruff and (x, y) not in skull and hp[(x, y)] != "l":
            hp[(x, y)] = "b"
    face_marks(hp, (hx, hy), fwd, down)
    c.paint(hp)
    nose = at(add(add((hx, hy), fwd, 6.0 * hs), down, 0.1))
    c.px[nose] = "k"
    if p["mouth"]:
        c.px[at(add(add((hx, hy), fwd, 3.2 * hs), down, 2.3))] = "p"
        c.px[at(add(add((hx, hy), fwd, 2.6 * hs), down, 2.3))] = "p"
    if p["mouth"] > 1 and not K["sabre"]:  # the snarl: fangs top and bottom
        c.px[at(add(add((hx, hy), fwd, 4.6 * hs), down, 1.9))] = "i"
        c.px[at(add(add((hx, hy), fwd, 4.0 * hs), down, 2.4 + p["mouth"] * 2.2 - 1.2))] = "i"
        c.px[at(add(add((hx, hy), fwd, 3.6 * hs), down, 2.4 + p["mouth"] * 1.1))] = "p"
    if K["sabre"]:  # hanging below the chin even with the mouth shut
        root = add(add((hx, hy), fwd, 4.3 * hs), down, 2.2)
        for i in range(4 + round(2 * p["mouth"])):
            q = at(add(root, rot((-0.25, 1), look), i * 0.9))
            c.px[q] = "i"
    ex, ey = at(add(add((hx, hy), fwd, 2.4 * hs), down, -0.8))
    c.px[(ex, ey)] = "e" if p["eye"] == "open" else "d"
    c.px[(ex + 1, ey)] = "k" if p["eye"] == "open" else "d"
    if K.get("ruff"):  # the white spot over the eye
        c.px[(ex, ey - 1)] = "b"
    # small round ears, flattened in the charge
    lay = {"up": 0, "back": 1, "flat": 2}[p["ears"]]
    for off in ((-1.6, -2.4), (-0.4, -2.9)) if K.get("mane") != "full" else ():
        b = add((hx, hy), rot((off[0] * hs, off[1] * hs), look))
        e = disk(b[0] - lay * 0.8, b[1] - 0.8 + lay * 0.9, 1.3 * hs, 1.0 - lay * 0.25)
        rimmed(c, e, lambda x, y: "d" if (x, y - 1) not in e else "m")


def face_marks(hp, h, fwd, down):
    """Stripes over the brow and back across the cheek; spots on a leopard's
    or jaguar's crown."""
    kind, hs = K.get("marks"), K["head"]
    if not kind:
        return
    if kind == "stripes":
        pts = [((-0.6, -2.6), (0.6, -2.4)), ((-2.2, -1.6), (-0.9, -2.0)), ((-0.4, 0.6), (-2.6, 1.4))]
    else:
        pts = [((-0.8, -2.4), None), ((0.8, -2.6), None), ((-2.2, 0.4), None)]
    for a, b in pts:
        for q in ([a] if b is None else [lerp(a, b, u / 4) for u in range(5)]):
            xy = at(add(add(h, fwd, q[0] * hs), down, q[1] * hs))
            if hp.get(xy) in ("m", "l", "d"):
                hp[xy] = "s"


def legs(c, p, near):
    """Hind: thigh, knee forward, hock back, the long foot to the paw. Fore:
    straight from the elbow, the paw folding back as it lifts; reaching out
    in the spring."""
    hip, sh = p["hip"], p["sh"]
    lg, fr = K["leg"], K["fore"]
    for key in (("nh", "nf") if near else ("fh", "ff")):
        hind = key.endswith("h")
        fx, fy = p["feet"][key]
        up = max(0.0, GM - fy)
        if hind:
            root = add(hip, (0.5, 1.5))
            knee = add(root, (3 + up * 0.2, 6 * lg))
            hock = (fx - 3 - up * 0.3, fy - 6 * lg + up * 0.2)
            m = tube([root, knee, hock, (fx, fy - 0.8)], [4.0, 2.4, 1.5, 1.4])
        else:
            root = add(sh, (0.5, 2))
            elbow = add(root, (-0.5 + (p["reach"] or 0) * 0.3, 7 * lg))
            wrist = (fx + (up * 0.4 if not p["reach"] else 0), fy - 2.5)
            m = tube([root, elbow, wrist, (fx + 0.5, fy - 0.8)], [3.8 * fr, 2.6 * fr, 1.9 * fr, 1.7 * fr])
        if near:
            tp = shade(m, 1, 1)
            tp = {xy: ("m" if xy in c.px and r in "lh" else r) for xy, r in tp.items()}
            if K.get("marks"):
                (thigh_marks if hind else arm_marks)(tp, root, knee if hind else elbow)
        else:
            tp = {xy: "d" for xy in m}
        c.paint(tp)
        paw = at((fx + (0.5 if not hind else 0), fy))
        c.px[paw] = "k" if near else "d"


def thigh_marks(tp, root, knee):
    kind = K["marks"]
    if kind == "stripes":  # two bars curving round the haunch
        for u, w in ((0.25, 1.4), (0.6, 1.0)):
            mid = lerp(root, knee, u)
            for q in (add(mid, (-w, -0.6)), add(mid, (0, 0)), add(mid, (w, 0.5))):
                xy = at(q)
                if tp.get(xy) in ("m", "l", "d"):
                    tp[xy] = "s"
    else:
        for u, dx in ((0.3, -0.8), (0.65, 0.8)):
            cx, cy = at(add(lerp(root, knee, u), (dx, 0)))
            stamp = JAGUAR if kind == "jaguar" and u < 0.5 else ROSETTE[0] if kind == "rosettes" else {(0, 0): "s"}
            for (dx2, dy2), role in stamp.items():
                if tp.get((cx + dx2, cy + dy2)) in ("m", "l", "d"):
                    tp[(cx + dx2, cy + dy2)] = role


def arm_marks(tp, root, elbow):
    """A bar or two across the near foreleg, or a few small spots."""
    for u in (0.35, 0.75):
        x, y = at(lerp(root, elbow, u))
        for q in ((x - 1, y), (x, y)) if K["marks"] == "stripes" else ((x + (1 if u > 0.5 else 0), y),):
            if tp.get(q) in ("m", "l", "d"):
                tp[q] = "s"


def along(pts, u):
    """The point a fraction u of the way along a polyline, and its heading."""
    segs = [(a, b, math.hypot(b[0] - a[0], b[1] - a[1])) for a, b in zip(pts, pts[1:])]
    left = u * sum(s[2] for s in segs)
    for a, b, n in segs:
        if left <= n or (a, b, n) == segs[-1]:
            v = min(1.0, left / n) if n else 0
            return lerp(a, b, v), ((b[0] - a[0]) / (n or 1), (b[1] - a[1]) / (n or 1))
        left -= n


def ringed(m, pts, rings):
    """Dark bands round a tail, a pixel wide across it."""
    out = {}
    for u in rings:
        c, d = along(pts, u)
        cx, cy = T(c)
        for x, y in m:
            if abs((x - cx) * d[0] + (y - cy) * d[1]) < 0.6:
                out[(x, y)] = "s"
    return out


def tail(c, p):
    base = add(p["hip"], (-4.5, -1.5))
    k = K["tail"]
    pts = [add(base, (v[0] * k, v[1] * max(k, 0.5))) for v in p["tail"]]
    if k < 0.5:
        pts = pts[:2]
    if K.get("hook"):  # a leopard carries the end of its long tail curled up
        d = along(pts, 1)[1]
        pts.append(add(pts[-1], (d[0] * 0.6, -2.4)))
    m = tube(pts, [1.3, 1.1, 0.9, 0.8, 0.8][: len(pts)])
    c.paint({xy: "m" for xy in m})
    c.paint(ringed(m, pts, K.get("rings", ())))
    end = at(pts[-1])
    if K.get("hook"):
        hook = tube(pts[-2:], [0.8, 0.8])
        c.paint({(x, y): "b" for x, y in hook if (x, y + 1) not in m})
        c.paint({at(along(pts, u)[0]): "s" for u in (0.3, 0.55)})
        return
    c.px[end] = "t"
    if k >= 0.5:
        c.px[(end[0], end[1] + 1)] = "t"
    if K.get("tuft"):
        c.paint({xy: "t" for xy in disk(*pts[-1], 1.3)})


def lying(c, p, frame):
    """Flat on its side after a meal, as lions lie: legs out, the belly
    rising, the tail tip twitching."""
    g = GM
    breath = p["breath"]
    m = tube([(18, g - 3.5), (28, g - 4.5 - breath * 0.4), (38, g - 4.2)], [3.6, 4.4 + breath * 0.3, 4.0])
    px = shade(m, 1, 1)
    for x, y in m:
        if (x, y + 1) not in m:
            px[(x, y)] = "b"
        if K["spots"] and px[(x, y)] in "ml" and noise(x * 7 + y, 3) > 0.83:
            px[(x, y)] = "s"
    marks(px, (19.0, g - 3.5), (37.0, g - 4.2), (0.0, -1.0), 4.4)
    c.paint(px)
    for a, b in (((36, g - 2), (44, g - 1)), ((34, g - 2), (41, g - 0.5)), ((20, g - 2), (13, g - 0.5))):
        c.paint({xy: "d" for xy in tube([a, b], [1.5 * K["fore"], 1.2])})
    k = K["tail"]
    tw = 1 if frame in (5, 6, 12) else 0
    tp = [(16, g - 3), (12, g - 2), (8 * k + 8 * (1 - k), g - 1.5 - tw)]
    tm = tube(tp[: 2 if k < 0.5 else 3], [1.2, 1.0, 0.8])
    c.paint({xy: "m" for xy in tm})
    c.paint(ringed(tm, tp, K.get("rings", ())))
    if K.get("tuft"):
        c.paint({xy: "t" for xy in disk(*tp[-1], 1.2)})
    if K.get("hook"):
        c.paint({xy: "b" for xy in tube([tp[-1], add(tp[-1], (-1.5, -1.5))], [0.8, 0.7])})
    hx, hy = 43.0, g - 5.0
    lift = 1.5 if 9 <= frame <= 11 else 0
    hp = pose(head=(hx, hy - lift), look=15 if not lift else -5, eye="open" if lift else "closed",
              ears="up", sh=(39.0, g - 5.0), mouth=1 if frame == 10 else 0)
    head(c, hp)


def side(p, frame=0):
    c = Canvas()
    if p["down"]:
        lying(c, p, frame)
        return c.finish()
    legs(c, p, False)
    tail(c, p)
    body(c, p)
    legs(c, p, True)
    head(c, p)
    return c.finish()


# ------------------------------------------------------------------ gaits
def walk(frame):
    """Head low and swinging, shoulder blades rolling over the back."""
    t = frame / 8
    feet = {}
    for key, x in dict(fh=22.0, nh=25.0, ff=41.0, nf=44.0).items():
        dx, up = walk_foot(t + WALK[key], 3.0, 2.6, 0.6)
        feet[key] = (x + dx, GM - up)
    lg = K["leg"]
    top = GM - 21 * lg
    roll = math.sin(4 * math.pi * t) * 0.5
    sw = math.sin(2 * math.pi * t)
    return pose(feet=feet, sh=(42.0, top + 3 - roll), hip=(24.0, top + 4 + roll), head=(50.0, top + 3.5), look=18,
                tail=[(0, 0), (-5, 3), (-9, 7 + sw), (-11, 11 + sw * 1.5)])


def stalk(frame):
    """Belly to the grass, shoulders up, head level and dead still, one paw
    set down at a time; the tail tip alone moves."""
    seq = [("nh", 0.0), ("nh", 1.0), ("fh", 0.0), ("ff", 1.0), ("nf", 0.4), ("nf", 1.0), ("nf", 1.6), ("fh", 1.0)]
    base = dict(fh=(21.0, GM), nh=(24.0, GM), ff=(42.0, GM), nf=(45.0, GM))
    feet = dict(base)
    key, u = seq[frame]
    if u < 2:
        lift = math.sin(math.pi * min(u, 1)) * (2.4 if key == "nf" else 1.2)
        if key == "nf" and 0.3 < u < 1.7:
            lift = 2.4
        feet[key] = (base[key][0] + (u - 1) * 0.6, GM - lift)
    lg = K["leg"]
    top = GM - 21 * lg
    creep = [0, 0.3, 0.5, 0.7, 0.8, 0.8, 0.8, 1.0][frame] * 0.6
    twitch = [0, 0, 1, 0, 0, -1, 0, 0][frame]
    return pose(feet=feet, hip=(24 + creep, top + 9), sh=(42 + creep, top + 7), head=(50 + creep, top + 7), look=0,
                ears="up", tail=[(0, 0), (-5, 2), (-10, 3), (-13, 2 - twitch)])


def gallop(frame, ears="back"):
    """Bunch and stretch: a cat's spine does half the running."""
    t = frame / 8
    stretch = math.cos(2 * math.pi * (t - 0.1))
    lg = K["leg"]
    top = GM - 21 * lg
    hip = (24 - stretch * 2.5, top + 5 - 1.5 * max(0.0, stretch))
    sh = (42 + stretch * 2.2, top + 4 - 1.5 * max(0.0, stretch))
    feet = {}
    for key in ("fh", "nh", "ff", "nf"):
        dx, up = walk_foot(t + GALLOP[key], 6.5, 5.5, 0.3)
        hind = key.endswith("h")
        feet[key] = ((hip[0] - 1 if hind else sh[0] + 1) + dx + (1.5 if key[0] == "n" else 0), GM - up)
    return pose(hip=hip, sh=sh, head=add(sh, (8, -1)), look=5, feet=feet, ears=ears, arch=-stretch * 1.2 + 0.4,
                tail=[(0, 0), (-5, -1), (-10, 0), (-14, 2)])


def pounce(frame):
    """Down on the haunches, the spring, forelegs reaching, and down on it.
    The lion lands and bites; Smilodon lands clinging, forelegs round it."""
    lg = K["leg"]
    top = GM - 21 * lg
    g = GM
    keys = [
        dict(hip=(23, top + 9), sh=(41, top + 7), head=(49, top + 7), look=0, ears="up"),
        dict(hip=(22, top + 11), sh=(40, top + 8), head=(48, top + 8), look=5, ears="up",
             feet=dict(fh=(23, g), nh=(26, g), ff=(41, g), nf=(44, g))),
        dict(hip=(25, top + 3), sh=(43, top - 2), head=(51, top - 4), look=-15, ears="back", mouth=1, reach=3,
             feet=dict(fh=(18, g), nh=(20, g - 1), ff=(50, top + 8), nf=(52, top + 7))),
        dict(hip=(30, top - 1), sh=(48, top - 3), head=(56, top - 3), look=0, ears="back", mouth=1, reach=5,
             feet=dict(fh=(22, top + 12), nh=(24, top + 11), ff=(57, top + 6), nf=(59, top + 5))),
        dict(hip=(34, top + 1), sh=(51, top + 3), head=(58, top + 5), look=25, ears="back", mouth=1, reach=5,
             feet=dict(fh=(28, top + 14), nh=(30, top + 13), ff=(58, g - 3), nf=(60, g - 4))),
    ]
    clinging = K["sabre"]
    land = dict(hip=(34, top + 4), sh=(50, top + 6), head=(57, top + 7 + (2 if clinging else 0)), look=40 if clinging else 30,
                ears="flat", mouth=1, reach=4 if clinging else 2,
                feet=dict(fh=(31, g), nh=(34, g), ff=(56, g - (3 if clinging else 0)), nf=(58, g - (4 if clinging else 0))))
    k = keys[frame] if frame < len(keys) else land
    back = K.get("lunge", 0)  # a shorter spring, so a big head stays on its canvas
    if back:
        k = {**k, **{n: (k[n][0] - back, k[n][1]) for n in ("hip", "sh", "head")}}
        if "feet" in k:
            k["feet"] = {f: (x - back, y) for f, (x, y) in k["feet"].items()}
    return pose(tail=[(0, 0), (-5, -1), (-9, -2), (-13, -1)], **k)


def idle(frame):
    """Standing, looking out over the grass; an ear, the tail, and once a
    long yawn that shows the teeth."""
    t = frame / 16
    look = smooth([(0, 10.0), (0.3, 10.0), (0.4, 0.0), (0.55, 0.0), (0.65, 10.0)], t)
    yawn = 8 <= frame <= 11
    sw = [0, 0, 1, 2, 2, 1, 0, 0, 0, 0, 0, -1, -2, -1, 0, 0][frame]
    p = pose(look=-20 if yawn else look, mouth=1 if yawn else 0, eye="closed" if yawn or frame == 14 else "open",
             ears="back" if frame in (3, 4) else "up", breath=1 if frame % 8 in (2, 3, 4) else 0,
             tail=[(0, 0), (-5, 3), (-9, 8), (-11 + sw * 0.4, 13 - abs(sw) * 0.5)])
    if yawn:
        p["head"] = add(p["head"], (0.5, -1))
    return p


def warn(frame):
    """Crouched and backing, ears flat, the mouth wide in a snarl, and the
    long tail lashing from side to side along the grass."""
    lg = K["leg"]
    top = GM - 21 * lg
    lash = math.sin(2 * math.pi * frame / 8)
    hiss = [0.6, 1.2, 1.6, 1.6, 1.6, 1.2, 0.8, 0.6][frame]
    swat = frame in (3, 4)
    g = GM
    p = pose(hip=(23.5, top + 7), sh=(41, top + 8.5), head=(48.5, top + 7.5 - hiss * 0.5), look=-8 - hiss * 4, ears="flat",
             mouth=hiss, breath=1 if frame in (2, 3) else 0,
             feet=dict(fh=(21.5, g), nh=(24.5, g), ff=(42.5, g), nf=(45.5, g - (3.5 if swat else 0))), reach=2 if swat else None,
             tail=[(0, 0), (-5, 1 + lash), (-10, 1 - lash * 2.5), (-14, 3 + lash * 3)])
    return p


def rest(frame):
    return pose(down=True, breath=1 if frame % 8 in (2, 3, 4, 5) else 0)


# ------------------------------------------------------------ front and back
def face(state, frame, south):
    c = Canvas()
    cx = WM / 2
    g = GM
    lg, fr, hs = K["leg"], K["fore"], K["head"]
    top = g - 21 * lg
    n = 16 if state in ("idle", "rest") else 8
    t = frame / n
    lifts, y0, low, mouth, ears, eye, leap = {}, 0.0, 0.0, 0, "up", True, 0.0
    if state in ("wander", "chase", "flee"):
        fast = state != "wander"
        phases, amp, lift, stance = (GALLOP, 6.5, 5.5, 0.3) if fast else (WALK, 3.0, 2.6, 0.6)
        for key in ("fh", "nh", "ff", "nf"):
            lifts[key] = walk_foot(t + phases[key], amp, lift, stance)[1]
        y0 = -abs(math.sin(2 * math.pi * t)) * (2.5 if fast else 0.5)
        ears = "back" if fast else "up"
        low = 0 if fast else 1.5
    elif state == "stalk":
        low = 6
        lifts = {"nf": 2.2 if frame in (4, 5, 6) else 0}
    elif state == "pounce":
        low = [6, 8, 0, 0, 0, 3, 3, 3][frame]
        leap = [0, 0, -5, -8, -3, 0, 0, 0][frame]
        mouth = 1 if frame >= 2 else 0
        ears = "back" if frame >= 2 else "up"
        if 2 <= frame <= 4:
            lifts = dict(ff=6, nf=6, fh=2, nh=2)
    elif state == "warn":
        low, mouth, ears = 4.5, 1, "flat"
        lifts = {"nf": 2.5 if frame in (3, 4) else 0}
    elif state == "idle":
        mouth = 1 if 8 <= frame <= 11 else 0
        eye = not (8 <= frame <= 11 or frame == 14)
    elif state == "rest":
        return face_rest(c, frame, south)
    y0 += leap

    def leg(x, key, ytop, dark, w):
        up = lifts.get(key, 0)
        bottom = g - up + (leap if leap < 0 else 0)
        m = tube([(x, ytop), (x, bottom - 1)], [w, w * 0.8])
        c.paint({xy: "d" for xy in m} if dark else shade(m, 1, 1))
        px, py = at((x, bottom))
        c.px[(px, py)] = "k"

    def ears_at(hx, hy):
        lay = {"up": 0, "back": 1, "flat": 2}[ears]
        for sgn in (-1, 1) if K.get("mane") != "full" else ():
            e = disk(hx + sgn * (2.6 + lay * 0.6) * hs, hy - 2.6 * hs + lay * 0.8, 1.3 * hs, 1 - lay * 0.25)
            rimmed(c, e, lambda x, y: "d" if (x, y - 1) not in e else "m")

    if south:
        for x, key in ((cx - 3.5, "fh"), (cx + 3.5, "nh")):
            leg(x, key, top + 6 + y0 + low, True, 1.6)
        bm = disk(cx, top + 4 + y0 + low, 5.5 * fr, 1.3)
        bp = shade(bm, 1, 1)
        for x, y in bm:
            if K["spots"] and bp[(x, y)] in "ml" and noise(x * 7 + y, 3) > 0.83:
                bp[(x, y)] = "s"
        front_marks(bp, cx, top + 4 + y0 + low, 5.5 * fr, 1.3, True)
        c.paint(bp)
        for x, key in ((cx - 3, "ff"), (cx + 3, "nf")):
            leg(x, key, top + 8 + y0 + low, False, 1.9 * fr)
        hy = top + 4 + y0 + low * 1.1
        if K.get("mane"):
            front_mane(c, cx, hy, True)
        ears_at(cx, hy)
        hm = disk(cx, hy, 3.3 * hs) | disk(cx, hy + 2.2 * hs, 2.4 * hs)
        ruff = disk(cx - 2.6 * hs, hy + 1.2 * hs, 1.7 * hs) | disk(cx + 2.6 * hs, hy + 1.2 * hs, 1.7 * hs) if K.get("ruff") else set()
        hm |= ruff
        hp = shade(hm, 1, 1)
        for x, y in hm:
            if y >= T((0, hy + 2.2 * hs))[1] or ((x, y) in ruff and hp[(x, y)] != "l"):
                hp[(x, y)] = "b"
        brow_marks(hp, cx, hy)
        c.paint(hp)
        for sgn in (-1, 1):
            c.px[at((cx + sgn * 1.6 * hs, hy - 0.2))] = "e" if eye else "d"
            if K.get("ruff"):
                c.px[at((cx + sgn * 1.6 * hs, hy - 1.2))] = "b"
        nose = at((cx, hy + 1.8 * hs))
        c.px[nose] = "k"
        if mouth:
            c.px[(nose[0], nose[1] + 2)] = "p"
        if state == "warn":
            c.px.update({(nose[0], nose[1] + 3): "p", (nose[0] - 1, nose[1] + 2): "i", (nose[0] + 1, nose[1] + 2): "i",
                         (nose[0] - 1, nose[1] + 1): "o", (nose[0] + 1, nose[1] + 1): "o"})
        if K["sabre"]:
            for sgn in (-1, 1):
                for i in range(2 + mouth):
                    c.px[(nose[0] + sgn, nose[1] + 2 + i)] = "i"
        return c.finish()

    # north: the head beyond, the back, the rump and tail nearest
    hy = top + 1 + y0 + low
    if K.get("mane"):
        front_mane(c, cx, hy, False)
    ears_at(cx, hy)
    if not K.get("mane"):
        hp = shade(disk(cx, hy, 3.1 * hs), 1, 1)
        brow_marks(hp, cx, hy)
        c.paint(hp)
    for x, key in ((cx - 3, "ff"), (cx + 3, "nf")):
        leg(x, key, top + 6 + y0 + low, True, 1.7 * fr)
    gi = K.get("girth", 1.0)
    bm = disk(cx, top + 6 + y0 + low, 5.2 * gi, 1.3)
    bp = shade(bm, 1, 1)
    for x, y in bm:
        if K["spots"] and bp[(x, y)] in "ml" and noise(x * 7 + y, 3) > 0.83:
            bp[(x, y)] = "s"
    front_marks(bp, cx, top + 6 + y0 + low, 5.2 * gi, 1.3, False)
    c.paint(bp)
    for x, key in ((cx - 3.5, "fh"), (cx + 3.5, "nh")):
        leg(x, key, top + 9 + y0 + low, False, 1.8)
    tl = K["tail"]
    sw = math.sin(2 * math.pi * t) * (1.5 if state != "stalk" else 0.3) * (2.5 if state == "warn" else 1)
    tp = [(cx, top + 8 + y0 + low), (cx + sw * 0.5, top + 8 + 6 * tl + y0 + low), (cx + sw, top + 8 + 12 * tl + y0 + low)]
    if K.get("ground_tail") and tp[-1][1] > g:  # the rest of it lies along the grass
        tp = [tp[0], (tp[1][0], min(tp[1][1], g)), (cx + sw + 3.5, g)]
    tm = tube(tp if tl >= 0.5 else tp[:2], [1.2, 1.0, 0.8])
    c.paint({xy: "m" for xy in tm})
    c.paint(ringed(tm, tp, K.get("rings", ())))
    c.px[at(tp[-1] if tl >= 0.5 else tp[1])] = "t"
    if K.get("tuft"):
        c.paint({xy: "t" for xy in disk(*tp[-1], 1.2)})
    if K.get("hook"):
        c.paint({xy: "s" for xy in disk(*along(tp, 0.45)[0], 0.5)})
        c.paint({xy: "b" for xy in tube([tp[-1], add(tp[-1], (sw * 0.6, -1.6 if tp[-1][1] >= g else 1.6))], [0.9, 0.8])})
    return c.finish()


def front_marks(bp, cx, cy, r, sy, south):
    """The pattern on the body seen end on: a tiger's white chest and the
    stripes down its sides or over its back; rosettes scattered."""
    kind = K.get("marks")
    if not kind:
        return
    if kind == "stripes":
        if south:
            for x, y in bp:
                if abs(x - T((cx, 0))[0]) <= r * rig.S["s"] * 0.35 and y > T((0, cy - r * 0.3))[1] and bp[(x, y)] != "l":
                    bp[(x, y)] = "b"
            lines = [((sgn * 0.62, -0.7), (sgn * 0.5, 0.1)) for sgn in (-1, 1)] + \
                    [((sgn * 0.92, -0.4), (sgn * 0.8, 0.5)) for sgn in (-1, 1)]
        else:
            lines = [((sgn * 0.12, ny), (sgn * 0.8, ny + 0.3)) for sgn in (-1, 1) for ny in (-0.75, -0.25, 0.25)]
        for a, b in lines:
            for i in range(9):
                u = i / 8
                xy = at((cx + lerp(a[0], b[0], u) * r, cy + lerp(a[1], b[1], u) * r * sy))
                if bp.get(xy) in ("m", "l", "d"):
                    bp[xy] = "s"
        return
    sites = {"rosettes": [(-0.55, -0.45), (0.5, -0.5), (-0.7, 0.2), (0.62, 0.15), (-0.25, 0.6), (0.3, 0.65), (0.0, -0.05)],
             "jaguar": [(-0.5, -0.35), (0.45, -0.05), (-0.45, 0.45)]}[kind]
    stamps = ROSETTE if kind == "rosettes" else [JAGUAR]
    for i, (nx, ny) in enumerate(sites):
        px, py = at((cx + nx * r, cy + ny * r * sy))
        for (dx, dy), role in stamps[i % len(stamps)].items():
            if bp.get((px + dx, py + dy)) in ("m", "l", "d"):
                bp[(px + dx, py + dy)] = role


def brow_marks(hp, cx, hy):
    kind, hs = K.get("marks"), K["head"]
    if kind == "stripes":
        pts = [(0, -2.6), (0, -2.0), (-1.0, -2.3), (1.0, -2.3), (-2.4, -0.6), (2.4, -0.6), (-2.7, 0.2), (2.7, 0.2)]
    elif kind:
        pts = [(-0.8, -2.2), (0.9, -2.5), (-2.2, -0.9), (2.1, -0.7)]
    else:
        return
    for dx, dy in pts:
        xy = at((cx + dx * hs, hy + dy * hs))
        if hp.get(xy) in ("m", "l", "d", "b"):
            hp[xy] = "s"


def front_mane(c, cx, hy, south):
    hs = K["head"]
    full = K["mane"] == "full"
    m = disk(cx, hy - (0.8 if full else 0.0) * hs, (6.4 if full else 4.6) * hs)
    if south:
        m |= tube([(cx, hy + 2), (cx, hy + (7.0 if full else 5.5))], [4.2 if full else 3.0, 3.6 if full else 2.4])
    mane_px(c, m, round(T((cx, 0))[0]), full and south, False)


def face_rest(c, frame, south):
    g, cx = GM, WM / 2
    breath = 0.4 if frame % 8 in (2, 3, 4, 5) else 0
    m = disk(cx, g - 4 - breath, 7.5, 0.6)
    bp = shade(m, 1, 1)
    front_marks(bp, cx - 1.5, g - 4.5 - breath, 6.0, 0.6, False)
    c.paint(bp)
    hs = K["head"]
    lift = 1.5 if 9 <= frame <= 11 else 0
    if south:
        hy = g - 6 - lift
        if K.get("mane"):
            front_mane(c, cx + 3, hy, False)
        for sgn in (-1, 1) if K.get("mane") != "full" else ():
            e = disk(cx + 3 + sgn * 2.6 * hs, hy - 2.6 * hs, 1.3 * hs)
            rimmed(c, e, lambda x, y: "d")
        hm = disk(cx + 3, hy, 3.2 * hs)
        ruff = disk(cx + 3 - 2.5 * hs, hy + 1.2 * hs, 1.6 * hs) | disk(cx + 3 + 2.5 * hs, hy + 1.2 * hs, 1.6 * hs) if K.get("ruff") else set()
        hp = shade(hm | ruff, 1, 1)
        for xy in ruff:
            if hp[xy] != "l":
                hp[xy] = "b"
        brow_marks(hp, cx + 3, hy)
        c.paint(hp)
        for sgn in (-1, 1):
            c.px[at((cx + 3 + sgn * 1.6 * hs, hy))] = "e" if lift else "d"
        c.px[at((cx + 3, hy + 1.8 * hs))] = "k"
    else:
        tp = [(cx - 6, g - 3), (cx - 9, g - 1.5)]
        tm = tube(tp, [1.2, 0.9])
        c.paint({xy: "m" for xy in tm})
        c.paint(ringed(tm, tp, K.get("rings", ())))
        if K.get("tuft"):
            c.paint({xy: "t" for xy in disk(*tp[-1], 1.1)})
        if K.get("hook"):
            c.paint({xy: "b" for xy in disk(*tp[-1], 0.9)})
    return c.finish()


# ------------------------------------------------------------------- build
SIDE = {"idle": idle, "wander": walk, "stalk": stalk, "chase": lambda f: gallop(f, "flat"),
        "flee": gallop, "pounce": pounce, "rest": rest, "warn": warn}
DIRECTIONS = ("south", "east", "north", "west")


def draw(species, state, facing, frame, form=None):
    global K
    K = KINDS[species]
    if "forms" in K:
        f = K["forms"][form or FORMS[species][0]]
        K = {**K, **f, "s": K["s"] * f.get("s", 1.0)}
    rig.use(K["s"], GM, WM, HM, PALETTES[species])
    # a smaller form keeps the species' canvas, so its frames pack alike
    rig.S.update(W=dims(species)[0], G=dims(species)[1], HR=dims(species)[2])
    if facing in ("east", "west"):
        im = side(SIDE[state](frame), frame)
        return _mirror(im) if facing == "west" else im
    return face(state, frame, facing == "south")


def fauna_felid():
    return {
        f"faunaf-{sp if i == 0 else f'{sp}.{form}'}-{state}-{facing}-{frame}": draw(sp, state, facing, frame, form)
        for sp in SPECIES
        for i, form in enumerate(FORMS[sp])
        for state, count in STATES[sp].items()
        for facing in DIRECTIONS
        for frame in range(count)
    }


def looks():
    return {sp: {
        "roles": PALETTES[sp],
        "forms": [{"id": f, "weight": k.get("form_weights", {}).get(f, 1.0), "where": k.get("where", {}).get(f),
                   "coats": k["weights"]} for f in FORMS[sp]],
        "coats": k["coats"],
        "coatFrom": {},
    } for sp, k in KINDS.items()}
