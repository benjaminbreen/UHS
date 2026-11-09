import { EMBLEM_H, EMBLEM_W, bayer, ease, fadeEdges, mix, pen, person, rgb, type Pal } from "../kit";

/** The shore: a whale stranded on a grey beach, surf behind it, and the first people down with knives. */
export default function shore(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), sea = rgb(pal.fill), sand = rgb(pal.edge), light = rgb(pal.light), foam = rgb(pal.accent);
  const SEA = 20, BEACH = 34, wave = Math.floor(t / 180);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < SEA) px(x, y, y / SEA + (b - 0.5) * 0.4 < 0.55 ? mix(sea, light, 0.45) : mix(sea, light, 0.6));
      else if (y < BEACH) {
        const crest = (y - SEA) % 5 === 4 && (x + wave * (y % 2 ? 1 : -1) + y * 11) % 26 < 14;
        px(x, y, crest ? mix(foam, light, 0.5) : mix(ink, sea, 0.75 + (y - SEA) * 0.012));
      } else if (y < BEACH + 2) px(x, y, (x + wave) % 9 < 6 ? mix(foam, light, 0.6) : mix(sand, sea, 0.4));
      else px(x, y, mix(sand, light, y < 44 && b < 0.5 ? 0.12 : 0.22));
    }
  rect(0, SEA, EMBLEM_W, 1, mix(ink, sea, 0.5));
  const skin = mix(ink, sea, 0.45), belly = mix(sea, light, 0.55), flesh = mix(sand, ink, 0.3), bone = mix(light, sand, 0.2);
  if (ending === "missed") {
    for (let i = 0; i < 9; i++) {
      const x = 58 + i * 7;
      for (let y = 0; y < 10 - Math.abs(i - 4); y++) px(x + (y > 4 ? 1 : 0), 47 - y, bone);
    }
    rect(56, 47, 64, 1, bone);
  } else {
    // A sperm whale on its side: the blunt head, the long back, the flukes flat on the sand.
    const top = (x: number) => x < 70 ? 33 : Math.round(33 + ((x - 70) / 44) ** 1.6 * 12);
    const cut = ending === "shared" ? [74, 100] : ending === "cut" || ending === "caught" ? [80, 92] : [0, 0];
    for (let x = 46; x < 114; x++) {
      const y0 = top(x) + (x < 49 ? 49 - x : 0);
      rect(x, y0, 1, 49 - y0, skin);
      px(x, y0, mix(sea, light, 0.3));
      if (x > 52 && x < 100 && (x & 3) === 0) rect(x, 46, 1, 3, belly);
      if (x >= cut[0] && x < cut[1]) {
        rect(x, y0 + 1, 1, 46 - y0, flesh);
        px(x, y0 + 1, mix(sand, light, 0.75));
      }
    }
    for (let i = 0; i < 8; i++) {
      rect(113 + i, 45 - i, 1, 1 + (i >> 1), skin);
      rect(113 + i, 47 + (i >> 2), 1, 1 + (i >> 1), skin);
    }
    rect(50, 38, 2, 1, pal.ink);
  }
  for (const [gx, gy, f] of [[30, 8, 0], [44, 5, 1], [138, 10, 0]]) {
    const up = (Math.floor(Math.min(t, 2000) / 300) + f) % 2;
    px(gx, gy + up, pal.light); px(gx + 1, gy + 1, pal.light); px(gx + 2, gy + up, pal.light);
  }
  const body = mix(ink, sand, 0.3), head = mix(light, sand, 0.45), you = mix(foam, ink, 0.45), knife = mix(light, foam, 0.3);
  const cutter = (x: number, c: string) => {
    person(ctx, x, 52, 12, c, head);
    px(x + 4, 43, knife);
  };
  const walk = ease(t / 1400);
  if (ending === "shared") for (const x of [60, 68, 104, 112, 124]) person(ctx, x, 53 + (x % 3), 12, body, head);
  if (ending === "cut") {
    cutter(30, body);
    cutter(22, you);
    rect(10, 50, 16, 3, mix(sand, ink, 0.3));
    rect(12, 47, 10, 3, flesh);
  } else if (ending === "caught") {
    cutter(66, body);
    cutter(74, you);
    person(ctx, Math.round(150 - 14 * walk), 54, 13, mix(sea, ink, 0.2), head);
  } else if (ending !== "missed") {
    cutter(66, body);
    if (ending !== "shared") person(ctx, Math.round(20 + 14 * walk), 58, 13, you, head);
    else cutter(84, you);
  }
  fadeEdges(ctx, pal.ink);
}
