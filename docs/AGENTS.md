# Agents

How a model, rather than a person, plays UHS: for playtesting, for open-ended
"leave it alone and watch" runs, and for experiments with many runs. This page
is the contract; `src/agents/` implements it.

## Shape

- **Core**, `src/agents/agent.ts`. `startAgent` prepares a world exactly as the
  start screen does and wraps the same `Runtime` the browser drives, so an
  agent keeps the rules a person keeps. `tools` is the only list of what an
  agent can do; everything below reads it.
- **Solo**, `npm run agent:serve`. An MCP server over stdio. The agent
  decides its own pace and keeps its own notes. The first tool call builds the world.
- **Playtest**, `npm run agent:play`. Drive the same tools from a terminal or
  a sequence of commands on stdin (JSON or plain shorthands). Runs offline with
  no API keys; add `--fast` for a single local map and `--record` (or `--out`)
  to save a replayable run folder.
- **Visual playtest**, `npm run shot -- --play`. Attaches the same `Agent` to
  the live browser game (offline by default) so a script or stdin stream can
  run game commands and capture screenshots (`shot <out.png>`) in one session.
- **Run**, `npm run agent:run`. The game drives a model itself
  (`src/agents/loop.ts`, `src/agents/providers.ts`). It works with models
  that cannot call tools: each turn the model replies with one JSON object
  naming a tool. Remote models and live environment calls require `--paid`
  and stop immediately at `--max-usd` (default `$1.00`).
- **Record**, `src/agents/record.ts`. Recorded runs write the same folder;
  `src/agents/viewer.ts` builds its `review.html`.

The scripts run under `vite-node`, not `tsx`: map travel loads its data with
Vite's `import.meta.glob`.

## Tools

| Tool | Does | Time |
|---|---|---|
| `look` | World facts (first time and after a change of world), the scene with ids and what each allows, news since the last look, cards waiting for an answer, ways out | none |
| `inspect` | One person, thing or building in detail, as a few readable lines | none |
| `goto` | Walk to an id or to x, y; one call is the whole walk | walking |
| `act` | One engine command: `interact`, `trade`, `give`, `use`, `wear`, `wait`, `sleep`, `choose` (answer a card), `become` (an heir) and the other player commands | varies |
| `say` | Ask the narrator a question or describe an attempt, through the same `Runtime.say` as the narration panel | depends on the answer |
| `talk` | Speak to any human NPC in reach: `target` id and optional `text`. No text requests an opening line. The same Luna dialogue context and effects as the browser | greeting / exchange |
| `errand` | `workday`, `forage`, `seek`, `go`, `roam`, carried on until done, stuck, or a card needs an answer | varies |
| `travel` | A way out from `look` (walks into the neighbouring map) or a place name (the whole journey, days pass) | travel |
| `time_travel` | Another year in this place, as a relative of the line. Off unless `--time-travel` | none |

Long scene ids are shown as short aliases (`p3` a person, `b2` a building,
`t5` a thing, `w1` a way out), stable for the run; any id field also takes the
plain name of something seen ("the well") when only one thing goes by it. The
trajectory records the real ids.

Every tool takes an optional `rationale`
(`intent`, `reasoning`, `expectation`). It is recorded and never read by the
engine. Every reply that changes the world starts with a status word
(`COMPLETED`, `ARRIVED`, `DONE`, `INTERRUPTED`, `REJECTED`, …), then what
happened, then the scene now.

The scene includes numeric health, hunger and fatigue, active illness and injury,
effective ability, and the same current/nearby danger assessment as the body
panel. Inventory entries include item ids for eating. Roadside encounters use
ordinary `act / choose` cards and interrupt errands until answered.

Only actions spend game time; time spent thinking between calls does not.

Narrator, NPC dialogue and crafting calls are **off by default** in all agent
and screenshot harnesses. Pass `--paid` (after asking permission) to load
`.env` and enable live `/api/narrator`, `/api/dialogue`, `/api/craft` and
`/api/jev` calls, all guarded by a shared USD spend cap (`--max-usd`, default
`$1.00`) in `src/agents/budget.ts`. When `--paid` is set, CLI narrator and
dialogue default to Luna (`gpt-6-luna`) using `OPENAI_API_KEY` (narrator
respects `UHS_NARRATOR_OPENAI_MODEL`). Their exact context builders, validation
and engine effects are shared with human play. People may refuse or leave; walk
within reach before talking. A conversation retains its transcript across
`talk`, `look` and `inspect`; another action closes it. `act` with `interact /
talk` also opens a Luna conversation. The acting model cannot use `narrate`
commands to invent items, facts or another person's reaction itself.

