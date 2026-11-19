import { goodName } from "../economy/products";
import { dueOf, neighbours, pickOf, temper, trade } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const SELLING = /shopkeeper|market-seller|hawker|vendor|grocer|pedlar|chapman|costermonger|innkeeper|publican|barber|hairdresser|cobbler|tailor|dressmaker|confectioner/;

const friendOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => Math.abs((a.age ?? 30) - (c.player.age ?? 30)) <= 15);
  return pool.length ? pickOf(c, pool, "slack-friend") : undefined;
};

export const slack: PlotTemplate = {
  id: "slack",
  shape: "work",
  look: {
    emblem: "stall",
    palette: { ink: "#12130f", fill: "#2a2c22", edge: "#7a5a36", light: "#eef0e4", accent: "#d8b85a" },
  },
  weight: (c) => (trade(c, SELLING) && friendOf(c) ? 0.5 * temper(c, "neuroticism") : 0),
  cast: (c) => {
    const friend = friendOf(c);
    return friend && { friend };
  },
  begin: (c, cast) => {
    const friend = cast.friend!;
    const { deadline } = dueOf(c.clock);
    const goods = c.household?.makes?.filter((g) => c.household?.producers?.[g] === c.player.id) ?? [];
    const good = pickOf(c, goods, "slack-stock");
    const lull = good ? `Someone asks the price of your ${goodName(good, c.household?.products?.[good])}, then walks on.`
      : "Two people stop to talk. Neither is here to buy anything.";
    return { deadline, words: { friend: friend.name, lull }, refs: { friend: friend.id } };
  },
  journal: { opens: "offered:nobody", missed: "empty", notes: [{ after: "lull", label: "At work", line: "intro", roles: ["friend"] }] },
  opening: [],
  developments: [
    { id: "lull", when: { type: "all", of: [{ type: "working" }, { type: "at", scene: "workplace" }, { type: "not", of: { type: "due" } }] },
      then: [{ type: "note", line: "intro" }] },
    { id: "nobody", when: { type: "all", of: [{ type: "fired", id: "lull" }, { type: "speaking", role: "friend" },
      { type: "at", scene: "workplace" }, { type: "not", of: { type: "due" } }] },
      then: [{ type: "choose", line: "nobody", from: "friend", at: "workplace", choices: [{ id: "shut", minutes: 15 }, { id: "tidy" }] }] },
    { id: "chatted", when: { type: "fired", id: "shut" }, then: [{ type: "regard", role: "friend", delta: 1 }] },
  ],
  endings: [
    { id: "company", when: { type: "fired", id: "shut" }, quiet: true },
    { id: "tidied", when: { type: "fired", id: "tidy" }, quiet: true },
    { id: "empty", when: { type: "due" }, quiet: true },
  ],
  wording: [{ title: "A Slow Day", lines: {
    aim: "Decide whether to take a break with {friend}.",
    intro: "{lull}",
    threat: "It's been a slow day for sales.",
    nobody: "Have you got a minute? I haven't seen you in a while.",
    "shut:label": "Take a break together",
    "tidy:label": "Keep working",
    company: "You spent a quarter of an hour catching up with {friend}.",
    tidied: "{friend} leaves you to your work.",
    empty: "Time to close up.",
  } }],
};
