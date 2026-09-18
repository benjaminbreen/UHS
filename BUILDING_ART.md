# Drawing buildings

Rules learned redrawing the civic halls — the sweat lodge, kiva, talking
shelter and round meeting house in `scripts/art/halls.py`. They apply to any
building painter: `halls.py`, `theatres.py`, `religious.py`, `urban.py`,
`period.py`. Props have their own rules in `PROP_ART.md`.

## The review loop

`build_art.py` takes minutes and writes atlases. Use it to ship, not to draw.
To draw, use:

```bash
python3 scripts/art/review_sheet.py out.png --zoom 4 hall-kiva-medium-0
```

It renders named recipes to one labelled sheet in about a second. `--list
hall-` prints the names. Change a ramp, render, look, change it again.

**Judge at 3x or larger.** At 1x a flat shell and a modelled one look the
same. Every fault below was invisible until the pixels were big enough to
compare side by side.

**Look at one building filling the frame.** A four-up sheet tells you the set
hangs together; it will not show you that a doorway is a black rectangle.
Crop and magnify the one you are working on.

## Shade from a normal, not across the sprite

The old code shaded a dome by how far across the sprite a pixel was:

```python
lit = across * 0.4 + down * 0.6      # wrong
```

That is a diagonal wipe. It puts the same gradient on a sphere, a cylinder and
a flat roof, and all three come out as the same flat lozenge. Instead give the
surface a normal and light it:

```python
SUN = (-0.58, -0.55, 0.60)           # one sun for the whole file

def lambert(self, nx, ny, steps, ambient=0.24):
    nz2 = 1.0 - nx * nx - ny * ny
    if nz2 < 0:                      # past the limb: flatten into the plane
        k = math.hypot(nx, ny)
        nx, ny, nz2 = nx / k, ny / k, 0.0
    lit = nx * SUN[0] + ny * SUN[1] + math.sqrt(nz2) * SUN[2]
    v = (lit - 0.10) / 0.90 + (ambient - 0.24) * 0.5
    return max(0, min(steps - 1, int(max(0.0, v) * steps)))
```

Screen position maps straight onto the normal, so no geometry is needed:

- **Dome**: `nx = (x - cx) / rx`, `ny = (y - foot) / rise`.
- **Cylinder** (a drum, a post, a column): `nx` as above, `ny = 0`.
- **Cone** (a thatch roof): `nx` per ring, `ny` fixed at minus the slope.
- **Flat top facing the sky**: not this at all — see below.

One sun per file. Two painters lighting from different corners is the single
loudest thing wrong with a mixed street.

## Stretch the ramp or you get one flat mid-tone

A plain `ambient + (1 - ambient) * max(0, lit)` spends most of its steps on
the lit half, and the shell comes out one tone with a dark edge. The `(lit -
0.10) / 0.90` above pushes the terminator into the middle of the ramp so the
shadow side is genuinely dark. This one line was the difference between the
before and after sheets.

Use **seven or eight steps** on a curved shell. Five cannot carry a lit side,
a terminator, a shadow side and a rim.

## Flat surfaces are flat

A roof disc, an earth roof, a tabletop faces the sky. Every point on it has
the same normal, so it is **near enough evenly lit** — one tone, with a
darker ring at the far rim where nothing bounces back into it, and a speckle
of two darker tones for texture. The old `plan_disc` ran a diagonal gradient
across it and a kiva roof read as a muddy bowl.

Gradate what curves. Do not gradate what does not.

## Contact, thickness, silhouette

- **A wall's foot never sees the sky.** Four rows of bounce shadow at the
  bottom of a drum is what plants it in the ground.
- **A roof needs a dark line where the eave turns under.** Without it thatch
  is a flat slab pasted on top. This is the strongest edge in the shelter.
- **One pixel of rim light along the lit limb** separates a shell from
  whatever is behind it. One pixel. Two is a halo.
- **The doorway is the only hard black in the sprite**, so it has to have a
  clean silhouette: an arch, a frame either side, a lit lintel, and a hint
  that the inside is a room rather than a hole.

## Detail is subtraction

The first pass at the sweat lodge had four vertical ribs and three horizontal
thongs. That is a beach ball. One direction of structure, faint — a groove
one step darker, optionally a lit pixel beside it.

The first pass at the shelter had nine posts and you could not see the shade
under it. Three heavy posts read as a building; nine sticks read as a fence.
When something is not reading, remove half of it before adding anything.

Same for scatter: the mockups had grass, stones and cast shadows around each
building. In game the terrain draws those, and a sprite carrying its own patch
of ground floats on top of the real one. Draw the building.

## Match the reference's palette, not its impression

Working from a mockup, sample it. The kiva went from a warm sandstone ramp to
a **pale cool grey** drum under a **warm earth** roof because that contrast is
what the reference was actually doing, and it is what makes the hatch read.
"Roughly the right brown" is how a set drifts into porridge.

## Form before finish

The meeting house only started working when it stopped being a gable and
became what the reference showed: a timber drum under a cone, drawn ring by
ring from the eave up so each course of thatch overlaps the one behind it.
No amount of shading fixes the wrong solid.

Forms are per-recipe but a `looks` entry can override `form`, so a new shape
can join an existing recipe without new venue wiring — the round meeting house
is look 0 of `carved-gable`, and the men's house beside it stays rectangular.
New forms need a height branch in `hall_recipes` or the sprite is cropped.
