import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The shadow: you on the path with your tools, and a child three steps behind doing the same. */
export default function shadow(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const dusk = ending === "dusk" || ending === "tired" ? 0.6 : 0, HY = 30;
  const sky = [mix(fill, light, 0.45 - dusk * 0.4), mix(sun, light, 0.45 - dusk * 0.3), mix(sun, fill, 0.1 + dusk * 0.3)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), hill = HY - 4 + Math.round(3 * Math.sin(x / 19) + 2 * Math.sin(x / 7));
      if (y < hill) px(x, y, sky[Math.min(2, Math.floor(y / 11 + (b - 0.5) * 0.6))] ?? sky[2]);
      else if (y < HY) px(x, y, mix(fill, ink, 0.2 + dusk * 0.3));
      else {
        const path = Math.abs(y - 46 - (x - 80) * 0.04) < 5;
        px(x, y, path ? mix(wood, light, 0.35 - dusk * 0.2 + (b > 0.85 ? 0.05 : 0)) : mix(fill, sun, 0.12 - dusk * 0.1 + (b > 0.8 ? 0.04 : 0)));
      }
    }
  // The child's home along the path, its door lit at dusk.
  rect(122, 18, 30, 24, mix(wood, ink, 0.3 + dusk * 0.3));
  for (let i = 0; i < 8; i++) rect(120 + i, 18 - i, 34 - i * 2, 1, mix(wood, ink, 0.55));
  rect(132, 28, 8, 14, dusk ? mix(sun, light, 0.3) : mix(ink, wood, 0.3));
  for (let x = 4; x < 116; x += 10) rect(x, 34, 1, 6, mix(wood, ink, 0.35));
  rect(4, 35, 112, 1, mix(wood, ink, 0.35));
  const you = mix(sun, ink, 0.35), kid = mix(light, sun, 0.25), head = mix(ink, wood, 0.6), tool = mix(wood, light, 0.2);
  const walker = (x: number, foot: number, h: number, c: string, step: number) => {
    person(ctx, x, foot, h, c, head);
    const w = Math.round(h / 3);
    rect(x + w, foot - h + 3, 1, Math.round(h * 0.6), tool);
    rect(x + w - 1, foot - h + 2, 3, 1, tool);
    if (step) rect(x + (step > 0 ? w : -1), foot - Math.round(h / 5), 1, Math.round(h / 5), c);
  };
  const stride = Math.floor(t / 260) % 2 ? 1 : -1, come = ease(t / 1500);
  if (!ending || ending === "copy") {
    walker(Math.round(74 + 6 * come), 50, 22, you, stride);
    walker(Math.round(48 + 6 * come), 51, 13, kid, stride);
  } else if (ending === "spoiled") {
    walker(78, 50, 22, you, 0);
    rect(54, 47, 8, 4, kid);
    rect(56, 43, 4, 4, head);
    for (const [x, y] of [[62, 50], [66, 51], [64, 48]]) rect(x, y, 2, 2, tool);
  } else if (ending === "taught") {
    rect(56, 44, 34, 3, mix(wood, light, 0.1));
    rect(58, 47, 2, 5, mix(wood, ink, 0.3));
    rect(86, 47, 2, 5, mix(wood, ink, 0.3));
    walker(62, 52, 22, you, 0);
    person(ctx, 78, 52, 13, kid, head);
    rect(80, 33, 1, 6, tool);
  } else if (ending === "errand") {
    walker(70, 50, 22, you, 0);
    person(ctx, Math.round(112 - 20 * come), 36, 6, kid, head);
  } else {
    walker(ending === "sent" ? 118 : 60, 50, 22, you, 0);
    person(ctx, ending === "sent" ? 134 : Math.round(110 + 22 * come), ending === "sent" ? 42 : 46, 12, kid, head);
    if (ending === "sent") rect(138, 29, 1, 3, kid);
  }
  fadeEdges(ctx, pal.ink);
}
