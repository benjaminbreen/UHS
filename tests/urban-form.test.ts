import { expect, it } from "vitest";
import { composeUrban, urbanGates, nearestGate } from "../src/world/v3/blocks";
import {
  urbanForm,
  genericForm,
  urbanOnset,
  urbanized,
} from "../src/content/settlements/urban-form";
import { settlementProfile } from "../src/content/settlements/profiles";
import { places } from "../src/content/geography/places";
import { settingFor } from "../src/content/geography/resolve";
import { farms, farmingOnset } from "../src/content/geography/onsets";
import { urbanFrames } from "../src/world/v3/urban";
import { packForSetting } from "../src/content/geography/pack";
import kit from "../src/content/graphics/urban.json";
import {
  urbanCapacity,
  URBAN_CAPACITY,
} from "../src/content/settlements/scale";
import type { WorldSetting } from "../src/content/geography/types";
import type { UrbanForm } from "../src/content/settlements/urban-form/types";

const at = (
  culture: WorldSetting["culture"],
  lon: number,
  lat: number,
  year: number,
) => urbanForm({ culture, lon, lat, year } as WorldSetting);

const pack = packForSetting(
  settingFor(places.find((p) => p.id === "rome")!, 100),
);
const center = { x: 0, y: 0 };
const compose = (form: UrbanForm, radius = 96, seed = "seed") =>
  composeUrban("site", center, radius, form, seed);

it("selects street fabric by culture, date and place, with a labelled fallback", () => {
  expect(at("east-asian", 116, 40, 1450).id).toBe("chinese-ward-grid");
  expect(at("east-asian", 135, 35, 1200).id).toBe("japanese-capital-grid");
  expect(at("european", 12.5, 41.9, -100).id).toBe("roman-insula-grid");
  expect(at("european", 12.5, 41.9, 1300).id).toBe("medieval-market-town");
  expect(at("north-african-west-asian", 44, 33, 900).id).toBe("medina-quarter");
  expect(at("north-african-west-asian", 44, 33, -1000).id).toBe(
    "mesopotamian-lane-fabric",
  );
  expect(at("mesoamerican", -99, 19, 1500).id).toBe(
    "mesoamerican-precinct-grid",
  );
  // An unprofiled culture family is not given another region's fabric.
  expect(at("australian-pacific", 145, -25, 1700)).toEqual(genericForm);
  expect(genericForm.evidence.status).toBe("fictional");
});

it("keeps every rule's evidence attributable and its parameters in range", () => {
  const cases: [WorldSetting["culture"], number, number, number][] = [
    ["east-asian", 116, 40, 1450],
    ["european", 12.5, 41.9, -100],
    ["european", -75, 40, 1750],
    ["north-african-west-asian", 44, 33, 900],
    ["south-asian", 77, 28, 1400],
    ["andean", -72, -13, 1450],
    ["west-central-african", 8, 12, 1500],
    ["southeast-asian", 102, 2, 1500],
    ["inner-eurasian", 67, 40, 1400],
  ];
  for (const [culture, lon, lat, year] of cases) {
    const form = at(culture, lon, lat, year);
    expect(form.id, culture).not.toBe(genericForm.id);
    expect(form.evidence.status).toBe("inferred");
    expect(form.evidence.note.length).toBeGreaterThan(60);
    expect(form.regularity).toBeGreaterThanOrEqual(0);
    expect(form.regularity).toBeLessThanOrEqual(1);
    expect(form.block[0]).toBeGreaterThan(10);
    expect(form.tiers[0]).toBeGreaterThanOrEqual(form.tiers[1]);
    expect(form.tiers[1]).toBeGreaterThanOrEqual(form.tiers[2]);
  }
});

