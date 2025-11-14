/**
 * components/CityHistoricalModal.tsx
 * Modal for displaying historically accurate city descriptions and AI-generated street scenes
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, MapPin, Calendar, Users, Sparkles, Info, Cloud, CloudRain, CloudSnow, Sun } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useMap } from '../contexts/MapContext';
import { generateHistoricalCityDescription } from '../services/llmService';
import { imageGenerationService } from '../services/imageGenerationService';
import { weatherService } from '../services/weatherService';
import { CulturalZone, HistoricalEra, NpcEntity } from '../types';

interface CityHistoricalModalProps {
  isOpen: boolean;
  onClose: () => void;
  cityName: string;
  cityDescription?: string;
  nearbyNpcs?: NpcEntity[];
}

export const CityHistoricalModal: React.FC<CityHistoricalModalProps> = ({
  isOpen,
  onClose,
  cityName,
  cityDescription,
  nearbyNpcs = []
}) => {
  const { gameDate, gameTimeHours, currentZone, currentRegion, season, currentTimeOfDay } = useGame();
  const { culturalZone, mapData } = useMap();

  const [llmDescription, setLlmDescription] = useState<string>('');
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Calculate current weather
  const weather = useMemo(() => {
    if (!mapData || !season || !currentTimeOfDay) return null;

    const weatherState = weatherService.getWeather(
      mapData.climate || 'temperate',
      season,
      currentTimeOfDay,
      0, // altitude - using sea level for cities
      null // biome - not needed for city context
    );

    return weatherState;
  }, [mapData, season, currentTimeOfDay]);

  // Format the exact date and time
  const formatDateTime = () => {
    const monthNames = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];
    const timeOfDay = gameTimeHours < 6 ? 'dawn' :
                     gameTimeHours < 12 ? 'morning' :
                     gameTimeHours === 12 ? 'noon' :
                     gameTimeHours < 17 ? 'afternoon' :
                     gameTimeHours < 20 ? 'evening' : 'night';

    const dateStr = gameDate.year < 0
      ? `${monthNames[gameDate.month - 1]} ${gameDate.day}, ${Math.abs(gameDate.year)} BCE`
      : `${monthNames[gameDate.month - 1]} ${gameDate.day}, ${gameDate.year} CE`;

    return { dateStr, timeOfDay };
  };

  // Generate historical description when modal opens
  useEffect(() => {
    if (isOpen && cityName) {
      generateHistoricalDescription();
    }
  }, [isOpen, cityName]);

  const generateHistoricalDescription = async () => {
    setIsLoadingDescription(true);
    setDescriptionError(null);

    try {
      const { dateStr, timeOfDay } = formatDateTime();
      const description = await generateHistoricalCityDescription({
        cityName,
        date: dateStr,
        timeOfDay,
        culturalZone: culturalZone as CulturalZone,
        region: currentRegion || 'Unknown Region',
        zone: currentZone || 'Unknown Zone',
        nearbyNpcs: nearbyNpcs.slice(0, 5), // Include up to 5 NPCs for context
        baseDescription: cityDescription,
        weather: weather ? {
          precipitation: weather.precipitation,
          intensity: weather.intensity,
          windSpeed: weather.windSpeed,
          temperature: weather.temperature,
          cloudCover: weather.cloudCover,
          visibility: weather.visibility,
          description: weather.description
        } : undefined
      });

      setLlmDescription(description);

      // After getting description, generate image
      if (imageGenerationService.isAvailable()) {
        generateCityImage(description);
      }
    } catch (error) {
      console.error('Failed to generate city description:', error);
      setDescriptionError('Unable to generate historical description');
      setLlmDescription(cityDescription || 'A settlement of this era.');
    } finally {
      setIsLoadingDescription(false);
    }
  };

  const generateCityImage = async (description: string) => {
    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const { dateStr, timeOfDay } = formatDateTime();
      const result = await imageGenerationService.generateCitySceneImage({
        cityName,
        llmDescription: description,
        culturalZone: culturalZone as CulturalZone,
        year: gameDate.year,
        timeOfDay,
        dateStr
      });

      if (result.imageUrl) {
        setImageUrl(result.imageUrl);
        setImagePrompt(result.prompt || null);
      } else {
        setImageError('Failed to generate image');
      }
    } catch (error: any) {
      console.error('Failed to generate city image:', error);
      setImageError(error.message || 'Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  if (!isOpen) return null;

  const { dateStr, timeOfDay } = formatDateTime();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden surface-card animate-popIn"
        style={{
          borderWidth: '1px',
          borderColor: 'var(--border-normal)'
        }}
      >
        {/* Header */}
        <div className="px-6 py-4"
          style={{
            background: 'linear-gradient(to right, var(--surface-elevated), var(--surface-card))',
            borderBottomWidth: '1px',
            borderColor: 'var(--border-normal)'
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-cyan-400 dark:text-cyan-300">{cityName}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
              style={{ backgroundColor: 'var(--surface-muted)' }}
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Date, Time and Weather Badge */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <div className="flex items-center gap-1.5 text-amber-500 dark:text-amber-300">
              <Calendar className="w-4 h-4" />
              <span>{dateStr}</span>
            </div>
            <div className="text-text-muted">•</div>
            <div className="text-text-primary capitalize">{timeOfDay}</div>
            {weather && (
              <>
                <div className="text-text-muted">•</div>
                <div className="flex items-center gap-1.5 text-blue-500 dark:text-blue-300">
                  {weather.precipitation === 'rain' ? <CloudRain className="w-4 h-4" /> :
                   weather.precipitation === 'snow' ? <CloudSnow className="w-4 h-4" /> :
                   weather.cloudCover > 0.5 ? <Cloud className="w-4 h-4" /> :
                   <Sun className="w-4 h-4" />}
                  <span className="capitalize">{weather.description}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)] p-6">
          {/* Historical Description */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-300">Historical Context</h3>
            </div>

            {isLoadingDescription ? (
              <div className="rounded-lg p-4 animate-pulse"
                style={{
                  backgroundColor: 'var(--surface-muted)'
                }}
              >
                <div className="h-4 rounded w-3/4 mb-2" style={{ backgroundColor: 'var(--surface-elevated)' }}></div>
                <div className="h-4 rounded w-full mb-2" style={{ backgroundColor: 'var(--surface-elevated)' }}></div>
                <div className="h-4 rounded w-5/6" style={{ backgroundColor: 'var(--surface-elevated)' }}></div>
              </div>
            ) : (
              <div className="rounded-lg p-4 transition-all duration-300 hover:scale-[1.01] hover:shadow-lg"
                style={{
                  backgroundColor: 'var(--surface-muted)',
                  borderWidth: '1px',
                  borderColor: 'var(--border-normal)'
                }}
              >
                <p className="text-text-primary leading-relaxed">
                  {llmDescription || cityDescription || 'A settlement of this era.'}
                </p>
              </div>
            )}
          </div>

          {/* Nearby NPCs */}
          {nearbyNpcs.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-green-500 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-green-600 dark:text-green-300">Notable Residents</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {nearbyNpcs.slice(0, 8).map((npc, index) => (
                  <div
                    key={index}
                    className="rounded-md px-3 py-1.5 text-sm transition-all duration-300 hover:scale-105 hover:shadow-md cursor-pointer"
                    style={{
                      backgroundColor: 'var(--surface-elevated)',
                      borderWidth: '1px',
                      borderColor: 'var(--color-success)'
                    }}
                  >
                    <span className="text-text-primary font-medium">{npc.name}</span>
                    <span className="text-green-500 dark:text-green-400 mx-1">•</span>
                    <span className="text-text-secondary text-xs capitalize">
                      {npc.role?.replace(/_/g, ' ').toLowerCase() || 'citizen'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI-Generated Image */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-purple-600 dark:text-purple-300">Visual Reconstruction</h3>
            </div>

            <div className="rounded-lg p-4 transition-all duration-300 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--surface-muted)',
                borderWidth: '1px',
                borderColor: 'var(--border-normal)'
              }}
            >
              {isGeneratingImage ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 dark:border-purple-400 mb-4"></div>
                  <p className="text-text-secondary text-sm">Generating historical scene...</p>
                  <p className="text-text-muted text-xs mt-1">This may take a moment</p>
                </div>
              ) : imageUrl ? (
                <div className="space-y-3">
                  <img
                    src={imageUrl}
                    alt={`Historical view of ${cityName}`}
                    className="w-full rounded-lg transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      maxHeight: '400px',
                      objectFit: 'cover',
                      borderWidth: '1px',
                      borderColor: 'var(--border-normal)'
                    }}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <p className="text-text-muted">AI-generated historical reconstruction</p>
                    {imagePrompt && (
                      <button
                        onClick={() => setShowPrompt(!showPrompt)}
                        className="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 underline transition-all duration-200 hover:scale-105"
                      >
                        {showPrompt ? 'Hide' : 'Show'} Generation Details
                      </button>
                    )}
                  </div>
                  {showPrompt && imagePrompt && (
                    <div className="mt-3 p-3 rounded animate-in fade-in duration-300"
                      style={{
                        backgroundColor: 'var(--surface-elevated)',
                        borderWidth: '1px',
                        borderColor: 'var(--border-normal)'
                      }}
                    >
                      <p className="text-xs font-semibold text-purple-600 dark:text-purple-300 mb-2">Image Generation Prompt:</p>
                      <p className="text-xs text-text-primary break-words leading-relaxed">{imagePrompt}</p>
                    </div>
                  )}
                </div>
              ) : imageError ? (
                <div className="text-center py-8">
                  <p className="text-[color:var(--color-error)] text-sm">{imageError}</p>
                  {!imageGenerationService.isAvailable() && (
                    <p className="text-text-muted text-xs mt-2">
                      Image generation requires Runware API key in .env.local
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-muted text-sm">No image available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};