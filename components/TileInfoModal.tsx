/**
 * components/TileInfoModal.tsx - Modal to display detailed tile information.
 */
import React, { useMemo, useState } from 'react';
import { TileInfoModalProps, Tile, InteriorTile, AnyTile, TileQualities, AnyEntity, NpcEntity, AnimalEntity, VegetationEntity, BiomeType } from '../types';
import { getPotentialWildlife, PotentialWildlife } from '../services/ecologyService';

const getQualityColor = (value: number, reverse: boolean = false): string => {
  if (reverse) {
    if (value >= 0.8) return 'text-red-400'; if (value >= 0.6) return 'text-orange-400'; if (value >= 0.4) return 'text-yellow-300'; if (value >= 0.2) return 'text-green-400'; return 'text-green-500';
  } else {
    if (value >= 0.8) return 'text-green-400'; if (value >= 0.6) return 'text-lime-400'; if (value >= 0.4) return 'text-yellow-300'; if (value >= 0.2) return 'text-orange-400'; return 'text-red-500';
  }
};

const QualityBar: React.FC<{ value: number, reverse?: boolean }> = ({ value, reverse = false }) => {
  const percentage = Math.round(value * 100);
  const colorClass = reverse 
    ? value >= 0.7 ? 'bg-red-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
    : value >= 0.7 ? 'bg-green-500' : value >= 0.4 ? 'bg-yellow-500' : 'bg-red-500';
  return <div className="w-full h-2 bg-gray-600/50 rounded-full overflow-hidden border border-gray-700"><div className={`h-full ${colorClass}`} style={{ width: `${percentage}%` }}/></div>;
};

const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
    <h4 className="font-semibold text-blue-300 mb-2 border-b border-gray-700/50 pb-1 flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <span>{title}</span>
    </h4>
);

const QualityDisplay = React.memo<{ qualities: TileQualities | undefined }>(({ qualities }) => {
  const qualityMetrics = useMemo(() => {
    if (!qualities) return [];
    return [
      { label: '🔥 Flammability', value: qualities.flammability, reverse: true },
      { label: '🌿 Biodiversity', value: qualities.biodiversity, reverse: false },
      { label: '💚 Healthiness', value: qualities.healthiness, reverse: false },
      { label: '✨ Sacrality', value: qualities.sacrality, reverse: false },
      { label: '🛡️ Safety', value: qualities.safety, reverse: false }
    ];
  }, [qualities]);

  if (!qualities) return null;

  return (
    <div className="space-y-2.5">
        <SectionHeader icon="📊" title="Strategic Qualities" />
        {qualityMetrics.map(metric => (
          <div key={metric.label}>
            <div className="flex justify-between items-center text-xs mb-1">
              <span>{metric.label}</span>
              <span className={getQualityColor(metric.value, metric.reverse)}>
                {(metric.value * 100).toFixed(0)}%
              </span>
            </div>
            <QualityBar value={metric.value} reverse={metric.reverse} />
          </div>
        ))}
    </div>
  );
});

