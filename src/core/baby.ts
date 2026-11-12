import { infantCarry } from "../content/characters/wardrobe/regions/work-dress";
import type { WorldSetting } from "../content/geography/types";
import { random } from "./random";
import { kinOf } from "./kin";
import { SKILLS, xpFor, type SkillId } from "./skills";
import { child } from "./time/child";
import type { Actor, Household, Snapshot } from "./types";

export type BabyMood = "asleep" | "watching" | "fussing" | "crying";
export type BabyNeed = "milk" | "wet" | "tired" | "startled" | "bored";
/** The player's household's youngest, where babies rode on the back. The
 * numbers are never shown: the sprite and the sound are the readout. */
export type Baby = {
  id: string;
  name: string;
  sex: "female" | "male";
  /** Who has the baby: "player" or an actor's id. */
  with: string;
  mood: BabyMood;
  /** 0-100 each. Milk and tired rise; calm falls when something is wrong. */
  milk: number;
  tired: number;
  calm: number;
  wet: number;
  /** Seconds stood still while asleep; seconds walked while awake and tired. */
  still: number;
  lull: number;
  covered?: boolean;
  need?: BabyNeed;
  /** Skill practice the baby was awake on the player's back for. */
  seen?: Partial<Record<SkillId, number>>;
  /** Seconds in each other carer's arms. */
  held?: Record<string, number>;
  played?: number;
  /** The carer has sent word that the baby is hungry. */
  sent?: boolean;
  /** The last night's settling: the day it was for, and how it went, 0-1. */
  night?: { day: number; quality: number };
};
export type Motion = "walk" | "run" | "still" | "work";

const HOUR = 3600;
const MILK = 100 / (2.75 * HOUR);
const NAP = 100 / (75 * 60);
const AWAKE = 100 / (100 * 60);

export const her = (b: Pick<Baby, "sex">) => (b.sex === "male" ? "him" : "her");
export const she = (b: Pick<Baby, "sex">) => (b.sex === "male" ? "he" : "she");
export const hers = (b: Pick<Baby, "sex">) => (b.sex === "male" ? "his" : "her");

const female = (a: Pick<Actor, "origin" | "appearance">) => (a.origin?.sex ?? a.appearance?.physique?.sex) === "female";
const nurses = (a: Pick<Actor, "origin" | "appearance" | "age" | "role">) =>
  a.role === "Wet nurse" || (female(a) && (a.age ?? 0) >= 15 && (a.age ?? 0) <= 45);
const babiesOf = (h?: Household) => h?.babies ?? (h?.infants ? 1 : 0);

/**
 * Who has each of a household's babies today. A hired nurse before the
 * mother; and some days an older girl or a grandmother minds the baby while
 * the mother works. The player's own baby is wherever the player left it.
 */
export function carriers(s: Snapshot, h: Household, find: (id: string) => Actor | undefined): string[] {
  const n = babiesOf(h);
  if (!n) return [];
  const own = s.baby && h.members.includes(s.player.id) ? s.baby.with : undefined;
  const out = own ? [own] : [];
  const members = h.members.map(find).filter((a): a is Actor => !!a && a.kind === "human" && !a.dead && !out.includes(a.id) && !(own && a.id === s.player.id));
  const aged = (lo: number, hi: number) => members.find((a) => female(a) && (a.age ?? 30) >= lo && (a.age ?? 30) <= hi && !out.includes(a.id));
  const day = Math.floor(s.clock / 86400);
  for (let i = out.length; i < n; i++) {
    const roll = random(s.manifest.seed, "minder", h.id, i, day);
    const mother = members.find((a) => a.role === "Wet nurse" && !out.includes(a.id)) ?? members.find((a) => nurses(a) && !out.includes(a.id));
    if (!mother) break;
    out.push(((roll < 0.22 && aged(7, 13)) || (roll >= 0.22 && roll < 0.34 && aged(46, 70)) || mother).id);
  }
  return out;
}
export const canNurse = (s: Snapshot, id: string) => {
  const a = id === "player" ? s.player : s.actors.find((x) => x.id === id);
  return !!a && nurses(a);
};

