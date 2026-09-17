# Fauna

Phase 1 is an isolated art and data study. It does not place new animals in playable worlds or change existing livestock behavior.

## Contracts

- `src/core/fauna.ts` defines the serializable group state. One group decision can drive several presentation-only flock members; ground animals may still be represented individually when interaction requires it.
- `src/content/fauna/` owns flat species profiles. Profiles describe habitat preference, human tolerance, social organization, decision cadence, diet and art. Bird, domestic and temperate-wildlife content remains in subject files rather than engine branches.
- Species profiles refer to semantic habitat tags. They do not refer to settlement layouts, cultural art families or renderer classes.

The current values are implementation studies, not ecological population estimates. Regional/date selection and population density do not exist yet.

## Artwork

`npm run art:fauna` builds 248 original native-pixel frames into `public/fauna/atlas.png`. Native canvases reflect relative animal size: sparrow 16×16, dove 18×18, chicken 20×20, sheep 32×32, wolf 40×32, deer 40×40. Drawing coordinates are rasterized directly onto each species' native grid; exported bitmaps are not resized to fit a common box. Six-color palettes, no enclosing outlines, binary transparency and no baked shadows follow the user's small-sprite reference. The deer is antlerless. Eight-frame cycles include wingbeats, pecking, grazing, articulated walking/running, ear flicks and blinks; quiet cycles deliberately hold poses. These remain side-view studies, with east/west mirroring rather than directional turn animations. Third-party animal assets are not imported or redistributed. Generated `studies.json` supplies palette and frame-count metadata. Review outputs include a contact sheet and animated GIF under `artifacts/fauna-lab/`.

The lab's shared 2× lineup displays all six species without size normalization. Cattle are not authored yet and should occupy a larger native footprint than the wolf.

`/fauna-lab` compares behavior states, animation, east/west silhouette, native pixel scale, group size, spacing, flight height, shadows and background colors. It opens with one animal, has a clickable eight-frame timeline, previous/next stepping and playback-speed control, and can export the selected transparent frame. Groups use staggered phases; export corresponds to the first member. Takeoff/landing previews vary height across the cycle. These looped studies are not a behavioral flight controller.

## A/B art sets

`npm run art:fauna-b` builds a second, independent set of the same 248 frames from `scripts/art/fauna_b.py` into `public/fauna-b/` (frame ids use the `faunab-` prefix). Set B draws each animal from filled masses at native size, shades them with a light-above rim rule, and draws one hue-matched outline around the whole silhouette with no interior lines; parts separate by value alone, as in the Stardew animal sheets. Legs are hip-knee-foot segments driven by a walk or gallop cycle in which a grounded foot moves backward and a lifted foot forward, which is what set A got reversed. Native canvases are sized against the 29px standing human (deer 40×40, wolf 38×26, sheep 28×26, chicken 18×20, dove 16×16, sparrow 14×14).

The lab opens on set B with both sets side by side; the header switches the timeline, thumbnails, palette and export between A and B, and `?v=a` or `?v=b` picks the initial set. `artifacts/fauna-lab/ab-comparison.png` and `.gif` place every species from both sets on one sheet; `b-contact-sheet.png` and `b-animation.gif` cover every B state. `tests/fauna.test.ts` requires a B frame for every A frame.

## Four-direction set

`npm run art:fauna-c` builds 608 frames into `public/fauna-c/` (frame ids use the `faunac-` prefix) for horse, foal, rabbit and rabbit kit. Unlike sets A and B these are authored per direction: south, east, north and west each get their own eight-frame cycle, because a head-on horse is a different silhouette from a side-on one rather than a rotation of it. West is the only mirrored facing.

Drawing rules follow set B — masses at native size, light from above, one hue-matched outline round the whole silhouette, no interior outlines, binary alpha, no baked shadow — with Stardew-style exaggeration: heads and eyes a little large, legs a little short, so a 16px rabbit still reads as a rabbit.

Standing sizes against the 29px human, at roughly 17px per metre: horse 40×35, foal 24×23, rabbit 16×16, rabbit kit 10×10. Horse and foal are at true scale. Rabbits are not — a true-scale rabbit is four pixels of body — and are lifted to set B's small-bird floor instead, keeping the kit at about half the adult so the hierarchy still reads. Canvases carry three to five empty rows above the standing pose as headroom for airborne frames; `studies.json` reports both `size` (the canvas) and `standing` (the animal), and the lab labels the standing figure.

States are the existing ones: idle, graze and wander, flee and rest for the equines; forage in place of graze for the rabbits, and no rest for the kit. Grazing swings the poll down an arc so neck and head stay joined, hops crouch and stretch and land, and ears flick, eyes blink and noses twitch on the quiet cycles.

`FaunaProfile.directions` marks a four-direction species and `faunaFrames(profile, state, facing)` picks its frames; `art` holds the south cycle and the other facings differ only in the direction segment of the id. The lab lists set C as its own lineup row, offers four facings in the Direction control instead of an east/west mirror, and disables the A/B comparison for these species, which exist in no other set. Densities are zero, so this set stays out of playable worlds like the rest of phase 1.

## Next slice

The next approved slice should add settlement bird landing sites and one authoritative flock state machine. It should remain deterministic, make decisions on simulation ticks rather than render frames, and measure its cost before adding wildlife placement or predator-prey behavior.
