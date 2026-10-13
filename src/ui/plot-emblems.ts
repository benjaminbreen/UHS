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
  else if (look.emblem === "dawn") dawn(ctx, look.palette, t);
  else SCENES[look.emblem](ctx, look.palette, t, o.ending);
}

/** A life with no plot: first light over the hills, and a lit window. */
function dawn(ctx: CanvasRenderingContext2D, pal: PlotLook["palette"], t: number) {
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), glow = rgb(pal.accent);
  const groundEdge = mix(ink, wood, 0.32), groundFill = mix(ink, wood, 0.18), hill = mix(ink, fill, 0.55);
  const skyBands = [mix(ink, fill, 0.2), mix(ink, fill, 0.6), mix(fill, glow, 0.18), mix(fill, glow, 0.38)];
  const warmSky = mix(fill, glow, 0.55), sun = mix(light, glow, 0.25), sunEdge = mix(glow, fill, 0.2);
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
        px(x, y, y === ground(x) ? groundEdge : groundFill);
        continue;
      }
      if (y >= ridge(x)) {
        px(x, y, hill);
        continue;
      }
      // Sky in hard bands, dithered at each edge: dark above, warm at the hills.
      const h = y / 44 + (b - 0.5) * 0.18;
      const d = Math.hypot(x - sunX, (y - sunY) * 1.4);
      const warm = Math.max(0, 1 - d / 46) * rise;
      const sky = skyBands[h < 0.35 ? 0 : h < 0.6 ? 1 : h < 0.82 ? 2 : 3];
      px(x, y, warm > 0.55 + b * 0.3 ? warmSky : sky);
      if (d < 6.5 && y < ridge(x)) px(x, y, d < 5 ? sun : sunEdge);
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
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), chalk = rgb(pal.light);
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
  const dust = mix(fill, chalk, 0.17);
  at.forEach((m, i) => {
    const grown = ease((t - strokeAt(i)) / 140);
    // Wiped: what a sleeve leaves, a few swirled streaks of dust.
    if (i < wiped) {
      for (let k = 0; k < 3; k++)
        for (let x = m.x - 2; x < m.x + (i % 5 === 4 ? 16 : 4); x++)
          if ((x + k + i) % 4) px(x, m.y + 2 + k * 3 + Math.round(Math.sin((x + i * 3 + k) / 2.4)), dust);
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
    sealAt(ctx, pal, cx, cy);
  }
}

type Pal = PlotLook["palette"];
const pen = (ctx: CanvasRenderingContext2D) => {
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  return { rect, px: (x: number, y: number, c: string) => rect(x, y, 1, 1, c) };
};
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];
// The slate's lamplight as a level: 2 lit, 1 the dithered rim, 0 dark.
const glow = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, f = 0) => {
  const d = Math.hypot((x - cx) / rx, (y - cy) / ry) - f * 0.01, b = bayer(x, y);
  return d < 0.42 ? 2 : d < 0.62 ? ((0.62 - d) / 0.2 > b ? 2 : 1) : d < 0.92 && (0.92 - d) / 0.3 > b ? 1 : 0;
};
function fadeEdges(ctx: CanvasRenderingContext2D, ink: string) {
  const { px } = pen(ctx);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const edge = Math.min(x, EMBLEM_W - 1 - x) / 18;
      if (edge < 1 && bayer(x, y) > edge) px(x, y, ink);
    }
}
function flame(ctx: CanvasRenderingContext2D, x: number, y: number, f: number) {
  const { rect } = pen(ctx);
  const lean = f === 1 ? 1 : f === 2 ? -1 : 0;
  rect(x + lean, y - (f === 2 ? 1 : 0), 3, 4 + (f === 2 ? 1 : 0), "#e8853a");
  rect(x + 1 + lean, y + 1, 1, 3, "#f8dc7a");
}
function person(ctx: CanvasRenderingContext2D, x: number, foot: number, h: number, body: string, head: string) {
  const { rect } = pen(ctx);
  const w = Math.max(1, Math.round(h / 3)), hd = Math.max(1, Math.round(h / 5)), leg = Math.max(1, Math.round(h / 5));
  rect(x + ((w - hd) >> 1), foot - h, hd, hd, head);
  rect(x, foot - h + hd, w, h - hd - leg, body);
  if (w >= 3) {
    rect(x, foot - leg, 1, leg, body);
    rect(x + w - 1, foot - leg, 1, leg, body);
  } else rect(x, foot - leg, w, leg, body);
}
function sealAt(ctx: CanvasRenderingContext2D, pal: Pal, cx: number, cy: number) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), seal = rgb(pal.accent), chalk = rgb(pal.light);
  const rim = mix(seal, ink, 0.45), shine = mix(seal, chalk, 0.35), wax = mix(seal, ink, 0.05);
  for (let y = -6; y <= 6; y++)
    for (let x = -6; x <= 6; x++) {
      const r = Math.hypot(x, y);
      if (r > 6.2) continue;
      px(cx + x, cy + y, r > 5 ? rim : r < 2.5 && x < 0 && y < 0 ? shine : wax);
    }
  rect(cx - 3, cy + 6, 2, 5, mix(seal, ink, 0.3));
  rect(cx + 1, cy + 6, 2, 4, mix(seal, ink, 0.3));
}

/** The rent: grain measured into a basket in the store-room, the door open on the field. */
function rent(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), gold = rgb(pal.accent);
  const f = Math.floor(t / 110) % 3;
  const wall = [pal.ink, mix(ink, wood, 0.2), mix(ink, wood, 0.4)];
  const floor = [mix(ink, fill, 0.5), mix(fill, wood, 0.3), mix(fill, wood, 0.55)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, (y < 50 ? wall : floor)[glow(x, y, 64, 30, 84, 42, f)]);
  rect(0, 50, EMBLEM_W, 1, mix(ink, wood, 0.5));
  // The door on the field; shut and barred on eviction.
  const shut = ending === "evicted" ? ease((t - 400) / 700) : 0;
  rect(122, 24, 18, 26, mix(wood, ink, 0.35));
  for (let y = 26; y < 50; y++)
    for (let x = 124; x < 138; x++)
      px(x, y, y + (bayer(x, y) - 0.5) * 3 < 40 ? mix(fill, light, 0.5) : mix(fill, gold, 0.5));
  for (let y = 51; y < 57; y++)
    for (let x = 118 - (y - 50) * 2; x < 140; x++)
      if (bayer(x, y) < 0.55 * (1 - shut) * (1 - (y - 50) / 7)) px(x, y, mix(fill, light, 0.3));
  const dw = Math.round(14 * shut);
  rect(124, 26, dw, 24, mix(wood, light, 0.12));
  for (let x = 127; x < 124 + dw; x += 4) rect(x, 26, 1, 24, mix(wood, ink, 0.3));
  if (shut >= 1) rect(121, 36, 20, 2, mix(wood, ink, 0.55));
  // The lamp on its shelf.
  rect(48, 20, 18, 2, mix(wood, light, 0.15));
  rect(48, 22, 18, 1, mix(wood, ink, 0.5));
  rect(53, 17, 7, 3, mix(gold, ink, 0.35));
  rect(54, 17, 5, 1, mix(gold, light, 0.2));
  flame(ctx, 59, 12, f);
  const clay = mix(wood, gold, 0.35), shade = mix(wood, ink, 0.35), hi = mix(wood, light, 0.35);
  const jar = (x: number) => {
    [5, 5, 7, 9, 10, 11, 11, 11, 10, 9, 8, 6].forEach((w, i) => {
      const lx = x + ((11 - w) >> 1), y = 38 + i;
      rect(lx, y, w, 1, clay);
      px(lx, y, i > 1 ? hi : clay);
      px(lx + w - 1, y, shade);
    });
    rect(x + 3, 37, 5, 1, shade);
  };
  // A jar on its side, mouth to us, grain fanned out across the floor.
  const tipped = (cx: number) => {
    for (let y = -5; y <= 5; y++)
      for (let x = -7; x <= 7; x++) {
        const r = Math.hypot(x / 7.5, y / 5.5);
        if (r <= 1) px(cx + x, 44 + y, y < -2 ? hi : y > 3 ? shade : clay);
      }
    for (let y = 46; y < 60; y++) {
      const k = (y - 46) / 14, half = 2 + k * 9, mx = cx - 4 - k * 3;
      for (let x = Math.floor(mx - half); x <= mx + half; x++)
        if (bayer(x, y) < 0.95 - k * 0.75 - (Math.abs(x - mx) / half) * 0.3) px(x, y, mix(gold, light, 0.15 + (bayer(x, y) < 0.2 ? 0.2 : 0)));
    }
    for (let y = -4; y <= 4; y++)
      for (let x = -4; x <= 4; x++) {
        const r = Math.hypot(x, y);
        if (r <= 4.3) px(cx - 4 + x, 44 + y, r > 2.8 ? (y < 0 ? hi : clay) : pal.ink);
      }
    for (let x = -1; x <= 1; x++) px(cx - 4 + x, 47, mix(gold, light, 0.15));
  };
  if (ending === "seized") for (const x of [20, 37, 54]) tipped(x);
  else if (ending !== "fled") for (const x of [12, 25, 38]) jar(x);
  if (ending !== "fled" && ending !== "seized")
    for (const x of [92, 106])
      [5, 7, 9, 11, 12, 12, 12, 12, 11, 10].forEach((w, i) => {
        const lx = x + ((12 - w) >> 1);
        rect(lx, 40 + i, w, 1, mix(light, wood, 0.55));
        px(lx + w - 1, 40 + i, mix(light, wood, 0.8));
        if (!i) rect(x + 5, 39, 2, 1, mix(wood, ink, 0.2));
      });
  if (ending === "fled")
    for (let i = 0; i < 7; i++) px(56 + Math.floor(hash(i) * 44), 52 + Math.floor(hash(i + 3) * 6), mix(gold, ink, 0.45));
  else {
    // The measuring basket, filled from the scoop; carried off when paid.
    const go = ending === "paid" ? ease((t - 500) / 1200) : 0;
    const bx = 70 + Math.round(go * 90), by = 50 - Math.round(Math.min(1, go * 4) * 4);
    const full = ending === "seized" ? 0 : ending ? 1 : ease((t - 300) / 1600);
    const heap = Math.round(full * 4);
    for (let r = 0; r < heap; r++) rect(bx + 1 + r * 2, by - 11 - r, 12 - r * 4, 1, mix(gold, light, 0.1 + r * 0.08));
    rect(bx - 1, by - 10, 16, 1, mix(wood, light, 0.4));
    for (let i = 0; i < 9; i++) {
      const w = 14 - Math.round((i * 4) / 8), lx = bx + ((14 - w) >> 1), y = by - 9 + i;
      rect(lx, y, w, 1, mix(wood, light, i % 2 ? 0.3 : 0.18));
      for (let k = (i >> 1) % 2; k < w; k += 3) px(lx + k, y, mix(wood, ink, 0.2));
    }
    if (!ending && full < 1) {
      rect(84, 0, 3, 12, mix(light, wood, 0.55));
      rect(76, 11, 9, 3, mix(wood, light, 0.25));
      rect(76, 14, 2, 1, mix(wood, light, 0.25));
      for (let y = 15; y < by - 11 - heap; y++)
        if ((y + Math.floor(t / 55)) % 3) px(77 + (y % 5 ? 0 : 1), y, mix(gold, light, 0.25));
    }
  }
  fadeEdges(ctx, pal.ink);
}

/** The levy: labourers with baskets and spades walking a road toward first light. */
function levy(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), sunC = rgb(pal.accent);
  const rise = ease(t / 1600), HY = 34, VX = 116;
  const sky = [mix(ink, fill, 0.6), mix(fill, sunC, 0.2), mix(fill, sunC, 0.45), mix(sunC, light, 0.2)];
  const field = [mix(ink, fill, 0.8), mix(fill, wood, 0.35)], road = mix(wood, light, 0.3), verge = mix(wood, light, 0.1);
  const sunX = 134, sunY = HY + 4 - Math.round(8 * rise);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < HY) {
        const h = y / HY + (b - 0.5) * 0.25 + (1 - rise) * 0.15 * (1 - y / HY);
        px(x, y, Math.hypot(x - sunX, y - sunY) < 5 ? mix(sunC, light, 0.55) : sky[h < 0.4 ? 0 : h < 0.65 ? 1 : h < 0.88 ? 2 : 3]);
        continue;
      }
      const k = (y - HY) / (EMBLEM_H - 1 - HY), half = 1 + k * 26, dx = Math.abs(x - (VX + (66 - VX) * k));
      px(x, y, dx < half - 1 ? road : dx < half + 1 && b < 0.6 ? verge : field[k + (b - 0.5) * 0.4 > 0.45 ? 1 : 0]);
    }
  for (let x = 0; x < 100; x++) {
    const h = Math.round(hash(x >> 2) * 3);
    if (h) rect(x, HY - h, 1, h, mix(ink, fill, 0.45));
  }
  const at = (u: number) => {
    const foot = HY + Math.round(26 * (1 - u));
    return { x: Math.round(VX + (66 - VX) * ((foot - HY) / 29)), foot, h: Math.max(2, Math.round(2 + 12 * (1 - u))) };
  };
  const leaving = ending === "commuted" || ending === "excused";
  const base = 0.04 + 0.26 * ease(t / 2000) + (leaving ? 0.8 * ease((t - 400) / 1800) : 0);
  const body = mix(ink, wood, 0.35), load = mix(wood, light, 0.35);
  const carrier = (x: number, foot: number, h: number, i: number, c: string) => {
    const w = Math.max(1, Math.round(h / 3)), bob = h >= 5 && (Math.floor(t / 220) + i) % 2 ? 1 : 0;
    person(ctx, x - (w >> 1), foot - bob, h, c, mix(ink, wood, 0.55));
    if (i % 2) rect(x - (w >> 1) - 1, foot - h - 1 - bob, w + 2, Math.max(1, Math.round(h / 6)), load);
    else {
      rect(x + w - (w >> 1), foot - h - 1 - bob, 1, Math.round(h * 0.8), load);
      if (h >= 6) rect(x + w - (w >> 1), foot - h - 2 - bob, 2, 2, mix(light, wood, 0.4));
    }
  };
  for (let i = 4; i >= 0; i--) {
    const u = base + i * 0.1;
    if (u > 0.96) continue;
    const p = at(u);
    carrier(p.x, p.foot, p.h, i, body);
  }
  // You on the verge; you fall in behind when you serve.
  const j = ending === "served" ? ease((t - 400) / 1400) : 0, end = at(base - 0.1);
  const you = { x: Math.round(24 + (end.x - 24) * j), foot: Math.round(58 + (end.foot - 58) * j), h: Math.round(12 + (end.h - 12) * j) };
  carrier(you.x, you.foot, you.h, j ? 1 : 2, mix(sunC, ink, 0.2));
  if (ending === "commuted")
    [[30, 60], [34, 61], [29, 62]].forEach(([x, y], i) => {
      if (t < 300 + i * 120) return;
      rect(x, y, 2, 1, mix(sunC, light, 0.1));
      if ((Math.floor(t / 110) + i * 3) % 8 === 0) px(x + 1, y - 1, pal.light);
    });
  fadeEdges(ctx, pal.ink);
}

/** The accusation: a lane, a neighbour pointing, whispers between doors. */
function accused(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), red = rgb(pal.accent);
  rect(0, 0, EMBLEM_W, 48, mix(fill, red, 0.18));
  for (const [x0, x1, top, k] of [[0, 52, 8, 0.45], [52, 108, 14, 0.3], [108, 160, 6, 0.45]]) {
    rect(x0, top, x1 - x0, 48 - top, mix(ink, wood, k));
    rect(x0, top, x1 - x0, 2, mix(wood, light, 0.15));
  }
  rect(14, 30, 10, 18, pal.ink);
  rect(136, 28, 10, 20, pal.ink);
  rect(74, 24, 6, 5, mix(red, light, Math.floor(t / 900) % 5 === 2 ? 0.3 : 0.45));
  rect(118, 16, 5, 5, mix(red, light, 0.35));
  rect(0, 48, EMBLEM_W, 16, mix(fill, ink, 0.1));
  rect(0, 48, EMBLEM_W, 1, mix(fill, light, 0.15));
  for (let i = 0; i < 30; i++) px(Math.floor(hash(i) * EMBLEM_W), 50 + Math.floor(hash(i + 40) * 13), mix(fill, light, 0.08));
  person(ctx, 30, 56, 18, mix(wood, light, 0.25), mix(light, wood, 0.4));
  person(ctx, 104, 56, 18, mix(light, fill, 0.45), mix(light, wood, 0.4));
  const fade = ending === "cleared" || ending === "compensated" ? ease((t - 300) / 800) : 0;
  if (ending !== "dropped") {
    const body = mix(red, ink, 0.25);
    person(ctx, 56, 56, 18, body, mix(light, wood, 0.4));
    const len = ending ? 8 : Math.round(8 * ease(t / 400)), th = -0.15 + 1.45 * fade;
    for (let k = 0; k <= len; k++) px(62 + Math.round(k * Math.cos(th)), 43 + Math.round(k * Math.sin(th)), k === len ? mix(light, wood, 0.4) : body);
    // Whispers: short marks that flicker between the three of them.
    const mark = mix(light, red, 0.35);
    for (let i = 0; i < 7; i++) {
      if (!ending && t < 500 + i * 120) continue;
      if ((Math.floor(t / 110) + i * 2) % 5 === 0) continue;
      const x = 40 + i * 9 + ((Math.floor(t / 220) + i) % 2), y = 24 + Math.round(4 * Math.sin(i * 1.7));
      const shape = [[[0, 0], [1, -1], [2, 0]], [[0, 0], [1, 0]], [[0, 0], [0, 1]]][i % 3];
      for (const [dx, dy] of shape) if (bayer(x + dx, y + dy) >= fade) px(x + dx, y + dy, mark);
    }
  }
  if (ending === "compensated") {
    const c = ease((t - 500) / 800);
    const x = Math.round(102 - 38 * c), y = Math.round(44 - 10 * Math.sin(Math.PI * c));
    rect(x, y, 2, 2, mix(light, red, 0.15));
    if (c >= 1 && Math.floor(t / 110) % 6 === 0) px(x + 1, y - 1, pal.light);
  }
  if (ending === "denounced") sealAt(ctx, pal, 132, Math.round(-10 + 40 * ease((t - 450) / 380)));
  fadeEdges(ctx, pal.ink);
}

/** The rival: two shopfronts, gossip drifting from theirs to your door. */
function rival(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), blue = rgb(pal.accent);
  rect(0, 0, EMBLEM_W, 10, mix(fill, light, 0.18));
  rect(0, 10, EMBLEM_W, 40, mix(ink, wood, 0.45));
  for (let i = 0; i < 40; i++) px(Math.floor(hash(i) * EMBLEM_W), 10 + Math.floor(hash(i + 70) * 40), mix(ink, wood, 0.55));
  rect(0, 50, EMBLEM_W, 14, mix(fill, ink, 0.2));
  rect(0, 50, EMBLEM_W, 1, mix(fill, light, 0.2));
  const sag = ending === "outdone" ? ease((t - 400) / 900) : 0;
  const shutter = ending === "gone" ? ease((t - 400) / 700) : 0;
  for (const [x0, mine] of [[14, false], [90, true]] as const) {
    const dim = mine ? sag * 0.5 : 0, shut = mine ? 0 : shutter;
    const tone = (a: RGB, b: RGB, k: number, d = 0) => mix(a.map((v, i) => v + (b[i] - v) * k) as RGB, ink, dim + d);
    rect(x0 + 23, 30, 10, 20, pal.ink);
    for (const wx of [x0 + 4, x0 + 37]) {
      rect(wx, 34, 15, 10, mix(ink, wood, 0.2));
      for (let k = 0; k < 3; k++) rect(wx + 2 + k * 5, 41, 3, 3, mine ? tone(blue, light, 0.25) : tone(wood, light, 0.3));
      rect(wx - 1, 44, 17, 2, tone(wood, light, 0.2));
      if (shut) {
        rect(wx, 34, 15, Math.round(10 * shut), mix(wood, ink, 0.2));
        rect(wx, 34 + Math.round(10 * shut) - 1, 15, 1, mix(wood, ink, 0.5));
      }
    }
    if (shut) {
      rect(x0 + 23, 30, 10, Math.round(20 * shut), mix(wood, ink, 0.1));
      for (let x = x0 + 25; x < x0 + 33; x += 3) rect(x, 30, 1, Math.round(20 * shut), mix(wood, ink, 0.4));
    }
    // The awning unrolls; yours sags and fades if you are outdone.
    const depth = Math.round(9 * ease((t - (mine ? 300 : 0)) / 600) * (1 - shut * 0.75));
    const stripes: [RGB, RGB, number][] = mine ? [[blue, light, 0.15], [light, fill, 0.2]] : [[wood, light, 0.25], [wood, ink, 0.2]];
    rect(x0 - 1, 17, 58, 1, mix(wood, ink, 0.4));
    for (let x = x0; x < x0 + 56; x++) {
      const s = ((x - x0) >> 2) % 2, drop = mine ? 3 * sag * Math.sin((Math.PI * (x - x0)) / 55) : 0;
      for (let r = 0; r < depth; r++) {
        if (r === depth - 1 && s) continue;
        px(x, 18 + r + Math.round((drop * r) / 8), tone(...stripes[s], r >= depth - 2 ? 0.3 : 0));
      }
    }
  }
  if (!ending || ending === "outdone")
    for (let i = 0; i < 4; i++) {
      if (t < 700 + i * 650) continue;
      const p = ((t - 700) / 2600 + i / 4) % 1, a = Math.sin(Math.PI * p);
      const x = Math.round(40 + p * 76), y = 30 - Math.round(18 * a);
      for (let k = 0; k < 4; k++)
        if (bayer(x + k, y) < a * 1.4) px(x + k, y + ((k + Math.floor(t / 110)) % 2), mix(light, blue, 0.3));
    }
  fadeEdges(ctx, pal.ink);
}

/** The robbery: a forced door at night, an empty chest, a lantern on its bracket. */
function robbery(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), fire = rgb(pal.accent);
  const f = Math.floor(t / 110) % 3, tq = Math.floor(t / 110) * 110;
  const lit = ending !== "gone", up = ending === "confronted" ? ease((t - 300) / 600) : 0;
  const a = (0.55 * (1 - ease(t / 1600)) + 0.12) * Math.sin(tq / 260);
  const hx = 110 + 6 * Math.sin(a), hy = 22 + 6 * Math.cos(a);
  const lx = Math.round(hx + (116 - hx) * up), ly = Math.round(hy + (24 - hy) * up);
  const wall = [mix(wood, ink, 0.55), mix(wood, fire, 0.2), mix(wood, fire, 0.6 + 0.2 * up)];
  const ground = [mix(fill, ink, 0.2), mix(fill, wood, 0.6), mix(wood, fire, 0.35 + 0.15 * up)];
  const rx = lit ? 70 + 40 * up : 0.1, ry = lit ? 44 + 16 * up : 0.1;
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const b = bayer(x, y);
      if (y < 16 || x < 40) {
        const m = Math.hypot(x - 22, y - 9);
        const h = y / 30 + (b - 0.5) * 0.3 - (m < 22 ? (22 - m) / 40 : 0);
        px(x, y, m < 5 ? (m < 4 && x - 22 + y - 9 < 2 ? pal.light : mix(light, fill, 0.25)) : h < 0.25 ? mix(fill, light, 0.28) : h < 0.55 ? mix(fill, light, 0.14) : mix(ink, fill, 0.7));
        if (y >= 54 && x < 40) px(x, y, ground[0]);
        continue;
      }
      px(x, y, (y < 54 ? wall : ground)[glow(x, y, lx + 2, ly + 4, rx, ry, lit ? f : 0)]);
    }
  for (let i = 0; i < 14; i++)
    if ((Math.floor(t / 330) + i) % 7) {
      const sx = Math.floor(hash(i) * EMBLEM_W), sy = Math.floor(hash(i + 20) * 12);
      if (Math.hypot(sx - 22, sy - 9) > 8) px(sx, sy, mix(light, fill, 0.2));
    }
  // The eaves, a dark window, and the frame of the forced door.
  rect(36, 13, 124, 3, mix(wood, ink, 0.7));
  rect(36, 16, 124, 1, mix(wood, light, 0.2));
  rect(38, 52, 2, 2, mix(wood, ink, 0.6));
  rect(40, 16, 2, 38, mix(wood, ink, 0.3));
  rect(128, 28, 16, 12, mix(wood, ink, 0.6));
  rect(130, 30, 12, 8, pal.ink);
  rect(135, 30, 2, 8, mix(wood, ink, 0.6));
  rect(70, 22, 30, 2, mix(wood, ink, 0.6));
  rect(70, 24, 3, 30, mix(wood, ink, 0.6));
  rect(97, 24, 3, 30, mix(wood, ink, 0.6));
  rect(73, 24, 24, 30, mix(ink, fill, 0.4));
  // The chest, lid thrown back, nothing in it.
  const box = mix(wood, light, 0.15), dark = mix(wood, ink, 0.5), band = mix(fire, light, 0.25);
  for (let i = 0; i < 9; i++) rect(77 + (i >> 2), 34 + i, 16 - (i >> 2), 1, i ? mix(wood, ink, 0.1) : band);
  rect(78, 36, 14, 1, band);
  rect(76, 43, 18, 3, pal.ink);
  rect(76, 43, 18, 1, band);
  rect(77, 46, 16, 8, box);
  rect(77, 48, 16, 1, band);
  rect(77, 53, 16, 1, dark);
  rect(84, 49, 2, 3, mix(fire, ink, 0.3));
  // The door leaf: swung out on its hinges, broken latch, or shut on let-go.
  const o = ending === "let-go" ? 1 - ease((t - 400) / 700) : ease(t / 900);
  const pw = Math.round(24 * (1 - o)), sw = Math.round(9 * o), leaf = mix(wood, light, 0.12);
  rect(73, 24, pw, 30, leaf);
  for (let x = 77; x < 73 + pw; x += 5) rect(x, 24, 1, 30, mix(wood, ink, 0.35));
  if (sw > 1) {
    rect(70 - sw, 25, sw, 29, mix(wood, ink, 0.15));
    rect(70 - sw, 25, 1, 29, mix(wood, ink, 0.5));
    [[100, 36], [101, 38], [100, 40], [101, 42]].forEach(([x, y]) => px(x, y, mix(wood, light, 0.5)));
  }
  if (o > 0.5) {
    rect(104, 56, 4, 2, mix(fire, light, 0.35));
    px(105, 56, pal.light);
    px(110, 58, mix(fire, light, 0.5));
  }
  // The lantern: swinging on its bracket, or held up to the dark.
  const glass = lit ? mix(fire, light, 0.45 + 0.1 * f + 0.2 * up) : mix(ink, wood, 0.3);
  if (up < 1) {
    rect(104, 20, 9, 1, mix(wood, ink, 0.6));
    rect(104, 18, 1, 5, mix(wood, ink, 0.6));
    for (let k = 0; k <= 4; k++) px(Math.round(112 + ((lx + 3 - 112) * k) / 4), Math.round(21 + ((ly - 21) * k) / 4), mix(wood, ink, 0.6));
  }
  if (up > 0) {
    const fx = Math.round(156 - 40 * up);
    person(ctx, fx, 56, 24, mix(light, fill, 0.45), mix(light, wood, 0.35));
    rect(fx + 1, ly + 7, 2, 37 - ly - 7, mix(light, fill, 0.45));
  }
  rect(lx, ly, 7, 1, mix(wood, ink, 0.5));
  rect(lx, ly + 1, 7, 6, glass);
  rect(lx + 3, ly + 1, 1, 6, mix(wood, ink, 0.4));
  rect(lx, ly + 7, 7, 1, mix(wood, ink, 0.5));
  fadeEdges(ctx, pal.ink);
}

