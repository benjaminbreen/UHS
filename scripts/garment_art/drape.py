"""Parametric 24x24 garment art. Light from the upper left, so the left edge
carries the highlight and the right edge the shade; folds fall from the
shoulders."""
N = 24
EMPTY = ' '

def blank():
    return [[EMPTY]*N for _ in range(N)]

def lerp(a, b, t): return a + (b-a)*t

def body(g, top, bottom, wtop, wwaist, waist, wbot, char='o'):
    """Fill a torso whose half-width runs shoulder -> waist -> hem."""
    for r in range(top, bottom+1):
        if r <= waist:
            t = (r-top)/max(1, waist-top); w = lerp(wtop, wwaist, t)
        else:
            t = (r-waist)/max(1, bottom-waist); w = lerp(wwaist, wbot, t)
        half = w/2
        c0 = int(round(12-half)); c1 = int(round(12+half))-1
        for c in range(c0, c1+1):
            g[r][c] = char

def sleeves(g, row0, row1, kind, wtop):
    """Short, long or loose sleeves hung off the shoulder line."""
    for r in range(row0, row1+1):
        t = (r-row0)/max(1, row1-row0)
        if kind == 'loose':
            reach = lerp(2, 7, min(1, t*1.6))
        elif kind == 'long':
            reach = lerp(2, 5, min(1, t*2.2))
        else:
            reach = lerp(2, 4.5, min(1, t*2.6))
        inner = wtop/2
        for c in range(int(round(12-inner-reach)), int(round(12-inner))):
            if 0 <= c < N: g[r][c] = 'o'
        for c in range(int(round(12+inner)), int(round(12+inner+reach))):
            if 0 <= c < N: g[r][c] = 'o'

def neck(g, row, kind):
    """The opening, and the dark of the inside of it."""
    if kind == 'none': return
    if kind == 'round':
        cut = [(row, range(9, 15)), (row+1, range(9, 15)),
               (row+2, range(10, 14))]
    elif kind == 'v':
        cut = [(row, range(9, 15)), (row+1, range(10, 14)),
               (row+2, range(10, 14)), (row+3, range(11, 13))]
    else:  # collar
        cut = [(row, range(10, 14)), (row+1, range(10, 14)),
               (row+2, range(11, 13))]
    # The hole is the dark inside of the garment, not a gap in it.
    for r, cols in cut:
        for c in cols:
            if 0 <= r < N: g[r][c] = '.' if g[r][c] != EMPTY else EMPTY
    # A shadow under the front edge of the opening.
    last, cols = cut[-1]
    for c in range(min(cols)-1, max(cols)+2):
        if 0 <= last+1 < N and 0 <= c < N and g[last+1][c] in ('o', 'O', 'x'):
            g[last+1][c] = '#'
    if kind == 'collar':
        for r in (row, row+1):
            for c in (9, 14):
                if g[r][c] != EMPTY: g[r][c] = 't'
        for c in range(9, 15):
            if g[row-1][c] == 'o': g[row-1][c] = 't'

def opening(g, row0, row1, lapel=False):
    """A coat front: a shaded seam, optionally with lapels at the top."""
    for r in range(row0, row1+1):
        if g[r][11] != EMPTY: g[r][11] = '#'
        if g[r][12] != EMPTY: g[r][12] = 't'
    if lapel:
        for i in range(3):
            r = row0+i
            for c in (9-i, 10-i, 13+i, 14+i):
                if 0 <= c < N and g[r][c] not in (EMPTY,): g[r][c] = 't'

def band(g, row, rows=1, char='t'):
    for r in range(row, row+rows):
        for c in range(N):
            if g[r][c] not in (EMPTY, '.'): g[r][c] = char

def folds(g, cols, row0, row1, flare=0.0):
    """Broken strokes, not pinstripes: a fold catches the light for a few
    pixels and loses it again, and spreads as the cloth widens."""
    for i, c0 in enumerate(cols):
        left = c0 < 12
        for r in range(row0, row1+1):
            t = (r-row0)/max(1, row1-row0)
            drift = int(round(flare*t*(-1 if left else 1)))
            c = c0 + drift
            if not (0 <= c < N): continue
            if (r + i*2) % 5 == 0: continue
            if g[r][c] == 'o':
                g[r][c] = 'O' if left else 'x'

def shade(g):
    """Highlight the lit edge, deepen the far one, then outline the lot."""
    for r in range(N):
        run = [c for c in range(N) if g[r][c] not in (EMPTY, '.')]
        if not run: continue
        # contiguous spans, so a two-legged garment lights both legs
        spans, start = [], run[0]
        for a, b in zip(run, run[1:]+[None]):
            if b is None or b != a+1:
                spans.append((start, a)); start = b
        for c0, c1 in spans:
            if g[r][c0] == 'o': g[r][c0] = 'O'
            if c1-c0 > 3 and g[r][c1] in ('o', 'x'): g[r][c1] = '#'
            if c1-c0 > 5 and g[r][c1-1] == 'o': g[r][c1-1] = 'x'
    out = [row[:] for row in g]
    for r in range(N):
        for c in range(N):
            if g[r][c] != EMPTY: continue
            near = any(
                0 <= r+dr < N and 0 <= c+dc < N and g[r+dr][c+dc] not in (EMPTY, '.')
                for dr, dc in ((1,0),(-1,0),(0,1),(0,-1))
            )
            if near: out[r][c] = '.'
    return out

