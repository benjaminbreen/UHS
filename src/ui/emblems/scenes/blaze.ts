import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, sealAt, type Pal } from "../kit";

/** The morning after a fire: your house whole, the neighbour's wall burnt open, smoke still rising. */
export default function blaze(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), ember = rgb(pal.accent);
  const rebuilt = ending === "rebuilt" ? ease((t - 300) / 900) : 0;
  const smoke = ending === "rebuilt" ? 0 : ending === "cleared" || ending === "heard" || ending === "traced" || ending === "dropped" ? 0.45 : 1;
  const lean = ending === "cleared" || ending === "heard" || ending === "traced" ? 1 : -0.6;
  const sky = [mix(ink, fill, 0.55), mix(fill, ember, 0.12), mix(fill, ember, 0.3), mix(fill, light, 0.35)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < 48) {
        const h = y / 48 + (b - 0.5) * 0.22;
        px(x, y, sky[h < 0.35 ? 0 : h < 0.62 ? 1 : h < 0.85 ? 2 : 3]);
      } else px(x, y, y === 48 ? mix(wood, light, 0.15) : mix(fill, wood, 0.3 + (b < 0.25 ? 0.08 : 0)));
    }
  // Smoke from the burnt gap, rising and drifting.
  const tq = Math.floor(t / 120) * 120;
  for (let i = 0; i < 26; i++) {
    const k = ((tq / 5200 + i / 26) % 1), r = 2 + k * 9;
    const cx = 121 + lean * k * k * 46 + Math.sin(i * 2.1) * 3, cy = 40 - k * 44;
    for (let y = Math.floor(cy - r); y <= cy + r; y++)
      for (let x = Math.floor(cx - r); x <= cx + r; x++)
        if (y >= 0 && y < 48 && Math.hypot(x - cx, y - cy) < r && bayer(x, y) < smoke * (0.75 - k * 0.6)) px(x, y, mix(fill, light, 0.28 - k * 0.12));
  }
  // Your house, whole: thatch seen from above, wall square on, a lit window.
  rect(10, 18, 54, 12, mix(wood, light, 0.22));
  for (let x = 10; x < 64; x += 3) rect(x, 18 + (x % 2), 1, 11, mix(wood, ink, 0.15));
  rect(10, 29, 54, 1, mix(wood, ink, 0.55));
  rect(12, 30, 50, 18, mix(wood, light, 0.42));
  rect(12, 30, 50, 1, mix(wood, ink, 0.35));
  rect(22, 35, 10, 13, mix(ink, wood, 0.35));
  rect(44, 35, 8, 6, mix(ember, light, 0.4));
  rect(47, 35, 1, 6, mix(wood, ink, 0.4));
  // The neighbour's house: the thatch burnt away over the gap, the posts charred.
  rect(92, 18, 60, 12, mix(wood, light, 0.22));
  for (let x = 92; x < 152; x += 3) rect(x, 18 + (x % 2), 1, 11, mix(wood, ink, 0.15));
  rect(92, 29, 60, 1, mix(wood, ink, 0.55));
  rect(94, 30, 56, 18, mix(wood, light, 0.42));
  rect(98, 35, 7, 6, mix(ink, wood, 0.3));
  const char = mix(ink, wood, 0.12);
  for (let x = 106; x < 136; x++) {
    const rim = 18 + Math.round(4 * Math.abs(Math.sin(x * 0.6)));
    for (let y = rim; y < 30; y++) px(x, y, y === rim ? char : sky[y < 24 ? 1 : 2]);
    const top = 31 + Math.round(5 * Math.abs(Math.sin(x * 0.7)) + 3 * Math.sin(x * 0.23));
    for (let y = 30; y < 48; y++) px(x, y, y < top ? sky[2] : (x + y) % 9 ? char : mix(ink, ember, 0.25));
    if (rebuilt) for (let y = 30; y < 30 + 18 * rebuilt; y++) if (x % 5 === 0 || y === 30 || y === 39) px(x, y, mix(wood, light, 0.6));
  }
  for (const x of [112, 124]) rect(x, 24, 2, 24, char);
  for (const [x, y, d] of [[107, 21, 1], [133, 21, -1]])
    for (let k = 0; k < 9; k++) px(x + d * k, y + Math.round(k * 0.4), char);
  if (rebuilt) {
    rect(104, 22, 34, 2, mix(wood, light, 0.6));
    for (let y = 26; y < 48; y += 3) rect(138, y, 6, 1, mix(wood, light, 0.5));
    rect(138, 24, 1, 24, mix(wood, light, 0.5));
    rect(143, 24, 1, 24, mix(wood, light, 0.5));
  } else {
    const f = Math.floor(t / 130);
    for (let i = 0; i < 9; i++) {
      const on = (f + i * 3) % 5;
      if (on && smoke === 1) px(108 + i * 3, 46 - (i % 3), on > 2 ? mix(ember, light, 0.35) : pal.accent);
      else if (on > 3) px(108 + i * 3, 47, mix(ember, ink, 0.3));
    }
  }
  if (ending === "traced") {
    const blink = Math.floor(t / 300) % 2;
    for (let a = 0; a < 16; a++) px(Math.round(148 + 6 * Math.cos(a / 2.5)), Math.round(55 + 3 * Math.sin(a / 2.5)), blink ? mix(ember, light, 0.4) : pal.accent);
    rect(147, 54, 2, 2, mix(ember, ink, 0.2));
  }
  // The neighbour in the lane, pointing at your door, then letting the arm fall.
  if (ending !== "dropped" && ending !== "rebuilt") {
    const body = mix(light, wood, 0.45), down = ending && ending !== "answer" ? ease((t - 300) / 600) : 0;
    const fx = 86 - Math.round(4 * ease(t / 500));
    person(ctx, fx, 58, 17, body, mix(light, wood, 0.4));
    for (let k = 0; k <= 7; k++) px(fx - k, 45 + Math.round(k * (0.15 + 1.1 * down)), k === 7 ? mix(light, wood, 0.4) : body);
  }
  if (ending === "repaid")
    [[64, 54], [70, 50], [76, 53]].forEach(([x, y], i) => {
      const c = ease((t - 400 - i * 150) / 500);
      if (c > 0) rect(Math.round(x + 6 * c), y - Math.round(3 * Math.sin(Math.PI * c)), 2, 2, mix(ember, light, 0.45));
    });
  if (ending === "judged" || ending === "absent") sealAt(ctx, pal, 37, Math.round(-10 + 34 * ease((t - 450) / 380)));
  fadeEdges(ctx, pal.ink);
}
