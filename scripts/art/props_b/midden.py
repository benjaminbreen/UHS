"""Middens: the heap every settlement had until someone came to take it away.

Seen from above like everything else: one mound grid per size, built up from
basket-loads and lit from the upper left, an ash patch where the hearth was
last emptied, and a few things you can name lying on it. What lies there is
chosen by how the place lived (`middenContents`), not who lived there.
"""
from .core import Canvas, draw_grid, ramp_keys, soft_outline, jitter

# Midden soil is dark: decades of ash, dung and rot ("dark earth").
DARK = ['#21170f', '#33251a', '#463424', '#5a4430', '#6e553b', '#846848', '#9a7d58']
ASH = ['#4a4844', '#66625c', '#827d75', '#9e988e', '#b9b3a8', '#d2ccc0', '#e6e1d6']
# Shell heaps are grey with ash under the fresh white, so the shells show.
SHELLY = ['#2c2924', '#433f38', '#5c5750', '#76706a', '#8f8980', '#a8a298', '#bfb9ae']
FLY = '#16120c'

HOUSEHOLD = [
 "...........544443333.................",
 ".........5444433333343211............",
 "........54443333322222111............",
 ".......544433332222222111133.........",
 "......554433332222211114444333.......",
 "....55444333222211111143333222223....",
 "...5444433322221111113333222211112...",
 "..54443333222211111333332222111111...",
 ".5443333332222223333333333211113332..",
 "544433234444333333333333333223333222.",
 "5433322444333333333333333322233322221",
 "4333234443333333333333332222222221111",
 "3322344433333333333333222222222211111",
 "3323443333333333333322222222221111111",
 "3323433333333333332222222222111111111",
 "..24333333333332222222222111111111111",
 "...43333333322222222221111111111111..",
 ".....333322222222221111111111111.....",
 "......333333222121111111111111.......",
 "........33332222211111111111.........",
 "..............222...111..............",
]
COMMUNAL = [
 "..................................5443........................",
 "......................54444444...443222.......................",
 "....................54444443333344322111......................",
 "..................55444443333333332211111.....................",
 ".................5544443333333322221111111....................",
 "...............5544444333333322222211111444433................",
 "...............554444333333222222222114443333333..............",
 "..............55444433333322222222111444333333222.............",
 ".............5544443333332222222111114433333222222............",
 "............554444333333222222211111143333222222211...........",
 "........544443343333322222211111111133332222111111111.543222..",
 ".......544433333333322222211111111111332222111111111444322111.",
 "......54443333223332222221111111111113222211111111443333311111",
 ".....544433332223322222211111111111134432211111114433333321111",
 ".....544333322222222222111111111133333333221111113333332222111",
 "...44443333222212222211111111133333333332221111133333222222111",
 ".5444333332221114333322223333333333333333333333233322222211111",
 ".4433332222211244444443333333333333333333333333333222221111111",
 "5433322222211344444443333333333333333333333333222222211111111.",
 "4333222112234444444333333333333333333333333322222221111111111.",
 "3322211112444444443333333333333333333333332222222221111111111.",
 "3322111114444444333333333333333333333333222222222221111111111.",
 "333221111344444333333333333333333333332222222222221111111111..",
 "..32211114344333333333333333333333322222222222221111111111....",
 ".........4333333333333333333333322222222222222111111111.......",
 "..........333333333333333333322222222222222111111111..........",
 "............33333333333333222222222222222111111111............",
 "..............33333222222222222222221111111111111.............",
 "...............33333332222212221111111111111111...............",
 "...................3333322222221112111111111..................",
 "......................332222222111211111......................",
]
SHELL_HEAP = [
 ".......444433344..........",
 ".....544433332244443......",
 "....544333322225433333....",
 ".555443322221233322111132.",
 ".5444332222233333211111121",
 "54444333333333333333211222",
 "54444443333333333322222221",
 "44444433333333332222222211",
 "44444333333333222222222111",
 "43433333333322222222211111",
 "44333333332222222211111111",
 ".433322222222222111111111.",
 "..3333322212111111111111..",
 "....333332221111111111....",
 "......33322211111111......",
]


BONE = dict(w='#efe8d0', v='#cbc1a3', u='#8e856c')
CLAY = dict(r='#d0844f', s='#a65d36', t='#723b22', k='#2a1a12')
SHELL = dict(w='#f4efe4', v='#cfc6b4', u='#8a8272', m='#3c4a5c', n='#22293a')
CHAFF = dict(y='#e2cf86', z='#b39b52', q='#7c6a34')
MUCK = dict(m='#a8996a', n='#7e7048', o='#4e4430')
STONE = dict(p='#a29484', q='#7c6e60', o='#4e443c', r='#9a5c44')
GLASS = dict(g='#a8d4ac', h='#4f8a5c', i='#2a4f36')
CINDER = dict(c='#6a6870', d='#3e3c44', o='#1e1d22')

