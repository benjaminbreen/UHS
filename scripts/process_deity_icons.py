"""Derive transparent, palette-limited deity sprites from approved concept sheets."""

from __future__ import annotations

import json
import unicodedata
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageStat


ROOT = Path(__file__).resolve().parent.parent
ASSET_ROOT = ROOT / "public" / "beliefs" / "deities" / "v1"
SOURCE_ROOT = ASSET_ROOT / "sources"
EXTRACTED_ROOT = ASSET_ROOT / "extracted"
ICON_ROOT = ASSET_ROOT / "icons"
SPRITE_SIZE = 64
ATLAS_COLUMNS = 8

# A shared palette makes later manual cleanup and renderer color treatment predictable.
PALETTE = [
    (8, 18, 35),
    (23, 31, 47),
    (57, 48, 45),
    (99, 67, 43),
    (139, 91, 48),
    (183, 125, 61),
    (222, 169, 76),
    (246, 211, 130),
    (247, 234, 190),
    (113, 47, 43),
    (184, 70, 48),
    (91, 70, 118),
    (49, 79, 139),
    (59, 137, 178),
    (48, 139, 128),
    (65, 128, 74),
]

SHEETS = [
    (
        "named-deities-01.png",
        [
            ("inanna-ishtar", "Inanna/Ishtar"),
            ("athena", "Athena"),
            ("anubis", "Anubis"),
            ("thor", "Thor"),
            ("quetzalcoatl", "Quetzalcoatl"),
            ("amaterasu", "Amaterasu"),
            ("ganesha", "Ganesha"),
            ("shango", "Shango"),
            ("mazu", "Mazu"),
            ("inti", "Inti"),
            ("brigid", "Brigid"),
            ("sedna", "Sedna"),
            ("zeus", "Zeus"),
            ("osiris", "Osiris"),
            ("freyja", "Freyja"),
            ("huitzilopochtli", "Huitzilopochtli"),
        ],
    ),
    (
        "named-deities-02.png",
        [
            ("amun-ra", "Amun-Ra"),
            ("isis", "Isis"),
            ("hathor", "Hathor"),
            ("sekhmet", "Sekhmet"),
            ("enlil", "Enlil"),
            ("enki-ea", "Enki/Ea"),
            ("marduk", "Marduk"),
            ("nanna-sin", "Nanna/Sin"),
            ("baal-hadad", "Baal-Hadad"),
            ("asherah", "Asherah"),
            ("apollo", "Apollo"),
            ("artemis", "Artemis"),
            ("demeter", "Demeter"),
            ("dionysus", "Dionysus"),
            ("odin", "Odin"),
            ("perun", "Perun"),
        ],
    ),
    (
        "named-deities-03.png",
        [
            ("vishnu", "Vishnu"),
            ("shiva", "Shiva"),
            ("durga", "Durga"),
            ("lakshmi", "Lakshmi"),
            ("indra", "Indra"),
            ("guanyin", "Guanyin"),
            ("jade-emperor", "Jade Emperor"),
            ("guandi", "Guandi"),
            ("inari", "Inari"),
            ("hachiman", "Hachiman"),
            ("ogun", "Ogun"),
            ("oshun", "Oshun"),
            ("tlaloc", "Tlaloc"),
            ("tezcatlipoca", "Tezcatlipoca"),
            ("viracocha", "Viracocha"),
            ("tangaroa", "Tangaroa"),
        ],
    ),
    (
        "named-deities-04.png",
        [
            ("horus", "Horus"),
            ("ptah", "Ptah"),
            ("thoth", "Thoth"),
            ("hera", "Hera"),
            ("poseidon", "Poseidon"),
            ("ares", "Ares"),
            ("aphrodite", "Aphrodite"),
            ("hephaestus", "Hephaestus"),
            ("hermes", "Hermes"),
            ("jupiter", "Jupiter"),
            ("juno", "Juno"),
            ("mars", "Mars"),
            ("minerva", "Minerva"),
            ("neptune", "Neptune"),
            ("diana", "Diana"),
            ("vesta", "Vesta"),
        ],
    ),
    (
        "named-deities-05.png",
        [
            ("ahura-mazda", "Ahura Mazda"),
            ("mithra", "Mithra"),
            ("anahita", "Anahita"),
            ("angra-mainyu", "Angra Mainyu"),
            ("tengri", "Tengri"),
            ("etugen", "Etügen"),
            ("umai", "Umai"),
            ("erlik", "Erlik"),
            ("pachamama", "Pachamama"),
            ("illapa", "Illapa"),
            ("mama-quilla", "Mama Quilla"),
            ("mama-cocha", "Mama Cocha"),
            ("kinich-ajaw", "K'inich Ajaw"),
            ("itzamna", "Itzamna"),
            ("chaac", "Chaac"),
            ("cocijo", "Cocijo"),
        ],
    ),
    (
        "named-deities-06.png",
        [
            ("olorun", "Olorun"),
            ("orunmila", "Orunmila"),
            ("yemoja", "Yemoja"),
            ("eshu-eleggua", "Eshu/Eleggua"),
            ("rangi", "Rangi"),
            ("papa", "Papa"),
            ("tane", "Tāne"),
            ("rongo", "Rongo"),
            ("krishna", "Krishna"),
            ("parvati", "Parvati"),
            ("murugan", "Murugan"),
            ("brahma", "Brahma"),
            ("lugus", "Lugus"),
            ("taranis", "Taranis"),
            ("epona", "Epona"),
            ("brigantia", "Brigantia"),
        ],
    ),
    (
        "named-deities-07.png",
        [
            ("ashur", "Ashur"),
            ("anu", "Anu"),
            ("adad", "Adad"),
            ("ninhursag", "Ninhursag"),
            ("shamash", "Shamash"),
            ("el", "El"),
            ("anat", "Anat"),
            ("aphrodite-astarte", "Aphrodite-Astarte"),
            ("zeus-baal", "Zeus-Baal"),
            ("sraosha", "Sraosha"),
            ("atar", "Atar"),
            ("verethragna", "Verethragna"),
            ("amesha-spentas", "The Amesha Spentas"),
            ("al-lat", "Al-Lat"),
            ("al-uzza", "Al-Uzza"),
            ("manat", "Manat"),
        ],
    ),
    (
        "named-deities-08.png",
        [
            ("freyr", "Freyr"),
            ("tyr", "Tyr"),
            ("loki", "Loki"),
            ("veles", "Veles"),
            ("dazhbog", "Dazhbog"),
            ("toutatis", "Toutatis"),
            ("esus", "Esus"),
            ("belatucadros", "Belatucadros"),
            ("tabiti", "Tabiti"),
            ("thagimasadas", "Thagimasadas"),
            ("api", "Api"),
            ("papaios", "Papaios"),
            ("goitosyros", "Goitosyros"),
            ("argimpasa", "Argimpasa"),
            ("numi-torum", "Numi-Torum"),
            ("kaltash-ekwa", "Kaltash-Ekwa"),
        ],
    ),
    (
        "named-deities-09.png",
        [
            ("agni", "Agni"),
            ("varuna", "Varuna"),
            ("soma", "Soma"),
            ("surya", "Surya"),
            ("buddha", "The Buddha"),
            ("three-jewels", "The Three Jewels"),
            ("bodhisattvas", "Bodhisattvas"),
            ("amida-buddha", "Amida Buddha"),
            ("xiwangmu", "Xiwangmu"),
            ("city-god", "City God"),
            ("kitchen-god", "Kitchen God"),
            ("tudigong", "Tudigong"),
            ("devi-shakti", "Devi/Shakti"),
            ("bhairava", "Bhairava"),
            ("ganga", "Ganga"),
            ("khandoba", "Khandoba"),
        ],
    ),
    (
        "named-deities-10.png",
        [
            ("bathala", "Bathala"),
            ("lakapati", "Lakapati"),
            ("apolaki", "Apolaki"),
            ("dewi-sri", "Dewi Sri"),
            ("thagyamin", "Thagyamin"),
            ("min-mahagiri", "Min Mahagiri"),
            ("batara-guru", "Batara Guru"),
            ("degei", "Degei"),
            ("kane", "Kāne"),
            ("kanaloa", "Kanaloa"),
            ("lono", "Lono"),
            ("ku", "Kū"),
            ("pele", "Pele"),
            ("haumea", "Haumea"),
            ("maui", "Māui"),
            ("tagaloa", "Tagaloa"),
        ],
    ),
    (
        "named-deities-11.png",
        [
            ("kaggen", "ǀKaggen"),
            ("leza", "Leza"),
            ("mahrem", "Mahrem"),
            ("astar", "Astar"),
            ("mwari", "Mwari"),
            ("nehanda", "Nehanda"),
            ("unkulunkulu", "uNkulunkulu"),
            ("umvelinqangi", "uMvelinqangi"),
            ("chukwu", "Chukwu"),
            ("ala", "Ala"),
            ("asase-ya", "Asase Ya"),
            ("amma", "Amma"),
            ("nommo", "Nommo"),
            ("mawu-lisa", "Mawu-Lisa"),
            ("legba", "Legba"),
            ("engai-narok", "Engai Narok"),
        ],
    ),
    (
        "named-deities-12.png",
        [
            ("ai-apaec", "Ai Apaec"),
            ("supay", "Supay"),
            ("coyote", "Coyote"),
            ("wisakedjak", "Wisakedjak"),
            ("gluskap", "Gluskap"),
            ("iyatiku", "Iyatiku"),
            ("selu", "Selu"),
            ("sky-woman", "Sky Woman"),
            ("wakan-tanka", "Wakan Tanka"),
            ("tupa", "Tupã"),
            ("elal", "Elal"),
            ("katsinas", "Katsinas"),
            ("masauwu", "Masauwu"),
            ("kukulkan", "Kukulkan"),
            ("ix-chel", "Ix Chel"),
            ("ah-puch", "Ah Puch"),
        ],
    ),
]

