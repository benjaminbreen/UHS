import { random } from "../../core/random";
import { matchesCharacterScope } from "../characters/resolve";
import type { WorldSetting } from "../geography/types";
import type { Actor } from "../../core/types";
import type { CultureId } from "../history/types";
import type { BeliefSystem, Power } from "./types";
import { andes } from "./systems/andes";
import { australiaPacific } from "./systems/australia-pacific";
import { eastAsia } from "./systems/east-asia";
import { eastSouthernAfrica } from "./systems/east-southern-africa";
import { egypt } from "./systems/egypt";
import { european } from "./systems/european";
import { indigenousAmericas } from "./systems/indigenous-americas";
import { innerEurasia } from "./systems/inner-eurasia";
import { mesoamerica } from "./systems/mesoamerica";
import { southAsia } from "./systems/south-asia";
import { southeastAsia } from "./systems/southeast-asia";
import { westAsia } from "./systems/west-asia";
import { westCentralAfrica } from "./systems/west-central-africa";

/** Each file belongs to one culture region. Tagging on import keeps the scope
 * boxes generous — a box that spills into the next region no longer wins there
 * — without repeating the field on two hundred entries. */
const from = (
  systems: readonly BeliefSystem[],
  culture: CultureId,
): BeliefSystem[] =>
  systems.map((b) => ({
    ...b,
    scope: { ...b.scope, cultures: b.scope.cultures ?? [culture] },
  }));

export const beliefSystems: readonly BeliefSystem[] = [
  ...from(andes, "andean"),
  ...from(australiaPacific, "australian-pacific"),
  ...from(eastAsia, "east-asian"),
  ...from(eastSouthernAfrica, "east-southern-african"),
  ...from(egypt, "north-african-west-asian"),
  ...from(european, "european"),
  ...from(indigenousAmericas, "other-indigenous-american"),
  ...from(innerEurasia, "inner-eurasian"),
  ...from(mesoamerica, "mesoamerican"),
  ...from(southAsia, "south-asian"),
  ...from(southeastAsia, "southeast-asian"),
  ...from(westAsia, "north-african-west-asian"),
  ...from(westCentralAfrica, "west-central-african"),
];

/** Where nothing is recorded, people still have a practice. Named powers are
 * not invented here; these are the things anyone can point at. */
export const unscopedBeliefs: BeliefSystem = {
  id: "unscoped",
  label: "Local practice",
  scope: { years: [-1000000, 10001] },
  powers: [
    {
      name: "The ancestors",
      domain: "the household's own dead",
      rank: "paramount",
    },
    { name: "The sky", domain: "weather, the year", rank: "major" },
    {
      name: "The water",
      domain: "the river, spring or well people drink from",
      rank: "major",
    },
    { name: "The land", domain: "the ground worked and walked", rank: "major" },
    {
      name: "The dangerous places",
      domain: "the crossing, the height, the dark",
      rank: "local",
    },
  ],
  practice: [
    "A share of food and drink set aside before the household eats.",
    "The year is marked where it turns, not on a fixed calendar.",
  ],
  evidence: {
    status: "fictional",
    claim:
      "A deliberately unnamed practice for places and dates with no scoped belief content.",
    sources: [],
    limitation:
      "Not a reconstruction of any tradition. Named powers and their order need researched content for this place and date.",
  },
};

/** Years times degrees. A dated city entry beats a regional one, and both beat
 * the era floor underneath, whichever axis they are narrower on. */
const specificity = (b: BeliefSystem) => {
  const box = b.scope.bounds;
  const area = box ? (box[2] - box[0]) * (box[3] - box[1]) : 360 * 180;
  return (b.scope.years[1] - b.scope.years[0]) * Math.max(1, area);
};

/** The most specific system that covers this place, date and culture. */
export function beliefsFor(
  setting: WorldSetting,
  community?: string,
): BeliefSystem {
  const here = beliefSystems.filter((b) =>
    matchesCharacterScope(
      { ...b.scope, cultures: undefined },
      setting,
      community,
    ),
  );
  // A preference, not a gate: some places carry a culture tag from a
  // neighbouring region, and geography is still the better answer than nothing.
  const own = here.filter((b) => b.scope.cultures?.includes(setting.culture));
  const pool = own.length ? own : here;
  if (!pool.length) return unscopedBeliefs;
  return pool.sort((a, b) => specificity(a) - specificity(b))[0];
}

/** The power's own article, or the tradition's. */
export function wikiFor(system: BeliefSystem, power?: Power) {
  return power?.wiki ?? system.wiki;
}

export type PersonalBelief = {
  system: BeliefSystem;
  /** Who this person actually addresses, most days. */
  patron?: Power;
  paramount?: Power;
  observance: "devout" | "regular" | "occasional" | "indifferent";
  /** One practice line they keep, drawn from the system. */
  keeps?: string;
};

/** Derived like abilities: a household's worth of belief costs nothing. */
export function beliefOf(
  seed: string,
  actor: Pick<Actor, "id" | "age" | "appearance" | "stats" | "origin">,
  system: BeliefSystem,
): PersonalBelief {
  const patrons = (system.patronOptions ?? []).flatMap((name) => {
    const power = system.powers.find((candidate) => candidate.name === name);
    return power ? [power] : [];
  });
  const patron = patrons.length
    ? patrons[Math.floor(random(seed, "belief", actor.id) * patrons.length)]
    : undefined;
  const score = random(seed, "belief-observance", actor.id) * 100;
  return {
    system,
    patron,
    paramount: system.powers.find((p) => p.rank === "paramount"),
    observance:
      score >= 75
        ? "devout"
        : score >= 35
          ? "regular"
          : score >= 10
            ? "occasional"
            : "indifferent",
    keeps: system.practice.length
      ? system.practice[
          Math.floor(
            random(seed, "belief-practice", actor.id) * system.practice.length,
          )
        ]
      : undefined,
  };
}
