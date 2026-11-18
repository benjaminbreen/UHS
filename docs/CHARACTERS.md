# Characters

How people are generated, dressed, drawn, animated and shown. The key entry
points are:
- `src/content/characters/generate.ts`: who a person is
- `src/content/characters/wardrobe/`: what they wear
- `src/render/characters/doll/draw.ts`: the world sprite
- `src/render/portraits/sculpted.ts`: the bust
- `src/ui/CharacterPanel.tsx`: the profile

## Generation pipeline

Players, settlement adults and household members all come from one
deterministic pipeline in `src/content/characters/`. It makes no model calls.

| File | Owns |
|---|---|
| `context-types.ts` | The small flat content contracts |
| `profiles/names.ts`, `name-kits.ts`, `profiles/*-names.ts` | Naming samples; `name-kits.ts` only assembles regional modules |
| `profiles/communities.ts` | Community scenarios and appearance kits (`AppearanceKit`), including adornment pools |
| `livelihoods.ts`, `livelihoods.generated.ts` | Livelihoods and their activity and supply kits |
| `outlaws.ts`, `city-work.ts` | Authored livelihoods beside the ported tables: robbers; office staff and bar staff. `city-work.ts` also holds `jobGrades`, the ladder an office ran on (Junior Broker, Senior Partner, Section Chief), drawn by age in `graded` (`generate.ts`); the livelihood id stays the same, the label and rank change |
| `resolve.ts` | Selection by year, geographic box, culture and community (`matchesCharacterScope`) |
| `validate.ts` | Reference and evidence checks on load. Equal-specificity conflicts fail rather than depending on file order |
| `generate.ts` | Independent seeded streams per world seed, actor and purpose, so changing a role never rerolls a face or a name |
| `invented-name.ts` | Invented names where no naming kit covers a place, labelled "Invented name" in game |

- **Provenance.** `Actor.origin` records the community, naming kit, livelihood
  and qualifications used.
- **Employment.** Once buildings, fields, pens and venues are placed,
  `src/world/v3/employment.ts` reconciles resident occupations with the work
  actually available, and gives each worker a real destination. No mine, mill
  or hospital is invented to employ someone.
- **Names.** Name kits declare their format (`personal`, `personal-family`,
  `personal-patronymic`, and others). A patronymic is never inherited as a
  family name, and custom names are never split. Children take components from
  their actual parents.
- **Revision pins.** New worlds pin `characterRevision`, `namingRevision`,
  `beliefRevision` and `employmentRevision` in the setting
  (`src/content/geography/defaults.ts`). Settings without them take older
  paths. Extend the pinned path only.

**To extend:** add a scoped kit or profile to the relevant subject file, with
exact applicability, evidence status, sources and limitations. Reuse appearance
and livelihood definitions rather than copying a whole character per era.
Scopes AND across fields, OR within lists, and use half-open year ranges.
Palette and frequency weights are art direction, not demographic estimates.
Community never determines personality or skill.

## Wardrobe

`wardrobeFor` (`src/content/characters/wardrobe/index.ts`) dresses a person
from their region, date, livelihood and means (`meansOf`). It draws from:
- `kits.ts` and `regions/*.ts`: dated kits per culture region
- `regions/work-dress.ts`: aprons, bags, neckwear, keyed on livelihood
- `regions/layers.ts`: waistcoats, shawls, hoods
- `regions/sidearms.ts`
- `regions/headdress.ts`: hair ornaments, hat trims
- `regions/embroidery.ts`: trim patterns
- `regions/street.ts`, `guards.ts`, `rulers.ts`, `special.ts`: dress for those
  roles

Kits choose cuts, fronts, fibres and colours; each slot can carry its own
restrictions. Eighteenth-century Europe is the worked example of period
dress built from shared parts (`eu-18c-suit`, `eu-18c-gown` in
`regions/europe.ts`, `court-georgian` in `regions/special.ts`): a coat with
`cut: "full"` is skirted, `wrist: "cuffs"` and `"ruffles"` finish a sleeve,
`leggings: "breeches"` shows stockings and buckled shoes, and
`silhouette: "pannier"` opens a gown over its petticoat.

