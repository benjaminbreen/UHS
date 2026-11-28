import { describe, expect, it } from "vitest";
import catalog from "../src/content/graphics/vehicles.generated.json" with { type: "json" };
import { CAR_SPECS, CAR_WAYS, carFacing, carFrame, carStep, type CarMotion } from "../src/core/cars";
import { laneLine, Traffic, trafficFacing } from "../src/core/traffic";
import { createSession, Runtime } from "../src/runtime/session";
import type { Lane } from "../src/world/v3/types";

const mini = CAR_SPECS.mini, boat = CAR_SPECS["hardtop-1957"];
const drive = (m: CarMotion, input: readonly [number, number], cells: number, spec = mini, env = {}) => {
  let last = carStep(m, input, spec, env);
  for (let i = 1; i < cells; i++) last = carStep(last, input, spec, env);
  return last;
};

describe("cars: handling", () => {
  it("has a way of driving for every model in the catalogue", () => {
    expect(Object.keys(CAR_SPECS).sort()).toEqual(Object.keys(catalog).sort());
    for (const s of Object.values(CAR_SPECS)) expect(s.top).toBeGreaterThan(s.cruise);
  });
  it("pulls away, settles at a cruise, and reaches its top speed with the pedal down", () => {
    const off = carStep({ speed: 0, heading: 2 }, [1, 0], mini);
    expect(off.beat).toBe("start");
    expect(off.move).toEqual([1, 0]);
    expect(drive({ speed: 0, heading: 2 }, [1, 0], 40).speed).toBeCloseTo(mini.cruise);
    expect(drive({ speed: 0, heading: 2 }, [1, 0], 80, mini, { boost: true }).speed).toBeCloseTo(mini.top);
  });
  it("swings an eighth a cell toward the held way, and moves the way it faces", () => {
    const a = carStep({ speed: 6, heading: 2 }, [0, 1], mini);
    expect(a.heading).toBe(3);
    expect(a.move).toEqual(CAR_WAYS[3]);
    expect(carStep(a, [0, 1], mini).heading).toBe(4);
  });
  it("slides in a fast turn by how well it grips, and far round on the handbrake", () => {
    const fast = { speed: 20, heading: 2 };
    const grip = carStep(fast, [0, 1], mini), wallow = carStep({ ...fast }, [0, 1], boat);
    expect(grip.beat).toBe("drift");
    expect(grip.speed).toBeGreaterThan(wallow.speed);
    const thrown = carStep(fast, [0, 1], mini, { handbrake: true });
    expect(thrown.beat).toBe("slide");
    expect(thrown.heading).toBe(4);
    expect(thrown.slip).toBe(2);
  });
  it("brakes on the way back, stops, then backs up without turning round", () => {
    let m: CarMotion & { beat?: string; move?: readonly [number, number] } = { speed: 12, heading: 2 };
    let cells = 0;
    while (m.speed > 0 && cells++ < 40) m = carStep(m, [-1, 0], mini);
    expect(m.speed).toBe(0);
    expect(cells).toBeLessThan(8);
    m = carStep(m, [-1, 0], mini);
    expect(m.beat).toBe("reverse");
    expect(m.heading).toBe(2);
    expect(m.move).toEqual([-1, 0]);
    expect(carStep(m, [-1, 0], mini).speed).toBeLessThan(0);
  });
  it("coasts down to a stop when nothing is held", () => {
    let m: CarMotion = { speed: 11, heading: 0 }, cells = 0;
    while (m.speed > 0 && cells++ < 200) m = carStep(m, [0, 0], mini);
    expect(m.speed).toBe(0);
    expect(cells).toBeGreaterThan(6);
  });
  it("names frames by heading", () => {
    expect(carFrame("vehicle-mini-2-e", 5)).toBe("vehicle-mini-2-sw");
    expect(carFacing("vehicle-sedan-2005-0-nw")).toBe(7);
  });
});

