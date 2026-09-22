# Interactive props

The visual baseline is checkpoint commit `120f870`. New worlds use **content version 2**, with the original terrain/generator version unchanged. Existing saves and replay manifests with content version 1 retain their original placement and behavior; start a new world to use the new prop set. No saved world is silently regenerated.

## Controls and behavior

- **Space:** drop a held object first; otherwise pick up a nearby portable prop, preferring the facing direction. With no item available, tap for a two-tile jump or hold 240 ms for a three-tile jump that can climb two altitude levels. Jumps use the held movement direction, or the facing direction when stationary. A hold launches once; release before jumping again.
- **F, holding a stout stick:** strike a nearby breakable container. Clay takes one strike, fiber two, wood three; these are explicit game balancing values, not physical claims.
- **E:** drink at a water source or look inside a nearby container. A nearby water source takes priority; otherwise, when holding a container, E examines that container.
- **Shift + movement:** run at about 1.6× walking speed. **X:** throw the held item in the movement/facing direction.
- **G / Put down (alternative to Space):** put the held object on a clear adjacent tile, outside doorways.
- **Look inside** reveals persistent quantities. **Take contents** transfers all available goods, with ownership consequences where applicable. Picking up does not transfer the contents separately.
- **Wait** remains a toolbar button and text command. Key repeats, forms, and modal panels suppress gameplay actions.

The MVP has one held object slot. Picking up equips that object; a stick has the strike capability, while a held container can be inspected and put down. Multiple equipment slots, item nesting, arbitrary per-stack transfers, locks, and animated open lids are not implemented.

Breaking preserves the original object ID, replaces the sprite with material-specific remains, and exposes the same contents in place. Taking those contents empties the remains; retrying a command never duplicates goods. Empty vessels remain visible. Damage, ownership, open/broken state and carrying survive save/reload. Nearby witnesses react to taking or damaging household property.

Art for new and redrawn families lives in `scripts/art/props_b/`, sized per
object rather than on a shared 48x48 canvas. **`PROP_ART.md` has the drawing
rules** — the scale ruler, canvas and outline order, shading, and the audit the
build runs.

## Small shared modules

- `src/content/props/catalog.ts`: definitions, shared art family, portability, container/material/strike/drink capabilities.
- `src/content/props/selection.ts`: flat household, yard, work and water kits selected from date, culture family and settlement form. Existing historical resolver exclusions/context/capability rules override the provisional defaults. Unknown entries remain qualified prototype selections, not researched historical presence.
- `src/content/props/place.ts`: deterministic content overlay on both world generators, including newly activated districts. Existing storage/water sites receive eligible objects; sparse work/yard pockets are placed beside buildings, avoiding blocked tiles, entrances, and other props.
- `src/core/props.ts`: facing/distance target selection and shared affordances; engine commands own all mutations.
- `public/props/`: independently compiled art and time-of-day shadow masks, now used by the world renderer as well as Prop Lab. Every prop and shadow renders at 1× world scale: one source pixel equals one terrain/character pixel. Small objects use fewer occupied pixels within the shared transparent 48×48 storage frame; never shrink a detailed sprite at runtime. `scripts/art/props/compact.py` contains the smaller native drawings and shared material ramps. No cast shadows are baked into object pixels.

The content version selects the overlay. It neither consumes the terrain generator's random stream nor changes terrain chunks. Restored worlds use saved entities; newly discovered districts use the same stable IDs and selection. The renderer contains no culture or era branching.

## Props people work

A prop an NPC uses has to exist in the settlement plan, not in the prop
overlay: `place.ts` runs after the plan is closed, and a routine can only walk
to something the plan placed. The drying rack is the worked example.

- `routines.ts` attaches one rack per household whose livelihood works the
  water (`attachRack`), in their yard, or beside their work, or by the shore.
  The id goes on the `WorkSite` as `rackId`, next to `gateId`.
- Their day gains two stations: *Taking down the dry fish* before the boat goes
  out, and *Hanging the catch* on the way home. The second uses the
  `haul-catch` activity, so they carry a visible line of fish to it.
