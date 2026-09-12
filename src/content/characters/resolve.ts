import { inventedNameNote } from "./invented-name";
import { random } from "../../core/random";
import { validateCharacterContent } from "./validate";
import type { WorldSetting } from "../geography/types";
import type {
  CharacterScope,
  CommunityProfile,
  AppearanceKit,
  NameKit,
  NameTradition,
  Livelihood,
  SocietyCapability,
} from "./context-types";
import { communityProfiles, appearanceKits } from "./profiles/communities";
import { populations } from "./profiles/populations";
import { subsistenceMixes } from "./profiles/subsistence";
import { nameKits } from "./name-kits";
import { nameTraditions } from "./profiles/traditions.generated";
import { nameRegions } from "./profiles/name-regions.generated";
import { livelihoods } from "./livelihoods";
import { commonLivelihoods } from "./livelihoods.generated";
import { workplaceFor, type Workplace } from "./workplace";
import type { CharacterPhysique } from "../../core/character";
import {
  capabilityOverrides,
  capabilityWindows,
} from "./capabilities.generated";

validateCharacterContent();

export type CharacterContext = {
  community: string;
  profile: CommunityProfile;
  appearance: AppearanceKit;
  names?: NameKit;
  /** Weighted traditions drawn on where no hand-written kit is scoped. */
  traditions?: {
    region: string;
    options: readonly { tradition: NameTradition; weight: number }[];
  };
  capabilities: ReadonlySet<SocietyCapability>;
  livelihoods: readonly Livelihood[];
  notes: string[];
};

/** The plural society covering this place and date, if one is authored. */
export function populationFor(s: WorldSetting) {
  return populations
    .filter((p) => matchesCharacterScope(p.scope, s, "*"))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))[0];
}
/**
 * Which community one person belongs to. Where a population is authored the
 * draw is per person, so a settlement holds the mix rather than one group.
 * An explicit scenario choice still decides the whole place.
 */
