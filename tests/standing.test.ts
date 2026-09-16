import { describe, it, expect } from "vitest";
import { standingOf, describeStanding } from "../src/core/standing";
import { livelihoods } from "../src/content/characters/livelihoods";
import { commonLivelihoods } from "../src/content/characters/livelihoods.generated";
import { ranks } from "../src/content/characters/context-types";
import type { Actor } from "../src/core/types";

const person = (id: string, livelihood: string, standing?: "free" | "unfree") =>
  ({
    id,
    origin: {
      revision: 1,
      profile: "p",
      community: "c",
      livelihood,
      standing,
      notes: [],
    },
  }) as unknown as Pick<Actor, "id" | "origin">;

describe("standing", () => {
  it("gives every piece of work a rank", () => {
    for (const l of [...livelihoods, ...commonLivelihoods]) {
      expect(l.rank, l.id).toBeDefined();
      expect(ranks, l.id).toContain(l.rank);
    }
  });
  it("is stable for the same seed and actor", () => {
    const a = person("a", "smith");
    expect(standingOf("seed", a)).toEqual(standingOf("seed", a));
    expect(standingOf("seed", a)?.wealth).not.toBe(
      standingOf("other", a)?.wealth,
    );
  });
  it("keeps wealth inside the rank's band", () => {
    const smith = standingOf("seed", person("a", "smith"))!;
    const sweeper = standingOf("seed", person("b", "sweeper"))!;
    expect(smith.rank).toBe("middling");
    expect(sweeper.rank).toBe("destitute");
    expect(smith.wealth).toBeGreaterThan(sweeper.wealth);
  });
  it("does not let a trade's rank outrank bondage", () => {
    const bound = standingOf("seed", person("a", "smith", "unfree"))!;
    expect(bound.free).toBe(false);
    expect(bound.rank).toBe("labouring");
    expect(bound.wealth).toBeLessThan(13);
    expect(describeStanding(bound)).toBe("held in bondage");
  });
  it("has nothing to say about an actor with no origin", () => {
    expect(standingOf("seed", { id: "x" })).toBeUndefined();
  });
});

describe("outlook sentence", () => {
  it("gives every stance a composable clause", async () => {
    const { stances } = await import("../src/content/outlook");
    for (const s of stances) {
      expect(s.clause, s.id).toBeTruthy();
      // Subjectless, third person, and short enough to sit beside another.
      expect(s.clause[0], s.id).toBe(s.clause[0].toLowerCase());
      expect(s.clause.split(" ").length, s.id).toBeLessThanOrEqual(11);
      expect(s.clause.endsWith("."), s.id).toBe(false);
    }
  });
});
