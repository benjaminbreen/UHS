import { sexOf } from "../../core/brief";
import type { Actor } from "../../core/types";
import { CHINA, dueOf, JAPAN, neighbours, pickOf, pronounWords, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const single = (c: PlotContext, a: Actor) => !c.actors.some((b) => !b.dead && a.relations?.some((r) => r.kind === "partner" && r.other === b.id));

const castOf = (c: PlotContext) => {
  if (!single(c, c.player) || (c.player.age ?? 30) < 18 || (c.player.age ?? 30) > 35) return;
  const mine = sexOf(c.player);
  const elder = neighbours(c).find((a) => (a.age ?? 30) >= 45 && sexOf(a) === "female");
  const pool = neighbours(c).filter((a) => (a.age ?? 30) <= 40 && single(c, a) && a.householdId !== elder?.householdId
    && (!mine || !sexOf(a) || sexOf(a) !== mine));
  const beloved = pool.length ? pickOf(c, pool, "matchmaker-beloved") : undefined;
  return elder && beloved ? { elder, beloved } : undefined;
};

/** An older woman of the neighbourhood has decided you should marry, and
 * has already picked whom. */
export const matchmaker: PlotTemplate = {
  id: "matchmaker",
  shape: "light",
  look: {
    emblem: "gobetween",
    palette: { ink: "#180e12", fill: "#3a2430", edge: "#8a5a50", light: "#f4e4ea", accent: "#e88aa0" },
  },
  weight: (c) => (castOf(c) ? 0.6 * temper(c, "extraversion") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const elder = cast.elder!, beloved = cast.beloved!;
    const { deadline, due } = dueOf(c.clock);
    return {
      deadline,
      words: {
        elder: elder.name,
        beloved: beloved.name,
        belovedRole: beloved.role.toLowerCase(),
        due,
        virtue: pickOf(c, ["has a lovely laugh", "comes from a good family", "is very good with money", "never misses a day's work"], "matchmaker-virtue"),
        ...pronounWords(beloved),
      },
      refs: { elder: elder.id, beloved: beloved.id },
    };
  },
  opening: [{ type: "choose", line: "pitch", focus: "elder", from: "elder", choices: [{ id: "met" }, { id: "declined" }, { id: "other" }] }],
  developments: [
    {
      id: "after",
      when: { type: "all", of: [{ type: "fired", id: "met" }, { type: "since", hours: 2 }] },
      then: [{ type: "regard", role: "beloved", delta: 2 }, { type: "choose", line: "after", focus: "elder", from: "elder", choices: [{ id: "match" }, { id: "slow" }] }],
    },
    { id: "cross", when: { type: "fired", id: "declined" }, then: [{ type: "regard", role: "elder", delta: -1 }] },
  ],
  endings: [
    { id: "match", when: { type: "fired", id: "match" } },
    { id: "met", when: { type: "fired", id: "slow" } },
    { id: "declined", when: { type: "fired", id: "declined" } },
    { id: "other", when: { type: "fired", id: "other" } },
    { id: "gone", when: { type: "gone", role: "beloved" } },
    { id: "arranged", when: { type: "due" } },
  ],
  wording: [
    {
      // A professional go-between, the meipo, carried the proposal and the horoscopes between families.
      scope: { years: [1368, 1950], bounds: CHINA },
      title: "The Go-Between",
      lines: {
        intro: "{elder}, who has arranged half the marriages on the street, has had your birth date and {beloved}'s read together, and says the signs are excellent.",
        threat: "Nothing is promised yet. But {elder} has already told your relatives.",
        "cast-elder": "A go-between, who has decided you should marry {beloved}.",
        "cast-beloved": "The {belovedRole}, who has been told about you too, and {is} curious.",
        pitch: "{elder} catches you on your way out: \"I had your dates read with {beloved}'s. The signs could not be better. And {he} {virtue}. Go and say good morning, at least.\"",
        "met:then": "You go and say good morning to {beloved}. It's awkward for a minute, and then it isn't.",
        declined: "You tell {elder} you're not ready. {elder} sighs, and says {he} {virtue}, and that you'll be sorry.",
        gone: "With {beloved} gone, {elder} starts looking for someone else.",
        arranged: "You do nothing, so {elder} does it for you. {beloved}'s family will be calling on yours in three days.",
        match: "{elder} is at {beloved}'s family's door before supper. The betrothal gifts are being talked about by morning.",
      },
    },
    {
      // Omiai, the arranged first meeting, set up by a go-between called the nakodo.
      scope: { years: [1900, 2000], bounds: JAPAN },
      title: "An Introduction",
      lines: {
        intro: "{elder} from down the street has been a go-between for a dozen couples. This morning {elder} came round with a photograph of {beloved} and a list of good qualities.",
        threat: "Nothing is promised yet. But {elder} has already spoken to your family.",
        "cast-elder": "A go-between, who has decided you should meet {beloved}.",
        "cast-beloved": "The {belovedRole}, who has seen your photograph too.",
        pitch: "{elder} catches you on your way out: \"Just look at the photograph. {He} {virtue}. A short meeting, over tea. What harm could it do?\"",
        "met:then": "You go and meet {beloved}. It's stiff at first, then {he} makes you laugh.",
        declined: "You tell {elder} you're not ready. {elder} puts the photograph away slowly and says you'll be sorry.",
        gone: "With {beloved} gone, {elder} starts looking through another stack of photographs.",
        arranged: "You do nothing, so {elder} does it for you. There's a meeting set for Sunday at a tea room.",
      },
    },
    {
      scope: { years: [2005, 2100] },
      title: "A Setup",
      lines: {
        intro: "{elder}, who knows everyone, has decided you have been single for far too long, and has spent all morning showing you photos of {beloved}.",
        threat: "Nothing is promised. But {elder} has already given {beloved} your number.",
        "cast-elder": "Knows everyone, and has decided you should meet {beloved}.",
        "cast-beloved": "The {belovedRole}, who has been sent your photo too.",
        pitch: "{elder} catches you on your way out: \"Look at this one. {He} {virtue}. Just a coffee. I've already given {him} your number.\"",
        "met:then": "You meet {beloved} for a coffee. It's awkward for a minute, and then it isn't.",
        declined: "You tell {elder} you're not interested. {elder} says fine, and that you'll be sorry.",
        gone: "With {beloved} gone, {elder} starts scrolling for someone else.",
        arranged: "You do nothing, so {elder} does it for you. You're having dinner with {beloved} on Friday, apparently.",
        "met:label": "Meet {beloved} for a coffee",
        match: "{elder} sends a row of hearts to everyone you both know. You and {beloved} are seeing each other again on Saturday.",
      },
    },
    {
      title: "The Matchmaker",
      lines: {
        aim: "Decide what to say to {elder} about {beloved}, {due}.",
        intro: "{elder}, who has made half the matches around here, has decided you should marry, and has picked {beloved}.",
        threat: "Nothing is promised yet. But {elder} has already told your relatives.",
        "cast-elder": "A matchmaker, who has decided you should marry {beloved}.",
        "cast-beloved": "The {belovedRole}, who has been told about you too.",
        pitch: "{elder} catches you on your way out: \"I've found the one for you: {beloved}. {He} {virtue}. Go and talk to {him}, at least.\"",
        "met:then": "You go and talk to {beloved}. It's awkward for a minute, and then it isn't.",
        declined: "You tell {elder} you're not ready. {elder} sighs, and says you'll be sorry.",
        gone: "With {beloved} gone, {elder} starts looking for someone else.",
        arranged: "You do nothing, so {elder} does it for you. {beloved}'s family will be calling on yours soon.",
        "met:label": "Go and meet {beloved}",
        "declined:label": "Tell {elder} no",
        "other:label": "Say there's someone else",
        after: "{elder} is waiting at your door, wanting to hear everything.",
        "match:label": "Tell {elder} to go ahead",
        "slow:label": "Ask for time",
        match: "{elder} is at {beloved}'s family's door before supper. By morning both households are talking about gifts and dates.",
        met: "{elder} sighs about how slow young people are, but leaves it alone. You and {beloved} keep finding reasons to pass each other's doors.",
        other: "{elder} narrows her eyes. Who? She wants a name by the end of the week, and you'd better think of one.",
      },
    },
  ],
};
