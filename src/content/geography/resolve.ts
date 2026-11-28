import { sailingPort } from "../settlements/waterfronts";
import { nearestBankPoint, toAtlas, fromAtlas } from "../../world/geography/atlas";
import { applySituation, normalize, situationFromPrompt } from "./situation";
import { courtStart, fairFromPrompt, postFor, residentFromPrompt, requestedRoom, venueFor } from "../fairs";
import { formatHistoricalYear } from "../../core/calendar";
import { tombAt, tombStyle, type TombStyle } from "../tombs";
import { catacombKindAt, catacombRole } from "../catacombs";
import { eraAt, glacialTundraLatitude, LAST_YEAR, PRESENT_YEAR } from "../history/dates";
import { random } from "../../core/random";
import { populateCharacter } from "./character";
import { berthFor, atBerth } from "./regions/ports";
import { places } from "./places";
import { urbanized } from "../settlements/urban-form";
import { industrialized } from "../settlements/modernity";
import { farms } from "./onsets";
import { integratedSetting } from "./defaults";
import { matchesCharacterScope, populationFor, resolveCharacterContext } from "../characters/resolve";
import { localLabels } from "../characters/livelihood-labels.generated";
import { beliefOptions } from "../beliefs";
import { officiantsFor } from "../characters/officiant";
import { placeAtYear } from "./eras";
import { workplaceFor } from "../characters/workplace";
import { momentRooms, settingSchema, type AtlasPlace, type WorldSetting } from "./types";
import { curatedStarts } from "./curated-starts";
import { livelihoodById, livelihoodIds } from "../characters/livelihoods";
import { encodeTheatreRoom, resolveTheatreVenueId, THEATER_VIEWER_PRESETS, theatreStartFromPrompt, type TheatreStartMode } from "../interiors/performances";
import type { RequestedCondition } from "../health/conditions";
export { normalize } from "./situation";
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
  [["present day", "today"], PRESENT_YEAR, PRESENT_YEAR],
  [["contemporary"], 1990, PRESENT_YEAR],
  [["near future", "future"], PRESENT_YEAR + 1, LAST_YEAR],
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
const upTo = (year: number) => {
  if (year > LAST_YEAR) throw Error(`The game runs up to ${LAST_YEAR}.`);
  return year;
};
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
    return exact[2].startsWith("b") ? 1 - +exact[1] : upTo(+exact[1]);
  }
  const century =
    /\b(\d{1,3})(?:st|nd|rd|th)?\s+century(?:\s+(bce|bc))?\b/.exec(q);
  if (century) {
    if (+century[1] === 0) throw Error("Use a century starting at 1.");
    const n = +century[1];
    const first = century[2] ? 1 - n * 100 : (n - 1) * 100 + 1;
    const span = Math.min(100, LAST_YEAR - upTo(first) + 1);
    return first + (seed === undefined
      ? Math.min(49, span - 1)
      : Math.floor(random(seed, "starting-year", q) * span));
  }
  const decade = /\b(\d{3}0)s\b/.exec(q);
  if (decade) {
    return Math.min(LAST_YEAR, upTo(+decade[1]) + (seed === undefined ? 5 : Math.floor(random(seed, "starting-year", q) * 10)));
  }
  const year = /(?:^|\s)(-?\d{1,7})(?=\s|$)/.exec(q);
  if (year) return upTo(+year[1]);
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

/** The gazetteer point is often the town centre. A waterfront household can live
 * a short walk away on the same catchment's mapped bank. */
export function watersidePlace(p: AtlasPlace, year: number): AtlasPlace | undefined {
  if (p.id==="city-mwanza" && year>=1000) return {...p,id:"mwanza-landing",name:"Mwanza Gulf fishing landing",lon:32.892,lat:-2.514,water:"lake",settlement:"village",population:undefined};
  if (p.id==="city-gdansk" && sailingPort(p.id,year)) return {...p,lon:18.657,lat:54.354,water:"river-ns"};
  if (p.id==="city-detroit") return {...p,lon:-83.051,lat:42.326,water:"river-ew"};
  if (p.water!=="none") return p;
  const coast=p.coast?.distance ?? Infinity, river=p.river?.distance ?? Infinity;
  if (Math.min(coast,river)>240) return;
  const sea=coast<=river, at=toAtlas(p.lon,p.lat);
  const bank=nearestBankPoint(at.x,at.y,sea ? "coast" : "river");
  if (!bank) return;
  const dx=at.x-bank[0],dy=at.y-bank[1],d=Math.hypot(dx,dy);
  if(d>250)return;
  const along=Math.min(1,22/(d || 1));
  return {...p,...fromAtlas(bank[0]+dx*along,bank[1]+dy*along),
    water:sea ? Math.abs(dx)>Math.abs(dy) ? dx>0 ? "coast-w":"coast-e" : dy>0 ? "coast-n":"coast-s" : "river-ew"};
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
  [/\bcosmonauts?\b/, "capsule-orbit", "city-moscow", 1961, "Cosmonaut", "aviator"],
  [/\btaikonauts?\b/, "capsule-orbit", "beijing", 2003, "Taikonaut", "aviator"],
  [/\bastronauts?\b|\bin orbit\b|\borbiting\b|\bspace ?capsules?\b|\bspacecraft\b|\bin (?:outer )?space\b/, "capsule-orbit", "city-orlando", 1962, "Astronaut", "aviator"],
  [/\bsubmarines?\b|\bu-boats?\b|\bsubmariners?\b/, "submarine", "city-hamburg", 1942, "Submariner", "sailor"],
  [/\b(?:in|aboard|on) (?:a|an|the) (?:aircraft|aeroplane|airplane|plane|bomber|flying boat|airliner)\b|\bin flight\b/, "aircraft", "london", 1938, "Airman", "aviator"],
  [/\b(?:hot[- ]air |gas )?balloons?\b|\baeronauts?\b/, "balloon", "paris", 1783, "Aeronaut", "aviator"],
  [/\blimbo\b|\bafterlife\b|\bpurgatory\b|\bin a dream\b/, "limbo", "city-florence", 1300, "Traveler", ""],
  [/\b(?:in|into) the void\b|\boutside (?:of )?time\b/, "void", "city-florence", 1300, "Traveler", ""],
];
const vesselOf = (q: string) => VESSELS.find(([words]) => words.test(q));

