import { ruled } from "../history/order";
import { B, CHINA, elderOf, ITALY, neighbours, partnerWords, pronounWords, trade, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const childOf = (c: PlotContext) => c.actors.find((a) => a.kind === "human" && !a.dead && a.id !== c.player.id &&
  a.householdId === c.player.householdId && (a.age ?? 30) >= 2 && (a.age ?? 30) <= 10);

const HEALS = /healer|herbal|physician|doctor|pharmac|apothecar|midwife|diviner|religious|nurse/i;
const healerOf = (c: PlotContext) => neighbours(c).find((a) => HEALS.test(a.role)) ?? elderOf(c);

const treatment = (c: PlotContext) =>
  (c.setting?.year ?? 0) >= 1900 && ruled(c.setting)
    ? "takes {his} temperature, leaves a powder for the fever and says to keep {him} drinking"
    : within(c, { years: [B(300), 500], bounds: ITALY })
      ? "rubs {his} chest with warm oil, ties an amulet round {his} neck and says to give {him} barley water"
      : within(c, { years: [B(200), 1950], bounds: CHINA })
        ? "feels the pulse at both wrists, writes out a list of herbs, and shows you how long to boil them"
        : "brews something bitter from roots, makes {him} drink it, and says to keep {him} cool";

/** A child of the house is burning with fever: fetch the healer, pray, or
 * nurse the child yourself, and if it does not break, decide again. */
export const fever: PlotTemplate = {
  id: "fever",
  shape: "household",
  look: {
    emblem: "sickbed",
    palette: { ink: "#10141a", fill: "#1c2632", edge: "#4a6280", light: "#e6eef6", accent: "#e0a058" },
  },
  // A healer would treat the child themselves; there is no decision in it.
  weight: (c) => (childOf(c) && healerOf(c) && !trade(c, HEALS) ? 0.7 : 0),
  cast: (c) => {
    const child = childOf(c), helper = healerOf(c);
    return child && helper && { child, helper };
  },
  begin: (c, cast) => {
    const child = cast.child!, helper = cast.helper!;
    const p = partnerWords(c);
    const kid = pronounWords(child);
    return {
      deadline: c.clock + 12 * 3600,
      words: {
        child: child.name,
        helper: helper.name,
        treatment: treatment(c).replace(/\{(\w+)\}/g, (_, w: keyof typeof kid) => kid[w]),
        he: kid.he, He: kid.He, his: kid.his, him: kid.him,
        ...p.words,
      },
      refs: { child: child.id, helper: helper.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "night", choices: [{ id: "healer" }, { id: "pray" }, { id: "nurse", check: { stat: "conscientiousness", odds: 0.5 } }] }],
  developments: [
    {
      id: "worse",
      when: { type: "all", of: [
        { type: "since", hours: 3 },
        { type: "not", of: { type: "fired", id: "healer" } },
        { type: "not", of: { type: "all", of: [{ type: "fired", id: "nurse" }, { type: "not", of: { type: "fired", id: "nurse:failed" } }] } },
      ] },
      then: [{ type: "choose", line: "worse", choices: [{ id: "healer" }, { id: "watch", check: { stat: "endurance", odds: 0.55 } }] }],
    },
  ],
  endings: [
    { id: "eased", when: { type: "all", of: [{ type: "fired", id: "healer" }, { type: "since", hours: 7 }] } },
    { id: "cooled", when: { type: "all", of: [{ type: "fired", id: "nurse" }, { type: "not", of: { type: "fired", id: "nurse:failed" } }, { type: "since", hours: 5 }] } },
    { id: "weak", when: { type: "all", of: [{ type: "fired", id: "watch:failed" }, { type: "since", hours: 10 }] } },
    { id: "waited", when: { type: "all", of: [{ type: "fired", id: "watch" }, { type: "since", hours: 10 }] } },
    { id: "alone", when: { type: "due" } },
  ],
  wording: [
    {
      title: "A Fever in the Night",
      lines: {
        aim: "Get {child} through the fever.",
        intro: "{child} woke in the night burning hot and crying, and hasn't eaten since. {He} is lying on the bedding now, too tired even to complain.",
        threat: "Most fevers break in a day or two. Some don't, and every family knows a child that didn't get better.",
        partner: "Your {partnerKin} {partner} was up with {child} all night and says {helper} should see {him}.",
        "kin-partner": "{child} is no better. What are we going to do?",
        "cast-child": "Has a fever.",
        "cast-helper": "Knows what to do for a sick child.",
        night: "{child} is hot to the touch and won't drink. {helper} knows what to do for fevers, if you go and ask.",
        "healer:label": "Fetch {helper}",
        "healer:then": "{helper} comes over, {treatment}.",
        "pray:label": "Go and pray for {him}",
        "pray:then": "You go and pray for {child}, and leave the best thing you can spare as an offering.",
        "nurse:label": "Nurse {him} yourself",
        "nurse:then": "You sit with {child} all morning, wiping {him} down with cool water and getting {him} to sip. By noon {he} is sweating, and cooler.",
        "nurse:failed": "You sit with {child} all morning with cool cloths, but {he} only gets hotter.",
        worse: "Hours later {child} is hotter, and talking nonsense. It will be a second night.",
        "watch:label": "Sit up with {him} all night",
        "watch:then": "You sit up all night with the lamp turned low, changing the cloths, and toward dawn {his} forehead is damp and cool.",
        "watch:failed": "You sit up all night changing the cloths, and the fever doesn't break.",
        eased: "The fever breaks in the night. In the morning {child} is pale, but hungry, and that is a good sign.",
        cooled: "By evening {child} is asking for food. {He} wants you to feed {him}, and nobody else will do.",
        waited: "In the morning {child} is weak but clear-eyed, and remembers that you sat with {him}.",
        weak: "The fever lasts three more days. {child} comes through it, but thin and weak, and it is a month before {he} is out playing again.",
        alone: "The fever broke by itself toward morning. {child} is weak but on the mend, and asks where you were.",
      },
    },
  ],
};
