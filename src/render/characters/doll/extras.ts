import type { InfantCarry } from "../../../content/characters/wardrobe/regions/work-dress";
import { ACCENT, APRON, BLUSH, CLOAK, EYE, H, HAIR, KERCHIEF, LEATHER, LIP, LOWER, METAL, Mask, SHAWL, SKIN, STEEL, TOP, TRIM, W, WHITE, WOOD, rnd, type Sheet } from "./paint";

/** What the accessories need of the figure: its facing, its rows and widths,
 * and where its centre line runs at each height. */
export type Figure = {
  s: Sheet;
  cos: number;
  sin: number;
  sx: 1 | -1;
  yOf: (y: number) => number;
  centre: (y: number) => number;
  hip: number;
  shoulder: number;
  leg: number;
  shoulderW: number;
  waistW: number;
  bellyD: number;
  chestD: number;
  /** Screen offset of loose cloth's free end, by how far down it hangs (0 to 1). */
  drift: (f: number) => number;
  /** Renderer G: loose ends flutter. */
  refined?: boolean;
};

const away = (f: Figure) => f.cos < -0.1;
/** Screen x of a point on the body's surface: `lx` across, `fz` forward. */
const sideX = (f: Figure, y: number, lx: number, fz: number) => f.centre(y) + lx * f.cos + fz * f.sx * f.sin;
/** How near the viewer that point is; negative is behind the body. */
const near = (f: Figure, lx: number, fz: number) => -lx * f.sx * f.sin + fz * f.cos;

/** Over the front: a waist apron of linen, a smith's leather bib on a neck
 * strap, a bibbed pinafore, or denim overalls in the trouser cloth. */
export function apron(f: Figure, kind: "cloth" | "leather" | "pinafore" | "overalls") {
  if (kind === "pinafore" || kind === "overalls") return bib(f, kind);
  const { s, yOf } = f;
  const mat = kind === "leather" ? LEATHER : APRON;
  const waist = f.hip + 1;
  if (away(f)) {
    // From behind only the ties show, knotted at the small of the back.
    const c = f.centre(waist);
    const ties = new Mask().span(yOf(waist), rnd(c - 1), rnd(c + 1)).set(rnd(c - 1), yOf(waist) + 1).set(rnd(c + 1), yOf(waist) + 1);
    s.put(ties, mat, { ring: "line", shade: 0.3 });
    return;
  }
  const bottom = 2 + Math.round(f.leg * (kind === "leather" ? 0.4 : 0.35));
  const top = kind === "leather" ? f.shoulder - 2 : waist;
  const m = new Mask();
  for (let y = top; y >= bottom; y--) {
    const bib = y > waist;
    const half = Math.max(0.6, (bib ? f.waistW - 2 : f.waistW - 0.8 + (waist - y) * 0.08) * f.cos);
    // The skirt of the apron swings with the stride; the bib stays put.
    const c = sideX(f, y, 0, (y > f.hip ? f.chestD : f.bellyD) * 0.9) + (y < waist ? f.drift((waist - y) / Math.max(1, waist - bottom)) * 0.6 : 0);
    m.span(yOf(y), rnd(c - half + 0.5), rnd(c + half - 0.5));
  }
  s.put(m, mat, {
    ring: "ink",
    shade: 0.3,
    light: kind === "leather" ? 0.25 : 0.15,
    bottom: true,
    // One fold down the cloth; the leather hangs stiff.
    tone: (x, y, t) => (kind === "cloth" && t === 3 && x === rnd(sideX(f, f.hip, 0, f.bellyD) + 0.5 * s.key) && y > yOf(waist) + 1 ? 2 : t),
  });
  // The strings round the waist, and a leather bib's neck strap.
  const strings = new Mask();
  const w = Math.hypot(f.waistW * f.cos, f.bellyD * f.sin);
  const c = f.centre(waist);
  strings.span(yOf(waist), rnd(c - w + 0.5), rnd(c + w - 0.5));
  if (kind === "leather" && f.cos > 0.3)
    for (const side of [-1, 1]) {
      const x = rnd(sideX(f, f.shoulder, side * (f.waistW - 2.5), f.chestD * 0.9));
      strings.set(x, yOf(f.shoulder)).set(x, yOf(f.shoulder - 1));
    }
  strings.minus(m);
  s.put(strings, mat, { ring: "none", shade: 0, dark: 1 });
}

/** A bib to the chest on two straps: the wrap pinafore falls to the knee over
 * the skirt; overalls stop at the waist, the trousers below being the same cloth. */
