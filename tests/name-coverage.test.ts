import { describe, it, expect } from "vitest";
import { coverage, optionsAt } from "../scripts/check-name-coverage";
import { nameTraditions } from "../src/content/characters/profiles/traditions.generated";
import { nameRegions } from "../src/content/characters/profiles/name-regions.generated";
import { barredNameEntry } from "../src/content/characters/name-entries";

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
     * 71.3%. This number went DOWN from 78.5% on purpose: correcting the era
     * floors on nineteen traditions removed content that was covering a place
     * with names from the wrong century, and the cells it was covering now
     * fall back to invented names instead. Coverage here means plausible
     * coverage, so authoring is the only thing that should raise it.
     *
     * Lower this threshold only alongside a deliberate era correction, and say
     * which one. Otherwise a drop means a window or a region was lost.
     */
    expect(covered / cells).toBeGreaterThan(0.71);
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
        const reason = barredNameEntry(n);
        return reason ? [`${t.id}: ${n} (${reason})`] : [];
      }),
    );
    expect(barred).toEqual([]);
  });

  it("keeps every pool usable", () => {
    // Weeding left some pools very thin; they are the authoring backlog.
    // A pool that empties would silently stop appearing anywhere.
    for (const t of nameTraditions)
      expect(t.masculine.length + t.feminine.length, t.id).toBeGreaterThan(8);
  });
});
