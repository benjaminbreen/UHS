import { random } from "../../core/random";
import { capabilitiesFor } from "../characters/resolve";
import { amountOf, neighbours, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

// [first year it could be had secondhand by an ordinary household, the thing]
const THINGS: [number, string][] = [
  [-3000, "a bronze mirror"],
  [-1000, "a pair of good shoes"],
  [-1000, "a copper cooking pot"],
  [-2000, "a length of dyed cloth, enough for a new coat"],
  [-500, "a knife with a carved horn handle"],
  [1700, "a pocket watch that still keeps time"],
  [1880, "a sewing machine"],
  [1895, "a bicycle"],
  [1925, "a wind-up gramophone and three records"],
  [1955, "a transistor radio"],
  [1985, "a secondhand television"],
  [2008, "a smartphone, only a little cracked"],
];

const thingOf = (c: PlotContext) => {
  const year = c.setting?.year ?? 0;
  const newest = THINGS.filter(([from]) => year >= from && year < from + 300).slice(-3);
  return pickOf(c, newest.length ? newest : THINGS.slice(0, 5), "longing-thing")[1];
};

const sellerOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) >= 20);
  return pool.length ? pickOf(c, pool, "longing-seller") : undefined;
};

/** A neighbour is selling something you have wanted for a long time. */
/** A neighbour is selling something you have wanted for a long time: pay,
 * haggle, or decide you can live without it. */
export const longing: PlotTemplate = {
  id: "longing",
  shape: "desire",
  look: {
    emblem: "wares",
    palette: { ink: "#10140f", fill: "#1e2a1c", edge: "#5a6a40", light: "#e8f0e2", accent: "#e8b860" },
  },
  payee: "neighbour",
  weight: (c) => (c.setting && capabilitiesFor(c.setting).has("coinage") && (c.household?.fortune ?? 0.5) >= 0.15 && sellerOf(c)
    ? 0.5 * temper(c, "openness") : 0),
  cast: (c) => {
    const neighbour = sellerOf(c);
    return neighbour && { neighbour };
  },
  begin: (c, cast) => {
    const neighbour = cast.neighbour!;
    const owed = 2 + Math.floor(random(c.seed, "plot", "longing", "owed") * 3);
    const p = partnerWords(c);
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 36 * 3600,
      owed,
      words: { neighbour: neighbour.name, thing: thingOf(c), amount: amountOf(c, owed), ...pronounWords(neighbour), ...p.words },
      refs: { neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "price", focus: "neighbour", from: "neighbour", choices: [{ id: "pay" }, { id: "haggle", check: { stat: "wit", odds: 0.5 } }, { id: "pass" }] }],
  developments: [
    { id: "cheaper", when: { type: "all", of: [{ type: "fired", id: "haggle" }, { type: "not", of: { type: "fired", id: "haggle:failed" } }] }, then: [{ type: "owe", times: 0.75 }] },
    {
      id: "rival",
      when: { type: "all", of: [{ type: "since", hours: 5 }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "fired", id: "pass" } }, { type: "not", of: { type: "fired", id: "haggle:failed" } }] },
      then: [{ type: "choose", line: "rival", focus: "neighbour", from: "neighbour", choices: [{ id: "pay" }, { id: "pass" }] }],
    },
  ],
  endings: [
    { id: "bought", when: { type: "settled" } },
    { id: "gone", when: { type: "gone", role: "neighbour" } },
    { id: "offended", when: { type: "all", of: [{ type: "fired", id: "haggle:failed" }, { type: "since", hours: 2 }] } },
    { id: "passed", when: { type: "all", of: [{ type: "fired", id: "pass" }, { type: "since", hours: 2 }] } },
    { id: "sold", when: { type: "due" } },
  ],
  wording: [
    {
      title: "Something You Want",
      lines: {
        aim: "Pay {neighbour} {amount} for {thing} by noon tomorrow, or let it go.",
        intro: "{neighbour} is selling {thing}, and you have wanted something like it for years. {He} {wants} {amount}, which is more than you have to spare and less than it's worth.",
        threat: "Nobody needs {thing}. But if you let it go, someone else will have it.",
        partner: "Your {partnerKin} {partner} asks what the household is supposed to eat if you buy it.",
        "kin-partner": "Are you really going to spend that on {thing}?",
        "cast-neighbour": "Is selling {thing} for {amount}.",
        price: "I've seen you looking at it. {amount} and it's yours.",
        "pay:label": "Pay what {he} asks",
        "pay:then": "You shake on {amount}. Now you have to hand it over.",
        "haggle:label": "Haggle",
        "haggle:then": "You point out a scratch and a worn corner. {neighbour} sighs, and takes a quarter off the price.",
        "haggle:failed": "You make an offer. {neighbour} is insulted by the offer, and says {he} has other buyers.",
        "pass:label": "Decide you don't need it",
        "pass:then": "You tell {neighbour} you'll leave it. It's a relief, mostly.",
        rival: "Someone else has been round asking about it. I won't hold it for you past noon tomorrow.",
        bought: "{neighbour} hands it over, and it's yours. You keep finding reasons to pick it up.",
        offended: "{neighbour} sold it to someone else that afternoon, and made sure you heard about it.",
        passed: "The money stays in the household, where it was needed anyway. You only think about {thing} once or twice.",
        gone: "With {neighbour} gone, nobody knows what became of it.",
        sold: "It's past noon, and somebody else has it now.",
      },
    },
  ],
};