- `engine.followRoutine` sets `rack.open` from the owner's current activity,
  the same way it opens a pen gate. The renderer draws the rack's frame alone
  when it is empty and the hangings when it is loaded, so the state of the prop
  is the record of the household's day.

The same three pieces — a planned object, stations that visit it, one boolean
the engine writes — are what any other worked prop needs.

### Trade signs

`src/content/props/signage.ts` picks a frame by place and date and a glyph by
trade or venue. Signs are premodern only: none in Europe from 1800, none
elsewhere from 1870. Each region has its own construction:

- **oak** (Europe 1100–1499): timber gallows with a knee brace, board on chains.
- **painted** (Europe 1500–1799): wrought-iron scroll arm, gilt-framed board.
- **lacquer** (China, Korea): standing black-lacquer panel in a red frame on
  stone feet, under a tiled cap.
- **split** (Japan): indigo noren on a bamboo stand, slit below the mark.
- **pennant** (South and Southeast Asia): tall bamboo pole, swallowtail banner.
- **bazaar** (West Asia, Inner Eurasia, Ottoman lands after 1453):
  kilim-bordered cloth on a pole, fringed.

Only trades with a mark of their own get a sign. A generic shopkeeper,
merchant or trader gets none. Named shops are signed half the time, other
trades 15%, and venues always. Signs keep four tiles apart, and the same glyph
fourteen. Tea and wine use 茶 / 酒 on Chinese and Japanese boards. These are
game conventions, not a catalogue of attested signs.

Review pixels with `python3 scripts/art/signpost_sheet.py` or search "Trade
sign" in Prop Lab.

### Settlement details

`src/content/props/settlement-details/` holds small dated details, one file per
region, placed by `placeSettlementDetails` after the yard props. Each rule sets
a density (one per N buildings), a cap and a minimum spacing, and may require a
trade in the building's name.

- Europe: wayside saint's shrines (medieval West; later Catholic regions only),
  Roman fountains and notice tablets, printed broadsides 1550–1950.
- West Asia: goods displays at merchants' doors, shaded drinking jars, and one
  small burial plot per town, four graves aligned to the qibla on the grid,
  with a turbaned stone in Ottoman lands.
- East Asia: roadside Jizō in Japan, sheltered notices elsewhere, shopfront goods.
- South and Southeast Asia: water pots, cloth and spice displays.
- Americas: colonial devotional niches and plaza goods; US newsstands and
  bulletin boards 1880–1950.

Beam scales are rare: a merchant-type building, an 8% roll, and 24 tiles from
the next scale.

### Legacy Asian street furniture

Three families with one variant per region — east, south, southeast Asian:

- **Shop sign** at the frontage of any building whose name gives a trade: a
  lacquered board under a tiled cap, a painted board with a flag, a cloth
  banner on bamboo. The lettering is bars, not glyphs; a real script at this
  size is noise pretending to be language.
- **Door lanterns** at every other household door, hung from a bracket and
  swayed by the wind like the drying rack's fish.
- **Square centrepiece**, chosen in `focusFor(pack)` by culture and date,
  overriding the fabric's own focus: memorial arch, stele, spirit house,
  sabil, assembly tree, stepped platform, stone dais, cairn, war memorial,
  clock tower, carved post. Undefined leaves the fabric alone, which is the
  right answer for a camp, a hamlet, and for places whose assembly ground
  never had a monument in it.
- **Doorway marker**, chosen in `doorwayFor(pack)`: paper lanterns in east and
  southeast Asia, a garland across the lintel in south Asia, a pierced brass
  lamp in west Asia from 700, a horn lantern in Europe from 1100 and a gas
  bracket from 1820. Most cultures return nothing, because most doors had
  nothing on them.

Both frontage props are `solid: false` — a board hangs over the street and a
lantern above the step, so neither needs its cell kept clear. They are placed
beside the entrance by their own test, because the general one refuses every
cell within a step of a door, which is exactly where they belong.

### Market and street

A **beam scale** goes in the work slot of any building whose name gives a
trade — everything a market sold went over a balance first. It carries eight
motion frames and the renderer runs them at half speed, so the beam settles
one way and then the other over about three seconds rather than flicking.

A **hitching post** joins the work kit for any date before 1920: a post with a
ring, a mounting block beside one, or a rail between two.

