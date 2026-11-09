import type { WorldSetting } from "../geography/types";
import { customFor, type HouseholdCustom } from "./scoped";

/**
 * Kin made by ceremony rather than birth or marriage. Lines fill {name},
 * {as} (`word`, by the other's sex), the other's pronouns {she} {her} {him}
 * {She} {Her}, and, in `child` lines, {child} (son or daughter) and {kid}.
 */
export type RitualKin = HouseholdCustom & {
  /** Godparent of the player's child; sponsor at their wedding; or sworn to them. */
  tie: "co-parent" | "sponsor" | "sworn";
  /** Share of lives with such a tie in the settlement. */
  odds: number;
  word: readonly [string, string];
  lines: { child?: readonly string[]; other: readonly string[] };
};

const COMPADRE = {
  tie: "co-parent",
  odds: 0.8,
  word: ["comadre", "compadre"],
  lines: {
    child: [
      "{name} stood godparent to your {child} {kid} at the baptism, which makes {him} your {as}, your co-parent. Between compadres a favour asked is hard to refuse.",
      "{name} is your {as}: {she} is godparent to your {child} {kid}. {She} is better off than you, and you both know that is partly why you asked.",
    ],
    other: [
      "{name} is your {as}, your co-parent, from the baptism of one of your children. You owe each other favours, and {she} is better off than you.",
    ],
  },
  sources: ["https://en.wikipedia.org/wiki/Compadrazgo"],
} as const;

export const ritualKin: RitualKin[] = [
  {
    ...COMPADRE,
    id: "compadrazgo-iberia",
    label: "Compadrazgo in Spain and Portugal",
    priority: 2,
    scope: { years: [800, 10001], cultures: ["european"], bounds: [-10, 36, 3.5, 44] },
    evidence: "documented",
    note: "Baptismal sponsorship made the child's parents and godparents compadres, co-parents, and the bond between the adults often mattered more than the one with the child. Families chose godparents above them in wealth.",
  },
  {
    ...COMPADRE,
    id: "compadrazgo-americas",
    label: "Compadrazgo in Latin America",
    priority: 3,
    scope: { years: [1530, 10001], bounds: [-118, -56, -34, 33] },
    evidence: "documented",
    note: "Brought by the Spanish and Portuguese, compadrazgo became one of the main ties holding Latin American communities together, linking families across class and ethnic lines.",
  },
  {
    ...COMPADRE,
    id: "compare-italy-france",
    label: "Compare and compère in Italy and France",
    priority: 2,
    scope: { years: [800, 10001], cultures: ["european"], bounds: [-5, 36, 19, 51] },
    evidence: "documented",
    word: ["co-mother", "co-father"],
    lines: {
      child: [
        "{name} stood godparent to your {child} {kid} at the baptism, which makes {him} your {as}. The tie between you is treated as a kind of kinship, and the Church forbids you to marry into each other's families.",
      ],
      other: [
        "{name} is your {as}, godparent to one of your children. The tie between you is treated as a kind of kinship, and you owe each other help.",
      ],
    },
    note: "Godparenthood created spiritual kinship (compaternitas) between the child's parents and godparents, who called each other compare and comare or compère and commère; canon law barred marriage between them.",
  },
  {
    id: "gossip-england",
    label: "Gossips in medieval England",
    priority: 3,
    scope: { years: [900, 1600], cultures: ["european"], bounds: [-6, 50, 2, 56] },
    evidence: "documented",
    tie: "co-parent",
    odds: 0.7,
    word: ["gossip", "gossip"],
    lines: {
      child: [
        "{name} is your gossip, godparent to your {child} {kid}. The word means 'related in God', and you call on each other first when anything goes wrong.",
      ],
      other: [
        "{name} is your gossip, godparent to one of your children. The word means 'related in God', and you call on each other first when anything goes wrong.",
      ],
    },
    note: "Old English godsibb, 'related in God', meant a child's godparent and the parents' bond with them; only later did 'gossip' come to mean the talk among such close friends.",
    sources: ["https://en.wiktionary.org/wiki/gossip"],
  },
  {
    id: "kumstvo",
    label: "Kumstvo in the Orthodox world",
    priority: 2,
    scope: { years: [900, 10001], cultures: ["european"], bounds: [13, 36, 60, 62] },
    evidence: "documented",
    tie: "sponsor",
    odds: 0.85,
    word: ["kuma", "kum"],
    lines: {
      other: [
        "{name} is your {as}: {she} stood sponsor at your wedding and will be godparent to your children, as {her} family has been for yours for generations. A {as} is owed more respect than a blood relative.",
      ],
    },
    note: "Among Serbs, Bulgarians, Russians and their neighbours the kum sponsored a couple's wedding and baptised their children, and the role often passed down between the same two families for generations.",
    sources: ["https://en.wikipedia.org/wiki/Kumstvo"],
  },
  {
    id: "sworn-siblings-china",
    label: "Sworn brotherhood and sisterhood in China",
    priority: 2,
    scope: { years: [-200, 1950], cultures: ["east-asian"], bounds: [97, 18, 123, 45] },
    evidence: "documented",
    tie: "sworn",
    odds: 0.5,
    word: ["sworn sister", "sworn brother"],
    lines: {
      other: [
        "You and {name} swore years ago, burning incense before witnesses, to be {as}s for life. You would be ashamed to refuse {him} anything.",
      ],
    },
    note: "Sworn brotherhood (jiebai) bound unrelated people by oath as siblings, famously the Peach Garden oath of the Three Kingdoms story; women formed sworn sisterhoods too.",
    sources: ["https://en.wikipedia.org/wiki/Sworn_brotherhood"],
  },
  {
    id: "nakodo",
    label: "The go-between in Japan",
    priority: 3,
    scope: { years: [1600, 1950], cultures: ["east-asian"], bounds: [128, 30, 146, 46] },
    evidence: "documented",
    tie: "sponsor",
    odds: 0.6,
    word: ["go-between", "go-between"],
    lines: {
      other: [
        "{name} was the go-between who arranged your marriage, and stood as its guarantor. You still take {him} gifts at New Year and in midsummer.",
      ],
    },
    note: "A nakōdo arranged a marriage, presided at the wedding and remained its guarantor; the couple owed the go-between gifts and deference afterwards.",
    sources: ["https://en.wikipedia.org/wiki/Miai"],
  },
  {
    id: "anda",
    label: "Anda, the sworn brother of the steppe",
    priority: 2,
    scope: { years: [-500, 1700], cultures: ["inner-eurasian"] },
    evidence: "documented",
    tie: "sworn",
    odds: 0.45,
    word: ["sworn sister", "anda"],
    lines: {
      other: [
        "{name} is your {as}, sworn to you when you were both young with an exchange of gifts. An oath like that is closer than blood.",
      ],
    },
    note: "Mongols bound sworn brothers (anda) by exchanging gifts and oaths; Temüjin and Jamukha swore it three times before they fell out.",
    sources: ["https://en.wikipedia.org/wiki/Anda_(Mongol)"],
  },
  {
    id: "foster-brothers-norse",
    label: "Sworn brotherhood in the Norse world",
    priority: 3,
    scope: { years: [700, 1200], cultures: ["european"], bounds: [-25, 54, 32, 71] },
    evidence: "documented",
    tie: "sworn",
    odds: 0.35,
    word: ["sworn sister", "sworn brother"],
    lines: {
      other: [
        "{name} is your {as}. You mixed your blood in the earth under a raised strip of turf and swore to avenge each other.",
      ],
    },
    note: "The sagas describe sworn brotherhood (fóstbræðralag) made by mingling blood in the earth beneath a raised strip of turf, binding each man to avenge the other.",
    sources: ["https://en.wikipedia.org/wiki/Blood_brother"],
  },
  {
    id: "blood-friendship-central-africa",
    label: "Blood friendship in Central Africa",
    priority: 2,
    scope: { years: [-500, 1950], cultures: ["west-central-african", "east-southern-african"], bounds: [8, -15, 35, 10] },
    evidence: "documented",
    tie: "sworn",
    odds: 0.4,
    word: ["blood friend", "blood friend"],
    lines: {
      other: [
        "{name} is your {as}. Each of you swallowed the other's blood and swore to help the other, and the oath will turn on whoever breaks it.",
      ],
    },
    note: "Among the Azande and many Central African peoples, blood brotherhood made by swallowing each other's blood bound partners to hospitality and aid, on pain of the blood's own curse; it also secured trade between strangers.",
    sources: ["https://en.wikipedia.org/wiki/Blood_brother"],
  },
  {
    id: "taio",
    label: "Taio, the bond friend of the Society Islands",
    priority: 3,
    scope: { years: [1000, 1900], cultures: ["australian-pacific"], bounds: [-155, -25, -134, -8] },
    evidence: "documented",
    tie: "sworn",
    odds: 0.5,
    word: ["taio", "taio"],
    lines: {
      other: [
        "{name} is your {as}, your bond friend. You exchanged names when you made the pact, and each of you may use what belongs to the other.",
      ],
    },
    note: "Tahitian taio exchanged names and shared property, and the tie bound their families; Cook's crews were pressed into it on arrival.",
    sources: ["https://en.wikipedia.org/wiki/Bond_friendship"],
  },
];

export const ritualKinFor = (setting?: WorldSetting) => customFor(ritualKin, setting);
