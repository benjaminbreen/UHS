import { lightingPreset, type LightingId } from "../lighting";
/** The cast anchors at the feet and runs one way. Its length is the body's
 * height times the preset's vector; this trims that to the reach the presets
 * were tuned against, when the silhouette also straddled the feet. */
const CAST = 0.8;
/** Native-grid projection of the composed pose, including clothing and held objects.
 * Alpha uses max coverage so overlapping body pixels never darken the cast. */
export function characterShadow(source: HTMLCanvasElement, phase: LightingId) {
  const canvas = document.createElement("canvas");
  canvas.width = 160;
  canvas.height = 96;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  const data = ctx.createImageData(160, 96);
  const pixels = source.getContext("2d")!.getImageData(0, 0, 80, 80).data;
  const light = lightingPreset(phase),
    [vx, vy] = light.cast;
  const mark = (x: number, y: number, alpha: number) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= 160 || y < 0 || y >= 96) return;
    const i = (y * 160 + x) * 4;
    data.data[i] = 39;
    data.data[i + 1] = 42;
    data.data[i + 2] = 33;
    data.data[i + 3] = Math.max(data.data[i + 3], alpha);
  };
  for (let y = 0; y < 80; y++)
    for (let x = 0; x < 80; x++) {
      if (!pixels[(y * 80 + x) * 4 + 3]) continue;
      if (light.opacity) {
        const px = 80 + (x - 40) + (79 - y) * vx * CAST;
        const py = 32 + (79 - y) * vy * CAST;
        for (let dx = 0; dx < 2; dx++)
          for (let dy = 0; dy < 2; dy++)
            mark(px + dx, py + dy, Math.round(light.opacity * 255));
      }
      if (y >= 78)
        for (let dx = -2; dx <= 2; dx++) {
          mark(80 + x - 40 + dx, 31, 60);
          mark(80 + x - 40 + dx, 32, 150);
          mark(80 + x - 40 + dx, 33, 110);
          mark(80 + x - 40 + dx, 34, 60);
        }
    }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

/** The same projection for a sprite of any size, cropped to what it marked.
 * `feet` is the lowest body row. `origin` places the feet, as a fraction of
 * the canvas. */
export function spriteShadow(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  feet: number,
  phase: LightingId,
  contact = true,
) {
  const light = lightingPreset(phase),
    [vx, vy] = light.cast;
  const R = Math.ceil(w / 2 + h * Math.abs(vx) * CAST + 6),
    V = Math.ceil(w / 2 + h * Math.abs(vy) * CAST + 6);
  const W = R * 2,
    H = V * 2;
  const data = new Uint8ClampedArray(W * H * 4);
  let x0 = W,
    y0 = H,
    x1 = -1,
    y1 = -1;
  const mark = (x: number, y: number, alpha: number) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= W || y < 0 || y >= H) return;
    const i = (y * W + x) * 4;
    data[i] = 39;
    data[i + 1] = 42;
    data[i + 2] = 33;
    data[i + 3] = Math.max(data[i + 3], alpha);
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  };
  for (let y = 0; y <= feet; y++)
    for (let x = 0; x < w; x++) {
      if (!pixels[(y * w + x) * 4 + 3]) continue;
      if (light.opacity) {
        const px = R + (x - w / 2) + (feet - y) * vx * CAST;
        const py = V + (feet - y) * vy * CAST;
        for (let dx = 0; dx < 2; dx++)
          for (let dy = 0; dy < 2; dy++)
            mark(px + dx, py + dy, Math.round(light.opacity * 255));
      }
      if (contact && y >= feet - 1)
        for (let dx = -1; dx <= 1; dx++) {
          mark(R + x - w / 2 + dx, V - 1, 60);
          mark(R + x - w / 2 + dx, V, 150);
          mark(R + x - w / 2 + dx, V + 1, 90);
        }
    }
  const canvas = document.createElement("canvas");
  if (x1 < 0) {
    canvas.width = canvas.height = 1;
    return { canvas, origin: [0.5, 0.5] as const };
  }
  canvas.width = x1 - x0 + 1;
  canvas.height = y1 - y0 + 1;
  const whole = new ImageData(data, W, H);
  canvas.getContext("2d")!.putImageData(whole, -x0, -y0);
  return {
    canvas,
    origin: [(R - x0) / canvas.width, (V - y0) / canvas.height] as const,
  };
}
