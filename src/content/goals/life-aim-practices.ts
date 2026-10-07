import { talkAimStep, type LifeAimContext, type LifeAimTemplate } from "./life-aims";
import type { Evidence } from "../history/types";
import { sexOf } from "../../core/brief";

const inferred = (claim: string, source: string, limitation: string): Evidence =>
  ({ status: "inferred", claim, sources: [source], limitation });
const independent = (c: LifeAimContext) => c.standing?.free !== false && c.player.origin?.standing !== "unfree";
const weaver = (c: LifeAimContext) => c.people.find((a) => a.id !== c.player.id &&
  a.householdId !== c.household?.id && (a.age ?? 0) >= 18 && a.origin?.standing !== "unfree" &&
  /weaver|weaving/i.test(`${a.origin?.roleLabel ?? a.role} ${a.activity}`));
const konya = { years: [-7099, -5999] as const, places: ["konya"] };
const rome = { years: [-100, 300] as const, places: ["rome", "umbria"] };
const apprentice = (c: LifeAimContext) => independent(c) && c.player.origin?.livelihood === "apprentice";

export const LOCAL_LIFE_AIMS: LifeAimTemplate[] = [
  {
    id: "konya-house-continuity", family: "household-home", scope: konya, weight: 2.4,
    eligible: (c) => !!c.establishedHome,
    bind: (c) => ({
      text: "Keep the house your people have made a place worth renewing, with room for its stores, its living, and the memory of its dead.", subjects: [],
      basis: { reason: `Your household's history records a home ${c.establishedHome}.`, means: "Sustain the household and its stores across repairs and rebuilding.",
        evidence: inferred("Çatalhöyük houses combined storage, domestic activity, burial, and repeated rebuilding.", "https://www.catalhoyuk.com/site/architecture", "A fictional household's desire for continuity is inferred; kinship, ownership, and particular burials are not established by this aim.") },
    }),
  },
  {
    id: "konya-seed-and-food", family: "food-security", scope: konya, weight: 2.5,
    eligible: (c) => c.workplace === "field" && c.capabilities.has("settled_agriculture"),
    bind: () => ({
      text: "Keep grain in the house for food and for the next sowing, so a hungry season does not take away the harvest after it.", subjects: [],
      basis: { reason: "Your livelihood is cultivation at this early farming settlement.", means: "Tend cultivation and preserve household grain.", obstacle: "Food and the next sowing compete for the same grain.",
        evidence: inferred("Wheat and barley were eaten at Çatalhöyük, whose houses had storage areas.", "https://www.catalhoyuk.com/site/life", "Seed retention and this household's aspiration are plausible reconstruction, rather than an attested personal intention.") },
    }),
  },
  {
    id: "rome-hearth-observance", family: "household-home", scope: rome, weight: 2,
    eligible: (c) => !!c.household && !!c.belief && ["republican-roman", "imperial-roman"].includes(c.belief.system.id) && ["regular", "devout"].includes(c.belief.observance),
    bind: () => ({
      text: "Keep the household fed and its hearth honoured on the Kalends, Nones, and Ides, even when there is little to spare.", subjects: [],
      basis: { reason: "You keep Roman household observances.", means: "Combine care of the household with its recurring hearth observance.", obstacle: "The household's means limit what can be offered.",
        evidence: inferred("Cato describes garlanding the hearth and praying to the household Lar on the Kalends, Nones, and Ides.", "https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Cato/De_Agricultura/J%2A.html", "Cato describes a farm's prescribed duties; extending the practice to this household and its personal aim is an inference.") },
    }),
  },
  {
    id: "rome-bread-custom", family: "livelihood", scope: rome, weight: 2.2,
    eligible: (c) => independent(c) && /baker|baking|miller|milling/i.test(c.work),
    bind: () => ({
      text: "Become the person neighbours trust for their bread, and keep that custom through a year when grain is dear.", subjects: [],
      basis: { reason: "Your livelihood is baking or milling.", means: "Keep producing dependable bread and maintain local custom.", obstacle: "Costly grain can consume the return from your work.",
        evidence: inferred("Roman baking and grain processing supported specialized urban livelihoods.", "https://www.ostia-antica.org/dict/topics/bakeries/bakeries.htm", "The price pressure is a prospective difficulty, not a claim that a shortage has been generated or that this person owns a bakery.") },
    }),
  },
  {
    id: "fayum-weaving-training", family: "child-future", weight: 2.7,
    scope: { years: [200, 300], bounds: [30.3, 29, 31.2, 29.9] },
    eligible: (c) => independent(c) && !!c.youngChild && (c.youngChild.age ?? 0) >= 7 && sexOf(c.youngChild) === "female" && !!weaver(c),
    bind: (c) => {
      const teacher = weaver(c)!;
      return {
        text: `Have ${c.youngChild!.name} learn weaving from ${teacher.name}, with food and clothing provided while she learns.`, subjects: [c.youngChild!.id, teacher.id],
        step: talkAimStep(teacher),
        basis: { reason: "A young daughter lives with you, and a living weaver works in another local household.", means: `Approach ${teacher.name} about instruction and upkeep.`, obstacle: "Instruction and upkeep need terms both households can sustain.",
          evidence: inferred("A Karanis contract of 271 CE arranges weaving instruction for a girl with a professional woman, including upkeep.", "https://lsa.umich.edu/kelsey/exhibitions/special-exhibitions/kelsey-in-focus/kif-12/formal-learning.html", "The candidate teacher and desire are fictional; availability is inferred within the third-century Fayum. No contract or teacher's consent is assumed.") },
      };
    },
  },
  {
    id: "florence-workshop-learning", family: "mastery", weight: 2.5,
    scope: { years: [1400, 1600], places: ["city-florence"] },
    eligible: (c) => apprentice(c) && c.capabilities.has("guild_apprenticeship"),
    bind: (c) => ({
      text: `Learn ${c.trade === "apprentice" ? "your trade" : `the ${c.trade}'s work`} in Florence well enough that your teacher's name opens doors for you, rather than merely keeping you at errands.`, subjects: c.master ? [c.master.id] : [],
      step: c.master && talkAimStep(c.master),
      basis: { reason: "You are an apprentice in Renaissance Florence.", means: "Learn through workshop practice and the relationships of the trade.", obstacle: "Being useful in a workshop is easier than earning recognition for your skill.",
        evidence: inferred("Renaissance craft training and production took place in workshops within locally organized trades.", "https://resources.metmuseum.org/resources/metpublications/pdf/The_Art_of_Renaissance_Europe_A_Resource_for_Educators.pdf", "The aim grants neither guild membership nor a right to open a workshop; the teacher's future recommendation remains a hope.") },
    }),
  },
  {
    id: "london-apprentice-standing", family: "mastery", weight: 2.4,
    scope: { years: [1690, 1800], places: ["london"] },
    eligible: (c) => apprentice(c) && c.capabilities.has("guild_apprenticeship"),
    bind: (c) => ({
      text: `Come through your apprenticeship with ${c.trade === "apprentice" ? "a thorough knowledge of the work" : `the skills needed for ${c.trade}'s work`}, and people willing to recommend you when your term is over.`, subjects: c.master ? [c.master.id] : [],
      step: c.master && talkAimStep(c.master),
      basis: { reason: "You are an apprentice in eighteenth-century London.", means: "Learn the trade and maintain relationships with the people who teach and employ you.", obstacle: "Finishing a term does not ensure a dependable livelihood.",
        evidence: inferred("London apprenticeship records document placement with masters to learn trades.", "https://old.londonlives.org/static/RA.jsp", "The registers concern particular apprentice populations; this fictional aim does not assume citizenship, company admission, or a standard term length.") },
    }),
  },
  {
    id: "kyoto-household-trade", family: "livelihood", weight: 2.3,
    scope: { years: [1650, 1850], places: ["kyoto"] },
    eligible: (c) => independent(c) && !!c.household && c.workplace === "market",
    bind: () => ({
      text: "Make a dependable household trade in Kyoto, keeping enough for modest meals and fresh stock rather than spending every good day's takings.", subjects: [],
      basis: { reason: "Your household lives by exchange in Kyoto.", means: "Maintain custom, provision the household, and preserve means for further trade.", obstacle: "Money spent on household display is unavailable for stock.",
        evidence: inferred("Edo-period Kyoto shops combined household and business life; modest merchant meals are described alongside a seventeenth-century handscroll.", "https://www.metmuseum.org/art/collection/search/45753", "This desire is inferred for a fictional trader; no shop ownership, exact diet, or uniform merchant temperament is assumed.") },
    }),
  },
];
