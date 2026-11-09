import { ruled } from "../history/order";
import { partnerWords, pickOf, pronounWords, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const partnerOf = (c: PlotContext) => {
  const id = c.player.relations?.find((r) => r.kind === "partner")?.other;
  return c.actors.find((a) => a.id === id && !a.dead && a.householdId === c.player.householdId);
};

/** You and your partner quarrelled last night, and neither has given way:
 * say sorry, make a peace offering, or wait it out. */
export const quarrel: PlotTemplate = {
  id: "quarrel",
  shape: "household",
  look: {
    emblem: "pair",
    palette: { ink: "#160e0e", fill: "#2e1c1a", edge: "#743c3c", light: "#f2e2de", accent: "#e8904a" },
  },
  weight: (c) => (partnerOf(c) ? 0.5 * temper(c, "neuroticism") * (2 - temper(c, "agreeableness")) : 0),
  cast: (c) => {
    const kin = partnerOf(c);
    return kin && { kin };
  },
  begin: (c, cast) => {
    const kin = cast.kin!;
    const p = partnerWords(c);
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 21 * 3600,
      words: {
        kin: kin.name,
        partnerKin: p.words?.partnerKin ?? "partner",
        about: pickOf(c, [
          "food: you ate the last of what was put by without asking",
          `${pronounWords(kin).his} family, and what they are owed and what they never give back`,
          c.player.relations?.some((r) => r.kind === "child") ? "the children, and which of you is too soft on them" : "whose turn it was to do the washing",
          ruled(c.setting) ? "money: you lent some to a friend without saying" : "a gift you gave away that was not only yours to give",
          "nothing much, though it still got loud",
        ], "quarrel-about"),
        ...pronounWords(kin),
      },
      refs: { kin: kin.id },
    };
  },
  opening: [
    { type: "walk-off", role: "kin", to: "friend" },
    { type: "choose", line: "morning", choices: [{ id: "sorry", check: { stat: "agreeableness", odds: 0.55 } }, { id: "gift" }, { id: "wait" }] },
  ],
  developments: [
    {
      id: "again",
      when: { type: "all", of: [{ type: "fired", id: "sorry:failed" }, { type: "since", hours: 3 }] },
      then: [{ type: "choose", line: "again", focus: "kin", choices: [{ id: "gift" }, { id: "wait" }] }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "kin" } },
    { id: "mended", when: { type: "all", of: [{ type: "fired", id: "sorry" }, { type: "not", of: { type: "fired", id: "sorry:failed" } }, { type: "since", hours: 2 }] } },
    { id: "softened", when: { type: "all", of: [{ type: "fired", id: "gift" }, { type: "since", hours: 7 }] } },
    { id: "shelved", when: { type: "all", of: [{ type: "fired", id: "wait" }, { type: "since", hours: 10 }] } },
    { id: "cold", when: { type: "due" } },
  ],
  wording: [
    {
      title: "Words at Home",
      lines: {
        aim: "Make it up with {kin}, or let it blow over.",
        intro: "You and your {partnerKin} {kin} quarrelled last night, about {about}. You both said more than you meant, and this morning {he} went out without a word.",
        threat: "It will blow over, or you won't be speaking for weeks. Most of that depends on who speaks first.",
        "kin-partner": "I've got nothing to say to you until you've thought about it.",
        "cast-kin": "Your {partnerKin}. Not speaking to you since last night.",
        morning: "{kin} has gone round to a friend's. The house is very quiet.",
        "sorry:label": "Go after {him} and say sorry",
        "sorry:then": "You find {kin} and say you're sorry, and mean it. {He} listens without looking at you, then nods.",
        "sorry:failed": "You go to say sorry, but it comes out as half an excuse, and you're at it again in front of the neighbours.",
        "gift:label": "Leave {him} something {he} likes",
        "gift:then": "You put by the best of the food, the thing {kin} likes most, and leave it where {he} will find it.",
        "wait:label": "Wait for {him} to come round",
        "wait:then": "You get on with the day. If {kin} wants to talk, {he} knows where you are.",
        again: "{kin} comes back in the afternoon and walks straight past you.",
        mended: "Before long you are both laughing about something else. It's over.",
        softened: "{kin} found it. {He} doesn't say anything, but at supper {he} sits next to you again.",
        shelved: "In the end {kin} speaks first, about nothing much, and neither of you mentions the quarrel. It isn't settled, though.",
        gone: "{kin} is gone, and the last thing you said to each other was in anger.",
        cold: "Night comes and neither of you has given way. You eat in silence.",
      },
    },
  ],
};
