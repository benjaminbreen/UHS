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
  rook: bird(3, 1),
  "house-crow": bird(3, 1),
  "jungle-crow": bird(3, 1),
  "american-crow": bird(3, 1),
  "red-billed-quelea": bird(1),
  "tree-sparrow": bird(1),
  // One blow and it is done; the swarm is the problem, not the insect.
  ...Object.fromEntries(
    ["desert-locust", "migratory-locust", "rocky-mountain-locust", "south-american-locust", "australian-plague-locust"]
      .map((id) => [id, { hp: 1, mass: 0, temper: "bolt", damage: 0, yields: {} } as FaunaCombat]),
  ),
  "rock-dove": bird(2, 1),
  chicken: bird(3, 1),
  duck: bird(2, 2),
  // A goose's wing and bill bruise; it is the hissing run that sends you off.
  goose: { ...bird(5, 3), temper: "charge", damage: 2 },
  "cattle-egret": bird(3, 1),
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
  cattle: beast(55, 3, 18, "charge", 12),
  "water-buffalo": beast(65, 3, 20, "charge", 14),
  dog: beast(14, 1, 2),
  // A cat hunts, but it runs from a person; nobody eats one.
  cat: { ...beast(5, 0, 0), damage: 1, yields: {} },
  mouse: { ...beast(1, 0, 0), yields: {} },
  donkey: beast(30, 2, 8),
  camel: beast(60, 3, 16),
  "red-deer": beast(22, 2, 8),
  wapiti: beast(30, 3, 12),
  "roe-deer": beast(12, 1, 4),
  "white-tailed-deer": beast(18, 2, 6),
  chital: beast(16, 1, 5),
  hare: beast(5, 0, 1),
  "golden-jackal": { ...beast(9, 0, 1), damage: 2, yields: { meat: 1, hide: 1 } },
  coyote: { ...beast(11, 1, 2), damage: 3, yields: { meat: 1, hide: 1 } },
  // Runs from a person; the pelt was worth more than the meat.
  "red-fox": { ...beast(7, 0, 1), damage: 2, yields: { meat: 1, hide: 1 } },
  "arctic-fox": { ...beast(6, 0, 1), damage: 2, yields: { meat: 1, hide: 1 } },
  "grey-fox": { ...beast(6, 0, 1), damage: 2, yields: { meat: 1, hide: 1 } },
  fennec: { ...beast(3, 0, 0), damage: 1, yields: { hide: 1 } },
  "gray-wolf": beast(24, 1, 2, "pack", 8),
  "wild-boar": beast(30, 2, 8, "charge", 12),
  aurochs: beast(70, 3, 20, "charge", 22),
  // A family closes round its young and the matriarch comes at the threat.
  "woolly-mammoth": beast(220, 6, 60, "charge", 40),
  "columbian-mammoth": beast(280, 7, 80, "charge", 45),
  "american-mastodon": beast(180, 6, 50, "charge", 35),
  "irish-elk": beast(45, 4, 25),
  reindeer: beast(22, 2, 10),
  "wild-horse": beast(30, 3, 14),
  // A great cat at bay comes for you; there is no running from one.
  "cave-lion": { ...beast(90, 4, 30, "charge", 30), yields: { meat: 30, hide: 1 } },
  "american-lion": { ...beast(100, 4, 32, "charge", 32), yields: { meat: 32, hide: 1 } },
  smilodon: { ...beast(95, 5, 30, "charge", 34), yields: { meat: 30, hide: 1 } },
  "steppe-bison": beast(90, 5, 40, "charge", 26),
  "american-bison": beast(85, 5, 38, "charge", 25),
  wisent: beast(85, 5, 38, "charge", 25),
  "woolly-rhinoceros": beast(160, 6, 50, "charge", 36),
  // A bear stands its ground and comes at you; it is not driven off.
  "brown-bear": { ...beast(90, 4, 25, "charge", 32), yields: { meat: 25, hide: 1 } },
  "polar-bear": { ...beast(110, 5, 30, "charge", 36), yields: { meat: 30, hide: 1 } },
  "cave-bear": { ...beast(110, 5, 30, "charge", 34), yields: { meat: 30, hide: 1 } },
  "short-faced-bear": { ...beast(140, 6, 36, "charge", 40), yields: { meat: 36, hide: 1 } },
  "african-elephant": beast(260, 7, 70, "charge", 42),
  "asian-elephant": beast(220, 6, 60, "charge", 38),
  lion: { ...beast(80, 4, 25, "charge", 28), yields: { meat: 25, hide: 1 } },
  tiger: { ...beast(95, 4, 28, "charge", 32), yields: { meat: 28, hide: 1 } },
  leopard: { ...beast(45, 2, 10, "charge", 20), yields: { meat: 10, hide: 1 } },
  jaguar: { ...beast(60, 3, 14, "charge", 24), yields: { meat: 14, hide: 1 } },
  zebra: beast(28, 3, 12),
  // A cow moose with a calf, or a bull in rut, kicks and tramples.
  moose: beast(55, 4, 30, "charge", 18),
  gazelle: beast(8, 1, 3),
  springbok: beast(9, 1, 3),
  // The kick of a cock ostrich disembowels; he comes at you to show it.
  ostrich: { ...beast(25, 2, 12, "charge", 14), yields: { meat: 12, feathers: 2 } },
  emu: { ...beast(15, 1, 8), yields: { meat: 8, feathers: 1 } },
  rhea: { ...beast(10, 1, 5), yields: { meat: 5, feathers: 1 } },
  "red-kangaroo": beast(18, 2, 8),
  "grey-kangaroo": beast(15, 1, 7),
  // The buffalo that circles back and waits for its hunter in the grass.
  "african-buffalo": beast(85, 5, 38, "charge", 28),
  wildebeest: beast(30, 3, 14),
  // The herd backs into a ring, horns out, and a bull comes out of it at you.
  "musk-ox": beast(60, 4, 25, "charge", 20),
  yak: beast(50, 4, 25),
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
