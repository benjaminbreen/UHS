import { useEffect, useRef } from "react";
import type { CultureId } from "../content/history/types";
import type { Point } from "../core/types";
import { atlasRivers, atlasSample, broadEnvironment, fromAtlas, toAtlas } from "../world/geography/atlas";
import { noise } from "../world/geography/noise";

/** The region map redrawn after a cartographic tradition of its time and
 * place. Each is a reconstruction in that manner, not a copy of a real map. */
export type PeriodStyle =
  | "peutinger" | "portolan" | "engraved" | "survey" | "islamic"
  | "ink" | "painted" | "codex" | "sketch";

export const periodCaptions: Record<PeriodStyle, string> = {
  peutinger: "After the Peutinger Table, a Roman road itinerary",
  portolan: "In the manner of a portolan sea chart",
  engraved: "In the manner of a copperplate atlas",
  survey: "In the manner of a topographic survey",
  islamic: "In the manner of the Islamic geographers, al-Idrisi to Piri Reis",
  ink: "In the manner of a Chinese ink-and-brush map",
  painted: "In the manner of a painted cloth map of Rajasthan",
  codex: "In the manner of a Mesoamerican lienzo, roads walked in footprints",
  sketch: "A traveller's pencil sketch: no local map of this kind survives",
};

export function periodStyle(culture: CultureId | undefined, year: number): PeriodStyle {
  if (year >= 1880) return "survey";
  switch (culture) {
    case "european":
      return year < 500 ? "peutinger" : year < 1520 ? "portolan" : "engraved";
    case "north-african-west-asian":
      return year < 640 ? "peutinger" : "islamic";
    case "inner-eurasian":
      return year >= 900 ? "islamic" : "sketch";
    case "south-asian":
      return year >= 1200 ? "painted" : "sketch";
    case "east-asian":
    case "southeast-asian":
      return year >= -300 ? "ink" : "sketch";
    case "mesoamerican":
      return "codex";
    default:
      return year >= 1650 ? "engraved" : "sketch";
  }
}

type RGB = [number, number, number];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const hash = (x: number, y: number) => {
  const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return h - Math.floor(h);
};

/** Ground under a pixel. `d` is its distance from the coast in pixels,
 * negative at sea; `x`, `y` are canvas pixels for patterns. */
type Field = { d: number; ridge: number; moist: number; woods: number; contour: boolean; x: number; y: number };
type Look = {
  land: (f: Field) => RGB;
  sea: (f: Field) => RGB;
  coast: RGB;
  coastWidth: number;
  /** Paper grain and staining, 0 for a clean print. */
  age: number;
  river: string;
  riverWidth: number;
};

