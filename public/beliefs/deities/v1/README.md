# Named deity icon set v1

This directory contains 96 transparent, palette-limited 64 × 64 deity icons.

- `icons/` is the source of truth for consumers and the place for manual retouching.
- `extracted/` is the reproducible first-pass output generated from the concept sheets.
- `atlas.png` is a transparent 8 × 12 packing of those files.
- `atlas.json` records stable IDs, labels, source cells and atlas coordinates.
- `proof.png` displays the transparent icons against a checkerboard for review only.
- `sources/` preserves the six approved image-generation concept sheets verbatim.

Run `python3 scripts/process_deity_icons.py` from the repository root to rebuild the extracted icons, atlas, manifest and proof sheet. The processor partitions each concept sheet into its 4 × 4 cells, removes the navy presentation background, normalizes the artwork to a padded 64 × 64 canvas, maps it to the shared 16-color palette, and writes hard alpha edges. It does not overwrite the preserved concept sheets or existing final icons. The atlas and proof always use the final files from `icons/`, so later hand edits survive regeneration.

The concept sheets were created with Codex's built-in image generator on September 12, 2026. They are original project assets generated for Universal History Simulator. The first approved carved-relic sheet established the art direction; subsequent sheets use the approved set as style references. No pixels from the user's earlier generic glyph sheet were copied into these assets.

Sheets 04–06 extend the atlas with these fixed row-major cells:

- `named-deities-04.png`
  - Horus, Ptah, Thoth, Hera
  - Poseidon, Ares, Aphrodite, Hephaestus
  - Hermes, Jupiter, Juno, Mars
  - Minerva, Neptune, Diana, Vesta
- `named-deities-05.png`
  - Ahura Mazda, Mithra, Anahita, Angra Mainyu
  - Tengri, Etügen, Umai, Erlik
  - Pachamama, Illapa, Mama Quilla, Mama Cocha
  - K'inich Ajaw, Itzamna, Chaac, Cocijo
- `named-deities-06.png`
  - Olorun, Orunmila, Yemoja, Eshu/Eleggua
  - Rangi, Papa, Tāne, Rongo
  - Krishna, Parvati, Murugan, Brahma
  - Lugus, Taranis, Epona, Brigantia

These files are an atlas-ready first cleanup, not a claim that every icon has received a human pixel-by-pixel art pass. Individual final icons can be retouched non-destructively while retaining their existing IDs and 64 × 64 bounds; rerunning the processor refreshes the comparison extraction but preserves the retouched final.
