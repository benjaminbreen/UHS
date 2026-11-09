import type { WorldSetting } from "../geography/types";
import { customFor, type HouseholdCustom } from "./scoped";

/**
 * Where a married couple lives: with the husband's parents, with the wife's,
 * or in a house of their own. It decides which grown children stay at home,
 * who marries into the house, and whose parent is taken in.
 *
 * `child` lines fill {name} (the one who married in), {as} (wife or husband),
 * {child} (son or daughter) and {kid} (the child's name). `parent` lines fill
 * {name}, {as} (mother-in-law or father-in-law), {she}, {her} and {him}.
 */
export type ResidenceCustom = HouseholdCustom & {
  rule: "patrilocal" | "matrilocal" | "neolocal";
  /** Only the eldest son brings his wife home; the others set up elsewhere. */
  heirOnly?: boolean;
  /** Share of grown children of the staying sex who are married and living at home. */
  stay: number;
  lines: { child: readonly string[]; parent: readonly string[] };
};

const CHINA = [97, 18, 123, 45] as const;

const patrilocalParent = [
  "Your {as} {name} has run this house since before you married into it, and still does.",
  "You came to this house as a bride, and your {as} {name} still keeps its keys.",
];
const matrilocalParent = [
  "When you married you moved into your wife's family's house, as men do here. Your {as} {name} still runs it.",
  "This is your wife's family's house, and you came to live in it when you married, as men do here. Your {as} {name} has the final say in it.",
];

