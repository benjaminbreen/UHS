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
        why: funeral ? "has buried a parent" : "is marrying off a child",
        ...pronounWords(host),
        ...p.words,
      },
      refs: { host: host.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "host", line: "invite" }],
  developments: [],
  endings: [
    { id: "given", when: { type: "settled" } },
    { id: "gone", when: { type: "gone", role: "host" } },
    { id: "shamed", when: { type: "due" } },
  ],
  wording: [
    {
      // Han weddings and funerals ran on gifts recorded by the host, each to be returned in kind.
      scope: { years: [B(206), 1950], bounds: CHINA },
      title: "A Neighbour's Feast",
      lines: {
        aim: "Bring your household's gift to {host}'s {occasion}, {due}.",
        intro: "{host} the {hostRole} {why}, and the whole village will be at the {occasion}. Every household's gift is written in the book, and yours is expected.",
        threat: "If you give nothing, nobody will give to you when it's your turn.",
        partner: "Your {partnerKin} {partner} has been asking what you mean to bring.",
        "kin-partner": "What are we bringing to {host}'s? Everyone else has decided.",
        "cast-host": "Is holding a {occasion}, and is keeping the book of gifts.",
        invite: "You will come, of course. Your household gave well last time. {amount} would be about right.",
        given: "Your gift is entered in {host}'s book. When your household holds a feast, {host}'s will give back in kind.",
        gone: "With {host} gone, the feast does not happen, and nobody's gift is counted.",
        shamed: "The feast went on without your household's gift. {host}'s book shows that your household gave nothing.",
      },
    },
    {
      // Roman funerals closed with the silicernium at the grave and the cena novendialis on the ninth day.
      scope: { years: [B(500), 500], bounds: ITALY },
      title: "A Neighbour's Feast",
      lines: {
        aim: "Bring your household's share to {host}'s {occasion}, {due}.",
        intro: "{host} the {hostRole} {why}, and the neighbours are expected at the {occasion}, each bringing something for the table.",
        threat: "A household that brings nothing gets talked about.",
        partner: "Your {partnerKin} {partner} wants to know what we can spare.",
        "kin-partner": "What are we bringing to {host}'s? We can't go with nothing.",
        "cast-host": "Is holding a {occasion}, and is noting who brings what.",
        invite: "We hope to see you at the {occasion}. Your household always gives generously. Something like {amount}.",
        given: "You give your share at {host}'s {occasion}, and are thanked in front of everyone.",
        gone: "With {host} gone, there is no feast.",
        shamed: "The {occasion} went on without anything from your household. People noticed.",
      },
    },
    {
      title: "A Neighbour's Feast",
      lines: {
        aim: "Bring your household's share to {host}'s {occasion}, {due}.",
        intro: "{host} the {hostRole} {why}, and everyone will be at the {occasion}. Each household brings its share.",
        threat: "A household that brings nothing will find others bring nothing when its own turn comes.",
        partner: "Your {partnerKin} {partner} wants to know what we can spare.",
        "kin-partner": "What are we bringing to {host}'s? We can't go with nothing.",
        "cast-host": "Is holding a {occasion}, and will notice who brings what.",
        invite: "You'll come to the {occasion}? Everyone is bringing something. {amount} would be right from your household.",
        given: "You bring your share to {host}'s {occasion}. People notice, and they'll remember when it's your turn.",
        gone: "With {host} gone, there is no feast.",
        shamed: "The {occasion} went on without your household's share. It will be remembered.",
      },
    },
  ],
};
