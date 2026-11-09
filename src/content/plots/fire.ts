import { random } from "../../core/random";
import { ruled } from "../history/order";
import { amountOf, BRITAIN, CHINA, dueOf, ITALY, JAPAN, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { Condition, Effect, PlotTemplate } from "./types";

const answer: Effect = {
  type: "choose", line: "answer", focus: "accuser",
  choices: [
    { id: "ask", check: { stat: "agreeableness", odds: 0.55 } },
    { id: "ashes", check: { stat: "wit", odds: 0.4 } },
    { id: "rebuild" },
    { id: "pay" },
  ],
};
const not = (id: string) => ({ type: "not", of: { type: "fired", id } }) as const;
const vouched: Condition = { type: "all", of: [{ type: "fired", id: "ask" }, not("ask:failed")] };

/** A fire got into a neighbour's house, and they say it started at yours. */
export const fire: PlotTemplate = {
  id: "fire",
  shape: "claim",
  look: {
    emblem: "blaze",
    palette: { ink: "#1a100c", fill: "#2e1a12", edge: "#7a3a1e", light: "#f4e2d4", accent: "#e0682a" },
  },
  payee: "accuser",
  weight: (c) => {
    if (!ruled(c.setting) || neighbours(c).length < 3 || !notable(c)) return 0;
    return c.setting?.settlement === "city" || c.setting?.settlement === "port" ? 0.35 : 0.15;
  },
  cast: (c) => {
    const witness = notable(c);
    const others = neighbours(c).filter((a) => a.id !== witness?.id && a.householdId !== witness?.householdId);
    const accuser = others.length ? pickOf(c, others, "fire-accuser") : undefined;
    return accuser && witness && { accuser, witness };
  },
  begin: (c, cast) => {
    const accuser = cast.accuser!, witness = cast.witness!;
    const owed = 3 + Math.floor(random(c.seed, "plot", "fire", "owed") * 4);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        accuser: accuser.name,
        accuserRole: accuser.role.toLowerCase(),
        witness: witness.name,
        amount: amountOf(c, owed),
        due,
        lost: pickOf(c, ["back wall and the store behind it", "winter's store of food", "roof over the back room", "shed and the tools in it"], "fire-lost"),
        ...pronounWords(accuser),
        ...p.words,
      },
      refs: { accuser: accuser.id, witness: witness.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "accuser", line: "accuse" }],
  developments: [
    { id: "ask-accuser", when: { type: "all", of: [{ type: "talked", role: "accuser" }, not("ask-witness"), not("ask-late")] }, then: [answer] },
    { id: "ask-witness", when: { type: "all", of: [{ type: "talked", role: "witness" }, not("ask-accuser"), not("ask-late")] }, then: [answer] },
    { id: "ask-late", when: { type: "all", of: [{ type: "since", hours: 1 }, not("ask-accuser"), not("ask-witness"), { type: "not", of: { type: "settled" } }] }, then: [answer] },
    { id: "paying", when: { type: "fired", id: "pay" }, then: [{ type: "seize", role: "accuser" }] },
    { id: "terms", when: { type: "fired", id: "rebuild" }, then: [{ type: "extend", hours: 12 }] },
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: vouched }, not("rebuild"), { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "accuser" }, { type: "regard", role: "accuser", delta: -1 }],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, { type: "not", of: vouched }] },
      then: [
        { type: "walk-off", role: "accuser", to: "authority" },
        { type: "card", line: "charged", focus: "accuser" },
        { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" },
      ],
    },
    {
      id: "verdict",
      when: { type: "all", of: [{ type: "came" }, { type: "not", of: vouched }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "accuser" }],
    },
    {
      id: "default",
      when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "seize", role: "accuser" }, { type: "regard", role: "official", delta: -2 }],
    },
  ],
  endings: [
    { id: "cleared", when: { type: "all", of: [vouched, not("final")] } },
    { id: "traced", when: { type: "all", of: [{ type: "fired", id: "ashes" }, not("ashes:failed")] } },
    { id: "rebuilt", when: { type: "all", of: [{ type: "fired", id: "rebuild" }, { type: "brought", role: "accuser" }] } },
    { id: "judged", when: { type: "fired", id: "verdict" } },
    { id: "absent", when: { type: "fired", id: "default" } },
    { id: "repaid", when: { type: "settled" } },
    { id: "heard", when: { type: "all", of: [{ type: "came" }, vouched] } },
    { id: "dropped", when: { type: "gone", role: "accuser" } },
  ],
  wording: [
    {
      // Augustus set up the vigiles in 6 CE to patrol Rome at night against fire; a careless householder could be beaten for it.
      scope: { years: [6, 450], bounds: ITALY },
      title: "Fire in the Night",
      lines: {
        aim: "Get {witness} to say where the fire started, or pay {accuser} for the damage, {due}.",
        intro: "Last night a fire took {accuser}'s {lost} before the vigiles, the night watch, put it out. {accuser} the {accuserRole} says it started at your hearth.",
        threat: "The vigiles can have someone flogged for carelessness with fire, and {accuser} means to tell {authority}.",
        partner: "Your {partnerKin} {partner} swears your hearth was out before dark.",
        "kin-partner": "{witness} was up last night. Ask what {witness} saw.",
        "cast-accuser": "Lost {his} {lost} in the fire, and blames your hearth.",
        "cast-witness": "Was awake when the fire started, and people will believe what {witness} saw.",
        accuse: "Your fire did this. I want {amount} for it, {due}, or I go to {authority}.",
        talk: "The neighbours are asking each other whose fire it was, and looking at your door.",
        cleared: "{witness} says the fire started in the street, not in your house. {accuser} has no more to say.",
        repaid: "You pay {accuser} for the damage. It's over, though some people will think it means it was your fire.",
        charged: "{accuser} has gone to {authority}. You'll have to answer for the fire.",
        dropped: "With {accuser} gone, nobody asks about the fire any more.",
      },
    },
    {
      // Edo burned again and again; neighbourhoods kept their own firefighters after 1720 and pulled houses down to stop a fire spreading.
      scope: { years: [1603, 1868], bounds: JAPAN },
      title: "Fire in the Night",
      lines: {
        aim: "Get {witness} to say where the fire started, or pay {accuser} for the damage, {due}.",
        intro: "Last night the neighbourhood's firefighters pulled down {accuser}'s {lost} to stop a fire spreading. {accuser} the {accuserRole} says the fire started at your hearth.",
        threat: "Starting a fire is a serious crime here, and {accuser} means to report it to {authority}.",
        partner: "Your {partnerKin} {partner} swears your hearth was banked before dark.",
        "kin-partner": "{witness} saw the fire start. Ask {witness}.",
        "cast-accuser": "Lost {his} {lost} in the fire, and blames your hearth.",
        "cast-witness": "Saw where the fire started, and the neighbourhood will believe {witness}.",
        accuse: "Your fire did this. I want {amount} for it, {due}, or I go to {authority}.",
        talk: "The neighbourhood association is asking whose fire it was, and people are looking at your house.",
        cleared: "{witness} says the fire started further down the lane. {accuser} apologises, stiffly.",
        repaid: "You pay {accuser}, and {his} house goes back up. Some people will think it was your fire.",
        charged: "{accuser} has gone to {authority}. You'll have to answer for the fire.",
        dropped: "With {accuser} gone, nobody asks about the fire any more.",
      },
    },
    {
      // Song Kaifeng and Hangzhou had fire towers with soldiers on watch in every ward.
      scope: { years: [960, 1279], bounds: CHINA },
      title: "Fire in the Night",
      lines: {
        aim: "Get {witness} to say where the fire started, or pay {accuser} for the damage, {due}.",
        intro: "Last night the soldiers from the fire tower put out a fire that took {accuser}'s {lost}. {accuser} the {accuserRole} says it started at your stove.",
        threat: "{accuser} means to take it to {authority}, and the law punishes carelessness with fire.",
        partner: "Your {partnerKin} {partner} swears the stove was cold before dark.",
        "kin-partner": "{witness} saw the fire start. Ask {witness}.",
        "cast-accuser": "Lost {his} {lost} in the fire, and blames your stove.",
        "cast-witness": "Saw where the fire started, and the ward will believe {witness}.",
        accuse: "Your fire did this. I want {amount} for it, {due}, or I go to {authority}.",
        talk: "The neighbours are talking about whose fire it was, and looking at your door.",
        cleared: "{witness} says the fire started in the lane, not at your stove. {accuser} lets it go.",
        repaid: "You pay {accuser} for the damage. Some people will think it means it was your fire.",
        charged: "{accuser} has gone to {authority}. You'll have to answer for the fire.",
        dropped: "With {accuser} gone, nobody asks about the fire any more.",
      },
    },
    {
      // London's householders had to cover their fires at the evening bell and keep a ladder and a barrel of water ready.
      scope: { years: [1189, 1700], bounds: BRITAIN },
      title: "Fire in the Night",
      lines: {
        aim: "Get {witness} to say where the fire started, or pay {accuser} for the damage, {due}.",
        intro: "Last night a fire took {accuser}'s {lost}. {accuser} the {accuserRole} says you didn't cover your fire at the curfew bell, and that it started at your hearth.",
        threat: "{accuser} means to take it to {authority}, and leaving a fire uncovered at night is against the town's rules.",
        partner: "Your {partnerKin} {partner} swears the fire was covered at the bell.",
        "kin-partner": "{witness} was out with the buckets. Ask what {witness} saw.",
        "cast-accuser": "Lost {his} {lost} in the fire, and blames your hearth.",
        "cast-witness": "Was at the fire with the buckets, and people will believe what {witness} saw.",
        accuse: "Your fire did this. I want {amount} for it, {due}, or I go to {authority}.",
        talk: "The neighbours are asking each other whose fire it was, and looking at your door.",
        cleared: "{witness} says the fire started somewhere else. {accuser} has no more to say.",
        repaid: "You pay {accuser} for the damage. Some people will think it means it was your fire.",
        charged: "{accuser} has gone to {authority}. You'll have to answer for the fire.",
        dropped: "With {accuser} gone, nobody asks about the fire any more.",
      },
    },
    {
      title: "Fire in the Night",
      lines: {
        aim: "Get {witness} to say where the fire started, or pay {accuser} for the damage, {due}.",
        intro: "Last night a fire took {accuser}'s {lost}. {accuser} the {accuserRole} says it started at your hearth.",
        threat: "If you don't pay, {he} will go to {authority}.",
        partner: "Your {partnerKin} {partner} swears your fire was out before dark.",
        "kin-partner": "{witness} saw the fire start. Ask {witness}.",
        "cast-accuser": "Lost {his} {lost} in the fire, and blames your hearth.",
        "cast-witness": "Saw where the fire started, and people will believe {witness}.",
        accuse: "Your fire did this. I want {amount} for it, {due}, or I go to {authority}.",
        talk: "The neighbours are asking each other whose fire it was, and looking at your door.",
        cleared: "{witness} says the fire started somewhere else. {accuser} has no more to say.",
        repaid: "You pay {accuser} for the damage. Some people will think it means it was your fire.",
        charged: "{accuser} has gone to {authority}. You'll have to answer for the fire.",
        dropped: "With {accuser} gone, nobody asks about the fire any more.",
        hearing: "At the hearing before {authority}",
        "aim-hearing": "Answer for the fire before {authority} {meet}. Get {witness} to say where it started first.",
        heard: "{accuser} tells how the fire spread. Then {witness} says it didn't start at your house, and you're cleared.",
        answer: "{accuser} is standing in the ashes of {his} {lost}, telling everyone it was your fire. What do you do?",
        "ask:label": "Ask {witness} what they saw",
        "ask:failed": "{witness} saw the flames, but not where they started.",
        "ashes:label": "Go through the ashes and find where it began",
        "ashes:then": "You pick through the wet ashes with a stick, while the neighbours watch.",
        "ashes:failed": "It's all black, and you can't tell one end of it from the other.",
        "rebuild:label": "Offer to help rebuild",
        "rebuild:then": "{accuser} looks at you a long time, then says {he} will take the work. Do the day's work, then come and help.",
        "pay:label": "Pay {amount} from the store for the damage",
        traced: "The worst of the burning is on the far side, by the lane, nowhere near your wall. You show the neighbours, and {accuser} has nothing to say.",
        rebuilt: "You spend the evening with {accuser}, carrying timber and clearing the black mess. Neither of you says whose fire it was, and {he} doesn't ask for money again.",
        judged: "{accuser} tells how the fire spread, and nobody says otherwise. The hearing goes against you: {amount} is to be taken from your house to pay for the damage.",
        absent: "You didn't come to answer for the fire, so it was decided without you. {amount} is to be taken from your house to pay for the damage.",
      },
    },
  ],
};