function bib(f: Figure, kind: "pinafore" | "overalls") {
  const { s, yOf } = f;
  const mat = kind === "overalls" ? LOWER : APRON;
  const waist = f.hip + 1;
  const chest = f.shoulder - 2;
  const straps = new Mask();
  if (away(f)) {
    // The straps cross between the shoulder blades.
    for (const side of [-1, 1])
      straps.line(sideX(f, f.shoulder, side * (f.waistW - 2), -f.chestD), yOf(f.shoulder), sideX(f, waist, -side * (f.waistW - 2), -f.bellyD), yOf(waist), 1);
    if (kind === "pinafore") {
      const c = f.centre(waist);
      straps.span(yOf(waist), rnd(c - 1), rnd(c + 1)).set(rnd(c - 1), yOf(waist) + 1).set(rnd(c + 1), yOf(waist) + 1);
    }
    s.put(straps, mat, { ring: "line", shade: 0.3 });
    return;
  }
  const bottom = kind === "pinafore" ? 2 + Math.round(f.leg * 0.4) : waist;
  const m = new Mask();
  for (let y = chest; y >= bottom; y--) {
    const half = Math.max(0.6, (y > waist ? f.waistW - (kind === "overalls" ? 2.2 : 1.4) : f.waistW - 0.4 + (waist - y) * 0.1) * f.cos);
    const c = sideX(f, y, 0, (y > f.hip ? f.chestD : f.bellyD) * 0.95) + (y < waist ? f.drift((waist - y) / Math.max(1, waist - bottom)) * 0.5 : 0);
    m.span(yOf(y), rnd(c - half + 0.5), rnd(c + half - 0.5));
  }
  s.put(m, mat, {
    ring: "ink",
    shade: 0.3,
    light: 0.15,
    bottom: kind === "pinafore",
    // A small print on the pinafore; the overalls' bib pocket.
    tone: (x, y, t) =>
      kind === "pinafore" ? (t >= 3 && (x * 3 + y * 2) % 7 === 0 ? 2 : t)
      : y === yOf(chest - 2) && Math.abs(x + 0.5 - sideX(f, chest - 2, 0, f.chestD)) < 1.6 ? Math.min(t, 2) : t,
  });
  for (const side of [-1, 1]) {
    const x = rnd(sideX(f, f.shoulder, side * (f.waistW - 2), f.chestD * 0.9));
    straps.set(x, yOf(f.shoulder)).set(x, yOf(f.shoulder - 1));
    // Brass buttons where the straps meet the bib.
    if (kind === "overalls" && f.cos > 0.5) s.px(rnd(sideX(f, chest, side * (f.waistW - 2.6), f.chestD)), yOf(chest), METAL, 4);
  }
  straps.minus(m);
  s.put(straps, mat, { ring: "none", shade: 0, dark: 1 });
}

/** A purse hung from the belt, or a satchel on a strap across the body. */
export function bag(f: Figure, kind: "purse" | "satchel") {
  const { s, yOf } = f;
  const lx = f.waistW + 0.2;
  if (near(f, lx, 0) < -2) return;
  const strap = new Mask();
  if (kind === "satchel") {
    // Over the right shoulder, across to the left hip, in front and behind alike.
    const from = [sideX(f, f.shoulder, -(f.shoulderW - 1.5), f.chestD * (away(f) ? -1 : 1)), yOf(f.shoulder)] as const;
    const to = [sideX(f, f.hip + 1, lx - 0.5, 0), yOf(f.hip + 1)] as const;
    strap.line(from[0], from[1], to[0], to[1], 1);
  }
  const x = sideX(f, f.hip, lx, 0);
  const size = kind === "satchel" ? [4, 4] : [3, 3];
  const y0 = yOf(f.hip + (kind === "satchel" ? 1 : 0)) + 1;
  const body = new Mask().rect(rnd(x - size[0] / 2 + 0.5), y0, rnd(x - size[0] / 2 + 0.5) + size[0] - 1, y0 + size[1] - 1);
  s.put(strap, LEATHER, { ring: "none", shade: 0, dark: 1 });
  s.put(body, LEATHER, {
    ring: "ink",
    shade: 0.4,
    light: 0.3,
    // The flap over the top, and a buckle on a satchel's.
    tone: (_x, y, t) => (y === y0 ? 2 : t),
  });
  if (kind === "satchel") s.px(rnd(x), y0 + 1, METAL, 4);
}

export type InfantMood = "asleep" | "watching" | "fussing" | "crying";

/** A baby tied on the back in a cloth. "behind" is the bundle, painted before
 * the garment so the body covers it unless seen from behind; "over" is the
 * baby's head at the shoulder and the cloth's ends knotted on the chest, and
 * goes after the mother's head when her back is turned. The mood is in the
 * head: sunk in the cloth asleep, up over the shoulder awake, an arm out when
 * fussing, thrown back with a fist up when crying. */
