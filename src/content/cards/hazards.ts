import type { ChoiceCard } from "./types";

// The dangers of particular work, met as a choice rather than a silent roll:
// the water, the height, the rock face. Drowning, falls and crushing were the
// commonest deaths at work wherever records were kept.
export const HAZARD_CARDS: ChoiceCard[] = [
  {
    id: "hazard-swamped",
    slot: "gather-2",
    work: ["Working the water", "Working near water"],
    text: "The wind picks up, the water gets rough, and waves are coming over the side. If the boat fills, it will sink.",
    evidence: "inferred",
    choices: [
      {
        label: "Bail it out and keep working",
        note: "a full catch if it calms · you could drown",
        check: { stat: "endurance", skill: "foraging", odds: 0.75 },
        then: [{ type: "day", delta: 1 }],
        line: "You bailed the boat out and kept working, and the wind dropped.",
        otherwise: [{ type: "hurt", n: 100, cause: "drowning" }],
        otherwiseLine: "The boat filled and went over.",
      },
      {
        label: "Head back to shore",
        note: "safe · lose half the catch",
        then: [{ type: "day", delta: -1 }, { type: "minutes", n: 60 }],
        line: "You headed back to shore with half a catch.",
      },
    ],
  },
  {
    id: "hazard-fall",
    slot: "transform-2",
    work: ["Building", "Working the roof"],
    text: "The scaffolding pole you are standing on slips under your weight. The rope holding it has worked loose.",
    evidence: "inferred",
    choices: [
      {
        label: "Grab the wall and hold on",
        note: "you'll probably manage · if not, a bad fall",
        check: { stat: "agility", odds: 0.8 },
        then: [{ type: "fatigue", n: 10 }],
        line: "You grabbed the wall and held on until someone tied the pole tight again.",
        otherwise: [{ type: "hurt", n: 70, cause: "a fall", injury: "broken bones" }],
        otherwiseLine: "You fell.",
      },
      {
        label: "Climb down and tie it again",
        note: "safe · loses most of an hour",
        then: [{ type: "minutes", n: 45 }, { type: "day", delta: -1 }],
        line: "You climbed down and tied the pole again before going back up.",
      },
    ],
  },
  {
    id: "hazard-rockfall",
    slot: "gather-2",
    work: ["Working stone"],
    text: "Small stones are trickling down the rock face above where you are cutting. That often means a bigger piece is about to come loose.",
    evidence: "inferred",
    choices: [
      {
        label: "Finish cutting the block first",
        note: "saves the day's work · the rock may fall on you",
        check: { stat: "agility", skill: "stonework", odds: 0.7 },
        then: [{ type: "day", delta: 1 }],
        line: "You got the block out before the rock came down.",
        otherwise: [{ type: "hurt", n: 60, cause: "a fall of rock", injury: "a crushed leg" }],
        otherwiseLine: "The rock face came down on you.",
      },
      {
        label: "Move away and wait",
        note: "safe · lose an hour",
        then: [{ type: "minutes", n: 60 }],
        line: "You moved away, and part of the rock face came down where you had been.",
      },
    ],
  },
  // Everyday risks, in any family's day: the water and the company.
  ...(["tend-2", "gather-3", "transform-2", "carry-2", "serve-2"] as const).flatMap((slot): ChoiceCard[] => [
    {
      id: `risk-ditch-${slot}`,
      slot,
      when: "hot",
      text: "It’s hot and you’re thirsty. The only water nearby is in the ditch, and ditch water often gives people diarrhoea.",
      evidence: "inferred",
      choices: [
        { label: "Drink from the ditch", note: "refreshing · you might get sick", then: [{ type: "fatigue", n: -10 }, { type: "risk", ailment: "flux", odds: 0.15 }], line: "You drank from the ditch." },
        { label: "Wait until the work is done", note: "no risk · tiring in this heat", then: [{ type: "fatigue", n: 15 }], line: "You went thirsty until the work was done." },
        { label: "Walk to the well", note: "clean water · half an hour lost", then: [{ type: "minutes", n: 30 }], line: "You walked to the well for clean water." },
      ],
    },
    {
      id: `risk-cough-${slot}`,
      slot,
      who: "neighbour",
      text: "{Name} has a bad cough and wants to sit close and chat. Coughs spread easily.",
      evidence: "inferred",
      choices: [
        { label: "Sit and chat", note: "{name} will appreciate it · you might catch it", then: [{ type: "minutes", n: 20 }, { type: "regard", delta: 1 }, { type: "risk", ailment: "cough", odds: 0.2 }], line: "You sat with {name} and talked a while." },
        { label: "Keep your distance", note: "no risk · {name} may be offended", then: [{ type: "regard", delta: -1 }], line: "You kept your distance from {name}, who noticed." },
      ],
    },
  ]),
];
