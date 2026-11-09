import { partnerWords, pronounWords, temper, trade } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const TASKS: [RegExp, string][] = [
  [/shepherd|herd|goat|cattle|drover|ranch|swine|pig|dairy|milk/, "keeping the young animals together and counting them in"],
  [/fish|net|boat|ferry|sailor/, "untangling and mending the nets"],
  [/smith|iron|bronze|armour|tool|boiler|weld/, "working the bellows, slowly and evenly"],
  [/weav|spin|wool|dye|seamstress|tailor|dressmak|fuller|milliner/, "winding thread and fetching what you need"],
  [/pot|brick|kiln|lime/, "treading the clay"],
  [/forag|gather|root|shellfish|hunt|trap|fowl/, "learning which plants are good to eat and which are not"],
  [/baker|cook|brew|alewife|confection/, "kneading and keeping the fire right"],
  [/carpent|cabinet|cooper|wheel|wright|sawyer|carver|thatch|mason/, "sweeping up, holding boards steady and handing you tools"],
  [/trader|merchant|shop|grocer|seller|vendor|hawker|pedlar|coster|chapman/, "minding the goods and calling out to people passing"],
  [/farm|peasant|plough|tiller|grow|cultivat|rice|tenant|cottager|crofter|serf|villein|fellah|labourer|vine|garden|thresher/, "scaring the birds off the sown ground"],
];

const taskOf = (c: PlotContext) => TASKS.find(([re]) => trade(c, re))?.[1];

const childOf = (c: PlotContext) => c.actors.find((a) => a.kind === "human" && !a.dead && a.id !== c.player.id &&
  a.householdId === c.player.householdId && (a.age ?? 30) >= 7 && (a.age ?? 30) <= 12);

const slip = (id: string) => ({ type: "all" as const, of: [{ type: "fired" as const, id }, { type: "fired" as const, id: "worked" }] });

/** A child of the house comes along to the work for the first time, gets it
 * wrong, and how you take it is what the child remembers. */
export const firstday: PlotTemplate = {
  id: "firstday",
  shape: "household",
  look: {
    emblem: "fieldpath",
    palette: { ink: "#12140c", fill: "#222a16", edge: "#6a6a30", light: "#eef0dc", accent: "#e0b050" },
  },
  weight: (c) => ((c.setting?.year ?? 0) < 1900 && taskOf(c) && childOf(c) ? 0.6 * temper(c, "conscientiousness") : 0),
  cast: (c) => {
    const child = childOf(c);
    return child && { child };
  },
  begin: (c, cast) => {
    const child = cast.child!;
    const p = partnerWords(c);
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 20 * 3600,
      words: { child: child.name, task: taskOf(c)!, ...pronounWords(child), ...p.words },
      refs: { child: child.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "slip",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "slip", focus: "child", choices: [{ id: "show", check: { stat: "agreeableness", odds: 0.55 } }, { id: "redo" }, { id: "laugh" }] }],
    },
  ],
  endings: [
    { id: "sulked", when: slip("show:failed") },
    { id: "learned", when: slip("show") },
    { id: "watched", when: slip("redo") },
    { id: "laughed", when: slip("laugh") },
    { id: "forgot", when: { type: "due" } },
  ],
  wording: [
    {
      title: "First Day at the Work",
      lines: {
        aim: "Get through the day's work with {child} helping.",
        intro: "{child} is old enough to help now, and today {he} comes with you for the first time. You have set {him} to {task}.",
        threat: "Nothing much rides on one day. But {child} will remember how you were with {him}.",
        partner: "Your {partnerKin} {partner} got {child} up early and says to be patient with {him}.",
        "kin-partner": "How is {child} doing? Don't be hard on {him}, it's the first day.",
        "cast-child": "Is helping at the work for the first time: {task}.",
        slip: "{child} has been at it all morning, but has got something wrong, and part of the work will have to be done again. {He} is watching your face.",
        "show:label": "Show {him} how, slowly",
        "show:then": "You crouch down and show {him}, twice, slowly. The second time {he} gets it right.",
        "show:failed": "You start to show {him}, lose patience, and take it out of {his} hands. {He} goes quiet.",
        "redo:label": "Do it again yourself",
        "redo:then": "You do it over yourself while {child} watches. It's quicker that way.",
        "laugh:label": "Laugh it off",
        "laugh:then": "You laugh and say you did worse on your first day. {child} laughs too, and tries again, more carefully.",
        learned: "By evening {child} can do it without being shown. At supper {he} tells everyone, twice.",
        sulked: "{child} works the rest of the day without a word, and at supper won't look at you. In the morning {he} asks to stay home.",
        watched: "The work gets done, and done right. {child} spent most of the day watching, and asks if {he} has to come tomorrow.",
        laughed: "{child} made a few more mistakes, but kept at it. On the way home {he} asks what you got wrong on your first day.",
        forgot: "The day ended with the work still undone. You walked home in the dark, and {child} fell asleep before supper.",
      },
    },
  ],
};
