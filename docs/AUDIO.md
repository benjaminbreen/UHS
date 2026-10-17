# World soundtrack

## In-game selection

All score modules feed the in-game player and Audio studio. A setting selects
pieces by culture and inclusive soundtrack years. These are playback windows
for compatible musical textures, not the lifespan of the named polity or a
claim that the anchor ensemble existed everywhere in that family. Living
traditions remain eligible through the game's present (2026); contemporary
sounds do not enter ancient settings. Hawaiʻi and the Ethiopian highlands use
their regional music family even where the gazetteer label differs.

Automatic playback starts with a dated regional piece when available, then
alternates regional music with the five seasonal/travel compositions and three
deliberately shared themes. “Where the horizon leads” is a five-minute original
orchestral roaming theme, eligible in every culture and era. Each group exhausts
its songs before repeating, with no immediate repeat. Settings without a regional match use the
shared rotation. Manual selections remain available in the studio.

Open **Audio studio** with **Command+1** (Mac), **Ctrl+1**, the music-note button in the header, or Settings. Click **Listen** to enable browser audio. Closing the studio keeps music playing on the map. Escape closes it. Opening the studio stops walking, and its controls cannot advance simulation time.

## The original pieces

| Theme | Character | Initial listening copy |
| --- | --- | --- |
| The first green | Spring; hopeful D-major melody over spacious extended chords | `public/audio/previews/first-green-day-pastoral.mp3` |
| Fields of long light | Summer; warm G-major horizon, answering high phrases | `public/audio/previews/long-light-dusk-pastoral.mp3` |
| The amber road | Autumn; E-minor walking song with Dorian color | `public/audio/previews/amber-road-day-pastoral.mp3` |
| Lanterns in the snow | Winter; suspended A-major/F♯-minor lullaby | `public/audio/previews/snow-lanterns-night-pastoral.mp3` |
| The road remembers | Recurring travel theme; rising fifth and answering descent | `public/audio/previews/remembered-road-day-pastoral.mp3` |

The travel theme also has chamber and electronic listening copies in the same directory. These are original, code-authored musical sketches inspired by the melodic warmth and atmosphere of classic role-playing and pastoral games; no game melodies, samples, soundfonts, or external services are used.

Each composition is 32 bars of 4/4, with A / A′ / B / A″ phrasing, an authored eight-bar contrasting section, arpeggiated harmony, bass, occasional countermelody and restrained percussion. Rendered lengths vary from about 80 seconds to 2½ minutes. The musical source is editable notation rather than a baked audio file.

## Musical contexts

All four seasons × dawn/day/dusk/night have two choices: that season’s theme and the recurring travel theme. These are **32 context/track combinations based on five compositions**, not 32 unrelated songs. The three orchestration profiles expand this to 96 combinations. Dawn/night are slower and sparser; dusk relaxes the tempo; summer adds light offbeat texture. In pastoral night arrangements, bells carry the tune.

**Follow world clock** updates season and time and alternates the two pieces at the end of each performance. Manual season/time choices disable following. Manually choosing an era or a track leaves the follow preference intact. Without following, the selected piece repeats. Changes fade between performances, and changing the orchestration restarts the tune for comparison. Pause retains position; Stop resets it. Hidden tabs pause and resume on return. Audio never changes the physical world, replay hashes, or saved game.

The soundtrack's temporary calendar starts in spring and uses four 28-day seasons. Dawn is 05:00–08:00, day 08:00–17:00, dusk 17:00–20:00, and night otherwise. This is an explicit audio-only placeholder until the historical calendar and regional seasons are defined. The two existing historical packs do not yet select different cultural instrumentation.

## Era and culture groundwork

- `src/audio/score.ts`: theme identity, pitches, beat durations, harmony, phrase structure, context choices and arrangement profiles. Melody pitches/rhythms remain identical across the three era previews; tempo and instrumentation change.
- `src/audio/synth.ts`: original synthesized instrument bank, stereo placement, note envelopes, reverb/echo, SFX and offline WAV rendering.
- `src/audio/director.ts`: audio lifecycle, transport, bounded look-ahead scheduling, transitions, independent music/SFX gains, mute, stem levels and world-context selection.
- `src/dev/AudioLab.tsx` and `src/dev/audio-lab.css`: listening studio, melody visualization, context and ensemble controls, export and SFX auditions.

