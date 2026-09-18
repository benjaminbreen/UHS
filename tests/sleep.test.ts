import { it, expect } from "vitest";
import { createSession } from "../src/runtime/session";

const evening = (seed = "tiber-100") => {
  const engine = createSession("roman", seed);
  engine.advance(11 * 3600);
  engine.state.player.fatigue = 80;
  engine.state.player.health = 100;
  return engine;
};
const since = (engine: ReturnType<typeof evening>, id: number) =>
  engine.state.events.filter((e) => e.id > id).map((e) => e.text);

it("sleeps through to morning, clearing fatigue and advancing hunger", () => {
  const engine = evening();
  const hunger = engine.state.player.hunger;
  engine.act({
    actionId: "sleep-1",
    expectedRevision: engine.state.revision,
    command: { type: "sleep", seconds: engine.untilMorning() },
  });
  expect(Math.floor(engine.state.clock / 3600) % 24).toBe(6);
  expect(engine.state.player.fatigue).toBeLessThan(30);
  expect(engine.state.player.hunger).toBeGreaterThan(hunger);
});

it("refuses a span that is not a rest", () => {
  const engine = evening();
  const before = engine.hash();
  const result = engine.act({
    actionId: "sleep-bad",
    expectedRevision: engine.state.revision,
    command: { type: "sleep", seconds: 60 },
  });
  expect(result.status).toBe("rejected");
  expect(engine.hash()).toBe(before);
});

it("mends you under a roof and costs you in the open", () => {
  const rough = evening("week");
  const sheltered = evening("week");
  const place = sheltered.world.places[0];
  sheltered.state.player.pos = { ...place.entrance, space: place.id };
  expect(sheltered.shelter().covered).toBe(true);
  expect(rough.shelter().covered).toBe(false);

  for (const engine of [rough, sheltered]) engine.sleep(engine.untilMorning());
  expect(sheltered.state.player.health).toBe(100);
  expect(rough.state.player.health!).toBeLessThan(100);
  // Shelter is worth more than the ground for fatigue too.
  expect(sheltered.state.player.fatigue).toBeLessThan(
    rough.state.player.fatigue,
  );
});

it("spends the same night on every replay", () => {
  const a = evening("det");
  const b = evening("det");
  a.sleep(9 * 3600);
  b.sleep(9 * 3600);
  expect(a.hash()).toBe(b.hash());
});

it("can take something from a sleeper in the open, and says so", () => {
  // One seed in seven or so loses something; find the first that does.
  let texts: string[] = [];
  for (let i = 0; i < 40 && !texts.length; i++) {
    const engine = evening(`s${i}`);
    const id = engine.state.events.at(-1)?.id ?? 0;
    engine.sleep(9 * 3600);
    texts = since(engine, id).filter((t) => /went through your things/.test(t));
  }
  expect(texts.length).toBe(1);
});

it("offers sleep on a bed", () => {
  const engine = createSession("roman", "tiber-100");
  const bed = engine.state.objects.find((o) => o.kind === "bed");
  if (!bed) return;
  engine.state.player.pos = { ...bed.pos };
  const actions = engine
    .inspect(bed.id)
    ?.affordances.map((a) => (a.command as { action?: string }).action);
  expect(actions).toContain("sleep");
});
