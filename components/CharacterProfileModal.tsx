/**
 * components/CharacterProfileModal.tsx - A sophisticated, multi-tab modal for the player character profile.
 * Enhanced with intuitive equipment system, comprehensive inventory management, and beautiful UI.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { PlayerCharacter, EquipmentSlot, Item, Rarity, Appearance, NpcEntity } from '../types';
import { useUI } from '../contexts/UIContext';
import { ProceduralPortrait } from './portraits';
import { parseDateString } from '../utils/dateUtils';
import { mapLocationToCulture } from '../utils/mapUtils';
import BeliefsPanel from './BeliefsPanel';
import { hexToColorName, formatAppearanceText } from '../utils/colorUtils';
import EquipmentPanel from './EquipmentPanel';
import { generateProceduralItemDescription, isGenericDescription } from '../services/itemDescriptionGenerator';
import GenerativeItemIcon from './symbols/GenerativeItemIcon';
import DiseaseModal from './DiseaseModal';
import { ActiveDisease } from '../types/diseaseTypes';
import { generateNpcName } from '../generation/common/npcUtils';
import { CHARACTER_NAMES } from '../constants/characterData/names';
import { DISEASE_DATABASE } from '../constants/gameData/diseases';
import { ValueNoise } from '../utils/noise';


interface CharacterProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    character: PlayerCharacter;
    onCharacterUpdate: React.Dispatch<React.SetStateAction<PlayerCharacter | null>>;
    onRegenerate: () => void;
    isEnhancing?: boolean;
    onEquipItem: (item: Item) => void;
    onUnequipItem: (slot: EquipmentSlot) => void;
    onDropItem: (item: Item) => void;
    onConsumeItem: (item: Item) => void;
    date: string;
    location: string;
}

// Utility functions
const cmToFeetAndInches = (cm: number): string => {
    if (!cm) return `N/A`;
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}"`;
};

const kgToLbs = (kg: number): string => {
    if (!kg) return 'N/A';
    return `${Math.round(kg * 2.20462)} lbs`;
};

const formatItemName = (name: string): string => {
    if (!name) return '';
    return name.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}


// Enhanced StatBar Component
const StatBar: React.FC<{ label: string; value: number; icon: string; color: string; max?: number }> = ({ 
    label, value, icon, color, max = 20 
}) => {
    const [finalWidth, setFinalWidth] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            const percentage = Math.max(0, Math.min(100, (value / max) * 100));
            setFinalWidth(percentage);
        }, 100);
        return () => clearTimeout(timer);
    }, [value, max]);

    return (
        <div className="flex items-center gap-4 group">
            <span className="flex items-center text-slate-300 w-40 text-sm font-medium transition-colors group-hover:text-white">
                <span className="w-8 text-lg text-center">{icon}</span>
                {label}
            </span>
            <div className="flex-1 flex items-center gap-3">
                <div className="w-full h-5 bg-slate-800/50 rounded-md overflow-hidden border border-slate-700/50 relative">
                    <div
                        className="h-full rounded-md transition-all duration-1000 ease-out relative overflow-hidden"
                        style={{
                            width: `${finalWidth}%`,
                            backgroundColor: color,
                            boxShadow: `0 0 10px ${color}40`,
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </div>
                </div>
                <span className="font-bold text-white w-8 text-right pr-1 font-mono">{value}</span>
            </div>
        </div>
    );
};

// Enhanced RarityTag Component
const RarityTag: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
    const rarityStyles: Record<Rarity, string> = {
        'Junk': 'bg-gray-500 text-gray-200 border-gray-400',
        'Common': 'bg-slate-600 text-slate-200 border-slate-400',
        'Uncommon': 'bg-green-600 text-green-100 border-green-400 shadow-glow-primary',
        'Rare': 'bg-blue-600 text-blue-100 border-blue-400 shadow-glow-blue',
        'Ultra-rare': 'bg-purple-600 text-purple-100 border-purple-400 shadow-glow-purple',
        'Unique': 'bg-amber-500 text-amber-100 border-amber-400 shadow-glow-amber',
    };
    
    return (
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border font-press-start ${rarityStyles[rarity] || 'bg-gray-500'}`}>
            {rarity.toUpperCase()}
        </span>
    );
};

// Enhanced DetailRow Component
const DetailRow: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-1">
        <span className="text-slate-400">{label}:</span> 
        <span className="font-semibold text-white capitalize text-right">{value}</span>
    </div>
);

// Enhanced TraitDisplay Component
const TraitDisplay: React.FC<{ label: string, value: number }> = ({ label, value }) => {
    const [animatedValue, setAnimatedValue] = useState(0);
    const percentage = value * 100;
    const intensity = value > 0.8 ? 'Very High' : value > 0.6 ? 'High' : value > 0.4 ? 'Moderate' : value > 0.2 ? 'Low' : 'Very Low';
    const colorClass = value > 0.7 ? 'bg-emerald-500' : value > 0.4 ? 'bg-blue-500' : 'bg-slate-500';
    const shadowColor = value > 0.7 ? '#10b981' : value > 0.4 ? '#3b82f6' : '#64748b';

    useEffect(() => {
        const timer = setTimeout(() => setAnimatedValue(percentage), 200);
        return () => clearTimeout(timer);
    }, [percentage]);

    return (
        <div className="text-sm mb-3">
            <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 font-medium">{label}</span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{intensity}</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 relative">
                <div 
                    className={`h-full ${colorClass} transition-all duration-1000 ease-out relative overflow-hidden`} 
                    style={{ 
                        width: `${animatedValue}%`,
                        boxShadow: `0 0 8px ${shadowColor}40`
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string; isActive: boolean; onClick: () => void }> = ({ 
    label, isActive, onClick 
}) => (
    <button 
        onClick={onClick}
        className={`flex-shrink-0 py-3 md:py-3.5 px-4 md:px-5 text-xs md:text-sm font-bold border-b-2 transition-all duration-300 whitespace-nowrap uppercase tracking-wider ${
            isActive 
                ? 'text-white border-blue-400 bg-gradient-to-t from-blue-900/40 to-slate-700/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                : 'text-slate-400 border-transparent hover:bg-slate-800/40 hover:text-white hover:border-slate-500 hover:shadow-[0_0_10px_rgba(148,163,184,0.2)]'
        }`}
    >
        {label}
    </button>
);

// Helper functions for static content generation
const generateExpandedLifeEvents = (char: PlayerCharacter, currentDate: string) => {
    const { lifeEvents = [], family = [] } = char;
    const expandedEvents = [...lifeEvents];
    
    // Add romantic/relationship events
    const birthYear = parseInt(char.birthYear || '0');
    const currentYear = parseInt(currentDate);
    const age = char.age;
    
    // Generate potential romantic events based on age
    if (age > 15) {
        const romanticEventChance = Math.random();
        if (romanticEventChance > 0.7) {
            expandedEvents.push({
                year: birthYear + 16 + Math.floor(Math.random() * 4),
                event: "First romantic attachment to a childhood friend"
            });
        }
        if (romanticEventChance > 0.5 && age > 18) {
            expandedEvents.push({
                year: birthYear + 18 + Math.floor(Math.random() * 3),
                event: "Fell deeply in love with " + (Math.random() > 0.5 ? "a merchant's daughter" : "a local artisan")
            });
        }
    }
    
    // Add marriage/engagement events for married characters
    const spouse = family.find(f => f.relation === 'spouse');
    if (spouse && age > 20) {
        const marriageAge = 20 + Math.floor(Math.random() * 10);
        expandedEvents.push({
            year: birthYear + marriageAge,
            event: `Married ${spouse.name} in a ${Math.random() > 0.5 ? 'grand ceremony' : 'modest gathering'}`
        });
    } else if (!spouse && age > 25 && Math.random() > 0.6) {
        // Add broken engagement or lost love
        const lostLoveAge = 22 + Math.floor(Math.random() * 5);
        const lostLoveEvents = [
            "Engagement broken off due to family disputes",
            "Betrothed died of fever before the wedding",
            "Love interest entered religious life",
            "Courtship ended when lover left for distant lands",
            "Marriage plans cancelled due to war"
        ];
        expandedEvents.push({
            year: birthYear + lostLoveAge,
            event: lostLoveEvents[Math.floor(Math.random() * lostLoveEvents.length)]
        });
    }
    
    // Add childhood events
    if (age > 10) {
        if (Math.random() > 0.6) {
            expandedEvents.push({
                year: birthYear + 7 + Math.floor(Math.random() * 3),
                event: "Survived a severe childhood illness"
            });
        }
        if (Math.random() > 0.7) {
            expandedEvents.push({
                year: birthYear + 12,
                event: "Began apprenticeship in " + char.profession.toLowerCase()
            });
        }
    }
    
    // Sort events by year
    return expandedEvents.sort((a, b) => a.year - b.year);
};

const generateHealthHistory = (char: PlayerCharacter) => {
    const healthHistory = [];
    if (char.diseaseHealth?.pastDiseases) {
        char.diseaseHealth.pastDiseases.forEach(disease => {
            const ageAtDisease = Math.max(5, Math.floor(Math.random() * char.age));
            const yearOfDisease = parseInt(char.birthYear || '0') + ageAtDisease;
            healthHistory.push({
                year: yearOfDisease,
                age: ageAtDisease,
                disease: disease.name,
                outcome: Math.random() > 0.3 ? "Recovered fully" : "Left with lingering weakness"
            });
        });
    }
    
    // Add some procedural health events  
    if (char.age > 20 && Math.random() > 0.6) {
        const injuryAge = 15 + Math.floor(Math.random() * (char.age - 15));
        healthHistory.push({
            year: parseInt(char.birthYear || '0') + injuryAge,
            age: injuryAge,
            disease: "Broken bone from accident",
            outcome: "Healed but occasionally aches in cold weather"
        });
    }
    return healthHistory;
};

const generateHouseholdMembers = (char: PlayerCharacter, existingFamily: any[] = []) => {
    const household = [];
    const age = char.age;
    
    // Store generated family members to update character.family later
    const generatedFamily = [];
    
    // Create a noise instance for consistent randomness
    const noise = new ValueNoise(Math.random() * 10000);
    
    // Get current year from character context
    const currentYear = char.year || 1500;
    
    // Determine the cultural zone and region for name generation
    const culturalZone = char.culturalZone || 'EUROPEAN';
    const region = char.region || undefined;
    
    // Generate culturally appropriate names
    const generateName = (isMale: boolean) => {
        try {
            // Use the proper name generation function from npcUtils
            const gender = isMale ? 'male' : 'female';
            const name = generateNpcName(gender, culturalZone, region, currentYear, noise);
            return name;
        } catch (error) {
            // Fallback to character's cultural names if available
            const nameList = CHARACTER_NAMES[culturalZone] || CHARACTER_NAMES['EUROPEAN'];
            const names = isMale ? nameList.male : nameList.female;
            if (names && names.length > 0) {
                return names[Math.floor(Math.random() * names.length)];
            }
            // Last resort fallback
            return isMale ? 'John' : 'Mary';
        }
    };
    
    const generateOccupation = (age: number, isElite: boolean = false) => {
        if (age < 14) return 'Child';
        if (age < 18) return 'Apprentice';
        
        const commonJobs = ['Farmer', 'Blacksmith', 'Carpenter', 'Weaver', 'Baker', 'Merchant', 'Trader', 'Soldier', 'Clerk', 'Tailor'];
        const eliteJobs = ['Merchant', 'Scholar', 'Physician', 'Scribe', 'Officer', 'Magistrate', 'Tutor'];
        
        const jobs = isElite ? eliteJobs : commonJobs;
        return jobs[Math.floor(Math.random() * jobs.length)];
    };
    
    // Generate health status with 25% disease chance
    const generateHealthStatus = (memberAge: number) => {
        const hasDiseaseChance = 0.25; // 25% chance of disease
        
        if (Math.random() < hasDiseaseChance && DISEASE_DATABASE?.diseases) {
            // Get available diseases for the era and region
            const era = currentYear < 500 ? 'ANCIENT' :
                       currentYear < 1000 ? 'MEDIEVAL' :
                       currentYear < 1500 ? 'EARLY_MODERN' :
                       currentYear < 1800 ? 'INDUSTRIAL' : 'MODERN';
            
            const availableDiseases = DISEASE_DATABASE.diseases.filter(d => {
                // Check if disease is available in this era
                if (!d.availableEras?.includes(era)) return false;
                
                // Check if disease is available in this region
                if (d.availableRegions && !d.availableRegions.includes(culturalZone)) return false;
                
                // Age-specific filtering (e.g., childhood diseases)
                if (memberAge < 10 && d.type === 'childhood') return true;
                if (memberAge >= 10 && d.type === 'childhood') return false;
                
                return true;
            });
            
            if (availableDiseases.length > 0) {
                const disease = availableDiseases[Math.floor(Math.random() * availableDiseases.length)];
                // Return disease name in a format that can be displayed in red
                return { status: 'sick', disease: disease.name };
            }
        }
        
        // Non-disease health states based on age
        if (memberAge < 14) {
            return { status: 'Good health', disease: null };
        } else if (memberAge > 60) {
            const states = [
                { status: 'Frail', disease: null },
                { status: 'Declining health', disease: null },
                { status: 'Poor health', disease: null },
                { status: 'Fair health', disease: null }
            ];
            return states[Math.floor(Math.random() * states.length)];
        } else if (memberAge > 40) {
            const states = [
                { status: 'Good health', disease: null },
                { status: 'Fair health', disease: null },
                { status: 'Good health', disease: null } // Higher chance of good health
            ];
            return states[Math.floor(Math.random() * states.length)];
        } else {
            return { status: 'Good health', disease: null };
        }
    };
    
    const isElite = char.class === 'Noble' || char.class === 'Merchant' || char.class === 'Scholar';
    
    // ALWAYS generate household members, even if family array is empty
    
    // Living with parents (if young)
    if (age < 30) {
        // 80% chance to have at least one parent for younger characters
        if (Math.random() > 0.2) {
            // Generate father if doesn't exist
            const father = existingFamily.find(f => f.relation === 'father');
            const fatherAlive = age < 20 ? Math.random() > 0.1 : // 90% alive if PC is young
                               age < 25 ? Math.random() > 0.2 : // 80% alive
                               Math.random() > 0.4; // 60% alive
            
            if (fatherAlive) {
                const fatherAge = age + 20 + Math.floor(Math.random() * 15);
                const healthInfo = generateHealthStatus(fatherAge);
                const fatherName = father?.name || generateName(true);
                const fatherProfession = father?.profession || generateOccupation(fatherAge, isElite);
                household.push({
                    name: fatherName,
                    relation: 'Father',
                    age: fatherAge,
                    occupation: fatherProfession,
                    health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                    hasDisease: !!healthInfo.disease
                });
                // Add to family array if not already there
                if (!father) {
                    generatedFamily.push({
                        name: fatherName,
                        relation: 'father',
                        profession: fatherProfession,
                        age: fatherAge
                    });
                }
            }
            
            // Generate mother if doesn't exist
            const mother = existingFamily.find(f => f.relation === 'mother');
            const motherAlive = age < 20 ? Math.random() > 0.15 : // 85% alive if PC is young
                               age < 25 ? Math.random() > 0.25 : // 75% alive
                               Math.random() > 0.45; // 55% alive
            
            if (motherAlive) {
                const motherAge = age + 18 + Math.floor(Math.random() * 12);
                const healthInfo = generateHealthStatus(motherAge);
                const motherName = mother?.name || generateName(false);
                const motherProfession = mother?.profession || 'Homemaker';
                household.push({
                    name: motherName,
                    relation: 'Mother',
                    age: motherAge,
                    occupation: motherProfession,
                    health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                    hasDisease: !!healthInfo.disease
                });
                // Add to family array if not already there
                if (!mother) {
                    generatedFamily.push({
                        name: motherName,
                        relation: 'mother',
                        profession: motherProfession,
                        age: motherAge
                    });
                }
            }
        }
        
        // Always add siblings for younger characters
        const numSiblings = 1 + Math.floor(Math.random() * 4); // 1-4 siblings
        for (let i = 0; i < numSiblings; i++) {
            const isBrother = Math.random() > 0.5;
            const siblingAge = Math.max(8, Math.min(45, age + Math.floor(Math.random() * 20) - 10));
            const isOlder = siblingAge > age;
            const healthInfo = generateHealthStatus(siblingAge);
            household.push({
                name: generateName(isBrother),
                relation: isOlder ? `Older ${isBrother ? 'brother' : 'sister'}` : `Younger ${isBrother ? 'brother' : 'sister'}`,
                age: siblingAge,
                occupation: generateOccupation(siblingAge, isElite),
                health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                hasDisease: !!healthInfo.disease
            });
        }
    }
    
    // For older characters or those with spouse
    if (age >= 25) {
        const spouse = existingFamily.find(f => f.relation === 'spouse');
        const hasSpouse = spouse || (age >= 25 && Math.random() > 0.3); // 70% chance of spouse if over 25
        
        if (hasSpouse) {
            const spouseAge = spouse?.age || (age - 2 + Math.floor(Math.random() * 5));
            const healthInfo = generateHealthStatus(spouseAge);
            const spouseName = spouse?.name || generateName(char.gender === 'male' ? false : true);
            const spouseProfession = spouse?.profession || generateOccupation(spouseAge, isElite);
            household.push({
                name: spouseName,
                relation: 'Spouse',
                age: spouseAge,
                occupation: spouseProfession,
                health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                hasDisease: !!healthInfo.disease
            });
            // Add to family array if not already there
            if (!spouse) {
                generatedFamily.push({
                    name: spouseName,
                    relation: 'spouse',
                    profession: spouseProfession,
                    age: spouseAge
                });
            }
            
            // Children based on age
            const maxChildren = age < 30 ? 2 : age < 40 ? 4 : 6;
            const numChildren = Math.floor(Math.random() * (maxChildren + 1));
            
            // Get existing children from character.family
            const existingChildren = existingFamily.filter(f => f.relation === 'son' || f.relation === 'daughter');
            
            // Use existing children if available, otherwise generate new ones
            if (existingChildren.length > 0) {
                // Use existing children from character.family
                existingChildren.forEach(child => {
                    const healthInfo = generateHealthStatus(child.age);
                    household.push({
                        name: child.name,
                        relation: child.relation === 'son' ? 'Son' : 'Daughter',
                        age: child.age,
                        occupation: child.age > 14 ? generateOccupation(child.age, isElite) : 'Child',
                        health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                        hasDisease: !!healthInfo.disease
                    });
                });
            } else {
                // Generate new children if none exist
                for (let i = 0; i < numChildren; i++) {
                    const childAge = Math.max(1, Math.min(age - 16, Math.floor(Math.random() * (age - 16))));
                    const isSon = Math.random() > 0.5;
                    const healthInfo = generateHealthStatus(childAge);
                    const childName = generateName(isSon);
                    household.push({
                        name: childName,
                        relation: isSon ? 'Son' : 'Daughter',
                        age: childAge,
                        occupation: childAge > 14 ? generateOccupation(childAge, isElite) : 'Child',
                        health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                        hasDisease: !!healthInfo.disease
                    });
                    // Add to family array
                    generatedFamily.push({
                        name: childName,
                        relation: isSon ? 'son' : 'daughter',
                        profession: 'Child',
                        age: childAge
                    });
                }
            }
        }
        
        // Extended family (30% chance for older characters)
        if (age > 35 && Math.random() > 0.7) {
            // Elderly parent living with them
            if (Math.random() > 0.5) {
                const elderAge = age + 25 + Math.floor(Math.random() * 10);
                const healthInfo = generateHealthStatus(elderAge);
                household.push({
                    name: generateName(Math.random() > 0.5),
                    relation: Math.random() > 0.5 ? 'Elderly father' : 'Elderly mother',
                    age: elderAge,
                    occupation: 'Retired',
                    health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                    hasDisease: !!healthInfo.disease
                });
            }
            
            // Unmarried relative
            if (Math.random() > 0.5) {
                const isAunt = Math.random() > 0.5;
                const relativeAge = age + Math.floor(Math.random() * 10) - 5;
                const healthInfo = generateHealthStatus(relativeAge);
                household.push({
                    name: generateName(!isAunt),
                    relation: isAunt ? 'Unmarried aunt' : 'Unmarried uncle',
                    age: relativeAge,
                    occupation: generateOccupation(relativeAge, isElite),
                    health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                    hasDisease: !!healthInfo.disease
                });
            }
        }
    }
    
    // If still no household members (rare), add at least 1-2 companions/relatives
    if (household.length === 0) {
        const numCompanions = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numCompanions; i++) {
            const isMale = Math.random() > 0.5;
            const companionAge = age - 5 + Math.floor(Math.random() * 10);
            const healthInfo = generateHealthStatus(companionAge);
            household.push({
                name: generateName(isMale),
                relation: ['Cousin', 'Friend', 'Companion', 'Lodger'][Math.floor(Math.random() * 4)],
                age: companionAge,
                occupation: generateOccupation(companionAge, isElite),
                health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                hasDisease: !!healthInfo.disease
            });
        }
    }
    
    // FIX: Only add servants for actually wealthy characters
    // Check both wealthLevel AND class to avoid commoners with servants
    const isActuallyWealthy = (char.wealthLevel === 'wealthy' || char.wealthLevel === 'comfortable') && 
                              (char.class === 'Noble' || char.class === 'Merchant' || char.class === 'Scholar');
                              
    if (isActuallyWealthy) {
        const numServants = char.wealthLevel === 'wealthy' ? 2 + Math.floor(Math.random() * 3) : 1;
        for (let i = 0; i < numServants; i++) {
            const servantTypes = ['Cook', 'Maid', 'Footman', 'Gardener', 'Stable hand', 'Butler', 'Chambermaid'];
            const servantAge = 16 + Math.floor(Math.random() * 30);
            const healthInfo = generateHealthStatus(servantAge);
            household.push({
                name: generateName(Math.random() > 0.5),
                relation: 'Servant',
                age: servantAge,
                occupation: servantTypes[Math.floor(Math.random() * servantTypes.length)],
                health: healthInfo.disease ? healthInfo.disease : healthInfo.status,
                hasDisease: !!healthInfo.disease
            });
        }
    }
    
    return { household, generatedFamily };
};

// Main Component
const CharacterProfileModal: React.FC<CharacterProfileModalProps> = ({ 
    isOpen, onClose, character, onRegenerate, isEnhancing, onEquipItem, onUnequipItem, 
    onDropItem, onConsumeItem, date, location 
}) => {
    const { setIsPortraitModalOpen, setPortraitModalCharacter } = useUI();
    const [activeTab, setActiveTab] = useState<'overview' | 'health-stats' | 'equipment' | 'inventory' | 'history' | 'beliefs' | 'household'>('overview');
    const [selectedInventoryItem, setSelectedInventoryItem] = useState<Item | null>(null);
    const [inventoryFilter, setInventoryFilter] = useState<'All' | 'Weapons' | 'Clothing' | 'Consumables' | 'Other'>('All');
    const [selectedDisease, setSelectedDisease] = useState<ActiveDisease | null>(null);
    const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
    
    // Memoize static content for History and Household tabs
    const expandedLifeEvents = useMemo(() => {
        if (!character) return [];
        return generateExpandedLifeEvents(character, date);
    }, [character?.id]); // Only regenerate if character changes
    
    const healthHistory = useMemo(() => {
        if (!character) return [];
        return generateHealthHistory(character);
    }, [character?.id]);
    
    const householdMembers = useMemo(() => {
        if (!character) return [];
        const result = generateHouseholdMembers(character, character.family || []);
        // Update character's family array with generated members if needed
        if (result.generatedFamily && result.generatedFamily.length > 0) {
            // Merge new family members with existing ones, avoiding duplicates
            const existingRelations = (character.family || []).map(f => f.relation);
            const newFamilyMembers = result.generatedFamily.filter(f => !existingRelations.includes(f.relation));
            if (newFamilyMembers.length > 0) {
                character.family = [...(character.family || []), ...newFamilyMembers];
            }
        }
        return result.household;
    }, [character?.id]);
    
    useEffect(() => {
        if (!isOpen) {
            setActiveTab('overview');
            setSelectedInventoryItem(null);
        }
    }, [isOpen]);

    const allItems = useMemo(() => {
        if (!character) return [];
        return character.inventory || [];
    }, [character]);

    const filteredInventory = useMemo(() => {
        let items = allItems;
        if (inventoryFilter !== 'All') {
            items = items.filter(item => {
                switch(inventoryFilter) {
                    case 'Weapons': return item.category === 'Weapon';
                    case 'Clothing': return item.category === 'Apparel';
                    case 'Consumables': return item.category === 'Consumable' || item.sustenance > 0 || item.fatigueEffect || item.xpEffect;
                    case 'Other': return !['Weapon', 'Apparel', 'Consumable'].includes(item.category) && !item.sustenance && !item.fatigueEffect && !item.xpEffect;
                    default: return true;
                }
            });
        }
        return items;
    }, [allItems, inventoryFilter]);

    useEffect(() => {
        if (filteredInventory.length > 0 && (!selectedInventoryItem || !filteredInventory.find(i => i.id === selectedInventoryItem.id))) {
            setSelectedInventoryItem(filteredInventory[0]);
        } else if (filteredInventory.length === 0) {
            setSelectedInventoryItem(null);
        }
    }, [filteredInventory, selectedInventoryItem]);
    
    if (!isOpen || !character) return null;

    const renderOverview = () => {
        return (
            <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                    {/* Left column: Portrait and Vitals */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Portrait with Name/Profession Box */}
                        <div className="space-y-4">
                            <div 
                                className="relative w-full max-w-xs mx-auto lg:max-w-none group cursor-pointer"
                                onClick={() => {
                                    setIsPortraitModalOpen(true);
                                    setPortraitModalCharacter(character);
                                }}
                                title="Click to view full portrait"
                            >
                                <div className="aspect-square bg-slate-900/50 rounded-xl border-2 border-slate-700/50 shadow-xl shadow-black/40 overflow-hidden transition-all duration-300 group-hover:scale-105 group-hover:border-blue-500/50 flex items-center justify-center">
                                    <div className="w-full h-full transform scale-110">
                                        <ProceduralPortrait character={character} size={300} />
                                    </div>
                                </div>
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none group-hover:from-black/40 transition-colors" />
                                <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Name and Profession Box */}
                            <div className="p-4 bg-slate-800/60 rounded-lg border border-slate-700/50 text-center">
                                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">{character.name}</h3>
                                <p className="text-base md:text-lg font-semibold text-amber-300 capitalize">{character.profession}</p>
                                
                                {/* Disease Badges */}
                                {character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0 && (
                                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                                        {character.diseaseHealth.currentDiseases.map((disease, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setSelectedDisease(disease);
                                                    setIsDiseaseModalOpen(true);
                                                }}
                                                className="px-3 py-1 bg-pink-600/80 hover:bg-pink-500 text-white text-xs font-bold rounded-full 
                                                         border border-pink-400 shadow-lg hover:shadow-pink-500/50 transition-all duration-200
                                                         flex items-center gap-1 cursor-pointer"
                                                title={`Click for details about ${disease.disease.name}`}
                                            >
                                                <span className="text-base">{disease.disease.badgeIcon}</span>
                                                <span>{disease.disease.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vitals Box */}
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <h4 className="font-semibold text-blue-300 mb-3 text-sm uppercase tracking-wider">VITALS</h4>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-red-400">Health</span>
                                        <span className="text-sm font-bold text-white">{character.health}/{character.maxHealth}</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300" style={{width: `${(character.health/character.maxHealth) * 100}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-yellow-400">Fatigue</span>
                                        <span className="text-sm font-bold text-white">{Math.round(character.fatigue)}/100</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300" style={{width: `${character.fatigue}%`}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-sm text-cyan-400">Experience</span>
                                        <span className="text-sm font-bold text-white">{character.experience}/{character.maxExperience}</span>
                                    </div>
                                    <div className="w-full h-4 bg-slate-700 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300" style={{width: `${(character.experience/character.maxExperience) * 100}%`}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Middle column: Background and Status */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50 h-full">
                            <h3 className="text-base md:text-lg font-bold text-amber-400 mb-3 uppercase tracking-wider">Background</h3>
                            <p className="font-lora text-sm md:text-base text-slate-200 leading-relaxed italic whitespace-pre-wrap">
                               {character.backstory}
                            </p>
                        </div>
                    </div>

                    {/* Right column: Stats and Details */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <h4 className="font-semibold text-blue-300 mb-3 text-sm uppercase tracking-wider">CHARACTER INFO</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Level:</span>
                                    <span className="font-bold text-white">{character.level}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Age:</span>
                                    <span className="font-bold text-white">{character.age}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Class:</span>
                                    <span className="font-bold text-white text-right">{character.class?.replace(/_/g, ' ')}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-slate-400">Religion:</span>
                                    <span className="font-bold text-white text-right max-w-[60%]">{character.religion}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Height:</span>
                                    <span className="font-bold text-white">{cmToFeetAndInches(character.appearance?.height || 170)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400">Weight:</span>
                                    <span className="font-bold text-white">{kgToLbs(character.appearance?.weight || 70)}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <h4 className="font-semibold text-blue-300 mb-3 text-sm uppercase tracking-wider">APPEARANCE</h4>
                            <div className="text-sm space-y-2">
                                 <DetailRow label="Garment" value={formatAppearanceText(character.equippedItems.torso || character.appearance.garment, character.appearance.palette?.primary)} />
                                 <DetailRow label="Headgear" value={formatAppearanceText(character.equippedItems.head || character.appearance.headgear, character.appearance.palette?.secondary)} />
                                 <DetailRow label="Footwear" value={formatAppearanceText(character.equippedItems.feet || character.appearance.footwear, character.appearance.palette?.secondary)} />
                                 <DetailRow label="Build" value={character.appearance?.build} />
                            </div>
                        </div>
                        
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <h4 className="font-semibold text-blue-300 mb-3 text-sm uppercase tracking-wider">TOP STATS</h4>
                            <div className="space-y-3">
                                {Object.entries(character.stats)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 3)
                                    .map(([stat, value]) => (
                                        <div key={stat} className="flex justify-between items-center">
                                            <span className="text-sm text-slate-300 capitalize">{stat}</span>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-3 bg-slate-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-300" style={{width: `${(value/20) * 100}%`}}></div>
                                                </div>
                                                <span className="text-sm font-bold text-white w-6 text-right">{value}</span>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderHealthAndStats = () => (
        <div className="p-8">
            {/* Health Status Section */}
            <div className="mb-8 p-6 bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-xl border border-slate-700/50">
                <h3 className="text-lg font-bold text-pink-400 mb-4 uppercase tracking-wider">Current Health Status</h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-slate-300">Overall Health:</span>
                            <span className="font-bold text-white">{character.health}/{character.maxHealth} HP</span>
                        </div>
                        <div className="w-full h-6 bg-slate-700 rounded-full overflow-hidden mb-4">
                            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300" 
                                 style={{width: `${(character.health/character.maxHealth) * 100}%`}}>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-slate-300">Fatigue Level:</span>
                            <span className="font-bold text-white">{character.fatigue}/{character.maxFatigue}</span>
                        </div>
                        <div className="w-full h-6 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-300" 
                                 style={{width: `${(character.fatigue/character.maxFatigue) * 100}%`}}>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-white mb-3">Disease Status:</h4>
                        {character.diseaseHealth?.currentDiseases && character.diseaseHealth.currentDiseases.length > 0 ? (
                            <div className="space-y-2">
                                {character.diseaseHealth.currentDiseases.map((disease, index) => (
                                    <div key={index} className="p-3 bg-pink-900/30 border border-pink-600/50 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-pink-300">
                                                {disease.disease.badgeIcon} {disease.disease.name}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedDisease(disease);
                                                    setIsDiseaseModalOpen(true);
                                                }}
                                                className="text-xs text-pink-400 hover:text-pink-300 underline"
                                            >
                                                Details
                                            </button>
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1">
                                            Contracted {disease.dayContracted ? `${parseInt(date) - disease.dayContracted} days ago` : 'recently'}
                                        </div>
                                        <div className="text-xs text-gray-300 mt-1">
                                            Severity: <span className={disease.disease.severity === 'severe' ? 'text-red-400' : 
                                                                      disease.disease.severity === 'moderate' ? 'text-yellow-400' : 'text-green-400'}>
                                                {disease.disease.severity}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 bg-green-900/20 border border-green-600/50 rounded-lg">
                                <span className="text-green-400 font-semibold">✅ Currently Healthy</span>
                                <p className="text-xs text-gray-400 mt-1">No active diseases or infections</p>
                            </div>
                        )}
                        
                        {character.diseaseHealth?.immunities && character.diseaseHealth.immunities.length > 0 && (
                            <div className="mt-3">
                                <h5 className="text-sm font-semibold text-blue-300 mb-1">Immunities:</h5>
                                <div className="flex flex-wrap gap-1">
                                    {character.diseaseHealth.immunities.map((immunity, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-blue-800/40 text-blue-300 text-xs rounded-full">
                                            {immunity}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Original Stats Grid */}
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-lg font-bold text-slate-300 mb-4 uppercase tracking-wider">Core Stats</h3>
                    <div className="space-y-4">
                        <StatBar label="Strength" value={character.stats.strength} icon="💪" color="#ef4444" />
                        <StatBar label="Dexterity" value={character.stats.dexterity} icon="🤸" color="#22c55e" />
                        <StatBar label="Constitution" value={character.stats.constitution} icon="❤️" color="#f97316" />
                        <StatBar label="Intelligence" value={character.stats.intelligence} icon="🧠" color="#3b82f6" />
                        <StatBar label="Persuasion" value={character.stats.persuasion} icon="💬" color="#8b5cf6" />
                        <StatBar label="Perception" value={character.stats.perception} icon="👁️" color="#eab308" />
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-300 mb-4 uppercase tracking-wider">Personality</h3>
                    <div className="space-y-4">
                        <TraitDisplay label="Openness" value={character.personality.openness} />
                        <TraitDisplay label="Conscientiousness" value={character.personality.conscientiousness} />
                        <TraitDisplay label="Extraversion" value={character.personality.extraversion} />
                        <TraitDisplay label="Agreeableness" value={character.personality.agreeableness} />
                        <TraitDisplay label="Neuroticism" value={character.personality.neuroticism} />
                    </div>
                </div>
            </div>
        </div>
    );
    
    const renderStats = () => (
        <div className="p-8 grid md:grid-cols-2 gap-8">
            <div>
                <h3 className="text-lg font-bold text-slate-300 mb-4 uppercase tracking-wider">Core Stats</h3>
                <div className="space-y-4">
                    <StatBar label="Strength" value={character.stats.strength} icon="💪" color="#ef4444" />
                    <StatBar label="Dexterity" value={character.stats.dexterity} icon="🤸" color="#22c55e" />
                    <StatBar label="Constitution" value={character.stats.constitution} icon="❤️" color="#f97316" />
                    <StatBar label="Intelligence" value={character.stats.intelligence} icon="🧠" color="#3b82f6" />
                    <StatBar label="Persuasion" value={character.stats.persuasion} icon="💬" color="#8b5cf6" />
                    <StatBar label="Perception" value={character.stats.perception} icon="👁️" color="#eab308" />
                </div>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-300 mb-4 uppercase tracking-wider">Personality</h3>
                <div className="space-y-4">
                    <TraitDisplay label="Openness" value={character.personality.openness} />
                    <TraitDisplay label="Conscientiousness" value={character.personality.conscientiousness} />
                    <TraitDisplay label="Extraversion" value={character.personality.extraversion} />
                    <TraitDisplay label="Agreeableness" value={character.personality.agreeableness} />
                    <TraitDisplay label="Neuroticism" value={character.personality.neuroticism} />
                </div>
            </div>
        </div>
    );

    const renderHistoryTab = () => {
        const { family = [] } = character;
        // Use memoized values instead of regenerating
        
        return (
            <div className="p-6 grid md:grid-cols-3 gap-6">
                <div>
                    <h4 className="font-semibold text-lg text-blue-400 mb-4 border-b border-slate-700 pb-2">Family</h4>
                    <div className="space-y-4 text-sm">
                        {(['father', 'mother'] as const).map(rel => {
                            const member = family.find(f => f.relation === rel);
                            if (!member) return null;
                            return <div key={rel}><strong>{member.relation.charAt(0).toUpperCase() + member.relation.slice(1)}:</strong> {member.name} ({member.profession})</div>
                        })}
                        {(['spouse'] as const).map(rel => {
                            const member = family.find(f => f.relation === rel);
                            if (!member) return null;
                            return <div key={rel}><strong>Spouse:</strong> {member.name} ({member.profession}, age {member.age})</div>
                        })}
                         <div>
                            <strong>Children:</strong>
                            <ul className="list-disc list-inside ml-2 mt-1 space-y-1">
                                {family.filter(f => f.relation === 'son' || f.relation === 'daughter').map((child, index) => (
                                    <li key={`child-${index}-${child.name}`}>{child.name} (age {child.age})</li>
                                ))}
                                {family.filter(f => f.relation === 'son' || f.relation === 'daughter').length === 0 && <li>None</li>}
                            </ul>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 className="font-semibold text-lg text-blue-400 mb-4 border-b border-slate-700 pb-2">Timeline</h4>
                    <div className="relative border-l-2 border-gray-600 pl-6 space-y-4 max-h-96 overflow-y-auto scrollbar-thin">
                        {expandedLifeEvents.map((event, index) => (
                            <div key={index} className="relative">
                                <div className="absolute -left-[30.5px] top-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-800"></div>
                                <div className="text-xs text-gray-400 font-semibold">{event.year}</div>
                                <div className="text-sm text-white">{event.event}</div>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div>
                    <h4 className="font-semibold text-lg text-pink-400 mb-4 border-b border-slate-700 pb-2">Health History</h4>
                    <div className="space-y-3">
                        {healthHistory.length > 0 ? (
                            healthHistory.map((record, index) => (
                                <div key={index} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-bold text-pink-300">{record.disease}</span>
                                        <span className="text-xs text-gray-400">{record.year}</span>
                                    </div>
                                    <div className="text-xs text-gray-300">Age {record.age}</div>
                                    <div className="text-xs text-gray-400 mt-1 italic">{record.outcome}</div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-500 italic">No major illnesses or injuries recorded</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderHouseholdTab = () => {
        // Use memoized household members
        const livingAlone = householdMembers.length === 0;
        
        return (
            <div className="p-6">
                <h3 className="text-lg font-bold text-amber-400 mb-4 uppercase tracking-wider">Current Household</h3>
                
                {livingAlone ? (
                    <div className="p-6 bg-slate-800/40 rounded-lg border border-slate-700/50 text-center">
                        <p className="text-gray-400 italic text-lg mb-2">Living Alone</p>
                        <p className="text-sm text-gray-500">
                            {character.age < 20 ? "Recently left home to seek fortune" :
                             character.age < 30 ? "Independent and self-sufficient" :
                             "Prefers solitude and quiet contemplation"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <p className="text-sm text-gray-400 mb-3">
                                Living in a {character.wealthLevel === 'wealthy' ? 'grand estate' :
                                           character.wealthLevel === 'comfortable' ? 'comfortable home' :
                                           character.wealthLevel === 'modest' ? 'modest dwelling' :
                                           'humble cottage'} with {householdMembers.length} other{householdMembers.length === 1 ? '' : 's'}
                            </p>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-4">
                            {householdMembers.map((member, index) => (
                                <div key={index} className="p-4 bg-gradient-to-br from-slate-800/60 to-slate-900/40 rounded-lg border border-slate-700/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h4 className="font-semibold text-white">{member.name}</h4>
                                            <p className="text-xs text-blue-300">{member.relation}</p>
                                        </div>
                                        <span className="text-xs text-gray-400">Age {member.age}</span>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Occupation:</span>
                                            <span className="text-gray-300">{member.occupation}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Health:</span>
                                            <span className={`${
                                                member.hasDisease ? 'text-red-500 font-semibold' :
                                                member.health === 'Good health' ? 'text-green-400' :
                                                member.health === 'Fair health' ? 'text-yellow-400' :
                                                member.health === 'Declining health' || member.health === 'Poor health' ? 'text-orange-400' :
                                                member.health === 'Frail' ? 'text-red-400' :
                                                'text-gray-400'
                                            }`}>{member.health}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/50 rounded-lg">
                            <p className="text-xs text-blue-300">
                                <strong>Note:</strong> Your household arrangement affects daily life, quest opportunities, and social standing in the community.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const renderInventory = () => {
        const displayDescription = selectedInventoryItem ? (isGenericDescription(selectedInventoryItem.description, selectedInventoryItem.name) ? generateProceduralItemDescription(selectedInventoryItem) : selectedInventoryItem.description) : '';

        return (
            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                <div className="lg:col-span-2 flex flex-col bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <div className="flex justify-between items-center mb-2 shrink-0 px-1">
                        <h4 className="font-semibold text-lg text-green-300">Inventory</h4>
                        <div className="flex gap-1 p-1 bg-slate-900/50 rounded-md">
                            {(['All', 'Weapons', 'Clothing', 'Consumables', 'Other'] as const).map(cat => (
                                <button key={cat} onClick={() => setInventoryFilter(cat)} className={`px-2 py-0.5 text-xs rounded ${inventoryFilter === cat ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-2">
                        {filteredInventory.map(item => (
                            <div 
                                key={item.id}
                                className={`flex items-center p-2 rounded-md cursor-pointer transition-all duration-150
                                ${selectedInventoryItem?.id === item.id ? 'bg-blue-800/50 ring-1 ring-blue-500' : 'bg-slate-900/50 hover:bg-slate-700/50'}`}
                                onClick={() => setSelectedInventoryItem(item)}
                            >
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <GenerativeItemIcon item={item} size={40} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate text-white">{formatItemName(item.name)}</p>
                                </div>
                                {item.stackable && item.quantity > 1 && <span className="text-xs text-slate-400 mr-3">x{item.quantity}</span>}
                                <RarityTag rarity={item.rarity} />
                            </div>
                        ))}
                        {filteredInventory.length === 0 && (
                            <p className="text-center text-slate-500 italic py-8 text-sm">No items in this category.</p>
                        )}
                    </div>
                </div>
                <div className="flex flex-col bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    {selectedInventoryItem ? (
                        <div className="text-center flex flex-col h-full">
                            <div className="w-24 h-24 my-4 mx-auto flex items-center justify-center">
                               <GenerativeItemIcon item={selectedInventoryItem} size={96} />
                            </div>
                            <h5 className="font-bold text-lg text-white">{formatItemName(selectedInventoryItem.name)}</h5>
                            <p className="text-sm text-slate-400 mb-4 italic">{displayDescription}</p>
                            <div className="text-xs space-y-1 text-left mb-4 p-2 bg-slate-900/30 rounded-md">
                                <DetailRow label="Category" value={selectedInventoryItem.category} />
                                <DetailRow label="Value" value={`${selectedInventoryItem.value} 🪙`} />
                                <DetailRow label="Weight" value={`${selectedInventoryItem.weight} lbs`} />
                            </div>
                            <div className="mt-auto space-y-2">
                                {(selectedInventoryItem.wearable || selectedInventoryItem.wieldable) && <button onClick={() => onEquipItem(selectedInventoryItem)} className="w-full ff-action-button">Equip</button>}
                                {(selectedInventoryItem.sustenance > 0 || selectedInventoryItem.fatigueEffect || selectedInventoryItem.xpEffect) && <button onClick={() => onConsumeItem(selectedInventoryItem)} className="w-full ff-action-button">Consume</button>}
                                <button onClick={() => onDropItem(selectedInventoryItem)} className="w-full ff-action-button bg-red-800/50 border-red-500/50 hover:bg-red-700/50">Drop</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 italic">Select an item</div>
                    )}
                </div>
            </div>
        );
    }
    
    const renderContent = () => {
        return (
            <div className="min-h-[700px]">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'health-stats' && renderHealthAndStats()}
                {activeTab === 'equipment' && <EquipmentPanel character={character} onEquipItem={onEquipItem} onUnequipItem={onUnequipItem} />}
                {activeTab === 'inventory' && renderInventory()}
                {activeTab === 'beliefs' && <div className="p-6"><BeliefsPanel character={character} /></div>}
                {activeTab === 'history' && renderHistoryTab()}
                {activeTab === 'household' && renderHouseholdTab()}
            </div>
        )
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="ff-panel w-full max-w-6xl md:max-w-7xl h-auto max-h-[95vh] md:max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] flex-grow min-h-0">
                    {/* Left Column: Party - hidden on mobile, shown on desktop */}
                    <div className="hidden md:flex p-5 flex-col gap-4 border-r-2 border-slate-700 bg-slate-800/30">
                        <h3 className="font-press-start text-xl text-slate-300 text-center tracking-wider mb-2">PARTY</h3>
                        <div className="p-4 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-800/40 border border-slate-600/50">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-900 border-2 border-slate-500 shadow-lg shrink-0 flex items-center justify-center">
                                    <div className="transform scale-110">
                                        <ProceduralPortrait character={character} size={80} />
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-lg text-white truncate">{character.name}</h4>
                                    <p className="text-sm text-amber-300 capitalize truncate">{character.profession}</p>
                                    <p className="text-sm text-blue-300 mt-1">Level {character.level}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Tabs */}
                    <div className="flex flex-col min-h-0">
                        <div className="flex-shrink-0 flex border-b-2 border-slate-700 bg-slate-800/60 overflow-x-auto scrollbar-thin">
                            <TabButton label="Overview" isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
                            <TabButton label="Health & Stats" isActive={activeTab === 'health-stats'} onClick={() => setActiveTab('health-stats')} />
                            <TabButton label="Equipment" isActive={activeTab === 'equipment'} onClick={() => setActiveTab('equipment')} />
                            <TabButton label="Inventory" isActive={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
                            <TabButton label="Beliefs" isActive={activeTab === 'beliefs'} onClick={() => setActiveTab('beliefs')} />
                            <TabButton label="History" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} />
                            <TabButton label="Household" isActive={activeTab === 'household'} onClick={() => setActiveTab('household')} />
                        </div>
                        <div className="flex-grow overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
                            {renderContent()}
                        </div>
                    </div>
                </div>
                 {/* Footer */}
                 <div className="flex-shrink-0 p-4 border-t-2 border-slate-700 flex justify-between items-center bg-slate-800/80">
                    <div>
                        <button onClick={onRegenerate} className="ff-action-button" disabled={isEnhancing}>
                            {isEnhancing ? "Enhancing..." : "Regenerate Character"}
                        </button>
                    </div>
                    <button onClick={onClose} className="ff-action-button">Close</button>
                </div>
            </div>
            
            {/* Disease Modal */}
            {selectedDisease && (
                <DiseaseModal
                    disease={selectedDisease}
                    isOpen={isDiseaseModalOpen}
                    onClose={() => {
                        setIsDiseaseModalOpen(false);
                        setSelectedDisease(null);
                    }}
                    currentYear={parseInt(date) || 1500}
                    culturalZone={mapLocationToCulture(location, parseInt(date) || 1500)}
                />
            )}
        </div>
    );
};

export default CharacterProfileModal;