export function infant(f: Figure, layer: "under" | "behind" | "over", mood: InfantMood = "asleep", carry: InfantCarry = "back") {
  if (carry === "pram") return pram(f, layer, mood);
  if (layer === "under") return;
  if (carry === "board") return cradleboard(f, layer, mood);
  if (carry !== "back") return inFront(f, layer, mood, carry);
  const { s, yOf } = f;
  const back = away(f);
  const top = f.shoulder - 1;
  const upset = mood === "fussing" || mood === "crying";
  if (layer === "behind") {
    const m = new Mask();
    let low = [0, 0];
    for (let y = f.hip; y <= top; y++) {
      const u = Math.sin((Math.PI * (y - f.hip + 1)) / (top - f.hip + 2));
      const half = f.waistW * (0.7 + 0.3 * u),
        depth = 1 + 1.4 * u;
      const c = sideX(f, y, 0, -(f.chestD + depth * 0.6));
      const w = Math.hypot(half * f.cos, depth * f.sin);
      m.span(yOf(y), rnd(c - w + 0.5), rnd(c + w - 0.5));
      if (y === f.hip + 1) low = [rnd(c - w + 0.5), rnd(c + w - 0.5)];
    }
    s.put(m, TRIM, { ring: "ink", shade: 0.35, light: 0.2, top: true, bottom: true });
    // Feet out of the cloth at either hip; one kicks when the baby is upset.
    if (back) {
      const feet = new Mask().set(low[0] - 1, yOf(f.hip + 1)).set(low[1] + 1, yOf(f.hip + 1) - (upset ? 1 : 0));
      s.put(feet, SKIN, { ring: "ink", shade: 0 });
    }
    return;
  }
  // The head rides high on one side, cheek against the mother's back.
  const x0 = rnd(sideX(f, top, back ? -(f.shoulderW - 2.5) : -(f.shoulderW + 0.5), -(f.chestD + 0.8))),
    y = yOf(top) - (back ? 2 : 4) + (mood === "asleep" ? 1 : mood === "crying" ? -2 : -1);
  const side = x0 < f.centre(top) ? -1 : 1;
  // Awake, the head comes out past the mother's own to see round her.
  const x = x0 + (mood === "asleep" || back ? 0 : side * 2);
  const out = side;
  if (upset) {
    const arm = new Mask().line(x + out * 2, y + 3, x + out * 3, y + (mood === "crying" ? 0 : 2), 1);
    s.put(arm, SKIN, { ring: "ink", shade: 0 });
  }
  const head = new Mask().span(y, x - 1, x + 1).span(y + 1, x - 2, x + 2).span(y + 2, x - 2, x + 2).span(y + 3, x - 2, x + 2).span(y + 4, x - 1, x + 1);
  // From behind a waking baby has turned to look out past the mother's arm.
  const turned = back && mood !== "asleep";
  s.put(head, back ? HAIR : SKIN, {
    ring: "ink", shade: 0.3, light: 0.2, top: true,
    zone: turned ? (px, py) => (py > y && (px - x) * out >= (mood === "crying" ? -2 : 1) ? SKIN : HAIR) : undefined,
  });
  if (!back) s.put(new Mask().span(y, x - 1, x + 1), HAIR, { ring: "none", shade: 0 });
  if (!back || turned) {
    const e = turned ? [x + out * 2] : [x - 1, x + 1];
    if (mood === "watching") for (const ex of e) s.px(ex, y + 2, EYE, 3);
    else for (const ex of e) s.retone(ex, y + 2, 1);
    if (mood === "crying") {
      s.px(turned ? x + out : x, y + 3, EYE, 3);
      for (const ex of e) s.px(ex, y + 3, BLUSH, 3);
    } else if (mood === "fussing") s.px(turned ? x + out : x, y + 3, LIP, 2);
  }
  // Asleep, the cloth is pulled up round the head.
  if (mood === "asleep") s.put(new Mask().span(y + 3, x - 2, x + 2).span(y + 4, x - 1, x + 1), TRIM, { ring: "none", shade: 0.3, light: 0.2 });
  if (f.cos < 0.3) return;
  const knot = [sideX(f, f.shoulder - 3, 0, f.chestD), yOf(f.shoulder - 3)] as const;
  const ties = new Mask();
  for (const side of [-1, 1]) ties.line(sideX(f, f.shoulder, side * (f.shoulderW - 1), f.chestD * 0.6), yOf(f.shoulder), knot[0], knot[1], 1);
  s.put(ties, TRIM, { ring: "none", shade: 0, dark: 1 });
}

