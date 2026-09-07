import { describe, it, expect } from "vitest";
import { createSession, restoreSession } from "../src/runtime/session";
import { createWorld } from "../src/world/generate";
import { packs } from "../src/content/packs";
import { findPath } from "../src/core/pathfinding";
import { canonical } from "../src/core/random";
import type { Engine } from "../src/core/engine";
import type { PlayerCommand, Position } from "../src/core/types";
let serial = 0;
const act = (e: Engine, command: PlayerCommand) =>
  e.act({
    actionId: `test-${serial++}`,
    expectedRevision: e.state.revision,
    command,
  });
function reach(e: Engine, target: Position) {
  const p = e.state.player.pos;
  for (const [dx, dy] of [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 0],
  ]) {
    const path = findPath(p, { x: target.x + dx, y: target.y + dy }, (x, y) =>
      e.blocked(x, y),
    );
    if (path.length) {
      for (const step of path)
        expect(
          act(e, { type: "move", dx: step.x - p.x, dy: step.y - p.y }).status,
        ).toBe("completed");
      return;
    }
  }
  throw Error("No route");
}
describe("shared deterministic foundation", () => {
  it("replays identical commands, including uncertainty, to the same physical hash", () => {
    const a = createSession("roman", "repeat"),
      b = createSession("roman", "repeat");
    for (let i = 0; i < 100; i++) {
      const c: PlayerCommand = { type: "wait", seconds: 30 };
      const req = {
        actionId: `same-${i}`,
        expectedRevision: a.state.revision,
        command: c,
      };
      expect(a.act(req)).toEqual(b.act(req));
    }
    expect(a.hash()).toBe(b.hash());
  });
  it("keeps chunk geometry stable under request order and negative coordinates", () => {
    const a = createWorld(packs.roman, "edges"),
      b = createWorld(packs.roman, "edges");
    const coords = [
      [0, 0],
      [1, 0],
      [-1, 0],
      [0, -1],
      [2, 2],
    ];
    const first = coords.map(([x, y]) => a.chunk(x, y));
    for (const [x, y] of [...coords].reverse()) b.chunk(x, y);
    coords.forEach(([x, y], i) => expect(b.chunk(x, y)).toEqual(first[i]));
    expect(a.chunk(-1, 0)[63]).toBe(a.terrain(-1, 0));
  });
  it("starts outside buildings with reachable entrances across varied seeds", () => {
    for (const pack of Object.values(packs))
      for (let i = 0; i < 12; i++) {
        const e = createSession(pack.id, `seed-${i}`);
        expect(e.blocked(e.state.player.pos.x, e.state.player.pos.y)).toBe(
          false,
        );
        for (const b of e.world.places.filter((p) => p.id.startsWith("s0"))) {
          expect(e.blocked(b.entrance.x, b.entrance.y)).toBe(false);
          expect(
            findPath(e.state.player.pos, b.entrance, (x, y) => e.blocked(x, y))
              .length,
            `${pack.id}/${i}/${b.id}`,
          ).toBeGreaterThan(0);
        }
      }
  }, 20000);
  it("deduplicates action IDs and rejects stale or changed requests without advancing time", () => {
    const e = createSession();
    const req = {
      actionId: "once",
      expectedRevision: 0,
      command: { type: "wait" as const, seconds: 60 },
    };
    const result = e.act(req),
      clock = e.state.clock;
    expect(e.act(req)).toEqual(result);
    expect(e.state.clock).toBe(clock);
    expect(
      e.act({ ...req, command: { type: "wait", seconds: 1 } }).status,
    ).toBe("rejected");
    expect(e.act({ ...req, actionId: "stale" }).status).toBe("rejected");
    expect(e.state.clock).toBe(clock);
  });
  it("does not advance time when observing, inspecting, or writing a note", () => {
    const e = createSession(),
      clock = e.state.clock,
      hash = e.hash();
    for (let i = 0; i < 20; i++) {
      e.observe();
      e.inspect("s0-person-1");
    }
    e.state.notes.push({ id: 1, time: clock, text: "An observation" });
    expect(e.state.clock).toBe(clock);
    expect(e.hash()).toBe(hash);
  });
  it("conceals unobserved targets and private actor state", () => {
    const e = createSession();
    expect(e.inspect("s3-person-1")).toBeUndefined();
    expect(e.inspect("s0-house-0-chest")).toBeUndefined();
    for (const a of e.observe().actors) {
      expect(a).not.toHaveProperty("inventory");
      expect(a).not.toHaveProperty("memories");
      expect(a).not.toHaveProperty("trust");
    }
  });
  it("preserves trade quantities atomically and rejects impossible transfers", () => {
    const e = createSession();
    const a = e.state.actors[0];
    a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    const totals = () => [
      e.state.player.inventory.coin! + a.inventory.coin!,
      e.state.player.inventory.bread! + a.inventory.bread!,
    ];
    const before = totals();
    expect(
      act(e, {
        type: "trade",
        target: a.id,
        give: "coin",
        giveQuantity: 2,
        take: "bread",
        takeQuantity: 1,
      }).status,
    ).toBe("completed");
    expect(totals()).toEqual(before);
    const hash = e.hash();
    expect(
      act(e, {
        type: "trade",
        target: a.id,
        give: "coin",
        giveQuantity: 999,
        take: "bread",
        takeQuantity: 1,
      }).status,
    ).toBe("rejected");
    expect(e.hash()).toBe(hash);
  });
  it("uses barter in the Neolithic pack and preserves item exclusions", () => {
    const e = createSession("neolithic");
    expect(e.state.player.inventory.coin).toBeUndefined();
    expect(e.world.pack.currency).toBeUndefined();
    const a = e.state.actors[0];
    a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    expect(
      act(e, {
        type: "trade",
        target: a.id,
        give: "obsidian",
        giveQuantity: 1,
        take: "grain",
        takeQuantity: 1,
      }).status,
    ).toBe("completed");
    expect(e.state.player.inventory.grain).toBe(7);
  });
  it("enters and leaves the same persistent household after reload", () => {
    const e = createSession();
    const b = e.world.places.find((p) => p.access === "public")!;
    reach(e, { ...b.entrance, space: "outside" });
    expect(
      act(e, { type: "interact", target: b.id, action: "enter" }).status,
    ).toBe("completed");
    const restored = restoreSession(e.snapshot());
    expect(restored.hash()).toBe(e.hash());
    expect(restored.state.player.pos.space).toBe(b.id);
    expect(
      act(restored, {
        type: "interact",
        target: `${b.id}-exit`,
        action: "exit",
      }).status,
    ).toBe("completed");
    expect(restored.state.player.pos).toEqual({
      ...b.entrance,
      space: "outside",
    });
  });
  it("records a theft, local witnesses, and real restitution", () => {
    const e = createSession("roman", undefined, undefined, undefined, 1);
    const o = e.state.objects.find((o) => o.kind === "container")!;
    o.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
    const witness = e.state.actors[0];
    witness.pos = { ...e.state.player.pos, y: e.state.player.pos.y + 1 };
    const oldOwner = o.owner;
    expect(
      act(e, { type: "interact", target: o.id, action: "take" }).status,
    ).toBe("completed");
    expect(o.owner).toBe(oldOwner);
    expect(o.depleted).toBe(true);
    expect(witness.memories.some((x) => x.includes(o.id))).toBe(true);
    expect(
      act(e, { type: "interact", target: o.id, action: "return" }).status,
    ).toBe("completed");
    expect(o.depleted).toBe(false);
  });
  it("captured animals never respawn after save and reload", () => {
    const e = createSession();
    const a = e.state.actors.find((a) => a.kind === "lizard")!;
    let captured = false;
    for (let i = 0; i < 15 && !captured; i++) {
      a.pos = { ...e.state.player.pos, x: e.state.player.pos.x + 1 };
      act(e, { type: "interact", target: a.id, action: "capture" });
      captured = !e.state.actors.some((x) => x.id === a.id);
    }
    expect(captured).toBe(true);
    expect(
      restoreSession(e.snapshot()).state.actors.some((x) => x.id === a.id),
    ).toBe(false);
    expect(e.state.player.inventory.lizard).toBe(1);
  });
  it("rejects incompatible and malformed saves before replacement", () => {
    const e = createSession();
    const save = e.snapshot();
    expect(() =>
      restoreSession({ ...save, manifest: { ...save.manifest, generator: 2 } }),
    ).toThrow();
    expect(() =>
      restoreSession({
        ...save,
        player: { ...save.player, inventory: { coin: -4 } },
      }),
    ).toThrow();
  });
  it("supports a full procedural day in each pack, with persistent activity and no API", () => {
    for (const pack of Object.values(packs)) {
      const e = createSession(pack.id, "full-day");
      const first = canonical(e.state.actors.map((a) => a.pos));
      for (let i = 0; i < 12; i++) {
        expect(act(e, { type: "wait", seconds: 3600 }).status).toBe(
          "completed",
        );
        if ((e.state.player.inventory.grain ?? 0) > 0)
          act(e, { type: "use", item: "grain" });
        else if ((e.state.player.inventory.bread ?? 0) > 0)
          act(e, { type: "use", item: "bread" });
      }
      expect(e.state.clock).toBeGreaterThanOrEqual(21 * 3600);
      expect(canonical(e.state.actors.map((a) => a.pos))).not.toBe(first);
      expect(restoreSession(e.snapshot()).hash()).toBe(e.hash());
    }
  }, 20000);
});
