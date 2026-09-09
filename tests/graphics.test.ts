import { it, expect } from "vitest";
import { buildingModels } from "../src/content/graphics/models";
import {
  createLabRuntime,
  parseLabConfig,
  labURL,
  studies,
} from "../src/dev/fixtures";
import { findPath } from "../src/core/pathfinding";
import atlas from "../src/render/generated/atlas.json" with { type: "json" };

it("every construction family has usable entrance geometry and matching compiled art", () => {
  for (const study of Object.keys(studies))
    for (const scene of ["board", "settlement"]) {
      const runtime = createLabRuntime(
        parseLabConfig(`study=${study}&scene=${scene}&bank=earth`),
      );
      const w = runtime.engine.world;
      for (const p of w.places) {
        const m = buildingModels[p.sprite];
        expect(m.footprint).toEqual([p.w, p.h]);
        expect(w.blocked(p.entrance.x, p.entrance.y, "outside")).toBe(false);
        const source = (
          atlas.frames as Record<
            string,
            { sourceSize: { w: number; h: number } }
          >
        )[p.sprite].sourceSize;
        expect([source.w, source.h]).toEqual(m.bounds.slice(2));
        expect(m.anchor[0]).toBeGreaterThan(0);
        expect(m.anchor[1]).toBeLessThanOrEqual(source.h);
      }
      if (scene === "board")
        for (const p of w.places) {
          const path = findPath(
            w.spawn,
            p.entrance,
            (x, y) => w.blocked(x, y, "outside"),
            5000,
          );
          expect(path.length, `${study}: ${p.id}`).toBeGreaterThan(0);
        }
      runtime.dispose();
    }
});
it("lab links round-trip camera and rendering controls and reject malformed presets", () => {
  const config = parseLabConfig(
    "study=mudbrick&zoom=3&bank=earth&lighting=dusk&debug=1&panX=-12&panY=6&format=portrait&shadows=0",
  );
  expect(parseLabConfig(labURL(config).split("?")[1])).toEqual(config);
  expect(parseLabConfig("study=__proto__&zoom=1.8").study).toBe("classical");
  expect(parseLabConfig("zoom=1.8").zoom).toBe(2);
});

it("compiles the review-only modern infill set at all three compact footprints", () => {
  const candidates = Object.entries(buildingModels).filter(
    ([id, model]) =>
      (model as any).candidate && !/-(north|east|west)$/.test(id),
  );
  expect(candidates).toHaveLength(18);
  expect(
    new Set(candidates.map(([, model]) => (model as any).footprint.join("×"))),
  ).toEqual(new Set(["3×2", "4×2", "3×3"]));
  for (const [id, model] of candidates) {
    const candidate = model as any;
    expect(candidate.candidateType).toBeTruthy();
    expect(candidate.candidateGroup).toBeTruthy();
    expect(candidate.variant).toBeGreaterThanOrEqual(0);
    for (const facing of ["north", "east", "west"])
      expect((buildingModels as any)[`${id}-${facing}`].candidate).toBe(true);
  }
});
