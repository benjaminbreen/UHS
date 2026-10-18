import { CONDITIONS, type ConditionDef, type HealthPerson } from "../content/health/conditions";
import { AILMENTS, type AilmentDef, type Season } from "../content/health/ailments";
import { matchesCharacterScope } from "../content/characters/resolve";
import { sexOf } from "./brief";
import { seasonAt } from "./livelihood";
import { random } from "./random";
import type { Actor, Snapshot } from "./types";
import type { CharacterScope } from "../content/characters/context-types";
import type { WorldSetting } from "../content/geography/types";
import { infections, infectionEvidence, type Treatment } from "../content/health/infections";

/** New infections respond to care; unversioned courses retain legacy outcomes. */
export type Ailment = {
  id: string;
  who: string;
  since: number;
  days: number;
  course: "mend" | "linger" | "die";
  /** Someone sat with them while it was at its worst; checked once. */
  tended?: boolean;
  infection?: {
    exposed: number; source: string; route: string;
    /** Extra recovery time earned by rest and treatment, in seconds. */
    progress: number; rest: number; support: number; strain: number;
    roll: number; mortality: number;
    careUntil?: number; medicineUntil?: number; fluidsUntil?: number;
    announced?: boolean;
    assessment?: { by: string; at: number; text: string };
  };
};

export type DiseaseEvent = { n: number; clock: number; map: string; kind: string; who: string; disease: string; source?: string; dose?: number; treatment?: Treatment; detail?: string };
export type DiseaseState = {
  serial: number;
  exposures: { who: string; disease: string; source: string; route: string; hour: number; dose: number }[];
  sources: { id: string; household: string; until: number }[];
  events: DiseaseEvent[];
};

export function diseaseState(s: Snapshot) {
  return s.disease ??= { serial: 0, exposures: [], sources: [], events: [] };
}

export function diseaseEvent(s: Snapshot, event: Omit<DiseaseEvent, "n" | "map">) {
  const d = diseaseState(s);
  d.events.push({ ...event, map: s.manifest.setting?.playableMap?.id ?? s.manifest.seed, n: ++d.serial });
  if (d.events.length > 2000) d.events.splice(0, d.events.length - 2000);
}

const DAY = 86400;

export const healthPerson = (a: Actor, setting?: WorldSetting): HealthPerson => ({
  age: a.age ?? 30,
  sex: sexOf(a),
  setting,
  role: a.role.toLowerCase(),
});

/** What something was called here and now. */
export function nameFor(def: { names: readonly { scope?: CharacterScope; name: string }[] }, setting?: WorldSetting) {
  return (setting && def.names.find((n) => n.scope && matchesCharacterScope(n.scope, setting)))?.name ?? def.names.at(-1)!.name;
}

/** Lasting conditions, from the seed as stats are, most marking first. */
export function conditionsOf(seed: string, a: Actor, setting?: WorldSetting): ConditionDef[] {
  if (a.kind !== "human") return [];
  const p = healthPerson(a, setting);
  return CONDITIONS.filter((c) => random(seed, "condition", a.id, c.id) < c.rate(p))
    .sort((x, y) => y.salience - x.salience);
}

export const ailmentDef = (id: string) => AILMENTS.find((d) => d.id === id)!;

/** How ill, 0 to 1, by how far through its course it is. */
export function severity(ail: Ailment, clock: number) {
  if (clock < ail.since) return 0;
  const t = illnessProgress(ail, clock) / (ail.days * DAY);
  if (t < 0 || t >= 1) return ail.infection && ail.course === "die" ? 1 : 0;
  if (ail.course === "die") return Math.min(1, 0.35 + t * 0.7);
  if (ail.course === "linger") return Math.min(0.6, 0.35 + t);
  return 0.15 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.3));
}

export const illnessProgress = (ail: Ailment, clock: number) => Math.max(0, clock - ail.since) + (ail.infection?.progress ?? 0);

