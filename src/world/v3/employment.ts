import type { Actor, Pack, Point } from "../../core/types";
import {
  institutionFor,
  type Institution,
} from "../../content/characters/workplace";
import { resolveCharacterContext } from "../../content/characters/resolve";
import { generateCharacter } from "../../content/characters/generate";
import { livelihoodById } from "../../content/characters/livelihoods";
import { officeFor } from "../../content/interiors/offices";
import { worksitesFor } from "../../content/settlements/worksites";
import type { SettlementPlan, WorkSite } from "./types";

export type WorkplaceOffer = {
  id: string;
  kind: Institution;
  label: string;
  pos: Point;
  capacity: number;
  roles?: readonly string[];
  owner?:string;
};

function institutionAt(l: Parameters<typeof institutionFor>[0], pack: Pack, plan:SettlementPlan, id:string) {
  if(l.id==="fisher" && plan.waterfront?.members.some(m=>id===m.owner || id.startsWith(`${m.owner}-member-`)))return "fishery" as const;
  const processing = (pack.setting?.worksiteRevision ?? 1) >= 2 && worksitesFor(pack.setting!)
    .some(p=>p.revision && p.roles?.includes(l.id));
  return institutionFor(l,processing);
}

/** Only placed workplaces count; a venue that failed to fit supplies no jobs. */
export function workplacesIn(
  plan: SettlementPlan,
  pack: Pack,
): WorkplaceOffer[] {
  const offers: WorkplaceOffer[] = [];
  const add = (
    id: string,
    kind: Institution,
    label: string,
    pos: Point,
    capacity: number,
    roles?: readonly string[],
  ) => offers.push({ id, kind, label, pos, capacity, ...(roles ? {roles} : {}) });
  for (const p of plan.places) {
    if (p.structure?.abandoned !== undefined) continue;
    if (p.institution) add(p.id, p.institution, p.name, p.entrance, p.workCapacity ?? 2, p.workRoles);
    if (p.landUse === "industrial")
      add(
        p.id,
        "factory",
        p.name,
        p.entrance,
        Math.max(4, Math.min(24, Math.floor((p.w * p.h) / 12))),
      );
    const office = officeFor(p.name, pack.year);
    if (office) {
      if (office.id === "banking-hall")
        add(p.id, "bank", p.name, p.entrance, 4);
      else if (p.name.startsWith("Offices"))
        add(p.id, "administration", p.name, p.entrance, 6);
    }
    if (
      p.claim.startsWith("civic-") &&
      p.claim !== "civic-illustrative-public-hall"
    )
      add(p.id, "administration", p.name, p.entrance, 4);
    if (p.claim.startsWith("religious-"))
      add(p.id, "worship", p.name, p.entrance, 2);
  }
  for (const v of plan.venues ?? []) {
    if (!v.placeId || !plan.places.some((p) => p.id === v.placeId)) continue;
    if (v.venue.id === "venue.town-hall")
      add(v.placeId, "administration", v.venue.label, v.pos, 4);
    if (v.venue.kind !== "school") continue;
    add(v.placeId, "school", v.venue.label, v.pos, 2);
    add(v.placeId, "administration", v.venue.label, v.pos, 1);
  }
  for (const p of plan.plots) {
    if (p.kind === "field")
      add(p.id, "field", "the cultivated fields", p.access, 6);
    if (p.kind === "pasture" && p.id.endsWith("-pasture"))
      add(p.id, "pasture", "the pasture", p.access, 6);
  }
  if (plan.outdoors?.shore)
    add(
      `${plan.site.id}-shore`,
      "shore",
      "the waterside",
      plan.outdoors.shore,
      24,
    );
  const station = plan.railway?.station;
  for(const m of plan.waterfront?.members ?? []) offers.push({id:m.boatId,kind:"fishery",label:"the household's fishing landing",
    pos:m.landing,capacity:2,roles:["fisher"],owner:m.owner});
  if (station?.building)
    add(
      `${plan.site.id}-station`,
      "railway",
      "the railway station",
      station.door,
      1,
    );
  return offers;
}

function available(plan: SettlementPlan, kind: Institution, id: string, role?: string) {
  return (plan.employment ?? []).filter(
    (o) =>
      o.kind === kind && (!o.roles || !role || o.roles.includes(role)) &&
      (!o.owner || id===o.owner || id.startsWith(`${o.owner}-member-`)) &&
      [...plan.work].filter(
        ([worker, site]) =>
          worker !== id &&
          site.employment?.id === o.id &&
          site.employment.kind === kind,
      ).length < o.capacity,
  );
}

