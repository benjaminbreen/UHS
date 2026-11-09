import type { Workplace } from "../characters/workplace";
import type { WorldSetting } from "../geography/types";
import { customFor, type HouseholdCustom } from "./scoped";

/**
 * How a trade passed to the next pair of hands in one place and time: who the
 * learner was to the master, on what terms, and for how long.
 *
 * Lines fill {name}, {as} (the `word`), {child} (son or daughter), {left}
 * (a clause on the years still to serve; only where there is a `term`), and
 * pronouns {she} {her} {him} {She} {Her}.
 */
export type LearnerArrangement = HouseholdCustom & {
  /** Share of households whose work takes a learner that have one in the house. */
  odds: number;
  /** Share of learners who are the householder's own child, where one is of age. */
  own: number;
  /** Age on joining the house, for a learner from outside it. */
  ages: readonly [number, number];
  /** Share of girls among learners from outside; 0 also keeps daughters out. */
  girls: number;
  /** Years bound, where the term was fixed. */
  term?: number;
  /** What a learner from outside is to the householder: female, male. */
  word: readonly [string, string];
  lines: {
    own: readonly string[];
    taken: readonly string[];
    /** For a learner held in bondage. */
    bound?: readonly string[];
  };
};

const EUROPE = [-11, 35, 32, 62] as const;

