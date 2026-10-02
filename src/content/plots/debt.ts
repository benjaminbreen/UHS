import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { capabilitiesFor } from "../characters/resolve";
import { moneyFor } from "../economy/money";
import { goods } from "../economy/goods";
import type { Actor } from "../../core/types";
import type { PlotContext, PlotTemplate } from "./types";

const BRITAIN = [-8, 49.5, 2, 59] as const;
const MESOPOTAMIA = [38, 29, 50, 38] as const;

function creditorOf(c: PlotContext): Actor | undefined {
  const h = c.household;
  if (!h) return;
  const byId = new Map(c.households.map((o) => [o.id, o]));
  const from = h.owes
    ? byId.get(h.owes)
    : (h.fortune ?? 1) < 0.4
      ? (h.buys ?? [])
          .map((b) => byId.get(b.from))
          .filter((o) => o && (o.fortune ?? 0) > (h.fortune ?? 0) + 0.2)
          .sort((a, b) => (b!.fortune ?? 0) - (a!.fortune ?? 0))[0]
      : undefined;
  return from && c.actors
    .filter((a) => a.kind === "human" && from.members.includes(a.id) && (a.age ?? 30) >= 18)
    .sort((a, b) => (b.age ?? 30) - (a.age ?? 30))[0];
}

