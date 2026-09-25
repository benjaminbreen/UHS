"""Build the four-direction fauna set (horses and rabbits) plus review sheets."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from art.fauna_c import fauna_c, looks as looks_c, PALETTES, STATES, NATIVE_SIZES, STANDING_SIZES, DIRECTIONS
from art.atlas import pack_atlas
from art import fauna_d, fox, proboscidean, cervid, felid, grazer, ursid

root = Path(__file__).resolve().parent.parent
out = root / "public/fauna-c"
out.mkdir(exist_ok=True)
# Set D is the working animals, drawn on a later rig and in several forms and
# coats; it shares this atlas because it shares the four facings.
sprites = {**fauna_c(), **fauna_d.fauna_d(), **fox.fauna_fox()}
looks = {**looks_c(), **fauna_d.looks(), **fox.looks()}
PALETTES = {**PALETTES, **fauna_d.PALETTES, **fox.PALETTES}
STATES = {**STATES, **fauna_d.STATES, **fox.STATES}
NATIVE_SIZES = {**NATIVE_SIZES, **fauna_d.NATIVE_SIZES, **fox.NATIVE_SIZES}
STANDING_SIZES = {**STANDING_SIZES, **{k: (w, h - fauna_d.HEADROOM[k] - 3) for k, (w, h) in fauna_d.NATIVE_SIZES.items()}, **fox.STANDING_SIZES}
for name, im in sprites.items():
    assert set(im.getchannel("A").getdata()) <= {0, 255}, name
    assert len(im.getcolors(im.width * im.height)) <= 24, name
    assert im.getbbox(), name
pack_atlas(sprites, out, "atlas", 1024)
(out / "studies.json").write_text(json.dumps({
    species: {
        "palette": list(PALETTES[species].values()),
        "states": states,
        "directions": list(DIRECTIONS),
        "size": NATIVE_SIZES[species],
        "standing": STANDING_SIZES[species],
        **({"looks": looks[species]} if species in looks else {}),
    }
    for species, states in STATES.items()
}, indent=2) + "\n")

# The megafauna are several times the size of a fox and live only in the
# deep past or far north, so each rig gets its own sheet, fetched when one
# of its animals is in the world.
for rig_art, sprites_of, sheet in ((proboscidean, proboscidean.fauna_megafauna, "fauna-m"),
                                   (cervid, cervid.fauna_cervid, "fauna-r"),
                                   (felid, felid.fauna_felid, "fauna-f"),
                                   (grazer, grazer.fauna_grazer, "fauna-g"),
                                   (ursid, ursid.fauna_ursid, "fauna-u")):
    mega = sprites_of()
    for name, im in mega.items():
        assert set(im.getchannel("A").getdata()) <= {0, 255}, name
        assert len(im.getcolors(im.width * im.height)) <= 24, name
    mega_out = root / "public" / sheet
    mega_out.mkdir(exist_ok=True)
    pack_atlas(mega, mega_out, "atlas", 1024)
    (mega_out / "studies.json").write_text(json.dumps({
        species: {
            "palette": list(rig_art.PALETTES[species].values()),
            "states": states,
            "directions": list(rig_art.DIRECTIONS),
            "size": rig_art.NATIVE_SIZES[species],
            "standing": rig_art.STANDING_SIZES[species],
            "looks": rig_art.looks()[species],
        }
        for species, states in rig_art.STATES.items()
    }, indent=2) + "\n")

artifacts = root / "artifacts/fauna-lab"
artifacts.mkdir(exist_ok=True, parents=True)
scale = 4
rows = [(sp, st, d) for sp in STATES for st in STATES[sp] for d in DIRECTIONS]
cell_w = max(NATIVE_SIZES[s][0] for s in STATES) * scale + 10
cell_h = max(NATIVE_SIZES[s][1] for s in STATES) * scale + 6


def sheet(frame):
    im = Image.new("RGB", (8 * cell_w + 150, len(rows) * cell_h + 30), "#829456")
    draw = ImageDraw.Draw(im)
    draw.text((10, 8), f"Fauna C - four directions - frame {frame + 1} of 8", fill="#172a2e")
    for r, (sp, st, d) in enumerate(rows):
        draw.text((8, 26 + r * cell_h + cell_h // 2 - 8), f"{sp}\n{st} {d}", fill="#172a2e")
        sprite = sprites[f"faunac-{sp}-{st}-{d}-{frame}"]
        big = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST)
        im.paste(big, (150 + 0 * cell_w, 26 + r * cell_h + (cell_h - big.height)), big)
        for f in range(8):
            other = sprites[f"faunac-{sp}-{st}-{d}-{f}"]
            b = other.resize((other.width * scale, other.height * scale), Image.Resampling.NEAREST)
            im.paste(b, (150 + f * cell_w, 26 + r * cell_h + (cell_h - b.height)), b)
    return im


sheet(0).save(artifacts / "c-contact-sheet.png")

# One lineup row per direction proves the size hierarchy holds at every angle.
order = ["horse", "foal", "rabbit", "rabbit-kit"]
frames = []
for f in range(8):
    im = Image.new("RGB", (4 * 200 + 40, len(DIRECTIONS) * 190 + 40), "#829456")
    draw = ImageDraw.Draw(im)
    draw.text((10, 8), f"Fauna C - shared scale - frame {f + 1}", fill="#172a2e")
    for row, d in enumerate(DIRECTIONS):
        for col, sp in enumerate(order):
            sprite = sprites[f"faunac-{sp}-wander-{d}-{f}"]
            big = sprite.resize((sprite.width * scale, sprite.height * scale), Image.Resampling.NEAREST)
            im.paste(big, (20 + col * 200 + (200 - big.width) // 2, 30 + row * 190 + 170 - big.height), big)
    frames.append(im)
frames[0].save(artifacts / "c-lineup.png")
frames[0].save(artifacts / "c-animation.gif", save_all=True, append_images=frames[1:], duration=120, loop=0)
print(f"{len(sprites)} C frames -> {out}")
