import type { PlotLook } from "../content/plots/types";

export const EMBLEM_W = 160;
export const EMBLEM_H = 64;

type RGB = [number, number, number];
const rgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(",")})`;
const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// 4x4 ordered dither: the pixel-art way to grade one colour into another.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);

/** One frame of a plot's emblem at native pixels; `t` is ms since the card opened. */
export function drawEmblem(
  ctx: CanvasRenderingContext2D,
  look: PlotLook,
  t: number,
  o: { marks: number; ending?: string },
) {
  if (look.emblem === "slate") slate(ctx, look.palette, t, o);
  else dawn(ctx, look.palette, t);
}

/** A life with no plot: first light over the hills, and a lit window. */
function dawn(ctx: CanvasRenderingContext2D, pal: PlotLook["palette"], t: number) {
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), glow = rgb(pal.accent);
  const px = (x: number, y: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  };
  const rise = ease(t / 1600);
  const sunX = 54, sunY = Math.round(46 - 9 * rise);
  const ridge = (x: number) => 41 + Math.round(3 * Math.sin(x / 13) + 1.6 * Math.sin(x / 5.3));
  const ground = (x: number) => 50 + Math.round(2.5 * Math.sin(x / 21 + 1));
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = BAYER[(y % 4) * 4 + (x % 4)];
      if (y >= ground(x)) {
        px(x, y, mix(ink, wood, y === ground(x) ? 0.32 : 0.18));
        continue;
      }
      if (y >= ridge(x)) {
        px(x, y, mix(ink, fill, 0.55));
        continue;
      }
      // Sky in hard bands, dithered at each edge: dark above, warm at the hills.
      const h = y / 44 + (b - 0.5) * 0.18;
      const d = Math.hypot(x - sunX, (y - sunY) * 1.4);
      const warm = Math.max(0, 1 - d / 46) * rise;
      const sky = h < 0.35 ? mix(ink, fill, 0.2) : h < 0.6 ? mix(ink, fill, 0.6) : h < 0.82 ? mix(fill, glow, 0.18) : mix(fill, glow, 0.38);
      px(x, y, warm > 0.55 + b * 0.3 ? mix(fill, glow, 0.55) : sky);
      if (d < 6.5 && y < ridge(x)) px(x, y, d < 5 ? mix(light, glow, 0.25) : mix(glow, fill, 0.2));
    }
  // A few stars still out where the sky is dark.
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(hash(i) * EMBLEM_W), y = Math.floor(hash(i + 50) * 16);
    if (Math.hypot(x - sunX, y - sunY) > 30 && hash(i + 7) > rise * 0.6) px(x, y, mix(ink, light, 0.55));
  }
  // The house, its roof, and the one window already lit.
  const hx = 112, hy = ground(hx) - 7;
  ctx.fillStyle = mix(ink, wood, 0.55);
  ctx.fillRect(hx, hy, 12, 7);
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = mix(ink, wood, 0.35);
    ctx.fillRect(hx - 1 + i, hy - 1 - i, 14 - i * 2, 1);
  }
  ctx.fillStyle = mix(ink, wood, 0.15);
  ctx.fillRect(hx + 2, hy + 3, 2, 4);
  ctx.fillStyle = Math.floor(t / 900) % 7 === 3 ? mix(glow, light, 0.2) : mix(glow, light, 0.45);
  ctx.fillRect(hx + 7, hy + 2, 2, 2);
  // Dithered away to the wall colour at both ends, as the slate's candlelight is.
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const edge = Math.min(x, EMBLEM_W - 1 - x) / 18;
      if (edge < 1 && BAYER[(y % 4) * 4 + (x % 4)] > edge) px(x, y, pal.ink);
    }
}

function slate(
  ctx: CanvasRenderingContext2D,
  pal: PlotLook["palette"],
  t: number,
  { marks, ending }: { marks: number; ending?: string },
) {
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), chalk = rgb(pal.light), seal = rgb(pal.accent);
  const px = (x: number, y: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 1, 1);
  };
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  // The wall, lit by the candle: a warm pool, a dithered rim, then dark.
  const warm = mix(ink, wood, 0.42), dim = mix(ink, wood, 0.2);
  const flicker = Math.floor(t / 110) % 3;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const d = Math.hypot((x - 58) / 74, (y - 36) / 36) - flicker * 0.01;
      const b = BAYER[(y % 4) * 4 + (x % 4)];
      px(x, y, d < 0.42 ? warm : d < 0.62 ? (0.62 - d) / 0.2 > b ? warm : dim : d < 0.92 && (0.92 - d) / 0.3 > b ? dim : pal.ink);
    }
  // The candle on its shelf, which is where the light comes from.
  rect(16, 50, 20, 2, mix(wood, chalk, 0.15));
  rect(16, 52, 20, 1, mix(wood, ink, 0.5));
  rect(30, 53, 2, 4, mix(wood, ink, 0.4));
  rect(22, 48, 9, 2, mix(chalk, ink, 0.45));
  rect(24, 40, 5, 8, mix(chalk, wood, 0.12));
  rect(28, 40, 1, 8, mix(chalk, wood, 0.35));
  px(26, 39, pal.ink);
  const lean = flicker === 1 ? 1 : flicker === 2 ? -1 : 0;
  rect(25 + lean, 35 - (flicker === 2 ? 1 : 0), 3, 4 + (flicker === 2 ? 1 : 0), "#e8853a");
  rect(26 + lean, 36, 1, 3, "#f8dc7a");
  const X = 44, Y = 14, W = 72, H = 42;
  // The nail and the cord it hangs by.
  rect(79, 3, 2, 2, mix(chalk, ink, 0.4));
  for (let i = 0; i <= 10; i++) {
    px(Math.round(80 - i * 3.4), 5 + i, mix(wood, chalk, 0.2));
    px(Math.round(80 + i * 3.4), 5 + i, mix(wood, chalk, 0.2));
  }
  rect(X, Y, W, H, mix(wood, ink, 0.1));
  rect(X, Y, W, 1, mix(wood, chalk, 0.35));
  rect(X, Y, 1, H, mix(wood, chalk, 0.25));
  rect(X, Y + H - 1, W, 1, mix(wood, ink, 0.55));
  rect(X + W - 1, Y, 1, H, mix(wood, ink, 0.45));
  const sx = X + 3, sy = Y + 3, sw = W - 6, sh = H - 6;
  const board = mix(fill, chalk, 0.06);
  rect(sx, sy, sw, sh, board);
  for (let i = 0; i < 46; i++)
    px(sx + Math.floor(hash(i) * sw), sy + Math.floor(hash(i + 99) * sh), mix(fill, chalk, 0.13));

  // The tally, a stroke at a time: four uprights and the fifth across them.
  const ended = !!ending;
  const strokeAt = (i: number) => (ended ? -1 : 350 + i * 260);
  const at: { x: number; y: number }[] = [];
  const rows = Math.ceil(Math.ceil(marks / 5) / 2);
  for (let i = 0, gx = sx + 5, gy = sy + Math.round((sh - rows * 15 + 4) / 2); i < marks; i++) {
    const inGroup = i % 5;
    if (inGroup === 0 && i) gx += 22;
    if (gx > sx + sw - 18) {
      gx = sx + 5;
      gy += 15;
    }
    at.push({ x: inGroup === 4 ? gx : gx + inGroup * 4, y: gy });
  }
  // A sleeve takes off whole strokes: all of them when paid, half when seized.
  const half = marks < 5 ? Math.floor(marks / 2) : Math.min(marks - 1, Math.max(5, Math.round(marks / 10) * 5));
  const wiped = Math.round((ending === "paid" ? marks : ending === "seized" ? half : 0) * ease((t - 500) / 900));
  const faded = ending === "fled" ? 0.45 : 1;
  at.forEach((m, i) => {
    const grown = ease((t - strokeAt(i)) / 140);
    // Wiped: what a sleeve leaves, a few swirled streaks of dust.
    if (i < wiped) {
      for (let k = 0; k < 3; k++)
        for (let x = m.x - 2; x < m.x + (i % 5 === 4 ? 16 : 4); x++)
          if ((x + k + i) % 4) px(x, m.y + 2 + k * 3 + Math.round(Math.sin((x + i * 3 + k) / 2.4)), mix(fill, chalk, 0.17));
      return;
    }
    if (grown <= 0) return;
    const c = mix(fill, chalk, 0.9 * faded);
    if (i % 5 === 4) {
      for (let k = 0; k <= 17 * grown; k++) {
        const x = m.x - 2 + k, y = m.y + 9 - Math.round(k * 0.45);
        px(x, y, c);
      }
    } else
      for (let k = 0; k < 11 * grown; k++) {
        // A hand-drawn stroke leans a pixel over its lower half.
        const x = m.x + (k > 6 && i % 2 ? 1 : 0);
        px(x, m.y + k, c);
      }
    // Chalk dust off each fresh stroke.
    const since = t - strokeAt(i) - 140;
    if (!ended && since > 0 && since < 700)
      for (let d = 0; d < 2; d++)
        px(m.x + d * 2 - 1, m.y + 11 - Math.round(since / 90) - d, mix(fill, chalk, 0.6 * (1 - since / 700)));
  });
  // The chalk on the ledge, or on the floor if you left it.
  if (ending === "fled") rect(118, 60, 5, 2, mix(chalk, ink, 0.2));
  else rect(X + 8, Y + H, 6, 2, mix(chalk, ink, 0.1));

  if (ending === "denounced") {
    const drop = ease((t - 450) / 380);
    const cx = 104, cy = Math.round(-10 + (Y + H - 12 + 10) * drop);
    for (let y = -6; y <= 6; y++)
      for (let x = -6; x <= 6; x++) {
        const r = Math.hypot(x, y);
        if (r > 6.2) continue;
        px(cx + x, cy + y, r > 5 ? mix(seal, ink, 0.45) : r < 2.5 && x < 0 && y < 0 ? mix(seal, chalk, 0.35) : mix(seal, ink, 0.05));
      }
    rect(cx - 3, cy + 6, 2, 5, mix(seal, ink, 0.3));
    rect(cx + 1, cy + 6, 2, 4, mix(seal, ink, 0.3));
  }
}
