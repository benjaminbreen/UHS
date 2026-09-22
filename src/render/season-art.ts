/** Seasonal dress for scenery: which trees turn, what colour they turn, and
 * what blows through the air. The ground palette turns in habitat-appearance. */

const evergreen = [
  "pine",
  "spruce",
  "juniper",
  "palm",
  "saguaro",
  "mangrove",
  "eucalyptus",
  "bamboo",
  "tropical",
  "teak",
  "thorn",
  "baobab",
  "redwood",
  "douglas-fir",
  "cedar",
  "cypress",
  "olive",
  "acacia",
];
export function turnsColour(sprite: string) {
  return !evergreen.some((k) => sprite.includes(k));
}

/** Shrubs are placed as a generic sprite and named afterwards; where that
 * species has a drawing of its own, show the plant the label will name. The
 * berry bush keeps its sprite: its picked and unpicked states are drawn. */
export function namedShrub(
  sprite: string,
  species: string | undefined,
  has: (frame: string) => boolean,
) {
  if (!species || sprite === "ecology-berry-bush") return sprite;
  const named = `nature-shrub-${species}`;
  return has(named) ? named : sprite;
}

/** One of a sprite's drawn variants (`-2`, `-3`), so a wood is not one tree
 * stamped and mirrored. */
export function treeVariant(
  sprite: string,
  roll: number,
  has: (frame: string) => boolean,
) {
  const n = 1 + Math.floor(roll * 3);
  return n > 1 && has(`${sprite}-${n}`) ? `${sprite}-${n}` : sprite;
}
/** The frame drawn for the season, where one exists: leafless in winter,
 * turned in autumn. Returns the frame and whether it is already dressed, in
 * which case no tint should be laid over it. */
export function seasonFrame(
  sprite: string,
  season: string,
  ecology: string,
  has: (frame: string) => boolean,
): [string, boolean] {
  if (ecology === "tropical-woodland" || ecology === "desert" || !turnsColour(sprite))
    return [sprite, false];
  const dressed =
    season === "winter" ? `${sprite}-bare` : season === "autumn" ? `${sprite}-autumn` : "";
  return dressed && has(dressed) ? [dressed, true] : [sprite, false];
}

// Multiply tints, so each is read against the canopy's own green rather than
// replacing it. Autumn picks one per tree so a wood is mixed, not uniform.
const autumnTints = [0xffb457, 0xf0954a, 0xffd06a, 0xd9793f, 0xe8b96a];
const winterTint = 0xa79d86;

/** Tint for a tree canopy, or undefined to leave the sprite alone. */
export function foliageTint(
  sprite: string,
  season: string,
  ecology: string,
  variation: number,
): number | undefined {
  if (ecology === "tropical-woodland" || ecology === "desert") return undefined;
  if (!turnsColour(sprite)) return season === "winter" ? 0xc8d2d8 : undefined;
  if (season === "autumn")
    return autumnTints[Math.floor(variation * autumnTints.length) % autumnTints.length];
  if (season === "winter") return winterTint;
  if (season === "spring") return 0xd8ffc8;
  return undefined;
}

export type DriftKind = "leaf" | "blossom" | "seed" | "snow" | "rain";
export type DriftStyle = {
  kind: DriftKind;
  colors: string[];
  /** Motes per million world pixels of view, so density holds at any zoom. */
  density: number;
  /** Fall speed range in world pixels per second. */
  fall: [number, number];
  /** How hard the wind carries it sideways, px/s at full strength. */
  windPull: number;
  /** Lateral wobble on the gust, in pixels. */
  sway: number;
  /** Frames per second of tumble; 0 leaves the frame to the wind. */
  spin: number;
  alpha: number;
  splash?: boolean;
};

const styles: Record<DriftKind, Omit<DriftStyle, "colors" | "density">> = {
  leaf: { kind: "leaf", fall: [14, 30], windPull: 70, sway: 7, spin: 3, alpha: 0.85 },
  blossom: { kind: "blossom", fall: [10, 22], windPull: 60, sway: 9, spin: 2, alpha: 0.7 },
  seed: { kind: "seed", fall: [5, 13], windPull: 55, sway: 11, spin: 1.2, alpha: 0.65 },
  snow: { kind: "snow", fall: [12, 26], windPull: 48, sway: 6, spin: 1, alpha: 0.9 },
  rain: {
    kind: "rain",
    fall: [330, 470],
    windPull: 190,
    sway: 0,
    spin: 0,
    alpha: 0.45,
    splash: true,
  },
};
const drift = (
  kind: DriftKind,
  colors: string[],
  density: number,
): DriftStyle => ({ ...styles[kind], colors, density });


const woodland = ["temperate-woodland", "boreal-woodland", "riparian-woodland"];

/** What is in the air here, if anything. Falling weather outranks the
 * season's debris: nothing blows blossom about in a downpour. Quiet by
 * default, because a mote storm in every scene would be worse than a clear
 * sky. */
export function driftStyle(
  season: string,
  ecology: string,
  climate: string,
  condition: string,
  tempC: number,
): DriftStyle | undefined {
  if (condition === "rain")
    return tempC <= 0
      ? drift("snow", ["#ffffff", "#e4eef6", "#cfe0ee"], 230)
      : drift("rain", ["#cfe0ef", "#b9d0e4"], 520);
  const wooded = woodland.includes(ecology);
  if (season === "winter" && tempC < 2 && (climate === "boreal" || climate === "tundra"))
    return drift("snow", ["#ffffff", "#e4eef6", "#cfe0ee"], 90);
  if (ecology === "desert" || ecology === "tropical-woodland") return undefined;
  if (season === "autumn" && climate !== "tropical")
    return drift(
      "leaf",
      ["#d98a3f", "#e0a84e", "#c9673a", "#b9903f"],
      wooded ? 130 : 55,
    );
  if (season === "spring")
    return drift(
      "blossom",
      ["#f6dce8", "#ffffff", "#f3c9dc", "#efe4c4"],
      wooded ? 100 : 45,
    );
  if (season === "summer")
    return drift("seed", ["#f2eeda", "#e8e4c4"], 40);
  return undefined;
}
