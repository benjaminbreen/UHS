/**
 * Play several in-game days as one character and write the record.
 *   ANTHROPIC_API_KEY=... npx tsx scripts/play.ts --days 3 --pack roman
 *   npx tsx scripts/play.ts --days 3 --base-url http://localhost:1234/v1 --model <local>
 * Add --prompt "<place and year>" for a World Weaver setting.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createSession, createSettingSession, restoreSession } from "../src/runtime/session";
import { resolveSetting } from "../src/content/geography/resolve";
import { PlayerAdapter } from "../src/agents/player";
import { playthrough } from "../src/agents/playthrough";
import { anthropic, openaiCompatible } from "../src/agents/providers";

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i < 0 ? undefined : args[i + 1];
};
const number = (name: string, fallback: number) => {
  const value = flag(name);
  return value === undefined ? fallback : Number(value);
};

const load = flag("--load");
const prompt = flag("--prompt");
const resolved = prompt ? resolveSetting(prompt, flag("--seed") ?? "earth-2") : undefined;
if (resolved && "error" in resolved) throw Error(resolved.error);
const engine = load
  ? restoreSession(JSON.parse(readFileSync(load, "utf8")))
  : resolved && "setting" in resolved
    ? createSettingSession(resolved.setting, flag("--seed"))
    : createSession(flag("--pack") ?? "roman", flag("--seed"));

const baseUrl = flag("--base-url");
const model = baseUrl
  ? openaiCompatible({
      baseUrl,
      apiKey: process.env.OPENAI_API_KEY,
      model: flag("--model") ?? "local-model",
    })
  : anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY ?? "",
      model: flag("--model") ?? "claude-sonnet-5",
    });
if (!baseUrl && !process.env.ANTHROPIC_API_KEY)
  throw Error("Set ANTHROPIC_API_KEY, or pass --base-url for a local model.");

const adapter = new PlayerAdapter(engine);
const runs = flag("--out") ?? "runs";
mkdirSync(runs, { recursive: true });
const stem = `${runs}/${adapter.chronicle.header.id}`;

/** Written every turn, so a long run is readable while it is still going. */
const save = () => {
  writeFileSync(`${stem}.md`, adapter.chronicle.markdown());
  writeFileSync(
    `${stem}.jsonl`,
    `${adapter.chronicle.headerLine()}\n${adapter.chronicle.jsonl()}\n`,
  );
  writeFileSync(`${stem}-save.json`, JSON.stringify(engine.snapshot()));
};

const result = await playthrough(adapter, model, {
  days: number("--days", 1),
  maxTurns: number("--max-turns", number("--days", 1) * 60),
  onTurn: (note) => {
    process.stderr.write(`${note}\n`);
    save();
  },
});
save();
writeFileSync(`${stem}-journal.md`, result.journal.join("\n\n") + "\n");
writeFileSync(
  `${stem}-trajectory.json`,
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
process.stdout.write(
  JSON.stringify(
    {
      ...result,
      commands: adapter.trajectory.length,
      chronicleTurns: adapter.chronicle.turns.length,
      hash: engine.hash(),
      record: `${stem}.md`,
    },
    null,
    2,
  ) + "\n",
);
