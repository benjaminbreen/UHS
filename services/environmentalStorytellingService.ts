import { CulturalZone, HistoricalEra } from '../types';

export interface EnvironmentalDiscovery {
    title: string;
    description: string;
    category: 'architecture' | 'mural' | 'evidence' | 'inscription' | 'artifact';
}

// Generate culturally and historically accurate environmental discoveries
export const generateEnvironmentalDiscovery = (
    type: 'architecture' | 'mural' | 'evidence' | 'inscription' | 'artifact',
    culturalZone: CulturalZone,
    era: HistoricalEra
): EnvironmentalDiscovery => {
    const discoveries = {
        architecture: {
            EUROPEAN: {
                MEDIEVAL: [
                    {
                        title: 'Romanesque Archway',
                        description: 'A semi-circular arch displays thick walls and small windows characteristic of 12th-century Romanesque architecture. Masterfully fitted stones bear visible mason\'s marks - each craftsman\'s signature carved into the keystone. This construction technique spread from monasteries across medieval Europe.'
                    },
                    {
                        title: 'Gothic Ribbed Vault',
                        description: 'Delicate stone ribs fan across the ceiling meeting at ornate boss carvings. This Gothic innovation (1100s onwards) allowed taller spaces with thinner walls than earlier Romanesque styles. The skeletal structure redirects weight to exterior buttresses, freeing walls for stained glass.'
                    },
                    {
                        title: 'Cloister Columns',
                        description: 'Paired columns with intricately carved capitals line what was once a peaceful cloister walk. Each capital tells a story: biblical scenes, local flora, even playful gargoyles. Monks would have paced these arcades in contemplative silence, prayer books in hand.'
                    }
                ],
                ANTIQUITY: [
                    {
                        title: 'Roman Hypocaust',
                        description: 'Beneath the floor lie remains of a hypocaust - ancient underfloor heating. Hot air from a furnace circulated through raised tiles, warming Roman baths and wealthy villas. The slaves who tended the fires are forgotten, but their engineering endures.'
                    },
                    {
                        title: 'Doric Columns',
                        description: 'Massive fluted columns rise with simple, unadorned capitals - the Doric order, oldest of Greek architectural styles. The weathered marble bears faint traces of painted colors. Ancient temples weren\'t pure white but vibrant with reds, blues, and golds.'
                    }
                ]
            },
            MENA: {
                MEDIEVAL: [
                    {
                        title: 'Muqarnas Ceiling',
                        description: 'Honeycomb-like stalactite vaulting - muqarnas - drips from the dome. This distinctively Islamic architectural feature creates an illusion of the ceiling dissolving upward into heaven. Each tiny niche catches light differently, symbolizing divine infinity through geometry.'
                    },
                    {
                        title: 'Mashrabiya Screen',
                        description: 'An intricately carved wooden lattice screen once covered this window. These mashrabiya allowed interior observation while maintaining privacy, and cooled incoming air through evaporation. The geometric precision displays mathematics as art - every angle calculated for both beauty and function.'
                    }
                ],
                ANTIQUITY: [
                    {
                        title: 'Egyptian Lotus Column',
                        description: 'This papyrus-bundle column blooms into a lotus capital - sacred flower of Upper Egypt. Hieroglyphs invoke temple protection spells. Such columns symbolized the primordial marsh from which creation emerged in Egyptian cosmology - architecture embodying creation myths.'
                    }
                ]
            },
            EAST_ASIAN: {
                MEDIEVAL: [
                    {
                        title: 'Dougong Bracket System',
                        description: 'Complex wooden brackets interlock without nails, supporting curved eaves through pure compression. This dougong system, perfected over centuries, allows buildings to flex during earthquakes. Each bracket cluster is both structural and decorative - engineering indistinguishable from art.'
                    },
                    {
                        title: 'Courtyard Layout',
                        description: 'Ruins reveal a classic siheyuan pattern: four buildings facing an inner courtyard. North building for elders, hierarchical placement reflecting Confucian ideals, family gathered around shared space. Heaven and earth balanced through architectural harmony.'
                    }
                ]
            },
            SOUTH_ASIAN: {
                MEDIEVAL: [
                    {
                        title: 'Jali Screen',
                        description: 'Stone carved so thin it\'s nearly translucent - a jali screen filtering harsh sunlight into dancing patterns. Geometric and floral motifs show both Islamic and Hindu influences typical of Mughal architecture. Each perforation hand-carved with jeweler\'s precision in marble.'
                    }
                ]
            }
        },
        mural: {
            EUROPEAN: {
                MEDIEVAL: [
                    {
                        title: 'Doom Painting',
                        description: 'A faded fresco shows the Last Judgment. Christ enthroned, the dead rising from graves. To his right, saved souls ascend; to his left, demons drag the damned to hell\'s mouth - depicted as a great beast. Such paintings reminded congregations of mortality and moral consequence.'
                    },
                    {
                        title: 'Battle Scene',
                        description: 'Though deteriorated, you discern armored knights, Norman kite shields, perhaps an arrow striking a crowned figure. This may commemorate a historical battle - history recorded not in text but in pigment and plaster, propaganda made permanent.'
                    }
                ],
                ANTIQUITY: [
                    {
                        title: 'Roman Triumph',
                        description: 'A grand procession: victorious general in purple toga, chained prisoners, soldiers bearing eagle-topped standards. This celebrates a triumphus - ultimate Roman honor, where a conquering general paraded through Rome like a god for one day before returning to mortality.'
                    }
                ]
            },
            MENA: {
                MEDIEVAL: [
                    {
                        title: 'Quranic Calligraphy',
                        description: 'Elegant Kufic script flows in bands of gold and lapis lazuli: "In the name of Allah, the Compassionate, the Merciful." Unlike figurative Christian art, Islamic sacred spaces found beauty in the word itself made visible - text as image, prayer as decoration.'
                    }
                ],
                ANTIQUITY: [
                    {
                        title: 'Egyptian Book of the Dead',
                        description: 'Hieroglyphic text with vignettes: Anubis weighing a heart against Ma\'at\'s feather of truth. If balanced, the deceased enters the afterlife; if heavy with sin, Ammit the devourer waits. Every tomb needed these spells for navigating the perilous journey beyond death.'
                    }
                ]
            },
            EAST_ASIAN: {
                MEDIEVAL: [
                    {
                        title: 'Landscape Scroll',
                        description: 'Faded ink painting shows misty mountains, a small pavilion, perhaps a sage in contemplation. The vast emptiness - unpainted silk - is as important as the brushstrokes. This is shan shui: mountain-water painting as philosophical meditation on man\'s place in nature.'
                    }
                ]
            }
        },
        evidence: {
            EUROPEAN: {
                MEDIEVAL: [
                    {
                        title: 'Siege Damage',
                        description: 'Walls bear telltale marks of medieval siege: craters where trebuchet stones struck, blackened stones from Greek fire, holes where sappers undermined foundations. The violence is frozen in stone - you can almost hear the thunder of battering rams and screams of defenders.'
                    },
                    {
                        title: 'Plague Cross',
                        description: 'A crude cross carved into the doorframe with "1349" scratched beside it. This mark indicated a plague house during the Black Death. One-third of Europe died in those years. The families who lived here likely perished the same year this cross was desperately carved.'
                    }
                ],
                ANTIQUITY: [
                    {
                        title: 'Volcanic Ash Layer',
                        description: 'A distinct gray stratum cuts through the ruins - volcanic ash, perhaps from Vesuvius (79 CE) or another eruption. The building was abandoned suddenly, ash preserving everything like a snapshot. Bread still in the oven, coins on the table, life frozen mid-moment.'
                    }
                ]
            },
            MENA: {
                MEDIEVAL: [
                    {
                        title: 'Crusader Graffiti',
                        description: 'Crude Latin crosses and "DEUS VULT" scratched into ancient stonework. Christian crusaders briefly occupied this site, leaving their mark on Islamic architecture. The contrast between elegant Arabic calligraphy and crude Latin vandalism speaks volumes about cultural collision.'
                    }
                ],
                ANTIQUITY: [
                    {
                        title: 'Earthquake Collapse',
                        description: 'Columns toppled in the same direction, walls split along fault lines. A major earthquake brought this structure down - possibly the same tremor that destroyed other regional cities circa 365 CE. Nature itself erased civilizations in moments.'
                    }
                ]
            },
            EAST_ASIAN: {
                MEDIEVAL: [
                    {
                        title: 'Mongol Arrows',
                        description: 'Dozens of arrowheads embedded in wooden beams - distinctive three-bladed Mongol broadheads. This site fell during invasion, perhaps to Genghis Khan\'s armies. The arrows cluster near defensive positions, telling a story of desperate last stands against overwhelming force.'
                    }
                ]
            }
        },
        inscription: {
            EUROPEAN: {
                MEDIEVAL: [
                    {
                        title: 'Latin Funerary Inscription',
                        description: '"HIC IACET ROBERTUS MILES FORTIS ET FIDELIS" - Here lies Robert, strong and faithful knight. Elaborate carved letters would have been inlaid with brass or painted red. Every noble hoped to be remembered thus, their deeds immortalized in stone against oblivion.'
                    }
                ],
                ANTIQUITY: [
                    {
                        title: 'Roman Dedication',
                        description: 'Letters still sharp after centuries: "IMP CAESAR DIVI F AVGVSTVS" - Emperor Caesar Augustus, son of the divine. Every public building proclaimed imperial power and generosity, propaganda carved in marble to outlast empires themselves.'
                    }
                ]
            },
            MENA: {
                MEDIEVAL: [
                    {
                        title: 'Waqf Inscription',
                        description: 'Flowing Arabic declares this building a waqf - religious endowment: "Endowed for scholars and travelers, for Allah\'s sake, by Sultan Muhammad ibn Qalawun, 1330." Islamic law made these charitable trusts inalienable forever - piety made institutional.'
                    }
                ]
            },
            EAST_ASIAN: {
                MEDIEVAL: [
                    {
                        title: 'Confucian Maxim',
                        description: 'Elegant characters carved above the entrance: "修身齊家治國平天下" - Cultivate yourself, regulate your family, govern the state, bring peace to all under heaven. This Confucian ideal guided scholar-officials for two millennia of imperial bureaucracy.'
                    }
                ]
            }
        },
        artifact: {
            EUROPEAN: {
                MEDIEVAL: [
                    {
                        title: 'Pilgrim\'s Badge',
                        description: 'A lead badge depicting Saint James\' scallop shell - symbol of pilgrims to Santiago de Compostela. Thousands traveled across Europe on pilgrimage, buying these badges to prove they completed their holy journey. This one never made it home.'
                    }
                ],
                ANTIQUITY: [
                    {
                        title: 'Roman Oil Lamp',
                        description: 'A clay oil lamp bears the maker\'s stamp: FORTIS. Mass-produced in workshops, these lamps lit Roman homes from Britain to Byzantium. The soot still darkens the nozzle - this lamp burned 2,000 years ago, held in hands now dust.'
                    }
                ]
            },
            MENA: {
                MEDIEVAL: [
                    {
                        title: 'Astrolabe Fragment',
                        description: 'Part of a brass astrolabe, engraved with Arabic numerals and celestial coordinates. Islamic astronomers perfected these instruments for navigation and calculating prayer times. This sophisticated technology wouldn\'t reach Europe for centuries - knowledge flowing from Baghdad westward.'
                    }
                ]
            },
            EAST_ASIAN: {
                MEDIEVAL: [
                    {
                        title: 'Celadon Porcelain',
                        description: 'Shards of jade-green celadon glaze - the secret of Chinese potters. This ware was so prized that Arab traders paid its weight in gold. The glaze\'s color comes from iron oxide fired in reduction - alchemy transformed into art, chemistry into beauty.'
                    }
                ]
            }
        }
    };

    const zoneData = discoveries[type][culturalZone];
    if (!zoneData) {
        return {
            title: 'Ancient Fragment',
            description: 'A piece of the past, worn by time and weather. Whatever story it once told has been largely erased.',
            category: type
        };
    }

    const eraKey = era.includes('MEDIEVAL') ? 'MEDIEVAL' :
                   (era.includes('ANTIQUITY') || era === 'ANTIQUITY') ? 'ANTIQUITY' :
                   'MEDIEVAL'; // fallback

    const eraData = zoneData[eraKey as 'MEDIEVAL' | 'ANTIQUITY'];
    if (!eraData || eraData.length === 0) {
        // Fallback to any available era for this zone
        const availableData = Object.values(zoneData).flat();
        if (availableData.length === 0) {
            return {
                title: 'Ancient Fragment',
                description: 'A piece of the past, worn by time and weather.',
                category: type
            };
        }
        const selected = availableData[Math.floor(Math.random() * availableData.length)] as { title: string; description: string };
        return { ...selected, category: type };
    }

    const selected = eraData[Math.floor(Math.random() * eraData.length)];
    return { ...selected, category: type };
};