/** "since yesterday", "for three days", "for a week". */
export function forHowLong(ail: Ailment, clock: number, words: (n: number) => string) {
  const n = Math.floor((clock - ail.since) / DAY);
  return n < 1 ? "since last night" : n === 1 ? "since yesterday" : n < 7 ? `for ${words(n)} days`
    : n < 11 ? "for a week" : n < 18 ? "for more than a week" : "for weeks";
}

export function start(seed: string, def: AilmentDef, a: Actor, p: HealthPerson, clock: number, underway: boolean, mortal: boolean): Ailment {
  const r = (k: string) => random(seed, "ailment", k, a.id, def.id, Math.floor(clock / 3600));
  const days = def.days[0] + Math.floor(r("days") * (def.days[1] - def.days[0] + 1));
  const deadly = mortal ? def.deadly(p) : 0;
  const roll = r("course");
  const course = roll < deadly ? "die" : roll < deadly + 0.2 ? "linger" : "mend";
  // Already under way when a life begins, at most halfway through its course.
  const since = underway ? clock - Math.floor((0.5 + r("since") * days * 0.5) * DAY) : clock;
  return { id: def.id, who: a.id, since, days, course };
}

const seasonOf = (setting: WorldSetting | undefined, clock: number) =>
  seasonAt(setting?.season ?? "spring", clock) as Season;

/** Seed residents and postpartum cases; legacy worlds spare the plot cast. */
export function seedAilments(s: Snapshot, setting: WorldSetting | undefined, spare: ReadonlySet<string>): Ailment[] {
  if (s.manifest.disease) {
    spare = new Set();
    for (const a of s.actors) {
      if (!practitioner(a) || a.medicalStock) continue;
      const modern = (setting?.year ?? 0) >= 1950;
      const supplied = modern && random(s.manifest.seed, "medical-supply", a.id) < (setting?.settlement === "city" ? 0.85 : 0.45);
      a.medicalStock = { antibiotic: supplied ? 3 : 0, rehydration: supplied && (setting?.year ?? 0) >= 1970 ? 6 : 0 };
    }
  }
  const seed = s.manifest.seed, season = seasonOf(setting, s.clock);
  const out: Ailment[] = [];
  for (const a of s.actors) {
    if (a.kind !== "human" || a.dead || spare.has(a.id)) continue;
    const p = { ...healthPerson(a, setting), season };
    const def = AILMENTS.find((d) => (!s.manifest.disease || d.id !== "break") && random(seed, "ill", a.id, d.id) < d.rate(p));
    if (def) out.push(s.manifest.disease ? infect(s, def.id, a, setting, s.clock, "initial", "outside", true) : start(seed, def, a, p, s.clock, true, a.id !== s.player.id));
  }
  const childbed = ailmentDef("childbed");
  for (const h of s.households ?? []) {
    if (!setting || !h.history?.some((e) => e.kind === "born" && e.year === setting.year)) continue;
    const mother = s.actors.find((a) => h.members.includes(a.id) && sexOf(a) === "female" &&
      (a.age ?? 0) >= 16 && (a.age ?? 99) <= 45 && a.relations?.some((r) => r.kind === "partner"));
    if (mother && !spare.has(mother.id) && !out.some((x) => x.who === mother.id) && random(seed, "childbed", mother.id) < 0.4)
      out.push(s.manifest.disease ? infect(s, childbed.id, mother, setting, s.clock, "birth", "wound", true) : start(seed, childbed, mother, healthPerson(mother, setting), s.clock, true, mother.id !== s.player.id));
  }
  return out;
}

/** New cases this hour: a day's prevalence spread over the course's length.
 * The player falls ill as anyone does, and can die of it. */
export function onsets(s: Snapshot, setting: WorldSetting | undefined, spare: ReadonlySet<string>): Ailment[] {
  if (s.manifest.disease) return infectionHour(s, setting);
  const seed = s.manifest.seed, season = seasonOf(setting, s.clock), hour = Math.floor(s.clock / 3600);
  const ill = new Set((s.ailments ?? []).map((x) => x.who));
  const out: Ailment[] = [];
  for (const a of [...s.actors, s.player]) {
    if (a.kind !== "human" || a.dead || ill.has(a.id) || spare.has(a.id)) continue;
    const p = { ...healthPerson(a, setting), season };
    for (const def of AILMENTS) {
      const perHour = def.rate(p) / ((def.days[0] + def.days[1]) / 2) / 24;
      if (perHour > 0 && random(seed, "onset", a.id, def.id, hour) < perHour) {
        out.push(start(seed, def, a, p, s.clock, false, true));
        break;
      }
    }
  }
  return out;
}

