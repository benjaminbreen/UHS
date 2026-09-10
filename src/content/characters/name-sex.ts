import { nameTraditions } from "./profiles/traditions.generated";

let index: Map<string, "male" | "female" | "both"> | undefined;
function build() {
  const m = new Map<string, "male" | "female" | "both">();
  const add = (names: readonly string[], sex: "male" | "female") => {
    for (const n of names) {
      const k = n.toLowerCase();
      const prev = m.get(k);
      m.set(k, prev && prev !== sex ? "both" : sex);
    }
  };
  for (const t of nameTraditions) {
    add(t.masculine, "male");
    add(t.feminine, "female");
  }
  return m;
}
/** Display heuristic for characters whose kit left sex unspecified. */
export function sexFromName(name: string): "male" | "female" | undefined {
  index ??= build();
  const first = name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  // "Jean-Baptiste" resolves through "Jean" when the compound itself is unlisted.
  const hit = index.get(first) ?? index.get(first.split("-")[0]);
  return hit === "both" ? undefined : hit;
}
