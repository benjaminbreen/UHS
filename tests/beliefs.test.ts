import { expect, it } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
import {
  beliefOf,
  beliefSystems,
  beliefsFor,
  unscopedBeliefs,
} from "../src/content/beliefs";
import { places } from "../src/content/geography/places";
import type { Actor } from "../src/core/types";
import { deityIconFor } from "../src/content/beliefs/deity-icons";

const actor = (
  id = "a1",
): Pick<Actor, "id" | "age" | "appearance" | "stats" | "origin"> => ({
  id,
  age: 30,
});

it("keeps every system well formed", () => {
  const ids = new Set<string>();
  for (const system of beliefSystems) {
    expect(ids.has(system.id), system.id).toBe(false);
    ids.add(system.id);
    expect(system.scope.years[0]).toBeLessThan(system.scope.years[1]);
    if (system.scope.bounds) {
      const [w, s, e, n] = system.scope.bounds;
      expect(w, system.id).toBeLessThan(e);
      expect(s, system.id).toBeLessThan(n);
      expect(Math.abs(w), system.id).toBeLessThanOrEqual(180);
      expect(Math.abs(n), system.id).toBeLessThanOrEqual(90);
    }
    expect(system.powers.length, system.id).toBeGreaterThan(2);
    expect(
      system.powers.filter((power) => power.rank === "paramount").length,
      system.id,
    ).toBeLessThanOrEqual(3);
    expect(system.practice.length, system.id).toBeGreaterThan(0);
    expect(system.evidence.claim.length, system.id).toBeGreaterThan(20);
    expect(system.evidence.limitation.length, system.id).toBeGreaterThan(20);
    // A named source is required for anything claiming to be documented.
    if (system.evidence.status === "documented")
      expect(system.evidence.sources.length, system.id).toBeGreaterThan(0);
    const names = new Set(system.powers.map((p) => p.name));
    for (const patron of system.patronOptions ?? [])
      expect(names.has(patron), `${system.id}: unknown patron ${patron}`).toBe(
        true,
      );
    for (const power of system.powers) {
      expect(power.domain.length, `${system.id}/${power.name}`).toBeGreaterThan(
        2,
      );
      for (const relation of power.relations ?? [])
        expect(
          names.has(relation.of),
          `${system.id}: ${power.name} points at ${relation.of}`,
        ).toBe(true);
    }
  }
});

it("names no power where nothing is recorded", () => {
  expect(unscopedBeliefs.powers.every((p) => p.name.startsWith("The"))).toBe(
    true,
  );
  expect(unscopedBeliefs.evidence.status).toBe("fictional");
});

it("resolves the narrowest scope and falls back cleanly", () => {
  const setting = {
    year: -1300,
    lon: 31,
    lat: 26,
    culture: "north-african-west-asian",
    community: "",
  } as never;
  expect(beliefsFor(setting).id).toBe("egypt-new-kingdom");
  const nowhere = { year: -50000, lon: 0, lat: 0, community: "" } as never;
  expect(beliefsFor(nowhere).id).toBe("unscoped");
});

it("derives a stable personal belief", () => {
  const one = beliefOf("seed", actor(), unscopedBeliefs);
  expect(one.patron).toBeUndefined();
  expect(
    beliefOf("seed", actor("a2"), unscopedBeliefs).observance,
  ).toBeTruthy();
});

it("only assigns a personal devotion from explicit options", () => {
  const system = beliefSystems.find(
    (candidate) => candidate.id === "orthodox-russia",
  )!;
  const one = beliefOf("seed", actor(), system);
  expect(system.patronOptions).toContain(one.patron?.name);
  expect(beliefOf("seed", actor(), system).patron?.name).toBe(one.patron?.name);
});

it("presents Russian Orthodoxy as the Trinity and five holy figures", () => {
  for (const id of ["orthodox-russia", "siberian-russian-hybrid"]) {
    const system = beliefSystems.find((candidate) => candidate.id === id)!;
    expect(
      system.powers
        .filter((power) => power.rank === "paramount")
        .map((power) => power.name),
    ).toEqual(["God the Father", "Jesus Christ, the Son", "The Holy Spirit"]);
    expect(
      system.powers
        .filter((power) => power.rank === "major")
        .map((power) => power.name),
    ).toEqual([
      "The Theotokos",
      "Saint Nicholas",
      "Peter and Paul",
      "Saint George",
      "Archangel Michael",
    ]);
  }
});

