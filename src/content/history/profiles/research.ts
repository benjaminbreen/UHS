import { bce } from "../dates";
import { choice } from "../catalog";
import type { Evidence, Place, Rule } from "../types";

export const places: Place[] = [
  {
    id: "moscow-transition",
    label: "Moscow · 1991 transition study",
    regions: ["moscow-study"],
    community: "moscow-study",
    culture: "european",
    sample: { year: 1991, month: 12, day: 24 },
    coverage:
      "Political date-resolution study only, covering 1991–1992. Not a Russian material-culture catalog, border dataset, or playable scene.",
  },
  {
    id: "eurasia-language-study",
    label: "Northern Eurasia · deep-language thought experiment",
    regions: ["northern-eurasia-study"],
    community: "eurasia-study",
    culture: "inner-eurasian",
    sample: bce(13000),
    coverage:
      "Deliberately speculative language study. Broad geographic label, no located archaeological community and no claim that the proposed macrofamily is accepted.",
  },
];
const transition: Evidence = {
  status: "inferred",
  sources: ["soviet-transition", "un-russia"],
  claim:
    "A simplified day-level display of the Moscow transition from Soviet union-level to Russian authority.",
  limitation:
    "December 25 is used as the scenario display boundary after Gorbachev's resignation; the UN continuity letter is dated December 24. This does not claim every legal relationship or former Soviet territory changed at once. Query dates anchor at the start of the stated day; no intra-day event timing is modeled.",
};
export const rules: Rule[] = [
  {
    id: "moscow-before-transition",
    level: "local",
    culture: "european",
    places: ["moscow-transition"],
    dates: { start: { year: 1991 }, end: { year: 1991, month: 12, day: 25 } },
    note: "Authority before the scenario's December 25 display boundary; not an era boundary.",
    selections: [choice("institution.union-government", transition)],
    facts: {
      authority: {
        label:
          "Soviet union-level authority; Russian republican authority also present",
        evidence: transition,
      },
    },
  },
  {
    id: "moscow-after-transition",
    level: "local",
    culture: "european",
    places: ["moscow-transition"],
    dates: { start: { year: 1991, month: 12, day: 25 }, end: { year: 1993 } },
    note: "Russian authority within the same Contemporary era; no implied replacement of local material culture.",
    selections: [
      choice("institution.russian-government", transition),
      choice("institution.union-government", transition, {
        availability: "excluded",
      }),
    ],
    facts: {
      authority: {
        label: "Russian Federation · transition study",
        evidence: transition,
      },
    },
  },
  {
    id: "eurasia-language-hypothesis",
    level: "local",
    culture: "inner-eurasian",
    places: ["eurasia-language-study"],
    dates: { start: bce(15000), end: bce(10000) },
    note: "A bold, source-linked thought experiment; temporal/geographic assignment remains our conjecture.",
    facts: {
      language: {
        label: "Proposed Eurasiatic ancestral affiliation?",
        evidence: {
          status: "hypothesis",
          sources: ["eurasiatic-2013"],
          claim:
            "Explore the deep Eurasian ancestry proposed by Pagel and colleagues as a scenario hypothesis.",
          limitation:
            "Deep macrofamily relationships and reconstruction at this time depth are disputed. This arbitrary northern-Eurasian study location and 15000–10000 BCE authoring window are not authenticated by the paper. No recoverable vocabulary or guaranteed mutual intelligibility is implied.",
        },
        alternatives: [
          {
            label: "Unclassified local forager language",
            evidence: {
              status: "fictional",
              sources: [],
              claim:
                "Use a clearly invented local language identity when declining macrofamily speculation.",
              limitation:
                "A gameplay placeholder, not a recovered language name or proof of linguistic isolation.",
            },
          },
        ],
      },
    },
  },
];
