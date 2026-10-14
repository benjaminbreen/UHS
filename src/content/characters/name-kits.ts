import { naplesNameKits, richerNaplesNameKits } from "./profiles/naples-names";
import { nameKits as westernNameKits, richerNameKits as richerWesternNameKits } from "./profiles/names";
import { burmeseNameKits } from "./profiles/burmese-names";
import { structuredNameKits } from "./profiles/structured-names";
import { anchorNameKits } from "./profiles/anchor-names";

/** Assembly only: naming traditions remain in scoped subject/regional files. */
export const nameKits = [
  ...naplesNameKits,
  ...westernNameKits,
  ...burmeseNameKits,
  ...structuredNameKits,
  ...anchorNameKits,
];

export const richerNameKits = [
  ...richerNaplesNameKits,
  ...richerWesternNameKits,
  ...burmeseNameKits,
  ...structuredNameKits,
  ...anchorNameKits,
];
