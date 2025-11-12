import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tile, PlayerCharacter, MapData, Season, Item, BiomeType, ActionableTile, TerrainStructure, TimeOfDay } from '../types';
import { getSafariOptimizedClassName, getOptimizedButtonClassName } from '../utils/safariUtils';
import { weatherService } from '../services/weatherService';
import { METALS } from '../constants/gameData/metals';
import { gameSounds } from '../services/gameSoundsService';
import { getBackgroundPaths, loadBackgroundImage } from '../services/backgroundSelectionService';
import { getBiomeIcon } from '../utils/biomeUtils';

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
    onEnterGovernmentDistrict?: (tile: Tile) => void;
    onEnterHolySite?: (tile: Tile) => void;
    onEnterPalace?: (tile: Tile) => void;
    onEnterRailroadStation?: (tile: Tile) => void;
    onEnterHarborDistrict?: (tile: Tile) => void;
    toastMessage: string | null;
    toastDuration?: number;
    season?: Season;
    timeOfDay?: TimeOfDay;
    dayOfYear?: number;
    onToggleAmbientText?: () => void;
    showAmbientText?: boolean;
    inRuinRoguelike?: boolean;
    isRuinModalOpen?: boolean;
    onExitRuin?: () => void;
    inMiningRoguelike?: boolean;
    onExitMine?: () => void;
    isMarketplaceModalOpen?: boolean;
    onExitMarketplace?: () => void;
    isGovernmentDistrictModalOpen?: boolean;
    onExitGovernmentDistrict?: () => void;
    isSpecialMap?: boolean;
    onExitSpecialMap?: () => void;
    isOnContainer?: boolean;
    onOpenContainer?: () => void;
    isInteriorMode?: boolean;
    onExitInterior?: () => void;
    currentBiome?: string;
    climate?: any;
    culturalZone?: string;
    weather?: any;
    gameTime?: { hours: number; minutes: number };
}

const ActionButton: React.FC<{ onClick: () => void; children: React.ReactNode, icon: string, variant?: 'blue' | 'red' }> = React.memo(({ onClick, children, icon, variant = 'blue' }) => {
    const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth <= 768, []);
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
            onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
                e.currentTarget.style.transform = '';
            }}
            className={getOptimizedButtonClassName(getSafariOptimizedClassName(baseClass))}
            style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                boxShadow: `0 8px 32px ${boxShadowColor}, inset 0 1px 1px rgba(255,255,255,0.2)`,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation',
                minHeight: isMobile ? '60px' : 'auto'
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
});

