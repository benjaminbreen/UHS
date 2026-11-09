import { ruled } from "../history/order";
import { BRITAIN, CHINA, collectorOf, dueOf, neighbours, partnerWords, pickOf, pronounWords, temper, trade, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const castOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 60 && !c.player.relations?.some((r) => r.kind === "partner" && r.other === a.id));
  const suspect = pool.length ? pickOf(c, pool, "smuggler-suspect") : undefined;
  const official = suspect && collectorOf(c, (a) => a.householdId !== suspect.householdId);
  return suspect && official ? { suspect, official } : undefined;
};

/** Out on the water before dawn, you saw a boat unload where no boat should,
 * and knew the person carrying the cargo up the beach. */
export const smuggler: PlotTemplate = {
  id: "smuggler",
  shape: "witness",
  look: {
    emblem: "cove",
    palette: { ink: "#0c1016", fill: "#1a2632", edge: "#3c5a68", light: "#e2eaee", accent: "#e8a650" },
  },
  weight: (c) => (trade(c, /fish|boat|sail|ferry|shell/) && ruled(c.setting) && castOf(c) ? 0.6 * temper(c, "conscientiousness") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const suspect = cast.suspect!, official = cast.official!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const searchers = within(c, { years: [1700, 1850], bounds: BRITAIN }) ? "the riding officers"
      : within(c, { years: [1371, 1567], bounds: CHINA }) ? "the coast-guard soldiers" : "the watch";
    return {
      deadline,
      words: {
        suspect: suspect.name,
        official: official.name,
        due,
        cargo: pickOf(c, ["bales wrapped in oilcloth", "small heavy casks", "crates lashed with rope"], "smuggler-cargo"),
        searchers,
        Searchers: searchers.replace(/^./, (x) => x.toUpperCase()),
        ...pronounWords(suspect),
        ...p.words,
      },
      refs: { suspect: suspect.id, official: official.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "decide", focus: "suspect", choices: [{ id: "cut" }, { id: "warned" }, { id: "informed" }, { id: "silent" }] }],
  developments: [
    { id: "marked", when: { type: "fired", id: "led" }, then: [{ type: "regard", role: "suspect", delta: -3 }, { type: "regard", role: "official", delta: 2 }] },
    { id: "owed", when: { type: "fired", id: "warned" }, then: [{ type: "regard", role: "suspect", delta: 2 }] },
    {
      id: "run",
      when: { type: "all", of: [{ type: "fired", id: "cut" }, { type: "since", hours: 2 }] },
      then: [{ type: "choose", line: "run", focus: "suspect", from: "suspect", choices: [{ id: "ran", check: { stat: "agility", skill: "wayfaring", odds: 0.6 } }, { id: "cask" }] }],
    },
    {
      id: "search",
      when: { type: "all", of: [{ type: "fired", id: "informed" }, { type: "since", hours: 2 }] },
      then: [{ type: "choose", line: "search", focus: "official", choices: [{ id: "led" }, { id: "pointed", check: { stat: "wit", odds: 0.5 } }] }],
    },
  ],
  endings: [
    { id: "caught", when: { type: "fired", id: "ran:failed" } },
    { id: "ran", when: { type: "fired", id: "ran" } },
    { id: "cask", when: { type: "fired", id: "cask" } },
    { id: "missed", when: { type: "fired", id: "pointed:failed" } },
    { id: "unseen", when: { type: "fired", id: "pointed" } },
    { id: "informed", when: { type: "fired", id: "led" } },
    { id: "warned", when: { type: "fired", id: "warned" } },
    { id: "silent", when: { type: "fired", id: "silent" } },
    { id: "gone", when: { type: "gone", role: "suspect" } },
    { id: "silent", when: { type: "due" } },
  ],
  wording: [
    {
      // Tea and brandy came ashore by the ton under the high duties of the 18th century; riding officers patrolled the coast for the Customs.
      scope: { years: [1700, 1850], bounds: BRITAIN },
      title: "A Boat Before Dawn",
      lines: {
        intro: "Coming in before dawn, you saw a lugger standing off the cove and men carrying {cargo} up the beach. One of them was {suspect}. Brandy and tea landed that way pay no duty.",
        threat: "Most people on this coast buy smuggled goods, and some inform on the smugglers for the reward.",
        partner: "Your {partnerKin} {partner} says informers get their nets cut.",
        "kin-partner": "You saw nothing. It's safer that way.",
        cask: "You stay home. That night a small cask of brandy is left at your door, and nobody says a word about it.",
        informed: "You lead {searchers} to the cove, and they dig the rest of the cargo out of the sand. There is a reward for you, and your nets are cut within the week.",
      },
    },
    {
      // The Ming sea ban forbade private overseas trade from 1371 until it was eased at Yuegang in 1567.
      scope: { years: [1371, 1567], bounds: CHINA },
      title: "A Boat Before Dawn",
      lines: {
        intro: "Coming in before dawn, you saw a junk anchored off the inlet and men carrying {cargo} ashore. One of them was {suspect}. Private trade over the sea is forbidden by the sea ban.",
        threat: "Half the coast lives off that trade, and the punishment for it is severe.",
        partner: "Your {partnerKin} {partner} says to forget what you saw.",
        "kin-partner": "Those people have friends. Forget what you saw.",
        cask: "You stay home. That night a bolt of foreign cloth is left at your door, and nobody says a word about it.",
      },
    },
    {
      title: "A Boat Before Dawn",
      lines: {
        aim: "Decide what to do about the boat you saw, {due}.",
        intro: "Coming in before dawn, you saw a boat unloading where no boat should be, and someone carrying {cargo} up the shore. It was {suspect}. Nobody has paid duty on that cargo.",
        threat: "Telling could bring you a reward, or a lot of enemies.",
        partner: "Your {partnerKin} {partner} says to forget what you saw.",
        "kin-partner": "Forget it. It's safer if you didn't see anything.",
        "cast-suspect": "Was carrying cargo up the shore before dawn.",
        "cast-official": "Has the ear of {authority}, and would want to know.",
        decide: "{suspect} passes you on the shore and gives you a long look. {He} knows someone was out on the water.",
        "cut:label": "Ask {suspect} for a cut",
        "cut:then": "You tell {suspect} what you saw, and what it's worth to you. {He} grins. \"I'll come and find you.\"",
        "warned:label": "Let {suspect} know you saw",
        "informed:label": "Tell {official}",
        "informed:then": "You tell {official}, who wants to know more before anyone moves.",
        "silent:label": "Forget you saw it",
        run: "{suspect} finds you mending nets. The rest of the cargo comes in tonight and they need another boat. A good night's pay, if you'll row.",
        "ran:label": "Row out tonight",
        "ran:failed": "Halfway in, a lantern shows on the beach. {searchers} were waiting.",
        "cask:label": "Take a share and stay home",
        search: "{official} wants to know exactly where the cargo went up the shore. {Searchers} will search tonight.",
        "led:label": "Show them the place yourself",
        "pointed:label": "Tell them where, and stay out of sight",
        caught: "You get away over the rocks, but your boat is taken and your name is known. It will cost you a heavy fine to get either back.",
        ran: "You row out in the dark, bring in two loads without a light showing, and are home before dawn with more money than a month's fishing.",
        cask: "You stay home. That night some of the cargo is left at your door, and nobody says a word about it.",
        missed: "{Searchers} dig in the wrong place and find nothing. {official} thinks you wasted everyone's night, and by morning {suspect} knows someone talked.",
        unseen: "{Searchers} find the cargo where you said. There is a reward, paid quietly, and nobody on the shore knows where it came from.",
        informed: "You lead {searchers} to the place, and they find the rest of the cargo. There is a reward for you, and some people on the shore stop speaking to you.",
        warned: "You tell {suspect} you saw, and that you'll say nothing. {He} nods slowly. By night the cargo has gone somewhere else, and {he} owes you.",
        silent: "You say nothing, and the cargo vanishes into the town.",
        gone: "With {suspect} gone, the shore is quiet at night.",
      },
    },
  ],
};