The shared clothes of the present are in `regions/contemporary.ts`: T-shirts
(`motif: "tee"` and `"graphic"`), `leggings: "jeans"` and `"shorts"`, a zipped
`waistcoat: "jacket"`, printed dresses (`motif: "floral"`) and
`bag: "backpack"`. Each kit carries a `share`, so in every place some people
wear the whole look and the rest keep the region's dress; the share is lower
where regional dress holds. Future dress (`futureDress`) starts in 2040. Explicit appearance recipes always win. `wardrobes.ts` is a
re-export shim.

## The world sprite

There is one sprite renderer, `drawCharacterG`, the paper doll in `doll/`
(`draw.ts`, `head.ts`, `paint.ts`, `extras.ts`). The scene draws it in a worker
(`worker.ts`), the panel and labs call it directly.
- **Rig.** About a dozen joints in body space, turned to eight facings and
  projected onto the native grid, so nothing is resampled. The adult is 40px,
  and the head is over a third of that.
- **Parts.** Every part is a pixel mask at final size. `paint.ts` records a
  material and one of five tones per pixel; colour comes from `ramp()` at the
  end.
- **Wardrobe as rules.** Garments, hair, beards and headwear are rules over the
  joints, so a new kit item works in every facing and pose.
- **Fibre and wear.** Silk takes a sheen, fur takes pale tips. Worn cloth
  frays, and fine cloth is embroidered.
- **Faces.** It draws the face's `adornment` and `injuryScar`.
- **Motion.** Cloaks, sashes, braids and scabbards trail the stride.
- **Actions** are keyframes in `doll/draw.ts` (`actions`): jump, land,
  stumble, hurt, climb, roll, the tool families (chop, dig, rake, sickle,
  scythe, thrust, throw, stick, cast) and the work motions.
- **Idle.** NPCs pick idle gestures by temperament (`WorldScene.idleGesture`)
  and breathe at idle (`WorldScene.poseFrame`). Elders stoop.
- `poses.ts` holds the shared pose list and `heldFrame` timing.
- `world.ts` caches composed frames per scene.
- `v2/pixels.ts` holds the ramps and sprite light the doll paints with.
- `props.ts` draws held objects.
- `shadow.ts` projects the whole pose onto the ground.

Resting expressions come from stats through `restingExpressionOf`
(`src/core/persona.ts`); hurt and startle override them. `soft` is a half
smile, one corner of the mouth lifted. Most people look straight out, the
whites of the eyes outboard; the most anxious quarter (`sidelongOf`) look
aside when facing the viewer, both whites on the lit side. On a turned head
both whites sit ahead of the pupil.

Over the resting face the scene passes a passing one (`WorldScene.feeling`):
the mood of the line just spoken in conversation, a smile or a hard look for
the player standing near by trust, and a worried face when ill.

## Portraits

`src/render/portraits/sculpted.ts` draws the bust the game shows
(`src/ui/CharacterSprite.tsx` calls `drawSculptedPortrait`). It matches the G
sprite's clothes and colours through `clothColours`. Both use the worn face veil,
outer wrap, neckwear and ornaments. The portrait draws the wrap over the
shoulders and the face veil over the animated mouth. Fitted coats show a shirt
front, folded collar points and lapels. A worn necktie sits under the collar
and disappears behind the waistcoat.
- **Expressions.** `constructed.ts` names the twelve expressions, the blink
  frames and the speaking mouth (`visemeFor`). The bust's `SHOWN` table turns
  each expression into brow, lid and mouth offsets, scaled by `intensity`, over
  the person's `restingPose`.
  - Blinking and speech run on their own clocks. The mouth curves around the
    jaw and opens widest at the centre. The nose profile sets the bridge,
    tip and nostril positions in both views.
- **Mood in dialogue.** In conversation the NPC wears the `mood` the model
  chose for its own line, a field of the dialogue reply beside `regard`. Only
  `regard` moves `actor.trust`.
- **Faces vary independently.** Eye shape, nose profile (nine shapes),
  brow connection, eye alignment and detail, injury scars and
  adornment each have their own seeded stream. Adding one never rerolls the
  others.
