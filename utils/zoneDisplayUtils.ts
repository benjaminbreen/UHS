/**
 * utils/zoneDisplayUtils.ts
 * Maps geographic regions to appropriate display zone names for the UI
 * This provides geographic accuracy in the UI without requiring infrastructure changes
 */

/**
 * Gets the display-friendly zone name for a given zone and region
 * This allows us to show "Southeast Asia", "Australia", "Central Asia", "Mesoamerica" in the UI
 * while still using the underlying cultural zones (SOUTH_ASIAN, OCEANIA, EAST_ASIAN, etc.)
 */
export function getDisplayZone(zone: string, region: string): string {
  const lowerRegion = region.toLowerCase();

  // Southeast Asian regions - display as "Southeast Asia" instead of "South Asia"
  const southeastAsianRegions = [
    'southeast asia', 'southeast asian', 'indochina',  // Direct matches for region names
    'vietnam', 'thailand', 'cambodia', 'laos', 'myanmar', 'burma',
    'mekong', 'red river', 'irrawaddy', 'tenasserim', 'shan plateau',
    'malay peninsula', 'annam', 'annamite', 'pagan', 'ayutthaya', 'angkor',
    'strait of malacca', 'sumatra', 'java', 'borneo', 'sulawesi', 'celebes',
    'spice islands', 'banda sea', 'makassar', 'sunda strait',
    'philippines', 'manila', 'luzon', 'visayan', 'mindanao', 'palawan', 'sulu'
  ];

  if (zone === 'South Asia') {
    for (const seaRegion of southeastAsianRegions) {
      if (lowerRegion.includes(seaRegion)) {
        return 'Southeast Asia';
      }
    }
  }

  // Australian regions - display as "Australia" instead of "Oceania"
  const australianRegions = [
    'australia', 'australian', 'outback', 'sydney', 'melbourne',
    'blue mountains', 'gippsland', 'murray river', 'victorian alps', 'snowy mountains',
    'alice springs', 'macdonnell', 'lake eyre', 'simpson desert', 'uluru', 'barkly',
    'cape york', 'great barrier reef', 'daintree', 'carpentaria', 'arnhem', 'torres strait',
    'pilbara', 'kimberley', 'great sandy', 'nullarbor', 'swan coastal', 'goldfields',
    'queensland', 'tasmania', 'aboriginal'
  ];

  if (zone === 'Oceania') {
    for (const ausRegion of australianRegions) {
      if (lowerRegion.includes(ausRegion)) {
        return 'Australia';
      }
    }
  }

  // Central Asian regions - display as "Central Asia" instead of "East Asia"
  const centralAsianRegions = [
    'central asia', 'central asian',  // Direct matches for region names like "Central Asian Oases"
    'kazakh', 'altai', 'aral sea', 'tian shan', 'dzungarian',
    'khorasan', 'transoxiana', 'kyzylkum', 'ferghana', 'samarkand',
    'balkh', 'pamir', 'hindu kush', 'bukhara', 'khiva', 'tashkent',
    'silk road', 'amu darya', 'syr darya', 'uzbek', 'turkmen', 'kyrgyz', 'tajik'
  ];

  if (zone === 'East Asia') {
    for (const caRegion of centralAsianRegions) {
      if (lowerRegion.includes(caRegion)) {
        return 'Central Asia';
      }
    }
  }

  // Antarctic/Polar regions - display as "Antarctica" instead of "Oceania"
  const antarcticRegions = [
    'antarctic', 'antarctica', 'south pole', 'ross sea', 'weddell sea',
    'antarctic peninsula', 'marie byrd', 'queen maud', 'polar'
  ];

  if (zone === 'Oceania') {
    for (const polarRegion of antarcticRegions) {
      if (lowerRegion.includes(polarRegion)) {
        return 'Antarctica';
      }
    }
  }

  // Mesoamerican regions - display as "Mesoamerica" instead of "North America"
  const mesoamericanRegions = [
    'valley of mexico', 'mexico', 'oaxaca', 'yucatán', 'yucatan', 'maya',
    'mayan', 'aztec', 'tenochtitlan', 'texcoco', 'tehuantepec',
    'sierra madre oriental', 'central highlands', 'zapotec', 'mixtec',
    'olmec', 'toltec', 'tabasco', 'chiapas', 'veracruz', 'puebla',
    'guatemala', 'belize', 'el salvador', 'honduras' // Central America portions
  ];

  // Exclude northern/coastal Mexico regions that aren't culturally Mesoamerican
  const notMesoamerican = ['baja', 'sinaloa', 'sonora', 'chihuahua'];

  if (zone === 'North America') {
    // Check if it's NOT a northern/coastal region
    let isNorthern = false;
    for (const northRegion of notMesoamerican) {
      if (lowerRegion.includes(northRegion)) {
        isNorthern = true;
        break;
      }
    }

    // If not northern, check if it's Mesoamerican
    if (!isNorthern) {
      for (const mesoRegion of mesoamericanRegions) {
        if (lowerRegion.includes(mesoRegion)) {
          return 'Mesoamerica';
        }
      }
    }
  }

  // Default: return the zone as-is
  return zone;
}
