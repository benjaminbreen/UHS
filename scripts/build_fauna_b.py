"""Build the B fauna study set next to the A set, plus A/B review sheets."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from art.fauna_b import fauna_b, PALETTES, STATES, NATIVE_SIZES
from art.atlas import pack_atlas

root = Path(__file__).resolve().parent.parent
out = root / "public/fauna-b"
out.mkdir(exist_ok=True)
sprites = fauna_b()
for name, im in sprites.items():
    assert set(im.getchannel("A").getdata()) <= {0, 255}, name
    assert len(im.getcolors(im.width * im.height)) <= 24, name
    bbox = im.getbbox()
    assert bbox and bbox[0] >= 0 and bbox[1] >= 0 and bbox[2] <= im.width and bbox[3] <= im.height, name
pack_atlas(sprites, out, "atlas", 512)
(out / "studies.json").write_text(json.dumps({species: {"palette": list(PALETTES[species].values()), "states": states, "size": NATIVE_SIZES[species]} for species, states in STATES.items()}, indent=2) + "\n")

artifacts = root / "artifacts/fauna-lab"
artifacts.mkdir(exist_ok=True, parents=True)
scale = 4
species_order = list(STATES)


def sheet(frame_fn, title):
    rows = []
    for species in species_order:
        rows.append([(species, state) for state in STATES[species]])
    cell_w = max(NATIVE_SIZES[s][0] for s in species_order) * scale + 12
    cell_h = max(NATIVE_SIZES[s][1] for s in species_order) * scale + 26
    columns = max(len(r) for r in rows)
    im = Image.new("RGB", (columns * cell_w + 20, len(rows) * cell_h + 40), "#829456")
    draw = ImageDraw.Draw(im)
    draw.text((10, 8), title, fill="#172a2e")
    for r, row in enumerate(rows):
        for ci, (species, state) in enumerate(row):
            sprite = frame_fn(species, state)
            big = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST)
            x = 10 + ci * cell_w + (cell_w - big.width) // 2
            y = 30 + r * cell_h + (cell_h - 24 - big.height)
            im.paste(big, (x, y), big)
            draw.text((10 + ci * cell_w + 4, 30 + r * cell_h + cell_h - 20), f"{species} / {state}", fill="#172a2e")
    return im


sheet(lambda s, st: sprites[f"faunab-{s}-{st}-1"], "Fauna B · frame 1 of every state").save(artifacts / "b-contact-sheet.png")
frames = [sheet(lambda s, st, f=f: sprites[f"faunab-{s}-{st}-{f}"], f"Fauna B · frame {f + 1}") for f in range(8)]
frames[0].save(artifacts / "b-animation.gif", save_all=True, append_images=frames[1:], duration=120, loop=0)

# Side-by-side A/B: the A frames come from the built A atlas.
a_dir = root / "public/fauna"
pairs = [("house-sparrow", "perch"), ("rock-dove", "perch"), ("chicken", "idle"), ("sheep", "idle"), ("red-deer", "idle"), ("gray-wolf", "idle"),
         ("house-sparrow", "flight"), ("rock-dove", "flight"), ("chicken", "wander"), ("sheep", "wander"), ("red-deer", "wander"), ("gray-wolf", "wander")]
cmp_frames = []
for f in range(8):
    im = Image.new("RGB", (len(pairs) // 2 * 190 + 20, 2 * 2 * 190 + 60), "#829456")
    draw = ImageDraw.Draw(im)
    draw.text((10, 8), f"A (Astra) above · B (Fable) below · frame {f + 1}", fill="#172a2e")
    for i, (species, state) in enumerate(pairs):
        col, row = i % 6, i // 6
        for v, (prefix, folder) in enumerate((("fauna", a_dir), ("faunab", None))):
            name = f"{prefix}-{species}-{state}-{f}"
            sprite = Image.open(folder / f"{name}.png").convert("RGBA") if folder else sprites[name]
            big = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST)
            x = 10 + col * 190 + (190 - big.width) // 2
            y = 30 + (row * 2 + v) * 190 + 160 - big.height
            im.paste(big, (x, y), big)
    cmp_frames.append(im)
cmp_frames[1].save(artifacts / "ab-comparison.png")
cmp_frames[0].save(artifacts / "ab-comparison.gif", save_all=True, append_images=cmp_frames[1:], duration=120, loop=0)
print(f"{len(sprites)} B frames → {out}")
