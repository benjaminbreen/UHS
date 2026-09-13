import type { FaunaState } from "../../core/fauna";

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

export function frames(
  species: string,
  states: Record<string, number>,
): FaunaProfile["art"] {
  return Object.fromEntries(
    Object.entries(states).map(([state, count]) => [
      state,
      Array.from(
        { length: count },
        (_, frame) => `fauna-${species}-${state}-${frame}`,
      ),
    ]),
  );
}