### Granaries

Four builds, chosen in `selection.ts` by culture and date and placed from the
work kit in villages and farms: round mud stores under thatch in west and
southern Africa, a plank box on posts with rat guards where the monsoon comes,
a boarded granary on staddle stones in Europe from 1400, and a clay silo
everywhere else and everywhere early. Each carries its own variations —
one silo or a pair, thatch or tile, three stones or four, a lid on the clay bin
or an open mouth with the grain showing.

### Farm implements

Placed from `selection.ts` for villages, farms and camps: a plough and a
beehive from −3000, rake and fork from −4000, a cart from −1000, a milk churn
from 1850 when dairying goes industrial. A water butt goes in any back yard
from −1000. All but the butt are `worksite` props, so none of them turn up on
a city street.

### Where a prop belongs

A prop def can carry `where`. `backyard` — a washing line, a bin — is only
placed behind a household's own house and outside the middle of town.
`worksite` — crates, tins, drums, a barrow, a drying rack, a woodpile — needs a
building whose name gives a trade, or a settlement that is not a city.

The middle of town is a fraction of the settlement's own spread, so a small
town's centre is small and a city's is not. Over half the buildings in a city
are left with nothing outside at all: every house with its own bin and line is
what made a street read as a back yard.

### Market stalls

`stallFor(pack, index)` picks one of five builds, and neighbouring pitches on
the same square take different variants.

| from | build |
| --- | --- |
| 1900 | tubular barrow under a canvas tilt, crates below, a scale on the end |
| 1650 | two-wheeled cart tipped down to sell from |
| 500 (east and southeast Asia) | roofed booth, boarded front, goods hung from the lintel |
| −500 | counter under a striped awning with a valance |
| before | boards on trestles |

Goods vary with the variant — produce, grain, pots, fish, bolts of cloth — so
two stalls of the same build are not the same stall.

### Street lighting

`lampFor(pack)` in `src/content/settlements/ornaments.ts` chooses what a place
lit its streets with, and `plan.ts` uses it wherever the block composer put a
lamp. Broad defaults, not a history of public lighting:

| from | what | where |
| --- | --- | --- |
| 1960 | sodium lamp, tapered column and a cut-off head | everywhere |
| 1890 | electric lamp, swan neck and enamel shade | everywhere |
| 1700 | gas lamp, fluted iron and four panes | European and west Asian cities |
| 1000 | lantern post, paper box under a little roof | east and southeast Asia |
| −500 | brazier column, an iron basket on stone | classical and south Asian cities |
| before | torch post, a brand in an iron cresset | anywhere |

`composeUrban` takes the settlement's year: a modern fabric's `furniture` list
still says it wants lamps, and any city from 1700 on gets them on its
arterials regardless of fabric. The torch and the brazier are drawn burning,
because that is what they are; the rest are drawn unlit, with the light itself
left to the renderer.

### Broken remains

One set per material rather than per object: a smashed jug and a smashed bowl
leave the same curved terracotta. `scripts/art/props_b/remains.py` draws seven
— clay, glaze, wood, fiber, metal, plastic, paper — in three arrangements
each, and the engine picks the arrangement from a hash of the object's id, so a
yard of broken crockery is not one pile stamped out three times.

What separates them is how the material fails: pottery leaves curved wedges
with the dark of the inside on every break, glaze adds a glint and shows raw
clay along the edge, wood splinters along the grain, wicker springs open,
metal folds rather than shatters, plastic whitens where it splits, card just
crushes. Resistance follows: wood and metal take three blows, wicker and
plastic two, everything else one.

The unsuffixed `prop-broken-clay`, `-wood` and `-fiber` keys stay in the atlas
so saves made before the variants still draw.

### Knocked over

Anything with `tips: true` in the catalog carries a second sprite, built from
`scripts/art/props_b/fallen.py` under the `-fallen` suffix. It is drawn as the
same body of revolution lying down, not as the standing sprite rotated: the
light stays upper-left, so a fallen bin is lit along its top and dark
underneath, and its mouth becomes a disc you look into from the side.

