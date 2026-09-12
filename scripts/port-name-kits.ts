/*
 * Ports the Historical Persona Generator's name data into UHS.
 *
 * HPG keeps 200-odd gendered name sets and a region x period table saying which
 * of them apply where. UHS needs the same information keyed by bounding box and
 * astronomical year. The traditions come across verbatim; the geography does
 * not exist in HPG, so it is authored in scripts/data/name-regions.json.
 *
 * Reads the snapshot in scripts/data/hpg; refresh it with vendor-hpg.ts.
 *
 * Run: npx tsx scripts/port-name-kits.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { barredNameEntry } from "../src/content/characters/name-entries";

const load = (f: string) =>
  JSON.parse(readFileSync(`scripts/data/hpg/${f}`, "utf8"));

const CHARACTER_NAMES = load("names.json") as Record<string, any>;
const REGION_NAME_MAPPING = load("region-mapping.json") as Record<string, any>;
/* HPG dates when a people existed; several of its pools are modern name lists
 * that inherited that floor. These are UHS corrections, applied on top. */
const ERA_OVERRIDES: Record<string, { from?: number; to?: number }> = JSON.parse(
  readFileSync("scripts/data/name-eras-override.json", "utf8"),
).eras;

/** Infinities are spelled out in the snapshot; see vendor-hpg.ts. */
const unnum = (v: number | string) =>
  typeof v === "number" ? v : v === "Infinity" ? Infinity : -Infinity;

const NAME_ERAS = load("name-eras.json") as Record<string, (number | string)[]>;
const era = (key: string) => NAME_ERAS[key];
const nameSetEarliestYear = (key: string) =>
  ERA_OVERRIDES[key]?.from ?? (era(key) ? unnum(era(key)[0]) : -Infinity);
const nameSetLatestYear = (key: string) =>
  ERA_OVERRIDES[key]?.to ?? (era(key) ? unnum(era(key)[1]) : Infinity);

const geo = JSON.parse(
  readFileSync("scripts/data/name-regions.json", "utf8"),
) as {
  _skip: string[];
  regions: Record<string, { bounds: number[]; culture: string }>;
};
const skip = new Set(geo._skip);

/** Traditions authored in UHS; these replace an HPG set of the same id. */
const TRADITION_FILE = JSON.parse(
  readFileSync("scripts/data/name-traditions.json", "utf8"),
);
const AUTHORED: Record<string, any> = TRADITION_FILE.traditions;
/** Removed from the shipped table; see the reason beside each id. */
const RETIRED: Record<string, string> = TRADITION_FILE.retired ?? {};

/** UHS corrections to HPG's region/period table. */
const WINDOW_OVERRIDES: Record<
  string,
  { replace?: any[]; add?: any[] }
> = JSON.parse(readFileSync("scripts/data/name-windows.json", "utf8")).regions;

/** Citations are authored in UHS; the upstream name sets carry none. */
const SOURCES: Record<string, string[]> = JSON.parse(
  readFileSync("scripts/data/name-sources.json", "utf8"),
).sources;

/** UHS clamps open-ended scopes rather than storing infinities. */
const FLOOR = -1000000,
  CEIL = 10001;
const clampYear = (y: number) =>
  !Number.isFinite(y) ? (y < 0 ? FLOOR : CEIL) : Math.round(y);

/** Zones that are the same place at different dates share one bounds prefix. */
const ZONE_ALIAS: Record<
  string,
  { prefix: string; from?: number; to?: number }
> = {
  NORTH_AMERICAN_PRE_COLUMBIAN: { prefix: "NORTH_AMERICAN", to: 1600 },
  NORTH_AMERICAN: { prefix: "NORTH_AMERICAN", from: 1600 },
  SOUTH_AMERICAN: { prefix: "SOUTH_AMERICAN", to: 1533 },
  SOUTH_AMERICAN_COLONIAL: { prefix: "SOUTH_AMERICAN", from: 1533 },
};

/** Traditions whose family element precedes the personal one. */
const FAMILY_FIRST = new Set([
  "JAPANESE",
  "CHINESE_MANDARIN",
  "CHINESE_CANTONESE",
  "KOREAN",
  "KOREAN_ANCIENT",
  "VIETNAMESE",
  "MANCHU",
  "HUNGARIAN_MEDIEVAL",
  "HUNGARIAN_MODERN",
  "MONGOLIAN",
  "MONGOLIAN_TRADITIONAL",
  "TAIWAN_HOKKIEN",
]);

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const RECONSTRUCTED = /^PREHISTORIC_/;
const PLACEHOLDER = /^\(no surname\)$/i;

