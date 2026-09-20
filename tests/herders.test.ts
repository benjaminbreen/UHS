import { expect, it } from "vitest";
import { settingFor } from "../src/content/geography/resolve";
import { places } from "../src/content/geography/places";
import { herdingCustom } from "../src/content/fauna/herding";
import { herdersFor } from "../src/world/v3/herders";
import type { FaunaGroup } from "../src/core/fauna";
import type { WorldModel } from "../src/core/types";

const at = (id: string, year: number) =>
  settingFor(places.find((p) => p.id === id)!, year);
const world = { blocked: () => false } as unknown as WorldModel;
const herd = (id: string, speciesId: string): FaunaGroup => ({
  id,
  speciesId,
  members: [{ x: 0, y: 0, direction: 1 }],
  pos: { x: 0, y: 0, space: "outside" },
  home: { x: 0, y: 0, space: "outside" },
  homeRadius: 12,
  state: "graze",
  nextDecisionAt: 0,
  stride: 0,
  since: 0,
});

it("sends different people out with the animals in different places", () => {
  const andes = places.find((p) => p.lon > -76 && p.lon < -68 && p.lat < -10)!;
  expect(herdingCustom(settingFor(andes, 1400), "llama").women).toBeGreaterThan(
    herdingCustom(at("konya", -5000), "sheep").women,
  );
  // Large stock is less often a child's charge.
  const s = at("konya", -5000);
  expect(herdingCustom(s, "cattle").youth).toBeLessThan(
    herdingCustom(s, "sheep").youth,
  );
  expect(
    herdingCustom(at("city-florence", 1990), "sheep").party[0],
  ).toBeGreaterThan(0.8);
});

it("makes one to three herders, the same every time, beside their herd", () => {
  const setting = at("konya", -5000);
  const ages: number[] = [];
  let dogs = 0;
  for (let n = 0; n < 40; n++) {
    const g = herd(`fauna-sheep-${n}`, "sheep");
    const first = herdersFor(world, "seed", g, setting);
    expect(herdersFor(world, "seed", g, setting)).toEqual(first);
    expect(first.actors.length).toBeGreaterThanOrEqual(1);
    expect(first.actors.length).toBeLessThanOrEqual(3);
    for (const a of first.actors) {
      expect(a.tends).toEqual({ herd: g.id, seat: first.actors.indexOf(a) });
      expect(Math.hypot(a.pos.x, a.pos.y)).toBeLessThan(5);
      expect(a.role).toMatch(/herd/i);
    }
    ages.push(...first.party.map((who) => who.age));
    if (first.dog) {
      dogs++;
      expect(first.dog.speciesId).toBe("dog");
    }
  }
  expect(ages.some((age) => age > 0 && age < 17)).toBe(true);
  expect(ages.some((age) => age >= 17)).toBe(true);
  expect(dogs).toBeGreaterThan(5);
  expect(dogs).toBeLessThan(35);
});