export function characterCommunity(
  s: WorldSetting,
  seed: string,
  id: string,
): string {
  if (s.characterCommunity) return s.characterCommunity;
  const population = populationFor(s);
  if (!population) return communityFor(s);
  const total = population.groups.reduce((n, g) => n + g.share, 0);
  let roll = random(seed, "character-v1", id, "community") * total;
  return (
    population.groups.find((g) => (roll -= g.share) < 0) ??
    population.groups[population.groups.length - 1]
  ).community;
}
/** Explicit choices win. Defaults describe the selected scenario, not all inhabitants. */
export function communityFor(s: WorldSetting): string {
  if (s.characterCommunity) return s.characterCommunity;
  const text = s.community.toLowerCase();
  if (/free black|african|enslaved/.test(text)) return "african-diaspora";
  if (/indigenous|aboriginal|powhatan|native american/.test(text))
    return "indigenous-local";
  if (/english|anglo|colonial/.test(text)) return "english-colonial";
  const virginia = s.lon >= -84 && s.lon <= -75 && s.lat >= 35 && s.lat <= 40;
  if (virginia && s.year >= 1607 && s.year < 1750 && s.culture === "european")
    return "english-colonial";
  if (virginia && s.year < 1607) return "indigenous-local";
  return "local";
}
export function matchesCharacterScope(
  scope: CharacterScope,
  s: WorldSetting,
  community = communityFor(s),
) {
  return (
    s.year >= scope.years[0] &&
    s.year < scope.years[1] &&
    (!scope.cultures || scope.cultures.includes(s.culture)) &&
    (!scope.places || scope.places.includes(s.placeId)) &&
    (!scope.communities || scope.communities.includes(community)) &&
    (!scope.bounds ||
      (s.lon >= scope.bounds[0] &&
        s.lat >= scope.bounds[1] &&
        s.lon <= scope.bounds[2] &&
        s.lat <= scope.bounds[3]))
  );
}
const fallbackAppearance: AppearanceKit = {
  id: "unresearched",
  label: "Unresearched visual reconstruction",
  skin: ["#70472f", "#8c5d40", "#b78464", "#e4b994"],
  hairColors: ["#292823", "#493627"],
  hairStyles: ["cropped", "long", "curls"],
  garments: ["wrap"],
  sources: [],
};
const fallbackProfile: CommunityProfile = {
  id: "unresearched",
  label: "Unresearched community",
  priority: -1,
  scope: { years: [-1000000, 10001] },
  appearance: "unresearched",
  livelihoods: ["gatherer", "craftsperson", "traveler"],
  allowedItems: ["water", "fruit", "wood", "tool"],
  sources: [],
  note: "No researched community covers this place and date yet.",
};
/** What this society could do here, this year. Overrides beat the zone date. */
export function capabilitiesFor(s: WorldSetting): Set<SocietyCapability> {
  const boxes = capabilityOverrides
    .filter(
      (o) =>
        s.lon >= o.bounds[0] &&
        s.lon <= o.bounds[2] &&
        s.lat >= o.bounds[1] &&
        s.lat <= o.bounds[3] &&
        (!o.cultures || o.cultures.includes(s.culture)),
    )
    .sort(
      (a, b) =>
        (a.bounds[2] - a.bounds[0]) * (a.bounds[3] - a.bounds[1]) -
        (b.bounds[2] - b.bounds[0]) * (b.bounds[3] - b.bounds[1]),
    );
  const available = new Set<SocietyCapability>();
  for (const w of capabilityWindows) {
    if (w.culture !== s.culture) continue;
    const override = boxes.find(
      (o) => o.capabilities[w.capability] !== undefined,
    );
    const from = override?.capabilities[w.capability] ?? w.from;
    if (s.year >= from && s.year < w.to) available.add(w.capability);
  }
  return available;
}
const traditionsById = new Map(nameTraditions.map((t) => [t.id, t]));
/**
 * The smallest box containing the point wins; a tie falls to the earlier id.
 * regionAt sorts the same array for the map label, so the two must agree.
 */
export const regionsByArea = [...nameRegions].sort(
  (a, b) =>
    (a.bounds[2] - a.bounds[0]) * (a.bounds[3] - a.bounds[1]) -
      (b.bounds[2] - b.bounds[0]) * (b.bounds[3] - b.bounds[1]) ||
    a.id.localeCompare(b.id),
);
export function nameTraditionsFor(s: WorldSetting) {
  for (const region of regionsByArea) {
    const [w, so, e, n] = region.bounds;
    if (s.lon < w || s.lon > e || s.lat < so || s.lat > n) continue;
    // Region windows run wider than the traditions they offer, so a window is
    // not a date: drop options whose own attested era excludes this year, and
    // keep looking outward if that empties the window.
    for (const window of region.windows) {
      if (!(s.year >= window.years[0] && s.year < window.years[1])) continue;
      const options = window.options.flatMap((o) => {
        const tradition = traditionsById.get(o.tradition);
        if (!tradition) return [];
        const [from, to] = tradition.era;
        return s.year >= from && s.year < to ? [{ tradition, weight: o.weight }] : [];
      });
      if (options.length) return { region: region.id, options };
    }
  }
  return undefined;
}
/**
 * Which kind of settlement this work belongs to. This used to carry the dates
 * as well, which is why every year from 3000 BCE to 1600 CE produced the same
 * catalogue: only the industrial and modern tiers consulted the calendar at
 * all. Dates now live on the livelihood as `years`.
 */
