import { nameKits } from "./name-kits";
import { appearanceKits, communityProfiles } from "./profiles/communities";
import { livelihoods } from "./livelihoods";
import type { CharacterScope, QualifiedContent } from "./context-types";

/** Authoring boundary checks, run once when the resolver is loaded. */
export function validateCharacterContent() {
  const unique = (values: readonly { id: string }[]) => {
    if (new Set(values.map((v) => v.id)).size !== values.length)
      throw Error("Duplicate character content ID");
  };
  const evidence = (v: QualifiedContent) => {
    if (
      !v.label ||
      !v.evidence.claim ||
      !v.evidence.limitation ||
      (v.evidence.status !== "fictional" && !v.evidence.sources.length) ||
      v.evidence.sources.some((url) => !/^https:\/\//.test(url))
    )
      throw Error(`Invalid character evidence: ${v.id}`);
  };
  const scope = (s: CharacterScope) => {
    if (!(s.years[0] < s.years[1]) || s.years.some((y) => !Number.isInteger(y)))
      throw Error("Invalid character date range");
    if (s.bounds && (s.bounds[0] > s.bounds[2] || s.bounds[1] > s.bounds[3]))
      throw Error("Invalid character bounds");
  };
  for (const entries of [nameKits, appearanceKits, communityProfiles]) {
    unique(entries);
    entries.forEach(evidence);
  }
  unique(livelihoods);
  for (const kit of nameKits) {
    scope(kit.scope);
    if (kit.format && kit.format !== "personal" && !kit.familyNames?.length)
      if (kit.format !== "personal-patronymic" || !kit.patronymics?.length)
        throw Error(`Missing family names: ${kit.id}`);
    if (
      kit.format === "personal-patronymic" &&
      (!kit.patronymics?.length || kit.patronymics.some((n) => !n.trim()))
    )
      throw Error(`Missing patronymics: ${kit.id}`);
    if (!kit.names.length || kit.names.some((n) => !n.trim()))
      throw Error("Empty name kit");
  }
  for (const kit of appearanceKits) {
    if (
      !kit.skin.length ||
      !kit.hairColors.length ||
      !kit.hairStyles.length ||
      !kit.garments.length ||
      [...kit.skin, ...kit.hairColors].some((c) => !/^#[0-9a-f]{6}$/i.test(c))
    )
      throw Error(`Invalid appearance kit: ${kit.id}`);
  }
  for (const p of communityProfiles) {
    scope(p.scope);
    if (
      !appearanceKits.some((a) => a.id === p.appearance) ||
      !p.livelihoods.length ||
      p.livelihoods.some((id) => !livelihoods.some((l) => l.id === id))
    )
      throw Error(`Unknown character content reference: ${p.id}`);
  }
}
