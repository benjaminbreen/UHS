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
  groups: readonly {
    community: string;
    share: number;
    /**
     * Share of this group held in bondage, 0-1. Unfreedom was not a fringe
     * condition in most of the societies this game covers, and a model that
     * cannot show it makes the ordinary arrangement of those places invisible.
     * It is a proportion of a community, not a property of one: Virginia's
     * English colonists included indentured servants and its African-descended
     * population included free people.
     */
    unfree?: number;
  }[];
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
      { community: "english-colonial", share: 6, unfree: 0.12 },
      { community: "african-diaspora", share: 3, unfree: 0.92 },
      { community: "indigenous-local", share: 1, unfree: 0.05 },
    ],
    sources: [
      "https://www.nps.gov/jame/learn/historyculture/the-first-residents-of-jamestown.htm",
    ],
    note: "The three groups were present together throughout, in shares that moved sharply across the period: the African-descended population was negligible in 1610 and about two fifths of the Tidewater by 1750, and slavery hardened from a status resembling indenture into hereditary racial bondage across the same decades. One fixed ratio cannot show either movement. The English-colonial figure is indentured servitude, which was most of the early labour force and ran for a term rather than for life.",
  },
];

/*
 * Societies where bondage was general but the free population is not divided
 * into communities the game models separately. A single share applies across
 * the whole settlement.
 */
export type LabourRegime = {
  id: string;
  label: string;
  scope: CharacterScope;
  priority: number;
  unfree: number;
  sources: readonly string[];
  note?: string;
};

export const labourRegimes: readonly LabourRegime[] = [
  {
    id: "labour.classical-mediterranean",
    label: "Classical Mediterranean",
    scope: { years: [-500, 400], bounds: [-9, 30, 40, 47] },
    priority: 2,
    unfree: 0.22,
    sources: ["https://doi.org/10.1017/CHOL9780521263351"],
    note: "Estimates for Roman Italy run from a fifth to a third of the population. Enslaved people worked the land, the mines, the workshops and the household, and manumission was common enough that freed people are a visible part of the record.",
  },
  {
    id: "labour.classical-greece",
    label: "Classical Greece",
    scope: { years: [-700, -100], bounds: [19, 34, 29, 42] },
    priority: 3,
    unfree: 0.28,
    sources: ["https://doi.org/10.1017/CHOL9780521234474"],
    note: "Athens and the Aegean poleis. Sparta's helots were a separate and larger arrangement not modelled here.",
  },
  {
    id: "labour.atlantic-caribbean",
    label: "Caribbean plantation colonies",
    scope: { years: [1640, 1838], bounds: [-85, 10, -59, 23] },
    priority: 4,
    unfree: 0.85,
    sources: ["https://www.slavevoyages.org/"],
    note: "On the sugar islands the enslaved were the great majority of the population, in some parishes nine in ten.",
  },
  {
    id: "labour.brazil-colonial",
    label: "Colonial and imperial Brazil",
    scope: { years: [1550, 1888], bounds: [-74, -33, -34, 5] },
    priority: 3,
    unfree: 0.45,
    sources: ["https://www.slavevoyages.org/"],
    note: "Brazil received more enslaved Africans than anywhere else in the Americas, and was the last state in the hemisphere to abolish slavery.",
  },
  {
    id: "labour.medieval-serfdom",
    label: "Manorial Europe",
    scope: { years: [900, 1500], bounds: [-5, 43, 30, 56] },
    priority: 2,
    unfree: 0.55,
    sources: ["https://doi.org/10.1017/CHOL9780521362917"],
    note: "Serfdom rather than slavery: unfree in that a villein was bound to the manor and owed labour services, not owned outright and not saleable apart from the land.",
  },
  {
    id: "labour.russian-serfdom",
    label: "Russian serfdom",
    scope: { years: [1650, 1861], bounds: [22, 44, 65, 66] },
    priority: 3,
    unfree: 0.5,
    sources: ["https://doi.org/10.1017/CHOL9780521812276"],
    note: "By the eighteenth century serfs could be sold apart from the land, which put Russian serfdom closer to chattel slavery than the western European kind.",
  },
  {
    id: "labour.mesopotamia",
    label: "Mesopotamian cities",
    scope: { years: [-3000, -300], bounds: [38, 29, 49, 37] },
    priority: 2,
    unfree: 0.15,
    sources: ["https://cdli.ucla.edu/"],
    note: "Temple and palace dependants, debt slaves and war captives. Much of the labour force was dependent without being owned, which the single share here cannot distinguish.",
  },
  {
    id: "labour.korea-joseon",
    label: "Joseon Korea",
    scope: { years: [1400, 1894], bounds: [124, 33, 131, 43] },
    priority: 3,
    unfree: 0.3,
    sources: ["https://doi.org/10.1017/9781139026314"],
    note: "The nobi were a hereditary unfree class, at some points close to a third of the population, abolished in 1894.",
  },
];
