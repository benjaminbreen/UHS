import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { capabilitiesFor } from "../characters/resolve";
import { moneyFor } from "../economy/money";
import { goodName, sellerOf } from "../economy/products";
import type { Actor, HouseholdPurchase } from "../../core/types";
import type { PlotContext, PlotTemplate } from "./types";

const BRITAIN = [-8, 49.5, 2, 59] as const;
const MESOPOTAMIA = [38, 29, 50, 38] as const;
const LEVANT = [33.5, 29, 38.5, 37] as const;
const AEGEAN = [19.5, 34.8, 28.5, 41.5] as const;
const ITALY = [6.5, 36.5, 18.6, 47] as const;
const CHINA = [100, 20, 125, 42] as const;
/** Astronomical year for a BCE date. */
const B = (year: number) => 1 - year;

function purchaseOf(c: PlotContext): HouseholdPurchase | undefined {
  const h = c.household;
  if (!h) return;
  const eligible = (b: HouseholdPurchase) => {
    const supplier = c.households.find((s) => s.id === b.from);
    return supplier && supplier.id !== h.id &&
      (supplier.fortune ?? 0) > (h.fortune ?? 0) + 0.2 &&
      sellerOf(b, c.households, c.actors);
  };
  if (h.credit) return h.credit.from !== h.id && sellerOf(h.credit, c.households, c.actors) ? h.credit : undefined;
  if (!h.owes && (h.fortune ?? 1) >= 0.4) return;
  return (h.buys ?? []).filter((b) => (!h.owes || b.from === h.owes) && eligible(b))
    .sort((a, b) => (["bread", "grain", "milk", "oil"].includes(b.good) ? 3 : b.good === "drink" ? 0 : 1) -
      (["bread", "grain", "milk", "oil"].includes(a.good) ? 3 : a.good === "drink" ? 0 : 1) ||
      random(c.seed, h.id, "debt-purchase", a.good, a.from) - random(c.seed, h.id, "debt-purchase", b.good, b.from))[0];
}

function creditorOf(c: PlotContext): Actor | undefined {
  if (c.setting?.economyRevision) {
    const buy = purchaseOf(c);
    return buy && sellerOf(buy, c.households, c.actors);
  }
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
    .filter((a) => a.kind === "human" && !a.dead && from.members.includes(a.id) && (a.age ?? 30) >= 18)
    .sort((a, b) => (b.age ?? 30) - (a.age ?? 30))[0];
}

