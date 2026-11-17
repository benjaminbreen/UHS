import type { CharacterAppearance } from "../../../core/character";
import type { RestingExpression } from "../../../core/persona";
import {
  H, W,
  BLUSH, BOOT, DECO, EYE, GLASS, HAIR, HAT, IRIS, LEATHER, LIP, MARK, METAL, Mask, ORN, PLUME, SKIN, STUBBLE, TRIM, WHITE,
  type Sheet,
} from "./paint";
import { luma } from "../v2/pixels";
import { irisOf } from "../../portraits/sculpted";

export type View = "front" | "q" | "side" | "bq" | "back";

/** A head is drawn on a 14-column box. Side and three-quarter views are
 * authored facing right; `sx` mirrors them. */
export type Head = {
  s: Sheet;
  a: CharacterAppearance;
  view: View;
  sx: 1 | -1;
  x0: number;
  y0: number;
  expression: RestingExpression;
  blink: boolean;
  /** Screen row of the shoulders, for hair and cloth that fall to them. */
  shoulder: number;
  child: boolean;
  /** Half the shoulders' width, and the body's centre column in head space. */
  shoulderW: number;
  bodyC: number;
  /** How far the body dropped since the last frame, for what trails it. */
  lag: number;
  /** Screen offset of hanging hair's end as the figure walks. */
  drift: number;
  /** An expression the action forces: surprise, a wince, gritted teeth. */
  face?: "o" | "squint" | "grit" | "talk";
  /** Both whites on the lit side, so the eyes look aside rather than out. */
  sidelong?: boolean;
};

type Style = { line: number; side: number; back: number; wide: number; vol: number };
type Cut = CharacterAppearance["hair"] | "queue" | "bun" | "shimada" | "heian" | "crest" | "beehive" | "pouf" | "tied" | "tufts"
  | "mohawk" | "spikes" | "quiff" | "afro" | "locs";
const styles: Record<Cut, Style | undefined> = {
  original: { line: 4, side: 3, back: 11, wide: 1, vol: 1 },
  cropped: { line: 3, side: 2, back: 10, wide: 1, vol: 0 },
  curls: { line: 4, side: 6, back: 12, wide: 2, vol: 2 },
  bob: { line: 4, side: 9, back: 12, wide: 2, vol: 1 },
  long: { line: 4, side: 10, back: 13, wide: 1, vol: 1 },
  braid: { line: 3, side: 3, back: 11, wide: 1, vol: 0 },
  topknot: { line: 3, side: 2, back: 11, wide: 1, vol: 0 },
  bald: undefined,
  // Shaved to the crown, the rest grown long and plaited down the back.
  queue: { line: 1, side: 0, back: 11, wide: 0, vol: 0 },
  bun: { line: 3, side: 3, back: 10, wide: 1, vol: 0 },
  shimada: { line: 3, side: 3, back: 10, wide: 2, vol: 0 },
  heian: { line: 3, side: 10, back: 13, wide: 2, vol: 0 },
  crest: { line: 3, side: 2, back: 10, wide: 1, vol: 0 },
  beehive: { line: 3, side: 5, back: 11, wide: 1, vol: 0 },
  pouf: { line: 3, side: 4, back: 11, wide: 1, vol: 0 },
  tied: { line: 3, side: 3, back: 10, wide: 1, vol: 0 },
  tufts: { line: 0, side: 0, back: 0, wide: 0, vol: 0 },
  mohawk: { line: 0, side: 0, back: 0, wide: 0, vol: 0 },
  spikes: { line: 3, side: 2, back: 10, wide: 1, vol: 0 },
  quiff: { line: 3, side: 2, back: 10, wide: 1, vol: 0 },
  afro: { line: 3, side: 8, back: 12, wide: 2, vol: 0 },
  locs: { line: 3, side: 9, back: 13, wide: 1, vol: 0 },
};
/** The cut as drawn: a queue replaces the person's own; a tonsure is a crop with the crown shaved. */
const hairOf = (a: CharacterAppearance): Cut => {
  const d = a.wearing.hairdress;
  return !d || d === "none" ? a.hair : d === "tonsure" ? "cropped" : d === "shaven" ? "bald" : d === "chonmage" ? "topknot" : d === "powdered" ? "tied" : d;
};

/** Broad and round heads fill the 14-column box; the rest are two columns
 * narrower, so a face is not always the widest it could be. */
const wideHead = (a: CharacterAppearance) => a.head === "broad" || a.head === "round";
/** The jaw's three rows, by jaw shape, facing the viewer, on a wide head. */
const jaws: Record<NonNullable<CharacterAppearance["jaw"]>, [number, number][]> = {
  original: [[1, 12], [2, 11], [4, 9]],
  square: [[0, 13], [1, 12], [3, 10]],
  soft: [[1, 12], [2, 11], [3, 10]],
  pointed: [[1, 12], [3, 10], [5, 8]],
  small: [[2, 11], [3, 10], [5, 8]],
};

const hides = {
  all: new Set(["hood", "headscarf", "veil", "wrap", "turban", "wig", "helmet", "kabuto", "jaguar", "eagle", "nemes", "wimple", "hennin", "dastar"]),
  top: new Set(["cap", "bowler", "flat-cap", "ball-cap", "brimmed", "conical", "fez", "top-hat", "nasal", "kettle", "official-cap",
    "fedora", "boater", "cloche", "beret", "kerchief", "peaked-cap", "pith-helmet", "mian", "kanmuri", "tricorne", "bicorne", "gat", "capotain", "bork", "mobcap", "shako", "bearskin", "tam"]),
};

