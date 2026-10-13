import { B, dueOf, ITALY, neighbours, partnerWords, pickOf, pronounWords, working } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

// Every farmer in a village shares the work; a rival is a trade with customers to lose.
const rivalOf = (c: PlotContext) => {
  if (working(c) || c.player.origin?.livelihood === "traveler") return;
  const same = neighbours(c).filter((a) => a.role === c.player.role);
  return same.length ? pickOf(c, same, "rival") : undefined;
};

/** Another household in the same work, and talk going round about yours. */
export const rival: PlotTemplate = {
  id: "rival",
  look: {
    emblem: "rival",
    palette: { ink: "#10161a", fill: "#1c2830", edge: "#3e5262", light: "#e2eaee", accent: "#4f8fb0" },
  },
  weight: (c) => (rivalOf(c) ? 0.8 : 0),
  cast: (c) => {
    const rival = rivalOf(c);
    return rival && { rival };
  },
  begin: (c, cast) => {
    const rival = cast.rival!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      words: {
        rival: rival.name,
        role: c.player.role.toLowerCase(),
        due,
        slur: pickOf(c, ["that your work is shoddy", "that you cheat on the measure", "that you sell old goods as new", "that your work has been bad since your hands began to shake"], "rival-slur"),
        ...pronounWords(rival),
        ...p.words,
      },
      refs: { rival: rival.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "spread",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: { type: "talked", role: "rival" } }] },
      then: [{ type: "card", line: "spread", focus: "rival" }, { type: "regard", role: "rival", delta: -1 }],
    },
  ],
  endings: [
    { id: "faced", when: { type: "talked", role: "rival" } },
    { id: "gone", when: { type: "gone", role: "rival" } },
    { id: "outdone", when: { type: "due" } },
  ],
  wording: [
    {
      // Athenian potters signed and taunted each other on their pots: Euthymides' "as never Euphronios".
      scope: { years: [B(700), B(300)], bounds: [19.5, 34.8, 28.5, 41.5] },
      title: "A Rival in Trade",
      lines: {
        aim: "Have it out with {rival} before the story sticks, {due}.",
        intro: "{rival}, the other {role} in town, has been telling customers {slur}. Two of your regular buyers have already gone to {him}.",
        threat: "If nobody answers it, by the next market day it will be what everyone knows about you.",
        partner: "Your {partnerKin} {partner} heard it at the fountain and came home furious.",
        "kin-partner": "Do you know what {rival} is saying about you? Go and say something!",
        "cast-rival": "The other {role}, and is telling people {slur}.",
        spread: "The story has reached the agora. A regular customer walks past your door to {rival}'s.",
        faced: "You confront {rival} in front of other people. Whether or not {he} stops, everyone saw you defend your work.",
        gone: "With {rival} gone, the talk stops and the customers are yours.",
        outdone: "Nobody answered {rival}, so the story stands. It will take a long time to win those customers back.",
      },
    },
    {
      scope: { years: [B(300), 500], bounds: ITALY },
      title: "A Rival in Trade",
      lines: {
        aim: "Face {rival} and put a stop to the talk, {due}.",
        intro: "{rival}, the other {role} on the street, has been telling everyone {slur}.",
        threat: "Talk like that will cost you customers.",
        partner: "Your {partnerKin} {partner} has heard it from a neighbour, and is waiting to see what you will do.",
        "kin-partner": "Everyone has heard what {rival} says. Are you going to let it stand?",
        "cast-rival": "The other {role} on the street, and is telling people {slur}.",
        spread: "Someone has scratched it on the wall by your door. People stop to read it.",
        faced: "You confront {rival} in front of the whole street. At least the story didn't go unanswered.",
        gone: "With {rival} gone, the talk stops.",
        outdone: "Nobody answered the talk, and now people believe it. Some customers won't come back.",
      },
    },
    {
      title: "A Rival in Trade",
      lines: {
        aim: "Have it out with {rival}, {due}, before the talk sticks.",
        intro: "{rival}, the other {role} here, has been telling people {slur}.",
        threat: "If it goes unanswered, people will start to believe it.",
        partner: "Your {partnerKin} {partner} heard it and came straight home to tell you.",
        "kin-partner": "Have you heard what {rival} is saying? Are you going to let it go?",
        "cast-rival": "The other {role} here, and is telling people {slur}.",
        spread: "The talk has gone round. Someone who always came to you has gone to {rival} instead.",
        faced: "You confront {rival} in front of other people. At least now it's out in the open.",
        gone: "With {rival} gone, the talk stops.",
        outdone: "Nobody answered {rival}, so people have begun to believe {him}.",
      },
    },
  ],
};