SINGLE_SOURCES = [
    ("foundational/god-the-father.png", "god-the-father", "God the Father"),
    ("foundational/jesus-christ.png", "jesus-christ", "Jesus Christ"),
    ("foundational/holy-spirit.png", "holy-spirit", "The Holy Spirit"),
    ("foundational/allah.png", "allah", "Allah"),
    ("foundational/yhwh.png", "yhwh", "YHWH"),
    ("foundational/tian-heaven.png", "tian-heaven", "Tian / Heaven"),
]


def color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    # Green contributes most to perceived brightness; blue differences are less dominant.
    return ((a[0] - b[0]) ** 2 * 0.30 + (a[1] - b[1]) ** 2 * 0.59 + (a[2] - b[2]) ** 2 * 0.11) ** 0.5


def fill_holes(mask: Image.Image) -> Image.Image:
    pixels = mask.load()
    width, height = mask.size
    outside: set[tuple[int, int]] = set()
    queue: deque[tuple[int, int]] = deque()
    for x in range(width):
        for point in ((x, 0), (x, height - 1)):
            if pixels[point] == 0 and point not in outside:
                outside.add(point)
                queue.append(point)
    for y in range(height):
        for point in ((0, y), (width - 1, y)):
            if pixels[point] == 0 and point not in outside:
                outside.add(point)
                queue.append(point)
    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < width and 0 <= ny < height and pixels[nx, ny] == 0 and (nx, ny) not in outside:
                outside.add((nx, ny))
                queue.append((nx, ny))
    result = Image.new("L", mask.size, 255)
    output = result.load()
    for point in outside:
        output[point] = 0
    return result