- **Likeness.** The stored face seed keeps anatomy and eye colour stable when
  a person shaves or changes clothes.
- **Ageing.** One stored recipe ages continuously: cheeks, jaw, lids, greying,
  hairline and lines.
- **Adornment.** Ear and nose ornaments and face marks (ink, scar or paint) come
  from `AppearanceKit.adornment`. A mark pairs its placement with a material
  and pigment. A kit can restrict it by place, period, age and sex. Holi powder
  comes from the festival day and can appear alongside permanent marks.
  - The drawn marks are schematic. They stand for the practice of marking the
    face, never for a particular community's design or meaning.
  - `describeAdornment` (`src/core/character.ts`) names what is worn, in plain
    words, under **Worn and marked** in the panel.

`raster.ts` is the bust's pixel buffer: materials, draw order and contour.

## The character panel

Click the sidebar portrait, or a person under **Around you**, to open
`src/ui/CharacterPanel.tsx`. It has three tabs: Profile, Household and
Abilities. Nothing new is stored on an actor; everything is derived.
- `src/core/stats.ts`: strength, agility, endurance, wit and five personality
  traits, rolled from seed and actor id.
- `src/core/persona.ts`: disposition and standing. Standing is separate from
  `actor.trust`.
- `src/content/characters/abilities.ts`: livelihoods mapped onto about twenty
  practices, ranked 1–3.
- **Today**: `dayPlan` in `src/core/itinerary.ts`.

## Beliefs

`src/content/beliefs/` holds dated, boxed belief systems per culture region
(`systems/*.ts`, exemplar `systems/egypt.ts`). They are resolved by the same
scope rules as name kits, with wide era floors so every date lands somewhere.
- **Powers.** A system ranks its powers `paramount`, `major` or `local`, with
  `relations` (child-of, consort-of, aspect-of and others), practices,
  officiants, and evidence with sources and limitations.
- **Names.** Real names are used where they survive. Reconstructed vocabulary
  (Proto-Indo-European, Proto-Bantu and others) is marked `hypothesis`, with
  the form given in `gloss`. No deity name is invented and presented as
  recovered. `unscopedBeliefs` supplies an unnamed practice at `fictional`
  status. Pre-1788 Australia stays descriptive by rule.
- **A person's belief** is derived, not stored: `beliefOf` picks a patron, an
  observance level and a practice.
- **Links and glyphs.** `wikiFor` links each system and power to Wikipedia.
  Glyphs are 11px text drawings in `src/render/glyphs/`, picked per power by
  `icons.ts`.
- **Accuracy.** The regional files were drafted by model agents. Expect errors
  of detail.

**Checks:**
- `npx tsx scripts/check-beliefs.ts [region]`: coverage against every place
- `npx tsx scripts/check-beliefs-wiki.ts --fix`: dead links
- `tests/beliefs.test.ts`, `tests/belief-hierarchy.test.ts`

## Labs and checks

- **Labs.** `/character-lab` (or ⌘3 / Ctrl+3 in game) edits any appearance,
  generates seeded crowds, steps frames, exports PNG and JSON, and can apply an
  appearance to an actor. Its free combinations are visual studies, not
  attested dress. `/portrait-lab` is the bust's lab.
- **Review sheets.** `npm run capture:characters -- <preset>`. A wrong name
  lists them all. Useful ones:
  - `doll`, `wardrobe`, `street`, `soldiers`, `professions`
  - `world`: 96 ordinary people drawn the way random starts are, by the
    people alive in each year and place. Start here when asking what most
    players will see.
  - `georgian`: eighteenth-century Europe, court to market
  - `modern`: ordinary people since 1970, a row per region
  - `expressions`, `weapons`, `work`
  - `portrait-age`
- **More sheets.** `npx tsx scripts/portrait-sheets.ts expressions|ears|marks|noses|nose-ornament`.
- **Tests:**
  - `tests/characters.test.ts`, `characters-world.test.ts`
  - `character-generation.test.ts`, `portraits.test.ts`
  - `persona.test.ts`, `day-plan.test.ts`
  - `swing.test.ts`, `tools.test.ts`
