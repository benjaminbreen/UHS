import { random } from "../../core/random";
import { livelihoodById } from "../characters/livelihoods";
import { ruled } from "../history/order";
import { amountOf, dueOf, elderOf, fillIn, neighbours, partnerWords, pickOf, pronounWords, working } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const herding = (c: PlotContext) => livelihoodById(c.player.origin?.livelihood ?? "")?.activity === "Tending animals";
const fishing = (c: PlotContext) => /fish|trap|hunt|forag|gather/.test(c.player.origin?.livelihood ?? "");

const claimantOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 55);
  return pool.length ? pickOf(c, pool, "claimant") : undefined;
};

/** Another household has started using ground yours has always used. Where
 * nobody rules, the claim rests on who remembers; where someone does, on
 * the boundary marks and whoever keeps the peace. */
export const ground: PlotTemplate = {
  id: "ground",
  look: {
    emblem: "rent",
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
      id: "more",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "talked", role: "elder" } }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "card", line: "more", focus: "claimant" }, { type: "regard", role: "claimant", delta: -1 }],
    },
  ],
  endings: [
    { id: "upheld", when: { type: "talked", role: "elder" } },
    { id: "shared", when: { type: "settled" } },
    { id: "gone", when: { type: "gone", role: "claimant" } },
    { id: "lost", when: { type: "due" } },
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
        more: "{claimant}'s people were out on {place} again this morning, more of them this time.",
        upheld: "{elder} walks the ground with you and {claimant}, and says in front of everyone that it is yours. {claimant} pulls back.",
        shared: "You pay {claimant}, and {he} agrees to stay off. Nobody says whose ground it really is.",
        gone: "With {claimant} gone, nobody else is using the ground.",
        lost: "Nobody spoke up, and now {place} is {claimant}'s.",
      },
    },
  ],
};
