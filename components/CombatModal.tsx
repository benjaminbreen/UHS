import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimalEntity, NpcEntity, PlayerCharacter, Item, CombatLogMessage, SkillID, StatusEffect, StatusEffectType, PlayerStats, EncounterableEntity, isAnimal, isNpc, MapData, CulturalZone, TimeOfDay, Season } from '../types';
import { ClimateType } from '../types/biomes/climate';
import { SKILL_DATA, ANIMAL_DATA } from '../constants/index';
import { createItemInstance, addItemToInventory } from '../utils/inventoryUtils';
import { generateCombatTalkResponse, generateCombatItemResponse, generateCombatSkillResponse, generateCombatLowHealthResponse, generateCombatStartResponse } from '../services/llmService';
import CombatSpritePixel from './symbols/CombatSpritePixel';
import { AnimalCombatSprite } from './symbols';
import { ProceduralPortrait } from './portraits';
import { loadTamedAnimals, saveTamedAnimals, TamedAnimal } from '../services/animalTamingService';
import { getAnimalTexts } from '../constants/gameData/animalTexts';
import gameSoundsService from '../services/gameSoundsService';
import { weatherService, WeatherState } from '../services/weatherService';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import { calculateThrowResult, getEquippedThrowableWeapons, canThrowEffectively, isRangedWeapon, getThrowableWeaponType } from '../services/throwableWeaponService';
import {
  getBackgroundPaths,
  loadBackgroundImage,
  isNightTime,
  getNightFilter,
  getNightOverlayGradient,
  getNightOverlayIntensity
} from '../services/backgroundSelectionService';
import WeatherEffects from './WeatherEffects';
import { entityHealthService } from '../services/entityHealthService';

interface CombatModalProps {
  combatant: EncounterableEntity;
  playerCharacter: PlayerCharacter;
  inventory: Item[];
  onClose: () => void;
  onVictory: (opponent: EncounterableEntity) => void;
  onUseCombatItem: (item: Item) => void;
  onCharacterUpdate: (updater: (prev: PlayerCharacter) => PlayerCharacter) => void;
  onNpcUpdate?: (npcId: string, updates: Partial<NpcEntity>) => void;
  mapData: MapData;
  gameTime?: { hours: number; minutes: number };
  weather?: WeatherState;
  culturalZone?: CulturalZone;
}

interface DamageSplat {
    id: number;
    text: string;
    type: 'damage' | 'crit' | 'heal' | 'miss' | 'status';
    target: 'player' | 'opponent';
}

interface LlmDialogue {
    text: string;
    visible: boolean;
}

interface CombatStats {
    playerDamageDealt: number;
    opponentDamageDealt: number;
    criticalHits: number;
    turnCount: number;
}

