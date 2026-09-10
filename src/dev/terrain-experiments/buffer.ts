import { rgb } from "./palette";

/** Tiny RGBA scratch surface. Both renderers work a pixel at a time, which is
 * the only way to get scalloped edges and strata that ignore the tile grid. */
export class Buffer {
  data: Uint8ClampedArray<ArrayBuffer>;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.data = new Uint8ClampedArray(new ArrayBuffer(width * height * 4));
  }
  set(x: number, y: number, colour: [number, number, number], alpha = 255) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    if (alpha >= 255) {
      this.data[i] = colour[0];
      this.data[i + 1] = colour[1];
      this.data[i + 2] = colour[2];
      this.data[i + 3] = 255;
      return;
    }
    const t = alpha / 255;
    this.data[i] += (colour[0] - this.data[i]) * t;
    this.data[i + 1] += (colour[1] - this.data[i + 1]) * t;
    this.data[i + 2] += (colour[2] - this.data[i + 2]) * t;
    this.data[i + 3] = 255;
  }
  darken(x: number, y: number, amount: number) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    const i = (y * this.width + x) * 4;
    if (!this.data[i + 3]) return;
    this.data[i] *= 1 - amount;
    this.data[i + 1] *= 1 - amount;
    this.data[i + 2] *= 1 - amount;
  }
  toImageData() {
    return new ImageData(this.data, this.width, this.height);
  }
}

export const ramp = (hexes: string[]) => hexes.map(rgb);
