/* Samples the ported naming data at a few places and dates. */
import { nameTraditions } from "../src/content/characters/profiles/traditions.generated";
import { nameRegions } from "../src/content/characters/profiles/name-regions.generated";
import { random } from "../src/core/random";

const byId = new Map(nameTraditions.map((t) => [t.id, t]));
const area = (b: readonly number[]) => (b[2] - b[0]) * (b[3] - b[1]);

function regionFor(lon: number, lat: number, year: number) {
  return nameRegions
    .filter(
      (r) =>
        lon >= r.bounds[0] &&
        lon <= r.bounds[2] &&
        lat >= r.bounds[1] &&
        lat <= r.bounds[3] &&
        r.windows.some((w) => year >= w.years[0] && year < w.years[1]),
    )
    .sort(
      (a, b) => area(a.bounds) - area(b.bounds) || a.id.localeCompare(b.id),
    )[0];
}

function personName(
  lon: number,
  lat: number,
  year: number,
  seed: string,
  id: string,
) {
  const region = regionFor(lon, lat, year);
  if (!region) return undefined;
  const options = region.windows.find(
    (w) => year >= w.years[0] && year < w.years[1],
  )!.options;
  const total = options.reduce((n, o) => n + o.weight, 0);
  let roll = random(seed, "name-tradition", id) * total;
  const chosen = options.find((o) => (roll -= o.weight) < 0) ?? options.at(-1)!;
  const t = byId.get(chosen.tradition)!;
  const female = random(seed, "sex", id) < 0.5;
  const pool = (female ? t.feminine : t.masculine).length
    ? female
      ? t.feminine
      : t.masculine
    : [...t.masculine, ...t.feminine];
  const personal = pool[Math.floor(random(seed, "personal", id) * pool.length)];
  const family =
    t.familyNames.length && random(seed, "family", id) >= t.noFamilyName
      ? t.familyNames[
          Math.floor(random(seed, "family-name", id) * t.familyNames.length)
        ]
      : undefined;
  const display = !family
    ? personal
    : t.format === "family-personal"
      ? `${family} ${personal}`
      : `${personal} ${family}`;
  return {
    region: region.label,
    tradition: t.id,
    display,
    sex: female ? "f" : "m",
  };
}

const places: [string, number, number, number][] = [
  ["Balkans", 22, 44, -4000],
  ["Balkans", 22, 44, 1450],
  ["Roman Italy", 12.5, 41.9, 50],
  ["Kyoto", 135.8, 35, 1200],
  ["Cusco", -72, -13.5, 1450],
  ["Cusco", -72, -13.5, 1700],
  ["Jamestown", -76.8, 37.2, 1610],
  ["Jamestown", -76.8, 37.2, 1200],
  ["Ife", 4.5, 7.5, 1300],
  ["Ava, Burma", 96, 21.9, 1450],
  ["Iceland", -21, 64, 1100],
  ["Uruk", 45.6, 31.3, -3000],
  ["Aotearoa", 174, -41, 1500],
  ["Sydney", 151, -33.8, -20000],
];
for (const [label, lon, lat, year] of places) {
  const roster = Array.from({ length: 8 }, (_, i) =>
    personName(lon, lat, year, "check", `p${i}`),
  );
  const region = roster.find(Boolean)?.region ?? "—";
  console.log(`\n${label} ${year}  [${region}]`);
  console.log(
    roster
      .map((p) => (p ? `${p.display} (${p.sex}, ${p.tradition})` : "NO REGION"))
      .join("\n  ")
      .replace(/^/, "  "),
  );
}