/** A baby's face, five pixels across, looking out at the viewer. */
function babyFace(f: Figure, x: number, y: number, mood: InfantMood) {
  const { s } = f;
  const head = new Mask().span(y, x - 1, x + 1).span(y + 1, x - 2, x + 2).span(y + 2, x - 2, x + 2).span(y + 3, x - 2, x + 2).span(y + 4, x - 1, x + 1);
  s.put(head, SKIN, { ring: "ink", shade: 0.3, light: 0.2, top: true });
  s.put(new Mask().span(y, x - 1, x + 1), HAIR, { ring: "none", shade: 0 });
  for (const ex of [x - 1, x + 1]) {
    if (mood === "watching") s.px(ex, y + 2, EYE, 3);
    else s.retone(ex, y + 2, 1);
    if (mood === "crying") s.px(ex, y + 3, BLUSH, 3);
  }
  if (mood === "crying") s.px(x, y + 3, EYE, 3);
  else if (mood === "fussing") s.px(x, y + 3, LIP, 2);
}

/** Laced to a board carried on the back: the baby looks out behind, under a
 * hoop that keeps the sun and a fall off its face. Its arms are laced in, so
 * the mood is all in the face. */
function cradleboard(f: Figure, layer: "behind" | "over", mood: InfantMood) {
  const { s, yOf } = f;
  const back = away(f);
  const top = f.shoulder + 3;
  const at = (y: number) => sideX(f, Math.min(y, f.shoulder), 0, -(f.chestD + 1.6));
  const half = (y: number) => Math.hypot((f.waistW * 0.72 - (y > f.shoulder + 1 ? 1 : 0)) * f.cos, 1.2 * f.sin);
  if (layer === "behind") {
    const m = new Mask();
    for (let y = f.hip - 1; y <= top; y++) m.span(yOf(y), rnd(at(y) - half(y) + 0.5), rnd(at(y) + half(y) - 0.5));
    s.put(m, WOOD, { ring: "ink", shade: 0.35, light: 0.2, top: true });
    return;
  }
  if (!back) {
    if (f.cos < 0.3) return;
    for (const side of [-1, 1]) {
      const x = sideX(f, f.shoulder, side * (f.shoulderW - 2), f.chestD * 0.8);
      s.put(new Mask().line(x, yOf(f.shoulder), x, yOf(f.shoulder - 4), 1), LEATHER, { ring: "none", shade: 0, dark: 1 });
    }
    return;
  }
  const c = rnd(at(f.hip)), w = Math.max(1, rnd(half(f.hip)) - 1);
  const cover = new Mask();
  for (let y = f.hip; y <= f.shoulder - 3; y++) cover.span(yOf(y), c - w, c + w);
  // Lacing down the front of the cover.
  s.put(cover, LEATHER, { ring: "line", shade: 0.3, light: 0.2, tone: (x, y, t) => (x === c && (y & 1) ? 4 : t) });
  const hy = yOf(f.shoulder + 2);
  babyFace(f, c, hy, mood);
  s.put(new Mask().span(hy - 2, c - 2, c + 2).set(c - 3, hy - 1).set(c + 3, hy - 1), WOOD, { ring: "ink", shade: 0, light: 0.3 });
}

/** A pram pushed ahead: a deep body on four wheels, a hood at the handle end,
 * and the baby's face under it. Drawn beyond the pusher when their back is
 * turned and in front of them otherwise. */
