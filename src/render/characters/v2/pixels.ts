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
/** The key light's tone and side, from the scene's hour. A flat multiply tint
 * on the finished sprite shifts every value together; this moves the light
 * itself, so a figure at dusk is lit from the west like everything else. */
export type SpriteLight = {
  /** Screen side the key comes from: -1 left, 1 right. */
  key: -1 | 1;
  warm: string;
  cool: string;
  /** 0 flattens toward ambient; 1 is full sun. */
  contrast: number;
};
const noon: SpriteLight = {
  key: -1,
  warm: "#ffe6ad",
  cool: "#241c38",
  contrast: 1,
};
let light: SpriteLight = noon;
export function setSpriteLight(next: SpriteLight | undefined) {
  light = next ?? noon;
}
/** Which side the key is on, for callers that place highlights by hand. */
export const lightKey = () => light.key;
/** Shadows point away from the sun, so the cast vector's x gives the side it
 * is on. Overhead (|x| under half a pixel of cast) keeps the noon convention. */
export function spriteLightFor(cast: readonly number[], night: boolean) {
  const key: -1 | 1 = Math.abs(cast[0]) < 0.5 ? -1 : cast[0] < 0 ? 1 : -1;
  return { key, contrast: night ? 0.35 : 1 };
}
type Hsl = [number, number, number];
function toHsl(hex: string): Hsl {
  const v = parseInt(hex.slice(1), 16),
    r = (v >> 16) / 255,
    g = ((v >> 8) & 255) / 255,
    b = (v & 255) / 255,
    hi = Math.max(r, g, b),
    lo = Math.min(r, g, b),
    l = (hi + lo) / 2,
    d = hi - lo;
  if (!d) return [0, 0, l];
  const h =
    hi === r ? ((g - b) / d + 6) % 6 : hi === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, d / (1 - Math.abs(2 * l - 1)), l];
}
function fromHsl([h, s, l]: Hsl) {
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const k = (n: number) => (n + h / 30) % 12,
    a = s * Math.min(l, 1 - l),
    f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return `#${[0, 8, 4]
    .map((n) => Math.round(f(n) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}
/** Turn a hue toward a target by up to `deg`, the short way round. */
function toward(h: number, target: number, deg: number) {
  const d = ((target - h + 540) % 360) - 180;
  return (h + Math.sign(d) * Math.min(Math.abs(d), deg) + 360) % 360;
}
export function luma(hex: string) {
  const v = parseInt(hex.slice(1), 16);
  return (0.3 * (v >> 16) + 0.59 * ((v >> 8) & 255) + 0.11 * (v & 255)) / 255;
}
/** Blood under the skin at the skin's own value: pink on pale skin, a
 * deeper rose-brown on dark, never a pastel patch. */
export function flush(skin: string) {
  const [h, s, l] = toHsl(skin);
  return mix(skin, fromHsl([toward(h, 0, 14), s + 0.08, l]), 0.6);
}
/** Each step darker also turns toward violet and gains saturation; each step
 * lighter turns toward gold. Darkening by scaling RGB greys every shadow into
 * the same mud, which is most of what separated these figures from Stardew's. */
export function ramp(
  base: string,
  material: "cloth" | "skin" | "hair" = "cloth",
): Ramp {
  // Black hair drawn at its true value is a hole in the sprite: lift it, and
  // give it a sheen the lighter heads do not need.
  const [, , l0] = toHsl(base),
    dark = material === "hair" ? Math.max(0, 0.22 - l0) / 0.22 : 0;
  if (dark) base = mix(base, "#4a3c46", 0.4 * dark);
  const [h, s, l] = toHsl(base),
    // Skin shades toward rose, not violet: blood under the surface.
    cold = material === "skin" ? 330 : 255,
    // Pale and greyed materials barely turn: cream swung toward violet goes
    // through orange. They take a little of the cool tone instead.
    c = s * (1 - Math.abs(2 * l - 1)),
    chroma = Math.min(1, c / 0.3);
  // Chroma, not HSL saturation, is held through the step: darkening cream at
  // constant saturation turns it into orange.
  const step = (turn: number, sat: number, dl: number, target: number) =>
    mix(
      fromHsl([
        toward(h, target, turn * chroma * (material === "cloth" ? 1 : material === "hair" ? 0.5 : 0.3)),
        ((c + sat * c * (material === "skin" && dl < 0 ? 0 : 1)) *
          (dl < 0 ? Math.sqrt((l + dl) / l) : 1)) /
          Math.max(0.05, 1 - Math.abs(2 * (l + dl) - 1)),
        l + dl,
      ]),
      target === cold ? "#3a3350" : "#fff0c8",
      0.2 * (1 - chroma),
    );
  const k = light.contrast;
  // Time of day still tints the whole ramp: dusk shadows purple, dawn warm.
  const tint = (c: string, t: string, amount: number) => mix(c, t, amount);
  return {
    base,
    // Darkest value in the material, and the only one allowed to approach black.
    shadowEdge: tint(
      step(28, 0.12, -Math.min(0.36, l * 0.62), cold),
      light.cool,
      0.18,
    ),
    // Lit-side contour: a hue-shifted dark of the material, never a keyline.
    edge: tint(step(20, 0.1, -Math.min(0.28, l * 0.46), cold), light.cool, 0.1),
    shade: mix(
      base,
      tint(step(16, 0.08, -Math.min(0.15, l * 0.3), cold), light.cool, 0.08),
      k,
    ),
    // Hair takes a smaller step: a big move toward cream turns black hair grey.
    light: mix(
      base,
      tint(
        step(
          material === "hair" ? 10 : 14,
          material === "skin" ? 0.25 : -0.02,
          material === "hair" ? 0.07 + 0.08 * dark : 0.11,
          material === "cloth" ? 52 : 38,
        ),
        light.warm,
        // Cream over deep skin is a grey smear; its sheen is warm and dark.
        material === "skin" ? 0.15 * l : 0.15,
      ),
      k,
    ),
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
  /** For a shape drawn on top of the body, such as the near arm in profile.
   * A full dark contour on a 3px limb leaves one pixel of colour; this keeps
   * the dark line on the shaded side only. */
  overlay = false;
  /** Rows and columns cut out of whatever is drawn, in local pixels. Cut rows
   * pull everything above them down; a column left of centre pulls the left
   * side in, right of centre the right side. Shrinks a head around a fixed
   * chin and eye line without redrawing it. */
  squeeze?: { rows: number[]; cols: number[] };
  private place(x: number, y: number): Point | undefined {
    const s = this.squeeze;
    if (!s) return [x, y];
    if (s.rows.includes(y) || s.cols.includes(x)) return undefined;
    return [
      x +
        s.cols.filter((c) => c < 10 && c > x).length -
        s.cols.filter((c) => c > 10 && c < x).length,
      y + s.rows.filter((r) => r > y).length,
    ];
  }
  private groupMask?: Set<string>;
  /** Which shape last painted each canvas pixel, in draw order. Later means
   * nearer, which is what the contact pass needs to know. */
  private owner = new Map<string, number>();
  private layer = 0;
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
    if (this.squeeze) {
      const x0 = Math.round(x),
        y0 = Math.round(y);
      for (let j = 0; j < Math.round(h); j++)
        for (let i = 0; i < Math.round(w); i++) {
          const at = this.place(x0 + i, y0 + j);
          if (at) this.ctx.fillRect(at[0], at[1], 1, 1);
        }
      return;
    }
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
    const lit = lightKey() * (this.flip ? -1 : 1);
    const has = (x: number, y: number) => mask.has(`${x},${y}`);
    const border = (x: number, y: number) =>
      has(x, y) &&
      (!has(x - 1, y) || !has(x + 1, y) || !has(x, y - 1) || !has(x, y + 1));
    // How far the mask runs either side of a pixel. A contour ring plus a rim
    // and a core eat four pixels, so anything narrower than five has no base
    // left: a 3px arm came out as pure outline. Each axis is gated separately,
    // so a thin limb still takes the modelling that runs along its length.
    const run = (x: number, y: number, dx: number, dy: number) => {
      let n = 1;
      for (let i = 1; i < 8 && has(x + dx * i, y + dy * i); i++) n++;
      for (let i = 1; i < 8 && has(x - dx * i, y - dy * i); i++) n++;
      return n;
    };
    this.layer++;
    const m = this.ctx.getTransform();
    for (const key of mask) {
      const [x, y] = key.split(",").map(Number);
      const at = this.place(x, y);
      // Ownership is recorded in canvas space so the contact pass can run once
      // over the finished figure, whatever transform each piece was drawn under.
      if (at) {
        const cx = Math.round(m.a * at[0] + m.c * at[1] + m.e - (m.a < 0 ? 1 : 0)),
          cy = Math.round(m.b * at[0] + m.d * at[1] + m.f - (m.d < 0 ? 1 : 0));
        this.owner.set(`${cx},${cy}`, this.layer);
      }
      if (border(x, y)) {
        // Bottom and the shaded flank take the dark contour; the lit flank
        // takes a tinted one so the outline never closes into a black ring.
        const shaded = !has(x, y + 1) || !has(x - lit, y);
        if (this.overlay) {
          this.rect(x, y, 1, 1, shaded ? colors.edge : colors.light);
          continue;
        }
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
      const across = run(x, y, 1, 0),
        wide = across >= 5,
        deep = run(x, y, 0, 1) >= 5;
      // A torso-width shape turns away over two pixels, not one: the shadow
      // side is a plane, and a 1px core on it read as a second outline.
      const band = across >= 9 ? 2 : 1;
      let away = false;
      for (let i = 1; i <= band; i++) if (border(x - lit * i, y)) away = true;
      const rim = (deep && border(x, y - 1)) || (wide && border(x + lit, y));
      const core = (deep && border(x, y + 1)) || (wide && away);
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
      // Joints sit on the ribbon's own pixel grid. A fixed 3px square was half
      // a pixel off a 3px forearm and bulged every elbow by one.
      const h = width / 2;
      for (const [x, y] of points.slice(1, -1))
        this.shape(
          [
            [x - h, y - h],
            [x + h, y - h],
            [x + h, y + h],
            [x - h, y + h],
          ],
          colors,
        );
    });
  }
  /** One pass over the finished figure: where a nearer piece ends, the piece
   * behind it takes a pixel of shadow. Chin onto chest, brim onto face, cloak
   * onto leg, arm onto body. Layers read as layers instead of as stickers. */
  contact(w = 80, h = 80) {
    if (!this.owner.size) return;
    const image = this.ctx.getImageData(0, 0, w, h),
      d = image.data;
    const at = (x: number, y: number) => this.owner.get(`${x},${y}`) ?? 0;
    const hit: number[] = [];
    for (let y = 1; y < h; y++)
      for (let x = 0; x < w; x++) {
        const mine = at(x, y);
        if (!mine) continue;
        const above = at(x, y - 1);
        // Only a piece drawn later — nearer the viewer — casts onto this one.
        if (above <= mine) continue;
        if (!d[(y * w + x) * 4 + 3]) continue;
        hit.push((y * w + x) * 4);
      }
    // Collected first: shading in place would let one darkened pixel seed the next.
    for (const i of hit)
      for (const c of [0, 1, 2]) d[i + c] = Math.round(d[i + c] * 0.7);
    this.ctx.putImageData(image, 0, 0);
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
