/** A small pixel canvas: paint into a buffer, then put it once. */
export class Raster {
  readonly data: Uint8ClampedArray<ArrayBuffer>;
  private cache = new Map<string, number[]>();
  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  private rgba(col: string) {
    let c = this.cache.get(col);
    if (!c) {
      const n = parseInt(col.slice(1, 7), 16);
      c = [(n >> 16) & 255, (n >> 8) & 255, n & 255, col.length > 7 ? parseInt(col.slice(7, 9), 16) : 255];
      this.cache.set(col, c);
    }
    return c;
  }
  set(x: number, y: number, col: string | undefined) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (!col || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b, a] = this.rgba(col), i = (y * this.w + x) * 4;
    if (a === 255) {
      this.data[i] = r;
      this.data[i + 1] = g;
      this.data[i + 2] = b;
      this.data[i + 3] = 255;
      return;
    }
    const k = a / 255, o = this.data[i + 3] / 255, out = k + o * (1 - k);
    if (!out) return;
    for (const [j, v] of [r, g, b].entries()) this.data[i + j] = (v * k + this.data[i + j] * o * (1 - k)) / out;
    this.data[i + 3] = out * 255;
  }
  fill(x: number, y: number, w: number, h: number, col: string | undefined) {
    for (let j = Math.floor(y); j < Math.floor(y) + h; j++) for (let i = Math.floor(x); i < Math.floor(x) + w; i++) this.set(i, j, col);
  }
  has(x: number, y: number) {
    x = Math.floor(x);
    y = Math.floor(y);
    return x >= 0 && y >= 0 && x < this.w && y < this.h && this.data[(y * this.w + x) * 4 + 3] > 0;
  }
  /** Darken what is already painted, by a share. */
  shade(x: number, y: number, by: number, tint: readonly [number, number, number] = [40, 30, 60]) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    if (!this.data[i + 3]) return;
    for (let j = 0; j < 3; j++) this.data[i + j] = this.data[i + j] * (1 - by) + tint[j] * by;
  }
  /** Stardew's edge: a lit rim inside the top of the silhouette, and outside it
   * a line in a deep, violet-leaning shade of what it touches, never black.
   * Pixels fainter than `solid` alpha (cast shadows) neither take nor give an edge. */
  finish(solid = 200) {
    const { w, h, data: d } = this, src = new Uint8ClampedArray(d);
    const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] >= solid;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (on(x, y)) {
        if (!on(x, y - 1)) for (let k = 0; k < 3; k++) d[i + k] = d[i + k] + (255 - d[i + k]) * 0.22;
        continue;
      }
      for (const [dx, dy, k] of [[0, 1, 0.5], [1, 0, 0.45], [-1, 0, 0.4], [0, -1, 0.36]] as const) {
        if (!on(x + dx, y + dy)) continue;
        const j = ((y + dy) * w + x + dx) * 4;
        d[i] = Math.max(16, src[j] * k * 0.7 + 52 * 0.3);
        d[i + 1] = Math.max(14, src[j + 1] * k * 0.7 + 34 * 0.3);
        d[i + 2] = Math.max(22, src[j + 2] * k * 0.7 + 70 * 0.3);
        d[i + 3] = 255;
        break;
      }
    }
    return this;
  }
  /** A soft shadow on the ground under a thing: an ellipse of see-through dark. */
  shadow(cx: number, cy: number, rx: number, ry: number, alpha = 0.3) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const t = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
      if (t > 1) continue;
      const a = Math.round(alpha * (t > 0.6 ? 0.6 : 1) * 255).toString(16).padStart(2, "0");
      this.set(x, y, `#28204a${a}`);
    }
  }
  put(ctx: CanvasRenderingContext2D, x = 0, y = 0) {
    ctx.putImageData(new ImageData(this.data, this.w, this.h), x, y);
  }
  canvas() {
    const c = document.createElement("canvas");
    c.width = this.w;
    c.height = this.h;
    this.put(c.getContext("2d")!);
    return c;
  }
}

export const h2 = (x: number, y: number, s = 0) => {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 2246822519)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) & 0xffff) / 65536;
};
