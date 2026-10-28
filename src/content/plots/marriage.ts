import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { ruled } from "../history/order";
import { amountOf, dueOf, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const youthOf = (c: PlotContext) => c.actors.find((a) =>
  a.kind === "human" && !a.dead && a.id !== c.player.id && a.householdId === c.player.householdId &&
  (a.age ?? 30) >= 15 && (a.age ?? 30) <= 22 && !a.relations?.some((r) => r.kind === "partner"));

const inlawOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) >= 35);
  return pool.length ? pickOf(c, pool, "inlaw") : undefined;
};

/** A young member of the household marries into another, and the gifts
 * that make it a marriage must be ready. Which way the gifts go varies:
 * bride-wealth to the bride's kin, or goods that go with her. */
export const marriage: PlotTemplate = {
  id: "marriage",
  look: {
    emblem: "feast",
    palette: { ink: "#1a1214", fill: "#2c1c20", edge: "#7a3a44", light: "#f2e2e2", accent: "#d06a6a" },
  },
  payee: "inlaw",
  weight: (c) => (c.setting && !ruled(c.setting) && (c.player.age ?? 30) >= 32 && youthOf(c) && inlawOf(c) ? 0.8 : 0),
  cast: (c) => {
    const inlaw = inlawOf(c);
    return inlaw && youthOf(c) && { inlaw };
  },
  begin: (c, cast) => {
    const inlaw = cast.inlaw!;
    const youth = youthOf(c)!;
    const owed = 4 + Math.floor(random(c.seed, "plot", "marriage", "owed") * 4);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const bride = sexOf(youth) === "female";
    return {
      deadline,
      owed,
      words: {
        inlaw: inlaw.name,
        inlawRole: inlaw.role.toLowerCase(),
        youth: youth.name,
        amount: amountOf(c, owed),
        due,
        match: bride ? `${youth.name} is to marry into ${inlaw.name}'s household` : `${youth.name} is to marry a daughter of ${inlaw.name}'s household`,
        gifts: bride ? "the goods that go with her" : "the bride-gifts",
        spouse: bride ? "her husband" : "his bride",
        ...pronounWords(inlaw),
        ...p.words,
      },
      refs: { inlaw: inlaw.id, youth: youth.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "inlaw", line: "terms" }],
  developments: [
    {
      id: "doubt",
      when: { type: "all", of: [{ type: "since", hours: 5 }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "doubt", focus: "inlaw" }],
    },
    {
      id: "agreed",
      when: { type: "settled" },
      then: [{ type: "card", line: "agreed", focus: "inlaw" }, { type: "gather", at: "inlaw", when: "evening", label: "gather", scene: "wedding", aim: "aim-wed" }],
    },
    {
      id: "wed",
      when: { type: "came" },
      then: [{ type: "regard", role: "inlaw", delta: 2 }],
    },
    {
      id: "snub",
      when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }] },
      then: [{ type: "regard", role: "inlaw", delta: -2 }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "inlaw" } },
    { id: "married", when: { type: "came" } },
    { id: "absent", when: { type: "fired", id: "snub" } },
    { id: "broken", when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }] } },
  ],
  wording: [
    {
      title: "A Marriage Arranged",
      lines: {
        aim: "Bring {gifts} to {inlaw}, {due}, so the marriage can go ahead.",
        intro: "{match}. It was agreed between the old people long ago, and now it is time. {inlaw} the {inlawRole} is waiting for {gifts}.",
        threat: "If they don't come, {inlaw}'s household will look elsewhere, and {youth} will have to wait.",
        partner: "Your {partnerKin} {partner} has been counting what the household has, twice over.",
        "kin-partner": "Have you seen {inlaw} yet? {youth} can't stop asking.",
        "cast-inlaw": "Head of the other household in {youth}'s marriage, and waiting for {gifts}.",
        terms: "We're all agreed, then. {amount}, as we said. Then the young ones can be married.",
        doubt: "{inlaw} was seen talking with another household that has someone of marrying age.",
        agreed: "{inlaw} takes the gifts in front of both households. The wedding is {meet}, at {inlaw}'s house.",
        "aim-wed": "Go to {inlaw}'s house {meet} for {youth}'s wedding.",
        gather: "At {youth}'s wedding",
        married: "Both households are there, and the neighbours crowd round. {youth} and {spouse} are led in, there's food and singing, and the old people make speeches. The two households are kin now.",
        absent: "{youth} was married without you there. {inlaw}'s household took it as an insult, and {youth} hasn't forgiven you either.",
        gone: "With {inlaw} gone, the match is off until someone else in that household takes it up.",
        broken: "Nothing came, so {inlaw} has called the marriage off. {youth} won't speak to you.",
      },
    },
  ],
};
