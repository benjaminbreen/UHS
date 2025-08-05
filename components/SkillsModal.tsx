/**
 * components/SkillsModal.tsx - A modal to display the results of a player skill.
 */
import React from 'react';
import { SkillResult, ObserveSkillResult, ForageSkillResult } from '../types';

interface SkillsModalProps {
    isOpen: boolean;
    isLoading: boolean;
    result: SkillResult;
    onClose: () => void;
}

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
                    {/* Add other result types here */}
                    {result.type !== 'observe' && result.type !== 'forage' && (
                        <>
                         <h3 id="skill-modal-title" className="text-xl font-semibold text-blue-300 mb-4 capitalize">{result.type}</h3>
                         <p className="text-gray-300">{(result as any).message}</p>
                         {(result as any).xpGained && <p className="text-sm text-yellow-400 mt-4 font-semibold">+{(result as any).xpGained} XP</p>}
                        </>
                    )}
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