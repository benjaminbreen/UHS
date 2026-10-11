import type { ChoiceCard } from "./types";

/** What the man over a track gang was called. */
export const railBoss = [
  // The mandor ran labour gangs in the Netherlands Indies and still does.
  { bounds: [95, -11, 141, 7] as const, title: "mandor" },
  { bounds: [-8, 49.5, 2, 59] as const, title: "ganger" },
  { bounds: [-170, 15, -50, 72] as const, title: "section boss" },
];

export const RAIL_CARDS: ChoiceCard[] = [
  {
    id: "rail-short-handed",
    slot: "rail-report",
    who: "boss",
    evidence: "inferred",
    text: "“I’m short of men for the night gang,” he says. “Time and a half if you’ll come.”",
    choices: [
      {
        label: "Take the night gang too",
        note: "more pay · a long night",
        then: [{ type: "pay", delta: 2 }, { type: "fatigue", n: 20 }, { type: "regard", delta: 1 }],
        line: "You said you would work the night gang as well.",
      },
      {
        label: "Say no",
        note: "he will remember",
        then: [{ type: "regard", delta: -1 }],
        line: "You turned the night gang down.",
      },
      {
        label: "Put your cousin forward",
        check: { stat: "extraversion", odds: 0.6 },
        then: [{ type: "regard", delta: 1 }],
        line: "You put your cousin forward, and the {boss} took him on.",
        otherwise: [{ type: "regard", delta: -1 }],
        otherwiseLine: "You put your cousin forward. He never came, and the {boss} blamed you.",
      },
    ],
  },
  {
    id: "rail-heat",
    slot: "rail-line",
    who: "boss",
    when: "hot",
    evidence: "inferred",
    text: "By midday the rails are too hot to touch and the gang is slowing. “Keep it moving!”",
    choices: [
      {
        label: "Keep the pace",
        check: { stat: "endurance", skill: "stonework", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You kept the pace through the heat.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 25 }],
        otherwiseLine: "You tried to keep the pace and had to stop, dizzy.",
      },
      {
        label: "Rest in the shade a while",
        note: "less pay",
        then: [{ type: "minutes", n: 60 }, { type: "day", delta: -1 }, { type: "fatigue", n: -10 }],
        line: "You sat out the worst of the heat in the shade.",
      },
      {
        label: "Share your water round",
        note: "your water · goodwill",
        then: [{ type: "item", item: "water", n: -1 }, { type: "regard", delta: 1 }],
        line: "You passed your water round the gang.",
      },
    ],
  },
  {
    id: "rail-rain",
    slot: "rail-line",
    who: "boss",
    when: "wet",
    evidence: "inferred",
    text: "A cold rain turns the ballast to slurry under the sleepers. “I want this stretch finished, rain or no rain.”",
    choices: [
      {
        label: "Work on through it",
        check: { stat: "endurance", skill: "stonework", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You worked on through the rain.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 25 }],
        otherwiseLine: "You worked on in the rain until your hands would not close.",
      },
      {
        label: "Shelter under the bridge",
        note: "less pay",
        then: [{ type: "minutes", n: 60 }, { type: "day", delta: -1 }],
        line: "You sheltered under the bridge until it eased.",
      },
      {
        label: "Pack it badly and move on",
        note: "less effort · it may be found",
        check: { stat: "agility", odds: 0.5 },
        then: [{ type: "fatigue", n: -10 }],
        line: "You packed the stretch quickly, and nobody looked.",
        otherwise: [{ type: "day", delta: -2 }, { type: "regard", delta: -1 }],
        otherwiseLine: "You packed the stretch badly, and the {boss} made you dig it out.",
      },
    ],
  },
  {
    id: "rail-train",
    slot: "rail-line",
    who: "boss",
    // Being struck by trains killed more platelayers than anything else.
    evidence: "documented",
    text: "The lookout’s horn: a train is due, and your joint is half packed. “Stand clear!”",
    choices: [
      {
        label: "Finish the joint",
        note: "the stretch done",
        check: { stat: "agility", odds: 0.6 },
        then: [{ type: "day", delta: 1 }],
        line: "You finished the joint and stepped clear as the train came through.",
        otherwise: [{ type: "day", delta: -1 }, { type: "hurt", n: 30, cause: "a passing train", injury: "injured leg" }],
        otherwiseLine: "You stayed a moment too long. The step of a carriage caught your leg.",
      },
      {
        label: "Stand clear at once",
        then: [{ type: "minutes", n: 15 }],
        line: "You stood clear and let the train by.",
      },
      {
        label: "Shout the others clear",
        note: "goodwill",
        then: [{ type: "regard", delta: 1 }, { type: "minutes", n: 15 }],
        line: "You shouted the gang clear, and the {boss} saw it.",
      },
    ],
  },
  {
    id: "rail-short-wage",
    slot: "rail-wage",
    who: "boss",
    evidence: "documented",
    text: "He counts out your wage, and it comes up short. “Tools,” he says, “and your tea.”",
    choices: [
      {
        label: "Take it and say nothing",
        then: [{ type: "pay", delta: -1 }],
        line: "You took the short wage and said nothing.",
      },
      {
        label: "Argue it out",
        check: { stat: "wit", skill: "speech", odds: 0.45 },
        then: [{ type: "regard", delta: -1 }],
        line: "You argued, and he paid you the rest, sourly.",
        otherwise: [{ type: "pay", delta: -2 }, { type: "regard", delta: -2 }],
        otherwiseLine: "You argued, and he docked you more for it.",
      },
      {
        label: "Ask the gang to stand with you",
        check: { stat: "extraversion", odds: 0.35 },
        then: [{ type: "regard", delta: -2 }],
        line: "The gang stood with you, and he paid in full.",
        otherwise: [{ type: "pay", delta: -1 }, { type: "regard", delta: -3 }],
        otherwiseLine: "Nobody stood with you, and he will not forget it.",
      },
    ],
  },
];
