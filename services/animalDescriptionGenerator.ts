/**
 * services/animalDescriptionGenerator.ts - Procedural description generator for animals.
 */
import { AnimalEntity, AnimalSpecies } from '../types';
import { ANIMAL_DATA } from '../constants/index';

type AdjectivePool = { low: string[]; mid: string[]; high: string[] };
type SentencePool = AdjectivePool;

// --- ADJECTIVE & SENTENCE POOLS ---

const ageAdjectives: AdjectivePool = { low: ['young', 'spry', 'youthful'], mid: ['mature', 'adult'], high: ['old', 'aging', 'weathered', 'elderly'] };
const speedAdjectives: AdjectivePool = { low: ['lethargic', 'plodding', 'sluggish', 'ponderous', 'slow'], mid: ['steady', 'unhurried', 'calm'], high: ['quick', 'spry', 'fleet-footed', 'lively', 'swift', 'jittery'] };
const strengthAdjectives: AdjectivePool = { low: ['weak', 'delicate', 'frail'], mid: ['stout', 'sturdy', 'average'], high: ['powerful', 'burly', 'musclebound', 'hulking', 'massive'] };
const agilityAdjectives: AdjectivePool = { low: ['clumsy', 'ponderous', 'awkward'], mid: ['measured', 'deliberate'], high: ['agile', 'graceful', 'nimble', 'lively'] };
const perceptionAdjectives: AdjectivePool = { low: ['oblivious', 'dull-eyed', 'vacant'], mid: ['observant', 'watchful'], high: ['sharp-eyed', 'keen', 'alert', 'attentive', 'wary'] };
const constitutionAdjectives: AdjectivePool = { low: ['frail', 'gaunt', 'weak'], mid: ['healthy', 'sturdy', 'hardy'], high: ['resilient', 'tough', 'robust', 'vigorous'] };
const aggressionAdjectives: AdjectivePool = { low: ['timid', 'unassertive', 'passive'], mid: ['bold', 'confident'], high: ['aggressive', 'fierce', 'predatory', 'hostile'] };

const ageSentences: SentencePool = { low: ["It has the boundless energy of youth.", "It is a young specimen."], mid: ["It appears to be a mature adult.", "It is in its prime."], high: ["It is well past its prime.", "Its age is betrayed by its weathered appearance.", "This is an elderly creature."] };
const speedSentences: SentencePool = { low: ["Its movements are slow and ponderous.", "It moves with considerable effort."], mid: ["It moves with a steady, unhurried gait."], high: ["It is constantly in motion.", "It moves with a nervous energy, quick to react."] };
const strengthSentences: SentencePool = { low: ["It seems weak and delicate.", "It has a frail build."], mid: ["It possesses an average build for its kind."], high: ["Its powerful frame is evident in its every move.", "It is powerfully built."] };
const agilitySentences: SentencePool = { low: ["Its movements are somewhat clumsy.", "It lacks grace in its motion."], mid: ["It moves with deliberate, measured steps."], high: ["It moves with a fluid, predatory grace.", "It seems nimble and light on its feet."] };
const perceptionSentences: SentencePool = { low: ["It rarely seems to notice its surroundings.", "It has a dull, vacant gaze."], mid: ["It is watchful of its surroundings."], high: ["Its eyes are keen and alert, missing nothing.", "It is highly aware of its environment, ears twitching at every sound."] };
const constitutionSentences: SentencePool = { low: ["It looks unwell and gaunt.", "It appears to be in poor health."], mid: ["It seems to be a hardy and healthy individual."], high: ["Its robust frame suggests it is very resilient.", "It has a vigorous and tough constitution."] };
const aggressionSentences: SentencePool = { low: ["It seems unaggressive and placid.", "It has a timid and unassertive nature."], mid: ["It carries itself with a bold confidence."], high: ["Its posture is aggressive and hostile.", "It has a fierce, predatory look in its eyes."] };
const domesticSentences = { true: ["Years of domestication have left it gentle and unassertive.", "As a domestic animal, it is friendly and curious.", "It clearly thrives under human care."], false: ["Years in the wild have honed its muscles and senses for survival.", "It is wary and alert to any potential threat.", "It always seems ready to bolt."] };


// --- GENERATOR LOGIC ---

export function generateAnimalDescriptions(animal: AnimalEntity): { short: string; long: string } {
    const { baseId, age, isDomestic, stats, speciesName } = animal;
    const animalData = ANIMAL_DATA[baseId];
    const animalName = speciesName.toLowerCase();

    // Deterministic seeded random number generator based on the animal's unique ID and stats.
    let seed = parseInt(animal.id.replace(/\D/g, ''), 10);
    Object.values(stats).forEach(val => { seed += val; });
    seed += age;
     const seededRandom = () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };

    const getRandomFromPool = (pool: AdjectivePool, value: number) => {
        const category = value > 7 ? 'high' : value > 4 ? 'mid' : 'low';
        const list = pool[category];
        return list[Math.floor(seededRandom() * list.length)];
    };
    
    // Short description
    const shortDesc = `${getRandomFromPool(aggressionAdjectives, animalData.attack)} ${animalName}`;

    // Long description
    const sentences = [];
    sentences.push(getRandomFromPool(ageSentences, age > 20 ? 8 : age > 5 ? 5 : 2));
    sentences.push(getRandomFromPool(strengthSentences, stats.strength));
    sentences.push(getRandomFromPool(perceptionSentences, stats.perception));
    sentences.push(getRandomFromPool(constitutionSentences, stats.strength));
    sentences.push(getRandomFromPool(agilitySentences, stats.agility));
    sentences.push(domesticSentences[String(isDomestic) as keyof typeof domesticSentences]);

    const longDescription = [...new Set(sentences)].join(' ');

    return { short: shortDesc, long: longDescription };
}