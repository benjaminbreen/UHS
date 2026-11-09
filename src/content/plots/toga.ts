import { sexOf } from "../../core/brief";
import { seasonAt } from "../../core/livelihood";
import { B, ITALY, notable, partnerWords, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const sonOf = (c: PlotContext) => c.actors.find((a) => a.kind === "human" && !a.dead && a.householdId === c.player.householdId &&
  a.id !== c.player.id && sexOf(a) === "male" && (a.age ?? 0) >= 14 && (a.age ?? 0) <= 16);

/** At the Liberalia on 17 March a Roman boy put away the bulla of childhood
 * and the bordered toga for the plain toga of a man, and was walked down to
 * the Forum by his family and friends. */
export const toga: PlotTemplate = {
  id: "toga",
  shape: "occasion",
  look: {
    emblem: "lararium",
    palette: { ink: "#141210", fill: "#2a2420", edge: "#7a5a40", light: "#f4f0e8", accent: "#e0b050" },
  },
  weight: (c) => (c.setting && within(c, { years: [B(200), 250], bounds: ITALY }) &&
    seasonAt(c.setting.season, c.clock) === "spring" && sonOf(c) && notable(c) ? 1 : 0),
  cast: (c) => {
    const child = sonOf(c), patron = notable(c);
    return child && patron && { child, patron };
  },
  begin: (c, cast) => {
    const child = cast.child!, patron = cast.patron!;
    const p = partnerWords(c);
    const day = Math.floor(c.clock / 86400) * 86400;
    return {
      deadline: Math.max(day + 10 * 3600, c.clock + 2 * 3600),
      words: { child: child.name, patron: patron.name, due: "by mid-morning", ...p.words },
      refs: { child: child.id, patron: patron.id, ...p.refs },
    };
  },
  opening: [
    { type: "gather", at: "child", when: "deadline", label: "gather", scene: "feast" },
    { type: "choose", line: "escort", focus: "child", from: "child", choices: [{ id: "ask", check: { stat: "extraversion", odds: 0.45 } }, { id: "family" }] },
  ],
  developments: [],
  endings: [
    { id: "honoured", when: { type: "all", of: [{ type: "came" }, { type: "fired", id: "ask" }, { type: "not", of: { type: "fired", id: "ask:failed" } }] } },
    { id: "man", when: { type: "came" } },
    { id: "missed", when: { type: "gathered" } },
  ],
  wording: [
    {
      title: "The Toga of a Man",
      lines: {
        aim: "Be at home {meet}, when {child} puts on the toga of a man.",
        intro: "It is the Liberalia, and {child} is old enough. This morning he hangs the gold charm (bulla) he has worn since he was a baby up before the household gods, takes off the purple-bordered toga of a boy, and puts on the plain white toga of a citizen.",
        threat: "The family's friends and neighbours will walk him down to the Forum to be enrolled as a citizen. If you aren't there, it will be noticed.",
        partner: "Your {partnerKin} {partner} has been up since dawn getting the new toga folded right.",
        "kin-partner": "Everyone is coming to the house. Don't you dare be late.",
        "cast-child": "Becomes a man today.",
        "cast-patron": "The most important man you know.",
        gather: "Seeing {child} into the toga",
        escort: "Who's going to walk me down to the Forum? Everyone says it should be someone important.",
        "ask:label": "Ask {patron} to lead the walk",
        "ask:then": "You go round to see {patron} first thing. He is pleased to be asked, and says he'll come.",
        "ask:failed": "You go round to see {patron} first thing. He is sorry, but he has business in the Forum this morning.",
        "family:label": "Walk him down with family",
        "family:then": "You tell {child} his own family will walk with him, and that is how it should be.",
        honoured: "{patron} walks at the head of the crowd down to the Forum, and people make way. {child}'s name goes on the list of citizens, then everyone climbs to the Capitol to make an offering. People will remember who walked with him.",
        man: "Friends and neighbours walk {child} down to the Forum, where his name goes on the list of citizens, then up to the Capitol to make an offering. Back home there is a meal, and everyone calls him by his full name.",
        missed: "{child} was walked to the Forum without you. He didn't say anything about it, but he looked for you in the crowd.",
      },
    },
  ],
};