function pram(f: Figure, layer: "under" | "behind" | "over", mood: InfantMood) {
  const { s, yOf } = f;
  const back = away(f);
  if (layer !== (back ? "under" : "over")) return;
  const ground = yOf(0) + rnd(f.cos * 3);
  const side = Math.abs(f.sin) > 0.5;
  const dir = f.sx * (f.sin >= 0 ? 1 : -1);
  const tyre = { ring: "ink", shade: 0.3 } as const;
  if (side) {
    // Seen from the side: the handle and hood nearest the pusher.
    const x0 = rnd(f.centre(0) + dir * (f.chestD + 4)), len = 13;
    const X = (i: number) => x0 + dir * i;
    const span = (m: Mask, y: number, i0: number, i1: number) => m.span(y, Math.min(X(i0), X(i1)), Math.max(X(i0), X(i1)));
    const body = new Mask();
    for (let r = 0; r < 6; r++) span(body, ground - 11 + r, r === 5 ? 1 : 0, len - 1 - (r === 5 ? 1 : 0));
    s.put(body, LEATHER, { ring: "ink", shade: 0.3, light: 0.25, top: true });
    const hood = new Mask();
    for (let r = 0; r < 5; r++) span(hood, ground - 16 + r, 0, 2 + r);
    s.put(hood, LEATHER, { ring: "ink", shade: 0.2, light: 0.3, top: true, dark: 1 });
    s.put(new Mask().line(X(0), ground - 13, X(-2), ground - 16, 1), STEEL, { ring: "none", shade: 0 });
    s.put(span(new Mask(), ground - 5, 2, len - 3), STEEL, { ring: "none", shade: 0 });
    for (const i of [2, len - 4]) {
      const wheel = new Mask();
      span(wheel, ground - 4, i, i + 1); span(wheel, ground - 3, i - 1, i + 2); span(wheel, ground - 2, i - 1, i + 2); span(wheel, ground - 1, i, i + 1);
      s.put(wheel, STEEL, tyre);
    }
    // Blanket, and the face on the pillow under the hood.
    for (let i = 7; i < len - 1; i++) s.px(X(i), ground - 11, WHITE, 3);
    const hx = X(4);
    s.px(hx, ground - 13, HAIR, 3); s.px(hx + dir, ground - 13, SKIN, 3); s.px(hx, ground - 12, SKIN, 3); s.px(hx + dir, ground - 12, SKIN, 3);
    s.px(hx + dir * 2, ground - 12, SKIN, 3); s.px(hx + dir * 2, ground - 13, SKIN, 3);
    if (mood === "watching") s.px(hx + dir, ground - 13, EYE, 3);
    else s.retone(hx + dir, ground - 13, 1);
    if (mood === "crying") s.px(hx + dir * 2, ground - 12, EYE, 3);
    if (mood === "fussing" || mood === "crying") s.put(new Mask().line(X(7), ground - 12, X(8), ground - (mood === "crying" ? 16 : 14), 1), SKIN, { ring: "ink", shade: 0 });
    return;
  }
  // End on. Coming toward the viewer the foot of the pram leads and the hood
  // stands behind it; going away, the hood's back is all there is to see.
  const c = rnd(f.centre(0)), top = ground - (back ? 15 : 11);
  const body = new Mask();
  for (let r = 0; r < 7; r++) body.span(top + r, c - 5 + (r === 6 ? 1 : 0), c + 5 - (r === 6 ? 1 : 0));
  const hood = new Mask().span(top - 5, c - 4, c + 4);
  for (let r = 1; r < 5; r++) hood.span(top - 5 + r, c - 5, c + 5);
  s.put(hood, LEATHER, { ring: "ink", shade: 0.2, light: 0.3, top: true, dark: 1 });
  if (!back) {
    babyFace(f, c, top - 4, mood);
    if (mood === "fussing" || mood === "crying") s.put(new Mask().line(c + 3, top - 1, c + 4, top - (mood === "crying" ? 6 : 4), 1), SKIN, { ring: "ink", shade: 0 });
  }
  s.put(body, LEATHER, { ring: "ink", shade: 0.3, light: 0.25, top: true });
  if (!back) for (let x = c - 4; x <= c + 4; x++) s.px(x, top, WHITE, 3);
  for (const x of [c - 5, c + 5]) s.put(new Mask().line(x, top + 7, x, top + 10, 1.6), STEEL, tyre);
}

/** Carried in front: astride the hip with an arm round it, or swaddled and
 * held across the chest. From behind only a hip baby's head shows. */
