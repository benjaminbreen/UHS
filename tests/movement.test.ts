import { expect, it, vi } from "vitest";
import { createSession } from "../src/runtime/session";
import type { PlayerCommand } from "../src/core/types";
import { itineraryAt, type Itinerary } from "../src/core/itinerary";

it("accepts all eight directions, charges longer diagonals and prevents corner cutting", () => {
  const e = createSession("roman", "movement");
  const blocked = vi.spyOn(e, "blocked").mockReturnValue(false);
  let serial = 0;
  const move = (dx: number, dy: number) =>
    e.act({
      actionId: `movement-${serial++}`,
      expectedRevision: e.state.revision,
      command: { type: "move", dx, dy },
    });
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ]) {
    const before = { ...e.state.player.pos };
    const result = move(dx, dy);
    expect(result.status).toBe("completed");
    expect(result.elapsedSeconds).toBe(dx && dy ? 3 : 2);
    expect(e.state.player.pos).toEqual({
      ...before,
      x: before.x + dx,
      y: before.y + dy,
    });
  }
  const p = { ...e.state.player.pos };
  for (const [x, y] of [
    [p.x + 1, p.y],
    [p.x, p.y + 1],
    [p.x + 1, p.y + 1],
  ]) {
    blocked.mockImplementation((tx, ty) => tx === x && ty === y);
    expect(move(1, 1).status).toBe("rejected");
    expect(e.state.player.pos).toEqual(p);
  }
  for (const [dx, dy] of [
    [0, 0],
    [2, 0],
    [1, 2],
    [0.5, 1],
  ])
    expect(move(dx, dy).status).toBe("rejected");
});

it("keeps routine collision positions current between simulation ticks", () => {
  const e = createSession("roman", "routine-position");
  const actor = e.state.actors.find((a) => a.kind === "human")!;
  const start = { ...actor.pos, x: actor.pos.x + 20 };
  e.state.clock = 0;
  actor.pos = start;
  actor.offRoutine = false;
  actor.hunger = 0;
  const routine: Itinerary = {
    start: 0,
    period: 0.2,
    segments: [{
      from: 0,
      to: 0.2,
      pos: start,
      path: [{ x: start.x + 1, y: start.y }, { x: start.x + 2, y: start.y }],
      activity: "work",
      label: "Walking",
    }],
  };
  e.world.itinerary = (id) => id === actor.id ? routine : undefined;
  e.advance(9);
  expect(actor.pos.x).toBe(Math.round(itineraryAt(routine, e.state.clock).x));
});


function hazardField(seed: string) {
  const e = createSession("roman", seed);
  e.state.actors = [];
  e.state.objects = [];
  e.state.fauna = [];
  e.world.fauna = undefined;
  e.world.canCross = undefined;
  e.world.blocked = () => false;
  e.world.decoration = () => undefined;
  e.world.topography = undefined;
  e.world.elevation = () => 0;
  e.world.terrain = () => "grass";
  e.state.player.pos = { x: 0, y: 0, space: "outside" };
  e.state.player.health = 100;
  return e;
}

it("hurts a runner on impact once, without hurting walking bumps or repeated wall presses", () => {
  for (const run of [false, true]) {
    const e = hazardField(`impact-${run}`);
    e.world.blocked = (x) => x === 3;
    let n = 0;
    const move = () => e.act({ actionId: `impact-${n++}`, expectedRevision: e.state.revision,
      command: { type: "move", dx: 1, dy: 0, run } });
    move();
    move();
    const command: PlayerCommand = { type: "move", dx: 1, dy: 0, run };
    e.validate(command);
    e.validate(command);
    expect(e.state.player.health).toBe(100);
    expect(move().status).toBe(run ? "completed" : "rejected");
    expect(e.state.player.pos.x).toBe(2);
    const health = run ? 90 : 100;
    expect(e.state.player.health).toBe(health);
    for (let i = 0; i < 5; i++) expect(move().status).toBe("rejected");
    expect(e.state.player.health).toBe(health);
  }
});

it("does not damage glancing diagonal movement or a runner who has stopped", () => {
  const e = hazardField("glancing-impact");
  e.world.blocked = (x, y) => x === 3 && y === 3;
  e.execute({ type: "move", dx: 1, dy: 1, run: true });
  e.execute({ type: "move", dx: 1, dy: 1, run: true });
  expect(e.validate({ type: "move", dx: 1, dy: 1, run: true })).toBeDefined();
  expect(e.state.player.health).toBe(100);
  e.advance(6);
  expect(e.validate({ type: "move", dx: 1, dy: 1, run: true })).toBeDefined();
  expect(e.state.player.health).toBe(100);
});

it("damages walked, traversed and jumped drops equally and leaves small steps safe", () => {
  for (const drop of [1, 3]) for (const style of [{}, { traverse: true }, { jump: "short" as const }]) {
    const e = hazardField(`fall-${drop}-${JSON.stringify(style)}`);
    e.world.topography = (x) => ({ height: x <= 0 ? drop : 0, surface: "grass" });
    e.execute({ type: "move", dx: 1, dy: 0, ...style });
    expect(e.state.player.health).toBe(drop === 1 ? 100 : 49);
    expect(!!e.state.player.injury).toBe(drop > 1);
  }
});

it("cushions falls onto sand and makes stone landings harder", () => {
  const health: number[] = [];
  for (const surface of ["sand", "grass", "rock"] as const) {
    const e = hazardField(`fall-surface-${surface}`);
    e.world.terrain = () => surface;
    e.world.topography = (x) => ({ height: x <= 0 ? 3 : 0, surface: "grass" });
    e.execute({ type: "move", dx: 1, dy: 0 });
    health.push(e.state.player.health!);
  }
  expect(health[0]).toBeGreaterThan(health[1]);
  expect(health[1]).toBeGreaterThan(health[2]);
});

it("ends a fatal fall without automatic recovery or healing through subsequent commands", () => {
  const e = hazardField("fatal-fall");
  e.world.topography = (x) => ({ height: x <= 0 ? 5 : 0, surface: "grass" });
  e.execute({ type: "move", dx: 1, dy: 0 });
  expect(e.state.player.health).toBe(0);
  expect(e.state.player.dead).toBe("a fall");
  const clock = e.state.clock;
  e.execute({ type: "sleep", seconds: 86400 });
  e.advance(3600);
  expect(e.state.clock).toBe(clock);
  expect(e.state.player.health).toBe(0);
  expect(e.validate({ type: "move", dx: -1, dy: 0 })).toContain("dead");
});

it("retains harmless impacts for worlds recorded before hazards were introduced", () => {
  const e = hazardField("legacy-fall");
  delete e.state.manifest.hazards;
  e.world.topography = (x) => ({ height: x <= 0 ? 5 : 0, surface: "grass" });
  e.execute({ type: "move", dx: 1, dy: 0 });
  expect(e.state.player.health).toBe(100);
});
