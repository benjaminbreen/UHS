import { applySituation, situationFromPrompt } from "./situation";
import { formatHistoricalYear } from "../../core/calendar";
import { eraAt, glacialTundraLatitude } from "../history/dates";
import { random } from "../../core/random";
import { populateCharacter } from "./character";
import { places } from "./places";
import { urbanized } from "../settlements/urban-form";
import { industrialized } from "../settlements/modernity";
import { farms } from "./onsets";
import { integratedSetting } from "./defaults";
import { matchesCharacterScope, resolveCharacterContext } from "../characters/resolve";
import { localLabels } from "../characters/livelihood-labels.generated";
import { placeAtYear } from "./eras";
import { workplaceFor } from "../characters/workplace";
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
/** A start whose work is a field lives among its fields, not in the city. */
export function tillersHome(s: WorldSetting, role: string): WorldSetting["settlement"] {
  const work = resolveCharacterContext(s).livelihoods.find((l) => l.label === role);
  const tills = work && (work.workplace ?? workplaceFor(work.activity)) === "field";
  return tills && s.settlement !== "camp" && s.settlement !== "village" ? "farm" : s.settlement;
}

export function settingFor(input: AtlasPlace, year = input.year): WorldSetting {
  // The gazetteer row is timeless; read it at the date being played before
  // anything derives a culture, a fabric or a footprint from it.
  const place = placeAtYear(input, year);
  const where = {
    culture: place.culture,
    lon: place.lon,
    lat: place.lat,
    year,
  };
  // The atlas rank is modern prominence, not this place's size at this date.
  const town = urbanized(where);
  // Foragers where farming has not arrived and no settlement network has yet
  // formed. Somewhere that stayed forager country until the modern network
  // reached it, such as Tasmania, becomes a town on that later date, not on a
  // farming date it never had.
  const forager = !farms(where) && !town;
  // The gazetteer ranks by modern prominence, and a mill or cannery town of
  // several thousand is still listed as a village.
  const grown =
    place.settlement === "village" &&
    (place.population ?? 0) >= 3000 &&
    industrialized(where);
  return integratedSetting(
    settingSchema.parse({
      version: 2,
      placeId: place.id,
      location: place.name,
      lon: place.lon,
      lat: place.lat,
      year,
      culture: place.culture,
      climate:
        place.lat > (glacialTundraLatitude(year) ?? 90) ? "tundra" : place.climate,
      relief: place.relief,
      water: place.water,
      settlement: forager
        ? "camp"
        : !town
          ? "village"
          : grown
            ? place.water.startsWith("coast")
              ? "port"
              : "city"
            : place.settlement,
      population: town ? place.population : undefined,
      architecture: forager
        ? "shelter"
        : year < -3499
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
    }),
  );
}
/** Where under the ground a prompt asks to start: "a cave man", "sewer
 * worker", "a collier in Durham". */
