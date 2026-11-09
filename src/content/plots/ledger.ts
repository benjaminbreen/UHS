import { B, CHINA, dueOf, EGYPT, MESOPOTAMIA, partnerWords, pickOf, temper, trade, within } from "./common";
import type { Condition, PlotTemplate } from "./types";

const fired = (id: string): Condition => ({ type: "fired", id });

/** The day's figures won't balance, and you have to find out why. */
export const ledger: PlotTemplate = {
  id: "ledger",
  shape: "work",
  look: {
    emblem: "desk",
    palette: { ink: "#12100c", fill: "#2a2418", edge: "#6a5434", light: "#f0eadc", accent: "#e8a840" },
  },
  weight: (c) => (trade(c, /scribe|clerk|notary|office-worker|civil-servant|tax-collector/) ? 0.7 * temper(c, "conscientiousness") : 0),
  cast: () => ({}),
  begin: (c) => {
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const chief = within(c, { years: [B(3300), B(300)], bounds: MESOPOTAMIA }) ? "the temple administrator"
      : within(c, { years: [B(3000), B(30)], bounds: EGYPT }) ? "the overseer of the granary"
      : within(c, { years: [B(221), 1912], bounds: CHINA }) ? "the chief clerk" : "your superior";
    return {
      deadline,
      words: {
        due,
        chief,
        Chief: chief.replace(/^./, (x) => x.toUpperCase()),
        error: pickOf(c, ["one entry was copied twice", "a seven was copied as a one", "two lines were added into the wrong column", "one delivery was never written down at all"], "ledger-error"),
        ...p.words,
      },
      refs: p.refs,
    };
  },
  opening: [{ type: "choose", line: "short", choices: [{ id: "search", check: { stat: "wit", odds: 0.55 } }, { id: "fudge" }, { id: "report" }] }],
  developments: [
    {
      id: "whose",
      when: { type: "all", of: [fired("search"), { type: "not", of: fired("search:failed") }, { type: "since", hours: 2 }] },
      then: [{ type: "choose", line: "whose", choices: [{ id: "name" }, { id: "fix" }] }],
    },
    {
      id: "again",
      when: { type: "all", of: [fired("search:failed"), { type: "since", hours: 2 }] },
      then: [{ type: "choose", line: "again", choices: [{ id: "fudge" }, { id: "report" }] }],
    },
  ],
  endings: [
    { id: "named", when: fired("name") },
    { id: "fixed", when: fired("fix") },
    { id: "fudged", when: fired("fudge") },
    { id: "reported", when: fired("report") },
    { id: "open", when: { type: "due" } },
  ],
  wording: [
    {
      // Temple and palace scribes kept barley accounts on clay, totalled at the end of each period.
      scope: { years: [B(3300), B(300)], bounds: MESOPOTAMIA },
      title: "The Accounts",
      lines: {
        aim: "Find out why the barley accounts don't balance.",
        intro: "The tablets recording the barley paid out to the workers don't match what left the storehouse. The difference isn't large, but someone will ask about it, and the tablets carry your name.",
        threat: "If it can't be explained, the shortfall will be blamed on you.",
        partner: "Your {partnerKin} {partner} says to eat something and then count it again.",
        "kin-partner": "Did you find it?",
        open: "The day ends and the totals still don't agree. It will be the first thing you see tomorrow.",
      },
    },
    {
      scope: { years: [B(3000), B(30)], bounds: EGYPT },
      title: "The Accounts",
      lines: {
        aim: "Find out why the granary accounts don't balance.",
        intro: "The grain delivered to the granary doesn't match the grain written down. The difference isn't large, but the overseer checks the papyrus, and the entries are in your hand.",
        threat: "If it can't be explained, the shortfall will be blamed on you.",
        partner: "Your {partnerKin} {partner} has brought you bread and beer so you don't stop.",
        "kin-partner": "Did you find it?",
        open: "The day ends and the figures still don't agree. It will be the first thing you see tomorrow.",
      },
    },
    {
      scope: { years: [B(221), 1912], bounds: CHINA },
      title: "The Accounts",
      lines: {
        aim: "Find out why the register doesn't balance.",
        intro: "The grain register for the county doesn't match what's in the granary. The difference is small, but the magistrate's office will check it, and it's your brush on the page.",
        threat: "If it can't be explained, the shortfall will be blamed on you.",
        partner: "Your {partnerKin} {partner} has made tea and left it beside the abacus.",
        "kin-partner": "Did you find it?",
        open: "The day ends and the register still doesn't balance. It will be the first thing you see tomorrow.",
      },
    },
    {
      title: "The Accounts",
      lines: {
        aim: "Find out why the books don't balance.",
        intro: "The figures you're responsible for don't add up. The difference is small, but someone will check, and the entries are yours.",
        threat: "If it can't be explained, the difference will be blamed on you.",
        partner: "Your {partnerKin} {partner} says to take a break and come back to it.",
        "kin-partner": "Did you find it?",
        short: "The totals are out, not by much. You could go through it line by line, add an entry that makes it agree, or take it to {chief} as it is.",
        "search:label": "Go through it line by line",
        "fudge:label": "Make the totals agree",
        "report:label": "Take it to {chief} as it is",
        whose: "There it is: {error}. And it isn't your hand. The junior clerk made that entry, a boy with a mother to keep and no other work.",
        "name:label": "Tell {chief} whose it was",
        "fix:label": "Correct it and say nothing",
        again: "You've added the columns three times and got three different answers.",
        named: "{Chief} thanks you and docks the junior clerk's pay. Your name is clear, and the boy won't look at you.",
        fixed: "You correct it in your own hand and the totals agree. Nobody will know, and the boy will never find out he made a mistake.",
        fudged: "You add a line that makes the totals agree. It balances now. If something really is missing, the next count will show it, and it will be blamed on you.",
        reported: "{Chief} sighs and orders the store counted again. Your name is clear, but people will know you couldn't find it yourself.",
        open: "The day ends and the figures still don't agree. It will be the first thing you see tomorrow.",
      },
    },
  ],
};