export const debt: PlotTemplate = {
  id: "debt",
  // Slate, chalk and a joiner's frame: the tally of a debt as it was kept on a wall.
  look: {
    emblem: "slate",
    palette: { ink: "#141a1c", fill: "#1f2a29", edge: "#5a3d26", light: "#e9e5d6", accent: "#b8483a" },
  },
  weight: (c) => (creditorOf(c) ? (c.household?.owes ? 1.2 : 0.7) : 0),
  cast: (c) => {
    const creditor = creditorOf(c);
    return creditor && { creditor };
  },
  begin: (c, cast) => {
    const creditor = cast.creditor!;
    const purchase = c.setting?.economyRevision ? purchaseOf(c) : undefined;
    const owed = c.household?.credit?.amount ?? 4 + Math.floor(random(c.seed, "plot", "debt", "owed") * 5);
    const hour = Math.floor(c.clock / 3600) % 24;
    const midnight = Math.floor(c.clock / 86400) * 86400;
    const deadline = hour < 11 ? midnight + 18 * 3600 : midnight + 36 * 3600;
    const buy = purchase ?? c.household?.buys?.find((b) => b.from === creditor.householdId);
    const kinOf = (kind: string) => c.actors.filter((a) =>
      c.player.relations?.some((r) => r.kind === kind && r.other === a.id) && !a.dead);
    const child = kinOf("child").find((a) => (a.age ?? 0) >= 6 && (a.age ?? 0) < 16);
    const partner = kinOf("partner")[0];
    const coined = c.household?.credit
      ? c.household.credit.repayment === "money"
      : !!c.setting && capabilitiesFor(c.setting).has("coinage");
    const sex = sexOf(creditor);
    const childKin = child && (sexOf(child) === "female" ? "daughter" : sexOf(child) === "male" ? "son" : "child");
    // Why the household is in debt at all: the latest hardship, if it is recent.
    const year = c.setting?.year;
    const hard = year === undefined || c.household?.credit?.reason === "household" ? undefined : [...(c.household?.history ?? [])].reverse()
      .find((e) => ["bad-year", "fire", "robbed"].includes(e.kind) && year - e.year <= 2);
    if (purchase && c.household && !c.household.credit) {
      c.household.credit = {
        ...purchase, seller: creditor.id, debtor: c.player.id, amount: owed,
        reason: hard ? "hardship" : "household", repayment: coined ? "money" : "produce",
      };
      c.household.owes = purchase.from;
    }
    const since = !hard || year === undefined ? "For months"
      : hard.kind === "bad-year" ? `Since ${year - hard.year === 0 ? "this" : "last"} year's bad harvest`
      : hard.kind === "fire" ? "Since the fire" : "Since the robbery";
    return {
      deadline,
      owed,
      words: {
        creditor: creditor.name,
        creditorRole: creditor.role.toLowerCase(),
        amount: coined && c.setting ? `${owed} ${moneyFor(c.setting).unit}` : "a good deal",
        good: buy ? goodName(buy.good, buy.product) : "food",
        due: hour < 11 ? "by sundown" : "by noon tomorrow",
        pledge: child ? `your ${childKin} ${child.name}` : "you",
        since,
        he: sex === "female" ? "she" : sex === "male" ? "he" : "they",
        He: sex === "female" ? "She" : sex === "male" ? "He" : "They",
        his: sex === "female" ? "her" : sex === "male" ? "his" : "their",
        wants: sex ? "wants" : "want",
        owing: coined ? "the money back" : "it made good",
        ...(child && { child: child.name, childKin }),
        ...(partner && {
          partner: partner.name,
          partnerKin: sexOf(partner) === "female" ? "wife" : sexOf(partner) === "male" ? "husband" : "partner",
        }),
      },
      refs: {
        creditor: creditor.id,
        ...(child && { child: child.id }),
        ...(partner && { partner: partner.id }),
      },
    };
  },
  opening: [{ type: "approach", role: "creditor", line: "dun" }],
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
  // `intro` opens the plot's paragraph; then `pledge` where a child can be
  // taken for the debt, else `threat`; then `partner` when there is no pledge.
  wording: [
    {
      // Old Babylonian loans of barley and silver; Hammurabi §117 caps debt service of a wife or child at three years.
      scope: { years: [-2400, -500], bounds: MESOPOTAMIA },
      title: "The Debt",
      lines: {
        aim: "Repay {creditor} the loan of {good}, with its interest, {due}.",
        intro: "{since}, your household has had {good} from {creditor} the {creditorRole}, on credit and at interest. {He} {wants} it repaid {due}.",
        pledge: "If you can't pay, {he} can take your {childKin} {child} into {his} house to work off the debt, for up to three years.",
        threat: "If you can't pay, {he} will go to the elders at the gate with the tablet.",
        partner: "Your {partnerKin} {partner} doesn't know yet how much the interest has come to.",
        "kin-partner": "{creditor} came to the door about the loan. How much is owed now, with the interest?",
        "cast-creditor": "Lent you the {good} at interest, and holds the tablet that records it.",
        dun: "You owe me {amount} for the {good}, with its interest. Pay it {due}, or {pledge} will work it off in my house.",
        remind: "It's getting late. There were witnesses to the loan, and I haven't forgotten it.",
        seize: "I've taken what I could find in your store toward the loan. You still owe the rest, and I still have the tablet.",
        paid: "The debt to {creditor} is paid, and the tablet recording it is broken. Your household owes nothing.",
        seized: "{creditor} has taken what you owed from your store. The debt is settled, but the household will go short.",
        denounced: "{creditor} has gone to the elders at the gate. Under the law, {pledge} can be taken into that house to work off the debt for up to three years.",
        fled: "You've left {creditor} and the loan behind, but the tablet with your name on it is still in that house.",
      },
    },
    {
      // Nehemiah 5:1–5: families pledging sons and daughters for grain in a dearth.
      scope: { years: [B(1000), 136], bounds: LEVANT },
      title: "The Debt",
      lines: {
        aim: "Repay {creditor} for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} it repaid {due}.",
        pledge: "If you can't pay, {he} can take your {childKin} {child} to work in {his} house until the debt is cleared.",
        threat: "If you can't pay, {he} will take the matter to the elders at the gate.",
        partner: "Your {partnerKin} {partner} doesn't know yet how much is owed.",
        "kin-partner": "{creditor} was at the door about the {good}. How much do we owe now?",
        "cast-creditor": "Lent you the {good} when the harvest failed.",
        dun: "You owe me {amount} for the {good}. Pay it {due}, or {pledge} will work it off in my house.",
        remind: "It's getting late. Don't make me go to the elders.",
        seize: "I've taken what I could find in your store toward the debt. You still owe the rest.",
        paid: "The debt to {creditor} is paid, and your household owes nobody.",
        seized: "{creditor} has taken what you owed from your store. The debt is settled, but the household will go short.",
        denounced: "{creditor} has gone to the elders at the gate. By custom, {pledge} can be taken into that house to work off the debt.",
        fled: "You've left {creditor} and the debt behind, and with them your place in the community.",
      },
    },
    {
      // Solon's cancellation of 594 BCE ended debt slavery in Athens; creditors sued instead.
      scope: { years: [B(594), B(30)], bounds: AEGEAN },
      title: "The Debt",
      lines: {
        aim: "Pay {creditor} what you owe for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} {owing} {due}.",
        threat: "If you can't pay, {he} will sue you in front of the magistrates.",
        partner: "Your {partnerKin} {partner} doesn't know yet how much it has come to.",
        "kin-partner": "{creditor} came by asking for you. What do we owe for the {good}?",
        "cast-creditor": "Sold you the {good} on credit, and wants to be paid.",
        dun: "You owe me {amount} for the {good}. I want it {due}, or we go before the magistrates.",
        remind: "It's getting late. I haven't forgotten.",
        seize: "I've taken goods from your store toward the debt. You still owe the rest.",
        paid: "The debt to {creditor} is paid, and everyone in the market knows it.",
        seized: "{creditor} has taken what you owed from your store. The debt is settled, but the household will go short.",
        denounced: "{creditor} has brought suit against you. The court can take what you owe from your house, and the whole town will hear about it.",
        fled: "You have left {creditor} and the debt behind. It won't be easy to come home.",
      },
    },
    {
      // The lex Poetelia of 326 BCE abolished nexum; a creditor went to the praetor instead.
      scope: { years: [B(326), 285], bounds: ITALY },
      title: "The Debt",
      lines: {
        aim: "Pay {creditor} what you owe for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} {owing} {due}.",
        threat: "If you can't pay, {he} will take you to the praetor, and the law is on {his} side.",
        partner: "Your {partnerKin} {partner} doesn't know yet how much it has come to.",
        "kin-partner": "{creditor} was here asking for you. What do we owe?",
        "cast-creditor": "Sold you the {good} on credit, and keeps the account.",
        dun: "You owe me {amount} for the {good}. Pay it {due}, or we go before the praetor.",
        remind: "I said {due}, and I've written it down.",
        seize: "I've taken what I could from your store toward the debt. You still owe the rest.",
        paid: "The debt to {creditor} is paid, and the account is closed.",
        seized: "{creditor} has taken what you owed from your store. The debt is settled, but the household will go short.",
        denounced: "{creditor} has gone to the praetor. The court can sell what you own to pay what you owe.",
        fled: "You've left {creditor} and the debt behind, but it's still written in {his} accounts.",
      },
    },
    {
      // Loans were written contracts; in hard years children were pawned or sold into service against them.
      scope: { years: [B(221), 1912], bounds: CHINA },
      title: "The Debt",
      lines: {
        aim: "Repay {creditor} for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}, against a written contract. {He} {wants} it repaid {due}.",
        pledge: "If you can't pay, {he} has said {he} will take your {childKin} {child} into service against it.",
        threat: "If you can't pay, {he} will take the contract to the magistrate.",
        partner: "Your {partnerKin} {partner} doesn't know yet how much is owed.",
        "kin-partner": "{creditor} came asking about you. How much do we owe for the {good}?",
        "cast-creditor": "Lent you the {good} against a written contract, and holds it.",
        dun: "You owe me {amount} for the {good}. It is written in the contract, and I want it {due}.",
        remind: "It's getting late. I still have the contract.",
        seize: "I've taken goods from your store toward the debt. You still owe the rest.",
        paid: "The debt to {creditor} is paid, and the contract is burned.",
        seized: "{creditor} has taken what you owed from your store. The debt is settled, but the household will go short.",
        denounced: "{creditor} has gone to the magistrate with the contract. The magistrate's men will come to collect.",
        fled: "You've left {creditor} and the debt behind, but your name is still on the contract.",
      },
    },
    {
      scope: { years: [1066, 1500], bounds: BRITAIN },
      title: "The Debt",
      lines: {
        aim: "Settle what you owe {creditor} for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} {owing} {due}.",
        threat: "If you can't pay, {he} will take you to the manor court.",
        partner: "Your {partnerKin} {partner} doesn't know yet how much it has come to.",
        "kin-partner": "{creditor} was asking about you. What do we owe for the {good}?",
        "cast-creditor": "Sold you the {good} on credit, and will take you to the manor court if necessary.",
        dun: "You owe me {amount} for the {good}. I want it {due}, or I'll take you to the manor court.",
        remind: "I haven't forgotten. I want it {due}.",
        seize: "I've taken goods from your store toward what you owe. Pay the rest, or I'll see you at the manor court.",
        paid: "The debt to {creditor} is paid. It won't go to court.",
        seized: "{creditor} has taken what you owed from your store. The debt is settled, but the household will go short.",
        denounced: "{creditor} has taken the debt to the manor court. You'll be made to pay, and fined on top of it.",
        fled: "You have left {creditor} and the debt behind, and with it your place on the manor.",
      },
    },
    {
      scope: { years: [1650, 1840], bounds: BRITAIN },
      title: "The Debt",
      lines: {
        aim: "Settle what you owe {creditor} for the {good}, {due}.",
        intro: "{since}, your household has run up a slate for {good} with {creditor} the {creditorRole}. {He} {wants} it settled {due}.",
        threat: "If you can't pay, {he} will send for a bailiff, and debtors go to prison.",
        partner: "Your {partnerKin} {partner} doesn't know yet how much is on the slate.",
        "kin-partner": "{creditor} came by asking for you. How much is on that slate?",
        "cast-creditor": "Has your name on the slate for the {good}.",
        dun: "You owe me {amount} for the {good}, and I'll have it {due}. I don't want any more promises.",
        remind: "Still nothing? I said {due}, and I meant it.",
        seize: "I've taken goods from your store toward the debt. Pay the rest, or next time I'll bring a bailiff.",
        paid: "The debt to {creditor} is paid and the slate wiped clean. You can walk past the shop again.",
        seized: "{creditor} has taken what you owed from your store. The debt is settled, but the household will go short.",
        denounced: "{creditor} has gone for a bailiff. Debtors can be held in the Fleet or the Marshalsea prisons until they pay.",
        fled: "You have left {creditor} and the slate behind. In a city this size, you can disappear for a while.",
      },
    },
    {
      title: "The Debt",
      lines: {
        aim: "Settle what you owe {creditor} for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} {owing} {due}.",
        threat: "If you can't pay, {he} will report you, and everyone will know.",
        partner: "Your {partnerKin} {partner} doesn't know yet how much it has come to.",
        "kin-partner": "{creditor} came asking for you. How much do we owe?",
        "cast-creditor": "Let you have the {good} on credit, and wants {owing}.",
        dun: "You owe me {amount} for the {good}. I want it {due}.",
        remind: "I haven't forgotten. I want it {due}.",
        seize: "I have taken what I could find in your store. Pay me the rest, or I'll report you.",
        paid: "The debt to {creditor} is paid. Your household owes nothing now.",
        seized: "{creditor} has taken what you owed from your store. The debt is settled, but the household will go short.",
        denounced: "{creditor} has gone to report you. You still owe the debt, and now everyone knows.",
        fled: "You've left {creditor} behind, but the debt and your bad name stay there.",
      },
    },
  ],
};