const SHIP_WORDS = /\baboard\b|\bat sea\b|\bon (?:board|(?:a|an|the) (?:[a-z-]+ )?(?:ship|vessel|junk|dhow|steamer|steamship|galleon|indiaman|liner|clipper))\b|\b(?:east indiam[ae]n|galleons?|junks?|dhows?|steamships?|steamers?|ocean liners?|emigrant ships?)\b|\b(?:deckhands?|stokers?|steerage|cabin boys?|ship'?s (?:boy|cook|surgeon)|lascars?|nakhoda)\b/;

/** Vessels that are not ships: the words that ask for one, its hull, the place and year when the prompt names none, and who is aboard. */
const VESSELS: readonly (readonly [RegExp, string, string, number, string, string])[] = [
  [/\blunar orbit\b|\b(?:orbiting|around|round) the moon\b/, "capsule-lunar", "city-houston", 1968, "Astronaut", "aviator"],
  [/\bdeep space\b|\bbetween (?:the )?earth and (?:the )?moon\b/, "capsule-space", "city-houston", 1969, "Astronaut", "aviator"],
  [/\bin orbit\b|\borbiting\b|\bspace ?capsules?\b|\bspacecraft\b|\bin (?:outer )?space\b/, "capsule-orbit", "city-orlando", 1962, "Astronaut", "aviator"],
  [/\bsubmarines?\b|\bu-boats?\b|\bsubmariners?\b/, "submarine", "city-hamburg", 1942, "Submariner", "sailor"],
  [/\b(?:in|aboard|on) (?:a|an|the) (?:aircraft|aeroplane|airplane|plane|bomber|flying boat|airliner)\b|\bin flight\b/, "aircraft", "london", 1938, "Airman", "aviator"],
  [/\b(?:hot[- ]air |gas )?balloons?\b|\baeronauts?\b/, "balloon", "paris", 1783, "Aeronaut", "aviator"],
  [/\blimbo\b|\bafterlife\b|\bpurgatory\b|\bin a dream\b/, "limbo", "city-florence", 1300, "Traveler", ""],
  [/\b(?:in|into) the void\b|\boutside (?:of )?time\b/, "void", "city-florence", 1300, "Traveler", ""],
];
const vesselOf = (q: string) => VESSELS.find(([words]) => words.test(q));

export function belowFromPrompt(q: string): "cave" | "sewer" | "mine" | "ship" | undefined {
  if (SHIP_WORDS.test(q) || vesselOf(q)) return "ship";
  if (/\bsewers?\b|\bsewerm[ae]n\b|\btoshers?\b|\bflushers?\b/.test(q)) return "sewer";
  if (/\b(?:a|the|gold|silver|coal|salt|tin|copper|iron|lead|mercury|emerald|diamond)\s+mines?\b|\bminers?\b|\bmining\b|\bcollier(?:y|ies|s)?\b|\bpit ?(?:m[ae]n|boys?|lads?|pon(?:y|ies)|brow)\b|\bhewers?\b|\bcoal ?face\b|\bdown the pit\b/.test(q)) return "mine";
  if (/\bcave(?:s|m[ae]n|wom[ae]n|dwellers?)?\b|\bcave (?:m[ae]n|wom[ae]n|dwellers?|people)\b|\bcaverns?\b|\bgrottos?\b/.test(q)) return "cave";
}
/** Where an underground start goes when the prompt names no place or date. */
const BELOW_PLACES = { cave: ["magdalenian"], sewer: ["london", 1880], mine: ["city-cardiff", 1880], ship: ["london", 1790] } as const;
/** The home waters of the ship a prompt names. */
const shipPlace = (q: string): readonly [string, number] =>
  vesselOf(q) ? [vesselOf(q)![2], vesselOf(q)![3]] : /\bjunks?\b/.test(q) ? ["city-guangzhou", 1760] : /\b(?:dhows?|nakhoda)\b/.test(q) ? ["city-muscat", 1850] : /\bgalleons?\b/.test(q) ? ["city-lisbon", 1600]
    : /\b(?:steam|stoker|liner)/.test(q) ? ["london", 1905] : /\bemigrant\b/.test(q) ? ["london", 1850] : BELOW_PLACES.ship;

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
  try {
    const intent = situationFromPrompt(input);
    if (intent) {
      const located = places.filter((p) => [p.name, ...p.aliases].some((a) => has(q, a)))
        .sort((a, b) => b.name.length - a.name.length)[0];
      const place = located ? { ...located, year: intent.place.year } : intent.place;
      const dated = input.replace(/\b\d{1,3}\s*[x×]\s*\d{1,3}\b/gi, "");
      const base = settingFor(place, dateFromPrompt(intent.situation.camp === "military" ? dated.replace(/\broman\b/gi, "") : dated, place.year, seed));
      const setting = populateCharacter(applySituation({ ...base, role: intent.role, characterName: intent.role }, intent.situation), seed);
      return { setting, description: describeSetting(setting), needsInterpretation: false };
    }
  } catch (error) { return { error: error instanceof Error ? error.message : "Invalid starting situation." }; }
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
  const below = belowFromPrompt(q);
  const undated = dateFromPrompt(input, -1000001, seed) === -1000001;
  if (below && !located) {
    const [id, year] = below === "ship" ? shipPlace(q) : BELOW_PLACES[below];
    const found = places.find((p) => p.id === id);
    if (found) place = year && undated ? { ...found, year } : found;
  } else if (place && below && below !== "cave" && below !== "ship" && undated) place = { ...place, year: Math.max(place.year, 1880) };
  else if (place && undated && vesselOf(q)) place = { ...place, year: vesselOf(q)![3] };
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
      [/\bhunter\b/, "Hunter"],
      [/\blegionary\b|\bsoldier\b/, "Legionary"],
      [/\bfarmer\b|\bpeasant\b/, "Farmer"],
      [/\bshaman\b/, "Shaman"],
      [/\bfisher\b|\bfisherman\b/, "Fisher"],
      [/\bmerchant\b|\btrader\b/, "Merchant"],
      [/\bshepherd\b/, "Shepherd"],
      [/\bweaver\b/, "Weaver"],
      [/\bsailor\b/, "Sailor"],
    ];
    const context = resolveCharacterContext(s);
    const namedRole = context.livelihoods.flatMap((livelihood) => [
      livelihood.label,
      ...[...(livelihood.labels ?? []), ...(localLabels[livelihood.id] ?? [])]
        .filter((label) => matchesCharacterScope(label.scope, s) &&
          (!label.ecologies || !!s.environment?.ecology && label.ecologies.includes(s.environment.ecology)))
        .map((label) => label.label),
    ]).sort((a, b) => b.length - a.length).find((label) => has(q, label));
    const coal = /\bcoal\b|\bcollier|\bpit\b/.test(q);
    const underRole = below === "mine" ? (coal ? "Coal miner" : "Miner") : below === "sewer" ? (/\btosher/.test(q) ? "Tosher" : "Sewer flusher") : below === "cave" ? (s.year < -8000 ? "Hunter" : "Hermit")
      : below === "ship" ? vesselOf(q)?.[4] ?? (/\bstokers?\b/.test(q) ? "Stoker" : /\b(?:passengers?|emigrants?|steerage|pilgrims?)\b/.test(q) ? "Passenger" : "Sailor") : undefined;
    s.role = namedRole ?? roles.find(([pattern]) => pattern.test(q))?.[1] ?? underRole ?? "Traveler";
    if (below) {
      s.below = below;
      if (below === "ship") s.ship = vesselOf(q)?.[1] ?? (/\bjunks?\b/.test(q) ? "junk" : /\b(?:dhows?|nakhoda)\b/.test(q) ? "dhow" : /\bgalleons?\b/.test(q) ? "galleon"
        : /\bindiam[ae]n\b/.test(q) ? "indiaman" : /\b(?:steam|stoker|liner)/.test(q) ? "steamer" : /\bemigrant\b/.test(q) ? "emigrant-ship" : undefined);
      const work = below === "mine" ? (coal && s.year >= 1780 ? "coal-miner" : "miner") : below === "sewer" ? (/\btosher/.test(q) ? "night-soil-collector" : "navvy") : below === "ship" ? vesselOf(q)?.[5] || (s.role === "Sailor" ? "sailor" : undefined) : undefined;
      if (work && !namedRole) s.brief = { ...s.brief, work };
    }
    if (has(q, "free black")) s.community = "Free Black household";
    s.characterName = s.role;
    if (/\bfarm(?:er|stead)?\b/.test(q)) s.settlement = "farm";
    else s.settlement = tillersHome(s, s.role);
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
      "sewer worker", "sewer man", "sewerman", "sewer", "sewers", "tosher", "flusher", "cave man", "caveman", "cave woman", "cave", "caves", "cavern", "grotto",
      "coal miner", "coal mine", "miner", "miners", "mine", "mining", "collier", "colliery", "pit man", "pitman", "pit boy", "hewer", "down the pit",
    ];
    for (const phrase of recognized.sort((a, b) => b.length - a.length))
      rest = rest.split(` ${normalize(phrase).replace(/-/g, " ")} `).join(" ");
    rest = rest.replace(
      /\b\d+(?:st|nd|rd|th)?\b|\b(?:bce|bc|ce|ad|century|year)\b/g,
      " ",
    );
    for (const [pattern] of roles)
      rest = rest.replace(new RegExp(pattern.source, "g"), " ");
    if (namedRole)
      rest = rest.split(` ${normalize(namedRole).replace(/-/g, " ")} `).join(" ");
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
