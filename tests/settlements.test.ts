import { describe, it, expect } from "vitest";
import { route } from "../src/core/routing";
import { planSettlement } from "../src/world/v3/plan";
import {
  patterns,
  settlementProfile,
} from "../src/content/settlements/profiles";
import { resolveSetting } from "../src/content/geography/resolve";
import { packForSetting } from "../src/content/geography/pack";
import { createSettingSession, Runtime } from "../src/runtime/session";
import { crossing } from "../src/world/v3/roads";
import type { SettlementWorld } from "../src/world/v3/generate";
import type { LandSample } from "../src/world/v2/landscape";
const setting = (q = "medieval Normandy") => {
  const r = resolveSetting(q);
  if ("error" in r) throw Error(r.error);
  return r.setting;
};
const flat = (): LandSample => ({
  elevation: 15,
  moisture: 0.5,
  water: 100,
  kind: "river",
  snow: false,
});
describe("settlement layout and movement", () => {
  it("routes by travel cost, reports budget exhaustion, and avoids blocked tiles", () => {
    const cost = (p: { x: number; y: number }) =>
      p.y === 0 && p.x > 0 && p.x < 8 ? 8 : 1;
    const r = route({ x: 0, y: 0 }, { x: 8, y: 0 }, cost);
    expect(r.status).toBe("found");
    expect(r.cost).toBe(10);
    expect(r.path.some((p) => p.y !== 0)).toBe(true);
    expect(
      route({ x: 0, y: 0 }, { x: 100, y: 100 }, () => 1, { maxNodes: 2 })
        .status,
    ).toBe("budget");
    expect(route({ x: 0, y: 0 }, { x: 2, y: 0 }, () => Infinity).status).toBe(
      "unreachable",
    );
  });
  it("fits six distinct forms with reachable doors, work areas, fields and gates", () => {
    const signatures = new Set<string>();
    for (const pattern of patterns) {
      const s = { ...setting(), settlementPattern: pattern };
      const p = planSettlement(
        {
          id: "s0_0",
          cx: 0,
          cy: 0,
          center: { x: 0, y: 0 },
          home: true,
          profile: settlementProfile(s),
        },
        packForSetting(s),
        "layout",
        flat,
        [],
      );
      expect(p.places.length, pattern).toBeGreaterThanOrEqual(
        Math.floor(p.site.profile.buildings * 0.7),
      );
      const footprint = new Set<string>();
      for (const b of p.places) {
        for (let y = b.y; y < b.y + b.h; y++)
          for (let x = b.x; x < b.x + b.w; x++) {
            const k = `${x},${y}`;
            expect(footprint.has(k)).toBe(false);
            footprint.add(k);
          }
      }
      for (const goal of [
        ...p.places.map((b) => b.entrance),
        ...Array.from(p.work.values(), (w) => w.work),
        ...p.plots.map((p) => p.access),
      ]) {
        expect(
          route(p.spawn, goal, (to) =>
            p.solid.has(`${to.x},${to.y}`) ? Infinity : 1,
          ).status,
          `${pattern}: ${JSON.stringify(goal)}`,
        ).toBe("found");
      }
      // The player has a home here; which index it lands on is not a contract,
      // and a town puts its civic range in the list first.
      expect(
        p.places.some((b) => b.owner === "player"),
        pattern,
      ).toBe(true);
      expect(p.actors.some((a) => a.id === "player")).toBe(false);
      signatures.add(JSON.stringify(p.places.map((b) => [b.x, b.y, b.sprite])));
    }
    expect(signatures.size).toBe(6);
  }, 30000);
  it("places crossings across rivers, never open sea", () => {
    const river = (_x: number, y: number): LandSample => ({
      ...flat(),
      water: Math.abs(y) - 6,
      kind: "river",
    });
    expect(
      crossing("river", { x: 0, y: 0 }, river, 30)?.points.length,
    ).toBeGreaterThan(10);
    expect(
      crossing(
        "sea",
        { x: 0, y: 0 },
        (x, y) => ({ ...river(x, y), kind: "sea" }),
        30,
      ),
    ).toBeUndefined();
  });
  it("keeps prop-filled generated households accessible", () => {
    const e = createSettingSession(setting(), "settlement-test"),
      p = (e.world as SettlementWorld).planAt(0, 0)!;
    expect(e.state.manifest).toMatchObject({
      generator: 3,
      simulation: 2,
      content: 2,
    });
    expect(e.blocked(e.state.player.pos.x, e.state.player.pos.y)).toBe(false);
    for (const b of p.places)
      expect(e.findRoute(e.state.player.pos, b.entrance).status, b.id).toBe(
        "found",
      );
    for (const [id, w] of p.work)
      expect(e.findRoute(e.state.player.pos, w.work).status, id).toBe("found");
    expect(e.state.objects.some((o) => o.id.endsWith("-prop0"))).toBe(true);
  }, 30000);
  it("keeps closed pens contained and opens gates as explicit player commands", () => {
    const e = createSettingSession(
      {
        ...setting("19th century Haiti farmer"),
        settlementPattern: "farmstead",
      },
      "pen-test",
    );
    const gate = e.state.objects.find((o) => o.kind === "gate")!;
    expect(gate).toBeDefined();
    // Isolate livestock while exercising actual collision and routine code.
    e.state.actors = e.state.actors.filter((a) => a.kind !== "human");
    e.state.player.pos = { ...gate.pos, y: gate.pos.y + 1 };
    e.act({
      actionId: "closed",
      expectedRevision: 0,
      command: { type: "wait", seconds: 120 },
    });
    expect(e.state.actors.every((a) => a.pos.y < gate.pos.y)).toBe(true);
    const rt = new Runtime(e);
    rt.walkTo({ x: gate.pos.x, y: gate.pos.y - 1 });
    for (let i = 0; i < 10 && rt.running; i++) rt.tick();
    expect(gate.open).toBe(true);
    expect(e.state.player.pos.y).toBe(gate.pos.y - 1);
    expect(
      e.state.log.some(
        (c) => c.command.type === "interact" && c.command.action === "open",
      ),
    ).toBe(true);
    rt.dispose();
  }, 20000);
});
it("renders the same chunks regardless of query order, including settlement boundaries", () => {
  const s = setting("Hellenistic Alexandria"),
    a = createSettingSession(s, "chunk-order"),
    b = createSettingSession(s, "chunk-order");
  const coords = [
    [-4, -1],
    [-1, -1],
    [0, 0],
    [3, 1],
    [7, 0],
  ];
  const expected = coords.map(([x, y]) => a.world.chunk(x, y));
  for (const [x, y] of [...coords].reverse()) b.world.chunk(x, y);
  coords.forEach(([x, y], i) =>
    expect(b.world.chunk(x, y)).toEqual(expected[i]),
  );
  for (const building of a.world.places)
    for (const [dx, dy] of [
      [0, 0],
      [building.w - 1, building.h - 1],
    ])
      expect(
        a.world.decoration(building.x + dx, building.y + dy),
      ).toBeUndefined();
}, 30000);
it("herders open their own pens by day and secure returned animals at night", () => {
  const e = createSettingSession(
    { ...setting("19th century Haiti farmer"), settlementPattern: "farmstead" },
    "pen-test", // This seed includes a herder with a generated pen under character revision 1.
  );
  const h = e.state.actors.find((a) => a.role === "Herder")!,
    sites = e.world.activitySites!(h.id)!,
    gate = e.state.objects.find((o) => o.id === sites.gateId)!;
  h.pos = { ...h.work };
  e.state.player.pos = { ...h.work, x: h.work.x + 2 };
  e.act({
    actionId: "day",
    expectedRevision: 0,
    command: { type: "wait", seconds: 18 },
  });
  expect(gate.open).toBe(true);
  e.state.clock = 19 * 3600;
  h.hunger = 0;
  h.pos = { ...h.work };
  for (const a of e.state.actors.filter((a) => a.owner === h.id))
    a.pos = { ...a.home };
  e.act({
    actionId: "night",
    expectedRevision: e.state.revision,
    command: { type: "wait", seconds: 18 },
  });
  expect(gate.open).toBe(false);
}, 120000);
