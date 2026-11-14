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
    // A glint may cut a pane on the slant, but one side stays square to the
    // frame. A run of trim, like a felt band round a tent, slants on both;
    // a strip along an eave is far wider than any window.
    const left = new Map<number, number>(), right = new Map<number, number>();
    for (const i of pane) {
      const x = i % w, y = Math.floor(i / w);
      left.set(y, Math.min(left.get(y) ?? x, x));
      right.set(y, Math.max(right.get(y) ?? x, x));
    }
    const across = Math.max(...right.values()) - Math.min(...left.values()) + 1;
    const slant = new Set(left.values()).size >= 3 && new Set(right.values()).size >= 3 && pane.length < 0.6 * across * rows.size;
    if (slant || across > 2 * rows.size) continue;
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

/** A mask softened outward by `r` pixels: two box passes each way come out
 * close to a gaussian. */
export function blur(mask: Float32Array, W: number, H: number, r: number) {
  let a = mask;
  for (let pass = 0; pass < 4; pass++) {
    const across = pass % 2 === 0;
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        let sum = 0;
        for (let k = -r; k <= r; k++) {
          const u = across ? x + k : x,
            v = across ? y : y + k;
          if (u >= 0 && u < W && v >= 0 && v < H) sum += a[v * W + u];
        }
        out[y * W + x] = sum / (r * 2 + 1);
      }
    a = out;
  }
  return a;
}

const PAD = 8;
const halos = new Map<string, { key: string; pane: string; pad: number; pools: { x: number; w: number }[] }>();
/** The soft light round a building's lit windows, for drawing added over the
 * night: the glow layer's glass blurred out past its frames, so a window
 * shines rather than sitting there as a flat block of colour. `pane` is the
 * glass itself relit as one lamp-lit room, deep under the lintel and pale
 * toward the sill, whatever reflections the painter streaked it with. Both
 * are padded by `pad` on every side. `pools` are the
 * runs of ground-floor glass, in the frame's pixels, that throw light out
 * onto the street. */
export function windowHalo(scene: Phaser.Scene, texture: string, frame?: string) {
  const id = `${texture}:${frame ?? ""}`;
  const known = halos.get(id);
  if (known) return known;
  const f = scene.textures.getFrame(texture, frame);
  const w = f.realWidth,
    h = f.realHeight,
    W = w + PAD * 2,
    H = h + PAD * 2;
  const read = document.createElement("canvas");
  read.width = W;
  read.height = H;
  const rctx = read.getContext("2d", { willReadFrequently: true })!;
  // A trimmed frame's pixels start at its trim offset within the full size.
  rctx.drawImage(f.source.image as CanvasImageSource, f.cutX, f.cutY, f.cutWidth, f.cutHeight, f.x + PAD, f.y + PAD, f.cutWidth, f.cutHeight);
  const src = rctx.getImageData(0, 0, W, H).data;
  const lit = new Float32Array(W * H);
  for (let i = 0; i < lit.length; i++) lit[i] = src[i * 4 + 3] > 40 ? 1 : 0;
  const a = blur(lit, W, H, 3);
  const key = `window-halo:${id}`;
  const tex = scene.textures.createCanvas(key, W, H)!;
  const image = tex.getContext().createImageData(W, H);
  for (let i = 0; i < a.length; i++) {
    // Less over the glass itself, which the pane already lights.
    const v = Math.min(1, a[i] * 1.6) * (lit[i] ? 0.35 : 1);
    if (v > 0.02) image.data.set([255, 186, 108, Math.round(v * 200)], i * 4);
  }
  tex.getContext().putImageData(image, 0, 0);
  tex.refresh();
  const pane = `window-pane:${id}`;
  const glass = scene.textures.createCanvas(pane, W, H)!;
  const room = glass.getContext().createImageData(W, H);
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      if (!lit[y * W + x]) continue;
      let end = y;
      while (end + 1 < H && lit[(end + 1) * W + x]) end++;
      for (let v = y; v <= end; v++) {
        const t = end > y ? (v - y) / (end - y) : 1;
        room.data.set([226 + 29 * t, 138 + 84 * t, 58 + 88 * t, 235].map(Math.round), (v * W + x) * 4);
      }
      y = end;
    }
  glass.getContext().putImageData(room, 0, 0);
  glass.refresh();
  // Glass in the bottom storey: a shop window or a ground-floor room.
  const columns = new Uint8Array(w);
  for (let y = Math.max(0, h - 40); y < h; y++)
    for (let x = 0; x < w; x++) if (lit[(y + PAD) * W + x + PAD]) columns[x] = 1;
  const pools: { x: number; w: number }[] = [];
  for (let x = 0; x < w; x++) {
    if (!columns[x]) continue;
    let end = x;
    while (end + 1 < w && (columns[end + 1] || columns[end + 2] || columns[end + 3])) end++;
    pools.push({ x: (x + end + 1) / 2, w: end - x + 1 });
    x = end;
  }
  const made = { key, pane, pad: PAD, pools };
  halos.set(id, made);
  return made;
}
