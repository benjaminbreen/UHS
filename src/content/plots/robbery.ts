import { BRITAIN, dueOf, EUROPE, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const robbed = (c: PlotContext) => {
  const year = c.setting?.year;
  return year !== undefined && !!c.household?.history?.some((e) => e.kind === "robbed" && year - e.year <= 3);
};

/** Your household was robbed, and you think you know who did it. */
export const robbery: PlotTemplate = {
  id: "robbery",
  look: {
    emblem: "robbery",
    palette: { ink: "#1a1210", fill: "#2c1d18", edge: "#5a3426", light: "#efe2da", accent: "#c0563a" },
  },
  weight: (c) => (robbed(c) && neighbours(c).length ? 2.5 : 0),
  cast: (c) => {
    const pool = neighbours(c).filter((a) => (a.age ?? 30) < 50);
    const suspect = pool.length ? pickOf(c, pool, "suspect") : undefined;
    return suspect && { suspect };
  },
  begin: (c, cast) => {
    const suspect = cast.suspect!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      words: {
        suspect: suspect.name,
        suspectRole: suspect.role.toLowerCase(),
        due,
        sign: pickOf(c, ["wearing a cloak very like the one taken", "with a pot you would swear was yours", "spending money that household shouldn't have", "near your door the night it happened"], "wrong-sign"),
        ...pronounWords(suspect),
        ...p.words,
      },
      refs: { suspect: suspect.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "doubt",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: { type: "talked", role: "suspect" } }] },
      then: [{ type: "card", line: "doubt", focus: "suspect" }],
    },
  ],
  endings: [
    { id: "confronted", when: { type: "talked", role: "suspect" } },
    { id: "gone", when: { type: "gone", role: "suspect" } },
    { id: "let-go", when: { type: "due" } },
  ],
  wording: [
    {
      // Germanic and Anglo-Saxon law set a price, the wergild or bot, on every wrong, payable to the injured household.
      scope: { years: [400, 1100], bounds: EUROPE },
      title: "After the Robbery",
      lines: {
        aim: "Confront {suspect} about the robbery, {due}.",
        intro: "Your household was robbed, and nobody was ever blamed. Now you have seen {suspect} the {suspectRole} {sign}.",
        threat: "The law makes a thief pay compensation, but only if someone accuses them in front of witnesses.",
        partner: "Your {partnerKin} {partner} says to leave it, that it will only make things worse.",
        "kin-partner": "You're thinking about {suspect}, aren't you? Be sure before you say anything.",
        "cast-suspect": "You think {he} robbed your household.",
        doubt: "You keep watching {suspect}. The longer you wait, the harder it is to say anything.",
        confronted: "You accuse {suspect} to {his} face. Whatever the truth is, it's out now, and the neighbours will take sides.",
        gone: "{suspect} has left, and you'll never know for sure.",
        "let-go": "You say nothing. Nobody pays for the robbery, and you still see {suspect} every day.",
      },
    },
    {
      // Until 1879 most English prosecutions were brought privately by the victim, at their own cost.
      scope: { years: [1500, 1880], bounds: BRITAIN },
      title: "After the Robbery",
      lines: {
        aim: "Confront {suspect} about the robbery, {due}.",
        intro: "Nobody was ever charged with robbing your household. Then you saw {suspect} the {suspectRole} {sign}.",
        threat: "A prosecution would cost you money you do not have, and the constable won't act on a hunch.",
        partner: "Your {partnerKin} {partner} wants you to leave it alone.",
        "kin-partner": "Leave {suspect} be. If you're wrong, we'll never live it down.",
        "cast-suspect": "You suspect {him} of robbing your household.",
        doubt: "You keep looking at {suspect}, and {he} has noticed.",
        confronted: "You accuse {suspect}, and the whole street hears it.",
        gone: "{suspect} has left, and you'll never know for sure.",
        "let-go": "You say nothing. Nobody is charged, and {suspect} still nods to you in the street.",
      },
    },
    {
      title: "After the Robbery",
      lines: {
        aim: "Confront {suspect} about the robbery, {due}.",
        intro: "Nobody was ever blamed for robbing your household. Now you have seen {suspect} the {suspectRole} {sign}.",
        threat: "{Authority} will not act unless someone names the thief.",
        partner: "Your {partnerKin} {partner} says to be very sure first.",
        "kin-partner": "You keep watching {suspect}. Are you sure?",
        "cast-suspect": "You think {he} robbed your household.",
        doubt: "You keep watching {suspect}. The longer you wait, the harder it is to say anything.",
        confronted: "You accuse {suspect}. It's out now, and everyone will have an opinion.",
        gone: "{suspect} has left, and you'll never know for sure.",
        "let-go": "You say nothing. Nobody pays for the robbery.",
      },
    },
  ],
};
