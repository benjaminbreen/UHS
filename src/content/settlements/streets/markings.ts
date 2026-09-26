import type { WorldSetting } from "../../geography/types";
import { motorized } from "../modernity";

/** How a carriageway is painted and finished. Chosen by place and date here;
 * the street raster only draws what the style names. */
export type RoadMarkings = {
  id: string;
  /** Which side of the road traffic keeps to: where the stop line and the
   * parked cars go. */
  drive: "right" | "left";
  centre: "none" | "white-dashed" | "white-solid" | "yellow-double" | "yellow-dashed";
  /** Dashed lines between travel lanes on a wide street. */
  lanes: boolean;
  crossing: "none" | "zebra" | "ladder" | "lines";
  stopLine: boolean;
  /** The strip of roadway along the kerb that carries the water. */
  gutter: "concrete" | "sett" | "none";
  /** Outer lanes of a wide street kept for parked cars, with stall ticks. */
  parking: boolean;
};

/** Carriageway widths in cells for the arterial, street and alley of a
 * motor-age city: a parking lane of two cells each side of two travel lanes,
 * three cells wide on an arterial and two on a street. */
export const MOTOR_SPANS = [10, 8, 3] as const;
/** Cells of parking lane along each kerb, where a style parks at all. */
export const PARKING = 2;
/** Cells of kerb per parking stall: the longest car of the fifties fits. */
export const STALL = 6;

type Rule = RoadMarkings & {
  from: number;
  to: number;
  bounds: readonly [number, number, number, number];
};

// Where traffic kept left by 1970. Sweden switched in 1967, Ghana and Nigeria
// in 1972-74; those are left out of the left-hand boxes.
const LEFT: (readonly [number, number, number, number])[] = [
  [-11, 49.8, 2, 61], // Britain and Ireland
  [128, 24, 146, 46], // Japan
  [110, -48, 179, -10], // Australia and New Zealand
  [60, 5, 92.7, 37], // South Asia
  [95, -11, 120, 7], // Malaysia, Singapore, Indonesia
  [97, 5, 106, 21], // Thailand
  [113.8, 22.1, 114.5, 22.6], // Hong Kong
  [16, -35, 41, 0], // Southern and East Africa
];
const leftHand = (s: Pick<WorldSetting, "lon" | "lat">) =>
  LEFT.some(([w, south, e, n]) => s.lon >= w && s.lon <= e && s.lat >= south && s.lat <= n);

const WORLD = [-180, -90, 180, 90] as const;
const rules: Rule[] = [
  {
    id: "north-american-early",
    from: 1917,
    to: 1971,
    bounds: [-170, 14, -52, 72],
    drive: "right",
    centre: "white-dashed",
    lanes: true,
    crossing: "lines",
    stopLine: true,
    gutter: "concrete",
    parking: true,
  },
  {
    // The 1971 MUTCD made yellow the colour dividing opposing traffic.
    id: "north-american",
    from: 1971,
    to: 10000,
    bounds: [-170, 14, -52, 72],
    drive: "right",
    centre: "yellow-double",
    lanes: true,
    crossing: "ladder",
    stopLine: true,
    gutter: "concrete",
    parking: true,
  },
  {
    // Zebra crossings from 1951; white centre dashes throughout.
    id: "british",
    from: 1930,
    to: 10000,
    bounds: [-11, 49.8, 2, 61],
    drive: "left",
    centre: "white-dashed",
    lanes: true,
    crossing: "zebra",
    stopLine: true,
    gutter: "concrete",
    parking: true,
  },
  {
    id: "japanese",
    from: 1950,
    to: 10000,
    bounds: [128, 24, 146, 46],
    drive: "left",
    centre: "white-solid",
    lanes: true,
    crossing: "zebra",
    stopLine: true,
    gutter: "concrete",
    parking: false,
  },
  {
    id: "chinese",
    from: 1985,
    to: 10000,
    bounds: [97, 18, 135, 54],
    drive: "right",
    centre: "yellow-double",
    lanes: true,
    crossing: "zebra",
    stopLine: true,
    gutter: "concrete",
    parking: false,
  },
  {
    id: "latin-american",
    from: 1950,
    to: 10000,
    bounds: [-118, -56, -34, 33],
    drive: "right",
    centre: "yellow-dashed",
    lanes: true,
    crossing: "zebra",
    stopLine: true,
    gutter: "concrete",
    parking: true,
  },
  {
    // Continental Europe: white dashes, zebras, a sett gutter along the kerb.
    id: "continental",
    from: 1930,
    to: 10000,
    bounds: [-11, 34, 60, 72],
    drive: "right",
    centre: "white-dashed",
    lanes: true,
    crossing: "zebra",
    stopLine: true,
    gutter: "sett",
    parking: true,
  },
  {
    id: "international",
    from: 1950,
    to: 10000,
    bounds: WORLD,
    drive: "right",
    centre: "white-dashed",
    lanes: true,
    crossing: "zebra",
    stopLine: true,
    gutter: "concrete",
    parking: false,
  },
];

const bare: RoadMarkings = {
  id: "unmarked",
  drive: "right",
  centre: "none",
  lanes: false,
  crossing: "none",
  stopLine: false,
  gutter: "concrete",
  parking: false,
};

/** The one line a two-lane country road carries down its middle. */
export const blacktopLine = (centre: RoadMarkings["centre"]) =>
  centre.startsWith("yellow") ? "yellow" : centre === "none" ? "none" : "white";

/** Paint arrives with motor traffic; before it a street is guttered but
 * unmarked. */
export function roadMarkings(s: WorldSetting): RoadMarkings {
  const rule = rules.find(
    ({ from, to, bounds: [w, south, e, n] }) =>
      s.year >= from && s.year < to && s.lon >= w && s.lon <= e && s.lat >= south && s.lat <= n,
  );
  const drive = leftHand(s) ? "left" : "right";
  if (!rule) return { ...bare, drive };
  const { from, to, bounds, ...style } = rule;
  return { ...style, drive, parking: style.parking && motorized(s) };
}
