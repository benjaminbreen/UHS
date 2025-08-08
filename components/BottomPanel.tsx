import React from 'react';
import { Tile, PlayerCharacter, MapData, Season, Item, BiomeType, ActionableTile, TerrainStructure } from '../types';
import { getSafariOptimizedClassName } from '../utils/safariUtils';

interface BottomPanelProps {
    actionableTile: ActionableTile | null;
    contextualMessage: string | null;
    playerCharacter: PlayerCharacter | null;
    mapData: MapData | null;
    playerX: number | null;
    playerY: number | null;
    onEnterCity: (tile: Tile) => void;
    onEnterMarketplace: (tile: Tile) => void;
    onEnterRuin: (tile: Tile) => void;
    onEnterBuilding: (tile: Tile) => void;
    onEnterFarm: (tile: Tile) => void;
    onEnterMine: (structure: TerrainStructure) => void;
    toastMessage: string | null;
}

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode, icon: string }> = ({ onClick, children, icon }) => (
    <button
        onClick={onClick}
        className={getSafariOptimizedClassName("group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg text-lg transform hover:scale-105 transition-all duration-300 ease-out border border-blue-400/30 backdrop-blur-sm flex items-center justify-center gap-3 overflow-hidden")}
        style={{ 
            textShadow: '1px 1px 2px rgba(0,0,0,0.5)', 
            boxShadow: '0 8px 32px rgba(59, 130, 246, 0.3), inset 0 1px 1px rgba(255,255,255,0.2)' 
        }}
    >
        {/* Animated background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-blue-300/20 to-blue-400/0 transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out" />
        
        <span className="text-2xl relative z-10 drop-shadow-lg">{icon}</span>
        <span className="relative z-10 font-semibold tracking-wide">{children}</span>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-xl bg-blue-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
    </button>
);

const LocationDisplay: React.FC<{ title: string; subtitle: string; icon?: string }> = ({ title, subtitle, icon }) => (
    <div className={getSafariOptimizedClassName("flex items-center space-x-3 bg-slate-800/40 rounded-lg px-4 py-3 border border-slate-700/50 backdrop-blur-sm")}>
        {icon && (
            <div className="text-3xl drop-shadow-lg">{icon}</div>
        )}
        <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{title}</p>
            <p className="text-lg text-slate-200 font-semibold capitalize">{subtitle}</p>
        </div>
    </div>
);

const ContextualAlert: React.FC<{ message: string }> = ({ message }) => (
    <div className={getSafariOptimizedClassName("flex items-center justify-center space-x-3 bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-lg px-4 py-3 border border-amber-600/30 backdrop-blur-sm animate-pulse")}>
        <div className="text-2xl text-amber-400 animate-bounce">⚠️</div>
        <p className="text-amber-200 font-semibold text-center">{message}</p>
    </div>
);

const BottomPanel: React.FC<BottomPanelProps> = ({
    actionableTile,
    contextualMessage,
    playerCharacter,
    mapData,
    playerX,
    playerY,
    onEnterCity,
    onEnterMarketplace,
    onEnterRuin,
    onEnterBuilding,
    onEnterFarm,
    onEnterMine,
    toastMessage,
}) => {
    
    const renderActionableContent = () => {
        if (!actionableTile) return null;
        
        const { type, tile, structure } = actionableTile;
        
        let buttonText = 'Explore';
        let buttonIcon = '🧭';
        let onClickAction = () => {};
        let helperText = "Investigate your surroundings.";
        let contextualInfo: React.ReactNode = null;
        let locationIcon = '📍';
        
        const biomeName = tile.biome.replace(/_/g, ' ');

        switch (type) {
            case 'farm':
                buttonText = 'Enter Farm';
                buttonIcon = '🚜';
                locationIcon = '🏡';
                onClickAction = () => onEnterFarm(tile);
                helperText = "Interact with the local farmer, trade produce, and learn about the land.";
                contextualInfo = (
                    <LocationDisplay
                        title="Farmstead"
                        subtitle={`Growing ${tile.cropType || 'crops'}`}
                        icon={locationIcon}
                    />
                );
                break;
            case 'city':
                buttonText = 'Enter City';
                buttonIcon = '🏛️';
                locationIcon = '🏛️';
                onClickAction = () => onEnterCity(tile);
                helperText = "Explore the city center, meet officials, and discover unique opportunities.";
                contextualInfo = (
                    <LocationDisplay
                        title="City Center"
                        subtitle={`Population: ${tile.population?.toLocaleString() || 'Unknown'}`}
                        icon={locationIcon}
                    />
                );
                break;
            case 'marketplace':
                buttonText = 'Enter Marketplace';
                buttonIcon = '💰';
                locationIcon = '🏪';
                onClickAction = () => onEnterMarketplace(tile);
                helperText = "Trade goods, hire mercenaries, and gather rumors from across the region.";
                contextualInfo = (
                    <LocationDisplay
                        title="Marketplace"
                        subtitle="Hub of Commerce"
                        icon={locationIcon}
                    />
                );
                break;
            case 'ruin':
                buttonText = 'Explore Ruins';
                buttonIcon = '🏚️';
                locationIcon = '🏛️';
                onClickAction = () => onEnterRuin(tile);
                helperText = "Investigate the ancient ruins and uncover forgotten treasures.";
                contextualInfo = (
                    <LocationDisplay
                        title="Ancient Ruins"
                        subtitle="Mysterious Remnants"
                        icon={locationIcon}
                    />
                );
                break;
            case 'building':
                buttonText = 'Enter Building';
                buttonIcon = '🚪';
                locationIcon = '🏗️';
                onClickAction = () => onEnterBuilding(tile);
                helperText = `Investigate the ${biomeName.toLowerCase()}.`;
                contextualInfo = (
                    <LocationDisplay
                        title={biomeName}
                        subtitle="Intriguing Structure"
                        icon={locationIcon}
                    />
                );
                break;
            case 'mine':
                buttonText = 'Enter Mine';
                buttonIcon = '⛏️';
                locationIcon = '⛏️';
                onClickAction = () => structure && onEnterMine(structure);
                helperText = "Interact with the mining colony, trade ores, and gather information.";
                contextualInfo = (
                    <LocationDisplay
                        title="Mining Colony"
                        subtitle={structure?.name || "Resource extraction site"}
                        icon={locationIcon}
                    />
                );
                break;
        }

        return (
            <div className="w-full grid grid-cols-[300px_1fr_300px] items-center gap-6 p-6 animate-in slide-in-from-bottom duration-500">
                <div className="flex justify-start">
                    {contextualInfo}
                </div>
                
                <div className="flex items-center justify-center">
                    <ActionButton onClick={onClickAction} icon={buttonIcon}>
                        {buttonText}
                    </ActionButton>
                </div>
                
                <div className="flex justify-end">
                    <div className="text-right text-slate-400 italic text-sm max-w-xs bg-slate-800/20 rounded-lg px-4 py-3 border border-slate-700/30">
                        {helperText}
                    </div>
                </div>
            </div>
        );
    };

    const renderDefaultContent = () => {
        const currentTile = playerCharacter && mapData && playerX !== null && playerY !== null 
            ? mapData.tiles[playerY][playerX] 
            : null;
            
        const locationPhrase = currentTile ? currentTile.biome.replace(/_/g, ' ').toLowerCase() : 'Unknown';
        const getBiomeIcon = (biome: string) => {
            if (biome.includes('ocean')) return '🌊';
            if (biome.includes('forest')) return '🌲';
            if (biome.includes('mountain')) return '⛰️';
            if (biome.includes('desert')) return '🏜️';
            if (biome.includes('grass')) return '🌾';
            if (biome.includes('city') || biome.includes('hamlet')) return '🏘️';
            if (biome.includes('river')) return '🏞️';
            if (biome.includes('beach')) return '🏖️';
            if (biome.includes('farmland')) return '🚜';
            return '📍';
        };

        return (
             <div className="w-full grid grid-cols-[300px_1fr_300px] items-center gap-6 p-6">
                 <div className="flex justify-start">
                     <LocationDisplay
                         title="Current Location"
                         subtitle={locationPhrase}
                         icon={getBiomeIcon(locationPhrase)}
                     />
                 </div>
                 
                 <div className="flex items-center justify-center">
                    {/* Central area - could show compass or other navigation aids */}
                    <div className="text-slate-600 text-center">
                        <div className="text-4xl mb-2">🧭</div>
                        <p className="text-sm font-medium">Use arrow keys to explore</p>
                    </div>
                 </div>
                 
                 <div className="flex justify-end">
                    {contextualMessage ? (
                        <ContextualAlert message={contextualMessage} />
                    ) : (
                        <div className="text-right text-slate-500 text-sm max-w-xs bg-slate-800/10 rounded-lg px-4 py-3 border border-slate-700/20">
                            <p className="font-medium">Explore the world</p>
                            <p className="text-xs mt-1">Discover new locations and opportunities</p>
                        </div>
                    )}
                 </div>
             </div>
        );
    };

    return (
        <div className={getSafariOptimizedClassName("relative bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md shadow-2xl transition-all duration-500 ease-in-out border-t border-slate-700/50 overflow-hidden")}>
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
            </div>
            
            {/* Main content */}
            <div className="relative z-10">
                {actionableTile ? renderActionableContent() : renderDefaultContent()}
            </div>
            
            {/* Toast message */}
            {toastMessage && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2">
                    <div className={getSafariOptimizedClassName("px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xl border border-emerald-400/30 backdrop-blur-sm animate-in slide-in-from-bottom duration-300")}>
                        <div className="flex items-center space-x-2">
                            <span>✓</span>
                            <span>{toastMessage}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BottomPanel;