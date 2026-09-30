import { describe, expect, it } from "vitest";
import { interiorProfiles, resolveRoom } from "../src/content/interiors";
import { planRoom, roomMask, type Shape } from "../src/render/interiors/room";

const shapes: Shape[] = ["rect", "L", "round", "oval", "apse", "courtyard"];

describe("interior profiles", () => {
  it("plan every profile at every status, shape and size without overlaps or props outside the walls", () => {
    for (const pr of interiorProfiles)
      for (const room of (pr.rooms ?? [pr]).map((_, i) => i))
      for (const status of [0, 1, 2] as const)
        for (const shape of shapes)
          for (const [w, d] of [pr.size, [8, 6], [24, 16]]) {
            const p = resolveRoom(pr, { seed: 11, room, status, colorway: -1, w, d, shape, hour: 10 });
            const props = planRoom(p), mask = roomMask(p);
            const seen = new Set<number>();
            for (const q of props) {
              if (q.wall || q.kind === "rug" || q.kind === "cat" || q.kind === "fountain" || q.kind === "clutter") continue;
              for (let y = q.y; y < q.y + q.d; y++)
                for (let x = q.x; x < q.x + q.w; x++) {
                  expect(mask[y * w + x], `${pr.id} ${q.kind} at ${x},${y}`).toBeGreaterThan(0);
                  expect(seen.has(y * w + x), `${pr.id} ${q.kind} overlaps at ${x},${y}`).toBe(false);
                  seen.add(y * w + x);
                }
            }
            expect(props.filter((q) => q.kind === "door").length).toBe(pr.door === "none" ? 0 : 1);
          }
  });

  it("gives every profile colourways and a note on its evidence", () => {
    for (const pr of interiorProfiles) {
      expect(pr.colorways.length, pr.id).toBeGreaterThanOrEqual(2);
      expect(pr.note.length, pr.id).toBeGreaterThan(40);
    }
  });
});
