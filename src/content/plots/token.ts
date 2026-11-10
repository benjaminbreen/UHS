import { dueOf, fillIn, JAPAN, neighbours, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { Actor } from "../../core/types";
import type { Condition, PlotContext, PlotTemplate } from "./types";

const single = (c: PlotContext, a: Actor) => !c.actors.some((b) => !b.dead && a.relations?.some((r) => r.kind === "partner" && r.other === b.id));

const castOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 60 && !c.player.relations?.some((r) => r.kind === "partner" && r.other === a.id));
  const suspect = pool.length ? pickOf(c, pool, "token-suspect") : undefined;
  const others = pool.filter((a) => a.householdId !== suspect?.householdId);
  const neighbour = others.length ? pickOf(c, others, "token-neighbour") : undefined;
  if (!suspect || !neighbour) return;
  const witnesses = neighbours(c).filter((a) => a.id !== suspect.id && a.id !== neighbour.id);
  const witness = witnesses.length ? pickOf(c, witnesses, "token-witness") : undefined;
  return witness ? { suspect, neighbour, witness } : { suspect, neighbour };
};

const fired = (id: string): Condition => ({ type: "fired", id });
const not = (of: Condition): Condition => ({ type: "not", of });
const all = (...of: Condition[]): Condition => ({ type: "all", of });
const doorstep = { type: "at", scene: "doorstep" } as const;
const timeLeft = not({ type: "due" });
const investigating = all(fired("found-token"), timeLeft, not(fired("stakeout")), not(fired("spoke-to-giver")));
const response = [{ id: "thanks" }, { id: "decline" }];

/** Something has been left at your door in the night, and you don't know
 * whether it is a kindness or a curse. */
