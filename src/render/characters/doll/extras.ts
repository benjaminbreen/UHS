import { APRON, CLOAK, KERCHIEF, LEATHER, METAL, Mask, SKIN, WHITE, rnd, type Sheet } from "./paint";

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
};

const away = (f: Figure) => f.cos < -0.1;
/** Screen x of a point on the body's surface: `lx` across, `fz` forward. */
const sideX = (f: Figure, y: number, lx: number, fz: number) => f.centre(y) + lx * f.cos + fz * f.sx * f.sin;
/** How near the viewer that point is; negative is behind the body. */
const near = (f: Figure, lx: number, fz: number) => -lx * f.sx * f.sin + fz * f.cos;

/** Over the front: a waist apron of linen, or a smith's leather bib on a neck strap. */
export function apron(f: Figure, kind: "cloth" | "leather") {
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
export function neckwear(f: Figure, kind: "ruff" | "cravat" | "neckerchief") {
  const { s, yOf } = f;
  const row = yOf(f.shoulder);
  const c = f.centre(f.shoulder) + f.sx * f.sin * f.chestD * 0.6;
  const m = new Mask();
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
  m.span(row + 1, rnd(c - 0.5), rnd(c + 0.5)).set(rnd(c), row + 2);
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
