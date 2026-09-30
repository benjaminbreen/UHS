import { inventedName } from "./invented-name";
import { random } from "../../core/random";
import {
  bodyFromPhysique,
  generateAppearance,
  type CharacterAppearance,
} from "../../core/character";
import type { Inventory } from "../../core/types";
import type { Livelihood, Rank } from "./context-types";
import type { WorldSetting } from "../geography/types";
import {
  characterCommunity,
  characterStanding,
  resolveCharacterContext,
  type CharacterContext,
} from "./resolve";
import { asOfficiant } from "./officiant";
import {
  generateAdornment,
  metalForMeans,
  pickBeard,
} from "../../core/character";
import { wornFromWearing } from "../../core/wearing";
import { accessoryFor, clothFor, rolesFrom, wardrobeFor } from "./wardrobe";
import { pickHair } from "../../core/character";
import type { CharacterPhysique } from "../../core/character";

export type Sex = CharacterPhysique["sex"];
export const characterSex = (seed: string, id: string): Sex =>
  random(seed, "character-v1", id, "sex") < 0.5 ? "female" : "male";

const pick = <T>(
  values: readonly T[],
  seed: string,
  id: string,
  purpose: string,
): T =>
  values[Math.floor(random(seed, "character-v1", id, purpose) * values.length)];
/** Titles the tables do not carry, and the local work nearest each, best
 * first. The curated starts ask for these; unmatched, they drew at random. */
const kin: Record<string, string[]> = {
  featherworker: ["craftsperson", "carver"],
  player: ["musician", "storyteller"],
  librarian: ["scribe", "clerk"],
  "silk merchant": ["trader", "market-seller", "shopkeeper", "pedlar"],
  "court poet": ["storyteller", "scribe", "musician"],
  tilemaker: ["brickmaker", "potter"],
  "manuscript copyist": ["scribe", "clerk"],
  glassblower: ["craftsperson", "potter"],
  "coffee seller": ["hawker", "street-vendor", "market-seller", "innkeeper"],
  shaman: ["religious-specialist", "healer"],
  "wild-grain harvester": ["gatherer", "forager"],
  painter: ["painter-and-decorator", "craftsperson", "carver"],
  "miniature painter": ["craftsperson", "scribe"],
  navigator: ["sailor", "boatman", "fisher"],
  "bronze caster": ["smith", "blacksmith"],
};

/** The local work closest to a title the tables do not list by that name:
 * "Stonemason" is a mason here, "Head cook" a cook. Longest match wins. */
function nearest(key: string, kits: readonly Livelihood[]) {
  const words = key.replace(/[^a-z ]/g, " ");
  return kits
    .map((l) => ({ l, name: l.label.toLowerCase() }))
    .filter(({ name }) => name.length >= 4 && (words.endsWith(name) || new RegExp(`\\b${name}\\b`).test(words)))
    .sort((a, b) => b.name.length - a.name.length)[0]?.l;
}

