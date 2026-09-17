/** What the audit measures, and what a number means when you see one.
 *
 * `scripts/art_audit.py` writes the numbers and takes no view on them. The
 * thresholds live here so a question like "how dark is too dark for a rim"
 * can be answered by dragging a slider instead of by rebuilding the art.
 */

export type Sprite = {
  key: string;
  kind: string;
  family: string;
  source: "packs" | "props";
  atlas: [number, number, number, number];
  pixels: number;
  w: number;
  h: number;
  fill: number;
  tones: number;
  lumMin: number;
  lumMax: number;
  lumRange: number;
  lumMean: number;
  lumP10: number;
  lumP90: number;
  banding: number;
  ringDark: number;
  ringDepth: number;
  rimGap: number;
  rimChroma: number;
  darkestFrac: number;
  offRamp: number;
  offRampDist: number;
  ramps?: string[];
  chroma: number;
  hueShift?: number;
  hueSpread: number;
  gradY: number;
  gradX: number;
  dither: number;
  binaryAlpha: boolean;
  edgeCut: string[];
  top: [string, number][];
};

export type Report = {
  generated: string;
  ramps: Record<string, string[]>;
  sprites: Sprite[];
};

export type Metric = {
  id: keyof Sprite & string;
  label: string;
  /** What a high number means, in one line, shown under the slider. */
  note: string;
  min: number;
  max: number;
  step: number;
  /** Which end is the suspicious one, for the default sort direction. */
  worse: "high" | "low";
  format?: (v: number) => string;
};

const pct = (v: number) => `${Math.round(v * 100)}%`;