const looks: Record<PeriodStyle, Look> = {
  peutinger: {
    land: (f) => mix([232, 216, 172], [222, 200, 150], clamp(f.ridge - 0.3)),
    // The Table's sea is a band of olive green, lighter along the shore.
    sea: (f) => mix([150, 170, 120], [118, 140, 98], clamp(-f.d / 60)),
    coast: [96, 70, 40], coastWidth: 1.2, age: 0.8,
    river: "rgba(88,120,92,0.9)", riverWidth: 2.4,
  },
  portolan: {
    land: (f) => mix([238, 224, 190], [226, 206, 162], clamp(f.d / 90) * 0.6),
    // A sea chart leaves the sea blank vellum and inks the shore finely.
    sea: (f) => mix([226, 214, 182], [238, 226, 194], clamp(-f.d / 40)),
    coast: [70, 48, 30], coastWidth: 1.4, age: 0.9,
    river: "rgba(60,90,120,0.85)", riverWidth: 1.6,
  },
  engraved: {
    land: (f) => {
      const base: RGB = mix([240, 232, 210], [226, 222, 196], clamp(f.moist));
      // Hand-colouring: a thin wash just inside the coast.
      return f.d < 10 ? mix(base, [214, 196, 150], (1 - f.d / 10) * 0.6) : base;
    },
    sea: (f) => {
      // Engravers ruled the sea with lines following the shore, closer near it.
      const band = Math.sin(Math.sqrt(-f.d) * 3.4);
      const line = -f.d < 60 && band > 0.9 ? 1 : 0;
      return mix([232, 232, 222], [110, 120, 130], line * clamp(1 + f.d / 60) * 0.7);
    },
    coast: [40, 36, 30], coastWidth: 1.3, age: 0.25,
    river: "rgba(50,60,80,0.9)", riverWidth: 1.2,
  },
  survey: {
    land: (f) => {
      // Hypsometric tints, with a contour wherever a tenth of relief is crossed.
      const h = clamp(f.ridge);
      let c = h < 0.35 ? mix([214, 228, 190], [236, 232, 196], h / 0.35) : mix([236, 232, 196], [206, 170, 130], clamp((h - 0.35) / 0.5));
      if (f.woods > 0) c = mix(c, [176, 206, 150], 0.55);
      if (f.contour) c = mix(c, [150, 100, 60], 0.6);
      return c;
    },
    sea: (f) => mix([196, 222, 236], [150, 190, 214], clamp(-f.d / 120)),
    coast: [60, 100, 140], coastWidth: 1, age: 0,
    river: "rgba(60,120,180,1)", riverWidth: 1.4,
  },
  islamic: {
    land: (f) => mix([222, 196, 130], [206, 172, 104], clamp(f.ridge - 0.25)),
    sea: (f) => {
      // A flat green sea worked with regular waves, as in the Kitab-i Bahriye.
      const wave = Math.sin(f.x * 0.35 + Math.sin(f.y * 0.19) * 3) * Math.sin(f.y * 0.62);
      return mix([52, 110, 100], [80, 144, 128], wave > 0.7 ? 0.8 : 0);
    },
    coast: [120, 40, 30], coastWidth: 2.2, age: 0.5,
    river: "rgba(40,100,120,1)", riverWidth: 2.4,
  },
  ink: {
    land: (f) => mix([236, 228, 208], [214, 204, 180], clamp(f.ridge - 0.35) * 0.8),
    sea: (f) => {
      // Fish-scale waves: rows of arcs, offset each row.
      const row = Math.floor(f.y / 9), sx = f.x + (row % 2) * 7;
      const cx = sx - Math.floor(sx / 14) * 14 - 7, cy = f.y - row * 9 - 9;
      const r = Math.hypot(cx, cy);
      const arc = Math.abs(r - 7) < 0.7 && cy < 0 ? 1 : 0;
      return mix([226, 222, 206], [90, 100, 106], arc * 0.55);
    },
    coast: [40, 38, 36], coastWidth: 1.8, age: 0.6,
    river: "rgba(40,40,40,0.7)", riverWidth: 2,
  },
  painted: {
    land: (f) => {
      const c = mix([228, 180, 92], [214, 150, 70], clamp(f.ridge - 0.3));
      // Painted ground is never bare: a scatter of four-petalled rosettes.
      const row = Math.floor(f.y / 44), sx = f.x + (row % 2) * 22, cx = (sx % 44) - 22, cy = (f.y % 44) - 22;
      if (hash(Math.floor(sx / 44), row) < 0.45) return c;
      const petal = Math.min(Math.hypot(cx - 3, cy), Math.hypot(cx + 3, cy), Math.hypot(cx, cy - 3), Math.hypot(cx, cy + 3));
      return f.d > 6 && petal < 1.8 ? mix(c, [184, 64, 40], 0.75) : c;
    },
    sea: (f) => {
      // Basket-weave water, as on Rajasthani cloth maps.
      const a = Math.sin(f.x * 0.5) > 0 !== Math.sin(f.y * 0.5) > 0;
      const line = Math.abs(Math.sin((a ? f.x : f.y) * 1.2)) < 0.25;
      return mix([58, 102, 170], [150, 190, 230], line ? 0.7 : 0);
    },
    coast: [30, 24, 20], coastWidth: 2.2, age: 0.4,
    river: "rgba(58,102,170,1)", riverWidth: 3,
  },
  codex: {
    land: (f) => mix([238, 226, 194], [226, 208, 166], clamp(f.ridge - 0.4) * 0.6),
    sea: () => [70, 150, 170],
    coast: [30, 24, 20], coastWidth: 2.4, age: 0.55,
    river: "rgba(70,150,170,1)", riverWidth: 3.4,
  },
  sketch: {
    land: (f) => [240, 236, 226].map((v) => v - (f.ridge > 0.5 ? 6 : 0)) as RGB,
    sea: (f) => {
      // Pencil shading along the shore only.
      const hatch = (f.x + f.y) % 5 < 1 && -f.d < 26 ? 1 : 0;
      return mix([236, 232, 222], [110, 110, 110], hatch * clamp(1 + f.d / 26) * 0.7);
    },
    coast: [70, 70, 70], coastWidth: 1.3, age: 0.2,
    river: "rgba(90,90,90,0.8)", riverWidth: 1.2,
  },
};

