/**
 * City Detail Panel - Rich educational information panel
 */

import React, { useState, useEffect } from 'react';
import { X, ExternalLink, MapPin, Users, Calendar, Globe, BookOpen, Landmark, Info, ChevronRight } from 'lucide-react';
import { CITIES_DATA as CITIES } from '../constants/gameData/cities';

interface CityDetailPanelProps {
  cityName: string;
  mapArea: string;
  foundingYear: number;
  declineYear?: number;
  region: string;
  onClose?: () => void;
  isEmbedded?: boolean; // When used as persistent side panel
}

interface WikipediaData {
  extract: string;
  fullText?: string; // Full article text
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  coordinates?: {
    lat: number;
    lon: number;
  };
  population?: string;
  country?: string;
  description?: string;
  officialWebsite?: string;
}

// Historical events database (sample - expand this)
const HISTORICAL_EVENTS: { [key: string]: { year: number; event: string }[] } = {
  'Rome': [
    { year: -753, event: 'Traditional founding of Rome by Romulus' },
    { year: -509, event: 'Roman Republic established' },
    { year: -44, event: 'Assassination of Julius Caesar' },
    { year: 476, event: 'Fall of Western Roman Empire' },
    { year: 1453, event: 'Fall of Constantinople ends Byzantine Empire' }
  ],
  'Athens': [
    { year: -508, event: 'Democracy established by Cleisthenes' },
    { year: -461, event: 'Golden Age begins under Pericles' },
    { year: -431, event: 'Peloponnesian War begins' },
    { year: -399, event: 'Trial and death of Socrates' },
    { year: -338, event: 'Conquered by Philip II of Macedon' }
  ],
  'Cairo': [
    { year: 969, event: 'Founded as al-Qāhirah by the Fatimid dynasty' },
    { year: 1171, event: 'Saladin becomes Sultan' },
    { year: 1250, event: 'Mamluk Sultanate established' },
    { year: 1517, event: 'Ottoman conquest' },
    { year: 1798, event: "Napoleon's expedition to Egypt" }
  ],
  'Beijing': [
    { year: -1045, event: 'First recorded as Ji, capital of Yan' },
    { year: 1215, event: 'Conquered by Genghis Khan' },
    { year: 1368, event: 'Becomes capital of Ming Dynasty' },
    { year: 1421, event: 'Forbidden City completed' },
    { year: 1644, event: 'Qing Dynasty takes control' }
  ]
};

// Cultural achievements database
const CULTURAL_ACHIEVEMENTS: { [key: string]: string[] } = {
  'Rome': ['Colosseum', 'Roman Law', 'Aqueduct System', 'Latin Literature', 'Roman Roads'],
  'Athens': ['Parthenon', 'Philosophy Schools', 'Olympic Games', 'Theatre', 'Democracy'],
  'Cairo': ['Al-Azhar University', 'Islamic Architecture', 'Coptic Christianity', 'Mamluk Art'],
  'Beijing': ['Forbidden City', 'Temple of Heaven', 'Great Wall Access', 'Peking Opera', 'Imperial Gardens'],
  'London': ['British Museum', 'Shakespeare\'s Globe', 'Westminster Abbey', 'Tower of London'],
  'Paris': ['Notre-Dame', 'Louvre', 'Eiffel Tower', 'Sorbonne University', 'Arc de Triomphe'],
  'Istanbul': ['Hagia Sophia', 'Topkapi Palace', 'Grand Bazaar', 'Blue Mosque', 'Bosphorus Bridge']
};

