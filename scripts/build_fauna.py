"""Build original fauna studies independently of playable-world art."""
from pathlib import Path
import json
from PIL import Image, ImageDraw
from art.fauna import fauna, PALETTES, STATES
from art.atlas import pack_atlas

root = Path(__file__).resolve().parent.parent
out = root / "public/fauna"
out.mkdir(exist_ok=True)
for old in out.glob("fauna-*.png"):
    old.unlink()
sprites = fauna()
for name, im in sprites.items():
    assert set(im.getchannel("A").getdata()) <= {0, 255}, name
    assert len(im.getcolors(im.width * im.height)) <= 24, name
    bbox = im.getbbox()
    assert bbox and bbox[0] > 0 and bbox[1] > 0 and bbox[2] < im.width and bbox[3] < im.height, name
    im.save(out / f"{name}.png")
pack_atlas(sprites, out, "atlas", 512)
(out / "studies.json").write_text(json.dumps({species: {"palette": PALETTES[species], "states": states} for species, states in STATES.items()}, indent=2) + "\n")

selected = [
    "fauna-house-sparrow-flight-1",
    "fauna-rock-dove-landing-1",
    "fauna-chicken-forage-1",
    "fauna-sheep-graze-1",
    "fauna-red-deer-idle-0",
    "fauna-gray-wolf-stalk-1",
]
review = Image.new("RGB", (900, 600), "#829456")
draw = ImageDraw.Draw(review)
for i, name in enumerate(selected):
    im = sprites[name]
    enlarged = im.resize((im.width * 4, im.height * 4), Image.Resampling.NEAREST)
    x = (i % 3) * 300 + (300 - enlarged.width) // 2
    y = (i // 3) * 300
    review.paste(enlarged, (x, y + 242 - enlarged.height), enlarged)
    draw.text(((i % 3) * 300 + 24, y + 267), name.removeprefix("fauna-").rsplit("-", 2)[0], fill="#172a2e")
artifacts = root / "artifacts/fauna-lab"
artifacts.mkdir(exist_ok=True, parents=True)
review.save(artifacts / "contact-sheet.png")
cycles = [("house-sparrow", "flight"), ("rock-dove", "flight"), ("chicken", "wander"), ("sheep", "wander"), ("red-deer", "flee"), ("gray-wolf", "chase")]
animation = []
for frame in range(8):
    sheet = Image.new("RGB", (900, 600), "#829456")
    draw = ImageDraw.Draw(sheet)
    for i, (species, state) in enumerate(cycles):
        im = sprites[f"fauna-{species}-{state}-{frame}"]
        enlarged = im.resize((im.width * 4, im.height * 4), Image.Resampling.NEAREST)
        x, y = (i % 3) * 300, (i // 3) * 300
        sheet.paste(enlarged, (x + (300-enlarged.width)//2, y+242-enlarged.height), enlarged)
        draw.text((x+24, y+267), f"{species} / {state}", fill="#172a2e")
    animation.append(sheet)
animation[0].save(artifacts / "animation-study.gif", save_all=True, append_images=animation[1:], duration=110, loop=0)
