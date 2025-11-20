/**
 * Simple, realistic discovery prompts for ruin exploration
 * Each discovery presents a binary choice with weighted random outcomes
 */

export interface DiscoveryOutcome {
    chance: number; // 0-1 probability
    result: 'staircase' | 'trap' | 'item' | 'nothing' | 'secret_room';
    message: string;
}

export interface DiscoveryPrompt {
    id: string;
    prompt: string;
    options: [string, string]; // Two choices
    outcomes: {
        [optionIndex: number]: DiscoveryOutcome[];
    };
    roomTypes?: string[]; // Only appear in these room types (optional)
}

export const RUIN_DISCOVERIES: DiscoveryPrompt[] = [
    {
        id: 'draft',
        prompt: "There's a draft of cold air here.",
        options: ["Investigate", "Ignore"],
        outcomes: {
            0: [ // Investigate
                { chance: 0.10, result: 'staircase', message: 'The draft leads to a hidden staircase descending deeper!' },
                { chance: 0.10, result: 'trap', message: 'A stone slab shifts beneath your feet - trap!' },
                { chance: 0.80, result: 'nothing', message: 'Just wind whistling through cracks in the masonry.' }
            ],
            1: [ // Ignore
                { chance: 1.0, result: 'nothing', message: 'You continue onward.' }
            ]
        }
    },
    {
        id: 'loose_stones',
        prompt: "You notice loose stones in the wall.",
        options: ["Pry them loose", "Leave alone"],
        outcomes: {
            0: [ // Pry them loose
                { chance: 0.15, result: 'item', message: 'Behind the stones, you find something hidden!' },
                { chance: 0.10, result: 'trap', message: 'The wall begins to collapse!' },
                { chance: 0.75, result: 'nothing', message: 'Nothing but more rubble behind the stones.' }
            ],
            1: [ // Leave alone
                { chance: 1.0, result: 'nothing', message: 'You leave the wall undisturbed.' }
            ]
        }
    },
    {
        id: 'scratching',
        prompt: "You hear faint scratching sounds from behind the wall.",
        options: ["Break through", "Walk away"],
        outcomes: {
            0: [ // Break through
                { chance: 0.20, result: 'secret_room', message: 'The wall crumbles, revealing a hidden chamber!' },
                { chance: 0.15, result: 'trap', message: 'Rats pour out of the hole! You stumble backwards.' },
                { chance: 0.65, result: 'nothing', message: 'Just vermin nesting in the walls.' }
            ],
            1: [ // Walk away
                { chance: 1.0, result: 'nothing', message: 'You decide not to disturb whatever lurks within.' }
            ]
        }
    },
    {
        id: 'inscriptions',
        prompt: "Strange inscriptions mark the floor in a circular pattern.",
        options: ["Step into circle", "Walk around it"],
        outcomes: {
            0: [ // Step into circle
                { chance: 0.15, result: 'item', message: 'The circle glows faintly - something materializes!' },
                { chance: 0.20, result: 'trap', message: 'The floor gives way beneath you!' },
                { chance: 0.65, result: 'nothing', message: 'The inscriptions are merely decorative.' }
            ],
            1: [ // Walk around
                { chance: 1.0, result: 'nothing', message: 'You carefully avoid the markings.' }
            ]
        }
    },
    {
        id: 'locked_chest',
        prompt: "A small wooden chest sits in the corner, locked but weathered.",
        options: ["Force it open", "Leave it be"],
        outcomes: {
            0: [ // Force open
                { chance: 0.40, result: 'item', message: 'The lock breaks - treasures inside!' },
                { chance: 0.15, result: 'trap', message: 'A needle springs out, pricking your finger!' },
                { chance: 0.45, result: 'nothing', message: 'The chest contains only dust and decay.' }
            ],
            1: [ // Leave it
                { chance: 1.0, result: 'nothing', message: 'You leave the chest undisturbed.' }
            ]
        }
    },
    {
        id: 'rubble_pile',
        prompt: "A pile of rubble partially blocks the passage.",
        options: ["Clear the rubble", "Squeeze past it"],
        outcomes: {
            0: [ // Clear rubble
                { chance: 0.25, result: 'staircase', message: 'Beneath the rubble, you uncover a passage downward!' },
                { chance: 0.15, result: 'trap', message: 'The rubble shifts violently!' },
                { chance: 0.60, result: 'nothing', message: 'You clear a path through the debris.' }
            ],
            1: [ // Squeeze past
                { chance: 1.0, result: 'nothing', message: 'You carefully navigate around the obstruction.' }
            ]
        }
    },
    {
        id: 'altar',
        prompt: "An ancient altar stands here, covered in offerings left by travelers.",
        options: ["Take an offering", "Leave an item"],
        outcomes: {
            0: [ // Take offering
                { chance: 0.30, result: 'item', message: 'Among the offerings, you find something valuable!' },
                { chance: 0.20, result: 'trap', message: 'The altar trembles ominously - bad omen!' },
                { chance: 0.50, result: 'nothing', message: 'The offerings are worthless trinkets.' }
            ],
            1: [ // Leave item (requires item in inventory)
                { chance: 0.50, result: 'item', message: 'The altar glows briefly - fortune smiles upon you!' },
                { chance: 0.50, result: 'nothing', message: 'You pay your respects and continue.' }
            ]
        }
    },
    {
        id: 'mirror',
        prompt: "A tarnished mirror hangs on the wall, reflecting distorted images.",
        options: ["Touch the mirror", "Avoid looking"],
        outcomes: {
            0: [ // Touch mirror
                { chance: 0.15, result: 'secret_room', message: 'The mirror swings open, revealing a hidden passage!' },
                { chance: 0.10, result: 'trap', message: 'The mirror shatters - seven years bad luck!' },
                { chance: 0.75, result: 'nothing', message: 'The glass is cold and lifeless under your touch.' }
            ],
            1: [ // Avoid
                { chance: 1.0, result: 'nothing', message: 'You avert your gaze and move on.' }
            ]
        }
    },
    {
        id: 'suspicious_tile',
        prompt: "One floor tile appears slightly raised compared to the others.",
        options: ["Press down on it", "Step carefully around"],
        outcomes: {
            0: [ // Press tile
                { chance: 0.20, result: 'secret_room', message: 'The tile clicks - a hidden door opens!' },
                { chance: 0.30, result: 'trap', message: 'The tile triggers a mechanism!' },
                { chance: 0.50, result: 'nothing', message: 'The tile is simply loose and worn.' }
            ],
            1: [ // Step around
                { chance: 1.0, result: 'nothing', message: 'You navigate around the suspicious tile.' }
            ]
        }
    },
    {
        id: 'crack_wall',
        prompt: "A large crack runs down the wall, wide enough to peer through.",
        options: ["Look through crack", "Ignore it"],
        outcomes: {
            0: [ // Look through
                { chance: 0.15, result: 'secret_room', message: 'You see another chamber beyond! You find a way in.' },
                { chance: 0.05, result: 'trap', message: 'Something stabs at your eye from the other side!' },
                { chance: 0.80, result: 'nothing', message: 'You see only darkness beyond the wall.' }
            ],
            1: [ // Ignore
                { chance: 1.0, result: 'nothing', message: 'You continue exploring.' }
            ]
        }
    }
];

/**
 * Get a random discovery prompt, optionally filtered by room type
 */
export function getRandomDiscovery(roomType?: string): DiscoveryPrompt {
    const availablePrompts = RUIN_DISCOVERIES.filter(
        p => !p.roomTypes || p.roomTypes.includes(roomType || '')
    );
    return availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
}

/**
 * Roll for an outcome based on choice and probabilities
 */
export function rollOutcome(outcomes: DiscoveryOutcome[]): DiscoveryOutcome {
    const roll = Math.random();
    let cumulative = 0;

    for (const outcome of outcomes) {
        cumulative += outcome.chance;
        if (roll < cumulative) {
            return outcome;
        }
    }

    // Fallback to last outcome
    return outcomes[outcomes.length - 1];
}
