/** Re-runs an agent run folder or an exported browser trajectory. */
import { readFileSync, statSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { createSession } from "../src/runtime/session";
import { snapshotSchema } from "../src/runtime/schema";
import { startAgent, PROTOCOL } from "../src/agents/agent";
import { RunRecord, type Entry, type Manifest, type Trace } from "../src/agents/record";

const input = process.argv[2];
if (!input) throw Error("Usage: npm run replay -- <run-folder|recording.json>");
const file = statSync(input).isDirectory() ? join(input, "manifest.json") : input;
const record = JSON.parse(readFileSync(file, "utf8"));
if (record.mode === "serve" || record.mode === "run") {
  const manifest = record as Manifest;
  if (manifest.protocol !== PROTOCOL)
    throw Error(`Unsupported agent protocol: ${manifest.protocol}. Expected ${PROTOCOL}.`);
  const setting = manifest.initialSetting ?? manifest.setting?.asked;
  if (!setting || !manifest.setting?.seed)
    throw Error("This run lacks its starting setting or seed and cannot be replayed.");
  const entries: Entry[] = readFileSync(join(dirname(file), "trajectory.jsonl"), "utf8")
    .split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const tracesFile = join(dirname(file), "inferences.jsonl");
  const responses: Trace[] = existsSync(tracesFile) ? readFileSync(tracesFile, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line)).filter((t: Trace) => t.kind === "environment") : [];
  let responseIndex = 0, mismatch = "";
  const modelFetch: typeof fetch = async (url, init) => {
    const trace = responses[responseIndex++];
    const request = trace?.request as { url: string; body?: string } | undefined;
    if (request?.url !== String(url) || request.body !== (init?.body ? String(init.body) : undefined))
      throw Error(mismatch = `Environment request ${responseIndex} differs from the recording.`);
    if (trace.error) throw Error(trace.error);
    const response = trace.response as { body: string; status: number };
    return new Response(response.body, { status: response.status });
  };
  const replay = await startAgent({ setting, seed: manifest.setting.seed, timeTravel: manifest.timeTravel, modelFetch }, new RunRecord({ mode: "run" }));
  try {
    let calls = 0;
    for (const entry of entries) {
      if (entry.tool === "diary") continue;
      if (!entry.hash) throw Error(`Missing state hash at entry ${entry.i + 1} (${entry.tool}).`);
      const index = replay.record.entries.length;
      await replay.call(entry.tool, entry.input);
      const actual = replay.record.entries[index];
      const fields = ["status", "text", "clock", "after", "place", "year", "hash"] as const;
      const changed = fields.filter((key) => actual?.[key] !== entry[key]);
      if (changed.length)
        throw Error(`Agent replay diverged at entry ${entry.i + 1} (${entry.tool}): ${changed.join(", ")}.`);
      calls++;
    }
    if (mismatch) throw Error(mismatch);
    if (responseIndex !== responses.length) throw Error("Some recorded environment responses were not used.");
    if (!calls) throw Error("This run has no tool calls to replay.");
    console.log(`Agent replay verified: ${calls} tool calls, ${replay.engine.hash()}`);
  } finally {
    replay.runtime.dispose();
  }
} else {
  if (!record.manifest) throw Error("Expected an agent run folder, its manifest.json, or an exported browser trajectory.");
  const manifest = snapshotSchema.shape.manifest.parse(record.manifest);
  const replay = createSession(
    manifest.pack,
    manifest.seed,
    {
      setting: manifest.generator !== 1 ? manifest.setting : undefined,
      content: manifest.content,
      generator: manifest.generator,
    },
  );
  replay.state.manifest = structuredClone(manifest);
  for (const entry of record.entries ?? record.commands.map((request: unknown) => ({ request })))
    replay.act(entry.request);
  if (replay.hash() !== (record.finalHash ?? record.hash))
    throw Error(`Replay mismatch: ${replay.hash()} / ${record.finalHash}`);
  process.stdout.write(`Replay verified: ${replay.hash()}\n`);
}
