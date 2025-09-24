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
        // Start with 10% native language even on home map for more noticeable effect
        this.state.visitedAreas.set(mapArea, 10);
        this.state.currentDistance = 10;
        console.log('[Dialect Continuum] Initialized at', mapArea, 'with 10% native language');
    }

    /**
     * Enable or disable the dialect continuum feature
     */
    setEnabled(enabled: boolean) {
        this.state.enabled = enabled;
        if (!enabled) {
            this.state.currentDistance = 0; // Reset to default when disabled
        } else if (this.state.originMapArea && this.state.currentDistance === 0) {
            // If enabling and we're on origin map but distance is 0, set to 10%
            this.state.currentDistance = 10;
        }
        console.log('[Dialect Continuum]', enabled ? 'Enabled' : 'Disabled', 'distance:', this.state.currentDistance + '%');
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
        // More aggressive progression: start at 30% for first new map, then +20% per transition
        let newDistance = Math.min(30 + ((areaTransitions - 1) * 20), 100);

        // Accelerate if crossing cultural zones
        if (culturalZoneChanged) {
            newDistance = Math.min(newDistance + 30, 100);
            console.log('[Dialect Continuum] Cultural zone change detected, accelerating distance');
        }

        // Cap at 70% for same cultural zone, 90% for different cultural zone
        if (!culturalZoneChanged && newDistance > 70) {
            newDistance = 70;
        } else if (culturalZoneChanged && newDistance > 90) {
            newDistance = 90;
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

        // More explicit word category instructions based on percentage
        let wordTypesToReplace = '';
        let concreteInstructions = '';

        if (distance === 10) {
            // Home map: 10% - greetings and exclamations
            wordTypesToReplace = 'greetings (hello, goodbye), exclamations (yes, no, oh), and titles (sir, friend)';
            concreteInstructions = 'Start every dialogue with a greeting in ' + nativeLanguage + '. Add 1-2 more native words.';
        } else if (distance <= 30) {
            // First new map: 30% - common nouns and simple verbs
            wordTypesToReplace = 'greetings, common nouns (village, house, food, water, person, thing), simple verbs (come, go, see, want, have), and basic adjectives (good, bad, big, small)';
            concreteInstructions = 'Every sentence MUST have at least 2-3 words in ' + nativeLanguage + '. Mix individual words AND short phrases.';
        } else if (distance <= 50) {
            // Second new map: 50% - half the dialogue
            wordTypesToReplace = 'HALF of all words';
            concreteInstructions = 'Alternate between English and ' + nativeLanguage + ' phrases. Every other phrase should be in ' + nativeLanguage + '.';
        } else if (distance <= 70) {
            // Further maps: 70% - mostly native
            wordTypesToReplace = 'MOST words except item names and numbers';
            concreteInstructions = 'Speak primarily in ' + nativeLanguage + '. Only game-critical terms (item names, quest objectives, numbers) stay in English.';
        } else {
            // Cultural zone change: 90% - almost entirely native
            wordTypesToReplace = 'NEARLY ALL words';
            concreteInstructions = 'Speak almost entirely in ' + nativeLanguage + '. Maximum 1-2 English words per sentence.';
        }

        return `
            **DIALECT CONTINUUM MODE - MANDATORY ${distance}% ${nativeLanguage}**

            YOU MUST INCLUDE EXACTLY ${distance}% OF YOUR WORDS IN ${nativeLanguage}.

            Replace these word types: ${wordTypesToReplace}

            ${concreteInstructions}

            CRITICAL REQUIREMENTS:
            1. ALWAYS use italics (*word*) to mark EVERY foreign word
            2. Count carefully: For every 10 words, exactly ${Math.floor(distance/10)} MUST be in ${nativeLanguage}
            3. If you don't know ${nativeLanguage}, create phonetically plausible words based on that language family
            4. For non-Latin scripts (Chinese/Arabic/Japanese), use romanization/pinyin

            ENFORCEMENT: If your response doesn't contain ${distance}% foreign words, you have FAILED.

            Example for ${distance}% mixing:
            - 10%: "Hello traveler, welcome to our village" → "*Bonjour* traveler, and welcome to our village."
            - 30%: "Hello traveler, welcome to our village" → "*Bonjour* traveler, and welcome to *notre village.*"
            - 50%: "Hello traveler, welcome to our village?" → "*Bonjour voyageur*, y welcome to *notre village.*"
            - 70%: "Hello friend, welcome to our village?" → "*Bonjour voyageur*, y welcome a *notre village."

            The player expects ${distance}% foreign language, regardless of the challenge. DELIVER IT.
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