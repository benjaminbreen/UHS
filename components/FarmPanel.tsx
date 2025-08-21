import React from 'react';
import { Tile, MapData, PlayerCharacter, Item, Season, NpcEntity } from '../types';
import FarmPanelEnhanced from './FarmPanelEnhanced';

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
}

interface PriceInfo {
    buyPrice: number;
    sellPrice: number;
}

const FarmPanel: React.FC<FarmPanelProps> = ({ 
    tile, mapData, playerCharacter, npcs, onClose, onBuy, onSell, useLlm, season,
    gameTimeHours, onProgressTime, onShowEvent
}) => {
    // Use the enhanced version with proper layout
    return (
        <FarmPanelEnhanced
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
        />
    );
};

export default FarmPanel;