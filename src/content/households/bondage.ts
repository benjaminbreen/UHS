import type { WorldSetting } from "../geography/types";
import { customFor, type HouseholdCustom } from "./scoped";

/**
 * People held in a household who were not free to leave it: bought, born into
 * it, taken in war or pledged for a debt. Lines fill {name}, {as} and the
 * pronouns {she} {her} {him} {She} {Her}.
 */
export type HouseholdBondage = HouseholdCustom & {
  /** Means below which a household held nobody. */
  minMeans: number;
  /** Share of households above it holding someone, rising with means. */
  share: number;
  /** Share of a well-off household's servants who were unfree. */
  servants: number;
  ages: readonly [number, number];
  girls: number;
  /** What a bound member of the house is called: female, male. */
  word: readonly [string, string];
  lines: readonly string[];
};

const MEDITERRANEAN = [-10, 30, 37, 46] as const;

export const bondages: HouseholdBondage[] = [
  {
    id: "greek-slaves",
    label: "Household slaves in the Greek cities",
    priority: 2,
    scope: { years: [-700, -146], cultures: ["european"], bounds: [19, 34, 30, 42] },
    evidence: "documented",
    minMeans: 0.3,
    share: 0.5,
    servants: 0.9,
    ages: [10, 45],
    girls: 0.5,
    word: ["slave", "slave"],
    lines: [
      "You bought {name}, a foreigner, in the market by the harbour. {She} cooks, fetches water and goes with you on errands.",
      "{name} is your slave, bought from a dealer. Even a modest household here keeps one or two.",
    ],
    note: "Most Athenian households of any means held slaves, typically foreigners bought from dealers; even craftsmen and small farmers might own one or two.",
    sources: ["https://en.wikipedia.org/wiki/Slavery_in_ancient_Greece"],
  },
  {
    id: "roman-slaves",
    label: "Household slaves in the Roman world",
    priority: 2,
    scope: { years: [-300, 500], cultures: ["european", "north-african-west-asian"], bounds: MEDITERRANEAN },
    evidence: "documented",
    minMeans: 0.3,
    share: 0.5,
    servants: 0.85,
    ages: [8, 45],
    girls: 0.5,
    word: ["slave", "slave"],
    lines: [
      "{name} was born a slave in your house, as {her} mother was. If you free {him} one day, {she} will take your family name and still owe you respect and service.",
      "You bought {name} in the market. Freeing a good slave in your will is common, and {she} knows it.",
    ],
    note: "Roman households of every rank above the poor held slaves, many born in the house (vernae). Freed slaves took their former owner's family name and owed him continuing duties as patron.",
    sources: ["https://en.wikipedia.org/wiki/Slavery_in_ancient_Rome"],
  },
  {
    id: "debt-pledge-mesopotamia",
    label: "Pledged for a debt in Mesopotamia",
    priority: 2,
    scope: { years: [-2400, -500], cultures: ["north-african-west-asian"], bounds: [38, 29, 50, 38] },
    evidence: "documented",
    minMeans: 0.35,
    share: 0.2,
    servants: 0.5,
    ages: [10, 30],
    girls: 0.5,
    word: ["pledged servant", "pledged servant"],
    lines: [
      "{name}'s father pledged {him} to you against a debt. By law {she} goes free in the fourth year, whether or not the debt is paid.",
      "{name} works in your house to pay off {her} family's debt to you. The law says you must release {him} after three years of service.",
    ],
    note: "Hammurabi's laws (§117) say a wife, son or daughter given into debt service must be released in the fourth year; slaves bought outright had no such limit.",
    sources: ["https://en.wikipedia.org/wiki/Code_of_Hammurabi", "https://en.wikipedia.org/wiki/Debt_bondage"],
  },
  {
    id: "islamic-household-slaves",
    label: "Household slaves in the Islamic world",
    priority: 2,
    scope: { years: [650, 1900], cultures: ["north-african-west-asian", "inner-eurasian"] },
    evidence: "documented",
    minMeans: 0.5,
    share: 0.25,
    servants: 0.7,
    ages: [10, 40],
    girls: 0.6,
    word: ["slave", "slave"],
    lines: [
      "{name} was bought from traders and works in your house. Freeing a slave counts as an act of piety, and many are freed after years of service.",
      "{name} is your slave, and the law gives {him} rights: you must feed and clothe {him} as you would yourself, and {she} may buy {her} freedom by contract.",
    ],
    note: "Islamic law required owners to feed and clothe slaves decently, encouraged manumission as a pious act, and allowed a slave to buy freedom by contract (mukataba); a slave woman who bore her owner's child could not be sold and was freed at his death.",
    sources: ["https://en.wikipedia.org/wiki/Islamic_views_on_slavery"],
  },
  {
    id: "chinese-bondservants",
    label: "Bondservants bought from poor families in China",
    priority: 2,
    scope: { years: [-200, 1911], cultures: ["east-asian"], bounds: [97, 18, 123, 45] },
    evidence: "documented",
    minMeans: 0.6,
    share: 0.2,
    servants: 0.5,
    ages: [8, 30],
    girls: 0.7,
    word: ["bondservant", "bondservant"],
    lines: [
      "{name} was sold to your family as a child by parents who could not feed {him}, and has worked in the house ever since.",
      "{name} is a bondservant, bought from {her} parents in a famine year. When {she} is grown you are expected to find {him} a match.",
    ],
    note: "Poor families sold children into bondservice in wealthier households; girls bought this way (later called mui tsai) were expected to be married off by the owner when grown.",
    sources: ["https://en.wikipedia.org/wiki/Mui_tsai", "https://en.wikipedia.org/wiki/Slavery_in_China"],
  },
  {
    id: "nobi",
    label: "Hereditary nobi in Korea",
    priority: 3,
    scope: { years: [900, 1894], cultures: ["east-asian"], bounds: [124, 33, 131, 43.5] },
    evidence: "documented",
    minMeans: 0.4,
    share: 0.5,
    servants: 0.9,
    ages: [8, 50],
    girls: 0.5,
    word: ["nobi", "nobi"],
    lines: [
      "{name} is a nobi, a hereditary bondservant owned by your family, as {her} parents were before {him}.",
      "{name} is one of your family's nobi, born into bondage. A nobi can be bought, sold or given away with the rest of the estate.",
    ],
    note: "Nobi were hereditary unfree people who could be bought, sold and inherited; at times in the Joseon period they made up perhaps a third of the population.",
    sources: ["https://en.wikipedia.org/wiki/Nobi"],
  },
  {
    id: "debt-bondage-southeast-asia",
    label: "Debt bondage in Southeast Asia",
    priority: 2,
    scope: { years: [800, 1905], cultures: ["southeast-asian"] },
    evidence: "documented",
    minMeans: 0.4,
    share: 0.3,
    servants: 0.7,
    ages: [10, 45],
    girls: 0.5,
    word: ["bondservant", "bondservant"],
    lines: [
      "{name} came to work for you to pay off a debt. If {her} family can raise the money, they can buy {him} back.",
      "{name} is bound to your household for a debt and works without wages until it is paid. Most people in {her} position never manage it.",
    ],
    note: "Across the region, people owing money entered the creditor's household as bondsmen (the Siamese that, the Malay hamba) and could in principle be redeemed by repaying the sum.",
    sources: ["https://en.wikipedia.org/wiki/Debt_bondage", "https://en.wikipedia.org/wiki/Slavery_in_Thailand"],
  },
  {
    id: "lineage-slavery-africa",
    label: "Captives absorbed into West and Central African lineages",
    priority: 2,
    scope: { years: [800, 1900], cultures: ["west-central-african"] },
    evidence: "documented",
    minMeans: 0.4,
    share: 0.35,
    servants: 0.8,
    ages: [8, 45],
    girls: 0.6,
    word: ["captive", "captive"],
    lines: [
      "{name} was captured in war as a child and brought into your household. {Her} children, if {she} has any here, will count as members of your family, though everyone will remember where they came from.",
      "{name} was bought from traders and works your fields and runs your errands. Over the years {she} has become part of the household, but {she} is not free to leave it.",
    ],
    note: "Captives were absorbed into the households and lineages that held them, working as dependants; over generations their descendants might become kin, though their origin was not forgotten.",
    sources: ["https://en.wikipedia.org/wiki/Slavery_in_Africa"],
  },
  {
    id: "swahili-slaves",
    label: "Household slaves on the Swahili coast",
    priority: 3,
    scope: { years: [800, 1900], cultures: ["east-southern-african"], bounds: [38, -12, 45, 0] },
    evidence: "documented",
    minMeans: 0.5,
    share: 0.35,
    servants: 0.8,
    ages: [10, 45],
    girls: 0.5,
    word: ["slave", "slave"],
    lines: [
      "{name} was bought from caravan traders from the interior and works in your house. Many town households here keep one.",
    ],
    note: "Stone-town households on the Swahili coast held slaves from the interior as domestic servants and field hands; the trade grew sharply in the nineteenth century.",
    sources: ["https://en.wikipedia.org/wiki/Slavery_in_Africa"],
  },
  {
    id: "tlacotli",
    label: "Tlacotin, people who had sold themselves, in central Mexico",
    priority: 2,
    scope: { years: [1200, 1521], cultures: ["mesoamerican"] },
    evidence: "documented",
    minMeans: 0.5,
    share: 0.2,
    servants: 0.5,
    ages: [14, 45],
    girls: 0.4,
    word: ["bondservant", "bondservant"],
    lines: [
      "{name} sold {him}self to you in a hungry year, for a price in cloaks. {She} keeps {her} own property, and any children {she} has are born free.",
      "{name} gambled away {her} freedom and now works for you. {She} can buy it back by paying what {she} owes.",
    ],
    note: "A Nahua tlacotli had usually sold themselves for debt or hunger; they could own property, marry, and buy their freedom, and their children were born free.",
    sources: ["https://en.wikipedia.org/wiki/Slavery_among_the_indigenous_peoples_of_the_Americas"],
  },
  {
    id: "northwest-coast-captives",
    label: "Captives held by Northwest Coast houses",
    priority: 3,
    scope: { years: [500, 1880], cultures: ["other-indigenous-american"], bounds: [-138, 46, -121, 60] },
    evidence: "documented",
    minMeans: 0.4,
    share: 0.3,
    servants: 0.8,
    ages: [8, 45],
    girls: 0.5,
    word: ["captive", "captive"],
    lines: [
      "{name} was taken captive in a raid and works for your house. Captives here are property, and so are their children.",
    ],
    note: "The great houses of the Northwest Coast held captives taken in raids as hereditary slaves; their numbers added to a house's wealth and standing.",
    sources: ["https://en.wikipedia.org/wiki/Slavery_among_the_indigenous_peoples_of_the_Americas"],
  },
  {
    id: "thralls",
    label: "Thralls in the Norse world",
    priority: 2,
    scope: { years: [500, 1200], cultures: ["european"], bounds: [-25, 50, 32, 71] },
    evidence: "documented",
    minMeans: 0.4,
    share: 0.3,
    servants: 0.85,
    ages: [10, 45],
    girls: 0.5,
    word: ["thrall", "thrall"],
    lines: [
      "{name} is your thrall, an unfree servant you own. {She} was taken in a raid across the sea and sold to you.",
      "{name} is a thrall, born to unfree parents on your farm. {She} does the dirtiest work and wears {her} hair cropped short to show it.",
    ],
    note: "Norse farms kept thralls (þrælar), many captured in raids on Ireland, Britain and the Baltic; laws set them apart, and the sagas describe their cropped hair.",
    sources: ["https://en.wikipedia.org/wiki/Thrall"],
  },
  {
    id: "atlantic-slavery",
    label: "Chattel slavery in the Atlantic colonies",
    priority: 2,
    scope: { years: [1550, 1888], bounds: [-98, -35, -34, 40] },
    evidence: "documented",
    minMeans: 0.35,
    share: 0.45,
    servants: 0.9,
    ages: [8, 50],
    girls: 0.5,
    word: ["enslaved woman", "enslaved man"],
    lines: [
      "{name} is enslaved and held by your household under the law. {She} has family on another farm whom {she} is rarely allowed to see.",
      "{name} was bought at auction and works in your house without wages or any right to leave. Under the law, any children {she} has will be enslaved too.",
    ],
    note: "Colonial and later national laws made enslavement hereditary through the mother and treated enslaved Africans and their descendants as property; households of modest means across the Caribbean, Brazil and the American South held enslaved people.",
    sources: ["https://en.wikipedia.org/wiki/Slavery_in_the_colonial_history_of_the_United_States", "https://en.wikipedia.org/wiki/Slavery_in_Brazil"],
  },
];

export const bondageFor = (setting?: WorldSetting) => customFor(bondages, setting);