function tierApplies(
  tier: NonNullable<Livelihood["tier"]>,
  s: WorldSetting,
  capabilities: ReadonlySet<SocietyCapability>,
) {
  const farming = capabilities.has("settled_agriculture");
  const urban =
    capabilities.has("urban_settlement") &&
    (s.settlement === "city" || s.settlement === "port");
  if (tier === "prehistoric") return !farming || s.settlement === "camp";
  if (tier === "village") return farming && s.settlement !== "camp";
  if (tier === "town") return urban;
  if (tier === "industrial") return urban && capabilities.has("wage_labor");
  return capabilities.has("wage_labor");
}
const dedupe = (pool: readonly Livelihood[]) => [
  ...new Map(pool.map((l) => [l.id, l])).values(),
].map((l) => pool.find((x) => x.id === l.id)!);
/** How this place divides its work between the ways of getting food. */
const DEFAULT_SHARES = {
  farming: 0.35,
  herding: 0.1,
  fishing: 0.1,
  foraging: 0.12,
  other: 0.33,
};
export function subsistenceFor(s: WorldSetting) {
  return subsistenceMixes
    .filter((m) => matchesCharacterScope(m.scope, s, "*"))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))[0];
}
const SHARE_OF: Partial<Record<Workplace, keyof typeof DEFAULT_SHARES>> = {
  field: "farming",
  pasture: "herding",
  water: "fishing",
  wild: "foraging",
};
/**
 * Scale each livelihood's weight by its place's subsistence base, so a steppe
 * settlement comes out mostly herders and a rice district mostly cultivators
 * instead of both drawing the same village list in the same proportions.
 * Weights within a class keep their relative sizes.
 */
function weighted(pool: readonly Livelihood[], s: WorldSetting) {
  const shares = subsistenceFor(s)?.shares ?? DEFAULT_SHARES;
  const classOf = (l: Livelihood) =>
    SHARE_OF[l.workplace ?? workplaceFor(l.activity)] ?? "other";
  const mass = new Map<string, number>();
  for (const l of pool)
    mass.set(classOf(l), (mass.get(classOf(l)) ?? 0) + (l.weight ?? 1));
  return pool.map((l) => {
    const c = classOf(l);
    const total = mass.get(c) || 1;
    // Share of the settlement for this class, split by weight within it.
    return { ...l, weight: (shares[c] * (l.weight ?? 1) * 100) / total };
  });
}
/** Everything about a livelihood that depends on where and when it is. */
function inScope(l: Livelihood, s: WorldSetting) {
  if (l.years && !(s.year >= l.years[0] && s.year < l.years[1])) return false;
  if (l.cultures && !l.cultures.includes(s.culture)) return false;
  if (
    l.bounds &&
    (s.lon < l.bounds[0] ||
      s.lon > l.bounds[2] ||
      s.lat < l.bounds[1] ||
      s.lat > l.bounds[3])
  )
    return false;
  // Work tied to a particular country is specialised, so no ecology recorded
  // means "not here" rather than "anywhere": otherwise a setting without the
  // data drew camel herders in Italy and reindeer herders on the steppe.
  const ecology = s.environment?.ecology;
  if (l.ecologies && (!ecology || !l.ecologies.includes(ecology))) return false;
  return true;
}
/**
 * The work in this context that happens at a given kind of place. The
 * settlement planner used to guess at ids -- it asked for "farmer" and matched
 * `role === "Farmer"` -- so a renamed trade silently left a field with nobody
 * to work it. Asking by workplace lets the planner find out there is nobody,
 * and not lay the field.
 */
