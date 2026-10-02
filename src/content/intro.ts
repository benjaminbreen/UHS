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

/** A marked but not extraordinary temperament, after "and ". The extremes
 * are `UNCOMMON_STAT`'s. */
export const TEMPER: Partial<Record<`${keyof Stats}:${"high" | "low"}`, string>> = {
  "strength:high": "you are the one people send for when something heavy needs moving",
  "strength:low": "you have never been strong, and leave the heavy work to others",
  "agility:high": "you are quick on your feet, and always have been",
  "agility:low": "you are clumsy, and break more pots than you should",
  "endurance:high": "you can work from dawn to dark without tiring",
  "endurance:low": "you tire easily, and need your rest",
  "wit:high": "you are quick to see the point of things, and quicker to say so",
  "openness:high": "you are curious about everything, and ask too many questions",
  "openness:low": "you like things done the way they have always been done",
  "conscientiousness:high": "you are careful in everything, and finish what you start",
  "conscientiousness:low": "you mean well, but things have a way of going undone",
  "extraversion:high": "you would rather talk than work, and usually do",
  "extraversion:low": "you keep to yourself, and like it that way",
  "agreeableness:high": "you have never been able to say no to anyone",
  "agreeableness:low": "you have a temper you have never learned to hold",
  "neuroticism:high": "you worry about everything, and always have",
  "neuroticism:low": "very little troubles you",
};

/** Something passing and small, for the odd life that opens on the moment
 * rather than the years. `sun` lines want a fair, warm sky. */
export const MOMENTS: readonly { line: string; sun?: boolean }[] = [
  { line: "you woke from a bad dream you cannot quite remember" },
  { line: "you have had the hiccups since you woke" },
  { line: "you have a song in your head that will not leave you alone" },
  { line: "you dreamed last night of your grandmother, who has been dead for years" },
  { line: "you slept badly, and the day already feels long" },
  { line: "you woke wanting something sweet, and there is nothing sweet in the house" },
  { line: "you stubbed your toe on the doorpost this morning, and it still hurts" },
  { line: "you have been turning over all morning something that was said to you yesterday" },
  { line: "you have a splinter in your thumb that will not come out" },
  { line: "you would like nothing better than to lie in the sun and do nothing at all", sun: true },
  { line: "the warmth has put you in a better mood than you have been in for weeks", sun: true },
];
