# Classroom mode: one world, many students

Status: plan, September 30, 2026. Nothing here is built except what "Already
there" lists.

## The claim

Thirty students in one seeded world at the same time is a rewrite: the engine
has one `player`, one `randomCounter` for every roll, loads NPCs and animals
round that player's position, and stores each NPC's trust toward "the
player". The server is Vercel functions and Postgres with no realtime channel.
Do not build that.

Thirty students each alone in the *same* world, with every run pooled for the
instructor, is mostly built. That is the classroom mode. It gives Rashomon
across students for free: everyone saw the same street on the same morning
and did something different, and the instructor can replay any of them.

## Already there

- Determinism. `Engine.rng` draws from `random(seed, "simulation", purpose,
  randomCounter++)`; the counter is saved. No `Math.random` or clock in
  `src/core`. Idle time becomes a logged `pass` command.
- Model output is stored, not regenerated: dialogue and narrator turns land
  in the log as `converse` and `narrate` commands, so a replay never calls
  Luna.
- The edu recorder (`src/edu/recorder.ts`) posts `world`, `command`, `text`,
  `note`, `selection` and `dialogue` events to `/api/edu`, stored in Neon
  Postgres (`server/edu-store.ts`, `server/edu.sql`), one class code per
  deployment, one teacher token.
- Replay: `Runtime.loadReplay`, `stepReplay`, `seekReplay`, `branchReplay`
  rebuild the world from the manifest and re-run `engine.act()` with hash
  checks. The teacher page already exports a replay file.
- Same setting and seed on two machines give the identical world with no
  model call, as long as `PREPARED_VERSION` and the generator versions match.

## What to build

1. **Pinned starts.** A class assignment is a `WorldSetting` plus a seed, not
   a prompt. Add `?assignment=<id>` to `src/ui/Splash.tsx` that fetches the
   setting from `/api/edu?view=assignment`, skips `randomStart` and the
   world-weaver, and starts the recorder. The teacher page gets a form that
   turns a prompt into a setting once (calling the weaver if needed), then
   freezes it with a seed. Do not let a student's client draw a seed from
   `crypto`.
2. **Versions in the run.** Record app version, `PREPARED_VERSION` and the
   generator version in the `world` event. A replay refuses a mismatch with a
   clear message rather than drifting.
3. **Replay across worlds.** Map and time travel swap the engine and today
   only a `world` manifest is recorded, so the teacher's replay stops at the
   first world. Record a `carryover` event holding the carried player and the
   new manifest at each `Runtime.replace`.
4. **Pin the last randomness.** `src/runtime/autopilot.ts` uses `Math.random`
   at two places when picking walk targets. Route them through `engine.rng`.
5. **Per-class tables.** `edu_sessions` gets an `assignment_id`; a class is
   still one deployment and one code. Multi-class accounts are later, if
   ever.
6. **The instructor view.** For one assignment: a table of runs (student,
   sim time reached, commands, distinct places visited, people spoken to,
   final `stateHash`), a click to replay any run in the game, and a
   side-by-side where two runs are scrubbed to the same sim minute. Scenario
   mode later adds "which pinned beats did this student witness".
7. **Exports.** The JSONL and CSV the teacher page has, plus one file per run
   in the replay format, so a researcher can re-run all of them headlessly
   with `scripts/headless.ts`.

Rough size: items 1 to 5 are a few days; 6 is the real work and can grow as
teaching needs it.

## Later, and only if wanted

- **Ghosts.** After the fact, other students' recorded paths can be drawn
  into a replay as translucent walkers: everyone's morning on one map. This
  is playback of logs, not networking, and is the cheapest thing that feels
  multiplayer.
- **Turn-based shared scene.** If a truly shared room is ever wanted, the
  honest design is a hot-seat or turn-order scene run by one engine on one
  machine (or one server process), with each student's client a thin view
  sending one command at a time. That is a new runtime, not an extension of
  this one.

## Research use

A run is a manifest plus a command log with hashes, so a study is a directory
of runs plus a script. Nothing about a student is in the log except what they
typed; keep it that way, and keep the class code the only identity.
