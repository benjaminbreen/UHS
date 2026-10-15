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
    text: "“I need more men for the night shift,” he says. “I’ll pay time and a half if you come.” That means working through the night after a full day.",
    choices: [
      {
        label: "Work the night shift too",
        note: "extra pay · exhausting",
        then: [{ type: "pay", delta: 2 }, { type: "fatigue", n: 20 }, { type: "regard", delta: 1 }],
        line: "You agreed to work the night shift as well.",
      },
      {
        label: "Say no",
        note: "you get your rest · he won't like it",
        then: [{ type: "regard", delta: -1 }],
        line: "You turned down the night shift.",
      },
      {
        label: "Offer your cousin instead",
        note: "time spent fetching him · if he doesn't show, you're blamed",
        check: { stat: "extraversion", odds: 0.6 },
        then: [{ type: "minutes", n: 30 }, { type: "regard", delta: 1 }],
        line: "You offered your cousin, and the {boss} took him on.",
        otherwise: [{ type: "minutes", n: 30 }, { type: "regard", delta: -2 }],
        otherwiseLine: "You offered your cousin. He never came, and the {boss} blamed you.",
      },
    ],
  },
  {
    id: "rail-heat",
    slot: "rail-line",
    who: "boss",
    when: "hot",
    evidence: "inferred",
    text: "By midday the rails are too hot to touch and everyone is slowing down. The {boss} shouts at you all to keep moving. Men collapse from heat on days like this.",
    choices: [
      {
        label: "Keep up the pace",
        note: "the {boss} is pleased · you may get heatstroke",
        check: { stat: "endurance", skill: "stonework", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You kept up the pace through the heat.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 25 }],
        otherwiseLine: "You tried to keep up, but got dizzy and had to stop.",
      },
      {
        label: "Rest in the shade for an hour",
        note: "you recover · docked pay",
        then: [{ type: "minutes", n: 60 }, { type: "day", delta: -1 }, { type: "fatigue", n: -10 }],
        line: "You sat out the worst of the heat in the shade.",
      },
      {
        label: "Share your water with the others",
        note: "you go thirsty · the men think well of you",
        then: [{ type: "item", item: "water", n: -1 }, { type: "regard", delta: 1 }],
        line: "You shared your water with the rest of the crew.",
      },
    ],
  },
  {
    id: "rail-rain",
    slot: "rail-line",
    who: "boss",
    when: "wet",
    evidence: "inferred",
    text: "Cold rain is turning the gravel under the wooden ties into mud. “I want this section finished, rain or not,” the {boss} says.",
    choices: [
      {
        label: "Keep working in the rain",
        note: "the {boss} is pleased · you may get too cold to go on",
        check: { stat: "endurance", skill: "stonework", odds: 0.55 },
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 15 }],
        line: "You kept working through the rain.",
        otherwise: [{ type: "day", delta: -1 }, { type: "fatigue", n: 25 }],
        otherwiseLine: "You kept working in the rain until your hands were too numb to grip.",
      },
      {
        label: "Shelter under the bridge",
        note: "you stay warm · docked pay",
        then: [{ type: "minutes", n: 60 }, { type: "day", delta: -1 }],
        line: "You sheltered under the bridge until the rain eased.",
      },
      {
        label: "Do a rushed job and move on",
        note: "saves your strength · you'll redo it if he checks",
        check: { stat: "agility", odds: 0.5 },
        then: [{ type: "fatigue", n: -10 }],
        line: "You rushed the section, and nobody checked.",
        otherwise: [{ type: "day", delta: -2 }, { type: "regard", delta: -1 }],
        otherwiseLine: "You rushed the section, and the {boss} made you dig it up and do it again.",
      },
    ],
  },
  {
    id: "rail-train",
    slot: "rail-line",
    who: "boss",
    // Being struck by trains killed more platelayers than anything else.
    evidence: "documented",
    text: "The lookout blows his horn: a train is coming, and you’ve only half finished packing the gravel under this joint in the rails. “Stand clear!”",
    choices: [
      {
        label: "Finish the joint first",
        note: "the work gets done · you could be hit",
        check: { stat: "agility", odds: 0.6 },
        then: [{ type: "day", delta: 1 }],
        line: "You finished the joint and stepped clear as the train came through.",
        otherwise: [{ type: "day", delta: -1 }, { type: "hurt", n: 30, cause: "a passing train", injury: "injured leg" }],
        otherwiseLine: "You stayed a moment too long. The step of a carriage caught your leg.",
      },
      {
        label: "Step clear at once",
        note: "safe · a few minutes lost",
        then: [{ type: "minutes", n: 15 }],
        line: "You stood clear and let the train by.",
      },
      {
        label: "Shout the others clear first",
        note: "the {boss} notices · the whole crew loses time",
        then: [{ type: "regard", delta: 1 }, { type: "minutes", n: 15 }, { type: "day", delta: -1 }],
        line: "You shouted the crew clear, and the {boss} saw it.",
      },
    ],
  },
  {
    id: "rail-short-wage",
    slot: "rail-wage",
    who: "boss",
    evidence: "documented",
    text: "He counts out your pay, and it’s short. “That’s for your tools,” he says, “and your tea.” Bosses often took deductions like this, fair or not.",
    choices: [
      {
        label: "Take it and say nothing",
        note: "lose a little · no trouble",
        then: [{ type: "pay", delta: -1 }],
        line: "You took the short pay and said nothing.",
      },
      {
        label: "Argue with him",
        note: "you may get it back · or lose more",
        check: { stat: "wit", skill: "speech", odds: 0.45 },
        then: [{ type: "regard", delta: -1 }],
        line: "You argued, and he paid you the rest, sourly.",
        otherwise: [{ type: "pay", delta: -2 }, { type: "regard", delta: -2 }],
        otherwiseLine: "You argued, and he docked you more for it.",
      },
      {
        label: "Get the crew to back you up",
        note: "full pay if they do · he'll hold a grudge either way",
        check: { stat: "extraversion", odds: 0.35 },
        then: [{ type: "regard", delta: -2 }],
        line: "The crew backed you up, and he paid in full.",
        otherwise: [{ type: "pay", delta: -1 }, { type: "regard", delta: -3 }],
        otherwiseLine: "Nobody backed you up, and he won’t forget it.",
      },
    ],
  },
];
