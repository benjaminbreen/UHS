# Remaining Event Rewrites (5-15)

This file contains the rewrites for batch implementation.

## 5. renaissance_scientific_instruments

```typescript
{
    id: 'renaissance_scientific_instruments',
    era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
    prompt: "You find astronomical instruments hidden in a hollow column - brass, glass, carefully wrapped. No note, no name. They're valuable and clearly concealed recently. You hear footsteps approaching.",
    choices: [
        {
            text: "Hide and see who comes",
            outcomes: [
                { chance: 0.4, result: 'knowledge', message: 'A nervous scholar retrieves them. He nods to you without speaking, clearly relieved they\'re safe.', value: 'Silent complicity' },
                { chance: 0.35, result: 'death', message: 'Soldiers searching for contraband arrive. They find you near the hidden instruments. Close enough for suspicion.' },
                { chance: 0.25, result: 'nothing', message: 'You wait for three days. No one comes. Eventually you leave them and move on.' }
            ]
        },
        {
            text: "Take the instruments with you",
            outcomes: [
                { chance: 0.35, result: 'gold_gain', message: 'You sell them to a collector. Good money. You never learn whose they were or why they were hidden.', value: 400 },
                { chance: 0.40, result: 'death', message: 'You\'re caught with banned astronomical equipment. You can\'t explain where you got them without lying.' },
                { chance: 0.25, result: 'item', message: 'The instruments contain observational notes tucked inside. Valuable scientific data.', value: 'OBSERVATION_NOTES' }
            ]
        },
        {
            text: "Leave them but mark the location",
            outcomes: [
                { chance: 0.6, result: 'nothing', message: 'When you return weeks later, they\'re gone. Someone retrieved them safely.' },
                { chance: 0.25, result: 'nothing', message: 'You return to find the column destroyed, instruments smashed. Church investigators found them first.' },
                { chance: 0.15, result: 'knowledge', message: 'Months later, a scholar thanks you. He saw your mark and knew they were safe.', value: 'Grateful contact' }
            ]
        }
    ]
}
```

## 6. renaissance_religious_contraband

```typescript
{
    id: 'renaissance_religious_contraband',
    era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
    prompt: "You find pamphlets hidden under a loose stone. Dense text, cheap paper, recent printing. Someone's footsteps approach quickly.",
    choices: [
        {
            text: "Cover them and act casual",
            outcomes: [
                { chance: 0.4, result: 'knowledge', message: 'A young woman retrieves them, nods thanks, leaves quickly. You say nothing. She says nothing.', value: 'Unspoken understanding' },
                { chance: 0.35, result: 'death', message: 'A priest finds you standing at the cache. Guilt by location. The Inquisition doesn\'t need more evidence.' },
                { chance: 0.25, result: 'nothing', message: 'Soldiers arrive searching. They find the pamphlets. You weren\'t involved - you\'re just here. They tell you to leave.' }
            ]
        },
        {
            text: "Take them to read later",
            outcomes: [
                { chance: 0.4, result: 'knowledge', message: 'You read them. Theological arguments, political grievances. Dangerous to possess. You burn them after reading.', value: 'Religious reform context' },
                { chance: 0.35, result: 'death', message: 'Inquisition officers search you. Finding the pamphlets is enough. Your execution is public.' },
                { chance: 0.25, result: 'item', message: 'Among the pamphlets, a letter reveals a meeting location. You could use this information.', value: 'ENCODED_LETTER' }
            ]
        },
        {
            text: "Leave immediately",
            outcomes: [
                { chance: 0.7, result: 'nothing', message: 'You walk away. Not your business. You hear shouting from that direction an hour later.' },
                { chance: 0.2, result: 'nothing', message: 'Whoever comes retrieves them safely. You never learn who or why.' },
                { chance: 0.1, result: 'item', message: 'In your haste, you knock over a loose stone. Beneath: a coin purse, forgotten.', value: 'COIN_PURSE' }
            ]
        }
    ]
}
```

## 7. renaissance_art_forger

```typescript
{
    id: 'renaissance_art_forger',
    era: HistoricalEra.RENAISSANCE_EARLY_MODERN,
    culturalZones: ['EUROPEAN'],
    prompt: "A man makes rubbings of inscriptions on the ruins. His bag contains several completed copies and what looks like a blank stone ready for carving. He notices you watching. 'I sell these to collectors. They think they're buying pieces of the ruins. I tell them they are.' He shrugs. 'No one gets hurt. The ruins stay intact. Rich men get decorations for their libraries.'",
    choices: [
        {
            text: "Threaten to expose him",
            outcomes: [
                { chance: 0.4, result: 'gold_gain', message: 'He pays you monthly to stay quiet. The arrangement continues for years.', value: 250 },
                { chance: 0.35, result: 'death', message: 'He reports YOU as a forger to authorities first. His word against yours. He has connections.' },
                { chance: 0.25, result: 'nothing', message: 'He laughs. "Who will believe you? I\'ve been doing this for a decade." He\'s right. He continues his work.' }
            ]
        },
        {
            text: "Demand a cut of his profits",
            outcomes: [
                { chance: 0.45, result: 'gold_gain', message: 'He agrees. You profit from forgeries for years. The ruins remain intact, at least.', value: 400 },
                { chance: 0.30, result: 'nothing', message: 'He vanishes and sets up elsewhere. You see his "artifacts" for sale in another city months later.' },
                { chance: 0.25, result: 'gold_loss', message: 'His patron catches you both. Turned out the patron knew they were fakes all along. You pay fines for attempted fraud.', value: 300 }
            ]
        },
        {
            text: "Suggest he make clear copies labeled as reproductions",
            outcomes: [
                { chance: 0.3, result: 'knowledge', message: 'He considers it. "There might be a market for honest copies." He tries it. It works. Others copy the model.', value: 'Honest reproduction trade model' },
                { chance: 0.4, result: 'nothing', message: 'He laughs. "Honest copies? For half the price? You don\'t understand my business." He continues forging.' },
                { chance: 0.3, result: 'gold_loss', message: 'He agrees, but reports you as his competition to keep you away from collectors. You face harassment.', value: 200 }
            ]
        }
    ]
}
```

These rewrites are ready to implement.