export const learnerArrangements: LearnerArrangement[] = [
  {
    id: "family",
    label: "Taught in the family",
    priority: 0,
    scope: { years: [-1000000, 10001] },
    evidence: "inferred",
    odds: 0.45,
    own: 0.85,
    ages: [10, 16],
    girls: 0.25,
    word: ["niece", "nephew"],
    lines: {
      own: [
        "Your {child} {name} works beside you every day, and is slowly learning the trade from you.",
        "{name}, your {child}, has been at your elbow since {she} could carry a tool, and is starting to be useful.",
      ],
      taken: [
        "Your {as} {name} lives with you to learn the trade, because {her} own parents have none to teach {him}.",
        "Your {as} {name} came to live with you to learn the trade. {She} is clumsy yet, but keen.",
      ],
    },
    note: "Before written contracts, and in most trades long after them, skill passed from parent to child or to a brother's or sister's child; the family was the workshop.",
    sources: ["https://en.wikipedia.org/wiki/Apprenticeship"],
  },
  {
    id: "gaulish-fosterage",
    label: "Fosterage among the Gauls",
    priority: 2,
    scope: { years: [-800, 100], cultures: ["european"], bounds: [-10, 42, 17, 57], except: [[7, 36, 19, 44.3]] },
    evidence: "inferred",
    odds: 0.5,
    own: 0.15,
    ages: [7, 14],
    girls: 0.3,
    word: ["foster daughter", "foster son"],
    lines: {
      own: [
        "Your {child} {name} was never sent away to be fostered, and is learning the trade from you instead.",
      ],
      taken: [
        "{name}, the child of another family, has lived in your house since {she} was small. You are raising {him} and teaching {him} your trade, and the fostering binds your two families together.",
        "Your {as} {name} came to you as a child, as is the custom. {Her} own parents will expect {him} back grown, and able to do your work.",
      ],
    },
    note: "Caesar says Gaulish sons were not seen with their fathers in public until they could bear arms; early Irish law describes fosterage in detail. Fosterage among the Gauls is inferred from the two.",
    sources: ["https://en.wikipedia.org/wiki/Fosterage", "https://en.wikipedia.org/wiki/Commentarii_de_Bello_Gallico"],
  },
  {
    id: "irish-fosterage",
    label: "Fosterage for a fee, under early Irish law",
    priority: 3,
    scope: { years: [400, 1200], cultures: ["european"], bounds: [-11, 51.3, -5.3, 55.5] },
    evidence: "documented",
    odds: 0.5,
    own: 0.15,
    ages: [7, 14],
    girls: 0.35,
    word: ["foster daughter", "foster son"],
    lines: {
      own: [
        "Your {child} {name} was never sent out to be fostered, and is learning the trade from you instead.",
      ],
      taken: [
        "Your {as} {name} was sent to you to learn your trade, and {her} family paid the fee the law sets. If you send {him} home untaught, you must give the fee back.",
        "Your {as} {name} has lived with you since {she} was seven. The law says you owe {him} food, clothes and a trade until {she} is grown.",
      ],
    },
    note: "The law tract on fosterage (Cáin Iarraith) set the fee by rank and listed what a foster child had to be taught; a fosterer who failed to teach forfeited the fee.",
    sources: ["https://en.wikipedia.org/wiki/Fosterage", "https://en.wikipedia.org/wiki/Early_Irish_law"],
  },
  {
    id: "mesopotamian-contract",
    label: "Apprenticeship by sealed contract",
    priority: 2,
    scope: { years: [-2100, -300], cultures: ["north-african-west-asian"], bounds: [38, 29, 50, 38] },
    evidence: "documented",
    odds: 0.45,
    own: 0.6,
    ages: [10, 15],
    girls: 0.05,
    term: 4,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you, as most craftsmen's children do. Nobody writes a contract for their own child.",
      ],
      taken: [
        "{name} is your apprentice under a sealed contract. {left}, and you have sworn before witnesses to teach {him} the whole of the trade by then.",
        "{name}'s father placed {him} with you by written contract. If you fail to teach {him} the whole trade, you owe the family silver.",
      ],
    },
    note: "Hammurabi's laws (§188–189) protect a craftsman who raised a boy and taught him the craft from having to give him back; Neo-Babylonian contracts bind a master to teach a craft 'completely' within a set number of years.",
    sources: ["https://en.wikipedia.org/wiki/Code_of_Hammurabi", "https://en.wikipedia.org/wiki/Apprenticeship"],
  },
  {
    id: "egyptian-papyri",
    label: "Apprenticeship contracts of Greek and Roman Egypt",
    priority: 3,
    scope: { years: [-300, 650], cultures: ["north-african-west-asian"], bounds: [24, 22, 36, 32] },
    evidence: "documented",
    odds: 0.45,
    own: 0.55,
    ages: [11, 15],
    girls: 0.25,
    term: 3,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you, with no contract needed for your own.",
      ],
      taken: [
        "{name} is apprenticed to you by contract: you feed {him}, and {her} family clothes {him}. {left}, with twenty days off a year for festivals.",
        "Under the contract with {name}'s mother, {she} works for you unpaid at first and for a small wage later. {left}.",
      ],
      bound: [
        "{name} is enslaved, and has been put with you to learn the trade, which will make {him} worth far more.",
      ],
    },
    note: "Dozens of apprenticeship contracts survive on papyrus, most for weaving. One from Oxyrhynchus (P.Oxy. 725) allows the apprentice twenty festival days a year. Slave owners apprenticed slaves the same way.",
    sources: ["https://en.wikipedia.org/wiki/Oxyrhynchus_Papyri"],
  },
  {
    id: "mediterranean",
    label: "Sons, hired pupils and enslaved apprentices",
    priority: 2,
    scope: { years: [-600, 500], cultures: ["european", "north-african-west-asian"], bounds: [-10, 30, 37, 46] },
    evidence: "documented",
    odds: 0.45,
    own: 0.65,
    ages: [11, 15],
    girls: 0.05,
    term: 4,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you, as craftsmen's children usually do.",
      ],
      taken: [
        "{name}'s family pays you to teach {him} the trade, and {she} lives under your roof until {she} has learned it. {left}.",
      ],
      bound: [
        "{name} is enslaved in your household and is being trained in your trade, which makes {him} worth several times more. If {she} is ever freed, {she} will likely keep working for you.",
      ],
    },
    note: "Most Greek and Roman craftsmen learned from their fathers; others were enslaved boys trained to raise their value. Roman law made a shoemaker liable when he struck an apprentice with a last and put out his eye (Digest 9.2.5.3).",
    sources: ["https://en.wikipedia.org/wiki/Digest_(Roman_law)", "https://en.wikipedia.org/wiki/Apprenticeship"],
  },
  {
    id: "guild-indenture",
    label: "Guild indenture",
    priority: 2,
    scope: { years: [1150, 1880], cultures: ["european"], bounds: EUROPE },
    evidence: "documented",
    odds: 0.55,
    own: 0.3,
    ages: [12, 15],
    girls: 0.06,
    term: 7,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade at your bench. As a master's child, {she} will not have to serve a full indenture.",
      ],
      taken: [
        "{name} is bound to you by indenture. {left}. {She} lives in your house, eats at your table, and may not marry until {she} is free.",
        "{name}'s father paid you a fee to take {him} as your apprentice, and the guild keeps the indenture. {left}, then {she} goes out as a journeyman, working for wages.",
      ],
    },
    note: "A guild indenture typically bound a child for seven years, living in the master's house and forbidden to marry; masters' sons often trained at home without one.",
    sources: ["https://en.wikipedia.org/wiki/Guild", "https://en.wikipedia.org/wiki/Apprenticeship"],
  },
  {
    id: "colonial-indenture",
    label: "Colonial indenture and parish binding",
    priority: 3,
    scope: { years: [1620, 1870], cultures: ["european"], bounds: [-100, 25, -60, 50] },
    evidence: "documented",
    odds: 0.5,
    own: 0.4,
    ages: [10, 14],
    girls: 0.2,
    term: 7,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you, without the indenture a stranger's child would need.",
      ],
      taken: [
        "{name} is indentured to you until {she} comes of age. You owe {him} board, lessons in reading and writing, and a new suit of clothes when {she} leaves.",
        "The overseers of the poor bound {name} to you as an orphan. {left}, and you owe {him} clothes and a set of tools when {she} goes.",
      ],
    },
    note: "Colonial indentures ran to twenty-one for boys, often eighteen for girls, and ended with 'freedom dues', usually clothes and sometimes tools. Overseers of the poor bound out orphans the same way.",
    sources: ["https://en.wikipedia.org/wiki/Indentured_servitude", "https://en.wikipedia.org/wiki/Apprenticeship"],
  },
  {
    id: "esnaf",
    label: "Guild apprentice (çırak) in the Ottoman and Islamic world",
    priority: 2,
    scope: { years: [1250, 1900], cultures: ["north-african-west-asian", "inner-eurasian"], bounds: [-10, 22, 70, 46] },
    evidence: "documented",
    odds: 0.5,
    own: 0.5,
    ages: [10, 15],
    girls: 0,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} is your apprentice as well as your {child}, and will one day stand before the guild elders to be girded as a journeyman.",
      ],
      taken: [
        "{name} is your apprentice. When you judge {him} ready, the guild elders will tie on {her} journeyman's sash in front of the whole trade.",
        "{name} is your apprentice. By guild custom you answer for {her} conduct as well as {her} work, as a father would.",
      ],
    },
    note: "Ottoman guilds ranked apprentice (çırak), journeyman (kalfa) and master (usta). Promotion came at a girding ceremony before the guild elders, a rite inherited from the futuwwa brotherhoods.",
    sources: ["https://en.wikipedia.org/wiki/Futuwwa", "https://en.wikipedia.org/wiki/Guild"],
  },
  {
    id: "shifu",
    label: "Master and apprentice in China",
    priority: 2,
    scope: { years: [-500, 1950], cultures: ["east-asian"], bounds: [97, 18, 123, 45] },
    evidence: "inferred",
    odds: 0.5,
    own: 0.5,
    ages: [12, 15],
    girls: 0,
    term: 3,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you. The trade's secrets are meant to stay in the family.",
      ],
      taken: [
        "{name} bowed to you as {her} master before witnesses and lives in your house. {left}, then by custom a year of work for you without pay.",
        "{name} is your apprentice. For the first year you kept {him} sweeping, fetching and cooking, and only lately let {him} near the real work.",
      ],
    },
    note: "An apprenticeship began with a formal bow to the master (bai shi), ran about three years, and was commonly followed by a year of unpaid work in thanks. The saying goes that a teacher for a day is a father for life.",
    sources: ["https://en.wikipedia.org/wiki/Shifu"],
  },
  {
    id: "uchi-deshi",
    label: "Live-in apprentice in Edo Japan",
    priority: 3,
    scope: { years: [1600, 1900], cultures: ["east-asian"], bounds: [128, 30, 146, 46] },
    evidence: "documented",
    odds: 0.5,
    own: 0.35,
    ages: [10, 13],
    girls: 0,
    term: 10,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you and will one day take over the house.",
      ],
      taken: [
        "{name} has lived in your house since {she} was a child and works for board, not wages. {left}, then a year of service in thanks.",
        "{name} has lived in your house since {she} was a child. If {she} turns out well you may set {him} up in a branch shop under your own shop curtain, or even adopt {him} as your heir.",
      ],
    },
    note: "Edo-period live-in apprentices served about ten years, then often a year of thank-you service. A master might set his best apprentice up in a branch shop under the house's own shop curtain (noren-wake), or adopt him as heir.",
    sources: ["https://en.wikipedia.org/wiki/Uchi-deshi", "https://en.wikipedia.org/wiki/Noren", "https://en.wikipedia.org/wiki/Mukoy%C5%8Dshi"],
  },
  {
    id: "hereditary-west-africa",
    label: "Crafts held by birth in West Africa",
    priority: 2,
    scope: { years: [1000, 1950], cultures: ["west-central-african"], bounds: [-17, 4, 15, 20] },
    evidence: "documented",
    odds: 0.6,
    own: 0.9,
    ages: [10, 15],
    girls: 0.2,
    word: ["brother's daughter", "brother's son"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you. Here crafts like yours run in families, and nobody born outside one is taught it.",
      ],
      taken: [
        "Your {as} {name} lives with you and is learning the trade. Only someone born into a craft family may learn it here, and {she} was.",
      ],
    },
    note: "Among the Mande, smiths, leatherworkers and bards formed hereditary groups (nyamakala) who married among themselves; a craft was learned by birth, not by contract. Benin's royal brass-casters were a hereditary guild.",
    sources: ["https://en.wikipedia.org/wiki/Nyamakala"],
  },
  {
    id: "calpolli",
    label: "Crafts held by ward in the Nahua world",
    priority: 2,
    scope: { years: [1250, 1521], cultures: ["mesoamerican"], bounds: [-105, 14, -94, 22] },
    evidence: "documented",
    odds: 0.5,
    own: 0.85,
    ages: [10, 15],
    girls: 0.3,
    word: ["niece", "nephew"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you, as children in your ward have learned it for generations. The ward and its patron god look after the craft.",
      ],
      taken: [
        "Your {as} {name} lives with you to learn the trade, which belongs to your ward and is not taught outside it.",
      ],
    },
    note: "Nahua crafts were organised by ward (calpolli): the featherworkers lived together in Amantlan with their own patron gods, and Sahagún's informants describe fathers teaching sons the trade.",
    sources: ["https://en.wikipedia.org/wiki/Calpolli", "https://en.wikipedia.org/wiki/Amanteca"],
  },
  {
    id: "camayoc",
    label: "Crafts owed to the Inca state",
    priority: 2,
    scope: { years: [1400, 1535], cultures: ["andean"], bounds: [-82, -40, -62, 2] },
    evidence: "documented",
    odds: 0.5,
    own: 0.85,
    ages: [10, 15],
    girls: 0.4,
    word: ["niece", "nephew"],
    lines: {
      own: [
        "Your {child} {name} is learning the trade from you. Your work is owed to the state, and one day {she} will owe it too.",
      ],
      taken: [
        "Your {as} {name} was sent to you to learn the work the state expects of your family.",
      ],
    },
    note: "Under the Inca, craft specialists (camayoc) were assigned by the state and held their work by descent; chosen girls (aclla) were taken to learn fine cloth weaving.",
    sources: ["https://en.wikipedia.org/wiki/Aclla"],
  },
  {
    id: "jati",
    label: "Crafts held by jati in South Asia",
    priority: 2,
    scope: { years: [-300, 1950], cultures: ["south-asian"] },
    evidence: "documented",
    odds: 0.55,
    own: 0.9,
    ages: [10, 15],
    girls: 0.15,
    word: ["niece", "nephew"],
    lines: {
      own: [
        "Your {child} {name} works at your side. In your community the trade passes from parent to child, and {she} has never expected any other.",
      ],
      taken: [
        "Your {as} {name} lives with you to learn the trade, which stays within your community.",
      ],
    },
    note: "South Asian crafts were largely held by hereditary jatis, learned in the household workshop, though guilds (shreni) regulated trades from the early historic period.",
    sources: ["https://en.wikipedia.org/wiki/Jati"],
  },
  {
    id: "modern",
    label: "Paid and regulated apprenticeship",
    priority: 1,
    scope: { years: [1880, 10001] },
    evidence: "documented",
    odds: 0.35,
    own: 0.3,
    ages: [14, 17],
    girls: 0.15,
    term: 4,
    word: ["apprentice", "apprentice"],
    lines: {
      own: [
        "Your {child} {name} works with you and is learning the trade, though {she} talks about going off to work in a factory instead.",
      ],
      taken: [
        "{name} is your apprentice and gets a small weekly wage. {left}, and {she} takes classes at the trade school.",
        "You took {name} on as an apprentice, with papers signed by {her} parents. {left}.",
      ],
    },
    note: "From the late nineteenth century, apprenticeships were increasingly paid and regulated by law or by unions, often alongside classes at a trade school.",
    sources: ["https://en.wikipedia.org/wiki/Apprenticeship"],
  },
];

/** How a trade is passed on here; the family's own way where nothing more particular is known. */
export const learnerArrangementFor = (setting?: WorldSetting) =>
  customFor(learnerArrangements, setting) ?? learnerArrangements[0];

// Masons and brickmakers work out of doors, but learned at a master's side all the same.
const TAUGHT_ACTIVITIES = new Set(["Working stone", "Making brick", "Keeping the record", "Tending the sick"]);
/** Work that was learned at a master's side over years, not just picked up. */
export const takesLearner = (workplace: Workplace, activity?: string) =>
  workplace === "workshop" || (!!activity && TAUGHT_ACTIVITIES.has(activity));
