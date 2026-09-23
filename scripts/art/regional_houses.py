"""Compile large regional house families from structure and profile data."""
import json


def load_regional_houses(root):
    return json.loads((root / 'src/content/graphics/regional-houses.json').read_text())


def roof_surfaces(shape, stories):
    fw, fh = shape['footprint']
    level = stories
    plan = shape.get('roofPlan', 'ridge')
    if plan in ('courtyard', 'tiled-courtyard'):
        x, y, w, h = shape['courtyard']
        zones = [
            [0, 0, fw, y],
            [0, y + h, fw, fh - y - h],
            [0, y, x, h],
            [x + w, y, fw - x - w, h],
        ]
        return [
            {'rect': rect, 'level': level,
             'kind': 'roof-slope' if plan == 'tiled-courtyard' else 'terrace',
             'walkable': True}
            for rect in zones if rect[2] > 0 and rect[3] > 0
        ]
    if plan == 'terrace':
        return [{'rect': [0, 0, fw, fh], 'level': level,
                 'kind': 'terrace', 'walkable': True}]
    split = max(1, fh // 2)
    return [
        {'rect': [0, 0, fw, split], 'level': level, 'kind': 'roof-slope', 'walkable': True},
        {'rect': [0, split, fw, fh - split], 'level': level, 'kind': 'roof-slope', 'walkable': True},
    ]


def regional_house_recipes(root, source):
    data = load_regional_houses(root)
    out = {}
    for family, spec in data['families'].items():
        base = source['buildings'][spec['source']]
        for profile_name in spec['profiles']:
            profile = data['profiles'][profile_name]
            for scale, shape in spec['sizes'].items():
                for variant in range(shape.get('variants', 1)):
                    fw, fh = shape['footprint']
                    stories = shape.get('profileStories', {}).get(profile_name, shape['stories'])
                    name = f'{family}-{profile_name}-{scale}-{variant}'
                    attachments = shape.get('attachments', base.get('attachments', []))
                    roof_plan = shape.get('roofPlan', 'ridge')
                    offset = 0 if shape.get('symmetric') else (-1, 0, 1)[variant % 3]
                    entrance = shape.get('profileEntrance', {}).get(profile_name, shape.get('entrance', fw // 2))
                    entrance = max(0 if fw < 3 else 1, min(fw - 1 if fw < 3 else fw - 2, entrance + offset))
                    resolved = dict(shape)
                    if shape.get('courtyard'):
                        cx, cy, cw, ch = shape['courtyard']
                        resolved['courtyard'] = [max(1, min(fw - cw - 1, cx + offset)), cy, cw, ch]
                    treatments = profile.get('surfaceTreatments', ['plain'])
                    features = profile.get('roofFeatures', [])
                    turrets = profile.get('turretStyles', ['none'])
                    functions = shape.get('functions', [spec['function']])
                    wealth = shape.get('wealthTiers', [2] if scale == 'large' else [0, 1])
                    service_styles = shape.get('serviceStyles', [])
                    out[name] = {
                        **base,
                        **profile,
                        **{k: v for k, v in resolved.items()
                           if k not in ('variants', 'seedOffset', 'entrance', 'profileStories',
                                        'wealthTiers', 'serviceStyles', 'profileEntrance')},
                        'footprint': [fw, fh],
                        'entrance': [entrance, fh],
                        'stories': stories,
                        'height': stories * 31 + 24,
                        'seed': base['seed'] + shape.get('seedOffset', 0) + variant * 97,
                        'attachments': attachments,
                        'roofs': [profile['roofMaterial']],
                        **({'chimneys': 0} if profile.get('roofStyle') else {}),
                        'oblique': True,
                        'mud': False,
                        'roofForm': ('courtyard' if roof_plan in ('courtyard', 'tiled-courtyard')
                                     else 'flat' if roof_plan == 'terrace'
                                     else base.get('roofForm')),
                        'roof': ('flat' if roof_plan in ('courtyard', 'terrace')
                                 else 'hip' if roof_plan in ('tiled-courtyard', 'hip')
                                 else 'gable'),
                        'label': f"{spec['label']} · {profile['label']} · {scale}",
                        'description': spec['description'],
                        'regionalHouse': family,
                        'regionalProfile': profile_name,
                        'buildingFunction': functions[variant % len(functions)],
                        'wealthTier': wealth[variant % len(wealth)],
                        'detailSet': profile.get('detailSet', profile_name),
                        **({'serviceStyle': service_styles[variant % len(service_styles)]}
                           if service_styles else {}),
                        'goldScale': scale,
                        'goldVariant': variant,
                        'sideDepth': 12,
                        'surfaceTreatments': [treatments[variant % len(treatments)]],
                        'roofFeatures': ([features[variant % len(features)]] if features else []),
                        'turretStyles': [turrets[variant % len(turrets)]],
                        **({'sino': {**profile['sino'], 'palette': data['sinoPalette']}}
                           if shape.get('sinitic') else {}),
                        **({'steppe': {**profile['steppe'], 'palette': data['steppePalette']}}
                           if shape.get('steppe') else {}),
                        'roofSurfaces': roof_surfaces(resolved, stories),
                        'roofVoid': resolved.get('courtyard'),
                        'roofAccess': shape.get('roofAccess', 'none'),
                        **({'turretStyles': ['windcatcher']}
                           if profile_name == 'iranian' and scale == 'large' else {}),
                    }
    return out
