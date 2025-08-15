/**
 * services/encounterService.ts - Logic for generating encounter dialogue.
 */
import { GoogleGenAI } from "@google/genai";
import { AnimalEntity, NpcEntity, DialogueEntry, PlayerContext, PlayerCharacter, MapData } from '../types';
import { generateEncounterDialogue as generateLlmDialogue } from './llmService';

type EncounterableEntity = AnimalEntity | NpcEntity;

/**
 * Main entry point for generating encounter dialogue.
 * Dispatches to the correct generator based on the target type.
 */
export function generateEncounterDialogue(
    target: EncounterableEntity,
    history: DialogueEntry[] | string[],
    playerInput: string,
    playerCharacter: PlayerCharacter,
    allNpcs: NpcEntity[],
    mapData: MapData | null,
    useRealLanguage: boolean
): Promise<{ text: string, reputationChange?: number, shouldLeave?: boolean, shouldAttack?: boolean }> {
    return generateLlmDialogue(target, history, playerInput, playerCharacter, allNpcs, mapData, useRealLanguage);
}