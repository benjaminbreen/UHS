import { random } from "../../core/random";
import { ruled } from "../history/order";
import { amountOf, dueOf, elderOf, fillIn, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotTemplate } from "./types";

/** A neighbour blames your ill will for a sickness in their house. In small
 * communities without courts, misfortune is often explained by someone's
 * envy or anger, and settled by an elder's word or by gifts. */
export const sorcery: PlotTemplate = {
  id: "sorcery",
  look: {
    emblem: "accused",
    palette: { ink: "#120f1a", fill: "#1f1a2c", edge: "#4a3a6e", light: "#e6e0f0", accent: "#8a6ad0" },
  },
  payee: "accuser",
  weight: (c) => (c.setting && !ruled(c.setting) && neighbours(c).length >= 3 && elderOf(c) ? 0.5 : 0),
  cast: (c) => {
    const elder = elderOf(c);
    const others = neighbours(c).filter((a) => a.id !== elder?.id && a.householdId !== elder?.householdId && (a.age ?? 30) < 50);
    const accuser = others.length ? pickOf(c, others, "sorcery-accuser") : undefined;
    return accuser && elder && { accuser, elder };
  },
  begin: (c, cast) => {
    const accuser = cast.accuser!, elder = cast.elder!;
    const owed = 2 + Math.floor(random(c.seed, "plot", "sorcery", "owed") * 3);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const pr = pronounWords(accuser);
    return {
      deadline,
      owed,
      words: {
        accuser: accuser.name,
        accuserRole: accuser.role.toLowerCase(),
        elder: elder.name,
        amount: amountOf(c, owed),
        due,
        sick: fillIn(pickOf(c, ["{his} child", "{his} mother", "{his} sister", "{his} youngest"], "sorcery-sick"), pr),
        quarrel: fillIn(pickOf(c, [
          "you argued over a dog that killed {his} hens",
          "you refused {him} a share of your catch",
          "you laughed at {him} at the last gathering",
          "{he} asked your household for help and was turned away",
        ], "sorcery-quarrel"), pr),
        ...pr,
        ...p.words,
      },
      refs: { accuser: accuser.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "accuser", line: "accuse" }],
  developments: [
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: { type: "talked", role: "elder" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "accuser" }],
    },
    {
      id: "final",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "talked", role: "elder" } }] },
      then: [{ type: "walk-off", role: "accuser", to: "authority" }],
    },
  ],
  endings: [
    { id: "cleared", when: { type: "talked", role: "elder" } },
    { id: "appeased", when: { type: "settled" } },
    { id: "blamed", when: { type: "fired", id: "final" } },
    { id: "dropped", when: { type: "gone", role: "accuser" } },
  ],
  wording: [
    {
      title: "Blamed for a Sickness",
      lines: {
        aim: "Get {elder} to speak for you, or give {accuser} gifts to make peace, {due}.",
        intro: "{accuser} the {accuserRole} says the sickness in {sick} began the day {quarrel}, and that your anger caused it.",
        threat: "If nobody stands up for you, {he} will take it to {authority}, and a household blamed for sickness can be made to leave.",
        partner: "Your {partnerKin} {partner} has stopped going to the water when {accuser}'s people are there.",
        "kin-partner": "Go and see {elder}. People still listen to {elder}.",
        "cast-accuser": "Blames your household for the sickness in {his} house.",
        "cast-elder": "The oldest here. If {elder} says you meant no harm, people will believe it.",
        accuse: "Since that day, the sickness hasn't left my house. Give me {amount} to put it right, {due}, or everyone will know who did this.",
        talk: "Mothers call their children in when you walk past.",
        cleared: "{elder} says publicly that you meant no harm and that the sickness came from somewhere else. {accuser} has nothing more to say.",
        appeased: "You give {accuser} gifts, and the two households eat together. The sickness isn't mentioned again.",
        blamed: "{accuser} has gone to {authority}. Your household will have to answer for the sickness.",
        dropped: "With {accuser} gone, people stop talking about it.",
      },
    },
  ],
};
