import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The quake: a street at dawn, your cracked house and a neighbour's fallen in, dust over the rubble. */
export default function quake(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), earth = rgb(pal.edge), light = rgb(pal.light), dawn = rgb(pal.accent);
  const GROUND = 50;
  const sky = [mix(fill, dawn, 0.2), mix(fill, dawn, 0.55), mix(dawn, light, 0.3)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < GROUND) px(x, y, sky[Math.min(2, Math.max(0, Math.floor(y / 14 - 0.3 + (b - 0.5) * 0.5)))]);
      else px(x, y, y === GROUND ? mix(earth, light, 0.2) : mix(ink, earth, y > 56 && b > 0.5 ? 0.5 : 0.6));
    }
  // The town behind, a roof or two knocked crooked.
  const far = mix(fill, dawn, 0.4);
  for (const [x, w, h, tilt] of [[0, 16, 10, 0], [50, 14, 9, 0.2], [64, 10, 11, 0], [74, 8, 8, -0.25], [134, 26, 11, 0.15]])
    for (let i = 0; i < w; i++) rect(x + i, GROUND - h + Math.round(i * tilt), 1, h - Math.round(i * tilt), far);
  const wall = mix(earth, light, 0.35), shade = mix(earth, ink, 0.25), roof = mix(ink, earth, 0.35);
  const mine = ending === "saved";
  // Your house: standing, a crack from eaves to sill; in the saved ending its end wall is down.
  const w = mine ? 22 : 32;
  rect(16, 30, w, 20, wall);
  rect(16, 30, 2, 20, shade);
  rect(14, 24, w + 4, 6, roof);
  rect(14, 29, w + 4, 1, mix(ink, earth, 0.55));
  rect(22, 40, 6, 10, pal.ink);
  rect(32, 36, 5, 4, mix(dawn, light, 0.3));
  if (!mine) for (let y = 30, x = 42; y < 46; y++) px((x += (y % 3 ? 0 : y % 6 ? 1 : -1)), y, pal.ink);
  else {
    for (let i = 0; i < 7; i++) rect(38 + i * 2, 42 + (i % 3) * 2, 3, 8 - (i % 3) * 2, i % 2 ? wall : shade);
    for (let i = 0; i < 3; i++) rect(56 + i * 6, 44, 5, 6, mix(earth, light, 0.15));
  }
  // The neighbour's house: the front still up, the back fallen in, the roof slid down over the rubble.
  rect(84, 32, 18, 18, wall);
  rect(102, 36, 6, 14, wall);
  rect(108, 42, 4, 8, wall);
  rect(88, 40, 6, 10, pal.ink);
  for (let i = 0; i < 46; i++) rect(82 + i, 26 + Math.round(i * 0.36), 1, 4, roof);
  for (let i = 0; i < 12; i++) rect(104 + ((i * 7) % 30), 44 + ((i * 5) % 6), 4, 6 - ((i * 5) % 6), i % 3 ? wall : shade);
  const beam = mix(earth, ink, 0.4);
  for (let i = 0; i < 18; i++) rect(112 + i, 38 + Math.round(i * 0.4), 1, 2, beam);
  // Dust off the rubble, thinning as it settles.
  const out = ending === "dug" || ending === "late" || ending === "fetched";
  const settle = out || mine || ending === "passed" ? 0.35 : 1 - 0.4 * ease(t / 2000);
  for (let y = 14; y < GROUND; y++)
    for (let x = 92; x < 152; x++) {
      const d = Math.hypot((x - 122) / 24, (y - 38) / 18) + (y < 30 ? (30 - y) / 30 : 0);
      if (bayer(x, y) < settle * (0.85 - d)) px(x, y, mix(earth, light, 0.55));
    }
  const body = mix(ink, fill, 0.3), head = mix(light, earth, 0.4), you = mix(ink, dawn, 0.25);
    const saved = mix(light, earth, 0.2);
  if (ending === "dug" || ending === "late") {
    person(ctx, 70, GROUND, 13, body, head);
    person(ctx, 62, GROUND, 13, you, head);
    if (ending === "dug") person(ctx, 76, GROUND, 8, saved, head);
    else rect(75, GROUND - 2, 9, 2, saved);
  } else if (ending === "fetched") {
    for (const x of [100, 106, 118, 132, 138]) person(ctx, x, GROUND, 13, x === 106 ? you : body, head);
    for (let i = 0; i < 44; i++) px(98 + i, 41 - Math.round(i * 0.1), mix(earth, light, 0.5));
  } else {
    person(ctx, 118, GROUND, 13, body, head);
    person(ctx, mine ? 66 : 54, GROUND, 13, you, head);
  }
  fadeEdges(ctx, pal.ink);
}
