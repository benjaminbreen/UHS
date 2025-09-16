/**
 * Source Collection Panel
 * Displays the player's discovered primary sources with filtering and stats
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaBook, 
  FaTrophy, 
  FaSearch, 
  FaFilter,
  FaStar,
  FaGraduationCap,
  FaChartLine,
  FaCalendarAlt,
  FaMapMarkedAlt,
  FaBookmark,
  FaStickyNote,
  FaTimes
} from 'react-icons/fa';
import { sourceDiscoveryService, DiscoveryStats, DiscoveredSource } from '../services/sourceDiscoveryService';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';
import PrimarySourceModal from './PrimarySourceModal';

interface SourceCollectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear?: number;
  currentZone?: string;
}

type FilterType = 'all' | 'era' | 'zone' | 'recent' | 'favorites';
type SortType = 'discovery' | 'year' | 'title' | 'reads';

const SourceCollectionPanel: React.FC<SourceCollectionPanelProps> = ({
  isOpen,
  onClose,
  currentYear,
  currentZone
}) => {
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [discoveredSources, setDiscoveredSources] = useState<Map<string, DiscoveredSource>>(new Map());
  const [sourceMetadata, setSourceMetadata] = useState<Map<string, PrimarySourceMetadata>>(new Map());
  const [selectedSource, setSelectedSource] = useState<PrimarySourceMetadata | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('discovery');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNotes, setShowNotes] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      loadDiscoveryData();
    }
  }, [isOpen]);
  
  const loadDiscoveryData = async () => {
    // Get discovery stats and discovered sources
    const stats = sourceDiscoveryService.getDiscoveryStats();
    setStats(stats);
    
    const discovered = sourceDiscoveryService.getDiscoveredSources();
    setDiscoveredSources(discovered);
    
    // Load metadata for discovered sources
    const metadata = new Map<string, PrimarySourceMetadata>();
    for (const [sourceId] of discovered) {
      // This would need to be implemented in primarySourceService
      // For now, we'll use a placeholder
      const source = await loadSourceMetadata(sourceId);
      if (source) {
        metadata.set(sourceId, source);
      }
    }
    setSourceMetadata(metadata);
  };
  
  const loadSourceMetadata = async (sourceId: string): Promise<PrimarySourceMetadata | null> => {
    // This would need to be implemented to fetch source by ID
    // For now, return a placeholder
    const allSources = await primarySourceService.getAllLoadedSources();
    return allSources.find(s => s.id === sourceId) || null;
  };
  
  const filteredAndSortedSources = useMemo(() => {
    let sources = Array.from(discoveredSources.entries())
      .map(([id, discovered]) => ({
        id,
        discovered,
        metadata: sourceMetadata.get(id)
      }))
      .filter(item => item.metadata); // Only show sources with metadata
    
    // Apply search filter
    if (searchTerm) {
      sources = sources.filter(item => 
        item.metadata!.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metadata!.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.metadata!.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply type filter
    switch (filterType) {
      case 'recent':
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        sources = sources.filter(item => item.discovered.discoveredAt > oneWeekAgo);
        break;
      case 'favorites':
        sources = sources.filter(item => item.discovered.readCount > 2);
        break;
      case 'era':
        if (currentYear) {
          sources = sources.filter(item => {
            const sourceYear = item.metadata!.year;
            return Math.abs(sourceYear - currentYear) < 100;
          });
        }
        break;
      case 'zone':
        if (currentZone) {
          sources = sources.filter(item => 
            item.metadata!.culturalZones.includes(currentZone)
          );
        }
        break;
    }
    
    // Apply sorting
    switch (sortType) {
      case 'discovery':
        sources.sort((a, b) => b.discovered.discoveredAt - a.discovered.discoveredAt);
        break;
      case 'year':
        sources.sort((a, b) => a.metadata!.year - b.metadata!.year);
        break;
      case 'title':
        sources.sort((a, b) => a.metadata!.title.localeCompare(b.metadata!.title));
        break;
      case 'reads':
        sources.sort((a, b) => b.discovered.readCount - a.discovered.readCount);
        break;
    }
    
    return sources;
  }, [discoveredSources, sourceMetadata, searchTerm, filterType, sortType, currentYear, currentZone]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-2xl w-[90%] h-[85%] max-w-7xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaBook size={24} />
            <h2 className="text-2xl font-bold">Primary Source Collection</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-white/20 p-2 rounded transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>
        
        {/* Stats Bar */}
        {stats && (
          <div className="bg-amber-100 border-b border-amber-300 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <FaGraduationCap className="text-amber-600" />
                <span className="font-semibold">{stats.scholarshipPoints} Points</span>
              </div>
              <div className="flex items-center gap-2">
                <FaTrophy className="text-yellow-600" />
                <span>{stats.totalDiscovered} Sources</span>
              </div>
              <div className="flex items-center gap-2">
                <FaChartLine className="text-green-600" />
                <span>{stats.discoveryRate.toFixed(1)} per day</span>
              </div>
              {stats.favoriteSource && (
                <div className="flex items-center gap-2">
                  <FaStar className="text-orange-500" />
                  <span>Most Read: {stats.favoriteSource}</span>
                </div>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-600">Collection Progress</span>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (stats.totalDiscovered / 200) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{Math.round((stats.totalDiscovered / 200) * 100)}%</span>
            </div>
          </div>
        )}
        
        {/* Controls Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          {/* Search */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
            <FaSearch className="text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search sources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent outline-none text-sm w-48"
            />
          </div>
          
          {/* Filters */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-gray-500" size={14} />
            <div className="flex gap-1">
              {(['all', 'recent', 'favorites', 'era', 'zone'] as FilterType[]).map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterType(filter)}
                  className={`px-3 py-1 text-xs rounded-full transition-colors ${
                    filterType === filter
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* Sort */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Sort by:</span>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="discovery">Discovery Date</option>
              <option value="year">Historical Year</option>
              <option value="title">Title</option>
              <option value="reads">Times Read</option>
            </select>
          </div>
        </div>
        
        {/* Sources Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredAndSortedSources.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <FaBook size={48} className="mb-4 opacity-50" />
              <p className="text-lg">No sources found</p>
              <p className="text-sm mt-2">Explore ruins and ancient sites to discover primary sources!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedSources.map(({ id, discovered, metadata }) => (
                <div
                  key={id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
                  onClick={() => metadata && setSelectedSource(metadata)}
                >
                  {/* Read count badge */}
                  {discovered.readCount > 1 && (
                    <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                      Read {discovered.readCount}x
                    </div>
                  )}
                  
                  {/* Source info */}
                  <h3 className="font-semibold text-sm mb-1 pr-12">{metadata?.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    {metadata?.author} • {metadata?.year}
                  </p>
                  
                  {/* Excerpt */}
                  <p className="text-xs text-gray-700 line-clamp-3 mb-3">
                    {metadata?.excerpt}
                  </p>
                  
                  {/* Discovery info */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <FaMapMarkedAlt size={10} />
                      <span>{discovered.discoveredLocation}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FaCalendarAlt size={10} />
                      <span>Year {discovered.discoveredYear}</span>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNotes(showNotes === id ? null : id);
                      }}
                      className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      <FaStickyNote size={10} />
                      Notes {discovered.notes ? `(${discovered.notes.length})` : ''}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Toggle bookmark (would need to implement)
                      }}
                      className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                    >
                      <FaBookmark size={10} />
                      Bookmark
                    </button>
                  </div>
                  
                  {/* Notes dropdown */}
                  {showNotes === id && discovered.notes && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                      {discovered.notes.map((note, i) => (
                        <p key={i} className="mb-1">• {note}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Achievement hints */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-t border-amber-300 px-4 py-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">Next Achievement:</span>
              {stats && (
                <span className="font-semibold text-amber-700">
                  {stats.totalDiscovered < 10 && `Budding Scholar (${10 - stats.totalDiscovered} more sources)`}
                  {stats.totalDiscovered >= 10 && stats.totalDiscovered < 25 && `Dedicated Researcher (${25 - stats.totalDiscovered} more sources)`}
                  {stats.totalDiscovered >= 25 && stats.totalDiscovered < 50 && `Master Historian (${50 - stats.totalDiscovered} more sources)`}
                  {stats.totalDiscovered >= 50 && stats.totalDiscovered < 100 && `Living Library (${100 - stats.totalDiscovered} more sources)`}
                  {stats.totalDiscovered >= 100 && `Complete! You are a Living Library!`}
                </span>
              )}
            </div>
            <div className="text-gray-500">
              Tip: Explore ruins and ancient sites to discover more sources!
            </div>
          </div>
        </div>
      </div>
      
      {/* Source Modal */}
      {selectedSource && (
        <PrimarySourceModal
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </div>
  );
};

export default SourceCollectionPanel;