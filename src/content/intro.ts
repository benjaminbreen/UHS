import type { WeatherCondition } from "../core/weather";
import type { Stats } from "../core/types";

/** The words of the opening paragraph that are not a plot's own. Plain on
 * purpose: a reader meeting a life for the first time wants it told straight. */

export type Sky = {
  /** "spring", or "" where the year has no such seasons. */
  season: string;
  part: "morning" | "afternoon" | "evening" | "night";
  cold: boolean;
  hot: boolean;
  monsoon: boolean;
};

const s = (season: string, noun: string) => (season ? `${season} ${noun}` : noun);

/** The tail of the first sentence: "…, under a clear spring sky." */
export const WEATHER: Record<WeatherCondition, (k: Sky) => string[]> = {
  clear: (k) =>
    k.part === "night" ? [`under a clear ${s(k.season, "night")} sky`]
      : k.hot ? [`in the ${s(k.season, "heat")}`]
      : k.cold ? [`on a cold, clear ${s(k.season, k.part)}`]
      : [`under a clear ${s(k.season, "sky")}`, `on a bright ${s(k.season, k.part)}`],
  "light-clouds": (k) =>
    k.hot ? [`in the ${s(k.season, "heat")}`]
      : [`on a ${k.cold ? "cool" : "mild"} ${s(k.season, k.part)}`],
  overcast: (k) => [`under a grey ${s(k.season, "sky")}`, `on a dull ${s(k.season, k.part)}`],
  rain: (k) =>
    k.monsoon ? ["in the monsoon rain"]
      : k.cold ? [`in a cold ${s(k.season, "rain")}`]
      : [`in the ${s(k.season, "rain")}`, "with the rain coming down"],
  snow: () => ["with snow falling", "in the falling snow"],
  mist: (k) => [`in the ${s(k.season, "mist")}`, "with mist lying low on the ground"],
};

/** What to call the place, from the setting's form and size. */
export function settlementNoun(form: string, population: number | undefined, hilly: boolean) {
  const noun =
    form === "city" ? ((population ?? 20000) >= 20000 ? "city" : "town")
      : form === "port" ? ((population ?? 20000) >= 20000 ? "port" : "harbour town")
      : form === "farm" ? "farmstead"
      : form === "camp" ? "camp"
      : (population ?? 300) < 120 ? "hamlet" : "village";
  return hilly && (noun === "village" || noun === "town" || noun === "hamlet") ? `hill ${noun}` : noun;
}

/** A hardship in the household's recent history, for a life with no plot.
 * `when` is "this year", "last year" or "two years ago". */
export const HARDSHIP: Record<"bad-year" | "fire" | "robbed", (when: string) => string> = {
  "bad-year": (when) =>
    when === "this year" ? "It has been a bad year, and the store is lower than it should be."
      : `${when === "last year" ? "Last year" : "The year before last"} was a bad one, and the household has not made it up yet.`,
  fire: (when) => `The house burned ${when}, and is not yet what it was.`,
  robbed: (when) => `The house was robbed ${when}, and nobody has answered for it.`,
};

/** One sentence for a body or temperament far out at either end; `{here}`
 * is the settlement. A missing entry means that end goes unremarked. */
export const UNCOMMON_STAT: Partial<Record<`${keyof Stats}:${"high" | "low"}`, string>> = {
  "strength:high": "Nobody in {here} is stronger than you, and everyone knows it.",
  "strength:low": "You have never been strong, and have learned to manage without it.",
  "agility:high": "You are quicker on your feet than anyone in {here}.",
  "agility:low": "You are clumsy, and the household keeps the good pots out of your way.",
  "endurance:high": "You can walk all day and half the night, and often have.",
  "endurance:low": "You tire quickly, and always have.",
  "wit:high": "You are quicker-witted than almost anyone you will meet, and have learned not to show it.",
  "openness:high": "You ask more questions than anyone in {here} thinks is good for you.",
  "openness:low": "You have never wanted anything to change, and nothing much has.",
  "conscientiousness:high": "You have never in your life left a job half done.",
  "conscientiousness:low": "You have never once finished a job on the day you meant to.",
  "extraversion:high": "You know everyone in {here}, and everyone knows you.",
  "extraversion:low": "You can go days without speaking to anyone, and sometimes do.",
  "agreeableness:high": "People bring you their troubles, and you have never learned to send them away.",
  "agreeableness:low": "You have quarrelled at one time or another with most of {here}.",
  "neuroticism:high": "You lie awake most nights over things that have not happened yet.",
  "neuroticism:low": "Nothing seems to frighten you, and people have noticed.",
};

export const UNCOMMON_TRADE = "You are the only {role} in {here}.";
