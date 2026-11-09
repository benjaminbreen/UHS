import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** A hard birth: the fold at night, a lantern on a post, a ewe down in the straw. */
export default function fold(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), lamp = rgb(pal.accent);
  const alive = ending === "helped" || ending === "turned" || ending === "pulled" || ending === "born";
  const dawn = alive || ending === "lost", GY = 46, LX = 98, f = Math.floor(t / 170) % 3;
  const rise = dawn ? ease(t / 2000) : 0;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), g = glow(x, y, LX - 24, GY + 4, dawn ? 30 : 40, dawn ? 18 : 24, f);
      const h = y / 30 + (b - 0.5) * 0.3 + rise * 0.3;
      const sky = dawn && h > 0.95 ? mix(lamp, light, 0.3) : dawn && h > 0.7 ? mix(fill, lamp, 0.45) : h > 0.4 ? mix(ink, fill, 0.8) : mix(ink, fill, 0.4);
      const ground = y % 4 === 1 && (x * 3 + y) % 11 < 4 ? mix(wood, lamp, 0.3) : mix(wood, ink, 0.3);
      px(x, y, g === 2 ? (y < GY ? mix(fill, lamp, 0.4) : mix(wood, lamp, 0.4)) : g === 1 ? (y < GY ? mix(fill, lamp, 0.18) : mix(wood, lamp, 0.15)) : y < GY ? sky : ground);
    }
  // The fold: hurdles of woven wattle and their stakes.
  const hurdle = mix(wood, ink, 0.2), stake = mix(ink, wood, 0.35);
  for (let x = 0; x < EMBLEM_W; x += 22) {
    rect(x + 1, 30, 20, GY - 30, hurdle);
    for (let r = 32; r < GY; r += 3) rect(x + 1, r, 20, 1, mix(wood, ink, 0.35));
    rect(x + 1, 30, 20, 1, mix(wood, light, 0.15));
    rect(x, 27, 2, GY - 27, stake);
  }
  rect(LX, 18, 2, GY - 18, stake);
  rect(LX - 4, 18, 6, 1, stake);
  rect(LX - 5, 19, 3, 4, pal.accent);
  px(LX - 4, 20, pal.light);
  // The mother, down on her side in the straw.
  const wool = mix(light, wood, 0.25), shade = mix(light, wood, 0.55), face = mix(ink, wood, 0.4);
  const mx = 62, my = GY + 8;
  for (let y = -5; y <= 4; y++) {
    const w = Math.round(14 * Math.sqrt(1 - (y / 5.5) ** 2));
    rect(mx - w, my + y, w * 2, 1, y > 1 ? shade : wool);
  }
  rect(mx + 12, my - 4, 6, 4, face);
  rect(mx + 16, my - 2, 3, 2, face);
  rect(mx - 12, my + 5, 2, 3, face); rect(mx - 6, my + 5, 2, 3, face);
  if (ending !== "lost" && !alive && Math.floor(t / 700) % 2) px(mx + 18, my - 5, mix(light, fill, 0.4));
  // The young one: on its feet beside her, or still in the straw.
  const young = (x: number, y: number, up: boolean) => {
    if (up) {
      rect(x, y - 8, 10, 5, wool);
      rect(x + 9, y - 11, 4, 4, face);
      [1, 3, 7, 9].forEach((dx) => rect(x + dx, y - 3, 1, 4, face));
    } else rect(x, y - 3, 10, 3, shade);
  };
  if (alive) young(mx - 30 + Math.round(6 * ease(t / 1500)), GY + 12, t > 600);
  if (ending === "lost") young(mx - 28, GY + 13, false);
  const coat = mix(lamp, ink, 0.4), skin = mix(wood, light, 0.45);
  if (!ending || ending === "trouble") person(ctx, mx - 20, GY + 9, 10, coat, skin);
  if (ending === "stuck") {
    person(ctx, mx - 27, GY + 9, 11, coat, skin);
    for (let i = 0; i < 7; i++) px(mx - 20 + i, GY + 5 + (i >> 2), mix(light, wood, 0.2));
  }
  if (ending === "helped") person(ctx, mx + 26, GY + 10, 13, mix(fill, light, 0.3), skin);
  if (alive || ending === "lost") person(ctx, mx - 44, GY + 10, 14, coat, skin);
  fadeEdges(ctx, pal.ink);
}
