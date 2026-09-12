import type { BeliefSystem } from "../types";

/** The exemplar other regional files follow: a paramount rank, a handful of
 * major powers with their relations, and the local powers a villager actually
 * addresses. */
export const egypt: readonly BeliefSystem[] = [
  {
    id: "egypt-new-kingdom",
    label: "New Kingdom Egyptian practice",
    wiki: "https://en.wikipedia.org/wiki/Ancient_Egyptian_religion",
    scope: { years: [-1550, -1069], bounds: [24, 22, 36, 32] },
    powers: [
      {
        name: "Amun-Ra",
        wiki: "https://en.wikipedia.org/wiki/Amun-Ra",
        domain: "sun, kingship, hidden power",
        rank: "paramount",
      },
      {
        name: "Osiris",
        wiki: "https://en.wikipedia.org/wiki/Osiris",
        domain: "the dead, renewal, the flood",
        rank: "major",
      },
      {
        name: "Isis",
        wiki: "https://en.wikipedia.org/wiki/Isis",
        domain: "healing, protection, mourning",
        rank: "major",
        relation: { kind: "consort-of", of: "Osiris" },
      },
      {
        name: "Horus",
        wiki: "https://en.wikipedia.org/wiki/Horus",
        domain: "kingship, the sky",
        rank: "major",
        relation: { kind: "child-of", of: "Osiris" },
      },
      {
        name: "Hathor",
        wiki: "https://en.wikipedia.org/wiki/Hathor",
        domain: "love, music, the western hills",
        rank: "major",
      },
      {
        name: "Ptah",
        wiki: "https://en.wikipedia.org/wiki/Ptah",
        domain: "craft, making",
        rank: "major",
      },
      {
        name: "Thoth",
        wiki: "https://en.wikipedia.org/wiki/Thoth",
        domain: "writing, reckoning",
        rank: "major",
      },
      {
        name: "Sekhmet",
        wiki: "https://en.wikipedia.org/wiki/Sekhmet",
        domain: "plague and its cure",
        rank: "major",
        relation: { kind: "aspect-of", of: "Hathor" },
      },
      {
        name: "Bes",
        wiki: "https://en.wikipedia.org/wiki/Bes",
        domain: "childbirth, the household door",
        rank: "local",
      },
      {
        name: "Taweret",
        wiki: "https://en.wikipedia.org/wiki/Taweret",
        domain: "pregnancy, infants",
        rank: "local",
      },
      {
        name: "Meretseger",
        wiki: "https://en.wikipedia.org/wiki/Meretseger",
        domain: "the Theban peak and its snakes",
        rank: "local",
      },
      {
        name: "The ancestors",
        domain: "the household's own dead",
        rank: "local",
      },
    ],
    practice: [
      "Bread, beer and linen left at a household niche.",
      "The great gods are approached through their temple and its festivals, not at home.",
      "Letters are written to the family dead asking them to intervene.",
      "Amulets are worn against scorpions, snakes and the dangers of birth.",
    ],
    specialist:
      "Temple priests for the state gods; the household head at the domestic niche.",
    afterlife:
      "A judged passage west, then a continued life that the living must keep supplied.",
    evidence: {
      status: "documented",
      claim:
        "Amun-Ra's paramount position in the New Kingdom, the Osiris-Isis-Horus grouping, and household devotion to Bes, Taweret and the ancestors are well attested in temple and settlement evidence, including Deir el-Medina.",
      sources: [
        "Assmann, The Search for God in Ancient Egypt",
        "Baines, 'Practical Religion and Piety'",
        "Meskell, Private Life in New Kingdom Egypt",
      ],
      limitation:
        "One schematic summary standing in for centuries of change and for practice that varied by town, trade and household.",
    },
  },
];
