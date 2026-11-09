import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The doorstep: morning sun across the wall, and something small left on the step. */
export default function token(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const early = ending === "dawn", cold = ending === "cool", late = ending === "unsolved" || ending === "gone";
  const beam = early ? 0 : (cold ? 0.4 : 1) * ease(t / 1600);
  const wall = [mix(fill, ink, 0.25), mix(fill, light, 0.08), mix(fill, sun, late ? 0.55 : 0.35)];
  const GY = 52;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      // The sunlight falls in a slanting band from the upper right.
      const s = (x - 30 + (GY - y) * (late ? 1.6 : 0.8)) / 90;
      const lit = s > 0.25 && s < 1.1 ? Math.min(1, (s - 0.25) * 3, (1.1 - s) * 3) * beam : 0;
      if (y < GY) px(x, y, early ? mix(ink, fill, 0.6 + (b - 0.5) * 0.1) : wall[lit > b + 0.1 ? 2 : lit > b * 0.3 ? 1 : 0]);
      else px(x, y, mix(wood, lit > b ? sun : ink, lit > b ? 0.2 : 0.3 + (y - GY) * 0.02));
    }
  rect(0, 0, EMBLEM_W, 4, mix(wood, ink, 0.6));
  rect(0, 4, EMBLEM_W, 1, mix(wood, light, 0.2));
  // The door, its frame, a window beside it, and the stone step.
  rect(46, 10, 34, 42, mix(wood, ink, 0.55));
  rect(49, 13, 28, 39, mix(wood, ink, cold ? 0.3 : 0.1));
  for (let x = 55; x < 77; x += 7) rect(x, 13, 1, 39, mix(wood, ink, 0.45));
  rect(71, 32, 2, 2, mix(sun, light, 0.3));
  rect(96, 18, 20, 14, mix(wood, ink, 0.55));
  rect(98, 20, 16, 10, early ? mix(ink, fill, 0.3) : mix(fill, sun, 0.2));
  rect(105, 20, 2, 10, mix(wood, ink, 0.55));
  rect(95, 32, 22, 2, mix(wood, light, 0.25));
  rect(40, GY, 46, 3, mix(fill, light, 0.3));
  rect(40, GY + 3, 46, 1, mix(fill, ink, 0.3));
  const gift = (x: number, y: number, sprig: boolean) => {
    rect(x, y - 5, 9, 5, mix(light, fill, 0.15));
    rect(x, y - 1, 9, 1, mix(light, fill, 0.4));
    rect(x + 4, y - 5, 1, 5, pal.accent);
    rect(x + 3, y - 7, 3, 2, pal.accent);
    if (!sprig) return;
    rect(x + 9, y - 9, 1, 8, mix(wood, ink, 0.2));
    for (const [dx, dy] of [[10, -9], [11, -6], [8, -8], [10, -4]]) px(x + dx, y + dy, mix(sun, light, 0.45));
  };
  const you = mix(sun, ink, 0.3), them = mix(ink, wood, 0.3), head = mix(ink, wood, 0.6);
  if (late) gift(101, 32, true);
  else if (!cold && ending !== "blush") gift(58, GY, true);
  if (ending === "found") gift(68, GY, false);
  if (ending === "seen") {
    rect(134, 5, 26, GY - 5, mix(fill, ink, 0.45));
    rect(134, 5, 1, GY - 5, mix(fill, light, 0.2));
    rect(130, 24, 5, 5, head);
    rect(129, 29, 6, 17, them);
  }
  if (ending === "wrong") person(ctx, 20, GY + 8, 20, mix(light, wood, 0.4), head);
  if (ending === "blush" || ending === "found") {
    person(ctx, 30, GY + 8, 20, you, head);
    person(ctx, ending === "found" ? 116 : 90, GY + 9, 20, them, head);
    if (ending === "blush") gift(36, GY - 4, false);
  }
  if (ending === "dawn") {
    rect(58, GY - 8, 7, 8, them);
    rect(56, GY - 11, 4, 4, head);
    gift(68, GY, false);
  }
  fadeEdges(ctx, pal.ink);
}
