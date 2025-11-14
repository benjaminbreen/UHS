/**
 * components/NpcHouseholdPanel.tsx
 * Standalone household display panel for NPCs
 * Shows family members and household composition
 */

import React, { useMemo } from 'react';
import { NpcEntity } from '../types';

interface HouseholdMember {
    relation: string;
    name: string;
    age: number;
    profession: string;
    health: string;
}

interface NpcHouseholdPanelProps {
    npc: NpcEntity;
}

/**
 * Generates deterministic household data based on NPC attributes
 */
function generateHouseholdMembers(npc: NpcEntity): HouseholdMember[] {
    const household: HouseholdMember[] = [];
    const age = npc.age || 30;
    const seed = npc.id ? npc.id.charCodeAt(0) : 0; // Use NPC id as seed for consistency
    
    // Use seeded random for consistency
    const seededRandom = (index: number) => {
        const x = Math.sin(seed + index) * 10000;
        return x - Math.floor(x);
    };
    
    // Spouse (50% chance if over 20)
    if (age > 20 && seededRandom(1) > 0.5) {
        household.push({
            relation: 'Spouse',
            name: `${npc.name}'s spouse`,
            age: age + Math.floor(seededRandom(2) * 10 - 5),
            profession: 'Homemaker',
            health: seededRandom(3) < 0.33 ? 'Sick (Common Cold)' : 'Healthy'
        });
    }
    
    // Children (if over 25)
    if (age > 25) {
        const numChildren = Math.floor(seededRandom(4) * 4);
        for (let i = 0; i < numChildren; i++) {
            const childAge = Math.max(1, Math.min(age - 18, Math.floor(seededRandom(5 + i) * (age - 20))));
            household.push({
                relation: seededRandom(6 + i) > 0.5 ? 'Son' : 'Daughter',
                name: `Child ${i + 1}`,
                age: childAge,
                profession: childAge > 14 ? 'Apprentice' : 'Child',
                health: seededRandom(7 + i) < 0.33 ? 'Sick (Common Cold)' : 'Healthy'
            });
        }
    }
    
    // Parents (30% chance if under 40)
    if (age < 40 && seededRandom(20) > 0.7) {
        household.push({
            relation: 'Mother',
            name: `${npc.name}'s mother`,
            age: age + 20 + Math.floor(seededRandom(21) * 10),
            profession: 'Elder',
            health: seededRandom(22) < 0.4 ? 'Sick (Chronic illness)' : 'Frail'
        });
    }
    
    return household;
}

/**
 * Reusable household panel component for NPC family display
 */
export const NpcHouseholdPanel: React.FC<NpcHouseholdPanelProps> = ({ npc }) => {
    // Generate household data once using useMemo
    const household = useMemo(() => generateHouseholdMembers(npc), [npc.id, npc.age, npc.name]);

    return (
        <div className="space-y-3">
            <h4 className="text-lg font-semibold text-blue-300">Household Members</h4>
            {household.length === 0 ? (
                <p className="italic" style={{ color: 'var(--text-muted)' }}>{npc.name} lives alone.</p>
            ) : (
                <div className="space-y-2">
                    {household.map((member, idx) => (
                        <div key={`${member.relation}-${idx}`} className="p-3 rounded-lg border" style={{ backgroundColor: 'var(--surface-muted-bg)', borderColor: 'var(--border-normal)' }}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{member.relation}</span>
                                    <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>{member.name}</span>
                                </div>
                                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Age {member.age}</span>
                            </div>
                            <div className="text-xs mt-1">
                                <span style={{ color: 'var(--text-secondary)' }}>{member.profession}</span>
                                {member.health !== 'Healthy' && (
                                    <span className={`ml-2 ${member.health.includes('Sick') ? 'text-orange-500' : 'text-yellow-500'}`}>
                                        • {member.health}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NpcHouseholdPanel;