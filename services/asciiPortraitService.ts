/**
 * services/asciiPortraitService.ts - Generate ASCII art portraits for roguelike entities
 */

interface PortraitData {
    lines: string[];
    width: number;
    height: number;
}

// Base portraits for different entity types
const BASE_PORTRAITS: Record<string, PortraitData> = {
    // Human NPCs
    'hermit': {
        lines: [
            '   .-..-.',
            '  /  _  \\',
            ' |  o o  |',
            ' |   >   |',
            '  \\ --- /',
            '  /|||||\\',
            ' /_|||||_\\'
        ],
        width: 11,
        height: 7
    },
    'bandit': {
        lines: [
            '   _____',
            '  /     \\',
            ' | ◉   ◉ |',
            ' |   <   |',
            '  \\ --- /',
            '   |>◆<|',
            '   |___|'
        ],
        width: 11,
        height: 7
    },
    'treasure_hunter': {
        lines: [
            '   ___',
            '  /   \\',
            ' | o o |',
            ' |  -  |',
            '  \\___/',
            '  /| |\\',
            ' /_|_|_\\'
        ],
        width: 9,
        height: 7
    },
    'scholar': {
        lines: [
            '   _____',
            '  (     )',
            ' | ▪ ▪ |',
            ' |  ╱  |',
            '  \\___/',
            '  /┃ ┃\\',
            ' /_┃_┃_\\'
        ],
        width: 9,
        height: 7
    },
    'archaeologist': {
        lines: [
            '   ⌐■-■',
            '  /   \\',
            ' | ● ● |',
            ' |  ─  |',
            '  \\___/',
            '  /|‾|\\',
            ' /_|_|_\\'
        ],
        width: 9,
        height: 7
    },
    'rebel': {
        lines: [
            '   ∩___∩',
            '  |     |',
            ' | ✦ ✦ |',
            ' |  ∆  |',
            '  \\_=_/',
            '  <|†|>',
            '   |_|'
        ],
        width: 9,
        height: 7
    },
    'refugee': {
        lines: [
            '   ___',
            '  /   \\',
            ' | • • |',
            ' |  ~  |',
            '  \\___/',
            '  /| |\\',
            ' /_|_|_\\'
        ],
        width: 9,
        height: 7
    },
    'cultist': {
        lines: [
            '  ▲▲▲▲▲',
            ' /     \\',
            '| ☉   ☉ |',
            '|   ▼   |',
            ' \\ ~~~ /',
            '  |◆◆◆|',
            '  |___|'
        ],
        width: 11,
        height: 7
    },
    'guard': {
        lines: [
            '   ╔═╗',
            '  /   \\',
            ' | ◎ ◎ |',
            ' |  ─  |',
            '  \\___/',
            '  /║ ║\\',
            ' /_║_║_\\'
        ],
        width: 9,
        height: 7
    },
    
    // Animals
    'rat': {
        lines: [
            '  __QQ',
            ' (_)_">',
            '_/    \\',
            '\\     /',
            ' ~~-~~'
        ],
        width: 7,
        height: 5
    },
    'bat': {
        lines: [
            ' /\\_/\\',
            '( o.o )',
            ' > ^ <',
            '/|   |\\',
            '\\/   \\/'
        ],
        width: 8,
        height: 5
    },
    'snake': {
        lines: [
            '    ____',
            '   /    \\',
            '  | •  • |',
            '   \\  ∨ /',
            '    ~~~~',
            '   ~~~~~',
            '  ~~~~~~'
        ],
        width: 10,
        height: 7
    },
    'cobra': {
        lines: [
            '   _/\\_',
            '  /    \\',
            ' | ◉  ◉ |',
            '  \\  ∨ /',
            '   |  |',
            '   ~~~~',
            '  ~~~~~'
        ],
        width: 10,
        height: 7
    },
    'spider': {
        lines: [
            ' /\\ /\\',
            '((oo))',
            '//||\\\\',
            '//||\\\\',
            '  ||'
        ],
        width: 8,
        height: 5
    },
    'wolf': {
        lines: [
            '  /\\_/\\',
            ' ( o.o )',
            '  > ^ <',
            ' /|   |\\',
            '(_)   (_)'
        ],
        width: 10,
        height: 5
    },
    'bear': {
        lines: [
            '  ʕ•ᴥ•ʔ',
            ' /     \\',
            '| (o o) |',
            '|   ᴥ   |',
            ' \\_____/',
            '  |   |',
            '  |___|'
        ],
        width: 11,
        height: 7
    },
    'leopard': {
        lines: [
            '  /\\_/\\',
            ' ( ◉.◉ )',
            '  > ω <',
            ' /● ● ●\\',
            '(_)   (_)'
        ],
        width: 10,
        height: 5
    },
    'jaguar': {
        lines: [
            '  /\\_/\\',
            ' ( ⬤.⬤ )',
            '  > ω <',
            ' /◉ ◉ ◉\\',
            '(_)   (_)'
        ],
        width: 10,
        height: 5
    },
    'scorpion': {
        lines: [
            '   \\|/',
            '  (o o)',
            ' //| |\\\\',
            '// | | \\\\',
            '   |_|',
            '    U'
        ],
        width: 10,
        height: 6
    },
    'crocodile': {
        lines: [
            ' ______..-',
            '<_____<◉>)',
            ' ^^^^^^``-',
            '  VVVVV'
        ],
        width: 12,
        height: 4
    }
};