export function PeriodMap({ style, anchor, center, span, dims }: {
  style: PeriodStyle;
  anchor: { lon: number; lat: number };
  center: Point;
  span: number;
  dims: [number, number];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // Panning repaints; a frame's delay lets a drag coalesce.
    const raf = requestAnimationFrame(() => paint(ref.current!, style, toAtlas(anchor.lon, anchor.lat), center, span, dims));
    return () => cancelAnimationFrame(raf);
  }, [style, center.x, center.y, span]);
  return <canvas ref={ref} className="period-canvas" width={dims[0] * 2} height={dims[1] * 2} />;
}

function paint(canvas: HTMLCanvasElement, style: PeriodStyle, o: Point, center: Point, span: number, [w, h]: [number, number]) {
  const c = canvas.getContext("2d")!;
  const CW = canvas.width, CH = canvas.height, look = looks[style];
  const tpp = span / CW;
  const worldAt = (px: number, py: number) => ({ x: center.x + (px / CW - 0.5) * span, y: center.y + (py / CH - 0.5) * span * h / w });
  // Coast and ridge on a coarse grid, read back bilinearly per pixel.
  const G = 6, cols = Math.ceil(CW / G) + 2, rows = Math.ceil(CH / G) + 2;
  const coast = new Float32Array(cols * rows), ridge = new Float32Array(cols * rows);
  const R = 8, rc = Math.ceil(cols / R) + 1, rr = Math.ceil(rows / R) + 1;
  const relief = new Float32Array(rc * rr), moist = new Float32Array(rc * rr);
  for (let j = 0; j < rr; j++)
    for (let i = 0; i < rc; i++) {
      const p = worldAt(i * R * G, j * R * G), ll = fromAtlas(o.x + p.x, o.y + p.y);
      const env = broadEnvironment(ll.lon, ll.lat);
      relief[j * rc + i] = env.relief;
      moist[j * rc + i] = env.moisture;
    }
  const coarse = (grid: Float32Array, i: number, j: number) => {
    const fi = i / R, fj = j / R, i0 = Math.min(rc - 2, Math.floor(fi)), j0 = Math.min(rr - 2, Math.floor(fj));
    const tx = fi - i0, ty = fj - j0;
    return (grid[j0 * rc + i0] * (1 - tx) + grid[j0 * rc + i0 + 1] * tx) * (1 - ty)
      + (grid[(j0 + 1) * rc + i0] * (1 - tx) + grid[(j0 + 1) * rc + i0 + 1] * tx) * ty;
  };
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const p = worldAt(i * G, j * G);
      coast[j * cols + i] = atlasSample(o.x + p.x, o.y + p.y).coast;
      ridge[j * cols + i] = coarse(relief, i, j) + (noise("relief", p.x, p.y, 3000, "map") - 0.5) * 0.5;
    }
  const lerp = (grid: Float32Array, x: number, y: number) => {
    const fi = x / G, fj = y / G, i0 = Math.floor(fi), j0 = Math.floor(fj), tx = fi - i0, ty = fj - j0;
    const k = j0 * cols + i0;
    return (grid[k] * (1 - tx) + grid[k + 1] * tx) * (1 - ty) + (grid[k + cols] * (1 - tx) + grid[k + cols + 1] * tx) * ty;
  };

  const image = c.createImageData(CW, CH), data = image.data;
  const f: Field = { d: 0, ridge: 0, moist: 0, woods: 0, contour: false, x: 0, y: 0 };
  for (let y = 0; y < CH; y++)
    for (let x = 0; x < CW; x++) {
      f.x = x; f.y = y;
      f.d = lerp(coast, x, y) / tpp;
      let col: RGB;
      if (f.d > -1) {
        f.ridge = lerp(ridge, x, y);
        f.moist = coarse(moist, x / G, y / G);
        if (style === "survey") {
          // A contour where the tenth of relief changes from the next pixel.
          const k = Math.floor(clamp(f.ridge) * 12);
          f.contour = k !== Math.floor(clamp(lerp(ridge, x + 1, y)) * 12) || k !== Math.floor(clamp(lerp(ridge, x, y + 1)) * 12);
          const p = worldAt(x, y);
          f.woods = noise("woods", p.x, p.y, 2500, "map") - (0.95 - f.moist * 0.6);
        }
        col = look.land(f);
        if (f.d < 1) col = mix(look.sea(f), col, (f.d + 1) / 2);
      } else col = look.sea(f);
      if (Math.abs(f.d) < look.coastWidth) col = mix(col, look.coast, 1 - Math.abs(f.d) / look.coastWidth);
      if (look.age) {
        const grain = (hash(x, y) - 0.5) * 10 * look.age;
        const stain = (noise("stain", x, y, 260, "paper") - 0.5) * 26 * look.age;
        // Old paper browns toward its edges.
        const edge = Math.min(x, y, CW - x, CH - y) / (CW * 0.12);
        const burn = (1 - clamp(edge)) * 30 * look.age;
        col = [col[0] + grain + stain - burn, col[1] + grain + stain - burn * 1.3, col[2] + grain + stain - burn * 1.8];
      }
      const k = (y * CW + x) * 4;
      data[k] = col[0]; data[k + 1] = col[1]; data[k + 2] = col[2]; data[k + 3] = 255;
    }
  c.putImageData(image, 0, 0);

  const toCanvas = (ax: number, ay: number) => ({
    x: ((ax - o.x - center.x) / span + 0.5) * CW,
    y: ((ay - o.y - center.y) / (span * h / w) + 0.5) * CH,
  });
  c.save();
  c.lineJoin = c.lineCap = "round";
  if (style === "survey" || style === "engraved") graticule(c, style, o, center, span, CW, CH, h / w);
  // Rivers.
  c.strokeStyle = look.river;
  c.lineWidth = look.riverWidth;
  for (const river of atlasRivers) {
    // Curves through the midpoints, since the atlas course is a chain of chords.
    c.beginPath();
    let last: Point | undefined;
    for (const [lon, lat] of river.points) {
      const a = toAtlas(lon, lat), p = toCanvas(a.x, a.y);
      const inside = p.x > -200 && p.x < CW + 200 && p.y > -200 && p.y < CH + 200;
      if (!inside) last = undefined;
      else if (!last) c.moveTo(p.x, p.y);
      else c.quadraticCurveTo(last.x, last.y, (last.x + p.x) / 2, (last.y + p.y) / 2);
      if (inside) last = p;
    }
    c.stroke();
  }
  // Mountains and woods on a jittered grid, drawn back to front.
  const marks: { y: number; draw: () => void }[] = [];
  const step = style === "portolan" || style === "peutinger" ? 40 : 30;
  for (let gy = 0; gy < CH + step; gy += step)
    for (let gx = 0; gx < CW + step; gx += step) {
      const x = gx + hash(gx, gy) * step, y = gy + hash(gy, gx + 9) * step;
      if (x >= CW - 1 || y >= CH - 1) continue;
      const d = lerp(coast, x, y) / tpp;
      if (d < 10) continue;
      const r = lerp(ridge, x, y), roll = hash(x, y);
      if (r > 0.62) marks.push({ y, draw: () => mountain(c, style, x, y, 16 + roll * 10, roll) });
      else if (r > 0.42 && roll < 0.6) marks.push({ y, draw: () => mountain(c, style, x, y, 9 + roll * 5, roll) });
      else {
        const p = worldAt(x, y), m = coarse(moist, x / G, y / G);
        // Painted and drawn styles scatter a lone tree even over dry ground.
        const lone = roll < 0.05 && style !== "engraved";
        if ((noise("woods", p.x, p.y, 2500, "map") > 0.95 - m * 0.6 && roll < 0.8) || lone)
          marks.push({ y, draw: () => tree(c, style, x, y, roll) });
      }
    }
  for (const m of marks.sort((a, b) => a.y - b.y)) m.draw();
  ornaments(c, style, coast, cols, rows, G, CW, CH, tpp);
  c.restore();
}

