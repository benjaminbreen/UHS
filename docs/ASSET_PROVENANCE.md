# Asset provenance

Where every shipped asset comes from, and under what terms. Update this when
you add an asset from outside the repo's own code.

## Graphics

The pixel art in `public/packs/`, `public/props/`, `public/nature/` and the
fauna sets is generated from the project's own code in `scripts/art/` and the
`scripts/build_*.py` builders. It is original work, and none of it is copied
from downloaded sprites, mockups or premium previews. Shadows
(`lighting-shadows.png/json`) are derived from those silhouettes.

**Exception: the tree study layer.** `src/assets/trees.png` and the growth
strips in `src/assets/trees/` came from outside the project. They are not
in any built atlas, but `src/render/scene-assets.ts` loads them for the
optional tree study layer in the live graphics panel, so they ship in the
build. Their licence has not been verified; one of them may be from the
Pixel Crawler free pack (Anokolisa), whose terms are in a PDF that was not
retrieved. Remove them, or confirm the terms, before any public release that
depends on them.

**Style references (local only, not shipped).** These are excluded by
`.gitignore`:
- Mystic Woods (free version: noncommercial, no redistribution)
- supplied desert and swamp sheets (no licence found)
- Pixel Crawler

None of their pixels are in the atlases. Importing any of them would mean
following their terms.

## Arrival backdrops

The WebP backdrops in `public/opening/` and `src/assets/arrival-atlas-*.webp`
were made with OpenAI image generation from the prompts in
`scripts/art/opening-prompts.json`. They are illustrative reconstructions for
broad dates and regions, not evidence. Edits have removed anachronisms (for
example, poultry and New World crops in the wrong places), and matching guards
keep each image to its region and climate.

## Vessel backdrops

The PNGs in `public/backdrops/` (the Earth and Moon from orbit, a starfield,
deep water, farmland and cloud from the air, mist) were made with OpenAI image
generation by a Codex agent on 2026-11-15; each file's prompt and processing
are in `public/backdrops/manifest.json`. They are scenery, not evidence.

The afterlife paintings in `public/backdrops/afterlife/` were made the same
way. They are imagined scenes in the idiom of each tradition’s religious art
and do not serve as historical evidence.

## Geography

- **Natural Earth** (public domain): land, rivers and populated places,
  extracted by `scripts/prepare_atlas.py`, `prepare_places.py` and
  `prepare_geography.py`. Source URLs and SHA-256 hashes are embedded in the
  generated atlas and `places.sources.json`. Regenerate with
  `npm run prepare:atlas`. The 1:10m scale means 1:10 million, not ten-metre
  resolution.
- **RESOLVE Ecoregions 2017** (Dinerstein et al., CC BY 4.0): biome and
  ecoregion lookup in `src/content/geography/travel/generated/ecoregions.json`.
- **The author's earlier UHS geography catalog**: landscape descriptions in
  `scripts/data/legacy-areas.json`.

## Historical evidence

Sources cited by content live with the content: `src/content/packs.ts`,
`src/content/history/`, and the evidence shown in game. Generated buildings,
people, prices and plans are game assumptions, not excavated plans.

## Type and icons

- `public/fonts/Baskervville-Regular.ttf`: unmodified, from Google Fonts. SIL
  Open Font License 1.1, with the licence text at
  `public/fonts/OFL-Baskervville.txt`.
- DM Sans: loaded from Google Fonts.
- Icons: `lucide-react`, under its package licence.

## Audio

All music and sound is synthesised by the project's own code in
`src/audio/`. No recordings, samples or soundfonts are used.

No paid assets have been bought.
