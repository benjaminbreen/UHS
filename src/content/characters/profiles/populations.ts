import type { CharacterScope } from "../context-types";

/*
 * Who lives in a place, in what proportion.
 *
 * A community profile says what one group looks like and does. It could not say
 * that a place holds several groups at once, because `communityFor` returned a
 * single label for a whole world: every settlement was entirely one community.
 * That is fine for a village and wrong for anywhere plural, which is most
 * cities and every colonial society.
 *
 * A population names the groups and their shares. Each person draws one, so a
 * street holds the mix rather than the average, and because the drawn community
 * selects the appearance palette and the naming kit together, a person's name
 * and appearance stay consistent with each other.
 *
 * Shares are proportions for populating a scene, not census figures. Where a
 * real proportion is known the source says so; otherwise they are a legible
 * approximation and should not be read as demography.
 */
export type Population = {
  id: string;
  label: string;
  scope: CharacterScope;
  /** Higher wins where two populations cover the same place and date. */
  priority: number;
  groups: readonly { community: string; share: number }[];
  sources: readonly string[];
  note?: string;
};

export const populations: readonly Population[] = [
  {
    id: "population.virginia-tidewater",
    label: "Virginia Tidewater",
    scope: { years: [1607, 1750], bounds: [-84, 35, -75, 40] },
    priority: 2,
    groups: [
      { community: "english-colonial", share: 6 },
      { community: "african-diaspora", share: 3 },
      { community: "indigenous-local", share: 1 },
    ],
    sources: [
      "https://www.nps.gov/jame/learn/historyculture/the-first-residents-of-jamestown.htm",
    ],
    note: "The three groups were present together throughout, in shares that moved sharply across the period: the African-descended population was negligible in 1610 and about two fifths of the Tidewater by 1750. One fixed ratio cannot show that.",
  },
];
