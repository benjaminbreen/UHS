import { random } from "../../core/random";
import type { Sex } from "../../core/brief";
import type { Fabric } from "../../core/time/structure";
import type { HouseholdEvent, SocialRelation } from "../../core/types";
import type { LearnerArrangement } from "../../content/households/learners";
import type { ResidenceCustom } from "../../content/households/residence";
import type { PluralMarriage } from "../../content/households/plural-marriage";
import type { HouseholdBondage } from "../../content/households/bondage";
import type { NursingCustom } from "../../content/households/nursing";

/** Someone the story leaves living in the house. */
export type Resident = {
  /** What they are to the householder, as the card says it. */
  as: string;
  /** What the householder is to them, and they to the householder. */
  toHead: SocialRelation["kind"];
  fromHead: SocialRelation["kind"];
  age: number;
  sex?: Sex;
  /** Born to the partner who still lives here, so they are that partner's too. */
  ofPartner?: boolean;
  role?: "Child" | "Elder" | "Servant" | "Apprentice";
  /** Index of the resident this one is married to, for a child's spouse. */
  spouseOf?: number;
  /** Held in the house and not free to leave it. */
  bound?: boolean;
};
const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

/**
 * A household as the result of a life rather than a roll of its size: a
 * marriage, the children it had and lost, a partner who died and one who came
 * after, the grown ones who left, a widowed parent taken in, help hired when
 * there was money for it. What is left in the house is who lives there now;
 * the rest is history the card can tell.
 */
