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
| `*-themes.ts` | Regional and time-of-day pieces (`european-`, `african-`, `andean-`, `ancient-`, `modern-`, `neolithic-`, `south-asian-`, `dawn-`, `main-`, `noon-`, `afternoon-`, `overworld-`, `winter-train-theme.ts`) |
| `cultural-themes.ts` | `culturalMusic` (what a place and year may play) and `MusicRotation` |
| `situation-themes.ts` | Arrival, passing, timeslip, work, danger and combat cues; `threatMusic` decides danger or combat |
| `interior-themes.ts` | `interiorMusic` selects music by building use |
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
- Automatic play prioritizes dated regional pieces first, playing through all
  of them before falling back to a random mix of the shared and hour-of-day
  themes.
- Crossing a map edge does not interrupt the song.

**Situations.**
- Danger queues "Where the path grows quiet" once, in full.
- Being attacked interrupts with "Stand your ground", which loops until six
  seconds without a threat.
- Plot endings, time travel and death have their own cues.
- Entering a building can switch to its interior music.
- In a place of worship, hospital, school, magistrate’s office or covered bazaar, the automatic score fades so the room activity can be heard.

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
coloured by the finish (thatch swallows a step, plaster hands it back); hard
rooms and caves also return a few distinct early slaps. Outdoors is dry.

A footfall (`footstep` in `sfx.ts`) is the weight of the foot plus what the
surface adds: a click on paving, grit on bare rock, a slide on sand, a squelch
in marsh or rain-soaked ground, a hollow knock on boards. Indoors the room's
floor pattern picks the surface; underground it is rock.

`ambienceFor` builds beds from the scene: rain, wind, water or sea, town
murmur (louder on market day), hearth and insects. Indoors muffles the outdoor
beds. Rain follows `Weather.rain` (0–1), which comes and goes in showers by
climate. Thunder follows `Weather.storm`: live, `src/render/lightning.ts`
throws each strike and asks for its thunder (`thunder` in the director),
delayed by distance and cracking when close; offline renders roll it at random.
Hail (`Weather.hail`) adds a clatter of stones over the rain, and a dust storm
(`Weather.dust`) a hiss of blown sand; both beds are loops of many small rings
(`grainBuffer`), not filtered noise. A blizzard (`Weather.blizzard`) is the
wind bed at full strength, without the hush that falling snow puts on it.

Animal voices are in `wildlife.ts`, written sample by sample. Birds, owls and
frogs are individuals: each keeps its place and repeats its own song, and the
cast (`birdCast`) follows climate, woodland, town and coast. A dawn chorus is
more birds singing more often. Insects are loops: chirping crickets on a warm
night, a tree-cricket trill on a hot one, cicadas in the heat of the day.

The interface has its own quiet sounds (`interfaceClick` in `sfx.ts`, played
by `GameAudio.interfaceSound`). `App.tsx` picks one per panel as it opens: a
rising pair of notes for a conversation, a purse settling on the counter for a
shop or exchange (`purse` in `handling.ts`, in the setting's kind of money),
paper for the map, a pack for the inventory, tools on the bench for making.
Every button inside a dialog gets a soft tap from one listener in `App.tsx`,
with a rising or falling tick on quantity steppers. Sending a line in
conversation, a refused deal or order, and a finished or failed making each
have their own. So do a plot card arriving and a choice committed, each line
of the evening ledger and the seal that closes it, a year ticking by on the
years screen, notices by kind (`Toasts.tsx`: a warning, other news, a step
toward the life aim), and an interaction coming into reach (`KeyPrompt`). The
title and setup screens have no director, so `interfaceSound` in `director.ts`
plays these on a bare context there.

Money coming in (`pay` with `incoming`) climbs faster than money paid out and
lands on the rising figure; `App.tsx` plays it for wages and windfalls, and a
sale plays it itself. Coming in at a shop door rings a sprung bell from 1750
and rattles a bead curtain before (`shopDoor`). A person greets you in their
own voice as a conversation opens (`greet`).

Animals also answer the player (`GameAudio.call`, one voice from where the
animal is). A frog ribbits as it jumps away and plops into its pool, a
squirrel scolds from its tree, and crows, gulls and sparrows call when the
player puts them up or walks into them (`callOf` in `voices.ts`). Farmyard
and house animals answer the same way: hens, ducks, geese, sheep, goats,
cattle, pigs, horses, donkeys and cats, and a dog growls before it barks.

The player's body has sounds of its own (`bodily` in `sfx.ts`), played by
`BodySounds` (`src/render/body-sounds.ts`) from the engine's state. A serious
injury opens with the blow by kind (a crack for a bone, a hiss for a burn)
under the lament, and a town's murmur drops for a moment and comes back as
talk. A lame leg lands short and drags (`bodyStep`, which also adds the pull
of deep water and a full pack shifting). Trying what an injury forbids draws a
breath through the teeth; cracked ribs catch after a walk; a head injury dulls
everything heard until it is half mended (`GameAudio.daze`); having a bone set
and getting back the run or the climb each have a sound. Now and then: a
cough or a shiver when ill, a growling stomach, a yawn late at night, gusts in
a high wind, squeaking snow below -8 °C, water running off after wading,
children playing near, and keening in a house in mourning. Arriving in
another time has a rush of air under its music cue.

Institutional activity comes from the nearest awake person within earshot. A modern ward has linen, metal trays and occasional wheels. Earlier wards use cups and cloth. Classrooms and clerks’ rooms use the setting’s writing tools. A pottery stall has ceramic knocks and a draper’s stall has the rustle of cloth. Floor materials change the footfalls, and sounds soften across a doorway. An empty institution keeps its local outdoor ambience and room acoustics. The Audio studio’s **Weather & place** scenes include wards in Edo and London, a board school, a yamen office and a bazaar stall.

A worshipper’s activity supplies the sound inside a sacred building. A reader recites alone, a congregation answers together, and a temple attendant can strike a wooden block. The voices are wordless synthesis. During a scripture reading the dialogue toast carries the words, and the room mix follows the reader. Ordinary noon and afternoon mosque prayers are quiet. Washing at a courtyard basin or serving a meal has its own sound. Rain is audible in an open court and muffled under a roof. The Audio studio has examples from a parish nave, a mosque prayer hall and a Buddhist temple.

**Town street sounds** come over the murmur, chosen by period and size
(`townKindFor`):
- village: early or small places
- town: to 1830
- industrial: to 1920
- modern: after 1920

**The hours** are marked by what the local religion implies (`bellFor`):
- church bells from 600 CE in Christian towns, with a four-bell peal at 9 and noon on Sundays
- the wooden semantron at dawn and dusk in Ottoman-ruled Orthodox towns, 1450 to 1830
- temple bells at dawn and dusk where Buddhist
- Edo's time bells in Japan, 1600 to 1873: every second hour, three warning strokes then nine down to four
- the call to prayer at five fixed hours, louder at Friday noon
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
