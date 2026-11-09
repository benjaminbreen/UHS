import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The glut: a grove heavy with nuts, the ground covered, and whatever comes for them. */
export default function grove(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), leaf = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), nut = rgb(pal.accent);
  const late = ending === "beasts" || ending === "full" || ending === "chased" || ending === "left", GY = 46;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), h = y / GY + (b - 0.5) * 0.3;
      px(x, y, y < GY ? (h > 0.7 ? mix(nut, light, late ? 0.05 : 0.45) : h > 0.4 ? mix(leaf, nut, late ? 0.45 : 0.25) : mix(ink, leaf, 0.7))
        : (y - GY) % 6 === 3 && (x * 7 + y) % 17 < 3 ? mix(wood, light, 0.2) : mix(wood, ink, 0.25));
    }
  // Three trees: a trunk, a few big clumps of crown, and nuts hanging in them.
  const crown = [mix(ink, leaf, 0.75), mix(leaf, light, 0.12)];
  [[26, 30, 15], [80, 26, 18], [134, 31, 14]].forEach(([cx, cy, r], i) => {
    rect(cx - 2, cy, 4, GY - cy + 1, mix(wood, ink, 0.45));
    for (let y = -r; y <= r * 0.6; y++)
      for (let x = -r * 1.3; x <= r * 1.3; x++) {
        const d = Math.hypot(x / 1.3, y) + Math.sin(Math.atan2(y, x) * 5 + i) * 1.6;
        if (d < r) px(cx + Math.round(x), cy + y, crown[Math.hypot(x / 1.3 + r * 0.25, y + r * 0.35) < r * 0.5 ? 1 : 0]);
      }
    for (let k = 0; k < 7; k++) rect(cx - r + 4 + ((k * 11 + i * 5) % (r * 2 - 6)), cy - 2 + ((k * 7) % 9), 2, 2, mix(nut, light, 0.15));
  });
  // Nuts on the ground, and the heap you have made.
  const fallen = ending === "carried" || ending === "cached" || ending === "raided" || ending === "full" ? 6 : 16;
  for (let k = 0; k < fallen; k++) px(8 + ((k * 37) % 144), GY + 2 + ((k * 13) % 14), mix(nut, wood, 0.2));
  const heap = (x: number, y: number, n: number) => {
    for (let r = 0; r < n; r++) rect(x - (n - r) * 2, y - r, (n - r) * 4, 1, r % 2 ? mix(nut, wood, 0.25) : mix(nut, light, 0.1));
  };
  const coat = mix(nut, ink, 0.45), skin = mix(wood, light, 0.4), bag = mix(wood, light, 0.35);
  if (!ending || ending === "heavy") { heap(60, 56, 4); person(ctx, 44, 58, 13, coat, skin); rect(50, 50, 4, 5, bag); }
  if (ending === "cached" || ending === "raided") {
    if (ending === "cached") [[54, 58], [58, 57], [62, 58], [57, 56]].forEach(([x, y]) => rect(x - 4, y, 9, 1, mix(wood, ink, 0.4)));
    else { heap(58, 58, 1); [[46, 56], [70, 60], [64, 54]].forEach(([x, y]) => rect(x, y, 5, 1, mix(wood, ink, 0.4))); }
    person(ctx, 94, 58, 13, coat, skin);
  }
  // Animals: dark low shapes coming in from the right.
  const come = ease(t / 1600);
  const animal = (x: number, y: number) => {
    rect(x, y - 5, 7, 4, mix(ink, wood, 0.25));
    rect(x - 3, y - 6, 4, 3, mix(ink, wood, 0.25));
    rect(x + 6, y - 7, 2, 3, mix(ink, wood, 0.25));
    rect(x, y - 1, 1, 2, mix(ink, wood, 0.25)); rect(x + 5, y - 1, 1, 2, mix(ink, wood, 0.25));
  };
  if (ending === "beasts" || ending === "chased") {
    heap(60, 56, ending === "chased" ? 2 : 4);
    [[110, 58], [124, 55], [136, 60]].forEach(([x, y], i) => animal(x - Math.round((ending === "chased" ? 46 : 18) * come) + i * 2, y));
    person(ctx, ending === "chased" ? 20 : 44, 58, 13, coat, skin);
    if (ending === "chased") rect(30, 56, 4, 3, bag);
  }
  if (ending === "full" || ending === "carried" || ending === "left") {
    const walk = Math.round(20 * come);
    person(ctx, 70 - walk, 58, 14, coat, skin);
    rect(75 - walk, 47, ending === "full" ? 6 : 5, ending === "full" ? 8 : 6, bag);
    if (ending === "left") { heap(104, 57, 3); [[118, 59], [130, 56]].forEach(([x, y]) => animal(x, y)); }
  }
  if (ending === "missed") { heap(64, 57, 1); person(ctx, 40, 58, 13, coat, skin); }
  fadeEdges(ctx, pal.ink);
}
