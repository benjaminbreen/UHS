# Graphics system and review lab

Open **Settings → Graphics lab**, or visit `/graphics-lab` while the dev server is running. The lab is also available in the production build. It never loads a journey, acquires the save-writer lock, registers player actions, or writes to IndexedDB. Its disposable runtimes disable the normal world worker cache, so a worker cannot replace fixture terrain with tiles from a playable pack.

Useful starting views:

- `/graphics-lab?study=classical&bank=masonry` — four classical/Hellenistic facade recipes.
- `/graphics-lab?study=mudbrick&bank=earth` — four mudbrick household recipes.
- `/graphics-lab?study=mixed&bank=earth&debug=1` — compare construction families and their contracts.
- Add `scene=settlement` for the normal generated settlement. The default construction court exercises a variable-width river, all four building variants, trees, storage vessels and communal objects.

Choose daylight, warm daylight or dusk; earth banks or masonry quays; 1–4× integer pixels; wide, square or portrait framing. Pan buttons and every setting are represented in the URL. **Copy link** preserves a reproducible comparison; **Save PNG** exports the actual renderer. Freeze water for stable before/after captures. Cyan overlays mark collision footprints, gold marks entrances, and pink marks visual bounds.

The France, China and California presets are **construction studies**, not finished or authenticated historical packs. They demonstrate timber framing, hipped tile roofs and weatherboard using the same compiler and rendering path. New periods still need researched recipes and, where necessary, additional authored construction parts.

## Ownership and extension

| Concern | Source | Responsibility |
| --- | --- | --- |
| Building recipes and material ramps | `src/content/graphics/buildings.json` | Footprint, entrance, canvas, height, wall material, roof form/material, openings, attachments, variation seed. Stable existing frame IDs preserve saves. |
| Building compiler | `scripts/art/buildings.py` | Shared wall, foundation, recess, roof and attachment functions. No historical-setting branches. |
| Content contracts | `src/content/graphics/models.ts`, `models.generated.json` | Generated dimensions, anchors, bounds, height and shadow specification consumed by world generation and rendering. |
| World placement | `src/world/generate.ts` | Chooses recipes from each pack's building list; places physical footprints, entrances and enclosures. |
| Sprite placement | `src/render/buildings.ts` | Converts contract anchors and visual bounds into screen placement and roof hit/occlusion bounds. |
| Landscape choices | `src/content/graphics/landscapes.ts` | Water palette, earth/masonry bank, bridge construction, paving reach and reed density; independent of building family. |
| Material decisions | `src/render/materials.ts`, `appearance.ts` | Derives districts from actual parcels and paths toward communal hubs; neighbor transitions and quiet/detail meadow patches. |
| Vegetation and shadows | `scripts/art/vegetation.py`, `shadows.py` | Stepped canopy silhouettes; common light ramp; height-aware cast shadows and compact darker contact shadows. |
| Renderer | `src/render/WorldScene.ts` | The same Phaser scene in gameplay and the lab: terrain, masks, sprites, depth, animation and optional diagnostic overlays. |
| Fixtures | `src/dev/fixtures.ts` | Isolated court and normal-generator variants, typed settings and URL parsing. |

To add or revise a building, edit a recipe, reuse existing materials and parts where possible, then run `npm run art`. Add a compiler part only when a new construction form requires it. Select the recipe in the lab before adding it to a historical content pack. Generated atlas, terrain and model files are committed so normal builds do not require Python. Pillow is needed only to regenerate art.

The 16-pixel terrain cell is the sampling unit; buildings and trees span multiple cells. Physics does not derive collision from opaque art pixels. Existing physical footprints and entrances remain stable, while the visible roof-entry ladders now align with the entrance axis. A new silhouette must be checked at 1× and 3×, on both ground treatments, beside a person, and with the footprint overlay enabled.

## Current limits and next quality checks

This pass replaces era-selected building drawing with shared construction recipes and removes the renderer's `layout === streets` inference for banks. Generic streets/cluster **world layout generation** still uses a small set of procedural patterns; this is not yet a universal settlement planner. Base props, actors and interiors also retain simpler original recipes. The art compiler has not become a general arbitrary-building synthesizer.

Saved worlds retain generator version 1 and its channel, road and object collision geometry. Curved/variable-width shorelines are exercised in the isolated court; changing the playable world's actual water contour needs a separately versioned generator and save compatibility policy. The existing channel's visual bank treatment improves without moving its blocked cells.

Day/warm/dusk are fixed upper-left lighting treatments; they do not simulate a moving sun. Building cast length uses authored height, and contact shadows are separate. Visual acceptance still requires looking at the output: automated checks do not establish that it matches the mockups. Further refinement should focus on material irregularity, roof/foliage silhouettes and contextual density through the shared recipes, with classical and mudbrick as the first standards.

## Verification and restore points

- `npm run check` — core/content/graphics checks and production build.
- `npm run test:browser` — all browser interactions and graphics-lab checks, with a dev server on port 5173.
- `npm run test:graphics` — quick lab comparison suite; saves review screenshots under `artifacts/lab-*.png`.
- `window.graphicsLab.describe()` — lab-only, read-only description of the active fixture and compiled models, useful to automation.

The original working version is commit `e9966ca`, tag **`checkpoint-before-graphics-refactor`**. This is a local Git repository; nothing has been pushed. Downloaded reference packs, dependencies, caches and environment files are ignored.

To inspect the earlier version without overwriting current work:

```sh
git worktree add ../UHS-graphics-baseline checkpoint-before-graphics-refactor
```

Then install dependencies in that directory with `npm ci` and run it on another port if needed. The checkpoint contains the generated assets, so the ignored reference packs are not needed to restore the running application. Browser saves are separate from Git; export valuable journeys from Settings before testing changes to simulation or generation.
