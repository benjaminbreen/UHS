import { BRITAIN, neighbours, notable, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const ICELAND = [-25, 63, -13, 67] as const;

const coastal = (c: PlotContext) => !!c.setting && (/^coast|island|ocean/.test(c.setting.water) || c.setting.settlement === "port");

const castOf = (c: PlotContext) => {
  const owner = notable(c);
  const pool = neighbours(c).filter((a) => a.householdId !== owner?.householdId && (a.age ?? 30) < 60);
  const neighbour = pool.length ? pickOf(c, pool, "whale-neighbour") : undefined;
  return owner && neighbour ? { owner, neighbour } : undefined;
};

/** A whale has come ashore in the night: a year's oil and meat lying on the sand, and the question of whose it is. */
export const whale: PlotTemplate = {
  id: "whale",
  shape: "discovery",
  look: {
    emblem: "shore",
    palette: { ink: "#0c1014", fill: "#2a4250", edge: "#8a7a5a", light: "#e6eef2", accent: "#a8c4d0" },
  },
  weight: (c) => (coastal(c) && castOf(c) ? 0.4 * temper(c, "openness") : 0),
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
        ...pronounWords(owner),
        ...p.words,
      },
      refs: { owner: owner.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "beach", focus: "neighbour", choices: [{ id: "tell" }, { id: "cut", check: { stat: "wit", odds: 0.5 } }] }],
  developments: [
    { id: "thanked", when: { type: "fired", id: "tell" }, then: [{ type: "regard", role: "patron", delta: 1 }] },
    { id: "seen", when: { type: "fired", id: "cut:failed" }, then: [{ type: "regard", role: "patron", delta: -2 }] },
  ],
  endings: [
    { id: "caught", when: { type: "fired", id: "seen" } },
    { id: "cut", when: { type: "fired", id: "cut" } },
    { id: "shared", when: { type: "fired", id: "tell" } },
    { id: "missed", when: { type: "due" } },
  ],
  wording: [
    {
      // The Grágás laws spend pages on stranded whales; Grettis saga has men killed over one. Hvalreki, "whale drift", still means a windfall.
      scope: { years: [870, 1900], bounds: ICELAND },
      title: "Whale Drift",
      lines: {
        intro: "A whale has come ashore in the night. Meat, blubber for oil, bone for tools: whale drift, the luckiest thing that can happen on this coast.",
        threat: "By law it belongs to {owner}, who owns that stretch of shore, and the finder is owed a share. Families have feuded over stranded whales before.",
        partner: "Your {partnerKin} {partner} is sharpening every knife in the house.",
        "kin-partner": "Tell {owner} first. Then we have a right to some of it.",
        "cast-patron": "Owns the shore where the whale lies.",
        beach: "You found it, and nobody else is down yet but {neighbour}, who is already cutting. {owner}'s farm is an hour's walk along the shore.",
        "tell:label": "Go to {owner} and claim the finder's share",
        shared: "{owner} gives you the finder's share without argument. There will be meat and oil in your house till spring.",
        cut: "You and {neighbour} get a sledge-load of meat and blubber home before anyone else comes down. Nobody saw.",
        caught: "{owner}'s shepherd sees you hauling it up the beach. Taking whale drift from another's shore is theft under the law, and {owner} means to bring it to the assembly.",
      },
    },
    {
      // A stranded whale was a royal fish: by a statute of about 1324 it belonged to the Crown, or to a lord the Crown had granted the shore.
      scope: { years: [1300, 1900], bounds: BRITAIN },
      title: "A Royal Fish",
      lines: {
        intro: "A whale has come ashore in the night. By law a whale is a royal fish: it belongs to the Crown, or to whoever the Crown has given the shore. Here that is {owner}.",
        threat: "Taking any of it without leave is theft. But it is a lot of meat and oil, and nobody is guarding it yet.",
        partner: "Your {partnerKin} {partner} says the lord's men will take it all and leave nothing for the people who live here.",
        "kin-partner": "Tell {owner}. Better to get a share honestly than be caught.",
        "cast-patron": "Holds the rights to the shore, and so to the whale.",
        beach: "Nobody is down yet but {neighbour}, who has a knife and a bucket and is already cutting blubber. {owner}'s people will come as soon as they hear.",
        "tell:label": "Report it to {owner}",
        shared: "{owner} lets you have a share of the oil for bringing word first. It's fair, and you came by it honestly.",
        cut: "You and {neighbour} get a good load of meat and blubber home before {owner}'s people arrive. Nobody saw.",
        caught: "{owner}'s bailiff arrives while you are still cutting, and writes your name down. You will answer for it at the manor court.",
      },
    },
    {
      title: "A Whale on the Beach",
      lines: {
        aim: "Get your share of the whale.",
        intro: "A whale has come ashore in the night. Meat, fat, bone and sinew, more than everyone here can eat.",
        threat: "There are rules about who gets which part, and {owner} will want them kept.",
        partner: "Your {partnerKin} {partner} is sharpening every knife in the house.",
        "kin-partner": "Tell {owner} first. Then nobody can say we took too much.",
        "cast-patron": "Will have the final say on how the whale is divided.",
        "cast-neighbour": "Is already on the beach with a knife, cutting.",
        beach: "Nobody is down yet but {neighbour}, who is already cutting. Once {owner} hears, the dividing will start, and it will be done {his} way.",
        "tell:label": "Tell {owner} and wait for the dividing",
        "cut:label": "Cut a share with {neighbour} now",
        shared: "{owner} gives you a good share for bringing word first. There will be meat and oil in your house for a long time.",
        cut: "You and {neighbour} get a good load of meat home before the dividing starts. Nobody saw.",
        caught: "{owner} comes down the beach while you are still cutting. You are left out of the dividing, and everyone knows why.",
        missed: "By evening the whale has been divided up, and you weren't there for it.",
      },
    },
  ],
};
