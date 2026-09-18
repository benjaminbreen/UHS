import { it, expect, vi } from "vitest";
import { createSession } from "../src/runtime/session";
import { PlayerAdapter } from "../src/agents/player";
import { playthrough } from "../src/agents/playthrough";
import { decide, extractJson, type Complete } from "../src/agents/brain";

const world = () => {
  const engine = createSession("roman", "tiber-100");
  return { engine, adapter: new PlayerAdapter(engine) };
};

/** Answers like a model would, off the scene it is shown. */
const scripted =
  (choose: (scene: string) => unknown): Complete =>
  async (_system, messages) => {
    const text = messages.map((m) => m.content).join("\n");
    if (text.includes("The day is over"))
      return '{"journal":"A long day by the river."}';
    return JSON.stringify(choose(text.slice(text.lastIndexOf("SCENE"))));
  };

it("walks to a target in one call and folds the walk into one recorded line", () => {
  const { engine, adapter } = world();
  const well = engine.state.objects.find((o) => o.kind === "well")!;
  const result = adapter.goto({
    actionId: "g1",
    target: well.id,
    rationale: { intent: "Drink at the well" },
  });
  expect(result.status).toBe("arrived");
  expect(result.steps).toBeGreaterThan(5);
  expect(adapter.trajectory.length).toBe(result.steps);
  expect(adapter.chronicle.turns).toHaveLength(1);
  expect(adapter.chronicle.markdown()).toContain("Drink at the well");
});

it("refuses a target it cannot see or reach, without moving", () => {
  const { engine, adapter } = world();
  const before = engine.hash();
  expect(adapter.goto({ actionId: "g1", target: "no-such-thing" })).toMatchObject(
    { status: "unknown", steps: 0 },
  );
  expect(adapter.goto({ actionId: "g2" })).toMatchObject({ status: "unknown" });
  expect(engine.hash()).toBe(before);
});

it("puts the revision in the scene so acting needs no second call", () => {
  const { engine, adapter } = world();
  expect(adapter.scene()).toContain(`Revision: ${engine.state.revision}`);
  expect(adapter.world()).not.toContain("Revision:");
});

it("crosses a night without asking the model, and closes the day", async () => {
  const { engine, adapter } = world();
  const model = vi.fn(
    scripted(() => ({
      intent: "Stand about",
      reasoning: "Nothing to hand.",
      action: { kind: "wait", minutes: 60 },
    })),
  );
  const result = await playthrough(adapter, model, { days: 2, maxTurns: 20 });
  expect(result.days).toBeGreaterThanOrEqual(1);
  expect(result.journal[0]).toMatch(/^Day 1: A long day/);
  // The clock passed into the next day, but every call was a decision or a journal.
  expect(engine.state.clock).toBeGreaterThan(86400);
  expect(model.mock.calls.length).toBe(result.calls);
  const md = adapter.chronicle.markdown();
  expect(md).toContain("Sleep until first light");
  expect(md).toContain("### Day 2");
});

it("acts on a listed affordance and records what came of it", async () => {
  const { adapter } = world();
  const model = scripted((scene) => {
    const match = /- (\S+) "([^"]+)"[^\n]*\[([a-z/]+)\]/.exec(scene);
    return match
      ? {
          intent: `Use the ${match[2].toLowerCase()}`,
          reasoning: "It is in reach.",
          action: {
            kind: "act",
            command: {
              type: "interact",
              target: match[1],
              action: match[3].split("/")[0],
            },
          },
        }
      : {
          intent: "Wait",
          reasoning: "Nothing here.",
          action: { kind: "wait", minutes: 10 },
        };
  });
  const result = await playthrough(adapter, model, { days: 1, maxTurns: 3 });
  expect(result.turns).toBe(3);
  expect(adapter.chronicle.turns.some((t) => t.events.length)).toBe(true);
});

it("recovers from a reply that is not the shape asked for", async () => {
  const replies = [
    "Sure! Here you go: {\"intent\":\"x\"}",
    '```json\n{"intent":"Fetch water","reasoning":"Thirsty.","action":{"kind":"wait","minutes":5}}\n```',
  ];
  const complete = vi.fn(async () => replies.shift()!);
  const decision = await decide(complete, "system", [
    { role: "user", content: "scene" },
  ]);
  expect(decision.intent).toBe("Fetch water");
  expect(complete).toHaveBeenCalledTimes(2);
  expect(extractJson('text {"a":"}"} tail')).toEqual({ a: "}" });
});
