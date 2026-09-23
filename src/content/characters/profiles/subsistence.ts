import type { CharacterScope, SocietyCapability } from "../context-types";

/*
 * What a place lives on.
 *
 * Work used to be gated on one boolean: `settled_agriculture` was either true
 * here or it was not, and if it was, the place drew from the same village list
 * as everywhere else. So the Mongolian steppe, a Japanese rice district and a
 * Norwegian fjord were all "farming villages" holding the same trades in the
 * same proportions, and Heian Kyoto's commonest job came out as herder.
 *
 * A subsistence mix says how the workforce divides between the ways of getting
 * food, and the resolver scales each livelihood's weight by the share for its
 * kind of workplace. It does not decide what is *available* -- the capability
 * table and each role's own scope still do that -- only how much of the
 * workforce does it.
 *
 * Shares are proportions for populating a settlement, not measured economies.
 */
export type SubsistenceMix = {
  id: string;
  label: string;
  scope: CharacterScope;
  /** Higher wins where two cover the same place and date. */
  priority: number;
  /** Only where the society could do these; a modern mix wants wage labour. */
  requires?: readonly SocietyCapability[];
  shares: {
    /** Sown and reaped: workplace `field`. */
    farming: number;
    /** Stock kept on the hoof: workplace `pasture`. */
    herding: number;
    /** Nets, lines and the shore: workplace `water`. */
    fishing: number;
    /** Taken from the country around: workplace `wild`. */
    foraging: number;
    /** Everything else -- crafts, trade, service, extraction. */
    other: number;
  };
  sources: readonly string[];
  note?: string;
};

