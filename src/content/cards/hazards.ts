import type { ChoiceCard } from "./types";

// The dangers of particular work, met as a choice rather than a silent roll:
// the water, the height, the rock face. Drowning, falls and crushing were the
// commonest deaths at work wherever records were kept.
export const HAZARD_CARDS: ChoiceCard[] = [
  {
    id: "hazard-swamped",
    slot: "gather-2",
    work: ["Working the water", "Working near water"],
    text: "The wind gets up and the water turns rough. The boat is shipping water.",
    evidence: "inferred",
    choices: [
      {
        label: "Bail and keep working",
        check: { stat: "endurance", skill: "foraging", odds: 0.75 },
        then: [{ type: "day", delta: 1 }],
        line: "You bailed and kept at it, and the weather passed.",
        otherwise: [{ type: "hurt", n: 100, cause: "drowning" }],
        otherwiseLine: "The boat went over.",
      },
      {
        label: "Make for the shore",
        then: [{ type: "day", delta: -1 }, { type: "minutes", n: 60 }],
        line: "You made for the shore with half a catch.",
      },
    ],
  },
  {
    id: "hazard-fall",
    slot: "transform-2",
    work: ["Building", "Working the roof"],
    text: "The scaffold pole you are standing on shifts under your weight.",
    evidence: "inferred",
    choices: [
      {
        label: "Grab for the wall",
        check: { stat: "agility", odds: 0.8 },
        then: [{ type: "fatigue", n: 10 }],
        line: "You caught the wall and hung on until it was made fast.",
        otherwise: [{ type: "hurt", n: 70, cause: "a fall", injury: "broken bones" }],
        otherwiseLine: "You fell.",
      },
      {
        label: "Come down and lash it again",
        then: [{ type: "minutes", n: 45 }, { type: "day", delta: -1 }],
        line: "You came down and lashed the pole again before going back up.",
      },
    ],
  },
  {
    id: "hazard-rockfall",
    slot: "gather-2",
    work: ["Working stone"],
    text: "Grit is trickling from the face above where you are cutting.",
    evidence: "inferred",
    choices: [
      {
        label: "Finish the block first",
        check: { stat: "agility", skill: "stonework", odds: 0.7 },
        then: [{ type: "day", delta: 1 }],
        line: "You got the block out before the face let go.",
        otherwise: [{ type: "hurt", n: 60, cause: "a fall of rock", injury: "a crushed leg" }],
        otherwiseLine: "The face came down on you.",
      },
      {
        label: "Stand clear and wait",
        then: [{ type: "minutes", n: 60 }],
        line: "You stood clear, and part of the face came down where you had been.",
      },
    ],
  },
  // Everyday risks, in any family's day: the water and the company.
  ...(["tend-2", "gather-3", "transform-2", "carry-2", "serve-2"] as const).flatMap((slot): ChoiceCard[] => [
    {
      id: `risk-ditch-${slot}`,
      slot,
      when: "hot",
      text: "The day is hot, and the only water to hand is from the ditch.",
      evidence: "inferred",
      choices: [
        { label: "Drink from the ditch", then: [{ type: "fatigue", n: -10 }, { type: "risk", ailment: "flux", odds: 0.15 }], line: "You drank from the ditch." },
        { label: "Go without until you are done", then: [{ type: "fatigue", n: 15 }], line: "You went thirsty until the work was done." },
        { label: "Walk to the well", then: [{ type: "minutes", n: 30 }], line: "You walked to the well for clean water." },
      ],
    },
    {
      id: `risk-cough-${slot}`,
      slot,
      who: "neighbour",
      text: "{Name} has a hacking cough, and wants to sit close and talk.",
      evidence: "inferred",
      choices: [
        { label: "Sit and talk", then: [{ type: "minutes", n: 20 }, { type: "regard", delta: 1 }, { type: "risk", ailment: "cough", odds: 0.2 }], line: "You sat with {name} and talked a while." },
        { label: "Keep your distance", then: [{ type: "regard", delta: -1 }], line: "You kept your distance from {name}, who noticed." },
      ],
    },
  ]),
];
