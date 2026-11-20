import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** A city block at night as its windows go out, one generator still running, and a candle upstairs. */
export default function blackout(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), brick = rgb(pal.edge), light = rgb(pal.light), lamp = rgb(pal.accent);
  const GROUND = 56;
  const back = ending === "passed";
  // The lights go out across the block left to right as the card opens, and come back the same way at the end.
  const out = back ? 1 - ease((t - 600) / 1400) : ease(t / 1200);
  const sky = [mix(ink, fill, 0.25), mix(ink, fill, 0.55), mix(ink, fill, 0.85)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, sky[Math.min(2, Math.floor(y / 20 + (bayer(x, y) - 0.5) * 0.5))]);
  // With every light off the stars come out over the city.
  const stars = ending === "stayed" ? 40 : back ? 6 : Math.round(26 * out);
  for (let i = 0; i < stars; i++)
    px(Math.floor(hash(i) * EMBLEM_W), Math.floor(hash(i + 40) * 24), mix(fill, light, hash(i + 3) > 0.7 ? 0.75 : 0.45));
  const wall = mix(ink, brick, 0.5), shade = mix(ink, brick, 0.32), dark = mix(ink, fill, 0.45), glass = mix(lamp, light, 0.35);
  const blocks: [number, number, number][] = [[18, 22, 34], [42, 18, 28], [62, 26, 40], [90, 20, 30], [112, 30, 24]];
  // The elder's window, high in the tallest block, and the generator's house low on the right.
  const ex = 72, ey = 22, gx = 132, gy = GROUND - 10;
  for (const [x, w, h] of blocks) {
    rect(x, GROUND - h, w, h, wall);
    rect(x + w - 2, GROUND - h, 2, h, shade);
    rect(x, GROUND - h, w, 1, mix(brick, light, 0.18));
    for (let wy = GROUND - h + 4; wy < GROUND - 5; wy += 6)
      for (let wx = x + 3; wx < x + w - 4; wx += 5) {
        const off = hash(wx * 7 + wy) * 0.85 + 0.05 < out;
        rect(wx, wy, 3, 3, off ? dark : glass);
      }
  }
  const candle = ending === "need" || ending === "sat" || ending === "struggled";
  if (candle) {
    rect(ex - 1, ey - 1, 5, 5, mix(lamp, ink, 0.55));
    rect(ex, ey, 3, 3, mix(lamp, ink, 0.2));
    px(ex + 1, ey + 1, mix(lamp, light, 0.5 + (Math.floor(t / 160) % 3) * 0.15));
  }
  // The house with the generator: its window stays lit, and it chugs out a little smoke.
  rect(gx - 8, gy, 22, 10, wall);
  for (let i = 0; i < 6; i++) rect(gx - 10 + i, gy - 1 - i, 26 - i * 2, 1, shade);
  rect(gx - 4, gy + 3, 4, 4, mix(lamp, light, 0.45));
  rect(gx + 6, gy + 4, 4, 6, dark);
  rect(gx + 15, GROUND - 4, 5, 4, mix(fill, light, 0.3));
  for (let i = 0; i < 3; i++) {
    const p = (t / 900 + i / 3) % 1;
    const sx = gx + 17 + Math.round(p * 3), sy = GROUND - 5 - Math.round(p * 10);
    if (bayer(sx, sy) > p * 0.9) rect(sx, sy, 2, 1, mix(fill, light, 0.4));
  }
  rect(0, GROUND, EMBLEM_W, EMBLEM_H - GROUND, mix(ink, brick, 0.22));
  for (let x = 0; x < EMBLEM_W; x += 9) rect(x, GROUND + 3, 5, 1, mix(ink, brick, 0.32));
  const body = mix(fill, light, 0.22), head = mix(light, brick, 0.5), you = mix(lamp, ink, 0.45);
  if (ending === "shared") {
    // The extension cable over the fence, and your window lit off it.
    for (let x = 100; x <= gx - 8; x++) px(x, GROUND - 7 + Math.round(2 * Math.sin(((x - 100) / (gx - 108)) * Math.PI)), mix(ink, light, 0.35));
    rect(101, 43, 3, 3, glass);
    person(ctx, 106, GROUND + 6, 12, you, head);
  } else if (ending === "refused") {
    // Everything from the freezer on a grill in the street.
    rect(56, GROUND + 1, 10, 2, mix(ink, light, 0.3));
    flame(ctx, 59, GROUND - 3, Math.floor(t / 170) % 3);
    for (let i = 0; i < 4; i++) {
      const p = (t / 1100 + i / 4) % 1;
      if (bayer(60, i) > p * 0.8) rect(60 + Math.round(Math.sin(p * 6 + i) * 2), GROUND - 5 - Math.round(p * 14), 2, 1, mix(fill, light, 0.35));
    }
    for (const x of [44, 50, 70]) person(ctx, x, GROUND + 7, 12, body, head);
    person(ctx, 76, GROUND + 7, 12, you, head);
  } else if (ending === "carried") {
    person(ctx, gx - 22, GROUND + 6, 12, body, mix(light, ink, 0.25));
    person(ctx, gx - 28, GROUND + 7, 12, you, head);
  } else if (ending === "stayed") {
    rect(20, GROUND + 1, 14, 2, mix(ink, brick, 0.45));
    person(ctx, 24, GROUND + 4, 10, you, head);
    person(ctx, 30, GROUND + 4, 10, body, head);
  } else if (!candle && !back) {
    person(ctx, 30, GROUND + 7, 12, you, head);
    if (ending !== "dark") person(ctx, 38, GROUND + 7, 12, body, head);
  }
  fadeEdges(ctx, pal.ink);
}
