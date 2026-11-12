import type { WorldSetting } from "../geography/types";
import { customFor, type HouseholdCustom } from "./scoped";

/**
 * When people first married and how many never did. It decides how many
 * households hold a young couple, how long daughters stay at home, and so how
 * many women in a street have a baby with them.
 */
export type MarriageAge = HouseholdCustom & {
  /** Typical age at first marriage. */
  women: number;
  men: number;
  /** Share who never marry. */
  never: number;
};

const W = "https://en.wikipedia.org/wiki/";
const ALL: [number, number] = [-100000, 1950];

export const marriageAges: MarriageAge[] = [
  {
    id: "early-and-universal",
    label: "Early and near-universal marriage",
    priority: 0,
    scope: { years: ALL },
    evidence: "inferred",
    women: 17, men: 22, never: 0.03,
    note: "Outside north-west Europe almost every woman married, most within a few years of puberty; this is the pattern Hajnal set the European one against.",
    sources: [W + "Hajnal_line"],
  },
  {
    id: "african-polygyny",
    label: "Young brides and older grooms, sub-Saharan Africa",
    priority: 1,
    scope: { years: ALL, cultures: ["west-central-african", "east-southern-african"] },
    evidence: "inferred",
    women: 17, men: 26, never: 0.02,
    note: "Where bridewealth had to be raised and older men took second wives, women married in their teens and men waited into their mid or late twenties.",
    sources: [W + "Bride_price", W + "Polygyny"],
  },
  {
    id: "south-asian-early",
    label: "Marriage in the early teens, South Asia",
    priority: 1,
    scope: { years: [-500, 1950], cultures: ["south-asian"] },
    evidence: "documented",
    women: 15, men: 20, never: 0.01,
    note: "The 1891 census of India found the average bride was about twelve and a half; a wife usually moved to her husband's house some years after the wedding, so fifteen stands for when married life began.",
    sources: [W + "Child_marriage_in_India", W + "Age_of_Consent_Act,_1891"],
  },
  {
    id: "chinese-universal",
    label: "Universal marriage for women, China",
    priority: 1,
    scope: { years: [-200, 1950], cultures: ["east-asian"], bounds: [97, 18, 123, 45] },
    evidence: "documented",
    women: 18, men: 22, never: 0.01,
    note: "In Qing population registers nearly every woman was married by twenty; a share of poor men never found a wife at all.",
    sources: [W + "Marriage_in_Imperial_China"],
  },
  {
    id: "tokugawa-village",
    label: "Marriage in the early twenties, Tokugawa Japan",
    priority: 2,
    scope: { years: [1600, 1900], cultures: ["east-asian"], bounds: [129, 30, 146, 46] },
    evidence: "documented",
    women: 21, men: 26, never: 0.04,
    note: "Village population registers of central Japan show women marrying at about twenty to twenty-two and men in their mid to late twenties, later than in China.",
    sources: [W + "Demographic_history_of_Japan_before_the_Meiji_Restoration"],
  },
  {
    id: "mediterranean",
    label: "Teenage brides and grooms near thirty, the Mediterranean",
    priority: 1,
    scope: { years: [-800, 1950], cultures: ["european", "north-african-west-asian"] },
    evidence: "documented",
    women: 18, men: 28, never: 0.04,
    note: "Roman epitaphs put most brides in their late teens and grooms near thirty; the Florentine tax survey of 1427 found the same, brides about eighteen and grooms about thirty.",
    sources: [W + "Marriage_in_ancient_Rome", W + "Catasto"],
  },
  {
    id: "northwest-european",
    label: "Late marriage and many who never married, north-west Europe",
    priority: 3,
    scope: { years: [1300, 1950], cultures: ["european"], bounds: [-11, 45, 25, 62], except: [[5, 45, 17, 49]] },
    evidence: "documented",
    women: 25, men: 27, never: 0.12,
    note: "English parish registers from 1550 to 1800 give a mean first marriage near twenty-five for women and twenty-seven for men, and one in ten or more never married.",
    sources: [W + "Western_European_marriage_pattern"],
  },
  {
    id: "modern",
    label: "Marriage in the early twenties, later twentieth century",
    priority: 0,
    scope: { years: [1950, 100001] },
    evidence: "documented",
    women: 22, men: 25, never: 0.06,
    note: "After 1950 the age of marriage rose almost everywhere as girls stayed longer at school.",
    sources: [W + "Age_at_first_marriage"],
  },
  {
    id: "modern-late",
    label: "Marriage near thirty, if at all: Europe and East Asia since 1970",
    priority: 1,
    scope: { years: [1970, 100001], cultures: ["european", "east-asian"] },
    evidence: "documented",
    women: 28, men: 30, never: 0.18,
    note: "By the 2000s the mean age at first marriage had passed thirty in much of Europe and East Asia, and many couples lived together without marrying.",
    sources: [W + "Age_at_first_marriage"],
  },
];

export const marriageAgeFor = (setting?: WorldSetting) => customFor(marriageAges, setting);
