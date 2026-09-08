export type Point = [number, number];
export type Ramp = { edge: string; shade: string; base: string; light: string };
export function mix(a: string, b: string, t: number) {
  const x = parseInt(a.slice(1), 16),
    y = parseInt(b.slice(1), 16);
  return `#${[16, 8, 0]
    .map((s) =>
      Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
/** Material-specific, hue-shifted shadows. No universal black contour. */
export function ramp(
  base: string,
  material: "cloth" | "skin" | "hair" = "cloth",
): Ramp {
  const scale = (factor: number) => {
    const value = parseInt(base.slice(1), 16);
    return `#${[16, 8, 0]
      .map((shift) =>
        Math.round(((value >> shift) & 255) * factor)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}`;
  };
  return {
    base,
    // Preserve hue: green cloth gets a deep green contour, brown hair deep brown.
    edge: scale(material === "skin" ? 0.53 : material === "hair" ? 0.38 : 0.37),
    shade: scale(material === "skin" ? 0.77 : 0.69),
    light: mix(
      base,
      material === "skin" ? "#ffe0ae" : "#f5d99c",
      material === "hair" ? 0.32 : 0.22,
    ),
  };
}
/** Raster shapes have exactly one boundary pixel, measured on the native grid.
 * Shared masks join limb segments before outlining, so elbows never accumulate borders. */
export class Pixels {
  constructor(private ctx: CanvasRenderingContext2D) {}
  private groupMask?: Set<string>;
  /** Join garment pieces BEFORE computing their silhouette. Shared shoulders have no seam. */
  group(colors: Ramp, draw: () => void) {
    const outer = this.groupMask;
    this.groupMask = new Set<string>();
    draw();
    const mask = this.groupMask;
    this.groupMask = outer;
    this.paint(mask, colors);
  }
  clear(x: number, y: number, w: number, h: number) {
    this.ctx.clearRect(x, y, w, h);
  }
  rect(x: number, y: number, w: number, h: number, color: string) {
    if (w <= 0 || h <= 0) return;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.round(x),
      Math.round(y),
      Math.round(w),
      Math.round(h),
    );
  }
  line(from: Point, to: Point, color: string) {
    const n = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]));
    for (let i = 0; i <= n; i++)
      this.rect(
        from[0] + ((to[0] - from[0]) * i) / (n || 1),
        from[1] + ((to[1] - from[1]) * i) / (n || 1),
        1,
        1,
        color,
      );
  }
  private paint(mask: Set<string>, colors: Ramp) {
    if (this.groupMask) {
      for (const key of mask) this.groupMask.add(key);
      return;
    }
    for (const key of mask) {
      const [x, y] = key.split(",").map(Number);
      const border =
        !mask.has(`${x - 1},${y}`) ||
        !mask.has(`${x + 1},${y}`) ||
        !mask.has(`${x},${y - 1}`) ||
        !mask.has(`${x},${y + 1}`);
      this.rect(x, y, 1, 1, border ? colors.edge : colors.base);
    }
  }
  shape(points: Point[], colors: Ramp) {
    const mask = new Set<string>();
    const lo = Math.floor(Math.min(...points.map((p) => p[1]))),
      hi = Math.ceil(Math.max(...points.map((p) => p[1])));
    for (let y = lo; y < hi; y++) {
      const xs: number[] = [];
      const sample = y + 0.5;
      for (let i = 0; i < points.length; i++) {
        const a = points[i],
          b = points[(i + 1) % points.length];
        if (
          (a[1] <= sample && b[1] > sample) ||
          (b[1] <= sample && a[1] > sample)
        )
          xs.push(a[0] + ((sample - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.ceil(xs[i] - 0.5); x < xs[i + 1] - 0.5; x++)
          mask.add(`${x},${y}`);
    }
    this.paint(mask, colors);
  }
  /** Flat cuffs and wrists: unlike a round brush, endpoints do not grow into square caps. */
  ribbon(points: Point[], width: number, colors: Ramp) {
    this.group(colors, () => {
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i],
          b = points[i + 1],
          length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (!length) continue;
        const x = ((-(b[1] - a[1]) / length) * width) / 2,
          y = (((b[0] - a[0]) / length) * width) / 2;
        this.shape(
          [
            [a[0] + x, a[1] + y],
            [b[0] + x, b[1] + y],
            [b[0] - x, b[1] - y],
            [a[0] - x, a[1] - y],
          ],
          colors,
        );
      }
      for (const [x, y] of points.slice(1, -1))
        this.shape(
          [
            [x - 1, y - 1],
            [x + 2, y - 1],
            [x + 2, y + 2],
            [x - 1, y + 2],
          ],
          colors,
        );
    });
  }
  limb(points: Point[], width: number, colors: Ramp) {
    const mask = new Set<string>();
    const low = Math.floor((width - 1) / 2);
    for (let k = 0; k < points.length - 1; k++) {
      const a = points[k],
        b = points[k + 1],
        n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
      for (let i = 0; i <= n; i++) {
        const x = Math.round(a[0] + ((b[0] - a[0]) * i) / (n || 1)),
          y = Math.round(a[1] + ((b[1] - a[1]) * i) / (n || 1));
        for (let dx = -low; dx < width - low; dx++)
          for (let dy = -low; dy < width - low; dy++)
            mask.add(`${x + dx},${y + dy}`);
      }
    }
    this.paint(mask, colors);
  }
}
