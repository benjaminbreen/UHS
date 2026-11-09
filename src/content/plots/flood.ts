import { B, CHINA, EGYPT, neighbours, notable, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const riverside = (c: PlotContext) => !!c.setting && /^river|lake/.test(c.setting.water);

const castOf = (c: PlotContext) => {
  const owner = notable(c);
  const pool = neighbours(c).filter((a) => a.householdId !== owner?.householdId && (a.age ?? 30) < 60);
  const neighbour = pool.length ? pickOf(c, pool, "flood-neighbour") : undefined;
  return owner && neighbour ? { owner, neighbour } : undefined;
};

/** Rain upstream, and the river is coming up faster than anyone likes. */
export const flood: PlotTemplate = {
  id: "flood",
  shape: "world",
  look: {
    emblem: "flood",
    palette: { ink: "#0c1216", fill: "#1c3440", edge: "#6a5a3e", light: "#e2eef2", accent: "#6aa8c0" },
  },
  weight: (c) => (riverside(c) && castOf(c) ? 0.45 * temper(c, "conscientiousness") : 0),
  cast: (c) => {
    const found = castOf(c);
    return found && { neighbour: found.neighbour, patron: found.owner };
  },
  begin: (c, cast) => {
    const neighbour = cast.neighbour!, owner = cast.patron!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 21 * 3600,
      words: { neighbour: neighbour.name, owner: owner.name, ...pronounWords(owner), ...p.words },
      refs: { neighbour: neighbour.id, owner: owner.id, ...p.refs },
    };
  },
  opening: [{
    type: "choose", line: "rising", focus: "neighbour",
    choices: [{ id: "dyke", check: { stat: "endurance", odds: 0.55 } }, { id: "stores" }, { id: "cut" }],
  }],
  developments: [
    { id: "came", when: { type: "fired", id: "dyke" }, then: [{ type: "regard", role: "neighbour", delta: 2 }] },
    { id: "alone", when: { type: "fired", id: "stores" }, then: [{ type: "regard", role: "neighbour", delta: -1 }] },
    { id: "found", when: { type: "after", id: "cut", hours: 2 }, then: [{ type: "choose", line: "found", focus: "patron", choices: [{ id: "own" }, { id: "deny", check: { stat: "wit", odds: 0.45 } }] }] },
    { id: "blamed", when: { type: "fired", id: "deny:failed" }, then: [{ type: "regard", role: "patron", delta: -2 }] },
  ],
  endings: [
    { id: "broke", when: { type: "after", id: "dyke:failed", hours: 3 } },
    { id: "held", when: { type: "after", id: "dyke", hours: 3 } },
    { id: "dry", when: { type: "after", id: "stores", hours: 3 } },
    { id: "caught", when: { type: "fired", id: "blamed" } },
    { id: "denied", when: { type: "fired", id: "deny" } },
    { id: "owned", when: { type: "fired", id: "own" } },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // A flood a few cubits over the mark on the nilometer was as bad as a low one: it broke the dykes and took the villages on the mounds.
      scope: { years: [-5000, 1971], bounds: EGYPT },
      title: "A High Nile",
      lines: {
        aim: "Save what you can before the Nile reaches the houses.",
        intro: "The river has come up early and fast. The men who read the nilometer, the stepped gauge that measures the flood, say it is already past a good year's mark and still rising.",
        threat: "A flood this high breaks the dykes between the basins and takes the houses on the low ground with it.",
        partner: "Your {partnerKin} {partner} is already carrying the grain jars up to the roof.",
        "kin-partner": "The jars go up first. Then help {neighbour} with the dyke.",
        rising: "The water is a hand below the top of the dyke and still rising. {neighbour} is out on the low side with a basket of earth. Upstream, the dyke above {owner}'s basin is soft enough to cut, and the water would go there instead.",
        "dyke:label": "Raise the dyke with {neighbour}",
        "stores:label": "Get the grain jars onto the roof",
        "cut:label": "Cut the dyke above {owner}'s basin",
        broke: "In the afternoon the dyke goes, twenty paces from where you were working. The water fills the low basin and stands in {neighbour}'s house. At least you were there, and {neighbour} saw it.",
        dry: "Your grain is safe on the roof. The dyke on the low side went in the afternoon with nobody on it, and {neighbour}'s house is standing in water.",
        caught: "{neighbour} saw you with the spade, and says so. {owner} takes it to {authority}. You will make good {his} lost crop, and the village will remember what you did.",
      },
    },
    {
      // The Tang code and those after it punished anyone who secretly breached a dyke, and more harshly if it drowned a neighbour's fields.
      scope: { years: [B(500), 1950], bounds: CHINA },
      title: "The River Is Up",
      lines: {
        aim: "Save what you can before the river breaks through.",
        intro: "It has rained for days upstream, and the river is running high between its dykes, higher than the fields behind them. The county has sent word that every household is to send someone to the dykes.",
        threat: "If a dyke breaks here the water will be over the fields and into the houses before anyone can run. Breaching one on purpose is a crime under the code.",
        partner: "Your {partnerKin} {partner} says someone from this house has to go to the dyke.",
        "kin-partner": "Somebody from this house has to go to the dyke.",
        rising: "The water is lapping at the top of the dyke. {neighbour} is out with a basket and a shovel, plugging the weak places with sorghum stalks. Upstream, the dyke above {owner}'s fields is soft enough to cut, and the water would go there instead.",
        "dyke:label": "Go to the dyke with {neighbour}",
        "stores:label": "Get the grain up into the rafters",
        "cut:label": "Breach the dyke above {owner}'s fields",
        held: "The water comes to a finger below the top, and stops. By evening it is dropping. {neighbour} saw you there, and so did the headman.",
        "dyke:failed": "You and {neighbour} carry earth all morning, but the dyke is soaked through and slumps as fast as you pile it.",
        "cut:then": "Nobody is watching that stretch. A few minutes with a spade, and the water finds the breach and spreads out over {owner}'s fields. Here it stops rising.",
        broke: "In the afternoon the dyke goes, twenty paces from where you were working. The water takes the low fields and stands in {neighbour}'s house. At least you were there, and the headman saw it.",
        dry: "Your grain is safe in the rafters. The dyke on the low side went in the afternoon with nobody on it, and {neighbour}'s house is standing in water.",
        found: "{owner} has walked the dyke and found the breach, with the spade marks still in it. {He} is going to the headman.",
        "deny:label": "Say the dyke gave way by itself",
        caught: "{neighbour} saw you with the spade, and says so. {owner} takes it to {authority}, and under the code that means a beating as well as {his} lost crop.",
      },
    },
    {
      title: "The River Is Up",
      lines: {
        aim: "Save what you can before the water reaches the houses.",
        intro: "It has rained for days somewhere upstream. The water is brown, full of branches, and higher than anyone has seen it this year.",
        threat: "If it keeps rising it will be in the low houses by dark.",
        partner: "Your {partnerKin} {partner} is already moving the food up off the floor.",
        "kin-partner": "The food's up off the floor. Go and help {neighbour}.",
        "cast-neighbour": "Lives lower than you, and is piling earth against the water.",
        "cast-patron": "Owns the low fields upstream.",
        rising: "The water is a hand below the top of the bank and still coming up. {neighbour} is out on the low side with a basket of earth. Upstream, the bank above {owner}'s fields is soft enough to cut, and the water would go there instead.",
        "dyke:label": "Raise the bank with {neighbour}",
        "dyke:then": "You and {neighbour} carry earth all morning. Where you pack it, it holds.",
        "dyke:failed": "You and {neighbour} carry earth all morning, but the bank is soaked through and slumps as fast as you pile it.",
        "stores:label": "Get the food up high",
        "stores:then": "You carry everything up off the floor, load by load, and leave {neighbour} to it.",
        "cut:label": "Cut the bank above {owner}'s fields",
        "cut:then": "Nobody is watching that stretch. A few minutes with a spade, and the water finds the gap and spreads out over {owner}'s fields. Here it stops rising.",
        found: "{owner} has walked the bank and found the gap, with the spade marks still in it. {He} is asking everyone who did it.",
        "own:label": "Admit it and offer to make it good",
        "deny:label": "Say the bank gave way by itself",
        held: "The water comes to a finger below the top, and stops. By evening it is going down. {neighbour} thanks you for coming.",
        broke: "In the afternoon the bank goes, twenty paces from where you were working. The water takes the low ground and stands in {neighbour}'s house. At least you were there, and {neighbour} saw it.",
        dry: "Your food is safe and dry. The bank on the low side went in the afternoon with nobody on it, and {neighbour}'s house is standing in water.",
        owned: "{owner} is furious, but you said it to {his} face. You will work {his} fields until the damage is paid off.",
        denied: "{owner} looks at you a long time, then at the gap, and lets it go. The fields it went over will grow nothing this year.",
        caught: "{neighbour} saw you with the spade, and says so. {owner} takes it to {authority}. You will make good {his} lost crop, and people will remember what you did.",
        passed: "The river stops rising at nightfall. The low ground is under water, and it will be days before it drains.",
      },
    },
  ],
};
