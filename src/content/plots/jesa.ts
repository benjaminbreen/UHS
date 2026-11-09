import { sexOf } from "../../core/brief";
import { KOREA, neighbours, partnerWords, pronounWords, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const held = (id: string) => ({ type: "all" as const, of: [{ type: "fired" as const, id }, { type: "after" as const, id: "came", hours: 0.5 }] });

const kinOf = (c: PlotContext) => {
  const ours = c.actors.filter((a) => a.kind === "human" && !a.dead && a.id !== c.player.id &&
    a.householdId === c.player.householdId && (a.age ?? 0) >= 14);
  const partner = c.player.relations?.find((r) => r.kind === "partner")?.other;
  return ours.find((a) => a.id === partner) ?? ours.sort((a, b) => (b.age ?? 0) - (a.age ?? 0))[0];
};

/** Tonight is the anniversary of a parent's or grandparent's death, and the
 * household holds the ancestor rite (gije) at midnight. Commoners took up
 * the Confucian rite through the late Joseon and kept it into the present. */
export const jesa: PlotTemplate = {
  id: "jesa",
  shape: "occasion",
  look: {
    emblem: "rite",
    palette: { ink: "#0e1012", fill: "#1e2226", edge: "#5a5048", light: "#eef0f2", accent: "#e0b060" },
  },
  weight: (c) => (within(c, { years: [1650, 2100], bounds: KOREA }) && (c.player.age ?? 0) >= 25 && kinOf(c) && neighbours(c).length ? 0.9 : 0),
  cast: (c) => {
    const kin = kinOf(c), neighbour = neighbours(c)[0];
    return kin && neighbour && { kin, neighbour };
  },
  begin: (c, cast) => {
    const kin = cast.kin!, neighbour = cast.neighbour!;
    const p = partnerWords(c);
    const year = c.setting?.year ?? 1800;
    return {
      deadline: Math.floor(c.clock / 86400) * 86400 + 24 * 3600,
      words: {
        kin: kin.name,
        neighbour: neighbour.name,
        dead: sexOf(c.player) === "female" && p.words ? `your ${p.words.partnerKin}'s father` : (c.player.age ?? 30) >= 45 ? "your father" : "your grandfather",
        tablet: year >= 1950 ? "a paper tablet (jibang) with his name written on it" : "his spirit tablet",
        ...pronounWords(kin),
        ...p.words,
      },
      refs: { kin: kin.id, neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [],
  developments: [
    {
      id: "store",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "store", focus: "kin", from: "kin", choices: [{ id: "borrow" }, { id: "fill" }, { id: "leave" }] }],
    },
    {
      id: "go",
      when: { type: "any", of: [{ type: "fired", id: "borrow" }, { type: "fired", id: "fill" }, { type: "fired", id: "leave" }] },
      then: [{ type: "gather", at: "kin", when: "evening", label: "rite", aim: "go", scene: "memorial" }],
    },
  ],
  endings: [
    { id: "full", when: held("borrow") },
    { id: "filled", when: held("fill") },
    { id: "spare", when: held("leave") },
    { id: "missed", when: { type: "gathered" } },
    { id: "late", when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "fired", id: "go" } }] } },
  ],
  wording: [
    {
      title: "The Memorial Rite",
      lines: {
        aim: "Finish the day's work, then come back to {kin} and lay the memorial table tonight.",
        intro: "Tonight is the anniversary of the death of {dead}. Tonight the household sets out food for him and bows, as he did for his own father: rice and soup, rice cakes, dried fish, jujubes, chestnuts and the best fruit you have.",
        threat: "Nobody will punish a household that skimps. But the neighbours will notice.",
        partner: "Your {partnerKin} {partner} has been making rice cakes since morning.",
        "kin-partner": "Is there enough fruit for the table? We need it to look full tonight.",
        "cast-kin": "Is getting the memorial table ready for tonight.",
        "cast-neighbour": "Lives next door, and keeps a good store.",
        store: "I've been through the store twice. There are no chestnuts, and the pears are small and spotted. What do we do?",
        "borrow:label": "Borrow from {neighbour}",
        "borrow:then": "{neighbour} lends you a bowl of chestnuts and three good pears. You will owe the same back when that household holds its own rites.",
        "fill:label": "Make do with what's in the store",
        "fill:then": "You fill the gaps with dried persimmons and an extra plate of rice cakes. From the front it looks full.",
        "leave:label": "Leave the dish off",
        "leave:then": "You'll set the table with what you have and leave the chestnuts off. You would rather set a smaller table than borrow.",
        rite: "At the memorial rite",
        go: "Be home for the rite {meet}. It's marked on your map.",
        full: "The table is full: red fruit to the east, white to the west, {tablet} at the back. You pour the wine, bow twice, and wait in silence while he eats. Then the household eats what he left.",
        filled: "The table is set, with persimmons where the pears should be. You pour the wine, bow twice, and wait in silence while he eats. Nobody but {kin} knows the difference.",
        spare: "You bow before a table with a gap in it. You pour the wine and wait in silence while he eats. He was never fond of chestnuts, {kin} says afterwards.",
        missed: "The household bowed before the table without you. {kin} was upset, and didn't say a word about it.",
        late: "It was well past midnight before the table was ready, and the rite was hurried. {kin} was upset, and didn't say a word about it.",
      },
    },
  ],
};
