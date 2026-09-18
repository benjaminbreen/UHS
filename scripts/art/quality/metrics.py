"""Measurements for one sprite. Numbers only: no thresholds, no verdicts.

The thresholds live in the lab, where they can be moved with a slider without
rebuilding the art. A metric earns its place here only if some drawing mistake
we have actually made would move it.
"""
import colorsys
from math import sqrt

# Rec. 709: a yellow thatch and a blue slate of the same "brightness" are not
# the same value, and a per-channel average says they are.
def luminance(p):
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]


def _hsv(p):
    return colorsys.rgb_to_hsv(p[0] / 255, p[1] / 255, p[2] / 255)


def _hue_mean(colours):
    """Circular mean, because the average of red 350 and red 10 is not 180."""
    import math
    if not colours:
        return None
    xs = sum(math.cos(_hsv(c)[0] * 2 * math.pi) * _hsv(c)[1] for c in colours)
    ys = sum(math.sin(_hsv(c)[0] * 2 * math.pi) * _hsv(c)[1] for c in colours)
    if abs(xs) < 1e-9 and abs(ys) < 1e-9:
        return None
    return (math.degrees(math.atan2(ys, xs)) % 360)


def measure(image, ramp_colours=None, ramp_list=None):
    px = image.load()
    w, h = image.size
    opaque = {}
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3]:
                opaque[(x, y)] = p[:3]
    if not opaque:
        return {'pixels': 0, 'empty': True}

    values = list(opaque.values())
    lums = {c: luminance(c) for c in set(values)}
    lo = min(lums.values())
    hi = max(lums.values())
    span = max(hi - lo, 1e-6)
    counts = {}
    for c in values:
        counts[c] = counts.get(c, 0) + 1
    darkest = min(counts, key=lambda c: lums[c])

    xs = [x for x, _ in opaque]
    ys = [y for _, y in opaque]
    bw, bh = max(xs) - min(xs) + 1, max(ys) - min(ys) + 1

    m = {
        'pixels': len(opaque),
        'w': w, 'h': h,
        'fill': round(len(opaque) / (bw * bh), 4),
        'tones': len(counts),
    }

    # --- value ----------------------------------------------------------
    ordered = sorted(lums.values())
    weighted = sorted(luminance(c) for c in values)
    m['lumMin'] = round(lo, 1)
    m['lumMax'] = round(hi, 1)
    m['lumRange'] = round(span, 1)
    m['lumMean'] = round(sum(weighted) / len(weighted), 1)
    m['lumP10'] = round(weighted[len(weighted) // 10], 1)
    m['lumP90'] = round(weighted[len(weighted) * 9 // 10], 1)
    # The widest jump between tones actually used, as a share of the range. A
    # five-step ramp stretched over a big object bands; this is how it shows.
    gaps = [b - a for a, b in zip(ordered, ordered[1:])]
    m['banding'] = round(max(gaps) / span, 3) if gaps else 0.0

    # --- outline --------------------------------------------------------
    # A boundary pixel is an opaque pixel with a transparent 4-neighbour.
    boundary = [xy for xy in opaque
                if any((xy[0] + dx, xy[1] + dy) not in opaque
                       for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))]
    dark_cut = lo + 0.12 * span
    dark_edge = [xy for xy in boundary if lums[opaque[xy]] <= dark_cut]
    # How much of the silhouette is ringed in near-black. A tinted rim scores
    # low here; c.outline(ramp[0]) scores near 1.
    m['ringDark'] = round(len(dark_edge) / len(boundary), 3) if boundary else 0.0
    m['darkestFrac'] = round(counts[darkest] / len(opaque), 3)

    # Thickness: from each dark boundary pixel, how far inward the dark run
    # goes. Two thick pixels of black is the thing that reads as crude.
    depths = []
    for (x, y) in dark_edge[:4000]:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            if (x - dx, y - dy) in opaque:
                continue  # step inward, away from the transparent side
            run = 0
            cx, cy = x, y
            while (cx, cy) in opaque and lums[opaque[(cx, cy)]] <= dark_cut and run < 6:
                run += 1
                cx, cy = cx + dx, cy + dy
            depths.append(run)
            break
    m['ringDepth'] = round(sum(depths) / len(depths), 2) if depths else 0.0

    # An outline is not bad for existing. It is bad for being harsher and more
    # neutral than the thing it surrounds. A hue-matched rim one step below the
    # body is what the trees and the fauna do; near-black on a warm object is
    # what the wells do. These two separate them.
    rim = [opaque[xy] for xy in boundary]
    inner = [opaque[(x + dx, y + dy)]
             for (x, y) in boundary
             for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))
             if (x + dx, y + dy) in opaque
             and lums[opaque[(x + dx, y + dy)]] > dark_cut]
    if rim and inner:
        rim_lum = sum(lums[c] for c in rim) / len(rim)
        inner_lum = sum(lums[c] for c in inner) / len(inner)
        m['rimGap'] = round((inner_lum - rim_lum) / span, 3)
        rim_sat = sum(_hsv(c)[1] for c in rim) / len(rim)
        body_sat = sum(_hsv(c)[1] for c in inner) / len(inner)
        # Under 1 means the rim has had the colour drained out of it, which is
        # what a shared near-black ink does to every material at once.
        m['rimChroma'] = round(rim_sat / body_sat, 3) if body_sat > 0.02 else 1.0
    else:
        m['rimGap'] = 0.0
        m['rimChroma'] = 1.0

    # --- modelling ------------------------------------------------------
    # What separates a modelled form from a crude one is not the outline. It is
    # whether the body is a lit surface or a single flat colour with a dark
    # patch on it. Measured on the interior, because the rim is a different job.
    interior = {xy: c for xy, c in opaque.items() if xy not in set(boundary)}
    if interior:
        inner_counts = {}
        for c in interior.values():
            inner_counts[c] = inner_counts.get(c, 0) + 1
        m['flatTone'] = round(max(inner_counts.values()) / len(interior), 3)
        m['interiorTones'] = len(inner_counts)
        # Value jumps between touching pixels. A turned surface steps a little
        # many times; a flat body with a shadow pasted on steps a lot, rarely.
        pairs = jumps = 0
        for (x, y), c in interior.items():
            for dx, dy in ((1, 0), (0, 1)):
                n = interior.get((x + dx, y + dy))
                if n is None:
                    continue
                pairs += 1
                if abs(lums[c] - lums[n]) > 0.25 * span:
                    jumps += 1
        m['hardEdges'] = round(jumps / pairs, 3) if pairs else 0.0
    else:
        m['flatTone'] = 1.0
        m['interiorTones'] = 1
        m['hardEdges'] = 0.0

    # --- palette --------------------------------------------------------
    if ramp_colours is not None:
        off = 0
        distance = 0.0
        hits = {}
        for c, n in counts.items():
            name = ramp_colours.get(c)
            if name:
                hits[name.split(':')[0]] = hits.get(name.split(':')[0], 0) + n
                continue
            off += n
            if ramp_list:
                distance += n * min(
                    sqrt(sum((a - b) ** 2 for a, b in zip(c, r)))
                    for r in ramp_list)
        m['offRamp'] = round(off / len(opaque), 3)
        m['offRampDist'] = round(distance / max(off, 1), 1)
        m['ramps'] = sorted(hits, key=hits.get, reverse=True)[:3]

    # --- hue structure --------------------------------------------------
    shadow = [c for c in counts if lums[c] <= lo + span / 3]
    light = [c for c in counts if lums[c] >= hi - span / 3]
    sat = sum(_hsv(c)[1] * n for c, n in counts.items()) / len(opaque)
    m['chroma'] = round(sat, 3)
    a, b = _hue_mean(shadow), _hue_mean(light)
    if a is not None and b is not None:
        # Positive means the shadows sit clockwise of the lights on the wheel,
        # i.e. cooler. Zero means the ramp is one hue at several brightnesses,
        # which is the flat look.
        delta = (a - b + 180) % 360 - 180
        m['hueShift'] = round(delta, 1)
    m['hueSpread'] = round(
        max((_hsv(c)[1] for c in counts), default=0)
        - min((_hsv(c)[1] for c in counts), default=0), 3)

    # --- form -----------------------------------------------------------
    # Linear fit of value against position. A lit form has a gradient; a field
    # of random tones has none. This is what a flat roof scores near zero on.
    for axis, index in (('Y', 1), ('X', 0)):
        pts = [(xy[index], lums[c]) for xy, c in opaque.items()]
        n = len(pts)
        mx = sum(p[0] for p in pts) / n
        my = sum(p[1] for p in pts) / n
        num = sum((p[0] - mx) * (p[1] - my) for p in pts)
        den = sum((p[0] - mx) ** 2 for p in pts)
        slope = num / den if den else 0.0
        extent = (bh if axis == 'Y' else bw)
        m[f'grad{axis}'] = round(slope * extent / span, 3)

    # Checkerboard share: a pixel whose four neighbours are all a different
    # single tone from itself. Some dither is right; a whole sprite of it is
    # texture standing in for form.
    checker = 0
    for (x, y), c in opaque.items():
        neighbours = [opaque.get((x + dx, y + dy))
                      for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))]
        neighbours = [n for n in neighbours if n]
        if len(neighbours) == 4 and all(n != c for n in neighbours) \
           and len(set(neighbours)) == 1:
            checker += 1
    m['dither'] = round(checker / len(opaque), 3)

    # --- mechanical -----------------------------------------------------
    alpha = {px[x, y][3] for y in range(h) for x in range(w)}
    m['binaryAlpha'] = not (alpha - {0, 255})
    lit_cut = lo + 0.42 * span

    def cut(pixels):
        run = best = interior = 0
        for p in pixels:
            if p[3]:
                run += 1
                best = max(best, run)
                if luminance(p) > lit_cut:
                    interior += 1
            else:
                run = 0
        return best >= 4 and interior > best * 0.65

    m['edgeCut'] = sorted(
        edge for edge, pixels in (
            ('top', [px[x, 0] for x in range(w)]),
            ('left', [px[0, y] for y in range(h)]),
            ('right', [px[w - 1, y] for y in range(h)]),
        ) if cut(pixels))

    m['top'] = [('#%02x%02x%02x' % c, n)
                for c, n in sorted(counts.items(), key=lambda kv: -kv[1])[:8]]
    return m
