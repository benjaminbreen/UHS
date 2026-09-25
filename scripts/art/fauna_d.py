"""Fauna D: cattle, dog, donkey, camel and cat, built into set C's atlas.

Same style as set B -- masses at native size, light from above, one outline
round the silhouette, binary alpha -- on a better skeleton: legs are two bones
solved from hip to hoof, so a lifted foot folds the knee or hock the way the
joint goes, and the forehand and quarters ride separately so a gallop rocks.

A species has forms and coats. A form is a different drawing (a zebu's hump, a
hound's drop ears) and is baked as its own frames. A coat is only a palette:
every frame is drawn in the first coat, one colour per role, and the renderer
swaps colours. Pied markings are drawn in their own roles, which a solid coat
maps back onto the body colours.
"""
import math
from art.fauna_b import (
    RAKE,
    throw_earth,
    Canvas as _BCanvas,
    _mask_from,
    rect,
    line,
    shade,
    flat,
    walk_foot,
)

# Set B's masks start at the canvas corner, which crops an ear tip or a horn
# drawn up into the headroom. These have a margin all round.
_PAD = 16


def _padded(draw_fn):
    return {(x - _PAD, y - _PAD) for x, y in _mask_from(draw_fn, 112, 112)}


def ellipse(box):
    x0, y0, x1, y1 = (v + _PAD for v in box)
    return _padded(lambda d: d.ellipse((x0, y0, x1, y1), fill=255))


def polygon(points):
    return _padded(lambda d: d.polygon([(x + _PAD, y + _PAD) for x, y in points], fill=255))


# o outline · d m l h body dark to highlight · r p q the same three for pied
# markings and lower legs · b pale muzzle and belly · e eye · a horn · k hoof
# and nose · t mane, stripe and tail tuft · u bare pink skin
ROLES = "odmlhrpqbeaktu"


def _coat(**k):
    assert set(k) == set(ROLES), set(ROLES) ^ set(k)
    return {r: k[r] for r in ROLES}


def _cat(o, d, m, l, h, b, stripe, e, white=False):
    """A cat's coat: stripes in their own role, white patches or none."""
    wr, wp, wq = ("#b3aea4", "#e6e1d6", "#fbf8f0") if white else (d, m, l)
    return _coat(o=o, d=d, m=m, l=l, h=h, r=wr, p=wp, q=wq, b=b, e=e, a=stripe, k="#2c1d19", t=stripe if stripe != m else o, u="#d98a84")


def _solid(o, d, m, l, h, b, e="#15100b", a="#e6dcc0", k="#1b1511", t=None, u="#d79a8f"):
    """A coat without markings: the pied roles fall back on the body's."""
    return _coat(o=o, d=d, m=m, l=l, h=h, r=d, p=m, q=l, b=b, e=e, a=a, k=k, t=t or o, u=u)


COATS = {
    "cattle": {
        # first is the one the atlas is drawn in: every role a different colour
        "red-pied": _coat(o="#4a2415", d="#7a3d22", m="#a4572f", l="#c77a45", h="#e3a468", r="#b9ad98", p="#ebe3d0", q="#fffaf0", b="#e9c9b0", e="#170e09", a="#e8dfc4", k="#2a1a12", t="#f4eee0", u="#e2a39b"),
        "black-pied": _coat(o="#0f0e10", d="#1e1d21", m="#34323a", l="#4e4b55", h="#6d6a75", r="#b4b0a8", p="#e8e4da", q="#ffffff", b="#d9c3b6", e="#060506", a="#e8dfc4", k="#0b0a0b", t="#f1ede4", u="#e0a59e"),
        "red": _solid("#4a2415", "#7a3d22", "#a4572f", "#c77a45", "#e3a468", "#e1b08c", t="#6d3319"),
        "black": _solid("#0c0b0d", "#1b1a1e", "#2f2d34", "#47444d", "#66626c", "#8c8378", a="#d9d0b4", t="#0c0b0d"),
        "dun": _solid("#5a4528", "#8c6f43", "#b8965f", "#d6b782", "#efd9ac", "#f3e6c8", t="#4b3820"),
        "brown": _solid("#2a1a10", "#46301e", "#654630", "#866045", "#a77f5e", "#c9a988", t="#22150c"),
        "white": _solid("#6d675c", "#b3ac9d", "#ddd7c8", "#f1ece0", "#ffffff", "#e4cfc4", a="#d2c6a4", k="#3a332b", t="#55504a"),
        "grey": _solid("#3d3c3e", "#77767a", "#a3a2a5", "#c6c5c7", "#e6e5e4", "#d9d2cc", a="#cfc6aa", k="#1a191b", t="#2a292b"),
    },
    # r p q are the pale stockings and the chevron on the throat; k is also
    # the wet mud of the wallow.
    "water-buffalo": {
        "slate": _coat(o="#141417", d="#26262b", m="#3a3a41", l="#505058", h="#6b6b74", r="#6f6c68", p="#9a958d", q="#bdb8ae", b="#1d1c20", e="#060607", a="#6a6258", k="#2b2419", t="#0c0c0e", u="#8a6f6a"),
        "black": _solid("#0b0b0c", "#18181b", "#27272b", "#36363c", "#4a4a52", "#141416", a="#5e574e", k="#2b2419", t="#070708", u="#6e5854"),
        "grey": _coat(o="#2a2a2e", d="#48484f", m="#64646c", l="#7d7d86", h="#9a9aa2", r="#8d8981", p="#b3aea4", q="#d2cdc2", b="#35353a", e="#0a0a0b", a="#766d61", k="#2b2419", t="#18181a", u="#a0827c"),
        # Albino "pink" buffalo run to a few in a hundred in Thailand.
        "pink": _solid("#6e4a44", "#a9786d", "#c99a8e", "#ddb3a6", "#efcdc1", "#d99a90", e="#3a1612", a="#b8a58c", k="#2b2419", t="#8a6a5e", u="#e5a79d"),
    },
    "dog": {
        "tan-pied": _coat(o="#5a3a1c", d="#96682f", m="#c58f4a", l="#e0b26e", h="#f3d49b", r="#b8b2a4", p="#ece7da", q="#ffffff", b="#f4e6c6", e="#1a110a", a="#fefefe", k="#1d1510", t="#f1ece0", u="#e2837f"),
        "tan": _solid("#5a3a1c", "#96682f", "#c58f4a", "#e0b26e", "#f3d49b", "#f4e6c6", t="#f1e4c4", u="#e2837f"),
        "black": _solid("#0d0c0e", "#1d1c20", "#323037", "#4b4852", "#696670", "#55515a", t="#1d1c20", u="#e2837f"),
        "cream": _solid("#80704f", "#c2b48f", "#e6dcc0", "#f6f0dc", "#ffffff", "#ffffff", t="#ffffff", u="#e2837f"),
        "grey": _solid("#33363a", "#565b60", "#7c8287", "#a3a8ab", "#ccd0d0", "#dcdedb", t="#dcdedb", u="#e2837f"),
        "brown": _solid("#2c1a0f", "#4c301d", "#6f4a2f", "#916746", "#b38a66", "#c9a988", t="#4c301d", u="#e2837f"),
        "black-pied": _coat(o="#0d0c0e", d="#1d1c20", m="#323037", l="#4b4852", h="#696670", r="#b4b0a8", p="#e8e4da", q="#ffffff", b="#e8e4da", e="#060506", a="#ffffff", k="#0b0a0b", t="#ffffff", u="#e2837f"),
    },
    "donkey": {
        "grey-dun": _coat(o="#3a3632", d="#625c55", m="#8a837a", l="#aba49a", h="#cbc5bb", r="#625c56", p="#8a837b", q="#aba49b", b="#ece6d8", e="#14110e", a="#ffffff", k="#1c1815", t="#2b2622", u="#c99a92"),
        "brown": _solid("#2a1b12", "#4a3323", "#6b4c36", "#8b6850", "#aa876d", "#e6dcc8", t="#1d120b"),
        "black": _solid("#0e0d0e", "#201e20", "#353235", "#4e4a4e", "#6b666a", "#d8d0c2", t="#0a090a"),
        "pale": _solid("#6b6355", "#a79e8c", "#cfc7b4", "#e6e0d0", "#f8f4ea", "#ffffff", t="#7d7465"),
    },
    "camel": {
        "sand": _coat(o="#5e4526", d="#93703f", m="#bf975a", l="#dab97f", h="#f0d9a8", r="#93703e", p="#bf9759", q="#dab97e", b="#ecd6a6", e="#1a120a", a="#ffffff", k="#3b2a18", t="#7d5c30", u="#c79a7f"),
        "brown": _solid("#33200f", "#57391e", "#7c5530", "#9d7446", "#bd9562", "#b08a5c", k="#22150a", t="#3f2813"),
        "dark": _solid("#1e140c", "#382719", "#54402b", "#725a40", "#917759", "#7d6449", k="#130c07", t="#1a1009"),
        "white": _solid("#7a6f5c", "#b8ad95", "#ded5bf", "#f1ead8", "#ffffff", "#f6f0e2", k="#4a4032", t="#a3977e"),
    },
    # u is the bare tail, ears and feet.
    "mouse": {
        "house": _coat(o="#2a241f", d="#4d4439", m="#6e6253", l="#8c806e", h="#a89c88", r="#4d443a", p="#6e6254", q="#8c806f", b="#b6ab97", e="#08070a", a="#5a5046", k="#1a1512", t="#b58c86", u="#d9a49c"),
        "brown": _solid("#2a1c12", "#4d3423", "#6e4d34", "#8c6848", "#a8845f", "#c4a986", e="#08070a", k="#1a1512", t="#b58c86", u="#d9a49c"),
        "grey": _solid("#26262a", "#46464c", "#66666d", "#85858c", "#a3a3a9", "#bdbcbf", e="#08070a", k="#1a1512", t="#b58c86", u="#d9a49c"),
    },
    # a is the tabby stripe; r p q are white patches, as on the pied cattle.
    "cat": {
        "tabby-white": _coat(o="#241c14", d="#5a4a36", m="#85704f", l="#a8926a", h="#c9b58b", r="#b3aea4", p="#e6e1d6", q="#fbf8f0", b="#dccdaa", e="#a9c24a", a="#3a2e21", k="#2c1d19", t="#30261b", u="#d98a84"),
        "tabby": _cat("#241c14", "#5a4a36", "#85704f", "#a8926a", "#c9b58b", "#dccdaa", "#3a2e21", "#a9c24a"),
        "ginger": _cat("#3d1d0b", "#8a4a1e", "#bf6d2e", "#dc9148", "#f0b76e", "#f3d8ae", "#7a3a14", "#d0a230"),
        "ginger-white": _cat("#3d1d0b", "#8a4a1e", "#bf6d2e", "#dc9148", "#f0b76e", "#f3d8ae", "#7a3a14", "#d0a230", white=True),
        "black": _cat("#0b0a0d", "#17151b", "#25222a", "#35313c", "#4a4553", "#2c2932", "#25222a", "#cdb338"),
        "black-white": _cat("#0b0a0d", "#17151b", "#25222a", "#35313c", "#4a4553", "#ece8de", "#25222a", "#cdb338", white=True),
        "grey": _cat("#25272d", "#4a4e58", "#6b707b", "#8a8f99", "#aab0b8", "#c3c6cb", "#50545e", "#c8a040"),
        "white": _cat("#6e6a62", "#b8b3a8", "#dcd8ce", "#f0ede5", "#ffffff", "#ffffff", "#dcd8ce", "#7fb0d4"),
    },
}
PALETTES = {species: next(iter(coats.values())) for species, coats in COATS.items()}
for _species, _palette in PALETTES.items():
    assert len(set(_palette.values())) == len(ROLES), _species

