import { knownSpan } from "../../history/dates";
import type { Place, Point } from "../../../core/types";
import { random } from "../../../core/random";
import { beliefOptions } from "../../beliefs";
import { populationFor } from "../../characters/resolve";
import type { WorldSetting } from "../../geography/types";
import { placeById } from "../../geography/places";
import type { ReligiousProfile, ReligiousRule } from "./types";
import { europeReligious } from "./europe";
import { americasReligious } from "./americas";
import { nearEastReligious } from "./near-east";
import { eastAsiaReligious } from "./east-asia";
import { orthodoxReligious } from "./orthodox";
import { africaReligious } from "./africa";
import { southAsiaReligious } from "./south-asia";
import { southeastAsiaReligious } from "./southeast-asia";
import { minorityReligious } from "./minorities";
import { pacificReligious } from "./pacific";

/** Narrower date ranges win, so a specific period is not shadowed by a
 * broad one. No rule means no religious building: the setting's tradition
 * has not been researched for this engine, not that it had none. */
const rules: ReligiousRule[] = [
  ...europeReligious, ...americasReligious, ...nearEastReligious, ...eastAsiaReligious, ...orthodoxReligious,
  ...africaReligious, ...southAsiaReligious, ...southeastAsiaReligious, ...minorityReligious, ...pacificReligious,
].sort(
  (a, b) => knownSpan(a.from, a.to) - knownSpan(b.from, b.to) || a.id.localeCompare(b.id),
);

function matchesSite(s: WorldSetting) {
  // A named town can sit across a parish boundary from the centre of its travel tile.
  const town = s.playableMap && !s.placeId.startsWith("area-") && placeById.get(s.placeId);
  const {lon, lat} = town && Math.hypot(town.lon - s.lon, town.lat - s.lat) < .15 ? town : s;
  return (p: ReligiousRule) => {
    const [w, south, e, n] = p.bounds;
    return (
      (p.culture === undefined || [p.culture].flat().includes(s.culture)) &&
      s.year >= p.from &&
      s.year < p.to &&
      lon >= w && lon <= e && lat >= south && lat <= n
    );
  };
}

export function religiousProfile(s: WorldSetting): ReligiousProfile | undefined {
  const here = matchesSite(s);
  return rules.find(p => !p.congregationOnly && here(p));
}

function worshipSchools(site: ReligiousProfile, year: number) {
  return site.schools?.filter(b => year >= b.from && year < b.to) ?? [];
}

export function sanctuarySchool(site: ReligiousProfile, year: number, seed: string, placeId: string) {
  const schools = worshipSchools(site, year);
  return schools[Math.floor(random(seed, placeId, "school") * schools.length)];
}

export function neighborhoodCongregations(s: WorldSetting, primary: ReligiousProfile, primarySchool: string | undefined,
  radius: number, seed: string, siteId: string) {
  if ((s.settlement !== "city" && s.settlement !== "port") || radius < 35) return [];
  const groups = populationFor(s)?.groups ?? [{community: undefined, share: 100}];
  const residents = groups.flatMap(g => beliefOptions(s, g.community).map(o =>
    ({ worship: o.system.worship ?? [], share: g.share * o.share / 100 })));
  const attendsPrimary = (m: typeof residents[number]) => m.worship.includes(primarySchool ?? primary.faith);
  const primaryShare = residents.reduce((n,m) => n + (attendsPrimary(m) ? m.share : 0), 0);
  if (!primaryShare) return [];
  let members = residents.filter(m => m.worship.length && !attendsPrimary(m));
  const sites = rules.filter(matchesSite(s)).flatMap(profile => {
    const schools = worshipSchools(profile, s.year);
    return (schools.length ? schools : [undefined]).map(school => ({profile, school, tradition: school?.id ?? profile.faith}));
  });
  const selected: {profile: ReligiousProfile; school?: NonNullable<ReligiousProfile["schools"]>[number]; tradition: string; label?: string}[] = [];
  const large = radius >= 55;
  while (selected.length < (large ? 2 : 1) && members.length) {
    const seen = new Set<string>();
    const candidates = sites.flatMap(site => {
      if (seen.has(site.tradition)) return [];
      seen.add(site.tradition);
      const share = members.reduce((n,m) => n + (m.worship.includes(site.tradition) ? m.share : 0), 0);
      if (share < (large ? 1 : 10)) return [];
      // Exponential draws give each congregation odds proportional to its share.
      const draw = random(seed, siteId, "congregation", site.tradition);
      return [{site, priority: -Math.log(1 - draw) / share}];
    });
    const choice = candidates.sort((a,b) => a.priority - b.priority)[0]?.site;
    if (!choice) break;
    selected.push(choice);
    members = members.filter(m => !m.worship.includes(choice.tradition));
  }
  if (large && selected.length < 2 && primaryShare >= 60 && primary.neighborhoodHouse)
    selected.push({profile:primary, tradition:primary.faith, label:primary.neighborhoodHouse});
  return selected;
}

const byClaim = new Map(rules.map(r => ["religious-"+r.id,r]));
export function sanctuaryAt(place?: { claim?: string }) {
  return byClaim.get(place?.claim ?? "");
}

export function localCongregation(sites: readonly Place[], home: Point, worship?: readonly string[]) {
  let closest: Place | undefined, distance = Infinity;
  for (const site of sites) {
    const tradition = site.worshipSchool ?? sanctuaryAt(site)?.faith;
    if (!tradition || !worship?.includes(tradition)) continue;
    const d = Math.hypot(site.entrance.x - home.x, site.entrance.y - home.y);
    if (d < distance) { closest = site; distance = d; }
  }
  return closest;
}

export type ReligiousScale = "small" | "medium" | "large";
/** A town's religious building follows the town's extent. */
export function religiousScale(radius: number): ReligiousScale {
  return radius < 75 ? "small" : radius < 90 ? "medium" : "large";
}
export const religiousRules = rules;
