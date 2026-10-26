import { random } from "../../core/random";
import { livelihoodById } from "../characters/livelihoods";
import { ruled } from "../history/order";
import { AEGEAN, amountOf, B, BRITAIN, CHINA, dueOf, ISLAMIC, ITALY, neighbours, notable, partnerWords, pickOf, pronounWords } from "./common";
import type { PlotContext, PlotTemplate } from "./types";

/** What an inspector could find wrong, by the kind of work sold. */
const FAULTS: Record<string, string[]> = {
  "Exchanging goods": ["your weights are light", "your measure has a false bottom", "you sold old stock as fresh"],
  "Minding the stall": ["your weights are light", "you sold old stock as fresh"],
  "Preparing food": ["your loaves are under the set weight", "you sold meat that had turned"],
  Brewing: ["your ale is weaker than the price allows", "you sold short measures"],
  "Working the grain": ["you kept back more than your toll from the grain", "your measure has a false bottom"],
  "Working cloth": ["your cloth is shorter than the standard length", "your cloth was stretched to make up the length"],
  "Making clothes": ["you passed off cheap cloth as good"],
  "Working leather": ["you sold badly tanned leather as good"],
  "Making shoes": ["you sold badly tanned leather as good"],
  "Working metal": ["you sold soft iron as good steel"],
  "Turning pots": ["your jars hold less than the standard measure"],
};

const faultsOf = (c: PlotContext) => {
  const kit = livelihoodById(c.player.origin?.livelihood ?? "");
  return kit && FAULTS[kit.activity];
};

const urban = (c: PlotContext) => c.setting?.settlement === "city" || c.setting?.settlement === "port";

/** The older neighbour who answers for the market, away from the one who can vouch for you. */
const officialOf = (c: PlotContext) => {
  const vouch = notable(c);
  return neighbours(c).find((a) => a.householdId !== vouch?.householdId && (a.age ?? 30) >= 30);
};

