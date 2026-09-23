"""Render a handful of building recipes to one labelled sheet, magnified.

The review loop that produced the civic halls. `build_art.py` takes minutes
and writes atlases; this takes a second and writes a picture you can look at,
so you can change a ramp, render, and look again.

    python3 scripts/art/review_sheet.py out.png hall-kiva-medium-0 hall-sweat-lodge-medium-0
    python3 scripts/art/review_sheet.py out.png --list hall-
    python3 scripts/art/review_sheet.py out.png --zoom 6 hall-kiva-medium-0

Judge at --zoom 3 or more. At 1x every ramp looks fine and every ramp is
wrong; the flatness only shows when the pixels are big enough to compare.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))

from PIL import Image, ImageDraw, ImageFont  # noqa: E402


def recipes():
    """Every building recipe, without building an atlas for them."""
    from art.buildings import Building
    from art.urban import InfillBuilding, UrbanBuilding, urban_recipes
    from art.religious import ReligiousBuilding, religious_recipes
    from art.theatres import TheatreBuilding, theatre_recipes
    from art.halls import HallBuilding, hall_recipes
    from art.period import PeriodBuilding, period_recipes
    from art.modern import ModernBuilding
    from art.oblique import ObliqueBuilding, ObliquePlayhouse
    from art.oblique_church import ObliqueChurch
    from art.gold_masters import gold_master_recipes, prehistoric_expansion_recipes, service_kit_recipes
    from art.regional_houses import regional_house_recipes
    from art.oblique_meso_landmarks import meso_landmark_recipes
    from art.camps import CampBuilding, camp_recipes
    source = json.loads((ROOT / 'src/content/graphics/buildings.json').read_text())
    source['materials'].update(
        json.loads((ROOT / 'src/content/graphics/urban.json').read_text())
        .get('materials', {}))
    all_r = {**camp_recipes(), **source['buildings'], **gold_master_recipes(source), **service_kit_recipes(source),
             **prehistoric_expansion_recipes(source),
             **regional_house_recipes(ROOT, source),
             **meso_landmark_recipes(ROOT, source),
             **urban_recipes(ROOT, source),
             **religious_recipes(ROOT, source), **theatre_recipes(ROOT, source),
             **hall_recipes(ROOT, source), **period_recipes(ROOT, source)}
    painters = {'oblique': ObliqueBuilding, 'candidate': InfillBuilding, 'modern': ModernBuilding,
                'period': PeriodBuilding,
                'religious': ReligiousBuilding, 'theatre': TheatreBuilding,
                'hall': HallBuilding, 'urban': UrbanBuilding}

    def painter(r):
        if r.get('campStyle'):
            return CampBuilding
        if r.get('family') == 'parish':
            return ObliqueChurch
        if r.get('form') == 'oblique-ring':
            return ObliquePlayhouse
        if r.get('mesoLandmark'):
            from art.oblique_meso_landmarks import ObliqueMesoLandmark
            return ObliqueMesoLandmark
        if r.get('mesoamerican'):
            from art.oblique_meso import ObliqueMeso
            return ObliqueMeso
        if r.get('mud'):
            from art.oblique_mud import ObliqueMudbrick
            return ObliqueMudbrick
        if r.get('round'):
            from art.oblique_round import ObliqueRound
            return ObliqueRound
        for key, cls in painters.items():
            if r.get(key):
                return cls
        return Building
    return all_r, painter, source


def sheet(names, zoom=3, background='#1b2340'):
    all_r, painter, source = recipes()
    drawn = []
    for n in names:
        if n not in all_r:
            raise SystemExit(f'no recipe {n!r}; try --list')
        r = all_r[n]
        drawn.append((r['label'], painter(r)(r, source['materials'][r['wall']]).render()))
    pad = 10 * zoom
    w = sum(i.width for _, i in drawn) * zoom + pad * (len(drawn) + 1)
    h = max(i.height for _, i in drawn) * zoom + 24 * zoom
    im = Image.new('RGBA', (w, h), background)
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Menlo.ttc', 6 * zoom)
    except OSError:
        font = ImageFont.load_default()
    x = pad
    for label, sprite in drawn:
        big = sprite.resize((sprite.width * zoom, sprite.height * zoom), Image.NEAREST)
        im.alpha_composite(big, (x, h - 16 * zoom - big.height))
        d.text((x + big.width // 2, h - 12 * zoom), label, fill='#d8d4c4',
               font=font, anchor='ma')
        x += big.width + pad
    return im


def main(argv):
    if len(argv) < 2:
        raise SystemExit(__doc__)
    out, rest = Path(argv[0]), argv[1:]
    zoom = 3
    if '--zoom' in rest:
        i = rest.index('--zoom')
        zoom = int(rest[i + 1])
        rest = rest[:i] + rest[i + 2:]
    if '--list' in rest:
        i = rest.index('--list')
        prefix = rest[i + 1] if len(rest) > i + 1 else ''
        for name in recipes()[0]:
            if name.startswith(prefix):
                print(name)
        return
    sheet(rest, zoom).convert('RGB').save(out)
    print('wrote', out)


if __name__ == '__main__':
    main(sys.argv[1:])
