# Water experiments handoff

The user is converging on **C / Living depths**. The exact September 11 preferred values are preserved in `src/dev/water-experiments/presets/preferred-c.json`. New visits use those values and focus C; explicit URL values override them. **Load preferred C** restores the reference values, plus the current defaults for subsequently added controls. JSON export includes all controls and the renderer revision.

## Current lab

C uses animated color forms, caustics, submerged fish, optional surface ripples, wave crests and obstacle-aware foam. Rocks and plants influence a presentation-only displacement field; this is not a fluid simulation. Beaches can range from broad ramps to zero-width cliff edges. Foam opacity, thickness and breakup are independent of wave intensity. Rock masks suppress crests inside their footprints and phase delay curves approaching wave fronts.

Bank climate is independent of water palette, using the existing ecological family names. Bank materials are automatic, sand, mud, clay or snow. Automatic art defaults use sand for coasts, mud for ordinary inland waters, red clay for desert inland waters, and snow for the arctic study. These are preview choices, not claims that all deserts have red sediment or all arctic banks are always snow-covered. Clean wet/contact bands preserve the preferred pixel-art boundary without stippling. Wet-edge width and bank-lapping amount are separate controls.

## Future playable-map integration — requested direction, not implemented

Resolve visual settings from existing map inputs, without altering world generation or save compatibility inadvertently:

- Flatness/local shoreline slope → beach width and underwater ramp. The lab's 2–8 altitude-level rule is a preview proxy; global level count alone may misrepresent a locally steep or flat shore.
- Climate and existing regional ground colorway → sediment, exposed bank and vegetation palettes. Reuse desert colorways instead of forcing red clay everywhere.
- Season, snow/ice and current conditions → snowy or thawed margins. An arctic label alone should not force permanent snow.
- Water-feature kind and size → flow, base amplitude, wave scale and shoreline lapping (pond < lake/coast).
- Weather, rain and wind → wave strength/foam and optional extra surface ripples. Future gameplay extra ripples should be off by default and enabled by appropriate wind/conditions. The approved review preset explicitly enables them for comparison; retain that distinction.
- Existing time of day → reflection direction/tint, glitters and shared shadow lighting.
- Actual flow directions, rock footprints and local banks → deflection, wake placement and shoreline clipping.

The approved JSON is an art target, not one universal configuration for every map. None of these automatic gameplay mappings is connected yet. Before integration, measure full-world/chunk rendering costs, align terrain and water footprints, and deliberately choose renderer/content version handling. Do not expand this task into save-system work.

## Revision 7 bank authoring

Direct dry/wet/contact colors, tint opacity, wet-edge opacity and a switchable stepped gradient are included in exported JSON. Colorway presets cover golden sand, red clay/stone, gray pebbles and snow/slush. Dry-bank speckles were removed after the user rejected dithering; preserve clean color shapes. Custom colors intentionally override automatic climate colors until disabled. Bank tint opacity blends custom dry color with the material base; wet-edge opacity composites the contact/gradient colors over dry sediment.
