/**
 * components/TimeAwareBackground.tsx - Renders a dynamic background based on time of day.
 * Enhanced with realistic star movement and beautiful night transitions
 */
import React, { useState, useEffect } from 'react';
import { blendColors } from '../utils/colorUtils';

import { WeatherState } from '../services/weatherService';

interface TimeAwareBackgroundProps {
 gameTimeHours: number;
 gameTimeMinutes: number;
 viewMode?: 'standard' | 'interior';
 weather?: WeatherState | null;
 season?: 'spring' | 'summer' | 'fall' | 'winter' | null;
 climate?: 'temperate' | 'tropical' | 'arid' | 'arctic' | 'mediterranean' | 'continental' | null;
}

// Base gradient colors
const BASE_GRADIENT_COLORS = {
    DAWN: ['#2B3E5C', '#FFB6C1', '#FFE4B5'], // Darker blue at top through light pink to pale peach
    DAY: ['#4A90E2', '#87CEEB', '#E6F3FF'],   // Clear blue sky gradient
    DUSK: ['#1F2937', '#FF8C69', '#FFA07A'],   // Dark blue-gray at top through salmon to light salmon
    TWILIGHT: ['#4B5C8A', '#2E3A5F', '#1a2644'], // Twilight blues
    NIGHT: ['#050820', '#0d0d2a', '#101535'], // Darker deep space blues
    MIDNIGHT: ['#000408', '#000d1a', '#001833'], // Extremely deep blues, almost black
    PRE_DAWN: ['#1a1a3e', '#2d3561', '#4a5568'], // Gradual lightening
};

// Season and climate modifiers
const getSeasonalColors = (baseColors: typeof BASE_GRADIENT_COLORS, season?: string | null, climate?: string | null) => {
    let colors = { ...baseColors };
    
    // Winter modifications - cooler, more muted tones
    if (season === 'winter') {
        if (climate === 'temperate' || climate === 'continental') {
            colors.DAWN = ['#2A3A4C', '#E6B8C1', '#F0D4C5']; // Cooler pink dawn
            colors.DAY = ['#5A8AC2', '#9DBEDD', '#E0EBF5'];  // Grayer blue day
            colors.DUSK = ['#1A2535', '#CC7A69', '#E09080']; // Muted sunset
        } else if (climate === 'arctic') {
            colors.DAWN = ['#1F2B3C', '#C8D0E0', '#E0E8F0']; // Very pale dawn
            colors.DAY = ['#6A8AAA', '#A0C0E0', '#F0F5FA'];  // Bright but cold
            colors.DUSK = ['#151925', '#9A6A7A', '#C08090']; // Brief, muted dusk
        }
    }
    // Summer modifications - warmer, more vibrant
    else if (season === 'summer') {
        if (climate === 'tropical') {
            colors.DAWN = ['#3A4E6C', '#FFB0D1', '#FFE0C5']; // Vibrant tropical dawn
            colors.DAY = ['#3A80D2', '#70BEEB', '#D0F3FF'];  // Brilliant blue
            colors.DUSK = ['#2F3947', '#FF9C79', '#FFB08A']; // Long, colorful sunset
            colors.TWILIGHT = ['#5B6C9A', '#3E4A7F', '#2a3654']; // Longer twilight
        } else if (climate === 'mediterranean' || climate === 'arid') {
            colors.DAWN = ['#3B4E5C', '#FFC6D1', '#FFF4D5']; // Golden dawn
            colors.DAY = ['#4AA0F2', '#97DEEB', '#F6F9FF'];  // Intense blue
            colors.DUSK = ['#2F2937', '#FF7C59', '#FFA07A']; // Rich golden hour
        } else if (climate === 'temperate') {
            colors.TWILIGHT = ['#5B6CAA', '#3E4A6F', '#2a3644']; // Extended summer twilight
        }
    }
    // Fall modifications - golden and amber tones
    else if (season === 'fall') {
        colors.DAWN = ['#3B3E4C', '#FFB6A1', '#FFD4B5']; // Amber dawn
        colors.DUSK = ['#2F2927', '#FF8C59', '#FFB07A']; // Golden sunset
    }
    // Spring modifications - fresh, clear colors
    else if (season === 'spring') {
        colors.DAWN = ['#2B4E5C', '#FFC6D1', '#FFE4C5']; // Fresh pink dawn
        colors.DAY = ['#4AA0E2', '#87DEEB', '#E6F9FF'];  // Crystal clear
    }
    
    return colors;
};

