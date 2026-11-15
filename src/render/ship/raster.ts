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
