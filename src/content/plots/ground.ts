import { random } from "../../core/random";
import { livelihoodById } from "../characters/livelihoods";
import { ruled } from "../history/order";
import { amountOf, dueOf, elderOf, fillIn, neighbours, partnerWords, pickOf, pronounWords, working } from "./common";
import type { Condition, Effect, PlotContext, PlotTemplate } from "./types";

const herding = (c: PlotContext) => livelihoodById(c.player.origin?.livelihood ?? "")?.activity === "Tending animals";
const fishing = (c: PlotContext) => /fish|trap|hunt|forag|gather/.test(c.player.origin?.livelihood ?? "");

const claimantOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 55);
  return pool.length ? pickOf(c, pool, "claimant") : undefined;
};

const answer: Effect = {
  type: "choose", line: "answer", focus: "claimant",
  choices: [{ id: "drive", check: { stat: "strength", odds: 0.45 } }, { id: "hear" }, { id: "turns" }, { id: "pay" }],
};
const open: Condition = { type: "all", of: [{ type: "not", of: { type: "fired", id: "walk" } }, { type: "not", of: { type: "settled" } }] };

/** Another household has started using ground yours has always used. Where
 * nobody rules, the claim rests on who remembers; where someone does, on
 * the boundary marks and whoever keeps the peace. */
