import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, flame, mix, pen, person, rgb, type Pal } from "../kit";

/** The town gate: where news is called and posted, and where a town shuts itself in. */
export default function crier(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), stone = rgb(pal.edge), light = rgb(pal.light), cloth = rgb(pal.accent);
  const GROUND = 50, gx = 98, gw = 24, top = 24;
  const shut = ending === "turned";
  const sky = [mix(fill, light, 0.3), mix(fill, light, 0.5)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < 18) px(x, y, sky[y / 18 + (b - 0.5) * 0.4 < 0.5 ? 0 : 1]);
      else if (y < GROUND) px(x, y, (y - 18) % 6 === 5 || (x + (Math.floor((y - 18) / 6) % 2) * 5) % 10 === 0 ? mix(stone, ink, 0.35) : mix(stone, light, 0.12));
      else px(x, y, (x + (y % 2) * 3) % 12 === 0 ? mix(fill, ink, 0.3) : mix(fill, stone, 0.35 + (y > 57 ? 0.05 : 0)));
    }
  // Crenels along the wall top, and the gatehouse over the arch.
  for (let x = 0; x < EMBLEM_W; x += 6) rect(x, 15, 3, 3, mix(stone, light, 0.12));
  rect(gx - 6, 8, gw + 12, 10, mix(stone, light, 0.2));
  for (let x = gx - 6; x < gx + gw + 6; x += 5) rect(x, 5, 3, 3, mix(stone, light, 0.2));
  // The arch: the road and fields beyond it, or the gate's planks when it is barred.
  for (let y = top; y < GROUND; y++)
    for (let x = gx; x < gx + gw; x++) {
      const r = Math.hypot((x - gx - gw / 2 + 0.5) / (gw / 2), (y - top - gw / 2) / (gw / 2));
      if (y < top + gw / 2 && r > 1) continue;
      if (shut) px(x, y, (x - gx) % 4 === 3 ? mix(stone, ink, 0.6) : mix(stone, ink, 0.3));
      else if (y < 38) px(x, y, mix(fill, light, 0.6));
      else if (y < 40) px(x, y, mix(fill, ink, 0.1));
      else px(x, y, Math.abs(x - gx - gw / 2 + 0.5) < 1 + (y - 40) * 0.5 ? mix(stone, light, 0.4) : mix(fill, cloth, 0.35));
    }
  if (shut) rect(gx, 38, gw, 2, mix(ink, stone, 0.2));
  // The banner from the gatehouse, and the notice on the wall.
  const wave = Math.round(Math.sin(Math.min(t, 2000) / 300));
  for (let y = 18; y < 30; y++) rect(gx + 2 + (y > 26 ? wave : 0), y, 6, 1, mix(cloth, y % 4 === 0 ? ink : light, 0.15));
  rect(gx + 2, 30, 2, 2, mix(cloth, ink, 0.2));
  rect(gx + 6, 30, 2, 2, mix(cloth, ink, 0.2));
  rect(40, 28, 16, 12, mix(stone, ink, 0.45));
  rect(42, 30, 12, 8, mix(light, stone, 0.1));
  for (let y = 31; y < 37; y += 2) rect(43, y, 10, 1, mix(ink, light, 0.5));
  const body = mix(ink, fill, 0.45), head = mix(light, stone, 0.4), you = mix(cloth, ink, 0.45), officer = mix(ink, cloth, 0.15);
  const walk = ease(t / 1600);
  const crowd = (xs: number[]) => xs.forEach((x, i) => person(ctx, x, GROUND + 8 + (i % 2), 14, body, head));
  if (!ending || ending === "news") {
    person(ctx, 58, GROUND + 6, 16, officer, head);
    rect(56, GROUND - 13, 2, 4, officer);
    crowd([28, 36, 70, 78, 84]);
    person(ctx, 20, GROUND + 9, 14, you, head);
  } else if (ending === "rushed") {
    for (let x = 0; x < EMBLEM_W; x += 2) {
      const y = 22 + Math.round(5 * Math.sin((x / EMBLEM_W) * Math.PI));
      px(x, y, mix(stone, ink, 0.4));
      if (x % 8 === 0) rect(x, y + 1, 2, 3, x % 16 ? mix(cloth, light, 0.4) : mix(stone, light, 0.5));
    }
    crowd([32, 40, 52, 62, 70]);
    person(ctx, 46, GROUND + 9, 14, you, head);
  } else if (ending === "hushed") {
    rect(18, 40, 5, 10, mix(cloth, light, 0.55));
    flame(ctx, 26, 36, Math.floor(t / 180) % 3);
    person(ctx, 30, GROUND + 6, 14, you, head);
    person(ctx, 38, GROUND + 6, 14, body, head);
  } else if (ending === "reported") {
    person(ctx, 60, GROUND + 7, 16, officer, head);
    person(ctx, 44, GROUND + 8, 14, you, head);
  } else if (ending === "gate" || ending === "turned" || ending === "sheltered") {
    person(ctx, gx - 6, GROUND + 4, 16, officer, head);
    rect(gx - 3, GROUND - 16, 1, 20, mix(stone, light, 0.4));
    if (ending === "gate") {
      person(ctx, gx + 9, 44, 7, body, head);
      person(ctx, gx + 13, 44, 5, body, head);
    }
    if (ending === "sheltered") {
      rect(gx + 32, GROUND - 10, 18, 12, mix(stone, ink, 0.3));
      for (let i = 0; i < 10; i++) rect(gx + 30 + i, GROUND - 10 - Math.min(i, 9 - i), 22 - i * 2, 1, mix(stone, ink, 0.5));
      rect(gx + 38, GROUND - 4, 5, 6, mix(cloth, light, 0.5));
    }
    person(ctx, 64, GROUND + 9, 14, you, head);
  } else if (ending === "helped") {
    const k = walk;
    person(ctx, Math.round(80 + 30 * k), Math.round(GROUND + 9 - 8 * k), Math.round(14 - 5 * k), you, head);
    person(ctx, Math.round(88 + 26 * k), Math.round(GROUND + 9 - 9 * k), Math.round(14 - 5 * k), body, head);
  } else if (ending === "left") {
    const x = Math.round(60 + 44 * walk), y = Math.round(GROUND + 8 - 6 * walk);
    rect(x, y - 6, 12, 5, mix(stone, ink, 0.2));
    rect(x + 1, y - 9, 10, 3, mix(cloth, light, 0.3));
    rect(x + 2, y - 1, 3, 3, mix(ink, stone, 0.3));
    rect(x + 8, y - 1, 3, 3, mix(ink, stone, 0.3));
    person(ctx, x - 6, y + 1, 12, you, head);
  } else if (ending === "mourned") person(ctx, 46, GROUND + 9, 14, you, head);
  fadeEdges(ctx, pal.ink);
}