describe("cars: driving in the world", () => {
  function withCar() {
    const rt = new Runtime(createSession("roman", "car-test"));
    const e = rt.engine, p = e.state.player;
    // An open run of ground to stand a car on, north of which the player stands.
    let at: { x: number; y: number } | undefined;
    for (let y = p.pos.y - 12; y < p.pos.y + 12 && !at; y++)
      for (let x = p.pos.x - 12; x < p.pos.x + 12 && !at; x++) {
        let clear = true;
        for (let dy = -1; dy <= 2 && clear; dy++) for (let dx = -1; dx <= 9 && clear; dx++) clear = !e.blocked(x + dx, y + dy, "outside") && !e.actorAt({ x: x + dx, y: y + dy, space: "outside" }, "player");
        if (clear) at = { x, y };
      }
    if (!at) throw Error("no open ground in the fixture");
    e.state.objects.push({ id: "car", name: "Mini", kind: "monument", sprite: "vehicle-mini-0-e", pos: { x: at.x + 1, y: at.y + 1, space: "outside" }, inventory: {}, car: { model: "mini", paint: 0, rect: [at.x, at.y, at.x + 3, at.y + 1], yours: true } });
    p.pos = { x: at.x + 1, y: at.y + 2, space: "outside" };
    return { rt, e, p, at, car: e.state.objects.at(-1)! };
  }
  it("takes a parked car, drives it facing where it is steered, and leaves it where it stops", () => {
    const { rt, e, p, at, car } = withCar();
    expect(e.carDoor(car)).toBe(true);
    expect(rt.command({ type: "interact", action: "drive-vehicle", target: "car" })?.status).toBe("completed");
    expect(p.drivingVehicle).toBe("car");
    expect(car.car).toMatchObject({ freed: [at.x, at.y, at.x + 3, at.y + 1] });
    expect(car.car!.rect).toBeUndefined();
    expect(car.motor).toMatchObject({ facing: 2, slim: 1 });
    const fuel = e.carFuel(car), from = { ...car.pos };
    rt.driveHeading = 2;
    expect(rt.move(1, 0)?.status).toBe("completed");
    rt.driveHeading = 3;
    expect(rt.move(1, 1)?.status).toBe("completed");
    expect(car.pos).toMatchObject({ x: from.x + 2, y: from.y + 1 });
    expect(car.sprite).toBe("vehicle-mini-0-se");
    expect(e.carFuel(car)).toBe(fuel - 2);
    // Backing up: it moves against the way it faces.
    rt.driveHeading = 3;
    expect(rt.move(-1, -1)?.status).toBe("completed");
    expect(car.motor!.facing).toBe(3);
    expect(rt.command({ type: "interact", action: "car-horn", target: "car" })?.status).toBe("completed");
    expect(e.carHorn).toBe(1);
    expect(rt.command({ type: "interact", action: "leave-vehicle", target: "car" })?.status).toBe("completed");
    expect(p.drivingVehicle).toBeUndefined();
    // Standing where it was left, it is in the way; a second driver gets in at its side.
    expect(e.blocked(car.pos.x, car.pos.y, "outside")).toBe(true);
    expect(e.vehicleCab(car)).toBe(true);
  });
  it("will not open someone else's car empty-handed, and smashes its window with a heavy object in hand", () => {
    const { rt, e, p, car } = withCar();
    car.car!.yours = false;
    expect(rt.command({ type: "interact", action: "drive-vehicle", target: "car" })?.status).toBe("rejected");
    // Soft carried props and light inventory items will not break safety glass.
    e.state.objects.push({ id: "box", name: "Cardboard carton", kind: "container", prop: "carton", sprite: "cardboard-box-0", pos: { ...p.pos }, inventory: {}, carriedBy: "player" });
    p.held = "box";
    expect(e.carBreaker(car)).toBeNull();
    delete p.held;
    p.heldItem = "bread";
    expect(e.carBreaker(car)).toBeNull();
    // A lifted rock or a stone in hand does break the window, and offers Smash the window.
    p.heldItem = "stone";
    expect(e.carBreaker(car)).toBe("stone");
    expect(rt.verbs().primary?.label).toBe("Smash the window");
    delete p.heldItem;
    e.state.objects.push({ id: "rock", name: "Rock", kind: "monument", prop: "fieldStone", sprite: "nature-rock-0", pos: { ...p.pos }, inventory: {}, carriedBy: "player" });
    p.held = "rock";
    expect(e.carBreaker(car)).toBe("rock");
    expect(rt.verbs().primary?.label).toBe("Smash the window");
    expect(rt.command({ type: "interact", action: "drive-vehicle", target: "car" })?.status).toBe("completed");
    expect(p.drivingVehicle).toBe("car");
    expect(car.car!.smashed).toBe(true);
  });
  it("will not move on an empty tank, and pays out a fare", () => {
    const { rt, e, p, car } = withCar();
    rt.command({ type: "interact", action: "drive-vehicle", target: "car" });
    const coin = p.inventory.coin ?? 0;
    expect(rt.command({ type: "interact", action: "car-fare", target: "5" })?.status).toBe("completed");
    expect(p.inventory.coin).toBe(coin + 5);
    car.car!.fuel = 0;
    rt.driveHeading = 2;
    expect(rt.move(1, 0)?.status).toBe("rejected");
    expect(rt.command({ type: "interact", action: "car-crash", target: "crash" })?.status).toBe("completed");
    expect(e.state.objects.find((o) => o.id === "car")?.car?.dents).toBe(2);
  });
});

