import { describe, expect, it } from "vitest";
import { CYCLE_KINDS, CYCLE_SPECS, cycleKindsFor, cycleLookFor, cycleLookOf, cycleStep, cycleTrick, type CycleMotion } from "../src/core/cycles";
import { CYCLE_GROUND, CYCLE_H, CYCLE_W, paintCycle } from "../src/render/cycles/paint";
import { createSession, Runtime } from "../src/runtime/session";

const roadster = CYCLE_SPECS.roadster;

describe("cycles: which machines, where and when", () => {
  it("has none before the running machine and only period kinds after", () => {
    expect(cycleLookFor(1700, "western-europe", "a")).toBeUndefined();
    expect(cycleKindsFor(1820, "western-europe").map(([k]) => k)).toEqual(["draisine"]);
    const victorian = cycleKindsFor(1880, "britain").map(([k]) => k);
    expect(victorian).toContain("penny");
    expect(victorian).not.toContain("roadster");
    const modern = cycleKindsFor(1995, "north-america", 1905).map(([k]) => k);
    expect(modern).toEqual(expect.arrayContaining(["mtb", "bmx", "sportbike"]));
    expect(modern).not.toContain("penny");
  });
  it("keeps motors out until the place has them", () => {
    expect(cycleKindsFor(1950, "sub-saharan-africa", 1960).some(([k]) => CYCLE_SPECS[k].motor)).toBe(false);
    expect(cycleLookFor(1950, "sub-saharan-africa", "a", 1960, "motor")).toBeUndefined();
  });
  it("gives the same machine for the same key and varies across keys", () => {
    expect(cycleLookFor(1995, "japan", "k1")).toEqual(cycleLookFor(1995, "japan", "k1"));
    const looks = new Set(Array.from({ length: 40 }, (_, i) => JSON.stringify(cycleLookFor(1995, "japan", `k${i}`))));
    expect(looks.size).toBeGreaterThan(20);
  });
});

describe("cycles: handling", () => {
  const ride = (m: CycleMotion, input: readonly [number, number], n: number, env = {}) => {
    let out = cycleStep(m, input, roadster, env);
    for (let i = 1; i < n; i++) out = cycleStep(out, input, roadster, env);
    return out;
  };
  it("builds to a cruise, and to more under a sprint", () => {
    const cruise = ride({ speed: 0 }, [1, 0], 20);
    expect(cruise.speed).toBeCloseTo(roadster.cruise, 1);
    expect(ride(cruise, [1, 0], 20, { sprint: true }).speed).toBeCloseTo(roadster.sprint, 1);
  });
  it("coasts on when the way is let go, then stops", () => {
    let m = ride({ speed: 0 }, [1, 0], 20);
    let rolled = 0;
    for (; rolled < 30; rolled++) {
      m = cycleStep(m, [0, 0], roadster);
      if (!m.move) break;
      expect(m.pedalling).toBe(false);
    }
    expect(rolled).toBeGreaterThanOrEqual(2);
    expect(rolled).toBeLessThan(12);
    expect(m.speed).toBe(0);
  });
  it("skids to a stop when the way back is pressed at speed, and simply turns round when slow", () => {
    const fast = ride({ speed: 0 }, [1, 0], 20, { sprint: true });
    const skid = cycleStep(fast, [-1, 0], roadster);
    expect(skid.beat).toBe("skid");
    expect(skid.speed).toBeLessThan(fast.speed);
    expect(cycleStep({ speed: 5, dir: [1, 0] }, [-1, 0], roadster).dir).toEqual([-1, 0]);
  });
  it("loses speed in a turn by how well the machine grips, and is slower off the road", () => {
    const fast = ride({ speed: 0 }, [1, 0], 20);
    const bmx = cycleStep({ ...fast }, [0, 1], CYCLE_SPECS.bmx).speed;
    const penny = cycleStep({ ...fast }, [0, 1], CYCLE_SPECS.penny).speed;
    expect(bmx).toBeGreaterThan(penny);
    expect(ride({ speed: 0 }, [1, 0], 20, { ground: roadster.rough }).speed).toBeLessThan(roadster.cruise);
  });
  it("offers tricks only on machines built for them", () => {
    expect(cycleTrick(roadster, -1)).toBeUndefined();
    expect(cycleTrick(CYCLE_SPECS.bmx, -1)?.name).toBe("backflip");
    expect(cycleTrick(CYCLE_SPECS.bmx, 0, true)?.move).toBe("spin");
  });
});

