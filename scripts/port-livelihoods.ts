/*
 * Ports the Historical Persona Generator's society-capability table and its
 * common-work substrate into UHS.
 *
 * HPG gates ordinary work on what a society could actually do at a place and
 * year — a smith needs smelting, a market seller needs markets, a scribe needs
 * writing. UHS had three gates (water, settled, cultivation) and eight jobs.
 *
 * The capability dates come across by calling HPG's own resolver, so they stay
 * in step with it. HPG's place exceptions are matched on place-name regexes and
 * are re-expressed as boxes in scripts/data/capability-overrides.json; the work
 * itself is parsed out of commonProfessions.ts, whose roles are one per line.
 *
 * Reads the snapshot in scripts/data/hpg; refresh it with vendor-hpg.ts.
 *
 * Run: npx tsx scripts/port-livelihoods.ts
 */
import { readFileSync, writeFileSync } from "node:fs";

const CAPABILITY_TABLE = JSON.parse(
  readFileSync("scripts/data/hpg/capabilities.json", "utf8"),
) as Record<string, Record<string, (number | string)[]>>;
/** Infinities are spelled out in the snapshot; see vendor-hpg.ts. */
const unnum = (v: number | string | undefined, fallback: number) =>
  v === undefined ? fallback
  : typeof v === "number" ? v
  : v === "Infinity" ? Infinity
  : -Infinity;
const capabilityAvailableFrom = (c: string, x: { culturalZone: string }) =>
  unnum(CAPABILITY_TABLE[c]?.[x.culturalZone]?.[0], -Infinity);
const capabilityAvailableUntil = (c: string, x: { culturalZone: string }) =>
  unnum(CAPABILITY_TABLE[c]?.[x.culturalZone]?.[1], Infinity);

const CAPABILITIES = [
  "writing", "metallurgy", "settled_agriculture", "heritable_land", "draft_animals",
  "guilds", "coinage", "urban_settlement", "european_contact", "market_exchange",
  "wage_labor", "retained_military_service", "guild_apprenticeship",
] as const;

/** HPG's eight cultural zones against UHS's twelve cultures. */
const ZONE_CULTURES: Record<string, string[]> = {
  EUROPEAN: ["european"],
  MENA: ["north-african-west-asian"],
  EAST_ASIAN: ["east-asian", "inner-eurasian"],
  SOUTH_ASIAN: ["south-asian"],
  SOUTHEAST_ASIAN: ["southeast-asian"],
  SUB_SAHARAN_AFRICAN: ["west-central-african", "east-southern-african"],
  SOUTH_AMERICAN: ["andean"],
  NORTH_AMERICAN_PRE_COLUMBIAN: ["other-indigenous-american", "mesoamerican"],
  OCEANIA: ["australian-pacific"],
};

const FLOOR = -1000000, CEIL = 10001;
const clamp = (y: number) => (!Number.isFinite(y) ? (y < 0 ? FLOOR : CEIL) : Math.round(y));

const windows: { capability: string; culture: string; from: number; to: number }[] = [];
for (const capability of CAPABILITIES) {
  for (const [zone, cultures] of Object.entries(ZONE_CULTURES)) {
    const from = capabilityAvailableFrom(capability, { culturalZone: zone });
    const to = capabilityAvailableUntil(capability, { culturalZone: zone });
    for (const culture of cultures)
      windows.push({ capability, culture, from: clamp(from), to: clamp(to) });
  }
}

const scopes = JSON.parse(
  readFileSync("scripts/data/livelihood-scope.json", "utf8"),
).roles as Record<string, any>;
const tierDates: Record<string, [number, number]> = scopes._tierDates ?? {};

const overrides = JSON.parse(readFileSync("scripts/data/capability-overrides.json", "utf8"));
const work = JSON.parse(readFileSync("scripts/data/livelihood-work.json", "utf8"));

/* --- the work itself ---------------------------------------------------- */

const source = readFileSync(
  "scripts/data/hpg/commonProfessions.ts.txt",
  "utf8",
);
const TIERS = ["PREHISTORIC_WORK", "VILLAGE_WORK", "TOWN_WORK", "INDUSTRIAL_WORK", "MODERN_WORK"];
const shorthand = {
  HEAVY: { minStrength: 5, minStamina: 4 },
  STEADY: { minStamina: 3 },
  DEFT: { minDexterity: 4 },
  CAREFUL: { minDexterity: 4, minPerception: 4 },
};