/** A market officer says your goods or measures are short. */
export const fine: PlotTemplate = {
  id: "fine",
  look: {
    emblem: "levy",
    palette: { ink: "#14140f", fill: "#24241a", edge: "#5e5a2e", light: "#ecebd8", accent: "#b8a03a" },
  },
  payee: "official",
  weight: (c) => (ruled(c.setting) && urban(c) && faultsOf(c) && officialOf(c) && notable(c) ? 0.6 : 0),
  cast: (c) => {
    const official = officialOf(c);
    const witness = notable(c);
    return official && witness && { official, witness };
  },
  begin: (c, cast) => {
    const official = cast.official!, witness = cast.witness!;
    const owed = 2 + Math.floor(random(c.seed, "plot", "fine", "owed") * 4);
    const { deadline, due } = dueOf(c.clock);
    const p = partnerWords(c);
    const fault = pickOf(c, faultsOf(c)!, "fine-fault");
    return {
      deadline,
      owed,
      words: {
        official: official.name,
        witness: witness.name,
        amount: amountOf(c, owed),
        due,
        fault,
        Fault: fault.replace(/^./, (x) => x.toUpperCase()),
        ...pronounWords(official),
        ...p.words,
      },
      refs: { official: official.id, witness: witness.id, ...p.refs },
    };
  },
  opening: [{ type: "approach", role: "official", line: "charge" }],
  developments: [
    {
      id: "remind",
      when: { type: "all", of: [{ type: "since", hours: 4 }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "talked", role: "witness" } }] },
      then: [{ type: "card", line: "remind", focus: "official" }],
    },
    {
      id: "seize",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }, { type: "not", of: { type: "talked", role: "witness" } }] },
      then: [{ type: "approach", role: "official", line: "seize" }, { type: "seize", role: "official" }],
    },
  ],
  endings: [
    { id: "cleared", when: { type: "talked", role: "witness" } },
    { id: "paid", when: { type: "settled" } },
    { id: "seized", when: { type: "fired", id: "seize" } },
    { id: "gone", when: { type: "gone", role: "official" } },
  ],
  wording: [
    {
      // Athens chose metronomoi by lot to check weights and measures in the agora, and agoranomoi to police the goods.
      scope: { years: [B(500), B(86)], bounds: AEGEAN },
      title: "The Market Inspectors",
      lines: {
        aim: "Pay {official}'s fine, or get {witness} to vouch for you, {due}.",
        intro: "{official}, one of the officials chosen by lot to inspect the agora this year, says {fault}.",
        threat: "If the fine isn't paid, {he} can take what it is worth from your goods.",
        partner: "Your {partnerKin} {partner} says {witness} has bought from you for years and knows your measures are honest.",
        "kin-partner": "Ask {witness} to speak for you. The inspectors know {witness}.",
        "cast-official": "This year's market inspector. Says {fault}.",
        "cast-witness": "A respected citizen who has traded with you for years.",
        charge: "I've checked your stall. {Fault}. The fine is {amount}, {due}.",
        remind: "{official} has put a mark against your stall, and people are walking past it.",
        seize: "The fine wasn't paid, so I'm taking it in goods.",
        cleared: "{witness} vouches for your measures in front of the inspectors, and they let the fine go.",
        paid: "You pay {official} the fine. Your stall is clear.",
        seized: "{official} takes the value of the fine from your stock.",
        gone: "With {official} gone, nobody follows up the fine.",
      },
    },
    {
      // The aediles kept the markets, weights and measures of Rome and the towns that copied it.
      scope: { years: [B(367), 450], bounds: ITALY },
      title: "The Aedile's Fine",
      lines: {
        aim: "Pay the aedile's fine through {official}, or get {witness} to vouch for you, {due}.",
        intro: "{official}, who works for the aediles, the officials in charge of the market, says {fault}.",
        threat: "If the fine isn't paid, the aediles' men can take it from your stock.",
        partner: "Your {partnerKin} {partner} says {witness} could get the fine dropped with a word.",
        "kin-partner": "Go to {witness}. The aediles' people listen to {witness}.",
        "cast-official": "Works for the aediles. Says {fault}.",
        "cast-witness": "Has standing in town, and a word from {witness} carries weight with the aediles.",
        charge: "{Fault}. The aediles fine you {amount}. I'll collect it {due}.",
        remind: "{official} has told the other stallholders, and they are watching to see what you do.",
        seize: "The fine is unpaid. I'm taking its value in goods.",
        cleared: "{witness} speaks to the aediles' office for you, and the fine is dropped.",
        paid: "You pay the fine to {official}. It goes in the aediles' records as paid.",
        seized: "{official} takes the value of the fine from your stock.",
        gone: "With {official} gone, the fine is forgotten.",
      },
    },
    {
      // The muhtasib walked the market with scales, tested weights and goods, and could punish on the spot.
      scope: { years: [750, 1850], bounds: ISLAMIC },
      title: "The Muhtasib",
      lines: {
        aim: "Pay the muhtasib's fine through {official}, or get {witness} to vouch for you, {due}.",
        intro: "{official}, who walks the market for the muhtasib, the market inspector, says {fault}.",
        threat: "The muhtasib can fine you, take your goods, or have you shamed in front of the whole market.",
        partner: "Your {partnerKin} {partner} says {witness} is respected enough to make the muhtasib think again.",
        "kin-partner": "{witness} has standing. Ask {witness} to speak for you before it gets worse.",
        "cast-official": "Works for the muhtasib. Says {fault}.",
        "cast-witness": "A trader whose honesty nobody in the market doubts.",
        charge: "I tested your goods against the standard. {Fault}. You owe {amount}, {due}.",
        remind: "People heard {official} at your stall. Some buyers are going elsewhere.",
        seize: "You haven't paid, so I'm taking the fine in goods.",
        cleared: "{witness} vouches for you to the muhtasib, and the fine is dropped.",
        paid: "You pay {official}. The muhtasib's people leave you alone.",
        seized: "{official} takes the value of the fine from your stock, in front of the other traders.",
        gone: "With {official} gone, nobody comes back about the fine.",
      },
    },
    {
      // Towns and guilds appointed searchers to check goods; bread and ale went by the Assize of 1266, set by the price of grain.
      scope: { years: [1266, 1700], bounds: BRITAIN },
      title: "The Town's Searchers",
      lines: {
        aim: "Pay {official}'s fine, or get {witness} to speak for you, {due}.",
        intro: "{official}, one of the searchers the town appoints to inspect goods for sale, says {fault}.",
        threat: "If you don't pay, the fine goes before the court, and the next time it's the pillory.",
        partner: "Your {partnerKin} {partner} says {witness} buys from you every week.",
        "kin-partner": "{witness} is on the court's jury. Get {witness} to speak for you.",
        "cast-official": "One of the town's searchers. Says {fault}.",
        "cast-witness": "Respected in town, and buys from you every week.",
        charge: "{Fault}. That's against the town's rules. The fine is {amount}, {due}.",
        remind: "{official} has written your name down for the court.",
        seize: "Unpaid, so I'm taking the fine in goods.",
        cleared: "{witness} speaks for you, and {official} lets it go this time.",
        paid: "You pay {official}. Your name comes off the list.",
        seized: "{official} takes the value of the fine from your stock.",
        gone: "With {official} gone, your name never reaches the court.",
      },
    },
    {
      // The Tang market office checked weights and measures, and recorded three grades of price for each good every ten days.
      scope: { years: [618, 907], bounds: CHINA },
      title: "The Market Office",
      lines: {
        aim: "Pay the market office's fine through {official}, or get {witness} to vouch for you, {due}.",
        intro: "{official}, from the market office that checks every stall's weights and sets the prices every ten days, says {fault}.",
        threat: "If the fine isn't paid, the office can take it in goods or close your stall.",
        partner: "Your {partnerKin} {partner} says {witness} is known at the market office.",
        "kin-partner": "The office will listen to {witness}. Go now.",
        "cast-official": "From the market office. Says {fault}.",
        "cast-witness": "Well known at the market office, and has always found you honest.",
        charge: "Your stall was checked against the office's standards. {Fault}. The fine is {amount}, {due}.",
        remind: "A notice about your stall has gone up at the market gate.",
        seize: "Unpaid. I'm taking the fine in goods.",
        cleared: "{witness} vouches for you at the market office, and the fine is struck off.",
        paid: "You pay {official}. The notice comes down.",
        seized: "{official} takes the value of the fine from your stock.",
        gone: "With {official} gone, the fine is never collected.",
      },
    },
    {
      title: "Short Measure",
      lines: {
        aim: "Pay {official}'s fine, or get {witness} to vouch for you, {due}.",
        intro: "{official}, who keeps order in the market, says {fault}.",
        threat: "If the fine isn't paid, {he} can take it from your goods.",
        partner: "Your {partnerKin} {partner} says {witness} could clear this up with a word.",
        "kin-partner": "Ask {witness}. People listen to {witness}.",
        "cast-official": "Keeps order in the market. Says {fault}.",
        "cast-witness": "Respected in the market, and has always found you honest.",
        charge: "{Fault}. The fine is {amount}, {due}.",
        remind: "People heard what {official} said. Some buyers are going elsewhere.",
        seize: "You didn't pay, so I'm taking it in goods.",
        cleared: "{witness} vouches for you, and {official} drops the fine.",
        paid: "You pay {official}, and that's the end of it.",
        seized: "{official} takes the value of the fine from your stock.",
        gone: "With {official} gone, nobody collects the fine.",
      },
    },
  ],
};
