import { HistoricalEra } from '../../types';

export const AMBIANCE_HISTORICAL_ERA_FRAGMENTS: Record<HistoricalEra, string[]> = {
  [HistoricalEra.PREHISTORY]: [
    "The land feels ancient and untouched by complex civilization.",
    "Echoes of a primal world linger in the air.",
    "Nature reigns supreme in this distant past.",
  ],
  [HistoricalEra.ANTIQUITY]: [
    "Whispers of old empires and classical learning seem to drift on the wind.",
    "The world is ordered by ancient laws and philosophies.",
    "Monuments of a bygone golden age may lie hidden nearby.",
  ],
  [HistoricalEra.MEDIEVAL]: [
    "A feudal order shapes the lives of people here.",
    "The air carries tales of knights, castles, and burgeoning towns.",
    "Faith and tradition are strong pillars of this era.",
  ],
  [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
    "An age of discovery and artistic rebirth is dawning or in full swing.",
    "New ideas and burgeoning trade routes connect distant lands.",
    "The world is expanding, both intellectually and geographically.",
  ],
  [HistoricalEra.INDUSTRIAL_ERA]: [
    "The rumble of machinery and the scent of coal smoke mark the era.",
    "Great factories and iron behemoths transform the landscape.",
    "Society is rapidly changing with new technologies.",
  ],
  [HistoricalEra.MODERN_ERA]: [
    "The world is interconnected by rapid communication and transport.",
    "The echoes of global conflicts and technological leaps are recent.",
  ],
  [HistoricalEra.FUTURE_ERA]: [
    "Signs of advanced technology are subtly or overtly present.",
    "The world feels sleek, perhaps a little strange.",
    "What wonders or perils does this future hold?",
  ],
};