export function belowFromPrompt(q: string): WorldSetting["below"] {
  if (/\b(?:prisoners?|convicts?|inmates?|debtors?|gaols?|jails?|prisons?|dungeons?|oubliettes?|bastille|newgate|fleet prison|marshalsea|alcatraz|pentonville|yamen jail|cellblock)\b/.test(q)) return "prison";
  if (fairFromPrompt(q)) return "fair";
  if (PARIS_BONES.test(q) || /\bcatacombs?\b|\bfossors?\b|\bfossores\b/.test(q)) return "catacomb";
  if (/\btombs?\b|\btomb[- ]?robbers?\b|\bburial chambers?\b|\bvalley of the kings\b/.test(q) || tombFromPrompt(q)) return "tomb";
  if (SHIP_WORDS.test(q) || vesselOf(q)) return "ship";
  if (/\bsewers?\b|\bsewerm[ae]n\b|\btoshers?\b|\bflushers?\b/.test(q)) return "sewer";
  if (/\b(?:a|the|gold|silver|coal|salt|tin|copper|iron|lead|mercury|emerald|diamond)\s+mines?\b|\bminers?\b|\bmining\b|\bcollier(?:y|ies|s)?\b|\bpit ?(?:m[ae]n|boys?|lads?|pon(?:y|ies)|brow)\b|\bhewers?\b|\bcoal ?face\b|\bdown the pit\b/.test(q)) return "mine";
  if (/\bcave(?:s|m[ae]n|wom[ae]n|dwellers?)?\b|\bcave (?:m[ae]n|wom[ae]n|dwellers?|people)\b|\bcaverns?\b|\bgrottos?\b/.test(q)) return "cave";
}
const PARIS_BONES = /\bossuar(?:y|ies)\b|\bempire of the dead\b|\bcatacombs? (?:of|under|in|beneath) paris\b|\bparis(?:ian)? catacombs?\b/;
/** The kind of tomb a prompt names; otherwise whichever the place and year have. */
const tombFromPrompt = (q: string) => (/\bcrypts?\b|\bcharnel(?: house)?\b|\bundercrofts?\b/.test(q) ? tombStyle("crypt") : undefined);
const tombRole = (style: TombStyle | undefined, year: number) => [...(style?.roles ?? [])].reverse().find(([from]) => year >= from)?.[1] ?? "Tomb robber";
/** Where an underground start goes when the prompt names no place or date. */
const BELOW_PLACES = { cave: ["magdalenian"], sewer: ["london", 1880], mine: ["city-cardiff", 1880], ship: ["london", 1790], fair: ["paris", 1889], tomb: ["city-luxor", -1110], prison: ["london", 1750], catacomb: ["rome", 380] } as const;
/** The home waters of the ship a prompt names. */
const shipPlace = (q: string): readonly [string, number] =>
  vesselOf(q) ? [vesselOf(q)![2], vesselOf(q)![3]] : /\bjunks?\b/.test(q) ? ["city-guangzhou", 1760] : /\b(?:dhows?|nakhoda)\b/.test(q) ? ["city-muscat", 1850] : /\bgalleons?\b/.test(q) ? ["city-lisbon", 1600]
    : /\b(?:steam|stoker|liner)/.test(q) ? ["london", 1905] : /\bemigrant\b/.test(q) ? ["london", 1850] : BELOW_PLACES.ship;