export function infect(s: Snapshot, id: string, actor: Actor, setting: WorldSetting | undefined, clock: number, source: string, route: string, underway = false) {
  const def = ailmentDef(id), p = healthPerson(actor, setting);
  const ail = start(s.manifest.seed, def, actor, p, clock, underway, true);
  const profile = infections[id], incubation = profile?.incubation ?? [0, 0];
  if (!underway) ail.since = clock + Math.round((incubation[0] + random(s.manifest.seed, "incubation", actor.id, id, clock) * (incubation[1] - incubation[0])) * 3600);
  ail.infection = {
    exposed: underway ? ail.since - incubation[0] * 3600 : clock, source, route,
    progress: 0, rest: 0, support: 0, strain: 0,
    roll: random(s.manifest.seed, "disease-outcome", actor.id, id, clock), mortality: def.deadly(p),
  };
  ail.course = "mend";
  diseaseEvent(s, { clock, kind: "infection", who: actor.id, disease: id, source, detail: route });
  return ail;
}

export function exposure(s: Snapshot, who: Actor, disease: string, source: string, route: string, dose: number, clock: number) {
  if (dose <= 0 || who.dead || who.kind !== "human" || (who.immune?.[disease] ?? 0) > clock || s.ailments?.some((a) => a.who === who.id)) return;
  const d = diseaseState(s), hour = Math.floor(clock / 3600);
  const old = d.exposures.find((x) => x.who === who.id && x.disease === disease && x.source === source && x.hour === hour);
  if (old) old.dose += dose;
  else d.exposures.push({ who: who.id, disease, source, route, hour, dose });
}

export function diseaseTime(s: Snapshot, elapsed: number, clock: number) {
  if (!s.manifest.disease) return;
  const ill = (s.ailments ?? []).filter((a) => a.infection);
  if (!ill.length && !s.player.injury?.open && !s.actors.some((a) => a.injury?.open)) return;
  const people = new Map([...s.actors, s.player].map((a) => [a.id, a]));
  const groups = new Map<string, Actor[]>(), sick = new Set((s.ailments ?? []).map((a) => a.who));
  if (ill.some((a) => a.id === "cough" && clock + elapsed > a.since - 12 * 3600))
    for (const a of people.values()) {
      if (a.kind !== "human" || a.dead || sick.has(a.id) || (a.immune?.cough ?? 0) > clock) continue;
      const key = a.pos.space === "outside" ? `outside:${Math.floor(a.pos.x / 3)},${Math.floor(a.pos.y / 3)}` : a.pos.space;
      const group = groups.get(key) ?? [];
      group.push(a); groups.set(key, group);
    }
  for (const ail of ill) {
    const a = people.get(ail.who), i = ail.infection!;
    if (!a || a.dead) continue;
    const dt = Math.max(0, clock + elapsed - Math.max(clock, ail.since));
    if (dt) {
      const resting = /sleep|rest|laid up|in bed|lying in/i.test(a.activity);
      const active = (until = 0) => Math.max(0, Math.min(clock + elapsed, until) - Math.max(clock, ail.since));
      const supported = active(i.careUntil), medicine = active(i.medicineUntil), fluids = active(i.fluidsUntil);
      i.rest += resting ? dt : 0;
      i.support += Math.max(supported, fluids);
      i.strain += (a.hunger >= 85 || a.fatigue >= 90) ? dt : 0;
      i.progress += (resting ? dt * 0.2 : 0) + supported * 0.1 + medicine * 0.5 + fluids * 0.2;
    }
    if (ail.id !== "cough" || clock + elapsed <= ail.since - 12 * 3600 || illnessProgress(ail, clock) >= ail.days * DAY) continue;
    const indoors = a.pos.space !== "outside";
    const source = `${s.manifest.seed}:${a.id}:${i.exposed}`;
    const near = indoors ? groups.get(a.pos.space) ?? [] : [-1, 0, 1].flatMap((dx) => [-1, 0, 1].flatMap((dy) => groups.get(`outside:${Math.floor(a.pos.x / 3) + dx},${Math.floor(a.pos.y / 3) + dy}`) ?? []));
    for (const other of near) {
      const distance = Math.hypot(other.pos.x - a.pos.x, other.pos.y - a.pos.y);
      if ((!indoors && distance > 2.5) || (indoors && distance > 12)) continue;
      const rate = indoors ? (distance <= 2.5 ? 0.12 : 0.035) : 0.008;
      const duration = Math.max(0, Math.min(clock + elapsed, ail.since + ail.days * DAY - i.progress) - Math.max(clock, ail.since - 12 * 3600));
      exposure(s, other, "cough", source, "air", rate * duration / 3600, clock);
    }
  }
  for (const a of people.values())
    if (a.injury?.open && a.injury.until > clock) {
      const duration = Math.max(0, Math.min(clock + elapsed, a.injury.until) - Math.max(clock, a.injury.cleanUntil ?? 0));
      exposure(s, a, "wound", `wound:${a.id}:${a.injury.since ?? a.injury.until}`, "wound", duration / 3600 * 0.003, clock);
    }
}

