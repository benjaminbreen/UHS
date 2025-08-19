/**
 * components/AnimalInfoModal.tsx - Modal to display detailed animal information.
 */
import React, { useMemo, useState } from 'react';
import { AnimalEntity } from '../types';
import { generateAnimalDescriptions } from '../services/animalDescriptionGenerator';
import { ANIMAL_DATA } from '../constants/index';
import DiseaseModal from './DiseaseModal';
import { ActiveDisease } from '../types/diseaseTypes';
import { useGame } from '../contexts/GameContext';
import { mapLocationToCulture } from '../utils/mapUtils';

interface AnimalInfoModalProps {
  animal: AnimalEntity;
  onClose: () => void;
}

const StatDisplay: React.FC<{ label: string, value: number }> = ({ label, value }) => {
    const percentage = (value / 10) * 100;
    const colorClass = value > 7 ? 'bg-green-500' : value > 4 ? 'bg-yellow-500' : 'bg-red-500';
    return (
        <div className="text-xs">
            <div className="flex items-center justify-between mb-1">
                <span>{label}</span>
                <span className="font-mono">{value}/10</span>
            </div>
            <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                <div className={`h-full ${colorClass}`} style={{ width: `${percentage}%` }}/>
            </div>
        </div>
    );
};


const AnimalInfoModal: React.FC<AnimalInfoModalProps> = ({ animal, onClose }) => {
  const { short, long } = useMemo(() => generateAnimalDescriptions(animal), [animal]);
  const [selectedDisease, setSelectedDisease] = useState<ActiveDisease | null>(null);
  const [isDiseaseModalOpen, setIsDiseaseModalOpen] = useState(false);
  const { gameDate, currentZone } = useGame();
  const baseAnimalData = ANIMAL_DATA[animal.baseId];
  const baseAnimalName = baseAnimalData?.name || animal.baseId;
  const isAquatic = baseAnimalData?.habitat === 'aquatic';
  
  if (isAquatic) {
    return (
      <div 
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="animal-modal-title"
      >
        <div 
          className="bg-modal-bg-gradient border border-slate-600 rounded-2xl shadow-glow-blue text-slate-200 w-full max-w-md p-6 flex flex-col animate-popIn"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between pb-2 mb-4 border-b border-gray-700">
            <div className="flex items-center">
              <span className="mr-4 text-5xl">{animal.emoji}</span>
              <div>
                <h3 id="animal-modal-title" className="text-2xl font-bold text-blue-300 capitalize">
                    {animal.speciesName}
                </h3>
                <p className="text-sm italic text-gray-400 capitalize">{baseAnimalData.type} Creature</p>
              </div>
            </div>
            <button onClick={onClose} className="text-3xl font-thin leading-none text-gray-400 transition-colors hover:text-white">&times;</button>
          </div>
          <div className="flex-grow">
            <p className="text-sm text-center italic text-gray-400">You see {animal.speciesName.toLowerCase()} in the water.</p>
          </div>
          <div className="flex justify-end mt-6">
             <button 
                className="px-6 py-2 text-sm font-semibold text-white transition duration-150 bg-gray-600 rounded-md hover:bg-gray-500"
                onClick={onClose}
            >
                Close
            </button>
        </div>
        </div>
      </div>
    );
  }
  
  return (
    <div 
        className="modal-overlay"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="animal-modal-title"
    >
      <div 
        className="bg-modal-bg-gradient border border-slate-600 rounded-2xl shadow-glow-blue text-slate-200 w-full max-w-lg p-6 flex flex-col animate-popIn"
        onClick={(e) => e.stopPropagation()}
        style={{ minHeight: '300px' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-2 mb-4 border-b border-gray-700">
          <div className="flex items-center flex-1">
            <span className="mr-4 text-5xl">{animal.emoji}</span>
            <div className="flex-1">
                <div className="flex flex-wrap items-baseline">
                    <h3 id="animal-modal-title" className="text-2xl font-bold text-blue-300 capitalize">
                        {animal.speciesName}
                    </h3>
                    <p className="ml-3 text-sm italic text-gray-400" style={{fontFamily: 'serif'}}>
                        ({animal.linnaeanName})
                    </p>
                </div>
                <p className="text-sm italic text-gray-400">{short}</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            {/* Health/Disease Badge */}
            {animal.diseaseHealth?.currentDiseases && animal.diseaseHealth.currentDiseases.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {animal.diseaseHealth.currentDiseases.map((disease, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDisease(disease);
                      setIsDiseaseModalOpen(true);
                    }}
                    className="px-2 py-0.5 bg-pink-600/80 hover:bg-pink-500 text-white text-xs font-bold rounded-full 
                             border border-pink-400 shadow-md hover:shadow-pink-500/50 transition-all duration-200
                             flex items-center gap-1 cursor-pointer"
                    title={`Click for details about ${disease.disease.name}`}
                  >
                    <span className="text-sm">{disease.disease.badgeIcon}</span>
                    <span>{disease.disease.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <span className="px-3 py-1 bg-green-600/80 text-white text-xs font-bold rounded-full 
                           border border-green-400 shadow-md">
                ✅ Healthy
              </span>
            )}
            
            <button onClick={onClose} className="text-3xl font-thin leading-none text-gray-400 transition-colors hover:text-white">&times;</button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-grow space-y-4">
            {/* Description */}
            <div>
                <h4 className="mb-1 font-semibold text-blue-400">Description</h4>
                <p className="text-sm leading-relaxed text-gray-300">{long}</p>
            </div>

            {/* Stats */}
            <div className="pt-2">
                <h4 className="mb-2 font-semibold text-blue-400">Attributes</h4>
                <div className="grid grid-cols-2 text-gray-300 gap-x-6 gap-y-3">
                   <StatDisplay label="Health" value={animal.health} />
                   <StatDisplay label="Strength" value={animal.stats.strength} />
                   <StatDisplay label="Speed" value={animal.stats.speed} />
                   <StatDisplay label="Agility" value={animal.stats.agility} />
                   <StatDisplay label="Defense" value={animal.stats.defense} />
                   <StatDisplay label="Perception" value={animal.stats.perception} />
                   <div className="text-xs">
                        <span className="text-gray-400">Age: </span>
                        <span className="font-mono">{animal.age} years</span>
                   </div>
                   <div className="text-xs">
                        <span className="text-gray-400">Type: </span>
                        <span className="font-mono">{baseAnimalName}</span>
                   </div>
                    <div className="text-xs">
                        <span className="text-gray-400">Disposition: </span>
                        <span className="font-mono">{animal.isDomestic ? 'Domestic' : 'Wild'}</span>
                   </div>
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end mt-6">
             <button 
                className="px-6 py-2 text-sm font-semibold text-white transition duration-150 bg-gray-600 rounded-md hover:bg-gray-500"
                onClick={onClose}
            >
                Close
            </button>
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
          currentYear={gameDate.year}
          culturalZone={mapLocationToCulture(currentZone, gameDate.year)}
        />
      )}
    </div>
  );
};

export default AnimalInfoModal;