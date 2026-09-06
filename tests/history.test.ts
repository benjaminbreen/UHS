import { describe, expect, it } from "vitest";
import {
  bce,
  containsDate,
  dateKey,
  eraAt,
  eras,
  formatDate,
} from "../src/content/history/dates";
import {
  historyRegistry,
  resolveHistory,
  validateRegistry,
} from "../src/content/history";
import { choice, prototypeEvidence } from "../src/content/history/catalog";
import {
  cultures,
  type Registry,
  type ResolveInput,
} from "../src/content/history/types";
import { packs } from "../src/content/packs";
import { packTemplates } from "../src/content/legacy-packs";
import atlas from "../src/render/generated/atlas.json" with { type: "json" };

const resolve = (
  input: Partial<ResolveInput> = {},
  registry = historyRegistry,
) =>
  resolveHistory(registry, {
    culture: "european",
    place: "tiber",
    date: { year: 100 },
    ...input,
  });
describe("permanent chronology and content selection", () => {
  it("has twelve contiguous eras with exact boundaries and correct BCE numbering", () => {
    expect(eras).toHaveLength(12);
    expect(new Set(eras.map((e) => e.id)).size).toBe(12);
    expect(bce(1)).toEqual({ year: 0 });
    expect(formatDate(bce(6500))).toBe("6500 BCE");
    expect(eraAt(bce(10001)).id).toBe("deep-prehistory");
    expect(eraAt(bce(10000)).id).toBe("early-holocene");
    for (let i = 1; i < eras.length; i++) {
      const start = eras[i].start!;
      expect(eras[i - 1].end).toEqual(start);
      expect(eraAt(start).id).toBe(eras[i].id);
      expect(eraAt({ year: start.year - 1, month: 12, day: 31 }).id).toBe(
        eras[i - 1].id,
      );
    }
    expect(dateKey({ year: 0, month: 12, day: 31 })).toBeLessThan(
      dateKey({ year: 1 }),
    );
    for (const date of [
      { year: NaN },
      { year: 1900, month: 2, day: 29 },
      { year: 2000, month: 13 },
      { year: 1, day: 3 },
    ])
      expect(() => dateKey(date)).toThrow();
    expect(() => dateKey({ year: 2000, month: 2, day: 29 })).not.toThrow();
    expect(() =>
      containsDate({ start: { year: 5 }, end: { year: 4 } }, { year: 4 }),
    ).toThrow();
  });
  it("validates references and preserves existing packs byte-for-byte", () => {
    validateRegistry(historyRegistry);
    expect(JSON.stringify(packs)).toBe(JSON.stringify(packTemplates));
    for (const d of historyRegistry.definitions)
      if (d.sprite)
        expect(Object.hasOwn(atlas.frames, d.sprite), d.sprite).toBe(true);
    const bad = structuredClone(historyRegistry);
    bad.rules[0].kits = ["missing"];
    expect(() => validateRegistry(bad)).toThrow(/Unknown selection kit/);
    bad.rules[0].kits = [];
    bad.rules[0].selections = [choice("missing", prototypeEvidence("test"))];
    expect(() => validateRegistry(bad)).toThrow(/Unknown content definition/);
  });
  it("resolves all culture-era combinations without inventing missing coverage", () => {
    expect(cultures).toHaveLength(12);
    for (const [culture] of cultures)
      for (const era of eras) {
        const r = resolve({ culture, date: era.sample, place: undefined });
        expect(r.era.id).toBe(era.id);
        expect(r.facts).toEqual([]);
      }
    expect(resolve({ culture: "andean", place: undefined }).coverage).toBe(
      "unresearched",
    );
    expect(() => resolve({ culture: "andean" })).toThrow(/does not match/);
    expect(() => resolve({ place: "__proto__" })).toThrow(/Unknown place/);
    expect(resolve({ date: { year: 1400 } }).entries).toEqual([]);
  });
  it("selects political changes by day without changing the era or implying global borders", () => {
    const before = resolve({
      place: "moscow-transition",
      date: { year: 1991, month: 12, day: 24 },
    });
    const after = resolve({
      place: "moscow-transition",
      date: { year: 1991, month: 12, day: 25 },
    });
    expect(before.era.id).toBe(after.era.id);
    expect(before.facts[0].label).toContain("Soviet");
    expect(after.facts[0].label).toContain("Russian Federation");
    expect(
      after.entries.find((e) => e.id === "institution.union-government")
        ?.status,
    ).toBe("excluded");
    expect(
      resolve({ place: "moscow-transition", date: { year: 1993 } }).facts,
    ).toEqual([]);
  });
  it("keeps speculative language choices sourced, qualified, reversible, and separate from culture", () => {
    const input = {
      culture: "north-african-west-asian" as const,
      place: "konya",
      date: bce(6500),
    };
    const r = resolve(input);
    const language = r.facts.find((f) => f.key === "language")!;
    expect(language.evidence.status).toBe("hypothesis");
    expect(language.evidence.sources.length).toBeGreaterThan(1);
    expect(language.alternatives?.length).toBeGreaterThan(0);
    expect(language.selected).toBe(true);
    expect(
      resolve({ ...input, hypotheses: false }).facts.find(
        (f) => f.key === "language",
      )?.selected,
    ).toBe(false);
    expect(r.entries.find((e) => e.id === "item.coin")?.status).toBe(
      "excluded",
    );
    expect(
      resolve({
        culture: "inner-eurasian",
        place: "eurasia-language-study",
        date: bce(13000),
      }).facts[0].evidence.status,
    ).toBe("hypothesis");
  });
  it("applies explicit local exclusions, context and infrastructure gates with traces", () => {
    const registry: Registry = structuredClone(historyRegistry);
    const amphora = registry.definitions.find((d) => d.id === "prop.amphora")!;
    amphora.requires = ["test-storage-rack"];
    expect(
      resolve({ context: "market" }, registry).entries.find(
        (e) => e.id === amphora.id,
      )?.status,
    ).toBe("conditional");
    expect(
      resolve(
        { context: "market", capabilities: ["test-storage-rack"] },
        registry,
      ).entries.find((e) => e.id === amphora.id)?.status,
    ).toBe("included");
    expect(
      resolve(
        { context: "household", capabilities: ["test-storage-rack"] },
        registry,
      ).entries.find((e) => e.id === amphora.id)?.status,
    ).toBe("excluded");
    registry.rules.push({
      id: "local-pot-exclusion",
      culture: "european",
      level: "local",
      places: ["tiber"],
      note: "Test a sourced local replacement",
      selections: [
        choice(amphora.id, prototypeEvidence("Test exclusion"), {
          availability: "excluded",
        }),
      ],
    });
    const entry = resolve({}, registry).entries.find(
      (e) => e.id === amphora.id,
    )!;
    expect(entry.status).toBe("excluded");
    expect(entry.trace.map((t) => t.rule)).toEqual([
      "roman-italy-v1",
      "local-pot-exclusion",
    ]);
    registry.rules.push({
      ...registry.rules.at(-1)!,
      id: "conflicting-local-rule",
    });
    expect(() => resolve({}, registry)).toThrow(/Conflicting/);
  });
  it("is deterministic, independent of rule file order, and does not mutate inputs", () => {
    const registry = structuredClone(historyRegistry);
    const before = JSON.stringify(registry);
    const expected = resolve({}, registry);
    expect(JSON.stringify(registry)).toBe(before);
    registry.rules.reverse();
    expect(resolve({}, registry)).toEqual(expected);
    const detached = resolve({}, registry);
    detached.entries[0].definition.label = "Changed by a consumer";
    detached.facts[0].evidence.claim = "Changed by a consumer";
    expect(resolve({}, registry)).toEqual(expected);
    const bad = structuredClone(historyRegistry);
    bad.rules[2].facts!.authority!.evidence.sources = ["missing-source"];
    expect(() => resolve({}, bad)).toThrow(/Unknown evidence source/);
  });
});
