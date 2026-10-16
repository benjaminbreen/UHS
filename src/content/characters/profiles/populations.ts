import type { CharacterScope } from "../context-types";

/*
 * Who lives in a place, in what proportion.
 *
 * A community profile says what one group looks like and does. It could not say
 * that a place holds several groups at once, because `communityFor` returned a
 * single label for a whole world: every settlement was entirely one community.
 * That is fine for a village and wrong for anywhere plural, which is most
 * cities and every colonial society.
 *
 * A population names the groups and their shares. Each person draws one, so a
 * street holds the mix rather than the average, and because the drawn community
 * selects the appearance palette and the naming kit together, a person's name
 * and appearance stay consistent with each other.
 *
 * Shares are proportions for populating a scene, not census figures. Where a
 * real proportion is known the source says so; otherwise they are a legible
 * approximation and should not be read as demography.
 */
export type Population = {
  id: string;
  label: string;
  scope: CharacterScope;
  /** Higher wins where two populations cover the same place and date. */
  priority: number;
  groups: readonly {
    community: string;
    share: number;
    /**
     * Share of this group held in bondage, 0-1. Unfreedom was not a fringe
     * condition in most of the societies this game covers, and a model that
     * cannot show it makes the ordinary arrangement of those places invisible.
     * It is a proportion of a community, not a property of one: Virginia's
     * English colonists included indentured servants and its African-descended
     * population included free people.
     */
    unfree?: number;
  }[];
  sources: readonly string[];
  note?: string;
};

