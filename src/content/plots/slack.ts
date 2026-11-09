import { dueOf, neighbours, partnerWords, pickOf, pronounWords, temper, trade } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const SELLING = /shopkeeper|market-seller|hawker|vendor|grocer|pedlar|chapman|costermonger|innkeeper|publican|barber|hairdresser|cobbler|tailor|dressmaker|confectioner/;

const friendOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => Math.abs((a.age ?? 30) - (c.player.age ?? 30)) <= 15);
  return pool.length ? pickOf(c, pool, "slack-friend") : undefined;
};

/** Nobody comes. A day with nothing to sell to anyone. */
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
    const p = partnerWords(c);
    const modern = (c.setting?.year ?? 0) >= 1900;
    return {
      deadline,
      words: {
        friend: friend.name,
        why: pickOf(c, modern
          ? ["Payday is still a week away.", "There's a big game on and everyone has gone to watch it.", "It's been raining since dawn and the street is empty."]
          : ["Market day was yesterday, and everyone spent what they had.", "It's been raining since dawn and nobody has come into town.", "Half the town has gone to a wedding in the next village."], "slack-why"),
        ...pronounWords(friend),
        ...p.words,
      },
      refs: { friend: friend.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "nobody",
      when: { type: "since", hours: 1.5 },
      then: [{ type: "choose", line: "nobody", focus: "friend", from: "friend", choices: [{ id: "shut" }, { id: "cry", check: { stat: "extraversion", skill: "trade", odds: 0.45 } }, { id: "tidy" }] }],
    },
  ],
  endings: [
    { id: "company", when: { type: "fired", id: "shut" } },
    { id: "cried", when: { type: "all", of: [{ type: "fired", id: "cry" }, { type: "not", of: { type: "fired", id: "cry:failed" } }] } },
    { id: "hoarse", when: { type: "fired", id: "cry:failed" } },
    { id: "tidied", when: { type: "fired", id: "tidy" } },
    { id: "empty", when: { type: "due" } },
  ],
  wording: [
    {
      title: "A Slow Day",
      lines: {
        aim: "Make something of a day when nobody is buying.",
        intro: "Nobody is buying today. {why}",
        threat: "One slow day won't do much harm.",
        partner: "Your {partnerKin} {partner} says to use the time to tidy up.",
        "kin-partner": "Still nobody? Come and eat, then.",
        "cast-friend": "Has nothing much to do today either.",
        nobody: "Nobody has come by all morning. {friend} leans in the doorway: \"Quiet today? I could hear you yawning from across the street.\"",
        "shut:label": "Shut up and go off with {friend}",
        "cry:label": "Go out and call your wares",
        "tidy:label": "Mend and tidy while it's quiet",
        company: "You go off together and spend the afternoon talking about nothing much. When you get back, a neighbour says someone came by looking for you.",
        cried: "You stand out in the street and shout what you have and what it costs. People turn to look, and a few of them come over. By evening you've sold more than on an ordinary day.",
        hoarse: "You shout yourself hoarse in the empty street. Two people stop, and neither of them buys anything.",
        tidied: "You fix and tidy everything you've been putting off. The place has never looked better, and the first customer tomorrow says so.",
        empty: "Nobody comes all day. Tomorrow will be busier.",
      },
    },
  ],
};