function inFront(f: Figure, layer: "behind" | "over", mood: InfantMood, carry: "hip" | "arms") {
  const { s, yOf } = f;
  const back = away(f);
  const upset = mood === "fussing" || mood === "crying";
  const lift = mood === "asleep" ? 1 : 0;
  if (carry === "hip") {
    const x = rnd(sideX(f, f.hip + 3, f.waistW + 1.5, back ? 0 : f.chestD * 0.4)), y = yOf(f.hip + 5);
    if (layer === "behind") {
      if (!back) return;
      s.put(new Mask().span(y - 4, x - 1, x + 1).span(y - 3, x - 2, x + 2).span(y - 2, x - 2, x + 2).span(y - 1, x - 1, x + 1), HAIR, { ring: "ink", shade: 0.3 });
      return;
    }
    if (back) return;
    const body = new Mask();
    for (let r = 0; r < 5; r++) body.span(y + r, x - 2, x + 1);
    // Bare, with a cloth round the middle, and a leg round the mother's waist.
    s.put(body, SKIN, { ring: "ink", shade: 0.3, zone: (_x, py) => (py >= y + 3 ? WHITE : SKIN) });
    const to = rnd(sideX(f, f.hip + 1, f.waistW - 2, f.chestD));
    s.put(new Mask().line(x, y + 4, to, y + 5, 1), SKIN, { ring: "ink", shade: 0 });
    if (upset) s.put(new Mask().line(x + 1, y, x + 3, y - (mood === "crying" ? 3 : 1), 1), SKIN, { ring: "ink", shade: 0 });
    babyFace(f, x, y - 5 + lift, mood);
    return;
  }
  if (layer === "behind" || back) return;
  // Swaddled: a banded bundle across the chest, the head in the crook of an arm.
  const row = f.shoulder - 5, cx = sideX(f, row, 0, f.chestD + 1), y = yOf(row);
  const span = Math.max(2, rnd(4 * Math.abs(f.cos) + 1.5));
  const end = f.sin * f.sx > 0.3 ? 1 : -1;
  const bundle = new Mask();
  for (let r = 0; r < 4; r++) bundle.span(y + r, rnd(cx - span + (r === 3 ? 1 : 0)), rnd(cx + span - (r === 0 ? 1 : 0)));
  s.put(bundle, WHITE, { ring: "ink", shade: 0.3, light: 0.2, zone: (px) => ((px - rnd(cx)) % 3 === 0 ? TRIM : WHITE) });
  // The arm under it.
  s.put(new Mask().span(y + 4, rnd(cx - span + 1), rnd(cx + span - 1)), SKIN, { ring: "ink", shade: 0.3 });
  const hx = rnd(cx + end * span);
  if (upset) s.put(new Mask().line(hx - end, y, hx - end * 2, y - (mood === "crying" ? 3 : 2), 1), SKIN, { ring: "ink", shade: 0 });
  babyFace(f, hx, y - 3 + lift, mood);
}

/** Rings of metal at each bare wrist. */
export function bangles(f: Figure, wrists: readonly (readonly [number, number])[]) {
  for (const [x, y] of wrists) {
    const wx = rnd(x),
      wy = Math.round(y) - 1;
    if (f.s.at(wx, wy)?.mat !== SKIN) continue;
    f.s.px(wx, wy, METAL, 4);
    if (f.s.at(wx + 1, wy)?.mat === SKIN) f.s.px(wx + 1, wy, METAL, 3);
  }
}

/** At the neck, over the garment: a pleated ruff, a cravat's fall of linen,
 * or a working neckerchief knotted at the throat. */
export function neckwear(f: Figure, kind: "ruff" | "cravat" | "neckerchief" | "necktie" | "bow-tie") {
  const { s, yOf } = f;
  const row = yOf(f.shoulder);
  const c = f.centre(f.shoulder) + f.sx * f.sin * f.chestD * 0.6;
  const m = new Mask();
  if (kind === "necktie" || kind === "bow-tie") {
    if (away(f)) return;
    // White collar points either side of the knot.
    if (f.cos > 0.5) s.put(new Mask().set(rnd(c - 1.5), row).set(rnd(c + 1.5), row), WHITE, { ring: "none", shade: 0 });
    if (kind === "bow-tie") m.span(row, rnd(c - 1.5), rnd(c + 1.5));
    else {
      m.set(rnd(c), row);
      // The blade widens to its point a hand above the belt.
      const len = Math.max(3, f.shoulder - f.hip - 3);
      for (let i = 1; i <= len; i++) m.set(rnd(c), row + i);
      if (f.cos > 0.5) m.set(rnd(c) + 1, row + len - 1);
    }
    s.put(m, KERCHIEF, { ring: "line", shade: 0.3, light: 0.3, tone: (x, y, t) => (kind === "bow-tie" && x === rnd(c) ? 2 : y === row && kind === "necktie" ? 2 : t) });
    return;
  }
  if (kind === "ruff") {
    const w = Math.hypot((f.shoulderW - 0.5) * f.cos, (f.chestD + 1) * f.sin);
    m.span(row - 1, rnd(c - w + 1.5), rnd(c + w - 1.5)).span(row, rnd(c - w + 0.5), rnd(c + w - 0.5)).span(row + 1, rnd(c - w + 1.5), rnd(c + w - 1.5));
    s.put(m, WHITE, { ring: "line", shade: 0, tone: (x, y, t) => (y >= row && (x + y) % 2 === 0 ? 2 : t) });
    return;
  }
  if (kind === "cravat") {
    if (away(f)) return;
    m.span(row, rnd(c - 1), rnd(c + 1)).span(row + 1, rnd(c - 0.5), rnd(c + 0.5)).span(row + 2, rnd(c - 0.5), rnd(c + 0.5));
    s.put(m, WHITE, { ring: "line", shade: 0.4, light: 0.3 });
    return;
  }
  const w = Math.hypot(3 * f.cos, (f.chestD - 0.5) * f.sin);
  const cc = f.centre(f.shoulder);
  m.span(row, rnd(cc - w + 0.5), rnd(cc + w - 0.5));
  // The point hangs at the front, or down the back when the knot is turned round.
  m.span(row + 1, rnd(c - 0.5), rnd(c + 0.5)).set(rnd(c + (f.refined ? f.drift(0.6) : 0)), row + 2);
  if (f.refined) m.set(rnd(c + f.drift(1)), row + 3);
  s.put(m, KERCHIEF, { ring: "line", shade: 0.3, light: 0.3 });
}

