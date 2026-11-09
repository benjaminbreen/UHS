import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** The comet: a tailed star over dark roofs before dawn, and people in the lane looking up. */
export default function comet(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const faded = ending === "passed" || ending === "ignored";
  const sky = [mix(ink, fill, 0.35), mix(ink, fill, 0.7), mix(ink, fill, 1)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, sky[Math.min(2, Math.floor(y / 16 + (bayer(x, y) - 0.5) * 0.5))]);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(hash(i) * EMBLEM_W), y = Math.floor(hash(i + 70) * 36);
    px(x, y, mix(fill, light, hash(i + 9) > 0.7 ? 0.7 : 0.4));
  }
  // The head low in the sky, its tail fanning up and away; it draws itself in as the card opens.
  const hx = 118, hy = 22, grow = ease(t / 1500), len = 74 * grow, bright = faded ? 0.45 : 1;
  for (let y = 0; y < 40; y++)
    for (let x = 30; x < 124; x++) {
      const u = (hx - x) * 0.96 + (hy - y) * 0.28, v = Math.abs((hx - x) * 0.28 - (hy - y) * 0.96);
      if (u < -1 || u > len) continue;
      const k = (1 - u / 82) * (1 - v / (1.5 + u * 0.22)) * bright;
      if (k > bayer(x, y) * 0.9) px(x, y, k > 0.65 ? mix(gold, light, 0.6) : k > 0.35 ? mix(fill, gold, 0.6) : mix(fill, gold, 0.3));
    }
  if (faded) px(hx, hy, mix(gold, light, 0.2));
  else {
    rect(hx - 1, hy - 1, 3, 3, mix(gold, light, 0.7));
    px(hx, hy, pal.light);
    for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) px(hx + dx, hy + dy, mix(gold, fill, 0.3));
  }
  // Roofs, a church or shrine with a lit door, and the lane.
  const roof = mix(ink, wood, 0.35), wall = mix(ink, wood, 0.55);
  for (const [x, w, h] of [[0, 22, 12], [44, 26, 10], [72, 20, 13], [96, 30, 11], [130, 30, 14]]) {
    rect(x, 56 - h, w, h, wall);
    for (let i = 0; i < w; i++) {
      const r = Math.round(Math.min(i, w - 1 - i) * 0.5) + 1;
      rect(x + i, 56 - h - r, 1, r, roof);
      if (!faded && i <= w / 2) px(x + i, 56 - h - r, mix(wood, gold, 0.2));
    }
  }
  rect(22, 30, 20, 26, wall);
  rect(30, 22, 4, 8, roof);
  for (let i = 0; i < 10; i++) rect(20 + i, 30 - i, 24 - i * 2, 1, roof);
  rect(0, 56, EMBLEM_W, 8, mix(ink, wood, 0.25));
  const lit = ending === "offered";
  rect(29, 46, 6, 10, lit ? mix(gold, light, 0.2) : mix(ink, fill, 0.3));
  if (lit) for (let y = 56; y < 62; y++) for (let x = 24 - (y - 56); x < 40 + (y - 56); x++) if (bayer(x, y) < 0.45) px(x, y, mix(gold, wood, 0.5));
  if (ending === "ignored") rect(104, 48, 4, 3, mix(gold, light, 0.3));
  const body = mix(fill, light, 0.22), head = mix(light, wood, 0.55), you = mix(wood, gold, 0.35);
  const crowd = ending === "shamed" ? [54, 132, 140] : ending === "offered" ? [24, 37, 44] : [62, 70, 84, 92];
  for (const x of crowd) person(ctx, x, 62, 11, body, head);
  const yx = ending === "offered" ? 50 : ending === "ignored" ? 112 : 100;
  person(ctx, yx, 62, 11, you, head);
  if (ending === "sold" || ending === "charms" || ending === "shamed") {
    rect(yx - 3, 54, 10, 2, mix(wood, light, 0.3));
    for (let i = 0; i < 3; i++) px(yx - 2 + i * 3, 53, mix(gold, light, 0.4));
  }
  fadeEdges(ctx, pal.ink);
}
