# Graphics: labs, ownership, time-of-day light

How art reaches the screen, where each part is owned, and the dev labs for
looking at it. Building drawing rules are in the `building-art` skill
(`.claude/skills/building-art/SKILL.md`); props are in [PROP_ART.md](PROP_ART.md);
terrain, water and vegetation have their own docs, listed in `AGENTS.md`.

## Labs

All are routes in `src/main.tsx`, served by the dev server and the production
build. They never write saves.

| Route | For |
|---|---|
| `/graphics-lab` | The game's own Phaser scene on fixtures (`src/dev/fixtures.ts`). `?study=`, `bank=`, `scene=settlement`, `debug=1`; six light bands; integer zoom; **Copy link** and **Save PNG**. Overlays: cyan collision, gold entrances, pink visual bounds. `window.graphicsLab.describe()` reports the fixture and models. |
| `/building-lab` | Recipe editor for the structured building fields |
| `/prop-lab` | Every prop family and variant at integer zoom beside the adult, with shadow phases |
| `/art-audit` | The art audit in the browser |
| `/terrain-lab`, `/terrain-experiments`, `/terrain-kits`, `/edge-lab`, `/grass-lab`, `/materials-lab`, `/tree-lab` | Terrain, ground, edges and vegetation |
| `/water-experiments` | Living-water tuning |
| `/interior-lab` | Interiors |
| `/character-lab`, `/portrait-lab` | Characters and portraits ([CHARACTERS.md](CHARACTERS.md)) |
| `/fauna-lab`, `/geography-lab`, `/history-lab` | Animals, routes, the history resolver |

For a shot of the real game use `npm run shot`; for a town without a browser,
`npm run town:sheet`.

## Ownership

| Concern | Source |
|---|---|
| Building recipes and materials | `src/content/graphics/buildings.json`, `urban.json` |
| Building painters | `scripts/art/buildings.py` dispatches each recipe to a painter, mostly `scripts/art/front_*.py` (see the skill) |
| Which building a place and date gets | `src/content/graphics/*-houses.ts`, `pack.ts`; `src/content/settlements/modern-buildings.ts` |
| Model contracts (anchor, entrance, door, bounds, shadow) | `src/content/graphics/models.ts`, `models.generated.json` |
| Building placement | `src/world/v3/plan.ts` and `urban.ts` ([SETTLEMENTS.md](SETTLEMENTS.md)) |
| Sprite placement, roof hit and occlusion | `src/render/buildings.ts` |
| Landscape choices (bank, bridge, paving reach) | `src/content/graphics/landscapes.ts` |
| Ground material districts | `src/render/materials.ts`, `appearance.ts` |
| Prop art | `scripts/art/props_b/`, built by `npm run art:props` ([PROP_ART.md](PROP_ART.md)) |
| Shadows | `scripts/art/shadows.py` |
| The scene | `src/render/WorldScene.ts`: one Phaser scene for gameplay and the labs |

`npm run art` rebuilds the building atlases into `public/packs/`. Generated
atlases and models are committed, so playing and building need no Python.

The 16px terrain cell is the sampling unit. Collision comes from footprints,
never from opaque pixels.

## Time-of-day lighting

`src/content/graphics/lighting.json` is the one table shared by the art build,
gameplay and the lab. Six bands start at 05:00, 08:00, 11:00, 14:00, 17:00 and
20:00 (early morning, morning, midday, afternoon, dusk, night). They are
art-directed, not astronomy.

Each band sets a cast vector, opacity, colour multiplier and ambient wash.
`scripts/art/shadows.py` projects each silhouette into six integer-pixel masks
using the recipe's height. Contact shadows follow the base pixels and stay put
as the cast turns. Night and interiors use contact masks only. The masks live in
one atlas (`lighting-shadows.png/json`); the scene swaps frame names when the
band changes, with no runtime image processing.

Colour treatment multiplies existing pixels; lit and shaded planes are baked
into sprites. Improve silhouettes and material planes before reaching for a
more elaborate renderer.

## Checks

- `npm run art:audit` (and `/art-audit`) for props; `python3 scripts/art/front_audit.py <prefix>` for front-on buildings. Both are advice.
- `npm run shot -- out.png "<setting>"` for one in-game view.
