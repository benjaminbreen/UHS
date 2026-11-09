import { JAPAN, neighbours, partnerWords, pickOf, pronounWords, temper, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const LISBON = [-9.4, 38.6, -9, 38.85] as const;
/** Where the 1755 shock was felt hard enough to crack walls: Iberia and Morocco. */
const FELT_1755 = [-10, 30, 3.5, 44] as const;

/** The belts where the ground moves often enough that people expect it. */
const SHAKEN = [
  JAPAN,
  [19, 34, 45, 42.5], // the Aegean and Anatolia
  [6.5, 36.5, 18.6, 47], // Italy
  [44, 25, 63, 40], // Iran
  [95, 22, 110, 40], // western China
  [-81, -40, -65, 5], // the Andes
  [-106, 13, -86, 23], // Mexico and Guatemala
  [-125, 32, -115, 42], // California
] as const;

const shaken = (c: PlotContext) => within(c, ...SHAKEN.map((bounds) => ({ years: [-100000, 10000] as const, bounds })));

const neighbourOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 65);
  return pool.length ? pickOf(c, pool, "quake-neighbour") : undefined;
};

const after = (id: string) => ({ type: "after" as const, id, hours: 2 });

/** The ground shook before dawn, and part of a neighbour's house is down with someone under it. */
export const quake: PlotTemplate = {
  id: "quake",
  shape: "world",
  look: {
    emblem: "quake",
    palette: { ink: "#14100c", fill: "#3a2e22", edge: "#7a6040", light: "#efe6d8", accent: "#c08a4a" },
  },
  weight: (c) => (neighbourOf(c) ? (within(c, { years: [1755, 1756], bounds: FELT_1755 }) ? 1 : shaken(c) ? 0.35 : 0) * temper(c, "neuroticism") : 0),
  cast: (c) => {
    const neighbour = neighbourOf(c);
    return neighbour && { neighbour };
  },
  begin: (c, cast) => {
    const neighbour = cast.neighbour!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 20 * 3600,
      words: {
        neighbour: neighbour.name,
        trapped: pickOf(c, ["mother", "father", "little girl", "little boy"], "quake-trapped"),
        ...pronounWords(neighbour),
        ...p.words,
      },
      refs: { neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [{
    type: "choose", line: "shaken", focus: "neighbour",
    choices: [{ id: "dig", check: { stat: "strength", odds: 0.55 } }, { id: "fetch" }, { id: "stores" }],
  }],
  developments: [
    { id: "came", when: { type: "fired", id: "dig" }, then: [{ type: "regard", role: "neighbour", delta: 2 }] },
    { id: "ran", when: { type: "fired", id: "fetch" }, then: [{ type: "regard", role: "neighbour", delta: 1 }] },
    { id: "kept", when: { type: "fired", id: "stores" }, then: [{ type: "regard", role: "neighbour", delta: -1 }] },
    { id: "again", when: { type: "since", hours: 2 }, then: [{ type: "card", line: "again" }] },
  ],
  endings: [
    { id: "late", when: after("dig:failed") },
    { id: "dug", when: after("dig") },
    { id: "fetched", when: after("fetch") },
    { id: "saved", when: after("stores") },
    { id: "passed", when: { type: "due" } },
  ],
  wording: [
    {
      // 1 November 1755, All Saints' morning: the shock, a wave up the Tagus, and fires that burned for days.
      scope: { years: [1755, 1756], bounds: LISBON },
      title: "The City Came Down",
      lines: {
        aim: "Get {neighbour}'s {trapped} out, or save what is yours before the fire comes.",
        intro: "This morning, with the churches full for Mass, the ground shook for minutes on end. Half the city is down. Your house is standing.",
        threat: "Fires have started where the church candles fell, and people are saying the river drew back and came in again as a wall of water.",
        partner: "Your {partnerKin} {partner} wants everyone out in the open, away from the walls.",
        "kin-partner": "Not near the walls. Not near the river. Come on.",
        shaken: "{neighbour}'s house has fallen in at the back, and {his} {trapped} is under it. You can hear a voice under the beams. Smoke is coming up the street from the lower town.",
        "stores:label": "Get your own things out before the fire comes",
        again: "Another shock, smaller, and a wall down the street gives way. The fire has reached the next street.",
        saved: "You get your people and what you can carry out to open ground, and watch the city burn from there. Someone else dug out {neighbour}'s {trapped}.",
      },
    },
    {
      // The shock of 1755 cracked walls from Seville to Fez; news of Lisbon followed days later.
      scope: { years: [1755, 1756], bounds: FELT_1755 },
      title: "The Ground Swayed",
      lines: {
        intro: "This morning the ground swayed for a long time, slow, like a boat. Church bells rang on their own. Nobody here has felt one like it.",
        threat: "Your own wall has a crack in it from top to bottom.",
        partner: "Your {partnerKin} {partner} wants the children kept outside today.",
        "kin-partner": "Keep the children out of the house today.",
        again: "Another shock, a small one. A traveller from the west says the sea came in over the coast towns, and nobody has heard from Lisbon.",
      },
    },
    {
      // The giant catfish (namazu) under Japan, pinned by the god of Kashima, is in letters by 1592 and all over the prints after 1855.
      scope: { years: [1600, 1868], bounds: JAPAN },
      title: "The Catfish Moved",
      lines: {
        intro: "Before dawn the ground shook hard. People say the great catfish under the islands got loose from the god who holds it down.",
        threat: "If the catfish moves again, a house that is already cracked will come down.",
        partner: "Your {partnerKin} {partner} has already put out the cooking fire, in case.",
        "kin-partner": "The fire's out. Go and see if {neighbour} needs help.",
        again: "Another tremor, a small one. Someone has stuck a paper charm from the Kashima shrine on the gatepost.",
      },
    },
    {
      title: "The Ground Shook",
      lines: {
        aim: "Get {neighbour}'s {trapped} out, or save what is yours.",
        intro: "Before dawn the ground shook hard enough to wake everyone. Your house is standing.",
        threat: "Your own wall has a crack in it from top to bottom, and everyone knows the first shake is often not the last.",
        partner: "Your {partnerKin} {partner} wants everyone out of the house until it stops.",
        "kin-partner": "Go and see if {neighbour} needs help. We'd want the same.",
        "cast-neighbour": "Has half a house left, and someone under the rest.",
        shaken: "{neighbour}'s house has fallen in at the back, and {his} {trapped} is under it. You can hear a voice under the beams. {neighbour} is pulling at them alone.",
        "dig:label": "Dig with {neighbour}",
        "dig:then": "You and {neighbour} lift beams and drag away rubble, and the voice under it answers you.",
        "dig:failed": "The main beam is too heavy for two of you. You dig round it with your hands while the voice gets weaker.",
        "fetch:label": "Run for more hands and a lever",
        "fetch:then": "You go door to door for men and a long pole. It takes a while to find them.",
        "stores:label": "Get your own stores out first",
        "stores:then": "You carry out the grain and the tools before your own cracked wall can come down on them.",
        again: "Another shake, smaller. Dust comes off every wall, and a cracked one somewhere gives way.",
        dug: "{neighbour}'s {trapped} was out before the second shake, bruised and filthy and alive, and the rest of the wall came down on an empty floor. {neighbour} will not forget who came.",
        late: "The second shake brings more of the wall down while you are still digging. You get {neighbour}'s {trapped} out in the end, with a broken leg. {neighbour} saw you stay.",
        fetched: "Five of you get the pole under the beam and lift together. {neighbour}'s {trapped} comes out grey with dust and coughing, but alive.",
        saved: "The second shake brings your own cracked wall down on an empty store room. Your grain is outside and safe. Others dug out {neighbour}'s {trapped}, and {neighbour} noticed you weren't one of them.",
        passed: "The day ends without another big shake. People sleep near their doors.",
      },
    },
  ],
};
