"""Bags, bales, baskets and boxes, drawn by hand.

Digits are the body's ramp, a-g a cord, binding or lid, A-G a dye or the
contents. A lid is its own grid so the open state can set it down beside.
"""
from .core import Canvas, RAMPS, draw_grid, ramp_keys, soft_outline, lay_down

RAMPS['hide7'] = ['#24170f', '#3b2618', '#553722', '#714a2e', '#8d613d', '#a87b50', '#c29868']
RAMPS['rawhide7'] = ['#3a3024', '#5a4a36', '#7d6a4e', '#9e8a68', '#bba884', '#d3c3a2', '#e8dcc0']
RAMPS['birch7'] = ['#2e2a26', '#4a4540', '#6e6862', '#948e86', '#b8b2a8', '#d6d1c6', '#efebe2']
RAMPS['bamboo7'] = ['#24260f', '#3a3d18', '#565a24', '#737832', '#919545', '#aeb25e', '#cacd84']
RAMPS['indigo7'] = ['#10142a', '#1a2342', '#26345e', '#34487a', '#4a6396', '#6a84b0', '#94a9c8']
RAMPS['basket7'] = ['#3b2616', '#5c3d22', '#80592f', '#a67b44', '#c49c5e', '#dcbb80', '#efd6a4']
RAMPS['cedar7'] = ['#3a2213', '#5e3a1f', '#84552c', '#a8723c', '#c4904f', '#d9ac6a', '#ead08c']
RAMPS['madder7'] = ['#2a0f0e', '#451816', '#64221d', '#852f25', '#a3432f', '#bd5e42', '#d3825f']


def _rows(spec, w):
 """(start, run) pairs to rows of width `w`: easier to keep centred by hand."""
 return [('.' * s + run).ljust(w, '.') for s, run in spec]


def _set(rows, cells):
 g = [list(r) for r in rows]
 for x, y, ch in cells: g[y][x] = ch
 return [''.join(r) for r in g]