function mountain(c: CanvasRenderingContext2D, style: PeriodStyle, x: number, y: number, s: number, roll: number) {
  c.lineWidth = 1.4;
  switch (style) {
    case "ink": {
      // Layered washed peaks, darkest at the ridge, fading downhill.
      for (const [dx, k] of [[-s * 0.6, 0.7], [s * 0.5, 0.8], [0, 1]] as const) {
        const top = y - s * 1.5 * k, gradient = c.createLinearGradient(0, top, 0, y);
        gradient.addColorStop(0, "rgba(40,44,44,0.75)");
        gradient.addColorStop(1, "rgba(40,44,44,0)");
        c.fillStyle = gradient;
        c.beginPath();
        c.moveTo(x + dx - s * k, y);
        c.quadraticCurveTo(x + dx - s * 0.2 * k, top, x + dx, top);
        c.quadraticCurveTo(x + dx + s * 0.2 * k, top, x + dx + s * k, y);
        c.fill();
        c.strokeStyle = "rgba(30,30,30,0.8)";
        c.beginPath();
        c.moveTo(x + dx - s * k, y);
        c.quadraticCurveTo(x + dx - s * 0.2 * k, top, x + dx, top);
        c.quadraticCurveTo(x + dx + s * 0.2 * k, top, x + dx + s * k * 0.7, y - s * 0.3);
        c.stroke();
      }
      return;
    }
    case "islamic": {
      // Rounded mountains in coloured bands.
      const bands = ["#8a3b2a", "#c77a3a", "#5d7a4a", "#d9b169"];
      for (let b = 0; b < 4; b++) {
        const k = 1 - b * 0.22;
        c.fillStyle = bands[(b + Math.floor(roll * 4)) % 4];
        c.beginPath();
        c.ellipse(x, y, s * k, s * 0.9 * k, 0, Math.PI, 0);
        c.fill();
      }
      c.strokeStyle = "#3a2418";
      c.beginPath(); c.ellipse(x, y, s, s * 0.9, 0, Math.PI, 0); c.stroke();
      return;
    }
    case "codex": {
      // Tepetl, the bell-shaped hill glyph, on a banded base with a curl atop.
      c.fillStyle = "#6f9a4a"; c.strokeStyle = "#1e1812"; c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(x - s * 0.8, y);
      c.bezierCurveTo(x - s * 0.9, y - s * 1.3, x + s * 0.9, y - s * 1.3, x + s * 0.8, y);
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = "#b8412e";
      c.fillRect(x - s * 0.85, y - s * 0.18, s * 1.7, s * 0.3);
      c.strokeRect(x - s * 0.85, y - s * 0.18, s * 1.7, s * 0.3);
      c.beginPath();
      c.arc(x + s * 0.1, y - s * 1.05, s * 0.18, Math.PI, Math.PI * 2.6);
      c.stroke();
      return;
    }
    case "painted": {
      c.strokeStyle = "#20160f";
      for (const [dx, k] of [[-s * 0.55, 0.7], [s * 0.55, 0.7], [0, 1]] as const) {
        c.fillStyle = k === 1 ? "#7a8a3a" : "#a5703a";
        c.beginPath();
        c.moveTo(x + dx - s * 0.6 * k, y);
        c.quadraticCurveTo(x + dx, y - s * 2.2 * k, x + dx + s * 0.6 * k, y);
        c.closePath(); c.fill(); c.stroke();
        c.fillStyle = "#f4e6c0";
        for (let n = 1; n < 4; n++) c.fillRect(x + dx - 1, y - s * 0.45 * n * k, 2, 2);
      }
      return;
    }
    case "peutinger": {
      // A chain of pale humps, the Table's way with mountains.
      c.fillStyle = "#c9a66a"; c.strokeStyle = "#7a5530";
      for (let n = -1; n <= 1; n++) {
        c.beginPath();
        c.ellipse(x + n * s * 0.8, y, s * 0.5, s * 0.6, 0, Math.PI, 0);
        c.fill(); c.stroke();
      }
      return;
    }
    case "sketch": {
      c.strokeStyle = "rgba(70,70,70,0.8)"; c.lineWidth = 1.1;
      c.beginPath();
      c.moveTo(x - s, y);
      c.lineTo(x - s * 0.3, y - s * 1.1);
      c.lineTo(x, y - s * 0.7);
      c.lineTo(x + s * 0.4, y - s * 1.3);
      c.lineTo(x + s, y);
      c.stroke();
      c.beginPath();
      for (let n = 0; n < 4; n++) {
        c.moveTo(x + s * (0.45 + n * 0.12), y - s * (1.1 - n * 0.25));
        c.lineTo(x + s * (0.3 + n * 0.12), y - s * (0.7 - n * 0.2));
      }
      c.stroke();
      return;
    }
    default: {
      // Engraved profile: lit west face, hachured east face.
      const ink = style === "survey" ? "rgba(120,80,50,0.7)" : "rgba(50,36,24,0.9)";
      c.fillStyle = style === "portolan" ? "#b89a62" : "rgba(255,250,235,0.6)";
      c.strokeStyle = ink;
      c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.1, y - s * 1.3); c.lineTo(x + s, y); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(x - s, y); c.lineTo(x - s * 0.1, y - s * 1.3); c.lineTo(x + s, y); c.stroke();
      c.lineWidth = 0.8;
      c.beginPath();
      for (let t = 0.15; t < 0.95; t += 0.14) {
        c.moveTo(x - s * 0.1 + s * 1.1 * t, y - s * 1.3 * (1 - t));
        c.lineTo(x - s * 0.1 + s * 0.5 * t, y);
      }
      c.stroke();
    }
  }
}

