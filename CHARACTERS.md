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

## Art and animation

`src/core/character.ts` owns appearance data, deterministic variants and the legacy fallback. `src/runtime/schema.ts` validates imported appearance recipes. Appearance is optional, so existing actors remain readable without regeneration.

`src/render/characters/` contains the shared painter:

- `pixels.ts`: integer raster masks, palette ramps and garment-mask unions. Sleeves join the torso before outlining; there are no independent boxed shoulder caps. Shadows retain the material hue, with strong dark green/blue/brown/etc. contours instead of a universal black or gray outline. Cuffs have flat endpoints, and hands use small palm/thumb clusters.
- `head.ts`: separate front/back/profile anatomy, hair, facial hair and headwear. Side profiles have their own forehead, nose, chin and ear placement.
- `draw.ts`: four-direction body poses, opposing near/far arm and leg movement, elbow bends, hands and carried-object layering. Forward and backward stride poses alternate through neutral poses; repeated neutral frames are intentional.
- `props.ts`: native, transparency-cropped art for all 18 currently portable prop definitions. Containers retain their source pixels; the stick has a direction/pose-aware held drawing. One-hand, hanging and two-hand supports share the character hand positions. Tall hanging objects are lifted clear of the feet. Large vessels/crates can obscure the face because their original dimensions are retained.
- `world.ts`: scene-owned cached character frames, evicted after inactivity. Appearance resolution is cached and held-object lookup is indexed at scene refresh. Lab populations cache their four composite pages rather than rerasterizing everyone on every animation loop.

There are 16 pose families: idle, walk, carry, pickup, drop, give, talk, point, beckon, shrug, swing, thrust, work, startle, hurt and sit. Gameplay wires movement, successful interaction animations, resting, gathering/working and eating activities. The additional expressive poses are available in the lab; this does not add new combat, throwing or emotion rules.

Runtime command outcomes trigger presentation animations without moving inventory ownership into the renderer. Space with a held stick animates the actual strike; with no eligible target, it produces a visual air swing without damage. Picking up removes the ground object and attaches it to the actor. Dropping restores the ground object. Human shadows project the complete composed pose (including carried objects), cache by frame and lighting phase, and reuse the existing six time-of-day cast directions/opacities. Small foot-contact shadows remain at night. Prop/building shadow behavior is unchanged.

## Verification and review

`tests/characters.test.ts` checks variant coverage, repeatability, validation, explicit clothing precedence and complete portable-art coverage. `tests/browser/characters.spec.ts` exercises the editor, 192-person batches, frame stepping/export, all props in all directions, crisp alpha, profile/stride distinctions and actual game pickup/swing/drop/customization. Existing prop browser and rule tests also pass.

Run:

```sh
npm run build
npx vitest run tests/characters.test.ts tests/props.test.ts
npx playwright test tests/browser/characters.spec.ts tests/browser/props.spec.ts
```

With the development server on port 5173, `scripts/capture-character-refinement.ts` captures a green-shirt/brown-hair four-direction walk and the same outfit in the world. Other `scripts/capture-character*.ts` capture the lab, population, original palette walk and all held objects. Review images live in `artifacts/characters/`.

Before implementation, the complete existing worktree was committed as `222f0b7` and pushed to `origin/codex/character-lab`. Remote `main` contains the earlier UHS project with unrelated Git history and was preserved. The character work was subsequently reviewed and checkpointed for integration into `v2`; see the current top of `PROGRESS.md` for verification.

## Face, wardrobe, posture and lighting study

The lab exposes five head shapes and five jaw shapes, three body silhouettes, six resting postures, four sleeve cuts, three hem treatments and shoulder cloth. Strength and physique profile are **appearance metadata**, not a new gameplay strength statistic. `faceFromTraits(seed,index,age,physique)` uses age and supplied physical traits as weighted art direction; original jaws and alternative shapes remain possible. Explicit recipes override generated choices. No personality or competence is inferred from face shape. Existing actors supply age; absent physique values receive deterministic visual defaults.

Body taper/fullness, chest light, underarm folds, belt gathers, long tunics and lower-colored skirts provide silhouette and material variation without scaling pixels. Idle phase is offset per actor. Held burdens affect posture; hand-on-hip and clasped-hand resting poses yield to actual carried objects and actions.

The lighting control affects the native preview shadow and six-person production-renderer village study. The selected recipe and held object appear alongside an original adult, strong adult, elder, child and tall adult. `scripts/capture-character-village.ts` captures matching morning, midday, dusk and night scenes. All five heights retain their existing age boundaries; ordinary adults still default to original height.
