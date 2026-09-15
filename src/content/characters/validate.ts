import { nameKits } from "./name-kits";
import { barredNameEntries } from "./name-entries";
import { appearanceKits, communityProfiles } from "./profiles/communities";
import { populations } from "./profiles/populations";
import { livelihoods } from "./livelihoods";
import { nameRegions } from "./profiles/name-regions.generated";
import { nameTraditions } from "./profiles/traditions.generated";
import type { CharacterScope, QualifiedContent } from "./context-types";

/** Authoring boundary checks, run once when the resolver is loaded. */
export function validateCharacterContent() {
  const unique = (values: readonly { id: string }[]) => {
    if (new Set(values.map((v) => v.id)).size !== values.length)
      throw Error("Duplicate character content ID");
  };
  /* A citation is further reading, not paperwork: check that the URLs are
   * real links, not that every entry has been graded for confidence. */
  const qualified = (v: QualifiedContent) => {
    if (!v.label || v.sources.some((url) => !/^https:\/\//.test(url)))
      throw Error(`Invalid character content: ${v.id}`);
  };
  const scope = (s: CharacterScope) => {
    if (!(s.years[0] < s.years[1]) || s.years.some((y) => !Number.isInteger(y)))
      throw Error("Invalid character date range");
    if (s.bounds && (s.bounds[0] > s.bounds[2] || s.bounds[1] > s.bounds[3]))
      throw Error("Invalid character bounds");
  };
  for (const entries of [nameKits, appearanceKits, communityProfiles]) {
    unique(entries);
    entries.forEach(qualified);
  }
  unique(livelihoods);
  unique(nameTraditions);
  unique(nameRegions);
  for (const kit of nameKits) {
    const barred = barredNameEntries([
      ...kit.names,
      ...(kit.familyNames ?? []),
      ...(kit.secondFamilyNames ?? []),
    ]);
    if (barred.length)
      throw Error(`Not personal names in ${kit.id} — ${barred.join("; ")}`);
  }
  for (const t of nameTraditions) {
    if (!(t.era[0] < t.era[1]))
      throw Error(`Invalid tradition era: ${t.id}`);
    if (!t.masculine.length && !t.feminine.length)
      throw Error(`Empty name tradition: ${t.id}`);
    if (t.format === "personal-patronymic" && !t.patronymic)
      throw Error(`Missing patronymic suffixes: ${t.id}`);
    if (
      t.format !== "personal" &&
      t.format !== "personal-patronymic" &&
      !t.familyNames.length
    )
      throw Error(`Missing family names: ${t.id}`);
  }
  const traditionIds = new Set(nameTraditions.map((t) => t.id));
  for (const region of nameRegions) {
    const [w, s0, e, n] = region.bounds;
    if (!(w < e) || !(s0 < n))
      throw Error(`Invalid region bounds: ${region.id}`);
    // Two windows starting at the same year make the later one unreachable:
    // the resolver walks them in order and the first match wins.
    const starts = new Set<number>();
    for (const v of region.windows) {
      if (!(v.years[0] < v.years[1]))
        throw Error(`Invalid region window: ${region.id}`);
      if (starts.has(v.years[0]))
        throw Error(`Shadowed window in ${region.id} at ${v.years[0]}`);
      starts.add(v.years[0]);
      for (const o of v.options)
        if (!traditionIds.has(o.tradition))
          throw Error(`Unknown tradition ${o.tradition} in ${region.id}`);
    }
  }
  for (const kit of nameKits) {
    scope(kit.scope);
    if (kit.format && kit.format !== "personal" && !kit.familyNames?.length)
      if (
        kit.format !== "personal-patronymic" ||
        !(kit.patronymics?.length || kit.patronymic?.parents.length)
      )
        throw Error(`Missing family names: ${kit.id}`);
    if (
      kit.format === "personal-patronymic" &&
      !kit.patronymic?.parents.length &&
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
  /* A livelihood's characteristic item is stripped if no profile allows it,
   * which left every knapper, mason and drover carrying only water. */
  const allowedItems = new Set(
    communityProfiles.flatMap((p) => p.allowedItems as string[]),
  );
  for (const l of livelihoods)
    for (const item of Object.keys(l.inventory))
      if (!allowedItems.has(item))
        throw Error(`No profile allows ${item}, so ${l.id} loses it`);

  // The forward check below catches a profile naming work that does not exist.
  // This is the reverse: hand-written work no profile offers is unreachable,
  // which is how "herder" sat in the table while no settlement could staff a pen.
  const offered = new Set(communityProfiles.flatMap((p) => p.livelihoods));
  for (const l of livelihoods)
    if (!l.tier && !offered.has(l.id))
      throw Error(`Unreachable livelihood: ${l.id}`);
  unique(populations);
  for (const p of populations) {
    scope(p.scope);
    if (!p.groups.length || p.groups.some((g) => g.share <= 0))
      throw Error(`Invalid population shares: ${p.id}`);
    // A group must name a community some profile actually answers to, or the
    // draw silently falls back to the regional default for that share.
    for (const g of p.groups)
      if (!communityProfiles.some((c) => c.scope.communities?.includes(g.community)))
        throw Error(`Unknown community ${g.community} in ${p.id}`);
    if (p.sources.some((url) => !/^https:\/\//.test(url)))
      throw Error(`Invalid population source: ${p.id}`);
  }
  for (const p of communityProfiles) {
    scope(p.scope);
    // A scoped profile outranks every regional fallback, so one with nothing
    // but a date range repaints the whole world: a Congo Basin entry that lost
    // its bounds put its palette on medieval Paris. Only the priority-1
    // regional fallbacks are allowed to be worldwide, and those are pinned to
    // a culture family.
    if (
      p.priority > 1 &&
      !p.scope.bounds &&
      !p.scope.places &&
      !p.scope.cultures
    )
      throw Error(`Unbounded community profile: ${p.id}`);
    if (
      !appearanceKits.some((a) => a.id === p.appearance) ||
      !p.livelihoods.length ||
      p.livelihoods.some((id) => !livelihoods.some((l) => l.id === id)) ||
      p.nameTraditions?.some((o) => !traditionIds.has(o.tradition))
    )
      throw Error(`Unknown character content reference: ${p.id}`);
  }
}
