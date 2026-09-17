import { describe, expect, it } from "vitest";
import atlas from "../public/fauna/atlas.json" with { type: "json" };
import atlasB from "../public/fauna-b/atlas.json" with { type: "json" };
import atlasC from "../public/fauna-c/atlas.json" with { type: "json" };
import { faunaFacings, faunaFrames, faunaProfiles } from "../src/content/fauna";
import { faunaStates } from "../src/core/fauna";

const sideView = faunaProfiles.filter((profile) => !profile.directions);
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
    const knownStates = new Set<string>(faunaStates);
    for (const profile of sideView)
      for (const [state, frames] of Object.entries(profile.art)) {
        expect(knownStates.has(state), `${profile.id}:${state}`).toBe(true);
        expect(frames?.length, `${profile.id}:${state}`).toBe(8);
        for (const id of frames ?? []) {
          expect(id.startsWith(`fauna-${profile.id}-`)).toBe(true);
          expect(
            (atlas.frames as Record<string, unknown>)[id],
            `${profile.id}:${id}`,
          ).toBeDefined();
        }
      }
    const referenced = sideView.flatMap((profile) =>
      Object.values(profile.art).flat(),
    );
    expect(new Set(referenced).size).toBe(Object.keys(atlas.frames).length);
  });

  it("ships a B frame for every A frame so the lab can toggle between them", () => {
    const framesB = atlasB.frames as Record<string, { frame: { w: number; h: number } }>;
    for (const profile of sideView)
      for (const frames of Object.values(profile.art))
        for (const id of frames ?? []) {
          const idB = id.replace(/^fauna-/, "faunab-");
          expect(framesB[idB], idB).toBeDefined();
        }
    expect(Object.keys(framesB).length).toBe(Object.keys(atlas.frames).length);
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
          expect(ids.length, `${profile.id}:${state}:${facing}`).toBe(8);
          for (const id of ids) {
            expect(id.startsWith(`faunac-${profile.id}-`)).toBe(true);
            expect(frames[id], id).toBeDefined();
            seen.add(id);
          }
        }
      }
    expect(seen.size).toBe(Object.keys(frames).length);
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
