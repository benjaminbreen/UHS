import type { ChoiceCard } from "./types";

export const BAKER_CARDS: ChoiceCard[] = [
  {
    id: "bake-damp-flour",
    slot: "bake-dough",
    evidence: "inferred",
    text: "One corner of the new sack of flour got damp and smells musty. Bread made with it may come out sour and heavy, and customers will notice.",
    choices: [
      {
        label: "Sift out the bad flour",
        note: "an hour's slow work, and a little less bread",
        then: [{ type: "minutes", n: 60 }, { type: "fatigue", n: 5 }],
        line: "You sifted out the bad flour. It took an hour, but the dough was sound.",
      },
      {
        label: "Use all of it",
        note: "more loaves if it works · the batch may be spoiled",
        check: { stat: "wit", skill: "crafting", odds: 0.5 },
        then: [{ type: "day", delta: 1 }],
        line: "You used all the flour, and the bread rose well enough.",
        otherwise: [{ type: "day", delta: -2 }],
        otherwiseLine: "You used all the flour. The bread came out sour and heavy, and it was hard to sell.",
      },
      {
        label: "Buy a fresh sack",
        note: "costs a coin, but the bread is safe",
        then: [{ type: "item", item: "coin", n: -1 }],
        line: "You bought a fresh sack from the miller and kept the damp one for the pigs.",
      },
    ],
  },
  {
    id: "bake-hot-oven",
    slot: "bake-oven",
    evidence: "inferred",
    text: "The oven floor is still too hot from last night’s fire. Bread put in now could burn on the bottom before the inside is baked.",
    choices: [
      {
        label: "Load it now and watch closely",
        note: "saves time · the loaves may burn",
        check: { stat: "agility", skill: "crafting", odds: 0.55 },
        then: [{ type: "day", delta: 1 }],
        line: "You loaded at once and drew the loaves just right.",
        otherwise: [{ type: "day", delta: -1 }],
        otherwiseLine: "The bottoms burned before you could draw them.",
      },
      {
        label: "Wait for it to cool",
        note: "loses most of an hour",
        then: [{ type: "minutes", n: 45 }],
        line: "You let the oven cool before you loaded it.",
      },
      {
        label: "Mop the floor with a wet cloth",
        note: "quicker than waiting · hot, tiring work",
        then: [{ type: "minutes", n: 15 }, { type: "fatigue", n: 10 }],
        line: "You mopped the oven floor with a wet cloth to cool it, then loaded it.",
      },
    ],
  },
  {
    id: "bake-assize",
    slot: "bake-sell",
    who: "official",
    as: "inspector",
    // The Assize of Bread set loaf weight against the price of grain from 1266;
    // French police did the same until bread was freed in 1863.
    scope: { years: [1266, 1863], bounds: [-11, 36, 20, 59] },
    evidence: "documented",
    text: "The town inspector is coming down the street with his scales. The law fixes how much a loaf must weigh at this week’s grain price, and bakers who sell light loaves are fined.",
    choices: [
      {
        label: "Sell full-weight loaves",
        note: "ordinary takings, no risk",
        then: [],
        line: "Your loaves were full weight, and the inspector moved on.",
      },
      {
        label: "Sell the loaves a little light",
        note: "more money · a fine if he weighs yours",
        check: { stat: "agility", odds: 0.5 },
        then: [{ type: "pay", delta: 2 }],
        line: "You sold light loaves, and the inspector never weighed yours.",
        otherwise: [{ type: "pay", delta: -3 }, { type: "regard", delta: -1 }],
        otherwiseLine: "The inspector weighed your loaves, found them light, and fined you.",
      },
      {
        label: "Give your burnt loaves to the poor",
        note: "a little less money · people think better of you",
        then: [{ type: "pay", delta: -1 }, { type: "regard", delta: 1 }],
        line: "You gave your burnt loaves to the poor while the inspector watched.",
      },
    ],
  },
  {
    id: "bake-credit",
    slot: "bake-sell",
    who: "neighbour",
    evidence: "inferred",
    text: "“Could I have two loaves and pay you at the end of the week?” {name} asks. “The children haven’t eaten.” Plenty of people who buy on credit never pay.",
    choices: [
      {
        label: "Give them on credit",
        note: "you may never see the money · {name} won't forget it",
        then: [{ type: "pay", delta: -2 }, { type: "regard", delta: 2 }],
        line: "You let {name} have the bread on credit.",
      },
      {
        label: "Give one loaf",
        note: "costs you a loaf · some thanks",
        then: [{ type: "pay", delta: -1 }, { type: "regard", delta: 1 }],
        line: "You gave {name} one loaf and no more.",
      },
      {
        label: "Say no",
        note: "keeps your money · {name} will resent it",
        then: [{ type: "regard", delta: -1 }],
        line: "You refused {name} credit.",
      },
    ],
  },
];
