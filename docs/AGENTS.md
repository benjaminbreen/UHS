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
  decides its own pace and keeps its own notes.
- **Run**, `npm run agent:run`. The game drives a model itself
  (`src/agents/loop.ts`, `src/agents/providers.ts`). It works with models
  that cannot call tools: each turn the model replies with one JSON object
  naming a tool.
- **Record**, `src/agents/record.ts`. Both modes write the same folder.

The scripts run under `vite-node`, not `tsx`: map travel loads its data with
Vite's `import.meta.glob`.

## Tools

| Tool | Does | Time |
|---|---|---|
| `look` | World facts (first time and after a change of world), the scene with ids and what each allows, news since the last look, cards waiting for an answer, ways out | none |
| `inspect` | One person, thing or building in detail | none |
| `goto` | Walk to an id or to x, y; one call is the whole walk | walking |
| `act` | One engine command: `interact`, `trade`, `give`, `use`, `wear`, `wait`, `sleep`, `choose` (answer a card), `become` (an heir) and the other player commands | varies |
| `say` | Ask the narrator a question or describe an attempt, through the same `Runtime.say` as the narration panel | depends on the answer |
| `talk` | Speak to any human NPC in reach: `target` id and optional `text`. No text requests an opening line. The same Luna dialogue context and effects as the browser | greeting / exchange |
| `errand` | `workday`, `forage`, `seek`, `go`, `roam`, carried on until done, stuck, or a card needs an answer | varies |
| `travel` | A way out from `look` (walks into the neighbouring map) or a place name (the whole journey, days pass) | travel |
| `time_travel` | Another year in this place, as a relative of the line. Off unless `--time-travel` | none |

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

Narrator and NPC calls are independent of the acting model. The CLI loads the
same `.env` files as the dev server and calls the same server handlers: Luna
(`gpt-6-luna`) by default, using `OPENAI_API_KEY`. The narrator respects
`UHS_NARRATOR_OPENAI_MODEL`. Their exact context builders, validation and
engine effects are shared with human play. People may refuse or leave; walk
within reach before talking. A conversation retains its transcript across
`talk`, `look` and `inspect`; another action closes it. `act` with `interact /
talk` also opens a Luna conversation. The acting model cannot use `narrate`
commands to invent items, facts or another person's reaction itself.

What the agent reads is kept in-world: it never names the project, the
experiment, or historical accuracy, and the world facts leave out the
setting's design notes and the full item catalogue. Breaking that is a bug.

## Running

```bash
npm run agent:serve -- --setting "Clerk in Lagos, 1925"
```

To give it to Claude Code: `claude mcp add uhs -- npm run --silent agent:serve`
(add `-- --setting "…"` to choose the place). It is not registered in the repo
by default, because it would start a world in every session.

```bash
ANTHROPIC_API_KEY=... npm run agent:run -- --setting "A potter in Jenne-jeno, 800 CE" --days 2
```

| Option | Both | Meaning |
|---|---|---|
| `--setting "<who, where, when>"` | yes | Plain words, as on the start screen. Omitted: a random start, drawn as the start screen draws one |
| `--seed` | yes | Fixes the world and the person |
| `--time-travel` | yes | Adds the `time_travel` tool |
| `--out <dir>` | yes | Where run folders go; default `runs/` (ignored by git) |
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

The built-in instructions say only how to reply and what each tool does.
Anything about how the person should behave belongs in a briefing, so it can be
varied and is recorded. Every turn includes current world and player facts and the tools' JSON schemas.
Memory also includes the person's diary and the last eight turns. The diary
is written at day's end, or about the day so far when a run stops early.

An OpenAI-compatible local server (including a served Qwen model) can drive
`--base-url http://localhost:8000/v1 --model <served-model>`. `--structured`
is opt-in because server support varies. No local Qwen weights are bundled.

## The run folder

`runs/<id>/`

- `manifest.json`: protocol, game commit and source fingerprint, resolved
  starting setting and seed, time travel flag, model settings, briefing,
  memory/rationale condition, and how the run ended.
- `trajectory.jsonl`: one line per tool call, including rejected inputs:
  order, wall time, input, rationale, status, exact reply, game clock before
  and after, place/year, state hash, and player position, health, hunger,
  fatigue and inventory before and after, active illnesses/injuries, food deficit,
  effective ability and local danger. Diaries are `tool: "diary"`.
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
reused and their requests must match exactly. Protocol 5 adds symptom observations,
validated `act {command:{type:"care",target:"player",treatment:"rest"}}` actions,
and separate research health state to protocol 4's bodily constraints and danger.
Earlier protocols are rejected explicitly.

## Coverage

What a person can do and an agent cannot yet:

- Boarding a train (`travel` makes the journey overland).
- Follow and climb shortcuts the browser binds to keys; the same commands
  are reachable through `act`.

`src/agents/webmcp.ts` is the older in-browser tool set (observe, inspect,
act). It is due to move onto the core with an in-browser experiment mode.

## Known limits

- NPC schedules are scripted. Their speech and reactions are independent Luna calls, not autonomous planning loops.
- Text the agent reads is in plain modern English, as the game's is.
- Retrying a call repeats the action: tool calls carry no idempotency key.
- An errand can pace between two cells; the core stops it after 300 ticks with
  nothing new and says so.
