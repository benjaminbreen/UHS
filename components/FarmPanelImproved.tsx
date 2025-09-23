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
} from '../services/llmService';
import { parseDateString, formatDateWithSeason } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import { ProceduralPortrait } from './portraits';
import LeftSidebar from './LeftSidebar';
import PlayerProfileCard from './PlayerProfileCard';
import NPCToast from './NPCToast';
import { gameSounds } from '../services/gameSoundsService';

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

interface FarmPanelImprovedProps {
  tile: Tile;
  mapData: MapData;
  playerCharacter: PlayerCharacter;
  npcs: NpcEntity[];
  onClose: () => void;
  onBuy: (itemBaseId: string, price: number) => void;
  onSell: (item: Item, price: number) => void;
  season: Season;
  gameTimeHours: number;
  onProgressTime?: (months: number) => void;
  onShowEvent?: (event: any) => void;
  currentGameDay: number;
  useLlm?: boolean;
  gameDate: any;
  leftSidebarTab?: string;
  onTabChange?: (tab: string) => void;
  onInitiateEncounter?: (target: any) => void;
}

type TabType = 'overview' | 'fields' | 'family' | 'trade' | 'advisor';

// Minimal crop glyphs (fallback to emoji only for crops since icon coverage varies)
const CROP_EMOJIS: Record<string, string> = {
  wheat: '🌾', barley: '🌾', rice: '🌾', oats: '🌾', rye: '🌾',
  maize: '🌽', corn: '🌽',
  potatoes: '🥔', potato: '🥔',
  tomatoes: '🍅', tomato: '🍅',
  peas: '🟢', beans: '🫘', soybeans: '🫘',
  vegetables: '🥬', cabbage: '🥬', 'bok choy': '🥬',
  turnips: '🟣', radishes: '🔴',
  onions: '🧅', carrots: '🥕',
  melons: '🍈', squash: '🎃',
  dates: '🌴', coconut: '🥥',
  tea: '🍵', coffee: '☕',
  cotton: '☁️', tobacco: '🍂',
  sugarcane: '🎋', sugar: '🎋',
};

