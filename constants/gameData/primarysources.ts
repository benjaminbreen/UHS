

import { HistoricalEra, CulturalZone, PrimarySource } from '../../types';

export interface PrimarySourceData {
    byContext?: Partial<Record<CulturalZone, Partial<Record<HistoricalEra, PrimarySource[]>>>>;
    byReligion?: Partial<Record<string, PrimarySource[]>>;
    byKeyword?: Partial<Record<string, PrimarySource[]>>;
}

export const PRIMARY_SOURCES_DATA: PrimarySourceData = {
    byContext: {
        EUROPEAN: {
            [HistoricalEra.MEDIEVAL]: [
                {
                    title: "The Anglo-Saxon Chronicle",
                    author: "Anonymous Monks",
                    year: 900,
                    excerpt: "A.D. 900. This year Alfred, son of Ethelwulf, died, six nights before the mass of All Saints. He was king over the whole English nation, except that part which was under the power of the Danes."
                }
            ],
            [HistoricalEra.RENAISSANCE_EARLY_MODERN]: [
                {
                    title: "The Prince",
                    author: "Niccolò Machiavelli",
                    year: 1513,
                    excerpt: "Hence it is necessary for a prince wishing to hold his own to know how to do wrong, and to make use of it or not according to necessity."
                }
            ]
        }
    },
    byReligion: {
        'Roman Catholicism': [
            {
                title: "Summa Theologica",
                author: "Thomas Aquinas",
                year: 1274,
                excerpt: "To know that God exists in a general and confused way is implanted in us by nature, inasmuch as God is man's beatitude. For man naturally desires happiness, and what is naturally desired by man must be naturally known to him."
            }
        ]
    },
    byKeyword: {
        'SpiceHarvester': [
            {
                title: "The Travels of Marco Polo",
                author: "Marco Polo",
                year: 1300,
                excerpt: "The inhabitants of this island are idolaters... they have spices and precious stones in great abundance. The pepper grows in no other part of the world but this, and is of two sorts, the one white, like snow, and the other black."
            }
        ],
        'blacksmith': [
            {
                title: "De re metallico",
                author: "Georgius Agricola",
                year: 1556,
                excerpt: "For the smith first softens the iron in the fire and then, by the blows of the hammer, he is able to form it into any shape he may desire. It is in this way that he makes tools, weapons, and other objects of iron."
            }
        ]
    }
};