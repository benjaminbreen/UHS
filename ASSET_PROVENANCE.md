# Assets and historical grounding

## Shipped graphics

All pixels in `public/packs/atlas.png` and `terrain.png` are generated from the project's original, manually specified integer-coordinate recipes in `scripts/build_art.py` and `scripts/art_world.py`. No downloaded sprite pixels, mockup crops, or premium-preview pixels are included. The atlas currently contains 1,489 named frames, including character directions/walk frames and terrain transition variants; this is not a claim of 1,489 distinct object designs.

The visual references are the supplied mockups (including `mockup target 3.png`), Mystic Woods, and the supplied desert/swamp sheets. Their broad lessons are limited color ramps, readable silhouettes, repeated material patterns, quiet terrain, and larger multi-cell buildings. Original buildings, trees, props, people, and animals were inspected in the proof sheet and in the running game.

Style constraints: north-up orthogonal ground; visible front facades; consistent upper-left highlights; small explicit color ramps (up to six tones for foliage); restrained outlines; nearest-neighbor scaling; 16-pixel ground cells, 20 × 32 world-character canvases, and larger building/tree sprites. Broad foliage clusters and repeatable wall/roof motifs carry detail. Footprints and ground anchors are independent of frame bounds.

## Supplied reference downloads

- `mystic_woods_free_2/read_me.txt` identifies the free version as noncommercial and disallows redistribution/resale even if modified. Marked premium-preview areas are not treated as usable sprites.
- No license document accompanied the supplied desert/swamp files in this workspace. They remain local visual references; their pixels are not redistributed in the application.
- `.gitignore` excludes these supplied reference directories/files. The user does not intend to publish the complete repository. A future decision to import actual pixels must retain and follow the relevant terms.
- No paid assets were purchased. Asset spending: $0.

## Geographic source

Natural Earth `ne_10m_rivers_lake_centerlines.geojson`, upstream commit `ca96624a56bd078437bca8184e78163e5039ad19`, provides the lower Tiber centerline. Natural Earth describes its data as public domain: https://www.naturalearthdata.com/about/terms-of-use/ . The prepared JSON records the exact source URL, SHA-256, EPSG:32633 projection, origin, extent, and limitations. `scripts/prepare_geography.py` reproduces the extraction with pyproj.

The source's 1:10m notation means 1:10 million map scale. It is not ten-metre spatial resolution. Local width, shoreline treatment, and historical channel position are not measured by this source. The small extractor uses pyproj and bounding-box segment selection instead of installing GDAL; it does not claim to implement the design brief's complete GIS pipeline.

## Historical evidence

The Roman vocabulary is informed by the Archaeological Park of Ostia's site and urban-development material. The Neolithic vocabulary is informed by the Çatalhöyük Research Project's architecture material and site management plan. Exact URLs, the specific claims they support, and limitations are in `src/content/packs.ts` and the in-game evidence panel. The buildings, people, prices, routines, English Neolithic resident labels, and particular settlement plans are generated assumptions.

The Neolithic roof-entry mechanic is simplified: a persistent entrance at the ladder leads to an attached interior. This does not implement the complete rooftop circulation of Çatalhöyük. The game does not identify its generated neighborhood as an excavated plan.

The interface uses the locally served Baskervville face documented below, with DM Sans requested through Google Fonts for small labels and system fallbacks. Lucide icons come from the installed package and retain its package license.

The Anatolian vegetation selection uses hackberry and oak, attested among the project’s botanical remains: https://www.catalhoyuk.com/newsletters/05/bots98.html . This does not establish individual tree locations or precise canopy morphology. The generic acacia art remains available in the atlas for future appropriate settings but is not selected by the Anatolian pack.

## UI typeface

`public/fonts/Baskervville-Regular.ttf` is the unmodified Baskervville regular face, downloaded from Google Fonts (fonts.gstatic.com, v20). Copyright 2018 The Baskervville Project Authors. Licensed under the SIL Open Font License 1.1; the full license is included as `public/fonts/OFL-Baskervville.txt`. It is served locally. The existing small DM Sans labels still use the Google Fonts stylesheet with a sans-serif fallback.

## Graphics polish

The atlas includes 18 portrait identity/color variants, deeper Roman roof and facade modules, distinct mudbrick roof furnishings, angular shaded foliage, stone quay edges and a reusable bridge arch. Terrain remains 16 px; larger assets span cells. Roman forecourts and waterfront surfaces are cosmetic recipes in `src/render/materials.ts`, shared by the scene and minimap. They do not alter the authoritative terrain, collision footprints, object identities or save schema. Visual flourishes are illustrative, not additional archaeological evidence.

## Target 3 depth pass

`scripts/art_world.py` contains the reusable world-art recipes: eight terrain variations, connected cardinal/diagonal edge masks, raised bank faces and shallow-water fringes, layered foliage clusters, repainted mudbrick houses, larger world characters, rocks and props. The frame total includes 255 natural-bank masks, 255 masks for each of three ground-edge materials, and projected-shadow variants; these are combinations of a small authoring vocabulary.

Shadow images are generated from the opaque source silhouette using a fixed upper-left light. `shadows.json` records anchors measured from each source image's actual feet, preserving attachment while actors move. Ripples animate independently of simulation time. Crop clumps share their existing parent object and all disappear when that patch is depleted. Decorative paths are derived through the existing static collision map, cached per world, and never change entity positions or the save format. Roof-entry households retain roof access; a facade niche is not a new doorway.

September 6 modular refinement: the building recipes in `src/content/graphics/buildings.json` and compilers under `scripts/art/` are original integer-pixel source work. Classical, mudbrick, timber, courtyard and weatherboard assets share those parts; no reference-image pixels or additional downloaded assets were incorporated. Existing mudbrick and classical frame IDs are retained. New later-era examples are graphics construction studies and do not claim historical authentication. The lab and gameplay load the same generated atlas and contracts. No money was spent.
