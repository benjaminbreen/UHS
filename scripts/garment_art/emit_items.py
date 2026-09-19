from items import ITEMS, COLOR
root = __file__.rsplit('/scripts/', 1)[0]
out = ['''/**
 * Item icons, on the same twenty-four-pixel grid and the same light as the
 * garments. An item is not cloth, so each one carries its own two colours:
 * the body, and the accent that `t`/`T` draw in.
 *
 * Edit the art in scripts/garment_art/items.py, not here.
 */
import type { IconArt } from "./garment-art";

export const itemColors: Record<string, readonly [string, string]> = {''']
for name in sorted(ITEMS):
    base, accent = COLOR[name]
    out.append('  "%s": ["%s", "%s"],' % (name, base, accent))
out.append('};')
out.append('')
out.append('export const itemArt: Record<string, IconArt> = {')
for name in sorted(ITEMS):
    out.append('  "%s": [' % name)
    for row in ITEMS[name]:
        out.append('    "%s",' % row)
    out.append('  ],')
out.append('};')
open(root + '/src/render/item-art.ts', 'w').write('\n'.join(out) + '\n')
print('wrote', len(ITEMS), 'items')
