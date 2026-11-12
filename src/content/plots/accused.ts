import { random } from "../../core/random";
import { amountOf, B, BRITAIN, dueOf, ITALY, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotTemplate } from "./types";

/** A neighbour says you took something. Someone respected can speak for you,
 * or you can pay to make it go away. */
export const accused: PlotTemplate = {
  id: "accused",
  shape: "claim",
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
      then: [
        { type: "walk-off", role: "accuser", to: "authority" },
        { type: "card", line: "denounced", focus: "accuser" },
        { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" },
      ],
    },
    {
      id: "answer",
      when: { type: "all", of: [{ type: "since", hours: 1 }, { type: "not", of: { type: "talked", role: "witness" } }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "fired", id: "final" } }] },
      then: [{
        type: "choose", line: "answer", focus: "accuser",
        choices: [{ id: "oath", check: { stat: "agreeableness", skill: "speech", odds: 0.45 } }, { id: "search", check: { stat: "wit", odds: 0.35 } }, { id: "pay" }],
      }],
    },
    { id: "paid", when: { type: "fired", id: "pay" }, then: [{ type: "seize", role: "accuser" }] },
    {
      id: "verdict",
      when: { type: "all", of: [{ type: "came" }, { type: "not", of: { type: "talked", role: "witness" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "accuser" }],
    },
    {
      id: "default",
      when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "accuser" }, { type: "regard", role: "official", delta: -2 }],
    },
  ],
  endings: [
    { id: "cleared", when: { type: "all", of: [{ type: "talked", role: "witness" }, { type: "not", of: { type: "fired", id: "final" } }] } },
    { id: "judged", when: { type: "fired", id: "verdict" } },
    { id: "absent", when: { type: "fired", id: "default" } },
    { id: "compensated", when: { type: "settled" } },
    { id: "heard", when: { type: "all", of: [{ type: "came" }, { type: "talked", role: "witness" }] } },
    { id: "dropped", when: { type: "gone", role: "accuser" } },
    { id: "sworn", when: { type: "all", of: [{ type: "fired", id: "oath" }, { type: "not", of: { type: "fired", id: "oath:failed" } }] } },
    { id: "found", when: { type: "all", of: [{ type: "fired", id: "search" }, { type: "not", of: { type: "fired", id: "search:failed" } }] } },
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
        "oath:label": "Swear to your innocence at the church door",
      },
    },
    {
      title: "Accused of Theft",
      lines: {
        aim: "Get {witness} to speak for you, or pay {accuser} to let it go, {due}.",
        intro: "{accuser} the {accuserRole} says you took {thing}, and is saying it to everyone.",
        threat: "If nobody speaks for you, {he} will go to {authority}.",
        partner: "Your {partnerKin} {partner} has heard it already.",
        "kin-partner": "People are saying you stole from {accuser}. Go and see {witness}; they listen to {witness}.",
        "cast-accuser": "Says you stole {thing}.",
        "cast-witness": "Is respected here. A word from {witness} would settle it.",
        accuse: "You took {thing}. I know it. Give me {amount} for it {due}, or everyone will hear what you are.",
        "accuse.reluctant": "Someone took {thing} from my house, and I think it was you. I don't want to make a big thing of it. Give me {amount} for it {due} and we're fine.",
        "accuse.bully": "You stole {thing} from me. I want {amount} for it {due}. If I don't get it, I'll tell everyone here you're a thief.",
        "accuse.gossip": "Someone took {thing} from my house, and people are saying it was you. Give me {amount} for it {due} and I'll tell them it's been sorted out.",
        "accuse.stickler": "You took {thing} from my house. It's worth {amount}, and that's what you owe me. Pay it {due}, or I take this to {authority}.",
        "accuse.unsure": "Someone took {thing} from my house. I think it was you, but I didn't see it happen. If it was, bring me {amount} {due}. If it wasn't, tell me now.",
        "accuse.talker": "I've been looking for you. Someone took {thing} from my house, and I've asked around, and it keeps coming back to you. I want {amount} for it {due}, all right?",
        talk: "The story has gone round. People stop talking when you come near.",
        cleared: "{witness} tells people you're honest, and they believe it. {accuser} lets it go.",
        compensated: "You pay {accuser} for {thing}. It's over, but some people will take the payment as a confession.",
        denounced: "{accuser} has gone to {authority}. You will have to answer for {thing}.",
        dropped: "With {accuser} gone, people soon forget the story.",
        hearing: "At the hearing before {authority}",
        "aim-hearing": "Answer {accuser}'s charge before {authority} {meet}. Get {witness} to speak for you first.",
        heard: "{accuser} makes the charge in front of everyone. Then {witness} stands up and says you're honest, and the charge is thrown out.",
        judged: "{accuser} makes the charge, and nobody speaks for you. The hearing goes against you: {amount} is to be taken from your house and given to {accuser}.",
        absent: "You didn't come to answer the charge, so it was decided without you. {amount} is to be taken from your house, and people say you stayed away because you're guilty.",
        answer: "{accuser} is still telling the story to anyone who stops. What do you do?",
        "oath:label": "Swear in public that you never touched it",
        "oath:failed": "You swear it in front of the neighbours. A few believe you; more of them look at {accuser}, and {accuser} just laughs.",
        "search:label": "Find out what really happened to {thing}",
        "search:failed": "You ask around and look everywhere you can think of, and find nothing.",
        "pay:label": "Pay {amount} from the store to end it",
        sworn: "You swear it in front of the neighbours, and they believe you. {accuser} has nothing to answer that with, and stops.",
        found: "You find {thing} at the back of {accuser}'s own shed, put away and forgotten. The neighbours see it, and {accuser} doesn't say another word about it.",
      },
    },
  ],
};
