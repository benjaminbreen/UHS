import { faunaCombat, faunaProfile } from "../content/fauna";
import type { FaunaGroup, FaunaMember } from "./fauna";
import { random } from "./random";
import type { Point } from "./types";

export const faunaTiers = [
  "weak",
  "ordinary",
  "strong",
  "very-strong",
  "legendary",
] as const;
export type FaunaTier = (typeof faunaTiers)[number];

/** Share of animals in each tier, and what the tier does to them. `scale` is
 * for the renderer. */
export const TIERS: Record<
  FaunaTier,
  {
    share: number;
    hp: number;
    /** Pace, the damage it deals, and what it yields. */
    speed: number;
    damage: number;
    yield: number;
    scale: number;
    /** Multiplied into the sprite, so the big ones read at a glance. */
    tint: number;
    label: string;
  }
> = {
  weak: {
    share: 0.2,
    hp: 0.6,
    speed: 0.9,
    damage: 0.7,
    yield: 0.6,
    scale: 0.92,
    tint: 0xd9d9d2,
    label: "weak",
  },
  ordinary: {
    share: 0.55,
    hp: 1,
    speed: 1,
    damage: 1,
    yield: 1,
    scale: 1,
    tint: 0xffffff,
    label: "",
  },
  strong: {
    share: 0.18,
    hp: 1.5,
    speed: 1.1,
    damage: 1.3,
    yield: 1.3,
    scale: 1.08,
    tint: 0xffe9cf,
    label: "strong",
  },
  "very-strong": {
    share: 0.06,
    hp: 2.2,
    speed: 1.2,
    damage: 1.7,
    yield: 1.7,
    scale: 1.16,
    tint: 0xffcf9a,
    label: "very strong",
  },
  legendary: {
    share: 0.01,
    hp: 4,
    speed: 1.3,
    damage: 2.4,
    yield: 3,
    scale: 1.3,
    tint: 0xffd86a,
    label: "legendary",
  },
};

export function rollTier(seed: string, groupId: string, n: number): FaunaTier {
  let r = random(seed, "fauna-tier", groupId, n);
  for (const tier of faunaTiers) {
    r -= TIERS[tier].share;
    if (r < 0) return tier;
  }
  return "ordinary";
}

export function maxHp(speciesId: string, tier: FaunaTier) {
  const p = faunaProfile(speciesId);
  return Math.max(1, Math.round((p ? faunaCombat(p).hp : 5) * TIERS[tier].hp));
}

const LEGEND_COLOURS = [
  "grey",
  "black",
  "white",
  "red",
  "old",
  "one-eyed",
  "scarred",
  "lame",
  "great",
  "pale",
];
const LEGEND_PLACES = [
  "ford",
  "ridge",
  "marsh",
  "high pasture",
  "burnt wood",
  "far bank",
  "old road",
  "spring",
  "hollow",
  "north field",
];
const speciesLabel = (speciesId: string) =>
  (faunaProfile(speciesId)?.label ?? speciesId)
    .replace(/ study$/, "")
    .toLowerCase();
/** "the grey boar of the ford": what people call an animal they all know. */
export function legendName(seed: string, g: FaunaGroup, n: number) {
  const pick = (list: string[], key: string) =>
    list[Math.floor(random(seed, "legend", g.id, n, key) * list.length)];
  const kind = speciesLabel(g.speciesId).split(" ").at(-1);
  return `the ${pick(LEGEND_COLOURS, "colour")} ${kind} of the ${pick(LEGEND_PLACES, "place")}`;
}

/** Numbers, tiers and hit points for members that have none yet: a fresh
 * spawn, or a save from before animals could be hurt. */
export function ensureVitals(seed: string, g: FaunaGroup) {
  for (const m of g.members) {
    if (m.n !== undefined) continue;
    m.n = g.serial = (g.serial ?? 0) + 1;
    m.tier ??= rollTier(seed, g.id, m.n);
    m.hp = maxHp(g.speciesId, m.tier);
    if (m.tier === "legendary") m.name = legendName(seed, g, m.n);
  }
}

/** A legend the district knows about, alive or not. Kept in the save so a
 * slain one stays slain when its block spawns again. */
export type Legend = {
  name: string;
  species: string;
  at: Point;
  slain?: number;
};
export const legendKey = (groupId: string, n: number) => `${groupId}#${n}`;

export type Weapon = {
  damage: number;
  knock: number;
  /** Cells it reaches straight ahead, instead of sweeping an arc. */
  reach?: number;
  /** Damage multiplier against an animal in mid-charge. */
  brace?: number;
  /** Share of its damage it does when thrown. Most things are poor missiles. */
  thrown?: number;
  /** Seconds it leaves an animal reeling. A blow is 6. */
  stun?: number;
};

/** What a thing does when thrown, and how far a good arm sends it. A stone
 * does little harm but leaves game dazed long enough to close on. */
