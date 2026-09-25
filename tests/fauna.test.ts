import { describe, expect, it } from "vitest";
import atlas from "../public/fauna/atlas.json" with { type: "json" };
import atlasB from "../public/fauna-b/atlas.json" with { type: "json" };
import atlasC from "../public/fauna-c/atlas.json" with { type: "json" };
import { faunaFacings, faunaFrames, faunaProfiles } from "../src/content/fauna";
import { faunaStates } from "../src/core/fauna";

const sideView = faunaProfiles.filter((profile) => !profile.directions);
/** Profiles drawn with another species' study. These are animals close enough
 * that a 40-pixel sprite cannot tell them apart, so they do not earn a sheet
 * of their own; anything else must be drawn as itself. */
const borrowed: Record<string, string> = {
  wapiti: "red-deer",
  "wild-turkey": "turkey",
};
const directional = faunaProfiles.filter((profile) => profile.directions);

describe("fauna profiles", () => {
  it("uses unique flat profiles with bounded behavior values", () => {
    expect(new Set(faunaProfiles.map((profile) => profile.id)).size).toBe(
      faunaProfiles.length,
    );
    for (const profile of faunaProfiles) {
      expect(profile.groupSize[0]).toBeGreaterThan(0);
      expect(profile.groupSize[1]).toBeGreaterThanOrEqual(profile.groupSize[0]);
      expect(profile.settlementTolerance).toBeGreaterThanOrEqual(0);
      expect(profile.settlementTolerance).toBeLessThanOrEqual(1);
      expect(profile.urgentDecisionSeconds).toBeLessThanOrEqual(
        profile.calmDecisionSeconds,
      );
      expect(profile.habitats.length).toBeGreaterThan(0);
    }
  });

  it("maps every state to existing native atlas frames", () => {
    // Set B is the world's art, so it is the set a profile must be complete in.
    const knownStates = new Set<string>(faunaStates);
    for (const profile of sideView)
      for (const [state, frames] of Object.entries(profile.art)) {
        expect(knownStates.has(state), `${profile.id}:${state}`).toBe(true);
        expect(frames?.length, `${profile.id}:${state}`).toBe(8);
        for (const id of frames ?? []) {
          const drawnAs = borrowed[profile.id] ?? profile.id;
          expect(
            id.startsWith(`fauna-${drawnAs}-`),
            `${profile.id}:${id}`,
          ).toBe(true);
          expect(
            (atlasB.frames as Record<string, unknown>)[
              id.replace(/^fauna-/, "faunab-")
            ],
            `${profile.id}:${id}`,
          ).toBeDefined();
        }
      }
    const referenced = sideView.flatMap((profile) =>
      Object.values(profile.art).flat(),
    );
    // A form (faunab-cattle.zebu-…) is a second drawing of a species the
    // profiles already name, so only the plain frames are counted.
    expect(new Set(referenced).size).toBe(
      Object.keys(atlasB.frames).filter((name) => !name.includes(".")).length,
    );
  });

  it("keeps the frozen A set drawable so the lab can still toggle to it", () => {
    // A was never extended past its six species; every frame it does carry
    // must still have a B twin, or the lab's A/B toggle breaks.
    const framesB = atlasB.frames as Record<string, unknown>;
    const framesA = Object.keys(atlas.frames);
    expect(framesA.length).toBeGreaterThan(0);
    for (const id of framesA)
      expect(framesB[id.replace(/^fauna-/, "faunab-")], id).toBeDefined();
  });
});

describe("four-direction fauna", () => {
  const frames = atlasC.frames as Record<
    string,
    { frame: { w: number; h: number } }
  >;

  it("authors every state in all four directions", () => {
    const knownStates = new Set<string>(faunaStates);
    const seen = new Set<string>();
    expect(directional.length).toBeGreaterThan(0);
    for (const profile of directional)
      for (const state of Object.keys(profile.art)) {
        expect(knownStates.has(state), `${profile.id}:${state}`).toBe(true);
        for (const facing of faunaFacings) {
          const ids = faunaFrames(profile, state as never, facing);
          expect([8, 16], `${profile.id}:${state}:${facing}`).toContain(
            ids.length,
          );
          for (const id of ids) {
            expect(id.startsWith(`faunac-${profile.id}-`)).toBe(true);
            expect(frames[id], id).toBeDefined();
            seen.add(id);
          }
        }
      }
    // A form (faunac-cattle.zebu-…) is a second drawing of a species the
    // profiles already name, so only the plain frames are counted.
    expect(seen.size).toBe(
      Object.keys(frames).filter((name) => !name.includes(".")).length,
    );
  });

  it("keeps the size hierarchy a person would expect", () => {
    const box = (id: string) => frames[id].frame;
    const kit = box("faunac-rabbit-kit-idle-east-0");
    const rabbit = box("faunac-rabbit-idle-east-0");
    const foal = box("faunac-foal-idle-east-0");
    const horse = box("faunac-horse-idle-east-0");
    expect(kit.w).toBeLessThan(rabbit.w);
    expect(rabbit.w).toBeLessThan(foal.w);
    expect(foal.w).toBeLessThan(horse.w);
  });
});

describe("dung", () => {
  it("names only real species and draws every sprite it uses", async () => {
    const { dungOf, dungItems } = await import("../src/content/fauna/dung");
    const nature = (await import("../public/nature/atlas.json")).default.frames;
    const ids = new Set(faunaProfiles.map((p) => p.id));
    for (const id of Object.keys(dungOf)) expect(ids.has(id), id).toBe(true);
    for (const item of Object.values(dungItems))
      expect(item.sprite in nature, item.sprite).toBe(true);
  });

  it("dries a pat to a cake and keeps only the newest past the cap", async () => {
    const { dungObject, ageDung, capDung, DUNG_CAP } = await import("../src/core/dung");
    const pos = { x: 0, y: 0, space: "outside" };
    const pat = dungObject("pat", pos, 0, "p", "cattle");
    expect(pat.from).toBe("cattle");
    expect(pat.item).toBe("cow-dung");
    ageDung(pat, 4 * 86400);
    expect(pat.item).toBe("dung-cake");
    expect(pat.sprite).toBe("nature-dung-pat-dry");
    expect(dungObject("droppings", pos, 0, "d", "chicken").item).toBeUndefined();
    const many = Array.from({ length: DUNG_CAP + 5 }, (_, i) => dungObject("pile", pos, i, `x${i}`, "horse"));
    const kept = capDung(many);
    expect(kept).toHaveLength(DUNG_CAP);
    expect(kept.some((o) => o.id === "x0")).toBe(false);
  });
});
