import React, { useState, useMemo } from 'react';
import { MapData, BiomeType, ClimateType } from '../types';
import { getTileRenderColor } from '../utils/colorUtils';

interface MapDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapData: MapData | null;
}

type SortKey = 'biomeType' | 'count' | 'percentage';
type SortDirection = 'asc' | 'desc';

interface BiomeStat {
  biome: BiomeType;
  count: number;
  percentage: number;
  color: string;
}

const MapDetailsModal: React.FC<MapDetailsModalProps> = ({ isOpen, onClose, mapData }) => {
  const [sortKey, setSortKey] = useState<SortKey>('count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  const analysisData = useMemo(() => {
    if (!mapData) return null;

    const biomeCounts = new Map<BiomeType, number>();
    mapData.tiles.flat().forEach(tile => {
      biomeCounts.set(tile.biome, (biomeCounts.get(tile.biome) || 0) + 1);
    });

    const totalTiles = mapData.width * mapData.height;
    const urbanBiomes = new Set([BiomeType.HAMLET, BiomeType.LOW_DENSITY_CITY, BiomeType.DENSE_CITY, BiomeType.PALACE, BiomeType.MARKETPLACE, BiomeType.GOVERNMENT_DISTRICT]);
    let urbanTileCount = 0;

    const biomeStats: BiomeStat[] = Array.from(biomeCounts.entries()).map(([biome, count]) => {
      if (urbanBiomes.has(biome)) {
        urbanTileCount += count;
      }
      return {
        biome,
        count,
        percentage: (count / totalTiles) * 100,
        color: getTileRenderColor({ biome } as any, mapData.climate, mapData.seed), // simplified for color
      };
    });

    return {
      totalTiles,
      uniqueBiomes: biomeStats.length,
      urbanAreas: urbanTileCount,
      biomeStats,
    };
  }, [mapData]);

  const sortedBiomeStats = useMemo(() => {
    if (!analysisData) return [];
    return [...analysisData.biomeStats].sort((a, b) => {
      let compareA = a[sortKey];
      let compareB = b[sortKey];
      if (sortKey === 'biomeType') {
        compareA = a.biome;
        compareB = b.biome;
      }
      
      if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [analysisData, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const formatBiomeName = (biome: BiomeType | undefined) => {
    if (!biome) {
      console.warn('[MapDetailsModal] Undefined biome detected, using fallback');
      return 'Unknown Terrain';
    }
    return biome.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!isOpen || !mapData || !analysisData) return null;

  return (
    <div
      data-surface="modal-overlay"
      className="modal-overlay theme-surface"
      onClick={onClose}
    >
      <div
        data-surface="modal-panel"
        className="ff-panel theme-surface"
        style={{ width: '80vw', maxWidth: '700px', height: 'auto', maxHeight: '80vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="modal-header" style={{ 
          padding: '1rem 1.5rem', 
          borderBottom: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.25rem', 
            fontWeight: 'bold', 
            color: '#fbbf24',
            fontFamily: "'Press Start 2P', cursive"
          }}>
            📊 Terrain Analysis
          </h2>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '0.25rem',
              lineHeight: 1
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
          >
            ×
          </button>
        </div>

        {/* Summary Cards */}
        <div style={{ 
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1f2937, #374151)',
            border: '1px solid #4b5563',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa' }}>
              {analysisData.totalTiles.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginTop: '0.25rem' }}>
              Total Tiles
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>
              {mapData.width} × {mapData.height}
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #1f2937, #374151)',
            border: '1px solid #4b5563',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>
              {analysisData.uniqueBiomes}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginTop: '0.25rem' }}>
              Unique Biomes
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>
              Different terrain types
            </div>
          </div>
          
          <div style={{
            background: 'linear-gradient(135deg, #1f2937, #374151)',
            border: '1px solid #4b5563',
            borderRadius: '0.5rem',
            padding: '1rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>
              {analysisData.urbanAreas}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#d1d5db', marginTop: '0.25rem' }}>
              Urban Areas
            </div>
            <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.125rem' }}>
              Settlement tiles
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ 
          padding: '0 1.5rem 1.5rem',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.875rem'
          }}>
            <thead>
              <tr style={{ 
                borderBottom: '2px solid #374151',
                background: 'linear-gradient(135deg, #111827, #1f2937)'
              }}>
                <th style={{ 
                  padding: '0.75rem 0.5rem', 
                  textAlign: 'left',
                  color: '#d1d5db',
                  fontWeight: '600',
                  width: '60px'
                }}>
                  Color
                </th>
                <th 
                  onClick={() => handleSort('biomeType')}
                  style={{ 
                    padding: '0.75rem 0.5rem', 
                    textAlign: 'left',
                    color: sortKey === 'biomeType' ? '#fbbf24' : '#d1d5db',
                    fontWeight: '600',
                    cursor: 'pointer',
                    userSelect: 'none',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Biome Type
                  <span style={{ 
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#9ca3af'
                  }}>
                    {sortKey === 'biomeType' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('count')}
                  style={{ 
                    padding: '0.75rem 0.5rem', 
                    textAlign: 'right',
                    color: sortKey === 'count' ? '#fbbf24' : '#d1d5db',
                    fontWeight: '600',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Count
                  <span style={{ 
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#9ca3af'
                  }}>
                    {sortKey === 'count' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
                <th 
                  onClick={() => handleSort('percentage')}
                  style={{ 
                    padding: '0.75rem 0.5rem', 
                    textAlign: 'right',
                    color: sortKey === 'percentage' ? '#fbbf24' : '#d1d5db',
                    fontWeight: '600',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#374151'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  Percentage
                  <span style={{ 
                    marginLeft: '0.5rem',
                    fontSize: '0.75rem',
                    color: '#9ca3af'
                  }}>
                    {sortKey === 'percentage' ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedBiomeStats.map(({ biome, count, percentage, color }, index) => (
                <tr 
                  key={biome}
                  style={{ 
                    borderBottom: '1px solid #374151',
                    background: index % 2 === 0 ? 'transparent' : 'rgba(55, 65, 81, 0.3)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(75, 85, 99, 0.5)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(55, 65, 81, 0.3)'}
                >
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: color,
                      border: '1px solid #6b7280',
                      borderRadius: '3px'
                    }}></div>
                  </td>
                  <td style={{ 
                    padding: '0.75rem 0.5rem',
                    color: '#e5e7eb',
                    fontWeight: '500'
                  }}>
                    {formatBiomeName(biome)}
                  </td>
                  <td style={{ 
                    padding: '0.75rem 0.5rem', 
                    textAlign: 'right',
                    color: '#d1d5db',
                    fontFamily: 'monospace'
                  }}>
                    {count.toLocaleString()}
                  </td>
                  <td style={{ 
                    padding: '0.75rem 0.5rem', 
                    textAlign: 'right',
                    color: '#d1d5db',
                    fontFamily: 'monospace'
                  }}>
                    {percentage.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid #374151',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.75rem',
          color: '#9ca3af'
        }}>
          <span>Click column headers to sort data</span>
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};

export default MapDetailsModal;
