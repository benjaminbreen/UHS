export type Point = [number, number];
export type Ramp = {
  /** Outline on the lit side: a tinted step down from base, not a black keyline. */
  edge: string;
  /** Outline on the shaded side. */
  shadowEdge?: string;
  shade: string;
  base: string;
  light: string;
};
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
/** Five steps instead of "flat field plus black keyline": the lit outline sits
 * close enough to the base that the silhouette opens up, and every shadow is
 * pulled toward one cool tone so unrelated materials read as one painting. */
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
  const cool = material === "skin" ? "#3c1f33" : "#241c38";
  const warm = material === "skin" ? "#ffe2b4" : "#ffe6ad";
  return {
    base,
    // Darkest value in the material, and the only one allowed to approach black.
    shadowEdge: mix(scale(material === "skin" ? 0.36 : 0.34), cool, 0.42),
    // Lit-side contour. Kept well above the old 0.37 so figures stop reading
    // as stickers cut out against the ground.
    edge: mix(scale(material === "hair" ? 0.62 : 0.58), cool, 0.26),
    shade: mix(scale(0.74), cool, 0.16),
    // Hair takes a much smaller step: a big move toward cream turns black hair
    // grey, and the automatic rim pass applies it along every strand.
    light: mix(base, warm, material === "hair" ? 0.16 : 0.34),
  };
}
/** Raster shapes have exactly one boundary pixel, measured on the native grid.
 * Shared masks join limb segments before outlining, so elbows never accumulate borders. */
export class Pixels {
  constructor(private ctx: CanvasRenderingContext2D) {}
  /** True while the canvas is mirrored. The light stays at screen upper-left,
   * so the shaded side has to move to local +x rather than travelling with the sprite. */
  flip = false;
  /** Automatic interior rim and core shading. Worth it on the torso and limbs;
   * switched off for the head, which is almost entirely boundary at this size
   * and comes out crumpled if every pixel takes a rim or a core value. */
  modeling = true;
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
    const lit = this.flip ? 1 : -1;
    const has = (x: number, y: number) => mask.has(`${x},${y}`);
    const border = (x: number, y: number) =>
      has(x, y) &&
      (!has(x - 1, y) || !has(x + 1, y) || !has(x, y - 1) || !has(x, y + 1));
    for (const key of mask) {
      const [x, y] = key.split(",").map(Number);
      if (border(x, y)) {
        // Bottom and the shaded flank take the dark contour; the lit flank
        // takes a tinted one so the outline never closes into a black ring.
        const shaded = !has(x, y + 1) || !has(x - lit, y);
        this.rect(
          x,
          y,
          1,
          1,
          shaded ? (colors.shadowEdge ?? colors.edge) : colors.edge,
        );
        continue;
      }
      if (!this.modeling) {
        this.rect(x, y, 1, 1, colors.base);
        continue;
      }
      // One pixel of rim inside the lit contour and one of shade inside the
      // dark one: form for free, on every shape, without hand-placed pixels.
      const rim = border(x, y - 1) || border(x + lit, y);
      const core = border(x, y + 1) || border(x - lit, y);
      this.rect(
        x,
        y,
        1,
        1,
        rim ? colors.light : core ? colors.shade : colors.base,
      );
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
