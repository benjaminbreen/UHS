import { random } from "../../core/random";
import { ruled } from "../history/order";
import { amountOf, B, BRITAIN, CHINA, dueOf, fillIn, ISLAMIC, ITALY, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { Condition, Effect, PlotContext, PlotTemplate } from "./types";

/** Whose estate it is: a parent while none is alive in the scene, else an uncle. */
const deceasedOf = (c: PlotContext) => {
  const parentLiving = c.player.relations?.some((r) => r.kind === "parent" && c.actors.some((a) => a.id === r.other && !a.dead));
  return parentLiving ? "uncle" : pickOf(c, ["father", "mother"], "estate-deceased");
};

const claimantOf = (c: PlotContext) => {
  const judge = notable(c);
  const pool = neighbours(c).filter((a) => a.householdId !== judge?.householdId && (a.age ?? 30) >= 25);
  return pool.length ? pickOf(c, pool, "estate-claimant") : undefined;
};

const answer: Effect = {
  type: "choose", line: "answer", focus: "claimant",
  choices: [{ id: "ask", check: { stat: "agreeableness", odds: 0.55 } }, { id: "search", check: { stat: "wit", odds: 0.4 } }, { id: "kin" }, { id: "pay" }],
};
const not = (id: string) => ({ type: "not", of: { type: "fired", id } }) as const;
const vouched: Condition = { type: "all", of: [{ type: "fired", id: "ask" }, not("ask:failed")] };

/** Someone has a claim on what a dead relative left, and the claim falls on you. */
export const estate: PlotTemplate = {
  id: "estate",
  shape: "claim",
  look: {
    emblem: "chest",
    palette: { ink: "#16120f", fill: "#2a211b", edge: "#6a4a3a", light: "#efe4da", accent: "#a8705a" },
  },
  payee: "claimant",
  weight: (c) => (ruled(c.setting) && (c.player.age ?? 30) >= 25 && claimantOf(c) && notable(c) ? 0.5 : 0),
  cast: (c) => {
    const claimant = claimantOf(c);
    const witness = notable(c);
    return claimant && witness && { claimant, witness };
  },
  begin: (c, cast) => {
    const claimant = cast.claimant!, witness = cast.witness!;
    const owed = 4 + Math.floor(random(c.seed, "plot", "estate", "owed") * 5);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const pr = pronounWords(claimant);
    return {
      deadline,
      owed,
      words: {
        claimant: claimant.name,
        claimantRole: claimant.role.toLowerCase(),
        witness: witness.name,
        amount: amountOf(c, owed),
        due,
        dead: deceasedOf(c),
        thing: fillIn(pickOf(c, [
          "a loan that was never repaid",
          "the price of seed that was never paid for",
          "a share that was promised to {him} before witnesses",
        ], "estate-thing"), pr),
        ...pr,
        ...p.words,
      },
      refs: { claimant: claimant.id, witness: witness.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "claimant", line: "claim" }],
  developments: [
    { id: "ask-claimant", when: { type: "all", of: [{ type: "talked", role: "claimant" }, not("ask-witness"), not("ask-late")] }, then: [answer] },
    { id: "ask-witness", when: { type: "all", of: [{ type: "talked", role: "witness" }, not("ask-claimant"), not("ask-late")] }, then: [answer] },
    { id: "ask-late", when: { type: "all", of: [{ type: "since", hours: 1 }, not("ask-claimant"), not("ask-witness"), { type: "not", of: { type: "settled" } }] }, then: [answer] },
    { id: "paying", when: { type: "fired", id: "pay" }, then: [{ type: "seize", role: "claimant" }] },
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: vouched }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "claimant" }],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, { type: "not", of: vouched }] },
      then: [
        { type: "walk-off", role: "claimant", to: "authority" },
        { type: "card", line: "court", focus: "claimant" },
        { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" },
      ],
    },
    {
      id: "verdict",
      when: { type: "all", of: [{ type: "came" }, { type: "not", of: vouched }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "claimant" }],
    },
    {
      id: "default",
      when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "claimant" }, { type: "regard", role: "official", delta: -2 }],
    },
  ],
  endings: [
    { id: "dismissed", when: { type: "all", of: [vouched, not("final")] } },
    { id: "proved", when: { type: "all", of: [{ type: "fired", id: "search" }, not("search:failed"), not("final")] } },
    { id: "shared", when: { type: "fired", id: "kin" } },
    { id: "judged", when: { type: "fired", id: "verdict" } },
    { id: "absent", when: { type: "fired", id: "default" } },
    { id: "paid", when: { type: "settled" } },
    { id: "heard", when: { type: "all", of: [{ type: "came" }, vouched] } },
    { id: "dropped", when: { type: "gone", role: "claimant" } },
  ],
  wording: [
    {
      // An heir took on the debts with the estate, and paid out the legacies the will named before keeping the rest.
      scope: { years: [B(200), 500], bounds: ITALY },
      title: "The Will",
      lines: {
        aim: "Get {witness} to speak against {claimant}'s claim, or pay it, {due}.",
        intro: "Your {dead}'s will has been opened, and you are the heir. {claimant} the {claimantRole} says the estate owes {him} {thing}, and an heir pays the estate's debts before keeping anything.",
        threat: "If you don't settle it, {he} will take it before {authority}.",
        partner: "Your {partnerKin} {partner} says {witness} was at the house when the will was sealed.",
        "kin-partner": "{witness} knew your {dead} better than anyone. Ask what was really agreed.",
        "cast-claimant": "Says your {dead}'s estate owes {him} {thing}.",
        "cast-witness": "Witnessed your {dead}'s will. People will believe what {witness} says about it.",
        claim: "I'm sorry about your {dead}. But the estate owes me {amount}, and you're the heir. I want it {due}.",
        talk: "{claimant} has been telling people that the heir of your {dead}'s house doesn't pay what it owes.",
        dismissed: "{witness} says in front of everyone that your {dead} never owed {claimant} anything. {claimant} lets it drop.",
        paid: "You pay {claimant} out of the estate. What is left is yours.",
        court: "{claimant} has taken the claim to {authority}. You'll have to answer it there.",
        dropped: "With {claimant} gone, nobody presses the claim.",
        proved: "Among your {dead}'s wax tablets is a receipt, sealed by {claimant}'s own witnesses, saying it was paid. {claimant} reads it and lets the claim drop.",
      },
    },
    {
      // Under Islamic law the dead person's debts come first, then bequests, then the fixed Quranic shares; a debt is proved by two witnesses.
      scope: { years: [700, 1900], bounds: ISLAMIC },
      title: "Before the Shares Are Divided",
      lines: {
        aim: "Get {witness} to speak against {claimant}'s claim, or pay it, {due}.",
        intro: "Your {dead} has died, and the estate can't be divided until every debt is paid. {claimant} the {claimantRole} says it owes {him} {thing}, and nobody gets their share until that is settled.",
        threat: "If you won't pay, {he} will take it to {authority}, and {he} will need two witnesses to prove it.",
        partner: "Your {partnerKin} {partner} says {witness} would have known about any such debt.",
        "kin-partner": "Your {dead} told {witness} everything. If there was a debt, {witness} knows.",
        "cast-claimant": "Says your {dead}'s estate owes {him} {thing}.",
        "cast-witness": "Knew your {dead}'s affairs. A debt needs witnesses, and {witness} would have been one.",
        claim: "God have mercy on your {dead}. But the debts come first, and there is {amount} owing to me. I want it {due}.",
        talk: "The rest of the family is asking why the estate still isn't divided.",
        dismissed: "{witness} says there was never any such debt, and {claimant} can't find anyone to say otherwise. The shares can be divided.",
        paid: "You pay {claimant}, and the rest of the estate is divided into its shares.",
        court: "{claimant} has gone to {authority} with the claim. You will have to answer it there.",
        dropped: "With {claimant} gone, the estate is divided without the claim.",
      },
    },
    {
      // When a household divided, the shares were written in a division contract and signed in front of kin as witnesses.
      scope: { years: [B(206), 1950], bounds: CHINA },
      title: "Dividing the Household",
      lines: {
        aim: "Get {witness} to speak against {claimant}'s claim, or pay it, {due}.",
        intro: "Since your {dead} died, the household's property has to be divided, and the division contract is still unsigned. {claimant} the {claimantRole} says the estate owes {him} {thing}, and won't sign as a witness until {he} is paid.",
        threat: "Without the contract signed, nothing is settled, and {he} is threatening to take it to {authority}.",
        partner: "Your {partnerKin} {partner} says {witness} remembers how your {dead} left things.",
        "kin-partner": "Ask {witness}. If {witness} says the claim is false, the others will sign.",
        "cast-claimant": "Says your {dead} owed {him} {thing}, and is holding up the division.",
        "cast-witness": "Respected by every household here. {witness}'s word would get the contract signed.",
        claim: "Before anyone signs anything, there is {amount} owed to me. Pay it {due} and I'll sign.",
        talk: "The other relatives are getting impatient, and some of them are starting to side with {claimant}.",
        dismissed: "{witness} says the claim is false, and the division contract is signed in front of everyone.",
        paid: "You pay {claimant}, {he} signs, and the household's property is divided.",
        court: "{claimant} has taken it to {authority}. The division will wait until the case is heard.",
        dropped: "With {claimant} gone, the contract is signed without {him}.",
        proved: "In your {dead}'s box of papers is a receipt with {claimant}'s own mark on it, saying the debt was paid. The relatives see it, and the division contract is signed.",
        "kin:label": "Ask the relatives to share the cost",
      },
    },
    {
      // Land passed by surrender and admittance in the manor court, or by enrolment in a borough court, written on the roll.
      scope: { years: [1150, 1650], bounds: BRITAIN },
      title: "The Court Roll",
      lines: {
        aim: "Get {witness} to speak for you at the court, or pay {claimant}, {due}.",
        intro: "Your {dead} is dead, and the court has to admit you to the holding before it is yours. {claimant} the {claimantRole} says the estate owes {him} {thing}, and will speak against your admission unless {he} is paid.",
        threat: "If {he} objects at the court, your admission may be put off, and {he} may take it further, to {authority}.",
        partner: "Your {partnerKin} {partner} says {witness} has sat on the court's jury for years.",
        "kin-partner": "The jury will listen to {witness}. Go and see {witness}.",
        "cast-claimant": "Says your {dead} owed {him} {thing}.",
        "cast-witness": "Sits on the court's jury, and the jury listens to {witness}.",
        claim: "Before you're admitted to that land, there's {amount} owed to me. Pay it {due}, or I speak at the court.",
        talk: "{claimant} has been going round the jury one by one.",
        dismissed: "{witness} tells the jury there was no such debt. You are admitted, and it goes on the roll.",
        paid: "You pay {claimant}, and nobody speaks against you at the court. You are admitted to the holding.",
        court: "{claimant} has gone to {authority}. Your admission will have to wait.",
        dropped: "With {claimant} gone, nobody objects, and you are admitted.",
      },
    },
    {
      title: "The Estate",
      lines: {
        aim: "Get {witness} to speak against {claimant}'s claim, or pay it, {due}.",
        intro: "Your {dead} has died, and what was left comes to you. {claimant} the {claimantRole} says the estate owes {him} {thing}.",
        threat: "If you don't settle it, {he} will take it to {authority}.",
        partner: "Your {partnerKin} {partner} says {witness} knew your {dead}'s affairs.",
        "kin-partner": "Ask {witness}. If anyone knows whether it's true, {witness} does.",
        "cast-claimant": "Says your {dead}'s estate owes {him} {thing}.",
        "cast-witness": "Knew your {dead} well. People will believe what {witness} says.",
        claim: "I'm sorry about your {dead}. But the estate owes me {amount}, and I want it {due}.",
        "claim.reluctant": "I'm sorry about your {dead}, and I'm sorry to bring this up now. The estate owes me {amount}. I need it {due}.",
        "claim.bully": "Your {dead} owed me {amount}, and now you owe it. Pay me {due}, or I go to {authority}.",
        "claim.gossip": "I'm sorry about your {dead}. But people know the estate owes me {amount}. Pay it {due} and nobody has to talk about it.",
        "claim.stickler": "I'm sorry about your {dead}. The estate owes me {amount}, and what the estate owes is yours to pay now. It's due {due}.",
        "claim.unsure": "I'm sorry about your {dead}. I don't know if you were told, but the estate owes me {amount}. Can you pay it {due}?",
        "claim.talker": "I'm so sorry about your {dead}. I've been thinking about your family all week. I hate to bring it up, but the estate owes me {amount}, and I need it {due}.",
        talk: "{claimant} has been telling everyone that your family doesn't pay what it owes.",
        dismissed: "{witness} says your {dead} never owed {claimant} anything, and people believe it. {claimant} lets it drop.",
        paid: "You pay {claimant} out of the estate. What is left is yours.",
        court: "{claimant} has taken the claim to {authority}. You'll have to answer it there.",
        dropped: "With {claimant} gone, nobody presses the claim.",
        hearing: "At the hearing before {authority}",
        "aim-hearing": "Answer {claimant}'s claim before {authority} {meet}. Get {witness} to speak for you first.",
        heard: "{claimant} sets out the claim. Then {witness} says your {dead} never owed anything of the kind, and the claim is thrown out.",
        answer: "{claimant} wants {amount} out of your {dead}'s estate. What do you do?",
        "ask:label": "Ask {witness} what was really owed",
        "ask:failed": "{witness} thinks for a long time, and says your {dead} never spoke of it either way.",
        "search:label": "Go through your {dead}'s things for proof",
        "search:then": "You go through the chest your {dead} kept, one thing at a time.",
        "search:failed": "There's nothing in the chest about {claimant} at all.",
        "kin:label": "Call the family together to share the cost",
        "pay:label": "Pay {amount} out of the estate",
        proved: "At the bottom of the chest is the proof that it was settled years ago. You show it to {claimant} in front of witnesses, and {he} lets it drop.",
        shared: "The family meets and agrees that the debt is the whole family's, not yours alone. Each household puts in a share, {claimant} is paid, and nobody is ruined by it.",
        judged: "{claimant} sets out the claim, and nobody contradicts it. The hearing goes against you: {amount} is to be paid out of the estate.",
        absent: "You didn't come to answer the claim, so it was decided without you. {amount} is to be paid to {claimant} out of the estate.",
      },
    },
  ],
};
