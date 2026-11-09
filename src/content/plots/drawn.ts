import { sexOf } from "../../core/brief";
import { B, CHINA, fillIn, KOREA, neighbours, pickOf, pronounWords, temper } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const single = (a: { relations?: { kind: string }[] }) => !a.relations?.some((r) => r.kind === "partner");

const belovedOf = (c: PlotContext) => {
  const age = c.player.age ?? 30;
  if (age < 16 || age > 32 || !single(c.player)) return;
  const pool = neighbours(c).filter((a) => single(a) && Math.abs((a.age ?? 30) - age) <= 7 && sexOf(a) !== sexOf(c.player));
  return pool.length ? pickOf(c, pool, "beloved") : undefined;
};

const after = (id: string) => ({ type: "all" as const, of: [{ type: "fired" as const, id }, { type: "since" as const, hours: 3 }] });

/** There is someone you keep noticing: speak plainly, send word through
 * someone older, or leave a small gift. */
export const drawn: PlotTemplate = {
  id: "drawn",
  shape: "desire",
  look: {
    emblem: "tryst",
    palette: { ink: "#180e12", fill: "#2c1820", edge: "#80405a", light: "#f6e4ea", accent: "#f0a070" },
  },
  weight: (c) => (belovedOf(c) ? 0.6 * temper(c, "extraversion") * temper(c, "openness") : 0),
  cast: (c) => {
    const beloved = belovedOf(c);
    return beloved && { beloved };
  },
  begin: (c, cast) => {
    const beloved = cast.beloved!;
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 20 * 3600,
      words: {
        beloved: beloved.name,
        belovedRole: beloved.role.toLowerCase(),
        notice: fillIn(pickOf(c, ["the way {he} laughs at {his} own jokes", "how {he} looked at you, once, for a moment too long", "how {he} hums when {he} works"], "drawn-notice"), pronounWords(beloved)),
        ...pronounWords(beloved),
      },
      refs: { beloved: beloved.id },
    };
  },
  opening: [],
  developments: [
    {
      id: "chance",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "chance", focus: "beloved", choices: [{ id: "speak", check: { stat: "extraversion", odds: 0.5 } }, { id: "word", check: { stat: "wit", odds: 0.5 } }, { id: "gift" }] }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "beloved" } },
    { id: "tongue", when: after("speak:failed") },
    { id: "spoke", when: after("speak") },
    { id: "refused", when: after("word:failed") },
    { id: "welcome", when: after("word") },
    { id: "noticed", when: after("gift") },
    { id: "missed", when: { type: "due" } },
  ],
  wording: [
    {
      // Neo-Confucian rules kept unmarried men and women apart; a word in passing was already bold.
      scope: { years: [1392, 1895], bounds: KOREA },
      title: "Someone You Keep Noticing",
      lines: {
        intro: "You keep noticing {beloved} the {belovedRole}: {notice}. Families arrange marriages here and young people are meant to keep apart, so even a few words in passing would be bold.",
        "word:label": "Ask a go-between to sound out {his} family",
      },
    },
    {
      scope: { years: [B(200), 1912], bounds: CHINA },
      title: "Someone You Keep Noticing",
      lines: {
        intro: "You keep noticing {beloved} the {belovedRole}: {notice}. Marriages here are made by parents and go-betweens, not by the two people in them, but nobody can stop you saying a few words.",
        "word:label": "Ask a go-between to sound out {his} family",
      },
    },
    {
      title: "Someone You Keep Noticing",
      lines: {
        aim: "Let {beloved} know, one way or another.",
        intro: "You keep noticing {beloved} the {belovedRole}: {notice}. You have been meaning to say something for weeks.",
        threat: "If you do nothing, nothing will happen.",
        "cast-beloved": "The one you keep noticing.",
        chance: "{beloved} is on {his} own for once. If you're going to do something, this is the time.",
        "speak:label": "Go over and talk",
        "speak:then": "You walk over and talk about nothing much, and both of you stay longer than you need to.",
        "speak:failed": "You walk over, and your mind goes empty. You say something about the weather and leave.",
        "word:label": "Ask an older friend to put in a word",
        "word:then": "Someone older, who knows {beloved}'s family, agrees to go round and find out what they think.",
        "word:failed": "Someone older, who knows {beloved}'s family, agrees to go round, and comes back looking sorry.",
        "gift:label": "Leave a small gift",
        "gift:then": "You leave a little bunch of flowers where {beloved} will find it, and say nothing.",
        spoke: "{beloved} smiles at you as {he} goes, and looks back once.",
        tongue: "{beloved} gave you an odd look. You go over what you said all day, and wince every time.",
        welcome: "Word comes back that {beloved}'s family hasn't said no. It's a good sign.",
        refused: "Word comes back: {beloved}'s family has other plans for {him}. Nobody will mention it again.",
        noticed: "{beloved} finds the flowers and looks round. You look away too slowly, and {he} smiles.",
        gone: "{beloved} is gone, and you never said anything.",
        missed: "The day went by and you didn't do anything. You tell yourself you'll do it tomorrow.",
      },
    },
  ],
};