function hash(s: string) {
  let n = 7;
  for (const c of s) n = (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0;
  return n;
}

/** Head spans per row, authored facing right. A long head or chin adds a
 * row below the eyes; the jaw turns toward the face in the side views. */
export function headSpans(h: Head): [number, number][] {
  const { a, view } = h;
  const wide = wideHead(a);
  const pinch = (spans: [number, number][], n: number) =>
    spans.map(([c0, c1]) => [Math.min(c0 + n, 6), Math.max(c1 - n, 7)] as [number, number]);
  // The dome varies: the usual, a flatter top, or a narrower one.
  const dome = (hash(a.lineage ?? a.hairColor + a.skin) >> 2) % 3;
  const crown: [number, number][] = a.head === "broad" ? [[3, 10], [1, 12], [0, 13]]
    : dome === 1 ? [[3, 10], [1, 12], [1, 12]] : dome === 2 ? [[5, 8], [3, 10], [1, 12]] : [[4, 9], [2, 11], [1, 12]];
  const jaw = pinch(jaws[a.jaw ?? (a.head === "round" ? "soft" : "original")], wide ? 0 : 1);
  const long = a.head === "long" || a.head === "oval" || a.face?.chin === "long";
  const mid: [number, number][] = Array.from({ length: long ? 8 : 7 }, () => (wide ? [0, 13] : [1, 12]));
  if (view === "side")
    return [
      ...[...crown, ...mid].map(([c0, c1], r) => [r < 2 ? c0 : Math.max(1, c0), r < 2 ? c1 : Math.min(12, c1)] as [number, number]),
      [jaw[0][0] + 1, 12], [jaw[1][0] + 1, jaw[1][1]], [jaw[2][0] + 1, jaw[2][1] + 1],
    ];
  if (view === "q") return [...crown, ...mid.map(([c0]) => [c0, 13] as [number, number]), ...jaw.map(([c0, c1]) => [c0, c1 + 1] as [number, number])];
  return [...crown, ...mid, ...jaw];
}

/** Column and row in head space to screen. */
function local(h: Head) {
  const flip = h.sx < 0 && (h.view === "q" || h.view === "side" || h.view === "bq");
  const X = (c: number) => (flip ? h.x0 + 13 - c : h.x0 + c);
  const Y = (r: number) => h.y0 + r;
  const m = () => {
    const mask = new Mask();
    return {
      mask,
      set(c: number, r: number) {
        mask.set(X(c), Y(r));
        return this;
      },
      span(r: number, c0: number, c1: number) {
        for (let c = c0; c <= c1; c++) mask.set(X(c), Y(r));
        return this;
      },
      rows(r0: number, rows: [number, number][]) {
        rows.forEach(([c0, c1], i) => this.span(r0 + i, c0, c1));
        return this;
      },
    };
  };
  return { X, Y, m, flip };
}

const style = (h: Head) => {
  const hat = h.a.wearing.headwear;
  if (hides.all.has(hat)) return undefined;
  return styles[hairOf(h.a)];
};

/** Hair that falls behind the shoulders: drawn before the body, or after it
 * when the figure faces away. */
export function hairBehind(h: Head) {
  const st = style(h);
  if (!st) return;
  const { m } = local(h);
  const hair = hairOf(h.a);
  // Hair hangs a frame behind the body: shorter as it drops, longer as it rises.
  const drop = Math.max(4, h.shoulder - h.y0 + (h.child ? 1 : 3) - h.lag);
  // The queue hangs to the small of the back.
  const queue = hair === "queue" ? 8 : hair === "tied" ? 14 - drop : 0;
  const fall = m();
  if (hair === "heian") {
    // To the hem, or near it: the length was the beauty.
    const floor = drop + 22;
    if (h.view === "side") fall.rows(5, Array.from({ length: floor - 5 }, () => [0, 5] as [number, number]));
    else if (h.view === "back" || h.view === "bq") fall.rows(7, Array.from({ length: floor - 6 }, (_, i) => (i < 5 ? [1, 12] : [2, 11]) as [number, number]));
    else fall.rows(6, Array.from({ length: drop - 6 }, () => [0, 13] as [number, number]));
  } else if (hair === "long" || hair === "locs") {
    if (h.view === "front" || h.view === "q")
      fall.rows(6, Array.from({ length: drop - 6 }, (_, i) => (i > drop - 9 ? [1, 12] : [0, 13]) as [number, number]));
    else if (h.view === "side") fall.rows(5, Array.from({ length: drop - 5 }, (_, i) => [i > drop - 8 ? 1 : 0, 6] as [number, number]));
    else fall.rows(7, Array.from({ length: drop - 6 }, (_, i) => (i < 5 ? [1, 12] : i > drop - 9 ? [3, 10] : [2, 11]) as [number, number]));
  } else if (hair === "braid" || hair === "queue" || hair === "tied") {
    if (h.view === "back" || h.view === "bq") fall.rows(11, Array.from({ length: drop - 9 + queue }, () => [6, 7] as [number, number]));
    else if (h.view === "side") fall.rows(10, Array.from({ length: drop - 9 + queue }, () => [1, 2] as [number, number]));
    else return;
  } else return;
  const { s } = h;
  // The free end swings out after the head: shift each row by how far down it hangs.
  const swung = new Mask();
  let top = H, bottom = 0;
  for (let i = 0; i < fall.mask.bits.length; i++) if (fall.mask.bits[i]) (top = Math.min(top, Math.floor(i / W))), (bottom = Math.max(bottom, Math.floor(i / W)));
  for (let i = 0; i < fall.mask.bits.length; i++) {
    if (!fall.mask.bits[i]) continue;
    const x = i % W,
      y = Math.floor(i / W);
    swung.set(x + Math.round((h.drift * (y - top)) / Math.max(1, bottom - top)), y);
  }
  fall.mask = swung;
  s.put(fall.mask, HAIR, {
    merge: true,
    shade: 0.3,
    light: 0.25,
    bottom: true,
    tone: hair === "locs" ? (x, _y, t) => (x % 2 ? Math.min(t, 2) : t)
      : hair === "braid" || hair === "queue" || hair === "tied" ? (x, y, t) => ((x + y) % 2 ? Math.min(t, 2) : t)
      // Seen from behind, the strands on the skull run on down the fall.
      : h.view === "back" || h.view === "bq" ? (x, _y, t) => (t === 3 && [4, 7, 9].includes(x - h.x0) ? 2 : t)
      : undefined,
  });
  if (hair === "tied") {
    // A black ribbon bow at the nape.
    const bow = m();
    if (h.view === "side") bow.span(10, 0, 3); else bow.span(10, 4, 9).span(11, 5, 8);
    s.put(bow.mask, EYE, { ring: "ink", shade: 0.2 });
  } else if (hair === "braid" || hair === "queue") {
    const tie = m();
    const end = h.view === "side" ? [1, 10 + drop - 9 + queue] : [6, 11 + drop - 9 + queue];
    tie.span(end[1], end[0], end[0] + 1);
    const moved = new Mask();
    for (let i = 0; i < tie.mask.bits.length; i++) if (tie.mask.bits[i]) moved.set((i % W) + Math.round(h.drift), Math.floor(i / W));
    s.put(moved, TRIM, { ring: "ink" });
  }
}

export function drawHead(h: Head) {
  const { s, a, view } = h;
  const { X, Y, m } = local(h);
  const st = style(h);
  const hat = a.wearing.headwear;
  const spans = headSpans(h);
  const tall = spans.length;
  // Rows below the eyes shift down one on a long face.
  const lo = tall - 13;

  // ---- the skull, with ears and a profile nose
  const head = m();
  head.rows(0, spans);
  const earsShow = !st || st.side < 5 || view === "q" || view === "side";
  const covered = hides.all.has(hat);
  if ((view === "front" || view === "back") && earsShow && !covered) {
    const [e0, e1] = spans[7];
    head.span(7, e0 - 1, e0 - 1).span(8, e0 - 1, e0 - 1).span(7, e1 + 1, e1 + 1).span(8, e1 + 1, e1 + 1);
  }
  if (view === "side") for (const [c, r] of profileNose(a)) head.set(c, 6 + r + lo);
  s.put(head.mask, SKIN, { shade: 0.28, light: 0.22, cast: true, bottom: true });

  // ---- the face
  const face = view === "front" || view === "q" || view === "side";
  if (face) drawFace(h, lo);
  if (face) marks(h, lo);
  if (face) injuryScar(h, lo);
  if (view === "q" || view === "side") {
    const ec = view === "q" ? 2 : 5;
    s.px(X(ec), Y(7), SKIN, 2);
    s.px(X(ec), Y(8), SKIN, 2);
    s.px(X(ec + 1), Y(8), SKIN, 2);
  }
  if (view === "bq") {
    s.px(X(12), Y(7), SKIN, 2);
    s.px(X(12), Y(8), SKIN, 2);
  }

  // ---- hair
  if (st) drawHair(h, st, lo, hides.top.has(hat));
  // Facing away, hair that hangs down the back goes over the skull's outline.
  if (st && (view === "back" || view === "bq")) hairBehind(h);
  else if (!covered && a.physique?.sex !== "female" && (a.face?.detail === "lines" || a.face?.detail === "weathered")) {
    // An older bald man keeps a horseshoe of hair round the back and sides.
    const ring = m();
    spans.forEach(([c0, c1], r) => {
      if (r < 5 || r > 9) return;
      for (let c = c0; c <= c1; c++) {
        const on = view === "back" || view === "bq" ? r > 5 : view === "side" ? c <= 5 : view === "q" ? c <= c0 + 1 : c === c0 || c === c1;
        if (on && r > 5 && r < 9) ring.set(c, r);
      }
    });
    s.put(ring.mask, HAIR, { ring: "none", shade: 0.3, light: 0.2 });
  }
  if (!st && !covered && hat === "none") {
    // Bald: the scalp catches the light.
    s.retone(X(4), Y(1), 4);
    s.retone(X(5), Y(1), 4);
    s.retone(X(3), Y(2), 4);
  }
  if ((view === "back" || view === "bq") && !covered) nape(h, tall - 1);
  if (view === "front" || view === "q" || view === "side") beard(h, lo);
  if (face && a.wearing.mask && a.wearing.mask !== "none") mask(h, lo);
  ornaments(h, lo, earsShow && !covered);
  if (st && !hides.top.has(hat)) hairOrnament(h, st, lo);
  if (hat !== "none") headwear(h, lo);
}

/** Nose pixels as [column, row, tone], facing right; rows are relative to the eye line. */
function nosePixels(a: CharacterAppearance, view: "front" | "q" | "side", key: number): [number, number, number][] {
  const nose = a.face?.nose ?? "straight";
  const kind = nose === "broad" || nose === "flat" || nose === "bulbous" ? "wide" : nose === "aquiline" || nose === "hooked" ? "long" : "plain";
  const high = a.face?.noseBridge === "high";
  if (view === "front") {
    const n = key < 0 ? 7 : 6,
      o = 13 - n;
    const px: [number, number, number][] = kind === "wide" ? [[6, 2, 2], [7, 2, 2]] : kind === "long" ? [[n, 1, 2], [n, 2, 1]] : [[n, 2, 2]];
    if (nose === "bulbous" || nose === "snub") px.push([o, 1, 4]);
    if (high && kind !== "long") px.push([n, 1, 3]);
    return px;
  }
  if (view === "q") return kind === "wide" ? [[11, 2, 2], [12, 2, 2]] : kind === "long" ? [[12, 1, 2], [12, 2, 1]] : [[12, 2, 2]];
  return [];
}

/** What the nose adds to the profile's silhouette, as [column, row]. */
export function profileNose(a: CharacterAppearance): [number, number][] {
  const nose = a.face?.nose ?? "straight";
  if (nose === "hooked") return [[13, 1], [13, 2], [14, 2], [13, 3]];
  if (nose === "aquiline") return [[13, 1], [13, 2]];
  if (nose === "broad" || nose === "bulbous" || nose === "flat") return [[13, 2], [13, 3]];
  if (a.face?.noseBridge === "high" || nose === "narrow") return [[13, 1], [13, 2]];
  return [[13, 2]];
}

function drawFace(h: Head, lo: number) {
  const { s, a, view, expression } = h;
  const { X, Y } = local(h);
  const f = a.face;
  const female = a.physique?.sex === "female" && !h.child;
  const forced = h.face;
  // Surprise opens the eyes wide; a wince shuts them.
  const size = forced === "o" ? "large" : (f?.eyeSize ?? "medium");
  const shut = h.blink || forced === "squint" || forced === "grit";
  const key = s.key;
  const er = 6;
  const v = view as "front" | "q" | "side";
  // Eye spacing moves both eyes a column in or out.
  const sp = f?.eyeSpacing === "close" ? 1 : f?.eyeSpacing === "wide" ? -1 : 0;
  const eyes = { front: [[3 + sp, 2], [9 - sp, 2]], q: [[5 + sp, 2], [10, 1]], side: [[9, 1]] }[v];
  const shape = f?.eyeShape ?? "round";
  // Light irises show their colour where a dark eye shows a highlight; a dark
  // eye takes one white pixel on the side the light comes from.
  const lightEye = luma(irisOf(a)) > 0.28;
  const flip = h.sx < 0 && view !== "front";
  for (const [c, w] of eyes) {
    // Every eye keeps its full width so it can carry a white; size, shape
    // and lid change the lid row above it instead.
    const wide = w;
    const c0 = c;
    const inner = view !== "front" || c > 7 ? c0 : c0 + wide - 1;
    const outer = wide === 2 ? (inner === c0 ? c0 + 1 : c0) : c0;
    const lash = female && (view === "front" ? wide === 2 : c === eyes[0][0]);
    const flick = view === "front" ? (c < 7 ? c0 - 1 : c0 + wide) : c0 + wide;
    if (shut) {
      for (let i = 0; i < wide; i++) s.px(X(c0 + i), Y(er + 1), SKIN, 0);
      if (lash) s.px(X(flick), Y(er + 1), SKIN, 0);
      continue;
    }
    const top = size === "large" && wide === 2 ? er - 1 : er;
    for (let r = top; r <= er; r++) for (let i = 0; i < wide; i++) s.px(X(c0 + i), Y(r), EYE, 3);
    // Small eyes have a short lid; narrow eyes and monolids a long flat one.
    if (size === "small" && wide === 2) s.px(X(outer), Y(top), SKIN, 2);
    if ((shape === "narrow" || f?.eyelid === "monolid") && !lash) s.px(X(flick), Y(top), EYE, 3);
    if (lash) s.px(X(flick), Y(top), EYE, 3);
    if (shape === "almond" && wide === 2 && size !== "small") s.px(X(outer), Y(top), SKIN, 1);
    if (wide === 1) {
      s.px(X(c0), Y(er + 1), IRIS, lightEye ? 2 : 3);
      if (view !== "front") s.px(X(c0 + 1), Y(er + 1), WHITE, 3);
    } else {
      // Looking out, the whites sit outboard; on a turned head both sit ahead
      // of the pupil, matching the far eye, so the pair looks back at the viewer.
      const lit = view !== "front" ? c0 + 1 : h.sidelong ? (key < 0 !== flip ? c0 : c0 + 1) : outer;
      s.px(X(lit), Y(er + 1), WHITE, 3);
      // A light iris a tone down, or it washes out beside the white.
      s.px(X(lit === c0 ? c0 + 1 : c0), Y(er + 1), IRIS, lightEye ? 2 : 3);
    }
    // Lines under the eyes with age.
    if (f?.detail === "lines" || f?.detail === "weathered") s.px(X(outer), Y(er + 2), SKIN, 2);
  }
  // Brows: one row above a gap, only where the forehead shows. Arched brows
  // lift the inner end; heavy ones run a pixel longer and darker.
  const brow = f?.brows ?? "straight";
  for (const [c, w] of eyes) {
    const wide = w;
    const c0 = c;
    const left = view === "front" && c < 7;
    for (let i = brow === "heavy" && left ? -1 : 0; i < Math.max(wide, 2) + (brow === "heavy" && !left ? 1 : 0) && c0 + i <= 13; i++) {
      const outer = view === "front" ? (left ? i <= 0 : i >= 1) : false;
      let r = er - 2;
      if (brow === "arched" && outer) r = er - 3;
      if (expression === "concerned" && !outer && view === "front") r = er - 3;
      if (expression === "serious" && !outer && view === "front") r = er - 1;
      if (forced === "o") r = er - 3;
      if ((forced === "squint" || forced === "grit") && !outer) r = er - 1;
      // A resting brow is a tone lighter, so it does not run into the hairline.
      const set = forced || expression === "concerned" || expression === "serious";
      if (s.at(X(c0 + i), Y(r))?.mat === SKIN) s.px(X(c0 + i), Y(r), HAIR, brow === "heavy" ? 0 : set ? 1 : 2);
    }
  }
  for (const [c, r, tone] of nosePixels(a, v, key)) s.px(X(c), Y(er + r + lo), SKIN, tone);
  // A flush only where it suits: women, children, a smile, a soft face.
  const cheeks = { front: [2 - Math.min(0, sp), 11 + Math.min(0, sp)], q: [4], side: [9] }[v];
  if (female || h.child || expression === "smile" || expression === "soft")
    for (const c of cheeks) s.px(X(c), Y(8 + lo), BLUSH, 3);
  if (f?.detail === "freckles")
    for (const c of view === "front" ? [3, 10] : view === "q" ? [4] : [9]) s.px(X(c), Y(9 + lo), SKIN, 2);
  if (f?.detail === "weathered" && view === "front") for (const c of [1, 12]) s.px(X(c), Y(9 + lo), SKIN, 2);
  // Mouth: width and lips from the face, shape from the expression.
  const mr = 10 + lo;
  const mouth = f?.mouth ?? "soft";
  if (forced) {
    const cols = view === "front" ? (forced === "o" || forced === "talk" ? [6, 7] : [5, 6, 7, 8]) : view === "q" ? (forced === "o" || forced === "talk" ? [9] : [9, 10]) : [11];
    for (const c of cols) {
      // Mid-word: a small open mouth, dark above and lip below.
      if (forced === "talk") s.px(X(c), Y(mr), LIP, 0), view !== "side" && s.px(X(c), Y(mr + 1), LIP, 1);
      else if (forced === "o") s.px(X(c), Y(mr - 1), LIP, 0), s.px(X(c), Y(mr), LIP, 0);
      else if (forced === "grit") s.px(X(c), Y(mr), c === cols[0] || c === cols[cols.length - 1] ? LIP : WHITE, c === cols[0] || c === cols[cols.length - 1] ? 0 : 3);
      else s.px(X(c), Y(mr), LIP, 0);
    }
  } else if (view === "front") {
    const [m0, m1] = mouth === "wide" ? [5, 8] : [6, 7];
    if (expression === "smile") {
      s.px(X(m0 - 1), Y(mr - 1), LIP, 1);
      s.px(X(m1 + 1), Y(mr - 1), LIP, 1);
      for (let c = m0; c <= m1; c++) s.px(X(c), Y(mr), LIP, 1);
    } else if (expression === "serious") {
      for (let c = Math.min(m0, 5); c <= Math.max(m1, 8); c++) s.px(X(c), Y(mr), LIP, 1);
    } else if (expression === "concerned") {
      for (let c = m0; c <= m1; c++) s.px(X(c), Y(mr), LIP, 1);
      s.px(X(m0 - 1), Y(mr + 1), LIP, 1);
      s.px(X(m1 + 1), Y(mr + 1), LIP, 1);
    } else if (expression === "soft") {
      // A half smile: one corner lifts.
      for (let c = m0; c <= m1; c++) s.px(X(c), Y(mr), LIP, 1);
      if (hash(a.hairColor + a.skin) & 1) s.px(X(m0 - 1), Y(mr - 1), LIP, 1);
      else s.px(X(m1 + 1), Y(mr - 1), LIP, 1);
    } else {
      for (let c = m0; c <= m1; c++) {
        const edge = mouth === "wide" && (c === m0 || c === m1);
        // Full lips read as a softer, lighter line; a second row reads as an open mouth.
        s.px(X(c), Y(mr), LIP, mouth === "narrow" || mouth === "full" || edge ? 2 : 1);
      }
    }
    if (f?.detail === "lines") s.px(X(m0 - 1), Y(mr - 1), SKIN, 2), s.px(X(m1 + 1), Y(mr - 1), SKIN, 2);
  } else {
    const [m0, m1] = view === "q" ? (mouth === "wide" ? [8, 10] : [9, 10]) : [11, 11];
    for (let c = m0; c <= m1; c++) s.px(X(c), Y(mr), LIP, mouth === "narrow" ? 2 : 1);
    if (expression === "smile" || expression === "soft") s.px(X(m0 - 1), Y(mr - 1), LIP, 1);
  }
  if (a.wearing.eyewear && a.wearing.eyewear !== "none") {
    // Rims either side of each eye and a bridge; dark lenses fill between.
    const dark = a.wearing.eyewear === "sunglasses";
    for (const [c, w] of eyes) {
      const c0 = c - 1,
        c1 = Math.min(13, c + w);
      for (const r of [er, er + 1])
        for (let x = c0; x <= c1; x++)
          if (dark && x < c1) s.px(X(x), Y(r), GLASS, r === er && x === c0 + 1 ? 4 : 2);
          else if (!dark && (x === c0 || x === c1)) s.px(X(x), Y(r), METAL, 2);
    }
    if (view === "front") s.px(X(6), Y(er), METAL, 2), s.px(X(7), Y(er), METAL, 2);
  }
}

function drawHair(h: Head, st: Style, lo: number, capped: boolean) {
  const { s, a, view } = h;
  const { m } = local(h);
  const spans = headSpans(h);
  const edge = (r: number) => spans[Math.max(0, Math.min(spans.length - 1, r))];
  // Two columns of temple hair on a wide head, one on a narrow: the face stays ten wide.
  const temple = hairOf(a) === "queue" ? 0 : wideHead(a) ? Math.max(2, st.wide) : st.wide;
  const back = st.back + lo;
  // A high hairline shows a row more forehead.
  const line = st.line - (a.face?.hairline === "high" && st.line > 3 ? 1 : 0);
  const cut = hairOf(a);
  if (cut === "tufts") return tufts(h);
  if (cut === "mohawk") return mohawk(h, capped);
  const hair = m();
  const side = st.side + lo;
  const swept = hash(a.lineage ?? a.hairColor + a.skin) & 1;
  spans.forEach(([c0, c1], r) => {
    for (let c = c0; c <= c1; c++) {
      let on = false;
      if (view === "back") on = r < back;
      else if (view === "bq") on = r < back && !(c >= 11 && r >= 7);
      // Every cut frames the temples down to the eyes, which keeps the face narrow.
      else if (view === "front") on = r < line || ((c - c0 < temple || c1 - c < temple) && r < Math.max(line + side, 8));
      else if (view === "q") on = r < line || (c <= 3 && r < back) || (c <= 4 && r < line + 2);
      else on = (c <= 5 && r < back) || (c <= 7 && r < line + 1) || r < line - (c >= 10 ? 1 : 0);
      if (on) hair.set(c, r);
    }
  });
  // The ears stay out of side-view hair.
  if (view === "side" && st.side < 5) [[5, 7], [5, 8], [6, 8]].forEach(([c, r]) => hair.mask.clear(local(h).X(c), local(h).Y(r)));
  if (view === "q" && st.side < 5) [[2, 7], [2, 8], [3, 8]].forEach(([c, r]) => hair.mask.clear(local(h).X(c), local(h).Y(r)));
  // Fringe.
  const fr = line;
  const fringes: Partial<Record<ReturnType<typeof hairOf>, string>> = {
    original: swept ? ".##.###...#." : ".#...###.##.",
    curls: ".#.##.#.##.#",
    bob: "############",
    long: "###.......##",
  };
  const fringe = fringes[hairOf(a)];
  if (fringe && (view === "front" || view === "q")) {
    for (let i = 0; i < 12; i++) if (fringe[i] === "#" && (view === "front" || i >= 4)) hair.set(i + 1, fr);
    if (cut === "bob" && view === "front") hair.span(fr + 1, 1, 1).span(fr + 1, 12, 12);
  }
  if (fringe && view === "side") hair.set(8, fr).set(9, fr);
  if (a.face?.hairline === "widows-peak" && view === "front") hair.set(6, line).set(7, line);
  // The tonsure: a shaved disc on the crown, seen only from behind.
  if (a.wearing.hairdress === "tonsure" && (view === "back" || view === "bq")) for (const [r, c0, c1] of [[1, 5, 8], [2, 4, 9], [3, 5, 8]]) for (let c = c0; c <= c1; c++) hair.mask.clear(local(h).X(c), local(h).Y(r));
  // Volume beyond the skull.
  if (!capped) {
    // Curly and coiled hair stands up in clumps whatever the cut.
    const texture = a.face?.hairTexture;
    const vol = texture === "curly" || texture === "coiled" ? Math.max(2, st.vol) : st.vol;
    if (vol >= 1) view === "side" || view === "q" ? hair.span(-1, 3, 8) : hair.span(-1, 5, 8);
    if (vol >= 2) {
      // Clumps two rows deep with a notch between, not a pixel checker.
      hair.span(-1, 3, 10).span(-2, 4, 5).span(-2, 8, 9);
      for (let r = 2; r < Math.min(line + side, 9); r++) {
        if (r % 3 === 1) continue;
        if (view !== "side" && view !== "q") hair.set(edge(r)[0] - 1, r);
        hair.set(edge(r)[1] + 1, r);
      }
      if (view === "side" || view === "q") for (let r = 2; r < Math.min(back, 9); r++) if (r % 3 !== 1) hair.set(edge(r)[0] - 1, r);
    }
    if (a.hair === "topknot") {
      const c = view === "side" ? 3 : view === "q" ? 5 : 5;
      hair.span(-1, c, c + 3).span(-2, c, c + 3).span(-3, c + 1, c + 2);
    }
  }
  if (!capped && (cut === "beehive" || cut === "pouf")) {
    // Backcombed up over the crown; the pouf of the 1770s stood twice as high.
    const tall = cut === "pouf" ? 7 : 4;
    for (let i = 1; i <= tall; i++) {
      const n = Math.round(5.5 * (1 - Math.sqrt(1 - (i / (tall + 1)) ** 2)));
      view === "side" ? hair.span(-i, 1 + Math.round(n * 0.6), 11 - n) : hair.span(-i, 1 + n, 12 - n);
    }
  }
  if (!capped && cut === "spikes") {
    // Gelled up in points across the crown.
    const tips = view === "side" ? [2, 4, 6, 8, 10] : view === "q" ? [3, 5, 7, 9, 11] : [2, 4, 6, 8, 10];
    for (const c of tips) hair.span(-1, c, c + 1).set(c, -2).set(c, c === 6 ? -3 : -2);
  }
  if (!capped && cut === "quiff") {
    // Combed up and forward off the brow.
    if (view === "side") hair.span(-1, 5, 12).span(-2, 7, 13).span(-3, 9, 12);
    else if (view === "q") hair.span(-1, 4, 12).span(-2, 6, 12).span(-3, 8, 11);
    else if (view === "front") hair.span(-1, 2, 11).span(-2, 3, 10).span(-3, 5, 9);
    else hair.span(-1, 3, 10);
  }
  if (!capped && cut === "afro") {
    // A round mass well beyond the skull.
    hair.span(-4, 4, 9).span(-3, 2, 11).span(-2, 1, 12).span(-1, 0, 13);
    for (let r = 0; r < 9; r++) {
      if (view !== "side" && view !== "q") hair.span(r, edge(r)[0] - 2, edge(r)[0] - 1);
      if (view !== "side") hair.span(r, edge(r)[1] + 1, edge(r)[1] + 2);
      else hair.span(r, edge(r)[0] - 2, edge(r)[0] - 1);
    }
  }
  if (cut === "heian" && view === "front") for (let r = line; r < h.shoulder - h.y0 + 6; r++) hair.set(edge(Math.min(r, 9))[0] - 1, r).set(edge(Math.min(r, 9))[1] + 1, r);
  if (cut === "bob" || cut === "long" || cut === "heian" || cut === "locs") {
    if (view === "front" && cut === "bob") for (let r = line; r < line + side; r++) hair.set(edge(r)[0] - 1, r).set(edge(r)[1] + 1, r);
    if (view === "q") for (let r = line; r < back; r++) hair.set(edge(r)[0] - 1, r);
    if (view === "back" || view === "bq") for (let r = 4; r < back; r++) hair.set(edge(r)[0] - 1, r).set(edge(r)[1] + 1, r);
  }
  s.put(hair.mask, HAIR, {
    ring: "line",
    merge: true,
    shade: 0.3,
    light: 0.3,
    top: true,
    cast: true,
    tone: (x, y, t) => {
      if (cut === "locs" && y > h.y0 + 1) return x % 2 ? Math.min(t, 2) : t;
      if (t === 3 && y === h.y0 + 1 && (x + swept) % 3 === 0) return 4;
      // Two strands down the back of the head, so it is not one flat mass.
      const c = x - h.x0,
        r = y - h.y0;
      if (t === 3 && (view === "back" || view === "bq") && r >= 3 && r < back - 1 && (c === 4 || c === 9)) return 2;
      // A sheen across the crown.
      if (t === 3 && (view === "back" || view === "bq") && r === 2 && c >= 5 && c <= 8) return 4;
      return t;
    },
  });
  knots(h, cut, capped);
}

/** What is put up on or behind the head, outlined on its own so it reads
 * against the hair beneath. */
function knots(h: Head, cut: Cut, capped: boolean) {
  const { s, view } = h;
  const { m } = local(h);
  const k = m();
  const behind = view === "side" ? -1 : view === "q" ? -1 : undefined;
  if (cut === "bun") {
    // A coil at the back of the head.
    if (behind !== undefined) k.rows(3, [[behind + 1, behind + 2], [behind, behind + 2], [behind, behind + 2], [behind + 1, behind + 2]]);
    else if (view === "back" || view === "bq") k.rows(3, [[5, 8], [4, 9], [4, 9], [5, 8]]);
  } else if (cut === "shimada" && !capped) {
    // The folded loop of the mage on top, the swept wings at either side, the tabo behind.
    if (view === "side") k.rows(-3, [[3, 7], [2, 8], [2, 8]]).rows(7, [[-1, 1], [-1, 1], [0, 1]]);
    else if (view === "q") k.rows(-3, [[4, 8], [3, 9], [3, 9]]).rows(7, [[-1, 1], [-1, 1]]);
    else k.rows(-3, [[4, 9], [3, 10], [4, 9]]).rows(4, [[-1, 0], [-1, 0], [-1, 0]]).rows(4, [[13, 14], [13, 14], [13, 14]]);
  } else if (cut === "crest" && !capped) {
    // A crest from brow to nape, and plaits hanging beside the cheeks.
    if (view === "side") k.rows(-2, [[4, 9], [2, 10]]);
    else k.rows(-2, [[6, 7], [5, 8]]);
    if (view === "front") k.rows(6, Array.from({ length: 8 }, () => [-1, -1] as [number, number])).rows(6, Array.from({ length: 8 }, () => [14, 14] as [number, number]));
    if (view === "q") k.rows(6, Array.from({ length: 8 }, () => [0, 0] as [number, number]));
  }
  s.put(k.mask, HAIR, { ring: "line", shade: 0.3, light: 0.3, top: true, tone: cut === "crest" ? (x, y, t) => ((x + y) % 2 ? Math.min(t, 2) : t) : undefined });
}

/** Shaved at the sides, a crest standing front to back. */
function mohawk(h: Head, capped: boolean) {
  const { s, view } = h;
  const { m } = local(h);
  const k = m();
  if (view === "side") k.rows(0, [[2, 10], [2, 9]]).span(-1, 2, 10).span(-2, 3, 9).span(-3, 3, 4).span(-3, 6, 7).span(-3, 9, 9).span(-4, 4, 4).span(-4, 7, 7);
  else if (view === "q") k.rows(0, [[4, 9], [4, 8]]).span(-1, 5, 8).span(-2, 5, 8).span(-3, 6, 7).span(-4, 6, 7);
  else k.rows(-4, [[6, 7], [6, 7], [6, 7], [5, 8], [5, 8], [6, 7], [6, 7]]);
  if (capped) for (let r = -4; r < 2; r++) for (let c = -2; c < 16; c++) k.mask.clear(local(h).X(c), local(h).Y(r));
  s.put(k.mask, HAIR, { ring: "line", shade: 0.3, light: 0.35, top: true });
}

/** A child's shaved head with a forelock and a tuft over each ear, or one at the nape. */
function tufts(h: Head) {
  const { s, view } = h;
  const { m } = local(h);
  const t = m();
  if (view === "front") t.rows(0, [[6, 7], [5, 8]]).rows(3, [[1, 2], [1, 2]]).rows(3, [[11, 12], [11, 12]]);
  else if (view === "q") t.rows(0, [[7, 8], [7, 9]]).rows(3, [[2, 3], [2, 3]]);
  else if (view === "side") t.rows(0, [[8, 9], [8, 10]]).rows(3, [[4, 5], [4, 5]]);
  else t.rows(9, [[5, 8], [6, 7]]).rows(3, [[1, 2], [1, 2]]).rows(3, [[11, 12], [11, 12]]);
  s.put(t.mask, HAIR, { ring: "line", shade: 0.3, light: 0.3, top: true });
}

function beard(h: Head, lo: number) {
  const { s, a, view } = h;
  const style = a.beard as string;
  if (!style || style === "none") return;
  const { X, Y, m } = local(h);
  const spans = headSpans(h);
  const fromCol = view === "front" ? 0 : view === "q" ? 4 : 6;
  const skinAt = (c: number, r: number) => s.at(X(c), Y(r))?.mat === SKIN;
  const mr = 10 + lo;
  const b = m();
  const jaw = (c: number, r: number) =>
    r >= mr || (r >= mr - 2 && (view === "front" ? c <= 1 || c >= 12 : c <= fromCol + 1));
  const mo = view === "front" ? [5, 8] : view === "q" ? [8, 11] : [10, 12];
  spans.forEach(([c0, c1], r) => {
    for (let c = Math.max(c0, fromCol); c <= c1; c++) {
      if (!skinAt(c, r)) continue;
      let on = false;
      if (style === "short" || style === "long" || style === "forked") on = jaw(c, r);
      else if (style === "chinstrap") on = r >= mr + 2 || (jaw(c, r) && (view === "front" ? c <= 2 || c >= 11 : c <= fromCol + 2));
      else if (style === "sideburns") on = r >= 6 && r <= mr - 1 && (view === "front" ? c <= 1 || c >= 12 : c <= fromCol + 1);
      else if (style === "goatee") on = r >= mr + 1 && c >= mo[0] + 1 && c <= mo[1] - 1;
      else if (style === "stubble") on = jaw(c, r);
      if (["moustache", "handlebar", "goatee", "short", "long", "forked"].includes(style) && r === mr - 1 && c >= mo[0] && c <= mo[1]) on = true;
      if (style === "handlebar" && r === mr && (c === mo[0] - 1 || c === mo[1] + 1)) on = true;
      if (on) b.set(c, r);
    }
  });
  if (style === "long" || style === "forked") {
    const c0 = view === "front" ? 4 : view === "q" ? 7 : 8;
    const w = view === "front" ? 6 : 4;
    const last = spans.length;
    for (let i = 0; i < 3; i++) b.span(last + i, c0 + i, c0 + w - 1 - i);
    if (style === "forked") b.mask.clear(X(c0 + Math.floor(w / 2)), Y(last + 2));
  }
  if (style === "stubble") {
    for (let i = 0; i < b.mask.bits.length; i++) if (b.mask.bits[i]) s.px(i % 80, Math.floor(i / 80), STUBBLE, (i % 2) ? 3 : 2);
    return;
  }
  s.put(b.mask, HAIR, { ring: "line", merge: true, shade: 0.3, light: 0.2 });
  // The mouth stays open through the beard.
  if (style !== "sideburns" && style !== "chinstrap" && view === "front") {
    s.px(X(6), Y(mr), LIP, 1);
    s.px(X(7), Y(mr), LIP, 1);
  }
}

/** Face marks, schematic and symmetric, as [column, row] on the front of the
 * face; rows from 8 down move with a long face. Mirrored where `pair`. */
const markPixels: Record<string, { at: [number, number][]; pair: boolean }> = {
  "cheek-lines": { at: [[2, 8], [2, 9], [4, 8], [4, 9]], pair: true },
  "cheek-dots": { at: [[2, 9], [4, 9], [3, 8]], pair: true },
  "chin-lines": { at: [[5, 11], [5, 12], [8, 11], [8, 12]], pair: false },
  "temple-rays": { at: [[1, 5], [2, 4], [1, 7]], pair: true },
  "brow-band": { at: Array.from({ length: 12 }, (_, i) => [i + 1, 5] as [number, number]), pair: false },
  "forehead-mark": { at: [[6, 5], [7, 5]], pair: false },
  "nose-bar": { at: [[5, 7], [6, 7], [7, 7], [8, 7]], pair: false },
  "cheek-block": { at: [[2, 8], [3, 8], [2, 9], [3, 9]], pair: true },
};

/** Ink, paint or raised scar, only where the face shows. */
function injuryScar(h: Head, lo: number) {
  const { s, a, view } = h;
  const scar = a.injuryScar;
  if (!scar || scar.kind === "none") return;
  const { X, Y } = local(h);
  const points: Record<Exclude<typeof scar.kind, "none">, [number, number][]> = {
    brow: [[4, 4], [4, 5]], cheek: [[2, 8], [3, 9], [4, 10]],
    temple: [[1, 4], [1, 5]], lip: [[5, 10], [5, 11]], burn: [[2, 9], [3, 9], [2, 10], [3, 11]],
  };
  for (const [px, py] of points[scar.kind]) {
    const c = scar.side < 0 ? px : 13 - px;
    const col = view === "front" ? c : view === "q" ? Math.round(4 + (c / 13) * 9) : c > 7 ? -1 : Math.round(7 + c * 0.8);
    if (col < 0) continue;
    const row = py >= 8 ? py + lo : py;
    const mat = s.at(X(col), Y(row))?.mat;
    if (mat === SKIN || (scar.kind === "lip" && mat === LIP)) s.px(X(col), Y(row), SKIN, 4);
  }
}

function marks(h: Head, lo: number) {
  const { s, a, view } = h;
  const mark = a.adornment?.marks;
  if (!mark || mark === "none" || !markPixels[mark]) return;
  const { X, Y } = local(h);
  const scar = a.adornment?.markStyle === "scar";
  const { at, pair } = markPixels[mark];
  const all = pair ? [...at, ...at.map(([c, r]) => [13 - c, r] as [number, number])] : at;
  for (const [c, r] of all) {
    // Turned, the face is drawn across fewer columns, and in profile only the near half shows.
    const col = view === "front" ? c : view === "q" ? Math.round(4 + (c / 13) * 9) : c > 7 ? -1 : Math.round(7 + c * 0.8);
    if (col < 0) continue;
    const row = r >= 8 ? r + lo : r;
    if (s.at(X(col), Y(row))?.mat !== SKIN) continue;
    if (scar) s.px(X(col), Y(row), SKIN, 4);
    else s.px(X(col), Y(row), MARK, 2);
  }
}

/** Earrings, nose ornaments, in the wearer's metal. The old `earrings` flag
 * draws a stud where the adornment record says nothing. */
function ornaments(h: Head, lo: number, ears: boolean) {
  const { s, a, view } = h;
  const { X, Y } = local(h);
  const ear = a.adornment?.ears && a.adornment.ears !== "none" ? a.adornment.ears : a.wearing.earrings ? "stud" : undefined;
  const [e0, e1] = headSpans(h)[7];
  const lobes = view === "front" ? [e0 - 1, e1 + 1] : view === "q" ? [2] : view === "side" ? [5] : view === "back" ? [e0 - 1, e1 + 1] : [12];
  const open = (c: number, r: number) => {
    const at = s.at(X(c), Y(r));
    return !at || at.mat === SKIN;
  };
  if (ear && (ears || ear === "hoop" || ear === "drop"))
    for (const c of lobes) {
      if (ear === "stud" && open(c, 8)) s.px(X(c), Y(8), ORN, 4);
      if (ear === "cuff" && open(c, 7)) s.px(X(c), Y(7), ORN, 4);
      if (ear === "spool" && open(c, 8)) s.px(X(c), Y(8), ORN, 3), s.px(X(c), Y(7), ORN, 4);
      if ((ear === "hoop" || ear === "drop") && open(c, 9)) {
        s.px(X(c), Y(9), ORN, ear === "hoop" ? 3 : 4);
        // A drop swings a pixel behind the head as it moves.
        const swing = ear === "drop" ? Math.max(-1, Math.min(1, Math.round(h.drift))) : 0;
        if (open(c, 10)) s.px(X(c) + swing, Y(10), ORN, ear === "hoop" ? 4 : 3);
        if (ear === "drop") s.px(X(c) + swing, Y(11), ORN, 2);
      }
    }
  const nose = a.adornment?.nose;
  if (!nose || nose === "none") return;
  const n = view === "front" ? 8 : view === "q" ? 12 : view === "side" ? 13 : -1;
  if (n < 0) return;
  if (nose === "stud") s.px(X(view === "front" ? 8 : n - 1), Y(8 + lo), ORN, 4);
  if (nose === "ring") s.px(X(n), Y(9 + lo), ORN, 4);
  if (nose === "septum") s.px(X(view === "front" ? 7 : n - 1), Y(9 + lo), ORN, 4);
}

/** Combs, pins, a flower, a net or a ribbon in the hair, where the hair shows. */
/** The bauta's white face with its jutting chin, or the plague doctor's beak with glass eyes. */
function mask(h: Head, lo: number) {
  const { s, a, view } = h;
  const { m, X, Y } = local(h);
  const k = m();
  const end = 9 + lo;
  const [c0, c1] = view === "front" ? [1, 12] : view === "q" ? [3, 14] : [6, 14];
  const eyes = view === "front" ? [[3, 4], [9, 10]] : view === "q" ? [[5, 6], [10, 10]] : [[9, 9]];
  const veil = a.wearing.mask;
  if (veil === "yashmak" || veil === "niqab" || veil === "haik" || veil === "grille") {
    // Street veils: below the eyes, or the whole face with one eye left free, or a grille over it.
    const from = veil === "yashmak" || veil === "niqab" ? 7 : 3;
    const to = veil === "niqab" ? end + 4 : end + 1;
    for (let r = from; r <= to; r++) {
      const narrow = veil === "niqab" && r > end + 1 ? r - end - 1 : 0;
      k.span(r, view === "front" ? c0 + 1 + narrow : c0 + narrow, view === "front" ? c1 - 1 - narrow : c1);
    }
    s.put(k.mask, veil === "yashmak" ? WHITE : HAT, {
      ring: "line", shade: 0.3, light: 0.2, bottom: true,
      tone: veil === "grille" ? (x, y, t) => (y >= Y(5) && y <= Y(7) && (x + y) % 2 === 0 ? 1 : t) : undefined,
    });
    if (veil === "haik") for (let c = eyes[0][0]; c <= eyes[0][1]; c++) s.px(X(c), Y(6), EYE, 0);
    return;
  }
  if (a.wearing.mask === "bauta") {
    for (let r = 3; r <= end + 1; r++) k.span(r, c0, c1);
    // The chin juts forward so the wearer can eat and talk behind it.
    if (view === "front") k.span(end + 2, 4, 9);
    else k.rows(end - 1, [[c1, c1 + 1], [c1, c1 + 2], [c1 - 3, c1 + 1]]);
  } else {
    for (let r = 4; r <= end - 1; r++) k.span(r, c0 + 1, c1 - 1);
    if (view === "front") k.rows(end - 1, [[4, 9], [5, 8], [5, 8], [6, 7], [6, 7]]);
    else k.rows(6 + lo, [[c1, c1 + 2], [c1, c1 + 4], [c1, c1 + 5], [c1, c1 + 3], [c1 - 1, c1 + 1]]);
  }
  s.put(k.mask, a.wearing.mask === "bauta" ? WHITE : LEATHER, { ring: "ink", shade: 0.3, light: 0.25, top: true, bottom: true });
  for (const [e0, e1] of eyes) for (let c = e0; c <= e1; c++) s.px(X(c), Y(6), a.wearing.mask === "beak" ? GLASS : EYE, a.wearing.mask === "beak" ? 3 : 0);
}

function hairOrnament(h: Head, st: Style, lo: number) {
  const { s, a, view } = h;
  const kind = a.wearing.hairOrnament;
  if (!kind || kind === "none") return;
  const { X, Y, m } = local(h);
  const back = view === "back" || view === "bq";
  const hairAt = (c: number, r: number) => s.at(X(c), Y(r))?.mat === HAIR;
  const deco = m();
  if (kind === "comb") {
    if (back) deco.span(2, 4, 9).span(3, 4, 9);
    else if (view === "front") deco.span(0, 5, 8);
    else deco.span(1, 1, 3).span(2, 1, 3);
  } else if (kind === "pins") {
    // Long pins through the knot, a bead at each end.
    const sticks: [number, number, number, number][] = view === "front" || back ? [[10, 2, 13, -1], [3, 2, 0, -1]] : [[3, 1, 0, -2], [5, 0, 3, -3]];
    for (const [c0, r0, c1, r1] of sticks) deco.mask.line(X(c0), Y(r0), X(c1), Y(r1), 1);
    for (const [, , c1, r1] of sticks) s.px(X(c1), Y(r1), PLUME, 4);
  } else if (kind === "flower") {
    const [c, r] = view === "front" ? [12, 4] : view === "q" ? [1, 4] : view === "side" ? [4, 4] : [1, 4];
    deco.span(r, c, c + 1).span(r + 1, c, c + 1).set(c + (view === "front" ? -1 : 2), r);
  } else if (kind === "net") {
    // Beads at the knots of the net, over the gathered hair.
    for (let r = 2; r < st.back + lo; r += 2)
      for (let c = 0; c <= 13; c += 2) if (hairAt(c, r) && (back || view !== "front" || c <= 2 || c >= 11)) s.px(X(c), Y(r), DECO, 4);
    return;
  } else if (kind === "kanzashi") {
    // The great swept knot first, then the pins fanned through it and a comb across the front.
    const knot = m();
    knot.rows(-4, [[4, 9], [2, 11], [1, 12], [1, 12]]);
    if (view === "side" || view === "q") knot.rows(-1, [[-2, 1], [-2, 1], [-1, 1]]);
    s.put(knot.mask, HAIR, { ring: "ink", shade: 0.3, light: 0.25, top: true });
    const sticks: [number, number, number, number][] = view === "side" ? [[3, -3, -3, -7], [5, -4, 1, -8], [8, -4, 11, -8]]
      : [[3, -2, -3, -6], [4, -3, -1, -8], [9, -3, 14, -8], [10, -2, 16, -6], [5, -4, 4, -8], [8, -4, 9, -8]];
    for (const [a0, b0, a1, b1] of sticks) deco.mask.line(X(a0), Y(b0), X(a1), Y(b1), 1);
    if (!back) deco.span(-1, 3, 10);
    for (const [, , a1, b1] of sticks) s.px(X(a1), Y(b1), PLUME, 4);
  } else if (kind === "ribbon") {
    const r = Math.min(st.back + lo - 1, 11);
    if (back) deco.span(r, 5, 8).set(5, r + 1).set(8, r + 1);
    else if (view === "front") deco.span(6, 13, 14).set(14, 7);
    else deco.span(r, 0, 1).set(0, r + 1);
  }
  if (!deco.mask.empty()) s.put(deco.mask, DECO, { ring: "line", shade: 0.3, light: 0.3 });
}

/** Where a hat can carry trim: the band row and its columns across the
 * crown, and the point a feather or cockade is pinned at. */
const hatBands: Partial<Record<CharacterAppearance["wearing"]["headwear"], { band?: [number, number, number]; pin: [number, number] }>> = {
  brimmed: { band: [1, 4, 9], pin: [9, 0] },
  bowler: { band: [2, 3, 10], pin: [9, -1] },
  "top-hat": { band: [1, 4, 9], pin: [9, -2] },
  capotain: { band: [1, 3, 10], pin: [9, -1] },
  cap: { pin: [10, 0] },
  "flat-cap": { pin: [10, 0] },
  fedora: { band: [1, 3, 10], pin: [10, -1] },
  boater: { band: [0, 3, 10], pin: [10, -1] },
  cloche: { band: [2, 1, 12], pin: [11, 1] },
  beret: { pin: [11, -1] },
  pillbox: { band: [0, 4, 9], pin: [9, -2] },
  conical: { band: [0, 1, 12], pin: [9, -1] },
  turban: { pin: [8, -3] },
  wrap: { pin: [9, -1] },
  fez: { pin: [8, -3] },
};

function hatTrim(h: Head) {
  const { s, a, view } = h;
  const trim = a.wearing.hatTrim;
  const at = hatBands[a.wearing.headwear];
  if (!trim || trim === "none" || !at) return;
  const { X, Y, m } = local(h);
  const back = view === "back" || view === "bq";
  if (trim === "ribbon" && at.band) {
    const [r, c0, c1] = at.band;
    const band = m();
    band.span(r, c0, c1);
    s.put(band.mask, PLUME, { ring: "none", shade: 0.3, light: 0.2 });
    // Two tails off the back of the band, streaming behind a walk.
    if (view !== "front") {
      const tails = new Mask();
      const base = back ? [X(6), X(7)] : [X(c0)];
      base.forEach((x, n) => {
        for (let i = 1; i <= 3 - n; i++) tails.set(Math.round(x + (h.drift * i) / 3), Y(r + i));
      });
      s.put(tails, PLUME, { ring: "line", shade: 0.4 });
    }
    return;
  }
  // A ribbon needs a band to go round; without one it was drawn as a feather.
  if (trim === "ribbon") return;
  // Pinned on the side the wearer turns toward, and seen from behind on the other.
  const [pc, pr] = at.pin;
  const c = back ? 13 - pc : pc;
  if (trim === "cockade") {
    const rosette = m();
    rosette.span(pr + 1, c, c + 1).span(pr + 2, c, c + 1);
    s.put(rosette.mask, PLUME, { ring: "line", shade: 0, tone: (x, y, t) => (x === X(c) && y === Y(pr + 1) ? 1 : t) });
    return;
  }
  // A plume curling up and back from the pin.
  const plume = m();
  const dir = back ? -1 : 1;
  // A curled feather whose drooping tip lags the head, up as a step lands, back as it walks.
  const bob = Math.round(h.lag), trail = Math.round(h.drift);
  plume.mask.line(X(c), Y(pr + 1), X(c + dir), Y(pr - 2), 2).line(X(c + dir), Y(pr - 2), X(c + dir * 3) + trail, Y(pr - 4) - bob, 2)
    .line(X(c + dir * 3) + trail, Y(pr - 4) - bob, X(c + dir * 5) + trail, Y(pr - 3) - bob, 1);
  // The spine catches the light; the barbs sit in shade.
  s.put(plume.mask, PLUME, { ring: "ink", shade: 0.5, light: 0.3, top: true });
}

/** Facing away, the first skin under the hair is in its shade, and the neck
 * shows in shadow between skull and collar. */
function nape(h: Head, last: number) {
  const { s } = h;
  const { X, Y } = local(h);
  for (let c = 0; c <= 13; c++)
    for (let r = 1; r <= last; r++) {
      const p = s.at(X(c), Y(r));
      if (p?.mat !== SKIN || p.tone < 3) continue;
      // The skull turns under in its lower third, so a shaved head reads round.
      if (r >= last - 3 || s.at(X(c), Y(r - 1))?.mat === HAIR) s.retone(X(c), Y(r), 2);
    }
  // A bare crown catches the light.
  for (const [c, r] of [[4, 1], [5, 1], [3, 2]]) if (s.at(X(c), Y(r))?.mat === SKIN) s.retone(X(c), Y(r), 4);
  for (let c = 5; c <= 8; c++) if (s.at(X(c), Y(last + 1))?.mat !== HAIR) s.px(X(c), Y(last + 1), SKIN, 2);
}

/** Brim row and how far its shade reaches down the face, counting the brim's own line. */
const brims: Partial<Record<CharacterAppearance["wearing"]["headwear"], [number, number]>> = {
  brimmed: [2, 4], conical: [2, 4], "top-hat": [2, 3], bowler: [3, 3], "flat-cap": [3, 3], "ball-cap": [3, 3], kettle: [2, 3], kabuto: [2, 2],
  fedora: [2, 3], boater: [2, 3], cloche: [4, 1], "pith-helmet": [2, 3], tricorne: [1, 3], bicorne: [1, 2], gat: [2, 2], capotain: [2, 3], shako: [3, 2],
};

/** The brim's upper face catches the light, and the face under it is in shade;
 * eyes keep their whites, so they still read under a wide hat. */
function brim(h: Head, hat: Mask) {
  const at = brims[h.a.wearing.headwear];
  if (!at) return;
  const { s, view } = h;
  const { Y } = local(h);
  const [row, depth] = at;
  for (let x = 0; x < W; x++) {
    for (const y of [Y(row), Y(row + 1)]) if (hat.has(x, y) && !hat.has(x, y - 1)) s.retone(x, y, 4);
    if (view === "back" || view === "bq") continue;
    let low = -1;
    for (let y = Y(row); y <= Y(row + 3); y++) if (hat.has(x, y)) low = y;
    if (low < 0) continue;
    for (let d = 1; d <= depth; d++) {
      const p = s.at(x, low + d);
      if (p && (p.mat === SKIN || p.mat === HAIR) && p.tone >= 3) s.retone(x, low + d, 2);
    }
  }
}

function headwear(h: Head, lo: number) {
  const { s, a, view } = h;
  const hat = a.wearing.headwear;
  const { m, X, Y } = local(h);
  const sideways = view === "side" || view === "q";
  const front = view === "front" || view === "q";
  const k = m();
  const extra = m();
  let mat = HAT;
  let ring: "ink" | "line" = "ink";
  const last = headSpans(h).length - 1;
  switch (hat) {
    case "band":
      k.span(3, 0, 13).span(4, 0, 13);
      ring = "line";
      break;
    case "fillet":
      k.span(3, 0, 13);
      mat = METAL;
      ring = "line";
      if (front) extra.set(view === "front" ? 6 : 10, 3).set(view === "front" ? 7 : 10, 3);
      break;
    case "plume": {
      k.span(3, 0, 13);
      const bob = Math.round(h.lag), trail = Math.round(h.drift);
      extra.mask.line(X(6), Y(2), X(4) + trail, Y(-6) - bob, 2).line(X(8), Y(2), X(9) + trail, Y(-7) - bob, 2).line(X(7), Y(2), X(7) + trail, Y(-5) - bob, 1);
      break;
    }
    case "cap":
      k.span(-1, 5, 8).span(0, 3, 10).rows(1, [[1, 12], [0, 13], [0, 13]]);
      break;
    case "bowler":
      k.span(-4, 5, 8).span(-3, 4, 9).rows(-2, [[3, 10], [3, 10], [3, 10], [3, 10], [3, 10]]).span(3, sideways ? 0 : 1, sideways ? 14 : 12);
      extra.span(2, 3, 10);
      break;
    case "top-hat":
      k.span(-7, 3, 10);
      for (let r = -6; r <= 2; r++) k.span(r, 4, 9);
      k.span(3, 1, 12).span(2, 0, 0).span(2, 13, 13);
      extra.span(1, 4, 9).span(2, 4, 9);
      break;
    case "brimmed":
      k.span(-3, 5, 8).rows(-2, [[4, 9], [4, 9], [4, 9], [4, 9]]).span(2, -1, 14).span(3, -2, 15);
      if (!sideways) k.span(4, 0, 13);
      extra.span(1, 4, 9);
      break;
    case "conical":
      [[6, 7], [5, 8], [4, 9], [3, 10], [2, 11], [1, 12], [0, 13], [-2, 15], [-3, 16]].forEach(([c0, c1], i) => k.span(i - 5, c0, c1));
      break;
    case "flat-cap":
      k.span(-1, sideways ? 4 : 3, sideways ? 12 : 10).rows(0, [[0, 13], [0, 13], [0, 13]]);
      if (sideways) k.span(3, 9, 15);
      else extra.span(3, 2, 11);
      break;
    case "fedora":
      // A creased crown: two lobes over a dip from in front, sloping to a pinched front in profile.
      if (sideways) k.span(-4, 3, 8).rows(-3, [[3, 10], [3, 10], [3, 10], [3, 10], [3, 10]]).span(2, -1, 14).set(15, 3).set(14, 3);
      else k.span(-4, 4, 5).span(-4, 8, 9).rows(-3, [[3, 10], [3, 10], [3, 10], [3, 10], [3, 10]]).span(2, -1, 14);
      // The brim snaps down at the front and turns up behind.
      if (view === "front") k.span(3, 2, 11);
      if (view === "back" || view === "bq") k.span(1, -1, 0).span(1, 13, 14);
      extra.span(1, 3, 10);
      break;
    case "boater":
      k.rows(-2, [[3, 10], [3, 10], [3, 10], [3, 10]]).span(2, sideways ? -2 : -1, sideways ? 15 : 14);
      extra.span(0, 3, 10).span(1, 3, 10);
      break;
    case "cloche":
      // A bell to the eyebrows, its edge flaring a little all round.
      k.span(-2, 4, 9).span(-1, 2, 11).rows(0, [[1, 12], [0, 13], [0, 13], [0, 13]]).span(4, -1, 14);
      if (sideways) k.span(4, -1, 12).rows(5, [[-1, 4], [0, 3]]);
      if (view === "back" || view === "bq") k.rows(5, [[-1, 14], [0, 13]]);
      extra.span(2, 1, 12);
      break;
    case "tam":
      // Knitted, slouched big over the locks and hanging behind.
      k.rows(-4, [[3, 10], [1, 12], [0, 13], [0, 13], [0, 13], [1, 12], [0, 13]]);
      if (sideways) k.rows(-3, [[-2, 1], [-3, 1], [-3, 1], [-3, 1], [-2, 1]]);
      if (view === "back" || view === "bq") k.rows(3, [[0, 13], [1, 12]]);
      extra.span(-2, 0, 13).span(0, 0, 13);
      break;
    case "beret":
      // A soft disc tipped toward one ear, with its stalk on top.
      k.span(-2, 3, 11).span(-1, 1, 14).span(0, 0, 14).span(1, 1, 12);
      extra.set(7, -3);
      break;
    case "pillbox":
      // Set back on the crown, the front hair showing.
      if (sideways) k.rows(-3, [[1, 7], [1, 7], [1, 7], [1, 7]]);
      else k.rows(-3, [[4, 9], [4, 9], [4, 9], [4, 9]]);
      extra.span(0, sideways ? 1 : 4, sideways ? 7 : 9);
      break;
    case "ball-cap":
      k.span(-1, 4, 9).rows(0, [[2, 11], [1, 12], [1, 12]]);
      if (sideways) k.span(3, 10, 16);
      else if (view === "front") extra.span(3, 3, 10).span(4, 4, 9);
      break;
    case "peaked-cap": {
      // The crown stands wider than the band; the peak is lacquered black.
      k.span(-3, 1, 12).span(-2, 0, 13).span(-1, 1, 12).rows(0, [[2, 11], [2, 11], [2, 11]]);
      extra.span(1, 2, 11).span(2, 2, 11);
      const peak = m();
      if (sideways) peak.span(3, 10, 15).span(2, 12, 14);
      else if (view === "front") peak.span(3, 3, 10);
      if (!peak.mask.empty()) s.put(peak.mask, BOOT, { ring: "ink", shade: 0, light: 0.4 });
      break;
    }
    case "pith-helmet":
      k.span(-4, 5, 8).span(-3, 3, 10).rows(-2, [[2, 11], [1, 12], [1, 12], [1, 12]]);
      // The brim dips over the brow and the nape and stands off at the ears.
      if (sideways) k.span(2, -2, 15).span(3, -3, -1).span(3, 14, 16);
      else k.span(2, -1, 14).span(3, view === "front" ? 1 : -1, view === "front" ? 12 : 14);
      extra.span(1, 1, 12);
      break;
    case "fez": {
      k.span(-4, 5, 8).span(-3, 4, 9).span(-2, 4, 9).span(-1, 4, 9).span(0, 3, 10).span(1, 3, 10).span(2, 3, 10);
      // The tassel's end swings behind a walk.
      const swing = Math.max(-1, Math.min(1, Math.round(h.drift)));
      extra.set(9, -4).set(10, -3);
      extra.mask.set(X(11) + swing, Y(-2)).set(X(11) + swing, Y(-1)).set(X(11) + swing * 2, Y(0));
      break;
    }
    case "turban":
      k.span(-4, 4, 9).span(-3, 2, 11).rows(-2, [[0, 13], [-1, 14], [-1, 14], [-1, 14], [-1, 14], [0, 13], [0, 13]]);
      if (front) extra.set(view === "front" ? 6 : 10, 0).set(view === "front" ? 7 : 10, 0);
      // The loose end, tucked at the back and hanging to the nape.
      if (view === "side" || view === "q") k.rows(3, [[-2, -1], [-2, -1], [-2, -1], [-1, -1], [-1, -1]]);
      if (view === "back" || view === "bq") k.rows(4, [[8, 10], [8, 10], [8, 9], [8, 9], [8, 9], [8, 9]]);
      break;
    case "wrap":
      // Snug to the skull with a rounded crown: a wrap wider than the head reads as a straw brim.
      k.span(-3, 5, 8).span(-2, 3, 10).span(-1, 1, 12).rows(0, [[0, 13], [0, 13], [0, 13], [0, 13], [1, 12]]);
      if (view === "side" || view === "q") k.rows(1, [[-2, 0], [-3, 0], [-2, -1]]);
      break;
    case "helmet":
      // A bowl down to the brow, not round the cheeks: past the ears it reads as a hood.
      k.span(-3, 5, 8).span(-2, 3, 10).span(-1, 1, 12).rows(0, [[0, 13], [0, 13], [0, 13], [-1, 14]]);
      if (sideways) k.rows(4, [[-1, 2], [-1, 1]]);
      if (view === "back" || view === "bq") k.span(4, 0, 13);
      break;
    case "nasal":
      [[6, 7], [5, 8], [4, 9], [3, 10], [2, 11], [1, 12], [0, 13], [0, 13]].forEach(([c0, c1], i) => k.span(i - 4, c0, c1));
      // The bar down over the nose.
      if (view === "front") k.rows(4, [[6, 7], [6, 7]]);
      if (view === "q") k.rows(4, [[10, 10], [10, 10]]);
      break;
    case "kettle":
      k.span(-3, 5, 8).span(-2, 4, 9).rows(-1, [[3, 10], [3, 10], [3, 10]]).span(2, -2, 15);
      if (!sideways) k.span(3, -1, 0).span(3, 13, 14);
      break;
    case "kabuto":
      k.span(-2, 3, 10).span(-1, 1, 12).span(0, 0, 13).span(1, -1, 14);
      // The neck guard flares out below the bowl: all round from behind, at the sides from in front.
      if (view === "back" || view === "bq") k.rows(2, [[-2, 15], [-3, 16], [-3, 16], [-3, 16]]);
      else if (sideways) k.rows(2, [[-2, 5], [-3, 3], [-3, 2], [-3, 1]]);
      else k.rows(2, [[-2, 1], [-3, 1], [-3, 0], [-3, 0]]).rows(2, [[12, 15], [12, 16], [13, 16], [13, 16]]);
      // The crest: two gilt horns over the brow.
      if (view === "front") extra.set(4, -3).set(3, -4).set(2, -5).set(9, -3).set(10, -4).set(11, -5);
      if (view === "q") extra.set(8, -3).set(7, -4).set(11, -3).set(12, -4);
      break;
    case "official-cap":
      // A tall back crown, a lower front, and a stiff wing out at each side.
      k.span(-4, 5, 10).span(-3, 3, 11).span(-2, 2, 11).rows(-1, [[1, 12], [0, 13], [0, 13], [0, 13]]);
      if (view === "front" || view === "back") k.span(0, -5, 18);
      else if (view === "q" || view === "bq") k.span(0, -3, 16);
      else k.span(-1, -1, 1).span(0, -1, 1);
      break;
    case "jaguar":
    case "eagle": {
      // The face in the open jaws: a pelt or feathered crown over the brow and
      // down the cheeks, the upper jaw or beak over the forehead.
      k.span(-3, 4, 9).span(-2, 2, 11).span(-1, 1, 12).rows(0, [[0, 13], [-1, 14], [-1, 14]]);
      const sides = view === "front" ? [[-1, 1], [12, 14]] : view === "q" ? [[-1, 3]] : view === "side" ? [[-1, 5]] : [[-1, 14]];
      for (let r = 3; r <= 6; r++) for (const [c0, c1] of sides) k.span(r, c0, c1);
      if (hat === "jaguar") {
        k.set(2, -4).set(3, -4).set(10, -4).set(11, -4);
        if (view === "front") extra.set(3, 3).set(5, 3).set(8, 3).set(10, 3);
        if (view === "q") extra.set(7, 3).set(9, 3).set(11, 3);
      } else {
        if (view === "front") extra.span(3, 5, 8).span(4, 6, 7);
        if (view === "q") extra.span(2, 9, 13).span(3, 10, 13).set(13, 4);
        if (view === "side") extra.span(2, 11, 16).span(3, 13, 16).set(16, 4);
      }
      break;
    }
    case "crown":
      // A band at the brow with five points; gems set in the band.
      k.span(2, 0, 13).span(3, 0, 13);
      for (const c of [0, 3, 10, 13]) k.span(1, c, c).span(0, c, c);
      k.span(1, 6, 7).span(0, 6, 7).span(-1, 6, 7);
      mat = METAL;
      ring = "line";
      if (front) extra.set(view === "front" ? 3 : 9, 3).set(view === "front" ? 10 : 12, 3).set(view === "front" ? 6 : 11, 2);
      break;
    case "nemes": {
      // Close over the skull to the brow, the lappets falling past the ears.
      k.span(-1, 4, 9).span(0, 2, 11).rows(1, [[0, 13], [-1, 14], [-1, 14]]);
      const lap = view === "front" ? [[-2, 1], [12, 15]] : view === "q" ? [[-2, 2], [13, 15]] : view === "side" ? [[-2, 4]] : [[-2, 15]];
      for (let r = 4; r <= last + 3; r++) for (const [c0, c1] of lap) k.span(r, c0 + (r > last ? 1 : 0), c1 - (r > last ? 1 : 0));
      // The uraeus rearing at the brow.
      if (view === "front") extra.set(6, 2).set(7, 2).set(6, 1);
      if (view === "q") extra.set(10, 2).set(10, 1);
      break;
    }
    case "mian":
      // A cap on the topknot under a flat board, bead strings hanging from both ends.
      k.span(-1, 4, 9).rows(0, [[2, 11], [1, 12], [1, 12], [1, 12]]);
      if (sideways) {
        k.span(-2, view === "side" ? -4 : -2, view === "side" ? 17 : 15);
        for (const c of view === "side" ? [-4, 17] : [-2, 15]) for (let r = -1; r <= 3; r++) extra.set(c, r);
      } else {
        k.span(-2, -1, 14);
        for (const c of [0, 2, 11, 13]) for (let r = -1; r <= 3; r++) if (r % 2 !== 0 || c % 2 === 0) extra.set(c, r);
      }
      break;
    case "kanmuri":
      // High on the topknot; the stiff tail stands up behind.
      k.span(-2, 5, 8).span(-1, 3, 10).rows(0, [[2, 11], [1, 12], [1, 12]]);
      if (view === "side") k.rows(-7, [[1, 2], [1, 2], [1, 2], [1, 2], [2, 3], [2, 3], [3, 4]]);
      else if (view === "q") k.rows(-7, [[3, 4], [3, 4], [3, 4], [3, 4], [4, 4], [4, 5], [4, 5]]);
      else k.rows(-7, [[6, 7], [6, 7], [6, 7], [6, 7], [6, 7]]);
      break;
    case "tricorne":
      // The brim turned up on three sides; one corner points over the brow.
      if (view === "side") k.span(-2, 4, 9).span(-1, 3, 9).span(0, -2, -1).span(0, 3, 9).span(0, 13, 15).span(1, -2, 15).span(2, 1, 12);
      else if (view === "q") k.span(-2, 4, 9).span(-1, 3, 10).span(0, -1, 0).span(0, 3, 10).span(1, -1, 15).span(2, 2, 14).span(3, 12, 14);
      else k.span(-2, 4, 9).span(-1, 3, 10).span(0, -1, 0).span(0, 3, 10).span(0, 13, 14).span(1, -1, 14).span(2, 1, 12).span(3, 5, 8);
      break;
    case "bicorne":
      // A half-moon worn crosswise: broad from in front, a narrow wedge in profile.
      if (view === "side") k.rows(-4, [[5, 7], [4, 8], [4, 8], [4, 8], [4, 8], [4, 8], [3, 9]]);
      else if (view === "q" || view === "bq") k.rows(-3, [[4, 9], [2, 11], [1, 12], [0, 13], [0, 13], [2, 11]]);
      else k.rows(-4, [[5, 8], [2, 11], [0, 13], [-2, 15], [-3, 16], [-3, 16], [1, 12]]);
      if (view === "front") extra.set(11, -2).set(11, -1);
      break;
    case "shako":
      // A felt cylinder a little wider at the top, a leather peak over the brow, a brass plate and a tuft.
      k.rows(-7, [[2, 11], [2, 11], [3, 10], [3, 10], [3, 10], [3, 10], [3, 10], [2, 11], [1, 12], [0, 13]]);
      if (view === "front") k.span(3, 3, 10);
      else if (view === "q") k.span(3, 6, 13);
      else if (view === "side") k.span(3, 9, 15);
      if (view === "front") extra.span(-4, 5, 8).span(-3, 5, 8).span(-2, 6, 7).span(-9, 6, 7).span(-8, 6, 7);
      else if (view === "q") extra.span(-4, 9, 11).span(-3, 9, 11).span(-9, 8, 9).span(-8, 8, 9);
      else extra.span(-9, 7, 8).span(-8, 7, 8);
      break;
    case "bearskin":
      // Black fur standing twice the head's height, rounded at the crown.
      k.rows(-11, [[4, 9], [3, 10], [2, 11], [2, 11], [1, 12], [1, 12], [1, 12], [1, 12], [1, 12], [1, 12], [1, 12], [1, 12], [0, 13], [0, 13], [0, 13]]);
      if (view === "front") extra.span(2, 3, 10);
      break;
    case "gat":
      // A tall narrow crown on a wide flat brim, tied under the chin.
      k.rows(-5, [[5, 8], [5, 8], [5, 8], [5, 8], [5, 8], [4, 9], [4, 9]]).span(2, -4, 17);
      if (view === "front") for (let r = 3; r <= last; r += 2) extra.set(0, r).set(13, r);
      break;
    case "hennin": {
      // A cone off the back of the head; the veil hangs from its point.
      const tilt = view === "side" ? -0.5 : view === "q" ? -0.3 : view === "bq" ? 0.3 : 0;
      for (let r = 2; r >= -11; r--) {
        const half = 0.6 + (r + 11) * 0.42, c = 6.5 + (2 - r) * tilt;
        k.span(r, Math.round(c - half), Math.round(c + half));
      }
      k.span(3, 0, 13);
      const tip = Math.round(6.5 + 13 * tilt);
      if (view === "side" || view === "q") extra.mask.line(X(tip), Y(-11), X(-3), Y(12), 2);
      else if (view !== "front") extra.mask.line(X(tip), Y(-11), X(6), Y(13), 3);
      break;
    }
    case "mobcap": {
      // Gathered linen over the crown, set back so the hair shows at the brow, a frill at the edge.
      const spans = headSpans(h);
      k.span(-1, 4, 9);
      for (let r = 0; r <= 1; r++) k.span(r, spans[r][0], spans[r][1]);
      if (view === "front") for (let r = 2; r <= 5; r++) k.span(r, spans[r][0] - 1, spans[r][0]).span(r, spans[r][1], spans[r][1] + 1);
      else if (view === "back" || view === "bq") for (let r = 2; r <= 6; r++) k.span(r, spans[r][0], spans[r][1]);
      else for (let r = 2; r <= 6; r++) k.span(r, spans[r][0], 4);
      ring = "line";
      break;
    }
    case "capotain":
      k.rows(-6, [[4, 9], [4, 9], [4, 9], [4, 9], [3, 10], [3, 10], [3, 10], [3, 10]]).span(2, sideways ? -1 : 0, sideways ? 14 : 13);
      extra.span(1, 3, 10);
      break;
    case "bork":
      // Felt standing a hand high, its back folded down over the nape; a gilt spoon-case at the brow.
      k.rows(-8, [[4, 9], [3, 10], [3, 10], [3, 10], [3, 10], [3, 10], [2, 11], [2, 11], [1, 12], [1, 12], [0, 13]]).span(3, 0, 13);
      if (view === "side" || view === "q") k.rows(-7, Array.from({ length: 17 }, (_, i) => [i < 3 ? 1 : -1, i < 3 ? 2 : 0] as [number, number]));
      if (view === "back" || view === "bq") k.rows(3, Array.from({ length: 7 }, () => [3, 10] as [number, number]));
      if (front) extra.span(-1, view === "front" ? 6 : 10, view === "front" ? 7 : 11).span(0, view === "front" ? 6 : 10, view === "front" ? 7 : 11).span(2, 0, 13);
      break;
    case "dastar":
      // Wound to a peak over the brow.
      k.span(-5, 6, 7).span(-4, 5, 8).span(-3, 3, 10).rows(-2, [[1, 12], [0, 13], [0, 13], [0, 13], [0, 13], [0, 13]]);
      if (view === "side" || view === "q") k.span(-4, 9, 11).span(-3, 9, 12);
      if (view === "front") extra.set(6, -2).set(7, -2).set(5, -1).set(8, -1).set(4, 0).set(9, 0);
      break;
    case "wig":
      k.span(-2, 3, 10).span(-1, 1, 12).rows(0, [[0, 13], [-1, 14], [-1, 14]]);
      for (let r = 3; r <= 9 + lo; r++) k.span(r, -2, view === "front" ? 1 : 4).span(r, view === "front" ? 12 : 14, 15);
      if (view === "back" || view === "bq") for (let r = 3; r <= 12 + lo; r++) k.span(r, -1, 14);
      break;
    case "hood":
    case "headscarf":
    case "kerchief":
    case "wimple":
    case "veil": {
      // A shell one pixel proud of the skull, pinched at the neck, then
      // spread over the shoulders: the head-and-shoulders shape survives.
      const spans = headSpans(h);
      k.span(-1, spans[0][0] + 1, spans[0][1] - 1);
      spans.forEach(([c0, c1], r) => k.span(r, c0 - 1, c1 + 1));
      // A hood's point falls behind the head; from the front or back it would read as a balloon.
      if (hat === "hood" && view === "side") k.rows(0, [[-2, -1], [-3, -2], [-3, -2]]);
      if (hat === "hood" && view === "q") k.rows(0, [[-2, -1], [-2, -2]]);
      const c = h.bodyC - (view === "side" ? 1.5 : view === "q" ? 0.5 : 0);
      const drop = hat === "veil" || hat === "wimple" ? 6 : hat === "kerchief" ? 0 : 2;
      // A kerchief is knotted under the chin; its point hangs at the nape.
      if (hat === "kerchief") {
        if (view === "back" || view === "bq") k.rows(last - 1, [[4, 9], [5, 8], [6, 7]]);
        else if (view === "front") k.span(last + 1, 6, 7);
        else k.span(last + 1, 8, 9);
      } else k.span(last + 1, Math.round(c - 3.5), Math.round(c + 2.5));
      for (let i = 0; i < drop; i++) {
        const w = Math.min(h.shoulderW + 1.5, 4.5 + i * 1.5) - (hat === "veil" && i > 4 ? 0 : 0);
        k.span(last + 2 + i, Math.round(c - w), Math.round(c + w - 1));
      }
      // The wimple closes under the chin and round the cheeks.
      const chin = hat === "headscarf" || hat === "wimple" ? last - 1 : last;
      const cheek = hat === "wimple" ? 1 : 0;
      // The kerchief sits back off the brow, so the front of the hair shows.
      const brow = hat === "kerchief" ? 2 : 3;
      if (view === "front") for (let r = brow; r <= chin; r++) for (let x = 2 + cheek; x <= 11 - cheek; x++) if (!(r === chin && (x < 4 || x > 9))) k.mask.clear(X(x), Y(r));
      if (view === "q") for (let r = brow; r <= chin; r++) for (let x = 5 + cheek; x <= 14; x++) if (!(r === chin && x < 6 + cheek)) k.mask.clear(X(x), Y(r));
      if (view === "side") for (let r = brow; r <= chin; r++) for (let x = 7; x <= 14; x++) k.mask.clear(X(x), Y(r));
      break;
    }
    case "visor": {
      const ring = new Mask();
      for (let t = 0; t < 64; t++) {
        const ang = (t / 64) * Math.PI * 2;
        ring.set(Math.round(X(6.5) + Math.cos(ang) * 9), Math.round(Y(6) + Math.sin(ang) * 9.5));
      }
      s.put(ring, GLASS, { ring: "ink", shade: 0, light: 0 });
      s.px(X(2), Y(-1), WHITE, 3);
      s.px(X(1), Y(0), WHITE, 3);
      return;
    }
    default:
      return;
  }
  const cloth = hat === "hood" || hat === "headscarf" || hat === "veil" || hat === "wimple" || hat === "turban" || hat === "wrap" || hat === "kerchief";
  // Straw reads by its colour: pale and yellow.
  const hc = parseInt((a.wearing.headColor ?? "#000000").slice(1), 16);
  const straw = luma(a.wearing.headColor ?? "#000000") > 0.5 && (hc >> 16) > (hc & 255) + 30;
  s.put(k.mask, mat, {
    ring,
    shade: 0.32,
    light: 0.25,
    top: true,
    cast: true,
    bottom: hat !== "hood" && hat !== "headscarf" && hat !== "veil" && hat !== "kerchief" && hat !== "wimple",
    // The nemes in gold and lapis stripes.
    zone: hat === "nemes" ? (_x, y) => ((y - Y(0)) % 2 === 0 ? METAL : HAT) : undefined,
    tone:
      // Wound cloth: bands crossing on a slant, as the portrait winds them.
      hat === "turban" || hat === "dastar" || hat === "wrap"
        ? (x, y, t) => (t >= 3 && (x - y + 40) % 4 === 0 ? 2 : t)
        // Printed cotton: a small light spot.
        : hat === "kerchief"
          ? (x, y, t) => (t >= 3 && (x * 2 + y * 3) % 5 === 0 ? 4 : t)
        : straw && (hat === "brimmed" || hat === "boater")
          // Plaited straw: a woven tick along the brim and round the crown.
          ? (x, y, t) => (t >= 3 && (y === Y(2) || y === Y(-1)) && x % 2 === 0 ? 2 : t)
        : hat === "helmet"
          ? (_x, y, t) => (y === Y(3) ? Math.min(t, 2) : t)
        : hat === "jaguar"
          ? (x, y, t) => (t >= 2 && (x * 3 + y * 5) % 7 === 0 ? 1 : t)
        : hat === "eagle"
          ? (x, y, t) => (t >= 3 && (x + y) % 3 === 0 ? 2 : t)
        : hat === "wig"
          ? (_x, y, t) => (t >= 3 && y > Y(2) && (y - Y(0)) % 2 === 0 ? 2 : t)
        : hat === "mobcap"
          ? (x, y, t) => (t >= 3 && (y === Y(1) || x === X(0) || x === X(13)) && (x + y) % 2 === 0 ? 2 : t)
        : hat === "bearskin"
          ? (x, y, t) => (t >= 2 && (x * 3 + y * 2) % 5 === 0 ? t - 1 : t)
        : hat === "conical"
          ? (x, y, t) => (t >= 3 && Math.abs(x - X(6.5)) % 3 === 0 && y > Y(-3) ? 2 : t)
          : cloth
            ? (x, y, t) =>
                t === 3 && y > Y(headSpans(h).length + 1) && Math.abs(x - X(6.5)) === 2 ? 2
                // From behind, the seam up the back of a hood or scarf.
                : t >= 3 && (view === "back" || view === "bq") && (hat === "hood" || hat === "headscarf" || hat === "veil") &&
                    x === X(view === "back" ? 7 : 5) && y > Y(0) && y <= Y(headSpans(h).length) ? 2
                : t
            : undefined,
  });
  brim(h, k.mask);
  hatTrim(h);
  if (!extra.mask.empty()) {
    const accent = hat === "fillet" || hat === "turban" || hat === "kabuto" || hat === "eagle" || hat === "nemes" || hat === "shako" || hat === "bearskin" ? METAL : TRIM;
    // Felt hats carry a band of the same felt, darker; a boater's is ribbon.
    const self = ["flat-cap", "ball-cap", "fedora", "cloche", "pillbox", "beret"].includes(hat);
    s.put(extra.mask, hat === "plume" || hat === "jaguar" || hat === "mian" || hat === "hennin" ? WHITE : hat === "dastar" ? HAT : self ? HAT : accent, {
      ring: hat === "plume" || hat === "fez" ? "ink" : hat === "hennin" ? "line" : "none",
      shade: 0.3,
      light: 0.3,
      dark: self || hat === "dastar" ? 1 : 0,
    });
  }
}