export const populations: readonly Population[] = [
  {
    id: "population.virginia-tidewater",
    label: "Virginia Tidewater",
    scope: { years: [1607, 1750], bounds: [-84, 35, -75, 40] },
    priority: 2,
    groups: [
      { community: "english-colonial", share: 6, unfree: 0.12 },
      { community: "african-diaspora", share: 3, unfree: 0.92 },
      { community: "indigenous-local", share: 1, unfree: 0.05 },
    ],
    sources: [
      "https://www.nps.gov/jame/learn/historyculture/the-first-residents-of-jamestown.htm",
    ],
    note: "The three groups were present together throughout, in shares that moved sharply across the period: the African-descended population was negligible in 1610 and about two fifths of the Tidewater by 1750, and slavery hardened from a status resembling indenture into hereditary racial bondage across the same decades. One fixed ratio cannot show either movement. The English-colonial figure is indentured servitude, which was most of the early labour force and ran for a term rather than for life.",
  },
  {
    id: "population.south-africa",
    label: "Southern Africa",
    scope: { years: [1806, 2000], bounds: [16, -35, 33, -22] },
    priority: 3,
    groups: [
      { community: "indigenous-local", share: 76 },
      { community: "settler-afrikaner", share: 9 },
      { community: "settler-british", share: 6 },
      { community: "cape-malay", share: 9 },
    ],
    sources: ["https://doi.org/10.1017/CHOL9780521228039"],
    note: "The African majority is the great majority throughout, which the settler-centred telling of this region's history tends to obscure. Shares moved with the mineral discoveries and with a century of law written to control where people could live, and one ratio cannot show that. Cape Malay stands for the Cape's Indian Ocean population, concentrated in the western Cape rather than spread evenly.",
  },
  {
    id: "population.cape-town",
    label: "The Cape",
    scope: { years: [1658, 2000], bounds: [17, -35, 20, -32] },
    priority: 4,
    groups: [
      { community: "cape-malay", share: 40, unfree: 0.5 },
      { community: "indigenous-local", share: 28 },
      { community: "settler-afrikaner", share: 22 },
      { community: "settler-british", share: 10 },
    ],
    sources: ["https://doi.org/10.1017/CHOL9780521228039"],
    note: "The Cape was built on slavery from 1658, with people brought from the Indonesian archipelago, India, Madagascar and Mozambique. Slavery at the Cape ended in 1834; the share here does not yet fall at that date.",
  },
  {
    id: "population.trans-appalachian-backcountry",
    label: "Trans-Appalachian backcountry",
    scope: { years: [1760, 1840], bounds: [-92, 32, -78, 42] },
    priority: 6,
    groups: [
      { community: "us-anglo", share: 76, unfree: 0.04 },
      { community: "african-diaspora", share: 15, unfree: 0.93 },
      { community: "indigenous-local", share: 9 },
    ],
    sources: ["https://doi.org/10.1017/CHOL9780521382892"],
    note: "Tennessee, Kentucky and the Ohio valley in the decades after the first stations and stockades. The settler population was largely English, Scots-Irish and German; enslaved people came over the mountains with it from the start, in far smaller numbers than in the tidewater. The Cherokee, Shawnee and Chickasaw held most of this ground for most of the period, which a share of the towns' population badly understates.",
  },
  {
    id: "population.united-states",
    label: "United States",
    scope: { years: [1800, 2000], bounds: [-125, 25, -67, 49] },
    priority: 3,
    groups: [
      { community: "us-anglo", share: 76 },
      { community: "african-diaspora", share: 12 },
      { community: "us-latino", share: 9 },
      { community: "us-chinese", share: 3 },
    ],
    sources: ["https://doi.org/10.1017/CHOL9780521382892"],
    note: "A national average across two centuries, which no actual place matched: the African-American share was a third in the antebellum South and near nothing in New England, and the Latino and Chinese shares are concentrated in the southwest and on the Pacific coast.",
  },
  {
    id: "population.us-antebellum-south",
    label: "The antebellum South",
    scope: { years: [1800, 1865], bounds: [-95, 25, -75, 37] },
    priority: 5,
    groups: [
      { community: "us-anglo", share: 62 },
      { community: "african-diaspora", share: 38, unfree: 0.94 },
    ],
    sources: ["https://doi.org/10.2307/2937399"],
    note: "In the cotton districts the enslaved were a majority of the people; across the South as a whole about a third, and nearly all of the African-descended population. The free black population was real but small, and larger in the cities than the country.",
  },
  {
    id: "population.us-southwest",
    label: "American southwest",
    scope: { years: [1848, 2000], bounds: [-125, 31, -102, 39] },
    priority: 5,
    groups: [
      { community: "us-latino", share: 38 },
      { community: "us-anglo", share: 44 },
      { community: "african-diaspora", share: 8 },
      { community: "us-chinese", share: 10 },
    ],
    sources: ["https://doi.org/10.1017/CHOL9780521382892"],
    note: "California and the territories annexed in 1848, where the Spanish-speaking population predates the Anglo one and the Pacific coast cities drew Chinese settlement from the gold rush. The national average badly misdescribes this corner of the country.",
  },
  {
    id: "population.ottoman-city",
    label: "Ottoman city",
    scope: { years: [1450, 1923], bounds: [19, 35, 45, 46] },
    priority: 3,
    groups: [
      { community: "ottoman-muslim", share: 55 },
      { community: "ottoman-christian", share: 33 },
      { community: "ottoman-jewish", share: 12 },
    ],
    sources: ["https://doi.org/10.1017/CHOL9780521291637"],
    note: "Ottoman cities were plural by arrangement, not by accident: each confession governed its own affairs under the millet system. The balance differed sharply by city -- Salonica was about half Jewish through the nineteenth century, Athens almost wholly Christian.",
  },
  {
    id: "population.indies-port",
    label: "Indies port city",
    scope: { years: [1600, 1949], bounds: [95, -11, 141, 7] },
    priority: 4,
    groups: [
      { community: "indigenous-local", share: 62, unfree: 0.25 },
      { community: "indies-chinese", share: 28 },
      { community: "indies-dutch", share: 10 },
    ],
    sources: ["https://doi.org/10.1017/CBO9781139195836"],
    note: "Batavia and the other company ports were majority Asian cities with a small Dutch ruling layer and a large Chinese merchant and artisan population. Slavery was ordinary in the company's towns and is counted here against the local population rather than the settlers.",
  },
];
/*
 * Societies where bondage was general but the free population is not divided
 * into communities the game models separately. A single share applies across
 * the whole settlement.
 */
export type LabourRegime = {
  id: string;
  label: string;
  scope: CharacterScope;
  priority: number;
  unfree: number;
  sources: readonly string[];
  note?: string;
};

