import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The find: a spade in turned earth, and something old glinting in the bottom of the hole. */
export default function dig(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), earth = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const HY = 20, hx = 80, hy = 46;
  const filled = ending === "buried" || ending === "bury" || ending === "kept";
  const empty = ["handed", "confessed", "caught", "piece", "counted", "short", "returned"].includes(ending ?? "");
  const sky = [mix(fill, light, 0.45), mix(fill, light, 0.65), mix(gold, light, 0.55)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) px(x, y, sky[Math.min(2, Math.floor(y / 8 + (b - 0.5) * 0.4))]);
      else if (y < HY + 3) px(x, y, mix(ink, fill, 0.6));
      else {
        const row = Math.floor(Math.sqrt(y - HY) * 3.2);
        px(x, y, row % 2 ? mix(fill, earth, 0.45) : mix(fill, earth, 0.6));
      }
    }
  for (let x = 0; x < EMBLEM_W; x++) {
    const h = Math.round(2 + 1.5 * Math.sin(x / 7) + Math.sin(x / 3.1));
    rect(x, HY - h, 1, h, mix(ink, fill, 0.6));
  }
  // The hole and its spoil heap, or the same ground filled in, darker where it was turned.
  for (let y = hy - 10; y < hy + 10; y++)
    for (let x = hx - 24; x < hx + 34; x++) {
      const d = Math.hypot((x - hx) / 18, (y - hy) / 7);
      const heap = Math.hypot((x - hx - 22) / 11, (y - hy + 4) / 5);
      if (filled) {
        if (d < 1 && (d < 0.8 || bayer(x, y) < 0.5)) px(x, y, mix(ink, earth, 0.45));
      } else if (d < 1) px(x, y, d > 0.86 && y < hy ? mix(earth, light, 0.2) : y < hy - 2 ? mix(ink, earth, 0.3) : mix(ink, fill, 0.5));
      else if (heap < 1) px(x, y, heap < 0.5 ? mix(earth, light, 0.25) : mix(earth, light, 0.1));
    }
  // The pot, tipped in the earth, coins at its lip; it glints as the card opens.
  if (!filled && !empty) {
    rect(hx - 8, hy - 1, 11, 7, mix(earth, gold, 0.3));
    rect(hx - 7, hy - 2, 9, 1, mix(earth, gold, 0.5));
    rect(hx - 8, hy + 4, 11, 2, mix(earth, ink, 0.3));
    rect(hx + 3, hy, 2, 4, mix(ink, earth, 0.4));
    for (const [dx, dy] of [[5, 3], [7, 4], [6, 5], [9, 4], [8, 2], [11, 5]]) rect(hx + dx, hy + dy, 2, 1, mix(gold, light, 0.35));
    const glint = t < 2000 ? Math.floor(t / 250) % 2 === 0 : Math.floor(t / 1800) % 3 === 0;
    if (glint) {
      px(hx + 6, hy + 1, pal.light);
      for (const [dx, dy] of [[0, -2], [0, 4], [-3, 1], [3, 1]]) px(hx + 6 + Math.sign(dx), hy + 1 + Math.sign(dy) * (Math.abs(dy) > 2 ? 2 : 1), mix(gold, light, 0.6));
    }
  }
  // The spade, upright in the spoil.
  for (let y = 22; y < 40; y++) px(110 - Math.floor((y - 22) / 6), y, mix(earth, light, 0.45));
  rect(108, 21, 5, 1, mix(earth, light, 0.45));
  rect(105, 39, 5, 5, mix(light, fill, 0.45));
  rect(105, 39, 5, 1, mix(light, fill, 0.2));
  const body = mix(ink, fill, 0.35), head = mix(light, earth, 0.45), you = mix(gold, ink, 0.4), patron = mix(fill, light, 0.25);
  const walk = ease(t / 1600);
  const kneel = !ending || ending === "glint" || ending === "noticed" || ending === "out";
  if (kneel) {
    rect(52, 41, 7, 8, you);
    rect(54, 37, 4, 4, head);
    rect(58, 43, 8, 2, you);
    rect(51, 49, 10, 3, mix(gold, ink, 0.55));
  } else person(ctx, ending === "handed" ? Math.round(52 - 16 * walk) : 52, 60, 18, you, head);
  if (ending === "noticed") person(ctx, 128, HY, 9, body, head);
  if (["handed", "confessed", "caught", "counted", "short", "returned"].includes(ending ?? "")) {
    const px0 = ending === "handed" ? Math.round(62 - 16 * walk) : 118;
    person(ctx, px0, 60, 18, patron, head);
    rect(px0 - 1, 46, 8, 5, mix(earth, gold, 0.3));
  }
  if (ending === "confessed" || ending === "counted" || ending === "returned") person(ctx, 130, 60, 17, body, head);
  if (ending === "caught" || ending === "short") for (const x of [130, 138]) person(ctx, x, 59, 16, body, head);
  if (ending === "kept" || ending === "piece" || ending === "counted") px(58, 50, mix(gold, light, Math.floor(t / 900) % 2 ? 0.5 : 0.2));
  if (ending === "out") for (const x of [118, 126, 134]) person(ctx, x, 58, 16, body, head);
  fadeEdges(ctx, pal.ink);
}
