import { describe, expect, it } from "vitest";
import {
  doorAccess,
  doorApproach,
  doorCell,
  makeDoor,
} from "../src/core/doors";
import type { Place } from "../src/core/types";
import { createSession } from "../src/runtime/session";

let serial = 0;
const act = (
  e: ReturnType<typeof createSession>,
  command: Parameters<typeof e.act>[0]["command"],
) =>
  e.act({
    actionId: `door-${serial++}`,
    expectedRevision: e.state.revision,
    command,
  });

const place = (over: Partial<Place> = {}): Place => ({
  id: "house",
  name: "House",
  description: "",
  x: 10,
  y: 10,
  w: 6,
  h: 4,
  sprite: "house-thatch",
  entrance: { x: 13, y: 14 },
  access: "household",
  owner: "elder",
  claim: "",
  entranceLabel: "Enter",
  ...over,
});

describe("doors", () => {
  it("sits in the wall, not on the street the visitor stands in", () => {
    expect(doorCell(place())).toEqual({ x: 13, y: 13 });
    expect(doorCell(place({ entrance: { x: 9, y: 12 } }))).toEqual({
      x: 10,
      y: 12,
    });
    expect(doorCell(place({ entrance: { x: 16, y: 12 } }))).toEqual({
      x: 15,
      y: 12,
    });
    expect(doorCell(place({ entrance: { x: 13, y: 9 } }))).toEqual({
      x: 13,
      y: 10,
    });
  });

  it("starts shut and carries the place it opens", () => {
    const door = makeDoor(place());
    expect(door.open).toBe(false);
    expect(door.placeId).toBe("house");
    expect(door.owner).toBe("elder");
    expect(door.pos).toEqual({ x: 13, y: 13, space: "outside" });
  });

  it("opens for the invited whatever the hour", () => {
    for (const hour of [3, 12, 23])
      expect(
        doorAccess({
          access: "household",
          invited: true,
          occupied: false,
          hour,
        }),
      ).toBe("open");
  });

  it("answers a household door only when somebody is home", () => {
    const at = (occupied: boolean) =>
      doorAccess({ access: "household", invited: false, occupied, hour: 12 });
    expect(at(true)).toBe("knock");
    expect(at(false)).toBe("barred");
  });

  it("shuts a public door outside its hours", () => {
    const at = (hour: number) =>
      doorAccess({ access: "public", invited: false, occupied: true, hour });
    expect(at(5)).toBe("barred");
    expect(at(6)).toBe("open");
    expect(at(19)).toBe("open");
    expect(at(20)).toBe("barred");
  });
});

describe("knocking", () => {
  it("answers, refuses or stays silent, and grants standing only when answered", () => {
    const e = createSession();
    const b = e.world.places.find((p) => p.access === "household")!;
    const door = e.doorOf(b.id)!;
    e.state.player.pos = { ...doorApproach(b), space: "outside" };
    const knock = () =>
      act(e, { type: "interact", target: door.id, action: "knock" });
    const last = () => e.state.events.at(-1)?.text ?? "";

    // Nobody home: a knock costs half a minute and nothing else.
    for (const a of e.state.actors) a.pos = { ...a.pos, space: "outside" };
    expect(knock().status).toBe("completed");
    expect(last()).toMatch(/Nobody answers/);
    expect(door.open).toBe(false);
    expect(e.state.permissions[b.owner] ?? 0).toBeLessThanOrEqual(
      e.state.clock,
    );

    // Somebody home, in daylight, who does not dislike the player.
    const resident = e.state.actors[0];
    resident.pos = { x: 4, y: 4, space: b.id };
    resident.trust = 1;
    e.state.clock = Math.floor(e.state.clock / 86400) * 86400 + 12 * 3600;
    expect(knock().status).toBe("completed");
    expect(last()).toMatch(/opens the door/);
    expect(door.open).toBe(true);
    expect(e.state.permissions[b.owner]).toBeGreaterThan(e.state.clock);
    expect(resident.pos.space).toBe("outside");
    expect(e.doorAnswer).toBe(resident.id);
  });

  it("is refused by a resident who mistrusts the caller", () => {
    const e = createSession();
    const b = e.world.places.find((p) => p.access === "household")!;
    const door = e.doorOf(b.id)!;
    e.state.player.pos = { ...doorApproach(b), space: "outside" };
    const resident = e.state.actors[0];
    resident.pos = { x: 4, y: 4, space: b.id };
    resident.trust = -1;
    e.state.clock = Math.floor(e.state.clock / 86400) * 86400 + 12 * 3600;
    act(e, { type: "interact", target: door.id, action: "knock" });
    expect(e.state.events.at(-1)?.text).toMatch(/go away/);
    expect(door.open).toBe(false);
  });

  it("is turned away at night whoever is inside", () => {
    const e = createSession();
    const b = e.world.places.find((p) => p.access === "household")!;
    const door = e.doorOf(b.id)!;
    e.state.player.pos = { ...doorApproach(b), space: "outside" };
    const resident = e.state.actors[0];
    resident.pos = { x: 4, y: 4, space: b.id };
    resident.trust = 2;
    e.state.clock = Math.floor(e.state.clock / 86400) * 86400 + 23 * 3600;
    act(e, { type: "interact", target: door.id, action: "knock" });
    expect(e.state.events.at(-1)?.text).toMatch(/daylight/);
    expect(door.open).toBe(false);
  });
});
