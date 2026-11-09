import { dueOf, fillIn, neighbours, partnerWords, pickOf, pronounWords, temper, trade } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const castOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 70 && !c.player.relations?.some((r) => r.kind === "partner" && r.other === a.id));
  const suspect = pool.length ? pickOf(c, pool, "rack-suspect") : undefined;
  const others = pool.filter((a) => a.householdId !== suspect?.householdId);
  const neighbour = others.length ? pickOf(c, others, "rack-neighbour") : undefined;
  return suspect && neighbour ? { suspect, neighbour } : undefined;
};

/** Something has been taking from your drying rack at night. The clue points
 * one way and the gossip another. */
export const rack: PlotTemplate = {
  id: "rack",
  shape: "mystery",
  look: {
    emblem: "rack",
    palette: { ink: "#0e1016", fill: "#1e2230", edge: "#6a5040", light: "#eae6dc", accent: "#d88a50" },
  },
  weight: (c) => (trade(c, /fish|hunt|herd|shell|gather/) && castOf(c) ? 0.6 * temper(c, "wit") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const suspect = cast.suspect!, neighbour = cast.neighbour!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const who = { suspect: suspect.name, ...pronounWords(suspect) };
    return {
      deadline,
      words: {
        ...who,
        neighbour: neighbour.name,
        due,
        food: trade(c, /fish|shell/) ? "fish" : "meat",
        clue: fillIn(pickOf(c, ["a trail of small dropped pieces that leads toward {suspect}'s door", "a scrap of cord, plaited the way only {suspect}'s household plaits it"], "rack-clue"), who),
        why: fillIn(pickOf(c, ["{his} household has been going hungry and too proud to ask", "{he} has been feeding a half-wild dog {he} took in", "{he} has been feeding an old relative nobody knew was staying with {him}"], "rack-why"), who),
        ...p.words,
      },
      refs: { suspect: suspect.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "clue",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "clue", focus: "suspect", choices: [{ id: "accuse" }, { id: "neighbour" }, { id: "watch", check: { stat: "endurance", odds: 0.55 } }] }],
    },
    {
      id: "wrong",
      when: { type: "fired", id: "neighbour" },
      then: [{ type: "regard", role: "neighbour", delta: -2 }, { type: "choose", line: "wrong", focus: "neighbour", choices: [{ id: "accuse" }, { id: "drop" }] }],
    },
    { id: "found", when: { type: "fired", id: "accuse" }, then: [{ type: "choose", line: "confront", focus: "suspect", choices: [{ id: "work" }, { id: "given" }] }] },
    {
      id: "seen",
      when: { type: "all", of: [{ type: "fired", id: "watch" }, { type: "not", of: { type: "fired", id: "watch:failed" } }] },
      then: [{ type: "choose", line: "night", focus: "suspect", choices: [{ id: "work" }, { id: "given" }] }],
    },
    { id: "kind", when: { type: "fired", id: "given" }, then: [{ type: "regard", role: "suspect", delta: 3 }] },
  ],
  endings: [
    { id: "found", when: { type: "fired", id: "work" } },
    { id: "given", when: { type: "fired", id: "given" } },
    { id: "slept", when: { type: "fired", id: "watch:failed" } },
    { id: "unsolved", when: { type: "fired", id: "drop" } },
    { id: "gone", when: { type: "gone", role: "suspect" } },
    { id: "unsolved", when: { type: "due" } },
  ],
  wording: [
    {
      // Salmon split and smoked on racks fed Northwest Coast households through the winter.
      scope: { years: [-8000, 1900], bounds: [-170, 40, -115, 62] },
      title: "Gaps in the Rack",
      lines: {
        aim: "Find out who is taking salmon from your smoking rack, {due}.",
        intro: "For three mornings now there have been gaps in your smoking rack where split salmon hung. Whoever it is comes at night and takes only a few.",
        threat: "It's not much yet. But it's winter food, and someone thinks they can take it.",
        partner: "Your {partnerKin} {partner} is sure it is {neighbour}.",
        "kin-partner": "It's {neighbour}. Who else is up at night?",
        "cast-suspect": "Has been quieter than usual lately.",
        "cast-neighbour": "Was seen walking past your rack late last night, people say.",
        wrong: "You ask {neighbour} about the salmon, and get an angry answer. Half the village can say where {neighbour} was last night: at a gambling game.",
        gone: "With {suspect} gone, nothing more goes missing from the rack.",
        unsolved: "You never find out. The gaps keep appearing, a few at a time.",
      },
    },
    {
      // Stockfish, cod dried hard on wooden racks, was the North Atlantic's staple and its biggest export.
      scope: { years: [800, 1900], bounds: [-25, 55, 30, 72] },
      title: "Gaps in the Rack",
      lines: {
        aim: "Find out who is taking fish from your drying rack, {due}.",
        intro: "For three mornings now there have been gaps on your drying rack where cod hung. Whoever it is comes at night and takes only one or two.",
        threat: "It's not much yet. But the fish is what you'll eat and sell all winter.",
        partner: "Your {partnerKin} {partner} is sure it is {neighbour}.",
        "kin-partner": "It's {neighbour}. I'd stake the boat on it.",
        "cast-suspect": "Has been quieter than usual lately.",
        "cast-neighbour": "Was seen near your rack late last night, people say.",
        wrong: "You ask {neighbour} about the fish, and get an angry answer. {neighbour} was out on the hill all night looking for a lost sheep, and can prove it.",
        gone: "With {suspect} gone, nothing more goes missing from the rack.",
        unsolved: "You never find out. Every few nights, another fish is gone.",
      },
    },
    {
      title: "Gaps in the Rack",
      lines: {
        aim: "Find out who is taking {food} from your drying rack, {due}.",
        intro: "For three mornings now there have been gaps on the rack where your {food} hangs to dry. Whoever it is comes at night and takes only a little.",
        threat: "It's not much yet. But it's food you were counting on, and someone thinks they can take it.",
        partner: "Your {partnerKin} {partner} is sure it is {neighbour}.",
        "kin-partner": "It's {neighbour}. It has to be.",
        "cast-suspect": "Has been quieter than usual lately.",
        "cast-neighbour": "Was seen near your rack late last night, people say.",
        clue: "Near the rack you find {clue}. But people are already saying it was {neighbour}.",
        "accuse:label": "Go to {suspect}'s door",
        "neighbour:label": "Have it out with {neighbour}",
        "watch:label": "Sit up tonight and watch",
        "watch:failed": "You sit up by the rack in the dark, but you are asleep long before anyone comes.",
        wrong: "You ask {neighbour} about the {food}, and get an angry answer. {neighbour} had a good reason for being out last night, and several people can say so.",
        "drop:label": "Let it go",
        confront: "You ask {suspect}, and {he} can't look at you. It turns out {why}.",
        night: "Past midnight someone comes to the rack and starts lifting down {food}: {suspect}. When {he} sees you, {he} sits down on the ground and tells you everything. It turns out {why}.",
        "work:label": "Ask for work in return",
        "given:label": "Tell {him} to ask next time",
        found: "You agree on some work in return. {suspect} turns up early every day until it's paid off, and the rack stays full after that.",
        given: "You tell {suspect} to come and ask next time. {He} does, twice that winter, and pays it back in kind when the weather turns.",
        slept: "In the morning there are new gaps in the rack, and you have a stiff neck.",
        gone: "With {suspect} gone, nothing more goes missing from the rack.",
        unsolved: "You never find out. Every few nights, a little more is gone.",
      },
    },
  ],
};
