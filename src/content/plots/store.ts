import { ruled } from "../history/order";
import { B, CHINA, dueOf, elderOf, neighbours, notable, partnerWords, pickOf, pronounWords, temper, within } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

const castOf = (c: PlotContext) => {
  const pool = neighbours(c).filter((a) => (a.age ?? 30) < 55 && !c.player.relations?.some((r) => r.kind === "partner" && r.other === a.id));
  const suspect = pool.length ? pickOf(c, pool, "store-suspect") : undefined;
  const fits = (a: { householdId?: string }) => a.householdId !== suspect?.householdId;
  const keeper = suspect && ((ruled(c.setting) && notable(c, fits)) || elderOf(c, suspect));
  return suspect && keeper ? { suspect, elder: keeper } : undefined;
};

/** You saw someone take from what everyone shares, and they did not see you. */
export const store: PlotTemplate = {
  id: "store",
  shape: "witness",
  look: {
    emblem: "store",
    palette: { ink: "#14120e", fill: "#2e261c", edge: "#7a6040", light: "#efe8da", accent: "#e0a050" },
  },
  weight: (c) => (castOf(c) ? 0.5 * temper(c, "agreeableness") : 0),
  cast: (c) => castOf(c),
  begin: (c, cast) => {
    const suspect = cast.suspect!, elder = cast.elder!;
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const kept = within(c, { years: [1950, 2100] }) ? "the cash box" : within(c, { years: [B(54), 1912], bounds: CHINA }) ? "the granary"
      : within(c, { years: [1400, 1572], cultures: ["andean"] }) ? "the storehouse" : "the store";
    return {
      deadline,
      words: {
        suspect: suspect.name,
        elder: elder.name,
        due,
        store: kept,
        Store: kept.replace(/^./, (x) => x.toUpperCase()),
        why: pickOf(c, ["a sick child at home", "a debt nobody knows about", "a household that has run out of everything"], "store-why"),
        ...pronounWords(suspect),
        ...p.words,
      },
      refs: { suspect: suspect.id, elder: elder.id, ...p.refs },
    };
  },
  opening: [{ type: "choose", line: "decide", focus: "suspect", choices: [{ id: "spoke" }, { id: "reported" }, { id: "asked" }, { id: "silent" }] }],
  developments: [
    { id: "grateful", when: { type: "fired", id: "spared" }, then: [{ type: "regard", role: "suspect", delta: 3 }] },
    { id: "shamed", when: { type: "fired", id: "named" }, then: [{ type: "regard", role: "suspect", delta: -3 }, { type: "regard", role: "elder", delta: 1 }] },
    {
      id: "why",
      when: { type: "all", of: [{ type: "fired", id: "spoke" }, { type: "since", hours: 2 }] },
      then: [{ type: "choose", line: "why", focus: "suspect", choices: [{ id: "spared" }, { id: "reported" }] }],
    },
    {
      id: "hearing",
      when: { type: "all", of: [{ type: "fired", id: "reported" }, { type: "since", hours: 2 }] },
      then: [{ type: "choose", line: "hearing", focus: "elder", choices: [{ id: "named" }, { id: "settled" }] }],
    },
    {
      id: "short",
      when: { type: "all", of: [{ type: "fired", id: "asked" }, { type: "since", hours: 2 }] },
      then: [{ type: "choose", line: "short", focus: "elder", choices: [{ id: "lied", check: { stat: "wit", skill: "speech", odds: 0.5 } }, { id: "confessed" }] }],
    },
  ],
  endings: [
    { id: "caught", when: { type: "fired", id: "lied:failed" } },
    { id: "kept", when: { type: "fired", id: "lied" } },
    { id: "confessed", when: { type: "fired", id: "confessed" } },
    { id: "spared", when: { type: "fired", id: "spared" } },
    { id: "named", when: { type: "fired", id: "named" } },
    { id: "settled", when: { type: "fired", id: "settled" } },
    { id: "silent", when: { type: "fired", id: "silent" } },
    { id: "gone", when: { type: "gone", role: "suspect" } },
    { id: "silent", when: { type: "due" } },
  ],
  wording: [
    {
      // Each Inca province kept rows of qollqa storehouses, their contents tallied on khipu cords.
      scope: { years: [1400, 1572], cultures: ["andean"] },
      title: "A Hand in the Storehouse",
      lines: {
        intro: "Passing the storehouses on the hill at dusk, you saw {suspect} come out of one with a bag of maize under {his} mantle. The stores belong to the Inca and are counted on the knotted cords. {suspect} did not see you.",
        threat: "When the count comes up short, someone will be blamed, and it may not be {suspect}.",
        partner: "Your {partnerKin} {partner} says the storehouses are none of your business.",
        "kin-partner": "Those stores are counted. If they find a gap, everyone will be asked.",
        "cast-suspect": "Took maize from the storehouse at dusk, and thinks nobody saw.",
        "cast-elder": "Answers for the storehouses and their counts.",
        hearing: "{elder} has had the cords read against the storehouse, and it is short. {elder} wants you to say what you saw in front of the whole ayllu (the kin group) this evening.",
        silent: "You say nothing. When the count is taken, the gap is put down to rats.",
      },
    },
    {
      // The ever-normal granaries, first set up in 54 BCE, bought grain cheap after harvest and sold it cheap in a dearth.
      scope: { years: [B(54), 1912], bounds: CHINA },
      title: "A Hand in the Granary",
      lines: {
        intro: "Late last night you saw {suspect} come out of the granary with a sack of grain. That grain is kept back to be sold cheap in a bad year. {suspect} did not see you.",
        threat: "When the granary is checked and the grain is short, the whole village will be questioned.",
        partner: "Your {partnerKin} {partner} says getting involved only brings trouble.",
        "kin-partner": "If the yamen (the county office) hears there's grain missing, they'll question all of us.",
        "cast-suspect": "Took grain from the granary last night, and thinks nobody saw.",
        "cast-elder": "Answers for the granary when the officials come to check.",
        silent: "You say nothing. When the grain is weighed, the loss is blamed on damp and rats.",
      },
    },
    {
      scope: { years: [1950, 2100] },
      title: "A Hand in the Till",
      lines: {
        intro: "You saw {suspect} slip notes from the shared cash box into {his} pocket when {he} thought the room was empty. {suspect} did not see you.",
        threat: "When the cash is counted and comes up short, everyone who works there will be under suspicion.",
        partner: "Your {partnerKin} {partner} says to stay out of it.",
        "kin-partner": "Stay out of it. It's not your money.",
        "cast-suspect": "Took money from the cash box, and thinks nobody saw.",
        "cast-elder": "Counts the cash box at the end of the week.",
        "spared:label": "Keep quiet while {he} pays it back",
        "asked:then": "{suspect} goes white, then counts some of the notes into your hand. Now you're both in it.",
        silent: "You say nothing. When the count is short, everyone falls under suspicion, you included.",
      },
    },
    {
      title: "A Hand in the Store",
      lines: {
        aim: "Decide what to do about what you saw, {due}.",
        intro: "Late last night you saw {suspect} take food from the store everyone shares. {suspect} did not see you.",
        threat: "When people find the store short, they will start to suspect each other.",
        partner: "Your {partnerKin} {partner} says it's not your place to say anything.",
        "kin-partner": "If you tell, you make an enemy. If you don't, everyone else pays for it.",
        "cast-suspect": "Took from the shared store last night, and thinks nobody saw.",
        "cast-elder": "Looks after the store that everyone shares.",
        decide: "{suspect} is going about the day as if nothing happened. Only you know what is missing from {store}.",
        "spoke:label": "Speak to {suspect} alone",
        "spoke:then": "You tell {suspect} what you saw. {He} goes very still, and asks you to come by later, when nobody is about.",
        "reported:label": "Tell {elder}",
        "reported:then": "You tell {elder}, who listens and says nothing for a long moment.",
        "asked:label": "Ask {suspect} for a share",
        "asked:then": "{suspect} goes white, then brings you a share of what {he} took. Now you're both in it.",
        "silent:label": "Say nothing",
        why: "{suspect} tells you about {why}. {He} can't put back what's been used, but {he} can make it up over the next month, if nobody else finds out.",
        "spared:label": "Keep {his} secret",
        hearing: "{elder} has had {store} counted, and it is short. {elder} wants you to say what you saw in front of everyone this evening.",
        "named:label": "Say it in front of everyone",
        "settled:label": "Ask {elder} to settle it quietly",
        short: "{Store} has been counted and found short. {elder} is asking everyone, one by one, where they were last night. Now it's your turn.",
        "lied:label": "Say you know nothing",
        "lied:failed": "You say you know nothing, but you say it too fast. {elder} looks at you, then at {suspect}.",
        "confessed:label": "Tell {elder} everything",
        caught: "It comes out in an hour. {suspect} has to make good what was taken, and you have to make good your share and more. Nobody will trust either of you with {store} again.",
        kept: "{elder} moves on to the next person. Nobody ever finds out, but you can't pass {store} now without thinking of it.",
        confessed: "You tell {elder} everything, your share included. You both have to pay it back, but {elder} remembers that you came forward.",
        spared: "You keep {his} secret. Over the next month, a little at a time, it is all made good. {suspect} won't forget that you came to {him} first.",
        named: "You stand up and say what you saw. {suspect} has to make up what was taken, in front of everyone. People thank you, and some of them stop talking when you come near.",
        settled: "{elder} has a quiet word with {suspect}. It is all paid back within the month, and nobody else ever hears who saw.",
        silent: "You say nothing. {Store} is short, and nobody ever finds out why.",
        gone: "With {suspect} gone, nothing more goes missing from {store}.",
      },
    },
  ],
};
