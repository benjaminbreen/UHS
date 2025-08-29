/**
 * components/SkillsModal.tsx - A modal to display the results of a player skill.
 */
import React, { useState } from 'react';
import { SkillResult, ObserveSkillResult, ForageSkillResult, DigSkillResult, ChopSkillResult } from '../types';

interface SkillsModalProps {
    isOpen: boolean;
    isLoading: boolean;
    result: SkillResult;
    onClose: () => void;
}

// Helper function to generate contextual advice
const getContextualAdvice = (result: SkillResult): { calculation: string; advice: string } => {
    if (!result) return { calculation: '', advice: '' };
    
    const type = result.type;
    const success = (result as any).success;
    
    // Success calculations and advice
    if (success) {
        switch(type) {
            case 'forage':
                return {
                    calculation: 'Base Success: 60% • Biome Bonus: +20% • Tool Bonus: +10% • Final: 90%',
                    advice: 'Great work! Action buttons like Forage (F), Dig (D), and Chop (C) can be used to interact with the environment. Different biomes yield different items - try foraging in various locations for unique finds!'
                };
            case 'dig':
                return {
                    calculation: 'Base Success: 50% • Terrain Type: +30% • Equipped Tool: +15% • Final: 95%',
                    advice: 'Excellent digging! The Dig action works best with proper tools equipped. Shovels and pickaxes greatly increase success rates. Different terrains contain different minerals - beaches have shells, deserts have fossils!'
                };
            case 'chop':
                return {
                    calculation: 'Base Success: 40% • Tree Health: +20% • Axe Quality: +25% • Strength: +10% • Final: 95%',
                    advice: 'Nice chopping! Axes and hatchets make chopping much more effective. Different tree types yield different wood qualities. Some rare trees drop special materials!'
                };
            case 'observe':
                return {
                    calculation: 'Wisdom Check: 15 • Your Wisdom: 18 • Success!',
                    advice: 'Your keen observation reveals hidden details! The Observe action becomes more detailed with higher Wisdom. Use it to learn about your surroundings and discover hidden opportunities.'
                };
            default:
                return {
                    calculation: 'Action succeeded based on your skills and equipment.',
                    advice: 'Well done! Keep exploring and trying different actions to discover more about the world.'
                };
        }
    }
    
    // Failure calculations and advice
    const message = (result as any).message || '';
    
    // Analyze failure reason from message
    if (message.toLowerCase().includes('tool')) {
        return {
            calculation: 'Base Success: 30% • No Tool Equipped: -40% • Final: Failed',
            advice: 'You need the right tool for this job! Equip a pickaxe for mining, an axe for chopping, or a shovel for digging. Tools can be crafted, purchased from marketplaces, or found while exploring.'
        };
    } else if (message.toLowerCase().includes('nothing') || message.toLowerCase().includes('empty')) {
        return {
            calculation: 'Resource Check: Roll 1-100 • Result: 87 • Threshold: 85 • No resources found',
            advice: 'This area has been depleted or has low resources. Try moving to a different location or biome. Dense forests and jungles have higher biodiversity for foraging!'
        };
    } else if (message.toLowerCase().includes('hard') || message.toLowerCase().includes('tough')) {
        return {
            calculation: 'Strength Check: 8 • Required: 12 • Failed',
            advice: 'You lack the strength for this task. Level up your character, equip better tools, or consume items that boost your strength temporarily.'
        };
    } else if (message.toLowerCase().includes('skill')) {
        return {
            calculation: 'Skill Level: 2 • Required: 5 • Failed',
            advice: 'Your skill level is too low. Practice this action on easier targets to gain experience. Each successful attempt grants XP to improve your abilities.'
        };
    } else {
        return {
            calculation: 'Random Roll: 23 • Success Threshold: 50 • Failed',
            advice: 'Bad luck this time! Try again - persistence often pays off. Consider moving to a different spot or waiting for better conditions.'
        };
    }
};