export const debt: PlotTemplate = {
  id: "debt",
  // Slate, chalk and a joiner's frame: the tally of a debt as it was kept on a wall.
  look: {
    emblem: "slate",
    palette: { ink: "#141a1c", fill: "#1f2a29", edge: "#5a3d26", light: "#e9e5d6", accent: "#b8483a" },
  },
  weight: (c) => (creditorOf(c) ? (c.household?.owes ? 2 : 1) : 0),
  cast: (c) => {
    const creditor = creditorOf(c);
    return creditor && { creditor };
  },
  begin: (c, cast) => {
    const creditor = cast.creditor!;
    const owed = 4 + Math.floor(random(c.seed, "plot", "debt", "owed") * 5);
    const hour = Math.floor(c.clock / 3600) % 24;
    const midnight = Math.floor(c.clock / 86400) * 86400;
    const deadline = hour < 11 ? midnight + 18 * 3600 : midnight + 36 * 3600;
    const good = c.household?.buys?.find((b) => b.from === creditor.householdId)?.good;
    const child = c.actors.find((a) =>
      c.player.relations?.some((r) => r.kind === "child" && r.other === a.id) && (a.age ?? 0) >= 6);
    const coined = !!c.setting && capabilitiesFor(c.setting).has("coinage");
    return {
      deadline,
      owed,
      words: {
        creditor: creditor.name,
        amount: coined && c.setting ? `${owed} ${moneyFor(c.setting).unit}` : "a good deal",
        good: goods.find((g) => g.id === good)?.noun ?? "goods you had on trust",
        due: hour < 11 ? "by sundown" : "by noon tomorrow",
        pledge: child ? `your ${sexOf(child) === "female" ? "daughter" : sexOf(child) === "male" ? "son" : "child"} ${child.name}` : "you",
      },
    };
  },
  opening: [
    { type: "title", line: "opening" },
    { type: "approach", role: "creditor", line: "dun" },
  ],
  developments: [
    {
      id: "remind",
      when: { type: "all", of: [{ type: "due", hours: -3 }, { type: "not", of: { type: "settled" } }] },
      then: [{ type: "approach", role: "creditor", line: "remind" }],
    },
    {
      id: "seize",
      when: { type: "all", of: [{ type: "due" }, { type: "not", of: { type: "settled" } }] },
      then: [
        { type: "seize", role: "creditor" },
        { type: "regard", role: "creditor", delta: -2 },
        { type: "approach", role: "creditor", line: "seize" },
        { type: "extend", hours: 6 },
      ],
    },
    {
      id: "final",
      when: {
        type: "all",
        of: [{ type: "fired", id: "seize" }, { type: "due" }, { type: "not", of: { type: "settled" } }],
      },
      then: [{ type: "walk-off", role: "creditor", to: "authority" }],
    },
  ],
  endings: [
    { id: "fled", when: { type: "gone", role: "creditor" } },
    { id: "paid", when: { type: "all", of: [{ type: "settled" }, { type: "not", of: { type: "seized" } }] } },
    { id: "seized", when: { type: "settled" } },
    { id: "denounced", when: { type: "fired", id: "final" } },
  ],
  wording: [
    {
      // Old Babylonian loans of barley and silver; Hammurabi §117 caps debt service of a wife or child at three years.
      scope: { years: [-2400, -500], bounds: MESOPOTAMIA },
      title: "The Debt",
      lines: {
        aim: "Repay {creditor} the loan of {good}, with its interest, {due}.",
        "kin-partner": "{creditor} came to the door about the loan. How much is owed now, with the interest?",
        "cast-creditor": "Lent you the {good} at interest, and holds the tablet that records it.",
        opening: "You took {good} from {creditor} on loan, and the interest has grown. Now the loan is called in.",
        dun: "You owe me {amount} for the {good}, with its interest. Pay it {due}, or {pledge} will work it off in my house.",
        remind: "The day is going. I have witnesses to the loan, and I have not forgotten it.",
        seize: "I have taken what I could find in your store toward the loan. The rest is still owed, and the tablet is still in my house.",
        paid: "The debt to {creditor} is paid, the tablet can be broken, and your household is its own again.",
        seized: "{creditor} has had the debt out of your store. It is settled, and the household will go short.",
        denounced: "{creditor} has gone to the elders at the gate. By the law, {pledge} may be taken into that house to work off the debt, for as long as three years.",
        fled: "You have left {creditor} and the loan behind. The tablet with your name on it is still in that house.",
      },
    },
    {
      scope: { years: [1066, 1500], bounds: BRITAIN },
      title: "The Debt",
      lines: {
        aim: "Settle what you owe {creditor} for the {good}, {due}.",
        "kin-partner": "{creditor} was asking after you in the lane. What do we owe for the {good}?",
        "cast-creditor": "Let you have the {good} on trust, and will plead it at the manor court if need be.",
        opening: "You had {good} of {creditor} on trust, and the trust has run out.",
        dun: "You owe me {amount} for the {good}. I want it {due}, or I plead it at the manor court.",
        remind: "I have not forgotten you. I want it {due}, mind.",
        seize: "I have distrained goods from your store toward what you owe. Pay the rest, or we meet at the manor court.",
        paid: "The debt to {creditor} is paid. Nobody need hear of it at the court.",
        seized: "{creditor} has had the debt out of your store. It is settled, and the household will go short.",
        denounced: "{creditor} has gone to plead the debt. At the next court you will be made to pay, and amerced besides.",
        fled: "You have left {creditor} and the debt behind, and with it your place in the manor.",
      },
    },
    {
      scope: { years: [1650, 1840], bounds: BRITAIN },
      title: "The Debt",
      lines: {
        aim: "Settle what you owe {creditor} for the {good}, {due}.",
        "kin-partner": "{creditor} came by asking for you. How much is on that slate?",
        "cast-creditor": "Has your name on the slate for the {good}.",
        opening: "Your name is on {creditor}'s slate for the {good}, and the slate is full.",
        dun: "You owe me {amount} for the {good}, and I'll have it {due}. I'll not be put off with promises.",
        remind: "Still nothing? I said {due}, and I meant it.",
        seize: "I've had goods out of your store against the debt. Pay the rest, or next time I come with a bailiff.",
        paid: "The debt to {creditor} is paid and the slate wiped. You can walk past the shop again.",
        seized: "{creditor} has had the debt out of your store. It is settled, and the household will go short.",
        denounced: "{creditor} has gone for a bailiff. A debtor taken on a writ can lie in the Fleet or the Marshalsea until the sum is paid.",
        fled: "You have left {creditor} and the slate behind. In a city this size a name can be lost, for a while.",
      },
    },
    {
      title: "The Debt",
      lines: {
        aim: "Settle what you owe {creditor} for the {good}, {due}.",
        "kin-partner": "{creditor} came asking for you. How much do we owe?",
        "cast-creditor": "Let you have the {good} on trust, and wants paying.",
        opening: "You owe {creditor} for the {good}, and the waiting is over.",
        dun: "You owe me {amount} for the {good}. I want it {due}.",
        remind: "I have not forgotten. I want it {due}.",
        seize: "I have taken what I could find in your store. Pay me the rest, or I go to those who keep order here.",
        paid: "The debt to {creditor} is paid. For now, the house is your own.",
        seized: "{creditor} has had the debt out of your store. It is settled, and the household will go short.",
        denounced: "{creditor} has gone to complain of you to those who keep order here. The debt stands, and now everyone will know it.",
        fled: "You have left {creditor} and the debt behind. It will not follow you, but your name stays where it was owed.",
      },
    },
  ],
};
