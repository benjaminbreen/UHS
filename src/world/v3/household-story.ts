import { random } from "../../core/random";
import type { Sex } from "../../core/brief";
import type { Fabric } from "../../core/time/structure";
import type { HouseholdEvent, SocialRelation } from "../../core/types";

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
  /** Work done at a bench, which takes an apprentice. */
  craft: boolean;
  player: boolean;
  modern: boolean;
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
    children = 0;
  let wed: number | undefined;

  if (o.shared) {
    const n = 1 + Math.floor(r("lodgers") * 3);
    for (let i = 0; i < n; i++)
      residents.push({
        as: "lodger",
        toHead: "co-resident",
        fromHead: "co-resident",
        age: 18 + Math.floor(r("lodger", i) * 30),
      });
  } else if (o.player || r("wed") < (a < 25 ? 0.5 : 0.9)) {
    wed = at(born + 17 + Math.floor(r("wed-age") * 9));
    // Men married younger women; a woman heading the house is often a widow
    // who married an older man.
    const older = (n: number) => (o.sex === "female" ? n : -n);
    const unions: {
      from: number;
      to: number;
      partnerAge: number;
      alive: boolean;
    }[] = [];
    const widowed =
      !o.player &&
      Y - wed > 2 &&
      r("widowed") < clamp((a - 30) / 70) * (o.modern ? 0.4 : 1);
    const end = widowed ? at(wed + 1 + r("died") * (Y - wed - 1)) : Y;
    unions.push({
      from: wed,
      to: end,
      partnerAge: a + older(1 + Math.floor(r("gap") * 5)),
      alive: !widowed,
    });
    history.push({ year: wed, kind: "wed", as: spouse(other) });
    if (widowed) {
      history.push({ year: end, kind: "died", as: spouse(other) });
      fortune -= 0.12;
      if (a < 52 && Y - end >= 2 && r("remarry") < 0.5) {
        const again = at(end + 1 + r("again") * Math.min(3, Y - end - 1));
        unions.push({
          from: again,
          to: Y,
          partnerAge: a + older(-2 - Math.floor(r("gap2") * 8)),
          alive: true,
        });
        history.push({ year: again, kind: "wed", as: spouse(other) });
      }
    }
    const living = unions.find((u) => u.alive);
    if (living)
      residents.push({
        as: spouse(other),
        toHead: "partner",
        fromHead: "partner",
        age: Math.max(16, living.partnerAge),
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
          continue;
        }
        const grown = age >= 15 && r("left", ui, t) < clamp((age - 14) / 8);
        if (grown || children >= 4 || (o.small && age >= 12)) {
          history.push({
            year: at(t + 14 + r("left-at", ui, t) * Math.max(0, age - 14)),
            kind: "left",
            as,
          });
          continue;
        }
        children++;
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
  }
  if (!o.shared && a < 50 && r("elder") < (o.extended ? 0.6 : 0.15)) {
    // Widows outlived their husbands, so the parent taken in is mostly a mother.
    const sex: Sex = r("elder-sex") < 0.7 ? "female" : "male";
    residents.push({
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
      as: sex === "female" ? "mother" : "father",
    });
  }
  if (o.means >= 0.6 && r("servant") < o.means - 0.15) {
    residents.push({
      as: "servant",
      toHead: "master",
      fromHead: "servant",
      age: 13 + Math.floor(r("servant-age") * 18),
      role: "Servant",
    });
    history.push({ year: at(Y - r("servant-in") * 6), kind: "joined", as: "servant" });
  }
  if (o.craft && !o.small && r("apprentice") < 0.4) {
    residents.push({
      as: "apprentice",
      toHead: "master",
      fromHead: "apprentice",
      age: 12 + Math.floor(r("apprentice-age") * 8),
      role: "Apprentice",
    });
    history.push({ year: at(Y - r("apprentice-in") * 5), kind: "joined", as: "apprentice" });
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
  const settled = wed ?? born + 18;
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
    fortune: clamp(fortune, 0.02),
    weatherFrom,
  };
}
