import { livelihoodById } from "../characters/livelihoods";
import { pieceOf, recipeFor } from "../economy/recipes";
import { random } from "../../core/random";
import { ruled } from "../history/order";
import { dueOf, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const pieceFor = (c: PlotContext) => {
  const kit = livelihoodById(c.player.origin?.livelihood ?? "");
  const recipe = kit && recipeFor(kit);
  return c.setting && pieceOf(recipe, "spring", { pick: 0, year: c.setting.year, lon: c.setting.lon, lat: c.setting.lat },
    random(c.seed, "plot", "commission", "piece"));
};

const any = (...of: Condition[]): Condition => ({ type: "not", of: { type: "all", of: of.map((c) => ({ type: "not", of: c })) } });
const fired = (id: string): Condition => ({ type: "fired", id });
const brought: Condition = { type: "brought", role: "patron" };

/** Someone of standing wants a piece of your work for an occasion, and
 * halfway through changes what they want. */
export const commission: PlotTemplate = {
  id: "commission",
  shape: "work",
  look: {
    emblem: "bench",
    palette: { ink: "#14110a", fill: "#2c2416", edge: "#7a6030", light: "#f0e8d2", accent: "#e8b444" },
  },
  weight: (c) => (pieceFor(c) && notable(c) ? 0.6 : 0),
  cast: (c) => {
    const patron = notable(c);
    return patron && { patron };
  },
  begin: (c, cast) => {
    const patron = cast.patron!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const stateless = !ruled(c.setting);
    return {
      deadline,
      words: {
        patron: patron.name,
        patronRole: patron.role.toLowerCase(),
        due,
        piece: pieceFor(c)!,
        occasion: pickOf(c, stateless
          ? ["a daughter's wedding", "the burial of an old man of the household", "guests coming from another village", "the midwinter gathering"]
          : ["a daughter's wedding", "a visit from someone important", "the festival", "a gift to someone above them"], "commission-occasion"),
        change: pickOf(c, ["bigger than the one agreed", "in a different pattern from the one agreed", "with the family's mark worked into it"], "commission-change"),
        ...pronounWords(patron),
        ...p.words,
      },
      refs: { patron: patron.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "patron", line: "order" }],
  developments: [
    {
      id: "change",
      when: { type: "all", of: [{ type: "since", hours: 0.5 }, { type: "not", of: fired("worked") }] },
      then: [{ type: "choose", line: "change", focus: "patron", choices: [{ id: "agree", check: { stat: "endurance", skill: "crafting", odds: 0.55 } }, { id: "refuse" }, { id: "price", check: { stat: "extraversion", skill: "trade", odds: 0.45 } }] }],
    },
    { id: "ready", when: { type: "all", of: [fired("worked"), { type: "not", of: brought }] }, then: [{ type: "card", line: "ready", focus: "patron" }] },
    { id: "cooled", when: { type: "all", of: [fired("refuse"), brought] }, then: [{ type: "regard", role: "patron", delta: -1 }] },
    { id: "thanks", when: { type: "all", of: [brought, { type: "not", of: any(fired("refuse"), fired("agree:failed")) }] }, then: [{ type: "regard", role: "patron", delta: 2 }] },
    { id: "late", when: { type: "all", of: [{ type: "due" }, { type: "not", of: brought }] }, then: [{ type: "regard", role: "patron", delta: -2 }] },
  ],
  endings: [
    { id: "withdrawn", when: fired("price:failed") },
    { id: "rushed", when: { type: "all", of: [fired("agree:failed"), brought] } },
    { id: "stiff", when: fired("cooled") },
    { id: "paid", when: { type: "all", of: [fired("price"), fired("thanks")] } },
    { id: "pleased", when: { type: "all", of: [fired("agree"), fired("thanks")] } },
    { id: "delivered", when: fired("thanks") },
    { id: "gone", when: { type: "gone", role: "patron" } },
    { id: "late", when: fired("late") },
  ],
  wording: [
    {
      title: "An Order to Fill",
      lines: {
        aim: "Make {piece} for {patron}, and bring it {due}.",
        intro: "{patron} the {patronRole} wants {piece} for {occasion}, and wants it from you. If it's good, others will order from you too.",
        threat: "If it isn't ready in time, {he} will go to someone else, and so will the people who hear about it.",
        partner: "Your {partnerKin} {partner} says everyone will see your work at {patron}'s.",
        "kin-partner": "Have you finished {patron}'s piece? Everyone will see it.",
        "cast-patron": "Has ordered {piece} for {occasion}.",
        order: "I want {piece} for {occasion}, and I want yours. Can you have it {due}?",
        change: "You're well into it when {patron} sends word: {he} now wants it {change}. Same price, same day.",
        "agree:label": "Do it {his} way",
        "agree:then": "You start again from the point where it changed. It will be a long day.",
        "agree:failed": "You start again, but you can see already that it will be rushed.",
        "refuse:label": "Make it as agreed",
        "refuse:then": "You send word back that it will be as agreed. {He} won't like it.",
        "price:label": "Ask for more for the change",
        "price:then": "{patron} grumbles, but agrees to pay more for it.",
        ready: "The work is done. Take {piece} to {patron}.",
        withdrawn: "{patron} won't haggle over it. {He} has taken the order to someone else, and you're left with half a piece nobody asked for.",
        rushed: "It's done, but it shows the rush. {patron} looks it over for a long time, pays, and says nothing.",
        stiff: "{patron} takes {piece} and pays what was agreed, no more. {He} won't forget that you said no.",
        paid: "{patron} turns {piece} over in {his} hands and pays the higher price without a word. People will ask who made it.",
        pleased: "{patron} turns {piece} over in {his} hands and is delighted. It's exactly what {he} wanted, and people will ask who made it.",
        delivered: "{patron} turns {piece} over in {his} hands and is pleased. People will ask who made it.",
        gone: "With {patron} gone, nobody is waiting for {piece}.",
        late: "The work wasn't ready in time. {patron} has found {piece} somewhere else.",
      },
    },
  ],
};
