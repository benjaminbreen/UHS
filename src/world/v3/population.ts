import { resolveCharacterContext } from "../../content/characters/resolve";
import {
  characterSex,
  generateCharacter,
} from "../../content/characters/generate";
import type {
  Actor,
  Household,
  WorldModel,
  WorldObject,
} from "../../core/types";
import type { SettlementPlan } from "./types";
import { random } from "../../core/random";
import { livelihoodOf, memberRoutine, routineFor } from "./routines";
import { ecologyProfiles } from "../../content/ecology/profiles";
const seasons = ["spring", "summer", "autumn", "winter"];
/** Small explicit household patterns, not a universal nuclear-family assumption. */
export function populateHouseholds(
  world: WorldModel,
  plan: SettlementPlan,
  seed: string,
) {
  const pack = plan.site.pack ?? world.pack;
  const form = pack.setting!.environment!.household;
  for (const [owner, sites] of plan.work) {
    if (world.households!.some((h) => h.members.includes(owner))) continue;
    const place = plan.places.find((p) => p.owner === owner)!;
    if (!place) continue;
    const store = plan.objects.find(
      (o) =>
        o.owner === owner &&
        o.kind === "container" &&
        o.pos.space === "outside",
    );
    if (!store) continue;
    const id = `household-${owner}`,
      adult = plan.actors.find((a) => a.id === owner);
    const age =
      owner === "player" ? 34 : 28 + Math.floor(random(seed, id, "age") * 18);
    const household: Household = {
      id,
      members: [owner],
      residence: place.id,
      home: { ...sites.home, space: "outside" },
      storeId: store.id,
    };
    world.households!.push(household);
    if (adult)
      Object.assign(adult, {
        age,
        householdId: id,
        relations: [],
        knownResources: [],
      });
    if (adult && pack.setting?.characterRevision)
      Object.assign(
        adult,
        generateCharacter(pack.setting, seed, adult.id, age, adult.role),
      );
    // world.initialActors shares these objects with the completed plan.
    const roll = random(seed, id, "form");
    const shared = form === "shared" || (form === "mixed" && roll < 0.4);
    // A settlement of one household form keeps it; the mixed default is
    // sampled, because a legible street wants a few people out on visible
    // errands rather than every resident stood in their own yard.
    const size = random(seed, id, "size");
    const count =
      owner === "player" || form === "extended" || form === "shared"
        ? 2
        : size < 0.45
          ? 0
          : size < 0.85
            ? 1
            : 2;
    for (let i = 0; i < count; i++) {
      const memberId = `${owner}-member-${i}`;
      const kin = random(seed, memberId, "kin");
      const child = !shared && (i > 0 ? kin < 0.7 : kin < 0.3);
      const elder = !shared && !child && i === 0 && kin > 0.85;
      const relation = child
        ? "parent"
        : elder
          ? "child"
          : shared
            ? "co-resident"
            : "partner";
      const a: Actor = {
        id: memberId,
        name: pack.names[
          Math.floor(random(seed, memberId, "name") * pack.names.length)
        ],
        role: child ? "Child" : elder ? "Elder" : "Householder",
        kind: "human",
        pos: { ...sites.home, space: "outside" },
        home: { ...sites.home, space: "outside" },
        work: { ...sites.work, space: "outside" },
        sprite: `human-${i % 3}-${(i + 2) % 6}`,
        inventory: { water: 1 },
        hunger: 8,
        fatigue: 0,
        activity: "At home",
        trust: 1,
        memories: [],
        direction: 2,
        age: child
          ? 6 +
            Math.floor(
              random(seed, memberId, "age") *
                Math.max(1, Math.min(8, age - 26)),
            )
          : elder
            ? age + 22
            : age - 2,
        householdId: id,
        relations: [{ other: owner, kind: relation }],
        knownResources: [],
      };
      if (pack.setting?.characterRevision) {
        const naming = resolveCharacterContext(pack.setting).names;
        const parent =
          adult?.origin ??
          (owner === "player"
            ? generateCharacter(
                pack.setting,
                seed,
                owner,
                age,
                pack.role,
                pack.characterName,
              ).origin
            : undefined);
        const partner = world.initialActors.find(
          (other) =>
            other.householdId === id &&
            other.relations?.some(
              (r) => r.other === owner && r.kind === "partner",
            ),
        );
        const inherited =
          child && naming?.format === "family-personal"
            ? parent?.nameFamilies
            : child &&
                naming?.format === "personal-two-families" &&
                parent?.nameFamilies?.[0] &&
                partner?.origin?.nameFamilies?.[0]
              ? [parent.nameFamilies[0], partner.origin.nameFamilies[0]]
              : undefined;
        // A partner is drawn opposite the householder; everyone else is free.
        const sex =
          relation === "partner"
            ? characterSex(seed, owner) === "female"
              ? "male"
              : "female"
            : characterSex(seed, memberId);
        Object.assign(
          a,
          generateCharacter(
            pack.setting,
            seed,
            memberId,
            a.age,
            // Adults in a household hold their own work; only children do not.
            child ? "Child" : undefined,
            undefined,
            inherited,
            sex,
          ),
        );
        if (child) {
          a.role = "Child";
          a.inventory = { water: 1 };
        }
      }
      for (let r = 1; r < 6; r++) {
        let found = false;
        for (const [dx, dy] of [
          [r, 0],
          [-r, 0],
          [0, r],
          [0, -r],
        ]) {
          const p = { ...a.pos, x: a.pos.x + dx, y: a.pos.y + dy };
          if (
            !world.blocked(p.x, p.y, "outside") &&
            !world.initialActors.some(
              (b) =>
                b.pos.x === p.x && b.pos.y === p.y && b.pos.space === p.space,
            )
          ) {
            a.pos = p;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      household.members.push(memberId);
      world.initialActors.push(a);
      // Members get a routine of their own so a household spreads across the
      // settlement during the day instead of stacking on one doorstep.
      const kit = livelihoodOf(pack, a);
      const memberSite = {
        ...sites,
        label: child ? "Errands" : (kit?.activity ?? "Keeping house"),
        offset: (sites.offset + 37 * (i + 1)) % 1440,
      };
      plan.work.set(memberId, memberSite);
      plan.stations.set(
        memberId,
        kit && !child
          ? routineFor(plan, seed, pack, memberId, memberSite, a)
          : memberRoutine(plan, seed, memberId, sites.home, pack.year, child),
      );
      if (child) {
        const partner = world.initialActors.find(
          (b) =>
            b.householdId === id &&
            b.relations?.some((r) => r.other === owner && r.kind === "partner"),
        );
        if (partner) {
          a.relations!.push({ other: partner.id, kind: "parent" });
          partner.relations!.push({ other: a.id, kind: "child" });
        }
      }
      adult?.relations?.push({
        other: memberId,
        kind: child
          ? "child"
          : elder
            ? "parent"
            : shared
              ? "co-resident"
              : "partner",
      });
    }
  }
}
const populated = new WeakMap<WorldModel, Set<string>>();
export function addWildResources(
  world: WorldModel,
  seed: string,
  x: number,
  y: number,
) {
  let done = populated.get(world);
  if (!done) {
    done = new Set();
    populated.set(world, done);
  }
  const gx = Math.floor(x / 64),
    gy = Math.floor(y / 64);
  for (let cy = gy - 1; cy <= gy + 1; cy++)
    for (let cx = gx - 1; cx <= gx + 1; cx++) {
      const k = `${cx},${cy}`;
      if (done.has(k)) continue;
      done.add(k);
      for (let iy = 0; iy < 4; iy++)
        for (let ix = 0; ix < 4; ix++) {
          const px =
              cx * 64 +
              ix * 16 +
              3 +
              Math.floor(random(seed, k, ix, iy, "rx") * 9),
            py =
              cy * 64 +
              iy * 16 +
              3 +
              Math.floor(random(seed, k, ix, iy, "ry") * 9);
          const localPack = world.geography?.packAt(px, py) ?? world.pack;
          const eco = ecologyProfiles[localPack.setting!.environment!.ecology];
          if (
            world.blocked(px, py, "outside") ||
            world.protectedCell?.(px, py) ||
            world.terrain(px, py) === "dirt" ||
            world.places.some(
              (p) => Math.hypot(px - p.entrance.x, py - p.entrance.y) < 8,
            )
          )
            continue;
          if (
            random(seed, k, ix, iy, "present") >
            (localPack.setting!.environment!.ecology === "desert" ? 0.12 : 0.72)
          )
            continue;
          const local = world.topography?.(px, py).biome;
          const resourceSet =
            local && local in ecologyProfiles
              ? ecologyProfiles[local as keyof typeof ecologyProfiles].resources
              : eco.resources;
          const type =
            resourceSet[
              Math.floor(random(seed, k, ix, iy, "type") * resourceSet.length)
            ];
          const item = type === "grazing" ? "fodder" : type;
          const availability =
            localPack.setting!.environment!.ecology === "tropical-woodland"
              ? seasons
              : type === "fruit"
                ? ["summer", "autumn"]
                : type === "berries"
                  ? ["summer", "autumn"]
                  : seasons;
          const available = availability.includes(localPack.setting!.season);
          const sprite =
            type === "fruit"
              ? "ecology-fruit-tree"
              : type === "berries"
                ? "ecology-berry-bush"
                : type === "wood"
                  ? "ecology-branches"
                  : type === "reeds"
                    ? "reeds"
                    : "ecology-grazing";
          const o: WorldObject = {
            id: `resource-${px}-${py}`,
            name:
              type === "fruit"
                ? "Wild fruit tree"
                : type === "berries"
                  ? "Berry patch"
                  : type === "wood"
                    ? "Fallen branches"
                    : type === "reeds"
                      ? "Reed bed"
                      : "Grazing patch",
            kind: "tree",
            pos: { x: px, y: py, space: "outside" },
            sprite,
            inventory: available ? { [item]: 6 } : {},
            depleted: !available,
            resource: {
              item,
              capacity: 6,
              regrowSeconds: type === "wood" ? 86400 : 3 * 86400,
              seasons: availability,
              readyAt: 0,
            },
          };
          world.initialObjects.push(o);
        }
    }
}
