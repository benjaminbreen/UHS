"""The plaza kit as prop families: one family per job a thing does in a square,
one variant per place that had its own.

    PYTHONPATH=scripts .venv/bin/python -m art.props_b.plaza_families    # artifacts/plaza-kit.png
"""
import inspect

from . import plaza as shared, plaza_europe as eu, plaza_americas as am, plaza_africa_mena as af
from . import plaza_south_asia as sa, plaza_east_asia as ea
from .street import planter

GROUPS = shared.GROUPS + eu.GROUPS + am.GROUPS + af.GROUPS + sa.GROUPS + ea.GROUPS
FRAMES = 4

# family: (catalogue name, [(variant name, draw, variant), ...]). The variant
# names are what src/content/settlements/plaza.ts asks for.
FAMILIES = {
    'cafe-terrace': ('Cafe terrace', [
        ('Open', shared.bistro, 0), ('Parasol', shared.bistro, 1), ('Beer garden', eu.beer_table, 0),
        ('Coffeehouse', af.coffeehouse, 0), ('Pavement stools', sa.pavement_set, 0),
        ('Park tea table', ea.tea_table, 0), ('Picnic table', am.picnic_table, 0)]),
    'game-table': ('Game table', [
        ('Concrete chess', eu.chess_table, 0), ('Park chess', am.chess_table, 0), ('Xiangqi', ea.xiangqi, 0),
        ('Backgammon', af.backgammon, 0), ('Go bench', ea.go_bench, 0)]),
    'street-planter': ('Street planter', [
        ('Iron urn', shared.urn, 0), ('Versailles box', planter, 1), ('Concrete trough', planter, 2),
        ('Stone urn', shared.urn, 1), ('Orange tree', eu.citrus_pot, 0), ('Oleander', eu.citrus_pot, 1),
        ('Pedestal vase', eu.soviet_vase, 0), ('Pine in glazed jar', ea.pine_pot, 0),
        ('Hydrangea tub', ea.hydrangea, 0), ('Dragon jar', sa.dragon_jar, 0)]),
    'plaza-centre': ('Plaza centrepiece', [
        ('Tiered fountain', shared.tiered_fountain, 0), ('Bandstand', eu.bandstand, 0),
        ('Kiosco', am.kiosco, 0), ('Kiosco, red roof', am.kiosco, 1),
        ('Banyan platform', sa.chabutra, 0), ('Statue', shared.statue, 0)]),
    'street-vendor': ('Street vendor', [
        ('Gelato tricycle', eu.gelato, 0), ('Chestnut roaster', eu.chestnuts, 0), ('Kvass barrel', eu.kvass, 0),
        ('Ice-cream cart', eu.morozhenoe, 0), ('Hot-dog cart', am.hot_dog_cart, 0),
        ('Hot-dog cart, red', am.hot_dog_cart, 1), ('Popcorn wagon', am.popcorn_wagon, 0),
        ('Paletero cart', am.paletero, 0), ('Elote cart', am.elote_cart, 0), ('Aguas frescas', am.aguas_frescas, 0),
        ('Emoliente cart', am.emoliente, 0), ('Balloon seller', am.globero, 0), ('Simit cart', af.simit_cart, 0),
        ('Orange-juice stall', af.juice_stall, 0), ('Corn and chestnut cart', af.corn_cart, 0),
        ('Umbrella vendor', af.umbrella_vendor, 0), ('Suya grill', af.suya_grill, 0), ('Mkokoteni', af.mkokoteni, 0),
        ('Duka kiosk', af.duka, 0), ('Market mat', af.market_mat, 0), ('Chai stall', sa.chai_stall, 0),
        ('Paan stall', sa.paan_stall, 0), ('Chaat cart', sa.chaat_cart, 0), ('Cane press', sa.cane_press, 0),
        ('Lime soda cart', sa.nimbu_cart, 0), ('Kaki lima', sa.kaki_lima, 0), ('Kaki lima, green', sa.kaki_lima, 1),
        ('Noodle cart', sa.noodle_cart, 0), ('Coconut stand', sa.coconut_stand, 0), ('Iced drinks', sa.iced_drinks, 0),
        ('Banh mi stand', sa.banh_mi, 0), ('Sweet-potato oven', ea.sweet_potato, 0), ('Baozi steamers', ea.baozi, 0),
        ('Tanghulu pole', ea.tanghulu, 0), ('Yatai', ea.yatai, 0), ('Pojangmacha', ea.pojangmacha, 0),
        ('Yaki-imo cart', ea.yakiimo, 0), ('Tteokbokki cart', ea.tteokbokki, 0)]),
    'public-water': ('Public water', [
        ('Wallace fountain', eu.wallace, 0), ('Street pump', eu.pump, 0), ('Pedestal bubbler', am.bubbler, 0),
        ('Park tap', ea.mizunomiba, 0), ('Standpipe', af.standpipe, 0), ('Hand pump', sa.hand_pump, 0),
        ('Zeer jars', af.water_jars, 0), ('Roofed water jars', sa.water_jars, 0)]),
    'plaza-bench': ('Plaza bench', [
        ('Stone', shared.stone_bench, 0), ('Wrought iron', am.banca, 0), ('Plank', af.palaver_bench, 0)]),
    'plaza-tree': ('Plaza tree', [('Plane in a guard', shared.street_tree, 0), ('Date palm', af.date_palm, 0)]),
    'pigeons': ('Pigeons', [('Flock', shared.pigeons, 0)]),
    'street-trade': ('Street trade', [
        ('Shoeshine stand', am.shoeshine, 0), ('Bolero chair', am.bolero, 0), ('Shoeshine box', af.shoeshine, 0),
        ('Tailor', af.tailor, 0)]),
    'street-fixture': ('Street fixture', [
        ('Street clock', eu.street_clock, 0), ('Flagpole', am.flagpole, 0), ('Soda machine', eu.gazirovka, 0),
        ('Soda machine, red', eu.gazirovka, 1), ('Newspaper stand', eu.news_stand, 0),
        ('Notice board', ea.notice_board, 0), ('Letterbox', sa.letterbox, 0), ('Pillar postbox', ea.maru_post, 0),
        ('Air walker', ea.air_walker, 0)]),
}