def render(fn):
    g = blank(); fn(g); return [''.join(r) for r in shade(g)]

def hemshade(g, row):
    """Cloth has weight: the last inch before the hem falls into shadow."""
    for c in range(N):
        if g[row][c] == 'o': g[row][c] = 'x'

def garment(top, bottom, wtop, wwaist, waist, wbot, sl='short',
            nk='round', open_=None, hem=None, foldcols=(), sleeverows=None,
            flare=0.0, foldtop=None):
    def fn(g):
        body(g, top, bottom, wtop, wwaist, waist, wbot)
        r0, r1 = sleeverows or (top+1, top+4)
        sleeves(g, r0, r1, sl, wtop)
        neck(g, top, nk)
        if foldcols:
            folds(g, foldcols, foldtop if foldtop is not None else waist,
                  bottom-1, flare)
        if open_: opening(g, open_[0], open_[1], open_[2])
        hemshade(g, bottom-1 if hem is None else hem-1)
        if hem is not None: band(g, hem)
    return render(fn)

def legs(top, bottom, waistw, thighw, cuffw, gap=2, band_=True, wrapped=False):
    """Two legs from one waistband. `gap` is the space between them at the
    hem, so wide trousers read differently from hose."""
    def fn(g):
        for r in range(top, bottom+1):
            t = (r-top)/max(1, bottom-top)
            if r < top+4:
                half = waistw/2
                for c in range(int(round(12-half)), int(round(12+half))):
                    if 0 <= c < N: g[r][c] = 'o'
                continue
            w = lerp(thighw, cuffw, (t-0.2)/0.8)
            inner = lerp(0.5, gap, t)
            for c in range(int(round(12-inner-w)), int(round(12-inner))):
                if 0 <= c < N: g[r][c] = 'o'
            for c in range(int(round(12+inner)), int(round(12+inner+w))):
                if 0 <= c < N: g[r][c] = 'o'
        if wrapped:
            for r in range(top+5, bottom, 3):
                for c in range(N):
                    if g[r][c] in ('o',): g[r][c] = 'x'
        if band_: band(g, top, 2)
    return render(fn)

def tube(top, bottom, wtop, wbot, hem=True, foldcols=(), flare=2.0):
    """A wound cloth: a sarong, a skirt, a shoulder cloth."""
    def fn(g):
        body(g, top, bottom, wtop, wtop, top+1, wbot)
        if foldcols: folds(g, foldcols, top+2, bottom-1, flare)
        hemshade(g, bottom-1)
        if hem:
            band(g, top, 2); band(g, bottom)
    return render(fn)

def hat(crown, brim=0, band_=None, tall=0, peak=False, drape=0):
    """A crown, an optional brim, an optional band. `drape` hangs cloth off
    the back, which is what makes a hood a hood and a scarf a scarf."""
    def fn(g):
        top = 6 - tall
        low = 13
        for r in range(top, low+1):
            t = (r-top)/max(1, low-top)
            if crown == 'dome':
                half = 7*(0.45+0.55*t**0.5)
            elif crown == 'flat':
                half = 7*(0.8+0.2*t)
            elif crown == 'cone':
                half = 9*t
            elif crown == 'box':
                half = 6.5
            else:  # round, a full skull
                half = 8*(0.5+0.5*(1-(1-t)**2))**0.5
            for c in range(int(round(12-half)), int(round(12+half))):
                if 0 <= c < N: g[r][c] = 'o'
        if drape:
            for r in range(low+1, low+1+drape):
                t = (r-low)/max(1, drape)
                half = lerp(8, 3, t)
                for c in range(int(round(12-half)), int(round(12+half))):
                    if 0 <= c < N: g[r][c] = 'o'
        if brim:
            for r in (low+1, low+2)[:1 if brim < 3 else 2]:
                for c in range(12-brim, 12+brim):
                    if 0 <= c < N: g[r][c] = 'o'
        if peak:
            for r in (low+1, low+2):
                for c in range(12-5, 12+5):
                    if 0 <= c < N: g[r][c] = 'x'
        if band_ is not None: band(g, band_)
    return render(fn)

def from_rows(rows):
    """Hand-drawn art, run through the same outliner as everything else."""
    def fn(g):
        for r, row in enumerate(rows):
            for c, ch in enumerate(row):
                if ch != ' ': g[r][c] = ch
    return render(fn)