def foreground_mask(cell: Image.Image) -> Image.Image:
    width, height = cell.size
    border = max(8, min(width, height) // 24)
    sample_pixels = []
    sample_pixels.extend(cell.crop((0, 0, width, border)).getdata())
    sample_pixels.extend(cell.crop((0, height - border, width, height)).getdata())
    sample_pixels.extend(cell.crop((0, 0, border, height)).getdata())
    sample_pixels.extend(cell.crop((width - border, 0, width, height)).getdata())
    samples = Image.new("RGB", (len(sample_pixels), 1))
    samples.putdata(sample_pixels)
    background = tuple(round(value) for value in ImageStat.Stat(samples).median[:3])

    seed = Image.new("L", cell.size)
    seed_pixels = seed.load()
    for y in range(height):
        for x in range(width):
            rgb = cell.getpixel((x, y))[:3]
            if color_distance(rgb, background) >= 30 or max(rgb) >= 72:
                seed_pixels[x, y] = 255

    # The generated sheets use roughly 4-6 source pixels per intended art pixel.
    # Expand into their dark contours, close small seams, then retain enclosed dark detail.
    seed = seed.filter(ImageFilter.MaxFilter(9)).filter(ImageFilter.MinFilter(5))
    return fill_holes(seed)


def nearest_palette(rgb: tuple[int, int, int]) -> tuple[int, int, int]:
    return min(PALETTE, key=lambda color: color_distance(rgb, color))


def remove_artifacts(image: Image.Image) -> None:
    pixels = image.load()
    width, height = image.size
    visited: set[tuple[int, int]] = set()
    dark = set(PALETTE[:2])
    for y in range(height):
        for x in range(width):
            if pixels[x, y][3] == 0 or (x, y) in visited:
                continue
            component = []
            queue = deque([(x, y)])
            visited.add((x, y))
            while queue:
                point = queue.popleft()
                component.append(point)
                px, py = point
                for neighbor in ((px - 1, py), (px + 1, py), (px, py - 1), (px, py + 1)):
                    nx, ny = neighbor
                    if 0 <= nx < width and 0 <= ny < height and neighbor not in visited and pixels[nx, ny][3]:
                        visited.add(neighbor)
                        queue.append(neighbor)
            xs = [point[0] for point in component]
            ys = [point[1] for point in component]
            dark_island = all(pixels[px, py][:3] in dark for px, py in component)
            bottom_speck = len(component) < 64 and min(ys) >= 55
            clipped_speck = len(component) < 20 and (min(xs) == 0 or max(xs) == width - 1)
            if dark_island or bottom_speck or clipped_speck:
                for px, py in component:
                    pixels[px, py] = (0, 0, 0, 0)


def make_sprite(cell: Image.Image) -> Image.Image:
    mask = foreground_mask(cell)
    bounds = mask.getbbox()
    if not bounds:
        raise ValueError("No foreground found")
    art = cell.crop(bounds)
    art_mask = mask.crop(bounds)
    maximum = SPRITE_SIZE - 8
    scale = min(maximum / art.width, maximum / art.height)
    size = (max(1, round(art.width * scale)), max(1, round(art.height * scale)))
    art = art.resize(size, Image.Resampling.BOX)
    art_mask = art_mask.resize(size, Image.Resampling.BOX).point(lambda value: 255 if value >= 96 else 0)

    output = Image.new("RGBA", (SPRITE_SIZE, SPRITE_SIZE))
    reduced = Image.new("RGBA", size)
    source = art.load()
    alpha = art_mask.load()
    target = reduced.load()
    for y in range(size[1]):
        for x in range(size[0]):
            if alpha[x, y]:
                target[x, y] = (*nearest_palette(source[x, y][:3]), 255)
    x = (SPRITE_SIZE - size[0]) // 2
    y = (SPRITE_SIZE - size[1]) // 2
    output.alpha_composite(reduced, (x, y))
    remove_artifacts(output)
    return output


def checkerboard(size: tuple[int, int], square: int = 8) -> Image.Image:
    image = Image.new("RGB", size, (224, 224, 219))
    draw = ImageDraw.Draw(image)
    for y in range(0, size[1], square):
        for x in range(0, size[0], square):
            if (x // square + y // square) % 2:
                draw.rectangle((x, y, x + square - 1, y + square - 1), fill=(190, 194, 194))
    return image


def main() -> None:
    initializing_final_icons = not EXTRACTED_ROOT.exists()
    EXTRACTED_ROOT.mkdir(parents=True, exist_ok=True)
    ICON_ROOT.mkdir(parents=True, exist_ok=True)
    records = []
    sprites: list[tuple[str, str, Image.Image]] = []
    for sheet_index, (filename, entries) in enumerate(SHEETS):
        sheet = Image.open(SOURCE_ROOT / filename).convert("RGB")
        for index, (slug, label) in enumerate(entries):
            row, column = divmod(index, 4)
            left = round(column * sheet.width / 4)
            right = round((column + 1) * sheet.width / 4)
            top = round(row * sheet.height / 4)
            bottom = round((row + 1) * sheet.height / 4)
            sprite = make_sprite(sheet.crop((left, top, right, bottom)))
            sprite.save(EXTRACTED_ROOT / f"{slug}.png", optimize=True)
            final_path = ICON_ROOT / f"{slug}.png"
            if initializing_final_icons or not final_path.exists():
                sprite.save(final_path, optimize=True)
            sprites.append((slug, label, Image.open(final_path).convert("RGBA")))
            records.append(
                {
                    "id": slug,
                    "label": label,
                    "file": f"icons/{slug}.png",
                    "extractedFile": f"extracted/{slug}.png",
                    "sheet": sheet_index + 1,
                    "sourceCell": {"row": row, "column": column},
                }
            )

    for filename, slug, label in SINGLE_SOURCES:
        source = Image.open(SOURCE_ROOT / filename).convert("RGB")
        sprite = make_sprite(source)
        sprite.save(EXTRACTED_ROOT / f"{slug}.png", optimize=True)
        final_path = ICON_ROOT / f"{slug}.png"
        if initializing_final_icons or not final_path.exists():
            sprite.save(final_path, optimize=True)
        sprites.append((slug, label, Image.open(final_path).convert("RGBA")))
        records.append(
            {
                "id": slug,
                "label": label,
                "file": f"icons/{slug}.png",
                "extractedFile": f"extracted/{slug}.png",
                "sourceFile": f"sources/{filename}",
            }
        )

    rows = (len(sprites) + ATLAS_COLUMNS - 1) // ATLAS_COLUMNS
    atlas = Image.new("RGBA", (ATLAS_COLUMNS * SPRITE_SIZE, rows * SPRITE_SIZE))
    for index, (_, _, sprite) in enumerate(sprites):
        x = index % ATLAS_COLUMNS * SPRITE_SIZE
        y = index // ATLAS_COLUMNS * SPRITE_SIZE
        atlas.alpha_composite(sprite, (x, y))
        records[index]["atlas"] = {"x": x, "y": y, "width": SPRITE_SIZE, "height": SPRITE_SIZE}
    atlas.save(ASSET_ROOT / "atlas.png", optimize=True)

    manifest = {
        "version": 1,
        "spriteSize": SPRITE_SIZE,
        "atlas": {"file": "atlas.png", "columns": ATLAS_COLUMNS, "rows": rows},
        "palette": ["#%02x%02x%02x" % color for color in PALETTE],
        "icons": records,
    }
    (ASSET_ROOT / "atlas.json").write_text(json.dumps(manifest, indent=2) + "\n")

    cell_width, cell_height = 144, 118
    proof = checkerboard((ATLAS_COLUMNS * cell_width, rows * cell_height), 8)
    draw = ImageDraw.Draw(proof)
    font = ImageFont.load_default(size=13)
    for index, (_, label, sprite) in enumerate(sprites):
        column, row = index % ATLAS_COLUMNS, index // ATLAS_COLUMNS
        x, y = column * cell_width, row * cell_height
        enlarged = sprite.resize((96, 96), Image.Resampling.NEAREST)
        proof.paste(enlarged, (x + 24, y + 2), enlarged)
        proof_label = (
            unicodedata.normalize("NFKD", label)
            .encode("ascii", "ignore")
            .decode()
        )
        text_box = draw.textbbox((0, 0), proof_label, font=font)
        text_width = text_box[2] - text_box[0]
        draw.rectangle((x, y + 98, x + cell_width - 1, y + cell_height - 1), fill=(8, 18, 35))
        draw.text((x + (cell_width - text_width) // 2, y + 101), proof_label, font=font, fill=(247, 234, 190))
    proof.save(ASSET_ROOT / "proof.png", optimize=True)
    print(f"Wrote {len(sprites)} icons, {atlas.size[0]}x{atlas.size[1]} atlas, and transparency proof")


if __name__ == "__main__":
    main()
