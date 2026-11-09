import { elderOf, partnerWords, pickOf, pronounWords, temper, trade } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const BIRTHS: [RegExp, string, string, string][] = [
  [/shepherd/, "ewe", "ewes", "lamb"],
  [/goat/, "nanny goat", "nanny goats", "kid"],
  [/cattle|dairy|milk|ranch|drover/, "cow", "cows", "calf"],
  [/camel/, "she-camel", "she-camels", "calf"],
  [/horse/, "mare", "mares", "foal"],
  [/llama/, "llama", "llamas", "baby"],
  [/reindeer/, "reindeer cow", "reindeer cows", "calf"],
  [/yak/, "yak cow", "yak cows", "calf"],
];

const birthOf = (c: PlotContext) => BIRTHS.find(([re]) => trade(c, re));

const any = (...of: Condition[]): Condition => ({ type: "not", of: { type: "all", of: of.map((c) => ({ type: "not", of: c })) } });

/** An animal is giving birth and it is going wrong. */
export const birthing: PlotTemplate = {
  id: "birthing",
  shape: "work",
  look: {
    emblem: "fold",
    palette: { ink: "#14100c", fill: "#2a2018", edge: "#6a4c32", light: "#f0e6da", accent: "#e8a04a" },
  },
  weight: (c) => (birthOf(c) && elderOf(c) ? 0.7 * temper(c, "agility") : 0),
  cast: (c) => {
    const elder = elderOf(c);
    return elder && { elder };
  },
  begin: (c, cast) => {
    const elder = cast.elder!;
    const [, kind, kinds, young] = birthOf(c)!;
    const p = partnerWords(c);
    return {
      deadline: c.clock + 4 * 3600,
      words: {
        elder: elder.name,
        kind,
        kinds,
        young,
        trouble: pickOf(c, ["coming backwards", "turned with its head back", "coming with one leg folded back"], "birthing-trouble"),
        ...pronounWords(elder),
        ...p.words,
      },
      refs: { elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "trouble", choices: [{ id: "turn", check: { stat: "agility", skill: "animals", odds: 0.5 } }, { id: "fetch" }, { id: "wait", check: { stat: "conscientiousness", odds: 0.3 } }] }],
  developments: [
    {
      id: "stuck",
      when: { type: "fired", id: "turn:failed" },
      then: [{ type: "choose", line: "stuck", choices: [{ id: "fetch" }, { id: "pull", check: { stat: "strength", skill: "animals", odds: 0.4 } }] }],
    },
    {
      id: "straining",
      when: { type: "all", of: [{ type: "fired", id: "fetch" }, { type: "since", hours: 1.5 }, { type: "not", of: { type: "talked", role: "elder" } }] },
      then: [{ type: "card", line: "straining", focus: "elder" }],
    },
  ],
  endings: [
    { id: "helped", when: { type: "talked", role: "elder" } },
    { id: "turned", when: { type: "all", of: [{ type: "fired", id: "turn" }, { type: "not", of: { type: "fired", id: "turn:failed" } }] } },
    { id: "pulled", when: { type: "all", of: [{ type: "fired", id: "pull" }, { type: "not", of: { type: "fired", id: "pull:failed" } }] } },
    { id: "born", when: { type: "all", of: [{ type: "fired", id: "wait" }, { type: "not", of: { type: "fired", id: "wait:failed" } }] } },
    { id: "lost", when: any({ type: "fired", id: "pull:failed" }, { type: "fired", id: "wait:failed" }, { type: "due" }) },
  ],
  wording: [
    {
      title: "A Hard Birth",
      lines: {
        aim: "Save the {kind} and her {young}.",
        intro: "Before dawn one of your {kinds} went into labour, and it's going wrong. The {young} is {trouble}, and she has been straining for hours.",
        threat: "If nobody helps her soon, you could lose them both.",
        partner: "Your {partnerKin} {partner} is holding the lamp and keeping the others away.",
        "kin-partner": "{elder} has done this more times than anyone.",
        "cast-elder": "Has helped more animals give birth than anyone around here.",
        trouble: "The {kind} is down on her side, groaning. The {young} is {trouble}. Someone has to reach in and turn it, or she'll have to manage on her own.",
        "turn:label": "Reach in and turn it yourself",
        "fetch:label": "Run for {elder}",
        "fetch:then": "You leave her with the lamp and run to find {elder}. {He}'ll know what to do.",
        "wait:label": "Leave her to it",
        stuck: "You can feel a leg, but you can't get it round, and she's pushing against you. Your arm is going numb.",
        "pull:label": "Get a rope on it and pull",
        straining: "She's been down too long, and her breathing has changed. If {elder} doesn't come soon it will be too late.",
        helped: "{elder} comes, rolls up {his} sleeves and reaches in. A few minutes later the {young} is out and breathing. {He} wipes {his} arm on the straw.",
        turned: "You find the leg, fold it forward, and the {young} slides out all at once. It sneezes, and the {kind} turns round to lick it.",
        pulled: "You loop a cord round the legs and pull each time she pushes. The {young} comes out limp, and then it coughs and starts to breathe.",
        born: "You sit back and let her be. An hour later, with one last push, the {young} is out on the straw. She managed it on her own.",
        lost: "The {young} comes out dead. The {kind} lives, but it takes her all day to get up again.",
      },
    },
  ],
};
