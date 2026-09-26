import { generalOccasions } from "./general";
import { romanFestivals, romanOccasions } from "./rome";
import { europeFestivals, europeOccasions } from "./europe";
import { asiaFestivals, asiaOccasions } from "./asia";
import { marketOccasions } from "./markets";
import type { Festival, Occasion } from "./types";

export const occasions: readonly Occasion[] = [
  ...generalOccasions,
  ...romanOccasions,
  ...europeOccasions,
  ...asiaOccasions,
  ...marketOccasions,
];
export const festivals: readonly Festival[] = [
  ...romanFestivals,
  ...europeFestivals,
  ...asiaFestivals,
];
