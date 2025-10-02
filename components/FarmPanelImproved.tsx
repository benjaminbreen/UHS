/**
 * components/FarmPanelImproved.tsx
 * Beautiful, fully-functional farm management interface — polished UI + working LLM integrations
 *
 * NOTE: This is a COMPLETE drop-in replacement. All prop types and major terms are preserved.
 * - Uses lucide-react icons for a modern look
 * - Family chat now calls your real LLM (generateEncounterDialogue) with memory
 * - Advisor tab uses generateHistoricalSummary (and optional Advisor chat via generateEncounterDialogue)
 * - Optional farm flavor refresh via generateFarmDetails (LLM) with graceful fallback
 * - Quick Actions are fully wired (Plant/Water/Harvest)
 * - Trade tab: simple working flow for buying seeds and selling harvest via onBuy/onSell
 * - Robust state updates are persisted via updateFarmState
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Tile,
  MapData,
  PlayerCharacter,
  Item,
  Season,
  NpcEntity,
  TimeOfDay,
  HistoricalEra,
  DialogueEntry,
} from '../types';
import FarmBanner from './FarmBanner';
import {
  getFarmState,
  updateFarmState,
  getValidCrops,
  FarmState,
  FarmFamilyMember,
  updateResidencyStatus,
  FarmResidencyStatus,
  acceptWorkContract,
} from '../services/farmService';
import {
  generateEncounterDialogue,
  generateHistoricalSummary,
  generateFarmDetails as llmGenerateFarmDetails,
  assessFarmWork,
  generateFarmWorkSimulation,
} from '../services/llmService';
import { parseDateString, formatDateWithSeason } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { ProceduralPortrait } from './portraits';
import PlayerProfileCard from './PlayerProfileCard';
import NPCToast from './NPCToast';
import { gameSounds } from '../services/gameSoundsService';
import { useUI } from '../contexts/UIContext';
import { CROP_DATA, formatPlantingSeason } from '../constants/gameData/cropData';
import { generateFarmName } from '../constants/gameData/farmNaming';

// Shared types (Phase 1 refactoring)
import {
  FarmPanelProps,
  TabType,
  FieldPlan,
  ResourceAllocation,
  FarmerToast,
  WorkHistoryEntry,
  CROP_EMOJIS,
  PANEL_RIGHT_W,
} from './farm/types';

// lucide icons
import {
  X,
  Home,
  Sprout,
  Users,
  Store,
  ScrollText,
  Droplets,
  Wheat,
  Pickaxe,
  Hammer,
  Sparkles,
  MessageSquare,
  History,
  Brain,
  RotateCcw,
  Leaf,
  CalendarClock,
  Timer,
  Beaker,
  HandCoins,
} from 'lucide-react';

interface FarmPanelImprovedProps extends FarmPanelProps {
  leftSidebarTab?: string;
  onTabChange?: (tab: string) => void;
}

const FarmPanelImproved: React.FC<FarmPanelImprovedProps> = ({
  tile,
  mapData,
  playerCharacter,
  npcs,
  onClose,
  onBuy,
  onSell,
  season,
  gameTimeHours,
  onProgressTime,
  onShowEvent,
  currentGameDay,
  useLlm = true,
  gameDate,
  onInitiateEncounter,
  onPlayerStateChange,
}) => {
  const { isLeftSidebarExpanded, setIsLeftSidebarExpanded, isRightSidebarVisible, setIsRightSidebarVisible } = useUI();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [farmState, setFarmState] = useState<FarmState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [previousLeftSidebarState, setPreviousLeftSidebarState] = useState<boolean | null>(null);
  const [previousRightSidebarState, setPreviousRightSidebarState] = useState<boolean | null>(null);

  // Derive cultural zone early for use in callbacks
  const culturalZone = mapLocationToCulture(mapData?.timeSlice || 'Europe 1650', mapData?.continent || 'Europe');

  // Fields
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('');

  // Text-based Farm Work Adventure
  const [farmWorkHistory, setFarmWorkHistory] = useState<WorkHistoryEntry[]>([]);
  const [farmWorkInput, setFarmWorkInput] = useState('');
  const [isFarmWorkProcessing, setIsFarmWorkProcessing] = useState(false);
  const [hoursWorkedToday, setHoursWorkedToday] = useState(0);
  const [currentFarmTime, setCurrentFarmTime] = useState(gameTimeHours); // Track current time in farm work
  const [farmActionLog, setFarmActionLog] = useState<Array<{ action: string; timeElapsed: number }>>([]);

  // Overview tab expanded cards
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Farm Work tab expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Family & chat
  const [selectedMember, setSelectedMember] = useState<FarmFamilyMember | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [chatHistory, setChatHistory] = useState<DialogueEntry[]>([]);
  const [farmerMessage, setFarmerMessage] = useState<string>('');
  const [useHistoricalLanguage, setUseHistoricalLanguage] = useState<boolean>(false);

  // Advisor
  const [advisorSummary, setAdvisorSummary] = useState<string>('');
  const [advisorChat, setAdvisorChat] = useState<string>('');
  
  // NPCToast for head farmer
  const [farmerToast, setFarmerToastRaw] = useState<FarmerToast | null>(null);

  // Safe state setter that checks if component is unmounting
  const setFarmerToast = useCallback((value: any) => {
    if (!isUnmountingRef.current) {
      setFarmerToastRaw(value);
    }
  }, []);

  // Combat handler - convert farm family member to proper NPC entity
  const handleInitiateEncounter = useCallback((farmCharacter: any) => {
    // Mark component as unmounting to prevent state updates
    isUnmountingRef.current = true;

    // Convert the farm family member to a proper NPC entity structure
    // This is necessary because farm NPCs are virtual entities not in the map's NPC array
    const npcEntity = {
      id: `farm_${farmCharacter.id || farmCharacter.name?.replace(/\s+/g, '_') || 'farmer'}`,
      name: farmCharacter.name || 'Farmer',
      type: 'human' as const,
      x: playerCharacter.x || 0,
      y: playerCharacter.y || 0,
      emoji: farmCharacter.emoji || '👨‍🌾',
      aiType: 'hostile' as const,
      health: farmCharacter.health || 100,
      maxHealth: farmCharacter.maxHealth || 100,
      stats: {
        strength: farmCharacter.stats?.strength || 8,
        dexterity: farmCharacter.stats?.dexterity || 6,
        stamina: farmCharacter.stats?.stamina || 7,
        constitution: farmCharacter.stats?.constitution || 7,
        intelligence: farmCharacter.stats?.intelligence || 5,
        wisdom: farmCharacter.stats?.wisdom || 6,
        charisma: farmCharacter.stats?.charisma || 4,
        perception: farmCharacter.stats?.perception || 5,
        craftiness: farmCharacter.stats?.craftiness || 4,
        persuasion: farmCharacter.stats?.persuasion || 3,
        level: 3,
        speed: 1,
        empathy: 5,
        eloquence: 3,
        humor: 2,
        intimidation: 6,
        loyalty: 8,
        curiosity: 4,
        caution: 7,
        aggression: 8, // High since they're defending their farm
        greed: 3,
        reputation: 5,
        piety: 5,
        education: 2
      },
      personality: {
        traits: ['protective', 'territorial', 'hardworking'],
        temperament: 'defensive',
        quirks: []
      },
      socialContext: {
        class: 'COMMONER',
        reputation: 'LOCAL',
        relationships: []
      },
      class: 'COMMONER',
      role: farmCharacter.role || 'Farmer',
      wealthLevel: 'modest' as const,
      gender: farmCharacter.gender || 'male' as const,
      age: farmCharacter.age || 35,
      appearance: {
        // Base physical features
        skinColor: farmCharacter.skinTone || '#D2A679',
        hairColor: farmCharacter.hairColor || '#4A3C28',
        eyeColor: farmCharacter.eyeColor || '#5A4A3A',
        hairstyle: 'short',
        build: 'stocky' as const,

        // Facial characteristics
        faceShape: 'square' as const,
        eyeShape: 'narrow' as const,
        noseShape: 'broad' as const,
        cheekbones: 'average' as const,
        jawline: 'square' as const,

        // Hair details
        hairTexture: 'wavy' as const,
        hairLength: 'short' as const,
        facialHair: farmCharacter.gender === 'male',
        facialHairStyle: farmCharacter.gender === 'male' ? 'stubble' as const : undefined,
        facialHairThickness: farmCharacter.gender === 'male' ? 'medium' as const : undefined,

        // Clothing data
        garment: {
          type: 'TUNIC' as const,
          name: 'simple_tunic',
          color: '#8B4513'
        },
        headgear: {
          type: 'HAT' as const,
          name: 'straw_hat',
          color: '#F4E4C1'
        },
        footwear: {
          type: 'BOOTS' as const,
          name: 'leather_boots',
          color: '#654321'
        },
        belt: {
          type: 'BELT' as const,
          name: 'leather_belt',
          color: '#8B4513'
        },
        accessory: {
          type: 'NONE' as const,
          name: 'none',
          color: '#000000'
        },

        // Color palette for combat sprite
        palette: {
          primary: '#8B4513',    // Brown tunic
          secondary: '#F4E4C1',  // Light straw hat
          accent: '#654321'      // Dark brown boots
        },

        // Legacy properties
        skinTone: farmCharacter.skinTone || '#D2A679',
        height: 'average' as const
      },
      inventory: farmCharacter.inventory || [],
      equippedItems: {},
      memory: {
        opinionOfPlayer: -100, // Hostile because attacking
        conversationSummaries: [],
        shortTermMemory: ['Player refused to leave', 'Defending the farm'],
        lastInteraction: Date.now()
      },
      statusEffects: [],
      isHostile: true,
      initialDialogue: farmCharacter.initialDialogue || ["You leave me no choice! Defend the farm!"],
      profession: farmCharacter.role || 'Farmer',
      culturalBackground: culturalZone
    };

    // Close the farm panel first to ensure clean transition
    onClose();

    // Then initiate combat after a brief delay to allow modal cleanup
    setTimeout(() => {
      if (onInitiateEncounter) {
        onInitiateEncounter(npcEntity);
      }
    }, 100);
  }, [onInitiateEncounter, playerCharacter, culturalZone, onClose]);

  const [advisorLog, setAdvisorLog] = useState<string[]>([]);
  const [isAdvisorBusy, setIsAdvisorBusy] = useState(false);

  // Market / Trade
  const [seedPriceMultiplier] = useState<number>(1.0);
  const [harvestLedger, setHarvestLedger] = useState<Record<string, number>>({}); // crop -> qty

  // Flavor / Banner LLM
  const [isRefreshingFlavor, setIsRefreshingFlavor] = useState(false);

  // Worker planning state
  const [fieldPlans, setFieldPlans] = useState<Map<number, FieldPlan>>(new Map());
  const [showPlanningModal, setShowPlanningModal] = useState(false);
  const [strategyText, setStrategyText] = useState('');
  const [workQualityScore, setWorkQualityScore] = useState<number | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [lastAssessment, setLastAssessment] = useState<any>(null);
  const [inspectedField, setInspectedField] = useState<number | null>(null);
  const [resources, setResources] = useState<ResourceAllocation>({
    water: { available: 20, allocated: new Map() },
    manure: { available: 8, allocated: new Map() },
    seeds: []
  });

  // Refs for lifecycle management
  const centerRef = useRef<HTMLDivElement>(null);
  const isUnmountingRef = useRef(false);
  const [centerWidth, setCenterWidth] = useState<number>(1200);

  // Auto-collapse left sidebar and hide right sidebar when farm panel opens
  useEffect(() => {
    // Store current states and collapse/hide on mount
    const wasLeftExpanded = isLeftSidebarExpanded;
    const wasRightVisible = isRightSidebarVisible;
    setPreviousLeftSidebarState(wasLeftExpanded);
    setPreviousRightSidebarState(wasRightVisible);

    if (wasLeftExpanded) {
      setIsLeftSidebarExpanded(false);
    }
    if (wasRightVisible) {
      setIsRightSidebarVisible(false);
    }

    // Restore previous states when component unmounts
    return () => {
      if (wasLeftExpanded) {
        setIsLeftSidebarExpanded(true);
      }
      if (wasRightVisible) {
        setIsRightSidebarVisible(true);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  useEffect(() => {
    const handleResize = () => {
      const total =
        window.innerWidth - PANEL_RIGHT_W - 2; // borders
      setCenterWidth(Math.max(total, 600));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Historical context with defensive proxy access
  const { era, year } = useMemo(() => {
    try {
      const dateInfo = parseDateString(mapData?.timeSlice || '1650');
      return {
        era: dateInfo.era as HistoricalEra,
        year: dateInfo.year,
      };
    } catch (error) {
      console.warn('Map data access error, using fallback:', error);
      return {
        era: HistoricalEra.MEDIEVAL,
        year: 1650,
      };
    }
  }, [mapData?.timeSlice, mapData?.continent]);

  // Initialize farm work history with context-aware intro message
  useEffect(() => {
    if (farmWorkHistory.length === 0 && era && season) {
      const eraName = era === 'MEDIEVAL' ? 'medieval' : era === 'RENAISSANCE_EARLY_MODERN' ? 'early modern' : 'ancient';
      const zoneName = culturalZone.toLowerCase().replace(/_/g, ' ');
      setFarmWorkHistory([{
        type: 'narrator',
        text: `You stand at the edge of your fields in the ${season} season. The ${eraName} ${zoneName} landscape stretches before you. What will you do? (Try commands like: "plant wheat in field 1", "water the crops", "check field 2", "harvest mature crops")`
      }]);
    }
  }, [era, season, culturalZone, farmWorkHistory.length]);

  // Check if player is a worker
  const isWorker = farmState?.residencyStatus?.playerStatus === 'worker';
  const currentContract = farmState?.residencyStatus?.currentContract;
  const trustLevel = farmState?.residencyStatus?.trustLevel || 50;

  // Determine current month in season (0-2) with defensive access
  const monthInSeason = useMemo(() => {
    try {
      return mapData?.dateInfo?.month ? ((mapData.dateInfo.month - 1) % 3) : 0;
    } catch (error) {
      console.warn('Map data dateInfo access error:', error);
      return 0;
    }
  }, [mapData?.dateInfo?.month]);

  // Get seasonal action options based on current season
  const getSeasonalActions = (season: Season): string[] => {
    switch(season) {
      case 'spring': return ['plant', 'water', 'fallow'];
      case 'summer': return ['water', 'manure', 'weed'];
      case 'autumn': return ['harvest', 'water', 'fallow'];
      case 'winter': return ['fallow', 'manure', 'plant'];
      default: return ['water', 'fallow'];
    }
  };

  // Time of day
  const timeOfDay = useMemo((): TimeOfDay => {
    if (gameTimeHours >= 5 && gameTimeHours < 12) return 'Morning';
    if (gameTimeHours >= 12 && gameTimeHours < 17) return 'Afternoon';
    if (gameTimeHours >= 17 && gameTimeHours < 20) return 'Dusk';
    return 'Night';
  }, [gameTimeHours]);

  // Format time display (12-hour format)
  const formatTime = (hours: number) => {
    const h = Math.floor(hours) % 24;
    const m = Math.floor((hours % 1) * 60);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
  };

  // Toggle expanded card
  const toggleCard = (cardId: string) => {
    setExpandedCard(prev => prev === cardId ? null : cardId);
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Head farmer (owner or first adult member) - MUST BE DEFINED FIRST
  const headFarmer = useMemo(() => {
    if (!farmState?.family?.members) return null;
    return farmState.family.members.find(m => m.role === 'Farmer' && m.age >= 30) ||
           farmState.family.members.find(m => m.role === 'Farmer') ||
           farmState.family.members.find(m => m.age >= 18) ||
           farmState.family.members[0];
  }, [farmState]);

  // Get primary crop from tile.cropType (single source of truth)
  const primaryCrop = useMemo(() => {
    // First check if tile has cropType
    if (tile.cropType) return tile.cropType;

    // Otherwise find most common crop in fields
    if (!farmState?.fields) return 'none';
    const cropCounts: Record<string, number> = {};
    farmState.fields.forEach(f => {
      if (f.crop) {
        cropCounts[f.crop] = (cropCounts[f.crop] || 0) + 1;
      }
    });
    const sorted = Object.entries(cropCounts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'none';
  }, [tile.cropType, farmState?.fields]);

  // Generate farm name dynamically (depends on headFarmer and primaryCrop)
  const dynamicFarmName = useMemo(() => {
    if (!farmState) return 'The Farm';
    const farmerName = headFarmer?.name?.split(' ')[0] || farmState.family.headOfHousehold.split(' ')[0];
    return generateFarmName(
      farmerName,
      culturalZone,
      era,
      primaryCrop !== 'none' ? primaryCrop : undefined
    );
  }, [farmState, headFarmer, culturalZone, era, primaryCrop]);

  // Get prosperity display info
  const prosperityInfo = useMemo(() => {
    const status = farmState?.economicStatus || 'humble';
    const config = {
      humble: { label: 'Modest', color: 'text-slate-400', bg: 'bg-slate-800/30', emoji: '🏚️' },
      prosperous: { label: 'Prosperous', color: 'text-emerald-400', bg: 'bg-emerald-900/20', emoji: '🏡' },
      wealthy: { label: 'Wealthy', color: 'text-amber-400', bg: 'bg-amber-900/20', emoji: '🏰' }
    };
    return config[status as keyof typeof config] || config.humble;
  }, [farmState?.economicStatus]);

  // Music and soundscape on mount + cleanup tracking
  useEffect(() => {
    // Play mining music V1 once when opening
    gameSounds.playFishingMusic();

    // Start rural farm soundscape
    gameSounds.playEnvironmentalSoundscape('FARMLAND');

    // Cleanup on unmount
    return () => {
      isUnmountingRef.current = true;
      gameSounds.stopFishingMusic();
      gameSounds.stopEnvironmentalSoundscape();
    };
  }, []); // Only on mount/unmount

  // Load farm state with defensive proxy access
  useEffect(() => {
    try {
      const tileKey = `${tile.x}_${tile.y}`;
      const state = getFarmState(tile, mapData, npcs);
      setFarmState(state);

      if (!selectedMember && state.family.members.length > 0) {
        setSelectedMember(state.family.members[0]);
      }
    } catch (error) {
      console.warn('Farm state loading error (likely proxy revocation):', error);
      // Set minimal fallback state
      setFarmState({
        fields: [],
        family: { familyName: 'Unknown Farm', members: [] },
        economicStatus: 'humble',
        prosperityLevel: 'small'
      } as any);
    }
  }, [tile.x, tile.y]); // Use stable primitive values instead of object references

  // Valid crops
  const validCrops = useMemo(
    () =>
      farmState
        ? getValidCrops(
            farmState.historicalContext.culturalZone,
            farmState.historicalContext.year,
            season
          )
        : [],
    [farmState, season]
  );

  // ===== Farmer Messages ===========================================================
  
  useEffect(() => {
    // Generate contextual farmer messages based on farm state
    if (!farmState || !headFarmer) return;
    
    const generateFarmerMessage = () => {
      const messages: Array<{ message: string; type: 'advice' | 'warning' | 'quest' | 'news' }> = [];
      
      // Check crop status
      const plantedFields = farmState.fields.filter(f => f.crop).length;
      const matureFields = farmState.fields.filter(f => f.growthStage === 'mature').length;
      const dryFields = farmState.fields.filter(f => f.moisture === 'dry').length;
      
      if (matureFields > 0) {
        messages.push({ 
          message: `We have ${matureFields} field${matureFields > 1 ? 's' : ''} ready for harvest! Don't let the crops spoil.`, 
          type: 'warning' 
        });
      } else if (dryFields > 2) {
        messages.push({ 
          message: `The fields are getting dry. We should water them soon or the crops will suffer.`, 
          type: 'warning' 
        });
      } else if (plantedFields === 0) {
        messages.push({ 
          message: `The fields lie fallow. Perhaps it's time to plant ${validCrops[0] || 'something'}?`, 
          type: 'advice' 
        });
      } else if (season === 'spring') {
        messages.push({ 
          message: `Spring is the best time for planting. We should make the most of it.`, 
          type: 'advice' 
        });
      } else if (season === 'autumn') {
        messages.push({ 
          message: `Autumn is here. Time to harvest what we've grown and prepare for winter.`, 
          type: 'news' 
        });
      } else if (season === 'winter') {
        messages.push({ 
          message: `Winter makes farming difficult. We should focus on preserving what we have.`, 
          type: 'news' 
        });
      } else {
        messages.push({ 
          message: `Welcome to our farm! I'm ${headFarmer.name}. We grow ${validCrops.slice(0, 3).join(', ')} here.`, 
          type: 'news' 
        });
      }
      
      // Pick a random message from appropriate ones
      if (messages.length > 0) {
        const selected = messages[Math.floor(Math.random() * messages.length)];
        setFarmerToast(selected);
      }
    };
    
    // Generate initial message
    generateFarmerMessage();
    
    // Refresh message every 30 seconds
    const interval = setInterval(generateFarmerMessage, 30000);
    return () => clearInterval(interval);
  }, [farmState, headFarmer, season, validCrops]);

  // ===== Helpers ===================================================================

  const persistFields = (fields: FarmState['fields']) => {
    if (!farmState) return;
    updateFarmState(farmState.tileKey, { fields });
    setFarmState((s) => (s ? { ...s, fields } : s));
  };

  const addHarvestToLedger = (crop: string, qty: number) => {
    setHarvestLedger((prev) => ({ ...prev, [crop]: (prev[crop] || 0) + qty }));
  };

  // ===== Quick Actions =============================================================

  const plantAll = useCallback(() => {
    if (!farmState) return;
    const crop = selectedCrop || validCrops[0];
    if (!crop) return;
    const updated = farmState.fields.map((f) =>
      f.growthStage === 'fallow'
        ? {
            ...f,
            crop,
            growthStage: 'planted',
            moisture: 'moist',
            health: Math.min(100, f.health || 80),
            daysToHarvest: 60,
            lastWorked: currentGameDay,
          }
        : f
    );
    persistFields(updated);
  }, [farmState, selectedCrop, validCrops, currentGameDay]);

  const waterAll = useCallback(() => {
    if (!farmState) return;
    const updated = farmState.fields.map((f) => ({
      ...f,
      moisture: 'wet',
      lastWatered: currentGameDay,
      health: Math.min(100, (f.health || 70) + 8),
    }));
    persistFields(updated);
  }, [farmState, currentGameDay]);

  const harvestAll = useCallback(() => {
    if (!farmState) return;
    const updated = farmState.fields.map((f) => {
      if (f.growthStage === 'mature' && f.crop) {
        const yieldAmount = Math.max(1, Math.floor((f.health / 100) * 10));
        addHarvestToLedger(f.crop, yieldAmount);
        return {
          ...f,
          crop: null,
          growthStage: 'fallow',
          daysToHarvest: 0,
        };
      }
      return f;
    });
    persistFields(updated);
  }, [farmState]);

  // ===== Initial Farmer Greeting ===================================================
  
  const getInitialFarmerGreeting = () => {
    const era = mapData?.dateInfo?.era || 'MEDIEVAL';
    // Map economicStatus to greeting categories (only humble and prosperous exist)
    const prosperity = farmState?.economicStatus === 'wealthy' ? 'prosperous' : farmState?.economicStatus || 'humble';
    
    const greetings = {
      humble: {
        MEDIEVAL: [
          "Greetings, traveler. Our fields are modest but we manage. Will you help with the harvest?",
          "Welcome to our humble farm. The rains have been scarce this year.",
          "You look weary, friend. Rest here if you like, though we've little to spare."
        ],
        RENAISSANCE: [
          "Good day to you. Times are hard but we persevere. Might you lend a hand?",
          "Welcome, stranger. Our crops struggle but we have faith they'll grow.",
          "Ah, a visitor. Forgive the state of things - we do what we can with what we have."
        ],
        MODERN: [
          "Hello there. We're a small operation but we get by. Looking for work?",
          "Welcome to our farm. It's not much but it's honest work.",
          "Hey there. We could use an extra pair of hands if you're willing."
        ]
      },
      prosperous: {
        MEDIEVAL: [
          "Welcome to our lands! The harvest has been bountiful this season.",
          "Greetings, traveler! Our fields flourish - perhaps you'd like to see our methods?",
          "Well met! We've grain aplenty and strong oxen. How may we assist you?"
        ],
        RENAISSANCE: [
          "A fine day to you! Our estate prospers thanks to new farming techniques.",
          "Welcome to our productive lands! We've adopted the latest agricultural methods.",
          "Good day! Our fields yield abundantly - we even trade with the city merchants."
        ],
        MODERN: [
          "Welcome to our farm! We're having a great season this year.",
          "Hello! Our operation is running smoothly. Interested in agricultural work?",
          "Hi there! We've modernized recently and yields are up. Want a tour?"
        ]
      }
    };
    
    // Map era to available greeting categories (only MEDIEVAL, RENAISSANCE, MODERN exist)
    const eraKey = era === 'RENAISSANCE_EARLY_MODERN' ? 'RENAISSANCE' :
                   era === 'INDUSTRIAL_ERA' || era === 'FUTURE_ERA' ? 'MODERN' :
                   era === 'ANTIQUITY' || era === 'PREHISTORY' ? 'MEDIEVAL' :
                   era;
    const eraGreetings = greetings[prosperity]?.[eraKey] || greetings[prosperity]?.MEDIEVAL || greetings.humble.MEDIEVAL;
    return eraGreetings[Math.floor(Math.random() * eraGreetings.length)];
  };

  // ===== Field Actions with optional worker bonuses ================================

  const handleFieldWork = useCallback(
    (fieldId: number, action: 'plant' | 'water' | 'harvest', memberId?: string) => {
      if (!farmState) return;

      const member = memberId
        ? farmState.family.members.find((m) => m.id === memberId)
        : null;
      const field = farmState.fields[fieldId];
      const updated = [...farmState.fields];

      let successRate = 1.0;
      let speedBonus = 1.0;

      if (member) {
        if (member.traits.some((t) => t.name === 'Green Thumb')) successRate *= 1.15;
        if (member.traits.some((t) => t.name === 'Hard Worker')) speedBonus *= 1.2;
        if (member.traits.some((t) => t.name === 'Clumsy')) successRate *= 0.9;
        if (member.traits.some((t) => t.name === 'Lazy')) speedBonus *= 0.75;

        member.currentTask = action as any;
        member.assignedField = fieldId;
        member.fatigue = Math.min(member.maxFatigue, member.fatigue + 8);
      }

      switch (action) {
        case 'plant': {
          if (field.growthStage === 'fallow' && selectedCrop) {
            updated[fieldId] = {
              ...field,
              crop: selectedCrop,
              growthStage: 'planted',
              moisture: 'moist',
              health: Math.floor(90 * successRate),
              daysToHarvest: Math.max(30, Math.floor(60 / speedBonus)),
              lastWorked: currentGameDay,
            };
          }
          break;
        }
        case 'water': {
          updated[fieldId] = {
            ...field,
            moisture: 'wet',
            lastWatered: currentGameDay,
            health: Math.min(100, field.health + Math.floor(10 * successRate)),
          };
          break;
        }
        case 'harvest': {
          if (field.growthStage === 'mature' && field.crop) {
            const yieldAmount = Math.max(
              1,
              Math.floor((field.health / 100) * 10 * successRate)
            );
            addHarvestToLedger(field.crop, yieldAmount);
            updated[fieldId] = {
              ...field,
              crop: null,
              growthStage: 'fallow',
              daysToHarvest: 0,
            };
          }
          break;
        }
      }

      persistFields(updated);
    },
    [farmState, selectedCrop, currentGameDay]
  );

  // ===== Time Progression ==========================================================

  const progressFarmTime = useCallback(
    (months: number) => {
      if (!farmState || !onProgressTime) return;
      const days = months * 30;

      const updated = farmState.fields.map((field) => {
        if (!field.crop) return field;
        let f = { ...field };

        // growth
        if (f.growthStage === 'planted' && days >= 10) f.growthStage = 'sprouting';
        if (f.growthStage === 'sprouting' && days >= 20) f.growthStage = 'growing';
        if (f.growthStage === 'growing' && days >= 40) f.growthStage = 'mature';

        // countdown
        f.daysToHarvest = Math.max(0, f.daysToHarvest - days);

        // moisture & health decay if neglected
        if (currentGameDay - (f.lastWatered || 0) > 7) {
          f.moisture = 'dry';
          f.health = Math.max(0, f.health - 10);
        }

        return f;
      });

      persistFields(updated);
      onProgressTime(months);
    },
    [farmState, onProgressTime, currentGameDay]
  );

  // ===== LLM — Family Chat (uses generateEncounterDialogue) ========================

  const handleFarmerChat = useCallback(async () => {
    if (!farmState || !selectedMember || !chatInput.trim() || isChatting) return;
    setIsChatting(true);
    try {
      // Build a temporary NpcEntity for the selected family member so the LLM has a full subject
      const familyNpc: NpcEntity = {
        id: `family-${selectedMember.id}`,
        name: selectedMember.name,
        age: selectedMember.age,
        role: selectedMember.role,
        x: 0,
        y: 0,
        health: selectedMember.health,
        maxHealth: selectedMember.maxHealth,
        culturalZone: farmState.historicalContext.culturalZone,
        // lightweight extras
        profession: selectedMember.role,
        memory: {
          conversationSummaries: [],
          opinionOfPlayer: Math.max(20, Math.min(80, farmState.reputation || 50)),
        },
      } as any;

      const { text, reputationChange } = await generateEncounterDialogue(
        familyNpc,
        chatHistory,
        chatInput,
        playerCharacter,
        npcs,
        mapData,
        useHistoricalLanguage
      );

      // Push to local chat history
      const newHistory: DialogueEntry[] = [
        ...chatHistory,
        { speaker: 'player', text: chatInput, timestamp: Date.now() },
        { speaker: selectedMember.name, text, timestamp: Date.now() },
      ];
      setChatHistory(newHistory);
      setFarmerMessage(text);
      setChatInput('');

      // Apply any reputation nudges to farm
      if (typeof reputationChange === 'number' && reputationChange !== 0) {
        const newRep = Math.max(
          0,
          Math.min(100, (farmState.reputation || 50) + reputationChange)
        );
        const next = { ...farmState, reputation: newRep };
        setFarmState(next);
        updateFarmState(farmState.tileKey, { reputation: newRep });
      }
    } catch (err) {
      console.error('LLM family chat failed:', err);
      setFarmerMessage("I'm not sure what to say about that.");
    } finally {
      setIsChatting(false);
    }
  }, [
    farmState,
    selectedMember,
    chatInput,
    isChatting,
    chatHistory,
    playerCharacter,
    npcs,
    mapData,
    useHistoricalLanguage,
  ]);

  // ===== LLM — Advisor =============================================================

  const runAdvisorSummary = useCallback(async () => {
    if (!useLlm) {
      setAdvisorSummary(
        'LLM is disabled. Enable it to fetch a concise historical summary for this time and place.'
      );
      return;
    }
    setIsAdvisorBusy(true);
    try {
      const summary = await generateHistoricalSummary(
        year,
        mapData.continent || 'Region',
        mapData.localArea || 'Local Area'
      );
      setAdvisorSummary(summary);
    } catch (e) {
      console.error('Advisor summary error:', e);
      setAdvisorSummary('Unable to fetch summary at this time.');
    } finally {
      setIsAdvisorBusy(false);
    }
  }, [useLlm, year, mapData]);

  const runAdvisorChat = useCallback(async () => {
    if (!useLlm || !advisorChat.trim()) return;
    setIsAdvisorBusy(true);
    try {
      // Create a generic "Village Elder" advisor NPC for realistic replies
      const advisorNpc: NpcEntity = {
        id: 'advisor-npc',
        name: 'Village Elder',
        age: 58,
        role: 'Advisor',
        x: 0,
        y: 0,
        health: 90,
        maxHealth: 100,
        culturalZone: culturalZone,
        profession: 'Elder',
        memory: { conversationSummaries: [], opinionOfPlayer: 60 },
      } as any;

      const { text } = await generateEncounterDialogue(
        advisorNpc,
        [], // we keep advisor answers short & independent; you can store history if desired
        advisorChat,
        playerCharacter,
        npcs,
        mapData,
        false
      );
      setAdvisorLog((prev) => [...prev, `You: ${advisorChat}`, `Advisor: ${text}`]);
      setAdvisorChat('');
    } catch (e) {
      console.error('Advisor chat failed:', e);
      setAdvisorLog((prev) => [...prev, 'Advisor: (no response)']);
    } finally {
      setIsAdvisorBusy(false);
    }
  }, [useLlm, advisorChat, culturalZone, playerCharacter, npcs, mapData]);

  // ===== LLM — Farm Flavor Refresh (Banner names/descriptions) =====================

  const refreshFarmFlavor = useCallback(async () => {
    if (!useLlm || !farmState) return;
    setIsRefreshingFlavor(true);
    try {
      const details = await llmGenerateFarmDetails(
        tile,
        {
          date: String(year),
          location: mapData.localArea || mapData.continent || 'Unknown',
          climate: mapData.climate || 'temperate',
        },
        true
      );
      const next = {
        ...farmState,
        family: {
          ...farmState.family,
          familyName: details.farmName?.split(' ')[0] || farmState.family.familyName,
          headOfHousehold: details.farmerName || farmState.family.headOfHousehold,
        },
        economicStatus: details.economicStatus === 'prosperous' ? 'wealthy' : 'humble',
        flavorText: details.farmDescription,
      } as FarmState;
      setFarmState(next);
      updateFarmState(farmState.tileKey, {
        family: next.family,
        economicStatus: next.economicStatus,
        flavorText: next.flavorText,
      });
    } catch (e) {
      console.error('Flavor refresh failed:', e);
    } finally {
      setIsRefreshingFlavor(false);
    }
  }, [useLlm, farmState, tile, year, mapData]);

  // ===== Text-Based Farm Work Handler ==========================================

  const handleFarmWorkCommand = useCallback(async (command: string) => {
    if (!useLlm || !farmState || isFarmWorkProcessing) return;

    setIsFarmWorkProcessing(true);
    setFarmWorkHistory(prev => [...prev, { type: 'player', text: command }]);

    try {
      // Prepare livestock data
      const livestock = farmState.livestock?.map(l => ({
        type: l.type,
        health: l.health,
        productivity: l.productivity,
        lastFed: l.lastFed
      }));

      // Call new farm simulation function
      const result = await generateFarmWorkSimulation(
        command,
        farmState,
        playerCharacter,
        validCrops,
        season,
        timeOfDay,
        currentFarmTime,
        livestock
      );

      // Add narrative to history
      setFarmWorkHistory(prev => [...prev, { type: 'narrator', text: result.narrative }]);

      // Apply state changes
      if (result.stateChanges) {
        let updated = { ...farmState };

        // Apply field changes
        if (result.stateChanges.fields) {
          Object.entries(result.stateChanges.fields).forEach(([fieldId, changes]) => {
            const fieldIndex = parseInt(fieldId) - 1;
            if (fieldIndex >= 0 && fieldIndex < updated.fields.length) {
              updated.fields[fieldIndex] = { ...updated.fields[fieldIndex], ...changes };
            }
          });
        }

        // Apply livestock changes
        if (result.stateChanges.livestock && updated.livestock) {
          Object.entries(result.stateChanges.livestock).forEach(([livestockId, changes]) => {
            const livestockIndex = updated.livestock!.findIndex(l => l.type === livestockId || `${l.type}_${updated.livestock!.indexOf(l) + 1}` === livestockId);
            if (livestockIndex >= 0) {
              updated.livestock![livestockIndex] = { ...updated.livestock![livestockIndex], ...changes };
            }
          });
        }

        // Update farm state
        setFarmState(updated);
        updateFarmState(farmState.tileKey, {
          fields: updated.fields,
          livestock: updated.livestock
        });

        // Apply player state changes via callback
        if (result.stateChanges.player && onPlayerStateChange) {
          onPlayerStateChange({
            health: result.stateChanges.player.health,
            fatigue: result.stateChanges.player.fatigue,
            statusEffects: result.stateChanges.player.statusEffects,
            inventory: result.stateChanges.inventory
          });
        }

        // Track time
        const timeElapsed = result.stateChanges.time?.elapsed || 0.5;
        const newHours = hoursWorkedToday + timeElapsed;
        setHoursWorkedToday(newHours);

        const newTime = currentFarmTime + timeElapsed;
        setCurrentFarmTime(newTime);

        // Add to action log (keep last 5)
        setFarmActionLog(prev => {
          const newLog = [{ action: command, timeElapsed }, ...prev].slice(0, 5);
          return newLog;
        });

        // End of day check
        if (newHours >= 8 && headFarmer) {
          setTimeout(() => {
            setFarmerToast({
              message: `The sun sets. ${headFarmer.name} calls you home. A day's work is done.`,
              type: 'news'
            });
            setHoursWorkedToday(0);
          }, 1500);
        }
      }

    } catch (e) {
      console.error('Farm work command failed:', e);
      setFarmWorkHistory(prev => [...prev, {
        type: 'narrator',
        text: 'You struggle to focus on your work...'
      }]);
    } finally {
      setIsFarmWorkProcessing(false);
      setFarmWorkInput('');
    }
  }, [useLlm, farmState, isFarmWorkProcessing, season, validCrops, playerCharacter, hoursWorkedToday, currentFarmTime, headFarmer, timeOfDay, onPlayerStateChange]);

  // ===== Worker Planning Functions ==============================================

  const handleFieldAction = useCallback((fieldId: number, action: string, cropToPlant?: string) => {
    // Play action-specific sound
    if (action === 'plant') {
      gameSounds.playItemPickupSound('food'); // Planting seed sound
    } else if (action === 'water') {
      gameSounds.playUIClickSound(); // Water drop sound
    } else if (action === 'harvest') {
      gameSounds.playItemPickupSound('generic'); // Harvest sound
    } else {
      gameSounds.playUIClickSound(); // Generic action sound
    }

    setFieldPlans(prev => {
      const newPlans = new Map(prev);
      const existingPlan = newPlans.get(fieldId) || {
        fieldId,
        action: 'fallow',
        waterAmount: 0,
        manureAmount: 0
      };

      newPlans.set(fieldId, {
        ...existingPlan,
        action: action as any,
        cropToPlant
      });

      return newPlans;
    });
  }, []);

  const handleResourceAllocation = useCallback((fieldId: number, type: 'water' | 'manure', amount: number) => {
    setFieldPlans(prev => {
      const newPlans = new Map(prev);
      const existingPlan = newPlans.get(fieldId) || {
        fieldId,
        action: 'fallow',
        waterAmount: 0,
        manureAmount: 0
      };

      if (type === 'water') {
        existingPlan.waterAmount = Math.min(3, Math.max(0, amount)) as 0 | 1 | 2 | 3;
      } else {
        existingPlan.manureAmount = Math.min(1, Math.max(0, amount)) as 0 | 1;
      }

      newPlans.set(fieldId, existingPlan);
      return newPlans;
    });
  }, []);

  const handleWorkerSubmit = useCallback(async () => {
    if (!isWorker || strategyText.trim().length < 20) {
      alert('Please explain your strategy (at least 20 characters)');
      return;
    }

    if (fieldPlans.size === 0) {
      alert('Please plan work for at least one field!');
      return;
    }

    setIsAssessing(true);
    setShowPlanningModal(false);

    try {
      // Prepare context for assessment with defensive access
      const era = farmState?.era || HistoricalEra.MEDIEVAL;
      const farmerPersonality = farmState?.family?.[0]?.personality || 'practical and hardworking';
      const weatherPattern = season === 'spring' ? 'mild and wet' :
                           season === 'summer' ? 'warm and dry' :
                           season === 'fall' ? 'cool and variable' : 'cold and dormant';

      // Convert fieldPlans to assessment format
      const assessmentFieldPlans = new Map();
      fieldPlans.forEach((plan, fieldId) => {
        assessmentFieldPlans.set(fieldId, {
          action: plan.action,
          waterLevel: plan.waterAmount || 0,
          manureLevel: plan.manureAmount || 0,
          reasoning: plan.reasoning || ''
        });
      });

      const assessment = await assessFarmWork(
        assessmentFieldPlans,
        strategyText,
        {
          season,
          year: gameDate?.year || 1200,
          culturalZone,
          era,
          weatherPattern,
          soilQuality: farmState?.soilQuality || 7,
          farmerPersonality,
          playerTrustLevel: trustLevel / 10 // Convert 0-100 to 0-10
        }
      );

      setLastAssessment(assessment);
      setWorkQualityScore(assessment.overallScore);

      // Update field outcomes based on assessment scores
      if (farmState?.fields) {
        const updatedFields = farmState.fields.map(field => {
          const fieldScore = assessment.fieldScores.get(field.id) || 50;
          const currentYield = field.yieldMultiplier || 1.0;

          // Calculate field outcome based on score
          let newYield = currentYield;
          let newSoilHealth = field.soilHealth || 7;

          if (fieldScore >= 80) {
            newYield = Math.min(2.0, currentYield * 1.2); // Excellent work
            newSoilHealth = Math.min(10, newSoilHealth + 1);
          } else if (fieldScore >= 60) {
            newYield = Math.min(1.8, currentYield * 1.1); // Good work
          } else if (fieldScore >= 40) {
            newYield = currentYield; // Average work
          } else {
            newYield = Math.max(0.5, currentYield * 0.9); // Poor work
            newSoilHealth = Math.max(1, newSoilHealth - 1);
          }

          return {
            ...field,
            yieldMultiplier: newYield,
            soilHealth: newSoilHealth,
            lastWorked: Date.now()
          };
        });

        // Update farm state with new field outcomes and trust level
        const newTrustLevel = Math.max(0, Math.min(100, trustLevel + assessment.trustChange * 5));

        updateFarmState(tile.position, {
          ...farmState,
          fields: updatedFields,
          residencyStatus: {
            ...farmState.residencyStatus!,
            trustLevel: newTrustLevel,
            workHistory: [
              ...(farmState.residencyStatus?.workHistory || []),
              {
                month: `${gameDate?.month || 1}/${gameDate?.year || 1200}`,
                score: assessment.overallScore,
                feedback: assessment.farmerFeedback
              }
            ]
          }
        });
      }

      // Progress time by 1 month
      progressFarmTime(1);

      // Clear planning state
      setStrategyText('');
      setFieldPlans(new Map());

      // Show farmer feedback with sound
      const toastType = assessment.overallScore >= 70 ? 'success' :
                       assessment.overallScore >= 50 ? 'warning' : 'error';

      setFarmerToast({
        message: assessment.farmerFeedback,
        type: toastType
      });

      // Play assessment feedback sound
      if (assessment.overallScore >= 70) {
        gameSounds.playNotificationSound('success');
      } else if (assessment.overallScore >= 50) {
        gameSounds.playNotificationSound('warning');
      } else {
        gameSounds.playNotificationSound('error');
      }

    } catch (error) {
      console.error('Error assessing farm work:', error);

      // Fallback to basic progression
      progressFarmTime(1);
      setStrategyText('');
      setFieldPlans(new Map());

      setFarmerToast({
        message: "Your work shows effort, though I cannot fully assess it right now.",
        type: 'warning'
      });
    } finally {
      setIsAssessing(false);
    }
  }, [isWorker, strategyText, fieldPlans, season, mapData, farmState, gameDate, trustLevel, tile.position, progressFarmTime]);

  // ===== UI ========================================================================

  // Defensive check for farm state and proxy issues
  if (!farmState) {
    return (
      <div className="p-4 text-center text-slate-400">
        Loading farm data...
      </div>
    );
  }

  // Additional check for proxy revocation
  try {
    // Test if we can access farm state properties
    const _ = farmState.family?.familyName;
  } catch (error) {
    console.warn('Farm state proxy revocation detected:', error);
    return (
      <div className="p-4 text-center text-slate-400">
        Farm data temporarily unavailable. Please try again.
        <button
          onClick={onClose}
          className="block mx-auto mt-2 px-4 py-2 bg-slate-700 text-white rounded"
        >
          Close
        </button>
      </div>
    );
  }

  // Early return if farmState not loaded yet
  if (!farmState) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        <div className="text-slate-400 text-lg">Loading farm...</div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex bg-gradient-to-b from-slate-900 via-slate-950 to-black">
      {/* Fade transition overlay */}
      {isTransitioning && (
        <div
          className="fixed inset-0 z-50 bg-black transition-opacity duration-1000"
          style={{ opacity: isTransitioning ? 1 : 0 }}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex bg-gradient-to-b from-slate-900 via-slate-950 to-black">
        {/* Center */}
        <div ref={centerRef} className="flex-1 flex flex-col">
          {/* Banner */}
          <div className="h-48 relative overflow-hidden">
            <FarmBanner
              era={era}
              culturalZone={culturalZone}
              condition={farmState.economicStatus === 'wealthy' ? 'prosperous' : 'humble'}
              cropType={farmState.fields.find((f) => f.crop)?.crop || 'wheat'}
              climate={mapData.climate}
              season={season}
              timeOfDay={timeOfDay}
              farmName={`${farmState.family.familyName} Farm`}
              farmerName={farmState.family.headOfHousehold}
              width={centerWidth}
              height={192}
            />
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {useLlm && (
                <button
                  onClick={refreshFarmFlavor}
                  disabled={isRefreshingFlavor}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-400/30 shadow"
                >
                  <Sparkles className="w-4 h-4" />
                  {isRefreshingFlavor ? 'Refreshing…' : 'Refresh Farm Flavor'}
                </button>
              )}
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-rose-600 text-white border border-slate-600 hover:border-rose-400 shadow"
              >
                <X className="w-4 h-4" />
                Close
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-slate-900/70 backdrop-blur supports-[backdrop-filter]:bg-slate-900/60 border-b border-slate-800/60">
            <div className="flex items-center justify-between">
              {/* Location and time on left */}
              <div className="px-4 py-3 min-w-[200px]">
                <div className="text-xs text-slate-400">{mapData.localArea || culturalZone}</div>
                {activeTab === 'fields' && (
                  <div className="flex items-center gap-1.5 text-amber-400 mt-0.5">
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-medium tracking-wide">{formatTime(currentFarmTime)}</span>
                  </div>
                )}
              </div>

              {/* Centered tabs */}
              <div className="flex justify-center flex-1">
                {[
                  { id: 'overview' as TabType, label: 'Overview', icon: Home },
                  { id: 'fields' as TabType, label: 'Farm Work', icon: Sprout },
                  { id: 'family' as TabType, label: 'Family', icon: Users },
                  { id: 'trade' as TabType, label: 'Trade', icon: Store },
                  { id: 'advisor' as TabType, label: 'Advisor', icon: ScrollText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative px-4 py-3 font-medium transition-colors ${
                        active
                          ? 'text-amber-400 bg-slate-900/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs uppercase tracking-wide">{tab.label}</span>
                      </span>
                      {active && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400/70" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Empty space on right for symmetry */}
              <div className="px-4 py-3 min-w-[120px]"></div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ================= OVERVIEW ================= */}
            {activeTab === 'overview' && farmState && (
              <div className="animate-fadeIn space-y-3 max-w-7xl mx-auto">
                {/* Farm Info Card - Static, Information-Rich */}
                <div className="w-full bg-slate-700/40 border border-slate-500/50 rounded-lg p-5">
                  {/* Compact Single Row Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-baseline gap-4">
                      <h2 className="text-3xl font-bold text-slate-50 tracking-tight">{dynamicFarmName}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-semibold text-slate-300">{Math.abs(year)} {year < 0 ? 'BCE' : 'CE'}</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-base font-medium text-blue-400 capitalize">{season}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-slate-500 uppercase tracking-wide">Head Farmer</div>
                        <div className="text-base font-semibold text-amber-400">{headFarmer?.name || farmState.family.headOfHousehold}</div>
                      </div>
                      <div className={`px-3 py-2 rounded-md ${prosperityInfo.bg} border ${prosperityInfo.bg.replace('bg-', 'border-').replace('/20', '/40')}`}>
                        <span className={`text-base font-semibold ${prosperityInfo.color}`}>{prosperityInfo.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Last Year Performance - Compressed with Expand */}
                  {farmState.lastYearData && (
                    <div className="bg-slate-800/30 rounded-lg p-2.5 border border-slate-600/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{farmState.lastYearData.profit >= 0 ? '📈' : '📉'}</span>
                          <div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide">Last Year</div>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-sm font-bold ${farmState.lastYearData.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {farmState.lastYearData.profit >= 0 ? '+' : ''}{farmState.lastYearData.profit}¢
                              </span>
                              <span className="text-xs text-slate-400">net</span>
                            </div>
                          </div>
                          <div className="text-xs text-slate-400">
                            <span className="text-slate-300">{farmState.lastYearData.totalHarvest}u</span> {farmState.lastYearData.cropsMostGrown}
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCard('last_year')}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {expandedCard === 'last_year' ? 'Less' : 'Details'}
                          <span className={`transform transition-transform ${expandedCard === 'last_year' ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                      </div>

                      {/* Expanded Details */}
                      {expandedCard === 'last_year' && (
                        <div className="mt-3 pt-3 border-t border-slate-600/30 grid grid-cols-3 gap-2">
                          <div className="bg-slate-700/30 rounded px-2 py-1.5">
                            <div className="text-[9px] text-slate-500 mb-0.5">Revenue</div>
                            <div className="text-xs text-emerald-400 font-semibold">{farmState.lastYearData.revenue}¢</div>
                          </div>
                          <div className="bg-slate-700/30 rounded px-2 py-1.5">
                            <div className="text-[9px] text-slate-500 mb-0.5">Expenses</div>
                            <div className="text-xs text-red-400/70 font-semibold">{farmState.lastYearData.expenses}¢</div>
                          </div>
                          <div className="bg-slate-700/30 rounded px-2 py-1.5">
                            <div className="text-[9px] text-slate-500 mb-0.5">Margin</div>
                            <div className="text-xs text-slate-300 font-semibold">
                              {Math.round((farmState.lastYearData.profit / farmState.lastYearData.revenue) * 100)}%
                            </div>
                          </div>
                          {(farmState.lastYearData.weatherEvents.length > 0 || farmState.lastYearData.crisisEvents.length > 0) && (
                            <div className="col-span-3 pt-2 border-t border-slate-600/20">
                              <div className="text-[9px] text-slate-500 mb-1">Events</div>
                              <div className="flex flex-wrap gap-1">
                                {farmState.lastYearData.weatherEvents.map((evt, i) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-blue-900/20 border border-blue-700/30 rounded text-blue-300 capitalize">{evt}</span>
                                ))}
                                {farmState.lastYearData.crisisEvents.map((evt, i) => (
                                  <span key={i} className="text-[10px] px-1.5 py-0.5 bg-red-900/20 border border-red-700/30 rounded text-red-300 capitalize">{evt}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Expandable Info Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Primary Crop Card - Expandable */}
                  <button
                    onClick={() => toggleCard('crop')}
                    className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-5 border border-slate-500/40 transition-all text-left"
                  >
                    {primaryCrop !== 'none' ? (
                      <>
                        {/* Header - Left aligned */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-xs text-slate-500 uppercase tracking-wide">Primary Crop</div>
                          <div className={`transform transition-transform text-slate-500 ${expandedCard === 'crop' ? 'rotate-180' : ''}`}>
                            <span className="text-sm">▼</span>
                          </div>
                        </div>

                        {/* Crop name and emoji with info to right */}
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-4xl">{CROP_EMOJIS[primaryCrop] || '🌱'}</span>
                          <div className="flex-1">
                            <div className="text-lg font-bold text-emerald-400 capitalize mb-1">
                              {CROP_DATA[primaryCrop]?.name || primaryCrop}
                            </div>
                            {!CROP_DATA[primaryCrop] && (
                              <p className="text-sm text-slate-400">
                                Cultivation info not yet available
                              </p>
                            )}
                          </div>
                        </div>

                        {CROP_DATA[primaryCrop] ? (
                          <>
                            {/* Description */}
                            <p className="text-xs text-slate-400 leading-relaxed mb-3">{CROP_DATA[primaryCrop].description}</p>

                        {/* Key Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-slate-800/40 rounded px-2.5 py-2 border border-slate-700/30">
                            <div className="text-[10px] text-slate-500 mb-0.5">Best Planting</div>
                            <div className="text-xs text-slate-200 font-medium">{formatPlantingSeason(CROP_DATA[primaryCrop].bestPlantingMonths)}</div>
                          </div>
                          <div className="bg-slate-800/40 rounded px-2.5 py-2 border border-slate-700/30">
                            <div className="text-[10px] text-slate-500 mb-0.5">Growth Time</div>
                            <div className="text-xs text-slate-200 font-medium">{CROP_DATA[primaryCrop].growthDays} days</div>
                          </div>
                          <div className="bg-slate-800/40 rounded px-2.5 py-2 border border-slate-700/30">
                            <div className="text-[10px] text-slate-500 mb-0.5">Water Needs</div>
                            <div className={`text-xs font-medium capitalize ${
                              CROP_DATA[primaryCrop].waterNeeds === 'high' ? 'text-blue-400' :
                              CROP_DATA[primaryCrop].waterNeeds === 'moderate' ? 'text-sky-400' : 'text-slate-400'
                            }`}>{CROP_DATA[primaryCrop].waterNeeds}</div>
                          </div>
                          <div className="bg-slate-800/40 rounded px-2.5 py-2 border border-slate-700/30">
                            <div className="text-[10px] text-slate-500 mb-0.5">Fertilizer</div>
                            <div className={`text-xs font-medium capitalize ${
                              CROP_DATA[primaryCrop].fertilizerNeeds === 'high' ? 'text-amber-400' :
                              CROP_DATA[primaryCrop].fertilizerNeeds === 'moderate' ? 'text-yellow-400' : 'text-slate-400'
                            }`}>{CROP_DATA[primaryCrop].fertilizerNeeds}</div>
                          </div>
                        </div>

                        {/* Base Price */}
                        <div className="flex items-center justify-between bg-emerald-900/15 rounded px-3 py-2 border border-emerald-700/30">
                          <span className="text-xs text-slate-400">Base Market Price</span>
                          <span className="text-sm font-semibold text-emerald-400">{CROP_DATA[primaryCrop].basePrice}¢/unit</span>
                        </div>

                            {/* Expanded: Cultivation Tip */}
                            {expandedCard === 'crop' && CROP_DATA[primaryCrop].tip && (
                              <div className="mt-3 pt-3 border-t border-slate-700/30" onClick={(e) => e.stopPropagation()}>
                                <div className="bg-blue-900/10 border border-blue-700/20 rounded p-3">
                                  <div className="text-[10px] text-blue-400 uppercase tracking-wide mb-1.5 font-semibold">💡 Cultivation Tip</div>
                                  <p className="text-xs text-slate-300 leading-relaxed">{CROP_DATA[primaryCrop].tip}</p>
                                </div>
                              </div>
                            )}
                          </>
                        ) : null}
                      </>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">🌱</span>
                        <div>
                          <div className="text-xs text-slate-500 uppercase tracking-wide">Primary Crop</div>
                          <div className="text-lg font-semibold text-slate-400">No crop planted</div>
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Fields Card - Expandable */}
                  <button
                    onClick={() => toggleCard('fields')}
                    className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-5 border border-slate-500/40 transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Fields Status</div>
                      <div className={`transform transition-transform text-slate-500 ${expandedCard === 'fields' ? 'rotate-180' : ''}`}>
                        <span className="text-sm">▼</span>
                      </div>
                    </div>

                    {/* Visual Field Boxes centered with crop labels below */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      {farmState.fields.slice(0, 6).map((field, idx) => {
                        const cropEmoji = field.crop ? CROP_EMOJIS[field.crop] || '🌱' : '🟫';
                        const healthColor = field.crop && field.health > 70 ? 'border-emerald-500/50' :
                                           field.crop && field.health > 40 ? 'border-yellow-500/50' :
                                           field.crop ? 'border-red-500/50' : 'border-slate-600/30';
                        const cropName = field.crop ? (field.crop.charAt(0).toUpperCase() + field.crop.slice(1)) : 'Fallow';
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            <div className={`bg-slate-800/50 rounded-lg p-3 border-2 ${healthColor} w-16 h-16 flex items-center justify-center`}>
                              <div className="text-3xl">{cropEmoji}</div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1 capitalize">{cropName}</div>
                          </div>
                        );
                      })}
                      {farmState.fields.length > 6 && (
                        <div className="flex flex-col items-center">
                          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-600/30 w-16 h-16 flex items-center justify-center">
                            <span className="text-sm text-slate-400">+{farmState.fields.length - 6}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">More</div>
                        </div>
                      )}
                    </div>

                    {/* Expanded: Detailed Field Grid */}
                    {expandedCard === 'fields' && (
                      <div className="mt-3 pt-3 border-t border-slate-600/30" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-3 gap-2">
                          {farmState.fields.map((field, idx) => {
                            const cropEmoji = field.crop ? CROP_EMOJIS[field.crop] || '🌱' : '🟫';
                            const healthColor = field.health > 70 ? 'text-emerald-400' : field.health > 40 ? 'text-yellow-400' : 'text-red-400';
                            return (
                              <div key={idx} className="bg-slate-800/40 rounded p-2 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-2xl">{cropEmoji}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-[11px] text-slate-500">Field {idx + 1}</div>
                                    {field.crop && (
                                      <div className="text-xs text-slate-300 capitalize truncate">{field.crop}</div>
                                    )}
                                  </div>
                                </div>
                                {field.crop && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <span className="text-slate-500">Health</span>
                                    <span className={`font-medium ${healthColor}`}>{field.health}%</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Livestock Card - Expandable */}
                  <button
                    onClick={() => toggleCard('livestock')}
                    className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-5 border border-slate-500/40 transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Livestock</div>
                      <div className={`transform transition-transform text-slate-500 ${expandedCard === 'livestock' ? 'rotate-180' : ''}`}>
                        <span className="text-sm">▼</span>
                      </div>
                    </div>

                    {/* Centered Animal Visualization with bigger typography */}
                    <div className="flex items-center justify-center gap-6">
                      {farmState.livestock.slice(0, 4).map((animal, idx) => {
                        const emoji = animal.type.toLowerCase().includes('chicken') ? '🐔' :
                                     animal.type.toLowerCase().includes('cow') || animal.type.toLowerCase().includes('cattle') ? '🐄' :
                                     animal.type.toLowerCase().includes('goat') ? '🐐' :
                                     animal.type.toLowerCase().includes('sheep') ? '🐑' :
                                     animal.type.toLowerCase().includes('pig') ? '🐷' :
                                     animal.type.toLowerCase().includes('horse') ? '🐴' : '🐾';
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="text-4xl mb-2">{emoji}</div>
                            <div className="text-base font-bold text-amber-400">{animal.count}</div>
                            <div className="text-xs text-slate-300 capitalize">{animal.type}</div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Expanded: Detailed Stats */}
                    {expandedCard === 'livestock' && (
                      <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2" onClick={(e) => e.stopPropagation()}>
                        {farmState.livestock.map((animal, idx) => (
                          <div key={idx} className="bg-slate-800/40 rounded p-3 border border-slate-700/30">
                            <div className="text-xs font-medium text-slate-200 mb-2 capitalize">{animal.count} {animal.type}</div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-900/40 rounded px-2 py-1.5">
                                <div className="text-[10px] text-slate-500 mb-0.5">Health</div>
                                <div className={`text-xs font-medium ${animal.health > 70 ? 'text-emerald-400' : animal.health > 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {animal.health}%
                                </div>
                              </div>
                              <div className="bg-slate-900/40 rounded px-2 py-1.5">
                                <div className="text-[10px] text-slate-500 mb-0.5">Productivity</div>
                                <div className="text-xs font-medium text-blue-400">{animal.productivity}%</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Residents Card - Expandable */}
                  <button
                    onClick={() => toggleCard('residents')}
                    className="bg-slate-700/40 hover:bg-slate-700/60 rounded-lg p-5 border border-slate-500/40 transition-all text-left"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-xs text-slate-500 uppercase tracking-wide">Household Members</div>
                      <div className={`transform transition-transform text-slate-500 ${expandedCard === 'residents' ? 'rotate-180' : ''}`}>
                        <span className="text-sm">▼</span>
                      </div>
                    </div>

                    {/* Centered Member portraits with bigger names and roles */}
                    <div className="flex items-center justify-center gap-6">
                      {farmState.family.members.slice(0, 4).map((member, idx) => {
                        return (
                          <div key={idx} className="flex flex-col items-center">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800/50 border-2 border-purple-500/30 mb-2">
                              <ProceduralPortrait
                                character={{
                                  name: member.name,
                                  gender: member.gender,
                                  age: member.age,
                                  ethnicity: playerCharacter.ethnicity || 'Mixed',
                                  profession: member.role || 'Farmer',
                                }}
                                size={48}
                                culturalZone={culturalZone}
                                era={era}
                              />
                            </div>
                            <div className="text-sm font-bold text-purple-400 truncate max-w-[80px]">{member.name.split(' ')[0]}</div>
                            <div className="text-xs text-slate-400 capitalize">{member.role || 'Farmer'}</div>
                            <div className="text-[10px] text-slate-500">{member.age}y</div>
                          </div>
                        );
                      })}
                      {farmState.family.members.length > 4 && (
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-slate-800/50 border-2 border-purple-500/30 flex items-center justify-center mb-2">
                            <span className="text-lg text-slate-400">+{farmState.family.members.length - 4}</span>
                          </div>
                          <div className="text-xs text-slate-400">More</div>
                        </div>
                      )}
                    </div>

                    {/* Expanded: Full Details with Roles */}
                    {expandedCard === 'residents' && (
                      <div className="mt-3 pt-3 border-t border-slate-700/30 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                        {farmState.family.members.map((member, idx) => (
                          <div key={idx} className="bg-slate-800/40 rounded p-2.5 border border-slate-700/30">
                            <div className="text-xs font-medium text-slate-200 mb-1">{member.name}</div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500">Age {member.age}</span>
                              {member.role && (
                                <span className="text-emerald-400 capitalize">{member.role}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ================= FARM WORK (Text Adventure) ================= */}
            {activeTab === 'fields' && (
              <div className="animate-fadeIn flex gap-4 h-full">
                {/* Left Sidebar - Field Status & Action Log */}
                <div className="w-64 flex flex-col gap-4">
                  {/* Head Farmer Info */}
                  <button
                    onClick={() => toggleSection('head_farmer')}
                    className="w-full bg-slate-900/50 hover:bg-slate-900/70 rounded-xl p-4 border border-slate-800/60 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">👨‍🌾</span>
                        <div>
                          <h3 className="text-base font-semibold text-amber-400">Head Farmer</h3>
                          <p className="text-sm text-slate-400">{headFarmer?.name || farmState.family.headOfHousehold}</p>
                        </div>
                      </div>
                      <div className={`transform transition-transform ${expandedSections.has('head_farmer') ? 'rotate-180' : ''}`}>
                        <span className="text-slate-500">▼</span>
                      </div>
                    </div>
                    {expandedSections.has('head_farmer') && (
                      <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Age:</span>
                          <span className="ml-2 text-slate-200">{headFarmer?.age || 'Unknown'}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Role:</span>
                          <span className="ml-2 text-slate-200">{headFarmer?.role || 'Farmer'}</span>
                        </div>
                        {headFarmer && (
                          <div className="col-span-2">
                            <span className="text-slate-500">Personality:</span>
                            <span className="ml-2 text-slate-200">{headFarmer.personality || 'Hardworking and practical'}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>

                  {/* Field Details */}
                  <button
                    onClick={() => toggleSection('fields')}
                    className="w-full bg-slate-900/50 hover:bg-slate-900/70 rounded-xl p-4 border border-slate-800/60 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Wheat className="w-6 h-6 text-emerald-400" />
                        <div>
                          <h3 className="text-base font-semibold text-emerald-400">Field Layout</h3>
                          <p className="text-sm text-slate-400">{farmState.fields.length} total fields</p>
                        </div>
                      </div>
                      <div className={`transform transition-transform ${expandedSections.has('fields') ? 'rotate-180' : ''}`}>
                        <span className="text-slate-500">▼</span>
                      </div>
                    </div>
                    {expandedSections.has('fields') && (
                      <div className="mt-4 pt-4 border-t border-slate-800/60">
                        <div className="grid grid-cols-4 gap-2">
                          {farmState.fields.map((field, idx) => {
                            const cropEmoji = field.crop ? CROP_EMOJIS[field.crop] || '🌱' : '🟫';
                            return (
                              <div key={idx} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/40 text-center">
                                <div className="text-2xl mb-1">{cropEmoji}</div>
                                <div className="text-[10px] text-slate-500 mb-1">Field {idx + 1}</div>
                                <div className="text-xs text-slate-300 capitalize">{field.crop || 'Fallow'}</div>
                                {field.crop && (
                                  <div className="mt-2 space-y-1">
                                    <div className="flex justify-between text-[9px]">
                                      <span className="text-slate-500">Health</span>
                                      <span className={field.health > 70 ? 'text-green-400' : field.health > 40 ? 'text-yellow-400' : 'text-red-400'}>
                                        {field.health}%
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-[9px]">
                                      <span className="text-slate-500">Stage</span>
                                      <span className="text-slate-300 capitalize">{field.growthStage}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </button>

                  {/* Livestock Details */}
                  <button
                    onClick={() => toggleSection('livestock')}
                    className="w-full bg-slate-900/50 hover:bg-slate-900/70 rounded-xl p-4 border border-slate-800/60 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🐄</span>
                        <div>
                          <h3 className="text-base font-semibold text-amber-400">Livestock</h3>
                          <p className="text-sm text-slate-400">{farmState.livestock.length} types of animals</p>
                        </div>
                      </div>
                      <div className={`transform transition-transform ${expandedSections.has('livestock') ? 'rotate-180' : ''}`}>
                        <span className="text-slate-500">▼</span>
                      </div>
                    </div>
                    {expandedSections.has('livestock') && (
                      <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-3">
                        {farmState.livestock.map((animal, idx) => (
                          <div key={idx} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/40">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-200 capitalize">{animal.type}</span>
                              <span className="text-lg font-bold text-slate-100">{animal.count}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex justify-between">
                                <span className="text-slate-500">Health</span>
                                <span className={animal.health > 70 ? 'text-green-400' : animal.health > 40 ? 'text-yellow-400' : 'text-red-400'}>
                                  {animal.health}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-500">Productivity</span>
                                <span className="text-sky-400">{animal.productivity}%</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </button>

                  {/* Residents Details */}
                  <button
                    onClick={() => toggleSection('residents')}
                    className="w-full bg-slate-900/50 hover:bg-slate-900/70 rounded-xl p-4 border border-slate-800/60 transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="w-6 h-6 text-purple-400" />
                        <div>
                          <h3 className="text-base font-semibold text-purple-400">Household</h3>
                          <p className="text-sm text-slate-400">{farmState.family.members.length} family members</p>
                        </div>
                      </div>
                      <div className={`transform transition-transform ${expandedSections.has('residents') ? 'rotate-180' : ''}`}>
                        <span className="text-slate-500">▼</span>
                      </div>
                    </div>
                    {expandedSections.has('residents') && (
                      <div className="mt-4 pt-4 border-t border-slate-800/60 grid grid-cols-2 gap-3">
                        {farmState.family.members.map((member, idx) => (
                          <div key={idx} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/40">
                            <div className="text-sm font-medium text-slate-200 mb-1">{member.name}</div>
                            <div className="text-xs text-slate-400">Age {member.age}</div>
                            {member.role && (
                              <div className="text-xs text-emerald-400 mt-1 capitalize">{member.role}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ================= FARM WORK (Text Adventure) ================= */}
            {activeTab === 'fields' && (
              <div className="animate-fadeIn flex gap-4 h-full">
                {/* Left Sidebar - Field Status & Action Log */}
                <div className="w-64 flex flex-col gap-4">
                  {/* Compact Field Display */}
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
                    <h4 className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">Fields</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {farmState.fields.slice(0, 8).map((field, idx) => {
                        const cropEmoji = field.crop ? CROP_EMOJIS[field.crop] || '🌱' : '🟫';
                        const healthColor = field.health > 70 ? 'text-green-400' : field.health > 40 ? 'text-yellow-400' : 'text-red-400';
                        return (
                          <div key={idx} className="bg-slate-800/40 rounded p-2 text-center border border-slate-700/40">
                            <div className="text-2xl mb-1">{cropEmoji}</div>
                            <div className="text-[9px] text-slate-500">Field {idx + 1}</div>
                            <div className={`text-[9px] font-medium ${healthColor}`}>
                              {field.crop ? `${field.health}%` : 'Empty'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Available Resources (Crops in Spring/Winter, Tools in Summer/Fall) */}
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60">
                    <h4 className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">
                      {season === 'Spring' || season === 'Winter' ? 'Available Crops' : 'Available Tools'}
                    </h4>
                    <div className="space-y-1">
                      {season === 'Spring' || season === 'Winter' ? (
                        // Show crop counts
                        validCrops.map((crop) => {
                          const emoji = CROP_EMOJIS[crop] || '🌱';
                          // Count from player inventory (simplified - showing as available)
                          return (
                            <div key={crop} className="flex items-center justify-between text-[10px] text-slate-300">
                              <span className="flex items-center gap-1">
                                <span>{emoji}</span>
                                <span className="capitalize">{crop}</span>
                              </span>
                              <span className="text-slate-500">Available</span>
                            </div>
                          );
                        })
                      ) : (
                        // Show tools for tending fields in Summer/Fall
                        <>
                          <div className="flex items-center justify-between text-[10px] text-slate-300">
                            <span className="flex items-center gap-1">
                              <Droplets className="w-3 h-3" />
                              <span>Water bucket</span>
                            </span>
                            <span className="text-slate-500">Ready</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-300">
                            <span className="flex items-center gap-1">
                              <Pickaxe className="w-3 h-3" />
                              <span>Hoe</span>
                            </span>
                            <span className="text-slate-500">Ready</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-300">
                            <span className="flex items-center gap-1">
                              <Wheat className="w-3 h-3" />
                              <span>Scythe</span>
                            </span>
                            <span className="text-slate-500">Ready</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Log */}
                  <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/60 flex-1">
                    <h4 className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wide">Recent Actions</h4>
                    <div className="space-y-2">
                      {farmActionLog.length === 0 ? (
                        <div className="text-[10px] text-slate-500 italic">No actions yet today</div>
                      ) : (
                        farmActionLog.map((log, idx) => (
                          <div key={idx} className="text-[10px] text-slate-400 pb-2 border-b border-slate-800/40 last:border-0">
                            <div className="italic mb-1">"{log.action}"</div>
                            <div className="text-slate-500 flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {log.timeElapsed.toFixed(1)}h
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col">
                  {/* Header */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60 mb-4">
                    <h3 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2">
                      <Sprout className="w-5 h-5" />
                      A Day's Farm Work
                    </h3>
                    <p className="text-xs text-slate-400">
                      Enter commands to work the farm. Be specific! ({hoursWorkedToday.toFixed(1)} hours worked today)
                    </p>
                  </div>

                  {/* Conversation History */}
                  <div className="flex-1 bg-slate-900/30 rounded-xl p-4 border border-slate-800/60 overflow-y-auto mb-4 space-y-3">
                    {farmWorkHistory.map((entry, i) => (
                      <div
                        key={i}
                        className={`${
                          entry.type === 'player'
                            ? 'bg-blue-900/30 border-blue-700/40 ml-8'
                            : 'bg-slate-800/40 border-slate-700/40 mr-8'
                        } p-3 rounded-lg border`}
                      >
                        <div className="text-xs text-slate-500 mb-1">
                          {entry.type === 'player' ? 'You' : 'Narrator'}
                        </div>
                        <div className="text-sm text-slate-200">{entry.text}</div>
                      </div>
                    ))}
                    {isFarmWorkProcessing && (
                      <div className="bg-slate-800/40 border-slate-700/40 mr-8 p-3 rounded-lg border">
                        <div className="text-xs text-slate-500 mb-1">Narrator</div>
                        <div className="text-sm text-slate-400 italic">Considering your actions...</div>
                      </div>
                    )}
                  </div>

                  {/* Input Area */}
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800/60">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (farmWorkInput.trim() && !isFarmWorkProcessing) {
                          handleFarmWorkCommand(farmWorkInput);
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={farmWorkInput}
                        onChange={(e) => setFarmWorkInput(e.target.value)}
                        disabled={isFarmWorkProcessing || !useLlm}
                        placeholder={useLlm ? "What do you do? (e.g., 'plant wheat in field 1 carefully')" : "LLM disabled"}
                        className="flex-1 bg-slate-800/60 border border-slate-700/60 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                      <button
                        type="submit"
                        disabled={isFarmWorkProcessing || !useLlm || !farmWorkInput.trim()}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        {isFarmWorkProcessing ? 'Working...' : 'Do It'}
                      </button>
                    </form>
                    <div className="mt-2 text-[10px] text-slate-500">
                      Tip: Be detailed for better results. Commands like "carefully plant wheat seeds 2 inches deep in field 1, then water gently" work better than just "plant wheat"
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= FAMILY ================= */}
            {activeTab === 'family' && (
              <div className="animate-fadeIn space-y-6">
                {/* Members */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {farmState.family.members.map((member) => {
                    const healthPct =
                      (member.health / Math.max(1, member.maxHealth)) * 100;
                    const energyPct =
                      ((member.maxFatigue - member.fatigue) /
                        Math.max(1, member.maxFatigue)) *
                      100;
                    return (
                      <button
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className={`text-left bg-slate-900/60 rounded-xl p-4 border transition-all hover:shadow-lg ${
                          selectedMember?.id === member.id
                            ? 'border-amber-400 shadow-amber-900/20 scale-[1.01]'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-700">
                            <ProceduralPortrait
                              character={
                                {
                                  ...member,
                                  stats: {
                                    strength: member.skills?.strength || 10,
                                    intelligence: member.skills?.intelligence || 10,
                                    charisma: member.skills?.charisma || 10,
                                    constitution: member.skills?.constitution || 10,
                                  },
                                  appearance: member.appearance,
                                } as any
                              }
                              size={96}
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="text-white font-bold">{member.name}</h4>
                              <div className="text-xs text-slate-400">
                                {member.age} yrs • {member.role}
                              </div>
                            </div>

                            {/* Health */}
                            <div className="mt-2">
                              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                <span>Health</span>
                                <span>
                                  {member.health}/{member.maxHealth}
                                </span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-rose-500 to-rose-400"
                                  style={{ width: `${Math.max(0, Math.min(100, healthPct))}%` }}
                                />
                              </div>
                            </div>

                            {/* Energy */}
                            <div className="mt-2">
                              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                                <span>Energy</span>
                                <span>
                                  {member.maxFatigue - member.fatigue}/{member.maxFatigue}
                                </span>
                              </div>
                              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-sky-500 to-sky-400"
                                  style={{ width: `${Math.max(0, Math.min(100, energyPct))}%` }}
                                />
                              </div>
                            </div>

                            {/* Tags */}
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {member.skills?.slice(0, 4).map((s, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded text-[11px] bg-blue-600/25 text-blue-200 border border-blue-400/20"
                                  title={s.description}
                                >
                                  {s.name} ({s.level})
                                </span>
                              ))}
                              {member.traits?.slice(0, 3).map((t, i) => (
                                <span
                                  key={`t-${i}`}
                                  className={`px-2 py-0.5 rounded text-[11px] border ${
                                    t.type === 'positive'
                                      ? 'bg-emerald-600/20 text-emerald-200 border-emerald-400/20'
                                      : t.type === 'negative'
                                      ? 'bg-rose-600/20 text-rose-200 border-rose-400/20'
                                      : 'bg-slate-700/40 text-slate-200 border-slate-500/30'
                                  }`}
                                  title={t.description}
                                >
                                  {t.name}
                                </span>
                              ))}
                            </div>

                            {/* Task */}
                            {member.currentTask && (
                              <div className="mt-2 text-[11px] text-amber-300">
                                Currently: {member.currentTask}
                                {member.assignedField !== undefined &&
                                  ` (Field #${(member.assignedField as number) + 1})`}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Chat */}
                {selectedMember && (
                  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60 animate-slideUp">
                    <div className="flex items-center justify-between">
                      <h4 className="text-amber-400 font-bold flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Talk with {selectedMember.name}
                      </h4>
                      <label className="flex items-center gap-2 text-xs text-slate-300">
                        <input
                          type="checkbox"
                          className="accent-amber-400"
                          checked={useHistoricalLanguage}
                          onChange={(e) => setUseHistoricalLanguage(e.target.checked)}
                          disabled={!useLlm}
                        />
                        Historical language
                      </label>
                    </div>

                    {!useLlm && (
                      <div className="mt-2 text-xs text-slate-400">
                        LLM is disabled. Enable it to chat in-character.
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleFarmerChat()}
                        placeholder="Ask something..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        disabled={!useLlm || isChatting}
                      />
                      <button
                        onClick={handleFarmerChat}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all disabled:opacity-50"
                        disabled={!useLlm || isChatting || !chatInput.trim()}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {isChatting ? 'Asking…' : 'Ask'}
                      </button>
                    </div>

                    {farmerMessage && (
                      <div className="mt-3 bg-slate-800/70 rounded-lg p-3 text-slate-100 italic animate-fadeIn border border-slate-700">
                        “{farmerMessage}”
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ================= TRADE ================= */}
            {activeTab === 'trade' && (
              <div className="animate-fadeIn space-y-6">
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
                  <h4 className="text-amber-400 font-bold flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Market
                  </h4>

                  {/* Buy seeds */}
                  <div className="mt-4">
                    <h5 className="text-slate-200 font-semibold text-sm mb-2 flex items-center gap-2">
                      <HandCoins className="w-4 h-4" />
                      Buy Seeds
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {validCrops.slice(0, 8).map((crop) => {
                        const price = Math.max(1, Math.floor(5 * seedPriceMultiplier));
                        return (
                          <button
                            key={`seed-${crop}`}
                            onClick={() => onBuy(`${crop}_seed`, price)}
                            className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200"
                          >
                            <span className="flex items-center gap-2">
                              <Sprout className="w-4 h-4 text-emerald-300" />
                              <span className="capitalize text-sm">{crop} seed</span>
                            </span>
                            <span className="text-xs text-amber-300">{price}¢</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sell harvest */}
                  <div className="mt-6">
                    <h5 className="text-slate-200 font-semibold text-sm mb-2 flex items-center gap-2">
                      <Wheat className="w-4 h-4" />
                      Sell Harvest
                    </h5>
                    {Object.keys(harvestLedger).length === 0 ? (
                      <div className="text-xs text-slate-400">
                        No recorded harvest yet. Harvest mature fields to add produce here.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {Object.entries(harvestLedger).map(([crop, qty]) => {
                          const pricePer = 3; // simple flat price; plug in economy later
                          const total = qty * pricePer;
                          return (
                            <div
                              key={`sell-${crop}`}
                              className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg px-3 py-2"
                            >
                              <div className="flex items-center gap-3">
                                <div className="text-xl">{CROP_EMOJIS[crop] || '🌾'}</div>
                                <div className="text-sm text-slate-200 capitalize">{crop}</div>
                                <div className="text-xs text-slate-400">x{qty}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-xs text-amber-300">{total}¢</div>
                                <button
                                  onClick={useCallback(() => {
                                    // Create an Item for sale
                                    const item: Item = {
                                      id: `harvest-${crop}-${Date.now()}`,
                                      baseId: crop.toUpperCase().replace(/\s+/g, '_'),
                                      name: crop,
                                      description: `Freshly harvested ${crop}.`,
                                      emoji: CROP_EMOJIS[crop] || '🌾',
                                      rarity: 'Common',
                                      value: total,
                                      weight: qty * 0.2,
                                      attack: 0,
                                      wearable: false,
                                      stackable: true,
                                      quantity: qty,
                                      sustenance: 0,
                                      wieldable: false,
                                      throwable: false,
                                      craftingValue: 1,
                                      category: 'Food',
                                    };
                                    onSell(item, total);
                                    setHarvestLedger((prev) => {
                                      const next = { ...prev };
                                      delete next[crop];
                                      return next;
                                    });
                                  }, [crop, onSell])}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-white text-xs"
                                >
                                  Sell
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= ADVISOR ================= */}
            {activeTab === 'advisor' && (
              <div className="animate-fadeIn space-y-6">
                <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-amber-400 font-bold flex items-center gap-2">
                      <ScrollText className="w-4 h-4" />
                      Farm Advisor
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <CalendarClock className="w-4 h-4" />
                      {season} {year} • {mapData.localArea || mapData.continent}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mt-3">
                    <button
                      onClick={runAdvisorSummary}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs border border-slate-700"
                    >
                      <Brain className="w-4 h-4" />
                      {isAdvisorBusy ? 'Working…' : 'Get Historical Summary'}
                    </button>
                    {advisorSummary && (
                      <div className="mt-3 text-sm text-slate-200 bg-slate-950/70 border border-slate-800 rounded p-3">
                        {advisorSummary}
                      </div>
                    )}
                  </div>

                  {/* Advisor chat */}
                  <div className="mt-6">
                    <div className="text-xs text-slate-400 mb-2">
                      Ask the village elder for advice about farming, politics, dangers, or trade.
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={advisorChat}
                        onChange={(e) => setAdvisorChat(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && runAdvisorChat()}
                        placeholder="e.g., “Which crop should I plant before winter?”"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                        disabled={!useLlm || isAdvisorBusy}
                      />
                      <button
                        onClick={runAdvisorChat}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all disabled:opacity-50"
                        disabled={!useLlm || isAdvisorBusy || !advisorChat.trim()}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Ask
                      </button>
                    </div>
                    {advisorLog.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {advisorLog.map((line, i) => (
                          <div
                            key={i}
                            className={`text-sm ${
                              line.startsWith('You:')
                                ? 'text-slate-300'
                                : 'text-emerald-200'
                            }`}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                    )}
                    {!useLlm && (
                      <div className="mt-2 text-xs text-slate-400">
                        LLM is disabled. Enable it to chat with the advisor.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel — Player + Time */}
        <div
          className="keep-dark bg-gradient-to-b from-slate-950 to-black border-l border-slate-800/60 flex flex-col flex-shrink-0"
          style={{ width: PANEL_RIGHT_W }}
        >
          <PlayerProfileCard playerCharacter={playerCharacter} showActions={false} />
          <div className="h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mx-4" />

          <div className="flex-1 p-4 overflow-y-auto">
            <h3 className="text-base font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Time & Seasons
            </h3>

            <div className="bg-slate-900/60 rounded-lg p-3 mb-3 border border-slate-800/60 text-slate-200">
              <div className="flex items-center justify-between">
                <div className="text-sm capitalize">
                  {season} {year}
                </div>
                <div className="text-xs text-slate-400">
                  Day {currentGameDay} • {timeOfDay}
                </div>
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {formatDateWithSeason(gameDate, season)}
              </div>
            </div>

            {/* Crop progress small list */}
            <div className="bg-slate-900/60 rounded-lg p-3 mb-4 border border-slate-800/60">
              <h4 className="text-amber-300 font-medium mb-2 text-sm">Crop Progress</h4>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {farmState.fields.filter((f) => f.crop).length === 0 && (
                  <div className="text-xs text-slate-400 italic">No crops planted</div>
                )}
                {farmState.fields
                  .filter((f) => f.crop)
                  .map((f) => (
                    <div key={`mini-${f.id}`} className="text-xs">
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span className="flex items-center gap-1">
                          <span className="text-sm">{CROP_EMOJIS[f.crop!] || '🌱'}</span>
                          Field #{f.id + 1}
                        </span>
                        <span className="text-slate-400">{f.growthStage}</span>
                      </div>
                      <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400"
                          style={{
                            width: `${
                              f.growthStage === 'mature'
                                ? 100
                                : f.growthStage === 'growing'
                                ? 66
                                : f.growthStage === 'sprouting'
                                ? 33
                                : 10
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Worker Status or Time Controls */}
            {isWorker ? (
              <div className="space-y-3">
                {/* Trust Progress */}
                <div className="bg-gradient-to-r from-blue-900/30 to-slate-900/30 p-3 rounded-lg border border-blue-700/40">
                  <h4 className="text-blue-300 font-medium mb-2 text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Worker Status
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Trust Level</span>
                      <span className="text-blue-300">{trustLevel}/100</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
                        style={{ width: `${trustLevel}%` }}
                      />
                    </div>

                    {currentContract && (
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>Contract: {currentContract.daysRemaining} days left</div>
                        <div>Payment: {currentContract.payment.meals ? 'Meals ' : ''}{currentContract.payment.lodging ? 'Lodging ' : ''}{currentContract.payment.coins ? `${currentContract.payment.coins} coins` : ''}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Work Quality Score */}
                {workQualityScore !== null && (
                  <div className="bg-gradient-to-r from-green-900/30 to-slate-900/30 p-3 rounded-lg border border-green-700/40">
                    <h4 className="text-green-300 font-medium mb-2 text-sm">Last Work Quality</h4>
                    <div className="text-2xl font-bold text-center">
                      <span className={`${
                        workQualityScore >= 75 ? 'text-green-400' :
                        workQualityScore >= 50 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {workQualityScore}/100
                      </span>
                    </div>
                  </div>
                )}

                {/* Detailed Assessment Results */}
                {lastAssessment && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/30 p-3 rounded-lg border border-purple-700/40">
                    <h4 className="text-purple-300 font-medium mb-3 text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      Detailed Assessment
                    </h4>

                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400">Strategy:</span>
                          <span className="text-purple-300 ml-1">{lastAssessment.detailedAssessment.strategyQuality}/100</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Resources:</span>
                          <span className="text-purple-300 ml-1">{lastAssessment.detailedAssessment.resourceAllocation}/100</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Cultural:</span>
                          <span className="text-purple-300 ml-1">{lastAssessment.detailedAssessment.culturalAccuracy}/100</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Adaptation:</span>
                          <span className="text-purple-300 ml-1">{lastAssessment.detailedAssessment.adaptationToConditions}/100</span>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-purple-700/30">
                        <span className="text-slate-400">Trust Change:</span>
                        <span className={`ml-1 font-medium ${
                          lastAssessment.trustChange > 0 ? 'text-green-400' :
                          lastAssessment.trustChange < 0 ? 'text-red-400' :
                          'text-slate-300'
                        }`}>
                          {lastAssessment.trustChange > 0 ? '+' : ''}{lastAssessment.trustChange}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan & Work Button */}
                <button
                  onClick={() => {
                    if (fieldPlans.size === 0) {
                      alert('Please plan work for at least one field!');
                      return;
                    }
                    setShowPlanningModal(true);
                  }}
                  disabled={fieldPlans.size === 0}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-sm font-semibold border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Hammer className="w-4 h-4" />
                  Plan & Work 1 Month
                </button>

                <div className="text-xs text-center text-slate-400">
                  Planned fields: {fieldPlans.size}/{farmState?.fields?.length || 0}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="text-amber-300 font-medium mb-2 text-sm">Progress Time</h4>
                <button
                  onClick={() => progressFarmTime(1)}
                  className="w-full px-3 py-2 bg-slate-900/60 hover:bg-slate-800/60 text-slate-200 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-medium border border-slate-800/60"
                >
                  <Timer className="w-4 h-4" />
                  1 Month
                </button>
                <button
                  onClick={() => progressFarmTime(3)}
                  className="w-full px-3 py-2 bg-slate-900/60 hover:bg-slate-800/60 text-slate-200 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-medium border border-slate-800/60"
                >
                  <Timer className="w-4 h-4" />
                  3 Months (1 Season)
                </button>
                <button
                  onClick={() => progressFarmTime(6)}
                  className="w-full px-3 py-2 bg-slate-900/60 hover:bg-slate-800/60 text-slate-200 rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-medium border border-slate-800/60"
                >
                  <Timer className="w-4 h-4" />
                  6 Months
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Head Farmer Toast - Render based on conditions but with stable rendering */}
      {headFarmer && (activeTab === 'overview' || (activeTab === 'farm_work' && farmerToast)) && (
        <NPCToast
          character={{...headFarmer, culturalZone: culturalZone}}
          message={farmerToast?.message || ''}
          type={farmerToast?.type || 'greeting'}
          position="bottom"
          onClose={() => setFarmerToast(null)}
          playerCharacter={playerCharacter}
          mapData={mapData}
          npcs={npcs}
          persistent={activeTab === 'overview'}
          enableLLMChat={activeTab === 'overview'}
          farmProsperity={activeTab === 'overview' ? (farmState?.economicStatus || 'humble') : undefined}
          era={activeTab === 'overview' ? (mapData?.dateInfo?.era || 'MEDIEVAL') : undefined}
          isFarmContext={activeTab === 'overview'}
          gameTimeHours={activeTab === 'overview' ? gameTimeHours : undefined}
          onInitiateEncounter={activeTab === 'overview' ? handleInitiateEncounter : undefined}
          autoHideDelay={activeTab === 'farm_work' ? 10000 : undefined}
          onRequestRest={activeTab === 'overview' ? (fee) => {
            // Handle rest request
            const coinItem = playerCharacter.inventory?.find(i => i.id === 'COIN');
            const coinAmount = coinItem?.quantity || 0;

            if (coinAmount >= fee) {
              // Start fade transition
              setIsTransitioning(true);

              // Deduct coins after a short delay
              setTimeout(() => {
                // Remove coins from inventory
                if (onSell && coinItem && fee > 0) {
                  // Use onSell with negative price to deduct coins
                  const updatedCoin = { ...coinItem, quantity: (coinItem.quantity || 0) - fee };
                  if (updatedCoin.quantity <= 0) {
                    // Remove coin item entirely if none left
                    playerCharacter.inventory = playerCharacter.inventory?.filter(i => i.id !== 'COIN') || [];
                  } else {
                    // Update coin quantity
                    const itemIndex = playerCharacter.inventory?.findIndex(i => i.id === 'COIN') || -1;
                    if (itemIndex >= 0 && playerCharacter.inventory) {
                      playerCharacter.inventory[itemIndex] = updatedCoin;
                    }
                  }
                }

                // Progress time to next morning (6am)
                if (onProgressTime) {
                  const hoursToMorning = gameTimeHours <= 6 ? (6 - gameTimeHours) : (24 - gameTimeHours + 6);
                  onProgressTime(hoursToMorning / 24); // Convert hours to fraction of day
                }

                // Update residency status
                if (farmState) {
                  updateResidencyStatus(farmState.tileKey, {
                    playerStatus: 'guest',
                    lastRestDate: currentGameDay + 1,
                    trustLevel: Math.min(100, (farmState.residencyStatus?.trustLevel || 50) + 5)
                  });

                  // Update local state
                  setFarmState({
                    ...farmState,
                    residencyStatus: {
                      ...farmState.residencyStatus,
                      playerStatus: 'guest',
                      lastRestDate: currentGameDay + 1,
                      trustLevel: Math.min(100, (farmState.residencyStatus?.trustLevel || 50) + 5)
                    } as FarmResidencyStatus
                  });
                }

                // After time skip, show morning interaction
                setTimeout(() => {
                  setIsTransitioning(false);
                  // Generate morning message based on prosperity
                  const morningOffer = farmState?.economicStatus === 'wealthy' || farmState?.economicStatus === 'prosperous'
                    ? "Good morning! Sleep well? We could use an extra pair of hands today. I can offer meals, lodging, and a few coins for honest work. Interested?"
                    : "Morning! Hope you slept alright. We're a bit short-handed today. Can't offer much beyond meals and a bed, but the work's honest. What do you say?";

                  setFarmerToast({
                    message: morningOffer,
                    type: 'quest'
                  });
                  // The NPCToast will now show work offer buttons based on updated status
                }, 1000);
              }, 1000);
            } else {
              setFarmerToast({ message: "You don't have enough coins for lodging.", type: 'warning' });
            }
          } : undefined}
          onAcceptWork={activeTab === 'overview' ? (tasks, payment) => {
            // Apply the work contract
            if (farmState) {
              acceptWorkContract(farmState.tileKey, tasks, payment);

              // Update local state
              setFarmState({
                ...farmState,
                residencyStatus: {
                  ...farmState.residencyStatus,
                  playerStatus: 'worker',
                  currentContract: {
                    type: 'daily',
                    daysRemaining: 1,
                    payment,
                    requiredTasks: tasks,
                    tasksToday: tasks
                  }
                } as FarmResidencyStatus
              });

              // Show success message
              setFarmerToast({
                message: "Great! The work day starts at dawn. You can rest in the barn when you're done.",
                type: 'success'
              });
            }
          } : undefined}
          onRequestWork={activeTab === 'overview' ? () => {
            // Start work negotiation with context-aware offer
            const isGuest = farmState?.residencyStatus?.playerStatus === 'guest';
            const prosperity = farmState?.economicStatus;

            let offerMessage = "";
            if (isGuest) {
              // Player has already rested here, more welcoming
              offerMessage = prosperity === 'wealthy' || prosperity === 'prosperous'
                ? "Since you've been a good guest, I'll make you a fair offer. Help with today's chores - feeding animals, mending fences, and tending crops. You'll get three meals, a warm bed, and 5 coins. Deal?"
                : "You seem trustworthy enough. Today's work includes feeding the animals and fixing that broken fence. Can offer you meals and a place to sleep. That work for you?";
            } else {
              // First time visitor
              offerMessage = prosperity === 'wealthy' || prosperity === 'prosperous'
                ? "Alright, let's see... We need help with the harvest and the livestock. I can offer meals, lodging, and 5 coins for a full day's work. Interested?"
                : "We could use the help, though we can't pay much. Feed the animals, clear the weeds, mend the fence. In exchange: meals and a bed for the night. Fair?";
            }

            setFarmerToast({
              message: offerMessage,
              type: 'quest'
            });

            // Update residency status to track negotiation
            if (farmState) {
              updateResidencyStatus(farmState.tileKey, {
                negotiationRounds: 1
              });
            }
          } : undefined}
          onRequestResidency={activeTab === 'overview' ? () => {
            // Check if eligible for residency (worker status + high trust)
            const status = farmState?.residencyStatus;
            if (status?.playerStatus === 'worker' && (status?.trustLevel || 0) >= 75) {
              setFarmerToast({
                message: "You've proven yourself to be reliable. We'd be happy to have you stay on as part of the farm family. You'll have your own quarters and share in the harvest.",
                type: 'success'
              });

              // Update to resident status
              if (farmState) {
                updateResidencyStatus(farmState.tileKey, {
                  playerStatus: 'resident',
                  trustLevel: 100
                });

                setFarmState({
                  ...farmState,
                  residencyStatus: {
                    ...farmState.residencyStatus,
                    playerStatus: 'resident',
                    trustLevel: 100
                  } as FarmResidencyStatus
                });
              }
            } else if (status?.playerStatus === 'worker') {
              setFarmerToast({
                message: `You need to earn more of our trust before we can offer you permanent residency. Keep working hard! (Trust: ${status?.trustLevel || 0}/75)`,
                type: 'info'
              });
            } else {
              setFarmerToast({
                message: "You'd need to work for us first before we'd consider that. Start by helping with the daily chores.",
                type: 'warning'
              });
            }
          } : undefined}
          onLeave={activeTab === 'overview' ? () => {
            onClose(); // Close the farm panel when leaving
          } : undefined}
          onRefuse={activeTab === 'overview' ? () => {
            console.log('Player refuses to leave');
            // The NPCToast will handle combat initiation if needed
          } : undefined}
        />
      )}

      {/* Worker Planning Modal */}
      {showPlanningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-blue-300 mb-4 flex items-center gap-2">
              <Hammer className="w-5 h-5" />
              Explain Your {season.charAt(0).toUpperCase() + season.slice(1)} Work Plan
            </h3>

            <div className="space-y-4">
              {/* Summary of planned actions */}
              <div className="bg-slate-800/50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Your Planned Actions:</h4>
                <div className="space-y-1 text-xs">
                  {Array.from(fieldPlans.entries()).map(([fieldId, plan]) => (
                    <div key={fieldId} className="flex justify-between text-slate-400">
                      <span>Field {fieldId + 1}:</span>
                      <span className="capitalize">
                        {plan.action}
                        {plan.waterAmount > 0 && ` • ${plan.waterAmount} water`}
                        {plan.manureAmount > 0 && ` • manure`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Strategy explanation */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Explain your strategy and reasoning (20-300 characters):
                </label>
                <textarea
                  value={strategyText}
                  onChange={(e) => setStrategyText(e.target.value)}
                  placeholder={`For ${season} farming, I plan to... Explain why you chose these actions, how you allocated resources, and what you expect the outcomes to be.`}
                  className="w-full h-24 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 text-sm placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  maxLength={300}
                />
                <div className="text-xs text-slate-500 mt-1">
                  {strategyText.length}/300 characters • Minimum 20
                </div>
              </div>

              {/* Seasonal guidance */}
              <div className="bg-amber-900/20 border border-amber-700/40 p-3 rounded-lg">
                <div className="text-xs text-amber-300">
                  <strong>{season.charAt(0).toUpperCase() + season.slice(1)} Focus:</strong> {{
                    spring: "Focus on crop selection and planting decisions. Consider soil preparation.",
                    summer: "Prioritize water and fertilizer allocation. Monitor plant health.",
                    autumn: "Plan harvest timing and storage. Consider which crops to harvest vs leave.",
                    winter: "Focus on field rotation and preparation for next year's planting."
                  }[season] || "Plan your farming strategy carefully."}
                </div>
              </div>
            </div>

            {/* Modal buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPlanningModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleWorkerSubmit}
                disabled={strategyText.trim().length < 20 || isAssessing}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                {isAssessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Assessing Work...
                  </>
                ) : (
                  <>
                    <Hammer className="w-4 h-4" />
                    Submit Work Plan
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Inspection Modal */}
      {inspectedField !== null && farmState?.fields && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {(() => {
              const field = farmState.fields.find(f => f.id === inspectedField);
              if (!field) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-300 flex items-center gap-2">
                      <Sprout className="w-5 h-5" />
                      Field #{inspectedField + 1} Inspection
                    </h3>
                    <button
                      onClick={() => setInspectedField(null)}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Crop Info */}
                    {field.crop ? (
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                          <span className="text-lg">{CROP_EMOJIS[field.crop] || '🌱'}</span>
                          {field.crop.charAt(0).toUpperCase() + field.crop.slice(1)}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-slate-400">Growth Stage:</span>
                            <span className="text-green-300 ml-2 capitalize">{field.growthStage}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">Days to Harvest:</span>
                            <span className="text-blue-300 ml-2">{field.daysToHarvest || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                        <div className="text-slate-400 text-sm">Field is currently fallow</div>
                      </div>
                    )}

                    {/* Soil & Conditions */}
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-amber-400 font-semibold mb-2">Soil Conditions</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-slate-400">Moisture:</span>
                          <span className={`ml-2 capitalize ${
                            field.moisture === 'wet' ? 'text-blue-300' :
                            field.moisture === 'moist' ? 'text-green-300' :
                            'text-orange-300'
                          }`}>
                            {field.moisture}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Health:</span>
                          <span className={`ml-2 ${
                            field.health >= 8 ? 'text-green-300' :
                            field.health >= 5 ? 'text-yellow-300' :
                            'text-red-300'
                          }`}>
                            {field.health}/10
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Issues */}
                    {(field.pests || field.weeds) && (
                      <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4">
                        <h4 className="text-red-400 font-semibold mb-2">⚠️ Issues Detected</h4>
                        <div className="space-y-1 text-sm">
                          {field.pests && (
                            <div className="text-red-300">🐛 Pests present - consider treatment</div>
                          )}
                          {field.weeds && (
                            <div className="text-orange-300">🌿 Weeds detected - needs weeding</div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-slate-400">
                          💡 Tip: Visit a marketplace to find pest treatments and farming tools
                        </div>
                      </div>
                    )}

                    {/* Worker Planning */}
                    {isWorker && fieldPlans.has(inspectedField) && (
                      <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4">
                        <h4 className="text-blue-300 font-semibold mb-2">📋 Your Plan</h4>
                        <div className="text-sm">
                          <div className="mb-1">
                            <span className="text-slate-400">Action:</span>
                            <span className="text-blue-300 ml-2 capitalize">{fieldPlans.get(inspectedField)!.action}</span>
                          </div>
                          {fieldPlans.get(inspectedField)!.waterAmount > 0 && (
                            <div className="mb-1">
                              <span className="text-slate-400">Water allocation:</span>
                              <span className="text-blue-300 ml-2">{fieldPlans.get(inspectedField)!.waterAmount}/3</span>
                            </div>
                          )}
                          {fieldPlans.get(inspectedField)!.manureAmount > 0 && (
                            <div>
                              <span className="text-slate-400">Manure:</span>
                              <span className="text-amber-300 ml-2">Applied</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      onClick={() => setInspectedField(null)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-all"
                    >
                      Close
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0 }
          to { opacity: 1 }
        }
        @keyframes slideUp {
          from { transform: translateY(8px); opacity:0 }
          to { transform: translateY(0); opacity:1 }
        }
        @keyframes pestCrawl {
          0% { transform: translate(0, 0); }
          25% { transform: translate(10px, 5px); }
          50% { transform: translate(5px, 15px); }
          75% { transform: translate(15px, 10px); }
          100% { transform: translate(0, 0); }
        }
        .animate-fadeIn { animation: fadeIn .25s ease-out }
        .animate-slideUp { animation: slideUp .25s ease-out }
      `}</style>
    </div>
  );
};

export default FarmPanelImproved;