export function localWorkContext(
  plan: SettlementPlan,
  pack: Pack,
  id: string,
  community?: string,
) {
  const localRequirements = new Set<string>();
  const supplied: Partial<Record<Institution, string>> = {
    school: "schools", administration: "office", factory: "factories", railway: "railways", printing: "print", mill: "mills",
  };
  for (const offer of plan.employment ?? []) {
    localRequirements.add(offer.kind);
    if((pack.setting?.worksiteRevision ?? 1)>=3 && ["shore","boatyard","fishery"].includes(offer.kind)) localRequirements.add("water");
    const requirement = supplied[offer.kind];
    if (requirement) localRequirements.add(requirement);
  }
  const context = resolveCharacterContext(pack.setting!, community, localRequirements);
  return {
    ...context,
    livelihoods: context.livelihoods.filter((l) => {
      const kind = institutionAt(l,pack,plan,id);
      return !kind || available(plan, kind, id, l.id).length > 0;
    }),
  };
}

/** Keep identities and family names when the initial regional draw has no local work. */
export function assignLocalWork(
  plan: SettlementPlan,
  pack: Pack,
  seed: string,
  actor: Actor,
  site: WorkSite,
) {
  if (!pack.setting?.employmentRevision || actor.role === "Child") return;
  let kit = livelihoodById(
    actor.origin?.specialty ?? actor.origin?.livelihood ?? "",
  );
  let kind = kit && institutionAt(kit,pack,plan,actor.id);
  if (kind && !available(plan, kind, actor.id, kit!.id).length) {
    const replacement = generateCharacter(
      pack.setting,
      seed,
      actor.id,
      actor.age ?? 34,
      undefined,
      undefined,
      undefined,
      actor.origin?.sex,
      undefined,
      undefined,
      localWorkContext(plan, pack, actor.id, actor.origin?.community),
    );
    const oldRole = actor.role;
    actor.role = replacement.role;
    actor.inventory = replacement.inventory;
    if (actor.origin)
      Object.assign(actor.origin, {
        livelihood: replacement.origin.livelihood,
        roleLabel: replacement.origin.roleLabel,
        specialty: replacement.origin.specialty,
      });
    actor.appearance = replacement.appearance;
    actor.worn = replacement.worn;
    for (const p of plan.places) {
      if (p.owner === actor.id && p.name.startsWith(`${oldRole}'s `))
        p.name = p.name.replace(`${oldRole}'s `, `${actor.role}'s `);
    }
    kit = livelihoodById(actor.origin?.livelihood ?? "");
    kind = kit && institutionAt(kit,pack,plan,actor.id);
  }
  site.role = actor.role;
  delete site.employment;
  if (!kind) {
    actor.work = { ...site.work, space: "outside" };
    return;
  }
  const owns = (id: string) => plan.plots.some(p => p.id === id && p.owner === actor.id) ||
    plan.places.some(p => p.id === id && p.owner === actor.id);
  const options = available(plan, kind, actor.id, kit!.id).sort(
    (a, b) =>
      Number(!owns(a.id)) - Number(!owns(b.id)) ||
      Math.hypot(a.pos.x - site.home.x, a.pos.y - site.home.y) -
        Math.hypot(b.pos.x - site.home.x, b.pos.y - site.home.y) ||
      a.id.localeCompare(b.id),
  );
  const offer = options[0];
  if (!offer) return;
  site.work = { ...offer.pos };
  if (kind === "pasture") {
    const plot = plan.plots.find((p) => p.id === offer.id);
    const keeper = plot?.owner && plan.work.get(plot.owner);
    site.gateId = keeper ? keeper.gateId : undefined;
    site.pasture = keeper ? keeper.pasture : undefined;
  }
  if(kind==="fishery") {
    actor.role=kit!.label;
    if(actor.origin)actor.origin.roleLabel=actor.role;
    site.role=actor.role;
  }
  site.label = kit!.activity;
  site.employment = { id: offer.id, kind, label: offer.label };
  actor.work = { ...offer.pos, space: "outside" };
}

export function prepareLocalWork(
  plan: SettlementPlan,
  pack: Pack,
  seed: string,
) {
  if (!pack.setting?.employmentRevision) return;
  plan.employment = workplacesIn(plan, pack);
  // The player's requested work has first claim; ordinary residents follow stable plan order.
  const owners = [...plan.work].sort(
    ([a], [b]) => Number(b === "player") - Number(a === "player"),
  );
  for (const [id, site] of owners) {
    let actor = plan.actors.find((a) => a.id === id);
    if (!actor && id === "player") {
      const context = pack.setting.worksiteRevision ? localWorkContext(plan,pack,id) : undefined;
      const kit = livelihoodById(pack.role.toLowerCase().replace(/ /g,"-"));
      const unavailable = (pack.setting.worksiteRevision ?? 1) >= 2 && kit && institutionAt(kit,pack,plan,id) &&
        !context?.livelihoods.some(l=>l.id===kit.id);
      actor = {id,kind:"human",...generateCharacter(
        pack.setting,pack.setting.character?.appearanceSeed ?? seed,id,
        pack.setting.character?.age ?? 34,unavailable ? undefined : pack.role,
        undefined,undefined,undefined,undefined,undefined,context,
      )} as Actor;
    }
    site.domesticWork ??= { ...site.work };
    if (actor) assignLocalWork(plan, pack, seed, actor, site);
  }
}
