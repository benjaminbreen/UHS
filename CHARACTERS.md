# Characters and the character lab

Open `/character-lab`, or use **Settings → Character lab · appearance & clothing** in the game. **⌘3 / Ctrl+3** toggles the in-game lab; Escape closes it. Both views use the same native-pixel character painter as the world.

## Review and customization

- Generate repeatable populations of 24, 48, 96 or 192 characters using a seed and batch number. Click a character to edit it. “Same wardrobe” isolates body, complexion and hair differences.
- Original height is the standard adult size. Five heights are available: −6 pixels (under six only), −3 pixels (older children/short adults), original, +3 (tall) and +6 (tallest). Generated adults use approximately 80% original, 10% short, 9% tall and 1% tallest. These are art weights, not historical demographic claims. Heads and source pixels are not stretched.
- “Age for preview & population” controls the lab cohort and eligible height options. Under-six children default to the smallest size; ages 6–12 use the next size; teens use that or original. Game actors use their actual age, and the editor cannot apply a child-only size to an adult. Unknown ages default to adult; the uncustomized adult player uses original height. Existing explicit tall-adult choices remain explicit.
- Edit complexion, hair color, eight hair silhouettes, five facial-hair options, eight garment silhouettes, cloth/trouser/trim colors, cloaks, five headwear options, necklaces and earrings.
- Choose a pose, direction and any portable prop. Pause and step individual frames. The sheet shows north/east/south/west, with four frames per row.
- Export the selected appearance as JSON, import it, copy a recipe link, or export native-resolution transparent PNG animation/population sheets.
- In the in-game lab, select the player or an NPC and apply the current appearance. The actor's explicit `appearance.wearing` record is the source for clothing type and colors in the renderer. This is an art customization operation, not a simulated purchase or dressing action.

Unrestricted lab combinations are visual studies, not claims of historically attested dress. Actors without an explicit appearance preserve their legacy complexion/clothing palette and resolve stable body, face, hair and wardrobe variation. Generic dated wardrobe kits in `src/content/characters/wardrobes.ts` provide silhouette defaults, not authenticated historical costume reconstructions. Explicit wardrobes take precedence. Existing generation inputs, eras and recorded world composition are not changed. Historical wardrobe selection remains a content-authoring task; the renderer does not branch on cultural families.

## The character panel

Clicking the sidebar portrait opens a profile for the player; clicking a person under **Around you** opens the same panel for them. `src/ui/CharacterPanel.tsx` renders three tabs — Profile, Household, Abilities — from data that already exists plus three derived functions. Nothing new is stored on an actor, so a village of four hundred residents costs nothing to give trades and temperaments.

- **Stats** (`src/core/stats.ts`) roll from the seed and the actor id: strength, agility, endurance, wit and the five broad personality traits, all 0–100. Endurance was added after the first saves; those load with the mean of strength and agility rather than a fresh roll, which would move a known character.
- **Disposition and standing** (`src/core/persona.ts`) are read off those stats. Disposition prefers a pair of traits over a single one. Standing is how the settlement holds someone — years in one place, diligence, household size — and is separate from `actor.trust`, which stays the player's own account of them.
- **Abilities** (`src/content/characters/abilities.ts`) map the 138 livelihoods onto about twenty broad practices, ranked 1–3 from practice, the leaning stat and age. The generated livelihood list is not edited; matching is by id. One or two abilities outside the trade are drawn deterministically, so everyone knows a couple of ordinary things.
- **Today** comes from the resident's existing routine (`dayPlan` in `src/core/itinerary.ts`). The routine walks the same circuit several times a day, so repeats collapse to one entry and the time shown is the nearest round. The player has no routine and sees recent events instead.
- **Available** is the engine's own affordance list for that person, and disappears when they walk out of sight.

These are playable derivations from generated data, not biography. `tests/persona.test.ts`, `tests/day-plan.test.ts` and `tests/browser/character-panel.spec.ts` cover them; the browser spec captures `artifacts/character-panel-*.png`.

## Beliefs

`src/content/beliefs/` holds 214 belief systems across the twelve culture regions, each scoped by a year range and a lon/lat box and resolved by the same `matchesCharacterScope` the name kits use. Each region file also carries a few wide era floors — foragers, early farming, the long middle, the early modern centuries, the industrial period — so a date always lands on something; a dated entry beats a floor because it is narrower in years times degrees. The setting's own culture region is preferred over a box that spills across a border, but only as a preference, since some places carry a neighbour's culture tag. `npx tsx scripts/check-beliefs.ts [region]` reports coverage against every place the app can generate; it currently stands at 99%, the remainder being Antarctica and islands nobody had reached yet. A system lists its powers in three ranks — `paramount`, `major`, `local` — with a relation edge where a hierarchy is worth drawing, a few lines of practice, who officiates, and an evidence record with sources and limitations. The local ranks matter most: they are the powers an ordinary person addresses without going through a temple.

