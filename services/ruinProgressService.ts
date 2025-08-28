/**
 * services/ruinProgressService.ts
 * Tracks ruin exploration progress between RoguelikeDisplayEnhanced and RuinStructureModal
 */

interface RuinChamber {
    id: string;
    name: string;
    discovered: boolean;
    depth: number;
    description?: string;
    artifacts?: string[];
}

interface RuinProgress {
    structureId: string;
    chambersDiscovered: RuinChamber[];
    totalChambers: number;
    artifactsFound: string[];
    deepestLevel: number;
    lastExplored: Date | null;
}

class RuinProgressService {
    private progressCache: Map<string, RuinProgress> = new Map();
    private storageKey = 'ruinExplorationProgress';

    constructor() {
        this.loadFromStorage();
    }

    /**
     * Get or create progress for a ruin structure
     */
    getProgress(structureId: string): RuinProgress {
        if (!this.progressCache.has(structureId)) {
            const newProgress: RuinProgress = {
                structureId,
                chambersDiscovered: [],
                totalChambers: this.generateTotalChambers(),
                artifactsFound: [],
                deepestLevel: 0,
                lastExplored: null
            };
            this.progressCache.set(structureId, newProgress);
            this.saveToStorage();
        }
        return this.progressCache.get(structureId)!;
    }

    /**
     * Generate historically accurate chamber names based on ruin type
     */
    generateChamberName(ruinType: string, depth: number, culturalZone?: string): string {
        const chamberTypes = this.getChamberTypesForRuin(ruinType, culturalZone || 'EUROPEAN');
        const randomType = chamberTypes[Math.floor(Math.random() * chamberTypes.length)];
        
        // Add depth-based modifiers
        const depthModifiers = depth > 3 ? ['Deep', 'Lower', 'Hidden', 'Ancient'] : ['Upper', 'Outer', 'Main'];
        const modifier = depthModifiers[Math.floor(Math.random() * depthModifiers.length)];
        
        return `${modifier} ${randomType}`;
    }

    /**
     * Get historically appropriate chamber types for different ruin types
     */
    private getChamberTypesForRuin(ruinType: string, culturalZone: string): string[] {
        const type = ruinType.toLowerCase();
        
        if (type.includes('temple') || type.includes('church') || type.includes('monastery')) {
            if (culturalZone === 'EAST_ASIAN') {
                return ['Prayer Hall', 'Meditation Chamber', 'Shrine Room', 'Bell Tower', 'Scripture Hall', 'Abbot\'s Quarters'];
            } else if (culturalZone === 'MENA') {
                return ['Prayer Hall', 'Mihrab Chamber', 'Minaret Base', 'Courtyard', 'Ablution Room', 'Scholar\'s Cell'];
            } else {
                return ['Chapel', 'Nave', 'Transept', 'Crypt', 'Bell Tower', 'Scriptorium', 'Refectory', 'Cloister'];
            }
        }
        
        if (type.includes('palace') || type.includes('castle') || type.includes('fortress')) {
            return ['Throne Room', 'Great Hall', 'Guard Chamber', 'Armory', 'Treasury', 'Kitchen', 'Dungeon', 'Watchtower'];
        }
        
        if (type.includes('pyramid')) {
            return ['Burial Chamber', 'Antechamber', 'Grand Gallery', 'Queen\'s Chamber', 'Descending Passage', 'Subterranean Chamber'];
        }
        
        // Default chambers for unknown ruin types
        return ['Main Hall', 'Side Chamber', 'Storage Room', 'Collapsed Room', 'Antechamber', 'Hidden Passage'];
    }

    /**
     * Record chamber discovery
     */
    discoverChamber(structureId: string, depth: number, ruinType: string, culturalZone?: string): RuinChamber {
        const progress = this.getProgress(structureId);
        const chamberId = `${structureId}-${depth}-${Date.now()}`;
        const chamberName = this.generateChamberName(ruinType, depth, culturalZone);
        
        const newChamber: RuinChamber = {
            id: chamberId,
            name: chamberName,
            discovered: true,
            depth,
            description: `A ${ruinType.toLowerCase()} chamber at depth ${depth}`
        };
        
        progress.chambersDiscovered.push(newChamber);
        progress.deepestLevel = Math.max(progress.deepestLevel, depth);
        progress.lastExplored = new Date();
        
        this.progressCache.set(structureId, progress);
        this.saveToStorage();
        
        return newChamber;
    }

    /**
     * Record artifact discovery
     */
    discoverArtifact(structureId: string, artifactId: string): void {
        const progress = this.getProgress(structureId);
        if (!progress.artifactsFound.includes(artifactId)) {
            progress.artifactsFound.push(artifactId);
            this.progressCache.set(structureId, progress);
            this.saveToStorage();
        }
    }

    /**
     * Get chambers discovered count for UI display
     */
    getChambersDiscoveredText(structureId: string): string {
        const progress = this.getProgress(structureId);
        return `${progress.chambersDiscovered.length} / ${progress.totalChambers}`;
    }

    /**
     * Generate a reasonable total number of chambers for a ruin
     */
    private generateTotalChambers(): number {
        return Math.floor(Math.random() * 15) + 8; // 8-22 chambers
    }

    /**
     * Save progress to localStorage
     */
    private saveToStorage(): void {
        try {
            const data: { [key: string]: RuinProgress } = {};
            this.progressCache.forEach((progress, id) => {
                data[id] = progress;
            });
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch (error) {
            console.warn('Failed to save ruin progress to storage:', error);
        }
    }

    /**
     * Load progress from localStorage
     */
    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const data = JSON.parse(stored);
                Object.entries(data).forEach(([id, progress]) => {
                    // Convert lastExplored back to Date
                    const progressData = progress as RuinProgress;
                    if (progressData.lastExplored) {
                        progressData.lastExplored = new Date(progressData.lastExplored);
                    }
                    this.progressCache.set(id, progressData);
                });
            }
        } catch (error) {
            console.warn('Failed to load ruin progress from storage:', error);
        }
    }
}

export const ruinProgressService = new RuinProgressService();
export type { RuinProgress, RuinChamber };