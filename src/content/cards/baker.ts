import type { ChoiceCard } from "./types";

export const BAKER_CARDS: ChoiceCard[] = [
  {
    id: "bake-damp-flour",
    slot: "bake-dough",
    evidence: "inferred",
    text: "The flour from the mill is damp at one corner of the sack, and it smells of it.",
    choices: [
      {
        label: "Sift out the spoiled flour",
        then: [{ type: "minutes", n: 60 }],
        line: "You sifted out the spoiled flour. An hour gone, but the dough was sound.",
      },
      {
        label: "Use it all",
        note: "more loaves",
        check: { stat: "wit", skill: "crafting", odds: 0.5 },
        then: [{ type: "day", delta: 1 }],
        line: "You used it all, and the bread rose well enough.",
        otherwise: [{ type: "day", delta: -2 }],
        otherwiseLine: "You used it all. The bread came out sour and heavy.",
      },
      {
        label: "Buy a fresh sack",
        then: [{ type: "item", item: "coin", n: -1 }, { type: "day", delta: 1 }],
        line: "You bought a fresh sack from the miller.",
      },
    ],
  },
  {
    id: "bake-hot-oven",
    slot: "bake-oven",
    evidence: "inferred",
    text: "The oven floor is hotter than it should be after last night’s firing.",
    choices: [
      {
        label: "Load it now",
        check: { stat: "agility", skill: "crafting", odds: 0.55 },
        then: [{ type: "day", delta: 1 }],
        line: "You loaded at once and drew the loaves just right.",
        otherwise: [{ type: "day", delta: -1 }],
        otherwiseLine: "The bottoms burned before you could draw them.",
      },
      {
        label: "Let it cool a while",
        then: [{ type: "minutes", n: 30 }],
        line: "You let the oven cool before you loaded it.",
      },
      {
        label: "Swab the floor with a wet mop",
        note: "the baker’s way",
        then: [{ type: "minutes", n: 15 }, { type: "fatigue", n: 5 }],
        line: "You swabbed the oven floor with a wet mop and loaded it.",
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
    text: "The inspector is working down the street with his scales, weighing loaves against the price of grain.",
    choices: [
      {
        label: "Sell at full weight",
        then: [],
        line: "Your loaves were full weight, and the inspector moved on.",
      },
      {
        label: "Shave the loaves",
        note: "more takings",
        check: { stat: "agility", odds: 0.5 },
        then: [{ type: "pay", delta: 2 }],
        line: "You sold light loaves, and the inspector never weighed yours.",
        otherwise: [{ type: "pay", delta: -3 }, { type: "regard", delta: -1 }],
        otherwiseLine: "The inspector weighed your loaves, found them light, and fined you.",
      },
      {
        label: "Give the burnt loaves to the poor",
        note: "goodwill",
        then: [{ type: "pay", delta: -1 }, { type: "regard", delta: 1 }],
        line: "You gave the burnt loaves to the poor under the inspector’s eye.",
      },
    ],
  },
  {
    id: "bake-credit",
    slot: "bake-sell",
    who: "neighbour",
    evidence: "inferred",
    text: "“Two loaves until the end of the week?” {name} asks. “The children haven’t eaten.”",
    choices: [
      {
        label: "Give them on credit",
        note: "goodwill · less takings",
        then: [{ type: "pay", delta: -1 }, { type: "regard", delta: 2 }],
        line: "You let {name} have the bread on credit.",
      },
      {
        label: "Give one loaf",
        then: [{ type: "regard", delta: 1 }],
        line: "You gave {name} one loaf and no more.",
      },
      {
        label: "Refuse",
        note: "cash only",
        then: [{ type: "regard", delta: -1 }],
        line: "You refused {name} credit.",
      },
    ],
  },
];
