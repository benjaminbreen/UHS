import { random } from "../../core/random";
import { amountOf, B, CHINA, dueOf, ITALY, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const hostOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) >= 30);
  return pool.length ? pickOf(c, pool, "host") : undefined;
};

/** A neighbouring household holds a feast, and your household is expected
 * to bring its share. */
export const feast: PlotTemplate = {
  id: "feast",
  look: {
    emblem: "feast",
    palette: { ink: "#16120c", fill: "#2a2114", edge: "#6a4a22", light: "#f2e6cc", accent: "#d08a2c" },
  },
  payee: "host",
  weight: (c) => ((c.household?.fortune ?? 0.5) >= 0.25 && hostOf(c) ? 0.6 : 0),
  cast: (c) => {
    const host = hostOf(c);
    return host && { host };
  },
  begin: (c, cast) => {
    const host = cast.host!;
    const owed = 3 + Math.floor(random(c.seed, "plot", "feast", "owed") * 3);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const funeral = random(c.seed, "plot", "feast", "kind") < 0.5;
    return {
      deadline,
      owed,
      words: {
        host: host.name,
        hostRole: host.role.toLowerCase(),
        amount: amountOf(c, owed),
        due,
        occasion: funeral ? "funeral feast" : "wedding feast",
        scene: funeral ? "funeral" : "wedding",
        held: funeral ? "the dead are remembered" : "the new couple are seated together",
        why: funeral ? "has buried a parent" : "is marrying off a child",
        ...pronounWords(host),
        ...p.words,
      },
      refs: { host: host.id, ...p.refs },
    };
  },
  opening: [
    { type: "approach", role: "host", line: "invite" },
    { type: "gather", at: "host", when: "deadline", label: "gather", scene: "feast" },
  ],
  developments: [
    {
      id: "cold",
      when: { type: "all", of: [{ type: "came" }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "cold", focus: "host" }, { type: "regard", role: "host", delta: -1 }],
    },
    {
      id: "snub",
      when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "regard", role: "host", delta: -2 }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "host" } },
    { id: "given", when: { type: "all", of: [{ type: "came" }, { type: "settled" }] } },
    { id: "shamed", when: { type: "fired", id: "snub" } },
    { id: "sent", when: { type: "gathered" } },
  ],
  wording: [
    {
      // Han weddings and funerals ran on gifts recorded by the host, each to be returned in kind.
      scope: { years: [B(206), 1950], bounds: CHINA },
      title: "A Neighbour's Feast",
      lines: {
        aim: "Bring your household's gift to {host}'s house for the {occasion}, {due}.",
        intro: "{host} the {hostRole} {why}, and the whole village will be at the {occasion}. Every household's gift is written in the book, and yours is expected.",
        threat: "If you give nothing, nobody will give to you when it's your turn.",
        partner: "Your {partnerKin} {partner} has been asking what you mean to bring.",
        "kin-partner": "What are we bringing to {host}'s? Everyone else has decided.",
        "cast-host": "Is holding a {occasion}, and is keeping the book of gifts.",
        invite: "You will come, of course. Your household gave well last time. {amount} would be about right.",
        gather: "At {host}'s {occasion}",
        cold: "Gifts are called out as they're written in the book. Yours isn't among them, and {host} sees you come in empty-handed.",
        given: "Your gift is called out and written in {host}'s book, and you're seated at the tables. Dish follows dish, {held}, and the wine goes round until late. When your household holds a feast, {host}'s will give back in kind.",
        sent: "Your gift is in {host}'s book, but people noticed your seat was empty.",
        gone: "With {host} gone, the feast does not happen, and nobody's gift is counted.",
        shamed: "The feast went on without your household's gift. {host}'s book shows that your household gave nothing.",
      },
    },
    {
      // Roman funerals closed with the silicernium at the grave and the cena novendialis on the ninth day.
      scope: { years: [B(500), 500], bounds: ITALY },
      title: "A Neighbour's Feast",
      lines: {
        aim: "Bring your household's share to {host}'s house for the {occasion}, {due}.",
        intro: "{host} the {hostRole} {why}, and the neighbours are expected at the {occasion}, each bringing something for the table.",
        threat: "A household that brings nothing gets talked about.",
        partner: "Your {partnerKin} {partner} wants to know what we can spare.",
        "kin-partner": "What are we bringing to {host}'s? We can't go with nothing.",
        "cast-host": "Is holding a {occasion}, and is noting who brings what.",
        invite: "We hope to see you at the {occasion}. Your household always gives generously. Something like {amount}.",
        gather: "At {host}'s {occasion}",
        cold: "Every household has brought something for the table except yours, and {host} has noticed.",
        given: "You give your share and are thanked in front of everyone. You eat lying on the couches with the others, {held}, and there are toasts until the lamps burn low.",
        sent: "Your share reached {host}'s table, but you didn't, and people asked why.",
        gone: "With {host} gone, there is no feast.",
        shamed: "The {occasion} went on without anything from your household. People noticed.",
      },
    },
    {
      title: "A Neighbour's Feast",
      lines: {
        aim: "Bring your household's share to {host}'s house for the {occasion}, {due}.",
        intro: "{host} the {hostRole} {why}, and everyone will be at the {occasion}. Each household brings its share.",
        threat: "A household that brings nothing will find others bring nothing when its own turn comes.",
        partner: "Your {partnerKin} {partner} wants to know what we can spare.",
        "kin-partner": "What are we bringing to {host}'s? We can't go with nothing.",
        "cast-host": "Is holding a {occasion}, and will notice who brings what.",
        invite: "You'll come to the {occasion}? Everyone is bringing something. {amount} would be right from your household.",
        gather: "At {host}'s {occasion}",
        cold: "Everyone else has brought something. {host} looks at your empty hands and says nothing.",
        given: "You bring your share to {host}'s {occasion}. Everyone eats together, {held}, and it goes on into the night. People will remember your gift when it's your turn.",
        sent: "Your share reached {host}'s {occasion}, but people noticed you didn't come.",
        gone: "With {host} gone, there is no feast.",
        shamed: "The {occasion} went on without your household's share. It will be remembered.",
      },
    },
  ],
};