export const residenceCustoms: ResidenceCustom[] = [
  {
    id: "household-of-ones-own",
    label: "A household of one's own (the north-west European marriage pattern)",
    priority: 2,
    scope: { years: [1300, 10001], cultures: ["european"], bounds: [-11, 45, 25, 62], except: [[5, 45, 17, 49]] },
    evidence: "documented",
    rule: "neolocal",
    stay: 0.08,
    lines: {
      child: [
        "Your {child} {kid} and {kid}'s {as} {name} are living with you only until they can afford a house of their own.",
      ],
      parent: [
        "Your {as} {name} came to live with you when {she} was widowed and could no longer manage alone.",
      ],
    },
    note: "From the late Middle Ages people in north-west Europe married late, in their mid-twenties, and a couple was expected to set up its own household; many spent their youth as servants in other people's houses first.",
    sources: ["https://en.wikipedia.org/wiki/Western_European_marriage_pattern"],
  },
  {
    id: "stem-family-alpine",
    label: "The stem family of the Alps and Pyrenees",
    priority: 3,
    scope: { years: [1300, 1950], cultures: ["european"], bounds: [-2, 41, 17, 49], except: [[4.5, 41, 17, 45]] },
    evidence: "documented",
    rule: "patrilocal",
    heirOnly: true,
    stay: 0.75,
    lines: {
      child: [
        "Your {child} {kid} will inherit the house whole, so {name} married into it and lives here with you. The younger ones will have to make their own way.",
      ],
      parent: patrilocalParent,
    },
    note: "In the Pyrenees and the Alps a single heir, usually the eldest son, inherited the farm undivided and brought his wife into his parents' house; his siblings married out, entered the church, or stayed on unmarried.",
    sources: ["https://en.wikipedia.org/wiki/Stem_family"],
  },
  {
    id: "zadruga",
    label: "Joint households of brothers in the Balkans and Russia",
    priority: 2,
    scope: { years: [800, 1930], cultures: ["european"], bounds: [13, 40, 60, 62] },
    evidence: "documented",
    rule: "patrilocal",
    stay: 0.8,
    lines: {
      child: [
        "{name} married your {child} {kid} and moved into your house, as brides do here. Sons stay at home and bring their wives in.",
      ],
      parent: patrilocalParent,
    },
    note: "The South Slav zadruga and the Russian peasant household kept married brothers, their wives and children under one head, often for generations; brides moved in with the husband's family.",
    sources: ["https://en.wikipedia.org/wiki/Zadruga"],
  },
  {
    id: "chinese-joint-family",
    label: "Several generations under one roof in China",
    priority: 2,
    scope: { years: [-1000, 1950], cultures: ["east-asian"], bounds: CHINA },
    evidence: "documented",
    rule: "patrilocal",
    stay: 0.85,
    lines: {
      child: [
        "{name} married your {child} {kid} and moved into your house, as brides do. In this house she answers to you.",
        "Your {child} {kid}'s {as} {name} came from another village when they married, and now lives under your roof and your rule.",
      ],
      parent: patrilocalParent,
    },
    note: "The ideal household kept several generations of a male line together: sons stayed, brides moved in and came under the authority of their mothers-in-law, and daughters married out into other families.",
    sources: ["https://en.wikipedia.org/wiki/Chinese_kinship"],
  },
  {
    id: "ie",
    label: "The ie, the stem household of Japan",
    priority: 3,
    scope: { years: [1300, 1950], cultures: ["east-asian"], bounds: [128, 30, 146, 46] },
    evidence: "documented",
    rule: "patrilocal",
    heirOnly: true,
    stay: 0.8,
    lines: {
      child: [
        "Your {child} {kid} is the heir to the house, so {name} married into it and lives here with you. The other children will marry out or set up branch households.",
      ],
      parent: patrilocalParent,
    },
    note: "The ie passed whole to one heir, usually the eldest son, who brought his wife into his parents' house; a family with no son adopted a son-in-law to carry it on.",
    sources: ["https://en.wikipedia.org/wiki/Ie_(Japanese_family_system)"],
  },
  {
    id: "joint-family-south-asia",
    label: "The joint family of South Asia",
    priority: 2,
    scope: { years: [-1500, 1950], cultures: ["south-asian"] },
    evidence: "documented",
    rule: "patrilocal",
    stay: 0.8,
    lines: {
      child: [
        "{name} came from her parents' village when she married your {child} {kid}, and lives under your roof now, as wives do.",
      ],
      parent: patrilocalParent,
    },
    note: "Married sons stayed in their father's house with their wives and children, holding property in common, and a bride moved from her own family's village into her husband's.",
    sources: ["https://en.wikipedia.org/wiki/Hindu_joint_family"],
  },
  {
    id: "extended-family-west-asia",
    label: "Extended households of the Near East and North Africa",
    priority: 1,
    scope: { years: [-3000, 1950], cultures: ["north-african-west-asian", "inner-eurasian"] },
    evidence: "inferred",
    rule: "patrilocal",
    stay: 0.6,
    lines: {
      child: [
        "{name} married your {child} {kid} and came to live in your house, as brides usually do here.",
      ],
      parent: patrilocalParent,
    },
    note: "Across the region a bride usually joined her husband's father's household, at least until the couple could set up nearby; the pattern is attested from Mesopotamian contracts to Ottoman census registers.",
    sources: ["https://en.wikipedia.org/wiki/Patrilocal_residence"],
  },
  {
    id: "compound-africa",
    label: "Family compounds of West and southern Africa",
    priority: 1,
    scope: { years: [-1000, 1950], cultures: ["west-central-african", "east-southern-african"] },
    evidence: "documented",
    rule: "patrilocal",
    stay: 0.7,
    lines: {
      child: [
        "{name} married your {child} {kid} and lives in the family compound with you, as wives do.",
      ],
      parent: patrilocalParent,
    },
    note: "In most of sub-Saharan Africa married sons built or took rooms in their father's compound or homestead, and wives came to live there; the matrilineal belt of central Africa was the great exception.",
    sources: ["https://en.wikipedia.org/wiki/Patrilocal_residence"],
  },
  {
    id: "matrilineal-belt",
    label: "Husbands moving to the wife's village in central Africa",
    priority: 3,
    scope: { years: [-1000, 1950], cultures: ["east-southern-african", "west-central-african"], bounds: [22, -17, 36, -8] },
    evidence: "documented",
    rule: "matrilocal",
    stay: 0.7,
    lines: {
      child: [
        "{name} married your daughter {kid} and moved into your household, as husbands do here, and must work for your family to prove himself.",
      ],
      parent: matrilocalParent,
    },
    note: "Among the Bemba, Chewa and their neighbours a new husband moved to his wife's village and worked for her parents, sometimes for years, before he could take her elsewhere.",
    sources: ["https://en.wikipedia.org/wiki/Matrilocal_residence"],
  },
  {
    id: "mesoamerican-household",
    label: "A bride joining her husband's family in Mesoamerica",
    priority: 1,
    scope: { years: [-1000, 1950], cultures: ["mesoamerican"] },
    evidence: "documented",
    rule: "patrilocal",
    stay: 0.6,
    lines: {
      child: [
        "{name} married your {child} {kid} and lives with you, as a new couple does until they can build a house of their own nearby.",
      ],
      parent: patrilocalParent,
    },
    note: "Nahua and Maya newlyweds usually lived with the husband's family at first, and households grew into compounds of related couples around a shared patio.",
    sources: ["https://en.wikipedia.org/wiki/Calpolli"],
  },
  {
    id: "longhouse",
    label: "The longhouse of the wife's clan",
    priority: 3,
    scope: { years: [1000, 1850], cultures: ["other-indigenous-american"], bounds: [-83, 39, -71, 47] },
    evidence: "documented",
    rule: "matrilocal",
    stay: 0.8,
    lines: {
      child: [
        "{name} married your daughter {kid} and moved into the longhouse, as husbands do. The house belongs to her clan, not to him.",
      ],
      parent: matrilocalParent,
    },
    note: "Haudenosaunee and Huron longhouses held a line of related women with their husbands and children; a man moved into his wife's longhouse, and the clan mother of the house chose its leaders.",
    sources: ["https://en.wikipedia.org/wiki/Longhouse", "https://en.wikipedia.org/wiki/Clan_mother"],
  },
  {
    id: "pueblo-household",
    label: "The mother's house among the Pueblo and Navajo",
    priority: 3,
    scope: { years: [700, 1950], cultures: ["other-indigenous-american"], bounds: [-114, 31, -103, 38] },
    evidence: "documented",
    rule: "matrilocal",
    stay: 0.75,
    lines: {
      child: [
        "{name} married your daughter {kid} and came to live in your house, as husbands do here. The house and its fields pass down through the women.",
      ],
      parent: matrilocalParent,
    },
    note: "Hopi and Zuni houses and fields belonged to women and passed from mother to daughter; a husband moved in with his wife's family, as Navajo husbands did too.",
    sources: ["https://en.wikipedia.org/wiki/Matrilocal_residence"],
  },
  {
    id: "cherokee-household",
    label: "The wife's clan household among the Cherokee",
    priority: 3,
    scope: { years: [1000, 1838], cultures: ["other-indigenous-american"], bounds: [-87, 33, -81, 37.5] },
    evidence: "documented",
    rule: "matrilocal",
    stay: 0.75,
    lines: {
      child: [
        "{name} married your daughter {kid} and lives in your house, as husbands do. Their children will belong to her clan.",
      ],
      parent: matrilocalParent,
    },
    note: "Cherokee households were built around related women of one clan; a husband moved to his wife's household, and their children belonged to her clan.",
    sources: ["https://en.wikipedia.org/wiki/Cherokee_society"],
  },
  {
    id: "rumah-gadang",
    label: "The Minangkabau great house",
    priority: 3,
    scope: { years: [1300, 10001], cultures: ["southeast-asian"], bounds: [99.5, -2, 102, 1] },
    evidence: "documented",
    rule: "matrilocal",
    stay: 0.8,
    lines: {
      child: [
        "{name} married your daughter {kid} and joined your house, as husbands do here, though he still counts as a guest in it.",
      ],
      parent: matrilocalParent,
    },
    note: "A Minangkabau rumah gadang belongs to a line of women; married daughters stay with their husbands, who remain in some sense guests, while ancestral land passes from mother to daughter.",
    sources: ["https://en.wikipedia.org/wiki/Rumah_gadang", "https://en.wikipedia.org/wiki/Minangkabau_people"],
  },
  {
    id: "khasi",
    label: "The youngest daughter's house among the Khasi",
    priority: 3,
    scope: { years: [1000, 10001], cultures: ["south-asian"], bounds: [90.5, 25, 92.5, 26.5] },
    evidence: "documented",
    rule: "matrilocal",
    stay: 0.7,
    lines: {
      child: [
        "{name} married your daughter {kid} and came to live in your house, as husbands do here. The house itself will go to your youngest daughter.",
      ],
      parent: matrilocalParent,
    },
    note: "Among the Khasi descent and property pass through women, and the youngest daughter (ka khadduh) inherits the family house and looks after her parents in it.",
    sources: ["https://en.wikipedia.org/wiki/Khasi_people"],
  },
  {
    id: "modern-household",
    label: "A couple's own household",
    priority: 0,
    scope: { years: [1950, 10001] },
    evidence: "documented",
    rule: "neolocal",
    stay: 0.1,
    lines: {
      child: [
        "Your {child} {kid} and {kid}'s {as} {name} are living with you to save money for a place of their own.",
      ],
      parent: [
        "Your {as} {name} lives with you, since {she} could not manage on {her} own any longer.",
      ],
    },
    note: "Through the twentieth century the couple's own household became the norm in most cities, even where parents and married sons had lived together before.",
    sources: ["https://en.wikipedia.org/wiki/Nuclear_family"],
  },
];

export const residenceFor = (setting?: WorldSetting) => customFor(residenceCustoms, setting);