it("composes axis-aligned streets and non-overlapping blocks clear of the plaza", () => {
  for (const [culture, lon, lat, year] of [
    ["east-asian", 116, 40, 1450],
    ["north-african-west-asian", 44, 33, 900],
    ["southeast-asian", 102, 2, 1500],
    ["european", 12.5, 41.9, 1300],
  ] as const) {
    const form = at(culture, lon, lat, year);
    const layout = compose(form);
    expect(layout.blocks.length, form.id).toBeGreaterThan(8);
    const seen = new Set<string>();
    for (const b of layout.blocks) {
      expect(b.w, form.id).toBeGreaterThanOrEqual(8);
      expect(b.h, form.id).toBeGreaterThanOrEqual(8);
      // No block may sit on the public square.
      expect(
        b.x < layout.plaza.x + layout.plaza.w &&
          b.x + b.w > layout.plaza.x &&
          b.y < layout.plaza.y + layout.plaza.h &&
          b.y + b.h > layout.plaza.y,
        form.id,
      ).toBe(false);
      for (let y = b.y; y < b.y + b.h; y++)
        for (let x = b.x; x < b.x + b.w; x++) {
          expect(seen.has(`${x},${y}`), `${form.id} ${x},${y}`).toBe(false);
          seen.add(`${x},${y}`);
        }
    }
    // Streets are straight runs, so laying one never needs a graph search.
    for (const s of layout.streets)
      expect(s.a.x === s.b.x || s.a.y === s.b.y, form.id).toBe(true);
  }
});

it("gives each fabric its own block size, hierarchy and share of blind alleys", () => {
  const median = (form: UrbanForm) => {
    const areas = compose(form)
      .blocks.map((b) => b.w * b.h)
      .sort((a, b) => a - b);
    return areas[areas.length >> 1];
  };
  const ward = at("east-asian", 116, 40, 1450),
    medina = at("north-african-west-asian", 44, 33, 900),
    grid = at("european", -75, 40, 1750);
  expect(median(ward)).toBeGreaterThan(median(medina));
  const alleys = (form: UrbanForm) =>
    compose(form).blocks.filter((b) => b.lane).length;
  // Blind alleys are the medina's defining access pattern; on a survey grid they
  // are vanishingly rare rather than forbidden.
  expect(alleys(medina)).toBeGreaterThan(5);
  expect(alleys(grid)).toBeLessThan(3);
  expect(compose(ward).streets.some((s) => s.tier === 0)).toBe(true);
});

it("keeps gates on the built edge and stable against the world seed", () => {
  const form = at("east-asian", 116, 40, 1450);
  const gates = urbanGates("site", center, 96, form);
  expect(gates.length).toBe(4);
  for (const g of gates)
    expect(Math.max(Math.abs(g.point.x), Math.abs(g.point.y))).toBe(90);
  // The road layer finds the same gates without knowing the world seed.
  expect(urbanGates("site", center, 96, form)).toEqual(gates);
  // A route arriving from the east is sent to the eastern gate, not the nearest
  // corner: the outward normal has to agree with the bearing.
  expect(nearestGate(gates, center, { x: 400, y: 30 })!.nx).toBe(1);
  expect(nearestGate(gates, center, { x: -400, y: 30 })!.nx).toBe(-1);
  expect(nearestGate(gates, center, { x: 20, y: 400 })!.ny).toBe(1);
});

it("varies the interior with the world seed while the layout stays deterministic", () => {
  const form = at("european", 12.5, 41.9, 1300);
  // The layout carries closures for its boundary, so compare what it composed.
  const shape = (seed: string) => {
    const l = compose(form, 96, seed);
    return JSON.stringify([l.blocks, l.streets, l.plaza, l.wall?.cells]);
  };
  expect(shape("a")).toBe(shape("a"));
  expect(shape("a")).not.toBe(shape("b"));
});

it("scales capacity with extent and block size, and stays bounded", () => {
  const form = at("east-asian", 116, 40, 1450);
  // Radii below the cap, which a 60-cell extent already reaches.
  expect(urbanCapacity(20, form)).toBeLessThan(urbanCapacity(30, form));
  expect(urbanCapacity(30, form)).toBeLessThan(urbanCapacity(45, form));
  expect(urbanCapacity(400, form)).toBeLessThanOrEqual(URBAN_CAPACITY);
  // Capacity counts street frontage, so at one extent a fabric of smaller
  // blocks holds more of it: more blocks means more block edge.
  const small = at("north-african-west-asian", 44, 33, 900);
  expect(small.block[0] * small.block[1]).toBeLessThan(
    form.block[0] * form.block[1],
  );
  expect(urbanCapacity(40, small)).toBeGreaterThan(urbanCapacity(40, form));
});

