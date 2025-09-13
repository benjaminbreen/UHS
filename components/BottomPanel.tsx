import React, { useState, useEffect } from 'react';
import { Tile, PlayerCharacter, MapData, Season, Item, BiomeType, ActionableTile, TerrainStructure, TimeOfDay } from '../types';
import { getSafariOptimizedClassName, getOptimizedButtonClassName } from '../utils/safariUtils';
import { weatherService } from '../services/weatherService';
import { METALS } from '../constants/gameData/metals';
import { gameSounds } from '../services/gameSoundsService';

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
    onEnterFishingHut: (tile: Tile) => void;
    onEnterMine: (structure: TerrainStructure) => void;
    toastMessage: string | null;
    season?: Season;
    timeOfDay?: TimeOfDay;
    dayOfYear?: number;
    onToggleAmbientText?: () => void;
    showAmbientText?: boolean;
    inRuinRoguelike?: boolean;
    isRuinModalOpen?: boolean;
    onExitRuin?: () => void;
    isMarketplaceModalOpen?: boolean;
    onExitMarketplace?: () => void;
    isSpecialMap?: boolean;
    onExitSpecialMap?: () => void;
}

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode, icon: string, variant?: 'blue' | 'red' }> = ({ onClick, children, icon, variant = 'blue' }) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const isRed = variant === 'red';
    const baseClass = isRed 
        ? `group relative ${isMobile ? 'px-8 py-4' : 'px-6 py-3'} bg-gradient-to-r from-red-600 to-red-700 active:from-red-500 active:to-red-600 text-white font-bold rounded-xl shadow-lg ${isMobile ? 'text-lg' : 'text-base'} transform active:scale-95 transition-all duration-300 ease-out border border-red-400/30 backdrop-blur-sm flex items-center justify-center gap-2 overflow-hidden`
        : `group relative ${isMobile ? 'px-8 py-4' : 'px-6 py-3'} bg-gradient-to-r from-blue-600 to-blue-700 active:from-blue-500 active:to-blue-600 text-white font-bold rounded-xl shadow-lg ${isMobile ? 'text-lg' : 'text-base'} transform active:scale-95 transition-all duration-300 ease-out border border-blue-400/30 backdrop-blur-sm flex items-center justify-center gap-2 overflow-hidden`;
    const boxShadowColor = isRed ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)';
    const glowColor = isRed ? 'from-red-400/0 via-red-300/20 to-red-400/0' : 'from-blue-400/0 via-blue-300/20 to-blue-400/0';
    const glowBg = isRed ? 'bg-red-400/20' : 'bg-blue-400/20';

    return (
        <button
            onClick={onClick}
            className={getOptimizedButtonClassName(getSafariOptimizedClassName(baseClass))}
            style={{ 
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)', 
                boxShadow: `0 8px 32px ${boxShadowColor}, inset 0 1px 1px rgba(255,255,255,0.2)`
            }}
        >
            {/* Animated background effect */}
            <div className={`absolute inset-0 bg-gradient-to-r ${glowColor} transform -skew-x-12 translate-x-[-100%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out`} />
            
            <span className="text-xl relative z-10 drop-shadow-lg">{icon}</span>
            <span className="relative z-10 font-semibold">{children}</span>
            
            {/* Glow effect */}
            <div className={`absolute inset-0 rounded-xl ${glowBg} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm`} />
        </button>
    );
};

