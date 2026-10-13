import { random } from "../../core/random";
import { sexOf } from "../../core/brief";
import { capabilitiesFor } from "../characters/resolve";
import { moneyFor } from "../economy/money";
import type { Actor } from "../../core/types";
import type { PlotContext } from "./types";

/** Astronomical year for a BCE date. */
export const B = (year: number) => 1 - year;

/** Living adults outside the player's household, oldest first. */
export const neighbours = (c: PlotContext) => c.actors
  .filter((a) => a.kind === "human" && !a.dead && a.id !== c.player.id && a.householdId !== c.player.householdId && (a.age ?? 30) >= 18)
  .sort((a, b) => (b.age ?? 30) - (a.age ?? 30));

/** The head of the richest other household: the one others answer to. */
export function notable(c: PlotContext): Actor | undefined {
  const rich = c.households.filter((h) => h.id !== c.player.householdId).sort((a, b) => (b.fortune ?? 0) - (a.fortune ?? 0))[0];
  return rich && neighbours(c).find((a) => rich.members.includes(a.id));
}

export const pickOf = <T,>(c: PlotContext, xs: readonly T[], key: string) =>
  xs[Math.floor(random(c.seed, "plot", key) * xs.length)];

/** Livelihoods that live off land someone else may hold. */
export const working = (c: PlotContext) =>
  /farm|grow|cultivat|herd|shepherd|peasant|tenant|plough|irrigation|garden|vine|orchard|rice|tiller/.test(c.player.origin?.livelihood ?? "");

export const EGYPT = [24, 22, 35, 32] as const;
export const MESOPOTAMIA = [38, 29, 50, 38] as const;
export const ITALY = [6.5, 36.5, 18.6, 47] as const;
export const CHINA = [100, 20, 125, 42] as const;
export const BRITAIN = [-8, 49.5, 2, 59] as const;
export const EUROPE = [-10, 36, 30, 60] as const;

/** Sundown today if it is still morning, else noon tomorrow. */
export function dueOf(clock: number) {
  const hour = Math.floor(clock / 3600) % 24;
  const midnight = Math.floor(clock / 86400) * 86400;
  return hour < 11
    ? { deadline: midnight + 18 * 3600, due: "by sundown" }
    : { deadline: midnight + 36 * 3600, due: "by noon tomorrow" };
}

/** Pronouns for the plot's central figure. */
export function pronounWords(a: Actor) {
  const sex = sexOf(a);
  return {
    he: sex === "female" ? "she" : sex === "male" ? "he" : "they",
    He: sex === "female" ? "She" : sex === "male" ? "He" : "They",
    his: sex === "female" ? "her" : sex === "male" ? "his" : "their",
    him: sex === "female" ? "her" : sex === "male" ? "him" : "them",
    wants: sex ? "wants" : "want",
    is: sex ? "is" : "are",
  };
}

/** A sum in this place's money, or in food where there is none. */
export function amountOf(c: PlotContext, owed: number) {
  const coined = !!c.setting && capabilitiesFor(c.setting).has("coinage");
  return coined && c.setting ? `${owed} ${moneyFor(c.setting).unit}` : `${owed} measures of food`;
}

export function partnerWords(c: PlotContext) {
  const partner = c.actors.find((a) => !a.dead && c.player.relations?.some((r) => r.kind === "partner" && r.other === a.id));
  if (!partner) return {};
  const sex = sexOf(partner);
  return {
    words: { partner: partner.name, partnerKin: sex === "female" ? "wife" : sex === "male" ? "husband" : "partner" },
    refs: { partner: partner.id },
  };
}
