import type { SkillId } from "../core/skills";

type Point = readonly [number, number];

export type ConstellationDef = {
  title: string;
  epigraph: string;
  /** In lighting order: the first lights at level 1, the last at level 10.
   * Units are sky units, about ±50 around the constellation's centre. */
  stars: readonly Point[];
  lines: readonly Point[];
  /** Where it hangs in a landscape sky (1000 × 560) and a portrait one
   * (600 × 1000). */
  wide: Point;
  tall: Point;
};

export const CONSTELLATIONS: Record<SkillId, ConstellationDef> = {
  hunting: {
    title: "The Stag",
    epigraph: "Follow the hoofprint to the edge of the known wood.",
    stars: [[0, 40], [-14, 12], [14, 12], [-9, -4], [9, -4], [-24, -22], [24, -22], [-40, -30], [40, -30], [-28, -48], [28, -48]],
    lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [3, 5], [5, 7], [5, 9], [4, 6], [6, 8], [6, 10]],
    wide: [110, 130],
    tall: [110, 110],
  },
  foraging: {
    title: "The Bough",
    epigraph: "The forest keeps a pantry for those who know its doors.",
    stars: [[-40, 36], [-22, 20], [-30, 2], [-5, 8], [4, 28], [12, -8], [26, 8], [28, -25], [12, -34], [42, -42]],
    lines: [[0, 1], [1, 2], [1, 3], [3, 4], [3, 5], [5, 6], [5, 7], [7, 8], [7, 9]],
    wide: [120, 322],
    tall: [300, 150],
  },
  farming: {
    title: "The Sheaf",
    epigraph: "What is sown in patience is reaped in bread.",
    stars: [[0, 46], [-14, 44], [14, 44], [0, 12], [-12, -6], [12, -6], [-30, -36], [-10, -46], [10, -46], [30, -36]],
    lines: [[0, 3], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [4, 7], [5, 8], [5, 9]],
    wide: [252, 218],
    tall: [490, 110],
  },
  animals: {
    title: "The Ram",
    epigraph: "The herd trusts the hand that does not hurry.",
    stars: [[-38, 22], [-18, 28], [-20, -4], [-2, -16], [14, 4], [12, -34], [32, -30], [40, -10], [28, 8], [20, -8]],
    lines: [[0, 1], [0, 2], [2, 3], [3, 4], [1, 4], [3, 5], [5, 6], [6, 7], [7, 8], [8, 9]],
    wide: [262, 395],
    tall: [120, 290],
  },
  marksmanship: {
    title: "The Bow",
    epigraph: "The string remembers every breath you held.",
    stars: [[-16, 0], [-9, -28], [-9, 28], [10, -48], [10, 48], [28, 0], [36, -7], [-44, 0], [-36, -8], [-36, 8]],
    lines: [[0, 1], [1, 3], [0, 2], [2, 4], [3, 5], [4, 5], [5, 0], [0, 7], [7, 8], [7, 9], [5, 6]],
    wide: [400, 122],
    tall: [310, 330],
  },
  arms: {
    title: "The Blade",
    epigraph: "Weight first, then edge, then nerve.",
    stars: [[-30, 36], [-20, 26], [-8, 12], [-22, 0], [4, 26], [10, -16], [22, -34], [32, -48]],
    lines: [[0, 1], [1, 2], [2, 3], [2, 4], [2, 5], [5, 6], [6, 7]],
    wide: [420, 305],
    tall: [490, 290],
  },
  woodcraft: {
    title: "The Axe",
    epigraph: "Every hearth begins with a tree that fell.",
    stars: [[-32, 46], [-18, 22], [-4, -2], [8, -24], [-2, -36], [22, -46], [32, -28], [20, -10]],
    lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [6, 7], [7, 3]],
    wide: [575, 205],
    tall: [110, 480],
  },
  stonework: {
    title: "The Dolmen",
    epigraph: "Stone is patient. Be more patient.",
    stars: [[-28, 46], [24, 46], [-28, 8], [24, 8], [-42, -4], [-8, -16], [20, -14], [42, -2], [-2, 28]],
    lines: [[0, 2], [1, 3], [4, 5], [5, 6], [6, 7], [2, 5], [3, 6]],
    wide: [600, 385],
    tall: [300, 520],
  },
  crafting: {
    title: "The Anvil",
    epigraph: "The hand learns what the eye cannot teach.",
    stars: [[-44, -8], [-20, -14], [28, -14], [38, -4], [-6, 10], [14, 10], [-18, 34], [26, 34]],
    lines: [[0, 1], [1, 2], [2, 3], [1, 4], [2, 5], [4, 6], [5, 7], [6, 7]],
    wide: [900, 400],
    tall: [300, 860],
  },
  speech: {
    title: "The Lyre",
    epigraph: "A tale well told outlives its teller.",
    stars: [[0, 44], [-20, 32], [20, 32], [-30, 2], [30, 2], [-24, -28], [24, -28], [-36, -44], [36, -44], [0, -28]],
    lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [6, 8], [5, 9], [9, 6], [0, 9]],
    wide: [748, 122],
    tall: [490, 480],
  },
  trade: {
    title: "The Scales",
    epigraph: "Every bargain is a small peace.",
    stars: [[0, 46], [0, 8], [0, -28], [-36, -22], [36, -26], [-46, 10], [-26, 10], [26, 4], [46, 4], [0, -44]],
    lines: [[0, 1], [1, 2], [2, 3], [2, 4], [3, 5], [3, 6], [5, 6], [4, 7], [4, 8], [7, 8], [2, 9]],
    wide: [772, 312],
    tall: [160, 680],
  },
  wayfaring: {
    title: "The Ship",
    epigraph: "The road and the river are the same road.",
    stars: [[-44, 14], [-22, 32], [22, 32], [46, 10], [0, 18], [0, -14], [0, -46], [32, 4], [-14, -42]],
    lines: [[0, 1], [1, 2], [2, 3], [0, 4], [4, 3], [4, 5], [5, 6], [6, 7], [7, 5], [6, 8]],
    wide: [905, 215],
    tall: [440, 690],
  },
};

const TIER_LEVELS = [2, 4, 6] as const;

/** Which stars hold the techniques: the ones that light exactly at levels
 * 2, 4 and 6. */
export const milestoneStars = (count: number) =>
  TIER_LEVELS.map((t) => Math.max(0, Math.round((count * t) / 10) - 1));

/** Stars lit, fractional, for a level and the way into the next. Piecewise so
 * each technique star lights on its own level and not before. */
export function litStars(count: number, level: number, into: number) {
  const x = Math.min(10, level + into);
  const at = [0, ...TIER_LEVELS, 10];
  const lit = [0, ...milestoneStars(count).map((i) => i + 1), count];
  for (let i = 1; i < at.length; i++)
    if (x <= at[i])
      return lit[i - 1] + ((x - at[i - 1]) / (at[i] - at[i - 1])) * (lit[i] - lit[i - 1]);
  return count;
}
