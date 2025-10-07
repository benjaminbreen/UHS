# Zone Display System

## Overview

The UI now displays geographically accurate zone names while maintaining the underlying cultural zone system unchanged. This provides players with better geographic clarity without requiring infrastructure changes.

## What Changed

### Display-Only Mapping
- **Southeast Asian regions** now display as "Southeast Asia" instead of "South Asia"
- **Australian regions** now display as "Australia" instead of "Oceania"
- **Antarctic regions** now display as "Antarctica" instead of "Oceania"
- **Central Asian regions** now display as "Central Asia" instead of "East Asia"
- **Mesoamerican regions** now display as "Mesoamerica" instead of "North America"
- The underlying `CulturalZone` type remains unchanged (`SOUTH_ASIAN`, `OCEANIA`, `EAST_ASIAN`, etc.)

### Implementation

**New Utility**: `utils/zoneDisplayUtils.ts`
- `getDisplayZone(zone: string, region: string): string` - Maps zone + region to display name

**Updated Components**:
- `LeftSidebar.tsx` - Main zone display in game info panel
- `FactionsModal.tsx` - Zone display in factions modal header

## Examples

### Southeast Asia
**Region**: "Mekong River Basin" or "Central Java"
**Internal Zone**: "South Asia" (uses SOUTH_ASIAN cultural data)
**Display**: "Southeast Asia" ✨

### Australia
**Region**: "Kimberley" or "Great Barrier Reef"
**Internal Zone**: "Oceania" (uses OCEANIA cultural data)
**Display**: "Australia" ✨

### Antarctica
**Region**: "Antarctic Peninsula" or "Ross Sea"
**Internal Zone**: "Oceania" (uses OCEANIA cultural data - no indigenous population)
**Display**: "Antarctica" ✨

### Central Asia
**Region**: "Samarkand Region" or "Ferghana Valley"
**Internal Zone**: "East Asia" (uses EAST_ASIAN cultural data, or MENA/MONGOLIAN via mapping)
**Display**: "Central Asia" ✨

### Mesoamerica
**Region**: "Valley of Mexico" or "Yucatán Peninsula"
**Internal Zone**: "North America" (uses MESOAMERICAN cultural data pre-1519)
**Display**: "Mesoamerica" ✨

### Unchanged Zones
**Region**: "Bengal Delta" or "Punjab Plains"
**Internal Zone**: "South Asia"
**Display**: "South Asia" (no change)

**Region**: "Sichuan Basin" or "Yellow River Valley"
**Internal Zone**: "East Asia"
**Display**: "East Asia" (no change)

**Region**: "Hudson Bay" or "Great Plains"
**Internal Zone**: "North America"
**Display**: "North America" (no change)

## Regions Mapped

### Southeast Asia (displays instead of South Asia):
- **Direct Names**: Southeast Asia, Southeast Asian, Indochina (covers Indochina Interior and similar region names)
- **Mainland**: Vietnam, Thailand, Cambodia, Laos, Myanmar/Burma, Mekong, Red River, Irrawaddy, Tenasserim, Shan Plateau, Malay Peninsula, Annam, Pagan, Ayutthaya, Angkor
- **Maritime**: Strait of Malacca, Sumatra, Java, Borneo, Sulawesi/Celebes, Spice Islands, Banda Sea, Makassar, Sunda Strait
- **Philippines**: Manila, Luzon, Visayan, Mindanao, Palawan, Sulu

### Australia (displays instead of Oceania):
- Blue Mountains, Gippsland, Murray River, Victorian Alps, Snowy Mountains
- Alice Springs, MacDonnell Ranges, Lake Eyre, Simpson Desert, Uluru, Barkly Tableland
- Cape York, Great Barrier Reef, Daintree, Gulf of Carpentaria, Arnhem Land, Torres Strait
- Pilbara, Kimberley, Great Sandy Desert, Nullarbor Plain, Swan Coastal Plain, Goldfields
- Queensland, Tasmania
- Any region containing "Australia", "Australian", "Outback", "Aboriginal"

### Antarctica (displays instead of Oceania):
- Antarctic Peninsula
- Ross Sea, Weddell Sea
- Marie Byrd Land, Queen Maud Land
- South Pole
- Any region containing "Antarctic", "Antarctica", "Polar"

### Central Asia (displays instead of East Asia):
- **Kazakh Steppes**: Kazakh Steppes, Altai Mountains, Aral Sea Basin, Tian Shan Range, Dzungarian Basin
- **Silk Road Oases**: Samarkand Region, Bukhara, Khiva, Tashkent, Ferghana Valley, Transoxiana
- **Mountain Regions**: Pamir Mountains, Hindu Kush, Kunlun Mountains
- **Deserts**: Kyzylkum Desert, Khorasan
- **Historic Names**: Balkh Plains (ancient Bactria), Amu Darya, Syr Darya
- Any region containing "Kazakh", "Uzbek", "Turkmen", "Kyrgyz", "Tajik", "Silk Road"

### Mesoamerica (displays instead of North America):
- **Central Mexico**: Valley of Mexico, Lake Texcoco Basin, Oaxaca Highlands, Sierra Madre Oriental
- **Southern Mexico**: Yucatán Peninsula, Isthmus of Tehuantepec, Chiapas, Tabasco, Veracruz, Puebla
- **Mayan Regions**: Mayan Lowlands, Yucatán Peninsula
- **Central America**: Guatemala, Belize, El Salvador, Honduras (western portions)
- **Cultural Terms**: Aztec, Maya, Zapotec, Mixtec, Olmec, Toltec, Tenochtitlan
- **Excluded**: Baja California, Sinaloa, Sonora, Chihuahua (northern Mexico - not Mesoamerican)

## Why This Approach?

**Pros**:
- ✅ Geographic accuracy for players
- ✅ No infrastructure changes needed
- ✅ Existing cultural data, generators, and content all work unchanged
- ✅ Simple 60-line utility function
- ✅ Easy to extend with new mappings

**Avoided Complexity**:
- ❌ No new CulturalZone enum values needed
- ❌ No need to duplicate character data (names, clothing, accessories)
- ❌ No primary source reorganization required
- ❌ No changes to 229 files that reference CulturalZone

## Future Extensions

To add more display zones, simply add region patterns to `zoneDisplayUtils.ts`:

```typescript
// Example: Display "Polynesia" for specific island regions
if (zone === 'Oceania') {
  const polynesianRegions = ['samoa', 'tonga', 'tahiti', 'hawaii', 'easter island'];
  for (const polyRegion of polynesianRegions) {
    if (lowerRegion.includes(polyRegion)) {
      return 'Polynesia';
    }
  }
}
```

## Technical Notes

- The display mapping is purely cosmetic - all game logic uses the original zone values
- Cultural generators, architectural styles, NPCs, and items continue to use the underlying cultural zone system
- The mapping is case-insensitive and uses substring matching for flexibility