/** The youngest of the household's babies, as the years will know them. */
export function newBaby(s: Snapshot, setting: WorldSetting | undefined): Baby | undefined {
  const p = s.player, h = s.households?.find((x) => x.members.includes(p.id));
  if (!babiesOf(h) || !h?.infants || !setting || !infantCarry(setting.culture, setting.year)) return undefined;
  const seed = s.manifest.seed;
  let pick = { id: "", age: 9 };
  for (let i = 0; i < h.infants; i++) {
    const id = `${h.id}-infant-${i}`, age = Math.floor(random(seed, id, "age") * 4);
    if (age < pick.age) pick = { id, age };
  }
  const people = [p, ...s.actors];
  const members = h.members.map((m) => people.find((a) => a.id === m));
  const carrier = members.find((a) => a?.role === "Wet nurse") ?? members.find((a) => a && nurses(a));
  if (!carrier) return undefined;
  const sex = random(seed, pick.id, "sex") < 0.5 ? "female" : "male";
  const partner = kinOf(s).find((k) => k.kind === "partner")?.actor;
  const drawn = child(seed, setting, pick.id, setting.year - pick.age, sex, p, partner)(pick.age);
  return {
    id: pick.id, name: drawn.origin?.namePersonal ?? drawn.name.split(" ")[0], sex,
    with: carrier.id, mood: "asleep", milk: 20, tired: 60, calm: 90, wet: 0, still: 0, lull: 0,
  };
}

const moodOf = (b: Baby): BabyMood =>
  b.calm < 20 ? "crying" : b.calm < 55 ? "fussing" : b.mood === "asleep" ? "asleep" : "watching";

/** A knock, a shout, a run of hard steps: wakes a sleeper and upsets a waker. */
export function jolt(b: Baby, by: number) {
  if (b.with !== "player") return;
  if (b.mood === "asleep") {
    if (b.tired > 85) return;
    b.mood = "watching";
  }
  b.calm = Math.max(0, b.calm - by);
  b.need ??= "startled";
  b.mood = moodOf(b);
}

/**
 * The baby's time on the player's back. `auto` is a long stretch nobody
 * plays through (a day's work, a road): the baby is fed and hushed along the
 * way, as a carried baby was, and nothing is left waiting at the end of it.
 */
export function babyTime(b: Baby, elapsed: number, c: { motion: Motion; rain: boolean; nurse: boolean; auto: boolean }) {
  const drop = (rate: number) => (b.calm = Math.max(0, b.calm - elapsed * rate));
  const rise = (rate: number) => (b.calm = Math.min(100, b.calm + elapsed * rate));
  const moving = c.motion === "walk" || c.motion === "run";
  b.milk = Math.min(100, b.milk + elapsed * MILK);
  if (!c.rain) {
    b.wet = Math.max(0, b.wet - elapsed / 12);
    delete b.covered;
  } else if (!b.covered) b.wet = Math.min(100, b.wet + elapsed / 6);

  if (b.mood === "asleep") {
    b.tired = Math.max(0, b.tired - elapsed * NAP);
    b.still = moving || c.motion === "work" ? Math.max(0, b.still - elapsed * 3) : b.still + elapsed;
    if (b.tired <= 8 || b.milk >= 85 || b.wet >= 60 || (b.still > 1200 && b.tired < 55)) {
      b.mood = "watching";
      b.still = 0;
    }
  } else {
    b.tired = Math.min(100, b.tired + elapsed * AWAKE);
    b.lull = moving ? b.lull + elapsed : Math.max(0, b.lull - elapsed * 2);
  }

  b.need = b.milk >= 75 ? "milk" : b.wet >= 50 ? "wet" : b.mood !== "asleep" && b.tired >= 95 ? "tired" : b.need === "startled" && b.calm < 65 ? "startled" : undefined;
  if (c.auto && b.need) {
    if (b.need === "milk" && c.nurse) b.milk = 0;
    if (b.need === "wet") { b.covered = true; b.wet = 0; }
    if (b.need === "tired") { b.mood = "asleep"; b.lull = 0; }
    if (b.need !== "milk" || c.nurse) { b.calm = 85; delete b.need; }
  }

  if (b.need === "milk") drop(100 / (14 * 60));
  else if (b.need === "wet") drop(100 / (8 * 60));
  // An overtired baby cries until walked or rocked to sleep.
  else if (b.need === "tired") moving ? rise(100 / (6 * 60)) : drop(100 / (10 * 60));
  else if (b.mood !== "asleep") {
    if (moving) rise(100 / (3 * 60));
    else if (c.motion === "work") rise(100 / (15 * 60));
    // Nothing to look at: a waking baby wants to be moving.
    else if (b.calm > 50) drop(100 / (45 * 60));
    if (b.calm < 50 && !moving) b.need = "bored";
  }

  const sleepy = b.tired >= 60 && b.mood !== "asleep" && b.need !== "milk" && b.need !== "wet";
  if (sleepy && b.lull >= 90 && b.calm >= 40) {
    b.mood = "asleep";
    b.calm = Math.max(b.calm, 80);
    b.lull = b.still = 0;
    delete b.need;
  }
  b.mood = moodOf(b);
}

