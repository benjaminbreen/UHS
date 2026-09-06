import { definitions } from "./catalog";
import { sources } from "./sources";
import * as playable from "./profiles/playable";
import * as research from "./profiles/research";
import type { Registry } from "./types";
export const historyRegistry: Registry = {
  version: 1,
  definitions,
  sources,
  places: [...playable.places, ...research.places],
  kits: playable.kits,
  rules: [...playable.rules, ...research.rules],
};
export { resolveHistory, validateRegistry } from "./resolve";
