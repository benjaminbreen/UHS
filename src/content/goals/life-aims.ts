import type { Actor, Household, Stats } from "../../core/types";
import type { WorldSetting } from "../geography/types";
import type { CharacterScope, SocietyCapability } from "../characters/context-types";
import type { PersonalAim } from "./types";
import type { Standing } from "../../core/standing";
import type { Outlook } from "../../core/outlook";
import type { PersonalBelief } from "../beliefs";
import type { Bond } from "../../core/bonds";
import type { Departure } from "../bonds";
import type { Workplace } from "../characters/workplace";
import { sexOf } from "../../core/brief";

export const aimKin = (actor: Actor, relation: "child" | "parent" | "partner") => {
  const sex = sexOf(actor);
  const term = relation === "partner" ? "partner"
    : relation === "child" ? sex === "female" ? "daughter" : sex === "male" ? "son" : "child"
    : sex === "female" ? "mother" : sex === "male" ? "father" : "parent";
  return `${actor.name}, your ${actor.age === undefined ? "" : `${actor.age}-year-old `}${term}`;
};
const place = (c: LifeAimContext) => c.setting?.location ? ` in ${c.setting.location}` : "";
const article = (word: string) => /^[aeiou]/i.test(word) ? "an" : "a";
export const talkAimStep = (actor: Actor, text = `Speak with ${actor.name}.`): PersonalAim["step"] =>
  ({ type: "talk", actor: actor.id, text });
const foodStep = (actor: Actor): PersonalAim["step"] => ({
  type: "give", actor: actor.id, items: ["water", "bread", "fruit", "berries", "fish", "meat"],
  text: `Bring food or water to ${actor.name}.`,
});
export type LifeAimContext = {
  setting?: WorldSetting;
  player: Actor;
  household?: Household;
  people: Actor[];
  adultChild?: Actor;
  marriageChild?: Actor;
  youngChild?: Actor;
  elderlyParent?: Actor;
  partner?: Actor;
  apprentice?: Actor;
  master?: Actor;
  friend?: Actor;
  creditor?: Actor;
  sickKin?: Actor;
  beloved?: { actor: Actor; bond: Bond };
  rival?: Actor;
  estranged?: Actor;
  away?: Departure;
  recentlyMoved: boolean;
  establishedHome?: "built" | "inherited";
  widowed: boolean;
  remembersDead: boolean;
  hardTimes: boolean;
  hardship?: "bad-year" | "fire" | "robbed";
  lostPartner?: "wife" | "husband" | "partner";
  rememberedKin?: string;
  stats: Stats;
  standing?: Standing;
  outlook?: Outlook;
  belief?: PersonalBelief;
  capabilities: ReadonlySet<SocietyCapability>;
  work: string;
  trade: string;
  workplace: Workplace;
  shortGoods: string[];
};
export type AimBinding = Pick<PersonalAim, "text" | "subjects" | "step"> & { basis: NonNullable<PersonalAim["basis"]> };
export type LifeAimTemplate = {
  id: string;
  family?: string;
  weight: number;
  scope?: CharacterScope;
  fit?: (c: LifeAimContext) => number;
  eligible: (c: LifeAimContext) => boolean;
  bind: (c: LifeAimContext) => AimBinding;
};
const free = (c: LifeAimContext) => c.standing?.free !== false && c.player.origin?.standing !== "unfree";
const working = (c: LifeAimContext) => !!c.player.origin && (c.player.age ?? 30) >= 16;
const household = (c: LifeAimContext) => !!c.household;
const warm = (c: LifeAimContext) => 0.6 + c.stats.agreeableness / 70;
const ambitious = (c: LifeAimContext) => 0.5 + c.stats.conscientiousness / 80;

export const LIFE_AIM_TEMPLATES: LifeAimTemplate[] = [
  {
    id: "mastery", weight: 2.2, fit: ambitious,
    eligible: (c) => free(c) && c.player.origin?.livelihood === "apprentice" && !!c.trade,
    bind: (c) => ({
      text: c.trade === "apprentice" ? "Learn the work you are apprenticed to well enough to be trusted with it in your own right." : `Learn the ${c.trade}'s work well enough to be trusted with it in your own right.`, subjects: c.master ? [c.master.id] : [],
      basis: { reason: "Your livelihood is an apprenticeship.", means: "Practice the trade and earn your teacher's confidence.", obstacle: "Your standing still depends on others judging your work." },
      step: c.master ? talkAimStep(c.master) : { type: "work", target: 3, progress: 0, text: "Begin with three days of steady practice." },
    }),
  },
  {
    id: "child-future", weight: 2, fit: warm, eligible: (c) => !!c.adultChild,
    bind: (c) => ({
      text: `Help ${aimKin(c.adultChild!, "child")}, find work and people to rely on${place(c)}.`, subjects: [c.adultChild!.id],
      basis: { reason: "A grown child still shares your household.", means: "Discuss the work and relationships already available to them." }, step: talkAimStep(c.adultChild!),
    }),
  },
  {
    id: "teach-child", family: "child-future", weight: 1.7, fit: ambitious,
    eligible: (c) => working(c) && free(c) && !!c.youngChild && (c.youngChild.age ?? 0) >= 7 && ["workshop", "household", "field", "pasture", "water", "wild"].includes(c.workplace),
    bind: (c) => ({
      text: `Teach ${aimKin(c.youngChild!, "child")}, enough of your work to help keep the household going when you cannot.`, subjects: [c.youngChild!.id],
      basis: { reason: `Your child lives with you, and your work is ${c.player.activity.toLowerCase()}.`, means: "Pass on the work you already know.", obstacle: "Learning takes time that the household also needs for today's work." }, step: talkAimStep(c.youngChild!),
    }),
  },
  {
    id: "marriage-hope", weight: 2,
    eligible: (c) => free(c) && !!c.marriageChild,
    bind: (c) => ({
      text: `Find a marriage for ${aimKin(c.marriageChild!, "child")}, that gives the new household dependable support.`, subjects: [c.marriageChild!.id],
      basis: { reason: "Your household has an explicit plan to seek this child's marriage.", means: "Discuss a match and the households it would join.", obstacle: "The other household's wishes and means matter too." }, step: talkAimStep(c.marriageChild!),
    }),
  },
  {
    id: "elder-kin", weight: 2, fit: warm, eligible: (c) => !!c.elderlyParent,
    bind: (c) => ({
      text: `Keep ${aimKin(c.elderlyParent!, "parent")}, cared for without leaving the rest of the household short.`, subjects: [c.elderlyParent!.id],
      basis: { reason: "Your parent is growing old.", means: "Share food, water, and time with them.", obstacle: "Care has to fit alongside the household's other needs." }, step: foodStep(c.elderlyParent!),
    }),
  },
  {
    id: "care-through-illness", family: "elder-kin", weight: 2.8, fit: warm, eligible: (c) => !!c.sickKin,
    bind: (c) => ({
      text: `Keep ${c.sickKin!.name} cared for through illness, and keep the household working while they cannot.`, subjects: [c.sickKin!.id],
      basis: { reason: `${c.sickKin!.name} is a living relative with an illness under way.`, means: "Bring sustenance and make time to sit with them.", obstacle: "The illness also takes time and labour from the household." }, step: foodStep(c.sickKin!),
    }),
  },
  {
    id: "new-settlement", weight: 2, eligible: (c) => c.recentlyMoved,
    bind: (c) => ({
      text: `Become someone your neighbours${place(c)} will turn to and make room for, after your move.`, subjects: c.friend ? [c.friend.id] : [],
      basis: { reason: "Your household moved here within the last five years.", means: "Build dependable relationships through work and visits.", obstacle: "Established neighbours already have people they rely on." }, step: c.friend && talkAimStep(c.friend),
    }),
  },
  {
    id: "household-home", weight: 1.6, eligible: (c) => !!c.establishedHome && free(c),
    bind: (c) => ({
      text: `Keep the home ${c.establishedHome === "inherited" ? "you inherited" : "your household built"}${place(c)} fit for those who depend on it.`, subjects: [],
      basis: { reason: `Your household's history records a home ${c.establishedHome === "inherited" ? "inherited" : "built"}.`, means: "Maintain its stores and the work that supports its residents." },
    }),
  },
  {
    id: "raise-kin", weight: 1.7, fit: warm, eligible: (c) => !!c.youngChild || (c.household?.infants ?? 0) > 0,
    bind: (c) => ({
      text: c.youngChild ? `See ${aimKin(c.youngChild, "child")}, grow strong enough to take a place among the people who sustain your household.` : "Bring your household's youngest children through their first years with food and care enough to grow.",
      subjects: c.youngChild ? [c.youngChild.id] : [],
      basis: { reason: "Young children depend on your household.", means: "Provide sustenance, care, and people who will teach them." }, step: c.youngChild && foodStep(c.youngChild),
    }),
  },
  {
    id: "restore-household", weight: 2.8, eligible: (c) => c.hardTimes,
    bind: (c) => ({
      text: `Restore your household's footing${place(c)} after ${c.hardship === "fire" ? "the fire" : c.hardship === "robbed" ? "the robbery" : "a bad year"}, until one setback no longer leaves you short of food.`, subjects: [],
      basis: { reason: "A recorded hardship left the household with little to spare.", means: "Rebuild stores through the household's existing work.", obstacle: "Today's needs consume what could be set aside." },
    }),
  },
  {
    id: "remember-dead", weight: 1.4,
    eligible: (c) => c.remembersDead,
    bind: (c) => ({
      text: `Keep the memory of your ${c.rememberedKin ?? "household's dead"} alive, so those who come after you will know whom they belong to.`, subjects: [],
      basis: { reason: "Your household records a death, and your outlook gives the dead a continuing place.", means: "Keep their names and stories among the living." },
    }),
  },
  {
    id: "widowed-household", weight: 2, eligible: (c) => c.widowed,
    bind: (c) => ({
      text: `Find a way to keep your household together after your ${c.lostPartner ?? "partner"}'s death, without pretending one person can do the work of two.`, subjects: [],
      basis: { reason: "Your household lost a partner, and you have no living partner now.", means: "Draw on the household's surviving relationships and work.", obstacle: "There is one fewer person to share the burden." },
    }),
  },
  {
    id: "shared-future", weight: 1.5, fit: warm,
    eligible: (c) => !!c.partner,
    bind: (c) => ({
      text: `Make a life with ${c.partner!.name} in which work leaves you some time to enjoy each other's company.`, subjects: [c.partner!.id],
      basis: { reason: "You have a living partner.", means: "Share the work and make time together.", obstacle: "The household's demands leave little leisure." }, step: talkAimStep(c.partner!),
    }),
  },
  {
    id: "absent-child", family: "kin-belonging", weight: 2.2,
    eligible: (c) => !!c.away,
    bind: (c) => ({
      text: `Keep a place in your household for your ${c.away!.as}${c.away!.name ? ` ${c.away!.name}` : ""}, who ${c.away!.why}${c.away!.noWord ? ", and learn why no news has come" : ""}.`, subjects: [],
      basis: { reason: `The household records a child leaving: ${c.away!.why}.`, means: "Keep their place among your people and seek news when an opportunity arises.", obstacle: c.away!.noWord ? "There has been no word since they left." : "They are living beyond the settlement." },
    }),
  },
  {
    id: "grain-reserve", family: "food-security", weight: 1.7,
    eligible: (c) => working(c) && c.workplace === "field" && c.capabilities.has("settled_agriculture") &&
      /farm|grain|cultivat|peasant|plough|tenant|serf|thresh|reap|rice|wheat|barley|emmer|millet|maize|sorghum/i.test(c.work) &&
      !/cotton|tea|coffee|vine|fruit|orchard|sugar|tobacco|date|palm|olive|lentil|garden/i.test(c.work),
    bind: () => ({
      text: "Bring in enough grain that your household can eat through the lean season without consuming what must be kept for sowing.", subjects: [],
      basis: { reason: "Your work is cultivation in a farming community.", means: "Tend the crop and protect food and seed stores.", obstacle: "Food eaten now cannot be sown for the next harvest." },
    }),
  },
  {
    id: "wild-provision", family: "food-security", weight: 1.6,
    eligible: (c) => working(c) && c.workplace === "wild" && /gather|forag|hunt|game|trap/i.test(c.work) && !/fuel|timber|charcoal/i.test(c.work),
    bind: (c) => ({
      text: /hunt|game|trap/i.test(c.work) ? "Keep your people fed when game is scarce, and pass on the places and signs you have learned." : "Learn where food can still be found when the familiar gathering places have little left to give.", subjects: [],
      basis: { reason: `Your work is ${c.player.activity.toLowerCase()}.`, means: "Learn and revisit the surrounding resource places.", obstacle: "The land's supplies change with use and season." },
    }),
  },
  {
    id: "water-provision", family: "food-security", weight: 1.5,
    eligible: (c) => working(c) && c.workplace === "water" && /fish|net/i.test(c.work),
    bind: () => ({
      text: "Keep your household fed from the water even when the usual fishing places give a poor catch.", subjects: [],
      basis: { reason: "Your livelihood is fishing.", means: "Work the local water and maintain supplies between catches.", obstacle: "A day's catch is uncertain." },
    }),
  },
  {
    id: "herd-security", family: "food-security", weight: 1.6,
    eligible: (c) => working(c) && c.workplace === "pasture",
    bind: () => ({
      text: "Bring the animals through the hard season in good condition, so the people depending on them have enough for the year ahead.", subjects: [],
      basis: { reason: "Your work is tending animals.", means: "Attend to the herd's food, water, and safety.", obstacle: "Keeping people fed also depends on keeping animals alive." },
    }),
  },
  {
    id: "craft-reputation", family: "livelihood", weight: 1.4, fit: ambitious,
    eligible: (c) => working(c) && free(c) && c.workplace === "workshop" && c.player.origin?.livelihood !== "apprentice",
    bind: (c) => ({
      text: `Become known${place(c)} for dependable work as ${article(c.trade)} ${c.trade}, even when cheaper work is easier to find.`, subjects: [],
      basis: { reason: `You work as ${article(c.trade)} ${c.trade}.`, means: "Practice the trade and build trust through dependable work.", obstacle: "Good work takes time and materials." },
    }),
  },
  {
    id: "steady-custom", family: "livelihood", weight: 1.5,
    eligible: (c) => working(c) && free(c) && c.workplace === "market",
    bind: (c) => ({
      text: `Keep enough people coming back to your trade${place(c)} that a quiet spell does not empty the household stores.`, subjects: [],
      basis: { reason: "Your work depends on exchange and custom.", means: "Maintain supplies and relationships with buyers.", obstacle: "Trade can fall away while household needs continue." },
    }),
  },
  {
    id: "steady-wages", family: "livelihood", weight: 1.6,
    eligible: (c) => working(c) && free(c) && c.capabilities.has("wage_labor") &&
      /worker|labou?r|servant|porter|factory|mill hand|machin|on the line/i.test(c.work),
    bind: () => ({
      text: "Keep paid work steady enough to put something aside, so a spell without earnings does not leave your household hungry.", subjects: [],
      basis: { reason: "Your livelihood is labour or service where paid work is available.", means: "Maintain work and preserve some of its return.", obstacle: "Daily expenses continue when earnings stop." },
    }),
  },
  {
    id: "trusted-records", family: "reputation", weight: 1.3, fit: ambitious,
    eligible: (c) => working(c) && c.capabilities.has("writing") && /scribe|clerk|record|account/i.test(c.work),
    bind: () => ({
      text: "Become someone whose records others will trust, even when an error would be easier to conceal than to correct.", subjects: [],
      basis: { reason: "Your work involves written records.", means: "Keep careful accounts and acknowledge mistakes.", obstacle: "Other people's interests may pull against an honest record." },
    }),
  },
  {
    id: "care-reputation", family: "reputation", weight: 1.3, fit: warm,
    eligible: (c) => working(c) && /heal|physic|midwi|doctor|tending the sick/i.test(c.work),
    bind: () => ({
      text: "Become someone households will call for when illness or a difficult birth leaves them afraid and unsure whom to trust.", subjects: [],
      basis: { reason: "Your livelihood involves caring for the sick or attending births.", means: "Practice the care you know and build relationships with local households.", obstacle: "Care cannot promise every household the outcome it hopes for." },
    }),
  },
  {
    id: "clear-obligation", family: "obligation", weight: 2.4, eligible: (c) => !!c.creditor && free(c),
    bind: (c) => ({
      text: `Settle what your household owes ${c.creditor!.name}'s household, so you can meet again without the debt between you.`, subjects: [c.creditor!.id],
      basis: { reason: "Your household owes this supplier household.", means: "Speak with its living members and rebuild the means to repay.", obstacle: "The household still needs supplies while it owes for earlier ones." }, step: talkAimStep(c.creditor!),
    }),
  },
  {
    id: "repair-kinship", family: "kin-belonging", weight: 2, fit: warm,
    eligible: (c) => !!c.estranged,
    bind: (c) => ({
      text: `Find a way to speak with ${c.estranged!.name} again without reopening every old quarrel.`, subjects: [c.estranged!.id],
      basis: { reason: "A recorded bond marks this relative as estranged.", means: "Begin with a conversation.", obstacle: "They may not want the same reconciliation." }, step: talkAimStep(c.estranged!),
    }),
  },
  {
    id: "beloved-future", family: "affection", weight: 2.1, fit: warm,
    eligible: (c) => !!c.beloved?.bond.mutual,
    bind: (c) => ({
      text: c.beloved!.bond.secret ? `Keep your closeness with ${c.beloved!.actor.name} alive without exposing what you both keep private.` : c.beloved!.bond.opposed ? `Build a life with ${c.beloved!.actor.name}, despite the opposition of their family.` : `Make room for a shared life with ${c.beloved!.actor.name}, beyond the understanding you already have.`, subjects: [c.beloved!.actor.id],
      basis: { reason: "Your affection is reciprocated.", means: "Speak together about the life you can actually share.", obstacle: c.beloved!.bond.secret ? "The relationship is kept secret." : c.beloved!.bond.opposed ? "Their family opposes the relationship." : "A shared life still needs work and a place among other people." }, step: talkAimStep(c.beloved!.actor),
    }),
  },
  {
    id: "rival-regard", family: "reputation", weight: 1.2,
    fit: (c) => 1.7 - c.stats.agreeableness / 100,
    eligible: (c) => !!c.rival && free(c),
    bind: (c) => ({
      text: `Win regard for your own work that ${c.rival!.name} cannot claim or dismiss.`, subjects: [c.rival!.id],
      basis: { reason: "You have a rival in the same work.", means: "Build skill and dependable relationships through your work.", obstacle: "Your rival is pursuing the same regard." },
    }),
  },
  {
    id: "keep-kin-close", family: "kin-belonging", weight: 2,
    eligible: (c) => !free(c) && !!(c.partner ?? c.youngChild ?? c.adultChild),
    bind: (c) => {
      const person = (c.partner ?? c.youngChild ?? c.adultChild)!;
      return { text: `Keep ${person.name} close and cared for, though the work demanded of you leaves little of your time your own.`, subjects: [person.id],
        basis: { reason: "Your work is held under compulsion, and you have living kin.", means: "Use the time and sustenance available to maintain the relationship.", obstacle: "You do not command your own working life." }, step: talkAimStep(person) };
    },
  },
  {
    id: "faithful-life", family: "devotion", weight: 1,
    eligible: (c) => !!c.belief && c.belief.observance === "devout" && !!c.belief.keeps,
    bind: (c) => ({
      text: `Make time for ${["documented", "inferred"].includes(c.belief!.system.evidence.status) ? c.belief!.patron?.name ?? c.belief!.paramount?.name ?? "the observances of your faith" : "the observances of your faith"}, even when work leaves little time for anything else.`, subjects: [],
      basis: { reason: `You are devout in ${c.belief!.system.label}.`, means: c.belief!.keeps!, obstacle: "Work and household demands compete with observance.", evidence: c.belief!.system.evidence },
    }),
  },
  {
    id: "teach-apprentice", family: "mastery", weight: 1.5,
    eligible: (c) => free(c) && !!c.apprentice,
    bind: (c) => ({
      text: `Teach ${c.apprentice!.name} the work thoroughly enough that others will trust what they have learned from you.`, subjects: [c.apprentice!.id],
      basis: { reason: "A living apprentice is attached to you.", means: "Practice and discuss the work together.", obstacle: "Teaching takes time away from your own output." }, step: talkAimStep(c.apprentice!),
    }),
  },
  {
    id: "learn-from-others", family: "understanding", weight: 0.8,
    fit: (c) => c.stats.openness / 60,
    eligible: (c) => c.stats.openness >= 60 && !!c.friend,
    bind: (c) => ({
      text: `Learn what ${c.friend!.name} knows that your own daily work has never taught you.`, subjects: [c.friend!.id],
      basis: { reason: "You are curious and have a living friend.", means: "Visit and listen to someone whose experience differs from yours." }, step: talkAimStep(c.friend!),
    }),
  },
  {
    id: "quiet-sufficiency", family: "contentment", weight: 0.7,
    fit: (c) => c.outlook?.tags.has("ascetic") || c.outlook?.tags.has("quietist") ? 2 : 0.8,
    eligible: (c) => free(c) && household(c) && !c.hardTimes && (c.household?.fortune ?? 0) >= 0.4,
    bind: () => ({
      text: "Keep enough for the household and enough time to enjoy it, without taking on more work merely to be thought prosperous.", subjects: [],
      basis: { reason: "Your household currently has some means to spare.", means: "Maintain sufficiency and leave time for company and rest." },
    }),
  },
  {
    id: "find-belonging", family: "new-settlement", weight: 1.3,
    eligible: (c) => c.player.origin?.livelihood === "traveler",
    bind: () => ({
      text: "Find people with whom you can stay and work without being treated as a stranger every time you return.", subjects: [],
      basis: { reason: "Your livelihood is traveling.", means: "Build relationships in places you visit repeatedly.", obstacle: "Moving on makes those ties harder to keep." },
    }),
  },
  {
    id: "make-a-life", family: "livelihood", weight: 0.5,
    eligible: () => true,
    bind: (c) => ({
      text: !free(c) ? "Keep something of your time and strength for the people and things you care for, despite the work demanded of you." : (c.player.age ?? 30) < 16 ? "Learn the work of the people around you and find something they will come to trust you with." : `Make your daily work${place(c)} dependable enough to leave room for something you value beyond it.`, subjects: [],
      basis: { reason: "An ordinary aspiration grounded in your present working life.", means: "Build dependable routines and relationships from the work and people available." },
    }),
  },
];