moving = lambda fn: 'frame' in inspect.signature(fn).parameters


def _family(cells):
    def draw(v=0, frame=0):
        _, fn, variant = cells[v]
        return fn(variant, frame) if moving(fn) else fn(variant)
    return draw


PLAZA = {key: _family(cells) for key, (_, cells) in FAMILIES.items()}
PLAZA_ANIMATED = {key: FRAMES for key, (_, cells) in FAMILIES.items() if any(moving(fn) for _, fn, _ in cells)}


def sheet(out, groups=None, scale=3):
    """A PNG of frame 0 and, beside it, a GIF of the four frames."""
    from pathlib import Path
    from PIL import Image, ImageDraw, ImageFont
    from art.city_kit import shadow_for
    from art.reference import current_adult
    groups = groups or GROUPS
    font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 13)
    head = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', 17)
    figure = current_adult()
    pages = []
    for frame in range(FRAMES):
        rows, width = [], 0
        for title, cells in groups:
            sprites = [(label + (' *' if moving(fn) else ''), fn(v, frame) if moving(fn) else fn(v))
                       for label, fn, v in cells]
            h = max(max(s.height for _, s in sprites), figure.height) + 12
            w = sum(max(s.width, len(label) * 7 // scale) + 14 for label, s in sprites) + figure.width + 14
            rows.append((title, sprites, h))
            width = max(width, w)
        total = sum(h * scale + 52 for _, _, h in rows) + 12
        im = Image.new('RGBA', (width * scale + 24, total), '#20272a')
        d = ImageDraw.Draw(im)
        y = 12
        for title, sprites, h in rows:
            d.text((12, y), title, font=head, fill='#eee3c5')
            strip = Image.new('RGBA', (width, h), '#b4aca4')
            for sx in range(0, width, 16):
                ImageDraw.Draw(strip).line([(sx, 0), (sx, h)], fill='#aaa29a')
            floor, x = h - 7, 6
            labels = []
            for label, s in [('', figure)] + sprites:
                sh = shadow_for(s, squash=0.22)
                strip.alpha_composite(sh, (x, floor - sh.height + 2))
                strip.alpha_composite(s, (x, floor - s.height))
                labels.append((x, label))
                x += max(s.width, len(label) * 7 // scale) + 14
            im.alpha_composite(strip.resize((width * scale, h * scale), Image.NEAREST), (12, y + 24))
            for lx, label in labels:
                d.text((12 + lx * scale, y + 26 + h * scale), label, font=font, fill='#cbd0bb')
            y += h * scale + 52
        pages.append(im.convert('RGB'))
    out = Path(out)
    out.parent.mkdir(exist_ok=True)
    pages[0].save(out)
    pages[0].save(out.with_suffix('.gif'), save_all=True, append_images=pages[1:], duration=190, loop=0)
    return out


if __name__ == '__main__':
    import sys
    from pathlib import Path
    print(sheet(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parents[3] / 'artifacts/plaza-kit.png'))
