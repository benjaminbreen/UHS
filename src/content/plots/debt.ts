import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { capabilitiesFor } from "../characters/resolve";
import { moneyFor } from "../economy/money";
import { goods } from "../economy/goods";
import type { Actor } from "../../core/types";
import type { PlotContext, PlotTemplate } from "./types";

const BRITAIN = [-8, 49.5, 2, 59] as const;
const MESOPOTAMIA = [38, 29, 50, 38] as const;
const LEVANT = [33.5, 29, 38.5, 37] as const;
const AEGEAN = [19.5, 34.8, 28.5, 41.5] as const;
const ITALY = [6.5, 36.5, 18.6, 47] as const;
const CHINA = [100, 20, 125, 42] as const;
/** Astronomical year for a BCE date. */
const B = (year: number) => 1 - year;

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
    const kinOf = (kind: string) => c.actors.filter((a) =>
      c.player.relations?.some((r) => r.kind === kind && r.other === a.id) && !a.dead);
    const child = kinOf("child").find((a) => (a.age ?? 0) >= 6 && (a.age ?? 0) < 16);
    const partner = kinOf("partner")[0];
    const coined = !!c.setting && capabilitiesFor(c.setting).has("coinage");
    const sex = sexOf(creditor);
    const childKin = child && (sexOf(child) === "female" ? "daughter" : sexOf(child) === "male" ? "son" : "child");
    // Why the household is in debt at all: the latest hardship, if it is recent.
    const year = c.setting?.year;
    const hard = year === undefined ? undefined : [...(c.household?.history ?? [])].reverse()
      .find((e) => ["bad-year", "fire", "robbed"].includes(e.kind) && year - e.year <= 2);
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
        good: goods.find((g) => g.id === good)?.noun ?? "food",
        due: hour < 11 ? "by sundown" : "by noon tomorrow",
        pledge: child ? `your ${childKin} ${child.name}` : "you",
        since,
        he: sex === "female" ? "she" : sex === "male" ? "he" : "they",
        He: sex === "female" ? "She" : sex === "male" ? "He" : "They",
        his: sex === "female" ? "her" : sex === "male" ? "his" : "their",
        wants: sex ? "wants" : "want",
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
        pledge: "If you cannot pay, {he} can take your {childKin} {child} into {his} house to work off the debt, for as long as three years.",
        threat: "If you cannot pay, {he} will go to the elders at the gate with the tablet.",
        partner: "Your {partnerKin} {partner} does not yet know how much the interest has come to.",
        "kin-partner": "{creditor} came to the door about the loan. How much is owed now, with the interest?",
        "cast-creditor": "Lent you the {good} at interest, and holds the tablet that records it.",
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
      // Nehemiah 5:1–5: families pledging sons and daughters for grain in a dearth.
      scope: { years: [B(1000), 136], bounds: LEVANT },
      title: "The Debt",
      lines: {
        aim: "Repay {creditor} for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} it repaid {due}.",
        pledge: "If you cannot pay, {he} can take your {childKin} {child} to work in {his} house until the debt is cleared.",
        threat: "If you cannot pay, {he} will take the matter to the elders at the gate.",
        partner: "Your {partnerKin} {partner} does not yet know how much is owed.",
        "kin-partner": "{creditor} was at the door about the {good}. How much do we owe now?",
        "cast-creditor": "Lent you the {good} when the harvest failed, and has not forgotten it.",
        dun: "You owe me {amount} for the {good}. Pay it {due}, or {pledge} will work it off in my house.",
        remind: "The day is going. Do not make me go to the elders.",
        seize: "I have taken what I could find in your store toward the debt. The rest is still owed.",
        paid: "The debt to {creditor} is paid, and your household owes nobody.",
        seized: "{creditor} has had the debt out of your store. It is settled, and the household will go short.",
        denounced: "{creditor} has gone to the elders at the gate. The custom allows {pledge} to be taken into that house to work off what is owed.",
        fled: "You have left {creditor} and the debt behind, and with them your place among your own people.",
      },
    },
    {
      // Solon's cancellation of 594 BCE ended debt slavery in Athens; creditors sued instead.
      scope: { years: [B(594), B(30)], bounds: AEGEAN },
      title: "The Debt",
      lines: {
        aim: "Pay {creditor} what you owe for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} the money {due}.",
        threat: "If you cannot pay, {he} will sue you before the magistrates.",
        partner: "Your {partnerKin} {partner} does not yet know how much it has come to.",
        "kin-partner": "{creditor} came by asking for you. What do we owe for the {good}?",
        "cast-creditor": "Let you have the {good} on credit, and means to be paid.",
        dun: "You owe me {amount} for the {good}. I want it {due}, or we go before the magistrates.",
        remind: "The day is going, and I have not forgotten you.",
        seize: "I have taken goods from your store against the debt. The rest is still owed.",
        paid: "The debt to {creditor} is paid, and nobody in the agora can say otherwise.",
        seized: "{creditor} has had the debt out of your store. It is settled, and the household will go short.",
        denounced: "{creditor} has brought suit against you. The court will have the debt out of your house, and the whole town will hear of it.",
        fled: "You have left {creditor} and the debt behind. A citizen who runs from a debt does not easily come home.",
      },
    },
    {
      // The lex Poetelia of 326 BCE abolished nexum; a creditor went to the praetor instead.
      scope: { years: [B(326), 285], bounds: ITALY },
      title: "The Debt",
      lines: {
        aim: "Pay {creditor} what you owe for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} paying {due}.",
        threat: "If you cannot pay, {he} will take you before the praetor, and the law is on {his} side.",
        partner: "Your {partnerKin} {partner} does not yet know how much it has come to.",
        "kin-partner": "{creditor} was here asking for you. What do we owe?",
        "cast-creditor": "Sold you the {good} on credit, and keeps the account.",
        dun: "You owe me {amount} for the {good}. Pay it {due}, or we go before the praetor.",
        remind: "I said {due}. I have it written down.",
        seize: "I have taken what I could from your store toward the debt. The rest is still owed.",
        paid: "The debt to {creditor} is paid, and the account is closed.",
        seized: "{creditor} has had the debt out of your store. It is settled, and the household will go short.",
        denounced: "{creditor} has gone to the praetor. The court can sell what you own to pay what you owe.",
        fled: "You have left {creditor} and the debt behind. The account is still in {his} book.",
      },
    },
    {
      // Loans were written contracts; in hard years children were pawned or sold into service against them.
      scope: { years: [B(221), 1912], bounds: CHINA },
      title: "The Debt",
      lines: {
        aim: "Repay {creditor} for the {good}, {due}.",
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}, against a written contract. {He} {wants} it repaid {due}.",
        pledge: "If you cannot pay, {he} has said {he} will take your {childKin} {child} into service against it.",
        threat: "If you cannot pay, {he} will take the contract to the magistrate.",
        partner: "Your {partnerKin} {partner} does not yet know how much is owed.",
        "kin-partner": "{creditor} came asking after you. How much do we owe for the {good}?",
        "cast-creditor": "Lent you the {good} against a written contract, and holds it.",
        dun: "You owe me {amount} for the {good}. It is written in the contract, and I want it {due}.",
        remind: "The day is going. I still have the contract.",
        seize: "I have taken goods from your store against the contract. The rest is still owed.",
        paid: "The debt to {creditor} is paid, and the contract can be burned.",
        seized: "{creditor} has had the debt out of your store. It is settled, and the household will go short.",
        denounced: "{creditor} has gone to the magistrate with the contract. The yamen runners will come for what is owed.",
        fled: "You have left {creditor} and the contract behind. Your name is still written on it.",
      },
    },
    {
      scope: { years: [1066, 1500], bounds: BRITAIN },
      title: "The Debt",
      lines: {
        aim: "Settle what you owe {creditor} for the {good}, {due}.",
        intro: "{since}, your household has had {good} on trust from {creditor} the {creditorRole}. {He} {wants} paying {due}.",
        threat: "If you cannot pay, {he} will plead the debt at the manor court.",
        partner: "Your {partnerKin} {partner} does not yet know how much it has come to.",
        "kin-partner": "{creditor} was asking after you in the lane. What do we owe for the {good}?",
        "cast-creditor": "Let you have the {good} on trust, and will plead it at the manor court if need be.",
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
        intro: "{since}, your household has run up a slate for {good} with {creditor} the {creditorRole}. {He} {wants} it settled {due}.",
        threat: "If you cannot pay, {he} will send for a bailiff, and debtors go to the Fleet.",
        partner: "Your {partnerKin} {partner} does not yet know how much is on the slate.",
        "kin-partner": "{creditor} came by asking for you. How much is on that slate?",
        "cast-creditor": "Has your name on the slate for the {good}.",
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
        intro: "{since}, your household has had {good} on credit from {creditor} the {creditorRole}. {He} {wants} paying {due}.",
        threat: "If you cannot pay, {he} will go to those who keep order here, and everyone will know.",
        partner: "Your {partnerKin} {partner} does not yet know how much it has come to.",
        "kin-partner": "{creditor} came asking for you. How much do we owe?",
        "cast-creditor": "Let you have the {good} on trust, and wants paying.",
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