export function householdStory(o: {
  seed: string;
  id: string;
  year: number;
  age: number;
  sex: Sex;
  means: number;
  shared: boolean;
  extended: boolean;
  /** A hut or a stall: room for a couple and their smallest. */
  small: boolean;
  /** How this trade is taught here, where the work takes a learner. */
  learner?: Pick<LearnerArrangement, "odds" | "own" | "ages" | "girls" | "term" | "word">;
  residence?: Pick<ResidenceCustom, "rule" | "heirOnly" | "stay">;
  plural?: Pick<PluralMarriage, "share" | "minMeans" | "word">;
  bondage?: Pick<HouseholdBondage, "minMeans" | "share" | "servants" | "ages" | "girls" | "word">;
  nursing?: Pick<NursingCustom, "mode" | "minMeans" | "odds">;
  player: boolean;
  modern: boolean;
  revised?: boolean;
  formalMarriage?: boolean;
  apprentice?: boolean;
  built: number;
  fabric: Fabric;
}) {
  const r = (...k: (string | number)[]) =>
    random(o.seed, o.id, "story", ...k);
  const Y = o.year,
    a = o.age,
    born = Y - a;
  const history: HouseholdEvent[] = [];
  const residents: Resident[] = [];
  const at = (year: number) => Math.min(Y, Math.round(year));
  const other: Sex = o.sex === "female" ? "male" : "female";
  const spouse = (s: Sex) => (s === "female" ? "wife" : "husband");
  const offspring = (s: Sex) => (s === "female" ? "daughter" : "son");
  let fortune = o.means,
    infants = 0,
    babies = 0,
    children = 0,
    heirKept = false;
  const rule = o.residence?.rule;
  /** Whether a grown child of this sex stays at home when they marry. */
  const keeps = (sex: Sex) => rule === "patrilocal" ? sex === "male" : rule === "matrilocal" ? sex === "female" : undefined;
  let unionYear: number | undefined;

  if (o.shared) {
    const n = 1 + Math.floor(r("lodgers") * 3);
    for (let i = 0; i < n; i++)
      residents.push({
        as: "lodger",
        toHead: "co-resident",
        fromHead: "co-resident",
        age: 18 + Math.floor(r("lodger", i) * 30),
      });
  } else if (o.revised
    ? r("union") < clamp((a - 17) / 18, 0.15, 0.82) * (o.apprentice ? 0.45 : 1)
    : o.player || r("wed") < (a < 25 ? 0.5 : 0.9)) {
    unionYear = at(born + (o.revised
      ? Math.min(a, 17 + Math.floor(r("wed-age") * 9))
      : 17 + Math.floor(r("wed-age") * 9)));
    const older = (n: number) => o.revised
      ? (r("gap-direction") < 0.5 ? n : -n)
      : (o.sex === "female" ? n : -n);
    const unions: {
      from: number;
      to: number;
      partnerAge: number;
      alive: boolean;
    }[] = [];
    const widowed =
      (!o.player || o.revised) &&
      Y - unionYear > 2 &&
      r("widowed") < clamp((a - 30) / 70) * (o.modern ? 0.4 : 1);
    const end = widowed ? at(unionYear + 1 + r("died") * (Y - unionYear - 1)) : Y;
    unions.push({
      from: unionYear,
      to: end,
      partnerAge: a + older(1 + Math.floor(r("gap") * 5)),
      alive: !widowed,
    });
    const partnerAs = o.revised && !o.formalMarriage ? "partner" : spouse(other);
    history.push({ year: unionYear, kind: o.revised && !o.formalMarriage ? "joined" : "wed", as: partnerAs });
    if (widowed) {
      history.push({ year: end, kind: "died", as: partnerAs });
      fortune -= 0.12;
      if (a < 52 && Y - end >= 2 && r("remarry") < 0.5) {
        const again = at(end + 1 + r("again") * Math.min(3, Y - end - 1));
        unions.push({
          from: again,
          to: Y,
          partnerAge: a + older(-2 - Math.floor(r("gap2") * 8)),
          alive: true,
        });
        history.push({ year: again, kind: o.revised && !o.formalMarriage ? "joined" : "wed", as: partnerAs });
      }
    }
    const living = unions.find((u) => u.alive);
    if (living)
      residents.push({
        as: partnerAs,
        toHead: "partner",
        fromHead: "partner",
        age: Math.max(o.revised ? 18 : 16, living.partnerAge),
        sex: other,
      });
    unions.forEach((u, ui) => {
      const mother = o.sex === "female" ? a : u.partnerAge;
      const younger = Math.min(a, u.partnerAge);
      for (
        let t = u.from + 1 + Math.floor(r("first", ui) * 2);
        t <= u.to;
        t += 2 + Math.floor(r("space", ui, t) * 2)
      ) {
        if (mother - (Y - t) > 42) break;
        if (younger - (Y - t) < 18) continue;
        if (r("birth", ui, t) > 0.75) continue;
        const age = Y - t,
          sex: Sex = r("sex", ui, t) < 0.5 ? "female" : "male",
          as = offspring(sex);
        if (r("lost", ui, t) < (o.modern ? 0.03 : 0.3)) {
          history.push({
            year: at(t + r("lost-at", ui, t) * Math.min(8, age)),
            kind: "died",
            as,
          });
          continue;
        }
        history.push({ year: t, kind: "born", as });
        if (age < 5) {
          infants++;
          if (age < 2) babies++;
          continue;
        }
        const k = keeps(sex);
        const leaving = k === undefined ? 1 : !k ? 1.8 : !o.residence!.heirOnly ? 0.25 : heirKept ? 1.2 : 0.15;
        const grown = age >= 15 && r("left", ui, t) < clamp(((age - 14) / 8) * leaving);
        if (grown || children >= 4 || (o.small && age >= 12)) {
          history.push({
            year: at(t + 14 + r("left-at", ui, t) * Math.max(0, age - 14)),
            kind: "left",
            as,
          });
          continue;
        }
        children++;
        if (k && o.residence!.heirOnly) heirKept = true;
        residents.push({
          as,
          toHead: "parent",
          fromHead: "child",
          age,
          sex,
          ofPartner: u.alive,
          role: age < 14 ? "Child" : undefined,
        });
      }
    });
    const pl = o.plural;
    if (pl && living && o.sex === "male" && a >= 28 && o.means >= pl.minMeans &&
        r("plural") < pl.share * clamp(0.4 + (o.means - pl.minMeans) / 0.4)) {
      const age = 18 + Math.floor(r("plural-age") * Math.max(1, Math.min(a, living.partnerAge) - 22));
      const wed = at(Y - Math.floor(r("plural-wed") * Math.min(12, age - 17)));
      residents.push({ as: pl.word, toHead: "partner", fromHead: "partner", age, sex: "female" });
      history.push({ year: wed, kind: pl.word === "concubine" ? "joined" : "wed", as: pl.word });
      // Pushed after her, so the household links the child to her.
      if (Y - wed >= 2 && r("plural-child") < 0.6) {
        const c = 1 + Math.floor(r("plural-child-age") * (Y - wed - 1)),
          sex: Sex = r("plural-child-sex") < 0.5 ? "female" : "male";
        history.push({ year: Y - c, kind: "born", as: offspring(sex) });
        if (c < 5) {
          infants++;
          if (c < 2) babies++;
        } else residents.push({ as: offspring(sex), toHead: "parent", fromHead: "child", age: c, sex, ofPartner: true, role: "Child" });
      }
    }
  }
  if (o.residence) {
    for (const [i, m] of [...residents.entries()]) {
      const k = keeps(m.sex!);
      if (m.fromHead !== "child" || m.age < 18 || k === false ||
          r("married-in", i) >= o.residence.stay * clamp((m.age - 17) / 6)) continue;
      const sex: Sex = m.sex === "female" ? "male" : "female";
      const as = sex === "female" ? "daughter-in-law" : "son-in-law";
      residents.push({
        as, toHead: "parent-in-law", fromHead: "child-in-law", sex, spouseOf: i,
        age: Math.max(16, m.age + (sex === "male" ? 1 : -4) + Math.floor(r("in-law-age", i) * 5)),
      });
      history.push({ year: at(Y - r("married-in-at", i) * Math.min(5, m.age - 17)), kind: "joined", as });
    }
  }
  const partnered = residents.find((m) => m.toHead === "partner");
  // Where the couple lives with one side's parents, a parent taken in comes from that side.
  const inLaw = !!partnered && (rule === "patrilocal" ? o.sex === "female" : rule === "matrilocal" && o.sex === "male");
  if (!o.shared && a < 50 && r("elder") < (o.extended || (rule && rule !== "neolocal") ? 0.6 : 0.15)) {
    // Widows outlived their husbands, so the parent taken in is mostly a mother.
    const sex: Sex = r("elder-sex") < 0.7 ? "female" : "male";
    residents.push(inLaw ? {
      as: sex === "female" ? "mother-in-law" : "father-in-law",
      toHead: "child-in-law",
      fromHead: "parent-in-law",
      age: partnered!.age + 20 + Math.floor(r("elder-age") * 10),
      sex,
      role: "Elder",
    } : {
      as: sex === "female" ? "mother" : "father",
      toHead: "child",
      fromHead: "parent",
      age: a + 20 + Math.floor(r("elder-age") * 10),
      sex,
      role: "Elder",
    });
    history.push({
      year: at(Y - r("elder-in") * 8),
      kind: "joined",
      as: residents.at(-1)!.as,
    });
  }
  const b = o.bondage;
  const boundWord = (sex: Sex) => b!.word[sex === "female" ? 0 : 1];
  if (o.means >= 0.6 && r("servant") < o.means - 0.15) {
    const bound = !!b && r("servant-bound") < b.servants;
    const sex: Sex | undefined = bound ? (r("bound-sex") < b!.girls ? "female" : "male") : undefined;
    const as = bound ? boundWord(sex!) : "servant";
    residents.push({
      as,
      toHead: "master",
      fromHead: "servant",
      age: 13 + Math.floor(r("servant-age") * 18),
      sex,
      role: "Servant",
      bound,
    });
    history.push({ year: at(Y - r("servant-in") * 6), kind: "joined", as });
  }
  if (b && o.means >= b.minMeans && !residents.some((m) => m.bound) &&
      r("bound") < b.share * clamp(0.4 + (o.means - b.minMeans) / 0.4)) {
    const sex: Sex = r("bound-sex") < b.girls ? "female" : "male";
    const [lo, hi] = b.ages;
    residents.push({
      as: boundWord(sex),
      toHead: "master",
      fromHead: "servant",
      age: lo + Math.floor(r("bound-age") * (hi - lo + 1)),
      sex,
      role: "Servant",
      bound: true,
    });
    history.push({ year: at(Y - r("bound-in") * 10), kind: "joined", as: boundWord(sex) });
  }
  const n = o.nursing;
  let nurse: "out" | undefined;
  if (n && babies && o.means >= n.minMeans && r("nurse") < n.odds) {
    if (n.mode === "out") {
      nurse = "out";
      infants--;
    } else {
      residents.push({
        as: "wet nurse",
        toHead: "master",
        fromHead: "servant",
        age: 18 + Math.floor(r("nurse-age") * 16),
        sex: "female",
        role: "Servant",
        bound: !!b && r("nurse-bound") < b.servants,
      });
      history.push({ year: at(Y - r("nurse-in")), kind: "joined", as: "wet nurse" });
    }
  }
  const l = o.learner;
  if (l && !o.small && r("apprentice") < l.odds) {
    const [lo, hi] = l.ages;
    const own = residents.find((m) => m.fromHead === "child" && m.age >= lo && m.age <= hi + 3 &&
      (l.girls > 0 || m.sex === "male"));
    if (own && r("learner-own") < l.own) own.role = "Apprentice";
    else {
      const sex: Sex = r("learner-sex") < l.girls ? "female" : "male";
      const as = l.word[sex === "female" ? 0 : 1];
      const age = lo + Math.floor(r("apprentice-age") * (hi - lo + 3));
      const served = Math.floor(r("apprentice-in") * Math.min(l.term ?? Infinity, age - lo + 1));
      residents.push({ as, toHead: "master", fromHead: "apprentice", age, sex, role: "Apprentice" });
      history.push({ year: at(Y - served), kind: "joined", as });
    }
  }
  if (!o.shared && o.means < 0.4 && !o.small && r("lodger") < 0.15)
    residents.push({
      as: "lodger",
      toHead: "co-resident",
      fromHead: "co-resident",
      age: 16 + Math.floor(r("lodger-age") * 30),
    });
  if (o.extended && !residents.length)
    residents.push({
      as: "mother",
      toHead: "child",
      fromHead: "parent",
      age: a + 22,
      sex: "female",
      role: "Elder",
    });

  // How they came by the house. A lot older than the householder was their
  // parents'; one put up after the wedding was theirs.
  const settled = unionYear ?? born + 18;
  if (o.built >= settled - 1 && r("built") < 0.7)
    history.push({ year: o.built, kind: "built" });
  else if (o.built < born + 18 && r("inherit") < 0.7)
    history.push({
      year: at(born + 18 + r("inherit-at") * Math.max(0, a - 18)),
      kind: "inherited",
      as: r("from") < 0.75 ? "father" : "mother",
    });
  else
    history.push({
      year: at(Math.max(o.built, settled) + r("moved-at") * 4),
      kind: "moved",
    });
  let weatherFrom = o.built;
  const standing = Y - o.built;
  if (
    standing > 8 &&
    r("fire") < { timber: 0.14, earth: 0.07, masonry: 0.04 }[o.fabric]
  ) {
    weatherFrom = at(o.built + 3 + r("fire-at") * (standing - 3));
    history.push({ year: weatherFrom, kind: "fire" });
    fortune -= 0.08;
  }
  const turns = Math.floor(r("turns") * 3);
  for (let i = 0; i < turns; i++) {
    const good = r("turn", i) < 0.45;
    history.push({
      year: at(Y - 1 - r("turn-at", i) * Math.min(20, a - 18)),
      kind: good ? "good-year" : "bad-year",
    });
    fortune += good ? 0.1 : -0.12;
  }
  history.sort((p, q) => p.year - q.year);
  return {
    residents: o.small ? residents.slice(0, 2) : residents,
    history,
    infants,
    nurse,
    fortune: clamp(fortune, 0.02),
    weatherFrom,
  };
}
