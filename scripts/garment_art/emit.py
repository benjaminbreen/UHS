from shapes import ART
ORDER = [
 ('body', ['tunic','long-tunic','shirt','coat','robe','open-robe','dress','gown',
           'skirt','wrap','poncho','loincloth','suit']),
 ('over', ['cloak','shoulder-cloth']),
 ('head', ['band','cap','hood','wrap_head','turban','headscarf','veil','brimmed',
           'conical','bowler','flat-cap','ball-cap','fez','fillet','plume','wig',
           'helmet','visor']),
 ('legs', ['trousers','wide','hose','wrapped','sarong']),
 ('feet', ['sandals','shoes','boots']),
 ('belt', ['cord','sash','leather','belt-wide']),
 ('jewellery', ['necklace','earrings']),
]
def key(k):
    return k if k.replace('-','').isalnum() and '-' not in k else '"%s"' % k
out = ['''/**
 * Twenty-four-pixel garment art, one drawing per silhouette rather than per
 * garment: the cloth's dye and fibre colour it at draw time, so one tunic
 * serves madder wool and white polyester alike. Light falls from the upper
 * left, so the lit edge is `O` and the far edge `x` then `#`.
 *
 * `.` outline, `#` deep shade, `x` shade, `o` body, `O` highlight,
 * `:` a seam or a fold in the weave, `t`/`T` trim, `k`/`K` fixed leather,
 * `m`/`M` fixed metal, space empty.
 *
 * Generated art, hand-checked: the shapes come from a drape model in
 * scripts/garment_art/ rather than from typing spaces.
 */
export const GARMENT_ICON = 24;

export const garmentArt: Record<string, readonly string[]> = {''']
seen = set()
for label, names in ORDER:
    out.append('  // ── %s %s' % (label, '─'*(66-len(label))))
    for n in names:
        seen.add(n)
        rows = ART[n]
        out.append('  %s: [' % key(n))
        for r in rows:
            out.append('    "%s",' % r)
        out.append('  ],')
missing = set(ART)-seen
assert not missing, missing
out.append('};')
open(__file__.rsplit('/scripts/',1)[0] + '/src/render/garment-art.ts','w').write('\n'.join(out)+'\n')
print('wrote', sum(len(ART[n]) for _, ns in ORDER for n in ns), 'rows')
