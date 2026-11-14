# Classroom mode

An opt-in teaching entry point. Each student plays alone, and every run is
recorded for the teacher. Entry files: `src/edu/EduMode.tsx`,
`src/edu/recorder.ts`, `server/edu.ts`, `server/edu-store.ts`.

## What exists

- **Routes.** `/edumode`: the student enters a name and the class code, sees
  what will be recorded, and starts. `/edumode/teacher`: timelines for each
  student, with exports (`EduTeacher` in `EduMode.tsx`).
- **Recorder.** `EduRecorder` posts events to `/api/edu?view=events`. The
  kinds are `world`, `command`, `text`, `note`, `selection` and `dialogue`.
- **Storage.** Postgres through `server/edu-store.ts`, with the schema in
  `server/edu.sql`. One class code and one teacher token per deployment.
- **Setup.** Set `DATABASE_URL`, `UHS_EDU_CLASS_CODE` and
  `UHS_EDU_TEACHER_TOKEN` on the server. Without all three, the mode reports
  itself as unconfigured.
- **Replay.** A run is a manifest plus a command log with hashes.
  `Runtime.loadReplay`, `stepReplay`, `seekReplay` and `branchReplay` rebuild
  it. Model dialogue and narration are stored as `converse` and `narrate`
  commands, so a replay never calls a model. `npm run replay` runs one
  headless.
- **Determinism.** The same setting and seed give the same world on any
  machine, as long as `PREPARED_VERSION` (`src/world/v3/prepared.ts`) and the
  generator versions match. See [ARCHITECTURE.md](ARCHITECTURE.md).

Thirty students in one shared live world would be a new runtime: the engine
has one player and one random counter. Thirty students alone in the *same*
seeded world, pooled for the teacher, is the design.

## Not built yet

1. **Pinned starts.** A class assignment as a `WorldSetting` plus a seed,
   fetched by `?assignment=<id>`. Today `src/ui/Splash.tsx` draws a fresh seed
   with `crypto.randomUUID()` unless `?seed=` is given.
2. **Versions in the run.** Record the app version, `PREPARED_VERSION` and the
   generator version in the `world` event, and refuse a mismatched replay.
3. **Replay across worlds.** Map travel and time travel swap the engine, but
   only the first `world` manifest is recorded. A `carryover` event at each
   `Runtime.replace` would fix it.
4. **The last randomness.** `src/runtime/autopilot.ts` still uses
   `Math.random` for walk targets. Route it through `engine.rng`.
5. **Assignments per class**, and an instructor view: a table of runs, a
   click to replay, and two runs side by side at the same minute.

## Privacy

Nothing about a student is in the log except what they typed and the name
they entered. Keep the class code as the only identity.

## Checks

`tests/edu.test.ts`, `tests/browser/edumode.spec.ts`.
