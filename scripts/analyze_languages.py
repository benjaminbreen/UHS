#!/usr/bin/env python3
import re
import json

# Read the file
with open('/Users/benjaminbreen/code/august-6-uhs/constants/gameData/languages.ts', 'r') as f:
    content = f.read()

# Find the LANGUAGES export
match = re.search(r'export const LANGUAGES: Record<string, LanguageData> = \{(.*)\};', content, re.DOTALL)
if not match:
    print("ERROR: Could not find LANGUAGES export")
    exit(1)

languages_content = match.group(1)

# Split by language entries (lines that start with uppercase identifier followed by colon and brace)
entries = re.split(r'\n\s*([A-Z_][A-Z_0-9]*?):\s*\{', languages_content)

languages = []
valid_ids = set()

# Process entries (they come in pairs: key, body)
for i in range(1, len(entries), 2):
    if i + 1 >= len(entries):
        break

    key = entries[i].strip()
    body = entries[i + 1]

    # Extract id
    id_match = re.search(r"id:\s*'([^']+)'", body)
    if not id_match:
        continue
    lang_id = id_match.group(1)

    # Extract name
    name_match = re.search(r"name:\s*'([^']+)'", body)
    if not name_match:
        continue
    name = name_match.group(1)

    # Extract family
    family_match = re.search(r"family:\s*(?:LANGUAGE_FAMILIES\.(\w+)|'([^']+)')", body)
    if not family_match:
        continue
    family = family_match.group(1) or family_match.group(2)

    # Extract period
    period_match = re.search(r"period:\s*\[(-?\d+),\s*(-?\d+)\]", body)
    if not period_match:
        continue
    start_year = int(period_match.group(1))
    end_year = int(period_match.group(2))

    # Extract predecessors
    pred_match = re.search(r"predecessors:\s*\[([^\]]*)\]", body)
    predecessors = []
    if pred_match:
        pred_str = pred_match.group(1)
        predecessors = [p.strip().strip("'\"") for p in pred_str.split(',') if p.strip()]

    # Extract successors
    succ_match = re.search(r"successors:\s*\[([^\]]*)\]", body)
    successors = []
    if succ_match:
        succ_str = succ_match.group(1)
        successors = [s.strip().strip("'\"") for s in succ_str.split(',') if s.strip()]

    # Find line number
    search_str = f"{key}: {{"
    line_num = content[:content.find(search_str)].count('\n') + 1 if search_str in content else 0

    lang = {
        'key': key,
        'id': lang_id,
        'name': name,
        'family': family,
        'startYear': start_year,
        'endYear': end_year,
        'predecessors': predecessors,
        'successors': successors,
        'lineNumber': line_num
    }

    languages.append(lang)
    valid_ids.add(lang_id)

print(f"\n=== ANALYSIS OF {len(languages)} LANGUAGES ===\n")

# Track issues
issues = {
    'missingPredecessors': [],
    'missingSuccessors': [],
    'majorLanguagesWithoutPredecessors': [],
    'referencedButNotDefined': set()
}

# Check each language
for lang in languages:
    # Check predecessors
    for pred_id in lang['predecessors']:
        if pred_id not in valid_ids:
            issues['missingPredecessors'].append({
                'language': lang['name'],
                'id': lang['id'],
                'key': lang['key'],
                'missingPredecessor': pred_id,
                'lineNumber': lang['lineNumber']
            })
            issues['referencedButNotDefined'].add(pred_id)

    # Check successors
    for succ_id in lang['successors']:
        if succ_id not in valid_ids:
            issues['missingSuccessors'].append({
                'language': lang['name'],
                'id': lang['id'],
                'key': lang['key'],
                'missingSuccessor': succ_id,
                'lineNumber': lang['lineNumber']
            })
            issues['referencedButNotDefined'].add(succ_id)

    # Check for major attested languages without predecessors
    is_proto = 'Proto-' in lang['name'] or 'Proto ' in lang['name'] or lang['key'].startswith('PROTO_')
    is_ancient = -5000 < lang['startYear'] < 500
    has_preds = len(lang['predecessors']) > 0

    if not is_proto and is_ancient and not has_preds:
        significant_families = ['INDO_EUROPEAN', 'SINO_TIBETAN', 'AFRO_ASIATIC', 'NIGER_CONGO',
                               'AUSTRONESIAN', 'JAPONIC', 'KOREANIC', 'DRAVIDIAN', 'TURKIC', 'MONGOLIC']
        if lang['family'] in significant_families:
            issues['majorLanguagesWithoutPredecessors'].append({
                'language': lang['name'],
                'id': lang['id'],
                'key': lang['key'],
                'family': lang['family'],
                'startYear': lang['startYear'],
                'lineNumber': lang['lineNumber']
            })

