"""Item icons. Same grid and same light as the garments, but an item is not
cloth: each one carries its own colour rather than taking a dye."""
from heads import R

# base colour, then the accent that `t`/`T` draw in.
COLOR = {}
ITEMS = {}

def item(name, base, accent, rows):
    COLOR[name] = (base, accent)
    ITEMS[name] = R(*rows)

item('bread', '#c08a45', '#e0b36a', [
 "",
 "",
 "",
 "",
 "",
 "      oooooooooo        ",
 "    oooooooooooooo      ",
 "   oooooooooooooooo     ",
 "  oooo:oooo:oooo:ooo    ",
 "  ooo:oooo:oooo:oooo    ",
 "  oooooooooooooooooo    ",
 "   oooooooooooooooo     ",
 "    oooooooooooooo      ",
 "      oooooooooo        ",
])
item('grain', '#d6b96a', '#8c7a3a', [
 "",
 "",
 "      oo   oo   oo      ",
 "     oooo oooo oooo     ",
 "     o::o o::o o::o     ",
 "     oooo oooo oooo     ",
 "     o::o o::o o::o     ",
 "     oooo oooo oooo     ",
 "      tt   tt   tt      ",
 "       t   t   t        ",
 "       t   t   t        ",
 "        t  t  t         ",
 "        tttttt          ",
 "         t t t          ",
 "        t  t  t         ",
])
item('straw', '#cdb46a', '#9c8340', [
 "",
 "",
 "",
 "",
 "   oo                   ",
 "    ooooooo             ",
 "  ooooooooooooo         ",
 "   oooooooooooooooo     ",
 "  ttttttttttttttttt     ",
 "   oooooooooooooooooo   ",
 "     ooooooooooooooo    ",
 "        oooooooooo      ",
 "             ooo        ",
])
item('water', '#b06a44', '#5a89b0', [
 "",
 "",
 "        oooooo          ",
 "        o::::o          ",
 "       oooooooo         ",
 "      oooooooooo   oo   ",
 "     oooooooooooo ooo   ",
 "     ooooooooooooooo    ",
 "     oooooooooooooo     ",
 "     oooooooooooooo     ",
 "     ooottttttoooo      ",
 "     oootttttttooo      ",
 "      oooooooooooo      ",
 "       oooooooooo       ",
 "        oooooooo        ",
])
item('coin', '#c9a24a', '#8a6a24', [
 "",
 "",
 "",
 "",
 "",
 "      oooooooooo        ",
 "    oooooooooooooo      ",
 "    oottoooottoooo      ",
 "    oooooooooooooo      ",
 "     tttttttttttt       ",
 "   oooooooooooooooo     ",
 "   ootooooooootoooo     ",
 "   oooooooooooooooo     ",
 "    tttttttttttttt      ",
 "  oooooooooooooooooo    ",
 "  oooooooooooooooooo    ",
 "  oooooooooooooooooo    ",
 "   tttttttttttttttt     ",
])
item('obsidian', '#3a3444', '#6f6580', [
 "",
 "",
 "           oo           ",
 "          oooo          ",
 "         oooooo         ",
 "        oooooooo        ",
 "       oooooooooo       ",
 "      oooooo:oooo       ",
 "      ooooo::oooo       ",
 "       oooo::ooo        ",
 "        ooo::oo         ",
 "         oo::o          ",
 "          ooo           ",
 "           o            ",
])
item('wool', '#e2ded0', '#b9b3a0', [
 "",
 "",
 "",
 "       oooooooo         ",
 "     oo::oooo::oo       ",
 "    oooooo::oooooo      ",
 "   oo::oooooooo::oo     ",
 "   oooooo::oooooooo     ",
 "   oo::ooooooo::ooo     ",
 "   ooooo::oooooooo      ",
 "    oo::oooooo::oo      ",
 "     oooo::oooooo       ",
 "       oooooooo         ",
])
item('wood', '#8a6038', '#5c3f24', [
 "",
 "",
 "",
 "",
 "   ooooooooooooooooo    ",
 "   tttttttttttttttto    ",
 "   ooooooooooooooooo    ",
 "      oooooooooo        ",
 "   ooooooooooooooooo    ",
 "   tttttttttttttttto    ",
 "   ooooooooooooooooo    ",
 "      oooooooooo        ",
 "   ooooooooooooooooo    ",
 "   tttttttttttttttto    ",
 "   ooooooooooooooooo    ",
])
item('fish', '#9aa6ae', '#6a757d', [
 "",
 "",
 "",
 "",
 "                 oo     ",
 "     oooooo     oooo    ",
 "   oooooooooo  ooooo    ",
 "  ootoooooooooooooo     ",
 "  oooooo::::ooooooo     ",
 "  ootoooooooooooooo     ",
 "   oooooooooo  ooooo    ",
 "     oooooo     oooo    ",
 "                 oo     ",
])
item('tool', '#b8bdc4', '#6b4a2e', [
 "",
 "",
 "",
 "          oooo          ",
 "         oooooo         ",
 "        oooooooo        ",
 "       oooooooo         ",
 "      oooooooo          ",
 "     oooooooo           ",
 "    oooooooo            ",
 "   tttooooo             ",
 "  ttttttoo              ",
 "  tttttttt              ",
 "   tttttt               ",
])
item('flax', '#9fb08a', '#8a7fc0', [
 "",
 "",
 "      t    t    t       ",
 "     ttt  ttt  ttt      ",
 "      t    t    t       ",
 "      o    o    o       ",
 "      oo   o   oo       ",
 "       o   o   o        ",
 "       oo  o  oo        ",
 "        o  o  o         ",
 "        oooooo          ",
 "         o o o          ",
 "        o  o  o         ",
 "       o   o   o        ",
])
item('lizard', '#7d8f4a', '#4f5c2a', [
 "",
 "",
 "",
 "",
 "     oooo               ",
 "    oo::oooo            ",
 "    oooooooooo          ",
 "   o  ooooooooooo       ",
 "   o   ooooooooooooo    ",
 "  o     oooooooo   oo   ",
 "         o    o      oo ",
 "        oo    oo       o",
])
item('fruit', '#c04a3c', '#5d8a3a', [
 "",
 "",
 "           tt           ",
 "          tt            ",
 "       oooooooo         ",
 "     oooooooooooo       ",
 "    oo::oooooooooo      ",
 "    oo::oooooooooo      ",
 "    oooooooooooooo      ",
 "     oooooooooooo       ",
 "      oooooooooo        ",
 "       oooooooo         ",
])
item('berries', '#8e3a5c', '#5d8a3a', [
 "",
 "",
 "          tt            ",
 "         tt             ",
 "       oooo             ",
 "      oo::oo   oooo     ",
 "      oooooo  oo::oo    ",
 "       oooo   oooooo    ",
 "        oooo   oooo     ",
 "       oo::oo           ",
 "       oooooo  oooo     ",
 "        oooo  oo::oo    ",
 "              oooooo    ",
 "               oooo     ",
])
item('reeds', '#9aa85c', '#6d7a3c', [
 "",
 "    o       o       o   ",
 "    o      oo      oo   ",
 "    t      t       t    ",
 "    t      t       t    ",
 "    t      t       t    ",
 "    t      t       t    ",
 "    t      t       t    ",
 "    t      t       t    ",
 "    t      t       t    ",
 "    t      t       t    ",
 "    t      t       t    ",
 "    t      t       t    ",
])
item('fodder', '#93a05a', '#6f7c3e', [
 "",
 "",
 "",
 "",
 "",
 "   o   o     o    o     ",
 "   oo oo o  oo o oo     ",
 "  ooooooooooooooooooo   ",
 " ooooooooooooooooooooo  ",
 " ooootttoooottttooooo   ",
 "  ooooooooooooooooooo   ",
 "   ooooooooooooooooo    ",
])
item('stone', '#9a9690', '#6e6b66', [
 "",
 "",
 "",
 "",
 "       oooooooo         ",
 "     oooooooooooo       ",
 "    oooooooooooooo      ",
 "   oooooo::oooooooo     ",
 "   oooooooooooooooo     ",
 "    oooooooooooooo      ",
 "     oooooooooooo       ",
])
item('limestone', '#cfc8b4', '#a49c88', [
 "",
 "",
 "",
 "",
 "    oooooooooooooo      ",
 "   oooooooooooooooo     ",
 "   ooo::oooooo::ooo     ",
 "   oooooooooooooooo     ",
 "   oooooooooooooooo     ",
 "    oooooooooooooo      ",
])
item('granite', '#8c8890', '#d8d4dc', [
 "",
 "",
 "",
 "     oooooooooo         ",
 "   ooootooootooo        ",
 "   ootoooooooooo        ",
 "  ooooootoooootoo       ",
 "  oootoooooootooo       ",
 "  ooooootoooooooo       ",
 "   ootoooootooooo       ",
 "    oooooooooooo        ",
])
item('flint', '#5c5a52', '#c8c4b4', [
 "",
 "",
 "",
 "",
 "        oooo            ",
 "      oooooooo          ",
 "     ooooooooooo        ",
 "    ooooooooooott       ",
 "    ooooooooootttt      ",
 "     oooooooootttt      ",
 "      oooooooottt       ",
 "        ooooooo         ",
])
item('pebble', '#a8a094', '#7a746a', [
 "",
 "",
 "",
 "",
 "",
 "",
 "        oooooo          ",
 "       oooooooo         ",
 "      oooo::oooo        ",
 "      oooooooooo        ",
 "       oooooooo         ",
])
item('river-rock', '#8e9aa0', '#666f74', [
 "",
 "",
 "",
 "",
 "",
 "      oooooooooo        ",
 "    oooooooooooooo      ",
 "   ooooo::ooooooooo     ",
 "   oooooooooooooooo     ",
 "    oooooooooooooo      ",
])
item('clay', '#a4674a', '#7c4a32', [
 "",
 "",
 "",
 "",
 "      oooooooo          ",
 "    oooooooooooo        ",
 "   ooooo::oooooooo      ",
 "   oooo::::oooooooo     ",
 "   ooooo::ooooooooo     ",
 "    oooooooooooooo      ",
 "     oooooooooooo       ",
])
item('dirt', '#6e5540', '#4d3a2c', [
 "",
 "",
 "",
 "",
 "",
 "        o   o           ",
 "      oooooooo          ",
 "    oootoooooooo        ",
 "   ooooooootoooooo      ",
 "   oootooooooootoo      ",
 "    oooooooooooooo      ",
])
item('sand', '#d8c48c', '#b09a62', [
 "",
 "",
 "",
 "",
 "",
 "          t             ",
 "        oooo            ",
 "      oootoooo          ",
 "    ooooooootooo        ",
 "   ootoooooooooooo      ",
 "  oooooootooooooooo     ",
])
item('mud', '#5f4a36', '#3f3124', [
 "",
 "",
 "",
 "",
 "",
 "",
 "     oo    ooo          ",
 "   oooooooooooooo       ",
 "  oooo::oooo::oooo      ",
 "  oooooooooooooooo      ",
 "   oo ooooooooo oo      ",
])
item('shell', '#e0cdb4', '#b09070', [
 "",
 "",
 "",
 "          oo            ",
 "        oooooo          ",
 "      oootoooooo        ",
 "     ooootoooooooo      ",
 "    ooootttooooooo      ",
 "   oooootttoooooooo     ",
 "   ooootoootooooooo     ",
 "    oooooooooooooo      ",
 "     oooooooooooo       ",
])
item('stick', '#8a6a44', '#5e462c', [
 "",
 "",
 "",
 "",
 "                oooo    ",
 "              oooooo    ",
 "            oooott      ",
 "          oooooo        ",
 "        oooooo          ",
 "      oooooo            ",
 "    oooooo              ",
 "   ooooo                ",
 "   ooo                  ",
])
item('bark', '#7a5636', '#a88050', [
 "",
 "",
 "",
 "      ooooooo           ",
 "    oooooooooo          ",
 "   oootttttoooo         ",
 "   ooottttttoooo        ",
 "   oootttttttoooo       ",
 "    oootttttttooo       ",
 "     oooooooooooo       ",
 "       ooooooooo        ",
 "         oooooo         ",
])
item('herbs', '#5d8a3a', '#a8c060', [
 "",
 "",
 "        t               ",
 "      ooot              ",
 "     oooooo    t        ",
 "      oooo   ooot       ",
 "       oo   ooooo       ",
 "       oo    oooo       ",
 "        oo   oo         ",
 "         ooooo          ",
 "          ooo           ",
 "          ooo           ",
 "         ooooo          ",
])
item('mushroom', '#b07a5c', '#e0d2b8', [
 "",
 "",
 "",
 "       oooooooo         ",
 "     oooooooooooo       ",
 "    oooo::oooooooo      ",
 "   oooooooooo::ooooo    ",
 "   oooooooooooooooo     ",
 "    oooooooooooooo      ",
 "       tttttttt         ",
 "       tttttttt         ",
 "        tttttt          ",
 "        tttttt          ",
 "       tttttttt         ",
])
item('pinecone', '#7a5a38', '#5a4028', [
 "",
 "",
 "",
 "        oooo            ",
 "       oootooo          ",
 "      ootooootoo        ",
 "      oooootoooo        ",
 "      ootooootoo        ",
 "      oooootoooo        ",
 "       ootooooo         ",
 "        oooooo          ",
 "         oooo           ",
 "          oo            ",
])
item('resin', '#d09a3a', '#f0c86a', [
 "",
 "",
 "",
 "         oo             ",
 "        oooo            ",
 "       oootooo          ",
 "      ooottoooo         ",
 "      ooooooooo         ",
 "       ooooooo          ",
 "        ooooo           ",
])
item('acorn', '#a97a44', '#6b4a28', [
 "",
 "",
 "",
 "           t            ",
 "       tttttttt         ",
 "      tttttttttt        ",
 "      tttttttttt        ",
 "       oooooooo         ",
 "       oooooooo         ",
 "       oooooooo         ",
 "        oooooo          ",
 "         oooo           ",
 "          oo            ",
])
item('frond', '#5f8f46', '#3f6a30', [
 "",
 "  oo                    ",
 "   ooo   oo             ",
 "    ooo  oooo  oo       ",
 "  oo ooo ooooooooo      ",
 "   ooo oooooooooooo     ",
 "    ottttttttttttooo    ",
 "   ooo oooooooooooo     ",
 "  oo ooo ooooooooo      ",
 "    ooo  oooo  oo       ",
 "   ooo   oo             ",
 "  oo                    ",
])
item('cane', '#9aa85c', '#6d7a3c', [
 "",
 "         oooo           ",
 "         oooo           ",
 "         tttt           ",
 "         oooo           ",
 "         oooo           ",
 "         oooo           ",
 "         tttt           ",
 "         oooo           ",
 "         oooo           ",
 "         oooo           ",
 "         tttt           ",
 "         oooo           ",
 "         oooo           ",
 "         oooo           ",
])
# What a kill yields.
item('meat', '#b8453a', '#ecdcc4', [
 "",
 "",
 "",
 "",
 "       ooooooo          ",
 "     ooooooooooo        ",
 "    ooo:ooooooooo       ",
 "   ooo:oottoooooo       ",
 "   oooooottooooooo      ",
 "   ooooooooooo:ooo tt   ",
 "    oooooooooooooottt   ",
 "     ooooooooooooo tt   ",
 "       ooooooooo        ",
])
item('hide', '#8a5a36', '#c49a6c', [
 "",
 "",
 "   oo            oo     ",
 "   oooo        oooo     ",
 "    oooooooooooooo      ",
 "     oooottttoooo       ",
 "     oootttttttoo       ",
 "     oootttttttoo       ",
 "     oooottttoooo       ",
 "    oooooooooooooo      ",
 "   oooo        oooo     ",
 "   oo            oo     ",
])
item('feathers', '#efe9da', '#9a8f7a', [
 "",
 "",
 "               ooo      ",
 "             ooooo      ",
 "           oootooo      ",
 "          ootooo        ",
 "        ootoooo         ",
 "       otoooo           ",
 "     ootooo             ",
 "    otooo               ",
 "   too                  ",
 "  t                     ",
])
item('cooked-meat', '#8a4a2a', '#e8d8bc', [
 "",
 "",
 "",
 "",
 "       ooooooo          ",
 "     ooooooooooo        ",
 "    ooo:ooo:ooooo       ",
 "   ooo:oottoo:ooo       ",
 "   oooooottooooooo      ",
 "   oo:oooooooo:ooo tt   ",
 "    ooooo:ooooooottt   ",
 "     ooooooooooooo tt   ",
 "       ooooooooo        ",
])

