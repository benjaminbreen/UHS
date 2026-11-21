import { it, expect, vi } from "vitest";
import { createSession } from "../src/runtime/session";
import { startChronicle, type Rationale } from "../src/chronicle/chronicle";
import { jev, type Evaluation } from "../src/chronicle/jev";
import type { CommandRequest } from "../src/core/types";

const play = () => {
  const engine = createSession("roman", "chronicle-check");
  const chronicle = startChronicle(engine, "agent");
  const act = ({ rationale, ...request }: CommandRequest & { rationale?: Rationale }) => {
    chronicle.explain(rationale);
    return engine.act(request);
  };
  return { engine, adapter: { chronicle, act } };
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

const jevReply = (status = 200) =>
  new Response(
    JSON.stringify({
      model: "jev-1.13.0",
      answers: { errand: { type: "choice", choice: "roam", probabilities: {}, confidence: 0.9 } },
      usage: { input_tokens: 400, output_tokens: 0 },
    } as Evaluation),
    { status },
  );

it("sends one typed Jev request and backs off on rate limits but not bad keys", async () => {
  const send = vi.fn(async () => jevReply());
  const result = await jev({ apiKey: "k", fetch: send as never })("state", {});
  const [url, init] = send.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("https://api.typesafe.ai/v1/systemone");
  expect((init.headers as Record<string, string>).Authorization).toBe("Bearer k");
  expect(JSON.parse(init.body as string)).toMatchObject({ model: "jev-latest", state: "state" });
  expect(result.usage.input_tokens).toBe(400);

  let calls = 0;
  const limited = vi.fn(async () => (++calls === 1 ? new Response("slow down", { status: 429 }) : jevReply()));
  await expect(jev({ apiKey: "k", fetch: limited as never })("s", {})).resolves.toBeTruthy();
  expect(calls).toBe(2);

  const denied = vi.fn(async () => new Response("nope", { status: 401 }));
  await expect(jev({ apiKey: "bad", fetch: denied as never })("s", {})).rejects.toThrow(/401/);
  expect(denied).toHaveBeenCalledTimes(1);
});
