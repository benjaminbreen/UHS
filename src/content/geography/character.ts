import { characterName, generateCharacter } from "../characters/generate";
import type { WorldSetting } from "./types";
import { random } from "../../core/random";
import { packForSetting } from "./pack";

// Small reusable name kits; the setting keeps the chosen result for replay.
const italian = [
  "Luca",
  "Matteo",
  "Giovanni",
  "Antonio",
  "Francesco",
  "Piero",
  "Lorenzo",
  "Andrea",
];
const english = [
  "Thomas",
  "William",
  "John",
  "Alice",
  "Joan",
  "Margaret",
  "Robert",
  "Agnes",
];
const french = [
  "Jeanne",
  "Pierre",
  "Marguerite",
  "Guillaume",
  "Martin",
  "Alix",
  "Isabelle",
  "Jean",
];
export function proceduralName(
  setting: WorldSetting,
  seed: string,
  key = "name",
) {
  if (setting.characterRevision) return characterName(setting, seed, key);
  const names =
    setting.culture === "european" &&
    setting.year >= 500 &&
    setting.lon > 7 &&
    setting.lon < 19 &&
    setting.lat > 36 &&
    setting.lat < 47
      ? italian
      : setting.placeId === "london"
        ? english
        : setting.placeId === "normandy" && setting.year >= 500
          ? french
          : packForSetting(setting).names;
  return names[
    Math.floor(
      random(seed, "starting-character", setting.placeId, setting.year, key) *
        names.length,
    )
  ];
}
/* Adult ages as a pre-industrial life table leaves them: Gompertz-Makeham
 * mortality from 18, about 40% of adults living to 60. An even draw from 18 to
 * 65 made almost half of all players over 45. */
const adultAges = (() => {
  const survival: number[] = [];
  let hazard = 0;
  for (let age = 18; age <= 75; age++) {
    survival.push(Math.exp(-hazard));
    hazard += 0.008 + 0.0026 * Math.exp(0.07 * (age - 18));
  }
  const total = survival.reduce((a, b) => a + b, 0);
  let sum = 0;
  return survival.map((s) => (sum += s / total));
})();
const adultAge = (roll: number) => 18 + adultAges.findIndex((c) => roll < c);

export function populateCharacter(
  setting: WorldSetting,
  seed: string,
): WorldSetting {
  setting = {
    ...setting,
    characterRevision: setting.characterRevision ?? 1,
    worksiteRevision: setting.worksiteRevision ?? 7,
    friendshipRevision: setting.friendshipRevision ?? 1,
    employmentRevision: setting.employmentRevision ?? 1,
    beliefRevision: setting.beliefRevision ?? 1,
    namingRevision: setting.namingRevision ?? 1,
    lifeStoryRevision: 1,
  };
  const roll = random(seed, "starting-character", setting.placeId, setting.year, "age");
  const characterSeed = setting.character?.appearanceSeed ?? seed;
  const firstAge = setting.character?.age ?? adultAge(roll);
  const first = generateCharacter(setting, characterSeed, "player", firstAge, setting.role);
  const age = setting.character?.age ?? (first.origin.livelihood === "apprentice"
    ? 18 + Math.floor(roll * 10)
    : first.origin.livelihood === "guild-master"
      ? 30 + Math.floor(roll * 36)
      : firstAge);
  const generated = generateCharacter(
    setting,
    characterSeed,
    "player",
    age,
    setting.role,
  );
  const pick = (key: string) =>
    random(seed, "starting-character", setting.placeId, setting.year, key);
  return {
    ...setting,
    role: generated.role,
    characterName:
      setting.characterName === "Traveler" ||
      setting.characterName === setting.role
        ? generated.name
        : setting.characterName,
    character: setting.character
      ? {
          ...setting.character,
          appearanceSeed: setting.character.appearanceSeed ?? seed,
          age,
        }
      : {
          appearanceSeed: seed,
          hunger: 5 + Math.floor(pick("hunger") * 15),
          fatigue: Math.floor(pick("fatigue") * 8),
          age,
        },
  };
}
