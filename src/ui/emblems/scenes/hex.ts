import { EMBLEM_H, EMBLEM_W, ease, fadeEdges, flame, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** A sick one on the sleeping mat by the hearth, and whoever stands over them. */
export default function hex(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), spirit = rgb(pal.accent);
  const f = Math.floor(t / 120) % 3;
  const better = ending === "cooled" || ending === "cleared" || ending === "heard" || ending === "divined";
  const dark = ending === "named" ? 0.5 * ease((t - 300) / 800) : 0;
  const fire: [number, number, number] = [0xe8, 0x85, 0x3a];
  const wall = [pal.ink, mix(ink, wood, 0.3 - dark * 0.5), mix(wood, fire, (better ? 0.32 : 0.2) - dark * 0.3)];
  const floor = [mix(ink, fill, 0.5), mix(fill, wood, 0.4 - dark * 0.5), mix(wood, fire, 0.25 - dark * 0.3)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, (y < 42 ? wall : floor)[glow(x, y, 40, 44, 90, 46, f)]);
  // Roof poles, with herbs and a gourd hanging from them.
  for (let x = 0; x < EMBLEM_W; x++) px(x, 7 + Math.round(x / 40), mix(wood, ink, 0.4));
  for (const [x, n] of [[70, 7], [84, 5], [118, 6]]) {
    rect(x, 9, 1, n, mix(wood, light, 0.2));
    rect(x - 1, 9 + n, 3, 3, mix(spirit, fill, 0.5));
  }
  rect(98, 9, 1, 3, mix(wood, ink, 0.2));
  rect(96, 12, 5, 6, mix(wood, light, 0.3));
  // The hearth.
  rect(22, 46, 14, 3, mix(ink, wood, 0.5));
  for (const x of [20, 34]) rect(x, 44, 4, 3, mix(light, fill, 0.45));
  flame(ctx, 26, 41, f);
  flame(ctx, 29, 42, (f + 1) % 3);
  // The mat and the sick one under a blanket; sitting up when the fever turns.
  const up = better ? ease((t - 400) / 900) : 0;
  rect(56, 46, 54, 4, mix(wood, light, 0.3));
  rect(56, 50, 54, 1, mix(wood, ink, 0.4));
  const blanket = mix(spirit, wood, 0.5);
  for (let x = 66; x < 108; x++) {
    const h = 3 + Math.round(2 * Math.sin(((x - 66) / 42) * Math.PI));
    rect(x, 46 - h, 1, h, blanket);
    px(x, 46 - h, mix(spirit, light, 0.2));
  }
  const hx = 60 + Math.round(up * 4), hy = 39 - Math.round(up * 6);
  if (up > 0.3) rect(hx, hy + 4, 5, 46 - hy - 4, mix(light, wood, 0.55));
  rect(hx - 1, hy - 1, 7, 6, mix(light, wood, better ? 0.35 : 0.5));
  rect(hx - 1, hy - 1, 7, 2, mix(ink, wood, 0.3));
  rect(hx - 2, hy + 5, 9, 2, mix(light, spirit, 0.35));
  if (!better && Math.floor(t / 900) % 2) px(hx + 4, hy + 2, mix(ink, wood, 0.4));
  rect(112, 47, 6, 2, mix(wood, light, 0.35));
  rect(113, 46, 4, 1, mix(light, spirit, 0.3));
  // Whoever stands at the foot of the mat.
  if (ending !== "dropped" && ending !== "divined" && ending !== "named") {
    const elder = ending === "cleared" || ending === "heard";
    const fx = 128 + Math.round(8 * (1 - ease(t / 500)));
    person(ctx, fx, 52, elder ? 19 : 21, elder ? mix(light, wood, 0.45) : mix(ink, spirit, 0.35), mix(light, wood, 0.4));
    if (elder) rect(fx - 2, 33, 1, 19, mix(wood, light, 0.3));
  }
  // The diviner's tray: the pieces cast, and where they fall.
  if (ending === "divined" || ending === "named") {
    rect(118, 54, 30, 5, mix(wood, ink, 0.2));
    rect(119, 54, 28, 1, mix(wood, light, 0.25));
    [[122, 52], [128, 51], [133, 52], [139, 51], [143, 52]].forEach(([x, y], i) => {
      const land = ease((t - 200 - i * 90) / 300);
      if (land <= 0) return;
      const c = ending === "named" && i === 2 ? mix(spirit, light, 0.2 + 0.2 * (Math.floor(t / 300) % 2)) : mix(light, spirit, 0.15);
      rect(x, Math.round(y - 8 * (1 - land)), 2, 2, c);
    });
  }
  // Gifts set down at the mat's foot.
  if (ending === "appeased" || ending === "judged" || ending === "absent")
    [[112, 6], [119, 5], [125, 7]].forEach(([x, w], i) => {
      if (t < 300 + i * 200) return;
      rect(x, 56 - w, w, w, mix(wood, light, 0.25 + i * 0.08));
      rect(x + (w >> 1), 55 - w, 1, 1, mix(spirit, light, 0.3));
    });
  fadeEdges(ctx, pal.ink);
}
