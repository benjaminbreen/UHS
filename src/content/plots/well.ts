import { B, dueOf, ISLAMIC, neighbours, partnerWords, pickOf, pronounWords, temper, trade } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const castOf = (c: PlotContext) => {
  const kids = c.actors.filter((a) => a.kind === "human" && !a.dead && a.householdId !== c.player.householdId && (a.age ?? 30) >= 6 && (a.age ?? 30) < 13);
  const child = kids.length ? pickOf(c, kids, "well-child") : undefined;
  const pool = neighbours(c).filter((a) => a.householdId !== child?.householdId);
  const neighbour = pool.length ? pickOf(c, pool, "well-neighbour") : undefined;
  return child && neighbour ? { child, neighbour } : undefined;
};

/** The well water tastes wrong this morning. Everyone has a theory; one
 * child knows. */
export const well: PlotTemplate = {
  id: "well",
  shape: "mystery",
  look: {
    emblem: "well",
    palette: { ink: "#0e1414", fill: "#24343a", edge: "#7a6a52", light: "#e8eee6", accent: "#78c0b4" },
  },
  weight: (c) => ((c.setting?.year ?? 0) > B(6000) && (c.setting?.year ?? 0) < 1900 && !trade(c, /hunt|gather|herd|traveler/) && castOf(c) ? 0.5 * temper(c, "wit") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const child = cast.child!, neighbour = cast.neighbour!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      words: {
        child: child.name,
        neighbour: neighbour.name,
        neighbourRole: neighbour.role.toLowerCase(),
        due,
        fell: pickOf(c, ["a hen", "a young cat", "a rat the size of a shoe"], "well-fell"),
        ...pronounWords(child),
        ...p.words,
      },
      refs: { child: child.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "talk",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "talk", focus: "neighbour", choices: [{ id: "child" }, { id: "neighbour" }, { id: "down", check: { stat: "agility", odds: 0.5 } }] }],
    },
    {
      id: "wrong",
      when: { type: "fired", id: "neighbour" },
      then: [{ type: "regard", role: "neighbour", delta: -1 }, { type: "choose", line: "wrong", focus: "neighbour", choices: [{ id: "child" }, { id: "drop" }] }],
    },
    { id: "tears", when: { type: "fired", id: "child" }, then: [{ type: "choose", line: "confess", focus: "child", choices: [{ id: "secret" }, { id: "found" }] }] },
    { id: "trusted", when: { type: "fired", id: "secret" }, then: [{ type: "regard", role: "child", delta: 3 }] },
    { id: "cleared", when: { type: "fired", id: "found" }, then: [{ type: "regard", role: "neighbour", delta: 2 }] },
  ],
  endings: [
    { id: "found", when: { type: "fired", id: "found" } },
    { id: "secret", when: { type: "fired", id: "secret" } },
    { id: "soaked", when: { type: "fired", id: "down:failed" } },
    { id: "cleaned", when: { type: "fired", id: "down" } },
    { id: "unsolved", when: { type: "fired", id: "drop" } },
    { id: "unsolved", when: { type: "due" } },
  ],
  wording: [
    {
      // Town wells and fountains in Islamic cities were often pious endowments, a sabil, kept up for anyone to drink.
      scope: { years: [700, 1900], bounds: ISLAMIC },
      title: "Bad Water",
      lines: {
        aim: "Find out what is wrong with the well, {due}.",
        intro: "The water from the well tastes wrong this morning: flat and faintly rotten. Everyone on the street drinks from it, and everyone has a theory.",
        threat: "Nobody is sick yet. But people are already starting to blame each other.",
        partner: "Your {partnerKin} {partner} has started boiling everything, just in case.",
        "kin-partner": "I'm not drinking that until someone finds out what's wrong.",
        "cast-child": "Was playing by the well yesterday evening, and has been avoiding it all morning.",
        "cast-neighbour": "The {neighbourRole}, who people say has been washing things in the channel near the well.",
        wrong: "You ask {neighbour} about the well. {neighbour} is furious at being blamed, and shows you a jar of the same bad water.",
        unsolved: "Nobody finds out. After a few days the water clears by itself, but the quarrel about {neighbour} goes on.",
      },
    },
    {
      title: "Bad Water",
      lines: {
        aim: "Find out what is wrong with the well, {due}.",
        intro: "The water from the well tastes wrong this morning: flat and faintly rotten. Everyone nearby drinks from it, and everyone has a theory.",
        threat: "Nobody is sick yet. But people are already starting to blame each other.",
        partner: "Your {partnerKin} {partner} won't let anyone drink it.",
        "kin-partner": "I'm not drinking that until someone finds out what's wrong.",
        "cast-child": "Was playing by the well yesterday evening, and has stayed away from it all morning.",
        "cast-neighbour": "The {neighbourRole}, whom people are already blaming.",
        talk: "At the well, the talk is all about {neighbour}. Voices are getting loud. Only {child}, who was playing here last night, stays away from it.",
        "child:label": "Ask {child}",
        "neighbour:label": "Go and ask {neighbour}",
        "down:label": "Go down the well yourself",
        "down:failed": "You go down on the rope, slip on the wet stones and have to be hauled up, soaked and empty-handed.",
        wrong: "You ask {neighbour} about the well. {neighbour} is furious at being blamed, and has been drinking the same bad water.",
        "drop:label": "Leave it alone",
        confess: "{child} bursts into tears. Last night {he} was chasing {fell} round the well, and it fell in. {He} begs you not to tell.",
        "secret:label": "Fish it out together, and say nothing",
        "found:label": "Tell everyone what happened",
        found: "You tell the street what happened. {child} gets a scolding, a rope and a basket bring up {fell}, and by evening the water is sweet again. People are embarrassed about {neighbour}, and a few say sorry.",
        secret: "While the street is at dinner, you and {child} fish {fell} out with a basket on a rope and bail the well. By evening the water is sweet. {child} will do anything for you now, but people still look sideways at {neighbour}.",
        soaked: "The water clears by itself after a few days, but nobody ever finds out why, and people still look sideways at {neighbour}.",
        cleaned: "Down in the cold you find {fell} floating, and bring it up in a basket. The well is bailed, and by evening the water is sweet. Nobody blames {neighbour} any more.",
        unsolved: "Nobody finds out. After a few days the water clears, but people still look sideways at {neighbour}.",
      },
    },
  ],
};
