import { B, dueOf, ITALY, neighbours, partnerWords, pickOf, pronounWords, working } from "./common";
import type { Effect, PlotContext, PlotTemplate } from "./types";

// Every farmer in a village shares the work; a rival is a trade with customers to lose.
const rivalOf = (c: PlotContext) => {
  if (working(c) || c.player.origin?.livelihood === "traveler") return;
  const same = neighbours(c).filter((a) => a.role === c.player.role);
  return same.length ? pickOf(c, same, "rival") : undefined;
};

const face: Effect = {
  type: "choose", line: "face", focus: "rival",
  choices: [{ id: "public" }, { id: "truce" }, { id: "outwork" }],
};

/** Another household in the same work, and talk going round about yours. */
export const rival: PlotTemplate = {
  id: "rival",
  shape: "claim",
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
      id: "face",
      when: { type: "all", of: [{ type: "talked", role: "rival" }, { type: "not", of: { type: "fired", id: "face-late" } }] },
      then: [face],
    },
    {
      id: "face-late",
      when: { type: "all", of: [{ type: "since", hours: 1.5 }, { type: "not", of: { type: "fired", id: "face" } }] },
      then: [face],
    },
    {
      id: "spread",
      when: { type: "all", of: [{ type: "since", hours: 3 }, { type: "not", of: { type: "talked", role: "rival" } }, { type: "not", of: { type: "fired", id: "public" } }] },
      then: [{ type: "card", line: "spread", focus: "rival" }, { type: "regard", role: "rival", delta: -1 }],
    },
    { id: "meet", when: { type: "fired", id: "public" }, then: [{ type: "gather", at: "green", when: 2, label: "crowd", aim: "aim-meet", scene: "match" }] },
    {
      id: "standoff",
      when: { type: "all", of: [{ type: "fired", id: "meet" }, { type: "came" }] },
      then: [{ type: "choose", line: "standoff", focus: "rival", from: "rival", choices: [{ id: "call", check: { stat: "extraversion", skill: "speech", odds: 0.5 } }, { id: "leave" }] }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "rival" } },
    { id: "faced", when: { type: "all", of: [{ type: "fired", id: "call" }, { type: "not", of: { type: "fired", id: "call:failed" } }] } },
    { id: "rebuffed", when: { type: "fired", id: "call:failed" } },
    { id: "walked", when: { type: "fired", id: "leave" } },
    { id: "missed", when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }] } },
    { id: "truce", when: { type: "fired", id: "truce" } },
    { id: "proved", when: { type: "all", of: [{ type: "fired", id: "outwork" }, { type: "fired", id: "worked" }] } },
    { id: "outdone", when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "fired", id: "meet" } }] } },
  ],
  wording: [
    {
      // Athenian potters signed and taunted each other on their pots: Euthymides' "as never Euphronios".
      scope: { years: [B(700), B(300)], bounds: [19.5, 34.8, 28.5, 41.5] },
      title: "A Rival in Trade",
      lines: {
        aim: "Have it out with {rival} before the story sticks, {due}.",
        intro: "{rival}, the other {role} in town, has been telling customers {slur}. Two of your regular buyers have already gone to {him}.",
        threat: "If nobody answers it, by the next market day everyone will believe it.",
        partner: "Your {partnerKin} {partner} heard it at the fountain and came home furious.",
        "kin-partner": "Do you know what {rival} is saying about you? Go and say something!",
        "cast-rival": "The other {role}, and is telling people {slur}.",
        spread: "The story has reached the agora. A regular customer walks past your door to {rival}'s.",
        faced: "You take {rival} on in the agora, in front of the buyers, and give as good as you get. By evening people are repeating your answer, not {his} story.",
        gone: "With {rival} gone, the talk stops and the customers are yours.",
        outdone: "Nobody answered {rival}, so people believe the story. It will take a long time to win those customers back.",
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
        faced: "You take {rival} on in front of the whole street, and the street laughs at {him}, not you. The writing by your door gets scrubbed off.",
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
        faced: "You confront {rival} in front of other people, and {he} has no answer. By evening the story has turned against {him}.",
        face: "{rival} is still telling people {slur}. How do you answer it?",
        "public:label": "Call {him} out in front of everyone",
        "public:then": "You tell {rival} to say it to your face, in front of people. {He} says {he} will.",
        crowd: "Watching you and {rival} have it out",
        "aim-meet": "Face {rival} in front of everyone {meet}. It's marked on your map.",
        standoff: "{rival} steps out in front of the crowd. \"Go on, then. Tell them I'm lying.\"",
        "call:label": "Answer {him} in front of everyone",
        "call:failed": "You lose your temper and shout, and {rival} stays calm.",
        "leave:label": "Walk away",
        "truce:label": "Offer to split the trade between you",
        "truce:then": "You go round to {rival}'s and talk it through, one {role} to another.",
        "outwork:label": "Say nothing, and let your work answer",
        "outwork:then": "You'll answer with your work. Get the day's work done, and done well.",
        walked: "You turn and walk off without a word. People take that as an answer, and not a good one for you.",
        missed: "{rival} waited for you in front of a crowd, and you never came. Now people believe {him}.",
        rebuffed: "People watched you shout and {rival} stay calm. Now they say the story must be true, or you wouldn't be so angry.",
        truce: "You agree to split the trade: some customers and some days for each of you. {rival} stops the talk. You'll both earn a little less, but you'll both stay in business.",
        proved: "You put out the best work you've done in months, and people see it. Two of the customers who left come back.",
        gone: "With {rival} gone, the talk stops.",
        outdone: "Nobody answered {rival}, so people have begun to believe {him}.",
      },
    },
  ],
};
