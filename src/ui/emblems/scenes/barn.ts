import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The tithe barn at harvest, and your stooks in rows with every tenth marked by a green bough. */
export default function barn(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const sky = [mix(fill, light, 0.25), mix(fill, gold, 0.35), mix(gold, light, 0.3)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const h = y / 26 + (bayer(x, y) - 0.5) * 0.25;
      px(x, y, y < 26 ? sky[h < 0.45 ? 0 : h < 0.8 ? 1 : 2] : mix(gold, wood, 0.55 + (y - 26) * 0.008 + ((x + (y >> 1)) % 6 === 0 ? 0.08 : 0)));
    }
  for (let x = 0; x < EMBLEM_W; x++) {
    const h = 2 + Math.round(1.5 * Math.sin(x / 9) + Math.sin(x / 3.7));
    rect(x, 26 - h, 1, h, mix(fill, wood, 0.25));
  }
  // The barn: thatch from above, a plank gable wall, the great doors.
  const open = ending === "paid" || ending === "short" || ending === "seized" ? ease((t - 300) / 700) : 0;
  rect(6, 6, 50, 14, mix(wood, light, 0.3));
  for (let x = 6; x < 56; x += 3) rect(x, 6 + (x % 2), 1, 13, mix(wood, ink, 0.1));
  rect(6, 19, 50, 1, mix(wood, ink, 0.6));
  rect(8, 20, 46, 30, mix(wood, light, 0.12));
  for (let x = 11; x < 54; x += 4) rect(x, 20, 1, 30, mix(wood, ink, 0.3));
  rect(20, 28, 22, 22, mix(ink, wood, 0.2));
  const leaf = Math.round(11 * (1 - open));
  if (open) for (let y = 30; y < 50; y += 3) rect(22, y, 18, 2, mix(gold, light, 0.15 + (y % 2) * 0.1));
  rect(20, 28, leaf, 22, mix(wood, light, 0.25));
  rect(42 - leaf, 28, leaf, 22, mix(wood, light, 0.2));
  if (leaf > 2) rect(30, 38, 2, 2, mix(ink, wood, 0.4)), rect(31 - 1, 28, 1, 22, mix(wood, ink, 0.4));
  // The stooks, ten to a row; the tenth carries the bough.
  const stook = (x: number, y: number, tenth: boolean) => {
    rect(x + 1, y - 7, 3, 1, mix(gold, light, 0.35));
    rect(x, y - 6, 5, 4, mix(gold, light, 0.2));
    rect(x - 1, y - 2, 7, 2, mix(gold, wood, 0.15));
    px(x + 4, y - 5, mix(gold, wood, 0.4));
    if (tenth) {
      rect(x + 2, y - 11, 1, 4, mix(fill, wood, 0.3));
      rect(x + 1, y - 12, 3, 2, mix(fill, light, 0.35));
    }
  };
  const gone = ending === "short" || ending === "seized" ? open : 0;
  for (const [row, y] of [[0, 40], [1, 50], [2, 61]])
    for (let i = 0; i < 10; i++) {
      const tenth = i === 9 - row * 3;
      if (gone && i % 3 === row % 3 && i / 10 < gone) continue;
      stook(66 + i * 9 + row * 2, y, tenth);
    }
  // A tally of the count, a notch at a time, when it is counted again.
  if (ending === "recounted" || ending === "counted")
    for (let i = 0; i < 10; i++) if (t > 300 + i * 120) rect(67 + i * 9, 29, 1, 3, mix(light, gold, 0.1));
  // The collector in the field with a tally stick, or walking off.
  if (ending !== "gone") {
    const leave = ending === "excused" || ending === "recounted" || ending === "counted" ? ease((t - 600) / 1200) : 0;
    const fx = 120 + Math.round(30 * leave) + Math.round(6 * (1 - ease(t / 500)));
    person(ctx, fx, 46, 18, mix(ink, wood, 0.5), mix(light, wood, 0.35));
    if (!leave) rect(fx - 2, 34, 3, 1, mix(wood, light, 0.5));
  }
  if (ending === "paid") for (const x of [44, 49]) rect(x, 46, 4, 4, mix(light, wood, 0.45)), rect(x + 1, 45, 2, 1, mix(wood, ink, 0.3));
  fadeEdges(ctx, pal.ink);
}
