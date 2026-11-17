import type { CharacterScope } from "../characters/context-types";

/** Who works on a tenant's floors, by livelihood id. The first is the firm's
 * own trade: where nobody does it, there is no such firm. `night` staff are
 * the ones still there after the office has gone home. */
export type Staff = { work: string; weight: number; night?: true; until?: number };

/** A kind of firm that takes floors in a tower: where and when it existed,
 * which of the building's rooms it fits out, how it names itself and who it
 * employs. Names take `{S}` for a local surname, `{N}` for a number and
 * `[a|b]` for one of several words. */
export type Tenant = {
  id: string;
  room: readonly string[];
  where: readonly CharacterScope[];
  names: readonly { where?: readonly CharacterScope[]; say: readonly string[] }[];
  staff: readonly Staff[];
  weight: number;
  /** How many storeys one firm takes. */
  run: readonly [number, number];
  /** Where in the height it stands, as fractions from the street to the top. */
  band?: readonly [number, number];
  /** Takes the top storey and nothing else. */
  top?: true;
  /** Open to the public, who fill it beside the few who work there. */
  customers?: true;
};

type Box = readonly [number, number, number, number];
const NORTH_AMERICA: Box = [-170, 14, -50, 72];
const BRITAIN: Box = [-11, 49, 2, 61];
const JAPAN: Box = [129, 30, 146, 46];
const SOVIET: Box = [20, 38, 180, 72];
const EAST_BLOC: Box = [12, 41, 30, 56];
const CHINA: Box = [97, 18, 125, 45];
const SOUTHEAST_ASIA: Box = [92, -11, 141, 24];
const SOUTH_ASIA: Box = [60, 5, 97, 37];
const LATIN_AMERICA: Box = [-118, -56, -34, 33];

const at = (years: readonly [number, number], bounds?: Box, except?: Box[]): CharacterScope => ({ years, bounds, except });
const SOVIET_YEARS: CharacterScope[] = [at([1922, 1992], SOVIET), at([1946, 1990], EAST_BLOC)];
const PLANNED: Box[] = [SOVIET, EAST_BLOC];
/** Market economies: everywhere but the planned ones, and China between 1950 and its reform. */
const market = (from: number, to = 10001): CharacterScope[] => [
  at([from, to], undefined, [...PLANNED, CHINA]),
  at([Math.max(from, 1992), to], SOVIET),
  at([Math.max(from, 1990), to], EAST_BLOC),
  at([from, Math.min(to, 1950)], CHINA),
  at([Math.max(from, 1985), to], CHINA),
];
const US = [at([1850, 10001], NORTH_AMERICA)];
const UK = [at([1850, 10001], BRITAIN)];
const JP = [at([1870, 10001], JAPAN)];
const RU = [at([1992, 10001], SOVIET)];
const ASIA = [at([1900, 10001], SOUTHEAST_ASIA), at([1900, 10001], SOUTH_ASIA), at([1900, 10001], CHINA)];
const LATIN = [at([1850, 10001], LATIN_AMERICA)];
const OLD = [at([1850, 1960])];

const typing: Staff[] = [
  { work: "typist", weight: 2 }, { work: "stenographer", weight: 1 }, { work: "office-boy", weight: 1 },
  { work: "office-assistant", weight: 1 }, { work: "office-lady", weight: 2 },
];
const desk: Staff[] = [{ work: "secretary", weight: 2 }, { work: "receptionist", weight: 1 }, ...typing];
const night: Staff[] = [
  { work: "cleaner", weight: 3, night: true }, { work: "charwoman", weight: 3, night: true, until: 1960 },
  { work: "security-guard", weight: 1, night: true }, { work: "town-watchman", weight: 1, night: true, until: 1950 },
];

/** The building's own people, in the lobby. */
export const lobbyStaff: readonly Staff[] = [
  { work: "doorman", weight: 2 }, { work: "lift-attendant", weight: 2 }, { work: "receptionist", weight: 2 },
  { work: "security-guard", weight: 1 }, { work: "security-guard", weight: 1, night: true },
];

