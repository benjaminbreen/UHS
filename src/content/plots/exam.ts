import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { amountOf, CHINA, dueOf, JAPAN, KOREA, notable, partnerWords, pronounWords, VIETNAM, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const EXAMS = [{ years: [960, 1905], bounds: CHINA }, { years: [1392, 1894], bounds: KOREA }, { years: [1075, 1919], bounds: VIETNAM }] as const;
const INDIA = [68, 6, 97, 36] as const;
const JUKEN = { years: [1960, 2100], bounds: JAPAN } as const;
const SUNEUNG = { years: [2000, 2100], bounds: KOREA } as const;
const REOPENED = { years: [1977, 1979], bounds: CHINA } as const;
const GAOKAO = { years: [1990, 2100], bounds: CHINA } as const;
const JEE = { years: [1990, 2100], bounds: INDIA } as const;
const ENTRANCE = [JUKEN, SUNEUNG, REOPENED, GAOKAO, JEE];

// The 1977 exam took the sent-down generation, up to thirty.
const candidateOf = (c: PlotContext) => c.actors.find((a) =>
  a.kind === "human" && !a.dead && a.id !== c.player.id && a.householdId === c.player.householdId && (within(c, ...ENTRANCE)
    ? (a.age ?? 30) >= 16 && (a.age ?? 30) <= (within(c, REOPENED) ? 30 : 19)
    : sexOf(a) === "male" && (a.age ?? 30) >= 14 && (a.age ?? 30) <= 40));

/** Degree holders, who alone could vouch, were men. */
const patronOf = (c: PlotContext) => within(c, ...ENTRANCE) ? notable(c) : notable(c, (a) => sexOf(a) === "male");

/** The lines every modern entrance exam shares: a place with a tutor, not a guarantee. */
const cram = {
  aim: "Pay {patron} for a place in the classes, or offer {him} something else, {due}.",
  "kin-partner": "Has {patron} said yes? {candidate} hasn't slept.",
  "cast-patron": "Runs evening classes for the exam, and has one place left.",
  terms: "I have one place left in my last course before the exam. It's {amount}, {due}.",
  vouched: "{candidate} gets the last place in {patron}'s course, and goes every evening until the exam.",
  favoured: "{patron} accepts your offer and takes {candidate} on without mentioning the fee again.",
  gone: "With {patron} gone, {candidate} will have to study alone.",
  missed: "No place came through, so {candidate} studies alone at the kitchen table.",
  "plead:label": "Ask {him} to take {candidate} as a favour",
  "plead:then": "You tell {patron} how hard {candidate} has worked, and how little the household has. {He} looks at {candidate}'s marks for a long time, then says {he} will take {candidate} for nothing.",
  "plead:failed": "{patron} says everyone has worked hard, and everyone pays.",
  pleaded: "{patron} takes {candidate} on as a favour. One day {he} will ask a favour back.",
  refused: "{patron} won't take {candidate} now, at any price. {candidate} will have to study alone.",
};

/** A young man of the household is to sit the civil examinations, and needs
 * someone of standing to vouch for him first. */
export const exam: PlotTemplate = {
  id: "exam",
  shape: "household",
  look: {
    emblem: "candidate",
    palette: { ink: "#10141a", fill: "#1c2430", edge: "#3a5a7a", light: "#e6ecf2", accent: "#c0462e" },
  },
  payee: "patron",
  weight: (c) => ((within(c, ...EXAMS) || within(c, ...ENTRANCE)) && candidateOf(c) && patronOf(c) ? 0.8 : 0),
  cast: (c) => {
    const patron = patronOf(c);
    return patron && candidateOf(c) && { patron };
  },
  begin: (c, cast) => {
    const patron = cast.patron!;
    const candidate = candidateOf(c)!;
    const owed = 3 + Math.floor(random(c.seed, "plot", "exam", "owed") * 4);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        patron: patron.name,
        patronRole: patron.role.toLowerCase(),
        candidate: candidate.name,
        amount: amountOf(c, owed),
        due,
        ...pronounWords(patron),
        ...p.words,
      },
      refs: { patron: patron.id, candidate: candidate.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "terms", focus: "patron", from: "patron", choices: [{ id: "pay" }, { id: "gift" }, { id: "plead", check: { stat: "wit", odds: 0.45 } }] }],
  developments: [
    {
      id: "nerves",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "brought", role: "patron" } }] },
      then: [{ type: "card", line: "nerves" }],
    },
  ],
  endings: [
    { id: "vouched", when: { type: "settled" } },
    { id: "favoured", when: { type: "all", of: [{ type: "fired", id: "gift" }, { type: "brought", role: "patron" }] } },
    { id: "refused", when: { type: "all", of: [{ type: "fired", id: "plead:failed" }, { type: "since", hours: 2 }] } },
    { id: "pleaded", when: { type: "all", of: [{ type: "fired", id: "plead" }, { type: "since", hours: 2 }] } },
    { id: "gone", when: { type: "gone", role: "patron" } },
    { id: "missed", when: { type: "due" } },
  ],
  wording: [
    {
      // Ronin, "masterless samurai", is the word for a student who failed and studies a year to try again.
      scope: JUKEN,
      title: "The Entrance Exams",
      lines: {
        ...cram,
        intro: "{candidate}'s university entrance exams are a few weeks away. Everyone in {candidate}'s class goes to a juku, a cram school, in the evenings, and {patron} runs the best one around here.",
        threat: "Fail, and {candidate} spends a year as a ronin, studying alone to try again.",
        partner: "Your {partnerKin} {partner} has bought a charm for passing exams at the shrine.",
        nerves: "{candidate} is at the kitchen table at two in the morning with a headband on, and hardly eats.",
      },
    },
    {
      // On the day of the college entrance exam, flights are held during the English listening test and police drive late students in.
      scope: SUNEUNG,
      title: "The College Entrance Exam",
      lines: {
        ...cram,
        intro: "{candidate} sits the suneung, the college entrance exam, in November. Everyone else's children have been at a hagwon, a private cram school, every night for years, and {patron} runs the one with the best results.",
        threat: "One day decides which university, and people say which university decides the rest of your life.",
        partner: "Your {partnerKin} {partner} has been praying at the temple every morning, a hundred days of prayers for the exam.",
        nerves: "{candidate} gets home from the study room after midnight. On exam day the planes will be held on the ground during the listening test.",
      },
    },
    {
      // In winter 1977 5.7 million people sat the first university exam in eleven years; about 270,000 got places, and old textbooks sold out.
      scope: REOPENED,
      title: "The Exam Is Back",
      lines: {
        ...cram,
        aim: "Pay {patron} for the loan of the textbooks, or offer {him} something else, {due}.",
        intro: "The universities are taking students by examination again, for the first time in eleven years. {candidate} has a few weeks to relearn everything from school, and there are no textbooks left in the shops.",
        threat: "Millions are sitting it. Fewer than one in twenty will get a place.",
        partner: "Your {partnerKin} {partner} has been asking everyone you know for old school notes.",
        "kin-partner": "Will {patron} lend us the books? {candidate} has nothing to study from.",
        "cast-patron": "Kept a set of the old maths, physics and chemistry textbooks hidden through the Cultural Revolution.",
        terms: "I can lend {candidate} my textbooks until the exam. Everyone wants them. It's {amount}, {due}.",
        nerves: "{candidate} is copying out formulas from borrowed notes by lamplight, and hardly eats.",
        vouched: "{candidate} studies from {patron}'s textbooks every night until the exam, and gives them back with every page worn soft.",
        favoured: "{patron} accepts your offer and lends {candidate} the books without mentioning the fee again.",
        gone: "With {patron} gone, {candidate} will have to study from whatever notes can be borrowed.",
        missed: "No books came, so {candidate} studies from memory and borrowed notes.",
        "plead:then": "You tell {patron} how hard {candidate} has worked, and how much the exam means after all these years. {He} goes to the back room and comes out with the books.",
        pleaded: "{patron} lends the books as a favour. One day {he} will ask a favour back.",
        refused: "{patron} won't lend the books now, at any price. {candidate} will have to study from borrowed notes.",
      },
    },
    {
      // Cities stop building work near exam halls in gaokao week, and some neighbourhoods ban car horns.
      scope: GAOKAO,
      title: "The Gaokao",
      lines: {
        ...cram,
        intro: "The gaokao, the national university entrance exam, is in June. {candidate} has been studying for it for three years, and {patron} gives private lessons to the best students.",
        threat: "One score decides which university will take {candidate}, or whether any will.",
        partner: "Your {partnerKin} {partner} has been cooking {candidate}'s favourite food every night for a month.",
        nerves: "{candidate} studies until midnight and gets up at six. The whole street has promised to keep the noise down in exam week.",
      },
    },
    {
      // Engineering hopefuls go to coaching classes for the IIT entrance exam, most famously in Kota, Rajasthan.
      scope: JEE,
      title: "The Entrance Exam",
      lines: {
        ...cram,
        intro: "{candidate} wants to sit the IIT entrance exam for engineering. Everyone who gets in has been to coaching classes, and {patron} runs the best ones around here.",
        threat: "Hundreds of thousands sit it for a few thousand places.",
        partner: "Your {partnerKin} {partner} has already told the relatives that {candidate} will be an engineer.",
        nerves: "{candidate} is doing practice papers at the kitchen table until two in the morning.",
      },
    },
    {
      // Qing candidates for the county examination needed a stipendiary licentiate to guarantee their family and conduct.
      scope: { years: [960, 1905], bounds: CHINA },
      title: "The Examination",
      lines: {
        aim: "Pay {patron} for the guarantee, or bring {patron} something of your own work as a gift, {due}.",
        intro: "{candidate} has studied for years, and the county examination is close. No candidate is let in without a guarantee from a degree holder that his family is respectable and he isn't in mourning. {patron} the {patronRole} can give it.",
        threat: "Without the guarantee, {candidate} waits another two or three years for the next examination.",
        partner: "Your {partnerKin} {partner} has sold a bracelet to pay for the paper and ink.",
        "kin-partner": "Has {patron} agreed yet? {candidate} hasn't slept.",
        "cast-patron": "A degree holder whose guarantee {candidate} needs to sit the examination.",
        terms: "I'll put my name to {candidate}'s guarantee. These things cost something to arrange: {amount}, {due}.",
        nerves: "{candidate} is reciting the classics under his breath and can't eat.",
        vouched: "{patron} signs the guarantee. {candidate} will sit the examination. Whatever happens, your household has a candidate.",
        favoured: "{patron} accepts your gift and signs the guarantee without mentioning the fee again.",
        gone: "With {patron} gone, you'll have to find another guarantor before the next examination.",
        missed: "There's no guarantee, so {candidate} can't sit the examination this time. He shuts himself in with his books.",
      },
    },
    {
      // Joseon candidates handed in a record of their four ancestors to prove they were eligible to sit.
      scope: { years: [1392, 1894], bounds: KOREA },
      title: "The Examination",
      lines: {
        aim: "Pay {patron} to vouch for the family record, or bring {patron} something of your own work as a gift, {due}.",
        intro: "{candidate} is to sit the state examination. He has to hand in a record of his father, grandfather, great-grandfather and his mother's father, and someone of standing must vouch for it. {patron} the {patronRole} can.",
        threat: "Without it, {candidate} can't sit, and your household loses its chance at office for years.",
        partner: "Your {partnerKin} {partner} has gone through the family's papers twice.",
        "kin-partner": "Has {patron} agreed to vouch for us? {candidate} keeps asking.",
        "cast-patron": "A person of standing whose word on the family record {candidate} needs.",
        terms: "I can vouch for your family's record. But you understand, these things cost something: {amount}, {due}.",
        nerves: "{candidate} is copying out practice answers by lamplight and can't eat.",
        vouched: "{patron} vouches for the record. {candidate} will sit the examination.",
        favoured: "{patron} accepts your gift and vouches for the record without mentioning payment.",
        gone: "With {patron} gone, you'll have to find someone else to vouch before the next examination.",
        missed: "Nobody vouched for the record in time, so {candidate} can't sit the examination this year.",
      },
    },
    {
      title: "The Examination",
      lines: {
        aim: "Pay {patron} for the guarantee, or bring {patron} something of your own work as a gift, {due}.",
        intro: "{candidate} has been studying for the examinations, and someone of standing has to vouch for him before he can sit. {patron} the {patronRole} can.",
        threat: "Without it, {candidate} waits years for the next chance.",
        partner: "Your {partnerKin} {partner} has spent the household's savings on his books.",
        "kin-partner": "Has {patron} agreed? {candidate} can't think of anything else.",
        "cast-patron": "A person of standing whose guarantee {candidate} needs.",
        terms: "I'll vouch for {candidate}. These things cost something: {amount}, {due}.",
        nerves: "{candidate} is reciting under his breath and can't eat.",
        vouched: "{patron} gives the guarantee. {candidate} will sit the examination.",
        favoured: "{patron} accepts your gift and gives the guarantee without asking for more.",
        gone: "With {patron} gone, you'll have to find someone else before the next examination.",
        missed: "No guarantee came, so {candidate} can't sit the examination this time.",
        "pay:label": "Agree to the fee",
        "pay:then": "You tell {patron} you'll bring {amount}. Now you have to find it.",
        "gift:label": "Offer something of your own work",
        "gift:then": "You say you'll bring {patron} something of your own making once the day's work is done. {He} raises an eyebrow, but doesn't say no.",
        "plead:label": "Remind {him} of an old family tie",
        "plead:then": "You remind {patron} that your grandfathers studied under the same teacher. {He} is quiet a moment, then says that between old families the fee can be forgotten.",
        "plead:failed": "You remind {patron} of an old tie between your families. {He} says {he} remembers no such thing, and that you insult {him} by asking.",
        pleaded: "{patron} signs the guarantee as a favour between families. One day {he} will ask a favour back.",
        refused: "{patron} won't put {his} name to {candidate}'s guarantee now, at any price. {candidate} will have to wait for the next examination.",
      },
    },
  ],
};
