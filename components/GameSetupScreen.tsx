import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Gamepad2, Shuffle, Settings, ArrowRight, Info, Target, Clock, Shield, Timer, Library, Sparkles, Eye } from 'lucide-react';
import AtmosphericBackground from './AtmosphericBackground';
import { shareableStateService, ShareableGameState } from '../services/shareableStateService';
import { GAME_MODES } from '../constants/gameData/gameModes';
import { selectGameModeForProfession } from '../constants/gameData/professionGameModeMappings';
import {
  learningObjectivesService,
  LearningObjective,
  AssessmentFrequency,
  DifficultyLevel,
  SessionLength,
  EducationalSettings
} from '../services/learningObjectivesService';
import { educationalScenariosService, EducationalScenario } from '../services/educationalScenariosService';
import { worldWeaverService } from '../services/worldWeaverService';
import { SeedManager } from '../services/seedService';

type PlayMode = 'quick' | 'learning';
type ScenarioType = 'random' | 'curated' | 'custom';

const GameSetupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [playMode, setPlayMode] = useState<PlayMode>('quick');
  const [scenarioType, setScenarioType] = useState<ScenarioType>('random');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [scenarioPreview, setScenarioPreview] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Phase 2: Learning objectives and assessment settings
  const [selectedObjectives, setSelectedObjectives] = useState<Set<LearningObjective>>(new Set());
  const [assessmentFrequency, setAssessmentFrequency] = useState<AssessmentFrequency>('occasional');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('realistic');
  const [sessionLength, setSessionLength] = useState<SessionLength>('extended');

  // Simple map seed generator (matches shareableStateService approach)
  const generateMapSeed = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const toggleObjective = (objective: LearningObjective) => {
    const newSet = new Set(selectedObjectives);
    if (newSet.has(objective)) {
      newSet.delete(objective);
    } else {
      newSet.add(objective);
    }
    setSelectedObjectives(newSet);
  };

  // Phase 3: WorldWeaver integration for custom scenarios
  const generateCustomScenarioPreview = async () => {
    if (!customPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setScenarioPreview(null);

    try {
      const result = await worldWeaverService.generateScenario(customPrompt);
      if (result.success) {
        setScenarioPreview(result);
      } else {
        setScenarioPreview({ error: result.errorMessage });
      }
    } catch (error) {
      console.error('Failed to generate scenario:', error);
      setScenarioPreview({ error: 'Failed to generate scenario. Please try again.' });
    } finally {
      setIsGenerating(false);
    }
  };

  // Get filtered scenarios based on learning objectives
  const getRecommendedScenarios = () => {
    if (selectedObjectives.size === 0) {
      return educationalScenariosService.getAllScenarios();
    }
    return educationalScenariosService.getRecommendedScenarios(Array.from(selectedObjectives));
  };

  const handleStartGame = async () => {
    let year: number;
    let mapArea: string;
    let gameMode: string;
    let character: any = {};
    let scenarioPrompt: string | undefined;

    // Handle different scenario types
    if (scenarioType === 'curated' && selectedScenarioId) {
      // Use selected curated scenario
      const scenario = educationalScenariosService.getScenarioById(selectedScenarioId);
      if (!scenario) return;

      year = scenario.year;
      mapArea = scenario.mapArea;
      gameMode = scenario.gameMode;

      // Use suggested character details
      if (scenario.suggestedProfession) {
        character.profession = scenario.suggestedProfession;
      }
      if (scenario.suggestedAge) {
        character.age = Math.floor(
          Math.random() * (scenario.suggestedAge.max - scenario.suggestedAge.min) +
          scenario.suggestedAge.min
        );
      }
    } else if (scenarioType === 'custom' && scenarioPreview && !scenarioPreview.error) {
      // Use WorldWeaver generated scenario
      year = scenarioPreview.year;
      mapArea = scenarioPreview.mapArea;
      gameMode = scenarioPreview.gameMode?.id || scenarioPreview.gameMode || 'exploration';
      character = scenarioPreview.characterSpec || {};
      scenarioPrompt = customPrompt;
    } else {
      // Random scenario
      const currentYear = new Date().getFullYear();
      year = Math.floor(Math.random() * 3000) + (currentYear - 2025);

      // Use actual map area names from geography data
      const mapAreas = [
        // Europe
        'Paris Basin', 'Rhine Valley', 'London', 'Roman Campagna', 'Venetian Lagoon',
        // East Asia
        'North China Plain', 'Yellow River Delta', 'Kyoto Valleys', 'Seoul Area', 'Edo Bay',
        // MENA
        'Mesopotamian Plain', 'Nile Delta', 'Arabian Desert', 'Damascus Region', 'Levantine Coast',
        // North America
        'Great Plains', 'Eastern Woodlands', 'California Coast', 'Mississippi Delta', 'Hudson River Valley',
        // South America
        'Amazon Basin', 'Andean Highlands', 'Pampas', 'Patagonia', 'Orinoco Delta',
        // Africa
        'Zanzibar Coast', 'Ethiopian Highlands', 'Sahara Desert', 'Niger Delta', 'Great Rift Valley',
        // South Asia
        'Ganges Plain', 'Deccan Plateau', 'Kashmir Valley', 'Bengal Delta', 'Punjab Plains',
        // Oceania
        'Canterbury Plains', 'Australian Outback', 'Tahitian Islands', 'Papua Highlands', 'Java Central'
      ];

      mapArea = mapAreas[Math.floor(Math.random() * mapAreas.length)];

      // Select game mode based on character profession (if available)
      const characterProfession = character.profession || 'Traveler';
      gameMode = selectGameModeForProfession(characterProfession);
    }

    // Create shareable game state
    const gameState: ShareableGameState = {
      // Core game settings
      year: year,
      month: Math.floor(Math.random() * 12) + 1,
      day: Math.floor(Math.random() * 28) + 1,
      mapArea: mapArea,
      zone: scenarioType === 'curated' && selectedScenarioId
        ? educationalScenariosService.getScenarioById(selectedScenarioId)?.zone || 'EUROPEAN'
        : 'EUROPEAN',
      gameMode: gameMode,

      // Character data - enhanced for Phase 3
      character: {
        name: character.name || 'Historical Character',
        profession: character.profession || 'Traveler',
        gender: character.gender || (Math.random() > 0.5 ? 'male' : 'female'),
        age: character.age || Math.floor(Math.random() * 40) + 20,
        socialClass: character.socialClass,
        health: character.health,
        disease: character.disease,
        birthplace: character.birthplace,
        family: character.family,
        clothing: character.clothing,
        classLabel: character.classLabel,
        ethnicity: character.ethnicity,
        identitySource: character.identitySource,
        characterDescription: character.characterDescription,
        customItems: character.customItems
      },

      // Map generation
      mapSeed: generateMapSeed(),

      // Scenario metadata
      scenarioType: scenarioType === 'custom' ? 'worldweaver' :
                   scenarioType === 'curated' ? 'custom' : 'procedural',
      scenarioPrompt: scenarioPrompt,

      // Educational mode flag for Phase 1
      educationalMode: playMode === 'learning',

      // Phase 2: Learning objectives and assessment settings
      learningObjectives: playMode === 'learning' ? Array.from(selectedObjectives) : undefined,
      assessmentFrequency: playMode === 'learning' ? assessmentFrequency : undefined,
      difficulty: playMode === 'learning' ? difficulty : undefined,
      sessionLength: playMode === 'learning' ? sessionLength : undefined,

      // Version
      version: '1.0.0'
    };

    // Initialize learning objectives service if in learning mode
    if (playMode === 'learning') {
      const educationalSettings: EducationalSettings = {
        learningObjectives: Array.from(selectedObjectives),
        assessmentFrequency,
        difficulty,
        sessionLength,
        trackingEnabled: true
      };
      learningObjectivesService.initializeSession(educationalSettings);
    }

    // For Quick Play, generate simple URLs without any state persistence
    // The game will generate random character/settings on load
    if (playMode === 'quick' && scenarioType === 'random') {
      // Navigate with simple URL - no localStorage, no state parameter
      // The game will randomly generate character and settings
      const simpleUrl = `/${year}/${encodeURIComponent(mapArea)}/${gameMode}`;
      navigate(simpleUrl);
    } else {
      // For educational mode or curated/custom scenarios, use full state encoding
      // This allows sharing specific scenarios via URL without localStorage
      const encodedState = shareableStateService.encodeGameState(gameState);
      const url = `/${year}/${encodeURIComponent(mapArea)}/${gameMode}?state=${encodedState}`;
      navigate(url);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      {/* Atmospheric Background */}
      <AtmosphericBackground />

      <div className="max-w-3xl w-full max-h-[85vh] bg-slate-800/90 backdrop-blur-sm rounded-xl border border-slate-700 shadow-2xl relative z-10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Universal History Simulator
            </h1>
            <p className="text-lg text-blue-300 mb-3">
              An Educational Journey Through Human History
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Info size={14} />
              <span>UC Santa Cruz • Educational Game • 2025</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Mode Selection */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              <Settings size={20} />
              Choose Your Experience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Quick Play */}
              <button
                onClick={() => setPlayMode('quick')}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  playMode === 'quick'
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Gamepad2 className="text-green-400" size={24} />
                  <h3 className="text-lg font-semibold text-white">Quick Play</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Jump right into gameplay</li>
                  <li>• Random historical scenario</li>
                  <li>• No progress tracking</li>
                  <li>• Casual exploration</li>
                </ul>
              </button>

              {/* Learning Mode */}
              <button
                onClick={() => setPlayMode('learning')}
                className={`p-6 rounded-lg border-2 transition-all duration-200 text-left ${
                  playMode === 'learning'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="text-purple-400" size={24} />
                  <h3 className="text-lg font-semibold text-white">Learning Mode</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Educational objectives</li>
                  <li>• Progress tracking</li>
                  <li>• Assessment reports</li>
                  <li>• Curriculum aligned</li>
                </ul>
                {playMode === 'learning' && (
                  <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded text-xs text-yellow-200">
                    <strong>Phase 1:</strong> Basic learning mode enabled. Full educational features coming in Phase 2.
                  </div>
                )}
              </button>
            </div>
          </section>

          {/* Scenario Selection */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Choose Your Scenario</h2>
            <div className="space-y-4">
              {/* Random Scenario */}
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  id="random"
                  name="scenario"
                  checked={scenarioType === 'random'}
                  onChange={() => {
                    setScenarioType('random');
                    setSelectedScenarioId(null);
                    setScenarioPreview(null);
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="random" className="block text-lg font-medium text-white cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Shuffle className="text-blue-400" size={20} />
                      Random Historical Scenario
                    </div>
                  </label>
                  <p className="text-sm text-slate-400">
                    "Surprise me!" - Jump into a randomly generated historical time and place.
                    Perfect for exploration and discovery.
                  </p>
                </div>
              </div>

              {/* Curated Educational Scenarios */}
              {playMode === 'learning' && (
                <div className="flex items-start gap-4">
                  <input
                    type="radio"
                    id="curated"
                    name="scenario"
                    checked={scenarioType === 'curated'}
                    onChange={() => {
                      setScenarioType('curated');
                      setScenarioPreview(null);
                    }}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label htmlFor="curated" className="block text-lg font-medium text-white cursor-pointer">
                      <div className="flex items-center gap-2 mb-2">
                        <Library className="text-green-400" size={20} />
                        Curated Educational Scenarios
                      </div>
                    </label>
                    <p className="text-sm text-slate-400 mb-3">
                      Choose from historically accurate scenarios designed for learning.
                    </p>
                    {scenarioType === 'curated' && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {getRecommendedScenarios().map((scenario) => (
                          <div
                            key={scenario.id}
                            onClick={() => setSelectedScenarioId(scenario.id)}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedScenarioId === scenario.id
                                ? 'border-green-500 bg-green-500/20'
                                : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-white text-sm">{scenario.title}</h4>
                                <p className="text-xs text-slate-300 mt-1">{scenario.description}</p>
                                <div className="flex gap-2 mt-2">
                                  <span className="text-xs px-2 py-0.5 bg-blue-600/30 rounded text-blue-200">
                                    {Math.abs(scenario.year)} {scenario.year < 0 ? 'BCE' : 'CE'}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-purple-600/30 rounded text-purple-200">
                                    {scenario.difficulty}
                                  </span>
                                  <span className="text-xs px-2 py-0.5 bg-orange-600/30 rounded text-orange-200">
                                    {scenario.duration}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Scenario */}
              <div className="flex items-start gap-4">
                <input
                  type="radio"
                  id="custom"
                  name="scenario"
                  checked={scenarioType === 'custom'}
                  onChange={() => {
                    setScenarioType('custom');
                    setSelectedScenarioId(null);
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="custom" className="block text-lg font-medium text-white cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="text-purple-400" size={20} />
                      Custom Scenario (WorldWeaver AI)
                    </div>
                  </label>
                  <p className="text-sm text-slate-400 mb-3">
                    Describe what historical experience you want. AI will interpret your request.
                  </p>
                  {scenarioType === 'custom' && (
                    <div className="space-y-3">
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Example: I want to experience life as a merchant in medieval Baghdad..."
                        className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 resize-none focus:outline-none focus:border-blue-500"
                        rows={3}
                      />

                      <div className="flex gap-3">
                        <button
                          onClick={generateCustomScenarioPreview}
                          disabled={!customPrompt.trim() || isGenerating}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          <Eye size={16} />
                          {isGenerating ? 'Generating...' : 'Preview Scenario'}
                        </button>
                      </div>

                      {/* Scenario Preview */}
                      {scenarioPreview && (
                        <div className={`p-4 rounded-lg border ${
                          scenarioPreview.error
                            ? 'bg-red-900/20 border-red-600'
                            : 'bg-green-900/20 border-green-600'
                        }`}>
                          {scenarioPreview.error ? (
                            <>
                              <h4 className="font-semibold text-red-300 mb-2 flex items-center gap-2">
                                <span>⚠️</span> Generation Error
                              </h4>
                              <p className="text-sm text-red-200">{scenarioPreview.error}</p>
                            </>
                          ) : (
                            <>
                              <h4 className="font-semibold text-green-300 mb-2 flex items-center gap-2">
                                <span>✨</span> Generated Scenario
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex gap-2">
                                  <span className="text-slate-400">Year:</span>
                                  <span className="text-white font-medium">
                                    {Math.abs(scenarioPreview.year)} {scenarioPreview.year < 0 ? 'BCE' : 'CE'}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-slate-400">Location:</span>
                                  <span className="text-white font-medium">
                                    {scenarioPreview.mapArea?.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-slate-400">Game Mode:</span>
                                  <span className="text-white font-medium">
                                    {(scenarioPreview.gameMode?.name || scenarioPreview.gameMode || 'exploration')
                                      .replace(/\b\w/g, c => c.toUpperCase())}
                                  </span>
                                </div>
                                {scenarioPreview.characterSpec && (
                                  <>
                                    <div className="flex gap-2">
                                      <span className="text-slate-400">Character:</span>
                                      <span className="text-white font-medium">
                                        {scenarioPreview.characterSpec.name || 'Generated Character'},
                                        {' '}{scenarioPreview.characterSpec.age || 25} years old
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <span className="text-slate-400">Profession:</span>
                                      <span className="text-white font-medium">
                                        {scenarioPreview.characterSpec.profession || 'Traveler'}
                                      </span>
                                    </div>
                                  </>
                                )}
                                {scenarioPreview.questTitle && (
                                  <div className="mt-3 pt-3 border-t border-green-700">
                                    <div className="text-slate-400 mb-1">Starting Quest:</div>
                                    <div className="text-white font-medium">{scenarioPreview.questTitle}</div>
                                    <p className="text-green-200 text-xs mt-1">{scenarioPreview.questDescription}</p>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-green-200 mt-3">
                                Click "Begin Your Historical Journey" to start with this scenario
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Learning Objectives - Only show in Learning Mode */}
          {playMode === 'learning' && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Target className="text-purple-400" size={24} />
                Learning Objectives
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                Select the educational goals you want to focus on during your historical journey.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {learningObjectivesService.getAllObjectiveConfigs().map(objective => (
                  <div
                    key={objective.id}
                    onClick={() => toggleObjective(objective.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      selectedObjectives.has(objective.id)
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedObjectives.has(objective.id)}
                        onChange={() => {}}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{objective.name}</h3>
                        <p className="text-xs text-slate-300">{objective.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedObjectives.size === 0 && (
                <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-600/50 rounded text-xs text-yellow-200">
                  Please select at least one learning objective to continue.
                </div>
              )}
            </section>
          )}

          {/* Assessment Settings - Only show in Learning Mode */}
          {playMode === 'learning' && (
            <section>
              <h2 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                <Settings className="text-green-400" size={24} />
                Assessment Settings
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Difficulty */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="text-orange-400" size={18} />
                    <label className="text-sm font-semibold text-white">Difficulty</label>
                  </div>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="forgiving">Forgiving</option>
                    <option value="realistic">Realistic</option>
                    <option value="hardcore">Hardcore</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-2">
                    {difficulty === 'forgiving' && 'Relaxed gameplay with helpful hints'}
                    {difficulty === 'realistic' && 'Balanced challenge and historical accuracy'}
                    {difficulty === 'hardcore' && 'Unforgiving simulation of historical reality'}
                  </p>
                </div>

                {/* Assessment Frequency */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="text-blue-400" size={18} />
                    <label className="text-sm font-semibold text-white">Assessment</label>
                  </div>
                  <select
                    value={assessmentFrequency}
                    onChange={(e) => setAssessmentFrequency(e.target.value as AssessmentFrequency)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="none">None</option>
                    <option value="occasional">Occasional</option>
                    <option value="frequent">Frequent</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-2">
                    {assessmentFrequency === 'none' && 'Play without assessment interruptions'}
                    {assessmentFrequency === 'occasional' && 'Check understanding every 30 minutes'}
                    {assessmentFrequency === 'frequent' && 'Regular check-ins every 15 minutes'}
                  </p>
                </div>

                {/* Session Length */}
                <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <Timer className="text-green-400" size={18} />
                    <label className="text-sm font-semibold text-white">Session Length</label>
                  </div>
                  <select
                    value={sessionLength}
                    onChange={(e) => setSessionLength(e.target.value as SessionLength)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  >
                    <option value="short">Short (30 min)</option>
                    <option value="extended">Extended (2+ hrs)</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-2">
                    {sessionLength === 'short' && 'Perfect for classroom activities'}
                    {sessionLength === 'extended' && 'Deep exploration session'}
                    {sessionLength === 'unlimited' && 'Play as long as you want'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Start Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={handleStartGame}
              disabled={
                (scenarioType === 'custom' && (!scenarioPreview || scenarioPreview.error)) ||
                (scenarioType === 'curated' && !selectedScenarioId) ||
                (playMode === 'learning' && selectedObjectives.size === 0)
              }
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 flex items-center gap-3 text-lg"
            >
              <span>{playMode === 'learning' ? 'Start Learning' : 'Begin Your Historical Journey'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSetupScreen;
