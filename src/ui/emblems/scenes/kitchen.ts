import { EMBLEM_H, EMBLEM_W, blend, css, ease, fadeEdges, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** The kitchen at night: the table, the phone on the wall, and the bathroom door with the light on. */
export default function kitchen(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wall = rgb(pal.edge), light = rgb(pal.light), cold = rgb(pal.accent);
  const FLOOR = 46, DX = 112, DW = 18;
  const morning = ending === "clinic" || ending === "alone";
  const doorLit = ending === undefined || ending === "found" || ending === "worse" || ending === "back";
  const bulb = morning ? 0 : 1;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      // The light over the table, and the cold spill from the bathroom door.
      const g = bulb ? glow(x, y, 54, 30, 50, 30) : 0;
      const spill = doorLit && x > DX - 22 && y >= FLOOR && Math.abs(x - DX - DW / 2) < DW / 2 + (y - FLOOR) * 0.9;
      if (y < FLOOR) {
        const base = morning ? mix(wall, light, 0.12) : mix(ink, wall, 0.45);
        px(x, y, g === 2 ? mix(wall, light, 0.25) : g === 1 ? mix(wall, light, 0.1) : base);
      } else {
        const tile = blend(ink, fill, (x + (y % 2) * 4) % 8 === 0 || y === FLOOR ? 0.5 : morning ? 0.95 : 0.75);
        px(x, y, mix(tile, light, spill ? 0.3 : 0));
      }
    }
  rect(0, FLOOR - 2, EMBLEM_W, 2, mix(ink, wall, 0.25));
  // The window over the sink: night, or the first light.
  rect(18, 10, 24, 18, mix(ink, wall, 0.2));
  rect(20, 12, 20, 14, morning ? mix(fill, light, 0.55) : mix(ink, fill, 0.6));
  rect(29, 12, 2, 14, mix(ink, wall, 0.2));
  if (!morning) rect(35, 15, 1, 1, mix(light, fill, 0.3));
  rect(14, 28, 32, 3, mix(wall, light, 0.3));
  rect(16, 31, 28, FLOOR - 31, mix(wall, ink, 0.25));
  // The bathroom door: the bright gap, or shut and dark.
  rect(DX - 2, 12, DW + 4, FLOOR - 12, mix(wall, ink, 0.4));
  rect(DX, 14, DW, FLOOR - 14, doorLit ? mix(light, cold, 0.25) : mix(ink, fill, 0.35));
  if (doorLit) {
    rect(DX + DW - 4, 20, 3, 6, mix(light, cold, 0.5));
    rect(DX + 2, 32, 7, 4, mix(light, fill, 0.15));
  } else rect(DX + DW - 4, 30, 2, 2, mix(wall, light, 0.3));
  // The phone on the wall beside it, its cord hanging.
  const off = ending === "found" || ending === "worse";
  rect(96, 18, 7, 10, mix(light, wall, 0.45));
  rect(97, 19, 5, 3, mix(ink, wall, 0.3));
  if (!off) rect(95, 18, 2, 10, mix(light, wall, 0.3));
  for (let i = 0; i < 6; i++) px(off ? 96 - i : 97, 28 + i * 2, mix(light, wall, 0.4));
  // The table and its chairs, the lamp above.
  const tableTop = mix(wall, light, 0.3), leg = mix(wall, ink, 0.35);
  rect(36, 37, 40, 3, tableTop);
  rect(38, 40, 2, FLOOR + 4 - 40, leg);
  rect(72, 40, 2, FLOOR + 4 - 40, leg);
  const chair = (x: number, pulled: boolean) => {
    rect(x, 30, 2, FLOOR + 4 - 30, leg);
    rect(x, 40, 9, 2, leg);
    rect(x + 7, 42, 2, FLOOR + 4 - 42, leg);
    if (pulled) rect(x + 2, FLOOR + 4, 9, 1, mix(ink, fill, 0.3));
  };
  chair(26, false);
  chair(78, ending === "gone");
  rect(53, 0, 1, 14, mix(ink, wall, 0.3));
  rect(49, 14, 9, 3, mix(wall, light, morning ? 0.2 : 0.55));
  const you = mix(cold, ink, 0.35), skin = mix(wall, light, 0.5), them = mix(fill, light, 0.25), blanket = mix(cold, light, 0.2);
  if (ending === undefined || ending === "found" || ending === "worse") {
    // On the floor in the doorway, in the light.
    const lie = blend(blend(fill, light, 0.25), ink, ending === "worse" ? 0.35 : 0.15);
    rect(DX - 4, FLOOR + 6, 18, 4, css(lie));
    rect(DX - 9, FLOOR + 8, 5, 2, mix(lie, ink, 0.2));
    rect(DX + 14, FLOOR + 5, 4, 4, mix(blend(wall, light, 0.5), cold, ending === "worse" ? 0.45 : 0.2));
    rect(DX + 2, FLOOR + 10, 6, 1, mix(lie, ink, 0.3));
    // You, run in from the table and down on your knees beside them.
    const k = ease(t / 600);
    const x = Math.round(78 + 20 * k);
    if (k < 1) person(ctx, x, FLOOR + 10, 18, you, skin);
    else {
      rect(x, FLOOR - 3, 6, 9, you);
      rect(x + 1, FLOOR - 7, 4, 4, skin);
      rect(x - 1, FLOOR + 6, 8, 3, mix(cold, ink, 0.48));
      rect(x + 6, FLOOR, 4, 2, you);
    }
  } else if (ending === "back" || ending === "next") {
    rect(80, 28, 7, 12, blanket);
    rect(82, 25, 4, 4, skin);
    rect(81, 40, 6, 2, blanket);
    if (ending === "next") rect(70, 36, 3, 2, mix(light, wall, 0.2));
    person(ctx, 58, FLOOR + 9, 18, you, skin);
  } else if (ending === "kept" || ending === "waitlist") {
    // Up alone at the table, the house asleep, a light under the far door.
    rect(28, 28, 6, 12, you);
    rect(29, 25, 4, 4, skin);
    rect(DX + 1, FLOOR - 2, DW - 2, 1, mix(light, cold, 0.4));
    if (ending === "waitlist") for (let i = 0; i < 3; i++) rect(44 + i * 6, 35, 4, 2, mix(light, wall, 0.25));
  } else if (ending === "gone") {
    // A bag's gone from the hook, and the phone face-up on the table glows once.
    rect(88, 22, 2, 2, mix(wall, light, 0.4));
    rect(60, 35, 5, 2, Math.floor(t / 700) % 3 === 0 ? mix(cold, light, 0.5) : mix(ink, fill, 0.6));
    rect(28, 28, 6, 12, you);
    rect(29, 25, 4, 4, skin);
  } else if (ending === "clinic") {
    rect(64, 35, 4, 2, mix(light, wall, 0.2));
    rect(42, 35, 3, 2, mix(light, wall, 0.2));
  } else if (ending === "alone") {
    rect(28, 28, 6, 12, you);
    rect(29, 25, 4, 4, skin);
    rect(80, 28, 6, 12, them);
    rect(81, 25, 4, 4, skin);
  }
  fadeEdges(ctx, pal.ink);
}
