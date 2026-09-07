import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline";
import {
  createSession,
  createSettingSession,
  restoreSession,
} from "../src/runtime/session";
import { snapshotSchema } from "../src/runtime/schema";
import { PlayerAdapter } from "../src/agents/player";
import { findPath } from "../src/core/pathfinding";
import type { PlayerCommand, Position } from "../src/core/types";
const args = process.argv.slice(2);
const flag = (s: string) => {
  const i = args.indexOf(s);
  return i < 0 ? undefined : args[i + 1];
};
const saved = flag("--load"),
  pack = flag("--pack") ?? "roman";
import { resolveSetting } from "../src/content/geography/resolve";
const requested = flag("--prompt");
const resolved = requested
  ? resolveSetting(requested, flag("--seed") ?? "earth-2")
  : undefined;
if (resolved && "error" in resolved) throw Error(resolved.error);
const engine = saved
  ? restoreSession(JSON.parse(readFileSync(saved, "utf8")))
  : resolved && "setting" in resolved
    ? createSettingSession(resolved.setting, flag("--seed"))
    : createSession(pack, flag("--seed"));
const adapter = new PlayerAdapter(engine);
let counter = 0;
const act = (command: PlayerCommand) =>
  adapter.act({
    actionId: `runner-${counter++}`,
    expectedRevision: engine.state.revision,
    command,
  });
function approach(target: Position) {
  const p = engine.state.player.pos;
  let path: ReturnType<typeof findPath> = [];
  for (const [dx, dy] of [
    [0, 1],
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 0],
  ]) {
    if (engine.blocked(target.x + dx, target.y + dy)) continue;
    path = findPath(p, { x: target.x + dx, y: target.y + dy }, (x, y) =>
      engine.blocked(x, y),
    );
    if (path.length) break;
  }
  for (const step of path)
    act({ type: "move", dx: step.x - p.x, dy: step.y - p.y });
}
if (args.includes("--demo")) {
  const well = engine.state.objects.find((o) => o.kind === "well")!;
  approach(well.pos);
  act({ type: "interact", target: well.id, action: "drink" });
  const person = engine.state.actors.find((a) => a.kind === "human")!;
  approach(person.pos);
  act({ type: "interact", target: person.id, action: "talk" });
  const t = engine.world.pack.trade;
  act({
    type: "trade",
    target: person.id,
    give: t.give,
    giveQuantity: t.cost,
    take: t.take,
    takeQuantity: 1,
  });
  const home = engine.world.places.find((b) => b.owner === person.id)!;
  approach({ ...home.entrance, space: "outside" });
  act({ type: "interact", target: home.id, action: "enter" });
  act({ type: "interact", target: `${home.id}-exit`, action: "exit" });
  const store = engine.state.objects.find((o) => o.id === `${home.id}-store`)!;
  approach(store.pos);
  act({ type: "interact", target: store.id, action: "take" });
  act({ type: "interact", target: store.id, action: "return" });
  approach(person.pos);
  act({ type: "interact", target: person.id, action: "follow" });
  for (let i = 0; i < 4; i++) act({ type: "wait", seconds: 6 });
  const prey = engine.state.actors.find((a) => a.kind === "lizard")!;
  approach(prey.pos);
  act({ type: "interact", target: prey.id, action: "capture" });
  const crop = engine.state.objects.find((o) => o.kind === "crop")!;
  approach(crop.pos);
  act({ type: "interact", target: crop.id, action: "harvest" });
  act({ type: "use", item: "grain" });
  const gate = engine.state.objects.find((o) => o.kind === "gate")!;
  approach(gate.pos);
  act({ type: "interact", target: gate.id, action: "open" });
  const animal = engine.state.actors.find((a) => a.kind === "sheep")!;
  approach(animal.pos);
  act({ type: "interact", target: animal.id, action: "herd" });
  act({ type: "wait", seconds: 180 });
  while (engine.state.clock < 21 * 3600)
    act({
      type: "wait",
      seconds: Math.min(3600, 21 * 3600 - engine.state.clock),
    });
  const output = flag("--output") ?? `artifacts/${pack}-day.json`;
  writeFileSync(
    output,
    JSON.stringify(
      {
        manifest: engine.state.manifest,
        entries: adapter.trajectory,
        finalHash: engine.hash(),
      },
      null,
      2,
    ),
  );
  writeFileSync(
    output.replace(".json", "-save.json"),
    JSON.stringify(engine.snapshot(), null, 2),
  );
  process.stdout.write(
    JSON.stringify(
      {
        pack,
        clock: engine.state.clock,
        revision: engine.state.revision,
        hash: engine.hash(),
        commands: adapter.trajectory.length,
        rejected: adapter.trajectory
          .filter((e) => e.result.status === "rejected")
          .map((e) => ({
            command: e.request.command,
            reason: e.result.reason,
          })),
        trajectory: output,
      },
      null,
      2,
    ) + "\n",
  );
} else if (flag("--replay")) {
  const record = JSON.parse(readFileSync(flag("--replay")!, "utf8"));
  const manifest = snapshotSchema.shape.manifest.parse(record.manifest);
  const replay = createSession(
    manifest.pack,
    manifest.seed,
    undefined,
    manifest.generator !== 1 ? manifest.setting : undefined,
    manifest.content,
    manifest.generator,
  );
  for (const entry of record.entries ??
    record.commands.map((request: unknown) => ({ request })))
    replay.act(entry.request);
  if (replay.hash() !== (record.finalHash ?? record.hash))
    throw Error(`Replay mismatch: ${replay.hash()} / ${record.finalHash}`);
  process.stdout.write(`Replay verified: ${replay.hash()}\n`);
} else {
  const reader = createInterface({ input: process.stdin });
  for await (const line of reader) {
    try {
      const request = JSON.parse(line);
      const result =
        request.tool === "observe"
          ? adapter.observe()
          : request.tool === "inspect"
            ? adapter.inspect(String(request.target))
            : request.tool === "act"
              ? adapter.act(request.request)
              : { error: "Use observe, inspect, or act." };
      process.stdout.write(JSON.stringify(result) + "\n");
    } catch (error) {
      process.stdout.write(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Invalid input",
        }) + "\n",
      );
    }
  }
}