it("gives ten major traditions a concise, recognizable core", () => {
  const expected = {
    "orthodox-russia": [
      "God the Father",
      "Jesus Christ, the Son",
      "The Holy Spirit",
    ],
    "imperial-roman": ["Jupiter", "Juno", "Minerva"],
    "catholic-high-medieval": [
      "God the Father",
      "Jesus Christ, the Son",
      "The Holy Spirit",
    ],
    "medieval-sunni-islam": ["Allah"],
    "gupta-puranic": ["Vishnu", "Shiva", "Devi/Shakti"],
    "song-ming-pantheon": ["Heaven"],
    "theravada-sri-lanka": ["The Buddha", "The Dhamma", "The Sangha"],
    "medieval-japan-pure-land": [
      "Amida Buddha",
      "Shakyamuni Buddha",
      "The Dharma",
    ],
    "second-temple-judaism": ["YHWH"],
    "classical-greek": ["Zeus", "Hera", "Athena"],
  } as const;

  for (const [id, foundation] of Object.entries(expected)) {
    const system = beliefSystems.find((candidate) => candidate.id === id)!;
    const paramount = system.powers.filter(
      (power) => power.rank === "paramount",
    );
    const major = system.powers.filter((power) => power.rank === "major");
    expect(
      paramount.map((power) => power.name),
      id,
    ).toEqual(foundation);
    expect(paramount.length, id).toBeLessThanOrEqual(3);
    expect(major.length, id).toBeLessThanOrEqual(5);
    for (const power of paramount.filter(
      ({ name }) => !/^The (Dhamma|Dharma|Sangha)$/.test(name),
    )) {
      expect(deityIconFor(power.name), `${id}: ${power.name}`).toBeDefined();
    }
  }
});

it("covers the places and dates the app can actually generate", () => {
  const years = [-8000, -3000, -1200, -400, 200, 800, 1200, 1500, 1750, 1900];
  let n = 0,
    hit = 0;
  for (const place of places)
    for (const year of years) {
      n++;
      const setting = {
        ...place,
        year,
        community: "",
      } as unknown as Parameters<typeof beliefsFor>[0];
      if (beliefsFor(setting).id !== "unscoped") hit++;
    }
  // The remainder is Antarctica and islands nobody had reached yet.
  expect(hit / n).toBeGreaterThan(0.97);
});

