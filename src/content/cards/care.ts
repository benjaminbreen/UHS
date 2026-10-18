import type { ChoiceCard } from "./types";

// What could be done for the sick, with honest odds: before germ theory a
// healer's fee bought care and not a cure, and most of what was tried did
// little. `tend` is the chance it turns an illness that would have killed.
const self = (id: string, years: [number, number], healer: number, fee: number): ChoiceCard => ({
  id,
  slot: "care-self",
  scope: { years },
  text: "You are ill with {ailment}. You feel dizzy and weak, and it is hard to stand. Some people who get this badly do not recover.",
  evidence: "inferred",
  choices: [
    {
      label: "Send for the {healer}",
      note: "costs a fee · the best chance there is",
      then: [{ type: "item", item: "coin", n: -fee }, { type: "minutes", n: 60 }, { type: "tend", odds: healer }],
      line: "The {healer} came, did what they could, and took the fee.",
    },
    {
      label: "Go to bed and rest",
      note: "lose the day's work · you get your strength back",
      then: [{ type: "sleep", n: 600 }, { type: "fatigue", n: -40 }, { type: "tend", odds: 0.15 }],
      line: "You stayed in bed and let the household carry on without you.",
    },
    {
      label: "Take the family's home remedy",
      note: "free and quick · it may not help much",
      then: [{ type: "minutes", n: 30 }, { type: "tend", odds: 0.08 }],
      line: "You took the family’s home remedy: a herbal drink, a hot poultice, a charm.",
    },
    {
      label: "Pray to get better",
      note: "a short prayer, then back to work · little else done",
      then: [{ type: "minutes", n: 15 }, { type: "tend", odds: 0.05 }],
      line: "You prayed to get better and made promises if you recovered.",
    },
    { label: "Keep working", note: "the work gets done · exhausting, and nothing helps you mend", then: [{ type: "fatigue", n: 20 }], line: "You kept working, ill as you were." },
  ],
});

const kin = (id: string, years: [number, number], healer: number, fee: number): ChoiceCard => ({
  id,
  slot: "care-kin",
  who: "patient",
  scope: { years },
  text: "{Name} is ill with {ailment} and is asking for you. Being looked after can make the difference between getting better and not.",
  evidence: "inferred",
  choices: [
    {
      label: "Stay and look after {name}",
      note: "takes half the day · {name} will remember it",
      then: [{ type: "minutes", n: 240 }, { type: "tend", odds: 0.3 }, { type: "regard", delta: 2 }],
      line: "You stayed with {name} through the worst of it.",
    },
    {
      label: "Pay for the {healer}",
      note: "costs a fee · a better chance than you alone",
      then: [{ type: "item", item: "coin", n: -fee }, { type: "tend", odds: healer }, { type: "regard", delta: 1 }],
      line: "You sent for the {healer} to see to {name}.",
    },
    {
      label: "Leave {name} to the rest of the family",
      note: "no time or money lost · {name} will be hurt by it",
      then: [{ type: "regard", delta: -1 }],
      line: "You left {name} to the rest of the family.",
    },
  ],
});

export const careCards: ChoiceCard[] = [
  self("care-self", [-100000, 1880], 0.2, 2),
  self("care-self-doctor", [1880, 1945], 0.35, 3),
  self("care-self-antibiotics", [1945, 10000], 0.75, 3),
  kin("care-kin", [-100000, 1880], 0.25, 2),
  kin("care-kin-doctor", [1880, 1945], 0.35, 3),
  kin("care-kin-antibiotics", [1945, 10000], 0.75, 3),
];
