import { CARDS, railBoss, type CardChoice, type ChoiceCard } from "../content/cards";
import { matchesCharacterScope } from "../content/characters/resolve";
import type { WorldSetting } from "../content/geography/types";
import { random } from "./random";
import type { Stats } from "./types";
import type { Weather } from "./weather";

const within = (b: readonly number[], s: WorldSetting) => s.lon >= b[0] && s.lat >= b[1] && s.lon <= b[2] && s.lat <= b[3];

/** The card a recipe step draws today: one that fits the place and the
 * weather and can be shown here, not yet seen in this life if any is left,
 * the same one for the same seed and day. */
export function pickCard(slot: string, setting: WorldSetting | undefined, weather: Weather, seed: string, day: number,
  usable: (c: ChoiceCard) => boolean, seen: ReadonlySet<string>): ChoiceCard | undefined {
  const sky = weather.condition === "rain" || weather.condition === "snow" ? "wet" : weather.tempC >= 24 ? "hot" : weather.tempC <= 5 ? "cold" : undefined;
  let fits = CARDS.filter((c) => c.slot === slot && (!c.when || c.when === sky) &&
    (!c.scope || (setting && matchesCharacterScope(c.scope, setting, "*"))) && usable(c));
  // A card written for this place or this weather outranks one for any day anywhere.
  if (fits.some((c) => c.scope)) fits = fits.filter((c) => c.scope);
  if (fits.some((c) => c.when)) fits = fits.filter((c) => c.when);
  // On the water the general day's cards give way to the fishing ones and the trade's own dangers.
  if (fits.some((c) => c.fishing)) fits = fits.filter((c) => c.fishing || c.work);
  if (fits.some((c) => !seen.has(c.id))) fits = fits.filter((c) => !seen.has(c.id));
  return fits.length ? fits[Math.floor(random(seed, "card", slot, day) * fits.length)] : undefined;
}

export const bossTitle = (setting?: WorldSetting) =>
  (setting && railBoss.find((b) => within(b.bounds, setting))?.title) ?? "foreman";

/** Fills `{boss}`, `{name}`, `{work}`, `{good}`, `{crop}`; a capital asks for one. */
export const cardText = (text: string, words: Record<string, string | undefined>) =>
  text.replace(/\{(\w+)\}/g, (slot, key: string) => {
    const word = words[key.toLowerCase()];
    if (word === undefined) return slot;
    return key[0] === key[0].toUpperCase() ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  });

/** Stats run from about 10 to 90 around 45; each skill level is worth a little. */
export function oddsOf(check: NonNullable<CardChoice["check"]>, stats: Stats, level: number) {
  return Math.min(0.95, Math.max(0.05, check.odds + (stats[check.stat] - 45) / 150 + level * 0.03));
}

export const oddsWord = (p: number) =>
  p < 0.25 ? "a long shot" : p < 0.5 ? "risky" : p < 0.8 ? "likely" : "all but certain";
