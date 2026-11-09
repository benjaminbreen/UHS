import { dueOf, neighbours, partnerWords, pickOf, pronounWords, temper, trade } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const WAGED = /factory-hand|garment-worker|mill-worker|machine-operator|power-loom|match-worker|dock|kitchen-porter|waiter|nurse|care-worker|hospital|shop-assistant|cleaner|charwoman|laundry-worker|refuse-collector|tobacco-worker|miner|construction-labourer|navvy|railway-labourer|bus-driver|postman/;

const absentOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) <= 60);
  return pool.length ? pickOf(c, pool, "shift-absent") : undefined;
};

const fired = (id: string): Condition => ({ type: "fired", id });
const brought: Condition = { type: "brought", role: "friend" };

/** Someone on your shift hasn't come in, and you are doing two people's work. */
export const shift: PlotTemplate = {
  id: "shift",
  shape: "work",
  look: {
    emblem: "line",
    palette: { ink: "#101214", fill: "#262c32", edge: "#5a6672", light: "#e6eaee", accent: "#e0a848" },
  },
  weight: (c) => (trade(c, WAGED) && absentOf(c) ? 0.6 * temper(c, "agreeableness") : 0),
  cast: (c) => {
    const friend = absentOf(c);
    return friend && { friend };
  },
  begin: (c, cast) => {
    const friend = cast.friend!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      words: {
        friend: friend.name,
        due,
        boss: (c.setting?.year ?? 2000) < 1920 ? "the foreman" : "the supervisor",
        Boss: (c.setting?.year ?? 2000) < 1920 ? "The foreman" : "The supervisor",
        why: pickOf(c, ["has a fever and can barely stand", "was up all night with a sick child", "hurt a hand yesterday and couldn't hold anything this morning"], "shift-why"),
        ...pronounWords(friend),
        ...p.words,
      },
      refs: { friend: friend.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "double",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "double", choices: [{ id: "cover", check: { stat: "endurance", odds: 0.5 } }, { id: "own" }, { id: "ask", check: { stat: "extraversion", skill: "speech", odds: 0.35 } }] }],
    },
    {
      id: "after",
      when: { type: "all", of: [fired("worked"), { type: "not", of: brought }] },
      then: [{ type: "card", line: "after", focus: "friend" }],
    },
  ],
  endings: [
    { id: "excused", when: { type: "all", of: [fired("ask"), { type: "not", of: fired("ask:failed") }, brought] } },
    { id: "covered", when: { type: "all", of: [fired("cover"), { type: "not", of: fired("cover:failed") }, brought] } },
    { id: "docked", when: { type: "all", of: [fired("double"), brought] } },
    { id: "gone", when: { type: "gone", role: "friend" } },
    { id: "tired", when: { type: "due" } },
  ],
  wording: [
    {
      title: "Short-Handed",
      lines: {
        aim: "Get through the shift without {friend}, and look in on {him} after.",
        intro: "{friend} hasn't come in today, and {boss} has told you to do {his} work as well as yours. Nobody knows why {he} is off.",
        threat: "If the work isn't done, someone's pay will be docked. If {he}'s off too long, {he} may not have a job to come back to.",
        partner: "Your {partnerKin} {partner} thinks {he} looked ill yesterday.",
        "kin-partner": "Go and see {friend} on your way home. {He}'d do the same for you.",
        "cast-friend": "Didn't come in to work today.",
        double: "{friend}'s work is piling up next to yours. If it's still there at the end of the shift, {boss} will dock {him} a day's pay, or find someone to take {his} place.",
        "cover:label": "Do both, and say nothing",
        "cover:then": "You work through the break and don't stop to eat. By the end you can hardly lift your arms, but it's all done.",
        "cover:failed": "You work through the break, but there's too much. At the end of the shift there's still a pile, and {boss} sees it.",
        "own:label": "Do your own work and leave {his}",
        "own:then": "You do your own work and leave {friend}'s where it is. {Boss} sees the pile at the end of the shift and writes something down.",
        "ask:label": "Ask {boss} to let it go",
        "ask:then": "{Boss} looks at you for a long time, then shrugs and says just this once.",
        "ask:failed": "{Boss} tells you to mind your own work, and writes {friend}'s name down.",
        after: "The shift is over. {friend} lives nearby. You could look in on the way home.",
        excused: "{friend} {why}. When you tell {him} {boss} let it go, {he} can't believe it.",
        covered: "{friend} {why}. {He} is very glad to hear that {his} work got done and {boss} noticed nothing.",
        docked: "{friend} {why}. {He} has lost a day's pay, and {he} knew {he} would. {He} is glad you came anyway.",
        gone: "{friend} won't be coming back to work.",
        tired: "You went straight home and slept. You'll hear about {friend} tomorrow.",
      },
    },
  ],
};
