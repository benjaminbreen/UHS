import type { ChoiceCard } from "./types";

// What could be done for the sick, with honest odds: before germ theory a
// healer's fee bought care and not a cure, and most of what was tried did
// little. `tend` is the chance it turns an illness that would have killed.
const self = (id: string, years: [number, number], healer: number, fee: number): ChoiceCard => ({
  id,
  slot: "care-self",
  scope: { years },
  text: "{Ailment} has hold of you. Your head swims and your legs will hardly carry you.",
  evidence: "inferred",
  choices: [
    {
      label: "Send for the {healer}",
      then: [{ type: "item", item: "coin", n: -fee }, { type: "minutes", n: 60 }, { type: "tend", odds: healer }],
      line: "The {healer} came, did what could be done, and took the fee.",
    },
    {
      label: "Lie up and let it run",
      note: "the day's work",
      then: [{ type: "minutes", n: 600 }, { type: "fatigue", n: -40 }, { type: "tend", odds: 0.15 }],
      line: "You lay up and let the household carry on without you.",
    },
    {
      label: "Take what the household gives for it",
      then: [{ type: "minutes", n: 30 }, { type: "tend", odds: 0.08 }],
      line: "You took what the household gave for it: a draught, a poultice, a charm.",
    },
    {
      label: "Pray, and promise much",
      then: [{ type: "minutes", n: 30 }, { type: "tend", odds: 0.05 }],
      line: "You prayed, and promised much if you were spared.",
    },
    { label: "Keep going", then: [], line: "You kept going, ill as you were." },
  ],
});

const kin = (id: string, years: [number, number], healer: number, fee: number): ChoiceCard => ({
  id,
  slot: "care-kin",
  who: "patient",
  scope: { years },
  text: "{Name} is down with {ailment} and asking for you.",
  evidence: "inferred",
  choices: [
    {
      label: "Sit with {name}",
      note: "half the day",
      then: [{ type: "minutes", n: 240 }, { type: "tend", odds: 0.3 }, { type: "regard", delta: 2 }],
      line: "You sat with {name} through the worst of it.",
    },
    {
      label: "Send for the {healer}",
      then: [{ type: "item", item: "coin", n: -fee }, { type: "tend", odds: healer }, { type: "regard", delta: 1 }],
      line: "You sent for the {healer} to see to {name}.",
    },
    {
      label: "Leave {name} to the others",
      then: [{ type: "regard", delta: -1 }],
      line: "You left {name} to the rest of the household.",
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