export const token: PlotTemplate = {
  id: "token",
  shape: "mystery",
  look: {
    emblem: "token",
    palette: { ink: "#16121c", fill: "#3a2c40", edge: "#7a5a5a", light: "#f4ece4", accent: "#e8b070" },
  },
  weight: (c) => (c.household && castOf(c) ? 0.5 * temper(c, "openness") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const suspect = cast.suspect!, neighbour = cast.neighbour!, witness = cast.witness;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const who = { suspect: suspect.name, ...pronounWords(suspect) };
    const courting = single(c, c.player) && single(c, suspect) && (c.player.age ?? 30) < 40 && (suspect.age ?? 30) < 40;
    return {
      deadline,
      words: {
        ...who,
        neighbour: neighbour.name,
        ...(witness ? { witness: witness.name } : {}),
        due,
        reason: fillIn(courting ? "{he} wanted an excuse to meet you" : "{he} meant it as a small kindness", who),
        ...p.words,
      },
      refs: { suspect: suspect.id, neighbour: neighbour.id, ...(witness ? { witness: witness.id } : {}), ...p.refs },
    };
  },
  journal: {
    opens: "found-token",
    missed: "unsolved",
    notes: [
      { after: "found-token", label: "What you found", line: "intro" },
      { after: "noticed-ochre", label: "What you noticed", line: "ochre", roles: ["suspect"] },
      { after: "heard-witness", label: "What you heard", line: "report", roles: ["witness", "neighbour"] },
      { after: "asked-neighbour", label: "What they said", line: "wrong" },
      { after: "stakeout", label: "What you’re doing", line: "watching" },
      { after: "spoke-to-giver", label: "Who left it", line: "blush", roles: ["suspect"] },
      { after: "offered:dawn", label: "Who left it", line: "dawn", roles: ["suspect"] },
    ],
  },
  opening: [],
  developments: [
    {
      id: "found-token",
      when: all(doorstep, timeLeft, not({ type: "gone", role: "suspect" })),
      then: [{ type: "choose", line: "intro", at: "doorstep", choices: [{ id: "look" }, { id: "stakeout", check: { stat: "wit", odds: 0.5 } }] }],
    },
    {
      id: "spoke-to-giver",
      when: all(investigating, { type: "speaking", role: "suspect" }),
      then: [{ type: "choose", line: "blush", at: "suspect", from: "suspect", choices: response }],
    },
    {
      id: "noticed-ochre",
      when: all(investigating, { type: "at", scene: "suspect" }),
      then: [{ type: "note", line: "ochre" }],
    },
    {
      id: "heard-witness",
      when: all(investigating, { type: "speaking", role: "witness" }),
      then: [{ type: "card", line: "report", at: "witness", from: "witness" }],
    },
    {
      id: "asked-neighbour",
      when: all(investigating, fired("heard-witness"), { type: "speaking", role: "neighbour" }),
      then: [{ type: "card", line: "wrong", at: "neighbour", from: "neighbour" }],
    },
    {
      id: "left-watch",
      when: all(fired("stakeout"), not(fired("offered:dawn")), not(doorstep)),
      then: [],
    },
    {
      id: "watch-ready",
      when: all({ type: "after", id: "stakeout", hours: 0.5 }, doorstep),
      then: [],
    },
    {
      id: "watch-visit",
      when: all(fired("watch-ready"), not(fired("stakeout:failed")), doorstep, timeLeft),
      then: [{ type: "choose", line: "dawn", at: "doorstep", from: "suspect", choices: response }],
    },
    { id: "glad", when: fired("thanks"), then: [{ type: "regard", role: "suspect", delta: 3 }] },
    { id: "hurt", when: fired("decline"), then: [{ type: "regard", role: "suspect", delta: -2 }] },
  ],
  endings: [
    { id: "found", when: fired("thanks") },
    { id: "cool", when: fired("decline") },
    { id: "left-watch", when: fired("left-watch"), quiet: true },
    { id: "watch-empty", when: all(fired("watch-ready"), fired("stakeout:failed")), quiet: true },
    { id: "gone", when: { type: "gone", role: "suspect" }, quiet: true },
    { id: "unsolved", when: { type: "due" }, quiet: true },
  ],
  wording: [
    {
      // Heian courtship ran on poems: a verse tied to a flowering branch, left for someone to find.
      scope: { years: [794, 1185], bounds: JAPAN },
      title: "A Poem at the Door",
      lines: {
        aim: "Find out who left a poem at your door, {due}.",
        intro: "A sprig of plum blossom is tied to your gate with a slip of paper knotted round it. On it is a short poem in a careful hand. It isn't signed.",
        threat: "It may be kindly meant. It may be a joke at your expense. Either way, people will have seen it.",
        partner: "Your {partnerKin} {partner} wants very much to know who it is from.",
        "kin-partner": "Who is writing you poems? I'd like to know too.",
        "cast-suspect": "Has a careful hand with a brush.",
        ochre: "You notice ink on the fingers of {suspectWho}. The poem was written with a brush.",
        report: "{witnessWho}, tells you they saw {neighbourWho}, by your gate at first light.",
        "stakeout:label": "Tie a reply poem to the gate and watch",
        watching: "You’ve tied a reply to the gate and are keeping watch.",
        "watch-empty": "Nobody came for the reply while you were watching.",
        dawn: "{suspectWho}, comes to the gate for your reply and admits to leaving the poem. It turns out {reason}.",
        blush: "{suspectWho}, admits to writing the poem. It turns out {reason}.",
        wrong: "{neighbourWho}, says they passed the gate this morning and saw no one there.",
        gone: "There is no one left to ask about the poem.",
        unsolved: "The blossom wilts, and you let the matter rest.",
      },
    },
    {
      scope: { years: [-50000, -3000] },
      title: "Something at the Door",
      lines: {
        aim: "Find out who left the carving at your shelter, {due}.",
        intro: "There’s a small figure carved from bone at the mouth of your shelter. It’s set on a flat stone, with red ochre rubbed into its lines.",
        threat: "A carving like that can be a gift, or it can be a way of wishing someone harm.",
        partner: "Your {partnerKin} {partner} won't touch it until you find out who made it.",
        "kin-partner": "Don't bring it inside until we know whose hands made it.",
        "cast-suspect": "Has been carving bone by the fire in the evenings.",
        ochre: "{suspectWho}, has fresh red ochre under {his} fingernails.",
        report: "{witnessWho}, tells you they saw {neighbourWho}, near your shelter at first light.",
        dawn: "{suspectWho}, comes to the mouth of your shelter and finds your gift waiting. {He} admits to leaving the carving. It turns out {reason}.",
        blush: "{suspectWho}, admits to leaving the carving. It turns out {reason}.",
        wrong: "{neighbourWho}, says they passed your shelter this morning and saw no one there.",
        gone: "There is no one left to ask about the carving.",
        unsolved: "The carving is still at your shelter. You let the matter rest.",
      },
    },
    {
      title: "Something at the Door",
      lines: {
        aim: "Find out who left something at your door, {due}.",
        intro: "There’s a small carved token on your doorstep, wrapped in a clean cloth. There’s no note.",
        threat: "It may be a kindness. It may be someone wishing you harm. You'd like to know which.",
        partner: "Your {partnerKin} {partner} wants to know who it's from.",
        "kin-partner": "Who's leaving you things? Go and find out.",
        "cast-suspect": "Has been working on something small in the evenings.",
        ochre: "{suspectWho}, has fine wood shavings caught in {his} clothes.",
        report: "{witnessWho}, tells you they saw {neighbourWho}, by your door at first light.",
        "look:label": "Ask around",
        "stakeout:label": "Leave something out in return and keep watch",
        watching: "You’ve left something out in return and are keeping watch.",
        "watch-empty": "Nobody came to the door while you were watching.",
        "left-watch": "You left before anyone came to see what you’d put out.",
        wrong: "{neighbourWho}, says they passed your door this morning and saw no one there.",
        blush: "{suspectWho}, admits to leaving the token. It turns out {reason}.",
        dawn: "{suspectWho}, comes to the door and finds your gift waiting. {He} admits to leaving the token. It turns out {reason}.",
        "thanks:label": "Thank {him}",
        "decline:label": "Give it back",
        found: "You thank {suspectWho}, for the gift.",
        cool: "You return the gift to {suspectWho}.",
        gone: "There is no one left to ask about the token.",
        unsolved: "The token is still at your door. You let the matter rest.",
      },
    },
  ],
};
