import { sexOf } from "../../core/brief";
import { random } from "../../core/random";
import { B, CHINA, ITALY, neighbours, partnerWords, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const wed = (a: { relations?: { kind: string }[] }) => !!a.relations?.some((r) => r.kind === "partner");

const motherOf = (c: PlotContext) => {
  const ours = c.actors.filter((a) => a.kind === "human" && !a.dead && a.id !== c.player.id &&
    a.householdId === c.player.householdId && sexOf(a) === "female" && (a.age ?? 30) >= 17 && (a.age ?? 30) <= 40);
  const partner = c.player.relations?.find((r) => r.kind === "partner")?.other;
  return ours.find((a) => a.id === partner) ?? ours.find(wed) ??
    neighbours(c).find((a) => sexOf(a) === "female" && wed(a) && (a.age ?? 30) >= 18 && (a.age ?? 30) <= 36);
};

const midwifeOf = (c: PlotContext) => {
  const women = neighbours(c).filter((a) => sexOf(a) === "female" && (a.age ?? 30) >= 40);
  return women.find((a) => /midwife|healer|herbal|nurse/i.test(a.role)) ?? women[0];
};

/** A married woman nearer to hand than the midwife, who has had children herself. */
const nearOf = (c: PlotContext, not: string[]) =>
  neighbours(c).find((a) => sexOf(a) === "female" && wed(a) && (a.age ?? 30) >= 25 && (a.age ?? 30) <= 55 && !not.includes(a.id) && a.householdId !== c.player.householdId);

/** A woman of the household goes into labour: fetch the midwife from across
 * the place or the neighbour who is closer, and when it goes long, decide
 * what to try. */
export const labour: PlotTemplate = {
  id: "labour",
  shape: "household",
  look: {
    emblem: "cradle",
    palette: { ink: "#141018", fill: "#2a1f30", edge: "#6a4a72", light: "#f0e6f2", accent: "#e8a860" },
  },
  weight: (c) => {
    const kin = motherOf(c), helper = midwifeOf(c);
    return kin && helper && nearOf(c, [kin.id, helper.id]) ? (kin.householdId === c.player.householdId ? 0.8 : 0.4) : 0;
  },
  cast: (c) => {
    const kin = motherOf(c), helper = midwifeOf(c);
    const neighbour = kin && helper && nearOf(c, [kin.id, helper.id]);
    return kin && helper && neighbour && { kin, helper, neighbour };
  },
  begin: (c, cast) => {
    const kin = cast.kin!, helper = cast.helper!, neighbour = cast.neighbour!;
    const yours = c.player.relations?.some((r) => r.kind === "partner" && r.other === kin.id);
    const p = yours || kin.householdId !== c.player.householdId ? {} : partnerWords(c);
    return {
      deadline: c.clock + 9 * 3600,
      words: {
        kin: kin.name,
        helper: helper.name,
        neighbour: neighbour.name,
        baby: random(c.seed, "plot", "labour", "sex") < 0.5 ? "girl" : "boy",
        ...pronounWords(helper),
        ...p.words,
      },
      refs: { kin: kin.id, helper: helper.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "send", choices: [{ id: "midwife" }, { id: "near" }] }],
  developments: [
    {
      id: "long-midwife",
      when: { type: "all", of: [{ type: "fired", id: "midwife" }, { type: "since", hours: 3 }] },
      then: [{ type: "choose", line: "long", focus: "helper", choices: [{ id: "turn", check: { stat: "endurance", odds: 0.75 } }, { id: "knots" }] }],
    },
    {
      id: "long-near",
      when: { type: "all", of: [{ type: "fired", id: "near" }, { type: "since", hours: 3 }] },
      then: [{ type: "choose", line: "long", focus: "neighbour", choices: [{ id: "turn", check: { stat: "endurance", odds: 0.4 } }, { id: "knots" }] }],
    },
  ],
  endings: [
    { id: "hard", when: { type: "all", of: [{ type: "fired", id: "turn:failed" }, { type: "since", hours: 5 }] } },
    { id: "born", when: { type: "all", of: [{ type: "fired", id: "turn" }, { type: "since", hours: 5 }] } },
    { id: "late", when: { type: "all", of: [{ type: "fired", id: "knots" }, { type: "since", hours: 8 }] } },
    { id: "alone", when: { type: "due" } },
  ],
  wording: [
    {
      // The obstetrix brought a birthing chair; Juno Lucina was called on to bring the child into the light.
      scope: { years: [B(300), 500], bounds: ITALY },
      title: "The Baby Is Coming",
      lines: {
        intro: "{kin}'s pains started before dawn and they are getting stronger. The women with her have lit a lamp to Juno Lucina, but nobody has gone for the midwife yet.",
        "midwife:then": "It takes the best part of an hour to bring {helper} back with her birthing chair and her oils. She sends the men out and takes charge.",
      },
    },
    {
      // Qing households called a birth grandmother (jieshengpo); the mother kept to her room for a month after.
      scope: { years: [1000, 1950], bounds: CHINA },
      title: "The Baby Is Coming",
      lines: {
        intro: "{kin}'s pains started before dawn and they are getting stronger. Someone has to fetch help: {helper}, the birth grandmother (jieshengpo) who delivers babies here, or a neighbour.",
        born: "At last the baby cries. It is a {baby}, and {kin} is tired but well. For the next month she will stay in her room and eat chicken soup while others do her work.",
      },
    },
    {
      title: "The Baby Is Coming",
      lines: {
        aim: "Get help to {kin}, quickly.",
        intro: "{kin}'s pains started before dawn and they are getting stronger. {helper} has delivered half the babies around here.",
        threat: "A first labour can go on for a day or more, but if anything goes wrong, someone who knows what to do has to be there.",
        partner: "Your {partnerKin} {partner} is boiling water and says to stop standing there.",
        "kin-partner": "Has someone gone for help? It won't be long now.",
        "cast-kin": "Is in labour.",
        "cast-helper": "Has delivered half the babies around here.",
        "cast-neighbour": "Lives close by, and has had children of her own.",
        send: "{kin}'s pains are coming faster. {helper} knows the most about births, but she lives a long walk away. {neighbour} is close by and has had children of her own.",
        "midwife:label": "Run for {helper}",
        "midwife:then": "It takes the best part of an hour to bring {helper} back. She washes her hands, sends the men out, and takes charge.",
        "near:label": "Fetch {neighbour}",
        "near:then": "{neighbour} is there in minutes with clean cloths, and sets water on the fire.",
        long: "Hours go by and the baby hasn't come. {kin} is worn out, and the baby is lying the wrong way.",
        "turn:label": "Try to turn the baby",
        "turn:then": "You hold {kin} up on her knees while the women work the baby round with their hands, slowly, between the pains.",
        "turn:failed": "You hold {kin} up while the women try, but they can't get the baby round.",
        "knots:label": "Open every door and untie every knot",
        "knots:then": "You go through the house opening every door and box and untying every knot, so nothing in the house is shut. The women walk {kin} up and down between the pains.",
        born: "At last the baby cries. It is a {baby}, and {kin} is tired but well. People keep stopping by with food.",
        hard: "In the end the baby comes feet first, a {baby}, small but breathing. {kin} lost a great deal of blood and will be in bed for weeks, but she is alive.",
        late: "Hours later the baby comes by itself, a {baby}, red and furious. Everyone in the house is too tired to celebrate.",
        alone: "The baby came before anyone could fetch help. The women with her managed by themselves. Mother and child are alive, but it was close.",
      },
    },
  ],
};