const LocationDisplay: React.FC<{ title: string; subtitle: string; icon?: string }> = React.memo(({ title, subtitle, icon }) => {
    const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth <= 768, []);
    return (
        <div className={getSafariOptimizedClassName(`flex items-center ${isMobile ? 'space-x-2' : 'space-x-3'} surface-muted border backdrop-blur-sm ${isMobile ? 'px-3 py-2 min-w-[180px]' : 'px-4 py-3 min-w-[220px]'}`)}>
            {icon && (
                <div className={`${isMobile ? 'text-xl' : 'text-2xl'} drop-shadow-lg`}>{icon}</div>
            )}
            <div>
                <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-text-secondary font-medium uppercase tracking-wide`}>{title}</p>
                <p className={`${isMobile ? 'text-sm' : 'text-base'} text-text-primary font-semibold capitalize`}>{subtitle}</p>
            </div>
        </div>
    );
});

// Enhanced LocationDisplay with POV preview - can be reverted by swapping back to LocationDisplay
const LocationDisplayWithPreview: React.FC<{
    title: string;
    subtitle: string;
    icon?: string;
    backgroundUrl?: string;
    showPreview?: boolean;
}> = ({ title, subtitle, icon, backgroundUrl, showPreview = false }) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [isImageLoading, setIsImageLoading] = useState(false);

    // Reset loading state when background URL changes
    useEffect(() => {
        setIsImageLoaded(false);
        setIsImageLoading(false);
    }, [backgroundUrl]);

    // Lazy load background image
    useEffect(() => {
        if (backgroundUrl && showPreview && !isImageLoaded) {
            setIsImageLoading(true);
            const img = new Image();
            img.onload = () => {
                setIsImageLoaded(true);
                setIsImageLoading(false);
            };
            img.onerror = () => {
                setIsImageLoading(false);
            };
            img.src = backgroundUrl;
        }
    }, [backgroundUrl, showPreview, isImageLoaded]);

    // If preview is active (POV is shown), use normal display
    if (!showPreview) {
        return <LocationDisplay title={title} subtitle={subtitle} icon={icon} />;
    }

    return (
        <div className={getSafariOptimizedClassName(`relative group
            surface-muted rounded-lg ${isMobile ? 'px-3 py-2 min-w-[180px]' : 'px-4 py-3 min-w-[220px]'}
            border border-surface-muted overflow-hidden backdrop-blur-lg transition-all duration-300
            hover:shadow-md`)}>
            {/* Background preview layer - more visible, especially on hover */}
            {backgroundUrl && isImageLoaded && (
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                        backgroundImage: `url(${backgroundUrl})`,
                        opacity: 0.58,
                        filter: 'brightness(.9) saturate(1.32) contrast(1.08)'
                    }}
                />
            )}

            {/* Loading state indicator */}
            {isImageLoading && (
                <div className="absolute inset-0 surface-muted flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent"></div>
                </div>
            )}

            {/* Enhanced gradient overlay with better visibility */}
            <div className="absolute inset-0 location-preview-overlay transition-opacity duration-500 group-hover:opacity-90" />

            {/* Content layer with enhanced styling */}
            <div className="relative z-10 flex items-center justify-center text-center">
                {icon && (
                    <div className={`${isMobile ? 'text-xl mr-2' : 'text-2xl mr-3'} drop-shadow-xl`}>{icon}</div>
                )}
                <div>
                    <p className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-text-secondary font-medium uppercase tracking-wider`}>
                        {title}
                    </p>
                    <p
                        className={`${isMobile ? 'text-sm' : 'text-base'} text-text-primary font-semibold capitalize mt-1`}
                        style={{
                            textShadow: '0 0 12px rgba(147, 197, 253, 0.6), 0 0 25px rgba(147, 197, 253, 0.3), 1px 1px 3px rgba(0,0,0,0.4)'
                        }}
                    >
                        {subtitle}
                    </p>
                </div>
            </div>
        </div>
    );
};

const ContextualAlert: React.FC<{ message: string }> = ({ message }) => {
    // Determine notification type and styling
    const getNotificationStyle = (msg: string) => {
        if (msg.includes('is nearby')) {
            // Check if it's an animal (starts with "A ") or NPC (contains name)
            const isAnimal = msg.startsWith('A ');

            if (isAnimal) {
                // Animal nearby - success theme
                return {
                    background: "bg-[var(--color-success)]/10",
                    border: "border-[var(--color-success)]/30",
                    textColor: "text-[var(--color-success)]",
                    animation: ""
                };
            } else {
                // NPC nearby - accent theme with subtle bounce animation
                return {
                    background: "bg-accent/10",
                    border: "border-accent/40",
                    textColor: "text-accent",
                    animation: "animate-bounce"
                };
            }
        } else if (msg.includes('border')) {
            // Border warning - warning theme
            return {
                background: "bg-[var(--color-warning)]/10",
                border: "border-[var(--color-warning)]/25",
                textColor: "text-[var(--color-warning)]",
                animation: ""
            };
        } else {
            // Default fallback
            return {
                background: 'surface-muted',
                border: 'border-surface-muted',
                textColor: 'text-text-secondary',
                animation: ''
            };
        }
    };

    const style = getNotificationStyle(message);

    return (
        <div className={getSafariOptimizedClassName(`flex items-center justify-center ${style.background} rounded-lg px-4 py-2
            border ${style.border} backdrop-blur-sm transition-all duration-300 ${style.animation}`)}>
            <p className={`${style.textColor} font-medium text-center text-sm`}>{message}</p>
        </div>
    );
};

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
    onEnterGovernmentDistrict,
    onEnterHolySite,
    onEnterPalace,
    onEnterRailroadStation,
    toastMessage,
    toastDuration = 2500,
    season = 'summer',
    timeOfDay = 'Day',
    dayOfYear = 180,
    onToggleAmbientText,
    showAmbientText = false,
    inRuinRoguelike = false,
    isRuinModalOpen = false,
    onExitRuin,
    inMiningRoguelike = false,
    onExitMine,
    isMarketplaceModalOpen = false,
    onExitMarketplace,
    isGovernmentDistrictModalOpen = false,
    onExitGovernmentDistrict,
    isSpecialMap = false,
    onExitSpecialMap,
    isOnContainer = false,
    onOpenContainer,
    isInteriorMode = false,
    onExitInterior,
    currentBiome,
    climate,
    culturalZone,
    weather,
    gameTime,
}) => {
    const [weatherDisplay, setWeatherDisplay] = useState<string>('');
    const [weatherState, setWeatherState] = useState<{ state: string, emoji: string }>({ state: '', emoji: '' });
    const [useFahrenheit, setUseFahrenheit] = useState<boolean>(false);
    const [previewBackgroundUrl, setPreviewBackgroundUrl] = useState<string | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);
    const [localToast, setLocalToast] = useState<string | null>(null);
    const [showLocalToast, setShowLocalToast] = useState(false);

    // Mobile detection for main component
    const isMobile = useMemo(() => typeof window !== 'undefined' && window.innerWidth <= 768, []);

    useEffect(() => {
        if (!toastMessage) return;

        const displayDuration = Math.max(1500, toastDuration);
        setLocalToast(toastMessage);
        requestAnimationFrame(() => setShowLocalToast(true));

        const hideTimer = window.setTimeout(() => setShowLocalToast(false), Math.max(1000, displayDuration - 400));
        const cleanupTimer = window.setTimeout(() => setLocalToast(null), displayDuration + 200);

        return () => {
            clearTimeout(hideTimer);
            clearTimeout(cleanupTimer);
        };
    }, [toastMessage, toastDuration]);

    // Create stable keys for dependencies
    const weatherKey = weather ? `${weather.precipitation}-${weather.special}` : 'none';
    const timeKey = gameTime ? `${gameTime.hours}-${Math.floor(gameTime.minutes / 15)}` : 'unknown';

    // Handle Enter key to trigger the current action button
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            // Only respond to Enter key when no input is focused
            if (event.key === 'Enter') {
                const activeElement = document.activeElement;
                const isInputFocused = activeElement?.tagName === 'INPUT' ||
                                       activeElement?.tagName === 'TEXTAREA';

                if (!isInputFocused) {
                    event.preventDefault();

                    // Determine current action based on state
                    if (inMiningRoguelike && onExitMine) {
                        onExitMine();
                    } else if (isSpecialMap && onExitSpecialMap) {
                        onExitSpecialMap();
                    } else if (actionableTile) {
                        const { type, tile, structure } = actionableTile;

                        switch (type) {
                            case 'farm':
                                onEnterFarm(tile);
                                break;
                            case 'city':
                                onEnterCity(tile);
                                break;
                            case 'marketplace':
                                if (isMarketplaceModalOpen && onExitMarketplace) {
                                    onExitMarketplace();
                                } else {
                                    gameSounds.playButtonClickSound();
                                    onEnterMarketplace(tile);
                                }
                                break;
                            case 'ruin':
                                if (inRuinRoguelike || isRuinModalOpen) {
                                    if (onExitRuin) onExitRuin();
                                } else {
                                    gameSounds.playMysteriousRuinsSound();
                                    onEnterRuin(tile);
                                }
                                break;
                            case 'building':
                                onEnterBuilding(tile);
                                break;
                            case 'fishing_hut':
                                gameSounds.playButtonClickSound();
                                onEnterFishingHut(tile);
                                break;
                        }
                    } else {
                        // Handle mobile special tiles
                        const currentTile = playerCharacter && mapData && playerX !== null && playerY !== null
                            && playerY >= 0 && playerY < mapData.tiles.length
                            && playerX >= 0 && playerX < (mapData.tiles[playerY]?.length || 0)
                            ? mapData.tiles[playerY][playerX]
                            : null;

                        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
                        const needsMobileEntryButton = isMobile && currentTile && [
                            'GOVERNMENT_DISTRICT',
                            'HOLY_SITE',
                            'PALACE',
                            'RUINS'
                        ].includes(currentTile.biome);

                        if (needsMobileEntryButton) {
                            gameSounds.playButtonClickSound();
                            if (currentTile.biome === 'RUINS') {
                                onEnterRuin(currentTile);
                            } else if (currentTile.biome === 'GOVERNMENT_DISTRICT' && onEnterGovernmentDistrict) {
                                onEnterGovernmentDistrict(currentTile);
                            } else if (currentTile.biome === 'HOLY_SITE' && onEnterHolySite) {
                                onEnterHolySite(currentTile);
                            } else if (currentTile.biome === 'PALACE' && onEnterPalace) {
                                onEnterPalace(currentTile);
                            }
                        }
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [
        inMiningRoguelike, isSpecialMap, actionableTile, isMarketplaceModalOpen,
        inRuinRoguelike, isRuinModalOpen, playerCharacter, mapData, playerX, playerY,
        onExitMine, onExitSpecialMap, onEnterFarm, onEnterCity, onEnterMarketplace,
        onExitMarketplace, onEnterRuin, onExitRuin, onEnterBuilding, onEnterFishingHut,
        onEnterGovernmentDistrict, onEnterHolySite, onEnterPalace
    ]);

    // Load background for preview when POV is NOT active
    useEffect(() => {
        // Only load preview when POV is NOT active (showAmbientText is false)
        if (showAmbientText || !currentBiome) {
            setPreviewBackgroundUrl(null);
            return;
        }

        const loadPreview = async () => {
            setIsLoadingPreview(true);
            const paths = getBackgroundPaths(
                currentBiome,
                weather,
                gameTime,
                culturalZone,
                climate,
                season
            );
            const url = await loadBackgroundImage(paths);
            setPreviewBackgroundUrl(url);
            setIsLoadingPreview(false);
        };

        loadPreview();
    }, [showAmbientText, currentBiome, climate, season, culturalZone, weatherKey, timeKey]);

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
    
    const renderActionableContent = useMemo(() => {
        // Special map exit takes priority over everything else
        // Check for mining roguelike first
        if (inMiningRoguelike) {
            return (
                <div className="w-full h-full flex items-center justify-between px-8 bg-gradient-to-r from-amber-800/90 via-amber-900/90 to-amber-800/90">
                    <LocationDisplay
                        title="Deep Mine Shaft"
                        subtitle="Mining for ore"
                        icon="⛏️"
                    />

                    <div className="flex items-center gap-6">
                        <ActionButton onClick={onExitMine || (() => {})} icon="🚪" variant="red">
                            Exit Mine
                        </ActionButton>
                    </div>

                    <div className="hidden sm:flex justify-end">
                        <div className="text-right text-text-secondary italic text-xs sm:text-sm max-w-xs
                            surface-muted rounded-lg px-3 py-2 sm:px-4 sm:py-3
                            border border-surface-muted">
                            Return to the surface with your collected ore.
                        </div>
                    </div>
                </div>
            );
        }

        if (isSpecialMap) {
            return (
                <div className="w-full h-full flex items-center justify-between px-8 bg-gradient-to-r from-background-tertiary via-background-secondary to-background-tertiary">
                    <LocationDisplay
                        title="Special Map"
                        subtitle="Interior Space"
                        icon="🏛️"
                    />

                    <div className="flex items-center gap-6">
                        {isOnContainer && onOpenContainer && (
                            <ActionButton onClick={onOpenContainer} icon="📦" variant="blue">
                                Open Container
                            </ActionButton>
                        )}
                        <ActionButton onClick={onExitSpecialMap || (() => {})} icon="🚪" variant="red">
                            Exit to Map
                        </ActionButton>
                    </div>

                    <div className="hidden sm:flex justify-end">
                        <div className="text-right text-text-secondary italic text-xs sm:text-sm max-w-xs
                            surface-muted rounded-lg px-3 py-2 sm:px-4 sm:py-3
                            border border-surface-muted">
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
            case 'railroad_station':
                buttonText = 'Buy Ticket';
                buttonIcon = '🚂';
                locationIcon = '🚂';
                onClickAction = () => onEnterRailroadStation?.(tile);
                helperText = "Purchase a train ticket to fast travel to connected railroad stations.";
                contextualInfo = (
                    <LocationDisplay
                        title="Railroad Station"
                        subtitle={tile.cityName || 'Station'}
                        icon={locationIcon}
                    />
                );
                break;
            case 'harbor_district':
                buttonText = 'Book Passage';
                buttonIcon = '⚓';
                locationIcon = '⚓';
                onClickAction = () => onEnterHarborDistrict?.(tile);
                helperText = "Book passage on a ship to travel to distant ports across the ocean.";
                contextualInfo = (
                    <LocationDisplay
                        title="Harbor"
                        subtitle={tile.cityName || 'Port'}
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
     
        }


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
                        {buttonText} {/* Press Enter key to activate */}
                    </ActionButton>
                </div>

                {/* Show helper text on mobile too, but with adapted styling */}
                <div className={isMobile ? "flex justify-center" : "hidden sm:flex justify-end"}>
                    <div className={`text-center ${isMobile ? '' : 'text-right'}
                        text-text-secondary italic text-xs sm:text-sm max-w-xs surface-muted border border-surface-muted`}>
                        {helperText}
                        {isMobile && <div className="text-[10px] mt-1 opacity-70">Tap button or press Enter</div>}
                    </div>
                </div>
            </div>
        );
    }, [inMiningRoguelike, isSpecialMap, actionableTile, inRuinRoguelike, isRuinModalOpen, isMarketplaceModalOpen, onExitMine, onExitSpecialMap, onEnterFarm, onEnterCity, onEnterMarketplace, onExitMarketplace, onEnterRuin, onExitRuin, onEnterBuilding, onEnterFishingHut, isOnContainer, onOpenContainer]);

    const renderDefaultContent = useMemo(() => {
        const currentTile = playerCharacter && mapData && playerX !== null && playerY !== null
            && playerY >= 0 && playerY < mapData.tiles.length
            && playerX >= 0 && playerX < (mapData.tiles[playerY]?.length || 0)
            ? mapData.tiles[playerY][playerX]
            : null;

        // Mobile-specific: Check for special tiles that need entry buttons
        const needsMobileEntryButton = isMobile && currentTile && [
            BiomeType.GOVERNMENT_DISTRICT,
            BiomeType.HOLY_SITE,
            BiomeType.PALACE,
            BiomeType.RUINS
        ].includes(currentTile.biome as BiomeType);
            
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


    

    return '';
};

        // Mobile special tile handling - show entry button
        if (needsMobileEntryButton) {
            let entryButtonText = 'Enter';
            let entryButtonIcon = '🏛️';
            let locationTitle = 'Special Location';

            switch (currentTile.biome) {
                case BiomeType.GOVERNMENT_DISTRICT:
                    entryButtonText = 'Enter Government District';
                    entryButtonIcon = '🏛️';
                    locationTitle = 'Government District';
                    break;
                case BiomeType.HOLY_SITE:
                    entryButtonText = 'Enter Holy Site';
                    entryButtonIcon = '⛪';
                    locationTitle = 'Holy Site';
                    break;
                case BiomeType.PALACE:
                    entryButtonText = 'Enter Palace';
                    entryButtonIcon = '🏰';
                    locationTitle = 'Palace';
                    break;
                case BiomeType.RUINS:
                    entryButtonText = 'Enter Ruins';
                    entryButtonIcon = '🏚️';
                    locationTitle = 'Ancient Ruins';
                    break;
            }

            // Create handler for mobile special tiles
            const handleMobileSpecialTileEntry = () => {
                gameSounds.playButtonClickSound();
                if (currentTile.biome === BiomeType.RUINS) {
                    onEnterRuin(currentTile);
                } else if (currentTile.biome === BiomeType.GOVERNMENT_DISTRICT) {
                    if (onEnterGovernmentDistrict) {
                        onEnterGovernmentDistrict(currentTile);
                    } else {
                        console.log('Government District entry handler not provided');
                    }
                } else if (currentTile.biome === BiomeType.HOLY_SITE) {
                    if (onEnterHolySite) {
                        onEnterHolySite(currentTile);
                    } else {
                        console.log('Holy Site entry handler not provided');
                    }
                } else if (currentTile.biome === BiomeType.PALACE) {
                    if (onEnterPalace) {
                        onEnterPalace(currentTile);
                    } else {
                        console.log('Palace entry handler not provided');
                    }
                }
            };


            return (
                <div className="w-full flex flex-col gap-3 p-3 animate-in slide-in-from-bottom duration-500">
                    <div className="flex justify-center">
                        <LocationDisplay
                            title={locationTitle}
                            subtitle="Tap to enter or press Enter"
                            icon={entryButtonIcon}
                        />
                    </div>

                    <div className="flex items-center justify-center">
                        <ActionButton
                            onClick={handleMobileSpecialTileEntry}
                            icon={entryButtonIcon}
                            variant="blue"
                        >
                            {entryButtonText}
                        </ActionButton>
                    </div>
                </div>
            );
        }

        return (
             <div className={isMobile ? "w-full flex flex-col gap-3 p-3 mb-1" : "w-full grid grid-cols-[300px_1fr_300px] items-center gap-4 p-3 mb-0"}>
                 <div className="flex justify-start">
                     <button
                         onClick={onToggleAmbientText}
                         className="transition-transform hover:scale-105"
                         title={showAmbientText ? "Click to close POV view" : "Click to see first-person POV view"}
                     >
                         <LocationDisplayWithPreview
                             title="Current Location"
                             subtitle={locationPhrase}
                             icon={getBiomeIcon(locationPhrase)}
                             backgroundUrl={previewBackgroundUrl || undefined}
                             showPreview={!showAmbientText && !!previewBackgroundUrl}
                         />
                     </button>
                 </div>

                 <div className="flex items-center justify-center">
                    {showAmbientText ? (
                        <div className="text-text-secondary text-center max-w-md animate-in fade-in duration-300">
                            {/* POV mode active - no placeholder text needed */}
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
                    ) : isSpecialMap || isGovernmentDistrictModalOpen || isInteriorMode ? (
                        <div className="flex items-center justify-center gap-4">
                            {isOnContainer && onOpenContainer && (
                                <ActionButton onClick={onOpenContainer} icon="📦" variant="blue">
                                    Open Container
                                </ActionButton>
                            )}
                            <ActionButton
                                onClick={
                                    isGovernmentDistrictModalOpen
                                        ? (onExitGovernmentDistrict || (() => {}))
                                        : isInteriorMode
                                        ? (onExitInterior || (() => {}))
                                        : (onExitSpecialMap || (() => {}))
                                }
                                icon="🚪"
                                variant="red"
                            >
                                Exit
                            </ActionButton>
                        </div>
                    ) : (
                        <div className="text-text-secondary text-center">
                            <p className="text-sm font-md opacity-30">Use arrow keys to explore</p>
                        </div>
                    )}
                 </div>

                 <div className="flex justify-end">
                    {contextualMessage ? (
                        <ContextualAlert message={contextualMessage} />
                    ) : (
                        <button
                            onClick={() => setUseFahrenheit(!useFahrenheit)}
                            className="text-right text-text-secondary text-sm max-w-xs
                                surface-muted border border-surface-muted rounded-lg px-4 py-2 hover:shadow-md transition-colors cursor-pointer"
                            title="Click to toggle between metric/imperial units"
                        >
                            <div className="font-semibold">
                                {weatherDisplay || 'Loading weather...'}
                            </div>
                            <div className="flex items-center justify-end gap-2 mt-0 ">
                                <span className="text-lg">{weatherState.emoji}</span>
                                <span className="font-bold text-text-primary">{weatherState.state}</span>
                            </div>
                        </button>
                    )}
                 </div>
             </div>
        );
    }, [playerCharacter, mapData, playerX, playerY, showAmbientText, previewBackgroundUrl, contextualMessage, weatherDisplay, weatherState, useFahrenheit, onToggleAmbientText, onEnterGovernmentDistrict, onEnterHolySite, onEnterPalace, onEnterRuin, isSpecialMap, isGovernmentDistrictModalOpen, isInteriorMode, onExitSpecialMap, onExitGovernmentDistrict, onExitInterior, isOnContainer, onOpenContainer]);

    const outerContainerClass = isMobile
        ? 'fixed inset-x-0 bottom-0 z-50 pointer-events-none px-3 pb-3'
        : 'absolute inset-x-0 z-30 pointer-events-none';

    return (
        <div className={outerContainerClass}>
            <div
                data-surface="bottom-panel"
                className={getSafariOptimizedClassName(
                    `surface-bottom-panel pointer-events-auto w-full transition-all duration-300 ${
                        isMobile ? 'px-4 pt-3' : 'px-5 pb-1'
                    }`
                )}
                style={
                    isMobile
                        ? { paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)' }
                        : undefined
                }
            >
                <div className="relative">
                    {actionableTile ? renderActionableContent : renderDefaultContent}

                    {localToast && (
                        <div
                            className={getSafariOptimizedClassName(
                                `absolute left-1/2 bottom-[calc(6rem+2vh)] -translate-x-1/2 z-[55]
                                 transition-all duration-200 ease-out pointer-events-none
                                 ${showLocalToast ? 'translate-y-0 opacity-30' : 'translate-y-4 opacity-0'}`
                            )}
                        >
                            <div
                                data-surface="toast"
                                className="px-5 py-2 rounded-xl shadow-lg backdrop-blur-xl border"
                                style={{
                                    boxShadow: '0 24px 40px rgba(15, 23, 42, 0.08)'
                                }}
                            >
                                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--toast-surface-text)' }}>
                                    <span className="text-accent">✦</span>
                                    <span>{localToast}</span>
                                </div>
                                <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(59,71,92,0.25)' }}>
                                    <div
                                        className="h-full"
                                        style={{
                                            background: 'var(--toast-progress-bg)',
                                            animation: `toastProgress ${Math.max(500, toastDuration)}ms linear forwards`
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BottomPanel;
