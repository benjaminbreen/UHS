import { expect, it } from "vitest";
import {
  beliefOf,
  beliefSystems,
  beliefsFor,
  unscopedBeliefs,
} from "../src/content/beliefs";
import { places } from "../src/content/geography/places";
import type { Actor } from "../src/core/types";

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
    expect(system.practice.length, system.id).toBeGreaterThan(0);
    expect(system.evidence.claim.length, system.id).toBeGreaterThan(20);
    expect(system.evidence.limitation.length, system.id).toBeGreaterThan(20);
    // A named source is required for anything claiming to be documented.
    if (system.evidence.status === "documented")
      expect(system.evidence.sources.length, system.id).toBeGreaterThan(0);
    const names = new Set(system.powers.map((p) => p.name));
    for (const power of system.powers) {
      expect(power.domain.length, `${system.id}/${power.name}`).toBeGreaterThan(
        2,
      );
      if (power.relation)
        expect(
          names.has(power.relation.of),
          `${system.id}: ${power.name} points at ${power.relation.of}`,
        ).toBe(true);
    }
    // Someone has to be reachable without going through a temple.
    expect(
      system.powers.some((p) => p.rank === "local"),
      system.id,
    ).toBe(true);
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
  expect(one.patron.rank).not.toBe("paramount");
  expect(beliefOf("seed", actor(), unscopedBeliefs).patron.name).toBe(
    one.patron.name,
  );
  expect(
    beliefOf("seed", actor("a2"), unscopedBeliefs).observance,
  ).toBeTruthy();
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