Powers carry their real names wherever names survive — Inmar and Keremet in the tenth-century Urals, the Scythian list from Herodotus, the thirty-seven Burmese nats, Sedna and Sila in the Arctic — including reconstructions where comparative work supplies them, such as the Proto-Indo-European \*Dyēus Ph₂tḗr, marked `hypothesis` and flagged as reconstruction in the limitation. Where no name was recorded, 158 powers carry a reconstructed one instead — Proto-Uralic \*ilma and \*tuli in the northern forest, Proto-Yeniseian \*qu'j in the taiga, Proto-Bantu \*nyambe, Proto-Oceanic \*qatua, Proto-Mayan \*k'uh — with the `gloss` field giving the form, the language and the sense. These are reconstructions of vocabulary standing in for a religious role, which the entry says plainly: a word for "sky" is not evidence of a sky god by that name, and the reconstructed stage usually postdates the horizon. 33 systems stay wholly descriptive, either because even a reconstruction would be a stretch — Papuan highland prehistory, the pre-Bantu forest, Teotihuacan, whose own language is unresolved — or because the material is not ours to enumerate, which is the rule for pre-1788 Australia.

Powers are tied to each other by `relations` — `child-of`, `consort-of`, `sibling-of`, `aspect-of`, `serves`, `rival-of`, `taught-by` — and the panel draws them as lines between the icons. 604 relations across 177 systems; 37 stay unconnected, which is usually the true shape: an ancestor cult with a remote creator above it has no pantheon to draw. A relation must name a power in the same list, cannot point at itself, and descent cannot loop; `tests/beliefs.test.ts` enforces all three. Where a relation is a scholarly argument rather than a plain statement of the tradition — Asherah as YHWH's consort, Perun against Veles — the system's limitation says so.

Every system carries a `wiki` link to its tradition's English Wikipedia article, and 650-odd powers carry their own; `wikiFor(system, power)` falls back from one to the other, ready for a detail panel that pulls extracts and thumbnails. `npx tsx scripts/check-beliefs-wiki.ts --fix` checks every link against the live API and drops dead power-level ones so they fall back.

Where nothing is recorded for a place and date, `unscopedBeliefs` supplies an unnamed practice — the ancestors, the sky, the water, the land — at `fictional` status. No proper deity name is ever invented and presented as recovered.

Each power carries a pixel glyph. `src/render/glyphs/` holds 161 of them, eleven pixels square, written as text — `.` contour, `o` body, `O` highlight — and drawn straight to a canvas, tinted by rank. `src/content/beliefs/icons.ts` picks one per power from what it is called and what it is for, name first, so "the waters, healing" is water before it is medicine. About a tenth fall back to a rank default. `tests/browser/glyph-sheet.spec.ts` renders a contact sheet to `artifacts/glyph-sheet.png`; pass `GLYPHS=a,b,c` to render only some.

A person's own belief is derived, not stored: `beliefOf` picks a patron from the powers near to hand, an observance level from their traits, and one practice line they keep. `tests/beliefs.test.ts` checks the shape of every system, that relations point at powers in their own list, and that documented entries carry sources.

The regional files were drafted by model agents against a hand-written exemplar (`systems/egypt.ts`) and are content, not scholarship: expect errors of detail, particularly in the traditions with the thinnest written record.

## Art and animation

`src/core/character.ts` owns appearance data, deterministic variants and the legacy fallback. `src/runtime/schema.ts` validates imported appearance recipes. Appearance is optional, so existing actors remain readable without regeneration.

`src/render/characters/` contains the shared painter:

- `pixels.ts`: integer raster masks, palette ramps and garment-mask unions. Sleeves join the torso before outlining; there are no independent boxed shoulder caps. Shadows retain the material hue, with strong dark green/blue/brown/etc. contours instead of a universal black or gray outline. Cuffs have flat endpoints, and hands use small palm/thumb clusters.
- `head.ts`: separate front/back/profile anatomy, hair, facial hair and headwear. Side profiles have their own forehead, nose, chin and ear placement.
- `draw.ts`: four-direction body poses, opposing near/far arm and leg movement, elbow bends, hands and carried-object layering. Forward and backward stride poses alternate through neutral poses; repeated neutral frames are intentional.
- `props.ts`: native, transparency-cropped art for all 18 currently portable prop definitions. Containers retain their source pixels; the stick has a direction/pose-aware held drawing. One-hand, hanging and two-hand supports share the character hand positions. Tall hanging objects are lifted clear of the feet. Large vessels/crates can obscure the face because their original dimensions are retained.
- `world.ts`: scene-owned cached character frames, evicted after inactivity. Appearance resolution is cached and held-object lookup is indexed at scene refresh. Lab populations cache their four composite pages rather than rerasterizing everyone on every animation loop.

There are 17 pose families: idle, breathe, walk, carry, pickup, drop, give, talk, point, beckon, shrug, swing, thrust, work, startle, hurt and sit. Gameplay wires movement, successful interaction animations, resting, gathering/working and eating activities. The additional expressive poses are available in the lab; this does not add new combat, throwing or emotion rules.

Runtime command outcomes trigger presentation animations without moving inventory ownership into the renderer. Space with a held stick animates the actual strike; with no eligible target, it produces a visual air swing without damage. Picking up removes the ground object and attaches it to the actor. Dropping restores the ground object. Human shadows project the complete composed pose (including carried objects), cache by frame and lighting phase, and reuse the existing six time-of-day cast directions/opacities. Small foot-contact shadows remain at night. Prop/building shadow behavior is unchanged.

## Verification and review

`tests/characters.test.ts` checks variant coverage, repeatability, validation, explicit clothing precedence and complete portable-art coverage. `tests/browser/characters.spec.ts` exercises the editor, 192-person batches, frame stepping/export, all props in all directions, crisp alpha, profile/stride distinctions and actual game pickup/swing/drop/customization. Existing prop browser and rule tests also pass.

Run:

```sh
npm run build
npx vitest run tests/characters.test.ts tests/props.test.ts
npx playwright test tests/browser/characters.spec.ts tests/browser/props.spec.ts
```

`npm run capture:characters -- refinement` captures a green-shirt/brown-hair four-direction walk and the same outfit in the world. Run it with no argument for every sheet, or name one of `lab`, `walk`, `heights`, `props`, `polish`, `refinement`, `village`, `sprite-light`, `sprite-study`. It starts against the development server on port 5173; review images live in `artifacts/characters/`.

Before implementation, the complete existing worktree was committed as `222f0b7` and pushed to `origin/codex/character-lab`. Remote `main` contains the earlier UHS project with unrelated Git history and was preserved. The character work was subsequently reviewed and checkpointed for integration into `v2`; see the current top of `PROGRESS.md` for verification.

## Face, wardrobe, posture and lighting study

The lab exposes five head shapes and five jaw shapes, three body silhouettes, six resting postures, four sleeve cuts, three hem treatments and shoulder cloth. Strength and physique profile are **appearance metadata**, not a new gameplay strength statistic. `faceFromTraits(seed,index,age,physique)` uses age and supplied physical traits as weighted art direction; original jaws and alternative shapes remain possible. Explicit recipes override generated choices. No personality or competence is inferred from face shape. Existing actors supply age; absent physique values receive deterministic visual defaults.

Body taper/fullness, chest light, underarm folds, belt gathers, long tunics and lower-colored skirts provide silhouette and material variation without scaling pixels. Idle phase is offset per actor. Held burdens affect posture; hand-on-hip and clasped-hand resting poses yield to actual carried objects and actions.

The lighting control affects the native preview shadow and six-person production-renderer village study. The selected recipe and held object appear alongside an original adult, strong adult, elder, child and tall adult. `npm run capture:characters -- village` captures matching morning, midday, dusk and night scenes. All five heights retain their existing age boundaries; ordinary adults still default to original height.

## Final contour and motion polish

Skin contours now use a dark brown/plum ramp even for pale complexions. Lower/right silhouette edges use a slightly cooler, deeper shade than upper/left edges; hair and cloth retain their material hue. Hand tips have a defined lower contour. Side walking keeps opposing arms and legs but reduces hand travel from ±3px to ±2px and its lift from 2px to 1px.

Idle poses no longer turn the head. Only the resting player automatically enters `breathe`: a four-second cycle with a one-pixel shoulder/chest lift, fixed head and feet, and fixed grips. The lab exposes this pose for frame stepping. NPC idle poses remain still apart from blinking.

Build −1 is the new default, narrowing the torso/shoulders one native pixel without resampling the head. Previous builds 0/1/2 remain selectable and retain their geometry. Procedural adult width weights are 75% narrow, 18% previous, 6% broad and 1% full; children default narrow. Height distribution is unchanged. Review `artifacts/characters/final-polish.png` or run `npm run capture:characters -- polish`.

## Portrait faces: ornament, noses and expression

Open `/portrait-lab`, or **Settings → Developer → Portrait lab**. Slot C, `src/render/portraits/constructed.ts`, is the bust the game actually shows.

**Eye placement.** Both eyes sit a pixel nearer the midline than they did. The old placement left five pixels of flat cheek between the near eye and the nose bridge, and `generateFace` drew wide, average and close spacing evenly, so a third of every crowd was wide-set. Spacing is now weighted four average to two close to one wide, and the `wide` and `close` offsets are unchanged.

**Noses.** Nine profiles instead of four: the original short, straight, broad and aquiline, plus hooked, snub, bulbous, narrow and flat. `noseForm` holds each one as five numbers — bridge convexity, tip reach, how far the tip hangs below or above the base, wing width and where the base sits — so the profile line, the lit side and the nostrils all follow from one table. The four originals stay common in the draw; the five additions share the remainder.

**Ornament and marks.** An appearance now carries an optional `adornment`: an ear ornament (stud, hoop, drop, spool, cuff), a nose ornament (stud, ring, septum), a face mark pattern, whether that mark is ink, scar or paint, its colour, and the ornament's metal. Which of these occur, and how often, is content: `AppearanceKit.adornment` in `src/content/characters/profiles/communities.ts` carries weighted pools per region, in the same repeat-to-weight form as the eyelid and hair-texture pools, and a kit that names none gets none. The worn `earrings` item still works and draws as a drop.

The drawn mark patterns are schematic — a few lines, dots or a block, in the places faces are marked — and stand for the practice of marking the face, never for a particular community's design, meaning, status or age grade. The regional pools are art direction about visibility, not measured frequencies. Marks are withheld below twelve and stretched lobes below ten. Anything a hat, hood or beard covers is covered, because marks only paint pixels that are already skin.

**Expressions.** `FacePose` is eleven numbers — inner and outer brow, upper and lower lid, eye opening, mouth curve, opening and width, cheek, gaze and one asymmetry term — applied as pixel offsets to the resting drawing. Twelve named poses (`neutral`, `smile`, `happy`, `laugh`, `sad`, `angry`, `stern`, `surprised`, `worried`, `thoughtful`, `wry`, `tired`) are entries in one table, so every face wears every expression from the same recipe and still looks like itself. `facePose(expression, amount)` returns a partial pose, which is what makes a change a movement rather than a cut: `CharacterSprite` plays half out of the old pose, half into the new one, then all the way, at 55 ms a frame. Blinking and the speaking mouth run on their own clocks over the top of it, and reduced motion swaps straight to the target.

In the game, the NPC in conversation wears the mood the model chose for its own line. `mood` is a field of the dialogue reply schema alongside `regard`, so the model picks the face and the words together rather than having a face inferred from the text afterwards; the system prompt asks for anger or sternness where the player gave offence and warmth where the words pleased. Strict mode forces every field, so a line without a mood arrives as null and is dropped, and the portrait falls back to how the NPC already regards the player. While a reply is in flight the face is thoughtful. Nothing is persisted: the mood belongs to the line, and `regard` remains the thing that actually moves `actor.trust`.

The speaking mouth works around whatever the pose already does with it, one row either side, so a laughing face moves while it talks instead of holding one gape.

The player's own portrait shows what the condition column says: a wound outranks exhaustion, exhaustion outranks an empty stomach.

**Saying what the portrait shows.** `describeAdornment` turns the recipe into plain phrases — "Bone spool in a stretched lobe", "Lines across both cheeks, cut into the skin" — and the character panel lists them under the portrait as **Worn and marked**, above Carrying, for the player and for anyone opened from Around you. The phrasing is description only: it names the shape and the material and never a design, a people, or what a mark might mean to the person wearing it. A person wearing nothing gets no heading. One metal covers a person's ear ornament, nose ornament and necklace, so the drawn beads and the described ones agree.

`npx tsx scripts/portrait-sheets.ts expressions|ears|marks|noses|nose-ornament` writes contact sheets to `artifacts/portrait-lab/`. `tests/portraits.test.ts` covers the pose table and the adornment pools; `tests/browser/portrait-lab.spec.ts` exercises the lab.
