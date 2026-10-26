import { random } from "../../core/random";
import { ruled } from "../history/order";
import { amountOf, B, BRITAIN, CHINA, dueOf, fillIn, ISLAMIC, ITALY, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

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

/** Someone has a claim on what a dead relative left, and the claim falls on you. */
export const estate: PlotTemplate = {
  id: "estate",
  look: {
    emblem: "slate",
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
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "talked", role: "witness" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "claimant" }],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "talked", role: "witness" } }] },
      then: [{ type: "walk-off", role: "claimant", to: "authority" }],
    },
  ],
  endings: [
    { id: "dismissed", when: { type: "talked", role: "witness" } },
    { id: "paid", when: { type: "settled" } },
    { id: "court", when: { type: "fired", id: "final" } },
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
        talk: "{claimant} has been telling everyone that your family doesn't pay what it owes.",
        dismissed: "{witness} says your {dead} never owed {claimant} anything, and people believe it. {claimant} lets it drop.",
        paid: "You pay {claimant} out of the estate. What is left is yours.",
        court: "{claimant} has taken the claim to {authority}. You'll have to answer it there.",
        dropped: "With {claimant} gone, nobody presses the claim.",
      },
    },
  ],
};
