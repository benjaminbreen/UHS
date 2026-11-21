import type { FaunaMember } from "./fauna";
import type { ItemId } from "./types";
import { CYCLE_SPECS, isCycleKind, type CycleKind, type CycleLook } from "./cycles";

export type MountVoice =
  | "horse"
  | "donkey"
  | "camel"
  | "bovine"
  | "deer"
  | "llama"
  | "elephant"
  | "ostrich"
  | "bike"
  | "motor";

export type MountGait = 0 | 1 | 2 | 3 | 4;

export interface MountSpec {
  speciesId: string;
  /** Step interval in ms for [walk, trot, gallop, spur]. */
  stepMs: readonly [number, number, number, number];
  /** Max tiles cleared in a mounted leap. */
  jumpReach: 1 | 2 | 3;
  /** Maximum stamina pool. */
  maxStamina: number;
  /** Stamina regenerated per second while halted/walking. */
  regenPerSec: number;
  /** Saddle offset [dx, dy] in pixels relative to the mount sprite's foot anchor. */
  saddle: readonly [number, number];
  /** Extra horizontal saddle offset when facing east (+x) / west (-x). */
  sideShift?: number;
  /** Whether the mount moves through water without wading slowdown. */
  amphibious?: boolean;
  /** Whether the mount ignores deep snow drag. */
  snowSure?: boolean;
  /** Whether the mount ignores sand/rough ground drag. */
  sureFooted?: boolean;
  /** Heavy mount: shakes ground on gallop and crashes through low props. */
  heavy?: boolean;
  /** Chance per spur/gallop burst of a stubborn stop (donkey). */
  stubborn?: number;
  /** Spits when pushed past exhaustion (camel, llama). */
  spits?: boolean;
  /** Number of hold-on beats required to break a wild specimen. */
  breakBeats: number;
  voice: MountVoice;
  /** Display noun when no custom name is set. */
  noun: string;
  /** A machine, not an animal. */
  cycle?: CycleKind;
}

export interface PlayerMount {
  speciesId: string;
  groupId?: string;
  memberN: number;
  form?: string;
  coat?: string;
  name?: string;
  owner?: string;
  tier?: FaunaMember["tier"];
  hp?: number;
  wild?: boolean;
  tamed?: boolean;
  stamina: number;
  maxStamina: number;
  bond: number;
  /** Simulation clock until which a stubborn mount refuses to budge unless spurred or calmed. */
  stubbornUntil?: number;
  /** Wild rodeo breaking state. */
  bucking?: { holds: number; needed: number; until: number; tries: number };
  /** Recent over-spur warning count (resets when stamina recovers). */
  strained?: number;
  /** A bicycle or motorcycle. Its object stays in the world's list, marked carried, under `id`. */
  cycle?: { look: CycleLook; id: string; tuned?: boolean };
}

export const cycleSpecies = (kind: CycleKind) => `cycle:${kind}`;
export const cycleKindOf = (speciesId: string | undefined): CycleKind | undefined => {
  const kind = speciesId?.startsWith("cycle:") ? speciesId.slice(6) : undefined;
  return isCycleKind(kind) ? kind : undefined;
};

export const MOUNT_SPECS: Readonly<Record<string, MountSpec>> = {
  horse: {
    speciesId: "horse",
    stepMs: [122, 88, 58, 42],
    jumpReach: 3,
    maxStamina: 100,
    regenPerSec: 16,
    saddle: [0, 17],
    sideShift: -2,
    breakBeats: 3,
    voice: "horse",
    noun: "horse",
  },
  pony: {
    speciesId: "pony",
    stepMs: [128, 94, 66, 48],
    jumpReach: 2,
    maxStamina: 105,
    regenPerSec: 18,
    saddle: [0, 12],
    sideShift: -2,
    sureFooted: true,
    breakBeats: 2,
    voice: "horse",
    noun: "pony",
  },
  "wild-horse": {
    speciesId: "wild-horse",
    stepMs: [118, 84, 54, 40],
    jumpReach: 3,
    maxStamina: 110,
    regenPerSec: 17,
    saddle: [0, 17],
    sideShift: -2,
    breakBeats: 4,
    voice: "horse",
    noun: "wild horse",
  },
  donkey: {
    speciesId: "donkey",
    stepMs: [144, 108, 80, 62],
    jumpReach: 2,
    maxStamina: 120,
    regenPerSec: 20,
    saddle: [0, 9],
    sideShift: -1,
    sureFooted: true,
    stubborn: 0.12,
    breakBeats: 2,
    voice: "donkey",
    noun: "donkey",
  },
  camel: {
    speciesId: "camel",
    stepMs: [134, 96, 68, 52],
    jumpReach: 2,
    maxStamina: 180,
    regenPerSec: 15,
    saddle: [0, 20],
    sideShift: -1,
    sureFooted: true,
    spits: true,
    breakBeats: 3,
    voice: "camel",
    noun: "camel",
  },
  "water-buffalo": {
    speciesId: "water-buffalo",
    stepMs: [164, 126, 94, 74],
    jumpReach: 1,
    maxStamina: 145,
    regenPerSec: 16,
    saddle: [0, 13],
    sideShift: -2,
    amphibious: true,
    heavy: true,
    breakBeats: 3,
    voice: "bovine",
    noun: "water buffalo",
  },
  yak: {
    speciesId: "yak",
    stepMs: [154, 118, 88, 70],
    jumpReach: 2,
    maxStamina: 150,
    regenPerSec: 16,
    saddle: [0, 14],
    sideShift: -2,
    snowSure: true,
    sureFooted: true,
    heavy: true,
    breakBeats: 3,
    voice: "bovine",
    noun: "yak",
  },
  reindeer: {
    speciesId: "reindeer",
    stepMs: [126, 92, 64, 48],
    jumpReach: 3,
    maxStamina: 130,
    regenPerSec: 18,
    saddle: [0, 13],
    sideShift: -1,
    snowSure: true,
    breakBeats: 3,
    voice: "deer",
    noun: "reindeer",
  },
  llama: {
    speciesId: "llama",
    stepMs: [144, 110, 82, 64],
    jumpReach: 2,
    maxStamina: 115,
    regenPerSec: 19,
    saddle: [0, 13],
    sideShift: -1,
    sureFooted: true,
    spits: true,
    breakBeats: 2,
    voice: "llama",
    noun: "llama",
  },
  "asian-elephant": {
    speciesId: "asian-elephant",
    stepMs: [156, 118, 86, 66],
    jumpReach: 1,
    maxStamina: 210,
    regenPerSec: 14,
    saddle: [0, 32],
    sideShift: -3,
    amphibious: true,
    heavy: true,
    breakBeats: 4,
    voice: "elephant",
    noun: "elephant",
  },
  "african-elephant": {
    speciesId: "african-elephant",
    stepMs: [154, 116, 84, 64],
    jumpReach: 1,
    maxStamina: 220,
    regenPerSec: 14,
    saddle: [0, 36],
    sideShift: -4,
    amphibious: true,
    heavy: true,
    breakBeats: 5,
    voice: "elephant",
    noun: "elephant",
  },
  ostrich: {
    speciesId: "ostrich",
    stepMs: [110, 76, 48, 36],
    jumpReach: 3,
    maxStamina: 80,
    regenPerSec: 22,
    saddle: [0, 15],
    sideShift: -1,
    breakBeats: 4,
    voice: "ostrich",
    noun: "ostrich",
  },
  zebra: {
    speciesId: "zebra",
    stepMs: [120, 86, 56, 42],
    jumpReach: 3,
    maxStamina: 105,
    regenPerSec: 17,
    saddle: [0, 12],
    sideShift: -2,
    breakBeats: 5,
    voice: "horse",
    noun: "zebra",
  },
};

