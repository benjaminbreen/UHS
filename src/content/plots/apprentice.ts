import { dueOf, EUROPE, partnerWords, pickOf, pronounWords, temper, trade } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const CRAFT = /smith|potter|weaver|carpenter|cobbler|tailor|mason|cooper|baker|tanner|dyer|saddler|wheelwright|wright|cabinetmaker|jeweller|glassblower|printer|basket|leatherworker|bronze-caster|armourer|fletcher|rope-maker|cordage|toolmaker|watchmaker|dressmaker|milliner|seamstress|confectioner|carver|flintknapper|canoe-builder|brewer|butcher|bricklayer|plumber|electrician|mechanic|welder|hairdresser|barber/;

const learnerOf = (c: PlotContext) => {
  const pool = c.actors.filter((a) => a.kind === "human" && !a.dead && a.householdId !== c.player.householdId && (a.age ?? 30) >= 11 && (a.age ?? 30) <= 17);
  return pool.length ? pickOf(c, pool, "apprentice-learner") : undefined;
};

const done: Condition = { type: "fired", id: "worked" };

/** A youngster starts learning your trade today, and spends the day at your elbow. */
export const apprentice: PlotTemplate = {
  id: "apprentice",
  shape: "work",
  look: {
    emblem: "bench",
    palette: { ink: "#13110c", fill: "#2a2418", edge: "#6e5a36", light: "#efe9da", accent: "#e0a848" },
  },
  weight: (c) => (trade(c, CRAFT) && (c.player.age ?? 30) >= 25 && learnerOf(c) &&
    !c.player.relations?.some((r) => r.kind === "apprentice") ? 0.6 * temper(c, "agreeableness") : 0),
  cast: (c) => {
    const helper = learnerOf(c);
    return helper && { helper };
  },
  begin: (c, cast) => {
    const helper = cast.helper!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      words: {
        helper: helper.name,
        due,
        chore: pickOf(c, ["keep the fire going", "sort the good stock from the spoiled", "hold the work steady while you cut"], "apprentice-chore"),
        ...pronounWords(helper),
        ...p.words,
      },
      refs: { helper: helper.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "helper", line: "arrive" }],
  developments: [
    {
      id: "first",
      when: { type: "talked", role: "helper" },
      then: [{ type: "choose", line: "first", focus: "helper", choices: [{ id: "sweep" }, { id: "bench" }] }],
    },
    {
      id: "idle",
      when: { type: "all", of: [{ type: "since", hours: 2 }, { type: "not", of: { type: "talked", role: "helper" } }] },
      then: [{ type: "card", line: "idle", focus: "helper" }],
    },
    {
      id: "slip",
      when: { type: "all", of: [{ type: "fired", id: "bench" }, { type: "since", hours: 3 }] },
      then: [{ type: "choose", line: "slip", focus: "helper", choices: [{ id: "scold" }, { id: "again", check: { stat: "agreeableness", odds: 0.6 } }] }],
    },
  ],
  endings: [
    { id: "taught", when: { type: "all", of: [{ type: "fired", id: "again" }, { type: "not", of: { type: "fired", id: "again:failed" } }, done] } },
    { id: "afraid", when: { type: "all", of: [{ type: "fired", id: "scold" }, done] } },
    { id: "sulked", when: { type: "all", of: [{ type: "fired", id: "again:failed" }, done] } },
    { id: "fetched", when: { type: "all", of: [{ type: "fired", id: "sweep" }, done] } },
    { id: "alone", when: { type: "all", of: [done, { type: "not", of: { type: "talked", role: "helper" } }] } },
    { id: "gone", when: { type: "gone", role: "helper" } },
    { id: "lost", when: { type: "due" } },
  ],
  wording: [
    {
      // Guild apprentices were bound by written indenture, often for seven years, and lived in the master's house.
      scope: { years: [1100, 1900], bounds: EUROPE },
      title: "The New Apprentice",
      lines: {
        intro: "{helper} starts with you today. The indenture is signed: {he} will live in your house and learn your trade for seven years, and you are to feed {him}, teach {him} and keep {him} out of trouble.",
        threat: "A good first day and {he} might be useful by next year. A bad one and {he}'ll be scared of the tools for months.",
        partner: "Your {partnerKin} {partner} has made up a bed for {helper} in the loft.",
        "cast-helper": "Your new apprentice, on {his} first day.",
      },
    },
    {
      title: "A New Pair of Hands",
      lines: {
        aim: "Start {helper} on the trade, and get the day's work done {due}.",
        intro: "{helper} is starting with you today, to learn your trade by working beside you. {He} is keen, and knows nothing at all.",
        threat: "If you take the time now, {he}'ll be a real help in a year. If you don't, {he}'ll just be in the way.",
        partner: "Your {partnerKin} {partner} has saved {helper} some food for midday.",
        "kin-partner": "Be patient with {him}. You were that age once.",
        "cast-helper": "Learning your trade, on {his} first day.",
        arrive: "I'm {helper}. They said to come to you. What should I do first?",
        first: "{helper} is standing in the doorway, waiting to be told what to do. Most beginners spend their first year sweeping and fetching. Some masters put a tool in their hands on the first day.",
        "sweep:label": "Set {him} to sweeping and fetching",
        "sweep:then": "{He} takes the broom without a word. It isn't what {he} hoped for.",
        "bench:label": "Put a tool in {his} hand",
        "bench:then": "{His} eyes go wide. You show {him} how to hold it, and let {him} try on a scrap.",
        idle: "{helper} has been standing by the door all morning. Nobody has told {him} what to do.",
        slip: "{He} has spoiled a good piece, a whole morning's work, trying to do it without asking. {He} looks like {he} might cry.",
        "scold:label": "Tell {him} off",
        "again:label": "Show {him} again, slowly",
        "again:then": "You take {his} hands and go through it once more, slowly. The second time, {he} gets it right.",
        "again:failed": "You show {him} again, but {he} is too upset to take it in, and the second try is worse.",
        taught: "By evening {he} can {chore} without being told, and has made one small thing that will do. It's a start.",
        afraid: "{helper} doesn't touch anything for the rest of the day. {He}'ll do as {he}'s told, but it will be a long time before {he} tries anything on {his} own.",
        sulked: "{helper} spends the rest of the day sulking by the fire. Tomorrow you'll start again.",
        fetched: "By evening the floor is swept, the water is in, and the fire never went out. {He} watched you all day, which is how most people learn.",
        alone: "You got the work done, but {helper} spent the day by the door and learned nothing.",
        gone: "{helper} won't be coming back.",
        lost: "The day went badly. Nothing got finished, and {helper} was only in the way.",
      },
    },
  ],
};