function tree(c: CanvasRenderingContext2D, style: PeriodStyle, x: number, y: number, roll: number) {
  switch (style) {
    case "portolan":
    case "peutinger":
    case "islamic":
    case "survey":
      return;
    case "ink":
      // Pines as clusters of brush dots on a stroke.
      c.strokeStyle = "rgba(30,30,30,0.8)"; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1, y - 12); c.stroke();
      c.fillStyle = "rgba(30,40,34,0.75)";
      for (let n = 0; n < 7; n++) c.beginPath(), c.arc(x + Math.sin(n * 2.4) * 4, y - 6 - n * 1.3, 1.8, 0, Math.PI * 2), c.fill();
      return;
    case "codex":
      c.strokeStyle = "#1e1812"; c.lineWidth = 1.5;
      c.fillStyle = "#b8412e"; c.fillRect(x - 1.5, y - 8, 3, 8); c.strokeRect(x - 1.5, y - 8, 3, 8);
      c.fillStyle = "#4f8a3c";
      c.beginPath(); c.arc(x, y - 12, 6, 0, Math.PI * 2); c.fill(); c.stroke();
      return;
    case "painted":
      c.strokeStyle = "#20160f"; c.lineWidth = 1.3;
      c.fillStyle = roll < 0.5 ? "#2f5a2a" : "#476e2c";
      c.beginPath(); c.arc(x, y - 10, 8, 0, Math.PI * 2); c.fill(); c.stroke();
      c.fillStyle = "#f0c870";
      for (let n = 0; n < 5; n++) c.fillRect(x - 4 + ((n * 3) % 8), y - 14 + n * 1.6, 1.6, 1.6);
      c.beginPath(); c.moveTo(x, y - 2); c.lineTo(x, y + 3); c.stroke();
      return;
    case "sketch":
      c.strokeStyle = "rgba(80,80,80,0.75)"; c.lineWidth = 1;
      c.beginPath(); c.arc(x, y - 5, 3.5, 0, Math.PI * 2); c.moveTo(x, y - 1.5); c.lineTo(x, y + 2); c.stroke();
      return;
    default:
      // Engravers' trees: a crown shaded on its east side, a trunk, a shadow.
      for (const [dx, dy] of roll < 0.4 ? [[-5, 1], [4, 0], [0, 4]] : [[-3, 0], [3, 2]]) {
        const tx = x + dx, ty = y + dy;
        c.strokeStyle = "rgba(44,38,32,0.9)"; c.lineWidth = 0.9;
        c.fillStyle = "rgba(250,246,232,0.9)";
        c.beginPath(); c.arc(tx, ty - 6, 3.6, 0, Math.PI * 2); c.fill(); c.stroke();
        c.beginPath();
        for (let n = 0; n < 3; n++) { c.moveTo(tx + 0.6 + n, ty - 8.5 + n * 0.4); c.lineTo(tx + 0.6 + n, ty - 3.5 - n * 0.4); }
        c.moveTo(tx, ty - 2.4); c.lineTo(tx, ty + 1); c.stroke();
      }
  }
}