# Report findings
print("### 1. LANGUAGES REFERENCING NON-EXISTENT PREDECESSORS ###\n")
if not issues['missingPredecessors']:
    print("✓ No broken predecessor references found.\n")
else:
    for issue in sorted(issues['missingPredecessors'], key=lambda x: x['lineNumber']):
        print(f"Line {issue['lineNumber']}: {issue['language']} ({issue['key']})")
        print(f"  → References missing predecessor: \"{issue['missingPredecessor']}\"\n")

print("### 2. LANGUAGES REFERENCING NON-EXISTENT SUCCESSORS ###\n")
if not issues['missingSuccessors']:
    print("✓ No broken successor references found.\n")
else:
    for issue in sorted(issues['missingSuccessors'], key=lambda x: x['lineNumber']):
        print(f"Line {issue['lineNumber']}: {issue['language']} ({issue['key']})")
        print(f"  → References missing successor: \"{issue['missingSuccessor']}\"\n")

print("### 3. PROTO-LANGUAGES REFERENCED BUT NOT DEFINED ###\n")
if not issues['referencedButNotDefined']:
    print("✓ All referenced proto-languages are defined.\n")
else:
    proto_langs = sorted([id for id in issues['referencedButNotDefined'] if 'PROTO' in id or 'proto' in id])
    other_langs = sorted([id for id in issues['referencedButNotDefined'] if 'PROTO' not in id and 'proto' not in id])

    if proto_langs:
        print("Proto-languages:")
        for lang_id in proto_langs:
            print(f"  • {lang_id}")
        print()

    if other_langs:
        print("Other missing languages:")
        for lang_id in other_langs:
            print(f"  • {lang_id}")
        print()

print("### 4. MAJOR ANCIENT/CLASSICAL LANGUAGES WITHOUT PREDECESSORS ###\n")
print("(These should likely link to proto-language ancestors)\n")
if not issues['majorLanguagesWithoutPredecessors']:
    print("✓ All major ancient languages have predecessor links.\n")
else:
    # Group by family
    by_family = {}
    for lang in issues['majorLanguagesWithoutPredecessors']:
        family = lang['family']
        if family not in by_family:
            by_family[family] = []
        by_family[family].append(lang)

    for family in sorted(by_family.keys()):
        print(f"\n{family}:")
        for lang in sorted(by_family[family], key=lambda x: x.get('startYear', 0)):
            line_num = lang.get('lineNumber', '?')
            name = lang.get('language', lang.get('name', '?'))
            key = lang.get('key', '?')
            start = lang.get('startYear', '?')
            print(f"  Line {line_num}: {name} ({key}) - starts {start}")
    print()

print("\n### 5. SUMMARY STATISTICS ###\n")
print(f"Total languages analyzed: {len(languages)}")
print(f"Broken predecessor references: {len(issues['missingPredecessors'])}")
print(f"Broken successor references: {len(issues['missingSuccessors'])}")
print(f"Undefined referenced languages: {len(issues['referencedButNotDefined'])}")
print(f"Major languages without predecessors: {len(issues['majorLanguagesWithoutPredecessors'])}")

# Additional analysis
print("\n### 6. ADDITIONAL ANALYSIS ###\n")

# Proto-languages with no successors
proto_without_successors = [
    l for l in languages
    if ('Proto-' in l['name'] or l['key'].startswith('PROTO_')) and not l['successors']
]

if proto_without_successors:
    print("Proto-languages with no successors (orphaned):")
    for lang in proto_without_successors:
        print(f"  Line {lang['lineNumber']}: {lang['name']} ({lang['key']})")
    print()

# Save detailed output
output = {
    'totalLanguages': len(languages),
    'issues': {
        'missingPredecessors': issues['missingPredecessors'],
        'missingSuccessors': issues['missingSuccessors'],
        'majorLanguagesWithoutPredecessors': issues['majorLanguagesWithoutPredecessors'],
        'referencedButNotDefined': list(issues['referencedButNotDefined'])
    },
    'allLanguages': sorted(languages, key=lambda x: x['name']),
    'protoWithoutSuccessors': proto_without_successors
}

with open('/Users/benjaminbreen/code/august-6-uhs/language_analysis.json', 'w') as f:
    json.dump(output, f, indent=2)

print("✓ Detailed analysis saved to language_analysis.json\n")