// Notable figures by city
const NOTABLE_FIGURES: { [key: string]: { name: string; years: string; role: string }[] } = {
  'Rome': [
    { name: 'Julius Caesar', years: '100-44 BCE', role: 'Military General & Dictator' },
    { name: 'Augustus', years: '63 BCE-14 CE', role: 'First Roman Emperor' },
    { name: 'Marcus Aurelius', years: '121-180 CE', role: 'Philosopher Emperor' },
    { name: 'Cicero', years: '106-43 BCE', role: 'Orator & Philosopher' }
  ],
  'Athens': [
    { name: 'Socrates', years: '470-399 BCE', role: 'Philosopher' },
    { name: 'Plato', years: '428-348 BCE', role: 'Philosopher' },
    { name: 'Aristotle', years: '384-322 BCE', role: 'Philosopher & Scientist' },
    { name: 'Pericles', years: '495-429 BCE', role: 'Statesman' }
  ],
  'Cairo': [
    { name: 'Saladin', years: '1137-1193', role: 'Sultan & Military Leader' },
    { name: 'Ibn Khaldun', years: '1332-1406', role: 'Historian & Scholar' },
    { name: 'Al-Azhar scholars', years: '970-present', role: 'Islamic Scholarship' }
  ],
  'Beijing': [
    { name: 'Kublai Khan', years: '1215-1294', role: 'Mongol Emperor' },
    { name: 'Yongle Emperor', years: '1360-1424', role: 'Ming Dynasty Emperor' },
    { name: 'Empress Dowager Cixi', years: '1835-1908', role: 'Qing Dynasty Ruler' }
  ]
};

