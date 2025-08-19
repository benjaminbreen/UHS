import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AnimalEntity, NpcEntity, PlayerCharacter, Item, CombatLogMessage, SkillID, StatusEffect, StatusEffectType, PlayerStats, EncounterableEntity, isAnimal, isNpc, MapData } from '../types';
import { SKILL_DATA, ANIMAL_DATA } from '../constants/index';
import { createItemInstance, addItemToInventory } from '../utils/inventoryUtils';
import { generateCombatTalkResponse, generateCombatItemResponse } from '../services/llmService';
import { CombatSprite, AnimalCombatSprite } from './symbols';
import { ProceduralPortrait } from './portraits';

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
  const [opponent, setOpponent] = useState<EncounterableEntity>({ ...combatant });
  const [combatLog, setCombatLog] = useState<CombatLogMessage[]>([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isResolving, setIsResolving] = useState(false);
  const [round, setRound] = useState(1);
  
  const [activeMenu, setActiveMenu] = useState<'main' | 'skills' | 'items' | 'talk'>('main');
  const [selectedCommandIndex, setSelectedCommandIndex] = useState(0);
  
  const [playerAnimation, setPlayerAnimation] = useState<'idle' | 'attacking' | 'item' | 'damaged' | 'defending' | 'fleeing' | 'power_strike'>('idle');
  const [opponentAnimation, setOpponentAnimation] = useState<'idle' | 'attacking' | 'damaged'>('idle');
  const [screenShake, setScreenShake] = useState(false);
  const [damageSplats, setDamageSplats] = useState<DamageSplat[]>([]);

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

  const logRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const talkInputRef = useRef<HTMLInputElement>(null);
  
  const opponentName = 'speciesName' in opponent ? opponent.speciesName : opponent.name;
  const combatSkills: SkillID[] = ['POWER_STRIKE', 'FIRST_AID', 'INTIMIDATING_SHOUT', 'CHOP', 'BURN'];

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
    
    // Very large animals (much bigger than humans)
    if (['ELEPHANT', 'GIRAFFE', 'MOOSE', 'BISON'].includes(baseId)) return 320;
    
    // Large animals (bigger than humans)
    if (['CAMEL', 'LION', 'TIGER', 'BEAR', 'RHINOCEROS', 'HIPPOPOTAMUS', 'WILD_HORSE', 'COW'].includes(baseId)) return 280;
    
    // Medium-large animals (slightly bigger than humans)
    if (['DEER', 'ZEBRA', 'KANGAROO', 'GORILLA'].includes(baseId)) return 240;
    
    // Human-sized animals
    if (['WOLF', 'BOAR', 'LEOPARD', 'PANDA'].includes(baseId)) return 140;
    
    // Small-medium animals
    if (['GOAT', 'MONKEY'].includes(baseId)) return 120;
    
    // Small animals
    if (['FOX', 'SNAKE', 'EAGLE', 'OWL', 'CHICKEN', 'KOALA'].includes(baseId)) return 100;
    
    // Default
    return 140;
  };

  // Enhanced menu commands with better organization
  const menuCommands = useMemo(() => ({
      main: ['Attack', 'Skills', 'Items', 'Defend', 'Talk', 'Flee'],
      skills: [...combatSkills.map(id => SKILL_DATA[id].name), 'Back'],
      items: [...inventory.filter(item => item.category === 'Consumable' || item.sustenance).map(item => item.name), 'Back']
  }), [inventory]);

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
        setOpponent(o => ({ ...o, health: Math.max(0, (o.health || 0) - damageTaken), statusEffects: newStatusEffects }));
    }
  };

  useEffect(() => {
    if (activeMenu === 'talk' && talkInputRef.current) {
        talkInputRef.current.focus();
    }
  }, [activeMenu]);

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
  
  const calculateAttack = (attacker: PlayerCharacter | EncounterableEntity, defender: PlayerCharacter | EncounterableEntity, isPowerAttack: boolean = false) => {
    const isObserved = defender.statusEffects.some(e => e.type === 'observed');
    const isDefDown = defender.statusEffects.some(e => e.type === 'defense_down');
    const defenseBonus = isDefending && defender === playerCharacter ? 2 : 0;

    const hitChance = isPowerAttack ? 0.7 : 0.9;
    if (Math.random() > hitChance) return { hit: false, crit: false, damage: 0, text: "Miss!" };

    const isCrit = Math.random() < 0.05 + (attacker.stats.luck || 5) * 0.01 + (isObserved ? 0.25 : 0);
    const critMultiplier = isCrit ? 1.5 : 1.0;
    
    let baseDamage = isPowerAttack ? attacker.stats.attack * 1.5 : (2 + Math.floor(Math.random() * 4) + attacker.stats.attack);
    const effectiveDefense = Math.max(0, defender.stats.defense + defenseBonus - (isDefDown ? 5 : 0));
    const damage = Math.max(1, baseDamage * (1 + (Math.random() - 0.2)) - effectiveDefense);
    const finalDamage = Math.floor(damage * critMultiplier);

    return { hit: true, crit: isCrit, damage: finalDamage, text: finalDamage.toString() };
  };

  const endPlayerTurn = () => {
    setIsPlayerTurn(false);
    setIsDefending(false); // Reset defense
    setCombatStats(prev => ({ ...prev, turnCount: prev.turnCount + 1 }));
    setTimeout(() => {
        startOpponentTurn();
    }, 800);
  };
  
  const startOpponentTurn = () => {
      // Process status effects at start of opponent turn
      processStatusEffects(opponent, false);
      
      setOpponentAnimation('attacking');
      const flavorText = getCombatFlavorText('attack', isAnimal(opponent), isAnimal(opponent) ? opponent.baseId : undefined);
      addLog(flavorText || `${opponentName} attacks!`, 'opponent');

      setTimeout(() => {
          const result = calculateAttack(opponent, playerCharacter);
          
          if (result.hit) {
              setPlayerAnimation('damaged');
              addDamageSplat(result.text, result.crit ? 'crit' : 'damage', 'player');
              
              if (result.crit) {
                setCombatStats(prev => ({ ...prev, criticalHits: prev.criticalHits + 1 }));
                setScreenShake(true);
              }
              
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
               setScreenShake(false);
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
        setPlayerAnimation('attacking');
        addLog('You attack!', 'player');
        setTimeout(() => {
            const result = calculateAttack(playerCharacter, opponent);
            if (result.hit) {
                setOpponent(prev => ({...prev, health: Math.max(0, (prev.health || 0) - result.damage)}));
                setOpponentAnimation('damaged');
                addDamageSplat(result.text, result.crit ? 'crit' : 'damage', 'opponent');
                
                if (result.crit) {
                  setCombatStats(prev => ({ ...prev, criticalHits: prev.criticalHits + 1 }));
                  setScreenShake(true);
                }
                
                setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + result.damage }));
                addLog(`You ${result.crit ? 'critically ' : ''}hit for ${result.damage} damage.`, 'player');
            } else {
                addDamageSplat('Miss!', 'miss', 'opponent');
                addLog(`Your attack misses!`, 'player');
            }

            setTimeout(() => {
                setPlayerAnimation('idle');
                setOpponentAnimation('idle');
                setScreenShake(false);
                if ((opponent.health || 0) - result.damage <= 0) {
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
  
  const handleSkillUse = (skillId: SkillID) => {
    if (!isPlayerTurn || isResolving) return;
    setIsResolving(true);
    const skill = SKILL_DATA[skillId];
    if (!skill) return;

    addLog(`You use ${skill.name}!`, 'player');
    setPlayerAnimation(skillId === 'POWER_STRIKE' ? 'power_strike' : 'item');
    
    switch (skillId) {
      case 'POWER_STRIKE':
        setTimeout(() => {
          const result = calculateAttack(playerCharacter, opponent, true);
          if (result.hit) {
            setOpponent(prev => ({...prev, health: Math.max(0, (prev.health || 0) - result.damage)}));
            setOpponentAnimation('damaged');
            addDamageSplat(result.text, result.crit ? 'crit' : 'damage', 'opponent');
            if (result.crit) {
              setCombatStats(prev => ({ ...prev, criticalHits: prev.criticalHits + 1 }));
              setScreenShake(true);
            }
            setCombatStats(prev => ({ ...prev, playerDamageDealt: prev.playerDamageDealt + result.damage }));
            addLog(`Your power strike ${result.crit ? 'critically ' : ''}hits for ${result.damage} damage!`, 'player');
          } else {
            addDamageSplat('Miss!', 'miss', 'opponent');
            addLog(`Your power strike misses!`, 'player');
          }
          
          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            setScreenShake(false);
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

          setOpponent(prev => {
            const newHealth = Math.max(0, (prev.health || 0) - damage);
            let newStatusEffects = [...prev.statusEffects];
            if (applyBleed) {
              newStatusEffects.push({ type: 'bleeding', duration: 3, potency: 2 });
            }
            return { ...prev, health: newHealth, statusEffects: newStatusEffects };
          });

          setOpponentAnimation('damaged');
          addDamageSplat(damage.toString(), 'damage', 'opponent');
          addLog(`You chop for ${damage} damage.` + (applyBleed ? ' The wound is bleeding!' : ''), 'player');

          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            if ((opponent.health || 0) - damage <= 0) {
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
          const damage = 25 + playerCharacter.stats.intelligence * 2;
          const applyBurn = Math.random() < 0.7; // 70% chance to apply burn status

          setOpponent(prev => {
            const newHealth = Math.max(0, (prev.health || 0) - damage);
            let newStatusEffects = [...prev.statusEffects];
            if (applyBurn) {
              newStatusEffects.push({ type: 'burn', duration: 3, potency: 15 });
            }
            return { ...prev, health: newHealth, statusEffects: newStatusEffects };
          });

          setOpponentAnimation('damaged');
          addDamageSplat(damage.toString(), 'damage', 'opponent');
          addLog(`You scorch the opponent for ${damage} damage.` + (applyBurn ? ' It is now burning!' : ''), 'player');
          
          setTimeout(() => {
            setPlayerAnimation('idle');
            setOpponentAnimation('idle');
            if ((opponent.health || 0) - damage <= 0) {
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

      default:
        setTimeout(() => {
          setPlayerAnimation('idle');
          endPlayerTurn();
        }, 600);
        break;
    }
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
    } else if (activeMenu === 'skills') {
        commands = menuCommands.skills;
        commandHandlers = [...combatSkills.map(id => () => handleSkillUse(id)), () => setActiveMenu('main')];
    } else if (activeMenu === 'items') {
        commands = menuCommands.items;
        const usableItems = inventory.filter(item => item.category === 'Consumable' || item.sustenance);
        commandHandlers = [...usableItems.map(item => () => handleItemUse(item)), () => setActiveMenu('main')];
    }

    const itemsPerRow = 3;
    const pointerRow = Math.floor(selectedCommandIndex / itemsPerRow);
    const pointerCol = selectedCommandIndex % itemsPerRow;
    const pointerTop = `${1.2 + pointerRow * 2.5}rem`; 
    const pointerLeft = `${0.5 + pointerCol * (100 / itemsPerRow)}%`; 

    return (
      <div className="combat-command-grid">
          <div className="ff-pointer" style={{ top: pointerTop, left: pointerLeft }} />
          {commands.length > 0 ? commands.map((cmd, index) => (
             <button 
               key={`${activeMenu}-${cmd}-${index}`} 
               onClick={commandHandlers[index]} 
               className={`combat-command-button`}
               onMouseEnter={() => setSelectedCommandIndex(index)}
               title={activeMenu === 'main' ? `Press ${index + 1} or use arrow keys` : 'Use arrow keys to navigate'}
             >
                 {cmd}
             </button>
          )) : (
            <div className="col-span-3 text-center text-gray-400 text-sm p-4">No usable items.</div>
          )}
      </div>
    );
  };

  // Calculate health percentages safely
  const playerHealthPercent = (playerCharacter.health / playerCharacter.maxHealth) * 100;
  const opponentHealthPercent = ((opponent.health || 0) / (combatant.maxHealth || 1)) * 100;

  return (
    <div ref={wrapperRef} className={`combat-modal-wrapper ${screenShake ? 'animate-screen-shake' : ''}`}>
        <div className="combat-screen-fx-wrapper">
            {/* Combat Stage */}
            <div className="combat-stage-platform"></div>
            
            {/* LLM Dialogue */}
            {llmDialogue?.visible && (
                <div className="ff6-npc-dialogue animate-popIn">
                    {llmDialogue.text}
                </div>
            )}
            
            {/* Combat Scene with elevated sprites */}
            <div className="combat-scene-elevated">
                <div className="combatant-sprite-wrapper player-side">
                    {playerCharacter.health > 0 && (
                      <CombatSprite character={playerCharacter} animation={playerAnimation as any} facing="right" />
                    )}
                    {damageSplats.filter(s => s.target === 'player').map(splat => (
                         <div key={splat.id} className={`damage-splat ${splat.type}`}>{splat.text}</div>
                    ))}
                </div>
                
                <div className="combatant-sprite-wrapper opponent-side">
                     {(opponent.health || 0) > 0 && (
                        isAnimal(opponent)
                            ? <AnimalCombatSprite 
                                animal={opponent} 
                                animation={opponentAnimation as any}
                                size={getAnimalSize(opponent)}
                                facing="left"
                              />
                            : <CombatSprite character={opponent} animation={opponentAnimation as any} facing="left" />
                    )}
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
                        <div className="stat-line">HP: {playerCharacter.health}/{playerCharacter.maxHealth}</div>
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
             
            {/* Enhanced Opponent Info Panel with External Portrait */}
            <div className="opponent-info-container">
                <div className={`info-panel opponent-panel ${!isPlayerTurn ? 'active-turn' : ''}`}>
                    <h4 className="character-name opponent-name">{opponentName}</h4>
                    <div className="character-stats">
                        {!isAnimal(opponent) && <div className="stat-line">Lvl: {opponent.stats.level}</div>}
                        {isAnimal(opponent) && <div className="stat-line animal-type">{ANIMAL_DATA[opponent.baseId]?.type || 'Unknown'} • {opponent.stats.level}</div>}
                        <div className="stat-line">HP: {opponent.health || 0}/{combatant.maxHealth || 1}</div>
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
                    {isNpc(opponent) && (
                        <ProceduralPortrait
                            character={opponent}
                            size={120}
                        />
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
            bottom: 32%;
            left: 25%;
            right: 25%;
            height: 200px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }

          .combatant-sprite-wrapper {
            position: relative;
            transition: all 0.3s ease;
            z-index: 100;
          }

          .player-side {
            margin-left: 10%;
          }

          .opponent-side {
            margin-right: 10%;
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
            width: 600px;
            height: 120px;
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
            font-size: 10px;
            margin-bottom: 3px;
            line-height: 1.4;
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
            0% { transform: translateX(0) translateY(0) scale(1); }
            25% { transform: translateX(40px) translateY(-8px) scale(1.05); }
            50% { transform: translateX(60px) translateY(-5px) scale(1.1) rotate(15deg); }
            75% { transform: translateX(50px) translateY(-2px) scale(1.05) rotate(-5deg); }
            100% { transform: translateX(0) translateY(0) scale(1) rotate(0deg); }
          }
          
          /* Power Strike Animation */
          .animate-sprite-power-strike .combatant-sprite-wrapper {
            animation: powerStrikeSequence 1.2s ease-in-out;
          }
          
          @keyframes powerStrikeSequence {
            0% { transform: translateX(0) translateY(0) scale(1); }
            15% { transform: translateX(30px) translateY(-50px) scale(1.1); }
            30% { transform: translateX(50px) translateY(-80px) scale(1.2); }
            50% { transform: translateX(70px) translateY(-20px) scale(1.3) rotate(25deg); filter: drop-shadow(0 0 20px #fbbf24); }
            70% { transform: translateX(55px) translateY(5px) scale(1.1) rotate(-10deg); }
            100% { transform: translateX(0) translateY(0) scale(1) rotate(0deg); filter: none; }
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
            0% { transform: translateX(0) translateY(0) scale(1); }
            25% { transform: translateX(-40px) translateY(-8px) scale(1.05); }
            50% { transform: translateX(-60px) translateY(-5px) scale(1.1) rotate(-15deg); }
            75% { transform: translateX(-50px) translateY(-2px) scale(1.05) rotate(5deg); }
            100% { transform: translateX(0) translateY(0) scale(1) rotate(0deg); }
          }
          
          /* Damage Animation */
          .animate-sprite-damaged .combatant-sprite-wrapper {
            animation: damageRecoil 0.6s ease-out;
          }
          
          @keyframes damageRecoil {
            0% { transform: translateX(0) scale(1); filter: brightness(1); }
            25% { transform: translateX(-15px) scale(0.9); filter: brightness(1.5) hue-rotate(0deg); }
            50% { transform: translateX(-25px) scale(0.85); filter: brightness(2) hue-rotate(45deg); }
            75% { transform: translateX(-10px) scale(0.95); filter: brightness(1.2) hue-rotate(0deg); }
            100% { transform: translateX(0) scale(1); filter: brightness(1); }
          }
          
          /* Defend Animation */
          .animate-sprite-defending .combatant-sprite-wrapper {
            animation: defendStance 0.5s ease-in-out forwards, defendBob 2s ease-in-out infinite 0.5s;
          }
          
          @keyframes defendStance {
            0% { transform: scale(1); filter: brightness(1); }
            100% { transform: scale(0.9); filter: brightness(1.2) drop-shadow(0 0 10px rgba(59, 130, 246, 0.6)); }
          }
          
          @keyframes defendBob {
            0%, 100% { transform: scale(0.9) translateY(0); }
            50% { transform: scale(0.9) translateY(-3px); }
          }
          
          /* Enhanced Damage Splats */
          .damage-splat {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-weight: bold;
            font-size: 18px;
            animation: damageSplatAnimation 1.6s ease-out forwards;
            pointer-events: none;
            z-index: 1000;
            font-family: 'Press Start 2P', monospace;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
          }
          
          .damage-splat.damage {
            color: #ff6b6b;
          }
          
          .damage-splat.crit {
            color: #ffd93d;
            font-size: 24px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.8), 0 0 10px #ffd93d;
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
              transform: translateX(-50%) translateY(0) scale(0.5);
            }
            20% { 
              opacity: 1;
              transform: translateX(-50%) translateY(-20px) scale(1.2);
            }
            40% { 
              transform: translateX(-50%) translateY(-35px) scale(1);
            }
            100% { 
              opacity: 0;
              transform: translateX(-50%) translateY(-60px) scale(0.8);
            }
          }
          
          /* Screen Shake */
          .animate-screen-shake {
            animation: screenShake 0.5s ease-in-out;
          }
          
          @keyframes screenShake {
            0%, 100% { transform: translateX(0); }
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
        `}</style>
    </div>
  );
};

export default CombatModal;
