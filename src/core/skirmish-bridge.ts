import { armFor, armourOf, type Hurt } from "../content/arms/weapons";
import type { InjuryId } from "../content/health/injuries";
import type { FighterSpec, Skirmish } from "./skirmish";
import type { Actor } from "./types";

/** Between the world's people and a skirmish: who they are as fighters going
 * in, and what it did to them coming out. The engine does not start a
 * skirmish yet; this is the part of doing so that needs no renderer. */

const TRAINED = /soldier|guard|warrior|watch|sentry|samurai|knight|legionar|hoplite|man-at-arms|janissar|mamluk|sepoy|retainer|mercenar|officer|veteran/i;
const ROUGH = /outlaw|robber|bandit|brigand|footpad|highway|pirate|press gang|poacher|hunter|sailor|drover/i;

/** A person as they stand: what is in the hand, what is at the hip, what they
 * wear. `prop` is the catalogue id of a carried object, where they hold one. */
export function fighterOf(a: Actor, at: Pick<FighterSpec, "side" | "unit" | "x" | "y">, opts: { prop?: string; skill?: number } = {}): FighterSpec {
  const worn = a.appearance?.wearing, hip = worn?.sidearm && worn.sidearm !== "none" ? worn.sidearm : undefined;
  const hand = opts.prop ?? a.heldItem;
  const age = a.age ?? 30;
  const skill = opts.skill ?? (TRAINED.test(a.role) ? 0.6 : ROUGH.test(a.role) ? 0.45 : 0.3) - (age < 16 || age > 60 ? 0.12 : 0);
  return {
    ...at, id: a.id, main: armFor(hand ?? hip).id, sideArm: hand && hip ? hip : undefined,
    armour: armourOf(worn?.armour), shield: worn?.shield ?? "none",
    mounted: !!a.riding && !a.riding.cycle, skill: Math.max(0.05, Math.min(1, skill)),
  };
}

export type FightResult = {
  id: string;
  /** Share of the health they went in with that is left. */
  left: number;
  /** Killed. A beating with fists or a club puts a person down instead. */
  dead: boolean;
  down: boolean;
  fled: boolean;
  wounds: readonly Hurt[];
};
export function resultsOf(sim: Skirmish): FightResult[] {
  return sim.fighters.map((f) => {
    const fell = f.act === "dead", beaten = fell && f.wounds.at(-1) === "crush";
    return { id: f.id, left: Math.max(0, f.hp) / 100, dead: fell && !beaten, down: beaten, fled: f.act === "fled", wounds: f.wounds };
  });
}

/** The mark each kind of harm is likely to leave, as the injury table has it. */
export const WOUNDS: Record<Hurt, readonly (readonly [InjuryId, number])[]> = {
  cut: [["gash", 0.3], ["cut", 0.6]],
  thrust: [["gash", 0.5], ["cut", 0.3]],
  pierce: [["gash", 0.6], ["cut", 0.3]],
  ball: [["gash", 0.85]],
  crush: [["concussion", 0.1], ["cracked-ribs", 0.15], ["broken-arm", 0.08], ["bruises", 0.5]],
};