/** Degree lines at the widest round step that still crosses the view. */
function graticule(c: CanvasRenderingContext2D, style: PeriodStyle, o: Point, center: Point, span: number, CW: number, CH: number, aspect: number) {
  const degrees = span / 2048;
  const step = [0.1, 0.25, 0.5, 1, 2, 5, 10].find((s) => degrees / s <= 5) ?? 10;
  const left = (o.x + center.x - span / 2) / 2048, right = (o.x + center.x + span / 2) / 2048;
  const top = -(o.y + center.y - (span * aspect) / 2) / 2048, bottom = -(o.y + center.y + (span * aspect) / 2) / 2048;
  c.strokeStyle = style === "survey" ? "rgba(60,90,130,0.35)" : "rgba(60,50,40,0.3)";
  c.fillStyle = style === "survey" ? "rgba(60,90,130,0.8)" : "rgba(60,50,40,0.8)";
  c.lineWidth = 1;
  c.font = "italic 16px Georgia, serif";
  const label = (v: number, pos: string, neg: string) => `${+Math.abs(v).toFixed(2)}°${v >= 0 ? pos : neg}`;
  for (let lon = Math.ceil(left / step) * step; lon < right; lon += step) {
    const x = ((lon - left) / (right - left)) * CW;
    c.beginPath(); c.moveTo(x, 0); c.lineTo(x, CH); c.stroke();
    c.fillText(label(lon, "E", "W"), x + 4, CH - 30);
  }
  for (let lat = Math.ceil(bottom / step) * step; lat < top; lat += step) {
    const y = ((top - lat) / (top - bottom)) * CH;
    c.beginPath(); c.moveTo(0, y); c.lineTo(CW, y); c.stroke();
    c.fillText(label(lat, "N", "S"), 30, y - 4);
  }
}

