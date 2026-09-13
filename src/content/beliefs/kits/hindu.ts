import type { Power } from "../types";

export const puranicHinduCore: readonly Power[] = [
  {
    name: "Vishnu",
    domain: "preservation, cosmic order, divine descent",
    rank: "paramount",
  },
  {
    name: "Shiva",
    domain: "transformation, asceticism, divine power",
    rank: "paramount",
  },
  {
    name: "Devi/Shakti",
    domain: "the Goddess and divine energy",
    rank: "paramount",
  },
  {
    name: "Krishna",
    domain: "devotion, divine play, protection",
    rank: "major",
    relations: [{ kind: "aspect-of", of: "Vishnu" }],
  },
  {
    name: "Lakshmi",
    domain: "prosperity, fortune, household wellbeing",
    rank: "major",
    relations: [{ kind: "consort-of", of: "Vishnu" }],
  },
  {
    name: "Durga",
    domain: "protection and victory over destructive forces",
    rank: "major",
    relations: [{ kind: "aspect-of", of: "Devi/Shakti" }],
  },
  { name: "Ganesha", domain: "beginnings, obstacles, learning", rank: "major" },
  { name: "Brahma", domain: "creation and sacred knowledge", rank: "major" },
];

export const puranicHinduDevotionOptions = puranicHinduCore.map(
  (power) => power.name,
);
