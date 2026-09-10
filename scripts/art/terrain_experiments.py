"""Extract terrain-lab source art from the third-party packs in
`tilesets for experimenting/` into public/terrain-lab/.

Blob mask indices are read off the artwork itself (probe each tile's 3x3
grass/dirt pattern) rather than assuming the sheet's authoring convention.
"""

import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "tilesets for experimenting")
OUT = os.path.join(ROOT, "public", "terrain-lab")
T = 16

# Blob neighbour bits, clockwise from north.
N, NE, E, SE, S, SW, W, NW = (1 << i for i in range(8))
EDGE_OF_CORNER = {NE: (N, E), SE: (S, E), SW: (S, W), NW: (N, W)}


def canonical(mask):
    """A corner only matters when both of its edges are filled."""
    for corner, (a, b) in EDGE_OF_CORNER.items():
        if mask & corner and not (mask & a and mask & b):
            mask &= ~corner
    return mask


def probe_mask(im, tx, ty, fill_colors):
    px = im.load()

    def at(ox, oy):
        hits = 0
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                x = min(T - 1, max(0, ox + dx))
                y = min(T - 1, max(0, oy + dy))
                if px[tx * T + x, ty * T + y][:3] in fill_colors:
                    hits += 1
        return hits >= 5

    if not at(8, 8):
        return None
    probes = [(N, 8, 1), (NE, 14, 1), (E, 14, 8), (SE, 14, 14),
              (S, 8, 14), (SW, 1, 14), (W, 1, 8), (NW, 1, 1)]
    mask = 0
    for bit, x, y in probes:
        if at(x, y):
            mask |= bit
    return canonical(mask)


def blob_table(path, fill_colors, cols, rows):
    """mask -> tile index, plus the tile index of the solid fill."""
    im = Image.open(path).convert("RGBA")
    table = {}
    seen = []
    for ty in range(rows):
        for tx in range(cols):
            i = ty * cols + tx
            mask = probe_mask(im, tx, ty, fill_colors)
            seen.append(mask)
            if mask is not None and mask not in table:
                table[mask] = i
    return table, seen


GRASS_FILL = {(114, 143, 71), (156, 184, 81), (78, 105, 58), (52, 77, 48)}
DIRT_FILL = {(135, 91, 57), (102, 65, 45)}


def copy(src, dst):
    Image.open(os.path.join(SRC, src)).convert("RGBA").save(os.path.join(OUT, dst))


def crop(src, dst, box):
    Image.open(os.path.join(SRC, src)).convert("RGBA").crop(box).save(os.path.join(OUT, dst))