const CombatModal: React.FC<CombatModalProps> = ({
    combatant, playerCharacter, inventory, onClose, onVictory, onUseCombatItem, onCharacterUpdate, onNpcUpdate, mapData,
    gameTime, weather, culturalZone
}) => {
  // Initialize opponent with proper health value, checking for previous damage
  const initializeOpponent = (comb: EncounterableEntity): EncounterableEntity => {
    // First check if we have stored health data for this entity
    const storedHealth = entityHealthService.getEntityHealth(comb.id);

    let health: number;
    if (storedHealth) {
      // Use stored damaged health
      health = storedHealth.current;
      console.log(`[Combat] Restored ${comb.id} health: ${health}/${storedHealth.max}`);
    } else {
      // Use original health calculation
      health = typeof comb.health === 'number' ? comb.health :
               (comb.health && typeof comb.health === 'object' && 'current' in comb.health) ? comb.health.current :
               comb.maxHealth || 100;
    }

    return { ...comb, health };
  };
  
  const [opponent, setOpponent] = useState<EncounterableEntity>(initializeOpponent(combatant));
  const [combatLog, setCombatLog] = useState<CombatLogMessage[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [round, setRound] = useState(1);

  // Wrapper function to record health and combat memory before closing combat
  const handleCombatEnd = () => {
    const currentHealth = getOpponentHealth(opponent);
    const maxHealth = opponent.maxHealth || 100;

    // Record health persistence for NPCs/animals
    if (currentHealth > 0 && currentHealth < maxHealth) {
      entityHealthService.recordDamage(opponent.id, currentHealth, maxHealth);
      console.log(`[Combat] Recorded damage for ${opponent.id}: ${currentHealth}/${maxHealth} HP`);
    } else if (currentHealth <= 0) {
      // Remove dead entities from tracking
      entityHealthService.removeEntity(opponent.id);
      console.log(`[Combat] Removed dead entity ${opponent.id} from tracking`);
    }

    // Record combat memory for NPCs
    if (isNpc(opponent) && onNpcUpdate) {
      const wasPlayerVictorious = currentHealth <= 0;
      const wasOpponentVictorious = playerCharacter.health <= 0;
      const playerFled = !wasPlayerVictorious && !wasOpponentVictorious; // Assume fled if neither died

      // Create memory updates
      const combatMemoryUpdates: Partial<NpcEntity> = {
        memory: {
          ...opponent.memory,
          opinionOfPlayer: opponent.memory.opinionOfPlayer + (wasPlayerVictorious ? -30 : playerFled ? -10 : +5),
          knownFactsAboutPlayer: new Set([
            ...(opponent.memory.knownFactsAboutPlayer || []),
            wasPlayerVictorious ? `Defeated me in combat` :
            playerFled ? `Attacked me but fled` :
            `Fought against me`
          ]),
          conversationSummaries: [
            ...(opponent.memory.conversationSummaries || []),
            wasPlayerVictorious ? `${playerCharacter.name} defeated me in battle and I fell unconscious.` :
            playerFled ? `${playerCharacter.name} attacked me but then fled from the fight.` :
            `${playerCharacter.name} and I engaged in combat.`
          ]
        }
      };

      // Clamp opinion between 0 and 100
      combatMemoryUpdates.memory!.opinionOfPlayer = Math.max(0, Math.min(100, combatMemoryUpdates.memory!.opinionOfPlayer));

      onNpcUpdate(opponent.id, combatMemoryUpdates);
      console.log(`[Combat] Updated NPC ${opponent.id} memory: opinion=${combatMemoryUpdates.memory!.opinionOfPlayer}, new facts added`);
    }

    onClose();
  };

  // Wrapper function to record combat victory memory
  const handleCombatVictory = (defeatedOpponent: EncounterableEntity) => {
    // Record NPC memory for victory
    if (isNpc(defeatedOpponent) && onNpcUpdate) {
      const combatMemoryUpdates: Partial<NpcEntity> = {
        memory: {
          ...defeatedOpponent.memory,
          opinionOfPlayer: Math.max(0, defeatedOpponent.memory.opinionOfPlayer - 30), // Big opinion drop for being defeated
          knownFactsAboutPlayer: new Set([
            ...(defeatedOpponent.memory.knownFactsAboutPlayer || []),
            `Defeated me in combat and I was killed/knocked unconscious`
          ]),
          conversationSummaries: [
            ...(defeatedOpponent.memory.conversationSummaries || []),
            `${playerCharacter.name} defeated me in battle. I was completely overpowered.`
          ]
        }
      };

      onNpcUpdate(defeatedOpponent.id, combatMemoryUpdates);
      console.log(`[Combat Victory] Updated defeated NPC ${defeatedOpponent.id} memory: opinion=${combatMemoryUpdates.memory!.opinionOfPlayer}`);
    }

    // Remove dead entities from health tracking
    entityHealthService.removeEntity(defeatedOpponent.id);

    onVictory(defeatedOpponent);
  };

  // Tamed animals state
  const [tamedAnimals, setTamedAnimals] = useState<TamedAnimal[]>([]);
  const [tamedAnimalHealth, setTamedAnimalHealth] = useState<Record<string, number>>({});
  const [tamedAnimalAnimation, setTamedAnimalAnimation] = useState<Record<string, string>>({});
  
  const [activeMenu, setActiveMenu] = useState<'main' | 'skills' | 'items' | 'rangedAttack' | 'talk' | 'itemAction'>('main');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const [playerAnimation, setPlayerAnimation] = useState<'idle' | 'attacking' | 'item' | 'damaged' | 'defending' | 'fleeing' | 'power_strike' | 'slashing' | 'chopping' | 'stabbing' | 'crushing' | 'shooting' | 'casting' | 'blocking' | 'dodging' | 'shouting' | 'observing' | 'foraging' | 'digging' | 'bandaging' | 'parrying' | 'grappling' | 'feinting' | 'singing' | 'mounted-charge' | 'sword-and-board' | 'chivalrous-challenge' | 'forge-heat' | 'metalwork-expertise' | 'timber-strike' | 'precise-cut' | 'wooden-barrier' | 'scythe-sweep' | 'pitchfork-thrust' | 'harvest-endurance' | 'net-throw' | 'gutting-knife' | 'sailors-strength' | 'desperate-swing' | 'improvised-weapon' | 'burn'>('idle');
  const [opponentAnimation, setOpponentAnimation] = useState<'idle' | 'attacking' | 'damaged' | 'special' | 'fleeing'>('idle');
  const [screenShake, setScreenShake] = useState<{active: boolean, intensity: 'light' | 'medium' | 'heavy'}>({active: false, intensity: 'light'});
  const [specialAttackAnnouncement, setSpecialAttackAnnouncement] = useState<{text: string, visible: boolean}>({text: '', visible: false});
  const [enemyEnhancement, setEnemyEnhancement] = useState<{type: 'strong' | 'enraged' | 'elite' | null, announced: boolean}>({type: null, announced: false});
  const [combatSpeed, setCombatSpeed] = useState<number>(1); // 0.5 = slow, 1 = normal, 2 = fast, 3 = very fast
  const [comboCount, setComboCount] = useState<number>(0);
  const [lastAttackTime, setLastAttackTime] = useState<number>(0);
  const [enhancedMaxHealth, setEnhancedMaxHealth] = useState<number>(combatant.maxHealth || 100);
  
  // Helper to safely get health value from opponent
  const getOpponentHealth = (opp: typeof opponent): number => {
    if (typeof opp.health === 'number') return opp.health;
    if (opp.health && typeof opp.health === 'object' && 'current' in opp.health) return opp.health.current;
    return 0;
  };

  // Handle click anywhere to dismiss dialogue
  const handleDismissDialogue = () => {
    if (llmDialogue?.visible) {
      setLlmDialogue(prev => prev ? { ...prev, visible: false } : null);
    }
  };
  const [damageSplats, setDamageSplats] = useState<DamageSplat[]>([]);
  const [activeProjectiles, setActiveProjectiles] = useState<Array<{id: number, type: string, direction: 'left' | 'right', item?: Item}>>([]);

  const [talkInput, setTalkInput] = useState('');
  const [isSubmittingTalk, setIsSubmittingTalk] = useState(false);
  const [llmDialogue, setLlmDialogue] = useState<LlmDialogue | null>(null);
  
  // Enhanced combat tracking
  const [combatStats, setCombatStats] = useState<CombatStats>({
    playerDamageDealt: 0,
    opponentDamageDealt: 0,
    criticalHits: 0,
    turnCount: 0
  });
  const [isDefending, setIsDefending] = useState(false);
  const [combatEnded, setCombatEnded] = useState(false);
  const [victoryState, setVictoryState] = useState<'none' | 'victory' | 'fled'>('none');
  const [hasShownLowHealthDialogue, setHasShownLowHealthDialogue] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const talkInputRef = useRef<HTMLInputElement>(null);
  
  const opponentName = 'speciesName' in opponent ? opponent.speciesName : opponent.name;
  // Get profession-specific skills
  const getProfessionSkills = (character: PlayerCharacter | NpcEntity): string[] => {
    const profession = character.profession?.toLowerCase() || 'peasant';
    const professionSkills: Record<string, string[]> = {
      'knight': ['MOUNTED_CHARGE', 'SWORD_AND_BOARD', 'CHIVALROUS_CHALLENGE'],
      'blacksmith': ['HAMMER_BLOW', 'FORGE_HEAT', 'METALWORK_EXPERTISE'],
      'carpenter': ['TIMBER_STRIKE', 'PRECISE_CUT', 'WOODEN_BARRIER'],
      'weaver': ['ENTANGLING_THREADS', 'NEEDLE_PRECISION', 'CLOTH_BANDAGE'],
      'baker': ['SCALDING_WATER', 'ROLLING_PIN_STRIKE', 'FLOUR_BOMB'],
      'miller': ['GRINDING_WHEEL', 'GRAIN_DUST_CLOUD', 'HEAVY_LIFTING'],
      'monk': ['DIVINE_PROTECTION', 'HEALING_HERBS', 'STAFF_STRIKE'],
      'merchant': ['COIN_TOSS', 'NEGOTIATION', 'HIDDEN_DAGGER'],
      'farmer': ['SCYTHE_SWEEP', 'PITCHFORK_THRUST', 'HARVEST_ENDURANCE'],
      'fisherman': ['NET_THROW', 'GUTTING_KNIFE', 'SAILORS_STRENGTH']
    };
    return professionSkills[profession] || ['DESPERATE_SWING', 'IMPROVISED_WEAPON'];
  };
  
  const combatSkills: SkillID[] = ['POWER_STRIKE', 'FIRST_AID', 'INTIMIDATING_SHOUT', 'CHOP', 'BURN'];
  const playerProfessionSkills = getProfessionSkills(playerCharacter);
  const allPlayerSkills = [...combatSkills, ...playerProfessionSkills] as SkillID[];
  
  // Load tamed animals on mount
  useEffect(() => {
    const animals = loadTamedAnimals();
    setTamedAnimals(animals);
    
    // Initialize health for each tamed animal
    const healthMap: Record<string, number> = {};
    const animationMap: Record<string, string> = {};
    animals.forEach(animal => {
      healthMap[animal.id] = animal.health;
      animationMap[animal.id] = 'idle';
    });
    setTamedAnimalHealth(healthMap);
    setTamedAnimalAnimation(animationMap);
  }, []);
  
  // Start quiet combat music when combat begins
  useEffect(() => {
    // Start FF6 combat music at 50% volume for atmospheric background
    gameSoundsService.playFF6CombatMusic();
    
    // Clean up music when combat ends
    return () => {
      gameSoundsService.stopFF6CombatMusic();
    };
  }, []); // Only run once when component mounts
  
  // Show initial combat message for animals
  useEffect(() => {
    if (isAnimal(combatant)) {
      const animalTexts = getAnimalTexts(combatant.name || combatant.speciesName || 'creature');
      setLlmDialogue({ text: animalTexts.combatText, visible: true });
      
      // Auto-hide after 20 seconds
      const timer = setTimeout(() => {
        setLlmDialogue(prev => prev ? { ...prev, visible: false } : null);
      }, 20000);
      
      return () => clearTimeout(timer);
    }
  }, [combatant]);
  
  // Save tamed animal health changes when combat ends
  useEffect(() => {
    return () => {
      // On unmount, save the current health state of tamed animals
      if (tamedAnimals.length > 0) {
        const updatedAnimals = tamedAnimals.map(animal => ({
          ...animal,
          health: tamedAnimalHealth[animal.id] !== undefined ? tamedAnimalHealth[animal.id] : animal.health
        }));
        saveTamedAnimals(updatedAnimals);
      }
    };
  }, [tamedAnimals, tamedAnimalHealth]);

  // Status effect icons mapping
  const statusEffectIcons: Record<StatusEffectType, string> = {
    poison: '☠️',
    burn: '🔥',
    stunned: '💫',
    bleeding: '🩸',
    defense_down: '🛡️',
    observed: '🎯',
    defending: '🛡️',
    on_fire: '🔥',
    calm: '🧘'
  };
  
  // Determine animal size based on real-world proportions
  const getAnimalSize = (animal: AnimalEntity): number => {
    const baseId = animal.baseId.toUpperCase();
    
    // Massive animals (much bigger than humans)
    if (['ELEPHANT', 'MAMMOTH', 'WHALE', 'ORCA'].includes(baseId)) return 450;
    
    // Very large animals (significantly bigger than humans)
    if (['GIRAFFE', 'RHINOCEROS', 'HIPPOPOTAMUS'].includes(baseId)) return 380;
    
    // Large animals (bigger than humans) 
    if (['MOOSE', 'BISON', 'BUFFALO', 'WILD_HORSE', 'COW', 'BULL', 'CAMEL', 'GRIZZLY_BEAR', 'POLAR_BEAR'].includes(baseId)) return 320;
    
    // Medium-large animals (human height or taller)
    if (['LION', 'TIGER', 'BEAR', 'BLACK_BEAR', 'LLAMA', 'ALPACA', 'DEER', 'ELK', 'ZEBRA', 'HORSE', 'DONKEY', 'MULE'].includes(baseId)) return 280;
    
    // Medium animals (large dog to small human size)
    if (['LEOPARD', 'JAGUAR', 'CHEETAH', 'COUGAR', 'WOLF', 'BOAR', 'WILD_BOAR', 'GORILLA', 'CHIMPANZEE', 'ORANGUTAN', 'KANGAROO', 'OSTRICH', 'EMU'].includes(baseId)) return 220;
    
    // Medium-small animals (large dog size)
    if (['HYENA', 'WILD_DOG', 'COYOTE', 'PANDA', 'GIANT_PANDA', 'SHEEP', 'RAM', 'GOAT', 'PIG', 'WARTHOG', 'SEAL', 'SEA_LION'].includes(baseId)) return 180;
    
    // Small-medium animals (medium dog size)
    if (['DOG', 'DINGO', 'JACKAL', 'LYNX', 'BOBCAT', 'BADGER', 'WOLVERINE', 'BABOON', 'MONKEY', 'KOALA', 'SLOTH'].includes(baseId)) return 150;
    
    // Small animals (cat to small dog size)
    if (['FOX', 'RACCOON', 'OPOSSUM', 'ARMADILLO', 'PORCUPINE', 'BEAVER', 'OTTER', 'CAT', 'RABBIT', 'HARE'].includes(baseId)) return 120;
    
    // Very small animals
    if (['CHICKEN', 'ROOSTER', 'DUCK', 'GOOSE', 'TURKEY', 'PEACOCK', 'EAGLE', 'HAWK', 'OWL', 'VULTURE', 'PARROT'].includes(baseId)) return 100;
    
    // Tiny animals
    if (['SNAKE', 'LIZARD', 'IGUANA', 'TURTLE', 'TORTOISE', 'FROG', 'TOAD', 'RAT', 'MOUSE', 'SQUIRREL', 'FERRET'].includes(baseId)) return 80;
    
    // Aquatic animals (vary by type)
    if (['SHARK', 'DOLPHIN'].includes(baseId)) return 300;
    if (['CROCODILE', 'ALLIGATOR'].includes(baseId)) return 250;
    if (['OCTOPUS', 'SQUID'].includes(baseId)) return 180;
    if (['FISH', 'SALMON', 'TUNA'].includes(baseId)) return 100;
    
    // Default for any missing animals
    return 180;
  };

  // Get attack name for profession skills (moved here to fix initialization order)
  const getAttackDisplayName = (skillId: SkillID): string => {
    const attackNames: Record<string, string> = {
      'MOUNTED_CHARGE': 'Mounted Charge',
      'HAMMER_BLOW': 'Hammer Blow',
      'TIMBER_STRIKE': 'Timber Strike',
      'SCALDING_WATER': 'Scalding Water',
      'SCYTHE_SWEEP': 'Scythe Sweep',
      'NET_THROW': 'Net Throw',
      'DIVINE_PROTECTION': 'Divine Protection',
      'COIN_TOSS': 'Coin Toss',
      'SWORD_AND_BOARD': 'Sword & Board',
      'CHIVALROUS_CHALLENGE': 'Chivalrous Challenge',
      'FORGE_HEAT': 'Forge Heat',
      'METALWORK_EXPERTISE': 'Metalwork Expertise',
      'PRECISE_CUT': 'Precise Cut',
      'WOODEN_BARRIER': 'Wooden Barrier',
      'ENTANGLING_THREADS': 'Entangling Threads',
      'NEEDLE_PRECISION': 'Needle Precision',
      'CLOTH_BANDAGE': 'Cloth Bandage',
      'ROLLING_PIN_STRIKE': 'Rolling Pin Strike',
      'FLOUR_BOMB': 'Flour Bomb',
      'GRINDING_WHEEL': 'Grinding Wheel',
      'GRAIN_DUST_CLOUD': 'Grain Dust Cloud',
      'HEAVY_LIFTING': 'Heavy Lifting',
      'HEALING_HERBS': 'Healing Herbs',
      'STAFF_STRIKE': 'Staff Strike',
      'NEGOTIATION': 'Negotiation',
      'HIDDEN_DAGGER': 'Hidden Dagger',
      'PITCHFORK_THRUST': 'Pitchfork Thrust',
      'HARVEST_ENDURANCE': 'Harvest Endurance',
      'GUTTING_KNIFE': 'Gutting Knife',
      'SAILORS_STRENGTH': 'Sailor\'s Strength',
      'DESPERATE_SWING': 'Desperate Swing',
      'IMPROVISED_WEAPON': 'Improvised Weapon'
    };
    return attackNames[skillId] || SKILL_DATA[skillId]?.name || skillId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Check if skill is a profession skill (not a core combat skill)
  const isProfessionSkill = (skillId: SkillID): boolean => {
    const coreSkills = ['POWER_STRIKE', 'FIRST_AID', 'INTIMIDATING_SHOUT', 'CHOP', 'BURN'];
    return !coreSkills.includes(skillId);
  };

  // Enhanced screen shake based on damage amount
  const checkAndTriggerLowHealthDialogue = (opponentHealth: number) => {
    const maxHealth = opponent.maxHealth || 100;
    const healthPercentage = (opponentHealth / maxHealth) * 100;
    
    if (healthPercentage <= 20 && !hasShownLowHealthDialogue && !isAnimal(opponent)) {
      setHasShownLowHealthDialogue(true);
      generateCombatLowHealthResponse(playerCharacter, opponent, healthPercentage)
        .then(response => {
          if (response.dialogue) {
            setLlmDialogue({ text: response.dialogue, visible: true });
          }
        })
        .catch(error => {
          console.warn('Failed to generate low health dialogue:', error);
        });
    }
  };

  const triggerScreenShake = (damage: number, isCrit: boolean = false) => {
    let intensity: 'light' | 'medium' | 'heavy' = 'light';
    
    if (isCrit || damage >= 20) {
      intensity = 'heavy';
    } else if (damage >= 10) {
      intensity = 'medium';
    }
    
    setScreenShake({active: true, intensity});
    setTimeout(() => setScreenShake({active: false, intensity: 'light'}), 600);
  };

  // Apply damage helper function for profession skills
  const applyDamage = (result: { damage: number; crit: boolean; text?: string }, target: 'player' | 'opponent') => {
    if (target === 'opponent') {
      const newHealth = Math.max(0, getOpponentHealth(opponent) - result.damage);
      setOpponent(prev => ({
        ...prev,
        health: newHealth
      }));
      setOpponentAnimation('damaged');
      addDamageSplat(result.text || result.damage.toString(), result.crit ? 'crit' : 'damage', 'opponent');
      
      // Play impact sound when opponent takes damage
      if (result.damage > 0) {
        if (result.crit) {
          gameSoundsService.playCriticalHitSound();
        } else {
          gameSoundsService.playImpactSound();
        }
      }
      
      if (result.crit) {
        setCombatStats(prev => ({ ...prev, criticalHits: prev.criticalHits + 1 }));
      }
      triggerScreenShake(result.damage, result.crit);
      
      // Check for low health dialogue trigger
      checkAndTriggerLowHealthDialogue(newHealth);
    } else {
      onCharacterUpdate(p => ({ ...p, health: Math.max(0, p.health - result.damage) }));
      setPlayerAnimation('damaged');
      addDamageSplat(result.text || result.damage.toString(), result.crit ? 'crit' : 'damage', 'player');
      
      // Play hurt sound when player takes damage
      if (result.damage > 0) {
        gameSoundsService.playHurtSound();
      }
      
      triggerScreenShake(result.damage, result.crit);
    }
  };

  // Enhanced menu commands with better organization
  const menuCommands = useMemo(() => {
    // Helper function to check if item is an actual ranged weapon (not improvised)
    const isActualRangedWeapon = (item: Item): boolean => {
      const weaponType = getThrowableWeaponType(item);
      return weaponType === 'throwing_weapon' || weaponType === 'ranged_weapon' || weaponType === 'projectile';
    };

    const equippedThrowables = getEquippedThrowableWeapons(playerCharacter);
    const actualRangedWeapons = inventory.filter(item =>
      item.throwable && canThrowEffectively(item) && isActualRangedWeapon(item)
    );
    const consumableItems = inventory.filter(item => item.category === 'Consumable' || item.sustenance);
    // Items menu now includes all throwable items (for improvised throwing)
    const allThrowableItems = inventory.filter(item => item.throwable && canThrowEffectively(item));

    // Check if player has any actual ranged weapons
    const hasActualRangedWeapons = equippedThrowables.some(isActualRangedWeapon) || actualRangedWeapons.length > 0;

    // Conditionally include "Ranged Attack" in main menu
    const mainMenuCommands = ['Attack', 'Skills', 'Items'];
    if (hasActualRangedWeapons) {
      mainMenuCommands.push('Ranged Attack');
    }
    mainMenuCommands.push('Defend', 'Talk', 'Flee');

    return {
      main: mainMenuCommands,
      skills: [...allPlayerSkills.map(id => getAttackDisplayName(id)), 'Back'],
      items: [...consumableItems.map(item => item.name), ...allThrowableItems.map(item => item.name), 'Back'],
      rangedAttack: [...equippedThrowables.filter(isActualRangedWeapon).map(item => item.name), ...actualRangedWeapons.map(item => item.name), 'Back']
    };
  }, [inventory, allPlayerSkills, playerCharacter]);

  // Combat flavor text based on opponent type
  const getCombatFlavorText = (action: string, isAnimal: boolean, animalType?: string): string => {
    if (!isAnimal) return '';
    
    const flavorTexts = {
      attack: {
        WOLF: "The wolf bares its fangs and lunges!",
        BEAR: "The bear rears up on its hind legs!",
        DEER: "The deer charges with lowered antlers!",
        LION: "The lion pounces with a mighty roar!",
        SNAKE: "The snake strikes with lightning speed!",
        EAGLE: "The eagle swoops down with talons extended!"
      },
      miss: {
        WOLF: "The wolf's attack goes wide!",
        BEAR: "The bear's massive paw swipes through empty air!",
        DEER: "The deer bounds away at the last second!",
        SNAKE: "The snake's strike falls short!"
      },
      victory: {
        WOLF: "The wolf whimpers and retreats into the shadows.",
        BEAR: "The great bear collapses with a thunderous crash.",
        DEER: "The deer stumbles and falls, breathing heavily.",
        LION: "The lion's roar fades to a weak growl as it collapses."
      }
    };
    
    return flavorTexts[action as keyof typeof flavorTexts]?.[animalType as keyof any] || '';
  };

  // Process status effects at the start of each turn
  const processStatusEffects = (entity: PlayerCharacter | EncounterableEntity, isPlayer: boolean) => {
    let damageTaken = 0;
    const newStatusEffects: StatusEffect[] = [];
    
    entity.statusEffects.forEach(effect => {
        let effectDamage = 0;
        if (effect.type === 'burn' || effect.type === 'bleeding' || effect.type === 'poison') {
            effectDamage = effect.potency || 0;
            damageTaken += effectDamage;
            addLog(`${isPlayer ? playerCharacter.name : opponentName} takes ${effectDamage} damage from ${effect.type}.`, 'system');
            addDamageSplat(effectDamage.toString(), 'status', isPlayer ? 'player' : 'opponent');
        }

        if (effect.duration > 1) {
            newStatusEffects.push({ ...effect, duration: effect.duration - 1 });
        } else {
            addLog(`${isPlayer ? playerCharacter.name : opponentName}'s ${effect.type.replace('_', ' ')} has worn off.`, 'system');
        }
    });

    if (isPlayer) {
        onCharacterUpdate(p => ({ ...p, health: Math.max(0, p.health - damageTaken), statusEffects: newStatusEffects }));
    } else {
        setOpponent(o => {
          const currentHealth = typeof o.health === 'number' ? o.health : (o.health?.current || 0);
          return { ...o, health: Math.max(0, currentHealth - damageTaken), statusEffects: newStatusEffects };
        });
    }
  };

  useEffect(() => {
    if (activeMenu === 'talk' && talkInputRef.current) {
        talkInputRef.current.focus();
    }
  }, [activeMenu]);
  
  // Check for enemy enhancement on combat start
  useEffect(() => {
    determineEnemyEnhancement();
  }, [opponent.id]); // Trigger when opponent changes (combat starts)

  useEffect(() => {
    if (llmDialogue?.visible) {
        const timer = setTimeout(() => {
            setLlmDialogue(prev => prev ? { ...prev, visible: false } : null);
        }, 4000);
        return () => clearTimeout(timer);
    }
  }, [llmDialogue]);

  useEffect(() => { 
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; 
  }, [combatLog]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlayerTurn || isResolving || activeMenu === 'talk') return;

      const commands = menuCommands[activeMenu as keyof typeof menuCommands] || [];
      if (commands.length === 0) return;

      const itemsPerRow = 3;

      let newIndex = selectedCommandIndex;
      switch (e.key) {
        case 'ArrowUp': newIndex = (newIndex - itemsPerRow + commands.length) % commands.length; break;
        case 'ArrowDown': newIndex = (newIndex + itemsPerRow) % commands.length; break;
        case 'ArrowLeft': newIndex = (newIndex - 1 + commands.length) % commands.length; break;
        case 'ArrowRight': newIndex = (newIndex + 1) % commands.length; break;
        case 'Enter':
          e.preventDefault();
          const commandButtons = document.querySelectorAll('.combat-command-button');
          (commandButtons[selectedCommandIndex] as HTMLButtonElement)?.click();
          return;
        case 'Escape':
           if (activeMenu !== 'main') setActiveMenu('main');
           else handleCombatEnd(); // Allow escape to close combat
           break;
        case '1': case '2': case '3': case '4': case '5': case '6':
          if (activeMenu === 'main') {
            const index = parseInt(e.key) - 1;
            if (index < commands.length) {
              const commandButtons = document.querySelectorAll('.combat-command-button');
              (commandButtons[index] as HTMLButtonElement)?.click();
            }
          }
          break;
        default: return;
      }
      e.preventDefault();
      setSelectedCommandIndex(newIndex);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCommandIndex, activeMenu, isPlayerTurn, isResolving, menuCommands, onClose]);
  
  useEffect(() => {
      setSelectedCommandIndex(0);
  }, [activeMenu]);

  const addLog = (message: string, actor: CombatLogMessage['actor']) => {
    setCombatLog(prev => [...prev, { id: `log-${Date.now()}-${Math.random()}`, message, actor, round }]);
  };
  
  const addDamageSplat = (text: string, type: DamageSplat['type'], target: DamageSplat['target']) => {
      const newSplat = { id: Date.now() + Math.random(), text, type, target };
      setDamageSplats(prev => [...prev, newSplat]);
      setTimeout(() => setDamageSplats(prev => prev.filter(s => s.id !== newSplat.id)), 1600);
  };
  
  const fireProjectile = (type: 'arrow' | 'bolt' | 'magic' | 'thrown', direction: 'left' | 'right', item?: Item, customDuration?: number) => {
      // Enhanced projectile with trajectory info
      let trajectory: 'arc' | 'straight' | 'spinning' = 'straight';
      let duration = 400;

      if (type === 'thrown' && item) {
        // Use throwable weapon service for enhanced physics
        const throwResult = calculateThrowResult(item, playerCharacter, opponent);
        trajectory = throwResult.trajectoryStyle;
        duration = customDuration || throwResult.animationDuration;
      } else if (type === 'thrown') {
        // Default thrown item behavior
        duration = 2000;
        trajectory = 'arc';
      } else if (type === 'arrow' || type === 'bolt') {
        trajectory = 'straight';
        duration = 800;
      }

      const projectile = {
        id: Date.now() + Math.random(),
        type,
        direction,
        item,
        trajectory,
        duration
      };

      setActiveProjectiles(prev => [...prev, projectile]);
      setTimeout(() => {
          setActiveProjectiles(prev => prev.filter(p => p.id !== projectile.id));
      }, duration);
  };
  
  const calculateAttack = (attacker: PlayerCharacter | EncounterableEntity, defender: PlayerCharacter | EncounterableEntity, damageMultiplier: number = 1.0, isPowerAttack: boolean = false) => {
    const isObserved = defender.statusEffects.some(e => e.type === 'observed');
    const isDefDown = defender.statusEffects.some(e => e.type === 'defense_down');
    const defenseBonus = isDefending && defender === playerCharacter ? 2 : 0;

    // Check for combo attacks
    const now = Date.now();
    const isCombo = (now - lastAttackTime) < 2000 && attacker === playerCharacter;
    if (isCombo) {
      setComboCount(prev => Math.min(prev + 1, 5));
    } else {
      setComboCount(0);
    }
    setLastAttackTime(now);

    // Much more realistic hit chances - combat is difficult!
    let baseHitChance = isPowerAttack ? 0.45 : 0.6; // Reduced from 0.7 and 0.9

    // Combo bonus to hit chance
    if (isCombo && comboCount > 0) {
      baseHitChance += comboCount * 0.03;
    }
    
    // Small, fast animals are even harder to hit
    if (isAnimal(defender)) {
      const baseId = defender.baseId;
      if (['RABBIT', 'HARE', 'MOUSE', 'RAT', 'SQUIRREL', 'FERRET'].includes(baseId)) {
        baseHitChance -= 0.25; // Very hard to hit small creatures
      } else if (['DEER', 'FOX', 'CAT', 'SNAKE', 'LIZARD'].includes(baseId)) {
        baseHitChance -= 0.15; // Fast/agile creatures
      } else if (['BEAR', 'ELEPHANT', 'RHINO', 'HIPPO'].includes(baseId)) {
        baseHitChance += 0.1; // Large, easier targets
      }
    }
    
    // Apply skill bonuses
    const attackerSkill = attacker.stats.skill || 0;
    const hitChance = Math.min(0.85, Math.max(0.15, baseHitChance + (attackerSkill * 0.02)));
    
    if (Math.random() > hitChance) return { hit: false, crit: false, damage: 0, text: "Miss!" };

    const isCrit = Math.random() < 0.05 + (attacker.stats.luck || 5) * 0.01 + (isObserved ? 0.25 : 0);
    const critMultiplier = isCrit ? 1.5 : 1.0;
    const comboMultiplier = isCombo ? 1 + (comboCount * 0.15) : 1.0;

    let baseDamage = isPowerAttack ? attacker.stats.attack * 1.5 : (2 + Math.floor(Math.random() * 4) + attacker.stats.attack);
    const effectiveDefense = Math.max(0, defender.stats.defense + defenseBonus - (isDefDown ? 5 : 0));
    const damage = Math.max(1, baseDamage * (1 + (Math.random() - 0.2)) - effectiveDefense);
    const finalDamage = Math.floor(damage * critMultiplier * damageMultiplier * comboMultiplier);

    const comboText = isCombo && comboCount > 0 ? ` x${comboCount + 1}!` : '';
    return { hit: true, crit: isCrit, damage: finalDamage, text: finalDamage.toString() + comboText };
  };

  const calculateDamage = (attacker: PlayerCharacter | EncounterableEntity, defender: PlayerCharacter | EncounterableEntity, baseDamage: number, ignoreArmor: boolean = false) => {
    const isDefDown = defender.statusEffects.some(e => e.type === 'defense_down');
    const defenseBonus = isDefending && defender === playerCharacter ? 2 : 0;
    
    const isCrit = Math.random() < 0.05 + (attacker.stats.luck || 5) * 0.01;
    const critMultiplier = isCrit ? 1.5 : 1.0;
    
    const effectiveDefense = ignoreArmor ? 0 : Math.max(0, defender.stats.defense + defenseBonus - (isDefDown ? 5 : 0));
    const damage = Math.max(1, baseDamage * (1 + (Math.random() - 0.2)) - effectiveDefense);
    const finalDamage = Math.floor(damage * critMultiplier);

    return { hit: true, crit: isCrit, damage: finalDamage, text: finalDamage.toString() };
  };

  const endPlayerTurn = () => {
    setIsPlayerTurn(false);
    setIsDefending(false); // Reset defense
    setComboCount(0); // Reset combo on turn end
    setCombatStats(prev => ({ ...prev, turnCount: prev.turnCount + 1 }));
    
    // If there are alive tamed animals, they get a turn first
    const aliveTamedAnimals = tamedAnimals.filter(animal => tamedAnimalHealth[animal.id] > 0);
    if (aliveTamedAnimals.length > 0) {
      setTimeout(() => {
        startTamedAnimalTurns(aliveTamedAnimals, 0);
      }, 800);
    } else {
      setTimeout(() => {
        startOpponentTurn();
      }, 800);
    }
  };
  
  // Helper function to get animal characteristic based on stats
  const getAnimalCharacteristic = (animal: TamedAnimal): string => {
    const stats = animal.stats;
    if (!stats) return 'ordinary';

    // Check for extreme stats with more variety
    const characteristics: { stat: string; value: number; deviation: number; label: string }[] = [];

    // Physical characteristics - more variety of descriptors
    if (stats.strength >= 18) characteristics.push({ stat: 'strength', value: stats.strength, deviation: stats.strength - 10, label: 'mighty' });
    else if (stats.strength >= 15) characteristics.push({ stat: 'strength', value: stats.strength, deviation: stats.strength - 10, label: 'strong' });
    else if (stats.strength >= 13) characteristics.push({ stat: 'strength', value: stats.strength, deviation: stats.strength - 10, label: 'robust' });
    else if (stats.strength <= 2) characteristics.push({ stat: 'strength', value: stats.strength, deviation: 10 - stats.strength, label: 'frail' });
    else if (stats.strength <= 4) characteristics.push({ stat: 'strength', value: stats.strength, deviation: 10 - stats.strength, label: 'weak' });
    else if (stats.strength <= 6) characteristics.push({ stat: 'strength', value: stats.strength, deviation: 10 - stats.strength, label: 'delicate' });

    if (stats.agility >= 18) characteristics.push({ stat: 'agility', value: stats.agility, deviation: stats.agility - 10, label: 'nimble' });
    else if (stats.agility >= 15) characteristics.push({ stat: 'agility', value: stats.agility, deviation: stats.agility - 10, label: 'agile' });
    else if (stats.agility >= 13) characteristics.push({ stat: 'agility', value: stats.agility, deviation: stats.agility - 10, label: 'spry' });
    else if (stats.agility <= 2) characteristics.push({ stat: 'agility', value: stats.agility, deviation: 10 - stats.agility, label: 'clumsy' });
    else if (stats.agility <= 4) characteristics.push({ stat: 'agility', value: stats.agility, deviation: 10 - stats.agility, label: 'awkward' });
    else if (stats.agility <= 6) characteristics.push({ stat: 'agility', value: stats.agility, deviation: 10 - stats.agility, label: 'sluggish' });

    if (stats.speed >= 18) characteristics.push({ stat: 'speed', value: stats.speed, deviation: stats.speed - 10, label: 'swift' });
    else if (stats.speed >= 15) characteristics.push({ stat: 'speed', value: stats.speed, deviation: stats.speed - 10, label: 'quick' });
    else if (stats.speed >= 13) characteristics.push({ stat: 'speed', value: stats.speed, deviation: stats.speed - 10, label: 'fast' });
    else if (stats.speed <= 2) characteristics.push({ stat: 'speed', value: stats.speed, deviation: 10 - stats.speed, label: 'slow' });
    else if (stats.speed <= 4) characteristics.push({ stat: 'speed', value: stats.speed, deviation: 10 - stats.speed, label: 'plodding' });
    else if (stats.speed <= 6) characteristics.push({ stat: 'speed', value: stats.speed, deviation: 10 - stats.speed, label: 'leisurely' });

    // Age-based characteristics
    if (animal.age && animal.age >= 15) characteristics.push({ stat: 'age', value: animal.age, deviation: animal.age - 8, label: 'ancient' });
    else if (animal.age && animal.age >= 12) characteristics.push({ stat: 'age', value: animal.age, deviation: animal.age - 8, label: 'elderly' });
    else if (animal.age && animal.age >= 10) characteristics.push({ stat: 'age', value: animal.age, deviation: animal.age - 8, label: 'old' });
    else if (animal.age && animal.age <= 1) characteristics.push({ stat: 'age', value: animal.age, deviation: 8 - animal.age, label: 'baby' });
    else if (animal.age && animal.age <= 2) characteristics.push({ stat: 'age', value: animal.age, deviation: 8 - animal.age, label: 'young' });
    else if (animal.age && animal.age <= 3) characteristics.push({ stat: 'age', value: animal.age, deviation: 8 - animal.age, label: 'juvenile' });

    // Health-based
    const healthPercent = (animal.health / (animal.maxHealth || 10)) * 100;
    if (healthPercent <= 20) characteristics.push({ stat: 'health', value: healthPercent, deviation: 100 - healthPercent, label: 'dying' });
    else if (healthPercent <= 40) characteristics.push({ stat: 'health', value: healthPercent, deviation: 100 - healthPercent, label: 'ailing' });
    else if (healthPercent <= 60) characteristics.push({ stat: 'health', value: healthPercent, deviation: 100 - healthPercent, label: 'injured' });
    else if (healthPercent >= 100 && animal.maxHealth >= 15) characteristics.push({ stat: 'health', value: animal.maxHealth, deviation: animal.maxHealth - 10, label: 'hearty' });

    // Combat stats
    if (stats.attack >= 15) characteristics.push({ stat: 'attack', value: stats.attack, deviation: stats.attack - 10, label: 'vicious' });
    else if (stats.attack >= 12) characteristics.push({ stat: 'attack', value: stats.attack, deviation: stats.attack - 10, label: 'fierce' });
    else if (stats.attack >= 10) characteristics.push({ stat: 'attack', value: stats.attack, deviation: stats.attack - 10, label: 'aggressive' });
    else if (stats.attack <= 2) characteristics.push({ stat: 'attack', value: stats.attack, deviation: 10 - stats.attack, label: 'gentle' });

    if (stats.defense >= 15) characteristics.push({ stat: 'defense', value: stats.defense, deviation: stats.defense - 10, label: 'sturdy' });
    else if (stats.defense >= 12) characteristics.push({ stat: 'defense', value: stats.defense, deviation: stats.defense - 10, label: 'tough' });
    else if (stats.defense <= 2) characteristics.push({ stat: 'defense', value: stats.defense, deviation: 10 - stats.defense, label: 'fragile' });

    // Perception and luck
    if (stats.perception >= 15) characteristics.push({ stat: 'perception', value: stats.perception, deviation: stats.perception - 10, label: 'alert' });
    else if (stats.perception <= 3) characteristics.push({ stat: 'perception', value: stats.perception, deviation: 10 - stats.perception, label: 'oblivious' });

    if (stats.luck >= 15) characteristics.push({ stat: 'luck', value: stats.luck, deviation: stats.luck - 10, label: 'lucky' });
    else if (stats.luck <= 2) characteristics.push({ stat: 'luck', value: stats.luck, deviation: 10 - stats.luck, label: 'unlucky' });

    // Pick the most extreme characteristic
    if (characteristics.length > 0) {
      characteristics.sort((a, b) => {
        // Prioritize age and health if they're extreme
        if (a.stat === 'age' && (a.label === 'ancient' || a.label === 'baby')) return -1;
        if (b.stat === 'age' && (b.label === 'ancient' || b.label === 'baby')) return 1;
        if (a.stat === 'health' && (a.label === 'dying' || a.label === 'ailing')) return -1;
        if (b.stat === 'health' && (b.label === 'dying' || b.label === 'ailing')) return 1;
        // Otherwise sort by deviation from normal (10)
        return b.deviation - a.deviation;
      });
      return characteristics[0].label;
    }

    // If no extreme stats, return a neutral descriptor
    const neutralDescriptors = ['ordinary', 'typical', 'common', 'average', 'unremarkable'];
    return neutralDescriptors[Math.floor(Math.random() * neutralDescriptors.length)];
  };

  const startTamedAnimalTurns = (aliveTamedAnimals: TamedAnimal[], index: number) => {
    if (index >= aliveTamedAnimals.length) {
      // All tamed animals have had their turn, now opponent goes
      setTimeout(() => {
        startOpponentTurn();
      }, 600);
      return;
    }

    const currentAnimal = aliveTamedAnimals[index];
    const animalData = ANIMAL_DATA[currentAnimal.baseId];
    if (!animalData) {
      // Skip this animal if we can't find its data
      startTamedAnimalTurns(aliveTamedAnimals, index + 1);
      return;
    }
    
    // Check for special attack (30% chance for level 3+ animals)
    const animalLevel = currentAnimal.stats?.level || 1;
    const animalType = animalData.type?.toLowerCase() || 'domestic';
    const useSpecialAttack = animalLevel >= 3 && Math.random() < 0.3;
    
    const specialAttacks: Record<string, {name: string, multiplier: number, effect?: string}> = {
      'predator': {name: 'Pounce Strike', multiplier: 2.0, effect: 'stun'},
      'pack': {name: 'Pack Coordination', multiplier: 1.5, effect: 'rally'},
      'large herbivore': {name: 'Crushing Charge', multiplier: 2.5, effect: 'knockdown'},
      'bird': {name: 'Diving Strike', multiplier: 1.8, effect: 'critical'},
      'venomous': {name: 'Venom Injection', multiplier: 1.2, effect: 'poison'},
      'aquatic': {name: 'Death Roll', multiplier: 2.0, effect: 'bleeding'},
      'kangaroo': {name: 'Devastating Kick', multiplier: 2.8, effect: 'knockdown'}
    };
    
    const speciesName = currentAnimal.speciesName?.toLowerCase() || animalData.name?.toLowerCase() || '';
    const specialAttack = useSpecialAttack ? (specialAttacks[speciesName] || specialAttacks[animalType]) : null;

    // Get characteristic and proper name for the animal
    const characteristic = getAnimalCharacteristic(currentAnimal);
    const animalDisplayName = currentAnimal.name || currentAnimal.speciesName || animalData.name || 'companion';
    const characteristicPrefix = characteristic ? `${characteristic} ` : '';

    // Check if this is a prey/livestock animal
    const preyAnimals = ['SHEEP', 'GOAT', 'RABBIT', 'DEER', 'COW', 'PIG', 'CHICKEN', 'DUCK'];
    const isPreyAnimal = preyAnimals.includes(currentAnimal.baseId);

    if (specialAttack && !isPreyAnimal) {
      // Special attack (only for non-prey animals)
      showSpecialAttackAnnouncement(specialAttack.name);
      addLog(`Your ${characteristicPrefix}${animalDisplayName} uses ${specialAttack.name}!`, 'player');
      setTamedAnimalAnimation(prev => ({ ...prev, [currentAnimal.id]: 'special' }));
    } else if (isPreyAnimal) {
      // Defensive action for prey/livestock
      addLog(`Your ${characteristicPrefix}${animalDisplayName} defends itself!`, 'player');
      setTamedAnimalAnimation(prev => ({ ...prev, [currentAnimal.id]: 'attacking' }));
    } else {
      // Regular attack for predators/combat animals
      addLog(`Your ${characteristicPrefix}${animalDisplayName} attacks!`, 'player');
      setTamedAnimalAnimation(prev => ({ ...prev, [currentAnimal.id]: 'attacking' }));
    }

    // Play species-appropriate animal sound
    const baseId = currentAnimal.baseId || animalData.name?.toUpperCase();
    if (baseId) {
      switch (baseId) {
        case 'DOG':
          gameSoundsService.playBarkSound();
          break;
        case 'CAT':
          gameSoundsService.playMeowSound();
          break;
        case 'COW':
          gameSoundsService.playCowSound();
          break;
        case 'SHEEP':
          gameSoundsService.playSheepSound();
          break;
        case 'GOAT':
          gameSoundsService.playGoatSound();
          break;
        case 'CHICKEN':
          gameSoundsService.playChickenSound();
          break;
        case 'PIG':
          gameSoundsService.playPigSound();
          break;
        case 'HORSE':
        case 'WILD_HORSE':
          gameSoundsService.playHorseSound();
          break;
        case 'WOLF':
          gameSoundsService.playWolfSound();
          break;
        case 'BEAR':
          gameSoundsService.playBearSound();
          break;
        case 'LION':
          gameSoundsService.playLionSound();
          break;
        case 'TIGER':
          gameSoundsService.playTigerSound();
          break;
        case 'ELEPHANT':
          gameSoundsService.playElephantSound();
          break;
        case 'GORILLA':
          gameSoundsService.playGorillaSound();
          break;
        case 'MONKEY':
          gameSoundsService.playMonkeySound();
          break;
        case 'EAGLE':
          gameSoundsService.playEagleSound();
          break;
        case 'DUCK':
          gameSoundsService.playDuckSound();
          break;
        case 'RABBIT':
          gameSoundsService.playRabbitSound();
          break;
        case 'CROCODILE':
          gameSoundsService.playCrocodileSound();
          break;
        case 'SNAKE':
          gameSoundsService.playSnakeSound();
          break;
        case 'WHALE':
          gameSoundsService.playWhaleSound();
          break;
        case 'BISON':
          gameSoundsService.playBisonSound();
          break;
        default:
          // Play a generic attack sound for unknown animals
          gameSoundsService.playCombatAttackSound();
          break;
      }
    }
    
    setTimeout(() => {
      // Prey animals only defend - no damage!
      if (isPreyAnimal) {
        // Pure defense - no attacking, no damage
        addLog(`Your ${characteristicPrefix}${animalDisplayName} cowers defensively.`, 'player');

        // Just continue to next animal after a short delay
        setTimeout(() => {
          setTamedAnimalAnimation(prev => ({ ...prev, [currentAnimal.id]: 'idle' }));
          // Continue to next tamed animal
          startTamedAnimalTurns(aliveTamedAnimals, index + 1);
        }, 400);
        return; // Exit early - prey animals don't deal damage
      }

      // Only calculate attack for non-prey animals
      const animalAttackPower = animalData.attack || 1;
      const baseMultiplier = specialAttack ? specialAttack.multiplier : 1.0;
      const baseDamage = Math.max(1, Math.floor((animalAttackPower + Math.floor(Math.random() * 3)) * baseMultiplier));
      const damage = Math.max(1, baseDamage - opponent.stats.defense);

      setOpponent(prev => {
        const currentHealth = typeof prev.health === 'number' ? prev.health : (prev.health?.current || 0);
        return { ...prev, health: Math.max(0, currentHealth - damage) };
      });
      setOpponentAnimation('damaged');
      addDamageSplat(damage.toString(), 'damage', 'opponent');

      // Apply special effects
      if (specialAttack?.effect) {
        switch (specialAttack.effect) {
          case 'poison':
            setOpponent(prev => ({
              ...prev,
              statusEffects: [...prev.statusEffects, { type: 'poison', duration: 4, potency: 5 }]
            }));
            addLog(`${specialAttack.name} deals ${damage} damage and applies poison!`, 'player');
            break;
          case 'bleeding':
            setOpponent(prev => ({
              ...prev,
              statusEffects: [...prev.statusEffects, { type: 'bleeding', duration: 3, potency: 3 }]
            }));
            addLog(`${specialAttack.name} deals ${damage} damage and causes bleeding!`, 'player');
            break;
          default:
            addLog(`${specialAttack.name} deals ${damage} damage!`, 'player');
            break;
        }
      } else {
        // Non-prey animals deal damage normally
        addLog(`Your ${characteristicPrefix}${animalDisplayName} deals ${damage} damage!`, 'player');
      }
      
      setTimeout(() => {
        setTamedAnimalAnimation(prev => ({ ...prev, [currentAnimal.id]: 'idle' }));
        setOpponentAnimation('idle');
        
        if (getOpponentHealth(opponent) - damage <= 0) {
          const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
          addLog(victoryText || `${opponentName} is defeated!`, 'system');
          setTimeout(() => handleCombatVictory(opponent), 1000);
        } else {
          // Continue to next tamed animal
          startTamedAnimalTurns(aliveTamedAnimals, index + 1);
        }
      }, 400);
    }, 600);
  };
  
  // Calculate NPC morale and flee decision
  const calculateNPCMorale = (): { shouldFlee: boolean, fleeChance: number } => {
    if (isAnimal(opponent)) return { shouldFlee: false, fleeChance: 0 };
    
    const healthPercent = (getOpponentHealth(opponent) / (opponent.maxHealth || 100)) * 100;
    const opponentLevel = opponent.stats?.level || 1;
    const playerLevel = playerCharacter.stats?.level || 1;
    
    // Base flee chance factors
    let fleeChance = 0;
    
    // Health factor (0-40% contribution)
    if (healthPercent < 20) fleeChance += 0.4;
    else if (healthPercent < 40) fleeChance += 0.2;
    else if (healthPercent < 60) fleeChance += 0.1;
    
    // Round factor (0-20% contribution) - longer fights increase flee chance
    if (round >= 5) fleeChance += 0.2;
    else if (round >= 4) fleeChance += 0.15;
    else if (round >= 3) fleeChance += 0.1;
    
    // Level difference factor (0-20% contribution)
    const levelDiff = playerLevel - opponentLevel;
    if (levelDiff >= 3) fleeChance += 0.2;
    else if (levelDiff >= 1) fleeChance += 0.1;
    else if (levelDiff <= -2) fleeChance -= 0.1; // Stronger NPCs less likely to flee
    
    // Personality factors (±30% modification)
    const backstory = opponent.backstory?.toLowerCase() || '';
    const role = opponent.role?.toLowerCase() || '';
    
    // Brave personalities reduce flee chance
    if (backstory.includes('brave') || backstory.includes('fearless') || 
        backstory.includes('veteran') || backstory.includes('warrior')) {
      fleeChance -= 0.2;
    }
    if (role.includes('guard') || role.includes('soldier') || role.includes('knight')) {
      fleeChance -= 0.15;
    }
    
    // Cowardly personalities increase flee chance
    if (backstory.includes('timid') || backstory.includes('nervous') || 
        backstory.includes('peaceful') || backstory.includes('gentle')) {
      fleeChance += 0.2;
    }
    if (role.includes('merchant') || role.includes('scholar') || role.includes('priest')) {
      fleeChance += 0.1;
    }
    
    // Status effects
    if (opponent.statusEffects.some(e => e.type === 'intimidated')) fleeChance += 0.2;
    if (opponent.statusEffects.some(e => e.type === 'bleeding')) fleeChance += 0.1;
    if (opponent.statusEffects.some(e => e.type === 'burn')) fleeChance += 0.1;
    
    // Clamp between 0 and 0.8 (max 80% flee chance)
    fleeChance = Math.max(0, Math.min(0.8, fleeChance));
    
    // Only consider fleeing after round 2 and if health is below 70%
    const shouldConsiderFleeing = round >= 3 || healthPercent < 70;
    const shouldFlee = shouldConsiderFleeing && Math.random() < fleeChance;
    
    return { shouldFlee, fleeChance };
  };

  const startOpponentTurn = () => {
      // Check if opponent is stunned first
      const isStunned = opponent.statusEffects.some(e => e.type === 'stunned');
      if (isStunned) {
        addLog(`${opponentName} is stunned and cannot act!`, 'system');
        setOpponent(prev => ({
          ...prev,
          statusEffects: prev.statusEffects.map(e => 
            e.type === 'stunned' ? { ...e, duration: e.duration - 1 } : e
          ).filter(e => e.duration > 0)
        }));
        setTimeout(() => {
          startPlayerTurn();
        }, 1000);
        return;
      }

      // Process status effects at start of opponent turn
      processStatusEffects(opponent, false);
      
      // Check if opponent is at low health and hasn't shown dialogue yet
      const currentHealth = getOpponentHealth(opponent);
      checkAndTriggerLowHealthDialogue(currentHealth);
      
      // Check morale and flee decision for NPCs
      if (!isAnimal(opponent)) {
        const { shouldFlee, fleeChance } = calculateNPCMorale();
        
        if (shouldFlee) {
          addLog(`${opponentName} looks for an escape route...`, 'system');
          setTimeout(() => {
            addLog(`${opponentName} flees the battle!`, 'system');
            setOpponentAnimation('fleeing');
            addDamageSplat('FLED!', 'miss', 'opponent');
            
            // Generate fleeing dialogue
            if (!isAnimal(opponent)) {
              const fleeReasons = [
                "I can't win this fight!",
                "This isn't worth dying for!",
                "I yield! Please, let me go!",
                "I must survive... for my family!",
                "You're too strong! I surrender!"
              ];
              const dialogue = fleeReasons[Math.floor(Math.random() * fleeReasons.length)];
              setLlmDialogue({ text: dialogue, visible: true });
            }
            
            setTimeout(() => {
              setCombatEnded(true);
              setVictoryState('fled');
              addLog(`You are victorious as ${opponentName} escapes.`, 'system');
              setTimeout(() => {
                handleCombatEnd();
              }, 1500);
            }, 1000);
          }, 800);
          return;
        }
      }
      
      // Check flee behavior for animals
      if (isAnimal(opponent)) {
        const baseId = opponent.baseId;
        const healthPercent = (getOpponentHealth(opponent) / (opponent.maxHealth || 100)) * 100;
        let fleeChance = 0;
        
        // Prey animals have high flee chance, especially on first turn
        const preyAnimals = ['DEER', 'RABBIT', 'HARE', 'MOUSE', 'RAT', 'SQUIRREL', 'SHEEP', 'GOAT'];
        const skittishAnimals = ['FOX', 'CAT', 'RACCOON', 'OPOSSUM'];
        const aggressiveAnimals = ['BEAR', 'LION', 'TIGER', 'WOLF', 'BOAR', 'CROCODILE', 'SNAKE'];
        
        if (preyAnimals.includes(baseId)) {
          // Prey animals almost always try to flee immediately
          fleeChance = round === 1 ? 0.85 : 0.6;
          if (healthPercent < 50) fleeChance = 0.95;
        } else if (skittishAnimals.includes(baseId)) {
          // Skittish animals often flee
          fleeChance = round === 1 ? 0.5 : 0.3;
          if (healthPercent < 40) fleeChance = 0.8;
        } else if (aggressiveAnimals.includes(baseId)) {
          // Aggressive animals rarely flee unless badly hurt
          fleeChance = healthPercent < 20 ? 0.3 : 0.05;
        } else {
          // Default animals
          fleeChance = healthPercent < 30 ? 0.4 : 0.15;
        }
        
        // Apply flee decision
        if (Math.random() < fleeChance) {
          const fleeDescriptions = {
            'DEER': 'The deer bounds away in terror!',
            'RABBIT': 'The rabbit zigzags away at lightning speed!',
            'HARE': 'The hare leaps away in great bounds!',
            'MOUSE': 'The mouse scurries into the undergrowth!',
            'FOX': 'The fox darts away into the shadows!',
            'CAT': 'The cat springs away and disappears!',
            'BEAR': 'The wounded bear lumbers away!',
            'WOLF': 'The wolf retreats with a final snarl!',
            'SNAKE': 'The snake slithers away into hiding!'
          };
          
          const fleeText = fleeDescriptions[baseId] || `The ${opponentName.toLowerCase()} flees!`;
          addLog(fleeText, 'system');
          setOpponentAnimation('fleeing');
          addDamageSplat('FLED!', 'miss', 'opponent');
          
          setTimeout(() => {
            setCombatEnded(true);
            setVictoryState('fled');
            addLog(`The ${opponentName.toLowerCase()} has escaped.`, 'system');
            setTimeout(() => {
              handleCombatEnd();
            }, 1500);
          }, 1000);
          return;
        }
      }
      
      // Decide target - 30% chance to target a tamed animal if any are alive
      const aliveTamedAnimals = tamedAnimals.filter(animal => tamedAnimalHealth[animal.id] > 0);
      const targetAnimal = aliveTamedAnimals.length > 0 && Math.random() < 0.3 
        ? aliveTamedAnimals[Math.floor(Math.random() * aliveTamedAnimals.length)]
        : null;
      
      setOpponentAnimation('attacking');
      
      // Play opponent attack sound based on their type
      if (isAnimal(opponent)) {
          // Play specific animal sound based on animal type
          const animalName = (opponent.name || opponent.speciesName || '').toLowerCase();
          if (animalName.includes('cow') || animalName.includes('bull') || animalName.includes('ox')) {
              gameSoundsService.playCowSound();
          } else if (animalName.includes('dog') || animalName.includes('hound')) {
              gameSoundsService.playDogSound();
          } else if (animalName.includes('horse') || animalName.includes('stallion') || animalName.includes('mare')) {
              gameSoundsService.playHorseSound();
          } else if (animalName.includes('cat') || animalName.includes('feline')) {
              gameSoundsService.playCatSound();
          } else if (animalName.includes('wolf') || animalName.includes('wolves')) {
              gameSoundsService.playWolfSound();
          } else if (animalName.includes('bear')) {
              gameSoundsService.playBearSound();
          } else {
              // Default to bite sound for other animals
              gameSoundsService.playBiteSound();
          }
      } else if (isNpc(opponent)) {
          // NPC uses weapon sounds based on their equipment
          const opponentWeapon = (opponent as NpcEntity).equippedItems?.main_hand?.name.toLowerCase() || '';
          if (opponentWeapon.includes('sword')) {
              gameSoundsService.playSlashSound();
          } else if (opponentWeapon.includes('axe')) {
              gameSoundsService.playChopSound();
          } else if (opponentWeapon.includes('bow') || opponentWeapon.includes('crossbow')) {
              gameSoundsService.playArrowSound();
          } else {
              // Default attack sound for NPCs
              gameSoundsService.playSlashSound();
          }
      }
      
      const flavorText = getCombatFlavorText('attack', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
      
      if (targetAnimal) {
          // Get animal display name with characteristic
          const targetAnimalData = ANIMAL_DATA[targetAnimal.baseId];
          const targetCharacteristic = getAnimalCharacteristic(targetAnimal);
          const targetDisplayName = targetAnimal.name || targetAnimal.speciesName || targetAnimalData?.name || 'companion';
          const targetFullName = targetCharacteristic ? `your ${targetCharacteristic} ${targetDisplayName}` : `your ${targetDisplayName}`;

          addLog(`${opponentName} attacks ${targetFullName}!`, 'opponent');

          setTimeout(() => {
              // Calculate attack against animal
              const animalData = ANIMAL_DATA[targetAnimal.baseId];
              const animalDefense = animalData?.defense || 0;
              const baseDamage = 2 + Math.floor(Math.random() * 4) + opponent.stats.attack;
              const damage = Math.max(1, baseDamage - animalDefense);

              // Apply damage to tamed animal
              setTamedAnimalHealth(prev => ({
                  ...prev,
                  [targetAnimal.id]: Math.max(0, prev[targetAnimal.id] - damage)
              }));

              setTamedAnimalAnimation(prev => ({ ...prev, [targetAnimal.id]: 'damaged' }));
              addLog(`${opponentName} hits ${targetFullName} for ${damage} damage!`, 'opponent');

              // Check if animal died
              if (tamedAnimalHealth[targetAnimal.id] - damage <= 0) {
                  addLog(`${targetFullName.charAt(0).toUpperCase() + targetFullName.slice(1)} has been defeated!`, 'system');
                  // Update saved animals to reflect death
                  const updatedAnimals = tamedAnimals.map(a => 
                      a.id === targetAnimal.id ? { ...a, health: 0 } : a
                  );
                  saveTamedAnimals(updatedAnimals);
              }
              
              setTimeout(() => {
                  setOpponentAnimation('idle');
                  setTamedAnimalAnimation(prev => ({ ...prev, [targetAnimal.id]: 'idle' }));
                  startPlayerTurn();
              }, 600);
          }, 600);
      } else {
          // Check for animal special attacks against player
          let isSpecialAttack = false;
          let specialAttackData = null;
          
          if (isAnimal(opponent)) {
              const level = opponent.stats?.level || opponent.level || 1;
              const speciesName = opponent.name?.toLowerCase() || opponent.speciesName?.toLowerCase() || '';
              const animalType = opponent.type?.toLowerCase() || '';
              
              // 30% chance for level 3+ animals
              if (level >= 3 && Math.random() < 0.3) {
                  const specialAttacks: Record<string, {name: string, multiplier: number, effect?: string}> = {
                      'predator': {name: 'Pounce Strike', multiplier: 2.0, effect: 'stun'},
                      'large herbivore': {name: 'Crushing Charge', multiplier: 2.5, effect: 'knockdown'},
                      'kangaroo': {name: 'Devastating Kick', multiplier: 2.8, effect: 'knockdown'}
                  };
                  
                  specialAttackData = specialAttacks[speciesName] || specialAttacks[animalType];
                  isSpecialAttack = !!specialAttackData;
              }
          }
          
          if (isSpecialAttack && specialAttackData) {
              setOpponentAnimation('special');
              addLog(`${opponentName} uses ${specialAttackData.name}!`, 'opponent');
              showSpecialAttackAnnouncement(specialAttackData.name);
          } else {
              addLog(flavorText || `${opponentName} attacks!`, 'opponent');
          }

          setTimeout(() => {
              const result = calculateAttack(opponent, playerCharacter, isSpecialAttack ? specialAttackData.multiplier : 1.0);
              
              if (result.hit) {
                  setPlayerAnimation('damaged');
                  addDamageSplat(result.text, result.crit ? 'crit' : 'damage', 'player');
                  
                  if (result.crit) {
                    setCombatStats(prev => ({ ...prev, criticalHits: prev.criticalHits + 1 }));
                  }
                  triggerScreenShake(result.damage, result.crit);
                  
                  setCombatStats(prev => ({ ...prev, opponentDamageDealt: prev.opponentDamageDealt + result.damage }));
                  addLog(`${opponentName} ${result.crit ? 'critically ' : ''}hits for ${result.damage} damage.`, 'opponent');
                  onCharacterUpdate(p => ({ ...p, health: Math.max(0, p.health - result.damage) }));
              } else {
                  addDamageSplat('Miss!', 'miss', 'player');
                  const missText = getCombatFlavorText('miss', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
                  addLog(missText || `${opponentName}'s attack misses!`, 'opponent');
                  // Play dodge sound when player avoids attack
                  gameSoundsService.playDodgeSound();
              }
          
              setTimeout(() => {
                   setOpponentAnimation('idle');
                   setPlayerAnimation('idle');
                   if (playerCharacter.health - result.damage <= 0) {
                   addLog("You have been defeated!", 'system');
                   // Play defeat sound
                   gameSoundsService.playCombatDefeatSound();
                   
                   // Check if opponent has disease and transmit it upon defeat
                   const opponentDisease = opponent.diseaseHealth?.currentDiseases?.[0]?.disease || 
                                          opponent.health?.currentDiseases?.[0]?.disease;
                   
                   if (opponentDisease) {
                       // Always transmit disease when defeated by sick entity
                       if (!playerCharacter.diseaseHealth) {
                           playerCharacter.diseaseHealth = {
                               currentDiseases: [],
                               immunities: [],
                               exposureHistory: [],
                               overallHealthStatus: 'healthy',
                               lastHealthUpdate: { year: mapData?.timeSlice ? parseInt(mapData.timeSlice) : 1500, month: 1, day: 1 }
                           };
                       }
                       
                       // Check if player already has this disease
                       const hasDisease = playerCharacter.diseaseHealth.currentDiseases.some(d => d.disease.id === opponentDisease.id);
                       
                       if (!hasDisease) {
                           const activeDisease = {
                               disease: opponentDisease,
                               contractedDate: Date.now(),
                               stage: 'symptomatic' as const,
                               daysRemaining: opponentDisease.durationDays,
                               severity: 0.5
                           };
                           
                           playerCharacter.diseaseHealth.currentDiseases.push(activeDisease);
                           playerCharacter.diseaseHealth.overallHealthStatus = 'sick';
                           
                           // Update player character
                           onCharacterUpdate(pc => ({
                               ...pc,
                               diseaseHealth: playerCharacter.diseaseHealth
                           }));
                           
                           addLog(`In your weakened state, you contracted ${opponentDisease.name}!`, 'system');
                           console.log(`[DISEASE] Player contracted ${opponentDisease.name} from being defeated by ${opponentName}`);
                           
                           // Show disease modal if available
                           if ((window as any).showDiseaseModal) {
                               setTimeout(() => {
                                   (window as any).showDiseaseModal(opponentDisease, playerCharacter);
                               }, 1000);
                           }
                       }
                   }
                   
                   setTimeout(handleCombatEnd, 1500);
                   } else {
                       startPlayerTurn();
                   }
              }, 600);
          }, 500);
      }
  };
  
  const startPlayerTurn = () => {
      // Process status effects at start of player turn
      processStatusEffects(playerCharacter, true);
      
      setRound(r => r + 1);
      setIsResolving(false);
      setIsPlayerTurn(true);
      setActiveMenu('main');
      setPlayerAnimation('idle');
  };

  const handleAction = (type: 'attack' | 'flee' | 'defend' | 'talk') => {
      if (!isPlayerTurn || isResolving) return;
      
      if (type === 'talk') {
          setActiveMenu('talk');
          return;
      }

      setIsResolving(true);
      
      if (type === 'defend') {
        setIsDefending(true);
        setPlayerAnimation('defending');
        addLog('You raise your guard defensively.', 'player');
        // Play defend sound
        gameSoundsService.playCombatBlockSound();
        setTimeout(() => {
          endPlayerTurn();
        }, 800);
        return;
      }
      
      if (type === 'attack') {
        // Check if using ranged weapon
        const weaponName = playerCharacter.equippedItems.main_hand?.name.toLowerCase() || '';
        const isRanged = weaponName.includes('bow') || weaponName.includes('crossbow');
        
        if (isRanged) {
            // Fire projectile for ranged weapons
            const projectileType = weaponName.includes('crossbow') ? 'bolt' : 'arrow';
            fireProjectile(projectileType, 'right');
            // Play arrow sound for ranged weapons
            gameSoundsService.playArrowSound();
            setPlayerAnimation('shooting');
        } else {
            // Play melee weapon sound and set animation based on weapon type
            if (weaponName.includes('sword')) {
                gameSoundsService.playSlashSound();
                setPlayerAnimation('slashing');
            } else if (weaponName.includes('axe')) {
                gameSoundsService.playChopSound();
                setPlayerAnimation('chopping');
            } else if (weaponName.includes('hammer') || weaponName.includes('mace') || weaponName.includes('club')) {
                gameSoundsService.playCrushSound();
                setPlayerAnimation('crushing');
            } else if (weaponName.includes('spear') || weaponName.includes('pike') || weaponName.includes('dagger')) {
                gameSoundsService.playStabSound();
                setPlayerAnimation('stabbing');
            } else {
                // Default chop animation for unknown weapons (works better visually)
                gameSoundsService.playSlashSound();
                setPlayerAnimation('chopping');
            }
        }
        addLog('You attack!', 'player');
        // Play attack swoosh sound
        gameSoundsService.playCombatAttackSound();
        setTimeout(() => {
            const result = calculateAttack(playerCharacter, opponent, 1.0);
            if (result.hit) {
                // Play hit sound
                if (result.crit) {
                    gameSoundsService.playCombatCriticalHitSound();
                } else {
                    gameSoundsService.playCombatHitSound();
                }
                const newHealth = Math.max(0, getOpponentHealth(opponent) - result.damage);
                setOpponent(prev => ({...prev, health: newHealth}));
                setOpponentAnimation('damaged');
                addDamageSplat(result.text, result.crit ? 'crit' : 'damage', 'opponent');
                
                if (result.crit) {
                  setCombatStats(prev => ({ ...prev, criticalHits: prev.criticalHits + 1 }));
                  
                  // Apply stun on critical hit
                  const stunDuration = Math.floor(Math.random() * 2) + 1; // 1-2 turns
                  const stunEffect: StatusEffect = {
                    type: 'stunned',
                    duration: stunDuration,
                    appliedBy: 'player'
                  };
                  
                  setOpponent(prev => ({
                    ...prev,
                    statusEffects: [...(prev.statusEffects || []), stunEffect]
                  }));
                  
                  addLog(`Critical hit! ${opponentName} is stunned for ${stunDuration} turn${stunDuration > 1 ? 's' : ''}!`, 'system');
                }
                triggerScreenShake(result.damage, result.crit);
                
                setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + result.damage }));
                addLog(`You ${result.crit ? 'critically ' : ''}hit for ${result.damage} damage.`, 'player');
                setCombatStats(prev => ({ 
                  ...prev, 
                  playerDamageDealt: prev.playerDamageDealt + result.damage,
                  criticalHits: result.crit ? prev.criticalHits + 1 : prev.criticalHits
                }));
                
                // Check for low health dialogue trigger
                checkAndTriggerLowHealthDialogue(newHealth);
            } else {
                // Play miss sound
                gameSoundsService.playCombatMissSound();
                addDamageSplat('Miss!', 'miss', 'opponent');
                addLog(`Your attack misses!`, 'player');
            }

            setTimeout(() => {
                setPlayerAnimation('idle');
                setOpponentAnimation('idle');
                if (getOpponentHealth(opponent) - result.damage <= 0) {
                     const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
                     addLog(victoryText || `${opponentName} is defeated!`, 'system');
                     // Play victory sound
                     gameSoundsService.playCombatVictorySound();
                     setTimeout(() => handleCombatVictory(opponent), 1000);
                } else {
                    endPlayerTurn();
                }
            }, 500);
        }, 600);
      } else if (type === 'flee') {
          addLog("You attempt to flee!", 'player');
          setPlayerAnimation('fleeing');
          // Play flee sound
          gameSoundsService.playCombatFleeSound();
          setTimeout(() => {
            const fleeChance = Math.min(0.8, 0.4 + (playerCharacter.stats.dexterity || 5) * 0.05);
            if(Math.random() < fleeChance) {
                addLog("Successfully fled!", 'system');

                // If fleeing from an NPC, record it in their memory
                if (isNpc(opponent) && onNpcUpdate) {
                    const updatedMemory = {
                        ...opponent.memory,
                        knownFactsAboutPlayer: new Set([
                            ...Array.from(opponent.memory.knownFactsAboutPlayer),
                            `PLAYER_FLED_COMBAT_${Date.now()}`
                        ]),
                        conversationSummaries: [
                            ...opponent.memory.conversationSummaries,
                            `Player fled from combat on ${new Date().toLocaleDateString()}.`
                        ]
                    };

                    onNpcUpdate(opponent.id, { memory: updatedMemory });
                    console.log(`[NPC MEMORY] Recording player fled in ${opponent.name}'s memory`);
                }

                // Check if opponent has disease and transmit it
                const opponentDisease = opponent.diseaseHealth?.currentDiseases?.[0]?.disease || 
                                       opponent.health?.currentDiseases?.[0]?.disease;
                
                if (opponentDisease) {
                    // Always transmit disease when fleeing from sick entity
                    if (!playerCharacter.diseaseHealth) {
                        playerCharacter.diseaseHealth = {
                            currentDiseases: [],
                            immunities: [],
                            exposureHistory: [],
                            overallHealthStatus: 'healthy',
                            lastHealthUpdate: { year: mapData?.timeSlice ? parseInt(mapData.timeSlice) : 1500, month: 1, day: 1 }
                        };
                    }
                    
                    // Check if player already has this disease
                    const hasDisease = playerCharacter.diseaseHealth.currentDiseases.some(d => d.disease.id === opponentDisease.id);
                    
                    if (!hasDisease) {
                        const activeDisease = {
                            disease: opponentDisease,
                            contractedDate: Date.now(),
                            stage: 'symptomatic' as const,
                            daysRemaining: opponentDisease.durationDays,
                            severity: 0.5
                        };
                        
                        playerCharacter.diseaseHealth.currentDiseases.push(activeDisease);
                        playerCharacter.diseaseHealth.overallHealthStatus = 'sick';
                        
                        // Update player character
                        onCharacterUpdate(pc => ({
                            ...pc,
                            diseaseHealth: playerCharacter.diseaseHealth
                        }));
                        
                        addLog(`While escaping, you contracted ${opponentDisease.name}!`, 'system');
                        console.log(`[DISEASE] Player contracted ${opponentDisease.name} from fleeing ${opponentName}`);
                        
                        // Show disease modal if available
                        if ((window as any).showDiseaseModal) {
                            setTimeout(() => {
                                (window as any).showDiseaseModal(opponentDisease, playerCharacter);
                            }, 1000);
                        }
                    }
                }
                
                setTimeout(handleCombatEnd, 800);
            } else {
                addLog("Your escape was blocked!", 'system');
                setPlayerAnimation('idle');
                endPlayerTurn();
            }
          }, 1200);
      }
  };
  
  // Show special attack announcement
  const showSpecialAttackAnnouncement = (attackName: string) => {
    setSpecialAttackAnnouncement({text: attackName, visible: true});
    setTimeout(() => {
      setSpecialAttackAnnouncement({text: '', visible: false});
    }, 2000);
  };
  
  // Show enemy enhancement announcement
  const showEnemyEnhancementAnnouncement = (message: string) => {
    setSpecialAttackAnnouncement({text: message, visible: true});
    setTimeout(() => {
      setSpecialAttackAnnouncement({text: '', visible: false});
    }, 3500); // Longer duration for warnings
  };
  
  // Randomly determine enemy enhancement and apply buffs
  const determineEnemyEnhancement = () => {
    if (enemyEnhancement.announced) return; // Already processed
    
    const roll = Math.random();
    let enhancement: 'strong' | 'enraged' | 'elite' | null = null;
    
    if (roll < 0.02) {
      enhancement = 'elite';
    } else if (roll < 0.07) {
      enhancement = 'enraged';
    } else if (roll < 0.15) {
      enhancement = 'strong';
    }
    
    if (enhancement) {
      // Apply stat buffs
      const buffMultipliers = {
        strong: { health: 1.5, attack: 1.3, defense: 1.2 },
        enraged: { health: 1.3, attack: 1.8, defense: 0.8 },
        elite: { health: 2.0, attack: 1.5, defense: 1.5 }
      };
      
      const buffs = buffMultipliers[enhancement];
      
      setOpponent(prev => ({
        ...prev,
        health: Math.floor((typeof prev.health === 'number' ? prev.health : (prev.health?.current || 1)) * buffs.health),
        stats: {
          ...prev.stats,
          attack: Math.floor(prev.stats.attack * buffs.attack),
          defense: Math.floor(prev.stats.defense * buffs.defense)
        }
      }));
      
      // Update enhanced max health for display
      setEnhancedMaxHealth(Math.floor((combatant.maxHealth || 100) * buffs.health));
      
      // Create appropriate announcement message
      const message = getEnhancementMessage(enhancement);
      
      setTimeout(() => {
        showEnemyEnhancementAnnouncement(message);
      }, 1000); // Short delay after combat starts
    }
    
    setEnemyEnhancement({type: enhancement, announced: true});
  };
  
  // Generate enhancement message based on opponent type and enhancement
  const getEnhancementMessage = (enhancement: 'strong' | 'enraged' | 'elite'): string => {
    const opponentType = isAnimal(opponent) ? 'animal' : 'npc';
    const name = isAnimal(opponent) ? 
      ANIMAL_DATA[opponent.baseId]?.name || opponent.name :
      opponent.name;
    
    const messages = {
      strong: {
        animal: [
          `This ${name.toLowerCase()} is unusually large and powerful!`,
          `The ${name.toLowerCase()} appears to be in peak physical condition!`,
          `This ${name.toLowerCase()} seems much stronger than normal!`,
          `You notice this ${name.toLowerCase()} has exceptional size and strength!`
        ],
        npc: [
          `${name} looks unusually strong and well-built!`,
          `${name} has the bearing of a seasoned warrior!`,
          `${name} appears to be in exceptional physical condition!`,
          `This ${name.toLowerCase()} seems much tougher than most!`
        ]
      },
      enraged: {
        animal: [
          `The ${name.toLowerCase()} is in a violent rage!`,
          `This ${name.toLowerCase()} appears rabid and dangerous!`,
          `The ${name.toLowerCase()}'s eyes burn with fury!`,
          `Warning: This ${name.toLowerCase()} is extremely aggressive!`
        ],
        npc: [
          `${name} is consumed with battle fury!`,
          `${name}'s eyes burn with rage!`,
          `${name} appears to have lost all reason to anger!`,
          `Warning: ${name} is in a berserk state!`
        ]
      },
      elite: {
        animal: [
          `This is a legendary ${name.toLowerCase()} of extraordinary power!`,
          `You face a rare and mighty ${name.toLowerCase()}!`,
          `This ${name.toLowerCase()} radiates an aura of dominance!`,
          `Beware! This ${name.toLowerCase()} is far above its kin!`
        ],
        npc: [
          `${name} is a legendary warrior of great renown!`,
          `This ${name.toLowerCase()} has the bearing of true nobility!`,
          `${name} radiates an aura of power and authority!`,
          `You face a truly exceptional ${name.toLowerCase()}!`
        ]
      }
    };
    
    const messageArray = messages[enhancement][opponentType];
    return messageArray[Math.floor(Math.random() * messageArray.length)];
  };
  

  const handleSkillUse = (skillId: SkillID) => {
    if (!isPlayerTurn || isResolving) return;
    setIsResolving(true);
    const skill = SKILL_DATA[skillId];
    
    // Show attack announcement for profession skills
    if (!['POWER_STRIKE', 'FIRST_AID', 'INTIMIDATING_SHOUT', 'CHOP', 'BURN'].includes(skillId)) {
      showSpecialAttackAnnouncement(getAttackDisplayName(skillId));
    }
    
    if (!skill) {
      // Handle new profession skills
      handleProfessionSkill(skillId);
      return;
    }

    addLog(`You use ${skill.name}!`, 'player');
    
    // Set animation based on skill type
    if (skillId === 'POWER_STRIKE') {
      const weaponName = playerCharacter.equippedItems.main_hand?.name.toLowerCase() || '';
      if (weaponName.includes('axe')) {
        setPlayerAnimation('chopping');
      } else if (weaponName.includes('hammer') || weaponName.includes('mace')) {
        setPlayerAnimation('crushing');
      } else if (weaponName.includes('sword')) {
        setPlayerAnimation('slashing');
      } else {
        setPlayerAnimation('power_strike');
      }
    } else {
      setPlayerAnimation('item');
    }
    
    switch (skillId) {
      case 'POWER_STRIKE':
        // Play power attack sound
        gameSoundsService.playCombatPowerAttackSound();
        setTimeout(() => {
          const result = calculateAttack(playerCharacter, opponent, 1.0, true);
          if (result.hit) {
            setOpponent(prev => ({...prev, health: Math.max(0, (prev.health || 0) - result.damage)}));
            setOpponentAnimation('damaged');
            addDamageSplat(result.text, result.crit ? 'crit' : 'damage', 'opponent');
            if (result.crit) {
              setCombatStats(prev => ({ ...prev, criticalHits: prev.criticalHits + 1 }));
            }
            triggerScreenShake(result.damage, result.crit);
            setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + result.damage }));
            addLog(`Your power strike ${result.crit ? 'critically ' : ''}hits for ${result.damage} damage!`, 'player');
            setCombatStats(prev => ({ 
              ...prev, 
              playerDamageDealt: prev.playerDamageDealt + result.damage,
              criticalHits: result.crit ? prev.criticalHits + 1 : prev.criticalHits
            }));
          } else {
            addDamageSplat('Miss!', 'miss', 'opponent');
            addLog(`Your power strike misses!`, 'player');
            // Play miss sound
            gameSoundsService.playBlockSound();
          }
          
          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            if ((opponent.health || 0) - result.damage <= 0) {
              const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
              addLog(victoryText || `${opponentName} is defeated!`, 'system');
              setTimeout(() => handleCombatVictory(opponent), 1000);
            } else {
              endPlayerTurn();
            }
          }, 500);
        }, 600);
        break;

      case 'CHOP':
        setPlayerAnimation('chopping');
        setTimeout(() => {
          const hasAxe = playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('axe');
          const baseDamage = 5 + (hasAxe ? 5 : 0);
          const damage = Math.max(1, baseDamage + playerCharacter.stats.strength - opponent.stats.defense);
          const applyBleed = hasAxe && Math.random() < 0.4; // 40% chance to cause bleeding with an axe
          
          // Play big chop sound effect
          gameSoundsService.playCombatChopSound();

          const newHealth = Math.max(0, getOpponentHealth(opponent) - damage);
          setOpponent(prev => {
            let newStatusEffects = [...prev.statusEffects];
            if (applyBleed) {
              newStatusEffects.push({ type: 'bleeding', duration: 3, potency: 2 });
            }
            return { ...prev, health: newHealth, statusEffects: newStatusEffects };
          });
          
          // Check for low health dialogue trigger
          checkAndTriggerLowHealthDialogue(newHealth);

          setOpponentAnimation('damaged');
          addDamageSplat(damage.toString(), 'damage', 'opponent');
          addLog(`You chop for ${damage} damage.` + (applyBleed ? ' The wound is bleeding!' : ''), 'player');
          setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + damage }));

          // Generate NPC dialogue reaction to chop skill
          if (!isAnimal(opponent)) {
            generateCombatSkillResponse(
              playerCharacter,
              opponent,
              'CHOP',
              applyBleed ? 'bleeding' : 'slashing damage'
            ).then(response => {
              if (response.dialogue) {
                setLlmDialogue({ text: response.dialogue, visible: true });
              }
            }).catch(error => {
              console.warn('Failed to generate chop skill dialogue:', error);
            });
          }

          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            if (getOpponentHealth(opponent) - damage <= 0) {
              const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
              addLog(victoryText || `${opponentName} is defeated!`, 'system');
              setTimeout(() => handleCombatVictory(opponent), 1000);
            } else {
              endPlayerTurn();
            }
          }, 500);
        }, 600);
        break;

      case 'BURN':
        setPlayerAnimation('burn');
        // Play fire crackling sound
        gameSoundsService.playCombatBurnSound();
        setTimeout(() => {
          const damage = 15 + playerCharacter.stats.intelligence;
          const applyBurn = Math.random() < 0.6; // 60% chance to apply burn status

          const newHealth = Math.max(0, getOpponentHealth(opponent) - damage);
          setOpponent(prev => {
            let newStatusEffects = [...prev.statusEffects];
            if (applyBurn) {
              newStatusEffects.push({ type: 'burn', duration: 3, potency: 10 });
            }
            return { ...prev, health: newHealth, statusEffects: newStatusEffects };
          });
          
          // Check for low health dialogue trigger
          checkAndTriggerLowHealthDialogue(newHealth);

          setOpponentAnimation('damaged');
          addDamageSplat(damage.toString(), 'damage', 'opponent');
          addLog(`You burn the opponent for ${damage} damage.` + (applyBurn ? ' They catch fire!' : ''), 'player');
          setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + damage }));
          
          // Generate NPC dialogue reaction to burn skill
          if (!isAnimal(opponent)) {
            generateCombatSkillResponse(
              playerCharacter,
              opponent,
              'BURN',
              applyBurn ? 'burning' : 'fire damage'
            ).then(response => {
              if (response.dialogue) {
                setLlmDialogue({ text: response.dialogue, visible: true });
              }
            }).catch(error => {
              console.warn('Failed to generate burn skill dialogue:', error);
            });
          }
          
          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            if (getOpponentHealth(opponent) - damage <= 0) {
              const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
              addLog(victoryText || `${opponentName} is defeated!`, 'system');
              setTimeout(() => handleCombatVictory(opponent), 1000);
            } else {
              endPlayerTurn();
            }
          }, 500);
        }, 600);
        break;

      case 'THRUST':
        setPlayerAnimation('stabbing');
        // Play sharp piercing sound
        gameSoundsService.playCombatThrustSound();
        setTimeout(() => {
          const hasPointedWeapon = playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('sword') || 
                                  playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('spear') ||
                                  playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('dagger');
          const baseDamage = 8 + (hasPointedWeapon ? 4 : 0);
          
          // Play thrust/stab sound
          gameSoundsService.playStabSound();
          const damage = Math.max(1, baseDamage + Math.floor(playerCharacter.stats.dexterity / 2) - opponent.stats.defense);
          
          setOpponent(prev => ({
            ...prev,
            health: Math.max(0, getOpponentHealth(prev) - damage)
          }));

          setOpponentAnimation('damaged');
          addDamageSplat(damage.toString(), 'damage', 'opponent');
          addLog(`Your precise thrust deals ${damage} damage.`, 'player');
          setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + damage }));
          
          // Generate NPC dialogue reaction to thrust skill
          if (!isAnimal(opponent)) {
            generateCombatSkillResponse(
              playerCharacter,
              opponent,
              'THRUST',
              'piercing damage'
            ).then(response => {
              if (response.dialogue) {
                setLlmDialogue({ text: response.dialogue, visible: true });
              }
            }).catch(error => {
              console.warn('Failed to generate thrust skill dialogue:', error);
            });
          }
          
          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            if (getOpponentHealth(opponent) - damage <= 0) {
              const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
              addLog(victoryText || `${opponentName} is defeated!`, 'system');
              setTimeout(() => handleCombatVictory(opponent), 1000);
            } else {
              endPlayerTurn();
            }
          }, 500);
        }, 600);
        break;

      case 'FIRST_AID':
        const healAmount = Math.floor(playerCharacter.maxHealth * 0.3);
        onCharacterUpdate(p => ({...p, health: Math.min(p.maxHealth, p.health + healAmount)}));
        addDamageSplat(healAmount.toString(), 'heal', 'player');
        addLog(`You heal for ${healAmount} HP.`, 'system');
        setTimeout(() => {
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 600);
        break;

      case 'INTIMIDATING_SHOUT':
        setPlayerAnimation('shouting');
        // Play powerful battle cry
        gameSoundsService.playCombatIntimidatingShoutSound();
        setTimeout(() => {
          // Reduce opponent's defense for the rest of the battle
          const defenseReduction = Math.floor(opponent.stats.defense * 0.5); // 50% defense reduction
          setOpponent(prev => ({
            ...prev,
            stats: {
              ...prev.stats,
              defense: Math.max(0, prev.stats.defense - defenseReduction)
            },
            statusEffects: [...prev.statusEffects, { type: 'intimidated', duration: 99, potency: defenseReduction }]
          }));
          
          // Check for flee chance (based on opponent's level and player's charisma)
          const playerCharisma = playerCharacter.stats?.charisma || 5;
          const opponentLevel = opponent.stats?.level || 1;
          const fleeChance = Math.min(0.6, (playerCharisma / 10) * (0.4 / Math.sqrt(opponentLevel))); // Max 60% flee chance
          
          if (Math.random() < fleeChance) {
            // Opponent flees!
            addLog(`Your intimidating shout terrifies ${opponentName}! They flee in terror!`, 'system');
            setOpponentAnimation('fleeing');
            addDamageSplat('FLED!', 'miss', 'opponent');
            
            // Generate NPC dialogue reaction when fleeing
            if (!isAnimal(opponent)) {
              generateCombatSkillResponse(
                playerCharacter,
                opponent,
                'INTIMIDATING_SHOUT',
                'fleeing in terror'
              ).then(response => {
                if (response.dialogue) {
                  setLlmDialogue({ text: response.dialogue, visible: true });
                }
              }).catch(error => {
                console.warn('Failed to generate intimidation flee dialogue:', error);
              });
            }
            
            setTimeout(() => {
              // End combat with no winner
              setCombatEnded(true);
              setVictoryState('fled');
              addLog(`The battle ends as ${opponentName} escapes.`, 'system');
              setTimeout(() => {
                handleCombatEnd(); // End combat without victory
              }, 1500);
            }, 1000);
          } else {
            // Just intimidate (reduce defense)
            addLog(`Your intimidating shout weakens ${opponentName}'s defense by ${defenseReduction}!`, 'player');
            setOpponentAnimation('damaged');
            addDamageSplat(`-${defenseReduction} DEF`, 'miss', 'opponent');
            
            // Generate NPC dialogue reaction when intimidated but not fleeing
            if (!isAnimal(opponent)) {
              generateCombatSkillResponse(
                playerCharacter,
                opponent,
                'INTIMIDATING_SHOUT',
                'intimidated'
              ).then(response => {
                if (response.dialogue) {
                  setLlmDialogue({ text: response.dialogue, visible: true });
                }
              }).catch(error => {
                console.warn('Failed to generate intimidation dialogue:', error);
              });
            }
            
            setTimeout(() => {
              setPlayerAnimation('idle');
              setOpponentAnimation('idle');
              endPlayerTurn();
            }, 500);
          }
        }, 600);
        break;

      case 'OBSERVE':
        setPlayerAnimation('observing');
        setTimeout(() => {
          addLog('You carefully observe your surroundings and opponent.', 'player');
          // OBSERVE skill gives insight or small stat boost for next action
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 1500);
        break;

      case 'FORAGE':
        setPlayerAnimation('foraging');
        setTimeout(() => {
          addLog('You search the area for useful items.', 'player');
          // FORAGE could find small healing items or throwing weapons in combat
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 1200);
        break;

      case 'DIG':
        setPlayerAnimation('digging');
        setTimeout(() => {
          addLog('You dig quickly, possibly finding something useful.', 'player');
          // DIG could unearth stones to throw or create small defensive positions
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 800);
        break;

      case 'BANDAGE_WOUNDS':
        setPlayerAnimation('bandaging');
        setTimeout(() => {
          const healAmount = 15 + Math.floor(playerCharacter.stats.wisdom / 2);
          onCharacterUpdate(prev => ({
            ...prev,
            health: Math.min(prev.maxHealth, prev.health + healAmount)
          }));
          addLog(`You bandage your wounds, healing for ${healAmount} HP.`, 'player');
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 2000);
        break;

      case 'PARRY':
        setPlayerAnimation('parrying');
        setTimeout(() => {
          setIsDefending(true);
          addLog('You prepare to parry the next attack, reducing incoming damage.', 'player');
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 600);
        break;

      case 'GRAPPLE':
        setPlayerAnimation('grappling');
        setTimeout(() => {
          const successChance = Math.min(0.8, 0.4 + (playerCharacter.stats.strength / 20));
          if (Math.random() < successChance) {
            addLog('You successfully grapple your opponent, restricting their movement!', 'player');
            // Apply grappled status to opponent
            setOpponent(prev => ({
              ...prev,
              statusEffects: [...prev.statusEffects, { type: 'stunned', duration: 2, potency: 1 }]
            }));
            setOpponentAnimation('damaged');
          } else {
            addLog('Your grapple attempt fails!', 'player');
          }
          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            endPlayerTurn();
          }, 500);
        }, 1000);
        break;

      case 'FEINT':
        setPlayerAnimation('feinting');
        setTimeout(() => {
          addLog('You feint, creating an opening for your next attack!', 'player');
          // Give player a temporary accuracy bonus for next attack
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 800);
        break;

      case 'SING':
        setPlayerAnimation('singing');
        setTimeout(() => {
          addLog('You sing a battle song, boosting morale!', 'player');
          // SING could provide temporary stat boosts or heal small amount
          const healAmount = 5 + Math.floor(playerCharacter.stats.charisma / 3);
          onCharacterUpdate(prev => ({
            ...prev,
            health: Math.min(prev.maxHealth, prev.health + healAmount)
          }));
          addLog(`Your song lifts your spirits, healing ${healAmount} HP.`, 'player');
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 1500);
        break;

      default:
        setTimeout(() => {
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 600);
        break;
    }
  };
  
  // Handle profession-specific skills
  const handleProfessionSkill = (skillId: SkillID) => {
    // Set animation based on skill type
    switch (skillId) {
      // Knight Skills
      case 'MOUNTED_CHARGE':
        setPlayerAnimation('mounted-charge');
        break;
      case 'SWORD_AND_BOARD':
        setPlayerAnimation('sword-and-board');
        break;
      case 'CHIVALROUS_CHALLENGE':
        setPlayerAnimation('chivalrous-challenge');
        break;

      // Blacksmith Skills
      case 'HAMMER_BLOW':
        setPlayerAnimation('crushing');
        break;
      case 'FORGE_HEAT':
        setPlayerAnimation('forge-heat');
        break;
      case 'METALWORK_EXPERTISE':
        setPlayerAnimation('metalwork-expertise');
        break;

      // Carpenter Skills
      case 'TIMBER_STRIKE':
        setPlayerAnimation('timber-strike');
        break;
      case 'PRECISE_CUT':
        setPlayerAnimation('precise-cut');
        break;
      case 'WOODEN_BARRIER':
        setPlayerAnimation('wooden-barrier');
        break;

      // Farmer Skills
      case 'SCYTHE_SWEEP':
        setPlayerAnimation('scythe-sweep');
        break;
      case 'PITCHFORK_THRUST':
        setPlayerAnimation('pitchfork-thrust');
        break;
      case 'HARVEST_ENDURANCE':
        setPlayerAnimation('harvest-endurance');
        break;

      // Fisherman Skills
      case 'NET_THROW':
        setPlayerAnimation('net-throw');
        break;
      case 'GUTTING_KNIFE':
        setPlayerAnimation('gutting-knife');
        break;
      case 'SAILORS_STRENGTH':
        setPlayerAnimation('sailors-strength');
        break;

      // Default/Desperate Skills
      case 'DESPERATE_SWING':
        setPlayerAnimation('desperate-swing');
        break;
      case 'IMPROVISED_WEAPON':
        setPlayerAnimation('improvised-weapon');
        break;

      // Legacy skills
      case 'SCALDING_WATER':
        setPlayerAnimation('casting');
        break;
      case 'INTIMIDATING_SHOUT':
        setPlayerAnimation('shouting');
        break;

      default:
        setPlayerAnimation('attacking');
        break;
    }
    
    setTimeout(() => {
      switch (skillId) {
        case 'HAMMER_BLOW':
          const hammerDamage = 20 + playerCharacter.stats.strength;
          const hammerResult = calculateDamage(playerCharacter, opponent, hammerDamage, true); // ignores armor
          applyDamage(hammerResult, 'opponent');
          addLog(`Your mighty hammer blow crushes through armor for ${hammerResult.damage} damage!`, 'player');
          setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + hammerResult.damage }));
          
          // Generate NPC dialogue reaction to hammer blow
          if (!isAnimal(opponent)) {
            generateCombatSkillResponse(
              playerCharacter,
              opponent,
              'HAMMER_BLOW',
              'crushing blow'
            ).then(response => {
              if (response.dialogue) {
                setLlmDialogue({ text: response.dialogue, visible: true });
              }
            }).catch(error => {
              console.warn('Failed to generate hammer blow dialogue:', error);
            });
          }
          break;
          
        case 'SCALDING_WATER':
          const scalding = Math.floor(8 + playerCharacter.stats.intelligence / 2);
          applyDamage({damage: scalding, crit: false}, 'opponent');
          setOpponent(prev => ({
            ...prev,
            statusEffects: [...prev.statusEffects, { type: 'burn', duration: 2, potency: 8 }]
          }));
          addLog(`Scalding water burns for ${scalding} damage and sets them ablaze!`, 'player');
          
          // Generate NPC dialogue reaction to scalding water
          if (!isAnimal(opponent)) {
            generateCombatSkillResponse(
              playerCharacter,
              opponent,
              'SCALDING_WATER',
              'burning water'
            ).then(response => {
              if (response.dialogue) {
                setLlmDialogue({ text: response.dialogue, visible: true });
              }
            }).catch(error => {
              console.warn('Failed to generate scalding water dialogue:', error);
            });
          }
          break;
          
        case 'SCYTHE_SWEEP':
          const scytheDamage = 15 + playerCharacter.stats.strength;
          const scytheResult = calculateDamage(playerCharacter, opponent, scytheDamage);
          applyDamage(scytheResult, 'opponent');
          const applyBleed = Math.random() < 0.6;
          if (applyBleed) {
            setOpponent(prev => ({
              ...prev,
              statusEffects: [...prev.statusEffects, { type: 'bleeding', duration: 3, potency: 3 }]
            }));
            addLog(`Wide scythe sweep cuts for ${scytheResult.damage} damage and causes bleeding!`, 'player');
          } else {
            addLog(`Wide scythe sweep cuts for ${scytheResult.damage} damage!`, 'player');
          }
          setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + scytheResult.damage }));
          
          // Generate NPC dialogue reaction to scythe sweep
          if (!isAnimal(opponent)) {
            generateCombatSkillResponse(
              playerCharacter,
              opponent,
              'SCYTHE_SWEEP',
              applyBleed ? 'bleeding slash' : 'wide slash'
            ).then(response => {
              if (response.dialogue) {
                setLlmDialogue({ text: response.dialogue, visible: true });
              }
            }).catch(error => {
              console.warn('Failed to generate scythe sweep dialogue:', error);
            });
          }
          break;
          
        case 'DIVINE_PROTECTION':
          onCharacterUpdate(p => ({
            ...p,
            statusEffects: [...p.statusEffects, { type: 'blessed', duration: 3, potency: 5 }]
          }));
          addLog('Divine blessing reduces incoming damage for 3 turns!', 'player');
          break;
          
        case 'NET_THROW':
          setOpponent(prev => ({
            ...prev,
            statusEffects: [...prev.statusEffects, { type: 'entangled', duration: 2, potency: 0 }]
          }));
          addLog('Your fishing net entangles the opponent, reducing their actions!', 'player');
          
          // Generate NPC dialogue reaction to net throw
          if (!isAnimal(opponent)) {
            generateCombatSkillResponse(
              playerCharacter,
              opponent,
              'NET_THROW',
              'entangled'
            ).then(response => {
              if (response.dialogue) {
                setLlmDialogue({ text: response.dialogue, visible: true });
              }
            }).catch(error => {
              console.warn('Failed to generate net throw dialogue:', error);
            });
          }
          break;
          
        default:
          // Generic profession attack
          const genericDamage = 10 + Math.floor(playerCharacter.stats.strength / 2);
          const genericResult = calculateDamage(playerCharacter, opponent, genericDamage);
          applyDamage(genericResult, 'opponent');
          addLog(`Your ${getAttackDisplayName(skillId)} deals ${genericResult.damage} damage!`, 'player');
          setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + genericResult.damage }));
          
          // Generate NPC dialogue reaction to generic profession skill
          if (!isAnimal(opponent)) {
            generateCombatSkillResponse(
              playerCharacter,
              opponent,
              skillId,
              'profession skill'
            ).then(response => {
              if (response.dialogue) {
                setLlmDialogue({ text: response.dialogue, visible: true });
              }
            }).catch(error => {
              console.warn('Failed to generate profession skill dialogue:', error);
            });
          }
          break;
      }
      
      setTimeout(() => {
        setPlayerAnimation('idle');
        if (getOpponentHealth(opponent) <= 0) {
          endCombat('victory');
        } else {
          endPlayerTurn();
        }
      }, 500);
    }, 600);
  };
  
  const handleItemSelection = (item: Item) => {
    setSelectedItem(item);
    setActiveMenu('itemAction');
    setSelectedCommandIndex(0);
  };

  const handleItemThrow = async (item: Item) => {
    if (!isPlayerTurn || isResolving) return;

    // Check if item can be thrown effectively
    if (!canThrowEffectively(item)) {
      addLog(`The ${item.name} is too unwieldy to throw effectively.`, 'player');
      return;
    }

    setIsResolving(true);

    // Calculate throw result using the enhanced system
    const throwResult = calculateThrowResult(item, playerCharacter, opponent);

    addLog(`You throw ${item.name} at ${opponent.name}.`, 'player');
    onUseCombatItem(item);

    setPlayerAnimation('attack');
    // Play throw sound
    gameSoundsService.playCombatThrowSound();

    // Fire the projectile with item data
    fireProjectile('thrown', 'right', item);

    // Delay damage calculation to match projectile arrival (90% of animation time)
    const impactDelay = Math.floor(throwResult.animationDuration * 0.9);

    setTimeout(() => {
      if (throwResult.damage > 0) {
        // Hit - use the flavor text from the calculation
        addLog(throwResult.flavorText, 'player');

        // Use the same health update logic as regular attacks
        const currentHealth = getOpponentHealth(opponent);
        const newHealth = Math.max(0, currentHealth - throwResult.damage);

        setOpponent(prev => {
          if (isAnimal(prev)) {
            return { ...prev, health: newHealth };
          } else {
            return { ...prev, health: { current: newHealth, max: prev.health.max } };
          }
        });

        setOpponentAnimation('damaged');
        const isCrit = Math.random() < throwResult.criticalChance;
        addDamageSplat(throwResult.damage.toString(), isCrit ? 'crit' : 'damage', 'opponent');

        // Enhanced sound effects based on weapon type
        if (throwResult.weaponType === 'explosive') {
          gameSoundsService.playExplosionSound?.() || gameSoundsService.playImpactSound();
        } else if (isCrit) {
          gameSoundsService.playCriticalHitSound();
        } else {
          gameSoundsService.playImpactSound();
        }

        triggerScreenShake(throwResult.damage, isCrit);
        checkAndTriggerLowHealthDialogue(newHealth);

        // Track combat stats
        setCombatStats(prev => ({
          ...prev,
          playerDamageDealt: prev.playerDamageDealt + throwResult.damage,
          criticalHits: isCrit ? prev.criticalHits + 1 : prev.criticalHits,
          itemsThrown: prev.itemsThrown ? prev.itemsThrown + 1 : 1
        }));

        // Check for victory
        if (newHealth <= 0) {
          const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
          addLog(victoryText || `${opponentName} is defeated!`, 'system');
          setTimeout(() => handleCombatVictory(opponent), 1000);
        }

        // Reset opponent animation after damage animation
        setTimeout(() => {
          setOpponentAnimation('idle');
        }, 600);
      } else {
        // Miss - use flavor text from calculation
        addLog(throwResult.flavorText, 'player');
      }
    }, impactDelay);

    // End turn after full animation completes
    setTimeout(() => {
        setPlayerAnimation('idle');
        setIsResolving(false); // Always reset resolving state
        if (throwResult.damage > 0 && getOpponentHealth(opponent) - throwResult.damage > 0) {
          endPlayerTurn();
        } else {
          // For misses or when opponent dies, still need to end the turn
          endPlayerTurn();
        }
    }, throwResult.animationDuration + 400); // After projectile animation completes
  };

  const handleItemUse = async (item: Item) => {
    if (!isPlayerTurn || isResolving) return;
    setIsResolving(true);
    addLog(`You use ${item.name}.`, 'player');
    onUseCombatItem(item);
    
    setPlayerAnimation('item');

    // Apply immediate effects
    if (item.sustenance) {
        const healAmount = item.sustenance;
        onCharacterUpdate(p => ({...p, health: Math.min(p.maxHealth, p.health + healAmount)}));
        addDamageSplat(healAmount.toString(), 'heal', 'player');
        addLog(`You heal for ${healAmount} HP.`, 'system');
    }

    // Get LLM reaction
    try {
      const reaction = await generateCombatItemResponse(playerCharacter, opponent, item);
      setLlmDialogue({ text: reaction.dialogue, visible: true });
    } catch (error) {
      console.warn('LLM reaction failed:', error);
    }

    setTimeout(() => {
        setPlayerAnimation('idle');
        endPlayerTurn();
    }, 800);
  }

  const handleTalkSend = async () => {
    if (!talkInput.trim() || isSubmittingTalk) return;
    setIsSubmittingTalk(true);
    
    try {
      const result = await generateCombatTalkResponse(playerCharacter, opponent, talkInput);
      
      setLlmDialogue({ text: result.dialogue, visible: true });
      setTalkInput('');
      setIsSubmittingTalk(false);
      setActiveMenu('main');
      
      if (result.endsCombat) {
          addLog("The tense situation diffuses.", 'system');
          setTimeout(handleCombatEnd, 1500);
      } else {
          setIsResolving(true);
          setTimeout(endPlayerTurn, 800);
      }
    } catch (error) {
      console.warn('Talk response failed:', error);
      setIsSubmittingTalk(false);
      addLog("Communication failed.", 'system');
      setActiveMenu('main');
    }
  };
  
  const renderMenu = () => {
    if (!isPlayerTurn || isResolving) return null;
  
    let commands: string[] = [];
    let commandHandlers: (() => void)[] = [];
    let commandAvailability: boolean[] = [];

    if (activeMenu === 'talk') {
        return (
            <div className="ff6-dialogue-container">
                <div className="ff6-input-box">
                    <input
                        ref={talkInputRef}
                        type="text"
                        value={talkInput}
                        onChange={(e) => setTalkInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleTalkSend(); if (e.key === 'Escape') setActiveMenu('main'); }}
                        className="ff6-input-field"
                        placeholder="Type your message..."
                        disabled={isSubmittingTalk}
                    />
                    <button onClick={handleTalkSend} disabled={isSubmittingTalk} className="ff6-talk-button">
                        {isSubmittingTalk ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        );
    }

    if (activeMenu === 'main') {
        commands = menuCommands.main;

        // Build command handlers dynamically based on what's in the menu
        const handlers = [];
        const availability = [];

        for (const command of commands) {
            switch (command) {
                case 'Attack':
                    handlers.push(() => handleAction('attack'));
                    availability.push(true);
                    break;
                case 'Skills':
                    handlers.push(() => setActiveMenu('skills'));
                    availability.push(true);
                    break;
                case 'Items':
                    handlers.push(() => setActiveMenu('items'));
                    const hasUsableItems = inventory.some(i => i.category === 'Consumable' || i.sustenance) ||
                                          inventory.some(item => item.throwable && canThrowEffectively(item));
                    availability.push(hasUsableItems);
                    break;
                case 'Ranged Attack':
                    handlers.push(() => setActiveMenu('rangedAttack'));
                    availability.push(true); // If it's in the menu, it's available
                    break;
                case 'Defend':
                    handlers.push(() => handleAction('defend'));
                    availability.push(true);
                    break;
                case 'Talk':
                    handlers.push(() => handleAction('talk'));
                    availability.push(true);
                    break;
                case 'Flee':
                    handlers.push(() => handleAction('flee'));
                    availability.push(true);
                    break;
            }
        }

        commandHandlers = handlers;
        commandAvailability = availability;
    } else if (activeMenu === 'skills') {
        commands = menuCommands.skills;
        commandHandlers = [...allPlayerSkills.map(id => () => handleSkillUse(id)), () => setActiveMenu('main')];
        
        // Check skill requirements
        commandAvailability = allPlayerSkills.map(id => {
            if (id === 'CHOP') return playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('axe') || true;
            if (id === 'BURN') return round > 2; // Available after round 2
            if (id === 'FIRST_AID') return playerCharacter.health < playerCharacter.maxHealth * 0.8;
            return true;
        });
        commandAvailability.push(true); // Back button always available
    } else if (activeMenu === 'items') {
        commands = menuCommands.items;
        const consumableItems = inventory.filter(item => item.category === 'Consumable' || item.sustenance);
        const allThrowableItems = inventory.filter(item => item.throwable && canThrowEffectively(item));
        const allUsableItems = [...consumableItems, ...allThrowableItems];
        commandHandlers = [
          ...consumableItems.map(item => () => handleItemSelection(item)),
          ...allThrowableItems.map(item => () => {
            handleItemThrow(item);
            setActiveMenu('main');
          }),
          () => setActiveMenu('main')
        ];
        commandAvailability = [...allUsableItems.map(() => true), true];
    } else if (activeMenu === 'rangedAttack') {
        commands = menuCommands.rangedAttack;
        // Helper function for ranged weapons (same as above)
        const isActualRangedWeapon = (item: Item): boolean => {
          const weaponType = getThrowableWeaponType(item);
          return weaponType === 'throwing_weapon' || weaponType === 'ranged_weapon' || weaponType === 'projectile';
        };
        const equippedRangedWeapons = getEquippedThrowableWeapons(playerCharacter).filter(isActualRangedWeapon);
        const inventoryRangedWeapons = inventory.filter(item =>
          item.throwable && canThrowEffectively(item) && isActualRangedWeapon(item)
        );
        const allRangedWeapons = [...equippedRangedWeapons, ...inventoryRangedWeapons];
        commandHandlers = [...allRangedWeapons.map(item => () => {
          handleItemThrow(item);
          setActiveMenu('main');
        }), () => setActiveMenu('main')];
        commandAvailability = [...allRangedWeapons.map(() => true), true];
    } else if (activeMenu === 'itemAction' && selectedItem) {
        commands = ['Use', 'Throw', 'Back'];
        commandHandlers = [
            () => { handleItemUse(selectedItem); setActiveMenu('main'); setSelectedItem(null); },
            () => { handleItemThrow(selectedItem); setActiveMenu('main'); setSelectedItem(null); },
            () => { setActiveMenu('main'); setSelectedItem(null); setSelectedCommandIndex(0); }
        ];
        commandAvailability = [true, true, true];
    }

    const itemsPerRow = 3;
    const pointerRow = Math.floor(selectedCommandIndex / itemsPerRow);
    const pointerCol = selectedCommandIndex % itemsPerRow;
    const pointerTop = `${1.2 + pointerRow * 2.5}rem`; 
    const pointerLeft = `${0.5 + pointerCol * (100 / itemsPerRow)}%`; 

    return (
      <>
        {activeMenu === 'itemAction' && selectedItem && (
          <div style={{
            color: '#e5e5e5',
            fontSize: '14px',
            textAlign: 'center',
            marginBottom: '8px',
            padding: '4px',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '4px'
          }}>
            {selectedItem.name}
          </div>
        )}
        <div className="combat-command-grid">
          <div className="ff-pointer" style={{ top: pointerTop, left: pointerLeft }} />
          {commands.length > 0 ? commands.map((cmd, index) => {
             const isAvailable = commandAvailability[index] !== false;
             // Get the actual item if we're in items menu
             const usableItems = inventory.filter(item => item.category === 'Consumable' || item.sustenance);
             const isItemCommand = activeMenu === 'items' && index < usableItems.length;
             const itemForCommand = isItemCommand ? usableItems[index] : null;

             return (
                <button
                  key={`${activeMenu}-${cmd}-${index}`}
                  onClick={isAvailable ? commandHandlers[index] : undefined}
                  className={`combat-command-button ${!isAvailable ? 'unavailable' : ''} ${index === selectedCommandIndex && isAvailable ? 'ready-flash' : ''} ${activeMenu === 'skills' && index < allPlayerSkills.length && isProfessionSkill(allPlayerSkills[index]) ? 'profession-skill' : ''}`}
                  onMouseEnter={() => setSelectedCommandIndex(index)}
                  title={activeMenu === 'main' ? `Press ${index + 1} or use arrow keys` : 'Use arrow keys to navigate'}
                  disabled={!isAvailable}
                  style={itemForCommand ? {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    justifyContent: 'flex-start'
                  } : {}}
                >
                    {itemForCommand && (
                      <div style={{ flexShrink: 0 }}>
                        <GenerativeItemIcon item={itemForCommand} size={32} />
                      </div>
                    )}
                    <span style={itemForCommand ? {
                      fontSize: '0.75rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    } : {}}>
                      {cmd}
                    </span>
                    {activeMenu === 'skills' && !isAvailable && <span className="skill-locked">🔒</span>}
                    {activeMenu === 'skills' && isAvailable && index < combatSkills.length && round > 3 && index === 0 && (
                        <span className="skill-ready">✨</span>
                    )}
                </button>
             );
          }) : (
            <div className="col-span-3 text-center text-gray-400 text-sm p-4">No usable items.</div>
          )}
        </div>
      </>
    );
  };

  // Calculate health percentages safely
  const playerHealthPercent = (playerCharacter.health / playerCharacter.maxHealth) * 100;
  const opponentHealthValue = typeof opponent.health === 'number' ? opponent.health : (opponent.health?.current || 0);
  const opponentHealthPercent = (opponentHealthValue / enhancedMaxHealth) * 100;

  // Fallback mapping for biomes that don't have their own specific background
  // This is only used AFTER checking for the specific biome file first!
  const BIOME_FALLBACK_MAPPING: { [key: string]: string } = {
    // Ocean variants can fall back to ocean
    'deep_ocean': 'ocean',
    'shallow_ocean': 'ocean',

    // River variants can fall back to riverbank
    'major_river': 'riverbank',

    // Forest variants can fall back to forest
    'dense_forest': 'forest',

    // Mountain variants can fall back to mountain
    'high_peak': 'mountain',

    // Urban fallbacks - low density falls back to high density
    'low_density_city': 'dense_city',
    'urban': 'dense_city', // Legacy urban falls back to dense_city
    'hamlet': 'low_density_city', // Hamlet falls back to low density, then dense

    // These should try their specific names first, but have logical fallbacks
    'cliff': 'hills',
    'scrub': 'grassland',
    'steppe': 'grassland',
    'park': 'grassland',
    'road': 'grassland',
    'salt_flats': 'desert',
    'oasis': 'desert',
    'active_lava': 'desert',
    'volcanic_rock': 'hills',
    'volcanic_soil': 'hills',
    'estuary': 'wetlands',
    'mangrove': 'wetlands',
    'reef': 'riverbank',
    'shoals_tile': 'riverbank',

    // Special/Ethereal
    'air': 'sky',

    // Urban distinctions that should use specific urban types
    'city_center': 'dense_city',
    'marketplace': 'low_density_city',
    'government_district': 'dense_city',
    'palace': 'dense_city',
    'holy_site': 'dense_city',
    'harbor_district': 'low_density_city',
    'industrial_district': 'dense_city',
    'plaza': 'low_density_city'
  };

  // Background selection functions now imported from backgroundSelectionService

  // Determine current biome from tile data
  const getCurrentBiome = (): string => {
    // Combat happens where the combatant is standing, so check their tile first
    // Use Math.floor to handle any floating point position issues
    const combatantX = Math.floor(combatant.x || playerCharacter.x || 0);
    const combatantY = Math.floor(combatant.y || playerCharacter.y || 0);

    // Also check player position as fallback
    const playerX = Math.floor(playerCharacter.x || 0);
    const playerY = Math.floor(playerCharacter.y || 0);

    // First try the combatant's tile (where combat is actually happening)
    let tile = mapData?.tiles?.[combatantY]?.[combatantX];

    // If combatant tile not found or invalid, use player's tile
    if (!tile || !tile.biome) {
      tile = mapData?.tiles?.[playerY]?.[playerX];
    }

    console.log('[CombatModal] Debug biome detection:', {
      combatantPos: { x: combatantX, y: combatantY },
      playerPos: { x: playerX, y: playerY },
      usingTile: tile ? 'found' : 'not found',
      tile: tile ? {
        x: tile.x,
        y: tile.y,
        biome: tile.biome,
        isLand: tile.isLand,
        altitude: tile.altitude
      } : 'no tile found',
      mapDataExists: !!mapData,
      tilesExists: !!mapData?.tiles
    });

    if (tile?.biome) {
      console.log('[CombatModal] Using biome:', tile.biome);
      return tile.biome;
    }
    console.log('[CombatModal] Using fallback: GRASSLAND');
    return 'GRASSLAND'; // default fallback
  };

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [isUsingNightImage, setIsUsingNightImage] = useState(false);
  const currentBiome = useMemo(() => getCurrentBiome(), [mapData, playerCharacter.x, playerCharacter.y, combatant.x, combatant.y]);

  // Calculate night overlay intensity
  const nightIntensity = useMemo(() => {
    return getNightOverlayIntensity(gameTime);
  }, [gameTime]);

  // Only apply tinting if we're not using a custom night image
  const shouldApplyNightTint = useMemo(() => {
    return nightIntensity > 0 && !isUsingNightImage;
  }, [nightIntensity, isUsingNightImage]);

  // Generate combat start dialogue when combat begins
  useEffect(() => {
    const generateStartDialogue = async () => {
      // Only trigger for NPCs, and add a slight delay to ensure component is ready
      if (!isAnimal(opponent)) {
        try {
          const response = await generateCombatStartResponse(playerCharacter, opponent);
          if (response.dialogue) {
            // Add a short delay to ensure the dialogue appears
            setTimeout(() => {
              setLlmDialogue({ text: response.dialogue, visible: true });
            }, 500);
          }
        } catch (error) {
          console.warn('Failed to generate combat start dialogue:', error);
        }
      }
    };
    
    generateStartDialogue();
  }, []); // Only run once when component mounts

  // Enhanced background selection with weather, time, and cultural awareness
  useEffect(() => {
    const checkBackgroundImage = async () => {
      // Generate priority-ordered background paths using shared service
      const backgroundPaths = getBackgroundPaths(currentBiome, weather, gameTime, culturalZone, mapData?.climate, mapData?.season);

      console.log('[CombatModal] Climate-aware background selection using shared service');

      // Use shared background loading service
      const backgroundUrl = await loadBackgroundImage(backgroundPaths);

      // Check if we loaded a night-specific image
      const usingNightImage = backgroundUrl ? backgroundUrl.includes('_night') : false;
      setIsUsingNightImage(usingNightImage);

      setBackgroundImage(backgroundUrl);
    };

    checkBackgroundImage();
  }, [currentBiome, weather, gameTime, culturalZone, mapData?.climate, mapData?.season]);

  return (
    <div ref={wrapperRef}
         className={`combat-modal-wrapper ${screenShake.active ? `animate-screen-shake-${screenShake.intensity}` : ''} ${backgroundImage ? 'has-background' : ''}`}
         style={{}}
         onClick={handleDismissDialogue}>
        {/* Background with night overlay - separate div so effect only affects background */}
        {backgroundImage && (
          <>
            <div
              className="combat-background-layer"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 0,
                // Apply darkening filter only if not using custom night image
                ...(shouldApplyNightTint && { filter: getNightFilter(nightIntensity) })
              }}
            />
            {/* Blue overlay for night time - only if not using custom night image */}
            {shouldApplyNightTint && (
              <div
                className="night-overlay"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: getNightOverlayGradient(nightIntensity),
                  mixBlendMode: 'multiply' as any,
                  zIndex: 1,
                  pointerEvents: 'none',
                  transition: 'opacity 2s ease-in-out'
                }}
              />
            )}
            {/* Weather effects overlay */}
            {weather && (
              <WeatherEffects
                weather={weather}
              />
            )}
          </>
        )}
        <div className="combat-screen-fx-wrapper" style={{ position: 'relative', zIndex: 2 }}>
            {/* Combat Stage */}
            <div className="combat-stage-platform"></div>
            
            {/* Special Attack Announcement - FF6 Style */}
            {specialAttackAnnouncement.visible && (
                <div className="ff6-special-attack-announcement">
                    {specialAttackAnnouncement.text}
                </div>
            )}
            
            {/* LLM Dialogue */}
            {llmDialogue?.visible && (
                <div className="ff6-npc-dialogue animate-popIn" style={{
                    position: 'absolute',
                    top: '10%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 1000,
                    background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    border: '3px solid #4a90e2',
                    borderRadius: '12px',
                    padding: '16px 24px',
                    maxWidth: '80%',
                    textAlign: 'center',
                    fontSize: '16px',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                    cursor: 'pointer'
                }}>
                    {llmDialogue.text}
                </div>
            )}
            
            {/* Projectile Container */}
            <div className="projectile-container">
                {activeProjectiles.map(projectile => {
                    // Enhanced animation selection based on trajectory
                    const getAnimationName = (proj: any) => {
                      const direction = proj.direction === 'right' ? '' : 'Reverse';
                      const trajectory = proj.trajectory || 'arc';

                      switch (trajectory) {
                        case 'straight':
                          return `throwStraight${direction}`;
                        case 'spinning':
                          return `throwSpinning${direction}`;
                        case 'arc':
                        default:
                          return `throwArc${direction}`;
                      }
                    };

                    const animationDuration = projectile.duration || 2000;
                    const animationName = getAnimationName(projectile);

                    return projectile.type === 'thrown' && projectile.item ? (
                        // Thrown item with icon
                        <div
                            key={projectile.id}
                            className="thrown-item-projectile"
                            style={{
                                position: 'absolute',
                                left: projectile.direction === 'right' ? '30%' : '70%',
                                top: '50%',
                                animation: `${animationName} ${animationDuration}ms ease-out`,
                                width: '64px',
                                height: '64px',
                                zIndex: 1000,
                                pointerEvents: 'none',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                            }}
                        >
                            <GenerativeItemIcon item={projectile.item} size={64} />
                        </div>
                    ) : (
                        // Regular projectile (arrow, bolt, magic)
                        <div
                            key={projectile.id}
                            className={`projectile projectile-${projectile.type} enhanced-projectile`}
                            style={{
                                left: projectile.direction === 'right' ? '30%' : '70%',
                                top: '50%',
                                animation: projectile.direction === 'right'
                                    ? `throwStraight ${animationDuration}ms linear`
                                    : `throwStraightReverse ${animationDuration}ms linear`,
                                width: '16px',
                                height: '16px',
                                boxShadow: '0 0 8px rgba(255, 215, 0, 0.6), 0 0 4px rgba(255, 255, 255, 0.3)'
                            }}
                        />
                    );
                })}
            </div>
            
            {/* Combat Scene with elevated sprites */}
            <div className="combat-scene-elevated">
                <div className={`combatant-sprite-wrapper player-side ${isPlayerTurn ? 'active-turn' : ''}`} style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', animationDuration: `${0.8 / combatSpeed}s` }}>
                    <div className={`sprite-with-effects ${playerCharacter.statusEffects.map(e => `has-${e.type}`).join(' ')}`} style={{ position: 'relative' }}>
                        {/* Player health bar */}
                        <div className="floating-health-bar player-health" style={{
                            position: 'absolute',
                            top: '-25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60px',
                            height: '8px',
                            background: 'rgba(0,0,0,0.7)',
                            borderRadius: '4px',
                            border: '1px solid #ffffff',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${Math.max(0, playerHealthPercent)}%`,
                                height: '100%',
                                background: playerHealthPercent > 50 ? '#10b981' : playerHealthPercent > 20 ? '#f59e0b' : '#ef4444',
                                transition: 'all 0.3s ease'
                            }} />
                        </div>
                        {playerCharacter.health > 0 && (
                          <>
                            <CombatSpritePixel character={playerCharacter} isPlayer={true} animation={
                              // Map specific combat animations to base animations that CombatSpritePixel supports
                              ['slashing', 'chopping', 'stabbing', 'crushing', 'shooting', 'power_strike',
                               'mounted-charge', 'sword-and-board', 'timber-strike', 'precise-cut',
                               'scythe-sweep', 'pitchfork-thrust', 'net-throw', 'gutting-knife',
                               'desperate-swing', 'improvised-weapon'].includes(playerAnimation) ? 'attacking' :
                              playerAnimation === 'burn' ? 'burn' :
                              ['casting', 'forge-heat', 'metalwork-expertise'].includes(playerAnimation) ? 'item' :
                              ['blocking', 'dodging', 'parrying', 'wooden-barrier', 'defending'].includes(playerAnimation) ? 'defending' :
                              ['shouting', 'singing', 'chivalrous-challenge'].includes(playerAnimation) ? 'item' :
                              ['observing', 'foraging', 'digging', 'bandaging', 'grappling', 'feinting',
                               'harvest-endurance', 'sailors-strength'].includes(playerAnimation) ? 'item' :
                              playerAnimation === 'fleeing' ? 'fleeing' :
                              playerAnimation === 'damaged' ? 'damaged' :
                              'idle'
                            } facing="right" />
                            {/* Character shadow */}
                            <div style={{
                              position: 'absolute',
                              bottom: '0px',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              width: '50px',
                              height: '12px',
                              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, transparent 70%)',
                              borderRadius: '50%',
                              zIndex: -1
                            }} />
                          </>
                        )}
                        {/* Status effect overlays for player with proper stacking */}
                        {playerCharacter.statusEffects.map((effect, index) => (
                            <div
                                key={effect.type}
                                className={`status-overlay status-${effect.type}`}
                                style={{
                                    transform: `translateX(${index * 15}px) translateY(${index * -10}px)`,
                                    zIndex: 10 + index
                                }} />
                        ))}
                    </div>
                    
                    {/* Tamed Animals with better positioning - moved outside player animation */}
                </div>

                {/* Tamed Animals - separated from player animation */}
                <div className="tamed-animals-formation" style={{
                    position: 'absolute',
                    left: '15%',
                    bottom: '20px',
                    zIndex: 5
                }}>
                        {tamedAnimals.filter(animal => tamedAnimalHealth[animal.id] > 0).map((animal, index) => {
                            const row = Math.floor(index / 2);
                            const col = index % 2;
                            return (
                                <div key={animal.id} style={{
                                    position: 'absolute',
                                    left: `${col * 60}px`,
                                    bottom: `${row * 40}px`,
                                    zIndex: 10 - row
                                }}>
                                    <AnimalCombatSprite
                                        animal={{
                                            ...animal,
                                            baseId: animal.baseId,
                                            type: ANIMAL_DATA[animal.baseId]?.type || 'Domestic',
                                            health: tamedAnimalHealth[animal.id],
                                            maxHealth: ANIMAL_DATA[animal.baseId]?.maxHealth || 10,
                                            stats: {
                                                level: animal.stats?.level || 1,
                                                attack: ANIMAL_DATA[animal.baseId]?.attack || 1,
                                                defense: ANIMAL_DATA[animal.baseId]?.defense || 1,
                                                ...animal.stats
                                            }
                                        } as AnimalEntity}
                                        animation={tamedAnimalAnimation[animal.id] || 'idle'}
                                        size={getAnimalSize(animal) * 0.7}
                                        facing="right"
                                    />
                                </div>
                            );
                        })}
                    </div>
                    
                    {damageSplats.filter(s => s.target === 'player').map(splat => (
                         <div key={splat.id} className={`damage-splat ${splat.type} damage-float-up`}>{splat.text}</div>
                    ))}
                
                <div className={`combatant-sprite-wrapper opponent-side ${!isPlayerTurn ? 'active-turn' : ''}`} style={{ animationDuration: `${0.8 / combatSpeed}s` }}>
                    <div className={`sprite-with-effects ${opponent.statusEffects.map(e => `has-${e.type}`).join(' ')} ${enemyEnhancement.type ? `enhanced-${enemyEnhancement.type}` : ''}`} style={{ position: 'relative' }}>
                        {/* Opponent health bar */}
                        <div className="floating-health-bar opponent-health" style={{
                            position: 'absolute',
                            top: '-25px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '60px',
                            height: '8px',
                            background: 'rgba(0,0,0,0.7)',
                            borderRadius: '4px',
                            border: '1px solid #ffffff',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${Math.max(0, opponentHealthPercent)}%`,
                                height: '100%',
                                background: opponentHealthPercent > 50 ? '#10b981' : opponentHealthPercent > 20 ? '#f59e0b' : '#ef4444',
                                transition: 'all 0.3s ease'
                            }} />
                        </div>
                        {/* Combo attack visual effect */}
                        {comboCount > 0 && (
                            <div className="combo-attack-flash" style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: `radial-gradient(ellipse at center, transparent 30%, rgba(255, 215, 0, ${0.2 + comboCount * 0.1}) 100%)`,
                                animation: 'comboFlash 0.3s ease-out',
                                pointerEvents: 'none',
                                zIndex: 100
                            }} />
                        )}
                        {getOpponentHealth(opponent) > 0 && (
                            <>
                                {isAnimal(opponent)
                                    ? <AnimalCombatSprite 
                                        animal={opponent} 
                                        animation={opponentAnimation as any}
                                        size={getAnimalSize(opponent)}
                                        facing="left"
                                      />
                                    : <CombatSpritePixel character={opponent} enhancement={enemyEnhancement.type} animation={
                                      opponentAnimation === 'special' ? 'attacking' :
                                      opponentAnimation === 'fleeing' ? 'fleeing' :
                                      opponentAnimation === 'damaged' ? 'damaged' :
                                      opponentAnimation === 'attacking' ? 'attacking' :
                                      'idle'
                                    } facing="left" />
                                }
                                {/* Character shadow */}
                                <div style={{
                                  position: 'absolute',
                                  bottom: '0px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  width: '50px',
                                  height: '12px',
                                  background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 50%, transparent 70%)',
                                  borderRadius: '50%',
                                  zIndex: -1
                                }} />
                            </>
                        )}
                        {/* Status effect overlays for opponent with proper stacking */}
                        {opponent.statusEffects.map((effect, index) => (
                            <div
                                key={effect.type}
                                className={`status-overlay status-${effect.type}`}
                                style={{
                                    transform: `translateX(${index * 15}px) translateY(${index * -10}px)`,
                                    zIndex: 10 + index
                                }} />
                        ))}
                    </div>
                    <div className="opponent-damage-container">
                        {damageSplats.filter(s => s.target === 'opponent').map(splat => (
                             <div key={splat.id} className={`damage-splat ${splat.type} damage-float-up`}>{splat.text}</div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Compact Combat Log Panel */}
            <div className="ff6-combat-log-panel">
                 <div className="ff6-combat-log-content scrollbar-thin" ref={logRef}>
                     {combatLog.map(log => (
                        <p key={log.id} className={`ff6-log-entry ${
                          log.actor === 'player' ? 'player-text' : ''
                        } ${
                          log.actor === 'opponent' ? 'opponent-text' : ''
                        } ${
                          log.actor === 'system' ? 'system-text' : ''
                        }`}>
                            <span className="round-indicator">R{log.round}:</span>{log.message}
                        </p>
                    ))}
                </div>
            </div>

            <div className="combat-ui-panel">
                {renderMenu()}
            </div>
            
            {/* Combat Stats Badge */}
            <div className="combat-stats-badge-wrapper">
            <div className="combat-stats-badge" style={{
                position: 'absolute',
                bottom: '120px',
                right: '30px',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '2px solid #60a5fa',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '10px',
                fontFamily: "'Press Start 2P', monospace",
                color: '#60a5fa',
                minWidth: '140px',
                boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
                zIndex: 500
            }}>
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>💥</span>
                    <span>DMG: {combatStats.playerDamageDealt}</span>
                </div>
                <div style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚡</span>
                    <span>CRITS: {combatStats.criticalHits}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🕐</span>
                    <span>TURN: {combatStats.turnCount}</span>
                </div>
            </div>
            {/* Combat Speed Controls - COMMENTED OUT FOR NOW
            <div className="combat-speed-controls" style={{
                position: 'absolute',
                top: '20px',
                right: '180px',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '2px solid #60a5fa',
                borderRadius: '8px',
                padding: '8px',
                fontSize: '10px',
                fontFamily: "'Press Start 2P', monospace",
                color: '#60a5fa',
                boxShadow: '0 4px 12px rgba(96, 165, 250, 0.3)',
                zIndex: 500
            }}>
                <div style={{ marginBottom: '4px', fontSize: '8px', color: '#94a3b8' }}>SPEED</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setCombatSpeed(0.5)}
                        style={{
                            padding: '4px 8px',
                            background: combatSpeed === 0.5 ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid #60a5fa',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '8px',
                            cursor: 'pointer'
                        }}
                    >0.5x</button>
                    <button
                        onClick={() => setCombatSpeed(1)}
                        style={{
                            padding: '4px 8px',
                            background: combatSpeed === 1 ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid #60a5fa',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '8px',
                            cursor: 'pointer'
                        }}
                    >1x</button>
                    <button
                        onClick={() => setCombatSpeed(2)}
                        style={{
                            padding: '4px 8px',
                            background: combatSpeed === 2 ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid #60a5fa',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '8px',
                            cursor: 'pointer'
                        }}
                    >2x</button>
                    <button
                        onClick={() => setCombatSpeed(3)}
                        style={{
                            padding: '4px 8px',
                            background: combatSpeed === 3 ? '#3b82f6' : 'rgba(59, 130, 246, 0.2)',
                            border: '1px solid #60a5fa',
                            borderRadius: '4px',
                            color: '#fff',
                            fontSize: '8px',
                            cursor: 'pointer'
                        }}
                    >3x</button>
                </div>
            </div> */}
            </div>
            
            {/* Enhanced Player Info Panel with External Portrait */}
            <div className="player-info-container">
                <div className="portrait-frame">
                    {playerCharacter && (
                        <ProceduralPortrait
                            character={playerCharacter}
                            size={120}
                        />
                    )}
                </div>
                <div className={`info-panel player-panel ${isPlayerTurn ? 'active-turn' : ''}`}>
                    <h4 className="character-name player-name">{playerCharacter.name}</h4>
                    <div className="character-stats">
                        <div className="stat-line">Lvl: {playerCharacter.level}</div>
                        <div className="stat-line">HP: {Math.ceil(playerCharacter.health)}/{Math.ceil(playerCharacter.maxHealth)}</div>
                    </div>
                    <div className="health-bar-container">
                        <div
                            className={`health-bar ${playerHealthPercent > 50 ? 'healthy' : playerHealthPercent > 25 ? 'warning' : 'critical'}`}
                            style={{ width: `${playerHealthPercent}%` }}
                        />
                    </div>
                    <div className="equipment-info">
                        <div className="equipment-line"><strong>Weapon:</strong> {playerCharacter.equippedItems.main_hand?.name || 'Bare Handed'}</div>
                        <div className="equipment-line"><strong>Armor:</strong> {playerCharacter.equippedItems.torso?.name || playerCharacter.appearance.garment.name.replace(/_/g, ' ')}</div>
                        <div className="status-effects">
                            {playerCharacter.statusEffects.map(effect => (
                                <span key={effect.type} title={`${effect.type.replace('_', ' ')} (${effect.duration} turns left)`} className="status-icon">
                                    {statusEffectIcons[effect.type]}
                                </span>
                            ))}
                            {isDefending && <span title="Defending" className="status-icon">🛡️</span>}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Tamed Animal Status Panel */}
            {tamedAnimals.length > 0 && (
                <div className="tamed-animals-panel" style={{
                    position: 'absolute',
                    top: '220px',
                    left: '30px',
                    background: 'rgba(26, 26, 46, 0.95)',
                    border: '2px solid #60a5fa',
                    borderRadius: '4px',
                    padding: '8px',
                    fontSize: '10px',
                    fontFamily: "'Press Start 2P', monospace",
                    color: '#fff',
                    maxWidth: '280px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <h4 style={{ color: '#60a5fa', fontSize: '10px' }}>Animal Companions</h4>
                        {!isPlayerTurn && tamedAnimals.some(a => tamedAnimalHealth[a.id] > 0) && (
                            <div style={{ fontSize: '8px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>⭐</span>
                                <span>Next: {(() => {
                                    const nextAnimal = tamedAnimals.find(a => tamedAnimalHealth[a.id] > 0);
                                    if (!nextAnimal) return 'Unknown';
                                    const animalData = ANIMAL_DATA[nextAnimal.baseId];
                                    return nextAnimal.name || nextAnimal.speciesName || animalData?.name || 'Unknown';
                                })()}</span>
                            </div>
                        )}
                    </div>
                    {tamedAnimals.map(animal => {
                        const animalData = ANIMAL_DATA[animal.baseId];
                        const currentHealth = tamedAnimalHealth[animal.id] || 0;
                        const maxHealth = animalData?.maxHealth || 10;
                        const healthPercent = (currentHealth / maxHealth) * 100;
                        const characteristic = getAnimalCharacteristic(animal);
                        const displayName = animal.name || animal.speciesName || animalData?.name || 'companion';
                        const fullDisplayName = characteristic ? `${characteristic} ${displayName}` : displayName;

                        return (
                            <div key={animal.id} style={{ marginBottom: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span style={{ fontSize: '9px' }}>{fullDisplayName}</span>
                                    <span style={{ color: currentHealth > 0 ? '#10b981' : '#ef4444' }}>
                                        {currentHealth > 0 ? `${currentHealth}/${maxHealth}` : 'KO'}
                                    </span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '4px',
                                    background: 'rgba(0,0,0,0.5)',
                                    borderRadius: '2px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${healthPercent}%`,
                                        height: '100%',
                                        background: healthPercent > 50 ? '#10b981' : healthPercent > 25 ? '#f59e0b' : '#ef4444',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
             
            {/* Enhanced Opponent Info Panel with External Portrait */}
            <div className="opponent-info-container">
                <div className={`info-panel opponent-panel ${!isPlayerTurn ? 'active-turn' : ''}`}>
                    <h4 className={`character-name opponent-name ${enemyEnhancement.type ? `enhanced-${enemyEnhancement.type}-name` : ''}`}>
                        {enemyEnhancement.type === 'elite' && '★ '}
                        {enemyEnhancement.type === 'enraged' && '💢 '}
                        {enemyEnhancement.type === 'strong' && '💪 '}
                        {opponentName}
                        {enemyEnhancement.type === 'elite' && ' ★'}
                    </h4>
                    <div className="character-stats">
                        {!isAnimal(opponent) && <div className="stat-line">Lvl: {opponent.stats.level}</div>}
                        {isAnimal(opponent) && <div className="stat-line animal-type">{ANIMAL_DATA[opponent.baseId]?.type || 'Unknown'} • {opponent.stats.level}</div>}
                        <div className="stat-line">HP: {getOpponentHealth(opponent)}/{enhancedMaxHealth}</div>
                    </div>
                    <div className="health-bar-container">
                        <div
                            className={`health-bar ${opponentHealthPercent > 50 ? 'healthy' : opponentHealthPercent > 25 ? 'warning' : 'critical'}`}
                            style={{ width: `${opponentHealthPercent}%` }}
                        />
                    </div>
                    <div className="equipment-info">
                        {isNpc(opponent) && <>
                            <div className="equipment-line"><strong>Weapon:</strong> {opponent.equippedItems?.main_hand?.name || 'Bare Handed'}</div>
                            <div className="equipment-line"><strong>Armor:</strong> {opponent.equippedItems?.torso?.name || opponent.appearance.garment.name.replace(/_/g, ' ')}</div>
                        </>}
                        <div className="status-effects">
                            {opponent.statusEffects.map(effect => (
                                <span key={effect.type} title={`${effect.type.replace('_', ' ')} (${effect.duration} turns left)`} className="status-icon">
                                    {statusEffectIcons[effect.type]}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="portrait-frame">
                    {isNpc(opponent) ? (
                        <ProceduralPortrait
                            character={opponent}
                            size={120}
                        />
                    ) : isAnimal(opponent) ? (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '64px',
                            background: 'linear-gradient(145deg, #2d3748, #1a202c)'
                        }}>
                            {ANIMAL_DATA[opponent.baseId]?.emoji || '🐾'}
                        </div>
                    ) : (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '64px',
                            background: 'linear-gradient(145deg, #2d3748, #1a202c)'
                        }}>
                            ❓
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        <style>{`
         /* Core Combat Layout */
          .combat-modal-wrapper {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(26, 26, 46, 0.7);
            backdrop-filter: blur(2px);
            z-index: 1000;
            font-family: 'Press Start 2P', monospace;
            overflow: hidden;
          }

          .combat-screen-fx-wrapper {
            width: 100%;
            height: 100%;
            position: relative;
          }

          /* Combat Stage Platform */
          .combat-stage-platform {
            position: absolute;
            bottom: 30%;
            left: 25%;
            right: 25%;
            height: 12px;
            background: linear-gradient(90deg, 
              rgba(96, 165, 250, 0.1) 0%, 
              rgba(96, 165, 250, 0.3) 25%, 
              rgba(96, 165, 250, 0.5) 50%, 
              rgba(96, 165, 250, 0.3) 75%, 
              rgba(96, 165, 250, 0.1) 100%
            );
            border-radius: 6px;
            box-shadow: 
              0 2px 15px rgba(96, 165, 250, 0.3),
              0 -2px 10px rgba(0,0,0,0.3),
              inset 0 2px 4px rgba(255,255,255,0.1);
          }

          /* Elevated Combat Scene */
          .combat-scene-elevated {
            position: absolute;
            bottom: 35%;
            left: 5%;
            right: 5%;
            height: 280px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 80px;
          }

          .combatant-sprite-wrapper {
            position: relative;
            transition: all 0.3s ease;
            z-index: 100;
          }

          .player-side {
            margin-left: 40px;
            transform: scale(1.0);
            transform-origin: bottom center;
          }

          .opponent-side {
            margin-right: 40px;
            transform: scale(1.0);
            transform-origin: bottom center;
          }

          .opponent-damage-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }

          /* FF6-Style Info Panels */
          .player-info-container {
            position: absolute;
            top: 30px;
            left: 30px;
            display: flex;
            gap: 0;
            align-items: stretch;
          }

          .opponent-info-container {
            position: absolute;
            top: 30px;
            right: 30px;
            display: flex;
            gap: 0;
            align-items: stretch;
            flex-direction: row-reverse;
          }

          .portrait-frame {
            width: 120px;
            height: 120px;
            background: linear-gradient(145deg, #1a2332, #0f1419);
            border: 3px solid #60a5fa;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 
              inset 0 2px 4px rgba(96, 165, 250, 0.3),
              0 4px 12px rgba(0,0,0,0.6),
              0 0 20px rgba(96, 165, 250, 0.4);
          }
         .info-panel {
            width: 320px;
            height: 120px;
            background: linear-gradient(145deg, #0f1419, #1a2332);
            border: 3px solid #60a5fa;
            border-radius: 8px;
            padding: 10px 18px;
            box-shadow: 
              inset 0 2px 4px rgba(96, 165, 250, 0.2),
              0 4px 12px rgba(0,0,0,0.6),
              0 0 15px rgba(96, 165, 250, 0.3);
            transition: all 0.3s ease;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .player-panel {
            border-left: none;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }

          .opponent-panel {
            border-right: none;
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            text-align: right;
          }

          .active-turn {
            border-color: #fbbf24;
            box-shadow: 
              inset 0 2px 4px rgba(96, 165, 250, 0.2),
              0 4px 12px rgba(0,0,0,0.6),
              0 0 25px rgba(251, 191, 36, 0.6);
          }

          .character-name {
            font-size: 10px;
            margin: 0 0 6px 0;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
            line-height: 1.2;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          /* Mobile text sizing */
          @media (max-width: 768px) {
            .character-name {
              font-size: 9px;
            }
          }
          
          /* Mobile combat stats badge positioning */
          .combat-stats-badge-wrapper {
            position: relative;
          }
          
          @media (max-width: 768px) {
            .combat-stats-badge-wrapper .combat-stats-badge {
              position: fixed !important;
              top: 10px !important;
              right: 10px !important;
              font-size: 8px !important;
              padding: 6px 8px !important;
              min-width: 100px !important;
              border-radius: 6px !important;
              z-index: 1001 !important;
            }
          }

          .player-name {
            color: #60a5fa;
          }

          .opponent-name {
            color: #f87171;
          }

          .character-stats {
            font-size: 9px;
            margin-bottom: 6px;
            line-height: 1.3;
          }

          .stat-line {
            margin-bottom: 2px;
            color: #e2e8f0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .animal-type {
            color: #fbbf24;
          }

          .health-bar-container {
            width: 100%;
            height: 8px;
            background: #0f1419;
            border: 1px solid #60a5fa;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 6px;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
          }

          .health-bar {
            height: 100%;
            transition: all 0.3s ease;
            border-radius: 3px;
          }

          .health-bar.healthy {
            background: linear-gradient(90deg, #10b981, #22c55e);
          }

          .health-bar.warning {
            background: linear-gradient(90deg, #f59e0b, #eab308);
          }

          .health-bar.critical {
            background: linear-gradient(90deg, #ef4444, #dc2626);
          }

          .equipment-info {
            font-size: 8px;
            color: #94a3b8;
            line-height: 1.3;
          }

          .equipment-line {
            margin-bottom: 1px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .status-effects {
            display: flex;
            gap: 4px;
            margin-top: 4px;
            justify-content: flex-start;
          }

          .opponent-panel .status-effects {
            justify-content: flex-end;
          }

          .status-icon {
            font-size: 12px;
            filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.8));
          }

          /* FF6-Style Combat Log */
          .ff6-combat-log-panel {
            position: absolute;
            bottom: 200px;
            left: 50%;
            transform: translateX(-50%);
            width: 800px;
            height: 160px;
            background: linear-gradient(145deg, #0f1419, #1a2332);
            border: 3px solid #60a5fa;
            border-radius: 8px;
            box-shadow: 
              inset 0 2px 4px rgba(96, 165, 250, 0.2),
              0 4px 12px rgba(0,0,0,0.6),
              0 0 15px rgba(96, 165, 250, 0.3);
          }

          .ff6-combat-log-content {
            padding: 12px;
            height: 100%;
            overflow-y: auto;
          }

          .ff6-log-entry {
            font-size: 12px;
            margin-bottom: 4px;
            line-height: 1.5;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
          }

          .round-indicator {
            color: #64748b;
            margin-right: 8px;
          }

          .player-text {
            color: #60a5fa;
          }

          .opponent-text {
            color: #f87171;
          }

          .system-text {
            color: #fbbf24;
          }

          /* FF6-Style Menu */
          .combat-command-grid {
            position: relative;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            padding: 16px;
          }

          .ff6-hand-cursor {
            position: absolute;
            font-size: 14px;
            z-index: 10;
            pointer-events: none;
            transform: translateX(-24px);
            filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.8));
            animation: handBounce 0.8s ease-in-out infinite;
          }

          @keyframes handBounce {
            0%, 100% { transform: translateX(-24px) translateY(0); }
            50% { transform: translateX(-24px) translateY(-2px); }
          }

          .combat-command-button {
            background: linear-gradient(145deg, #3b5998, #2d4373);
            border: 2px solid #60a5fa;
            border-radius: 6px;
            color: #e2e8f0;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
            padding: 12px 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
            box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.2),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 2px 4px rgba(0,0,0,0.4),
              0 0 8px rgba(96, 165, 250, 0.3);
          }

          .combat-command-button:hover {
            background: linear-gradient(145deg, #4a6ba8, #3c5383);
            border-color: #93c5fd;
            transform: translateY(-1px);
            box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.3),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 3px 6px rgba(0,0,0,0.4),
              0 0 12px rgba(96, 165, 250, 0.4);
          }

          .combat-command-button.selected {
            background: linear-gradient(145deg, #5a7bb8, #4c6b93);
            border-color: #fbbf24;
            box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.3),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 2px 4px rgba(0,0,0,0.4),
              0 0 15px rgba(251, 191, 36, 0.6);
          }

          .combat-command-button.profession-skill {
            background: linear-gradient(145deg, #059669, #047857);
            border: 2px solid #10b981;
            color: #ecfdf5;
            box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.2),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 2px 4px rgba(0,0,0,0.4),
              0 0 8px rgba(16, 185, 129, 0.4);
          }

          .combat-command-button.profession-skill:hover {
            background: linear-gradient(145deg, #0d9488, #0f766e);
            border-color: #14b8a6;
            box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.3),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 3px 6px rgba(0,0,0,0.4),
              0 0 12px rgba(20, 184, 166, 0.5);
          }

          .combat-command-button.profession-skill.selected,
          .combat-command-button.profession-skill.ready-flash {
            background: linear-gradient(145deg, #0f766e, #0d9488);
            border-color: #fbbf24;
            box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.3),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 2px 4px rgba(0,0,0,0.4),
              0 0 15px rgba(251, 191, 36, 0.6);
          }

          .combat-command-button.ready-flash {
            background: linear-gradient(145deg, #1e40af, #3b82f6);
            border: 2px solid #60a5fa;
            box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.3),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 3px 8px rgba(0,0,0,0.4),
              0 0 20px rgba(96, 165, 250, 0.8);
            animation: selectedPulse 1.5s ease-in-out infinite;
          }

          @keyframes selectedPulse {
            0% { box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.3),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 3px 8px rgba(0,0,0,0.4),
              0 0 20px rgba(96, 165, 250, 0.8); }
            50% { box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.4),
              inset 0 -2px 6px rgba(0,0,0,0.3),
              0 5px 12px rgba(0,0,0,0.5),
              0 0 30px rgba(96, 165, 250, 1.0); }
            100% { box-shadow: 
              inset 0 2px 6px rgba(255,255,255,0.3),
              inset 0 -2px 6px rgba(0,0,0,0.2),
              0 3px 8px rgba(0,0,0,0.4),
              0 0 20px rgba(96, 165, 250, 0.8); }
          }

          /* FF6-Style Dialogue */
          .ff6-dialogue-container {
            position: absolute;
            bottom: 40px;
            left: 50%;
            transform: translateX(-50%);
            width: 500px;
          }

          .ff6-input-box {
            background: linear-gradient(145deg, #0f1419, #1a2332);
            border: 3px solid #60a5fa;
            border-radius: 8px;
            padding: 16px;
            box-shadow: 
              inset 0 2px 4px rgba(96, 165, 250, 0.2),
              0 4px 12px rgba(0,0,0,0.6),
              0 0 15px rgba(96, 165, 250, 0.3);
          }

          .ff6-input-field {
            width: 100%;
            background: #0f1419;
            border: 2px solid #60a5fa;
            border-radius: 4px;
            color: #e2e8f0;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
            padding: 8px;
            margin-bottom: 12px;
            box-shadow: 
              inset 0 2px 4px rgba(0,0,0,0.5),
              0 0 8px rgba(96, 165, 250, 0.2);
          }

          .ff6-input-field:focus {
            outline: none;
            border-color: #93c5fd;
            box-shadow: 
              inset 0 2px 4px rgba(0,0,0,0.5), 
              0 0 15px rgba(96, 165, 250, 0.4);
          }

          .ff6-talk-button {
            background: linear-gradient(145deg, #0f1419, #1a2332);
            border: 2px solid #60a5fa;
            border-radius: 4px;
            color: #e2e8f0;
            font-family: 'Press Start 2P', monospace;
            font-size: 9px;
            padding: 8px 16px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 
              0 2px 4px rgba(0,0,0,0.3),
              0 0 8px rgba(96, 165, 250, 0.2);
          }
          
          /* Mobile talk interface improvements */
          @media (max-width: 768px) {
            .ff6-input-field {
              font-size: 12px;
              padding: 12px;
              min-height: 44px;
              border-radius: 6px;
              -webkit-appearance: none;
            }
            
            .ff6-talk-button {
              font-size: 11px;
              padding: 12px 20px;
              min-height: 44px;
              border-radius: 6px;
              -webkit-tap-highlight-color: rgba(96, 165, 250, 0.3);
            }
          }

          .ff6-npc-dialogue {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translateX(-50%) translateY(-50%);
            background: linear-gradient(145deg, #0f1419, #1a2332);
            border: 3px solid #60a5fa;
            border-radius: 8px;
            padding: 20px;
            max-width: 400px;
            color: #e2e8f0;
            font-family: 'Press Start 2P', monospace;
            font-size: 10px;
            line-height: 1.6;
            text-shadow: 1px 1px 1px rgba(0,0,0,0.8);
            box-shadow: 
              inset 0 2px 4px rgba(96, 165, 250, 0.2),
              0 4px 20px rgba(0,0,0,0.8),
              0 0 25px rgba(96, 165, 250, 0.4);
            z-index: 200;
          }

          /* Enhanced Attack Animation */
          .animate-sprite-attacking .combatant-sprite-wrapper {
            animation: attackSequence 0.8s ease-in-out;
          }
          
          @keyframes attackSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0); }
            25% { transform: translateX(40px) translateY(-8px) scale(1.05); }
            50% { transform: translateX(60px) translateY(-5px) scale(1.1) rotate(15deg); }
            75% { transform: translateX(50px) translateY(-2px) scale(1.05) rotate(-5deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
          }
          
          /* Power Strike Animation */
          .animate-sprite-power-strike .combatant-sprite-wrapper {
            animation: powerStrikeSequence 1.2s ease-in-out;
          }
          
          @keyframes powerStrikeSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0); }
            15% { transform: translateX(30px) translateY(-50px) scale(1.1); }
            30% { transform: translateX(50px) translateY(-80px) scale(1.2); }
            50% { transform: translateX(70px) translateY(-20px) scale(1.3) rotate(25deg); filter: brightness(1.3); }
            70% { transform: translateX(55px) translateY(5px) scale(1.1) rotate(-10deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); filter: none; }
          }
          
          /* Apply animations to sprite based on animation state */
          .combatant-sprite-wrapper.player-side {
            ${playerAnimation === 'attacking' ? 'animation: attackSequence 0.8s ease-in-out;' : ''}
            ${playerAnimation === 'power_strike' ? 'animation: powerStrikeSequence 1.2s ease-in-out;' : ''}
            ${playerAnimation === 'slashing' ? 'animation: slashSequence 0.7s ease-in-out;' : ''}
            ${playerAnimation === 'chopping' ? 'animation: chopSequence 0.9s ease-in-out;' : ''}
            ${playerAnimation === 'stabbing' ? 'animation: stabSequence 0.6s ease-in-out;' : ''}
            ${playerAnimation === 'crushing' ? 'animation: crushSequence 1.0s ease-in-out;' : ''}
            ${playerAnimation === 'shooting' ? 'animation: shootSequence 0.8s ease-in-out;' : ''}
            ${playerAnimation === 'dodging' ? 'animation: dodgeSequence 0.5s ease-in-out;' : ''}
            ${playerAnimation === 'blocking' ? 'animation: blockSequence 0.4s ease-in-out;' : ''}
            ${playerAnimation === 'casting' ? 'animation: castSequence 1.0s ease-in-out;' : ''}
            ${playerAnimation === 'shouting' ? 'animation: shoutSequence 0.7s ease-in-out;' : ''}
            ${playerAnimation === 'burn' ? 'animation: burnAttack 0.8s ease-out;' : ''}
            ${playerAnimation === 'desperate-swing' ? 'animation: desperateSwing 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);' : ''}
          }

          /* Opponent attack animation (reversed direction) */
          .combatant-sprite-wrapper.opponent-side {
            ${opponentAnimation === 'attacking' ? 'animation: opponentAttackSequence 0.8s ease-in-out;' : ''}
          }

          @keyframes opponentAttackSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0); }
            25% { transform: translateX(-40px) translateY(-8px) scale(1.05); }
            50% { transform: translateX(-60px) translateY(-5px) scale(1.1) rotate(-15deg); }
            75% { transform: translateX(-50px) translateY(-2px) scale(1.05) rotate(5deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
          }
          
          /* Damage Animation */
          .animate-sprite-damaged .combatant-sprite-wrapper {
            animation: damageRecoil 0.6s ease-out;
          }
          
          @keyframes damageRecoil {
            0% { transform: translateX(0) scale(1.0); filter: brightness(1); }
            25% { transform: translateX(-15px) scale(0.9); filter: brightness(1.5) hue-rotate(0deg); }
            50% { transform: translateX(-25px) scale(0.85); filter: brightness(2) hue-rotate(45deg); }
            75% { transform: translateX(-10px) scale(0.95); filter: brightness(1.2) hue-rotate(0deg); }
            100% { transform: translateX(0) scale(1.0); filter: brightness(1); }
          }
          
          /* Defend Animation */
          .animate-sprite-defending .combatant-sprite-wrapper {
            animation: defendStance 0.5s ease-in-out forwards, defendBob 2s ease-in-out infinite 0.5s;
          }
          
          @keyframes defendStance {
            0% { transform: scale(1.0); filter: brightness(1); }
            100% { transform: scale(0.9); filter: brightness(1.2); }
          }

          @keyframes defendBob {
            0%, 100% { transform: scale(0.9) translateY(0); }
            50% { transform: scale(0.9) translateY(-3px); }
          }
          
          /* Slashing Animation - Wide horizontal sweep */
          @keyframes slashSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
            20% { transform: translateX(20px) translateY(-5px) scale(1.05) rotate(-15deg); }
            40% { transform: translateX(50px) translateY(-3px) scale(1.1) rotate(25deg); }
            60% { transform: translateX(45px) translateY(0) scale(1.05) rotate(10deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
          }
          
          /* Chopping Animation - Overhead arc */
          @keyframes chopSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
            25% { transform: translateX(15px) translateY(-40px) scale(1.1) rotate(-30deg); }
            50% { transform: translateX(40px) translateY(-10px) scale(1.15) rotate(35deg); }
            75% { transform: translateX(35px) translateY(5px) scale(1.05) rotate(5deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
          }
          
          /* Stabbing Animation - Quick thrust forward */
          @keyframes stabSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0); }
            30% { transform: translateX(-10px) translateY(0) scale(0.95); }
            50% { transform: translateX(70px) translateY(0) scale(1.1); }
            70% { transform: translateX(60px) translateY(0) scale(1.05); }
            100% { transform: translateX(0) translateY(0) scale(1.0); }
          }
          
          /* Crushing Animation - Heavy downward smash */
          @keyframes crushSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
            20% { transform: translateX(10px) translateY(-50px) scale(1.1) rotate(-20deg); }
            40% { transform: translateX(30px) translateY(-60px) scale(1.2) rotate(-25deg); }
            60% { transform: translateX(50px) translateY(10px) scale(1.25) rotate(40deg); filter: brightness(1.2); }
            80% { transform: translateX(40px) translateY(5px) scale(1.1) rotate(10deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); filter: none; }
          }
          
          /* Shooting Animation - Draw and release */
          @keyframes shootSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0); }
            30% { transform: translateX(-20px) translateY(-5px) scale(1.05) rotate(-5deg); }
            50% { transform: translateX(-25px) translateY(-3px) scale(1.1) rotate(-8deg); }
            70% { transform: translateX(10px) translateY(0) scale(1.05) rotate(3deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
          }
          
          /* Dodging Animation - Quick sidestep */
          @keyframes dodgeSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0); }
            30% { transform: translateX(-40px) translateY(-10px) scale(0.9) rotate(-10deg); }
            60% { transform: translateX(-35px) translateY(-5px) scale(0.95) rotate(0deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0) rotate(0deg); }
          }
          
          /* Blocking Animation - Defensive stance */
          @keyframes blockSequence {
            0% { transform: translateX(0) scale(1.0); filter: brightness(1); }
            50% { transform: translateX(-10px) scale(0.9); filter: brightness(1.3); }
            100% { transform: translateX(-5px) scale(0.95); filter: brightness(1.2); }
          }
          
          /* Casting Animation - Magical spell casting */
          @keyframes castSequence {
            0% { transform: translateX(0) translateY(0) scale(1.0); filter: brightness(1); }
            20% { transform: translateX(-5px) translateY(-10px) scale(0.95); filter: brightness(1.2) hue-rotate(60deg); }
            40% { transform: translateX(-8px) translateY(-15px) scale(0.9); filter: brightness(1.5) hue-rotate(120deg); }
            60% { transform: translateX(-5px) translateY(-12px) scale(0.95); filter: brightness(1.8) hue-rotate(180deg); }
            80% { transform: translateX(10px) translateY(-5px) scale(1.05); filter: brightness(1.4) hue-rotate(240deg); }
            100% { transform: translateX(0) translateY(0) scale(1.0); filter: brightness(1); }
          }
          
          /* Shouting Animation - Intimidating yell */
          @keyframes shoutSequence {
            0% { transform: translateX(0) scale(1.0); }
            20% { transform: translateX(-10px) scale(1.15); }
            40% { transform: translateX(-5px) scale(1.2); }
            60% { transform: translateX(5px) scale(1.15); }
            80% { transform: translateX(0) scale(1.1); }
            100% { transform: translateX(0) scale(1.0); }
          }
          
          /* Enhanced Damage Splats with better effects */
          .damage-splat {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            font-size: 18px;
            animation: damageSplatAnimation 1.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
            pointer-events: none;
            z-index: 1000;
            font-family: 'Press Start 2P', monospace;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.9), 0 0 8px rgba(255,255,255,0.3);
            filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.8));
          }
          
          .damage-splat.damage {
            color: #ef4444;
            background: linear-gradient(45deg, rgba(239, 68, 68, 0.1), transparent);
            border-radius: 4px;
            padding: 2px 4px;
          }
          
          .damage-splat.crit {
            color: #fbbf24;
            font-size: 28px;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.9), 0 0 15px #fbbf24, 0 0 25px #f59e0b;
            animation: criticalDamageSplat 2s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            background: radial-gradient(circle, rgba(251, 191, 36, 0.2), transparent);
            border: 1px solid rgba(251, 191, 36, 0.4);
            border-radius: 6px;
            padding: 4px 8px;
          }
          
          .damage-splat.heal {
            color: #4ecdc4;
          }
          
          .damage-splat.miss {
            color: #95a5a6;
            font-style: italic;
          }
          
          .damage-splat.status {
            color: #e74c3c;
            font-size: 14px;
          }
          
          @keyframes damageSplatAnimation {
            0% { 
              opacity: 0;
              transform: translateX(-50%) translateY(0) scale(0.3) rotate(-5deg);
            }
            15% { 
              opacity: 1;
              transform: translateX(-50%) translateY(-8px) scale(1.3) rotate(2deg);
            }
            30% { 
              opacity: 0.95;
              transform: translateX(-50%) translateY(-15px) scale(1.1) rotate(0deg);
            }
            70% { 
              opacity: 0.7;
              transform: translateX(-50%) translateY(-45px) scale(0.9) rotate(-1deg);
            }
            100% { 
              opacity: 0;
              transform: translateX(-50%) translateY(-70px) scale(0.6) rotate(0deg);
            }
          }

          @keyframes criticalDamageSplat {
            0% { 
              opacity: 0;
              transform: translateX(-50%) translateY(0) scale(0.1) rotate(-10deg);
            }
            10% { 
              opacity: 1;
              transform: translateX(-50%) translateY(-5px) scale(1.5) rotate(5deg);
            }
            25% { 
              opacity: 1;
              transform: translateX(-50%) translateY(-12px) scale(1.3) rotate(-2deg);
            }
            40% { 
              opacity: 0.98;
              transform: translateX(-50%) translateY(-20px) scale(1.2) rotate(1deg);
            }
            65% { 
              opacity: 0.8;
              transform: translateX(-50%) translateY(-40px) scale(1.0) rotate(0deg);
            }
            85% { 
              opacity: 0.4;
              transform: translateX(-50%) translateY(-55px) scale(0.8) rotate(-1deg);
            }
            100% { 
              opacity: 0;
              transform: translateX(-50%) translateY(-80px) scale(0.5) rotate(0deg);
            }
          }
          
          /* Enhanced Screen Shake with intensity levels */
          .animate-screen-shake-light {
            animation: screenShakeLight 0.4s ease-out;
          }
          
          .animate-screen-shake-medium {
            animation: screenShakeMedium 0.5s ease-out;
          }
          
          .animate-screen-shake-heavy {
            animation: screenShakeHeavy 0.6s ease-out;
          }
          
          @keyframes screenShakeLight {
            0%, 100% { transform: translateX(0) translateY(0); }
            10% { transform: translateX(-1px) translateY(0.5px); }
            20% { transform: translateX(1px) translateY(-0.5px); }
            30% { transform: translateX(-0.5px) translateY(1px); }
            40% { transform: translateX(0.5px) translateY(-1px); }
            50% { transform: translateX(-1px) translateY(0.5px); }
            60% { transform: translateX(1px) translateY(-0.5px); }
            70% { transform: translateX(-0.5px) translateY(0.5px); }
            80% { transform: translateX(0.5px) translateY(-0.5px); }
            90% { transform: translateX(-0.5px) translateY(0.5px); }
          }
          
          @keyframes screenShakeMedium {
            0%, 100% { transform: translateX(0) translateY(0); }
            10% { transform: translateX(-2px) translateY(1px); }
            20% { transform: translateX(2px) translateY(-1px); }
            30% { transform: translateX(-1px) translateY(2px); }
            40% { transform: translateX(1px) translateY(-2px); }
            50% { transform: translateX(-2px) translateY(1px); }
            60% { transform: translateX(2px) translateY(-1px); }
            70% { transform: translateX(-1px) translateY(2px); }
            80% { transform: translateX(1px) translateY(-1px); }
            90% { transform: translateX(-1px) translateY(1px); }
          }
          
          @keyframes screenShakeHeavy {
            0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
            8% { transform: translateX(-4px) translateY(2px) rotate(-0.5deg); }
            16% { transform: translateX(4px) translateY(-2px) rotate(0.5deg); }
            24% { transform: translateX(-3px) translateY(3px) rotate(-0.3deg); }
            32% { transform: translateX(3px) translateY(-3px) rotate(0.3deg); }
            40% { transform: translateX(-4px) translateY(1px) rotate(-0.4deg); }
            48% { transform: translateX(4px) translateY(-1px) rotate(0.4deg); }
            56% { transform: translateX(-2px) translateY(3px) rotate(-0.2deg); }
            64% { transform: translateX(2px) translateY(-2px) rotate(0.2deg); }
            72% { transform: translateX(-3px) translateY(1px) rotate(-0.3deg); }
            80% { transform: translateX(2px) translateY(-1px) rotate(0.2deg); }
            88% { transform: translateX(-1px) translateY(1px) rotate(-0.1deg); }
            96% { transform: translateX(1px) translateY(-1px) rotate(0.1deg); }
          }

          /* Animations */
          .animate-popIn {
            animation: popIn 0.4s ease-out;
          }
          
          @keyframes popIn {
            0% { opacity: 0; transform: translateX(-50%) translateY(-50%) scale(0.9); }
            100% { opacity: 1; transform: translateX(-50%) translateY(-50%) scale(1); }
          }

          /* Gender Differentiation for Sprites */
          .sprite-male {
            filter: hue-rotate(0deg);
          }
          
          .sprite-female {
            filter: hue-rotate(15deg) brightness(1.1);
          }

          /* Scrollbar Styling */
          .scrollbar-thin::-webkit-scrollbar {
            width: 6px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-track {
            background: #1e293b;
            border-radius: 3px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: #4a90c2;
            border-radius: 3px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: #5ba0d2;
          }

          /* Status Effect Overlays */
          .sprite-with-effects {
            position: relative;
          }

          /* Status effect animations - glow handled by SVG filters in CombatSpritePixel */
          .sprite-with-effects.has-poison > svg,
          .sprite-with-effects.has-poison > div:has(svg) > svg {
            animation: poisonPulse 2s ease-in-out infinite;
          }

          .sprite-with-effects.has-burn > svg,
          .sprite-with-effects.has-burn > div:has(svg) > svg {
            animation: burnGlow 1s ease-in-out infinite;
          }

          .sprite-with-effects.has-bleeding > svg,
          .sprite-with-effects.has-bleeding > div:has(svg) > svg {
            animation: bleedPulse 1.5s ease-in-out infinite;
          }

          .sprite-with-effects.has-stunned > svg,
          .sprite-with-effects.has-stunned > div:has(svg) > svg {
            /* Stun effect handled by SVG filter */
          }

          /* Enhancement glow effects for powerful enemies ONLY - not player */
          .opponent-side .sprite-with-effects.enhanced-enraged {
            position: relative;
            overflow: visible;
            contain: layout;
          }

          .opponent-side .sprite-with-effects.enhanced-enraged > svg,
          .opponent-side .sprite-with-effects.enhanced-enraged > div:has(svg) > svg {
            animation: enragedPulse 1.5s ease-in-out infinite;
          }

          .opponent-side .sprite-with-effects.enhanced-strong {
            position: relative;
            overflow: visible;
            contain: layout;
          }

          .opponent-side .sprite-with-effects.enhanced-strong > svg,
          .opponent-side .sprite-with-effects.enhanced-strong > div:has(svg) > svg {
            animation: strongPulse 2s ease-in-out infinite;
          }

          .opponent-side .sprite-with-effects.enhanced-elite {
            position: relative;
            overflow: visible;
            contain: layout;
          }

          .opponent-side .sprite-with-effects.enhanced-elite > svg,
          .opponent-side .sprite-with-effects.enhanced-elite > div:has(svg) > svg {
            animation: elitePulse 1.8s ease-in-out infinite;
          }
          
          @keyframes enragedPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.02); }
          }

          @keyframes strongPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.95; transform: scale(1.01); }
          }

          @keyframes elitePulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.95; transform: scale(1.015); }
          }

          /* Damage number floating animation */
          .damage-float-up {
            animation: floatUp 1.5s ease-out forwards;
          }

          @keyframes floatUp {
            0% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            50% {
              transform: translateY(-30px) scale(1.2);
              opacity: 0.9;
            }
            100% {
              transform: translateY(-60px) scale(0.8);
              opacity: 0;
            }
          }

          /* Active turn indicator */
          .combatant-sprite-wrapper.active-turn {
            position: relative;
          }

          .combatant-sprite-wrapper.active-turn::before {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, transparent 70%);
            animation: turnPulse 1.5s ease-in-out infinite;
            pointer-events: none;
            z-index: -1;
          }

          @keyframes turnPulse {
            0%, 100% {
              transform: translateX(-50%) scale(1);
              opacity: 0.6;
            }
            50% {
              transform: translateX(-50%) scale(1.3);
              opacity: 0.3;
            }
          }

          /* Combo attack visual */
          .combo-attack-flash {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(ellipse at center, transparent 30%, rgba(255, 215, 0, 0.4) 100%);
            animation: comboFlash 0.3s ease-out;
            pointer-events: none;
          }

          @keyframes comboFlash {
            0% { opacity: 0; transform: scale(0.8); }
            50% { opacity: 1; transform: scale(1.1); }
            100% { opacity: 0; transform: scale(1.2); }
          }

          .status-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            mix-blend-mode: multiply;
            opacity: 0.7;
            animation: statusPulse 2s ease-in-out infinite;
          }

          .status-overlay.status-poison {
            background: radial-gradient(circle, transparent 30%, #4ade80 70%);
            mix-blend-mode: color;
            opacity: 0.8;
          }

          .status-overlay.status-burn,
          .status-overlay.status-on_fire {
            background: radial-gradient(circle, transparent 20%, #f97316 60%, #dc2626 100%);
            mix-blend-mode: screen;
            animation: burnFlicker 0.5s ease-in-out infinite;
            opacity: 0.9;
          }

          .status-overlay.status-bleeding {
            background: linear-gradient(180deg, transparent 60%, #dc2626 100%);
            opacity: 0.6;
          }

          .status-overlay.status-stunned {
            background: radial-gradient(circle, #fbbf24 0%, transparent 70%);
            animation: stunnedSpin 1s linear infinite;
            opacity: 0.8;
          }

          .status-overlay.status-defense_down {
            border: 3px dashed #ef4444;
            background: transparent;
            opacity: 0.8;
          }

          @keyframes statusPulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.9; }
          }

          @keyframes burnFlicker {
            0%, 100% { opacity: 0.7; filter: brightness(1); }
            50% { opacity: 1; filter: brightness(1.3); }
          }

          @keyframes poisonPulse {
            0%, 100% { filter: drop-shadow(0 0 4px #4ade80); }
            50% { filter: drop-shadow(0 0 12px #4ade80); }
          }

          @keyframes burnGlow {
            0%, 100% { filter: drop-shadow(0 0 6px #f97316); }
            50% { filter: drop-shadow(0 0 14px #f97316); }
          }

          @keyframes bleedPulse {
            0%, 100% { filter: drop-shadow(0 0 3px #dc2626); }
            50% { filter: drop-shadow(0 0 9px #dc2626); }
          }

          @keyframes stunnedSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Idle breathing animation */
          @keyframes idleBreathing {
            0%, 100% { 
              transform: scaleY(1) translateY(0); 
            }
            25% { 
              transform: scaleY(1.02) translateY(-1px); 
            }
            50% { 
              transform: scaleY(1.01) translateY(-2px); 
            }
            75% { 
              transform: scaleY(1.02) translateY(-1px); 
            }
          }

          .animate-sprite-idle-bob {
            animation: idleBreathing 3s ease-in-out infinite;
            transform-origin: bottom center;
          }

          /* Subtle animal idle - just breathing, no jumping */
          @keyframes animalIdle {
            0%, 100% { 
              transform: scaleY(1); 
            }
            50% { 
              transform: scaleY(1.01); 
            }
          }

          .animate-animal-idle {
            animation: animalIdle 4s ease-in-out infinite;
            transform-origin: bottom center;
          }

          /* Specific animal animations */
          @keyframes chickenBob {
            0%, 100% { transform: translateY(0); }
            25% { transform: translateY(-2px); }
            50% { transform: translateY(0); }
            75% { transform: translateY(-1px); }
          }

          .animate-chicken-bob {
            animation: chickenBob 1.5s ease-in-out infinite;
          }

          @keyframes peck {
            0% { transform: translateX(0) scale(1.8) rotate(0deg); }
            50% { transform: translateX(5px) scale(1.8) rotate(10deg); }
            100% { transform: translateX(0) scale(1.8) rotate(0deg); }
          }

          .animate-peck {
            animation: peck 0.4s ease-in-out;
            transform-origin: center;
          }

          @keyframes primateAttack {
            0% { transform: translateX(0) translateY(0) scale(1.8); }
            25% { transform: translateX(10px) translateY(-5px) scale(1.8) rotate(5deg); }
            50% { transform: translateX(15px) translateY(-3px) scale(1.8) rotate(-5deg); }
            100% { transform: translateX(0) translateY(0) scale(1.8) rotate(0deg); }
          }

          .animate-primate-attack {
            animation: primateAttack 0.6s ease-in-out;
            transform-origin: bottom center;
          }

          @keyframes pounce {
            0% { transform: translateX(0) translateY(0) scale(1.8); }
            30% { transform: translateX(20px) translateY(-10px) scale(1.98); }
            60% { transform: translateX(35px) translateY(-5px) scale(1.89); }
            100% { transform: translateX(0) translateY(0) scale(1.8); }
          }

          .animate-pounce {
            animation: pounce 0.7s ease-in-out;
            transform-origin: center;
          }

          /* Tamed Animals Formation */
          .tamed-animals-formation {
            position: relative;
            width: 120px;
            height: 100px;
          }

          /* Projectile System */
          .projectile-container {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 150;
          }

          .projectile {
            position: absolute;
            animation: projectileFly 0.4s linear;
          }

          .projectile-arrow {
            width: 20px;
            height: 2px;
            background: linear-gradient(90deg, #8b4513 0%, #d4a574 50%, #71717a 100%);
            box-shadow: 0 0 4px rgba(0,0,0,0.3);
          }

          .projectile-bolt {
            width: 16px;
            height: 3px;
            background: linear-gradient(90deg, #52525b 0%, #a1a1aa 50%, #e5e7eb 100%);
            box-shadow: 0 0 6px rgba(0,0,0,0.4);
          }

          .projectile-magic {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: radial-gradient(circle, #e879f9 0%, #a855f7 50%, #7c3aed 100%);
            box-shadow: 0 0 12px #a855f7, 0 0 24px #7c3aed;
          }

          .projectile-thrown {
            width: 10px;
            height: 10px;
            background: #71717a;
            border-radius: 2px;
            animation: projectileSpin 0.4s linear;
          }

          @keyframes projectileFly {
            0% { transform: translateX(0); opacity: 1; }
            100% { transform: translateX(400px); opacity: 0.8; }
          }

          @keyframes projectileFlyReverse {
            0% { transform: translateX(0) scaleX(-1); opacity: 1; }
            100% { transform: translateX(-400px) scaleX(-1); opacity: 0.8; }
          }

          @keyframes projectileSpin {
            0% { transform: translateX(0) rotate(0deg); }
            100% { transform: translateX(400px) rotate(720deg); }
          }

          /* Combat-ready animations defined elsewhere that should be included */
          .ff-pointer {
            position: absolute;
            width: 0;
            height: 0;
            border-left: 8px solid #fbbf24;
            border-top: 6px solid transparent;
            border-bottom: 6px solid transparent;
            animation: pointerBob 1s ease-in-out infinite;
            z-index: 20;
            filter: drop-shadow(1px 1px 2px rgba(0,0,0,0.8));
          }

          @keyframes pointerBob {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(3px); }
          }

          /* Fix for combat stage visibility */
          .combat-modal-wrapper.has-background .combat-stage-platform {
            background: linear-gradient(90deg, 
              rgba(96, 165, 250, 0.2) 0%, 
              rgba(96, 165, 250, 0.4) 25%, 
              rgba(96, 165, 250, 0.6) 50%, 
              rgba(96, 165, 250, 0.4) 75%, 
              rgba(96, 165, 250, 0.2) 100%
            );
          }
        `}</style>
    </div>
  );
};

export default CombatModal;
