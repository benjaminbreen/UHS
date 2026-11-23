import type { ChoiceCard } from "./types";

// A robber's day: most of it waiting, a few minutes of risk, and an argument
// over the share. Takings and odds are gameplay choices.
export const OUTLAW_CARDS: ChoiceCard[] = [
  {
    id: "outlaw-lone-traveller",
    slot: "road-watch",
    evidence: "inferred",
    text: "A lone traveller comes up the road with a loaded pack animal. Nobody else is in sight.",
    choices: [
      {
        label: "Stop them and take what they carry",
        note: "coin · they may fight back",
        check: { stat: "strength", skill: "arms", odds: 0.6 },
        then: [{ type: "item", item: "coin", n: 4 }, { type: "minutes", n: 20 }],
        line: "You stopped a traveller and took their money.",
        otherwise: [{ type: "hurt", n: 15, cause: "a traveller who fought back", injury: "split-lip" }, { type: "minutes", n: 30 }],
        otherwiseLine: "The traveller fought back, and you came off worse.",
      },
      { label: "Let them pass and wait for a better chance", note: "safe · nothing yet", then: [{ type: "minutes", n: 60 }], line: "You let a traveller go by and kept watching the road." },
    ],
  },
  {
    id: "outlaw-armed-party",
    slot: "road-watch",
    evidence: "inferred",
    text: "A party of merchants comes past with armed guards walking beside the carts. There are more of them than of you.",
    choices: [
      { label: "Stay hidden and let them pass", note: "safe", then: [{ type: "minutes", n: 45 }], line: "You lay low while an armed party went by." },
      {
        label: "Rush them anyway",
        note: "a big haul · very dangerous",
        check: { stat: "strength", skill: "arms", odds: 0.25 },
        then: [{ type: "item", item: "coin", n: 9 }, { type: "minutes", n: 30 }],
        line: "You rushed the merchants and got away with a strongbox.",
        otherwise: [{ type: "hurt", n: 30, cause: "a merchant's guard", injury: "gash" }, { type: "minutes", n: 40 }],
        otherwiseLine: "The guards drove you off and cut you as you ran.",
      },
    ],
  },
  {
    id: "outlaw-split",
    slot: "road-split",
    evidence: "inferred",
    text: "Back at the hideout the band divides what was taken. The leader keeps the biggest share for himself.",
    choices: [
      { label: "Take your share without arguing", note: "a little coin", then: [{ type: "item", item: "coin", n: 2 }], line: "You took your share of the take." },
      {
        label: "Demand a fairer split",
        note: "more coin · a fight if he refuses",
        check: { stat: "strength", skill: "speech", odds: 0.4 },
        then: [{ type: "item", item: "coin", n: 4 }],
        line: "You argued for a bigger share and got it.",
        otherwise: [{ type: "item", item: "coin", n: 1 }, { type: "hurt", n: 10, cause: "a fight over the share", injury: "black-eye" }],
        otherwiseLine: "The leader knocked you down and gave you less.",
      },
    ],
  },
  {
    id: "outlaw-farmhouse",
    slot: "forage",
    evidence: "inferred",
    text: "Smoke rises from a farmhouse chimney. The family will have food put by.",
    choices: [
      {
        label: "Demand their food",
        note: "bread · they may resist",
        check: { stat: "strength", skill: "arms", odds: 0.7 },
        then: [{ type: "item", item: "bread", n: 3 }, { type: "minutes", n: 30 }],
        line: "You took food from a farmhouse.",
        otherwise: [{ type: "hurt", n: 12, cause: "a farmer with a pitchfork" }, { type: "minutes", n: 30 }],
        otherwiseLine: "The farmer and his sons drove you off.",
      },
      { label: "Offer to pay for it", note: "one coin for bread", then: [{ type: "item", item: "coin", n: -1 }, { type: "item", item: "bread", n: 2 }], line: "You paid a farm family for bread." },
    ],
  },
  {
    id: "street-drunk",
    slot: "street-rob",
    evidence: "inferred",
    text: "A man comes out of a tavern alone, unsteady on his feet, and turns into a dark lane.",
    choices: [
      {
        label: "Follow him and rob him",
        note: "coin · the watch may come",
        check: { stat: "strength", skill: "arms", odds: 0.65 },
        then: [{ type: "item", item: "coin", n: 4 }, { type: "minutes", n: 15 }],
        line: "You robbed a drunk in a dark lane.",
        otherwise: [{ type: "hurt", n: 15, cause: "the watch", injury: "cracked-ribs" }, { type: "minutes", n: 45 }],
        otherwiseLine: "The watch came running and beat you before you got away.",
      },
      { label: "Leave him", note: "safe · nothing", then: [{ type: "minutes", n: 30 }], line: "You let a drunk go home." },
    ],
  },
  {
    id: "crowd-loose-purse",
    slot: "crowd-lift",
    evidence: "inferred",
    text: "A well-dressed man is haggling at a stall, his purse hanging loose from his belt.",
    choices: [
      {
        label: "Cut it free",
        note: "coin · a beating if you are seen",
        check: { stat: "agility", odds: 0.55 },
        then: [{ type: "item", item: "coin", n: 5 }],
        line: "You cut a purse in the market and slipped away.",
        otherwise: [{ type: "hurt", n: 14, cause: "a crowd that caught a thief" }, { type: "minutes", n: 60 }],
        otherwiseLine: "Someone shouted \"Thief!\" and the crowd caught and beat you.",
      },
      { label: "Wait for an easier mark", note: "safe", then: [{ type: "minutes", n: 30 }], line: "You waited for an easier mark." },
    ],
  },
  {
    id: "press-farmhand",
    slot: "press-take",
    who: "boss",
    as: "the lieutenant",
    evidence: "documented",
    text: "The gang corners a young man near the docks. He swears he is a farm hand who has never been to sea. {Boss} wants his quota.",
    choices: [
      { label: "Take him anyway", note: "paid per man", then: [{ type: "pay", delta: 2 }, { type: "minutes", n: 30 }], line: "You took a farm hand for the navy." },
      { label: "Let him go", note: "the lieutenant won't like it", then: [{ type: "regard", delta: -1 }], line: "You let a man go who was no sailor." },
    ],
  },
];