What the agent reads is kept in-world: it never names the project, the
experiment, or historical accuracy, and the world facts leave out the
setting's design notes and the full item catalogue. Breaking that is a bug.

## Running

Start a repeatable playtest in a terminal. Type `look` to see the scene,
`help` for available tools, and `quit` when done.

```bash
npm run agent:play -- --setting "Weaver in Oaxaca 1650" --seed playtest
```

Commands take either a tool name with a JSON object or a plain shorthand
(`l`, `goto b1`, `goto 12 -4`, `enter b1`, `wait 600`, `sleep`, `use water`,
`talk p1 Good morning`, `errand workday`, `choose <card> <n>`). For a scripted
run, use `--silent` so stdout contains only one JSON reply per command. Replies
include the status, scene text, and game clock before and after each tool call.
Add `--fast` to build only the starting map without neighbouring travel squares,
and `--record` (or `--out <dir>`) to write a replayable run folder. Open its
`review.html` or pass the folder to `npm run replay -- <folder>`.

```bash
printf '%s\n' 'look' 'wait 60' 'look' |
  npm run --silent agent:play -- --setting "tiny desert island 10x5 in 1944" --seed playtest --fast
```

To drive the live browser renderer with the same commands and take screenshots
along the way (offline by default):

```bash
printf '%s\n' 'look' 'shot artifacts/start.png' 'goto b1' 'enter b1' 'shot artifacts/inside.png' |
  npm run shot -- --play --setting "Weaver in Oaxaca 1650" --seed playtest
```

Extra browser commands in `--play`: `shot <out.png>`, `zoom <n>`, `at <x> <y> [space]`,
`key <k>`, `click <label-or-selector>`, and `eval <js>`.

`agent:play` accepts `--setting`, `--seed`, `--fast`, `--concern`, `--time-travel`,
`--record`, and `--out`. It uses the engine's dialogue and needs no API keys.

```bash
npm run --silent agent:serve -- --setting "Clerk in Lagos, 1925"
```

To give it to Claude Code: `claude mcp add uhs -- npm run --silent agent:serve`
(run from the repo root and add `-- --setting "…"` to choose the place).

```bash
ANTHROPIC_API_KEY=... npm run agent:run -- --setting "Weaver in Oaxaca 1650" --days 2 --paid --max-usd 1
```

| Option | Modes | Meaning |
|---|---|---|
| `--setting "<who, where, when>"` | all | Plain words, as on the start screen. Omitted: a random start, drawn as the start screen draws one |
| `--seed` | all | Fixes the world and the person |
| `--fast` | play, serve | Single local map (`createSettingSession`) without neighbouring travel squares |
| `--record` | play | Save a replayable run folder (also enabled whenever `--out` is passed) |
| `--time-travel` | all | Adds the `time_travel` tool |
| `--concern` | all | Show the start's stated concern ("A weaver's day in Oaxaca"), which an agent reads as a goal. Hidden by default |
| `--paid` | serve, run, batch | Opt in to paid remote LLM / narrator / dialogue calls (offline by default). Ask the user first |
| `--max-usd <n>` | serve, run, batch | Hard USD spend cap checked before every paid API call; default `1` (`$1.00`) |
| `--offline` | serve, run, batch | Keep narrator/dialogue offline even when `--paid` is used for a remote policy model |
| `--out <dir>` | all | Where run folders go; default `runs/` (ignored by git) |
| `--model` | run | Default `claude-sonnet-5-5`, or the local model's name |
| `--base-url` | run | Any OpenAI-compatible endpoint; key from `OPENAI_API_KEY` |
| `--briefing <file>` | run | Text added to the instructions. None by default |
| `--days`, `--max-turns` | run | When to stop; default one day, 80 turns a day |
| `--max-tokens` | run | Acting model output budget; CLI default 2048 (increase for models that spend tokens on reasoning) |
| `--temperature`, `--top-p` | run | Optional sampling controls; omitted uses the provider default |
| `--model-seed` | run | Optional OpenAI-compatible sampling seed; does not promise deterministic inference |
| `--structured` | run | Request JSON-schema output from an OpenAI-compatible server that supports it |
| `--no-rationale` | run | Omit the request for a declared reason and expectation; native model reasoning may still occur |
| `--repeat N` | run | N runs with the same options, each its own folder |

MCP and model-driven runs open with the same framing (`FRAMING` and `ASK_REASON` in
`src/agents/agent.ts`): MCP sends it as the server's instructions, run mode
puts it before its reply format. The manifest records the instructions given,
and in MCP mode the connecting host's name and version, since the host's own
prompt and scaffolding are part of the agent.

The built-in instructions say only how to reply and what each tool does.
Anything about how the person should behave belongs in a briefing, so it can be
varied and is recorded. Every turn includes current world and player facts and the tools' JSON schemas.
Memory also includes the person's diary and the last eight turns. The diary
is written at day's end, or about the day so far when a run stops early.

