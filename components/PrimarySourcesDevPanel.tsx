import React, { useState, useEffect, useMemo } from 'react';
import { X, BookOpen, Search, Filter, RefreshCw, Database, FileText, Tag, Clock, Globe, Eye, Zap } from 'lucide-react';
import { primarySourceService, PrimarySourceMetadata } from '../services/primarySourceService';
import { useUI } from '../contexts/UIContext';
import { HistoricalEra } from '../types';

interface PrimarySourcesDevPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type CulturalZone = 'EUROPEAN' | 'EAST_ASIAN' | 'MENA' | 'NORTH_AMERICAN_PRE_COLUMBIAN' | 'NORTH_AMERICAN_COLONIAL' | 'OCEANIA' | 'SOUTH_ASIAN' | 'SOUTH_AMERICAN' | 'SUB_SAHARAN_AFRICAN';

interface ShardInfo {
  name: string;
  path: string;
  sourceCount: number;
  loadedSuccessfully: boolean;
  era?: HistoricalEra;
  zone?: CulturalZone;
  sources: PrimarySourceMetadata[];
}

export const PrimarySourcesDevPanel: React.FC<PrimarySourcesDevPanelProps> = ({
  isOpen,
  onClose
}) => {
  const { setSelectedPrimarySource } = useUI();
  const [allSources, setAllSources] = useState<PrimarySourceMetadata[]>([]);
  const [shardInfo, setShardInfo] = useState<ShardInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState<HistoricalEra | 'ALL'>('ALL');
  const [selectedZone, setSelectedZone] = useState<CulturalZone | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'sources' | 'shards'>('sources');

  const eras: (HistoricalEra | 'ALL')[] = ['ALL', 'PREHISTORY', 'ANTIQUITY', 'MEDIEVAL', 'RENAISSANCE_EARLY_MODERN', 'INDUSTRIAL_ERA', 'MODERN_ERA', 'FUTURE_ERA'];
  const zones: (CulturalZone | 'ALL')[] = ['ALL', 'EUROPEAN', 'EAST_ASIAN', 'MENA', 'NORTH_AMERICAN_PRE_COLUMBIAN', 'NORTH_AMERICAN_COLONIAL', 'OCEANIA', 'SOUTH_ASIAN', 'SOUTH_AMERICAN', 'SUB_SAHARAN_AFRICAN'];

  // Map zones to folder names for detecting shards
  const zoneToFolder: Record<CulturalZone, string> = {
    'EUROPEAN': 'europe',
    'EAST_ASIAN': 'asia',
    'SOUTH_ASIAN': 'asia',
    'MENA': 'mena',
    'NORTH_AMERICAN_PRE_COLUMBIAN': 'north-america',
    'NORTH_AMERICAN_COLONIAL': 'north-america',
    'SOUTH_AMERICAN': 'south-america',
    'SUB_SAHARAN_AFRICAN': 'sub-saharan-africa',
    'OCEANIA': 'oceania'
  };

  const eraToSuffix: Record<HistoricalEra, string> = {
    'PREHISTORY': 'prehistory',
    'ANTIQUITY': 'antiquity',
    'MEDIEVAL': 'medieval',
    'RENAISSANCE_EARLY_MODERN': 'renaissance-early-modern',
    'INDUSTRIAL_ERA': 'industrial',
    'MODERN_ERA': 'modern',
    'FUTURE_ERA': 'future'
  };

  // Load all available shards and their data
  const loadAllShards = async () => {
    setLoading(true);
    const shards: ShardInfo[] = [];
    
    // Generate all possible shard combinations
    for (const zone of Object.keys(zoneToFolder) as CulturalZone[]) {
      for (const era of Object.keys(eraToSuffix) as HistoricalEra[]) {
        const folder = zoneToFolder[zone];
        const suffix = eraToSuffix[era];
        const shardName = `${folder}-${suffix}`;
        const shardPath = `/sources/metadata/${shardName}.json`;
        
        try {
          const response = await fetch(shardPath);
          if (response.ok) {
            const data = await response.json();
            const sources = data.sources || [];
            
            shards.push({
              name: shardName,
              path: shardPath,
              sourceCount: sources.length,
              loadedSuccessfully: true,
              era,
              zone,
              sources
            });
          } else {
            shards.push({
              name: shardName,
              path: shardPath,
              sourceCount: 0,
              loadedSuccessfully: false,
              era,
              zone,
              sources: []
            });
          }
        } catch (error) {
          shards.push({
            name: shardName,
            path: shardPath,
            sourceCount: 0,
            loadedSuccessfully: false,
            era,
            zone,
            sources: []
          });
        }
      }
    }
    
    setShardInfo(shards);
    
    // Collect all sources from loaded shards
    const allLoadedSources: PrimarySourceMetadata[] = [];
    shards.forEach(shard => {
      if (shard.loadedSuccessfully) {
        allLoadedSources.push(...shard.sources);
      }
    });
    
    setAllSources(allLoadedSources);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadAllShards();
    }
  }, [isOpen]);

  // Filter sources based on search and filters
  const filteredSources = useMemo(() => {
    let filtered = allSources;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(source =>
        source.title.toLowerCase().includes(query) ||
        source.author.toLowerCase().includes(query) ||
        source.keywords.some(k => k.toLowerCase().includes(query)) ||
        source.excerpt.toLowerCase().includes(query) ||
        source.id.toLowerCase().includes(query)
      );
    }

    // Filter by era
    if (selectedEra !== 'ALL') {
      filtered = filtered.filter(source => source.era === selectedEra);
    }

    // Filter by zone
    if (selectedZone !== 'ALL') {
      filtered = filtered.filter(source => 
        source.culturalZones && source.culturalZones.includes(selectedZone)
      );
    }

    return filtered.sort((a, b) => a.title.localeCompare(b.title));
  }, [allSources, searchQuery, selectedEra, selectedZone]);

  // Filter shards based on filters
  const filteredShards = useMemo(() => {
    let filtered = shardInfo;

    if (selectedEra !== 'ALL') {
      filtered = filtered.filter(shard => shard.era === selectedEra);
    }

    if (selectedZone !== 'ALL') {
      filtered = filtered.filter(shard => shard.zone === selectedZone);
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [shardInfo, selectedEra, selectedZone]);

  const stats = useMemo(() => {
    const totalShards = shardInfo.length;
    const loadedShards = shardInfo.filter(s => s.loadedSuccessfully).length;
    const totalSources = allSources.length;
    const uniqueAuthors = new Set(allSources.map(s => s.author)).size;
    const avgKeywordsPerSource = totalSources > 0 ? allSources.reduce((sum, s) => sum + s.keywords.length, 0) / totalSources : 0;
    
    const eraDistribution: Record<string, number> = {};
    const zoneDistribution: Record<string, number> = {};
    
    allSources.forEach(source => {
      eraDistribution[source.era] = (eraDistribution[source.era] || 0) + 1;
      source.culturalZones?.forEach(zone => {
        zoneDistribution[zone] = (zoneDistribution[zone] || 0) + 1;
      });
    });

    return {
      totalShards,
      loadedShards,
      totalSources,
      uniqueAuthors,
      avgKeywordsPerSource: Math.round(avgKeywordsPerSource * 10) / 10,
      eraDistribution,
      zoneDistribution
    };
  }, [shardInfo, allSources]);

  const handleSourceClick = (source: PrimarySourceMetadata) => {
    setSelectedPrimarySource(source);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Database className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-semibold text-white">Primary Sources Dev Panel</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>{stats.totalSources} sources</span>
              <span>•</span>
              <span>{stats.loadedShards}/{stats.totalShards} shards</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b border-slate-700 space-y-4">
          {/* View Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('sources')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'sources' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Sources ({filteredSources.length})
            </button>
            <button
              onClick={() => setViewMode('shards')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'shards' 
                  ? 'bg-amber-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Shards ({filteredShards.length})
            </button>
            <button
              onClick={loadAllShards}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Reload
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search sources by title, author, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
            
            <select
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value as HistoricalEra | 'ALL')}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-amber-500"
            >
              {eras.map(era => (
                <option key={era} value={era}>{era}</option>
              ))}
            </select>
            
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value as CulturalZone | 'ALL')}
              className="px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm focus:border-amber-500"
            >
              {zones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 text-sm">
            <div className="bg-slate-800 rounded-lg px-3 py-2">
              <span className="text-slate-400">Authors: </span>
              <span className="text-white font-medium">{stats.uniqueAuthors}</span>
            </div>
            <div className="bg-slate-800 rounded-lg px-3 py-2">
              <span className="text-slate-400">Avg Keywords: </span>
              <span className="text-white font-medium">{stats.avgKeywordsPerSource}</span>
            </div>
            <div className="bg-slate-800 rounded-lg px-3 py-2">
              <span className="text-slate-400">Load Success: </span>
              <span className="text-white font-medium">
                {stats.totalShards > 0 ? Math.round((stats.loadedShards / stats.totalShards) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-slate-400 flex items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin" />
                Loading all shards...
              </div>
            </div>
          ) : viewMode === 'sources' ? (
            <div className="space-y-3">
              {filteredSources.map((source) => (
                <div
                  key={source.id}
                  className="bg-slate-800/50 rounded-lg border border-slate-700 p-4 hover:border-amber-500/50 transition-all cursor-pointer group"
                  onClick={() => handleSourceClick(source)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
                      {source.title}
                    </h3>
                    <Eye className="w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors" />
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> {source.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {source.year < 0 ? `${Math.abs(source.year)} BCE` : `${source.year} CE`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {source.culturalZones?.join(', ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-slate-300 mb-2 line-clamp-2">
                    {source.excerpt}
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3 text-slate-500" />
                    <div className="flex flex-wrap gap-1">
                      {source.keywords.slice(0, 5).map((keyword, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-700 rounded text-xs text-slate-300">
                          {keyword}
                        </span>
                      ))}
                      {source.keywords.length > 5 && (
                        <span className="px-2 py-1 text-xs text-slate-400">
                          +{source.keywords.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-slate-600">
                    ID: {source.id} | Era: {source.era}
                  </div>
                </div>
              ))}
              
              {filteredSources.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No sources found matching your criteria.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredShards.map((shard) => (
                <div
                  key={shard.name}
                  className={`rounded-lg border p-4 ${
                    shard.loadedSuccessfully 
                      ? 'bg-slate-800/50 border-slate-700 hover:border-green-500/50' 
                      : 'bg-red-900/20 border-red-700/50'
                  } transition-all`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold ${
                      shard.loadedSuccessfully ? 'text-white' : 'text-red-400'
                    }`}>
                      {shard.name}
                    </h3>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      shard.loadedSuccessfully 
                        ? 'bg-green-900/50 text-green-300' 
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {shard.loadedSuccessfully ? 'Loaded' : 'Failed'}
                    </div>
                  </div>
                  
                  <div className="text-sm text-slate-400 mb-2">
                    <code className="bg-slate-900/50 px-2 py-1 rounded text-xs">{shard.path}</code>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Era: {shard.era}</span>
                    <span>Zone: {shard.zone}</span>
                    <span>Sources: {shard.sourceCount}</span>
                  </div>
                </div>
              ))}
              
              {filteredShards.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No shards found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};