/** A length of cloth over the left shoulder and across the body: shawl,
 * stole, dupatta, the end of a sari, the plaid. */
export function shoulderCloth(f: Figure) {
  const { s, yOf } = f;
  const back = away(f);
  const from = [sideX(f, f.shoulder, f.shoulderW - 1, 0), yOf(f.shoulder) - 0.5] as const;
  const to = [sideX(f, f.hip, -(f.waistW - 0.5), f.bellyD * (back ? -0.8 : 0.8)), yOf(f.hip)] as const;
  const m = new Mask().line(from[0], from[1], to[0], to[1], 3);
  // Thrown back over the shoulder, it falls behind to the waist.
  const drop = [sideX(f, f.shoulder, f.shoulderW - 0.5, -f.chestD), yOf(f.shoulder)] as const;
  if (back) m.line(drop[0], drop[1], drop[0], yOf(f.hip + 1), 3);
  else m.rect(rnd(from[0] - 1), rnd(from[1]) - 1, rnd(from[0] + 1), rnd(from[1]) + 1);
  s.put(m, CLOAK, { ring: "line", shade: 0.4, light: 0.25, top: true, bottom: true });
}

/** One row of a mask between the outermost of some screen columns. */
const run = (m: Mask, y: number, xs: number[]) => m.span(y, rnd(Math.min(...xs)), rnd(Math.max(...xs)));

/** A shawl over the shoulders, pinned at the breast: its ends hang in front
 * and its point falls down the back, and all three swing behind a walk.
 * Striped like an Andean lliclla, or a paisley ground inside a border. */
export function shawl(f: Figure, kind: "plain" | "fringed" | "patterned", stripes: boolean) {
  const { s, yOf } = f;
  const m = new Mask();
  const wide = f.shoulderW + 1.2,
    D = f.chestD + 0.7;
  const pin = f.shoulder - 4,
    point = f.hip - 2,
    tail = f.hip + 1;
  for (let y = f.shoulder; y >= point; y--) {
    const row = yOf(y);
    // Over the shoulders it wraps the whole body.
    if (y >= f.shoulder - 1) {
      run(m, row, [sideX(f, y, -wide, -D), sideX(f, y, wide, -D), sideX(f, y, -wide, D), sideX(f, y, wide, D)]);
      continue;
    }
    // Down the upper arms.
    if (y >= f.shoulder - 4)
      for (const side of [-1, 1]) if (near(f, side * wide, 0) > -1) run(m, row, [sideX(f, y, side * wide, -D), sideX(f, y, side * (wide - 1.5), D)]);
    // The point down the back.
    if (f.cos < 0.6) {
      const k = (f.shoulder - y) / (f.shoulder - point),
        hw = wide * (1 - k) + 0.4,
        dx = f.drift(k) * 0.8;
      run(m, row, [sideX(f, y, -hw, -D) + dx, sideX(f, y, hw, -D) + dx]);
    }
    if (away(f)) continue;
    if (y >= pin) {
      // Two fronts closing to the pin, the dress showing in the V above it.
      const gap = (y - pin) * 0.9,
        outer = Math.max(gap + 1.5, wide - (f.shoulder - y) * 0.9);
      for (const side of [-1, 1]) run(m, row, [sideX(f, y, side * gap, D), sideX(f, y, side * outer, D)]);
    } else if (y >= tail) {
      // The two ends below the pin, parting a little as they fall.
      const k = (pin - y) / Math.max(1, pin - tail),
        dx = f.drift(k);
      for (const side of [-1, 1]) run(m, row, [sideX(f, y, side * (0.3 + k * 0.6), D) + dx, sideX(f, y, side * (1.6 + k), D) + dx]);
    }
  }
  const edge = (x: number, y: number) => !m.has(x - 1, y) || !m.has(x + 1, y) || !m.has(x, y + 1);
  s.put(m, SHAWL, {
    shade: 0.36,
    light: 0.22,
    top: true,
    bottom: true,
    zone: (x, y) =>
      kind !== "patterned" ? SHAWL
      : stripes ? (y % 3 === 0 ? TRIM : y % 3 === 1 && x % 2 === 0 ? ACCENT : SHAWL)
      : edge(x, y) ? TRIM
      : (x * 3 + y * 5) % 7 === 0 ? ACCENT
      : SHAWL,
  });
  if (!away(f)) s.px(rnd(sideX(f, pin, 0, D)), yOf(pin), METAL, 4);
  // Loose warp along the lower edges, below the shoulders.
  if (kind === "fringed" || (kind === "patterned" && !stripes)) {
    const fringe = new Mask();
    for (let y = yOf(f.shoulder - 3); y < H - 1; y++)
      for (let x = 0; x < W; x++) if (m.has(x, y) && !m.has(x, y + 1) && x % 2 === 0) fringe.set(x, y + 1);
    s.put(fringe, kind === "fringed" ? SHAWL : TRIM, { ring: "none", shade: 0, dark: 1 });
  }
}