function ornaments(c: CanvasRenderingContext2D, style: PeriodStyle, coast: Float32Array, cols: number, rows: number, G: number, CW: number, CH: number, tpp: number) {
  // The open sea furthest from any shore, for a compass rose.
  let best = -1, far = 0;
  // Not in the lower right, where the cartouche sits.
  for (let j = 4; j < rows - 4; j++)
    for (let i = 4; i < cols - 4; i++)
      if ((i < cols * 0.7 || j < rows * 0.6) && -coast[j * cols + i] > far) far = -coast[j * cols + i], best = j * cols + i;
  const sea = best >= 0 && far / tpp > 90;
  const rx = sea ? (best % cols) * G : CW * 0.12, ry = sea ? Math.floor(best / cols) * G : CH * 0.8;
  if (style === "portolan") {
    // Rhumb lines: sixteen winds from the rose, in black, green and red.
    for (let n = 0; n < 32; n++) {
      const a = (n / 32) * Math.PI * 2;
      c.strokeStyle = n % 4 === 0 ? "rgba(40,30,20,0.45)" : n % 2 ? "rgba(170,50,40,0.35)" : "rgba(60,120,70,0.4)";
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(a) * CW * 1.5, ry + Math.sin(a) * CW * 1.5); c.stroke();
    }
    rose(c, rx, ry, 58, true);
  } else if (style === "engraved") rose(c, rx, ry, 44, false);
  else if (style === "islamic") {
    // A gilt eight-point star.
    star(c, rx, ry, 40, 8, "#c89b3c", "#6a2a1a");
  } else if (style === "ink") {
    // The collector's red seal.
    c.save();
    c.translate(CW - 110, CH - 120);
    c.rotate(-0.03);
    c.fillStyle = "rgba(178,40,32,0.85)";
    c.fillRect(0, 0, 64, 64);
    c.fillStyle = "#f3e7d3";
    c.font = "bold 26px 'Songti SC', 'STSong', 'SimSun', serif";
    c.textAlign = "center";
    c.fillText("地", 32, 28);
    c.fillText("圖", 32, 56);
    c.restore();
  } else if (style === "codex") {
    // A sun disc, borrowed from codex skies.
    star(c, 80, 80, 26, 8, "#e0b040", "#1e1812");
  }
}

