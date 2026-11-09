import { random } from "../../core/random";
import { livelihoodById } from "../characters/livelihoods";
import { amountOf, dueOf, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { Effect, PlotContext, PlotTemplate } from "./types";

/** By the kind of work: what the customer bought, and what went wrong with it. */
const FAULTS: Record<string, [string, string][]> = {
  "Working wood": [["the bowl you carved", "has split along the grain"], ["the stool you made", "has come apart at the joints"]],
  "Working timber": [["the door you hung", "has dropped and won't close"], ["the beam you shaped", "has cracked under the roof"]],
  "Working metal": [["the blade you forged", "snapped the first time it was used hard"], ["the pot you mended", "leaks again"]],
  "Making tools": [["the axe you made", "shattered on the first tree"], ["the sickle you made", "won't keep an edge"]],
  "Turning pots": [["the storage jar you fired", "cracked and let the damp into the grain"], ["the cooking pot you made", "split on the fire"]],
  "Working cloth": [["the cloth you wove", "pulled out of shape after one washing"]],
  Weaving: [["the cloth you wove", "pulled out of shape after one washing"], ["the basket you made", "gave way under a load"]],
  "Making clothes": [["the coat you made", "has split at the seams"]],
  "Working leather": [["the harness you made", "broke on the road"], ["the bag you made", "let the rain in"]],
  "Making shoes": [["the shoes you made", "let in water and came apart"]],
  "Working hides": [["the hide you cured", "has gone stiff and begun to rot"]],
  Brewing: [["the beer you brewed", "turned sour before the feast"]],
  Building: [["the wall you put up", "has cracked from top to bottom"]],
  "Working the roof": [["the roof you put on", "leaked in the first storm"]],
  "Working stone": [["the quern you cut", "has cracked across"]],
};

const faultsOf = (c: PlotContext) => {
  const kit = livelihoodById(c.player.origin?.livelihood ?? "");
  return kit && FAULTS[kit.activity];
};

const customerOf = (c: PlotContext) => {
  const vouch = notable(c);
  const pool = neighbours(c).filter((a) => a.householdId !== vouch?.householdId);
  return pool.length ? pickOf(c, pool, "customer") : undefined;
};

const answer: Effect = {
  type: "choose", line: "answer", focus: "customer",
  choices: [{ id: "judge", check: { stat: "conscientiousness", skill: "crafting", odds: 0.55 } }, { id: "remake" }, { id: "stand", check: { stat: "extraversion", skill: "speech", odds: 0.4 } }, { id: "refund" }],
};
const not = (id: string) => ({ type: "not", of: { type: "fired", id } }) as const;

/** A customer says your work failed and wants it made good. */
export const complaint: PlotTemplate = {
  id: "complaint",
  shape: "claim",
  look: {
    emblem: "mend",
    palette: { ink: "#10141a", fill: "#1a2230", edge: "#3e5a7a", light: "#e2e8f0", accent: "#5a8ac8" },
  },
  payee: "customer",
  weight: (c) => (faultsOf(c) && customerOf(c) && notable(c) ? 0.5 : 0),
  cast: (c) => {
    const customer = customerOf(c);
    const witness = notable(c);
    return customer && witness && { customer, witness };
  },
  begin: (c, cast) => {
    const customer = cast.customer!, witness = cast.witness!;
    const owed = 2 + Math.floor(random(c.seed, "plot", "complaint", "owed") * 3);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const [work, fault] = pickOf(c, faultsOf(c)!, "complaint-fault");
    return {
      deadline,
      owed,
      words: {
        customer: customer.name,
        customerRole: customer.role.toLowerCase(),
        witness: witness.name,
        role: c.player.role.toLowerCase(),
        amount: amountOf(c, owed),
        due,
        work,
        Work: work.replace(/^./, (x) => x.toUpperCase()),
        fault,
        ...pronounWords(customer),
        ...p.words,
      },
      refs: { customer: customer.id, witness: witness.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "customer", line: "complain" }],
  developments: [
    { id: "ask-customer", when: { type: "all", of: [{ type: "talked", role: "customer" }, not("ask-witness"), not("ask-late")] }, then: [answer] },
    { id: "ask-witness", when: { type: "all", of: [{ type: "talked", role: "witness" }, not("ask-customer"), not("ask-late")] }, then: [answer] },
    { id: "ask-late", when: { type: "all", of: [{ type: "since", hours: 1 }, not("ask-customer"), not("ask-witness"), { type: "not", of: { type: "settled" } }] }, then: [answer] },
    { id: "repaid", when: { type: "fired", id: "refund" }, then: [{ type: "seize", role: "customer" }] },
    { id: "condemned", when: { type: "fired", id: "judge:failed" }, then: [{ type: "seize", role: "customer" }] },
    { id: "terms", when: { type: "fired", id: "remake" }, then: [{ type: "extend", hours: 12 }] },
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 3 }, not("judge"), not("remake"), { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "customer" }, { type: "regard", role: "customer", delta: -1 }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "customer" } },
    { id: "faulted", when: { type: "fired", id: "condemned" } },
    { id: "vouched", when: { type: "fired", id: "judge" } },
    { id: "refunded", when: { type: "settled" } },
    { id: "remade", when: { type: "all", of: [{ type: "fired", id: "remake" }, { type: "brought", role: "customer" }] } },
    { id: "stood", when: { type: "all", of: [{ type: "fired", id: "stand" }, not("stand:failed")] } },
    { id: "spread", when: { type: "fired", id: "stand:failed" } },
    { id: "spread", when: { type: "due" } },
  ],
  wording: [
    {
      title: "Bad Work",
      lines: {
        aim: "Pay {customer} back, or get {witness} to look at the work and judge it, {due}.",
        intro: "{customer} the {customerRole} says {work} {fault}, and is showing the pieces to everyone.",
        threat: "If people decide you do bad work, they'll stop coming to you.",
        partner: "Your {partnerKin} {partner} says {customer} was too rough with it, and anyone can see that.",
        "kin-partner": "Ask {witness} to look at it. If it's {customer}'s fault, {witness} will say so.",
        "cast-customer": "Says {work} {fault}, and wants paying back.",
        "cast-witness": "Has used your work for years. People will take {witness}'s word on it.",
        complain: "Look at this. {Work} {fault}. I want {amount} back, {due}, or everyone hears about it.",
        talk: "{customer} has been showing the pieces around. Someone who was coming to you went elsewhere.",
        answer: "{customer} is holding up the pieces for anyone who passes. What do you do?",
        "judge:label": "Ask {witness} to look at the pieces and judge",
        "judge:then": "{witness} turns the pieces over in the light for a long time.",
        "remake:label": "Offer to make it again, at your own cost",
        "remake:then": "{customer} grudgingly agrees. Do the day's work, then bring {him} the new one.",
        "stand:label": "Tell {him} to {his} face it was misused",
        "stand:failed": "You argue in front of people, and they side with {customer}.",
        "refund:label": "Pay {amount} back from the store",
        faulted: "{witness} says it's poor work, in front of everyone. You pay {customer} back, and people heard what {witness} said.",
        remade: "You bring {customer} a new one, better than the first. {He} looks it over and nods, and stops showing the old pieces around.",
        stood: "You show everyone how it was forced and where it was strained. People laugh, and {customer} stops complaining.",
        vouched: "{witness} looks over the pieces and says it was misused, not badly made. People take {witness}'s word.",
        refunded: "You pay {customer} back. It costs you, but nobody can say you don't stand behind your work.",
        gone: "With {customer} gone, nobody is pressing the complaint.",
        spread: "Nobody answered {customer}, and now people say you do bad work.",
      },
    },
  ],
};