type Role = {
  id: string; label: string; tier: string; activity: string;
  inventory: Record<string, number>;
  needs: string[]; needsAny: string[]; excludes: string[];
  sex?: "male" | "female";
};

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const roles = new Map<string, Role>();
for (const tier of TIERS) {
  const block = source.slice(source.indexOf(`const ${tier}: CommonRole[] = [`));
  for (const line of block.slice(0, block.indexOf("\n];")).split("\n")) {
    if (!line.startsWith("  r(")) continue;
    // The argument list is plain data plus the four shorthand stat profiles.
    const args = new Function(
      ...Object.keys(shorthand),
      `return [${line.trim().replace(/^r\(/, "").replace(/\),?$/, "")}]`,
    )(...Object.values(shorthand)) as [string, string, string, any?, any?];
    const [label, , keywords, extra = {}, gate = {}] = args;
    const id = slug(label);
    const key = keywords.split(/\s+/).find((k: string) => work.keywords[k]);
    const shape = work.keywords[key ?? ""] ?? work._default;
    // A role in more than one tier keeps the earliest; the tiers are ordered.
    if (roles.has(id)) continue;
    roles.set(id, {
      id, label, tier: tier.replace("_WORK", "").toLowerCase(),
      activity: shape.activity, inventory: shape.inventory,
      needs: gate.needs ?? [], needsAny: gate.needsAny ?? [], excludes: gate.excludes ?? [],
      sex: extra.genderBias === "Male" ? "male" : extra.genderBias === "Female" ? "female" : undefined,
    });
  }
}

/* --- the food ----------------------------------------------------------- */

/*
 * HPG keeps its farming, herding and fishing in a separate culture-keyed table
 * that this script never read, which is why not one of the 130 ported roles
 * grew anything: a Neolithic village was a street of specialist artisans. The
 * table is already regional -- taro and reef fishing for Oceania, llama
 * herding and potatoes for the Andes, dates and goats for MENA -- so it
 * carries the culture scope with it.
 *
 * The era keys upstream are sparse (three of twelve), and subsistence work is
 * not era-bound the way a trade is: a taro cultivator in 600 is a taro
 * cultivator in 1600. So the era key is ignored and the dates come from
 * scripts/data/livelihood-scope.json, where the cash crops and colonial
 * tenures that genuinely are late are dated as such.
 */