/** A hood worn down. The medieval hood's cape lies over the shoulders with a
 * dagged edge, the bag of the hood bunched at the nape and its liripipe tail
 * swinging down the back; a hoodie's hood bunches at the nape and its two
 * cords hang in front. */
export function hoodDown(f: Figure, modern: boolean) {
  const { s, yOf } = f;
  const mat = modern ? TOP : CLOAK;
  const D = f.chestD + 0.6,
    wide = f.shoulderW + 1;
  const m = new Mask();
  if (!modern)
    for (let y = f.shoulder; y >= f.shoulder - 3; y--) {
      const w = wide - (f.shoulder - y) * 0.15;
      const row = yOf(y);
      const xs = [sideX(f, y, -w, -D), sideX(f, y, w, -D), sideX(f, y, -w, D), sideX(f, y, w, D)];
      // Dagged: the cape's lowest row is cut into tongues.
      if (y === f.shoulder - 3) {
        for (let x = rnd(Math.min(...xs)); x <= rnd(Math.max(...xs)); x++) if ((x >> 1) % 2 === 0) m.set(x, row);
      } else run(m, row, xs);
    }
  // The bag of the hood, bunched behind the neck; from in front, only its
  // sides show either side of the neck.
  if (f.cos < 0.3)
    for (let y = f.shoulder + 1; y >= f.shoulder - 2; y--) {
      const hw = y > f.shoulder ? 2 : 3 - (f.shoulder - y) * 0.7;
      run(m, yOf(y), [sideX(f, y, -hw, -D - 0.6), sideX(f, y, hw, -D - 0.6), sideX(f, y, -hw, -D + 1.2), sideX(f, y, hw, -D + 1.2)]);
    }
  else for (const side of [-1, 1]) for (const y of [f.shoulder + 1, f.shoulder]) run(m, yOf(y), [sideX(f, y, side * 2, 0), sideX(f, y, side * 3.5, 0)]);
  // Seen from the front, the hood rolls round the neck.
  if (modern && !away(f)) for (const side of [-1, 1]) run(m, yOf(f.shoulder), [sideX(f, f.shoulder, side * 1.2, D), sideX(f, f.shoulder, side * 3, D)]);
  s.put(m, mat, { shade: 0.36, light: 0.2, top: true, bottom: true });
  const tail = new Mask();
  if (!modern) {
    // The liripipe, from the hood's point down the back, its end swinging.
    const top = [sideX(f, f.shoulder - 2, 0, -D - 0.8), yOf(f.shoulder - 2)] as const;
    const knee = [sideX(f, f.hip + 3, 0, -D - 0.6) + f.drift(0.5) * 0.6, yOf(f.hip + 3)] as const;
    const end = [sideX(f, f.hip, 0, -D - 0.4) + f.drift(1), yOf(f.hip)] as const;
    if (f.cos < 0.3) tail.line(top[0], top[1], knee[0], knee[1], 2).line(knee[0], knee[1], end[0], end[1], 1);
    s.put(tail, mat, { shade: 0.4, light: 0.2 });
  } else if (!away(f))
    // The cords, their aglets swinging.
    for (const side of [-1, 1]) {
      const x = sideX(f, f.shoulder, side * 1, D);
      tail.line(x, yOf(f.shoulder - 1), x + f.drift(0.6), yOf(f.shoulder - 3), 1);
      if (side > 0) s.put(tail, TRIM, { ring: "none", shade: 0 });
      s.px(rnd(x + f.drift(0.6)), yOf(f.shoulder - 4), METAL, 3);
    }
}