def sheet(src, dst, cells, cols):
    """Gather scattered 16px cells from one sheet into a compact strip."""
    im = Image.open(os.path.join(SRC, src)).convert("RGBA")
    rows = (len(cells) + cols - 1) // cols
    out = Image.new("RGBA", (cols * T, rows * T))
    for i, (cx, cy) in enumerate(cells):
        tile = im.crop((cx * T, cy * T, cx * T + T, cy * T + T))
        out.paste(tile, ((i % cols) * T, (i // cols) * T))
    out.save(os.path.join(OUT, dst))
    return len(cells)


# GRASS+ scatter cells are drawn onto an opaque turf backdrop. The backdrop
# colours are whatever fills the sparsest cell of each group, so read them
# there and knock them out of every cell in the group.
def modal(im, cx, cy):
    counts = {}
    for p in im.crop((cx * T, cy * T, cx * T + T, cy * T + T)).getdata():
        counts[p[:3]] = counts.get(p[:3], 0) + 1
    return max(counts.items(), key=lambda kv: kv[1])


def sheet_keyed(src, dst, groups, cols):
    im = Image.open(os.path.join(SRC, src)).convert("RGBA")
    cells = [c for g in groups for c in g]
    rows = (len(cells) + cols - 1) // cols
    out = Image.new("RGBA", (cols * T, rows * T))
    i = 0
    for group in groups:
        base = modal(im, *group[0])[0]
        for cx, cy in group:
            tile = im.crop((cx * T, cy * T, cx * T + T, cy * T + T))
            keys = {base}
            own, count = modal(im, cx, cy)
            if count >= 90:
                keys.add(own)
            tile.putdata([(0, 0, 0, 0) if p[:3] in keys else p
                          for p in tile.getdata()])
            out.paste(tile, ((i % cols) * T, (i // cols) * T))
            i += 1
    out.save(os.path.join(OUT, dst))
    return len(cells)


GEN = os.path.join(ROOT, "src", "render", "generated")


def emit_swatch_luma(turf_cells):
    """Bake the turf swatches as normalised luma for the renderer.

    The terrain rasteriser runs in a worker that cannot fetch a PNG, and the
    swatches only ever contribute relative light and shade, so ship the numbers
    rather than the image.
    """
    im = Image.open(os.path.join(SRC, "GRASS+.png")).convert("RGBA")
    swatches = []
    for cx, cy in turf_cells:
        tile = im.crop((cx * T, cy * T, cx * T + T, cy * T + T))
        luma = [
            (p[0] * 0.3 + p[1] * 0.59 + p[2] * 0.11) / 255 for p in tile.getdata()
        ]
        lo, hi = min(luma), max(luma)
        span = max(0.001, hi - lo)
        swatches.append([round((l - lo) / span * 255) for l in luma])
    with open(os.path.join(GEN, "turf-swatches.json"), "w") as f:
        json.dump({"tile": T, "swatches": swatches}, f)
    print("swatch luma", len(swatches))


def main():
    os.makedirs(OUT, exist_ok=True)
    gd = "Grass And Dirt Tileset 1.1"
    copy(f"{gd}/grass_tileset.png", "blob-grass.png")
    copy(f"{gd}/dirt_tileset.png", "blob-dirt.png")
    copy(f"{gd}/variation_tiles.png", "blob-variations.png")

    grass_table, grass_seen = blob_table(
        os.path.join(SRC, gd, "grass_tileset.png"), GRASS_FILL, 8, 6)
    dirt_table, dirt_seen = blob_table(
        os.path.join(SRC, gd, "dirt_tileset.png"), DIRT_FILL, 8, 6)

    # Mystic Woods plains: the plateau block (top cap, fill, earth face, foot)
    # plus the two inner-corner columns beside it.
    crop("mystic_woods_free_2/sprites/tilesets/plains.png", "cliff.png",
         (0, 4 * T, 6 * T, 8 * T))

    # GRASS+ turf: seamless 16px fills, brightest and densest first.
    turf = [(0, 8), (0, 9), (0, 4), (0, 6), (2, 8), (2, 9),
            (6, 8), (6, 9), (8, 8), (8, 9), (2, 0), (2, 1)]
    sheet("GRASS+.png", "turf.png", turf, 6)

    flowers = [(0, 10), (1, 10), (2, 10), (3, 10), (4, 10), (5, 10)]
    pebbles = [(0, 11), (1, 11), (2, 11), (3, 11), (4, 11), (5, 11)]
    rocks = [(0, 13), (1, 13), (2, 13), (5, 13), (6, 13), (7, 13)]
    scatter = [flowers, pebbles, rocks]
    sheet_keyed("GRASS+.png", "scatter.png", scatter, 6)

    meta = {
        "tile": T,
        "blob": {
            "cols": 8, "rows": 6,
            "grass": {str(k): v for k, v in grass_table.items()},
            "dirt": {str(k): v for k, v in dirt_table.items()},
        },
        "cliff": {"cols": 6, "rows": 4},
        "turf": {"cols": 6, "count": len(turf)},
        "scatter": {"cols": 6, "count": 18,
                    "flowers": [0, 6], "pebbles": [6, 12], "rocks": [12, 18]},
    }
    with open(os.path.join(OUT, "tiles.json"), "w") as f:
        json.dump(meta, f, indent=1)

    emit_swatch_luma(turf)

    print("grass masks", len(grass_table), "of 48 tiles; unmatched",
          grass_seen.count(None))
    print("dirt masks", len(dirt_table), "unmatched", dirt_seen.count(None))


if __name__ == "__main__":
    main()
