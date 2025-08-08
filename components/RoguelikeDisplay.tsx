/**
 * components/RoguelikeDisplay.tsx - Classic roguelike dungeon exploration
 */
import React, { useState, useEffect, useCallback } from 'react';
import { PlayerCharacter } from '../types';

interface RoguelikeDisplayProps {
    ruinType: {
        name: string;
        description: string;
        age: string;
        dangers: string[];
    };
    playerCharacter: PlayerCharacter;
    onExit: () => void;
}

interface DungeonTile {
    type: 'wall' | 'floor' | 'door' | 'treasure' | 'trap' | 'stairs_down' | 'stairs_up' | 'entrance';
    visible: boolean;
    explored: boolean;
    hasGold?: number;
    hasTrap?: boolean;
    trapTriggered?: boolean;
}

interface DungeonPlayer {
    x: number;
    y: number;
    hp: number;
    maxHp: number;
    gold: number;
    level: number;
}

const DUNGEON_WIDTH = 40;
const DUNGEON_HEIGHT = 30;

const RoguelikeDisplay: React.FC<RoguelikeDisplayProps> = ({
    ruinType,
    playerCharacter,
    onExit
}) => {
    const [dungeon, setDungeon] = useState<DungeonTile[][]>([]);
    const [player, setPlayer] = useState<DungeonPlayer>({
        x: 2,
        y: 2,
        hp: playerCharacter.health,
        maxHp: playerCharacter.maxHealth,
        gold: 0,
        level: playerCharacter.stats.level
    });
    const [gameMessage, setGameMessage] = useState('You descend into the ancient ruins...');
    const [turnCount, setTurnCount] = useState(0);

    // Generate dungeon using simple room and corridor algorithm
    const generateDungeon = useCallback(() => {
        const newDungeon: DungeonTile[][] = Array(DUNGEON_HEIGHT).fill(null).map(() =>
            Array(DUNGEON_WIDTH).fill(null).map(() => ({
                type: 'wall' as const,
                visible: false,
                explored: false
            }))
        );

        // Simple room generation
        const rooms = [];
        const numRooms = 5 + Math.floor(Math.random() * 3);

        for (let i = 0; i < numRooms; i++) {
            const roomWidth = 4 + Math.floor(Math.random() * 6);
            const roomHeight = 3 + Math.floor(Math.random() * 4);
            const roomX = 1 + Math.floor(Math.random() * (DUNGEON_WIDTH - roomWidth - 2));
            const roomY = 1 + Math.floor(Math.random() * (DUNGEON_HEIGHT - roomHeight - 2));

            // Check for room overlap
            let overlap = false;
            for (const room of rooms) {
                if (roomX < room.x + room.width && roomX + roomWidth > room.x &&
                    roomY < room.y + room.height && roomY + roomHeight > room.y) {
                    overlap = true;
                    break;
                }
            }

            if (!overlap) {
                rooms.push({ x: roomX, y: roomY, width: roomWidth, height: roomHeight });

                // Create room floor
                for (let y = roomY; y < roomY + roomHeight; y++) {
                    for (let x = roomX; x < roomX + roomWidth; x++) {
                        newDungeon[y][x] = {
                            type: 'floor',
                            visible: false,
                            explored: false
                        };
                    }
                }
            }
        }

        // Create corridors between rooms
        for (let i = 0; i < rooms.length - 1; i++) {
            const room1 = rooms[i];
            const room2 = rooms[i + 1];
            
            const x1 = room1.x + Math.floor(room1.width / 2);
            const y1 = room1.y + Math.floor(room1.height / 2);
            const x2 = room2.x + Math.floor(room2.width / 2);
            const y2 = room2.y + Math.floor(room2.height / 2);

            // L-shaped corridor
            for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
                if (newDungeon[y1][x].type === 'wall') {
                    newDungeon[y1][x] = { type: 'floor', visible: false, explored: false };
                }
            }
            for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
                if (newDungeon[y][x2].type === 'wall') {
                    newDungeon[y][x2] = { type: 'floor', visible: false, explored: false };
                }
            }
        }

        // Add entrance at starting position
        newDungeon[2][2] = { type: 'entrance', visible: true, explored: true };

        // Add treasures, traps, and stairs
        const floorTiles = [];
        for (let y = 0; y < DUNGEON_HEIGHT; y++) {
            for (let x = 0; x < DUNGEON_WIDTH; x++) {
                if (newDungeon[y][x].type === 'floor' && !(x === 2 && y === 2)) {
                    floorTiles.push({ x, y });
                }
            }
        }

        // Add gold piles
        for (let i = 0; i < Math.min(8, floorTiles.length); i++) {
            const tile = floorTiles.splice(Math.floor(Math.random() * floorTiles.length), 1)[0];
            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'treasure',
                hasGold: 10 + Math.floor(Math.random() * 40)
            };
        }

        // Add traps
        for (let i = 0; i < Math.min(5, floorTiles.length); i++) {
            const tile = floorTiles.splice(Math.floor(Math.random() * floorTiles.length), 1)[0];
            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'trap',
                hasTrap: true,
                trapTriggered: false
            };
        }

        // Add stairs down
        if (floorTiles.length > 0) {
            const tile = floorTiles.splice(Math.floor(Math.random() * floorTiles.length), 1)[0];
            newDungeon[tile.y][tile.x] = {
                ...newDungeon[tile.y][tile.x],
                type: 'stairs_down'
            };
        }

        setDungeon(newDungeon);
    }, []);

    // Initialize dungeon
    useEffect(() => {
        generateDungeon();
    }, [generateDungeon]);

    // Update fog of war
    const updateVisibility = useCallback((playerX: number, playerY: number) => {
        setDungeon(prev => {
            const newDungeon = prev.map(row => [...row]);
            
            // Light radius of 2
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const x = playerX + dx;
                    const y = playerY + dy;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (x >= 0 && x < DUNGEON_WIDTH && y >= 0 && y < DUNGEON_HEIGHT && distance <= 2) {
                        newDungeon[y][x].visible = true;
                        newDungeon[y][x].explored = true;
                    }
                }
            }
            
            return newDungeon;
        });
    }, []);

    // Handle player movement
    const movePlayer = useCallback((dx: number, dy: number) => {
        setPlayer(prev => {
            const newX = Math.max(0, Math.min(DUNGEON_WIDTH - 1, prev.x + dx));
            const newY = Math.max(0, Math.min(DUNGEON_HEIGHT - 1, prev.y + dy));
            
            if (dungeon[newY] && dungeon[newY][newX]) {
                const tile = dungeon[newY][newX];
                
                // Can't move through walls
                if (tile.type === 'wall') {
                    return prev;
                }
                
                let newPlayer = { ...prev, x: newX, y: newY };
                let message = '';
                
                // Handle tile interactions
                switch (tile.type) {
                    case 'treasure':
                        if (tile.hasGold) {
                            newPlayer.gold += tile.hasGold;
                            message = `You found ${tile.hasGold} gold!`;
                            // Remove treasure after collection
                            setDungeon(prevDungeon => {
                                const newDungeon = prevDungeon.map(row => [...row]);
                                newDungeon[newY][newX] = {
                                    ...newDungeon[newY][newX],
                                    type: 'floor',
                                    hasGold: undefined
                                };
                                return newDungeon;
                            });
                        }
                        break;
                        
                    case 'trap':
                        if (tile.hasTrap && !tile.trapTriggered) {
                            const damage = 5 + Math.floor(Math.random() * 10);
                            newPlayer.hp = Math.max(0, newPlayer.hp - damage);
                            message = `You triggered a trap! Lost ${damage} HP.`;
                            // Mark trap as triggered
                            setDungeon(prevDungeon => {
                                const newDungeon = prevDungeon.map(row => [...row]);
                                newDungeon[newY][newX] = {
                                    ...newDungeon[newY][newX],
                                    trapTriggered: true
                                };
                                return newDungeon;
                            });
                        }
                        break;
                        
                    case 'stairs_down':
                        message = 'You found stairs leading deeper into the ruins...';
                        break;
                }
                
                setGameMessage(message);
                setTurnCount(prev => prev + 1);
                
                return newPlayer;
            }
            
            return prev;
        });
    }, [dungeon]);

    // Update visibility when player moves
    useEffect(() => {
        updateVisibility(player.x, player.y);
    }, [player.x, player.y, updateVisibility]);

    // Handle keyboard input
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    movePlayer(0, -1);
                    break;
                case 's':
                case 'arrowdown':
                    movePlayer(0, 1);
                    break;
                case 'a':
                case 'arrowleft':
                    movePlayer(-1, 0);
                    break;
                case 'd':
                case 'arrowright':
                    movePlayer(1, 0);
                    break;
                case 'escape':
                    onExit();
                    break;
            }
            event.preventDefault();
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [movePlayer, onExit]);

    // Get tile display character
    const getTileChar = (tile: DungeonTile, x: number, y: number) => {
        if (!tile.visible && !tile.explored) return ' ';
        
        if (x === player.x && y === player.y) return '@';
        
        if (!tile.visible && tile.explored) {
            // Dim previously seen tiles
            switch (tile.type) {
                case 'wall': return '█';
                case 'floor': return '·';
                case 'door': return '+';
                default: return '·';
            }
        }
        
        switch (tile.type) {
            case 'wall': return '█';
            case 'floor': return '.';
            case 'door': return '+';
            case 'treasure': return '$';
            case 'trap': return tile.trapTriggered ? '^' : '.';
            case 'stairs_down': return '>';
            case 'stairs_up': return '<';
            case 'entrance': return 'E';
            default: return '?';
        }
    };

    // Get tile color
    const getTileColor = (tile: DungeonTile, x: number, y: number) => {
        if (!tile.visible && !tile.explored) return 'text-black';
        
        if (x === player.x && y === player.y) return 'text-yellow-400';
        
        if (!tile.visible && tile.explored) return 'text-gray-600';
        
        switch (tile.type) {
            case 'wall': return 'text-gray-400';
            case 'floor': return 'text-gray-300';
            case 'treasure': return 'text-yellow-400';
            case 'trap': return tile.trapTriggered ? 'text-red-400' : 'text-gray-300';
            case 'stairs_down': return 'text-blue-400';
            case 'entrance': return 'text-green-400';
            default: return 'text-white';
        }
    };

    if (player.hp <= 0) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
                <div className="text-center text-white">
                    <h2 className="text-4xl font-bold text-red-400 mb-4">💀 YOU DIED 💀</h2>
                    <p className="text-xl mb-4">The ancient ruins claimed another victim...</p>
                    <p className="text-lg mb-6">Gold collected: {player.gold}</p>
                    <button
                        onClick={onExit}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Return to Surface
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black text-green-400 font-mono z-50 flex flex-col">
            {/* Header */}
            <div className="bg-gray-900 p-4 border-b border-green-600">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold">🏛️ {ruinType.name}</h1>
                    <div className="flex gap-6">
                        <span>❤️ HP: {player.hp}/{player.maxHp}</span>
                        <span>💰 Gold: {player.gold}</span>
                        <span>🔢 Turns: {turnCount}</span>
                    </div>
                </div>
                {gameMessage && (
                    <div className="mt-2 text-yellow-300">
                        {gameMessage}
                    </div>
                )}
            </div>

            {/* Main game area */}
            <div className="flex-1 flex">
                {/* Dungeon display */}
                <div className="flex-1 p-4 overflow-hidden">
                    <div className="text-xs leading-tight select-none" style={{ fontFamily: 'monospace' }}>
                        {dungeon.map((row, y) => (
                            <div key={y} className="whitespace-nowrap">
                                {row.map((tile, x) => (
                                    <span
                                        key={x}
                                        className={getTileColor(tile, x, y)}
                                    >
                                        {getTileChar(tile, x, y)}
                                    </span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Legend */}
                <div className="w-64 bg-gray-900 p-4 border-l border-green-600">
                    <h3 className="text-lg font-bold mb-4">Legend</h3>
                    <div className="space-y-2 text-sm">
                        <div><span className="text-yellow-400">@</span> - You</div>
                        <div><span className="text-gray-400">█</span> - Wall</div>
                        <div><span className="text-gray-300">.</span> - Floor</div>
                        <div><span className="text-yellow-400">$</span> - Gold</div>
                        <div><span className="text-red-400">^</span> - Triggered trap</div>
                        <div><span className="text-blue-400">𐦏</span> - Stairs down</div>
                        <div><span className="text-green-400">E</span> - Entrance</div>
                        <div><span className="text-gray-600">·</span> - Explored</div>
                    </div>
                    
                    <div className="mt-8">
                        <h3 className="text-lg font-bold mb-4">Controls</h3>
                        <div className="space-y-1 text-sm">
                            <div>WASD or Arrow Keys - Move</div>
                            <div>ESC - Exit dungeon</div>
                        </div>
                    </div>

                    <button
                        onClick={onExit}
                        className="mt-8 w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                        Exit Dungeon
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RoguelikeDisplay;