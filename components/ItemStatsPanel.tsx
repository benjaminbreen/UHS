/**
 * components/ItemStatsPanel.tsx - A reusable panel to display derived character stats.
 */
import React, { useMemo } from 'react';
import { PlayerCharacter } from '../types';
import { getProceduralItemStats } from '../services/combatService';

interface ItemStatsPanelProps {
    character: PlayerCharacter;
    comparisonStats?: { attack: number; defense: number } | null;
}

const StatRow: React.FC<{ label: string; value: number; change?: number }> = ({ label, value, change }) => {
    const changeColor = change && change > 0 ? 'text-green-400' : 'text-red-400';
    const sign = change && change > 0 ? '+' : '';

    return (
        <div className="flex justify-between items-baseline text-sm">
            <span className="text-text-secondary">{label}:</span>
            <div className="font-semibold text-text-primary">
                <span>{value}</span>
                {change !== undefined && change !== 0 && (
                    <span className={`ml-2 font-mono ${changeColor}`}>
                        ({sign}{change})
                    </span>
                )}
            </div>
        </div>
    );
};

const ItemStatsPanel: React.FC<ItemStatsPanelProps> = ({ character, comparisonStats }) => {
    const totalStats = useMemo(() => {
        let totalAttack = character.stats.attack || 0;
        let totalDefense = character.stats.defense || 0;

        Object.values(character.equippedItems).forEach(item => {
            if (item) {
                const itemStats = getProceduralItemStats(item);
                totalAttack += itemStats.attack;
                totalDefense += itemStats.defense;
            }
        });
        
        return { totalAttack, totalDefense };
    }, [character.equippedItems, character.stats]);

    return (
        <div className="surface-card rounded-xl p-4">
            <h3 className="text-lg font-bold text-center text-amber-400 mb-3 uppercase tracking-wider">
                Combat Stats
            </h3>
            <div className="space-y-2">
                <StatRow 
                    label="⚔️ Attack" 
                    value={totalStats.totalAttack}
                    change={comparisonStats?.attack}
                />
                <StatRow 
                    label="🛡️ Defense" 
                    value={totalStats.totalDefense}
                    change={comparisonStats?.defense}
                />
                {/* Add other stats like luck, speed etc. here in the future */}
            </div>
        </div>
    );
};

export default ItemStatsPanel;
