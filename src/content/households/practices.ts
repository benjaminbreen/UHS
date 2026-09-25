import { matchesCharacterScope } from "../characters/resolve";
import type { CharacterScope } from "../characters/context-types";
import type { WorldSetting } from "../geography/types";

type MarriagePractice = {
  scope: CharacterScope;
  minimumMeans: number;
  evidence: "inferred";
  source: string;
};

const marriagePractices: MarriagePractice[] = [
  {
    scope: { years: [0, 300], places: ["rome", "umbria"] },
    minimumMeans: 0,
    evidence: "inferred",
    source: "https://www.metmuseum.org/zh/-/media/files/learn/for-educators/publications-for-educators/roman.pdf",
  },
  {
    scope: { years: [1400, 1600], places: ["city-florence"] },
    minimumMeans: 0.6,
    evidence: "inferred",
    source: "https://resources.metmuseum.org/resources/metpublications/pdf/The_Art_of_Renaissance_Europe_A_Resource_for_Educators.pdf",
  },
];

export function marriagePracticeFor(setting?: WorldSetting) {
  return setting && marriagePractices.find((practice) =>
    matchesCharacterScope(practice.scope, setting)
  );
}
