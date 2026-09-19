import type { FaunaProfile } from "./types";

/** How an animal answers a blow. `bolt` runs. `charge` squares up, paws the
 * ground and comes straight at you. `pack` rings you and takes turns lunging. */
export type Temper = "bolt" | "charge" | "pack";

export type FaunaCombat = {
  /** Blows from a stout stick an ordinary adult survives, roughly times three. */
  hp: number;
  /** Cells of knockback it shrugs off: 0 a rabbit, 3 an aurochs. */
  mass: number;
  temper: Temper;
  /** What it takes off the player's health when it connects. */
  damage: number;
  /** What an ordinary adult yields to whoever kills it. */
  yields: Readonly<Record<string, number>>;
};

const bird = (hp: number, meat = 0): FaunaCombat => ({
  hp,
  mass: 0,
  temper: "bolt",
  damage: 0,
  yields: meat ? { meat, feathers: 1 } : { feathers: 1 },
});
const beast = (
  hp: number,
  mass: number,
  meat: number,
  temper: Temper = "bolt",
  damage = 0,
): FaunaCombat => ({
  hp,
  mass,
  temper,
  damage,
  yields: mass ? { meat, hide: 1 } : { meat },
});

const table: Record<string, FaunaCombat> = {
  "house-sparrow": bird(1),
  "rock-dove": bird(2, 1),
  chicken: bird(3, 1),
  turkey: bird(5, 2),
  "wild-turkey": bird(6, 2),
  "guinea-pig": beast(2, 0, 1),
  rabbit: beast(4, 0, 1),
  "rabbit-kit": beast(2, 0, 1),
  sheep: { ...beast(14, 1, 4), yields: { meat: 4, hide: 1, wool: 1 } },
  goat: beast(12, 1, 3),
  pig: beast(18, 2, 6, "charge", 6),
  llama: { ...beast(20, 2, 6), yields: { meat: 6, hide: 1, wool: 1 } },
  foal: beast(15, 1, 4),
  horse: beast(40, 3, 12),
  "red-deer": beast(22, 2, 8),
  wapiti: beast(30, 3, 12),
  "gray-wolf": beast(24, 1, 2, "pack", 8),
  "wild-boar": beast(30, 2, 8, "charge", 12),
  aurochs: beast(70, 3, 20, "charge", 22),
};

/** A species without an entry is sized from what the profile already says. */
export function faunaCombat(p: FaunaProfile): FaunaCombat {
  const known = table[p.id];
  if (known) return known;
  if (p.locomotion === "ground-and-flight") return bird(2);
  const big = p.social === "herd" || p.social === "pack";
  return p.preyTags?.length
    ? beast(20, 1, 2, "pack", 8)
    : beast(big ? 20 : 5, big ? 2 : 0, big ? 6 : 1);
}
