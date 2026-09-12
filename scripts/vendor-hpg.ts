/*
 * Copies the Historical Persona Generator's source data into scripts/data/hpg.
 *
 * The port scripts used to import from a sibling checkout, so the name era
 * gates, the region/period table and the whole profession table could not be
 * regenerated — or even read — without it. Everything they need is snapshotted
 * here instead, with the commit it came from.
 *
 * Run: npx tsx scripts/vendor-hpg.ts [path-to-hpg]
 */
import { execFileSync } from "node:child_process";
import { copyFileSync, writeFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";

const hpg =
  process.argv[2] ?? `${process.env.HOME}/code/historical-persona-generator`;
const src = (p: string) => resolvePath(hpg, "src/constants", p);
const out = (p: string) => `scripts/data/hpg/${p}`;

const { CHARACTER_NAMES, REGION_NAME_MAPPING } = await import(
  src("characterData/names.ts")
);
const { nameSetEarliestYear, nameSetLatestYear } = await import(
  src("characterData/nameSetEras.ts")
);
const { capabilityAvailableFrom, capabilityAvailableUntil } = await import(
  src("societyCapabilities.ts")
);

const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: hpg,
  encoding: "utf8",
}).trim();

/* JSON has no infinities and turns them into null, which would read back as a
 * finite bound and flip "never available" into "always". Spell them out. */
const num = (y: number) =>
  Number.isFinite(y) ? Math.round(y) : y > 0 ? "Infinity" : "-Infinity";

const write = (name: string, data: unknown) =>
  writeFileSync(out(name), JSON.stringify(data, null, 1) + "\n");

write("provenance.json", {
  source: "historical-persona-generator",
  commit,
  vendored: new Date().toISOString().slice(0, 10),
  note: "Regenerate with scripts/vendor-hpg.ts. The port scripts read only these files.",
});

write("names.json", CHARACTER_NAMES);
write("region-mapping.json", REGION_NAME_MAPPING);

/* The era gate is a pair of functions upstream; flatten it to a table so the
 * port script can both clip windows and emit a per-tradition range. */
const eras: Record<string, (number | string)[]> = {};
for (const key of Object.keys(CHARACTER_NAMES))
  eras[key] = [nameSetEarliestYear(key), nameSetLatestYear(key)].map(num) as any;
write("name-eras.json", eras);

const CAPABILITIES = [
  "writing", "metallurgy", "settled_agriculture", "heritable_land",
  "draft_animals", "guilds", "coinage", "urban_settlement", "european_contact",
  "market_exchange", "wage_labor", "retained_military_service",
  "guild_apprenticeship",
] as const;
const ZONES = [
  "EUROPEAN", "MENA", "EAST_ASIAN", "SOUTH_ASIAN", "SOUTHEAST_ASIAN",
  "SUB_SAHARAN_AFRICAN", "SOUTH_AMERICAN", "NORTH_AMERICAN_PRE_COLUMBIAN",
  "OCEANIA",
];
const caps: Record<string, Record<string, (number | string)[]>> = {};
for (const capability of CAPABILITIES) {
  caps[capability] = {};
  for (const culturalZone of ZONES)
    caps[capability][culturalZone] = [
      num(capabilityAvailableFrom(capability, { year: 0, culturalZone })),
      num(capabilityAvailableUntil(capability, { year: 0, culturalZone })),
    ] as any;
}
write("capabilities.json", caps);

/* The profession table is parsed as source text, not imported, so it is copied
 * verbatim rather than serialised. */
copyFileSync(src("characterData/commonProfessions.ts"), out("commonProfessions.ts.txt"));

console.log(`vendored HPG @ ${commit.slice(0, 8)}`);
console.log(`  ${Object.keys(CHARACTER_NAMES).length} name sets`);
console.log(`  ${Object.keys(REGION_NAME_MAPPING).length} zones`);
