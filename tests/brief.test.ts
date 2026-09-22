import { describe, expect, it } from "vitest";
import { atWork, briefText, personBrief } from "../src/core/brief";
import { placeBrief } from "../src/core/place-brief";
import {
  conditionOf,
  weatherStructure,
} from "../src/core/time/structure";
import type { Actor, Place } from "../src/core/types";

const at = { x: 0, y: 0, space: "outside" } as const;
const person = (over: Partial<Actor> = {}): Actor => ({
  id: "a",
  name: "Tesni",
  role: "Potter",
  kind: "human",
  pos: at,
  home: at,
  work: at,
  sprite: "person",
  inventory: { items: [] } as unknown as Actor["inventory"],
  activity: "Walking to the well",
  fatigue: 0,
  hunger: 0,
  trust: 1,
  memories: [],
  direction: 1,
  ...over,
});
const names: Record<string, string> = { b: "Aneirin", c: "Maëlys" };
const text = (over: Partial<Actor> = {}, held?: string) =>
  briefText(
    personBrief(
      person(over),
      (id) => names[id],
      () => "a clay jar",
      held,
    ),
  );

describe("person brief", () => {
  it("reads as two sentences, not a list of fields", () => {
    expect(
      text({ age: 34, origin: { sex: "female" } as Actor["origin"] }),
    ).toBe("Potter, 34. She is walking to the well.");
  });
  it("names kin from the actor's own side", () => {
    // A `parent` relation means Aneirin is their parent, so they are the son.
    const t = text({
      origin: { sex: "male" } as Actor["origin"],
      relations: [
        { kind: "parent", other: "b" },
        { kind: "partner", other: "c" },
      ] as Actor["relations"],
    });
    expect(t).toContain("Husband of Maëlys, son of Aneirin.");
  });
  it("drops every clause whose fact is missing", () => {
    // A stranger with no age and no household gets a shorter card, not a
    // vaguer one.
    expect(text()).toBe("Potter. They are walking to the well.");
  });
  it("puts a bare noun of an activity behind a verb", () => {
    expect(text({ activity: "Household work" })).toContain(
      "busy with household work",
    );
  });
  it("does not say the trade twice over two lines", () => {
    expect(text({ activity: atWork("Potter") })).toBe(
      "Potter. They are at work.",
    );
  });
  it("carries one body note at most, worst first", () => {
    const hurt = text({ health: 20, hunger: 90, fatigue: 90 });
    expect(hurt).toContain("is hurt");
    expect(hurt).not.toContain("eaten");
    expect(text({ hunger: 90, fatigue: 90 })).toContain("have not eaten today");
    expect(text({ fatigue: 90 })).toContain("are worn out");
  });
  it("mentions what is in their hands and whether they trust you", () => {
    expect(text({ trust: -1 }, "a hoe")).toBe(
      "Potter. They are walking to the well, carrying a hoe. They are wary of you.",
    );
  });
});

describe("place brief", () => {
  const structure = weatherStructure("s", "p", "earth", 1360, 1400, 0.6);
  const house = (over: Partial<Place> = {}): Place => ({
    id: "p",
    name: "Household",
    description: "A mudbrick block.",
    x: 0,
    y: 0,
    w: 4,
    h: 3,
    sprite: "house",
    entrance: { x: 0, y: 0 },
    access: "household",
    owner: "a",
    claim: "landscape",
    entranceLabel: "Door to the street",
    structure,
    condition: conditionOf(structure),
    ...over,
  });
  const holder = person({ id: "a", name: "Tesni", role: "Potter" });
  const wife = person({
    id: "b",
    name: "Aneirin",
    relations: [{ other: "a", kind: "partner" }],
  });

  it("names who lives there, how old it is and how it has fared", () => {
    const b = placeBrief(house(), 1400, holder, [holder, wife])!;
    const said = briefText(b);
    expect(said).toContain("Tesni");
    expect(said).toContain("lives here with");
    expect(said).toContain("Aneirin");
    expect(said).toMatch(/Put up about 40 years ago/);
    expect(said).toMatch(/well kept|sound/);
  });

  it("says nothing about business unless the place trades", () => {
    expect(briefText(placeBrief(house(), 1400, holder, [holder])!)).not.toMatch(
      /Business/,
    );
    const shop = house({ access: "public", trade: 0.85 });
    expect(briefText(placeBrief(shop, 1400, holder, [holder])!)).toMatch(
      /Business is brisk/,
    );
  });

  it("tells the household's story and whom it buys from", () => {
    const baker = person({ id: "c", name: "Agnes", role: "Baker" });
    const said = briefText(
      placeBrief(
        house(),
        1400,
        holder,
        [holder, wife],
        {
          id: "h",
          members: ["a", "b"],
          home: { x: 0, y: 0, space: "outside" },
          storeId: "s",
          infants: 2,
          history: [
            { year: 1380, kind: "wed", as: "husband" },
            { year: 1386, kind: "died", as: "husband" },
            { year: 1388, kind: "wed", as: "husband" },
            { year: 1390, kind: "inherited", as: "mother" },
            { year: 1392, kind: "died", as: "son" },
          ],
          buys: [{ good: "bread", from: "hc" }],
          owes: "hc",
        },
        (id) => (id === "hc" ? baker : undefined),
      )!,
    );
    expect(said).toContain("two small children");
    expect(said).toMatch(/came to (her|him|them) from their mother 10 years ago/);
    expect(said).toMatch(/first husband died/);
    expect(said).toMatch(/buried a child/);
    expect(said).toMatch(/bread comes from Agnes, still owing for it/);
  });

  it("does not give a civic building a householder", () => {
    const hall = house({ claim: "venue-hall", name: "The town hall" });
    const said = briefText(placeBrief(hall, 1400, holder, [holder, wife])!);
    expect(said).not.toContain("lives here");
    expect(said).toContain("A mudbrick block.");
  });
});
