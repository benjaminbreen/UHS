import { random } from "../../core/random";
import { ruled } from "../history/order";
import { amountOf, BRITAIN, CHINA, dueOf, ITALY, JAPAN, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotTemplate } from "./types";

/** A fire got into a neighbour's house, and they say it started at yours. */
export const fire: PlotTemplate = {
  id: "fire",
  look: {
    emblem: "accused",
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
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: { type: "talked", role: "witness" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "accuser" }, { type: "regard", role: "accuser", delta: -1 }],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "talked", role: "witness" } }] },
      then: [{ type: "walk-off", role: "accuser", to: "authority" }],
    },
  ],
  endings: [
    { id: "cleared", when: { type: "talked", role: "witness" } },
    { id: "repaid", when: { type: "settled" } },
    { id: "charged", when: { type: "fired", id: "final" } },
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
      },
    },
  ],
};