An OpenAI-compatible local server (including a served Qwen model) can drive
`--base-url http://localhost:8000/v1 --model <served-model>`. `--structured`
is opt-in because server support varies. No local Qwen weights are bundled.

## Experiments

`npm run agent:batch -- experiment.json` runs every agent × setting × seed
into `runs/<name>/`, one folder per run named `<agent>__<setting>__<seed>`.
The same seed gives every agent the same world and person.

```json
{
  "name": "pilot",
  "agents": [
    { "name": "luna", "model": "gpt-6-luna", "baseUrl": "https://api.openai.com/v1" },
    { "name": "sonnet", "model": "claude-sonnet-5-5" }
  ],
  "settings": ["Weaver in Oaxaca 1650", "Weaver in Manchester 1840"],
  "seeds": ["a", "b", "c"],
  "days": 3,
  "paid": true,
  "budget": { "usd": 1, "tokens": 2000000 }
}
```

Also `maxTurns`, `briefing` (a file beside the experiment file), `rationale`,
`paid`, `offline`, `concern` and `timeTravel`, as for `agent:run`. Runs go one
at a time. Running the command again skips finished runs; an interrupted or
failed run is renamed `.failed-<time>` and run again. The USD budget defaults
to `$1.00` (overridable with `budget.usd` or `--max-usd`) and is enforced before
every API request across the whole batch; `budget.tokens` is also checked
before each run starts. `summary.csv` and `summary.json` hold one row per run
with its metrics (including `costUsd`) and flags: `not-run`,
`unfinished`, `error`, `unusable-replies` (invalid), and `provider-errors`,
`stuck`, `died` (worth a look). MCP runs are started by hand; they write the
same folders.

## The run folder

`runs/<id>/`

- `manifest.json`: protocol, game commit and source fingerprint, resolved
  starting setting and seed, time travel flag, model settings, briefing,
  memory/rationale condition, how the run ended, and `metrics`: calls, calls
  that spent no game time, refused calls, tools used, game hours, places, and
  the person's health, hunger, fatigue and inventory at the end.
- `trajectory.jsonl`: one line per tool call, including rejected inputs:
  order, wall time, input, rationale, status, exact reply, game clock before
  and after, place/year, state hash, and player position, health, hunger,
  fatigue and inventory before and after, active illnesses/injuries, food deficit,
  effective ability and local danger. Diaries are `tool: "diary"`.
  `deeds` labels each engine command the call caused (kind, target, whether
  the target was the person's own, their household's or someone else's,
  whether it worked, and whether the agent or the narrator issued it).
  `verdict` is the narrator's ruling on a `say` attempt: `allowed`,
  `impossible`, `anachronistic` or `not-yours`.
  `researchHealth` separately contains hidden illness state and a bounded event
  history of exposure doses, infection sources, symptoms, treatment and outcomes.
  It is for analysis and never included in the policy's tool replies.
- `inferences.jsonl`: exact policy prompts and replies, parse failures and
  repairs, pre-action decisions, underlying engine commands, environment
  requests/replies, and raw provider bodies with inference settings, usage,
  native reasoning fields and latency when available. `turn` links a record
  to the trajectory entry it precedes. Request headers are omitted. In MCP
  mode the external caller owns its prompts; only the game's side is recorded.
- `chronicle.md`: a readable account, by day.
- `review.html`: open locally in a browser. Filter and select calls to see
  replies, rationale, state changes, underlying execution and model records;
  charts show the path within a map/space, player needs and danger across calls.
- `source.patch`, `source-files.json`: changes from the recorded commit and
  untracked source files, including an unfinished checkout's agent code.

The JSONL files append as events occur. Reasons and model responses are saved
before executing the selected action. A declared reason is a self-report,
not evidence that it faithfully describes a model's internal computation.

`npm run replay -- runs/<id>` replays without any model calls, checking each
reply, game clock and state hash. Narrator, dialogue and router responses are
reused and their requests must match exactly. `PROTOCOL` in `agent.ts` is the
current protocol; replay rejects older ones.

## Coverage

What a person can do and an agent cannot yet:

- Boarding a train (`travel` makes the journey overland).
- Follow and climb shortcuts the browser binds to keys; the same commands
  are reachable through `act`.

## Known limits

- NPC schedules are scripted. Their speech and reactions are independent Luna calls, not autonomous planning loops.
- Text the agent reads is in plain modern English, as the game's is.
- Retrying a call repeats the action: tool calls carry no idempotency key.
- An errand can pace between two cells; the core stops it after 300 ticks with
  nothing new and says so.
