import type { Power } from "../types";

export const songMingHouseholdCore: readonly Power[] = [
  {
    name: "Heaven",
    wiki: "https://en.wikipedia.org/wiki/Tian",
    domain: "moral order, destiny, legitimate rule",
    rank: "paramount",
  },
  {
    name: "The household ancestors",
    domain: "family continuity and obligation",
    rank: "major",
  },
  {
    name: "Jade Emperor",
    domain: "the celestial administration",
    rank: "major",
  },
  {
    name: "City god",
    domain: "the city, its dead, and local justice",
    rank: "major",
  },
  {
    name: "Guanyin",
    domain: "compassion, childbirth, rescue from danger",
    rank: "major",
  },
  {
    name: "Mazu",
    domain: "seafarers, merchants, coastal families",
    rank: "major",
  },
];

export const songMingDevotionOptions = ["Guanyin", "Mazu", "City god"];
