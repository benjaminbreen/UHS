import { dueOf, fillIn, JAPAN, neighbours, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { Actor } from "../../core/types";
import type { PlotContext, PlotTemplate } from "./types";

const single = (c: PlotContext, a: Actor) => !c.actors.some((b) => !b.dead && a.relations?.some((r) => r.kind === "partner" && r.other === b.id));

const castOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 60 && !c.player.relations?.some((r) => r.kind === "partner" && r.other === a.id));
  const suspect = pool.length ? pickOf(c, pool, "token-suspect") : undefined;
  const others = pool.filter((a) => a.householdId !== suspect?.householdId);
  const neighbour = others.length ? pickOf(c, others, "token-neighbour") : undefined;
  return suspect && neighbour ? { suspect, neighbour } : undefined;
};

/** Something has been left at your door in the night, and you don't know
 * whether it is a kindness or a curse. */
export const token: PlotTemplate = {
  id: "token",
  shape: "mystery",
  look: {
    emblem: "token",
    palette: { ink: "#16121c", fill: "#3a2c40", edge: "#7a5a5a", light: "#f4ece4", accent: "#e8b070" },
  },
  weight: (c) => (castOf(c) ? 0.5 * temper(c, "openness") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const suspect = cast.suspect!, neighbour = cast.neighbour!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const who = { suspect: suspect.name, ...pronounWords(suspect) };
    const courting = single(c, c.player) && single(c, suspect) && (c.player.age ?? 30) < 40 && (suspect.age ?? 30) < 40;
    return {
      deadline,
      words: {
        ...who,
        neighbour: neighbour.name,
        due,
        reason: fillIn(courting
          ? "{suspect} has been working up the nerve to speak to you for a long time, and this was as far as {he} got"
          : pickOf(c, ["years ago your household fed {suspect}'s through a hard winter, and {he} never found a way to say thank you",
            "you once pulled {suspect}'s child out of the water, and {he} has wanted to repay you ever since"], "token-reason"), who),
        reply: courting ? "You both hope to see more of each other." : "The two households have been friends ever since.",
        quarrel: pickOf(c, ["the quarrel over a borrowed tool that came back broken", "the argument at the last big gathering", "the quarrel over whose turn it was to fetch water"], "token-quarrel"),
        ...p.words,
      },
      refs: { suspect: suspect.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "seen",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "seen", focus: "suspect", choices: [{ id: "asked" }, { id: "neighbour" }, { id: "watch", check: { stat: "wit", odds: 0.5 } }] }],
    },
    {
      id: "wrong",
      when: { type: "fired", id: "neighbour" },
      then: [{ type: "regard", role: "neighbour", delta: -1 }, { type: "choose", line: "wrong", focus: "neighbour", choices: [{ id: "asked" }, { id: "drop" }] }],
    },
    { id: "found", when: { type: "fired", id: "asked" }, then: [{ type: "choose", line: "blush", focus: "suspect", choices: [{ id: "warm" }, { id: "cool" }] }] },
    {
      id: "caught",
      when: { type: "all", of: [{ type: "fired", id: "watch" }, { type: "not", of: { type: "fired", id: "watch:failed" } }] },
      then: [{ type: "choose", line: "dawn", focus: "suspect", choices: [{ id: "warm" }, { id: "cool" }] }],
    },
    { id: "glad", when: { type: "fired", id: "warm" }, then: [{ type: "regard", role: "suspect", delta: 3 }] },
    { id: "hurt", when: { type: "fired", id: "cool" }, then: [{ type: "regard", role: "suspect", delta: -2 }] },
  ],
  endings: [
    { id: "found", when: { type: "fired", id: "warm" } },
    { id: "cool", when: { type: "fired", id: "cool" } },
    { id: "unsolved", when: { type: "fired", id: "watch:failed" } },
    { id: "unsolved", when: { type: "fired", id: "drop" } },
    { id: "gone", when: { type: "gone", role: "suspect" } },
    { id: "unsolved", when: { type: "due" } },
  ],
  wording: [
    {
      // Heian courtship ran on poems: a verse tied to a flowering branch, left for someone to find.
      scope: { years: [794, 1185], bounds: JAPAN },
      title: "A Poem at the Door",
      lines: {
        aim: "Find out who left a poem at your door, {due}.",
        intro: "This morning you found a sprig of plum blossom tied to your gate, with a slip of paper knotted round it. On it is a short poem in a careful hand. It isn't signed.",
        threat: "It may be kindly meant. It may be a joke at your expense. Either way, people will have seen it.",
        partner: "Your {partnerKin} {partner} wants very much to know who it is from.",
        "kin-partner": "Who is writing you poems? I'd like to know too.",
        "cast-suspect": "Has a careful hand with a brush.",
        "cast-neighbour": "Has not spoken to you since {quarrel}.",
        seen: "You notice {suspect} watching your gate, and looking away quickly when you turn. But {neighbour}'s household has been laughing about something all morning.",
        "watch:label": "Tie a reply poem to the gate, and watch",
        "watch:failed": "You tie a reply poem to the gate and watch from behind the blinds. Nobody comes for it, and in the end you fall asleep.",
        dawn: "Before dawn someone comes to the gate and unties your reply: {suspect}. Caught, {he} tells you everything. It turns out {reason}.",
        found: "You write a proper answering poem and have it carried to {suspect}'s gate on a branch of your own. {reply}",
        wrong: "You ask {neighbour} about the poem, and get laughed at. After {quarrel}, nobody in that house would write you a poem.",
        gone: "With {suspect} gone, you never learn who wrote it. You keep the poem anyway.",
        unsolved: "You never find out. The blossom wilts, but you keep the poem.",
      },
    },
    {
      scope: { years: [-50000, -3000] },
      title: "Something at the Door",
      lines: {
        aim: "Find out who left the carving at your shelter, {due}.",
        intro: "This morning there was a small carved figure of bone at the mouth of your shelter, set on a flat stone, with red ochre rubbed into its lines. Nobody has said a word about it.",
        threat: "A carving like that can be a gift, or it can be a way of wishing someone harm.",
        partner: "Your {partnerKin} {partner} won't touch it until you find out who made it.",
        "kin-partner": "Don't bring it inside until we know whose hands made it.",
        "cast-suspect": "Has been carving bone by the fire in the evenings.",
        "cast-neighbour": "Has not spoken to you since {quarrel}.",
        seen: "You notice {suspect} has fresh ochre under {his} fingernails. But {neighbour} was seen near your shelter at first light.",
        dawn: "Before dawn someone comes to the mouth of your shelter to see whether the carving was taken, and finds your gift waiting: {suspect}. Caught, {he} tells you everything. It turns out {reason}.",
        wrong: "You ask {neighbour} about the carving, and get a cold answer. After {quarrel}, you are the last person {neighbour} would make a gift for.",
        gone: "With {suspect} gone, you never learn who made it. You keep it anyway.",
        unsolved: "You never find out. In the end you keep the carving and wear it on a cord.",
      },
    },
    {
      title: "Something at the Door",
      lines: {
        aim: "Find out who left something at your door, {due}.",
        intro: "This morning you found a small carved token on your doorstep, wrapped in a clean cloth. There's no note and nobody has said a word about it.",
        threat: "It may be a kindness. It may be someone wishing you harm. You'd like to know which.",
        partner: "Your {partnerKin} {partner} wants to know who it's from.",
        "kin-partner": "Who's leaving you things? Go and find out.",
        "cast-suspect": "Has been working on something small in the evenings.",
        "cast-neighbour": "Has not spoken to you since {quarrel}.",
        seen: "You notice {suspect} watching your door, and looking away quickly when you turn. But {neighbour} was out this way early too, and {neighbour} has reasons to wish you ill.",
        "asked:label": "Ask {suspect}",
        "neighbour:label": "Ask {neighbour}",
        "watch:label": "Leave something out in return, and watch",
        "watch:failed": "You leave a small gift on your own step and watch from inside. Nobody comes, and in the end you fall asleep.",
        wrong: "You ask {neighbour} about the token, and get a cold answer. After {quarrel}, you are the last person {neighbour} would leave a gift for.",
        "drop:label": "Let it be",
        blush: "You ask {suspect}, who goes red. It turns out {reason}.",
        dawn: "Before dawn someone crouches at your step to see if the gift was taken, and finds yours waiting: {suspect}. Caught, {he} tells you everything. It turns out {reason}.",
        "warm:label": "Thank {him} properly",
        "cool:label": "Give it back",
        found: "You thank {suspect} properly, and the next day you leave something on {his} step. {reply}",
        cool: "You hand it back and say it isn't needed. {suspect} takes it without a word. After that, {he} avoids you in the street.",
        gone: "With {suspect} gone, you never learn who left it. You keep it anyway.",
        unsolved: "You never find out. You put the token on the shelf, and sometimes wonder who left it.",
      },
    },
  ],
};
