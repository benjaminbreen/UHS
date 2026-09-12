import { mix, ramp } from "../characters/pixels";

export type Pt = [number, number];

/** Six-step material ramp. `edge` is the silhouette contour, never plain black. */
export type Tones = {
  edge: string;
  deep: string;
  shade: string;
  base: string;
  light: string;
  high: string;
};

export function tones(
  base: string,
  material: "cloth" | "skin" | "hair",
): Tones {
  const r = ramp(base, material);
  return {
    edge: r.edge,
    deep: mix(r.shade, r.edge, 0.5),
    shade: r.shade,
    base,
    light: r.light,
    high: mix(r.light, material === "skin" ? "#fff0d2" : "#fbf0d0", 0.42),
  };
}

export const MAT = {
  none: 0,
  skin: 1,
  hair: 2,
  cloth: 3,
  trim: 4,
  metal: 5,
} as const;
export type Mat = (typeof MAT)[keyof typeof MAT];

export type PaintOptions = {
  /** Restrict to pixels already carrying one of these materials. */
  only?: readonly Mat[];
  /** Paint the region's own boundary pixels on a checkerboard so the edge reads soft. */
  soft?: boolean;
  /** Paint every pixel on a checkerboard. */
  dither?: boolean;
};

/**
 * Native-resolution pixel buffer with a material id and a draw-order stamp per
 * pixel. Shapes are filled without outlines; `contour` adds one boundary pixel
 * afterwards wherever a later shape meets an earlier one of another material,
 * so overlapping fills never accumulate seams.
 */
