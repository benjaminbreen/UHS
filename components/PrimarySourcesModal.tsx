import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Filter, ExternalLink, Calendar, MapPin, Tag } from 'lucide-react';

interface PrimarySource {
  id: string;
  title: string;
  author: string;
  year: number | string;
  era: string;
  culturalZones: string[];
  excerpt: string;
  keywords: string[];
  wikisourceTitle?: string;
  internetArchiveId?: string;
  citation?: {
    translator?: string;
    originalPublication?: string;
    modernSource?: string;
  };
  region?: string;
}

interface PrimarySourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const REGION_MAPPING = {
  'asia': 'Asia',
  'europe': 'Europe',
  'mena': 'MENA',
  'north-america': 'North America',
  'south-america': 'South America',
  'sub-saharan-africa': 'Sub-Saharan Africa',
  'oceania': 'Oceania'
};

const ERA_MAPPING = {
  'PREHISTORY': 'Prehistory',
  'ANTIQUITY': 'Antiquity',
  'ANCIENT': 'Antiquity',
  'MEDIEVAL': 'Medieval',
  'RENAISSANCE_EARLY-MODERN': 'Renaissance/Early Modern',
  'RENAISSANCE_EARLY_MODERN': 'Renaissance/Early Modern',
  'INDUSTRIAL': 'Industrial',
  'MODERN': 'Modern',
  'FUTURE': 'Future'
};

export const PrimarySourcesModal: React.FC<PrimarySourcesModalProps> = ({ isOpen, onClose }) => {
  const [sources, setSources] = useState<PrimarySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedEra, setSelectedEra] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'year' | 'author' | 'region'>('year');

  useEffect(() => {
    if (isOpen) {
      loadAllSources();
    }
  }, [isOpen]);

  const loadAllSources = async () => {
    setLoading(true);
    const allSources: PrimarySource[] = [];

    // Load sources from all metadata files
    const regions = ['asia', 'europe', 'mena', 'north-america', 'south-america', 'sub-saharan-africa', 'oceania'];
    const eras = ['prehistory', 'antiquity', 'medieval', 'renaissance-early-modern', 'industrial', 'modern', 'future'];

    try {
      for (const region of regions) {
        for (const era of eras) {
          try {
            const response = await fetch(`/sources/metadata/${region}-${era}.json`);
            if (response.ok) {
              const data = await response.json();
              const regionSources = data.sources || [];

              regionSources.forEach((source: any) => {
                allSources.push({
                  ...source,
                  region: REGION_MAPPING[region as keyof typeof REGION_MAPPING] || region,
                  keywords: source.keywords || []
                });
              });
            }
          } catch (error) {
            console.warn(`Failed to load ${region}-${era}:`, error);
          }
        }
      }

      setSources(allSources);
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedSources = useMemo(() => {
    let filtered = sources;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(source =>
        source.title.toLowerCase().includes(search) ||
        source.author.toLowerCase().includes(search) ||
        source.keywords.some(keyword => keyword.toLowerCase().includes(search)) ||
        source.excerpt.toLowerCase().includes(search)
      );
    }

    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(source => source.region === selectedRegion);
    }

    // Filter by era
    if (selectedEra !== 'all') {
      filtered = filtered.filter(source => {
        const mappedEra = ERA_MAPPING[source.era as keyof typeof ERA_MAPPING] || source.era;
        return mappedEra === selectedEra;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'author':
          return a.author.localeCompare(b.author);
        case 'region':
          return (a.region || '').localeCompare(b.region || '');
        case 'year':
        default:
          const yearA = typeof a.year === 'number' ? a.year : parseInt(String(a.year)) || 0;
          const yearB = typeof b.year === 'number' ? b.year : parseInt(String(b.year)) || 0;
          return yearA - yearB;
      }
    });

    return filtered;
  }, [sources, searchTerm, selectedRegion, selectedEra, sortBy]);

  const formatYear = (year: number | string) => {
    const numYear = typeof year === 'number' ? year : parseInt(String(year)) || 0;
    if (numYear < 0) {
      return `${Math.abs(numYear)} BCE`;
    }
    return `${numYear} CE`;
  };

  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(sources.map(s => s.region).filter(Boolean))];
    return uniqueRegions.sort();
  }, [sources]);

  const eras = useMemo(() => {
    const uniqueEras = [...new Set(sources.map(s => ERA_MAPPING[s.era as keyof typeof ERA_MAPPING] || s.era))];
    return uniqueEras.sort();
  }, [sources]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-white">Primary Sources Library</h2>
            <p className="text-gray-300 mt-1">
              {loading ? 'Loading...' : `${filteredAndSortedSources.length} of ${sources.length} sources`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-2"
          >
            <X size={24} />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-700 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search titles, authors, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-400" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-gray-400" />
              <select
                value={selectedEra}
                onChange={(e) => setSelectedEra(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">All Eras</option>
                {eras.map(era => (
                  <option key={era} value={era}>{era}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="year">Year</option>
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="region">Region</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading primary sources...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedSources.map((source, index) => (
                <div key={`${source.id}-${index}`} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">{source.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatYear(source.year)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {source.region}
                        </span>
                        <span>{source.author}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {source.wikisourceTitle && (
                        <a
                          href={`https://en.wikisource.org/wiki/${source.wikisourceTitle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                          title="View on Wikisource"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {source.internetArchiveId && (
                        <a
                          href={`https://archive.org/details/${source.internetArchiveId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-400 hover:text-green-300"
                          title="View on Internet Archive"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                    {source.excerpt}
                  </p>

                  {source.keywords.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag size={14} className="text-gray-400" />
                      {source.keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded cursor-pointer hover:bg-gray-600"
                          onClick={() => setSearchTerm(keyword)}
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {source.citation && (
                    <div className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
                      {source.citation.translator && (
                        <div>Translated by {source.citation.translator}</div>
                      )}
                      {source.citation.originalPublication && (
                        <div>Original: {source.citation.originalPublication}</div>
                      )}
                      {source.citation.modernSource && (
                        <div>Source: {source.citation.modernSource}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {filteredAndSortedSources.length === 0 && !loading && (
                <div className="text-center text-gray-400 py-12">
                  No sources match your search criteria.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrimarySourcesModal;