import { sexOf } from "../../core/brief";
import { neighbours, partnerWords, pickOf, pronounWords, within } from "./common";
import type { Actor } from "../../core/types";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const US_EAST = [-92, 30, -66.9, 47.5] as const;
const NEW_YORK = [-74.3, 40.48, -73.7, 40.92] as const;
const SCOTLAND = [-7.6, 54.6, -1.7, 58.7] as const;

const OPIOIDS = { years: [2008, 2023], bounds: US_EAST } as const;
const SEVENTIES = { years: [1969, 1980], bounds: NEW_YORK } as const;
const EIGHTIES = { years: [1980, 1996], bounds: SCOTLAND } as const;
const DEATHS = { years: [2015, 2023], bounds: SCOTLAND } as const;

const partnerOf = (c: PlotContext) => c.player.relations?.find((r) => r.kind === "partner")?.other;

/** Family the player shares a house or parents with: a grown child, a brother or sister, a parent, a cousin, else the partner.
 * The 2010s waves in Ohio and Scotland killed people into their fifties. */
const kinOf = (c: PlotContext) => {
  const oldest = within(c, OPIOIDS, DEATHS) ? 60 : 45;
  const own = new Set(c.player.relations?.filter((r) => r.kind === "child").map((r) => r.other));
  const parents = new Set(c.player.relations?.filter((r) => r.kind === "parent").map((r) => r.other));
  const sibling = (a: Actor) => !!a.relations?.some((r) => r.kind === "parent" && parents.has(r.other));
  // Servants, apprentices and lodgers share the house but are not family.
  const hired = new Set(c.player.relations?.filter((r) => !["child", "parent", "partner"].includes(r.kind)).map((r) => r.other));
  const rank = (a: Actor) => own.has(a.id) || sibling(a) ? 0 : a.id === partnerOf(c) ? 2 : 1;
  return c.actors
    .filter((a) => a.kind === "human" && !a.dead && a.id !== c.player.id && !hired.has(a.id) && (a.age ?? 30) >= 17 && (a.age ?? 30) <= oldest &&
      (own.has(a.id) || sibling(a) || a.householdId === c.player.householdId))
    .sort((a, b) => rank(a) - rank(b))[0];
};

const kinWord = (c: PlotContext, a: Actor) => {
  const female = sexOf(a) === "female";
  if (c.player.relations?.some((r) => r.kind === "child" && r.other === a.id)) return female ? "daughter" : "son";
  if (c.player.relations?.some((r) => r.kind === "parent" && r.other === a.id)) return female ? "mother" : "father";
  if (c.player.relations?.some((r) => r.kind === "partner" && r.other === a.id)) return female ? "wife" : sexOf(a) === "male" ? "husband" : "partner";
  const parents = new Set(c.player.relations?.filter((r) => r.kind === "parent").map((r) => r.other));
  if (a.relations?.some((r) => r.kind === "parent" && parents.has(r.other))) return female ? "sister" : "brother";
  return (c.player.age ?? 40) - (a.age ?? 25) >= 15 ? female ? "niece" : "nephew" : "cousin";
};

const CARES = /nurse|care-worker|hospital|orderly|physician|pharmac|paramedic|social/i;
const helperOf = (c: PlotContext, kin?: Actor) => {
  const pool = neighbours(c).filter((a) => a.id !== kin?.id && (a.age ?? 30) >= 25 && (a.age ?? 30) <= 70);
  return pool.find((a) => CARES.test(a.role)) ?? (pool.length ? pickOf(c, pool, "overdose-helper") : undefined);
};

const fired = (id: string): Condition => ({ type: "fired", id });
const not = (of: Condition): Condition => ({ type: "not", of });
const all = (...of: Condition[]): Condition => ({ type: "all", of });
const revived: Condition = { type: "any", of: [fired("call"), fired("naloxone"), all(fired("wake"), not(fired("wake:failed")))] };
const after = (id: string, hours: number): Condition => ({ type: "after", id, hours });

/** A grown relative is found on the bathroom floor, not breathing right. Get
 * them back, then decide what the family does next. */
