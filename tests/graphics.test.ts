import { it, expect } from "vitest";
import { buildingModels } from "../src/content/graphics/models";
import {
  createLabRuntime,
  parseLabConfig,
  labURL,
  studies,
} from "../src/dev/fixtures";
import { findPath } from "../src/core/pathfinding";
import buildings from "../src/render/generated/buildings.json" with { type: "json" };
import regionalBuildings from "../src/render/generated/regional-buildings.json" with { type: "json" };
import campBuildings from "../src/render/generated/camp-buildings.json" with { type: "json" };
import civic from "../src/render/generated/civic.json" with { type: "json" };
import {
  buildingScaleWeight,
  chooseBuildingFrame,
} from "../src/content/graphics/building-scale";

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
        const sheet =
          p.sprite in buildings.frames
            ? buildings
            : p.sprite in regionalBuildings.frames
              ? regionalBuildings
              : p.sprite in campBuildings.frames
                ? campBuildings
                : civic;
        const source = (
          sheet.frames as Record<
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

it("compiles seven oblique gold-master families at medium and large scale", () => {
  const gold = Object.entries(buildingModels).filter(
    ([id, model]) =>
      (model as any).goldMaster && !/-(north|east|west)$/.test(id),
  );
  expect(gold).toHaveLength(21);
  const families = new Map<string, any[]>();
  for (const [, model] of gold) {
    const m = model as any;
    const group = families.get(m.goldMaster) ?? [];
    group.push(m);
    families.set(m.goldMaster, group);
  }
  expect(families.size).toBe(7);
  for (const variants of families.values()) {
    expect(variants.filter((m) => m.goldScale === "medium")).toHaveLength(2);
    expect(variants.filter((m) => m.goldScale === "large")).toHaveLength(1);
    const medium = variants.find((m) => m.goldScale === "medium");
    const large = variants.find((m) => m.goldScale === "large");
    expect(large.footprint[0]).toBeGreaterThan(medium.footprint[0]);
    expect(large.footprint[1]).toBeGreaterThan(medium.footprint[1]);
  }
});

it("weights gold-master scale by settlement density, means and quarter", () => {
  const poorEdge = {
    settlement: "village" as const,
    density: 0.15,
    wealth: 18,
    quarter: "edge" as const,
  };
  const richCentre = {
    settlement: "city" as const,
    density: 0.95,
    wealth: 88,
    quarter: "elite" as const,
  };
  expect(buildingScaleWeight("large", richCentre)).toBeGreaterThan(
    buildingScaleWeight("large", poorEdge) * 20,
  );
  expect(buildingScaleWeight("small", poorEdge)).toBeGreaterThan(
    buildingScaleWeight("small", richCentre),
  );
  const family = [
    "house-round-0",
    "house-round-gold-medium-0",
    "house-round-gold-medium-1",
    "house-round-gold-large-0",
  ];
  expect(chooseBuildingFrame(family, richCentre, 0.999, 0.5)).toContain(
    "gold-large",
  );
});