type Tradition = {
  id: string;
  key: string;
  label: string;
  masculine: string[];
  feminine: string[];
  familyNames: string[];
  noFamilyName: number;
  format: string;
  era: [number, number];
  reconstructed: boolean;
  sources?: string[];
  note?: string;
  patronymic?: { parents?: string[]; male: string; female: string };
};

const weeded: string[] = [];
const traditions = new Map<string, Tradition>();
for (const [key, set] of Object.entries(CHARACTER_NAMES) as [string, any][]) {
  /* The upstream sets were built by pulling words out of reference material,
   * so they carry place names, ethnonyms, deities, titles and living people.
   * Weeding happens here rather than in the snapshot, which stays a faithful
   * copy: the rule lives in one place and re-vendoring cannot undo it. */
  const usable = (n: string) => {
    if (!n) return false;
    const reason = barredNameEntry(n, slug(key));
    if (reason) weeded.push(`${key}: ${n} (${reason})`);
    return !reason;
  };
  const surnames: string[] = (set.surname ?? []).filter(usable);
  const real = surnames.filter((n) => n && !PLACEHOLDER.test(n));
  const masculine = (set.male ?? []).filter(usable);
  const feminine = (set.female ?? []).filter(usable);
  if (!masculine.length && !feminine.length) {
    console.error(`skipped empty tradition: ${key}`);
    continue;
  }
  traditions.set(key, {
    id: slug(key),
    key,
    label: key
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/^./, (c) => c.toUpperCase()),
    masculine,
    feminine,
    familyNames: [...new Set(real)],
    // The placeholder share is HPG's way of saying how often nobody carried one.
    noFamilyName: surnames.length
      ? +((surnames.length - real.length) / surnames.length).toFixed(2)
      : 1,
    format: !real.length
      ? "personal"
      : FAMILY_FIRST.has(key)
        ? "family-personal"
        : "personal-family",
    era: [
      clampYear(nameSetEarliestYear(key)),
      clampYear(nameSetLatestYear(key)),
    ],
    reconstructed: RECONSTRUCTED.test(key),
  });
}

for (const [id, t] of Object.entries(AUTHORED)) {
  // An authored tradition replaces the upstream set of the same id in place,
  // keeping the upstream key so region rules naming it still resolve.
  let key = `UHS::${id}`;
  for (const [existingKey, existing] of traditions)
    if (existing.id === id) key = existingKey;
  traditions.set(key, {
    id,
    key,
    label: t.label,
    masculine: t.masculine,
    feminine: t.feminine,
    familyNames: t.familyNames ?? [],
    noFamilyName: t.noFamilyName ?? 1,
    format: t.format ?? "personal",
    era: [clampYear(t.era[0]), clampYear(t.era[1])],
    reconstructed: false,
    sources: t.sources,
    note: t.note,
    patronymic: t.patronymic,
  });
}

for (const [key, t] of [...traditions])
  if (RETIRED[t.id]) traditions.delete(key);

type Window = {
  years: [number, number];
  options: { tradition: string; weight: number }[];
};
type Region = {
  id: string;
  label: string;
  bounds: number[];
  culture: string;
  windows: Window[];
};

const regions = new Map<string, Region>();
const missingBounds = new Set<string>();
const unknownKeys = new Set<string>();

for (const [zone, byRegion] of Object.entries(REGION_NAME_MAPPING) as [
  string,
  any,
][]) {
  const alias = ZONE_ALIAS[zone] ?? { prefix: zone };
  for (const [regionName, rules] of Object.entries(byRegion) as [
    string,
    any[],
  ][]) {
    const geoKey = `${alias.prefix}::${regionName}`;
    if (skip.has(geoKey) || skip.has(`${zone}::${regionName}`)) continue;
    const place = geo.regions[geoKey];
    if (!place) {
      missingBounds.add(geoKey);
      continue;
    }
    const id = slug(`${alias.prefix}-${regionName}`);
    const region = regions.get(id) ?? {
      id,
      label: `${regionName}`,
      bounds: place.bounds,
      culture: place.culture,
      windows: [],
    };
    regions.set(id, region);

    // Rules with only `before` are successive cutoffs -- "PIE before -400,
    // proto-Germanic before 200" means the second starts where the first ends.
    // Taking both from the floor made the later ones unreachable, because the
    // resolver stops at the first window that matches.
    let floor = -Infinity;
    for (const rule of rules) {
      const implicit = rule.after === undefined;
      let start = Math.max(
        rule.after ?? floor,
        alias.from ?? -Infinity,
      );
      let end = Math.min(rule.before ?? Infinity, alias.to ?? Infinity);
      if (implicit && rule.before !== undefined) floor = rule.before;
      if (!(start < end)) continue;

      const options: Window["options"] = [];
      for (const key of rule.keys as string[]) {
        const t = traditions.get(key);
        if (!t) {
          unknownKeys.add(key);
          continue;
        }
        // Drop a tradition that could not exist anywhere in this window.
        if (nameSetLatestYear(key) < start || nameSetEarliestYear(key) > end)
          continue;
        options.push({ tradition: t.id, weight: rule.weights?.[key] ?? 1 });
      }
      if (options.length)
        region.windows.push({
          years: [clampYear(start), clampYear(end)],
          options,
        });
    }
  }
}