export function characterNameParts(
  s: WorldSetting,
  seed: string,
  id: string,
  context = resolveCharacterContext(s),
  inheritedFamilies?: readonly string[],
  sex: Sex = characterSex(seed, id),
  inheritedTradition?: string,
) {
  const drawn = context.traditions;
  if (!drawn) {
    const personal = inventedName(seed, id);
    return {
      display: personal,
      personal,
      families: [] as string[],
      format: "invented",
    };
  }
  const total = drawn.options.reduce((n, o) => n + o.weight, 0);
  let roll = random(seed, "character-v1", id, "tradition") * total;
  // A household shares one tradition: inheriting a surname from a parent who
  // drew a different tradition would put a Chinese surname on a Swedish name.
  const tradition =
    (inheritedTradition
      ? drawn.options.find((o) => o.tradition.id === inheritedTradition)
          ?.tradition
      : undefined) ??
    (
      drawn.options.find((o) => (roll -= o.weight) < 0) ??
      drawn.options[drawn.options.length - 1]
    ).tradition;
  // A tradition may document one gender only; fall back to the whole set.
  const gendered = [
    ...(sex === "female" ? tradition.feminine : tradition.masculine),
    ...(tradition.unisex ?? []),
  ];
  const personal = pick(
    gendered.length
      ? gendered
      : [...tradition.masculine, ...tradition.feminine],
    seed,
    id,
    "name",
  );
  const provenance = {
    tradition: tradition.id,
    region: drawn.region,
    note: tradition.note,
  };
  if (tradition.format === "personal-patronymic" && tradition.patronymic) {
    // Named for a parent, so the element is that parent's name plus a
    // suffix for this person's sex, and is never inherited further.
    const parent = pick(
      tradition.patronymic.parents ?? tradition.masculine,
      seed,
      id,
      "parent-name",
    );
    const suffix = tradition.patronymic[sex === "female" ? "female" : "male"];
    return {
      display: `${personal} ${parent}${suffix}`,
      personal,
      families: [] as string[],
      format: "personal-patronymic",
      ...provenance,
    };
  }
  const inherited = inheritedFamilies?.[0];
  // A hereditary family name is an invention with a date, and most of these
  // pools carry one for a period long before their people did.
  const surnamed =
    tradition.familyNamesFrom === undefined ||
    s.year >= tradition.familyNamesFrom;
  const family =
    inherited ??
    (surnamed &&
    tradition.familyNames.length &&
    random(seed, "character-v1", id, "has-family-name") >=
      tradition.noFamilyName
      ? pick(tradition.familyNames, seed, id, "family-name")
      : undefined);
  const families = family ? [family] : [];
  if (family && tradition.format === "personal-two-families")
    families.push(
      inheritedFamilies?.[1] ??
        pick(
          tradition.secondFamilyNames ?? tradition.familyNames,
          seed,
          id,
          "second-family-name",
        ),
    );
  return {
    display: (tradition.format === "family-personal"
      ? [...families, personal]
      : [personal, ...families]
    ).join(" "),
    personal,
    families,
    format: family ? tradition.format : "personal",
    ...provenance,
  };
}
export function characterName(
  s: WorldSetting,
  seed: string,
  id: string,
  context = resolveCharacterContext(s),
) {
  return characterNameParts(s, seed, id, context).display;
}

/*
 * Work marked unfree is only for those held in bondage. The reverse is not
 * true: enslaved and bound people did every kind of work there was, so the
 * marked rows bias the draw rather than bounding it -- treating them as the
 * whole of an unfree person's world left a sugar island with no craft, no
 * herding and no trade in it. What is closed to them is the work that
 * presumes standing of its own: holding an office, keeping a shop, being
 * retained in arms.
 */
const CLOSED_TO_UNFREE =
  /^(guild-master|headman|village-elder|tax-collector|toll-keeper|money-changer|shopkeeper|grocer|innkeeper|publican|retainer|clerk|bank-clerk|schoolteacher|printer|pharmacist|stationmaster|trader)$/;
const allowedBy = (standing: "free" | "unfree", l: Livelihood) =>
  standing === "unfree"
    ? l.standing === "unfree" || !CLOSED_TO_UNFREE.test(l.id)
    : l.standing !== "unfree";