export const labourRegimes: readonly LabourRegime[] = [
  {
    id: "labour.classical-mediterranean",
    label: "Classical Mediterranean",
    scope: { years: [-500, 400], bounds: [-9, 30, 40, 47] },
    priority: 2,
    unfree: 0.22,
    sources: ["https://doi.org/10.1017/CHOL9780521263351"],
    note: "Estimates for Roman Italy run from a fifth to a third of the population. Enslaved people worked the land, the mines, the workshops and the household, and manumission was common enough that freed people are a visible part of the record.",
  },
  {
    id: "labour.classical-greece",
    label: "Classical Greece",
    scope: { years: [-700, -100], bounds: [19, 34, 29, 42] },
    priority: 3,
    unfree: 0.28,
    sources: ["https://doi.org/10.1017/CHOL9780521234474"],
    note: "Athens and the Aegean poleis. Sparta's helots were a separate and larger arrangement not modelled here.",
  },
  {
    id: "labour.atlantic-caribbean",
    label: "Caribbean plantation colonies",
    scope: { years: [1640, 1838], bounds: [-85, 10, -59, 23] },
    priority: 4,
    unfree: 0.85,
    sources: ["https://www.slavevoyages.org/"],
    note: "On the sugar islands the enslaved were the great majority of the population, in some parishes nine in ten.",
  },
  {
    id: "labour.haiti-after-abolition",
    label: "Haiti after abolition",
    scope: { years: [1793, 10001], bounds: [-74.6, 17.5, -68, 20.2] },
    priority: 6,
    unfree: 0,
    sources: ["https://www.loc.gov/item/2018667598/"],
    note: "The revolution abolished slavery in 1793 and independence followed in 1804, so the plantation regime around it does not apply here. Later labour was coerced in other ways -- the corvee and the rural code -- which is not the same thing and is not modelled.",
  },
  {
    id: "labour.brazil-colonial",
    label: "Colonial and imperial Brazil",
    scope: { years: [1550, 1888], bounds: [-74, -33, -34, 5] },
    priority: 3,
    unfree: 0.45,
    sources: ["https://www.slavevoyages.org/"],
    note: "Brazil received more enslaved Africans than anywhere else in the Americas, and was the last state in the hemisphere to abolish slavery.",
  },
  {
    id: "labour.medieval-serfdom",
    label: "Manorial Europe",
    scope: { years: [900, 1500], bounds: [-5, 43, 30, 56] },
    priority: 2,
    unfree: 0.55,
    sources: ["https://doi.org/10.1017/CHOL9780521362917"],
    note: "Serfdom rather than slavery: unfree in that a villein was bound to the manor and owed labour services, not owned outright and not saleable apart from the land.",
  },
  {
    id: "labour.italian-communes",
    label: "The Italian communes",
    scope: { years: [1250, 1800], bounds: [7, 37, 18.5, 46.5] },
    priority: 3,
    unfree: 0.02,
    sources: ["https://en.wikipedia.org/wiki/Serfdom"],
    note: "Bologna freed its serfs in 1257 and Florence in 1289. What remained was a small trade in household slaves, mostly women from the Black Sea, in Genoa, Venice and Florence.",
  },
  {
    id: "labour.normandy",
    label: "Normandy",
    scope: { years: [1050, 1500], bounds: [-2, 48.3, 1.9, 50.1] },
    priority: 3,
    unfree: 0.03,
    sources: ["https://en.wikipedia.org/wiki/Serfdom"],
    note: "Serfdom had all but gone from Normandy by the twelfth century, earlier than anywhere else in northern France; the peasantry held by free tenures and owed rent.",
  },
  {
    id: "labour.russian-serfdom",
    label: "Russian serfdom",
    scope: { years: [1650, 1861], bounds: [22, 44, 65, 66] },
    priority: 3,
    unfree: 0.5,
    sources: ["https://doi.org/10.1017/CHOL9780521812276"],
    note: "By the eighteenth century serfs could be sold apart from the land, which put Russian serfdom closer to chattel slavery than the western European kind.",
  },
  {
    id: "labour.mesopotamia",
    label: "Mesopotamian cities",
    scope: { years: [-3000, -300], bounds: [38, 29, 49, 37] },
    priority: 2,
    unfree: 0.15,
    sources: ["https://cdli.ucla.edu/"],
    note: "Temple and palace dependants, debt slaves and war captives. Much of the labour force was dependent without being owned, which the single share here cannot distinguish.",
  },
  {
    id: "labour.abbasid-iraq",
    label: "Abbasid Iraq",
    scope: { years: [750, 1258], bounds: [40, 28, 50, 37] },
    priority: 3,
    unfree: 0.12,
    sources: ["https://en.wikipedia.org/wiki/Zanj_Rebellion"],
    note: "Household slaves in Baghdad and Basra, slave soldiers from the ninth century, and the East African Zanj who drained the salt flats of the lower Iraq until they rose in 869.",
  },
  {
    id: "labour.ottoman-capital",
    label: "Ottoman Istanbul and Bursa",
    scope: { years: [1453, 1830], bounds: [28, 39.8, 29.6, 41.4] },
    priority: 4,
    unfree: 0.15,
    sources: ["https://en.wikipedia.org/wiki/Slavery_in_the_Ottoman_Empire"],
    note: "Registers of the sixteenth century put the enslaved near a fifth of Istanbul: household servants, silk workers in Bursa, and galley rowers.",
  },
  {
    id: "labour.western-sahel",
    label: "Mali, Songhay and the Niger bend",
    scope: { years: [1250, 1905], bounds: [-17, 10, 4, 20] },
    priority: 3,
    unfree: 0.25,
    sources: ["https://en.wikipedia.org/wiki/Slavery_in_Africa"],
    note: "Domestic slavery was widespread and hereditary; Songhay's estates on the Niger were worked by enslaved farming villages, and Timbuktu's households kept servants bought from the south.",
  },
  {
    id: "labour.sokoto",
    label: "Sokoto Caliphate",
    scope: { years: [1804, 1903], bounds: [3, 9, 14, 14] },
    priority: 4,
    unfree: 0.4,
    sources: ["https://en.wikipedia.org/wiki/Sokoto_Caliphate"],
    note: "Plantation slavery round the Hausa cities on a scale that made the caliphate one of the largest slave societies of the century; estimates run to half the population in the core emirates.",
  },
  {
    id: "labour.benin-oyo-dahomey",
    label: "Benin, Oyo and Dahomey",
    scope: { years: [1500, 1897], bounds: [0, 5, 8, 10] },
    priority: 3,
    unfree: 0.15,
    sources: ["https://en.wikipedia.org/wiki/Kingdom_of_Benin"],
    note: "Captives worked palace and chiefly estates and served in great households; most were held locally rather than sold to the coast.",
  },
  {
    id: "labour.mexica",
    label: "The Mexica",
    scope: { years: [1325, 1521], bounds: [-105, 13, -86, 23] },
    priority: 3,
    unfree: 0.05,
    sources: ["https://en.wikipedia.org/wiki/Slavery_among_the_indigenous_peoples_of_the_Americas"],
    note: "Tlacotin were people who had sold themselves or been sold for debt or crime. They could own property and their children were born free; war captives went to the altar rather than into labour.",
  },
  {
    id: "labour.inca",
    label: "Tawantinsuyu",
    scope: { years: [1438, 1533], bounds: [-82, -25, -63, 2] },
    priority: 3,
    unfree: 0.06,
    sources: ["https://en.wikipedia.org/wiki/Yanakuna"],
    note: "Yanakuna were taken out of their ayllu to serve the Inca, the temples and the nobility for life. Ayllu members owed rotating labour (mit'a) but were not unfree.",
  },
  {
    id: "labour.korea-joseon",
    label: "Joseon Korea",
    scope: { years: [1400, 1894], bounds: [124, 33, 131, 43] },
    priority: 3,
    unfree: 0.3,
    sources: ["https://doi.org/10.1017/9781139026314"],
    note: "The nobi were a hereditary unfree class, at some points close to a third of the population, abolished in 1894.",
  },
];