const CityDetailPanel: React.FC<CityDetailPanelProps> = ({
  cityName,
  mapArea,
  foundingYear,
  declineYear,
  region,
  onClose,
  isEmbedded
}) => {
  const [wikiData, setWikiData] = useState<WikipediaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'culture' | 'game'>('overview');
  const [imageError, setImageError] = useState(false);

  // Fetch Wikipedia data with full article
  useEffect(() => {
    const fetchWikipediaData = async () => {
      setLoading(true);
      try {
        // Use CORS-friendly summary endpoint
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cityName)}`;
        const summaryResponse = await fetch(summaryUrl, {
          headers: {
            'Api-User-Agent': 'UniversalHistorySimulator/1.0 (https://github.com/anthropics/claude-code)'
          }
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();

          // Try to get fuller text content from the page content API
          let fullText = summaryData.extract || '';
          try {
            const contentUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(cityName)}`;
            const contentResponse = await fetch(contentUrl, {
              headers: {
                'Api-User-Agent': 'UniversalHistorySimulator/1.0 (https://github.com/anthropics/claude-code)'
              }
            });

            if (contentResponse.ok) {
              const htmlText = await contentResponse.text();
              // Extract text from HTML, focusing on paragraph content
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlText, 'text/html');
              const paragraphs = Array.from(doc.querySelectorAll('p')).slice(0, 8); // Get first 8 paragraphs

              fullText = paragraphs
                .map(p => p.textContent?.trim())
                .filter(text => text && text.length > 50) // Filter out short paragraphs
                .slice(0, 6) // Take only 6 substantial paragraphs
                .join('\n\n');
            }
          } catch (contentError) {
            console.log('Could not fetch extended content, using summary');
          }

          setWikiData({
            extract: summaryData.extract || 'No description available.',
            fullText: fullText || summaryData.extract || '',
            thumbnail: summaryData.thumbnail,
            coordinates: summaryData.coordinates,
            description: summaryData.description
          });
        } else {
          setWikiData({
            extract: `${cityName} is a historical city located in ${mapArea}. Founded around ${Math.abs(foundingYear)} ${foundingYear < 0 ? 'BCE' : 'CE'}, it has been an important center of civilization.`,
            fullText: `${cityName} is a historical city located in ${mapArea}. Founded around ${Math.abs(foundingYear)} ${foundingYear < 0 ? 'BCE' : 'CE'}, it has been an important center of civilization.`
          });
        }
      } catch (error) {
        console.error('Error fetching Wikipedia data:', error);
        setWikiData({
          extract: `${cityName} is a historical city that has played a significant role in human civilization.`,
          fullText: `${cityName} is a historical city that has played a significant role in human civilization.`
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWikipediaData();
  }, [cityName, mapArea, foundingYear]);

  // Calculate city statistics
  const lifespan = (declineYear || 2024) - foundingYear;
  const ageInYears = 2024 - foundingYear;
  const isActive = !declineYear || declineYear === 2024;

  // Get region color
  const regionColors: { [key: string]: string } = {
    'europe': 'from-blue-500 to-blue-600',
    'eastAsia': 'from-red-500 to-red-600',
    'middleEast': 'from-yellow-500 to-yellow-600',
    'southAsia': 'from-green-500 to-green-600',
    'africa': 'from-purple-500 to-purple-600',
    'americas': 'from-orange-500 to-orange-600',
    'oceania': 'from-pink-500 to-pink-600'
  };

  const regionGradient = regionColors[region] || 'from-gray-500 to-gray-600';

  if (isEmbedded) {
    return (
      <div className="h-full bg-slate-900/95 flex flex-col">
        {/* Header - larger for embedded */}
        <div className="relative h-40 overflow-hidden border-b border-slate-600">
          {wikiData?.thumbnail && !imageError ? (
            <img
              src={wikiData.thumbnail.source}
              alt={cityName}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={`w-full h-full bg-gradient-to-br ${regionGradient} flex items-center justify-center`}>
              <div className="text-center text-white">
                <Landmark className="w-8 h-8 mx-auto mb-2 opacity-80" />
                <h3 className="text-lg font-semibold">{cityName}</h3>
                <p className="text-sm opacity-70">{region}</p>
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
          <div className="absolute bottom-4 left-6 text-white">
            <h1 className="text-3xl font-bold mb-2 tracking-tight">{cityName}</h1>
            <p className="text-lg opacity-90 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {region}
            </p>
          </div>
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Quick Facts */}
          <div className="bg-slate-800/50 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Quick Facts
            </h3>
            <div className="grid grid-cols-2 gap-5 text-base">
              <div>
                <span className="text-slate-400 block">Founded:</span>
                <span className="text-white font-medium">{foundingYear > 0 ? foundingYear : Math.abs(foundingYear)} {foundingYear > 0 ? 'CE' : 'BCE'}</span>
              </div>
              {declineYear && (
                <div>
                  <span className="text-slate-400 block">Declined:</span>
                  <span className="text-white font-medium">{declineYear} CE</span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block">Region:</span>
                <span className="text-white font-medium">{region}</span>
              </div>
              {wikiData?.population && (
                <div>
                  <span className="text-slate-400 block">Population:</span>
                  <span className="text-white font-medium">{wikiData.population}</span>
                </div>
              )}
            </div>
          </div>

          {/* Wikipedia Content */}
          {wikiData && (
            <div className="bg-slate-800/30 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-200 mb-5 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Overview
              </h3>
              <div className="text-base text-slate-300 leading-7 space-y-4">
                {wikiData.fullText ? (
                  wikiData.fullText.split('\n\n').map((paragraph, idx) => (
                    paragraph.trim() && (
                      <p key={idx} className="text-slate-300 leading-7">
                        {paragraph}
                      </p>
                    )
                  ))
                ) : wikiData.extract ? (
                  <p className="text-slate-300 leading-7">{wikiData.extract}</p>
                ) : (
                  <p className="text-slate-400 italic">No detailed information available.</p>
                )}
              </div>
            </div>
          )}

          {/* Historical Events */}
          {(HISTORICAL_EVENTS[cityName] || []).length > 0 && (
            <div className="bg-slate-800/30 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Key Events
              </h3>
              <div className="space-y-2">
                {HISTORICAL_EVENTS[cityName]?.slice(0, 5).map((event, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    <span className="text-amber-400 font-mono min-w-[3rem]">
                      {event.year > 0 ? event.year : `${Math.abs(event.year)} BC`}
                    </span>
                    <span className="text-slate-300">{event.event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500 mx-auto"></div>
              <p className="text-xs text-slate-400 mt-2">Loading information...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-2xl w-[90vw] max-w-6xl h-[85vh] flex border border-slate-700 overflow-hidden">

        {/* Left Panel - Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header with image */}
          <div className="relative h-48 overflow-hidden">
            {wikiData?.thumbnail && !imageError ? (
              <img
                src={wikiData.thumbnail.source}
                alt={cityName}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={`w-full h-full bg-gradient-to-br ${regionGradient} opacity-20`} />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />

            {/* City name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h1 className="text-4xl font-bold text-white mb-2">{cityName}</h1>
              <div className="flex items-center gap-4 text-slate-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {mapArea}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Founded {Math.abs(foundingYear)} {foundingYear < 0 ? 'BCE' : 'CE'}
                </span>
                {isActive && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                    ACTIVE CITY
                  </span>
                )}
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-slate-800/80 hover:bg-slate-700 rounded-lg backdrop-blur-sm transition-all"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {(['overview', 'history', 'culture', 'game'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 capitalize font-medium transition-all ${
                  activeTab === tab
                    ? 'text-white border-b-2 border-blue-500 bg-slate-800/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/20'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-slate-400">Loading city information...</div>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">About {cityName}</h3>
                      <div className="text-slate-300 leading-relaxed space-y-4">
                        {wikiData?.fullText ? (
                          wikiData.fullText.split('\n\n').slice(0, 10).map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))
                        ) : (
                          <p>{wikiData?.extract || `${cityName} is a significant historical city.`}</p>
                        )}
                      </div>
                    </div>

                    {wikiData?.thumbnail && !imageError && (
                      <div className="flex justify-center">
                        <a
                          href={`https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View full Wikipedia article
                        </a>
                      </div>
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Age</div>
                        <div className="text-white text-xl font-bold">{ageInYears.toLocaleString()} years</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Lifespan</div>
                        <div className="text-white text-xl font-bold">
                          {isActive ? `${lifespan.toLocaleString()}+ years` : `${lifespan.toLocaleString()} years`}
                        </div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Region</div>
                        <div className="text-white text-xl font-bold capitalize">{region.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-4">
                        <div className="text-slate-400 text-sm mb-1">Status</div>
                        <div className={`text-xl font-bold ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                          {isActive ? 'Active' : 'Historical'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white">Historical Timeline</h3>

                    {/* Timeline */}
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-700" />

                      {/* Founding */}
                      <div className="relative flex items-start gap-4 mb-6">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center z-10">
                          <div className="w-3 h-3 bg-white rounded-full" />
                        </div>
                        <div>
                          <div className="text-green-400 font-semibold">
                            {Math.abs(foundingYear)} {foundingYear < 0 ? 'BCE' : 'CE'}
                          </div>
                          <div className="text-white">City Founded</div>
                          <div className="text-slate-400 text-sm mt-1">
                            {cityName} established as a settlement in {mapArea}
                          </div>
                        </div>
                      </div>

                      {/* Historical Events */}
                      {HISTORICAL_EVENTS[cityName]?.map((event, idx) => (
                        <div key={idx} className="relative flex items-start gap-4 mb-6">
                          <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center z-10">
                            <div className="w-3 h-3 bg-slate-400 rounded-full" />
                          </div>
                          <div>
                            <div className="text-slate-400 font-semibold">
                              {Math.abs(event.year)} {event.year < 0 ? 'BCE' : 'CE'}
                            </div>
                            <div className="text-white">{event.event}</div>
                          </div>
                        </div>
                      ))}

                      {/* Decline or Present */}
                      {declineYear && declineYear !== 2024 ? (
                        <div className="relative flex items-start gap-4">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center z-10">
                            <X className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-red-400 font-semibold">
                              {Math.abs(declineYear)} {declineYear < 0 ? 'BCE' : 'CE'}
                            </div>
                            <div className="text-white">City Declined</div>
                            <div className="text-slate-400 text-sm mt-1">
                              {cityName} lost its major importance after {lifespan.toLocaleString()} years
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="relative flex items-start gap-4">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center z-10">
                            <ChevronRight className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="text-blue-400 font-semibold">Present Day</div>
                            <div className="text-white">Still Active</div>
                            <div className="text-slate-400 text-sm mt-1">
                              {cityName} continues to thrive after {ageInYears.toLocaleString()} years
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Culture Tab */}
                {activeTab === 'culture' && (
                  <div className="space-y-6">
                    {/* Cultural Achievements */}
                    {CULTURAL_ACHIEVEMENTS[cityName] && (
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Cultural Achievements</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {CULTURAL_ACHIEVEMENTS[cityName].map((achievement, idx) => (
                            <div key={idx} className="bg-slate-800/50 rounded-lg p-3 flex items-center gap-2">
                              <Landmark className="w-4 h-4 text-yellow-400" />
                              <span className="text-slate-300">{achievement}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notable Figures */}
                    {NOTABLE_FIGURES[cityName] && (
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-4">Notable Figures</h3>
                        <div className="space-y-3">
                          {NOTABLE_FIGURES[cityName].map((figure, idx) => (
                            <div key={idx} className="bg-slate-800/50 rounded-lg p-4 flex items-start gap-3">
                              <Users className="w-5 h-5 text-blue-400 mt-1" />
                              <div>
                                <div className="text-white font-semibold">{figure.name}</div>
                                <div className="text-slate-400 text-sm">{figure.years}</div>
                                <div className="text-slate-300 text-sm mt-1">{figure.role}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Default content if no specific data */}
                    {!CULTURAL_ACHIEVEMENTS[cityName] && !NOTABLE_FIGURES[cityName] && (
                      <div className="text-center py-12">
                        <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">
                          Cultural information for {cityName} is being researched.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Game Tab */}
                {activeTab === 'game' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white mb-3">In-Game Information</h3>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-400" />
                        Game Region
                      </h4>
                      <p className="text-slate-300">{mapArea}</p>
                      <p className="text-slate-400 text-sm mt-1">
                        This city is located in the {mapArea} region of the game world.
                      </p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-green-400" />
                        Historical Importance
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">City Age:</span>
                          <span className="text-white">{ageInYears.toLocaleString()} years</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Historical Span:</span>
                          <span className="text-white">
                            {Math.abs(foundingYear)} {foundingYear < 0 ? 'BCE' : 'CE'} - {
                              declineYear && declineYear !== 2024
                                ? `${Math.abs(declineYear)} ${declineYear < 0 ? 'BCE' : 'CE'}`
                                : 'Present'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cultural Zone:</span>
                          <span className="text-white capitalize">{region.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Gameplay Tips</h4>
                      <ul className="space-y-2 text-slate-300 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Cities founded before 0 CE often have rich archaeological sites and ancient artifacts.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Active cities (no decline date) are likely to have modern amenities and trade opportunities.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-blue-400 mt-1">•</span>
                          <span>Cities in the {region} region share similar cultural traits and architectural styles.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Quick Info */}
        <div className="w-80 bg-slate-900/50 border-l border-slate-700 p-6 overflow-y-auto">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Facts</h3>

          <div className="space-y-4">
            {/* Era Badge */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">Historical Era</div>
              <div className="text-white font-semibold">
                {foundingYear < -1000 ? 'Ancient' :
                 foundingYear < 500 ? 'Classical' :
                 foundingYear < 1450 ? 'Medieval' :
                 foundingYear < 1800 ? 'Early Modern' : 'Modern'}
              </div>
            </div>

            {/* Duration visualization */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-2">City Lifespan</div>
              <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                  style={{
                    width: `${Math.min(100, (ageInYears / 5000) * 100)}%`
                  }}
                />
              </div>
              <div className="text-white text-sm mt-2">
                {ageInYears.toLocaleString()} / 5000 years
              </div>
            </div>

            {/* Similar Cities */}
            <div>
              <h4 className="text-white font-semibold mb-2">Similar Cities</h4>
              <div className="space-y-2">
                {Object.entries(CITIES)
                  .flatMap(([area, cities]) =>
                    cities.map(c => ({ ...c, mapArea: area }))
                  )
                  .filter(c =>
                    c.name !== cityName &&
                    Math.abs(c.foundingYear - foundingYear) < 500
                  )
                  .slice(0, 3)
                  .map((city, idx) => (
                    <div key={idx} className="bg-slate-800/30 rounded-lg p-2 text-sm">
                      <div className="text-white">{city.name}</div>
                      <div className="text-slate-400 text-xs">
                        {city.mapArea} • {Math.abs(city.foundingYear)} {city.foundingYear < 0 ? 'BCE' : 'CE'}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* External Links */}
            <div className="pt-4 border-t border-slate-700">
              <a
                href={`https://en.wikipedia.org/wiki/${encodeURIComponent(cityName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View on Wikipedia
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityDetailPanel;