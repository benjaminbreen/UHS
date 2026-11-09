import type { PlotLook } from "../../content/plots/types";

export const EMBLEM_W = 160;
export const EMBLEM_H = 64;

export type RGB = [number, number, number];
export const rgb = (hex: string): RGB => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
export const mix = (a: RGB, b: RGB, t: number) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
// 4x4 ordered dither: the pixel-art way to grade one colour into another.
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : 1 - (1 - t) ** 3);

export type Pal = PlotLook["palette"];
export const pen = (ctx: CanvasRenderingContext2D) => {
  const rect = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, w, h);
  };
  return { rect, px: (x: number, y: number, c: string) => rect(x, y, 1, 1, c) };
};
export const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];
// The slate's lamplight as a level: 2 lit, 1 the dithered rim, 0 dark.
export const glow = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, f = 0) => {
  const d = Math.hypot((x - cx) / rx, (y - cy) / ry) - f * 0.01, b = bayer(x, y);
  return d < 0.42 ? 2 : d < 0.62 ? ((0.62 - d) / 0.2 > b ? 2 : 1) : d < 0.92 && (0.92 - d) / 0.3 > b ? 1 : 0;
};
export function fadeEdges(ctx: CanvasRenderingContext2D, ink: string) {
  const { px } = pen(ctx);
  for (let y = 0; y < EMBLEM_H; y++)
    for (let x = 0; x < EMBLEM_W; x++) {
      const edge = Math.min(x, EMBLEM_W - 1 - x) / 18;
      if (edge < 1 && bayer(x, y) > edge) px(x, y, ink);
    }
}
export function flame(ctx: CanvasRenderingContext2D, x: number, y: number, f: number) {
  const { rect } = pen(ctx);
  const lean = f === 1 ? 1 : f === 2 ? -1 : 0;
  rect(x + lean, y - (f === 2 ? 1 : 0), 3, 4 + (f === 2 ? 1 : 0), "#e8853a");
  rect(x + 1 + lean, y + 1, 1, 3, "#f8dc7a");
}
export function person(ctx: CanvasRenderingContext2D, x: number, foot: number, h: number, body: string, head: string) {
  const { rect } = pen(ctx);
  const w = Math.max(1, Math.round(h / 3)), hd = Math.max(1, Math.round(h / 5)), leg = Math.max(1, Math.round(h / 5));
  rect(x + ((w - hd) >> 1), foot - h, hd, hd, head);
  rect(x, foot - h + hd, w, h - hd - leg, body);
  if (w >= 3) {
    rect(x, foot - leg, 1, leg, body);
    rect(x + w - 1, foot - leg, 1, leg, body);
  } else rect(x, foot - leg, w, leg, body);
}
export function sealAt(ctx: CanvasRenderingContext2D, pal: Pal, cx: number, cy: number) {
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