/* UHS window overrides, applied after HPG's table. `replace` swaps a region's
 * windows wholesale; `add` merges and clips whatever HPG windows it overlaps,
 * so the two cannot both claim a year. */
const overlap = (a: Window, from: number, to: number) =>
  a.years[0] < to && a.years[1] > from;
for (const [id, patch] of Object.entries(WINDOW_OVERRIDES)) {
  const region = regions.get(id);
  if (!region) {
    console.error(`window override for unknown region: ${id}`);
    continue;
  }
  const asWindow = (w: any): Window => ({
    years: [clampYear(w.years[0]), clampYear(w.years[1])],
    options: w.options,
  });
  if (patch.replace) region.windows = patch.replace.map(asWindow);
  for (const raw of patch.add ?? []) {
    const w = asWindow(raw);
    const kept: Window[] = [];
    for (const old of region.windows) {
      if (!overlap(old, w.years[0], w.years[1])) {
        kept.push(old);
        continue;
      }
      if (old.years[0] < w.years[0])
        kept.push({ years: [old.years[0], w.years[0]], options: old.options });
      if (old.years[1] > w.years[1])
        kept.push({ years: [w.years[1], old.years[1]], options: old.options });
    }
    kept.push(w);
    region.windows = kept;
  }
  // An empty options list is how an override says "nobody is recorded here".
  region.windows = region.windows
    .filter((w) => w.options.length)
    .sort((a, b) => a.years[0] - b.years[0]);
}

/* Fill the hole the era corrections opened under each region: everything
 * earlier than its first plausible option fell through to one global invented
 * pool, so Palaeolithic Japan and Palaeolithic Peru produced the same names. */
const DEEP = JSON.parse(
  readFileSync("scripts/data/name-windows.json", "utf8"),
).deepTime;
for (const region of regions.values()) {
  const deep = DEEP.byCulture[region.culture];
  if (!deep || !traditions.has(`UHS::${deep}`)) continue;
  // The earliest year anything already here can actually be used.
  let first = Infinity;
  for (const w of region.windows)
    for (const o of w.options) {
      const t = [...traditions.values()].find((x) => x.id === o.tradition);
      if (t) first = Math.min(first, Math.max(w.years[0], t.era[0]));
    }
  const settled = DEEP.settledFrom[region.id];
  const from = clampYear(settled ?? -Infinity);
  const to = Math.min(first, CEIL);
  if (!(from < to)) continue;
  const end = clampYear(to);
  // An existing window may already start at the floor while every option in it
  // is era-gated out until later. Move it to where it actually begins, so the
  // two do not both claim the same start year and shadow each other.
  region.windows = region.windows.flatMap((w) =>
    w.years[0] >= from && w.years[0] < end
      ? w.years[1] > end
        ? [{ ...w, years: [end, w.years[1]] as [number, number] }]
        : []
      : [w],
  );
  region.windows.unshift({
    years: [from, end],
    options: [{ tradition: deep, weight: 1 }],
  });
}

/* Options came across with equal weight, so a window naming six traditions
 * made a sixth of the population each. Apply authored proportions, and fold
 * duplicate options together rather than letting a repeat count twice. */
const WEIGHTS = JSON.parse(
  readFileSync("scripts/data/name-windows.json", "utf8"),
).weights;
for (const region of regions.values())
  for (const w of region.windows) {
    const merged = new Map<string, number>();
    for (const o of w.options)
      merged.set(o.tradition, (merged.get(o.tradition) ?? 0) + o.weight);
    const authored = WEIGHTS[region.id]?.[String(w.years[0])];
    w.options = [...merged].map(([tradition, weight]) => ({
      tradition,
      weight: authored?.[tradition] ?? (authored ? 1 : weight),
    }));
  }

