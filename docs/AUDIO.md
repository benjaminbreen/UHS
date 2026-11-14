# Audio

The game's music, sound effects and ambience. Everything is synthesised in
code under `src/audio/`; no recordings, samples or soundfonts are used. For
making or tuning a sound, load the `sound` skill.

## How it fits together

| File | Owns |
|---|---|
| `director.ts` | Lifecycle, scheduling, transitions, gains, and choosing what plays from the world. `gameAudio()?.sound(sound, key, pan)` is how the world plays an effect |
| `score.ts` | `compose()` turns a theme id into notes, across all three music formats (below) |
| `layered-themes.ts` | The `LayeredTheme` format and the registry, `layeredThemes`. It is bulk content; read a range, not the whole file |
| `*-themes.ts` | Regional and time-of-day pieces (`european-`, `african-`, `andean-`, `ancient-`, `modern-`, `neolithic-`, `south-asian-`, `main-`, `noon-`, `afternoon-`, `overworld-`, `winter-train-theme.ts`) |
| `cultural-themes.ts` | `culturalMusic` (what a place and year may play) and `MusicRotation` |
| `situation-themes.ts` | Arrival, passing, timeslip, work, danger and combat cues; `threatMusic` decides danger or combat |
| `interior-themes.ts` | `interiorMusic`: music by building use and faith |
| `synth.ts`, `synth-worker.ts` | Instruments, effects, offline WAV rendering |
| `sfx.ts`, `handling.ts`, `time.ts`, `voices.ts`, `sfx-tuning.{ts,json}` | Effects: steps, strikes, tools, handling, eating, doors, fire, trains, beasts and voices |
| `ambience.ts` | `ambienceFor` (the ambient mix), `Room` (indoor echo by room size and finish), `surfaceFor`, `townKindFor`, `bellFor` |
| `ambience-scenes.ts` | Listening scenes with their field-recording references |

## Music

**Selection.**
- A setting picks pieces by culture and an inclusive year window: a window of
  compatible musical texture, not the lifespan of a polity. Living traditions
  stay eligible to the present. Contemporary sounds never enter ancient
  settings.
- Automatic play starts with a dated regional piece when there is one, then
  alternates regional music with the shared and time-of-day themes. Each group
  plays through before repeating.
- Crossing a map edge does not interrupt the song.

**Situations.**
- Danger queues "Where the path grows quiet" once, in full.
- Being attacked interrupts with "Stand your ground", which loops until six
  seconds without a threat.
- Plot endings, time travel and death have their own cues.
- Entering a building can switch to its interior music.

**Adding music:** write a `LayeredTheme` in the regional `*-themes.ts` file
and add it to that file's exported list, which `layered-themes.ts` gathers.
Give it a culture and year window. A layered theme is loops of
`"pitch:beats"` tokens per voice and stem, with entries, exits, fades, echo and
drift.

**Legacy, do not extend:**
- The five original 32-bar pieces in `score.ts` (`Theme`, with the `Era`
  orchestrations pastoral, chamber and electronic). Their season and time
  calendar is a fixed 28-day placeholder.
- `CulturalTheme` in `cultural-themes.ts`.

Both still play. Folding them into the layered format is welcome when you are
working on music.

## Sound effects and ambience

Effects pass through `Room`. Indoors, it adds an echo sized by the room and
coloured by the finish (thatch swallows a step, plaster hands it back).
Outdoors is dry.

`ambienceFor` builds beds from the scene: rain, wind, birds, crickets, frogs,
water or sea, town murmur and hearth. Indoors muffles the outdoor beds. Rain
follows `Weather.rain` (0–1), which comes and goes in showers by climate.
Thunder and frog calls are separate sounds.

**Town street sounds** come over the murmur, chosen by period and size
(`townKindFor`):
- village: early or small places
- town: to 1830
- industrial: to 1920
- modern: after 1920

**The hours** are marked by what the local religion implies (`bellFor`):
- church bells from 600 CE in Latin Christian towns
- temple bells at dawn and dusk where Buddhist
- the call to prayer at five fixed hours
- a factory whistle from 1850 where no faith sounds

These pairings are inference, not documented soundscapes.

## Studio and checks

- **Audio studio** (`src/dev/AudioLab.tsx`) opens with ⌘1 / Ctrl+1, the
  header's music-note button, or Settings. It plays any piece with stem levels
  and exports WAV.
  - The SFX tab auditions `sfx.ts`.
  - **Weather & place** (`AmbienceTab.tsx`) plays each ambience scene beside its
    field recordings and saves verdicts.
  - `AudioTuningTab.tsx` tunes effects into `sfx-tuning.json`.
- `npm run audio:ambience` renders the listening scenes offline with
  spectrograms beside the references. `--clap` adds CLAP scores, which need
  torch and transformers in `.venv`.
- `npx tsx scripts/render-audio.ts` rebuilds the MP3 previews in
  `public/audio/previews/`. It needs Vite running, Chrome and ffmpeg.
- `tests/audio.test.ts`.

Audio never changes the world, replay hashes or saves.
