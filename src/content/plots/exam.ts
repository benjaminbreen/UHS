import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { amountOf, CHINA, dueOf, KOREA, notable, partnerWords, pronounWords, VIETNAM, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const EXAMS = [{ years: [960, 1905], bounds: CHINA }, { years: [1392, 1894], bounds: KOREA }, { years: [1075, 1919], bounds: VIETNAM }] as const;

const candidateOf = (c: PlotContext) => c.actors.find((a) =>
  a.kind === "human" && !a.dead && a.id !== c.player.id && a.householdId === c.player.householdId &&
  sexOf(a) === "male" && (a.age ?? 30) >= 14 && (a.age ?? 30) <= 40);

/** A young man of the household is to sit the civil examinations, and needs
 * someone of standing to vouch for him first. */
export const exam: PlotTemplate = {
  id: "exam",
  look: {
    emblem: "slate",
    palette: { ink: "#10141a", fill: "#1c2430", edge: "#3a5a7a", light: "#e6ecf2", accent: "#c0462e" },
  },
  payee: "patron",
  weight: (c) => (within(c, ...EXAMS) && candidateOf(c) && notable(c) ? 0.8 : 0),
  cast: (c) => {
    const patron = notable(c);
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
  opening: [{ type: "approach", role: "patron", line: "terms" }],
  developments: [
    {
      id: "nerves",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "brought", role: "patron" } }] },
      then: [{ type: "card", line: "nerves" }],
    },
  ],
  endings: [
    { id: "vouched", when: { type: "settled" } },
    { id: "favoured", when: { type: "brought", role: "patron" } },
    { id: "gone", when: { type: "gone", role: "patron" } },
    { id: "missed", when: { type: "due" } },
  ],
  wording: [
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
        terms: "I'll put my name to {candidate}'s guarantee. These things cost something to arrange. {amount}, {due}.",
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
        terms: "I can vouch for your family's record. But you understand, these things cost something. {amount}, {due}.",
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
        terms: "I'll vouch for {candidate}. These things cost something. {amount}, {due}.",
        nerves: "{candidate} is reciting under his breath and can't eat.",
        vouched: "{patron} gives the guarantee. {candidate} will sit the examination.",
        favoured: "{patron} accepts your gift and gives the guarantee without asking for more.",
        gone: "With {patron} gone, you'll have to find someone else before the next examination.",
        missed: "No guarantee came, so {candidate} can't sit the examination this time.",
      },
    },
  ],
};
