import { it, expect } from "vitest";
import { createSession } from "../src/runtime/session";
import { PlayerAdapter } from "../src/agents/player";

const play = () => {
  const engine = createSession("roman", "chronicle-check");
  return { engine, adapter: new PlayerAdapter(engine) };
};

it("records a turn from either a human or an agent, without touching replay", () => {
  const { engine, adapter } = play();
  const before = engine.hash();
  // A human at the keyboard reaches the engine directly and still lands in the record.
  engine.act({
    actionId: "human-1",
    expectedRevision: engine.state.revision,
    command: { type: "wait", seconds: 60 },
  });
  adapter.act({
    actionId: "agent-1",
    expectedRevision: engine.state.revision,
    command: { type: "wait", seconds: 60 },
    rationale: { intent: "Rest before the market", reasoning: "Midday heat." },
  });
  const turns = adapter.chronicle.turns;
  expect(turns).toHaveLength(2);
  expect(turns[0].rationale).toBeUndefined();
  expect(turns[1].rationale?.intent).toBe("Rest before the market");
  expect(engine.state.log.every((r) => !("rationale" in r))).toBe(true);
  expect(before).not.toBe(engine.hash());

  const md = adapter.chronicle.markdown();
  expect(md).toContain("Rest before the market");
  expect(md).toContain("Waited 1 minute.");
  expect(adapter.chronicle.jsonl().split("\n")).toHaveLength(2);
});

it("folds a walk into one line and captures the scene sparingly", () => {
  const { engine, adapter } = play();
  const step = (n: number) =>
    adapter.act({
      actionId: `walk-${n}`,
      expectedRevision: engine.state.revision,
      command: { type: "move", dx: 0, dy: 1 },
    });
  for (let i = 0; i < 8; i++) step(i);
  const turns = adapter.chronicle.turns;
  // Eight steps south become one walk, then one line for the wall it met.
  expect(turns).toHaveLength(2);
  expect(turns[0].steps).toBe(6);
  expect(turns[1].status).toBe("rejected");
  expect(turns[1].repeats).toBe(2);
  const scenes = adapter.chronicle.turns.filter((t) => t.scene).length;
  expect(scenes).toBe(1);
  expect(adapter.chronicle.markdown()).toMatch(/Walked \d+ steps/);
});

it("treats the idle clock as elapsed time, not as decisions", () => {
  const { engine, adapter } = play();
  const send = (id: string, command: Parameters<typeof engine.act>[0]["command"]) =>
    adapter.act({ actionId: id, expectedRevision: engine.state.revision, command });
  // Human play interleaves a `pass` tick with every step; one walk should survive.
  for (let i = 0; i < 4; i++) {
    send(`p-${i}`, { type: "pass", seconds: 60 });
    send(`m-${i}`, { type: "move", dx: 1, dy: 0 });
  }
  const turns = adapter.chronicle.turns;
  expect(turns).toHaveLength(2);
  expect(turns[0].command.type).toBe("pass");
  expect(turns[1].steps).toBe(4);
  expect(turns[1].passed).toBe(180);
  const md = adapter.chronicle.markdown();
  expect(md).toContain("Stood still for 1 minute.");
  expect(md).toContain("Walked 4 steps east");
  expect(md).not.toContain('{"type"');
});

it("hands the agent a prose digest naming the actions in reach", () => {
  const { adapter } = play();
  const digest = adapter.digest();
  expect(digest).toContain("SCENE");
  expect(digest).not.toContain("PLAYER SAYS");
  expect(digest.length).toBeLessThan(JSON.stringify(adapter.observe()).length);
});
