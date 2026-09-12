import { describe, it, expect } from "vitest";
import { coverage, optionsAt } from "../scripts/check-name-coverage";
import { nameTraditions } from "../src/content/characters/profiles/traditions.generated";
import { nameRegions } from "../src/content/characters/profiles/name-regions.generated";
import { barredNameEntry } from "../src/content/characters/name-entries";
import { communityProfiles } from "../src/content/characters/profiles/communities";

describe("naming atlas", () => {
  it("does not offer a tradition outside its own attested era", () => {
    const byId = new Map(nameTraditions.map((t) => [t.id, t]));
    for (const lon of [-120, -60, 0, 30, 60, 100, 140])
      for (const lat of [-30, 0, 20, 40, 60])
        for (const year of [-30000, -3000, 1, 1000, 1500, 1900]) {
          const hit = optionsAt(lon, lat, year);
          for (const o of hit?.options ?? []) {
            const t = byId.get(o.tradition.id)!;
            expect(
              year >= t.era[0] && year < t.era[1],
              `${t.id} at ${year}`,
            ).toBe(true);
          }
        }
  });

  it("keeps coverage from regressing", () => {
    const { cells, covered } = coverage();
    /*
     * 93.9%. It fell to 69.3% first, as era corrections and two retirements
     * removed content that was covering places with the wrong names, then
     * rose past the original 78.5% as the gaps were authored. Coverage here
     * means plausible coverage.
     *
     * What is left uncovered is mostly correct: Polynesia, New Zealand,
     * Hawaii, Iceland and Madagascar were uninhabited at the early dates the
     * grid samples, and scripts/data/name-windows.json records the settlement
     * date for each rather than inventing people to name.
     *
     * Lower this threshold only alongside a deliberate era correction, and say
     * which one. Otherwise a drop means a window or a region was lost.
     */
    expect(covered / cells).toBeGreaterThan(0.93);
  });

  it("has no window a later one cannot be reached past", () => {
    for (const region of nameRegions) {
      const starts = region.windows.map((w) => w.years[0]);
      expect(new Set(starts).size, region.id).toBe(starts.length);
    }
  });

  it("holds no place names, ethnonyms, deities or titles as personal names", () => {
    // The porter weeds these, so the shipped table should hold none at all.
    const barred = nameTraditions.flatMap((t) =>
      [...t.masculine, ...t.feminine, ...t.familyNames].flatMap((n) => {
        const reason = barredNameEntry(n, t.id);
        return reason ? [`${t.id}: ${n} (${reason})`] : [];
      }),
    );
    expect(barred).toEqual([]);
  });

  it("leaves no tradition unreachable", () => {
    // An authored tradition no window and no community names is dead content,
    // which is how `herder` sat unusable in the livelihood table for months.
    const used = new Set([
      ...nameRegions.flatMap((r) =>
        r.windows.flatMap((w) => w.options.map((o) => o.tradition)),
      ),
      ...communityProfiles.flatMap((c) =>
        (c.nameTraditions ?? []).map((o) => o.tradition),
      ),
    ]);
    expect(nameTraditions.filter((t) => !used.has(t.id)).map((t) => t.id)).toEqual([]);
  });

  it("does not spread a plural society evenly across its traditions", () => {
    // Options came across weighted 1 each, so a window naming six traditions
    // made a sixth of the population each: a quarter of modern Patagonia came
    // out Mapuche and a quarter Welsh. Present-day windows carrying several
    // traditions need authored proportions.
    const flat = nameRegions.flatMap((r) =>
      r.windows
        .filter(
          (w) =>
            w.years[1] > 9000 &&
            w.options.length > 2 &&
            new Set(w.options.map((o) => o.weight)).size === 1,
        )
        .map(() => r.id),
    );
    expect(flat.length).toBeLessThanOrEqual(7);
  });

  it("keeps every pool usable", () => {
    // Weeding left some pools very thin; they are the authoring backlog.
    // A pool that empties would silently stop appearing anywhere.
    for (const t of nameTraditions)
      expect(t.masculine.length + t.feminine.length, t.id).toBeGreaterThan(8);
  });
});
