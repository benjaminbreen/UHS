"""Build original fauna studies independently of playable-world art."""
from pathlib import Path
from PIL import Image, ImageDraw
from art.fauna import fauna
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

selected = [
    "fauna-house-sparrow-flight-1",
    "fauna-rock-dove-landing-1",
    "fauna-chicken-forage-1",
    "fauna-sheep-graze-1",
    "fauna-red-deer-idle-0",
    "fauna-gray-wolf-stalk-1",
]
review = Image.new("RGB", (1080, 300), "#829456")
draw = ImageDraw.Draw(review)
for i, name in enumerate(selected):
    im = sprites[name]
    enlarged = im.resize((im.width * 4, im.height * 4), Image.Resampling.NEAREST)
    x = i * 180 + (180 - enlarged.width) // 2
    review.paste(enlarged, (x, 205 - enlarged.height), enlarged)
    draw.text((i * 180 + 14, 238), name.removeprefix("fauna-").rsplit("-", 2)[0], fill="#172a2e")
artifacts = root / "artifacts/fauna-lab"
artifacts.mkdir(exist_ok=True, parents=True)
review.save(artifacts / "contact-sheet.png")
