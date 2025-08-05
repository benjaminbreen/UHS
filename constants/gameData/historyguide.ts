import { HistoricalEra, CulturalZone } from '../../types';

export const HISTORY_GUIDE_DATA: Record<CulturalZone, Partial<Record<HistoricalEra, string>>> = {
    EUROPEAN: {
        [HistoricalEra.PREHISTORY]: "This is an age of stone and survival, long before the rise of empires. Hunter-gatherer tribes roam vast, untamed forests, their lives dictated by the seasons and the migrations of great beasts.",
        [HistoricalEra.ANTIQUITY]: "The might of the Roman Empire dominates the known world, bringing unparalleled order and engineering marvels. Legions march on stone roads, and classical philosophy and law shape the foundations of Western civilization.",
        [HistoricalEra.MEDIEVAL]: "In the shadow of Rome's fall, feudal kingdoms arise, defined by the code of chivalry and the power of the Catholic Church. Great castles dot the landscape, and crusading zeal sends knights to distant lands.",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "A rebirth of art and science sweeps across the continent, challenging old dogmas and giving rise to powerful merchant city-states. It is an age of exploration, as ships set sail to chart the unknown corners of the globe.",
        [HistoricalEra.INDUSTRIAL_ERA]: "The smoke of industry heralds a new era of steam power, railways, and sprawling factories that transform society. Great empires, fueled by this new might, compete for resources and colonies across the world.",
        [HistoricalEra.MODERN_ERA]: "The 20th century is a time of unprecedented conflict and technological advancement, marked by world wars and the clash of ideologies. Nations grapple with the challenges of a globalized world and the dawn of the atomic age."
    },
    EAST_ASIAN: {
        [HistoricalEra.ANTIQUITY]: "Great dynasties establish vast, unified empires founded on sophisticated bureaucracy and Confucian ideals. This is a classical age of philosophy, monumental construction like the Great Wall, and the establishment of the Silk Road.",
        [HistoricalEra.MEDIEVAL]: "This era is a golden age of culture, invention, and cosmopolitanism, with grand capitals that are the largest cities in the world. Buddhism flourishes alongside native traditions, and innovations like gunpowder and printing press spread.",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "Powerful dynasties restore native rule, looking inward to perfect their culture while launching epic naval expeditions. It is a period of grand imperial projects, flourishing arts, and initial, cautious contact with European traders.",
        [HistoricalEra.INDUSTRIAL_ERA]: "Ancient empires face immense internal pressure and the aggressive expansion of Western industrial powers. This is a tumultuous period of unequal treaties, rebellions, and the start of a painful process of modernization.",
        [HistoricalEra.MODERN_ERA]: "The region is wracked by revolution, war, and the clash between traditionalism and radical new ideologies. Nations struggle for independence and embark on paths of rapid industrialization and political transformation."
    },
    MENA: {
        [HistoricalEra.ANTIQUITY]: "This is the era of great Near Eastern empires like Persia, which clash with the Hellenistic world for dominance. Ancient religions like Zoroastrianism hold sway, while vast trade networks connect the Mediterranean to India.",
        [HistoricalEra.MEDIEVAL]: "The rise of Islam transforms the region, creating a vast and powerful Caliphate that becomes the center of a golden age of science, mathematics, and philosophy. Great cities like Baghdad and Cairo become the world's leading centers of knowledge.",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "Massive gunpowder empires, most notably the Ottoman Empire, dominate the political landscape, controlling the nexus of trade between three continents. These powerful states are centers of Islamic art, architecture, and military innovation.",
        [HistoricalEra.INDUSTRIAL_ERA]: "The once-mighty empires enter a period of decline, struggling to modernize in the face of growing European economic and military pressure. The construction of canals and railways makes the region a focal point of global strategic competition.",
        [HistoricalEra.MODERN_ERA]: "The collapse of old empires gives rise to new nation-states, and the discovery of vast oil reserves radically reshapes the region's destiny. This era is defined by struggles for independence, political turmoil, and rapid modernization."
    },
    SOUTH_ASIAN: {
        [HistoricalEra.ANTIQUITY]: "Great empires emerge on the subcontinent, fostering the growth of Hinduism and Buddhism and creating a classical age of Indian civilization. It is a period of remarkable achievements in mathematics, astronomy, and philosophy.",
        [HistoricalEra.MEDIEVAL]: "The arrival of Islam leads to the rise of powerful Sultanates, creating a unique synthesis of Hindu and Islamic cultures. This era sees the construction of magnificent temples and mosques, alongside intense political competition.",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "The Mughal Empire unifies most of the subcontinent, creating a period of unparalleled wealth, artistic splendor, and architectural marvels. Trade with European powers begins to flourish along the coasts.",
        [HistoricalEra.INDUSTRIAL_ERA]: "The decline of the Mughal Empire allows European trading companies, particularly the British, to gain dominance, eventually leading to direct colonial rule. India becomes the 'jewel in the crown' of the British Empire, its economy reshaped to serve imperial interests.",
        [HistoricalEra.MODERN_ERA]: "A powerful independence movement rises to challenge colonial rule, ultimately leading to the creation of new nations. The subcontinent grapples with the legacy of colonialism while emerging as a major player on the world stage."
    },
    SUB_SAHARAN_AFRICAN: {
        [HistoricalEra.ANTIQUITY]: "This is an era of great migrations and technological diffusion, as Bantu-speaking peoples spread iron-working and agriculture across the continent. Great kingdoms, like Aksum in the east, rise to prominence through trade.",
        [HistoricalEra.MEDIEVAL]: "Powerful empires rise in the Sahel, their wealth built on the trans-Saharan trade in gold and salt. Along the coasts, sophisticated city-states engage in maritime commerce across the Indian Ocean.",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "Great inland empires and coastal kingdoms flourish, but the beginning of the transatlantic slave trade introduces a period of immense upheaval and suffering. European powers establish coastal forts but have limited influence in the interior.",
        [HistoricalEra.INDUSTRIAL_ERA]: "The 'Scramble for Africa' leads to the rapid conquest and partition of the continent by European industrial powers. Colonial rule is established to extract resources, profoundly disrupting traditional societies and economies.",
        [HistoricalEra.MODERN_ERA]: "A wave of independence movements sweeps across the continent, leading to the end of colonial rule. Newly independent nations work to build modern states while navigating the complex legacies of their colonial past."
    },
    NORTH_AMERICAN_PRE_COLUMBIAN: {
        [HistoricalEra.ANTIQUITY]: "This is a time of mound-building cultures in the river valleys and the rise of agricultural societies in the Southwest. Complex trade networks span the continent, connecting diverse peoples and cultures.",
        [HistoricalEra.MEDIEVAL]: "Great civilizations flourish, from the cliff-dwellers of the Southwest to the vast city of Cahokia on the Mississippi. It is an era of sophisticated agriculture, complex chiefdoms, and monumental construction.",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "Powerful confederacies like the Iroquois and Creek dominate their regions, while the introduction of the horse transforms life on the Great Plains. This is the state of the continent just before widespread European contact begins to alter it forever.",
        [HistoricalEra.INDUSTRIAL_ERA]: "This period sees the dramatic and often tragic consequences of westward expansion by the United States. Native peoples are displaced as railroads, homesteads, and reservations transform the landscape and their way of life.",
        [HistoricalEra.MODERN_ERA]: "Native American nations work to assert their sovereignty and preserve their cultural heritage within the framework of modern states. This is an era of cultural revitalization, legal battles for rights, and the ongoing struggle for self-determination."
    },
     NORTH_AMERICAN_COLONIAL: {
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "European powers establish their first fragile footholds on the continent, leading to complex interactions of trade, conflict, and disease with Native American nations. It is a time of cultural exchange and the violent birth of new colonial societies.",
        [HistoricalEra.INDUSTRIAL_ERA]: "The young United States expands westward, fueled by ideals of 'Manifest Destiny' and the power of the Industrial Revolution. This era is defined by the displacement of native peoples, the tragedy of the Civil War, and the rise of America as a continental power.",
        [HistoricalEra.MODERN_ERA]: "The United States emerges as a global superpower, its growth fueled by industrial might and waves of immigration. The 20th century is marked by involvement in world wars, the struggle for civil rights, and technological innovation that reshapes the world."
    },
    SOUTH_AMERICAN: {
        [HistoricalEra.ANTIQUITY]: "Great civilizations rise in the Andes, mastering high-altitude agriculture and creating stunning works of art and engineering. Along the coasts and in the Amazon, diverse cultures develop unique adaptations to their environments.",
        [HistoricalEra.MEDIEVAL]: "Large regional empires and sophisticated chiefdoms flourish, from the coastal cities of the Chimú to the complex societies of the Amazon. This is a period of significant population growth and cultural development across the continent.",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "The vast and highly organized Inca Empire dominates the Andes, connecting its territories with an extensive road network. This powerful empire is brought to a sudden, violent end by the arrival of Spanish conquistadors.",
        [HistoricalEra.INDUSTRIAL_ERA]: "Following centuries of Spanish and Portuguese colonial rule, the nations of South America fight for and win their independence. The 19th century is a tumultuous period of nation-building, civil wars, and economic transformation driven by the export of raw materials.",
        [HistoricalEra.MODERN_ERA]: "South American nations navigate the complexities of the 20th century, experiencing political instability, rapid urbanization, and struggles for social and economic justice. They emerge as vibrant, culturally rich nations on the global stage."
    },
    OCEANIA: {
        [HistoricalEra.ANTIQUITY]: "This is the age of the great Austronesian expansion, as master navigators settle the vast expanse of the Pacific Ocean. On the continent of Australia, Aboriginal peoples continue to maintain the world's oldest living cultures.",
        [HistoricalEra.MEDIEVAL]: "Complex societies develop on the larger islands of Polynesia, marked by the construction of monumental ceremonial sites and the rise of powerful chiefdoms. In Australia, intricate trade and ceremonial networks connect peoples across the continent.",
        [HistoricalEra.RENAISSANCE_EARLY_MODERN]: "Polynesian and Melanesian societies are at their zenith, while Aboriginal Australia remains isolated from the rest of the world. The first encounters with European explorers begin to occur in the final years of this period.",
        [HistoricalEra.INDUSTRIAL_ERA]: "European colonization profoundly transforms the region, establishing settler colonies in Australia and New Zealand and plantations on many Pacific islands. This period brings new technologies and devastating diseases, forever altering the lives of indigenous peoples.",
        [HistoricalEra.MODERN_ERA]: "The islands of the Pacific move from colonial rule to independence, while Australia and New Zealand develop into modern, multicultural nations. Indigenous peoples across the region fight for their rights and the preservation of their unique cultures."
    },
};
