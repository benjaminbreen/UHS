import { expect, it, vi } from "vitest";
import {
  claimEnvelope,
  buildingPlacementEnvelope,
  cultivatedAt,
  createPlacementClaims,
  envelopeConflicts,
  treePlacementEnvelope,
} from "../src/world/v3/placement";
import { buildingModel } from "../src/content/graphics/models";
import type { FieldCell } from "../src/world/v3/farmland";
import { planSettlement } from "../src/world/v3/plan";
import { resolveSetting } from "../src/content/geography/resolve";
import { packForSetting } from "../src/content/geography/pack";
import { settlementProfile } from "../src/content/settlements/profiles";
import * as buildingScale from "../src/content/graphics/building-scale";
import { route } from "../src/core/routing";
import type { WorldSetting } from "../src/content/geography/types";

const setting = (revision: 0 | 1): WorldSetting => {
  const resolved = resolveSetting("medieval Normandy");
  if ("error" in resolved) throw Error(resolved.error);
  return { ...resolved.setting, placementRevision: revision, terrainRevision: 2, vegetationRevision: 8, water: "none",
    environment: { ecology: "temperate-woodland", landform: "plain", population: "sparse", start: "resident", household: "mixed" } };
};
const flat = () => ({ elevation: 14, moisture: 0.5, water: 100, kind: "river" as const, snow: false });
const siteFor = (s: WorldSetting) => ({ id: "s0_0", cx: 0, cy: 0, center: { x: 0, y: 0 }, home: true, profile: settlementProfile(s) });

it("placement revision keeps roofs, crops, trees and working approaches separate", () => {
  const build = (revision: 0 | 1) => {
    const s = setting(revision);
    return planSettlement(siteFor(s), packForSetting(s), "placement-composition", flat, []);
  };
  const before = build(0), after = build(1);
  expect(after.places.length).toBeGreaterThanOrEqual(before.places.length * 0.7);
  let previousOverlap = 0;
  for (const plan of [before, after])
    for (const b of plan.places) {
      const roof = buildingPlacementEnvelope(b.sprite, b, []).clearance;
      for (const other of plan.places.filter(p => p !== b)) {
        const overlap = roof.some(p => p.x >= other.x && p.x < other.x + other.w && p.y >= other.y && p.y < other.y + other.h);
        if (plan === before) previousOverlap += Number(overlap);
        else expect(overlap, `${b.id} over ${other.id}`).toBe(false);
      }
      if (plan === after) {
        expect(roof.every(p => plan.placement.clearance.has(`${p.x},${p.y}`))).toBe(true);
        expect(roof.some(p => cultivatedAt(plan, p.x, p.y))).toBe(false);
        expect(plan.solid.has(`${b.entrance.x},${b.entrance.y}`)).toBe(false);
        expect(route(plan.spawn, b.entrance, p => plan.solid.has(`${p.x},${p.y}`) ? Infinity : 1).status).toBe("found");
      }
    }
  expect(previousOverlap).toBeGreaterThan(0);
  for (const tree of after.objects.filter(o => o.kind === "tree" && o.pos.space === "outside"))
    expect(treePlacementEnvelope(tree.sprite, tree.pos).clearance.some(p => cultivatedAt(after, p.x, p.y))).toBe(false);
});

it("placement revision fits a narrower house when the preferred foundation cannot fit a terrace", () => {
  const s = setting(1), pack = packForSetting(s);
  const pick = vi.spyOn(buildingScale, "chooseBuildingFrame").mockReturnValue("house-cottage-thatch-0");
  const terraces = (x: number) => ({ ...flat(), elevation: Math.abs(Math.floor(x / 6) % 2) * 14 });
  try {
    const plan = planSettlement(siteFor(s), { ...pack, buildings: ["house-cottage-thatch-0", "house-cottage-timber-0"] },
      "fallback-fit", terraces, [{ id: "through", points: Array.from({ length: 141 }, (_, x) => ({ x: x - 70, y: 0 })), width: 1, kind: "street", cost: 140 }]);
    const houses = plan.places.filter(p => /^s0_0-h\d+$/.test(p.id));
    expect(houses.length).toBeGreaterThan(0);
    expect(houses.every(p => p.w <= 6)).toBe(true);
    for (const p of houses)
      for (let x = p.x; x < p.x + p.w; x++) expect(terraces(x).elevation).toBe(terraces(p.x).elevation);
  } finally { pick.mockRestore(); }
});

it("keeps cropped cells distinct from walkable pasture and legacy field surfaces", () => {
  const field: FieldCell = { parcel: 1, crop: "wheat", axis: "x", edges: 0, fence: 0, boundary: "none", wet: false };
  const plan = { fields: new Map([["1,1", field], ["2,1", { ...field, crop: "pasture" as const }]]), surface: new Map([["3,1", "field" as const]]) };
  expect(cultivatedAt(plan, 1, 1)).toBe(true);
  expect(cultivatedAt(plan, 2, 1)).toBe(false);
  expect(cultivatedAt(plan, 3, 1)).toBe(true);
  expect(cultivatedAt(plan, 4, 1)).toBe(false);
});

it("reserves a building's drawn overhang independently of its footprint and approaches", () => {
  const frame = "house-cottage-thatch-0", m = buildingModel(frame);
  const rect = { x: 10, y: 20, w: m.footprint[0], h: m.footprint[1] };
  const access = { x: 13, y: 23 }, envelope = buildingPlacementEnvelope(frame, rect, [access]);
  expect(envelope.occupied.length).toBe(rect.w * rect.h);
  expect(envelope.clearance.some(p => p.y < rect.y - 2)).toBe(true);
  expect(envelope.clearance.some(p => p.x >= rect.x + rect.w)).toBe(true);
  expect(envelope.access).toEqual([access]);
  const claims = createPlacementClaims();
  claimEnvelope(claims, envelope);
  expect(claims.occupied.has("10,18")).toBe(false);
  expect(claims.clearance.has("10,18")).toBe(true);
  expect(claims.access.has("13,23")).toBe(true);
});

it("separates movement collision from visible canopy clearance", () => {
  const envelope = treePlacementEnvelope("nature-broadleaf-mature", {
    x: 10,
    y: 10,
  });
  expect(envelope.occupied).toEqual([{ x: 10, y: 10 }]);
  expect(envelope.clearance.some((p) => p.y < 10)).toBe(true);
  expect(envelope.clearance.length).toBeGreaterThan(envelope.occupied.length);
});

it("rejects a crown crossing a route while allowing distant claims", () => {
  const claims = createPlacementClaims();
  claims.access.add("10,7");
  const near = treePlacementEnvelope("nature-broadleaf-mature", {
    x: 10,
    y: 10,
  });
  const far = treePlacementEnvelope("nature-broadleaf-mature", {
    x: 30,
    y: 30,
  });
  expect(envelopeConflicts(claims, near)).toBe(true);
  expect(envelopeConflicts(claims, far)).toBe(false);
  claimEnvelope(claims, far);
  expect(claims.occupied.has("30,30")).toBe(true);
  expect(claims.clearance.size).toBeGreaterThan(1);
});
