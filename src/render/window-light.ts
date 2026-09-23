import type Phaser from "phaser";

/** A lamp-lit copy of a building's window panes, found in its own art: the
 * painters leave glass dark blue or teal in a lighter frame. Undefined when
 * the art shows no glass. */
export function windowGlow(
  scene: Phaser.Scene,
  texture: string,
  frame: string,
  door?: number[],
) {
  const key = `window-glow:${frame}`;
  if (scene.textures.exists(key)) return key;
  if (misses.has(key)) return undefined;
  const f = scene.textures.getFrame(texture, frame);
  if (!f) return undefined;
  const w = f.cutWidth,
    h = f.cutHeight;
  const read = document.createElement("canvas");
  read.width = w;
  read.height = h;
  const rctx = read.getContext("2d", { willReadFrequently: true })!;
  rctx.drawImage(
    f.source.image as CanvasImageSource,
    f.cutX,
    f.cutY,
    w,
    h,
    0,
    0,
    w,
    h,
  );
  const px = rctx.getImageData(0, 0, w, h).data;
  const lum = (i: number) => (px[i * 4] + px[i * 4 + 1] + px[i * 4 + 2]) / 3;
  const glass = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (door && x >= door[0] && x < door[0] + door[2] && y >= door[1]) continue;
      const [r, g, b, a] = [px[i * 4], px[i * 4 + 1], px[i * 4 + 2], px[i * 4 + 3]];
      if (a > 200 && Math.max(g, b) > r + 12 && lum(i) < 100) glass[i] = 1;
    }
  const out = new Uint8Array(w * h);
  const seen = new Uint8Array(w * h);
  let found = 0;
  for (let s = 0; s < glass.length; s++) {
    if (!glass[s] || seen[s]) continue;
    const pane: number[] = [];
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      pane.push(i);
      const x = i % w;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w])
        if (n >= 0 && n < glass.length && glass[n] && !seen[n]) {
          seen[n] = 1;
          stack.push(n);
        }
    }
    // A pane is small and framed in something lighter; slate and shadow
    // are neither.
    if (pane.length < 3 || pane.length > 48) continue;
    const rows = new Set(pane.map((i) => Math.floor(i / w)));
    if (rows.size < 2) continue;
    let ring = 0,
      light = 0;
    for (const i of pane) {
      const x = i % w;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (n < 0 || n >= glass.length || glass[n]) continue;
        ring++;
        if (px[n * 4 + 3] > 200 && lum(n) > 100) light++;
      }
    }
    if (light / ring <= 0.4) continue;
    for (const i of pane) out[i] = 1;
    found++;
  }
  if (!found) {
    misses.add(key);
    return undefined;
  }
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  const image = ctx.createImageData(w, h);
  for (let i = 0; i < out.length; i++) {
    if (!out[i]) continue;
    // Brighter at the sill, where the lamp sits below the sash.
    const low = out[i + w] ? 0 : 1;
    image.data.set(low ? [255, 214, 130, 255] : [255, 176, 84, 235], i * 4);
  }
  ctx.putImageData(image, 0, 0);
  tex.refresh();
  return key;
}
const misses = new Set<string>();
