import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** Evening at the giver's door: the mat on the threshold, and what your household lays on it. */
export default function bundle(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), green = rgb(pal.accent);
  const f = Math.floor(t / 120) % 3;
  const out = ending === "shamed" || ending === "gone" ? ease((t - 300) / 700) : 0;
  const fire: [number, number, number] = [0xe8, 0x85, 0x3a];
  const sky = [mix(ink, fill, 0.5), mix(fill, green, 0.18), mix(fill, light, 0.25)];
  const ground = [mix(ink, fill, 0.6), mix(fill, wood, 0.4), mix(wood, fire, 0.28)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const h = y / 34 + (bayer(x, y) - 0.5) * 0.25;
      px(x, y, y < 34 ? sky[h < 0.45 ? 0 : h < 0.8 ? 1 : 2] : ground[out < 1 ? glow(x, y, 98, 50, 60 * (1 - out) + 1, 16 * (1 - out) + 1, f) : 0]);
    }
  for (let x = 0; x < 70; x++) {
    const h = 3 + Math.round(3 * Math.sin(x / 9) + Math.sin(x / 3.1));
    rect(x, 34 - h, 1, h, mix(ink, green, 0.25));
  }
  // The house: a round thatch seen from above, a daub wall, the low doorway.
  for (let y = 4; y < 26; y++)
    for (let x = 72; x < 146; x++) {
      const d = Math.hypot((x - 109) / 37, (y - 22) / 18);
      if (d < 1) px(x, y, d > 0.92 ? mix(wood, ink, 0.4) : ((x + y * 2) % 5 ? mix(wood, light, 0.28 - d * 0.1) : mix(wood, ink, 0.05)));
    }
  rect(78, 26, 62, 18, mix(wood, light, 0.42));
  rect(78, 26, 62, 1, mix(wood, ink, 0.45));
  rect(102, 30, 14, 14, out < 1 ? mix(fire, ink, 0.25 + out * 0.6) : pal.ink);
  if (out < 1) flame(ctx, 107, 37, f);
  rect(100, 30, 2, 14, mix(wood, ink, 0.35));
  rect(116, 30, 2, 14, mix(wood, ink, 0.35));
  // The giver in the doorway.
  if (ending !== "gone" && ending !== "shamed") person(ctx, 120, 47, 19, mix(ink, wood, 0.45), mix(light, wood, 0.35));
  // The mat, and the gift set on it.
  rect(92, 48, 26, 3, mix(green, wood, 0.45));
  for (let x = 93; x < 117; x += 3) px(x, 49, mix(green, light, 0.2));
  const grain = mix(light, fire, 0.35), basket = mix(wood, light, 0.3);
  const set = ease((t - 300) / 600);
  const basketAt = (x: number) => {
    for (let i = 0; i < 6; i++) rect(x + (i >> 1), 42 + i, 12 - (i >> 1) * 2, 1, i % 2 ? basket : mix(wood, ink, 0.1));
    for (let r = 0; r < 3; r++) rect(x + 2 + r, 41 - r, 8 - r * 2, 1, grain);
  };
  if ((ending === "returned" || ending === "outgave") && set > 0) basketAt(96);
  if (ending === "outgave") {
    if (t > 600) for (const [x, y, w, h] of [[84, 43, 8, 5], [86, 41, 4, 2]] as const) rect(x, y, w, h, mix(fire, ink, 0.25));
    if (t > 800) rect(109, 43, 7, 5, mix(light, wood, 0.55)), rect(110, 42, 5, 1, mix(light, wood, 0.4));
    if (t > 1000) rect(98, 36, 8, 5, mix(green, light, 0.15)), rect(101, 35, 2, 1, mix(wood, ink, 0.3));
  }
  // A knotted cord tied on the door post: the promise, counted out in knots.
  if (ending === "promised") {
    const sway = Math.round(Math.sin(t / 300) * (1 - ease(t / 2000)));
    for (let k = 0; k < 10; k++) px(99 + Math.round((sway * k) / 10), 30 + k, mix(green, light, 0.3));
    for (const k of [3, 6, 9]) rect(98 + Math.round((sway * k) / 10), 30 + k, 3, 1, mix(green, light, 0.15));
  }
  fadeEdges(ctx, pal.ink);
}
