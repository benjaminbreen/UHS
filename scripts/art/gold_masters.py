"""Expanded variants of the seven oblique house families used as art standards.

The small source recipes remain ordinary settlement options.  Gold masters are
larger, named recipes compiled into the same atlas; their data lives beside the
source buildings in buildings.json so a future art pass changes scale and
composition without adding another painter branch.
"""


def scaled_family_recipes(source, table, suffix, marker=None):
    out = {}
    for family, spec in source.get(table, {}).items():
        base = source['buildings'][spec['source']]
        for scale, shape in spec['sizes'].items():
            count = shape.get('variants', 1)
            for variant in range(count):
                fw, fh = shape['footprint']
                stories = shape.get('stories', base.get('stories', 1))
                name = f'{family}-{suffix}-{scale}-{variant}'
                entrance_x = shape.get('entrance', fw // 2)
                wealth = shape.get('wealthTiers', [2] if scale == 'large' else [0, 1])
                functions = shape.get('functions', [spec.get('function', 'household')])
                service_styles = shape.get('serviceStyles', [])
                out[name] = {
                    **base,
                    **{k: v for k, v in shape.items()
                       if k not in ('variants', 'seedOffset', 'entrance', 'wealthTiers',
                                    'functions', 'serviceStyles')},
                    'footprint': [fw, fh],
                    'entrance': [entrance_x, fh],
                    'stories': stories,
                    'height': stories * 31 + 24,
                    'seed': base['seed'] + shape.get('seedOffset', 0) + variant * 97,
                    'label': f"{spec['label']} · {scale} {variant + 1}",
                    'description': spec['description'],
                    'goldScale': scale,
                    'goldVariant': variant,
                    'wealthTier': wealth[variant % len(wealth)],
                    'buildingFunction': functions[variant % len(functions)],
                    **({'serviceStyle': service_styles[variant % len(service_styles)]}
                       if service_styles else {}),
                    **({'detailSet': spec['detailSet']} if spec.get('detailSet') else {}),
                    **({marker: family} if marker else {}),
                }
    return out


def gold_master_recipes(source):
    filtered = {**source, 'goldMasters': {
        name: spec for name, spec in source['goldMasters'].items()
        if not spec.get('serviceKit')}}
    return scaled_family_recipes(filtered, 'goldMasters', 'gold', 'goldMaster')


def service_kit_recipes(source):
    filtered = {**source, 'goldMasters': {
        name: spec for name, spec in source['goldMasters'].items()
        if spec.get('serviceKit')}}
    return scaled_family_recipes(filtered, 'goldMasters', 'gold', 'serviceKit')


def prehistoric_expansion_recipes(source):
    return scaled_family_recipes(
        source, 'prehistoricExpansions', 'expanded', 'prehistoricExpansion')
