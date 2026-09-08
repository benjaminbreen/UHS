import { expect, it } from "vitest";
import { regionalTransport } from "../src/world/regional/transport";
import type { RegionalContext } from "../src/world/regional/context";
import type { Site } from "../src/world/v3/types";
import type { Sample } from "../src/world/v3/roads";
const context = {
  profiles: [],
  activePlaces: [],
  origin: { x: 0, y: 0 },
  settingAt: () => ({ year: 0, roadRevision: 1 }),
} as unknown as RegionalContext;
const sample: Sample = () => ({
  elevation: 0,
  moisture: 0.3,
  water: 50,
  kind: "river",
  snow: false,
});
const sites = [0, 24, 48, 72].map((x, i) => ({
  id: `site${i}`,
  cx: 0,
  cy: 0,
  center: { x, y: 0 },
})) as Site[];
const sitesIn = (x: number, y: number) => (x === 0 && y === 0 ? sites : []);
it("removes redundant settlement connections without losing the backbone", () => {
  const transport = regionalTransport(context, sitesIn, sample);
  const connections = transport.connectionsIn({ x: 0, y: 0, w: 75, h: 10 });
  expect(connections).toHaveLength(3);
  expect(connections.every((c) => c.status === "routed")).toBe(true);
  expect(new Set(connections.flatMap((c) => [c.from, c.to])).size).toBe(4);
});
it("produces identical road geometry regardless of area request order", () => {
  const a = regionalTransport(context, sitesIn, sample),
    b = regionalTransport(context, sitesIn, sample);
  const left = { x: -40, y: -10, w: 10, h: 20 },
    right = { x: 85, y: -10, w: 10, h: 20 },
    all = { x: 0, y: 0, w: 75, h: 10 };
  a.roadsIn(left);
  a.roadsIn(right);
  b.roadsIn(right);
  b.roadsIn(left);
  expect(a.roadsIn(all)).toEqual(b.roadsIn(all));
});

it("retains bridge geometry when a regional route shares a crossing", () => {
  const towns = [
    { id: "a", center: { x: 0, y: 0 } },
    { id: "b", center: { x: 60, y: -30 } },
    { id: "c", center: { x: 60, y: 30 } },
  ].map((p) => ({ ...p, cx: 0, cy: 0 })) as Site[];
  const river: Sample = (x, y) => ({
    ...sample(x, y),
    water: Math.abs(x - 30) - 3,
  });
  const transport = regionalTransport(
    context,
    (x, y) => (x === 0 && y === 0 ? towns : []),
    river,
  );
  const roads = transport.roadsIn({ x: -40, y: -80, w: 150, h: 150 });
  const deck = new Set<string>();
  for (const b of roads.filter((r) => r.kind === "bridge"))
    for (const p of b.points)
      for (let y = -1; y <= 1; y++)
        for (let x = -1; x <= 1; x++) deck.add(`${p.x + x},${p.y + y}`);
  expect(deck.size).toBeGreaterThan(0);
  for (const r of roads.filter((r) => r.kind !== "bridge"))
    for (const p of r.points)
      if (river(p.x, p.y).water < 0)
        expect(deck.has(`${p.x},${p.y}`)).toBe(true);
  expect(
    transport
      .connectionsIn({ x: -40, y: -80, w: 150, h: 150 })
      .every((c) => c.status === "routed"),
  ).toBe(true);
});