for (const [id, r] of regions) if (!r.windows.length) regions.delete(id);

const used = new Set<string>();
for (const r of regions.values())
  for (const w of r.windows) for (const o of w.options) used.add(o.tradition);
// Authored traditions are kept even when no window names them: a community
// profile can select one directly, which the region table knows nothing about.
for (const t of traditions.values())
  if (!used.has(t.id) && !AUTHORED[t.id]) traditions.delete(t.key);

const header = (
  what: string,
) => `// Generated by scripts/port-name-kits.ts from the Historical Persona
// Generator's name data. Do not edit by hand; edit the source or the region
// bounds in scripts/data/name-regions.json and re-run.
//
// ${what}
`;

const list = (v: readonly string[]) => JSON.stringify(v);

writeFileSync(
  "src/content/characters/profiles/traditions.generated.ts",
  header("Gendered name components per naming tradition.") +
    `import type { NameTradition } from "../context-types";\n\n` +
    `export const nameTraditions: readonly NameTradition[] = [\n` +
    [...traditions.values()]
      .map(
        (t) =>
          `  {\n    id: ${JSON.stringify(t.id)},\n    label: ${JSON.stringify(t.label)},\n` +
          `    masculine: ${list(t.masculine)},\n    feminine: ${list(t.feminine)},\n` +
          `    familyNames: ${list(t.familyNames)},\n    noFamilyName: ${t.noFamilyName},\n` +
          `    format: ${JSON.stringify(t.format)},\n` +
          `    era: [${t.era[0]}, ${t.era[1]}],\n` +
          (t.patronymic
            ? `    patronymic: ${JSON.stringify(t.patronymic)},\n`
            : "") +
          `    sources: ${list(t.sources ?? SOURCES[t.id] ?? [])},\n` +
          (t.note
            ? `    note: ${JSON.stringify(t.note)},\n`
            : t.reconstructed
              ? `    note: "Reconstructed forms, not attested individuals.",\n`
              : "") +
          `  },`,
      )
      .join("\n") +
    `\n];\n`,
);

writeFileSync(
  "src/content/characters/profiles/name-regions.generated.ts",
  header("Which traditions apply where and when. Bounds are [W, S, E, N].") +
    `import type { NameRegion } from "../context-types";\n\n` +
    `export const nameRegions: readonly NameRegion[] = [\n` +
    [...regions.values()]
      .map(
        (r) =>
          `  {\n    id: ${JSON.stringify(r.id)},\n    label: ${JSON.stringify(r.label)},\n` +
          `    bounds: ${JSON.stringify(r.bounds)},\n    culture: ${JSON.stringify(r.culture)},\n` +
          `    windows: [\n` +
          r.windows
            .map(
              (w) =>
                `      { years: [${w.years[0]}, ${w.years[1]}], options: [` +
                w.options
                  .map(
                    (o) =>
                      `{ tradition: ${JSON.stringify(o.tradition)}, weight: ${o.weight} }`,
                  )
                  .join(", ") +
                `] },`,
            )
            .join("\n") +
          `\n    ],\n  },`,
      )
      .join("\n") +
    `\n];\n`,
);

const names = [...traditions.values()].reduce(
  (n, t) => n + t.masculine.length + t.feminine.length + t.familyNames.length,
  0,
);
console.error(
  `${traditions.size} traditions, ${names} name components, ${regions.size} regions, ` +
    `${[...regions.values()].reduce((n, r) => n + r.windows.length, 0)} windows`,
);
if (weeded.length) {
  console.error(`\nweeded ${weeded.length} entries that are not personal names`);
  const thin = [...traditions.values()].filter(
    (t) => t.masculine.length < 12 || t.feminine.length < 12,
  );
  if (thin.length)
    console.error(
      `pools left under 12 per sex, needing authoring:\n  ${thin
        .map((t) => `${t.id} ${t.masculine.length}m/${t.feminine.length}f`)
        .join("\n  ")}`,
    );
}
if (missingBounds.size)
  console.error(
    `\nno bounds authored for:\n  ${[...missingBounds].join("\n  ")}`,
  );
if (unknownKeys.size)
  console.error(
    `\nreferenced but absent from CHARACTER_NAMES: ${[...unknownKeys].join(", ")}`,
  );
