import type { Power } from "../types";

export const sunniIslamicCore: readonly Power[] = [
  {
    name: "Allah",
    wiki: "https://en.wikipedia.org/wiki/God_in_Islam",
    domain: "the one God, creator, judge, and giver of mercy",
    rank: "paramount",
  },
  {
    name: "Muhammad",
    wiki: "https://en.wikipedia.org/wiki/Muhammad",
    domain: "the final prophet and messenger",
    rank: "major",
  },
  {
    name: "The Quran",
    wiki: "https://en.wikipedia.org/wiki/Quran",
    domain: "revelation, recitation, guidance",
    rank: "major",
  },
  {
    name: "The Sunnah",
    wiki: "https://en.wikipedia.org/wiki/Sunnah",
    domain: "the Prophet's example and transmitted practice",
    rank: "major",
  },
  {
    name: "Jibril",
    wiki: "https://en.wikipedia.org/wiki/Gabriel",
    domain: "the angel who carries revelation",
    rank: "major",
    relations: [{ kind: "serves", of: "Allah" }],
  },
  {
    name: "The prophets",
    domain: "Abraham, Moses, Jesus, and earlier messengers",
    rank: "major",
  },
];

export const secondTempleJewishCore: readonly Power[] = [
  {
    name: "YHWH",
    wiki: "https://en.wikipedia.org/wiki/Tetragrammaton",
    domain: "the one God of Israel and the covenant",
    rank: "paramount",
  },
  { name: "The Torah", domain: "covenant, law, teaching", rank: "major" },
  {
    name: "The Temple",
    domain: "sacrifice, pilgrimage, divine service",
    rank: "major",
  },
  {
    name: "Abraham, Isaac and Jacob",
    domain: "the patriarchs and the covenantal ancestors",
    rank: "major",
  },
  {
    name: "Moses",
    domain: "prophecy, Torah, liberation from Egypt",
    rank: "major",
  },
  {
    name: "The prophets",
    domain: "warning, justice, return to God",
    rank: "major",
  },
];