export function mealExposure(s: Snapshot, a: Actor, clock: number) {
  if (!s.manifest.disease || (a.preparedFoodUntil ?? 0) > clock) return;
  const h = s.households?.find((h) => h.members.includes(a.id));
  if (!h) return;
  for (const source of diseaseState(s).sources)
    if (source.household === h.id && source.until > clock)
      exposure(s, a, "flux", source.id, "provisions", 0.18, clock);
}

function infectionHour(s: Snapshot, setting: WorldSetting | undefined) {
  const clock = s.clock, d = diseaseState(s), people = new Map([s.player, ...s.actors].map((a) => [a.id, a]));
  const fresh: Ailment[] = [];
  for (const x of d.exposures.filter((x) => (x.hour + 1) * 3600 <= clock).sort((a, b) => a.who.localeCompare(b.who) || a.source.localeCompare(b.source))) {
    diseaseEvent(s, { clock, kind: "exposure", who: x.who, disease: x.disease, source: x.source, dose: x.dose, detail: x.route });
    const a = people.get(x.who);
    if (!a || a.dead || (a.immune?.[x.disease] ?? 0) > clock || [...(s.ailments ?? []), ...fresh].some((ail) => ail.who === a.id)) continue;
    if (random(s.manifest.seed, "transmission", x.who, x.disease, x.source, x.hour) < -Math.expm1(-x.dose))
      fresh.push(infect(s, x.disease, a, setting, clock, x.source, x.route));
  }
  d.exposures = d.exposures.filter((x) => (x.hour + 1) * 3600 > clock);
  d.sources = d.sources.filter((x) => x.until > clock);
  for (const h of s.households ?? []) {
    const sick = (s.ailments ?? []).some((a) => h.members.includes(a.who) && a.id === "flux" && severity(a, clock) > 0);
    const day = Math.floor(clock / DAY);
    const introduced = clock % DAY === 6 * 3600 && random(s.manifest.seed, "provisions", h.id, day) < ((setting?.year ?? 1500) < 1920 ? 0.025 : 0.006) * (seasonOf(setting, clock) === "summer" ? 2 : 1);
    if (sick || introduced) {
      const existing = d.sources.find((x) => x.household === h.id);
      if (existing) existing.until = clock + 2 * DAY;
      else {
        const source = { id: `${s.manifest.seed}:provisions:${h.id}:${day}`, household: h.id, until: clock + 2 * DAY };
        d.sources.push(source);
        diseaseEvent(s, { clock, kind: "contamination", who: h.id, disease: "flux", source: source.id, detail: sick ? "household case" : "outside introduction" });
      }
    }
  }
  if (clock % DAY === 7 * 3600 || clock % DAY === 19 * 3600)
    for (const a of people.values()) mealExposure(s, a, clock);
  const season = seasonOf(setting, clock);
  for (const a of people.values()) {
    if (a.kind !== "human" || a.dead || [...(s.ailments ?? []), ...fresh].some((x) => x.who === a.id)) continue;
    const p = { ...healthPerson(a, setting), season };
    for (const def of AILMENTS) {
      if (def.id === "flux" || def.id === "wound" || def.id === "break" || (a.immune?.[def.id] ?? 0) > clock) continue;
      const rate = def.rate(p) / ((def.days[0] + def.days[1]) / 2) / 24;
      if (random(s.manifest.seed, "disease-import", a.id, def.id, Math.floor(clock / 3600)) < rate) {
        fresh.push(infect(s, def.id, a, setting, clock, "outside introduction", "outside"));
        break;
      }
    }
  }
  return fresh;
}

