import { describe, expect, it } from "vitest";
import { atWork, briefText, personBrief } from "../src/core/brief";
import type { Actor } from "../src/core/types";

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