# West, south, east, north; astronomical years. No entry means wherever the
# species is kept.
FORMS = {
    "cattle": {
        "taurine": dict(weight=1.0),
        # The long-horned cattle of Egypt and the Sahara, the Sanga after them,
        # the old breeds of Iberia and Britain and the criollo they became.
        "longhorn": dict(weight=0.9, where=[
            dict(years=[-7000, 10000], bounds=[-20, -35, 55, 38]),
            dict(years=[-4000, 10000], bounds=[-12, 35, 5, 60]),
            dict(years=[1500, 1900], bounds=[-125, -56, -30, 40]),
        ]),
        "zebu": dict(weight=2.5, where=[
            dict(years=[-6000, 10000], bounds=[60, 5, 97, 36]),
            dict(years=[-2000, 10000], bounds=[95, -11, 125, 30]),
            dict(years=[-1500, 10000], bounds=[-20, -35, 55, 18]),
            dict(years=[1850, 10000], bounds=[-120, -35, -34, 30]),
        ]),
    },
    # Drop ears and a sabre tail come with breeding for the chase: Egypt and
    # Mesopotamia have them by the fourth millennium.
    "water-buffalo": {"buffalo": dict(weight=1.0)},
    "dog": {"pariah": dict(weight=1.0), "hound": dict(weight=0.6, where=[dict(years=[-3500, 10000])])},
    "donkey": {"donkey": dict(weight=1.0)},
    "cat": {"cat": dict(weight=1.0)},
    "mouse": {"mouse": dict(weight=1.0)},
    "camel": {
        "dromedary": dict(weight=1.0, where=[dict(years=[-10000, 10000], bounds=[-20, -35, 78, 40]), dict(years=[1860, 10000], bounds=[110, -40, 155, -10])]),
        "bactrian": dict(weight=1.0, where=[dict(years=[-10000, 10000], bounds=[45, 30, 130, 56])]),
    },
}
# Which coats a form wears, and how often. A zebu is grey or white far more
# often than it is pied; a Holstein's black and white is a modern thing.
COAT_WEIGHTS = {
    "cattle": {
        "taurine": {"red": 3, "brown": 2, "black": 2, "dun": 1.5, "red-pied": 2, "black-pied": 1, "white": 0.4},
        "longhorn": {"red": 2, "red-pied": 3, "black-pied": 1.5, "dun": 2, "brown": 1, "white": 0.6},
        "zebu": {"grey": 3, "white": 3, "red": 1.5, "black": 0.6, "dun": 1, "red-pied": 0.7},
    },
    "water-buffalo": {"buffalo": {"slate": 5, "black": 3, "grey": 2, "pink": 0.3}},
    "dog": {
        "pariah": {"tan": 4, "cream": 1.5, "black": 1.5, "brown": 1, "tan-pied": 2, "black-pied": 1, "grey": 0.5},
        "hound": {"tan": 2, "cream": 2, "black": 1, "brown": 1.5, "tan-pied": 2.5, "black-pied": 1.5, "grey": 1.5},
    },
    "mouse": {"mouse": {"house": 4, "brown": 2, "grey": 2}},
    "cat": {"cat": {"tabby": 5, "tabby-white": 1.5, "ginger": 1.5, "ginger-white": 0.8, "black": 2, "black-white": 1.2, "grey": 0.8, "white": 0.4}},
    "donkey": {"donkey": {"grey-dun": 5, "brown": 2, "black": 1, "pale": 0.7}},
    "camel": {
        "dromedary": {"sand": 5, "brown": 1.5, "white": 0.8, "dark": 0.5},
        "bactrian": {"brown": 4, "dark": 2, "sand": 1.5, "white": 0.3},
    },
}

# Coats that are recent. Black and white is the Dutch dairy cow.
# The wildcat's striped tabby is the only coat for millennia. Black spreads
# with the Roman and Byzantine trade, white spotting and orange in the early
# Middle Ages, the dilute grey later (Ottoni et al. 2017 for the tabby; the
# rest is inference from art and the spread of the genes).
COAT_FROM = {"cattle": {"black-pied": 1600}, "cat": {"black": 0, "tabby-white": 500, "black-white": 500, "ginger": 700, "ginger-white": 700, "grey": 1000, "white": 1200}}

STATES = {
    "cattle": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "water-buffalo": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "dog": dict.fromkeys(["idle", "forage", "wander", "flee", "rest", "dig"], 8),
    "donkey": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "camel": dict.fromkeys(["idle", "graze", "wander", "flee", "rest"], 8),
    "cat": dict.fromkeys(["idle", "forage", "wander", "flee", "rest", "stalk", "chase", "pounce", "carry"], 8),
    "mouse": dict.fromkeys(["idle", "forage", "wander", "flee"], 8),
}
# Drawing coordinates are measured with the ground line at GROUND; HEADROOM is
# empty rows above for horns, ears and the top of a stride.
GROUND = {"cattle": 38, "water-buffalo": 38, "dog": 20, "donkey": 32, "camel": 46, "cat": 16, "mouse": 8}
HEADROOM = {"cattle": 5, "water-buffalo": 6, "dog": 4, "donkey": 7, "camel": 3, "cat": 8, "mouse": 3}
WIDTH = {"cattle": 50, "water-buffalo": 52, "dog": 32, "donkey": 40, "camel": 54, "cat": 28, "mouse": 16}
# Against the 29px human: a cow's withers ~22px, a donkey's 19, a village dog's
# 10, a camel's hump 36.
NATIVE_SIZES = {s: (WIDTH[s], GROUND[s] + 4 + HEADROOM[s]) for s in GROUND}


class Canvas(_BCanvas):
    def __init__(self, species):
        self.w, self.h = NATIVE_SIZES[species]
        self.palette = PALETTES[species]
        self.pad = HEADROOM[species]
        self.px = {}

    def finish(self):
        self.px = {(x, y + self.pad): role for (x, y), role in self.px.items()}
        return super().finish()


# ------------------------------------------------------------------ skeleton
def limb(a, b, w):
    """A bone of even thickness whichever way it points."""
    if w <= 1:
        return line(a, b, 1)
    (ax, ay), (bx, by) = ((v + _PAD for v in p) for p in (a, b))
    r = (w - 1) / 2
    return _padded(lambda d: (
        d.line([(ax, ay), (bx, by)], fill=255, width=w),
        d.ellipse((ax - r, ay - r, ax + r, ay + r), fill=255),
        d.ellipse((bx - r, by - r, bx + r, by + r), fill=255),
    ))


def ik(hip, foot, l1, l2, back):
    """Where the middle joint goes. `back` bends it rearward, as a hock does;
    a knee goes forward."""
    dx, dy = foot[0] - hip[0], foot[1] - hip[1]
    d = max(abs(l1 - l2) + 0.01, min(math.hypot(dx, dy), l1 + l2 - 0.01))
    a = math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))
    ang = math.atan2(dy, dx) + (a if back else -a)
    return hip[0] + l1 * math.cos(ang), hip[1] + l1 * math.sin(ang)


def bones(hip_y, ground, hind):
    """Bone lengths that stand the leg almost straight: a hock keeps a little
    angle, a knee locks."""
    total = ground - 1 - hip_y + (1.0 if hind else 0.3)
    return total * 0.52, total * 0.48


def leg(c, hip, foot, l1, l2, hind, near, w1=3, w2=2, pad=0, pied=True):
    fx, fy = foot
    ankle = (fx, fy - 1)
    knee = ik(hip, ankle, l1, l2, hind)
    upper, lower = limb(hip, knee, w1), limb(knee, ankle, w2)
    px = flat(upper, "m" if near else "d")
    px.update(flat(lower - upper, ("p" if pied else "m") if near else ("r" if pied else "d")))
    if near:
        for x, y in upper | lower:
            if (x - 1, y) not in upper and (x - 1, y) not in lower:
                px[(x, y)] = "l" if (x, y) in upper or not pied else "q"
    x0 = round(fx) - w2 // 2
    for k in range(w2 + pad):
        px[(x0 + k, round(fy))] = "k"
    c.paint(px)


WALK = {"fh": 0.0, "ff": 0.25, "nh": 0.5, "nf": 0.75}
# A camel paces: both legs of a side swing together, and the animal rolls.
PACE = {"fh": 0.0, "ff": 0.06, "nh": 0.5, "nf": 0.56}
TROT = {"fh": 0.0, "nf": 0.04, "nh": 0.5, "ff": 0.54}
GALLOP = {"fh": 0.0, "nh": 0.12, "ff": 0.55, "nf": 0.67}


class Stride:
    """One frame's timing: where each foot is, and how the two ends of the
    body ride."""

    def __init__(self, state, frame, walk, run, phases=WALK, run_phases=GALLOP, bounce=1.5):
        self.state, self.frame, self.t = state, frame, frame / 8
        self.moving = state in {"wander", "flee"}
        self.running = state == "flee"
        self.amp, self.lift, self.stance = run if self.running else walk
        self.phases = run_phases if self.running else phases
        t = self.t
        if self.running:
            up = round(bounce * max(0.0, math.sin(2 * math.pi * (t + 0.15))))
            rock = round(math.sin(2 * math.pi * (t + 0.1)))
        elif self.moving:
            up = round(0.5 * math.cos(4 * math.pi * t) + 0.5)
            rock = 0
        else:
            up = rock = 0
        self.f, self.h = -up - rock, -up + rock
        # the head comes down onto each landing forefoot
        self.nod = 1 if self.moving and not self.running and math.cos(4 * math.pi * (t - 0.25)) > 0.3 else 0
        self.breath = 1 if state in {"idle", "graze", "forage", "rest"} and frame in (2, 3, 4) else 0
        self.blink = state in {"idle", "rest"} and frame == 6
        self.flick = state in {"idle", "rest", "graze", "forage"} and frame in (3, 4)

    def foot(self, key):
        if not self.moving:
            return 0.0, 0.0
        return walk_foot(self.t + self.phases[key], self.amp, self.lift, self.stance)

    def sway(self, size=1.5):
        return round(size * math.sin(2 * math.pi * self.t)) if self.moving else 0


def lit(mask, top=1, bottom=2, span=None):
    """Body shading, with a highlight along the top between span's columns."""
    px = shade(mask, top, bottom)
    if span:
        for x, y in mask:
            if (x, y - 1) not in mask and span[0] <= x <= span[1]:
                px[(x, y)] = "h"
    return px


def lay(c, mask, top=1, bottom=1):
    """Paint a part over the body: flat where it overlaps, or the two rims
    draw a seam."""
    px = shade(mask, top, bottom)
    c.paint({xy: "m" if xy in c.px and c.px[xy] in "dmlh" else role for xy, role in px.items()})


def mark(c, region, blobs):
    """Turn the body's colours into the marking's wherever a blob covers it."""
    swap = {"d": "r", "m": "p", "l": "q", "h": "q"}
    for xy in region & blobs:
        if c.px.get(xy) in swap:
            c.px[xy] = swap[c.px[xy]]


def blobs(shapes, dy=0):
    out = set()
    for box in shapes:
        out |= ellipse((box[0], box[1] + dy, box[2], box[3] + dy))
    return out


def tufted_tail(c, root, tip, tuft=2, role="d"):
    c.paint(flat(line(root, tip, 1) | line((root[0], root[1]), (root[0], root[1] + 2), 2), role))
    c.paint(flat(ellipse((tip[0] - 1, tip[1], tip[0] + 1, tip[1] + tuft + 1)), "t"))


# -------------------------------------------------------------------- cattle
CATTLE_MARKS = [(6, 10, 13, 17), (10, 13, 18, 20), (12, 18, 16, 24), (20, 17, 27, 25), (23, 22, 30, 29), (18, 10, 23, 14), (30, 11, 35, 17)]


