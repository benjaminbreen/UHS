import type { ChoiceCard } from "./types";

const ALWAYS = { years: [-3000, 10001] } as const;
const QUILL = { years: [-3000, 1880] } as const;
const TYPEWRITER = { years: [1880, 1985] } as const;
const SCREEN = { years: [1985, 10001] } as const;

export const OFFICE_CARDS: ChoiceCard[] = [
  {
    id: "office-short",
    slot: "office-desk",
    scope: ALWAYS,
    evidence: "inferred",
    text: "The accounts come out a small sum short, and you can't find where.",
    choices: [
      {
        label: "Go back through every entry",
        note: "costs hours · you'll find it",
        then: [{ type: "minutes", n: 120 }, { type: "fatigue", n: 10 }, { type: "day", delta: 1 }],
        line: "You went back through every entry and found the mistake.",
      },
      {
        label: "Make up the difference with a correction",
        note: "quick · if an auditor looks, it'll look like theft",
        check: { stat: "wit", odds: 0.6 },
        then: [],
        line: "You booked a correction and nobody asked about it.",
        otherwise: [{ type: "day", delta: -2 }, { type: "pay", delta: -1 }],
        otherwiseLine: "The correction was noticed, and you had to explain it.",
      },
      {
        label: "Report it as it is",
        note: "honest · it looks careless",
        then: [{ type: "day", delta: -1 }],
        line: "You reported the books a little short.",
      },
    ],
  },
  {
    id: "office-cover",
    slot: "office-desk",
    who: "neighbour",
    as: "a colleague",
    scope: ALWAYS,
    evidence: "inferred",
    text: "{Name}, from the next desk, wants to leave early and asks you to finish their work and say they're out on an errand if anyone asks.",
    choices: [
      {
        label: "Cover for them",
        note: "more work for you · {name} owes you one",
        then: [{ type: "minutes", n: 60 }, { type: "fatigue", n: 5 }, { type: "regard", delta: 2 }],
        line: "You did {name}'s work as well as your own and kept quiet.",
      },
      {
        label: "Say no",
        note: "{name} won't like it",
        then: [{ type: "regard", delta: -1 }],
        line: "You told {name} to do their own work.",
      },
    ],
  },
  {
    id: "office-letter-book",
    slot: "office-desk",
    scope: QUILL,
    evidence: "inferred",
    text: "The principal wants a bill dated a week back, so a customer's credit looks better than it is.",
    choices: [
      {
        label: "Write it as asked",
        note: "keeps your place · your hand is on it",
        then: [{ type: "day", delta: 1 }],
        line: "You backdated the bill as you were told.",
      },
      {
        label: "Say you won't",
        note: "honest · you may not be kept on",
        then: [{ type: "day", delta: -2 }],
        line: "You refused to backdate the bill.",
      },
    ],
  },
  {
    id: "office-carbons",
    slot: "office-desk",
    scope: TYPEWRITER,
    evidence: "inferred",
    text: "You make a typing mistake on the last line of a long letter with four carbon copies behind it.",
    choices: [
      {
        label: "Type the whole thing again",
        note: "costs half an hour",
        then: [{ type: "minutes", n: 30 }, { type: "fatigue", n: 5 }],
        line: "You typed the letter and its carbons again.",
      },
      {
        label: "Erase it on every copy",
        note: "quick if you're careful · smudges show",
        check: { stat: "agility", odds: 0.55 },
        then: [{ type: "minutes", n: 10 }],
        line: "You erased the mistake on every copy, and it didn't show.",
        otherwise: [{ type: "day", delta: -1 }],
        otherwiseLine: "The erasures smudged and the letter came back to be done again.",
      },
    ],
  },
  {
    id: "office-crash",
    slot: "office-desk",
    scope: SCREEN,
    evidence: "inferred",
    text: "Your computer freezes, and you haven't saved since the morning.",
    choices: [
      {
        label: "Restart it and redo the work",
        note: "costs an hour",
        then: [{ type: "minutes", n: 60 }, { type: "fatigue", n: 5 }],
        line: "You restarted the computer and did the morning's work again.",
      },
      {
        label: "Call the help desk and wait",
        note: "they may get it back · or may not come at all",
        check: { stat: "extraversion", odds: 0.5 },
        then: [{ type: "minutes", n: 30 }],
        line: "The help desk got your work back.",
        otherwise: [{ type: "minutes", n: 90 }, { type: "day", delta: -1 }],
        otherwiseLine: "You waited most of the afternoon for the help desk.",
      },
    ],
  },
  {
    id: "office-late",
    slot: "office-boss",
    who: "official",
    as: "your supervisor",
    scope: ALWAYS,
    evidence: "inferred",
    text: "Just before you go home, {name} drops a pile of work on your desk. “I need this first thing tomorrow.”",
    choices: [
      {
        label: "Stay late and do it",
        note: "unpaid · {name} will remember",
        then: [{ type: "minutes", n: 150 }, { type: "fatigue", n: 15 }, { type: "regard", delta: 2 }],
        line: "You stayed late and finished it.",
      },
      {
        label: "Say it'll be done by noon",
        note: "you go home · {name} isn't pleased",
        then: [{ type: "regard", delta: -1 }],
        line: "You told {name} it would be done by noon tomorrow and went home.",
      },
    ],
  },
  {
    id: "office-credit",
    slot: "office-boss",
    who: "official",
    as: "your supervisor",
    scope: ALWAYS,
    evidence: "inferred",
    text: "{Name} presents your work to the people upstairs as their own.",
    choices: [
      {
        label: "Let it go",
        note: "keeps the peace",
        then: [],
        line: "You said nothing when {name} took credit for your work.",
      },
      {
        label: "Point out, politely, that you did it",
        note: "you may get the credit · {name} won't forget",
        check: { stat: "wit", skill: "speech", odds: 0.45 },
        then: [{ type: "day", delta: 2 }, { type: "regard", delta: -1 }],
        line: "You made sure everyone knew the work was yours.",
        otherwise: [{ type: "regard", delta: -3 }],
        otherwiseLine: "You spoke up, and only made {name} an enemy.",
      },
    ],
  },
  {
    id: "office-reply-all",
    slot: "office-boss",
    scope: SCREEN,
    evidence: "inferred",
    text: "A colleague sends the whole floor a message that was meant only for you, complaining about the boss.",
    choices: [
      {
        label: "Say nothing",
        note: "you weren't the one who sent it",
        then: [],
        line: "You kept your head down while the email went round.",
      },
      {
        label: "Reply to all that you've never agreed with any of it",
        note: "covers you · your colleague won't forgive it",
        then: [{ type: "day", delta: 1 }, { type: "fatigue", n: 5 }],
        line: "You made it clear to everyone that you didn't agree.",
      },
    ],
  },
];
