from drape import *


ART = {}
ART['tunic'] = garment(3, 16, 11, 11, 9, 12, sl='short', nk='round',
                       hem=15, foldcols=(9, 15))
ART['long-tunic'] = garment(2, 21, 11, 11, 9, 14, sl='long', nk='round',
                            hem=20, foldcols=(8, 16))
ART['shirt'] = garment(3, 18, 11, 10, 9, 11, sl='long', nk='collar',
                       open_=(4, 17, False), foldcols=(8, 16))
ART['coat'] = garment(2, 22, 12, 11, 9, 15, sl='long', nk='collar',
                      open_=(3, 21, True), foldcols=(7, 17))
ART['robe'] = garment(2, 22, 12, 12, 10, 17, sl='loose', nk='v',
                      open_=(3, 21, False), hem=21, foldcols=(7, 17))
ART['open-robe'] = garment(3, 21, 12, 12, 10, 16, sl='loose', nk='v',
                           open_=(4, 20, True), foldcols=(8, 16))
ART['dress'] = garment(3, 22, 9, 7, 11, 19, sl='short', nk='round',
                       hem=21, foldcols=(10, 14), flare=3.0, foldtop=12)
ART['gown'] = garment(2, 22, 10, 7, 10, 21, sl='loose', nk='v',
                      hem=21, foldcols=(9, 11, 13, 15), flare=3.5, foldtop=11)

# ── the rest of the body ────────────────────────────────────────────────────
ART['skirt'] = tube(6, 22, 11, 20, foldcols=(9, 12, 15), flare=3.0)
ART['sarong'] = tube(4, 21, 15, 16, foldcols=(8, 12, 16), flare=1.0)
ART['wrap'] = tube(4, 20, 16, 14, foldcols=(9, 13, 17), flare=-1.0)
ART['poncho'] = garment(3, 19, 16, 16, 8, 18, sl='none', nk='round', hem=18)
ART['loincloth'] = from_rows([
 "",
 "",
 "",
 "",
 "",
 "    oooooooooooooooo    ",
 "    tttttttttttttttt    ",
 "    tttttttttttttttt    ",
 "     oooooooooooooo     ",
 "     oooo::::::oooo     ",
 "      oooooooooooo      ",
 "      oooo::::oooo      ",
 "       oooooooooo       ",
 "       oooo::oooo       ",
 "        oooooooo        ",
 "         oooooo         ",
 "          oooo          ",
])
ART['suit'] = from_rows([
 "",
 "        mmmmmmmm        ",
 "      mmmmmmmmmmmm      ",
 "      oooooooooooo      ",
 "   oooooooooooooooooo   ",
 "  oooooooooooooooooooo  ",
 " oooooo::::::::::oooooo ",
 " ooooo::mmmmmmmm::ooooo ",
 " ooooo::mMMMMMMm::ooooo ",
 " ooooo::mmmmmmmm::ooooo ",
 " oooooo::::::::::oooooo ",
 "  oooooooooooooooooooo  ",
 "  ooooooooooooooooooo   ",
 "   tttttttttttttttt     ",
 "   oooooooooooooooo     ",
 "   ooooooo  ooooooo     ",
 "   oooooo    oooooo     ",
 "   oooooo    oooooo     ",
 "   mmmmmm    mmmmmm     ",
])

# ── over ────────────────────────────────────────────────────────────────────
ART['cloak'] = garment(3, 22, 8, 14, 10, 20, sl='none', nk='none',
                       hem=21, foldcols=(8, 11, 15, 18), flare=2.5, foldtop=6)
ART['shoulder-cloth'] = from_rows([
 "",
 "",
 "   oooooo        oooooo ",
 "   oooooo        oooooo ",
 "    oooooo      oooooo  ",
 "    oooooo      oooooo  ",
 "     oooooo    oooooo   ",
 "     oooooo    oooooo   ",
 "      oooooooooooooo    ",
 "      oooooooooooooo    ",
 "       oooooooooooo     ",
 "       oooo::::oooo     ",
 "        oooooooooo      ",
 "        tttttttttt      ",
 "        tttttttttt      ",
])

# ── legs ────────────────────────────────────────────────────────────────────
ART['trousers'] = legs(4, 21, 13, 5, 4, gap=1.5)
ART['wide'] = legs(4, 21, 13, 5, 7, gap=1.5)
ART['hose'] = legs(5, 21, 10, 4, 3, gap=1.0)
ART['wrapped'] = legs(5, 21, 11, 4.5, 3.5, gap=1.2, wrapped=True)

# ── head ────────────────────────────────────────────────────────────────────
ART['bowler'] = hat('dome', brim=9, band_=12, tall=1)
ART['conical'] = hat('cone', brim=10, tall=5)
ART['ball-cap'] = hat('dome', peak=True, band_=13)
ART['hood'] = hat('dome', drape=5, band_=17)
ART['wrap_head'] = hat('round', drape=2, band_=12)
ART['veil'] = hat('dome', drape=7, band_=8)
ART['visor'] = hat('round', tall=1)
ART['band'] = hat('flat', tall=-6)
ART['plume'] = hat('dome', band_=13)

from heads import HEADS
ART.update(HEADS)

from extras import EXTRAS
ART.update(EXTRAS)
