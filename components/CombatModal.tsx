import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimalEntity, NpcEntity, PlayerCharacter, Item, CombatLogMessage, SkillID, StatusEffect, StatusEffectType, PlayerStats, EncounterableEntity, isAnimal, isNpc, MapData } from '../types';
import { SKILL_DATA, ANIMAL_DATA } from '../constants/index';
import { createItemInstance, addItemToInventory } from '../utils/inventoryUtils';
import { generateCombatTalkResponse, generateCombatItemResponse, generateCombatSkillResponse, generateCombatLowHealthResponse, generateCombatStartResponse } from '../services/llmService';
import { CombatSprite, AnimalCombatSprite } from './symbols';
import { ProceduralPortrait } from './portraits';
import { loadTamedAnimals, saveTamedAnimals, TamedAnimal } from '../services/animalTamingService';
import { getAnimalTexts } from '../constants/gameData/animalTexts';

interface CombatModalProps {
  combatant: EncounterableEntity;
  playerCharacter: PlayerCharacter;
  inventory: Item[];
  onClose: () => void;
  onVictory: (opponent: EncounterableEntity) => void;
  onUseCombatItem: (item: Item) => void;
  onCharacterUpdate: (updater: (prev: PlayerCharacter) => PlayerCharacter) => void;
  mapData: MapData;
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
    combatant, playerCharacter, inventory, onClose, onVictory, onUseCombatItem, onCharacterUpdate, mapData 
}) => {
  // Initialize opponent with proper health value
  const initializeOpponent = (comb: EncounterableEntity): EncounterableEntity => {
    const health = typeof comb.health === 'number' ? comb.health : 
                   (comb.health && typeof comb.health === 'object' && 'current' in comb.health) ? comb.health.current :
                   comb.maxHealth || 100;
    return { ...comb, health };
  };
  
  const [opponent, setOpponent] = useState<EncounterableEntity>(initializeOpponent(combatant));
  const [combatLog, setCombatLog] = useState<CombatLogMessage[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [round, setRound] = useState(1);
  
  // Tamed animals state
  const [tamedAnimals, setTamedAnimals] = useState<TamedAnimal[]>([]);
  const [tamedAnimalHealth, setTamedAnimalHealth] = useState<Record<string, number>>({});
  const [tamedAnimalAnimation, setTamedAnimalAnimation] = useState<Record<string, string>>({});
  
  const [activeMenu, setActiveMenu] = useState<'main' | 'skills' | 'items' | 'talk' | 'itemAction'>('main');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  
  const [playerAnimation, setPlayerAnimation] = useState<'idle' | 'attacking' | 'item' | 'damaged' | 'defending' | 'fleeing' | 'power_strike'>('idle');
  const [opponentAnimation, setOpponentAnimation] = useState<'idle' | 'attacking' | 'damaged' | 'special'>('idle');
  const [screenShake, setScreenShake] = useState<{active: boolean, intensity: 'light' | 'medium' | 'heavy'}>({active: false, intensity: 'light'});
  const [specialAttackAnnouncement, setSpecialAttackAnnouncement] = useState<{text: string, visible: boolean}>({text: '', visible: false});
  const [enemyEnhancement, setEnemyEnhancement] = useState<{type: 'strong' | 'enraged' | 'elite' | null, announced: boolean}>({type: null, announced: false});
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
  const [activeProjectiles, setActiveProjectiles] = useState<Array<{id: number, type: string, direction: 'left' | 'right'}>>([]);

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
      triggerScreenShake(result.damage, result.crit);
    }
  };

  // Enhanced menu commands with better organization
  const menuCommands = useMemo(() => ({
      main: ['Attack', 'Skills', 'Items', 'Defend', 'Talk', 'Flee'],
      skills: [...allPlayerSkills.map(id => getAttackDisplayName(id)), 'Back'],
      items: [...inventory.filter(item => item.category === 'Consumable' || item.sustenance).map(item => item.name), 'Back']
  }), [inventory, allPlayerSkills]);

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
           else onClose(); // Allow escape to close combat
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
  
  const fireProjectile = (type: 'arrow' | 'bolt' | 'magic' | 'thrown', direction: 'left' | 'right') => {
      const projectile = { id: Date.now() + Math.random(), type, direction };
      setActiveProjectiles(prev => [...prev, projectile]);
      setTimeout(() => {
          setActiveProjectiles(prev => prev.filter(p => p.id !== projectile.id));
      }, 400);
  };
  
  const calculateAttack = (attacker: PlayerCharacter | EncounterableEntity, defender: PlayerCharacter | EncounterableEntity, damageMultiplier: number = 1.0, isPowerAttack: boolean = false) => {
    const isObserved = defender.statusEffects.some(e => e.type === 'observed');
    const isDefDown = defender.statusEffects.some(e => e.type === 'defense_down');
    const defenseBonus = isDefending && defender === playerCharacter ? 2 : 0;

    // Much more realistic hit chances - combat is difficult!
    let baseHitChance = isPowerAttack ? 0.45 : 0.6; // Reduced from 0.7 and 0.9
    
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
    
    let baseDamage = isPowerAttack ? attacker.stats.attack * 1.5 : (2 + Math.floor(Math.random() * 4) + attacker.stats.attack);
    const effectiveDefense = Math.max(0, defender.stats.defense + defenseBonus - (isDefDown ? 5 : 0));
    const damage = Math.max(1, baseDamage * (1 + (Math.random() - 0.2)) - effectiveDefense);
    const finalDamage = Math.floor(damage * critMultiplier * damageMultiplier);

    return { hit: true, crit: isCrit, damage: finalDamage, text: finalDamage.toString() };
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
    
    const speciesName = currentAnimal.name?.toLowerCase() || currentAnimal.speciesName?.toLowerCase() || '';
    const specialAttack = useSpecialAttack ? (specialAttacks[speciesName] || specialAttacks[animalType]) : null;
    
    if (specialAttack) {
      // Special attack
      showSpecialAttackAnnouncement(specialAttack.name);
      addLog(`${currentAnimal.name} uses ${specialAttack.name}!`, 'player');
      setTamedAnimalAnimation(prev => ({ ...prev, [currentAnimal.id]: 'special' }));
    } else {
      // Regular attack
      addLog(`${currentAnimal.name} attacks!`, 'player');
      setTamedAnimalAnimation(prev => ({ ...prev, [currentAnimal.id]: 'attacking' }));
    }
    
    setTimeout(() => {
      // Calculate animal's attack
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
        addLog(`${currentAnimal.name} deals ${damage} damage!`, 'player');
      }
      
      setTimeout(() => {
        setTamedAnimalAnimation(prev => ({ ...prev, [currentAnimal.id]: 'idle' }));
        setOpponentAnimation('idle');
        
        if (getOpponentHealth(opponent) - damage <= 0) {
          const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
          addLog(victoryText || `${opponentName} is defeated!`, 'system');
          setTimeout(() => onVictory(opponent), 1000);
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
            setOpponentAnimation('damaged');
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
                onClose();
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
          setOpponentAnimation('damaged');
          addDamageSplat('FLED!', 'miss', 'opponent');
          
          setTimeout(() => {
            setCombatEnded(true);
            setVictoryState('fled');
            addLog(`The ${opponentName.toLowerCase()} has escaped.`, 'system');
            setTimeout(() => {
              onClose();
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
      const flavorText = getCombatFlavorText('attack', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
      
      if (targetAnimal) {
          addLog(`${opponentName} attacks ${targetAnimal.name}!`, 'opponent');
          
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
              addLog(`${opponentName} hits ${targetAnimal.name} for ${damage} damage!`, 'opponent');
              
              // Check if animal died
              if (tamedAnimalHealth[targetAnimal.id] - damage <= 0) {
                  addLog(`${targetAnimal.name} has been defeated!`, 'system');
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
              }
          
              setTimeout(() => {
                   setOpponentAnimation('idle');
                   setPlayerAnimation('idle');
                   if (playerCharacter.health - result.damage <= 0) {
                   addLog("You have been defeated!", 'system');
                   
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
                   
                   setTimeout(onClose, 1500);
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
        }
        
        setPlayerAnimation('attacking');
        addLog('You attack!', 'player');
        setTimeout(() => {
            const result = calculateAttack(playerCharacter, opponent, 1.0);
            if (result.hit) {
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
                addDamageSplat('Miss!', 'miss', 'opponent');
                addLog(`Your attack misses!`, 'player');
            }

            setTimeout(() => {
                setPlayerAnimation('idle');
                setOpponentAnimation('idle');
                if (getOpponentHealth(opponent) - result.damage <= 0) {
                     const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
                     addLog(victoryText || `${opponentName} is defeated!`, 'system');
                     setTimeout(() => onVictory(opponent), 1000);
                } else {
                    endPlayerTurn();
                }
            }, 500);
        }, 600);
      } else if (type === 'flee') {
          addLog("You attempt to flee!", 'player');
          setPlayerAnimation('fleeing');
          setTimeout(() => {
            const fleeChance = Math.min(0.8, 0.4 + (playerCharacter.stats.dexterity || 5) * 0.05);
            if(Math.random() < fleeChance) {
                addLog("Successfully fled!", 'system');
                
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
                
                setTimeout(onClose, 800);
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
    setPlayerAnimation(skillId === 'POWER_STRIKE' ? 'power_strike' : 'item');
    
    switch (skillId) {
      case 'POWER_STRIKE':
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
          }
          
          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            if ((opponent.health || 0) - result.damage <= 0) {
              const victoryText = getCombatFlavorText('victory', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
              addLog(victoryText || `${opponentName} is defeated!`, 'system');
              setTimeout(() => onVictory(opponent), 1000);
            } else {
              endPlayerTurn();
            }
          }, 500);
        }, 600);
        break;

      case 'CHOP':
        setTimeout(() => {
          const hasAxe = playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('axe');
          const baseDamage = 5 + (hasAxe ? 5 : 0);
          const damage = Math.max(1, baseDamage + playerCharacter.stats.strength - opponent.stats.defense);
          const applyBleed = hasAxe && Math.random() < 0.4; // 40% chance to cause bleeding with an axe

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
              setTimeout(() => onVictory(opponent), 1000);
            } else {
              endPlayerTurn();
            }
          }, 500);
        }, 600);
        break;

      case 'BURN':
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
              setTimeout(() => onVictory(opponent), 1000);
            } else {
              endPlayerTurn();
            }
          }, 500);
        }, 600);
        break;

      case 'THRUST':
        setTimeout(() => {
          const hasPointedWeapon = playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('sword') || 
                                  playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('spear') ||
                                  playerCharacter.equippedItems.main_hand?.name.toLowerCase().includes('dagger');
          const baseDamage = 8 + (hasPointedWeapon ? 4 : 0);
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
              setTimeout(() => onVictory(opponent), 1000);
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
            setOpponentAnimation('damaged');
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
                onClose(); // End combat without victory
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
    setPlayerAnimation('attack');
    
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
    setIsResolving(true);
    addLog(`You throw ${item.name} at ${opponent.name}.`, 'player');
    onUseCombatItem(item);
    
    setPlayerAnimation('attack');
    
    // Calculate throw damage based on item weight and player stats
    const throwDamage = Math.max(1, Math.floor((item.weight || 1) + playerCharacter.attack / 3));
    const finalDamage = Math.max(1, throwDamage - opponent.stats.defense);
    
    // Throwing has lower accuracy than melee attacks
    const hitChance = 0.65;
    const hits = Math.random() < hitChance;
    
    if (hits) {
      setOpponent(prev => {
        const currentHealth = typeof prev.health === 'number' ? prev.health : (prev.health?.current || 0);
        return { ...prev, health: Math.max(0, currentHealth - finalDamage) };
      });
      setOpponentAnimation('damaged');
      addDamageSplat(finalDamage.toString(), 'damage', 'opponent');
      addLog(`Your thrown ${item.name} hits for ${finalDamage} damage!`, 'player');
    } else {
      addLog(`Your thrown ${item.name} misses!`, 'player');
    }
    
    setTimeout(() => {
        setPlayerAnimation('idle');
        endPlayerTurn();
    }, 800);
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
          setTimeout(onClose, 1500);
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
        commandHandlers = [
            () => handleAction('attack'), () => setActiveMenu('skills'), () => setActiveMenu('items'),
            () => handleAction('defend'), () => handleAction('talk'), () => handleAction('flee')
        ];
        commandAvailability = [true, true, inventory.some(i => i.category === 'Consumable' || i.sustenance), true, true, true];
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
        const usableItems = inventory.filter(item => item.category === 'Consumable' || item.sustenance);
        commandHandlers = [...usableItems.map(item => () => handleItemSelection(item)), () => setActiveMenu('main')];
        commandAvailability = [...usableItems.map(() => true), true];
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
             return (
                <button 
                  key={`${activeMenu}-${cmd}-${index}`} 
                  onClick={isAvailable ? commandHandlers[index] : undefined} 
                  className={`combat-command-button ${!isAvailable ? 'unavailable' : ''} ${index === selectedCommandIndex && isAvailable ? 'ready-flash' : ''} ${activeMenu === 'skills' && index < allPlayerSkills.length && isProfessionSkill(allPlayerSkills[index]) ? 'profession-skill' : ''}`}
                  onMouseEnter={() => setSelectedCommandIndex(index)}
                  title={activeMenu === 'main' ? `Press ${index + 1} or use arrow keys` : 'Use arrow keys to navigate'}
                  disabled={!isAvailable}
                >
                    {cmd}
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

  // Determine current biome for background with smart fallbacks
  const getCurrentBiome = (): string => {
    const playerPos = { x: playerCharacter.x || 0, y: playerCharacter.y || 0 };
    const tile = mapData?.tiles?.[playerPos.y]?.[playerPos.x];
    
    console.log('[CombatModal] Debug biome detection:', {
      playerPos,
      tile: tile ? {
        x: tile.x,
        y: tile.y,
        biome: tile.biome,
        isLand: tile.isLand,
        altitude: tile.altitude
      } : 'no tile found',
      mapDataExists: !!mapData,
      tilesExists: !!mapData?.tiles,
      rowExists: !!mapData?.tiles?.[playerPos.y],
      tileBiome: tile?.biome
    });
    
    if (tile?.biome) {
      let biome = tile.biome.toLowerCase().replace(/\s+/g, '_');
      
      // Handle specific biome mappings that might not have exact file matches
      const biomeMapping: { [key: string]: string } = {
        'deep_ocean': 'riverbank',
        'shallow_ocean': 'riverbank', 
        'major_river': 'riverbank',
        'river': 'riverbank',
        'beach': 'grassland',
        'oasis': 'desert',
        'reef': 'riverbank',
        'volcanic_soil': 'hills',
        'volcanic_rock': 'hills',
        'active_lava': 'desert',
        'shoals_tile': 'riverbank',
        'salt_flats': 'desert',
        'hot_springs': 'riverbank',
        'ruins': 'grassland',
        'estuary': 'wetlands',
        'freshwater_lake': 'riverbank',
        'cliff': 'hills',
        'palace': 'urban',
        'holy_site': 'urban',
        'farmland': 'grassland',
        'marketplace': 'urban',
        'government_district': 'urban',
        'city_center': 'dense_city',
        'low_density_city': 'urban',
        'high_peak': 'mountain'
      };
      
      // Use mapping if exists, otherwise use the biome directly
      if (biomeMapping[biome]) {
        biome = biomeMapping[biome];
        console.log('[CombatModal] Mapped biome to:', biome);
      }
      
      console.log('[CombatModal] Using biome:', biome);
      return biome;
    }
    console.log('[CombatModal] Using fallback: grassland');
    return 'grassland'; // default fallback
  };

  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const currentBiome = useMemo(() => getCurrentBiome(), [mapData, playerCharacter.x, playerCharacter.y]);

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

  // Check for biome background image with fallbacks
  useEffect(() => {
    const checkBackgroundImage = async () => {
      const primaryPath = `/combat-backgrounds/${currentBiome}.png`;
      console.log('[CombatModal] Checking background image:', primaryPath);
      
      try {
        const response = await fetch(primaryPath, { method: 'HEAD' });
        if (response.ok) {
          console.log('[CombatModal] Background image found:', primaryPath);
          setBackgroundImage(primaryPath);
          return;
        }
      } catch (error) {
        console.log('[CombatModal] Error checking primary background:', primaryPath, error);
      }
      
      // Try fallback backgrounds if primary doesn't exist
      const fallbacks = ['grassland', 'hills', 'forest', 'desert'];
      console.log('[CombatModal] Primary background not found, trying fallbacks...');
      
      for (const fallback of fallbacks) {
        const fallbackPath = `/combat-backgrounds/${fallback}.png`;
        try {
          const response = await fetch(fallbackPath, { method: 'HEAD' });
          if (response.ok) {
            console.log('[CombatModal] Using fallback background:', fallbackPath);
            setBackgroundImage(fallbackPath);
            return;
          }
        } catch (error) {
          console.log('[CombatModal] Fallback failed:', fallbackPath, error);
        }
      }
      
      console.log('[CombatModal] No background image available');
      setBackgroundImage(null);
    };
    checkBackgroundImage();
  }, [currentBiome]);

  return (
    <div ref={wrapperRef} 
         className={`combat-modal-wrapper ${screenShake.active ? `animate-screen-shake-${screenShake.intensity}` : ''} ${backgroundImage ? 'has-background' : ''}`} 
         style={backgroundImage ? { 
           backgroundImage: `url(${backgroundImage})`,
           backgroundSize: 'cover',
           backgroundPosition: 'center'
         } : {}}
         onClick={handleDismissDialogue}>
        <div className="combat-screen-fx-wrapper">
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
                {activeProjectiles.map(projectile => (
                    <div
                        key={projectile.id}
                        className={`projectile projectile-${projectile.type} enhanced-projectile`}
                        style={{
                            left: projectile.direction === 'right' ? '30%' : '70%',
                            top: '50%',
                            animation: projectile.direction === 'right' 
                                ? 'projectileFly 0.4s linear' 
                                : 'projectileFlyReverse 0.4s linear',
                            width: '16px',
                            height: '16px',
                            boxShadow: '0 0 8px rgba(255, 215, 0, 0.6), 0 0 4px rgba(255, 255, 255, 0.3)'
                        }}
                    />
                ))}
            </div>
            
            {/* Combat Scene with elevated sprites */}
            <div className="combat-scene-elevated">
                <div className="combatant-sprite-wrapper player-side" style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
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
                            <CombatSprite character={playerCharacter} animation={playerAnimation as any} facing="right" />
                            {/* Character shadow */}
                            <div style={{
                              position: 'absolute',
                              bottom: '-8px',
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
                        {/* Status effect overlays for player */}
                        {playerCharacter.statusEffects.map(effect => (
                            <div key={effect.type} className={`status-overlay status-${effect.type}`} />
                        ))}
                    </div>
                    
                    {/* Tamed Animals with better positioning */}
                    <div className="tamed-animals-formation" style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '5px',
                        marginLeft: '20px'
                    }}>
                        {tamedAnimals.filter(animal => tamedAnimalHealth[animal.id] > 0).map((animal, index) => {
                            const row = Math.floor(index / 2);
                            const col = index % 2;
                            return (
                                <div key={animal.id} style={{ 
                                    position: 'absolute',
                                    left: `${col * 100}px`,
                                    bottom: `${row * 80}px`,
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
                         <div key={splat.id} className={`damage-splat ${splat.type}`}>{splat.text}</div>
                    ))}
                </div>
                
                <div className="combatant-sprite-wrapper opponent-side">
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
                        {getOpponentHealth(opponent) > 0 && (
                            <>
                                {isAnimal(opponent)
                                    ? <AnimalCombatSprite 
                                        animal={opponent} 
                                        animation={opponentAnimation as any}
                                        size={getAnimalSize(opponent)}
                                        facing="left"
                                      />
                                    : <CombatSprite character={opponent} animation={opponentAnimation as any} facing="left" />
                                }
                                {/* Character shadow */}
                                <div style={{
                                  position: 'absolute',
                                  bottom: '-8px',
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
                        {/* Status effect overlays for opponent */}
                        {opponent.statusEffects.map(effect => (
                            <div key={effect.type} className={`status-overlay status-${effect.type}`} />
                        ))}
                    </div>
                    <div className="opponent-damage-container">
                        {damageSplats.filter(s => s.target === 'opponent').map(splat => (
                             <div key={splat.id} className={`damage-splat ${splat.type}`}>{splat.text}</div>
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
                top: '20px',
                right: '20px',
                background: 'rgba(0, 0, 0, 0.9)',
                border: '2px solid #ffd700',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '10px',
                fontFamily: "'Press Start 2P', monospace",
                color: '#ffd700',
                minWidth: '140px',
                boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)'
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
                                <span>Next: {tamedAnimals.find(a => tamedAnimalHealth[a.id] > 0)?.name || 'Unknown'}</span>
                            </div>
                        )}
                    </div>
                    {tamedAnimals.map(animal => {
                        const animalData = ANIMAL_DATA[animal.baseId];
                        const currentHealth = tamedAnimalHealth[animal.id] || 0;
                        const maxHealth = animalData?.maxHealth || 10;
                        const healthPercent = (currentHealth / maxHealth) * 100;
                        
                        return (
                            <div key={animal.id} style={{ marginBottom: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                                    <span>{animal.name}</span>
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
            bottom: 28%;
            left: 10%;
            right: 10%;
            height: 280px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 60px;
          }

          .combatant-sprite-wrapper {
            position: relative;
            transition: all 0.3s ease;
            z-index: 100;
          }

          .player-side {
            margin-left: 40px;
            transform: scale(1.8);
            transform-origin: bottom center;
          }

          .opponent-side {
            margin-right: 40px;
            transform: scale(1.8);
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
            0% { transform: translateX(0) translateY(0) scale(1.8); }
            25% { transform: translateX(40px) translateY(-8px) scale(1.89); }
            50% { transform: translateX(60px) translateY(-5px) scale(1.98) rotate(15deg); }
            75% { transform: translateX(50px) translateY(-2px) scale(1.89) rotate(-5deg); }
            100% { transform: translateX(0) translateY(0) scale(1.8) rotate(0deg); }
          }
          
          /* Power Strike Animation */
          .animate-sprite-power-strike .combatant-sprite-wrapper {
            animation: powerStrikeSequence 1.2s ease-in-out;
          }
          
          @keyframes powerStrikeSequence {
            0% { transform: translateX(0) translateY(0) scale(1.8); }
            15% { transform: translateX(30px) translateY(-50px) scale(1.98); }
            30% { transform: translateX(50px) translateY(-80px) scale(2.16); }
            50% { transform: translateX(70px) translateY(-20px) scale(2.34) rotate(25deg); filter: drop-shadow(0 0 20px #fbbf24); }
            70% { transform: translateX(55px) translateY(5px) scale(1.98) rotate(-10deg); }
            100% { transform: translateX(0) translateY(0) scale(1.8) rotate(0deg); filter: none; }
          }
          
          /* Apply animations to sprite based on animation state */
          .combatant-sprite-wrapper.player-side {
            ${playerAnimation === 'attacking' ? 'animation: attackSequence 0.8s ease-in-out;' : ''}
            ${playerAnimation === 'power_strike' ? 'animation: powerStrikeSequence 1.2s ease-in-out;' : ''}
          }

          /* Opponent attack animation (reversed direction) */
          .combatant-sprite-wrapper.opponent-side {
            ${opponentAnimation === 'attacking' ? 'animation: opponentAttackSequence 0.8s ease-in-out;' : ''}
          }

          @keyframes opponentAttackSequence {
            0% { transform: translateX(0) translateY(0) scale(1.8); }
            25% { transform: translateX(-40px) translateY(-8px) scale(1.89); }
            50% { transform: translateX(-60px) translateY(-5px) scale(1.98) rotate(-15deg); }
            75% { transform: translateX(-50px) translateY(-2px) scale(1.89) rotate(5deg); }
            100% { transform: translateX(0) translateY(0) scale(1.8) rotate(0deg); }
          }
          
          /* Damage Animation */
          .animate-sprite-damaged .combatant-sprite-wrapper {
            animation: damageRecoil 0.6s ease-out;
          }
          
          @keyframes damageRecoil {
            0% { transform: translateX(0) scale(1.8); filter: brightness(1); }
            25% { transform: translateX(-15px) scale(1.62); filter: brightness(1.5) hue-rotate(0deg); }
            50% { transform: translateX(-25px) scale(1.53); filter: brightness(2) hue-rotate(45deg); }
            75% { transform: translateX(-10px) scale(1.71); filter: brightness(1.2) hue-rotate(0deg); }
            100% { transform: translateX(0) scale(1.8); filter: brightness(1); }
          }
          
          /* Defend Animation */
          .animate-sprite-defending .combatant-sprite-wrapper {
            animation: defendStance 0.5s ease-in-out forwards, defendBob 2s ease-in-out infinite 0.5s;
          }
          
          @keyframes defendStance {
            0% { transform: scale(1.8); filter: brightness(1); }
            100% { transform: scale(1.62); filter: brightness(1.2) drop-shadow(0 0 10px rgba(59, 130, 246, 0.6)); }
          }
          
          @keyframes defendBob {
            0%, 100% { transform: scale(1.62) translateY(0); }
            50% { transform: scale(1.62) translateY(-3px); }
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

          /* Status effect borders */
          .sprite-with-effects.has-poison {
            filter: drop-shadow(0 0 8px #4ade80);
            animation: poisonPulse 2s ease-in-out infinite;
          }

          .sprite-with-effects.has-burn {
            filter: drop-shadow(0 0 10px #f97316);
            animation: burnGlow 1s ease-in-out infinite;
          }

          .sprite-with-effects.has-bleeding {
            filter: drop-shadow(0 0 6px #dc2626);
            animation: bleedPulse 1.5s ease-in-out infinite;
          }

          .sprite-with-effects.has-stunned {
            filter: drop-shadow(0 0 8px #fbbf24);
          }

          /* Enhancement glow effects for powerful enemies */
          .sprite-with-effects.enhanced-enraged {
            filter: drop-shadow(0 0 12px #dc2626) drop-shadow(0 0 20px #dc2626);
            animation: enragedPulse 1.5s ease-in-out infinite;
          }
          
          .sprite-with-effects.enhanced-strong {
            filter: drop-shadow(0 0 10px #f59e0b) drop-shadow(0 0 18px #f59e0b);
            animation: strongPulse 2s ease-in-out infinite;
          }
          
          .sprite-with-effects.enhanced-elite {
            filter: drop-shadow(0 0 12px #a855f7) drop-shadow(0 0 20px #a855f7);
            animation: elitePulse 1.8s ease-in-out infinite;
          }
          
          @keyframes enragedPulse {
            0%, 100% { filter: drop-shadow(0 0 12px #dc2626) drop-shadow(0 0 20px #dc2626); opacity: 1; }
            50% { filter: drop-shadow(0 0 18px #dc2626) drop-shadow(0 0 30px #dc2626); opacity: 0.9; }
          }
          
          @keyframes strongPulse {
            0%, 100% { filter: drop-shadow(0 0 10px #f59e0b) drop-shadow(0 0 18px #f59e0b); opacity: 1; }
            50% { filter: drop-shadow(0 0 15px #f59e0b) drop-shadow(0 0 25px #f59e0b); opacity: 0.95; }
          }
          
          @keyframes elitePulse {
            0%, 100% { filter: drop-shadow(0 0 12px #a855f7) drop-shadow(0 0 20px #a855f7); opacity: 1; }
            50% { filter: drop-shadow(0 0 18px #a855f7) drop-shadow(0 0 28px #a855f7); opacity: 0.95; }
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
