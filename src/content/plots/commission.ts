import { livelihoodById } from "../characters/livelihoods";
import { pieceOf, recipeFor } from "../economy/recipes";
import { random } from "../../core/random";
import { ruled } from "../history/order";
import { dueOf, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const pieceFor = (c: PlotContext) => {
  const kit = livelihoodById(c.player.origin?.livelihood ?? "");
  const recipe = kit && recipeFor(kit);
  return c.setting && pieceOf(recipe, "spring", { pick: 0, year: c.setting.year, lon: c.setting.lon, lat: c.setting.lat },
    random(c.seed, "plot", "commission", "piece"));
};

/** Someone of standing wants a piece of your work for an occasion, and wants it soon. */
export const commission: PlotTemplate = {
  id: "commission",
  look: {
    emblem: "feast",
    palette: { ink: "#14110a", fill: "#262014", edge: "#6e5a26", light: "#f0e8d2", accent: "#d0a43a" },
  },
  weight: (c) => (pieceFor(c) && notable(c) ? 0.6 : 0),
  cast: (c) => {
    const patron = notable(c);
    return patron && { patron };
  },
  begin: (c, cast) => {
    const patron = cast.patron!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const stateless = !ruled(c.setting);
    return {
      deadline,
      words: {
        patron: patron.name,
        patronRole: patron.role.toLowerCase(),
        due,
        piece: pieceFor(c)!,
        occasion: pickOf(c, stateless
          ? ["a daughter's wedding", "the burial of an old man of the household", "guests coming from another village", "the midwinter gathering"]
          : ["a daughter's wedding", "a visit from someone important", "the festival", "a gift to someone above them"], "commission-occasion"),
        ...pronounWords(patron),
        ...p.words,
      },
      refs: { patron: patron.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "patron", line: "order" }],
  developments: [
    {
      id: "nudge",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "fired", id: "worked" } }] },
      then: [{ type: "card", line: "nudge", focus: "patron" }],
    },
    {
      id: "ready",
      when: { type: "all", of: [{ type: "fired", id: "worked" }, { type: "not", of: { type: "brought", role: "patron" } }] },
      then: [{ type: "card", line: "ready", focus: "patron" }],
    },
    {
      id: "thanks",
      when: { type: "brought", role: "patron" },
      then: [{ type: "regard", role: "patron", delta: 2 }],
    },
    {
      id: "late",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "brought", role: "patron" } }] },
      then: [{ type: "regard", role: "patron", delta: -2 }],
    },
  ],
  endings: [
    { id: "delivered", when: { type: "fired", id: "thanks" } },
    { id: "gone", when: { type: "gone", role: "patron" } },
    { id: "late", when: { type: "fired", id: "late" } },
  ],
  wording: [
    {
      title: "An Order to Fill",
      lines: {
        aim: "Finish your day's work, then bring {piece} to {patron}, {due}.",
        intro: "{patron} the {patronRole} wants {piece} for {occasion}, and wants it from you. It is the kind of order that brings others after it.",
        threat: "If it isn't ready in time, {he} will go to someone else, and so will the people who hear about it.",
        partner: "Your {partnerKin} {partner} says everyone will see your work at {patron}'s.",
        "kin-partner": "Have you finished {patron}'s piece? Everyone will see it.",
        "cast-patron": "Has ordered {piece} for {occasion}.",
        order: "I want {piece} for {occasion}, and I want yours. Can you have it {due}?",
        nudge: "{patron} has sent someone round to ask how the work is going.",
        ready: "The work is done. Take {piece} to {patron}.",
        delivered: "{patron} turns {piece} over in {his} hands and is pleased. People will ask who made it.",
        gone: "With {patron} gone, nobody is waiting for {piece}.",
        late: "The work wasn't ready in time. {patron} has found {piece} somewhere else.",
      },
    },
  ],
};