const CONDITION_WORDS: [string, RequestedCondition | undefined][] = [
  ["lepers?|leprosy|leprous", "leprosy"],
  ["wheel ?chairs?(?: users?)?|paralys\\w*|paralyz\\w*|paraplegic|quadriplegic", "paralysed"],
  ["polio|crippled?", "withered-legs"],
  ["blind", "blind"],
  ["deaf", "deaf"],
  ["club ?-?foot(?:ed)?|crutch(?:es)?", "clubfoot"],
  ["one-?legged|amputees?|peg-?leg(?:ged)?|wooden leg|lost (?:a|his|her|my|one) leg", "lost-leg"],
  ["one-?armed|lost (?:a|his|her|my|one) arm", "lost-arm"],
  ["lame|limp(?:ing)?", "limp"],
  ["epilep\\w*", "falling"],
  ["stammer\\w*|stutter\\w*", "stammer"],
  ["consumptive|tuberculo\\w*", "consumption"],
  ["disabled|handicapped|invalid", undefined],
];
const ANY_CONDITION: RequestedCondition[] = ["paralysed", "lost-leg", "clubfoot", "blind", "lost-arm", "deaf"];

type AskedWeather = NonNullable<WorldSetting["weather"]>;
const WEATHER_WORDS: [string, AskedWeather][] = [
  ["blizzards?", "blizzard"],
  ["snow(?:y|ing|fall|storm)?", "snow"],
  ["hail(?:storms?|ing|stones?)?", "hail"],
  ["thunder(?:storms?)?|lightning", "storm"],
  ["sand ?storms?|dust ?storms?", "dust"],
  ["rain(?:y|ing|storms?)?|downpour|drizzle", "rain"],
  ["sunny|sunshine", "clear"],
];
/** The season that brings a weather asked for, unless the prompt names one. */
export const weatherSeason: Partial<Record<AskedWeather, WorldSetting["season"]>> = { blizzard: "winter", snow: "winter", hail: "spring", storm: "summer" };
const COLD: readonly string[] = ["temperate", "boreal", "tundra"];
// "Bath" alone is the English town, and "a tavern keeper" is a role.
const NOT_A_ROLE = "(?!\\s*(?:keepers?|owners?|masters?|mistress|maids?|girls?|boys?|teachers?|attendants?|priests?)\\b)";
const ROOM_WORDS: [string, (typeof momentRooms)[number]][] = [
  [`(?:church|chapel|cathedral|abbey|monastery|priory|convent|nunnery|mosque|synagogue|temple|shrine|pagoda|wat|kiva)${NOT_A_ROLE}`, "temple"],
  [`(?:tavern|inn|alehouse|pub|saloon|teahouse|tea house|coffee ?house|izakaya)${NOT_A_ROLE}`, "tavern"],
  [`(?:bath ?house|bathing house|public baths|the baths|hammam|sento|onsen|sweat ?lodge|temazcal)${NOT_A_ROLE}`, "bath"],
  [`(?:school ?(?:room|house)?|madrasa)${NOT_A_ROLE}`, "school"],
  [`(?:theatre|theater|playhouse|opera house|cinema)${NOT_A_ROLE}`, "theatre"],
  ["(?:town hall|guild ?hall|meeting ?house)", "hall"],
];
const words = (w: string) => new RegExp(`(?:\\b(?:with|in|on|on a|using|uses|has)\\s+)?(?:\\b(?:a|an)\\s+)?\\b(?:${w})\\b(?:\\s+(?:day|morning|weather))?`, "gi");

/** Builds a ready-to-play WorldSetting for Settings → Developer → "Go to the theater". */
export function theaterViewerSetting(
  presetId: string,
  opts: { show?: string; mode?: TheatreStartMode } = {},
  seed = "theater-viewer",
): WorldSetting {
  const preset = THEATER_VIEWER_PRESETS.find((p) => p.id === presetId) ?? THEATER_VIEWER_PRESETS[0];
  const place = places.find((p) => p.id === preset.placeId) ?? places.find((p) => p.settlement === "city") ?? places[0];
  const mode = opts.mode ?? "seat";
  const film = preset.group === "cinema" ? (opts.show || preset.film) : undefined;
  const play = preset.group === "stage" ? (opts.show || preset.play) : undefined;
  const base = populateCharacter(
    { ...settingFor(place, preset.year), role: preset.role, characterName: preset.role },
    seed,
  );
  return {
    ...base,
    startIn: "theatre",
    venue: preset.venue,
    venueRoom: encodeTheatreRoom(mode, { film, play }),
  };
}

/** A start can ask for a condition ("a blind beggar") and the weather ("a
 * snowy day") besides its place and work. A prompt that names only those, or
 * a role, gets a place and year where they fit. */
