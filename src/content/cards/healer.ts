import type { ChoiceCard } from "./types";

export const HEALER_CARDS: ChoiceCard[] = [
  {
    id: "heal-fever",
    slot: "heal-visit",
    who: "patient",
    evidence: "inferred",
    text: "{name} has had a fever for days and won’t eat. The family is watching you from the doorway, hoping you can help.",
    choices: [
      {
        label: "Keep them cool and get them drinking",
        note: "gentle and safe · it may not be enough",
        check: { stat: "wit", skill: "foraging", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "tend", odds: 0.4 }],
        line: "You kept {name} cool and got them drinking, and the fever eased a little.",
        otherwise: [{ type: "tend", odds: 0.2 }],
        otherwiseLine: "You kept {name} cool and got them drinking, but the fever did not break.",
      },
      {
        label: "Give a strong medicine",
        note: "it could cure them or make them worse",
        check: { stat: "wit", skill: "foraging", odds: 0.4 },
        then: [{ type: "day", delta: 2 }, { type: "tend", odds: 0.6 }],
        line: "Your medicine broke the fever.",
        otherwise: [{ type: "day", delta: -1 }, { type: "regard", delta: -2 }],
        otherwiseLine: "Your medicine made {name} worse, and the family saw it.",
      },
      {
        label: "Pray with them",
        note: "comforts the family · does little for the fever",
        then: [{ type: "minutes", n: 30 }, { type: "regard", delta: 1 }, { type: "tend", odds: 0.1 }],
        line: "You prayed with {name}, and the family found it comforting.",
      },
    ],
  },
  {
    id: "heal-fee",
    slot: "heal-fee",
    who: "patient",
    evidence: "inferred",
    text: "The family has almost no money. They offer you a hen and a few eggs instead of your fee.",
    choices: [
      {
        label: "Take the hen and eggs",
        note: "less than your fee, but fair",
        then: [{ type: "pay", delta: -3 }],
        line: "You took the hen and eggs instead of your fee.",
      },
      {
        label: "Take nothing",
        note: "no pay for today's visit · they'll be grateful",
        then: [{ type: "pay", delta: -6 }, { type: "regard", delta: 2 }],
        line: "You refused to take anything from them.",
      },
      {
        label: "Ask for your full fee",
        note: "you get paid · they'll resent it",
        then: [{ type: "regard", delta: -1 }],
        line: "You asked for your full fee, and they paid it, unhappily.",
      },
    ],
  },
];