describe("cars: traffic", () => {
  // A crossroads of two-way streets four cells wide, a hundred cells each way.
  const marks = { drive: "right", parking: false } as Lane["marks"];
  const lanes = new Map<string, Lane>();
  for (let i = -50; i <= 50; i++)
    for (let at = 0; at < 4; at++) {
      const junction = i >= 0 && i < 4;
      lanes.set(`${i},${at}`, { axis: "x", at, span: 4, marks, ...(junction ? { junction } : {}) });
      if (!junction) lanes.set(`${at},${i}`, { axis: "y", at, span: 4, marks });
    }
  const rolls = () => {
    let s = 7;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  };
  const sim = () => new Traffic(lanes, () => ({ model: "mini", paint: 0 }), rolls());

  it("keeps each direction to its own side", () => {
    const east = lanes.get("20,3")!;
    expect(laneLine(east, 20, 3, 1, 0)).toBe(2.5);
    expect(laneLine(east, 20, 3, -1, 0)).toBe(0.5);
    expect(laneLine({ ...east, marks: { ...marks, drive: "left" } }, 20, 3, 1, 0)).toBe(0.5);
  });
  it("runs cars along the lanes, round the corners, and never through one another", () => {
    const t = sim(), focus = { x: 0, y: 0 };
    let turned = 0;
    for (let i = 0; i < 60 * 90; i++) {
      t.step(1 / 60, focus, { want: 8, obstacle: () => false });
      for (const c of t.cars) {
        expect(lanes.has(`${Math.round(c.x)},${Math.round(c.y)}`), `car off the road at ${c.x},${c.y}`).toBe(true);
        if (c.turning > 0) turned++;
        if (!c.inJunction && c.turning <= 0) expect(c.dx ? c.y : c.x).toBe(c.dx > 0 || c.dy < 0 ? 2.5 : 0.5);
      }
      for (const a of t.cars) for (const b of t.cars) if (a.id < b.id && a.dx === b.dx && a.dy === b.dy) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(3);
    }
    expect(t.cars.length).toBeGreaterThan(3);
    expect(turned).toBeGreaterThan(0);
  });
  it("stops for whatever stands in the road and sounds its horn", () => {
    const t = sim(), focus = { x: 0, y: 0 };
    for (let i = 0; i < 120; i++) t.step(1 / 60, focus, { want: 6, obstacle: () => false });
    const car = t.cars[0];
    const block = { x: Math.round(car.x + car.dx * 5), y: Math.round(car.y + car.dy * 5) };
    let horns = 0;
    for (let i = 0; i < 60 * 8; i++) horns += t.step(1 / 60, focus, { want: 6, obstacle: (x, y) => x === block.x && y === block.y }).filter((c) => c === car).length;
    expect(car.speed).toBe(0);
    expect(Math.abs(car.x - block.x) + Math.abs(car.y - block.y)).toBeGreaterThan(1);
    expect(horns).toBeGreaterThan(0);
    expect(t.occupied(Math.round(car.x), Math.round(car.y))).toBe(true);
  });
  it("shows a diagonal while a car swings through a corner", () => {
    expect(trafficFacing({ dx: 0, dy: 1, turning: 0.2, was: [1, 0] })).toBe(3);
    expect(trafficFacing({ dx: 0, dy: 1, turning: 0, was: [1, 0] })).toBe(4);
  });
});