export function workAt(
  context: CharacterContext,
  workplace: Workplace,
  sex: CharacterPhysique["sex"] = "unspecified",
) {
  return context.livelihoods.filter(
    (l) =>
      (l.workplace ?? workplaceFor(l.activity)) === workplace &&
      (sex === "unspecified" || !l.sex || l.sex === sex),
  );
}
export function resolveCharacterContext(
  s: WorldSetting,
  community = communityFor(s),
): CharacterContext {
  const candidates = communityProfiles
    .filter((p) => matchesCharacterScope(p.scope, s, community))
    .sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  if (
    candidates.length > 1 &&
    candidates[0].priority === candidates[1].priority
  )
    throw Error(
      `Ambiguous character profiles: ${candidates[0].id}, ${candidates[1].id}`,
    );
  const profile = candidates[0] ?? fallbackProfile;
  const appearance =
    appearanceKits.find((p) => p.id === profile.appearance) ??
    fallbackAppearance;
  const scopedNames = nameKits.filter((p) =>
    matchesCharacterScope(p.scope, s, community),
  );
  // Narrower local / community kits supersede broad regional kits. Equal rank fails visibly.
  const rank = (p: NameKit) =>
    (p.scope.communities ? 4 : 0) +
    (p.scope.places ? 2 : 0) +
    (p.scope.bounds ? 1 : 0);
  scopedNames.sort((a, b) => rank(b) - rank(a) || a.id.localeCompare(b.id));
  if (scopedNames.length > 1 && rank(scopedNames[0]) === rank(scopedNames[1]))
    throw Error(
      `Ambiguous name kits: ${scopedNames[0].id}, ${scopedNames[1].id}`,
    );
  const names = scopedNames[0];
  // A hand-written kit is the most specific answer; a community's own
  // traditions beat the region's; the region table is the fallback.
  const profileTraditions = profile.nameTraditions?.flatMap((o) => {
    const tradition = traditionsById.get(o.tradition);
    if (!tradition) return [];
    const [from, to] = tradition.era;
    return s.year >= from && s.year < to
      ? [{ tradition, weight: o.weight }]
      : [];
  });
  const traditions = names
    ? undefined
    : profileTraditions?.length
      ? { region: profile.id, options: profileTraditions }
      : nameTraditionsFor(s);
  const capabilities = capabilitiesFor(s);
  const needsMet = (needs: Livelihood["needs"]) =>
    (needs ?? []).every((need) =>
      need === "water"
        ? s.water !== "none"
        : need === "settled"
          ? s.settlement !== "camp"
          : s.settlement !== "camp" && profile.allowedItems.includes("grain"),
    );
  // The ported table carries no needs, so a common trade borrows the authored
  // entry of the same id: a fisher still wants water.
  const authoredNeeds = new Map(livelihoods.map((l) => [l.id, l.needs]));
  const eligible = livelihoods.filter(
    (l) => profile.livelihoods.includes(l.id) && needsMet(l.needs),
  );
  const supported = (l: Livelihood) =>
    !l.capabilities?.some((c) => !capabilities.has(c)) &&
    (!l.anyCapability?.length ||
      l.anyCapability.some((c) => capabilities.has(c))) &&
    !l.withoutCapability?.some((c) => capabilities.has(c));
  // Revision 2 adds the ordinary work on top of the eight playable kits, and
  // holds both to the same capability gate.
  const revised = s.characterRevision === 2;
  const playable = revised
    ? eligible.filter((l) => supported(l) && inScope(l, s))
    : eligible;
  const tiered = revised
    ? commonLivelihoods.filter(
        (l) =>
          tierApplies(l.tier!, s, capabilities) &&
          supported(l) &&
          inScope(l, s) &&
          needsMet(l.needs ?? authoredNeeds.get(l.id)),
      )
    : [];
  return {
    community,
    profile,
    appearance,
    names,
    traditions,
    capabilities,
    // `farmer`, `hunter` and `fisher` exist in both tables, so an undeduped
    // pool drew them at double weight while the display looked up the other
    // object. The hand-written kit wins: it carries the `needs` gate.
    livelihoods: weighted(
      dedupe([
        ...(playable.length
          ? playable
          : livelihoods.filter((l) => l.id === "traveler")),
        ...tiered,
      ]),
      s,
    ),
    notes: [
      profile.note,
      appearance.note,
      ...(names ? [names.note] : traditions ? [] : [inventedNameNote]),
    ].filter((n): n is string => !!n),
  };
}