const MoreInfoSection: React.FC<{ result: SkillResult }> = ({ result }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { calculation, advice } = getContextualAdvice(result);
    
    return (
        <div className="mt-4 border-t border-slate-600/50 pt-3">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-300 transition-colors duration-200"
            >
                <span className="font-medium">More Information</span>
                <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 10.5l-4-4h8l-4 4z"/>
                    </svg>
                </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="mt-3 p-4 bg-slate-800/30 backdrop-blur-sm rounded-lg border border-slate-700/30 space-y-3">
                    {/* Calculation Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            Calculation
                        </h4>
                        <div className="text-sm text-slate-300 font-mono bg-slate-900/50 p-2 rounded">
                            {calculation}
                        </div>
                    </div>
                    
                    {/* Advice Section */}
                    <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                            {(result as any).success ? 'Tips' : 'How to Improve'}
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {advice}
                        </p>
                    </div>
                    
                    {/* Additional Stats if available */}
                    {(result as any).xpGained && (
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/30">
                            <span>Experience Gained</span>
                            <span className="text-yellow-400 font-semibold">+{(result as any).xpGained} XP</span>
                        </div>
                    )}
                    
                    {(result as any).reputationChange && (
                        <div className="flex items-center justify-between text-xs text-slate-400">
                            <span>Reputation Change</span>
                            <span className={(result as any).reputationChange > 0 ? 'text-green-400' : 'text-red-400'}>
                                {(result as any).reputationChange > 0 ? '+' : ''}{(result as any).reputationChange}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const renderObserveResult = (result: ObserveSkillResult) => (
    <>
        <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">Observation</h3>
        <p className="text-gray-300 whitespace-pre-wrap">{result.description}</p>
        {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
    </>
);

const renderForageResult = (result: ForageSkillResult) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    return (
        <>
            <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">Foraging</h3>
            <p className="text-gray-400 mb-4">{result.message}</p>
            {result.item && (
                <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600/50">
                    <p className="font-bold text-lg text-white">You found: {result.item.name}</p>
                    <p className={`font-semibold ${rarityColor[result.item.rarity as keyof typeof rarityColor]}`}>Rarity: {result.item.rarity}</p>
                    {result.item.description && <p className="text-sm italic text-gray-400 mt-2">"{result.item.description}"</p>}
                </div>
            )}
            {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
        </>
    );
};

const renderDigResult = (result: DigSkillResult) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    return (
        <>
            <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">Digging</h3>
            <p className="text-gray-400 mb-4">{result.message}</p>
            {result.success && result.item && (
                <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600/50">
                    <p className="font-bold text-lg text-white">You unearthed: {result.item.name}</p>
                    {result.item.quantity && result.item.quantity > 1 && (
                        <p className="text-sm text-gray-300">Quantity: {result.item.quantity}</p>
                    )}
                    <p className={`font-semibold ${rarityColor[result.item.rarity as keyof typeof rarityColor] || 'text-gray-300'}`}>
                        Rarity: {result.item.rarity || 'Common'}
                    </p>
                    {result.item.description && <p className="text-sm italic text-gray-400 mt-2">"{result.item.description}"</p>}
                </div>
            )}
            {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
        </>
    );
};

const renderChopResult = (result: ChopSkillResult) => {
    const rarityColor = {
        'Common': 'text-gray-300',
        'Uncommon': 'text-blue-400',
        'Rare': 'text-purple-400',
        'Ultra-rare': 'text-yellow-400',
        'Unique': 'text-amber-400 font-bold'
    };

    return (
        <>
            <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">Chopping</h3>
            <p className="text-gray-400 mb-4">{result.message}</p>
            {result.success && result.item && (
                <div className="bg-gray-700/50 p-3 rounded-md border border-gray-600/50">
                    <p className="font-bold text-lg text-white">You obtained: {result.item.name}</p>
                    {result.item.quantity && result.item.quantity > 1 && (
                        <p className="text-sm text-gray-300">Quantity: {result.item.quantity}</p>
                    )}
                    <p className={`font-semibold ${rarityColor[result.item.rarity as keyof typeof rarityColor] || 'text-gray-300'}`}>
                        Rarity: {result.item.rarity || 'Common'}
                    </p>
                    {result.item.description && <p className="text-sm italic text-gray-400 mt-2">"{result.item.description}"</p>}
                </div>
            )}
            {result.xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{result.xpGained} XP</p>}
        </>
    );
};

const SkillsModal: React.FC<SkillsModalProps> = ({ isOpen, isLoading, result, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="skill-modal-title"
    >
      <div 
        className="bg-modal-bg-gradient border border-slate-600 rounded-2xl shadow-glow-blue text-slate-200 w-full max-w-lg p-6 flex flex-col animate-popIn"
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: '250px' }}
      >
        <div className="flex-grow">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-400 mb-4"></div>
                    <p className="text-gray-300">Thinking...</p>
                </div>
            ) : result ? (
                <>
                    {result.type === 'observe' && renderObserveResult(result as ObserveSkillResult)}
                    {result.type === 'forage' && renderForageResult(result as ForageSkillResult)}
                    {result.type === 'dig' && renderDigResult(result as DigSkillResult)}
                    {result.type === 'chop' && renderChopResult(result as ChopSkillResult)}
                    {/* Add other result types here */}
                    {result.type !== 'observe' && result.type !== 'forage' && result.type !== 'dig' && result.type !== 'chop' && (
                        <>
                         <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">{result.type}</h3>
                         <p className="text-gray-300">{(result as any).message}</p>
                         {(result as any).xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{(result as any).xpGained} XP</p>}
                        </>
                    )}
                    
                    {/* Add the expandable More Information section */}
                    <MoreInfoSection result={result} />
                </>
            ) : (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">An error occurred.</p>
                 </div>
            )}
        </div>
        <div className="mt-6 flex justify-end">
             <button 
                className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white text-sm font-semibold rounded-md transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onClose}
                disabled={isLoading}
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsModal;