import { random } from "../../core/random";
import { livelihoodById } from "../characters/livelihoods";
import { amountOf, dueOf, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

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

/** A customer says your work failed and wants it made good. */
export const complaint: PlotTemplate = {
  id: "complaint",
  look: {
    emblem: "rival",
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
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: { type: "talked", role: "witness" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "customer" }, { type: "regard", role: "customer", delta: -1 }],
    },
  ],
  endings: [
    { id: "vouched", when: { type: "talked", role: "witness" } },
    { id: "refunded", when: { type: "settled" } },
    { id: "gone", when: { type: "gone", role: "customer" } },
    { id: "spread", when: { type: "due" } },
  ],
  wording: [
    {
      title: "Bad Work",
      lines: {
        aim: "Pay {customer} back, or get {witness} to look at the work and judge it, {due}.",
        intro: "{customer} the {customerRole} says {work} {fault}, and is showing the pieces to everyone.",
        threat: "A {role} people think does bad work soon has nobody to work for.",
        partner: "Your {partnerKin} {partner} says {customer} was too rough with it, and anyone can see that.",
        "kin-partner": "Ask {witness} to look at it. If it's {customer}'s fault, {witness} will say so.",
        "cast-customer": "Says {work} {fault}, and wants paying back.",
        "cast-witness": "Has used your work for years. People will take {witness}'s word on it.",
        complain: "Look at this. {Work} {fault}. I want {amount} back, {due}, or everyone hears about it.",
        talk: "{customer} has been showing the pieces around. Someone who was coming to you went elsewhere.",
        vouched: "{witness} looks over the pieces and says it was misused, not badly made. People take {witness}'s word.",
        refunded: "You pay {customer} back. It costs you, but nobody can say you don't stand behind your work.",
        gone: "With {customer} gone, the complaint goes with {him}.",
        spread: "Nobody answered {customer}, and now people say you do bad work.",
      },
    },
  ],
};