describe("cycles: painting", () => {
  it("draws every kind in every view with its wheels on the ground row", () => {
    for (const kind of CYCLE_KINDS) {
      const look = cycleLookOf(kind, CYCLE_SPECS[kind].from + 5, "western-europe", kind);
      for (const view of ["side", "quarter", "quarter-back", "front", "back"] as const) {
        const art = paintCycle(look, view, { crank: 3, spin: 6 });
        expect(art.under.length).toBe(CYCLE_W * CYCLE_H * 4);
        const row = (data: Uint8ClampedArray, y: number) => Array.from({ length: CYCLE_W }, (_, x) => data[(y * CYCLE_W + x) * 4 + 3]).some(Boolean);
        expect(row(art.under, CYCLE_GROUND) || row(art.over, CYCLE_GROUND), `${kind} ${view} stands on the ground`).toBe(true);
        // On a diagonal the nearer wheel stands lower than the anchor.
        const floor = view.startsWith("quarter") ? CYCLE_H - 1 : CYCLE_GROUND + 2;
        expect(row(art.under, floor) || row(art.over, floor), `${kind} ${view} below the ground`).toBe(false);
        expect(row(art.under, 0) || row(art.over, 0), `${kind} ${view} cut off at the top`).toBe(false);
      }
    }
  });
});

describe("cycles: riding in the world", () => {
  function withBike(kind: "roadster" | "penny" = "roadster") {
    const rt = new Runtime(createSession("roman", "cycle-test"));
    const e = rt.engine, p = e.state.player;
    const look = cycleLookOf(kind, 1900, "western-europe", "test");
    e.state.objects.push({ id: "bike", name: "Bicycle", kind: "monument", sprite: "cycle", cycle: look, pos: { ...p.pos, x: p.pos.x + 1 }, inventory: {} });
    return { rt, e, p };
  }
  it("mounts, rides, parks the same machine where it was left", () => {
    const { rt, e, p } = withBike();
    const near = e.cycleNear();
    expect(near?.target).toBe("bike");
    expect(rt.command({ type: "interact", action: "mount-cycle", target: "bike" })?.status).toBe("completed");
    expect(p.riding?.cycle?.id).toBe("bike");
    // Still in the world's list while ridden, so nothing stands a fresh one in its place.
    expect(e.state.objects.find((o) => o.id === "bike")?.carriedBy).toBe("player");
    expect(e.cycleNear()).toBeUndefined();
    expect(rt.command({ type: "interact", action: "ring-bell", target: "mount" })?.status).toBe("completed");
    expect(e.lastRideEvent?.voice).toBe("bike");
    const at = { ...p.pos };
    expect(rt.command({ type: "interact", action: "dismount-animal", target: "mount" })?.status).toBe("completed");
    expect(p.riding).toBeUndefined();
    const bike = e.state.objects.filter((o) => o.id === "bike");
    expect(bike).toHaveLength(1);
    expect(bike[0].carriedBy).toBeUndefined();
    expect(bike[0].pos).toMatchObject({ x: at.x, y: at.y });
  });
  it("lays the machine down in a spill and lets it be picked up again", () => {
    const { rt, e, p } = withBike("penny");
    rt.command({ type: "interact", action: "mount-cycle", target: "bike" });
    expect(rt.command({ type: "interact", action: "cycle-spill", target: "header" })?.status).toBe("completed");
    expect(p.riding).toBeUndefined();
    expect(e.state.objects.find((o) => o.id === "bike")?.tipped).toBe(true);
    expect(e.cycleNear()?.down).toBe(true);
    expect(rt.command({ type: "interact", action: "mount-cycle", target: "bike" })?.status).toBe("completed");
    expect(e.state.objects.find((o) => o.id === "bike")?.tipped).toBeUndefined();
  });
  it("will not hop a machine that cannot leave the ground", () => {
    const { rt, e } = withBike("penny");
    rt.command({ type: "interact", action: "mount-cycle", target: "bike" });
    expect(e.validate({ type: "move", dx: 1, dy: 0, jump: "long" })).toMatch(/will not leave the ground/);
  });
});
