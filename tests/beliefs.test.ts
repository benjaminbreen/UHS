import { expect, it } from "vitest";
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
