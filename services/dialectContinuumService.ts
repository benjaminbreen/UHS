/**
 * Dialect Continuum Service
 *
 * Simulates linguistic transitions across geographical distances by gradually
 * introducing foreign language elements as players travel further from their
 * starting location.
 */

export interface DialectContinuumState {
    enabled: boolean;
    originMapArea: string | null;
    originCoordinates: { x: number; y: number } | null;
    visitedAreas: Map<string, number>; // area -> distance from origin
    currentDistance: number; // 0-100% foreign
}

class DialectContinuumService {
    private state: DialectContinuumState = {
        enabled: false,
        originMapArea: null,
        originCoordinates: null,
        visitedAreas: new Map(),
        currentDistance: 0
    };

    /**
     * Initialize or reset the dialect continuum system
     */
    initialize(mapArea: string, coordinates: { x: number; y: number }) {
        this.state.originMapArea = mapArea;
        this.state.originCoordinates = coordinates;
        this.state.visitedAreas.clear();
        this.state.visitedAreas.set(mapArea, 0);
        this.state.currentDistance = 0;
        console.log('[Dialect Continuum] Initialized at', mapArea);
    }

    /**
     * Enable or disable the dialect continuum feature
     */
    setEnabled(enabled: boolean) {
        this.state.enabled = enabled;
        if (!enabled) {
            this.state.currentDistance = 0; // Reset to default when disabled
        }
        console.log('[Dialect Continuum]', enabled ? 'Enabled' : 'Disabled');
    }

    /**
     * Check if the feature is enabled
     */
    isEnabled(): boolean {
        return this.state.enabled;
    }

    /**
     * Update player movement to a new map area
     */
    updatePlayerMovement(newArea: string, culturalZoneChanged: boolean = false) {
        if (!this.state.enabled || !this.state.originMapArea) return;

        // Check if we've been to this area before
        if (this.state.visitedAreas.has(newArea)) {
            this.state.currentDistance = this.state.visitedAreas.get(newArea) || 0;
            console.log('[Dialect Continuum] Returning to', newArea, 'distance:', this.state.currentDistance);
            return;
        }

        // Calculate new distance based on area transitions
        const areaTransitions = this.state.visitedAreas.size;
        let newDistance = Math.min(areaTransitions * 10, 100);

        // Accelerate if crossing cultural zones
        if (culturalZoneChanged) {
            newDistance = Math.min(newDistance + 30, 100);
            console.log('[Dialect Continuum] Cultural zone change detected, accelerating distance');
        }

        // Cap at 70% for same cultural zone
        if (!culturalZoneChanged && newDistance > 70) {
            newDistance = 70;
        }

        this.state.visitedAreas.set(newArea, newDistance);
        this.state.currentDistance = newDistance;
        console.log('[Dialect Continuum] New area:', newArea, 'distance:', newDistance + '%');
    }

    /**
     * Get current linguistic distance (0-100%)
     */
    getCurrentDistance(): number {
        return this.state.enabled ? this.state.currentDistance : 0;
    }

    /**
     * Mix English and native language text based on current distance
     * This is a simple word-position-based mixing for MVP
     */
    mixLanguages(englishText: string, nativeText: string, overridePercentage?: number): string {
        const percentage = overridePercentage ?? this.state.currentDistance;

        if (percentage === 0) return englishText;
        if (percentage >= 100) return nativeText;

        // Split into words
        const engWords = englishText.split(' ');
        const natWords = nativeText.split(' ');

        // Calculate how many words to replace
        const numForeign = Math.floor(engWords.length * (percentage / 100));

        // Create array of indices and shuffle
        const indices: number[] = [];
        for (let i = 0; i < engWords.length; i++) {
            indices.push(i);
        }

        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Replace words at selected indices
        const selectedIndices = indices.slice(0, numForeign);
        selectedIndices.forEach(i => {
            if (natWords[i]) {
                // Italicize foreign words for visual distinction
                engWords[i] = `*${natWords[i]}*`;
            }
        });

        return engWords.join(' ');
    }

    /**
     * Generate a prompt instruction for LLM-based language mixing
     */
    generateLLMPrompt(nativeLanguage: string, percentage?: number): string {
        const distance = percentage ?? this.state.currentDistance;

        if (distance === 0) {
            return 'Respond in modern English.';
        }

        if (distance >= 100) {
            return `Respond entirely in ${nativeLanguage}. Do not use any English words.`;
        }

        // Progressive mixing instructions
        let example = '';
        if (distance <= 20) {
            example = 'Example: "Bonjour, traveler! What brings you to notre village today?"';
        } else if (distance <= 40) {
            example = 'Example: "Bonjour, voyageur! Qu\'est-ce qui brings you à notre village aujourd\'hui?"';
        } else if (distance <= 60) {
            example = 'Example: "Bonjour, voyageur! Qu\'est-ce qui vous amène to notre village aujourd\'hui?"';
        } else if (distance <= 80) {
            example = 'Example: "Bonjour, voyageur! Qu\'est-ce qui vous amène à notre village today?"';
        }

        return `
            **DIALECT CONTINUUM MODE**
            Mix English with ${nativeLanguage} at approximately ${distance}% foreign words.
            ${example}

            Rules:
            - Randomly distribute foreign words throughout your response
            - Keep critical game information (items, directions) more in English
            - Use italics (*word*) to mark foreign words
            - Maintain natural sentence flow
            - At ${distance}% use roughly ${Math.floor(distance/10)}/10 words from ${nativeLanguage}
        `;
    }

    /**
     * Get current state for debugging
     */
    getState(): DialectContinuumState {
        return { ...this.state };
    }

    /**
     * Load state from localStorage
     */
    loadState() {
        try {
            const saved = localStorage.getItem('dialectContinuumState');
            if (saved) {
                const parsed = JSON.parse(saved);
                // Reconstruct Map from array
                this.state = {
                    ...parsed,
                    visitedAreas: new Map(parsed.visitedAreas || [])
                };
                console.log('[Dialect Continuum] Loaded state from localStorage');
            }
        } catch (error) {
            console.error('[Dialect Continuum] Failed to load state:', error);
        }
    }

    /**
     * Save state to localStorage
     */
    saveState() {
        try {
            const toSave = {
                ...this.state,
                // Convert Map to array for JSON serialization
                visitedAreas: Array.from(this.state.visitedAreas.entries())
            };
            localStorage.setItem('dialectContinuumState', JSON.stringify(toSave));
        } catch (error) {
            console.error('[Dialect Continuum] Failed to save state:', error);
        }
    }

    /**
     * Clear all state
     */
    reset() {
        this.state = {
            enabled: false,
            originMapArea: null,
            originCoordinates: null,
            visitedAreas: new Map(),
            currentDistance: 0
        };
        localStorage.removeItem('dialectContinuumState');
        console.log('[Dialect Continuum] State reset');
    }
}

// Export singleton instance
export const dialectContinuumService = new DialectContinuumService();