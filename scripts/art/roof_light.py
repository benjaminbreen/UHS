"""Which step of a roof palette a course takes.

Every compiler drew its roof the same way -- `pal[2] if rng.random() < .8 else
pal[1]` -- which is texture with no light in it, and why 346 of 756 buildings
measured no value gradient in either axis. Tone comes from the course instead:
the ridge catches the light, the eave sits in its own shade.

The jitter never crosses more than one step, so a course reads as weathered
rather than as a printed stripe, and the slope still reads as a slope. Nothing
here adds a colour: the tones all come from the roof ramp already in content.
"""


def course_tone(pal, row, rows, col=0, lit=3, dark=0):
    span = max(rows - 1, 1)
    step = lit - round(row / span * (lit - dark))
    if (col + row) % 3 == 0:
        step -= 1
    return pal[max(0, min(step, len(pal) - 1))]


def courses(start, stop, pitch):
    """The row values a roof loop will visit, so it can be told how many."""
    rows = list(range(start, stop, pitch))
    return rows, len(rows)
