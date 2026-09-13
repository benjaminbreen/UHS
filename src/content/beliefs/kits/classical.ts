import type { Power } from "../types";

export const romanCapitolineTriad: readonly Power[] = [
  { name: "Jupiter", domain: "sky, oaths, the Roman state", rank: "paramount" },
  {
    name: "Juno",
    domain: "marriage, women, protection of Rome",
    rank: "paramount",
    relations: [{ kind: "consort-of", of: "Jupiter" }],
  },
  {
    name: "Minerva",
    domain: "craft, strategy, learning",
    rank: "paramount",
  },
];

export const romanCivicFigures: readonly Power[] = [
  { name: "Mars", domain: "war, agriculture, Roman ancestry", rank: "major" },
  { name: "Vesta", domain: "the public and household hearth", rank: "major" },
  { name: "Mercury", domain: "trade, travel, messages", rank: "major" },
  { name: "Diana", domain: "the moon, hunting, childbirth", rank: "major" },
  { name: "Neptune", domain: "the sea, horses, earthquakes", rank: "major" },
];

export const romanDevotionOptions = [
  ...romanCapitolineTriad,
  ...romanCivicFigures,
].map((power) => power.name);

export const classicalGreekCore: readonly Power[] = [
  { name: "Zeus", domain: "sky, justice, hospitality", rank: "paramount" },
  {
    name: "Hera",
    domain: "marriage, queenship, the household",
    rank: "paramount",
    relations: [{ kind: "consort-of", of: "Zeus" }],
  },
  { name: "Athena", domain: "cities, craft, strategy", rank: "paramount" },
  { name: "Apollo", domain: "prophecy, healing, music", rank: "major" },
  {
    name: "Demeter",
    domain: "grain, agriculture, seasonal rites",
    rank: "major",
  },
  { name: "Dionysus", domain: "wine, theatre, ecstatic rites", rank: "major" },
  { name: "Poseidon", domain: "sea, horses, earthquakes", rank: "major" },
  { name: "Aphrodite", domain: "love, desire, marriage", rank: "major" },
];

export const classicalGreekDevotionOptions = classicalGreekCore.map(
  (power) => power.name,
);