/** The feast: a low table, bowls set one by one, a lamp, and your place. */
function feast(ctx: CanvasRenderingContext2D, pal: Pal, t: number, ending?: string) {
  const { px, rect } = pen(ctx);
  const ink = rgb(pal.ink), fill = rgb(pal.fill), wood = rgb(pal.edge), light = rgb(pal.light), amber = rgb(pal.accent);
  const f = Math.floor(t / 110) % 3, tq = Math.floor(t / 110) * 110;
  const out = ending === "gone" ? ease((t - 300) / 600) : 0;
  const wall = [pal.ink, mix(ink, wood, 0.22), mix(ink, wood, 0.45)];
  const floor = [mix(ink, fill, 0.6), mix(fill, wood, 0.3), mix(fill, wood, 0.55)];
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) px(x, y, (y < 44 ? wall : floor)[glow(x, y, 80, 34, 84 - 50 * out, 38 - 22 * out, out < 1 ? f : 0)]);
  [24, 40, 56, 96, 128].forEach((x, i) => {
    rect(x + 2, 26, 4, 4, mix(wood, light, 0.25 - (i % 2) * 0.1));
    rect(x, 30, 8, 11, mix(wood, ink, 0.15 + (i % 2) * 0.15));
  });
  rect(16, 41, 128, 2, mix(wood, light, 0.2));
  rect(16, 43, 128, 2, mix(wood, ink, 0.25));
  for (const x of [18, 78, 139]) rect(x, 45, 3, 4, mix(wood, ink, 0.45));
  rect(76, 38, 8, 3, mix(amber, ink, 0.3));
  rect(77, 38, 6, 1, mix(amber, light, 0.2));
  if (out < 1) flame(ctx, 81, 33, f);
  else if (t < 2600) px(82, 35 - Math.floor((t - 900) / 200) % 6, mix(light, ink, 0.5));
  [24, 40, 56, 96, 112, 128].forEach((x, i) => {
    const yours = i === 4;
    if (yours) rect(x - 1, 40, 10, 1, mix(wood, light, 0.35));
    if (yours && ending !== "given") return;
    const drop = yours ? ease((t - 500) / 300) : ending ? 1 : ease((t - 200 - i * 200) / 250);
    if (drop <= 0) return;
    const y = 38 - Math.round(3 * (1 - drop));
    rect(x, y, 8, 1, mix(wood, light, 0.35));
    rect(x + 1, y, 6, 1, mix(amber, light, 0.2));
    rect(x + 1, y + 1, 6, 1, mix(wood, light, 0.2));
    rect(x + 2, y + 2, 4, 1, mix(wood, ink, 0.2));
    if (drop < 1 || out) return;
    for (let s = 0; s < 2; s++) {
      const p = (tq / 1400 + hash(i * 3 + s)) % 1;
      const sx = x + 3 + s * 2 + Math.round(1.5 * Math.sin(p * 6 + i)), sy = y - 1 - Math.round(p * 14);
      if (bayer(sx, sy) > p * 1.1) px(sx, sy, mix(light, fill, 0.5));
    }
  });
  if (ending === "shamed") {
    const k = ease((t - 400) / 900);
    for (let y = 18; y < 58; y++)
      for (let x = 102; x < 126; x++) {
        const d = Math.hypot((x - 116) / 12, (y - 38) / 20);
        if (bayer(x, y) < k * (1.2 - d)) px(x, y, pal.ink);
      }
  }
  fadeEdges(ctx, pal.ink);
}

const SCENES = { rent, levy, accused, rival, robbery, feast };
