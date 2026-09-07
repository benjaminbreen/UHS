import { cultures } from "../src/content/history/types";
import { eras } from "../src/content/history/dates";
import { describe, it, expect } from "vitest";
import { createSession, restoreSession, Runtime } from "../src/runtime/session";
import { propKit, propDefs } from "../src/content/props/catalog";
import { packs } from "../src/content/packs";
import type { PlayerCommand, WorldObject } from "../src/core/types";
import type { Engine } from "../src/core/engine";
let serial = 0;
const act = (e: Engine, command: PlayerCommand) =>
  e.act({
    actionId: `prop-${serial++}`,
    expectedRevision: e.state.revision,
    command,
  });
const interaction = (e: Engine, o: WorldObject, action: any) =>
  act(e, { type: "interact", target: o.id, action });
function fixture() {
  const e = createSession("roman", "prop-fixture");
  const pos = e.state.player.pos;
  const pot: WorldObject = {
    id: "test-pot",
    prop: "pot",
    name: "Test pot",
    kind: "container",
    sprite: "study-prop-earthen-pot-0",
    pos: { ...pos, x: pos.x + 1 },
    inventory: { grain: 3, water: 2 },
  };
  const stick: WorldObject = {
    id: "test-stick",
    prop: "stick",
    name: "Stout stick",
    kind: "container",
    sprite: "study-prop-stick-0",
    pos: { ...pos, y: pos.y + 1 },
    inventory: {},
  };
  e.state.objects.push(pot, stick);
  return { e, pot, stick };
}
describe("interactive props", () => {
  it("hides contents until opened, carries identity, drops and conserves goods across break and reload", () => {
    const { e, pot, stick } = fixture();
    expect(e.inspect(pot.id)?.inventory).toBeUndefined();
    expect(e.observe().objects.find((o) => o.id === pot.id)?.inventory).toEqual(
      {},
    );
    expect(interaction(e, pot, "take").status).toBe("rejected");
    expect(interaction(e, pot, "pickup").status).toBe("completed");
    expect(e.state.player.held).toBe(pot.id);
    expect(interaction(e, stick, "pickup").status).toBe("rejected");
    expect(interaction(e, pot, "look").status).toBe("completed");
    expect(e.inspect(pot.id)?.inventory).toEqual({ grain: 3, water: 2 });
    expect(restoreSession(e.snapshot()).hash()).toBe(e.hash());
    expect(interaction(e, pot, "drop").status).toBe("completed");
    expect(pot.carriedBy).toBeUndefined();
    expect(interaction(e, pot, "strike").status).toBe("rejected");
    expect(interaction(e, stick, "pickup").status).toBe("completed");
    expect(interaction(e, pot, "strike").status).toBe("completed");
    expect(pot.broken).toBe(true);
    expect(pot.inventory).toEqual({ grain: 3, water: 2 });
    expect(interaction(e, pot, "strike").status).toBe("rejected");
    const prior = e.state.player.inventory.grain ?? 0;
    const request = {
      actionId: "one-transfer",
      expectedRevision: e.state.revision,
      command: {
        type: "interact" as const,
        target: pot.id,
        action: "take" as const,
      },
    };
    expect(e.act(request).status).toBe("completed");
    e.act(request);
    expect(e.state.player.inventory.grain).toBe(prior + 3);
    expect(Object.values(pot.inventory).every((n) => !n)).toBe(true);
    const restored = restoreSession(e.snapshot());
    expect(restored.hash()).toBe(e.hash());
    expect(restored.state.objects.filter((o) => o.id === pot.id)).toHaveLength(
      1,
    );
  });
  it("rejects remote pickup, broken pickup and forged held identities; retains ownership", () => {
    const { e, pot } = fixture();
    pot.owner = "household";
    interaction(e, pot, "pickup");
    expect(pot.owner).toBe("household");
    expect(e.state.player.memories).toContain(`property:${pot.id}`);
    const bad = e.snapshot();
    bad.player.held = "missing";
    expect(() => restoreSession(bad)).toThrow();
    interaction(e, pot, "drop");
    pot.pos.x += 30;
    expect(interaction(e, pot, "pickup").status).toBe("rejected");
  });
  it("plays back new prop actions deterministically and retains old content manifests", () => {
    const e = createSession("roman", "replay-props");
    const stick = e.state.objects.find((o) => o.id === "prop-arrival-stick")!;
    expect(stick).toBeTruthy();
    expect(interaction(e, stick, "pickup").status).toBe("completed");
    const rt = new Runtime(createSession("roman", "unused"), {
      cacheTerrain: false,
    });
    rt.loadReplay({
      manifest: e.state.manifest,
      commands: e.state.log,
      finalHash: e.hash(),
    });
    e.state.log.forEach(() => rt.stepReplay());
    expect(rt.engine.hash()).toBe(e.hash());
    rt.dispose();
    const old = createSession("roman", "legacy", undefined, undefined, 1);
    expect(old.state.objects.some((o) => o.prop)).toBe(false);
    expect(restoreSession(old.snapshot()).hash()).toBe(old.hash());
  });
  it("uses shared context kits with dated and regional differences, without modern containers in early settings", () => {
    expect(propKit(packs.neolithic).contexts.household).not.toContain(
      "plastic",
    );
    expect(propKit(packs.roman).contexts.yard).toContain("amphora");
    const modern = { ...packs.roman, year: 2000 };
    expect(propKit(modern).contexts.yard).toContain("plastic");
    for (const p of [packs.roman, packs.neolithic, modern])
      for (const ids of Object.values(propKit(p).contexts))
        for (const id of ids) expect(propDefs[id]).toBeTruthy();
  });
  it("provides reachable prop pockets without occupying entrances in both demos", () => {
    for (const pack of ["roman", "neolithic"]) {
      const e = createSession(pack, "placement");
      for (const o of e.state.objects.filter((o) => o.prop)) {
        expect(e.world.blocked(o.pos.x, o.pos.y, o.pos.space), o.id).toBe(
          false,
        );
        if (o.pos.space === "outside")
          for (const b of e.world.places)
            expect(
              Math.hypot(b.entrance.x - o.pos.x, b.entrance.y - o.pos.y),
              o.id,
            ).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

it("all twelve eras and culture families resolve a nonempty, known prop set", () => {
  for (const era of eras)
    for (const [culture] of cultures) {
      const pack = {
        ...packs.roman,
        year: era.sample.year,
        setting: { culture, placeId: "test-place", settlement: "village" },
      } as any;
      const kit = propKit(pack);
      expect(kit.era).toBe(era.id);
      for (const ids of Object.values(kit.contexts)) {
        expect(ids.length).toBeGreaterThan(0);
        for (const id of ids) expect(propDefs[id]).toBeTruthy();
        if (pack.year < 1850)
          expect(
            ids.some((id) => ["tin", "plastic", "carton"].includes(id)),
          ).toBe(false);
      }
    }
});

it("wood takes several strikes and damage persists without spilling early", () => {
  const { e, pot, stick } = fixture();
  pot.prop = "chest";
  interaction(e, stick, "pickup");
  interaction(e, pot, "strike");
  expect(pot.damage).toBe(1);
  expect(pot.broken).not.toBe(true);
  const restored = restoreSession(e.snapshot()),
    o = restored.state.objects.find((o) => o.id === pot.id)!;
  expect(o.damage).toBe(1);
  interaction(restored, o, "strike");
  expect(o.broken).not.toBe(true);
  interaction(restored, o, "strike");
  expect(o.broken).toBe(true);
  expect(o.inventory.grain).toBe(3);
});

it("solid props block their base tile; pickup and break clear it, while drops block again", () => {
  const { e, pot, stick } = fixture();
  const p = e.state.player.pos;
  const delta = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
  ].find(([x, y]) => !e.world.blocked(p.x + x, p.y + y, p.space))!;
  pot.pos = { ...p, x: p.x + delta[0], y: p.y + delta[1] };
  expect(e.blocked(pot.pos.x, pot.pos.y)).toBe(true);
  expect(act(e, { type: "move", dx: delta[0], dy: delta[1] }).status).toBe(
    "rejected",
  );
  expect(interaction(e, pot, "pickup").status).toBe("completed");
  expect(e.blocked(p.x + delta[0], p.y + delta[1])).toBe(false);
  expect(interaction(e, pot, "drop").status).toBe("completed");
  expect(e.blocked(pot.pos.x, pot.pos.y)).toBe(true);
  interaction(e, stick, "pickup");
  interaction(e, pot, "strike");
  expect(pot.broken).toBe(true);
  expect(e.blocked(pot.pos.x, pot.pos.y)).toBe(false);
  expect(propDefs.woodpile.solid).toBe(true);
  expect(propDefs.stick.solid).toBe(false);
});