const LocationDisplay: React.FC<{ title: string; subtitle: string; icon?: string }> = ({ title, subtitle, icon }) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    return (
        <div className={getSafariOptimizedClassName(`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} bg-slate-800/40 rounded-lg ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'} border border-slate-700/50 backdrop-blur-sm`)}>
            {icon && (
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} drop-shadow-lg`}>{icon}</div>
            )}
            <div>
                <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-slate-400 font-medium uppercase tracking-wide`}>{title}</p>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} text-slate-200 font-semibold capitalize`}>{subtitle}</p>
            </div>
        </div>
    );
};

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
    onEnterFishingHut,
    onEnterMine,
    toastMessage,
    season = 'summer',
    timeOfDay = 'Day',
    dayOfYear = 180,
    onToggleAmbientText,
    showAmbientText = false,
    inRuinRoguelike = false,
    isRuinModalOpen = false,
    onExitRuin,
    isMarketplaceModalOpen = false,
    onExitMarketplace,
    isSpecialMap = false,
    onExitSpecialMap,
}) => {
    const [weatherDisplay, setWeatherDisplay] = useState<string>('');
    const [weatherState, setWeatherState] = useState<{ state: string, emoji: string }>({ state: '', emoji: '' });
    const [useFahrenheit, setUseFahrenheit] = useState<boolean>(false);
    
    // Get weather state with emoji
    const getWeatherStateAndEmoji = (weather: any): { state: string, emoji: string } => {
        if (weather.special === 'rainbow') return { state: 'Rainbow', emoji: '🌈' };
        if (weather.special === 'fog') return { state: 'Foggy', emoji: '🌫️' };
        if (weather.special === 'mist') return { state: 'Misty', emoji: '🌁' };
        if (weather.special === 'frost') return { state: 'Frosty', emoji: '❄️' };
        if (weather.special === 'heatwave') return { state: 'Heat Wave', emoji: '🔥' };
        
        if (weather.precipitation === 'snow') return { state: 'Snowing', emoji: '🌨️' };
        if (weather.precipitation === 'rain' && weather.intensity > 0.7) return { state: 'Heavy Rain', emoji: '⛈️' };
        if (weather.precipitation === 'rain') return { state: 'Rainy', emoji: '🌧️' };
        if (weather.precipitation === 'drizzle') return { state: 'Drizzle', emoji: '🌦️' };
        if (weather.precipitation === 'sleet') return { state: 'Sleet', emoji: '🌨️' };
        
        if (weather.cloudCover > 0.7) return { state: 'Overcast', emoji: '☁️' };
        if (weather.cloudCover > 0.3) return { state: 'Partly Cloudy', emoji: '⛅' };
        if (weather.temperature < 0) return { state: 'Freezing', emoji: '🥶' };
        if (weather.temperature > 35) return { state: 'Very Hot', emoji: '🥵' };
        if (weather.humidity > 80) return { state: 'Humid', emoji: '💧' };
        
        return { state: 'Clear Skies', emoji: '☀️' };
    };
    
    // Update weather display - stable per map area, updates hourly
    useEffect(() => {
        if (mapData) {
            // Use map center for consistent weather across the map area
            const mapCenterX = mapData.tiles[0] ? Math.floor(mapData.tiles[0].length / 2) : 0;
            const mapCenterY = Math.floor(mapData.tiles.length / 2);
            const centerTile = mapData.tiles[mapCenterY] && mapData.tiles[mapCenterY][mapCenterX] 
                ? mapData.tiles[mapCenterY][mapCenterX] 
                : null;
            
            const weather = centerTile ? weatherService.getWeather(
                mapData.climate,
                centerTile.biome,
                season,
                timeOfDay,
                centerTile.altitude || 0.5,
                dayOfYear,
                { x: mapCenterX, y: mapCenterY }
            ) : null;
            
            if (weather) {
                // Format temperature and wind speed based on preference
                const temp = useFahrenheit ? 
                    Math.round(weather.temperature * 9/5 + 32) + '°F' : 
                    Math.round(weather.temperature) + '°C';
                
                // Convert wind speed if using Fahrenheit (imperial units)
                const windSpeed = useFahrenheit ?
                    Math.round(weather.windSpeed * 0.621371) : // Convert km/h to mph
                    Math.round(weather.windSpeed);
                const windUnit = useFahrenheit ? 'mph' : 'km/h';
                
                const windDir = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(weather.windDirection / 45)];
                
                setWeatherDisplay(`${temp} • ${windDir} wind ${windSpeed} ${windUnit}`);
                setWeatherState(getWeatherStateAndEmoji(weather));
            }
        }
    }, [mapData, season, timeOfDay, dayOfYear, useFahrenheit]); // Update hourly, not on movement
    
    const renderActionableContent = () => {
        // Special map exit takes priority over everything else
        if (isSpecialMap) {
            return (
                <div className="w-full h-full flex items-center justify-between px-8 bg-gradient-to-r from-slate-800/90 via-slate-900/90 to-slate-800/90">
                    <LocationDisplay
                        title="Special Map"
                        subtitle="Interior Space"
                        icon="🏛️"
                    />
                    
                    <div className="flex items-center gap-6">
                        <ActionButton onClick={onExitSpecialMap || (() => {})} icon="🚪" variant="red">
                            Exit to Map
                        </ActionButton>
                    </div>
                    
                    <div className="hidden sm:flex justify-end">
                        <div className="text-right text-slate-400 italic text-xs sm:text-sm max-w-xs bg-slate-800/20 rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-slate-700/30">
                            Return to the main map outside this building.
                        </div>
                    </div>
                </div>
            );
        }
        
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
                if (isMarketplaceModalOpen) {
                    buttonText = 'Exit Marketplace';
                    buttonIcon = '🚪';
                    locationIcon = '🏪';
                    onClickAction = onExitMarketplace || (() => {});
                    helperText = "Return to the world map from the marketplace.";
                } else {
                    buttonText = 'Enter Marketplace';
                    buttonIcon = '💰';
                    locationIcon = '🏪';
                    onClickAction = () => {
                        gameSounds.playButtonClickSound();
                        onEnterMarketplace(tile);
                    };
                    helperText = "Trade goods, hire mercenaries, and gather rumors from across the region.";
                }
                contextualInfo = (
                    <LocationDisplay
                        title="Marketplace"
                        subtitle="Hub of Commerce"
                        icon={locationIcon}
                    />
                );
                break;
            case 'ruin':
                if (inRuinRoguelike || isRuinModalOpen) {
                    buttonText = 'Exit Ruins';
                    buttonIcon = '🚪';
                    locationIcon = '🏛️';
                    onClickAction = onExitRuin || (() => {});
                    helperText = "Return to the surface from the underground exploration.";
                } else {
                    buttonText = 'Explore Ruins';
                    buttonIcon = '🏚️';
                    locationIcon = '🏛️';
                    onClickAction = () => {
                        gameSounds.playMysteriousRuinsSound();
                        onEnterRuin(tile);
                    };
                    helperText = "Investigate the ancient ruins and uncover forgotten treasures.";
                }
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
            case 'fishing_hut':
                buttonText = 'Enter Fishing Hut';
                buttonIcon = '🎣';
                locationIcon = '🏠';
                onClickAction = () => {
                    console.log('[BottomPanel] Fishing hut button clicked!', tile);
                    gameSounds.playButtonClickSound();
                    onEnterFishingHut(tile);
                };
                helperText = "Visit the fishing hut to catch fish, trade supplies, and sell your catch.";
                contextualInfo = (
                    <LocationDisplay
                        title="Fishing Hut"
                        subtitle={structure?.name || "Fishing grounds"}
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

        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
        
        return (
            <div className={`w-full flex flex-col ${isMobile ? 'gap-3 p-3' : 'sm:grid sm:grid-cols-[200px_1fr_200px] lg:grid-cols-[300px_1fr_300px] items-center gap-2 sm:gap-6 p-2 sm:p-4 lg:p-5'} animate-in slide-in-from-bottom duration-500`}>
                <div className={`flex ${isMobile ? 'justify-center' : 'justify-center sm:justify-start'} w-full sm:w-auto`}>
                    {contextualInfo}
                </div>
                
                <div className="flex items-center justify-center">
                    <ActionButton 
                        onClick={onClickAction} 
                        icon={buttonIcon}
                        variant={((inRuinRoguelike || isRuinModalOpen) && type === 'ruin') || (isMarketplaceModalOpen && type === 'marketplace') ? 'red' : 'blue'}
                    >
                        {buttonText}
                    </ActionButton>
                </div>
                
                {!isMobile && (
                    <div className="hidden sm:flex justify-end">
                        <div className="text-right text-slate-400 italic text-xs sm:text-sm max-w-xs bg-slate-800/20 rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-slate-700/30">
                            {helperText}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDefaultContent = () => {
        const currentTile = playerCharacter && mapData && playerX !== null && playerY !== null 
            && playerY >= 0 && playerY < mapData.tiles.length
            && playerX >= 0 && playerX < (mapData.tiles[playerY]?.length || 0)
            ? mapData.tiles[playerY][playerX] 
            : null;
            
        const locationPhrase = currentTile && currentTile.biome ? currentTile.biome.replace(/_/g, ' ').toLowerCase() : 'Unknown';
        
        // Check for mineral deposits on current tile
        const mineralDeposit = currentTile?.mineralDeposit;
        const mineral = mineralDeposit ? METALS[mineralDeposit.metalId] : null;
        
        // Get mineral color from the metal definition
        const getMineralTextColor = () => {
            if (!mineral?.visual?.color) return 'rgb(148, 163, 184)'; // Default slate-400
            
            // Extract RGB values from the rgba string and boost saturation for text
            const colorMatch = mineral.visual.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (colorMatch) {
                const [_, r, g, b] = colorMatch;
                // Boost brightness for better text readability
                const boost = 1.3;
                return `rgb(${Math.min(255, parseInt(r) * boost)}, ${Math.min(255, parseInt(g) * boost)}, ${Math.min(255, parseInt(b) * boost)})`;
            }
            return 'rgb(148, 163, 184)';
        };
        
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
             <div className="w-full grid grid-cols-[300px_1fr_300px] items-center gap-4 p-3 mb-1">
                 <div className="flex justify-start">
                     <button
                         onClick={onToggleAmbientText}
                         className="transition-transform hover:scale-105"
                         title="Click to toggle ambient text"
                     >
                         <LocationDisplay
                             title="Current Location"
                             subtitle={locationPhrase}
                             icon={getBiomeIcon(locationPhrase)}
                         />
                     </button>
                 </div>
                 
                 <div className="flex items-center justify-center">
                    {showAmbientText ? (
                        <div className="text-slate-400 text-center max-w-md animate-in fade-in duration-300">
                            <p className="text-sm italic">
                                {/* This is where ambient text would appear based on current tile */}
                                The {locationPhrase} stretches before you, alive with possibilities...
                            </p>
                        </div>
                    ) : mineral ? (
                        <div className="text-center animate-in fade-in duration-300">
                            <p 
                                className="text-sm font-bold animate-pulse"
                                style={{ color: getMineralTextColor() }}
                            >
                                {mineral.name} deposits in the area!
                            </p>
                            <p className="text-xs mt-1" style={{ color: getMineralTextColor(), opacity: 0.8 }}>
                                Try using the 'Dig' action button (D key)
                            </p>
                        </div>
                    ) : locationPhrase.includes('salt flats') ? (
                        <div className="text-center animate-in fade-in duration-300">
                            <p className="text-sm font-bold" style={{ color: 'rgb(220, 220, 255)' }}>
                                Salt crystals glisten on the ground
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'rgb(200, 200, 230)', opacity: 0.9 }}>
                                Try digging here for salt (D key)
                            </p>
                        </div>
                    ) : (locationPhrase.includes('dense forest') || locationPhrase.includes('jungle')) ? (
                        <div className="text-center animate-in fade-in duration-300">
                            <p className="text-sm font-bold" style={{ color: 'rgb(100, 200, 100)' }}>
                                Rich biodiversity surrounds you
                            </p>
                            <p className="text-xs mt-1" style={{ color: 'rgb(80, 180, 80)', opacity: 0.9 }}>
                                Try foraging for rare items (F key)
                            </p>
                        </div>
                    ) : (
                        <div className="text-slate-600 text-center">
                            <p className="text-sm font-medium">Use arrow keys to explore</p>
                        </div>
                    )}
                 </div>
                 
                 <div className="flex justify-end">
                    {contextualMessage ? (
                        <ContextualAlert message={contextualMessage} />
                    ) : (
                        <button
                            onClick={() => setUseFahrenheit(!useFahrenheit)}
                            className="text-right text-slate-300 text-sm max-w-xs bg-slate-800/30 rounded-lg px-4 py-2 border border-slate-700/30 hover:bg-slate-800/40 transition-colors cursor-pointer"
                            title="Click to toggle between metric/imperial units"
                        >
                            <div className="font-semibold">
                                {weatherDisplay || 'Loading weather...'}
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-0 ">
                                <span className="text-lg">{weatherState.emoji}</span>
                                <span className="font-bold text-slate-200">{weatherState.state}</span>
                            </div>
                        </button>
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
                    <div className={getSafariOptimizedClassName("px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-lg shadow-xl border border-emerald-400/30 backdrop-blur-sm animate-in slide-in-from-bottom duration-300")}>
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