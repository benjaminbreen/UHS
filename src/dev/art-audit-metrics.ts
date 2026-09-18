/** What the audit measures, and what a number means when you see one.
 *
 * `scripts/art_audit.py` writes the numbers and takes no view on them. The
 * thresholds live here so a question like "how dark is too dark for a rim"
 * can be answered by dragging a slider instead of by rebuilding the art.
 *
 * There is deliberately no palette-conformance metric. Limiting colour to a
 * declared list flags the door lanterns, which are good, and the game wants
 * many palettes so climates and seasons read differently. What is worth
 * measuring is how a surface is drawn, not which colours it is drawn in.
 */

export type Sprite = {
  key: string;
  kind: string;
  family: string;
  source: "packs" | "buildings" | "props";
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
  flatTone: number;
  interiorTones: number;
  hardEdges: number;
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
  id: string;
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
const two = (v: number) => v.toFixed(2);

export const METRICS: Metric[] = [
  {
    id: "flatTone",
    label: "Flat body",
    note: "Largest share of the interior held by one colour. The difference between a lit surface and a flat shape with a dark patch on it: the amphora sits at 36%, the door lantern at 13%.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "high",
    format: pct,
  },
  {
    id: "hardEdges",
    label: "Hard steps",
    note: "Share of touching interior pixels that jump more than a quarter of the sprite's range. A turned surface steps a little many times; a pasted-on shadow steps a lot, rarely.",
    min: 0,
    max: 1,
    step: 0.01,
    worse: "high",
    format: pct,
  },
  {
    id: "interiorTones",
    label: "Interior tones",
    note: "Colours inside the rim. Judge against size, which the median beside it does for you.",
    min: 0,
    max: 40,
    step: 1,
    worse: "low",
  },
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
    format: two,
  },
  {
    id: "rimChroma",
    label: "Rim colour",
    note: "Rim saturation against the body's. Below about 0.7 the outline has had the colour drained out of it: a shared near-black rather than the material's own dark step.",
    min: 0,
    max: 1.6,
    step: 0.01,
    worse: "low",
    format: two,
  },
  {
    id: "gradY",
    label: "Vertical gradient",
    note: "Value against height. A lit form ramps; near zero is a surface with texture but no light on it, which is how a flat roof scores.",
    min: -1.5,
    max: 1.5,
    step: 0.01,
    worse: "low",
    format: two,
  },
  {
    id: "gradX",
    label: "Horizontal gradient",
    note: "The same across the width. Light comes from the upper left, so a wall should fall away to the right.",
    min: -1.5,
    max: 1.5,
    step: 0.01,
    worse: "low",
    format: two,
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
    id: "tones",
    label: "Tones",
    note: "Distinct colours used, rim included.",
    min: 0,
    max: 60,
    step: 1,
    worse: "low",
  },
  {
    id: "lumRange",
    label: "Value range",
    note: "Darkest to lightest. A low range is a sprite that will vanish against the ground.",
    min: 0,
    max: 255,
    step: 1,
    worse: "low",
  },
  {
    id: "lumMean",
    label: "Mean value",
    note: "Overall brightness. Compare against the family, not in the absolute: this is how you find the one prop too dark for its neighbours.",
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
    note: "Mean saturation. Useful for spotting the one prop more colourful than everything around it.",
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
    note: "Opaque share of the bounding box.",
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
    id: "crude",
    label: "Crude modelling",
    blurb:
      "A body carrying one flat colour with hard steps in it, rather than a turned surface. This is the amphora-against-the-door-lantern question: both are round, only one is lit.",
    ranges: { flatTone: [0.28, 1], hardEdges: [0.18, 1] },
    sort: "flatTone",
  },
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
    id: "ink",
    label: "Neutral ink",
    blurb:
      "Outlined in something greyer than the object itself. A material's own darkest step keeps its hue; one shared near-black flattens everything it touches into the same drawing.",
    ranges: { rimChroma: [0, 0.65], chroma: [0.12, 1] },
    sort: "rimChroma",
  },
  {
    id: "flat",
    label: "No light on it",
    blurb:
      "Texture but no gradient in either axis. Roofs and walls land here when tone is chosen per tile at random.",
    ranges: {
      gradY: [-0.12, 0.12],
      gradX: [-0.12, 0.12],
      pixels: [1200, 40000],
    },
    sort: "pixels",
    desc: true,
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
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