The three previews are pastoral pipe/plucked strings/drum, a bowed chamber-ensemble study, and gentle FM electronics. They are sketches, not reconstructions of specific ancient or Renaissance ensembles. For future cultural/era work, keep the theme IDs and source phrases stable; add culture/era profiles that map score roles to historically appropriate instruments, tuning, ornaments, rhythmic patterns and performance rules. Instrument recordings or a higher-quality renderer can replace the synth without rewriting the compositions. An actual four-part Renaissance treatment will need voice-leading work beyond swapping a lead timbre.

## Sound and export

The studio has separate music/SFX volume, global mute, and melody/harmony/bass/percussion levels. Volume and mute preferences persist locally; transport does not autoplay after reload. Stem settings and current musical context are transient. The studio's SFX tab auditions the whole `sfx.ts` catalog.

**WAV** renders the selected score and stem mix as stereo 44.1 kHz / 16-bit PCM, independent of listening volume and mute. It includes a four-second release/reverb tail; it is a complete listening export, not a pre-trimmed loop asset. Rendering is offline and may take several seconds. Loud renders are attenuated to retain headroom. Live playback uses a master compressor and short fades.

With Vite running, rebuild all seven compact listening copies using:

```sh
npx tsx scripts/render-audio.ts
```

The authoring script requires Chrome and `ffmpeg`, writes full WAV masters under `artifacts/audio/`, compact MP3s under `public/audio/previews/`, and a signal/metadata manifest beside them. Neither Chrome nor ffmpeg is needed to play music or export WAVs inside the app. Override the server with `AUDIO_BASE_URL` or Chrome executable with `CHROME_PATH`.

```sh
npx vitest run tests/audio.test.ts
npm run build
```

Score tests validate all 96 combinations, phrase durations, pitch/event bounds, calendar boundaries and melodic identity across eras. Browser checks cover transport, gain controls, SFX, WAV download, both keyboard shortcuts, modal input isolation and narrow layouts. The preview renderer checks each actual waveform for non-silence and clipping and records peak/RMS in its manifest. Final musical taste and historically specific performance remain listening/authoring decisions.

## World sound

Sound effects are built in code (`src/audio/sfx.ts`, `handling.ts`, `time.ts`) and played from the world through `gameAudio()?.sound(sound, key, pan)`: footsteps by ground, strikes and tool work by material, climbing and landing, projectiles, eating, paying, writing, doors, bumps, fire and trains. `key` throttles repeats; `pan` (-1 left to 1 right) places a source off to one side, and fire and trains use it.

Every effect then passes through `Room` in `src/audio/ambience.ts`. Indoors it adds an echo sized by the room the player stands in and coloured by the house's finish: a hide or thatch hut swallows a step, a plastered hall hands it back. Outdoors it is dry.

`ambienceFor` turns the scene into the ambient mix. Beds: rain, wind, birds, crickets, water or sea swell, a town murmur and a hearth. Indoors the outdoor beds are muffled, and rain is also heard on the roof: thuds on thatch, ticks on tile.

Over the town murmur come occasional street sounds, chosen by period and size (`townKindFor`):

| Street | When | Sounds |
| --- | --- | --- |
| village | before 2500 BCE, or any small settlement | dogs, hens, calls, a quern, chopping |
| town | to 1830 | dogs, hens, calls, an anvil, hooves, cart wheels |
| industrial | to 1920 | calls, an anvil, hooves, wheels, a distant steam whistle |
| modern | after | dogs, calls, car horns, engines |

The hours are marked by what the local religious building implies (`bellFor`, from `religiousProfile`): church bells counting the hour in Latin Christian towns from 600 CE, a temple bell at dawn and dusk where Buddhist, the call to prayer at five fixed hours where Muslim, and a factory whistle from 1850 where no faith sounds. They carry about 90 tiles from town, and ring only when the clock walks through the hour, not when it is slept or travelled past. These pairings are inference, not documented soundscapes; prayer hours are fixed rather than solar.

## Accepted cultural-content direction

The [main design, section 20](UHS_DESIGN.md#20-cultural-content-families-and-dated-local-profiles), now records the twelve reusable content families and required dated local profiles. Family identity, historical date, technology and local seasons are separate selections; none of that resolution is implemented by the current three era-preview buttons. Future profiles should retain recognizable themes while choosing justified instruments, tuning, ornament and rhythmic treatment. A panpipe/drum texture is not a universal ancient-world sound, and technological change does not force all music toward electronics.

The current 28-day/four-season cycle cannot establish an appropriate calendar for Melbourne or Java. A future regional seasonal profile must define the relevant timing and its mapping to musical moods before automatic following is presented as geographically appropriate. The [recommended next work](PROGRESS_ARCHIVE.md#recommended-next-milestone-dated-local-content-profiles) also includes connecting selected SFX to actual successful world actions within a concrete playable slice.
