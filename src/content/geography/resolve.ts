import { formatHistoricalYear } from "../../core/calendar";
import { eraAt } from "../history/dates";
import { random } from "../../core/random";
import { populateCharacter } from "./character";
import { places } from "./places";
import { settingSchema, type AtlasPlace, type WorldSetting } from "./types";
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, " ")
    .trim();
const has = (q: string, word: string) =>
  ` ${q} `.includes(` ${normalize(word)} `);
const periods: [string[], number, number][] = [
  [["paleolithic", "palaeolithic", "ice age"], -39999, -10000],
  [["neolithic", "early farmer"], -9999, -3500],
  [["bronze age"], -3299, -1200],
  [["iron age"], -1199, -500],
  [["hellenistic", "ptolemaic"], -322, -30],
  [["ancient", "roman", "antiquity"], -799, 499],
  [["early medieval"], 500, 999],
  [["medieval", "middle ages"], 1000, 1499],
  [["elizabethan"], 1558, 1603],
  [["tudor"], 1485, 1603],
  [["renaissance"], 1400, 1599],
  [["early modern"], 1500, 1749],
  [["victorian"], 1837, 1901],
  [["modern"], 1900, 1989],
  [["contemporary"], 1990, 2026],
];
const zones: [string[], string[]][] = [
  [
    ["european", "europe"],
    ["rome", "normandy", "london"],
  ],
  [
    ["central asian", "central asia", "inner eurasian"],
    ["mongolia", "siberia"],
  ],
  [
    ["east asian", "east asia", "chinese"],
    ["beijing", "kyoto"],
  ],
  [
    ["south asian", "south asia", "indian"],
    ["bengal", "delhi"],
  ],
  [
    ["southeast asian", "southeast asia"],
    ["burma", "java"],
  ],
];
export function dateFromPrompt(
  input: string,
  fallback: number,
  seed?: string,
): number {
  const q = normalize(input).replace(
    /(\d(?:st|nd|rd|th)?)-century/g,
    "$1 century",
  );
  const exact = /\b(\d{1,7})\s*(bce|bc|ce|ad)\b/.exec(q);
  if (exact) {
    if (+exact[1] === 0)
      throw Error("Use 1 BCE or 1 CE; era labels have no year zero.");
    return exact[2].startsWith("b") ? 1 - +exact[1] : +exact[1];
  }
  const century =
    /\b(\d{1,3})(?:st|nd|rd|th)?\s+century(?:\s+(bce|bc))?\b/.exec(q);
  if (century) {
    if (+century[1] === 0) throw Error("Use a century starting at 1.");
    const n = +century[1];
    const first = century[2] ? 1 - n * 100 : (n - 1) * 100 + 1;
    return (
      first +
      (seed === undefined
        ? 49
        : Math.floor(random(seed, "starting-year", q) * 100))
    );
  }
  const year = /(?:^|\s)(-?\d{1,7})(?=\s|$)/.exec(q);
  if (year) return +year[1];
  const period = periods.find(([words]) => words.some((w) => has(q, w)));
  if (!period) return fallback;
  return (
    period[1] +
    Math.floor(
      (seed === undefined ? 0.5 : random(seed, "starting-year", q)) *
        (period[2] - period[1] + 1),
    )
  );
}
export function settingFor(place: AtlasPlace, year = place.year): WorldSetting {
  const prehistoric = year < -3499;
  return settingSchema.parse({
    version: 2,
    placeId: place.id,
    location: place.name,
    lon: place.lon,
    lat: place.lat,
    year,
    culture: place.culture,
    climate: year < -9999 && place.lat > 48 ? "tundra" : place.climate,
    relief: place.relief,
    water: place.water,
    settlement:
      year < -9999 ? "camp" : prehistoric ? "village" : place.settlement,
    architecture:
      year < -9999
        ? "shelter"
        : prehistoric
          ? "mudbrick"
          : year >= 500 &&
              place.culture === "european" &&
              place.architecture === "classical"
            ? year >= 1750
              ? "board"
              : "timber"
            : place.architecture,
    role: "Traveler",
    characterName: "Traveler",
    community: "",
    season: place.lat < 0 ? "autumn" : "spring",
  });
}
export function resolveSetting(
  input: string,
  seed = "earth-2",
):
  | {
      setting: WorldSetting;
      description: string;
      needsInterpretation: boolean;
      reason?: string;
    }
  | { error: string } {
  const q = normalize(input);
  if (!q)
    return {
      error:
        "Enter a place, period, or starting role, or choose a place below.",
    };
  const generic = new Set(periods.flatMap(([words]) => words));
  const matches = places
    .map((place) => ({
      place,
      score: Math.max(
        0,
        ...[place.name, ...place.aliases]
          .filter((a) => has(q, a))
          .map((a) => (generic.has(a) ? 0.1 : normalize(a).length)),
      ),
    }))
    .filter((p) => p.score)
    .sort((a, b) => b.score - a.score);
  const zone = zones.find(([words]) => words.some((w) => has(q, w)));
  const choices = zone ? places.filter((p) => zone[1].includes(p.id)) : [];
  let place = matches[0]?.place;
  if ((!place || matches[0].score <= 0.1) && choices.length)
    place =
      choices[Math.floor(random(seed, "starting-region", q) * choices.length)];
  const located = !!zone || (matches[0]?.score ?? 0) > 0.1 || has(q, "roman");
  if (!place) {
    const period = periods.find(([words]) => words.some((w) => has(q, w)));
    if (period)
      place = places.find(
        (p) =>
          p.id ===
          (period[1] < -9999
            ? "siberia"
            : period[1] < -3499
              ? "konya"
              : period[1] < 500
                ? "rome"
                : "normandy"),
      )!;
  }
  if (!place)
    return {
      error:
        "No place or period matched. Try a place such as Normandy, Beijing, Haiti, London, or Alexandria; or choose one from the list.",
    };
  try {
    const s = settingFor(place, dateFromPrompt(input, place.year, seed));
    const roles: [RegExp, string][] = [
      [/\blegionary\b|\bsoldier\b/, "Legionary"],
      [/\bfarmer\b|\bpeasant\b/, "Farmer"],
      [/\bshaman\b/, "Shaman"],
      [/\bfisher\b|\bfisherman\b/, "Fisher"],
      [/\bmerchant\b|\btrader\b/, "Merchant"],
      [/\bshepherd\b/, "Shepherd"],
      [/\bweaver\b/, "Weaver"],
      [/\bsailor\b/, "Sailor"],
    ];
    s.role = roles.find(([pattern]) => pattern.test(q))?.[1] ?? "Traveler";
    if (has(q, "free black")) s.community = "Free Black household";
    s.characterName = s.role;
    if (/\bfarm(?:er|stead)?\b/.test(q)) s.settlement = "farm";
    if (/\bcamp\b|\blegionary\b|\bshaman\b/.test(q)) s.settlement = "camp";
    for (const season of ["spring", "summer", "autumn", "winter"] as const)
      if (has(q, season)) s.season = season;
    if (
      /\bancient\b|\broman\b|\bhellenistic\b/.test(q) &&
      s.culture === "european"
    )
      s.architecture = "classical";
    if (
      s.year >= 500 &&
      s.culture === "european" &&
      s.architecture === "classical"
    )
      s.architecture = s.year >= 1750 ? "board" : "timber";
    // Recognizing one keyword is not evidence that the whole request was understood.
    let rest = ` ${q.replace(/-/g, " ")} `;
    const recognized = [
      ...places.flatMap((p) => [p.name, ...p.aliases]),
      ...periods.flatMap(([words]) => words),
      ...zones.flatMap(([words]) => words),
      "free black",
    ];
    for (const phrase of recognized.sort((a, b) => b.length - a.length))
      rest = rest.split(` ${normalize(phrase).replace(/-/g, " ")} `).join(" ");
    rest = rest.replace(
      /\b\d+(?:st|nd|rd|th)?\b|\b(?:bce|bc|ce|ad|century|year)\b/g,
      " ",
    );
    for (const [pattern] of roles)
      rest = rest.replace(new RegExp(pattern.source, "g"), " ");
    rest = rest
      .replace(
        /\b(?:a|an|the|in|at|of|from|during|as|and|or|guy|man|woman|person|spring|summer|autumn|winter|camp|life)\b/g,
        " ",
      )
      .trim();
    const dated = dateFromPrompt(input, -1000001, seed) !== -1000001;
    const needsInterpretation = !located || !dated || !!rest;
    const setting = populateCharacter(s, seed);
    return {
      setting,
      description: describeSetting(setting),
      needsInterpretation,
      reason: !located
        ? "No specific place or culture zone was identified."
        : !dated
          ? "No period or date was identified."
          : rest
            ? "Some details need interpretation."
            : undefined,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Could not resolve this setting.",
    };
  }
}
export function describeSetting(s: WorldSetting) {
  return `${s.role} · ${s.location} · ${formatHistoricalYear(s.year)} · ${eraAt({ year: s.year }).label}`;
}
