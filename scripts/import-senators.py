"""Build the offline roster from a local congress-legislators historical JSON download."""
import json
import re
import sys
from pathlib import Path

rows = []
for person in json.loads(Path(sys.argv[1]).read_text()):
    bio, name = person["bio"], person["name"]
    if not bio.get("birthday") or bio.get("gender") not in ("F", "M"):
        continue
    born = int(bio["birthday"][:4])
    display = person["id"].get("wikipedia") or name.get("official_full") or " ".join(
        name[k] for k in ("first", "middle", "last", "suffix") if name.get(k)
    )
    display = re.sub(r" \(.*\)$", "", display)
    spans = []
    for term in sorted(person["terms"], key=lambda t: t["start"]):
        if term["type"] != "sen":
            continue
        first = max(1859, int(term["start"][:4]), born + 18)
        last = min(int(term["end"][:4]), born + 90)
        if first > last:
            continue
        if spans and first <= spans[-1][1] + 1:
            spans[-1][1] = max(spans[-1][1], last)
        else:
            spans.append([first, last])
    for first, last in spans:
        rows.append([display, "female" if bio["gender"] == "F" else "male", born, first, last])

path = Path(__file__).resolve().parents[1] / "src/content/palaces/senators.generated.ts"
with path.open("w") as out:
    out.write("// CC0, unitedstates/congress-legislators. Rebuild with scripts/import-senators.py.\n")
    out.write('export const senateTerms: readonly [string, "male" | "female", number, number, number][] = [\n')
    for row in sorted(rows):
        out.write("  " + json.dumps(row, ensure_ascii=False) + ",\n")
    out.write("];\n")