export function characterLivelihood(
  s: WorldSetting,
  seed: string,
  id: string,
  requested?: string,
  context = resolveCharacterContext(s),
  sex: Sex = "unspecified",
  standing: "free" | "unfree" = "free",
) {
  const alias: Record<string, string> = {
    forager: "gatherer",
    weaver: "craftsperson",
    carpenter: "craftsperson",
    toolmaker: "craftsperson",
    merchant: "trader",
    shepherd: "herder",
    resident: "gatherer",
    wanderer: "traveler",
    visitor: "traveler",
  };
  // The exact work first, and only then the alias. These aliases were written
  // when eight kits covered everything, so they map a weaver to a generic
  // craftsperson; now that the tables name a weaver, asking for one and being
  // handed a craftsperson is a downgrade, not a substitution.
  const key = requested?.toLowerCase();
  const localRole = (l: Livelihood) => asOfficiant(l, s, seed, id);
  const apprentice = context.livelihoods.find((l) => l.id === "apprentice");
  const tradeFor = (label: string) => context.livelihoods.find((l) =>
    l.id !== "apprentice" && l.label.toLowerCase() === label.toLowerCase() &&
    allowedBy(standing, l) && (sex === "unspecified" || !l.sex || l.sex === sex)
  );
  const resolveApprentice = (l: Livelihood) => {
    if (l.id !== "apprentice") return l;
    const trade = l.label.startsWith("Apprentice ")
      ? tradeFor(l.label.slice("Apprentice ".length))
      : undefined;
    return trade
      ? { ...l, activity: trade.activity, workplace: trade.workplace }
      : { ...l, label: "Apprentice" };
  };
  if (key?.startsWith("apprentice ") && apprentice && allowedBy(standing, apprentice)) {
    const trade = tradeFor(requested!.slice("Apprentice ".length));
    if (trade)
      return resolveApprentice({ ...apprentice, label: requested! });
  }
  const named = key
    ? (context.livelihoods.find((l) => l.id === key) ??
      context.livelihoods.find((l) => l.label.toLowerCase() === key) ??
      context.livelihoods.find(
        (l) => localRole(l)?.label.toLowerCase() === key,
      ) ??
      (alias[key]
        ? context.livelihoods.find((l) => l.id === alias[key])
        : undefined) ??
      kin[key]?.map((k) => context.livelihoods.find((l) => l.id === k)).find(Boolean) ??
      nearest(key, context.livelihoods))
    : undefined;
  // A request still has to pass the filters a drawn role passes, and a
  // religious office still takes its title from what people here believe.
  if (named && allowedBy(standing, named)) {
    const resolved = localRole(named);
    if (resolved) return resolveApprentice(resolved);
  }
  // A few kinds of work were done overwhelmingly by one sex; the rest are open.
  // "unspecified" is no constraint rather than no match -- read as a constraint
  // it excluded all 62 sex-marked roles, which is every herding role there is,
  // so no settlement could staff a pen.
  const open =
    sex === "unspecified"
      ? context.livelihoods
      : context.livelihoods.filter((l) => !l.sex || l.sex === sex);
  /* Work marked unfree is only for those held in bondage. The reverse is not
   * true: enslaved and bound people did every kind of work there was, so the
   * marked rows bias the draw rather than bounding it -- treating them as the
   * whole of an unfree person's world left a sugar island with no craft, no
   * herding and no trade in it. Work that presumes standing of its own, and
   * the offices, are the exception. */
  const byStanding = (open.length ? open : context.livelihoods).flatMap((l) =>
    !allowedBy(standing, l)
      ? []
      : standing === "unfree" && l.standing === "unfree"
        ? [{ ...l, weight: (l.weight ?? 1) * 4 }]
        : [l],
  );
  // A society whose record does not name an officiant offers no religious
  // office at all, rather than a generic priest.
  const withBeliefs = (byStanding.length ? byStanding : open).flatMap(
    (l) => {
      const resolved = asOfficiant(l, s, seed, id);
      return resolved ? [resolved] : [];
    },
  );
  const pool = withBeliefs.length ? withBeliefs : context.livelihoods;
  // Drawn by share, not evenly. Uniformly, twelve adults held ten different
  // trades: one of everything and two of nothing, and nobody growing food.
  const total = pool.reduce((n, l) => n + (l.weight ?? 1), 0);
  let roll = random(seed, "character-v1", id, "livelihood") * total;
  return resolveApprentice(pool.find((l) => (roll -= l.weight ?? 1) < 0) ?? pool[pool.length - 1]);
}
export function eligibleInventory(
  inventory: Inventory,
  context: CharacterContext,
): Inventory {
  return Object.fromEntries(
    Object.entries(inventory).filter(([key]) =>
      context.profile.allowedItems.includes(key as keyof Inventory),
    ),
  );
}
export function characterAppearance(
  s: WorldSetting,
  seed: string,
  id: string,
  age = 34,
  context = resolveCharacterContext(s),
  sex: Sex = characterSex(seed, id),
  rank?: Rank,
): CharacterAppearance {
  const labouring = rank === "labouring" || rank === "destitute";
  const a = generateAppearance(`${seed}:character-v1:${id}`, 0, age, { sex });
  // Hard work and short commons thin a body; a full table widens it.
  if (rank && a.physique) {
    a.physique.mass = Math.max(
      0,
      Math.min(
        100,
        (a.physique.mass ?? 50) +
          {
            destitute: -25,
            labouring: -10,
            middling: 0,
            gentry: 10,
            elite: 18,
          }[rank],
      ),
    );
    Object.assign(
      a,
      bodyFromPhysique(
        a.physique,
        age,
        random(seed, "character-v1", id, "body-shape"),
      ),
    );
  }
  const kit = context.appearance;
  a.skin = pick(kit.skin, seed, id, "skin");
  // The face follows the kit for the same reason skin and hair do: these are
  // population frequencies, never rules. Every form still occurs everywhere.
  if (a.face)
    a.face = {
      ...a.face,
      eyelid: kit.eyelids
        ? pick(kit.eyelids, seed, id, "eyelid")
        : a.face.eyelid,
      epicanthus:
        kit.epicanthicFold === undefined
          ? a.face.epicanthus
          : random(seed, "character-v1", id, "epicanthus") <
            kit.epicanthicFold,
      hairTexture: kit.hairTextures
        ? pick(kit.hairTextures, seed, id, "hair-texture")
        : a.face.hairTexture,
      noseBridge: kit.noseBridges
        ? pick(kit.noseBridges, seed, id, "nose-bridge")
        : a.face.noseBridge,
      mouth: kit.mouths ? pick(kit.mouths, seed, id, "mouth") : a.face.mouth,
    };
  if (kit.heads) a.head = pick(kit.heads, seed, id, "head");
  // Ornaments and marks come from the kit, so they are regional rather than a
  // worldwide sprinkle. A kit that names none gets none.
  a.adornment = generateAdornment(
    `${seed}:character-v1:${id}`,
    0,
    age,
    sex,
    kit.adornment ?? { ears: ["none", "none", "none", "stud"] },
  );
  // Re-roll the beard against the kit's density, not against the base roll:
  // filtering the base result would compound the two and leave almost every
  // man clean-shaven. The sex and age gate is the same one the base applies.
  if (a.physique?.sex === "male" && age >= 16)
    a.beard = pickBeard(
      random(seed, "character-v1", id, "beard"),
      kit.facialHair,
    );
  a.hairColor =
    age >= 60 && random(seed, "character-v1", id, "grey") < 0.5
      ? "#aaa699"
      : pick(kit.hairColors, seed, id, "hair-color");
  a.hair = pickHair(
    random(seed, "character-v1", id, "hair"),
    random(seed, "character-v1", id, "balding"),
    sex,
    age,
    kit.hairStyles,
    { scale: kit.hairScale, labouring },
  );
  const garment = pick(kit.garments, seed, id, "garment");
  // Generic ornaments and headwear must not leak out of the unrestricted art lab.
  a.wearing = {
    ...a.wearing,
    garment,
    sleeves:
      garment === "wrap" ? "none" : garment === "coat" ? "long" : "short",
    hem: "plain",
    shoulderCloth: false,
    cloak: false,
    headwear: "none",
    necklace: false,
    earrings: false,
  };
  return a;
}
export function generateCharacter(
  s: WorldSetting,
  seed: string,
  id: string,
  age = 34,
  requestedRole?: string,
  explicitName?: string,
  inheritedFamilies?: readonly string[],
  sex: Sex = characterSex(seed, id),
  inheritedTradition?: string,
) {
  // Where a plural population is authored, each person draws their own
  // community, so the appearance palette and the naming kit stay in step.
  const community = characterCommunity(s, seed, id);
  const context = resolveCharacterContext(s, community);
  const standing = characterStanding(s, seed, id, community);
  const naming = characterNameParts(
    s,
    seed,
    id,
    context,
    inheritedFamilies,
    sex,
    inheritedTradition,
  );
  const livelihood = characterLivelihood(
    s,
    seed,
    id,
    requestedRole,
    context,
    sex,
    standing,
  );
  const recognized =
    !requestedRole ||
    livelihood.label.toLowerCase() === requestedRole.toLowerCase() ||
    requestedRole.toLowerCase().startsWith("apprentice ") ||
    context.livelihoods.some(
      (l) =>
        l.label.toLowerCase() === requestedRole.toLowerCase() ||
        asOfficiant(l, s, seed, id)?.label.toLowerCase() ===
          requestedRole.toLowerCase(),
    ) ||
    [
      "forager",
      "weaver",
      "carpenter",
      "toolmaker",
      "merchant",
      "shepherd",
      "resident",
      "wanderer",
      "visitor",
      "household member",
    ].includes(requestedRole.toLowerCase());
  const role = recognized ? livelihood.label : requestedRole!;
  const appearance = characterAppearance(
    s,
    seed,
    id,
    age,
    context,
    sex,
    livelihood.rank,
  );
  appearance.wearing = wardrobeFor({
    id, age, sex, livelihood: livelihood.id, roles: rolesFrom(requestedRole, role),
  }, { year: s.year, setting: s }, appearance.wearing);
  const cloth = clothFor(
    {
      id,
      age,
      sex,
      livelihood: livelihood.id,
      roles: rolesFrom(requestedRole, role),
    },
    { year: s.year, setting: s },
    undefined,
    appearance.wearing.color,
  );
  // Ornament follows the cloth. Someone in a worn shift wearing gold was the
  // one thing that made the whole ornament pass read as decoration.
  if (appearance.adornment)
    appearance.adornment = {
      ...appearance.adornment,
      metal: metalForMeans(
        context.appearance.adornment?.metals,
        appearance.adornment.metal ?? "gold",
        cloth.quality,
        seed,
        id,
      ),
    };
  const accessory = accessoryFor({ id, age, sex, livelihood: livelihood.id, roles: rolesFrom(requestedRole, role) },
    { year: s.year, setting: s }, appearance.wearing.garment);
  const inventory: Inventory = eligibleInventory(livelihood.inventory, context);
  if (/hunter|archer|bowman/i.test(livelihood.label)) Object.assign(inventory, { bow: 1, arrow: 12 });
  else if (/shepherd|herd|slinger/i.test(livelihood.label)) Object.assign(inventory, { sling: 1, pebble: 8 });
  if (accessory) inventory[accessory] = 1;
  return {
    ...(accessory && { heldItem: accessory }),
    name: explicitName || naming.display,
    role,
    inventory,
    appearance,
    worn: wornFromWearing(appearance.wearing, cloth),
    origin: {
      revision: 1 as const,
      profile: context.profile.id,
      community: context.community,
      nameKit: context.names?.id,
      nameTradition: "tradition" in naming ? naming.tradition : undefined,
      nameRegion: "region" in naming ? naming.region : undefined,
      sex,
      standing,
      nameFormat:
        explicitName && explicitName !== naming.display
          ? "custom"
          : naming.format,
      nameFamilies:
        explicitName && explicitName !== naming.display ? [] : naming.families,
      livelihood: livelihood.id,
      roleLabel: livelihood.label,
      specialty: livelihood.id === "apprentice" && livelihood.label.startsWith("Apprentice ")
        ? context.livelihoods.find((l) => l.label.toLowerCase() === livelihood.label.slice("Apprentice ".length).toLowerCase())?.id
        : undefined,
      notes: [
        ...context.notes,
        ...("note" in naming && naming.note ? [naming.note] : []),
        ...(!recognized
          ? [
              `${role} is a requested scenario label; specialized mechanics are not implemented. Supplies use the ${livelihood.label.toLowerCase()} kit.`,
            ]
          : []),
        "Generated individual. Palette frequencies and inventory quantities are authored gameplay choices.",
      ],
    },
  };
}
