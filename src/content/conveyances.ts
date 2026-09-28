import type { WorldSetting } from "./geography/types";

/** A kind of vehicle in its time and place, and who goes in it. The model is
 * the art (scripts/art/vehicles.py); the crew are real people, made when the
 * settlement is planned and seated in the model's crew places in order, so
 * a two-man crew in a three-man car leaves the back of it empty. */
export type Conveyance = {
  id: string;
  model: string;
  label: string;
  /** What someone in it is doing, for the focus card and the day's log. */
  doing: string;
  from: number;
  to: number;
  /** West, south, east, north: any of them. */
  regions: readonly (readonly [number, number, number, number])[];
  /** Tiles per game second at its gait, and the gait drawn. */
  speed: number;
  gait: "walk" | "trot";
  crew: readonly {
    role: string;
    /** Livelihood the character is generated with. */
    livelihood: string;
    /** Years; a child crew member is drawn and aged as one. */
    age: readonly [number, number];
    /** Where the role was one sex's: chariot crews were men. */
    sex?: "male" | "female";
  }[];
  /** Patrol: round the town's warded ground, its crew on watch over it.
   * Haul: out along the road to the edge of town and back to the square. */
  work: "patrol" | "haul";
  /** How many a settlement of this radius keeps. */
  count: (radius: number) => number;
  evidence: string;
};

const ANATOLIA = [26, 35.5, 45, 42.5] as const;
const NEAR_EAST = [32, 24, 52, 38] as const;
const EUROPE = [-11, 36, 30, 62] as const;
const SOUTHEAST_ASIA = [92, -10, 125, 25] as const;
const SOUTH_CHINA = [100, 18, 122, 30] as const;

export const conveyances: readonly Conveyance[] = [
  {
    id: "hittite-chariot",
    model: "hittite-chariot",
    label: "War chariot",
    doing: "Driving the chariot on its round",
    from: -1650,
    to: -1180,
    regions: [ANATOLIA],
    speed: 0.16,
    gait: "trot",
    crew: [
      { role: "Charioteer", livelihood: "warrior", age: [20, 40], sex: "male" },
      { role: "Chariot warrior", livelihood: "warrior", age: [20, 40], sex: "male" },
      { role: "Shield-bearer", livelihood: "warrior", age: [18, 35], sex: "male" },
    ],
    work: "patrol",
    count: (r) => (r >= 30 ? 1 : 0),
    evidence:
      "Hittite chariots carried three: a driver, a fighter and a shield-bearer, as the Egyptian reliefs of Qadesh show them, against the Egyptian two.",
  },
  {
    id: "near-eastern-chariot",
    model: "hittite-chariot",
    label: "Chariot",
    doing: "Driving the chariot on its round",
    from: -1700,
    to: -1100,
    regions: [NEAR_EAST],
    speed: 0.16,
    gait: "trot",
    crew: [
      { role: "Charioteer", livelihood: "warrior", age: [20, 40], sex: "male" },
      { role: "Chariot archer", livelihood: "warrior", age: [20, 40], sex: "male" },
    ],
    work: "patrol",
    count: (r) => (r >= 30 ? 1 : 0),
    evidence:
      "Mitannian, Kassite and Canaanite chariots of the Late Bronze Age carried a driver and an archer; the maryannu who crewed them were a warrior class of their own.",
  },
  {
    id: "farm-cart-pony",
    model: "farm-cart-pony",
    label: "Farm cart",
    doing: "Bringing the cart in",
    from: 1100,
    to: 1800,
    regions: [EUROPE],
    speed: 0.1,
    gait: "walk",
    crew: [{ role: "Carter", livelihood: "farmer", age: [18, 60] }],
    work: "haul",
    count: (r) => (r >= 20 ? 1 : 0),
    evidence:
      "Two-wheeled carts behind a single small horse carried a peasant holding's hay, grain and dung to and from the village; ponies of Shetland, Highland and Welsh type pulled them in the north and west.",
  },
  {
    id: "buffalo-cart",
    model: "buffalo-cart",
    label: "Buffalo cart",
    doing: "Driving the buffalo cart",
    from: -1000,
    to: 2030,
    regions: [SOUTHEAST_ASIA, SOUTH_CHINA],
    speed: 0.08,
    gait: "walk",
    crew: [
      { role: "Carter", livelihood: "rice-farmer", age: [20, 55] },
      { role: "Child", livelihood: "rice-farmer", age: [6, 11] },
      { role: "Child", livelihood: "rice-farmer", age: [5, 10] },
    ],
    work: "haul",
    count: (r) => (r >= 20 ? 1 : 0),
    evidence:
      "Water buffalo drew the tall-wheeled carts of the Thai, Lao, Khmer and Vietnamese countryside, a thatched hood over the bed; a family rode in them to market and to the wat.",
  },
];

export function conveyancesFor(s: Pick<WorldSetting, "lon" | "lat" | "year">) {
  return conveyances.filter(
    (c) =>
      s.year >= c.from &&
      s.year < c.to &&
      c.regions.some(([w, south, e, n]) => s.lon >= w && s.lon <= e && s.lat >= south && s.lat <= n),
  );
}
