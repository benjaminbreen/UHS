import { ACCENT, APRON, CLOAK, H, KERCHIEF, LEATHER, METAL, Mask, SHAWL, SKIN, TOP, TRIM, W, WHITE, rnd, type Sheet } from "./paint";

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
