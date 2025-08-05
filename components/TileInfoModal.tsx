/**
 * components/TileInfoModal.tsx - Modal to display detailed tile information.
 */
import React, { useMemo } from 'react';
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

const QualityDisplay: React.FC<{ qualities: TileQualities | undefined }> = ({ qualities }) => {
  if (!qualities) return null;
  return (
    <div className="space-y-3">
        <SectionHeader icon="📊" title="Strategic Qualities" />
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span>🔥 Flammability</span><span className={getQualityColor(qualities.flammability, true)}>{(qualities.flammability * 100).toFixed(0)}%</span>
            </div>
            <QualityBar value={qualities.flammability} reverse />
        </div>
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span>🌿 Biodiversity</span><span className={getQualityColor(qualities.biodiversity)}>{(qualities.biodiversity * 100).toFixed(0)}%</span>
            </div>
            <QualityBar value={qualities.biodiversity} />
        </div>
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span>💚 Healthiness</span><span className={getQualityColor(qualities.healthiness)}>{(qualities.healthiness * 100).toFixed(0)}%</span>
            </div>
            <QualityBar value={qualities.healthiness} />
        </div>
        <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span>✨ Sacrality</span><span className={getQualityColor(qualities.sacrality)}>{(qualities.sacrality * 100).toFixed(0)}%</span>
            </div>
            <QualityBar value={qualities.sacrality} />
        </div>
         <div>
            <div className="flex justify-between items-center text-xs mb-1">
                <span>🛡️ Safety</span><span className={getQualityColor(qualities.safety)}>{(qualities.safety * 100).toFixed(0)}%</span>
            </div>
            <QualityBar value={qualities.safety} />
        </div>
    </div>
  );
};

const EcologyDisplay: React.FC<{ potentialWildlife: PotentialWildlife[] }> = ({ potentialWildlife }) => {
  if (potentialWildlife.length === 0) {
    return (
        <div>
            <SectionHeader icon="🐾" title="Ecology" />
            <p className="text-xs text-gray-400">No significant wildlife is likely to be found here.</p>
        </div>
    );
  }
  return (
    <div>
        <SectionHeader icon="🐾" title="Potential Wildlife" />
        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
            {potentialWildlife.map(w => (
                <div key={w.name} className="text-xs">
                    <span className="text-lg mr-1">{w.emoji}</span>
                    <span className="font-medium text-gray-200">{w.name}</span>
                    <span className={`ml-2 font-bold ${w.likelihood === 'Common' ? 'text-green-400' : w.likelihood === 'Uncommon' ? 'text-yellow-400' : 'text-red-400'}`}>({w.likelihood})</span>
                </div>
            ))}
        </div>
    </div>
  )
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
        <div>
            <SectionHeader icon="🏛️" title="Tile Specifics" />
            <div className="space-y-1 text-sm">
                {specifics.map(item => (
                    <div key={item.label}>
                        <strong className="text-gray-400">{item.label}:</strong> {item.value}
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
        <div className="ff-panel" style={{ width: '90vw', maxWidth: '450px', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
            <div className="p-4 sm:p-5 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-blue-500/30">
                  <h3 className="text-xl font-semibold text-blue-400" id="tile-info-title">Tile Information</h3>
                  <button onClick={onClose} className="ff-action-button" style={{padding: '0.2rem 0.5rem', fontSize: '1rem'}} aria-label="Close modal">&times;</button>
                </div>

                <div className="space-y-4 text-sm flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
                    {/* Basic Info */}
                    <div>
                        <SectionHeader icon="📍" title="Basic Properties" />
                        <div className="text-xs grid grid-cols-2 gap-x-4 gap-y-1">
                             <div><strong className="text-gray-400">Coordinates:</strong> ({tile.x}, {tile.y})</div>
                             {isStandardTile(tile) && <>
                                <div><strong className="text-gray-400">Altitude:</strong> {(tile.altitude).toFixed(3)}</div>
                                <div><strong className="text-gray-400">Biome:</strong> <span className="capitalize">{tile.biome.toLowerCase().replace(/_/g, ' ')}</span></div>
                                <div><strong className="text-gray-400">Type:</strong> <span className={tile.isLand ? 'text-green-400' : 'text-blue-400'}>{tile.isLand ? 'Land' : 'Water'}</span></div>
                                <div><strong className="text-gray-400">Coast:</strong> <span>{tile.isCoast ? 'Yes' : 'No'}</span></div>
                             </>}
                             {isInteriorTile(tile) && <>
                                <div><strong className="text-gray-400">Type:</strong> <span className="capitalize">{tile.type}</span></div>
                                <div><strong className="text-gray-400">Material:</strong> <span className="capitalize">{tile.material}</span></div>
                             </>}
                        </div>
                    </div>
                    
                    {/* Standard Tile Specifics */}
                    {isStandardTile(tile) && <TileSpecifics tile={tile} />}
                    
                    {/* Vegetation */}
                    {vegetation && (
                        <div>
                            <SectionHeader icon="🌳" title="Vegetation" />
                            <div className="text-xs">
                                <div><strong className="text-gray-400">Species:</strong> {vegetation.speciesName}</div>
                                <div className="text-gray-500 italic">{vegetation.linnaeanName}</div>
                            </div>
                        </div>
                    )}
                    
                    {/* Entity */}
                    {entity && (
                        <div>
                            <SectionHeader icon="👤" title="Entity on Tile" />
                            <div className="text-xs">
                                <div><strong className="text-gray-400">Type:</strong> <span className="capitalize">{
                                    'subType' in entity ? entity.subType.replace(/_/g, ' ') :
                                    'role' in entity ? (entity as NpcEntity).role.replace(/_/g, ' ') :
                                    'aiState' in entity ? (entity as AnimalEntity).type.replace(/_/g, ' ') :
                                    'Entity'
                                }</span></div>
                                {(() => {
                                    const description = ('description' in entity && entity.description) || ('descriptions' in entity && (entity as NpcEntity).descriptions?.short);
                                    return description ? <p className="text-gray-500 italic mt-1">"{description}"</p> : null;
                                })()}
                            </div>
                        </div>
                    )}
                    
                    {/* Qualities and Ecology */}
                    {isStandardTile(tile) && qualities && (
                        <div className="pt-2">
                            <QualityDisplay qualities={qualities} />
                        </div>
                    )}
                    
                    {parentTile && !isInteriorTile(tile) && (
                        <div className="pt-2">
                            <EcologyDisplay potentialWildlife={potentialWildlife} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default TileInfoModal;