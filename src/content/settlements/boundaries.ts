import type { Boundary } from "../agriculture/types";
import type { WorldSetting } from "../geography/types";

/** How a standing boundary is built, which decides how it is drawn.
 * rail: posts with rails or wire between. paling: close upright stakes.
 * weave: rods woven between stakes. wall: masonry or earth with a top.
 * hedge: a living or cut-brush mass. */
export type BoundaryForm = "rail" | "paling" | "weave" | "wall" | "hedge";

/** Outline, shadow, body, light, highlight. */
type Ramp = readonly [string, string, string, string, string];

export type BoundaryStyle = {
  name: string;
  form: BoundaryForm;
  /** Height of the body above its foot, in pixels. */
  height: number;
  /** Ground thickness: how deep the top of a wall or hedge reads. */
  depth: number;
  ramp: Ramp;
  /** rail: heights of the rails' top rows. paling: the rails behind. */
  rails?: readonly number[];
  /** rail: one post per this many cells along a straight run. */
  pitch?: number;
  /** rail: post width. wire posts are thin. */
  post?: number;
  /** rail: rails are single-pixel wire. */
  wire?: boolean;
  /** paling: stake width, gap and top. */
  stake?: {
    width: number;
    gap: number;
    top: "point" | "flat" | "ragged";
    /** Bamboo: a node every this many pixels up the culm. */
    nodes?: number;
  };
  /** Posts stand proud at corners and run ends. */
  corners?: boolean;
  /** wall: face texture and top. */
  bond?: "rubble" | "brick" | "block" | "plaster" | "rammed";
  cap?: "flat" | "round" | "coping" | "tile";
  capRamp?: Ramp;
  /** hedge: fraction of the body that is gaps in the brush. */
  sparse?: number;
};

const timber: Ramp = ["#2a1a10", "#4e3522", "#735035", "#98714a", "#b58d60"];
const grey: Ramp = ["#2c2822", "#57504a", "#7a736a", "#9d968b", "#bdb6a9"];

export const boundaryStyles: Partial<Record<Boundary, BoundaryStyle>> = {
  fence: {
    name: "Post and rail",
    form: "rail",
    height: 13,
    depth: 2,
    ramp: timber,
    rails: [11, 6],
    pitch: 1,
    post: 4,
  },
  wire: {
    name: "Wire fence",
    form: "rail",
    height: 12,
    depth: 1,
    ramp: grey,
    rails: [10, 6, 2],
    pitch: 2,
    post: 2,
    wire: true,
  },
  wattle: {
    name: "Wattle hurdle",
    form: "weave",
    height: 10,
    depth: 2,
    ramp: ["#2e2215", "#5a4428", "#7e6238", "#a2854f", "#bca068"],
    corners: true,
  },
  paling: {
    name: "Paling",
    form: "paling",
    height: 13,
    depth: 2,
    ramp: ["#2a1d14", "#57412c", "#7a5d3f", "#9c7c56", "#b7976c"],
    rails: [10, 3],
    stake: { width: 2, gap: 1, top: "point" },
    corners: true,
  },
  picket: {
    name: "Picket fence",
    form: "paling",
    height: 11,
    depth: 2,
    ramp: ["#3a3a3c", "#9a9a92", "#c9c8bd", "#e6e4d8", "#f7f6ee"],
    rails: [8, 3],
    stake: { width: 2, gap: 2, top: "point" },
    corners: true,
  },
  palisade: {
    name: "Palisade",
    form: "paling",
    height: 16,
    depth: 3,
    ramp: ["#22170e", "#4a3321", "#6a4b31", "#8a6845", "#a5835a"],
    stake: { width: 3, gap: 0, top: "point" },
  },
  bamboo: {
    name: "Bamboo fence",
    form: "paling",
    height: 12,
    depth: 2,
    ramp: ["#2f2a14", "#6d6530", "#978c45", "#bdb15e", "#d8cd80"],
    rails: [8, 3],
    stake: { width: 2, gap: 0, top: "flat", nodes: 7 },
    corners: true,
  },
  reed: {
    name: "Reed screen",
    form: "paling",
    height: 11,
    depth: 2,
    ramp: ["#3a2c16", "#7e6536", "#a88a4c", "#c8ac66", "#dcc584"],
    rails: [7],
    stake: { width: 1, gap: 0, top: "ragged" },
  },
  thorn: {
    name: "Thorn hedge",
    form: "hedge",
    height: 8,
    depth: 6,
    ramp: ["#241d12", "#4a3e26", "#6a5a36", "#877548", "#a08c58"],
    sparse: 0.28,
  },
  hedge: {
    name: "Hedge",
    form: "hedge",
    height: 11,
    depth: 6,
    ramp: ["#18251a", "#2b4a2a", "#3f6634", "#5b8543", "#7ba35a"],
  },
  wall: {
    name: "Dry-stone wall",
    form: "wall",
    height: 10,
    depth: 6,
    ramp: ["#2e2b26", "#6a655a", "#8d877a", "#aca598", "#c8c2b3"],
    bond: "rubble",
    cap: "flat",
  },
  plaster: {
    name: "Plastered wall",
    form: "wall",
    height: 12,
    depth: 5,
    ramp: ["#3a3129", "#a8987e", "#cbbd9f", "#ded3b8", "#eee7d2"],
    bond: "plaster",
    cap: "tile",
    capRamp: ["#3b1f16", "#7a3d27", "#9c5234", "#b86c45", "#cf8a5e"],
  },
  mud: {
    name: "Mud wall",
    form: "wall",
    height: 11,
    depth: 6,
    ramp: ["#3b2a1a", "#8f6c47", "#ad8a5f", "#c6a676", "#d9bd8d"],
    bond: "plaster",
    cap: "round",
  },
  mudbrick: {
    name: "Mudbrick wall",
    form: "wall",
    height: 11,
    depth: 6,
    ramp: ["#3b2a1a", "#8a6843", "#a9865b", "#c3a273", "#d5b989"],
    bond: "block",
    cap: "round",
  },
  brick: {
    name: "Brick wall",
    form: "wall",
    height: 12,
    depth: 5,
    ramp: ["#2f1712", "#6e3326", "#8e4632", "#a95c43", "#c07a5c"],
    bond: "brick",
    cap: "coping",
    capRamp: ["#2e2b26", "#6f6a60", "#948e82", "#b1ab9e", "#cbc6b9"],
  },
  rammed: {
    name: "Rammed-earth wall",
    form: "wall",
    height: 13,
    depth: 6,
    ramp: ["#3a2c1e", "#8c7250", "#a88c66", "#bfa47c", "#d2ba92"],
    bond: "rammed",
    cap: "tile",
    capRamp: ["#1d1f22", "#3c4046", "#555a60", "#6d7278", "#868b90"],
  },
};

