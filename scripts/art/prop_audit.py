"""Mechanical checks for prop studies.

These catch the mistakes that cost the most redraws: art cut off by the canvas
it was drawn on, a sprite that ignores its size budget, half-transparent pixels
the shadow builder cannot use, and flat shading. Judgement still belongs to the
reviewer; this only catches what a rule can see.
"""


def audit(key, image, budget=None):
    problems = []
    box = image.getbbox()
    if not box:
        return [f'{key}: empty sprite']
    x0, y0, x1, y1 = box
    w, h = image.size
    px = image.load()
    darkest = min((p for p in image.getdata() if p[3]), key=lambda p: sum(p[:3]))[:3]

    lums = [sum(p[:3]) for p in image.getdata() if p[3]]
    # An edge the artist finished is dark: outline, or a shaded far face. A run
    # of lit interior tones on the canvas edge is a drawing that ran out of room.
    dark_enough = min(lums) + 0.42 * (max(lums) - min(lums))

    def cut(pixels):
        run = best = interior = 0
        for p in pixels:
            if p[3]:
                run += 1
                best = max(best, run)
                if sum(p[:3]) > dark_enough: interior += 1
            else:
                run = 0
        return best >= 4 and interior > best * 0.65

    edges = {
        'top': [px[x, 0] for x in range(w)],
        'left': [px[0, y] for y in range(h)],
        'right': [px[w - 1, y] for y in range(h)],
    }
    for edge, pixels in edges.items():
        if cut(pixels):
            problems.append(f'{key}: {edge} edge of the {w}x{h} canvas cuts through the drawing')
    alpha = set(image.getchannel('A').getdata())
    if alpha - {0, 255}:
        problems.append(f'{key}: {len(alpha - {0, 255})} part-transparent alpha values; shadows need 0 or 255')
    opaque = [p for p in image.getdata() if p[3]]
    aw, ah = x1 - x0, y1 - y0
    if budget and (aw > budget[0] or ah > budget[1]):
        problems.append(f'{key}: {aw}x{ah} over its {budget[0]}x{budget[1]} budget')
    tones = len({p[:3] for p in opaque})
    # Six, not eight: a ceramic drawn from one seven-step ramp is not flat.
    if len(opaque) > 220 and tones < 6:
        problems.append(f'{key}: {tones} tones over {len(opaque)} pixels; too flat to read as a solid')
    # A sprite whose pixels are nearly all outline is a cage: this happens when
    # the outline pass runs after one-pixel details like warp threads.
    if len(opaque) > 300 and sum(1 for p in opaque if p[:3] == darkest) > len(opaque) * 0.45:
        problems.append(f'{key}: over a third of the sprite is its darkest tone; outline before adding thin details')
    return problems
