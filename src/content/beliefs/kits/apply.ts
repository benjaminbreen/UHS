import type { BeliefSystem } from "../types";

type BeliefKit = Pick<BeliefSystem, "powers"> &
  Partial<Pick<BeliefSystem, "patronOptions">>;

export function applyBeliefKits(
  systems: readonly BeliefSystem[],
  kits: Readonly<Record<string, BeliefKit>>,
): readonly BeliefSystem[] {
  return systems.map((system) => {
    const kit = kits[system.id];
    return kit ? { ...system, ...kit } : system;
  });
}
