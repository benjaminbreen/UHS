import { nameKits as westernNameKits } from "./profiles/names";
import { burmeseNameKits } from "./profiles/burmese-names";
import { structuredNameKits } from "./profiles/structured-names";
import { anchorNameKits } from "./profiles/anchor-names";

/** Assembly only: naming traditions remain in scoped subject/regional files. */
export const nameKits = [
  ...westernNameKits,
  ...burmeseNameKits,
  ...structuredNameKits,
  ...anchorNameKits,
];
