import { inventedNameNote } from "./invented-name";
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
import { nameKits } from "./name-kits";
import { nameTraditions } from "./profiles/traditions.generated";
import { nameRegions } from "./profiles/name-regions.generated";
import { livelihoods } from "./livelihoods";
import { commonLivelihoods } from "./livelihoods.generated";
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
  evidence: {
    status: "fictional",
    claim: "Varied schematic appearance where no scoped profile exists.",
    sources: [],
    limitation: "Not a reconstruction of a particular population or its dress.",
  },
};
const fallbackProfile: CommunityProfile = {
  id: "unresearched",
  label: "Unresearched community",
  priority: -1,
  scope: { years: [-1000000, 10001] },
  appearance: "unresearched",
  livelihoods: ["gatherer", "craftsperson", "traveler"],
  allowedItems: ["water", "fruit", "wood", "tool"],
  evidence: {
    status: "fictional",
    claim: "Minimal playable scenario without unrelated cultural defaults.",
    sources: [],
    limitation:
      "Activities and generic items are explicit gap-fillers; local names, materials and institutions need research.",
  },
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
const boxArea = (b: readonly number[]) => (b[2] - b[0]) * (b[3] - b[1]);
/** The smallest box containing the point wins; a tie falls to the earlier id. */
export function nameTraditionsFor(s: WorldSetting) {
  for (const region of [...nameRegions].sort(
    (a, b) => boxArea(a.bounds) - boxArea(b.bounds) || a.id.localeCompare(b.id),
  )) {
    const [w, so, e, n] = region.bounds;
    if (s.lon < w || s.lon > e || s.lat < so || s.lat > n) continue;
    const window = region.windows.find(
      (v) => s.year >= v.years[0] && s.year < v.years[1],
    );
    if (!window) continue;
    const options = window.options.flatMap((o) => {
      const tradition = traditionsById.get(o.tradition);
      return tradition ? [{ tradition, weight: o.weight }] : [];
    });
    if (options.length) return { region: region.id, options };
  }
  return undefined;
}
/** Which stratum of ordinary work a place is in. Tiers overlap deliberately. */
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
  if (tier === "industrial")
    return urban && capabilities.has("wage_labor") && s.year >= 1780;
  return s.year >= 1900 && capabilities.has("wage_labor");
}
export function resolveCharacterContext(s: WorldSetting): CharacterContext {
  const community = communityFor(s);
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
  const traditions = names ? undefined : nameTraditionsFor(s);
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
  const playable = revised ? eligible.filter(supported) : eligible;
  const tiered = revised
    ? commonLivelihoods.filter(
        (l) =>
          tierApplies(l.tier!, s, capabilities) &&
          supported(l) &&
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
    livelihoods: [
      ...(playable.length
        ? playable
        : livelihoods.filter((l) => l.id === "traveler")),
      ...tiered,
    ],
    notes: [
      profile.evidence.limitation,
      appearance.evidence.limitation,
      ...(names
        ? [names.evidence.limitation]
        : traditions
          ? []
          : [inventedNameNote]),
    ],
  };
}
