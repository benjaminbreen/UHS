import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** A bank with its shutter down and a line along the pavement: the day the money stopped working. */
export default function queue(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), stone = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const GY = 50, late = ending === "passed" || ending === "refused" || ending === "gone";
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < 12) px(x, y, late ? mix(ink, fill, y / 12 + (b - 0.5) * 0.3 > 0.5 ? 0.7 : 0.45) : mix(fill, light, y / 12 + (b - 0.5) * 0.3 > 0.5 ? 0.55 : 0.4));
      else if (y < GY) px(x, y, (x + 3) % 22 === 0 ? mix(stone, ink, 0.35) : mix(fill, stone, 0.45));
      else px(x, y, y === GY ? mix(stone, light, 0.35) : (x + (y % 2) * 6) % 12 === 0 ? mix(fill, ink, 0.35) : mix(fill, stone, 0.25));
    }
  // The bank: stone front, a cornice and nameboard, barred windows either side of the door.
  const BX = 70, BW = 66, wall = mix(stone, light, 0.3), shade = mix(stone, ink, 0.15);
  rect(BX, 8, BW, GY - 8, wall);
  rect(BX - 2, 8, BW + 4, 3, mix(stone, light, 0.45));
  rect(BX - 2, 11, BW + 4, 1, shade);
  rect(BX + 16, 14, BW - 32, 5, mix(gold, ink, 0.25));
  for (let x = BX + 19; x < BX + BW - 18; x += 4) rect(x, 16, 2, 1, mix(gold, light, 0.4));
  for (const wx of [BX + 5, BX + BW - 17]) {
    rect(wx, 22, 12, 16, mix(ink, fill, 0.5));
    for (let x = wx + 1; x < wx + 12; x += 3) rect(x, 22, 1, 16, mix(stone, light, 0.15));
    rect(wx - 1, 38, 14, 2, mix(stone, light, 0.45));
  }
  // The door, and the steel shutter over it: down, or rolled halfway up at the counter.
  const DX = BX + 23, DW = 20, DT = 22;
  rect(DX - 2, DT - 2, DW + 4, GY - DT + 2, shade);
  const open = ending === "door" ? Math.round(14 * ease(t / 900)) : 0;
  rect(DX, DT, DW, GY - DT, mix(gold, light, 0.35));
  rect(DX + 2, DT + 10, DW - 4, 2, mix(stone, ink, 0.3));
  rect(DX + 7, DT + 4, 6, 6, mix(fill, light, 0.5));
  for (let y = DT; y < GY - open; y++) rect(DX, y, DW, 1, y % 3 === 0 ? mix(stone, ink, 0.45) : mix(stone, light, 0.08));
  if (!open && (!ending || ending === "news")) {
    rect(DX + 6, DT + 6, 8, 10, pal.light);
    for (let y = DT + 8; y < DT + 15; y += 2) rect(DX + 7, y, 6, 1, mix(ink, light, 0.55));
  }
  // The line along the pavement, from the door back to the edge of the picture.
  const coat = mix(gold, ink, 0.35), skin = mix(stone, light, 0.45);
  const others = [mix(ink, fill, 0.5), mix(fill, light, 0.2), mix(stone, ink, 0.4), mix(fill, ink, 0.2), mix(stone, fill, 0.3)];
  const lined = !ending || ending === "news" || ending === "door";
  if (lined) {
    const front = ending === "door" ? DX + 4 : DX - 8;
    for (let i = 0; i < 8; i++) {
      const x = front - i * 8 - (i > 3 ? 2 : 0);
      const bob = (Math.floor(t / 500) + i) % 5 === 0 ? 1 : 0;
      const you = ending === "door" ? i === 0 : i === 3;
      person(ctx, x, GY + 7 + (i % 2) - bob, 15 - (i % 3), you ? coat : others[i % others.length], skin);
    }
  }
  if (ending === "ask" || ending === "lent" || ending === "refused") {
    // Your own doorway on the left, the friend come to it.
    rect(18, 20, 18, GY - 20, mix(stone, ink, 0.25));
    rect(22, 26, 10, GY - 26, mix(gold, ink, late ? 0.45 : 0.6));
    if (!late) rect(24, 28, 6, 8, mix(gold, light, 0.3));
    person(ctx, 26, GY + 6, 15, coat, skin);
    const away = ending === "refused" ? ease((t - 300) / 1400) : 0;
    const fx = 38 + Math.round(60 * away);
    person(ctx, fx, GY + 7 - Math.round(2 * away), 15 - Math.round(3 * away), others[1], skin);
    if (ending === "lent" && t > 500) {
      rect(33, GY - 6, 5, 3, mix(gold, light, 0.5));
      rect(34, GY - 7, 3, 1, mix(gold, light, 0.7));
    }
  }
  if (late && ending !== "refused") {
    // Evening: the street lamp on, papers blown against the shutter.
    rect(56, 14, 1, GY - 14, mix(stone, ink, 0.4));
    rect(54, 12, 5, 2, mix(stone, ink, 0.3));
    rect(55, 14, 3, 1, mix(gold, light, 0.6));
    rect(53, 14, 7, 1, mix(gold, fill, 0.5));
    for (let y = GY + 1; y < GY + 7; y++)
      for (let x = 44; x < 70; x++) {
        const d = Math.hypot((x - 56) / 13, (y - GY - 3) / 4);
        if (d < 0.7 || (d < 1 && bayer(x, y) < (1 - d) * 1.6)) px(x, y, mix(gold, fill, 0.6));
      }
    [[DX + 2, 2], [DX + 9, 1], [DX + 15, 3], [60, 1]].forEach(([x, d]) => rect(x, GY + d, 3, 1, mix(light, stone, 0.3)));
  }
  fadeEdges(ctx, pal.ink);
}
