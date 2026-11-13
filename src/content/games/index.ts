import type { CharacterScope } from "../characters/context-types";
import { matchesCharacterScope } from "../characters/resolve";
import type { WorldSetting } from "../geography/types";
import type { VenueKind } from "../venues/types";
import type { Side } from "../../core/games/knucklebones";

type Lines = readonly (readonly [string, string])[];

/** A game played for money at a table, where and when it was the game, and how sure we are of its rules. */
export type TableGame = {
  id: string;
  engine: "knucklebones" | "ur";
  title: string;
  aka: string;
  scope: CharacterScope;
  /** The venues it is played in here. */
  kinds: readonly VenueKind[];
  /** Knucklebones only: how the pot is won, and what the best throw is called. */
  rule?: "most" | "augustus";
  best?: string;
  /** Someone at the table may be throwing weighted bones. */
  cheat?: boolean;
  /** Opponents at the table besides the player. */
  seats: number;
  sides?: readonly (readonly [Side, string, string])[];
  lines: Lines;
  evidence: Lines;
};

const SIDES = [
  [1, "One", "the narrow notched side"],
  [3, "Three", "the broad bulging side"],
  [4, "Four", "the broad hollow side"],
  [6, "Six", "the narrow twisted side"],
] as const;

// First match wins.
export const tableGames: readonly TableGame[] = [
  {
    id: "ur",
    engine: "ur",
    title: "Twenty squares",
    aka: "the Royal Game of Ur",
    // Boards from the graves at Ur, c. 2600 BCE, to the Babylonian tablet of 177 BCE; boards are cut into
    // the gate bulls at Khorsabad, where the guards sat.
    scope: { years: [-2600, 100], bounds: [34, 28, 58, 38] },
    kinds: ["tavern", "gaming-house"],
    seats: 1,
    lines: [
      ["Throw", "Four three-sided dice, two tips of each marked. Count the marked tips that land up: 0 to 4."],
      ["Race", "Bring all seven pieces along your row, up the shared middle and off the far end. You need the exact throw to bear off."],
      ["Take", "Land on their piece in the middle row to send it back to the start."],
      ["Rosettes", "Landing on a rosette gives you another throw. The middle rosette is safe: no one can be taken there."],
    ],
    evidence: [
      ["Documented", "The board and pieces, from graves at Ur around 2500 BCE, and a Babylonian tablet of 177 BCE describing play, read by Irving Finkel."],
      ["Inference", "The route and the rosette rules follow Finkel. Other scholars route pieces differently."],
      ["Our guess", "The tablet mentions betting, but not clearly how. Here you just stake on the game."],
    ],
  },
  {
    id: "knucklebones-greek",
    engine: "knucklebones",
    title: "Knucklebones",
    aka: "astragaloi",
    scope: { years: [-800, -30], bounds: [19, 22, 40, 45] },
    kinds: ["gaming-house", "tavern"],
    rule: "most",
    best: "Aphrodite",
    cheat: true,
    seats: 3,
    sides: SIDES,
    lines: [
      ["Aphrodite", "All four sides different. Beats any other throw."],
      ["The Dog", "Four ones. The worst throw there is."],
      ["Most throw", "Otherwise add up the sides. Highest takes the pot; a tie at the top leaves it for the next round."],
      ["Weighted bones", "Someone at this table may be cheating. Watch what they throw."],
    ],
    evidence: [
      ["Documented", "Four bones, the values 1, 3, 4 and 6, and the named throws Aphrodite and the Dog. Loaded bones are found at ancient sites."],
      ["Our reconstruction", "The 'most throw' pot game as a gaming house would run it."],
    ],
  },
  {
    id: "knucklebones-roman",
    engine: "knucklebones",
    title: "Knucklebones",
    aka: "tali",
    scope: { years: [-300, 500], bounds: [-10, 24, 45, 56] },
    kinds: ["gaming-house", "tavern"],
    rule: "augustus",
    best: "Venus",
    seats: 3,
    sides: SIDES,
    lines: [
      ["Pay in", "For every bone that lands on one or six, put a coin in the pool."],
      ["Venus", "All four sides different takes the whole pool."],
      ["The Dog", "Four ones: four coins in, and nothing back."],
    ],
    evidence: [
      ["Documented", "Augustus describes this game in a letter quoted by Suetonius: a coin in the pool for each bone showing the dog or the six, the whole pool to whoever threw Venus."],
      ["Our reconstruction", "Playing it for small coins in a cookshop's back room. Augustus played at home, for high stakes."],
    ],
  },
];

export function tableGameFor(setting: WorldSetting | undefined, kind: VenueKind | undefined): TableGame | undefined {
  if (!setting || !kind) return;
  return tableGames.find((g) => g.kinds.includes(kind) && matchesCharacterScope(g.scope, setting));
}
