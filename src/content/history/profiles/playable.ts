import { bce } from "../dates";
import { basicStores, choice, legacySelections } from "../catalog";
import type { Evidence, Place, Rule } from "../types";

export const places: Place[] = [
  {
    id: "tiber",
    label: "Tiber lowlands · Roman community",
    regions: ["roman-italy"],
    community: "tiber-roman",
    culture: "european",
    sample: { year: 100 },
    coverage:
      "Generator-v1 compatibility profile for 100 CE. Regional window 1–200 CE is an authoring approximation; catalog entries retain prototype assumptions.",
  },
  {
    id: "konya",
    label: "Konya plain · Neolithic households",
    regions: ["central-anatolia"],
    community: "konya-neolithic",
    culture: "north-african-west-asian",
    sample: bce(6500),
    coverage:
      "Generator-v1 compatibility profile for c. 6500 BCE. Language is an exploratory choice, not an attestation. The 7000–6000 BCE window is deliberately coarse.",
  },
];
export const kits = {
  "early-stores": basicStores,
  "roman-v1": legacySelections("roman"),
  "neolithic-v1": legacySelections("neolithic"),
};
const languageGuess: Evidence = {
  status: "hypothesis",
  sources: ["anatolian-2012", "hybrid-2023", "steppe-2015"],
  claim:
    "Exploratory assignment: an early Indo-European-related speech community under the Anatolian farming-dispersal hypothesis.",
  limitation:
    "The assignment to these Konya households is our scenario inference. Their language is unattested. Competing models place origins/dispersals differently; neither DNA nor this source establishes the language spoken at Çatalhöyük. Do not label it attested Hittite or generate purportedly authentic dialogue.",
};
export const rules: Rule[] = [
  {
    id: "europe-antiquity-stores",
    level: "baseline",
    culture: "european",
    eras: ["antiquity"],
    kits: ["early-stores"],
    note: "Declared minimal prototype fallback, not a complete European antiquity package.",
  },
  {
    id: "west-asia-holocene-stores",
    level: "baseline",
    culture: "north-african-west-asian",
    eras: ["early-holocene"],
    kits: ["early-stores"],
    note: "Declared prototype fallback; agriculture and vessel technology still need local justification.",
  },
  {
    id: "roman-italy-v1",
    level: "regional",
    culture: "european",
    eras: ["antiquity"],
    regions: ["roman-italy"],
    dates: { start: { year: 1 }, end: { year: 201 } },
    kits: ["roman-v1"],
    selections: [
      choice(
        "prop.amphora",
        {
          status: "inferred",
          sources: ["roman-amphorae"],
          claim:
            "Storage and transport vessels belong in commercial storage contexts.",
          limitation:
            "The existing sprite is schematic. The relief supports sealed transport vessels, not this exact sprite, frequency, or every household's possessions.",
        },
        { contexts: ["market", "storehouse"], supply: "imported" },
      ),
    ],
    note: "Compatibility selections scoped to Roman Italy, not the entire European family.",
    facts: {
      authority: {
        label: "Roman imperial authority",
        evidence: {
          status: "inferred",
          sources: ["ostia"],
          claim: "The prototype is situated in Roman imperial Italy.",
          limitation:
            "No local officeholders, municipal jurisdiction, or political mechanics are modeled.",
        },
      },
      language: {
        label: "Latin · Italic branch of Indo-European",
        evidence: {
          status: "inferred",
          sources: ["ostia"],
          claim:
            "Latin is the prototype's working language assumption for Roman Italy.",
          limitation:
            "This does not establish every resident's language or exclude a multilingual port population. Dialogue remains translated English.",
        },
      },
    },
  },
  {
    id: "konya-v1",
    level: "local",
    culture: "north-african-west-asian",
    eras: ["early-holocene"],
    places: ["konya"],
    dates: { start: bce(7000), end: bce(6000) },
    kits: ["neolithic-v1"],
    selections: [
      choice(
        "item.coin",
        {
          status: "inferred",
          sources: ["catal-architecture"],
          claim: "Exclude coined money from this Neolithic household scenario.",
          limitation:
            "The existing obsidian-for-grain trade is a gameplay convention, not a reconstructed exchange rate.",
        },
        { availability: "excluded" },
      ),
    ],
    facts: {
      language: {
        label: "Early Indo-European affiliation? · Anatolian-farming scenario",
        evidence: languageGuess,
        alternatives: [
          {
            label:
              "Unclassified local language(s), possibly without surviving descendants",
            evidence: {
              status: "inferred",
              sources: ["hybrid-2023", "steppe-2015"],
              claim:
                "Do not assign a known family when choosing a conservative scenario.",
              limitation:
                "These studies do not identify the actual language of the settlement; unclassified is an epistemic alternative, not the name of a language family.",
            },
          },
        ],
      },
      authority: {
        label: "Local household/community authority · reconstruction",
        evidence: {
          status: "hypothesis",
          sources: ["catal-architecture"],
          claim:
            "Use household/community-scale authority as a scenario starting assumption.",
          limitation:
            "No named ruler or demonstrated constitutional structure is recoverable from the supplied evidence; absence of a named ruler does not prove egalitarianism.",
        },
      },
    },
    note: "Local prototype plus explicit exclusions and a reviewable language hypothesis.",
  },
];
