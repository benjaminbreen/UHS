import { inventedNameNote } from "./invented-name";
import { validateCharacterContent } from "./validate";
import type { WorldSetting } from "../geography/types";
import type {
  CharacterScope,
  CommunityProfile,
  AppearanceKit,
  NameKit,
} from "./context-types";
import { communityProfiles, appearanceKits } from "./profiles/communities";
import { nameKits } from "./name-kits";
import { livelihoods } from "./livelihoods";

validateCharacterContent();

export type CharacterContext = {
  community: string;
  profile: CommunityProfile;
  appearance: AppearanceKit;
  names?: NameKit;
  livelihoods: typeof livelihoods;
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
  const eligible = livelihoods.filter(
    (l) =>
      profile.livelihoods.includes(l.id) &&
      (l.needs ?? []).every((need) =>
        need === "water"
          ? s.water !== "none"
          : need === "settled"
            ? s.settlement !== "camp"
            : s.settlement !== "camp" && profile.allowedItems.includes("grain"),
      ),
  );
  return {
    community,
    profile,
    appearance,
    names,
    livelihoods: eligible.length
      ? eligible
      : livelihoods.filter((l) => l.id === "traveler"),
    notes: [
      profile.evidence.limitation,
      appearance.evidence.limitation,
      ...(names ? [names.evidence.limitation] : [inventedNameNote]),
    ],
  };
}
