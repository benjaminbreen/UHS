import type { WorldSetting } from "../geography/types";
import { customFor, type HouseholdCustom } from "./scoped";

/**
 * A man with more than one wife, or a wife and a concubine, where law and
 * custom allowed it. Lines fill {name} (the later wife), {first} (the first)
 * and {as} (`word`).
 */
export type PluralMarriage = HouseholdCustom & {
  /** Share of married men of comfortable means with a second wife at home. */
  share: number;
  /** Means below which hardly any man could keep two wives. */
  minMeans: number;
  /** What the later wife is called. */
  word: string;
  lines: readonly string[];
};

export const pluralMarriages: PluralMarriage[] = [
  {
    id: "compound-co-wives",
    label: "Senior and junior wives in West African compounds",
    priority: 2,
    scope: { years: [-1000, 1950], cultures: ["west-central-african"] },
    evidence: "documented",
    share: 0.35,
    minMeans: 0.2,
    word: "junior wife",
    lines: [
      "Your junior wife {name} has her own room and cooking hearth in the compound. {first}, your senior wife, has the say over her.",
      "{name} is your junior wife. She defers to {first}, your senior wife, who chose her for you as much as you did.",
    ],
    note: "A Yoruba or Akan compound housed a man's wives each with her own room, hearth and trade; the senior wife (iyale among the Yoruba) ranked above those who married in after her.",
    sources: ["https://en.wikipedia.org/wiki/Polygyny_in_Africa"],
  },
  {
    id: "homestead-houses",
    label: "The great wife and the houses of a southern African homestead",
    priority: 2,
    scope: { years: [-1000, 1950], cultures: ["east-southern-african"] },
    evidence: "documented",
    share: 0.3,
    minMeans: 0.3,
    word: "second wife",
    lines: [
      "{name}, your second wife, has her own hut in the homestead and her own cattle to milk. {first} is the great wife, and her eldest son will be your heir.",
      "You paid {name}'s family in cattle when you married her, and she has her own hut beside {first}'s. Each wife's house keeps its own fields and herd.",
    ],
    note: "In Zulu, Xhosa and related homesteads each wife headed her own house, with its own hut, fields and cattle; the great wife's eldest son was the principal heir. Marriage was sealed by cattle paid to the bride's family (lobola).",
    sources: ["https://en.wikipedia.org/wiki/Polygyny_in_Africa", "https://en.wikipedia.org/wiki/Lobolo"],
  },
  {
    id: "islamic-co-wives",
    label: "Up to four wives under Islamic law",
    priority: 2,
    scope: { years: [630, 1950], cultures: ["north-african-west-asian", "inner-eurasian"] },
    evidence: "documented",
    share: 0.1,
    minMeans: 0.5,
    word: "second wife",
    lines: [
      "{name} is your second wife. The law allows up to four if you treat them equally, and {first} watches closely to see that you do.",
      "{name} is your second wife, and you owe her the same nights, food and clothing as {first}. The law is clear on it, and so is {first}.",
    ],
    note: "The Quran (4:3) allows a man up to four wives on condition he treats them equally; in practice plural marriage was mostly for men who could afford separate rooms and maintenance for each.",
    sources: ["https://en.wikipedia.org/wiki/Polygyny_in_Islam"],
  },
  {
    id: "ancient-near-east",
    label: "A second wife in the ancient Near East",
    priority: 1,
    scope: { years: [-3000, 630], cultures: ["north-african-west-asian"] },
    evidence: "documented",
    share: 0.05,
    minMeans: 0.5,
    word: "second wife",
    lines: [
      "{name} is your second wife. By law and custom she ranks below {first}, your first wife, and must not set herself up as her equal.",
    ],
    note: "Hammurabi's laws (§144–146) let a man take a second wife in some cases, chiefly when the first bore no children, but the second was not to rank equal with the first.",
    sources: ["https://en.wikipedia.org/wiki/Code_of_Hammurabi"],
  },
  {
    id: "concubine-east-asia",
    label: "The concubine in East Asian households",
    priority: 2,
    scope: { years: [-1000, 1950], cultures: ["east-asian"] },
    evidence: "documented",
    share: 0.25,
    minMeans: 0.65,
    word: "concubine",
    lines: [
      "{name} is your concubine. She lives in the house but is not a wife, and her children call {first}, your wife, their mother.",
      "{name} is your concubine. She came into the house without a wedding, and {first}, as your wife, runs the household and gives her orders.",
    ],
    note: "A man could have only one wife (qi) but could keep concubines (qie) in the household; a concubine's children counted the principal wife as their legal mother.",
    sources: ["https://en.wikipedia.org/wiki/Concubinage_in_China"],
  },
  {
    id: "steppe-tents",
    label: "Each wife her own tent on the steppe",
    priority: 3,
    scope: { years: [-1000, 1700], cultures: ["inner-eurasian"] },
    evidence: "documented",
    share: 0.2,
    minMeans: 0.4,
    word: "second wife",
    lines: [
      "{name} is your second wife and keeps her own tent beside {first}'s. As the first wife, {first} has her tent in the place of honour.",
    ],
    note: "Mongol and Turkic men of means kept several wives, each with her own tent, herds and household; the senior wife's tent stood in the place of honour.",
    sources: ["https://en.wikipedia.org/wiki/Ger_(yurt)"],
  },
  {
    id: "nahua-secondary-wives",
    label: "Principal and secondary wives among Nahua nobles",
    priority: 2,
    scope: { years: [-500, 1521], cultures: ["mesoamerican"] },
    evidence: "documented",
    share: 0.2,
    minMeans: 0.7,
    word: "secondary wife",
    lines: [
      "{name} is a secondary wife. Only {first}'s children, the children of your principal wife, can inherit your rank.",
    ],
    note: "Nahua lords took many wives, but only the children of the principal wife, usually of the highest birth, inherited rank; Nezahualcoyotl of Texcoco is said to have had dozens.",
    sources: ["https://en.wikipedia.org/wiki/Aztec_society"],
  },
  {
    id: "inca-granted-wives",
    label: "Secondary wives granted by the Inca state",
    priority: 2,
    scope: { years: [1400, 1535], cultures: ["andean"] },
    evidence: "documented",
    share: 0.15,
    minMeans: 0.7,
    word: "secondary wife",
    lines: [
      "{name} was given to you as a secondary wife by the Inca's officials, as a reward for good service. {first} remains your principal wife.",
    ],
    note: "The Inca rewarded favoured men and local lords with secondary wives from the state's own households; commoners were expected to have one wife.",
    sources: ["https://en.wikipedia.org/wiki/Inca_society"],
  },
  {
    id: "sororal-plains",
    label: "Marrying sisters on the Plains",
    priority: 3,
    scope: { years: [1700, 1890], cultures: ["other-indigenous-american"], bounds: [-114, 30, -90, 53] },
    evidence: "documented",
    share: 0.2,
    minMeans: 0.3,
    word: "second wife",
    lines: [
      "{name}, your second wife, is {first}'s younger sister. Marrying sisters is common here, since sisters work well together in one tipi.",
    ],
    note: "Among the Lakota, Cheyenne, Blackfoot and other Plains peoples a successful man often married sisters (sororal polygyny); more women in a household meant more hides could be prepared for trade.",
    sources: ["https://en.wikipedia.org/wiki/Sororate_marriage"],
  },
  {
    id: "promised-wives",
    label: "Promised marriage in Aboriginal Australia",
    priority: 2,
    scope: { years: [-50000, 1900], cultures: ["australian-pacific"], bounds: [112, -44, 154, -10] },
    evidence: "documented",
    share: 0.25,
    minMeans: 0,
    word: "second wife",
    lines: [
      "{name} is your second wife, much younger than {first}. She was promised to you under the kinship rules long before she was grown.",
    ],
    note: "Marriages were arranged through kinship rules, often by promise in childhood, and older men commonly had more than one wife.",
    sources: ["https://en.wikipedia.org/wiki/Australian_Aboriginal_kinship"],
  },
  {
    id: "minor-wife",
    label: "Major and minor wives in mainland Southeast Asia",
    priority: 2,
    scope: { years: [1300, 1935], cultures: ["southeast-asian"] },
    evidence: "documented",
    share: 0.1,
    minMeans: 0.65,
    word: "minor wife",
    lines: [
      "{name} is your minor wife. {first}, your major wife, runs the household and its money, and {name} knows it.",
    ],
    note: "Siamese law ranked a man's wives: the major wife (mia luang) above minor wives (mia noi) and slave wives, with different shares of property.",
    sources: ["https://en.wikipedia.org/wiki/Polygamy_in_Thailand"],
  },
  {
    id: "south-asian-co-wife",
    label: "A second wife in a South Asian household",
    priority: 1,
    scope: { years: [-1500, 1955], cultures: ["south-asian"] },
    evidence: "inferred",
    share: 0.04,
    minMeans: 0.75,
    word: "second wife",
    lines: [
      "{name} is your second wife. Few men can afford two, and the whole household knows that {first} ranks first.",
    ],
    note: "Hindu law allowed plural marriage until 1955 and it was common among kings and wealthy landholders, rarer below them, often taken when the first wife had no son.",
    sources: ["https://en.wikipedia.org/wiki/Polygamy_in_India"],
  },
];

export const pluralMarriageFor = (setting?: WorldSetting) => customFor(pluralMarriages, setting);
