/**
 * constants/studyActions.ts - Configuration for Study actions
 */
import { StudyAction } from '../types/studyTypes';

export const STUDY_ACTIONS: StudyAction[] = [
  // Analytical Actions (Educational/Historical Mode)
  {
    id: 'examine',
    name: 'Examine',
    emoji: '🔍',
    prompt: 'What specific detail catches your attention? Describe it carefully.',
    category: 'analytical',
    minInputLength: 20,
    exampleInput: 'The worn edges suggest frequent use...'
  },
  {
    id: 'question',
    name: 'Question',
    emoji: '❓',
    prompt: 'What question does this raise for you?',
    category: 'analytical',
    minInputLength: 15,
    exampleInput: 'Why would someone carry this so far from home?'
  },
  {
    id: 'compare',
    name: 'Compare',
    emoji: '⚖️',
    prompt: 'What does this remind you of and why?',
    category: 'analytical',
    minInputLength: 20,
    exampleInput: 'This reminds me of modern tools because...'
  },
  {
    id: 'theorize',
    name: 'Theorize',
    emoji: '💭',
    prompt: 'What do you think this tells us about its creators or users?',
    category: 'analytical',
    minInputLength: 25,
    exampleInput: 'The craftsmanship suggests these people valued...'
  },
  {
    id: 'contextualize',
    name: 'Contextualize',
    emoji: '🌍',
    prompt: 'How might this fit into daily life of the period?',
    category: 'analytical',
    minInputLength: 25,
    exampleInput: 'In daily life, this would have been used when...'
  },

  // Creative Actions (Future Creative Mode)
  {
    id: 'reimagine',
    name: 'Reimagine',
    emoji: '✨',
    prompt: 'How would you transform or repurpose this?',
    category: 'creative',
    minInputLength: 20,
    exampleInput: 'I would transform this into...'
  },
  {
    id: 'narrate',
    name: 'Narrate',
    emoji: '📖',
    prompt: 'Tell a brief story involving this object or creature.',
    category: 'creative',
    minInputLength: 30,
    exampleInput: 'The merchant clutched the worn leather pouch...'
  },
  {
    id: 'poeticize',
    name: 'Poeticize',
    emoji: '🎭',
    prompt: 'Describe this in metaphorical or poetic language.',
    category: 'creative',
    minInputLength: 20,
    exampleInput: 'Like a whisper from ancient hands...'
  },
  {
    id: 'dramatize',
    name: 'Dramatize',
    emoji: '🎬',
    prompt: 'Write a dialogue between two people about this.',
    category: 'creative',
    minInputLength: 30,
    exampleInput: '"Have you ever seen such craftsmanship?" she asked...'
  },
  {
    id: 'celebrate',
    name: 'Celebrate',
    emoji: '🎉',
    prompt: 'Express what you find remarkable or beautiful about this.',
    category: 'creative',
    minInputLength: 20,
    exampleInput: 'What strikes me as beautiful is...'
  }
];

// Mode-specific filtering
export const getActionsForMode = (mode: 'study' | 'creative'): StudyAction[] => {
  if (mode === 'creative') {
    return STUDY_ACTIONS.filter(a => a.category === 'creative');
  }
  return STUDY_ACTIONS.filter(a => a.category === 'analytical');
};

// Get action by ID
export const getActionById = (id: string): StudyAction | undefined => {
  return STUDY_ACTIONS.find(action => action.id === id);
};