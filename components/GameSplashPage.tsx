/**
 * GameSplashPage.tsx
 *
 * A clean landing page that presents three ways to start the game:
 * 1. WorldWeaver - Text prompt to describe your desired experience (top bar)
 * 2. Random - Procedurally generated character and setting (left)
 * 3. Historical Figures - Play as one of 20 documented people from the ancient world (right)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shuffle, Sparkles, Users, ArrowRight, Clock, MapPin,
  Scroll, ChevronDown, ChevronUp, Loader2, Search, ExternalLink
} from 'lucide-react';
import {
  HISTORICAL_FIGURES,
  HistoricalFigure,
  formatHistoricalYear,
  getHistoricalFiguresByRegion
} from '../constants/historicalFigures';
import { shareableStateService, ShareableGameState } from '../services/shareableStateService';
import { worldWeaverService } from '../services/worldWeaverService';
import { selectGameModeForProfession } from '../constants/gameData/professionGameModeMappings';
import { getWikipediaPageInfo, getWikipediaUrl } from '../services/wikipediaService';
import AtmosphericBackground from './AtmosphericBackground';

// Generate a random map seed
const generateMapSeed = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Random map areas for procedural generation
const RANDOM_MAP_AREAS = [
  'Paris Basin', 'Rhine Valley', 'London', 'Roman Campagna', 'Venetian Lagoon',
  'North China Plain', 'Yellow River Delta', 'Kyoto Valleys', 'Seoul Area',
  'Mesopotamian Plain', 'Nile Delta', 'Damascus Region', 'Levantine Coast',
  'Great Plains', 'Eastern Woodlands', 'California Coast', 'Mississippi Delta',
  'Amazon Basin', 'Andean Highlands', 'Pampas', 'Ethiopian Highlands',
  'Ganges Plain', 'Deccan Plateau', 'Bengal Delta', 'Canterbury Plains'
];

const GameSplashPage: React.FC = () => {
  const navigate = useNavigate();

  // WorldWeaver state
  const [worldWeaverPrompt, setWorldWeaverPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [worldWeaverError, setWorldWeaverError] = useState<string | null>(null);

  // Historical figures state
  const [expandedRegion, setExpandedRegion] = useState<string | null>('Mesopotamia & Near East');
  const [selectedFigure, setSelectedFigure] = useState<HistoricalFigure | null>(null);
  const [figureSearch, setFigureSearch] = useState('');

  // Wikipedia state
  const [wikipediaInfo, setWikipediaInfo] = useState<{
    thumbnail?: string;
    pageUrl?: string;
    loading: boolean;
  }>({ loading: false });

  // Fetch Wikipedia info when a figure is selected
  useEffect(() => {
    if (selectedFigure?.wikipediaTitle) {
      setWikipediaInfo({ loading: true });
      getWikipediaPageInfo(selectedFigure.wikipediaTitle)
        .then(info => {
          setWikipediaInfo({
            thumbnail: info?.thumbnail?.source,
            pageUrl: info?.pageUrl || getWikipediaUrl(selectedFigure.wikipediaTitle!),
            loading: false
          });
        })
        .catch(() => {
          setWikipediaInfo({
            pageUrl: getWikipediaUrl(selectedFigure.wikipediaTitle!),
            loading: false
          });
        });
    } else {
      setWikipediaInfo({ loading: false });
    }
  }, [selectedFigure]);

  // Filter figures by search
  const filteredFigures = figureSearch.trim()
    ? HISTORICAL_FIGURES.filter(f =>
        f.name.toLowerCase().includes(figureSearch.toLowerCase()) ||
        f.profession.toLowerCase().includes(figureSearch.toLowerCase()) ||
        f.tagline.toLowerCase().includes(figureSearch.toLowerCase())
      )
    : null;

  // Start a random game
  const handleRandomGame = useCallback(() => {
    const year = Math.floor(Math.random() * 5000) - 3000; // -3000 to 2000
    const mapArea = RANDOM_MAP_AREAS[Math.floor(Math.random() * RANDOM_MAP_AREAS.length)];
    const gameMode = 'exploration';

    const simpleUrl = `/${year}/${encodeURIComponent(mapArea)}/${gameMode}`;
    navigate(simpleUrl);
  }, [navigate]);

  // Process WorldWeaver prompt
  const handleWorldWeaver = useCallback(async () => {
    if (!worldWeaverPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setWorldWeaverError(null);

    try {
      const result = await worldWeaverService.interpretPrompt(worldWeaverPrompt);

      if (result.success && result.year && result.mapArea) {
        const gameMode = result.gameMode?.id ||
          (result.characterSpec?.profession
            ? selectGameModeForProfession(result.characterSpec.profession)
            : 'exploration');

        const gameState: ShareableGameState = {
          year: result.year,
          month: Math.floor(Math.random() * 12) + 1,
          day: Math.floor(Math.random() * 28) + 1,
          mapArea: result.mapArea,
          zone: result.zone || 'EUROPEAN',
          gameMode: gameMode,
          character: {
            name: result.characterSpec?.name || 'Traveler',
            profession: result.characterSpec?.profession || 'Traveler',
            gender: result.characterSpec?.gender || (Math.random() > 0.5 ? 'male' : 'female'),
            age: result.characterSpec?.age || Math.floor(Math.random() * 40) + 20,
            socialClass: result.characterSpec?.socialClass,
            health: result.characterSpec?.health
          },
          mapSeed: generateMapSeed(),
          scenarioType: 'worldweaver',
          scenarioPrompt: worldWeaverPrompt,
          version: '1.0.0'
        };

        const encodedState = shareableStateService.encodeGameState(gameState);
        const url = `/${result.year}/${encodeURIComponent(result.mapArea)}/${gameMode}?state=${encodedState}`;
        navigate(url);
      } else {
        setWorldWeaverError(result.errorMessage || 'Could not interpret your prompt. Try being more specific about time and place.');
      }
    } catch (error) {
      console.error('WorldWeaver error:', error);
      setWorldWeaverError('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [worldWeaverPrompt, isGenerating, navigate]);

  // Start game as historical figure
  const handleHistoricalFigure = useCallback((figure: HistoricalFigure) => {
    const gameMode = selectGameModeForProfession(figure.profession);

    const gameState: ShareableGameState = {
      year: figure.year,
      month: Math.floor(Math.random() * 12) + 1,
      day: Math.floor(Math.random() * 28) + 1,
      mapArea: figure.mapArea,
      zone: figure.culturalZone,
      gameMode: gameMode,
      character: {
        name: figure.name,
        profession: figure.profession,
        gender: figure.gender,
        age: figure.age,
        socialClass: figure.portraitHints?.socialClass
      },
      mapSeed: generateMapSeed(),
      scenarioType: 'custom',
      scenarioPrompt: `Playing as ${figure.name}, ${figure.profession}. ${figure.biography}`,
      version: '1.0.0'
    };

    const encodedState = shareableStateService.encodeGameState(gameState);
    const url = `/${figure.year}/${encodeURIComponent(figure.mapArea)}/${gameMode}?state=${encodedState}`;
    navigate(url);
  }, [navigate]);

  const figuresByRegion = getHistoricalFiguresByRegion();

  return (
    <div className="min-h-screen relative bg-slate-900 overflow-y-auto">
      {/* Pixel art background without text overlay */}
      <div className="fixed inset-0 z-0">
        <AtmosphericBackground showTextOverlay={false} />
      </div>

      <div className="relative z-10 flex flex-col pb-8">
        {/* Header with pixel art title */}
        <header className="pt-12 pb-6 px-4 text-center">
          <h1
            className="text-3xl md:text-4xl lg:text-5xl text-white mb-3 tracking-wider"
            style={{
              fontFamily: "'Press Start 2P', monospace",
              textShadow: '3px 3px 0 #1e293b, 6px 6px 0 rgba(0,0,0,0.3)'
            }}
          >
            HISTORY SIMULATOR
          </h1>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            An educational simulation exploring human history across time and culture
          </p>
        </header>

        {/* WorldWeaver bar - compact horizontal at top */}
        <div className="px-4 mb-6 max-w-4xl mx-auto w-full">
          <div className="bg-slate-800/80 backdrop-blur-sm rounded-lg border border-violet-500/30 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>

              <div className="flex-1 flex items-center gap-3">
                <input
                  type="text"
                  value={worldWeaverPrompt}
                  onChange={(e) => setWorldWeaverPrompt(e.target.value)}
                  placeholder="Describe a world... 'A silk road merchant in 1200s Central Asia' or 'A Roman soldier on Hadrian's Wall'"
                  className="flex-1 px-4 py-2.5 bg-slate-900/60 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleWorldWeaver();
                    }
                  }}
                />

                <button
                  onClick={handleWorldWeaver}
                  disabled={!worldWeaverPrompt.trim() || isGenerating}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all duration-200 flex items-center gap-2 text-sm flex-shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Weaving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create World</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {worldWeaverError && (
              <p className="mt-2 text-sm text-red-400 ml-13">{worldWeaverError}</p>
            )}
          </div>
        </div>

        {/* Main Content - Two columns side by side */}
        <main className="flex-1 px-4 pb-6 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Left Column: Random Game */}
            <section className="bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Shuffle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Random Journey</h2>
                  <p className="text-sm text-slate-400">Surprise yourself</p>
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-6 flex-1">
                Be dropped into a random time and place with a procedurally generated character.
                Every playthrough is unique.
              </p>

              <button
                onClick={handleRandomGame}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                <span>Begin Random Journey</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </section>

            {/* Right Column: Historical Figures */}
            <section className="bg-slate-800/70 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Historical Figures</h2>
                  <p className="text-sm text-slate-400">3000 BCE - 1 CE</p>
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={figureSearch}
                  onChange={(e) => setFigureSearch(e.target.value)}
                  placeholder="Search figures..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              {/* Figures List */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[280px]">
                {filteredFigures ? (
                  // Search results
                  filteredFigures.length > 0 ? (
                    filteredFigures.map(figure => (
                      <FigureCard
                        key={figure.id}
                        figure={figure}
                        isSelected={selectedFigure?.id === figure.id}
                        onSelect={() => setSelectedFigure(selectedFigure?.id === figure.id ? null : figure)}
                        onStart={() => handleHistoricalFigure(figure)}
                      />
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm text-center py-4">No figures match your search</p>
                  )
                ) : (
                  // Grouped by region
                  Object.entries(figuresByRegion).map(([region, figures]) => (
                    figures.length > 0 && (
                      <div key={region}>
                        <button
                          onClick={() => setExpandedRegion(expandedRegion === region ? null : region)}
                          className="w-full flex items-center justify-between py-2 px-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        >
                          <span>{region}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">{figures.length}</span>
                            {expandedRegion === region ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {expandedRegion === region && (
                          <div className="mt-1 space-y-1 pl-2">
                            {figures.map(figure => (
                              <FigureCard
                                key={figure.id}
                                figure={figure}
                                isSelected={selectedFigure?.id === figure.id}
                                onSelect={() => setSelectedFigure(selectedFigure?.id === figure.id ? null : figure)}
                                onStart={() => handleHistoricalFigure(figure)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Selected Figure Detail Panel */}
          {selectedFigure && (
            <div className="mt-6 bg-slate-800/90 backdrop-blur-sm rounded-xl border border-amber-500/30 p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Wikipedia Thumbnail */}
                <div className="md:w-48 flex-shrink-0">
                  {wikipediaInfo.loading ? (
                    <div className="w-full h-48 bg-slate-700/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-slate-500 animate-spin" />
                    </div>
                  ) : wikipediaInfo.thumbnail ? (
                    <div className="relative">
                      <img
                        src={wikipediaInfo.thumbnail}
                        alt={selectedFigure.name}
                        className="w-full h-auto rounded-lg object-cover border border-slate-600"
                        style={{ maxHeight: '200px' }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg">
                        <span className="text-xs text-slate-300">via Wikipedia</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-slate-700/50 rounded-lg flex items-center justify-center">
                      <Users className="w-12 h-12 text-slate-600" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedFigure.name}</h3>
                      <p className="text-amber-400">{selectedFigure.profession} &middot; {formatHistoricalYear(selectedFigure.year)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFigure(null)}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                  </div>

                  <p className="text-slate-300 mb-4">{selectedFigure.biography}</p>

                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {selectedFigure.mapArea}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Age {selectedFigure.age}
                    </span>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <Scroll className="w-3 h-3" />
                      <span>Historical Note</span>
                    </div>
                    <p className="text-sm text-slate-400">{selectedFigure.historicalNote}</p>
                  </div>

                  {/* Wikipedia Link */}
                  {wikipediaInfo.pageUrl && (
                    <a
                      href={wikipediaInfo.pageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors mb-4"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Read more on Wikipedia</span>
                    </a>
                  )}
                </div>

                <div className="md:w-56 flex flex-col justify-end">
                  <button
                    onClick={() => handleHistoricalFigure(selectedFigure)}
                    className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group text-lg"
                  >
                    <span>Live as {selectedFigure.name}</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer with attribution */}
        <footer className="py-6 px-4 text-center border-t border-slate-800/50">
          <p className="text-sm text-slate-400 mb-1">
            Created by <span className="text-slate-300">Benjamin Breen</span> at UC Santa Cruz using Claude Code
          </p>
          <p className="text-xs text-slate-500 max-w-lg mx-auto">
            An educational tool for history enthusiasts and exploratory learning through AI-powered simulation
          </p>
        </footer>
      </div>

      {/* Load Press Start 2P font */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        `
      }} />
    </div>
  );
};

// Figure card component
interface FigureCardProps {
  figure: HistoricalFigure;
  isSelected: boolean;
  onSelect: () => void;
  onStart: () => void;
}

const FigureCard: React.FC<FigureCardProps> = ({ figure, isSelected, onSelect, onStart }) => {
  return (
    <div
      className={`
        p-3 rounded-lg border transition-all duration-200 cursor-pointer
        ${isSelected
          ? 'bg-amber-500/10 border-amber-500/50'
          : 'bg-slate-900/30 border-slate-700/50 hover:bg-slate-700/30 hover:border-slate-600'
        }
      `}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-white truncate">{figure.name}</h4>
            <span className="text-xs text-slate-500 flex-shrink-0">
              {formatHistoricalYear(figure.year)}
            </span>
          </div>
          <p className="text-xs text-slate-400 truncate">{figure.tagline}</p>
        </div>

        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onStart();
            }}
            className="ml-3 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1"
          >
            <span>Play</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};

export default GameSplashPage;
