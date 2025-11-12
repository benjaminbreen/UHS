import { ExpeditionCard } from '../../generation/ruins/data';

export interface ExpeditionCardState {
    card: ExpeditionCard;
    unlocked: boolean;
    used: boolean;
}

export interface KnowledgeState {
    score: number;
    tags: string[];
}

export interface ActiveCardEffects {
    revealRoom: boolean;
    translationBoost: boolean;
    combatAdvantage: boolean;
}
