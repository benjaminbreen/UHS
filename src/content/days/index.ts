import { generalOccasions } from "./general";
import { romanFestivals, romanOccasions } from "./rome";
import { europeFestivals, europeOccasions } from "./europe";
import { asiaFestivals, asiaOccasions } from "./asia";
import { marketOccasions } from "./markets";
import { deepAndModernOccasions } from "./deep-and-modern";
import { southAsiaFestivals, southAsiaOccasions } from "./south-asia";
import { eastAsiaFestivals, eastAsiaOccasions } from "./east-asia";
import { southeastAsiaPacificFestivals, southeastAsiaPacificOccasions } from "./southeast-asia-pacific";
import { innerEurasiaFestivals, innerEurasiaOccasions } from "./inner-eurasia";
import { westAsiaFestivals, westAsiaOccasions } from "./west-asia";
import { egyptNorthAfricaFestivals, egyptNorthAfricaOccasions } from "./egypt-north-africa";
import { mesoamericaAndesFestivals, mesoamericaAndesOccasions } from "./mesoamerica-andes";
import { americasFestivals, americasOccasions } from "./americas";
import { europeDeepFestivals, europeDeepOccasions } from "./europe-deep";
import { africaFestivals, africaOccasions } from "./africa";
import type { Festival, Occasion } from "./types";

export const occasions: readonly Occasion[] = [
  ...generalOccasions,
  ...romanOccasions,
  ...europeOccasions,
  ...asiaOccasions,
  ...marketOccasions,
  ...deepAndModernOccasions,
  ...southAsiaOccasions,
  ...eastAsiaOccasions,
  ...southeastAsiaPacificOccasions,
  ...innerEurasiaOccasions,
  ...westAsiaOccasions,
  ...egyptNorthAfricaOccasions,
  ...mesoamericaAndesOccasions,
  ...americasOccasions,
  ...europeDeepOccasions,
  ...africaOccasions,
];
export const festivals: readonly Festival[] = [
  ...romanFestivals,
  ...europeFestivals,
  ...asiaFestivals,
  ...southAsiaFestivals,
  ...eastAsiaFestivals,
  ...southeastAsiaPacificFestivals,
  ...innerEurasiaFestivals,
  ...westAsiaFestivals,
  ...egyptNorthAfricaFestivals,
  ...mesoamericaAndesFestivals,
  ...americasFestivals,
  ...europeDeepFestivals,
  ...africaFestivals,
];
