import { random } from "../../core/random";
import { ruled } from "../history/order";
import { amountOf, dueOf, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const giverOf = (c: PlotContext) => {
  const richer = c.households.filter((h) => h.id !== c.player.householdId && (h.fortune ?? 0.5) > (c.household?.fortune ?? 0.5));
  const pool = neighbours(c).filter((a) => (a.age ?? 30) >= 30 && richer.some((h) => h.members.includes(a.id)));
  return pool.length ? pickOf(c, pool, "giver") : undefined;
};

/** Where nobody rules, help in a hard season is not a loan but a gift, and a
 * gift has to be returned. Mauss's argument, and what ethnography of
 * small farming and foraging communities keeps finding. */
export const gift: PlotTemplate = {
  id: "gift",
  look: {
    emblem: "feast",
    palette: { ink: "#12160f", fill: "#202a1a", edge: "#55602e", light: "#ecebd2", accent: "#9aaa3a" },
  },
  payee: "giver",
  weight: (c) => (c.setting && !ruled(c.setting) && giverOf(c) ? ((c.household?.fortune ?? 0.5) < 0.6 ? 0.55 : 0.35) : 0),
  cast: (c) => {
    const giver = giverOf(c);
    return giver && { giver };
  },
  begin: (c, cast) => {
    const giver = cast.giver!;
    const owed = 3 + Math.floor(random(c.seed, "plot", "gift", "owed") * 4);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        giver: giver.name,
        giverRole: giver.role.toLowerCase(),
        amount: amountOf(c, owed),
        due,
        gave: pickOf(c, [
          "fed your household through the hungry weeks before the harvest",
          "gave your household seed when yours had rotted in the pit",
          "shared the meat of a kill with your household when you had nothing",
          "took in your household's children when the house burned",
        ], "gift-gave"),
        need: pickOf(c, [
          "has a marriage to provide for",
          "has lost a store of food to the damp",
          "is short after a poor season",
          "has guests coming from another village",
        ], "gift-need"),
        ...pronounWords(giver),
        ...p.words,
      },
      refs: { giver: giver.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "giver", line: "ask" }],
  developments: [
    {
      id: "talk",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "talk", focus: "giver" }, { type: "regard", role: "giver", delta: -1 }],
    },
  ],
  endings: [
    { id: "returned", when: { type: "settled" } },
    { id: "gone", when: { type: "gone", role: "giver" } },
    { id: "shamed", when: { type: "due" } },
  ],
  wording: [
    {
      title: "A Gift to Return",
      lines: {
        aim: "Return {giver}'s gift, {due}.",
        intro: "Last year {giver} the {giverRole} {gave}. Nobody called it a loan. Now {he} {need}, and everyone knows what your household owes.",
        threat: "A household that takes and never gives back will find nobody helps it the next time.",
        partner: "Your {partnerKin} {partner} says you can't look {giver} in the eye until it's done.",
        "kin-partner": "{giver} helped us when nobody else would. What are we giving back?",
        "cast-giver": "Helped your household in a hard season, and is waiting to be helped in turn.",
        ask: "I'm not asking for anything. But you know how things are with us now. {amount} would go a long way.",
        talk: "People have noticed you haven't been to {giver}'s. They are starting to talk about it.",
        returned: "You bring {giver} more than {he} gave. Now {his} household owes yours, which is how it should be.",
        gone: "With {giver} gone, the gift can't be returned. You'll pass it on to {his} kin when you can.",
        shamed: "You gave nothing back. {giver} says nothing about it, but everyone else does.",
      },
    },
  ],
};
