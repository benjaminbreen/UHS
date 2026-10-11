import type { ChoiceCard } from "./types";

export const HEALER_CARDS: ChoiceCard[] = [
  {
    id: "heal-fever",
    slot: "heal-visit",
    who: "patient",
    evidence: "inferred",
    text: "{name} has been ill for days and will not eat. The family watches you from the door.",
    choices: [
      {
        label: "Keep them cool and drinking",
        check: { stat: "wit", skill: "foraging", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "tend", odds: 0.4 }],
        line: "You kept {name} cool and drinking, and the fever eased a little.",
        otherwise: [{ type: "tend", odds: 0.2 }],
        otherwiseLine: "You kept {name} cool and drinking, but the fever held.",
      },
      {
        label: "Give a strong remedy",
        note: "it may help or harm",
        check: { stat: "wit", skill: "foraging", odds: 0.4 },
        then: [{ type: "day", delta: 2 }, { type: "tend", odds: 0.6 }],
        line: "Your remedy broke the fever.",
        otherwise: [{ type: "day", delta: -1 }, { type: "regard", delta: -2 }],
        otherwiseLine: "Your remedy made {name} worse, and the family saw it.",
      },
      {
        label: "Pray over them",
        note: "comfort",
        then: [{ type: "regard", delta: 1 }, { type: "tend", odds: 0.1 }],
        line: "You prayed over {name}, and the family took comfort.",
      },
    ],
  },
  {
    id: "heal-fee",
    slot: "heal-fee",
    who: "patient",
    evidence: "inferred",
    text: "The household has little to pay you with: a hen, a few eggs, their thanks.",
    choices: [
      {
        label: "Take what they offer",
        then: [],
        line: "You took what the household could give.",
      },
      {
        label: "Take nothing",
        note: "goodwill",
        then: [{ type: "pay", delta: -9 }, { type: "regard", delta: 2 }],
        line: "You would take nothing from them.",
      },
      {
        label: "Ask for your fee in full",
        then: [{ type: "pay", delta: 1 }, { type: "regard", delta: -1 }],
        line: "You asked for your fee in full, and got it, grudgingly.",
      },
    ],
  },
];
