import { random } from "../../core/random";
import { amountOf, B, dueOf, elderOf, EUROPE, MESOPOTAMIA, neighbours, partnerWords, pronounWords, within, working } from "./common";
import type { Effect, PlotContext, PlotTemplate } from "./types";

// English tithes in kind lasted until the Tithe Commutation Act of 1836.
const CHRISTIAN = { years: [800, 1836], bounds: EUROPE } as const;
const TEMPLE = { years: [B(626), B(484)], bounds: MESOPOTAMIA } as const;

const collectorOf = (c: PlotContext) => neighbours(c).find((a) => (a.age ?? 30) >= 30 && (a.age ?? 30) < 60);

const answer: Effect = {
  type: "choose", line: "answer", focus: "official",
  choices: [
    { id: "vouch", check: { stat: "agreeableness", odds: 0.55 } },
    { id: "recount", check: { stat: "conscientiousness", skill: "farming", odds: 0.5 } },
    { id: "appeal", check: { stat: "wit", skill: "speech", odds: 0.35 } },
    { id: "pay" },
  ],
};
const not = (id: string) => ({ type: "not", of: { type: "fired", id } }) as const;

/** The church's or the temple's tenth, and a dispute over how much of it is owed. */
export const tithe: PlotTemplate = {
  id: "tithe",
  shape: "claim",
  look: {
    emblem: "barn",
    palette: { ink: "#12140f", fill: "#1e2418", edge: "#4a5a2e", light: "#eaeed8", accent: "#c8a648" },
  },
  payee: "official",
  weight: (c) => {
    if (!working(c) || !within(c, CHRISTIAN, TEMPLE)) return 0;
    const official = collectorOf(c);
    return official && elderOf(c, official) ? 0.6 : 0;
  },
  cast: (c) => {
    const official = collectorOf(c);
    const witness = official && elderOf(c, official);
    return official && witness && { official, witness };
  },
  begin: (c, cast) => {
    const official = cast.official!, witness = cast.witness!;
    const owed = 2 + Math.floor(random(c.seed, "plot", "tithe", "owed") * 4);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        official: official.name,
        witness: witness.name,
        amount: amountOf(c, owed),
        due,
        ...pronounWords(official),
        ...p.words,
      },
      refs: { official: official.id, witness: witness.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "official", line: "claim" }],
  developments: [
    { id: "ask-official", when: { type: "all", of: [{ type: "talked", role: "official" }, not("ask-witness"), not("ask-late")] }, then: [answer] },
    { id: "ask-witness", when: { type: "all", of: [{ type: "talked", role: "witness" }, not("ask-official"), not("ask-late")] }, then: [answer] },
    { id: "ask-late", when: { type: "all", of: [{ type: "since", hours: 1 }, not("ask-official"), not("ask-witness"), { type: "not", of: { type: "settled" } }] }, then: [answer] },
    { id: "paying", when: { type: "fired", id: "pay" }, then: [{ type: "seize", role: "official" }] },
    { id: "short", when: { type: "fired", id: "recount:failed" }, then: [{ type: "seize", role: "official" }] },
    {
      id: "remind",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "remind", focus: "official" }],
    },
    {
      id: "seize",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "approach", role: "official", line: "seize" }, { type: "seize", role: "official" }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "official" } },
    { id: "short", when: { type: "fired", id: "short" } },
    { id: "counted", when: { type: "all", of: [{ type: "fired", id: "vouch" }, not("vouch:failed")] } },
    { id: "recounted", when: { type: "all", of: [{ type: "fired", id: "recount" }, not("recount:failed")] } },
    { id: "excused", when: { type: "all", of: [{ type: "fired", id: "appeal" }, not("appeal:failed")] } },
    { id: "paid", when: { type: "all", of: [{ type: "settled" }, not("seize")] } },
    { id: "seized", when: { type: "fired", id: "seize" } },
  ],
  wording: [
    {
      // The tithe was taken in kind in the field: every tenth sheaf, set aside before the rest could be carried home.
      scope: CHRISTIAN,
      title: "The Tenth Sheaf",
      lines: {
        aim: "Pay what {official} says the church is short, or get {witness} to vouch for the count, {due}.",
        intro: "{official} collects the tithe for the church: one sheaf in every ten, set aside in the field before the harvest goes home. {He} says your household's tenths were short this year, and that you hid the difference.",
        threat: "If you don't make it up, {he} will take it from your store, and the priest will hear that you cheat the church.",
        partner: "Your {partnerKin} {partner} says {witness} watched the sheaves being counted.",
        "kin-partner": "{witness} was in the field when the tenths were set out. Go and ask.",
        "cast-official": "Collects the church's tithe, and says yours was short.",
        "cast-witness": "Was in the field when the sheaves were counted, and everyone trusts {witness}'s eye.",
        claim: "Your tenths were short. I counted. The church is owed another {amount}, and I want it {due}.",
        remind: "{official} has told the priest, and the priest looks at you at the church door.",
        seize: "You didn't make it up, so I'm taking the church's share from your store.",
        counted: "{witness} tells {official} that the sheaves were counted fairly. {official} lets it go, with bad grace.",
        paid: "You make up the tithe. {official} marks it paid.",
        seized: "{official} takes the church's share from your store.",
        gone: "With {official} gone, nobody comes back about the tithe.",
        answer: "{official} says the church is short, and {he} won't go away without it. What do you do?",
        "vouch:label": "Ask {witness} to vouch for the count",
        "vouch:failed": "{witness} didn't watch every sheaf being set out, and won't swear to the count.",
        "recount:label": "Take {official} back to the field and count the stubble",
        "recount:then": "You walk the field with {official}, counting the rows where the stooks stood, ten by ten.",
        "recount:failed": "The count comes out against you. You missed a row of stooks.",
        "appeal:label": "Go over {his} head to the priest",
        "appeal:failed": "The priest hears you out, then says the tithe must be paid in full.",
        "pay:label": "Make it up from the store",
        short: "{official} takes the missing tenth from your store, and tells the priest you tried to cheat the church.",
        recounted: "Ten by ten, the rows come out right. {official} has to admit the tenths were fair, and goes off red in the face.",
        excused: "The priest hears about the bad year, and tells {official} to let it go this once. {official} does, and won't forget it.",
      },
    },
    {
      // Neo-Babylonian temples like the Eanna at Uruk and the Ebabbar at Sippar took a tithe, the eshru, from the harvest and the herds.
      scope: TEMPLE,
      title: "The Temple's Tithe",
      lines: {
        aim: "Pay what {official} says the temple is short, or get {witness} to vouch for the count, {due}.",
        intro: "{official} collects the temple's tithe, the tenth part of the harvest owed to the god's house. {He} says your household's tithe came in short, and the temple's scribes have written it down.",
        threat: "The temple's scribes keep a record of every debt. If you don't make it up, {he} will take it from your store.",
        partner: "Your {partnerKin} {partner} says {witness} saw the grain measured.",
        "kin-partner": "{witness} saw the grain measured out. Go and ask.",
        "cast-official": "Collects the temple's tithe, and says yours was short.",
        "cast-witness": "Saw your grain measured, and the temple's people respect {witness}.",
        claim: "The temple's scribes say your tithe was short. Another {amount} is owed to the god's house, {due}.",
        remind: "{official} says the temple's scribes have asked about your household by name.",
        seize: "Nothing more came, so I'm taking the god's share from your store.",
        counted: "{witness} swears the grain was measured fairly. {official} has the scribes correct the tablet.",
        paid: "You make up the tithe. The scribes record it as paid.",
        seized: "{official} takes the god's share from your store.",
        gone: "With {official} gone, nobody comes back about the tithe.",
        answer: "{official} says the god's house is short, and the scribes are waiting. What do you do?",
        "vouch:label": "Ask {witness} to swear to the measuring",
        "vouch:failed": "{witness} didn't see every measure poured, and won't swear to the god about it.",
        "pay:label": "Make it up from the store",
        "recount:label": "Have the grain heap measured again",
        "recount:then": "The heap is measured again in front of the temple's scribe, basket by basket.",
        "recount:failed": "The count comes out against you. The scribe writes it down.",
        "appeal:label": "Go over {his} head to the temple's administrator",
        "appeal:failed": "The administrator won't hear a farmer against a collector.",
        short: "{official} takes the god's share from your store, and the scribes write that your household was short.",
        recounted: "Basket by basket, the measure comes out right. {official} has the scribes correct the tablet, without looking at you.",
        excused: "The temple's administrator hears about the bad year and has the debt written off this once. {official} does as {he} is told.",
      },
    },
  ],
};