export const METRICS: Metric[] = [
  {
    id: "ringDark",
    label: "Keyline",
    note: "Share of the silhouette ringed in the sprite's near-darkest tone. A tinted rim sits low; a hard black outline sits at 1.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "high",
    format: pct,
  },
  {
    id: "ringDepth",
    label: "Outline thickness",
    note: "How many pixels deep that dark rim runs. Two or more is the heavy outline that reads as crude at this scale.",
    min: 0,
    max: 6,
    step: 0.1,
    worse: "high",
    format: (v) => `${v.toFixed(1)}px`,
  },
  {
    id: "rimGap",
    label: "Rim harshness",
    note: "How far the rim drops below the body it surrounds, against the sprite's own range. An outline is not wrong for existing; it is wrong for being harsher than the form inside it.",
    min: 0,
    max: 1.2,
    step: 0.01,
    worse: "high",
    format: (v) => v.toFixed(2),
  },
  {
    id: "rimChroma",
    label: "Rim colour",
    note: "Rim saturation against the body's. Below about 0.7 the outline has had the colour drained out of it, which is a shared black ink rather than the material's own dark step.",
    min: 0,
    max: 1.6,
    step: 0.01,
    worse: "low",
    format: (v) => v.toFixed(2),
  },
  {
    id: "offRamp",
    label: "Off palette",
    note: "Share of pixels whose colour is in no declared ramp. High means colours typed into a draw call by hand.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "high",
    format: pct,
  },
  {
    id: "offRampDist",
    label: "Palette distance",
    note: "How far those off-palette colours sit from the nearest declared one. Small is a near-miss worth snapping; large is a different colour entirely.",
    min: 0,
    max: 120,
    step: 1,
    worse: "high",
  },
  {
    id: "gradY",
    label: "Vertical gradient",
    note: "Value against height. A lit form ramps; near zero is a surface with texture but no light on it, which is how a flat roof scores.",
    min: -1.5,
    max: 1.5,
    step: 0.01,
    worse: "low",
    format: (v) => v.toFixed(2),
  },
  {
    id: "gradX",
    label: "Horizontal gradient",
    note: "The same across the width. Light comes from the upper left, so a wall should fall away to the right.",
    min: -1.5,
    max: 1.5,
    step: 0.01,
    worse: "low",
    format: (v) => v.toFixed(2),
  },
  {
    id: "tones",
    label: "Tones",
    note: "Distinct colours used. Under about six over a large sprite cannot carry grain, a rim and a lit edge at once.",
    min: 0,
    max: 60,
    step: 1,
    worse: "low",
  },
  {
    id: "banding",
    label: "Banding",
    note: "The widest jump between tones actually used, against the sprite's whole range. High means a short ramp stretched over a big object.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "high",
    format: pct,
  },
  {
    id: "lumRange",
    label: "Value range",
    note: "Darkest to lightest. A low range is a sprite that will vanish against the ground; a very high one is usually a black keyline.",
    min: 0,
    max: 255,
    step: 1,
    worse: "low",
  },
  {
    id: "lumMean",
    label: "Mean value",
    note: "Overall brightness. Compare against the family, not in the absolute: this is how you find the one prop that is too dark for its neighbours.",
    min: 0,
    max: 255,
    step: 1,
    worse: "low",
  },
  {
    id: "hueShift",
    label: "Hue shift",
    note: "Degrees between the hue of the shadows and of the lights. Zero is one hue at several brightnesses, which is the flat, plasticky look.",
    min: -60,
    max: 60,
    step: 1,
    worse: "low",
    format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(0)}°`,
  },
  {
    id: "chroma",
    label: "Chroma",
    note: "Mean saturation. Useful for spotting the one prop that is more colourful than everything around it.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "high",
    format: pct,
  },
  {
    id: "dither",
    label: "Dither",
    note: "Share of pixels in a checkerboard. Some is right on a boundary; a whole sprite of it is texture standing in for form.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "high",
    format: pct,
  },
  {
    id: "darkestFrac",
    label: "Darkest tone",
    note: "Share of the sprite that is its single darkest colour. Over a third usually means the outline pass ran after the thin details.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "high",
    format: pct,
  },
  {
    id: "fill",
    label: "Fill",
    note: "Opaque share of the bounding box. Very low is a sprite that is mostly empty space, which wastes atlas room.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "low",
    format: pct,
  },
  {
    id: "pixels",
    label: "Size",
    note: "Opaque pixel count. Mostly here to sort by, so small props and big buildings can be judged apart.",
    min: 0,
    max: 40000,
    step: 100,
    worse: "low",
  },
];

export const METRIC_BY_ID = Object.fromEntries(
  METRICS.map((m) => [m.id, m]),
) as Record<string, Metric>;

/** Named queries, so the common questions do not have to be rebuilt by hand. */
export type Preset = {
  id: string;
  label: string;
  blurb: string;
  ranges: Partial<Record<string, [number, number]>>;
  sort?: string;
  /** Overrides the sort metric's own bad end, for presets where the filter
   *  already isolates the fault and size is what ranks it. */
  desc?: boolean;
};

export const PRESETS: Preset[] = [
  {
    id: "keyline",
    label: "Hard keylines",
    blurb:
      "Ringed in near-black instead of a tinted rim. This is what makes the wells sit on top of the ground rather than in it.",
    ranges: { ringDark: [0.8, 1], rimGap: [0.3, 1.2] },
    sort: "rimGap",
  },
  {
    id: "thick",
    label: "Thick outlines",
    blurb:
      "A rim two or more pixels deep. On a small prop this doubles the apparent width of everything it touches.",
    ranges: { ringDepth: [2.2, 6] },
    sort: "ringDepth",
  },
  {
    id: "flat",
    label: "No light on it",
    blurb:
      "Texture but no gradient in either axis. Roofs and walls land here when tone is chosen per tile at random.",
    ranges: { gradY: [-0.12, 0.12], gradX: [-0.12, 0.12], pixels: [1200, 40000] },
    sort: "pixels",
    desc: true,
  },
  {
    id: "ink",
    label: "Neutral ink",
    blurb:
      "Outlined in something greyer than the object itself. A material's own darkest step keeps its hue; one shared near-black flattens everything it touches into the same drawing.",
    ranges: { rimChroma: [0, 0.65], chroma: [0.12, 1] },
    sort: "rimChroma",
  },
  {
    id: "offpalette",
    label: "Off palette",
    blurb:
      "Colours in no declared ramp. Sort by palette distance: near-misses are a snap, far ones are a decision someone made alone.",
    ranges: { offRamp: [0.35, 1] },
    sort: "offRamp",
  },
  {
    id: "banding",
    label: "Banding",
    blurb: "A short ramp stretched over a large object, so the steps show.",
    ranges: { banding: [0.28, 1], pixels: [800, 40000] },
    sort: "banding",
  },
  {
    id: "flathue",
    label: "One-hue ramps",
    blurb:
      "Shadow and light share a hue, so the ramp is a brightness slider rather than a lit surface.",
    ranges: { hueShift: [-4, 4], pixels: [600, 40000] },
    sort: "pixels",
    desc: true,
  },
  {
    id: "thin",
    label: "Too few tones",
    blurb: "A large sprite carrying fewer tones than it needs to read as solid.",
    ranges: { tones: [0, 7], pixels: [900, 40000] },
    sort: "pixels",
    desc: true,
  },
  {
    id: "mechanical",
    label: "Mechanical faults",
    blurb:
      "Clipped by the canvas edge, or carrying part-transparent alpha the shadow builder cannot use.",
    ranges: {},
    sort: "pixels",
    desc: true,
  },
];

/** Median of a metric within a group, for the "against its family" bars. */
export function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