const EcologyDisplay: React.FC<{ potentialWildlife: PotentialWildlife[] }> = ({ potentialWildlife }) => {
  const [expanded, setExpanded] = useState(false);

  if (potentialWildlife.length === 0) {
    return (
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <SectionHeader icon="🐾" title="Ecology" />
            <p className="text-xs text-gray-400">No significant wildlife is likely to be found here.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left flex items-center justify-between hover:opacity-80 transition-opacity"
        >
          <SectionHeader icon="🐾" title={`Potential Wildlife (${potentialWildlife.length})`} />
          <span className="text-gray-400 text-sm ml-2">{expanded ? '▼' : '▶'}</span>
        </button>
        {expanded && (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 mt-2">
              {potentialWildlife.map(w => (
                  <div key={w.name} className="text-xs">
                      <span className="text-lg mr-1">{w.emoji}</span>
                      <span className="font-medium text-gray-200">{w.name}</span>
                      <span className={`ml-2 font-bold ${w.likelihood === 'Common' ? 'text-green-400' : w.likelihood === 'Uncommon' ? 'text-yellow-400' : 'text-red-400'}`}>({w.likelihood})</span>
                  </div>
              ))}
          </div>
        )}
    </div>
  );
};

const TileSpecifics: React.FC<{ tile: Tile }> = ({ tile }) => {
    const specifics = [
        { label: 'Crop', value: tile.cropType },
        { label: 'Ruin', value: tile.ruinType },
        { label: 'Palace', value: tile.palaceType },
        { label: 'Holy Site', value: tile.holyPlaceType },
        { label: 'Paddock', value: tile.paddockType }
    ].filter(item => item.value);

    if (specifics.length === 0) return null;

    return (
        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
            <SectionHeader icon="🏛️" title="Tile Specifics" />
            <div className="space-y-1.5 text-xs">
                {specifics.map(item => (
                    <div key={item.label} className="grid grid-cols-[auto_1fr] gap-x-3">
                        <span className="text-gray-500">{item.label}:</span>
                        <span className="font-medium">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const isStandardTile = (t: AnyTile): t is Tile => 'isLand' in t && 'isCoast' in t;
const isInteriorTile = (t: AnyTile): t is InteriorTile => 'material' in t;

const TileInfoModal: React.FC<{ modalProps: TileInfoModalProps, onClose: () => void }> = ({ modalProps, onClose }) => {
  const { data, parentTile } = modalProps;
  const { tile, entity, vegetation, mapContext } = data;

  const potentialWildlife = useMemo(() => {
    if (parentTile && mapContext) {
      return getPotentialWildlife(parentTile, mapContext.climate);
    }
    return [];
  }, [parentTile, mapContext]);

  const qualities = parentTile?.qualities;

  return (
    <div className="modal-overlay" onClick={onClose}>
        <div
          className="ff-panel"
          style={{
            width: '90vw',
            maxWidth: '450px',
            maxHeight: '80vh',
            animation: 'slideInUp 0.2s ease-out'
          }}
          onClick={e => e.stopPropagation()}
        >
            <div className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-500/30">
                  <h3 className="text-xl font-semibold text-blue-400" id="tile-info-title">Tile Information</h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors p-2 rounded-lg -mr-2"
                    style={{ minWidth: '44px', minHeight: '44px', transform: 'none' }}
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3.5 text-sm flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {/* Basic Info */}
                    <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                        <SectionHeader icon="📍" title="Basic Properties" />
                        <div className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
                             <span className="text-gray-500">Coordinates:</span>
                             <span className="font-medium">({tile.x}, {tile.y})</span>
                             {isStandardTile(tile) && <>
                                <span className="text-gray-500">Altitude:</span>
                                <span className="font-medium">{(tile.altitude).toFixed(3)}</span>
                                <span className="text-gray-500">Biome:</span>
                                <span className="font-medium capitalize">{tile.biome.toLowerCase().replace(/_/g, ' ')}</span>
                                <span className="text-gray-500">Type:</span>
                                <span className={`font-medium ${tile.isLand ? 'text-green-400' : 'text-blue-400'}`}>{tile.isLand ? 'Land' : 'Water'}</span>
                                <span className="text-gray-500">Coast:</span>
                                <span className="font-medium">{tile.isCoast ? 'Yes' : 'No'}</span>
                             </>}
                             {isInteriorTile(tile) && <>
                                <span className="text-gray-500">Type:</span>
                                <span className="font-medium capitalize">{tile.type}</span>
                                <span className="text-gray-500">Material:</span>
                                <span className="font-medium capitalize">{tile.material}</span>
                             </>}
                        </div>
                    </div>
                    
                    {/* Standard Tile Specifics */}
                    {isStandardTile(tile) && <TileSpecifics tile={tile} />}

                    {/* Vegetation */}
                    {vegetation && (
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                            <SectionHeader icon="🌳" title="Vegetation" />
                            <div className="text-xs space-y-1">
                                <div className="grid grid-cols-[auto_1fr] gap-x-3">
                                    <span className="text-gray-500">Species:</span>
                                    <span className="font-medium">{vegetation.speciesName}</span>
                                </div>
                                <div className="text-gray-500 italic text-[11px] ml-[4.5rem]">{vegetation.linnaeanName}</div>
                            </div>
                        </div>
                    )}

                    {/* Entity */}
                    {entity && (
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                            <SectionHeader icon="👤" title="Entity on Tile" />
                            <div className="text-xs space-y-1.5">
                                <div className="grid grid-cols-[auto_1fr] gap-x-3">
                                    <span className="text-gray-500">Type:</span>
                                    <span className="font-medium capitalize">{
                                        'subType' in entity ? entity.subType.replace(/_/g, ' ') :
                                        'role' in entity ? (entity as NpcEntity).role.replace(/_/g, ' ') :
                                        'aiState' in entity ? (entity as AnimalEntity).type.replace(/_/g, ' ') :
                                        'Entity'
                                    }</span>
                                </div>
                                {(() => {
                                    const description = ('description' in entity && entity.description) || ('descriptions' in entity && (entity as NpcEntity).descriptions?.short);
                                    return description ? <p className="text-gray-500 italic text-[11px] mt-1">"{description}"</p> : null;
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Qualities */}
                    {isStandardTile(tile) && qualities && (
                        <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
                            <QualityDisplay qualities={qualities} />
                        </div>
                    )}

                    {/* Ecology */}
                    {parentTile && !isInteriorTile(tile) && (
                        <EcologyDisplay potentialWildlife={potentialWildlife} />
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default TileInfoModal;