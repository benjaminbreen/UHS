import { EMBLEM_H, EMBLEM_W, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The agent's office: a desk under a poster of an aeroplane, a passport, and the papers that might get you out. */
export default function visa(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), green = rgb(pal.accent);
  const DY = 42;
  const shut = ending === "gone" || ending === "stayed";
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      if (y < DY + 4) px(x, y, (x % 22 === 0 && !shut) ? mix(fill, ink, 0.2) : mix(fill, light, shut ? 0.04 : 0.1));
      else px(x, y, (x + y * 3) % 11 === 0 ? mix(ink, wood, 0.3) : mix(ink, wood, 0.45));
    }
  if (shut) {
    // Outside, the rolled-down shutter, the painted sign above it.
    rect(30, 6, 100, 9, mix(green, ink, 0.3));
    for (let i = 0; i < 9; i++) rect(36 + i * 10, 9, 6, 2, mix(light, green, 0.3));
    rect(34, 16, 92, DY + 4 - 16, mix(fill, light, 0.3));
    for (let y = 18; y < DY + 4; y += 3) rect(34, y, 92, 1, mix(fill, ink, 0.15));
    rect(34, DY + 3, 92, 1, mix(ink, fill, 0.3));
    const skin = mix(wood, light, 0.45);
    if (ending === "stayed") {
      const k = ease(t / 1400);
      person(ctx, Math.round(96 + 30 * k), EMBLEM_H - 2, 20, mix(green, ink, 0.45), skin);
    } else rect(70, 26, 20, 12, mix(light, wood, 0.15));
    if (ending === "gone") for (let r = 0; r < 3; r++) rect(72, 28 + r * 3, 16 - r * 4, 1, mix(ink, wood, 0.4));
    fadeEdges(ctx, pal.ink);
    return;
  }
  // The poster: an aeroplane climbing through a blue sky.
  rect(14, 6, 34, 24, mix(wood, ink, 0.25));
  const plane = mix(ink, fill, 0.5);
  rect(16, 8, 30, 20, mix(light, green, 0.22));
  rect(16, 24, 30, 4, mix(green, ink, 0.15));
  for (let i = 0; i < 6; i++) rect(18 + i * 3, 19 + Math.round(i * 0.4), 2, 1, mix(light, green, 0.4));
  // Climbing to the right: the fuselage, the swept wing across it, the tail fin behind.
  for (let i = 0; i < 18; i++) rect(24 + i, 21 - Math.round(i * 0.5), 1, 2, plane);
  px(42, 12, plane);
  for (let i = 0; i < 5; i++) { px(33 - i, 17 + i, plane); px(34 - i, 17 + i, plane); }
  for (let i = 0; i < 3; i++) px(35 + i, 15 - i, plane);
  rect(24, 17, 1, 4, plane);
  rect(25, 18, 1, 2, plane);
  // A clock and a calendar with days crossed off.
  rect(118, 8, 9, 9, mix(light, wood, 0.2));
  rect(122, 9, 1, 4, pal.ink); rect(122, 12, 3, 1, pal.ink);
  rect(132, 8, 14, 16, mix(light, fill, 0.1));
  rect(132, 8, 14, 3, mix(green, ink, 0.2));
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) rect(133 + c * 3, 13 + r * 3, 2, 2, r === 0 || (r === 1 && c < 2) ? mix(green, ink, 0.3) : mix(ink, light, 0.6));
  // The agent behind the desk, and you in front of it.
  const agent = mix(light, fill, 0.35), skin = mix(wood, light, 0.45), you = mix(green, ink, 0.45);
  const other = ending === "lapsed";
  person(ctx, 72, DY + 2, 22, agent, skin);
  rect(56, DY, 56, 3, mix(wood, light, 0.25));
  rect(58, DY + 3, 52, EMBLEM_H - DY - 3, mix(wood, ink, 0.3));
  rect(58, DY + 3, 52, 1, mix(wood, ink, 0.5));
  // The papers, and the passport: on your side of the desk, or the agent's.
  const page = mix(light, wood, 0.08);
  rect(66, DY - 3, 12, 3, page);
  rect(68, DY - 2, 8, 1, mix(ink, light, 0.5));
  const handed = ending === "sent" || ending === "borrowed" || ending === "short";
  const slide = handed ? ease(t / 900) : 0;
  const ppx = Math.round(98 - 22 * slide);
  rect(ppx, DY - 3, 6, 3, mix(green, ink, 0.35));
  px(ppx + 2, DY - 2, mix(light, green, 0.4));
  if (ending === "sent") rect(88, DY - 2, 8, 2, page);
  if (ending === "borrowed") for (let i = 0; i < 4; i++) rect(84 + i * 3, DY - 2 - (i % 2), 2, 2, "#e8c060");
  if (ending === "short") rect(86, DY - 2, 7, 2, mix(wood, ink, 0.2));
  if (ending === "heard" || ending === "ask") person(ctx, 132, EMBLEM_H - 2, 18, mix(wood, light, 0.2), skin);
  person(ctx, other ? 140 : 112, EMBLEM_H - 2, 22, other ? mix(green, ink, 0.6) : you, skin);
  if (other) person(ctx, 112, EMBLEM_H - 2, 22, mix(fill, light, 0.3), skin);
  fadeEdges(ctx, pal.ink);
}
