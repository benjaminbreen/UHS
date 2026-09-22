import { random } from "./random";
import type { Stats } from "./types";

export const skillIds = [
  "hunting",
  "foraging",
  "farming",
  "woodcraft",
  "quarrying",
  "speech",
  "trade",
  "wayfaring",
  "watercraft",
] as const;
export type SkillId = (typeof skillIds)[number];
/** Experience per skill. Levels are derived, never stored. */
export type Skills = Partial<Record<SkillId, number>>;

export const MAX_LEVEL = 10;

export type SkillDef = {
  name: string;
  group: "Land" | "Craft" | "People" | "Road";
  /** What earns it, for the panel. */
  earned: string;
  /** What a level is worth, for the panel. */
  perk: (level: number) => string;
  /** The attribute that makes the learning come easier. */
  stat: keyof Stats;
  /** Words in an occupation that mean the person already knows the work. */
  trades: RegExp;
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** What one level is worth, per skill. The engine reads these; the panel
 * prints them, so the two cannot drift apart. */
export const PER_LEVEL = {
  huntingDamage: 0.04,
  huntingQuiet: 0.03,
  deftBlow: 0.06,
  farmingPace: 0.04,
  harvestExtra: 0.05,
  foragingExtra: 0.06,
  speechWarmth: 0.08,
  tradeTerms: 0.03,
  wayfaringStamina: 0.03,
  watercraftPace: 0.05,
};

export const SKILLS: Record<SkillId, SkillDef> = {
  hunting: {
    name: "Hunting",
    group: "Land",
    earned: "Blows landed on game, and kills",
    perk: (l) =>
      `${pct(l * PER_LEVEL.huntingDamage)} harder blows; game notices you ${pct(l * PER_LEVEL.huntingQuiet)} later${l >= 5 ? "; a quicker wind-up" : ""}`,
    stat: "agility",
    trades: /hunt|trapp|fowler|falcon|forester|warrior|soldier|archer/i,
  },
  foraging: {
    name: "Foraging",
    group: "Land",
    earned: "Gathering what grows wild",
    perk: (l) =>
      `${pct(l * PER_LEVEL.foragingExtra)} chance of a second helping`,
    stat: "wit",
    trades: /forag|gather|digger|herb|heal|midwife|collector/i,
  },
  farming: {
    name: "Farming",
    group: "Land",
    earned: "Turning soil, reaping, bringing in a crop",
    perk: (l) =>
      `Field work goes ${pct(l * PER_LEVEL.farmingPace)} faster; ${pct(l * PER_LEVEL.harvestExtra)} chance of a second helping off a plant`,
    stat: "endurance",
    trades: /farm|peasant|plough|reap|cultivat|tenant|serf|gardener|planter/i,
  },
  woodcraft: {
    name: "Woodcraft",
    group: "Craft",
    earned: "Felling, bucking and clearing",
    perk: (l) => `${pct(l * PER_LEVEL.deftBlow)} of axe blows count twice`,
    stat: "strength",
    trades: /wood|carpent|charcoal|sawyer|joiner|cooper|wright|lumber/i,
  },
  quarrying: {
    name: "Quarrying",
    group: "Craft",
    earned: "Breaking rock and clearing rubble",
    perk: (l) => `${pct(l * PER_LEVEL.deftBlow)} of pick blows count twice`,
    stat: "strength",
    trades: /mason|quarr|miner|stone|flint|knapp|navvy|brick/i,
  },
  speech: {
    name: "Speech",
    group: "People",
    earned: "Talking with people",
    perk: (l) =>
      `${pct(l * PER_LEVEL.speechWarmth)} chance a conversation wins extra trust`,
    stat: "extraversion",
    trades:
      /priest|scribe|teach|bard|clerk|elder|orator|lawyer|preach|monk|nun|shaman/i,
  },
  trade: {
    name: "Trade",
    group: "People",
    earned: "Striking bargains",
    perk: (l) => `Your goods count for ${pct(l * PER_LEVEL.tradeTerms)} more`,
    stat: "wit",
    trades:
      /merchant|trader|shop|pedlar|peddler|vendor|factor|broker|monger|seller/i,
  },
  wayfaring: {
    name: "Wayfaring",
    group: "Road",
    earned: "Ground covered on foot, and new country reached",
    perk: (l) => `You tire ${pct(l * PER_LEVEL.wayfaringStamina)} more slowly`,
    stat: "endurance",
    trades:
      /drover|herd|shepherd|carrier|porter|messenger|pilgrim|nomad|courier|carter|muleteer/i,
  },
  watercraft: {
    name: "Watercraft",
    group: "Road",
    earned: "Fords, shallows and open water",
    perk: (l) => `Water slows you ${pct(l * PER_LEVEL.watercraftPace)} less`,
    stat: "agility",
    trades: /sailor|fisher|boat|ferry|mariner|raft|diver|whaler|sealer/i,
  },
};

/** Total experience needed to stand at a level. */
export const xpFor = (level: number) => Math.round(50 * level ** 1.8);

export function levelOf(xp = 0) {
  let level = 0;
  while (level < MAX_LEVEL && xp >= xpFor(level + 1)) level++;
  return level;
}

/** Where a skill stands inside its current level, for a progress bar. */
export function progress(xp = 0) {
  const level = levelOf(xp);
  if (level >= MAX_LEVEL) return { level, into: 1, span: 1 };
  const floor = xpFor(level);
  return { level, into: xp - floor, span: xpFor(level + 1) - floor };
}

const RANKS = [
  "Untried",
  "Novice",
  "Novice",
  "Practised",
  "Practised",
  "Skilled",
  "Skilled",
  "Seasoned",
  "Seasoned",
  "Expert",
  "Master",
];
export const rankOf = (level: number) => RANKS[level] ?? RANKS[0];

/** A person arrives knowing their own work. The occupation names the skill;
 * years at it set how far they have got. Everyone has walked and talked. */
export function startingSkills(
  seed: string,
  actor: { id: string; role: string; age?: number },
): Skills {
  const years = Math.max(0, (actor.age ?? 25) - 12);
  const own = Math.min(6, 2 + Math.floor(years / 7));
  const skills: Skills = {};
  for (const id of skillIds) {
    const known = SKILLS[id].trades.test(actor.role);
    const common = id === "speech" || id === "wayfaring";
    const level = known
      ? own
      : common
        ? Math.min(2, Math.floor(years / 12))
        : 0;
    if (!level) continue;
    // Partway into the level, so two potters are not the same potter.
    const span = xpFor(level + 1) - xpFor(level);
    skills[id] = Math.round(
      xpFor(level) + random(seed, "skill", actor.id, id) * span * 0.6,
    );
  }
  return skills;
}

/** A gain worth telling the player about. Queued by the engine, never saved. */
export type SkillGain = {
  serial: number;
  skill: SkillId;
  amount: number;
  xp: number;
  /** Set when this gain crossed into a new level. */
  level?: number;
};
