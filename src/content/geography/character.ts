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
export function populateCharacter(
  setting: WorldSetting,
  seed: string,
): WorldSetting {
  setting = { ...setting, characterRevision: 1 };
  const generated = generateCharacter(
    setting,
    seed,
    "player",
    34,
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
        }
      : {
          appearanceSeed: seed,
          hunger: 5 + Math.floor(pick("hunger") * 15),
          fatigue: Math.floor(pick("fatigue") * 8),
        },
  };
}
