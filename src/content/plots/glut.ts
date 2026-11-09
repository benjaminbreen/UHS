import { seasonAt } from "../../core/livelihood";
import { B, dueOf, JAPAN, partnerWords, temper, trade } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const ripe = (c: PlotContext) => !!c.setting && seasonAt(c.setting.season, c.clock) !== "winter";

const fired = (id: string): Condition => ({ type: "fired", id });

/** A stand of food plants is ready all at once, and everyone goes to gather. */
export const glut: PlotTemplate = {
  id: "glut",
  shape: "work",
  look: {
    emblem: "grove",
    palette: { ink: "#11130c", fill: "#2c3a1e", edge: "#6a5232", light: "#eef2e2", accent: "#e0b83a" },
  },
  weight: (c) => (trade(c, /forager|gatherer|root-digger/) && ripe(c) ? 0.8 * temper(c, "endurance") : 0),
  cast: () => ({}),
  begin: (c) => {
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return { deadline, words: { due, ...p.words }, refs: p.refs };
  },
  opening: [],
  developments: [
    {
      id: "heavy",
      when: { type: "since", hours: 1.5 },
      then: [{ type: "choose", line: "heavy", choices: [{ id: "carry" }, { id: "stay" }, { id: "cache", check: { stat: "wit", skill: "foraging", odds: 0.5 } }] }],
    },
    {
      id: "beasts",
      when: { type: "all", of: [fired("stay"), { type: "since", hours: 3 }] },
      then: [{ type: "choose", line: "beasts", choices: [{ id: "shout", check: { stat: "strength", odds: 0.5 } }, { id: "leave" }] }],
    },
  ],
  endings: [
    { id: "carried", when: fired("carry") },
    { id: "cached", when: { type: "all", of: [fired("cache"), { type: "not", of: fired("cache:failed") }] } },
    { id: "raided", when: fired("cache:failed") },
    { id: "full", when: { type: "all", of: [fired("shout"), { type: "not", of: fired("shout:failed") }] } },
    { id: "chased", when: fired("shout:failed") },
    { id: "left", when: fired("leave") },
    { id: "missed", when: { type: "due" } },
  ],
  wording: [
    {
      // Mongongo nuts, which keep for months, were a staple of !Kung foragers in the northern Kalahari.
      scope: { years: [B(50000), 2000], bounds: [15, -30, 30, -15] },
      title: "The Nuts Are Down",
      lines: {
        aim: "Gather mongongo nuts from the grove before the animals get them.",
        intro: "The mongongo fruit has dropped in the grove on the dunes, a long walk away. The nuts inside keep for months, and everyone is going to fill their bags.",
        threat: "The elephants and the baboons know where the grove is too.",
        partner: "Your {partnerKin} {partner} is coming too, with the digging stick and the biggest bag.",
        "kin-partner": "Bring back enough to roast tonight.",
        beasts: "A troop of baboons has come down into the grove, barking, and the big males are working their way towards your pile.",
        "shout:label": "Shout and throw stones at them",
        chased: "A big male comes at you with his teeth bared. You drop the bag and back away, and the troop strips your pile while you watch.",
      },
    },
    {
      // Jomon pit stores of acorns and chestnuts are found by the hundred.
      scope: { years: [B(14000), B(300)], bounds: JAPAN },
      title: "The Acorns Are Down",
      lines: {
        aim: "Gather acorns and chestnuts for the storage pits.",
        intro: "The oaks and chestnut trees have dropped their nuts all at once. Everyone is in the woods with baskets, and the storage pits by the houses are ready to be filled.",
        threat: "What goes into the pits now is what everyone eats in the hungry months.",
        partner: "Your {partnerKin} {partner} is lining the pit with leaves.",
        "kin-partner": "The pit's ready. Fill it.",
        beasts: "A sow and her young have come rooting through the leaves, and she's heading for your heap.",
        "shout:label": "Drive the boar off with a stick",
        chased: "The sow turns on you and you run for a tree. By the time she wanders off, your heap is trampled and half eaten.",
        full: "You fill the basket twice more. The pit by the house is full to the top and covered over. It will last into spring.",
      },
    },
    {
      title: "Everything Is Ripe",
      lines: {
        aim: "Gather as much as you can while it lasts.",
        intro: "A stand of fruit and nuts has ripened all at once, a long walk from camp. Everyone is going out with bags and baskets.",
        threat: "In a few days the birds and animals will have the rest.",
        partner: "Your {partnerKin} {partner} is coming too, with the biggest bag.",
        "kin-partner": "Bring back enough for everyone.",
        heavy: "Your bag is full and the camp is a long walk away. There's still more on the ground than you could carry in three trips.",
        "carry:label": "Carry back what you have",
        "stay:label": "Stay and heap up more",
        "cache:label": "Hide a heap here for tomorrow",
        "cache:then": "You scrape a hollow, fill it, and cover it with branches and sand.",
        beasts: "Animals have come into the grove, and they're working their way towards your heap.",
        "shout:label": "Drive them off",
        "leave:label": "Take what you can carry and go",
        carried: "You walk back with a full bag on your shoulder, in good time. Tonight everyone eats well.",
        cached: "You come back the next morning and the heap is still there under the branches. That's two full loads.",
        raided: "You come back the next morning and the branches are scattered. Something dug the heap out in the night.",
        full: "You drive them off and fill your bag again and again. You get back late, loaded down and very tired.",
        chased: "They don't back off. You drop the bag and get away, and they eat the heap while you watch.",
        left: "You leave the heap to them and walk back with one full bag. Not bad.",
        missed: "You came back with half a bag. The animals will get the rest.",
      },
    },
  ],
};
