import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, glow, mix, pen, rgb, sealAt, type Pal } from "../kit";

/** The dead one's chest by candlelight, and whatever it holds that settles the claim. */
export default function chest(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), warm = rgb(pal.accent);
  const f = Math.floor(t / 110) % 3;
  const wall = [pal.ink, mix(ink, wood, 0.28), mix(fill, wood, 0.55)];
  const floor = [mix(ink, fill, 0.5), mix(fill, wood, 0.35), mix(fill, wood, 0.6)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, (y < 50 ? wall : floor)[glow(x, y, 70, 32, 80, 40, f)]);
  rect(0, 50, EMBLEM_W, 1, mix(ink, wood, 0.5));
  // The claimant's shadow thrown on the wall, standing over it.
  const shadow = ending === undefined || ["answer", "paid", "talk", "court"].includes(ending) ? ease(t / 900) : 0;
  if (shadow)
    for (let y = 6; y < 50; y++)
      for (let x = 108; x < 132; x++) {
        const head = Math.hypot(x - 121, y - 11) < 5, body = y > 15 && Math.abs(x - 121) < 9 - (y < 20 ? 20 - y : 0);
        if ((head || body) && bayer(x, y) < 0.9 * shadow) px(x, y, pal.ink);
      }
  // The candle on its stand.
  rect(30, 34, 6, 16, mix(wood, ink, 0.35));
  rect(27, 32, 12, 2, mix(wood, light, 0.2));
  rect(31, 26, 4, 6, mix(light, warm, 0.15));
  flame(ctx, 32, 21, f);
  // The chest: plank front, iron bands, a lock; the lid thrown back when searched.
  const lifted = ending === "proved" ? ease((t - 200) / 500) : 0;
  const X = 54, Y = 32, W = 44, H = 18, band = mix(ink, fill, 0.55), plank = mix(wood, light, 0.22);
  rect(X, Y, W, H, plank);
  for (let y = Y + 4; y < Y + H; y += 5) rect(X, y, W, 1, mix(wood, ink, 0.25));
  for (const x of [X + 4, X + W - 7]) rect(x, Y, 3, H, band);
  rect(X, Y + H - 1, W, 1, mix(wood, ink, 0.55));
  if (lifted) {
    const h = Math.round(10 * lifted);
    rect(X + 1, Y - h, W - 2, h, mix(wood, ink, 0.3));
    rect(X, Y - h - 1, W, 2, plank);
    rect(X + 4, Y - h - 1, 3, h + 1, band);
    rect(X + W - 7, Y - h - 1, 3, h + 1, band);
    const up = ease((t - 700) / 600);
    const py = Y - 2 - Math.round(12 * up);
    rect(X + 15, py, 14, 9, mix(light, warm, 0.2));
    for (let k = 0; k < 4; k++) rect(X + 17, py + 2 + k * 2, 9 - (k % 2) * 3, 1, mix(wood, ink, 0.2));
    if (up >= 1 && Math.floor(t / 140) % 6 === 0) px(X + 28, py, pal.light);
  } else {
    rect(X - 1, Y - 3, W + 2, 3, mix(wood, light, 0.32));
    rect(X - 1, Y - 3, W + 2, 1, mix(wood, light, 0.5));
    rect(X + 19, Y + 3, 6, 6, mix(warm, ink, 0.3));
    rect(X + 21, Y + 5, 2, 3, pal.ink);
  }
  // Coins: counted out in shares on the lid, or carried off.
  const coin = mix(warm, light, 0.45);
  if (ending === "shared")
    [0, 1, 2, 3].forEach((i) => {
      const n = Math.round(4 * ease((t - 300 - i * 200) / 400));
      for (let k = 0; k < n; k++) rect(X + 6 + i * 10, Y - 4 - k, 4, 1, k % 2 ? coin : mix(warm, ink, 0.1));
    });
  if (ending === "paid")
    [0, 1, 2].forEach((i) => {
      const c = ease((t - 400 - i * 160) / 600);
      rect(Math.round(X + 20 + 40 * c), Y - 5 - Math.round(6 * Math.sin(Math.PI * c)), 3, 1, coin);
    });
  if (ending === "judged" || ending === "absent") sealAt(ctx, pal, X + 22, Math.round(-10 + (Y + 6) * ease((t - 450) / 380)));
  fadeEdges(ctx, pal.ink);
}
