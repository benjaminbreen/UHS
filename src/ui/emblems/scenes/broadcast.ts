import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, hash, mix, pen, person, rgb, type Pal } from "../kit";

/** One television in a crowded front room, its blue light on the backs of heads; then the street outside. */
export default function broadcast(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), screen = rgb(pal.accent);
  if (ending === "celebrated") return street(ctx, pal, t);
  const off = ending === "home";
  const flicker = off ? 0 : (Math.floor(t / 140) % 4 === 1 ? 0.08 : 0) + (ending === "after" ? 0.12 * (1 - ease((t % 1400) / 500)) : 0);
  // The room lit only by the set: a pool of blue that falls off into the dark.
  const tx = 80, ty = 26;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const d = Math.hypot((x - tx) / 70, (y - ty) / 34) - flicker;
      const b = bayer(x, y);
      const lit = off ? 0 : d < 0.45 ? 2 : d < 0.7 ? ((0.7 - d) / 0.25 > b ? 2 : 1) : d < 1 && (1 - d) / 0.3 > b ? 1 : 0;
      px(x, y, lit === 2 ? mix(fill, screen, 0.22) : lit === 1 ? mix(ink, fill, 0.7) : mix(ink, fill, 0.35));
    }
  // The window behind, with the night outside, and the moon when you've gone in to bed.
  rect(16, 8, 22, 18, mix(wood, ink, 0.4));
  rect(18, 10, 18, 14, mix(ink, fill, 0.15));
  rect(26, 10, 1, 14, mix(wood, ink, 0.4));
  rect(18, 16, 18, 1, mix(wood, ink, 0.4));
  if (off) {
    rect(30, 11, 4, 4, mix(light, screen, 0.15));
    px(30, 11, mix(ink, fill, 0.15));
  }
  // The set on its legs, the screen alive with grey light.
  rect(tx - 13, ty - 9, 26, 20, mix(wood, ink, 0.25));
  rect(tx - 13, ty - 9, 26, 1, mix(wood, light, 0.25));
  rect(tx - 10, ty - 6, 18, 14, off ? mix(ink, fill, 0.5) : mix(screen, light, 0.35 + flicker));
  if (!off)
    for (let y = ty - 6; y < ty + 8; y++)
      for (let x = tx - 10; x < tx + 8; x++) if (hash(x * 31 + y * 7 + Math.floor(t / 120)) > 0.86) px(x, y, mix(screen, light, 0.7));
  rect(tx + 10, ty - 5, 2, 2, mix(wood, light, 0.4));
  rect(tx + 10, ty - 1, 2, 2, mix(wood, light, 0.4));
  rect(tx - 10, ty + 11, 2, 8, mix(wood, ink, 0.4));
  rect(tx + 8, ty + 11, 2, 8, mix(wood, ink, 0.4));
  // The neighbours from behind, in rows, the nearest ones biggest; one child sits on the floor right up close.
  // Round heads on sloping shoulders, rimmed with the screen's light where it catches them.
  const viewer = (x: number, y: number, r: number, body: string, rim: string) => {
    for (let dy = -r; dy <= EMBLEM_H - y; dy++)
      for (let dx = -r - 6; dx <= r + 6; dx++) {
        const headPx = dy <= r && Math.hypot(dx, dy) <= r + 0.3;
        const shoulder = dy > r - 1 && Math.abs(dx) <= r + 1 + Math.min(5, (dy - r + 1) * 1.5);
        if (!headPx && !shoulder) continue;
        const top = headPx && dy < 0 && Math.hypot(dx, dy) > r - 0.8;
        px(x + dx, y + dy, top ? rim : body);
      }
  };
  const back = mix(ink, fill, 0.12), rim = mix(fill, screen, 0.55);
  const row = (xs: number[], y: number, r: number) => xs.forEach((x, i) =>
    viewer(x, y - (ending === "after" && hash(i + y) > 0.4 ? Math.round(2 * Math.abs(Math.sin(t / 180 + i))) : 0), r, back, rim));
  if (off) person(ctx, 40, 50, 16, mix(screen, ink, 0.5), mix(light, wood, 0.5));
  else {
    viewer(tx - 2, 46, 2, mix(screen, ink, 0.45), mix(screen, light, 0.3));
    row([48, 64, 98, 114], 44, 3);
    row([34, 56, 78, 104, 126], 54, 4);
  }
  fadeEdges(ctx, pal.ink);
}

/** Out in the street afterwards: flags, paper and everyone at once. */
function street(ctx: CanvasRenderingContext2D, pal: Pal, t: number) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), screen = rgb(pal.accent);
  const GROUND = 52;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++)
      px(x, y, y >= GROUND ? mix(ink, wood, 0.25) : mix(ink, fill, y < 20 + (bayer(x, y) - 0.5) * 6 ? 0.4 : 0.7));
  for (const [x, w, h] of [[0, 30, 30], [32, 24, 36], [58, 30, 28], [90, 26, 34], [118, 42, 30]] as const) {
    rect(x, GROUND - h, w, h, mix(ink, wood, 0.45));
    for (let wy = GROUND - h + 4; wy < GROUND - 6; wy += 7)
      for (let wx = x + 3; wx < x + w - 4; wx += 6) rect(wx, wy, 3, 4, mix(screen, light, 0.5));
  }
  // Flags waving from the crowd, and paper coming down.
  const wave = Math.floor(t / 220) % 2;
  for (const [i, x] of [24, 52, 86, 110, 138].entries()) {
    rect(x, GROUND - 14, 1, 10, mix(light, ink, 0.4));
    rect(x + 1, GROUND - 14 + (i + wave) % 2, 6, 4, i % 2 ? mix(screen, light, 0.2) : mix(light, wood, 0.15));
  }
  for (let i = 0; i < 40; i++) {
    const p = (t / 2600 + hash(i)) % 1;
    const x = Math.floor(hash(i + 11) * EMBLEM_W) + Math.round(Math.sin(p * 9 + i) * 2), y = Math.floor(p * GROUND);
    px(x, y, hash(i + 5) > 0.5 ? mix(screen, light, 0.3) : pal.light);
  }
  const body = mix(fill, light, 0.25), head = mix(light, wood, 0.5);
  for (let i = 0; i < 22; i++) {
    const x = 6 + i * 7 + Math.round(hash(i) * 3), jump = hash(i + 30) > 0.6 ? Math.round(2 * Math.abs(Math.sin(t / 200 + i))) : 0;
    person(ctx, x, GROUND + 9 + (i % 3) - jump, 12 + (i % 2), i === 10 ? mix(screen, ink, 0.45) : body, head);
  }
  fadeEdges(ctx, pal.ink);
}
