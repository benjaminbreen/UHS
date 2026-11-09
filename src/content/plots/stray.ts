import { random } from "../../core/random";
import { amountOf, dueOf, elderOf, neighbours, partnerWords, pickOf, pronounWords } from "./common";
import type { Effect, PlotContext, PlotTemplate } from "./types";

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

const proof: Effect = {
  type: "choose", line: "proof", focus: "claimant",
  choices: [
    { id: "elder" },
    { id: "loose", check: { stat: "wit", skill: "animals", odds: 0.5 } },
    { id: "take", check: { stat: "agility", odds: 0.45 } },
    { id: "buy" },
  ],
};
const asked = (id: string) => ({ type: "not", of: { type: "fired", id } }) as const;

/** One of your animals has turned up among a neighbour's, and the neighbour
 * says it was always theirs. Herders cut ear-notches and brands so that
 * someone else could say whose an animal was. */
export const stray: PlotTemplate = {
  id: "stray",
  shape: "claim",
  look: {
    emblem: "pen",
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
    { id: "ask-elder", when: { type: "all", of: [{ type: "talked", role: "elder" }, asked("ask-claimant"), asked("ask-late")] }, then: [proof] },
    { id: "ask-claimant", when: { type: "all", of: [{ type: "talked", role: "claimant" }, asked("ask-elder"), asked("ask-late")] }, then: [proof] },
    { id: "ask-late", when: { type: "all", of: [{ type: "since", hours: 1.5 }, asked("ask-elder"), asked("ask-claimant")] }, then: [proof] },
    {
      id: "summoned",
      when: { type: "fired", id: "elder" },
      then: [{ type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" }],
    },
    {
      id: "judge",
      when: { type: "all", of: [{ type: "fired", id: "elder" }, { type: "came" }] },
      then: [{ type: "choose", line: "judge", focus: "elder", choices: [{ id: "mark", check: { stat: "agreeableness", odds: 0.6 } }, { id: "settle" }] }],
    },
    { id: "paid", when: { type: "any", of: [{ type: "fired", id: "buy" }, { type: "fired", id: "settle" }] }, then: [{ type: "seize", role: "claimant" }] },
    {
      id: "hide",
      when: { type: "all", of: [{ type: "since", hours: 5 }, { type: "not", of: { type: "settled" } }, asked("elder")] },
      then: [{ type: "card", line: "hide", focus: "claimant" }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "claimant" } },
    { id: "bought", when: { type: "settled" } },
    { id: "recovered", when: { type: "all", of: [{ type: "fired", id: "mark" }, asked("mark:failed")] } },
    { id: "followed", when: { type: "all", of: [{ type: "fired", id: "loose" }, asked("loose:failed")] } },
    { id: "taken", when: { type: "all", of: [{ type: "fired", id: "take" }, asked("take:failed")] } },
    { id: "caught", when: { type: "fired", id: "take:failed" } },
    { id: "lost", when: { type: "fired", id: "mark:failed" } },
    { id: "lost", when: { type: "fired", id: "loose:failed" } },
    { id: "absent", when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }] } },
    { id: "lost", when: { type: "all", of: [{ type: "due" }, asked("elder")] } },
  ],
  wording: [
    {
      title: "A Strayed Animal",
      lines: {
        aim: "Get {elder} to say whose it is, or buy it back from {claimant}, {due}.",
        intro: "You lost {animal} from your herd, and now it is grazing with {claimant}'s. You know it by {mark}. {claimant} the {claimantRole} says it was born in {his} pen.",
        threat: "If you let it go, {he} keeps it and breeds from it, and people will think they can take from you too.",
        partner: "Your {partnerKin} {partner} says {elder} saw that animal born.",
        "kin-partner": "{elder} knows our animals. Go and ask.",
        "cast-claimant": "Has your animal among {his} own, and says it is {his}.",
        "cast-elder": "Knows every animal around here and who it belongs to.",
        claim: "That one? It's mine. I've had it since it was born. If you're so sure, give me {amount} and take it.",
        hide: "{claimant} has moved {his} animals to the far pasture, away from where people can see them.",
        proof: "{claimant} won't give it up, and {his} people are watching yours. How do you prove it's yours?",
        "elder:label": "Ask {elder} to judge it",
        "elder:then": "{elder} agrees to look at it in front of {authority}, with {claimant} there.",
        hearing: "At the hearing about the animal",
        "aim-hearing": "Bring your claim before {authority} {meet}, where {elder} will look at the animal. It's marked on your map.",
        judge: "{claimant} has brought the animal, and says again it was born in {his} pen. {elder} is waiting to look at it.",
        "mark:label": "Show {elder} {mark}",
        "mark:failed": "{elder} looks a long time, and says {mark} could be anyone's.",
        "settle:label": "Pay {claimant} {amount} and be done with it",
        "loose:label": "Turn it loose and see which pen it walks to",
        "loose:then": "Everyone stands back, and the animal is let out onto the open ground between the two pens.",
        "loose:failed": "It stands, sniffs the air, and wanders over to {claimant}'s animals.",
        "take:label": "Take it back after dark",
        "take:failed": "{claimant}'s dog starts barking before you reach the pen.",
        "buy:label": "Pay {amount} from the store for it",
        recovered: "{elder} looks at the animal, points to {mark}, and says it's yours. {claimant} hands it over without another word.",
        followed: "It stands a moment, then walks straight across to your pen and in at the gate. Nobody can argue with that, and {claimant} doesn't try.",
        taken: "You lead it home in the dark, and in the morning it's grazing with yours. {claimant} knows, but says nothing.",
        caught: "{claimant} comes out and catches you with your hand on the gate. Now the story going round is that you tried to steal from {him}.",
        bought: "You pay {claimant}, and lead your own animal home. Everyone knows you paid for your own animal.",
        gone: "With {claimant} gone, you walk your animal home and nobody stops you.",
        absent: "You don't come to the hearing, so {elder} has nothing to look at but {claimant}'s word. The animal stays with {him}.",
        lost: "It goes {claimant}'s way, and now {animal} is grazing with {his} animals for good.",
      },
    },
  ],
};