export class Raster {
  readonly color: string[];
  readonly mat: Uint8Array;
  readonly layer: Uint16Array;
  private stamp = 0;

  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.color = new Array<string>(w * h).fill("");
    this.mat = new Uint8Array(w * h);
    this.layer = new Uint16Array(w * h);
  }

  inside(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  /** Set a pixel. Without `mat` the existing material is kept (feature detail on skin). */
  put(x: number, y: number, color: string, mat?: Mat) {
    x = Math.round(x);
    y = Math.round(y);
    if (!this.inside(x, y)) return;
    const i = y * this.w + x;
    this.color[i] = color;
    if (mat !== undefined) {
      this.mat[i] = mat;
      this.layer[i] = this.stamp;
    }
  }

  at(x: number, y: number) {
    return this.inside(x, y) ? this.color[y * this.w + x] : "";
  }

  matAt(x: number, y: number): Mat {
    return this.inside(x, y) ? (this.mat[y * this.w + x] as Mat) : MAT.none;
  }

  /** Pixel indices inside a polygon, sampled at pixel centres. */
  region(points: Pt[]): number[] {
    const out: number[] = [];
    const lo = Math.max(0, Math.floor(Math.min(...points.map((p) => p[1]))));
    const hi = Math.min(
      this.h,
      Math.ceil(Math.max(...points.map((p) => p[1]))),
    );
    for (let y = lo; y < hi; y++) {
      const xs: number[] = [];
      const s = y + 0.5;
      for (let i = 0; i < points.length; i++) {
        const a = points[i],
          b = points[(i + 1) % points.length];
        if ((a[1] <= s && b[1] > s) || (b[1] <= s && a[1] > s))
          xs.push(a[0] + ((s - a[1]) * (b[0] - a[0])) / (b[1] - a[1]));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (
          let x = Math.max(0, Math.ceil(xs[i] - 0.5));
          x < Math.min(this.w, xs[i + 1] - 0.5);
          x++
        )
          out.push(y * this.w + x);
    }
    return out;
  }

  disc(cx: number, cy: number, r: number): number[] {
    const out: number[] = [];
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
        if (!this.inside(x, y)) continue;
        const dx = x + 0.5 - cx,
          dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) out.push(y * this.w + x);
      }
    return out;
  }

  ellipse(cx: number, cy: number, rx: number, ry: number): number[] {
    const out: number[] = [];
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        if (!this.inside(x, y)) continue;
        const dx = (x + 0.5 - cx) / rx,
          dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) out.push(y * this.w + x);
      }
    return out;
  }

  static union(...regions: number[][]): number[] {
    return [...new Set(regions.flat())];
  }

  static diff(a: number[], b: number[]): number[] {
    const cut = new Set(b);
    return a.filter((i) => !cut.has(i));
  }

  /** Grow a region by one pixel in four directions. */
  grow(region: number[], by = 1): number[] {
    let current = new Set(region);
    for (let n = 0; n < by; n++) {
      const next = new Set(current);
      for (const i of current) {
        const x = i % this.w,
          y = (i - x) / this.w;
        if (x > 0) next.add(i - 1);
        if (x < this.w - 1) next.add(i + 1);
        if (y > 0) next.add(i - this.w);
        if (y < this.h - 1) next.add(i + this.w);
      }
      current = next;
    }
    return [...current];
  }

  /** Fill a region with a material. Starts a new draw layer. */
  fill(region: number[], color: string, mat: Mat) {
    this.stamp++;
    for (const i of region) {
      this.color[i] = color;
      this.mat[i] = mat;
      this.layer[i] = this.stamp;
    }
  }

  poly(points: Pt[], color: string, mat: Mat) {
    this.fill(this.region(points), color, mat);
  }

  /** Recolour pixels of a region in place, keeping material and layer. */
  paint(
    region: number[],
    color: string | ((current: string, x: number, y: number) => string),
    options: PaintOptions = {},
  ) {
    const set = options.soft ? new Set(region) : undefined;
    for (const i of region) {
      const x = i % this.w,
        y = (i - x) / this.w;
      if (options.only && !options.only.includes(this.mat[i] as Mat)) continue;
      if (!this.mat[i]) continue;
      const checker = (x + y) & 1;
      if (options.dither && checker) continue;
      if (set && checker) {
        const edge =
          !set.has(i - 1) ||
          !set.has(i + 1) ||
          !set.has(i - this.w) ||
          !set.has(i + this.w);
        if (edge) continue;
      }
      this.color[i] =
        typeof color === "string" ? color : color(this.color[i], x, y);
    }
  }

  rect(x: number, y: number, w: number, h: number, color: string, mat?: Mat) {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) this.put(x + i, y + j, color, mat);
  }

  line(a: Pt, b: Pt, color: string, mat?: Mat) {
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
    for (let i = 0; i <= n; i++)
      this.put(
        a[0] + ((b[0] - a[0]) * i) / n,
        a[1] + ((b[1] - a[1]) * i) / n,
        color,
        mat,
      );
  }

  /**
   * Line through a polyline with optional dashed gaps (every `gap`th pixel
   * skipped). With `only`, pixels of other materials are left alone.
   */
  stroke(points: Pt[], color: string, gap = 0, mat?: Mat, only?: Mat) {
    let n = 0;
    for (let k = 0; k + 1 < points.length; k++) {
      const a = points[k],
        b = points[k + 1];
      const steps = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1);
      for (let i = k ? 1 : 0; i <= steps; i++, n++) {
        if (gap && n % gap === gap - 1) continue;
        const x = Math.round(a[0] + ((b[0] - a[0]) * i) / steps),
          y = Math.round(a[1] + ((b[1] - a[1]) * i) / steps);
        if (only !== undefined && this.matAt(x, y) !== only) continue;
        this.put(x, y, color, mat);
      }
    }
  }

  /**
   * One-pixel contour on the front-most material at every boundary. Bottom and
   * right facing edges use the darker `deep` tone so forms sit against light.
   */
  contour(edges: Partial<Record<Mat, { edge: string; deep: string }>>) {
    const w = this.w,
      out: [number, string][] = [];
    for (let i = 0; i < this.mat.length; i++) {
      const m = this.mat[i] as Mat;
      if (!m || !edges[m]) continue;
      const x = i % w,
        y = (i - x) / w;
      const behind = (j: number, ok: boolean) =>
        !ok ||
        !this.mat[j] ||
        (this.mat[j] !== m && this.layer[j] < this.layer[i]);
      const l = behind(i - 1, x > 0),
        r = behind(i + 1, x < w - 1),
        u = behind(i - w, y > 0),
        d = behind(i + w, y < this.h - 1);
      if (l || r || u || d)
        out.push([i, r || d ? edges[m]!.deep : edges[m]!.edge]);
    }
    for (const [i, c] of out) this.color[i] = c;
  }

  /**
   * Ambient shadow cast downward by any material onto a different material
   * beneath it: hair on forehead, chin on neck, neck on chest, sleeve on arm.
   */
  castShadows(strength = 0.3, hue = "#3a2038") {
    const w = this.w;
    const original = this.color.slice();
    for (let i = w * 2; i < this.mat.length; i++) {
      const m = this.mat[i];
      if (!m) continue;
      const a1 = this.mat[i - w],
        a2 = this.mat[i - 2 * w];
      if (a1 && a1 !== m) this.color[i] = mix(original[i], hue, strength);
      else if (a2 && a2 !== m && a1 === m)
        this.color[i] = mix(original[i], hue, strength * 0.45);
    }
  }

  blit(ctx: CanvasRenderingContext2D) {
    const image = ctx.createImageData(this.w, this.h);
    for (let i = 0; i < this.color.length; i++) {
      const c = this.color[i];
      if (!c) continue;
      const v = parseInt(c.slice(1), 16);
      image.data[i * 4] = (v >> 16) & 255;
      image.data[i * 4 + 1] = (v >> 8) & 255;
      image.data[i * 4 + 2] = v & 255;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }
}

/** Closed Catmull-Rom spline through control points, densified for polygon fill. */
export function smooth(points: Pt[], steps = 4): Pt[] {
  const n = points.length;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n],
      p1 = points[i],
      p2 = points[(i + 1) % n],
      p3 = points[(i + 2) % n];
    for (let s = 0; s < steps; s++) {
      const t = s / steps,
        t2 = t * t,
        t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  return out;
}

/**
 * Directional gradient across a region: 0 at `from`, full `strength` at `to`,
 * quantised to a few steps with checkerboard dithering between them.
 */
export function shadeRamp(
  r: Raster,
  region: number[],
  from: Pt,
  to: Pt,
  strength: number,
  hue: string,
  only?: readonly Mat[],
  steps = 4,
) {
  const dx = to[0] - from[0],
    dy = to[1] - from[1],
    len2 = dx * dx + dy * dy || 1;
  r.paint(
    region,
    (c, x, y) => {
      const t = Math.min(
        1,
        Math.max(
          0,
          ((x + 0.5 - from[0]) * dx + (y + 0.5 - from[1]) * dy) / len2,
        ),
      );
      const q = t * steps;
      const lo = Math.floor(q);
      const level = q - lo > 0.5 ? ((x + y) & 1 ? lo + 1 : lo) : lo;
      const amount = (Math.min(steps, level) / steps) * strength;
      return amount ? mix(c, hue, amount) : c;
    },
    { only },
  );
}