# Each thing at about the size it is beside the figure, drawn to read at 1x.
ITEMS = {
 'bone': (["wv...wv", ".wwvvu.", "vu...vu"], BONE),
 'antler': (["w..w...", "vw.vw.w", ".vvvvvu"], BONE),
 'horn': (["v.....", "wv....", ".wvvvu"], BONE),
 'stone': ([".pq.", "pqrq", "qqoo"], STONE),
 'flake': ([".p", "pq"], STONE),
 'sherd': (["..rrs", ".rsst", "rstt."], CLAY),
 'pot': ([".rrss..", "rsssst.", "rskkkt.", ".sttt.."], CLAY),
 'tile': (["rrrrs.", "rssst.", ".tttt."], CLAY),
 'amphora': (["rrs..", ".rsst", "..stt", "...t."], CLAY),
 'shells': ([".wv.w", "wvuvu", ".u.wv"], SHELL),
 'oyster': (["vww..", "uvwwv", ".uuvu"], SHELL),
 'mussel': (["mn.m", "nnmn", ".n.n"], SHELL),
 'straw': (["y.z.y.", ".yzy.z", "zyzzyq"], CHAFF),
 'dung': ([".mmn.", "mnnno", ".nno."], MUCK),
 'glass': ([".g.", ".h.", "ghh", "ghi", "hii"], GLASS),
 'cinder': (["cd.", "cdd", ".do"], CINDER),
 'pipe': (["w.....", "wwvvvv"], BONE),
}

# The variants, in the order props.json names them.
CONTENTS = [
 ['bone', 'stone', 'antler', 'flake', 'bone', 'stone'],      # foragers
 ['shells', 'oyster', 'mussel', 'shells', 'bone', 'oyster'], # a shore camp
 ['sherd', 'straw', 'bone', 'pot', 'sherd', 'straw'],        # farmers
 ['dung', 'horn', 'straw', 'dung', 'bone', 'dung'],          # herders
 ['tile', 'oyster', 'sherd', 'amphora', 'bone', 'tile'],     # a town
 ['glass', 'cinder', 'pipe', 'sherd', 'bone', 'cinder'],     # after 1600
]

# Where someone went down in it: a sprawled hollow, its far wall catching the
# light, drawn over whatever was lying there.
PRINT = [
 "....111....",
 "...10015...",
 "....1155...",
 "21..101..12",
 ".2110001125",
 "...10001.5.",
 "...100015..",
 "..1005.105.",
 ".1005...105",
 ".2155...255",
]

ASH_PATCH = ["..cdd...", ".cdeedc.", "bcddcccb", ".bcb.bb."]
ASH_SMALL = [".cdc.", "bcddb", ".bb.."]

# Where things lie on each heap: on the lit crest and down the front, never
# on the outline. The first spot takes the ash.
SPOTS = {
 'household': [(7, 6), (15, 3), (22, 9), (9, 13), (17, 15), (27, 12), (4, 17)],
 'communal': [(20, 6), (27, 3), (36, 12), (14, 15), (24, 20), (40, 21), (48, 16), (8, 21), (31, 26), (52, 23), (33, 8), (18, 24), (44, 26)],
 'shell': [(6, 4), (10, 3), (16, 7), (5, 9), (19, 10), (12, 11), (23, 6)],
}
PRINTS = {'household': (12, 6), 'communal': (24, 12)}


def _heap(rows, spots, things, v, frame, ramp=DARK, flies=2, print_at=None):
 sky = 7 if flies else 1
 w, h = len(rows[0]) + 2, len(rows) + sky + 1
 c = Canvas(w, h)
 at = lambda x, y: (x + 1, y + sky)
 draw_grid(rows, ramp_keys(ramp, ASH), c, at(0, 0))
 draw_grid(ASH_PATCH if len(rows[0]) > 30 else ASH_SMALL, ramp_keys(ramp, ASH), c, at(*spots[0]))
 for (x, y), name in zip(spots[1:], things):
  grid, keys = ITEMS[name]
  draw_grid(grid, keys, c, at(x, y))
 if print_at: draw_grid(PRINT, ramp_keys(ramp), c, at(*print_at))
 soft_outline(c, ramp[0], ramp[3])
 # A fly or two over the heap, each frame somewhere new: what flies look
 # like at a glance.
 for i in range(flies):
  n = jitter(frame, i, v)
  if (n + frame) % 4 == 0: continue
  c.set(w // 3 + n % (w // 3), 1 + (n // 7) % 6, FLY)
 im = c.image()
 im.info['anchor'] = [w // 2, h - 2]
 return im


def household(v=0, frame=0, dented=False):
 """The yard's own tip, a couple of metres across."""
 ramp = SHELLY if v == 1 else DARK
 return _heap(HOUSEHOLD, SPOTS['household'], CONTENTS[v], v, frame, ramp,
              print_at=dented and PRINTS['household'])


def communal(v=0, frame=0, dented=False):
 """The village midden: years of it, spreading down its own slope."""
 ramp = SHELLY if v == 1 else DARK
 return _heap(COMMUNAL, SPOTS['communal'], CONTENTS[v] * 2, v, frame, ramp, flies=3,
              print_at=dented and PRINTS['communal'])


def household_dented(v=0): return household(v, dented=True)
def communal_dented(v=0): return communal(v, dented=True)


def shell_midden(v=0):
 """A camp's mound of shell, white where the last meals went on, dark with
 the ash of the fires they were cooked on."""
 things = [['oyster', 'shells', 'oyster', 'mussel', 'oyster', 'shells'],
           ['mussel', 'shells', 'mussel', 'oyster', 'mussel', 'shells'],
           ['shells', 'shells', 'oyster', 'shells', 'mussel', 'shells']][v]
 return _heap(SHELL_HEAP, SPOTS['shell'], things, v, 0, SHELLY, flies=0)


MIDDEN = {
 'privy-midden': household,
 'midden': communal,
 'shell-midden': shell_midden,
}
