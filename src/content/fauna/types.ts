import type { FaunaState } from "../../core/fauna";
import type { CharacterScope } from "../characters/context-types";
import studies from "../../../public/fauna/studies.json" with { type: "json" };

export type HabitatTag =
  | "settlement"
  | "field"
  | "pasture"
  | "open-grass"
  | "scrub"
  | "woodland"
  | "forest-edge"
  | "wetland"
  | "shore"
  | "rock";

export type DietTag =
  | "seed"
  | "plant"
  | "grass"
  | "invertebrate"
  | "small-animal"
  | "ungulate";

export type FaunaProfile = {
  id: string;
  label: string;
  category: "domestic" | "commensal" | "wild";
  locomotion: "ground" | "ground-and-flight";
  social: "solitary" | "pair" | "flock" | "herd" | "pack";
  activity: "diurnal" | "nocturnal" | "crepuscular" | "flexible";
  groupSize: readonly [minimum: number, maximum: number];
  habitats: readonly { tag: HabitatTag; weight: number }[];
  /** Where and when the species occurs. No match means absent, never a
   * neighbour's animal standing in. */
  presence: readonly CharacterScope[];
  /** What a society must do before a kept species appears with it. */
  needs?: "herding" | "settled";
  /** Expected groups per 64-cell block where every cell is ideal habitat. */
  density: number;
  /** Cells per six-second step at a walk; a person walks one. */
  pace: number;
  /** Scrambles a terrace step the way a person can. Others need a slope. */
  climbs?: boolean;
  settlementTolerance: number;
  minimumSettlementDistance: number;
  alertRadius: number;
  cohesionRadius: number;
  separationRadius: number;
  calmDecisionSeconds: number;
  urgentDecisionSeconds: number;
  diet: readonly DietTag[];
  preyTags?: readonly DietTag[];
  palette: readonly string[];
  art: Partial<Record<FaunaState, readonly string[]>>;
};

export function study(
  species: keyof typeof studies,
): Pick<FaunaProfile, "art" | "palette"> {
  return {
    palette: studies[species].palette,
    art: Object.fromEntries(
      Object.entries(studies[species].states).map(([state, count]) => [
        state,
        Array.from(
          { length: count },
          (_, frame) => `fauna-${species}-${state}-${frame}`,
        ),
      ]),
    ),
  };
}
