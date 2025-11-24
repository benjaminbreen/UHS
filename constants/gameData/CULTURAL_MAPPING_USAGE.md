# Cultural Item Mapping System - Usage Guide

## Overview

The cultural item mapping system provides culturally-appropriate and historically-accurate item names for the work offer system (and other game systems).

## Location

`constants/gameData/culturalItemMapping.ts`

## Core Functions

### `getCulturalItem(genericItem, culturalZone, era?)`

Converts generic item names to culture-specific variants.

```typescript
import { getCulturalItem } from './constants/gameData/culturalItemMapping';

// Example: Getting culturally-appropriate grain
const grain = getCulturalItem('grain', 'EAST_ASIAN');
// Returns: 'rice'

const grain2 = getCulturalItem('grain', 'EUROPEAN');
// Returns: 'wheat'

const grain3 = getCulturalItem('grain', 'MENA');
// Returns: 'barley'
```

### `getItemHistoricalContext(itemName)`

Gets educational historical context for items.

```typescript
const context = getItemHistoricalContext('silk');
// Returns: "Prized throughout Eurasia, silk was so valuable..."
```

### `isItemAvailableInEra(itemName, era)`

Checks if an item exists in a given historical period.

```typescript
const hasPaper = isItemAvailableInEra('paper', HistoricalEra.ANTIQUITY);
// Returns: false (paper wasn't widely available until Medieval era)
```

## Integration with Work Offers

### Example: Culturally-Aware Work Offer Template

```typescript
import { getCulturalItem, getItemHistoricalContext } from '../constants/gameData/culturalItemMapping';
import { CulturalZone } from '../types/characterData';
import { HistoricalEra } from '../types/enums';

interface WorkOfferContext {
  culturalZone: CulturalZone;
  era: HistoricalEra;
  npcProfession: string;
}

function generateDeliveryWorkOffer(context: WorkOfferContext) {
  // Get culturally-appropriate grain type
  const grainType = getCulturalItem('grain', context.culturalZone, context.era);

  // Get appropriate cloth type
  const clothType = getCulturalItem('cloth', context.culturalZone);

  // Get historical context for flavor text
  const clothContext = getItemHistoricalContext(clothType);

  return {
    id: `work_${Date.now()}`,
    type: 'delivery',
    title: `Deliver ${grainType} to the mill`,
    description: `The miller needs a delivery of ${grainType}. Can you help?`,
    reward: {
      currency: 50,
      items: [clothType] // Reward with culturally-appropriate cloth
    },
    educationalNote: clothContext // Optional historical context
  };
}

// Usage:
const offer = generateDeliveryWorkOffer({
  culturalZone: 'EAST_ASIAN',
  era: HistoricalEra.MEDIEVAL,
  npcProfession: 'Miller'
});
// Produces: "Deliver rice to the mill" with silk cloth reward
```

## Available Item Categories

### Food & Agriculture
- `grain` - Staple grains (wheat, rice, barley, maize, etc.)
- `meat` - Common meat sources
- `oil` - Cooking oils and fats
- `sweetener` - Sweetening agents
- `spice` - Flavor enhancers
- `preserved_fish` - Preserved seafood
- `medicine` - Healing herbs and remedies

### Materials & Crafts
- `cloth` - Textile materials
- `rope` - Cordage materials
- `dye` - Coloring agents
- `building_material` - Construction materials
- `fuel` - Heating/cooking fuel
- `tool_handle` - Tool construction material
- `writing_material` - Recording mediums
- `incense` - Aromatic materials

### Trade Goods
- `alcohol` - Alcoholic beverages (regionally appropriate)

## Era-Gated Items

Some items didn't exist in earlier eras. The system automatically provides alternatives:

```typescript
// In Antiquity era
getCulturalItem('paper', 'EUROPEAN', HistoricalEra.ANTIQUITY);
// Returns: 'papyrus' (paper not yet widely available)

// In Medieval era
getCulturalItem('paper', 'EAST_ASIAN', HistoricalEra.MEDIEVAL);
// Returns: 'paper' (available in this era and culture)
```

## Future Enhancements

### Phase 2: Enhanced Work Offer Templates
- Use cultural items in work offer generation
- Add historical context to work offer descriptions
- Create era-appropriate task types

### Phase 3: Educational Integration
- Display historical context in tooltips
- Track which historical items player has encountered
- Add journal entries about discovered trade goods

## Testing

To test the cultural mapping:

```typescript
import { getCulturalItem } from './constants/gameData/culturalItemMapping';
import { CulturalZone } from './types/characterData';

// Test all cultures for grain
Object.values(CulturalZone).forEach(zone => {
  console.log(`${zone}: ${getCulturalItem('grain', zone)}`);
});

// Expected output:
// EUROPEAN: wheat
// EAST_ASIAN: rice
// SOUTH_ASIAN: rice
// MENA: barley
// SUB_SAHARAN_AFRICAN: millet
// NORTH_AMERICAN_PRE_COLUMBIAN: maize
// NORTH_AMERICAN_COLONIAL: wheat
// SOUTH_AMERICAN: maize
// OCEANIA: taro
```
