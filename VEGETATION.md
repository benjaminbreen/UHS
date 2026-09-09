# Habitat vegetation

New worlds pin `vegetationRevision: 4`. The rule is set only at new-session preparation; existing manifests without it retain their original selection. The twelve native pixel-art additions now participate in generator-v3 scenery. The terrain lab uses the same selection and renderer.

`src/content/ecology/vegetation.ts` owns reusable weighted mixes and local filters. Selection uses the local regional setting and existing habitat cover/wetness, with independent deterministic hashes at absolute world coordinates. It does not branch on cultural families.

| Habitat | Trees and low vegetation |
| --- | --- |
| Temperate woodland | Oak, spreading pine, occasional birch; freshwater willow; sheltered fern and open heath/flowers |
| Boreal woodland | Spruce, pine and birch; fern in sheltered/moist patches, heath in openings |
| Humid tropical woodland | Broadleaf trees with occasional feather palms; fern, and ginger in a broad tropical Asian range |
| Wetland | Warm broadleaf/palm or temperate willow/oak mix; reeds and fern |
| Dry scrub | Mediterranean olive/pine/oak, other dry pine/oak forms, or Sahel thorn; woody scrub; sagebrush confined to a broad western North American range |
| Desert | Sparse thorn trees in a broad African/Sahel range; low dry scrub elsewhere |
| Grassland | Existing sparse tree presence; grazing tufts and flowers, fern in wetter patches, regional dry sagebrush |
| Tundra | No wild trees; low heath; new understory suppressed on snow |

These are authored visual interpretations and broad growth-form filters, not surveyed plant communities, exact botanical ranges, historical introductions or seasonal flowering reconstructions. In particular, generic tropical tree/palm sprites represent growth forms. Future species-specific content can narrow geography and dates without changing eras. Legacy fruit/berry resource objects retain their resource art and mechanics.

Revision 1 retains the original habitat candidate spacing. Revision 2 applies crown-aware spacing as described below. Trunk collision remains small and independent of the crown. Low vegetation adds sparse cover-correlated patches without blocking movement. The shared exclusion gate protects roads, fields, settlement reservations and water. Freshwater willow selection checks shore distance and excludes sea margins. Existing shoreline reeds and rocks take precedence.

`public/nature/atlas.*` supplies normal world sprites, UI previews and minimap trees. `public/nature/shadows.*` supplies 144 precomputed masks (24 plants × six lighting phases). Rebuild both with `npm run art:nature`. WorldScene selects textures by asset prefix, uses the shared native-pixel origin/light tint and ground lift, and loads prebuilt shadow pivots. No per-frame sprite generation or pixel processing was added.

Validation: `tests/vegetation.test.ts` checks climatic/geographic filters and samples six generated environments, finding all twelve plants while checking collision, terrain exclusion, atlas and shadow coverage. Existing habitat and worker preparation checks cover deterministic composition and prepared-world parity. `tests/browser/vegetation.spec.ts` exercises four rendered ecologies and a normal Korean game/minimap. Captures are in `artifacts/nature-lab/map-*.png`.

## Revision 2: scale and composition

Four independently authored tropical broadleaf ages use native canvases: sapling 48×64, young 72×96, mature 112×144 and giant 144×192. These are new pixel arrangements, not enlarged copies. World sprites stay at 1× scale; the nature lab exposes them under Broadleaf ages. The earlier broadleaf remains available for revision-1 scenery and courtyard objects.

`src/world/v3/vegetation-spacing.ts` assigns crown radii and applies bounded, deterministic local-priority thinning. The same absolute coordinates produce the same survivors regardless of chunk order. Habitat cover still creates groves and openings; larger trees claim more room. Revision 2 also increases building clearance, checks nearby road surfaces, and reduces trees near settlement edges. A fixed 128×128 tropical test sample falls from 1,154 trees to 494 (57% fewer); this is a fixture result, not a universal density target.

Woodland understory is thinned, and covered woodland gains earth/litter raster details. Canopy and trunk use separate crops of the same native sprite. A crown smoothly fades when it overlaps the displayed player, while the lower trunk stays opaque. Shadows remain precomputed; no per-frame pixel processing is required.

`tests/vegetation-composition.test.ts` checks age coverage, density reduction, deterministic spacing, native dimensions and canopy overlap. `tests/browser/canopy.spec.ts` verifies fading/restoration, opaque trunks and 1× sprite scale in the rendered scene. The current composition capture is `artifacts/nature-lab/composition-tropical.png`; native age comparison is `artifacts/nature-lab/broadleaf-ages.png`. Prior manifests retain their selected revision.

## Revision 3: quieter low vegetation and plant inspection

New worlds and regenerated terrain previews now use revision 3. Crown spacing increases from 0.45 to 0.54 of combined radii, followed by an independent 80% tree-retention gate. All low scenery retains 22.5% of the previous candidates (15% for heath and flowers), in addition to existing woodland thinning. This includes dry thorn scrub. These gates incorporate the user's additional request for 20% fewer trees and 50% fewer shrubs after the first density adjustment. A fixed 80×80 temperate sample changes from 202 trees / 221 low plants in revision 2 to 138 / 44; dry scrub changes from 45 / 238 to 37 / 44. These are visual-density controls, not measured ecological abundances or frame-rate claims.

`scripts/art/small_shrubs.py` adds independently drawn small dry scrub (24×20), medium dry scrub (32×24), low leafy shrub (24×20), and low heath (28×22). No resized sprite pixels are used. `understorySize` chooses small/medium/original dry scrub at 60/30/10%, low heath for 80% of heath candidates, and a low leafy form for 65% of fern/bush candidates. Size selection does not add plants. The lab now exposes 38 plant-related assets; a comparison is `artifacts/nature-lab/small-shrubs.png`.

Visible vegetation can be selected by clicking its opaque sprite pixels. The shared engine inspection resolves its deterministic decoration ID, checks visibility, and provides a name, description, position and native preview for the existing In focus sidebar. It has no invented harvest affordances. Browser checks click both trees and shrubs and verify that selection neither routes the player nor advances time.

## Revision 4: distinct growth forms and shared clearings

Added native bamboo clump (64×96), upright teak-like tree (88×128), wetland sedge and dry bunchgrass (both 28×24) in `scripts/art/habitat_plants.py`. Nature lab now has 42 plant-related assets. These replace candidates rather than increasing spawn sites. The inland South/Southeast Asian tropical mix (75–110°E, 8–28°N) favors teak-like deciduous trees, mixed broadleaf crowns and bamboo with few palms. Other tropical woodland also reduces palms. Tropical Asian flowering ginger's selection threshold drops from 0.5 to 0.08; sedges favor freshwater margins/wetlands and bunchgrass favors dry/open biomes.

The broad regional interpretation is informed by FAO's [Myanmar forest overview](https://www.fao.org/4/AC648E/ac648e08.htm) and [natural teak forest account](https://www.fao.org/4/AC773E/ac773e07.htm), which describe mixed deciduous trees and associated bamboo. The coordinate filter and proportions are authored simplifications, not reconstructed historical species inventories; the game still lacks separate wet-evergreen and seasonal tropical forest classifications.

Revision 4 increases crown spacing to 0.72 of combined radii, retains 60% of surviving tree candidates, further thins low vegetation by 45%, and shares a low-frequency opening mask across both layers. It preserves larger uninterrupted gaps rather than filling every patch with independent plants. Fixed Burmese woodland fixture: 157→50 trees and 77→25 low plants compared with revision 3. Native pixel scale, trunk collision, canopy fading and plant inspection remain in use. Earlier revisions retain their rules. Review images: `artifacts/nature-lab/habitat-plants.png` and `burma-quiet.png`.