export const overdose: PlotTemplate = {
  id: "overdose",
  shape: "household",
  look: {
    emblem: "kitchen",
    palette: { ink: "#0e1014", fill: "#1e2430", edge: "#4a5a6e", light: "#e8ecf2", accent: "#7ab8d8" },
  },
  weight: (c) => {
    if (!within(c, OPIOIDS, SEVENTIES, EIGHTIES, DEATHS)) return 0;
    const kin = kinOf(c);
    if (!kin || !helperOf(c, kin)) return 0;
    // Overdose deaths in Ohio and West Virginia rose steeply once fentanyl reached the heroin supply, around 2014.
    return within(c, { years: [2015, 2023], bounds: US_EAST }) ? 0.4 : 0.3;
  },
  cast: (c) => {
    const kin = kinOf(c);
    const helper = kin && helperOf(c, kin);
    return kin && helper && { kin, helper };
  },
  begin: (c, cast) => {
    const kin = cast.kin!, helper = cast.helper!;
    const k = pronounWords(kin);
    const year = c.setting?.year ?? 2016;
    const yours = c.player.relations?.some((r) => r.kind === "partner" && r.other === kin.id);
    const p = yours ? {} : partnerWords(c);
    return {
      deadline: c.clock + 14 * 3600,
      words: {
        kin: kin.name,
        kinWord: kinWord(c, kin),
        helper: helper.name,
        kit: year >= 2015 ? "Narcan" : "naloxone",
        drug: year < 2011 ? "pain pills" : year < 2014 ? "heroin" : "heroin, and the heroin round here is cut with fentanyl now",
        he: k.he, He: k.He, his: k.his, him: k.him,
        ...p.words,
      },
      refs: { kin: kin.id, helper: helper.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "found", focus: "kin", choices: [{ id: "call" }, { id: "naloxone" }, { id: "wake", check: { stat: "wit", odds: 0.4 } }] }],
  developments: [
    { id: "worse", when: fired("wake:failed"), then: [{ type: "choose", line: "worse", focus: "kin", choices: [{ id: "call" }, { id: "naloxone" }] }] },
    { id: "back", when: all(revived, { type: "since", hours: 1 }), then: [{ type: "card", line: "back", focus: "kin" }, { type: "regard", role: "helper", delta: 1 }] },
    {
      id: "next",
      when: all(revived, { type: "since", hours: 4 }),
      then: [{ type: "choose", line: "next", focus: "kin", choices: [{ id: "treatment", check: { stat: "conscientiousness", odds: 0.5 } }, { id: "out" }, { id: "stay" }] }],
    },
    { id: "cut", when: fired("out"), then: [{ type: "regard", role: "kin", delta: -2 }] },
  ],
  endings: [
    { id: "clinic", when: all(fired("treatment"), not(fired("treatment:failed")), after("treatment", 2)) },
    { id: "waitlist", when: all(fired("treatment:failed"), after("treatment", 2)) },
    { id: "gone", when: after("out", 2) },
    { id: "kept", when: after("stay", 2) },
    { id: "alone", when: { type: "due" } },
  ],
  wording: [
    {
      // Ohio's Project DAWN handed out naloxone kits from 2012; Narcan nasal spray was approved in 2015 and sold without a prescription.
      scope: OPIOIDS,
      title: "The Overdose",
      lines: {
        intro: "Your {kinWord} {kin} has been using {drug}. Everybody in the family knows and nobody says it. This morning the bathroom door is locked and {he} doesn't answer.",
        threat: "Half the families on the street have lost someone. Fentanyl stops people breathing in minutes.",
        "cast-helper": "Keeps {kit}, the medicine that reverses an overdose, by the front door.",
        found: "You get the door open. {kin} is on the floor, lips blue, making a slow snoring sound. {helper} next door keeps {kit}, the medicine that brings people back.",
        "call:label": "Call 911",
        "call:then": "The dispatcher talks you through tipping {his} head back and breathing for {him}. The ambulance is there in nine minutes, and a police car behind it.",
        "naloxone:label": "Run for {helper}'s {kit}",
        "naloxone:then": "{helper} comes at a run with the {kit}, gives {kin} a dose, waits two minutes and gives another. {kin} gasps and opens {his} eyes.",
        back: "{kin} is awake, shaking and sick and angry, the way people are when they've been brought back. {He} says {he} only used a little, and that it won't happen again.",
        "treatment:label": "Find {him} a bed in a treatment program today",
        "treatment:then": "You and {helper} spend the afternoon on the phone, going down a list of clinics that take Medicaid.",
        "treatment:failed": "Every clinic you call has a waiting list. The nearest bed is three weeks away.",
        "stay:label": "Let {him} stay, and keep Narcan in the house",
        clinic: "There is a bed at a clinic forty minutes away that will start {him} on Suboxone, a medicine that stops the craving. You drive {him} there before {he} can change {his} mind. It is a start, and everyone says that word carefully.",
        waitlist: "{kin}'s name is on three waiting lists. In the meantime {he} sleeps at home and you check on {him} every hour. {helper} brings round two more doses of {kit}.",
      },
    },
    {
      // New York's heroin epidemic peaked around 1970-73; the city opened dozens of methadone clinics, but naloxone was still a hospital drug.
      scope: SEVENTIES,
      title: "The Overdose",
      lines: {
        intro: "Your {kinWord} {kin} has been on heroin since {he} came back from the service. You found the works in a coffee can last month. This morning the bathroom door is locked and {he} doesn't answer.",
        threat: "Kids on this block have died of it. People here know what an overdose looks like.",
        "cast-helper": "Has seen more overdoses on this block than anybody, and knows what to do.",
        found: "You get the door open. {kin} is on the floor, lips blue, breathing slow. {helper} down the hall has pulled people back before.",
        "call:label": "Call an ambulance",
        "call:then": "It takes the ambulance twenty minutes to come. They take {him} to the hospital, where a doctor gives {him} a shot of naloxone and {he} comes round.",
        "naloxone:label": "Run for {helper}",
        "naloxone:then": "{helper} comes down the hall, slaps {kin}'s face, breathes for {him}, and won't stop until {he} groans and turns {his} head.",
        back: "{kin} is awake, grey and sweating, and says {he} only did a little. {He} says {he} can quit any time {he} wants.",
        "treatment:label": "Take {him} to the methadone clinic",
        "treatment:then": "You and {kin} wait in line at the clinic on the avenue with fifty other people.",
        "treatment:failed": "The clinic is full. They take {his} name and tell {him} to come back in a month.",
        "stay:label": "Let {him} stay, and keep an eye on {him}",
        clinic: "The clinic takes {him}. Every morning {he} will go and drink {his} dose of methadone in a paper cup in front of a nurse. It is better than the street.",
        gone: "{kin} is staying with friends uptown. {He} calls from a pay phone once, late, to say {he} is alive.",
        waitlist: "{kin}'s name is on the list at the clinic. Until then {he} stays at home, and you check the bathroom every time it is quiet too long.",
      },
    },
    {
      // Edinburgh's needle-sharing made it known as Europe's AIDS capital by 1986; Glasgow began its methadone programme in 1994.
      scope: EIGHTIES,
      title: "The Overdose",
      lines: {
        intro: "Your {kinWord} {kin} has been on heroin since the work dried up. {He} sold the telly last month. This morning the bathroom door is locked and {he} doesn't answer.",
        threat: "Half the lads on the housing scheme are on it, and they share needles. People are dying of it, and of the virus from the needles.",
        "cast-helper": "Lost {his} own son to it, and knows what to do.",
        found: "You get the door open. {kin} is on the floor, lips blue, breathing slow. {helper} across the landing has seen this before.",
        "call:label": "Phone 999",
        "call:then": "The ambulance is there in a quarter of an hour. They give {him} an injection and {he} comes round fighting. The police come up the stairs after them.",
        "naloxone:label": "Run for {helper}",
        "naloxone:then": "{helper} comes across the landing, gets {kin} on {his} side, breathes for {him} and won't stop shouting {his} name until {he} opens {his} eyes.",
        back: "{kin} is awake, white and shaking, saying {he} only had a wee bit. {He} won't look at you.",
        "treatment:label": "Get {him} to the doctor for a methadone script",
        "treatment:then": "You sit with {kin} in the doctor's waiting room all afternoon.",
        "treatment:failed": "The doctor won't prescribe methadone. There's a rehab place, with a waiting list of months.",
        "stay:label": "Let {him} stay, and keep {him} where you can see {him}",
        clinic: "The doctor gives {him} a methadone script, to be picked up at the chemist every day. {kin} says it's not the same as being clean, and you say it's not the same as being dead.",
        gone: "{kin} is sleeping on a friend's floor on another housing scheme. Someone rings from the phone box late at night to say {he} is alive.",
        waitlist: "{kin}'s name is down for the rehab place. Until then {he} stays in, and you lie awake listening for the bathroom door.",
      },
    },
    {
      // Scotland had Europe's highest drug-death rate from 2018; its take-home naloxone kits go to families as well as users.
      scope: DEATHS,
      title: "The Overdose",
      lines: {
        intro: "Your {kinWord} {kin} has been on heroin and street Valium for years, on and off. This morning the bathroom door is locked and {he} doesn't answer.",
        threat: "More people die of drugs here than anywhere in Europe. Everyone knows a family it's happened to.",
        "cast-helper": "Carries a naloxone kit from the chemist, and has used it twice.",
        found: "You get the door open. {kin} is on the floor, lips blue, breathing slow. {helper} across the landing carries a naloxone kit.",
        "call:label": "Phone 999",
        "call:then": "The call handler talks you through putting {him} on {his} side and breathing for {him}. The paramedics are there in twelve minutes.",
        "naloxone:label": "Run for {helper}'s naloxone",
        "naloxone:then": "{helper} comes across the landing, jabs the naloxone into {kin}'s thigh, waits, and gives a second one. {kin} gasps and opens {his} eyes.",
        "treatment:label": "Get {him} into treatment today",
        "treatment:then": "You and {helper} go down to the drug service with {kin} and wait to be seen.",
        "treatment:failed": "The drug service can see {him} for an assessment in three weeks.",
        clinic: "They start {him} on a methadone prescription that day, and give you a naloxone kit of your own to keep in the house. It is a start.",
        waitlist: "{kin} has an appointment in three weeks. Until then {he} stays at home, and there is a naloxone kit on top of the bathroom cabinet.",
      },
    },
    {
      title: "The Overdose",
      lines: {
        aim: "Keep {kin} alive.",
        intro: "Your {kinWord} {kin} has been using for a while. Everybody in the family knows and nobody says it. This morning the bathroom door is locked and {he} doesn't answer.",
        threat: "People die of this every week. Someone who has stopped breathing has minutes.",
        partner: "Your {partnerKin} {partner} can't stop crying, and asks what you're going to do about {kin} now.",
        "kin-partner": "What do we do about {kin}? We can't go through this again.",
        "cast-kin": "Your {kinWord}, who has been using.",
        "cast-helper": "Lives close by, and knows what to do for an overdose.",
        found: "You get the door open. {kin} is on the floor, lips blue, breathing slow. {helper} next door knows what to do.",
        "call:label": "Call an ambulance",
        "call:then": "The ambulance comes. The crew give {him} an injection, and {he} comes round, sick and angry.",
        "naloxone:label": "Run for {helper}",
        "naloxone:then": "{helper} comes at a run, gets {kin} breathing again, and stays until {he} opens {his} eyes.",
        "wake:label": "Try to wake {him} yourself",
        "wake:then": "You get {him} on {his} side and shout {his} name and rub {his} breastbone hard with your knuckles, and {he} groans and opens {his} eyes.",
        "wake:failed": "You shout {his} name and shake {him}, and {he} doesn't wake. The snoring sound has gone quieter.",
        worse: "{kin} won't wake, and {his} breathing has nearly stopped. There isn't much time.",
        back: "{kin} is awake, shaking and sick. {He} says {he} only used a little, and that it won't happen again.",
        next: "{kin} is sitting at the kitchen table in a blanket, saying sorry, saying it was a one-off. What does the family do now?",
        "treatment:label": "Get {him} into treatment today",
        "treatment:then": "You spend the afternoon on the phone, going down a list of places that might take {him}.",
        "treatment:failed": "Every place has a waiting list.",
        "out:label": "Tell {him} {he} can't live here while {he} uses",
        "out:then": "You tell {kin} {he} has to go. {He} packs a bag without a word and goes.",
        "stay:label": "Let {him} stay, where you can keep an eye on {him}",
        "stay:then": "You tell {kin} {he} can stay. {He} goes to bed and sleeps until evening.",
        clinic: "There is a place that will take {him}, and you take {him} there before {he} can change {his} mind. It is a start.",
        waitlist: "{kin}'s name is on a waiting list. Until then {he} stays at home, and you check on {him} every hour.",
        gone: "{kin} is staying with a friend across town. {He} doesn't answer the phone, but {he} texts once, late, to say {he} is alive.",
        kept: "{kin} sleeps at home tonight. You lie awake listening for the bathroom door. Nothing is fixed, but {he} is alive.",
        alone: "By evening {kin} is up and about, pale and quiet, as if nothing happened. Nobody in the family talks about it.",
      },
    },
  ],
};
