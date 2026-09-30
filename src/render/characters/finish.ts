import { lightKey } from "./v2/pixels";

const lum = (d: Uint8ClampedArray, i: number) =>
  0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];

/** Renderer E's pass over the body before the head goes on, so it can fold
 * every lone pixel into its neighbours without touching an eye or a mouth. */
export function finishBody(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = ctx.canvas;
  const image = ctx.getImageData(0, 0, w, h),
    d = image.data;
  const solid = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] >= 128;
  const same = (s: Uint8ClampedArray, i: number, j: number) =>
    s[i] === s[j] && s[i + 1] === s[j + 1] && s[i + 2] === s[j + 2];
  for (let pass = 0; pass < 2; pass++) {
    const src = new Uint8ClampedArray(d);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (src[i + 3] < 128) continue;
        const around: number[] = [];
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]])
          if (solid(x + dx, y + dy)) around.push(((y + dy) * w + x + dx) * 4);
        if (around.length < 3 || around.some((j) => same(src, i, j))) continue;
        let best = -1,
          votes = 0;
        for (const j of around) {
          const n = around.filter((k) => same(src, k, j)).length;
          if (n > votes) [best, votes] = [j, n];
        }
        if (votes < 2) continue;
        d[i] = src[best];
        d[i + 1] = src[best + 1];
        d[i + 2] = src[best + 2];
      }
  }
  // Value carries a sprite at this size: spread the lights and mid-tones and
  // lift saturation a little. Darks are left alone, or dark hair and cloth
  // sink into the outline.
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 128) continue;
    const l = lum(d, i);
    const shift = l < 70 ? 0 : (l - 118) * 0.22 * Math.min(1, (l - 70) / 30);
    for (let c = 0; c < 3; c++) d[i + c] = l + (d[i + c] - l) * 1.15 + shift;
  }
  ctx.putImageData(image, 0, 0);
}

/** Renderer E's edge: a dark, hued line drawn in place of the figure's own
 * outer pixels. It is the outline, so `outlineCharacter` must not follow it. */
export function finishCharacter(ctx: CanvasRenderingContext2D) {
  const { width: w, height: h } = ctx.canvas;
  const image = ctx.getImageData(0, 0, w, h),
    d = image.data;

  // The edge is redrawn in place rather than ringed outside, so the
  // silhouette keeps its size and the line stays one pixel.
  const src = new Uint8ClampedArray(d),
    key = lightKey();
  const open = (x: number, y: number) =>
    x < 0 || y < 0 || x >= w || y >= h || src[(y * w + x) * 4 + 3] < 128;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (src[i + 3] < 128) continue;
      const below = open(x, y + 1), side = open(x + key, y) || open(x - key, y);
      if (!below && !side && !open(x, y - 1)) continue;
      // A one-pixel limb or strand would vanish into its own line.
      if (open(x - 1, y) && open(x + 1, y) && !below) continue;
      if (lum(src, i) < 50) continue;
      // Hue kept, value dropped below every interior tone; the top and lit
      // side softer, so the figure does not read as a sticker.
      const litEdge = !below && !open(x + key, y) && !open(x, y + 1);
      const [k, t] = litEdge ? [0.55, 0.15] : [0.32, 0.3];
      d[i] = src[i] * k + 0x24 * t;
      d[i + 1] = src[i + 1] * k + 0x16 * t;
      d[i + 2] = src[i + 2] * k + 0x30 * t;
    }
  ctx.putImageData(image, 0, 0);
}