/** The firms are invented; the kinds follow who rented office space where
 * and when. A floor draws from those whose scope fits the setting. */
export const tenants: readonly Tenant[] = [
  {
    id: "law",
    room: ["offices"],
    where: market(1850),
    names: [
      { where: JP, say: ["{S} Law Office", "{S} & {S} Law Offices"] },
      { where: [...ASIA, ...LATIN], say: ["{S} & {S}, advocates", "{S}, {S} & Partners"] },
      { say: ["{S}, {S} & {S}", "{S} & {S}, attorneys", "{S}, {S}, {S} & {S}", "{S} & {S} LLP"] },
    ],
    staff: [{ work: "lawyer", weight: 4 }, { work: "clerk", weight: 1 }, ...desk, ...night],
    weight: 3,
    run: [1, 3],
  },
  {
    id: "insurance",
    room: ["offices"],
    where: market(1850),
    names: [
      { where: JP, say: ["{S} Life Insurance", "[Tōyō|Shinsei|Heiwa|Kōfuku] [Life|Fire & Marine] Insurance"] },
      { say: ["[Atlantic|Continental|Pioneer|Union|Mercantile|Reliance] [Mutual|Casualty|Life|Fire] Insurance", "{S} Mutual Life", "{S} & {S}, insurance brokers"] },
    ],
    staff: [{ work: "insurance-agent", weight: 3 }, { work: "clerk", weight: 2 }, { work: "accountant", weight: 1 }, { work: "manager", weight: 1 }, ...desk, ...night],
    weight: 3,
    run: [1, 5],
  },
  {
    id: "accountants",
    room: ["offices"],
    where: market(1860),
    names: [
      { where: JP, say: ["{S} Accounting Office", "{S} Audit Corporation"] },
      { say: ["{S} & {S}, accountants", "{S}, {S} & Co., chartered accountants", "{S} {S} & Partners"] },
    ],
    staff: [{ work: "accountant", weight: 4 }, { work: "clerk", weight: 2 }, ...desk, ...night],
    weight: 2,
    run: [1, 2],
  },
  {
    id: "brokers",
    room: ["offices"],
    where: market(1850),
    names: [
      { where: JP, say: ["{S} Securities", "[Hoshino|Ōmori|Kōyō|Seiwa] Securities"] },
      { where: RU, say: ["{S}-Invest", "[Volga|Neva|Severny] Capital"] },
      { say: ["{S} & Co., stockbrokers", "{S}, {S} & Co.", "{S} Securities", "{S} {S} Investment Bank"] },
    ],
    staff: [{ work: "broker", weight: 4 }, { work: "clerk", weight: 1 }, { work: "telephone-operator", weight: 1 }, { work: "manager", weight: 1 }, ...desk, ...night],
    weight: 2,
    run: [1, 4],
  },
  {
    id: "trading",
    room: ["offices"],
    where: market(1850),
    names: [
      { where: JP, say: ["{S} Shōji, trading", "{S} Bussan, trading", "Shinsei Trading Company"] },
      { where: ASIA, say: ["{S} Trading Co., Ltd.", "{S} Import-Export Co., Ltd."] },
      { say: ["{S} Shipping", "Empire Coastwise Shipping", "{S} & {S}, importers", "{S} Import & Export"] },
    ],
    staff: [{ work: "clerk", weight: 3 }, { work: "office-worker", weight: 3 }, { work: "accountant", weight: 1 }, { work: "manager", weight: 1 }, ...desk, ...night],
    weight: 3,
    run: [1, 3],
  },
  {
    id: "company",
    room: ["offices"],
    where: market(1880),
    names: [
      { where: JP, say: ["{S} Electric, sales", "{S} Construction", "Nippon Fine Chemicals, Tokyo office", "{S} Heavy Industries"] },
      { where: ASIA, say: ["{S} Group, head office", "{S} Holdings Co., Ltd.", "Chao Phraya [Cement|Steel|Paper] Co., Ltd."] },
      { where: OLD, say: ["{S} Steel, New York office", "{S} Coal & Coke", "Union Sugar Refining", "{S} Textile Company", "Consolidated Chemical Sales"] },
      { say: ["{S} Industries, head office", "{S} Corporation", "{S} Foods, regional office", "{S} Petroleum"] },
    ],
    staff: [{ work: "office-worker", weight: 4 }, { work: "manager", weight: 2 }, { work: "accountant", weight: 1 }, { work: "engineer", weight: 1 }, ...desk, ...night],
    weight: 5,
    run: [1, 5],
  },
  {
    id: "architects",
    room: ["offices"],
    where: market(1880),
    names: [
      { where: JP, say: ["{S} Architects & Engineers", "{S} Design Office"] },
      { say: ["{S} & {S}, architects", "{S} Engineering", "Bureau of Engineering Surveys", "{S} {S} Associates"] },
    ],
    staff: [{ work: "draughtsman", weight: 3 }, { work: "engineer", weight: 3 }, { work: "secretary", weight: 1 }, ...night],
    weight: 1.5,
    run: [1, 2],
  },
  {
    id: "advertising",
    room: ["offices"],
    where: market(1890),
    names: [
      { where: JP, say: ["{S} Advertising", "Aoba Advertising"] },
      { say: ["{S} Advertising Agency", "{S}, {S} & {S}, advertising", "{S} & {S} Advertising"] },
    ],
    staff: [{ work: "office-worker", weight: 3 }, { work: "draughtsman", weight: 1 }, { work: "manager", weight: 1 }, ...desk, ...night],
    weight: 1.5,
    run: [1, 2],
  },
  {
    id: "newspaper",
    room: ["offices"],
    where: [at([1880, 10001])],
    names: [
      { where: SOVIET_YEARS, say: ["Editorial offices of [Trud|Gudok|Izvestia|Krasnaya Zvezda]"] },
      { where: JP, say: ["{S} Shimbun, editorial office"] },
      { say: ["The Daily [Courier|Record|Herald|Clarion]", "The Evening [Star|Post|Telegram]", "The {S} Press"] },
    ],
    staff: [{ work: "journalist", weight: 4 }, { work: "typist", weight: 1 }, { work: "office-boy", weight: 1 }, { work: "telephone-operator", weight: 1 }, ...night],
    weight: 1,
    run: [1, 2],
  },
  {
    id: "typing-bureau",
    room: ["offices"],
    where: market(1890, 1975),
    names: [{ say: ["{S} Stenographic Bureau", "Columbia Stenographic Bureau", "{S} Secretarial Services"] }],
    staff: [{ work: "typist", weight: 5 }, { work: "stenographer", weight: 3 }, { work: "manager", weight: 1 }, ...night],
    weight: 0.7,
    run: [1, 1],
  },
  {
    id: "software",
    room: ["offices"],
    where: market(1985),
    names: [
      { where: JP, say: ["{S} Software Development", "Fuji Software Development", "{S} Systems"] },
      { where: ASIA, say: ["{S} Infotech", "{S} Software Solutions", "[Info|Cyber|Data|Net]sys Technologies"] },
      { say: ["{S} Software", "[Net|Data|Cyber|Info][soft|works|logic|scape]", "{S} Systems", "{S} Digital"] },
    ],
    staff: [{ work: "software-developer", weight: 4 }, { work: "programmer", weight: 2 }, { work: "manager", weight: 1 }, { work: "receptionist", weight: 1 }, ...night],
    weight: 3,
    run: [1, 4],
  },
  {
    id: "call-centre",
    room: ["offices"],
    where: [at([1985, 10001], NORTH_AMERICA), at([1985, 10001], BRITAIN), at([1998, 10001], SOUTH_ASIA), at([2000, 10001], SOUTHEAST_ASIA)],
    names: [{ say: ["{S} Customer Contact Centre", "[Teleserve|CallPoint|DirectLine|Voxa] Customer Services", "{S} Global Services"] }],
    staff: [{ work: "telemarketer", weight: 6 }, { work: "manager", weight: 1 }, { work: "office-assistant", weight: 1 }, ...night],
    weight: 2,
    run: [1, 3],
  },
  {
    id: "government",
    room: ["offices"],
    where: market(1880),
    names: [
      { where: JP, say: ["Ministry of [Finance|Construction|Trade], annex", "Tokyo Metropolitan [Housing|Transport] Bureau"] },
      { where: UK, say: ["Ministry of [Pensions|Labour|Works], regional office", "Board of Trade, [statistics|patents] branch"] },
      { say: ["Department of [Revenue|Labor|Public Works], district office", "Bureau of [Customs|Statistics|Licences]"] },
    ],
    staff: [{ work: "civil-servant", weight: 4 }, { work: "clerk", weight: 2 }, ...desk, ...night],
    weight: 1.5,
    run: [1, 3],
  },
  {
    id: "travel",
    room: ["offices"],
    where: market(1920),
    names: [
      { where: JP, say: ["Asahi Travel Bureau", "{S} Travel Service"] },
      { say: ["{S} Travel", "[Globe|Horizon|Meridian|Compass] Tours", "{S} & {S}, travel agents"] },
    ],
    staff: [{ work: "clerk", weight: 3 }, { work: "office-assistant", weight: 1 }, { work: "manager", weight: 1 }, ...night],
    weight: 0.7,
    run: [1, 1],
  },
  {
    id: "ministry",
    room: ["offices"],
    where: SOVIET_YEARS,
    names: [{ say: [
      "Ministry of [Heavy Machine Building|Transport Construction|the River Fleet|the Coal Industry|Instrument Making|Light Industry]",
      "Gosplan, [fuel|metals|transport] section", "Central Statistical Office", "Glav[mosstroy|neftesnab|kino|snab] directorate",
    ] }],
    staff: [{ work: "civil-servant", weight: 4 }, { work: "accountant", weight: 1 }, { work: "secretary", weight: 2 }, { work: "typist", weight: 2 }, { work: "doorman", weight: 1 }, ...night],
    weight: 5,
    run: [2, 6],
  },
  {
    id: "design-institute",
    room: ["offices"],
    where: SOVIET_YEARS,
    names: [{ say: ["[Mos|Gipro|Teplo|Hydro|Promstroy|Giprogor]proekt design institute", "Hydroproject design bureau", "Design Bureau No. {N}"] }],
    staff: [{ work: "draughtsman", weight: 4 }, { work: "engineer", weight: 3 }, { work: "accountant", weight: 1 }, { work: "typist", weight: 1 }, ...night],
    weight: 3,
    run: [1, 4],
  },
  {
    id: "research-institute",
    room: ["offices"],
    where: SOVIET_YEARS,
    names: [{ say: ["Institute of [Steel|Fine Chemistry|Automation|Precision Mechanics] Research", "Scientific Research Institute No. {N}"] }],
    staff: [{ work: "scientist", weight: 3 }, { work: "engineer", weight: 2 }, { work: "programmer", weight: 1 }, { work: "typist", weight: 1 }, ...night],
    weight: 2,
    run: [1, 3],
  },
  {
    id: "foreign-trade",
    room: ["offices"],
    where: SOVIET_YEARS,
    names: [{ say: ["Soyuz[export|nefteexport|khimexport|promexport] trading office", "Vneshtorgbank, foreign section"] }],
    staff: [{ work: "clerk", weight: 3 }, { work: "civil-servant", weight: 1 }, { work: "accountant", weight: 1 }, { work: "typist", weight: 2 }, ...night],
    weight: 1.5,
    run: [1, 2],
  },
  {
    id: "bank",
    room: ["bank"],
    customers: true,
    where: market(1850),
    names: [
      { where: JP, say: ["{S} Bank", "[Shinwa|Chūō|Kōyō|Seiran] Bank"] },
      { where: US, say: ["[Chatham|Corn Exchange|Seaboard|Hanover] Trust Company", "{S} National Bank", "First {S} Savings Bank"] },
      { say: ["{S} Bank", "{S} & {S}, bankers", "Bank of {S}"] },
    ],
    staff: [{ work: "bank-clerk", weight: 4 }, { work: "bank-manager", weight: 1 }, { work: "accountant", weight: 1 }, { work: "security-guard", weight: 1 }, ...desk, ...night],
    weight: 1,
    run: [1, 1],
    band: [0, 0.06],
  },
  {
    id: "showroom",
    room: ["showroom", "store"],
    customers: true,
    where: market(1880),
    names: [{ say: ["{S} Brothers, furriers", "{S} Showrooms", "{S} & {S}, haberdashers", "{S} Motors, showroom"] }],
    staff: [{ work: "shop-assistant", weight: 4 }, { work: "shopkeeper", weight: 1 }, ...night],
    weight: 0.5,
    run: [1, 2],
    band: [0, 0.06],
  },
  {
    id: "state-store",
    room: ["store"],
    customers: true,
    where: SOVIET_YEARS,
    names: [{ say: ["Gastronom No. {N}", "Univermag", "Detsky Mir children's store", "Beryozka hard-currency shop"] }],
    staff: [{ work: "shop-assistant", weight: 5 }, { work: "manager", weight: 1 }, ...night],
    weight: 8,
    run: [1, 2],
    band: [0, 0.08],
  },
  {
    id: "snack",
    room: ["snack"],
    customers: true,
    where: [at([1955, 10001], JAPAN)],
    names: [{ say: ["Snack [Yuri|Kanon|Akemi|Michiko|Hana]", "Club [Ruby|Venus|Rose]", "Bar [Saffron|Lapis|Moon]"] }],
    staff: [{ work: "bar-hostess", weight: 3 }, { work: "bartender", weight: 1 }],
    weight: 6,
    run: [1, 1],
    band: [0, 0.2],
  },
  {
    id: "mahjong",
    room: ["mahjong"],
    customers: true,
    where: [at([1925, 10001], JAPAN)],
    names: [{ say: ["Mahjong [Hakuraku|Tōfū|Ryūō|Hanamaru]"] }],
    staff: [{ work: "shopkeeper", weight: 1 }, { work: "waiter", weight: 2 }],
    weight: 4,
    run: [1, 1],
    band: [0, 0.2],
  },
  {
    id: "school",
    room: ["school"],
    customers: true,
    where: [at([1970, 10001], JAPAN)],
    names: [{ say: ["[Bell|Liberty|Crown|Globe] English School", "{S} Juku cram school", "Sun Juku cram school"] }],
    staff: [{ work: "schoolteacher", weight: 3 }, { work: "receptionist", weight: 1 }],
    weight: 3,
    run: [1, 1],
    band: [0, 0.25],
  },
  {
    id: "lounge",
    room: ["lounge"],
    customers: true,
    where: [at([1960, 10001])],
    names: [{ where: JP, say: ["Sky Lounge [Orion|Hoshizora|Ginga]", "Restaurant Hoshizora"] }, { say: ["The [Summit|Skyline|Rainbow] Room"] }],
    staff: [{ work: "waiter", weight: 3 }, { work: "bartender", weight: 1 }, { work: "cook", weight: 1 }],
    weight: 1,
    run: [1, 1],
    top: true,
  },
  {
    id: "executive",
    room: ["suite"],
    where: market(1880),
    names: [{ say: ["Executive offices", "The chairman's offices", "The board room"] }],
    staff: [{ work: "manager", weight: 2 }, { work: "secretary", weight: 2 }, { work: "lawyer", weight: 0.5 }, ...night],
    weight: 1,
    run: [1, 1],
    top: true,
  },
  {
    id: "minister",
    room: ["suite"],
    where: SOVIET_YEARS,
    names: [{ say: ["The minister's offices", "The collegium room"] }],
    staff: [{ work: "civil-servant", weight: 2 }, { work: "secretary", weight: 2 }, ...night],
    weight: 1,
    run: [1, 1],
    top: true,
  },
];
