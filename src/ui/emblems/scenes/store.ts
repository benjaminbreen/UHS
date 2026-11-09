import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, glow, mix, pen, person, rgb, type Pal } from "../kit";

/** The store: a plank door ajar at night, the sacks inside, someone leaving with one. */
export default function store(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), lamp = rgb(pal.accent);
  const f = Math.floor(t / 120) % 3;
  const lit = ending === "hearing" || ending === "short" || ending === "named" || ending === "caught";
  const morning = ending === "spared" || ending === "settled" || ending === "confessed";
  const shut = morning || ending === "kept" || ending === "silent" || ending === "gone";
  const crowd = ending === "named" || ending === "caught";
  const DX = 68, DW = 26, TOP = 24, FOOT = 52;
  const sky = morning ? [mix(fill, light, 0.25), mix(lamp, light, 0.45)] : [mix(ink, fill, 0.4), mix(fill, light, 0.12)];
  const wall = morning ? [mix(wood, lamp, 0.15), mix(wood, lamp, 0.35), mix(wood, lamp, 0.45)] : [mix(wood, ink, 0.6), mix(wood, ink, 0.4), mix(wood, lamp, 0.55)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y), g = lit ? glow(x, y, DX + 13, 40, 62, 40, f) : 0;
      if (y < 12) px(x, y, sky[y / 12 + (b - 0.5) * 0.4 > 0.6 ? 1 : 0]);
      else if (y < FOOT) px(x, y, (x - 18) % 9 === 0 ? mix(wood, ink, morning ? 0.4 : 0.75) : wall[Math.max(g, (x + y * 0.3) / 160 > b + 0.35 ? 1 : 0)]);
      else px(x, y, g === 2 ? mix(fill, lamp, 0.35) : mix(fill, morning ? light : ink, morning ? 0.15 : 0.25 - (y - FOOT) * 0.01));
    }
  rect(0, 10, EMBLEM_W, 3, mix(wood, ink, 0.8));
  rect(0, 13, EMBLEM_W, 1, mix(wood, light, morning ? 0.4 : 0.1));
  // The doorway, and the sacks stacked inside it.
  rect(DX - 2, TOP - 2, DW + 4, 2, mix(wood, ink, 0.8));
  rect(DX, TOP, DW, FOOT - TOP, lit ? mix(ink, lamp, 0.25) : pal.ink);
  const sack = (x: number, foot: number) => {
    const c = lit ? [mix(lamp, light, 0.35), mix(lamp, wood, 0.4)] : [mix(wood, light, 0.12), mix(wood, ink, 0.45)];
    rect(x + 1, foot - 9, 8, 9, c[0]);
    rect(x, foot - 7, 10, 6, c[0]);
    rect(x + 6, foot - 9, 3, 9, c[1]);
    rect(x + 3, foot - 11, 4, 2, c[1]);
  };
  for (const [x, y] of [[DX + 2, FOOT], [DX + 13, FOOT], [DX + 7, FOOT - 9]]) sack(x, y);
  // The gap where one sack is missing, left open to the dark.
  if (!lit && !morning) rect(DX + 18, FOOT - 18, 7, 9, pal.ink);
  const open = shut ? 0 : 1 - (ending ? 0 : 0.4 * (1 - ease(t / 1200)));
  if (open < 1) {
    const w = Math.round(DW * (1 - open));
    rect(DX, TOP, w, FOOT - TOP, mix(wood, ink, morning ? 0.25 : 0.1));
    for (let x = DX + 4; x < DX + w; x += 6) rect(x, TOP, 1, FOOT - TOP, mix(wood, ink, 0.5));
    if (shut) rect(DX - 3, 36, DW + 6, 2, mix(wood, ink, 0.6));
  }
  if (open) rect(DX - 6, TOP + 1, 6, FOOT - TOP - 1, mix(wood, ink, 0.2));
  const dark = mix(ink, fill, 0.3), head = mix(ink, wood, 0.5);
  if (!ending || ending === "decide") {
    // Slipping away along the wall, the sack on a shoulder.
    const x = Math.round(118 + 14 * ease(t / 1600));
    sack(x + 3, FOOT - 13);
    person(ctx, x, FOOT + 4, 20, dark, head);
  }
  if (ending === "why") {
    person(ctx, 42, FOOT + 3, 18, mix(lamp, ink, 0.3), head);
    rect(56, FOOT - 6, 8, 9, dark);
    rect(58, FOOT - 12, 4, 4, head);
  }
  if (lit) {
    // Someone stands in the doorway with the lamp, counting.
    person(ctx, DX - 16, FOOT + 4, 20, mix(light, wood, 0.4), mix(light, wood, 0.6));
    rect(DX - 8, 34, 3, 4, mix(lamp, light, 0.5 + f * 0.1));
  }
  if (crowd)
    for (let i = 0; i < 9; i++) {
      const x = 4 + i * 18 + (i % 2) * 4, h = 6 + (i % 3);
      rect(x, EMBLEM_H - h, 10, h, pal.ink);
      rect(x + 2, EMBLEM_H - h - 4, 6, 5, pal.ink);
    }
  if (ending === "kept" || ending === "silent")
    for (let i = 0; i < 6; i++) px(110 + i * 6, FOOT + 2 + (i % 2), mix(wood, light, 0.35));
  fadeEdges(ctx, pal.ink);
}