def cattle(form, state, frame, species="cattle"):
    """Deep and square: a level back from hip to withers, a brisket hung
    between the forelegs, hip bones that show, and a head carried low."""
    c = Canvas(species)
    buffalo = species == "water-buffalo"
    if state == "rest":
        return _cattle_rest(c, form, frame)
    s = Stride(state, frame, walk=(2.8, 2.4, 0.64), run=(4.6, 4.2, 0.42), bounce=1.2)
    zebu = form == "zebu"
    ground = GROUND["cattle"]

    def put(key, hip, hind, near):
        dx, up = s.foot(key)
        ox = 0 if near else -4
        leg(c, (hip[0] + ox, hip[1] + (s.h if hind else s.f)), (hip[0] + ox + dx + (-1 if hind else 0), ground - up),
            *bones(hip[1], ground, hind), hind, near, 4 if hind else 3, 2)

    put("fh", (12, 22), True, False)
    put("ff", (29, 23), False, False)

    # tail: hangs to the hock; goes up and out behind a running cow, and comes
    # round at the flies when she stands
    root = (6, 13 + s.h)
    if s.running:
        tip = (1, 10 + s.h + round(1.5 * math.sin(2 * math.pi * s.t + 1)))
    elif state == "idle":
        tip = [(4, 29), (4, 29), (2, 27), (1, 21), (3, 16), (1, 22), (3, 28), (4, 29)][frame]
        tip = (tip[0], tip[1] + s.h)
    else:
        tip = (4 - s.sway(1.4), 29 + s.h)
    tufted_tail(c, root, tip, 3)

    body = ellipse((5, 12 + s.h, 30, 27 + s.h + s.breath)) | rect((8, 12 + s.h, 28, 20 + s.h))
    body |= rect((6, 12 + s.h, 12, 21 + s.h))  # the square of the hips
    body |= ellipse((21, 11 + s.f, 36, 28 + s.f))
    if buffalo:  # wider in the barrel, and hung lower
        body |= ellipse((8, 14 + s.h, 30, 30 + s.h + s.breath))
    if zebu:
        body |= ellipse((24, 7 + s.f, 31, 16 + s.f))  # the hump sits on the withers
        body |= polygon([(36, 20 + s.f), (34, 31 + s.f), (29, 30 + s.f), (30, 24 + s.f)])  # dewlap
    else:
        body |= polygon([(27, 26 + s.f), (35, 22 + s.f), (35, 28 + s.f), (31, 30 + s.f)])  # brisket
    c.paint(lit(body, 1, 2, (9, 27)))
    # hook bone and the hollow in front of it; the line of the shoulder
    c.dot(11, 14 + s.h, "h")
    for k in range(3):
        c.dot(14, 15 + s.h + k, "d")
    for k in range(5):
        c.dot(27 - (k // 2), 16 + s.f + k, "d")
    # udder, tucked between the hind legs
    if not buffalo:
        c.paint(flat(rect((12, 27 + s.h, 15, 28 + s.h)), "u"))
        c.dot(13, 29 + s.h, "u")
        mark(c, body, blobs(CATTLE_MARKS, s.h))

    stage = [0, 1, 2, 2, 2, 2, 1, 0][frame] if state == "graze" else 0
    # grass is torn with a jerk of the head, then chewed; standing, it is cud
    tear = 1 if state == "graze" and frame in (2, 4) else 0
    chew = 1 if (state == "graze" and frame in (3, 5)) or (state == "idle" and frame in (1, 3, 5)) else 0
    # a buffalo carries its head level, nose out and horns laid back
    hx, hy = [(38, 14) if buffalo else (37, 10), (39, 19), (38, 29)][stage]
    hx, hy = hx + s.nod + tear, hy + s.f + s.nod + (2 if s.running else 0)
    neck = polygon([(28, 12 + s.f), (35, 23 + s.f), (hx + 3, hy + 8), (hx - 1, hy + 1)])
    lay(c, neck, 1, 2)
    _cattle_head(c, form, hx, hy, chew, s)
    if buffalo:  # the pale chevron across the throat
        for k in range(4):
            if c.px.get((hx + 1 + k // 2, hy + 9 + k)) in ("d", "m", "l"):
                c.px[(hx + 1 + k // 2, hy + 9 + k)] = "q"

    put("nh", (12, 22), True, True)
    put("nf", (29, 23), False, True)
    return c.finish()


def _cattle_head(c, form, x, y, chew, s):
    """(x, y) is the poll. Broad and blunt, with the muzzle below the eye."""
    zebu, long, buffalo = form == "zebu", form == "longhorn", form == "buffalo"
    # far horn
    if buffalo:
        c.paint(flat(limb((x, y), (x - 4, y - 3), 2) | line((x - 4, y - 3), (x - 7, y - 5), 1), "d"))
    elif long:
        c.paint(flat(limb((x, y), (x - 2, y - 5), 2) | line((x - 2, y - 5), (x - 1, y - 9), 1), "a"))
    elif zebu:
        c.paint(flat(line((x, y), (x - 1, y - 5), 1), "a"))
    skull = polygon([(x - 1, y), (x + 4, y), (x + 8, y + 4), (x + 8, y + 9 + chew), (x + 4, y + 10), (x, y + 8)])
    c.paint(shade(skull, 1, 1))
    c.paint(flat(polygon([(x + 6, y + 5), (x + 8, y + 5), (x + 8, y + 9 + chew), (x + 6, y + 9 + chew)]), "b"))
    c.dot(x + 8, y + 6, "k")
    c.dot(x + 7, y + 9 + chew, "k" if chew else "b")
    # a blaze down the face on a pied animal
    for k in range(1, 5):
        if c.px.get((x + 3 + k, y + k)) in ("m", "l"):
            c.px[(x + 3 + k, y + k)] = "p"
    c.dot(x + 3, y + 3, "d" if s.blink else "e")
    c.dot(x + 3, y + 2, "l")
    # near horn: a buffalo's sweeps back in a crescent over the neck
    if buffalo:
        c.paint(flat(limb((x + 1, y + 1), (x - 3, y - 2), 3) | limb((x - 3, y - 2), (x - 7, y - 4), 2) | line((x - 7, y - 4), (x - 10, y - 3), 1), "a"))
        c.dot(x - 10, y - 3, "k")
    elif long:
        c.paint(flat(limb((x + 1, y), (x + 5, y - 4), 2) | line((x + 5, y - 4), (x + 5, y - 9), 1), "a"))
        c.dot(x + 5, y - 9, "k")
    elif zebu:
        c.paint(flat(limb((x + 1, y), (x + 2, y - 3), 2) | line((x + 2, y - 3), (x + 1, y - 6), 1), "a"))
    else:
        c.paint(flat(limb((x + 1, y), (x + 4, y - 1), 2) | line((x + 4, y - 2), (x + 5, y - 4), 1), "a"))
    flick = 1 if s.flick else 0
    if buffalo:  # set low under the horn and held out flat
        ear = polygon([(x, y + 3), (x - 5, y + 4 + flick), (x - 4, y + 6 + flick), (x, y + 5)])
    elif zebu:  # long and hanging
        ear = polygon([(x - 1, y + 2), (x - 4, y + 4 - flick), (x - 3, y + 8 - flick * 2), (x, y + 5)])
    else:
        ear = polygon([(x - 1, y + 2), (x - 5, y + 1 + flick), (x - 4, y + 4 + flick), (x, y + 5)])
    c.paint(flat(ear, "d"))
    c.dot(x - 2, y + 3 + (1 if zebu else 0), "u")


def _cattle_rest(c, form, frame):
    """Down on the brisket with the forelegs folded under, chewing."""
    s = Stride("rest", frame, (0, 0, 1), (0, 0, 1))
    g = GROUND["cattle"]
    if form == "buffalo":  # a wallow: the mud under it, darkening what it covers
        c.paint(flat(ellipse((0, g - 5, 46, g + 2)), "k"))
    body = ellipse((5, g - 15, 31, g - 1 + 0)) | rect((8, g - 15, 28, g - 8))
    body |= rect((6, g - 15, 12, g - 6)) | ellipse((21, g - 17 - s.breath, 36, g - 1))
    if form == "zebu":
        body |= ellipse((24, g - 22, 31, g - 13))
    c.paint(lit(body, 1, 2, (9, 27)))
    c.dot(11, g - 13, "h")
    if form == "buffalo":
        for x, y in body:
            if y >= g - 5:
                c.px[(x, y)] = "k"
        for x, y in ((6, g - 3), (20, g - 2), (41, g - 3)):
            c.dot(x, y, "h")
        chew = 1 if frame in (1, 3, 5) else 0
        hx, hy = 37, g - 18 + [0, 0, 1, 1, 1, 1, 0, 0][frame]
        lay(c, polygon([(28, g - 16), (35, g - 6), (hx + 3, hy + 8), (hx - 1, hy + 1)]), 1, 2)
        _cattle_head(c, form, hx, hy, chew, s)
        return c.finish()
    mark(c, body, blobs(CATTLE_MARKS, g - 27))
    # folded foreleg and the hind hoof showing under the flank
    fore = rect((30, g - 3, 38, g - 1)) | rect((29, g - 6, 33, g - 2))
    c.paint(shade(fore, 1, 1))
    c.paint(flat(rect((38, g - 2, 39, g - 1)), "k"))
    c.paint(flat(rect((9, g - 2, 15, g - 1)), "d"))
    c.paint(flat(rect((15, g - 2, 16, g - 1)), "k"))
    tip = [(3, g - 2), (3, g - 2), (3, g - 2), (2, g - 5), (3, g - 2), (3, g - 2), (3, g - 2), (3, g - 2)][frame]
    tufted_tail(c, (6, g - 12), tip, 2)
    chew = 1 if frame in (1, 3, 5) else 0
    hx, hy = 37, g - 22 + [0, 0, 1, 1, 1, 1, 0, 0][frame]
    lay(c, polygon([(28, g - 16), (35, g - 6), (hx + 3, hy + 8), (hx - 1, hy + 1)]), 1, 2)
    _cattle_head(c, form, hx, hy, chew, s)
    return c.finish()


# ----------------------------------------------------------------------- dog
def dog(form, state, frame):
    """A village dog: deep chest, tucked loin, legs under it. It sits when it
    has nothing to do, trots rather than walks, and its tail never stops."""
    c = Canvas("dog")
    hound = form == "hound"
    if state == "rest":
        return _dog_rest(c, hound, frame)
    if state == "idle":
        return _dog_sit(c, hound, frame)
    if state == "dig":
        return _dog_dig(c, hound, frame)
    s = Stride(state, frame, walk=(2.4, 2.0, 0.5), run=(4.4, 3.2, 0.36), phases=TROT, bounce=1.6)
    ground = GROUND["dog"]
    sniff = state == "forage"
    # flat out, the spine opens and closes: forelegs and hind legs reach apart,
    # then gather under the belly
    reach = round(1.6 * math.sin(2 * math.pi * (s.t + 0.05))) if s.running else 0

    def put(key, hip, hind, near):
        dx, up = s.foot(key)
        if sniff:  # creeping forward a step at a time, nose down
            dx, up = walk_foot(s.t + WALK[key], 1.2, 1.2, 0.7)
        ox = 0 if near else -2
        x = hip[0] + ox + (-reach if hind else reach)
        leg(c, (x, hip[1] + (s.h if hind else s.f)), (x + dx, ground - up), *bones(hip[1], ground, hind), hind, near, 2, 1, pad=1)

    put("fh", (8, 12), True, False)
    put("ff", (20, 13), False, False)
    _dog_tail(c, hound, (5, 9 + s.h), s, high=not s.running, fast=sniff or s.moving)
    loin = ellipse((4 - reach, 8 + s.h, 17, 14 + s.h))
    chest = ellipse((13, 7 + s.f, 23 + reach, 16 + s.f + s.breath))
    body = loin | chest
    c.paint(lit(body, 1, 2, (7, 20)))
    mark(c, body, blobs([(8, 5, 16, 12), (19, 11, 25, 18)], s.h))
    if sniff:
        nose = [0, 1, 0, -1, 0, 1, 0, -1][frame]  # quartering the ground
        hx, hy = 23 + nose, 12
        neck = polygon([(19, 8), (23, 14), (hx + 3, hy + 3), (hx - 1, hy - 1)])
    else:
        hx, hy = 22 + reach + (1 if s.running else 0), 3 + s.f + s.nod + (2 if s.running else 0)
        neck = polygon([(18, 8 + s.f), (23 + reach, 13 + s.f), (hx + 4, hy + 5), (hx, hy + 1)])
    lay(c, neck)
    # ears stream back at a run and bounce at a trot
    _dog_head(c, hound, hx, hy, s, down=sniff, pant=s.moving and not s.running,
              ear=(2 if s.running else (1 if s.moving and frame % 4 in (1, 2) else 0)))
    put("nh", (8, 12), True, True)
    put("nf", (20, 13), False, True)
    return c.finish()


def _dog_dig(c, hound, frame):
    """At a hole: hind legs planted, rump up, nose down in it, forepaws
    raking by turns, the tail going the whole time, and the earth thrown
    back between the hind legs."""
    s = Stride("forage", frame, (0, 0, 1), (0, 0, 1))
    ground = GROUND["dog"]
    hip, sh = (8, 10), (19, 13)
    far_paw = RAKE[(frame + 2) % 8]
    leg(c, (hip[0] - 2, hip[1]), (hip[0] - 1, ground), *bones(hip[1], ground, True), True, False, 2, 1, pad=1)
    leg(c, (sh[0] - 2, sh[1]), (sh[0] - 2 + far_paw[0], ground + far_paw[1]), *bones(sh[1], ground, False), False, False, 2, 1, pad=1)
    _dog_tail(c, hound, (5, 8), s, high=True, fast=True)
    body = ellipse((4, 6, 16, 12)) | ellipse((12, 8, 22, 16))
    c.paint(lit(body, 1, 2, (6, 18)))
    mark(c, body, blobs([(8, 4, 16, 11), (18, 10, 24, 17)]))
    hx, hy = 20, 11 + [0, 1, 1, 0, 0, 1, 1, 0][frame]
    lay(c, polygon([(17, 9), (22, 13), (hx + 3, hy + 3), (hx - 1, hy - 1)]))
    _dog_head(c, hound, hx, hy, s, down=True)
    leg(c, hip, (hip[0] + 1, ground), *bones(hip[1], ground, True), True, True, 2, 1, pad=1)
    paw = RAKE[frame]
    leg(c, sh, (sh[0] + paw[0], ground + paw[1]), *bones(sh[1], ground, False), False, True, 2, 1, pad=1)
    return throw_earth(c.finish(), (6, ground - 1), frame, top=HEADROOM["dog"], hole=(27, ground))


def _dog_tail(c, hound, root, s, high=True, fast=True, ground=False):
    """Pariah tails curl over the back; a hound's is a sabre. Both wag."""
    beat = (s.frame % 2) if fast else (1 if s.frame in (1, 2, 5, 6) else 0)
    x, y = root
    if ground:  # sweeping the dust behind a sitting dog
        tip = (x - 5, y + 1 - beat)
        pts = [(x, y), (x - 3, y + 1), tip]
    elif hound:
        pts = [(x, y), (x - 3, y + (1 if high else 3)), (x - 5 + beat, y - (2 if high else -3) - beat)]
    elif high:
        pts = [(x, y), (x - 2, y - 3), (x - 1 + beat, y - 6), (x + 2 + beat, y - 6)]
    else:
        pts = [(x, y), (x - 3, y + 1), (x - 6, y + 2 + beat)]
    mask = set()
    for a, b in zip(pts, pts[1:]):
        mask |= limb(a, b, 2)
    c.paint(shade(mask, 1, 1))
    tx, ty = pts[-1]
    c.dot(tx, ty, "t")


def _dog_head(c, hound, x, y, s, down=False, pant=False, ear=0):
    """(x, y) is the back of the skull. Wedge head, dark nose, pale muzzle."""
    tilt = 2 if down else 0
    skull = ellipse((x, y, x + 5, y + 5))
    muzzle = polygon([(x + 4, y + 2 + tilt // 2), (x + 8, y + 2 + tilt), (x + 8, y + 4 + tilt), (x + 4, y + 5 + tilt // 2)])
    if not hound:
        c.paint(flat(polygon([(x, y + 1), (x, y - 3), (x + 2, y)]), "d"))  # far ear
    c.paint(shade(skull | muzzle, 1, 1))
    for mx, my in muzzle:
        if mx >= x + 6 and my >= y + 3 + tilt:
            c.px[(mx, my)] = "b"
    c.dot(x + 8, y + 2 + tilt, "k")
    c.dot(x + 3, y + 2, "d" if s.blink else "e")
    if pant:
        c.dot(x + 6, y + 5 + tilt, "k")
        c.dot(x + 6, y + 6 + tilt + (s.frame % 2), "u")
        c.dot(x + 7, y + 5 + tilt, "u")
    if hound:
        lift = [0, 1, 2][ear]
        flap = polygon([(x, y + 1), (x + 2, y), (x + 2 - lift, y + 6 - lift), (x - 1 - lift, y + 5 - lift)])
        c.paint(flat(flap, "d"))
    else:
        tip = [(x + 2, y - 4), (x + 1, y - 3), (x - 2, y - 1)][ear]
        if s.flick:
            tip = (tip[0] - 1, tip[1] + 1)
        c.paint(flat(polygon([(x + 1, y + 1), tip, (x + 4, y)]), "m"))
        c.dot(tip[0] + (0 if ear == 2 else 1), tip[1] + 2, "u")


def _dog_sit(c, hound, frame):
    s = Stride("idle", frame, (0, 0, 1), (0, 0, 1))
    g = GROUND["dog"]
    _dog_tail(c, hound, (6, g - 2), s, ground=True, fast=frame < 6)
    haunch = ellipse((5, g - 8, 15, g))
    back = polygon([(8, g - 7), (17, g - 14), (22, g - 12 + s.breath), (20, g - 4), (12, g - 1)])
    body = haunch | back
    c.paint(lit(body, 1, 2, (9, 20)))
    mark(c, body, blobs([(8, g - 14, 16, g - 6)]))
    # hind foot out in front of the haunch, forelegs straight under the chest
    c.paint(flat(rect((12, g - 1, 16, g)), "p"))
    c.dot(16, g, "k")
    for ox, role in ((17, "r"), (19, "p")):
        c.paint(flat(rect((ox, g - 7, ox + 1, g - 1)), role))
        c.paint(flat(rect((ox, g, ox + 2, g)), "k"))
    # a look round now and then: the head lifts and the ears come up
    alert = 1 if frame in (4, 5) else 0
    hx, hy = 19, g - 19 - alert
    lay(c, polygon([(16, g - 13), (22, g - 11), (hx + 4, hy + 5), (hx, hy + 2)]))
    _dog_head(c, hound, hx, hy, s, pant=not alert, ear=0)
    return c.finish()


def _dog_rest(c, hound, frame):
    """Flat out with the chin on the paws. One ear keeps working."""
    s = Stride("rest", frame, (0, 0, 1), (0, 0, 1))
    g = GROUND["dog"]
    thump = 1 if frame in (3, 4) else 0
    c.paint(shade(limb((5, g - 3), (1, g - 1 - thump), 2), 1, 1))
    c.dot(1, g - 1 - thump, "t")
    body = ellipse((4, g - 7 - s.breath, 20, g)) | ellipse((3, g - 6, 11, g))
    c.paint(lit(body, 1, 2, (6, 18)))
    mark(c, body, blobs([(8, g - 10, 16, g - 3)]))
    c.paint(flat(rect((19, g - 1, 26, g)), "p"))
    c.paint(flat(rect((26, g - 1, 27, g)), "k"))
    c.paint(flat(rect((8, g - 1, 12, g)), "r"))
    hx, hy = 19, g - 7
    asleep = frame not in (3, 4)
    s.blink = asleep
    _dog_head(c, hound, hx, hy, s, ear=0 if s.flick else (1 if hound else 2))
    return c.finish()


# -------------------------------------------------------------------- donkey
def donkey(form, state, frame):
    """A horse drawn by someone who only had it described to them: big head,
    ears half as long again, straight back, narrow quarters, a rope of a tail.
    The ears are what it thinks with."""
    c = Canvas("donkey")
    if state == "rest":
        return _donkey_rest(c, frame)
    s = Stride(state, frame, walk=(2.6, 2.2, 0.62), run=(4.4, 3.8, 0.42), bounce=1.4)
    ground = GROUND["donkey"]

    def put(key, hip, hind, near):
        dx, up = s.foot(key)
        ox = 0 if near else -3
        leg(c, (hip[0] + ox, hip[1] + (s.h if hind else s.f)), (hip[0] + ox + dx + (-1 if hind else 0), ground - up),
            *bones(hip[1], ground, hind), hind, near, 3, 2, pied=False)

    put("fh", (10, 21), True, False)
    put("ff", (24, 22), False, False)
    root = (5, 14 + s.h)
    if s.running:
        tip = (1, 17 + s.h + round(math.sin(2 * math.pi * s.t + 1)))
    elif state == "idle":
        tip = [(3, 25), (3, 25), (2, 24), (1, 21), (2, 24), (4, 25), (3, 25), (3, 25)][frame]
    else:
        tip = (3 - s.sway(1.2), 25 + s.h)
    tufted_tail(c, root, tip, 3)

    body = ellipse((4, 13 + s.h, 25, 25 + s.h + s.breath)) | rect((8, 13 + s.h, 22, 18 + s.h))
    body |= ellipse((17, 12 + s.f, 29, 25 + s.f))
    px = lit(body, 1, 2, (8, 24))
    for x, y in body:  # pale belly
        if (x, y + 1) not in body and 9 <= x <= 24:
            px[(x, y)] = "b"
    c.paint(px)
    # the cross: a stripe down the spine and another over the shoulder
    for x in range(6, 24):
        col = [y for bx, y in body if bx == x]
        if col:
            c.dot(x, min(col), "t")
    for k in range(1, 6):
        c.dot(21, 13 + s.f + k, "t")

    stage = [0, 1, 2, 2, 2, 2, 1, 0][frame] if state == "graze" else 0
    chew = 1 if state == "graze" and frame in (3, 5) else 0
    px_, py_ = [(28, 6), (30, 15), (29, 22)][stage]
    px_, py_ = px_ + s.nod, py_ + s.f + s.nod + (2 if s.running else 0)
    neck = polygon([(19, 13 + s.f), (28, 21 + s.f), (px_ + 3, py_ + 7), (px_ - 2, py_ + 2)])
    lay(c, neck)
    # a short mane that stands straight up
    for x, y in line((20, 12 + s.f), (px_ - 2, py_ + 1), 1):
        c.dot(x, y, "t")
    _donkey_head(c, px_, py_, s, chew)
    put("nh", (10, 21), True, True)
    put("nf", (24, 22), False, True)
    return c.finish()


def _donkey_head(c, x, y, s, chew=0):
    """(x, y) is the poll. Long heavy head, pale muzzle and eye ring."""
    # Each ear has its own mind: one swivels back, then the other; both go
    # flat when it runs.
    f = s.frame
    if s.running:
        far = near = "back"
    else:
        far = "back" if s.state == "idle" and f in (5, 6) else "up"
        near = "back" if s.state in {"idle", "graze"} and f in (2, 3) else "up"
    ears = {"up": ((-1, -8), (1, -1)), "back": ((-6, -5), (0, 0))}
    (tx, ty), _ = ears[far]
    c.paint(flat(polygon([(x - 2, y + 1), (x - 2 + tx, y + ty + 1), (x, y + 1)]), "d"))
    cheek = ellipse((x - 2, y, x + 5, y + 7))
    nose = polygon([(x + 2, y + 2), (x + 9, y + 7), (x + 8, y + 11 + chew), (x + 1, y + 7)])
    c.paint(shade(cheek | nose, 1, 1))
    for hx, hy in nose:
        if hx + hy >= x + y + 14:
            c.px[(hx, hy)] = "b"
    c.dot(x + 8, y + 8, "k")
    c.dot(x + 3, y + 3, "d" if s.blink else "e")
    for ex, ey in ((x + 2, y + 3), (x + 3, y + 2), (x + 4, y + 3)):
        if c.px.get((ex, ey)) != "e":
            c.dot(ex, ey, "b")
    (tx, ty), _ = ears[near]
    ear = polygon([(x, y + 1), (x + 1 + tx, y + ty), (x + 3, y + 1)])
    c.paint(flat(ear, "m"))
    for ex, ey in line((x + 1, y), (x + 1 + tx, y + ty + 2), 1):
        if (ex, ey) in ear:
            c.dot(ex, ey, "u" if near == "up" else "d")
    c.dot(x + 1 + tx, y + ty, "t")


def _donkey_rest(c, frame):
    s = Stride("rest", frame, (0, 0, 1), (0, 0, 1))
    g = GROUND["donkey"]
    body = ellipse((4, g - 13, 25, g - 1)) | ellipse((17, g - 14 - s.breath, 29, g - 1))
    px = lit(body, 1, 2, (8, 24))
    c.paint(px)
    for x in range(6, 24):
        col = [y for bx, y in body if bx == x]
        if col:
            c.dot(x, min(col), "t")
    for k in range(1, 5):
        c.dot(21, g - 13 + k, "t")
    c.paint(shade(rect((25, g - 3, 32, g - 1)) | rect((24, g - 6, 27, g - 2)), 1, 1))
    c.paint(flat(rect((32, g - 2, 33, g - 1)), "k"))
    c.paint(flat(rect((8, g - 2, 13, g - 1)), "d"))
    tufted_tail(c, (5, g - 11), (2, g - 3), 2)
    dip = [0, 0, 1, 1, 1, 1, 0, 0][frame]
    hx, hy = 28, g - 21 + dip
    lay(c, polygon([(19, g - 13), (27, g - 6), (hx + 3, hy + 7), (hx - 2, hy + 2)]))
    for x, y in line((20, g - 14), (hx - 2, hy + 1), 1):
        c.dot(x, y, "t")
    s.state = "idle"
    _donkey_head(c, hx, hy, s)
    return c.finish()


# --------------------------------------------------------------------- camel
def camel(form, state, frame):
    """Nothing about it is level. The neck leaves low off the chest and swans
    up to a small head carried nose-high; the belly runs uphill to narrow
    quarters; the legs are most of the animal. It paces, so it rolls."""
    c = Canvas("camel")
    two = form == "bactrian"
    if state == "rest":
        return _camel_rest(c, two, frame)
    s = Stride(state, frame, walk=(3.6, 2.6, 0.62), run=(5.6, 4.0, 0.46), phases=PACE,
               run_phases={"fh": 0.0, "ff": 0.1, "nh": 0.5, "nf": 0.6}, bounce=1.2)
    ground = GROUND["camel"]
    # the roll of a pace: the whole body leans over the pair that is planted
    roll = round(math.sin(2 * math.pi * s.t)) if s.moving else 0

    def put(key, hip, hind, near):
        dx, up = s.foot(key)
        ox = 0 if near else -4
        x, y = hip[0] + ox, hip[1] + (s.h if hind else s.f)
        leg(c, (x, y), (x + dx + (-1 if hind else 0), ground - up), *bones(hip[1], ground, hind), hind, near, 3, 2, pad=1, pied=False)
        if two and not hind:  # shag on the upper foreleg
            c.paint(flat(rect((x - 2, y + 1, x + 1, y + 4)), "t" if near else "d"))

    put("fh", (14, 28), True, False)
    put("ff", (32, 29), False, False)
    tip = (6 - s.sway(1.2), 31 + s.h) if not s.running else (4, 25 + s.h)
    if state == "idle" and frame in (3, 4):
        tip = (5, 29)
    tufted_tail(c, (9, 21 + s.h), tip, 2)

    barrel = ellipse((8, 17 + s.h, 34, 32 + s.h + s.breath))
    # the belly tucks up to the stifle
    barrel -= polygon([(8, 33 + s.h), (8, 27 + s.h), (20, 33 + s.h)])
    chest = ellipse((26, 19 + s.f, 38, 33 + s.f))
    body = barrel | chest
    if two:
        humps = ellipse((11, 8 + s.h + roll, 20, 22 + s.h)) | ellipse((23, 8 + s.f - roll, 32, 22 + s.f))
    else:
        humps = ellipse((14, 10 + s.h, 29, 24 + s.h))
    body |= humps
    c.paint(lit(body, 1, 2, (10, 33)))
    if two:  # wool on the crowns
        for x, y in humps:
            if (x, y - 1) not in humps or (x, y - 2) not in humps:
                c.dot(x, y, "t")
    # callus on the chest it kneels on
    c.paint(flat(rect((31, 32 + s.f, 35, 33 + s.f)), "d"))

    stage = [0, 1, 2, 2, 2, 2, 1, 0][frame] if state == "graze" else 0
    # the head floats: it lags the body's rise and fall and pumps fore and aft
    bob = round(math.sin(2 * math.pi * (2 * s.t + 0.2))) if s.moving else 0
    fy = s.f
    if stage == 0:
        reach = 2 if s.running else 0
        path = [(35, 26 + fy), (40 + reach, 29 + fy), (44 + reach, 23 + fy), (43 + reach + bob, 12 + fy + reach)]
    elif stage == 1:
        path = [(35, 26 + fy), (41, 30), (46, 30), (47, 27)]
    else:
        path = [(35, 26 + fy), (40, 32), (44, 37), (45, 39)]
    neck = set()
    for (a, b), w in zip(zip(path, path[1:]), (5, 4, 4)):
        neck |= limb(a, b, w)
    lay(c, neck)
    if two:  # a beard down the front of the neck
        for x, y in neck:
            if (x, y + 1) not in neck and (x, y + 1) not in c.px and y > 20:
                c.dot(x, y, "t")
    hx, hy = path[-1]
    chew = (state == "idle" or state == "graze") and frame in (1, 2, 5, 6)
    _camel_head(c, hx - 2, hy - 3 if stage < 2 else hy - 1, s, down=stage == 2,
                jaw=(1 if frame in (1, 2) else -1) if chew else 0)
    put("nh", (14, 28), True, True)
    put("nf", (32, 29), False, True)
    # knee pads
    return c.finish()


def _camel_head(c, x, y, s, down=False, jaw=0):
    """(x, y) is the back of the skull. Long, shallow, nose tipped up, a heavy
    lid over the eye, and a lower jaw that goes round sideways when it chews."""
    if down:
        skull = polygon([(x, y), (x + 4, y), (x + 8, y + 4), (x + 7, y + 7), (x + 3, y + 5), (x, y + 3)])
        c.paint(shade(skull, 1, 1))
        c.dot(x + 7, y + 5, "k")
        c.dot(x + 3, y + 2, "e")
        c.paint(flat(polygon([(x, y), (x - 2, y - 2), (x + 1, y - 1)]), "d"))
        return
    skull = polygon([(x, y), (x + 4, y - 1), (x + 9, y), (x + 10, y + 2), (x + 9, y + 4), (x + 4, y + 5), (x, y + 4)])
    c.paint(shade(skull, 1, 1))
    # lower lip and jaw, sliding
    c.paint(flat(rect((x + 5 + jaw, y + 5, x + 9 + jaw, y + 5)), "d"))
    c.dot(x + 9 + jaw, y + 6 if jaw else y + 5, "d")
    c.dot(x + 10, y + 1, "k")
    c.dot(x + 9, y + 3, "b")
    c.dot(x + 10, y + 3, "b")
    c.dot(x + 4, y + 1, "d" if s.blink else "e")
    c.paint(flat(rect((x + 3, y, x + 5, y)), "h"))  # the brow
    flick = 1 if s.flick else 0
    c.paint(flat(polygon([(x, y + 1), (x - 2 - flick, y - 1 + flick), (x + 1, y)]), "d"))


def _camel_rest(c, two, frame):
    """Kushed: legs folded flat under it, neck still up, still chewing."""
    s = Stride("rest", frame, (0, 0, 1), (0, 0, 1))
    g = GROUND["camel"]
    barrel = ellipse((8, g - 16, 34, g - 1)) | ellipse((26, g - 15, 38, g - 1))
    if two:
        humps = ellipse((11, g - 26, 20, g - 11)) | ellipse((23, g - 26, 32, g - 11))
    else:
        humps = ellipse((14, g - 25 - s.breath, 29, g - 10))
    body = barrel | humps
    c.paint(lit(body, 1, 2, (10, 33)))
    if two:
        for x, y in humps:
            if (x, y - 1) not in humps or (x, y - 2) not in humps:
                c.dot(x, y, "t")
    # folded legs: a knee out in front, a hock behind
    c.paint(shade(rect((30, g - 3, 41, g - 1)), 1, 1))
    c.paint(flat(rect((41, g - 2, 43, g - 1)), "k"))
    c.paint(shade(rect((6, g - 3, 17, g - 1)), 1, 1))
    c.paint(flat(rect((5, g - 2, 6, g - 1)), "k"))
    tufted_tail(c, (9, g - 12), (6, g - 4), 2)
    path = [(35, g - 9), (40, g - 7), (44, g - 13), (43, g - 24)]
    neck = set()
    for (a, b), w in zip(zip(path, path[1:]), (5, 4, 4)):
        neck |= limb(a, b, w)
    lay(c, neck)
    chew = frame in (1, 2, 5, 6)
    _camel_head(c, 41, g - 27, s, jaw=(1 if frame in (1, 2) else -1) if chew else 0)
    return c.finish()


# ------------------------------------------------------- head-on and tail-on
# A quadruped seen from the front is a different silhouette, not a rotation:
# a chest between two forelegs with the head hung in front of it; from behind,
# a rump between two hind legs with whatever stands taller showing over it.
def _by(s):
    return round((s.f + s.h) / 2)


def face_legs(c, s, xs, top, ground, w, near, keys, pied=True, pad=0):
    """A pair of legs seen end-on: a step reads as the hoof coming up and the
    leg swinging a little in towards the midline."""
    mid = sum(xs) / 2
    for x, key in zip(xs, keys):
        dx, up = s.foot(key)
        up = round(up * 0.8)
        x0 = round(x + (mid - x) * min(1, up / 3) * 0.25) - w // 2
        foot = ground - up
        knee = (top + foot) // 2
        px = {}
        for y in range(top, foot):
            for k in range(w):
                low = y >= knee
                if near:
                    role = ("q" if low and pied else "l") if k == 0 else ("p" if low and pied else "m")
                else:
                    role = "r" if low and pied else "d"
                px[(x0 + k, y)] = role
        for k in range(-(pad // 2), w + (pad + 1) // 2):
            px[(x0 + k, foot)] = "k"
        c.paint(px)


def face_body(c, box, cx, marks=()):
    body = ellipse(box)
    px = lit(body, 1, 2, (box[0] + 3, box[2] - 3))
    for x, y in body:  # a barrel is round: the middle keeps the light
        if abs(x - cx) <= 1 and box[1] + 3 <= y <= box[3] - 4:
            px[(x, y)] = "l"
    c.paint(px)
    if marks:
        mark(c, body, blobs(marks))
    return body


def hanging_tail(c, root, length, sway, tuft=3):
    x, y = root
    tip = (x + sway, y + length)
    c.paint(flat(line(root, tip, 2), "d"))
    c.paint(flat(ellipse((tip[0] - 1, tip[1], tip[0] + 2, tip[1] + tuft)), "t"))


def _cattle_face(form, state, frame, south, species="cattle"):
    c = Canvas(species)
    s = Stride(state, frame, walk=(2.8, 2.6, 0.64), run=(4.6, 4.2, 0.42), bounce=1.2)
    g, cx = GROUND["cattle"], 25
    rest = state == "rest"
    by = (g - 30) if rest else _by(s)
    zebu, long, buffalo = form == "zebu", form == "longhorn", form == "buffalo"
    marks = () if buffalo else [(13, 10 + by, 21, 19 + by), (27, 16 + by, 37, 27 + by)]
    if rest and buffalo:
        c.paint(flat(ellipse((6, g - 6, 44, g + 2)), "k"))
    graze = [0, 6, 13, 13, 13, 13, 6, 0][frame] if state == "graze" else 0
    chew = (frame in (1, 3, 5)) if state in {"idle", "rest"} else (state == "graze" and frame in (3, 5))
    jaw = (1 if frame in (1, 5) else -1) if chew else 0

    def horns(hy, back):
        role = "a"
        for sgn in (-1, 1):
            x = cx + sgn * 5
            if buffalo:
                m = limb((x, hy + 1), (x + sgn * 7, hy), 3) | limb((x + sgn * 7, hy), (x + sgn * 11, hy - 3), 2) | line((x + sgn * 11, hy - 3), (x + sgn * 11, hy - 6), 1)
            elif long:
                m = limb((x, hy), (x + sgn * 6, hy - 3), 2) | line((x + sgn * 6, hy - 3), (x + sgn * 8, hy - 9), 1)
            elif zebu:
                m = limb((x - sgn, hy), (x, hy - 4), 2) | line((x, hy - 4), (x - sgn, hy - 7), 1)
            else:
                m = limb((x, hy), (x + sgn * 4, hy - 1), 2) | line((x + sgn * 4, hy - 2), (x + sgn * 5, hy - 4), 1)
            c.paint(flat(m, role))

    def ears(hy):
        flick = 1 if s.flick else 0
        for sgn in (-1, 1):
            x = cx + sgn * 6
            if buffalo:
                e = polygon([(x, hy + 4), (x + sgn * 5, hy + 5 + flick), (x + sgn * 4, hy + 7 + flick)])
            elif zebu:
                e = polygon([(x, hy + 3), (x + sgn * 4, hy + 5 - flick), (x + sgn * 4, hy + 10 - flick), (x + sgn, hy + 6)])
            else:
                e = polygon([(x, hy + 3), (x + sgn * 5, hy + 2 + flick), (x + sgn * 4, hy + 5 + flick)])
            c.paint(flat(e, "d"))
            c.dot(x + sgn * 2, hy + 4 + (1 if zebu else 0), "u")

    if south:
        if not rest:
            face_legs(c, s, (20, 30), 25 + by, g, 3, False, ("nh", "fh"))
        if zebu:
            c.paint(lit(ellipse((20, 4 + by, 30, 14 + by)), 1, 1, (22, 28)))
        body = face_body(c, (13, 11 + by, 37, 29 + by), cx, marks)
        brisket = ellipse((21, 24 + by, 29, 32 + by + (3 if zebu else 0)))
        if not rest:
            lay(c, brisket, 0, 2)
            face_legs(c, s, (18, 32), 24 + by, g, 3, True, ("ff", "nf"))
        else:  # knees folded out in front
            for x in (15, 30):
                c.paint(shade(rect((x, g - 3, x + 5, g - 1)), 1, 1))
        hy = 9 + by + graze + s.nod + (1 if rest else 0)
        horns(hy, False)
        ears(hy)
        skull = polygon([(cx - 5, hy), (cx + 5, hy), (cx + 6, hy + 7), (cx + 3, hy + 14), (cx - 3, hy + 14), (cx - 6, hy + 7)])
        c.paint(shade(skull, 1, 1))
        for y in range(hy + 1, hy + 9):
            if not buffalo and c.px.get((cx, y)) in ("m", "l"):
                c.px[(cx, y)] = "p"
        if buffalo:  # the chevron under the jaw
            for k in range(-3, 4):
                c.dot(cx + k, hy + 17 + abs(k) // 2, "q")
        muzzle = ellipse((cx - 4 + jaw, hy + 9, cx + 4 + jaw, hy + 15 + (1 if chew else 0)))
        c.paint(flat(muzzle, "b"))
        c.dot(cx - 2 + jaw, hy + 12, "k")
        c.dot(cx + 2 + jaw, hy + 12, "k")
        for sgn in (-1, 1):
            c.dot(cx + sgn * 4, hy + 5, "d" if s.blink else "e")
            c.dot(cx + sgn * 4, hy + 4, "l")
    else:
        hy = 8 + by + (graze // 2)
        if not graze:
            horns(hy + 1, True)
            ears(hy - 1)
            c.paint(shade(ellipse((cx - 5, hy - 1, cx + 5, hy + 8)), 1, 1))
        if rest and buffalo:
            for x, y in list(c.px):
                if y >= g - 5:
                    c.px[(x, y)] = "k"
        if not rest:
            face_legs(c, s, (20, 30), 25 + by, g, 3, False, ("ff", "nf"))
        if zebu:
            c.paint(lit(ellipse((20, 4 + by, 30, 14 + by)), 1, 1, (22, 28)))
        body = ellipse((13, 10 + by, 37, 29 + by)) | rect((15, 11 + by, 35, 20 + by))
        px = lit(body, 1, 2, (16, 34))
        c.paint(px)
        mark(c, body, blobs(marks))
        for sgn in (-1, 1):  # hook bones
            c.dot(cx + sgn * 8, 12 + by, "h")
        if not rest:
            c.paint(flat(rect((22, 28 + by, 28, 30 + by)), "u"))
            face_legs(c, s, (18, 32), 23 + by, g, 4, True, ("nh", "fh"))
        if s.running:
            sway, length = round(2 * math.sin(2 * math.pi * s.t)), 6
        elif state == "idle":
            sway, length = [0, 0, 2, 5, 7, 4, 1, 0][frame], [16, 16, 15, 12, 9, 13, 16, 16][frame]
        else:
            sway, length = s.sway(2), 16
        hanging_tail(c, (cx, 12 + by), min(length, g - 16 - by), sway)
    return c.finish()


def _dog_face(form, state, frame, south):
    if state == "dig":
        im = _dog_face(form, "forage", frame, south)
        cx = WIDTH["dog"] // 2
        # From the front the earth goes up over the back; from behind it comes
        # out between the hind legs at us.
        for away in (-1, 1):
            throw_earth(im, (cx + away * 2, GROUND["dog"] - (8 if south else 1)), (frame + (away > 0) * 4) % 8, away, HEADROOM["dog"],
                        hole=(cx, GROUND["dog"]) if south and away < 0 else None)
        return im
    return _dog_face_(form, state, frame, south)


def _dog_face_(form, state, frame, south):
    c = Canvas("dog")
    hound = form == "hound"
    g, cx = GROUND["dog"], 16
    s = Stride(state, frame, walk=(2.4, 2.0, 0.5), run=(4.4, 3.2, 0.36), phases=TROT, bounce=1.6)
    by = _by(s)
    beat = frame % 2
    pant = state in {"idle", "wander"}
    marks = [(9, 6, 15, 13)]

    def head(hy, low=False, asleep=False):
        if hound:
            for sgn in (-1, 1):
                x = cx + sgn * 5
                lift = 1 if s.moving and frame % 4 in (1, 2) else 0
                out = 2 if south else 1
                c.paint(flat(polygon([(x, hy + 1), (x + sgn * out, hy + 2), (x + sgn * (out + lift), hy + 8 - lift), (x, hy + 6)]), "d"))
        else:
            for sgn in (-1, 1):
                x = cx + sgn * 4
                tipx = x + sgn * (1 + (1 if s.flick and sgn > 0 else 0) + (2 if s.running else 0))
                tipy = hy - 4 + (3 if s.running else 0)
                c.paint(flat(polygon([(x - sgn * 2, hy + 1), (tipx, tipy), (x + sgn, hy + 3)]), "m"))
                c.dot(x, hy, "u")
        skull = ellipse((cx - 5, hy, cx + 5, hy + 8))
        c.paint(shade(skull, 1, 1))
        if south:
            muzzle = ellipse((cx - 3, hy + 5, cx + 3, hy + 10))
            c.paint(flat(muzzle, "b"))
            c.paint(flat(rect((cx - 1, hy + 5, cx, hy + 6)), "k"))
            for sgn in (-1, 1):
                c.dot(cx + sgn * 3 - (1 if sgn > 0 else 0), hy + 3, "d" if (s.blink or asleep) else "e")
            if pant and not low and not asleep:
                c.dot(cx - 1, hy + 9, "k")
                c.dot(cx, hy + 9, "k")
                c.paint(flat(rect((cx - 1, hy + 10, cx, hy + 10 + beat)), "u"))

    def tail_up(root_y):
        if hound:
            tip = (cx + (2 if beat else -2), root_y - 5)
            m = limb((cx, root_y), tip, 2)
        else:
            m = limb((cx, root_y), (cx + 1, root_y - 4), 2) | limb((cx + 1, root_y - 4), (cx + 3 + beat, root_y - 6), 2)
            tip = (cx + 3 + beat, root_y - 6)
        c.paint(shade(m, 1, 1))
        c.dot(tip[0], tip[1], "t")

    if state == "idle":  # sitting
        sweep = limb((cx + 5, g - 1), (cx + 10, g - 1 - (beat if frame < 6 else 0)), 2)
        if south:
            c.paint(shade(sweep, 1, 1))
            haunch = ellipse((8, g - 9, 24, g))
            chest = ellipse((10, g - 15, 22, g - 2 + s.breath))
            c.paint(lit(haunch | chest, 1, 2, (11, 21)))
            mark(c, haunch | chest, blobs([(9, g - 14, 15, g - 6)]))
            c.paint(flat(ellipse((13, g - 12, 19, g - 4)), "b"))
            for x in (13, 18):
                c.paint(flat(rect((x, g - 7, x + 1, g - 1)), "p"))
                c.paint(flat(rect((x, g, x + 1, g)), "k"))
            for x in (8, 22):
                c.paint(flat(rect((x, g - 1, x + 2, g)), "p"))
            head(g - 22 - (1 if frame in (4, 5) else 0))
        else:
            head(g - 21 - (1 if frame in (4, 5) else 0))
            body = ellipse((8, g - 10, 24, g)) | ellipse((10, g - 16, 22, g - 3))
            c.paint(lit(body, 1, 2, (11, 21)))
            mark(c, body, blobs([(9, g - 14, 15, g - 6)]))
            c.paint(shade(sweep, 1, 1))
            c.dot(cx + 10, g - 1 - (beat if frame < 6 else 0), "t")
        return c.finish()
    if state == "rest":
        thump = 1 if frame in (3, 4) else 0
        body = ellipse((7, g - 9 - s.breath, 25, g))
        if south:
            c.paint(lit(body, 1, 2, (10, 22)))
            mark(c, body, blobs([(9, g - 10, 15, g - 3)]))
            for x in (8, 21):
                c.paint(flat(rect((x, g - 1, x + 3, g)), "p"))
            s.flick = frame in (3, 4)
            head(g - 10, low=True, asleep=frame not in (3, 4))
        else:
            head(g - 13, low=True)
            c.paint(lit(body, 1, 2, (10, 22)))
            mark(c, body, blobs([(9, g - 10, 15, g - 3)]))
            c.paint(shade(limb((cx + 6, g - 2), (cx + 10, g - 1 - thump), 2), 1, 1))
            c.dot(cx + 10, g - 1 - thump, "t")
        return c.finish()

    sniff = state == "forage"
    if sniff:
        s.moving, s.amp, s.lift, s.stance, s.phases = True, 1.2, 1.4, 0.7, WALK
    hind, fore = ("nh", "fh"), ("ff", "nf")
    if s.running:  # both forefeet, then both hind: a bound, seen end-on
        hind, fore = ("nh", "nh"), ("nf", "nf")
    if south:
        face_legs(c, s, (13, 19), 13 + by, g, 2, False, hind, pad=1)
        if not hound:
            tail_up(8 + by)
        body = face_body(c, (10, 6 + by, 22, 16 + by), cx, marks)
        c.paint(flat(ellipse((13, 9 + by, 19, 16 + by)), "b"))
        face_legs(c, s, (12, 19), 13 + by, g, 2, True, fore, pad=1)
        if sniff:
            head(9 + [0, 1, 0, 1, 0, 1, 0, 1][frame], low=True)
        else:
            head(-1 + by + s.nod + (2 if s.running else 0))
    else:
        head(-1 + by + (2 if s.running else 0) + (6 if sniff else 0), low=sniff)
        face_legs(c, s, (13, 19), 13 + by, g, 2, False, fore, pad=1)
        body = face_body(c, (10, 6 + by, 22, 16 + by), cx, marks)
        face_legs(c, s, (12, 19), 12 + by, g, 2, True, hind, pad=1)
        if s.running and hound:
            hanging_tail(c, (cx, 9 + by), 5, 2 if beat else -2, 0)
        elif hound and not sniff and not s.moving:
            hanging_tail(c, (cx, 9 + by), 6, 1 if beat else -1, 0)
        else:
            tail_up(9 + by)
    return c.finish()


def _donkey_face(form, state, frame, south):
    c = Canvas("donkey")
    s = Stride(state, frame, walk=(2.6, 2.4, 0.62), run=(4.4, 3.8, 0.42), bounce=1.4)
    g, cx = GROUND["donkey"], 20
    rest = state == "rest"
    by = (g - 26) if rest else _by(s)
    graze = [0, 5, 12, 12, 12, 12, 5, 0][frame] if state == "graze" else 0
    chew = state == "graze" and frame in (3, 5)

    def ears(hy, back=False):
        f = frame
        for sgn, swivel in ((-1, state == "idle" and f in (5, 6)), (1, state in {"idle", "graze"} and f in (2, 3))):
            x = cx + sgn * 3
            if s.running:
                tip = (x + sgn * 5, hy - 2)
            elif swivel:
                tip = (x + sgn * 5, hy - 5)
            else:
                tip = (x + sgn * 2, hy - 9)
            ear = polygon([(x - sgn, hy + 1), tip, (x + sgn * 2, hy + 2)])
            c.paint(flat(ear, "d" if back else "m"))
            if not back:
                for ex, ey in line((x, hy), (tip[0], tip[1] + 2), 1):
                    if (ex, ey) in ear:
                        c.dot(ex, ey, "u")
            c.dot(tip[0], tip[1], "t")

    if south:
        if not rest:
            face_legs(c, s, (16, 24), 21 + by, g, 2, False, ("nh", "fh"), pied=False)
        body = face_body(c, (11, 12 + by, 29, 25 + by), cx)
        for x, y in body:
            if (x, y + 1) not in body and 14 <= x <= 26:
                c.px[(x, y)] = "b"
        if not rest:
            face_legs(c, s, (15, 25), 20 + by, g, 3, True, ("ff", "nf"), pied=False)
        else:
            for x in (12, 24):
                c.paint(shade(rect((x, g - 3, x + 4, g - 1)), 1, 1))
        hy = 3 + by + graze + s.nod + (1 if s.running else 0)
        neck = polygon([(cx - 3, hy + 4), (cx + 3, hy + 4), (cx + 6, 15 + by), (cx - 6, 15 + by)]) if not graze else set()
        if neck:
            npx = shade(neck, 1, 0)
            for x, y in neck:
                if (x - 1, y) not in neck or (x + 1, y) not in neck:
                    npx[(x, y)] = "d"
            c.paint(npx)
        ears(hy)
        c.paint(flat(rect((cx - 1, hy - 1, cx, hy + 1)), "t"))
        head_ = ellipse((cx - 5, hy, cx + 5, hy + 10))
        c.paint(shade(head_, 1, 1))
        muzzle = ellipse((cx - 4, hy + 8, cx + 4, hy + 15 + (1 if chew else 0)))
        c.paint(flat(muzzle, "b"))
        c.dot(cx - 2, hy + 12, "k")
        c.dot(cx + 2, hy + 12, "k")
        for sgn in (-1, 1):
            ex = cx + sgn * 4 - (1 if sgn > 0 else 0)
            c.dot(ex, hy + 4, "b")
            c.dot(ex, hy + 5, "d" if s.blink else "e")
    else:
        hy = 9 + by
        if not graze:
            c.paint(shade(ellipse((cx - 4, hy - 3, cx + 4, hy + 6)), 1, 1))
            ears(hy - 2, back=True)
            c.paint(flat(rect((cx - 1, hy - 4, cx, hy)), "t"))
        if not rest:
            face_legs(c, s, (16, 24), 21 + by, g, 2, False, ("ff", "nf"), pied=False)
        body = face_body(c, (11, 11 + by, 29, 25 + by), cx)
        for y in range(11 + by, 17 + by):  # the stripe down the spine
            c.dot(cx, y, "t")
            c.dot(cx - 1, y, "t")
        if not rest:
            face_legs(c, s, (15, 25), 20 + by, g, 3, True, ("nh", "fh"), pied=False)
        if s.running:
            sway, length = round(2 * math.sin(2 * math.pi * s.t)), 5
        elif state == "idle":
            sway, length = [0, 0, 1, 3, 4, 2, 0, 0][frame], [11, 11, 11, 9, 8, 10, 11, 11][frame]
        else:
            sway, length = s.sway(2), 11
        hanging_tail(c, (cx, 14 + by), min(length, g - 18 - by), sway)
    return c.finish()


def _camel_face(form, state, frame, south):
    c = Canvas("camel")
    two = form == "bactrian"
    s = Stride(state, frame, walk=(3.6, 3.0, 0.62), run=(5.6, 4.0, 0.46), phases=PACE,
               run_phases={"fh": 0.0, "ff": 0.1, "nh": 0.5, "nf": 0.6}, bounce=1.2)
    g, cx = GROUND["camel"], 27
    rest = state == "rest"
    by = (g - 35) if rest else _by(s)
    # a pacing camel rolls from side to side, and you see it best end-on
    roll = round(math.sin(2 * math.pi * s.t)) if s.moving else 0
    graze = [0, 10, 26, 26, 26, 26, 10, 0][frame] if state == "graze" else 0
    chew = state in {"idle", "graze", "rest"} and frame in (1, 2, 5, 6)
    jaw = (1 if frame in (1, 2) else -1) if chew else 0

    def humps():
        if two:
            back = ellipse((21 + roll, 5 + by, 33 + roll, 20 + by))
            c.paint(lit(back, 1, 1))
            for x, y in back:
                if (x, y - 1) not in back or (x, y - 2) not in back:
                    c.dot(x, y, "t")
        front = ellipse((20 + roll, 8 + by, 34 + roll, 24 + by))
        c.paint(lit(front, 1, 1, (23, 31)))
        if two:
            for x, y in front:
                if (x, y - 1) not in front or (x, y - 2) not in front:
                    c.dot(x, y, "t")

    if south:
        if not rest:
            face_legs(c, s, (23, 31), 30 + by, g, 2, False, ("nh", "fh"), pied=False, pad=1)
        humps()
        face_body(c, (17 + roll, 18 + by, 37 + roll, 34 + by), cx + roll)
        if not rest:
            face_legs(c, s, (21, 33), 30 + by, g, 3, True, ("ff", "nf"), pied=False, pad=1)
            c.paint(flat(rect((cx - 3, 33 + by, cx + 3, 34 + by)), "d"))
        else:
            for x in (16, 32):
                c.paint(shade(rect((x, g - 3, x + 6, g - 1)), 1, 1))
        bob = round(math.sin(2 * math.pi * (2 * s.t + 0.2))) if s.moving else 0
        hy = 3 + by + graze + bob + (2 if rest else 0)
        neck = limb((cx + roll, 29 + by), (cx + roll, hy + 8), 5)
        npx = shade(neck, 0, 0)
        for x, y in neck:
            if (x - 1, y) not in neck or (x + 1, y) not in neck:
                npx[(x, y)] = "d"
        c.paint(npx)
        if two:
            for y in range(max(hy + 12, 18 + by), 30 + by):
                c.dot(cx + roll, y, "t")
        hx = cx + roll
        for sgn in (-1, 1):
            flick = 1 if s.flick and sgn > 0 else 0
            c.paint(flat(polygon([(hx + sgn * 3, hy + 2), (hx + sgn * (6 + flick), hy + 1 - flick), (hx + sgn * 5, hy + 4)]), "d"))
        skull = ellipse((hx - 4, hy, hx + 4, hy + 8))
        c.paint(shade(skull, 1, 1))
        muzzle = ellipse((hx - 3 + jaw, hy + 6, hx + 3 + jaw, hy + 12))
        c.paint(shade(muzzle, 0, 1))
        c.paint(flat(rect((hx + jaw, hy + 9, hx + jaw, hy + 11)), "k"))
        c.dot(hx - 2, hy + 8, "k")
        c.dot(hx + 2, hy + 8, "k")
        for sgn in (-1, 1):
            c.dot(hx + sgn * 3, hy + 3, "h")
            c.dot(hx + sgn * 3, hy + 4, "d" if s.blink else "e")
    else:
        if not graze:
            hy = 2 + by + (2 if rest else 0)
            hx = cx + roll
            for sgn in (-1, 1):
                c.paint(flat(polygon([(hx + sgn * 2, hy + 2), (hx + sgn * 5, hy + 1), (hx + sgn * 4, hy + 4)]), "d"))
            c.paint(shade(ellipse((hx - 3, hy, hx + 3, hy + 7)), 1, 1))
            c.paint(shade(limb((hx, hy + 6), (hx, 14 + by), 4), 0, 0))
        if not rest:
            face_legs(c, s, (23, 31), 30 + by, g, 2, False, ("ff", "nf"), pied=False, pad=1)
        humps()
        face_body(c, (18 + roll, 18 + by, 36 + roll, 34 + by), cx + roll)
        if not rest:
            face_legs(c, s, (21, 33), 29 + by, g, 3, True, ("nh", "fh"), pied=False, pad=1)
        else:
            for x in (16, 32):
                c.paint(shade(rect((x, g - 3, x + 6, g - 1)), 1, 1))
        sway = s.sway(2) if s.moving else (2 if state == "idle" and frame in (3, 4) else 0)
        hanging_tail(c, (cx + roll, 21 + by), min(9, g - 25 - by), sway, 2)
    return c.finish()


# ----------------------------------------------------------------------- cat
def _stripes(c, region, top, every=3, lean=0):
    """Mackerel tabby: thin dark bands down the flank from the spine, on body
    tones only, so the white of a bicolour stays clean."""
    for x, y in region:
        if c.px.get((x, y)) in ("m", "l", "h") and (x + (y - top) * lean) % every == 0 and y <= top + 5:
            c.px[(x, y)] = "a"


def _tail(c, pts, tip_role="t", width=2):
    mask = set()
    for a, b in zip(pts, pts[1:]):
        mask |= limb(a, b, width)
    c.paint(shade(mask, 1, 1))
    # a ringed tail: the last joint and the tip dark
    for x, y in limb(pts[-2], pts[-1], width):
        if (x + y) % 2 == 0:
            c.px[(x, y)] = "a"
    c.dot(*pts[-1], tip_role)


def _cat_head(c, x, y, s, low=False, back=False, look=0):
    """(x, y) is the top of the skull, facing east. A round skull, a short
    blunt muzzle, and ears set wide and upright: the ears are the cat."""
    skull = ellipse((x, y, x + 6, y + 6))
    muzzle = ellipse((x + 4, y + 3, x + 8, y + 6))
    tip = (0, 1) if back else (-1, 0) if s.flick else (0, 0)
    c.paint(flat(polygon([(x + 1, y + 2), (x + 1 + tip[0], y - 2 + tip[1]), (x + 3, y)]), "d"))  # far ear
    c.paint(shade(skull | muzzle, 1, 1))
    for mx, my in muzzle:
        if mx >= x + 6 and my >= y + 4:
            c.px[(mx, my)] = "b"
    c.dot(x + 8, y + 4, "u")                           # nose
    global CAT_MOUTH
    CAT_MOUTH = (x + 6, y + 6)
    c.dot(x + 2, y + 1, "a"); c.dot(x + 4, y + 1, "a")  # the M on the brow
    if s.blink:
        c.dot(x + 5, y + 3, "d"); c.dot(x + 6, y + 3, "d")
    else:
        c.dot(x + 5 + look, y + 3, "e"); c.dot(x + 6, y + 3, "e" if look else "k")
    ear = polygon([(x + 3, y + 1), (x + 4 + tip[0] * 2, y - 3 + tip[1] * 2), (x + 6, y + 1)])
    c.paint(flat(ear, "m"))
    c.dot(x + 4 + tip[0] * 2, y - 1 + tip[1], "u")


def cat(form, state, frame):
    """A house cat: small head, long back, a tail as long again. It walks with
    the tail up and hooked, stalks flat, and sits with it round its feet."""
    c = Canvas("cat")
    g = GROUND["cat"]
    if state == "idle":
        return _cat_sit(c, frame)
    if state == "rest":
        return _cat_loaf(c, frame)
    if state == "pounce":
        return _cat_pounce(c, form, frame)
    if state == "carry":
        im = cat(form, "wander", frame)
        _mouse_in_mouth(im, MOUSE_SIDE)
        return im
    chase = state == "chase"
    s = Stride("flee" if chase else "wander" if state == "forage" else state, frame, walk=(1.8, 1.6, 0.55), run=(3.6, 2.6, 0.34), phases=WALK, bounce=1.4)
    stalk = state == "stalk"
    prowl = state == "forage"
    reach = round(1.8 * math.sin(2 * math.pi * (s.t + 0.05))) if s.running else 0
    low = 2 if stalk else 0
    # stalking, the hips wiggle before the pounce
    wig = [0, 0, 0, 0, 0, 1, -1, 1][frame] if stalk else 0

    def put(key, hip, hind, near):
        dx, up = s.foot(key)
        if stalk:
            dx, up = walk_foot(s.t + WALK[key], 0.8, 0.8, 0.75)
        x = hip[0] + (0 if near else -1) + (-reach if hind else reach)
        y = hip[1] + (s.h if hind else s.f)
        leg(c, (x, y), (x + dx, g - up), *bones(y, g, hind), hind, near, 2, 1)

    hy = 9 + low
    put("fh", (8 + wig, hy), True, False)
    put("ff", (16, hy + (1 if stalk else 0)), False, False)
    if s.running:
        _tail(c, [(5 - reach, 8), (1 - reach, 7), (-3 - reach, 7 + (frame % 2))])
    elif prowl:  # level and questing, the tip curling
        _tail(c, [(5, 8 + s.h), (1, 8 + s.h), (-1, 6 + s.h - (frame // 2) % 2)])
    elif stalk:
        flick = [0, 1, 0, -1, 0, 1, 2, 1][frame]
        _tail(c, [(5 + wig, 9 + low), (1 + wig, 11 + low), (-2 + wig, 11 + low - flick)])
    else:
        sway = [0, 1, 1, 0, 0, -1, -1, 0][frame]
        _tail(c, [(5, 7 + s.h), (3, 3 + s.h), (3 + sway, -1 + s.h), (5 + sway, -3 + s.h)])
    loin = ellipse((4 - reach + wig, 5 + low + s.h, 13, 11 + low + s.h))
    # stalking, the shoulder blades stand up above the line of the back
    chest = ellipse((10, 5 + low + s.f - (1 if stalk else 0), 18 + reach, 11 + low + s.f + s.breath))
    body = loin | chest
    c.paint(lit(body, 1, 2, (6, 16)))
    _stripes(c, body, 5 + low, 3)
    mark(c, body, blobs([(12, 9 + low, 19, 13 + low)], s.f))
    if stalk:
        hx, hy2 = 17 + reach, 7 + low
    elif prowl:  # nose to the ground along the walls, where the mice run
        hx, hy2 = 17, 5 + s.f + [0, 1, 1, 0, 0, 1, 1, 0][frame]
    else:
        hx, hy2 = 16 + reach + (1 if s.running else 0), s.f + s.nod + (2 if s.running else 0)
    lay(c, polygon([(14, 6 + low + s.f), (18 + reach, 9 + low + s.f), (hx + 4, hy2 + 5), (hx + 1, hy2 + 2)]))
    _cat_head(c, hx, hy2, s, back=(s.running and not chase) or stalk)
    put("nh", (8 + wig, hy), True, True)
    put("nf", (16, hy + (1 if stalk else 0)), False, True)
    return c.finish()


# The spring, after the hips have wiggled: (loin, chest, head top-left, the
# fore and hind feet, the tail) per frame. Low and forward, not the fox's
# high arc: a cat covers the ground and lands with the forepaws on it.
CAT_POUNCE = {
    2: ((4, 6, 12, 11), (11, 1, 19, 7), (18, -3), ((21, 1), (20, 2)), ((3, 16), (4, 16)), [(5, 8), (1, 9), (-2, 9)]),
    3: ((7, -1, 15, 5), (13, -1, 21, 5), (21, -1), ((25, 5), (24, 6)), ((4, 5), (5, 6)), [(8, 1), (4, 0), (1, -1)]),
    4: ((9, 1, 17, 7), (15, 4, 22, 10), (22, 6), ((25, 14), (24, 15)), ((9, 9), (10, 10)), [(10, 2), (7, -1), (6, -4)]),
    5: ((9, 4, 17, 10), (15, 8, 22, 13), (22, 10), ((24, 16), (25, 16)), ((11, 16), (13, 16)), [(10, 5), (8, 1), (9, -3)]),
    6: ((8, 7, 16, 13), (14, 9, 22, 14), (21, 10), ((23, 16), (24, 16)), ((10, 16), (12, 16)), [(8, 9), (4, 10), (1, 8)]),
    7: ((8, 7, 16, 13), (14, 9, 22, 14), (21, 10), ((23, 16), (24, 16)), ((10, 16), (12, 16)), [(8, 9), (4, 10), (1, 6)]),
}


# A mouse held by the scruff, in fixed colours so no coat swap recolours it.
# (0, 0) is the cat's mouth.
MOUSE_SIDE = ["md..", "mmd.", ".mmd", "..tt"]
MOUSE_FRONT = [".mm.", "mmmd", "t..."]
MOUSE_COLOURS = {"m": "#7a6e60", "d": "#4d4439", "t": "#c49a92"}
CAT_MOUTH = (0, 0)


def _mouse_in_mouth(im, grid, ox=0):
    px = im.load()
    for y, row in enumerate(grid):
        for x, ch in enumerate(row):
            X, Y = CAT_MOUTH[0] + x + ox, CAT_MOUTH[1] + y + HEADROOM["cat"]
            if ch != "." and 0 <= X < im.width and 0 <= Y < im.height:
                col = MOUSE_COLOURS[ch]
                px[X, Y] = tuple(int(col[i:i + 2], 16) for i in (1, 3, 5)) + (255,)


def _cat_pounce(c, form, frame):
    """Two frames of the hips going, then the spring, the reach, and down with
    both forepaws on the mouse and the tail thrashing."""
    if frame < 2:
        return cat(form, "stalk", 5 + frame)
    s = Stride("idle", frame, (0, 0, 1), (0, 0, 1))
    s.flick = False
    g = GROUND["cat"]
    loin, chest, (hx, hy), fore, hind, tail = CAT_POUNCE[frame]
    if frame >= 3:  # the canvas is a stalking cat wide; the landing is drawn back into it
        loin, chest, hx = (loin[0] - 3, loin[1], loin[2] - 3, loin[3]), (chest[0] - 3, chest[1], chest[2] - 3, chest[3]), hx - 3
        fore, hind = tuple((x - 3, y) for x, y in fore), tuple((x - 3, y) for x, y in hind)
        tail = [(x - 3, y) for x, y in tail]
    hips, shoulders = ((loin[0] + loin[2]) / 2, loin[3] - 2), ((chest[0] + chest[2]) / 2 + 1, chest[3] - 1)
    for foot, near in zip(hind, (False, True)):
        leg(c, hips, foot, *bones(hips[1], g, True), True, near, 2, 1) if not near else None
    for foot, near in zip(fore, (False, True)):
        leg(c, shoulders, foot, *bones(shoulders[1], g, False), False, near, 2, 1) if not near else None
    _tail(c, tail)
    body = ellipse(loin) | ellipse(chest)
    c.paint(lit(body, 1, 2, (loin[0] + 2, chest[2] - 2)))
    _stripes(c, body, min(loin[1], chest[1]), 3)
    mark(c, body, blobs([(chest[0] + 2, chest[1] + 3, chest[2] + 1, chest[3] + 2)]))
    _cat_head(c, hx, hy, s, back=frame in (2, 3))
    leg(c, hips, hind[1], *bones(hips[1], g, True), True, True, 2, 1)
    leg(c, shoulders, fore[1], *bones(shoulders[1], g, False), False, True, 2, 1)
    return c.finish()


def _cat_sit(c, frame):
    """Upright on its haunches, forefeet together, tail laid round them. Every
    so often it washes: a forepaw comes up and the head bends to it."""
    s = Stride("idle", frame, (0, 0, 1), (0, 0, 1))
    g = GROUND["cat"]
    wash = frame in (5, 6, 7)
    tap = [0, 0, 1, 0, 0, 0, 0, 1][frame]
    haunch = ellipse((4, g - 8, 13, g))
    back = polygon([(7, g - 7), (12, g - 13), (16, g - 12 + s.breath), (16, g - 2), (10, g)])
    body = haunch | back
    c.paint(lit(body, 1, 2, (6, 15)))
    _stripes(c, body, g - 13, 3, 1)
    mark(c, body, blobs([(13, g - 12, 18, g - 1)]))
    c.paint(flat(rect((15, g - 6, 15, g - 1)), "r"))      # far foreleg
    if wash:
        c.paint(flat(limb((16, g - 7), (17, g - 11 - (frame == 6)), 2), "p"))
    else:
        c.paint(flat(rect((16, g - 6, 17, g - 1)), "p"))
        c.paint(flat(rect((16, g, 18, g)), "q"))
    c.paint(flat(rect((12, g - 1, 14, g)), "p"))          # hind paw under the haunch
    _tail(c, [(5, g - 1), (9, g), (15, g), (18, g - 1 - tap)])
    look = 1 if frame in (3, 4) else 0
    hx, hy = (13, g - 16) if wash else (12, g - 18 - look)
    s.blink = wash or frame == 1
    _cat_head(c, hx, hy, s, look=look)
    return c.finish()


def _cat_loaf(c, frame):
    """Folded into a loaf, paws tucked, eyes shut. An ear turns at a sound."""
    s = Stride("rest", frame, (0, 0, 1), (0, 0, 1))
    g = GROUND["cat"]
    body = ellipse((4, g - 8 - s.breath, 18, g))
    c.paint(lit(body, 1, 2, (6, 16)))
    _stripes(c, body, g - 8, 3)
    mark(c, body, blobs([(14, g - 5, 19, g)]))
    _tail(c, [(5, g - 1), (10, g), (17, g), (20, g - 1)])
    c.paint(flat(rect((16, g - 1, 18, g - 1)), "p"))
    s.blink = frame not in (3, 4)
    s.flick = frame in (3, 4)
    _cat_head(c, 13, g - 11, s)
    return c.finish()


def _cat_face(form, state, frame, south):
    if state == "carry":
        im = _cat_face(form, "wander", frame, south)
        if south:
            _mouse_in_mouth(im, MOUSE_FRONT, -1)
        return im
    if state == "pounce":
        from PIL import Image
        im = _cat_face(form, "stalk", 5 + min(frame, 1), south)
        rise = [0, 0, 3, 6, 3, 0, 0, 0][frame]
        out = Image.new("RGBA", im.size)
        out.paste(im, (0, -rise))
        out.info["anchor"] = im.info.get("anchor")
        return out
    c = Canvas("cat")
    g, cx = GROUND["cat"], 13
    chase = state == "chase"
    s = Stride("flee" if chase else "wander" if state == "forage" else state, frame, walk=(1.8, 1.6, 0.55), run=(3.6, 2.6, 0.34), phases=WALK, bounce=1.4)
    by = _by(s)

    def head(hy, asleep=False, flat_ears=False):
        for sgn in (-1, 1):
            x = cx + sgn * 3
            out = 2 if flat_ears else 1
            up = 1 if flat_ears else 4
            twitch = 1 if s.flick and sgn > 0 else 0
            tipx, tipy = x + sgn * (out + twitch), hy - up + twitch
            c.paint(flat(polygon([(x - sgn * 2, hy + 1), (tipx, tipy), (x + sgn * 2, hy + 2)]), "m"))
            if south:
                c.dot(tipx - sgn, tipy + 2, "u")
        skull = ellipse((cx - 4, hy, cx + 4, hy + 7))
        c.paint(shade(skull, 1, 1))
        if south:
            c.paint(flat(ellipse((cx - 2, hy + 4, cx + 2, hy + 7)), "b"))
            global CAT_MOUTH
            CAT_MOUTH = (cx - 1, hy + 7)
            c.dot(cx, hy + 4, "u")
            c.dot(cx - 1, hy + 1, "a"); c.dot(cx + 1, hy + 1, "a")
            for sgn in (-1, 1):
                ex = cx + sgn * 2
                if asleep or s.blink:
                    c.dot(ex, hy + 3, "d")
                else:
                    c.dot(ex, hy + 3, "e"); c.dot(ex, hy + 2, "e")
        else:
            for k in (-2, 0, 2):
                c.dot(cx + k, hy + 2, "a")

    def tail(pts):
        _tail(c, pts)

    if state == "idle":
        tap = [0, 0, 1, 0, 0, 0, 0, 1][frame]
        haunch = ellipse((cx - 6, g - 7, cx + 6, g))
        chest = ellipse((cx - 4, g - 12, cx + 4, g - 1 + s.breath))
        if not south:
            head(g - 19 - (1 if frame in (3, 4) else 0))
        c.paint(lit(haunch | chest, 1, 2, (cx - 3, cx + 3)))
        _stripes(c, haunch | chest, g - 12, 3, 0)
        if south:
            mark(c, haunch | chest, blobs([(cx - 3, g - 10, cx + 3, g)]))
            c.paint(flat(ellipse((cx - 2, g - 10, cx + 2, g - 4)), "b"))
            for x in (cx - 2, cx + 1):
                c.paint(flat(rect((x, g - 5, x + 1, g)), "p"))
            tail([(cx + 5, g - 1), (cx + 1, g), (cx - 4, g - tap)])
            s.blink = frame == 1
            head(g - 18 - (1 if frame in (3, 4) else 0))
        else:
            tail([(cx, g - 2), (cx + 5, g - 1), (cx + 8, g - 2 - tap)])
        return c.finish()
    if state == "rest":
        body = ellipse((cx - 7, g - 7 - s.breath, cx + 7, g))
        s.flick = frame in (3, 4)
        if not south:
            head(g - 11)
        c.paint(lit(body, 1, 2, (cx - 4, cx + 4)))
        _stripes(c, body, g - 7, 3, 0)
        tail([(cx + 6, g - 2), (cx + 2, g), (cx - 5, g - 1)] if south else [(cx - 6, g - 2), (cx - 2, g), (cx + 5, g - 1)])
        if south:
            mark(c, body, blobs([(cx - 3, g - 3, cx + 3, g)]))
            head(g - 10, asleep=frame not in (3, 4))
        return c.finish()
    stalk = state == "stalk"
    low = 3 if stalk else 0
    if stalk:
        s.moving, s.amp, s.lift, s.stance, s.phases = True, 0.8, 1.0, 0.75, WALK
    hind, fore = ("nh", "fh"), ("ff", "nf")
    if s.running:
        hind, fore = ("nh", "nh"), ("nf", "nf")
    # stalking head-on: the head drops below the hunched shoulders
    box = (cx - 5, 8 + by, cx + 5, 13 + by) if stalk else (cx - 4, 5 + by, cx + 4, 12 + by)
    sway = [0, 1, 1, 0, 0, -1, -1, 0][frame]
    if south:
        face_legs(c, s, (cx - 2, cx + 2), 10 + by + low, g, 1, False, hind)
        if not stalk and not s.running:
            tail([(cx, 6 + by), (cx + 1 + sway, 1 + by), (cx + 3 + sway, -2 + by)])
        body = face_body(c, box, cx)
        _stripes(c, body, box[1], 3, 0)
        mark(c, body, blobs([(cx - 3, box[1] + 2, cx + 3, box[3] + 1)]))
        c.paint(flat(ellipse((cx - 2, box[1] + 3, cx + 2, box[3])), "b"))
        face_legs(c, s, (cx - 2, cx + 2), 10 + by + low, g, 2, True, fore)
        head((box[1] if stalk else (1 if state == "forage" else -1) + by) + s.nod, flat_ears=s.running and not chase)
    else:
        head(box[1] - 3 if stalk else -1 + by + (1 if s.running else 0), flat_ears=s.running and not chase)
        face_legs(c, s, (cx - 2, cx + 2), 10 + by + low, g, 1, False, fore)
        body = face_body(c, box, cx)
        _stripes(c, body, box[1], 3, 0)
        face_legs(c, s, (cx - 2, cx + 2), 10 + by + low, g, 2, True, hind)
        if stalk:
            flick = [0, 1, 0, -1, 0, 1, 2, 1][frame]
            tail([(cx, 11 + by + low), (cx, 14 + low), (cx + flick, 15 + low)])
        elif s.running:
            tail([(cx, 8 + by), (cx + 1, 3 + by), (cx + (frame % 2), 0 + by)])
        else:
            tail([(cx, 7 + by), (cx + sway, 1 + by), (cx + 2 + sway, -3 + by)])
    return c.finish()



# --------------------------------------------------------------------- mouse
def mouse(form, state, frame):
    """A house mouse, drawn well over scale so it reads at all: a pear of a
    body, round ears, a nose that never stops, and a bare tail as long again.
    It runs in bursts and stops dead, and sits up to eat."""
    c = Canvas("mouse")
    g = GROUND["mouse"]
    nose = frame % 2
    if state == "idle":  # up on its haunches, turning a seed in its paws
        c.paint(flat(line((5, g), (2, g - 1), 1) | line((2, g - 1), (0, g - 3 + nose), 1), "u"))
        body = ellipse((4, g - 7, 10, g))
        c.paint(lit(body, 1, 1, (5, 8)))
        c.paint(flat(ellipse((7, g - 5, 10, g - 1)), "b"))
        hx, hy = 7, g - 11
        c.paint(shade(ellipse((hx, hy, hx + 5, hy + 4)) | polygon([(hx + 4, hy + 1), (hx + 7, hy + 3 + nose), (hx + 4, hy + 4)]), 1, 1))
        c.paint(flat(ellipse((hx - 1, hy - 2, hx + 2, hy + 1)), "u"))
        c.dot(hx, hy - 1, "d")
        c.dot(hx + 3, hy + 1, "d" if frame == 6 else "e")
        c.dot(hx + 7, hy + 3 + nose, "k")
        c.dot(10, g - 5 + (frame // 2) % 2, "u")  # paws at the mouth
        c.dot(9, g - 5 + (frame // 2) % 2, "t")
        c.paint(flat(rect((5, g, 7, g)), "u"))
        return c.finish()
    run = state == "flee"
    move = state in ("wander", "flee") or (state == "forage" and frame in (0, 1, 2))
    step = frame % 2 if move else 0
    stretch = 1 if run else 0
    bob = -step if move else 0
    wave = [0, 1, 0, -1][frame % 4] if not run else 0
    c.paint(flat(line((4, g - 2 + bob), (1, g - 2 + wave), 1) | line((1, g - 2 + wave), (-2, g - 1 + (0 if run else -wave)), 1), "u"))
    body = ellipse((3 - stretch, g - 6 + bob, 11 + stretch, g))
    c.paint(lit(body, 1, 1, (4, 9)))
    c.paint(flat({(x, y) for x, y in body if y >= g - 1}, "b"))
    low = 2 if state == "forage" and not move else 0
    hx, hy = 9 + stretch, g - 7 + bob + low
    c.paint(shade(ellipse((hx, hy, hx + 4, hy + 4)) | polygon([(hx + 3, hy + 1), (hx + 7, hy + 3 + nose), (hx + 3, hy + 4)]), 1, 1))
    ear = ellipse((hx - 1, hy - 2 + (1 if run else 0), hx + 2, hy + 1))
    c.paint(flat(ear, "u"))
    c.dot(hx, hy - 1 + (1 if run else 0), "d")
    c.dot(hx + 3, hy + 1, "e")
    c.dot(hx + 7, hy + 3 + nose, "k")
    for x, lift in ((4, step), (9 + stretch, 1 - step if move else 0)):
        c.paint(flat(rect((x, g - lift, x + 1, g - lift)), "u"))
    return c.finish()


def _mouse_face(form, state, frame, south):
    c = Canvas("mouse")
    g, cx = GROUND["mouse"], 7
    nose = frame % 2
    move = state in ("wander", "flee") or (state == "forage" and frame in (0, 1, 2))
    step = frame % 2 if move else 0
    up = state == "idle"
    if not south:
        wave = [0, 1, 0, -1][frame % 4]
        c.paint(flat(line((cx, g - 1), (cx + wave, g + 1), 1) | line((cx + wave, g + 1), (cx - wave, g + 3), 1), "u"))
    body = ellipse((cx - 4, g - (8 if up else 6) - step, cx + 4, g))
    c.paint(lit(body, 1, 1, (cx - 2, cx + 2)))
    hy = g - (11 if up else 8) - step + (2 if state == "forage" and not move else 0)
    for sgn in (-1, 1):
        c.paint(flat(ellipse((cx + sgn * 3 - 1, hy - 2, cx + sgn * 3 + 2, hy + 1)), "u"))
        c.dot(cx + sgn * 3, hy - 1, "d")
    c.paint(shade(ellipse((cx - 3, hy, cx + 3, hy + 5)), 1, 1))
    if south:
        c.dot(cx - 2, hy + 2, "e"); c.dot(cx + 2, hy + 2, "e")
        c.dot(cx, hy + 4 + nose, "k")
        if up:
            c.paint(flat(rect((cx - 1, hy + 6, cx + 1, hy + 6)), "u"))
        c.paint(flat(rect((cx - 3, g, cx - 2, g - step)) | rect((cx + 2, g - (1 - step if move else 0), cx + 3, g)), "u"))
    return c.finish()

FACE = {"cattle": _cattle_face, "water-buffalo": lambda f, st, fr, south: _cattle_face(f, st, fr, south, "water-buffalo"), "dog": _dog_face, "donkey": _donkey_face, "camel": _camel_face, "cat": _cat_face, "mouse": _mouse_face}
DIRECTIONS = ("south", "east", "north", "west")


def _mirror(im):
    from PIL import Image
    out = im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    out.info["anchor"] = im.info.get("anchor")
    return out


def draw(species, form, state, facing, frame):
    if facing == "east":
        return DRAW[species](form, state, frame)
    if facing == "west":
        return _mirror(DRAW[species](form, state, frame))
    return FACE[species](form, state, frame, facing == "south")


DRAW = {"cattle": cattle, "water-buffalo": lambda f, st, fr: cattle(f, st, fr, "water-buffalo"), "dog": dog, "donkey": donkey, "camel": camel, "cat": cat, "mouse": mouse}


def fauna_d():
    """Frames for set C's atlas: four facings. The first form of a species
    takes the plain species name, so everything that knows nothing of forms
    still finds it."""
    result = {}
    for species, states in STATES.items():
        for i, form in enumerate(FORMS[species]):
            name = species if i == 0 else f"{species}.{form}"
            for state, count in states.items():
                for facing in DIRECTIONS:
                    for frame in range(count):
                        result[f"faunac-{name}-{state}-{facing}-{frame}"] = draw(species, form, state, facing, frame)
    return result


def looks():
    """What studies.json tells the renderer about forms and coats."""
    return {
        species: {
            "roles": PALETTES[species],
            "forms": [
                {"id": form, "weight": spec["weight"], "where": spec.get("where"), "coats": COAT_WEIGHTS[species][form]}
                for form, spec in FORMS[species].items()
            ],
            "coats": {coat: palette for coat, palette in COATS[species].items()},
            "coatFrom": COAT_FROM.get(species, {}),
        }
        for species in STATES
    }