// Generate variations based on hostility
export function getASCIIPortrait(entityType: string, subtype: string, hostile: boolean): PortraitData {
    // Try to find specific portrait for subtype first, then fall back to type
    let portrait = BASE_PORTRAITS[subtype] || BASE_PORTRAITS[entityType];
    
    // If no portrait found, generate a generic one
    if (!portrait) {
        portrait = {
            lines: [
                '   ???',
                '  /   \\',
                ' | ? ? |',
                ' |  ?  |',
                '  \\___/',
                '   | |',
                '   |_|'
            ],
            width: 9,
            height: 7
        };
    }
    
    // Modify portrait based on hostility
    if (hostile && entityType !== 'animal') {
        // Make hostile NPCs look angrier
        portrait = {
            ...portrait,
            lines: portrait.lines.map(line => {
                return line
                    .replace(/o/g, '◉')  // Wide eyes
                    .replace(/•/g, '✦')  // Alert eyes
                    .replace(/─/g, '╍')  // Frowning
                    .replace(/\~/g, '≈'); // Gritted teeth
            })
        };
    }
    
    return portrait;
}

// Add a decorative frame around the portrait
export function framePortrait(portrait: PortraitData, entityName: string): string[] {
    const frameWidth = Math.max(portrait.width + 4, entityName.length + 4);
    const paddedLines: string[] = [];
    
    // Top frame
    paddedLines.push('╔' + '═'.repeat(frameWidth - 2) + '╗');
    
    // Portrait lines
    portrait.lines.forEach(line => {
        const padding = Math.floor((frameWidth - 2 - line.length) / 2);
        const rightPadding = frameWidth - 2 - line.length - padding;
        paddedLines.push('║' + ' '.repeat(padding) + line + ' '.repeat(rightPadding) + '║');
    });
    
    // Name separator
    paddedLines.push('╟' + '─'.repeat(frameWidth - 2) + '╢');
    
    // Entity name (centered)
    const namePadding = Math.floor((frameWidth - 2 - entityName.length) / 2);
    const nameRightPadding = frameWidth - 2 - entityName.length - namePadding;
    paddedLines.push('║' + ' '.repeat(namePadding) + entityName + ' '.repeat(nameRightPadding) + '║');
    
    // Bottom frame
    paddedLines.push('╚' + '═'.repeat(frameWidth - 2) + '╝');
    
    return paddedLines;
}

// Generate health indicator for portrait
export function getHealthBar(hp: number, maxHp: number, width: number = 10): string {
    const percentage = hp / maxHp;
    const filled = Math.floor(percentage * width);
    const empty = width - filled;
    
    let bar = '';
    if (percentage > 0.66) {
        bar = '█'.repeat(filled); // Green/healthy
    } else if (percentage > 0.33) {
        bar = '▓'.repeat(filled); // Yellow/wounded  
    } else {
        bar = '▒'.repeat(filled); // Red/critical
    }
    
    return '[' + bar + '░'.repeat(empty) + ']';
}

// Cultural variations for specific zones
export function applyCulturalStyle(portrait: PortraitData, culturalZone: string): PortraitData {
    const modifiedLines = [...portrait.lines];
    
    switch(culturalZone) {
        case 'EAST_ASIAN':
            // Add conical hat for some NPCs
            if (portrait.height >= 7) {
                modifiedLines[0] = '   /_\\';
            }
            break;
        case 'MENA':
            // Add turban/headwrap
            if (portrait.height >= 7) {
                modifiedLines[0] = '  ∿∿∿∿∿';
            }
            break;
        case 'SOUTH_ASIAN':
            // Add bindi or tilaka
            modifiedLines.forEach((line, i) => {
                if (line.includes('|') && line.includes('o') && i === 2) {
                    modifiedLines[i] = line.replace(/o\s+o/, 'o·o');
                }
            });
            break;
        case 'SUB_SAHARAN_AFRICAN':
            // Add decorative patterns
            modifiedLines.forEach((line, i) => {
                if (i === portrait.height - 1 || i === portrait.height - 2) {
                    modifiedLines[i] = line.replace(/\|/g, '╫');
                }
            });
            break;
    }
    
    return {
        ...portrait,
        lines: modifiedLines
    };
}