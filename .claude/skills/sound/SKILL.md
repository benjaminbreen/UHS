---
name: sound
description: How to make, tune or review the game's sound - ambience beds (rain, wind, water, town, frogs, thunder), weather and climate sounds, roofs and interiors, and sound effects in src/audio/. Load before changing ambience.ts, sfx.ts, the weather's sound, or when asked to make anything sound better. Covers the listening loop, since Claude cannot hear.
---

# Sound

You cannot hear. Do not tune a sound by reading its code and guessing; that
is how rain ended up as one band-passed white-noise loop. Use the loop below,
and treat the user's ears as the final judge.

## The loop

1. **Describe the target in a scene.** `src/audio/ambience-scenes.ts` holds
   the listening scenes: a game `Scene`, a one-line description of what it
   should sound like, and the field recordings it should resemble. Add a scene
   before you work on a sound that no scene covers. Add a recording to
   `references` with its licence; Wikimedia Commons is searchable
   (`list=search&srsearch=<words> filetype:audio&srnamespace=6`) and its API
   gives the licence (`prop=imageinfo&iiprop=url|extmetadata`). Avoid files
   over ~50 MB. Recordings are review material, never shipped.
2. **Render and look.** `npm run audio:ambience -- <scene...>` renders the
   scene offline through the live engine (`renderAmbience`), writes
   `artifacts/audio-review/<scene>.wav`, and draws `<scene>.png`: the
   synthesis's spectrogram above each recording's, with the measures. Read the
   PNG. No dev server needed; ~5 s a scene.
3. **Score with CLAP** when the question is "does this read as the thing at
   all": add `--clap`. Watch the decoy column. If the nearest decoy is static,
   frying or applause and it scores near or above the scene's own description,
   the sound reads as noise. CLAP cannot rank shades of rain: real recordings
   rank no better than synthesis among the scene descriptions, so do not chase
   rank.
4. **Hand it to the user.** The Audio studio (Cmd+1) has a **Weather &
   place** tab: each scene plays live in the game's engine with sliders, next
   to its recordings, and verdicts land in
   `artifacts/audio-review/verdicts.jsonl`. Read that file at the start of a
   sound session; it is what the user thought last time.

## What the measures mean

- **bands** `<300 / 300–1.5k / 1.5–5k / >5k` as % of energy. Recorded rain
  sits mostly in 300 Hz–5 kHz and has little above 5 kHz (some of that is the
  recordings' codecs). Recordings' <300 share is often wind and mic rumble, so
  don't copy it.
- **centroid**: where the energy's centre is. Recorded rain sits around 1–2.5 kHz.
- **flatness**: 1 is white noise. High flatness with a narrow spectrum is the
  "static" sound.
- **swell**: dB the level moves second to second. Zero means a dead loop;
  recordings move 1–4 dB.
- **grain** and **drops/s**: how spiky the texture is. These are rough;
  read the spectrogram's vertical streaks too.
- **rms** of the synthesis is the real in-game level. The recordings' levels
  are arbitrary.

## Rules learned so far, and why

1. **Build textures from many small events, not filtered noise.** `scatter()`
   in ambience.ts lays thousands of grains (a tick, a ringing ping, a bubble)
   into a seamless loop. Filtered white noise reads as static, the
   failure CLAP flags.
2. **No narrow band-pass on a texture.** It leaves a tonal stripe in the
   spectrogram and reads as hiss. Shape with a low-pass and a gentle high
   shelf; let the grain set the colour.
3. **Intensity changes the kind of sound, not just its volume.** A drizzle is
   sparse distinct drops and a fine wash; a downpour adds a dense layer, a
   low roar. Each has its own bed, with gains ramped on `rain`.
4. **Nothing is steady.** Rain comes in sheets (two slow, unrelated LFOs on
   the rain bus). A level that never moves sounds like a loop.
5. **What it falls on is the climate.** Surface comes from ecology and town
   (`surfaceFor`): leaves, needles, grass, bare ground, paving. Indoors, the
   roof (thatch thud, tile tick) is heard in the room, unmuffled; the outdoor
   rain is muffled behind it.
6. **Signature voices make a place.** Tree-frog whistles in tropical rain,
   croaks on a temperate summer night, thunder only in warm heavy rain. One cheap one-shot often says more than
   another bed.
7. **Loudness is relative to the music.** `mix.music` ducks the score: a
   drizzle leaves it alone, a downpour takes the stage (the Stardew habit).

Weather drives all of this through `Weather.rain` (0–1, per climate and hour,
in `src/core/weather.ts`), which also sets the visible rain's density.

## Rejected by ear

- **Drips and bubbling runoff** (2026-11-07). Loud tree drips and a "plink"
  bubble layer looked plausible in the spectrograms but sounded like
  distracting dripping in a tropical rain at night. Check any one-shot that
  repeats every second or so at its in-game rate, not just in a render.

## Not yet done

Wind, water, town and fire beds are still filtered noise loops from before this
loop existed; they want the same treatment. The decision on recorded samples
for some beds (versus synthesis) is still open with the user.
