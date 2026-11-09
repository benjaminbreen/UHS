import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** The rack: split fish drying under the moon, a few gone, and a trail toward a door. */
export default function rack(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), warm = rgb(pal.accent);
  const full = ending === "found" || ending === "given", dawn = full ? ease(t / 2000) : 0;
  const gaps = full ? [] : ending === "slept" ? [2, 5, 7, 9, 12, 14] : [5, 9, 12];
  const GY = 50;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < GY) {
        const m = Math.hypot(x - 30, y - 12), h = y / GY + (b - 0.5) * 0.3 - (m < 26 ? (26 - m) / 70 : 0);
        px(x, y, m < 5 && !full ? mix(light, fill, 0.1) : h < 0.4 ? mix(ink, fill, 0.45 + dawn * 0.3) : h < 0.75 ? mix(fill, warm, 0.05 + dawn * 0.3) : mix(fill, warm, 0.15 + dawn * 0.4));
      } else px(x, y, mix(ink, wood, 0.3 + (y - GY) * 0.015 + (b > 0.75 ? 0.05 : 0)));
    }
  if (!full) for (let i = 0; i < 10; i++) {
    const sx = Math.floor(hash(i + 3) * EMBLEM_W), sy = Math.floor(hash(i + 40) * 20);
    if (Math.hypot(sx - 30, sy - 12) > 12) px(sx, sy, mix(light, fill, 0.4));
  }
  // The neighbour's house to the right, its door the end of the trail.
  rect(126, 30, 34, 20, mix(ink, wood, 0.35));
  for (let i = 0; i < 8; i++) rect(124 + i, 30 - i, 36 - i, 1, mix(ink, wood, 0.55));
  rect(136, 38, 7, 12, ending === "confront" || ending === "wrong" ? mix(warm, light, 0.25) : pal.ink);
  // Posts, two bars, and the fish hung in rows, silver on the moon side.
  const pole = mix(wood, light, 0.15), shade = mix(wood, ink, 0.35);
  for (const x of [44, 110]) {
    rect(x, 12, 3, GY - 12, pole);
    rect(x + 2, 12, 1, GY - 12, shade);
  }
  for (const y of [14, 30]) {
    rect(40, y, 74, 2, pole);
    rect(40, y + 1, 74, 1, shade);
  }
  let n = 0;
  for (const y of [16, 32])
    for (let x = 50; x < 108; x += 8) {
      if (!gaps.includes(n++)) {
        // Hung by the tail, head down.
        rect(x, y, 1, 2, mix(light, fill, 0.45));
        rect(x + 3, y, 1, 2, mix(light, fill, 0.45));
        rect(x + 1, y + 1, 2, 2, mix(light, fill, 0.4));
        rect(x, y + 3, 4, 6, mix(light, fill, 0.35));
        rect(x + 3, y + 3, 1, 6, mix(warm, fill, 0.35));
        rect(x, y + 3, 1, 6, mix(light, fill, 0.6));
        rect(x + 1, y + 9, 2, 2, mix(light, fill, 0.5));
      } else rect(x + 1, y, 2, 1, mix(wood, light, 0.3));
    }
  const you = mix(warm, ink, 0.25), them = mix(ink, wood, 0.25), head = mix(ink, wood, 0.55);
  if (!ending || ending === "clue" || ending === "unsolved" || ending === "gone")
    for (let i = 0; i < 6; i++) rect(98 + i * 7, GY + 4 - i, 2, 1, mix(light, fill, 0.45));
  if (ending === "night") {
    const moonlit = mix(fill, light, 0.3);
    rect(78, 34, 6, 8, moonlit);
    rect(79, 30, 4, 4, mix(fill, light, 0.45));
    rect(83, 26, 1, 8, moonlit);
    rect(78, 42, 2, 8, moonlit);
    rect(82, 42, 2, 8, moonlit);
    person(ctx, 24, GY + 6, 18, you, head);
  }
  if (ending === "confront" || ending === "given") person(ctx, 126, GY + 8, 18, them, head);
  if (ending === "confront") person(ctx, 114, GY + 9, 18, you, head);
  if (ending === "wrong") {
    person(ctx, 30, GY + 6, 18, mix(light, wood, 0.35), head);
    rect(27, GY - 14, 3, 1, mix(light, wood, 0.35));
    rect(36, GY - 15, 3, 1, mix(light, wood, 0.35));
  }
  if (ending === "slept") {
    rect(48, GY - 6, 6, 8, you);
    rect(52, GY - 9, 4, 4, head);
    rect(54, GY + 1, 7, 2, you);
  }
  if (ending === "given") {
    rect(132, GY - 4, 6, 4, mix(wood, light, 0.35));
    rect(133, GY - 5, 4, 1, mix(warm, light, 0.3));
  }
  fadeEdges(ctx, pal.ink);
}
