"""Expanded variants of the seven oblique house families used as art standards.

The small source recipes remain ordinary settlement options.  Gold masters are
larger, named recipes compiled into the same atlas; their data lives beside the
source buildings in buildings.json so a future art pass changes scale and
composition without adding another painter branch.
"""


def gold_master_recipes(source):
    out = {}
    for family, spec in source.get('goldMasters', {}).items():
        base = source['buildings'][spec['source']]
        for scale, shape in spec['sizes'].items():
            count = shape.get('variants', 1)
            for variant in range(count):
                fw, fh = shape['footprint']
                stories = shape.get('stories', base.get('stories', 1))
                name = f'{family}-gold-{scale}-{variant}'
                entrance_x = shape.get('entrance', fw // 2)
                out[name] = {
                    **base,
                    **{k: v for k, v in shape.items()
                       if k not in ('variants', 'seedOffset', 'entrance')},
                    'footprint': [fw, fh],
                    'entrance': [entrance_x, fh],
                    'stories': stories,
                    'height': stories * 31 + 24,
                    'seed': base['seed'] + shape.get('seedOffset', 0) + variant * 97,
                    'label': f"{spec['label']} · {scale} {variant + 1}",
                    'description': spec['description'],
                    'goldMaster': family,
                    'goldScale': scale,
                    'goldVariant': variant,
                }
    return out