export const standingStyle = (b: Boundary | undefined) =>
  b ? boundaryStyles[b] : undefined;

type Weighted = readonly (readonly [Boundary, number])[];

/** What a household fences its yard with, by culture, date and climate.
 * Several answers carry weights so a street is not one fence repeated. */
export function yardBoundaries(setting: WorldSetting | undefined): Weighted {
  if (!setting) return [["fence", 1]];
  const { culture, climate, year } = setting;
  const dry = climate === "arid";
  const warm = climate === "mediterranean";
  // Before metal, hurdles and brush everywhere; earth where there is no wood.
  if (year < -3500)
    return dry || culture === "north-african-west-asian"
      ? [["mud", 0.5], ["wattle", 0.3], ["reed", 0.2]]
      : [["wattle", 0.7], ["thorn", 0.3]];
  const modern = year >= 1880;
  switch (culture) {
    case "european":
      if (warm)
        return year < 1500
          ? [["wall", 0.45], ["plaster", 0.35], ["wattle", 0.2]]
          : [["plaster", 0.45], ["wall", 0.4], ["paling", 0.15]];
      if (year < -800) return [["wattle", 0.75], ["hedge", 0.25]];
      if (year < 1500) return [["wattle", 0.5], ["fence", 0.3], ["hedge", 0.2]];
      if (!modern)
        return [["paling", 0.35], ["hedge", 0.25], ["fence", 0.2], ["brick", 0.2]];
      return [["picket", 0.35], ["hedge", 0.3], ["brick", 0.2], ["wire", 0.15]];
    case "north-african-west-asian":
      if (warm) return [["wall", 0.4], ["plaster", 0.35], ["mud", 0.25]];
      return year < -800
        ? [["mudbrick", 0.6], ["mud", 0.4]]
        : [["mud", 0.5], ["mudbrick", 0.3], ["reed", 0.2]];
    case "inner-eurasian":
      return dry
        ? [["mud", 0.6], ["rammed", 0.4]]
        : [["wattle", 0.55], ["fence", 0.45]];
    case "south-asian":
      return [["mud", 0.4], ["thorn", 0.35], ["bamboo", 0.25]];
    case "east-asian":
      return year < -800
        ? [["rammed", 0.5], ["wattle", 0.5]]
        : [["bamboo", 0.45], ["rammed", 0.35], ["hedge", 0.2]];
    case "southeast-asian":
      return [["bamboo", 0.7], ["hedge", 0.3]];
    case "west-central-african":
      return dry || climate === "monsoon"
        ? [["mud", 0.5], ["reed", 0.5]]
        : [["reed", 0.45], ["palisade", 0.3], ["hedge", 0.25]];
    case "east-southern-african":
      return [["thorn", 0.5], ["reed", 0.3], ["palisade", 0.2]];
    case "mesoamerican":
      return [["reed", 0.45], ["wall", 0.3], ["hedge", 0.25]];
    case "andean":
      return [["wall", 0.7], ["mud", 0.3]];
    case "other-indigenous-american":
      if (year < 1600) return [["palisade", 0.4], ["wattle", 0.3], ["reed", 0.3]];
      return modern
        ? [["picket", 0.4], ["wire", 0.4], ["fence", 0.2]]
        : [["fence", 0.5], ["paling", 0.3], ["picket", 0.2]];
    case "australian-pacific":
      return modern
        ? [["picket", 0.4], ["wire", 0.4], ["reed", 0.2]]
        : [["reed", 0.5], ["bamboo", 0.3], ["wattle", 0.2]];
  }
  return [["fence", 1]];
}

/** Pick from weighted boundaries with a roll in [0, 1). */
export function pickBoundary(options: Weighted, roll: number): Boundary {
  const total = options.reduce((s, [, w]) => s + w, 0);
  let t = roll * total;
  for (const [b, w] of options) if ((t -= w) < 0) return b;
  return options[options.length - 1][0];
}

/** Stock pens where the local answer is not the era's rails: thorn kraals
 * in eastern and southern Africa and the Sahel, stone corrals in the Andes. */
export function penBoundary(setting: WorldSetting | undefined): Boundary | undefined {
  if (!setting) return;
  if (setting.culture === "east-southern-african") return "thorn";
  if (setting.culture === "west-central-african" && setting.climate !== "tropical")
    return "thorn";
  if (setting.culture === "south-asian") return "thorn";
  if (setting.culture === "andean") return "wall";
}
