import { expect, it } from "vitest";
import { babyTime, jolt, legacy, type Baby } from "../src/core/baby";
import { places } from "../src/content/geography/places";
import { settingFor } from "../src/content/geography/resolve";
import { smallSession } from "./fixtures";

const baby = (over: Partial<Baby> = {}): Baby => ({
  id: "h-infant-0", name: "Amara", sex: "female", with: "player", mood: "watching",
  milk: 0, tired: 0, calm: 90, wet: 0, still: 0, lull: 0, ...over,
});
const pass = (b: Baby, seconds: number, motion: "walk" | "still" | "run" | "work", rest: Partial<Parameters<typeof babyTime>[2]> = {}) => {
  for (let t = 0; t < seconds; t += 6) babyTime(b, 6, { motion, rain: false, nurse: true, auto: false, ...rest });
};

it("walking puts a tired baby to sleep and standing still wakes a rested one", () => {
  const b = baby({ tired: 70 });
  pass(b, 120, "walk");
  expect(b.mood).toBe("asleep");
  b.tired = 30;
  pass(b, 1500, "still");
  expect(b.mood).toBe("watching");
});

it("a waking baby with nothing to watch fusses but does not cry, and a walk mends it", () => {
  const b = baby();
  pass(b, 40 * 60, "still");
  expect(b.mood).toBe("fussing");
  expect(b.need).toBe("bored");
  pass(b, 60, "walk");
  expect(b.mood).toBe("watching");
});

it("hunger wakes the baby, and walking does not answer it", () => {
  const b = baby({ mood: "asleep", tired: 90, milk: 70 });
  pass(b, 3600, "walk");
  expect(b.need).toBe("milk");
  expect(b.mood).toBe("crying");
});

it("rain upsets an uncovered baby and not a covered one", () => {
  const wet = baby(), dry = baby({ covered: true });
  pass(wet, 15 * 60, "walk", { rain: true });
  pass(dry, 15 * 60, "walk", { rain: true });
  expect(wet.need).toBe("wet");
  expect(dry.mood).toBe("watching");
});

it("a long stretch nobody plays through leaves nothing waiting", () => {
  const b = baby({ milk: 70, tired: 80 });
  pass(b, 5 * 3600, "work", { auto: true });
  expect(["asleep", "watching"]).toContain(b.mood);
  expect(b.need).toBeUndefined();
});

it("a jolt wakes a light sleeper", () => {
  const b = baby({ mood: "asleep", tired: 40 });
  jolt(b, 45);
  expect(b.mood).toBe("fussing");
});

it("the work watched most is what the child takes from it", () => {
  expect(legacy(baby({ seen: { farming: 60, trade: 4 } })).skill).toBe("farming");
  expect(legacy(baby({ seen: { farming: 1 } })).skill).toBeUndefined();
});

it("the player's baby is fed, handed over and taken back with the one command", () => {
  const e = smallSession(settingFor(places.find((p) => p.id === "timbuktu")!, 1400), "baby");
  const s = e.state, p = s.player, h = s.households!.find((x) => x.members.includes(p.id))!;
  p.origin = { ...p.origin!, sex: "female" };
  const minder = s.actors.find((a) => h.members.includes(a.id))!;
  h.members = [p.id, minder.id];
  h.babies = h.infants = 1;
  let n = 0;
  const act = (command: Parameters<typeof e.act>[0]["command"]) => e.act({ actionId: `b${n++}`, expectedRevision: s.revision, command });
  act({ type: "pass", seconds: 6 });
  const b = s.baby!;
  expect(b.with).toBe("player");
  Object.assign(b, { milk: 80, mood: "crying", calm: 10, need: "milk" });
  expect(e.tendNow()?.kind).toBe("nurse");
  expect(act({ type: "tend" }).status).toBe("completed");
  expect(b.milk).toBe(0);
  expect(b.mood).not.toBe("crying");

  minder.pos = { ...p.pos, x: p.pos.x + 1 };
  Object.assign(b, { mood: "watching", calm: 90, played: s.clock });
  delete b.need;
  expect(e.tendNow()).toMatchObject({ kind: "give", who: minder.id });
  expect(act({ type: "tend" }).status).toBe("completed");
  expect(b.with).toBe(minder.id);
  minder.pos = { ...p.pos, x: p.pos.x + 1 };
  expect(e.tendNow()?.kind).toBe("take");
  expect(act({ type: "tend" }).status).toBe("completed");
  expect(b.with).toBe("player");
});
