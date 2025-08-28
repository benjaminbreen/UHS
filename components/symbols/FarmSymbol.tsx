/**
 * components/symbols/FarmSymbol.tsx - Renders visually distinct farmland based on crop type.
 */
import React from 'react';
import { Tile, ClimateType, Season } from '../../types/index';
import { ValueNoise } from '../../utils/noise';

interface FarmSymbolProps {
  x: number;
  y: number;
  size: number;
  seed: number;
  tile: Tile;
  climate?: ClimateType;
  season?: Season;
}

const FarmSymbol: React.FC<FarmSymbolProps> = React.memo(({ x, y, size, tile, climate, season }) => {
    const { cropType } = tile;
    
    // Determine if we should apply seasonal effects
    const applySeasonalEffects = climate && season && (
        climate === ClimateType.COLD || 
        climate === ClimateType.TEMPERATE || 
        climate === ClimateType.MEDITERRANEAN ||
        climate === ClimateType.ARID
    );
    
    // Get seasonal color modifiers
    const getSeasonalColors = () => {
        if (!applySeasonalEffects) return { opacity: 1, filter: 'none', soilColor: '#8B7355' };
        
        if (climate === ClimateType.ARID) {
            // Arid climates: faded in fall/winter
            if (season === 'winter' || season === 'fall') {
                return { opacity: 0.6, filter: 'sepia(0.3)', soilColor: '#D2B48C' };
            }
            return { opacity: 0.85, filter: 'none', soilColor: '#C19A6B' };
        }
        
        // Cold, Temperate, Mediterranean seasonal changes
        switch (season) {
            case 'winter':
                // Fallow/dormant fields in winter
                return { opacity: 0.4, filter: 'grayscale(0.7)', soilColor: '#654321', showFallow: true };
            case 'spring':
                // Young growth in spring
                return { opacity: 0.9, filter: 'brightness(1.2) saturate(1.2)', soilColor: '#8B7355' };
            case 'summer':
                // Full growth in summer (default appearance)
                return { opacity: 1, filter: 'none', soilColor: '#8B7355' };
            case 'fall':
                // Harvest time - golden/brown tints
                return { opacity: 0.95, filter: 'sepia(0.2) hue-rotate(-10deg)', soilColor: '#A0826D' };
            default:
                return { opacity: 1, filter: 'none', soilColor: '#8B7355' };
        }
    };
    
    const seasonalStyle = getSeasonalColors();

    const renderVineyard = () => (
        <>
            {[...Array(4)].map((_, i) => (
                <rect key={`post-row-${i}`} x={x + i * (size / 4) + 1} y={y + 2} width="1" height={size - 4} fill="#6b4a24" />
            ))}
            {[...Array(5)].map((_, i) => (
                <g key={`vine-row-${i}`}>
                    <line x1={x} y1={y + i * (size/5) + 2} x2={x+size} y2={y + i * (size/5) + 2} stroke="#5d4a33" strokeWidth="0.5" />
                    {[...Array(6)].map((_, j) => (
                         <circle key={`grape-${i}-${j}`} cx={x + j * (size/6) + 1} cy={y + i * (size/5) + 2} r="0.8" fill="#4b0082" />
                    ))}
                </g>
            ))}
        </>
    );

    const renderOliveGrove = () => (
         <>
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`olive-${row}-${col}`}>
                            <rect x={treeX - 1} y={treeY} width="2" height="3" fill="#8B4513" />
                            <circle cx={treeX} cy={treeY} r="3" fill="#808000" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderHempField = () => (
        <>
            {/* Hemp - tall fibrous stalks in rows */}
            {[...Array(8)].map((_, i) => (
                <g key={`hemp-row-${i}`}>
                    <rect x={x + i * (size / 8)} y={y} width="1" height={size} fill="#556B2F" />
                    {/* Fibrous texture */}
                    {[...Array(3)].map((_, j) => (
                        <line key={`fiber-${i}-${j}`} 
                            x1={x + i * (size / 8)} 
                            y1={y + j * (size / 3) + 2}
                            x2={x + i * (size / 8) + 1} 
                            y2={y + j * (size / 3) + 4}
                            stroke="#8FBC8F" 
                            strokeWidth="0.3" />
                    ))}
                </g>
            ))}
        </>
    );

    const renderFlaxField = () => (
        <>
            {/* Flax - delicate blue flowers */}
            <rect x={x} y={y} width={size} height={size} fill="#E6F3FF" />
            {[...Array(4)].map((_, row) =>
                [...Array(4)].map((_, col) => (
                    <g key={`flax-${row}-${col}`}>
                        <rect x={x + col * (size / 4) + 2} y={y + row * (size / 4) + 1} 
                            width="2" height="4" fill="#228B22" />
                        <circle cx={x + col * (size / 4) + 3} cy={y + row * (size / 4) + 1} 
                            r="1.5" fill="#6495ED" />
                    </g>
                ))
            )}
        </>
    );

    const renderHopsField = () => (
        <>
            {/* Hops - climbing vines with cones */}
            {[...Array(3)].map((_, i) => (
                <g key={`hops-pole-${i}`}>
                    <rect x={x + i * (size / 3) + size/6} y={y} width="2" height={size} fill="#8B4513" />
                    <path d={`M ${x + i * (size / 3) + size/6} ${y} Q ${x + i * (size / 3) + size/6 + 3} ${y + size/2} ${x + i * (size / 3) + size/6} ${y + size}`} 
                        stroke="#2E8B57" strokeWidth="2" fill="none" />
                    {/* Hop cones */}
                    {[...Array(4)].map((_, j) => (
                        <ellipse key={`cone-${i}-${j}`} 
                            cx={x + i * (size / 3) + size/6 + ((j % 2) * 3)} 
                            cy={y + j * (size / 4) + 2} 
                            rx="2" ry="3" fill="#9ACD32" />
                    ))}
                </g>
            ))}
        </>
    );

    const renderRiceField = () => (
        <>
            {/* Rice - flooded paddies */}
            <rect x={x} y={y} width={size} height={size} fill="#87CEEB" opacity="0.4" />
            {[...Array(5)].map((_, row) =>
                [...Array(5)].map((_, col) => (
                    <g key={`rice-${row}-${col}`}>
                        <line x1={x + col * (size / 5) + 2} y1={y + row * (size / 5)} 
                            x2={x + col * (size / 5) + 2} y2={y + row * (size / 5) + 4} 
                            stroke="#8FBC8F" strokeWidth="1" />
                        <circle cx={x + col * (size / 5) + 2} cy={y + row * (size / 5)} 
                            r="0.5" fill="#F0E68C" />
                    </g>
                ))
            )}
        </>
    );

    const renderTobaccoField = () => (
        <>
            {/* Tobacco - large leaves */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => (
                    <g key={`tobacco-${row}-${col}`}>
                        <ellipse cx={x + (col + 0.5) * (size / 3)} 
                            cy={y + (row + 0.5) * (size / 3)} 
                            rx="4" ry="6" fill="#228B22" />
                        <line x1={x + (col + 0.5) * (size / 3)} 
                            y1={y + (row + 0.5) * (size / 3) - 3}
                            x2={x + (col + 0.5) * (size / 3)} 
                            y2={y + (row + 0.5) * (size / 3) + 3}
                            stroke="#006400" strokeWidth="0.5" />
                    </g>
                ))
            )}
        </>
    );

    const renderTeaField = () => (
        <>
            {/* Tea - terraced bushes */}
            {[...Array(4)].map((_, terrace) => (
                <g key={`tea-terrace-${terrace}`}>
                    <rect x={x} y={y + terrace * (size / 4)} 
                        width={size} height={size / 8} fill="#2E8B57" />
                    {[...Array(5)].map((_, bush) => (
                        <circle key={`bush-${terrace}-${bush}`} 
                            cx={x + bush * (size / 5) + 2} 
                            cy={y + terrace * (size / 4) + 2} 
                            r="2" fill="#006400" />
                    ))}
                </g>
            ))}
        </>
    );

    const renderCoffeeField = () => (
        <>
            {/* Coffee - bushes with berries */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => (
                    <g key={`coffee-${row}-${col}`}>
                        <circle cx={x + (col + 0.5) * (size / 3)} 
                            cy={y + (row + 0.5) * (size / 3)} 
                            r="3" fill="#228B22" />
                        {/* Coffee berries */}
                        <circle cx={x + (col + 0.5) * (size / 3) - 1} 
                            cy={y + (row + 0.5) * (size / 3)} 
                            r="0.8" fill="#8B0000" />
                        <circle cx={x + (col + 0.5) * (size / 3) + 1} 
                            cy={y + (row + 0.5) * (size / 3) - 1} 
                            r="0.8" fill="#8B0000" />
                    </g>
                ))
            )}
        </>
    );

    const renderIndigoField = () => (
        <>
            {/* Indigo - blue-purple plants */}
            {[...Array(6)].map((_, i) => (
                <rect key={`indigo-row-${i}`} 
                    x={x} y={y + i * (size / 6)} 
                    width={size} height={size / 12} 
                    fill={i % 2 === 0 ? '#4B0082' : '#6A0DAD'} />
            ))}
        </>
    );

    const renderPoppyField = () => (
        <>
            {/* Opium Poppies - distinctive flowers */}
            <rect x={x} y={y} width={size} height={size} fill="#90EE90" opacity="0.3" />
            {[...Array(4)].map((_, row) =>
                [...Array(4)].map((_, col) => (
                    <g key={`poppy-${row}-${col}`}>
                        <line x1={x + (col + 0.5) * (size / 4)} 
                            y1={y + (row + 0.5) * (size / 4) + 2}
                            x2={x + (col + 0.5) * (size / 4)} 
                            y2={y + (row + 0.5) * (size / 4) - 2}
                            stroke="#2E8B57" strokeWidth="0.5" />
                        <circle cx={x + (col + 0.5) * (size / 4)} 
                            cy={y + (row + 0.5) * (size / 4) - 2} 
                            r="2" fill="#DC143C" />
                        <circle cx={x + (col + 0.5) * (size / 4)} 
                            cy={y + (row + 0.5) * (size / 4) - 2} 
                            r="0.8" fill="#000000" />
                    </g>
                ))
            )}
        </>
    );

    const renderCoconutGrove = () => (
        <>
            {/* Coconut Grove - tall palm trees */}
            {[...Array(2)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const palmX = x + (col + 0.5) * (size / 3) + (row % 2 ? 2 : 0);
                    const palmY = y + (row + 0.5) * (size / 2);
                    return (
                        <g key={`palm-${row}-${col}`}>
                            {/* Trunk */}
                            <rect x={palmX - 1} y={palmY} width="2" height="8" fill="#8B4513" />
                            {/* Palm fronds */}
                            <path d={`M ${palmX} ${palmY} L ${palmX - 4} ${palmY - 3}`} stroke="#228B22" strokeWidth="1.5" />
                            <path d={`M ${palmX} ${palmY} L ${palmX + 4} ${palmY - 3}`} stroke="#228B22" strokeWidth="1.5" />
                            <path d={`M ${palmX} ${palmY} L ${palmX - 3} ${palmY - 4}`} stroke="#228B22" strokeWidth="1.5" />
                            <path d={`M ${palmX} ${palmY} L ${palmX + 3} ${palmY - 4}`} stroke="#228B22" strokeWidth="1.5" />
                            {/* Coconuts */}
                            <circle cx={palmX - 1} cy={palmY + 1} r="1" fill="#8B4513" />
                            <circle cx={palmX + 1} cy={palmY + 1} r="1" fill="#8B4513" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderBananaPlantation = () => (
        <>
            {/* Banana Plantation - broad leaves with fruit bunches */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const plantX = x + (col + 0.5) * (size / 3);
                    const plantY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`banana-${row}-${col}`}>
                            {/* Central stalk */}
                            <rect x={plantX - 1} y={plantY - 2} width="2" height="5" fill="#8FBC8F" />
                            {/* Broad leaves */}
                            <ellipse cx={plantX - 3} cy={plantY - 2} rx="3" ry="1.5" fill="#228B22" transform={`rotate(-30 ${plantX - 3} ${plantY - 2})`} />
                            <ellipse cx={plantX + 3} cy={plantY - 2} rx="3" ry="1.5" fill="#228B22" transform={`rotate(30 ${plantX + 3} ${plantY - 2})`} />
                            {/* Banana bunch */}
                            <ellipse cx={plantX} cy={plantY + 1} rx="1.5" ry="2" fill="#FFD700" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderDatePalms = () => (
        <>
            {/* Date Palms - similar to coconut but with date clusters */}
            {[...Array(3)].map((_, i) => {
                const palmX = x + (i + 0.5) * (size / 3);
                const palmY = y + size / 2;
                return (
                    <g key={`date-palm-${i}`}>
                        {/* Trunk */}
                        <rect x={palmX - 1} y={palmY - 2} width="2" height="10" fill="#8B4513" />
                        {/* Palm crown */}
                        <path d={`M ${palmX} ${palmY - 2} L ${palmX - 3} ${palmY - 5}`} stroke="#556B2F" strokeWidth="2" />
                        <path d={`M ${palmX} ${palmY - 2} L ${palmX + 3} ${palmY - 5}`} stroke="#556B2F" strokeWidth="2" />
                        <path d={`M ${palmX} ${palmY - 2} L ${palmX} ${palmY - 6}`} stroke="#556B2F" strokeWidth="2" />
                        {/* Date clusters */}
                        <circle cx={palmX - 1} cy={palmY} r="0.8" fill="#8B4513" />
                        <circle cx={palmX + 1} cy={palmY} r="0.8" fill="#8B4513" />
                        <circle cx={palmX} cy={palmY + 1} r="0.8" fill="#8B4513" />
                    </g>
                );
            })}
        </>
    );

    const renderCitrusOrchard = () => (
        <>
            {/* Citrus Orchard - trees with orange/yellow fruit */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`citrus-${row}-${col}`}>
                            <rect x={treeX - 1} y={treeY} width="2" height="3" fill="#8B4513" />
                            <circle cx={treeX} cy={treeY - 1} r="3" fill="#228B22" />
                            {/* Citrus fruits */}
                            <circle cx={treeX - 1} cy={treeY - 1} r="0.7" fill="#FFA500" />
                            <circle cx={treeX + 1} cy={treeY} r="0.7" fill="#FFD700" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderAppleOrchard = () => (
        <>
            {/* Apple Orchard - trees with red fruit */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`apple-${row}-${col}`}>
                            <rect x={treeX - 1} y={treeY} width="2" height="3" fill="#8B4513" />
                            <ellipse cx={treeX} cy={treeY - 1} rx="3" ry="2.5" fill="#228B22" />
                            {/* Apples */}
                            <circle cx={treeX - 1.5} cy={treeY - 1} r="0.6" fill="#DC143C" />
                            <circle cx={treeX + 1.5} cy={treeY - 0.5} r="0.6" fill="#DC143C" />
                            <circle cx={treeX} cy={treeY - 2} r="0.6" fill="#DC143C" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderPeachOrchard = () => (
        <>
            {/* Peach Orchard - trees with pink/orange fruit */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`peach-${row}-${col}`}>
                            <rect x={treeX - 1} y={treeY} width="2" height="3" fill="#8B4513" />
                            <circle cx={treeX} cy={treeY - 1} r="2.5" fill="#90EE90" />
                            {/* Peaches */}
                            <circle cx={treeX - 1} cy={treeY - 1} r="0.7" fill="#FFDAB9" />
                            <circle cx={treeX + 1} cy={treeY - 0.5} r="0.7" fill="#FFDAB9" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderAlmondGrove = () => (
        <>
            {/* Almond Grove - trees with small nuts */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`almond-${row}-${col}`}>
                            <rect x={treeX - 1} y={treeY} width="2" height="3" fill="#8B4513" />
                            <ellipse cx={treeX} cy={treeY - 1} rx="2.5" ry="2" fill="#556B2F" />
                            {/* Almond pods */}
                            <ellipse cx={treeX - 1} cy={treeY - 1} rx="0.5" ry="0.8" fill="#D2B48C" />
                            <ellipse cx={treeX + 1} cy={treeY} rx="0.5" ry="0.8" fill="#D2B48C" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderFigOrchard = () => (
        <>
            {/* Fig Orchard - trees with purple fruit */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`fig-${row}-${col}`}>
                            <rect x={treeX - 0.5} y={treeY} width="1" height="3" fill="#8B7355" />
                            <ellipse cx={treeX} cy={treeY - 1} rx="3" ry="2" fill="#6B8E23" />
                            {/* Figs */}
                            <ellipse cx={treeX - 1} cy={treeY - 0.5} rx="0.6" ry="0.8" fill="#663399" />
                            <ellipse cx={treeX + 1} cy={treeY - 1} rx="0.6" ry="0.8" fill="#663399" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderAvocadoGrove = () => (
        <>
            {/* Avocado Grove - trees with green pear-shaped fruit */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`avocado-${row}-${col}`}>
                            <rect x={treeX - 1} y={treeY} width="2" height="4" fill="#8B4513" />
                            <circle cx={treeX} cy={treeY - 1} r="3" fill="#2E8B57" />
                            {/* Avocados */}
                            <ellipse cx={treeX - 1} cy={treeY} rx="0.7" ry="1" fill="#556B2F" />
                            <ellipse cx={treeX + 1} cy={treeY - 1} rx="0.7" ry="1" fill="#556B2F" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderThreeSisters = () => (
        <>
            {/* Three Sisters - corn, beans, and squash together */}
            {[...Array(3)].map((_, i) => {
                const groupX = x + (i + 0.5) * (size / 3);
                return (
                    <g key={`three-sisters-${i}`}>
                        {/* Corn stalks */}
                        <rect x={groupX - 1} y={y + 2} width="2" height={size - 4} fill="#8FBC8F" />
                        <ellipse cx={groupX} cy={y + 4} rx="1.5" ry="3" fill="#FFD700" />
                        {/* Bean vines */}
                        <path d={`M ${groupX - 1} ${y + size - 2} Q ${groupX + 1} ${y + size/2} ${groupX} ${y + 2}`} 
                            stroke="#006400" strokeWidth="1" fill="none" />
                        {/* Squash on ground */}
                        <ellipse cx={groupX - 2} cy={y + size - 2} rx="2" ry="1" fill="#FF8C00" />
                    </g>
                );
            })}
        </>
    );

    const renderMaizeField = () => (
        <>
            {/* Maize/Corn - tall stalks with ears */}
            {[...Array(4)].map((_, row) =>
                [...Array(4)].map((_, col) => (
                    <g key={`maize-${row}-${col}`}>
                        <rect x={x + col * (size / 4) + 2} y={y + row * (size / 4)} 
                            width="2" height={size / 4} fill="#8FBC8F" />
                        <ellipse cx={x + col * (size / 4) + 3} cy={y + row * (size / 4) + 2} 
                            rx="1.5" ry="2.5" fill="#FFD700" />
                    </g>
                ))
            )}
        </>
    );

    const renderSilkMulberry = () => (
        <>
            {/* Silk Mulberry - trees for silkworms */}
            {[...Array(3)].map((_, row) =>
                [...Array(3)].map((_, col) => {
                    const treeX = x + (col + 0.5) * (size / 3);
                    const treeY = y + (row + 0.5) * (size / 3);
                    return (
                        <g key={`mulberry-${row}-${col}`}>
                            <rect x={treeX - 1} y={treeY} width="2" height="3" fill="#654321" />
                            <ellipse cx={treeX} cy={treeY - 1} rx="2.5" ry="2" fill="#3CB371" />
                            {/* Mulberry leaves with silkworm cocoons */}
                            <ellipse cx={treeX - 1} cy={treeY - 1} rx="0.4" ry="0.7" fill="#F5F5DC" />
                            <ellipse cx={treeX + 1} cy={treeY} rx="0.4" ry="0.7" fill="#F5F5DC" />
                        </g>
                    );
                })
            )}
        </>
    );

    const renderSpiceField = (spiceColor: string) => (
        <>
            {/* Generic spice field - small plants in rows */}
            {[...Array(5)].map((_, row) =>
                [...Array(5)].map((_, col) => (
                    <g key={`spice-${row}-${col}`}>
                        <circle cx={x + (col + 0.5) * (size / 5)} 
                            cy={y + (row + 0.5) * (size / 5)} 
                            r="1.5" fill="#228B22" />
                        <circle cx={x + (col + 0.5) * (size / 5)} 
                            cy={y + (row + 0.5) * (size / 5)} 
                            r="0.5" fill={spiceColor} />
                    </g>
                ))
            )}
        </>
    );

    const renderRootCropField = (leafColor: string) => (
        <>
            {/* Root crops - leafy tops visible */}
            {[...Array(4)].map((_, row) =>
                [...Array(4)].map((_, col) => (
                    <g key={`root-${row}-${col}`}>
                        {/* Leafy tops */}
                        <ellipse cx={x + (col + 0.5) * (size / 4)} 
                            cy={y + (row + 0.5) * (size / 4)} 
                            rx="2" ry="1" fill={leafColor} />
                        {/* Hint of root underground */}
                        <rect x={x + (col + 0.5) * (size / 4) - 0.5} 
                            y={y + (row + 0.5) * (size / 4)} 
                            width="1" height="2" fill={leafColor} opacity="0.5" />
                    </g>
                ))
            )}
        </>
    );

    const renderGenericField = (color1: string, color2: string) => (
        <>
            {[...Array(6)].map((_, i) => (
                 <rect key={`row-${i}`} x={x} y={y + i * (size / 6)} width={size} height={size / 12} fill={i % 2 === 0 ? color1 : color2} />
            ))}
        </>
    );
    
    // Render fallow field for winter in cold/temperate climates
    const renderFallowField = () => (
        <>
            {/* Bare soil with furrows */}
            <rect x={x} y={y} width={size} height={size} fill={seasonalStyle.soilColor} />
            {[...Array(8)].map((_, i) => (
                <line 
                    key={`furrow-${i}`}
                    x1={x} 
                    y1={y + i * (size / 8) + 2}
                    x2={x + size} 
                    y2={y + i * (size / 8) + 2}
                    stroke="#4A3C28" 
                    strokeWidth="0.5" 
                    opacity="0.6"
                />
            ))}
            {/* Some stubble or dried remnants */}
            {[...Array(5)].map((_, i) => (
                <rect 
                    key={`stubble-${i}`}
                    x={x + (i * size / 5) + (size / 10)} 
                    y={y + (size / 2) - 1}
                    width="1" 
                    height="3" 
                    fill="#8B7355" 
                    opacity="0.4"
                />
            ))}
        </>
    );
    
    // Check if we should show fallow field in winter
    if (seasonalStyle.showFallow && 
        cropType !== 'Vineyard' && 
        cropType !== 'Olive Grove' && 
        !cropType?.includes('Orchard') && 
        !cropType?.includes('Grove')) {
        // Annual crops show as fallow in winter
        return (
            <g opacity={seasonalStyle.opacity} filter={seasonalStyle.filter}>
                {renderFallowField()}
            </g>
        );
    }
    
    let fieldContent;
    switch (cropType) {
        // Tree Crops and Orchards
        case 'Vineyard':
            fieldContent = renderVineyard();
            break;
        case 'Olive Grove':
            fieldContent = renderOliveGrove();
            break;
        case 'Coconut Grove':
            fieldContent = renderCoconutGrove();
            break;
        case 'Banana Plantation':
            fieldContent = renderBananaPlantation();
            break;
        case 'Date Palms':
            fieldContent = renderDatePalms();
            break;
        case 'Citrus Orchard':
            fieldContent = renderCitrusOrchard();
            break;
        case 'Apple Orchard':
            fieldContent = renderAppleOrchard();
            break;
        case 'Peach Orchard':
            fieldContent = renderPeachOrchard();
            break;
        case 'Almond Grove':
            fieldContent = renderAlmondGrove();
            break;
        case 'Fig Orchard':
            fieldContent = renderFigOrchard();
            break;
        case 'Avocado Grove':
            fieldContent = renderAvocadoGrove();
            break;
        
        // Fiber and Industrial Crops
        case 'Hemp':
            fieldContent = renderHempField();
            break;
        case 'Flax':
            fieldContent = renderFlaxField();
            break;
        case 'Hops':
            fieldContent = renderHopsField();
            break;
        case 'Silk Mulberry':
            fieldContent = renderSilkMulberry();
            break;
        case 'Cotton':
            fieldContent = renderGenericField('#FFFAFA', '#F0F8FF'); // Snow, AliceBlue
            break;
        
        // Dye Plants
        case 'Indigo':
        case 'Madder':
        case 'Woad':
            fieldContent = renderIndigoField();
            break;
        
        // Drug Crops
        case 'Opium Poppies':
            fieldContent = renderPoppyField();
            break;
        case 'Tobacco':
            fieldContent = renderTobaccoField();
            break;
        case 'Cacao':
            fieldContent = renderCoffeeField(); // Similar appearance
            break;
        
        // Beverage Crops
        case 'Tea':
            fieldContent = renderTeaField();
            break;
        case 'Coffee':
            fieldContent = renderCoffeeField();
            break;
        
        // Grain Crops
        case 'Wheat':
        case 'Barley':
        case 'Rye':
        case 'Oats':
        case 'Millet':
        case 'Sorghum':
            fieldContent = renderGenericField('#DAA520', '#B8860B'); // GoldenRod, DarkGoldenRod
            break;
        case 'Rice':
            fieldContent = renderRiceField();
            break;
        
        // American Crops
        case 'Three Sisters':
            fieldContent = renderThreeSisters();
            break;
        case 'Maize':
        case 'Corn':
            fieldContent = renderMaizeField();
            break;
        case 'Sunflower':
            fieldContent = renderGenericField('#FFD700', '#FFA500'); // Gold, Orange
            break;
        case 'Tomato':
            fieldContent = renderGenericField('#FF6347', '#8FBC8F'); // Tomato red, green leaves
            break;
        
        // Root Crops
        case 'Potato':
        case 'Potatoes':
            fieldContent = renderRootCropField('#556B2F'); // Dark olive green leaves
            break;
        case 'Sweet Potato':
        case 'Sweet Potatoes':
            fieldContent = renderRootCropField('#8FBC8F'); // Light green leaves
            break;
        case 'Yam':
        case 'Yams':
            fieldContent = renderRootCropField('#228B22'); // Forest green leaves
            break;
        case 'Taro':
            fieldContent = renderRootCropField('#2E8B57'); // Sea green leaves
            break;
        case 'Cassava':
            fieldContent = renderRootCropField('#6B8E23'); // Olive drab leaves
            break;
        
        // Sugar and Spices
        case 'Sugar Cane':
            fieldContent = renderGenericField('#90EE90', '#3CB371'); // LightGreen, MediumSeaGreen
            break;
        case 'Black Pepper':
            fieldContent = renderSpiceField('#000000'); // Black peppercorns
            break;
        case 'Cinnamon':
            fieldContent = renderSpiceField('#D2691E'); // Cinnamon brown
            break;
        case 'Nutmeg':
            fieldContent = renderSpiceField('#8B4513'); // Saddle brown
            break;
        
        default:
            fieldContent = renderGenericField('#DAA520', '#B8860B');
            break;
    }
    
    // Apply seasonal effects
    return (
        <g opacity={seasonalStyle.opacity} filter={seasonalStyle.filter}>
            {fieldContent}
        </g>
    );
});

export default FarmSymbol;