import { containsDate, dateKey, eraAt, eras, validateRange } from "./dates";
import {
  categories,
  cultures,
  type Registry,
  type Rule,
  type ResolveInput,
  type Evidence,
  type Selection,
  type Fact,
  type FactKey,
} from "./types";

const ranks = { baseline: 0, regional: 1, local: 2 };
const factKeys = ["authority", "overlord", "claims", "language"];
export function validateRegistry(registry: Registry) {
  const unique = (ids: string[]) => {
    if (new Set(ids).size !== ids.length)
      throw Error("Duplicate historical registry ID");
    if (ids.some((id) => !/^[a-z0-9][a-z0-9.-]*$/.test(id)))
      throw Error("Invalid historical registry ID");
    return new Set(ids);
  };
  const defs = unique(registry.definitions.map((d) => d.id));
  const sources = unique(registry.sources.map((s) => s.id));
  const places = unique(registry.places.map((p) => p.id));
  unique(registry.rules.map((r) => r.id));
  const regions = new Set(registry.places.flatMap((p) => p.regions));
  const communities = new Set(registry.places.map((p) => p.community));
  const evidence = (e: Evidence) => {
    if (
      !e.claim ||
      !e.limitation ||
      !["documented", "inferred", "hypothesis", "fictional"].includes(e.status)
    )
      throw Error("Missing historical qualification");
    if (e.status !== "fictional" && !e.sources.length)
      throw Error("Historical claim needs a source");
    if (e.sources.some((s) => !sources.has(s)))
      throw Error("Unknown evidence source");
  };
  const selection = (s: Selection) => {
    if (!defs.has(s.id)) throw Error(`Unknown content definition: ${s.id}`);
    if (
      !["available", "excluded"].includes(s.availability) ||
      !["common", "uncommon", "rare"].includes(s.frequency) ||
      !["local", "imported", "surviving", "unspecified"].includes(s.supply) ||
      !s.contexts.length
    )
      throw Error("Invalid selection policy");
    evidence(s.evidence);
  };
  for (const d of registry.definitions) {
    if (
      !categories.includes(d.category) ||
      !d.label ||
      !["existing", "reference"].includes(d.delivery)
    )
      throw Error("Invalid definition");
  }
  for (const source of registry.sources)
    if (!/^https?:\/\//.test(source.url)) throw Error("Invalid source URL");
  for (const place of registry.places) {
    dateKey(place.sample);
    if (!cultures.some(([id]) => id === place.culture))
      throw Error("Unknown culture");
  }
  for (const kit of Object.values(registry.kits)) {
    unique(kit.map((s) => s.id));
    kit.forEach(selection);
  }
  for (const rule of registry.rules) {
    if (
      !cultures.some(([id]) => id === rule.culture) ||
      !Object.hasOwn(ranks, rule.level)
    )
      throw Error("Unknown rule scope");
    if (rule.dates) validateRange(rule.dates);
    if (rule.eras?.some((id) => !eras.some((era) => era.id === id)))
      throw Error("Unknown era");
    if (rule.places?.some((id) => !places.has(id)))
      throw Error("Unknown place");
    if (rule.regions?.some((id) => !regions.has(id)))
      throw Error("Unknown region");
    if (rule.communities?.some((id) => !communities.has(id)))
      throw Error("Unknown community");
    if (rule.level === "regional" && !rule.regions?.length)
      throw Error("Regional rule needs region scope");
    if (
      rule.level === "local" &&
      !rule.places?.length &&
      !rule.communities?.length
    )
      throw Error("Local rule needs local scope");
    const selections = expand(registry, rule);
    unique(selections.map((s) => s.id));
    selections.forEach(selection);
    for (const [key, fact] of Object.entries(rule.facts ?? {})) {
      if (!factKeys.includes(key)) throw Error("Unknown historical fact field");
      if (!fact.label) throw Error("Missing fact label");
      evidence(fact.evidence);
      fact.alternatives?.forEach((a) => evidence(a.evidence));
    }
  }
}
function expand(registry: Registry, rule: Rule) {
  return [
    ...(rule.kits ?? []).flatMap((id) => {
      if (!Object.hasOwn(registry.kits, id))
        throw Error(`Unknown selection kit: ${id}`);
      return registry.kits[id];
    }),
    ...(rule.selections ?? []),
  ];
}

/** Pure catalog resolution. No PRNG, generation, save access, or live research. */
export function resolveHistory(registry: Registry, input: ResolveInput) {
  validateRegistry(registry);
  const era = eraAt(input.date);
  if (!cultures.some(([id]) => id === input.culture))
    throw Error("Unknown culture");
  const place = registry.places.find((p) => p.id === input.place);
  if (input.place && !place) throw Error("Unknown place");
  if (place && place.culture !== input.culture)
    throw Error("Place/community does not match selected culture");
  const matches = registry.rules
    .filter(
      (r) =>
        r.culture === input.culture &&
        (!r.eras || r.eras.includes(era.id)) &&
        (!r.dates || containsDate(r.dates, input.date)) &&
        (!r.places || (!!place && r.places.includes(place.id))) &&
        (!r.regions ||
          (!!place && r.regions.some((id) => place.regions.includes(id)))) &&
        (!r.communities ||
          (!!place && r.communities.includes(place.community))),
    )
    .sort(
      (a, b) =>
        ranks[a.level] - ranks[b.level] ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );
  type Applied<T> = {
    value: T;
    rule: Rule;
    trace: { rule: string; note: string }[];
  };
  const selected = new Map<string, Applied<Selection>>();
  const facts = new Map<FactKey, Applied<Fact>>();
  const apply = <K, T>(
    map: Map<K, Applied<T>>,
    key: K,
    value: T,
    rule: Rule,
  ) => {
    const previous = map.get(key);
    if (previous && ranks[previous.rule.level] === ranks[rule.level])
      throw Error(
        `Conflicting ${String(key)} rules: ${previous.rule.id}, ${rule.id}`,
      );
    map.set(key, {
      value,
      rule,
      trace: [...(previous?.trace ?? []), { rule: rule.id, note: rule.note }],
    });
  };
  for (const rule of matches) {
    for (const choice of expand(registry, rule))
      apply(selected, choice.id, choice, rule);
    for (const [key, value] of Object.entries(rule.facts ?? {}))
      apply(facts, key as FactKey, value, rule);
  }
  const entries = [...selected].map(([id, applied]) => {
    const definition = registry.definitions.find((d) => d.id === id)!;
    const choice = applied.value;
    let status: "included" | "excluded" | "conditional" = "included";
    let reason = choice.evidence.claim;
    if (choice.availability === "excluded") {
      status = "excluded";
      reason = `Historical exclusion: ${reason}`;
    } else if (
      input.hypotheses === false &&
      ["hypothesis", "fictional"].includes(choice.evidence.status)
    ) {
      status = "excluded";
      reason =
        "Exploratory interpretations disabled; this is not a historical absence.";
    } else if (
      input.context &&
      !choice.contexts.includes("any") &&
      !choice.contexts.includes(input.context)
    ) {
      status = "excluded";
      reason = `Not selected for ${input.context}; relevant contexts: ${choice.contexts.join(", ")}`;
    } else if (
      definition.requires?.some((r) => !input.capabilities?.includes(r))
    ) {
      status = "conditional";
      reason = `Requires local capability: ${definition.requires.join(", ")}`;
    }
    return { ...choice, definition, status, reason, trace: applied.trace };
  });
  const resolvedFacts = [...facts].map(([key, applied]) => ({
    key,
    ...applied.value,
    trace: applied.trace,
    selected:
      input.hypotheses !== false ||
      !["hypothesis", "fictional"].includes(applied.value.evidence.status),
  }));
  // Consumers may adapt these records for generation; never hand them mutable
  // references into the shared catalog, era registry, or hypothesis evidence.
  return structuredClone({
    version: registry.version,
    input: structuredClone(input),
    era,
    place,
    coverage: matches.length ? ("partial" as const) : ("unresearched" as const),
    notes: [
      "Historical selection only; no new world or interaction is generated.",
      ...(place
        ? [place.coverage]
        : [
            "Broad family defaults only; local identity has not been specified.",
          ]),
      "Unlisted content is unresearched, not automatically absent or available.",
    ],
    entries,
    facts: resolvedFacts,
    matchedRules: matches.map((r) => ({ id: r.id, note: r.note })),
    unresearched: registry.definitions
      .filter((d) => !selected.has(d.id))
      .map((d) => d.id),
  });
}