function rose(c: CanvasRenderingContext2D, x: number, y: number, r: number, colour: boolean) {
  for (let n = 0; n < 16; n++) {
    const a = (n / 16) * Math.PI * 2 - Math.PI / 2, len = n % 4 === 0 ? r : n % 2 === 0 ? r * 0.7 : r * 0.45;
    const side = (Math.PI * 2) / 32;
    for (const half of [0, 1]) {
      c.fillStyle = colour
        ? (n % 4 === 0 ? (half ? "#2c2018" : "#c9a24a") : n % 2 === 0 ? (half ? "#2e6a44" : "#e8dcc0") : (half ? "#a8362a" : "#e8dcc0"))
        : (half ? "#2c2620" : "#f4eee0");
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      const b = a + (half ? side : -side);
      c.lineTo(x + Math.cos(b) * len * 0.22, y + Math.sin(b) * len * 0.22);
      c.closePath();
      c.fill();
      c.strokeStyle = "#2c2018"; c.lineWidth = 0.8; c.stroke();
    }
  }
  c.fillStyle = "#2c2018";
  c.font = "bold 20px Georgia, serif";
  c.textAlign = "center";
  c.fillText("N", x, y - r - 6);
  c.beginPath(); c.arc(x, y, 4, 0, Math.PI * 2); c.fillStyle = colour ? "#c9a24a" : "#f4eee0"; c.fill(); c.stroke();
}

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, points: number, fill: string, ink: string) {
  c.fillStyle = fill; c.strokeStyle = ink; c.lineWidth = 1.5;
  c.beginPath();
  for (let n = 0; n < points * 2; n++) {
    const a = (n / (points * 2)) * Math.PI * 2 - Math.PI / 2, len = n % 2 ? r * 0.55 : r;
    c.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.arc(x, y, r * 0.3, 0, Math.PI * 2); c.stroke();
}

/** Footprints stepping along a road, for the codex style. */
export function footprints(points: Point[], spacing = 9) {
  const out: { x: number; y: number; angle: number }[] = [];
  let carry = 0, n = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y), angle = Math.atan2(b.y - a.y, b.x - a.x);
    let t = carry;
    for (; t < len; t += spacing, n++) {
      const side = n % 2 ? 1.6 : -1.6;
      out.push({
        x: a.x + (b.x - a.x) * (t / len) - Math.sin(angle) * side,
        y: a.y + (b.y - a.y) * (t / len) + Math.cos(angle) * side,
        angle: (angle * 180) / Math.PI,
      });
    }
    carry = t - len;
  }
  return out;
}
