import { expect, it } from "vitest";
import { dispositionOf, standingOf, standings } from "../src/core/persona";
import { rollStats, statsOf, describeStats } from "../src/core/stats";
import { abilitiesOf } from "../src/content/characters/abilities";
import { snapshotSchema } from "../src/runtime/schema";
import type { Actor, Stats } from "../src/core/types";

const actor = (over: Partial<Actor> = {}): Pick<
  Actor,
  "id" | "age" | "appearance" | "stats" | "origin"
> => ({ id: "a1", age: 30, ...over });
const flat = (over: Partial<Stats> = {}): Stats => ({
  strength: 50,
  agility: 50,
  endurance: 50,
  wit: 50,
  openness: 50,
  conscientiousness: 50,
  extraversion: 50,
  agreeableness: 50,
  neuroticism: 50,
  ...over,
});

it("rolls endurance inside the same range as every other stat", () => {
  for (let i = 0; i < 50; i++) {
    const s = rollStats("seed", actor({ id: `a${i}` }));
    expect(s.endurance).toBeGreaterThanOrEqual(0);
    expect(s.endurance).toBeLessThanOrEqual(100);
  }
});

it("is stable for one identity and differs between identities", () => {
  expect(statsOf("seed", actor())).toEqual(statsOf("seed", actor()));
  expect(statsOf("seed", actor())).not.toEqual(
    statsOf("seed", actor({ id: "a2" })),
  );
});

it("reduces endurance for children and elders", () => {
  const child = rollStats("seed", actor({ age: 8 })),
    adult = rollStats("seed", actor({ age: 30 })),
    elder = rollStats("seed", actor({ age: 70 }));
  expect(child.endurance).toBeLessThan(adult.endurance);
  expect(elder.endurance).toBeLessThan(adult.endurance);
});

it("fills endurance on saves written before it existed", () => {
  const stats = flat({ strength: 60, agility: 40 }) as Partial<Stats>;
  delete stats.endurance;
  const parsed = snapshotSchema.shape.player.shape.stats.parse(stats);
  expect(parsed!.endurance).toBe(50);
});

it("names a disposition from the five traits alone", () => {
  expect(dispositionOf(flat({ agreeableness: 80, neuroticism: 15 }))).toBe(
    "patient",
  );
  expect(dispositionOf(flat({ extraversion: 10 }))).toBe("reserved");
  expect(dispositionOf(flat())).toBe("even-tempered");
  // Strength and wit are not personality.
  expect(dispositionOf(flat({ strength: 95, wit: 95 }))).toBe("even-tempered");
});

it("gives a standing that rises with age and diligence", () => {
  const low = standingOf("seed", actor({ age: 9, stats: flat() })),
    high = standingOf(
      "seed",
      actor({ age: 45, stats: flat({ conscientiousness: 90 }) }),
    );
  expect(standings.indexOf(low)).toBeLessThan(standings.indexOf(high));
});

it("keeps standing stable for one identity", () => {
  expect(standingOf("seed", actor())).toBe(standingOf("seed", actor()));
});

it("gives the practised trade the top ranks", () => {
  const held = abilitiesOf(
    "seed",
    actor({
      stats: flat({ conscientiousness: 70 }),
      origin: {
        revision: 1,
        profile: "p",
        community: "c",
        livelihood: "potter",
        notes: [],
      },
    }),
  );
  expect(held[0].ability.id).toBe("pottery");
  expect(held[0].rank).toBe(3);
  expect(held.length).toBeGreaterThanOrEqual(3);
  expect(new Set(held.map((h) => h.ability.id)).size).toBe(held.length);
});

it("gives someone with no recorded trade ordinary abilities", () => {
  const held = abilitiesOf("seed", actor());
  expect(held.length).toBe(3);
  expect(held.every((h) => h.rank <= 2)).toBe(true);
});

it("caps a child below the top rank", () => {
  const held = abilitiesOf(
    "seed",
    actor({
      age: 7,
      origin: {
        revision: 1,
        profile: "p",
        community: "c",
        livelihood: "potter",
        notes: [],
      },
    }),
  );
  expect(held.every((h) => h.rank === 1)).toBe(true);
});

it("still describes stats without repeating a trait", () => {
  const words = describeStats(flat({ endurance: 90, strength: 10 }));
  expect(words).toContain("tireless");
  expect(words).toContain("frail");
});
