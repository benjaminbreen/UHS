/**
 * SavedGamesModal Component
 * UI for managing saved games - save, load, delete
 */

import React, { useState, useEffect } from 'react';
import { SavedGame, saveGameService } from '../services/saveGameService';
import { PlayerCharacter, MapData, NpcEntity } from '../types';
import { Quest } from '../types/questTypes';
import { EventHistoryEntry } from '../types/eventTypes';

interface SavedGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGame: (save: SavedGame) => void;
  currentGameState?: {
    playerCharacter: PlayerCharacter;
    mapData: MapData;
    mapSeed: string;
    currentLocation: { x: number; y: number };
    year: number;
    month: number;
    day: number;
    timeOfDay: number;
    gameMode: string;
    zone: string;
    region: string;
    mapArea: string;
    npcs?: NpcEntity[];
    activeQuests?: Quest[];
    completedQuests?: Quest[];
    eventHistory?: EventHistoryEntry[];
    isInSpecialMap?: boolean;
    specialMapData?: any;
    weatherState?: any;
    ambianceState?: any;
    playTime?: number;
  };
}

export const SavedGamesModal: React.FC<SavedGamesModalProps> = ({
  isOpen,
  onClose,
  onLoadGame,
  currentGameState
}) => {
  const [savedGames, setSavedGames] = useState<SavedGame[]>([]);
  const [isCreatingSave, setIsCreatingSave] = useState(false);
  const [newSaveName, setNewSaveName] = useState('');
  const [selectedSaveId, setSelectedSaveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load saved games when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSavedGames();
      setError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const loadSavedGames = () => {
    const games = saveGameService.getSavedGames();
    setSavedGames(games);
  };

  const handleCreateNewSave = () => {
    if (!currentGameState) {
      setError('No active game to save');
      return;
    }
    setIsCreatingSave(true);
    setNewSaveName(`${currentGameState.playerCharacter.name} - Year ${currentGameState.year}`);
  };

  const handleSaveGame = () => {
    if (!currentGameState) return;
    
    const result = saveGameService.saveGame(newSaveName || 'Quick Save', currentGameState);
    
    if (result.success) {
      setSuccessMessage('Game saved successfully!');
      setIsCreatingSave(false);
      setNewSaveName('');
      loadSavedGames();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(result.error || 'Failed to save game');
    }
  };

  const handleLoadGame = (saveId: string) => {
    const save = saveGameService.loadGame(saveId);
    if (save) {
      onLoadGame(save);
      onClose();
    } else {
      setError('Failed to load save');
    }
  };

  const handleDeleteGame = (saveId: string) => {
    if (window.confirm('Are you sure you want to delete this save?')) {
      const success = saveGameService.deleteGame(saveId);
      if (success) {
        loadSavedGames();
        setSuccessMessage('Save deleted');
        setTimeout(() => setSuccessMessage(null), 2000);
      } else {
        setError('Failed to delete save');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-lg shadow-2xl border border-amber-600/30 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-900/50 to-amber-800/30 px-6 py-4 border-b border-amber-600/30">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-amber-400">Saved Games</h2>
            <button
              onClick={onClose}
              className="text-amber-400 hover:text-amber-300 text-xl font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-600 rounded text-red-300">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-600 rounded text-green-300">
              {successMessage}
            </div>
          )}

          {/* New Save Section */}
          {currentGameState && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg border border-slate-700">
              {!isCreatingSave ? (
                <button
                  onClick={handleCreateNewSave}
                  className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">💾</span>
                  Save Current Game
                </button>
              ) : (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newSaveName}
                    onChange={(e) => setNewSaveName(e.target.value)}
                    placeholder="Enter save name..."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveGame}
                      className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                    >
                      Confirm Save
                    </button>
                    <button
                      onClick={() => {
                        setIsCreatingSave(false);
                        setNewSaveName('');
                      }}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Saved Games List */}
          {savedGames.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p className="text-lg mb-2">No saved games yet</p>
              <p className="text-sm">Start playing and save your progress!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {savedGames.map((save) => (
                <SavedGameCard
                  key={save.id}
                  save={save}
                  isSelected={selectedSaveId === save.id}
                  onSelect={() => setSelectedSaveId(save.id)}
                  onLoad={() => handleLoadGame(save.id)}
                  onDelete={() => handleDeleteGame(save.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Individual saved game card component
 */
const SavedGameCard: React.FC<{
  save: SavedGame;
  isSelected: boolean;
  onSelect: () => void;
  onLoad: () => void;
  onDelete: () => void;
}> = ({ save, isSelected, onSelect, onLoad, onDelete }) => {
  return (
    <div
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-amber-900/30 border-amber-600'
          : 'bg-slate-800 border-slate-700 hover:bg-slate-700'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="text-4xl flex-shrink-0">{save.thumbnailEmoji}</div>
        
        {/* Save Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-amber-400 truncate">
            {save.name}
          </h3>
          <div className="mt-1 space-y-1 text-sm text-slate-300">
            <p>
              <span className="text-slate-400">Character:</span>{' '}
              {save.playerCharacter.name} - {save.playerCharacter.profession}
            </p>
            <p>
              <span className="text-slate-400">Location:</span>{' '}
              {save.mapArea} ({save.zone})
            </p>
            <p>
              <span className="text-slate-400">Date:</span>{' '}
              Year {save.year}, Month {save.month}, Day {save.day}
            </p>
            <p>
              <span className="text-slate-400">Game Mode:</span>{' '}
              <span className="capitalize">{save.gameMode}</span>
            </p>
            {save.playTime > 0 && (
              <p>
                <span className="text-slate-400">Play Time:</span>{' '}
                {Math.floor(save.playTime / 60)}h {save.playTime % 60}m
              </p>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {saveGameService.formatRelativeTime(save.timestamp)}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLoad();
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition-colors"
          >
            Load
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};