export function updateCourse(ail: Ailment, clock: number) {
  const i = ail.infection;
  if (!i || clock < ail.since) return;
  const duration = Math.max(3600, clock - ail.since);
  const care = Math.min(1, i.support / duration), rest = Math.min(1, i.rest / duration), strain = Math.min(1, i.strain / duration);
  const received = (until: number | undefined, length: number) => until === undefined ? 0 : Math.max(0, Math.min(clock, until) - Math.max(ail.since, until - length));
  const treatmentTime = (ail.id === "wound" ? received(i.medicineUntil, 7 * DAY) : 0) + (ail.id === "flux" ? received(i.fluidsUntil, DAY) : 0);
  const treatment = 1 - 0.7 * Math.min(1, treatmentTime / (12 * 3600));
  ail.course = i.roll < i.mortality * (1 + strain) * (1 - care * 0.4) * (1 - rest * 0.2) * treatment ? "die" : "mend";
}

export function resolvedInfection(s: Snapshot, ail: Ailment, a: Actor | undefined, clock: number) {
  if (!ail.infection) return;
  const immunity = infections[ail.id]?.immunity ?? 0;
  if (a && ail.course !== "die" && immunity) (a.immune ??= {})[ail.id] = clock + immunity * DAY;
  diseaseEvent(s, { clock, kind: ail.course === "die" ? "death" : "recovery", who: ail.who, disease: ail.id });
}

export function symptomsOf(ail: Pick<Ailment, "id">) {
  return [...(infections[ail.id]?.symptoms ?? (ail.id === "break" ? ["painful broken arm"] : ail.id === "childbed" ? ["weakness after childbirth", "feverishness"] : ailmentDef(ail.id).look === "rash" ? ["feverishness", "rash"] : ["feverishness", "weakness"]))];
}

export function observedIllnesses(s: Snapshot, who: string, setting?: WorldSetting) {
  return (s.ailments ?? []).filter((a) => a.who === who && severity(a, s.clock) > 0).map((a) => {
    const symptoms = symptomsOf(a), sev = severity(a, s.clock);
    const t = illnessProgress(a, s.clock) / (a.days * DAY);
    return {
      ...(!a.infection ? { id: a.id } : {}), name: a.infection ? symptoms.join(", ") : nameFor(ailmentDef(a.id), setting),
      severity: sev, since: a.since,
      ...(a.infection ? { symptoms, trend: a.course === "die" || t < 0.38 ? "worsening" : "improving", assessment: a.infection.assessment } : {}),
    };
  });
}

export const practitioner = (a: Actor) => a.kind === "human" && !a.dead && (a.age ?? 30) >= 16 && /\b(healer|physician|doctor|surgeon|nurse|apothecary|herbalist)\b/i.test(a.role);

