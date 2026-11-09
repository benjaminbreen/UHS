import { EMBLEM_H, EMBLEM_W, ease, fadeEdges, flame, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** The accounts: a desk by lamplight, the open book, and whoever comes to look at it. */
export default function desk(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), lamp = rgb(pal.accent);
  const out = ending === "open", low = ending === "again", DY = 44, LX = 40, f = Math.floor(t / 170) % 3;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const g = out ? 0 : glow(x, y, LX + 22, DY, low ? 40 : 56, low ? 26 : 34, f);
      const base = y < DY + 4 ? mix(ink, fill, 0.7) : mix(ink, wood, 0.3);
      px(x, y, g === 2 ? mix(fill, lamp, 0.3) : g === 1 ? mix(fill, lamp, 0.12) : base);
    }
  // A window with the night outside, and a shelf of old records.
  rect(118, 8, 22, 22, mix(wood, ink, 0.35));
  rect(120, 10, 18, 18, mix(ink, fill, 0.5));
  rect(128, 10, 2, 18, mix(wood, ink, 0.35)); rect(120, 18, 18, 2, mix(wood, ink, 0.35));
  rect(132, 12, 3, 3, mix(light, fill, 0.3));
  rect(10, 16, 40, 2, mix(wood, ink, 0.2));
  for (let i = 0; i < 8; i++) rect(12 + i * 5, 10 + (i % 3), 4, 6 - (i % 3), i % 2 ? mix(wood, light, 0.2) : mix(fill, light, 0.2));
  // The scribe behind the desk, then the desk itself.
  const coat = mix(fill, light, 0.15), skin = mix(wood, light, 0.45), chief = mix(lamp, ink, 0.45);
  person(ctx, 74, DY + 6, 24, coat, skin);
  rect(18, DY, 112, 3, mix(wood, light, 0.2));
  rect(22, DY + 3, 104, 8, mix(wood, ink, 0.35));
  rect(22, DY + 3, 104, 1, mix(wood, ink, 0.55));
  rect(24, DY + 11, 3, EMBLEM_H - DY - 11, mix(wood, ink, 0.45)); rect(121, DY + 11, 3, EMBLEM_H - DY - 11, mix(wood, ink, 0.45));
  // The book, open, with its columns; the line in question picked out.
  const page = mix(light, lamp, 0.12), line = mix(ink, wood, 0.4);
  if (ending !== "reported") {
    rect(62, DY - 4, 36, 5, page);
    rect(79, DY - 4, 2, 5, mix(light, wood, 0.4));
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 2; c++) rect(64 + c * 18, DY - 3 + r * 2, 14, 1, line);
  }
  if (ending === "whose" || ending === "fixed" || ending === "named") rect(82, DY - 1, 14, 1, pal.accent);
  if (ending === "fudged") { rect(64, DY, 14, 1, pal.accent); px(77, DY - 5, pal.accent); }
  if (low) [[30, 0], [102, 1], [110, 0]].forEach(([x, r]) => rect(x, DY - 2 - r, 10, 2, page));
  // The lamp.
  rect(LX - 2, DY - 3, 6, 3, mix(wood, lamp, 0.3));
  if (!out) flame(ctx, LX - 1, DY - (low ? 6 : 8), f);
  else rect(LX, DY - 5, 1, 2, mix(fill, light, 0.3));
  const come = ease(t / 1000);
  if (ending === "named" || ending === "reported") person(ctx, 106 + Math.round(8 * (1 - come)), DY + 12, 26, chief, skin);
  if (ending === "named") person(ctx, 138, DY + 12, 16, mix(fill, light, 0.25), skin);
  if (ending === "reported") rect(102, DY - 8, 8, 4, page);
  fadeEdges(ctx, pal.ink);
}
