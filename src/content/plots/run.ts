import { seasonAt } from "../../core/livelihood";
import { B, dueOf, JAPAN, partnerWords, temper, trade } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const wintry = (c: PlotContext) => !!c.setting && seasonAt(c.setting.season, c.clock) === "winter";
const any = (...of: Condition[]): Condition => ({ type: "not", of: { type: "all", of: of.map((c) => ({ type: "not", of: c })) } });

/** A shoal has come inshore, and everyone who can pull a net or gut a fish
 * works until dark. */
export const run: PlotTemplate = {
  id: "run",
  shape: "work",
  look: {
    emblem: "shoal",
    palette: { ink: "#0c1216", fill: "#1a3442", edge: "#6a5238", light: "#e4eef2", accent: "#e0b45a" },
  },
  weight: (c) => (trade(c, /fisher|net-maker/) && !wintry(c) ? 0.8 * temper(c, "endurance") : 0),
  cast: () => ({}),
  begin: (c) => {
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return { deadline, words: { due, ...p.words }, refs: p.refs };
  },
  opening: [],
  developments: [
    {
      id: "snag",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "snag", choices: [{ id: "cut" }, { id: "dive", check: { stat: "agility", odds: 0.5 } }] }],
    },
    {
      id: "light",
      when: { type: "all", of: [any({ type: "fired", id: "cut" }, { type: "fired", id: "dive" }), any({ type: "fired", id: "worked" }, { type: "since", hours: 2.5 })] },
      then: [{ type: "choose", line: "light", choices: [{ id: "haul", check: { stat: "endurance", odds: 0.55 } }, { id: "sell" }] }],
    },
  ],
  endings: [
    { id: "swamped", when: { type: "fired", id: "haul:failed" } },
    { id: "full", when: { type: "fired", id: "haul" } },
    { id: "sold", when: { type: "fired", id: "sell" } },
    { id: "missed", when: { type: "due" } },
  ],
  wording: [
    {
      // The North Sea and Baltic herring fisheries: gutted and packed in salt within a day, or the catch spoiled.
      scope: { years: [1000, 1900], bounds: [-6, 50, 30, 66] },
      title: "The Herring Are In",
      lines: {
        aim: "Get the herring ashore and into salt before they spoil.",
        intro: "The herring have come in close, so thick the water looks silver. Every boat is out, and on the shore the women are setting up the gutting tables and rolling out empty barrels.",
        threat: "A shoal like this can pay for the whole winter. Herring not gutted and salted by tomorrow are worth nothing.",
        partner: "Your {partnerKin} {partner} has gone down to the gutting tables with a knife.",
        "kin-partner": "There's salt for forty barrels. Bring in enough to fill them.",
        light: "The boat is low in the water and your arms are shaking. The shoal is still there. The curers on the shore are paying well for the first boats in. Once the whole fleet lands, the price will drop by half.",
        full: "You come in long after dark, low in the water. By morning the last barrel is packed and hammered shut, and it was the best night of the year.",
        sold: "You come in early and sell to the first curer on the beach at the top price. By the time the fleet lands, herring are going for half that.",
      },
    },
    {
      // Edo-period sardines were mostly dried for fertiliser (hoshika) and sold to cotton growers.
      scope: { years: [1600, 1950], bounds: JAPAN },
      title: "The Sardines Are In",
      lines: {
        aim: "Bring in the sardines and spread them to dry before dark.",
        intro: "A huge shoal of sardines has come into the bay. The beach net needs every pair of hands to haul it, and the catch has to be spread on the sand to dry. Dried sardine is fertiliser, and the cotton growers inland pay well for it.",
        threat: "A haul like this pays off debts. Sardines left in heaps rot by morning.",
        partner: "Your {partnerKin} {partner} is raking the fish out on the sand.",
        "kin-partner": "The merchant says he'll take everything we can dry.",
        light: "The sand is covered and your shoulders are burning. The merchant's agent is paying well for what's already dry. The shoal is still in the bay.",
        sold: "You stop and sell what's dry to the merchant's agent while he's still paying the full price. By the next day the beach is covered and the price has dropped.",
      },
    },
    {
      // Northwest Coast peoples built weirs across the rivers and split and smoked the salmon for the winter.
      scope: { years: [B(5000), 1900], bounds: [-135, 40, -120, 60] },
      title: "The Salmon Are Running",
      lines: {
        aim: "Take salmon at the weir and get them split and onto the racks.",
        intro: "The salmon are running up the river, so many that they jostle at the weir. The traps fill as fast as you can empty them, and every fish has to be split and hung on the drying racks over the smoke.",
        threat: "What you dry now is what your household eats all winter.",
        partner: "Your {partnerKin} {partner} is splitting fish as fast as you bring them.",
        "kin-partner": "The racks are full. We'll need to build another.",
        snag: "A log has come down the river and wedged against the weir. Your trap is caught under it and the stakes are bending.",
        "cut:label": "Let the trap go",
        "cut:then": "You cut the lashings and the trap goes downstream under the log. You fish with a dip net for the rest of the day.",
        "dive:label": "Go in and free it",
        "dive:then": "You wade in to your chest, lever the log off with a pole, and drag the trap back onto the stakes.",
        "dive:failed": "The current nearly takes your legs from under you. You get out, soaked and shaking, and the trap is gone.",
        light: "The racks are full and the splitters can't keep up. Fish are piling up on the bank. The traps are full again.",
        "haul:label": "Keep the traps going",
        "sell:label": "Stop and help with the splitting",
        full: "You keep the fish coming until dark, and the splitters work by firelight. The smokehouse is full to the roof.",
        swamped: "You brought in more than anyone could split. By morning a heap of fish on the bank has gone soft, and the ravens are at it.",
        sold: "You put down the traps and take up a knife. Every fish you caught is split and hung by dark, and nothing is wasted.",
      },
    },
    {
      // Lampara fishing: lamps hung over the water at night draw sardines and anchovies to the surface.
      scope: { years: [B(800), 2100], bounds: [-6, 30, 36, 46] },
      title: "The Sardines Are In",
      lines: {
        aim: "Bring in the catch and sell it before it turns.",
        intro: "Last night's lamps drew a big shoal of sardines up to the surface. The boats are back out, and every catch has to be sorted, sold and salted before the heat gets to it.",
        threat: "With this many fish the price is low. What isn't sold or salted by evening will have to be thrown away.",
        partner: "Your {partnerKin} {partner} is packing fish into jars with salt.",
        "kin-partner": "The buyers from up the hill are here. Go and talk to them.",
      },
    },
    {
      // Coastal Peru: anchoveta dried on the beach fed the coast and went up the valleys in trade for cotton and maize.
      scope: { years: [B(3000), 1950], bounds: [-82, -19, -69, -3] },
      title: "The Anchovies Are In",
      lines: {
        aim: "Bring in the anchovies and lay them out to dry.",
        intro: "The cold current has brought the anchovies in close, and the water is boiling with them. The birds are diving and every boat on the beach is out. The catch is dried on the sand and goes up the valleys in trade for cotton and maize.",
        threat: "Some years the warm water comes and the anchovies vanish. When they're here, you take all you can.",
        partner: "Your {partnerKin} {partner} is spreading fish on the sand to dry.",
        "kin-partner": "The traders from up the valley will want all of this.",
        light: "Your boat is low in the water and your arms are shaking. The traders from up the valley give the most maize for the first loads in. Once every boat has landed, they'll give half.",
        sold: "You come in early and trade your catch while the valley men are still eager. By dusk the beach is covered and they're picking and choosing.",
      },
    },
    {
      title: "The Fish Are In",
      lines: {
        aim: "Bring in as much of the shoal as you can and get it ashore.",
        intro: "A shoal has come in close, and the nets are full every time they go out. Everyone who can pull a net or clean a fish is down at the water.",
        threat: "A day like this makes up for weeks of empty nets, but the shoal won't stay long.",
        partner: "Your {partnerKin} {partner} is cleaning fish as fast as you bring them in.",
        "kin-partner": "Don't stop now. They'll be gone tomorrow.",
        snag: "Your net has caught on something on the bottom and won't come up. Pull any harder and it will tear.",
        "cut:label": "Cut it free",
        "cut:then": "You cut the lines and lose a corner of the net, but you're free and fishing again.",
        "dive:label": "Dive down and free it",
        "dive:then": "You go down into the cold water, find the net wrapped round a rock and work it loose. You come up gasping, with the whole net.",
        "dive:failed": "You go down twice and can't free it. In the end you cut it anyway, half frozen.",
        light: "The boat is low in the water and your arms are shaking. The shoal is still there. The buyers on the shore are paying well for the first boats in. Once everyone lands, the price will drop by half.",
        "haul:label": "Keep fishing till dark",
        "sell:label": "Come in and sell now",
        full: "You come in long after dark, so low in the water that waves slop over the side. It's the best catch you've had in years.",
        swamped: "In the dark a swell comes over the side, and you have to throw half the catch back to stay afloat. You get in soaked, with less than the boats that came in early.",
        sold: "You come in early and sell to the first buyer on the shore at the best price of the day. By the time the others land, fish are going for half that.",
        missed: "The day went by and you never got back out. The others have the catch that could have been yours.",
      },
    },
  ],
};
