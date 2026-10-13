import { random } from "../../core/random";
import { amountOf, B, BRITAIN, dueOf, ITALY, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotTemplate } from "./types";

/** A neighbour says you took something. Someone respected can speak for you,
 * or you can pay to make it go away. */
export const accused: PlotTemplate = {
  id: "accused",
  look: {
    emblem: "accused",
    palette: { ink: "#18121a", fill: "#2a1f2b", edge: "#5e3a48", light: "#ece0e2", accent: "#b84a5e" },
  },
  payee: "accuser",
  weight: (c) => (neighbours(c).length >= 3 && notable(c) ? 0.45 : 0),
  cast: (c) => {
    const witness = notable(c);
    const others = neighbours(c).filter((a) => a.id !== witness?.id && a.householdId !== witness?.householdId);
    const accuser = others.length ? pickOf(c, others, "accuser") : undefined;
    return accuser && witness && { accuser, witness };
  },
  begin: (c, cast) => {
    const accuser = cast.accuser!, witness = cast.witness!;
    const owed = 2 + Math.floor(random(c.seed, "plot", "accused", "owed") * 3);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        accuser: accuser.name,
        accuserRole: accuser.role.toLowerCase(),
        witness: witness.name,
        witnessRole: witness.role.toLowerCase(),
        thing: pickOf(c, ["a pot of honey", "a good knife", "a hen", "a length of cloth", "a bundle of tools"], "accused-thing"),
        amount: amountOf(c, owed),
        due,
        ...pronounWords(accuser),
        ...p.words,
      },
      refs: { accuser: accuser.id, witness: witness.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "accuser", line: "accuse" }],
  developments: [
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 2 }, { type: "not", of: { type: "talked", role: "witness" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "accuser" }],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "talked", role: "witness" } }] },
      then: [{ type: "walk-off", role: "accuser", to: "authority" }],
    },
  ],
  endings: [
    { id: "cleared", when: { type: "talked", role: "witness" } },
    { id: "compensated", when: { type: "settled" } },
    { id: "denounced", when: { type: "fired", id: "final" } },
    { id: "dropped", when: { type: "gone", role: "accuser" } },
  ],
  wording: [
    {
      // The Twelve Tables let a man accused of theft be cleared by witnesses or pay double the value.
      scope: { years: [B(450), 400], bounds: ITALY },
      title: "Accused of Theft",
      lines: {
        aim: "Get {witness} to speak for you, or pay {accuser} to drop it, {due}.",
        intro: "{accuser} the {accuserRole} is telling anyone who will listen that you took {thing}.",
        threat: "If nobody speaks for you, {he} will take you before the magistrate, and a thief pays double.",
        partner: "Your {partnerKin} {partner} has heard it already, at the well.",
        "kin-partner": "They are saying at the well that you are a thief. Can't you get {witness} to speak for you?",
        "cast-accuser": "Says you stole from {his} house.",
        "cast-witness": "Is respected in town. A word from {witness} would end this.",
        accuse: "I know it was you who took {thing}. Pay me {amount} for it {due}, or I go to the magistrate.",
        talk: "By noon the whole street has heard {accuser}'s story, and people step aside when you pass.",
        cleared: "{witness} tells people you're honest, and they believe it. {accuser} stops talking.",
        compensated: "You pay {accuser}. It's over, but some people will take the payment as a confession.",
        denounced: "{accuser} has gone to the magistrate. You will have to answer for {thing} in front of everyone.",
        dropped: "With {accuser} gone, people soon forget the story.",
      },
    },
    {
      // A suspect could clear themselves by compurgation: neighbours swearing to their good name.
      scope: { years: [700, 1600], bounds: BRITAIN },
      title: "Accused of Theft",
      lines: {
        aim: "Get {witness} to swear for you, or pay {accuser} off, {due}.",
        intro: "{accuser} the {accuserRole} has been saying all over the parish that you took {thing}.",
        threat: "If nobody will swear for your good name, {he} will bring it to the court.",
        partner: "Your {partnerKin} {partner} heard it after church.",
        "kin-partner": "Everyone's saying you're a thief. Go to {witness} and get them to swear for you.",
        "cast-accuser": "Swears you took {thing}.",
        "cast-witness": "Is respected in the parish. If {witness} swears for you, the court will listen.",
        accuse: "I know you took {thing}. Give me {amount} for it {due}, or I'll have you before the court.",
        talk: "The story has gone round the parish. People are careful what they say in front of you.",
        cleared: "{witness} agrees to swear that you're honest. {accuser} drops the matter.",
        compensated: "You pay {accuser} for {thing}. It's over, but some people will take the payment as a confession.",
        denounced: "{accuser} has gone to bring the matter before the court. You'll need neighbours to swear for you.",
        dropped: "With {accuser} gone, the story stops.",
      },
    },
    {
      title: "Accused of Theft",
      lines: {
        aim: "Get {witness} to speak for you, or pay {accuser} to let it go, {due}.",
        intro: "{accuser} the {accuserRole} says you took {thing}, and is saying it to everyone.",
        threat: "If nobody speaks for you, {he} will go to those who keep order here.",
        partner: "Your {partnerKin} {partner} has heard it already.",
        "kin-partner": "People are saying you stole from {accuser}. Go and see {witness}; they listen to {witness}.",
        "cast-accuser": "Says you stole {thing}.",
        "cast-witness": "Is respected here. A word from {witness} would settle it.",
        accuse: "You took {thing}. I know it. Give me {amount} for it {due}, or everyone will hear what you are.",
        talk: "The story has gone round. People stop talking when you come near.",
        cleared: "{witness} tells people you're honest, and they believe it. {accuser} lets it go.",
        compensated: "You pay {accuser} for {thing}. It's over, but some people will take the payment as a confession.",
        denounced: "{accuser} has gone to those who keep order here. You will have to answer for {thing}.",
        dropped: "With {accuser} gone, people soon forget the story.",
      },
    },
  ],
};