export function healthReport(s: Snapshot, a: Actor, setting?: WorldSetting) {
  const own = observedIllnesses(s, a.id, setting);
  const family = [s.player, ...s.actors].filter((x) => x.id !== a.id && x.householdId && x.householdId === a.householdId)
    .flatMap((x) => observedIllnesses(s, x.id, setting).map((ill) => `${x.name}: ${ill.name}`));
  return [own.length ? own.map((ill) => `${ill.name}, since game hour ${Math.floor(ill.since / 3600)}, ${ill.trend ?? "ongoing"}${ill.assessment ? `; ${ill.assessment.text} (${ill.assessment.by})` : ""}`).join("; ") : "No symptoms to report.", family.length ? `Known illness in your household: ${family.join("; ")}.` : ""].filter(Boolean).join(" ");
}

export function healthResearch(s: Snapshot) {
  if (!s.manifest.disease) return;
  return structuredClone({ calibration: { status: "inferred", sources: infectionEvidence, limitation: "Prototype hazards, courses, immunity and local supply are game calibrations, not measured historical rates. Only respiratory, provisions and wound transmission are modeled." }, illnesses: s.ailments ?? [], exposures: s.disease?.exposures ?? [], sources: s.disease?.sources ?? [], events: s.disease?.events ?? [] });
}

/** How ill someone is now, 0 to 1: their worst illness under way. */
export const ailing = (s: Snapshot, id: string, clock: number) =>
  (s.ailments ?? []).reduce((worst, a) => (a.who === id ? Math.max(worst, severity(a, clock)) : worst), 0);

export function bodilyLimits(s: Snapshot) {
  const p = s.player;
  const sick = ailing(s, p.id, s.clock), injury = p.injury && p.injury.until > s.clock ? 0.15 : 0;
  const wounded = s.manifest.survival ? Math.max(0, (60 - (p.health ?? 100)) / 120) : 0;
  const hungry = s.manifest.survival ? Math.max(0, (p.hunger - 60) / 40) : 0;
  const tired = s.manifest.survival ? Math.max(0, (p.fatigue - 50) / 50) : 0;
  return {
    physical: 1 - Math.min(s.manifest.survival ? 0.8 : 0.6, sick * 0.5 + injury + wounded + hungry * 0.25 + tired * 0.35),
    mental: 1 - Math.min(0.65, sick * 0.3 + hungry * 0.1 + tired * 0.2),
  };
}

export function bodyState(s: Snapshot, setting?: WorldSetting) {
  const p = s.player;
  return {
    health: p.health ?? 100, hunger: p.hunger, fatigue: p.fatigue,
    injury: p.injury && p.injury.until > s.clock ? { ...p.injury } : undefined,
    illnesses: observedIllnesses(s, p.id, setting),
    undernourishedHours: (p.hungerDebt ?? 0) / 3600,
    limits: bodilyLimits(s),
  };
}

export function bodySummary(s: Snapshot, setting?: WorldSetting) {
  const b = bodyState(s, setting);
  return [
    `Health ${Math.round(b.health)}/100; hunger ${Math.round(b.hunger)}/100; fatigue ${Math.round(b.fatigue)}/100.`,
    b.hunger >= 95 ? "You are severely hungry; find a meal. Going without food for days damages your health." : b.hunger >= 70 ? "You are hungry and losing strength." : "",
    b.fatigue >= 95 ? "You are exhausted; you can walk, but cannot run. Sleep to recover." : b.fatigue >= 70 ? "You are tired; rest will help." : "",
    b.injury ? `Injury: ${b.injury.name}; about ${Math.ceil((b.injury.until - s.clock) / 86400)} day(s) to mend.` : "",
    b.illnesses.length ? `Symptoms: ${b.illnesses.map((a) => `${a.name} (${a.severity >= 0.6 ? "severe" : "ailing"}${a.trend ? `; ${a.trend}; about ${Math.max(1, Math.floor((s.clock - a.since) / 3600))} hours` : ""})${a.assessment ? `; ${a.assessment.text}, assessed by ${a.assessment.by}` : ""}`).join(", ")}.` : "",
    b.limits.physical < 1 ? `Physical ability reduced by ${Math.round((1 - b.limits.physical) * 100)}%.` : "",
  ].filter(Boolean).join(" ");
}
