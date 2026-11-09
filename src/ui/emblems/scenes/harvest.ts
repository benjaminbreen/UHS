import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** Before the rain: a cut crop lying in the field, a storm coming in from the west. */
export default function harvest(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const raining = ending === "in" || ending === "covered" || ending === "soaked", clear = ending === "passed";
  // How far east the storm has come: its front edge.
  const front = clear ? -30 + 20 * (1 - ease(t / 1800)) : raining ? 200 : ending === "clouds" ? 70 + 40 * ease(t / 1800) : 60;
  const HY = 26, dim = raining ? 0.5 : ending === "clouds" ? 0.25 : 0;
  const field = [mix(wood, gold, 0.35 - dim * 0.4), mix(wood, gold, ending === "soaked" ? 0.3 : 0.6 - dim * 0.5)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) {
        // The storm: a dark bank with a lit, billowing edge, and rain hanging under it.
        const edge = front + Math.round(4 * Math.sin(y / 3 + 1) + 2 * Math.sin(y / 1.3));
        const base = 15 + Math.round(2 * Math.sin(x / 7));
        const clearSky = y / HY + (b - 0.5) * 0.3 > 0.6 ? mix(gold, light, 0.4) : mix(fill, light, clear ? 0.6 : 0.45);
        px(x, y, x >= edge ? clearSky : x > edge - 3 && y < base ? mix(fill, light, 0.3)
          : y < base ? mix(ink, fill, 0.55 + (b - 0.5) * 0.2) : b < 0.5 ? mix(ink, fill, 0.75) : mix(fill, light, 0.15));
        continue;
      }
      const k = (y - HY) / (EMBLEM_H - HY);
      // Windrows of cut crop across the field, wider as they come nearer.
      px(x, y, field[(y - HY) % Math.round(3 + k * 6) < 1 + k * 2 ? 1 : 0]);
    }
  rect(0, HY, EMBLEM_W, 1, mix(wood, ink, 0.4));
  for (let x = 0; x < 60; x += 4) rect(x, HY - 2 - (hash(x) > 0.5 ? 1 : 0), 4, 2 + (hash(x) > 0.5 ? 1 : 0), mix(ink, fill, 0.5));
  // The barn, its door open.
  const bx = 118, by = HY + 14;
  rect(bx, by - 16, 26, 16, mix(wood, ink, 0.35));
  for (let i = 0; i < 15; i++) rect(bx - 2 + i, by - 17 - i * 0.6, 30 - i * 2, 1, mix(ink, wood, 0.35));
  rect(bx + 9, by - 10, 8, 10, raining || ending === "in" ? mix(gold, ink, 0.4) : mix(ink, fill, 0.2));
  const coat = mix(ink, wood, 0.35), skin = mix(wood, light, 0.4), hay = mix(gold, light, 0.25);
  if (ending === "covered" || ending === "soaked") {
    // Haycocks, or the flattened rows.
    if (ending === "covered")
      [[24, 46], [44, 50], [66, 44], [86, 52], [52, 58], [100, 56]].forEach(([x, y]) => {
        for (let r = 0; r < 6; r++) rect(x - r, y - 6 + r, r * 2 + 1, 1, r < 2 ? mix(wood, ink, 0.3) : hay);
      });
    else person(ctx, 60, 54, 12, coat, skin);
  } else if (ending === "in") {
    const cx = 70 + Math.round(26 * ease(t / 1600));
    rect(cx, 40, 22, 7, hay);
    rect(cx - 1, 46, 24, 2, mix(wood, ink, 0.3));
    rect(cx + 3, 47, 3, 3, mix(ink, wood, 0.2)); rect(cx + 16, 47, 3, 3, mix(ink, wood, 0.2));
    person(ctx, cx - 6, 50, 11, coat, skin);
  } else {
    person(ctx, 40, 52, 12, coat, skin);
    rect(46, 41, 1, 11, mix(wood, light, 0.2));
    person(ctx, 74, 46, 9, mix(gold, ink, 0.45), skin);
    if (clear) for (let i = 0; i < 3; i++) rect(30 + i * 30, 56 - i * 4, 8, 3, hay);
  }
  if (raining)
    for (let i = 0; i < 110; i++) {
      const x = Math.floor(hash(i) * 180), y = (Math.floor(hash(i + 50) * 64) + Math.floor(t / 40) * 3) % 72 - 6;
      for (let j = 0; j < 3; j++) px(x - ((y + j) >> 1), y + j, mix(light, fill, 0.35 + j * 0.15));
    }
  fadeEdges(ctx, pal.ink);
}
