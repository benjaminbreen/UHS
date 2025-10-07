/**
 * components/TileInfoModal.tsx - Modal to display detailed tile information.
 */
import React, { useMemo, useState, useEffect } from 'react';
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
  return (
    <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden border border-slate-600/50 mx-auto">
      <div
        className={`h-full ${colorClass} transition-all duration-300 ease-out`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

const SectionHeader: React.FC<{ icon: string; title: string }> = ({ icon, title }) => (
    <h4 className="font-medium text-slate-100 mb-2 flex items-center gap-2">
      <span className="text-xl">{icon}</span>
      <span className="text-base">{title}</span>
    </h4>
);

const QualityDisplay = React.memo<{ qualities: TileQualities | undefined }>(({ qualities }) => {
  const qualityMetrics = useMemo(() => {
    if (!qualities) return [];
    return [
      { label: 'Flammability', icon: '🔥', value: qualities.flammability, reverse: true },
      { label: 'Biodiversity', icon: '🌿', value: qualities.biodiversity, reverse: false },
      { label: 'Healthiness', icon: '💚', value: qualities.healthiness, reverse: false },
      { label: 'Sacrality', icon: '✨', value: qualities.sacrality, reverse: false },
      { label: 'Safety', icon: '🛡️', value: qualities.safety, reverse: false }
    ];
  }, [qualities]);

  if (!qualities) return null;

  return (
    <div className="space-y-2">
        <SectionHeader icon="" title="Strategic Qualities" />
        <div className="grid grid-cols-5 gap-2">
          {qualityMetrics.map(metric => (
            <div key={metric.label} className="bg-slate-700/30 p-2 rounded-lg border border-slate-600/40 flex flex-col items-center">
              <span className="text-2xl mb-1">{metric.icon}</span>
              <span className="text-xs text-slate-400 text-center mb-1">{metric.label}</span>
              <div className={`text-3xl font-semibold ${getQualityColor(metric.value, metric.reverse)} mb-1 leading-none`}>
                {(metric.value * 100).toFixed(0)}%
              </div>
              <QualityBar value={metric.value} reverse={metric.reverse} />
            </div>
          ))}
        </div>
    </div>
  );
});

const EcologyDisplay: React.FC<{ potentialWildlife: PotentialWildlife[] }> = ({ potentialWildlife }) => {
  const [expanded, setExpanded] = useState(false);

  if (potentialWildlife.length === 0) {
    return (
        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/40">
            <SectionHeader icon="" title="Ecology" />
            <p className="text-sm text-slate-400">No significant wildlife is likely to be found here.</p>
        </div>
    );
  }

  return (
    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/40">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left flex items-center justify-between hover:bg-slate-700/30 rounded-md p-1.5 -m-1.5 transition-all duration-200"
        >
          <div className="flex items-center gap-2">
            <span className="text-xl"></span>
            <span className="text-base font-medium text-slate-100">Potential Wildlife</span>
            <span className="text-xs bg-slate-600/50 px-2 py-0.5 rounded text-slate-300">
              {potentialWildlife.length}
            </span>
          </div>
          <div className={`transform transition-transform duration-300 text-slate-400 ${expanded ? 'rotate-180' : ''}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 10.5l-4-4h8l-4 4z"/>
            </svg>
          </div>
        </button>
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
              {potentialWildlife.map(w => (
                  <div key={w.name} className="flex items-center gap-2 bg-slate-700/30 p-2 rounded-md border border-slate-600/30">
                      <span className="text-xl">{w.emoji}</span>
                      <span className="font-medium text-slate-50 text-sm flex-1">{w.name}</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${w.likelihood === 'Common' ? 'bg-green-500/20 text-green-400' : w.likelihood === 'Uncommon' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {w.likelihood}
                      </span>
                  </div>
              ))}
          </div>
        </div>
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
        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/40">
            <SectionHeader icon="🏛️" title="Tile Specifics" />
            <div className="flex flex-wrap gap-2">
                {specifics.map(item => (
                    <div key={item.label} className="flex items-center gap-2 bg-slate-700/30 px-3 py-2 rounded-md">
                        <span className="text-xs text-slate-400">{item.label}</span>
                        <span className="font-medium text-slate-50 text-sm">{item.value}</span>
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

  // Keyboard shortcuts (ESC to close)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [onClose]);

  // Determine tile icon based on type
  const getTileIcon = () => {
    if (isStandardTile(tile)) {
      if (tile.isLand) return '🗺️';
      return '🌊';
    }
    return '🏠';
  };

  const getBiomeDisplayName = () => {
    if (isStandardTile(tile)) {
      return tile.biome.toLowerCase().replace(/_/g, ' ');
    }
    return 'Interior';
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tile-info-title"
    >
        <div
          className="bg-gradient-to-br from-slate-800 via-slate-800 to-slate-900 border border-slate-600/50 rounded-2xl shadow-[0_0_30px_rgba(100,116,139,0.4)] text-slate-200 w-full max-w-4xl animate-popIn"
          style={{ maxHeight: '85vh' }}
          onClick={e => e.stopPropagation()}
        >
            <div className="p-4 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-600/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center text-3xl">
                      {getTileIcon()}
                    </div>
                    <div>
                      <h3 className="text-2xl font-medium text-slate-50 leading-none" id="tile-info-title">
                        Tile Information
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 capitalize">{getBiomeDisplayName()}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-100 hover:bg-slate-700/50 transition-all duration-200 p-1.5 rounded-lg"
                    aria-label="Close modal"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-3 flex-grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
                    {/* Basic Info */}
                    <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/40">
                        <SectionHeader icon="📍" title="Basic Properties" />
                        <div className="grid grid-cols-5 gap-2">
                             <div className="bg-slate-700/30 p-2 rounded-md">
                               <div className="text-xs text-slate-400 mb-1">Coordinates</div>
                               <div className="font-medium text-slate-50 text-base leading-tight">({tile.x}, {tile.y})</div>
                             </div>
                             {isStandardTile(tile) && <>
                                <div className="bg-slate-700/30 p-2 rounded-md">
                                  <div className="text-xs text-slate-400 mb-1">Altitude</div>
                                  <div className="font-medium text-slate-50 text-base leading-tight">{(tile.altitude).toFixed(3)}</div>
                                </div>
                                <div className="bg-slate-700/30 p-2 rounded-md col-span-2">
                                  <div className="text-xs text-slate-400 mb-1">Biome</div>
                                  <div className="font-medium text-slate-50 text-base leading-tight capitalize">{tile.biome.toLowerCase().replace(/_/g, ' ')}</div>
                                </div>
                                <div className="bg-slate-700/30 p-2 rounded-md">
                                  <div className="text-xs text-slate-400 mb-1">Type</div>
                                  <div className={`font-medium text-base leading-tight ${tile.isLand ? 'text-green-400' : 'text-blue-400'}`}>
                                    {tile.isLand ? 'Land' : 'Water'}
                                  </div>
                                </div>
                             </>}

                             {isInteriorTile(tile) && <>
                                <div className="bg-slate-700/30 p-2 rounded-md">
                                  <div className="text-xs text-slate-400 mb-1">Type</div>
                                  <div className="font-medium text-slate-50 text-base leading-tight capitalize">{tile.type}</div>
                                </div>
                                <div className="bg-slate-700/30 p-2 rounded-md">
                                  <div className="text-xs text-slate-400 mb-1">Material</div>
                                  <div className="font-medium text-slate-50 text-base leading-tight capitalize">{tile.material}</div>
                                </div>
                             </>}
                        </div>
                    </div>
                    
                    {/* Standard Tile Specifics */}
                    {isStandardTile(tile) && <TileSpecifics tile={tile} />}

                    {/* Vegetation */}
                    {vegetation && (
                        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/40">
                            <SectionHeader icon="🌳" title="Vegetation" />
                            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                                <div className="text-base font-medium text-slate-50 mb-1">
                                    {vegetation.speciesName}
                                </div>
                                <div className="text-sm text-slate-400 italic">{vegetation.linnaeanName}</div>
                            </div>
                        </div>
                    )}

                    {/* Entity */}
                    {entity && (
                        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/40">
                            <SectionHeader icon="👤" title="Entity on Tile" />
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                                <div className="text-base font-medium text-slate-50 mb-1 capitalize">{
                                    'subType' in entity ? entity.subType.replace(/_/g, ' ') :
                                    'role' in entity ? (entity as NpcEntity).role.replace(/_/g, ' ') :
                                    'aiState' in entity ? (entity as AnimalEntity).type.replace(/_/g, ' ') :
                                    'Entity'
                                }</div>
                                {(() => {
                                    const description = ('description' in entity && entity.description) || ('descriptions' in entity && (entity as NpcEntity).descriptions?.short);
                                    return description ? <p className="text-xs text-slate-400 mt-1">"{description}"</p> : null;
                                })()}
                            </div>
                        </div>
                    )}

                    {/* Qualities */}
                    {isStandardTile(tile) && qualities && (
                        <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-600/40">
                            <QualityDisplay qualities={qualities} />
                        </div>
                    )}

                    {/* Ecology */}
                    {parentTile && !isInteriorTile(tile) && (
                        <EcologyDisplay potentialWildlife={potentialWildlife} />
                    )}
                </div>

                {/* Footer with Close Button */}
                <div className="mt-3 pt-3 border-t border-slate-600/50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TileInfoModal;