# Cut wild plants. Each borrows a drawn shape in its own colours.
def like(name, shape, base, accent):
    COLOR[name] = (base, accent)
    ITEMS[name] = ITEMS[shape]

like('bast', 'flax', '#c8b88a', '#9a8a60')
like('rushes', 'reeds', '#6f8a44', '#4f6a30')
like('grass-fibre', 'straw', '#c8c090', '#908a58')
like('papyrus', 'reeds', '#8aa84a', '#5a7a2c')
like('cotton', 'wool', '#f2efe6', '#8a7a5a')
like('greens', 'herbs', '#6a9a40', '#9cc860')
like('roots', 'herbs', '#a07a4c', '#6a8a3a')
like('bulbs', 'acorn', '#d8c8b0', '#8a6aa8')
like('seeds', 'grain', '#b89a5c', '#7a6438')
like('capers', 'berries', '#6a8a40', '#4a6a2c')
like('chilies', 'berries', '#d0301c', '#5d8a3a')
like('roselle', 'berries', '#a01c34', '#5d8a3a')
like('chamomile', 'berries', '#f4f1e6', '#e8c030')
like('tea', 'herbs', '#3f6a30', '#6a9a40')
like('coffee', 'berries', '#b02a20', '#4a6a2c')
like('woad', 'herbs', '#5a8a6a', '#3a5a8a')
like('weld', 'herbs', '#a8b040', '#e0d040')
like('madder', 'bark', '#a8402c', '#7a2a1c')
like('indigo', 'herbs', '#3a4a88', '#5a6ab0')
like('safflower', 'berries', '#e8801c', '#e8c040')
like('henna', 'herbs', '#6a7a38', '#a8602c')
like('annatto', 'berries', '#c83a1c', '#7a3a20')
like('turmeric', 'bark', '#e0a020', '#a8701c')
like('goldenrod', 'flax', '#a8a048', '#e8c830')
like('gromwell', 'bark', '#6a3060', '#4a2040')
like('saffron', 'flax', '#b83018', '#e05030')
like('poppy-pods', 'acorn', '#8aa888', '#6a5080')
like('cannabis', 'herbs', '#5a7a30', '#8aa848')
like('coca', 'herbs', '#4a7a34', '#7aa850')
like('khat', 'herbs', '#5a7a3a', '#8a5a3a')
like('tobacco', 'frond', '#8a8a44', '#6a5a30')
like('pituri', 'herbs', '#7a7a44', '#5a5a30')
like('ephedra', 'reeds', '#7a8a4a', '#5a6a34')
