import { expect, it } from "vitest";
import { agendaOf, asDoing, calendarOf, festivalOf, type Person } from "../src/core/agenda";
import { occasions, festivals } from "../src/content/days";
import type { Actor } from "../src/core/types";

const DAY = 86400;
const at = (day: number) => day * DAY + 12 * 3600;
const setting = (year: number, lon: number, lat: number, culture: string) =>
  ({ year, lon, lat, culture, season: "spring", community: "" }) as never;
const rome = setting(100, 12.3, 41.8, "european");
const london = setting(1868, -0.1, 51.5, "european");
const actor = (id: string, extra: Partial<Actor> = {}): Actor =>
  ({
    id,
    name: `${id} Test`,
    kind: "human",
    role: "Baker",
    age: 40,
    inventory: {},
    householdId: `household-${id}`,
    ...extra,
  }) as Actor;
const person = (a: Actor, extra: Partial<Person> = {}): Person => ({
  actor: a,
  kin: [],
  work: "Baker baking bread",
  ...extra,
});

it("is the same for a person and day, and differs across days", () => {
  const p = person(actor("a"));
  const days = Array.from({ length: 30 }, (_, d) =>
    agendaOf("seed", rome, at(d), p).map((i) => i.id).join(","),
  );
  expect(agendaOf("seed", rome, at(3), p)).toEqual(agendaOf("seed", rome, at(3), p));
  expect(new Set(days).size).toBeGreaterThan(3);
});

it("binds every word it names, or leaves the occasion out", () => {
  const partner = actor("b", { age: 38 });
  const child = actor("c", { age: 10 });
  const parent = actor("d", { age: 70 });
  const p = person(actor("a"), {
    kin: [
      { actor: partner, kind: "partner" },
      { actor: child, kind: "child" },
      { actor: parent, kind: "parent" },
    ],
    household: {
      id: "h",
      members: ["a"],
      home: { x: 0, y: 0, space: "outside" },
      storeId: "s",
      history: [
        { year: 1858, kind: "wed" },
        { year: 1860, kind: "died", as: "mother" },
      ],
    },
  });
  for (const s of [rome, london])
    for (let d = 0; d < 120; d++)
      for (const item of agendaOf("seed", s, at(d), p))
        expect(item.text, item.id).not.toMatch(/\{\w+\}/);
});

it("finds the wedding anniversary on its day", () => {
  const partner = actor("b", { name: "Ellen Hale" });
  const p = person(actor("a"), {
    kin: [{ actor: partner, kind: "partner" }],
    household: {
      id: "h",
      members: ["a"],
      home: { x: 0, y: 0, space: "outside" },
      storeId: "s",
      history: [{ year: 1858, kind: "wed" }],
    },
  });
  const texts = Array.from({ length: 112 }, (_, d) =>
    agendaOf("seed", london, at(d), p).map((i) => i.text),
  ).flat();
  expect(texts).toContain("Buy flowers for your 10th wedding anniversary with Ellen.");
});

it("prefers named occasions over stand-ins where a scope has them", () => {
  const p = person(actor("a"));
  const named = Array.from({ length: 60 }, (_, d) => agendaOf("seed", rome, at(d), p))
    .flat()
    .filter((i) => i.id.startsWith("day.rome."));
  expect(named.length).toBeGreaterThan(5);
});

it("rests the settlement only on documented days, and never on arrival", () => {
  const sundays = Array.from({ length: 21 }, (_, d) => festivalOf(london, at(d)));
  expect(sundays[0]?.rest ?? false).toBe(false);
  expect(sundays.filter((f) => f?.rest).length).toBeGreaterThanOrEqual(2);
  for (const f of festivals)
    if (f.evidence !== "documented") expect(f.rest).toBe(false);
});

it("walks the calendar once round the year in 112 days", () => {
  const start = calendarOf(london, at(0)).from;
  expect(calendarOf(london, at(112)).from).toBeCloseTo(start, 5);
  expect(calendarOf(london, at(56)).from).not.toBeCloseTo(start, 0);
});

it("keeps its content well formed", () => {
  const ids = new Set<string>();
  for (const o of [...occasions, ...festivals]) {
    expect(ids.has(o.id), o.id).toBe(false);
    ids.add(o.id);
    expect(o.scope.years[0]).toBeLessThan(o.scope.years[1]);
    for (const url of o.sources) expect(url).toMatch(/^https:\/\//);
  }
  for (const o of occasions) {
    expect(o.text, o.id).not.toMatch(/^(It|The|A|An|On|At|In|When|If|Your|Today)\b/);
    expect(asDoing(o.text, false), o.id).toMatch(/^[A-Z][a-z-]+ing\b/);
  }
});

it("turns an instruction into a doing", () => {
  expect(asDoing("Sit a while with Marcus, who is 70 now.", false)).toBe(
    "Sitting a while with Marcus, who is 70 now",
  );
  expect(asDoing("Hang a garland on the hearth: it is the Kalends.", false)).toBe(
    "Hanging a garland on the hearth",
  );
  expect(asDoing("Bring bread and salt to the tomb, and pour wine.", false)).toBe(
    "Bringing bread and salt to the tomb, and pouring wine",
  );
  expect(asDoing("Give your hearth the first of the meat.", false)).toBe(
    "Giving their hearth the first of the meat",
  );
});