export const subsistenceMixes: readonly SubsistenceMix[] = [
  {
    id: "subsistence.steppe",
    label: "Inner Eurasian steppe",
    scope: { years: [-1000000, 1900], bounds: [45, 40, 120, 55] },
    priority: 3,
    shares: { farming: 0.06, herding: 0.55, fishing: 0.02, foraging: 0.12, other: 0.25 },
    sources: ["https://doi.org/10.1017/CBO9781139016735"],
    note: "Mobile pastoralism with grain grown at the edges and traded for. Herds, not fields, are the wealth that matters.",
  },
  {
    id: "subsistence.rice-asia",
    label: "Monsoon rice country",
    scope: { years: [-2000, 10001], bounds: [95, 5, 145, 42] },
    priority: 3,
    shares: { farming: 0.58, herding: 0.03, fishing: 0.14, foraging: 0.05, other: 0.2 },
    sources: ["https://doi.org/10.1017/CHOL9780521243278"],
    note: "Wet rice supports dense settlement on little land and needs many hands at transplanting and harvest. Herding is marginal: draught animals are kept, herds are not.",
  },
  {
    id: "subsistence.arctic",
    label: "Arctic and subarctic",
    scope: { years: [-1000000, 10001], bounds: [-180, 62, 180, 84] },
    priority: 4,
    shares: { farming: 0, herding: 0.2, fishing: 0.42, foraging: 0.18, other: 0.2 },
    sources: ["https://doi.org/10.1017/9781108555654"],
    note: "Sea mammals, fish and reindeer. No cultivation at all, which the capability table already says; this is how the rest of the work divides.",
  },
  // These hold against the industrial mix until their own end dates, which
  // are the dates wage work reached them, not the date it reached Europe.
  {
    id: "subsistence.aboriginal-australia",
    label: "Aboriginal Australia",
    scope: { years: [-65000, 1788], cultures: ["australian-pacific"], bounds: [112, -44, 154, -10] },
    priority: 7,
    shares: { farming: 0, herding: 0, fishing: 0.22, foraging: 0.58, other: 0.2 },
    sources: ["https://doi.org/10.1017/CBO9781139017855", "https://en.wikipedia.org/wiki/Budj_Bim"],
    note: "Hunting, seed and root gathering, shellfish and fishing, with the country managed by fire; in the south-west of Victoria, eels farmed in built channels and ponds.",
  },
  {
    id: "subsistence.northwest-coast",
    label: "Northwest Coast",
    scope: { years: [-3000, 1880], bounds: [-136, 42, -122, 60] },
    priority: 7,
    shares: { farming: 0, herding: 0, fishing: 0.55, foraging: 0.22, other: 0.23 },
    sources: ["https://en.wikipedia.org/wiki/Indigenous_peoples_of_the_Pacific_Northwest_Coast"],
    note: "Salmon runs, sea mammals and shellfish kept large permanent villages without any farming; a great deal of the work was smoking, drying and storing fish.",
  },
  {
    id: "subsistence.great-basin-california",
    label: "Great Basin and California",
    scope: { years: [-10000, 1850], cultures: ["other-indigenous-american"], bounds: [-124, 32, -110, 44] },
    priority: 7,
    shares: { farming: 0, herding: 0, fishing: 0.15, foraging: 0.6, other: 0.25 },
    sources: ["https://en.wikipedia.org/wiki/Indigenous_peoples_of_California"],
    note: "Acorns, pine nuts and seeds gathered, ground and stored, with small game and fish; dense populations in California without crops.",
  },
  {
    id: "subsistence.kalahari",
    label: "Kalahari foragers",
    scope: { years: [-20000, 1950], cultures: ["east-southern-african"], bounds: [16, -28, 27, -17] },
    priority: 7,
    shares: { farming: 0, herding: 0.05, fishing: 0, foraging: 0.7, other: 0.25 },
    sources: ["https://en.wikipedia.org/wiki/Ju%CA%BC%C7%80%CA%BChoansi"],
    note: "Bands hunting with poisoned arrows and gathering mongongo nuts, melons and roots, camping by the waterholes in the dry season.",
  },
  {
    id: "subsistence.ainu",
    label: "Ainu Hokkaido",
    scope: { years: [700, 1870], bounds: [139, 41.3, 146, 46] },
    priority: 7,
    shares: { farming: 0.08, herding: 0, fishing: 0.4, foraging: 0.35, other: 0.17 },
    sources: ["https://en.wikipedia.org/wiki/Ainu_people"],
    note: "Salmon and deer, with some millet grown by the houses, and trade to the Japanese and to Sakhalin.",
  },
  {
    id: "subsistence.new-guinea-highlands",
    label: "New Guinea highlands",
    scope: { years: [-7000, 1950], bounds: [136, -11, 151, -1] },
    priority: 7,
    shares: { farming: 0.55, herding: 0.1, fishing: 0.02, foraging: 0.1, other: 0.23 },
    sources: ["https://en.wikipedia.org/wiki/Kuk_Swamp"],
    note: "Intensive gardening of taro and later sweet potato, and pigs kept as the measure of wealth and exchange.",
  },
  {
    id: "subsistence.ethiopian-highlands",
    label: "Ethiopian highlands",
    scope: { years: [-500, 1950], cultures: ["east-southern-african"], bounds: [35, 6, 42, 15] },
    priority: 7,
    shares: { farming: 0.52, herding: 0.2, fishing: 0.01, foraging: 0.05, other: 0.22 },
    sources: ["https://en.wikipedia.org/wiki/Agriculture_in_Ethiopia"],
    note: "Teff, barley and wheat under the ox plough, with cattle, sheep and goats on the same farms.",
  },
  {
    id: "subsistence.east-african-pastoral",
    label: "East African pastoralists",
    scope: { years: [-3000, 1950], cultures: ["east-southern-african"], bounds: [33, -7, 38.5, 2.5] },
    priority: 7,
    shares: { farming: 0.06, herding: 0.6, fishing: 0, foraging: 0.1, other: 0.24 },
    sources: ["https://en.wikipedia.org/wiki/Maasai_people"],
    note: "Milk, blood and meat from the herds, with grain bought or traded from farming neighbours.",
  },
  {
    id: "subsistence.khoikhoi",
    label: "Cape herders",
    scope: { years: [-100, 1700], cultures: ["east-southern-african"], bounds: [16, -35, 26, -28] },
    priority: 7,
    shares: { farming: 0, herding: 0.5, fishing: 0.08, foraging: 0.22, other: 0.2 },
    sources: ["https://en.wikipedia.org/wiki/Khoikhoi"],
    note: "Fat-tailed sheep and cattle, milked and moved with the seasons, with game, roots and shellfish besides.",
  },
  {
    id: "subsistence.desert-oasis",
    label: "Desert and oasis",
    scope: { years: [-3000, 10001], bounds: [-12, 15, 60, 33] },
    priority: 3,
    shares: { farming: 0.3, herding: 0.32, fishing: 0.02, foraging: 0.08, other: 0.28 },
    sources: ["https://doi.org/10.1017/CBO9780511607233"],
    note: "Irrigated gardens at the water, flocks on the range between, and the caravan trade that the oases exist to serve.",
  },
  {
    id: "subsistence.pacific-islands",
    label: "Pacific islands",
    scope: { years: [-1500, 10001], bounds: [130, -25, -130, 22] },
    priority: 3,
    shares: { farming: 0.38, herding: 0.05, fishing: 0.35, foraging: 0.07, other: 0.15 },
    sources: ["https://doi.org/10.1525/9780520945548"],
    note: "Root and tree crops on land, the reef and the open sea beside it. Pigs and fowl are kept rather than herded.",
  },
  {
    id: "subsistence.andes",
    label: "Andean highlands",
    scope: { years: [-2000, 10001], bounds: [-79, -23, -66, -5] },
    priority: 3,
    shares: { farming: 0.45, herding: 0.25, fishing: 0.04, foraging: 0.06, other: 0.2 },
    sources: ["https://doi.org/10.1017/CHOL9780521333931"],
    note: "Tubers and maize by altitude, with llama and alpaca herds on the high grassland above them. The two are worked by the same households.",
  },
  {
    id: "subsistence.sahel",
    label: "Sahel and savanna",
    scope: { years: [-1000, 10001], bounds: [-17, 8, 38, 18] },
    priority: 3,
    shares: { farming: 0.42, herding: 0.28, fishing: 0.06, foraging: 0.09, other: 0.15 },
    sources: ["https://doi.org/10.1017/CHO9781139054638"],
    note: "Millet and sorghum on the rains, cattle moved between wet and dry season pasture, often by different people in the same place.",
  },
  {
    id: "subsistence.northwest-europe",
    label: "Northwest European mixed farming",
    scope: { years: [-1000, 10001], bounds: [-11, 43, 25, 60] },
    priority: 2,
    shares: { farming: 0.5, herding: 0.14, fishing: 0.08, foraging: 0.06, other: 0.22 },
    sources: ["https://doi.org/10.1017/CBO9780511607219"],
    note: "Cereals with stock kept on the same holding, which is what mixed farming means: the animals manure the fields.",
  },
  {
    id: "subsistence.mediterranean",
    label: "Mediterranean",
    scope: { years: [-3000, 10001], bounds: [-10, 30, 42, 46] },
    priority: 2,
    shares: { farming: 0.48, herding: 0.14, fishing: 0.1, foraging: 0.06, other: 0.22 },
    sources: ["https://doi.org/10.1002/9780470773536"],
    note: "Grain, olives and vines, with flocks on the hills that cannot be ploughed and fishing along a long coast.",
  },
  {
    id: "subsistence.west-asia",
    label: "Anatolia and the Fertile Crescent",
    scope: { years: [-9000, 10001], bounds: [25, 30, 50, 42] },
    priority: 2,
    shares: { farming: 0.46, herding: 0.22, fishing: 0.04, foraging: 0.08, other: 0.2 },
    sources: ["https://doi.org/10.1017/CBO9780511607233"],
    note: "Where cereal farming and sheep and goat keeping began, and where they have been practised together ever since.",
  },
  {
    id: "subsistence.north-america-east",
    label: "Eastern North America",
    scope: { years: [-1000, 10001], bounds: [-95, 25, -60, 50] },
    priority: 2,
    shares: { farming: 0.44, herding: 0.1, fishing: 0.1, foraging: 0.14, other: 0.22 },
    sources: ["https://doi.org/10.1017/CHOL9780521573924"],
    note: "Maize, beans and squash before contact and grain and tobacco after it, with hunting and gathering a real part of the year in both.",
  },
  {
    id: "subsistence.north-china",
    label: "North China and the Yellow River",
    scope: { years: [-5000, 10001], bounds: [100, 30, 125, 43] },
    priority: 3,
    shares: { farming: 0.55, herding: 0.07, fishing: 0.05, foraging: 0.06, other: 0.27 },
    sources: ["https://doi.org/10.1017/CHOL9780521470308"],
    note: "Millet and later wheat on the loess, dry-farmed rather than irrigated, with far less water and far more dust than the rice south.",
  },
  {
    id: "subsistence.south-asia",
    label: "South Asia",
    scope: { years: [-3000, 10001], bounds: [66, 6, 92, 32] },
    priority: 2,
    shares: { farming: 0.54, herding: 0.12, fishing: 0.07, foraging: 0.05, other: 0.22 },
    sources: ["https://doi.org/10.1017/CHOL9780521228022"],
    note: "Rice in the wet east and south, millet and wheat in the dry northwest, with cattle kept everywhere for draught and milk rather than meat.",
  },
  {
    id: "subsistence.tropical-forest",
    label: "Tropical forest",
    scope: { years: [-3000, 10001], bounds: [-80, -12, 40, 10] },
    priority: 2,
    shares: { farming: 0.36, herding: 0.04, fishing: 0.16, foraging: 0.22, other: 0.22 },
    sources: ["https://doi.org/10.1017/CBO9780511607219"],
    note: "Shifting cultivation of roots and bananas, with a large share of the diet still hunted, fished and gathered from the forest and the rivers.",
  },
  {
    id: "subsistence.industrial",
    label: "Industrial society",
    scope: { years: [1850, 10001] },
    priority: 6,
    requires: ["wage_labor"],
    shares: { farming: 0.12, herding: 0.03, fishing: 0.03, foraging: 0.01, other: 0.81 },
    sources: ["https://doi.org/10.1017/CBO9781139034319"],
    note: "Once most people work for wages, most work is not food production. Farming employs a tenth rather than half, and the rest of the settlement does everything else. Requires wage labour, so a village that has not industrialised keeps its own mix.",
  },
];
