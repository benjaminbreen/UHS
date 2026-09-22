import type { Actor } from "../types";
import type { WorldSetting } from "../../content/geography/types";
import { generateCharacter } from "../../content/characters/generate";
import { random } from "../random";
import { settingAt } from "./setting";
export type Relative = {
  id: string;
  generation: number;
  parentId: string;
  born: number;
  died: number;
  name: string;
  role: string;
  character: ReturnType<typeof generateCharacter>;
};
export type Lineage = {
  seed: string;
  originYear: number;
  originBirth: number;
  setting: WorldSetting;
  members: Map<number, Relative>;
};
export function createLineage(
  seed: string,
  setting: WorldSetting,
  player: Actor,
): Lineage {
  const born = setting.year - (player.age ?? 34);
  const character = generateCharacter(
    setting,
    seed,
    "line:0",
    player.age ?? 34,
    player.role,
    player.name,
  );
  Object.assign(character, {
    name: player.name,
    appearance: player.appearance ?? character.appearance,
    origin: player.origin ?? character.origin,
    inventory: player.inventory,
    worn: player.worn ?? character.worn,
  });
  return {
    seed,
    setting,
    originYear: setting.year,
    originBirth: born,
    members: new Map([
      [
        0,
        {
          id: "line:0",
          generation: 0,
          parentId: "line:-1",
          born,
          died: Math.max(setting.year + 1, born + 65),
          name: player.name,
          role: player.role,
          character,
        },
      ],
    ]),
  };
}
function gap(line: Lineage, generation: number) {
  return 23 + Math.floor(random(line.seed, "lineage-gap", generation) * 10);
}
export function relative(line: Lineage, generation: number): Relative {
  const old = line.members.get(generation);
  if (old) return old;
  const neighbor = relative(
    line,
    generation > 0 ? generation - 1 : generation + 1,
  );
  const born =
    generation > 0
      ? neighbor.born + gap(line, generation - 1)
      : neighbor.born - gap(line, generation);
  const s = settingAt(
    line.setting,
    Math.max(-1000000, Math.min(10000, born + 30)),
  );
  const character = generateCharacter(s, line.seed, `line:${generation}`, 30);
  const member = {
    id: `line:${generation}`,
    generation,
    parentId: `line:${generation - 1}`,
    born,
    died:
      born +
      58 +
      Math.floor(random(line.seed, "lineage-life", generation) * 24),
    name: character.name,
    role: character.role,
    character,
  };
  line.members.set(generation, member);
  return member;
}
export function personAt(line: Lineage, year: number) {
  let generation = 0;
  while (relative(line, generation).born + 18 > year) generation--;
  while (relative(line, generation + 1).born + 18 <= year) generation++;
  // Keep the starting person during the overlapping adult years of their child.
  const original = relative(line, 0);
  if (
    year >= original.born + 18 &&
    year < original.died &&
    Math.abs(year - line.originYear) < 24
  )
    return original;
  return relative(line, generation);
}
export function relationship(from: Relative, to: Relative) {
  const gap = to.generation - from.generation;
  if (!gap) return "the same person, at another age";
  if (gap === 1) return `child of ${from.name}`;
  if (gap === -1) return `parent of ${from.name}`;
  if (gap === 2) return `grandchild of ${from.name}`;
  if (gap === -2) return `grandparent of ${from.name}`;
  return `${Math.abs(gap)} generations ${gap > 0 ? "after" : "before"} ${from.name}, in the direct family line`;
}
export function lineBetween(line: Lineage, a: number, b: number) {
  return Array.from({ length: Math.abs(b - a) + 1 }, (_, i) =>
    relative(line, Math.min(a, b) + i),
  );
}
