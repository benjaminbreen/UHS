import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, hash, mix, pen as kit, person, rgb, type Pal } from "../kit";

/** Two pens at dusk, yours and the neighbour's, and the one marked animal between them. */
export default function pen(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = kit(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), mark = rgb(pal.accent);
  const night = ending === "taken" || ending === "caught" ? 0.55 : 0;
  const sky = [mix(ink, fill, 0.6 - night * 0.5), mix(fill, mark, 0.25 - night * 0.2), mix(mark, light, 0.25 - night * 0.3)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const h = y / 28 + (bayer(x, y) - 0.5) * 0.25;
      px(x, y, y < 28 ? sky[h < 0.5 ? 0 : h < 0.85 ? 1 : 2] : mix(fill, wood, 0.25 + (y - 28) * 0.01 - night * 0.3));
    }
  if (night) for (let i = 0; i < 12; i++) px(Math.floor(hash(i) * EMBLEM_W), Math.floor(hash(i + 9) * 18), mix(light, fill, 0.3));
  for (let x = 0; x < EMBLEM_W; x++) {
    const h = 3 + Math.round(2 * Math.sin(x / 17) + Math.sin(x / 6));
    rect(x, 28 - h, 1, h, mix(ink, fill, 0.5 - night * 0.3));
  }
  // A wattle pen: posts, woven rails, a gap for the gate, barred when it is kept.
  const fence = (x0: number, x1: number, gate: number, barred: boolean) => {
    const hurdle = mix(wood, light, 0.42 - night * 0.3), post = mix(wood, light, 0.1 - night * 0.2);
    for (const y of [36, 48]) {
      for (let x = x0; x <= x1; x++) if (Math.abs(x - gate) > 4 || barred) px(x, y + ((x >> 1) % 2), hurdle), px(x, y + 2 - ((x >> 1) % 2), hurdle);
    }
    for (let x = x0; x <= x1; x += 8) if (Math.abs(x - gate) > 4) rect(x, 33, 2, 19, post);
    for (const x of [gate - 5, gate + 4]) rect(x, 31, 2, 21, post);
    if (barred) rect(gate - 5, 41, 11, 2, mix(wood, light, 0.4));
  };
  const beast = (x: number, foot: number, c: string, marked = false, step = 0) => {
    rect(x, foot - 8, 11, 5, c);
    rect(x + 10, foot - 10, 3, 4, c);
    px(x - 1, foot - 7, c);
    for (const [lx, k] of [[x + 1, 0], [x + 3, 1], [x + 6, 0], [x + 8, 1]]) rect(lx, foot - 3 + (k === step % 2 ? 0 : 0), 1, 3 - (k === step % 2 ? 1 : 0), c);
    if (marked) rect(x + 11, foot - 10, 1, 2, mix(mark, light, 0.25));
  };
  const theirs = ending === "lost";
  fence(6, 50, 46, false);
  fence(108, 154, 112, theirs);
  const dark = mix(ink, wood, 0.35 - night * 0.2);
  for (const [x, y] of [[124, 46], [138, 50], [130, 56]]) if (ending !== "gone") beast(x, y, dark);
  // Where the marked animal stands: their pen, the open ground, or home in yours.
  const loose = ending === "proof" || ending === "gone";
  const home = ending === "followed" || ending === "recovered" || ending === "taken" || ending === "bought";
  const walk = ending === "followed" ? ease((t - 400) / 1600) : 1;
  const ax = home ? Math.round(74 - (74 - 22) * walk) : loose ? 74 : 116;
  const steps = ending === "followed" && walk < 1 ? Math.floor(t / 180) : 0;
  beast(ax, home ? 50 : loose ? 54 : 52, mix(light, wood, 0.35 - night * 0.3), true, steps);
  if (ending === "recovered") person(ctx, 70, 56, 18, mix(light, wood, 0.5), mix(light, wood, 0.3)), rect(68, 39, 1, 17, mix(wood, light, 0.25));
  if (ending === "caught") {
    const f = Math.floor(t / 120) % 3;
    for (let y = 30; y < 60; y++)
      for (let x = 92; x < 128; x++) if (Math.hypot((x - 108) / 16, (y - 44) / 14) < 1 && bayer(x, y) < 0.35 - Math.hypot((x - 108) / 16, (y - 44) / 14) * 0.3) px(x, y, mix(mark, light, 0.3));
    person(ctx, 102, 56, 19, mix(ink, wood, 0.3), mix(light, wood, 0.3));
    rect(108, 40, 3, 4, mix(mark, light, 0.45 + 0.1 * f));
  }
  if (ending === "bought")
    [0, 1, 2].forEach((i) => {
      const c = ease((t - 400 - i * 160) / 600);
      rect(Math.round(60 + 44 * c), 58 - Math.round(6 * Math.sin(Math.PI * c)), 2, 1, mix(mark, light, 0.5));
    });
  fadeEdges(ctx, pal.ink);
}
