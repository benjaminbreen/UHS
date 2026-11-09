import { BRITAIN, neighbours, notable, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const coastal = (c: PlotContext) => !!c.setting && (/^coast|island/.test(c.setting.water) || c.setting.settlement === "port");

const castOf = (c: PlotContext) => {
  const owner = notable(c);
  const pool = neighbours(c).filter((a) => a.householdId !== owner?.householdId && (a.age ?? 30) < 60);
  const neighbour = pool.length ? pickOf(c, pool, "wreck-neighbour") : undefined;
  return owner && neighbour ? { owner, neighbour } : undefined;
};

/** A ship broke up on the rocks in the night, and its cargo is coming ashore with every wave. */
export const wreck: PlotTemplate = {
  id: "wreck",
  shape: "discovery",
  look: {
    emblem: "wreck",
    palette: { ink: "#0e1012", fill: "#34424c", edge: "#7a6a52", light: "#e8ecee", accent: "#d89a4a" },
  },
  weight: (c) => (coastal(c) && castOf(c) ? 0.35 * temper(c, "openness") : 0),
  cast: (c) => {
    const found = castOf(c);
    return found && { patron: found.owner, neighbour: found.neighbour };
  },
  begin: (c, cast) => {
    const owner = cast.patron!, neighbour = cast.neighbour!;
    const p = partnerWords(c);
    const midnight = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: midnight + 18 * 3600,
      words: {
        owner: owner.name,
        neighbour: neighbour.name,
        cargo: pickOf(c, ["barrels", "bales of cloth", "sealed jars", "timber and crates", "sacks of grain"], "wreck-cargo"),
        ...pronounWords(owner),
        ...p.words,
      },
      refs: { owner: owner.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "beach", focus: "neighbour", choices: [{ id: "survivor" }, { id: "report" }, { id: "carry" }] }],
  developments: [
    { id: "told", when: { type: "fired", id: "report" }, then: [{ type: "regard", role: "patron", delta: 1 }] },
    { id: "asked", when: { type: "after", id: "carry", hours: 2 }, then: [{ type: "choose", line: "asked", focus: "patron", choices: [{ id: "hide", check: { stat: "wit", odds: 0.5 } }, { id: "give" }] }] },
    { id: "searched", when: { type: "fired", id: "hide:failed" }, then: [{ type: "regard", role: "patron", delta: -2 }] },
  ],
  endings: [
    { id: "rescued", when: { type: "after", id: "survivor", hours: 2 } },
    { id: "reported", when: { type: "fired", id: "told" } },
    { id: "found", when: { type: "fired", id: "searched" } },
    { id: "salvaged", when: { type: "fired", id: "hide" } },
    { id: "returned", when: { type: "fired", id: "give" } },
    { id: "washed", when: { type: "due" } },
  ],
  wording: [
    {
      // The Statute of Westminster (1275): if a man, a dog or a cat came ashore alive, it was not wreck, and the goods were kept a year and a day for the owner.
      scope: { years: [1275, 1850], bounds: BRITAIN },
      title: "Wreck",
      lines: {
        intro: "A ship broke up on the rocks in the night. There are {cargo} all along the tide line, and more coming in with every wave. One sailor came ashore alive, clinging to a spar, and is lying in the surf.",
        partner: "Your {partnerKin} {partner} wants nothing to do with the cargo. Somebody owns all that.",
        threat: "If the sailor lives, the law says it isn't wreck at all: the goods are to be kept a year and a day for whoever owns them. Not everyone on the beach knows that, or cares.",
        "kin-partner": "Somebody owns all that. Tell {owner}.",
        "cast-patron": "Holds the rights to this shore, and will have to answer for what goes missing from it.",
        rescued: "The sailor lives. Weeks later a letter comes from the merchants who owned the cargo, kept safe for them under the law, with a reward for the one who pulled their man out of the surf.",
        reported: "{owner} has the goods stacked and guarded until the owners send for them. {He} remembers that you came straight to {him}.",
        salvaged: "{owner}'s steward goes from house to house, but you have it hidden in the thatch, and nobody saw anything.",
        found: "{owner}'s steward finds the bales in your thatch. Taking goods from a wreck with a survivor is theft, and you will answer for it at the next assizes.",
        returned: "You carry it all back down to {owner}'s stack. The steward writes your name down anyway, but as one who gave things back.",
      },
    },
    {
      title: "Wreck",
      lines: {
        aim: "Decide what to do about the wreck.",
        intro: "A ship broke up on the rocks in the night. There are {cargo} all along the tide line, and more coming in with every wave. One sailor came ashore alive, clinging to a spar, and is lying in the surf.",
        threat: "Whatever is on the beach is anyone's now, some say. {owner} won't see it that way.",
        partner: "Your {partnerKin} {partner} says to stay away from it. Somebody will come looking for those goods.",
        "kin-partner": "Tell {owner}. Then nobody can say we stole.",
        "cast-patron": "The one people here answer to, and who will want a say in what washes up.",
        "cast-neighbour": "Is carrying {cargo} up the beach as fast as possible.",
        beach: "{neighbour} is already carrying {cargo} up the beach. Nobody has gone to the sailor in the surf. The tide will turn within the hour.",
        "survivor:label": "Pull the sailor out of the surf",
        "survivor:then": "You drag the sailor up the beach and get a fire going. Behind you, people are carrying off {cargo}.",
        "report:label": "Run and tell {owner}",
        "carry:label": "Carry {cargo} off with {neighbour}",
        "carry:then": "You and {neighbour} get two good loads up the beach and out of sight before the tide turns.",
        asked: "{owner}'s people are going from house to house, asking who carried what off the beach.",
        "hide:label": "Say you saw nothing",
        "give:label": "Hand over what you took",
        rescued: "The sailor lives, and before he leaves he tells you whose ship it was, and that they pay well for word of their goods.",
        reported: "{owner} has the goods carried up and shares them out fairly. You get your part, and {his} thanks.",
        salvaged: "{owner}'s people look around and go away. You have a load of {cargo} hidden, and nobody saw anything.",
        found: "{owner}'s people find it where you hid it. They take it back, and everyone knows where they found it.",
        returned: "You carry it all back. {owner} gives you a little of it for your honesty, which is more than the others got.",
        washed: "By evening the tide has taken back what nobody carried off.",
      },
    },
  ],
};