it("only ranks a place as a town where an urban fabric is attested by then", () => {
  const place = (id: string) => places.find((p) => p.id === id)!;
  const rank = (id: string, year: number) =>
    settingFor(place(id), year).settlement;
  // Reported case: the atlas ranks Hobart a city from its modern prominence.
  expect(place("city-hobart").settlement).toBe("city");
  expect(rank("city-hobart", -1320)).toBe("camp");
  expect(rank("city-hobart", 2000)).toBe("city");
  // A place inside a researched envelope keeps its rank from that envelope's
  // earliest date and loses it before.
  expect(rank("rome", -100)).toBe("city");
  expect(rank("rome", -3000)).toBe("village");
  expect(rank("london", 1400)).toBe("city");
  expect(rank("london", -1320)).toBe("village");
  // A fabric whose window has closed still leaves the place urban.
  expect(
    urbanized({ culture: "east-asian", lon: 139.7, lat: 35.7, year: 1700 }),
  ).toBe(true);
  expect(
    urbanOnset({ culture: "australian-pacific", lon: 147.3, lat: -42.9 }),
  ).toBe(Infinity);
});

it("never paves or densifies a settlement before its region has towns", () => {
  for (const place of places) {
    for (const year of [-8000, -3000, -1320, 500, 1400, 2000]) {
      const s = settingFor(place, year);
      const profile = settlementProfile(s);
      if (urbanized(s)) continue;
      const where = `${place.id} ${year}`;
      expect(s.settlement, where).not.toBe("city");
      expect(profile.paved, where).toBe(false);
      expect(["dense", "planned", "waterfront"], where).not.toContain(
        profile.pattern,
      );
    }
  }
});

it("ignores a pinned dense pattern where no town is attested", () => {
  const s = settingFor(places.find((p) => p.id === "city-hobart")!, -1320);
  const profile = settlementProfile({ ...s, settlementPattern: "dense" });
  expect(profile.pattern).toBe("clustered");
  expect(profile.paved).toBe(false);
});

it("caps house height at what the fabric built", () => {
  const tall = (form: UrbanForm) =>
    Math.max(
      ...Object.entries(kit.forms)
        .filter(([name]) =>
          urbanFrames(pack, form.storeys).some((f) => f.endsWith(`-${name}`)),
        )
        .map(([, f]) => f.stories),
    );
  const ward = at("east-asian", 116, 40, 1450);
  expect(ward.storeys).toBe(1);
  expect(tall(ward)).toBe(1);
  expect(tall(at("european", 12.5, 41.9, -100))).toBe(3);
  expect(urbanFrames(pack, 1).length).toBeLessThan(urbanFrames(pack).length);
  for (const rule of [
    at("east-asian", 116, 40, 1450),
    at("european", 12.5, 41.9, 1300),
    at("andean", -72, -13, 1450),
    at("north-african-west-asian", 44, 33, 900),
    genericForm,
  ])
    expect(rule.storeys, rule.id).toBeGreaterThanOrEqual(1);
});

it("makes people foragers where farming has not arrived", () => {
  const w = (
    culture: WorldSetting["culture"],
    lon: number,
    lat: number,
    year: number,
  ) => ({ culture, lon, lat, year }) as WorldSetting;
  // Tasmania: no farming at any date, so a start there is a camp until the
  // modern settlement network reaches it.
  expect(farms(w("australian-pacific", 147.3, -42.9, 1700))).toBe(false);
  expect(farmingOnset(w("australian-pacific", 147.3, -42.9, 0))).toBe(Infinity);
  // New Guinea's highlands farmed early; the Japanese archipelago late.
  expect(farms(w("australian-pacific", 144, -5.8, -3000))).toBe(true);
  expect(farms(w("east-asian", 139.7, 35.7, -2000))).toBe(false);
  expect(farms(w("east-asian", 139.7, 35.7, 100))).toBe(true);
  // Narrower bounds win over the continental catch-all.
  expect(farmingOnset(w("north-african-west-asian", 35, 33, 0))).toBe(-9500);
  expect(farmingOnset(w("european", -3, 54, 0))).toBe(-4000);
});