export function resolveSetting(input: string, seed = "earth-2"): ReturnType<typeof resolvePrompt> {
  const ill = CONDITION_WORDS.map(([w, c]) => [words(w), c] as const).filter(([w]) => w.test(input));
  const sky = WEATHER_WORDS.map(([w, c]) => [words(w), c] as const).filter(([w]) => w.test(input));
  const theatre = !OVERLOOK_PROMPT.test(input) ? theatreStartFromPrompt(input) : undefined;
  if (theatre) {
    const condition = !ill.length ? undefined : ill.find(([, c]) => c)?.[1] ?? ANY_CONDITION[Math.floor(random(seed, "condition", input) * ANY_CONDITION.length)];
    const weather = sky[0]?.[1], season = weather && weatherSeason[weather];
    const cleaned = [...ill, ...sky]
      .reduce((t, [w]) => t.replace(w, " "), input)
      .replace(new RegExp(theatre.match.source, "gi"), " ")
      .replace(/\b(?:watching|seeing|going\s+to|listening\s+to|at|in|on|a|an|the)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    let found: ReturnType<typeof resolvePrompt> | undefined;
    if (cleaned) {
      const attempt = resolvePrompt(cleaned, seed, false);
      if ("setting" in attempt) found = attempt;
    }
    let setting: WorldSetting;
    const [, defaultYear] = theatre.defaults[Math.floor(random(seed, "theatre-start", input) * theatre.defaults.length)];
    let explicitYear: number | undefined;
    try {
      const asked = dateFromPrompt(input, -1000001, seed);
      if (asked !== -1000001) explicitYear = asked;
    } catch { /* fall back to defaultYear */ }
    if (found && "setting" in found) {
      setting = { ...found.setting };
      const minYear =
        theatre.venue === "auto-cinema" || theatre.venue === "nickelodeon" ? 1910
        : theatre.venue === "cinema" ? 1925
        : theatre.venue === "multiplex" ? 1966
        : theatre.venue === "opera-house" ? 1680
        : theatre.venue === "broadway-theatre" ? 1885
        : theatre.venue === "kabuki-theatre" ? 1650
        : theatre.venue === "noh-theatre" ? 1400
        : 1570;
      if (explicitYear === undefined && setting.year < minYear) {
        const place = places.find((p) => p.id === setting.placeId);
        if (place) setting = { ...settingFor(place, defaultYear), role: setting.role, characterName: setting.characterName, brief: setting.brief };
      }
      const genericRole = !setting.role || /^(?:Traveler|Person|Resident|Townsperson|Citizen)$/i.test(setting.role);
      if (theatre.work || genericRole) {
        setting = populateCharacter(
          {
            ...setting,
            role: theatre.role,
            ...(theatre.work ? { brief: { ...setting.brief, work: theatre.work } } : {}),
          },
          seed,
        );
      }
    } else {
      const [placeId] = theatre.defaults[Math.floor(random(seed, "theatre-start", input) * theatre.defaults.length)];
      const place = places.find((p) => p.id === placeId) ?? places.find((p) => p.settlement === "city") ?? places[0];
      const year = explicitYear ?? defaultYear;
      setting = populateCharacter(
        {
          ...settingFor(place, year),
          role: theatre.role,
          characterName: theatre.role,
          ...(theatre.work ? { brief: { work: theatre.work } } : {}),
        },
        seed,
      );
    }
    const named = /\b(?:spring|summer|autumn|fall|winter)\b/i.test(input);
    const venue = resolveTheatreVenueId(theatre.venue, setting.year);
    const venueRoom = encodeTheatreRoom(theatre.mode, { film: theatre.film, play: theatre.play });
    setting = {
      ...setting,
      ...(condition ? { condition } : {}),
      ...(weather ? { weather } : {}),
      ...(season && !named ? { season } : {}),
      startIn: "theatre",
      venue,
      venueRoom,
    };
    return { setting, description: describeSetting(setting), needsInterpretation: false };
  }
  const room = ROOM_WORDS.map(([w, c]) => [words(w), c] as const).filter(([w]) => w.test(input)).slice(0, 1);
  if (!ill.length && !sky.length && !room.length) {
    const found = resolvePrompt(input, seed);
    return "error" in found ? roleStart(input, seed) : found;
  }
  const condition = !ill.length ? undefined : ill.find(([, c]) => c)?.[1] ?? ANY_CONDITION[Math.floor(random(seed, "condition", input) * ANY_CONDITION.length)];
  const weather = sky[0]?.[1], season = weather && weatherSeason[weather];
  const text = [...ill, ...sky, ...room].reduce((t, [w]) => t.replace(w, " "), input).replace(/\s+/g, " ").trim() || "person";
  let found = resolvePrompt(text, seed, !room.length);
  if ("error" in found) found = roleStart(text, seed);
  // Only a prompt with nothing else in it ("a snowy day") gets a curated start; "hail in Kansas" stays an error.
  if ("error" in found && normalize(text).split(" ").every((w) => /^(?:a|an|the|in|on|at|of|day|morning|person|someone|me|i|guy|man|woman|during)$/.test(w))) {
    const pool = curatedStarts.filter((s) => (!room.length || s.year >= 0) && places.some((p) => p.id === s.placeId && (weather !== "snow" && weather !== "blizzard" || COLD.includes(p.climate))));
    const start = pool[Math.floor(random(seed, "asked-start", input) * pool.length)];
    const setting = populateCharacter({ ...settingFor(places.find((p) => p.id === start.placeId)!, start.year), role: start.role, characterName: start.role }, seed);
    found = { setting, description: describeSetting(setting), needsInterpretation: false };
  }
  if ("error" in found) return found;
  const named = /\b(?:spring|summer|autumn|fall|winter)\b/i.test(input);
  const setting = { ...found.setting, ...(condition ? { condition } : {}), ...(weather ? { weather } : {}), ...(season && !named ? { season } : {}), ...(room.length ? { startIn: room[0][1] } : {}) };
  return { ...found, setting, description: describeSetting(setting) };
}

const workLabels = livelihoodIds.map(livelihoodById).flatMap((l) => !l ? [] : [
  { label: l.label, years: l.years, bounds: l.bounds },
  ...(l.labels ?? []).map((x) => ({ label: x.label, years: x.scope.years, bounds: x.scope.bounds ?? l.bounds })),
]).sort((a, b) => b.label.length - a.label.length);

/** "A car thief", "a thief": no place or date, so pick a city and a year
 * where the work was done. */
function roleStart(input: string, seed: string): ReturnType<typeof resolvePrompt> {
  const q = normalize(input);
  const work = workLabels.find((w) => has(q, w.label)) ?? (/\bthie(?:f|ves)\b/.test(q) ? workLabels.find((w) => w.label === "Pickpocket") : undefined);
  if (!work) return { error: "No place or period matched. Try a place such as Normandy, Beijing, Haiti, London, or Alexandria; or choose one from the list." };
  const [from, to] = [Math.max(work.years?.[0] ?? -500, -3000), Math.min(work.years?.[1] ?? 2021, 2021)];
  const [w, s, e, n] = work.bounds ?? [-180, -90, 180, 90];
  const pool = places.filter((p) => p.settlement === "city" && p.lat >= s && p.lat <= n && (w <= e ? p.lon >= w && p.lon <= e : p.lon >= w || p.lon <= e));
  for (let i = 0; i < 8 && pool.length; i++) {
    const place = pool[Math.floor(random(seed, "role-start", q, i) * pool.length)];
    const year = from + Math.floor(random(seed, "role-year", q, i) * (to - from));
    const found = resolvePrompt(`${input} in ${place.name}, ${formatHistoricalYear(year)}`, seed);
    if ("setting" in found && found.setting.role !== "Traveler") return found;
  }
  return { error: `No town matched for a ${work.label.toLowerCase()}. Try naming a place and year.` };
}

const OVERLOOK_PROMPT =
  /\b(?:the\s+shining|overlook(?:\s+hotel)?|the\s+gold\s+room|jack\s+torrance|wendy\s+torrance|danny\s+torrance|dick\s+hallorann|room\s+237|redrum|lloyd\s+(?:the\s+bartender|in\s+the\s+gold\s+room)|grady\s+twins|delbert\s+grady|overlook\s+(?:hedge\s+)?maze)\b/i;

function overlookFromPrompt(input: string, seed: string) {
  if (!OVERLOOK_PROMPT.test(input)) return undefined;
  const year = dateFromPrompt(input, 1980, seed);
  const season = /\b(?:spring|summer|autumn|fall|winter)\b/i.exec(input)?.[0].toLowerCase().replace("fall", "autumn") as WorldSetting["season"] | undefined
    ?? (year === 1921 ? "summer" : "winter");
  const place: AtlasPlace = {
    id: "overlook-hotel",
    name: "Overlook Hotel, Colorado",
    aliases: ["overlook", "the shining"],
    lon: -105.52,
    lat: 40.38,
    climate: "boreal",
    relief: 0.25,
    water: "none",
    culture: "european",
    year,
    settlement: "city",
    architecture: "board",
    population: 4000,
  };
  const s = settingFor(place, year);
  const wendy = /\bwendy\b/i.test(input);
  const danny = /\bdanny\b/i.test(input);
  const hallorann = /\bhallorann\b/i.test(input);
  s.characterName = wendy ? "Wendy Torrance" : danny ? "Danny Torrance" : hallorann ? "Dick Hallorann" : "Jack Torrance";
  s.role = wendy ? "Caretaker's Wife" : danny ? "Caretaker's Son" : hallorann ? "Head Chef" : "Winter Caretaker";
  s.season = season;
  if (season === "winter") s.weather = /\bblizzard\b/i.test(input) ? "blizzard" : "snow";
  s.startIn = "hotel";
  s.brief = {
    ...s.brief,
    figure: s.characterName,
    sex: wendy ? "female" : "male",
    work: hallorann ? "cook" : "caretaker",
  };
  if (/\b(?:hedge\s+)?maze\b/i.test(input)) s.venueRoom = "Overlook Hedge Maze";
  else if (/\b237\b/.test(input)) s.venueRoom = "Room 237";
  else if (/\bgold\s+room\b|\blloyd\b/i.test(input)) s.venueRoom = "The Gold Room";
  else if (/\brestroom\b|\bdelbert\b/i.test(input)) s.venueRoom = "Gold Room Restroom";
  else if (/\bkitchen\b|\bhallorann\b/i.test(input)) s.venueRoom = "Overlook Kitchen";
  else if (/\bredrum\b|\bquarters\b/i.test(input)) s.venueRoom = "Torrance Quarters";
  else if (/\bcorridor\b|\bgrady\s+twins\b|\bhexagon\b|\belevator\b/i.test(input)) s.venueRoom = "Second-Floor Corridor";
  else if (/\blobby\b/i.test(input)) s.venueRoom = "Overlook Lobby";
  else s.venueRoom = "Colorado Lounge";
  const setting = populateCharacter(s, seed);
  return { setting, description: describeSetting(setting), needsInterpretation: false };
}

function resolvePrompt(
  input: string,
  seed = "earth-2",
  court = true,
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
  const overlook = overlookFromPrompt(input, seed);
  if (overlook) return overlook;
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
  let requestedYear: number;
  try { requestedYear = dateFromPrompt(input, -1000001, seed); }
  catch (error) { return { error: error instanceof Error ? error.message : "Invalid starting date." }; }
  const resident = residentFromPrompt(q, seed, requestedYear);
  const [figure, title, sex, born, first, last, homeRoom] = resident?.person ?? [];
  const locationWords = resident ? resident.aliases.reduce((text, name) => text.replace(name, ""), q) : q;
  const generic = new Set(periods.flatMap(([words]) => words));
  const matches = places
    .map((place) => ({
      place,
      score: Math.max(
        0,
        ...[place.name, ...place.aliases]
          .filter((a) => has(locationWords, a))
          .map((a) => (generic.has(a) ? 0.1 : normalize(a).length)),
      ),
    }))
    .filter((p) => p.score)
    .sort((a, b) => b.score - a.score);
  const zone = zones.find(([words]) => words.some((w) => has(locationWords, w)));
  const choices = zone ? places.filter((p) => zone[1].includes(p.id)) : [];
  let place = matches[0]?.place;
  if ((!place || matches[0].score <= 0.1) && choices.length)
    place =
      choices[Math.floor(random(seed, "starting-region", q) * choices.length)];
  const located = !!zone || (matches[0]?.score ?? 0) > 0.1 || has(locationWords, "roman");
  const requestedFair = resident?.venue ?? fairFromPrompt(q, located ? place : undefined);
  const explicitBelow = belowFromPrompt(q);
  const below = explicitBelow === "prison" ? "prison" : requestedFair ? "fair" : explicitBelow;
  const undated = requestedYear === -1000001;
  if (below && (!located || (requestedFair?.named?.test(q) && (matches[0]?.score ?? 0) <= 0.1))) {
    const fair = requestedFair;
    const [id, year] = below === "ship" ? shipPlace(q) : below === "fair" && fair ? [fair.place, fair.years[0]] : below === "tomb" ? tombFromPrompt(q)?.place ?? BELOW_PLACES.tomb : below === "catacomb" && PARIS_BONES.test(q) ? ["paris", 1810] : BELOW_PLACES[below];
    const found = places.find((p) => p.id === id);
    if (found) place = year && undated ? { ...found, year } : found;
  } else if (place && below === "fair" && undated) place = { ...place, year: requestedFair?.years[0] ?? 1889 };
  else if (place && below && below !== "cave" && below !== "ship" && below !== "tomb" && below !== "prison" && below !== "catacomb" && undated) place = { ...place, year: Math.max(place.year, 1880) };
  else if (place && undated && vesselOf(q)) place = { ...place, year: vesselOf(q)![3] };
  else if (place && undated && below === "tomb" && tombFromPrompt(q)) place = { ...place, year: tombFromPrompt(q)!.place[1] };
  else if (place && undated && below === "catacomb") place = { ...place, year: PARIS_BONES.test(q) ? 1810 : 380 };
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
    const defaultYear = first !== undefined && last !== undefined ? Math.min(first + 1, last) : place.year;
    let year = dateFromPrompt(locationWords, defaultYear, seed);
    const period = periods.find(([words]) => words.some((w) => has(locationWords, w)));
    if (requestedFair && period && !/\d/.test(q)) {
      const from = Math.max(period[1], requestedFair.years[0]), to = Math.min(period[2], requestedFair.years[1]);
      if (from <= to) year = from + Math.floor(random(seed, "starting-year", q) * (to - from + 1));
    }
    if (resident && first !== undefined && last !== undefined && (year < first || year > last || place.id !== resident.venue.place))
      return { error: `${figure} is playable in ${places.find((p) => p.id === resident.venue.place)?.name}, ${formatHistoricalYear(first)}–${formatHistoricalYear(last)}.` };
    const port=/\b(dockworker|longshoreman|stevedore|docklands|docks|port|wharf|terminal|eemhaven|maasvlakte)\b/.test(q) && berthFor(place.id,year);
    const wantsBank=/\b(fisher|fisherman|fisherwoman|fishing|boatwright|boatman|stevedore|longshoreman|dockworker|waterfront|docks)\b/.test(q);
    const sailingQuay=sailingPort(place.id,year) && /\b(porter|sailor|lighterman|quay|wharf|docklands|port|harbou?r|beurs|exchange|broker|moneylender|merchant|trader|baker|grocer)\b/.test(q);
    const bank=!port && (wantsBank || sailingQuay) && watersidePlace(place,year);
    const s = settingFor(port ? atBerth(place,port) : bank || place, year);
    if (port || bank) s.settlementPattern="waterfront";
    const roles: [RegExp, string][] = [
      [/\bhunter\b/, "Hunter"],
      [/\blegionary\b|\bsoldier\b/, "Legionary"],
      [/\bfarmer\b|\bpeasant\b/, "Farmer"],
      [/\bshaman\b/, "Shaman"],
      [/\bfisher(?:man|woman)?\b/, "Fisher"],
      [/\bbroker\b/, "Broker"],
      [/\bmoneylender\b/, "Moneylender"],
      [/\bmerchant\b|\btrader\b/, "Merchant"],
      [/\bshepherd\b/, "Shepherd"],
      [/\bweaver\b/, "Weaver"],
      [/\bthie(?:f|ves)\b/, "Pickpocket"],
      [/\bsailor\b/, "Sailor"],
      [/\b(?:stevedore|longshoreman|dockworker)\b/, s.year>=1850 ? "Dockworker" : "Porter"],
    ];
    // A generated palace exists only for some years: asked for outside them, the start is an ordinary one.
    const venue = resident?.venue ?? (below === "fair" ? venueFor(q, s.year, seed, s.lon, s.lat) : undefined), inside = below === "fair" && !venue ? undefined : below;
    const context = resolveCharacterContext(s);
    const namedRole = context.livelihoods.flatMap((livelihood) => [
      livelihood.label,
      ...[...(livelihood.labels ?? []), ...(localLabels[livelihood.id] ?? [])]
        .filter((label) => matchesCharacterScope(label.scope, s) &&
          (!label.ecologies || !!s.environment?.ecology && label.ecologies.includes(s.environment.ecology)))
        .map((label) => label.label),
    ]).sort((a, b) => b.length - a.length).find((label) => has(q, label));
    const offices = context.livelihoods.some(l => l.fromBeliefs) ? (populationFor(s)?.groups.map(g => g.community) ?? [context.community]).flatMap(c => beliefOptions(s,c).flatMap(b => officiantsFor(s,b.system))).filter(o => o.tier !== "household") : [];
    const genericOffice = ["priest","monk","nun"].find(term => has(q,term));
    const variants = genericOffice ? [...new Set(offices.filter(o => o.label.toLowerCase().split(" ").includes(genericOffice)).map(o => o.label))].sort() : [];
    const office = offices.find(o => has(q,o.label))?.label ??
      variants[Math.floor(random(seed,"office",s.placeId,genericOffice ?? "") * variants.length)];
    const coal = /\bcoal\b|\bcollier|\bpit\b/.test(q);
    // In a palace, the post the prompt names: a guard, a scribe, the ruler.
    const room = venue && requestedRoom(venue, q);
    const post = venue ? postFor(venue, title?.toLowerCase() ?? q) : undefined;
    const underRole = !inside ? undefined : below === "mine" ? (coal ? "Coal miner" : "Miner") : below === "sewer" ? (/\btosher/.test(q) ? "Tosher" : "Sewer flusher") : below === "cave" ? (s.year < -8000 ? "Hunter" : "Hermit")
      : below === "ship" ? vesselOf(q)?.[4] ?? (/\bstokers?\b/.test(q) ? "Stoker" : /\b(?:passengers?|emigrants?|steerage|pilgrims?)\b/.test(q) ? "Passenger" : "Sailor") : below === "fair" ? post?.role ?? venue?.role ?? "Visitor" : below === "tomb" ? (/\brobb/.test(q) ? "Tomb robber" : tombRole(tombFromPrompt(q) ?? tombAt(s.lon, s.lat, s.year), s.year)) : below === "catacomb" ? catacombRole(catacombKindAt(s.lon, s.lat, s.year), s.year) : below === "prison" ? (/\b(?:political|lifer|for life|forgotten)\b/.test(q) ? "Political prisoner" : /\bdebtor\b/.test(q) ? "Debtor" : /\bconvict\b/.test(q) ? "Convict" : "Prisoner") : undefined;
    s.role = title ?? post?.role ?? namedRole ?? office ?? roles.find(([pattern]) => pattern.test(q))?.[1] ?? underRole ?? "Traveler";
    if (inside) {
      s.below = below;
      if (venue) s.venue = venue.id;
      if (below === "tomb") s.venue = tombFromPrompt(q)?.id;
      if (below === "ship") s.ship = vesselOf(q)?.[1] ?? (/\bjunks?\b/.test(q) ? "junk" : /\b(?:dhows?|nakhoda)\b/.test(q) ? "dhow" : /\bgalleons?\b/.test(q) ? "galleon"
        : /\bindiam[ae]n\b/.test(q) ? "indiaman" : /\b(?:steam|stoker|liner)/.test(q) ? "steamer" : /\bemigrant\b/.test(q) ? "emigrant-ship" : undefined);
      const work = below === "mine" ? (coal && s.year >= 1780 ? "coal-miner" : "miner") : below === "sewer" ? (/\btosher/.test(q) ? "night-soil-collector" : "navvy") : below === "ship" ? vesselOf(q)?.[5] || (s.role === "Sailor" ? "sailor" : undefined) : undefined;
      if (work && !namedRole) s.brief = { ...s.brief, work };
      if (post) s.brief = { ...s.brief, work: post.work, sex: sex ?? post.sex, figure };
      s.venueRoom = room?.area.id ?? homeRoom ?? post?.room;
      if (born !== undefined) s.character = { age: year - born, appearanceSeed: figure, hunger: 10, fatigue: 0 };
    } else if (court && !below && s.role === "Traveler" && s.settlement === "city") {
      // Much of a capital lived in and around its ruler's house: some who name no work start there, in a post of the household.
      const court = courtStart(q, s.year, seed, s.lon, s.lat);
      if (court) { s.below = "fair"; s.venue = court.venue.id; s.role = court.role; s.brief = { ...s.brief, work: court.work }; }
    }
    if (has(q, "free black")) s.community = "Free Black household";
    s.characterName = figure ?? s.role;
    if (place.id==="ur" && year>=-1799 && year<=-1699 && /\bea[- ]nasir\b/.test(q)) {
      s.characterName="Ea-nasir"; s.role="Copper merchant"; s.brief={...s.brief,sex:"male"};
    }
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
      ...(resident?.aliases ?? []),
      ...(venue ? [venue.prompt.exec(q)?.[0], venue.named?.exec(q)?.[0], room?.label, venue.role, post?.match, title,
        "palace", "royal", "court", "household", "circa", "female", "male", "play as", "start as", "begin as"] : []),
      ...places.flatMap((p) => [p.name, ...p.aliases]),
      ...periods.flatMap(([words]) => words),
      ...zones.flatMap(([words]) => words),
      // A spacecraft in Renaissance Florence is not understood.
      "free black", ...(vesselOf(q) && (!vesselOf(q)![5] || year >= vesselOf(q)![3]) ? [vesselOf(q)![0].exec(q)?.[0]] : []),
      "sewer dweller", "sewer dwellers", "cave dweller", "sewer worker", "sewer man", "sewerman", "sewer", "sewers", "tosher", "flusher", "cave man", "caveman", "cave woman", "cave", "caves", "cavern", "grotto",
      "coal miner", "coal mine", "miner", "miners", "mine", "mining", "collier", "colliery", "pit man", "pitman", "pit boy", "hewer", "down the pit",
      "tomb robber", "tomb robbers", "burial chamber", "valley of the kings", "tomb", "tombs", "castle", "castles",
      "catacomb", "catacombs", "crypt", "crypts", "ossuary", "ossuaries", "charnel house", "charnel", "undercroft", "fossor", "fossores", "empire of the dead",
      "prisoner", "prisoners", "convict", "convicts", "inmate", "inmates", "debtor", "debtors", "gaol", "jail", "prison", "dungeon", "oubliette", "cellblock",
    ];
    for (const phrase of recognized.filter((word): word is string => !!word).sort((a, b) => b.length - a.length))
      rest = rest.split(` ${normalize(phrase).replace(/-/g, " ")} `).join(" ");
    rest = rest.replace(
      /\b\d+(?:st|nd|rd|th)?\b|\b(?:bce|bc|ce|ad|century|year)\b/g,
      " ",
    );
    if (namedRole)
      rest = rest.split(` ${normalize(namedRole).replace(/-/g, " ")} `).join(" ");
    for (const [pattern] of roles)
      rest = rest.replace(new RegExp(pattern.source, "g"), " ");
    if (office) rest = rest.split(` ${has(q,office) ? normalize(office) : genericOffice} `).join(" ");
    rest = rest
      .replace(
        /\b(?:a|an|the|in|at|of|from|during|as|and|or|guy|man|woman|person|spring|summer|autumn|winter|camp|life)\b/g,
        " ",
      )
      .trim();
    const dated = !undated;
    // An underground or shipboard start with no place has its own default place.
    const needsInterpretation = (!venue && !inside && (!located || !dated)) || !!rest;
    const setting = populateCharacter(s, seed);
    return {
      setting,
      description: describeSetting(setting),
      needsInterpretation,
      reason: !needsInterpretation ? undefined : !venue && !located
        ? "No specific place or culture zone was identified."
        : !venue && !dated
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
