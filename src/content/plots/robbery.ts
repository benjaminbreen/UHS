import { BRITAIN, dueOf, EUROPE, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { Effect, PlotContext, PlotTemplate } from "./types";

const robbed = (c: PlotContext) => {
  const year = c.setting?.year;
  return year !== undefined && !!c.household?.history?.some((e) => e.kind === "robbed" && year - e.year <= 3);
};

const confront: Effect = {
  type: "choose", line: "confront", focus: "suspect",
  choices: [{ id: "accuse", check: { stat: "wit", odds: 0.4 } }, { id: "watch" }, { id: "drop" }],
};

/** Your household was robbed, and you think you know who did it. */
export const robbery: PlotTemplate = {
  id: "robbery",
  shape: "claim",
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
      id: "confront",
      when: { type: "all", of: [{ type: "talked", role: "suspect" }, { type: "not", of: { type: "fired", id: "confront-late" } }] },
      then: [confront],
    },
    {
      id: "confront-late",
      when: { type: "all", of: [{ type: "since", hours: 1.5 }, { type: "not", of: { type: "fired", id: "confront" } }] },
      then: [confront],
    },
    { id: "wait", when: { type: "fired", id: "watch" }, then: [{ type: "extend", hours: 6 }] },
    {
      id: "doubt",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: { type: "talked", role: "suspect" } }] },
      then: [{ type: "card", line: "doubt", focus: "suspect" }],
    },
    {
      id: "night",
      when: { type: "all", of: [{ type: "fired", id: "watch" }, { type: "since", hours: 5 }] },
      then: [{ type: "choose", line: "night", focus: "suspect", choices: [{ id: "grab", check: { stat: "strength", odds: 0.5 } }, { id: "report" }] }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "suspect" } },
    { id: "confessed", when: { type: "all", of: [{ type: "fired", id: "accuse" }, { type: "not", of: { type: "fired", id: "accuse:failed" } }] } },
    { id: "denied", when: { type: "fired", id: "accuse:failed" } },
    { id: "recovered", when: { type: "all", of: [{ type: "fired", id: "grab" }, { type: "not", of: { type: "fired", id: "grab:failed" } }] } },
    { id: "brawl", when: { type: "fired", id: "grab:failed" } },
    { id: "reported", when: { type: "fired", id: "report" } },
    { id: "let-go", when: { type: "fired", id: "drop" } },
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
        confessed: "You name {suspect} in front of witnesses and lay out what you saw. {He} can't answer it, and {his} kin agree to pay the compensation the law sets for theft.",
        "report:label": "Raise the hue and cry",
        reported: "You raise the hue and cry, and the neighbours come out. {suspect} is held until the assembly meets, with the stolen goods as evidence.",
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
        confessed: "You accuse {suspect} in front of the street and say exactly what you saw. {He} breaks, gives back what's left, and begs you not to go to the magistrate.",
        "report:label": "Go and fetch the constable",
        reported: "You fetch the constable, who finds the bundle. {suspect} is taken before the magistrate, and you'll have to pay to bring the prosecution.",
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
        confront: "Every time you see {suspect} you think of the robbery. What do you do about it?",
        "accuse:label": "Accuse {him} in front of witnesses",
        "accuse:failed": "You say it in front of the neighbours, and {suspect} has an answer for everything.",
        "watch:label": "Say nothing yet, and watch {his} house",
        "watch:then": "You say nothing, and find a place where you can see {suspect}'s door without being seen.",
        "drop:label": "Let it go",
        night: "After hours of waiting, {suspect}'s door opens, and {he} slips out with a bundle under {his} arm.",
        "grab:label": "Stop {him} and open the bundle",
        "grab:failed": "You grab the bundle, and {suspect} fights you for it.",
        "report:label": "Go and fetch {authority}",
        confessed: "You accuse {suspect} in front of witnesses and say exactly what you saw. {He} breaks, and gives back what's left of what was taken.",
        denied: "The neighbours take {suspect}'s side, and now you're the one people talk about. Nothing comes back.",
        recovered: "You pull the bundle open, and there are your things. {suspect} runs, and you carry them home.",
        brawl: "You end up rolling in the dirt, the bundle torn open between you. The neighbours pull you apart, and nobody can say whose things they were.",
        reported: "You bring {authority}, and the bundle is opened. Now it's for {authority} to decide.",
        gone: "{suspect} has left, and you'll never know for sure.",
        "let-go": "You say nothing. Nobody pays for the robbery.",
      },
    },
  ],
};
