import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, glow, mix, pen, person, rgb, type Pal, type RGB } from "../kit";

export const lerp = (a: RGB, b: RGB, k: number) => a.map((v, i) => v + (b[i] - v) * k) as RGB;

const DAWN = new Set(["born", "hard", "alone", "eased", "cooled", "waited"]);
const LOW = new Set(["long", "hard", "late", "worse", "weak", "watch"]);

/** A room at night: a sleeping mat, a lamp on the floor, someone kneeling by
 * the one lying down. `fever` puts a child on the mat instead of a woman in labour. */
export function room(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending: string | undefined, fever: boolean) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), amber = rgb(pal.accent);
  const f = Math.floor(t / 130) % 3, e = ending ?? "";
  const dawn = DAWN.has(e) ? ease(t / 1800) : 0, low = LOW.has(e) || (e === "alone" && !fever);
  const lx = 112, r = low ? 0.66 : 1;
  const wall = [pal.ink, mix(ink, wood, 0.26), mix(ink, wood, 0.5)];
  const floor = [mix(ink, fill, 0.5), mix(fill, wood, 0.34), mix(fill, wood, 0.6)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, (y < 46 ? wall : floor)[glow(x, y, lx - 18, 38, 92 * r, 40 * r, f)]);
  // The window: night, or first light coming in across the floor.
  const sky = mix(lerp(ink, fill, 0.7), lerp(amber, light, 0.5), dawn);
  rect(18, 10, 18, 18, mix(wood, ink, 0.3));
  rect(20, 12, 14, 14, sky);
  rect(26, 12, 2, 14, mix(wood, ink, 0.3));
  if (!dawn) px(23, 15, mix(light, fill, 0.4));
  const beam = mix(wood, light, 0.4);
  for (let y = 46; y < 62 && dawn; y++)
    for (let x = 0; x < 18; x++) {
      const sx = Math.round(26 + (y - 46) * 1.3 + x);
      if (bayer(sx, y) < 0.5 * dawn) px(sx, y, beam);
    }
  // The door: shut, or open on the dark with you going out, lantern in hand.
  const out = e === "send";
  rect(132, 12, 15, 34, out ? mix(ink, fill, 0.75) : mix(wood, ink, 0.25));
  if (!out) for (const x of [135, 139, 143]) rect(x, 13, 1, 32, mix(wood, ink, 0.5));
  else {
    person(ctx, 137, 45, 14, mix(ink, wood, 0.3), mix(wood, light, 0.2));
    rect(142, 37, 2, 3, mix(amber, light, 0.3));
  }
  // The mat, with whoever lies on it.
  const cv = fever ? lerp(fill, light, 0.45) : lerp(amber, wood, 0.5), cover = mix(cv, cv, 0), fold = mix(cv, light, 0.3), shade = mix(cv, ink, 0.3);
  rect(38, 46, 56, 4, mix(wood, ink, 0.3));
  rect(38, 44, 56, 2, mix(wood, light, 0.3));
  rect(40, 41, 9, 3, mix(light, wood, 0.15));
  const up = fever ? ["eased", "cooled"].includes(e) : ["born", "late", "alone"].includes(e);
  const sk = lerp(wood, light, 0.4), skin = mix(sk, sk, 0), flush = mix(sk, rgb("#d0503a"), fever && !dawn && e !== "weak" ? 0.5 : 0);
  if (fever) {
    if (up) {
      rect(52, 32, 5, 5, flush);
      rect(50, 37, 9, 7, cover);
      rect(50, 37, 2, 7, shade);
      rect(58, 40, 16, 4, cover);
    } else {
      rect(43, 37, 5, 5, flush);
      rect(48, 39, 26, 5, cover);
      rect(49, 38, 22, 1, fold);
      rect(48, 43, 26, 1, shade);
    }
  } else {
    const head = up ? 33 : 37;
    rect(43, head, 5, 5, skin);
    rect(47, head + 4, 9, 7 - (head - 33), cover);
    rect(55, 35, 14, 9, cover);
    rect(57, 34, 10, 1, fold);
    rect(69, 39, 20, 5, cover);
    rect(47, 43, 42, 1, shade);
  }
  // The baby, once there is one: in arms, or on the mat beside a mother too weak to hold it.
  const babe = mix(light, amber, 0.1);
  if (!fever && ["born", "late", "alone"].includes(e)) {
    rect(48, 36, 6, 4, babe);
    px(48, 36, mix(sk, sk, 0));
  }
  if (!fever && e === "hard") rect(76, 37, 6, 3, babe);
  // Whoever kneels by the mat, lit from the lamp behind; by morning asleep against it.
  const kneel = (kx: number, slump: number, right = false) => {
    const body = mix(wood, ink, 0.35), lit = mix(wood, amber, 0.35);
    rect(kx, 33 + slump, 7, 11 - slump, body);
    rect(kx + 6, 34 + slump, 1, 10 - slump, lit);
    rect(kx - 2, 42, 12, 4, body);
    rect(right ? kx + 3 : kx - 1 - slump * 2, 28 + slump * 2, 5, 5, skin);
    rect(right ? kx + 7 : kx - 5, 37, 5, 2, body);
  };
  if (!(e === "alone" || (!fever && e === "send"))) kneel(96, e === "waited" ? 3 : 0);
  if (fever && !["waited", "alone"].includes(e)) rect(90, 36, 3, 2, mix(light, fill, 0.2));
  if (!fever && (e === "long" || e === "hard")) kneel(26, 0, true);
  rect(lx - 3, 41, 8, 3, mix(wood, ink, 0.2));
  rect(lx - 2, 40, 6, 1, mix(amber, wood, 0.3));
  if (low) rect(lx, 38, 2, 2 + (f === 1 ? 1 : 0), mix(amber, light, 0.2));
  else flame(ctx, lx - 1, 35, f);
  fadeEdges(ctx, pal.ink);
}

export default function cradle(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  room(ctx, pal, t, ending, false);
}
