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
        // Start with 0% on home map - only a single greeting if appropriate
        this.state.visitedAreas.set(mapArea, 0);
        this.state.currentDistance = 0;
        console.log('[Dialect Continuum] Initialized at', mapArea, 'with 0% foreign language (greeting only)');
    }

    /**
     * Enable or disable the dialect continuum feature
     */
    setEnabled(enabled: boolean) {
        this.state.enabled = enabled;
        if (!enabled) {
            this.state.currentDistance = 0; // Reset to default when disabled
        }
        // When enabled, keep whatever distance we have (0% for home map is now correct)
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
        // Note: visitedAreas.size includes the home map, so we need to account for that
        const areaTransitions = this.state.visitedAreas.size;
        const mapsFromHome = areaTransitions; // This is the actual count including home

        // Slower progression to reach ~90% by map 8:
        // Map 1 (home): 0%, Map 2: 15%, Map 3: 25%, Map 4: 35%, Map 5: 50%, Map 6: 65%, Map 7: 80%, Map 8: 90%
        let newDistance: number;

        if (mapsFromHome === 2) {
            newDistance = 15; // First new map after home: 1-2 foreign words
        } else if (mapsFromHome === 3) {
            newDistance = 25; // Second new map: 2-3 foreign words
        } else if (mapsFromHome === 4) {
            newDistance = 35; // Third new map: 3-4 foreign words
        } else if (mapsFromHome === 5) {
            newDistance = 50; // Fourth new map: half and half
        } else if (mapsFromHome === 6) {
            newDistance = 65; // Fifth new map: mostly foreign
        } else if (mapsFromHome === 7) {
            newDistance = 80; // Sixth new map: predominantly foreign
        } else if (mapsFromHome >= 8) {
            newDistance = 90; // Seventh+ new maps: almost entirely foreign
        } else {
            // Shouldn't happen, but default to low percentage
            newDistance = 15;
        }

        // Moderate acceleration if crossing cultural zones (+15% instead of +30%)
        if (culturalZoneChanged) {
            const originalDistance = newDistance;
            newDistance = Math.min(newDistance + 15, 90); // Cap at 90% even with cultural zone bonus
            console.log('[Dialect Continuum] Cultural zone change detected, acceleration from', originalDistance, 'to', newDistance);
        }

        // Hard cap at 90% to always keep some English for gameplay clarity
        if (newDistance > 90) {
            console.log('[Dialect Continuum] Capping distance from', newDistance, 'to 90%');
            newDistance = 90;
        }

        this.state.visitedAreas.set(newArea, newDistance);
        this.state.currentDistance = newDistance;
        console.log('[Dialect Continuum] New area:', newArea, 'maps from home:', mapsFromHome, 'distance:', newDistance + '%');
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
     * Extract foreign words from text that contains italicized foreign words (*word*)
     * Returns array of foreign words without asterisks
     */
    extractForeignWords(text: string): string[] {
        const foreignWords: string[] = [];
        const regex = /\*([^*]+)\*/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            foreignWords.push(match[1]);
        }

        return foreignWords;
    }

    /**
     * Extract foreign words with their context for translation mapping
     * Returns a Set to avoid duplicates
     */
    extractUniqueForeignWords(text: string): Set<string> {
        return new Set(this.extractForeignWords(text));
    }

    /**
     * Generate a prompt instruction for LLM-based language mixing
     */
    generateLLMPrompt(nativeLanguage: string, percentage?: number): string {
        const distance = percentage ?? this.state.currentDistance;

        if (distance === 0) {
            return 'Respond in modern English. You may use ONE greeting word in the native language if contextually appropriate.';
        }

        // If the native language IS English (or a variant), there's no foreign language to mix in
        const langLower = nativeLanguage.toLowerCase();
        if (langLower.includes('english') || langLower === 'modern english' || langLower === 'early modern english') {
            return 'Respond in modern English. Use natural, era-appropriate English vocabulary.';
        }

        // Never allow 100% foreign language
        if (distance >= 95) {
            console.warn('[Dialect Continuum] Warning: Distance at or above 95%, capping at 90% for prompts');
            const cappedDistance = 90;
            return this.generateLLMPrompt(nativeLanguage, cappedDistance); // Recursive call with capped value
        }

        // More explicit word category instructions based on percentage
        let wordTypesToReplace = '';
        let concreteInstructions = '';

        if (distance === 0) {
            // Home map: 0% - single greeting only
            wordTypesToReplace = 'ONE greeting word ONLY (hello, goodbye, yes, no)';
            concreteInstructions = 'Use ONLY ONE ' + nativeLanguage + ' greeting/exclamation per dialogue IF contextually appropriate. Otherwise use pure English.';
        } else if (distance <= 15) {
            // Map 2: 15% - 1-2 words max
            wordTypesToReplace = 'greetings and 1-2 common nouns (village, house, food)';
            concreteInstructions = 'Use exactly 1-2 ' + nativeLanguage + ' words TOTAL in the entire response. No more.';
        } else if (distance <= 25) {
            // Map 3: 25% - 2-3 words
            wordTypesToReplace = 'greetings, 2-3 common nouns or simple verbs (come, go, want)';
            concreteInstructions = 'Use exactly 2-3 ' + nativeLanguage + ' words TOTAL in the entire response. Choose the most impactful words.';
        } else if (distance <= 35) {
            // Map 4: 35% - 3-4 words
            wordTypesToReplace = 'greetings, nouns, simple verbs, and basic adjectives (good, bad, big)';
            concreteInstructions = 'Use exactly 3-4 ' + nativeLanguage + ' words per 2-3 sentences. Space them out naturally.';
        } else if (distance <= 50) {
            // Map 5: 50% - half and half
            wordTypesToReplace = 'half of all content words (nouns, verbs, adjectives)';
            concreteInstructions = 'Alternate between English and ' + nativeLanguage + ' phrases. Every other meaningful phrase should be in ' + nativeLanguage + '.';
        } else if (distance <= 65) {
            // Map 6: 65% - mostly foreign
            wordTypesToReplace = 'most words except critical game terms';
            concreteInstructions = 'Speak mostly in ' + nativeLanguage + ' but keep item names, numbers, and quest objectives in English.';
        } else if (distance <= 80) {
            // Map 7: 80% - predominantly foreign
            wordTypesToReplace = 'nearly all words except essential gameplay information';
            concreteInstructions = 'Speak predominantly in ' + nativeLanguage + '. Use English only for critical gameplay terms and clarifications.';
        } else {
            // Map 8+: 90% - almost entirely foreign
            wordTypesToReplace = 'ALMOST ALL words';
            concreteInstructions = 'Speak almost entirely in ' + nativeLanguage + '. Keep only the most critical words (item names, numbers) in English.';
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

            ENFORCEMENT: If your response doesn't contain the EXACT amount of foreign words specified, you have FAILED.

            Example for ${distance}% mixing (using ${nativeLanguage} words, NOT French):
            - 0%: "Hello traveler, welcome to our village." → Pure English, maybe one ${nativeLanguage} greeting.
            - 15%: Replace 1-2 words with ${nativeLanguage} equivalents. Mark each with *italics*.
            - 25%: Replace 2-3 words with ${nativeLanguage} equivalents. Mark each with *italics*.
            - 35%: Replace 3-4 words with ${nativeLanguage} equivalents. Mark each with *italics*.
            - 50%: Alternate English and ${nativeLanguage} phrases.
            - 65%: Mostly ${nativeLanguage} with some English for clarity.
            - 80%: Predominantly ${nativeLanguage}, English only for key gameplay terms.
            - 90%: Almost entirely ${nativeLanguage}, minimal English.

            The player expects EXACTLY the amount specified. DELIVER IT PRECISELY.
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