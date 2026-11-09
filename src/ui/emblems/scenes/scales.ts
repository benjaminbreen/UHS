import { EMBLEM_H, EMBLEM_W, ease, fadeEdges, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** The stall under its awning, the balance on the counter weighed against the standard. */
export default function scales(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), brass = rgb(pal.accent);
  const wall = [mix(ink, wood, 0.25), mix(fill, wood, 0.45), mix(fill, light, 0.3)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, y < 40 ? wall[glow(x, y, 80, 26, 80, 34)] : mix(fill, ink, 0.35));
  // The awning, striped, its scalloped edge.
  for (let x = 0; x < EMBLEM_W; x++) {
    const s = (x >> 3) % 2;
    for (let y = 0; y < 9 + ((x & 7) > 1 && (x & 7) < 6 ? 1 : 0); y++) px(x, y, s ? mix(brass, ink, 0.25) : mix(light, wood, 0.25));
  }
  rect(0, 9, EMBLEM_W, 1, mix(ink, wood, 0.4));
  // The counter.
  rect(18, 38, 124, 3, mix(wood, light, 0.35));
  rect(18, 41, 124, 11, mix(wood, ink, 0.2));
  for (let x = 24; x < 140; x += 12) rect(x, 41, 1, 11, mix(wood, ink, 0.45));
  rect(18, 52, 124, 1, mix(ink, wood, 0.2));
  // Stock: jars along the counter, carried off when the fine is taken in goods.
  const taken = ending === "seized" || ending === "shamed" ? ease((t - 300) / 700) : 0;
  [24, 34, 44].forEach((x, i) => {
    if (taken > i / 3) return;
    for (const [dy, w] of [[0, 4], [1, 6], [2, 8], [3, 8], [4, 8], [5, 8], [6, 7], [7, 6]] as const)
      rect(x + ((8 - w) >> 1), 30 + dy, w, 1, dy < 2 ? mix(wood, light, 0.25) : mix(brass, wood, 0.35 + dy * 0.04));
    px(x + 2, 33, mix(brass, light, 0.4));
  });
  // The balance: goods against the standard weight; short goods ride high.
  const level = ending === "tried" || ending === "cleared";
  const tip = level ? 0.32 * (1 - ease((t - 300) / 900)) : ending === "shamed" ? 0.45 : 0.32 * ease((t - 200) / 900);
  const cx = 80, cy = 17, arm = 20;
  rect(cx - 1, cy, 3, 21, mix(ink, brass, 0.55));
  rect(cx - 5, 37, 11, 2, mix(ink, brass, 0.4));
  for (let k = -arm; k <= arm; k++) px(cx + k, cy + Math.round(k * Math.sin(tip)), mix(brass, light, 0.3));
  px(cx, cy - 1, mix(brass, light, 0.6));
  const pan = (side: number) => {
    const ex = cx + side * arm, ey = cy + Math.round(side * arm * Math.sin(tip));
    for (let k = 1; k < 8; k++) px(ex - 3 + Math.round(k / 3), ey + k, mix(ink, brass, 0.5)), px(ex + 3 - Math.round(k / 3), ey + k, mix(ink, brass, 0.5));
    rect(ex - 5, ey + 8, 11, 1, mix(brass, light, 0.2));
    rect(ex - 4, ey + 9, 9, 1, mix(brass, ink, 0.3));
    return { x: ex, y: ey + 8 };
  };
  const goods = pan(-1), weight = pan(1);
  if (ending !== "shamed") for (let r = 0; r < 3; r++) rect(goods.x - 3 + r, goods.y - 1 - r, 7 - r * 2, 1, mix(brass, light, 0.15 + r * 0.12));
  else for (let i = 0; i < 6; i++) px(58 + i * 3 + (i % 2), 37 + (i % 2), mix(brass, light, 0.2));
  rect(weight.x - 2, weight.y - 4, 5, 4, mix(ink, fill, 0.5));
  rect(weight.x - 1, weight.y - 5, 3, 1, mix(ink, fill, 0.5));
  if (level && t > 1200 && Math.floor(t / 140) % 6 === 0) px(cx + 1, cy - 2, pal.light);
  // The inspector at the end of the counter, with the staff of office.
  if (ending !== "gone" && ending !== "tried" && ending !== "cleared") {
    const fx = 128 + Math.round(10 * (1 - ease(t / 600)));
    person(ctx, fx, 52, 22, mix(light, fill, 0.35), mix(light, wood, 0.35));
    rect(fx + 9, 24, 1, 28, mix(wood, light, 0.3));
    rect(fx + 8, 23, 3, 2, mix(brass, light, 0.3));
    if (taken) rect(fx - 2, 40, 5, 6, mix(wood, light, 0.2));
  }
  if (ending === "paid")
    [0, 1, 2].forEach((i) => {
      const c = ease((t - 400 - i * 160) / 600), x = Math.round(98 + 22 * c), y = 37 - Math.round(4 * Math.sin(Math.PI * c));
      rect(x, y, 2, 1, mix(brass, light, 0.4));
    });
  fadeEdges(ctx, pal.ink);
}