it("ranks and equips a place consistently across its whole history", () => {
  const hobart = places.find((p) => p.id === "city-hobart")!;
  const ranks = [-1320, 1500, 1850, 2000].map((y) => {
    const s = settingFor(hobart, y);
    return [s.settlement, settlementProfile(s).paved] as const;
  });
  expect(ranks).toEqual([
    ["camp", false],
    ["camp", false],
    ["city", true],
    ["city", true],
  ]);
  // A camp never gets fields, livestock or paving anywhere in the atlas.
  for (const place of places)
    for (const year of [-8000, -1320, 1500]) {
      const s = settingFor(place, year);
      if (s.settlement !== "camp") continue;
      const p = settlementProfile(s);
      const where = `${place.id} ${year}`;
      expect(p.paved, where).toBe(false);
      expect(p.livestock, where).toBe(false);
    }
});

it("walls the fabrics attested as walled, with a closed ring open only at gates", () => {
  const walled = at("east-asian", 116, 40, 1450);
  const open = at("east-asian", 135, 35, 1200);
  expect(walled.wall).toBe("masonry");
  // A capital laid out without a circuit is not given one.
  expect(open.wall).toBe("none");
  expect(at("west-central-african", 8, 12, 1500).wall).toBe("earth");
  expect(at("mesoamerican", -99, 19, 1500).wall).toBe("none");
  expect(compose(open).wall).toBeUndefined();

  const layout = compose(walled);
  const wall = layout.wall!;
  const ring = new Set(wall.cells.map((p) => `${p.x},${p.y}`));
  expect(ring.size).toBeGreaterThan(200);
  // Every gate is an opening, and every opening is off the ring.
  for (const gate of layout.gates) {
    expect(ring.has(`${gate.point.x},${gate.point.y}`)).toBe(false);
    expect(wall.openings.has(`${gate.point.x},${gate.point.y}`)).toBe(true);
    // A gate stands on the circuit, not off it.
    expect(
      Math.round(Math.hypot(gate.point.x, gate.point.y)),
    ).toBeGreaterThanOrEqual(layout.half - 1);
  }
  // The circuit encloses: no cardinal step leaves the middle without passing an
  // opening. Walking straight out along each axis must meet wall or gate.
  for (const [dx, dy] of [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ]) {
    let hit = false;
    for (let d = 1; d <= layout.half + 2 && !hit; d++)
      hit =
        ring.has(`${dx * d},${dy * d}`) ||
        wall.openings.has(`${dx * d},${dy * d}`);
    expect(hit, `${dx},${dy}`).toBe(true);
  }
  // Nothing is built across the circuit, and no street runs through it.
  for (const b of layout.blocks)
    for (const [x, y] of [
      [b.x, b.y],
      [b.x + b.w - 1, b.y + b.h - 1],
    ])
      expect(ring.has(`${x},${y}`), `block ${b.x},${b.y}`).toBe(false);
  for (const s of layout.streets) {
    const steps = Math.max(Math.abs(s.b.x - s.a.x), Math.abs(s.b.y - s.a.y));
    for (let i = 0; i <= steps; i++) {
      const x = Math.round(s.a.x + ((s.b.x - s.a.x) * i) / (steps || 1));
      const y = Math.round(s.a.y + ((s.b.y - s.a.y) * i) / (steps || 1));
      expect(ring.has(`${x},${y}`), `street ${s.a.x},${s.a.y}`).toBe(false);
    }
  }
});
