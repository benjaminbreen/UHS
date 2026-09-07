# Interactive props

The visual baseline is checkpoint commit `120f870`. New worlds use **content version 2**, with the original terrain/generator version unchanged. Existing saves and replay manifests with content version 1 retain their original placement and behavior; start a new world to use the new prop set. No saved world is silently regenerated.

## Controls and behavior

- **Space, empty hands:** pick up the nearby portable prop, preferring the facing direction.
- **Space, holding a stout stick:** strike a nearby breakable container. Clay takes one strike, fiber two, wood three; these are explicit game balancing values, not physical claims.
- **E:** drink at a water source or look inside a nearby container. A nearby water source takes priority; otherwise, when holding a container, E examines that container.
- **G / Put down:** put the held object on a clear adjacent tile, outside doorways.
- **Look inside** reveals persistent quantities. **Take contents** transfers all available goods, with ownership consequences where applicable. Picking up does not transfer the contents separately.
- **Wait** remains a toolbar button and text command. Key repeats, forms, and modal panels suppress gameplay actions.

The MVP has one held object slot. Picking up equips that object; a stick has the strike capability, while a held container can be inspected and put down. Multiple equipment slots, item nesting, arbitrary per-stack transfers, throwing, locks, and animated open lids are not implemented.

Breaking preserves the original object ID, replaces the sprite with material-specific remains, and exposes the same contents in place. Taking those contents empties the remains; retrying a command never duplicates goods. Empty vessels remain visible. Damage, ownership, open/broken state and carrying survive save/reload. Nearby witnesses react to taking or damaging household property.

## Small shared modules

- `src/content/props/catalog.ts`: definitions, shared art family, portability, container/material/strike/drink capabilities.
- `src/content/props/selection.ts`: flat household, yard, work and water kits selected from date, culture family and settlement form. Existing historical resolver exclusions/context/capability rules override the provisional defaults. Unknown entries remain qualified prototype selections, not researched historical presence.
- `src/content/props/place.ts`: deterministic content overlay on both world generators, including newly activated districts. Existing storage/water sites receive eligible objects; sparse work/yard pockets are placed beside buildings, avoiding blocked tiles, entrances, and other props.
- `src/core/props.ts`: facing/distance target selection and shared affordances; engine commands own all mutations.
- `public/props/`: independently compiled art and time-of-day shadow masks, now used by the world renderer as well as Prop Lab. Every prop and shadow renders at 1× world scale: one source pixel equals one terrain/character pixel. Small objects use fewer occupied pixels within the shared transparent 48×48 storage frame; never shrink a detailed sprite at runtime. `scripts/art/props/compact.py` contains the smaller native drawings and shared material ramps. No cast shadows are baked into object pixels.

The content version selects the overlay. It neither consumes the terrain generator's random stream nor changes terrain chunks. Restored worlds use saved entities; newly discovered districts use the same stable IDs and selection. The renderer contains no culture or era branching.

## Historical scope

The first rules span all twelve eras and cultural families, but are broad, provisional material-culture defaults. They are not exhaustive archaeological coverage or worldwide invention dates. Exact place/date refinements belong in the historical registry, not interaction handlers. More subtle occupational placement, water quality, container capacity/weight, commodity availability, imports and wealth distributions remain future work.

Early East Asian pottery is deliberately allowed before farming; the [Smithsonian overview](https://humanorigins.si.edu/evidence/behavior/carrying-storing/oldest-pottery) discusses early pottery and the more uncertain evidence for baskets. Our selection dates and generic art are approximations, not replicas. Earlier prehistoric bags use a hide-bag placeholder. The existing [Roman transport amphora evidence](https://www.metmuseum.org/art/collection/search/251843) continues to constrain that vessel to storage contexts through the historical resolver. Other regional defaults need further research rather than being presented as equally attested.

Natural water sources currently reuse the basin art. The initial availability of a stout stick is a discoverability choice. These limitations are content refinements, not extra branches in the simulation.

## Verification

`tests/props.test.ts` covers conservation, hidden contents, pickup/drop, material damage, ownership, malformed held references, save/reload/replay, all era/culture kit combinations, and entrance-safe placement. `tests/browser/props.spec.ts` exercises the actual keyboard controls, water prompts, modal suppression and world rendering. Existing legacy journey hashes remain covered by `tests/graphics.test.ts`.

## Prop bases and movement

Intact solid props occupy one ground tile, independently of their sprite height and cast shadow. The common engine collision query serves direct movement, diagonal corner checks, click-route pathfinding, and NPC movement. Pots, barrels, woodpiles, containers, and water fixtures block; loose sticks do not. Carried props and broken remains do not block. Dropping restores the obstacle immediately. Empty intact containers remain solid. These definition-level corrections apply to existing interactive-prop saves without regenerating them; pre-prop content-version-1 saves remain unchanged. Existing content-version-2 recordings may produce different NPC routes with this collision correction; the original content-version-1 checkpoint recordings retain their original collision behavior.
