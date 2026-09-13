# Fauna

Phase 1 is an isolated art and data study. It does not place new animals in playable worlds or change existing livestock behavior.

## Contracts

- `src/core/fauna.ts` defines the serializable group state. One group decision can drive several presentation-only flock members; ground animals may still be represented individually when interaction requires it.
- `src/content/fauna/` owns flat species profiles. Profiles describe habitat preference, human tolerance, social organization, decision cadence, diet and art. Bird, domestic and temperate-wildlife content remains in subject files rather than engine branches.
- Species profiles refer to semantic habitat tags. They do not refer to settlement layouts, cultural art families or renderer classes.

The current values are implementation studies, not ecological population estimates. Regional/date selection and population density do not exist yet.

## Artwork

`npm run art:fauna` builds 88 original native-pixel frames into `public/fauna/atlas.png`. The first studies are house sparrow, rock dove, chicken, sheep, red deer and gray wolf. The sprites have binary transparency, limited palettes, stable ground anchors and no baked shadows. The added third-party `Basic Asset Pack for Animals` is not imported or redistributed; its provenance and license remain unrecorded.

`/fauna-lab` compares behavior states, animation, east/west silhouette, native pixel scale, group size, spacing, flight height, shadows and background colors. It can export the current transparent frame and reveal the selected species/group contract.

## Next slice

The next approved slice should add settlement bird landing sites and one authoritative flock state machine. It should remain deterministic, make decisions on simulation ticks rather than render frames, and measure its cost before adding wildlife placement or predator-prey behavior.
