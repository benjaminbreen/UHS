/**
 * constants/gameData/speciesData.ts - Climate-specific species data for animals.
 */
import { ClimateType, AnimalSpecies, CulturalZone } from '../../types';

export const SPECIES_DATA: Record<string, Partial<Record<CulturalZone | ClimateType, AnimalSpecies[]>>> = {
    DEER: {
        ['EUROPEAN']: [{ name: 'Red Deer', linnaeanName: 'Cervus elaphus' }, { name: 'Fallow Deer', linnaeanName: 'Dama dama' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'White-Tailed Deer', linnaeanName: 'Odocoileus virginianus' }, { name: 'Mule Deer', linnaeanName: 'Odocoileus hemionus' }],
        ['EAST_ASIAN']: [{ name: 'Sika Deer', linnaeanName: 'Cervus nippon' }],
        ['SOUTH_AMERICAN']: [{ name: 'Pampas Deer', linnaeanName: 'Ozotoceros bezoarticus' }],
        ['SOUTH_ASIAN']: [{ name: 'Sambar', linnaeanName: 'Rusa unicolor' }, { name: 'Chital', linnaeanName: 'Axis axis' }],
    },
    MOOSE: {
        ['EUROPEAN']: [{ name: 'Eurasian Elk', linnaeanName: 'Alces alces alces' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Eastern Moose', linnaeanName: 'Alces alces americana' }],
        ['EAST_ASIAN']: [{ name: 'Siberian Moose', linnaeanName: 'Alces alces cameloides' }],
    },
    WOLF: {
        ['EUROPEAN']: [{ name: 'Eurasian Wolf', linnaeanName: 'Canis lupus lupus' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Gray Wolf', linnaeanName: 'Canis lupus' }],
        ['EAST_ASIAN']: [{ name: 'Tibetan Wolf', linnaeanName: 'Canis lupus chanco' }],
        ['MENA']: [{ name: 'Arabian Wolf', linnaeanName: 'Canis lupus arabs' }],
        ['SOUTH_ASIAN']: [{ name: 'Indian Wolf', linnaeanName: 'Canis lupus pallipes' }],
    },
    BEAR: {
        ['EUROPEAN']: [{ name: 'Eurasian Brown Bear', linnaeanName: 'Ursus arctos arctos' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Grizzly Bear', linnaeanName: 'Ursus arctos horribilis' }, { name: 'American Black Bear', linnaeanName: 'Ursus americanus' }],
        ['EAST_ASIAN']: [{ name: 'Asiatic Black Bear', linnaeanName: 'Ursus thibetanus' }],
        ['SOUTH_ASIAN']: [{ name: 'Sloth Bear', linnaeanName: 'Melursus ursinus' }],
    },
    FOX: {
        ['EUROPEAN']: [{ name: 'Red Fox', linnaeanName: 'Vulpes vulpes' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Arctic Fox', linnaeanName: 'Vulpes lagopus', emoji: '🦊' }, { name: 'Gray Fox', linnaeanName: 'Urocyon cinereoargenteus' }],
        ['EAST_ASIAN']: [{ name: 'Corsac Fox', linnaeanName: 'Vulpes corsac' }],
        ['MENA']: [{ name: 'Fennec Fox', linnaeanName: 'Vulpes zerda' }],
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'Bat-eared Fox', linnaeanName: 'Otocyon megalotis' }],
        ['SOUTH_ASIAN']: [{ name: 'Bengal Fox', linnaeanName: 'Vulpes bengalensis' }],
    },
    BOAR: {
        ['EUROPEAN']: [{ name: 'Central European Boar', linnaeanName: 'Sus scrofa scrofa' }],
        ['EAST_ASIAN']: [{ name: 'Japanese Boar', linnaeanName: 'Sus scrofa leucomystax' }],
        ['SOUTH_ASIAN']: [{ name: 'Indian Boar', linnaeanName: 'Sus scrofa cristatus' }],
    },
    LION: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'African Lion', linnaeanName: 'Panthera leo' }],
        ['SOUTH_ASIAN']: [{ name: 'Asiatic Lion', linnaeanName: 'Panthera leo persica' }],
    },
    TIGER: {
        ['SOUTH_ASIAN']: [{ name: 'Bengal Tiger', linnaeanName: 'Panthera tigris tigris' }],
        ['EAST_ASIAN']: [{ name: 'Siberian Tiger', linnaeanName: 'Panthera tigris altaica' }, { name: 'South China Tiger', linnaeanName: 'Panthera tigris amoyensis' }],
    },
    LEOPARD: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'African Leopard', linnaeanName: 'Panthera pardus pardus' }],
        ['SOUTH_ASIAN']: [{ name: 'Indian Leopard', linnaeanName: 'Panthera pardus fusca' }],
        ['MENA']: [{ name: 'Persian Leopard', linnaeanName: 'Panthera pardus tulliana' }],
    },
    ELEPHANT: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'African Bush Elephant', linnaeanName: 'Loxodonta africana' }],
        ['SOUTH_ASIAN']: [{ name: 'Asian Elephant', linnaeanName: 'Elephas maximus' }],
    },
    RHINOCEROS: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'White Rhinoceros', linnaeanName: 'Ceratotherium simum' }],
        ['SOUTH_ASIAN']: [{ name: 'Indian Rhinoceros', linnaeanName: 'Rhinoceros unicornis' }],
    },
    HIPPOPOTAMUS: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'Hippopotamus', linnaeanName: 'Hippopotamus amphibius' }],
    },
    GIRAFFE: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'Giraffe', linnaeanName: 'Giraffa camelopardalis' }],
    },
    ZEBRA: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'Plains Zebra', linnaeanName: 'Equus quagga' }],
    },
    GORILLA: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'Gorilla', linnaeanName: 'Gorilla gorilla' }],
    },
    CROCODILE: {
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'Nile Crocodile', linnaeanName: 'Crocodylus niloticus' }],
        ['SOUTH_ASIAN']: [{ name: 'Mugger Crocodile', linnaeanName: 'Crocodylus palustris' }],
        ['OCEANIA']: [{ name: 'Saltwater Crocodile', linnaeanName: 'Crocodylus porosus' }],
        ['SOUTH_AMERICAN']: [{ name: 'Orinoco Crocodile', linnaeanName: 'Crocodylus intermedius' }],
    },
    BISON: {
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Plains Bison', linnaeanName: 'Bison bison bison' }],
    },
    KANGAROO: {
        ['OCEANIA']: [{ name: 'Red Kangaroo', linnaeanName: 'Macropus rufus' }],
    },
    KOALA: {
        ['OCEANIA']: [{ name: 'Koala', linnaeanName: 'Phascolarctos cinereus' }],
    },
    PANDA: {
        ['EAST_ASIAN']: [{ name: 'Giant Panda', linnaeanName: 'Ailuropoda melanoleuca' }],
    },
    WILD_HORSE: {
        ['EAST_ASIAN']: [{ name: "Przewalski's Horse", linnaeanName: 'Equus ferus przewalskii' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Mustang', linnaeanName: 'Equus ferus caballus' }],
        ['EUROPEAN']: [{ name: 'Tarpan', linnaeanName: 'Equus ferus ferus' }],
    },
    GOAT: {
        ['EUROPEAN']: [{ name: 'Alpine Ibex', linnaeanName: 'Capra ibex' }],
        ['MENA']: [{ name: 'Nubian Ibex', linnaeanName: 'Capra nubiana' }],
        ['SOUTH_ASIAN']: [{ name: 'Himalayan Tahr', linnaeanName: 'Hemitragus jemlahicus' }],
    },
    EAGLE: {
        ['EUROPEAN']: [{ name: 'Golden Eagle', linnaeanName: 'Aquila chrysaetos' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Bald Eagle', linnaeanName: 'Haliaeetus leucocephalus' }],
        ['SOUTH_AMERICAN']: [{ name: 'Harpy Eagle', linnaeanName: 'Harpia harpyja' }],
        ['MENA']: [{ name: 'Steppe Eagle', linnaeanName: 'Aquila nipalensis' }],
    },
    SNAKE: {
        ['EUROPEAN']: [{ name: 'Common European Adder', linnaeanName: 'Vipera berus' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Timber Rattlesnake', linnaeanName: 'Crotalus horridus' }],
        ['SOUTH_AMERICAN']: [{ name: 'Green Anaconda', linnaeanName: 'Eunectes murinus' }],
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'Black Mamba', linnaeanName: 'Dendroaspis polylepis' }],
        ['SOUTH_ASIAN']: [{ name: 'King Cobra', linnaeanName: 'Ophiophagus hannah' }],
        ['MENA']: [{ name: 'Saw-scaled Viper', linnaeanName: 'Echis carinatus' }],
    },
    MONKEY: {
        ['SOUTH_AMERICAN']: [{ name: 'Howler Monkey', linnaeanName: 'Alouatta' }, { name: 'Spider Monkey', linnaeanName: 'Ateles' }],
        ['SUB_SAHARAN_AFRICAN']: [{ name: 'Vervet Monkey', linnaeanName: 'Chlorocebus pygerythrus' }, { name: 'Baboon', linnaeanName: 'Papio', emoji: '🐒' }],
        ['EAST_ASIAN']: [{ name: 'Japanese Macaque', linnaeanName: 'Macaca fuscata' }],
        ['SOUTH_ASIAN']: [{ name: 'Rhesus Macaque', linnaeanName: 'Macaca mulatta' }],
    },
    WHALE: {
        ['EUROPEAN']: [{ name: 'Humpback Whale', linnaeanName: 'Megaptera novaeangliae' }],
        ['NORTH_AMERICAN_PRE_COLUMBIAN']: [{ name: 'Gray Whale', linnaeanName: 'Eschrichtius robustus' }, { name: 'Bowhead Whale', linnaeanName: 'Balaena mysticetus' }],
        ['SOUTH_AMERICAN']: [{ name: 'Southern Right Whale', linnaeanName: 'Eubalaena australis' }],
        ['OCEANIA']: [{ name: 'Blue Whale', linnaeanName: 'Balaenoptera musculus' }],
    },
    FISH: {
        [ClimateType.TEMPERATE]: [{ name: 'Rainbow Trout', linnaeanName: 'Oncorhynchus mykiss' }, { name: 'Common Carp', linnaeanName: 'Cyprinus carpio' }],
        [ClimateType.COLD]: [{ name: 'Arctic Char', linnaeanName: 'Salvelinus alpinus' }, { name: 'Atlantic Cod', linnaeanName: 'Gadus morhua' }],
        [ClimateType.TROPICAL]: [{ name: 'Piranha', linnaeanName: 'Pygocentrus nattereri' }],
        [ClimateType.SEMITROPICAL]: [{ name: 'Giant Barb', linnaeanName: 'Catlocarpio siamensis' }],
        [ClimateType.ARID]: [{ name: 'Desert Pupfish', linnaeanName: 'Cyprinodon macularius' }]
    },
    JELLYFISH: {
        [ClimateType.TEMPERATE]: [{ name: 'Moon Jellyfish', linnaeanName: 'Aurelia aurita' }],
        [ClimateType.COLD]: [{ name: "Lion's Mane Jellyfish", linnaeanName: 'Cyanea capillata' }],
        [ClimateType.TROPICAL]: [{ name: 'Box Jellyfish', linnaeanName: 'Cubozoa' }],
        [ClimateType.SEMITROPICAL]: [{ name: 'Box Jellyfish', linnaeanName: 'Cubozoa' }],
        [ClimateType.ARID]: [{ name: 'Upside-Down Jellyfish', linnaeanName: 'Cassiopea' }],
    },
    FLOTSAM: {
        [ClimateType.TEMPERATE]: [{ name: 'Floating Crate', linnaeanName: 'Res naufragii', emoji: '📦' }],
        [ClimateType.COLD]: [{ name: 'Icy Debris', linnaeanName: 'Res naufragii glacialis', emoji: '🧊' }],
        [ClimateType.TROPICAL]: [{ name: 'Driftwood Raft', linnaeanName: 'Res naufragii tropicus', emoji: '🪵' }],
        [ClimateType.SEMITROPICAL]: [{ name: 'Sodden Barrel', linnaeanName: 'Res naufragii dolium', emoji: '🛢️' }],
        [ClimateType.ARID]: [{ name: 'Sun-bleached Timber', linnaeanName: 'Res naufragii aridus', emoji: '🪵' }],
    },
    CHICKEN: {
        ['EUROPEAN']: [{ name: 'Leghorn', linnaeanName: 'Gallus gallus domesticus' }, { name: 'Rhode Island Red', linnaeanName: 'Gallus gallus domesticus' }],
        ['EAST_ASIAN']: [{ name: 'Silkie', linnaeanName: 'Gallus gallus domesticus' }],
        ['SOUTH_ASIAN']: [{ name: 'Asil', linnaeanName: 'Gallus gallus domesticus' }],
    },
};