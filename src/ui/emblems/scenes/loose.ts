import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The lane: a stall, upset baskets, and an animal very pleased with itself. */
export default function loose(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const tidy = ending === "helped" || ending === "paid";
  const GY = 40;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < 8) px(x, y, mix(fill, light, 0.5 + (b > 0.6 ? 0.08 : 0)));
      else if (y < GY) px(x, y, (x % 48) < 2 ? mix(wood, ink, 0.5) : mix(fill, light, 0.2 + ((x % 48) > 36 ? -0.08 : 0)));
      else px(x, y, mix(wood, light, 0.3 - (y - GY) * 0.006 + (b > 0.8 ? 0.04 : 0)));
    }
  for (let x = 0; x < EMBLEM_W; x += 48) {
    rect(x + 8, 20, 9, GY - 20, mix(wood, ink, 0.45));
    rect(x + 26, 16, 8, 6, mix(wood, ink, 0.35));
  }
  // The stall's striped awning and its counter.
  for (let x = 92; x < 140; x++) for (let r = 0; r < 6; r++) px(x, 12 + r, ((x - 92) >> 2) % 2 ? pal.accent : mix(light, sun, 0.2));
  rect(94, 30, 44, 3, mix(wood, ink, 0.2));
  rect(96, 33, 2, 7, mix(wood, ink, 0.4));
  rect(134, 33, 2, 7, mix(wood, ink, 0.4));
  const basket = (x: number, tipped: boolean) => {
    const c = mix(wood, light, 0.15), band = mix(wood, ink, 0.3);
    if (tipped) {
      rect(x, GY + 10, 8, 7, c);
      rect(x + 8, GY + 11, 2, 5, band);
      for (const [dx, dy] of [[12, 15], [16, 16], [14, 13], [21, 15]]) rect(x + dx, GY + dy, 2, 2, mix(sun, light, 0.3));
    } else {
      rect(x, GY + 8, 9, 8, c);
      rect(x, GY + 10, 9, 1, band);
      rect(x + 1, GY + 7, 7, 1, mix(sun, light, 0.3));
    }
  };
  basket(22, !tidy);
  basket(38, false);
  basket(108, !tidy && ending !== "told");
  const beast = (x: number, foot: number, run: boolean, dir = 1) => {
    const c = mix(light, wood, 0.35), dark = mix(wood, ink, 0.3), stride = run ? Math.floor(t / 120) % 2 : 0;
    rect(x, foot - 10, 16, 7, c);
    rect(x, foot - 4, 16, 1, dark);
    rect(dir > 0 ? x + 15 : x - 4, foot - 12, 5, 5, c);
    px(dir > 0 ? x + 18 : x - 3, foot - 11, pal.ink);
    for (const lx of [1, 4, 11, 14]) rect(x + lx + (stride && lx % 2 ? 1 : 0), foot - 3, 1, 3, dark);
    rect(dir > 0 ? x - 1 : x + 16, foot - 10, 1, 2, dark);
  };
  const you = mix(sun, ink, 0.35), head = mix(ink, wood, 0.6), folk = mix(fill, ink, 0.2);
  const run = ease(t / 1400);
  if (!ending || ending === "loose") beast(66, GY + 14, false, -1);
  if (ending === "held") {
    beast(64, GY + 14, false);
    person(ctx, 70, GY + 16, 20, you, head);
    rect(66, GY + 2, 14, 2, you);
    person(ctx, Math.round(132 - 14 * run), GY + 14, 13, folk, head);
  }
  if (ending === "chase") {
    rect(40, GY + 15, 26, 4, mix(wood, ink, 0.4));
    rect(44, GY + 13, 18, 3, you);
    rect(62, GY + 12, 4, 4, head);
    beast(Math.round(96 + 30 * run), GY + 12, true);
  }
  if (ending === "helped" || ending === "paid") {
    beast(70, GY + 14, false, 1);
    person(ctx, 92, GY + 16, ending === "helped" ? 13 : 20, folk, head);
    rect(86, GY + 6, 7, 1, mix(wood, ink, 0.3));
  }
  if (ending === "told") {
    beast(70, GY + 14, false, -1);
    person(ctx, 88, GY + 16, 20, folk, head);
    rect(84, GY + 2, 6, 2, folk);
  }
  fadeEdges(ctx, pal.ink);
}
