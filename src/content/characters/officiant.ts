import { beliefsFor } from "../beliefs/index";
import { officiantsBySystem } from "../beliefs/officiants.generated";
import type { Officiant } from "../beliefs/types";
import type { WorldSetting } from "../geography/types";
import { random } from "../../core/random";
import type { Livelihood } from "./context-types";

/*
 * Turning one livelihood row into the religious office a place actually has.
 *
 * The belief systems already name who officiates and rank every power they
 * attend, so a priest need not be a generic "priest": in Egypt they serve
 * Amun-Ra, in Lutheran Germany they are a minister, in the Andes a curaca.
 *
 * Rarity is the point of the tiers. A settlement full of high priests would be
 * as wrong as a settlement with no shrine at all, so the household and local
 * offices are common and the paramount one is close to unique.
 */

/** Who officiates here, if anyone does. */
export function officiantsFor(s: WorldSetting): readonly Officiant[] {
  return officiantsBySystem[beliefsFor(s).id] ?? [];
}

/*
 * Offices that do not take a dedication. A dedication to a named power is how
 * a polytheistic temple cult works -- a priest of Amun-Ra serves Amun-Ra and
 * not Osiris -- and it is meaningless in a religion with one god, where the
 * office is simply the parish priest. These are the offices of those.
 */
const UNDEDICATED =
  /parish|minister|pastor|missionary|catechist|imam|rabbi|qadi|qazi|marabout|pir|monk|nun|bhikkhu|granthi|abbot|monastic|priest of the church|clergy|sexton/i;

/** A settlement this size can support an office of at most this standing. */
const NEEDS_SETTLEMENT: Record<Officiant["tier"], number> = {
  household: 0,
  local: 0,
  // A village has a shrine and someone who keeps it; requiring a town left
  // whole regions with no religious role at all.
  temple: 0,
  // The one office a polity has: a high priesthood, a pontifical college.
  paramount: 2,
};
const SIZE: Record<string, number> = { camp: 0, village: 1, town: 1, city: 2, port: 2 };

export function officiantFor(
  s: WorldSetting,
  seed: string,
  id: string,
): { label: string; tier: Officiant["tier"] } | undefined {
  const system = beliefsFor(s);
  const all = officiantsBySystem[system.id];
  if (!all?.length) return undefined;
  const size = SIZE[s.settlement ?? "village"] ?? 1;
  // The household tier is what every household head does at their own hearth,
  // not a living: it belongs to domestic practice, not to the work table.
  const open = all.filter(
    (o) => o.tier !== "household" && NEEDS_SETTLEMENT[o.tier] <= size,
  );
  if (!open.length) return undefined;
  const total = open.reduce((n, o) => n + o.weight, 0);
  let roll = random(seed, "character-v1", id, "officiant") * total;
  const chosen = open.find((o) => (roll -= o.weight) < 0) ?? open[open.length - 1];
  // Name the office for the power it attends, where it attends a particular
  // one. A household elder tends whoever the household tends; a temple priest
  // serves a named god, and that is the whole point of the title.
  const powers = system.powers.filter(
    (p) =>
      p.rank === chosen.serves &&
      // A reconstructed name carries an asterisk and a concept carries an
      // article; "Priest of *Ilma" and "Priest of The market" both read as
      // mistakes, so only a plainly named power takes a dedication.
      !/^the\b/i.test(p.name),
  );
  // A pantheon is what gets divided between priesthoods, so a handful of
  // powers at this rank is the test -- except at the top, where there is
  // usually exactly one and serving it is the whole office.
  const enough = chosen.serves === "paramount" ? 1 : 2;
  if (!chosen.serves || UNDEDICATED.test(chosen.label) || powers.length < enough)
    return { label: chosen.label, tier: chosen.tier };
  const power = powers[Math.floor(random(seed, "character-v1", id, "power") * powers.length)];
  // The asterisk marks a reconstructed form for the reader of a glossary; in
  // a person's title it just looks like a typo.
  return {
    label: `${chosen.label} of ${power.name.replace(/^\*/, "")}`,
    tier: chosen.tier,
  };
}

/** Replace a belief-driven row with the office this place actually has. */
export function asOfficiant(
  l: Livelihood,
  s: WorldSetting,
  seed: string,
  id: string,
): Livelihood | undefined {
  if (!l.fromBeliefs) return l;
  const office = officiantFor(s, seed, id);
  return office ? { ...l, label: office.label } : undefined;
}
