import { formatHistoricalYear } from "../../core/calendar";
import { eraAt } from "../history/dates";
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
const periods: [string[], number][] = [
  [["paleolithic", "palaeolithic", "ice age"], -14999],
  [["neolithic", "early farmer"], -6499],
  [["bronze age"], -1999],
  [["iron age"], -699],
  [["hellenistic", "ptolemaic"], -249],
  [["ancient", "roman", "antiquity"], 100],
  [["early medieval"], 750],
  [["medieval", "middle ages"], 1250],
  [["elizabethan"], 1590],
  [["tudor"], 1550],
  [["renaissance"], 1500],
  [["early modern"], 1650],
  [["victorian"], 1870],
  [["modern"], 1950],
  [["contemporary"], 2000],
];
export function dateFromPrompt(input: string, fallback: number): number {
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
    const mid = (+century[1] - 1) * 100 + 50;
    return century[2] ? 1 - mid : mid;
  }
  const year = /\b(?:year\s+)?(1\d{3}|20\d{2})\b/.exec(q);
  if (year) return +year[1];
  return (
    periods.find(([words]) => words.some((w) => has(q, w)))?.[1] ?? fallback
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
    settlement: prehistoric ? "camp" : place.settlement,
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
): { setting: WorldSetting; description: string } | { error: string } {
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
  let place = matches[0]?.place;
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
    const s = settingFor(place, dateFromPrompt(input, place.year));
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
    return { setting: s, description: describeSetting(s) };
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
