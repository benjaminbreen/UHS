import React from 'react';
import { Tile, MapData, PlayerCharacter, Item, Season, NpcEntity } from '../types';
import FarmPanelImproved from './FarmPanelImproved';
import { useGame } from '../contexts/GameContext';

interface FarmPanelProps {
    tile: Tile;
    mapData: MapData;
    playerCharacter: PlayerCharacter;
    npcs: NpcEntity[];
    onClose: () => void;
    onBuy: (itemBaseId: string, price: number) => void;
    onSell: (item: Item, price: number) => void;
    useLlm: boolean;
    season: Season;
    gameTimeHours?: number;
    onProgressTime?: (months: number) => void;
    onShowEvent?: (event: any) => void;
    onInitiateEncounter?: (target: any) => void;
    onPlayerStateChange?: (changes: {
        health?: number;
        fatigue?: number;
        statusEffects?: Array<{ type: string; name: string; duration: number; severity?: 'mild' | 'moderate' | 'severe' }>;
        inventory?: { add?: any[]; remove?: string[] };
    }) => void;
}

interface PriceInfo {
    buyPrice: number;
    sellPrice: number;
}

const FarmPanel: React.FC<FarmPanelProps> = ({
    tile, mapData, playerCharacter, npcs, onClose, onBuy, onSell, useLlm, season,
    gameTimeHours, onProgressTime, onShowEvent, onInitiateEncounter, onPlayerStateChange
}) => {
    const { gameDate } = useGame();

    // Get current game day from game state
    const currentDate = new Date();
    const baseYear = parseInt(mapData.timeSlice?.split(' ')[0] || '1650');
    const currentGameDay = Math.floor((currentDate.getTime() - new Date(baseYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24));

    // Use the improved version with beautiful UI and full functionality
    return (
        <FarmPanelImproved
            tile={tile}
            mapData={mapData}
            playerCharacter={playerCharacter}
            npcs={npcs}
            onClose={onClose}
            onBuy={onBuy}
            onSell={onSell}
            season={season}
            gameTimeHours={gameTimeHours || new Date().getHours()}
            onProgressTime={onProgressTime}
            onShowEvent={onShowEvent}
            currentGameDay={currentGameDay}
            useLlm={useLlm}
            gameDate={gameDate}
            onInitiateEncounter={onInitiateEncounter}
            onPlayerStateChange={onPlayerStateChange}
        />
    );
};

export default FarmPanel;