const PANEL_LEFT_W = 360;
const PANEL_RIGHT_W = 340;

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
  useLlm = false,
  gameDate,
  onInitiateEncounter,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [farmState, setFarmState] = useState<FarmState | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Fields
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>('');

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
  const [farmerToast, setFarmerToast] = useState<{ message: string; type: 'advice' | 'warning' | 'quest' | 'news' } | null>(null);
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

  // Dimensions for banner
  const centerRef = useRef<HTMLDivElement>(null);
  const [centerWidth, setCenterWidth] = useState<number>(1200);
  useEffect(() => {
    const handleResize = () => {
      const total =
        window.innerWidth - PANEL_LEFT_W - PANEL_RIGHT_W - 2; // borders
      setCenterWidth(Math.max(total, 600));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Historical context with defensive proxy access
  const { era, culturalZone, year } = useMemo(() => {
    try {
      const dateInfo = parseDateString(mapData?.timeSlice || '1650');
      return {
        era: dateInfo.era as HistoricalEra,
        culturalZone: mapLocationToCulture(mapData?.continent || 'Europe', dateInfo.year),
        year: dateInfo.year,
      };
    } catch (error) {
      console.warn('Map data access error, using fallback:', error);
      return {
        era: HistoricalEra.MEDIEVAL,
        culturalZone: 'EUROPEAN' as any,
        year: 1650,
      };
    }
  }, [mapData?.timeSlice, mapData?.continent]);

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

  // Music and soundscape on mount
  useEffect(() => {
    // Play mining music V1 once when opening
    gameSounds.playMiningMusic();

    // Start rural farm soundscape
    gameSounds.playEnvironmentalSoundscape('FARMLAND');

    // Cleanup on unmount
    return () => {
      gameSounds.stopMiningMusic();
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
  
  // Head farmer (owner or first adult member)
  const headFarmer = useMemo(() => {
    if (!farmState?.family?.members) return null;
    return farmState.family.members.find(m => m.role === 'Farmer' && m.age >= 30) || 
           farmState.family.members.find(m => m.role === 'Farmer') ||
           farmState.family.members.find(m => m.age >= 18) ||
           farmState.family.members[0];
  }, [farmState]);

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
      const culturalZone = mapLocationToCulture(mapData?.timeSlice || 'Europe 1650', mapData?.continent || 'Europe');
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

  return (
    <div className="fixed inset-0 z-40 flex" style={{ top: '48px' }}>
      {/* Fade transition overlay */}
      {isTransitioning && (
        <div
          className="fixed inset-0 z-50 bg-black transition-opacity duration-1000"
          style={{ opacity: isTransitioning ? 1 : 0 }}
        />
      )}

      {/* Left Sidebar */}
      <div
        className="bg-slate-950/95 border-r border-slate-800/60 overflow-y-auto flex-shrink-0"
        style={{ width: PANEL_LEFT_W }}
      >
        <LeftSidebar />
      </div>

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
            <div className="flex">
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
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* ================= OVERVIEW ================= */}
            {activeTab === 'overview' && (
              <div className="animate-fadeIn space-y-6">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-emerald-900/20 to-green-900/10 rounded-xl p-4 border border-emerald-800/30">
                    <div className="flex items-center gap-2 text-emerald-300">
                      <Wheat className="w-4 h-4" />
                      <h4 className="text-sm font-semibold">Crops</h4>
                    </div>
                    <div className="mt-2 text-slate-100 text-2xl font-bold">
                      {farmState.fields.filter((f) => f.crop).length}/
                      {farmState.fields.length}
                    </div>
                    <div className="text-xs text-emerald-300/70">Fields planted</div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/10 rounded-xl p-4 border border-amber-800/30">
                    <div className="flex items-center gap-2 text-amber-300">
                      <Hammer className="w-4 h-4" />
                      <h4 className="text-sm font-semibold">Livestock</h4>
                    </div>
                    <div className="mt-2 text-slate-100 text-2xl font-bold">
                      {farmState.livestock.reduce((sum, l) => sum + l.count, 0)}
                    </div>
                    <div className="text-xs text-amber-300/70">Total animals</div>
                  </div>

                  <div className="bg-gradient-to-br from-sky-900/20 to-blue-900/10 rounded-xl p-4 border border-sky-800/30">
                    <div className="flex items-center gap-2 text-sky-300">
                      <Pickaxe className="w-4 h-4" />
                      <h4 className="text-sm font-semibold">Workers</h4>
                    </div>
                    <div className="mt-2 text-slate-100 text-2xl font-bold">
                      {farmState.workers}
                    </div>
                    <div className="text-xs text-sky-300/70">Active laborers</div>
                  </div>
                </div>

                {/* Quick Actions - Hidden for workers */}
                {!isWorker && (
                  <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800/60">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-amber-400 flex items-center gap-2">
                      <History className="w-5 h-5" />
                      Quick Actions
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <Beaker className="w-4 h-4" />
                      <span>Selected crop:</span>
                      <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-200">
                        {selectedCrop || '(none)'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={plantAll}
                      className="group bg-gradient-to-b from-emerald-800/30 to-emerald-900/30 hover:from-emerald-700/40 hover:to-emerald-800/40 text-emerald-200 p-3 rounded-lg transition-all border border-emerald-700/30 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2">
                        <Sprout className="w-4 h-4" />
                        <span className="text-xs font-medium">Plant All</span>
                      </div>
                      <div className="mt-1 text-[10px] text-emerald-300/70">
                        Uses selected crop
                      </div>
                    </button>

                    <button
                      onClick={waterAll}
                      className="group bg-gradient-to-b from-sky-800/30 to-sky-900/30 hover:from-sky-700/40 hover:to-sky-800/40 text-sky-200 p-3 rounded-lg transition-all border border-sky-700/30 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4" />
                        <span className="text-xs font-medium">Water All</span>
                      </div>
                      <div className="mt-1 text-[10px] text-sky-300/70">
                        Boosts crop health
                      </div>
                    </button>

                    <button
                      onClick={harvestAll}
                      className="group bg-gradient-to-b from-amber-800/30 to-amber-900/30 hover:from-amber-700/40 hover:to-amber-800/40 text-amber-200 p-3 rounded-lg transition-all border border-amber-700/30 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2">
                        <Wheat className="w-4 h-4" />
                        <span className="text-xs font-medium">Harvest Mature</span>
                      </div>
                      <div className="mt-1 text-[10px] text-amber-300/70">
                        Adds to harvest ledger
                      </div>
                    </button>

                    <button
                      onClick={() => setActiveTab('trade')}
                      className="group bg-gradient-to-b from-purple-800/30 to-purple-900/30 hover:from-purple-700/40 hover:to-purple-800/40 text-purple-200 p-3 rounded-lg transition-all border border-purple-700/30 hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4" />
                        <span className="text-xs font-medium">Open Market</span>
                      </div>
                      <div className="mt-1 text-[10px] text-purple-300/70">
                        Buy seeds / Sell harvest
                      </div>
                    </button>
                  </div>
                  </div>
                )}

                {/* Head Farmer Toast - positioned at bottom of overview */}
              </div>
            )}

            {/* ================= FIELDS ================= */}
            {activeTab === 'fields' && (
              <div className="animate-fadeIn space-y-6">
                {/* Worker Seasonal Objectives OR Crop selection */}
                {isWorker ? (
                  <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700/40">
                    <div className="flex items-center justify-between">
                      <h4 className="text-blue-400 font-bold flex items-center gap-2">
                        <Hammer className="w-4 h-4" />
                        {season.charAt(0).toUpperCase() + season.slice(1)} Work Objectives
                      </h4>
                      <div className="text-xs text-blue-300">
                        Month {monthInSeason + 1} of 3
                      </div>
                    </div>
                    <div className="mt-3 text-sm text-blue-200">
                      {{
                        spring: "Focus on planting crops and preparing fields for the growing season. Choose which crops to plant where based on soil conditions and water access.",
                        summer: "Manage crop growth by allocating water and fertilizer efficiently. Monitor plant health and apply resources where needed most.",
                        autumn: "Plan harvest timing carefully - some crops may benefit from early harvest while others should wait for full maturation.",
                        winter: "Prepare fields for next year through rotation planning and soil improvement. Some crops can still be planted in winter."
                      }[season] || "Plan your work strategy carefully based on the current season."}
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-amber-400 font-bold flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      Select Crop
                    </h4>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <Brain className="w-4 h-4" />
                      <span>Era-aware list</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {validCrops.map((crop) => (
                      <button
                        key={crop}
                        onClick={() => setSelectedCrop(crop)}
                        className={`px-3 py-1.5 rounded-lg transition-all text-sm border ${
                          selectedCrop === crop
                            ? 'bg-amber-600 text-white border-amber-500 shadow'
                            : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700'
                        }`}
                      >
                        <span className="mr-2">{CROP_EMOJIS[crop] || '🌱'}</span>
                        <span className="capitalize">{crop}</span>
                      </button>
                    ))}
                    {validCrops.length === 0 && (
                      <div className="text-xs text-slate-400 italic">
                        No suitable crops for this season and region.
                      </div>
                    )}
                  </div>
                  </div>
                )}

                {/* Fields grid */}
                <div className="bg-gradient-to-br from-slate-900/70 to-slate-900/50 rounded-xl p-6 border border-slate-700/40 shadow-xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-amber-400 font-bold flex items-center gap-2 text-lg">
                        <Sprout className="w-5 h-5" />
                        Farm Fields
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        {season.charAt(0).toUpperCase() + season.slice(1)} Season • {farmState?.fields?.filter(f => f.crop).length || 0} of {farmState?.fields?.length || 0} planted • {(farmState?.prosperityLevel || 'small').charAt(0).toUpperCase() + (farmState?.prosperityLevel || 'small').slice(1)} Farm
                      </p>
                    </div>
                    {selectedField !== null && (
                      <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg px-3 py-1.5">
                        <div className="text-xs text-amber-300 font-medium">
                          Field #{selectedField + 1} Selected
                        </div>
                      </div>
                    )}
                  </div>

                  <div className={`grid gap-4 ${
                    (farmState?.fields?.length || 0) <= 2 ? 'grid-cols-2' :
                    (farmState?.fields?.length || 0) <= 4 ? 'grid-cols-2 md:grid-cols-2' :
                    (farmState?.fields?.length || 0) <= 6 ? 'grid-cols-2 md:grid-cols-3' :
                    'grid-cols-2 md:grid-cols-4'
                  }`}>
                    {farmState?.fields ? farmState.fields.map((field) => {
                      // Determine soil texture based on moisture and health
                      const getSoilTexture = () => {
                        const baseColor = field.moisture === 'wet'
                          ? '#1a2f1a'
                          : field.moisture === 'moist'
                          ? '#3d3420'
                          : '#5a4a38';

                        const healthMultiplier = 0.5 + (field.health / 200);
                        const r = parseInt(baseColor.slice(1, 3), 16);
                        const g = parseInt(baseColor.slice(3, 5), 16);
                        const b = parseInt(baseColor.slice(5, 7), 16);

                        return `rgb(${Math.floor(r * healthMultiplier)}, ${Math.floor(g * healthMultiplier)}, ${Math.floor(b * healthMultiplier)})`;
                      };

                      // Get crop rows display with growth progression
                      const getCropRows = () => {
                        if (!field.crop) return null;

                        const stages: Record<string, { emoji: string; density: number }> = {
                          'seeds': { emoji: '⚪', density: 0.3 },
                          'sprouts': { emoji: '🌱', density: 0.5 },
                          'growing': { emoji: '🌿', density: 0.7 },
                          'mature': { emoji: CROP_EMOJIS[field.crop] || '🌾', density: 0.9 },
                          'ready': { emoji: CROP_EMOJIS[field.crop] || '🌾', density: 1.0 }
                        };

                        const stage = stages[field.growthStage] || stages['sprouts'];
                        const totalSpots = 9; // 3x3 grid
                        const filledSpots = Math.floor(totalSpots * stage.density);

                        const cropGrid = Array(totalSpots).fill('').map((_, i) =>
                          i < filledSpots ? stage.emoji : ''
                        );

                        return (
                          <div className="grid grid-cols-3 gap-0.5 text-xs leading-none">
                            {cropGrid.map((emoji, i) => (
                              <div key={i} className="w-4 h-4 flex items-center justify-center">
                                {emoji}
                              </div>
                            ))}
                          </div>
                        );
                      };

                      const soilColor = getSoilTexture();

                      // Seasonal border colors
                      const getSeasonalBorder = () => {
                        const seasonColors = {
                          spring: 'border-green-500/60 shadow-green-500/20',
                          summer: 'border-yellow-500/60 shadow-yellow-500/20',
                          autumn: 'border-orange-500/60 shadow-orange-500/20',
                          winter: 'border-blue-400/60 shadow-blue-400/20'
                        };
                        return seasonColors[season] || seasonColors.spring;
                      };

                      return (
                        <button
                          key={field.id}
                          onClick={() => {
                            if (isWorker) {
                              // Worker mode: open planning for this field
                              setSelectedField(field.id);
                            } else {
                              // Owner mode: normal field selection
                              setSelectedField(field.id);
                            }
                          }}
                          className={`relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl border-2 ${
                            selectedField === field.id
                              ? 'ring-4 ring-amber-400 border-amber-400/60 scale-[1.05] shadow-amber-400/30'
                              : isWorker && fieldPlans.has(field.id)
                              ? 'border-blue-500/60'
                              : `${getSeasonalBorder()} hover:border-slate-600`
                          }`}
                          style={{
                            height: farmState.fields.length <= 4 ? '200px' : '160px',
                            background: `linear-gradient(180deg, ${soilColor} 0%, ${soilColor}dd 50%, ${soilColor}aa 100%)`,
                            boxShadow: selectedField === field.id
                              ? '0 10px 30px rgba(251, 191, 36, 0.2)'
                              : '0 4px 12px rgba(0, 0, 0, 0.3)',
                          }}
                        >
                          {/* Soil texture patterns */}
                          <div
                            className="absolute inset-0 opacity-30"
                            style={{
                              backgroundImage: field.moisture === 'wet'
                                ? `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(100,200,100,0.2) 3px, rgba(100,200,100,0.2) 6px),
                                   repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(50,150,50,0.15) 5px, rgba(50,150,50,0.15) 8px)`
                                : field.moisture === 'moist'
                                ? `repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(139,69,19,0.1) 4px, rgba(139,69,19,0.1) 8px),
                                   repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(160,82,45,0.1) 4px, rgba(160,82,45,0.1) 8px)`
                                : `repeating-linear-gradient(30deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px),
                                   radial-gradient(circle at 30% 50%, rgba(139,69,19,0.1) 0%, transparent 50%)`,
                            }}
                          />

                          {/* Moisture droplets for wet soil */}
                          {field.moisture === 'wet' && (
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute top-4 left-3 w-1 h-1 bg-blue-300/40 rounded-full animate-pulse" />
                              <div className="absolute top-8 right-5 w-1.5 h-1.5 bg-blue-300/30 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                              <div className="absolute bottom-6 left-6 w-1 h-1 bg-blue-300/35 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
                            </div>
                          )}

                          {/* Content */}
                          <div className="relative h-full flex flex-col items-center justify-center p-2">
                            {field.crop ? (
                              <>
                                {/* Crop Growth Grid */}
                                <div
                                  className={`mb-2 transition-all duration-500 relative cursor-help ${
                                    field.growthStage === 'ready' ? 'animate-pulse' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setInspectedField(field.id);
                                  }}
                                  title="Click to inspect field details"
                                >
                                  {getCropRows()}

                                  {/* Animated Pest System */}
                                  {field.pests && (
                                    <div className="absolute inset-0 pointer-events-none">
                                      {/* Small crawling bugs (weevils/aphids) */}
                                      <div className="absolute top-0 left-2 w-1 h-1 bg-red-500 rounded-full animate-ping opacity-60" />
                                      <div className="absolute top-1 right-3 w-0.5 h-0.5 bg-orange-600 rounded-full animate-pulse" style={{animationDelay: '0.5s'}} />
                                      <div className="absolute bottom-2 left-1 w-0.5 h-0.5 bg-red-600 rounded-full animate-bounce" style={{animationDelay: '1s'}} />

                                      {/* Larger pest emoji */}
                                      <div className="absolute top-1 right-1 text-[8px] animate-bounce" style={{animationDelay: '1.5s'}}>
                                        🐛
                                      </div>

                                      {/* Moving pest indicators */}
                                      <div
                                        className="absolute w-0.5 h-0.5 bg-brown-600 rounded-full"
                                        style={{
                                          animation: 'pestCrawl 3s linear infinite',
                                          top: '20%',
                                          left: '10%'
                                        }}
                                      />
                                      <div
                                        className="absolute w-0.5 h-0.5 bg-orange-700 rounded-full"
                                        style={{
                                          animation: 'pestCrawl 4s linear infinite reverse',
                                          top: '60%',
                                          left: '70%',
                                          animationDelay: '2s'
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Field Info */}
                                <div className="text-xs text-white font-bold capitalize bg-black/40 px-2 py-0.5 rounded backdrop-blur-sm">
                                  {field.crop}
                                </div>
                                <div className="text-[10px] text-amber-300 font-medium mt-1">
                                  {field.growthStage === 'ready' ? '✨ Ready!' : field.growthStage}
                                </div>

                                {/* Growth Progress Bar */}
                                <div className="w-full mt-2 bg-black/20 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-1000"
                                    style={{
                                      width: `${
                                        field.growthStage === 'seeds' ? '20%' :
                                        field.growthStage === 'sprouts' ? '40%' :
                                        field.growthStage === 'growing' ? '70%' :
                                        field.growthStage === 'mature' ? '90%' :
                                        field.growthStage === 'ready' ? '100%' : '0%'
                                      }`
                                    }}
                                  />
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-slate-300/80 text-sm font-medium">Fallow</div>
                                <div className="text-[10px] text-slate-400 mt-1">Click to plant</div>
                              </>
                            )}

                            {/* Health & moisture indicators */}
                            <div className="absolute bottom-2 left-2 right-2">
                              {/* Health bar with gradient */}
                              <div className="h-2 bg-black/50 rounded-full overflow-hidden backdrop-blur-sm">
                                <div
                                  className="h-full transition-all duration-500"
                                  style={{
                                    width: `${Math.max(0, Math.min(100, field.health))}%`,
                                    background: field.health > 70
                                      ? 'linear-gradient(90deg, #10b981, #34d399)'
                                      : field.health > 40
                                      ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                      : 'linear-gradient(90deg, #ef4444, #f87171)'
                                  }}
                                />
                              </div>
                              {/* Moisture indicator dots */}
                              <div className="flex justify-center gap-1 mt-1">
                                <div className={`w-1 h-1 rounded-full ${
                                  field.moisture === 'wet' ? 'bg-blue-400' : field.moisture === 'moist' ? 'bg-blue-600' : 'bg-gray-500'
                                }`} />
                                <div className={`w-1 h-1 rounded-full ${
                                  field.moisture === 'wet' ? 'bg-blue-400' : field.moisture === 'moist' ? 'bg-blue-600' : 'bg-gray-500'
                                }`} />
                                <div className={`w-1 h-1 rounded-full ${
                                  field.moisture === 'wet' ? 'bg-blue-400' : 'bg-gray-500'
                                }`} />
                              </div>
                            </div>

                            {/* Worker Planning Overlays */}
                            {isWorker && (
                              <>
                                {/* Planned Action Indicator */}
                                {fieldPlans.get(field.id) && (
                                  <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-xs px-2 py-1 rounded">
                                    {fieldPlans.get(field.id)!.action}
                                  </div>
                                )}

                                {/* Enhanced Resource Allocation Indicators */}
                                <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                                  {/* Water allocation with pixel droplets */}
                                  {fieldPlans.get(field.id)?.waterAmount ? (
                                    <div className="flex gap-0.5 bg-black/30 rounded p-1">
                                      {Array.from({length: fieldPlans.get(field.id)!.waterAmount}).map((_, i) => (
                                        <div key={i} className="relative">
                                          {/* Main water droplet */}
                                          <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                          {/* Pixel highlights */}
                                          <div className="absolute top-0 left-0.5 w-0.5 h-0.5 bg-blue-200 rounded-full" />
                                        </div>
                                      ))}
                                    </div>
                                  ) : null}

                                  {/* Manure allocation with enhanced graphics */}
                                  {fieldPlans.get(field.id)?.manureAmount ? (
                                    <div className="bg-black/30 rounded p-1">
                                      <div className="relative">
                                        <div className="w-2 h-2 bg-amber-700 rounded-sm" />
                                        {/* Texture dots */}
                                        <div className="absolute top-0 left-0 w-0.5 h-0.5 bg-amber-600 rounded-full" />
                                        <div className="absolute bottom-0 right-0 w-0.5 h-0.5 bg-amber-800 rounded-full" />
                                      </div>
                                    </div>
                                  ) : null}
                                </div>

                                {/* Click to Plan Overlay */}
                                <div className="absolute inset-0 bg-blue-500/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                                    Click to Plan
                                  </div>
                                </div>
                              </>
                            )}

                            {/* Selected indicator (non-worker) */}
                            {!isWorker && selectedField === field.id && (
                              <div className="absolute top-2 right-2">
                                <div className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
                                <div className="w-2 h-2 bg-amber-400 rounded-full absolute top-0" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    }) : null}
                  </div>

                  {/* Worker Planning Panel */}
                  {isWorker && selectedField !== null && farmState?.fields && (
                    <div className="mt-4 p-4 bg-blue-900/30 rounded-lg border border-blue-700/40 animate-slideUp">
                      <div className="flex items-center justify-between mb-4">
                        <h5 className="text-blue-300 font-medium">
                          Field #{selectedField + 1} - {season.charAt(0).toUpperCase() + season.slice(1)} Planning
                        </h5>
                        <div className="text-xs text-blue-400">
                          Choose action for this month
                        </div>
                      </div>

                      {/* Seasonal Actions */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {getSeasonalActions(season).map(action => (
                          <button
                            key={action}
                            onClick={() => handleFieldAction(selectedField, action)}
                            className={`px-3 py-2 rounded text-sm transition-all border ${
                              fieldPlans.get(selectedField)?.action === action
                                ? 'bg-blue-600 text-white border-blue-500'
                                : 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700'
                            }`}
                          >
                            {action === 'plant' ? '🌱' : action === 'water' ? '💧' : action === 'manure' ? '💩' :
                             action === 'harvest' ? '🌾' : action === 'weed' ? '🌿' : '🏞️'} {action}
                          </button>
                        ))}
                      </div>

                      {/* Resource Allocation */}
                      {fieldPlans.get(selectedField)?.action && fieldPlans.get(selectedField)?.action !== 'fallow' && (
                        <div className="space-y-3">
                          {/* Water allocation */}
                          <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-300 w-16">Water:</label>
                            <div className="flex gap-1">
                              {[0, 1, 2, 3].map(amount => (
                                <button
                                  key={amount}
                                  onClick={() => handleResourceAllocation(selectedField, 'water', amount)}
                                  className={`w-8 h-8 rounded border text-xs ${
                                    (fieldPlans.get(selectedField)?.waterAmount || 0) === amount
                                      ? 'bg-blue-600 text-white border-blue-500'
                                      : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'
                                  }`}
                                >
                                  {amount === 0 ? '0' : '💧'.repeat(amount)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Manure allocation */}
                          <div className="flex items-center gap-3">
                            <label className="text-sm text-slate-300 w-16">Manure:</label>
                            <div className="flex gap-1">
                              {[0, 1].map(amount => (
                                <button
                                  key={amount}
                                  onClick={() => handleResourceAllocation(selectedField, 'manure', amount)}
                                  className={`w-8 h-8 rounded border text-xs ${
                                    (fieldPlans.get(selectedField)?.manureAmount || 0) === amount
                                      ? 'bg-amber-600 text-white border-amber-500'
                                      : 'bg-slate-800 text-slate-400 border-slate-600 hover:bg-slate-700'
                                  }`}
                                >
                                  {amount === 0 ? '0' : '💩'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => setSelectedField(null)}
                        className="mt-3 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-sm"
                      >
                        Close
                      </button>
                    </div>
                  )}

                  {/* Owner Actions for selected field */}
                  {!isWorker && selectedField !== null && farmState?.fields && (
                    <div className="mt-4 p-4 bg-slate-800/70 rounded-lg border border-slate-700 animate-slideUp">
                      <div className="flex flex-wrap items-center gap-3 justify-between">
                        <h5 className="text-amber-300 font-medium">
                          Field #{selectedField + 1} Actions
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-slate-300">
                          <Users className="w-4 h-4" />
                          <span>Assign:</span>
                          <select
                            onChange={(e) =>
                              handleFieldWork(
                                selectedField,
                                'plant',
                                e.target.value || undefined
                              )
                            }
                            disabled={
                              !selectedCrop ||
                              farmState.fields[selectedField].growthStage !== 'fallow'
                            }
                            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Choose worker to plant now
                            </option>
                            {farmState.family.members.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.role})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {farmState.fields[selectedField].growthStage === 'fallow' && (
                          <button
                            onClick={() => handleFieldWork(selectedField, 'plant')}
                            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-all text-sm"
                            disabled={!selectedCrop}
                          >
                            <Sprout className="w-4 h-4" />
                            Plant {selectedCrop || '(select crop)'}
                          </button>
                        )}
                        {farmState.fields[selectedField].crop && (
                          <>
                            <button
                              onClick={() => handleFieldWork(selectedField, 'water')}
                              className="inline-flex items-center gap-2 px-3 py-2 bg-sky-700 hover:bg-sky-600 text-white rounded-lg transition-all text-sm"
                            >
                              <Droplets className="w-4 h-4" />
                              Water
                            </button>
                            {farmState.fields[selectedField].growthStage === 'mature' && (
                              <button
                                onClick={() => handleFieldWork(selectedField, 'harvest')}
                                className="inline-flex items-center gap-2 px-3 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded-lg transition-all text-sm"
                              >
                                <Wheat className="w-4 h-4" />
                                Harvest
                              </button>
                            )}
                          </>
                        )}

                        <button
                          onClick={() => setSelectedField(null)}
                          className="ml-auto inline-flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-all text-sm"
                        >
                          <RotateCcw className="w-4 h-4" />
                          Clear Selection
                        </button>
                      </div>
                    </div>
                  )}
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
          className="bg-gradient-to-b from-slate-950 to-black border-l border-slate-800/60 flex flex-col flex-shrink-0"
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

      {/* Head Farmer Toast - always visible on Overview, contextual on other tabs */}
      {activeTab === 'overview' && headFarmer ? (
        <NPCToast
          character={{...headFarmer, culturalZone: culturalZone}}
          message={farmerToast?.message || ''}
          type={farmerToast?.type || 'greeting'}
          persistent={true}
          position="bottom"
          onClose={() => setFarmerToast(null)}
          enableLLMChat={true}
          farmProsperity={farmState?.economicStatus || 'humble'}
          era={mapData?.dateInfo?.era || 'MEDIEVAL'}
          playerCharacter={playerCharacter}
          mapData={mapData}
          npcs={npcs}
          isFarmContext={true}
          gameTimeHours={gameTimeHours}
          onInitiateEncounter={onInitiateEncounter}
          onRequestRest={(fee) => {
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
          }}
          onAcceptWork={(tasks, payment) => {
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
          }}
          onRequestWork={() => {
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
          }}
          onRequestResidency={() => {
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
          }}
          onLeave={() => {
            onClose(); // Close the farm panel when leaving
          }}
          onRefuse={() => {
            console.log('Player refuses to leave');
            // The NPCToast will handle combat initiation if needed
          }}
        />
      ) : activeTab === 'farm_work' && farmerToast && headFarmer && (
        <NPCToast
          character={headFarmer}
          message={farmerToast.message}
          type={farmerToast.type}
          persistent={false}
          position="bottom"
          autoHideDelay={10000}
          onClose={() => setFarmerToast(null)}
          playerCharacter={playerCharacter}
          mapData={mapData}
          npcs={npcs}
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
