import type { Crop } from "./types";

/** An animal that comes down on a standing crop: which crops, at what hours,
 * and how hard it eats. Species are only candidates; one must also occur at
 * the setting, so an English barley field gets rooks and never quelea. */
export type CropPest = {
  species: string;
  kinds: readonly Crop["kind"][];
  /** Growth stages it goes for. Birds want the ripe ear; rabbits the shoot. */
  stages: readonly ("green" | "ripe")[];
  /** Local hours it raids, as [from, to); may wrap past midnight. */
  hours: readonly [number, number];
  weight: number;
  /** Mouthfuls, across the group, that take one cell of crop. */
  bites: number;
  /** What people called driving it off, for the log. */
  verb: string;
  evidence: { status: "documented" | "inferred"; note: string; sources: readonly string[] };
};

const grain: Crop["kind"][] = ["grain"];

export const cropPests: readonly CropPest[] = [
  ...["rook", "house-crow", "jungle-crow", "american-crow"].map((species) => ({
    species,
    kinds: [...grain, "vegetable"] as Crop["kind"][],
    stages: ["green", "ripe"] as const,
    hours: [6, 19] as const,
    weight: 4,
    bites: 3,
    verb: "drive",
    evidence: {
      status: "documented" as const,
      note: "Crows and rooks pull sprouting grain and strip ripe ears; English parishes paid boys to scare them from the Middle Ages into the nineteenth century.",
      sources: ["https://en.wikipedia.org/wiki/Bird_scaring"],
    },
  })),
  ...["house-sparrow", "tree-sparrow", "red-billed-quelea", "rock-dove"].map((species) => ({
    species,
    kinds: grain,
    stages: ["ripe"] as const,
    hours: [6, 19] as const,
    weight: species === "red-billed-quelea" ? 6 : 3,
    bites: 5,
    verb: "scatter",
    evidence: {
      status: "documented" as const,
      note: "Seed-eating flocks take the grain in the milk and the ripe ear; quelea are still the worst bird pest of African sorghum and millet, and the Four Pests campaign of 1958 targeted the tree sparrow.",
      sources: ["https://en.wikipedia.org/wiki/Red-billed_quelea", "https://en.wikipedia.org/wiki/Four_Pests_campaign"],
    },
  })),
  {
    species: "rabbit",
    kinds: ["vegetable", "grain", "root"],
    stages: ["green"],
    hours: [4, 10],
    weight: 3,
    bites: 2,
    verb: "chase",
    evidence: {
      status: "documented",
      note: "Rabbits graze young shoots at dawn and dusk; warrens beside fields were a standing complaint wherever they were introduced.",
      sources: ["https://en.wikipedia.org/wiki/European_rabbit"],
    },
  },
  {
    species: "mouse",
    kinds: grain,
    stages: ["ripe"],
    hours: [19, 5],
    weight: 2,
    bites: 3,
    verb: "chase",
    evidence: {
      status: "inferred",
      note: "Mice climb the stalks for ripe grain at night, and plagues of them followed good harvests.",
      sources: ["https://en.wikipedia.org/wiki/House_mouse"],
    },
  },
  {
    species: "wild-boar",
    kinds: ["grain", "root", "vegetable"],
    stages: ["green", "ripe"],
    hours: [18, 6],
    weight: 2,
    bites: 1,
    verb: "drive",
    evidence: {
      status: "documented",
      note: "Boar root and trample at night, and a sounder can flatten a field of maize or potatoes; night watches with fires and noise were kept against them.",
      sources: ["https://en.wikipedia.org/wiki/Wild_boar"],
    },
  },
  {
    species: "pig",
    kinds: ["vegetable", "root", "grain"],
    stages: ["green", "ripe"],
    hours: [7, 18],
    weight: 2,
    bites: 1,
    verb: "drive",
    evidence: {
      status: "documented",
      note: "Loose swine rooting in gardens and fields filled the court rolls of medieval towns and colonial America alike.",
      sources: ["https://en.wikipedia.org/wiki/Pig#History"],
    },
  },
  ...["desert-locust", "migratory-locust", "rocky-mountain-locust", "south-american-locust", "australian-plague-locust"].map((species) => ({
    species,
    kinds: ["grain", "vegetable", "pasture", "root"] as Crop["kind"][],
    stages: ["green", "ripe"] as const,
    hours: [8, 18] as const,
    weight: 0.5,
    bites: 4,
    verb: "beat",
    evidence: {
      status: "documented" as const,
      note: "Swarms strip everything green where they settle; farmers beat them with branches, dug trenches and lit smoky fires to turn them.",
      sources: ["https://en.wikipedia.org/wiki/Locust"],
    },
  })),
];

const within = ([from, to]: readonly [number, number], hour: number) =>
  from <= to ? hour >= from && hour < to : hour >= from || hour < to;

/** The pests that would go for this crop now, among the species present. */
export function pestsFor(
  crop: Crop,
  stage: string,
  hour: number,
  present: ReadonlySet<string>,
) {
  return cropPests.filter(
    (p) =>
      present.has(p.species) &&
      p.kinds.includes(crop.kind) &&
      (p.stages as readonly string[]).includes(stage) &&
      within(p.hours, hour),
  );
}

export const pestOf = (species: string) => cropPests.find((p) => p.species === species);

const nouns: Record<string, string> = {
  rook: "rooks",
  "house-crow": "crows",
  "jungle-crow": "crows",
  "american-crow": "crows",
  "house-sparrow": "sparrows",
  "tree-sparrow": "sparrows",
  "red-billed-quelea": "quelea",
  "rock-dove": "pigeons",
  rabbit: "rabbits",
  mouse: "mice",
  "wild-boar": "boar",
  pig: "pigs",
};
export const pestNoun = (species: string) =>
  nouns[species] ?? (species.endsWith("locust") ? "locusts" : "pests");

/** The start of the line announcing a raid; the crop's name ends it. */
export function pestArrival(species: string) {
  const them = pestNoun(species);
  if (them === "locusts") return "A swarm of locusts settles on the";
  if (them === "boar" || them === "pigs") return `${them === "boar" ? "Wild boar" : "Pigs"} have got into the`;
  if (them === "rabbits" || them === "mice") return `${them[0].toUpperCase()}${them.slice(1)} are at the`;
  return `A flock of ${them} comes down on the`;
}