it("links every system to an article, and no power to a malformed one", () => {
  const shape = /^https:\/\/en\.wikipedia\.org\/wiki\/[^\s"?#]+$/;
  let linked = 0;
  for (const system of beliefSystems) {
    if (system.wiki) {
      linked++;
      expect(shape.test(system.wiki), `${system.id}: ${system.wiki}`).toBe(
        true,
      );
    }
    for (const power of system.powers)
      if (power.wiki)
        expect(
          shape.test(power.wiki),
          `${system.id}/${power.name}: ${power.wiki}`,
        ).toBe(true);
  }
  // Links are checked against the live API by scripts/check-beliefs-wiki.ts.
  expect(linked / beliefSystems.length).toBeGreaterThan(0.9);
});

it("names the powers wherever names survive", () => {
  const unnamed = beliefSystems.filter(
    (b) =>
      b.powers.filter((p) => /^(the|a|an)\b/i.test(p.name)).length /
        b.powers.length >
      0.6,
  );
  // The rest carry reconstructed forms under `gloss`, or are the handful where
  // even a reconstruction would be a stretch: pre-1788 Australia, Papuan
  // highland prehistory, Teotihuacan and Olmec, the pre-Bantu forest.
  expect(unnamed.length / beliefSystems.length).toBeLessThan(0.2);
});

it("explains every starred name and never leaves a gloss bare", () => {
  for (const system of beliefSystems)
    for (const power of system.powers) {
      // A starred form is a reconstruction and must say which language it is
      // reconstructed from. A gloss without a star is an attested term being
      // translated, which is fine.
      if (power.name.startsWith("*"))
        expect(power.gloss, `${system.id}/${power.name}`).toBeDefined();
      if (power.gloss)
        expect(
          power.gloss.length,
          `${system.id}/${power.name}`,
        ).toBeGreaterThan(15);
    }
});

it("keeps relations pointing at real powers, once each, never at themselves", () => {
  let total = 0;
  for (const system of beliefSystems) {
    const names = new Set(system.powers.map((p) => p.name));
    for (const power of system.powers) {
      const seen = new Set<string>();
      for (const relation of power.relations ?? []) {
        total++;
        expect(names.has(relation.of), `${system.id}/${power.name}`).toBe(true);
        expect(
          relation.of,
          `${system.id}/${power.name} points at itself`,
        ).not.toBe(power.name);
        const key = `${relation.kind}:${relation.of}`;
        expect(seen.has(key), `${system.id}/${power.name}: ${key} twice`).toBe(
          false,
        );
        seen.add(key);
      }
    }
    // Descent must not loop: a child cannot be its own ancestor.
    const parents = new Map(
      system.powers.map((p) => [
        p.name,
        (p.relations ?? [])
          .filter((r) => r.kind === "child-of")
          .map((r) => r.of),
      ]),
    );
    for (const start of parents.keys()) {
      const walk = (name: string, seen: string[]): void => {
        for (const parent of parents.get(name) ?? []) {
          expect(
            seen.includes(parent),
            `${system.id}: descent loops at ${parent}`,
          ).toBe(false);
          walk(parent, [...seen, parent]);
        }
      };
      walk(start, [start]);
    }
  }
  // Coarse coverage alarm only; the checks above enforce relationship quality.
  expect(total).toBeGreaterThan(500);
});

it.each([
  ["Delhi 1650", "mughal-delhi"],
  ["Kyoto 1600", "tokugawa-household-buddhism"],
  ["Kano 1850", "hausa-islamic"],
  ["New York 1900", "us-urban-congregations"],
  ["Alexandria 300", "late-roman-egypt"],
  ["Manchester 1840", "european-industrial"],
  ["Seoul 1700", "joseon-korea-confucianism"],
  ["Lagos 1880", "yoruba-nineteenth-century-christian"],
])("gives %s its own tradition", (place, id) => {
  const r = resolveSetting(place);
  if (!("setting" in r)) throw new Error(r.error);
  expect(beliefsFor(r.setting).id).toBe(id);
});

// Compare the same actors and seed, changing only the contextual revision.
import {
  contextualBeliefs,
  practiceText,
  selectBeliefs,
} from "../src/content/beliefs";
import type { BeliefSystem } from "../src/content/beliefs/types";
import type { WorldSetting } from "../src/content/geography/types";
import { outlookOf } from "../src/core/outlook";

const context = (
  year: number,
  lon: number,
  lat: number,
  culture: WorldSetting["culture"],
): WorldSetting =>
  ({
    year,
    lon,
    lat,
    culture,
    community: "",
    beliefRevision: 1,
  }) as WorldSetting;

it("uses explicit refinements, then geography, without trading area for years", () => {
  const broad = {
    ...unscopedBeliefs,
    id: "brief-region",
    scope: { years: [1649, 1651], bounds: [-110, 10, -80, 30] },
  } as BeliefSystem;
  const local = {
    ...unscopedBeliefs,
    id: "long-local",
    scope: { years: [1500, 1900], bounds: [-98, 16, -96, 18] },
  } as BeliefSystem;
  const s = context(1650, -97, 17, "mesoamerican");
  expect(
    selectBeliefs([broad, local], { ...s, beliefRevision: undefined }).id,
  ).toBe(broad.id);
  expect(selectBeliefs([broad, local], s).id).toBe(local.id);
  expect(selectBeliefs([broad, { ...local, priority: -1 }], s).id).toBe(
    broad.id,
  );
  expect(() => selectBeliefs([local, { ...local, id: "conflict" }], s)).toThrow(
    "Ambiguous",
  );
  expect(selectBeliefs([local, broad], s)).toEqual(
    selectBeliefs([broad, local], s),
  );
});

it("scopes powers, their relationships, patrons and weighted practices independently", () => {
  const scope = { years: [1600, 1700], communities: ["local"] } as const;
  const system: BeliefSystem = {
    ...unscopedBeliefs,
    features: ["sacred-texts"],
    powers: [
      { name: "Local", domain: "home", rank: "local", scope },
      {
        name: "Shared",
        domain: "home",
        rank: "major",
        relations: [{ kind: "serves", of: "Local" }],
      },
    ],
    patronOptions: ["Local"],
    practice: [
      "Ordinary",
      { text: "Local rite", scope, weight: 9 },
      { text: "Unavailable", requires: ["sacred-texts"], weight: 0 },
    ],
  };
  const s = context(1650, 0, 0, "european");
  const inside = contextualBeliefs(system, s, "local");
  const outside = contextualBeliefs(system, s, "visitor");
  expect(outside.powers.map((p) => p.name)).toEqual(["Shared"]);
  expect(outside.powers[0].relations).toEqual([]);
  expect(outside.patronOptions).toEqual([]);
  expect(outside.practice.map(practiceText)).not.toContain("Local rite");
  const draws = Array.from(
    { length: 300 },
    (_, i) => beliefOf("comparison", actor(String(i)), inside).keeps,
  );
  expect(draws.filter((p) => p === "Local rite").length).toBeGreaterThan(240);
  expect(draws).not.toContain("Unavailable");
  expect(
    contextualBeliefs(system, { ...s, year: 1700 }, "local").practice.map(
      practiceText,
    ),
  ).not.toContain("Local rite");
});

it("removes misplaced regional practices while retaining local specificity", () => {
  const cases = [
    { name: "Oaxaca", lon: -96.73, lat: 17.06, allowed: /Mass|Candles/ },
    { name: "Yucatan", lon: -89.6, lat: 20.97, allowed: /Aluxob/ },
    { name: "Atitlan", lon: -91.23, lat: 14.64, allowed: /Maximón/ },
  ];
  for (const c of cases) {
    const s = context(1650, c.lon, c.lat, "mesoamerican");
    const before = beliefsFor({ ...s, beliefRevision: undefined });
    const after = beliefsFor(s);
    const draws = (system: BeliefSystem) =>
      Array.from(
        { length: 300 },
        (_, i) => beliefOf("comparison", actor(String(i)), system).keeps!,
      );
    expect(draws(before).some((p) => /Maximón/.test(p))).toBe(true);
    expect(draws(before).some((p) => /Aluxob/.test(p))).toBe(true);
    expect(
      draws(after).some((p) => c.allowed.test(p)),
      c.name,
    ).toBe(true);
    if (c.name !== "Atitlan")
      expect(
        draws(after).some((p) => /Maximón/.test(p)),
        c.name,
      ).toBe(false);
    if (c.name !== "Yucatan")
      expect(
        draws(after).some((p) => /Aluxob/.test(p)),
        c.name,
      ).toBe(false);
  }
});

it("does not assign occupational rites to unrelated workers", () => {
  const s = context(1650, -68, -17, "andean");
  const system = beliefsFor(s);
  expect(
    system.practice.map(practiceText).some((p) => p.includes("Miners")),
  ).toBe(true);
  const draws = Array.from(
    { length: 300 },
    (_, i) => beliefOf("comparison", actor(String(i)), system).keeps!,
  );
  expect(draws.some((p) => p.includes("Miners"))).toBe(false);
  const miner = { ...actor(), origin: { livelihood: "miner" } } as ReturnType<
    typeof actor
  >;
  expect(
    Array.from(
      { length: 100 },
      (_, i) => beliefOf(String(i), miner, system).keeps!,
    ).some((p) => p.includes("Miners")),
  ).toBe(true);
});

it("grounds textual outlooks in the selected tradition across regions", () => {
  for (const s of [
    context(-1200, -90, 17, "mesoamerican"),
    context(-1000, 10, 60, "european"),
    context(1650, 30, 40, "north-african-west-asian"),
    context(1650, 135, 35, "east-asian"),
  ]) {
    const textual = beliefsFor(s).features?.includes("sacred-texts") ?? false;
    let before = 0,
      after = 0;
    for (let i = 0; i < 500; i++) {
      const a = actor(String(i));
      before += Number(
        outlookOf("comparison", a, {
          ...s,
          beliefRevision: undefined,
        }).stances.some((p) => p.requiresBelief?.length),
      );
      after += Number(
        outlookOf("comparison", a, s).stances.some(
          (p) => p.requiresBelief?.length,
        ),
      );
    }
    expect(before).toBeGreaterThan(0);
    if (textual) expect(after).toBeGreaterThan(0);
    else expect(after).toBe(0);
  }
});

it("resolves authored profile centers without ambiguous precedence", () => {
  const conflicts = new Set<string>();
  for (const b of beliefSystems) {
    if (!b.scope.bounds) continue;
    const [w, south, e, n] = b.scope.bounds;
    for (const year of [
      b.scope.years[0],
      Math.floor((b.scope.years[0] + b.scope.years[1]) / 2),
      b.scope.years[1] - 1,
    ]) {
      const s = context(
        year,
        (w + e) / 2,
        (south + n) / 2,
        b.scope.cultures![0],
      );
      try {
        beliefsFor(s, b.scope.communities?.[0]);
      } catch (error) {
        conflicts.add(String(error));
      }
    }
  }
  expect([...conflicts]).toEqual([]);
});
