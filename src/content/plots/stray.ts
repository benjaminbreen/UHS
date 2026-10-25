import { random } from "../../core/random";
import { amountOf, dueOf, elderOf, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const ANIMALS: [RegExp, string[]][] = [
  [/shepherd/, ["a ewe", "a ram lamb"]],
  [/goat/, ["a young she-goat", "your best milking goat"]],
  [/swine|pig/, ["a breeding sow", "a half-grown pig"]],
  [/cattle|dairy|milk|ranch|drover/, ["a heifer", "a young ox", "a milk cow"]],
  [/camel/, ["a young camel"]],
  [/horse/, ["a mare", "a yearling colt"]],
  [/llama/, ["a young llama"]],
  [/reindeer/, ["a reindeer calf"]],
  [/yak/, ["a young yak"]],
  [/herder/, ["a young animal from your herd"]],
];

const animalsOf = (c: PlotContext) => ANIMALS.find(([re]) => re.test(c.player.origin?.livelihood ?? ""))?.[1];

const claimantOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 55);
  return pool.length ? pickOf(c, pool, "stray-claimant") : undefined;
};

/** One of your animals has turned up among a neighbour's, and the neighbour
 * says it was always theirs. Herders cut ear-notches and brands so that
 * someone else could say whose an animal was. */
export const stray: PlotTemplate = {
  id: "stray",
  look: {
    emblem: "robbery",
    palette: { ink: "#14110c", fill: "#261f16", edge: "#6e5230", light: "#efe6d6", accent: "#b87a3e" },
  },
  payee: "claimant",
  weight: (c) => (animalsOf(c) && claimantOf(c) && elderOf(c) ? 0.6 : 0),
  cast: (c) => {
    const claimant = claimantOf(c);
    const elder = claimant && elderOf(c, claimant);
    return claimant && elder && { claimant, elder };
  },
  begin: (c, cast) => {
    const claimant = cast.claimant!, elder = cast.elder!;
    const owed = 3 + Math.floor(random(c.seed, "plot", "stray", "owed") * 3);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      owed,
      words: {
        claimant: claimant.name,
        claimantRole: claimant.role.toLowerCase(),
        elder: elder.name,
        amount: amountOf(c, owed),
        due,
        animal: pickOf(c, animalsOf(c)!, "stray-animal"),
        mark: pickOf(c, ["the notch you cut in its ear", "the burn on its flank", "the white blaze it was born with"], "stray-mark"),
        ...pronounWords(claimant),
        ...p.words,
      },
      refs: { claimant: claimant.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "claimant", line: "claim" }],
  developments: [
    {
      id: "hide",
      when: { type: "all", of: [{ type: "since", hours: 5 }, { type: "not", of: { type: "talked", role: "elder" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "hide", focus: "claimant" }],
    },
  ],
  endings: [
    { id: "recovered", when: { type: "talked", role: "elder" } },
    { id: "bought", when: { type: "settled" } },
    { id: "gone", when: { type: "gone", role: "claimant" } },
    { id: "lost", when: { type: "due" } },
  ],
  wording: [
    {
      title: "A Strayed Animal",
      lines: {
        aim: "Get {elder} to say whose it is, or buy it back from {claimant}, {due}.",
        intro: "You lost {animal} from your herd, and now it is grazing with {claimant}'s. You know it by {mark}. {claimant} the {claimantRole} says it was born in {his} pen.",
        threat: "If you let it go, {he} will keep it and breed from it, and everyone will know you can be taken from.",
        partner: "Your {partnerKin} {partner} says {elder} saw that animal born.",
        "kin-partner": "{elder} knows our animals. Go and ask.",
        "cast-claimant": "Has your animal among {his} own, and says it is {his}.",
        "cast-elder": "Knows every animal around here and who it belongs to.",
        claim: "That one? It's mine. I've had it since it was born. If you're so sure, give me {amount} and take it.",
        hide: "{claimant} has moved {his} animals to the far pasture, away from where people can see them.",
        recovered: "{elder} looks at the animal, points to {mark}, and says it's yours. {claimant} hands it over without another word.",
        bought: "You pay {claimant}, and lead your own animal home. People understand what happened.",
        gone: "With {claimant} gone, you walk your animal home and nobody stops you.",
        lost: "Nobody settled it, and now {animal} is grazing with {claimant}'s animals for good.",
      },
    },
  ],
};
