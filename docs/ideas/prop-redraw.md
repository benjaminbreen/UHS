# Prop redraw queue

The bottom quarter of the props as shipped, graded by eye from every
family's first variant beside the figure (November 2026, 301 families). Redraw
them with the method in [PROP_ART.md](../PROP_ART.md#redrawing-by-hand), worst
group first, and delete each line as its family lands.

## How they were graded

Each family scored 0-2 on seven things, and these are the lowest totals:

- **View**: a top seen at K = ½ and a foot that follows the same arc, like the
  houses' roofs. A front-only box reads as a sticker.
- **Scale**: proportion against the figure. Presence allows about 1.7x life,
  not 4x.
- **Value**: its own ramps, readable on grass. Bleached or neutral grey fails.
- **Edge**: tinted rim, lit top-left, dark roll bottom-right. No black, no
  purple-grey contour from another renderer.
- **Hand finish**: shapes placed on purpose. Voxel smear, SDF softness, noise
  and per-row ramps fail.
- **Silhouette**: what it is at 1x.
- **States**: whatever the player can do to it (open, dent, knock over) is
  drawn.

## 1. Thin or unreadable silhouettes (20)

- bicycle, bike-rack, cafe-terrace, works-fence, travois, hurdle, fish-weir
- stick (A), censer, catch, bedroll, sack, seat-stone, burial-stone, jizo
- grinder, quern, metate, mortar (A)
- shovel: the head is as big as the figure's torso and reads as a vase

## 2. Small buildings

Draw these in the houses' view, after the privies (see PROP_ART.md).

- chicken-coop, dovecote (`wayside.py`): front-only, black keyline
- privy-bench (`fronts.py`): a flat slab; privy-screen (`privy.py`): formula
  reed

## Done

- dustbin: hand grid with lid off, dented and dented-open states
- kerosene-tin: hand grid, open top with a stick handle, dented; replaced
  `nature-container-kerosenetin`
- wheelie-bin: hand grid in four colours, lid thrown back, on its side with
  the sacks out; a catalogue prop (`wheelieBin`) wherever it is placed
- street-bin: one grid per form (iron basket, concrete urn, hooded steel); a
  catalogue prop (`streetBin`). `litter-bin` was its twin and is gone, with
  the litter baskets it put in squares and parks before 1850
- plastic-bin (the plastic bucket): hand grid, on its side when knocked over
- the regional jars in `vessels.py`: water-jar (matka), olla, onggi,
  egyptian-jar, canaanite-jar, majiayao-jar, trade-jar, urpu,
  stoneware-crock. Half the size the SDF study drew them; lids come off
  (water jar, onggi, crock); the rest go over, laid down with `lay_down`,
  the water jar spilling and the pointed jars leaving their ring stand
- tannur and stove in `fire.py`: freestanding and banked tannurs, a brick
  stove with an iron plate, a clay charcoal stove, one hand-drawn kettle;
  four flame frames and a cold `-out` frame each. Replaced the equipment
  study's voxel tannur and stove and the old A painters
- the soft containers in `carrying.py`: waterskin, merchant-bale, milk-bag,
  taru, rice-bale, milk-vessel, bark-box, coolamon, grain-hamper,
  andean-sack, parfleche, pacific-basket, woven-grain-bin. The taru, bark
  box, hamper, grain bin and milk vessel lift their lids; the bale unties to
  show its bolts. The SDF studies' bin, hamper, taru, sack and bale were
  traced at 0.8x onto the ramps as large fixed stores (`*-large`), which keep
  their view from above. `container_studies.py` is gone, and with it the
  unplaced demijohn
- the privy cabins in `privy.py`: privy-shed, privy-stone, privy-outhouse,
  privy-nightsoil. One gable-on cabin grid with wall swatches (plank, daub,
  sheet, stone, brick) under tile, thatch or sheet roofs; the chute, soil
  pipe and night-soil tub are overlays. `open` swings the door back on a
  plank seat, or on a pan and high cistern in the outhouse. Their twins in `fronts.py` and
  `wayside.py`, and the unreached first drafts in `privy.py`, are gone
- middens in `midden.py`: household, communal and shell middens are one
  mound grid per size seen from above, built from basket-loads, with an ash
  patch and named things on them by `middenContents`; the communal one is half
  its old width. Walking into a household or communal midden leaves a print
  (`-dented`). The shell midden moved here from `lifeways.py`
- the front-only boxes: milk-churn (a hand grid in steel, pewter and brass;
  lid off with the milk showing, over on its side spilling) and jerrycans
  (a top face, three handles, the spout) redrawn; ice-chest given a lid seen
  from above, which lifts; open states for plain-box and utility-cabinet,
  open and crushed for cardboard-box, fallen for pavement-board. The rest
  (news-box, kerb-mailbox, menu-board, parking-meter, bus-stop,
  vending-machine, post-box, stencil-crate) read fine square on, as street
  furniture does
- the ground slabs: wrestling-ring (raked arcs and a heaped lip on the sand
  ring, the akhara pit's far wall, the sumo bales in segments, stakes and a
  sagging rope round trodden earth), threshing-floor (a stone kerb, straw
  trodden round in rings, the tethering post and grain heap), knapping-floor
  (on a pegged hide instead of a lozenge), seat-mat (plaited, edge bound),
  kerb-rubbish (tied sacks). tree-grate and gully-grate were never placed and
  are gone; mud-bricks, grave-mound, trolley-bay, newspapers and floor-carpet
  were fine
- Still procedural: the dustbin's fallen state, from `fallen.py`
