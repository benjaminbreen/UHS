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
    officiant: "Daoist priest of the Jade Emperor",
    rank: "major",
  },
  {
    name: "City God",
    domain: "the city, its dead, and local justice",
    officiant: "Keeper of the City God's temple",
    rank: "major",
  },
  {
    name: "Guanyin",
    domain: "compassion, childbirth, rescue from danger",
    officiant: "Monk of a Guanyin temple",
    rank: "major",
  },
  {
    name: "Mazu",
    // A Fujian sea goddess from the late tenth century, spread up the coast.
    scope: { years: [1000, 10001], bounds: [116, 18, 123, 40] },
    domain: "seafarers, merchants, coastal families",
    rank: "major",
  },
];

export const songMingDevotionOptions = ["Guanyin", "Mazu", "City God"];
