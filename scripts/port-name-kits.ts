/*
 * Ports the Historical Persona Generator's name data into UHS.
 *
 * HPG keeps 200-odd gendered name sets and a region x period table saying which
 * of them apply where. UHS needs the same information keyed by bounding box and
 * astronomical year. The traditions come across verbatim; the geography does
 * not exist in HPG, so it is authored in scripts/data/name-regions.json.
 *
 * Run: npx tsx scripts/port-name-kits.ts [path-to-hpg]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";

const hpg =
  process.argv[2] ?? `${process.env.HOME}/code/historical-persona-generator`;
const src = (p: string) => resolvePath(hpg, "src/constants/characterData", p);

const { CHARACTER_NAMES, REGION_NAME_MAPPING } = await import(src("names.ts"));
const { nameSetEarliestYear, nameSetLatestYear } = await import(
  src("nameSetEras.ts")
);

const geo = JSON.parse(
  readFileSync("scripts/data/name-regions.json", "utf8"),
) as {
  _skip: string[];
  regions: Record<string, { bounds: number[]; culture: string }>;
};
const skip = new Set(geo._skip);

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
  reconstructed: boolean;
};

const traditions = new Map<string, Tradition>();
for (const [key, set] of Object.entries(CHARACTER_NAMES) as [string, any][]) {
  const surnames: string[] = set.surname ?? [];
  const real = surnames.filter((n) => n && !PLACEHOLDER.test(n));
  const masculine = (set.male ?? []).filter(Boolean);
  const feminine = (set.female ?? []).filter(Boolean);
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
    reconstructed: RECONSTRUCTED.test(key),
  });
}

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

    for (const rule of rules) {
      // A rule with only `before` has no floor in HPG and reaches to the
      // beginning of time; the per-tradition era gate below is what stops it.
      let start = Math.max(rule.after ?? -Infinity, alias.from ?? -Infinity);
      let end = Math.min(rule.before ?? Infinity, alias.to ?? Infinity);
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

for (const [id, r] of regions) if (!r.windows.length) regions.delete(id);

const used = new Set<string>();
for (const r of regions.values())
  for (const w of r.windows) for (const o of w.options) used.add(o.tradition);
for (const t of traditions.values())
  if (!used.has(t.id)) traditions.delete(t.key);

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
          `    note: ${JSON.stringify(
            t.reconstructed
              ? "Reconstructed forms, not attested individuals."
              : "Name components from the attested tradition; combinations are fictional.",
          )},\n  },`,
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
if (missingBounds.size)
  console.error(
    `\nno bounds authored for:\n  ${[...missingBounds].join("\n  ")}`,
  );
if (unknownKeys.size)
  console.error(
    `\nreferenced but absent from CHARACTER_NAMES: ${[...unknownKeys].join(", ")}`,
  );
