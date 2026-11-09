import { dueOf, partnerWords, temper } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

type Batch = { trade: RegExp; batch: string; care: string; early: string; good: string; bad: string; seconds: string };

const BATCHES: Batch[] = [
  { trade: /potter/, batch: "a full kiln of pots", care: "The fire has been climbing all night, and the pots inside are glowing.", early: "Open the kiln now", good: "You open the kiln and the pots ring when you tap them. Hardly a crack among them.", bad: "You open the kiln and a third of the pots have cracked.", seconds: "the cracked pots" },
  { trade: /brickmaker/, batch: "a clamp of bricks, stacked and burning", care: "The clamp has been burning for days, and the wind keeps pushing the fire to one side.", early: "Break the clamp open now", good: "The bricks come out hard and red, and they ring when you knock two together.", bad: "One side burned too hot and the bricks there have melted together. The other side is soft.", seconds: "the bad bricks" },
  { trade: /charcoal/, batch: "a charcoal mound, smouldering under its turf", care: "The mound has been smoking for days. The smoke has gone thin and blue, which may mean it's done.", early: "Open the mound now", good: "You open the mound and the charcoal is black, light and rings like metal.", bad: "Half the wood is still brown in the middle, and one side has burned to ash.", seconds: "the half-burned wood" },
  { trade: /lime-burner/, batch: "a kiln of limestone", care: "The kiln has been roaring all day and all night, and the stones on top are going white.", early: "Draw the kiln now", good: "The quicklime comes out white and crumbles in your fingers, just right.", bad: "Half the stones are still hard in the middle.", seconds: "the underburned stone" },
  { trade: /brewer|alewife/, batch: "a brew", care: "The ale is working, with a thick head of foam on it.", early: "Sell it young", good: "It's come out well: clear, strong, and it tastes right. People will be glad of it.", bad: "It's thin, and it's starting to turn sour.", seconds: "the sour ale" },
  { trade: /dyer|indigo/, batch: "a dye vat", care: "The cloth has been in the vat since dawn, and the colour on the test strip is coming up.", early: "Take the cloth out now", good: "The cloth comes out of the vat green and turns deep blue in the air. A good batch.", bad: "The colour has come out patchy and pale.", seconds: "the patchy cloth" },
  { trade: /glassblower/, batch: "a pot of glass melting in the furnace", care: "The glass has been melting since before dawn and the furnace is roaring.", early: "Start working it now", good: "The glass comes out clear, with hardly a bubble.", bad: "The glass is full of bubbles and streaks.", seconds: "the cloudy glass" },
  { trade: /bronze-caster/, batch: "a casting", care: "The mould is packed and drying by the furnace, and the metal is nearly ready.", early: "Pour it now", good: "You break the mould and the casting is clean, every line sharp.", bad: "You break the mould and the casting is full of holes.", seconds: "the spoiled casting" },
  { trade: /sugar-boiler/, batch: "a boiling of cane juice", care: "The juice has been moving from copper to copper all day, and the last one is thickening.", early: "Strike it now", good: "The sugar sets in the moulds, pale and hard.", bad: "The sugar has come out dark and wet, and it will taste of molasses.", seconds: "the dark sugar" },
  { trade: /soap-boiler|candle-maker/, batch: "a boiling of fat and lye", care: "The mixture has been boiling for hours and is starting to thicken.", early: "Pour it now", good: "It sets firm and clean. A good batch.", bad: "It never set properly and has gone soft and greasy.", seconds: "the soft batch" },
  { trade: /baker/, batch: "a full oven", care: "The oven came up hotter than you wanted, and the crusts are already brown.", early: "Take the loaves out now", good: "The loaves come out brown and hollow when you knock them.", bad: "The bottom row has burned and the top row is heavy in the middle.", seconds: "the spoiled loaves" },
];

const batchOf = (c: PlotContext) => BATCHES.find((b) => b.trade.test(c.player.origin?.livelihood ?? ""));
const any = (...of: Condition[]): Condition => ({ type: "not", of: { type: "all", of: of.map((c) => ({ type: "not", of: c })) } });
const out: Condition = any({ type: "fired", id: "worked" }, { type: "since", hours: 3 });

/** A firing, a brew or a dye bath: a whole batch that comes out good or doesn't. */
export const batch: PlotTemplate = {
  id: "batch",
  shape: "work",
  look: {
    emblem: "kiln",
    palette: { ink: "#160e0a", fill: "#2e1c14", edge: "#7a4a2a", light: "#f2e4d8", accent: "#f08a34" },
  },
  weight: (c) => (batchOf(c) ? 0.8 * temper(c, "conscientiousness") : 0),
  cast: () => ({}),
  begin: (c) => {
    const b = batchOf(c)!;
    const { deadline } = dueOf(c.clock);
    const p = partnerWords(c);
    return { deadline, words: { batch: b.batch, care: b.care, early: b.early, good: b.good, bad: b.bad, seconds: b.seconds, ...p.words }, refs: p.refs };
  },
  opening: [],
  developments: [
    {
      id: "care",
      when: { type: "since", hours: 1 },
      then: [{ type: "choose", line: "care", choices: [{ id: "early" }, { id: "wait", check: { stat: "conscientiousness", odds: 0.6 } }] }],
    },
    {
      id: "out",
      when: { type: "all", of: [out, any({ type: "fired", id: "early" }, { type: "fired", id: "wait:failed" })] },
      then: [{ type: "choose", line: "out", choices: [{ id: "cheap" }, { id: "dump" }, { id: "keep" }] }],
    },
  ],
  endings: [
    { id: "good", when: { type: "all", of: [out, { type: "fired", id: "wait" }, { type: "not", of: { type: "fired", id: "wait:failed" } }] } },
    { id: "cheap", when: { type: "fired", id: "cheap" } },
    { id: "dump", when: { type: "fired", id: "dump" } },
    { id: "keep", when: { type: "fired", id: "keep" } },
    { id: "spoiled", when: { type: "due" } },
  ],
  wording: [
    {
      title: "The Batch",
      lines: {
        aim: "See {batch} through, and decide what to do with whatever comes out of it.",
        intro: "You have {batch} going, and it needs watching all day.",
        threat: "A good batch sells well. A bad one wastes the work and the fuel.",
        partner: "Your {partnerKin} {partner} has brought you food so you don't have to leave it.",
        "kin-partner": "How's it looking?",
        care: "{care} Tomorrow is market day and the buyers are already asking. Done early, some of it will be poor. Given the full time, it could still go wrong.",
        "early:label": "{early}",
        "early:then": "You don't wait. It will be ready for market, whatever state it's in.",
        "wait:label": "Give it the full time",
        "wait:then": "You keep watching. You'll know in a few hours.",
        out: "{bad} You'll have to decide what to do with {seconds}.",
        "cheap:label": "Sell them cheap",
        "dump:label": "Get rid of them",
        "keep:label": "Keep them for the household",
        good: "{good} You get it to market with time to spare.",
        cheap: "You sell {seconds} for half price. It's some money, but people will see them and know whose work they are.",
        dump: "You get rid of {seconds} where nobody will see. It's a loss, but nobody will see one and know it's yours.",
        keep: "You keep {seconds} for the household. They'll do at home, and nobody outside will ever see them.",
        spoiled: "You left it too long unwatched. Whatever comes out of it, it won't be much.",
      },
    },
  ],
};
