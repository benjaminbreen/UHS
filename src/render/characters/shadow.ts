import { lightingPreset, type LightingId } from "../lighting";
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
  const length = Math.hypot(vx, vy);
  // The cast is pulled back by half a body so it straddles the feet: every
  // preset points down-screen, and anchoring at the feet left the whole
  // silhouette pooled in front of them, reading as a figure in mid-air.
  const HALF = 16;
  const ux = length ? (vy / length) * 0.75 : 1;
  const uy = length ? (-vx / length) * 0.75 : 0;
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
        const px = 80 + (x - 40) * ux + (79 - y) * vx - HALF * vx;
        const py = 32 + (x - 40) * uy + (79 - y) * vy - HALF * vy;
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
