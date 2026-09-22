import { expect, it } from "vitest";
import {
  claimEnvelope,
  createPlacementClaims,
  envelopeConflicts,
  treePlacementEnvelope,
} from "../src/world/v3/placement";

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
