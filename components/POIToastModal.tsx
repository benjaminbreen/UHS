/**
 * components/POIToastModal.tsx - Toast-style modal for POI interactions
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TerrainStructure, Item, HistoricalEra, CulturalZone, ClimateType } from '../types';
import { WorkerDialogue, ServiceOption } from '../services/poiDialogueService';
import { SpecialMapArchetype, SpecialMapConfig } from '../types/specialMapTypes';
import { useUI } from '../contexts/UIContext';
import { usePlayer } from '../contexts/PlayerContext';
import { useMap } from '../contexts/MapContext';
import { ITEM_DEFINITIONS } from '../constants';
import QuarryBanner from './QuarryBanner';
import MineColonyBanner from './MineColonyBanner';
import FortressBanner from './FortressBanner';
import MillBanner from './MillBanner';
import FactoryBanner from './FactoryBanner';
import LumberCampBanner from './LumberCampBanner';
import ProcessingInterface, { ProcessingRecipe } from './ProcessingInterface';
import { getProcessingRecipes, getProcessingDuration } from '../services/poiProcessingService';

const POITypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconMap: Record<string, string> = {
    quarry: '⛏️',
    mine: '⛏️',
    mining_colony: '⛏️',
    mill: '🌾',
    factory: '⚙️',
    fortress: '🛡️',
    woodcutter: '🪓',
    lumber_camp: '🪓'
  };
  
  return (
    <div className="w-8 h-8 text-2xl flex items-center justify-center">
      {iconMap[type] || '🏗️'}
    </div>
  );
};

type POIView = 'main' | 'buy' | 'sell' | 'craft';

// Define what each POI type can sell
const POI_INVENTORY: Record<string, { items: string[], prices: Record<string, number> }> = {
  mill: {
    items: ['FLOUR', 'WHEAT_BREAD', 'BARLEY', 'OATS'],
    prices: { FLOUR: 3, WHEAT_BREAD: 5, BARLEY: 2, OATS: 2 }
  },
  quarry: {
    items: ['STONE_BLOCK', 'LIMESTONE', 'MARBLE', 'SANDSTONE'],
    prices: { STONE_BLOCK: 4, LIMESTONE: 6, MARBLE: 15, SANDSTONE: 5 }
  },
  mine: {
    items: ['IRON_ORE', 'COPPER_ORE', 'COAL', 'SILVER_ORE'],
    prices: { IRON_ORE: 8, COPPER_ORE: 6, COAL: 3, SILVER_ORE: 20 }
  },
  mining_colony: {
    items: ['IRON_ORE', 'COPPER_ORE', 'COAL', 'SILVER_ORE', 'GOLD_ORE'],
    prices: { IRON_ORE: 8, COPPER_ORE: 6, COAL: 3, SILVER_ORE: 20, GOLD_ORE: 50 }
  },
  woodcutter: {
    items: ['WOOD', 'LUMBER', 'CHARCOAL', 'BARK'],
    prices: { WOOD: 2, LUMBER: 4, CHARCOAL: 3, BARK: 1 }
  },
  lumber_camp: {
    items: ['WOOD', 'LUMBER', 'CHARCOAL', 'BARK', 'PLANKS', 'TIMBER'],
    prices: { WOOD: 2, LUMBER: 4, CHARCOAL: 3, BARK: 1, PLANKS: 6, TIMBER: 8 }
  },
  fortress: {
    items: ['IRON_SWORD', 'LEATHER_ARMOR', 'TRAVEL_RATIONS', 'CROSSBOW'],
    prices: { IRON_SWORD: 50, LEATHER_ARMOR: 35, TRAVEL_RATIONS: 8, CROSSBOW: 80 }
  },
  factory: {
    items: ['IRON_TOOLS', 'CLOTH', 'NAILS', 'HORSESHOE'],
    prices: { IRON_TOOLS: 25, CLOTH: 12, NAILS: 6, HORSESHOE: 15 }
  }
};

interface POIToastModalProps {
  onEnterSpecialMap?: (config: SpecialMapConfig) => void;
  mapData?: any;
  currentEra?: HistoricalEra;
  currentCulturalZone?: CulturalZone;
  onDismiss?: (structureId: string) => void;
}

export function POIToastModal({ onEnterSpecialMap, mapData, currentEra, currentCulturalZone, onDismiss }: POIToastModalProps = {}) {
  const { poiToastData, setPoiToastData, showToast } = useUI();
  const { playerCharacter, onBuyItem, onSellItem, onEnterBuilding } = usePlayer();
  const [selectedService, setSelectedService] = useState<string | null>(null);

  // Track current view: main, buy, sell, or processing
  const [currentView, setCurrentView] = useState<'main' | 'buy' | 'sell' | 'processing'>('main');
  const [processingType, setProcessingType] = useState<'mill' | 'sawmill' | 'quarry' | 'mine' | 'factory' | null>(null);

  // Debug logging
  useEffect(() => {
    console.log('POIToastModal: Component mounted/updated with props:', {
      onEnterSpecialMap: !!onEnterSpecialMap,
      mapData: !!mapData,
      currentEra,
      currentCulturalZone
    });
  }, [onEnterSpecialMap, mapData, currentEra, currentCulturalZone]);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [tradeDialogue, setTradeDialogue] = useState<string>('');
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close on ESC key - MUST be before any conditional returns
  useEffect(() => {
    if (!poiToastData) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [poiToastData]);

  // Trigger entrance animation
  useEffect(() => {
    if (poiToastData) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 100);
      return () => clearTimeout(timer);
    }
  }, [poiToastData]);

  const handleClose = () => {
    console.log('POIToastModal: Closing modal');
    const closedStructureId = poiToastData?.structure?.id;
    
    setIsAnimating(true);
    
    // Set a flag that prevents immediate reopening
    if (closedStructureId) {
      window.poiToastManuallyClosedId = closedStructureId;
    }
    
    setTimeout(() => {
      setPoiToastData(null);
      setCurrentView('main'); // Reset view when closing
      setProcessingType(null); // Reset processing type
    }, 300);
  };

  // Simple trade dialogues for each POI type
  const getTradeDialogue = (poiType: string, action: 'buy' | 'sell'): string => {
    const dialogues: Record<string, { buy: string[], sell: string[] }> = {
      quarry: {
        buy: [
          "Good stone here, fresh from the quarry face.",
          "These blocks will serve you well. Solid as the mountain itself.",
          "Quality stone, cut to your specifications.",
          "Best prices for bulk orders, friend."
        ],
        sell: [
          "Let me see what you've got there.",
          "We might have use for that. Fair prices paid.",
          "Always looking for quality materials.",
          "Show me your wares, we'll work out a price."
        ]
      },
      mine: {
        buy: [
          "Fresh from the depths. Still warm from the earth.",
          "Pure ore, ready for the forge.",
          "Careful with that, it's heavier than it looks.",
          "Best quality metal you'll find in these parts."
        ],
        sell: [
          "We buy all kinds of ore and minerals.",
          "That looks promising. Let me weigh it.",
          "The foreman will want to see this.",
          "Good timing, we need raw materials."
        ]
      },
      mill: {
        buy: [
          "Fresh ground this morning. Finest flour you'll find.",
          "Take a pinch, taste the quality yourself.",
          "Ground between stones older than the village.",
          "This batch turned out particularly well."
        ],
        sell: [
          "Bring your grain, we'll grind it fair.",
          "Good harvest? We'll take what you can spare.",
          "The millstones are hungry today.",
          "Fair prices for quality grain."
        ]
      },
      factory: {
        buy: [
          "Fresh off the production line.",
          "Quality guaranteed, or your money back.",
          "These are our finest goods.",
          "Made with precision and care."
        ],
        sell: [
          "We need materials for production.",
          "Always buying scrap and raw materials.",
          "Let's see what you've brought.",
          "The workshop can use everything."
        ]
      },
      fortress: {
        buy: [
          "Military surplus. Still in good condition.",
          "Decommissioned equipment, yours for the right price.",
          "The quartermaster authorized this sale.",
          "Standard issue gear, barely used."
        ],
        sell: [
          "The garrison might have use for this.",
          "Military procurement, official rates.",
          "We buy supplies for the troops.",
          "Always need provisions and equipment."
        ]
      },
      woodcutter: {
        buy: [
          "Seasoned wood, ready for any purpose.",
          "Cut just this week. Still has that fresh smell.",
          "Good burning wood, keeps you warm all night.",
          "Hardwood for building, softwood for burning."
        ],
        sell: [
          "We'll take any timber you've got.",
          "Always need more wood for the pile.",
          "Fair price for fair timber.",
          "The sawmill never rests, bring what you have."
        ]
      },
      lumber_camp: {
        buy: [
          "Premium lumber, processed on-site.",
          "Quality planks and beams, ready for construction.",
          "Fresh-cut timber from the finest trees.",
          "Bulk orders available for large projects."
        ],
        sell: [
          "We buy all grades of timber and logs.",
          "Raw wood or finished lumber, we'll take it.",
          "The camp needs a steady supply of materials.",
          "Good prices for quality timber."
        ]
      },
      mining_colony: {
        buy: [
          "Ore straight from the deep veins.",
          "Quality metals, refined and ready.",
          "Fresh from the mines, tested for purity.",
          "The colony's finest mineral output."
        ],
        sell: [
          "The colony buys all manner of ore and stone.",
          "We need materials for our operations.",
          "Good rates for raw materials and gems.",
          "The mining operation never stops."
        ]
      }
    };

    const defaultDialogues = {
      buy: [
        "Take a look at what we have.",
        "Quality goods at fair prices.",
        "Everything's for sale, for the right price.",
        "What catches your eye?"
      ],
      sell: [
        "Show me what you've got.",
        "We might be interested in that.",
        "Let's see your wares.",
        "Always looking to buy."
      ]
    };

    const structureType = poiToastData?.structure?.type || poiToastData?.structure?.structureType || '';
    const poiDialogues = dialogues[structureType] || defaultDialogues;
    const options = poiDialogues[action];
    
    // Pick a random dialogue
    return options[Math.floor(Math.random() * options.length)];
  };

  const handleBuyClick = () => {
    setCurrentView('buy');
    setTradeDialogue(getTradeDialogue(poiToastData?.structure?.type || poiToastData?.structure?.structureType || '', 'buy'));
  };

  const handleSellClick = () => {
    setCurrentView('sell');
    setTradeDialogue(getTradeDialogue(poiToastData?.structure?.type || poiToastData?.structure?.structureType || '', 'sell'));
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setTradeDialogue(''); // Clear trade dialogue when going back
    setSelectedItem(null);
  };

  const handlePurchaseItem = async (itemBaseId: string) => {
    const structureType = poiToastData?.structure?.type || poiToastData?.structure?.structureType || '';
    const poiData = POI_INVENTORY[structureType];
    
    if (!poiData || !playerCharacter || !onBuyItem) {
      console.error('Missing data for purchase');
      return;
    }

    const price = poiData.prices[itemBaseId];
    if (!price) {
      console.error('No price found for item:', itemBaseId);
      return;
    }

    try {
      await onBuyItem(itemBaseId, price);
      showToast?.(`Purchased ${ITEM_DEFINITIONS[itemBaseId]?.name || itemBaseId} for ${price} coins`);
    } catch (error) {
      console.error('Purchase failed:', error);
      showToast?.('Purchase failed - insufficient funds');
    }
  };

  const getAvailableItems = (): string[] => {
    const structureType = poiToastData?.structure?.type || poiToastData?.structure?.structureType || '';
    return POI_INVENTORY[structureType]?.items || [];
  };

  const getItemPrice = (itemBaseId: string): number => {
    const structureType = poiToastData?.structure?.type || poiToastData?.structure?.structureType || '';
    return POI_INVENTORY[structureType]?.prices[itemBaseId] || 0;
  };

  const getPlayerGold = (): number => {
    return playerCharacter?.currency || 0;
  };

  const getPlayerItems = (): Item[] => {
    return playerCharacter?.inventory || [];
  };

  const handleServiceClick = (service: ServiceOption) => {
    console.log('POIToastModal: Service clicked:', service.id);
    setSelectedService(service.id);
    // Service handling should be done in ModalHub or MapViewport
  };

  // Handle processing operations (milling, sawing, etc.)
  const handleStartProcessing = async (recipe: ProcessingRecipe): Promise<void> => {
    if (!playerCharacter || !onBuyItem) {
      throw new Error('Processing system not available');
    }

    // Deduct cost
    if (playerCharacter.coins < recipe.cost) {
      throw new Error('Not enough coins');
    }

    // Check and consume input items
    for (const input of recipe.inputItems) {
      const hasItem = playerCharacter.inventory?.some(item =>
        (item.baseId === input.itemId || item.name.toLowerCase().includes(input.itemId.toLowerCase())) &&
        (item.quantity || 1) >= input.quantity
      );
      if (!hasItem) {
        throw new Error(`Missing required items: ${input.displayName}`);
      }
    }

    // Process the transaction
    // Note: In a real implementation, this would need to:
    // 1. Remove input items from inventory
    // 2. Deduct coins
    // 3. Add output items to inventory
    // For now, we'll simulate with a success message

    showToast?.(`Processing complete! Created ${recipe.outputItems.map(o => `${o.quantity}x ${o.displayName}`).join(', ')}`);

    // Return to main view after successful processing
    setCurrentView('main');
    setProcessingType(null);
  };

  const handleEnterFortress = () => {
    console.log('=== POIToastModal: handleEnterFortress START ===');
    console.log('POIToastModal: Using BeautifulInteriorMapDisplay system for fortress');
    console.log('POIToastModal: onEnterBuilding type:', typeof onEnterBuilding);
    console.log('POIToastModal: poiToastData:', poiToastData);
    console.log('POIToastModal: mapData exists:', !!mapData);
    
    if (!onEnterBuilding) {
      console.error('POIToastModal: onEnterBuilding is not defined!');
      alert('Cannot enter fortress - interior system not available');
      return;
    }
    
    if (!poiToastData?.structure || !mapData) {
      console.error('POIToastModal: Missing required data for fortress entry:', {
        onEnterBuilding: !!onEnterBuilding,
        structure: !!poiToastData?.structure,
        mapData: !!mapData
      });
      alert('Cannot enter fortress - missing required game data');
      return;
    }

    const structure = poiToastData.structure;
    
    // Create a tile object for the fortress to pass to onEnterBuilding
    const fortressTile = {
      x: structure.x || 0,
      y: structure.y || 0,
      biome: mapData.tiles?.[0]?.[0]?.biome || 'GRASSLAND',
      isLand: true,
      temperature: 20,
      humidity: 50,
      elevation: 0.5,
      structure: {
        id: structure.id,
        type: 'fortress',
        structureType: 'fortress',
        name: structure.name || 'Fortress Commander Chamber',
        subtype: 'commander_chamber'
      }
    };

    console.log('POIToastModal: About to call onEnterBuilding with tile:', fortressTile);
    
    try {
      onEnterBuilding(fortressTile, mapData);
      console.log('POIToastModal: onEnterBuilding called successfully');
      handleClose();
    } catch (error) {
      console.error('POIToastModal: Error calling onEnterBuilding:', error);
      alert('Error entering fortress: ' + error.message);
    }
    
    console.log('=== POIToastModal: handleEnterFortress END ===');
  };

  const getDefaultPOIName = (type: string): string => {
    const names: Record<string, string> = {
      quarry: 'Stone Quarry',
      mine: 'Mining Site',
      mining_colony: 'Mining Colony',
      mill: 'Processing Mill',
      factory: 'Workshop',
      fortress: 'Fortification',
      woodcutter: 'Woodcutter\'s Hut',
      lumber_camp: 'Lumber Camp'
    };
    return names[type] || 'Work Site';
  };

  // Utility for consistent structure type checking
  const getStructureType = (structure: TerrainStructure): string => {
    return structure.structureType || structure.type || 'quarry';
  };

  const getStructureDetail = (structure: TerrainStructure, detail: string): string => {
    switch (detail) {
      case 'workers':
        // Use actual structure data or derive from structure ID for consistency
        const workerCount = structure.workers || 
          (structure.id ? (structure.id.charCodeAt(0) % 5) + 2 : 4);
        return `${workerCount} workers`;
      case 'material':
        // Only return material for quarries and mines
        const structType = getStructureType(structure);
        if (structType !== 'quarry' && structType !== 'mine') {
          return ''; // Don't show material for non-extraction POIs
        }
        
        // Extract material from structure name if possible
        if (structure.name) {
          const nameWords = structure.name.toLowerCase().split(' ');
          const knownMaterials = [
            'sandstone', 'limestone', 'granite', 'marble', 'slate', 'basalt',
            'porphyry', 'obsidian', 'quartzite', 'travertine', 'schist', 'gneiss',
            'shale', 'conglomerate', 'breccia', 'dolomite', 'chert', 'flint',
            'iron', 'copper', 'gold', 'silver', 'coal', 'tin', 'lead', 'zinc',
            'platinum', 'nickel', 'cobalt', 'titanium', 'aluminum', 'mercury'
          ];
          const foundMaterial = knownMaterials.find(material =>
            nameWords.some(word => word.includes(material))
          );
          if (foundMaterial) {
            return foundMaterial.charAt(0).toUpperCase() + foundMaterial.slice(1);
          }
        }
        
        // Fallback to structure type defaults only for quarries and mines
        const materials: Record<string, string[]> = {
          quarry: ['Sandstone', 'Limestone', 'Granite', 'Marble'],
          mine: ['Iron Ore', 'Copper', 'Gold', 'Silver'],
          mining_colony: ['Iron Ore', 'Copper', 'Gold', 'Silver']
        };
        const typeMatls = materials[structType] || ['Stone'];
        // Use structure ID for consistent material selection
        const materialIndex = structure.id ? (structure.id.charCodeAt(0) % typeMatls.length) : 0;
        return typeMatls[materialIndex];
      case 'status':
        return structure.state === 'active' ? 'Active' : 'Operating';
      default:
        return 'Unknown';
    }
  };

  // Check if player has required items in inventory
  const hasInventoryItem = (itemType: string): boolean => {
    if (!playerCharacter?.inventory) return false;

    const itemChecks: Record<string, (itemName: string) => boolean> = {
      stone: (name: string) => name.toLowerCase().includes('stone') && !name.toLowerCase().includes('cut'),
      wood: (name: string) => name.toLowerCase().includes('wood') || name.toLowerCase().includes('log') || name.toLowerCase().includes('timber'),
      grain: (name: string) => name.toLowerCase().includes('grain') || name.toLowerCase().includes('wheat') || name.toLowerCase().includes('barley'),
      ore: (name: string) => name.toLowerCase().includes('ore') || name.toLowerCase().includes('iron') || name.toLowerCase().includes('copper'),
      raw_materials: (name: string) => name.toLowerCase().includes('raw') || name.toLowerCase().includes('uncut') || name.toLowerCase().includes('rough')
    };

    const checkFn = itemChecks[itemType];
    if (!checkFn) return false;

    return playerCharacter.inventory.some(item => checkFn(item.name));
  };

  // Detect appropriate mill type based on structure name, era, and cultural context
  const detectMillType = (structure: TerrainStructure, era?: string, culturalZone?: string): string => {
    const name = (structure.name || '').toLowerCase();
    const year = parseInt(era || '1500');
    const zone = (culturalZone || '').toLowerCase();

    // Check structure name for specific mill types
    if (name.includes('quern') || name.includes('hand')) return 'hand_quern';
    if (name.includes('animal') || name.includes('ox') || name.includes('donkey') || name.includes('horse')) return 'animal_mill';
    if (name.includes('water') || name.includes('river') || name.includes('stream')) return 'water_mill';
    if (name.includes('wind')) return 'windmill';
    if (name.includes('tide') || name.includes('tidal')) return 'tidal_mill';
    if (name.includes('steam')) return 'steam_mill';
    if (name.includes('electric') || name.includes('power')) return 'electric_mill';
    if (name.includes('sugar') || name.includes('cane')) return 'sugar_mill';

    // Cultural zone preferences
    if (zone.includes('north_american_pre_columbian') ||
        zone.includes('south_american') ||
        zone.includes('oceania') ||
        zone.includes('sub_saharan_african')) {
      return 'hand_quern';
    }

    if (zone.includes('east_asian') || zone.includes('south_asian')) {
      return year >= 1850 ? 'electric_mill' : 'water_mill';
    }

    if (zone.includes('mena')) {
      return year >= 1850 ? 'electric_mill' : 'animal_mill';
    }

    // Era-based defaults for European zones
    if (year < 500) return 'hand_quern';
    if (year < 1200) return 'animal_mill';
    if (year < 1500) return 'water_mill';
    if (year < 1800) return 'windmill';
    if (year < 1900) return 'steam_mill';
    return 'electric_mill';
  };

  // Render the appropriate banner component based on POI type
  const renderBanner = (structure: TerrainStructure) => {
    const structureType = getStructureType(structure);

    // Create enhanced structure with material data for better visualization
    const enhancedStructure = {
      ...structure,
      // Pass mineral deposits for mines/quarries if we can detect material
      mineralDeposits: (structureType === 'quarry' || structureType === 'mine' || structureType === 'mining_colony') ?
        { [getStructureDetail(structure, 'material').toLowerCase()]: 100 } :
        structure.mineralDeposits
    };

    const bannerProps = {
      structure: enhancedStructure,
      era: currentEra || mapData?.timeSlice || '1500',
      culturalZone: currentCulturalZone || 'european',
      climate: mapData?.climate || 'temperate' as const,
      season: mapData?.season || 'spring' as const,
      timeOfDay: mapData?.timeOfDay || 'day' as const,
      width: 1000,
      height: 130,
      seed: mapData?.seed || 12345,
      adjacentBiomes: mapData?.adjacentBiomes || ['grassland' as const],
      isRuined: false
    };

    switch (structureType) {
      case 'quarry':
        return <QuarryBanner {...bannerProps} />;
      case 'mine':
      case 'mining_colony':
        return <MineColonyBanner {...bannerProps} />;
      case 'fortress':
        return <FortressBanner {...bannerProps} />;
      case 'mill':
        // Enhanced mill props with type detection
        const millType = detectMillType(structure, currentEra, currentCulturalZone);
        return <MillBanner {...bannerProps} millType={millType} />;
      case 'factory':
        return <FactoryBanner {...bannerProps} />;
      case 'woodcutter':
      case 'lumber_camp':
        return <LumberCampBanner {...bannerProps} />;
      default:
        // Fallback to MillBanner for unknown types
        return <MillBanner {...bannerProps} />;
    }
  };

  // Position styles for bottom-center toast with slide-up animation
  const getPositionStyles = () => {
    const baseTransform = isAnimating ? 'translate-y-full' : 'translate-y-0';
    return `bottom-6 left-1/2 -translate-x-1/2 ${baseTransform}`;
  };

  console.log('POIToastModal render - poiToastData:', poiToastData);
  
  if (!poiToastData) {
    console.log('POIToastModal: No poiToastData, returning null');
    return null;
  }
  
  console.log('POIToastModal: Rendering modal with data:', {
    type: poiToastData.structure?.type,
    name: poiToastData.structure?.name,
    hasDescription: !!poiToastData.description,
    hasDialogue: !!poiToastData.dialogue,
    isMobile
  });

  const structure = poiToastData?.structure;
  const description = poiToastData?.description;
  const dialogue = poiToastData?.dialogue;

  if (!structure) {
    return null;
  }

  return (
    <AnimatePresence>
      {/* Toast positioned at bottom-center, slides up from bottom */}
      <div className={`fixed z-50 ${getPositionStyles()} transition-transform duration-300 ease-out`}>
        <div className={`
          ${isMobile 
            ? 'w-[95vw] max-h-[70vh]' 
            : 'w-[1000px] max-w-[95vw] max-h-[60vh]'
          } 
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-300/50 dark:border-slate-600/50 overflow-hidden
        `}>
          
          {/* POI Banner - Only on desktop */}
          {!isMobile && (
            <div className="relative h-[200px] overflow-hidden rounded-t-2xl">
              {/* SVG Banner Component - Offset to show quarry structure, not sky */}
              <div className="absolute inset-0">
                <div className="w-full h-full relative" style={{ top: '-60px' }}>
                  {renderBanner(structure)}
                </div>
              </div>
              
              {/* Text overlay with gradient background for readability */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 via-black/40 to-transparent" />
              
              {/* Header content overlaid on banner */}
              <div className="absolute bottom-3 left-6 right-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <POITypeIcon type={structure.type || 'quarry'} />
                    <h2 className="text-2xl font-bold text-white drop-shadow-lg">
                      {structure.name || getDefaultPOIName(structure.type || 'quarry')}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">
                      <span className="text-amber-400">👥</span>
                      <span className="text-white">{getStructureDetail(structure, 'workers')}</span>
                    </span>
                    {/* Only show material for quarries and mines */}
                    {(getStructureType(structure) === 'quarry' || getStructureType(structure) === 'mine' || getStructureType(structure) === 'mining_colony') && (
                      <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">
                        <span className="text-blue-400">⛏️</span>
                        <span className="text-white">{getStructureDetail(structure, 'material')}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg text-xs backdrop-blur-sm">
                      <span className="text-green-400">●</span>
                      <span className="text-white">{getStructureDetail(structure, 'status')}</span>
                    </span>
                  </div>
                </div>
              </div>
              
              {/* ESC hint overlaid on banner */}
              <div className="absolute top-3 left-6">
                <span className="text-white/70 text-xs bg-black/40 px-2 py-1 rounded backdrop-blur-sm">
                  Press ESC to leave
                </span>
              </div>
              
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors p-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Content - 2 column layout on desktop, single column on mobile */}
          <div className={`${isMobile ? 'p-4' : 'p-6'} ${isMobile ? 'max-h-[70vh] overflow-y-auto' : ''}`}>
            
            {/* Mobile header (when no banner) */}
            {isMobile && (
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-300/50 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                  <POITypeIcon type={structure.type || 'quarry'} />
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                    {structure.name || getDefaultPOIName(structure.type || 'quarry')}
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className="text-slate-600/70 dark:text-white/70 hover:text-slate-800 dark:hover:text-white transition-colors p-1.5 rounded-full bg-slate-300/50 dark:bg-slate-800/50 hover:bg-slate-400/50 dark:hover:bg-slate-700/50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-2 gap-6'}`}>
              {/* Left Column - Details and Description */}
              <div className="space-y-4">
                
                {/* Description */}
                <div>
                  <p className="text-slate-600 dark:text-gray-300 text-sm leading-relaxed">
                    {description}
                  </p>
                </div>

                {/* Worker Dialogue - Only show in main view */}
                {currentView === 'main' && dialogue && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-700/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-lg">👤</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-amber-300 font-medium text-sm mb-1">
                          {dialogue?.speaker || 'Worker'}
                        </p>
                        <p className="text-gray-300 text-lg italic leading-relaxed">
                          "{dialogue?.greeting || 'Welcome!'}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Trade Dialogue - Show in buy/sell views */}
                {(currentView === 'buy' || currentView === 'sell') && tradeDialogue && (
                  <div className="bg-slate-800/60 rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-700/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-400 text-lg">👤</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-amber-300 font-medium text-sm mb-1">
                          Worker
                        </p>
                        <p className="text-gray-300 text-xs italic leading-relaxed">
                          "{tradeDialogue}"
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Services */}
              <div className="space-y-4">
                {/* Show different content based on current view */}
                {currentView === 'main' && (
                  <>
                    {/* Fortress-specific Actions */}
                    {getStructureType(structure) === 'fortress' && (
                  <div>
                    <h3 className="text-slate-800 dark:text-white font-medium text-sm mb-3">Fortress Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={handleEnterFortress}
                        disabled={!onEnterBuilding}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!onEnterBuilding ? 'Interior system not available' : 'Click to enter fortress'}
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🏛️ Ask to see the Commander {!onEnterBuilding && '(Disabled)'}
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Request an audience with the fortress commander
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          // TODO: Trigger enlistment dialogue
                          showToast?.('Enlistment system coming soon!');
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          ⚔️ Inquire about Enlistment
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Ask about joining the military forces
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          // TODO: Trigger supply trade dialogue
                          showToast?.('Military supply trading coming soon!');
                        }}
                        className="w-full p-3 rounded-lg transition-all text-left bg-slate-700/50 hover:bg-slate-600/60 border border-slate-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          📦 Request Supplies
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Ask for military supplies or provisions
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mill-specific Actions */}
                {getStructureType(structure) === 'mill' && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Mill Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setCurrentView('processing');
                          setProcessingType('mill');
                        }}
                        disabled={!hasInventoryItem('grain')}
                        className={`w-full p-3 rounded-lg transition-all text-left border ${
                          hasInventoryItem('grain')
                            ? 'bg-slate-700/50 hover:bg-slate-600/60 border-slate-600 cursor-pointer'
                            : 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className={`font-medium text-sm mb-1 ${
                          hasInventoryItem('grain') ? 'text-white' : 'text-gray-500'
                        }`}>
                          🌾 Mill Your Grain
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Process raw grain into flour for a fee {!hasInventoryItem('grain') && '(Need grain)'}
                        </div>
                      </button>
                      
                      <button
                        onClick={handleBuyClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-emerald-700/50 hover:bg-emerald-600/60 border border-emerald-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Grain & Flour
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase processed grain products
                        </div>
                      </button>
                      
                      <button
                        onClick={handleSellClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Grain
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade your grain harvest for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Woodcutter-specific Actions */}
                {(getStructureType(structure) === 'woodcutter' || getStructureType(structure) === 'lumber_camp') && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Woodcutter Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setCurrentView('processing');
                          setProcessingType('sawmill');
                        }}
                        disabled={!hasInventoryItem('wood')}
                        className={`w-full p-3 rounded-lg transition-all text-left border ${
                          hasInventoryItem('wood')
                            ? 'bg-slate-700/50 hover:bg-slate-600/60 border-slate-600 cursor-pointer'
                            : 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className={`font-medium text-sm mb-1 ${
                          hasInventoryItem('wood') ? 'text-white' : 'text-gray-500'
                        }`}>
                          🪚 Saw Your Logs
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Have your timber cut into planks and boards {!hasInventoryItem('wood') && '(Need logs)'}
                        </div>
                      </button>
                      
                      <button
                        onClick={handleBuyClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-emerald-700/50 hover:bg-emerald-600/60 border border-emerald-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Lumber & Planks
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase finished wood products
                        </div>
                      </button>
                      
                      <button
                        onClick={handleSellClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Logs
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade your timber for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quarry-specific Actions */}
                {getStructureType(structure) === 'quarry' && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Quarry Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setCurrentView('processing');
                          setProcessingType('quarry');
                        }}
                        disabled={!hasInventoryItem('stone')}
                        className={`w-full p-3 rounded-lg transition-all text-left border ${
                          hasInventoryItem('stone')
                            ? 'bg-slate-700/50 hover:bg-slate-600/60 border-slate-600 cursor-pointer'
                            : 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className={`font-medium text-sm mb-1 ${
                          hasInventoryItem('stone') ? 'text-white' : 'text-gray-500'
                        }`}>
                          ✨ Polish Your Stones
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Have raw stone cut and polished {!hasInventoryItem('stone') && '(Need raw stone)'}
                        </div>
                      </button>
                      
                      <button
                        onClick={handleBuyClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-emerald-700/50 hover:bg-emerald-600/60 border border-emerald-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Cut Stone
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase finished stone blocks
                        </div>
                      </button>
                      
                      <button
                        onClick={handleSellClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Stone
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade uncut stone for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Mine-specific Actions */}
                {(getStructureType(structure) === 'mine' || getStructureType(structure) === 'mining_colony') && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Mining Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setCurrentView('processing');
                          setProcessingType('mine');
                        }}
                        disabled={!hasInventoryItem('ore')}
                        className={`w-full p-3 rounded-lg transition-all text-left border ${
                          hasInventoryItem('ore')
                            ? 'bg-slate-700/50 hover:bg-slate-600/60 border-slate-600 cursor-pointer'
                            : 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className={`font-medium text-sm mb-1 ${
                          hasInventoryItem('ore') ? 'text-white' : 'text-gray-500'
                        }`}>
                          🔥 Refine Your Ore
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Smelt raw ore into metal ingots {!hasInventoryItem('ore') && '(Need ore)'}
                        </div>
                      </button>
                      
                      <button
                        onClick={handleBuyClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-emerald-700/50 hover:bg-emerald-600/60 border border-emerald-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Refined Metals
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase smelted iron, copper, and precious metals
                        </div>
                      </button>
                      
                      <button
                        onClick={handleSellClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Ore
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade unrefined ore for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Factory-specific Actions */}
                {getStructureType(structure) === 'factory' && (
                  <div>
                    <h3 className="text-white font-medium text-sm mb-3">Workshop Services</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          setCurrentView('processing');
                          setProcessingType('factory');
                        }}
                        disabled={!hasInventoryItem('raw_materials')}
                        className={`w-full p-3 rounded-lg transition-all text-left border ${
                          hasInventoryItem('raw_materials')
                            ? 'bg-slate-700/50 hover:bg-slate-600/60 border-slate-600 cursor-pointer'
                            : 'bg-slate-800/30 border-slate-700/50 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className={`font-medium text-sm mb-1 ${
                          hasInventoryItem('raw_materials') ? 'text-white' : 'text-gray-500'
                        }`}>
                          🔨 Commission Crafting
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Have tools and goods crafted from materials {!hasInventoryItem('raw_materials') && '(Need materials)'}
                        </div>
                      </button>
                      
                      <button
                        onClick={handleBuyClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-emerald-700/50 hover:bg-emerald-600/60 border border-emerald-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          🛒 Buy Manufactured Goods
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Purchase finished tools, textiles, and goods
                        </div>
                      </button>
                      
                      <button
                        onClick={handleSellClick}
                        className="w-full p-3 rounded-lg transition-all text-left bg-amber-700/50 hover:bg-amber-600/60 border border-amber-600"
                      >
                        <div className="text-white font-medium text-sm mb-1">
                          💰 Sell Raw Materials
                        </div>
                        <div className="text-gray-400 text-xs leading-tight">
                          Trade materials and scrap for coin
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                  </>
                )}

                {/* Buy Interface */}
                {currentView === 'buy' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium text-lg">Buy Items</h3>
                      <button
                        onClick={handleBackToMain}
                        className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded bg-slate-700/50 hover:bg-slate-600/50"
                      >
                        ← Back
                      </button>
                    </div>


                    <div className="bg-slate-800/60 rounded-lg p-3 mb-4">
                      <div className="text-amber-300 text-sm">
                        💰 Your Gold: {getPlayerGold()} coins
                      </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {getAvailableItems().map((itemBaseId) => {
                        const itemDef = ITEM_DEFINITIONS[itemBaseId];
                        const price = getItemPrice(itemBaseId);
                        const canAfford = getPlayerGold() >= price;
                        
                        if (!itemDef) return null;
                        
                        return (
                          <button
                            key={itemBaseId}
                            onClick={() => handlePurchaseItem(itemBaseId)}
                            disabled={!canAfford}
                            className={`w-full p-3 rounded-lg transition-all text-left border ${
                              canAfford
                                ? 'bg-emerald-700/30 hover:bg-emerald-600/40 border-emerald-600 cursor-pointer'
                                : 'bg-red-900/20 border-red-800/50 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{itemDef.emoji || '📦'}</span>
                                <div>
                                  <div className={`font-medium text-sm ${canAfford ? 'text-white' : 'text-gray-400'}`}>
                                    {itemDef.name}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {itemDef.description}
                                  </div>
                                </div>
                              </div>
                              <div className={`text-right ${canAfford ? 'text-emerald-300' : 'text-red-400'}`}>
                                <div className="font-medium text-sm">{price} coins</div>
                                {!canAfford && (
                                  <div className="text-xs text-red-400">Can't afford</div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sell Interface */}
                {currentView === 'sell' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-white font-medium text-lg">Sell Items</h3>
                      <button
                        onClick={handleBackToMain}
                        className="text-gray-400 hover:text-white text-sm px-3 py-1 rounded bg-slate-700/50 hover:bg-slate-600/50"
                      >
                        ← Back
                      </button>
                    </div>


                    <div className="bg-slate-800/60 rounded-lg p-3 mb-4">
                      <div className="text-amber-300 text-sm">
                        🎒 Your Inventory: {getPlayerItems().length} items
                      </div>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {getPlayerItems().map((item, index) => {
                        const sellPrice = Math.floor((ITEM_DEFINITIONS[item.baseId || item.id]?.value || 1) * 0.7); // 70% of base value
                        const itemDef = ITEM_DEFINITIONS[item.baseId || item.id];
                        
                        if (!itemDef) return null;
                        
                        return (
                          <button
                            key={`${item.id}-${index}`}
                            onClick={async () => {
                              if (onSellItem) {
                                try {
                                  await onSellItem(item, sellPrice);
                                  showToast?.(`Sold ${item.name} for ${sellPrice} coins`);
                                } catch (error) {
                                  console.error('Sell failed:', error);
                                  showToast?.('Sale failed');
                                }
                              }
                            }}
                            className="w-full p-3 rounded-lg transition-all text-left bg-amber-700/30 hover:bg-amber-600/40 border border-amber-600 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{itemDef.emoji || '📦'}</span>
                                <div>
                                  <div className="text-white font-medium text-sm">
                                    {item.name}
                                    {(item.quantity && item.quantity > 1) && ` (x${item.quantity})`}
                                  </div>
                                  <div className="text-gray-400 text-xs">
                                    {itemDef.description}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-amber-300">
                                <div className="font-medium text-sm">{sellPrice} coins</div>
                                <div className="text-xs text-amber-400">70% value</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {getPlayerItems().length === 0 && (
                        <div className="text-center text-gray-400 py-8">
                          <p>No items to sell</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Processing View */}
                {currentView === 'processing' && processingType && (
                  <ProcessingInterface
                    poiType={processingType}
                    recipes={getProcessingRecipes(processingType, currentCulturalZone, currentEra)}
                    playerInventory={playerCharacter?.inventory || []}
                    playerCoins={playerCharacter?.coins || 0}
                    onStartProcessing={handleStartProcessing}
                    onClose={() => {
                      setCurrentView('main');
                      setProcessingType(null);
                    }}
                    culturalZone={currentCulturalZone}
                    era={currentEra}
                  />
                )}

                {/* Footer */}
                <div className="flex justify-end items-center pt-3 border-t border-slate-300/50 dark:border-slate-700/50">
                  <button
                    onClick={handleClose}
                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Leave
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default POIToastModal;