import { dueOf, neighbours, partnerWords, pickOf, pronounWords, temper } from "./common";
import type { Condition, PlotContext, PlotTemplate } from "./types";

type Break = { trade: RegExp; years?: [number, number]; broke: string; mend: string; buy?: string };

const BREAKS: Break[] = [
  { trade: /weaver/, broke: "the beam that holds the warp on your loom has split", mend: "You lash the beam with cord and wedge it tight" },
  { trade: /potter/, broke: "a crack has opened in the wall of the kiln", mend: "You pack the crack with wet clay and straw and let it dry by the fire" },
  { trade: /smith|ironworker|armourer|toolmaker/, broke: "the leather of your bellows has split along a seam", mend: "You stitch a patch over the split and grease it until it holds air" },
  { trade: /carpenter|cabinetmaker|cooper|wheelwright|wright|sawyer/, broke: "the blade of your best saw has snapped", mend: "You file the broken end square and work on with a short saw" },
  { trade: /flintknapper/, broke: "your best antler hammer has split", mend: "You find a good tine in the antler pile and shape a new one", buy: "Trade for a hammer" },
  { trade: /canoe-builder/, broke: "the head of your adze has come loose from its handle", mend: "You soak the binding and lash the stone head on again", buy: "Trade for a new adze" },
  { trade: /fisher|net-maker/, broke: "something big went through your net and tore a hole you could walk through", mend: "You sit on the shore with the needle and twine and close the hole mesh by mesh" },
  { trade: /miller/, broke: "a paddle has broken off the waterwheel", mend: "You cut a new paddle and peg it in, standing waist-deep in the race" },
  { trade: /ploughman|farmer|peasant|serf|villein|fellah|tenant|sharecropper|crofter/, years: [-4000, 1920], broke: "the share has come off your plough halfway down a furrow", mend: "You peg the share back on with new wedges" },
  { trade: /delivery-rider/, broke: "the chain has come off your bike and bent", mend: "You hammer the link straight on the kerb and get it back on" },
  { trade: /carter|cabman|muleteer/, broke: "a wheel has come off the cart", mend: "You jack up the axle on a stone and fit the wheel back with a new pin" },
  { trade: /rickshaw-puller/, broke: "a tyre on your rickshaw has burst", mend: "You patch the tube at a stall by the road" },
  { trade: /typist/, broke: "a key on your typewriter has jammed", mend: "You pull the cover off and free the type bar with a hairpin" },
];

const breakOf = (c: PlotContext) => {
  const job = c.player.origin?.livelihood ?? "", year = c.setting?.year ?? 0;
  return BREAKS.find((b) => b.trade.test(job) && (!b.years || (year >= b.years[0] && year < b.years[1])));
};

const any = (...of: Condition[]): Condition => ({ type: "not", of: { type: "all", of: of.map((c) => ({ type: "not", of: c })) } });
const done: Condition = { type: "fired", id: "worked" };

const lenderOf = (c: PlotContext) => {
  const pool = neighbours(c).slice(0, 8);
  return pool.length ? pickOf(c, pool, "breakdown-lender") : undefined;
};

/** Early in the day, the thing the work depends on breaks. */
export const breakdown: PlotTemplate = {
  id: "breakdown",
  shape: "work",
  look: {
    emblem: "bench",
    palette: { ink: "#121212", fill: "#2a2824", edge: "#6a5a42", light: "#ecebe6", accent: "#e0903e" },
  },
  weight: (c) => (breakOf(c) && lenderOf(c) ? 0.5 * temper(c, "conscientiousness") : 0),
  cast: (c) => {
    const neighbour = lenderOf(c);
    return neighbour && { neighbour };
  },
  begin: (c, cast) => {
    const b = breakOf(c)!, neighbour = cast.neighbour!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    return {
      deadline,
      words: { due, broke: b.broke, mend: b.mend, buy: b.buy ?? "Buy a new one", neighbour: neighbour.name, ...pronounWords(neighbour), ...p.words },
      refs: { neighbour: neighbour.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "broke", choices: [{ id: "mend", check: { stat: "wit", skill: "crafting", odds: 0.55 } }, { id: "borrow" }, { id: "buy" }] }],
  developments: [
    {
      id: "worse",
      when: { type: "all", of: [{ type: "fired", id: "mend:failed" }, { type: "since", hours: 1 }] },
      then: [{ type: "choose", line: "worse", choices: [{ id: "borrow" }, { id: "buy" }] }],
    },
    { id: "owed", when: { type: "all", of: [{ type: "fired", id: "borrow" }, done] }, then: [{ type: "regard", role: "neighbour", delta: 1 }] },
  ],
  endings: [
    { id: "bought", when: { type: "all", of: [{ type: "fired", id: "buy" }, done] } },
    { id: "borrowed", when: { type: "all", of: [{ type: "fired", id: "owed" }] } },
    { id: "mended", when: { type: "all", of: [{ type: "fired", id: "mend" }, { type: "not", of: { type: "fired", id: "mend:failed" } }, done] } },
    { id: "lost", when: any({ type: "due" }, { type: "all", of: [{ type: "fired", id: "mend:failed" }, done, { type: "not", of: any({ type: "fired", id: "borrow" }, { type: "fired", id: "buy" }) }] }) },
  ],
  wording: [
    {
      title: "Something Breaks",
      lines: {
        aim: "Get going again, and get the day's work done {due}.",
        intro: "Early this morning, {broke}. Everything stops until it's fixed.",
        threat: "A lost day puts you a day behind, and the work will still be waiting tomorrow.",
        partner: "Your {partnerKin} {partner} has heard the news and asks how long it will take.",
        "kin-partner": "Can it be fixed today?",
        "cast-neighbour": "Has the tools you need, and might lend them.",
        broke: "Nothing gets done until it's fixed. You could mend it yourself and hope it holds, borrow one from {neighbour}, or pay for a new one.",
        "mend:label": "Mend it yourself",
        "mend:then": "It looks rough, but it holds.",
        "mend:failed": "It holds for a few minutes and then gives way again, worse than before.",
        "borrow:label": "Ask {neighbour} to lend you one",
        "borrow:then": "{neighbour} lends it, and says to bring it back by evening.",
        "buy:label": "{buy}",
        "buy:then": "It costs more than a week's earnings, but it's new.",
        worse: "You've lost the morning on it and it's no better. It's time to borrow one or buy one.",
        mended: "{mend}. It isn't as good as new, but the day's work is done.",
        borrowed: "You get the work done and take it back to {neighbour} that evening. Now you owe {him} a favour.",
        bought: "The day's work is done, and the new one works better than the old one ever did. You'll feel the cost for a month.",
        lost: "The whole day went on it, and the work is still waiting.",
      },
    },
  ],
};