export const ground: PlotTemplate = {
  id: "ground",
  shape: "claim",
  look: {
    emblem: "furrow",
    palette: { ink: "#14130c", fill: "#262316", edge: "#6a5a2a", light: "#efe9d2", accent: "#c09a3a" },
  },
  payee: "claimant",
  weight: (c) => {
    const kind = working(c) || herding(c) || fishing(c);
    if (!kind || !claimantOf(c) || !elderOf(c)) return 0;
    return c.setting && !ruled(c.setting) ? 0.5 : 0.3;
  },
  cast: (c) => {
    const claimant = claimantOf(c);
    const elder = claimant && elderOf(c, claimant);
    return claimant && elder && { claimant, elder };
  },
  begin: (c, cast) => {
    const claimant = cast.claimant!, elder = cast.elder!;
    const owed = 3 + Math.floor(random(c.seed, "plot", "ground", "owed") * 3);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const stateless = !!c.setting && !ruled(c.setting);
    const pr = pronounWords(claimant);
    const place = herding(c)
      ? pickOf(c, ["the grazing by the spring", "the summer pasture above the village", "the water meadow"], "ground-place")
      : fishing(c)
        ? pickOf(c, ["your household's fishing place below the bend", "the trapping ground along the ridge", "the stand of nut trees your household has always harvested"], "ground-place")
        : pickOf(c, ["the field your household cleared by the stream", "the strip at the edge of the village fields", "the garden plot below the houses"], "ground-place");
    return {
      deadline,
      owed,
      words: {
        claimant: claimant.name,
        claimantRole: claimant.role.toLowerCase(),
        elder: elder.name,
        amount: amountOf(c, owed),
        due,
        place,
        doing: fillIn(herding(c) ? "has been grazing {his} animals there" : fishing(c) ? "has been setting {his} own traps and lines there" : "has been digging and planting there", pr),
        proof: stateless ? "remembers who has used it, and for how long" : "knows where the old boundary marks stood",
        ...pr,
        ...p.words,
      },
      refs: { claimant: claimant.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "claimant", line: "claim" }],
  developments: [
    {
      id: "walk",
      when: { type: "all", of: [{ type: "any", of: [{ type: "talked", role: "elder" }, { type: "fired", id: "hear" }, { type: "fired", id: "drive:failed" }] }, { type: "not", of: { type: "settled" } }] },
      then: [
        { type: "gather", at: "authority", when: "morning", label: "hearing", scene: "hearing", aim: "aim-hearing" },
        { type: "card", line: "summoned", focus: "elder" },
      ],
    },
    {
      id: "heard",
      when: { type: "all", of: [{ type: "fired", id: "walk" }, { type: "came" }] },
      then: [{ type: "choose", line: "walk", focus: "elder", choices: [{ id: "say", check: { stat: "agreeableness", odds: 0.55 } }, { id: "divide" }] }],
    },
    {
      id: "answer",
      when: { type: "all", of: [{ type: "talked", role: "claimant" }, { type: "not", of: { type: "fired", id: "answer-late" } }, open] },
      then: [answer],
    },
    {
      id: "answer-late",
      when: { type: "all", of: [{ type: "since", hours: 1.5 }, { type: "not", of: { type: "fired", id: "answer" } }, open] },
      then: [answer],
    },
    { id: "paid", when: { type: "fired", id: "pay" }, then: [{ type: "seize", role: "claimant" }] },
    {
      id: "more",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "fired", id: "walk" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "more", focus: "claimant" }, { type: "regard", role: "claimant", delta: -1 }],
    },
  ],
  endings: [
    { id: "gone", when: { type: "gone", role: "claimant" } },
    { id: "upheld", when: { type: "all", of: [{ type: "fired", id: "say" }, { type: "not", of: { type: "fired", id: "say:failed" } }] } },
    { id: "lost", when: { type: "fired", id: "say:failed" } },
    { id: "halved", when: { type: "fired", id: "divide" } },
    { id: "shared", when: { type: "settled" } },
    { id: "turns", when: { type: "fired", id: "turns" } },
    { id: "driven", when: { type: "all", of: [{ type: "fired", id: "drive" }, { type: "not", of: { type: "fired", id: "drive:failed" } }] } },
    { id: "absent", when: { type: "all", of: [{ type: "gathered" }, { type: "not", of: { type: "came" } }] } },
    { id: "lost", when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "fired", id: "walk" } }] } },
  ],
  wording: [
    {
      title: "Whose Ground",
      lines: {
        aim: "Get {elder} to speak to your claim, or pay {claimant} to stay off, {due}.",
        intro: "{claimant} the {claimantRole} {doing}, on {place}. {He} says it was never yours.",
        threat: "Once people are used to seeing {him} there, it will be {his}.",
        partner: "Your {partnerKin} {partner} walked past and saw it for themselves.",
        "kin-partner": "{elder} {proof}. Go and ask.",
        "cast-claimant": "Has started using {place}, and says it was never yours.",
        "cast-elder": "Old enough that {elder}'s word on the ground will be taken.",
        claim: "This ground was nobody's. If you want me off it, make it worth my while: {amount}.",
        "claim.reluctant": "I didn't think anyone was using this ground. I don't want trouble with you. Give me {amount} and I'll leave it.",
        "claim.bully": "Nobody was using this ground, so now it's mine. If you want me off it, pay me {amount}.",
        "claim.gossip": "Nobody here thinks of this ground as yours. Ask them. If you want me off it, give me {amount}.",
        "claim.stickler": "Nobody was using this ground, so anyone can. If you want it to yourself, it's {amount} and I'll go.",
        "claim.unsure": "I thought this ground was nobody's. If it really is yours, give me {amount} and I'll go.",
        "claim.talker": "Oh, is this yours? Nobody told me. It was just sitting here, so I started using it, and I've got used to it now. Give me {amount} and I'll move off.",
        more: "{claimant}'s people were out on {place} again this morning, more of them this time.",
        hearing: "At the hearing about {place}",
        "aim-hearing": "Be at the hearing before {authority} {meet}, where {elder} will speak about the ground. It's marked on your map.",
        summoned: "{elder} agrees to speak about the ground. Both households are to come before {authority} {meet}.",
        walk: "{claimant} says the ground was nobody's until {he} worked it. Everyone turns to {elder}. What will you ask?",
        "say:label": "Ask {elder} to say whose it is",
        "say:then": "{elder} takes a long time over it, and everyone waits.",
        "say:failed": "{elder} thinks back a long way, and says {claimant}'s family used it first.",
        "divide:label": "Ask {elder} to divide it fairly",
        "hear:label": "Ask {elder} to hear it",
        answer: "{claimant} is out on {place} again. What do you do?",
        "drive:label": "Go out there and put {him} off it",
        "turns:label": "Offer to take it in turns, season by season",
        "pay:label": "Pay {amount} from the store to keep {him} off",
        upheld: "{elder} tells them about an old marker, half-buried in the grass at the edge, and says in front of everyone that the ground is yours. {claimant} pulls back.",
        halved: "{elder} says it should be split down the middle. Half is yours and half is {claimant}'s, and everyone at the hearing heard it.",
        turns: "{claimant} agrees: {he} has it this season, you have it next. It's not what you wanted, but nobody had to fight for it.",
        driven: "You go out and tell {claimant}, loudly, in front of {his} own people, to get off your ground. {He} goes, and doesn't come back.",
        "drive:failed": "Words turn to shoving, and you come off worse. People pull you apart, and {claimant} stays where {he} is.",
        absent: "You don't come to the hearing. {elder} speaks, but without you there it goes {claimant}'s way, and {place} is worked by {his} household now.",
        shared: "You pay {claimant}, and {he} agrees to stay off. Nobody says whose ground it really is.",
        gone: "With {claimant} gone, nobody else is using the ground.",
        lost: "It goes {claimant}'s way. From now on, {place} is worked by {claimant}'s household, not yours.",
      },
    },
  ],
};
