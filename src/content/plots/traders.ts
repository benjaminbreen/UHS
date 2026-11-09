import { capabilitiesFor } from "../characters/resolve";
import { notable, partnerWords, pronounWords, temper, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const GAYA = { years: [100, 400], bounds: [126.5, 34.5, 129.6, 36] } as const;
const TANEGASHIMA = { years: [1543, 1550], bounds: [129.5, 30, 132.5, 34] } as const;
const TIMBUKTU = { years: [1100, 1900], bounds: [-5, 14, -1, 18] } as const;

const coastal = (c: PlotContext) => !!c.setting && (/^coast|island/.test(c.setting.water) || c.setting.settlement === "port");

const reached = (c: PlotContext) => !!c.setting && (c.setting.water !== "none" || c.setting.settlement === "city" || c.setting.settlement === "port") &&
  capabilitiesFor(c.setting).has("market_exchange");

/** Strangers have come in with goods to trade, and they will not stay long. */
export const traders: PlotTemplate = {
  id: "traders",
  shape: "world",
  look: {
    emblem: "quay",
    palette: { ink: "#12100a", fill: "#2e4a52", edge: "#8a6a3a", light: "#f2ead6", accent: "#d4a040" },
  },
  weight: (c) => {
    if (!notable(c)) return 0;
    const pinned = within(c, TIMBUKTU) || (coastal(c) && within(c, GAYA, TANEGASHIMA)) ? 0.9 : reached(c) ? 0.3 : 0;
    return pinned * temper(c, "openness");
  },
  cast: (c) => {
    const patron = notable(c);
    return patron && { patron };
  },
  begin: (c, cast) => {
    const patron = cast.patron!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 22 * 3600,
      words: { patron: patron.name, ...pronounWords(patron), ...p.words },
      refs: { patron: patron.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "arrive", focus: "patron", choices: [{ id: "self" }, { id: "broker" }, { id: "supply" }] }],
  developments: [
    {
      id: "go",
      when: { type: "any", of: [{ type: "fired", id: "self" }, { type: "fired", id: "supply" }] },
      then: [{ type: "gather", at: "edge", when: 1, label: "market", aim: "go", scene: "market" }],
    },
    {
      id: "haggle",
      when: { type: "all", of: [{ type: "fired", id: "self" }, { type: "came" }] },
      then: [{ type: "choose", line: "offer", choices: [{ id: "take" }, { id: "hold", check: { stat: "wit", skill: "trade", odds: 0.45 } }] }],
    },
    { id: "cut", when: { type: "fired", id: "broker" }, then: [{ type: "regard", role: "patron", delta: 1 }] },
  ],
  endings: [
    { id: "walked", when: { type: "fired", id: "hold:failed" } },
    { id: "bargain", when: { type: "fired", id: "hold" } },
    { id: "took", when: { type: "any", of: [{ type: "fired", id: "take" }, { type: "all", of: [{ type: "fired", id: "haggle" }, { type: "gathered" }] }] } },
    { id: "brokered", when: { type: "after", id: "broker", hours: 3 } },
    { id: "supplied", when: { type: "all", of: [{ type: "fired", id: "supply" }, { type: "after", id: "came", hours: 0.5 }] } },
    { id: "left", when: { type: "any", of: [{ type: "gathered" }, { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "fired", id: "go" } }] }] } },
  ],
  wording: [
    {
      // The Weizhi says Byeonjin's country makes iron, that the Han, the Ye and the Wa all come to take it, and that iron is used in trade as coin is in China.
      scope: GAYA,
      title: "Boats from Wa",
      lines: {
        intro: "Boats have come in from Wa, the islands across the strait, as they do when the wind is right. They want iron, and they have brought cloth and beads to pay for it.",
        threat: "They won't stay long, and whoever gets to them first sets the price.",
        partner: "Your {partnerKin} {partner} says the last Wa traders paid well for anything made of iron.",
        "kin-partner": "Get down to the boats before everyone else does.",
        "cast-patron": "Speaks for the village with the Wa traders, and knows their headman.",
        arrive: "The Wa boats are drawn up on the beach, and their headman is sitting on a mat with cloth and strings of beads. You have a few iron blades. {patron} speaks their tongue a little, and will deal for you, for a share.",
        "self:label": "Take your iron blades down yourself",
        "supply:label": "Sell them rice and water for the crossing",
        offer: "The Wa headman turns your blades over, tests an edge on his thumb, and lays out a bolt of hemp cloth. His men are already loading the boats.",
        bargain: "You shake your head and wait. He adds a string of glass beads, then another. The boats leave on the evening wind, and you have the best of the bargain.",
        walked: "You shake your head and wait. He shrugs, rolls the cloth up, and trades with your neighbour instead. The boats leave on the evening wind.",
        took: "You take the cloth. It is a fair price, and you have it before the boats leave on the evening wind.",
        brokered: "{patron} does the talking, and keeps a string of beads for it. You come away with a bolt of the Wa cloth.",
        supplied: "You sell the Wa sailors rice and water for the crossing, and they pay in beads.",
        left: "The Wa boats leave on the evening wind. You never got down to them.",
      },
    },
    {
      // In 1543 a Chinese junk with Portuguese aboard came ashore on Tanegashima, and the lord bought two of their guns.
      scope: TANEGASHIMA,
      title: "Southern Barbarians",
      lines: {
        intro: "A Chinese ship has come in with strangers aboard. People are calling them Nanban, southern barbarians. They can't speak to anyone, but a Chinese sailor with them writes in characters in the sand. They carry iron tubes that throw fire and lead.",
        threat: "The lord is already buying their weapons. Anyone who can make or sell something they want will do well.",
        partner: "Your {partnerKin} {partner} says to stay away from them. Nobody knows what they want.",
        "kin-partner": "Go and look, if you must. But don't trust them.",
        "cast-patron": "Has been down to the ship already, and is arranging trade with the strangers.",
        arrive: "The strangers' ship is at anchor and their boat is on the beach. A Chinese sailor writes prices in the sand with a stick. {patron} can read him, and will deal for you, for a share.",
        "supply:label": "Sell the ship food and water",
        offer: "The Chinese sailor looks at what you've brought and writes a number in the sand. The strangers watch, bored.",
        bargain: "You rub out his number and write a bigger one. He laughs, and pays it in Chinese silver. One of the strangers fires his tube in the air, and everyone jumps.",
        walked: "You rub out his number and write a bigger one. He shrugs and turns to the next seller.",
        took: "You take his number. It is paid in Chinese silver, which is worth more than you thought.",
        brokered: "{patron} does the talking, and keeps a share. You are paid in Chinese silver. One of the strangers fires his tube in the air, and everyone jumps.",
        supplied: "The ship needs water, rice and firewood for the voyage, and pays in silver for all of it.",
        left: "The ship sails. Everyone is talking about the fire-tubes, and the smiths are already trying to copy them.",
      },
    },
    {
      // The salt caravan, the azalai, brought slabs of rock salt from Taghaza and later Taoudenni, and Timbuktu sent gold and grain north.
      scope: TIMBUKTU,
      title: "The Salt Caravan",
      lines: {
        intro: "The salt caravan has come in from the desert: hundreds of camels, each carrying slabs of rock salt from the mines far to the north. The town is full of noise and dust.",
        threat: "Here salt is traded almost weight for weight with gold. Whoever trades with them first gets the best of it.",
        partner: "Your {partnerKin} {partner} says the house needs salt for the year.",
        "kin-partner": "Get down to the caravan before the salt's all sold.",
        "cast-patron": "Hosts the caravan's merchants and takes a share of every deal.",
        arrive: "The caravan merchants are unloading their camels outside town. You need salt for the year, and you have cloth and grain to pay for it. {patron} will deal for you, for a share.",
        "self:label": "Go and bargain for salt yourself",
        "supply:label": "Sell the caravan grain for the road north",
        "self:then": "You load up your cloth and grain and go out to the caravan.",
        "supply:then": "You load up your grain and go out to the caravan.",
        market: "Trading at the caravan",
        go: "Be at the caravan's camp {meet}. It's marked on your map.",
        offer: "The merchant taps a slab of salt and names his price in cloth. Behind him, three other buyers are waiting.",
        bargain: "You name half his price and wait. He grumbles, and meets you in the middle. You carry home a slab of salt for the year.",
        walked: "You name half his price and wait. He turns to the next buyer, and by evening the good slabs are gone.",
        took: "You pay what he asks. It is dear, but the house has salt for the year.",
        brokered: "{patron} does the talking, and takes a share. You come away with a slab of salt for the house.",
        supplied: "The caravan will need grain for the road north. You sell them yours, and are paid in salt.",
        left: "The caravan sets off north again. You never got down to them.",
      },
    },
    {
      title: "Strangers to Trade",
      lines: {
        aim: "Make something out of the strangers before they leave.",
        intro: "Traders have come in from somewhere far off, with goods nobody here makes. People are crowding round to see.",
        threat: "They won't stay long, and whoever gets to them first gets the best of it.",
        partner: "Your {partnerKin} {partner} wants to see what they've brought.",
        "kin-partner": "Get down there before they leave.",
        "cast-patron": "Is dealing with the strangers for everyone here.",
        arrive: "The strangers have their goods laid out on mats by their boat. {patron} has dealt with them before, and will deal for you, for a share.",
        "self:label": "Go down and haggle yourself",
        "self:then": "You gather up what you have to sell and go down to the mats.",
        "broker:label": "Let {patron} deal for you, for a share",
        "supply:label": "Sell them food and water for the road",
        "supply:then": "You pack up what food you can spare and go down to their boat.",
        market: "Trading with the strangers",
        go: "Be at the strangers' boat {meet}. It's marked on your map.",
        offer: "The stranger looks over what you've brought, and makes an offer with his fingers. It is less than you hoped.",
        "take:label": "Take the first offer",
        "hold:label": "Hold out for more",
        bargain: "You shake your head and wait. He raises it, and raises it again. You come away with the best bargain anyone made today.",
        walked: "You shake your head and wait. He shrugs and turns to the next seller.",
        took: "You take it. It isn't a great price, but it's fair, and you have something nobody else here has.",
        brokered: "{patron} does the talking, and keeps a share. You come away with something nobody else here has.",
        supplied: "They need food and water for the road. You sell them yours at a good price, and are paid in their goods.",
        left: "The strangers leave. You never got down to them.",
      },
    },
  ],
};
