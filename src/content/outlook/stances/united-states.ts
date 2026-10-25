import type { Stance } from "../types";

const w = "https://en.wikipedia.org/wiki/";
const US = [-125, 25, -67, 49] as const;

/**
 * The ordinary politics of the industrial United States. Scoped by box rather
 * than culture, because the gazetteer labels most of the country European.
 * Without these, the international ideologies were all a Gilded Age American
 * could hold, and one in five came out a Marxist.
 */
export const unitedStates: readonly Stance[] = [
  {
    id: "stance.us-sound-money",
    label: "Sound-money Republican",
    short: "Republican",
    icon: "scales",
    clause: "wants the tariff high and the dollar on gold",
    kind: "economic",
    tags: ["mercantile", "hierarchical", "civic"],
    scope: { years: [1865, 1933], bounds: US },
    weight: 20,
    wiki: `${w}Gold_standard`,
    note: "The party of the Union, the protective tariff and the gold dollar, which held the presidency for most of the half-century after the Civil War.",
    sources: [],
  },
  {
    id: "stance.us-free-silver",
    label: "Free silver",
    icon: "wheel",
    clause: "wants silver coined to ease the farmer's debts",
    kind: "economic",
    tags: ["agrarian", "egalitarian", "reformist"],
    scope: { years: [1873, 1910], bounds: US },
    weight: 14,
    wiki: `${w}Free_silver`,
    note: "Coining silver at sixteen to one would inflate the currency and lighten debts owed in dollars. It carried every mining state in 1896; Colorado gave Bryan 85 per cent.",
    sources: [],
  },
  {
    id: "stance.us-self-made",
    label: "Self-made",
    icon: "ladder",
    clause: "holds that any sober worker can rise",
    kind: "economic",
    tags: ["individualist", "mercantile", "worldly"],
    scope: { years: [1840, 1940], bounds: US },
    weight: 16,
    wiki: `${w}Horatio_Alger_myth`,
    note: "Thrift, sobriety and hard work bring a man up from nothing; the poor are mostly those who have not tried. The common sense of the Gilded Age, and of its dime novels.",
    sources: [],
  },
  {
    id: "stance.us-populist",
    label: "Populist",
    icon: "crowd",
    clause: "blames the banks and railroads for the farmer's ruin",
    kind: "political",
    tags: ["agrarian", "egalitarian", "reformist"],
    scope: { years: [1886, 1912], bounds: US },
    weight: 12,
    wiki: `${w}People%27s_Party_(United_States)`,
    note: "The People's Party of 1892 wanted a graduated income tax, public railroads and the direct election of senators. Colorado elected a Populist governor in 1892.",
    sources: [],
  },
  {
    id: "stance.us-temperance",
    label: "Temperance",
    icon: "lamp",
    clause: "would close every saloon in the country",
    kind: "ethical",
    tags: ["devout", "reformist", "ascetic"],
    scope: { years: [1830, 1934], bounds: US },
    notFor: ["publican", "innkeeper", "brewer"],
    weight: 14,
    wiki: `${w}Temperance_movement_in_the_United_States`,
    note: "Drink ruins the wage-earner and his family. The Woman's Christian Temperance Union had about 150,000 members by 1900, and the Anti-Saloon League was organised in 1893.",
    sources: [],
  },
  {
    id: "stance.us-machine-loyal",
    label: "Party loyal",
    icon: "hand",
    clause: "votes as the ward boss and the lodge vote",
    kind: "political",
    tags: ["communal", "traditionalist", "civic"],
    scope: { years: [1840, 1940], bounds: US },
    weight: 16,
    wiki: `${w}Political_machine`,
    note: "The party is a matter of family, parish and who found you work, more than of programme; turnout in the 1890s ran near 80 per cent of eligible men.",
    sources: [],
  },
];
