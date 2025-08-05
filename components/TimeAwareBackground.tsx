/**
 * components/TimeAwareBackground.tsx - Renders a dynamic background based on time of day.
 * Enhanced with realistic star movement and beautiful night transitions
 */
import React, { useState, useEffect } from 'react';
import { blendColors } from '../utils/colorUtils';

interface TimeAwareBackgroundProps {
 gameTimeHours: number;
 gameTimeMinutes: number;
}

// Enhanced gradient colors for more realistic transitions
const GRADIENT_COLORS = {
    DAWN: ['#4a3a69', '#e17b7b'], // Deep purple to warm rose
    DAY: ['#87ceeb', '#4682b4'],   // Sky blue to steel blue
    DUSK: ['#8b4a6b', '#cd5c5c'],  // Magenta to indian red
    TWILIGHT: ['#2d1b69', '#4a1942'], // Deep purple twilight
    NIGHT: ['#1e293b', '#0f172a'], // Slate to very dark slate
    MIDNIGHT: ['#0f172a', '#020617'], // Very dark slate to deepest midnight blue
    PRE_DAWN: ['#1e293b', '#334155'], // Lighter slate preparing for dawn
};

const TIME_POINTS = {
    NIGHT_END: 5,   // End of night, start of dawn
    DAWN_END: 8,    // End of dawn, start of day
    DAY_END: 18,    // End of day, start of dusk
    DUSK_END: 20,   // End of dusk, start of twilight
    TWILIGHT_END: 22, // End of twilight, start of night
    PRE_DAWN_START: 4, // Pre-dawn glimmer begins
};

const TimeAwareBackground: React.FC<TimeAwareBackgroundProps> = React.memo(({ gameTimeHours, gameTimeMinutes }) => {
    const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
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

        const fromGradient = GRADIENT_COLORS[fromKey];
        const toGradient = GRADIENT_COLORS[toKey];

        const startColor = blendColors(fromGradient[0], toGradient[0], progress);
        const endColor = blendColors(fromGradient[1], toGradient[1], progress);

        setBackgroundStyle({
            background: `linear-gradient(160deg, ${startColor} 0%, ${endColor} 100%)`,
            transition: 'background 3s ease-out'
        });
    }, [gameTimeHours, gameTimeMinutes]);

    // Realistic star visibility calculation
    const getStarOpacity = () => {
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

    const starOpacity = getStarOpacity();

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

  <div className="absolute inset-0 pointer-events-none">
  <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

</div>

<div className="absolute inset-0 bg-slate-800/10 pointer-events-none" />
        </div>
    );
});

export default TimeAwareBackground;