const AGRARIAN_ZONES: Record<string, string[]> = {
  EUROPEAN: ["european"],
  MENA: ["north-african-west-asian"],
  EAST_ASIAN: ["east-asian", "inner-eurasian"],
  SOUTH_ASIAN: ["south-asian"],
  SUB_SAHARAN_AFRICAN: ["west-central-african", "east-southern-african"],
  SOUTH_AMERICAN: ["andean"],
  NORTH_AMERICAN_COLONIAL: ["other-indigenous-american", "mesoamerican"],
  OCEANIA: ["australian-pacific"],
};
const agrarian = source.slice(
  source.indexOf("AGRARIAN_BACKFILL"),
  source.indexOf("FUTURE_FARMING"),
);
const coreFarming = /const CORE_FARMING[^=]*= \{([\s\S]*?)\n\};/.exec(source)?.[1] ?? "";
const roleLine = /^\s+'([A-Za-z' -]+)': \{.*?keywords: '([^']*)'/;
const genderOf = (line: string) =>
  /genderBias: 'Male'/.test(line) ? "male"
  : /genderBias: 'Female'/.test(line) ? "female"
  : undefined;

/** id -> the cultures that offer it, unioned across zones. */
const agrarianCultures = new Map<string, Set<string>>();
let zone: string | undefined;
for (const line of agrarian.split("\n")) {
  const z = /^  ([A-Z_]+): \{/.exec(line);
  if (z) { zone = z[1]; continue; }
  const cultures = AGRARIAN_ZONES[zone ?? ""] ?? [];
  if (!cultures.length) continue;
  const lines = line.includes("CORE_FARMING") ? coreFarming.split("\n") : [line];
  for (const l of lines) {
    const m = roleLine.exec(l);
    if (!m) continue;
    const [, label, keywords] = m;
    const id = slug(label);
    if (!agrarianCultures.has(id)) agrarianCultures.set(id, new Set());
    for (const c of cultures) agrarianCultures.get(id)!.add(c);
    if (roles.has(id)) continue;
    const key = keywords.split(/\s+/).find((k: string) => work.keywords[k]);
    if (!key) { console.error(`no work keyword for ${label} (${keywords})`); continue; }
    const shape = work.keywords[key];
    roles.set(id, {
      id, label, tier: "village",
      activity: shape.activity, inventory: shape.inventory,
      needs: [], needsAny: [], excludes: [],
      sex: genderOf(l) as Role["sex"],
    });
  }
}

/* Subsistence bases the upstream table has no entry for, authored in UHS. */
const EXTRA = JSON.parse(
  readFileSync("scripts/data/livelihood-scope.json", "utf8"),
).extraRoles as Record<string, any>;
for (const [id, r] of Object.entries(EXTRA)) {
  if (id.startsWith("_")) continue;
  const shape = work.keywords[r.keyword];
  if (!shape) { console.error(`extra role ${id}: unknown keyword ${r.keyword}`); continue; }
  roles.set(id, {
    id, label: r.label, tier: r.tier ?? "village",
    activity: shape.activity, inventory: shape.inventory,
    needs: r.capabilities ?? [], needsAny: [], excludes: [],
    sex: r.sex,
  });
  scopes[id] = { ...r, ...(scopes[id] ?? {}) };
}

/* --- output ------------------------------------------------------------- */

const header = `// Generated by scripts/port-livelihoods.ts from the Historical Persona
// Generator. Do not edit by hand; edit the source, scripts/data/livelihood-work.json
// or scripts/data/capability-overrides.json and re-run.
`;

writeFileSync(
  "src/content/characters/capabilities.generated.ts",
  header +
    `import type { CapabilityOverride, CapabilityWindow } from "./context-types";\n\n` +
    `export const capabilityWindows: readonly CapabilityWindow[] = [\n` +
    windows.map((w) =>
      `  { capability: ${JSON.stringify(w.capability)}, culture: ${JSON.stringify(w.culture)}, from: ${w.from}, to: ${w.to} },`,
    ).join("\n") +
    `\n];\n\n` +
    `/** Places the zone date gets wrong. The narrowest matching box wins. */\n` +
    `export const capabilityOverrides: readonly CapabilityOverride[] = [\n` +
    overrides.overrides.map((o: any) =>
      `  {\n    id: ${JSON.stringify(o.id)},\n    label: ${JSON.stringify(o.label)},\n` +
      `    bounds: ${JSON.stringify(o.bounds)},\n` +
      (o.cultures ? `    cultures: ${JSON.stringify(o.cultures)},\n` : "") +
      `    capabilities: {\n` +
      Object.entries(o.capabilities).map(([c, y]) =>
        `      ${c}: ${y === null ? CEIL : clamp(y as number)},`,
      ).join("\n") +
      `\n    },\n  },`,
    ).join("\n") +
    `\n];\n`,
);

writeFileSync(
  "src/content/characters/livelihoods.generated.ts",
  header +
    `import type { Livelihood } from "./context-types";\n\n` +
    `/** The ordinary work, gated on what the society could do. */\n` +
    `export const commonLivelihoods: readonly Livelihood[] = [\n` +
    [...roles.values()].map((r) =>
      `  {\n    id: ${JSON.stringify(r.id)},\n    label: ${JSON.stringify(r.label)},\n` +
      `    activity: ${JSON.stringify(r.activity)},\n    tier: ${JSON.stringify(r.tier)},\n` +
      ((sc: any, years: any) =>
        (years ? `    years: [${years[0]}, ${years[1]}],\n` : "") +
        (sc?.bounds ? `    bounds: ${JSON.stringify(sc.bounds)},\n` : "") +
        ((cs: string[] | undefined) =>
          cs?.length ? `    cultures: ${JSON.stringify(cs)},\n` : "")(
          sc?.cultures ?? (agrarianCultures.has(r.id)
            ? [...agrarianCultures.get(r.id)!]
            : undefined),
        ) +
        (sc?.ecologies ? `    ecologies: ${JSON.stringify(sc.ecologies)},\n` : "") +
        (sc?.minPopulation ? `    minPopulation: ${sc.minPopulation},\n` : "") +
        (sc?.weight ? `    weight: ${sc.weight},\n` : "") +
        (sc?.workplace ? `    workplace: ${JSON.stringify(sc.workplace)},\n` : "") +
        (sc?.fromBeliefs ? `    fromBeliefs: true,\n` : ""))(
        scopes[r.id],
        scopes[r.id]?.years ?? tierDates[r.tier],
      ) +
      (r.needs.length ? `    capabilities: ${JSON.stringify(r.needs)},\n` : "") +
      (r.needsAny.length ? `    anyCapability: ${JSON.stringify(r.needsAny)},\n` : "") +
      (r.excludes.length ? `    withoutCapability: ${JSON.stringify(r.excludes)},\n` : "") +
      (r.sex ? `    sex: ${JSON.stringify(r.sex)},\n` : "") +
      `    inventory: ${JSON.stringify(r.inventory)},\n  },`,
    ).join("\n") +
    `\n];\n`,
);

const byTier = [...roles.values()].reduce<Record<string, number>>(
  (n, r) => ({ ...n, [r.tier]: (n[r.tier] ?? 0) + 1 }), {},
);
console.error(
  `${roles.size} roles (${Object.entries(byTier).map(([t, n]) => `${t} ${n}`).join(", ")}), ` +
  `${windows.length} capability windows, ${overrides.overrides.length} place overrides`,
);