export type Missile = { damage: number; stun: number; range: number };
const STONE: Missile = { damage: 2, stun: 15, range: 7 };
const missiles: Record<string, Missile> = {
  pebble: STONE,
  flint: STONE,
  obsidian: STONE,
  "river-rock": { damage: 3, stun: 18, range: 6 },
  stone: { damage: 3, stun: 18, range: 6 },
  wood: { damage: 2, stun: 12, range: 5 },
};
export function missileOf(thing: {
  prop?: string;
  item?: string;
  mass?: number;
}) {
  if (thing.item)
    return missiles[thing.item] ?? { damage: 1, stun: 6, range: 5 };
  const w = thing.prop ? weapons[thing.prop] : undefined;
  if (w?.thrown && w.thrown > 1)
    return { damage: w.damage * w.thrown, stun: 6, range: 9 };
  // Anything else goes as far as its weight allows and lands like a lump.
  const mass = thing.mass ?? 1;
  return {
    damage: w ? w.damage * (w.thrown ?? 0.8) : 1 + mass * 2,
    stun: 12,
    range: Math.max(3, 7 - mass * 2),
  };
}
const BARE: Weapon = { damage: 1, knock: 1 };
const BLUNT: Weapon = { damage: 3, knock: 2 };
const weapons: Record<string, Weapon> = {
  stick: BLUNT,
  branch: BLUNT,
  rake: BLUNT,
  spade: { damage: 4, knock: 2 },
  shovel: { damage: 5, knock: 2 },
  sickle: { damage: 4, knock: 1 },
  scythe: { damage: 5, knock: 1 },
  pick: { damage: 6, knock: 1 },
  pitchfork: { damage: 6, knock: 1 },
  axe: { damage: 7, knock: 1 },
  spear: { damage: 6, knock: 1, reach: 2, brace: 2.5, thrown: 1.6 },
};
/** What is in the hand as a weapon. An edged item cuts more and shoves less. */
export function weaponOf(prop?: string, item?: { edge?: boolean }): Weapon {
  if (prop) return weapons[prop] ?? BLUNT;
  if (item) return item.edge ? { damage: 3, knock: 0 } : BLUNT;
  return BARE;
}
/** The props worth offering as weapons, for the dev panel. */
export const weaponProps = Object.keys(weapons);

export type CreatureHit = {
  group: string;
  n: number;
  species: string;
  tier: FaunaTier;
  from: Point;
  to: Point;
  damage: number;
  crit: boolean;
  /** Knocked into something solid, for extra damage. */
  slammed: boolean;
  killed: boolean;
  hp: number;
  maxHp: number;
  /** A bird goes up in feathers, not blood. */
  feathered: boolean;
  /** What the player took from the body. `sprite` is the item's icon. */
  drops: { item: string; count: number; sprite: string }[];
};

/** How somebody takes something, for the renderer to act out. The engine
 * fires one where it changes the state that warrants it and nowhere else, so
 * a face can never disagree with the mechanics behind it. */
export const cueKinds = [
  /** Something sudden: a charge beginning, a fight breaking out nearby. */
  "alarm",
  /** Nothing came of it: nobody in sight, nothing found. */
  "question",
  /** Trust lost. */
  "anger",
  /** Pushed past patience: the full stamping, steaming fit. */
  "fury",
  /** Trust won, enough to matter. */
  "warm",
  /** A small yes: an ordinary friendly exchange. */
  "nod",
  /** An offer turned down. */
  "refuse",
  "point",
  "beckon",
] as const;
export type CueKind = (typeof cueKinds)[number];

/** Everything the engine tells the renderer to play: what the animals did,
 * and how people took things. One queue, in clock order, never saved. */
export type Signal = { serial: number } & (
  | {
      kind: "cue";
      /** An actor id, or "player". */
      who: string;
      cue: CueKind;
      /** What it is about, so they can turn to it. */
      toward?: Point;
    }
  | {
      kind: "bump";
      /** The actor the player collided with. */
      who: string;
      /** From the player toward them: each is thrown back along it. */
      dx: number;
      dy: number;
      /** Who walked into whom. */
      by: "player" | "actor";
      /** At a run: the harder knock, and the anger. */
      run: boolean;
    }
  | { kind: "windup"; group: string; n: number; seconds: number }
  | { kind: "charge" | "lunge"; group: string; n: number }
  | { kind: "slam"; group: string; n: number; at: Point }
  | {
      kind: "mauled";
      group: string;
      n: number;
      damage: number;
      from: Point;
      to: Point;
    }
  | { kind: "dodged"; group: string; n: number }
);
/** Distributive, so each variant keeps its own fields. */
export type SignalInput = Signal extends infer E
  ? E extends Signal
    ? Omit<E, "serial">
    : never
  : never;

export const memberAt = (g: FaunaGroup, x: number, y: number) =>
  g.members.find((m) => m.x === x && m.y === y);

export function faunaName(g: FaunaGroup, m: FaunaMember) {
  if (m.name) return m.name.replace(/^the /, "");
  const label = speciesLabel(g.speciesId);
  const tier = TIERS[m.tier ?? "ordinary"].label;
  return tier ? `${tier} ${label}` : label;
}