// Interior-specific neutral colors
const INTERIOR_GRADIENT = {
    base: ['#2a2a2a', '#1a1a1a'], // Neutral dark gray for interior darkness
};

const TIME_POINTS = {
    NIGHT_END: 5,   // End of night, start of dawn
    DAWN_END: 8,    // End of dawn, start of day
    DAY_END: 18,    // End of day, start of dusk
    DUSK_END: 20,   // End of dusk, start of twilight
    TWILIGHT_END: 22, // End of twilight, start of night
    PRE_DAWN_START: 4, // Pre-dawn glimmer begins
};

const TimeAwareBackground: React.FC<TimeAwareBackgroundProps> = React.memo(({ gameTimeHours, gameTimeMinutes, viewMode = 'standard', weather, season, climate }) => {
    const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        // For interior view, use neutral dark background regardless of time
        if (viewMode === 'interior') {
            setBackgroundStyle({
                background: `linear-gradient(160deg, ${INTERIOR_GRADIENT.base[0]} 0%, ${INTERIOR_GRADIENT.base[1]} 100%)`,
                transition: 'background 2s ease-out'
            });
            return;
        }

        const currentTime = gameTimeHours + gameTimeMinutes / 60;
        let fromKey: keyof typeof GRADIENT_COLORS;
        let toKey: keyof typeof GRADIENT_COLORS;
        let periodStart: number;
        let periodEnd: number;
        let progress: number;

        if (currentTime >= TIME_POINTS.PRE_DAWN_START && currentTime < TIME_POINTS.NIGHT_END) {
            // Pre-dawn transition (4-5 AM) - subtle lightening
            fromKey = 'MIDNIGHT'; 
            toKey = 'PRE_DAWN';
            periodStart = TIME_POINTS.PRE_DAWN_START; 
            periodEnd = TIME_POINTS.NIGHT_END;
            progress = (currentTime - periodStart) / (periodEnd - periodStart);
        } else if (currentTime >= TIME_POINTS.NIGHT_END && currentTime < TIME_POINTS.DAWN_END) {
            // Dawn transition (5-8 AM)
            fromKey = 'PRE_DAWN'; 
            toKey = 'DAWN';
            periodStart = TIME_POINTS.NIGHT_END; 
            periodEnd = TIME_POINTS.DAWN_END;
            progress = (currentTime - periodStart) / (periodEnd - periodStart);
        } else if (currentTime >= TIME_POINTS.DAWN_END && currentTime < TIME_POINTS.DAY_END) {
            // Day transition (8 AM - 6 PM)
            fromKey = 'DAWN'; 
            toKey = 'DAY';
            periodStart = TIME_POINTS.DAWN_END; 
            periodEnd = TIME_POINTS.DAY_END;
            progress = (currentTime - periodStart) / (periodEnd - periodStart);
        } else if (currentTime >= TIME_POINTS.DAY_END && currentTime < TIME_POINTS.DUSK_END) {
            // Dusk transition (6-8 PM)
            fromKey = 'DAY'; 
            toKey = 'DUSK';
            periodStart = TIME_POINTS.DAY_END; 
            periodEnd = TIME_POINTS.DUSK_END;
            progress = (currentTime - periodStart) / (periodEnd - periodStart);
        } else if (currentTime >= TIME_POINTS.DUSK_END && currentTime < TIME_POINTS.TWILIGHT_END) {
            // Twilight transition (8-10 PM)
            fromKey = 'DUSK'; 
            toKey = 'TWILIGHT';
            periodStart = TIME_POINTS.DUSK_END; 
            periodEnd = TIME_POINTS.TWILIGHT_END;
            progress = (currentTime - periodStart) / (periodEnd - periodStart);
        } else if (currentTime >= TIME_POINTS.TWILIGHT_END || currentTime < TIME_POINTS.PRE_DAWN_START) {
            // Deep night transition (10 PM - 4 AM)
            fromKey = 'TWILIGHT'; 
            toKey = 'MIDNIGHT';
            
            if (currentTime >= TIME_POINTS.TWILIGHT_END) {
                // After 10 PM same day
                periodStart = TIME_POINTS.TWILIGHT_END;
                periodEnd = 24 + TIME_POINTS.PRE_DAWN_START; // 28 (4 AM next day)
                progress = (currentTime - periodStart) / (periodEnd - periodStart);
            } else {
                // Before 4 AM (early morning)
                periodStart = TIME_POINTS.TWILIGHT_END;
                periodEnd = 24 + TIME_POINTS.PRE_DAWN_START; // 28
                progress = (currentTime + 24 - periodStart) / (periodEnd - periodStart);
            }
        } else {
            // Fallback to midnight
            fromKey = 'MIDNIGHT';
            toKey = 'MIDNIGHT';
            progress = 0;
        }

        // Clamp progress
        progress = Math.max(0, Math.min(1, progress));

        // Get season and climate-adjusted colors
        const GRADIENT_COLORS = getSeasonalColors(BASE_GRADIENT_COLORS, season, climate);
        const fromGradient = GRADIENT_COLORS[fromKey];
        const toGradient = GRADIENT_COLORS[toKey];

        // Support 3-color gradients for more beautiful transitions
        const startColor = blendColors(fromGradient[0], toGradient[0], progress);
        const midColor = fromGradient[2] && toGradient[2] 
            ? blendColors(fromGradient[2], toGradient[2], progress)
            : blendColors(fromGradient[1], toGradient[1], progress);
        const endColor = blendColors(fromGradient[1], toGradient[1], progress);

        // Check for overcast conditions
        let gradient;
        let finalStartColor = startColor;
        let finalMidColor = midColor;
        let finalEndColor = endColor;
        
        if (weather && weather.cloudCover > 0.7) {
            // Overcast - adjust based on time of day
            const isNight = gameTimeHours >= 22 || gameTimeHours < 4;
            const isDusk = gameTimeHours >= 18 && gameTimeHours < 22;
            const isDawn = gameTimeHours >= 4 && gameTimeHours < 7;

            if (isNight) {
                // Cloudy night: very dark blue-gray instead of light gray
                const grayLevel = Math.floor(25 - weather.cloudCover * 10); // Much darker (15-25 range)
                finalStartColor = `rgb(${grayLevel}, ${grayLevel + 8}, ${grayLevel + 20})`; // Blue tint
                finalEndColor = `rgb(${grayLevel + 10}, ${grayLevel + 18}, ${grayLevel + 30})`;
                finalMidColor = `rgb(${grayLevel + 5}, ${grayLevel + 13}, ${grayLevel + 25})`;
            } else if (isDusk || isDawn) {
                // Twilight clouds: darker with purple/blue tint
                const grayLevel = Math.floor(70 - weather.cloudCover * 20);
                finalStartColor = `rgb(${grayLevel}, ${grayLevel + 5}, ${grayLevel + 15})`; // Slight blue
                finalEndColor = `rgb(${grayLevel + 20}, ${grayLevel + 25}, ${grayLevel + 35})`;
                finalMidColor = `rgb(${grayLevel + 10}, ${grayLevel + 15}, ${grayLevel + 25})`;
            } else {
                // Daytime clouds: normal gray behavior
                const grayLevel = Math.floor(140 - weather.cloudCover * 40);
                finalStartColor = `rgb(${grayLevel}, ${grayLevel}, ${grayLevel + 5})`;
                finalEndColor = `rgb(${grayLevel + 20}, ${grayLevel + 20}, ${grayLevel + 25})`;
                finalMidColor = `rgb(${grayLevel + 10}, ${grayLevel + 10}, ${grayLevel + 15})`;
            }
            gradient = `linear-gradient(180deg, ${finalStartColor} 0%, ${finalEndColor} 100%)`;
        } else if (weather && weather.precipitation !== 'none') {
            // Rainy/snowy - darker version of time gradient
            const isNight = gameTimeHours >= 22 || gameTimeHours < 4;
            const isDusk = gameTimeHours >= 18 && gameTimeHours < 22;
            const isDawn = gameTimeHours >= 4 && gameTimeHours < 7;

            if (isNight) {
                // Rainy night: very dark blue-black
                finalStartColor = blendColors(startColor, '#0a0a1a', 0.6); // Dark blue-black
                finalMidColor = midColor ? blendColors(midColor, '#0d0d20', 0.6) : finalStartColor;
                finalEndColor = blendColors(endColor, '#101030', 0.6);
            } else if (isDusk || isDawn) {
                // Twilight rain: darker purple-gray
                finalStartColor = blendColors(startColor, '#2a2a3a', 0.5);
                finalMidColor = midColor ? blendColors(midColor, '#303040', 0.5) : finalStartColor;
                finalEndColor = blendColors(endColor, '#353545', 0.5);
            } else {
                // Daytime rain: normal darkening
                finalStartColor = blendColors(startColor, '#404040', 0.4);
                finalMidColor = midColor ? blendColors(midColor, '#505050', 0.4) : finalStartColor;
                finalEndColor = blendColors(endColor, '#606060', 0.4);
            }
            gradient = midColor
                ? `linear-gradient(180deg, ${finalStartColor} 0%, ${finalMidColor} 60%, ${finalEndColor} 100%)`
                : `linear-gradient(180deg, ${finalStartColor} 0%, ${finalEndColor} 100%)`;
        } else {
            // Normal time-based gradient
            gradient = fromGradient[2] && toGradient[2]
                ? `linear-gradient(180deg, ${startColor} 0%, ${midColor} 60%, ${endColor} 100%)`
                : `linear-gradient(180deg, ${startColor} 0%, ${endColor} 100%)`;
        }

        // Create CSS variables for horizon components to use
        const cssVars: React.CSSProperties = {
            // Sky colors (top to bottom)
            ['--sky-top' as any]: finalStartColor,
            ['--sky-mid' as any]: finalMidColor || finalStartColor,
            ['--sky-bottom' as any]: finalEndColor,
            
            // Derived colors for atmospheric effects
            ['--sky-haze-dark' as any]: blendColors(finalMidColor || finalEndColor, '#ffffff', 0.25),
            ['--sky-haze-light' as any]: blendColors(finalEndColor, '#ffffff', 0.45),
            ['--sky-water' as any]: blendColors(finalEndColor, '#2a6fb0', 0.35),
            
            // Additional derived colors for horizons
            ['--sky-fog' as any]: blendColors(finalMidColor || finalEndColor, '#d0d0d0', 0.4),
            ['--sky-mountain-far' as any]: blendColors(finalStartColor, '#4a5568', 0.5),
            ['--sky-mountain-mid' as any]: blendColors(finalMidColor || finalStartColor, '#2d3748', 0.6),
            ['--sky-mountain-near' as any]: blendColors(finalEndColor, '#1a202c', 0.7),
        };

        setBackgroundStyle({
            background: gradient,
            transition: 'background 5s ease-in-out',
            ...cssVars
        });
    }, [gameTimeHours, gameTimeMinutes, viewMode]);

    // Realistic star visibility calculation
    const getStarOpacity = () => {
        // No stars in interior view
        if (viewMode === 'interior') return 0;
        
        const currentTime = gameTimeHours + gameTimeMinutes / 60;
        
        // Stars are only visible during night hours
        if (currentTime >= 22 || currentTime < 4) {
            // Peak star visibility (10 PM - 4 AM)
            return 1;
        } else if (currentTime >= 21 && currentTime < 22) {
            // Stars appearing during twilight (9-10 PM)
            const progress = (currentTime - 21) / 1;
            return progress * 0.8;
        } else if (currentTime >= 20 && currentTime < 21) {
            // Faint stars during late dusk (8-9 PM)
            const progress = (currentTime - 20) / 1;
            return progress * 0.4;
        } else if (currentTime >= 4 && currentTime < 5) {
            // Stars dimming during pre-dawn (4-5 AM)
            const progress = 1 - ((currentTime - 4) / 1);
            return progress * 0.6;
        } else if (currentTime >= 5 && currentTime < 6) {
            // Stars fading as dawn approaches (5-6 AM)
            const progress = 1 - ((currentTime - 5) / 1);
            return progress * 0.3;
        }
        
        // No stars during day hours
        return 0;
    };

    // Generate randomized colored stars for more variety
    const generateColoredStars = (seed: number) => {
        const starColors = ['#ffffff', '#fffacd', '#b3d9ff', '#ffd1dc', '#e6e6fa', '#f0e68c'];
        const positions = [];
        const rng = (s: number) => {
            let x = Math.sin(s) * 10000;
            return x - Math.floor(x);
        };
        
        for (let i = 0; i < 12; i++) {
            const x = rng(seed + i) * 300 + 50;
            const y = rng(seed + i + 100) * 200 + 30;
            const size = rng(seed + i + 200) * 1.5 + 0.5;
            const opacity = rng(seed + i + 300) * 0.6 + 0.4;
            const colorIndex = Math.floor(rng(seed + i + 400) * starColors.length);
            positions.push({ x, y, size, opacity, color: starColors[colorIndex] });
        }
        return positions;
    };

    const starOpacity = getStarOpacity();
    const coloredStars = generateColoredStars(Math.floor(gameTimeHours + gameTimeMinutes / 15)); // Change star pattern every 15 minutes

    return (
        <div className="absolute inset-0 -z-10 overflow-hidden" style={backgroundStyle}>
            {/* Realistic Starfield with slow parallax movement */}
            {starOpacity > 0 && (
                <div 
                    className="absolute inset-0 w-full h-full transition-opacity duration-[6000ms] ease-in-out"
                    style={{ opacity: starOpacity }}
                >
                    {/* Primary star layer - star glyphs, brightest, slowest movement */}
                    <div 
                        className="absolute inset-0 w-full h-full"
                        style={{
                            background: `transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='350' height='280'%3E%3Ctext x='73' y='45' font-size='8' fill='%23ffffff' fill-opacity='0.3'%3E%E2%9C%A7%3C/text%3E%3Ctext x='187' y='93' font-size='10' fill='%23ffffff' fill-opacity='0.9'%3E%E2%9C%A7%3C/text%3E%3Ctext x='298' y='156' font-size='9' fill='%23ffffff' fill-opacity='0.7'%3E%E2%9C%A7%3C/text%3E%3Ctext x='142' y='203' font-size='7' fill='%23ffffff' fill-opacity='0.6'%3E%E2%9C%A7%3C/text%3E%3Ctext x='321' y='67' font-size='8' fill='%23ffffff' fill-opacity='0.8'%3E%E2%9C%A7%3C/text%3E%3Ctext x='29' y='178' font-size='9' fill='%23ffffff' fill-opacity='0.7'%3E%E2%9C%A7%3C/text%3E%3Ctext x='256' y='34' font-size='7' fill='%23ffffff' fill-opacity='0.6'%3E%E2%9C%A7%3C/text%3E%3C/svg%3E") repeat`,
                            animation: 'move-twink-back 8000s linear infinite'
                        }}
                    />
                    
                    {/* Secondary star layer - warm white tinted circles, medium brightness */}
                    <div 
                        className="absolute inset-0 w-full h-full"
                        style={{
                            background: `transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='280' height='220'%3E%3Cg fill='%23fffacd' fill-opacity='0.6'%3E%3Ccircle cx='67' cy='38' r='1'/%3E%3Ccircle cx='189' cy='82' r='0.8'/%3E%3Ccircle cx='124' cy='143' r='1.2'/%3E%3Ccircle cx='241' cy='176' r='0.6'/%3E%3Ccircle cx='43' cy='195' r='0.9'/%3E%3Ccircle cx='203' cy='47' r='0.7'/%3E%3Ccircle cx='156' cy='209' r='0.8'/%3E%3Ccircle cx='278' cy='91' r='0.5'/%3E%3Ccircle cx='89' cy='167' r='1'/%3E%3C/g%3E%3C/svg%3E") repeat`,
                            animation: 'move-twink-back 7000s linear infinite'
                        }}
                    />
                    
                    {/* Tertiary star layer - cool blue tinted, faint */}
                    <div 
                        className="absolute inset-0 w-full h-full"
                        style={{
                            background: `transparent url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='180'%3E%3Cg fill='%23b3d9ff' fill-opacity='0.4'%3E%3Ccircle cx='34' cy='29' r='0.5'/%3E%3Ccircle cx='123' cy='67' r='0.6'/%3E%3Ccircle cx='78' cy='134' r='0.4'/%3E%3Ccircle cx='167' cy='42' r='0.5'/%3E%3Ccircle cx='189' cy='156' r='0.7'/%3E%3Ccircle cx='52' cy='89' r='0.3'/%3E%3Ccircle cx='145' cy='178' r='0.6'/%3E%3Ccircle cx='198' cy='98' r='0.4'/%3E%3C/g%3E%3C/svg%3E") repeat`,
                            animation: 'move-twink-back 6000s linear infinite'
                        }}
                    />
                    
                    {/* Distant stars layer - very faint, almost imperceptible movement */}
                    <div 
                        className="absolute inset-0 w-full h-full"
                        style={{
                            background: `transparent url("data:image/svg+xml,%3Csvg width='400' height='320' viewBox='0 0 400 320' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.2'%3E%3Ccircle cx='89' cy='73' r='0.3'/%3E%3Ccircle cx='267' cy='134' r='0.2'/%3E%3Ccircle cx='156' cy='245' r='0.4'/%3E%3Ccircle cx='343' cy='89' r='0.2'/%3E%3Ccircle cx='78' cy='198' r='0.3'/%3E%3Ccircle cx='298' cy='267' r='0.2'/%3E%3Ccircle cx='134' cy='56' r='0.3'/%3E%3Ccircle cx='378' cy='178' r='0.2'/%3E%3Ccircle cx='43' cy='289' r='0.3'/%3E%3Ccircle cx='234' cy='312' r='0.2'/%3E%3C/g%3E%3C/svg%3E") repeat`,
                            animation: 'move-twink-back 12000s linear infinite'
                        }}
                    />

                    {/* Randomized colored stars */}
                    <div className="absolute inset-0 w-full h-full">
                        {coloredStars.map((star, index) => (
                            <div
                                key={index}
                                className="absolute animate-pulse"
                                style={{
                                    left: `${star.x}px`,
                                    top: `${star.y}px`,
                                    width: `${star.size * 2}px`,
                                    height: `${star.size * 2}px`,
                                    backgroundColor: star.color,
                                    borderRadius: '50%',
                                    opacity: star.opacity * starOpacity,
                                    boxShadow: `0 0 ${star.size * 4}px ${star.color}`,
                                    animationDuration: `${2 + (index % 3)}s`,
                                    animationDelay: `${index * 0.2}s`
                                }}
                            />
                        ))}
                    </div>

                    {/* Shooting stars - appear occasionally during peak night hours */}
                    {starOpacity > 0.8 && (gameTimeHours + gameTimeMinutes / 60) % 1 < 0.1 && (
                        <div className="absolute inset-0 w-full h-full overflow-hidden">
                            <div
                                className="absolute w-1 h-1 bg-white rounded-full"
                                style={{
                                    top: '20%',
                                    left: '80%',
                                    animation: 'shooting-star 3s ease-out',
                                    boxShadow: '0 0 4px #ffffff, 0 0 8px #ffffff'
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Enhanced atmospheric overlays for realism */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Night atmospheric glow */}
                {starOpacity > 0.5 && (
                    <div 
                        className="absolute inset-0 transition-opacity duration-[4000ms]"
                        style={{ 
                            opacity: starOpacity * 0.4,
                            background: 'radial-gradient(ellipse at center top, rgba(25, 39, 62, 0.2) 0%, transparent 70%)'
                        }}
                    />
                )}
                
                {/* Pre-dawn atmospheric lightening */}
                {gameTimeHours >= 4 && gameTimeHours < 6 && (
                    <div 
                        className="absolute inset-0 transition-opacity duration-[3000ms]"
                        style={{ 
                            opacity: 0.3,
                            background: 'radial-gradient(ellipse at center bottom, rgba(70, 90, 120, 0.15) 0%, transparent 60%)'
                        }}
                    />
                )}
                
                {/* Twilight horizon glow */}
                {((gameTimeHours >= 19 && gameTimeHours < 22) || (gameTimeHours >= 5 && gameTimeHours < 8)) && (
                    <div 
                        className="absolute inset-0 transition-opacity duration-[2000ms]"
                        style={{ 
                            opacity: 0.5,
                            background: gameTimeHours >= 19 && gameTimeHours < 22
                                ? 'radial-gradient(ellipse at center bottom, rgba(255, 140, 80, 0.12) 0%, transparent 50%)'
                                : 'radial-gradient(ellipse at center bottom, rgba(255, 220, 180, 0.15) 0%, transparent 60%)'
                        }}
                    />
                )}
            </div>

        </div>
    );
});

export default TimeAwareBackground;