**Knock it over** needs no tool and does not break anything: it sets `tipped`,
opens the object and spills what it held where it lies. **Set it upright**
puts it back. A stick to a basket still breaks the basket; a shoulder to it
only lays it down.

### Old World kit

`techFor(pack)` says whether a settlement has wheeled vehicles, draught
traction, cooperage, dairying or the balance scale. These are Old World
things: in the Americas they arrive with contact, which the kit takes as 1550,
and in Oceania later still, taken as 1800. Before that the cart, the
wheelbarrow, the hitching post, the beam plough, the coopered water butt, the
milk churn, the iron cooking pot and the beam scale are all withheld.

It is not a claim about who invented what. It is what stops a wagon and a pair
of scales standing in a square in the 1485 Andes.

### Era ceilings

The kit is built upward from the earliest set, so every rule adds. Without a
ceiling a 1990s flat still rolls a storage jar and a city square still gets a
village wellhead. Three passes at the end of `selection.ts` take things back
out:

- **From 1900** the amphora, the sunken vat, glazed ware, the flask, the
  quern and the sickle stop being placed, and water becomes the pump alone.
- **From 1950, outside the countryside**, the household is cartons, plastic
  and tins; the yard is crates and tins; the fire is a drum. The pump stands
  in for a standpipe or a fountain, because there is no art for a tap.
- **From 1950 in a village, farm or camp**, only the clay cooking kit goes;
  baskets, buckets and benches stay.

From 1750 a wheelbarrow joins the work kit; from 1860 a galvanised bin and a
washing line join the yard and a steel drum the work kit. The washing line is
layered like the drying rack, so the washing lifts in the wind while the poles
stand still.

A drying rack is placed by `routines.ts` and gated the same way: after 1900
only a port, farm or village still cures its own catch in the open.

## Historical scope

The first rules span all twelve eras and cultural families, but are broad, provisional material-culture defaults. They are not exhaustive archaeological coverage or worldwide invention dates. Exact place/date refinements belong in the historical registry, not interaction handlers. More subtle occupational placement, water quality, container capacity/weight, commodity availability, imports and wealth distributions remain future work.

Early East Asian pottery is deliberately allowed before farming; the [Smithsonian overview](https://humanorigins.si.edu/evidence/behavior/carrying-storing/oldest-pottery) discusses early pottery and the more uncertain evidence for baskets. Our selection dates and generic art are approximations, not replicas. Earlier prehistoric bags use a hide-bag placeholder. The existing [Roman transport amphora evidence](https://www.metmuseum.org/art/collection/search/251843) continues to constrain that vessel to storage contexts through the historical resolver. Other regional defaults need further research rather than being presented as equally attested.

Natural water sources currently reuse the basin art. The initial availability of a stout stick is a discoverability choice. These limitations are content refinements, not extra branches in the simulation.

## Verification

`tests/props.test.ts` covers conservation, hidden contents, pickup/drop, material damage, ownership, malformed held references, save/reload/replay, all era/culture kit combinations, and entrance-safe placement. `tests/browser/props.spec.ts` exercises the actual keyboard controls, water prompts, modal suppression and world rendering. Existing legacy journey hashes remain covered by `tests/graphics.test.ts`.

## Prop bases and movement

Intact solid props occupy one ground tile, independently of their sprite height and cast shadow. The common engine collision query serves direct movement, diagonal corner checks, click-route pathfinding, and NPC movement. Pots, barrels, woodpiles, containers, and water fixtures block; loose sticks do not. Carried props and broken remains do not block. Dropping restores the obstacle immediately. Empty intact containers remain solid. These definition-level corrections apply to existing interactive-prop saves without regenerating them; pre-prop content-version-1 saves remain unchanged. Existing content-version-2 recordings may produce different NPC routes with this collision correction; the original content-version-1 checkpoint recordings retain their original collision behavior.

Yard composition has a separate visual footprint. Broad low objects such as
stock pens, drying racks, troughs, woodpiles and hayricks reserve the tiles
their sprite reads across, even when movement collision remains one cell. This
keeps a yard dense without collapsing several silhouettes into one heap. The
clearance is data on the prop definition rather than a regional special case;
routine-placed drying racks use the same envelope.
