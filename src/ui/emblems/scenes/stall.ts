import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** A slow day: your shop front with its awning, and an empty street. */
export default function stall(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const late = ending === "empty" || ending === "tidied", GY = 48;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      // Sky, the far side of the street, then the road.
      const sky = y / 14 + (b - 0.5) * 0.3 > 0.6 ? mix(fill, late ? sun : light, late ? 0.35 : 0.45) : mix(fill, light, late ? 0.1 : 0.3);
      const far = y < 14 ? sky : y < GY - 2 ? (x % 26 === 0 ? mix(ink, fill, 0.5) : mix(fill, wood, 0.25)) : y < GY ? mix(wood, ink, 0.4) : mix(wood, light, y % 4 === 0 ? 0.2 : 0.12);
      px(x, y, far);
    }
  // The houses across the street: roofs, doors and windows.
  for (let i = 0; i < 6; i++) {
    const x = 6 + i * 26;
    rect(x - 4, 12 + (i % 2), 28, 3, mix(wood, ink, 0.35));
    rect(x + 4, 22, 5, 6, late && i % 3 === 1 ? mix(sun, light, 0.2) : mix(ink, fill, 0.4));
    rect(x + 14, 30, 6, GY - 32, mix(ink, wood, 0.4));
  }
  // Your shop: a deep front with a counter, an awning, and the wares.
  const wall = mix(wood, light, 0.12), dark = mix(ink, fill, 0.3);
  rect(0, 6, 76, GY + 4, wall);
  rect(6, 24, 58, GY - 24 + 2, dark);
  const shut = ending === "company" || ending === "empty";
  for (let x = 0; x < 64; x += 4) {
    rect(2 + x, 16, 4, 6, (x >> 2) % 2 ? mix(sun, wood, 0.2) : mix(light, sun, 0.2));
    rect(2 + x, 22, 4, 2, (x >> 2) % 2 ? mix(sun, ink, 0.3) : mix(light, wood, 0.4));
  }
  rect(4, 40, 62, 3, mix(wood, light, 0.3));
  rect(4, 43, 62, GY - 43 + 4, mix(wood, ink, 0.25));
  const neat = ending === "tidied";
  const wares = [[10, 3, 4], [17, 4, 5], [26, 3, 3], [34, 5, 4], [44, 3, 5], [52, 4, 3]];
  if (!shut) wares.forEach(([x, w, h], i) => rect(neat ? 9 + i * 9 : x, 40 - h, w, h, i % 2 ? mix(sun, wood, 0.3) : mix(light, wood, 0.25)));
  if (shut) for (let x = 6; x < 64; x += 3) rect(x, 24, 2, 18, mix(wood, ink, x % 6 ? 0.15 : 0.3));
  if (late && !shut) { rect(30, 26, 3, 4, pal.accent); px(31, 27, pal.light); }
  const coat = mix(sun, ink, 0.35), skin = mix(wood, light, 0.4), them = mix(fill, light, 0.25);
  const come = ease(t / 1400);
  if (!ending || ending === "nobody" || ending === "tidied") person(ctx, 30, 40, 13, coat, skin);
  if (ending === "nobody") person(ctx, 72, GY + 3, 15, them, skin);
  if (ending === "company") {
    person(ctx, 104 + Math.round(18 * come), GY + 1, 12 - Math.round(2 * come), coat, skin);
    person(ctx, 112 + Math.round(18 * come), GY + 1, 12 - Math.round(2 * come), them, skin);
  }
  if (ending === "cried" || ending === "hoarse") {
    person(ctx, 84, GY + 6, 16, coat, skin);
    rect(90, GY - 6, 5, 3, mix(sun, light, 0.3));
  }
  if (ending === "cried")
    [[104, 3], [112, 0], [120, 4], [98, 10]].forEach(([x, d], i) => {
      if (t > 300 + i * 250) person(ctx, x - Math.round(6 * (1 - ease((t - 300 - i * 250) / 700))) * -1, GY + 4 + d, 14 - (d >> 1), i % 2 ? them : mix(wood, ink, 0.2), skin);
    });
  if (ending === "hoarse") for (let i = 0; i < 3; i++) if ((Math.floor(t / 400) + i) % 3) px(96 + i * 3, GY - 9 - i, mix(light, fill, 0.4));
  fadeEdges(ctx, pal.ink);
}
