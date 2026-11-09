import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The contest: a ring of trodden sand, a crowd behind the rope, two squared off. */
export default function contest(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const cheer = ending === "champion" || ending === "friends" || ending === "won" || ending === "watched" || ending === "lost" || ending === "backed";
  const CX = 80, CY = 52;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), r = Math.hypot((x - CX) / 50, (y - CY) / 10);
      if (y < 30) px(x, y, mix(fill, light, 0.35 + (y / 30 + (b - 0.5) * 0.3 > 0.6 ? 0.15 : 0)));
      else if (r < 1) px(x, y, mix(wood, light, r > 0.9 ? 0.15 : 0.45 - r * 0.15 + (b > 0.8 ? 0.04 : 0)));
      else px(x, y, mix(fill, wood, 0.35 + (y - 30) * 0.01));
    }
  // Pennants on a line between two poles, stirring.
  rect(10, 4, 2, 34, mix(wood, ink, 0.3));
  rect(148, 4, 2, 34, mix(wood, ink, 0.3));
  for (let x = 12; x < 148; x++) px(x, 6 + Math.round(4 * Math.sin(((x - 12) / 136) * Math.PI)), mix(wood, ink, 0.4));
  for (let i = 0; i < 9; i++) {
    const x = 20 + i * 14, y = 7 + Math.round(4 * Math.sin(((x - 12) / 136) * Math.PI)), flap = (Math.floor(t / 200) + i) % 2;
    for (let r = 0; r < 4; r++) rect(x + (r >> 1) * flap, y + r, 5 - r, 1, i % 2 ? pal.accent : mix(light, fill, 0.2));
  }
  // The crowd behind the rope; it jumps when someone wins.
  const tones = [mix(ink, fill, 0.6), mix(ink, wood, 0.5), mix(fill, ink, 0.2)];
  for (let i = 0; i < 22; i++) {
    const x = 2 + i * 7 + (i % 3), hop = cheer && t < 2400 && (Math.floor(t / 180) + i) % 4 === 0 ? 2 : 0;
    rect(x, 32 - (i % 2) * 2 - hop, 6, 10, tones[i % 3]);
    rect(x + 1, 28 - (i % 2) * 2 - hop, 4, 4, tones[(i + 1) % 3]);
  }
  rect(0, 40, EMBLEM_W, 1, mix(light, wood, 0.3));
  const you = mix(gold, ink, 0.2), them = mix(wood, ink, 0.45), head = mix(ink, wood, 0.6);
  const stand = (x: number, c: string, arms?: boolean) => {
    person(ctx, x, CY + 4, 22, c, head);
    if (arms) {
      rect(x - 2, CY - 22, 2, 7, c);
      rect(x + 7, CY - 22, 2, 7, c);
    }
  };
  const grapple = (x: number, c: string, dir: number) => {
    rect(x, CY - 14, 7, 9, c);
    rect(x + (dir > 0 ? 5 : -2), CY - 17, 4, 4, head);
    rect(x + (dir > 0 ? 6 : -4), CY - 12, 5, 2, c);
    rect(x, CY - 5, 2, 9, c);
    rect(x + 5, CY - 5, 2, 9, c);
  };
  const lying = (x: number, c: string) => {
    rect(x, CY, 18, 4, c);
    rect(x + 18, CY - 1, 4, 4, head);
  };
  const close = ease(t / 900);
  if (!ending || ending === "bout") {
    grapple(Math.round(58 + 6 * close), you, 1);
    grapple(Math.round(96 - 6 * close), them, -1);
  } else if (ending === "enter") {
    stand(98, them);
    rect(70, CY + 3, 8, 1, mix(wood, light, 0.6));
  } else if (ending === "won" || ending === "champion") {
    lying(96, them);
    stand(72, you, true);
    if (ending === "champion") {
      rect(68, 22, 14, 3, pal.accent);
      rect(70, 21, 10, 1, mix(gold, light, 0.5));
    }
  } else if (ending === "lost") {
    lying(56, you);
    stand(94, them, true);
  } else if (ending === "friends") {
    stand(70, you);
    stand(84, them);
    rect(76, CY - 26, 10, 2, you);
    rect(78, CY - 30, 2, 4, you);
    rect(82, CY - 30, 2, 4, them);
  } else stand(80, them, true);
  if (ending === "watched" || ending === "backed" || ending === "missed" || ending === "skipped") rect(40, 26, 6, 6, you);
  fadeEdges(ctx, pal.ink);
}
