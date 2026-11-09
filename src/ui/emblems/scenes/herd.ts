import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** The herd: game on open ground beyond a rise, and the hunters in the grass. */
export default function herd(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sun = rgb(pal.accent);
  const dusk = ending === "late" || ending === "gone" || ending === "given" || ending === "shared", HY = 30;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), h = y / HY + (b - 0.5) * 0.3;
      const rise = HY - Math.round(4 * Math.sin(x / 30 + 0.6) + 2 * Math.sin(x / 11));
      if (y < rise) px(x, y, h > 0.8 ? mix(sun, light, dusk ? 0.1 : 0.4) : h > 0.5 ? mix(fill, sun, dusk ? 0.55 : 0.35) : mix(ink, fill, dusk ? 0.5 : 0.8));
      else {
        const k = (y - rise) / (EMBLEM_H - rise);
        px(x, y, k + (b - 0.5) * 0.25 < 0.15 ? mix(fill, wood, 0.1) : k < 0.6 ? mix(fill, wood, 0.3) : mix(wood, ink, 0.25));
      }
    }
  const hide = mix(ink, wood, 0.35);
  const beast = (x: number, y: number, s: number, down = false, run = 0) => {
    if (down) {
      rect(x + s, y - 4 * s, 7 * s, s, hide);
      rect(x, y - 3 * s, 9 * s, 2 * s, hide);
      rect(x - 2 * s, y - 2 * s, 3 * s, 2 * s, hide);
      rect(x - 2 * s, y - 3 * s, s, s, mix(light, wood, 0.4));
      rect(x + 3 * s, y - s, s, s, hide); rect(x + 6 * s, y - s, s, s, hide);
      rect(x + 4 * s, y + 0, 3 * s, 1, mix(wood, ink, 0.5));
      return;
    }
    rect(x, y - 6 * s, 8 * s, 4 * s, hide);
    rect(x + 1 * s, y - 7 * s, 3 * s, 1 * s, hide);
    rect(x - 2 * s, y - 5 * s + (run ? 0 : s), 3 * s, 3 * s, hide);
    [0, 2, 5, 7].forEach((dx, i) => rect(x + dx * s + (run && i % 2 ? s : 0), y - 2 * s, s, 2 * s, hide));
  };
  // The herd on the rise: grazing, drifting off, or gone in a haze of dust.
  const away = ending === "spooked" ? 30 * ease(t / 1600) : 0;
  if (!ending || ending === "plan" || ending === "spooked")
    for (let i = 0; i < 9; i++) {
      const x = 66 + i * 9 + Math.round(hash(i) * 5) + away, y = HY - 1 + (i % 3) - Math.round(3 * Math.sin((66 + i * 9) / 30 + 0.6));
      if (x < 150) beast(x, y, 1, false, ending === "spooked" ? (Math.floor(t / 150) + i) % 2 : 0);
    }
  if (ending === "spooked" || ending === "gone")
    for (let i = 0; i < 30; i++) {
      const x = 128 + Math.round(hash(i) * 26), y = HY - 6 + Math.round(hash(i + 7) * 6);
      if (bayer(x, y) < 0.6) px(x, y, mix(sun, light, 0.2));
    }
  const coat = mix(sun, ink, 0.45), skin = mix(wood, light, 0.4), them = mix(ink, fill, 0.35), shaft = mix(wood, light, 0.35);
  const hunter = (x: number, foot: number, h: number, c: string) => {
    person(ctx, x, foot, h, c, skin);
    rect(x + Math.round(h / 3), foot - h - 3, 1, h + 1, shaft);
  };
  if (!ending || ending === "plan") {
    hunter(30, 56, 10, coat);
    hunter(44, 58, 10, them);
    for (let x = 18; x < 64; x += 2) rect(x, 52 + (x % 3), 1, 3, mix(fill, wood, 0.1));
  }
  if (ending === "spooked") { hunter(40, 56, 14, coat); hunter(54, 57, 14, them); }
  if (ending === "kill") {
    beast(80, 56, 2, true);
    hunter(62, 58, 15, coat);
    hunter(104, 58, 15, them);
  }
  if (ending === "late") { beast(84, 57, 2, true); hunter(66, 58, 14, coat); }
  if (ending === "shared" || ending === "given") {
    beast(60, 56, 2, true);
    if (ending === "shared") beast(94, 54, 2, true);
    [[46, 58], [80, 59], [116, 57], [130, 59]].forEach(([x, y], i) => person(ctx, x, y, 13, i % 2 ? them : mix(wood, ink, 0.2), skin));
    rect(104, 58, 6, 2, mix(wood, ink, 0.3));
    flame(ctx, 105, 54, Math.floor(t / 170) % 3);
    hunter(ending === "given" ? 22 : 70, 60, 14, coat);
  }
  if (ending === "gone") hunter(50, 58, 14, coat);
  fadeEdges(ctx, pal.ink);
}
