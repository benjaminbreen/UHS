import { expect, it } from "vitest";
import { resolveSetting } from "../src/content/geography/resolve";
import { integratedSetting } from "../src/content/geography/defaults";
import { packForSetting } from "../src/content/geography/pack";
import { settlementProfile } from "../src/content/settlements/profiles";
import { planSettlement } from "../src/world/v3/plan";
import { DAY, platformDoors, stopAt, timetable, trainLength, trainsAt, type Railway } from "../src/world/v3/railway";
import { isVisitor, railDay } from "../src/world/v3/rail-travellers";
import type { Point } from "../src/core/types";

const resolved = resolveSetting("Manchester 1888");
if ("error" in resolved) throw Error(resolved.error);
const setting = integratedSetting(resolved.setting);
const pack = packForSetting(setting);
const flat = () => ({ elevation: 0, moisture: 0.5, water: 100, kind: "river" as const, snow: false });
const town = (seed: string) =>
  planSettlement(
    { id: "town", cx: 0, cy: 0, home: true, center: { x: 0, y: 0 }, profile: settlementProfile(setting) },
    pack,
    seed,
    flat,
    [],
  );
// Straight legs: the test is of the timing, not of the route finder.
const leg = (a: Point, b: Point) => {
  const out: Point[] = [];
  let { x, y } = a;
  while (x !== b.x || y !== b.y) {
    if (x !== b.x) x += Math.sign(b.x - x);
    else y += Math.sign(b.y - y);
    out.push({ x, y });
  }
  return out;
};

it("keeps the platform road and the far road each to one train at a time", () => {
  const line: Railway = {
    axis: "x", level: 0, lo: -120, hi: 120, span: 4,
    station: { door: { x: 0, y: -6 }, platform: { x: -8, y: -2, w: 16, h: 2 }, side: -1 },
  };
  for (const year of [1845, 1888, 1935, 1975, 2010]) {
    const runs = timetable("rail", "town", { ...setting, year }, line);
    expect(runs).toEqual(timetable("rail", "town", { ...setting, year }, line));
    for (const track of [0, 1] as const) {
      // Sample the day: never two trains on one road where they could meet.
      for (let t = 0; t < DAY; t += 20) {
        const on = trainsAt(line, runs, t).filter((s) => s.run.track === track);
        expect(on.length, `${year} track ${track} at ${t}`).toBeLessThanOrEqual(1);
      }
    }
    for (const run of runs.filter((r) => r.dwell)) {
      const [standing] = trainsAt(line, runs, run.at + 5).filter((s) => s.run === run);
      expect(standing.standing).toBe(true);
      expect(standing.head).toBeCloseTo(stopAt(line, run));
      // The coaches stand along the platform, and have doors on it.
      expect(platformDoors(line, run).length).toBeGreaterThan(0);
      expect(trainLength(run)).toBeGreaterThan(8);
    }
  }
});

it("fits travellers' days to trains that are standing at the platform", () => {
  const plan = town("rail-days");
  const line = plan.railway!;
  expect(line?.station).toBeTruthy();
  const runs = timetable("rail-days", plan.site.id, setting, line);
  const visitors = plan.actors.filter((a) => isVisitor(a.id));
  expect(visitors.length).toBeGreaterThanOrEqual(2);
  const days = [
    ...visitors.map((a) => railDay(plan, "rail-days", pack, a.id, plan.work.get(a.id)!.home, leg)),
    railDay(plan, "rail-days", pack, "town-resident", plan.gatherings?.[0] ?? line.station!.door, leg),
  ];
  expect(days.filter(Boolean).length).toBeGreaterThanOrEqual(2);
  for (const day of days) {
    if (!day) continue;
    expect(day.segments[day.segments.length - 1].to).toBeCloseTo(1440);
    const waits = day.segments.filter((s) => s.label.startsWith("Waiting for"));
    expect(waits).toHaveLength(1);
    // Aboard while it stands: a stopping train is at the platform at the end
    // of the wait, with a door where they were waiting.
    const t = waits[0].to * 60;
    const here = trainsAt(line, runs, t).find((s) => s.standing);
    expect(here).toBeTruthy();
    expect(platformDoors(line, here!.run)).toContainEqual(waits[0].pos);
    // And off one: a visitor's first walk, or a commuter's walk home, starts
    // from a door of a train standing then.
    const off =
      day.segments.find((s) => s.path && s.label === "Walking home from the station") ??
      day.segments.find((s) => s.path)!;
    const arriving = trainsAt(line, runs, off.from * 60).find((s) => s.standing);
    expect(arriving).toBeTruthy();
    expect(platformDoors(line, arriving!.run)).toContainEqual(off.pos);
  }
});
