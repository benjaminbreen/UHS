import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** Short-handed: a row of work places under tall windows, and one of them empty. */
export default function line(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), steel = rgb(pal.edge), light = rgb(pal.light), lamp = rgb(pal.accent);
  const night = ending === "tired" || ending === "gone", FY = 50;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      // Tall windows, with shafts of light falling across the floor.
      const win = y > 6 && y < 30 && x % 32 > 8 && x % 32 < 22;
      const shaft = !night && y >= FY && Math.abs(((x - (y - 30) * 0.6 + 320) % 32) - 15) < 6;
      px(x, y, win ? (night ? mix(ink, fill, 0.6) : (y - 6) % 8 === 0 || x % 32 === 15 ? mix(steel, ink, 0.3) : y < 14 + (b - 0.5) * 6 ? mix(fill, light, 0.65) : mix(fill, light, 0.45))
        : shaft ? mix(steel, light, 0.08) : y < FY ? mix(ink, fill, y % 9 === 0 ? 0.6 : 0.8) : mix(steel, ink, 0.55));
    }
  const coat = mix(lamp, ink, 0.4), skin = mix(steel, light, 0.55), them = mix(fill, light, 0.3);
  // The work places: a bench with a machine on it, and the pile of work beside each.
  const place = (x: number, pile: number) => {
    rect(x, FY - 10, 20, 2, mix(steel, light, 0.2));
    rect(x + 2, FY - 8, 2, 8, mix(steel, ink, 0.3)); rect(x + 16, FY - 8, 2, 8, mix(steel, ink, 0.3));
    rect(x + 4, FY - 16, 10, 6, mix(steel, ink, 0.1));
    rect(x + 6, FY - 14, 3, 3, night ? mix(ink, steel, 0.3) : pal.accent);
    for (let i = 0; i < pile; i++) rect(x + 15 - (i % 2), FY - 12 - i * 2, 5, 2, i % 2 ? mix(light, steel, 0.35) : mix(light, steel, 0.15));
  };
  const xs = [6, 38, 70, 102, 134], gap = 3;
  const pile = ending === "covered" || ending === "excused" ? 0 : ending === "double" ? 6 : ending === "docked" ? 5 : 4;
  xs.forEach((x, i) => place(x, i === gap ? pile : 1));
  xs.forEach((x, i) => {
    if (i === gap || night) return;
    person(ctx, x + 6, FY + 2, 14, i === 2 ? coat : them, skin);
  });
  // You, reaching across to the empty place.
  if (ending === "double" || ending === "covered") person(ctx, xs[gap] - 6, FY + 2, 14, coat, skin);
  const come = ease(t / 1200);
  if (ending === "docked" || ending === "excused") {
    const x = ending === "excused" ? 112 + Math.round(30 * come) : 120;
    person(ctx, x, FY + 6, 17, mix(ink, steel, 0.2), skin);
    rect(x - 1, FY - 12, 7, 2, mix(ink, steel, 0.2));
    if (ending === "docked") rect(x + 6, FY - 6, 3, 4, mix(light, lamp, 0.2));
  }
  if (night) person(ctx, 58, FY + 6, 14, coat, skin);
  fadeEdges(ctx, pal.ink);
}