const HORSE_FORM_OVERRIDES: Readonly<Record<string, Partial<MountSpec>>> = {
  work: {
    stepMs: [132, 98, 68, 52],
    jumpReach: 2,
    maxStamina: 140,
    regenPerSec: 18,
    saddle: [0, 18],
    heavy: true,
    noun: "workhorse",
  },
  war: {
    stepMs: [122, 86, 56, 42],
    jumpReach: 3,
    maxStamina: 130,
    regenPerSec: 17,
    saddle: [0, 19],
    heavy: true,
    noun: "war horse",
  },
  race: {
    stepMs: [112, 78, 48, 35],
    jumpReach: 3,
    maxStamina: 105,
    regenPerSec: 15,
    saddle: [0, 17],
    noun: "race horse",
  },
};

export function mountSpec(speciesId: string | undefined, form?: string): MountSpec | undefined {
  if (!speciesId) return undefined;
  const cycle = cycleKindOf(speciesId);
  if (cycle) {
    const c = CYCLE_SPECS[cycle], ms = (v: number) => Math.round(1000 / v);
    return {
      speciesId,
      stepMs: [ms(c.cruise * 0.6), ms(c.cruise), ms((c.cruise + c.sprint) / 2), ms(c.sprint)],
      jumpReach: Math.max(1, c.hop) as 1 | 2 | 3,
      maxStamina: 100,
      regenPerSec: c.motor ? 30 : 14,
      saddle: [0, 0],
      breakBeats: 0,
      voice: c.motor ? "motor" : "bike",
      noun: c.noun,
      cycle,
    };
  }
  const base = MOUNT_SPECS[speciesId];
  if (!base) return undefined;
  if (speciesId === "horse" && form && HORSE_FORM_OVERRIDES[form]) {
    return { ...base, ...HORSE_FORM_OVERRIDES[form] };
  }
  return base;
}

export function isRideableSpecies(speciesId: string | undefined): boolean {
  return !!mountSpec(speciesId);
}

export function mountLabel(mount: Pick<PlayerMount, "speciesId" | "form" | "coat" | "name">): string {
  if (mount.name) return mount.name;
  const spec = mountSpec(mount.speciesId, mount.form);
  const noun = spec?.noun ?? mount.speciesId.replace(/-/g, " ");
  if (mount.coat && mount.coat !== "default" && mount.coat !== "natural") {
    return `${mount.coat.replace(/[_-]/g, " ")} ${noun}`;
  }
  return noun;
}

/** Items a mount will happily eat from your hand for stamina & bond. */
const MOUNT_TREATS =
  /apple|carrot|oat|barley|wheat|grain|millet|rice|corn|maize|bread|pear|plum|peach|fig|date|berry|berries|sugar|turnip|radish|cabbage|hay|clover|sweet|melon|pumpkin|squash|yam|potato|sorghum/i;

export function isMountTreat(itemId: ItemId | undefined): boolean {
  return !!itemId && MOUNT_TREATS.test(itemId);
}

export const GAIT_NAMES: readonly [string, string, string, string, string] = [
  "Halted",
  "Walk",
  "Trot",
  "Gallop",
  "Full Spur",
];

/** Rhythm sweet-spot window (ms after last spur) for Perfect Cadence combos. */
export const SPUR_SURGE_MS = 1050;
export const SPUR_SWEET_START_MS = 560;
export const SPUR_SWEET_END_MS = 1020;
export const SPUR_COST = 22;
export const SPUR_PERFECT_COST = 10;