/** In someone else's arms the baby is content until hungry, and a carer with
 * no milk can do nothing about that. */
export function minded(b: Baby, elapsed: number, nurse: boolean) {
  (b.held ??= {})[b.with] = (b.held[b.with] ?? 0) + elapsed;
  b.milk = nurse ? Math.min(b.milk, 30) : Math.min(100, b.milk + elapsed * MILK);
  b.tired = b.mood === "asleep" ? Math.max(0, b.tired - elapsed * NAP) : Math.min(100, b.tired + elapsed * AWAKE);
  if (b.mood === "asleep" ? b.tired <= 8 : b.tired >= 80) b.mood = b.mood === "asleep" ? "watching" : "asleep";
  b.wet = 0;
  b.need = b.milk >= 75 ? "milk" : undefined;
  b.calm = b.need ? Math.max(0, b.calm - (elapsed * 100) / (14 * 60)) : Math.min(100, b.calm + elapsed / 6);
  b.mood = moodOf(b);
}

export type Tend =
  | { kind: "take" | "give"; who: string }
  | { kind: "cover" | "nurse" | "rock" | "play" };

/** What the one key does now. `near` is whoever is in reach and would take
 * the baby; `carer` is whoever has it, if they are in reach. */
export function tendOf(s: Snapshot, near?: string, carerNear?: boolean): Tend | undefined {
  const b = s.baby;
  if (!b) return undefined;
  if (b.with !== "player") return carerNear ? { kind: "take", who: b.with } : undefined;
  if (b.need === "wet" && !b.covered) return { kind: "cover" };
  if (b.need === "milk" && canNurse(s, "player")) return { kind: "nurse" };
  if (b.mood === "fussing" || b.mood === "crying") return { kind: "rock" };
  if (near) return { kind: "give", who: near };
  if (b.mood === "watching" && s.clock - (b.played ?? -9999) > 600) return { kind: "play" };
  return undefined;
}

/** Who will mind the baby: the household from seven up, and kin elsewhere. */
export function minders(s: Snapshot): Actor[] {
  const h = s.households?.find((x) => x.members.includes(s.player.id));
  const kin = new Set(kinOf(s).map((k) => k.actor.id));
  return s.actors.filter((a) => a.kind === "human" && !a.dead && (a.age ?? 30) >= 7 && (h?.members.includes(a.id) || kin.has(a.id)));
}

/** What the child takes from a babyhood: the work watched most, and who
 * else held them. Skill practice of 3 is an afternoon; 150 is a season. */
export function legacy(b: Baby) {
  const [skill, n] = (Object.entries(b.seen ?? {}) as [SkillId, number][]).sort((x, y) => y[1] - x[1])[0] ?? [];
  const [carer, held] = Object.entries(b.held ?? {}).sort((x, y) => y[1] - x[1])[0] ?? [];
  const level = !skill || n < 3 ? 0 : n < 40 ? 1 : n < 150 ? 2 : 3;
  return {
    skill: level ? skill : undefined,
    xp: xpFor(level),
    carer: held >= 2 * HOUR ? carer : undefined,
    line: level ? `${b.name} spent ${hers(b)} first years carried everywhere, watching ${SKILLS[skill!].name.toLowerCase()}, and took to it young.` : undefined,
  };
}
