import { expect, it } from "vitest";
import { agendaOf, asDoing, calendarOf, festivalOf, marketDay, type Person } from "../src/core/agenda";
import { occasions, festivals } from "../src/content/days";
import { goalDone } from "../src/core/goals";
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

it("keeps the kitchen errand open at the door and during the hymn", () => {
  const check = {type:"reach" as const,x:3,y:4,participation:"gurdwara/meal"};
  const goal = {id:"day.sikh.langar",text:"Help serve the meal",check};
  const p = actor("player",{pos:{x:3,y:4,space:"outside"}});
  const flags = {traded:false,talked:false,visited:["gurdwara"],participated:["gurdwara/listen"]};
  expect(goalDone(goal,p,flags)).toBe(false);
  flags.participated.push("gurdwara/meal");
  expect(goalDone(goal,p,flags)).toBe(true);
});

it("is the same for a person and day, and differs across days", () => {
  const p = person(actor("a"));
  const days = Array.from({ length: 30 }, (_, d) =>
    agendaOf("seed", rome, at(d), p).map((i) => i.id).join(","),
  );
  expect(agendaOf("seed", rome, at(3), p)).toEqual(agendaOf("seed", rome, at(3), p));
  expect(new Set(days).size).toBeGreaterThan(3);
});

it("assigns the Friday fast by household practice in a mixed city", () => {
  const town = setting(1700,22.94,40.64,"european");
  for (const community of ["ottoman-christian","ottoman-jewish","ottoman-muslim"]) {
    const days = Array.from({length:32}, (_,i) => {
      const a = actor("resident-"+i, {origin:{belief:community,community} as Actor["origin"]});
      return agendaOf("mixed-parish",town,at(2),person(a));
    }).flat();
    expect(days.some(d => d.id === "day.orthodox.fast")).toBe(community === "ottoman-christian");
  }
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

it("puts a region's own lore before the worldwide fallbacks", async () => {
  const { loreFor } = await import("../src/content/task-lore");
  const water = loreFor(rome, undefined, [{ goal: "water" }, { scene: "water" }], "");
  expect(water[0]?.id).not.toMatch(/^lore\.general\./);
  const potter = loreFor(rome, undefined, [{ goal: "day-of-work" }, { trade: /./ }, { workplace: "workshop" }, { scene: "craft" }], "Potter shaping pots");
  for (const l of potter) expect(l.topics.some((t) => "trade" in t && !t.trade.test("Potter shaping pots"))).toBe(false);
});

it("gives every piece of lore its own id", async () => {
  const { taskLore } = await import("../src/content/task-lore");
  expect(new Set(taskLore.map((l) => l.id)).size).toBe(taskLore.length);
});

it("connects local aim variants to their family and the actual person concerned", () => {
  const a = actor("aim-parent");
  const wanted = actor("wanted", { age: 9 });
  const other = actor("other-child", { age: 10 });
  const p = person(a, {
    kin: [{ actor: wanted, kind: "child" }, { actor: other, kind: "child" }],
    aim: { id: "fayum-weaving-training", family: "child-future", text: "Arrange instruction.", subjects: [wanted.id], revision: 2 },
  });
  const days = Array.from({ length: 112 }, (_, d) => agendaOf("aim-family", rome, at(d), p)).flat();
  const teaching = days.filter((i) => i.id === "day.teach-child");
  expect(teaching.some((i) => i.subject === wanted.id && i.why.includes("It serves your life aim."))).toBe(true);
  expect(teaching.filter((i) => i.subject !== wanted.id).every((i) => !i.why.includes("It serves your life aim."))).toBe(true);
});

it("knows a market's day where it keeps a cycle, and not where it does not", () => {
  const tenochtitlan = setting(1450, -99.1, 19.4, "mesoamerican");
  const days = Array.from({ length: 10 }, (_, d) => marketDay(tenochtitlan, at(d)));
  expect(days.filter(Boolean)).toHaveLength(2);
  expect(marketDay(london, at(0))).toBeUndefined();
});

it("puts a death, an illness and a shortage on the day of the house and its kin", () => {
  const ids = (p: Person) => agendaOf("seed", rome, at(3), p).map((i) => i.id);
  const self = actor("a"), wife = actor("w", { householdId: self.householdId }), brother = actor("b");
  const kin = [{ actor: wife, kind: "partner" as const }, { actor: brother, kind: "friend" as const }];
  const household = { id: self.householdId!, members: ["a", "w"], home: { x: 0, y: 0, space: "outside" }, storeId: "s" };
  const on = (id: string, c: object) => person(self, { kin, household, conditions: (h) => (h === id ? c : undefined) });
  expect(ids(person(self, { kin, household }))).not.toContain("day.mourning-at-home");
  expect(ids(on(self.householdId!, { mourning: "Gaius Test" }))).toContain("day.mourning-at-home");
  expect(ids(on(self.householdId!, { sick: ["w"] }))).toContain("day.tend-the-sick");
  expect(ids(on(self.householdId!, { sick: ["a"] }))).not.toContain("day.tend-the-sick");
  const asking = agendaOf("seed", rome, at(3), on(self.householdId!, { short: { good: "bread", seller: "x" } })).find((i) => i.id === "day.short-of-staple");
  expect(asking?.subject).toBe("x");
  // Kin do not call every day: some day in a fortnight.
  const someDay = (p: Person, id: string) => Array.from({ length: 14 }, (_, d) => agendaOf("seed", rome, at(d), p)).flat().find((i) => i.id === id);
  expect(someDay(on(brother.householdId!, { mourning: "Lucius" }), "day.mourning-call")?.text).toContain("Lucius");
  expect(someDay(on(brother.householdId!, { sick: ["b"] }), "day.sick-call")?.subject).toBe("b");
  const fallenOut = person(self, { kin, household, conditions: (h) => (h === brother.householdId ? { mourning: "Lucius Test" } : { shuns: [brother.householdId!] }) });
  expect(someDay(fallenOut, "day.mourning-call")).toBeUndefined();
  const burial = agendaOf("seed", rome, at(3), on(self.householdId!, { mourning: "Gaius", burying: true }));
  expect(burial.filter((i) => i.rest).map((i) => i.id).sort()).toEqual(["day.burial", "day.mourning-at-home"]);
  expect(ids(on(brother.householdId!, { mourning: "Lucius", burying: true }))).toContain("day.burial-kin");
  const stocks = agendaOf("seed", rome, at(3), on(self.householdId!, { sentenced: { who: "a", how: "in the stocks" } })).find((i) => i.id === "day.public-sentence");
  expect(stocks?.text).toBe("Spend the morning in the stocks, in front of everyone.");
  expect(ids(on(self.householdId!, { sentenced: { who: "w", how: "in the stocks" } }))).not.toContain("day.public-sentence");
});