def _draw(rows, keys, rim, after=(), w=None, h=None, top=0, left=0, anchor_w=None):
 # One pixel of margin all round: the outline goes outside the drawing.
 parts = [(g, (x + 1, y + 1)) for g, (x, y) in [(rows, (left, top)), *after]]
 w = w or max(at[0] + len(g[0]) for g, at in parts) + 1
 h = h or max(at[1] + len(g) for g, at in parts) + 1
 c = Canvas(w, h)
 for g, at in parts: draw_grid(g, keys, c, at)
 soft_outline(c, rim[0], rim[2])
 im = c.image()
 im.info['anchor'] = [left + (anchor_w or len(rows[0])) // 2 + 2, top + len(rows) + 2]
 return im


WATERSKIN = _set(_rows([
 (0, "565"), (0, "bcb"), (1, "454"), (2, "454566666665544"), (2, "456666666666554432"),
 (1, "45666666666665544321"), (1, "45556666665555444321"), (1, "44555555555544443321"),
 (1, "34444444444444333221"), (1, "23344444443333322211"), (2, "223333333222222111"),
 (4, "11111111111111")], 21),
 [(12, 1, '4'), (13, 1, '3'), (12, 2, '4'), (13, 2, '5'), (14, 2, '3'), (16, 1, '4'), (16, 2, '4'), (17, 2, '3'),
  (6, 4, '5'), (8, 4, '5'), (10, 4, '5'), (12, 4, '5'), (14, 4, '5')])


def waterskin(v=0):
 """A goatskin turned and sewn, lying on its side: the neck tied with cord,
 the leg stubs bound off, a seam along the back."""
 m = RAMPS[['hide7', 'copper7'][v]]
 return _draw(WATERSKIN, ramp_keys(m, RAMPS['rope']), m)


BALE = _rows([
 (2, "455555555555555554"), (1, "45666666666666665543"), (0, "4566666666666666655432"),
 (0, "4566666666666666555432"), (0, "4566666666666665555432"), (0, "4555555555555555555432"),
 (0, "4555555555555555554321"), (0, "3444444443333332222110"), (0, "3444444433333332222110"),
 (0, "3444244443333333222110"), (0, "3444444443333332222110"), (0, "3444444433333322222110"),
 (0, "3444444443333332221110"), (0, "3444444433333332222110"), (0, "3344444433333322222110"),
 (0, "2333333332222222211100"), (1, "12222222222222221110")], 22)
# Two ropes over the top and down the front, one round it, knotted where they cross.
BALE_ROPES = _set(_rows([
 (6, "c" + "." * 8 + "c"), (6, "c" + "." * 8 + "c"), (6, "c" + "." * 8 + "c"),
 (0, "bccccccdccccccccdccbbb".replace('b', 'c', 3)), (6, "c" + "." * 8 + "c"), (6, "c" + "." * 8 + "c"),
 (6, "c" + "." * 8 + "b"), (6, "c" + "." * 8 + "b"), (6, "c" + "." * 8 + "b"), (6, "c" + "." * 8 + "b"),
 (0, "cccccdcccccccccbdbbbba"), (5, "ddd.......b"), (6, "c" + "." * 8 + "b"),
 (6, "c" + "." * 8 + "b"), (6, "b" + "." * 8 + "a"), (6, "b" + "." * 8 + "a")], 22), [])
# Untied: the top folded back, bolts of indigo, madder and undyed cloth inside.
BALE_OPEN = _rows([
 (1, "33444444444444444332"), (0, "45BCDCB4pqrqp456665432"), (0, "45BCDCB4pqrqp456665432"),
 (0, "45ABCBA4opqpo445554432"), (0, "45ABCBA4opqpo445554432"), (0, "45CDBDC3qrorq356465432"),
 (0, "3444444444444444444321")], 22)


def merchant_bale(v=0, open=False):
 """Cloth bolts wrapped in a cover and corded for the road."""
 m = RAMPS[['burlap7', 'linen7'][v]]
 mad = RAMPS['madder7']
 keys = ramp_keys(m, RAMPS['oak7'], RAMPS['indigo7'], o=mad[2], p=mad[3], q=mad[4], r=mad[5])
 if open:
  coil = _rows([(1, "bccb"), (0, "cb..bc"), (1, "bccb")], 6)
  return _draw(BALE, keys, m, after=[(BALE_OPEN, (0, 0)), (coil, (21, 15))])
 return _draw(BALE, keys, m, after=[(BALE_ROPES, (0, 0))])


def merchant_bale_open(v=0): return merchant_bale(v, open=True)


MILK_BAG = _set(_rows([
 (2, "edc"), (3, "ec"), (4, "ec"), (5, "ec"), (6, "ec"), (5, "cdeedc"), (6, "4554"),
 (4, "45665443"), (3, "4566654432"), (2, "456666554432"), (1, "45666665544321"),
 (1, "45666655443321"), (0, "4566665544433221"), (0, "4556655444332211"),
 (0, "3455544443332211"), (0, "3444444333322211"), (1, "23333332222111"), (3, "1111111111")], 17),
 [(7, 7, 'w'), (8, 8, 'w'), (7, 9, 'w'), (5, 10, '4'), (5, 12, '4'), (5, 14, '3'), (11, 12, '2'), (12, 13, '2')])


def milk_bag(v=0):
 """A big hide bag of mare's milk turning to airag, the churning stick left
 standing in its mouth."""
 m = RAMPS[['hide7', 'walnut7'][v]]
 return _draw(MILK_BAG, ramp_keys(m, RAMPS['oak7'], w='#e8e4d4'), m)


TARU = _rows([
 (4, "455555554"), (2, "45ABCCCBA54"), (1, "45BCDDDDDCB54"), (1, "4ABCCCCCCCBA43"),
 (1, "45AAABBBAA5432"), (1, "456666666655432"), (1, "234444444433211"),
 (1, "343443332321211"), (1, "454554443432322"), (1, "eee554443432cbb"), (1, "454eeeedddcc322"),
 (1, "454554443432322"), (1, "454554443432322"), (1, "eee554443432cbb"), (1, "454eeeedddcc322"),
 (1, "454554443432322"), (1, "343443332321211"), (2, "2333332221111"), (4, "111111111")], 17)
TARU_LID = _rows([
 (4, "456666654"), (2, "4566666666554"), (1, "456644444466543"), (1, "456633333365543"),
 (1, "455666666655432"), (1, "345555555544321")], 17)


def taru(v=0, lid=True):
 """A cedar tub of miso or pickles: staves, two split-bamboo hoops, a lid
 with a cleat."""
 m = RAMPS[['ash7', 'oak7'][v]]
 keys = ramp_keys(m, RAMPS['bamboo7'], RAMPS[['walnut7', 'madder7'][v]])
 if lid: return _draw(TARU, keys, m, after=[(TARU_LID, (0, 0))])
 return _draw(TARU, keys, m, after=[(TARU_LID, (11, 14))], anchor_w=17)


def taru_open(v=0): return taru(v, lid=False)


# A tawara drawn standing, cap uppermost, and laid down by `lay_down`: the
# straw then runs along it and the woven cap faces you.
TAWARA = _rows([
 (3, "4566654"), (1, "45654565543"), (0, "4565444456543"), (0, "4564565465543"),
 (0, "4565444455432"), (0, "3456555654432"), (1, "34444444321"),
 (0, "4565456554432"), (0, "4556545654332"), (0, "dee6545654cbb"), (0, "456eeeddcc432"),
 (0, "4565456554432"), (0, "4556545654332"), (0, "dee5456554cbb"), (0, "456eeeddcc332"),
 (0, "4565456554432"), (0, "4556545654332"), (0, "dee6545654cbb"), (0, "455eeeddcc332"),
 (0, "3454345443321"), (1, "23333333221")], 13)


def rice_bale(v=0):
 """A straw bale of rice: a woven cap at each end, three rope bands."""
 m = RAMPS[['straw', 'wicker7'][v]]
 return _draw(lay_down(TAWARA), ramp_keys(m, RAMPS['oak7']), m)


MILK_VESSEL_LID = _rows([(5, "e"), (4, "ede"), (4, "edc"), (3, "eddcb"), (2, "deddccb"), (2, "cbbbbaa")], 11)
MILK_VESSEL = _rows([
 (0, ""), (0, ""), (0, ""), (0, ""), (0, ""), (3, "45654"),
 (3, "45543"), (3, "44432"), (2, "4565432"), (1, "456654321"), (1, "4w6w5w3w1"),
 (1, "456654321"), (1, "455544321"), (1, "456554321"), (0, "34566543221"),
 (0, "34565543221"), (0, "34555443221"), (0, "33454433211"), (0, "23444332211"),
 (1, "233332211"), (2, "1111111")], 11)
MILK_VESSEL_MOUTH = _rows([(3, "45654"), (3, "5www4")], 11)


def _milk_keys(v):
 m = RAMPS[['walnut7', 'hide7'][v]]
 return m, ramp_keys(m, RAMPS['hide7'], w='#e6e1cf')


def milk_vessel(v=0, lid=True):
 """A Somali woven milk vessel, waisted, a band of cowries, its leather cap
 on."""
 m, k = _milk_keys(v)
 if lid: return _draw(MILK_VESSEL, k, m, after=[(MILK_VESSEL_LID, (0, 0))])
 return _draw(MILK_VESSEL, k, m, after=[(MILK_VESSEL_MOUTH, (0, 5)), (MILK_VESSEL_LID, (8, 15))], anchor_w=11)


def milk_vessel_open(v=0): return milk_vessel(v, lid=False)


def milk_vessel_fallen(v=0):
 m, k = _milk_keys(v)
 whole = [a if a.strip('.') else b for a, b in zip(MILK_VESSEL_LID + [''] * 15, MILK_VESSEL)]
 return _draw(lay_down(whole), k, m)


BARK_BOX = _rows([
 (3, "455555554"), (1, "45ABCCCCCBA54"), (0, "45BCDCCDCCDCB54"), (0, "4ABCCDCCDCCBA43"),
 (0, "45AABBBBBBBAA43"), (0, "455555555554432"), (0, "234444444433211"),
 (0, "456115555544321"), (0, "455555511544321"), (0, "451155555544321"),
 (0, "455555115543321"), (0, "344444444333211"), (1, "2222222221110")], 15)
BARK_BOX_LID = _rows([
 (3, "456666654"), (1, "4566666666654"), (0, "456666666666543"), (0, "455666666665432"),
 (0, "4c44c44c44c44c3"), (0, "344444444443321")], 15)


def bark_box(v=0, lid=True):
 """Birchbark folded and stitched with spruce root, a bentwood lid; berries
 inside."""
 m = RAMPS['birch7']
 k = ramp_keys(m, RAMPS['hide7'], RAMPS[['indigo7', 'madder7'][v]])
 if lid: return _draw(BARK_BOX, k, m, after=[(BARK_BOX_LID, (0, 0))])
 return _draw(BARK_BOX, k, m, after=[(BARK_BOX_LID, (11, 9))], anchor_w=15)


def bark_box_open(v=0): return bark_box(v, lid=False)


COOLAMON = _rows([
 (5, "4566666666654"), (2, "4563333333333333654"), (1, "456333444444444333654"),
 (0, "45633444455555444433543"), (0, "45644455555555554444542"), (1, "456555566666655554432"),
 (1, "345666666666666554321"), (2, "2343443434434343321"), (5, "1222222222221")], 23)


def coolamon(v=0):
 """A carrying dish hollowed from a burl, fluted outside, worn smooth within."""
 m = RAMPS[['oak7', 'redearth7'][v]]
 return _draw(COOLAMON, ramp_keys(m), m)


RAMPS['palm7'] = ['#1f2a10', '#334419', '#4b6122', '#677f2e', '#86993f', '#a5b257', '#c3c97a']
MILLET = dict(p='#6e5a32', q='#94804c', r='#b8a46a', s='#d6c690')

HAMPER_LID = _rows([
 (7, "565"), (5, "4566654"), (3, "45666665543"), (1, "4BCDEEEDDDCCBA3"), (0, "45666666665544321"),
 (0, "34555555554443321"), (1, "233333333332211"), (3, "22222222211")], 17)
HAMPER = _rows([
 (0, ""), (0, ""), (0, ""), (0, ""), (0, ""), (0, ""), (0, ""),
 (3, "45666554433"), (2, "3455555444321"), (1, "456666665554432"), (1, "344555554443321"),
 (0, "45666666555544321"), (0, "BCDEEEDDDDCCCBBAA"), (0, "34555555444433211"),
 (0, "45666666555544321"), (0, "BCDEEEDDDDCCCBBAA"), (0, "34555555444433211"),
 (1, "456666655544321"), (1, "344555544433211"), (2, "3455554443221"), (3, "22333332211")], 17)
HAMPER_MOUTH = _rows([
 (3, "45666665543"), (2, "4521111111254"), (1, "41pqrssrrqqpp13"), (1, "51ppqqrrqqpp143"), (2, "5666666555443")], 17)


def grain_hamper(v=0, lid=True):
 """A coiled grass basket, bellied, two dyed bands, a peaked lid."""
 m = RAMPS[['straw', 'wicker7'][v]]
 k = ramp_keys(m, RAMPS['oak7'], RAMPS[['madder7', 'indigo7'][v]], **MILLET)
 if lid: return _draw(HAMPER, k, m, after=[(HAMPER_LID, (0, 0))])
 return _draw(HAMPER, k, m, after=[(HAMPER_MOUTH, (0, 5)), (HAMPER_LID, (13, 13))], anchor_w=17)


def grain_hamper_open(v=0): return grain_hamper(v, lid=False)


ANDEAN_SACK = _rows([
 (6, "565"), (5, "45654"), (5, "tsssr"), (4, "4566654"), (2, "45666665543"),
 (1, "5DE66de65DD43"), (0, "45DE66de65DD432"), (0, "45DE66de65DD432"), (0, "45DE66de65DD432"),
 (0, "45DE66de65DD432"), (0, "34CD55cd54CC321"), (0, "34CD55cd54CC321"), (0, "34CD55cd54CC321"),
 (0, "23BC44bc43BB211"), (1, "2BC33bc32BB21"), (2, "11122111111")], 15)
CORD = dict(r=RAMPS['oak7'][2], s=RAMPS['oak7'][4], t=RAMPS['oak7'][5])


def andean_sack(v=0):
 """A warp-striped costal, its mouth folded over and tied."""
 m, a = [(RAMPS['rawhide7'], RAMPS['walnut7']), (RAMPS['hide7'], RAMPS['rawhide7'])][v]
 return _draw(ANDEAN_SACK, ramp_keys(m, a, RAMPS['madder7'], **CORD), m)


_PANEL = ["EEE666b666DDD", "EE666bcb666DD", "E666bcdcb666D", "E666bcdcb666D", "EE666bcb666DD", "EEE666b666DDD"]
PARFLECHE = _set(_rows([
 (1, "4" + "5" * 18 + "4"), (0, "45" + "6" * 17 + "543"), (0, "45" + "6" + "2" * 15 + "6" + "543"),
 *[(0, "45" + "62" + p + "26" + "543") for p in _PANEL],
 (0, "45" + "6" + "2" * 15 + "6" + "543"), (0, "45" + "5" * 17 + "543"),
 (0, "3" + "4" * 17 + "3321"), (1, "2" * 18 + "11")], 22),
 [(0, 5, 't'), (0, 6, 's'), (21, 5, 's'), (21, 6, 'r'), (1, 5, 's'), (20, 5, 'r')])


def parfleche(v=0):
 """A folded rawhide case lying flat, its flaps painted and tied shut."""
 m = RAMPS['rawhide7']
 dyes = [(RAMPS['indigo7'], RAMPS['madder7']), (RAMPS['madder7'], RAMPS['bingreen7'])][v]
 return _draw(PARFLECHE, ramp_keys(m, *dyes, **CORD), m)


PACIFIC_A, PACIFIC_B = "45656565656545432", "45565656565454321"
PACIFIC_C, PACIFIC_D = "34545454545434321", "34454545454343211"
PACIFIC_BASKET = _rows([
 (3, "4554...4554"), (2, "4....3.4....3"), (2, "4....3.4....3"),
 (1, "456666666666653"), (0, "45112222222221154"), (0, "45111122222111143"), (0, "56666666666655443"),
 *[(0, r) for r in (PACIFIC_A, PACIFIC_B, PACIFIC_A, PACIFIC_B, PACIFIC_A, PACIFIC_C, PACIFIC_D, PACIFIC_C)],
 (1, "233333333332211")], 17)


def pacific_basket(v=0):
 """A basket plaited from a split coconut frond, fresh green or dried, the
 midrib folded into handles."""
 m = RAMPS[['palm7', 'straw'][v]]
 return _draw(PACIFIC_BASKET, ramp_keys(m), m)


BIN_LID = _rows([
 (8, "45665"), (6, "456666554"), (4, "4566666655443"), (2, "45666666665544332"),
 (1, "4566666666655544332"), (0, "456666666665555443322"), (0, "344555555555544433221"),
 (0, "cdd" + "3" * 12 + "22bbba"), (2, "c" + "d" * 12 + "ccbb"), (5, "bbbbbbbbbaa")], 21)
_BA, _BB = "456e65656e65655d432", "455e56565e56554d321"
_BC, _BD = "345d54545d54544c321", "344d45454d45443c210"
GRAIN_BIN = _rows([
 *[(0, r) for r in (_BA, _BB, _BA, _BB, _BA, _BB, _BA, _BB, _BC, _BD, _BC, _BD)],
 (0, "c" + "d" * 13 + "ccbba"), (2, "dc.....dc....cb"), (2, "dc.....dc....cb"), (2, "ba.....ba....ba")], 19)
BIN_MOUTH = _rows([
 (4, "45666666654"), (2, "456211111125543"), (1, "4521DEEFFFEED1543"), (0, "451CDEFFGGFFEEDC143"),
 (0, "541BCDEEFFEEDDCB132"), (1, "cd1ABCDDDCCBA1cba"), (3, "dddddddddccbb")], 19)
RAMPS['paddy7'] = ['#3d2a0c', '#5e4214', '#82601f', '#a4802c', '#c49c3a', '#dcb64e', '#ecd06e']


def grain_bin(v=0, lid=True):
 """A wicker grain bin stiffened with wooden ribs, up on feet against damp
 and rats, a conical lid; paddy inside."""
 m = RAMPS[['wicker7', 'straw'][v]]
 k = ramp_keys(m, RAMPS[['oak7', 'walnut7'][v]], RAMPS['paddy7'])
 if lid: return _draw(GRAIN_BIN, k, m, left=1, top=7, after=[(BIN_LID, (0, 0))])
 return _draw(GRAIN_BIN, k, m, left=1, top=7, after=[(BIN_MOUTH, (1, 4)), (BIN_LID, (15, 14))], anchor_w=19)


def grain_bin_open(v=0): return grain_bin(v, lid=False)


# Traced from the SDF container studies at 0.8x, onto the house ramps: the
# big storage versions, which keep those studies' view from above.
BIG_BIN = [
 "..........5454444..........",
 "......555565644544fff......",
 ".....5556566655554ggff.....",
 "...54555566565554g44ggg5...",
 "..4556656666655554g44ggg6d.",
 ".5555666666565455544g44gff.",
 ".55666656666654554444ggggf.",
 "55666656566655554544444fggf",
 "566666666656555555544gggggf",
 ".4656666666655545444g44gg5.",
 ".646665656665554544444g45g.",
 ".66556666566555455544g45g3.",
 ".6g46566656655545554444fe3.",
 ".55644fg5666555555gffff333.",
 ".544644544ffgggff3f3ef33f3.",
 "..g546654ggff3ffeff333e3e..",
 "..4544466666534363543ef3f..",
 "..454455444443ggggg3fef3f..",
 "..g54445g44443ggggf3ffe3e..",
 "..455445444gg3gfggg3fff3f..",
 "..6444543gggg3gfff5fffff3..",
 "..564444344443gggg5eeff33..",
 "..5664443gggg3gfff5fff333..",
 "..544644344443gggg5fe63f3..",
 "..544453466666666533fe3f3..",
 "..54444434433333gf5fff3f3..",
 "..5454444444g3gggg5ffe4f3..",
 "...45444444443gggg5eff4f...",
 "...65544444443gggg5eff43...",
 "...545444gggg3gfff5fff33...",
 "....5g44444443gggg5fef3....",
 "....66654g4443gggf5f643....",
 "....5555g445555433f3355....",
 "....4444433ff3ff3333344....",
 ".....55c...........c33.....",
 ".....55.............55.....",
 ".....55.............55.....",
]
BIG_HAMPER = [
 ".........555554.........",
 ".....54545333453433.....",
 "...555555555554444433...",
 ".5554555455555544443333.",
 ".5455555555555555443333.",
 "555666666544445544444343",
 "566666566665555554444433",
 "666656666555544555434433",
 "566666666665555555444443",
 ".5656666665555555544343.",
 ".6366666665555555554433.",
 ".5563665555554444553433.",
 ".5535333565555543333332.",
 ".5455554333333332332223.",
 ".4554555544444333322332.",
 ".4455543564554543333322.",
 ".4465555443333333332433.",
 ".4444434653333553333233.",
 ".4454444444443333333333.",
 ".6454553334443333333333.",
 ".4444433444333333333333.",
 ".5443644444343333342333.",
 ".4444433455454433233333.",
 ".6446444443333333334333.",
 "..46344434555533333233..",
 "..44433444334333322333..",
 "..34335533333333343232..",
 "..54434443444333332333..",
 "...333434433333333233...",
 "...533343333332233333...",
 "....6354333333333333....",
 ".....63333555533333.....",
 ".........344433.........",
]
BIG_TARU = [
 ".......66666666.......",
 "...6666666666666666...",
 "..eeeeeeeeeeeeeeeeee..",
 ".66666666666666666665.",
 ".eeee6666666666666eee.",
 "66eeeeeeeeeeeeeeeeee3g",
 "636666666666666666663f",
 "f556eeeeeeeeeeeeee436f",
 "666566f6666666666d656f",
 "f5f663g66533464666ff3f",
 ".655f666666456666fd3f.",
 ".f65g5fff6666fff3edff.",
 ".5f665545553444e3fff3.",
 ".55555fff6666fff3ed33.",
 ".55555345553444e3e433.",
 ".55555545353444e3e433.",
 ".55555545353444e3e433.",
 ".55555545353444e3e433.",
 ".55555545353444e3e433.",
 "655555545353444e3e433f",
 "655555545353444e3e433f",
 "f55555545353444e3e433f",
 "665555545353444e3e43ff",
 "6f6555545353444e3ed6ff",
 ".655f666655346666fd3f.",
 ".f6555fff6666fff33dff.",
 "..f665545553444e3fff..",
 "...4f666655346666f3...",
 ".......d433d333.......",
]
BIG_SACK = [
 "..11....................",
 ".155f..............5gg..",
 ".e00g.1111111111111e00e.",
 ".e444e66666666666654445.",
 ".f666g66666666666656645.",
 ".g66666666666666666664f.",
 "..666666666666666666644.",
 ".1656655555655555556644.",
 ".6544466664e5g666664454.",
 ".6656555556666555554544.",
 ".ee66g555g5GG5e555g555e.",
 ".g666GG55efggfe55GG555e4",
 "55666GG5555EE5455GG545e4",
 "5g665GG5555GG5455GG545g4",
 "65655GG5555GG5555GG44444",
 "65655GG5555GG5555GG44444",
 "65655GG5555GG5555GG44444",
 "6ee55GG5555GG5555GG444e4",
 "45554FF4444FF4444FF4444.",
 "45444FF4444FF4444FF4444.",
 ".ee44FF4444FF4444FF444e.",
 ".4554FF4444FF4444FF444g.",
 ".fGFFFFFFFFFFFFFFFFFE4f.",
 ".ee44FF4444FF4444FF444e.",
 "..445FF4444FF4444FF44...",
 "....4EE2444DE4444444....",
 "............444.........",
]
BIG_BALE = [
 ".......Ff..............Ff......",
 ".666666Ff66666666666666Ff66665F",
 ".666666Ff66666666666666Ff66665F",
 ".666666Ff66666666666666Ff66665F",
 ".666666Ff66666666666666Ff66665F",
 ".666666gf66666666666666gf66665F",
 ".666666gf66666666666666gf66665F",
 ".666666gf66666666666666gf666665",
 ".666666gf66666666666666gf66665F",
 ".665555gf55555555555555gf55555F",
 ".555555gf55555555555555gf5555FE",
 ".555555Ff55555555555555Ff5555FE",
 "F5555E5ff55555555555555ff5E55DE",
 "F555f5EEf55555555555555ffE555DE",
 "f555555ffEEE555555555EEEf55dDFE",
 ".555555ff55555555555555ff555DFE",
 ".ffffffffffffffffffffffffffffff",
 ".dddddddddddddddddddddddddddddf",
 ".5EEE5gdffEdeEEEEEEEEEEff5EEEEE",
 ".555555ff5eeE5555555555ff55D5FE",
 ".55F555ff55555555555555ff55FDEE",
 ".555d55ff55555555555555ff555FDE",
 ".5FFF55ff55555555555555ff55FFED",
 "..DDDEEedEEEEEEEEEEEEEEedEEDDD.",
]


def _mouth(w, h, fill, depth=2):
 """An open top seen from above: lit rim, the far wall in shadow, contents
 sitting `depth` rows down. The arc every open state starts from."""
 a, b, rows = w / 2, h / 2, []
 for y in range(h):
  r = ''
  for x in range(w):
   u, v = (x + .5 - a) / a, (y + .5 - b) / b
   ui, vi = (x + .5 - a) / (a - 1.5), (y + .5 - b) / (b - 1.2)
   vc = (y + .5 - b - depth) / (b - 1.2)
   if u * u + v * v > 1: r += '.'
   elif ui * ui + vi * vi > 1: r += '6' if u < -.35 else '5' if u < .35 else '4'
   elif ui * ui + vc * vc <= 1: r += chr(ord(fill) + (6 if ui < -.5 and vc < -.3 else 5 if ui < -.3 else 4 if ui < .3 else 3))
   else: r += '1'
  rows.append(r)
 return rows


def _big(rows, keys, ramp, lid_end=None, fill='A', depth=2):
 """A traced big store, closed, or open with its lid set down beside it."""
 if lid_end is None: return _draw(rows, keys, ramp)
 lid, body = rows[:lid_end], rows[lid_end:]
 spans = [(len(r) - len(r.lstrip('.')), len(r.rstrip('.'))) for r in body[:3]]
 x0, x1 = min(s[0] for s in spans), max(s[1] for s in spans)
 h = max(5, round((x1 - x0) * .36))
 top = h // 2
 at = (len(body[0]) - len(lid[0]) // 3, top + len(body) - len(lid) - 1)
 return _draw(body, keys, ramp, top=top, after=[(_mouth(x1 - x0, h, fill, depth), (x0, 0)), (lid, at)], anchor_w=len(body[0]))


def big_grain_bin(v=0, open=False):
 m = RAMPS[['basket7', 'wicker7'][v]]
 return _big(BIG_BIN, ramp_keys(m, RAMPS['walnut7'], RAMPS['paddy7']), m, 13 if open else None)


def big_grain_hamper(v=0, open=False):
 m = RAMPS[['basket7', 'wicker7'][v]]
 return _big(BIG_HAMPER, ramp_keys(m, RAMPS[['madder7', 'indigo7'][v]], RAMPS['straw']), m, 12 if open else None)


def big_taru(v=0, open=False):
 m = RAMPS[['cedar7', 'oak7'][v]]
 return _big(BIG_TARU, ramp_keys(m, RAMPS['walnut7'], RAMPS['walnut7']), m, 8 if open else None, depth=1)


def big_andean_sack(v=0):
 m = RAMPS['rawhide7']
 return _draw(BIG_SACK, ramp_keys(m, RAMPS['oak7'], RAMPS[['madder7', 'indigo7'][v]]), m)


def big_bale(v=0):
 m = RAMPS[['rawhide7', 'linen7'][v]]
 return _draw(BIG_BALE, ramp_keys(m, RAMPS['straw'], RAMPS['burlap7']), m)


def big_grain_bin_open(v=0): return big_grain_bin(v, True)
def big_grain_hamper_open(v=0): return big_grain_hamper(v, True)
def big_taru_open(v=0): return big_taru(v, True)
